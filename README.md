# React Native Skia Skills

A version-aware agent skill for building, debugging, and investigating React Native Skia graphics. It helps coding agents choose supported APIs, preserve existing rendering architecture, and separate measured findings from performance guesses.

For developers working on custom UI, charts, editors, illustrations, effects, or 2D games. One general-purpose skill, `react-native-skia`, loads detailed references only when needed. It does not activate for unrelated React Native work.

## Install

Requires an agent that loads Agent Skills directories. No mobile dependencies are needed to use the instructions.

From your application's directory, with this repository cloned nearby:

```sh
npx skills@1.8.1 add ../react-native-skia-skills --skill react-native-skia --agent codex
```

Use `--agent claude-code` or `--agent cursor` for those clients. Add `--copy` to copy the files instead of linking them.

| Client | Verified with `skills@1.8.1` on 2026-11-12 | Project location |
| --- | --- | --- |
| Codex | Discovery and local copy installation | `.agents/skills/react-native-skia` |
| Claude Code | Discovery, local copy installation, and automatic loading in a pilot (8 of 8 relevant prompts, 0 of 6 unrelated ones) | `.claude/skills/react-native-skia` |
| Cursor | Discovery and local copy installation | `.agents/skills/react-native-skia` |

This verifies packaging and file placement in a temporary project. Activation was observed only in Claude Code 2.1.251, once per prompt; no other client was tested. See [validation](docs/VALIDATION.md).

To install from GitHub instead:

```sh
npx skills@1.8.1 add gokhancaliskan/react-native-skia-skills --skill react-native-skia
```

Alternatively copy the entire [skill directory](skills/react-native-skia/SKILL.md), including references, examples and LICENSE, into the client's project skill directory. The tested CLI selects the appropriate destination; consult [its agent table](https://github.com/vercel-labs/skills/blob/main/docs/agents.md) before manual installation.

## Use

Example prompts:

- “Animate this Skia progress indicator and respect reduced motion.”
- “This canvas is blank on Android after an upgrade. Diagnose it without migrating dependencies.”
- “Investigate the frame spikes in this trail. Preserve its appearance and measure before changing the renderer.”
- “Make the marker draggable inside the zoomed canvas without jumping on the second drag.”
- “Add a small shader effect with a fallback if compilation fails.”

The agent inspects project guides, installed versions, lockfiles, platform targets, animation ownership and existing validation commands. It chooses relevant references, makes focused authorized changes, and reports checks and remaining uncertainties.

Proactive findings might include a path rebuilt on every React render, a picture that is stale after a theme change, an unbounded trail, or a gesture mixing window and canvas coordinates. These are investigation triggers. The skill asks for evidence before diagnosing a bottleneck; it does not prescribe an atlas threshold, universal picture architecture, or automatic dependency upgrades.

## Scope and compatibility

The examples target `@shopify/react-native-skia` **2.14.0** and are also typechecked in isolation against `react-native-skia` **3.10.0** after rewriting only their import specifier. The scoped package stops at 2.14; the unscoped name carries both a 2.15.x line and 3.x. Do not infer a major version from the package name. The repository does not install both native modules together.

The baseline uses React 19.3.0, React Native 0.88.1, Reanimated 4.7.1, Worklets 0.13.0 and Gesture Handler 3.5.0. These are validation pins, not minimum requirements or a complete device certification matrix. Earlier releases require their matching documentation. Expo SDK 58 is researched separately and has a recorded Gesture Handler documentation discrepancy; see [compatibility](skills/react-native-skia/references/compatibility.md).

Native iOS/Android are the primary integration targets. Web requires CanvasKit initialization. Releases older than Skia 2.14 are not covered by the examples; for those the skill directs the agent to the installed type declarations.

**What has and has not been verified.** The examples typecheck against both pinned Skia majors, outdated and invented APIs are rejected by negative fixtures, and the shipped shader, path, picture and atlas helpers are rendered and pixel-checked with CanvasKit in Node. Nothing has been run on a device and no performance has been measured. One pilot comparison of agent output with and without the skill has been run (one run per task, one client and model, model-graded): 25 of 39 expected behaviours were met with the skill against 13 of 39 without. After the guidance was revised for the shortcomings that run exposed, a rerun scored 36 of 39 against 12 of 39, at about 1.5 times the cost; that second round was tuned on the same tasks and is not an independent test. These are first observations, not a measured effect size; [validation](docs/VALIDATION.md) has the per-task table, the shortcomings it exposed and the procedure. CanvasKit tests are limited graphics evidence, not native GPU, worklet, accessibility, or frame-rate guarantees. v3 introduces Graphite and platform/API changes; the skill does not silently migrate a v2 project. Expo and Reanimated are optional project choices, not prerequisites for all Skia drawing.

## Contents

- [Skill entry point](skills/react-native-skia/SKILL.md): project inspection, evidence levels and reference routing.
- [Examples](skills/react-native-skia/examples/README.md): animation, gesture, repeated sprites, path animation, shader, picture reuse, trail and performance investigation.
- [Research](docs/RESEARCH.md): dated sources, ecosystem comparison and compatibility decisions.
- [Evaluations](tests/evaluations.json): realistic tasks, expected checks and negative triggers.
- [Validation](docs/VALIDATION.md): commands, actual results and reproducible device/agent evaluation procedure.
- [Contributing](CONTRIBUTING.md), [changelog](CHANGELOG.md), [publishing](docs/PUBLISHING.md).

## Develop and maintain

Node.js 24 and npm are needed only for repository validation (checked with 24.18.0):

```sh
npm ci --ignore-scripts
npm run check
npm run check:v3
npm run check:install
npm run check:sources
npm run check:links
```

`npm run check` is offline: structure, links, metadata, example types, negative API fixtures, helper arithmetic and CanvasKit rendering. The other four commands need the network or a second install: live re-tests of the dated compatibility claims, external links, the isolated v3 typecheck, and CLI installation in a temporary project and home directory. [Validation](docs/VALIDATION.md) lists what each one does and the recorded results.

Dependencies are confined to this validation harness. The installed skill has no installation scripts. Recheck upstream on library major/minor changes and before skill releases. Record exact versions, dates, source conflicts and actual outcomes; keep native and behavioral results separate from static checks. GitHub Actions runs `npm run check` on every push and pull request; the network-dependent checks run in a separate workflow, manually or monthly, so a third-party outage cannot fail a push.

Original material is MIT licensed; upstream libraries and documentation keep their respective licenses. See [LICENSE](LICENSE). This is an independent community project, not endorsed by the library maintainers or agent vendors.
