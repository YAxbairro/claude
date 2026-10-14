import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { at, ramp, useOut } from "../anim";
import { Keyword, NextEpisode, Requirements, Rise, Tag } from "../components";
import { SearchBar } from "../spot/devices";
import { NAVY, RED, SANS, SHADOW, WHITE, t } from "../theme";

// "CNE Explica – Ep. 4: sabe onde e como votar, passo a passo". Timestamps from the word-level transcript.
const FPS = 24000 / 1001;
export const EP3_DURATION = Math.ceil(121.955 * FPS);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Seg: React.FC<{ from: number; to: number; name: string; children: React.ReactNode }> = ({ from, to, name, children }) => (
  <Sequence from={t(from)} durationInFrames={t(to) - t(from)} name={name} layout="none">
    {children}
  </Sequence>
);

// ---------- Step card: "PASSO n" + instruction, always on the right ----------
const StepCard: React.FC<{ start: number; n: number; title: string; titleAt: number; children?: React.ReactNode; top?: number; whitePasso?: boolean }> = ({
  start,
  n,
  title,
  titleAt,
  children,
  top = 300,
  whitePasso = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  const pop = spring({ frame, fps, config: { damping: 11, mass: 0.6 } });
  const box = ramp(frame, at(titleAt, start), 12);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", right: 110, top, width: 560, opacity: out, transform: `translateX(${(1 - out) * 50}px)`, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Rise delay={2}>
            <span style={whitePasso ? { fontFamily: SANS, fontWeight: 600, fontSize: 38, color: WHITE, letterSpacing: "0.22em" } : { fontFamily: SANS, fontWeight: 600, fontSize: 38, color: NAVY, letterSpacing: "0.22em" }}>PASSO</span>
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
        <div
          style={{
            marginTop: 20,
            background: "rgba(31,43,69,0.92)",
            padding: "18px 26px",
            maxWidth: 560,
            clipPath: `inset(0 0 0 ${100 - box * 100}%)`,
            visibility: box <= 0 ? "hidden" : "visible",
          }}
        >
          <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 52, lineHeight: 1.08, color: WHITE, textTransform: "uppercase", display: "block", textAlign: "right" }}>{title}</span>
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
        marginTop: 18,
        maxWidth: 560,
        textAlign: "right",
        opacity: p,
        visibility: p <= 0 ? "hidden" : "visible",
        transform: `translateY(${(1 - p) * 14}px)`,
        ...(red ? { background: RED, padding: "8px 18px" } : {}),
      }}
    >
      <span style={{ fontFamily: SANS, fontWeight: red ? 900 : 800, fontSize: red ? 40 : 30, lineHeight: 1.25, color: red ? WHITE : NAVY, textTransform: "uppercase" }}>{children}</span>
    </div>
  );
};

// ---------- Generic ballot paper: identical anonymous rows, so no candidate is ever singled out ----------
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
  // crosses drawn inside the squares of these (anonymous) rows
  marks?: { row: number; at: number }[];
  // voto nulo: one big cross over the whole sheet (two strokes, each with its own cue)
  spoil?: [number, number];
  // "marque uma cruz": a magnifier shows a single square being crossed, detached from any row
  zoom?: { at: number; markAt: number };
}> = ({ width, enterAt = 0, label, marks = [], spoil, zoom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - enterAt, fps, config: { damping: 14, mass: 0.7 } });
  const rows = 6;
  const W = 380;
  const H = 500;
  const rowH = 62;
  const lab = label ? spring({ frame: frame - label.at, fps, config: { damping: 11, mass: 0.6 } }) : 0;
  const s1 = spoil ? ramp(frame, spoil[0], 9) : 0;
  const s2 = spoil ? ramp(frame, spoil[1], 9) : 0;
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
        {spoil && (
          <g>
            <path d={`M40 70 L${W - 40} ${H - 30}`} stroke={RED} strokeWidth="16" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - s1} />
            <path d={`M${W - 40} 70 L40 ${H - 30}`} stroke={RED} strokeWidth="16" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - s2} />
          </g>
        )}
      </svg>
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
          <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 26, color: WHITE }}>{label.text}</span>
        </div>
      )}
    </div>
  );
};

