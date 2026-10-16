import "@fontsource/montserrat/300.css";
import "@fontsource/montserrat/500.css";
import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { SANS } from "../theme";
import { ease, useSpring } from "./kit";

// Palette taken from the CNE "cadernos de recenseamento" spot
export const TEAL = "#22A9CD";
export const BRIGHT = "#0AA2F5";
export const INDIGO = "#485BB2";
export const DEEP = "#212F6F";
export const OCEAN = "#1679C6"; // medium blue for scene fields (replaces the violet/indigo fields)
export const LIGHT = "#D3EAF3";
export const FLAG_BLUE = "#003893";
export const FLAG_RED = "#CF2027";
export const STAR = "#F7D116";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Thin, widely tracked white kicker ("LINHA GRATUITA") – letters close in as it fades up
export const Kicker: React.FC<{ delay: number; size: number; children: React.ReactNode; align?: "left" | "center" | "right"; color?: string }> = ({
  delay,
  size,
  children,
  align = "left",
  color = "#fff",
}) => {
  const frame = useCurrentFrame();
  const p = ease(frame, delay, delay + 14, Easing.out(Easing.cubic));
  return (
    <div
      style={{
        fontFamily: SANS,
        // medium weight, slightly larger and tighter: balances against the bold headlines
        fontWeight: 500,
        fontSize: Math.round(size * 1.12),
        color,
        letterSpacing: `${0.22 - 0.12 * p}em`,
        opacity: p,
        visibility: p <= 0 ? "hidden" : "visible",
        textAlign: align,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        transform: `translateY(${(1 - p) * 16}px)`,
      }}
    >
      {children}
    </div>
  );
};

// Soft depth-of-field: an element that has done its job drifts back and out of focus
export const Depth: React.FC<{ from: number; children: React.ReactNode; style?: React.CSSProperties; dx?: number }> = ({ from, children, style, dx = -60 }) => {
  const frame = useCurrentFrame();
  const k = ease(frame, from, from + 14);
  return (
    <div style={{ position: "absolute", ...style, filter: `blur(${k * 9}px)`, opacity: 1 - 0.45 * k, transform: `translateX(${dx * k}px) scale(${1 - 0.12 * k})` }}>
      {children}
    </div>
  );
};

// ---------- Search bar typing a URL ----------
export const SearchBar: React.FC<{ delay: number; text: string; width?: number; scale?: number }> = ({ delay, text, width = 760, scale = 1 }) => {
  const frame = useCurrentFrame();
  const p = useSpring(delay, 14, 0.6);
  const n = Math.floor(interpolate(frame, [delay + 6, delay + 6 + text.length * 2], [0, text.length], clamp));
  const caret = frame > delay + 4 && Math.floor(frame / 8) % 2 === 0;
  return (
    <div
      style={{
        width: width * scale,
        height: 118 * scale,
        borderRadius: 60 * scale,
        background: DEEP,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `0 ${44 * scale}px 0 ${60 * scale}px`,
        boxSizing: "border-box",
        boxShadow: "0 18px 40px rgba(10,30,70,0.25)",
        transform: `scaleX(${0.3 + 0.7 * p}) scaleY(${p})`,
        opacity: p > 0.01 ? 1 : 0,
      }}
    >
      <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 46 * scale, letterSpacing: "0.14em", color: "#fff", whiteSpace: "nowrap" }}>
        {text.slice(0, n)}
        <span style={{ opacity: caret && n < text.length ? 1 : 0 }}>_</span>
      </span>
      <svg width={64 * scale} height={64 * scale} viewBox="0 0 64 64">
        <circle cx="27" cy="27" r="19" stroke="#fff" strokeWidth="6" fill="none" />
        <path d="M41 41 L58 58" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
      </svg>
    </div>
  );
};

// ---------- Laptop showing the real CNE website ----------
export const Laptop: React.FC<{ delay: number; width: number; screen: string; scrollFrom?: number }> = ({ delay, width, screen, scrollFrom }) => {
  const frame = useCurrentFrame();
  const p = useSpring(delay, 15, 0.7);
  const open = ease(frame, delay + 4, delay + 20, Easing.out(Easing.cubic));
  const scroll = scrollFrom !== undefined ? ease(frame, scrollFrom, scrollFrom + 40) * 70 : 0;
  const sw = width * 0.84;
  const sh = sw * (900 / 1440);
  return (
    <div style={{ width, transform: `translateY(${(1 - p) * 140}px)`, opacity: interpolate(p, [0, 0.3], [0, 1], clamp), filter: "drop-shadow(0 30px 40px rgba(10,30,70,0.30))" }}>
      <div style={{ perspective: 1600 }}>
        <div
          style={{
            margin: "0 auto",
            width: sw + 28,
            background: "#1C2233",
            borderRadius: 18,
            padding: 14,
            transformOrigin: "bottom center",
            transform: `rotateX(${(1 - open) * -80}deg)`,
          }}
        >
          <div style={{ width: sw, height: sh, overflow: "hidden", borderRadius: 4, background: "#fff" }}>
            <Img src={staticFile(screen)} style={{ width: sw, transform: `translateY(${-scroll}px)` }} />
          </div>
        </div>
      </div>
      <div style={{ height: width * 0.03, background: "linear-gradient(#E9EDF3, #B9C1CE)", borderRadius: "0 0 22px 22px", marginTop: -2 }} />
      <div style={{ width: width * 0.16, height: 8, margin: "0 auto", background: "#9AA3B2", borderRadius: "0 0 8px 8px" }} />
    </div>
  );
};

