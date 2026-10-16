import React from "react";
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LogoAnim } from "../LogoAnim";
import { SANS } from "../theme";
import { Art, Line, RED, Underline, ease, sec, useExit } from "./kit";
import { VoteBox, Calendar, DatePage, HospitalIcon, InstitutionIcon } from "./vectors";
import { BRIGHT, DEEP, Kicker, LIGHT, OCEAN, TEAL } from "./devices";
import { Bars, BgTexture, Burst, FlipGroup, Handset, Iris } from "./fx";

// Spot "Voto antecipado – doentes internados e presos" (new voice-over, Oct 2026).
// Same look and devices as Spot2; all cue times below are seconds of the trimmed voice-over
// (the original file starts with a title read by mistake, cut at OFF).
export type Spot3Props = { variant: "cor" | "alpha"; logos?: "cor" | "mono" };
const OFF = 3.55;

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
  { at: 8.6, kind: "wipe" },
  { at: 16.7, kind: "iris", cx: 1450, cy: 520 },
  { at: 25.1, kind: "wipe" },
  { at: 33.4, kind: "wipe" },
  { at: 44.7, kind: "iris", cx: 440, cy: 530 },
  { at: 53.75, kind: "bars" },
];

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
  const pop = spring({ frame: frame - L(1.6, 0), fps, config: { damping: 12, mass: 0.7 } });
  const count = Math.max(1, Math.min(15, Math.round(interpolate(frame, [L(1.6, 0), L(1.6, 0) + 12], [1, 15], clamp))));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Kicker delay={L(0.2, 0)} size={54} align="center">
          Eleição Presidencial
        </Kicker>
        <div style={{ height: 30 }} />
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 240, lineHeight: 0.9, color: W, transform: `scale(${0.6 + 0.4 * pop})`, opacity: pop > 0.01 ? 1 : 0 }}>{count}</div>
        <div style={{ height: 18 }} />
        <T d={L(2.05, 0)} size={84} box={DEEP} align="center" spacing={6}>
          Novembro
        </T>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// "Nenhum eleitor perde a possibilidade de votar por se encontrar internado ou preso"
const S2: React.FC<{ start: number }> = ({ start }) => (
  <AbsoluteFill>
    <div style={{ position: "absolute", left: 250, top: 300 }}>
      <VoteBox delay={L(2.95, start)} size={380} />
    </div>
    <Sequence from={0} durationInFrames={L(5.6, start)} layout="none">
      <Exit len={6}>
        <div style={{ position: "absolute", left: 760, top: 360 }}>
          <Kicker delay={L(3.0, start)} size={60}>
            Nenhum eleitor perde
          </Kicker>
          <div style={{ height: 22 }} />
          <T d={L(4.25, start)} size={120}>
            a possibilidade
          </T>
          <T d={L(5.0, start)} size={150} box={RED}>
            de votar
          </T>
        </div>
      </Exit>
    </Sequence>
    <Sequence from={L(5.6, start)} layout="none">
      <div style={{ position: "absolute", left: 760, top: 380 }}>
        <Kicker delay={0} size={60}>
          Por estar
        </Kicker>
        <div style={{ height: 18 }} />
        <T d={L(6.1, start) - L(5.6, start)} size={140}>
          internado
        </T>
        <T d={L(6.9, start) - L(5.6, start)} size={140} box={RED}>
          ou preso
        </T>
      </div>
    </Sequence>
  </AbsoluteFill>
);

const S3: React.FC<{ start: number }> = ({ start }) => (
  <AbsoluteFill>
    <Halo x={640} y={620} size={940} />
    <Art src="spot/doente.png" delay={L(8.65, start)} from="left" float={4} style={{ left: 90, top: 320, width: 1080 }} />
    <div style={{ position: "absolute", left: 1170, top: 170 }}>
      <HospitalIcon delay={L(9.0, start)} size={170} />
      <div style={{ height: 36 }} />
      <Kicker delay={L(9.37, start)} size={56}>
        Internados em
      </Kicker>
      <div style={{ height: 10 }} />
      <T d={L(10.09, start)} size={120}>
        hospitais
      </T>
      <Underline delay={L(10.4, start)} width={220} align="left" />
      <div style={{ height: 26 }} />
      <Kicker delay={L(10.95, start)} size={36}>
        ou estabelecimentos
      </Kicker>
      <div style={{ height: 6 }} />
      <Kicker delay={L(11.4, start)} size={36}>
        equiparados
      </Kicker>
    </div>
  </AbsoluteFill>
);

