import { Game } from "./game.js";
import { InputManager } from "./input.js";
import { Renderer } from "./renderer.js";

const COLS = 24;
const ROWS = 24;

function requireElement<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

const canvas = requireElement<HTMLCanvasElement>("#board");
const scoreEl = requireElement<HTMLElement>("#score");
const highScoreEl = requireElement<HTMLElement>("#high-score");

const game = new Game(COLS, ROWS, {
  onScoreChange(score, highScore) {
    scoreEl.textContent = String(score);
    highScoreEl.textContent = String(highScore);
  },
  onStateChange(state) {
    canvas.dataset.state = state;
  },
});

const renderer = new Renderer(canvas, game, 26);

new InputManager(canvas, {
  onDirection: (dir) => game.turn(dir),
  onConfirm: () => game.confirm(),
  onPause: () => game.togglePause(),
  onRestart: () => game.restart(),
});

// Deterministic scenes for documentation screenshots: open with ?demo=playing
// or ?demo=gameover. The simulation is frozen so the frame stays stable.
let frozen = false;
const demo = new URLSearchParams(window.location.search).get("demo");
if (demo === "playing" || demo === "gameover") {
  const { applyDemoScene } = await import("./demo.js");
  applyDemoScene(game, demo);
  frozen = true;
}

let last = performance.now();

function frame(now: number): void {
  const dt = (now - last) / 1000;
  last = now;

  if (!frozen) game.update(dt);
  renderer.draw(now);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
