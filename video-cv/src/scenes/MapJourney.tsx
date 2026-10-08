import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY, HEAD } from "../fonts";
import { SpeedLines } from "../fx";
import { ISLANDS, LEGS, STOP, beatPulse, bez, bezTan, camera, clamp01, islandPath, legCurve, legProgress } from "../geo";
import TL from "../timeline.json";

const POP_ORDER = ["sa", "sv", "sn", "sal", "bv", "maio", "santiago", "fogo", "brava"];
const PLANE = "M34 0 L14 -5 L0 -26 L-8 -26 L-1 -5 L-20 -5 L-27 -14 L-32 -14 L-28 0 L-32 14 L-27 14 L-20 5 L-1 5 L-8 26 L0 26 L14 5 Z";
const BOAT_HULL = "M30 0 L18 -11 L-24 -11 L-28 0 L-24 11 L18 11 Z";

const Ocean: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 120% 80% at 50% 45%, #22c7d6 0%, #0e8fc0 35%, #0a5aa0 70%, #062f66 100%)" }} />
    {/* cáusticas */}
    <AbsoluteFill
      style={{
        opacity: 0.22,
        mixBlendMode: "screen",
        background: `radial-gradient(circle at ${30 + Math.sin(frame / 40) * 10}% ${40 + Math.cos(frame / 50) * 8}%, #bff8ff 0%, transparent 30%),
                     radial-gradient(circle at ${70 + Math.cos(frame / 35) * 12}% ${70 + Math.sin(frame / 45) * 10}%, #bff8ff 0%, transparent 28%)`,
      }}
    />
  </>
);

