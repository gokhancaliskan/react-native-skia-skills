// Arithmetic checks for the pure helpers. Inputs are synthetic; nothing here is a device measurement.
import assert from "node:assert/strict";
import test from "node:test";
import { summarizeFrames } from "../skills/react-native-skia/examples/frame-metrics.ts";
import { appendTrail, screenToWorld, worldToScreen } from "../skills/react-native-skia/examples/geometry.ts";

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≉ ${expected}`);

test("camera mapping follows screen = (world - camera) * zoom + offset", () => {
  const camera = { x: 100, y: -40, zoom: 2, offsetX: 180, offsetY: 320 };
  assert.deepEqual(worldToScreen({ x: 100, y: -40 }, camera), { x: 180, y: 320 });
  assert.deepEqual(worldToScreen({ x: 110, y: -45 }, camera), { x: 200, y: 310 });
  assert.deepEqual(screenToWorld({ x: 200, y: 310 }, camera), { x: 110, y: -45 });
});

test("screenToWorld inverts worldToScreen across zoom levels", () => {
  for (const zoom of [0.25, 1, 3.5]) {
    const camera = { x: -12.5, y: 80, zoom, offsetX: 195, offsetY: 422 };
    for (const point of [{ x: 0, y: 0 }, { x: -300.25, y: 41 }, { x: 1e4, y: -1e4 }]) {
      const back = screenToWorld(worldToScreen(point, camera), camera);
      close(back.x, point.x);
      close(back.y, point.y);
    }
  }
});

test("a dragged screen delta maps to a world delta divided by zoom", () => {
  const camera = { x: 5, y: 5, zoom: 4, offsetX: 0, offsetY: 0 };
  const a = screenToWorld({ x: 40, y: 40 }, camera);
  const b = screenToWorld({ x: 60, y: 20 }, camera);
  close(b.x - a.x, 5);
  close(b.y - a.y, -5);
});

test("appendTrail keeps the newest points within capacity without mutating its input", () => {
  const original = Object.freeze([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }]);
  const next = appendTrail(original, { x: 3, y: 3 }, 3);
  assert.deepEqual(next, [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }]);
  assert.equal(original.length, 3);
  assert.notEqual(next, original);

  let trail = [];
  for (let i = 0; i < 1000; i++) trail = appendTrail(trail, { x: i, y: -i }, 32);
  assert.equal(trail.length, 32);
  assert.deepEqual(trail[0], { x: 968, y: -968 });
  assert.deepEqual(trail[31], { x: 999, y: -999 });
});

test("appendTrail copies the appended point", () => {
  const point = { x: 1, y: 2 };
  const trail = appendTrail([], point, 4);
  point.x = 50;
  assert.deepEqual(trail, [{ x: 1, y: 2 }]);
});

test("appendTrail skips repeated and non-finite points", () => {
  const trail = [{ x: 1, y: 1 }, { x: 2, y: 2 }];
  assert.deepEqual(appendTrail(trail, { x: 2, y: 2 }, 8), trail);
  assert.deepEqual(appendTrail(trail, { x: Number.NaN, y: 0 }, 8), trail);
  assert.deepEqual(appendTrail(trail, { x: 0, y: Number.POSITIVE_INFINITY }, 8), trail);
  assert.notEqual(appendTrail(trail, { x: 2, y: 2 }, 8), trail, "still returns a fresh array");
  assert.deepEqual(appendTrail(trail, { x: 2, y: 2 }, 1), [{ x: 2, y: 2 }], "a repeat still honours a smaller capacity");
});

test("appendTrail handles boundary capacities", () => {
  const trail = [{ x: 1, y: 1 }, { x: 2, y: 2 }];
  assert.deepEqual(appendTrail(trail, { x: 3, y: 3 }, 1), [{ x: 3, y: 3 }]);
  assert.deepEqual(appendTrail(trail, { x: 3, y: 3 }, 2.9), [{ x: 2, y: 2 }, { x: 3, y: 3 }], "fractional capacity floors");
  for (const capacity of [0, -1, 0.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.deepEqual(appendTrail(trail, { x: 3, y: 3 }, capacity), [], `capacity ${capacity}`);
  }
});

test("summarizeFrames uses nearest-rank quantiles and a strict over-budget comparison", () => {
  const intervals = [16, 17, 16, 33, 16, 16, 18, 16, 50, 16];
  const copy = [...intervals];
  const summary = summarizeFrames(intervals, 60);
  assert.deepEqual(intervals, copy, "input order is preserved");
  assert.equal(summary.samples, 10);
  close(summary.budgetMs, 1000 / 60);
  assert.equal(summary.medianMs, 16);
  assert.equal(summary.p95Ms, 50);
  assert.equal(summary.maxMs, 50);
  close(summary.overBudgetFraction, 0.4);
});

test("summarizeFrames treats an interval equal to the budget as within budget", () => {
  const summary = summarizeFrames([10, 10, 10, 10.001], 100);
  assert.equal(summary.budgetMs, 10);
  assert.equal(summary.overBudgetFraction, 0.25);
});

test("summarizeFrames handles a single sample and a twenty-sample tail", () => {
  assert.deepEqual(summarizeFrames([8], 120), {
    samples: 1, budgetMs: 1000 / 120, medianMs: 8, p95Ms: 8, maxMs: 8, overBudgetFraction: 0,
  });
  const twenty = Array.from({ length: 20 }, (_, i) => i + 1);
  const summary = summarizeFrames(twenty, 60);
  assert.equal(summary.medianMs, 10);
  assert.equal(summary.p95Ms, 19, "nearest rank: ceil(0.95 × 20) = 19th value");
  assert.equal(summary.maxMs, 20);
});

test("summarizeFrames rejects captures it cannot summarize honestly", () => {
  for (const intervals of [[], [16, Number.NaN], [16, 0], [16, -1], [Number.POSITIVE_INFINITY]]) {
    assert.throws(() => summarizeFrames(intervals, 60), RangeError, JSON.stringify(intervals));
  }
  for (const refreshHz of [0, -60, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => summarizeFrames([16], refreshHz), RangeError, `refreshHz ${refreshHz}`);
  }
});
