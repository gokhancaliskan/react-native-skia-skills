// A picture caches commands, not the rasterized pixels. No cross-runtime cache.
import { useMemo } from "react";
import { Canvas, Picture, Skia, createPicture, rect } from "@shopify/react-native-skia";
import { drawGrid } from "./graphics";

export function StaticGrid({ width = 240, height = 160, color = "#c5d4e3" }) {
  const valid = Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
  const picture = useMemo(() => valid
    ? createPicture((canvas) => drawGrid(Skia, canvas, width, height, color), rect(0, 0, width, height))
    : null, [valid, width, height, color]);
  if (!valid) return null;
  return (
    <Canvas style={{ width, height }}>
      {picture ? <Picture picture={picture} /> : null}
    </Canvas>
  );
}
