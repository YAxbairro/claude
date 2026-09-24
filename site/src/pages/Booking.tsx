import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  CONTACT_PREFERENCE_LABELS,
  type ContactPreference,
  type Service,
  type ServiceType,
} from "@/integrations/supabase/types";
import { formatEuro } from "@/lib/utils";

/** Validação idêntica à do site original. */
const bookingSchema = z.object({
  clientName: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(60),
  clientSurname: z.string().trim().min(2, "Sobrenome deve ter pelo menos 2 caracteres").max(60),
  clientEmail: z.string().trim().email("Email inválido"),
  clientPhone: z
    .string()
    .trim()
    .regex(/^(\+351)?\s?\d{9}$/, "Formato inválido. Use 9 dígitos ou +351 seguido de 9 dígitos"),
  clientInstagram: z.string().trim().max(60).optional().or(z.literal("")),
  scheduledDate: z.string().refine((d) => {
    const today = new Date().toISOString().split("T")[0];
    return d >= today;
  }, "Data não pode ser no passado"),
  scheduledTime: z.string().min(1, "Selecione uma hora"),
  notes: z.string().max(500).optional().or(z.literal("")),
});

/** Horários de 9h00 às 18h30, de meia em meia hora. */
function buildTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 9; h <= 18; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

const TIME_SLOTS = buildTimeSlots();

