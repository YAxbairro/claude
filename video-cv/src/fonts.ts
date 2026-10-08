import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

export const HEAD = "AntonLocal";
export const BODY = "MontserratLocal";
export const SCRIPT = "PacificoLocal";

const faces: [string, string, string][] = [
  [HEAD, "fonts/anton.woff2", "400"],
  [BODY, "fonts/montserrat.woff2", "100 900"],
  [SCRIPT, "fonts/pacifico.woff2", "400"],
];

const css = () =>
  faces
    .map(([family, file, weight]) => `@font-face{font-family:"${family}";src:url("${staticFile(file)}") format("woff2");font-weight:${weight};font-display:block;}`)
    .join("\n");

// Bloqueia o frame até as fontes locais estarem prontas.
export const useFonts = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        continueRender(handle);
      }
    };
    if (!document.getElementById("cv-fonts")) {
      const style = document.createElement("style");
      style.id = "cv-fonts";
      style.textContent = css();
      document.head.appendChild(style);
    }
    Promise.all(faces.map(([family, , weight]) => document.fonts.load(`${weight.split(" ")[0]} 40px "${family}"`))).then(finish, finish);
    const timer = setTimeout(finish, 5000);
    return () => {
      clearTimeout(timer);
      finish();
    };
  }, [handle]);
};
