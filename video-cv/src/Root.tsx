import { Composition } from "remotion";
import { CaboVerde } from "./CaboVerde";
import TL from "./timeline.json";

export const RemotionRoot = () => (
  <Composition
    id="CaboVerde"
    component={CaboVerde}
    durationInFrames={TL.durationSec * TL.fps}
    fps={TL.fps}
    width={1080}
    height={1920}
  />
);
