import React from "react";
import { Composition } from "remotion";
import { LogoAnim } from "./LogoAnim";
import { Overlay } from "./Overlay";
import { Capa } from "./ep2/Capa";
import { EP2_DURATION, Overlay2 } from "./ep2/Overlay2";
import { SPOT_DURATION, Spot } from "./spot/Spot";
import { SPOT2_DURATION, Spot2 } from "./spot/Spot2";
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
    {(["cor", "alpha"] as const).map((variant) => (
      <Composition
        key={`v2-${variant}`}
        id={`SpotVotoAntecipadoV2-${variant}`}
        component={Spot2}
        durationInFrames={SPOT2_DURATION}
        fps={SPOT_FPS}
        width={1920}
        height={1080}
        defaultProps={{ variant }}
      />
    ))}
  </>
);