export default function Booking() {
  const navigate = useNavigate();

  const [service, setService] = useState<Service | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType>("30_minutes");
  const [loading, setLoading] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientSurname, setClientSurname] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientInstagram, setClientInstagram] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [contactPreference, setContactPreference] = useState<ContactPreference | "">("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("[services]", error.message);
        setService((data?.[0] as Service) ?? null);
      });
  }, []);

  const price =
    serviceType === "15_minutes" ? service?.price_15_minutes : service?.price_30_minutes;

  /**
   * Um domingo, uma data bloqueada pela administração ou um horário já
   * reservado tornam a marcação impossível — confirmamos antes de gravar.
   */
  const checkAvailability = async (): Promise<boolean> => {
    try {
      if (new Date(scheduledDate + "T00:00:00").getDay() === 0) {
        toast.error("Data não disponível (domingo ou bloqueada)");
        return false;
      }

      const { data: blocked } = await supabase
        .from("blocked_dates")
        .select("id")
        .eq("blocked_date", scheduledDate)
        .maybeSingle();

      if (blocked) {
        toast.error("Data selecionada não está disponível");
        return false;
      }

      const { data: taken } = await supabase
        .from("appointments")
        .select("id")
        .eq("scheduled_date", scheduledDate)
        .eq("scheduled_time", scheduledTime)
        .neq("payment_status", "failed")
        .maybeSingle();

      if (taken) {
        toast.error("Este horário já está ocupado. Por favor, escolha outro.");
        return false;
      }

      return true;
    } catch {
      toast.error("Erro ao verificar disponibilidade");
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactPreference) {
      toast.error("Por favor, selecione uma preferência de contacto");
      return;
    }

    try {
      bookingSchema.parse({
        clientName,
        clientSurname,
        clientEmail,
        clientPhone,
        clientInstagram,
        scheduledDate,
        scheduledTime,
        notes,
      });
    } catch (err) {
      if (err instanceof z.ZodError) toast.error(err.errors[0].message);
      return;
    }

    if (!service) {
      toast.error("Serviço não encontrado");
      return;
    }

    setLoading(true);
    try {
      if (!(await checkAvailability())) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .insert({
          client_name: clientName.trim(),
          client_surname: clientSurname.trim(),
          client_email: clientEmail.trim(),
          client_phone: clientPhone.trim(),
          client_instagram: clientInstagram.trim() || null,
          service_type: serviceType,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          contact_preference: contactPreference,
          notes: notes.trim() || null,
          amount: price ?? 0,
          status: "pending",
          payment_status: "pending",
        })
        .select()
        .single();

      if (error) {
        // Corrida entre dois clientes a reservar o mesmo horário.
        toast.error("Este horário acabou de ser reservado. Por favor, escolha outro.");
        setLoading(false);
        return;
      }

      navigate(`/payment?appointment=${data.id}`);
    } catch {
      toast.error("Erro ao criar agendamento");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="container max-w-3xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar à página inicial
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Agendar Consultoria</CardTitle>
            <p className="text-sm text-muted-foreground">
              Preencha os dados abaixo para marcar a sua consulta.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Serviço */}
              <section>
                <h3 className="mb-4 font-semibold">Escolha o Serviço</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ServiceOption
                    selected={serviceType === "15_minutes"}
                    onClick={() => setServiceType("15_minutes")}
                    label="15 minutos"
                    price={service?.price_15_minutes}
                  />
                  <ServiceOption
                    selected={serviceType === "30_minutes"}
                    onClick={() => setServiceType("30_minutes")}
                    label="30 minutos (Recomendado)"
                    price={service?.price_30_minutes}
                  />
                </div>
              </section>

              {/* Dados pessoais */}
              <section className="space-y-4">
                <h3 className="font-semibold">Os Seus Dados</h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome *">
                    <Input value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                  </Field>
                  <Field label="Sobrenome *">
                    <Input
                      value={clientSurname}
                      onChange={(e) => setClientSurname(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email *">
                    <Input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Telefone *">
                    <Input
                      type="tel"
                      placeholder="912345678 ou +351912345678"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <Field label="Instagram (opcional)">
                  <Input
                    placeholder="@ousuario"
                    value={clientInstagram}
                    onChange={(e) => setClientInstagram(e.target.value)}
                  />
                </Field>
              </section>

              {/* Agendamento */}
              <section className="space-y-4">
                <h3 className="font-semibold">Agendamento</h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Data *">
                    <Input
                      type="date"
                      min={today}
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Hora * (9h-18h30, Seg-Sáb)">
                    <Select value={scheduledTime} onValueChange={setScheduledTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field label="Preferência de Contacto *">
                  <Select
                    value={contactPreference}
                    onValueChange={(v) => setContactPreference(v as ContactPreference)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Como prefere ser contactado?" />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.keys(CONTACT_PREFERENCE_LABELS) as ContactPreference[]
                      ).map((key) => (
                        <SelectItem key={key} value={key}>
                          {CONTACT_PREFERENCE_LABELS[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Notas (opcional)">
                  <Textarea
                    placeholder="Adicione qualquer informação adicional..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Field>
              </section>

              {/* Resumo */}
              <section className="rounded-lg border border-border bg-muted/40 p-6">
                <h3 className="mb-4 font-semibold">Resumo do Agendamento</h3>
                <dl className="space-y-2 text-sm">
                  <SummaryRow
                    label="Serviço:"
                    value={serviceType === "15_minutes" ? "15 minutos" : "30 minutos"}
                  />
                  <SummaryRow label="Nome:" value={`${clientName} ${clientSurname}`.trim() || "—"} />
                  <SummaryRow label="Email:" value={clientEmail || "—"} />
                  <SummaryRow label="Telefone:" value={clientPhone || "—"} />
                  <SummaryRow
                    label="Data e Hora:"
                    value={scheduledDate && scheduledTime ? `${scheduledDate} às ${scheduledTime}` : "—"}
                  />
                  <SummaryRow
                    label="Preferência de Contacto:"
                    value={contactPreference ? CONTACT_PREFERENCE_LABELS[contactPreference] : "—"}
                  />
                  <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                    <span>Total:</span>
                    <span className="text-primary">{price != null ? formatEuro(price) : "—"}</span>
                  </div>
                </dl>
              </section>

              <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> A processar...
                  </>
                ) : (
                  "Confirmar Agendamento"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function ServiceOption({
  selected,
  onClick,
  label,
  price,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  price?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-5 text-left transition-all ${
        selected ? "border-primary bg-primary/5 shadow-elegant" : "border-border hover:border-primary/50"
      }`}
    >
      <Clock className="mb-2 h-5 w-5 text-primary" />
      <div className="font-medium">{label}</div>
      <div className="mt-1 text-2xl font-bold text-primary">
        {price != null ? formatEuro(price) : "—"}
      </div>
    </button>
  );
}
