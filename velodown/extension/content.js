// Draws a small "Descarregar este vídeo" button over videos on the page.
(() => {
  if (window.__velodown) return;
  window.__velodown = true;
  const btn = document.createElement("button");
  btn.textContent = "⬇ Descarregar este vídeo";
  Object.assign(btn.style, {
    position: "fixed", zIndex: 2147483647, display: "none", padding: "6px 10px", font: "600 12px system-ui,sans-serif",
    color: "#fff", background: "#0f766e", border: "0", borderRadius: "8px", cursor: "pointer", boxShadow: "0 2px 8px #0005"
  });
  document.documentElement.appendChild(btn);
  let current = null, hideTimer = null;

  function place(v) {
    const r = v.getBoundingClientRect();
    if (r.width < 200 || r.height < 120) return;
    current = v;
    btn.style.top = Math.max(4, r.top + 8) + "px";
    btn.style.left = Math.max(4, r.right - btn.offsetWidth - 8 || r.right - 190) + "px";
    btn.style.display = "block";
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => (btn.style.display = "none"), 4000);
  }
  document.addEventListener("mouseover", (e) => {
    const v = e.target.closest?.("video") || (e.target === btn ? current : null);
    if (v) place(v);
  }, true);
  btn.addEventListener("mouseenter", () => clearTimeout(hideTimer));
  btn.addEventListener("click", (e) => {
    e.preventDefault(); e.stopPropagation();
    const src = current && (current.currentSrc || current.src);
    btn.textContent = "A enviar…";
    chrome.runtime.sendMessage({ type: "grab-video", src: src && !src.startsWith("blob:") ? src : null }, (r) => {
      btn.textContent = r && r.ok ? "✓ Enviado para o VeloDown" : "✕ " + ((r && r.error) || "Erro");
      setTimeout(() => (btn.textContent = "⬇ Descarregar este vídeo"), 2500);
    });
  });
})();
