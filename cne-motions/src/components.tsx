import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { at, ramp, useIn, useOut } from "./anim";
import { NAVY, RED, SANS, SERIF, SHADOW, WHITE } from "./theme";

// ---------- Shared building blocks ----------

// Navy label with red left bar (same language as the "Jussara Évora" lower third)
const Tag: React.FC<{ text: string; delay: number; size?: number; color?: string }> = ({
  text,
  delay,
  size = 40,
  color = NAVY,
}) => {
  const frame = useCurrentFrame();
  const p = ramp(frame, delay, 12);
  const bar = ramp(frame, delay + 6, 12);
  return (
    <div style={{ position: "relative", display: "inline-block", opacity: p > 0 ? 1 : 0 }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: size * 0.3, background: RED, transform: `scaleY(${p})`, transformOrigin: "top" }} />
      <div
        style={{
          marginLeft: size * 0.3,
          background: color,
          padding: `${size * 0.3}px ${size * 0.7}px`,
          clipPath: `inset(0 ${100 - p * 100}% 0 0)`,
        }}
      >
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: size, color: WHITE, whiteSpace: "nowrap", letterSpacing: 0.5 }}>{text}</span>
      </div>
      <div style={{ position: "absolute", left: size * 0.3, bottom: -size * 0.32, height: size * 0.18, width: "55%", background: RED, transform: `scaleX(${bar})`, transformOrigin: "left" }} />
    </div>
  );
};

// Word that rises from behind a mask
const Rise: React.FC<{ children: React.ReactNode; delay: number; style?: React.CSSProperties }> = ({ children, delay, style }) => {
  const p = useIn(delay, 18);
  return (
    <div style={{ overflow: "hidden", paddingBottom: 8 }}>
      <div style={{ transform: `translateY(${(1 - p) * 110}%)`, ...style }}>{children}</div>
    </div>
  );
};

const big = (size: number): React.CSSProperties => ({
  fontFamily: SANS,
  fontWeight: 900,
  fontSize: size,
  lineHeight: 1,
  color: WHITE,
  textShadow: SHADOW,
  letterSpacing: -1,
  whiteSpace: "nowrap",
});

// ---------- Icons ----------

export const CheckIcon: React.FC<{ size: number; draw: number }> = ({ size, draw }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="46" fill={RED} transform={`scale(${draw > 0 ? 1 : 0})`} style={{ transformOrigin: "50px 50px" }} />
    <path d="M28 52 L44 67 L73 35" fill="none" stroke={WHITE} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
  </svg>
);

const PersonIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size * 1.4} viewBox="0 0 100 140">
    <circle cx="50" cy="32" r="24" fill={color} />
    <path d="M8 140 C8 90 28 68 50 68 C72 68 92 90 92 140 Z" fill={color} />
  </svg>
);

const BirdIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M10 44 C26 30 40 34 50 52 C60 34 74 30 90 44 C74 42 62 50 50 70 C38 50 26 42 10 44 Z" fill={WHITE} />
  </svg>
);

const LockIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M32 46 V34 a18 18 0 0 1 36 0 V46" fill="none" stroke={WHITE} strokeWidth="9" />
    <rect x="22" y="46" width="56" height="40" rx="7" fill={WHITE} />
    <circle cx="50" cy="64" r="6" fill={RED} />
  </svg>
);

// ---------- 1. Kinetic keyword ----------

export const Keyword: React.FC<{
  start: number;
  lines: { text: string; at: number; size: number; red?: boolean }[];
  pos: React.CSSProperties;
  align?: "left" | "right";
  underlineAt?: number;
}> = ({ start, lines, pos, align = "left", underlineAt }) => {
  const frame = useCurrentFrame();
  const out = useOut();
  const ul = underlineAt !== undefined ? ramp(frame, at(underlineAt, start), 10) : 0;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", ...pos, opacity: out, transform: `translateY(${(1 - out) * -30}px)`, textAlign: align, display: "flex", flexDirection: "column", alignItems: align === "left" ? "flex-start" : "flex-end" }}>
        {lines.map((l, i) => {
          const d = at(l.at, start);
          return (
            <Rise key={i} delay={d}>
              {l.red ? (
                <span style={{ ...big(l.size), background: RED, padding: "4px 18px", display: "inline-block", textShadow: "none" }}>{l.text}</span>
              ) : (
                <span style={big(l.size)}>{l.text}</span>
              )}
            </Rise>
          );
        })}
        {underlineAt !== undefined && <div style={{ marginTop: 10, height: 14, width: 360, background: RED, transform: `scaleX(${ul})`, transformOrigin: align }} />}
      </div>
    </AbsoluteFill>
  );
};

