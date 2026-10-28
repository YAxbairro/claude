import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

import { avisarAdministracao, marcarPagaUmaVez } from "./_shared/notificacao.ts";

/**
 * Ronda periódica: procura marcações que ficaram por confirmar e pergunta ao
 * Stripe se afinal foram pagas.
 *
 * Existe porque a confirmação normal corre no browser do cliente, ao voltar
 * do Stripe. Quem fecha o separador paga sem que o site fique a saber — a
 * marcação fica "pendente" para sempre e ninguém é avisado. Aconteceu aqui:
 * uma consulta paga só foi descoberta depois de já ter passado.
 *
 * Ao contrário de um webhook, isto não precisa de nada configurado do lado de
 * fora: corre sozinha de hora a hora e vai ela perguntar. Em troca, pode
 * demorar até uma hora a dar pela coisa, o que é tempo de sobra para uma
 * consulta marcada com dias de antecedência.
 *
 * Corre sem autenticação de propósito: não altera nada que o Stripe não
 * confirme primeiro, é idempotente, e a resposta não revela quem marcou. Um
 * segredo aqui seria mais uma coisa a guardar sem nada a proteger.
 */

/** Marcações mais antigas do que isto já não vale a pena perseguir. */
const DIAS_PARA_TRAS = 60;

Deno.serve(async (req: Request) => {
  const chaveStripe = Deno.env.get("STRIPE_SECRET_KEY");
  if (!chaveStripe) {
    console.error("[ronda] STRIPE_SECRET_KEY em falta");
    return Response.json({ ok: false, erro: "Stripe não configurado" }, { status: 503 });
  }

  const stripe = new Stripe(chaveStripe, { apiVersion: "2024-12-18.acacia" });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const desde = new Date(Date.now() - DIAS_PARA_TRAS * 86_400_000).toISOString();

  // Só interessam as que chegaram a abrir pagamento: sem sessão do Stripe não
  // há nada a perguntar, é alguém que desistiu antes de pagar.
  const { data: pendentes, error } = await supabase
    .from("appointments")
    .select("id, stripe_session_id, client_name, client_surname")
    .eq("payment_status", "pending")
    .not("stripe_session_id", "is", null)
    .gte("created_at", desde);

  if (error) {
    console.error("[ronda] falha ao ler marcações:", error.message);
    return Response.json({ ok: false, erro: error.message }, { status: 500 });
  }

  const recuperadas: string[] = [];
  let falhas = 0;

  for (const p of pendentes ?? []) {
    try {
      const sessao = await stripe.checkout.sessions.retrieve(p.stripe_session_id!);
      if (sessao.payment_status !== "paid") continue;

      // A sessão tem de pertencer mesmo a esta marcação.
      if (sessao.metadata?.appointment_id !== p.id) {
        console.error("[ronda] sessão não corresponde à marcação", p.id);
        continue;
      }

      // Se outro caminho confirmou entretanto, isto devolve null e não se
      // envia segundo email.
      const confirmada = await marcarPagaUmaVez(supabase, p.id);
      if (!confirmada) continue;

      await avisarAdministracao(confirmada, "ronda");
      recuperadas.push(`${p.client_name} ${p.client_surname}`);
    } catch (erro) {
      // Uma marcação problemática não pode impedir as outras de ser vistas.
      const msg = erro instanceof Error ? erro.message : String(erro);
      console.error(`[ronda] erro em ${p.id}:`, msg);
      falhas += 1;
    }
  }

  if (recuperadas.length) {
    console.log("[ronda] recuperadas:", recuperadas.join(", "));
  }

  // A resposta não leva nomes nem contactos: esta função é chamada sem
  // autenticação, e quem a chamar não tem nada que ficar a saber quem marcou.
  // Os nomes ficam no registo do servidor, acima.
  return Response.json({
    ok: true,
    verificadas: pendentes?.length ?? 0,
    recuperadas: recuperadas.length,
    falhas,
  });
});
