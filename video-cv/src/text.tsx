import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { HEAD } from "./fonts";

// Palavra que "cai" letra a letra com mola, desfoque e saída explosiva.
export const Slam: React.FC<{
  text: string;
  from: number; // segundos
  to: number;
  size?: number;
  y?: number;
  gradient?: string;
  stroke?: string;
  stagger?: number;
  exit?: boolean;
  font?: string;
  letterSpacing?: number;
  shadow?: string;
}> = ({ text, from, to, size = 200, y = 400, gradient = "linear-gradient(180deg,#fff 30%,#ffe27a 100%)", stroke = "rgba(0,30,80,0.9)", stagger = 1.6, exit = true, font = HEAD, letterSpacing = 2, shadow }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f0 = from * fps;
  const f1 = to * fps;
  if (frame < f0 - 2 || frame > f1 + 14) return null;
  const outP = exit ? interpolate(frame, [f1, f1 + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const chars = Array.from(text);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        textAlign: "center",
        transform: `translateY(-50%) scale(${1 + outP * 0.6}) skewX(${-outP * 18}deg)`,
        opacity: 1 - outP,
        filter: `blur(${outP * 14}px)`,
        whiteSpace: "nowrap",
      }}
    >
      {chars.map((ch, i) => {
        const s = spring({ frame: frame - f0 - i * stagger, fps, config: { damping: 11, stiffness: 180, mass: 0.7 } });
        const blur = interpolate(s, [0, 1], [18, 0], { extrapolateRight: "clamp" });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: font,
              fontSize: size,
              lineHeight: 1,
              letterSpacing,
              backgroundImage: gradient,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextStroke: `${Math.max(2, size / 40)}px ${stroke}`,
              paintOrder: "stroke fill",
              transform: `translateY(${(1 - s) * -160}px) scale(${interpolate(s, [0, 1], [2.4, 1])}) rotate(${(1 - s) * (i % 2 ? 14 : -14)}deg)`,
              opacity: Math.min(1, s * 1.6),
              filter: `blur(${blur}px) drop-shadow(${shadow ?? "0 10px 0 rgba(0,25,70,0.55)"})`,
              whiteSpace: "pre",
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

// Linha secundária: sobe com máscara
export const Rise: React.FC<{
  text: string;
  from: number;
  to?: number;
  y: number;
  size?: number;
  color?: string;
  font?: string;
  weight?: number;
  letterSpacing?: number;
  bg?: string;
}> = ({ text, from, to = 999, y, size = 56, color = "#fff", font, weight = 800, letterSpacing = 4, bg }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - from * fps, fps, config: { damping: 16, stiffness: 140 } });
  const out = interpolate(frame, [to * fps, to * fps + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame < from * fps - 1 || out >= 1) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", overflow: "hidden", height: size * 1.5, opacity: 1 - out }}>
      <span
        style={{
          display: "inline-block",
          transform: `translateY(${(1 - s) * size * 1.6}px)`,
          fontFamily: font,
          fontWeight: weight,
          fontSize: size,
          color,
          letterSpacing,
          lineHeight: 1.3,
          padding: bg ? "0 26px" : 0,
          background: bg,
          borderRadius: bg ? 14 : 0,
        }}
      >
        {text}
      </span>
    </div>
  );
};
