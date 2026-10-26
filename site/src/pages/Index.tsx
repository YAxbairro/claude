import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Mail,
  MapPin,
  Menu,
  Phone,
  Shield,
  Sparkles,
  Trophy,
  TrendingUp,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCountUp } from "@/hooks/useCountUp";
import { useReveal } from "@/hooks/useReveal";
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
    description: "Marque a sua consulta em minutos",
  },
];

/** Dias da semana como o JavaScript os numera: 0 = domingo. */
const SCHEDULE = [
  { dia: 1, day: "Segunda-feira", hours: "11h30 - 13h30 | 15h00 - 18h00", janelas: [[690, 810], [900, 1080]] },
  { dia: 2, day: "Terça-feira", hours: "10h00 - 18h00", janelas: [[600, 1080]] },
  { dia: 3, day: "Quarta-feira", hours: "10h00 - 18h00", janelas: [[600, 1080]] },
  { dia: 4, day: "Quinta-feira", hours: "10h00 - 18h00", janelas: [[600, 1080]] },
  { dia: 5, day: "Sexta-feira", hours: "10h00 - 18h00", janelas: [[600, 1080]] },
  { dia: 6, day: "Sábado", hours: "11h00 - 13h00", janelas: [[660, 780]] },
  { dia: 0, day: "Domingo", hours: "Encerrado", janelas: [] },
];

const VALUES = [
  "Transparência e ética em cada orientação",
  "Análises detalhadas e recomendações assertivas",
  "Atendimento personalizado para cada cliente",
  "Compromisso com resultados de qualidade",
];

const AWARDS = [
  {
    posicao: "1.º Lugar",
    title: "Prémio Presidente 2023",
    detail: "Ranking Linha de Sintra · Escalão C",
    ano: "2023",
  },
  {
    posicao: "1.º Lugar",
    title: "Prémio Presidente 2024",
    detail: "Ranking Linha de Sintra · Escalão B",
    ano: "2024",
  },
];

const STATS = [
  { valor: 100, sufixo: "+", label: "Clientes satisfeitos" },
  { valor: 5, sufixo: "+", label: "Anos de experiência" },
  { valor: 2, sufixo: "", label: "Prémios Presidente" },
];

/**
 * Minutos desde a meia-noite em Lisboa, e o dia da semana correspondente.
 *
 * O relógio é o de Lisboa e não o do visitante: um cliente no Brasil ou em
 * Angola veria "aberto" a horas em que ninguém atende. `Intl` resolve o fuso
 * e a hora de verão sem tabelas nossas.
 */
function agoraEmLisboa() {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const obter = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  const dias: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return {
    dia: dias[obter("weekday")] ?? new Date().getDay(),
    minutos: Number(obter("hour")) * 60 + Number(obter("minute")),
  };
}

function estaAberto() {
  const { dia, minutos } = agoraEmLisboa();
  const hoje = SCHEDULE.find((l) => l.dia === dia);
  return Boolean(hoje?.janelas.some(([abre, fecha]) => minutos >= abre && minutos < fecha));
}

