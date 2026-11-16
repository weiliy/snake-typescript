import { Game } from "./game.js";
import { Snake } from "./snake.js";
import { Direction, GameState, Vec2 } from "./types.js";

export type DemoScreen = "playing" | "gameover";

interface GameInternals {
  snake: Snake;
  food: Vec2;
  score: number;
  highScore: number;
  state: GameState;
  callbacks: { onScoreChange(score: number, highScore: number): void };
}

interface SnakeInternals {
  segments: Vec2[];
  direction: Direction;
}

/** A hand-authored, head-first snake path that reads well in a screenshot. */
const PATH: Vec2[] = [
  { x: 16, y: 8 },
  { x: 15, y: 8 },
  { x: 14, y: 8 },
  { x: 13, y: 8 },
  { x: 12, y: 8 },
  { x: 11, y: 8 },
  { x: 11, y: 9 },
  { x: 11, y: 10 },
  { x: 11, y: 11 },
  { x: 12, y: 11 },
  { x: 13, y: 11 },
  { x: 14, y: 11 },
  { x: 15, y: 11 },
  { x: 15, y: 12 },
  { x: 15, y: 13 },
  { x: 14, y: 13 },
  { x: 13, y: 13 },
  { x: 12, y: 13 },
  { x: 11, y: 13 },
];

const FOOD: Vec2 = { x: 19, y: 5 };

/**
 * Replaces the live game with a fixed scene so documentation screenshots are
 * reproducible. Only loaded when the page is opened with `?demo=...`.
 */
export function applyDemoScene(game: Game, screen: DemoScreen): void {
  const g = game as unknown as GameInternals;

  const snake = new Snake(PATH[0], 1, "right");
  const internals = snake as unknown as SnakeInternals;
  internals.segments = PATH.map((p) => ({ ...p }));
  internals.direction = "right";

  g.snake = snake;
  g.food = { ...FOOD };
  g.score = 42;
  g.highScore = screen === "gameover" ? 42 : 87;
  g.state = screen;
  g.callbacks.onScoreChange(g.score, g.highScore);
}
