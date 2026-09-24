import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Confirma junto do Stripe que uma marcação foi efectivamente paga.
 *
 * A confirmação nunca parte do que o browser diz: o cliente volta do Stripe
 * com um id de sessão, mas é o Stripe que é consultado, e a sessão tem de
 * pertencer a esta marcação. Sem isso, bastaria a alguém visitar o URL de
 * sucesso para se dar por pago.
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

    // Já confirmado numa visita anterior: o Stripe pode reenviar o cliente
    // para esta página, e reconfirmar não deve alterar nada.
    if (marcacao.payment_status === "paid") return responder({ paid: true });

    // O id de sessão vem do URL, logo é manipulável. Só conta se coincidir
    // com o que ficou guardado ao criar o pagamento.
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
      console.error("verify-payment: sessão não pertence a esta marcação", idSessao);
      return responder({ paid: false, error: "Sessão de pagamento não corresponde" }, 400);
    }

    const { error: erroUpdate } = await supabase
      .from("appointments")
      .update({ payment_status: "paid", status: "confirmed" })
      .eq("id", appointment_id);

    if (erroUpdate) {
      console.error("verify-payment: falha ao marcar como pago", erroUpdate.message);
      return responder({ paid: false, error: "Erro ao registar o pagamento" }, 500);
    }

    return responder({ paid: true });
  } catch (erro) {
    console.error("verify-payment:", erro instanceof Error ? erro.message : erro);
    return responder({ paid: false, error: "Erro ao verificar pagamento" }, 500);
  }
});