export default function Index() {
  const [service, setService] = useState<Service | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rolou, setRolou] = useState(false);
  const [aberto, setAberto] = useState(estaAberto);

  useReveal();

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

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 24);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  useEffect(() => {
    // Quem deixa o separador aberto durante horas veria um estado preso no
    // momento em que abriu a página.
    const id = setInterval(() => setAberto(estaAberto()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hojeNaAgenda = agoraEmLisboa().dia;

  return (
    <div className="min-h-screen bg-background">
      {/* ------------------------------------------------------ Navegação */}
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-500 ${
          rolou
            ? "border-b border-border/60 bg-background/85 py-1 shadow-sm backdrop-blur-xl"
            : "border-b border-transparent bg-transparent py-3"
        }`}
      >
        <nav className="container flex items-center justify-between">
          <Link to="/" className="group flex items-center gap-3">
            <img
              src="/logo-mark.png"
              alt="Lutuima Veiga"
              className={`w-auto transition-all duration-500 group-hover:scale-105 ${
                rolou ? "h-11" : "h-14 drop-shadow-[0_2px_14px_rgba(0,0,0,0.6)]"
              }`}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <span
              className={`hidden text-base font-semibold uppercase tracking-[0.18em] transition-colors duration-500 sm:block ${
                rolou ? "text-foreground" : "text-white drop-shadow"
              }`}
            >
              Lutuima Veiga
            </span>
          </Link>

          <div className="hidden items-center gap-9 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`group relative py-2 text-sm font-medium transition-colors ${
                  rolou ? "text-muted-foreground hover:text-foreground" : "text-white/85 hover:text-white"
                }`}
              >
                {link.label}
                <span className="absolute bottom-0 left-0 h-px w-0 bg-gradient-gold transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
            <Button asChild variant="gold" size="sm" className="shine rounded-full px-6">
              <Link to="/booking">Agendar Agora</Link>
            </Button>
          </div>

          <button
            className={`p-2 md:hidden ${rolou ? "text-foreground" : "text-white"}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {menuOpen && (
          <div className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
            <div className="container flex flex-col gap-1 py-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-2 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
              <Button asChild variant="gold" className="mt-3 rounded-full">
                <Link to="/booking">Agendar Agora</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ----------------------------------------------------------- Herói */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/hero.jpg"
            alt=""
            aria-hidden
            className="animate-kenburns h-full w-full object-cover"
          />
        </div>

        {/* Duas camadas: uma escurece de baixo para cima e segura o texto,
            outra traz um sopro dourado às margens. */}
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(22,18,15,0.96)_0%,rgba(22,18,15,0.52)_38%,rgba(22,18,15,0.78)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,transparent_26%,rgba(22,18,15,0.68)_100%)]" />

        <div className="container relative z-10 py-28 text-center text-white">
          {/* Logótipo em destaque, com auréola dourada por trás. */}
          <div className="reveal-scale relative mx-auto mb-8 w-fit">
            <div className="animate-halo absolute inset-0 -z-10 scale-150 rounded-full bg-[radial-gradient(circle,hsl(43_84%_55%/0.5)_0%,transparent_68%)] blur-2xl" />
            <img
              src="/logo.png"
              alt="Lutuima Veiga"
              className="animate-float h-32 w-auto drop-shadow-[0_8px_28px_rgba(0,0,0,0.55)] md:h-44"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>

          <p
            className="reveal mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.28em] text-primary-light backdrop-blur"
            style={{ "--d": "120ms" } as React.CSSProperties}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Linha de Sintra · Portugal
          </p>

          <h1
            className="reveal mx-auto max-w-4xl text-[2.6rem] font-bold leading-[1.05] tracking-tight md:text-7xl"
            style={{ "--d": "220ms" } as React.CSSProperties}
          >
            Consultoria
            <br className="sm:hidden" />{" "}
            <span className="text-gradient-gold">Imobiliária</span>
          </h1>

          <p
            className="reveal mx-auto mt-7 max-w-2xl text-base leading-relaxed text-white/80 md:text-xl"
            style={{ "--d": "320ms" } as React.CSSProperties}
          >
            Orientação profissional para compra, venda e investimento imobiliário em Portugal —
            com a clareza de quem conhece o mercado por dentro.
          </p>

          <div
            className="reveal mt-11 flex flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ "--d": "420ms" } as React.CSSProperties}
          >
            <Button asChild variant="gold" size="lg" className="shine group h-14 rounded-full px-9 text-base">
              <Link to="/booking">
                Agendar Consultoria
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="glass h-14 rounded-full px-9 text-base text-white hover:bg-white/20 hover:text-white"
            >
              <a href="#servicos">Ver Serviços</a>
            </Button>
          </div>

          <div className="mt-20 grid gap-5 sm:grid-cols-3">
            {HIGHLIGHTS.map(({ icon: Icon, title, description }, i) => (
              <div
                key={title}
                className="reveal glass group rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/40 hover:bg-white/15"
                style={{ "--d": `${560 + i * 120}ms` } as React.CSSProperties}
              >
                <Icon className="mx-auto mb-3 h-7 w-7 text-primary transition-transform duration-500 group-hover:scale-110" />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-white/70">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <a
          href="#numeros"
          aria-label="Continuar"
          className="animate-hint absolute bottom-7 left-1/2 z-10 -translate-x-1/2 text-white/70 transition-colors hover:text-white"
        >
          <ChevronDown className="h-7 w-7" />
        </a>
      </section>

      {/* -------------------------------------------------------- Números */}
      <section id="numeros" className="border-b border-border bg-card py-16">
        <div className="container grid gap-10 sm:grid-cols-3">
          {STATS.map((stat, i) => (
            <Stat key={stat.label} {...stat} atraso={i * 140} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- Serviços */}
      <section id="servicos" className="relative overflow-hidden py-28">
        <div className="absolute left-1/2 top-0 -z-10 h-80 w-[46rem] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="reveal text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Serviços
            </p>
            <h2
              className="reveal mt-4 text-3xl font-bold tracking-tight md:text-5xl"
              style={{ "--d": "100ms" } as React.CSSProperties}
            >
              Escolha o tempo de que <span className="text-gradient-gold">precisa</span>
            </h2>
            <p
              className="reveal mt-5 text-muted-foreground"
              style={{ "--d": "180ms" } as React.CSSProperties}
            >
              Uma conversa curta para tirar uma dúvida, ou uma análise completa do seu caso.
              Marca-se online e paga-se na hora.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
            <ServiceCard
              duration="15 minutos"
              price={service?.price_15_minutes}
              description="Ideal para esclarecer dúvidas pontuais sobre o mercado imobiliário."
              perks={["Esclarecimento de dúvidas", "Orientação inicial", "Chamada de voz ou vídeo"]}
              atraso={0}
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
              atraso={140}
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Horários */}
      <section id="horarios" className="bg-muted/40 py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <div className="reveal-scale mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-gold shadow-elegant">
              <Clock className="h-8 w-8 text-secondary" />
            </div>
            <h2 className="reveal text-3xl font-bold tracking-tight md:text-5xl">
              Horários de Atendimento
            </h2>

            <div
              className="reveal mt-6 inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-medium"
              style={
                {
                  "--d": "120ms",
                  borderColor: aberto ? "rgb(22 163 74 / 0.35)" : "hsl(var(--border))",
                  background: aberto ? "rgb(22 163 74 / 0.08)" : "hsl(var(--card))",
                } as React.CSSProperties
              }
            >
              <span className="relative flex h-2.5 w-2.5">
                {aberto && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-70" />
                )}
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    aberto ? "bg-green-600" : "bg-muted-foreground/50"
                  }`}
                />
              </span>
              {aberto ? "Aberto agora" : "Fechado neste momento"}
            </div>
          </div>

          <Card className="reveal mx-auto mt-12 max-w-2xl overflow-hidden shadow-card">
            <CardContent className="p-0">
              {SCHEDULE.map((row, i) => {
                const eHoje = row.dia === hojeNaAgenda;
                return (
                  <div
                    key={row.day}
                    className={`flex items-center justify-between px-6 py-4 transition-colors ${
                      i !== SCHEDULE.length - 1 ? "border-b border-border" : ""
                    } ${eHoje ? "bg-primary/5" : "hover:bg-muted/50"}`}
                  >
                    <span className="flex items-center gap-2.5 font-medium">
                      {row.day}
                      {eHoje && (
                        <span className="rounded-full bg-gradient-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
                          Hoje
                        </span>
                      )}
                    </span>
                    <span
                      className={
                        row.janelas.length === 0
                          ? "text-sm text-muted-foreground"
                          : "text-sm font-semibold text-primary"
                      }
                    >
                      {row.hours}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <p className="reveal mt-6 text-center text-sm text-muted-foreground">
            Fuso horário de Lisboa (GMT+01:00)
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------- Sobre */}
      <section id="sobre" className="py-28">
        <div className="container">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="reveal-left">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                Sobre
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
                Lutuima <span className="text-gradient-gold">Veiga</span>
              </h2>
              <p className="mt-6 leading-relaxed text-muted-foreground">
                Consultor imobiliário em Portugal, dedicado a orientar clientes em cada etapa do
                processo — da primeira dúvida à assinatura da escritura. O trabalho assenta em
                análises rigorosas do mercado e num acompanhamento próximo e honesto.
              </p>

              <ul className="mt-9 space-y-4">
                {VALUES.map((value, i) => (
                  <li
                    key={value}
                    className="reveal flex items-start gap-3"
                    style={{ "--d": `${i * 90}ms` } as React.CSSProperties}
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm leading-relaxed">{value}</span>
                  </li>
                ))}
              </ul>

              <Button asChild variant="gold" size="lg" className="shine group mt-10 rounded-full px-8">
                <Link to="/booking">
                  Falar com o Lutuima
                  <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </Button>
            </div>

            <div className="reveal-scale relative">
              <div className="absolute -inset-3 -z-10 rounded-3xl bg-gradient-gold opacity-15 blur-2xl" />
              <img
                src="/interior.jpg"
                alt="Interior de um apartamento em Lisboa ao fim da tarde"
                loading="lazy"
                className="aspect-[4/3] w-full rounded-3xl object-cover shadow-elegant"
              />
            </div>
          </div>

          {/* ------------------------------------------------------ Prémios */}
          <div className="mt-28">
            <div className="mx-auto max-w-2xl text-center">
              <div className="reveal-scale mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-gold shadow-elegant">
                <Trophy className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="reveal text-3xl font-bold tracking-tight md:text-4xl">
                Prémios e <span className="text-gradient-gold">Distinções</span>
              </h3>
              <p
                className="reveal mt-4 text-muted-foreground"
                style={{ "--d": "120ms" } as React.CSSProperties}
              >
                Reconhecimento no ranking da Linha de Sintra, dois anos seguidos.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-4xl gap-7 md:grid-cols-2">
              {AWARDS.map((award, i) => (
                <div
                  key={award.title}
                  className="reveal border-gold-gradient group relative overflow-hidden rounded-2xl p-8 shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-elegant"
                  style={{ "--d": `${i * 160}ms` } as React.CSSProperties}
                >
                  <span className="pointer-events-none absolute -right-8 -top-8 text-[7rem] font-black leading-none text-primary/[0.07] transition-transform duration-700 group-hover:scale-110">
                    {award.ano}
                  </span>

                  <div className="relative">
                    <span className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-1.5 text-sm font-bold text-secondary shadow-sm">
                      <Trophy className="h-4 w-4" />
                      {award.posicao}
                    </span>
                    <h4 className="mt-5 text-xl font-bold">{award.title}</h4>
                    <p className="mt-2 text-sm text-muted-foreground">{award.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- Chamada final */}
      <section className="relative isolate overflow-hidden py-32 text-white">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center md:bg-fixed"
          style={{ backgroundImage: "url('/cidade.jpg')" }}
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(20,17,14,0.92)_0%,rgba(20,17,14,0.75)_100%)]" />

        <div className="container text-center">
          <h2 className="reveal mx-auto max-w-3xl text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            Pronto para dar o <span className="text-gradient-gold">próximo passo</span>?
          </h2>
          <p
            className="reveal mx-auto mt-5 max-w-xl text-white/75"
            style={{ "--d": "120ms" } as React.CSSProperties}
          >
            Agende a sua consultoria e receba orientação profissional adaptada ao seu caso.
          </p>
          <Button
            asChild
            variant="gold"
            size="lg"
            className="shine group reveal mt-10 h-14 rounded-full px-10 text-base"
            style={{ "--d": "220ms" } as React.CSSProperties}
          >
            <Link to="/booking">
              Agendar Consultoria
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ------------------------------------------------ Rodapé / Contacto */}
      <footer id="contacto" className="border-t border-border bg-card py-16">
        <div className="container grid gap-12 md:grid-cols-3">
          <div>
            <img
              src="/logo.png"
              alt="Lutuima Veiga"
              className="h-24 w-auto"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Consultoria imobiliária profissional em Portugal. Orientação especializada para
              compra, venda e investimento no mercado português.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Contacto
            </h4>
            <ul className="mt-5 space-y-3.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href="mailto:geral@lutuimaveiga.com" className="transition-colors hover:text-primary">
                  geral@lutuimaveiga.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>Disponível por WhatsApp</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span>Linha de Sintra, Portugal</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Navegação
            </h4>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="transition-colors hover:text-primary">
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/booking" className="font-medium text-primary hover:underline">
                  Agendar Consultoria
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="container mt-12 border-t border-border pt-7 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Lutuima Veiga. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

function Stat({
  valor,
  sufixo,
  label,
  atraso,
}: {
  valor: number;
  sufixo: string;
  label: string;
  atraso: number;
}) {
  const { ref, atual } = useCountUp(valor);

  return (
    <div className="reveal text-center" style={{ "--d": `${atraso}ms` } as React.CSSProperties}>
      <div className="text-5xl font-bold tracking-tight text-gradient-gold md:text-6xl">
        <span ref={ref}>{atual}</span>
        {sufixo}
      </div>
      <div className="mt-2 text-sm uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
    </div>
  );
}

function ServiceCard({
  duration,
  price,
  description,
  perks,
  recommended,
  atraso,
}: {
  duration: string;
  price?: number;
  description: string;
  perks: string[];
  recommended?: boolean;
  atraso: number;
}) {
  return (
    <div
      className={`reveal group relative rounded-2xl p-8 transition-all duration-500 hover:-translate-y-2 ${
        recommended
          ? "border-gold-gradient shadow-elegant hover:shadow-[0_24px_60px_-12px_hsl(43_74%_49%/0.35)]"
          : "border border-border bg-card shadow-card hover:border-primary/40 hover:shadow-elegant"
      }`}
      style={{ "--d": `${atraso}ms` } as React.CSSProperties}
    >
      {recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-gold px-4 py-1 text-xs font-bold uppercase tracking-wider text-secondary shadow-sm">
          Recomendado
        </span>
      )}

      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform duration-500 group-hover:scale-110">
        <Clock className="h-6 w-6 text-primary" />
      </div>

      <h3 className="text-xl font-bold">Consultoria de {duration}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>

      <div className="my-7 flex items-baseline gap-1.5">
        <span className="text-5xl font-bold tracking-tight text-gradient-gold">
          {price != null ? formatEuro(price) : "—"}
        </span>
      </div>

      <ul className="space-y-3">
        {perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2.5 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{perk}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        variant={recommended ? "gold" : "outline"}
        className={`mt-8 h-12 w-full rounded-full ${recommended ? "shine" : ""}`}
      >
        <Link to="/booking">Agendar Agora</Link>
      </Button>
    </div>
  );
}