// ---------- 2. Date block "15 NOVEMBRO 2026" ----------

export const DateBlock: React.FC<{ start: number; tag?: { text: string; at: number } }> = ({ start, tag }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  const pop = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const count = Math.max(1, Math.min(15, Math.round(interpolate(frame, [0, 14], [1, 15], { extrapolateRight: "clamp" }))));
  const box = ramp(frame, 5, 12);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 130, top: 430, opacity: out, transform: `translateX(${(1 - out) * -60}px)` }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 22 }}>
          <div style={{ ...big(300), letterSpacing: -14, transform: `scale(${0.6 + 0.4 * pop})`, transformOrigin: "bottom left", lineHeight: 0.8, width: 330, textAlign: "right" }}>{count}</div>
          <div>
            <div style={{ display: "inline-block", background: RED, padding: "6px 20px", clipPath: `inset(0 ${100 - box * 100}% 0 0)` }}>
              <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 62, color: WHITE, lineHeight: 1 }}>NOVEMBRO</span>
            </div>
            <Rise delay={9}>
              <span style={{ ...big(150), letterSpacing: -4, lineHeight: 0.85 }}>2026</span>
            </Rise>
          </div>
        </div>
        {tag && (
          <div style={{ marginTop: 38, marginLeft: 18 }}>
            <Tag text={tag.text} delay={at(tag.at, start)} size={42} />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ---------- 3. Ballot dropping into the box ----------

export const BallotBox: React.FC<{ start: number; dropAt: number; labelAt: number }> = ({ start, dropAt, labelAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  const inn = useIn(0, 14);
  const ballotIn = useIn(4, 12);
  const drop = spring({ frame: frame - at(dropAt, start), fps, config: { damping: 200 }, durationInFrames: 14 });
  const xDraw = ramp(frame, 12, 10);
  const label = ramp(frame, at(labelAt, start), 10);
  const bump = drop > 0.95 ? spring({ frame: frame - at(dropAt, start) - 12, fps, config: { damping: 8 } }) : 0;
  const boxScale = 1 + 0.04 * Math.sin(bump * Math.PI);
  const ballotY = -40 + drop * 260 + (1 - ballotIn) * -60;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", right: 200, top: 240, width: 440, opacity: out * inn, transform: `scale(${(0.85 + 0.15 * inn) * boxScale})`, transformOrigin: "50% 80%" }}>
        <svg width={440} height={440} viewBox="0 0 440 440">
          <defs>
            <clipPath id="aboveSlot">
              <rect x="0" y="-400" width="440" height="600" />
            </clipPath>
          </defs>
          {/* ballot */}
          <g clipPath="url(#aboveSlot)" opacity={ballotIn}>
            <g transform={`translate(160 ${ballotY}) rotate(${(1 - drop) * -8} 60 75)`}>
              <rect width="120" height="150" rx="6" fill={WHITE} stroke={NAVY} strokeWidth="6" />
              <rect x="18" y="22" width="84" height="8" fill="#C9CED9" />
              <rect x="18" y="40" width="60" height="8" fill="#C9CED9" />
              <path d="M38 78 L82 122 M82 78 L38 122" stroke={RED} strokeWidth="12" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - xDraw} />
            </g>
          </g>
          {/* box */}
          <path d="M70 200 L370 200 L400 240 L40 240 Z" fill={NAVY} />
          <rect x="140" y="194" width="160" height="12" rx="6" fill={RED} />
          <rect x="60" y="240" width="320" height="180" rx="8" fill={WHITE} stroke={NAVY} strokeWidth="10" />
          <rect x="60" y="270" width="320" height="10" fill={RED} />
          <image href={staticFile("cne.png")} x="95" y="315" width="250" height="65" preserveAspectRatio="xMidYMid meet" />
        </svg>
        <div style={{ textAlign: "center", marginTop: 14, opacity: label, transform: `translateY(${(1 - label) * 20}px)` }}>
          <span style={{ ...big(64), background: NAVY, padding: "8px 26px", textShadow: "none" }}>O TEU VOTO</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 4. History: only a few could vote ----------

export const FewPeople: React.FC<{ start: number; titleAt: number; peopleAt: number; dimAt: number; captionAt: number }> = ({
  start,
  titleAt,
  peopleAt,
  dimAt,
  captionAt,
}) => {
  const frame = useCurrentFrame();
  const out = useOut();
  const pAt = at(peopleAt, start);
  const dim = ramp(frame, at(dimAt, start), 12);
  const cap = ramp(frame, at(captionAt, start), 10);
  const chosen = [2, 5];
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", right: 110, top: 250, width: 640, opacity: out, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <Tag text="HISTÓRIA DO VOTO" delay={0} size={34} />
        <div style={{ marginTop: 34 }}>
          <Rise delay={at(titleAt, start)}>
            <span style={big(76)}>UMA IDEIA</span>
          </Rise>
          <Rise delay={at(titleAt, start) + 4}>
            <span style={{ ...big(76), color: RED, textShadow: "none", background: WHITE, padding: "2px 16px", display: "inline-block" }}>ANTIGA</span>
          </Rise>
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 50 }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const p = ramp(frame, pAt + i * 2, 8);
            const isChosen = chosen.includes(i);
            const op = isChosen ? 1 : 1 - 0.72 * dim;
            return (
              <div key={i} style={{ opacity: p * op, transform: `translateY(${(1 - p) * 30}px) scale(${isChosen ? 1 + 0.12 * dim : 1})`, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}>
                <PersonIcon size={60} color={isChosen && dim > 0 ? RED : WHITE} />
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 26, opacity: cap, transform: `translateY(${(1 - cap) * 16}px)`, background: NAVY, padding: "12px 22px" }}>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 36, color: WHITE }}>SÓ ALGUNS PODIAM PARTICIPAR</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 5. Conditions that got crossed out ----------

export const Conditions: React.FC<{ start: number; items: { text: string; at: number }[]; strikeAt: number }> = ({ start, items, strikeAt }) => {
  const frame = useCurrentFrame();
  const out = useOut(7);
  const s0 = at(strikeAt, start);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 90, top: 290, opacity: out, transform: `translateX(${(1 - out) * -50}px)` }}>
        <Tag text="O VOTO DEPENDIA DE:" delay={0} size={36} />
        <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map((it, i) => {
            const p = ramp(frame, at(it.at, start), 10);
            const strike = ramp(frame, s0 + i * 3, 7);
            return (
              <div key={i} style={{ position: "relative", alignSelf: "flex-start", opacity: p * (1 - 0.35 * strike), transform: `translateX(${(1 - p) * -60}px)` }}>
                <span style={big(56)}>{it.text}</span>
                <div style={{ position: "absolute", left: -10, right: -10, top: "48%", height: 12, background: RED, transform: `scaleX(${strike}) rotate(-2deg)`, transformOrigin: "left", borderRadius: 6 }} />
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 6. "Hoje é diferente" punch + flash ----------

export const TodayFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const out = useOut(6);
  const flash = interpolate(frame, [0, 2, 9], [0, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pop = useIn(1, 10);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: WHITE, opacity: flash }} />
      <div style={{ position: "absolute", right: 120, top: 420, opacity: out, transform: `scale(${1.4 - 0.4 * pop})`, transformOrigin: "right center", textAlign: "right" }}>
        <div style={{ ...big(64), opacity: pop }}>MAS</div>
        <div style={{ ...big(120), background: RED, padding: "6px 22px", textShadow: "none", display: "inline-block", opacity: pop }}>HOJE</div>
        <div style={{ ...big(80), opacity: pop, marginTop: 6 }}>É DIFERENTE</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 7. Who can vote: requirements ----------

export const Requirements: React.FC<{ start: number; items: { text: string; at: number }[] }> = ({ start, items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", right: 110, top: 300, opacity: out, transform: `translateX(${(1 - out) * 50}px)`, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <Tag text="QUEM PODE VOTAR?" delay={0} size={42} />
        <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 24, alignItems: "flex-end" }}>
          {items.map((it, i) => {
            const d = at(it.at, start);
            const p = spring({ frame: frame - d, fps, config: { damping: 11, mass: 0.6 } });
            const draw = ramp(frame, d + 5, 9);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, background: "rgba(31,43,69,0.92)", padding: "18px 34px 18px 22px", transform: `scale(${p})`, transformOrigin: "right center", opacity: p > 0.01 ? 1 : 0 }}>
                <CheckIcon size={78} draw={draw} />
                <span style={{ ...big(64), textShadow: "none" }}>{it.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 8. Etymology: VOTUM ----------

export const Votum: React.FC<{ start: number; wordAt: number; meanings: { text: string; at: number }[]; highlightAt: number }> = ({
  start,
  wordAt,
  meanings,
  highlightAt,
}) => {
  const frame = useCurrentFrame();
  const out = useOut();
  const w = at(wordAt, start);
  const line = ramp(frame, w + 8, 14);
  const hl = ramp(frame, at(highlightAt, start), 10);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 120, top: 250, opacity: out, transform: `translateY(${(1 - out) * -30}px)` }}>
        <Rise delay={0}>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 38, color: WHITE, textShadow: SHADOW, letterSpacing: 6 }}>A PALAVRA</span>
        </Rise>
        <Rise delay={w}>
          <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 170, color: WHITE, textShadow: SHADOW, lineHeight: 1.05 }}>Votum</span>
        </Rise>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 4 }}>
          <div style={{ height: 6, width: 120, background: RED, transform: `scaleX(${line})`, transformOrigin: "left" }} />
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 44, color: WHITE, textShadow: SHADOW, opacity: line }}>latim</span>
        </div>
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 14 }}>
          {meanings.map((m, i) => {
            const p = ramp(frame, at(m.at, start), 10);
            const isLast = i === meanings.length - 1;
            return (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 18, opacity: p, transform: `translateX(${(1 - p) * -40}px)` }}>
                <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 48, color: RED, textShadow: "0 2px 10px rgba(255,255,255,0.5)" }}>{i + 1}.</span>
                <span style={{ position: "relative", fontFamily: SANS, fontWeight: 700, fontSize: 52, color: WHITE, textShadow: SHADOW }}>
                  {isLast && <span style={{ position: "absolute", left: -8, right: -8, bottom: 2, height: 22, background: RED, opacity: 0.9, transform: `scaleX(${hl})`, transformOrigin: "left", zIndex: -1 }} />}
                  {m.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 9. Next episode teaser ----------

export const NextEpisode: React.FC = () => {
  const frame = useCurrentFrame();
  const out = useOut();
  const card = ramp(frame, 6, 14);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", right: 110, bottom: 150, opacity: out, transform: `translateY(${(1 - out) * 30}px)`, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <div style={{ background: RED, padding: "10px 24px", clipPath: `inset(0 0 0 ${100 - ramp(frame, 0, 10) * 100}%)` }}>
          <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 34, color: WHITE, letterSpacing: 2 }}>PRÓXIMO EPISÓDIO</span>
        </div>
        <div style={{ background: NAVY, padding: "26px 34px", clipPath: `inset(0 0 ${100 - card * 100}% 0)`, maxWidth: 720 }}>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 32, color: "#C9D2E6" }}>CNE Explica · Ep. 2</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 54, color: WHITE, lineHeight: 1.1, marginTop: 8 }}>O que faz o Presidente da República?</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 10. Pessoal · Livre · Secreto ----------

