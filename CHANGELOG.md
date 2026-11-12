# Changelog

## 1.0.0 — 2026-11-12

- Initial general-purpose React Native Skia skill with progressive references.
- Version-aware scoped v2 and unscoped v3 guidance; explicit Expo and non-Expo paths.
- Seven original components, shared helpers and a performance investigation protocol.
- Validation: structural checks, example typechecks on scoped 2.14.0 and unscoped 3.10.0, negative fixtures for outdated and invented APIs, CanvasKit rendering tests of the shipped shader and geometry, live source and link checks, and an isolated skills CLI installation check.
- Evaluation cases for eight scenarios and six negative triggers, with a two-round pilot recorded (single run per arm, model-graded). Guidance was revised after round 1 for evidence labels, changes that affect device reach, measurement proposals, allocation claims, declined upgrades and native rebuild steps; round 2 reran the same tasks and is not an independent test.
- Not included: device testing, performance measurements, or a repeated, human-reviewed agent evaluation.
