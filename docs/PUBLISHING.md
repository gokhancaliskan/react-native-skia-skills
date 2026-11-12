# Publishing

Nothing in this repository publishes itself. These are the manual steps for a maintainer. The canonical repository is hosted under the `gokhancaliskan` account; `OWNER` below stands for the account or organisation hosting the copy being published.

## Before the first publication

1. Read through the diff of everything that will become public. `npm run validate` scans for local paths, credentials and placeholders, but it cannot recognise private project names or proprietary logic; that review is manual.
2. Run the full set of checks and compare with [the recorded results](VALIDATION.md):

   ```sh
   npm ci --ignore-scripts
   npm run check
   npm run check:sources
   npm run check:links
   npm run check:v3
   npm run check:install
   ```

3. Confirm the copyright line in both LICENSE files names the intended holder.
4. Check that the README's remote installation command names `OWNER`.

## Create the repository

Starting from a directory that is not yet a git repository:

```sh
git init -b main
git add .
git status
git commit -m "Initial release of the react-native-skia agent skill"
```

Check `git status` before committing: `node_modules/` and `.validation/` must not be staged.

Create an empty public repository named `react-native-skia-skills` under `OWNER` (no generated README or licence), then:

```sh
git remote add origin https://github.com/OWNER/react-native-skia-skills.git
git push -u origin main
```

Suggested repository description: "Version-aware agent skill for React Native Skia: rendering, animation, shaders, debugging and performance investigation." Suggested topics: `react-native`, `react-native-skia`, `skia`, `agent-skills`, `claude-code`, `codex`, `cursor`, `reanimated`, `expo`.

## After the push

1. Open the Actions tab and confirm the **Validate** workflow passed on the pushed commit. Run **Live checks** manually once.
2. Test the remote installation, which could not be tested before publication, in a scratch directory:

   ```sh
   npx skills@1.8.1 add OWNER/react-native-skia-skills --list
   npx skills@1.8.1 add OWNER/react-native-skia-skills --skill react-native-skia --agent claude-code --copy --yes
   ```

   If either command behaves differently from the local-path check, correct the README before announcing the repository.
3. Tag the release:

   ```sh
   git tag -a v1.0.0 -m "react-native-skia skill 1.0.0"
   git push origin v1.0.0
   ```

4. Create a GitHub release from the tag using the matching section of the changelog. State the limits plainly: no device testing, no performance data, and only a single-run pilot of agent behaviour.

## Later releases

1. Update pins and guidance, then the dates in `skills/react-native-skia/SKILL.md` (`metadata.researched`), `docs/sources.json` and `docs/RESEARCH.md`.
2. Bump the version in `package.json`, `package-lock.json` and `metadata.version`, and add a changelog entry. `npm run validate` fails if these disagree.
3. Run every check, update the recorded results, commit, tag and release as above.

`package.json` is marked private. The skill is distributed through the git repository, not through npm.
