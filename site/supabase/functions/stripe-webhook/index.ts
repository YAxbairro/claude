import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

import { avisarAdministracao, marcarPagaUmaVez } from "./_shared/notificacao.ts";

/**
 * Recebe do Stripe o aviso de que um pagamento se concluiu.
 *
 * Existe porque a página de sucesso não é de confiança: só corre se o cliente
 * voltar ao site depois de pagar. Quem fecha o separador — e muita gente
 * fecha — pagava sem que ninguém ficasse a saber. Já aconteceu aqui.
 *
 * O Stripe fala directamente com esta função, do servidor dele para o nosso,
 * e repete o aviso durante dias se não lhe responderem 200. É esse o caminho
 * que garante que nenhuma marcação paga passa despercebida.
 */

/** Nada aqui é de confiança até a assinatura bater certo. */
async function eventoAutentico(req: Request, corpo: string, stripe: Stripe) {
  const segredo = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!segredo) throw new Error("STRIPE_WEBHOOK_SECRET não está definida");

  const assinatura = req.headers.get("stripe-signature");
  if (!assinatura) throw new Error("pedido sem assinatura");

  // A variante assíncrona é obrigatória em Deno: a síncrona usa um módulo de
  // criptografia do Node que aqui não existe.
  return await stripe.webhooks.constructEventAsync(corpo, assinatura, segredo);
}

Deno.serve(async (req) => {
  const chaveStripe = Deno.env.get("STRIPE_SECRET_KEY");
  if (!chaveStripe) {
    console.error("[webhook] STRIPE_SECRET_KEY em falta");
    return new Response("mal configurado", { status: 503 });
  }

  const stripe = new Stripe(chaveStripe, { apiVersion: "2024-12-18.acacia" });

  // O corpo tem de ser lido em bruto: a assinatura cobre os bytes exactos, e
  // qualquer reserialização por JSON.parse invalidaria a verificação.
  const corpo = await req.text();

  let evento: Stripe.Event;
  try {
    evento = await eventoAutentico(req, corpo, stripe);
  } catch (erro) {
    // 400 e não 500: o Stripe não deve repetir um pedido que nunca vai aceitar.
    console.error("[webhook] assinatura rejeitada:", erro instanceof Error ? erro.message : erro);
    return new Response("assinatura inválida", { status: 400 });
  }

  // Só interessam os eventos que significam dinheiro recebido. Os restantes
  // são confirmados na mesma, senão o Stripe insiste com eles para sempre.
  const INTERESSAM = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
  if (!INTERESSAM.includes(evento.type)) {
    return new Response(JSON.stringify({ ignorado: evento.type }), { status: 200 });
  }

  const sessao = evento.data.object as Stripe.Checkout.Session;

  if (sessao.payment_status !== "paid") {
    return new Response(JSON.stringify({ ignorado: "sessão por pagar" }), { status: 200 });
  }

  const appointmentId = sessao.metadata?.appointment_id;
  if (!appointmentId) {
    console.error("[webhook] sessão sem appointment_id:", sessao.id);
    return new Response(JSON.stringify({ ignorado: "sem appointment_id" }), { status: 200 });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const marcacao = await marcarPagaUmaVez(supabase, appointmentId);

    // Sem linha devolvida: ou a página de sucesso chegou primeiro, ou é o
    // Stripe a repetir um evento que já tratámos. Nos dois casos não há nada
    // a fazer, e sobretudo não há segundo email a enviar.
    if (!marcacao) {
      return new Response(JSON.stringify({ ok: true, nota: "já estava confirmada" }), { status: 200 });
    }

    await avisarAdministracao(marcacao, "webhook");

    return new Response(JSON.stringify({ ok: true, confirmada: appointmentId }), { status: 200 });
  } catch (erro) {
    // 500 faz o Stripe repetir mais tarde, que é o que queremos se a base de
    // dados estiver em baixo: a marcação acaba por ser confirmada à mesma.
    console.error("[webhook] erro ao processar:", erro instanceof Error ? erro.message : erro);
    return new Response("erro ao processar", { status: 500 });
  }
});
