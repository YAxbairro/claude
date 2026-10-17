import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SANS } from "../theme";
import { NAVY, RED, ease } from "./kit";
import { DEEP, FLAG_BLUE, FLAG_RED, Kicker, STAR } from "./devices";
import { HospitalIcon, InstitutionIcon } from "./vectors";

// Alternative openers for "Nenhum eleitor perde a possibilidade de votar / por estar internado ou preso"
// (replacing the ballot box). Cue frames are relative to the scene start:
//   a = first phrase, b = second phrase, c = "internado", d = "preso".
export type Cues = { a: number; b: number; c: number; d: number };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const W = "#FFFFFF";

const useSpr = (delay: number, damping = 12, mass = 0.6) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass } });
};

// Small round badges carried by the highlighted figures
const CrossBadge: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="48" fill={RED} stroke={W} strokeWidth="6" />
    <path d="M40 22 H60 V40 H78 V60 H60 V78 H40 V60 H22 V40 H40 Z" fill={W} />
  </svg>
);
const BuildingBadge: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="48" fill={DEEP} stroke={W} strokeWidth="6" />
    <path d="M22 42 L50 24 L78 42 Z" fill={W} />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={28 + i * 12} y="46" width="7" height="22" rx="2" fill={W} />
    ))}
    <rect x="22" y="70" width="56" height="7" rx="2" fill={W} />
  </svg>
);

// ---------- A: a crowd of voters, two of them are singled out ----------
const Person: React.FC<{ color: string }> = ({ color }) => (
  <svg width="86" height="110" viewBox="0 0 86 110">
    <circle cx="43" cy="26" r="21" fill={color} />
    <path d="M6 108 C 6 64, 80 64, 80 108 Z" fill={color} />
  </svg>
);

