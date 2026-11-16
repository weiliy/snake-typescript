import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)));
const START_PORT = Number(process.env.PORT) || 5173;
const MAX_PORT_ATTEMPTS = 10;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const relative = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = join(ROOT, normalize(relative));

    // Prevent path traversal outside the project root.
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    const body = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": MIME[extname(filePath)] ?? "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found. Did you run `npm run build`?");
  }
});

let currentPort = START_PORT;

server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && !process.env.PORT) {
    const next = currentPort + 1;
    if (next < START_PORT + MAX_PORT_ATTEMPTS) {
      console.warn(`Port ${currentPort} in use, trying ${next}...`);
      currentPort = next;
      server.listen(currentPort);
      return;
    }
  }
  console.error(error.message);
  process.exit(1);
});

server.listen(currentPort, () => {
  console.log(`Snake running at http://localhost:${currentPort}`);
});
