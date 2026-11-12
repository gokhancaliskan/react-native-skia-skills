# Compatibility and version policy

Researched **2026-11-12**. Installed declarations, matching release source and project runbooks take precedence over memory. A peer range is not a complete support matrix. Resolve conflicting evidence before changing a user's native setup.

## Package and backend boundaries

- The original Shopify repository redirects to `wcandillon/react-native-skia`. The scoped npm package ends at **2.14.0**. The unscoped `react-native-skia` continues v2 as 2.15.x (dist-tag `release-2.x`) and publishes v3 as `latest`, so read the resolved version, not the name. Never install both names together: they ship the same native module.
- Current v2 installation docs require React Native >=0.79 and React >=19. The 2.14.0 npm peer range says RN >=0.78: this discrepancy is recorded, not treated as certification of 0.78. The validation baseline uses 0.88.1.
- Current v2 animation docs place the Reanimated 4 requirement at Skia **2.10+**. Older Skia versions may use Reanimated 3; do not impose a modern Worklets installation on them.
- Reanimated 4 requires New Architecture and a matching Worklets minor. The tested pair is **4.7.1 / 0.13.0**, with RN **0.88.1** and React **19.3.0**. Check the installed Reanimated `compatibility.json` and current official matrix before changing it.
- Gesture example APIs target **3.5.0** (`usePanGesture`); preserve a v2 project's supported API instead of migrating it implicitly.

Sources: [v2 installation](https://wcandillon.github.io/react-native-skia/v2/docs/getting-started/installation/), [animation version boundary](https://wcandillon.github.io/react-native-skia/v2/docs/animations/animations/), [Reanimated matrix](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/), [Gesture Handler matrix](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/getting-started/).

## Expo versus non-Expo

For Expo, inspect the SDK major and its versioned documentation/bundled modules. SDK 58 records scoped Skia 2.14.0, Reanimated 4.7.1, Worklets 0.13.0 and Gesture Handler ~3.3.0. However the live Gesture Handler matrix marks 3.3.x unsupported on RN 0.88, while 3.5.x includes it. This is unresolved upstream evidence; the examples use 3.5.0 as a **non-Expo validation harness**, not a recommendation to override Expo's resolver. Diagnose an existing Expo project against its exact SDK/native build before proposing a change.

Use the project's package manager and Expo's version resolver when adding an authorized dependency. `npx expo install --check` inspects alignment; `--fix` changes dependencies and is not a read-only diagnostic. If the user asks for the newest Skia in an Expo Go workflow, keep the SDK's version and say why: v3 is not in Expo Go and needs a development build plus the higher platform minimums below. Expo Go contains a fixed native set. Use a development build when the required native implementation is absent; adding JS alone cannot update Expo Go. Do not install Expo into a bare project just to use Skia. Bare projects follow their CocoaPods/Gradle and Babel/Metro instructions. In your report, name the native steps a change requires (for example `pod install` and rebuilding both apps after adding or updating a native dependency) or state that it is JS-only; do not run them unasked.

Sources: [SDK 58 Skia](https://docs.expo.dev/versions/v58.0.0/sdk/skia/), [SDK 58 bundle](https://raw.githubusercontent.com/expo/expo/sdk-58/packages/expo/bundledNativeModules.json), [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/).

## v3 migration is a separate task

The v3.10.0 typecheck covers these examples only. v3 uses Graphite and raises platform requirements (Android API 26/Vulkan 1.1, iOS 15.1); Expo Go and Android TV are reasons to retain v2. Canvas sizing/options and image readback/factory APIs have changed. Review the official migration guide rather than renaming imports across an app blindly. Its broader GPU-image sharing does not imply every mutable Skia object is thread-safe. Web continues to need its own CanvasKit setup.

Sources: [migration guide](https://wcandillon.github.io/react-native-skia/docs/getting-started/migration/), [web setup](https://wcandillon.github.io/react-native-skia/docs/getting-started/web/).

Native devices and client-hosted behavioral efficacy are not certified by this repository. Revalidate examples and sources when upgrading; do not extrapolate compatibility to all earlier/later releases.
