# Gestures and interactions

Identify Gesture Handler's installed major first. The example uses the v3 `usePanGesture` hook; v2 projects use their versioned builder API. Do not migrate all gesture code to integrate one Skia interaction. Ensure the existing `GestureHandlerRootView` contains the detector and its actual native child. A detector is not a canvas hit-testing engine.

For a drag, capture the starting object position on gesture begin, then add translation. Assigning translation directly to absolute position causes jumps on subsequent drags. Use finalization to clean up even after cancellation. Clamp against dimensions in the same coordinate space, accounting for object radius and zoom. Test multiple consecutive drags, interrupted gestures, scroll competition and multi-touch; one successful drag proves little.

Gesture coordinates can be detector-local or absolute. A transformed canvas does not automatically transform gesture coordinates into world space. Apply the inverse camera/layout transform before hit-testing. Keep hit targets usable even when visual marks are tiny. A viewport overlay can provide accessible native controls for canvas elements.

UI-runtime callbacks can update shared values when configured with compatible Reanimated/Worklets. Confirm actual execution mode before calling JS callbacks. Keep durable app state updates at meaningful boundaries such as drag completion. Do not bridge on every movement unless the feature needs it and the cost is acceptable.

The [DragMarker](../examples/DragMarker.tsx) example uses a fixed viewport with no camera. For zoom/pan, reuse the tested pure mapping in [geometry](../examples/geometry.ts). Pointer behavior on web, platform multi-touch behavior and gesture composition need integration tests.

Sources: [Gesture Handler setup](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/getting-started/), [v3 pan gesture](https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/use-pan-gesture/), [Skia gestures](https://wcandillon.github.io/react-native-skia/v2/docs/animations/gestures/).
