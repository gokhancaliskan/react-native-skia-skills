// Receives a loaded image; no asset downloads or cross-runtime texture creation.
import { useMemo } from "react";
import { Atlas, Canvas, Skia, type SkImage } from "@shopify/react-native-skia";
import { buildSpriteGrid } from "./graphics";

export function RepeatedSprites({ image }: { image: SkImage | null }) {
  const width = image?.width() ?? 0;
  const height = image?.height() ?? 0;
  const { sprites, transforms } = useMemo(
    () => buildSpriteGrid(Skia, width, height), [width, height],
  );
  return (
    <Canvas style={{ width: 228, height: 172 }}>
      {image && sprites.length > 0
        ? <Atlas image={image} sprites={sprites} transforms={transforms} />
        : null}
    </Canvas>
  );
}
