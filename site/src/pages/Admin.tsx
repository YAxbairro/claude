import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CalendarCheck, CheckCircle2, Clock, Euro, Loader2, LogOut } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  type Appointment,
  CONTACT_PREFERENCE_LABELS,
  SERVICE_LABELS,
} from "@/integrations/supabase/types";
import { formatDate, formatEuro } from "@/lib/utils";

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  revenue: number;
}

export default function Admin() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, confirmed: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user || !isAdmin) return;

    supabase
      .from("appointments")
      .select("*")
      .order("scheduled_date", { ascending: false })
      .then(({ data }) => {
        const rows = (data ?? []) as Appointment[];
        setAppointments(rows);
        setStats({
          total: rows.length,
          pending: rows.filter((a) => a.payment_status === "pending").length,
          confirmed: rows.filter((a) => a.payment_status === "paid").length,
          // Só o dinheiro efetivamente recebido conta como receita.
          revenue: rows
            .filter((a) => a.payment_status === "paid")
            .reduce((sum, a) => sum + Number(a.amount ?? 0), 0),
        });
        setLoading(false);
      });
  }, [authLoading, user, isAdmin]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <h1 className="text-xl font-semibold">Acesso restrito</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              A conta {user.email} não tem permissões de administrador. Por favor, faça login com
              uma conta que tenha permissões de administrador.
            </p>
            <Button className="mt-6 w-full" variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Terminar sessão
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="font-semibold">Área Administrativa</h1>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">Ver site</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={CalendarCheck} label="Total Agendamentos" value={String(stats.total)} />
          <StatCard icon={Clock} label="Pendentes" value={String(stats.pending)} />
          <StatCard icon={CheckCircle2} label="Confirmados" value={String(stats.confirmed)} />
          <StatCard icon={Euro} label="Receita" value={formatEuro(stats.revenue)} highlight />
        </div>

        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="text-xl">Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : appointments.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Ainda não há agendamentos.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-3 pr-4 font-medium">Cliente</th>
                      <th className="py-3 pr-4 font-medium">Serviço</th>
                      <th className="py-3 pr-4 font-medium">Data/Hora</th>
                      <th className="py-3 pr-4 font-medium">Contacto</th>
                      <th className="py-3 pr-4 font-medium">Valor</th>
                      <th className="py-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr key={a.id} className="border-b border-border/60">
                        <td className="py-4 pr-4">
                          <div className="font-medium">
                            {a.client_name} {a.client_surname}
                          </div>
                          <div className="text-xs text-muted-foreground">{a.client_email}</div>
                        </td>
                        <td className="py-4 pr-4">
                          {a.service_type === "15_minutes" ? "15 min" : "30 min"}
                        </td>
                        <td className="py-4 pr-4">
                          {formatDate(a.scheduled_date)}
                          <div className="text-xs text-muted-foreground">{a.scheduled_time}</div>
                        </td>
                        <td className="py-4 pr-4 text-xs">
                          {CONTACT_PREFERENCE_LABELS[a.contact_preference]}
                          <div className="text-muted-foreground">{a.client_phone}</div>
                        </td>
                        <td className="py-4 pr-4 font-medium">{formatEuro(a.amount)}</td>
                        <td className="py-4">
                          {a.payment_status === "paid" ? (
                            <Badge variant="success">Confirmado</Badge>
                          ) : a.payment_status === "failed" ? (
                            <Badge variant="destructive">Falhou</Badge>
                          ) : (
                            <Badge variant="warning">Pendente</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className={`mt-3 text-3xl font-bold ${highlight ? "text-primary" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
