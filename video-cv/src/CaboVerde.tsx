import React from "react";
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY, useFonts } from "./fonts";
import { Confetti, Flash, Grain, LightLeak, Sparkles, Vignette } from "./fx";
import { beatPulse } from "./geo";
import { EndCard } from "./scenes/EndCard";
import { Intro } from "./scenes/Intro";
import { MapJourney } from "./scenes/MapJourney";
import { Plan } from "./scenes/Plan";
import { Rise, Slam } from "./text";
import TL from "./timeline.json";

const S = TL.scenes;
const P = TL.phrases;

// Transição "whip": entra com zoom/desfoque, sai com zoom/desfoque.
const Whip: React.FC<{ range: number[]; children: React.ReactNode; inDur?: number; outDur?: number }> = ({ range, children, inDur = 0.35, outDur = 0.3 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const [a, b] = range;
  if (t < a - 0.001 || t >= b) return null;
  const pin = a === 0 ? 1 : Math.min(1, (t - a) / inDur);
  const pout = b >= TL.durationSec ? 0 : Math.max(0, (t - (b - outDur)) / outDur);
  const eIn = 1 - (1 - pin) ** 3;
  const scale = interpolate(eIn, [0, 1], [1.35, 1]) * interpolate(pout ** 2, [0, 1], [1, 1.6]);
  const blur = (1 - eIn) * 22 + pout ** 2 * 26;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale}) rotate(${(1 - eIn) * -4 + pout ** 2 * 5}deg)`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
};

const WORD_STYLES = [
  "linear-gradient(180deg,#ffffff 20%,#9ef0a0 100%)",
  "linear-gradient(180deg,#ffffff 20%,#ffe27a 100%)",
  "linear-gradient(180deg,#ffd36b 0%,#ff4e1f 100%)",
  "linear-gradient(180deg,#ffffff 10%,#ffb3c8 100%)",
  "linear-gradient(180deg,#ffe27a 0%,#ff7a3c 100%)",
  "linear-gradient(180deg,#ffffff 20%,#ffd36b 100%)",
];
const WORD_SUBS = ["que tocam as nuvens", "sem fim", "que ainda respira", "ao pôr do sol", "até de manhã", "em cada porto"];

const IslandsOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const count = TL.islandPops.filter((p) => t >= p).length;
  const bump = spring({ frame: frame - (TL.islandPops[Math.max(0, count - 1)] ?? 0) * fps, fps, config: { damping: 8, stiffness: 300 } });
  const vis = interpolate(t, [S.islands[0], S.islands[0] + 0.3, S.islands[1] - 0.4, S.islands[1]], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <Slam text="NOVE ILHAS." from={P.noveIlhas[0]} to={S.islands[1] - 0.15} size={150} y={300} />
      <Rise text="NOVE MUNDOS DIFERENTES" from={P.noveMundos[0]} to={S.islands[1] - 0.15} y={400} size={56} font={BODY} weight={900} bg="rgba(207,32,39,0.92)" />
      <div
        style={{
          position: "absolute",
          right: 70,
          bottom: 160,
          fontFamily: BODY,
          fontWeight: 900,
          color: "#fff",
          fontSize: 230,
          lineHeight: 1,
          opacity: vis * (count > 0 ? 1 : 0),
          transform: `scale(${0.8 + 0.2 * bump})`,
          textShadow: "0 12px 0 rgba(0,30,80,0.5)",
        }}
      >
        {count}
        <span style={{ fontSize: 50, letterSpacing: 4, marginLeft: 10 }}>/9</span>
      </div>
    </>
  );
};

const JourneyWords: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const pulse = beatPulse(t);
  return (
    <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + pulse * 0.025})` }}>
      {TL.words.map(([w, a, b], i) => (
        <React.Fragment key={i}>
          <Slam text={w as string} from={a as number} to={(b as number) + 0.15} size={(w as string).length > 7 ? 170 : 200} y={330} gradient={WORD_STYLES[i]} />
          <Rise text={WORD_SUBS[i].toUpperCase()} from={(a as number) + 0.25} to={(b as number) + 0.15} y={430} size={44} font={BODY} weight={900} bg="rgba(0,35,90,0.75)" />
        </React.Fragment>
      ))}
    </div>
  );
};

