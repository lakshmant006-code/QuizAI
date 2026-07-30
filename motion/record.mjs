import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(ROOT, "quizai-motion.html");
const FRAMES = path.join(ROOT, "frames");
const OUT = path.join(ROOT, "quizai-motion.mp4");
const FPS = 30;
const WIDTH = 1280;
const HEIGHT = 720;

fs.rmSync(FRAMES, { recursive: true, force: true });
fs.mkdirSync(FRAMES, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
});

await page.goto(pathToFileURL(HTML).href, { waitUntil: "networkidle" });
await page.waitForFunction(() => typeof window.__seek === "function");

const duration = await page.evaluate(() => window.__DURATION);
const total = Math.round(duration * FPS);
console.log(`Recording ${total} frames @ ${FPS}fps (${duration}s)`);

for (let i = 0; i < total; i++) {
  const t = i / FPS;
  await page.evaluate((time) => window.__seek(time), t);
  const file = path.join(FRAMES, `frame_${String(i).padStart(4, "0")}.png`);
  await page.screenshot({ path: file, type: "png" });
  if (i % 30 === 0) console.log(`  frame ${i}/${total}`);
}

await browser.close();

// Use relative paths + cwd so spaces in absolute path never break argv
console.log("Encoding MP4…");
const result = spawnSync(
  "ffmpeg",
  [
    "-y",
    "-framerate", String(FPS),
    "-i", "frames/frame_%04d.png",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "18",
    "-movflags", "+faststart",
    "quizai-motion.mp4",
  ],
  { stdio: "inherit", cwd: ROOT, shell: false }
);

if (result.status !== 0) {
  console.error("ffmpeg failed; leaving frames in", FRAMES);
  process.exit(result.status || 1);
}

fs.rmSync(FRAMES, { recursive: true, force: true });
console.log("Wrote", OUT);
