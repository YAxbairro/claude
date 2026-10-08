import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { t } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Spring 0 -> 1 starting at `delay` frames (local to the Sequence)
export const useIn = (delay = 0, damping = 16) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass: 0.7 } });
};

// 1 -> 0 over the last `len` frames of the Sequence
export const useOut = (len = 9) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(frame, [durationInFrames - len, durationInFrames], [1, 0], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });
};

// Linear eased ramp 0 -> 1 from `start` over `len` frames
export const ramp = (frame: number, start: number, len: number) =>
  interpolate(frame, [start, start + len], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

// Local frame offset of an absolute timestamp, given the Sequence start (seconds)
export const at = (abs: number, seqStart: number) => t(abs) - t(seqStart);
