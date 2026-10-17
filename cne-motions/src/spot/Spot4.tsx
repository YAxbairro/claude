import React from "react";
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LogoAnim } from "../LogoAnim";
import { SANS } from "../theme";
import { Art, Line, RED, Underline, ease, sec, useExit } from "./kit";
import { ServiceBadge, Calendar, DatePage, FormDoc } from "./vectors";
import { BRIGHT, DEEP, Kicker, LIGHT, OCEAN, TEAL } from "./devices";
import { Bars, BgTexture, BrowserWindow, Burst, FlipGroup, Handset, Iris } from "./fx";

// Spot "Voto antecipado – categorias profissionais" (Oct 2026). Same look and devices as
// Spot2/Spot3; the professions are realistic cut-outs that take the stage one by one while the
// previous ones step back out of focus. Cue times are seconds of the trimmed voice-over
// (the file starts with the title read aloud, cut at OFF).
export type Spot4Props = { variant: "cor" | "alpha"; logos?: "cor" | "mono" };
const OFF = 3.75;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const L = (abs: number, start: number) => sec(abs) - sec(start);
const W = "#FFFFFF";

const BgCtx = React.createContext(true);

// Camera moves between scenes: the outgoing scene can recede like a card (zoomOut) or the camera
// can dive into a point of it (zoomIn); the incoming scene can settle from a slight push.
type Cam = {
  exit?: { kind: "zoomOut"; len?: number } | { kind: "zoomIn"; ox: number; oy: number; len?: number };
  enter?: { flash?: boolean; len?: number };
  push?: boolean; // slow, subtle push-in across the whole scene
};

const SceneBody: React.FC<{ cam?: Cam; bg: string; name: string; withBg: boolean; children: React.ReactNode }> = ({ cam, bg, name, withBg, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  let transform = "";
  let filter = "";
  let radius = 0;
  let origin = "50% 50%";
  let opacity = 1;
  if (cam?.exit) {
    const len = cam.exit.len ?? 10;
    const k = ease(frame, durationInFrames - len, durationInFrames, Easing.in(Easing.cubic));
    if (cam.exit.kind === "zoomOut") {
      // the card keeps receding into the distance until it is gone
      transform += ` scale(${1 - 0.9 * k}) rotate(${-6 * k}deg)`;
      radius = 80 * k;
      filter += ` blur(${k * 4}px)`;
      opacity = interpolate(k, [0.55, 1], [1, 0], clamp);
    } else {
      origin = `${cam.exit.ox}px ${cam.exit.oy}px`;
      transform += ` scale(${1 + 16 * k * k})`;
      filter += ` blur(${k * 4}px)`;
    }
  }
  if (cam?.push) transform += ` scale(${1 + 0.045 * (frame / durationInFrames)})`;
  let flash = 0;
  if (cam?.enter) {
    const len = cam.enter.len ?? 14;
    const k = ease(frame, 0, len, Easing.out(Easing.cubic));
    transform += ` scale(${1.22 - 0.22 * k})`;
    filter += ` blur(${(1 - k) * 10}px)`;
    if (cam.enter.flash) flash = interpolate(frame, [0, 9], [1, 0], clamp);
  }
  return (
    <AbsoluteFill
      style={{
        transform: transform || undefined,
        transformOrigin: origin,
        opacity,
        filter: filter || undefined,
        borderRadius: radius,
        overflow: radius ? "hidden" : undefined,
        boxShadow: radius ? "0 40px 90px rgba(5,15,50,0.45)" : undefined,
      }}
    >
      {withBg && <AbsoluteFill style={{ background: bg }} />}
      {withBg && <BgTexture seed={name} />}
      {children}
      {flash > 0 && <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash }} />}
    </AbsoluteFill>
  );
};

const Scene: React.FC<{ from: number; to: number; name: string; bg: string; cam?: Cam; children: React.ReactNode }> = ({ from, to, name, bg, cam, children }) => {
  const withBg = React.useContext(BgCtx);
  return (
    <Sequence from={sec(from)} durationInFrames={sec(to) - sec(from)} name={name}>
      <SceneBody cam={cam} bg={bg} name={name} withBg={withBg}>
        {children}
      </SceneBody>
    </Sequence>
  );
};

