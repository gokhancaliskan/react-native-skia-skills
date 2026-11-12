// Exercises discovery and project-level installation with the pinned skills CLI in a
// throwaway project and a throwaway HOME, so no user-level skill directory is touched.
// It proves packaging and file placement. It does not prove that an agent activates the skill.
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { read, readJson, root, run, skillDir, skillName, walk } from "./lib.mjs";

const cli = `skills@${readJson(path.join(root, "docs", "sources.json")).pins.skillsCli}`;
const agents = [
  { id: "codex", directory: ".agents/skills" },
  { id: "claude-code", directory: ".claude/skills" },
  { id: "cursor", directory: ".agents/skills" },
];
const work = mkdtempSync(path.join(tmpdir(), "rn-skia-skill-install-"));
const home = path.join(work, "home");
mkdirSync(home);
const env = {
  ...process.env, HOME: home, USERPROFILE: home, XDG_CONFIG_HOME: path.join(home, ".config"),
  DO_NOT_TRACK: "1", DISABLE_TELEMETRY: "1", CI: "1", NO_COLOR: "1",
  npm_config_cache: process.env.npm_config_cache ?? path.join(process.env.HOME ?? home, ".npm"),
};
const problems = [];
const expected = walk(skillDir).map((file) => path.relative(skillDir, file));
const strip = (text) => text.replace(/\u001b\[[0-9;]*m/g, "");

function skills(cwd, args) {
  const result = run("npx", ["--yes", cli, ...args], { cwd, env });
  return { status: result.status, output: strip(`${result.stdout}\n${result.stderr}`) };
}

try {
  const listing = skills(work, ["add", root, "--list"]);
  const listed = listing.status === 0 && new RegExp(`\\b${skillName}\\b`).test(listing.output);
  console.log(`${listed ? "ok  " : "FAIL"} discovery: ${cli} add <repository> --list`);
  if (!listed) problems.push(`discovery did not list ${skillName}:\n${listing.output}`);
  const found = [...listing.output.matchAll(/Found (\d+) skills?/g)].map((match) => Number(match[1]));
  if (found.length > 0 && found[0] !== 1) problems.push(`discovery reported ${found[0]} skills, expected exactly 1`);

  for (const agent of agents) {
    const project = path.join(work, `project-${agent.id}`);
    mkdirSync(project);
    writeFileSync(path.join(project, "package.json"), '{"name":"fixture","private":true}\n');
    const install = skills(project, ["add", root, "--skill", skillName, "--agent", agent.id, "--copy", "--yes"]);
    const target = path.join(project, agent.directory, skillName);
    const errors = [];
    if (install.status !== 0) errors.push(`exit status ${install.status}`);
    if (!existsSync(path.join(target, "SKILL.md"))) errors.push(`no SKILL.md in ${agent.directory}/${skillName}`);
    else {
      const installed = walk(target).map((file) => path.relative(target, file));
      const missing = expected.filter((file) => !installed.includes(file));
      const extra = installed.filter((file) => !expected.includes(file));
      const changed = expected.filter((file) => installed.includes(file) && read(path.join(target, file)) !== read(path.join(skillDir, file)));
      if (missing.length) errors.push(`missing ${missing.join(", ")}`);
      if (extra.length) errors.push(`unexpected ${extra.join(", ")}`);
      if (changed.length) errors.push(`content differs in ${changed.join(", ")}`);
    }
    console.log(`${errors.length ? "FAIL" : "ok  "} ${agent.id}: ${expected.length} files copied to ${agent.directory}/${skillName}`);
    if (errors.length) problems.push(`${agent.id}: ${errors.join("; ")}\n${install.output}`);
  }

  const leaked = walk(home).filter((file) => file.includes(skillName));
  const homeEntries = readdirSync(home);
  console.log(`${leaked.length ? "FAIL" : "ok  "} isolation: nothing installed at user level (temporary HOME holds: ${homeEntries.join(", ") || "nothing"})`);
  if (leaked.length) problems.push(`user-level files were written: ${leaked.join(", ")}`);
} catch (error) {
  problems.push(error.message);
} finally {
  rmSync(work, { recursive: true, force: true });
}

for (const problem of problems) console.log(`\n${problem}`);
console.log(problems.length === 0
  ? "\nInstallation check passed. This check does not exercise agent activation or behaviour."
  : `\n${problems.length} problem(s)`);
process.exit(problems.length === 0 ? 0 : 1);
