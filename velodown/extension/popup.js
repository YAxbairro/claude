const $ = s => document.querySelector(s);
const fmt = n => { if (!n) return ""; const u = ["B", "KB", "MB", "GB"]; let i = 0; while (n >= 1024 && i < 3) { n /= 1024; i++; } return n.toFixed(1) + " " + u[i]; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const r = await chrome.runtime.sendMessage({ type: "list", tabId: tab.id });
  $("#st").className = "dot " + (r.up ? "ok" : "off");
  $("#st").textContent = r.up ? "ligado" : "app fechada";
  $("#cap").checked = r.settings.capture;
  $("#min").value = r.settings.minSizeMB;
  $("#cap").onchange = () => chrome.storage.local.set({ capture: $("#cap").checked });
  $("#min").onchange = () => chrome.storage.local.set({ minSizeMB: +$("#min").value || 0 });
  const title = (tab.title || "video").replace(/[<>:"/\\|?*]/g, "_").slice(0, 120);
  $("#list").innerHTML = r.media.length ? r.media.map((m, i) => {
    const name = m.kind === "hls" ? "Stream de vídeo (HLS)" : decodeURIComponent(new URL(m.url).pathname.split("/").pop() || "media");
    return `<div class="item"><div><b title="${esc(m.url)}">${esc(name)}</b><small>${esc(m.type || m.kind)} ${fmt(m.size)}</small></div><button data-i="${i}">Descarregar</button></div>`;
  }).join("") : `<div class="empty">Nenhum vídeo ou áudio detetado nesta página. Dá play ao vídeo e abre isto outra vez.</div>`;
  $("#list").onclick = async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const m = r.media[+b.dataset.i];
    b.textContent = "…";
    const ext = m.kind === "hls" ? ".mp4" : "";
    const res = await chrome.runtime.sendMessage({ type: "download", url: m.url, kind: m.kind, referrer: tab.url, filename: m.kind === "hls" ? title + ext : undefined });
    b.textContent = res.ok ? "✓ Enviado" : "Erro";
    $("#msg").textContent = res.ok ? "" : res.error;
  };
})();
