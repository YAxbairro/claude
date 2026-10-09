import React from "react";
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { LogoAnim } from "../LogoAnim";
import { SANS } from "../theme";
import { Art, Disc, Line, NAVY, RED, Underline, ease, sec, useExit } from "./kit";
import { BallotIcon, Calendar, DatePage, FormDoc, HospitalIcon, InstitutionIcon, PhoneIcon, UrlPill } from "./vectors";

// Spot "Voto antecipado – internados e detidos". All timestamps (seconds) come from the voice-over.
export type SpotProps = { variant: "branco" | "alpha" };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Local frame of an absolute timestamp inside a scene that starts at `start`
const L = (abs: number, start: number) => sec(abs) - sec(start);

const Scene: React.FC<{ from: number; to: number; name: string; children: React.ReactNode }> = ({ from, to, name, children }) => (
  <Sequence from={sec(from)} durationInFrames={sec(to) - sec(from)} name={name}>
    {children}
  </Sequence>
);

// Slide-and-fade exit used where there is no colour wipe
const Exit: React.FC<{ children: React.ReactNode; len?: number }> = ({ children, len = 8 }) => {
  const e = useExit(len);
  return <AbsoluteFill style={{ opacity: 1 - e, transform: `translateX(${-140 * e}px)` }}>{children}</AbsoluteFill>;
};

// Red + navy diagonal bars sweeping across the frame; the cut happens under the navy panel
const Wipe: React.FC = () => {
  const frame = useCurrentFrame();
  const p = ease(frame, 0, 16, Easing.inOut(Easing.quad));
  const x = interpolate(p, [0, 1], [-2700, 2300]);
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: -200, height: 1480, left: x + 2350, width: 260, background: RED, transform: "skewX(-14deg)" }} />
      <div style={{ position: "absolute", top: -200, height: 1480, left: x, width: 2300, background: NAVY, transform: "skewX(-14deg)" }} />
    </AbsoluteFill>
  );
};
const WIPES = [6.9, 11.5, 15.2, 22.25, 33.35, 36.45];

// ---------- Scenes ----------

const S1: React.FC = () => (
  <Exit>
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ marginTop: 40 }}>
        <Line delay={L(0.24, 0)} size={62} weight={800} spacing={4}>
          Eleições Presidenciais
        </Line>
        <div style={{ height: 14 }} />
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 28 }}>
          <Line delay={L(1.5, 0)} size={190} color={RED}>
            15
          </Line>
          <Line delay={L(1.7, 0)} size={150}>
            de Novembro
          </Line>
        </div>
        <Underline delay={L(2.0, 0)} width={420} />
      </div>
    </AbsoluteFill>
  </Exit>
);

const S2: React.FC<{ start: number }> = ({ start }) => (
  <AbsoluteFill>
    <div style={{ position: "absolute", left: 250, top: 300 }}>
      <BallotIcon delay={L(3.0, start)} size={330} />
    </div>
    <Sequence from={0} durationInFrames={L(4.4, start)} layout="none">
      <Exit len={6}>
        <div style={{ position: "absolute", left: 760, top: 360 }}>
          <Line delay={L(3.2, start)} size={140} align="left">
            Internado
          </Line>
          <div style={{ height: 10 }} />
          <Line delay={L(3.76, start)} size={140} align="left" box={RED}>
            ou detido?
          </Line>
        </div>
      </Exit>
    </Sequence>
    <Sequence from={L(4.4, start)} layout="none">
      <div style={{ position: "absolute", left: 760, top: 330 }}>
        <Line delay={L(4.45, start) - L(4.4, start)} size={96} align="left">
          Não significa
        </Line>
        <div style={{ height: 12 }} />
        <Line delay={L(4.9, start) - L(4.4, start)} size={116} align="left" box={RED}>
          ficar sem
        </Line>
        <div style={{ height: 12 }} />
        <Line delay={L(5.5, start) - L(4.4, start)} size={150} align="left">
          votar
        </Line>
      </div>
    </Sequence>
  </AbsoluteFill>
);

const S3: React.FC<{ start: number; white: boolean }> = ({ start, white }) => (
  <Exit len={7}>
    <Disc delay={0} size={900} x={640} y={600} show={white} />
    <Art src="spot/doente.png" delay={L(6.95, start)} from="left" float={4} style={{ left: 90, top: 300, width: 1080 }} />
    <div style={{ position: "absolute", left: 1220, top: 270, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <HospitalIcon delay={L(7.5, start)} size={170} />
      <div style={{ height: 30 }} />
      <Line delay={L(7.66, start)} size={84} align="left">
        Internado
      </Line>
      <Line delay={L(8.1, start)} size={84} align="left">
        num
      </Line>
      <div style={{ height: 8 }} />
      <Line delay={L(8.22, start)} size={96} align="left" box={RED}>
        hospital
      </Line>
    </div>
  </Exit>
);

const S3b: React.FC<{ start: number }> = ({ start }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 90 }}>
      <InstitutionIcon delay={L(9.4, start)} size={380} />
      <div>
        <Line delay={L(9.4, start)} size={80} align="left">
          ou detido num
        </Line>
        <div style={{ height: 12 }} />
        <Line delay={L(9.94, start)} size={96} align="left" box={RED}>
          estabelecimento
        </Line>
        <div style={{ height: 12 }} />
        <Line delay={L(10.3, start)} size={110} align="left">
          prisional
        </Line>
      </div>
    </div>
  </AbsoluteFill>
);

