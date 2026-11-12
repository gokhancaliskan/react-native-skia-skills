# Validation

What is checked, how to run it, what actually happened, and what none of it proves. Results below were recorded on **2026-11-12** on macOS (arm64) with Node.js 24.18.0 and npm 11.16.0. Rerun the commands; do not rely on this page for a later state of the repository.

## Commands

```sh
npm ci --ignore-scripts
npm run check
```

`npm run check` is offline and deterministic. It runs, in order:

| Command | What it does |
| --- | --- |
| `npm run validate` | Ten structural checks: frontmatter against the Agent Skills specification, SKILL.md size, relative links and anchors, a self-contained skill directory, every reference and example reachable from SKILL.md, documented commands exist, version/date/pin consistency (including the installed Reanimated support matrix), a complete source record, evaluation coverage, and a scan for local paths, credentials, placeholders and empty directories |
| `npm run typecheck` | Compiles the examples with TypeScript 6.0.3 in strict mode against the pinned packages |
| `npm test` | 28 tests in three files, described below |

`npm run test:graphics` runs only the rendering tests.

Four further checks need the network or a second install and are kept separate:

| Command | What it does |
| --- | --- |
| `npm run check:sources` | Re-tests the machine-checkable claims in [sources.json](sources.json) against the npm registry, documentation pages and repositories |
| `npm run check:links` | Requests every external URL cited in Markdown or recorded in `sources.json` |
| `npm run check:v3` | Creates a temporary project with unscoped Skia 3.10.0 and without the scoped package, rewrites only the import specifier of each example, and typechecks them and the version fixtures there |
| `npm run check:install` | Runs `skills@1.8.1` discovery and project-level copy installation for Codex, Claude Code and Cursor inside a temporary project with a temporary home directory |

## Tests

- **`tests/api-contract.test.mjs`** (8 tests). The examples compile; they import only React, React Native, Skia, Reanimated, Gesture Handler and files inside the skill; each component file exports exactly its component; components use the helpers that the rendering tests exercise. Negative fixtures under `tests/fixtures/api/rejected` must each fail with exactly the expected compiler errors: the removed value API, path mutation, reversed `createPicture` arguments, invented props, and builder callback names on a Gesture Handler 3 hook. `v3-only` fixtures must be rejected on the 2.x baseline and `v2-only` fixtures accepted. Finally, every API-shaped symbol written in backticks in the skill's Markdown must resolve to an export of the installed packages, to a member of the `Skia` object, or to an export of the examples.
- **`tests/graphics.test.mjs`** (9 tests). Using the documented headless API with CanvasKit: the shipped SkSL compiles and produces the expected centre and edge colours, stays finite with a zero resolution, and invalid SkSL yields no effect while the fallback fill matches the glow's outer colour; the reveal path has the expected bounds and end points and exposes no mutators; trimming reveals it progressively from the start; the grid picture replays identically, equals direct drawing and the `Picture` component output, and has the expected line counts; the sprite grid draws 48 aspect-preserving copies through `Atlas` at the expected positions; trail tracing produces a bounded polyline.
- **`tests/helpers.test.mjs`** (11 tests). Camera mapping and its inverse; trail capacity, duplicate and non-finite handling, boundary capacities and input immutability; frame-summary quantiles, the strict over-budget comparison, single-sample and tail behaviour, and rejected inputs.

The numbers in `tests/helpers.test.mjs` are synthetic inputs chosen to exercise arithmetic. They are not frame timings from any device.

## Recorded results

| Check | Result on 2026-11-12 |
| --- | --- |
| `npm run validate` | 10 of 10 checks passed |
| `npm run typecheck` | No errors (after the Gesture Handler 3.5.0 pin) |
| `npm test` | 28 passed, 0 failed |
| `npm run check:sources` | 17 of 17 live claims held; 5 further claims have no automated live check and are covered by the local checks named in `sources.json` |
| `npm run check:links` | 48 of 48 links responded; one recorded-unavailable community repository is skipped by design |
| `npm run check:v3` | 10 example files typechecked against unscoped Skia 3.10.0 with 8 import lines rewritten; fixtures behaved as expected; the scoped package was absent from that project |
| `npm run check:install` | The skill was listed; 25 files were copied unchanged to `.agents/skills/react-native-skia` for Codex and Cursor and to `.claude/skills/react-native-skia` for Claude Code; nothing was written to the temporary home directory |

