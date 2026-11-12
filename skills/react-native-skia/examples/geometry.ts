export type Point = { x: number; y: number };
export type Camera = { x: number; y: number; zoom: number; offsetX: number; offsetY: number };

// Callers must supply finite coordinates and a finite, strictly positive zoom.
export function worldToScreen(point: Point, camera: Camera): Point {
  "worklet";
  return {
    x: (point.x - camera.x) * camera.zoom + camera.offsetX,
    y: (point.y - camera.y) * camera.zoom + camera.offsetY,
  };
}
export function screenToWorld(point: Point, camera: Camera): Point {
  "worklet";
  return {
    x: (point.x - camera.offsetX) / camera.zoom + camera.x,
    y: (point.y - camera.offsetY) / camera.zoom + camera.y,
  };
}

// Small bounded history; array copying is explicit, not an allocation-free claim.
export function appendTrail(points: readonly Point[], point: Point, capacity: number): Point[] {
  "worklet";
  if (!Number.isFinite(capacity) || capacity < 1) return [];
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return points.slice();
  const limit = Math.floor(capacity);
  const previous = points[points.length - 1];
  if (previous && previous.x === point.x && previous.y === point.y) return points.slice(-limit);
  const retained = limit === 1 ? [] : points.slice(-(limit - 1));
  return [...retained, { x: point.x, y: point.y }];
}
