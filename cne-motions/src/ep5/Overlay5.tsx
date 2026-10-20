import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { at, ramp, useOut } from "../anim";
import { CheckIcon, CrossIcon, Keyword, Rise, Tag, big } from "../components";
import { NAVY, RED, SANS, WHITE, t } from "../theme";

// "CNE Explica – Ep. 5: voto válido, em branco e nulo". Timestamps from the word-level transcript.
const FPS = 24000 / 1001;
export const EP5_DURATION = Math.ceil(128.5 * FPS);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const BOX = "rgba(31,43,69,0.92)";

const Seg: React.FC<{ from: number; to: number; name: string; children: React.ReactNode }> = ({ from, to, name, children }) => (
  <Sequence from={t(from)} durationInFrames={t(to) - t(from)} name={name} layout="none">
    {children}
  </Sequence>
);

// ---------- Type card: "TIPO" + number + name of the vote, always on the right ----------
const TypeCard: React.FC<{ n: number; title: string; titleAt: number; start: number; top?: number; children?: React.ReactNode }> = ({ n, title, titleAt, start, top = 210, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  const pop = spring({ frame, fps, config: { damping: 11, mass: 0.6 } });
  const box = ramp(frame, at(titleAt, start), 12);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", right: 110, top, width: 640, opacity: out, transform: `translateX(${(1 - out) * 50}px)`, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Rise delay={2}>
            <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 38, color: NAVY, letterSpacing: "0.22em" }}>TIPO</span>
          </Rise>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              background: RED,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${pop})`,
              visibility: pop < 0.01 ? "hidden" : "visible",
              boxShadow: "0 8px 22px rgba(0,0,0,0.3)",
            }}
          >
            <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 58, color: WHITE }}>{n}</span>
          </div>
        </div>
        <div style={{ marginTop: 20, background: BOX, padding: "16px 28px", clipPath: `inset(0 0 0 ${100 - box * 100}%)`, visibility: box <= 0 ? "hidden" : "visible" }}>
          <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 60, lineHeight: 1.05, color: WHITE, whiteSpace: "nowrap" }}>{title}</span>
        </div>
        {children}
      </div>
    </AbsoluteFill>
  );
};

const Note: React.FC<{ delay: number; children: React.ReactNode; red?: boolean }> = ({ delay, children, red }) => {
  const frame = useCurrentFrame();
  const p = ramp(frame, delay, 10);
  return (
    <div
      style={{
        marginTop: 16,
        textAlign: "right",
        opacity: p,
        visibility: p <= 0 ? "hidden" : "visible",
        transform: `translateY(${(1 - p) * 14}px)`,
        ...(red ? { background: RED, padding: "8px 18px" } : {}),
      }}
    >
      <span style={{ fontFamily: SANS, fontWeight: red ? 900 : 800, fontSize: red ? 38 : 32, lineHeight: 1.25, color: red ? WHITE : NAVY, textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</span>
    </div>
  );
};

// ---------- Generic ballot paper (same as Ep. 4): identical anonymous rows, no candidate singled out ----------
const Cross: React.FC<{ x: number; y: number; s: number; draw: number }> = ({ x, y, s, draw }) => (
  <g>
    <path d={`M${x - s} ${y - s} L${x + s} ${y + s}`} stroke={RED} strokeWidth={s * 0.42} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, draw * 2)} />
    <path d={`M${x + s} ${y - s} L${x - s} ${y + s}`} stroke={RED} strokeWidth={s * 0.42} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, draw * 2 - 1)} />
  </g>
);

const Ballot: React.FC<{
  width: number;
  enterAt?: number;
  label?: { text: string; at: number };
  marks?: { row: number; at: number }[];
  // voto nulo by writing/drawing on the sheet: a hand-drawn squiggle and a doodle
  scribble?: [number, number];
  // "marque uma cruz": a magnifier shows a single square being crossed, detached from any row (as in Ep. 4)
  zoom?: { at: number; markAt: number };
  // voto nulo: crossed squares beside the sheet, stacked, never on a candidate row (as in Ep. 4)
  sideMarks?: number[];
}> = ({ width, enterAt = 0, label, marks = [], scribble, zoom, sideMarks = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - enterAt, fps, config: { damping: 14, mass: 0.7 } });
  const rows = 6;
  const W = 380;
  const H = 500;
  const rowH = 62;
  const lab = label ? spring({ frame: frame - label.at, fps, config: { damping: 11, mass: 0.6 } }) : 0;
  const sc1 = scribble ? ramp(frame, scribble[0], 16) : 0;
  const sc2 = scribble ? ramp(frame, scribble[1], 14) : 0;
  const lens = zoom ? spring({ frame: frame - zoom.at, fps, config: { damping: 12, mass: 0.6 } }) : 0;
  const mark = zoom ? ramp(frame, zoom.markAt, 12) : 0;
  const L = width * 0.62;
  return (
    <div style={{ position: "relative", width, transform: `translateY(${(1 - p) * 120}px) rotate(${(1 - p) * 8 + 2}deg)`, opacity: interpolate(p, [0, 0.3], [0, 1], clamp), visibility: p < 0.01 ? "hidden" : "visible" }}>
      <svg width={width} height={(width * H) / W} viewBox={`0 0 ${W} ${H}`} style={{ filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.35))", overflow: "visible" }}>
        <rect width={W} height={H} rx="8" fill="#FBFAF6" />
        <rect x="24" y="22" width="200" height="12" rx="6" fill={NAVY} />
        <rect x="24" y="42" width="140" height="8" rx="4" fill="#B9C0CF" />
        {Array.from({ length: rows }).map((_, i) => {
          const y = 80 + i * rowH;
          return (
            <g key={i}>
              <rect x="20" y={y} width={W - 40} height={rowH - 8} rx="6" fill="#F4F2EC" />
              <rect x="38" y={y + 18} width="200" height="10" rx="5" fill="#C3C8D3" />
              <rect x="38" y={y + 33} width="120" height="7" rx="3.5" fill="#DADDE4" />
              <rect x={W - 82} y={y + 8} width="40" height="40" rx="4" fill="#fff" stroke={NAVY} strokeWidth="3" />
            </g>
          );
        })}
        {marks.map((m, i) => (
          <Cross key={i} x={W - 62} y={80 + m.row * rowH + 28} s={13} draw={ramp(frame, m.at, 10)} />
        ))}
        {scribble && (
          <g fill="none" stroke={RED} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M44 150 C 70 120, 90 180, 116 150 S 160 120, 186 150 S 230 180, 256 146" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sc1} />
            <path d="M70 340 C 70 300, 130 300, 130 340 C 130 380, 70 380, 70 340 Z M88 334 L92 334 M108 334 L112 334 M86 352 C 96 362, 104 362, 114 352" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sc2} />
          </g>
        )}
      </svg>
      {sideMarks.map((m, i) => {
        const S = width * 0.36;
        const pop = spring({ frame: frame - (m - 6), fps, config: { damping: 12, mass: 0.6 } });
        return (
          <div key={i} style={{ position: "absolute", left: -S * 0.55, top: ((width * H) / W) * 0.3 + i * (S + 14), width: S, height: S, transform: `scale(${pop})`, visibility: pop < 0.01 ? "hidden" : "visible" }}>
            <svg width={S} height={S} viewBox="0 0 100 100" style={{ overflow: "visible", filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.3))" }}>
              <rect x="4" y="4" width="92" height="92" rx="8" fill="#fff" stroke={NAVY} strokeWidth="7" />
              <Cross x={50} y={50} s={26} draw={ramp(frame, m, 10)} />
            </svg>
          </div>
        );
      })}
      {zoom && (
        <div style={{ position: "absolute", left: -L * 0.55, bottom: -L * 0.35, width: L, height: L, transform: `scale(${lens})`, visibility: lens < 0.01 ? "hidden" : "visible" }}>
          <svg width={L} height={L} viewBox="0 0 200 200" style={{ overflow: "visible", filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.35))" }}>
            <line x1="168" y1="168" x2="212" y2="212" stroke={NAVY} strokeWidth="16" strokeLinecap="round" />
            <circle cx="100" cy="100" r="92" fill="#FBFAF6" stroke={NAVY} strokeWidth="10" />
            <rect x="58" y="58" width="84" height="84" rx="8" fill="#fff" stroke={NAVY} strokeWidth="7" />
            <Cross x={100} y={100} s={28} draw={mark} />
          </svg>
        </div>
      )}
      {label && (
        <div style={{ position: "absolute", left: "50%", bottom: -34, transform: `translateX(-50%) scale(${lab})`, visibility: lab < 0.01 ? "hidden" : "visible", background: RED, padding: "8px 20px", whiteSpace: "nowrap" }}>
          <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 28, color: WHITE }}>{label.text}</span>
        </div>
      )}
    </div>
  );
};

// ---------- Summary rows: what you do on the ballot → which vote it is ----------
const Summary: React.FC<{ start: number; rows: { what: string; is: string; at: number; tagAt: number }[] }> = ({ start, rows }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", right: 110, top: 270, opacity: out, transform: `translateX(${(1 - out) * 50}px)`, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <Tag text="RESUMINDO" delay={0} size={38} />
        <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 22, alignItems: "flex-end" }}>
          {rows.map((r, i) => {
            const p = spring({ frame: frame - at(r.at, start), fps, config: { damping: 11, mass: 0.6 } });
            const q = spring({ frame: frame - at(r.tagAt, start), fps, config: { damping: 10, mass: 0.5 } });
            return (
              <div key={i} style={{ display: "flex", alignItems: "stretch", transform: `scale(${p})`, transformOrigin: "right center", opacity: p > 0.01 ? 1 : 0 }}>
                <div style={{ background: BOX, padding: "18px 28px", display: "flex", alignItems: "center" }}>
                  <span style={{ ...big(30), textShadow: "none" }}>{r.what}</span>
                </div>
                <div style={{ background: RED, width: 220, display: "flex", alignItems: "center", justifyContent: "center", clipPath: `inset(0 ${100 - q * 100}% 0 0)` }}>
                  <span style={{ ...big(30), textShadow: "none" }}>{r.is}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- What counts: list with tick / cross per line ----------
const Counts: React.FC<{ start: number; header: string; items: { text: string; at: number; no?: boolean }[] }> = ({ start, header, items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  const size = 32;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", right: 110, top: 300, opacity: out, transform: `translateX(${(1 - out) * 50}px)`, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <Tag text={header} delay={0} size={42} />
        <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 22, alignItems: "flex-end" }}>
          {items.map((it, i) => {
            const d = at(it.at, start);
            const p = spring({ frame: frame - d, fps, config: { damping: 11, mass: 0.6 } });
            const draw = ramp(frame, d + 5, 9);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, background: BOX, padding: "18px 34px 18px 22px", transform: `scale(${p})`, transformOrigin: "right center", opacity: p > 0.01 ? 1 : 0 }}>
                {it.no ? <CrossIcon size={size * 1.22} draw={draw} /> : <CheckIcon size={size * 1.22} draw={draw} />}
                <span style={{ ...big(size), textShadow: "none" }}>{it.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Two tags side by side: "VOTO EM BRANCO" · "VOTO NULO"
const TwoTags: React.FC<{ start: number; a: number; b: number }> = ({ start, a, b }) => {
  const out = useOut();
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", right: 130, top: 380, opacity: out, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 34 }}>
        <Rise delay={4}>
          <span style={{ ...big(64), color: NAVY, textShadow: "none" }}>OUTROS VOTAM</span>
        </Rise>
        <Tag text="EM BRANCO" delay={at(a, start)} size={52} />
        <div style={{ height: 6 }} />
        <Tag text="NULO" delay={at(b, start)} size={52} />
      </div>
    </AbsoluteFill>
  );
};

export const Overlay5: React.FC = () => (
  <AbsoluteFill>
    <Seg from={1.0} to={4.6} name="01 Na hora de votar">
      <Keyword
        start={1.0}
        pos={{ right: 130, top: 400 }}
        align="right"
        ink={NAVY}
        lines={[
          { text: "NA HORA DE VOTAR,", at: 1.0, size: 48 },
          { text: "NEM TODOS FAZEM", at: 2.38, size: 58 },
          { text: "A MESMA ESCOLHA", at: 3.5, size: 58, red: true },
        ]}
      />
    </Seg>

    <Seg from={4.8} to={9.95} name="02 Escolher um candidato">
      <Keyword
        start={4.8}
        pos={{ right: 130, top: 400 }}
        align="right"
        ink={NAVY}
        lines={[
          { text: "HÁ QUEM ESCOLHA", at: 4.85, size: 56 },
          { text: "UM CANDIDATO", at: 6.2, size: 72, box: BOX },
          { text: "EM QUEM ACREDITA", at: 8.36, size: 50, red: true },
        ]}
      />
    </Seg>

    <Seg from={10.2} to={14.85} name="03 Esperanca">
      <Keyword
        start={10.2}
        pos={{ right: 130, top: 400 }}
        align="right"
        ink={NAVY}
        lines={[
          { text: "HÁ QUEM VOTE", at: 10.3, size: 62 },
          { text: "COM ESPERANÇA", at: 11.62, size: 66, box: BOX },
          { text: "NUM PAÍS MELHOR", at: 13.48, size: 54, red: true },
        ]}
      />
    </Seg>

    <Seg from={15.0} to={18.95} name="04 Branco ou nulo">
      <TwoTags start={15.0} a={16.4} b={18.2} />
    </Seg>

    <Seg from={21.4} to={23.4} name="05 Episodio 5">
      <Keyword
        start={21.4}
        pos={{ right: 130, top: 420 }}
        align="right"
        ink={NAVY}
        lines={[
          { text: "5.º EPISÓDIO", at: 21.56, size: 72 },
          { text: "CNE EXPLICA", at: 22.28, size: 56, red: true },
        ]}
      />
    </Seg>

    <Seg from={24.4} to={28.7} name="06 Diferencas e consequencias">
      <Keyword
        start={24.4}
        pos={{ right: 130, top: 400 }}
        align="right"
        ink={NAVY}
        underlineAt={28.4}
        lines={[
          { text: "DIFERENÇAS", at: 25.36, size: 82 },
          { text: "E CONSEQUÊNCIAS", at: 26.54, size: 56, box: BOX },
          { text: "DOS TIPOS DE VOTO", at: 28.04, size: 50, red: true },
        ]}
      />
    </Seg>

    <Seg from={30.8} to={34.9} name="07 Nem todos os boletins">
      <Keyword
        start={30.8}
        pos={{ right: 130, top: 400 }}
        align="right"
        ink={NAVY}
        lines={[
          { text: "NEM TODOS OS BOLETINS", at: 30.85, size: 42 },
          { text: "CONTAM", at: 33.2, size: 88, box: BOX },
          { text: "DA MESMA MANEIRA", at: 33.9, size: 54, red: true },
        ]}
      />
    </Seg>

    <Seg from={35.2} to={55.0} name="08 Tipo 1 Voto valido">
      <TypeCard n={1} title="VOTO VÁLIDO" titleAt={35.94} start={35.2} top={150}>
        <Note delay={at(41.74, 35.2)}>Escolha clara</Note>
        <Note delay={at(42.88, 35.2)}>e sem dúvida</Note>
        <div style={{ marginTop: 34, marginRight: 40 }}>
          <Ballot width={230} enterAt={at(47.86, 35.2)} zoom={{ at: at(48.84, 35.2), markAt: at(49.32, 35.2) }} label={{ text: "VÁLIDO", at: at(54.32, 35.2) }} />
        </div>
      </TypeCard>
    </Seg>

    <Seg from={55.1} to={66.6} name="09 Tipo 2 Voto em branco">
      <TypeCard n={2} title="VOTO EM BRANCO" titleAt={56.5} start={55.1} top={150}>
        <Note delay={at(61.3, 55.1)} red>
          Não marca nada
        </Note>
        <Note delay={at(65.12, 55.1)}>Nenhuma candidatura escolhida</Note>
        <div style={{ marginTop: 34, marginRight: 40 }}>
          <Ballot width={230} enterAt={at(60.04, 55.1)} label={{ text: "EM BRANCO", at: at(62.04, 55.1) }} />
        </div>
      </TypeCard>
    </Seg>

    <Seg from={66.8} to={82.7} name="10 Tipo 3 Voto nulo">
      <TypeCard n={3} title="VOTO NULO" titleAt={68.6} start={66.8} top={150}>
        <Note delay={at(72.7, 66.8)}>Mais do que um candidato</Note>
        <Note delay={at(78.0, 66.8)}>Escrever, desenhar ou fazer sinais</Note>
        <div style={{ marginTop: 34, marginRight: 40 }}>
          <Ballot
            width={230}
            enterAt={at(71.12, 66.8)}
            sideMarks={[at(74.78, 66.8), at(75.12, 66.8)]}
            label={{ text: "NULO", at: at(81.0, 66.8) }}
          />
        </div>
      </TypeCard>
    </Seg>

    <Seg from={82.9} to={89.1} name="11 Preste atencao">
      <Keyword
        start={82.9}
        pos={{ right: 130, top: 400 }}
        align="right"
        ink={NAVY}
        lines={[
          { text: "NA HORA DE VOTAR,", at: 83.58, size: 40 },
          { text: "PRESTE ATENÇÃO", at: 85.48, size: 62, box: BOX },
          { text: "À FORMA COMO PREENCHE", at: 87.12, size: 42, red: true },
          { text: "O BOLETIM", at: 88.28, size: 42, red: true },
        ]}
      />
    </Seg>

    <Seg from={89.3} to={100.4} name="12 Resumo">
      <Summary
        start={89.3}
        rows={[
          { what: "VONTADE CLARA", at: 90.7, is: "VÁLIDO", tagAt: 92.18 },
          { what: "NADA MARCADO", at: 93.32, is: "EM BRANCO", tagAt: 94.62 },
          { what: "MARCAS INVÁLIDAS", at: 96.08, is: "NULO", tagAt: 99.72 },
        ]}
      />
    </Seg>

    <Seg from={100.5} to={107.6} name="13 Voto valido conta">
      <Counts
        start={100.5}
        header="VOTO VÁLIDO"
        items={[
          { text: "CONTA PARA O CANDIDATO", at: 102.96 },
          { text: "ENTRA NA MAIORIA ABSOLUTA", at: 106.32 },
        ]}
      />
    </Seg>

    <Seg from={107.7} to={117.8} name="14 Brancos e nulos">
      <Counts
        start={107.7}
        header="BRANCOS E NULOS"
        items={[
          { text: "CONTABILIZADOS À PARTE", at: 111.9 },
          { text: "NÃO ENTRAM NA MAIORIA ABSOLUTA", at: 115.0, no: true },
        ]}
      />
    </Seg>

    <Seg from={117.9} to={121.1} name="15 Tres tipos de voto">
      <Keyword
        start={117.9}
        pos={{ right: 130, top: 420 }}
        align="right"
        ink={NAVY}
        lines={[
          { text: "3 TIPOS DE VOTO", at: 117.96, size: 58 },
          { text: "DIFERENÇAS IMPORTANTES", at: 119.04, size: 40, red: true },
        ]}
      />
    </Seg>

    <Seg from={121.3} to={128.45} name="16 Participe informado">
      <Keyword
        start={121.3}
        pos={{ right: 130, top: 400 }}
        align="right"
        ink={NAVY}
        underlineAt={127.9}
        lines={[
          { text: "PARTICIPE", at: 124.2, size: 74 },
          { text: "DE FORMA INFORMADA", at: 126.24, size: 48, box: BOX },
          { text: "E CONSCIENTE", at: 127.34, size: 48, red: true },
        ]}
      />
    </Seg>
  </AbsoluteFill>
);
