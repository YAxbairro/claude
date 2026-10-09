import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { SANS } from "../theme";
import { BLUE, INK_SOFT, NAVY, RED, SKY, ease, useSpring } from "./kit";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const card: React.CSSProperties = { background: "#fff", borderRadius: 28, boxShadow: "0 24px 60px rgba(20,36,94,0.16)" };

// ---------- November 2026 calendar: days 2-5 get marked one by one ----------
export const Calendar: React.FC<{ delay: number; markAt: number[] }> = ({ delay, markAt }) => {
  const frame = useCurrentFrame();
  const p = useSpring(delay, 13, 0.7);
  const days = ["D", "S", "T", "Q", "Q", "S", "S"];
  // 1 Nov 2026 is a Sunday
  const cells = Array.from({ length: 30 }, (_, i) => i + 1);
  return (
    <div style={{ ...card, width: 600, overflow: "hidden", transform: `translateY(${(1 - p) * 140}px) rotate(${(1 - p) * -6}deg)`, opacity: interpolate(p, [0, 0.3], [0, 1], clamp) }}>
      <div style={{ background: RED, height: 120, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {[150, 450].map((x) => (
          <div key={x} style={{ position: "absolute", left: x - 12, top: -18, width: 24, height: 52, borderRadius: 12, background: NAVY, border: "6px solid #fff" }} />
        ))}
        <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 52, color: "#fff", letterSpacing: 2 }}>NOVEMBRO 2026</span>
      </div>
      <div style={{ padding: "22px 30px 30px", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 10 }}>
        {days.map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 26, color: INK_SOFT, paddingBottom: 6 }}>
            {d}
          </div>
        ))}
        {cells.map((n) => {
          const idx = [2, 3, 4, 5].indexOf(n);
          const m = idx >= 0 ? ease(frame, markAt[idx], markAt[idx] + 6, Easing.out(Easing.back(2))) : 0;
          const in15 = n === 15;
          return (
            <div key={n} style={{ position: "relative", height: 58, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", width: 58, height: 58, borderRadius: 29, background: RED, transform: `scale(${m})` }} />
              {in15 && <div style={{ position: "absolute", width: 56, height: 56, borderRadius: 28, border: `4px solid ${NAVY}` }} />}
              <span style={{ position: "relative", fontFamily: SANS, fontWeight: 800, fontSize: 30, color: m > 0.5 ? "#fff" : NAVY }}>{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- Small calendar page "29 OUT" ----------
export const DatePage: React.FC<{ delay: number; day: string; month: string }> = ({ delay, day, month }) => {
  const p = useSpring(delay, 10, 0.6);
  return (
    <div style={{ ...card, width: 230, overflow: "hidden", transform: `scale(${p}) rotate(${(1 - p) * 12 - 4}deg)`, opacity: p > 0.02 ? 1 : 0 }}>
      <div style={{ background: RED, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 34, color: "#fff", letterSpacing: 3 }}>{month}</span>
      </div>
      <div style={{ textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 130, color: NAVY, lineHeight: 1.15 }}>{day}</div>
    </div>
  );
};

// ---------- Request form being filled in ----------
export const FormDoc: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const p = useSpring(delay, 14, 0.7);
  const rows = [0, 1, 2, 3];
  return (
    <div style={{ ...card, width: 420, height: 540, padding: 40, boxSizing: "border-box", transform: `translateY(${(1 - p) * 120}px) rotate(${-4 + (1 - p) * -8}deg)`, opacity: interpolate(p, [0, 0.3], [0, 1], clamp) }}>
      <div style={{ height: 22, width: 220, borderRadius: 11, background: NAVY }} />
      <div style={{ height: 14, width: 150, borderRadius: 7, background: RED, marginTop: 14 }} />
      <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 34 }}>
        {rows.map((r) => {
          const d = delay + 10 + r * 6;
          const fill = ease(frame, d, d + 10, Easing.out(Easing.cubic));
          const tick = ease(frame, d + 6, d + 12, Easing.out(Easing.back(2.5)));
          return (
            <div key={r} style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, border: `4px solid ${NAVY}`, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
                <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: `scale(${tick})` }}>
                  <path d="M5 15 L11 21 L23 7" stroke={RED} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ flex: 1, height: 14, borderRadius: 7, background: "#DDE3F0", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${fill * (70 + r * 7)}%`, background: BLUE, borderRadius: 7 }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 50, height: 2, background: "#C9D0E0" }} />
      <svg width="200" height="60" viewBox="0 0 200 60" style={{ marginTop: 6 }}>
        <path
          d="M8 40 C 30 10, 40 55, 60 30 S 95 15, 105 38 S 140 50, 190 20"
          stroke={NAVY}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - ease(frame, delay + 36, delay + 52)}
        />
      </svg>
    </div>
  );
};

// ---------- www.cne.cv pill with a clicking cursor ----------
export const UrlPill: React.FC<{ delay: number; clickAt: number }> = ({ delay, clickAt }) => {
  const frame = useCurrentFrame();
  const p = useSpring(delay, 13, 0.6);
  const typed = Math.floor(interpolate(frame, [delay + 4, delay + 18], [0, 10], clamp));
  const url = "www.cne.cv".slice(0, typed);
  const cur = ease(frame, clickAt - 14, clickAt, Easing.out(Easing.cubic));
  const press = interpolate(frame, [clickAt, clickAt + 3, clickAt + 8], [1, 0.9, 1], clamp);
  const ring = ease(frame, clickAt, clickAt + 14);
  return (
    <div style={{ position: "relative", transform: `scale(${p})`, opacity: p > 0.02 ? 1 : 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 26, border: `7px solid ${NAVY}`, borderRadius: 80, padding: "18px 56px 18px 22px", background: "#fff", transform: `scale(${press})` }}>
        <svg width="92" height="92" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill={NAVY} />
          <g stroke="#fff" strokeWidth="5" fill="none">
            <circle cx="50" cy="50" r="30" />
            <ellipse cx="50" cy="50" rx="13" ry="30" />
            <path d="M20 50 H80 M26 35 H74 M26 65 H74" />
          </g>
        </svg>
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 84, color: NAVY, minWidth: 470 }}>
          {url.split("cne").length > 1 ? (
            <>
              {url.split("cne")[0]}
              <span style={{ color: RED }}>cne</span>
              {url.split("cne")[1]}
            </>
          ) : (
            url
          )}
        </span>
      </div>
      <div style={{ position: "absolute", left: 470 - 60, top: 70 - 60, width: 120, height: 120, borderRadius: 60, border: `5px solid ${RED}`, transform: `scale(${ring * 1.4})`, opacity: (1 - ring) * (ring > 0 ? 1 : 0) }} />
      <svg width="70" height="90" viewBox="0 0 70 90" style={{ position: "absolute", left: 470 + (1 - cur) * 260, top: 70 + (1 - cur) * 160, transform: `scale(${press})`, opacity: cur > 0 ? 1 : 0 }}>
        <path d="M6 4 L6 70 L22 55 L34 82 L46 76 L34 50 L56 50 Z" fill={NAVY} stroke="#fff" strokeWidth="5" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// ---------- Phone handset with pulsing signal ----------
export const PhoneIcon: React.FC<{ delay: number; size: number }> = ({ delay, size }) => {
  const frame = useCurrentFrame();
  const p = useSpring(delay, 9, 0.6);
  const wiggle = Math.sin((frame - delay) / 1.6) * 6 * Math.max(0, 1 - (frame - delay - 6) / 20) * (frame > delay + 6 ? 1 : 0);
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ transform: `scale(${p}) rotate(${wiggle}deg)`, overflow: "visible" }}>
      <path
        d="M58 30 C 48 26, 38 30, 30 40 L 20 54 C 12 66, 14 82, 22 98 C 40 136, 66 162, 104 180 C 120 188, 136 188, 148 180 L 160 170 C 170 162, 172 150, 166 142 L 146 118 C 140 110, 128 108, 120 114 L 106 124 C 88 114, 76 102, 66 84 L 76 70 C 82 62, 82 50, 74 44 Z"
        fill={NAVY}
      />
      {[0, 1, 2].map((i) => {
        const t = ((frame - delay - 8 - i * 5) % 30) / 30;
        const on = frame > delay + 8 + i * 5;
        return (
          <path
            key={i}
            d={`M ${120 + i * 4} ${30 - i * 18} A ${50 + i * 22} ${50 + i * 22} 0 0 1 ${170 + i * 22} ${80 - i * 4}`}
            stroke={RED}
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
            opacity={on ? 0.35 + 0.65 * Math.abs(Math.cos(t * Math.PI)) : 0}
          />
        );
      })}
    </svg>
  );
};

// ---------- Institutional building (used instead of a prison illustration) ----------
export const InstitutionIcon: React.FC<{ delay: number; size: number }> = ({ delay, size }) => {
  const frame = useCurrentFrame();
  const d = (a: number, b: number) => ease(frame, delay + a, delay + b, Easing.out(Easing.cubic));
  const roof = d(0, 12);
  const cols = [0, 1, 2, 3];
  return (
    <svg width={size} height={size} viewBox="0 0 240 240">
      <circle cx="120" cy="120" r="116" fill={SKY} transform={`scale(${d(0, 10)})`} style={{ transformOrigin: "120px 120px" }} />
      <path d="M40 92 L120 44 L200 92 Z" fill={NAVY} transform={`translate(0 ${(1 - roof) * -30})`} opacity={roof} />
      <rect x="48" y="96" width="144" height="12" rx="3" fill={NAVY} opacity={roof} />
      {cols.map((c) => {
        const h = d(8 + c * 3, 20 + c * 3);
        return <rect key={c} x={62 + c * 32} y={112 + 72 * (1 - h)} width="20" height={72 * h} rx="3" fill={BLUE} />;
      })}
      <rect x="40" y="186" width="160" height="14" rx="3" fill={NAVY} transform={`scale(${d(4, 16)} 1)`} style={{ transformOrigin: "120px 193px" }} />
      <rect x="114" y="14" width="4" height={34 * d(20, 30)} fill={NAVY} />
      <path d="M118 14 L146 22 L118 30 Z" fill={RED} transform={`scale(${d(26, 34)} 1)`} style={{ transformOrigin: "118px 22px" }} />
    </svg>
  );
};

// ---------- Hospital icon (cross in a circle) ----------
export const HospitalIcon: React.FC<{ delay: number; size: number }> = ({ delay, size }) => {
  const frame = useCurrentFrame();
  const p = useSpring(delay, 10, 0.5);
  const beat = 1 + 0.06 * Math.max(0, Math.sin((frame - delay - 10) / 4)) * (frame > delay + 10 ? 1 : 0);
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" style={{ transform: `scale(${p * beat})` }}>
      <circle cx="120" cy="120" r="116" fill={SKY} />
      <path d="M96 56 H144 V96 H184 V144 H144 V184 H96 V144 H56 V96 H96 Z" fill={RED} />
    </svg>
  );
};

// ---------- Ballot with a check mark (opening scene) ----------
export const BallotIcon: React.FC<{ delay: number; size: number }> = ({ delay, size }) => {
  const frame = useCurrentFrame();
  const p = useSpring(delay, 12, 0.6);
  const x1 = ease(frame, delay + 8, delay + 14);
  const x2 = ease(frame, delay + 14, delay + 20);
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 200 240" style={{ transform: `translateY(${(1 - p) * 80}px) rotate(${-8 + (1 - p) * -10}deg)`, opacity: interpolate(p, [0, 0.3], [0, 1], clamp) }}>
      <rect x="10" y="10" width="180" height="220" rx="16" fill={RED} />
      <path d="M62 82 L138 170" stroke="#fff" strokeWidth="26" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - x1} />
      <path d="M140 86 L60 168" stroke="#fff" strokeWidth="26" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - x2} />
    </svg>
  );
};
