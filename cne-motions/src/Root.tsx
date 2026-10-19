import React from "react";
import { Composition } from "remotion";
import { LogoAnim } from "./LogoAnim";
import { Overlay } from "./Overlay";
import { Capa } from "./ep2/Capa";
import { EP2_DURATION, Overlay2 } from "./ep2/Overlay2";
import { EP3_DURATION, Overlay3 } from "./ep3/Overlay3";
import { EP5_DURATION, Overlay5 } from "./ep5/Overlay5";
import { DECRETO_DURATION, Decreto } from "./ep5/Decreto";
import { EPPR_DURATION, OverlayPR } from "./ep5/OverlayPR";
import { SPOT_DURATION, Spot } from "./spot/Spot";
import { SPOT2_DURATION, Spot2 } from "./spot/Spot2";
import { FINALS_DURATION, FinalsReel } from "./spot/Finals";
import { SPOT3_DURATION, Spot3 } from "./spot/Spot3";
import { SPOT4_DURATION, Spot4 } from "./spot/Spot4";
import { SPOT_FPS } from "./spot/kit";
import { DURATION, FPS } from "./theme";

const LOGO_FRAMES = Math.round(7 * FPS);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="CneExplicaEp1"
      component={Overlay}
      durationInFrames={DURATION}
      fps={FPS}
      width={1920}
      height={1080}
      calculateMetadata={async () => ({
        defaultCodec: "prores",
        defaultVideoImageFormat: "png",
        defaultPixelFormat: "yuva444p10le",
        defaultProResProfile: "4444",
      })}
    />
    <Composition id="CapaConstituicao" component={Capa} durationInFrames={1} fps={FPS} width={1300} height={1700} />
    <Composition id="CneExplicaEp3" component={Overlay3} durationInFrames={EP3_DURATION} fps={FPS} width={1920} height={1080} />
    <Composition id="CneExplicaEleicaoPR" component={OverlayPR} durationInFrames={EPPR_DURATION} fps={FPS} width={1920} height={1080} />
    <Composition id="EpEleicaoPR-Decreto" component={Decreto} durationInFrames={DECRETO_DURATION} fps={FPS} width={1920} height={1080} />
    <Composition id="CneExplicaEp5" component={Overlay5} durationInFrames={EP5_DURATION} fps={FPS} width={1920} height={1080} />
    <Composition id="CneExplicaEp2" component={Overlay2} durationInFrames={EP2_DURATION} fps={FPS} width={1920} height={1080} />
    {(["cor", "branco"] as const).map((variant) => (
      <Composition
        key={variant}
        id={`LogoEleicao-${variant}`}
        component={LogoAnim}
        durationInFrames={LOGO_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ variant }}
      />
    ))}
    {(["branco", "alpha"] as const).map((variant) => (
      <Composition
        key={variant}
        id={`SpotVotoAntecipado-${variant}`}
        component={Spot}
        durationInFrames={SPOT_DURATION}
        fps={SPOT_FPS}
        width={1920}
        height={1080}
        defaultProps={{ variant }}
      />
    ))}
    {(["cor", "alpha"] as const).flatMap((variant) =>
      (["mono", "cor"] as const).map((logos) => (
        <Composition
          key={`v2-${variant}-${logos}`}
          id={`SpotVotoAntecipadoV2-${variant}${logos === "cor" ? "-logocor" : ""}`}
          component={Spot2}
          durationInFrames={SPOT2_DURATION}
          fps={SPOT_FPS}
          width={1920}
          height={1080}
          defaultProps={{ variant, logos }}
        />
      )),
    )}
    {(["cor", "alpha"] as const).map((variant) => (
      <Composition
        key={`v3-${variant}`}
        id={`SpotPresosDoentes-${variant}`}
        component={Spot3}
        durationInFrames={SPOT3_DURATION}
        fps={SPOT_FPS}
        width={1920}
        height={1080}
        defaultProps={{ variant }}
      />
    ))}
    {(["cor", "alpha"] as const).map((variant) => (
      <Composition
        key={`v4-${variant}`}
        id={`SpotCategoriasProfissionais-${variant}`}
        component={Spot4}
        durationInFrames={SPOT4_DURATION}
        fps={SPOT_FPS}
        width={1920}
        height={1080}
        defaultProps={{ variant }}
      />
    ))}
    <Composition id="SpotFinaisOpcoes" component={FinalsReel} durationInFrames={FINALS_DURATION} fps={SPOT_FPS} width={1920} height={1080} />
  </>
);