const Exit: React.FC<{ children: React.ReactNode; len?: number }> = ({ children, len = 8 }) => {
  const e = useExit(len);
  return <AbsoluteFill style={{ opacity: 1 - e, transform: `translateX(${-140 * e}px)` }}>{children}</AbsoluteFill>;
};

// Same colour wipe as v1 (approved), in the new navy
const Wipe: React.FC = () => {
  const frame = useCurrentFrame();
  const p = ease(frame, 0, 16, Easing.inOut(Easing.quad));
  const x = interpolate(p, [0, 1], [-2700, 2300]);
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: -200, height: 1480, left: x + 2350, width: 260, background: RED, transform: "skewX(-14deg)" }} />
      <div style={{ position: "absolute", top: -200, height: 1480, left: x, width: 2300, background: DEEP, transform: "skewX(-14deg)" }} />
    </AbsoluteFill>
  );
};
// Alternating transitions so the cuts don't all look the same
const TRANSITIONS: { at: number; kind: "wipe" | "iris" | "bars"; cx?: number; cy?: number }[] = [
  { at: 6.1, kind: "wipe" },
  { at: 23.7, kind: "bars" },
  { at: 38.3, kind: "wipe" },
  { at: 53.4, kind: "iris", cx: 440, cy: 530 },
  { at: 62.3, kind: "bars" },
]

// Soft translucent disc behind illustrations
const Halo: React.FC<{ x: number; y: number; size: number; delay?: number }> = ({ x, y, size, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 18, mass: 0.8 } });
  return <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: "50%", background: "rgba(255,255,255,0.16)", transform: `scale(${p})` }} />;
};

// White line helper (all type is white on the colour fields)
const T: React.FC<{ d: number; size: number; box?: string; children: React.ReactNode; align?: "left" | "center" | "right"; weight?: number; spacing?: number }> = ({
  d,
  size,
  box,
  children,
  align = "left",
  weight = 700,
  spacing = 0,
}) => (
  // headlines a touch lighter and smaller so they sit in balance with the kickers
  <Line delay={d} size={Math.round(size * (size > 100 ? 0.86 : 0.93))} color={W} box={box} align={align} weight={weight} spacing={spacing}>
    {children}
  </Line>
);

// ---------- Scenes ----------

const S1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - L(0.5, 0), fps, config: { damping: 12, mass: 0.7 } });
  const count = Math.max(1, Math.min(15, Math.round(interpolate(frame, [L(0.5, 0), L(0.5, 0) + 10], [1, 15], clamp))));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Kicker delay={L(0.12, 0)} size={54} align="center">
          No dia
        </Kicker>
        <div style={{ height: 30 }} />
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 240, lineHeight: 0.9, color: W, transform: `scale(${0.6 + 0.4 * pop})`, opacity: pop > 0.01 ? 1 : 0 }}>{count}</div>
        <div style={{ height: 18 }} />
        <T d={L(0.95, 0)} size={84} box={DEEP} align="center" spacing={6}>
          Novembro
        </T>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// "Vai estar de serviço e não poderá deslocar-se à sua mesa de voto?"
const S2: React.FC<{ start: number }> = ({ start }) => (
  <AbsoluteFill>
    <div style={{ position: "absolute", left: 270, top: 250 }}>
      <ServiceBadge delay={L(1.95, start)} size={330} />
    </div>
    <Sequence from={0} durationInFrames={L(2.95, start)} layout="none">
      <Exit len={6}>
        <div style={{ position: "absolute", left: 760, top: 400 }}>
          <Kicker delay={L(1.8, start)} size={64}>
            Vai estar
          </Kicker>
          <div style={{ height: 18 }} />
          <T d={L(2.3, start)} size={160}>
            de serviço?
          </T>
        </div>
      </Exit>
    </Sequence>
    <Sequence from={L(2.95, start)} layout="none">
      <div style={{ position: "absolute", left: 760, top: 360 }}>
        <Kicker delay={3} size={52}>
          Não poderá deslocar-se
        </Kicker>
        <div style={{ height: 18 }} />
        <T d={L(4.8, start) - L(2.95, start)} size={120}>
          à sua mesa
        </T>
        <T d={L(5.3, start) - L(2.95, start)} size={140} box={RED}>
          de voto?
        </T>
      </div>
    </Sequence>
  </AbsoluteFill>
);

