// Frame-accurate render: drives window.renderAt(t), pipes PNG frames to ffmpeg (video only). Audio is mixed separately by mix.sh.
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");
const FPS = 30;
(async () => {
  const out = process.argv[2] || "video_noaudio.mp4";
  const only = process.argv[3] ? process.argv[3].split(",").map(Number) : null; // preview: list of times
  const tl = JSON.parse(fs.readFileSync(path.join(__dirname, "timeline.json"), "utf8"));
  const imgs = fs.readdirSync(path.join(__dirname, "assets/img")).filter(f => f.endsWith(".jpg") && fs.statSync(path.join(__dirname, "assets/img", f)).size > 0).map(f => f.replace(".jpg", ""));
  const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto("file://" + path.join(__dirname, "index.html"));
  await page.evaluate(([tl, imgs]) => window.setup(tl, imgs), [tl, imgs]);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  if (only) {
    for (const t of only) { await page.evaluate(t => window.renderAt(t), t); await page.screenshot({ path: `${out}_${t}.png` }); }
    await browser.close(); return;
  }
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", "-preset", "medium", out], { stdio: ["pipe", "inherit", "inherit"] });
  const frames = Math.ceil(tl.total * FPS);
  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => window.renderAt(t), i / FPS);
    const buf = await page.screenshot({ type: "jpeg", quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
    if (i % 300 === 0) console.log(`frame ${i}/${frames}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on("close", r)); await browser.close(); console.log("done", out);
})();
