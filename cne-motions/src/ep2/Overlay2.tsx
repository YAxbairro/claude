import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { at, ramp, useIn, useOut } from "../anim";
import { Keyword, NextEpisode, Requirements, Rise, Tag, big } from "../components";
import { NAVY, RED, SANS, SHADOW, WHITE, t } from "../theme";

// "CNE Explica – Ep. 2: o Presidente da República". Timestamps from the word-level transcript.
const FPS = 24000 / 1001;
export const EP2_DURATION = Math.ceil(119.995 * FPS);

const Seg: React.FC<{ from: number; to: number; name: string; children: React.ReactNode }> = ({ from, to, name, children }) => (
  <Sequence from={t(from)} durationInFrames={t(to) - t(from)} name={name} layout="none">
    {children}
  </Sequence>
);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------- 5-year mandate counter ----------
const Mandate: React.FC<{ start: number; numberAt: number }> = ({ start, numberAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  const d = at(numberAt, start);
  const count = Math.max(1, Math.min(5, Math.round(interpolate(frame, [d, d + 10], [1, 5], clamp))));
  const pop = spring({ frame: frame - d, fps, config: { damping: 11, mass: 0.7 } });
  const bar = ramp(frame, d + 4, 14);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 130, top: 330, opacity: out, transform: `translateX(${(1 - out) * -60}px)` }}>
        <Tag text="MANDATO" delay={0} size={40} />
        <div style={{ display: "flex", alignItems: "flex-end", gap: 24, marginTop: 30 }}>
          <div style={{ ...big(300), color: RED, textShadow: "none", lineHeight: 0.8, transform: `scale(${0.5 + 0.5 * pop})`, transformOrigin: "bottom left", opacity: pop > 0.01 ? 1 : 0 }}>{count}</div>
          <div style={{ paddingBottom: 6 }}>
            <Rise delay={d + 4}>
              <span style={{ ...big(120), letterSpacing: -3 }}>ANOS</span>
            </Rise>
          </div>
        </div>
        {/* five segments filling like a timeline */}
        <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ width: 92, height: 14, borderRadius: 7, background: "rgba(255,255,255,0.35)", overflow: "hidden" }}>
              <div style={{ width: `${interpolate(bar * 5 - i, [0, 1], [0, 100], clamp)}%`, height: "100%", background: WHITE }} />
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Constitution of Cabo Verde (2020 edition), redrawn as a clean vector cover ----------
const Star: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => {
  const pts = Array.from({ length: 10 })
    .map((_, k) => {
      const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = k % 2 === 0 ? r : r * 0.42;
      return `${(x + Math.cos(a) * rr).toFixed(2)},${(y + Math.sin(a) * rr).toFixed(2)}`;
    })
    .join(" ");
  return <polygon points={pts} fill="#F7C51E" />;
};