const Backpack: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at * fps, fps, config: { damping: 7, stiffness: 120 } });
  if (s < 0.01) return null;
  const sway = Math.sin(frame / 6) * 4;
  return (
    <div style={{ position: "absolute", left: 540 - 150, top: 820 + (1 - s) * -900, transform: `rotate(${sway + (1 - s) * 30}deg) scale(${0.6 + 0.4 * s})` }}>
      <svg width="300" height="360" viewBox="0 0 300 360">
        <path d="M95 70 Q95 20 150 20 Q205 20 205 70" stroke="#7a3a12" strokeWidth={18} fill="none" />
        <rect x={45} y={60} width={210} height={280} rx={60} fill="#cf2027" stroke="#fff" strokeWidth={8} />
        <rect x={80} y={180} width={140} height={120} rx={26} fill="#a3151b" stroke="#fff" strokeWidth={5} />
        <rect x={80} y={200} width={140} height={10} fill="#f7d116" />
        <path d="M70 110 Q150 150 230 110" stroke="#fff" strokeWidth={6} fill="none" />
        <circle cx={150} cy={250} r={18} fill="#f7d116" />
        <rect x={60} y={95} width={30} height={60} rx={10} fill="#003893" transform="rotate(-12 75 125)" />
      </svg>
    </div>
  );
};

const MochilaOverlay: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,20,60,0.55) 0%, rgba(0,20,60,0) 35%, rgba(0,20,60,0) 70%, rgba(0,20,60,0.6) 100%)" }} />
    <Slam text="PEGA NA MOCHILA." from={P.mochila[0]} to={P.teu[0] - 0.2} size={130} y={330} />
    <Backpack at={P.mochila[0] + 0.05} />
    <Slam text="O ARQUIPÉLAGO" from={P.teu[0] - 0.05} to={TL.scenes.mochila[1]} size={140} y={300} />
    <Slam text="É TEU." from={P.teu[0] + 0.35} to={TL.scenes.mochila[1]} size={260} y={470} gradient="linear-gradient(180deg,#ffe27a 0%,#ff7a3c 100%)" />
    <Sparkles count={50} seed="moch" />
  </>
);

export const CaboVerde: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ background: "#001a4d", overflow: "hidden" }}>
      <Whip range={S.intro}>
        <Intro />
      </Whip>
      <Whip range={[S.islands[0], S.journey[1]]}>
        <MapJourney mode="journey" />
        <IslandsOverlay />
        <JourneyWords />
      </Whip>
      <Whip range={S.plan}>
        <Plan />
      </Whip>
      <Whip range={S.mochila}>
        <MapJourney mode="finale" />
        <MochilaOverlay />
      </Whip>
      <Whip range={S.end} outDur={0.01}>
        <EndCard />
        <Sparkles count={60} seed="end" />
      </Whip>

      <Confetti at={f(P.mochila[0])} />
      <Confetti at={f(P.caboVerde[0])} count={100} originY={700} />
      {[S.islands[0], S.plan[0], S.mochila[0], S.end[0]].map((s, i) => (
        <React.Fragment key={i}>
          <Flash at={f(s) - 1} dur={9} />
          <LightLeak at={f(s) - 6} dur={28} />
        </React.Fragment>
      ))}
      <Flash at={f(P.plano[0])} dur={6} color="#ffe27a" />
      <LightLeak at={f(TL.legs[6].end) - 8} dur={30} color="255,110,40" />

      <Vignette />
      <Grain />

      {/* trilha.wav = narração + batuku + efeitos (audio/mix.py) */}
      <Audio src={staticFile("trilha.wav")} />
    </AbsoluteFill>
  );
};
