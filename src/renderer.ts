import { Game } from "./game.js";
import { DELTAS, GameState, Vec2 } from "./types.js";

const COLORS = {
  board: "#0b1020",
  boardAlt: "#0e1428",
  grid: "rgba(148, 163, 184, 0.06)",
  snakeBody: "#22c55e",
  snakeHead: "#4ade80",
  snakeStroke: "#052e16",
  food: "#f97316",
  foodGlow: "rgba(249, 115, 22, 0.35)",
  overlay: "rgba(2, 6, 23, 0.72)",
  text: "#e2e8f0",
  textDim: "#94a3b8",
  accent: "#38bdf8",
};

/** All canvas drawing lives here so game logic stays free of presentation. */
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly cell: number;
  private width = 0;
  private height = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly game: Game,
    cell = 24,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
    this.cell = cell;
    this.resize();
    window.addEventListener("resize", this.resize);
  }

  resize = (): void => {
    const dpr = window.devicePixelRatio || 1;
    this.width = this.game.cols * this.cell;
    this.height = this.game.rows * this.cell;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  draw(timeMs: number): void {
    this.drawBoard();
    this.drawFood(timeMs);
    this.drawSnake();
    this.drawOverlay(this.game.getState());
  }

  private drawBoard(): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.board;
    ctx.fillRect(0, 0, this.width, this.height);

    // Checkerboard for a subtle classic-arcade feel.
    ctx.fillStyle = COLORS.boardAlt;
    for (let y = 0; y < this.game.rows; y++) {
      for (let x = 0; x < this.game.cols; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillRect(x * this.cell, y * this.cell, this.cell, this.cell);
        }
      }
    }
  }

  private drawFood(timeMs: number): void {
    const ctx = this.ctx;
    const food = this.game.getFood();
    const cx = food.x * this.cell + this.cell / 2;
    const cy = food.y * this.cell + this.cell / 2;
    const pulse = 1 + Math.sin(timeMs / 220) * 0.12;
    const radius = this.cell * 0.32 * pulse;

    ctx.save();
    ctx.shadowColor = COLORS.foodGlow;
    ctx.shadowBlur = 18;
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.beginPath();
    ctx.arc(cx - radius * 0.3, cy - radius * 0.3, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawSnake(): void {
    const ctx = this.ctx;
    const snake = this.game.getSnake();
    const body = snake.body;
    const center = (p: Vec2): [number, number] => [
      p.x * this.cell + this.cell / 2,
      p.y * this.cell + this.cell / 2,
    ];

    // Body as a single rounded stroke through every segment centre.
    if (body.length > 1) {
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = COLORS.snakeBody;
      ctx.lineWidth = this.cell * 0.78;
      ctx.beginPath();
      const [hx, hy] = center(body[0]);
      ctx.moveTo(hx, hy);
      for (let i = 1; i < body.length; i++) {
        const [x, y] = center(body[i]);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    this.drawHead(center(snake.head));
  }

  private drawHead([cx, cy]: [number, number]): void {
    const ctx = this.ctx;
    const r = this.cell * 0.42;

    ctx.save();
    ctx.fillStyle = COLORS.snakeHead;
    ctx.strokeStyle = COLORS.snakeStroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - r, cy - r, r * 2, r * 2, r * 0.5);
    ctx.fill();
    ctx.stroke();

    const d = DELTAS[this.game.getSnake().heading];
    // Perpendicular offset places the eyes on either side of the face.
    const px = -d.y;
    const py = d.x;
    const eyeForward = this.cell * 0.16;
    const eyeSide = this.cell * 0.18;
    const eyeR = this.cell * 0.11;

    for (const sign of [-1, 1]) {
      const ex = cx + d.x * eyeForward + px * eyeSide * sign;
      const ey = cy + d.y * eyeForward + py * eyeSide * sign;
      ctx.fillStyle = "#0b1020";
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawOverlay(state: GameState): void {
    if (state === "playing") return;

    const ctx = this.ctx;
    ctx.fillStyle = COLORS.overlay;
    ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const title = {
      ready: "SNAKE",
      paused: "PAUSED",
      gameover: "GAME OVER",
    }[state];

    const subtitle = {
      ready: "Press SPACE or tap to start",
      paused: "Press P to resume",
      gameover: `Score ${this.game.getScore()} · Press SPACE to play again`,
    }[state];

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = COLORS.accent;
    ctx.font = `700 ${Math.round(this.cell * 1.6)}px system-ui, sans-serif`;
    ctx.fillText(title, centerX, this.height / 2 - this.cell);

    ctx.fillStyle = COLORS.text;
    ctx.font = `500 ${Math.round(this.cell * 0.62)}px system-ui, sans-serif`;
    ctx.fillText(subtitle, centerX, this.height / 2 + this.cell * 0.4);

    if (state === "ready") {
      ctx.fillStyle = COLORS.textDim;
      ctx.font = `400 ${Math.round(this.cell * 0.52)}px system-ui, sans-serif`;
      ctx.fillText(
        "Arrow keys / WASD to move",
        centerX,
        this.height / 2 + this.cell * 1.6,
      );
    }
  }

  dispose(): void {
    window.removeEventListener("resize", this.resize);
  }
}
