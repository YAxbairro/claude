import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/montserrat/900.css";
import "@fontsource/playfair-display/700-italic.css";
import "@fontsource/playfair-display/800.css";

// Source video is 23.976 fps, 120.45 s
export const FPS = 24000 / 1001;
export const DURATION = Math.ceil(120.453 * FPS);

// Seconds -> frame
export const t = (s: number) => Math.round(s * FPS);

export const NAVY = "#1F2B45";
export const RED = "#E33C2E";
export const WHITE = "#FFFFFF";

export const SANS = "Montserrat, sans-serif";
export const SERIF = "'Playfair Display', serif";

export const SHADOW = "0 4px 24px rgba(0,0,0,0.35)";
