import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Menu,
  Phone,
  Shield,
  Star,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { Service } from "@/integrations/supabase/types";
import { formatEuro } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#servicos", label: "Serviços" },
  { href: "#horarios", label: "Horários" },
  { href: "#sobre", label: "Sobre" },
  { href: "#contacto", label: "Contacto" },
];

const HIGHLIGHTS = [
  {
    icon: Shield,
    title: "Consultoria Especializada",
    description: "Orientação profissional em todas as etapas",
  },
  {
    icon: TrendingUp,
    title: "Experiência Comprovada",
    description: "Anos de sucesso no mercado português",
  },
  {
    icon: CalendarCheck,
    title: "Agendamento Simples",
    description: "Marque sua consulta de forma rápida",
  },
];

const SCHEDULE = [
  { day: "Segunda-feira", hours: "11h30 - 13h30 | 15h00 - 18h00" },
  { day: "Terça a Sexta-feira", hours: "10h00 - 18h00" },
  { day: "Sábado", hours: "11h00 - 13h00" },
  { day: "Domingo", hours: "Encerrado", closed: true },
];

const VALUES = [
  "Transparência e ética em cada orientação",
  "Análises detalhadas e recomendações assertivas",
  "Atendimento personalizado para cada cliente",
  "Compromisso com resultados de qualidade",
];

const AWARDS = [
  { title: "Prémio Presidente 2023", detail: "3.º Lugar Ranking Linha de Sintra Esc C 2023" },
  { title: "Prémio Presidente 2024", detail: "3.º Lugar Ranking Linha de Sintra Esc B 2024" },
];

const STATS = [
  { value: "100+", label: "Clientes Satisfeitos", icon: Users },
  { value: "5+", label: "Anos de Experiência", icon: Award },
];

