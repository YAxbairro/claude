// Eagle Motion Engine — animation helpers. Everything is a pure function of time.
const M = {
  clamp: (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)),
  lerp: (a, b, k) => a + (b - a) * k,
  // progress of t within [a, b], clamped 0..1
  p: (t, a, b) => M.clamp((t - a) / (b - a)),
  easeOutCubic: (k) => 1 - Math.pow(1 - k, 3),
  easeInCubic: (k) => k * k * k,
  easeInOutCubic: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  easeOutExpo: (k) => (k === 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  easeInExpo: (k) => (k === 0 ? 0 : Math.pow(2, 10 * k - 10)),
  easeInOutExpo: (k) =>
    k === 0 ? 0 : k === 1 ? 1 : k < 0.5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2,
  easeOutBack: (k, s = 1.70158) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2),
  // damped spring 0 -> 1
  spring: (k, freq = 4.5, damp = 5) => (k <= 0 ? 0 : 1 - Math.exp(-damp * k) * Math.cos(freq * Math.PI * k)),
  // animate in at [a, a+d] and out at [b, b+d2]
  inOut: (t, a, d, b, d2, ein = M.easeOutCubic, eout = M.easeInCubic) =>
    ein(M.p(t, a, a + d)) * (1 - eout(M.p(t, b, b + d2))),
  set: (el, s) => {
    for (const k in s) el.style[k] = s[k];
  },
};
window.M = M;