const S3b: React.FC<{ start: number }> = ({ start }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 90 }}>
      <InstitutionIcon delay={L(12.75, start)} size={380} />
      <div>
        <Kicker delay={L(13.31, start)} size={54}>
          Presos em
        </Kicker>
        <div style={{ height: 18 }} />
        <T d={L(13.81, start)} size={96}>
          estabelecimentos
        </T>
        <T d={L(14.37, start)} size={110} box={DEEP}>
          prisionais
        </T>
        <div style={{ height: 26 }} />
        <Kicker delay={L(15.43, start)} size={38}>
          ou centros equiparados
        </Kicker>
      </div>
    </div>
  </AbsoluteFill>
);

const S4: React.FC<{ start: number }> = ({ start }) => (
  <AbsoluteFill>
    <div style={{ position: "absolute", left: 150, top: 330 }}>
      <Kicker delay={L(16.83, start)} size={58}>
        Podem votar
      </Kicker>
      <div style={{ height: 14 }} />
      <T d={L(17.59, start)} size={88} box={DEEP}>
        antecipadamente
      </T>
      <div style={{ height: 40 }} />
      <Kicker delay={L(18.9, start)} size={40}>
        de 2 a 5 de novembro
      </Kicker>
      <Underline delay={L(20.9, start)} width={260} align="left" />
    </div>
    <div style={{ position: "absolute", left: 1220, top: 150, transform: "scale(0.88)", transformOrigin: "top left" }}>
      <Calendar delay={L(16.9, start)} markAt={[19.45, 19.78, 20.1, 20.43].map((s) => L(s, start))} />
    </div>
    <Burst at={L(20.43, start) + 6} x={1560} y={380} size={90} />
  </AbsoluteFill>
);

// "Para beneficiar dessa modalidade de voto" – its own beat, so the Câmara only arrives with "devem requerer"
const S4b: React.FC<{ start: number }> = ({ start }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <Kicker delay={L(21.91, start)} size={60} align="center">
      Para beneficiar
    </Kicker>
    <div style={{ height: 20 }} />
    <T d={L(22.95, start)} size={120} align="center">
      desta modalidade
    </T>
    <T d={L(23.95, start)} size={150} box={RED} align="center">
      de voto
    </T>
    <Burst at={L(23.95, start) + 7} x={1290} y={690} size={120} />
  </AbsoluteFill>
);

const S5: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const back = ease(frame, L(29.9, start), L(30.5, start), Easing.inOut(Easing.cubic));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${1 - 0.07 * back})`, filter: back > 0 ? `blur(${7 * back}px) brightness(${1 - 0.22 * back})` : undefined }}>
        <Halo x={620} y={600} size={980} />
        <Art src="spot/camara.png" delay={L(25.15, start)} from="scale" float={3} style={{ left: 60, top: 320, width: 1080 }} />
        <div style={{ position: "absolute", left: 1150, top: 200 }}>
          <Kicker delay={L(25.25, start)} size={40}>
            Requeira o voto
          </Kicker>
          <div style={{ height: 6 }} />
          <Kicker delay={L(25.6, start)} size={40}>
            antecipado
          </Kicker>
          <div style={{ height: 18 }} />
          <T d={L(27.13, start)} size={84}>
            na Câmara
          </T>
          <T d={L(27.39, start)} size={92} box={DEEP}>
            Municipal
          </T>
          <div style={{ height: 22 }} />
          <Kicker delay={L(28.05, start)} size={36}>
            do concelho onde
          </Kicker>
          <div style={{ height: 6 }} />
          <Kicker delay={L(28.4, start)} size={36}>
            está recenseado
          </Kicker>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(10,30,90,${0.28 * back})` }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div style={{ transform: "scale(1.75)", margin: "0 110px" }}>
            <DatePage delay={L(30.6, start)} day="29" month="OUT" />
          </div>
          <div>
            <Kicker delay={L(30.33, start)} size={64}>
              até
            </Kicker>
            <T d={L(30.99, start)} size={110}>
              29 de
            </T>
            <T d={L(32.03, start)} size={110} box={RED}>
              outubro
            </T>
          </div>
        </div>
      </AbsoluteFill>
      <Burst at={L(30.6, start) + 8} x={700} y={330} size={160} />
    </AbsoluteFill>
  );
};

const Tag: React.FC<{ delay: number; children: React.ReactNode; center: number; top: number }> = ({ delay, children, center, top }) => {
  const frame = useCurrentFrame();
  const p = ease(frame, delay, delay + 10, Easing.out(Easing.cubic));
  return (
    <div style={{ position: "absolute", top, left: center, transform: `translateX(-50%) translateY(${(1 - p) * 20}px)`, opacity: p, visibility: p <= 0 ? "hidden" : "visible", background: DEEP, borderRadius: 30, padding: "9px 26px", whiteSpace: "nowrap" }}>
      <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 32, color: W, letterSpacing: "0.14em" }}>{children}</span>
    </div>
  );
};

