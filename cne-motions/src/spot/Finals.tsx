import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LogoAnim } from "../LogoAnim";
import { SANS } from "../theme";
import { Art, RED, ease, sec } from "./kit";
import { DEEP, Flag, Kicker, LIGHT, TEAL } from "./devices";
import { Halo, T, Wipe } from "./Spot2";

// Three alternative endings for "Cada voto conta. O teu também. Participa!" (voice 33.5s–36.0s).
// Each option plays the same slice of the voice-over, 33.0s → 38.2s of the spot.
const BASE = 33.0;
const END = 38.2;
const A = (abs: number) => sec(abs) - sec(BASE);
const W = "#FFFFFF";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Shared tail: the approved colour wipe into the animated election logo
const Tail: React.FC = () => (
  <>
    <Sequence from={A(36.45)}>
      <AbsoluteFill style={{ background: LIGHT }} />
      <LogoAnim variant="cor" />
    </Sequence>
    <Sequence from={A(36.45) - 8} durationInFrames={17}>
      <Wipe />
    </Sequence>
  </>
);

const Fade: React.FC<{ from: number; to: number; children: React.ReactNode; dy?: number }> = ({ from, to, children, dy = 0 }) => {
  const frame = useCurrentFrame();
  // quick in, quicker out: each sentence stays readable for as long as possible
  const kIn = Math.max(1, Math.min(6, Math.floor((to - from) / 3)));
  const kOut = Math.max(1, Math.min(3, Math.floor((to - from) / 3)));
  const o = interpolate(frame, [from, from + kIn, to - kOut, to], [0, 1, 1, 0], clamp);
  const y = interpolate(frame, [from, from + kIn, to - kOut, to], [dy, 0, 0, -dy], { ...clamp, easing: Easing.out(Easing.cubic) });
  return <AbsoluteFill style={{ opacity: o, transform: `translateY(${y}px)`, visibility: o <= 0 ? "hidden" : "visible" }}>{children}</AbsoluteFill>;
};

// ---------- Option 1: one continuous card, the sentence builds up next to the voter ----------
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

const Option1: React.FC = () => (
  <AbsoluteFill style={{ background: TEAL }}>
    <Halo x={560} y={640} size={900} />
    <Art src="spot/idoso.png" delay={0} from="left" style={{ left: 120, top: 220, height: 860 }} />
    <div style={{ position: "absolute", left: 980, top: 250 }}>
      <Kicker delay={A(33.52)} size={64}>
        Cada voto
      </Kicker>
      <div style={{ height: 6 }} />
      <T d={A(33.96)} size={150}>
        conta.
      </T>
      <div style={{ height: 26 }} />
      <T d={A(34.74)} size={78} box={DEEP}>
        O teu também.
      </T>
      <div style={{ height: 46 }} />
      <ParticipaPill delay={A(35.28)} />
    </div>
    <Tail />
  </AbsoluteFill>
);

// ---------- Option 2: the waving flag carries the whole ending ----------
const BigWords: React.FC<{ words: { t: string; at: number; red?: boolean; size: number }[] }> = ({ words }) => (
  <div style={{ position: "absolute", left: 150, top: 300 }}>
    {words.map((w, i) => (
      <T key={i} d={A(w.at)} size={w.size} box={w.red ? RED : undefined}>
        {w.t}
      </T>
    ))}
  </div>
);

const Option2: React.FC = () => {
  const frame = useCurrentFrame();
  const track = interpolate(frame, [A(35.28), A(35.28) + 24], [0.4, 0.08], clamp);
  const pop = spring({ frame: frame - A(35.28), fps: 25, config: { damping: 13, mass: 0.6 } });
  return (
    <AbsoluteFill style={{ background: DEEP }}>
      <AbsoluteFill style={{ transform: "scale(1.12)" }}>
        <Flag width={1920} height={1080} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(20,28,80,0.92) 0%, rgba(20,28,80,0.72) 45%, rgba(20,28,80,0.15) 100%)" }} />
      <Fade from={0} to={A(34.72)} dy={-30}>
        <BigWords
          words={[
            { t: "Cada voto", at: 33.52, size: 120 },
            { t: "conta.", at: 33.96, size: 170, red: true },
          ]}
        />
      </Fade>
      <Fade from={A(34.72)} to={A(35.26)} dy={-30}>
        <BigWords
          words={[
            { t: "O teu", at: 34.7, size: 120 },
            { t: "também.", at: 34.95, size: 170 },
          ]}
        />
      </Fade>
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 150, visibility: pop < 0.01 ? "hidden" : "visible" }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 210, color: W, letterSpacing: `${track}em`, transform: `scale(${0.85 + 0.15 * pop})`, transformOrigin: "left center", opacity: Math.min(1, pop * 2), textShadow: "0 10px 40px rgba(0,0,0,0.35)" }}>
          PARTICIPA!
        </div>
      </AbsoluteFill>
      <Tail />
    </AbsoluteFill>
  );
};

