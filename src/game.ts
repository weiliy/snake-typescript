import { Snake } from "./snake.js";
import { Direction, GameState, sameCell, Vec2 } from "./types.js";

export interface GameCallbacks {
  onScoreChange(score: number, highScore: number): void;
  onStateChange(state: GameState): void;
}

const HIGH_SCORE_KEY = "snake.highscore";
const BASE_TICK_MS = 140;
const MIN_TICK_MS = 60;

/** Owns all mutable game state and the rules of Snake. */
export class Game {
  readonly cols: number;
  readonly rows: number;

  private snake!: Snake;
  private food!: Vec2;
  private state: GameState = "ready";
  private score = 0;
  private highScore = 0;
  private accumulator = 0;

  constructor(cols: number, rows: number, private readonly callbacks: GameCallbacks) {
    this.cols = cols;
    this.rows = rows;
    this.highScore = this.loadHighScore();
    this.reset();
    this.callbacks.onScoreChange(this.score, this.highScore);
  }

  getState(): GameState {
    return this.state;
  }

  getScore(): number {
    return this.score;
  }

  getHighScore(): number {
    return this.highScore;
  }

  getFood(): Vec2 {
    return this.food;
  }

  getSnake(): Snake {
    return this.snake;
  }

  getTickMs(): number {
    return this.tickMs();
  }

  /** Route an intended turn into the snake's input queue. */
  turn(dir: Direction): void {
    if (this.state !== "playing") return;
    this.snake.turn(dir);
  }

  /** Space/Enter/tap: start, resume, or restart depending on the state. */
  confirm(): void {
    switch (this.state) {
      case "ready":
        this.setState("playing");
        break;
      case "paused":
        this.setState("playing");
        break;
      case "gameover":
        this.restart();
        break;
      case "playing":
        break;
    }
  }

  togglePause(): void {
    if (this.state === "playing") {
      this.setState("paused");
    } else if (this.state === "paused") {
      this.setState("playing");
    }
  }

  restart(): void {
    this.reset();
    this.setState("playing");
  }

  /** Advance the simulation by `dtSeconds`, consuming whole ticks. */
  update(dtSeconds: number): void {
    if (this.state !== "playing") return;

    const dt = Math.min(dtSeconds, 0.25);
    this.accumulator += dt;
    const tick = this.tickMs() / 1000;
    while (this.accumulator >= tick) {
      this.accumulator -= tick;
      this.step();
      if (this.state !== "playing") {
        this.accumulator = 0;
        break;
      }
    }
  }

  private step(): void {
    const next = this.snake.peekNext();
    const grow = sameCell(next, this.food);

    const hitWall =
      next.x < 0 || next.x >= this.cols || next.y < 0 || next.y >= this.rows;
    if (hitWall || this.snake.covers(next, !grow)) {
      this.end();
      return;
    }

    this.snake.advance(grow);
    if (!grow) return;

    this.score += 1;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
    this.spawnFood();
    this.callbacks.onScoreChange(this.score, this.highScore);
  }

  private end(): void {
    this.saveHighScore();
    this.setState("gameover");
  }

  private reset(): void {
    const midY = Math.floor(this.rows / 2);
    this.snake = new Snake({ x: 4, y: midY }, 4, "right");
    this.score = 0;
    this.accumulator = 0;
    this.spawnFood();
    this.callbacks.onScoreChange(this.score, this.highScore);
  }

  private setState(state: GameState): void {
    if (this.state === state) return;
    this.state = state;
    this.callbacks.onStateChange(state);
  }

  private tickMs(): number {
    const level = Math.floor(this.score / 5);
    return Math.max(MIN_TICK_MS, BASE_TICK_MS - level * 10);
  }

  /** Place food on a random free cell. */
  private spawnFood(): void {
    const free: Vec2[] = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (!this.snake.covers({ x, y }, false)) free.push({ x, y });
      }
    }
    if (free.length === 0) {
      this.end();
      return;
    }
    this.food = free[Math.floor(Math.random() * free.length)];
  }

  private loadHighScore(): number {
    try {
      const raw = window.localStorage.getItem(HIGH_SCORE_KEY);
      return raw ? Number.parseInt(raw, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  private saveHighScore(): void {
    try {
      window.localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
    } catch {
      /* storage may be unavailable; scores stay in-memory */
    }
  }
}