// "O voto antecipado pode ser a solução."
const S3: React.FC<{ start: number }> = ({ start }) => (
  <AbsoluteFill>
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Kicker delay={L(6.25, start)} size={60} align="center">
        O voto antecipado
      </Kicker>
      <div style={{ height: 20 }} />
      <T d={L(7.2, start)} size={120} align="center">
        pode ser
      </T>
      <T d={L(7.85, start)} size={160} box={RED} align="center">
        a solução
      </T>
    </AbsoluteFill>
    <Burst at={L(7.85, start) + 8} x={1330} y={640} size={130} />
  </AbsoluteFill>
);

// ---------- The professions: each one takes the stage, the previous ones step back out of focus ----------
type Pro = { src: string; at: number; kick?: string; title: string; sub?: { text: string; at: number } };
const CREW: Pro[] = [
  { src: "spot/servico/soldado.png", at: 8.97, title: "Militares" },
  { src: "spot/servico/policia.png", at: 10.03, kick: "Agentes das", title: "forças policiais", sub: { text: "e de segurança", at: 11.2 } },
  { src: "spot/servico/medica.png", at: 12.55, kick: "Profissionais", title: "de saúde" },
  { src: "spot/servico/bombeiro.png", at: 13.71, kick: "Profissionais da", title: "proteção civil" },
  { src: "spot/servico/maritima.png", at: 14.83, kick: "Trabalhadores", title: "marítimos" },
  { src: "spot/servico/piloto.png", at: 16.29, kick: "Trabalhadores", title: "aeronáuticos" },
  { src: "spot/servico/membro_mesa.png", at: 17.57, title: "Membros de mesa", sub: { text: "inscritos noutra|assembleia de voto", at: 18.17 } },
  { src: "spot/servico/jornalista.png", at: 20.41, title: "Jornalistas", sub: { text: "deslocados para|outro concelho", at: 20.99 } },
];

const FG_H = 900; // figure height on stage
const FG_X = 540; // stage centre

