import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY, SCRIPT } from "../fonts";
import { Slam } from "../text";
import TL from "../timeline.json";

const P = TL.phrases;

// Fecho com a bandeira: faixas a entrar, anel de 10 estrelas, logo e assinatura.
export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const [s0] = TL.scenes.end;
  const wipe = interpolate(t, [s0, s0 + 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => 1 - (1 - x) ** 3 });
  const ring = spring({ frame: frame - (P.caboVerde[0] - 0.1) * fps, fps, config: { damping: 12, stiffness: 90 } });
  const sign = interpolate(t, [P.inteiro[0], P.inteiro[0] + 0.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "#003893" }} />
      {/* faixas da bandeira */}
      <div style={{ position: "absolute", left: 0, top: 1160, height: 210, width: 1080 * wipe, background: "#fff" }} />
      <div style={{ position: "absolute", right: 0, top: 1230, height: 70, width: 1080 * wipe, background: "#cf2027" }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 38%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 45%)" }} />
      {/* anel de 10 estrelas */}
      <div style={{ position: "absolute", left: 400, top: 1265, transform: `rotate(${(1 - ring) * -180 + t * 6}deg) scale(${ring})` }}>
        {new Array(10).fill(0).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <svg key={i} width="80" height="80" viewBox="-50 -50 100 100" style={{ position: "absolute", left: Math.cos(a) * 330 - 40, top: Math.sin(a) * 330 - 40 }}>
              <path d="M0 -45 L13 -14 L45 -14 L19 6 L28 40 L0 20 L-28 40 L-19 6 L-45 -14 L-13 -14 Z" fill="#f7d116" />
            </svg>
          );
        })}
      </div>
      <Slam text="CABO VERDE" from={P.caboVerde[0]} to={99} exit={false} size={190} y={560} gradient="linear-gradient(180deg,#ffffff 40%,#ffe27a 100%)" stroke="rgba(0,20,60,0.95)" />
      <div
        style={{
          position: "absolute",
          top: 700,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: SCRIPT,
          fontSize: 92,
          color: "#f7d116",
          clipPath: `inset(0 ${100 - sign * 100}% 0 0)`,
          textShadow: "0 6px 0 rgba(0,20,60,0.6)",
          transform: `rotate(-4deg)`,
        }}
      >
        Vive-o por inteiro
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 170,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: BODY,
          fontWeight: 800,
          fontSize: 34,
          letterSpacing: 6,
          color: "rgba(255,255,255,0.85)",
          opacity: interpolate(t, [P.inteiro[0] + 0.5, P.inteiro[0] + 1.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        9 ILHAS · 1 AVENTURA
      </div>
    </AbsoluteFill>
  );
};
