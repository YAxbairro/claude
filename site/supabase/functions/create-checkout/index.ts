import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Cria a sessão de pagamento no Stripe para uma marcação.
 *
 * Esta função é chamada por visitantes sem sessão iniciada — é o passo entre
 * marcar e pagar. O que a protege não é autenticação, mas o facto de operar
 * apenas sobre uma marcação identificada por um UUID impossível de adivinhar,
 * e de recusar qualquer marcação que já não esteja pendente.
 */

const ORIGENS_PERMITIDAS = [
  "https://lutuimaveiga.com",
  "https://www.lutuimaveiga.com",
  "https://project-5xpb7.vercel.app",
  "http://localhost:8080",
  "http://localhost:5173",
];

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
    if (!chaveStripe) {
      console.error("STRIPE_SECRET_KEY não está definida nos segredos do projeto");
      return responder({ error: "Pagamentos ainda não configurados" }, 503);
    }

    const { appointment_id } = await req.json();
    if (!appointment_id || typeof appointment_id !== "string") {
      return responder({ error: "appointment_id em falta" }, 400);
    }

    // A service role contorna as políticas RLS de propósito: esta função
    // precisa de ler o email e o nome do cliente, que o browser não vê.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: marcacao, error: erroMarcacao } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointment_id)
      .maybeSingle();

    if (erroMarcacao || !marcacao) return responder({ error: "Agendamento não encontrado" }, 404);
    if (marcacao.payment_status === "paid") return responder({ error: "Este agendamento já foi pago" }, 409);

    // O preço vem sempre da tabela de serviços, nunca do valor que o browser
    // gravou na marcação: esse é escrito pelo cliente e não é de confiar.
    const { data: servico } = await supabase
      .from("services")
      .select("price_15_minutes, price_30_minutes")
      .eq("active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!servico) return responder({ error: "Serviço não encontrado" }, 404);

    const preco = marcacao.service_type === "15_minutes"
      ? Number(servico.price_15_minutes)
      : Number(servico.price_30_minutes);

    if (!(preco > 0)) return responder({ error: "Preço inválido" }, 500);

    const origem = req.headers.get("origin") ?? "";
    const base = ORIGENS_PERMITIDAS.includes(origem) ? origem : ORIGENS_PERMITIDAS[0];

    const duracao = marcacao.service_type === "15_minutes" ? "15 minutos" : "30 minutos";

    const stripe = new Stripe(chaveStripe, { apiVersion: "2024-12-18.acacia" });

    const sessao = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: marcacao.client_email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(preco * 100),
          product_data: {
            name: `Consultoria Imobiliária — ${duracao}`,
            description: `${marcacao.scheduled_date} às ${marcacao.scheduled_time}`,
          },
        },
      }],
      success_url: `${base}/payment-success?appointment=${appointment_id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/payment?appointment=${appointment_id}`,
      metadata: { appointment_id },
    });

    // Guardar a sessão e o valor autoritativo: é por aqui que a verificação
    // posterior confirma que o pagamento pertence mesmo a esta marcação.
    await supabase
      .from("appointments")
      .update({ stripe_session_id: sessao.id, amount: preco })
      .eq("id", appointment_id);

    return responder({ url: sessao.url });
  } catch (erro) {
    console.error("create-checkout:", erro instanceof Error ? erro.message : erro);
    return responder({ error: "Erro ao criar sessão de pagamento" }, 500);
  }
});