const Figure: React.FC<{ p: Pro; i: number; start: number }> = ({ p, i, start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = L(p.at, start);
  const next = CREW[i + 1] ? L(CREW[i + 1].at, start) : 1e6;
  const inn = spring({ frame: frame - e, fps, config: { damping: 16, mass: 0.8 } });
  const k = ease(frame, next, next + 14, Easing.inOut(Easing.cubic));
  // place in the back row: spread across the left half, smaller, soft focus
  const slotX = 110 + i * 120;
  const cx = interpolate(k, [0, 1], [FG_X + (1 - inn) * 260, slotX]);
  const scale = interpolate(k, [0, 1], [0.92 + 0.08 * inn, 0.5]);
  const lift = interpolate(k, [0, 1], [0, -150]);
  const blur = interpolate(k, [0, 1], [(1 - inn) * 8, 5]);
  const dim = interpolate(k, [0, 1], [1, 0.78]);
  const w = (FG_H * 1024) / 1536;
  return (
    <Img
      src={staticFile(p.src)}
      style={{
        position: "absolute",
        left: cx - w / 2,
        top: 1080 - 30 - FG_H,
        height: FG_H,
        width: w,
        transformOrigin: "50% 100%",
        transform: `translateY(${lift}px) scale(${scale})`,
        filter: `blur(${blur}px) brightness(${dim}) drop-shadow(0 18px 30px rgba(0,0,0,0.25))`,
        opacity: interpolate(inn, [0, 0.25], [0, 1], clamp) * (k > 0 ? 0.92 : 1),
        zIndex: k < 0.5 ? 50 + i : i,
        visibility: inn < 0.005 ? "hidden" : "visible",
      }}
    />
  );
};

const Label: React.FC<{ p: Pro; i: number; start: number }> = ({ p, i, start }) => {
  const e = L(p.at, start);
  const next = CREW[i + 1] ? L(CREW[i + 1].at, start) : undefined;
  return (
    <Sequence from={e} layout="none">
      <div style={{ position: "absolute", left: 1000, top: 430 }}>
        <Phase until={next === undefined ? undefined : next - e + 2}>
          {p.kick && (
            <>
              <Kicker delay={0} size={44}>
                {p.kick}
              </Kicker>
              <div style={{ height: 12 }} />
            </>
          )}
          <T d={p.kick ? 3 : 0} size={86} box={i % 2 ? DEEP : undefined}>
            {p.title}
          </T>
          {p.sub && (
            <>
              <div style={{ height: 16 }} />
              {p.sub.text.split("|").map((line, k) => (
                <div key={k} style={{ marginTop: k ? 6 : 0 }}>
                  <Kicker delay={L(p.sub!.at, start) - e + k * 4} size={36}>
                    {line}
                  </Kicker>
                </div>
              ))}
            </>
          )}
        </Phase>
      </div>
    </Sequence>
  );
};

const S4: React.FC<{ start: number }> = ({ start }) => (
  <Exit>
    <Halo x={FG_X} y={640} size={860} />
    {CREW.map((p, i) => (
      <Figure key={p.src} p={p} i={i} start={start} />
    ))}
    {CREW.map((p, i) => (
      <Label key={p.src} p={p} i={i} start={start} />
    ))}
  </Exit>
);

const S5: React.FC<{ start: number }> = ({ start }) => (
  <AbsoluteFill>
    <div style={{ position: "absolute", left: 150, top: 330 }}>
      <Kicker delay={L(23.81, start)} size={58}>
        Podem votar
      </Kicker>
      <div style={{ height: 14 }} />
      <T d={L(24.85, start)} size={88} box={DEEP}>
        antecipadamente
      </T>
      <div style={{ height: 40 }} />
      <Kicker delay={L(26.3, start)} size={40}>
        de 8 a 9 de novembro
      </Kicker>
      <Underline delay={L(28.3, start)} width={260} align="left" />
    </div>
    <div style={{ position: "absolute", left: 1220, top: 150, transform: "scale(0.88)", transformOrigin: "top left" }}>
      <Calendar delay={L(23.9, start)} days={[8, 9]} markAt={[27.01, 27.81].map((s) => L(s, start))} />
    </div>
    <Burst at={L(27.81, start) + 6} x={1365} y={410} size={90} />
  </AbsoluteFill>
);

const S6: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const back = ease(frame, L(35.0, start), L(35.6, start), Easing.inOut(Easing.cubic));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${1 - 0.07 * back})`, filter: back > 0 ? `blur(${7 * back}px) brightness(${1 - 0.22 * back})` : undefined }}>
        <Halo x={620} y={600} size={980} />
        <Art src="spot/camara.png" delay={L(28.95, start)} from="scale" float={3} style={{ left: 60, top: 320, width: 1080 }} />
        <div style={{ position: "absolute", left: 1150, top: 200 }}>
          <Kicker delay={L(30.27, start)} size={40}>
            Apresente o
          </Kicker>
          <div style={{ height: 6 }} />
          <Kicker delay={L(30.6, start)} size={40}>
            requerimento
          </Kicker>
          <div style={{ height: 18 }} />
          <T d={L(32.25, start)} size={84}>
            na Câmara
          </T>
          <T d={L(32.51, start)} size={92} box={DEEP}>
            Municipal
          </T>
          <div style={{ height: 22 }} />
          <Kicker delay={L(33.15, start)} size={36}>
            do concelho onde
          </Kicker>
          <div style={{ height: 6 }} />
          <Kicker delay={L(33.5, start)} size={36}>
            está recenseado
          </Kicker>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(10,30,90,${0.28 * back})` }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 40 }}>
        <Kicker delay={L(35.3, start)} size={60} align="center">
          Entre
        </Kicker>
        <div style={{ height: 130 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div style={{ transform: "scale(1.75)", margin: "0 70px" }}>
            <DatePage delay={L(35.65, start)} day="31" month="OUT" />
          </div>
          <Kicker delay={L(36.9, start)} size={64}>
            a
          </Kicker>
          <div style={{ transform: "scale(1.75)", margin: "0 70px" }}>
            <DatePage delay={L(37.19, start)} day="3" month="NOV" />
          </div>
        </div>
      </AbsoluteFill>
      <Burst at={L(37.19, start) + 8} x={1380} y={500} size={160} />
    </AbsoluteFill>
  );
};

