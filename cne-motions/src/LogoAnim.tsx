import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Animated "Eleição Presidencial 2026" logo, built from the layers in public/logo-parts/<variant>/
// Every layer is a full 1600x838 canvas so they stack in the original positions.
const W = 1600;
const H = 838;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Layer: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => (
  <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, ...style }} />
);

export const LogoAnim: React.FC<{ variant: "cor" | "branco"; background?: string }> = ({ variant, background }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const p = (name: string) => `logo-parts/${variant}/${name}.png`;
  const s = (sec: number) => Math.round(sec * fps);

  // 1. Ballot drops in and lands with a little squash
  const drop = spring({ frame, fps, config: { damping: 14, mass: 0.6 }, durationInFrames: s(0.6) });
  const ballotY = interpolate(drop, [0, 1], [-420, 0]);
  const ballotRot = interpolate(drop, [0, 1], [-14, 0]);
  const land = spring({ frame: frame - s(0.42), fps, config: { damping: 7, mass: 0.4 } });
  const squash = frame > s(0.42) ? Math.sin(land * Math.PI) * 0.06 : 0;

  // 2. Lid and base lines grow out from the centre
  const lid = interpolate(frame, [s(0.35), s(0.85)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const thick = interpolate(frame, [s(0.45), s(1.0)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const thin = interpolate(frame, [s(0.55), s(1.1)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const fromCentre = (v: number) => `inset(0 ${50 - v * 50}% 0 ${50 - v * 50}%)`;

  // 3. Title wipes in left -> right while rising
  const title = interpolate(frame, [s(0.9), s(1.6)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

  // 4. 2026 pops in, waves sweep
  const year = spring({ frame: frame - s(1.35), fps, config: { damping: 12, mass: 0.7 } });
  const yearWipe = interpolate(frame, [s(1.35), s(2.1)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  // 5. Light sweep across the finished logo
  const shine = interpolate(frame, [s(2.4), s(3.3)], [-0.3, 1.3], clamp);

  // Gentle settle of the whole logo
  const whole = interpolate(frame, [0, s(6)], [0.96, 1.0], clamp);
  const scale = (width * 0.55) / W;

  return (
    <AbsoluteFill style={{ background, alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: W, height: H, position: "relative", transform: `scale(${scale * whole})` }}>
        {/* lid behind the ballot */}
        <Layer src={p("lid")} style={{ clipPath: fromCentre(lid), transform: `scaleX(${1 + squash * 0.4})`, transformOrigin: "50% 30%" }} />
        <Layer
          src={p("ballot")}
          style={{
            transform: `translateY(${ballotY}px) rotate(${ballotRot}deg) scale(${1 + squash}, ${1 - squash})`,
            transformOrigin: "815px 231px",
            opacity: interpolate(frame, [0, 4], [0, 1], clamp),
          }}
        />
        <Layer src={p("line-thick")} style={{ clipPath: fromCentre(thick) }} />
        <Layer src={p("line-thin")} style={{ clipPath: fromCentre(thin) }} />
        <Layer src={p("title")} style={{ clipPath: `inset(0 ${100 - title * 100}% 0 0)`, transform: `translateY(${(1 - title) * 24}px)` }} />
        <Layer
          src={p("year")}
          style={{
            clipPath: `inset(0 ${100 - yearWipe * 100}% 0 0)`,
            transform: `scale(${0.85 + 0.15 * year})`,
            transformOrigin: "777px 700px",
            opacity: year > 0.01 ? 1 : 0,
          }}
        />
        {/* shine: a soft white band masked by the logo's own shape */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            WebkitMaskImage: `url(${staticFile(`eleicao-${variant}.png`)})`,
            WebkitMaskSize: "100% 100%",
            background: `linear-gradient(105deg, transparent ${shine * 100 - 12}%, rgba(255,255,255,0.75) ${shine * 100}%, transparent ${shine * 100 + 12}%)`,
            mixBlendMode: variant === "cor" ? "screen" : "normal",
            opacity: variant === "cor" ? 0.9 : 0.6,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