// ---------- Option 3: the ballot drops into the box on "conta", then leads into the logo ----------
const Urn: React.FC<{ dropAt: number }> = ({ dropAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = ease(frame, 0, 14);
  const card = spring({ frame: frame - 4, fps, config: { damping: 16, mass: 0.7 } });
  const drop = ease(frame, dropAt - 4, dropAt + 6, Easing.in(Easing.cubic));
  const land = spring({ frame: frame - dropAt - 6, fps, config: { damping: 7, mass: 0.4 } });
  const squash = frame > dropAt + 6 ? Math.sin(land * Math.PI) * 0.04 : 0;
  const hover = Math.sin(frame / 9) * 6 * (1 - drop);
  const xDraw = ease(frame, 10, 20);
  const y = -230 + (1 - card) * -120 + hover + drop * 330;
  return (
    <svg width="760" height="480" viewBox="0 0 760 480" style={{ overflow: "visible" }}>
      <defs>
        <clipPath id="urnAbove">
          <rect x="-200" y="-800" width="1200" height="1062" />
        </clipPath>
      </defs>
      <g clipPath="url(#urnAbove)">
        <g transform={`translate(0 ${y})`} opacity={card > 0.02 ? 1 : 0}>
          <g transform="rotate(-6 380 260)">
            <rect x="290" y="80" width="180" height="230" rx="10" fill={RED} />
            <path d="M342 160 L418 250 M418 160 L342 250" stroke="#fff" strokeWidth="22" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - xDraw} />
          </g>
        </g>
      </g>
      <g transform={`translate(380 300) scale(${1 + squash} ${1 - squash}) translate(-380 -300)`}>
        <path d="M30 300 L130 238 L630 238 L730 300" fill="none" stroke="#fff" strokeWidth="14" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lines} />
        <rect x={380 - 170 * lines} y="256" width={340 * lines} height="14" rx="3" fill="#fff" />
        <rect x={380 - 380 * lines} y="320" width={760 * lines} height="24" fill="#fff" />
        <rect x={380 - 380 * lines} y="366" width={760 * lines} height="12" fill={RED} />
      </g>
    </svg>
  );
};

const Option3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - A(35.28), fps, config: { damping: 10, mass: 0.6 } });
  return (
    <AbsoluteFill style={{ background: DEEP }}>
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 120, width: 1920, height: 200 }}>
          <Fade from={0} to={A(34.72)} dy={-20}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 30 }}>
              <Kicker delay={A(33.52)} size={70} align="center">
                Cada voto
              </Kicker>
              <T d={A(33.96)} size={120} align="center">
                conta.
              </T>
            </div>
          </Fade>
          <Fade from={A(34.72)} to={A(36.6)} dy={-20}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 30 }}>
              <Kicker delay={A(34.7)} size={70} align="center">
                O teu
              </Kicker>
              <T d={A(34.95)} size={120} align="center">
                também.
              </T>
            </div>
          </Fade>
        </div>
        <div style={{ position: "absolute", top: 380 }}>
          <Urn dropAt={A(33.96)} />
        </div>
        <div style={{ position: "absolute", top: 900, transform: `scale(${pop})`, visibility: pop < 0.01 ? "hidden" : "visible" }}>
          <div style={{ background: RED, padding: "10px 46px", fontFamily: SANS, fontWeight: 800, fontSize: 92, color: W, letterSpacing: 6 }}>PARTICIPA!</div>
        </div>
      </AbsoluteFill>
      <Tail />
    </AbsoluteFill>
  );
};

// ---------- Review reel: title card + option, three times, with the matching voice slice ----------
const TITLE = 22;
const SEG = sec(END) - sec(BASE);

const TitleCard: React.FC<{ n: number; name: string }> = ({ n, name }) => (
  <AbsoluteFill style={{ background: "#11183A", alignItems: "center", justifyContent: "center" }}>
    <Kicker delay={0} size={40} align="center">
      Final do spot
    </Kicker>
    <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 130, color: W, marginTop: 10 }}>OPÇÃO {n}</div>
    <div style={{ fontFamily: SANS, fontWeight: 300, fontSize: 40, color: "#C9D2E6", letterSpacing: "0.12em", marginTop: 6 }}>{name}</div>
  </AbsoluteFill>
);

export const FINALS_DURATION = 3 * (TITLE + SEG);

export const FinalsReel: React.FC = () => {
  const opts = [
    { n: 1, name: "CARTÃO CONTÍNUO", C: Option1 },
    { n: 2, name: "BANDEIRA", C: Option2 },
    { n: 3, name: "URNA", C: Option3 },
  ];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {opts.map((o, i) => {
        const start = i * (TITLE + SEG);
        return (
          <React.Fragment key={o.n}>
            <Sequence from={start} durationInFrames={TITLE} name={`Opção ${o.n} – título`}>
              <TitleCard n={o.n} name={o.name} />
            </Sequence>
            <Sequence from={start + TITLE} durationInFrames={SEG} name={`Opção ${o.n}`}>
              <o.C />
              <Audio src={staticFile("spot/vo.mp3")} trimBefore={sec(BASE)} trimAfter={sec(END)} />
            </Sequence>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
