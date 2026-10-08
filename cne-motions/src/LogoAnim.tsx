import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SANS } from "./theme";

// Animated "Eleição Presidencial 2026" logo.
// Every layer in public/logo2/<variant>/ is a full 1600x838 canvas cut from the original logo,
// so the layers stack back into the exact artwork.
const W = 1600;
const H = 838;
const LOGO_NAVY = "#001C5C";
const LOGO_RED = "#BD181E";
const TITLE_LETTERS = 19;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (frame: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) => interpolate(frame, [a, b], [0, 1], { ...clamp, easing: e });

export const LogoAnim: React.FC<{ variant: "cor" | "branco"; background?: string }> = ({ variant, background }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = (sec: number) => Math.round(sec * fps);
  const src = (name: string) => staticFile(`logo2/${variant}/${name}.png`);
  const ink = variant === "cor" ? LOGO_NAVY : "#FFFFFF";

  // 1. Construction: lid strokes draw out from the centre, slot and base lines follow
  const lid = ease(frame, 0, s(0.75));
  const slot = ease(frame, s(0.2), s(0.7));
  const thick = ease(frame, s(0.3), s(0.85));
  const thin = ease(frame, s(0.42), s(0.97));

  // 2. Ballot floats in above the slot, the X is written, then it drops in
  const ballotIn = spring({ frame: frame - s(0.55), fps, config: { damping: 18, mass: 0.8 } });
  const strokeA = ease(frame, s(1.0), s(1.22), Easing.out(Easing.quad));
  const strokeB = ease(frame, s(1.27), s(1.5), Easing.out(Easing.quad));
  const tick = spring({ frame: frame - s(1.5), fps, config: { damping: 10, mass: 0.4 } });
  const drop = ease(frame, s(1.65), s(1.95), Easing.in(Easing.cubic));
  const land = spring({ frame: frame - s(1.95), fps, config: { damping: 8, mass: 0.35 } });
  const hover = Math.sin(frame / 10) * 4 * (1 - drop);
  const ballotY = -190 + (1 - ballotIn) * -90 + hover + drop * 190;
  const ballotRot = (1 - ballotIn) * -8;
  const ballotScale = 1 + 0.035 * Math.sin(tick * Math.PI) * (frame > s(1.5) ? 1 : 0);
  const squash = frame > s(1.95) ? Math.sin(land * Math.PI) * 0.025 : 0;

  // 3. Title letters rise one after another
  const titleStart = s(1.9);
  // 4. Digits pop, waves flow in
  const digitStart = s(2.35);
  const wave = ease(frame, s(2.5), s(3.3), Easing.out(Easing.cubic));
  const waveRed = ease(frame, s(2.7), s(3.4), Easing.out(Easing.cubic));

  // 5. Logo lifts, date comes in underneath
  const lift = ease(frame, s(3.5), s(4.2));
  const rules = ease(frame, s(3.75), s(4.45), Easing.out(Easing.cubic));
  const dateIn = ease(frame, s(3.85), s(4.6), Easing.out(Easing.cubic));
  const dayPop = spring({ frame: frame - s(4.0), fps, config: { damping: 12, mass: 0.6 } });

  // 6. Light sweep and a slow settle
  const shine = interpolate(frame, [s(4.9), s(5.8)], [-0.3, 1.3], clamp);
  const drift = interpolate(frame, [0, s(7)], [0.97, 1], clamp);

  const scale = ((width * 0.5) / W) * drift * (1 - 0.06 * lift);

  const imgStyle: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H };

  return (
    <AbsoluteFill style={{ background, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: W, height: H, transform: `translateY(${-70 * lift}px) scale(${scale})` }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <mask id="lidMask" maskUnits="userSpaceOnUse" x="-100" y="-100" width={W + 200} height={H + 200}>
              <path d="M784 193 L545 193 L438 264" stroke="white" strokeWidth="90" strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lid} />
              <path d="M784 193 L1023 193 L1130 264" stroke="white" strokeWidth="90" strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lid} />
              <rect x={784 - 170 * slot} y="225" width={340 * slot} height="28" fill="white" />
            </mask>
            <mask id="xMask" maskUnits="userSpaceOnUse" x="-100" y="-100" width={W + 200} height={H + 200}>
              <path d="M770 64 L848 213" stroke="white" strokeWidth="48" strokeLinecap="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - strokeA} />
              <path d="M883 74 L741 201" stroke="white" strokeWidth="48" strokeLinecap="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - strokeB} />
            </mask>
            <clipPath id="aboveSlot">
              <rect x="0" y="-600" width={W} height={833} />
            </clipPath>
            <linearGradient id="waveGrad" x1="0" x2="1" y1="0" y2="0">
              <stop offset={wave * 1.25 - 0.25} stopColor="white" stopOpacity="1" />
              <stop offset={wave * 1.25} stopColor="white" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="waveRedGrad" x1="0" x2="1" y1="0" y2="0">
              <stop offset={waveRed * 1.25 - 0.25} stopColor="white" stopOpacity="1" />
              <stop offset={waveRed * 1.25} stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask id="waveMask" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
              <rect x="380" y="700" width="790" height="140" fill="url(#waveGrad)" />
            </mask>
            <mask id="waveRedMask" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
              <rect x="880" y="720" width="290" height="90" fill="url(#waveRedGrad)" />
            </mask>
          </defs>

          {/* lid squashes slightly when the ballot lands */}
          <g transform={`translate(784 262) scale(${1 + squash} ${1 - squash}) translate(-784 -262)`}>
            <image href={src("lid")} width={W} height={H} mask="url(#lidMask)" />
            {/* close the gap in the lid's top edge until the ballot covers it */}
            <rect x={784 - 96 * lid} y="189" width={192 * lid} height="8" fill={ink === "#FFFFFF" ? "#FFFFFF" : LOGO_NAVY} opacity={1 - drop} />
          </g>

          <g clipPath="url(#aboveSlot)">
            <g
              opacity={interpolate(ballotIn, [0, 0.3], [0, 1], clamp)}
              transform={`translate(0 ${ballotY}) rotate(${ballotRot} 815 140) translate(815 140) scale(${ballotScale}) translate(-815 -140)`}
            >
              {/* full card while it floats (the artwork is cut at the slot), swapped for the original once it lands */}
              {drop < 1 ? (
                <path d="M773 0 Q 770 0 769 3 L 677 284 L 844 336 L 936 56 Q 937 52 933 51 Z" fill={LOGO_RED} strokeLinejoin="round" />
              ) : (
                <image href={src("card")} width={W} height={H} />
              )}
              <image href={src("x")} width={W} height={H} mask="url(#xMask)" />
            </g>
          </g>

          <image href={src("line-thick")} width={W} height={H} style={{ clipPath: `inset(0 ${50 - thick * 50}% 0 ${50 - thick * 50}%)` }} />
          <image href={src("line-thin")} width={W} height={H} style={{ clipPath: `inset(0 ${50 - thin * 50}% 0 ${50 - thin * 50}%)` }} />

          {Array.from({ length: TITLE_LETTERS }).map((_, i) => {
            const p = spring({ frame: frame - titleStart - i * 1.2, fps, config: { damping: 14, mass: 0.5 } });
            return (
              <image
                key={i}
                href={src(`title_${String(i).padStart(2, "0")}`)}
                width={W}
                height={H}
                opacity={interpolate(p, [0, 0.4], [0, 1], clamp)}
                transform={`translate(0 ${(1 - p) * 36})`}
              />
            );
          })}

          {[0, 1, 2, 3].map((i) => {
            const p = spring({ frame: frame - digitStart - i * 2.5, fps, config: { damping: 11, mass: 0.6 } });
            const cx = [493, 684, 875, 1050][i];
            return (
              <g key={i} transform={`translate(${cx} 752) scale(${0.4 + 0.6 * p}) translate(${-cx} -752)`} opacity={interpolate(p, [0, 0.25], [0, 1], clamp)}>
                <image href={src(`digit_${i}`)} width={W} height={H} />
              </g>
            );
          })}

          <g transform={`translate(${(1 - wave) * -30} 0)`}>
            <image href={src("wave_navy")} width={W} height={H} mask="url(#waveMask)" />
          </g>
          <g transform={`translate(${(1 - waveRed) * -30} 0)`}>
            <image href={src("wave_red")} width={W} height={H} mask="url(#waveRedMask)" />
          </g>
        </svg>

        {/* light sweep over the finished artwork */}
        <div
          style={{
            ...imgStyle,
            WebkitMaskImage: `url(${staticFile(`eleicao-${variant}.png`)})`,
            WebkitMaskSize: `${W}px ${H}px`,
            background: `linear-gradient(105deg, transparent ${shine * 100 - 10}%, rgba(255,255,255,0.7) ${shine * 100}%, transparent ${shine * 100 + 10}%)`,
            mixBlendMode: variant === "cor" ? "screen" : "normal",
            opacity: variant === "cor" ? 0.85 : 0.5,
          }}
        />

        {/* date */}
        <div style={{ position: "absolute", left: 0, right: 0, top: H + 70, display: "flex", alignItems: "center", justifyContent: "center", gap: 46 }}>
          <div style={{ height: 6, width: 230, background: LOGO_RED, transform: `scaleX(${rules})`, transformOrigin: "right", borderRadius: 3 }} />
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 86,
              color: ink,
              letterSpacing: `${0.5 - 0.3 * dateIn}em`,
              opacity: dateIn,
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "baseline",
              gap: 26,
              marginRight: `-${0.5 - 0.3 * dateIn}em`,
            }}
          >
            <span style={{ display: "inline-block", fontWeight: 900, fontSize: 112, color: LOGO_RED, transform: `scale(${0.6 + 0.4 * dayPop})`, letterSpacing: "0.02em" }}>15</span>
            <span>DE NOVEMBRO</span>
          </div>
          <div style={{ height: 6, width: 230, background: LOGO_RED, transform: `scaleX(${rules})`, transformOrigin: "left", borderRadius: 3 }} />
        </div>
      </div>

      {/* keep every layer decoded before the frame is captured */}
      <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>
        {["lid", "card", "x", "line-thick", "line-thin", "wave_navy", "wave_red", ...[0, 1, 2, 3].map((i) => `digit_${i}`), ...Array.from({ length: TITLE_LETTERS }, (_, i) => `title_${String(i).padStart(2, "0")}`)].map((n) => (
          <Img key={n} src={src(n)} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
