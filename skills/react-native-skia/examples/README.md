# Verifiable examples

These are original components/helpers, not a standalone mobile application. Copy only the relevant files into a compatible app, preserve its imports/setup, and render the exported component from an existing screen. Never install this repository's validation dependencies into the app blindly.

## Assumptions and versions

All TSX examples use scoped Skia **2.14.0**, React **19.3.0**, RN **0.88.1**. The isolated v3 check replaces that import with unscoped Skia **3.10.0** and typechecks the same source. This does not certify native behavior.

Animation examples additionally use Reanimated **4.7.1** / Worklets **0.13.0**, New Architecture and the matching worklet transformation configured by the host. `DragMarker` uses Gesture Handler **3.5.0** and a host `GestureHandlerRootView`. These pins are an intentionally non-Expo harness; see [compatibility](../references/compatibility.md) before adapting to an Expo SDK.

The components have fixed logical viewport sizes except `StaticGrid`. The host owns screen visibility, backgrounding, semantic accessibility and integration tests. `useReducedMotion` is a startup snapshot; add a live application preference if required. Web users must load CanvasKit before importing/using Skia rendering code according to that release's web setup.

## Choose a pattern

| Example | Problem and verification | Trade-off / host responsibility |
| --- | --- | --- |
| [AnimatedPulse](AnimatedPulse.tsx) | Finite emphasis animation; toggle active and unmount mid-animation | Direct shared prop, cleanup; no constant idle loop; startup reduced-motion check |
| [DragMarker](DragMarker.tsx) | Drag twice without jumping; cancel and re-enter; clamp at all edges | Entire 240×180 pad drags; add native accessible controls/hit-testing if appropriate |
| [RepeatedSprites](RepeatedSprites.tsx) | Pass a `useImage` result; verify 48 copies with original aspect ratio | Atlas eligibility is not a measured speedup; parent owns image loading/lifetime; layout comes from `buildSpriteGrid` |
| [PathReveal](PathReveal.tsx) | Toggle visibility; verify continuous trim and round caps | Trimming is not morphing; static geometry retained |
| [RuntimeGlow](RuntimeGlow.tsx) | Inspect center/edge color and compile-failure fallback | Fixed opaque shader; not a density-correct image filter template |
| [StaticGrid](StaticGrid.tsx) | Resize and change color; ensure picture invalidates | Command reuse, not pixel caching; bounded by one component's current inputs |
| [BoundedTrail](BoundedTrail.tsx) | Feed reassigned shared points; inspect bounded history; disable clears it | 32 points, copies arrays; profile before pooling; host disables decorative motion |
| [Performance investigation](performance-investigation.md) | Capture comparable real intervals; use tested statistics | No device timings provided; callback gaps do not isolate GPU cost |

[graphics.ts](graphics.ts) supplies the exact shader, reveal path, grid drawing, sprite layout and trail tracing used by the components and by the repository's CanvasKit tests. [geometry.ts](geometry.ts) supplies camera and trail helpers; [frame-metrics.ts](frame-metrics.ts) handles measurement summaries. These helpers take the `Skia` object as an argument or need none, so they run in Node without loading native React Native modules.

In the source repository, `npm run check` covers structure, example types, arithmetic, negative API checks and CanvasKit drawing tests, and `npm run check:v3` runs the isolated import-rewrite typecheck. The animated and gesture components have been typechecked but not executed: they need Reanimated's UI runtime and a native host. No example has been run on a device.