export default function Index() {
  const [service, setService] = useState<Service | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // A tabela tem uma linha por serviço activo; ficamos com o mais antigo,
    // que é o que o site original apresenta.
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

  return (
    <div className="min-h-screen bg-background">
      {/* ---------- Navegação ---------- */}
      <header className="fixed top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur">
        <nav className="container flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Lutuima Veiga Logo"
              className="h-11 w-auto"
              onError={(e) => ((e.currentTarget.style.display = "none"))}
            />
            <span className="text-lg font-semibold tracking-tight">Lutuima Veiga</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
            <Button asChild variant="gold" size="sm">
              <Link to="/booking">Agendar Agora</Link>
            </Button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {menuOpen && (
          <div className="border-t border-border bg-background md:hidden">
            <div className="container flex flex-col gap-4 py-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium text-muted-foreground"
                >
                  {link.label}
                </a>
              ))}
              <Button asChild variant="gold">
                <Link to="/booking">Agendar Agora</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden pt-20">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-background.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-overlay" />

        <div className="container relative z-10 text-center text-white">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-primary-light">
            Lutuima Veiga
          </p>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
            Consultoria <span className="text-primary">Imobiliária</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/85 md:text-xl">
            Orientação profissional para compra, venda e investimento imobiliário em Portugal
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild variant="gold" size="lg">
              <Link to="/booking">Agendar Consultoria</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
            >
              <a href="#servicos">Ver Serviços</a>
            </Button>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-lg border border-white/15 bg-white/10 p-6 backdrop-blur"
              >
                <Icon className="mx-auto mb-3 h-7 w-7 text-primary" />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-white/75">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Serviços ---------- */}
      <section id="servicos" className="py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Serviços de <span className="text-primary">Consultoria</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Escolha o serviço adequado às suas necessidades e agende uma consulta personalizada
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-8 md:grid-cols-2">
            <ServiceCard
              duration="15 minutos"
              price={service?.price_15_minutes}
              description="Ideal para esclarecer dúvidas pontuais sobre o mercado imobiliário."
              perks={["Esclarecimento de dúvidas", "Orientação inicial", "Chamada de voz ou vídeo"]}
            />
            <ServiceCard
              duration="30 minutos"
              price={service?.price_30_minutes}
              description="Análise aprofundada da sua situação, com recomendações detalhadas."
              perks={[
                "Análise completa do caso",
                "Estratégia personalizada",
                "Recomendações detalhadas",
                "Acompanhamento das próximas etapas",
              ]}
              recommended
            />
          </div>
        </div>
      </section>

      {/* ---------- Horários ---------- */}
      <section id="horarios" className="bg-muted/40 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <Clock className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h2 className="text-3xl font-bold md:text-4xl">Horários de Atendimento</h2>
            <p className="mt-4 text-muted-foreground">
              Consulte os horários disponíveis para agendamento
            </p>
          </div>

          <Card className="mx-auto mt-12 max-w-2xl">
            <CardContent className="p-0">
              {SCHEDULE.map((row, i) => (
                <div
                  key={row.day}
                  className={`flex items-center justify-between px-6 py-5 ${
                    i !== SCHEDULE.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <span className="font-medium">{row.day}</span>
                  <span className={row.closed ? "text-muted-foreground" : "font-semibold text-primary"}>
                    {row.hours}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Fuso Horário: Lisboa (GMT+01:00)
          </p>
        </div>
      </section>

      {/* ---------- Sobre ---------- */}
      <section id="sobre" className="py-24">
        <div className="container grid items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">
              Sobre <span className="text-primary">Lutuima Veiga</span>
            </h2>
            <p className="mt-6 text-muted-foreground">
              Consultor imobiliário em Portugal, dedicado a orientar clientes em cada etapa do
              processo — da primeira dúvida à assinatura da escritura. O trabalho assenta em
              análises rigorosas do mercado e num acompanhamento próximo e honesto.
            </p>

            <ul className="mt-8 space-y-4">
              {VALUES.map((value) => (
                <li key={value} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">{value}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 grid grid-cols-2 gap-6">
              {STATS.map(({ value, label, icon: Icon }) => (
                <div key={label} className="rounded-lg border border-border bg-card p-6 text-center">
                  <Icon className="mx-auto mb-2 h-6 w-6 text-primary" />
                  <div className="text-3xl font-bold text-primary">{value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Prémios e Distinções */}
          <div>
            <div className="mb-8 flex items-center gap-3">
              <Star className="h-7 w-7 text-primary" />
              <h3 className="text-2xl font-bold">Prémios e Distinções</h3>
            </div>

            <div className="space-y-5">
              {AWARDS.map((award) => (
                <Card key={award.title} className="shadow-elegant">
                  <CardContent className="flex items-start gap-4 p-6">
                    <Award className="mt-1 h-8 w-8 shrink-0 text-primary" />
                    <div>
                      <h4 className="font-semibold">{award.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{award.detail}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Chamada final ---------- */}
      <section className="bg-gradient-dark py-20 text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Pronto para dar o próximo passo?</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/75">
            Agende a sua consultoria e receba orientação profissional adaptada ao seu caso.
          </p>
          <Button asChild variant="gold" size="lg" className="mt-8">
            <Link to="/booking">Agendar Consultoria</Link>
          </Button>
        </div>
      </section>

      {/* ---------- Rodapé / Contacto ---------- */}
      <footer id="contacto" className="border-t border-border bg-card py-16">
        <div className="container grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-semibold">Lutuima Veiga</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Consultoria imobiliária profissional em Portugal. Orientação especializada para
              compra, venda e investimento no mercado português.
            </p>
          </div>

          <div>
            <h4 className="font-semibold">Contacto</h4>
            <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:geral@lutuimaveiga.com" className="hover:text-primary">
                  geral@lutuimaveiga.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>Disponível por WhatsApp</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Linha de Sintra, Portugal</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">Navegação</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="hover:text-primary">
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/booking" className="hover:text-primary">
                  Agendar Consultoria
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="container mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Lutuima Veiga. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

function ServiceCard({
  duration,
  price,
  description,
  perks,
  recommended,
}: {
  duration: string;
  price?: number;
  description: string;
  perks: string[];
  recommended?: boolean;
}) {
  return (
    <Card className={recommended ? "relative border-primary shadow-elegant" : "relative"}>
      {recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-gold px-4 py-1 text-xs font-semibold text-secondary">
          Recomendado
        </span>
      )}
      <CardContent className="p-8">
        <Clock className="mb-4 h-8 w-8 text-primary" />
        <h3 className="text-xl font-semibold">Consultoria de {duration}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>

        <div className="my-6 text-4xl font-bold text-primary">
          {price != null ? formatEuro(price) : "—"}
        </div>

        <ul className="space-y-3">
          {perks.map((perk) => (
            <li key={perk} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{perk}</span>
            </li>
          ))}
        </ul>

        <Button asChild variant={recommended ? "gold" : "default"} className="mt-8 w-full">
          <Link to="/booking">Agendar Agora</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
