import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Confirma junto do Stripe que uma marcação foi efectivamente paga e avisa a
 * administração por email.
 *
 * A confirmação nunca parte do que o browser diz: o cliente volta do Stripe
 * com um id de sessão, mas é o Stripe que é consultado, e a sessão tem de
 * pertencer a esta marcação. Sem isso, bastaria a alguém visitar o URL de
 * sucesso para se dar por pago.
 *
 * O aviso por email vive aqui, e não no browser, por duas razões: é o único
 * ponto onde o pagamento está provado, e o cliente pode fechar o separador
 * mal paga — nesse caso um envio feito pelo browser nunca aconteceria.
 */

const CABECALHOS_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Enquanto o domínio não estiver verificado no Resend, o remetente tem de ser
// o endereço de testes e o destinatário tem de ser o email da conta Resend —
// é a regra do plano gratuito. Verificado o domínio, passa a
// `marcacoes@lutuimaveiga.com` e a lista aceita qualquer endereço.
const REMETENTE = "Marcações Lutuima Veiga <onboarding@resend.dev>";
const DESTINATARIOS = ["yanickdrs@gmail.com"];

const DURACAO: Record<string, string> = {
  "15_minutes": "15 minutos",
  "30_minutes": "30 minutos",
};

const CONTACTO: Record<string, string> = {
  whatsapp_voice: "Chamada de voz por WhatsApp",
  whatsapp_video: "Chamada de vídeo por WhatsApp",
  normal_voice: "Chamada de voz normal",
};

function responder(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CABECALHOS_CORS, "Content-Type": "application/json" },
  });
}

/** `2026-10-26` → `26/10/2026`. A data vem da base de dados, já validada. */
function dataPt(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** `14:30:00` → `14:30`. */
function horaPt(hora: string) {
  return hora.slice(0, 5);
}

/**
 * Escapa texto escrito pelo cliente antes de o pôr dentro do HTML do email.
 * O nome e as notas são campos livres de um formulário público.
 */
function esc(valor: unknown) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

type Marcacao = Record<string, string | number | null>;

function corpoEmail(m: Marcacao) {
  const linha = (rotulo: string, valor: string) => `
    <tr>
      <td style="padding:10px 0;color:#6b7280;font-size:14px;white-space:nowrap">${rotulo}</td>
      <td style="padding:10px 0 10px 24px;color:#111827;font-size:14px;font-weight:600">${valor}</td>
    </tr>`;

  const notas = m.notes
    ? `<tr><td colspan="2" style="padding:16px 0 0">
         <div style="color:#6b7280;font-size:14px;margin-bottom:6px">Notas do cliente</div>
         <div style="background:#f9fafb;border-left:3px solid #d4af37;padding:12px 14px;
                     color:#374151;font-size:14px;line-height:1.6">${esc(m.notes)}</div>
       </td></tr>`
    : "";

  const instagram = m.client_instagram
    ? linha("Instagram", esc(m.client_instagram))
    : "";

  return `<!doctype html>
<html lang="pt">
  <body style="margin:0;padding:24px;background:#f3f4f6;
               font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden">

      <div style="background:#111827;padding:28px 32px">
        <div style="color:#d4af37;font-size:12px;letter-spacing:2px;text-transform:uppercase">
          Nova marcação paga
        </div>
        <div style="color:#ffffff;font-size:22px;font-weight:700;margin-top:6px">
          ${esc(m.client_name)} ${esc(m.client_surname)}
        </div>
      </div>

      <div style="padding:28px 32px">
        <table style="width:100%;border-collapse:collapse">
          ${linha("Data", dataPt(String(m.scheduled_date)))}
          ${linha("Hora", horaPt(String(m.scheduled_time)))}
          ${linha("Duração", DURACAO[String(m.service_type)] ?? String(m.service_type))}
          ${linha("Contactar por", CONTACTO[String(m.contact_preference)] ?? String(m.contact_preference))}
          ${linha("Telefone", esc(m.client_phone))}
          ${linha("Email", esc(m.client_email))}
          ${instagram}
          ${linha("Valor pago", `${Number(m.amount).toFixed(2).replace(".", ",")} €`)}
          ${notas}
        </table>

        <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;
                    color:#9ca3af;font-size:12px;line-height:1.6">
          Aviso automático de lutuimaveiga.com.
          Responder a este email responde directamente ao cliente.
        </div>
      </div>

    </div>
  </body>
</html>`;
}

/**
 * Alternativa em texto simples. Um email só com HTML pontua pior nos filtros
 * anti-spam, e sem domínio verificado o remetente já parte em desvantagem.
 */
function textoEmail(m: Marcacao) {
  return [
    "NOVA MARCAÇÃO PAGA",
    "",
    `Cliente: ${m.client_name} ${m.client_surname}`,
    `Data: ${dataPt(String(m.scheduled_date))} às ${horaPt(String(m.scheduled_time))}`,
    `Duração: ${DURACAO[String(m.service_type)] ?? m.service_type}`,
    `Contactar por: ${CONTACTO[String(m.contact_preference)] ?? m.contact_preference}`,
    `Telefone: ${m.client_phone}`,
    `Email: ${m.client_email}`,
    m.client_instagram ? `Instagram: ${m.client_instagram}` : "",
    `Valor pago: ${Number(m.amount).toFixed(2).replace(".", ",")} €`,
    m.notes ? `\nNotas: ${m.notes}` : "",
    "",
    "Aviso automático de lutuimaveiga.com.",
  ].filter(Boolean).join("\n");
}

/**
 * Envia o aviso. Devolve sempre — uma falha de email não pode fazer o cliente
 * pensar que o pagamento correu mal, porque correu bem.
 */
async function avisarAdministracao(m: Marcacao) {
  const chave = Deno.env.get("RESEND_API_KEY");
  if (!chave) {
    console.error("verify-payment: RESEND_API_KEY não definida, aviso não enviado");
    return;
  }

  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: REMETENTE,
        to: DESTINATARIOS,
        reply_to: m.client_email,
        subject: `Nova marcação · ${m.client_name} ${m.client_surname} · ${dataPt(String(m.scheduled_date))} às ${horaPt(String(m.scheduled_time))}`,
        html: corpoEmail(m),
        text: textoEmail(m),
      }),
    });

    if (!resposta.ok) {
      console.error("verify-payment: Resend recusou", resposta.status, await resposta.text());
    }
  } catch (erro) {
    console.error("verify-payment: falha ao enviar aviso", erro instanceof Error ? erro.message : erro);
  }
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
      .select("*")
      .eq("id", appointment_id)
      .maybeSingle();

    if (!marcacao) return responder({ paid: false, error: "Agendamento não encontrado" }, 404);

    // Já confirmado numa visita anterior: o Stripe pode reenviar o cliente
    // para esta página, e reconfirmar não deve alterar nada nem reenviar o aviso.
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

    // Depois de gravar: o aviso é consequência do pagamento, não condição dele.
    await avisarAdministracao(marcacao as Marcacao);

    return responder({ paid: true });
  } catch (erro) {
    console.error("verify-payment:", erro instanceof Error ? erro.message : erro);
    return responder({ paid: false, error: "Erro ao verificar pagamento" }, 500);
  }
});
