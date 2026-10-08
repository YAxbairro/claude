import { continueRender, delayRender, staticFile } from "remotion";

export const HEAD = "AntonLocal";
export const BODY = "MontserratLocal";
export const SCRIPT = "PacificoLocal";

const faces: [string, string, string][] = [
  [HEAD, "fonts/anton.woff2", "400"],
  [BODY, "fonts/montserrat.woff2", "100 900"],
  [SCRIPT, "fonts/pacifico.woff2", "400"],
];

if (typeof document !== "undefined") {
  const handle = delayRender("fonts");
  Promise.all(
    faces.map(([family, file, weight]) => {
      const f = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, { weight });
      return f.load().then((loaded) => document.fonts.add(loaded));
    }),
  ).then(() => continueRender(handle));
}
