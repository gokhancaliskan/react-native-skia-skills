// CanvasKit (CPU, WebAssembly) rendering checks for the shader and geometry the examples ship.
// These establish drawing correctness on one backend. They are not native GPU or timing evidence.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test, { before } from "node:test";
import { createElement as h } from "react";
import { appendTrail } from "../skills/react-native-skia/examples/geometry.ts";
import {
  buildRevealPath, buildSpriteGrid, drawGrid, glowSource, traceTrail,
} from "../skills/react-native-skia/examples/graphics.ts";

const require = createRequire(import.meta.url);
const { LoadSkiaWeb } = require("@shopify/react-native-skia/lib/commonjs/web/LoadSkiaWeb");
const headless = require("@shopify/react-native-skia/lib/commonjs/headless");
const { Atlas, Fill, Path, Picture, Shader, AlphaType, ColorType } = headless;

let Skia;
before(async () => {
  await LoadSkiaWeb();
  ({ Skia } = headless.getSkiaExports());
});

function grab(image) {
  const width = image.width();
  const height = image.height();
  const data = image.readPixels(0, 0, {
    width, height, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul,
  });
  assert.ok(data, "pixel readback failed");
  return {
    width, height, data,
    at: (x, y) => Array.from(data.slice((y * width + x) * 4, (y * width + x) * 4 + 4)),
    painted: () => {
      let count = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
      return count;
    },
  };
}

async function render(width, height, element) {
  const surface = headless.makeOffscreenSurface(width, height);
  return grab(await headless.drawOffscreen(surface, element));
}

function paintDirect(width, height, draw) {
  const surface = headless.makeOffscreenSurface(width, height);
  draw(surface.getCanvas());
  surface.flush();
  return grab(surface.makeImageSnapshot());
}

function near(actual, expected, tolerance, label) {
  actual.forEach((value, i) => {
    assert.ok(Math.abs(value - expected[i]) <= tolerance, `${label}: got ${actual}, expected ${expected} ±${tolerance}`);
  });
}

test("glow shader compiles and draws the documented centre and edge colours", async () => {
  const effect = Skia.RuntimeEffect.Make(glowSource);
  assert.ok(effect, "shipped SkSL must compile");
  const image = await render(240, 160, h(Fill, { color: "#14204d" },
    h(Shader, { source: effect, uniforms: { resolution: [240, 160] } })));
  near(image.at(120, 80), [77, 179, 77, 255], 2, "centre");
  near(image.at(0, 0), [20, 31, 77, 255], 2, "corner");
  near(image.at(239, 159), [20, 31, 77, 255], 2, "opposite corner");
  let previous = 255;
  for (let x = 120; x < 240; x += 8) {
    const green = image.at(x, 80)[1];
    assert.ok(green <= previous, `green must not increase away from the centre (x=${x})`);
    previous = green;
  }
  near(image.at(100, 80), image.at(139, 80), 1, "horizontal symmetry");
});

test("glow shader stays finite with a zero resolution uniform", async () => {
  const effect = Skia.RuntimeEffect.Make(glowSource);
  const image = await render(16, 16, h(Fill, null,
    h(Shader, { source: effect, uniforms: { resolution: [0, 0] } })));
  assert.equal(image.at(8, 8)[3], 255);
});

test("invalid SkSL is detectable and the fallback fill matches the glow's outer colour", async () => {
  let broken = null;
  try {
    broken = Skia.RuntimeEffect.Make("half4 main(float2 p) { return missingSymbol; }");
  } catch {
    broken = null;
  }
  assert.equal(broken, null, "a compile failure must not yield an effect");
  const fallback = await render(8, 8, h(Fill, { color: "#14204d" }));
  near(fallback.at(4, 4), [20, 32, 77, 255], 0, "fallback colour");
});

test("reveal path has the documented immutable geometry", () => {
  const path = buildRevealPath(Skia);
  assert.equal(path.isEmpty(), false);
  assert.equal(typeof path.moveTo, "undefined", "built paths expose no mutators");
  const bounds = path.computeTightBounds();
  near([bounds.x, bounds.y, bounds.width, bounds.height], [12, 20, 216, 72], 0.01, "tight bounds");
  const last = path.getLastPt();
  near([last.x, last.y], [228, 92], 0, "last point");
  const first = path.getPoint(0);
  near([first.x, first.y], [12, 92], 0, "first point");
});

test("trimming the reveal path exposes it progressively from its start", async () => {
  const path = buildRevealPath(Skia);
  const draw = (end) => render(240, 112, h(Path, {
    path, start: 0, end, style: "stroke", strokeWidth: 4, strokeCap: "round", color: "#1976d2",
  }));
  const counts = [];
  for (const end of [0.25, 0.5, 0.75, 1]) {
    const image = await draw(end);
    counts.push(image.painted());
    assert.equal(image.at(13, 92)[3], 255, `start is visible at end=${end}`);
    assert.equal(image.at(226, 92)[3] > 0, end === 1, `far end visibility at end=${end}`);
  }
  for (let i = 1; i < counts.length; i++) assert.ok(counts[i] > counts[i - 1], `painted area grows: ${counts}`);
  near((await draw(1)).at(128, 20), [25, 118, 210, 255], 1, "stroke colour at the crest");
});