// "O formulário está disponível junto das …" – the form on the left, the four places tick in on the right
const Place: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 13, mass: 0.6 } });
  const tick = ease(frame, delay + 4, delay + 12);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, background: "rgba(33,47,111,0.92)", borderRadius: 14, padding: "14px 30px 14px 16px", transform: `translateX(${(1 - p) * 80}px)`, opacity: interpolate(p, [0, 0.3], [0, 1], clamp), visibility: p < 0.01 ? "hidden" : "visible" }}>
      <svg width="52" height="52" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill={RED} />
        <path d="M28 52 L44 67 L73 35" fill="none" stroke="#fff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tick} />
      </svg>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: W, whiteSpace: "nowrap" }}>{children}</span>
    </div>
  );
};

const S7: React.FC<{ start: number }> = ({ start }) => (
  <AbsoluteFill>
    <Halo x={440} y={560} size={760} />
    <div style={{ position: "absolute", left: 230, top: 280 }}>
      <FormDoc delay={L(38.45, start)} />
    </div>
    <div style={{ position: "absolute", left: 790, top: 150 }}>
      <Kicker delay={L(38.45, start)} size={42}>
        O formulário está
      </Kicker>
      <div style={{ height: 8 }} />
      <T d={L(39.3, start)} size={84}>
        disponível
      </T>
      <div style={{ height: 28 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
        <Place delay={L(40.27, start)}>Entidades empregadoras</Place>
        <Place delay={L(42.55, start)}>Delegações da CNE</Place>
        <Place delay={L(43.99, start)}>Comissões de Recenseamento Eleitoral</Place>
        <Place delay={L(46.39, start)}>Câmaras Municipais</Place>
      </div>
    </div>
  </AbsoluteFill>
);

// Web address written big, revealed left to right
const Url: React.FC<{ delay: number; text: string; size?: number }> = ({ delay, text, size = 104 }) => {
  const frame = useCurrentFrame();
  const p = ease(frame, delay, delay + 12, Easing.out(Easing.cubic));
  return (
    <div style={{ clipPath: `inset(0 ${100 - p * 100}% 0 0)`, visibility: p <= 0 ? "hidden" : "visible", fontFamily: SANS, fontWeight: 800, fontSize: size, color: W, letterSpacing: -1, whiteSpace: "nowrap" }}>{text}</div>
  );
};

// "Pode ainda obter o formulário nos sítios eletrónicos da CNE e da DGAPE"
const S8: React.FC<{ start: number }> = ({ start }) => (
  <Exit>
    <div style={{ position: "absolute", left: 130, top: 300 }}>
      <Kicker delay={L(47.43, start)} size={38}>
        Obtenha o formulário
      </Kicker>
      <div style={{ height: 18 }} />
      <Url delay={L(51.2, start)} text="www.cne.cv" size={88} />
      <div style={{ height: 10 }} />
      <Url delay={L(51.85, start)} text="www.dgape.cv" size={88} />
      <Underline delay={L(52.4, start)} width={240} align="left" />
    </div>
    <div style={{ position: "absolute", left: 870, top: 160 }}>
      <BrowserWindow delay={L(47.6, start)} typeAt={L(49.6, start)} loadAt={L(51.3, start)} width={700} url="www.cne.cv" screen="spot/cne_site.png" />
    </div>
  </Exit>
);

// Free line: a handset badge on the left, the number flips in tile by tile on the right
const S9: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const pill = ease(frame, L(53.7, start), L(53.7, start) + 10, Easing.out(Easing.cubic));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 230, top: 320 }}>
        <Handset delay={L(53.45, start)} size={420} />
      </div>
      <div style={{ position: "absolute", left: 860, top: 300 }}>
        <div style={{ display: "inline-block", background: RED, borderRadius: 40, padding: "12px 30px", clipPath: `inset(0 ${100 - pill * 100}% 0 0 round 40px)`, visibility: pill <= 0 ? "hidden" : "visible" }}>
          <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 34, color: W, letterSpacing: "0.2em" }}>LINHA VERDE GRATUITA</span>
        </div>
        <div style={{ display: "flex", gap: 30, marginTop: 34 }}>
          <FlipGroup text="800" at={L(56.09, start)} size={150} />
          <FlipGroup text="10" at={L(57.0, start)} size={150} />
          <FlipGroup text="14" at={L(57.3, start)} size={150} />
        </div>
        <div style={{ height: 34 }} />
        <Kicker delay={L(54.71, start)} size={42}>
          Ligue gratuitamente
        </Kicker>
      </div>
      <Burst at={L(57.3, start) + 10} x={1622} y={500} size={130} />
    </AbsoluteFill>
  );
};

