import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  type Appointment,
  CONTACT_PREFERENCE_LABELS,
  SERVICE_LABELS,
} from "@/integrations/supabase/types";
import { formatDate, formatEuro } from "@/lib/utils";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const appointmentId = params.get("appointment");
  const sessionId = params.get("session_id");

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const ran = useRef(false);

  useEffect(() => {
    // O Stripe pode reenviar o utilizador para esta página; confirmamos uma só vez.
    if (ran.current || !appointmentId) {
      if (!appointmentId) setLoading(false);
      return;
    }
    ran.current = true;

    (async () => {
      try {
        const { data: verification, error } = await supabase.functions.invoke("verify-payment", {
          body: { appointment_id: appointmentId, session_id: sessionId },
        });

        if (error || !verification?.paid) {
          toast.error("Pagamento não confirmado");
        } else {
          // Emails de cortesia: uma falha aqui não invalida o pagamento.
          await supabase.functions
            .invoke("send-confirmation-email", { body: { appointment_id: appointmentId } })
            .catch(() => toast.warning("Aviso: Email de confirmação pode ter falhado"));

          await supabase.functions
            .invoke("send-admin-notification", { body: { appointment_id: appointmentId } })
            .catch(() => undefined);
        }

        const { data } = await supabase
          .from("appointments")
          .select("*")
          .eq("id", appointmentId)
          .maybeSingle();

        setAppointment(data as Appointment | null);
      } catch {
        toast.error("Erro ao verificar pagamento");
      } finally {
        setLoading(false);
      }
    })();
  }, [appointmentId, sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">A confirmar o pagamento...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <h1 className="text-xl font-semibold">Agendamento não encontrado</h1>
            <Button asChild className="mt-6">
              <Link to="/">Voltar à página inicial</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="container max-w-2xl">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
              <h1 className="mt-4 text-2xl font-bold">Pagamento Confirmado!</h1>
              <p className="mt-2 text-muted-foreground">
                Receberá um email e mensagem WhatsApp com os detalhes da sua consultoria em breve.
              </p>
            </div>

            <section className="mt-8 rounded-lg border border-border p-6">
              <h2 className="mb-4 font-semibold">Detalhes do Agendamento</h2>
              <dl className="space-y-3 text-sm">
                <Row
                  label="Serviço"
                  value={`Consultoria de ${SERVICE_LABELS[appointment.service_type]}`}
                />
                <Row
                  label="Data e Hora"
                  value={`${formatDate(appointment.scheduled_date)} às ${appointment.scheduled_time}`}
                />
                <Row
                  label="Nome"
                  value={`${appointment.client_name} ${appointment.client_surname}`}
                />
                <Row label="Email" value={appointment.client_email} />
                <Row
                  label="Contacto"
                  value={CONTACT_PREFERENCE_LABELS[appointment.contact_preference]}
                />
                <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                  <span>Total pago</span>
                  <span className="text-primary">{formatEuro(appointment.amount)}</span>
                </div>
              </dl>
            </section>

            <Button asChild variant="gold" className="mt-8 w-full">
              <Link to="/">Voltar à página inicial</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
