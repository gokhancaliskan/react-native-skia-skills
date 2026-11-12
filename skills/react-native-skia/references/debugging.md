# Debugging rendering problems

Preserve the failing input, screenshot, platform and version before editing. Use the existing project's reproduction/test commands. Classify evidence using the main skill's four levels.

| Symptom | Investigate first | Minimal discriminating test |
| --- | --- | --- |
| Blank canvas | Zero layout, loading/null assets, clip, opacity, backend availability | Render a solid primitive with measured dimensions |
| Static animation | `.value` read during React render, missing worklet transform, wrong callback runtime | Bind a shared value directly to one supported prop |
| Gesture jumps | Translation vs position, wrong coordinate frame, stale start position | Two consecutive drags plus cancellation |
| Wrong rotation/crop | Origin, radians, transform order, fit/source rect | Draw axes, bounds and a known point |
| Stale picture | Missing cache inputs, mutable dependencies | Change size/theme and compare recorded input keys |
| UI runtime error | Calling JS from worklet, inaccessible native object, plugin/version mismatch | Reduce to one callback and inspect installed exports/config |
| Android-only blank after v3 upgrade | Vulkan 1.1 availability, API level, native rebuild | Compare the device with the v3 requirements; the migration guide documents a GPU availability flag |
| Spikes or memory growth | Recording, image decode, filters, lifecycle | Controlled capture using performance reference |

Run the discriminating test, or ask the user to, before committing to a cause: several rows can produce the same symptom. Do not “fix” all blank canvases with package reinstalls or cache deletion. Read earlier successful build logs before changing native configuration. A JS package upgrade may require a native rebuild; OTA changes cannot replace bundled native code. Match the actual environment (Expo Go, development build or bare React Native).

Snapshot tests need fixed assets, dimensions, fonts and input state. Native GPU/backend output can differ from CanvasKit; establish platform baselines and review differences instead of accepting all goldens. Mocks can validate orchestration but not actual pixels or worklet execution. Preserve accessibility and loading/failure UI while reducing the reproduction.

Sources: [Skia Canvas](https://wcandillon.github.io/react-native-skia/v2/docs/canvas/overview/), [Reanimated troubleshooting](https://docs.swmansion.com/react-native-reanimated/docs/guides/troubleshooting/), [v3 installation](https://wcandillon.github.io/react-native-skia/docs/getting-started/installation/). Diagnostic ordering is heuristic.