// Closing beats, as in the reference: three quick cards
// Chosen ending (option 1): one continuous card, the sentence builds next to the voter
const ParticipaPill: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 10, mass: 0.6 } });
  const tick = ease(frame, delay + 6, delay + 14);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 26,
        background: RED,
        borderRadius: 90,
        padding: "22px 54px 22px 30px",
        boxShadow: "0 20px 40px rgba(120,10,20,0.35)",
        transform: `scale(${p})`,
        transformOrigin: "left center",
        visibility: p < 0.01 ? "hidden" : "visible",
      }}
    >
      <svg width="76" height="76" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#fff" />
        <path d="M28 52 L44 67 L73 35" fill="none" stroke={RED} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tick} />
      </svg>
      <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 92, color: W, letterSpacing: 2 }}>PARTICIPA!</span>
    </div>
  );
};

const S10: React.FC<{ start: number }> = ({ start }) => (
  <AbsoluteFill>
    <Halo x={560} y={640} size={900} />
    <Art src="spot/servico/votante.png" delay={L(58.4, start)} from="left" style={{ left: 120, top: 220, height: 860 }} />
    <div style={{ position: "absolute", left: 980, top: 170 }}>
      <Kicker delay={L(58.49, start)} size={64}>
        Cada voto
      </Kicker>
      <div style={{ height: 6 }} />
      <T d={L(59.1, start)} size={150}>
        conta.
      </T>
      <div style={{ height: 26 }} />
      <T d={L(59.89, start)} size={78} box={DEEP}>
        O teu também.
      </T>
      <div style={{ height: 46 }} />
      <ParticipaPill delay={L(61.11, start)} />
    </div>
    <Burst at={L(61.11, start) + 7} x={1030} y={632} size={120} />
  </AbsoluteFill>
);

// A block of lines that fades out at a given frame (two text phases share one column)
const Phase: React.FC<{ until?: number; children: React.ReactNode }> = ({ until, children }) => {
  const frame = useCurrentFrame();
  const o = until === undefined ? 1 : interpolate(frame, [until - 6, until], [1, 0], clamp);
  return <div style={{ position: "absolute", left: 0, top: 0, opacity: o, transform: `translateX(${(1 - o) * -60}px)`, visibility: o <= 0 ? "hidden" : "visible" }}>{children}</div>;
};

