// Shared original geometry/SkSL for components and headless graphics tests.
// Type-only imports keep this module executable in Node with an injected Skia API.
import type { Skia, SkCanvas, SkPathBuilder } from "@shopify/react-native-skia";

export const glowSource = `
uniform float2 resolution;
half4 main(float2 p) {
  float2 uv = (p - resolution * 0.5) / max(resolution.y, 1.0);
  float strength = 1.0 - smoothstep(0.08, 0.48, length(uv));
  return half4(0.08 + 0.22 * strength, 0.12 + 0.58 * strength, 0.3, 1.0);
}`;

export function buildRevealPath(api: typeof Skia) {
  const builder = api.PathBuilder.Make();
  builder.moveTo(12, 92);
  builder.cubicTo(70, 92, 70, 20, 128, 20);
  builder.cubicTo(180, 20, 180, 92, 228, 92);
  return builder.build();
}

export function drawGrid(
  api: typeof Skia, canvas: SkCanvas, width: number, height: number, color: string,
) {
  const paint = api.Paint();
  paint.setColor(api.Color(color));
  paint.setStrokeWidth(1);
  for (let x = 0.5; x < width; x += 24) canvas.drawLine(x, 0, x, height, paint);
  for (let y = 0.5; y < height; y += 24) canvas.drawLine(0, y, width, y, paint);
}

// Source rectangles are in image pixels; transforms place uniformly scaled copies on a grid.
export function buildSpriteGrid(
  api: typeof Skia, imageWidth: number, imageHeight: number,
  count = 48, columns = 8, cell = 28, size = 20,
) {
  if (!(imageWidth > 0) || !(imageHeight > 0)) return { sprites: [], transforms: [] };
  const scale = size / Math.max(imageWidth, imageHeight);
  return {
    sprites: Array.from({ length: count }, () => api.XYWHRect(0, 0, imageWidth, imageHeight)),
    transforms: Array.from({ length: count }, (_, i) =>
      api.RSXform(scale, 0, 4 + (i % columns) * cell, 4 + Math.floor(i / columns) * cell)),
  };
}

// Appends a polyline to a builder owned by the caller; fewer than two points draw nothing.
export function traceTrail(builder: SkPathBuilder, points: readonly { x: number; y: number }[]) {
  "worklet";
  if (points.length < 2) return;
  builder.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) builder.lineTo(points[i].x, points[i].y);
}
