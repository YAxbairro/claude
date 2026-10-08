import { continueRender, delayRender, staticFile } from "remotion";

export const HEAD = "AntonLocal";
export const BODY = "MontserratLocal";
export const SCRIPT = "PacificoLocal";

const faces: [string, string, string][] = [
  [HEAD, "fonts/anton.woff2", "400"],
  [BODY, "fonts/montserrat.woff2", "100 900"],
  [SCRIPT, "fonts/pacifico.woff2", "400"],
];

if (typeof document !== "undefined" && !document.getElementById("cv-fonts")) {
  const style = document.createElement("style");
  style.id = "cv-fonts";
  style.textContent = faces
    .map(([family, file, weight]) => `@font-face{font-family:"${family}";src:url("${staticFile(file)}") format("woff2");font-weight:${weight};font-display:block;}`)
    .join("\n");
  document.head.appendChild(style);
  const handle = delayRender("fonts", { timeoutInMilliseconds: 60000 });
  let done = false;
  const finish = () => {
    if (!done) {
      done = true;
      continueRender(handle);
    }
  };
  Promise.all(faces.map(([family, , weight]) => document.fonts.load(`${weight.split(" ")[0]} 40px "${family}"`)))
    .then(finish, finish);
  setTimeout(finish, 6000);
}
