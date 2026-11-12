// Deterministic, offline structure checks. Network checks live in check-links.mjs and check-sources.mjs.
import { existsSync, lstatSync, readdirSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import {
  externalUrls, headingAnchors, markdownLinks, read, readJson, rel, root, skillDir, skillName, walk,
} from "./lib.mjs";

const results = [];
function check(name, body) {
  const errors = [];
  try {
    body((message) => errors.push(message));
  } catch (error) {
    errors.push(`check crashed: ${error.message}`);
  }
  results.push({ name, errors });
}

const files = walk(root);
const markdown = files.filter((file) => file.endsWith(".md"));
const skillFiles = walk(skillDir);
const skillMarkdown = skillFiles.filter((file) => file.endsWith(".md"));
const skillPath = path.join(skillDir, "SKILL.md");
const skillText = read(skillPath);
const frontmatterMatch = skillText.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
const frontmatter = frontmatterMatch ? parse(frontmatterMatch[1]) : null;
const body = frontmatterMatch ? frontmatterMatch[2] : "";
const pkg = readJson(path.join(root, "package.json"));
const lock = readJson(path.join(root, "package-lock.json"));
const sourcesPath = path.join(root, "docs", "sources.json");
const sources = existsSync(sourcesPath) ? readJson(sourcesPath) : null;
const isIsoDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

check("SKILL.md frontmatter follows the Agent Skills specification", (fail) => {
  if (!frontmatter || typeof frontmatter !== "object") return fail("missing or unparsable YAML frontmatter");
  const allowed = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools"]);
  for (const key of Object.keys(frontmatter)) if (!allowed.has(key)) fail(`unknown field "${key}"`);
  const { name, description, license, compatibility, metadata } = frontmatter;
  if (typeof name !== "string" || name.length < 1 || name.length > 64) fail("name must be 1-64 characters");
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) fail("name must be lowercase alphanumerics separated by single hyphens");
  if (name !== skillName || name !== path.basename(skillDir)) fail("name must equal the skill directory name");
  if (typeof description !== "string" || description.trim().length < 1) fail("description is required");
  else {
    if (description.length > 1024) fail(`description is ${description.length} characters (limit 1024)`);
    if (!/\bUse (for|when)\b/.test(description)) fail("description must say when to use the skill");
    if (!/\bDo not use\b/.test(description)) fail("description must state a negative trigger");
    for (const term of ["@shopify/react-native-skia", "react-native-skia"]) {
      if (!description.includes(term)) fail(`description must mention ${term}`);
    }
  }
  if (license !== undefined && license !== pkg.license) fail("license must match package.json");
  if (compatibility !== undefined && (typeof compatibility !== "string" || compatibility.length > 500)) {
    fail("compatibility must be a string of at most 500 characters");
  }
  if (metadata !== undefined) {
    if (typeof metadata !== "object" || Array.isArray(metadata)) fail("metadata must be a mapping");
    else for (const [key, value] of Object.entries(metadata)) {
      if (typeof value !== "string") fail(`metadata.${key} must be a string`);
    }
  }
});

check("SKILL.md stays concise", (fail) => {
  const lines = skillText.split("\n").length;
  const words = body.split(/\s+/).filter(Boolean).length;
  if (lines > 500) fail(`${lines} lines (specification limit 500)`);
  // The specification recommends under 5000 tokens; 1800 words keeps a wide margin for any tokenizer.
  if (words > 1800) fail(`${words} words in the body (repository limit 1800)`);
  if (!/^# /m.test(body)) fail("body needs a top-level heading");
});

check("relative links and anchors resolve", (fail) => {
  for (const file of markdown) {
    for (const link of markdownLinks(read(file))) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(link)) continue;
      const [target, anchor] = link.split("#");
      const resolved = target ? path.resolve(path.dirname(file), target) : file;
      if (!existsSync(resolved)) fail(`${rel(file)} -> ${link} does not exist`);
      else if (anchor && resolved.endsWith(".md") && !headingAnchors(read(resolved)).has(anchor)) {
        fail(`${rel(file)} -> ${link} has no such heading`);
      }
    }
  }
});

check("the skill directory is self-contained", (fail) => {
  for (const file of skillFiles) {
    if (lstatSync(file).isSymbolicLink()) fail(`${rel(file)} is a symbolic link`);
  }
  for (const file of skillMarkdown) {
    for (const link of markdownLinks(read(file))) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(link)) continue;
      const resolved = path.resolve(path.dirname(file), link.split("#")[0] || ".");
      if (!resolved.startsWith(skillDir + path.sep)) fail(`${rel(file)} links outside the installable skill: ${link}`);
    }
  }
  if (read(path.join(skillDir, "LICENSE")) !== read(path.join(root, "LICENSE"))) {
    fail("skills/react-native-skia/LICENSE must be identical to the root LICENSE");
  }
  const allowedExtensions = new Set([".md", ".ts", ".tsx", ""]);
  for (const file of skillFiles) {
    if (!allowedExtensions.has(path.extname(file))) fail(`${rel(file)} has an unexpected file type`);
  }
});