// ---------- Phone calling the free line ----------
export const Phone: React.FC<{ delay: number; height: number; number: string; dialAt: number }> = ({ delay, height, number, dialAt }) => {
  const frame = useCurrentFrame();
  const p = useSpring(delay, 13, 0.7);
  const n = Math.floor(interpolate(frame, [dialAt, dialAt + number.length * 1.6], [0, number.length], clamp));
  const ring = (frame - dialAt) / 18;
  const w = height * 0.49;
  const u = height / 760;
  return (
    <div
      style={{
        width: w,
        height,
        borderRadius: 64 * u,
        background: "#1D2233",
        padding: 12 * u,
        boxSizing: "border-box",
        boxShadow: "0 30px 60px rgba(10,30,70,0.32), inset 0 0 0 3px #6B7BD6",
        transform: `translateY(${(1 - p) * 160}px) rotate(${(1 - p) * -8}deg)`,
        opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 52 * u, background: "#EEF1F6", overflow: "hidden", fontFamily: SANS, textAlign: "center" }}>
        <div style={{ position: "absolute", left: "50%", top: 0, width: 150 * u, height: 30 * u, background: "#1D2233", borderRadius: `0 0 ${18 * u}px ${18 * u}px`, transform: "translateX(-50%)" }} />
        <div style={{ marginTop: 62 * u, fontSize: 22 * u, color: "#4A5065", opacity: frame >= dialAt ? 1 : 0 }}>A telefonar</div>
        <div style={{ marginTop: 22 * u, fontSize: 44 * u, fontWeight: 500, color: "#14182A", letterSpacing: 1, height: 56 * u }}>{number.slice(0, n)}</div>
        <div style={{ position: "relative", margin: `${40 * u}px auto 0`, width: 150 * u, height: 150 * u }}>
          {[0, 1].map((i) => {
            const t = (((ring + i * 0.5) % 1) + 1) % 1;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: `${3 * u}px solid #E83E8C`,
                  transform: `scale(${1 + t * 0.7})`,
                  opacity: frame >= dialAt ? (1 - t) * 0.6 : 0,
                }}
              />
            );
          })}
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#F7A8D8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50 * u, fontWeight: 500, color: "#14182A" }}>
            CNE
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 150 * u, display: "flex", justifyContent: "center", gap: 18 * u }}>
          {["Teclado", "Silenciar", "Altifalante", "Mais"].map((l) => (
            <div key={l} style={{ width: 70 * u, textAlign: "center" }}>
              <div style={{ width: 64 * u, height: 64 * u, borderRadius: "50%", background: "#fff", margin: "0 auto", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }} />
              <div style={{ fontSize: 14 * u, color: "#4A5065", marginTop: 8 * u }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: "50%", bottom: 46 * u, width: 150 * u, height: 70 * u, borderRadius: 35 * u, background: "#D7262E", transform: "translateX(-50%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={44 * u} height={20 * u} viewBox="0 0 44 20">
            <path d="M3 13 C 12 2, 32 2, 41 13 L 36 18 L 29 13 L 29 9 C 24 7, 20 7, 15 9 L 15 13 L 8 18 Z" fill="#fff" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// ---------- Waving Cape Verde flag (full frame) ----------
// Built from vertical strips displaced by a travelling sine wave, with light/shadow folds.
export const Flag: React.FC<{ width: number; height: number; strips?: number }> = ({ width, height, strips = 90 }) => {
  const frame = useCurrentFrame();
  const sw = width / strips;
  // proportions of the flag: blue 6, white 1, red 1, white 1, blue 3 (12 units)
  const u = height / 12;
  const starsCx = width * 0.375;
  const starsCy = 7.5 * u;
  const R = 2.6 * u;
  const strip = (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect width={width} height={height} fill={FLAG_BLUE} />
      <rect y={6 * u} width={width} height={u} fill="#fff" />
      <rect y={7 * u} width={width} height={u} fill={FLAG_RED} />
      <rect y={8 * u} width={width} height={u} fill="#fff" />
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const x = starsCx + Math.cos(a) * R;
        const y = starsCy + Math.sin(a) * R;
        const r = 0.5 * u;
        const pts = Array.from({ length: 10 })
          .map((__, k) => {
            const ang = (k / 10) * Math.PI * 2 - Math.PI / 2;
            const rr = k % 2 === 0 ? r : r * 0.42;
            return `${x + Math.cos(ang) * rr},${y + Math.sin(ang) * rr}`;
          })
          .join(" ");
        return <polygon key={i} points={pts} fill={STAR} />;
      })}
    </svg>
  );
  return (
    <div style={{ position: "relative", width, height, overflow: "hidden" }}>
      {Array.from({ length: strips }).map((_, i) => {
        const phase = i / 9 - frame / 7;
        const dy = Math.sin(phase) * height * 0.035;
        const shade = Math.cos(phase);
        return (
          <div key={i} style={{ position: "absolute", left: i * sw, top: 0, width: sw + 1, height, overflow: "hidden", transform: `translateY(${dy}px)` }}>
            <div style={{ position: "absolute", left: -i * sw, top: 0 }}>{strip}</div>
            <div style={{ position: "absolute", inset: 0, background: shade > 0 ? `rgba(255,255,255,${shade * 0.16})` : `rgba(0,0,20,${-shade * 0.28})` }} />
          </div>
        );
      })}
    </div>
  );
};
