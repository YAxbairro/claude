import React from "react";
import { Composition } from "remotion";
import { LogoAnim } from "./LogoAnim";
import { Overlay } from "./Overlay";
import { DURATION, FPS } from "./theme";

const LOGO_FRAMES = Math.round(6 * FPS);

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
  </>
);
