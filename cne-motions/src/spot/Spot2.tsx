import React from "react";
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LogoAnim } from "../LogoAnim";
import { SANS } from "../theme";
import { Art, Line, RED, Underline, ease, sec, useExit } from "./kit";
import { BallotIcon, Calendar, DatePage, HospitalIcon, InstitutionIcon } from "./vectors";
import { BRIGHT, DEEP, INDIGO, Kicker, LIGHT, TEAL } from "./devices";
import { Bars, BgTexture, BrowserWindow, Burst, FlipGroup, Handset, Iris } from "./fx";

// Spot "Voto antecipado" v2 – same script and timing as v1, restyled after the
// CNE "cadernos de recenseamento" spot: flat colour fields, white type, real website.
export type Spot2Props = { variant: "cor" | "alpha"; logos?: "cor" | "mono" };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const L = (abs: number, start: number) => sec(abs) - sec(start);
const W = "#FFFFFF";

const BgCtx = React.createContext(true);

// Camera moves between scenes: the outgoing scene can recede like a card (zoomOut) or the camera
// can dive into a point of it (zoomIn); the incoming scene can settle from a slight push.
type Cam = {
  exit?: { kind: "zoomOut"; len?: number } | { kind: "zoomIn"; ox: number; oy: number; len?: number };
  enter?: { flash?: boolean; len?: number };
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
export const Wipe: React.FC = () => {
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
  { at: 6.9, kind: "wipe" },
  { at: 11.5, kind: "iris", cx: 1450, cy: 520 },
  { at: 22.25, kind: "wipe" },
  { at: 36.45, kind: "bars" },
];

// Soft translucent disc behind illustrations
export const Halo: React.FC<{ x: number; y: number; size: number; delay?: number }> = ({ x, y, size, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 18, mass: 0.8 } });
  return <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: "50%", background: "rgba(255,255,255,0.16)", transform: `scale(${p})` }} />;
};

// White line helper (all type is white on the colour fields)
export const T: React.FC<{ d: number; size: number; box?: string; children: React.ReactNode; align?: "left" | "center" | "right"; weight?: number; spacing?: number }> = ({
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
  const pop = spring({ frame: frame - L(1.5, 0), fps, config: { damping: 12, mass: 0.7 } });
  const count = Math.max(1, Math.min(15, Math.round(interpolate(frame, [L(1.5, 0), L(1.5, 0) + 12], [1, 15], clamp))));
  return (
    <Exit>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Kicker delay={L(0.2, 0)} size={54} align="center">
          Eleições Presidenciais
        </Kicker>
        <div style={{ height: 30 }} />
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 240, lineHeight: 0.9, color: W, transform: `scale(${0.6 + 0.4 * pop})`, opacity: pop > 0.01 ? 1 : 0 }}>{count}</div>
        <div style={{ height: 18 }} />
        <T d={L(1.75, 0)} size={84} box={DEEP} align="center" spacing={6}>
          Novembro
        </T>
      </AbsoluteFill>
    </Exit>
  );
};

const S2: React.FC<{ start: number }> = ({ start }) => (
  <AbsoluteFill>
    <div style={{ position: "absolute", left: 250, top: 300 }}>
      <BallotIcon delay={L(3.0, start)} size={330} />
    </div>
    <Sequence from={0} durationInFrames={L(4.4, start)} layout="none">
      <Exit len={6}>
        <div style={{ position: "absolute", left: 760, top: 380 }}>
          <T d={L(3.2, start)} size={140}>
            Internado
          </T>
          <div style={{ height: 10 }} />
          <T d={L(3.76, start)} size={140} box={RED}>
            ou detido?
          </T>
        </div>
      </Exit>
    </Sequence>
    <Sequence from={L(4.4, start)} layout="none">
      <div style={{ position: "absolute", left: 760, top: 360 }}>
        <Kicker delay={2} size={64}>
          Não significa
        </Kicker>
        <div style={{ height: 22 }} />
        <T d={L(4.9, start) - L(4.4, start)} size={130}>
          ficar sem
        </T>
        <T d={L(5.4, start) - L(4.4, start)} size={160} box={RED}>
          votar
        </T>
      </div>
    </Sequence>
  </AbsoluteFill>
);

