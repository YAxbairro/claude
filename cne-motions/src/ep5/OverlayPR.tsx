import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { at, ramp, useOut } from "../anim";
import { CheckIcon, CrossIcon, Keyword, Tag, big } from "../components";
import { NAVY, RED, SANS, WHITE, t } from "../theme";
import { Decreto } from "./Decreto";

// "CNE Explica – como é eleito o Presidente da República". Timestamps from the word-level transcript.
// The camera alternates between a centred framing (text on the right) and a framing with the
// presenter to the right (text on the left); each segment picks the free side.
const FPS = 24000 / 1001;
export const EPPR_DURATION = Math.ceil(151.45 * FPS);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const BOX = "rgba(31,43,69,0.92)";
const R = { right: 110, top: 380 };
const Lft = { left: 110, top: 380 };

type Line = { text: string; at: number; size: number; red?: boolean; box?: string };
const b = (text: string, atS: number, size: number): Line => ({ text, at: atS, size, box: BOX });

const Seg: React.FC<{ from: number; to: number; name: string; children: React.ReactNode }> = ({ from, to, name, children }) => (
  <Sequence from={t(from)} durationInFrames={t(to) - t(from)} name={name} layout="none">
    {children}
  </Sequence>
);

const KW: React.FC<{ start: number; side: "left" | "right"; lines: Line[]; top?: number; underlineAt?: number }> = ({ start, side, lines, top, underlineAt }) => (
  <Keyword
    start={start}
    pos={side === "right" ? { ...R, ...(top ? { top } : {}) } : { ...Lft, ...(top ? { top } : {}) }}
    align={side}
    ink={NAVY}
    underlineAt={underlineAt}
    // this set is darker than Ep. 5 (window frames, black chairs): every line sits in a box
    lines={lines.map((l) => (l.red || l.box ? l : { ...l, box: BOX }))}
  />
);

