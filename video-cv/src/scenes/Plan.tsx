import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY, HEAD } from "../fonts";
import { Rise, Slam } from "../text";
import TL from "../timeline.json";

const P = TL.phrases;
const ROUTE = ["PRA", "SV", "SA", "SV", "SN", "SAL", "BV", "FOG", "BRV", "FOG", "PRA", "MAI", "PRA"];

// "Já não é um sonho. É um plano." — um passe de viagem e o carimbo.
export const Plan: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps; // tempo global (a cena é montada sem offset)
  const [s0] = TL.scenes.plan;
  const card = spring({ frame: frame - (s0 + 0.15) * fps, fps, config: { damping: 13, stiffness: 90 } });
  const stamp = spring({ frame: frame - P.plano[0] * fps, fps, config: { damping: 7, stiffness: 260, mass: 0.6 } });
  const stampOn = frame >= P.plano[0] * fps;
  const shake = stampOn ? Math.exp(-(t - P.plano[0]) * 9) * 22 : 0;
  const strike = interpolate(t, [P.sonho[1] - 0.6, P.sonho[1] - 0.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tilt = interpolate(card, [0, 1], [35, -4]) + Math.sin(t * 1.4) * 2;

  return (
    <AbsoluteFill style={{ transform: `translate(${(random(`sx${frame}`) - 0.5) * shake}px, ${(random(`sy${frame}`) - 0.5) * shake}px)` }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #1b5fd1 0%, #003893 55%, #001a4d 100%)" }} />
      <AbsoluteFill
        style={{
          background: `repeating-conic-gradient(from ${frame * 0.3}deg at 50% 55%, rgba(255,255,255,0.06) 0deg 8deg, rgba(255,255,255,0) 8deg 20deg)`,
        }}
      />
      <Slam text="AGORA," from={P.agora[0]} to={P.plano[0] - 0.1} size={150} y={300} />
      <Rise text="IR DE ILHA EM ILHA" from={P.sonho[0]} to={P.plano[0] - 0.1} y={400} size={62} font={BODY} weight={900} />
      {/* "já não é um sonho", riscado */}
      {t >= P.sonho[0] + 0.5 && t < P.plano[0] && (
        <div style={{ position: "absolute", top: 500, left: 0, right: 0, textAlign: "center" }}>
          <span style={{ position: "relative", fontFamily: BODY, fontWeight: 800, fontSize: 64, color: "rgba(255,255,255,0.85)", letterSpacing: 3 }}>
            JÁ NÃO É UM SONHO
            <span style={{ position: "absolute", left: -10, top: "52%", height: 10, width: `${strike * 104}%`, background: "#cf2027", borderRadius: 5, transform: "rotate(-3deg)" }} />
          </span>
        </div>
      )}

      {/* passe de viagem */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 700 + (1 - card) * 1300,
          width: 900,
          height: 560,
          perspective: 1400,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `rotateX(${tilt * 0.3}deg) rotateZ(${tilt * 0.12}deg)`,
            borderRadius: 36,
            background: "linear-gradient(160deg,#ffffff 0%,#f3f6ff 100%)",
            boxShadow: "0 40px 80px rgba(0,0,0,0.45)",
            overflow: "hidden",
            fontFamily: BODY,
            color: "#002a6b",
            position: "relative",
          }}
        >
          <div style={{ height: 120, background: "linear-gradient(90deg,#003893,#1b5fd1)", display: "flex", alignItems: "center", padding: "0 44px", justifyContent: "space-between" }}>
            <div style={{ fontFamily: HEAD, color: "#fff", fontSize: 54, letterSpacing: 6 }}>PASSE DE AVENTURA</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["#fff", "#cf2027", "#fff"].map((c, i) => (
                <div key={i} style={{ width: 16, height: 64, background: c, borderRadius: 4 }} />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "34px 44px 10px" }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, opacity: 0.6, letterSpacing: 4 }}>PARTIDA</div>
              <div style={{ fontFamily: HEAD, fontSize: 110, lineHeight: 1 }}>PRA</div>
            </div>
            <div style={{ fontSize: 70, color: "#cf2027" }}>⟳</div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 800, opacity: 0.6, letterSpacing: 4 }}>REGRESSO</div>
              <div style={{ fontFamily: HEAD, fontSize: 110, lineHeight: 1 }}>PRA</div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "6px 44px" }}>
            {ROUTE.map((r, i) => {
              const on = spring({ frame: frame - (s0 + 0.5 + i * 0.07) * fps, fps, config: { damping: 12 } });
              return (
                <div key={i} style={{ fontSize: 24, fontWeight: 900, padding: "6px 12px", borderRadius: 10, background: i % 2 ? "#e6edff" : "#f7d116", transform: `scale(${on})` }}>
                  {r}
                </div>
              );
            })}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 120, borderTop: "4px dashed #c9d4ee", display: "flex", alignItems: "center", justifyContent: "space-around", fontWeight: 900, fontSize: 34 }}>
            <span>9 ILHAS</span>
            <span>12 VIAGENS</span>
            <span>✈ 3 · ⛴ 9</span>
          </div>
        </div>
        {/* carimbo */}
        {stampOn && (
          <div
            style={{
              position: "absolute",
              left: 120,
              top: 170,
              transform: `rotate(-14deg) scale(${interpolate(stamp, [0, 1], [3.2, 1])})`,
              opacity: Math.min(1, stamp * 3),
              border: "10px solid #cf2027",
              borderRadius: 24,
              padding: "10px 34px",
              fontFamily: HEAD,
              fontSize: 108,
              color: "#cf2027",
              letterSpacing: 4,
              background: "rgba(255,255,255,0.15)",
              mixBlendMode: "multiply",
              whiteSpace: "nowrap",
            }}
          >
            É UM PLANO
          </div>
        )}
      </div>
      {/* poeira do carimbo */}
      {stampOn &&
        new Array(30).fill(0).map((_, i) => {
          const q = (t - P.plano[0]) * 1.6;
          if (q > 1) return null;
          const a = random(`da${i}`) * Math.PI * 2;
          const r = q * (200 + random(`dr${i}`) * 300);
          return <div key={i} style={{ position: "absolute", left: 540 + Math.cos(a) * r * 1.6, top: 1000 + Math.sin(a) * r, width: 10, height: 10, borderRadius: 5, background: "#fff", opacity: 1 - q }} />;
        })}
      <Rise text="Barco 500$  ·  Avião 5.000$" from={P.plano[0] + 0.15} y={1360} size={44} font={BODY} weight={800} color="#f7d116" letterSpacing={2} />
    </AbsoluteFill>
  );
};