// A block of lines that fades out at a given frame (two text phases share one column)
const Phase: React.FC<{ until?: number; children: React.ReactNode }> = ({ until, children }) => {
  const frame = useCurrentFrame();
  const o = until === undefined ? 1 : interpolate(frame, [until - 6, until], [1, 0], clamp);
  return <div style={{ position: "absolute", left: 0, top: 0, opacity: o, transform: `translateX(${(1 - o) * -60}px)`, visibility: o <= 0 ? "hidden" : "visible" }}>{children}</div>;
};

// "O formulário pode ser solicitado ao diretor do respetivo estabelecimento, a quem cabe assegurar
// a sua disponibilização em tempo útil aos eleitores internados ou detidos"
const S6: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const swap = ease(frame, L(38.0, start), L(38.3, start), Easing.in(Easing.cubic));
  const B2 = L(38.17, start);
  return (
    <Exit>
      <Halo x={600} y={620} size={920} />
      <AbsoluteFill style={{ opacity: 1 - swap, transform: `translateX(${-320 * swap}px)` }}>
        <Art src="spot/doente.png" delay={0} from="scale" style={{ left: -10, top: 440, width: 820 }} />
        <Art src="spot/funcionario.png" delay={L(33.7, start)} from="right" float={3} style={{ left: 690, top: 250, height: 790 }} />
        <Tag delay={L(34.0, start)} center={560} top={985}>
          HOSPITAIS
        </Tag>
      </AbsoluteFill>
      <Art src="spot/apoio_recluso.png" delay={L(38.32, start)} from="bottom" float={3} style={{ left: 250, top: 200, height: 770 }} />
      <Tag delay={L(38.75, start)} center={520} top={990}>
        ESTABELECIMENTOS PRISIONAIS
      </Tag>
      <div style={{ position: "absolute", left: 1180, top: 300 }}>
        <Phase until={B2}>
          <Kicker delay={L(33.85, start)} size={40}>
            Solicite
          </Kicker>
          <div style={{ height: 6 }} />
          <Kicker delay={L(34.2, start)} size={40}>
            o formulário
          </Kicker>
          <div style={{ height: 10 }} />
          <T d={L(36.03, start)} size={78}>
            ao diretor
          </T>
          <div style={{ height: 18 }} />
          <Kicker delay={L(36.63, start)} size={40}>
            do respetivo
          </Kicker>
          <div style={{ height: 8 }} />
          <T d={L(37.13, start)} size={60} box={DEEP}>
            estabelecimento
          </T>
        </Phase>
        <Phase>
          <Kicker delay={L(39.43, start)} size={40}>
            Disponível
          </Kicker>
          <div style={{ height: 10 }} />
          <T d={L(40.89, start)} size={78}>
            em tempo útil
          </T>
          <div style={{ height: 18 }} />
          <Kicker delay={L(41.97, start)} size={40}>
            aos eleitores
          </Kicker>
          <div style={{ height: 8 }} />
          <T d={L(42.4, start)} size={60} box={DEEP}>
            internados
          </T>
          <T d={L(43.55, start)} size={60} box={RED}>
            ou detidos
          </T>
        </Phase>
      </div>
    </Exit>
  );
};

// Free line: a handset badge on the left, the number flips in tile by tile on the right
const S8: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const pill = ease(frame, L(45.2, start), L(45.2, start) + 10, Easing.out(Easing.cubic));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 230, top: 320 }}>
        <Handset delay={L(44.85, start)} size={420} />
      </div>
      <div style={{ position: "absolute", left: 860, top: 300 }}>
        <div style={{ display: "inline-block", background: RED, borderRadius: 40, padding: "12px 30px", clipPath: `inset(0 ${100 - pill * 100}% 0 0 round 40px)`, visibility: pill <= 0 ? "hidden" : "visible" }}>
          <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 34, color: W, letterSpacing: "0.2em" }}>LINHA VERDE GRATUITA</span>
        </div>
        <div style={{ display: "flex", gap: 30, marginTop: 34 }}>
          <FlipGroup text="800" at={L(47.7, start)} size={150} />
          <FlipGroup text="10" at={L(48.1, start)} size={150} />
          <FlipGroup text="14" at={L(48.5, start)} size={150} />
        </div>
        <div style={{ height: 34 }} />
        <Kicker delay={L(46.3, start)} size={42}>
          Ligue gratuitamente
        </Kicker>
      </div>
      <Burst at={L(48.5, start) + 10} x={1622} y={500} size={130} />
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

