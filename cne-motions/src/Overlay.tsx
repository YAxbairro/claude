import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { BallotBox, Conditions, DateBlock, FewPeople, Keyword, NextEpisode, Outro, Requirements, TodayFlash, VoteIs, Votum } from "./components";
import { DURATION, t } from "./theme";

// Shows children between two timestamps (seconds of the source video)
const Seg: React.FC<{ from: number; to: number; name: string; children: React.ReactNode }> = ({ from, to, name, children }) => (
  <Sequence from={t(from)} durationInFrames={t(to) - t(from)} name={name} layout="none">
    {children}
  </Sequence>
);

// All timestamps come from the word-level transcript of "CNE Explica – Ep. 1"
export const Overlay: React.FC = () => (
  <AbsoluteFill>
    <Seg from={12.7} to={16.6} name="01 Democracia">
      <Keyword
        start={12.7}
        pos={{ right: 110, top: 400 }}
        align="right"
        underlineAt={13.9}
        lines={[
          { text: "FORTALECER A", at: 12.94, size: 54 },
          { text: "DEMOCRACIA", at: 13.58, size: 120 },
        ]}
      />
    </Seg>

    <Seg from={17.3} to={23.8} name="02 Data 15 Novembro">
      <DateBlock start={17.3} tag={{ text: "ELEIÇÃO PRESIDENCIAL", at: 21.5 }} />
    </Seg>

    <Seg from={24.6} to={31.0} name="03 Boletim na urna">
      <BallotBox start={24.6} dropAt={28.9} labelAt={29.9} />
    </Seg>

    <Seg from={35.7} to={46.4} name="04 Historia - so alguns">
      <FewPeople start={35.7} titleAt={36.9} peopleAt={41.4} dimAt={43.0} captionAt={44.4} />
    </Seg>

    <Seg from={47.8} to={55.5} name="05 Condicoes riscadas">
      <Conditions
        start={47.8}
        strikeAt={54.34}
        items={[
          { text: "SEXO", at: 50.62 },
          { text: "CONDIÇÃO ECONÓMICA", at: 51.26 },
          { text: "CLASSE SOCIAL", at: 52.5 },
          { text: "ORIGEM", at: 53.52 },
        ]}
      />
    </Seg>

    <Seg from={54.5} to={56.6} name="06 Hoje e diferente">
      <TodayFlash />
    </Seg>

    <Seg from={56.4} to={66.2} name="07 Quem pode votar">
      <Requirements
        start={56.4}
        items={[
          { text: "18+ ANOS", at: 61.14 },
          { text: "RECENSEADO", at: 62.38 },
        ]}
      />
    </Seg>

    <Seg from={70.3} to={80.8} name="08 Votum (latim)">
      <Votum
        start={70.3}
        wordAt={71.68}
        highlightAt={78.8}
        meanings={[
          { text: "Desejo", at: 73.14 },
          { text: "Promessa", at: 74.36 },
          { text: "Manifestação de vontade", at: 75.02 },
        ]}
      />
    </Seg>

    <Seg from={86.6} to={93.2} name="09 Data 15 Novembro (repeticao)">
      <DateBlock start={86.6} tag={{ text: "PRESIDENTE DA REPÚBLICA", at: 91.7 }} />
    </Seg>

    <Seg from={100.0} to={107.2} name="10 Proximo episodio">
      <NextEpisode />
    </Seg>

    <Seg from={110.0} to={112.2} name="11 Consciente e informada">
      <Keyword
        start={110.0}
        pos={{ left: 120, top: 430 }}
        lines={[
          { text: "CONSCIENTE", at: 110.24, size: 100 },
          { text: "E INFORMADA", at: 111.14, size: 70, red: true },
        ]}
      />
    </Seg>

    <Seg from={113.0} to={116.6} name="12 Pessoal Livre Secreto">
      <VoteIs
        start={113.0}
        items={[
          { text: "PESSOAL", at: 113.5, icon: "person" },
          { text: "LIVRE", at: 114.26, icon: "bird" },
          { text: "SECRETO", at: 114.96, icon: "lock" },
        ]}
      />
    </Seg>

    <Seg from={117.1} to={DURATION / (24000 / 1001)} name="13 Outro">
      <Outro start={117.1} ctaAt={119.4} />
    </Seg>
  </AbsoluteFill>
);
