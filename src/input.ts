import { Direction } from "./types.js";

export interface InputHandlers {
  onDirection(dir: Direction): void;
  onConfirm(): void;
  onPause(): void;
  onRestart(): void;
}

const DIRECTION_KEYS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
  W: "up",
  A: "left",
  S: "down",
  D: "right",
};

/**
 * Translates keyboard and touch input into game actions.
 * Arrow keys are swallowed so the page never scrolls while playing.
 */
export class InputManager {
  private touchStart: { x: number; y: number } | null = null;
  private readonly target: HTMLElement;

  constructor(target: HTMLElement, private readonly handlers: InputHandlers) {
    this.target = target;
    window.addEventListener("keydown", this.onKeyDown);
    target.addEventListener("touchstart", this.onTouchStart, { passive: true });
    target.addEventListener("touchend", this.onTouchEnd, { passive: true });
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    const dir = DIRECTION_KEYS[event.key];
    if (dir) {
      event.preventDefault();
      this.handlers.onDirection(dir);
      return;
    }

    switch (event.key) {
      case " ":
      case "Enter":
        event.preventDefault();
        this.handlers.onConfirm();
        break;
      case "p":
      case "P":
        event.preventDefault();
        this.handlers.onPause();
        break;
      case "r":
      case "R":
        event.preventDefault();
        this.handlers.onRestart();
        break;
    }
  };

  private onTouchStart = (event: TouchEvent): void => {
    const touch = event.changedTouches[0];
    this.touchStart = { x: touch.clientX, y: touch.clientY };
  };

  private onTouchEnd = (event: TouchEvent): void => {
    if (!this.touchStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - this.touchStart.x;
    const dy = touch.clientY - this.touchStart.y;
    this.touchStart = null;

    const threshold = 24;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
      this.handlers.onConfirm();
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      this.handlers.onDirection(dx > 0 ? "right" : "left");
    } else {
      this.handlers.onDirection(dy > 0 ? "down" : "up");
    }
  };

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    this.target.removeEventListener("touchstart", this.onTouchStart);
    this.target.removeEventListener("touchend", this.onTouchEnd);
  }
}