// CNE logo in the corner, as in the reference spot
const Bug: React.FC<{ logos: "cor" | "mono" }> = ({ logos }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [sec(0.3), sec(0.9), sec(58.2), sec(58.4)], [0, 1, 1, 0], clamp);
  const mono = logos === "mono";
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Img src={staticFile(mono ? "eleicao-branco.png" : "eleicao-cor.png")} style={{ position: "absolute", left: 60, top: 40, height: 96 }} />
      <Img src={staticFile("cne.png")} style={{ position: "absolute", right: 60, top: 52, height: 66, filter: mono ? "brightness(0) invert(1)" : undefined }} />
    </AbsoluteFill>
  );
};

export const SPOT4_DURATION = sec(67.9);

export const Spot4: React.FC<Spot4Props> = ({ variant, logos = "mono" }) => {
  const withBg = variant === "cor";
  return (
    <BgCtx.Provider value={withBg}>
      <AbsoluteFill>
        <Scene from={0} to={1.95} name="01 15 de Novembro" bg={TEAL} cam={{ exit: { kind: "zoomIn", ox: 960, oy: 540, len: 9 } }}>
          <S1 />
        </Scene>
        <Scene from={1.95} to={6.1} name="02 De servico?" bg={OCEAN} cam={{ enter: { len: 12 } }}>
          <S2 start={1.95} />
        </Scene>
        {/* the professions sit underneath while "a solução" recedes (zoom out) */}
        <Scene from={8.45} to={23.7} name="04 Categorias profissionais" bg={TEAL} cam={{ enter: { len: 14 }, push: true }}>
          <S4 start={8.45} />
        </Scene>
        <Scene from={6.1} to={8.85} name="03 O voto antecipado pode ser a solucao" bg={BRIGHT} cam={{ exit: { kind: "zoomOut", len: 13 } }}>
          <S3 start={6.1} />
        </Scene>
        {/* the Câmara scene sits underneath while the calendar recedes (zoom out) */}
        <Scene from={28.8} to={38.3} name="06 Camara Municipal 31 out - 3 nov" bg={BRIGHT} cam={{ enter: { len: 14 } }}>
          <S6 start={28.8} />
        </Scene>
        <Scene from={23.7} to={29.2} name="05 Calendario 8-9 Nov" bg={TEAL} cam={{ exit: { kind: "zoomOut", len: 13 } }}>
          <S5 start={23.7} />
        </Scene>
        <Scene from={38.3} to={47.3} name="07 Formulario disponivel" bg={TEAL} cam={{ push: true, exit: { kind: "zoomIn", ox: 440, oy: 560, len: 10 } }}>
          <S7 start={38.3} />
        </Scene>
        <Scene from={47.3} to={53.4} name="08 Sites CNE e DGAPE" bg={OCEAN} cam={{ enter: { flash: true, len: 14 } }}>
          <S8 start={47.3} />
        </Scene>
        <Scene from={53.4} to={58.35} name="09 Linha gratuita" bg={TEAL} cam={{ exit: { kind: "zoomIn", ox: 440, oy: 690, len: 9 } }}>
          <S9 start={53.4} />
        </Scene>
        <Scene from={58.35} to={62.3} name="10 Cada voto conta. O teu também. Participa!" bg={TEAL} cam={{ enter: { flash: true, len: 14 } }}>
          <S10 start={58.35} />
        </Scene>
        <Sequence from={sec(62.3)} name="11 Logo final">
          {withBg && <AbsoluteFill style={{ background: LIGHT }} />}
          <LogoAnim variant="cor" />
        </Sequence>

        <Bug logos={logos} />

        {TRANSITIONS.map((tr) => (
          <Sequence key={tr.at} from={sec(tr.at) - 8} durationInFrames={17} name={`${tr.kind} ${tr.at}`}>
            {tr.kind === "wipe" ? <Wipe /> : tr.kind === "iris" ? <Iris cx={tr.cx} cy={tr.cy} /> : <Bars />}
          </Sequence>
        ))}

        <Audio src={staticFile("spot/vo_servico.mp3")} trimBefore={sec(OFF)} />
      </AbsoluteFill>
    </BgCtx.Provider>
  );
};