export const ConstitutionBook: React.FC<{ enter: number; sheen: number; shadow?: boolean; tilt?: number }> = ({ enter, sheen, shadow = true, tilt = -3 }) => {
  const W = 300;
  const H = 420;
  // flag band (proportions as printed on the cover)
  const fy = 64;
  const fh = 174;
  const u = fh / 12;
  const cx = 103;
  const cy = fy + 7.5 * u;
  const ink = "#2E2E33";
  const font = "Montserrat";
  return (
    <svg
      width={W + 22}
      height={H + 18}
      viewBox={`0 0 ${W + 22} ${H + 18}`}
      style={{
        transform: `translateY(${(1 - enter) * 130}px) rotate(${(1 - enter) * 10 + tilt}deg)`,
        opacity: enter > 0.01 ? 1 : 0,
        filter: shadow ? "drop-shadow(0 22px 34px rgba(0,0,0,0.38))" : undefined,
        overflow: "visible",
      }}
    >
      <defs>
        <linearGradient id="coverLight" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="spine" x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.22" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sheen" x1="0" x2="1" y1="0" y2="0.4">
          <stop offset={sheen * 1.4 - 0.3} stopColor="#fff" stopOpacity="0" />
          <stop offset={sheen * 1.4 - 0.15} stopColor="#fff" stopOpacity="0.55" />
          <stop offset={sheen * 1.4} stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="coverClip">
          <rect width={W} height={H} rx="6" />
        </clipPath>
      </defs>
      {/* page block */}
      <rect x="14" y="10" width={W} height={H} rx="6" fill="#E9E4D8" />
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x={W + 2 + i * 2} y={12 + i} width="1" height={H - 4} fill="#CFC8B8" />
      ))}
      {/* cover */}
      <g clipPath="url(#coverClip)">
        <rect width={W} height={H} fill="#F6F5F1" />
        <text x={W / 2} y="28" textAnchor="middle" fontFamily={font} fontWeight={700} fontSize="12.5" fill={ink} letterSpacing="0.3">
          MINISTÉRIO DA JUSTIÇA E TRABALHO
        </text>
        <text x={W / 2} y="54" textAnchor="middle" fontFamily={font} fontWeight={800} fontSize="18" fill={ink} letterSpacing="0.5">
          CABO VERDE
        </text>
        {/* flag of Cabo Verde */}
        <rect y={fy} width={W} height={fh} fill="#2F4CA0" />
        <rect y={fy + 6 * u} width={W} height={u} fill="#FFFFFF" />
        <rect y={fy + 7 * u} width={W} height={u} fill="#D62532" />
        <rect y={fy + 8 * u} width={W} height={u} fill="#FFFFFF" />
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
          return <Star key={i} x={cx + Math.cos(a) * 4.4 * u} y={cy + Math.sin(a) * 4.4 * u} r={0.95 * u} />;
        })}
        <text x={W / 2} y="290" textAnchor="middle" fontFamily={font} fontWeight={800} fontSize="17.5" fill={ink} letterSpacing="0.2">
          CONSTITUIÇÃO DA REPÚBLICA
        </text>
        <text x={W / 2} y="314" textAnchor="middle" fontFamily={font} fontWeight={800} fontSize="17.5" fill={ink} letterSpacing="0.2">
          DE CABO VERDE
        </text>
        <text x={W / 2} y="386" textAnchor="middle" fontFamily={font} fontWeight={700} fontSize="10.5" fill={ink} letterSpacing="1">
          EDIÇÃO
        </text>
        <text x={W / 2} y="400" textAnchor="middle" fontFamily={font} fontWeight={700} fontSize="10.5" fill={ink} letterSpacing="1">
          2020
        </text>
        <rect width={W} height={H} fill="url(#coverLight)" />
        <rect width="16" height={H} fill="url(#spine)" />
        <rect width={W} height={H} fill="url(#sheen)" />
      </g>
    </svg>
  );
};

