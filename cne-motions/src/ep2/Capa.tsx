import React from "react";
import { AbsoluteFill } from "remotion";
import { ConstitutionBook } from "./Overlay2";

// Stand-alone high-resolution render of the redrawn Constitution cover
export const Capa: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <div style={{ transform: "scale(3.4)" }}>
      <ConstitutionBook enter={1} sheen={0} shadow={false} tilt={0} />
    </div>
  </AbsoluteFill>
);
