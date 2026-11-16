export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export type Direction = "up" | "down" | "left" | "right";

export type GameState = "ready" | "playing" | "paused" | "gameover";

export const DELTAS: Record<Direction, Vec2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function isOpposite(a: Direction, b: Direction): boolean {
  return DELTAS[a].x + DELTAS[b].x === 0 && DELTAS[a].y + DELTAS[b].y === 0;
}

export function sameCell(a: Vec2, b: Vec2): boolean {
  return a.x === b.x && a.y === b.y;
}
