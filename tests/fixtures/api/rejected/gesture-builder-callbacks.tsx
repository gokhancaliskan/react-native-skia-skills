// Gesture Handler 3 hooks take onActivate/onDeactivate, not the builder API's onStart/onEnd.
// expect: TS2353 'onStart'
import { usePanGesture } from "react-native-gesture-handler";

export function useLegacyNames() {
  return usePanGesture({
    onStart: () => {
      "worklet";
    },
  });
}
