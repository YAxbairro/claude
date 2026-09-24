import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  APPOINTMENT_PUBLIC_COLUMNS,
  type Appointment,
  SERVICE_LABELS,
} from "@/integrations/supabase/types";
import { formatDate, formatEuro } from "@/lib/utils";

/** Minutos até a marcação não paga ser libertada. */
const HOLD_MINUTES = 15;

export default function Payment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const appointmentId = params.get("appointment");

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(HOLD_MINUTES * 60);

  useEffect(() => {
    if (!appointmentId) {
      setLoading(false);
      return;
    }

    supabase
      .from("appointments")
      .select(APPOINTMENT_PUBLIC_COLUMNS)
      .eq("id", appointmentId)
      .maybeSingle()
      .then(({ data }) => {
        const appt = data as Appointment | null;
        if (appt?.payment_status === "paid") {
          toast.info("Este agendamento já foi pago");
          navigate(`/payment-success?appointment=${appt.id}`);
          return;
        }
        setAppointment(appt);
        setLoading(false);
      });
  }, [appointmentId, navigate]);

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const handlePay = async () => {
    if (!appointment) return;
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { appointment_id: appointment.id },
      });

      if (error || !data?.url) {
        toast.error("Erro ao criar sessão de pagamento");
        setPaying(false);
        return;
      }

      // O Stripe aloja a página de pagamento — saímos do site aqui.
      window.location.href = data.url;
    } catch {
      toast.error("Erro ao processar pagamento");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              <Link to="/booking">Fazer nova marcação</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="container max-w-2xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Finalizar Pagamento</CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete o pagamento para confirmar seu agendamento
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Tempo restante */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
              <p className="text-sm text-muted-foreground">Tempo restante para pagar</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-primary">
                {mins}:{secs}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Após este tempo, o agendamento será cancelado automaticamente.
              </p>
            </div>

            {/* Resumo */}
            <section className="rounded-lg border border-border p-6">
              <h3 className="mb-4 font-semibold">Resumo do Agendamento</h3>
              <dl className="space-y-3 text-sm">
                <Row label="Serviço" value={`Consultoria de ${SERVICE_LABELS[appointment.service_type]}`} />
                <Row
                  label="Data e Hora"
                  value={`${formatDate(appointment.scheduled_date)} às ${appointment.scheduled_time}`}
                />
                <div className="flex justify-between border-t border-border pt-3 text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatEuro(appointment.amount)}</span>
                </div>
              </dl>
            </section>

            {/* Métodos */}
            <section>
              <h3 className="mb-3 font-semibold">Métodos de Pagamento Aceitos</h3>
              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <CreditCard className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm font-medium">Cartão de Crédito/Débito</p>
                  <p className="text-xs text-muted-foreground">
                    Você será redirecionado para uma página segura do Stripe
                  </p>
                </div>
              </div>
            </section>

            <Button
              variant="gold"
              size="lg"
              className="w-full"
              onClick={handlePay}
              disabled={paying}
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> A redirecionar...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Pagar {formatEuro(appointment.amount)}
                </>
              )}
            </Button>

            {/* Segurança */}
            <div className="flex items-start gap-3 rounded-lg bg-muted/60 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div>
                <p className="text-sm font-medium">Pagamento 100% Seguro</p>
                <p className="text-xs text-muted-foreground">
                  Seus dados são protegidos com criptografia de ponta a ponta. Não armazenamos
                  informações de cartão.
                </p>
              </div>
            </div>
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