// ---------- Majority meter: the bar fills past the half-way mark ----------
const Meter: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  const W = 640;
  const show = ramp(frame, at(39.0, start), 12);
  const toHalf = interpolate(frame, [at(39.3, start), at(42.6, start)], [0, 0.5], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const over = interpolate(frame, [at(42.76, start), at(43.4, start)], [0, 0.08], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const fill = toHalf + over;
  const lab = spring({ frame: frame - at(42.76, start), fps, config: { damping: 11, mass: 0.6 } });
  const valid = ramp(frame, at(44.18, start), 10);
  const note = spring({ frame: frame - at(45.92, start), fps, config: { damping: 12, mass: 0.6 } });
  const draw = ramp(frame, at(47.6, start), 10);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 80, top: 260, width: W + 60, padding: "30px 30px 40px", background: "rgba(255,255,255,0.9)", borderRadius: 20, boxShadow: "0 20px 50px rgba(0,0,0,0.25)", opacity: out, transform: `translateX(${(1 - out) * -50}px)` }}>
        <Tag text="O QUE SIGNIFICA?" delay={at(37.18, start)} size={40} />
        <div style={{ marginTop: 70, opacity: show, transform: `translateY(${(1 - show) * 20}px)` }}>
          <div style={{ position: "relative", height: 70, background: "rgba(31,43,69,0.25)", borderRadius: 10, overflow: "hidden", border: `4px solid ${NAVY}` }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${fill * 100}%`, background: fill > 0.5 ? RED : NAVY }} />
          </div>
          {/* half-way mark */}
          <div style={{ position: "relative", height: 0 }}>
            <div style={{ position: "absolute", left: W / 2 - 3, top: -96, width: 6, height: 122, background: NAVY }} />
            <div style={{ position: "absolute", left: W / 2 - 60, top: 34, width: 120, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 30, color: NAVY }}>50%</div>
          </div>
          <div style={{ marginTop: 84, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
            <div style={{ transform: `scale(${lab})`, transformOrigin: "left center", visibility: lab < 0.01 ? "hidden" : "visible", background: RED, padding: "6px 20px" }}>
              <span style={{ ...big(64), textShadow: "none" }}>MAIS DE METADE</span>
            </div>
            <div style={{ opacity: valid, background: BOX, padding: "6px 20px" }}>
              <span style={{ ...big(40), textShadow: "none" }}>DOS VOTOS VÁLIDOS</span>
            </div>
          </div>
          <div style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 16, transform: `scale(${note})`, transformOrigin: "left center", visibility: note < 0.01 ? "hidden" : "visible" }}>
            <CrossIcon size={44} draw={draw} />
            <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 30, color: NAVY, whiteSpace: "nowrap" }}>OS VOTOS EM BRANCO NÃO CONTAM</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Worked example: 1000 valid votes, A 450 · B 350 · C 200 ----------
const Example: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  const SCALE = 0.4; // px per vote
  const half = ramp(frame, at(77.6, start), 14);
  const halfLab = spring({ frame: frame - at(82.48, start), fps, config: { damping: 11, mass: 0.6 } });
  const rows = [
    { k: "A", v: 450, at: 59.34, valAt: 60.08 },
    { k: "B", v: 350, at: 62.14, valAt: 62.88 },
    { k: "C", v: 200, at: 64.56, valAt: 65.88 },
  ];
  const highlightA = ramp(frame, at(69.2, start), 10);
  const q = ramp(frame, at(67.04, start), 10) * (1 - ramp(frame, at(70.6, start), 8));
  const stamp = spring({ frame: frame - at(72.22, start), fps, config: { damping: 9, mass: 0.6 } });
  const stampOut = 1 - ramp(frame, at(76.9, start), 8);
  const need = spring({ frame: frame - at(81.1, start), fps, config: { damping: 11, mass: 0.6 } });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", right: 60, top: 190, width: 360, padding: "24px 24px 28px", background: "rgba(255,255,255,0.9)", borderRadius: 20, boxShadow: "0 20px 50px rgba(0,0,0,0.25)", opacity: out, transform: `translateX(${(1 - out) * 50}px)`, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <Tag text="EXEMPLO" delay={at(49.24, start)} size={38} />
        <div style={{ marginTop: 34, textAlign: "right", opacity: ramp(frame, at(51.58, start), 10) }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 32, color: NAVY }}>3 CANDIDATOS</div>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 26, color: RED, whiteSpace: "nowrap", opacity: ramp(frame, at(56.72, start), 10) }}>1000 VOTOS VÁLIDOS</div>
        </div>
        <div style={{ position: "relative", marginTop: 30, width: 360 }}>
          {rows.map((r, i) => {
            const p = spring({ frame: frame - at(r.at, start), fps, config: { damping: 13, mass: 0.6 } });
            const grow = interpolate(frame, [at(r.valAt, start), at(r.valAt, start) + 16], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
            const dim = i > 0 ? 1 - 0.55 * highlightA : 1;
            return (
              <div key={r.k} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18, opacity: interpolate(p, [0, 0.2], [0, 1], clamp) * dim, transform: `translateX(${(1 - p) * 60}px)` }}>
                <div style={{ width: 64, height: 64, borderRadius: 32, background: i === 0 ? RED : NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transform: i === 0 ? `scale(${1 + 0.15 * highlightA})` : undefined }}>
                  <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 36, color: WHITE }}>{r.k}</span>
                </div>
                <div style={{ height: 52, width: r.v * SCALE * grow, background: i === 0 ? RED : NAVY, borderRadius: 6 }} />
                <span style={{ marginLeft: "auto", fontFamily: SANS, fontWeight: 900, fontSize: 34, color: NAVY, opacity: grow }}>{Math.round(r.v * grow)}</span>
              </div>
            );
          })}
          {/* half of 1000 */}
          <div style={{ position: "absolute", left: 80 + 500 * SCALE - 2, top: -16, height: 262, borderLeft: `5px dashed ${RED}`, opacity: half, transform: `scaleY(${half})`, transformOrigin: "top" }} />
          <div style={{ position: "absolute", left: 80 + 500 * SCALE - 70, top: 254, width: 140, textAlign: "center", transform: `scale(${halfLab})`, visibility: halfLab < 0.01 ? "hidden" : "visible" }}>
            <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 30, color: RED }}>500</span>
          </div>
        </div>
        <div style={{ position: "relative", marginTop: 60, height: 120, width: 360 }}>
          <div style={{ position: "absolute", right: 0, top: 0, opacity: q }}>
            <span style={{ ...big(48), color: NAVY, textShadow: "none" }}>QUEM GANHA?</span>
          </div>
          <div style={{ position: "absolute", right: 0, top: 0, transform: `scale(${stamp}) rotate(-3deg)`, transformOrigin: "right center", visibility: stamp < 0.01 || stampOut <= 0 ? "hidden" : "visible", opacity: stampOut, background: RED, padding: "8px 18px", textAlign: "right" }}>
            <div style={{ ...big(32), textShadow: "none" }}>A NÃO É ELEITO</div>
            <div style={{ ...big(32), textShadow: "none" }}>NA 1.ª VOLTA</div>
          </div>
          <div style={{ position: "absolute", right: 0, top: 0, transform: `scale(${need})`, transformOrigin: "right center", visibility: need < 0.01 ? "hidden" : "visible", background: BOX, padding: "8px 18px", textAlign: "right" }}>
            <div style={{ ...big(30), textShadow: "none" }}>PRECISAVA DE</div>
            <div style={{ ...big(40), textShadow: "none" }}>MAIS DE 500</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Nobody reaches it: second round between the two most voted ----------
const SecondRound: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  const pill = spring({ frame: frame - at(90.74, start), fps, config: { damping: 10, mass: 0.6 } });
  const two = ramp(frame, at(92.96, start), 12);
  const chip = (k: string, d: number, dim = false) => {
    const p = spring({ frame: frame - at(d, start), fps, config: { damping: 11, mass: 0.6 } });
    return (
      <div style={{ width: 96, height: 96, borderRadius: 48, background: dim ? "rgba(31,43,69,0.35)" : RED, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${p})`, visibility: p < 0.01 ? "hidden" : "visible", boxShadow: "0 8px 22px rgba(0,0,0,0.25)" }}>
        <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 54, color: WHITE }}>{k}</span>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <KW
        start={start}
        side="left"
        top={230}
        lines={[
          { text: "E SE NINGUÉM TIVER", at: 85.52, size: 50 },
          b("MAIORIA ABSOLUTA?", 87.44, 56),
        ]}
      />
      <div style={{ position: "absolute", left: 110, top: 470, opacity: out, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 28 }}>
        <div style={{ transform: `scale(${pill})`, transformOrigin: "left center", visibility: pill < 0.01 ? "hidden" : "visible", background: RED, padding: "10px 34px", borderRadius: 60 }}>
          <span style={{ ...big(84), textShadow: "none" }}>2.ª VOLTA</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {chip("A", 93.1)}
          <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 40, color: NAVY, opacity: two }}>VS</span>
          {chip("B", 93.4)}
        </div>
        <div style={{ opacity: two, background: BOX, padding: "8px 20px" }}>
          <span style={{ ...big(36), textShadow: "none" }}>OS 2 MAIS VOTADOS</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Recap list with tick / cross ----------
