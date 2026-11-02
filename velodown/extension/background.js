// VeloDown browser integration: hands downloads and detected media to the
// local VeloDown app (http://127.0.0.1:8787). If the app is not running,
// the browser keeps the download as normal.
const API = "http://127.0.0.1:8787";
const CAPTURE_EXT = /\.(zip|rar|7z|tar|gz|bz2|xz|iso|exe|msi|dmg|pkg|deb|rpm|apk|appimage|mp4|mkv|avi|mov|webm|wmv|flv|m4v|mp3|flac|wav|aac|ogg|m4a|pdf|epub|docx?|xlsx?|pptx?|bin|img)(\?|$)/i;
const MEDIA_TYPE = /^(video\/|audio\/|application\/(vnd\.apple\.mpegurl|x-mpegurl|dash\+xml))/i;
const handedOff = new Set();   // URLs we sent, so we don't capture our own retries
const media = {};              // tabId -> [{url, type, size, title}]

const settings = async () => ({ capture: true, minSizeMB: 1, ...(await chrome.storage.local.get(["capture", "minSizeMB"])) });

async function appUp() {
  try { const r = await fetch(API + "/api/ping", { cache: "no-store" }); return r.ok; } catch { return false; }
}

async function send(url, { filename, referrer, kind } = {}) {
  const headers = { "User-Agent": navigator.userAgent };
  if (referrer) headers.Referer = referrer;
  try {
    const cookies = await chrome.cookies.getAll({ url });
    if (cookies.length) headers.Cookie = cookies.map(c => `${c.name}=${c.value}`).join("; ");
  } catch {}
  const r = await fetch(API + "/api/downloads", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, filename, headers, kind, start: true })
  });
  if (!r.ok) throw new Error((await r.json()).error || r.status);
  handedOff.add(url);
  return r.json();
}

// ---- 1. Capture browser downloads ---------------------------------------
chrome.downloads.onCreated.addListener(async (item) => {
  const s = await settings();
  const url = item.finalUrl || item.url;
  if (!s.capture || !/^https?:/.test(url) || handedOff.has(url)) return;
  const bigEnough = item.totalBytes <= 0 || item.totalBytes >= s.minSizeMB * 1024 * 1024;
  const wanted = CAPTURE_EXT.test(url) || CAPTURE_EXT.test(item.filename || "") || item.totalBytes >= 5 * 1024 * 1024;
  if (!wanted || !bigEnough || !(await appUp())) return;
  try {
    await chrome.downloads.cancel(item.id);
    await chrome.downloads.erase({ id: item.id });
    const name = (item.filename || "").split(/[\\/]/).pop() || undefined;
    await send(url, { filename: name, referrer: item.referrer });
  } catch (e) {
    // Fall back to the browser so the user never loses the download.
    handedOff.add(url);
    chrome.downloads.download({ url });
  }
});

// ---- 2. Right-click menu --------------------------------------------------
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "vd-link", title: "Descarregar com VeloDown", contexts: ["link", "video", "audio", "image"] });
  chrome.contextMenus.create({ id: "vd-all", title: "Descarregar todos os links com VeloDown", contexts: ["page"] });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "vd-link") {
    const url = info.linkUrl || info.srcUrl;
    if (url) send(url, { referrer: info.pageUrl }).catch(e => notify(e.message));
  } else if (info.menuItemId === "vd-all") {
    const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => [...document.links].map(a => a.href) });
    for (const u of new Set(result.filter(u => CAPTURE_EXT.test(u)))) send(u, { referrer: tab.url }).catch(() => {});
  }
});

// ---- 3. Detect video/audio streams on each tab ------------------------------
chrome.webRequest.onHeadersReceived.addListener((d) => {
  if (d.tabId < 0) return;
  const h = Object.fromEntries((d.responseHeaders || []).map(x => [x.name.toLowerCase(), x.value]));
  const type = (h["content-type"] || "").split(";")[0];
  const isHls = /\.m3u8(\?|$)/i.test(d.url) || /mpegurl/i.test(type);
  const isFile = MEDIA_TYPE.test(type) && !/mpegurl|dash/i.test(type);
  if (!isHls && !isFile) return;
  if (/\.(ts|m4s|aac)(\?|$)/i.test(d.url)) return; // stream pieces, not whole media
  let size = 0;
  const cr = h["content-range"]; if (cr) size = +cr.split("/")[1] || 0; else size = +h["content-length"] || 0;
  if (isFile && size && size < 300 * 1024) return; // ignore tiny clips / sounds
  const key = d.url.split("#")[0];
  addMedia(d.tabId, { url: key, kind: isHls ? "hls" : "file", type, size, time: Date.now() });
}, { urls: ["<all_urls>"] }, ["responseHeaders"]);

// The service worker can be stopped when idle, so detected media also lives in session storage.
async function getMedia(tabId) {
  if (!media[tabId]) media[tabId] = (await chrome.storage.session.get("m" + tabId))["m" + tabId] || [];
  return media[tabId];
}
async function addMedia(tabId, item) {
  const list = await getMedia(tabId);
  if (list.some(m => m.url === item.url)) return;
  list.push(item);
  chrome.storage.session.set({ ["m" + tabId]: list });
  const d = { tabId };
  chrome.action.setBadgeText({ tabId: d.tabId, text: String(list.length) });
  chrome.action.setBadgeBackgroundColor({ tabId: d.tabId, color: "#0f766e" });
  chrome.tabs.sendMessage(d.tabId, { type: "vd-media", count: list.length }).catch(() => {});
}

const forget = (tabId) => { delete media[tabId]; chrome.storage.session.remove("m" + tabId); };
chrome.tabs.onUpdated.addListener((tabId, info) => { if (info.status === "loading" && info.url) { forget(tabId); chrome.action.setBadgeText({ tabId, text: "" }); } });
chrome.tabs.onRemoved.addListener(forget);

function best(list) {
  // Prefer a master/variant HLS playlist (the first one requested is usually the master), else the largest file.
  const hls = list.filter(m => m.kind === "hls");
  if (hls.length) return hls[0];
  return [...list].sort((a, b) => b.size - a.size)[0];
}

function notify(msg) { console.warn("VeloDown:", msg); }

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  (async () => {
    if (msg.type === "list") return reply({ media: await getMedia(msg.tabId), up: await appUp(), settings: await settings() });
    if (msg.type === "download") {
      try { await send(msg.url, { filename: msg.filename, referrer: msg.referrer, kind: msg.kind }); reply({ ok: true }); }
      catch (e) { reply({ ok: false, error: (await appUp()) ? e.message : "A app VeloDown não está aberta." }); }
      return;
    }
    if (msg.type === "grab-video") { // from the button drawn over a <video>
      const tabId = sender.tab.id, list = await getMedia(tabId);
      const m = msg.src && /^https?:/.test(msg.src) ? { url: msg.src, kind: /\.m3u8/i.test(msg.src) ? "hls" : "file" } : best(list);
      if (!m) return reply({ ok: false, error: "Ainda não foi detetado nenhum vídeo. Dá play primeiro." });
      try { await send(m.url, { filename: safeTitle(sender.tab.title) + ".mp4", referrer: sender.tab.url, kind: m.kind }); reply({ ok: true }); }
      catch (e) { reply({ ok: false, error: (await appUp()) ? e.message : "A app VeloDown não está aberta." }); }
    }
  })();
  return true;
});

const safeTitle = t => (t || "video").replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 120).trim() || "video";