const S3: React.FC<{ start: number }> = ({ start }) => (
  <Exit len={7}>
    <Halo x={640} y={620} size={940} />
    <Art src="spot/doente.png" delay={L(6.95, start)} from="left" float={4} style={{ left: 90, top: 320, width: 1080 }} />
    <div style={{ position: "absolute", left: 1220, top: 270 }}>
      <HospitalIcon delay={L(7.5, start)} size={170} />
      <div style={{ height: 36 }} />
      <Kicker delay={L(7.66, start)} size={56}>
        Internado num
      </Kicker>
      <div style={{ height: 10 }} />
      <T d={L(8.22, start)} size={120}>
        hospital
      </T>
      <Underline delay={L(8.5, start)} width={220} align="left" />
    </div>
  </Exit>
);

const S3b: React.FC<{ start: number }> = ({ start }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 90 }}>
      <InstitutionIcon delay={L(9.4, start)} size={380} />
      <div>
        <Kicker delay={L(9.4, start)} size={54}>
          ou detido num
        </Kicker>
        <div style={{ height: 18 }} />
        <T d={L(9.94, start)} size={96}>
          estabelecimento
        </T>
        <T d={L(10.3, start)} size={110} box={DEEP}>
          prisional
        </T>
      </div>
    </div>
  </AbsoluteFill>
);

const S4: React.FC<{ start: number }> = ({ start }) => (
  <AbsoluteFill>
    <div style={{ position: "absolute", left: 150, top: 330 }}>
      <Kicker delay={L(11.6, start)} size={58}>
        Pode votar
      </Kicker>
      <div style={{ height: 14 }} />
      <T d={L(12.1, start)} size={88} box={DEEP}>
        antecipadamente
      </T>
      <div style={{ height: 40 }} />
      <Kicker delay={L(12.82, start)} size={40}>
        de 2 a 5 de novembro
      </Kicker>
      <Underline delay={L(13.2, start)} width={260} align="left" />
    </div>
    <div style={{ position: "absolute", left: 1220, top: 200 }}>
      <Calendar delay={L(11.7, start)} markAt={[13.42, 13.62, 13.78, 13.9].map((s) => L(s, start))} />
    </div>
    <Burst at={L(13.9, start) + 6} x={1600} y={440} size={90} />
  </AbsoluteFill>
);

const S5: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const shift = ease(frame, L(20.3, start), L(20.9, start));
  return (
    <AbsoluteFill>
      <Halo x={620 - 40 * shift} y={600} size={980} />
      <Art src="spot/camara.png" delay={L(14.95, start)} from="scale" float={3} style={{ left: 60 - 40 * shift, top: 320, width: 1080 }} />
      <div style={{ position: "absolute", left: 1150, top: 200 }}>
        <Kicker delay={L(15.96, start)} size={32}>
          Requeira o voto antecipado
        </Kicker>
        <div style={{ height: 18 }} />
        <T d={L(17.2, start)} size={84}>
          na Câmara
        </T>
        <T d={L(17.54, start)} size={92} box={DEEP}>
          Municipal
        </T>
        <div style={{ height: 22 }} />
        <Kicker delay={L(18.1, start)} size={24}>
          do concelho onde está recenseado
        </Kicker>
      </div>
      <div style={{ position: "absolute", left: 1150, top: 690, display: "flex", alignItems: "center", gap: 36 }}>
        <DatePage delay={L(20.6, start)} day="29" month="OUT" />
        <div>
          <Kicker delay={L(20.56, start)} size={44}>
            até
          </Kicker>
          <T d={L(20.9, start)} size={66}>
            29 de
          </T>
          <T d={L(21.2, start)} size={66}>
            outubro
          </T>
        </div>
      </div>
      <Burst at={L(20.6, start) + 8} x={1265} y={800} size={130} />
    </AbsoluteFill>
  );
};

const Tag: React.FC<{ delay: number; children: React.ReactNode; center: number; top: number }> = ({ delay, children, center, top }) => {
  const frame = useCurrentFrame();
  const p = ease(frame, delay, delay + 10, Easing.out(Easing.cubic));
  return (
    <div style={{ position: "absolute", top, left: center, transform: `translateX(-50%) translateY(${(1 - p) * 20}px)`, opacity: p, visibility: p <= 0 ? "hidden" : "visible", background: DEEP, borderRadius: 30, padding: "9px 26px", whiteSpace: "nowrap" }}>
      <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 26, color: W, letterSpacing: "0.18em" }}>{children}</span>
    </div>
  );
};