const S4: React.FC<{ start: number }> = ({ start }) => (
  <AbsoluteFill>
    <div style={{ position: "absolute", left: 150, top: 300 }}>
      <Line delay={L(11.6, start)} size={84} align="left">
        Pode votar
      </Line>
      <div style={{ height: 12 }} />
      <Line delay={L(12.1, start)} size={80} align="left" box={RED}>
        antecipadamente
      </Line>
      <div style={{ height: 34 }} />
      <Line delay={L(12.82, start)} size={58} align="left" weight={800} spacing={1}>
        entre 2 e 5 de novembro
      </Line>
      <Underline delay={L(13.2, start)} width={300} align="left" />
    </div>
    <div style={{ position: "absolute", left: 1220, top: 200 }}>
      <Calendar delay={L(11.7, start)} markAt={[13.42, 13.62, 13.78, 13.9].map((s) => L(s, start))} />
    </div>
  </AbsoluteFill>
);

const S5: React.FC<{ start: number; white: boolean }> = ({ start, white }) => {
  const frame = useCurrentFrame();
  // the building eases left to make room for the deadline
  const shift = ease(frame, L(20.3, start), L(20.9, start));
  return (
    <AbsoluteFill>
      <Disc delay={0} size={980} x={620 - 40 * shift} y={560} show={white} />
      <Art src="spot/camara.png" delay={L(15.3, start)} from="scale" float={3} style={{ left: 60 - 40 * shift, top: 300, width: 1080 }} />
      <div style={{ position: "absolute", left: 1130, top: 190 }}>
        <Line delay={L(15.96, start)} size={36} align="left" weight={800} spacing={1}>
          Requeira o voto antecipado
        </Line>
        <div style={{ height: 14 }} />
        <Line delay={L(17.2, start)} size={74} align="left">
          na Câmara
        </Line>
        <div style={{ height: 8 }} />
        <Line delay={L(17.54, start)} size={84} align="left" box={RED}>
          Municipal
        </Line>
        <div style={{ height: 22 }} />
        <Line delay={L(18.1, start)} size={30} align="left" weight={700} spacing={0.5}>
          do concelho onde está recenseado
        </Line>
      </div>
      <div style={{ position: "absolute", left: 1130, top: 690, display: "flex", alignItems: "center", gap: 36 }}>
        <DatePage delay={L(20.6, start)} day="29" month="OUT" />
        <div>
          <Line delay={L(20.56, start)} size={64} align="left">
            até 29 de
          </Line>
          <Line delay={L(21.2, start)} size={64} align="left" color={RED}>
            outubro
          </Line>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const S6: React.FC<{ start: number; white: boolean }> = ({ start, white }) => (
  <Exit>
    <Disc delay={0} size={920} x={600} y={620} show={white} />
    <Art src="spot/doente.png" delay={0} from="scale" style={{ left: -10, top: 440, width: 820 }} />
    <Art src="spot/funcionario.png" delay={L(22.6, start)} from="right" float={3} style={{ left: 690, top: 250, height: 790 }} />
    <div style={{ position: "absolute", left: 1210, top: 300 }}>
      <Line delay={L(22.54, start)} size={64} align="left">
        Com o apoio
      </Line>
      <Line delay={L(23.2, start)} size={64} align="left">
        dos diretores
      </Line>
      <Line delay={L(24.08, start)} size={50} align="left" weight={800}>
        dos respetivos
      </Line>
      <div style={{ height: 12 }} />
      <Line delay={L(24.6, start)} size={56} align="left" box={RED}>
        estabelecimentos
      </Line>
    </div>
  </Exit>
);

const S7: React.FC<{ start: number }> = ({ start }) => (
  <Exit>
    <div style={{ position: "absolute", left: 230, top: 250 }}>
      <FormDoc delay={L(25.5, start)} />
    </div>
    <div style={{ position: "absolute", left: 820, top: 300 }}>
      <Line delay={L(25.54, start)} size={70} align="left">
        Consulte o
      </Line>
      <div style={{ height: 8 }} />
      <Line delay={L(26.64, start)} size={86} align="left" box={RED}>
        formulário
      </Line>
    </div>
    <div style={{ position: "absolute", left: 820, top: 610 }}>
      <UrlPill delay={L(27.6, start)} clickAt={L(29.3, start)} />
    </div>
  </Exit>
);

const S8: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const groups = [
    { t: "800", at: 31.6 },
    { t: "10", at: 32.3 },
    { t: "14", at: 32.74 },
  ];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 70, marginTop: 30 }}>
        <PhoneIcon delay={L(30.4, start)} size={330} />
        <div>
          <Line delay={L(30.72, start)} size={50} align="left" weight={800} spacing={2}>
            Ligue gratuitamente
          </Line>
          <div style={{ height: 6 }} />
          <Line delay={L(31.0, start)} size={44} align="left" weight={800} spacing={3} color={RED}>
            Linha verde
          </Line>
          <div style={{ display: "flex", gap: 34, marginTop: 6 }}>
            {groups.map((g) => {
              const d = L(g.at, start);
              const p = ease(frame, d, d + 7, Easing.out(Easing.back(2)));
              return (
                <span key={g.t} style={{ display: "inline-block", fontFamily: SANS, fontWeight: 900, fontSize: 200, color: NAVY, lineHeight: 1, transform: `translateY(${(1 - p) * 60}px) scale(${0.7 + 0.3 * p})`, opacity: p }}>
                  {g.t}
                </span>
              );
            })}
          </div>
          <Underline delay={L(32.9, start)} width={380} align="left" />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const S9: React.FC<{ start: number; white: boolean }> = ({ start, white }) => (
  <AbsoluteFill>
    <Disc delay={0} size={900} x={560} y={640} show={white} />
    <Art src="spot/idoso.png" delay={L(33.4, start)} from="left" style={{ left: 120, top: 220, height: 860 }} />
    <div style={{ position: "absolute", left: 1150, top: 300 }}>
      <Line delay={L(33.52, start)} size={96} align="left">
        Cada voto
      </Line>
      <div style={{ height: 10 }} />
      <Line delay={L(33.96, start)} size={130} align="left" box={RED}>
        conta.
      </Line>
      <div style={{ height: 30 }} />
      <Line delay={L(34.74, start)} size={58} align="left" weight={800}>
        O teu também.
      </Line>
      <Line delay={L(35.28, start)} size={92} align="left">
        Participa!
      </Line>
      <Underline delay={L(35.5, start)} width={300} align="left" />
    </div>
  </AbsoluteFill>
);