Two defects were found by these checks while they were being built and were fixed: a reference named a `SVG` component that the package does not export (the component is `ImageSVG`), and the import scanner initially missed side-effect imports.

### Do the checks detect regressions?

Eighteen single-line faults were injected one at a time from a passing baseline and then reverted: a changed shader constant, grid pitch and sprite scale; a trail off-by-one; a wrong camera inverse; a non-strict budget comparison; a removed hook and a deep import in an example; an invented hook and an invented `Skia` member in a reference; a renamed skill; a broken reference link; a stale version in the README; a leaked home path; a link leaving the skill directory; an unrecorded source URL; a changelog version mismatch; and a missing evaluation scenario. All eighteen were reported by the relevant check. The injection was done by hand with a throwaway script that is not part of the repository. This is a spot check of the checks, not a coverage measurement.

## What these checks do not establish

- **Native rendering.** CanvasKit on the CPU is one backend. Nothing here ran on iOS, Android, Metal, OpenGL ES, Vulkan or Graphite.
- **Runtime behaviour of the animated and gesture examples.** `AnimatedPulse`, `DragMarker`, `PathReveal`'s timing and `BoundedTrail` need Reanimated's UI runtime and a native host. They are typechecked, and their pure helpers are tested, but they have not been executed.
- **Performance.** No frame times, memory figures or comparisons were measured.
- **v3 behaviour.** The v3 check reads declarations only.
- **Older releases.** Nothing was tested below Skia 2.14.0.
- **Other Node.js versions.** The checks rely on Node's built-in TypeScript stripping and were run on 24.18.0 only.
- **Agent behaviour beyond one pilot.** See below.

## Device acceptance procedure

Run in an application whose installed versions match [the pins](../skills/react-native-skia/references/compatibility.md) or are confirmed compatible, in a development or release build on a physical device per platform:

1. Copy one example and its helper files into the app and render it from an existing screen under the app's `GestureHandlerRootView`.
2. Check the behaviour listed for that example in the [examples index](../skills/react-native-skia/examples/README.md): mount, unmount during animation, repeated interaction, resize, background and resume.
3. Toggle the system reduced-motion setting, restart the app and confirm decorative motion stops.
4. Record device, OS, build type, package versions and the outcome of each step. Record anything not tested as not tested.

## Agent evaluation procedure

`tests/evaluations.json` contains eight tasks, one per required scenario (new animation, rendering bug, canvas optimisation, gesture, shader, game effect, Expo project, bare React Native project), and six prompts that should not activate the skill. Each task lists observable expected behaviours and behaviours to avoid.

**Status: one pilot run on 2026-11-12.** It is a first observation, not a measured effect size: one run per task per arm, one agent, one model, and model-graded.

Setup: Claude Code 2.1.251 in headless mode with model `claude-opus-5[1m]`; tools limited to Read, Glob, Grep, Edit, Write and Skill (no shell); project settings only, no MCP servers or plugins; a synthetic fixture per task with a manifest and lockfile but no installed dependencies. The with-skill arm had the skill copied to `.claude/skills/react-native-skia`; nothing in the prompt mentioned it. Prompts were used verbatim. Scoring was done by one separate model run per task, which saw both arms' final message, diff and list of inspected project files in random order, with phrases that revealed the arm removed.