// ---------- Ballot is folded, then dropped into the box ----------
const FoldAndDrop: React.FC<{ foldAt: number; dropAt: number }> = ({ foldAt, dropAt }) => {
  const frame = useCurrentFrame();
  const fold = ease3(frame, foldAt, foldAt + 12);
  const drop = ease3(frame, dropAt, dropAt + 12);
  const urn = ramp(frame, dropAt - 14, 12);
  return (
    <svg width="300" height="300" viewBox="0 0 420 420" style={{ marginTop: 20, overflow: "visible" }}>
      <defs>
        <clipPath id="aboveSlot3">
          <rect x="-100" y="-400" width="620" height="660" />
        </clipPath>
      </defs>
      <g opacity={urn} transform={`translate(0 ${(1 - urn) * 30})`}>
        <path d="M30 262 L100 222 L320 222 L390 262" fill="none" stroke={NAVY} strokeWidth="11" strokeLinejoin="round" />
        <rect x="140" y="246" width="140" height="11" rx="3" fill={NAVY} />
        <rect x="20" y="282" width="380" height="18" fill={NAVY} />
        <rect x="20" y="316" width="380" height="9" fill={RED} />
      </g>
      <g clipPath="url(#aboveSlot3)">
        <g transform={`translate(0 ${drop * 260})`}>
          {/* ballot: full sheet, then its lower half folds up behind */}
          <g transform="translate(150 20)">
            <rect width="120" height={150 - 75 * fold} rx="5" fill="#FBFAF6" stroke="#C9CED9" strokeWidth="2" />
            <rect x="16" y="18" width="70" height="7" rx="3.5" fill={NAVY} opacity={1 - fold} />
            <Cross x={92} y={92} s={11} draw={1 - fold} />
            <rect y={75} width="120" height={75 * (1 - fold)} fill="#000" opacity={0.08 * fold} />
          </g>
        </g>
      </g>
    </svg>
  );
};
const ease3 = (frame: number, a: number, b: number) => interpolate(frame, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

// ---------- Two search bars for the websites ----------
const Sites: React.FC<{ start: number }> = ({ start }) => {
  const out = useOut();
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", right: 110, top: 330, opacity: out, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 26 }}>
        <Tag text="OU CONSULTE ONLINE" delay={0} size={34} />
        <div style={{ height: 10 }} />
        <SearchBar delay={at(29.0, start)} text="WWW.CNE.CV" scale={0.66} />
        <SearchBar delay={at(31.9, start)} text="WWW.DGAPE.CV" scale={0.66} />
      </div>
    </AbsoluteFill>
  );
};

const Simple: React.FC<{ start: number }> = ({ start }) => (
  <Keyword
    start={start}
    pos={{ right: 130, top: 420 }}
    align="right"
    ink={NAVY}
    lines={[
      { text: "É SIMPLES", at: 100.92, size: 90 },
      { text: "E FÁCIL VOTAR", at: 101.7, size: 64, red: true },
    ]}
  />
);