export const MapJourney: React.FC<{ mode: "journey" | "finale" }> = ({ mode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cam = mode === "finale" ? { x: 520, y: 480, z: 0.95 + 0.04 * Math.sin(t), rot: Math.sin(t * 0.8) * 2 } : camera(frame);
  const pulse = beatPulse(t);
  const zoom = cam.z * (1 + pulse * 0.012);

  const curLegIdx = LEGS.findIndex((l) => t >= l.start && t < l.end);
  const curLeg = curLegIdx >= 0 ? LEGS[curLegIdx] : null;
  const planeAmt = curLeg && curLeg.mode === "plane" ? Math.sin(Math.PI * legProgress(curLeg, t)) : 0;

  const visitedAt = (id: string) => {
    if (id === "santiago") return TL.scenes.journey[0];
    const l = LEGS.find((x) => STOP[x.to].id === id);
    return l ? l.end : Infinity;
  };

  // ondas no espaço do mapa
  const waves = new Array(26).fill(0).map((_, i) => {
    const y = -300 + i * 60;
    let d = `M -400 ${y}`;
    for (let x = -400; x <= 1500; x += 40) d += ` L ${x} ${y + Math.sin(x / 70 + frame / 14 + i) * 7}`;
    return d;
  });

  let heading = 0;
  if (curLeg) {
    const c = legCurve(curLeg, curLegIdx);
    const tan = bezTan(c.a, c.ctrl, c.b, legProgress(curLeg, t));
    heading = (Math.atan2(tan.y, tan.x) * 180) / Math.PI;
  }

  return (
    <AbsoluteFill>
      <Ocean frame={frame} />
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#002244" floodOpacity="0.45" />
          </filter>
          {ISLANDS.map((isl) => (
            <radialGradient key={isl.id} id={`g-${isl.id}`} cx="40%" cy="35%" r="75%">
              <stop offset="0%" stopColor={isl.fill[0]} />
              <stop offset="100%" stopColor={isl.fill[1]} />
            </radialGradient>
          ))}
        </defs>
        <g transform={`translate(540 1000) rotate(${cam.rot}) scale(${zoom}) translate(${-cam.x} ${-cam.y})`}>
          {waves.map((d, i) => (
            <path key={i} d={d} stroke="rgba(255,255,255,0.08)" strokeWidth={2} fill="none" />
          ))}

          {/* ilhas */}
          {ISLANDS.map((isl) => {
            const k = POP_ORDER.indexOf(isl.id);
            const popT = isl.minor ? TL.islandPops[1] : TL.islandPops[k];
            const s = spring({ frame: frame - popT * fps, fps, config: { damping: 8, stiffness: 140, mass: 0.6 } });
            if (s <= 0.001) return null;
            const d = islandPath(isl);
            const visited = t >= visitedAt(isl.id);
            const vk = clamp01((t - visitedAt(isl.id)) / 0.5);
            return (
              <g key={isl.id} transform={`translate(${isl.c.x} ${isl.c.y}) scale(${s}) translate(${-isl.c.x} ${-isl.c.y})`}>
                {/* rebentação */}
                <path d={d} fill="none" stroke="rgba(190,250,255,0.55)" strokeWidth={14 + Math.sin(frame / 8 + isl.seed) * 4} strokeDasharray="10 14" strokeDashoffset={-frame * 0.8} />
                <path d={d} fill="#f6dfa8" stroke="#f6dfa8" strokeWidth={7} filter="url(#shadow)" />
                <path d={d} fill={`url(#g-${isl.id})`} />
                {/* relevo */}
                <path d={d} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={2} transform={`translate(${isl.c.x} ${isl.c.y}) scale(0.6) translate(${-isl.c.x} ${-isl.c.y})`} />
                {isl.id === "fogo" && (
                  <g>
                    <circle cx={isl.c.x - 6} cy={isl.c.y - 4} r={14} fill="#3a2a22" stroke="#8a6a4a" strokeWidth={3} />
                    <circle cx={isl.c.x - 6} cy={isl.c.y - 4} r={6} fill="#ff6a2a" opacity={0.6 + 0.4 * Math.sin(frame / 5)} filter="url(#glow)" />
                    {new Array(5).fill(0).map((_, j) => {
                      const p = ((frame / 40 + j / 5) % 1);
                      return <circle key={j} cx={isl.c.x - 6 + Math.sin(p * 6 + j) * 8} cy={isl.c.y - 10 - p * 60} r={5 + p * 14} fill="rgba(240,240,240,0.5)" opacity={1 - p} />;
                    })}
                  </g>
                )}
                {visited && !isl.minor && (
                  <circle cx={STOP[isl.id].port.x} cy={STOP[isl.id].port.y} r={8 + vk * 4} fill="#f7d116" stroke="#fff" strokeWidth={3} filter="url(#glow)" />
                )}
              </g>
            );
          })}

          {/* rotas */}
          {LEGS.map((leg, i) => {
            if (t < leg.start) return null;
            const { a, b, ctrl, len } = legCurve(leg, i);
            const p = legProgress(leg, t);
            const L = len * 1.15;
            const plane = leg.mode === "plane";
            const d = `M ${a.x} ${a.y} Q ${ctrl.x} ${ctrl.y} ${b.x} ${b.y}`;
            return (
              <g key={i}>
                <path d={d} fill="none" stroke={plane ? "rgba(255,255,255,0.35)" : "rgba(247,209,22,0.35)"} strokeWidth={10} strokeDasharray={`${L}`} strokeDashoffset={L * (1 - p)} filter="url(#glow)" />
                <path
                  d={d}
                  fill="none"
                  stroke={plane ? "#ffffff" : "#f7d116"}
                  strokeWidth={plane ? 4 : 5}
                  strokeLinecap="round"
                  strokeDasharray={plane ? "14 12" : "2 12"}
                  style={{ clipPath: "none" }}
                  mask={`url(#m${i})`}
                />
                <mask id={`m${i}`} maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={6000} height={6000}>
                  <path d={d} fill="none" stroke="#fff" strokeWidth={14} strokeDasharray={`${L}`} strokeDashoffset={L * (1 - p)} />
                </mask>
              </g>
            );
          })}

          {/* ondulações de chegada */}
          {LEGS.map((leg, i) => {
            const dt = t - leg.end;
            if (dt < 0 || dt > 1) return null;
            const b = STOP[leg.to].port;
            return [0, 0.25].map((o, j) => {
              const q = clamp01((dt - o) / 0.75);
              return <circle key={`${i}-${j}`} cx={b.x} cy={b.y} r={10 + q * 90} fill="none" stroke="#fff" strokeWidth={6 * (1 - q)} opacity={1 - q} />;
            });
          })}

          {/* transporte */}
          {curLeg && (() => {
            const c = legCurve(curLeg, curLegIdx);
            const p = legProgress(curLeg, t);
            const pos = bez(c.a, c.ctrl, c.b, p);
            if (curLeg.mode === "plane") {
              const alt = Math.sin(Math.PI * p);
              const sc = 0.9 + alt * 0.5;
              return (
                <g>
                  <g transform={`translate(${pos.x + 22 * alt} ${pos.y + 34 * alt}) rotate(${heading}) scale(${sc * 0.9})`} opacity={0.3}>
                    <path d={PLANE} fill="#002244" />
                  </g>
                  <g transform={`translate(${pos.x} ${pos.y}) rotate(${heading}) scale(${sc})`} filter="url(#glow)">
                    <path d={PLANE} fill="#ffffff" stroke="#003893" strokeWidth={3} strokeLinejoin="round" />
                    <circle cx={-20} cy={0} r={3} fill="#cf2027" />
                  </g>
                </g>
              );
            }
            const bob = Math.sin(frame / 3) * 2;
            return (
              <g transform={`translate(${pos.x} ${pos.y + bob}) rotate(${heading})`}>
                {/* esteira */}
                {[0, 1, 2, 3].map((j) => {
                  const q = ((frame / 10 + j / 4) % 1);
                  return <path key={j} d={`M ${-26 - q * 60} ${-8 - q * 26} L -26 0 L ${-26 - q * 60} ${8 + q * 26}`} stroke="#fff" strokeWidth={4} fill="none" opacity={(1 - q) * 0.8} />;
                })}
                <path d={BOAT_HULL} fill="#ffffff" stroke="#003893" strokeWidth={3} filter="url(#shadow)" />
                <rect x={-14} y={-7} width={22} height={14} rx={3} fill="#cf2027" />
                <rect x={10} y={-4} width={6} height={8} rx={2} fill="#003893" />
              </g>
            );
          })()}

          {/* etiquetas */}
          {ISLANDS.filter((i) => !i.minor).map((isl) => {
            const k = POP_ORDER.indexOf(isl.id);
            const s = spring({ frame: frame - (TL.islandPops[k] + 0.1) * fps, fps, config: { damping: 12, stiffness: 160 } });
            if (s < 0.01) return null;
            const visited = t >= visitedAt(isl.id);
            const sz = 1 / Math.max(1, zoom * 0.75);
            const x = isl.c.x + (isl.labelDx ?? 0);
            const y = isl.c.y + (isl.labelDy ?? -60);
            const w = isl.name.length * 15 + 34;
            return (
              <g key={isl.id} transform={`translate(${x} ${y}) scale(${s * sz * 1.25})`}>
                <rect x={-w / 2} y={-19} width={w} height={38} rx={19} fill={visited ? "#f7d116" : "rgba(0,35,90,0.82)"} stroke="#fff" strokeWidth={2.5} />
                <text x={0} y={8} textAnchor="middle" fontFamily={BODY} fontWeight={900} fontSize={21} letterSpacing={1.5} fill={visited ? "#002a6b" : "#fff"}>
                  {isl.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* nuvens em voo */}
      {planeAmt > 0.02 &&
        new Array(9).fill(0).map((_, i) => {
          const sp = 40 + random(`cs${i}`) * 50;
          const rad = (heading * Math.PI) / 180;
          const base = random(`cb${i}`) * 2400;
          const d = ((frame * sp + base) % 2400) - 1200;
          const perp = (random(`cp${i}`) - 0.5) * 1900;
          const x = 540 - Math.cos(rad) * d - Math.sin(rad) * perp;
          const y = 960 - Math.sin(rad) * d + Math.cos(rad) * perp;
          const s = 220 + random(`cz${i}`) * 260;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x - s / 2,
                top: y - s / 3,
                width: s,
                height: s * 0.6,
                borderRadius: "50%",
                background: "radial-gradient(ellipse, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0) 70%)",
                filter: "blur(6px)",
                opacity: planeAmt * 0.85,
              }}
            />
          );
        })}
      <SpeedLines strength={planeAmt * 0.5} angle={heading + 180} />

      {/* HUD */}
      {mode === "journey" && <Hud t={t} curLegIdx={curLegIdx} />}
    </AbsoluteFill>
  );
};

const NAMES: Record<string, string> = { praia: "PRAIA", sv: "S. VICENTE", sa: "S. ANTÃO", sn: "S. NICOLAU", sal: "SAL", bv: "BOA VISTA", fogo: "FOGO", brava: "BRAVA", maio: "MAIO" };

const Hud: React.FC<{ t: number; curLegIdx: number }> = ({ t, curLegIdx }) => {
  const [js, je] = TL.scenes.journey;
  const vis = interpolate(t, [js - 0.2, js + 0.3, je - 2.2, je - 1.6], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (vis <= 0) return null;
  const done = LEGS.filter((l) => t >= l.end).length;
  const idx = curLegIdx >= 0 ? curLegIdx : Math.max(0, done - 1);
  const leg = LEGS[idx];
  return (
    <>
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 150, opacity: vis, transform: `translateY(${(1 - vis) * 80}px)` }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "22px 34px",
            borderRadius: 28,
            background: "rgba(0,30,80,0.72)",
            border: "2px solid rgba(255,255,255,0.35)",
            backdropFilter: "blur(8px)",
            fontFamily: BODY,
            color: "#fff",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 44, letterSpacing: 2 }}>{NAMES[leg.from]}</div>
          <div style={{ fontSize: 46 }}>{leg.mode === "plane" ? "✈" : "⛴"}</div>
          <div style={{ fontWeight: 900, fontSize: 44, letterSpacing: 2, color: "#f7d116" }}>{NAMES[leg.to]}</div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "center" }}>
          {LEGS.map((l, i) => {
            const fill = clamp01((t - l.start) / (l.end - l.start));
            return (
              <div key={i} style={{ flex: 1, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.25)", overflow: "hidden" }}>
                <div style={{ width: `${fill * 100}%`, height: "100%", background: l.mode === "plane" ? "#fff" : "#f7d116" }} />
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 110,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: HEAD,
          color: "#fff",
          fontSize: 36,
          letterSpacing: 12,
          opacity: vis * 0.9,
          textShadow: "0 3px 12px rgba(0,0,0,0.4)",
        }}
      >
        VIAGEM {String(Math.min(12, done + (curLegIdx >= 0 ? 1 : 0))).padStart(2, "0")} / 12
      </div>
    </>
  );
};
