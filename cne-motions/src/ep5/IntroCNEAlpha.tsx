import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SANS } from "../theme";

// CNE Explica opener, fully vector and on a transparent background (renders at any size, e.g. 4K).
// Same story as the original: a ballot arrives, the cross is made (here inside a magnifier, on a
// detached square, so no candidate row is ever marked), the cross flies off and becomes the X of
// "EXPLICA"; the red bar opens, the letters come in and "CNE" rises from behind the bar.
export const INTRO_ALPHA_FRAMES = 119; // 4.963 s at 23.976 fps

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (frame: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) => interpolate(frame, [a, b], [0, 1], { ...clamp, easing: e });

const PAPER = "#F3EDE4";
const INK = "#A9A49B";
const BOXC = "#5E5A55";
const RED = "#BE1E23";
const NAVY = "#141E3C";

// final logo geometry (1920x1080 space, measured on the original)
const BAR = { left: 588, top: 558, w: 741, h: 173 };
const XF = { cx: 772, cy: 645, s: 1.12 }; // the X inside the bar

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

// The X of the brand: a long stroke rising to the right and a short one, cut square like the logo.
// Drawn around (0,0); `draw` sweeps it in from the bottom-left like a pen.
const BrandX: React.FC<{ color: string; draw?: number; long?: number }> = ({ color, draw = 1, long = 1 }) => {
  const L = 92 * long; // half-length of the long stroke
  return (
    <svg width={400} height={400} viewBox="-200 -200 400 400" style={{ position: "absolute", left: -200, top: -200, overflow: "visible" }}>
      <defs>
        <clipPath id={`xdraw-${color.replace("#", "")}-${Math.round(long * 10)}`}>
          <polygon points={`-200,200 -200,${200 - draw * 800} ${-200 + draw * 800},200`} />
        </clipPath>
      </defs>
      <g clipPath={`url(#xdraw-${color.replace("#", "")}-${Math.round(long * 10)})`}>
        <polygon points={`${-L * 0.62 - 14},${L} ${-L * 0.62 + 18},${L} ${L * 0.62 + 14},${-L} ${L * 0.62 - 18},${-L}`} fill={color} />
        <polygon points={`-46,-48 -16,-48 46,48 16,48`} fill={color} />
      </g>
    </svg>
  );
};

const Letters: React.FC<{ text: string; at: number; size: number }> = ({ text, at, size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      {text.split("").map((ch, i) => {
        const p = spring({ frame: frame - at - i * 1.6, fps, config: { damping: 14, mass: 0.5 } });
        return (
          <span key={i} style={{ display: "inline-block", transform: `translateY(${(1 - p) * 120}%)`, opacity: p > 0.02 ? 1 : 0 }}>
            {ch}
          </span>
        );
      })}
    </>
  );
};

