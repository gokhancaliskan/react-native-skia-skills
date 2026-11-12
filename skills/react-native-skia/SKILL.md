---
name: react-native-skia
description: Build, debug, and investigate React Native Skia canvases, paths, shaders, graphics animation, and rendering performance. Use for code using @shopify/react-native-skia or react-native-skia, including Skia integration with Expo, Reanimated, Worklets, and Gesture Handler. Do not use for unrelated React Native layout, navigation, or backend tasks.
license: MIT
compatibility: Needs read access to the project's manifest, lockfile and installed type declarations. Version-specific statements were researched against @shopify/react-native-skia 2.14.0 and react-native-skia 3.10.0.
metadata:
  version: "1.0.0"
  researched: "2026-11-12"
---

# React Native Skia

Solve the requested graphics problem within the existing project. Keep declarative scenes declarative unless evidence supports another approach; preserve an existing imperative renderer when it fits. Games are one optional use case.

## Establish the actual environment

Read project agent guides and relevant runbooks first. Inspect the manifest, lockfile and installed declarations (when present) for React, React Native, Expo, both Skia package names, Reanimated, Worklets and Gesture Handler. Distinguish requested ranges from resolved versions. Note missing information rather than inventing it.

Inspect TypeScript/Babel/Metro configuration, native architecture and deployment targets, intended platforms, canvas ownership, animation runtime, asset loading, tests and documented commands. Trace the smallest relevant component and its callers. Do not scan secrets or unrelated product code.

Read [compatibility](references/compatibility.md) before version-sensitive advice. The package name alone does not identify the major version: the unscoped package has 2.x and 3.x releases. Current docs can describe APIs absent from the installed release. Confirm unfamiliar symbols in that release's exported declarations/source. Never replace a working dependency set just to match an example.

## Work and investigate proportionally

1. Identify the intended visual result, coordinate space, input behavior and acceptable motion. Reproduce the reported symptom when possible.
2. Load only the relevant references below. Prefer a small correct change over a new rendering framework.
3. During that work, look for allocations in frequently called paths, repeated path construction, React rerenders, heavy filters/layers, overdraw, stale caches, unbounded resources and incorrect runtime ownership. These are leads, not diagnoses. Connect each lead to a source location and a way to test it.
4. Classify findings: **confirmed defect** (reproduction or contract violation), **likely problem** (specific supporting evidence), **profiling hypothesis** (unmeasured mechanism), or **optional improvement** (no demonstrated defect). Write the level next to every finding in your report. Until a cause is reproduced or measured, call it a lead, not "the cause", and say which measurement or test would settle it. Do not claim faster rendering, or that code allocates nothing, without comparable measurements.
5. Implement focused changes already authorized by the user's task. Explain necessary dependency changes; do not silently install, migrate architecture, alter appearance, or touch unrelated files. Propose and wait, rather than edit, when a change alters which devices or OS versions the app supports, a dependency's major version, or the build type the team uses; explain the trade-off and the alternative. Otherwise ask only when a consequential choice is unresolved by scope/context.
6. Run the project's named checks. For rendering changes, test loading/failure states, resize, transforms, motion preferences and relevant device platforms when available. Typechecks and mocks cannot establish native visual correctness, runtime ownership or GPU speed.
7. Report what changed, evidence, checks actually run, limitations and the next useful validation step. Say whether the change needs a native rebuild or only a JS reload. When you decline something the user suggested, such as a newer major, give the documented reason. Preserve existing conventions and disclose changes in appearance.

## Choose a reference

| Task | Read |
| --- | --- |
| Layout, drawing order, paint and compositing | [Fundamentals](references/fundamentals.md) |
| Geometry, clipping, transformations, path animation | [Drawing and paths](references/drawing-and-paths.md) |
| Shared values, timing, frame callbacks, ownership | [Animations and worklets](references/animations-and-worklets.md) |
| Dragging, hit testing, camera coordinates | [Gestures and interactions](references/gestures-and-interactions.md) |
| SkSL, filters, blur, masks, gradients | [Shaders and effects](references/shaders-and-effects.md) |
| Image loading, sizing, text and fonts | [Images and text](references/images-and-text.md) |
| Pictures, atlas, cache keys and lifetimes | [Pictures and caching](references/pictures-and-caching.md) |
| Frame spikes, memory, profiling | [Performance](references/performance.md) |
| Blank/stale/incorrect output, platform differences | [Debugging](references/debugging.md) |
| Package versions, Expo, native setup, migrations | [Compatibility](references/compatibility.md) |
| Simulation, particles, camera, trails | [Game development](references/game-development.md) |
| Adapt a verified pattern | [Examples and assumptions](examples/README.md) |

## Invariants worth checking

Pass supported shared/derived values directly to Skia props; reading `.value` in React render does not subscribe the prop to animation. Keep hooks unconditional. Do not assume a worklet may call arbitrary JS or that any Skia host object may cross runtimes. Distinguish immutable geometry from mutable builders, and pictures from raster caches. Match coordinate spaces before adjusting numbers. Confirm filter order visually. Treat performance advice as a hypothesis until measured on the target workload.

When offline, use installed types and these dated references, label anything unresolved, and avoid speculative APIs. Sources are linked in each reference. Do not load every reference for a small task.
