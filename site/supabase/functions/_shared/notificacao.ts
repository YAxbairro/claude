import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/**
 * Confirmar uma marcação e avisar a administração.
 *
 * Dois caminhos independentes chegam aqui: o webhook do Stripe, que é o
 * fiável, e a página de sucesso, que só corre se o cliente voltar ao site.
 * Os dois podem correr ao mesmo tempo para a mesma marcação, por isso a
 * transição para "paga" é feita numa única instrução condicional — quem
 * perder a corrida não recebe linha nenhuma de volta e não envia nada.
 *
 * Este ficheiro é copiado para dentro de cada função: o Supabase publica
 * cada uma isolada, sem acesso às pastas vizinhas.
 */

export type Marcacao = Record<string, string | number | null>;

const REMETENTE = "Marcações Lutuima Veiga <marcacoes@lutuimaveiga.com>";
const DESTINATARIOS = [
  "lutuimaveiga694@gmail.com", // Lutuima
  "yanickdrs@gmail.com",       // Yanick
];

const DURACAO: Record<string, string> = {
  "15_minutes": "15 minutos",
  "30_minutes": "30 minutos",
};

const CONTACTO: Record<string, string> = {
  whatsapp_voice: "Chamada de voz por WhatsApp",
  whatsapp_video: "Chamada de vídeo por WhatsApp",
  normal_voice: "Chamada de voz normal",
};

/** `2026-10-26` → `26/10/2026`. A data vem da base de dados, já validada. */
export function dataPt(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** `14:30:00` → `14:30`. */
export function horaPt(hora: string) {
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

/**
 * Marca a consulta como paga e devolve-a — mas só a quem conseguir fazer a
 * transição. Se já estivesse paga, o `neq` exclui a linha, nada é alterado e
 * devolve-se `null`. É isto que garante um único email por marcação, mesmo
 * com o webhook e o browser a chegarem em simultâneo.
 */
export async function marcarPagaUmaVez(
  supabase: SupabaseClient,
  appointmentId: string,
): Promise<Marcacao | null> {
  const { data, error } = await supabase
    .from("appointments")
    .update({ payment_status: "paid", status: "confirmed" })
    .eq("id", appointmentId)
    .neq("payment_status", "paid")
    .select("*");

  if (error) throw new Error(`falha ao marcar como paga: ${error.message}`);
  return (data?.[0] as Marcacao) ?? null;
}

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

  const instagram = m.client_instagram ? linha("Instagram", esc(m.client_instagram)) : "";

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
 * anti-spam, e as duas versões juntas são o que um email legítimo traz.
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
 * Envia o aviso. Nunca lança — uma falha de email não pode derrubar a
 * confirmação do pagamento, que já aconteceu e está gravada.
 */
export async function avisarAdministracao(m: Marcacao, origem: string) {
  const chave = Deno.env.get("RESEND_API_KEY");
  if (!chave) {
    console.error(`[${origem}] RESEND_API_KEY não definida, aviso não enviado`);
    return;
  }

  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
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
      console.error(`[${origem}] Resend recusou`, resposta.status, await resposta.text());
    } else {
      console.log(`[${origem}] aviso enviado para ${m.client_name} ${m.client_surname}`);
    }
  } catch (erro) {
    console.error(`[${origem}] falha ao enviar aviso`, erro instanceof Error ? erro.message : erro);
  }
}
