import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";

export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="1080" height="1920">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 12} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 75% 60% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,10,30,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

// Fuga de luz quente que atravessa o ecrã
export const LightLeak: React.FC<{ at: number; dur?: number; color?: string }> = ({ at, dur = 24, color = "255,170,60" }) => {
  const frame = useCurrentFrame();
  const p = (frame - at) / dur;
  if (p < 0 || p > 1) return null;
  const o = Math.sin(p * Math.PI);
  const x = interpolate(p, [0, 1], [-30, 130]);
  return (
    <AbsoluteFill
      style={{
        mixBlendMode: "screen",
        opacity: o * 0.85,
        background: `radial-gradient(circle at ${x}% 40%, rgba(${color},0.95) 0%, rgba(${color},0.35) 25%, rgba(0,0,0,0) 55%),
                     radial-gradient(circle at ${100 - x}% 80%, rgba(255,80,120,0.6) 0%, rgba(0,0,0,0) 40%)`,
        pointerEvents: "none",
      }}
    />
  );
};

export const Flash: React.FC<{ at: number; dur?: number; color?: string }> = ({ at, dur = 8, color = "#fff" }) => {
  const frame = useCurrentFrame();
  const p = (frame - at) / dur;
  if (p < 0 || p > 1) return null;
  return <AbsoluteFill style={{ background: color, opacity: (1 - p) ** 2, pointerEvents: "none" }} />;
};

const CONFETTI_COLORS = ["#003893", "#cf2027", "#f7d116", "#ffffff", "#19c3d6"];

export const Confetti: React.FC<{ at: number; count?: number; originY?: number }> = ({ at, count = 140, originY = 960 }) => {
  const frame = useCurrentFrame();
  const t = (frame - at) / 30;
  if (t < 0 || t > 3.2) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        const ang = random(`a${i}`) * Math.PI * 2;
        const sp = 900 + random(`s${i}`) * 1500;
        const vx = Math.cos(ang) * sp * 0.75;
        const vy = Math.sin(ang) * sp - 900;
        const drag = 1 - Math.exp(-t * 2.2);
        const x = 540 + (vx / 2.2) * drag + Math.sin(t * 6 + i) * 30 * t;
        const y = originY + (vy / 2.2) * drag + 650 * t * t * 0.5;
        const rot = t * (300 + random(`r${i}`) * 700) * (i % 2 ? 1 : -1);
        const w = 14 + random(`w${i}`) * 16;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: w,
              height: w * 0.45,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              transform: `rotate(${rot}deg) rotateX(${rot * 1.7}deg)`,
              opacity: Math.min(1, (3.2 - t) * 1.5),
              borderRadius: 2,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Brilhos que sobem como faíscas
export const Sparkles: React.FC<{ count?: number; color?: string; seed?: string }> = ({ count = 40, color = "255,230,150", seed = "sp" }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {new Array(count).fill(0).map((_, i) => {
        const life = 70 + random(`${seed}l${i}`) * 80;
        const off = random(`${seed}o${i}`) * life;
        const p = ((frame + off) % life) / life;
        const x = random(`${seed}x${i}`) * 1080 + Math.sin(p * 6 + i) * 20;
        const y = 1920 - p * (900 + random(`${seed}y${i}`) * 1100);
        const s = 3 + random(`${seed}s${i}`) * 7;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: s,
              height: s,
              borderRadius: "50%",
              background: `rgba(${color},1)`,
              boxShadow: `0 0 ${s * 3}px rgba(${color},0.9)`,
              opacity: Math.sin(p * Math.PI) * 0.9,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Linhas de velocidade (speed lines) em movimento
export const SpeedLines: React.FC<{ strength: number; angle?: number }> = ({ strength, angle = 0 }) => {
  const frame = useCurrentFrame();
  if (strength <= 0.01) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", transform: `rotate(${angle}deg) scale(1.6)`, opacity: strength }}>
      {new Array(26).fill(0).map((_, i) => {
        const y = random(`sly${i}`) * 1920;
        const len = 200 + random(`sll${i}`) * 500;
        const speed = 60 + random(`sls${i}`) * 80;
        const x = ((frame * speed + random(`slx${i}`) * 3000) % 3000) - 1000;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 1080 - x,
              top: y,
              width: len,
              height: 3,
              background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.75))",
              borderRadius: 3,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