| Task | With skill: expected met | Without skill: expected met | Avoid-list violations (with / without) |
| --- | --- | --- | --- |
| pulse-on-new-message | 4 of 5 | 1 of 5 | 0 / 0 |
| blank-canvas-after-upgrade | 1 of 5 | 1 of 5 | 0 / 0 |
| stuttering-chart | 3 of 5 | 2 of 5 | 0 / 0 |
| drag-marker-on-zoomed-map | 5 of 5 | 2 of 5 | 0 / 0 |
| vignette-shader | 4 of 4 | 1 of 4 | 0 / 1 |
| comet-trail | 1 of 5 | 1 of 5 | 0 / 0 |
| expo-progress-ring | 4 of 5 | 2 of 5 | 0 / 0 |
| bare-signature-pad | 3 of 5 | 3 of 5 | 0 / 0 |
| **Total** | **25 of 39** | **13 of 39** | **0 of 32 / 1 of 32** |

Activation: the skill was loaded in all 8 with-skill runs and in none of the 6 negative-trigger runs. One negative run ended at its budget limit after the point where a skill would have been chosen.

Cost: the with-skill arm used more turns in every task and cost 6.58 USD in total against 3.51 USD, about 1.9 times as much.

What the pilot showed the skill does not yet achieve, from the with-skill runs:

- On the blank-canvas task the agent named the v3 platform requirements but stated the cause as certain and raised `minSdkVersion` before asking, although it disclosed the consequence. It labelled only one finding with an evidence level.
- On the chart task it presented the path rebuild as the cause rather than a lead and proposed no before-and-after measurement.
- On the trail task it drew the trail as separate circles instead of a path, and its summary said per-frame work allocates nothing while its own code comment said the array is copied.
- On the Expo task it kept the scoped 2.x package but did not explain why v3 was unsuitable for Expo Go.
- On the bare project it adapted to the older releases but did not mention the native rebuild steps.

Three tasks showed no difference between arms in round 1.

**Round 2.** The guidance was then revised for those five points (evidence labels on every finding, proposing rather than editing when device reach or a dependency major changes, proposing a before-and-after measurement, describing per-frame allocation accurately, explaining a declined upgrade, and naming native rebuild steps). The eight with-skill sessions were rerun with the revised files; the round 1 without-skill submissions were reused and regraded blind alongside them. Result: **36 of 39** expected behaviours met with the skill against **12 of 39** without, 0 of 32 against 1 of 32 avoid-list violations, and a with-skill cost of 5.35 USD against 3.51 USD. The skill loaded in all eight sessions. Per-run scores for both rounds are in `tests/evaluations.json`.

Round 2 is not an independent test: the guidance was revised after seeing round 1 on these same tasks, so some of the gain is fitting to the cases. The without-skill total moved from 13 to 12 between gradings of identical submissions, which shows the grader's own variation. A fair confirmation needs new tasks and repeated runs.

Limits of this pilot: a single run cannot separate the skill's effect from run-to-run variation; the grader was a model, with no human second reviewer; the criteria were written by the skill's author; agents had no shell and no installed dependencies, so items about running checks or reading installed declarations could only be met by saying what was not done; only one client and model were used. Transcripts are not published.

To repeat or extend the comparison:

1. For each task, create a throwaway fixture project that matches its `project` description. Keep it synthetic.
2. Choose one agent, model and version. Record them, along with tool access and any turn or token limit.
3. Run each task at least three times in a fresh session with the skill installed at project level (`npx skills@1.8.1 add <path-to-this-repository> --skill react-native-skia --agent <agent> --copy --yes`) and three times in an identical fixture without it. Use the prompt verbatim.
4. For each run, mark every `expected` item met or not met and every `mustNot` item avoided or violated, from the transcript and the resulting diff. Have a second reviewer score a sample without knowing which arm it came from.
5. For each negative trigger, record whether the skill was loaded.
6. Report per-task counts for both arms, the number of runs, and disagreements between reviewers. Do not summarise as a single score, and do not publish transcripts that contain private code.
7. Add the runs to `results` in `tests/evaluations.json` with `comparison` set to the date, and update this section and the README. The pilot's per-run scores are recorded there.
