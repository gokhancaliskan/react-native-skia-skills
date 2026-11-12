// Trim animation avoids per-frame topology reconstruction. Same pins as README.md.
import { useEffect, useMemo } from "react";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { cancelAnimation, ReduceMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { buildRevealPath } from "./graphics";

export function PathReveal({ visible = true }: { visible?: boolean }) {
  const path = useMemo(() => buildRevealPath(Skia), []);
  const end = useSharedValue(0);
  useEffect(() => {
    end.value = withTiming(visible ? 1 : 0, {
      duration: 700, reduceMotion: ReduceMotion.System,
    });
    return () => cancelAnimation(end);
  }, [end, visible]);
  return (
    <Canvas style={{ width: 240, height: 112 }}>
      <Path path={path} start={0} end={end} style="stroke"
        strokeWidth={4} strokeCap="round" color="#1976d2" />
    </Canvas>
  );
}
