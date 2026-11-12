# Research record

Researched on **2026-11-12**. This file explains what the skill's guidance rests on and how sure each part is. The machine-readable companion is [sources.json](sources.json); `npm run check:sources` re-tests its checkable claims against live sources, and `npm run check:links` re-tests every cited URL.

## Method

1. Read the upstream repository and its documentation source at commit `38ae7040ff06e02438eed05e5f4ca9f8ab468e3c` (2026-11-11), the published v2 and v3 documentation sites, and the npm registry metadata for both package names.
2. Read the Expo `sdk-58` branch at commit `82133fc44609eb726eba9e02c41ed35a60043f2b` (2026-11-11) and the SDK 58 documentation, plus the Reanimated, Worklets and Gesture Handler documentation and the compatibility data shipped inside the installed Reanimated package.
3. Installed one coherent set of releases, wrote the examples against the installed type declarations, and confirmed symbols there rather than from memory.
4. Read the Agent Skills specification and the `skills` CLI, and looked for existing public React Native Skia skills.

Every statement below is one of: **documented** (stated by an official source), **package metadata** (read from the registry), **verified locally** (reproduced by a check in this repository), or **inferred** (engineering judgement, labelled as such in the references).

## Findings that shape the skill

### Two package names, three situations

- The repository formerly at `Shopify/react-native-skia` now redirects to `wcandillon/react-native-skia` (documented, re-checked by the source check).
- `@shopify/react-native-skia` ends at 2.14.0. The unscoped `react-native-skia` carries both the continuing v2 line (2.15.0 to 2.15.5, dist-tag `release-2.x`) and v3 (latest 3.10.0, published 2026-11-10). A project can therefore be on scoped 2.x, unscoped 2.x or unscoped 3.x, and the package name does not say which (package metadata).
- The migration guide warns against installing both names together because both ship the same native module (documented). This repository's baseline installs only the scoped package; the v3 check installs only the unscoped one, in a separate temporary project.

### v3 is a platform change, not only a rename

Documented in the migration guide: v3 renders with Graphite; requires Android API level 26 and Vulkan 1.1; requires iOS 15.1; is not available in Expo Go or on Android TV; removes or renames several `Canvas` props; renames image and surface factories; and makes encoding and pixel readback asynchronous. Verified locally at the type level: `tests/fixtures/api/v2-only` compiles on 2.14.0 and is rejected on 3.10.0, and `tests/fixtures/api/v3-only` behaves the opposite way. The skill therefore treats migration as a separate, explicit task.

### Paths are immutable in the pinned releases

Verified locally on both 2.14.0 and 3.10.0: `SkPath` exposes no `moveTo`/`lineTo`, geometry is assembled with `Skia.PathBuilder`, and `usePathValue` hands its callback a builder. Much public sample code predates this and mutates a path. The examples use the builder; the references tell agents to check the installed declarations before copying either style, because older releases differ.

### Animation integration

- From Skia 2.10 the Reanimated integration requires Reanimated 4; earlier Skia releases can use Reanimated 3 (documented). The skill does not generalise the Reanimated 4 requirement to older projects.
- Shared and derived values are passed directly as props; `createAnimatedComponent` and `useAnimatedProps` are not needed for Skia nodes (documented).
- `useReducedMotion` returns the value read at application start (documented).
- Reanimated 4.7.x supports React Native 0.86 to 0.88 with Worklets 0.13.x (verified locally from the `compatibility.json` inside the installed package).

### Gesture Handler

Gesture Handler 3.5.0 exports hook-based gestures such as `usePanGesture`, whose callbacks are `onBegin`, `onActivate`, `onUpdate`, `onDeactivate` and `onFinalize` (verified locally; the builder-era `onStart` is rejected by a fixture). Projects on Gesture Handler 2 keep their builder API.

### Expo SDK 58

SDK 58 bundles React 19.3.0, React Native 0.88.1, `@shopify/react-native-skia` 2.14.0, Reanimated 4.7.1, Worklets 0.13.0 and Gesture Handler `~3.3.0` (documented in `bundledNativeModules.json`).

## Conflicting evidence

| Topic | Source A | Source B | How the skill handles it |
| --- | --- | --- | --- |
| Minimum React Native for Skia 2.14 | v2 installation page: `>=0.79` | 2.14.0 peer range: `>=0.78` | Records both, does not present 0.78 as supported, validates on 0.88.1 |
| Gesture Handler on Expo SDK 58 | Expo bundles `~3.3.0` with React Native 0.88.1 | Gesture Handler support table: 3.3.x does not support 0.88, 3.5.x does | Unresolved upstream. Agents keep an Expo project on what its SDK resolves and report the discrepancy; they do not upgrade on their own |

The second conflict is why the standalone validation harness pins Gesture Handler 3.5.0 while Expo SDK 58 lists 3.3.x. The harness is not an Expo project and is not a recommendation for one.

## Existing public skills

- **`zakariaf/ReactNative-Skills`, skill `skia-canvas-rendering`** (MIT, read at commit `41a0e66d4d09de5b46e6537f59a97c7192473486`, 2026-10-17). A thorough, opinionated kit: every drawn surface is one `Canvas` with one `Picture` recorded from a pure worklet `draw()`, driven by a self-stopping scene clock, with a draw-call budget and pixel goldens, and its own checker scripts. It ships application code and assumes the project adopts that kit; touch handling is delegated to a sibling skill. It is a good fit for a project that wants that architecture. It does not aim to help with an existing renderer built differently, with choosing between the scoped and unscoped packages, or with v2 versus v3. No content was copied from it.
- **`imfa-solutions/skills` (`rn-skia`)** appeared in a skill search index, but the repository returned HTTP 404 and could not be read. It is not used as a source.

The gap this skill addresses is therefore the general case: work inside whatever architecture a project already has, establish the installed versions first, separate evidence from hypothesis, and avoid prescribing thresholds or a rendering architecture that have not been measured for that project.

## Mistakes agents commonly make

Collected from the API history above and encoded as negative fixtures or reference guidance:

- Importing the removed Skia value API (`useValue`, `useComputedValue`, `runTiming`, `useTouchHandler`, `useSharedValueEffect`).
- Mutating a path returned by `Skia.Path.Make()`.
- Calling `createPicture` with the bounds first.
- Inventing props such as `mode` on `Canvas`.
- Using builder callback names with Gesture Handler 3 hooks.
- Applying v3 documentation to a v2 project or the reverse.
- Reading `.value` during render and expecting the canvas to animate; wrapping Skia nodes in `createAnimatedComponent`.
- Pasting GLSL into a runtime effect.
- Asserting a performance gain, a sprite-count threshold or a universal architecture without a measurement.

The first six are caught by the compiler and are tested. The last three cannot be detected by types; they are covered by reference guidance and by the evaluation cases, which have been run once as a pilot (see [validation](VALIDATION.md)).

## What was not researched or verified

- Behaviour on physical iOS or Android devices, on any GPU backend, or on the web target.
- Skia releases older than 2.14.0. The references direct agents to the installed declarations for those.
- Frame-time or memory effects of any technique. No benchmark was run and no numbers are claimed.
- Whether agents reliably follow the skill. One pilot run exists; see the evaluation section of the validation guide.

## Keeping this current

When a pinned package gets a new minor or major release, or before a skill release: update the pins, run every check in the validation guide, re-read the migration and installation pages, and update the dates here and in `sources.json`. If `npm run check:sources` fails, re-read the source and change the guidance; do not edit the expected value just to make the check pass.
