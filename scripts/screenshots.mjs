// Renders the game in headless Chromium and captures documentation screenshots.
// Usage: npm run screenshots   (builds first, serves locally, then captures)
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = resolve(ROOT, "screenshots");

function freePort() {
  return new Promise((resolvePort, reject) => {
    const probe = createServer();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolvePort(port));
    });
  });
}

async function waitForServer(url, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`Server did not start: ${url}`);
}

const SHOTS = [
  { file: "start.png", page: "/" },
  { file: "gameplay.png", page: "/?demo=playing" },
  { file: "gameover.png", page: "/?demo=gameover" },
];

const port = await freePort();
const server = spawn(process.execPath, [resolve(ROOT, "server.mjs")], {
  env: { ...process.env, PORT: String(port) },
  stdio: "ignore",
});

try {
  const base = `http://127.0.0.1:${port}`;
  await waitForServer(`${base}/`);
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 760, height: 1040 },
    deviceScaleFactor: 2,
  });

  for (const shot of SHOTS) {
    await page.goto(`${base}${shot.page}`, { waitUntil: "load" });
    // Give the canvas a couple of frames so fonts and the pulse settle.
    await page.waitForTimeout(500);
    await page.screenshot({
      path: resolve(OUT_DIR, shot.file),
      fullPage: true,
    });
    console.log(`captured screenshots/${shot.file}`);
  }

  // Compact board-only crop, handy as a README hero image.
  await page.goto(`${base}/?demo=playing`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await page.locator(".board-wrap").screenshot({
    path: resolve(OUT_DIR, "board.png"),
  });
  console.log("captured screenshots/board.png");

  await browser.close();
} finally {
  server.kill("SIGTERM");
}
