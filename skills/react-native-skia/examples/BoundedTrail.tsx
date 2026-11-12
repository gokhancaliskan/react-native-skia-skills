// Host owns time, visibility and motion preference. Pass a reassigned shared Point.
// This is a small decorative path, not an unbounded particle system or simulator.
import { Canvas, Path, usePathValue } from "@shopify/react-native-skia";
import { useAnimatedReaction, useSharedValue, type SharedValue } from "react-native-reanimated";
import { appendTrail, type Point } from "./geometry";
import { traceTrail } from "./graphics";

export function BoundedTrail({ position, enabled = true }: {
  position: SharedValue<Point>; enabled?: boolean;
}) {
  const points = useSharedValue<Point[]>([]);
  useAnimatedReaction(
    () => ({ point: position.value, enabled }),
    ({ point, enabled: drawing }) => {
      points.value = drawing ? appendTrail(points.value, point, 32) : [];
    }, [enabled, position],
  );
  const path = usePathValue((builder) => {
    "worklet";
    traceTrail(builder, points.value);
  });
  return (
    <Canvas style={{ width: 240, height: 180 }}>
      <Path path={path} style="stroke" strokeWidth={4} strokeCap="round"
        strokeJoin="round" color="#1976d2" />
    </Canvas>
  );
}