const S6: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const swap = ease(frame, L(23.7, start), L(24.0, start), Easing.in(Easing.cubic));
  return (
    <Exit>
      <Halo x={600} y={620} size={920} />
      <AbsoluteFill style={{ opacity: 1 - swap, transform: `translateX(${-320 * swap}px)` }}>
        <Art src="spot/doente.png" delay={0} from="scale" style={{ left: -10, top: 440, width: 820 }} />
        <Art src="spot/funcionario.png" delay={L(22.6, start)} from="right" float={3} style={{ left: 690, top: 250, height: 790 }} />
        <Tag delay={L(22.9, start)} center={560} top={985}>
          HOSPITAIS
        </Tag>
      </AbsoluteFill>
      <Art src="spot/apoio_recluso.png" delay={L(24.02, start)} from="bottom" float={3} style={{ left: 250, top: 200, height: 770 }} />
      <Tag delay={L(24.45, start)} center={520} top={990}>
        ESTABELECIMENTOS PRISIONAIS
      </Tag>
      <div style={{ position: "absolute", left: 1210, top: 320 }}>
        <Kicker delay={L(22.54, start)} size={44}>
          Com o apoio
        </Kicker>
        <div style={{ height: 10 }} />
        <T d={L(23.2, start)} size={78}>
          dos diretores
        </T>
        <div style={{ height: 18 }} />
        <Kicker delay={L(24.08, start)} size={34}>
          dos respetivos
        </Kicker>
        <div style={{ height: 8 }} />
        <T d={L(24.6, start)} size={60} box={DEEP}>
          estabelecimentos
        </T>
      </div>
    </Exit>
  );
};

// "Consulte o formulário em www.cne.cv": search bar types the address, the real site opens on a laptop
const Url: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const p = ease(frame, delay, delay + 12, Easing.out(Easing.cubic));
  return (
    <div style={{ clipPath: `inset(0 ${100 - p * 100}% 0 0)`, visibility: p <= 0 ? "hidden" : "visible", fontFamily: SANS, fontWeight: 800, fontSize: 104, color: W, letterSpacing: -1, whiteSpace: "nowrap" }}>www.cne.cv</div>
  );
};

// "Consulte o formulário em www.cne.cv": the address is written big on the left and typed in a
// tilted browser window on the right, where the real CNE site loads
const S7: React.FC<{ start: number }> = ({ start }) => (
  <Exit>
    <div style={{ position: "absolute", left: 130, top: 360 }}>
      <Kicker delay={L(25.54, start)} size={33}>
        Consulte o formulário em
      </Kicker>
      <div style={{ height: 14 }} />
      <Url delay={L(26.9, start)} />
      <Underline delay={L(27.3, start)} width={240} align="left" />
    </div>
    <div style={{ position: "absolute", left: 940, top: 250 }}>
      <BrowserWindow delay={L(25.7, start)} typeAt={L(26.6, start)} loadAt={L(27.8, start)} width={870} url="www.cne.cv" screen="spot/cne_site.png" />
    </div>
  </Exit>
);

// Free line: a handset badge on the left, the number flips in tile by tile on the right
const S8: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const pill = ease(frame, L(30.6, start), L(30.6, start) + 10, Easing.out(Easing.cubic));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 230, top: 320 }}>
        <Handset delay={L(30.2, start)} size={420} />
      </div>
      <div style={{ position: "absolute", left: 860, top: 300 }}>
        <div style={{ display: "inline-block", background: RED, borderRadius: 40, padding: "12px 30px", clipPath: `inset(0 ${100 - pill * 100}% 0 0 round 40px)`, visibility: pill <= 0 ? "hidden" : "visible" }}>
          <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 34, color: W, letterSpacing: "0.2em" }}>LINHA VERDE GRATUITA</span>
        </div>
        <div style={{ display: "flex", gap: 30, marginTop: 34 }}>
          <FlipGroup text="800" at={L(31.6, start)} size={150} />
          <FlipGroup text="10" at={L(32.3, start)} size={150} />
          <FlipGroup text="14" at={L(32.74, start)} size={150} />
        </div>
        <div style={{ height: 34 }} />
        <Kicker delay={L(30.94, start)} size={38}>
          Ligue gratuitamente
        </Kicker>
      </div>
      <Burst at={L(32.74, start) + 10} x={1622} y={500} size={130} />
    </AbsoluteFill>
  );
};

