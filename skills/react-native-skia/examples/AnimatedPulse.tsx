// Pins and native setup: README.md. A finite attention pulse; no perpetual idle loop.
import { useEffect } from "react";
import { Canvas, Circle } from "@shopify/react-native-skia";
import {
  cancelAnimation, ReduceMotion, useDerivedValue, useReducedMotion,
  useSharedValue, withSequence, withTiming,
} from "react-native-reanimated";

export function AnimatedPulse({ active = true }: { active?: boolean }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const radius = useDerivedValue(() => 18 + progress.value * 12);
  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    if (active && !reducedMotion) {
      progress.value = withSequence(
        withTiming(1, { duration: 350, reduceMotion: ReduceMotion.System }),
        withTiming(0, { duration: 350, reduceMotion: ReduceMotion.System }),
      );
    }
    return () => cancelAnimation(progress);
  }, [active, progress, reducedMotion]);
  return (
    <Canvas style={{ width: 96, height: 96 }}>
      <Circle cx={48} cy={48} r={radius} color="#1976d2" />
    </Canvas>
  );
}