export const Overlay3: React.FC = () => (
  <AbsoluteFill>
    <Seg from={6.15} to={8.5} name="01 Sabe onde e como votar">
      <Keyword
        start={6.15}
        pos={{ right: 130, top: 400 }}
        align="right"
        ink={NAVY}
        lines={[
          { text: "SABE", at: 6.2, size: 70 },
          { text: "ONDE E COMO", at: 6.8, size: 76, box: "rgba(31,43,69,0.92)" },
          { text: "VOTAR?", at: 7.75, size: 96, red: true },
        ]}
      />
    </Seg>

    <Seg from={8.55} to={11.9} name="02 Sabe o que fazer na mesa">
      <Keyword
        start={8.55}
        pos={{ right: 130, top: 400 }}
        align="right"
        ink={NAVY}
        lines={[
          { text: "NA MESA DE VOTO,", at: 9.34, size: 52 },
          { text: "SABE O QUE", at: 10.2, size: 84 },
          { text: "FAZER?", at: 11.0, size: 84, red: true },
        ]}
      />
    </Seg>

    <Seg from={14.3} to={17.4} name="03 Episodio 4">
      <Keyword
        start={14.3}
        pos={{ right: 130, top: 420 }}
        align="right"
        ink={NAVY}
        lines={[
          { text: "4.º EPISÓDIO", at: 14.64, size: 96 },
          { text: "CNE EXPLICA", at: 15.3, size: 64, red: true },
        ]}
      />
    </Seg>

    <Seg from={17.5} to={20.7} name="04 Passo a passo">
      <Keyword
        start={17.5}
        pos={{ right: 130, top: 400 }}
        align="right"
        ink={NAVY}
        underlineAt={19.9}
        lines={[
          { text: "PASSO A PASSO", at: 17.78, size: 90 },
          { text: "COMO VOTAR", at: 19.0, size: 70, red: true },
          { text: "DE FORMA CORRETA", at: 19.64, size: 44 },
        ]}
      />
    </Seg>

    <Seg from={20.9} to={24.2} name="05 Sabe o local de voto">
      <Requirements start={20.9} header="SABE O LOCAL DE VOTO?" headerSize={34} size={40} top={360} items={[{ text: "PROCURE A SUA MESA", at: 22.72 }]} />
    </Seg>

    <Seg from={24.3} to={28.1} name="06 Nao sabe - CRE">
      <Requirements start={24.3} header="NÃO SABE ONDE VOTA?" headerSize={34} size={40} top={360} items={[{ text: "CRE DO CONCELHO", sub: "COMISSÃO DE RECENSEAMENTO ELEITORAL", at: 26.82 }]} />
    </Seg>

    <Seg from={28.1} to={34.5} name="07 Sites">
      <Sites start={28.1} />
    </Seg>

    <Seg from={34.7} to={43.7} name="08 Diaspora">
      <Requirements
        start={34.7}
        header="VIVE NA DIÁSPORA?"
        headerSize={36}
        size={34}
        top={330}
        items={[
          { text: "CONSULTE OS SITES", at: 36.4 },
          { text: "REPRESENTAÇÃO DIPLOMÁTICA", at: 40.66 },
        ]}
      />
    </Seg>

    <Seg from={43.76} to={47.75} name="09 Dirija-se a mesa">
      <Keyword
        start={43.76}
        pos={{ right: 130, top: 420 }}
        align="right"
        ink={NAVY}
        lines={[
          { text: "NO LOCAL DE VOTO,", at: 43.9, size: 44 },
          { text: "DIRIJA-SE À", at: 46.24, size: 60 },
          { text: "MESA DE VOTO", at: 47.0, size: 60, red: true },
        ]}
      />
    </Seg>

    <Seg from={47.8} to={56.85} name="10 Passo 1 Identifique-se">
      <StepCard start={47.8} n={1} title="Identifique-se" titleAt={48.0}>
        <Note delay={at(50.8, 47.8)}>A mesa confirma a sua identidade</Note>
        <Note delay={at(53.46, 47.8)}>e se está inscrito nesta assembleia de voto</Note>
      </StepCard>
    </Seg>

    <Seg from={56.9} to={59.5} name="11 Passo 2 Boletim">
      <StepCard start={56.9} n={2} title="Receba o boletim de voto" titleAt={57.84} />
    </Seg>

    <Seg from={59.55} to={67.6} name="12 Passo 3 Cabine">
      <StepCard start={59.55} n={3} title="Vá à cabine de voto" titleAt={61.06}>
        <Note delay={at(65.4, 59.55)} red>
          O voto é secreto
        </Note>
      </StepCard>
    </Seg>

    <Seg from={67.9} to={79.2} name="13 Passo 4 Escolha">
      <StepCard start={67.9} n={4} title="Marque uma cruz no seu candidato" titleAt={73.72} top={270} whitePasso>
        <div style={{ marginTop: 26 }}>
          <Ballot width={250} enterAt={at(69.9, 67.9)} zoom={{ at: at(74.7, 67.9), markAt: at(75.54, 67.9) }} />
        </div>
      </StepCard>
    </Seg>

    <Seg from={79.3} to={90.4} name="14 Nulo e branco">
      <AttentionBallots start={79.3} />
    </Seg>

    <Seg from={90.6} to={100.45} name="15 Passo 5 Dobre e urna">
      <StepCard start={90.6} n={5} title="Dobre o boletim e coloque-o na urna" titleAt={96.0} top={170}>
        <Note delay={at(92.48, 90.6)}>Ainda na cabine, para garantir o segredo do voto</Note>
        <FoldAndDrop foldAt={at(96.02, 90.6)} dropAt={at(99.0, 90.6)} />
      </StepCard>
    </Seg>

    <Seg from={100.5} to={102.9} name="16 Simples e facil">
      <Simple start={100.5} />
    </Seg>

    <Seg from={103.1} to={113.6} name="17 Resumo">
      <Requirements
        start={103.1}
        header="NO DIA DA ELEIÇÃO"
        headerSize={36}
        size={34}
        top={250}
        items={[
          { text: "IDENTIFIQUE-SE", at: 104.7 },
          { text: "RECEBA O BOLETIM", at: 105.62 },
          { text: "VOTE EM SEGREDO", at: 107.46 },
          { text: "DOBRE O BOLETIM", at: 108.7 },
          { text: "COLOQUE NA URNA", at: 109.96 },
        ]}
      />
    </Seg>

    <Seg from={114.0} to={121.9} name="18 Proximo episodio">
      <NextEpisode eyebrow="CNE Explica · Ep. 5" title="Voto válido, em branco e nulo: qual a diferença?" />
    </Seg>
  </AbsoluteFill>
);

// ---------- Null vs blank ----------
function AttentionBallots({ start }: { start: number }) {
  const out = useOut();
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", right: 110, top: 250, opacity: out, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <Tag text="ATENÇÃO" delay={at(79.58, start)} size={40} />
        <div style={{ display: "flex", gap: 70, marginTop: 50 }}>
          <Ballot width={210} enterAt={at(80.4, start)} marks={[
              { row: 1, at: at(81.06, start) },
              { row: 4, at: at(82.0, start) },
            ]} label={{ text: "VOTO NULO", at: at(85.26, start) }} />
          <Ballot width={210} enterAt={at(86.06, start)} label={{ text: "VOTO EM BRANCO", at: at(89.18, start) }} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

