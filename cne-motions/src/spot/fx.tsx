import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SANS } from "../theme";
import { RED, ease } from "./kit";
import { DEEP } from "./devices";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------- Transitions (17 frames, fully covered at frame 8) ----------

// Iris: a navy disc grows from a point, then opens from its centre
export const Iris: React.FC<{ cx?: number; cy?: number }> = ({ cx = 960, cy = 540 }) => {
  const frame = useCurrentFrame();
  const R = 1250;
  const r1 = ease(frame, 0, 8, Easing.in(Easing.cubic)) * R;
  const r2 = ease(frame, 8, 16, Easing.out(Easing.cubic)) * R;
  const ring = ease(frame, 2, 9) * R * 0.98;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080">
        <circle cx={cx} cy={cy} r={ring} fill="none" stroke={RED} strokeWidth={frame < 8 ? 40 : 0} />
        <path
          fillRule="evenodd"
          fill={DEEP}
          d={`M ${cx - r1} ${cy} a ${r1} ${r1} 0 1 0 ${2 * r1} 0 a ${r1} ${r1} 0 1 0 ${-2 * r1} 0 Z M ${cx - r2} ${cy} a ${r2} ${r2} 0 1 0 ${2 * r2} 0 a ${r2} ${r2} 0 1 0 ${-2 * r2} 0 Z`}
        />
      </svg>
    </AbsoluteFill>
  );
};

