import { DELTAS, Direction, isOpposite, Vec2 } from "./types.js";

/**
 * The player-controlled snake. The head is always `segments[0]`.
 * Direction changes are queued so rapid key presses are never lost and the
 * snake can never reverse into itself.
 */
export class Snake {
  private segments: Vec2[];
  private direction: Direction;
  private queued: Direction[] = [];

  constructor(start: Vec2, length: number, direction: Direction = "right") {
    this.direction = direction;
    const d = DELTAS[direction];
    this.segments = [];
    for (let i = 0; i < length; i++) {
      this.segments.push({ x: start.x - d.x * i, y: start.y - d.y * i });
    }
  }

  get head(): Vec2 {
    return this.segments[0];
  }

  get body(): readonly Vec2[] {
    return this.segments;
  }

  get length(): number {
    return this.segments.length;
  }

  get heading(): Direction {
    return this.direction;
  }

  /** Queue a turn, ignoring no-ops and 180° reversals. */
  turn(dir: Direction): void {
    const last = this.queued.length
      ? this.queued[this.queued.length - 1]
      : this.direction;
    if (dir === last || isOpposite(last, dir)) return;
    this.queued.push(dir);
  }

  /** Where the head will be after the next tick. */
  peekNext(): Vec2 {
    const dir = this.queued.length ? this.queued[0] : this.direction;
    const d = DELTAS[dir];
    return { x: this.head.x + d.x, y: this.head.y + d.y };
  }

  /**
   * Does `cell` overlap the current body?
   * When the snake is not growing, its tail vacates this tick, so it can be
   * ignored — that makes following your own tail a legal move.
   */
  covers(cell: Vec2, ignoreTail: boolean): boolean {
    const end = ignoreTail ? this.segments.length - 1 : this.segments.length;
    for (let i = 0; i < end; i++) {
      const s = this.segments[i];
      if (s.x === cell.x && s.y === cell.y) return true;
    }
    return false;
  }

  /** Advance one cell. When `grow` is true the tail is kept in place. */
  advance(grow: boolean): void {
    if (this.queued.length) this.direction = this.queued.shift()!;
    const d = DELTAS[this.direction];
    this.segments.unshift({ x: this.head.x + d.x, y: this.head.y + d.y });
    if (!grow) this.segments.pop();
  }
}
