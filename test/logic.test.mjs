// Headless tests for the game rules. Run with: npm test
// Requires a build first (npm run build), since it imports from dist/.
globalThis.window = {
  localStorage: {
    store: {},
    getItem(key) {
      return this.store[key] ?? null;
    },
    setItem(key, value) {
      this.store[key] = value;
    },
  },
};

const { Snake } = await import("../dist/snake.js");
const { Game } = await import("../dist/game.js");

let pass = 0;
let fail = 0;
const ok = (condition, message) => {
  if (condition) pass++;
  else {
    fail++;
    console.log("FAIL:", message);
  }
};

// --- Snake mechanics ---
const s = new Snake({ x: 4, y: 5 }, 4, "right");
ok(s.length === 4, "initial length");
ok(s.head.x === 4 && s.head.y === 5, "head start");
s.advance(false);
ok(s.length === 4 && s.head.x === 5, "moves without growing");
s.advance(true);
ok(s.length === 5, "grows when eating");

const s2 = new Snake({ x: 5, y: 5 }, 3, "right");
s2.turn("left"); // 180° reversal must be ignored
s2.advance(false);
ok(s2.head.x === 6, "reversal blocked");

const s3 = new Snake({ x: 5, y: 5 }, 3, "right");
s3.turn("up");
s3.turn("left");
s3.advance(false);
ok(s3.head.y === 4, "queued turn 1 = up");
s3.advance(false);
ok(s3.head.x === 4, "queued turn 2 = left");

const s4 = new Snake({ x: 5, y: 5 }, 4, "up");
ok(s4.covers({ x: 5, y: 8 }, true) === false, "tail ignored when not growing");
ok(s4.covers({ x: 5, y: 8 }, false) === true, "tail counts when growing");

// --- Game rules ---
const g = new Game(10, 10, { onScoreChange() {}, onStateChange() {} });
ok(g.getState() === "ready", "starts ready");
g.confirm();
ok(g.getState() === "playing", "confirm starts the game");
for (let i = 0; i < 20; i++) g.update(0.2);
ok(g.getState() === "gameover", "wall collision ends the game");

const g2 = new Game(10, 10, { onScoreChange() {}, onStateChange() {} });
g2.confirm();
const before = g2.getSnake().length;
const head = g2.getSnake().head;
g2.food = { x: head.x + 1, y: head.y }; // place food directly ahead
g2.update(1);
ok(g2.getScore() === 1, "score increments on eat");
ok(g2.getSnake().length === before + 1, "snake grows on eat");
ok(
  !(g2.getFood().x === head.x + 1 && g2.getFood().y === head.y),
  "food respawns elsewhere",
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
