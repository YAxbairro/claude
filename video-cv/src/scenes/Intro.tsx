import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY, HEAD } from "../fonts";
import { Rise, Slam } from "../text";
import TL from "../timeline.json";

const P = TL.phrases;

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dawn = interpolate(t, [0, 3.5], [0, 1], { extrapolateRight: "clamp" });
  const top = interpolateColors(dawn, [0, 1], ["#0b1340", "#1d4fa3"]);
  const mid = interpolateColors(dawn, [0, 1], ["#3a1f5c", "#ff8a4c"]);
  const low = interpolateColors(dawn, [0, 1], ["#7a2e4a", "#ffd36b"]);
  const sunY = interpolate(t, [0, 3.6], [1320, 1010], { extrapolateRight: "clamp" });
  // mergulho para dentro do sol no fim da cena
  const dive = interpolate(t, [3.7, 4.4], [1, 9], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => x * x * x });
  const pin = spring({ frame: frame - (P.casa[0] + 0.15) * fps, fps, config: { damping: 9, stiffness: 160 } });
  const horizon = 1180;

  return (
    <AbsoluteFill style={{ transform: `scale(${dive})`, transformOrigin: `540px ${sunY}px` }}>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${mid} 45%, ${low} 62%)` }} />
      {/* estrelas a desaparecer */}
      {new Array(60).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: random(`stx${i}`) * 1080,
            top: random(`sty${i}`) * 800,
            width: 3,
            height: 3,
            borderRadius: 2,
            background: "#fff",
            opacity: (1 - dawn) * (0.4 + 0.6 * Math.abs(Math.sin(frame / 7 + i))),
          }}
        />
      ))}
      {/* raios de sol */}
      <div
        style={{
          position: "absolute",
          left: 540 - 1400,
          top: sunY - 1400,
          width: 2800,
          height: 2800,
          background: `repeating-conic-gradient(from ${frame * 0.4}deg, rgba(255,240,180,0.22) 0deg 6deg, rgba(255,240,180,0) 6deg 18deg)`,
          maskImage: "radial-gradient(circle, black 0%, transparent 55%)",
          WebkitMaskImage: "radial-gradient(circle, black 0%, transparent 55%)",
          opacity: dawn,
        }}
      />
      {/* sol */}
      <div
        style={{
          position: "absolute",
          left: 540 - 170,
          top: sunY - 170,
          width: 340,
          height: 340,
          borderRadius: "50%",
          background: "radial-gradient(circle at 50% 45%, #fffbe6 0%, #ffe07a 45%, #ff9d3c 100%)",
          boxShadow: "0 0 140px 60px rgba(255,190,90,0.65), 0 0 400px 160px rgba(255,140,60,0.35)",
        }}
      />
      {/* mar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: horizon,
          width: 1080,
          height: 1920 - horizon,
          background: `linear-gradient(180deg, ${interpolateColors(dawn, [0, 1], ["#2a2350", "#ff9a55"])} 0%, ${interpolateColors(dawn, [0, 1], ["#0b1a3d", "#0e5a96"])} 30%, #06244d 100%)`,
          overflow: "hidden",
        }}
      >
        {new Array(40).fill(0).map((_, i) => {
          const y = Math.pow(i / 40, 1.6) * (1920 - horizon);
          const w = 40 + (i / 40) * 400 * random(`sw${i}`);
          const x = 540 + Math.sin(frame / 12 + i * 1.7) * (30 + i * 6) - w / 2;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: w,
                height: 3 + i / 10,
                borderRadius: 4,
                background: "rgba(255,225,150,0.75)",
                opacity: dawn * (0.25 + 0.6 * Math.abs(Math.sin(frame / 9 + i))) * (1 - i / 50),
              }}
            />
          );
        })}
      </div>
      {/* silhueta da Praia: montanhas, casas, farol e coqueiros */}
      <svg width="1080" height="1920" style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={`M0 ${horizon} L0 1040 Q120 960 230 1020 Q330 900 470 1010 L470 ${horizon} Z`} fill="#1a1030" opacity={0.85} />
        <path d={`M600 ${horizon} L600 1050 Q760 940 880 1030 Q980 980 1080 1000 L1080 ${horizon} Z`} fill="#1a1030" opacity={0.85} />
        {new Array(9).fill(0).map((_, i) => {
          const x = 30 + i * 46;
          const h = 40 + random(`bh${i}`) * 70;
          return <rect key={i} x={x} y={horizon - h} width={40} height={h} fill="#120a24" />;
        })}
        {new Array(9).fill(0).map((_, i) => (
          <rect key={`w${i}`} x={44 + i * 46} y={horizon - 30} width={10} height={10} fill="#ffcf6b" opacity={0.6 * (1 - dawn) + 0.2} />
        ))}
        {/* farol */}
        <rect x={880} y={horizon - 170} width={34} height={170} fill="#120a24" />
        <rect x={872} y={horizon - 196} width={50} height={30} fill="#120a24" />
        <circle cx={897} cy={horizon - 182} r={10} fill="#ffe8a0" opacity={0.6 + 0.4 * Math.sin(frame / 4)} />
        {/* coqueiros */}
        {[520, 700].map((x, k) => (
          <g key={k} transform={`translate(${x} ${horizon}) rotate(${Math.sin(frame / 20 + k) * 2})`}>
            <path d="M0 0 Q8 -110 -6 -230" stroke="#120a24" strokeWidth={12} fill="none" />
            {[-70, -35, 0, 35, 70, 110, -110].map((a, j) => (
              <path key={j} d="M-6 -230 q40 -30 90 10" stroke="#120a24" strokeWidth={10} fill="none" transform={`rotate(${a + Math.sin(frame / 15 + j) * 4} -6 -230)`} />
            ))}
          </g>
        ))}
      </svg>
      {/* pino de localização "PRAIA" */}
      {pin > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: 540 - 60,
            top: horizon - 330 + (1 - pin) * -500,
            width: 120,
            textAlign: "center",
            opacity: Math.min(1, pin * 2),
          }}
        >
          <svg width="120" height="150" viewBox="0 0 120 150">
            <path d="M60 145 C60 145 10 85 10 55 A50 50 0 1 1 110 55 C110 85 60 145 60 145 Z" fill="#cf2027" stroke="#fff" strokeWidth={6} />
            <circle cx={60} cy={55} r={20} fill="#fff" />
          </svg>
          <div
            style={{
              marginTop: 10,
              marginLeft: -60,
              width: 240,
              fontFamily: BODY,
              fontWeight: 900,
              fontSize: 40,
              color: "#fff",
              letterSpacing: 8,
              textShadow: "0 4px 18px rgba(0,0,0,0.6)",
            }}
          >
            PRAIA
          </div>
        </div>
      )}
      <Slam text="HÁ UMA AVENTURA" from={P.aventura[0]} to={P.casa[0] - 0.2} size={128} y={430} />
      <Rise text="À TUA ESPERA..." from={P.aventura[0] + 0.7} to={P.casa[0] - 0.2} y={540} size={64} font={BODY} />
      <Slam text="E COMEÇA" from={P.casa[0]} to={4.1} size={150} y={380} gradient="linear-gradient(180deg,#fff 20%,#ffd36b 100%)" />
      <Slam text="EM CASA." from={P.casa[0] + 0.45} to={4.1} size={190} y={560} gradient="linear-gradient(180deg,#ffe27a 0%,#ff7a3c 100%)" />
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: HEAD,
          fontSize: 34,
          letterSpacing: 18,
          color: "rgba(255,255,255,0.8)",
          opacity: interpolate(t, [0.2, 0.8, 3.6, 4], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        CABO VERDE · 9 ILHAS
      </div>
    </AbsoluteFill>
  );
};
