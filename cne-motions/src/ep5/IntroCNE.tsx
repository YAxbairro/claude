import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// CNE Explica opener, rebuilt so the ballot is never marked on a candidate row:
// the cross is made inside a magnifier on a detached square (same logic as Ep. 4/5),
// then that cross flies off to become the X of "EXPLICA". From frame HANDOVER on, the
// original opener plays unchanged (its X is alone on screen at that frame).
export const INTRO_FRAMES = 119; // 4.963 s at 23.976 fps, up to the cut to the presenter
const HANDOVER = 50;
// the original's floating X at the handover frame (1920x1080 space)
const XT = { left: 810, top: 477, w: 162, h: 174 };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (frame: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) => interpolate(frame, [a, b], [0, 1], { ...clamp, easing: e });

const PAPER = "#F3EDE4";
const INK = "#A9A49B";
const BOXC = "#5E5A55";

// Ballot in the style of the original opener: cream sheet, grey text bars, four identical rows
const Sheet: React.FC = () => (
  <svg width={440} height={560} viewBox="0 0 440 560" style={{ overflow: "visible", filter: "drop-shadow(0 14px 22px rgba(0,0,0,0.18))" }}>
    <rect width="440" height="560" rx="10" fill={PAPER} />
    <rect x="40" y="44" width="300" height="20" rx="4" fill={INK} />
    <rect x="70" y="78" width="200" height="9" rx="4" fill="#C3BDB3" />
    <line x1="30" y1="112" x2="410" y2="112" stroke="#DDD6CB" strokeWidth="3" />
    {[0, 1, 2, 3].map((i) => {
      const y = 150 + i * 100;
      return (
        <g key={i}>
          <rect x="40" y={y} width="220" height="12" rx="5" fill={INK} />
          <rect x="40" y={y + 24} width="140" height="8" rx="4" fill="#C3BDB3" />
          <rect x="330" y={y - 8} width="44" height="44" rx="3" fill="#FFFFFF" stroke={BOXC} strokeWidth="4" />
          {i < 3 && <line x1="30" y1={y + 62} x2="410" y2={y + 62} stroke="#E6E0D6" strokeWidth="2" />}
        </g>
      );
    })}
  </svg>
);

export const IntroCNE: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame >= HANDOVER) {
    return <Img src={staticFile(`intro/o${String(frame).padStart(3, "0")}.jpg`)} style={{ width: 1920, height: 1080 }} />;
  }
  // ballot slides down from the top and settles, as in the original
  const fall = spring({ frame, fps, config: { damping: 15, mass: 0.9 } });
  const by = interpolate(fall, [0, 1], [-760, 0]);
  const brot = interpolate(fall, [0, 1], [-14, -3]);
  // magnifier with a single, detached square
  const lens = spring({ frame: frame - 17, fps, config: { damping: 12, mass: 0.6 } });
  const draw = ease(frame, 24, 35, Easing.inOut(Easing.quad));
  // ballot and lens leave, the cross flies to its place in the logo
  const away = ease(frame, 37, 46);
  const fly = ease(frame, 40, HANDOVER, Easing.inOut(Easing.cubic));
  const LC = { x: 780, y: 770 }; // lens centre
  const R = 130;
  const xs = 0.66; // cross scale inside the lens square
  const cx = interpolate(fly, [0, 1], [LC.x, XT.left + XT.w / 2]);
  const cy = interpolate(fly, [0, 1], [LC.y, XT.top + XT.h / 2]) - Math.sin(fly * Math.PI) * 90;
  const sc = interpolate(fly, [0, 1], [xs, 1]);
  return (
    <AbsoluteFill>
      <Img src={staticFile("intro/plate.png")} style={{ width: 1920, height: 1080 }} />
      <div
        style={{
          position: "absolute",
          left: 744,
          top: 267,
          transform: `translateY(${by}px) rotate(${brot}deg) scale(${1 - 0.12 * away})`,
          opacity: 1 - away,
          filter: away > 0 ? `grayscale(${away}) blur(${away * 4}px)` : undefined,
        }}
      >
        <Sheet />
      </div>
      {/* magnifier */}
      <div style={{ position: "absolute", left: LC.x - R, top: LC.y - R, width: R * 2, height: R * 2, transform: `scale(${lens * (1 - 0.2 * away)})`, opacity: 1 - away, visibility: lens < 0.01 ? "hidden" : "visible" }}>
        <svg width={R * 2} height={R * 2} viewBox="0 0 200 200" style={{ overflow: "visible", filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.25))" }}>
          <line x1="168" y1="168" x2="214" y2="214" stroke="#1F2B45" strokeWidth="16" strokeLinecap="round" />
          <circle cx="100" cy="100" r="92" fill="#FBF8F2" stroke="#1F2B45" strokeWidth="10" />
          <rect x="56" y="56" width="88" height="88" rx="6" fill="#fff" stroke={BOXC} strokeWidth="7" />
        </svg>
      </div>
      {/* the cross: drawn in the lens (long stroke, then short), then flies to the logo */}
      <div
        style={{
          position: "absolute",
          left: cx - XT.w / 2,
          top: cy - XT.h / 2,
          width: XT.w,
          height: XT.h,
          transform: `scale(${sc}) rotate(${(1 - fly) * -6}deg)`,
          // drawn with a diagonal sweep from the bottom-left, like a pen stroke
          clipPath: fly > 0 ? undefined : `polygon(0% 100%, 0% ${100 - draw * 200}%, ${draw * 200}% 100%)`,
          visibility: frame < 24 ? "hidden" : "visible",
        }}
      >
        <Img src={staticFile("intro/x.png")} style={{ width: XT.w, height: XT.h }} />
      </div>
    </AbsoluteFill>
  );
};
