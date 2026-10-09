import React from "react";
import { Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SANS } from "../theme";

// Visual kit for the flat-illustration spots (same look as "Voto Perto de Casa")
export const NAVY = "#14245E";
export const RED = "#D3202A";
export const BLUE = "#2F6FD6";
export const SKY = "#E8F0FB";
export const INK_SOFT = "#5B6787";

export const SPOT_FPS = 25;
export const sec = (s: number) => Math.round(s * SPOT_FPS);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const ease = (frame: number, a: number, b: number, e: (t: number) => number = Easing.inOut(Easing.cubic)) =>
  interpolate(frame, [a, b], [0, 1], { ...clamp, easing: e });

export const useSpring = (delay: number, damping = 14, mass = 0.6) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass } });
};

// Scene wrapper: enter / exit handled uniformly so every scene can slide, scale or fade out
export const useExit = (len = 8) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return ease(frame, durationInFrames - len, durationInFrames, Easing.in(Easing.cubic));
};

// ---------- Typography ----------

export const Line: React.FC<{
  children: React.ReactNode;
  delay: number;
  size: number;
  color?: string;
  box?: string;
  align?: "left" | "center" | "right";
  weight?: number;
  spacing?: number;
}> = ({ children, delay, size, color = NAVY, box, align = "center", weight = 900, spacing = -0.5 }) => {
  const frame = useCurrentFrame();
  const p = useSpring(delay, 16, 0.55);
  const wipe = ease(frame, delay, delay + 9);
  const text = (
    <span
      style={{
        fontFamily: SANS,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.02,
        color: box ? "#fff" : color,
        letterSpacing: spacing,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
  return (
    <div style={{ display: "flex", justifyContent: align === "center" ? "center" : align === "left" ? "flex-start" : "flex-end" }}>
      {box ? (
        <div style={{ background: box, padding: `${size * 0.06}px ${size * 0.22}px ${size * 0.02}px`, clipPath: `inset(0 ${100 - wipe * 100}% 0 0)` }}>
          <div style={{ transform: `translateX(${(1 - p) * -30}px)` }}>{text}</div>
        </div>
      ) : (
        <div style={{ overflow: "hidden", paddingBottom: size * 0.08 }}>
          <div style={{ transform: `translateY(${(1 - p) * 135}%)` }}>{text}</div>
        </div>
      )}
    </div>
  );
};

export const Underline: React.FC<{ delay: number; width: number; align?: "left" | "center" }> = ({ delay, width, align = "center" }) => {
  const frame = useCurrentFrame();
  const p = ease(frame, delay, delay + 12, Easing.out(Easing.cubic));
  return (
    <div style={{ display: "flex", justifyContent: align === "center" ? "center" : "flex-start", marginTop: 10 }}>
      <div style={{ width, height: 9, borderRadius: 5, background: RED, transform: `scaleX(${p})`, transformOrigin: align === "center" ? "center" : "left" }} />
    </div>
  );
};

// ---------- Illustration image with a soft "landing" ----------

export const Art: React.FC<{
  src: string;
  delay: number;
  style: React.CSSProperties;
  from?: "bottom" | "left" | "right" | "scale";
  float?: number;
}> = ({ src, delay, style, from = "bottom", float = 0 }) => {
  const frame = useCurrentFrame();
  const p = useSpring(delay, 15, 0.7);
  const o = interpolate(p, [0, 0.35], [0, 1], clamp);
  const drift = Math.sin((frame - delay) / 22) * float;
  const t =
    from === "bottom"
      ? `translateY(${(1 - p) * 120 + drift}px)`
      : from === "left"
        ? `translateX(${(1 - p) * -260}px) translateY(${drift}px)`
        : from === "right"
          ? `translateX(${(1 - p) * 260}px) translateY(${drift}px)`
          : `scale(${0.75 + 0.25 * p}) translateY(${drift}px)`;
  return <Img src={staticFile(src)} style={{ position: "absolute", opacity: o, transform: t, ...style }} />;
};

// Soft light-blue disc behind subjects (white version only)
export const Disc: React.FC<{ delay: number; size: number; x: number; y: number; color?: string; show: boolean }> = ({
  delay,
  size,
  x,
  y,
  color = SKY,
  show,
}) => {
  const p = useSpring(delay, 18, 0.8);
  if (!show) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        transform: `scale(${p})`,
      }}
    />
  );
};