// Corner logos, as in the other CNE spots
const Bugs: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [sec(0.3), sec(0.9), sec(36.3), sec(36.5)], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Img src={staticFile("eleicao-cor.png")} style={{ position: "absolute", left: 60, top: 40, height: 92 }} />
      <Img src={staticFile("cne.png")} style={{ position: "absolute", right: 60, top: 52, height: 66 }} />
    </AbsoluteFill>
  );
};

export const SPOT_DURATION = sec(42);

export const Spot: React.FC<SpotProps> = ({ variant }) => {
  const white = variant === "branco";
  return (
    <AbsoluteFill style={{ background: white ? "#FFFFFF" : undefined }}>
      <Scene from={0} to={3.0} name="01 15 de Novembro">
        <S1 />
      </Scene>
      <Scene from={2.85} to={6.9} name="02 Internado ou detido">
        <S2 start={2.85} />
      </Scene>
      <Scene from={6.9} to={9.45} name="03 Hospital">
        <S3 start={6.9} white={white} />
      </Scene>
      <Scene from={9.3} to={11.5} name="03b Estabelecimento prisional">
        <S3b start={9.3} />
      </Scene>
      <Scene from={11.5} to={15.2} name="04 Calendario 2-5 Nov">
        <S4 start={11.5} />
      </Scene>
      <Scene from={15.2} to={22.25} name="05 Camara Municipal">
        <S5 start={15.2} white={white} />
      </Scene>
      <Scene from={22.25} to={25.5} name="06 Apoio dos diretores">
        <S6 start={22.25} white={white} />
      </Scene>
      <Scene from={25.35} to={30.25} name="07 Formulario www.cne.cv">
        <S7 start={25.35} />
      </Scene>
      <Scene from={30.1} to={33.35} name="08 Linha verde">
        <S8 start={30.1} />
      </Scene>
      <Scene from={33.35} to={36.45} name="09 Cada voto conta">
        <S9 start={33.35} white={white} />
      </Scene>
      <Sequence from={sec(36.45)} name="10 Logo final">
        <LogoAnim variant="cor" />
      </Sequence>

      <Bugs />

      {WIPES.map((w) => (
        <Sequence key={w} from={sec(w) - 8} durationInFrames={17} name={`wipe ${w}`}>
          <Wipe />
        </Sequence>
      ))}

      <Audio src={staticFile("spot/vo.mp3")} />
    </AbsoluteFill>
  );
};