const S9: React.FC<{ start: number }> = ({ start }) => (
  <AbsoluteFill>
    <Halo x={560} y={640} size={900} />
    <Art src="spot/idoso.png" delay={L(49.85, start)} from="left" style={{ left: 120, top: 220, height: 860 }} />
    <div style={{ position: "absolute", left: 980, top: 170 }}>
      <Kicker delay={L(49.94, start)} size={64}>
        Cada voto
      </Kicker>
      <div style={{ height: 6 }} />
      <T d={L(50.6, start)} size={150}>
        conta.
      </T>
      <div style={{ height: 26 }} />
      <T d={L(51.39, start)} size={78} box={DEEP}>
        O teu também.
      </T>
      <div style={{ height: 46 }} />
      <ParticipaPill delay={L(52.57, start)} />
    </div>
    <Burst at={L(52.57, start) + 7} x={1030} y={632} size={120} />
  </AbsoluteFill>
);

// CNE logo in the corner, as in the reference spot
const Bug: React.FC<{ logos: "cor" | "mono" }> = ({ logos }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [sec(0.3), sec(0.9), sec(49.65), sec(49.85)], [0, 1, 1, 0], clamp);
  const mono = logos === "mono";
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Img src={staticFile(mono ? "eleicao-branco.png" : "eleicao-cor.png")} style={{ position: "absolute", left: 60, top: 40, height: 96 }} />
      <Img src={staticFile("cne.png")} style={{ position: "absolute", right: 60, top: 52, height: 66, filter: mono ? "brightness(0) invert(1)" : undefined }} />
    </AbsoluteFill>
  );
};

export const SPOT3_DURATION = sec(59.3);

export const Spot3: React.FC<Spot3Props> = ({ variant, logos = "mono" }) => {
  const withBg = variant === "cor";
  return (
    <BgCtx.Provider value={withBg}>
      <AbsoluteFill>
        <Scene from={0} to={2.9} name="01 15 de Novembro" bg={TEAL} cam={{ exit: { kind: "zoomIn", ox: 960, oy: 540, len: 9 } }}>
          <S1 />
        </Scene>
        <Scene from={2.9} to={8.6} name="02 Nenhum eleitor perde a possibilidade de votar" bg={OCEAN} cam={{ enter: { len: 12 } }}>
          <S2 start={2.9} />
        </Scene>
        {/* the prison scene sits underneath while the hospital recedes (zoom out) */}
        <Scene from={12.1} to={16.7} name="03b Estabelecimentos prisionais" bg={OCEAN} cam={{ enter: { len: 14 }, push: true }}>
          <S3b start={12.1} />
        </Scene>
        <Scene from={8.6} to={12.55} name="03 Hospitais" bg={TEAL} cam={{ exit: { kind: "zoomOut", len: 13 }, push: true }}>
          <S3 start={8.6} />
        </Scene>
        {/* the Câmara scene sits underneath while the calendar recedes (zoom out) */}
        <Scene from={21.3} to={25.1} name="04b Para beneficiar desta modalidade de voto" bg={OCEAN} cam={{ enter: { len: 14 } }}>
          <S4b start={21.3} />
        </Scene>
        <Scene from={25.1} to={33.4} name="05 Camara Municipal ate 29 out" bg={BRIGHT} cam={{ enter: { len: 12 } }}>
          <S5 start={25.1} />
        </Scene>
        <Scene from={16.7} to={21.7} name="04 Calendario 2-5 Nov" bg={TEAL} cam={{ exit: { kind: "zoomOut", len: 13 } }}>
          <S4 start={16.7} />
        </Scene>
        <Scene from={33.4} to={44.7} name="06 Formulario com o diretor" bg={TEAL} cam={{ push: true }}>
          <S6 start={33.4} />
        </Scene>
        <Scene from={44.7} to={49.8} name="08 Linha gratuita" bg={TEAL} cam={{ exit: { kind: "zoomIn", ox: 440, oy: 690, len: 9 } }}>
          <S8 start={44.7} />
        </Scene>
        <Scene from={49.8} to={53.75} name="09 Cada voto conta. O teu também. Participa!" bg={TEAL} cam={{ enter: { flash: true, len: 14 } }}>
          <S9 start={49.8} />
        </Scene>
        <Sequence from={sec(53.75)} name="10 Logo final">
          {withBg && <AbsoluteFill style={{ background: LIGHT }} />}
          <LogoAnim variant="cor" />
        </Sequence>

        <Bug logos={logos} />

        {TRANSITIONS.map((tr) => (
          <Sequence key={tr.at} from={sec(tr.at) - 8} durationInFrames={17} name={`${tr.kind} ${tr.at}`}>
            {tr.kind === "wipe" ? <Wipe /> : tr.kind === "iris" ? <Iris cx={tr.cx} cy={tr.cy} /> : <Bars />}
          </Sequence>
        ))}

        <Audio src={staticFile("spot/vo_presos.mp3")} trimBefore={sec(OFF)} />
      </AbsoluteFill>
    </BgCtx.Provider>
  );
};