export const CrowdOpener: React.FC<{ cues: Cues }> = ({ cues }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cols = 5;
  const rows = 4;
  const focus = [6, 13]; // "internado", "preso"
  const dim = ease(frame, cues.b, cues.b + 12);
  return (
    <div style={{ position: "absolute", left: 110, top: 270, width: 620, height: 560 }}>
      {Array.from({ length: cols * rows }).map((_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        // wave from the bottom-left corner
        const delay = cues.a + (r + c) * 2.2;
        const p = spring({ frame: frame - delay, fps, config: { damping: 10, mass: 0.5 } });
        const bob = Math.sin((frame - delay) / 7 + i) * 4 * (frame > delay ? 1 : 0);
        const fi = focus.indexOf(i);
        const at = fi === 0 ? cues.c : cues.d;
        const hl = fi >= 0 ? spring({ frame: frame - at, fps, config: { damping: 9, mass: 0.6 } }) : 0;
        const scale = p * (1 - 0.12 * dim * (fi >= 0 ? 0 : 1) + 0.32 * hl);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c * 124 + (r % 2) * 30,
              top: r * 132 + bob,
              transform: `scale(${scale})`,
              transformOrigin: "50% 100%",
              opacity: fi >= 0 ? 1 : 1 - 0.62 * dim,
              filter: fi < 0 && dim > 0 ? `blur(${dim * 2.5}px)` : undefined,
              zIndex: fi >= 0 ? 2 : 1,
            }}
          >
            <Person color={fi >= 0 && hl > 0.01 ? W : "rgba(255,255,255,0.9)"} />
            {fi >= 0 && (
              <div style={{ position: "absolute", left: 50, top: -18, transform: `scale(${hl})` }}>
                {fi === 0 ? <CrossBadge size={56} /> : <BuildingBadge size={56} />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ---------- B: the vote travels — a paper plane loops a figure-eight and visits both places ----------
const planeAt = (t: number) => {
  // t in turns; figure-eight around two lobes
  const a = t * Math.PI * 2;
  return { x: 425 + 300 * Math.sin(a), y: 560 + 165 * Math.sin(2 * a) };
};

export const PlaneOpener: React.FC<{ cues: Cues }> = ({ cues }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const enter = ease(frame, cues.a, cues.a + 10, Easing.out(Easing.cubic));
  if (frame < cues.a) return null;
  const speed = 1 / 78; // turns per frame
  const tOf = (f: number) => (f - cues.a) * speed + 0.06;
  const t = tOf(frame);
  const pos = planeAt(t);
  const ahead = planeAt(t + 0.004);
  const ang = (Math.atan2(ahead.y - pos.y, ahead.x - pos.x) * 180) / Math.PI;
  // trail: the last stretch of the path, fading out towards its tail
  const trail: string[] = [];
  const n = 46;
  for (let i = n; i >= 0; i--) {
    const f = frame - i * 0.9;
    if (f < cues.a) continue;
    const q = planeAt(tOf(f));
    trail.push(`${q.x.toFixed(1)},${q.y.toFixed(1)}`);
  }
  const fadeOut = 1 - ease(frame, durationInFrames - 8, durationInFrames);
  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <div style={{ position: "absolute", left: 425 - 300 * 0.71 - 95, top: 560 - 95 }}>
        <HospitalIcon delay={cues.c} size={190} />
      </div>
      <div style={{ position: "absolute", left: 425 + 300 * 0.71 - 95, top: 560 - 95 }}>
        <InstitutionIcon delay={cues.d} size={190} />
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="trailFade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={W} />
          </linearGradient>
        </defs>
        <polyline points={trail.join(" ")} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={6} strokeDasharray="14 14" strokeLinecap="round" />
        <g transform={`translate(${pos.x} ${pos.y}) rotate(${ang}) scale(${enter * 1.25})`} style={{ filter: "drop-shadow(0 12px 18px rgba(0,0,0,0.25))" }}>
          <path d="M48 0 L-34 -34 L-18 0 Z" fill={W} />
          <path d="M48 0 L-34 34 L-18 0 Z" fill="#DCE4F2" />
          <path d="M48 0 L-18 0 L-26 14 Z" fill="#B8C4DA" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ---------- C: full-screen kinetic typography, then two cards split the screen ----------
const SlamWord: React.FC<{ text: string; delay: number; size: number; color?: string; weight?: number; stagger?: number }> = ({ text, delay, size, color = W, weight = 800, stagger = 1.4 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", justifyContent: "center", whiteSpace: "pre" }}>
      {text.split("").map((ch, i) => {
        const p = spring({ frame: frame - delay - i * stagger, fps, config: { damping: 13, mass: 0.5 } });
        return (
          <span
            key={i}
            style={{
              fontFamily: SANS,
              fontWeight: weight,
              fontSize: size,
              color,
              lineHeight: 1.02,
              display: "inline-block",
              opacity: interpolate(p, [0, 0.25], [0, 1], clamp),
              transform: `translateY(${(1 - p) * 60}px) scale(${2.2 - 1.2 * p})`,
              filter: `blur(${(1 - Math.min(1, p)) * 8}px)`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

const SplitCard: React.FC<{ delay: number; from: "left" | "right"; label: string; icon: React.ReactNode }> = ({ delay, from, label, icon }) => {
  const p = useSpr(delay, 13, 0.7);
  const dx = (from === "left" ? -900 : 900) * (1 - p);
  return (
    <div
      style={{
        width: 540,
        height: 300,
        borderRadius: 34,
        background: "rgba(255,255,255,0.14)",
        border: "3px solid rgba(255,255,255,0.55)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        transform: `translateX(${dx}px) rotate(${(from === "left" ? -5 : 5) * (1 - p)}deg)`,
        opacity: interpolate(p, [0, 0.2], [0, 1], clamp),
      }}
    >
      {icon}
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 72, color: W, letterSpacing: 1 }}>{label}</div>
    </div>
  );
};

export const KineticOpener: React.FC<{ cues: Cues }> = ({ cues }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // phase 1 flies towards the camera when phase 2 starts
  const out = ease(frame, cues.b - 4, cues.b + 6, Easing.in(Easing.cubic));
  const stamp = spring({ frame: frame - (cues.a + 33), fps, config: { damping: 8, mass: 0.6 } });
  const shake = frame > cues.a + 33 && frame < cues.a + 41 ? Math.sin(frame * 3) * 6 : 0;
  return (
    <AbsoluteFill>
      {out < 1 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 140, transform: `scale(${1 + out * 1.6})`, opacity: 1 - out, filter: `blur(${out * 10}px)` }}>
          <SlamWord text="NENHUM ELEITOR" delay={cues.a} size={124} />
          <div style={{ height: 8 }} />
          <Kicker delay={cues.a + 18} size={52} align="center">
            perde a possibilidade
          </Kicker>
          <div style={{ height: 26 }} />
          <div style={{ transform: `scale(${2.4 - 1.4 * stamp}) rotate(${-4 + 4 * stamp}deg) translateX(${shake}px)`, opacity: interpolate(stamp, [0, 0.15], [0, 1], clamp) }}>
            <div style={{ background: RED, padding: "6px 36px 14px", borderRadius: 10, fontFamily: SANS, fontWeight: 800, fontSize: 140, color: W, lineHeight: 1 }}>DE VOTAR</div>
          </div>
        </AbsoluteFill>
      )}
      {frame >= cues.b && (
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 170 }}>
          <Kicker delay={cues.b + 2} size={58} align="center">
            Por estar
          </Kicker>
          <div style={{ height: 40 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <SplitCard delay={cues.c - 4} from="left" label="Internado" icon={<CrossBadge size={120} />} />
            <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 56, color: W, opacity: ease(frame, cues.d - 6, cues.d + 2) }}>ou</div>
            <SplitCard delay={cues.d - 2} from="right" label="Preso" icon={<BuildingBadge size={120} />} />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ---------- D: voter card flips in with a shine, rings pulse; then it links to both places ----------
const FlagMini: React.FC<{ w: number }> = ({ w }) => {
  const h = w * 0.6;
  return (
    <svg width={w} height={h} viewBox="0 0 100 60" style={{ borderRadius: 4 }}>
      <rect width="100" height="60" fill={FLAG_BLUE} />
      <rect y="30" width="100" height="10" fill={W} />
      <rect y="33.3" width="100" height="3.4" fill={FLAG_RED} />
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return <circle key={i} cx={38 + Math.cos(a) * 13} cy={36 + Math.sin(a) * 13} r="2.2" fill={STAR} />;
      })}
    </svg>
  );
};

const Connector: React.FC<{ x1: number; y1: number; x2: number; y2: number; delay: number }> = ({ x1, y1, x2, y2, delay }) => {
  const frame = useCurrentFrame();
  const p = ease(frame, delay, delay + 12, Easing.out(Easing.cubic));
  const len = Math.hypot(x2 - x1, y2 - y1);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
      <line x1={x1} y1={y1} x2={x1 + (x2 - x1) * p} y2={y1 + (y2 - y1) * p} stroke="rgba(255,255,255,0.8)" strokeWidth={6} strokeDasharray="12 12" strokeDashoffset={-frame * 1.5} strokeLinecap="round" />
      {p > 0.98 && <circle cx={x2} cy={y2} r={9} fill={W} />}
      {len < 0 && null}
    </svg>
  );
};

export const CardOpener: React.FC<{ cues: Cues }> = ({ cues }) => {
  const frame = useCurrentFrame();
  const p = useSpr(cues.a, 14, 0.8);
  const shine = ease(frame, cues.a + 14, cues.a + 30, Easing.inOut(Easing.quad));
  const lift = ease(frame, cues.b - 2, cues.b + 12);
  const lines = ease(frame, cues.a + 10, cues.a + 24, Easing.out(Easing.cubic));
  const cx = 410;
  const cy = 520 - 130 * lift;
  return (
    <AbsoluteFill>
      {/* pulse rings: the vote reaches everyone */}
      {[0, 1, 2].map((k) => {
        const t = ((frame - cues.a - 6 - k * 14) % 42) / 42;
        if (frame < cues.a + 6 + k * 14) return null;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: cx - 300,
              top: cy - 300,
              width: 600,
              height: 600,
              borderRadius: "50%",
              border: "4px solid rgba(255,255,255,0.5)",
              transform: `scale(${0.4 + 0.9 * t})`,
              opacity: (1 - t) * (1 - lift),
            }}
          />
        );
      })}
      {lift > 0 && (
        <>
          <Connector x1={cx - 120} y1={cy + 160} x2={220} y2={770} delay={cues.c - 6} />
          <Connector x1={cx + 120} y1={cy + 160} x2={600} y2={770} delay={cues.d - 6} />
          <div style={{ position: "absolute", left: 220 - 80, top: 770 - 30 }}>
            <HospitalIcon delay={cues.c} size={160} />
          </div>
          <div style={{ position: "absolute", left: 600 - 80, top: 770 - 30 }}>
            <InstitutionIcon delay={cues.d} size={160} />
          </div>
        </>
      )}
      <div style={{ position: "absolute", left: cx - 280, top: cy - 175, width: 560, height: 350, perspective: 1400 }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 26,
            background: W,
            overflow: "hidden",
            boxShadow: "0 30px 70px rgba(5,15,50,0.4)",
            transform: `rotateY(${(1 - p) * -95}deg) rotateZ(${(1 - p) * -8}deg) scale(${(0.6 + 0.4 * p) * (1 - 0.18 * lift)})`,
            opacity: interpolate(p, [0, 0.15], [0, 1], clamp),
            position: "relative",
          }}
        >
          <div style={{ height: 78, background: NAVY, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 26px" }}>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 30, color: W, letterSpacing: 2 }}>CARTÃO DE ELEITOR</div>
            <FlagMini w={70} />
          </div>
          <div style={{ display: "flex", padding: "30px 28px", gap: 28 }}>
            <svg width="150" height="180" viewBox="0 0 150 180">
              <rect width="150" height="180" rx="14" fill="#DDE3EE" />
              <circle cx="75" cy="70" r="32" fill="#9AA6BD" />
              <path d="M22 180 C 22 116, 128 116, 128 180 Z" fill="#9AA6BD" />
            </svg>
            <div style={{ flex: 1, paddingTop: 10 }}>
              {[300, 220, 260, 160].map((w, i) => (
                <div key={i} style={{ width: w * lines, height: i === 0 ? 22 : 14, borderRadius: 8, background: i === 0 ? NAVY : "#C9CED9", marginBottom: i === 0 ? 26 : 20, maxWidth: "100%" }} />
              ))}
            </div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 14, background: RED }} />
          {/* shine sweep */}
          <div style={{ position: "absolute", top: -100, bottom: -100, width: 140, left: -200 + shine * 1000, transform: "rotate(20deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.75), rgba(255,255,255,0))" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
