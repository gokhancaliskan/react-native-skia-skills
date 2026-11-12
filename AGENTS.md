# Repository guide

This repository distributes instructions, not a mobile application. Read README.md,
CONTRIBUTING.md, and docs/VALIDATION.md before changing the skill or its checks.
Keep SKILL.md concise and route detail to references. Preserve source dates and version scopes.
Run `npm ci --ignore-scripts`, then `npm run check`. For API changes also run
`npm run check:v3`; for installation changes run `npm run check:install`; for version or
source changes run `npm run check:sources` and `npm run check:links`.
Never treat typechecking or CanvasKit tests as native device or performance evidence.
Public files must contain only original examples and public sources; never copy private project material.