export const IntroCNEAlpha: React.FC<{ scale?: number }> = ({ scale = 2 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // ballot slides down from the top and settles
  const fall = spring({ frame, fps, config: { damping: 15, mass: 0.9 } });
  const by = interpolate(fall, [0, 1], [-760, 0]);
  const brot = interpolate(fall, [0, 1], [-14, -3]);
  // magnifier with a single detached square, the cross is drawn inside it
  const lens = spring({ frame: frame - 17, fps, config: { damping: 12, mass: 0.6 } });
  const draw = ease(frame, 24, 35, Easing.inOut(Easing.quad));
  const away = ease(frame, 37, 46);
  // the cross flies to its place in the bar and turns white as the bar opens under it
  const fly = ease(frame, 40, 56, Easing.inOut(Easing.cubic));
  const LC = { x: 780, y: 770 };
  const R = 130;
  const x0 = 0.42; // size inside the lens square
  const xcx = interpolate(fly, [0, 1], [LC.x, XF.cx]);
  const xcy = interpolate(fly, [0, 1], [LC.y, XF.cy]) - Math.sin(fly * Math.PI) * 160;
  const xsc = interpolate(fly, [0, 1], [x0, XF.s]);
  const xrot = interpolate(fly, [0, 1], [0, 0]) + Math.sin(fly * Math.PI) * -12;
  const barP = spring({ frame: frame - 54, fps, config: { damping: 16, mass: 0.7 } });
  const barGrow = ease(frame, 57, 66, Easing.out(Easing.cubic));
  const whiteX = ease(frame, 54, 58);
  const barL = interpolate(barP, [0, 1], [XF.cx - 70, BAR.left]);
  const barR = interpolate(barGrow, [0, 1], [XF.cx + 80, BAR.left + BAR.w]);
  const cne = spring({ frame: frame - 70, fps, config: { damping: 13, mass: 0.8 } });
  const settle = 1;
  const showBar = frame >= 54;
  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        {/* ballot */}
        {away < 1 && (
          <div style={{ position: "absolute", left: 744, top: 267, transform: `translateY(${by}px) rotate(${brot}deg) scale(${1 - 0.12 * away})`, opacity: 1 - away, filter: away > 0 ? `blur(${away * 4}px)` : undefined }}>
            <Sheet />
          </div>
        )}
        {/* magnifier */}
        {away < 1 && (
          <div style={{ position: "absolute", left: LC.x - R, top: LC.y - R, width: R * 2, height: R * 2, transform: `scale(${lens * (1 - 0.2 * away)})`, opacity: 1 - away, visibility: lens < 0.01 ? "hidden" : "visible" }}>
            <svg width={R * 2} height={R * 2} viewBox="0 0 200 200" style={{ overflow: "visible", filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.25))" }}>
              <line x1="168" y1="168" x2="214" y2="214" stroke="#1F2B45" strokeWidth="16" strokeLinecap="round" />
              <circle cx="100" cy="100" r="92" fill="#FBF8F2" stroke="#1F2B45" strokeWidth="10" />
              <rect x="56" y="56" width="88" height="88" rx="6" fill="#fff" stroke={BOXC} strokeWidth="7" />
            </svg>
          </div>
        )}

        {/* logo: CNE rises from behind the bar */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: BAR.top + 4, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              width: 1920,
              top: 313,
              textAlign: "center",
              transform: `translate(${(BAR.left + BAR.w / 2 - 960) * 1 - 2}px, ${(1 - cne) * 240}px) scale(${settle})`,
              transformOrigin: `${960}px ${BAR.top - 313}px`,
              visibility: frame < 70 ? "hidden" : "visible",
            }}
          >
            <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 262, color: NAVY, letterSpacing: -2, lineHeight: 1 }}>CNE</span>
          </div>
        </div>

        {showBar && (
          <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${settle})`, transformOrigin: `${BAR.left + BAR.w / 2}px ${BAR.top}px` }}>
            <div style={{ position: "absolute", left: barL, top: BAR.top + (1 - barP) * 60, width: barR - barL, height: BAR.h * (0.6 + 0.4 * barP), background: RED }} />
            {/* letters inside the bar */}
            <div style={{ position: "absolute", left: BAR.left, top: BAR.top, width: BAR.w, height: BAR.h, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 40, top: 22, fontFamily: SANS, fontWeight: 900, fontSize: 136, color: "#FFFFFF", lineHeight: 1 }}>
                <Letters text="E" at={63} size={124} />
              </div>
              <div style={{ position: "absolute", right: 34, top: 22, fontFamily: SANS, fontWeight: 900, fontSize: 136, color: "#FFFFFF", lineHeight: 1, letterSpacing: 0 }}>
                <Letters text="PLICA" at={64} size={124} />
              </div>
            </div>
          </div>
        )}

        {/* the cross */}
        <div
          style={{
            position: "absolute",
            left: xcx,
            top: xcy,
            transform: `scale(${xsc * (frame >= 84 ? settle : 1)}) rotate(${xrot}deg)`,
            visibility: frame < 24 ? "hidden" : "visible",
          }}
        >
          <div style={{ position: "absolute", opacity: 1 - whiteX }}>
            <BrandX color={RED} draw={draw} long={1} />
          </div>
          {whiteX > 0 && (
            <div style={{ position: "absolute", opacity: whiteX }}>
              <BrandX color="#FFFFFF" long={1} />
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