check("references and examples are discoverable", (fail) => {
  const linkedFrom = (file) => new Set(markdownLinks(read(file))
    .filter((link) => !/^[a-z][a-z0-9+.-]*:/i.test(link))
    .map((link) => path.resolve(path.dirname(file), link.split("#")[0])));
  const fromSkill = linkedFrom(skillPath);
  const examplesReadme = path.join(skillDir, "examples", "README.md");
  const fromExamples = linkedFrom(examplesReadme);
  const references = readdirSync(path.join(skillDir, "references")).map((name) => path.join(skillDir, "references", name));
  if (references.length === 0) fail("no references found");
  for (const reference of references) {
    const text = read(reference);
    if (!fromSkill.has(reference)) fail(`${rel(reference)} is not linked from SKILL.md`);
    if (!/^# \S/.test(text)) fail(`${rel(reference)} must start with a title`);
    const sourceLines = text.split("\n").filter((line) => line.startsWith("Sources:"));
    if (sourceLines.length === 0) fail(`${rel(reference)} has no Sources line`);
    else if (!sourceLines.some((line) => externalUrls(line).length > 0)) fail(`${rel(reference)} cites no external source`);
  }
  if (!fromSkill.has(examplesReadme)) fail("examples/README.md is not linked from SKILL.md");
  for (const example of walk(path.join(skillDir, "examples"))) {
    if (example === examplesReadme) continue;
    if (!fromExamples.has(example) && !fromSkill.has(example)) fail(`${rel(example)} is not linked from the examples index`);
  }
});

check("documented commands exist", (fail) => {
  const documents = [...markdown, ...files.filter((file) => /\.ya?ml$/.test(file))];
  for (const file of documents) {
    const text = read(file);
    for (const match of text.matchAll(/npm run ([a-z0-9:_-]+)/g)) {
      if (!pkg.scripts[match[1]]) fail(`${rel(file)} mentions missing script "npm run ${match[1]}"`);
    }
    if (/\bnpm test\b/.test(text) && !pkg.scripts.test) fail(`${rel(file)} mentions npm test`);
    for (const match of text.matchAll(/skills@(\d+\.\d+\.\d+)/g)) {
      if (sources && match[1] !== sources.pins.skillsCli) fail(`${rel(file)} uses skills@${match[1]}, pinned ${sources.pins.skillsCli}`);
    }
  }
  for (const [name, command] of Object.entries(pkg.scripts)) {
    for (const match of command.matchAll(/(?:scripts|tests)\/[\w./*-]+/g)) {
      const target = match[0];
      const present = target.includes("*")
        ? readdirSync(path.join(root, path.dirname(target))).some((entry) => entry.endsWith(target.split("*").pop()))
        : existsSync(path.join(root, target));
      if (!present) fail(`script "${name}" points to missing ${target}`);
    }
  }
  const documented = documents.map(read).join("\n");
  for (const name of Object.keys(pkg.scripts)) {
    const usage = name === "test" ? /\bnpm test\b/ : new RegExp(`npm run ${name}(?![\\w:-])`);
    if (!usage.test(documented)) fail(`script "${name}" is not documented anywhere`);
  }
});

check("versions, dates and pins are consistent", (fail) => {
  if (!sources) return fail("docs/sources.json is missing");
  const changelog = read(path.join(root, "CHANGELOG.md")).match(/^## (\d+\.\d+\.\d+) — (\d{4}-\d{2}-\d{2})$/m);
  if (!changelog) fail("CHANGELOG.md needs a '## x.y.z — YYYY-MM-DD' entry");
  const version = frontmatter?.metadata?.version;
  if (pkg.version !== version) fail(`package.json ${pkg.version} != SKILL.md metadata.version ${version}`);
  if (changelog && changelog[1] !== pkg.version) fail(`latest changelog entry ${changelog[1]} != ${pkg.version}`);
  if (lock.version !== pkg.version) fail("package-lock.json version differs from package.json");
  const researched = frontmatter?.metadata?.researched;
  if (!isIsoDate(researched)) fail("metadata.researched must be an ISO date");
  if (researched !== sources.researchedOn) fail(`metadata.researched ${researched} != sources.json ${sources.researchedOn}`);

  for (const [name, wanted] of Object.entries(pkg.devDependencies)) {
    if (!/^\d+\.\d+\.\d+$/.test(wanted)) fail(`${name} must be pinned exactly, found ${wanted}`);
    const locked = lock.packages[`node_modules/${name}`]?.version;
    if (locked !== wanted) fail(`${name}: lockfile has ${locked}, package.json has ${wanted}`);
    if (sources.pins.baseline[name] !== wanted) fail(`${name}: sources.json pins ${sources.pins.baseline[name]}, package.json ${wanted}`);
  }
  for (const name of Object.keys(sources.pins.baseline)) {
    if (!pkg.devDependencies[name]) fail(`sources.json pins ${name}, which package.json does not install`);
  }
  if (pkg.devDependencies["react-native-skia"]) fail("the baseline must not install both Skia packages");
  if (lock.packages["node_modules/react-native-skia"]) fail("the lockfile contains the unscoped Skia package");
  const canvaskit = lock.packages["node_modules/canvaskit-wasm"]?.version;
  if (canvaskit !== sources.pins.canvaskit) fail(`sources.json records CanvasKit ${sources.pins.canvaskit}, lockfile has ${canvaskit}`);

  const pin = sources.pins.baseline;
  const labels = [
    [/\bReact\s+\*{0,2}(\d+\.\d+\.\d+)/g, pin.react],
    [/\b(?:React Native|RN)\s+\*{0,2}(\d+\.\d+\.\d+)/g, pin["react-native"]],
    [/\bReanimated\s+\*{0,2}(\d+\.\d+\.\d+)/g, pin["react-native-reanimated"]],
    [/\bWorklets\s+\*{0,2}(\d+\.\d+\.\d+)/g, pin["react-native-worklets"]],
    [/\bGesture Handler\s+\*{0,2}(\d+\.\d+\.\d+)/g, pin["react-native-gesture-handler"]],
    [/\bTypeScript\s+\*{0,2}(\d+\.\d+\.\d+)/g, pin.typescript],
    [/(?:(?<!un)scoped Skia|`@shopify\/react-native-skia`)\s+\*{0,2}(\d+\.\d+\.\d+)/g, pin["@shopify/react-native-skia"]],
    [/(?:unscoped Skia|`react-native-skia`)\s+\*{0,2}(\d+\.\d+\.\d+)/g, sources.pins.v3["react-native-skia"]],
  ];
  for (const file of markdown) {
    const text = read(file);
    for (const [pattern, expected] of labels) {
      for (const match of text.matchAll(pattern)) {
        if (match[1] !== expected) fail(`${rel(file)}: "${match[0]}" disagrees with the pinned ${expected}`);
      }
    }
  }

  // The installed Reanimated ships its own support matrix; the baseline must sit inside it.
  const matrix = readJson(path.join(root, "node_modules", "react-native-reanimated", "compatibility.json")).fabric;
  const minor = (value) => value.split(".").slice(0, 2).join(".");
  const row = matrix[`${minor(pin["react-native-reanimated"])}.x`];
  if (!row) fail("installed Reanimated compatibility.json has no row for the pinned minor");
  else {
    if (!row["react-native"].includes(minor(pin["react-native"]))) fail("pinned React Native is outside Reanimated's matrix");
    if (!row["react-native-worklets"].includes(`${minor(pin["react-native-worklets"])}.x`)) fail("pinned Worklets is outside Reanimated's matrix");
  }
});

check("docs/sources.json is complete and well formed", (fail) => {
  if (!sources) return fail("docs/sources.json is missing");
  const ids = new Set();
  const kinds = new Set(["official-docs", "repository", "registry", "specification", "community"]);
  for (const source of sources.sources) {
    for (const field of ["id", "url", "kind", "accessed", "supports"]) {
      if (typeof source[field] !== "string" || source[field].length === 0) fail(`source ${source.id ?? source.url} lacks ${field}`);
    }
    if (ids.has(source.id)) fail(`duplicate source id ${source.id}`);
    ids.add(source.id);
    if (!kinds.has(source.kind)) fail(`source ${source.id} has unknown kind ${source.kind}`);
    if (!isIsoDate(source.accessed)) fail(`source ${source.id} needs an ISO accessed date`);
    if (source.accessed > sources.researchedOn) fail(`source ${source.id} was accessed after researchedOn`);
  }
  const known = new Set(sources.sources.map((source) => source.url));
  for (const file of markdown) {
    for (const url of externalUrls(read(file))) {
      if (!known.has(url)) fail(`${rel(file)} cites ${url}, which docs/sources.json does not record`);
    }
  }
  for (const group of ["claims", "conflicts"]) {
    for (const entry of sources[group]) {
      if (!entry.id || !entry.statement) fail(`${group} entry lacks id or statement`);
      for (const id of entry.evidence ?? []) if (!ids.has(id)) fail(`${group} ${entry.id} cites unknown source ${id}`);
      if (!entry.evidence?.length) fail(`${group} ${entry.id} cites no evidence`);
    }
  }
  const levels = new Set(["documented", "package-metadata", "verified-locally", "inferred"]);
  for (const claim of sources.claims) {
    if (!levels.has(claim.basis)) fail(`claim ${claim.id} has unknown basis ${claim.basis}`);
  }
});

check("evaluation cases cover the required scenarios", (fail) => {
  const evaluationsPath = path.join(root, "tests", "evaluations.json");
  if (!existsSync(evaluationsPath)) return fail("tests/evaluations.json is missing");
  const evaluations = readJson(evaluationsPath);
  const required = [
    "new-animation", "debug-rendering", "optimize-canvas", "integrate-gesture",
    "implement-shader", "game-effect", "expo-project", "bare-react-native-project",
  ];
  const ids = new Set();
  for (const task of evaluations.tasks) {
    if (ids.has(task.id)) fail(`duplicate task id ${task.id}`);
    ids.add(task.id);
    for (const field of ["id", "scenario", "prompt", "project"]) {
      if (typeof task[field] !== "string" || task[field].length < 3) fail(`task ${task.id} lacks ${field}`);
    }
    for (const field of ["expected", "mustNot"]) {
      if (!Array.isArray(task[field]) || task[field].length < 2) fail(`task ${task.id} needs at least two ${field} entries`);
    }
    for (const reference of task.references ?? []) {
      if (!existsSync(path.join(skillDir, reference))) fail(`task ${task.id} names missing reference ${reference}`);
    }
    if (!task.references?.length) fail(`task ${task.id} names no reference`);
  }
  for (const scenario of required) {
    if (!evaluations.tasks.some((task) => task.scenario === scenario)) fail(`no task covers "${scenario}"`);
  }
  if (evaluations.negativeTriggers.length < 4) fail("at least four negative trigger cases are required");
  for (const negative of evaluations.negativeTriggers) {
    if (ids.has(negative.id)) fail(`duplicate id ${negative.id}`);
    ids.add(negative.id);
    if (!negative.prompt || !negative.reason) fail(`negative trigger ${negative.id} needs prompt and reason`);
  }
  if (evaluations.results.comparison !== "not-run" && !Array.isArray(evaluations.results.runs)) {
    fail("recorded comparison results need a runs array");
  }
});

check("public files contain no local paths, secrets or placeholders", (fail) => {
  const patterns = [
    [/\/(?:Users|home)\/[A-Za-z0-9._-]+\//, "user home path"],
    [/[A-Za-z]:\\Users\\/, "Windows home path"],
    [/\/(?:private\/)?tmp\/[\w-]+/, "temporary directory path"],
    [/\b(?:AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9_-]{20,}|xox[abp]-[A-Za-z0-9-]{10,})\b/, "credential-like token"],
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
    [/[A-Za-z0-9._%+-]+@(?!users\.noreply\.github\.com)[A-Za-z0-9-]+\.(?:com|net|org|io|app|dev)\b/, "email address"],
    [/\b(?:TODO|FIXME|TBD|lorem ipsum)\b/i, "placeholder text"],
    [/[ğĞşŞıİ]/, "non-English text"],
  ];
  const selfExempt = new Set(["scripts/validate.mjs"]);
  for (const file of files) {
    const name = rel(file);
    if (name === "package-lock.json" || selfExempt.has(name)) continue;
    const text = read(file);
    // A copyright holder's name is not prose; it may use any alphabet.
    const prose = text.replace(/^Copyright \(c\) .*$/gm, "");
    for (const [pattern, label] of patterns) {
      const match = (label === "non-English text" ? prose : text).match(pattern);
      if (match) fail(`${name}: ${label} (${match[0]})`);
    }
    if (text.trim().length === 0) fail(`${name} is empty`);
  }
  const emptyDirs = [];
  const visit = (dir) => {
    const entries = readdirSync(dir, { withFileTypes: true }).filter((entry) => !["node_modules", ".git", ".validation"].includes(entry.name));
    if (entries.length === 0) emptyDirs.push(rel(dir));
    for (const entry of entries) if (entry.isDirectory()) visit(path.join(dir, entry.name));
  };
  visit(root);
  for (const dir of emptyDirs) fail(`${dir}/ is an empty directory`);
});

let failed = 0;
for (const { name, errors } of results) {
  console.log(`${errors.length === 0 ? "ok  " : "FAIL"} ${name}`);
  for (const error of errors) console.log(`       ${error}`);
  failed += errors.length;
}
console.log(failed === 0 ? `\n${results.length} checks passed` : `\n${failed} problem(s) in ${results.filter((r) => r.errors.length).length} check(s)`);
process.exit(failed === 0 ? 0 : 1);
