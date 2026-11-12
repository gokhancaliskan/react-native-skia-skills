// Gesture Handler 3.5.0 hook API. Put under the application's GestureHandlerRootView.
// Whole viewport acts as a relative drag pad; it does not hit-test the marker.
import { View } from "react-native";
import { Canvas, Circle } from "@shopify/react-native-skia";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";

export function DragMarker() {
  const x = useSharedValue(120);
  const y = useSharedValue(90);
  const start = useSharedValue({ x: 120, y: 90 });
  const held = useSharedValue(0.7);
  const pan = usePanGesture({
    onBegin: () => {
      "worklet";
      start.value = { x: x.value, y: y.value };
      held.value = 1;
    },
    onUpdate: (event) => {
      "worklet";
      x.value = Math.max(16, Math.min(224, start.value.x + event.translationX));
      y.value = Math.max(16, Math.min(164, start.value.y + event.translationY));
    },
    onFinalize: () => {
      "worklet";
      held.value = 0.7;
    },
  });
  return (
    <GestureDetector gesture={pan}>
      <View collapsable={false} style={{ width: 240, height: 180 }}>
        <Canvas style={{ flex: 1 }}>
          <Circle cx={x} cy={y} r={16} color="#1976d2" opacity={held} />
        </Canvas>
      </View>
    </GestureDetector>
  );
}
