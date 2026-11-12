# Animations and worklets

For the tested Skia 2.14/3.10 integration, pass Reanimated shared/derived values as props: the Skia renderer subscribes directly. `createAnimatedComponent` and `useAnimatedProps` are not required for these Skia nodes. Do not read `.value` in JSX and expect subsequent changes to propagate through a plain number. Use Skia's `interpolateColors` when interpolating Skia colors; Reanimated color storage differs.

Use timing/spring animations for transitions and a frame callback only for continuously evolving state. Group related calculations under a consistent input snapshot. Do not trigger React state updates every frame solely to redraw a canvas. Cancel owned animations on teardown and stop or pause frame work when offscreen/backgrounded. Establish who owns pause/resume instead of creating a second competing clock.

A worklet runs in a separate JS runtime. Auto-workletization depends on the library callback and Babel configuration; explicit `"worklet"` is needed for custom helpers/buffer callbacks where the documented transform expects it. A directive does not make arbitrary closure objects, React hooks, network calls or JS functions safe there. Schedule occasional JS notifications through the installed Worklets/Reanimated API after checking its current name; do not stream every frame across runtimes.

Treat native objects by type and backend. v2 GPU textures have context/thread restrictions. v3 documents shared GPU-backed images, but that is not permission to concurrently mutate paints, builders or recorders. Use documented texture hooks when required, bounded caches and clear ownership. Do not invent manual disposal or force garbage collection on live objects.

Respect system and application motion preferences. `useReducedMotion` reflects the setting at app startup; it is not a live subscription. If live preference changes are required, use the project's accessibility subscription and pass the updated preference into animation policy. Keep important state changes visible without decorative motion.

Frame callbacks report milliseconds and the first delta can be null. Clamp suspension gaps deliberately; dropped simulation time is a behavior decision. See [game development](game-development.md) for fixed steps.

Sources: [Skia animation integration](https://wcandillon.github.io/react-native-skia/v2/docs/animations/animations/), [Worklets](https://docs.swmansion.com/react-native-reanimated/docs/guides/worklets/), [frame callback](https://docs.swmansion.com/react-native-reanimated/docs/advanced/useFrameCallback/), [reduced motion](https://docs.swmansion.com/react-native-reanimated/docs/device/useReducedMotion/), [textures](https://wcandillon.github.io/react-native-skia/v2/docs/animations/textures/).
