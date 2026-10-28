import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

import { avisarAdministracao, marcarPagaUmaVez } from "./_shared/notificacao.ts";

/**
 * Diz à página de sucesso se a marcação está paga, e confirma-a se ainda não
 * estiver.
 *
 * Desde que existe o webhook do Stripe, este já não é o caminho principal —
 * é o que responde ao browser do cliente, para a página poder mostrar o
 * resumo. Continua a saber confirmar porque chega quase sempre primeiro (o
 * cliente volta ao site em segundos, o webhook demora um pouco mais), e
 * porque se o webhook falhar alguém tem de o fazer.
 *
 * Os dois podem correr ao mesmo tempo; `marcarPagaUmaVez` garante que só um
 * envia o email.
 *
 * A confirmação nunca parte do que o browser diz: o id de sessão vem do URL,
 * mas é o Stripe que é consultado, e a sessão tem de pertencer a esta
 * marcação. Sem isso, bastaria visitar o URL de sucesso para se dar por pago.
 */

const CABECALHOS_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function responder(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CABECALHOS_CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CABECALHOS_CORS });

  try {
    const chaveStripe = Deno.env.get("STRIPE_SECRET_KEY");
    if (!chaveStripe) return responder({ paid: false, error: "Pagamentos não configurados" }, 503);

    const { appointment_id, session_id } = await req.json();
    if (!appointment_id) return responder({ paid: false, error: "appointment_id em falta" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: marcacao } = await supabase
      .from("appointments")
      .select("id, payment_status, stripe_session_id")
      .eq("id", appointment_id)
      .maybeSingle();

    if (!marcacao) return responder({ paid: false, error: "Agendamento não encontrado" }, 404);

    // Já confirmada — pelo webhook, ou por uma visita anterior a esta página.
    if (marcacao.payment_status === "paid") return responder({ paid: true });

    const idSessao = marcacao.stripe_session_id;
    if (!idSessao || (session_id && session_id !== idSessao)) {
      return responder({ paid: false, error: "Sessão de pagamento não corresponde" }, 400);
    }

    const stripe = new Stripe(chaveStripe, { apiVersion: "2024-12-18.acacia" });
    const sessao = await stripe.checkout.sessions.retrieve(idSessao);

    if (sessao.payment_status !== "paid") {
      return responder({ paid: false, error: "Pagamento não confirmado" });
    }

    if (sessao.metadata?.appointment_id !== appointment_id) {
      console.error("[verify-payment] sessão não pertence a esta marcação", idSessao);
      return responder({ paid: false, error: "Sessão de pagamento não corresponde" }, 400);
    }

    const confirmada = await marcarPagaUmaVez(supabase, appointment_id);

    // Sem linha: o webhook chegou primeiro e já avisou. O pagamento está bom,
    // só não é esta chamada que manda o email.
    if (confirmada) await avisarAdministracao(confirmada, "verify-payment");

    return responder({ paid: true });
  } catch (erro) {
    console.error("[verify-payment]", erro instanceof Error ? erro.message : erro);
    return responder({ paid: false, error: "Erro ao verificar pagamento" }, 500);
  }
});
