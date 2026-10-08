import React from "react";
import { Composition } from "remotion";
import { Overlay } from "./Overlay";
import { DURATION, FPS } from "./theme";

export const RemotionRoot: React.FC = () => (
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
);
