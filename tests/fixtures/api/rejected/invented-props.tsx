// Plausible-looking props that the pinned components do not declare.
// expect: TS2322 CanvasProps | TS2322 CircleProps | TS2322 BlurImageFilterProps
import { Blur, Canvas, Circle } from "@shopify/react-native-skia";

export function Invented() {
  return (
    <Canvas style={{ flex: 1 }} mode="continuous">
      <Circle cx={8} cy={8} radius={4}>
        <Blur radius={2} />
      </Circle>
    </Canvas>
  );
}