// Bars: vertical bands drop in one after another and continue out at the bottom
export const Bars: React.FC = () => {
  const frame = useCurrentFrame();
  const n = 6;
  const w = 1920 / n;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {Array.from({ length: n }).map((_, i) => {
        const d = i * 0.5;
        const yIn = interpolate(frame, [d, 6 + d * 0.4], [-1100, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
        const yOut = interpolate(frame, [8.5 + d * 0.6, 16], [0, 1100], { ...clamp, easing: Easing.in(Easing.cubic) });
        return <div key={i} style={{ position: "absolute", left: i * w - 1, top: 0, width: w + 2, height: 1080, background: i % 3 === 1 ? RED : DEEP, transform: `translateY(${frame < 8.5 ? yIn : yOut}px)` }} />;
      })}
    </AbsoluteFill>
  );
};

// ---------- Background life: slow bokeh and a soft light sweep ----------
export const BgTexture: React.FC<{ seed: string }> = ({ seed }) => {
  const frame = useCurrentFrame();
  const dots = Array.from({ length: 7 }).map((_, i) => ({
    x: random(`${seed}-x-${i}`) * 1920,
    y: random(`${seed}-y-${i}`) * 1080,
    r: 120 + random(`${seed}-r-${i}`) * 260,
    vx: (random(`${seed}-vx-${i}`) - 0.5) * 0.6,
    vy: (random(`${seed}-vy-${i}`) - 0.5) * 0.4,
    o: 0.04 + random(`${seed}-o-${i}`) * 0.05,
  }));
  const sweep = ((frame * 6) % 3400) - 900;
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: d.x + d.vx * frame - d.r,
            top: d.y + d.vy * frame - d.r,
            width: d.r * 2,
            height: d.r * 2,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(255,255,255,${d.o}) 0%, rgba(255,255,255,0) 70%)`,
          }}
        />
      ))}
      <div style={{ position: "absolute", top: -300, left: sweep, width: 260, height: 1700, transform: "rotate(18deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.06), rgba(255,255,255,0))" }} />
    </AbsoluteFill>
  );
};

// ---------- Small burst of light when something lands ----------
export const Burst: React.FC<{ at: number; x: number; y: number; size?: number; color?: string }> = ({ at, x, y, size = 120, color = "#FFFFFF" }) => {
  const frame = useCurrentFrame();
  const p = ease(frame, at, at + 12, Easing.out(Easing.cubic));
  if (frame < at || frame > at + 14) return null;
  return (
    <svg width={size * 2} height={size * 2} viewBox={`${-size} ${-size} ${size * 2} ${size * 2}`} style={{ position: "absolute", left: x - size, top: y - size, pointerEvents: "none", opacity: 1 - p }}>
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        const r0 = size * (0.35 + 0.5 * p);
        const r1 = size * (0.55 + 0.45 * p);
        return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1} stroke={color} strokeWidth={6} strokeLinecap="round" />;
      })}
    </svg>
  );
};

// ---------- Browser window with the address being typed, then the real site ----------
export const BrowserWindow: React.FC<{ delay: number; typeAt: number; loadAt: number; width: number; url: string; screen: string }> = ({ delay, typeAt, loadAt, width, url, screen }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 15, mass: 0.8 } });
  const n = Math.floor(interpolate(frame, [typeAt, typeAt + url.length * 1.6], [0, url.length], clamp));
  const caret = frame >= typeAt - 6 && n < url.length && Math.floor(frame / 7) % 2 === 0;
  const loadBar = ease(frame, loadAt - 8, loadAt + 4);
  const show = ease(frame, loadAt, loadAt + 10);
  const scroll = ease(frame, loadAt + 18, loadAt + 60) * 90;
  const floatY = Math.sin(frame / 20) * 6;
  const sh = width * 0.6;
  const cur = ease(frame, loadAt + 22, loadAt + 40, Easing.inOut(Easing.cubic));
  const click = interpolate(frame, [loadAt + 42, loadAt + 45, loadAt + 50], [1, 0.85, 1], clamp);
  return (
    <div style={{ perspective: 2200 }}>
      <div
        style={{
          width,
          transform: `translateY(${(1 - p) * 160 + floatY}px) rotateY(${-16 + (1 - p) * -14}deg) rotateX(${5}deg)`,
          opacity: interpolate(p, [0, 0.25], [0, 1], clamp),
          visibility: p < 0.01 ? "hidden" : "visible",
          borderRadius: 18,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "30px 40px 70px rgba(10,30,70,0.35)",
          position: "relative",
        }}
      >
        {/* window chrome */}
        <div style={{ height: 54, background: "#EEF1F6", display: "flex", alignItems: "center", gap: 10, padding: "0 20px" }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
          ))}
          <div style={{ marginLeft: 18, height: 34, borderRadius: "10px 10px 0 0", background: "#fff", padding: "0 18px", display: "flex", alignItems: "center", fontFamily: SANS, fontSize: 16, color: "#2A3350", fontWeight: 600 }}>
            Comissão Nacional de Eleições
          </div>
        </div>
        <div style={{ height: 62, display: "flex", alignItems: "center", padding: "0 20px", borderBottom: "1px solid #E3E7EF", position: "relative" }}>
          <div style={{ flex: 1, height: 42, borderRadius: 21, background: "#F2F4F8", display: "flex", alignItems: "center", padding: "0 18px", gap: 12 }}>
            <svg width="16" height="20" viewBox="0 0 16 20">
              <rect x="1" y="8" width="14" height="11" rx="2" fill="#1E9E5A" />
              <path d="M4 8 V5 a4 4 0 0 1 8 0 V8" fill="none" stroke="#1E9E5A" strokeWidth="2.4" />
            </svg>
            <span style={{ fontFamily: SANS, fontSize: 24, fontWeight: 500, color: "#1A2238", letterSpacing: 0.5 }}>
              {url.slice(0, n)}
              <span style={{ opacity: caret ? 1 : 0 }}>|</span>
            </span>
          </div>
          <div style={{ position: "absolute", left: 0, bottom: -1, height: 3, width: `${loadBar * 100}%`, background: RED, opacity: 1 - show }} />
        </div>
        <div style={{ position: "relative", height: sh, overflow: "hidden", background: "#F7F9FC" }}>
          <Img src={staticFile(screen)} style={{ width, opacity: show, transform: `translateY(${-scroll}px) scale(${1.03 - 0.03 * show})`, transformOrigin: "top center" }} />
        </div>
      </div>
      {/* cursor gliding to the page and clicking */}
      <svg
        width="54"
        height="70"
        viewBox="0 0 70 90"
        style={{ position: "absolute", left: interpolate(cur, [0, 1], [width * 0.95, width * 0.42]), top: interpolate(cur, [0, 1], [sh + 160, sh * 0.55]), transform: `scale(${click})`, opacity: cur > 0 ? 1 : 0 }}
      >
        <path d="M6 4 L6 70 L22 55 L34 82 L46 76 L34 50 L56 50 Z" fill="#1A2238" stroke="#fff" strokeWidth="5" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// ---------- Free line: handset badge + digits flipping in like a departure board ----------
export const Handset: React.FC<{ delay: number; size: number }> = ({ delay, size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 11, mass: 0.7 } });
  const shake = frame > delay + 10 ? Math.sin(frame * 1.9) * 7 * Math.max(0, Math.sin(((frame - delay) / 25) * Math.PI)) : 0;
  return (
    <div style={{ position: "relative", width: size, height: size, transform: `scale(${p})`, visibility: p < 0.01 ? "hidden" : "visible" }}>
      {[0, 1, 2].map((i) => {
        const t = ((frame - delay) / 30 + i / 3) % 1;
        return <div key={i} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "6px solid rgba(255,255,255,0.7)", transform: `scale(${1 + t * 0.6})`, opacity: frame > delay ? 1 - t : 0 }} />;
      })}
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 24px 50px rgba(10,30,70,0.3)" }}>
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 200 200" style={{ transform: `rotate(${shake}deg)` }}>
          <path
            d="M58 30 C 48 26, 38 30, 30 40 L 20 54 C 12 66, 14 82, 22 98 C 40 136, 66 162, 104 180 C 120 188, 136 188, 148 180 L 160 170 C 170 162, 172 150, 166 142 L 146 118 C 140 110, 128 108, 120 114 L 106 124 C 88 114, 76 102, 66 84 L 76 70 C 82 62, 82 50, 74 44 Z"
            fill={DEEP}
          />
        </svg>
      </div>
    </div>
  );
};

export const FlipGroup: React.FC<{ text: string; at: number; size: number }> = ({ text, at, size }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap: 8, perspective: 800 }}>
      {text.split("").map((ch, i) => {
        const d = at + i * 1.5;
        const p = ease(frame, d, d + 6, Easing.out(Easing.back(1.6)));
        return (
          <div
            key={i}
            style={{
              width: size * 0.74,
              height: size * 1.18,
              borderRadius: 14,
              background: "#fff",
              boxShadow: "0 14px 26px rgba(10,30,70,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              transform: `rotateX(${(1 - p) * -95}deg)`,
              transformOrigin: "50% 0%",
              opacity: p > 0.02 ? 1 : 0,
            }}
          >
            <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: size, color: DEEP, lineHeight: 1 }}>{ch}</span>
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 2, background: "rgba(20,30,80,0.12)" }} />
          </div>
        );
      })}
    </div>
  );
};