// Closing beats, as in the reference: three quick cards
// Chosen ending (option 1): one continuous card, the sentence builds next to the voter
export const ParticipaPill: React.FC<{ delay: number }> = ({ delay }) => {
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
    <Art src="spot/idoso.png" delay={L(33.4, start)} from="left" style={{ left: 120, top: 220, height: 860 }} />
    <div style={{ position: "absolute", left: 980, top: 250 }}>
      <Kicker delay={L(33.52, start)} size={64}>
        Cada voto
      </Kicker>
      <div style={{ height: 6 }} />
      <T d={L(33.96, start)} size={150}>
        conta.
      </T>
      <div style={{ height: 26 }} />
      <T d={L(34.74, start)} size={78} box={DEEP}>
        O teu também.
      </T>
      <div style={{ height: 46 }} />
      <ParticipaPill delay={L(35.28, start)} />
    </div>
    <Burst at={L(35.28, start) + 7} x={1030} y={712} size={120} />
  </AbsoluteFill>
);

// CNE logo in the corner, as in the reference spot
const Bug: React.FC<{ logos: "cor" | "mono" }> = ({ logos }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [sec(0.3), sec(0.9), sec(33.2), sec(33.4)], [0, 1, 1, 0], clamp);
  const mono = logos === "mono";
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Img src={staticFile(mono ? "eleicao-branco.png" : "eleicao-cor.png")} style={{ position: "absolute", left: 60, top: 40, height: 96 }} />
      <Img src={staticFile("cne.png")} style={{ position: "absolute", right: 60, top: 52, height: 66, filter: mono ? "brightness(0) invert(1)" : undefined }} />
    </AbsoluteFill>
  );
};

export const SPOT2_DURATION = sec(42);

export const Spot2: React.FC<Spot2Props> = ({ variant, logos = "mono" }) => {
  const withBg = variant === "cor";
  return (
    <BgCtx.Provider value={withBg}>
      <AbsoluteFill>
        <Scene from={0} to={3.0} name="01 15 de Novembro" bg={TEAL}>
          <S1 />
        </Scene>
        <Scene from={2.85} to={6.9} name="02 Internado ou detido" bg={DEEP}>
          <S2 start={2.85} />
        </Scene>
        <Scene from={6.9} to={9.45} name="03 Hospital" bg={TEAL}>
          <S3 start={6.9} />
        </Scene>
        <Scene from={9.3} to={11.5} name="03b Estabelecimento prisional" bg={INDIGO}>
          <S3b start={9.3} />
        </Scene>
        {/* the Câmara scene sits underneath while the calendar recedes (zoom out) */}
        <Scene from={14.8} to={22.25} name="05 Camara Municipal" bg={BRIGHT} cam={{ enter: { len: 14 } }}>
          <S5 start={14.8} />
        </Scene>
        <Scene from={11.5} to={15.2} name="04 Calendario 2-5 Nov" bg={TEAL} cam={{ exit: { kind: "zoomOut", len: 13 } }}>
          <S4 start={11.5} />
        </Scene>
        <Scene from={22.25} to={25.5} name="06 Apoio dos diretores" bg={TEAL}>
          <S6 start={22.25} />
        </Scene>
        <Scene from={25.35} to={30.25} name="07 Site www.cne.cv" bg={TEAL}>
          <S7 start={25.35} />
        </Scene>
        <Scene from={30.1} to={33.35} name="08 Linha gratuita" bg={TEAL} cam={{ exit: { kind: "zoomIn", ox: 440, oy: 690, len: 9 } }}>
          <S8 start={30.1} />
        </Scene>
        <Scene from={33.35} to={36.45} name="09 Cada voto conta. O teu também. Participa!" bg={TEAL} cam={{ enter: { flash: true, len: 14 } }}>
          <S9 start={33.35} />
        </Scene>
        <Sequence from={sec(36.45)} name="10 Logo final">
          {withBg && <AbsoluteFill style={{ background: LIGHT }} />}
          <LogoAnim variant="cor" />
        </Sequence>

        <Bug logos={logos} />

        {TRANSITIONS.map((tr) => (
          <Sequence key={tr.at} from={sec(tr.at) - 8} durationInFrames={17} name={`${tr.kind} ${tr.at}`}>
            {tr.kind === "wipe" ? <Wipe /> : tr.kind === "iris" ? <Iris cx={tr.cx} cy={tr.cy} /> : <Bars />}
          </Sequence>
        ))}

        <Audio src={staticFile("spot/vo.mp3")} />
      </AbsoluteFill>
    </BgCtx.Provider>
  );
};
