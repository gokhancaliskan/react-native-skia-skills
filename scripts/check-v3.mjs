// Typechecks the examples against unscoped react-native-skia 3.x in a throwaway project.
// Only the import specifier is rewritten. The scoped package is never installed there,
// so no environment ever holds both native modules.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  fixtureExpectations, fixtureProblems, read, readJson, root, run, scopedSkia, skillDir, typeDiagnostics, unscopedSkia, walk,
} from "./lib.mjs";

const keep = process.argv.includes("--keep");
const pkg = readJson(path.join(root, "package.json"));
const { pins } = readJson(path.join(root, "docs", "sources.json"));
const version = pins.v3[unscopedSkia];
const work = mkdtempSync(path.join(tmpdir(), "rn-skia-skill-v3-"));
const problems = [];

function rewrite(sourceDir, targetDir) {
  let rewritten = 0;
  for (const file of walk(sourceDir).filter((candidate) => /\.tsx?$/.test(candidate))) {
    const original = read(file);
    const changed = original.replaceAll(`"${scopedSkia}"`, `"${unscopedSkia}"`);
    const differing = original.split("\n").filter((line, i) => line !== changed.split("\n")[i]);
    if (differing.some((line) => !line.includes(`"${scopedSkia}"`))) problems.push(`${file}: rewrite touched more than an import specifier`);
    if (changed.includes("@shopify/")) problems.push(`${file}: scoped reference survived the rewrite`);
    rewritten += differing.length;
    const target = path.join(targetDir, path.relative(sourceDir, file));
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, changed);
  }
  return rewritten;
}

try {
  const dependencies = { ...pkg.devDependencies, [unscopedSkia]: version };
  delete dependencies[scopedSkia];
  delete dependencies.yaml;
  writeFileSync(path.join(work, "package.json"), `${JSON.stringify({ name: "v3-check", private: true, devDependencies: dependencies }, null, 2)}\n`);
  console.log(`Installing ${unscopedSkia}@${version} into a temporary project (lifecycle scripts disabled)...`);
  const install = run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--loglevel=error"], { cwd: work });
  if (install.status !== 0) throw new Error(`npm install failed:\n${install.stdout}\n${install.stderr}`);

  const installed = readJson(path.join(work, "node_modules", unscopedSkia, "package.json")).version;
  if (installed !== version) problems.push(`installed ${unscopedSkia}@${installed}, wanted ${version}`);
  if (existsSync(path.join(work, "node_modules", "@shopify", "react-native-skia"))) problems.push("the scoped package is present in the v3 project");

  const imports = rewrite(path.join(skillDir, "examples"), path.join(work, "examples"));
  rewrite(path.join(root, "tests", "fixtures", "api"), path.join(work, "fixtures"));
  if (imports < 5) problems.push(`only ${imports} import lines were rewritten`);

  const group = (dir) => walk(path.join(work, dir)).filter((file) => /\.tsx?$/.test(file));
  const byFile = (files) => {
    const grouped = new Map(files.map((file) => [file, []]));
    for (const d of typeDiagnostics(work, files).diagnostics) {
      if (grouped.has(d.file)) grouped.get(d.file).push(d);
      else problems.push(`diagnostic outside the checked files: ${d.file}:${d.line} ${d.code}`);
    }
    return grouped;
  };
  const label = (file) => path.relative(work, file);

  for (const [file, diagnostics] of byFile(group("examples"))) {
    for (const d of diagnostics) problems.push(`${label(file)}:${d.line} ${d.code} ${d.message}`);
  }
  console.log(`examples: ${group("examples").length} files typechecked against ${unscopedSkia}@${installed} (${imports} import lines rewritten)`);

  const expectFailures = (dir, key) => {
    for (const [file, diagnostics] of byFile(group(dir))) {
      const expectations = fixtureExpectations(readFileSync(file, "utf8"), key);
      if (!expectations) problems.push(`${label(file)} lacks a "${key}" header`);
      else for (const problem of fixtureProblems(diagnostics, expectations)) problems.push(`${label(file)}: ${problem}`);
    }
    console.log(`${dir}: rejected as expected`);
  };
  expectFailures("fixtures/rejected", "expect");
  expectFailures("fixtures/v2-only", "expect-v3");
  for (const [file, diagnostics] of byFile(group("fixtures/v3-only"))) {
    for (const d of diagnostics) problems.push(`${label(file)}:${d.line} should be valid on v3: ${d.code} ${d.message}`);
  }
  console.log("fixtures/v3-only: accepted as expected");
} catch (error) {
  problems.push(error.message);
} finally {
  if (keep) console.log(`kept ${work}`);
  else rmSync(work, { recursive: true, force: true });
}

for (const problem of problems) console.log(`FAIL ${problem}`);
console.log(problems.length === 0
  ? "\nv3 typecheck passed. This covers declarations only: no Graphite, device or runtime behaviour was exercised."
  : `\n${problems.length} problem(s)`);
process.exit(problems.length === 0 ? 0 : 1);
