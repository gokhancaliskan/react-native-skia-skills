# Contributing

Read [AGENTS.md](AGENTS.md), [research](docs/RESEARCH.md), and [validation](docs/VALIDATION.md).

1. Describe the concrete failure or missing capability. Keep the smallest useful scope.
2. Inspect the relevant installed package declarations and official versioned documentation. Add or refresh dated evidence in `docs/sources.json` for compatibility claims.
3. Change the relevant reference; keep the main skill concise. Put runnable examples in the examples directory rather than unchecked Markdown snippets.
4. Add a behavioral evaluation for a new decision boundary or a meaningful test for executable logic. Include failure cases; do not assert prose merely to freeze wording.
5. Run `npm ci --ignore-scripts`, `npm run check`, and relevant optional checks from the validation guide. Report skipped checks explicitly. Update CHANGELOG.md.

Do not submit private code, assets, credentials, or production logs. Examples must be original or appropriately licensed. No fixed performance thresholds without reproducible device evidence. A typecheck does not establish thread safety.

## Updating dependencies

Choose one coherent validation baseline; preserve the lockfile. Check Reanimated's exact compatibility data and the Gesture Handler matrix, not just peer dependency ranges. The v3 test is isolated to avoid duplicate native modules. Run graphics and negative API tests after each pin update. Inspect source changes when online evidence checks fail; never update expected values solely to turn CI green.

## Reviewing behavioral changes

Use the evaluation procedure in the validation guide. Keep raw transcripts outside this public tree unless fully synthetic and reviewed. Record model/version, tool access, budget and results. A failed case should lead to a targeted fix, not an architecture rule for all users.

## Releases

Use semantic versions for the skill. Breaking changes to supported assumptions or behavior need a major release; new references/examples are minor; corrections are patches. Follow [publishing](docs/PUBLISHING.md). Do not publish from automated validation.