const Counts: React.FC<{ start: number; header: string; items: { text: string; at: number; no?: boolean }[] }> = ({ start, header, items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  const size = 34;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", right: 110, top: 320, opacity: out, transform: `translateX(${(1 - out) * 50}px)`, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <Tag text={header} delay={0} size={38} />
        <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 22, alignItems: "flex-end" }}>
          {items.map((it, i) => {
            const d = at(it.at, start);
            const p = spring({ frame: frame - d, fps, config: { damping: 11, mass: 0.6 } });
            const draw = ramp(frame, d + 5, 9);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, background: BOX, padding: "16px 30px 16px 20px", transform: `scale(${p})`, transformOrigin: "right center", opacity: p > 0.01 ? 1 : 0 }}>
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

export const OverlayPR: React.FC = () => (
  <AbsoluteFill>
    <Seg from={2.5} to={7.85} name="01 No ultimo episodio">
      <KW start={2.5} side="right" lines={[{ text: "NO ÚLTIMO EPISÓDIO", at: 2.64, size: 38 }, b("QUEM É", 4.34, 64), b("O PRESIDENTE", 4.7, 56), { text: "E AS SUAS FUNÇÕES", at: 6.16, size: 40, red: true }]} />
    </Seg>

    <Seg from={8.3} to={13.2} name="02 Como e eleito">
      <KW start={8.3} side="right" lines={[{ text: "FALTA FALAR DO", at: 8.44, size: 46 }, { text: "MAIS IMPORTANTE:", at: 9.8, size: 42 }, b("COMO É", 11.56, 72), { text: "ELEITO?", at: 12.3, size: 88, red: true }]} />
    </Seg>

    <Seg from={15.0} to={17.35} name="03 CNE Explica">
      <KW start={15.0} side="right" top={420} lines={[{ text: "MAIS UM EPISÓDIO", at: 15.16, size: 42 }, { text: "CNE EXPLICA", at: 16.26, size: 64, red: true }]} />
    </Seg>

    <Seg from={17.5} to={22.95} name="04 Tema">
      <KW start={17.5} side="right" lines={[b("COMO É ELEITO", 19.76, 52), { text: "O PRESIDENTE", at: 20.8, size: 56 }, { text: "DA REPÚBLICA", at: 21.42, size: 56 }, { text: "DE CABO VERDE", at: 22.24, size: 52, red: true }]} />
    </Seg>

    <Seg from={23.1} to={28.6} name="05 Eleito pelos cidadaos">
      <KW start={23.1} side="left" lines={[{ text: "O PRESIDENTE É ELEITO", at: 25.0, size: 46 }, b("PELOS CIDADÃOS", 26.52, 64), { text: "ATRAVÉS DO VOTO", at: 27.4, size: 60, red: true }]} />
    </Seg>

    <Seg from={28.75} to={33.9} name="06 Nao basta ter mais votos">
      <KW start={28.75} side="right" lines={[{ text: "PARA SER ELEITO,", at: 29.6, size: 42 }, b("NÃO BASTA TER", 31.46, 50), b("MAIS VOTOS", 32.3, 64)]} />
    </Seg>

    <Seg from={34.0} to={36.6} name="07 Maioria absoluta">
      <KW start={34.0} side="left" lines={[{ text: "É PRECISO", at: 34.2, size: 60 }, { text: "MAIORIA", at: 35.22, size: 96, red: true }, { text: "ABSOLUTA", at: 35.64, size: 96, red: true }]} />
    </Seg>

    <Seg from={36.7} to={49.0} name="08 Mais de metade">
      <Meter start={36.7} />
    </Seg>

    <Seg from={49.2} to={84.95} name="09 Exemplo">
      <Example start={49.2} />
    </Seg>

    <Seg from={85.1} to={95.45} name="10 Segunda volta">
      <SecondRound start={85.1} />
    </Seg>

    <Seg from={95.6} to={107.45} name="11 Resumo">
      <Counts
        start={95.6}
        header="PARA SER ELEITO"
        items={[
          { text: "SÓ MAIS VOTOS", at: 98.26, no: true },
          { text: "MAIS DE METADE", at: 101.78 },
          { text: "VOTOS EM BRANCO", at: 105.1, no: true },
        ]}
      />
    </Seg>

    <Sequence from={t(107.5)} durationInFrames={t(131.92) - t(107.5)} name="12 Decreto (grafico em ecra inteiro)" layout="none">
      <Decreto />
    </Sequence>

    <Seg from={132.1} to={136.6} name="13 Ja sabe">
      <KW start={132.1} side="left" lines={[{ text: "JÁ SABE COMO É ELEITO", at: 132.62, size: 44 }, b("O PRESIDENTE", 133.68, 64), { text: "MAS FICA UMA PERGUNTA…", at: 135.46, size: 40, red: true }]} />
    </Seg>

    <Seg from={136.75} to={141.4} name="14 Qualquer pessoa pode concorrer">
      <KW start={136.75} side="right" lines={[{ text: "QUALQUER PESSOA", at: 137.72, size: 42 }, b("PODE CONCORRER", 138.5, 44), { text: "A PRESIDENTE?", at: 139.84, size: 52, red: true }]} />
    </Seg>

    <Seg from={141.55} to={144.65} name="15 Comentarios">
      <KW start={141.55} side="right" lines={[{ text: "DEIXE A SUA", at: 141.62, size: 52 }, b("OPINIÃO", 142.0, 76), { text: "NOS COMENTÁRIOS", at: 142.74, size: 44, red: true }]} />
    </Seg>

    <Seg from={144.8} to={151.45} name="16 Participe informado">
      <KW start={144.8} side="right" underlineAt={150.9} lines={[{ text: "PARTICIPE", at: 147.38, size: 64 }, b("DE FORMA INFORMADA", 149.38, 40), { text: "E CONSCIENTE", at: 150.56, size: 48, red: true }]} />
    </Seg>
  </AbsoluteFill>
);