test("grid picture replays identically and matches direct drawing", async () => {
  const record = (width, height, color) => {
    const recorder = Skia.PictureRecorder();
    drawGrid(Skia, recorder.beginRecording(Skia.XYWHRect(0, 0, width, height)), width, height, color);
    return recorder.finishRecordingAsPicture();
  };
  const picture = record(240, 160, "#c5d4e3");
  const first = paintDirect(240, 160, (canvas) => canvas.drawPicture(picture));
  const second = paintDirect(240, 160, (canvas) => canvas.drawPicture(picture));
  const direct = paintDirect(240, 160, (canvas) => drawGrid(Skia, canvas, 240, 160, "#c5d4e3"));
  const component = await render(240, 160, h(Picture, { picture }));
  assert.deepEqual(second.data, first.data, "replaying one picture is deterministic");
  assert.deepEqual(direct.data, first.data, "replay equals direct drawing");
  assert.deepEqual(component.data, first.data, "the Picture component draws the same pixels");

  near(first.at(0, 12), [197, 212, 227, 255], 1, "first vertical line");
  near(first.at(24, 12), [197, 212, 227, 255], 1, "second vertical line");
  assert.equal(first.at(12, 12)[3], 0, "cell interior stays transparent");
  const columns = Array.from({ length: 240 }, (_, x) => first.at(x, 12)[3] > 0).filter(Boolean).length;
  const rows = Array.from({ length: 160 }, (_, y) => first.at(12, y)[3] > 0).filter(Boolean).length;
  assert.deepEqual([columns, rows], [10, 7], "line counts for 240×160 at a 24 unit pitch");

  const recoloured = paintDirect(240, 160, (canvas) => canvas.drawPicture(record(240, 160, "#ff0000")));
  near(recoloured.at(0, 12), [255, 0, 0, 255], 1, "a new colour needs a new recording");
  const resized = paintDirect(120, 80, (canvas) => canvas.drawPicture(record(120, 80, "#c5d4e3")));
  assert.equal(Array.from({ length: 120 }, (_, x) => resized.at(x, 12)[3] > 0).filter(Boolean).length, 5);
});

test("sprite grid places aspect-preserving copies through Atlas", async () => {
  const bytes = new Uint8Array(4 * 2 * 4);
  for (let i = 0; i < 8; i++) bytes.set(i % 4 < 2 ? [255, 0, 0, 255] : [0, 0, 255, 255], i * 4);
  const image = Skia.Image.MakeImage(
    { width: 4, height: 2, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul },
    Skia.Data.fromBytes(bytes), 16,
  );
  assert.ok(image);
  const { sprites, transforms } = buildSpriteGrid(Skia, image.width(), image.height());
  assert.equal(sprites.length, 48);
  assert.equal(transforms.length, 48);
  const tenth = transforms[9];
  near([tenth.scos, tenth.ssin, tenth.tx, tenth.ty], [5, 0, 32, 32], 0, "transform of the tenth sprite");

  const output = await render(228, 172, h(Atlas, { image, sprites, transforms }));
  near(output.at(6, 6), [255, 0, 0, 255], 1, "left half of the first copy");
  near(output.at(21, 12), [0, 0, 255, 255], 1, "right half of the first copy");
  assert.equal(output.at(26, 8)[3], 0, "gap between columns");
  assert.equal(output.at(8, 16)[3], 0, "a 4×2 source keeps its 2:1 aspect ratio");
  near(output.at(202, 146), [255, 0, 0, 255], 1, "last copy");
  assert.equal(output.at(227, 171)[3], 0, "nothing beyond the grid");
  assert.equal(output.painted(), 48 * 20 * 10, "48 copies of 20×10 logical units");
});

test("sprite grid is empty for unusable image sizes", () => {
  for (const [width, height] of [[0, 10], [10, 0], [-4, 4], [Number.NaN, 4]]) {
    const { sprites, transforms } = buildSpriteGrid(Skia, width, height);
    assert.deepEqual([sprites.length, transforms.length], [0, 0], `${width}×${height}`);
  }
});

test("trail tracing builds a bounded polyline", () => {
  const empty = Skia.PathBuilder.Make();
  traceTrail(empty, []);
  traceTrail(empty, [{ x: 4, y: 4 }]);
  assert.equal(empty.build().isEmpty(), true, "fewer than two points draw nothing");

  let history = [];
  for (let i = 0; i < 100; i++) history = appendTrail(history, { x: i, y: i * 2 }, 32);
  const builder = Skia.PathBuilder.Make();
  traceTrail(builder, history);
  const path = builder.build();
  assert.equal(path.countPoints(), 32);
  const last = path.getLastPt();
  near([last.x, last.y], [99, 198], 0, "newest point ends the trail");
  const first = path.getPoint(0);
  near([first.x, first.y], [68, 136], 0, "oldest retained point starts it");
});
