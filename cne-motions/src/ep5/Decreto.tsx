import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { NAVY, RED, SANS, WHITE } from "../theme";

// "Como é eleito o Presidente" – the part where she reads the decree becomes a full-screen graphic.
// Times are seconds of the episode; the clip starts at START and hard-cuts at END (the next camera cut).
const FPS = 24000 / 1001;
const START = 107.5;
const END = 131.92;
export const DECRETO_DURATION = Math.round((END - START) * FPS);
const f = (abs: number) => Math.round((abs - START) * FPS);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (frame: number, a: number, b: number, e = Easing.out(Easing.cubic)) => interpolate(frame, [a, b], [0, 1], { ...clamp, easing: e });
const DEEP = "#121B33";
const BLUE = "#2B4C8C";
const GOLD = "#F7D116";

const useSpr = (delay: number, damping = 13, mass = 0.7) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass } });
};

// ---------- Background: deep navy, slow drifting light, fine diagonal lines, flag stripe ----------
const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const blobs = [
    { x: 300, y: 260, r: 520, c: "rgba(60,110,200,0.35)", sx: 0.6, sy: 0.4 },
    { x: 1550, y: 820, r: 640, c: "rgba(40,80,170,0.32)", sx: -0.5, sy: -0.3 },
    { x: 1250, y: 180, r: 380, c: "rgba(227,60,46,0.12)", sx: -0.3, sy: 0.5 },
  ];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #22345E 0%, ${DEEP} 70%)`, overflow: "hidden" }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: b.x - b.r + Math.sin(frame / 90 + i) * 80 * b.sx,
            top: b.y - b.r + Math.cos(frame / 110 + i) * 60 * b.sy,
            width: b.r * 2,
            height: b.r * 2,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${b.c} 0%, rgba(0,0,0,0) 70%)`,
          }}
        />
      ))}
      <AbsoluteFill
        style={{
          backgroundImage: "repeating-linear-gradient(-30deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 2px, transparent 2px, transparent 46px)",
          backgroundPosition: `${frame * 0.6}px 0px`,
        }}
      />
      {/* ten stars circling slowly, as on the flag */}
      <svg width={900} height={900} viewBox="-450 -450 900 900" style={{ position: "absolute", right: -260, top: -300, opacity: 0.08, transform: `rotate(${frame * 0.08}deg)` }}>
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return <Star key={i} x={Math.cos(a) * 330} y={Math.sin(a) * 330} r={34} fill={WHITE} />;
        })}
      </svg>
      {/* flag stripe at the bottom */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 18, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, background: WHITE }} />
        <div style={{ flex: 1, background: RED }} />
        <div style={{ flex: 1, background: WHITE }} />
      </div>
    </AbsoluteFill>
  );
};

const Star: React.FC<{ x: number; y: number; r: number; fill: string }> = ({ x, y, r, fill }) => {
  const pts = Array.from({ length: 10 })
    .map((_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 === 0 ? r : r * 0.42;
      return `${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`;
    })
    .join(" ");
  return <polygon points={pts} fill={fill} />;
};

// ---------- Typed-on text ----------
const Typed: React.FC<{ text: string; at: number; style: React.CSSProperties; cps?: number }> = ({ text, at, style, cps = 18 }) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor(((frame - at) / FPS) * cps)));
  const caret = frame >= at && n < text.length && Math.floor(frame / 6) % 2 === 0;
  return (
    <span style={{ ...style, visibility: frame < at ? "hidden" : "visible", whiteSpace: "nowrap" }}>
      {text.slice(0, n)}
      <span style={{ opacity: caret ? 1 : 0 }}>|</span>
    </span>
  );
};

// ---------- The decree: a paper sheet that slides in, then is stamped ----------
const Decree: React.FC = () => {
  const frame = useCurrentFrame();
  const p = useSpr(f(111.1), 14, 0.8);
  const stamp = useSpr(f(115.9), 9, 0.6);
  const lines = ease(frame, f(113.6), f(115.0));
  // moves to the left and shrinks when the dates arrive
  const side = ease(frame, f(116.5), f(117.4), Easing.inOut(Easing.cubic));
  const x = interpolate(side, [0, 1], [960, 400]);
  const s = interpolate(side, [0, 1], [1, 0.74]);
  return (
    <div
      style={{
        position: "absolute",
        left: x - 290,
        top: 250,
        width: 580,
        height: 760,
        transform: `translateY(${(1 - p) * 700}px) rotate(${(1 - p) * 10 - 2 * (1 - side) - 1}deg) scale(${s})`,
        transformOrigin: "50% 40%",
        opacity: interpolate(p, [0, 0.2], [0, 1], clamp),
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "#FBFAF6", borderRadius: 10, boxShadow: "0 40px 90px rgba(0,0,0,0.5)", padding: "52px 54px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <svg width={70} height={70} viewBox="-50 -50 100 100">
          <circle r={46} fill="none" stroke={NAVY} strokeWidth={4} />
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return <Star key={i} x={Math.cos(a) * 28} y={Math.sin(a) * 28} r={7} fill={NAVY} />;
          })}
        </svg>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 18, letterSpacing: "0.3em", color: "#5B6787", marginTop: 14 }}>REPÚBLICA DE CABO VERDE</div>
        <div style={{ width: 120, height: 4, background: RED, margin: "22px 0 26px" }} />
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 46, color: NAVY, lineHeight: 1.05, textAlign: "center" }}>DECRETO PRESIDENCIAL</div>
        <div style={{ height: 18 }} />
        <Typed text="N.º 22/2026" at={f(112.7)} cps={12} style={{ fontFamily: SANS, fontWeight: 900, fontSize: 58, color: RED }} />
        <div style={{ height: 6 }} />
        <Typed text="de 30 de junho" at={f(115.1)} cps={20} style={{ fontFamily: SANS, fontWeight: 600, fontSize: 32, color: NAVY }} />
        <div style={{ height: 34, alignSelf: "stretch" }} />
        {[1, 0.92, 0.97, 0.7, 0.88, 0.5].map((w, i) => (
          <div key={i} style={{ alignSelf: "flex-start", width: `${w * 100 * Math.min(1, Math.max(0, lines * 6 - i))}%`, height: 10, borderRadius: 5, background: "#D3D7E0", marginBottom: 16 }} />
        ))}
      </div>
      {/* stamp */}
      <div
        style={{
          position: "absolute",
          right: -40,
          bottom: 40,
          width: 190,
          height: 190,
          borderRadius: "50%",
          border: `8px solid ${RED}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${3 - 2 * stamp}) rotate(-14deg)`,
          opacity: interpolate(stamp, [0, 0.15], [0, 0.9], clamp),
          visibility: stamp < 0.01 ? "hidden" : "visible",
        }}
      >
        <div style={{ textAlign: "center", fontFamily: SANS, fontWeight: 900, color: RED, lineHeight: 1.05 }}>
          <div style={{ fontSize: 19, letterSpacing: "0.12em" }}>ELEIÇÃO</div>
          <div style={{ fontSize: 16, letterSpacing: "0.02em" }}>PRESIDENCIAL</div>
          <div style={{ fontSize: 40 }}>2026</div>
        </div>
      </div>
    </div>
  );
};

// ---------- Date card: a calendar page with the round of voting ----------
const DateCard: React.FC<{ enterAt: number; dayAt: number; round: string; day: string; note?: { text: string; at: number } }> = ({ enterAt, dayAt, round, day, note }) => {
  const frame = useCurrentFrame();
  const p = useSpr(enterAt, 12, 0.7);
  const d = useSpr(dayAt, 9, 0.5);
  const n = note ? useSpr(note.at, 11, 0.6) : 0;
  const ring = ease(frame, dayAt + 4, dayAt + 22);
  return (
    <div style={{ position: "relative", width: 400, transform: `translateY(${(1 - p) * 140}px) scale(${0.8 + 0.2 * p})`, opacity: interpolate(p, [0, 0.2], [0, 1], clamp), visibility: p < 0.01 ? "hidden" : "visible" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 26 }}>
        <div style={{ background: RED, padding: "10px 30px", borderRadius: 40 }}>
          <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 38, color: WHITE, letterSpacing: 1 }}>{round}</span>
        </div>
      </div>
      <div style={{ background: WHITE, borderRadius: 26, overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,0.45)" }}>
        <div style={{ background: NAVY, height: 92, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: WHITE, letterSpacing: "0.14em" }}>NOVEMBRO</span>
          {[110, 290].map((x) => (
            <div key={x} style={{ position: "absolute", top: -14, left: x - 9, width: 18, height: 40, borderRadius: 9, background: "#C9CED9", border: `4px solid ${DEEP}` }} />
          ))}
        </div>
        <div style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <svg width={290} height={236} viewBox="0 0 290 236" style={{ position: "absolute" }}>
            <ellipse cx="145" cy="118" rx="132" ry="106" fill="none" stroke={RED} strokeWidth="8" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} transform="rotate(-100 145 118)" />
          </svg>
          <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 170, color: NAVY, lineHeight: 1, transform: `scale(${d})`, display: "inline-block" }}>{day}</span>
        </div>
        <div style={{ borderTop: "3px solid #E6E9EF", padding: "16px 0", textAlign: "center" }}>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: NAVY, letterSpacing: "0.2em" }}>2026</span>
        </div>
      </div>
      {note && (
        <div style={{ position: "absolute", left: "50%", bottom: -80, transform: `translateX(-50%) scale(${n})`, visibility: n < 0.01 ? "hidden" : "visible", whiteSpace: "nowrap", border: `3px solid ${GOLD}`, padding: "8px 22px", borderRadius: 40 }}>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 30, color: GOLD, letterSpacing: "0.08em" }}>{note.text}</span>
        </div>
      )}
    </div>
  );
};

// Dashed connector between the two rounds
const Link: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const p = ease(frame, at, at + 16, Easing.inOut(Easing.cubic));
  return (
    <svg width={140} height={60} viewBox="0 0 140 60" style={{ alignSelf: "center", marginTop: 90 }}>
      <line x1="6" y1="30" x2={6 + 110 * p} y2="30" stroke={WHITE} strokeWidth="6" strokeDasharray="12 10" strokeLinecap="round" />
      <path d="M112 14 L132 30 L112 46" fill="none" stroke={WHITE} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity={p > 0.95 ? 1 : 0} />
    </svg>
  );
};

const Header: React.FC = () => {
  const frame = useCurrentFrame();
  const p = ease(frame, f(107.9), f(108.6));
  const logo = useSpr(f(108.0), 14, 0.7);
  // header shifts right with the dates
  const side = ease(frame, f(116.5), f(117.4), Easing.inOut(Easing.cubic));
  return (
    <div style={{ position: "absolute", top: 70, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translateX(${side * 300}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <Img src={staticFile("eleicao-branco.png")} style={{ height: 96, transform: `scale(${logo})` }} />
        <div style={{ clipPath: `inset(0 ${100 - p * 100}% 0 0)` }}>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: "0.3em", color: "#C9D2E6" }}>CALENDÁRIO ELEITORAL</div>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 52, color: WHITE, lineHeight: 1.1 }}>PRESIDENCIAIS 2026</div>
        </div>
      </div>
    </div>
  );
};

export const Decreto: React.FC = () => {
  const frame = useCurrentFrame();
  // enter: a navy panel with a red edge sweeps across the reading shot
  const wipe = ease(frame, 0, 12, Easing.inOut(Easing.cubic));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `polygon(${100 - wipe * 130}% 0, 100% 0, 100% 100%, ${100 - wipe * 130 + 12}% 100%)` }}>
        <Background />
        <Header />
        <Decree />
        <div style={{ position: "absolute", left: 760, right: 60, top: 300, display: "flex", justifyContent: "center", gap: 10 }}>
          <DateCard enterAt={f(116.9)} dayAt={f(120.18)} round="1.ª VOLTA" day="15" />
          <Link at={f(125.0)} />
          <DateCard enterAt={f(125.3)} dayAt={f(129.08)} round="2.ª VOLTA" day="29" note={{ text: "SE NECESSÁRIO", at: f(125.8) }} />
        </div>
      </AbsoluteFill>
      {wipe > 0 && wipe < 1 && (
        <div style={{ position: "absolute", top: 0, bottom: 0, width: 26, left: `${100 - wipe * 130}%`, background: RED, transform: "skewX(-6deg)" }} />
      )}
    </AbsoluteFill>
  );
};