export const VoteIs: React.FC<{ start: number; items: { text: string; at: number; icon: "person" | "bird" | "lock" }[] }> = ({ start, items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", right: 120, top: 280, opacity: out, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <Tag text="O VOTO É" delay={0} size={40} />
        <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 22, alignItems: "flex-end" }}>
          {items.map((it, i) => {
            const d = at(it.at, start);
            const p = spring({ frame: frame - d, fps, config: { damping: 10, mass: 0.6 } });
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, opacity: p > 0.01 ? 1 : 0, transform: `translateX(${(1 - p) * 120}px) scale(${0.8 + 0.2 * p})`, transformOrigin: "right center" }}>
                <span style={big(100)}>{it.text}</span>
                <div style={{ width: 104, height: 104, borderRadius: 52, background: RED, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {it.icon === "person" && <PersonIcon size={50} color={WHITE} />}
                  {it.icon === "bird" && <BirdIcon size={78} />}
                  {it.icon === "lock" && <LockIcon size={70} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 11. Outro band ----------

export const Outro: React.FC<{ start: number; ctaAt: number }> = ({ start, ctaAt }) => {
  const frame = useCurrentFrame();
  const band = useIn(0, 20);
  const cta = useIn(at(ctaAt, start), 10);
  const logo = ramp(frame, 8, 14);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 190, transform: `translateY(${(1 - band) * 200}px)` }}>
        <div style={{ position: "absolute", inset: 0, background: NAVY }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 10, background: RED }} />
        <div style={{ position: "absolute", left: 120, top: 0, bottom: 0, display: "flex", alignItems: "center", gap: 28 }}>
          <Rise delay={4}>
            <span style={{ ...big(72), textShadow: "none" }}>CADA VOTO CONTA.</span>
          </Rise>
          <div style={{ background: RED, padding: "8px 24px", transform: `scale(${cta})`, opacity: cta > 0.01 ? 1 : 0 }}>
            <span style={{ ...big(72), textShadow: "none" }}>PARTICIPA!</span>
          </div>
        </div>
        <Img src={staticFile("eleicao-branco.png")} style={{ position: "absolute", right: 110, top: 22, height: 150, opacity: logo }} />
      </div>
    </AbsoluteFill>
  );
};