// ---------- Constitution book + articles ----------
const Constitution: React.FC<{ start: number; artAt: number; art2At: number }> = ({ start, artAt, art2At }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  const book = spring({ frame, fps, config: { damping: 13, mass: 0.7 } });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", right: 120, top: 140, opacity: out, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <ConstitutionBook enter={book} sheen={ramp(frame, 18, 22)} />
        <div style={{ marginTop: 26, textAlign: "right" }}>
          <Rise delay={at(artAt, start) - 3}>
            <span style={{ ...big(44), letterSpacing: 4 }}>ARTIGOS</span>
          </Rise>
          <div style={{ display: "flex", gap: 18, justifyContent: "flex-end", alignItems: "baseline" }}>
            <Rise delay={at(artAt, start)}>
              <span style={{ ...big(92), color: WHITE }}>134.º</span>
            </Rise>
            <Rise delay={at(art2At, start) - 4}>
              <span style={{ ...big(60) }}>e</span>
            </Rise>
            <Rise delay={at(art2At, start)}>
              <span style={{ ...big(92), background: RED, padding: "0 14px", textShadow: "none", display: "inline-block" }}>135.º</span>
            </Rise>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- One competence at a time (for the close shots, where space is narrow) ----------
const OneByOne: React.FC<{ start: number; header: string; items: { text: string; at: number }[]; numberFrom?: number; footnote?: { text: string; at: number } }> = ({
  start,
  header,
  items,
  numberFrom = 1,
  footnote,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const out = useOut();
  const fn = footnote ? ramp(frame, at(footnote.at, start), 10) : 0;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 110, top: 290, width: 560, opacity: out, transform: `translateX(${(1 - out) * -50}px)` }}>
        <Tag text={header} delay={0} size={34} />
        <div style={{ position: "relative", marginTop: 46, height: 300 }}>
          {items.map((it, i) => {
            const a = at(it.at, start);
            const b = i + 1 < items.length ? at(items[i + 1].at, start) : durationInFrames + 20;
            const enter = ramp(frame, a, 10);
            const leave = interpolate(frame, [b - 2, b + 6], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
            if (frame < a - 1 || frame > b + 8) return null;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 560,
                  opacity: enter * (1 - leave),
                  transform: `translateY(${(1 - enter) * 50 - leave * 50}px)`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <span style={{ ...big(80), color: RED, textShadow: "none", lineHeight: 1 }}>{String(numberFrom + i).padStart(2, "0")}</span>
                  <div style={{ flex: 1, height: 5, background: WHITE, opacity: 0.85, transform: `scaleX(${ramp(frame, a + 4, 12)})`, transformOrigin: "left" }} />
                </div>
                <div style={{ marginTop: 14, background: "rgba(31,43,69,0.92)", padding: "20px 26px" }}>
                  <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 46, lineHeight: 1.08, color: WHITE, textTransform: "uppercase" }}>{it.text}</span>
                </div>
              </div>
            );
          })}
        </div>
        {footnote && (
          <div style={{ marginTop: 40, opacity: fn, transform: `translateY(${(1 - fn) * 14}px)` }}>
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, color: WHITE, textShadow: SHADOW }}>{footnote.text}</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const Overlay2: React.FC = () => (
  <AbsoluteFill>
    <Seg from={6.4} to={9.75} name="01 O que significa ser PR">
      <Keyword
        start={6.4}
        pos={{ right: 130, top: 380 }}
        align="right"
        lines={[
          { text: "O QUE SIGNIFICA SER", at: 6.68, size: 46 },
          { text: "PRESIDENTE", at: 7.58, size: 100 },
          { text: "DA REPÚBLICA?", at: 8.38, size: 70, red: true },
        ]}
      />
    </Seg>

    <Seg from={9.75} to={12.9} name="02 Funcoes e competencias">
      <Keyword
        start={9.75}
        pos={{ right: 130, top: 420 }}
        align="right"
        underlineAt={11.2}
        lines={[
          { text: "FUNÇÕES", at: 10.24, size: 100 },
          { text: "E COMPETÊNCIAS", at: 10.72, size: 62, red: true },
        ]}
      />
    </Seg>

    <Seg from={14.3} to={18.9} name="03 Episodio 2">
      <Keyword
        start={14.3}
        pos={{ right: 130, top: 420 }}
        align="right"
        lines={[
          { text: "2.º EPISÓDIO", at: 14.42, size: 96 },
          { text: "CNE EXPLICA", at: 15.3, size: 64, red: true },
        ]}
      />
    </Seg>

    <Seg from={19.4} to={27.3} name="04 Chefe de Estado">
      <Keyword
        start={19.4}
        pos={{ right: 130, top: 270 }}
        align="right"
        lines={[
          { text: "É O NOSSO", at: 20.9, size: 50 },
          { text: "CHEFE", at: 21.1, size: 120 },
          { text: "DE ESTADO", at: 21.5, size: 84, red: true },
          { text: "PRINCIPAL REPRESENTANTE", at: 23.9, size: 34 },
          { text: "DO PAÍS, DENTRO E FORA", at: 25.0, size: 34 },
          { text: "DE CABO VERDE", at: 26.2, size: 34 },
        ]}
      />
    </Seg>

    <Seg from={27.4} to={30.5} name="05 Mandato de 5 anos">
      <Mandate start={27.4} numberAt={29.1} />
    </Seg>

    <Seg from={30.6} to={39.2} name="06 Garante (Constituicao)">
      <Requirements
        start={30.6}
        header="SEGUNDO A CONSTITUIÇÃO, GARANTE"
        headerSize={30}
        size={34}
        top={260}
        items={[
          { text: "A UNIDADE DA NAÇÃO", at: 34.24 },
          { text: "A INTEGRIDADE DO TERRITÓRIO", at: 35.7 },
          { text: "A SOBERANIA", at: 37.08 },
          { text: "A INDEPENDÊNCIA NACIONAL", at: 37.82 },
        ]}
      />
    </Seg>

    <Seg from={39.3} to={44.6} name="07 Vela pela Constituicao">
      <Requirements
        start={39.3}
        header="E VELA PELO CUMPRIMENTO"
        headerSize={34}
        size={36}
        top={330}
        items={[
          { text: "DA CONSTITUIÇÃO", at: 41.68 },
          { text: "DOS TRATADOS INTERNACIONAIS", at: 43.04 },
        ]}
      />
    </Seg>

    <Seg from={44.8} to={48.8} name="08 Quais as competencias">
      <Keyword
        start={44.8}
        pos={{ left: 130, top: 420 }}
        lines={[
          { text: "E QUAIS SÃO AS", at: 44.9, size: 52 },
          { text: "COMPETÊNCIAS?", at: 45.68, size: 92, red: true },
        ]}
      />
    </Seg>

    <Seg from={48.9} to={60.7} name="09 Orgao de soberania">
      <Keyword
        start={48.9}
        pos={{ left: 130, top: 330 }}
        lines={[
          { text: "TAMBÉM É UM", at: 52.74, size: 50 },
          { text: "ÓRGÃO DE", at: 53.34, size: 84 },
          { text: "SOBERANIA", at: 53.76, size: 104, red: true },
          { text: "COM PODERES DEFINIDOS PELA", at: 57.0, size: 34 },
          { text: "CONSTITUIÇÃO DA REPÚBLICA", at: 58.94, size: 34 },
        ]}
      />
    </Seg>

    <Seg from={60.9} to={67.4} name="10 Artigos 134 e 135">
      <Constitution start={60.9} artAt={61.48} art2At={62.62} />
    </Seg>

    <Seg from={67.6} to={83.3} name="11 Competencias (uma a uma)">
      <OneByOne
        start={67.6}
        header="ALGUMAS COMPETÊNCIAS"
        items={[
          { text: "Promulga e manda publicar leis e decretos", at: 69.34 },
          { text: "Exerce o direito de veto", at: 74.52 },
          { text: "Demite o Governo", at: 75.78 },
          { text: "Dissolve a Assembleia Nacional", at: 76.68 },
          { text: "Nomeia o Primeiro-Ministro", at: 80.66 },
        ]}
      />
    </Seg>

    <Seg from={83.4} to={92.3} name="12 Relacoes internacionais">
      <OneByOne
        start={83.4}
        header="RELAÇÕES INTERNACIONAIS"
        numberFrom={6}
        items={[
          { text: "Ratifica e aprova tratados internacionais", at: 85.56 },
          { text: "Recebe representantes diplomáticos de outros países", at: 89.4 },
        ]}
      />
    </Seg>

    <Seg from={92.5} to={101.5} name="13 Chefe de Estado, mas nao governa">
      <Requirements
        start={92.5}
        header="ATENÇÃO"
        size={34}
        top={330}
        items={[
          { text: "É CHEFE DE ESTADO", at: 96.5 },
          { text: "NÃO GOVERNA NO DIA A DIA", at: 99.8, no: true },
        ]}
      />
    </Seg>

    <Seg from={101.6} to={105.1} name="14 Sistema de governo">
      <Keyword
        start={101.6}
        pos={{ right: 130, top: 430 }}
        align="right"
        lines={[
          { text: "DEVIDO AO NOSSO", at: 102.26, size: 46 },
          { text: "SISTEMA DE GOVERNO", at: 103.52, size: 60, red: true },
        ]}
      />
    </Seg>

    <Seg from={105.4} to={113.9} name="15 Proximo episodio">
      <NextEpisode eyebrow="CNE Explica · Ep. 3" title="Presidente da República e Governo: quem faz o quê?" />
    </Seg>
  </AbsoluteFill>
);
