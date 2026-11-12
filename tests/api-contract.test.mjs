// Static contract checks against the installed, pinned declarations.
// Passing means the examples and the prose agree with those typings, not that code runs on a device.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import {
  fixtureExpectations, fixtureProblems, read, rel, root, scopedSkia, skillDir, typeDiagnostics, walk,
} from "../scripts/lib.mjs";

const ts = createRequire(import.meta.url)("typescript");
const examplesDir = path.join(skillDir, "examples");
const fixturesDir = path.join(root, "tests", "fixtures", "api");
const sources = walk(examplesDir).filter((file) => /\.tsx?$/.test(file));
const components = sources.filter((file) => file.endsWith(".tsx"));
const allowedModules = new Set([
  "react", "react-native", scopedSkia, "react-native-reanimated", "react-native-gesture-handler",
]);

const importsOf = (source) =>
  [...source.matchAll(/(?:\bfrom\s+|\bimport\s+|\bimport\(\s*|\brequire\(\s*)["']([^"']+)["']/g)].map((match) => match[1]);
const exportsOf = (source) =>
  [...source.matchAll(/^export (?:async )?(?:function|const|type|interface) (\w+)/gm)].map((match) => match[1]);

function diagnosticsByFile(files) {
  const grouped = new Map(files.map((file) => [file, []]));
  for (const diagnostic of typeDiagnostics(root, files).diagnostics) {
    assert.ok(grouped.has(diagnostic.file), `diagnostic outside the checked files: ${rel(diagnostic.file)}`);
    grouped.get(diagnostic.file).push(diagnostic);
  }
  return grouped;
}

test("examples typecheck against the pinned packages", () => {
  for (const [file, diagnostics] of diagnosticsByFile(sources)) {
    assert.deepEqual(diagnostics.map((d) => `${d.code} ${d.message}`), [], rel(file));
  }
});

test("examples import only supported packages and files inside the skill", () => {
  for (const file of sources) {
    for (const specifier of importsOf(read(file))) {
      if (specifier.startsWith(".")) {
        const target = path.resolve(path.dirname(file), specifier);
        assert.ok(target.startsWith(examplesDir + path.sep), `${rel(file)} imports outside the examples: ${specifier}`);
        assert.ok(sources.some((source) => source.replace(/\.tsx?$/, "") === target), `${rel(file)}: missing ${specifier}`);
      } else {
        assert.ok(allowedModules.has(specifier), `${rel(file)} imports ${specifier}; deep or extra package imports are not allowed`);
      }
    }
  }
});

test("each component file exports exactly its same-named component", () => {
  for (const file of components) {
    assert.deepEqual(exportsOf(read(file)), [path.basename(file, ".tsx")], rel(file));
  }
});

test("components use the helpers that the rendering tests exercise", () => {
  const uses = { RuntimeGlow: "glowSource", PathReveal: "buildRevealPath", StaticGrid: "drawGrid",
    RepeatedSprites: "buildSpriteGrid", BoundedTrail: "traceTrail" };
  for (const [component, helper] of Object.entries(uses)) {
    const source = read(path.join(examplesDir, `${component}.tsx`));
    assert.match(source, new RegExp(`import \\{[^}]*\\b${helper}\\b[^}]*\\} from "\\./graphics"`), `${component} must import ${helper}`);
    assert.match(source.replace(/^import.*$/gm, ""), new RegExp(`\\b${helper}\\b`), `${component} must use ${helper}`);
  }
  assert.match(read(path.join(examplesDir, "BoundedTrail.tsx")), /appendTrail\(/);
});

test("outdated and invented APIs are rejected by the pinned typings", () => {
  const fixtures = walk(path.join(fixturesDir, "rejected"));
  assert.ok(fixtures.length >= 5);
  for (const [file, diagnostics] of diagnosticsByFile(fixtures)) {
    const expectations = fixtureExpectations(read(file), "expect");
    assert.ok(expectations, `${rel(file)} needs an expect header`);
    assert.deepEqual(fixtureProblems(diagnostics, expectations), [], rel(file));
  }
});

test("v3-only APIs are rejected on the scoped 2.x baseline", () => {
  for (const [file, diagnostics] of diagnosticsByFile(walk(path.join(fixturesDir, "v3-only")))) {
    assert.deepEqual(fixtureProblems(diagnostics, fixtureExpectations(read(file), "expect-v2")), [], rel(file));
  }
});

test("v2-only APIs are accepted on the scoped 2.x baseline", () => {
  for (const [file, diagnostics] of diagnosticsByFile(walk(path.join(fixturesDir, "v2-only")))) {
    assert.ok(fixtureExpectations(read(file), "expect-v3"), `${rel(file)} needs an expect-v3 header`);
    assert.deepEqual(diagnostics, [], rel(file));
  }
});

// Symbols that are named in the prose on purpose although they are not installed exports.
const proseExceptions = new Map([
  ["OWNER", "placeholder in the installation command"],
]);

test("API symbols named in the skill exist in the installed declarations", () => {
  const probe = path.join(fixturesDir, "installed-modules.ts");
  const program = ts.createProgram([probe], {
    strict: true, skipLibCheck: true, noEmit: true, jsx: ts.JsxEmit.ReactJSX, types: ["react"],
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
  });
  const checker = program.getTypeChecker();
  const probeSymbol = checker.getSymbolAtLocation(program.getSourceFile(probe));
  const known = new Set();
  let skiaObject;
  for (const namespace of checker.getExportsOfModule(probeSymbol)) {
    const members = checker.getExportsOfModule(checker.getAliasedSymbol(namespace));
    assert.ok(members.length > 20, `${namespace.name} did not resolve`);
    for (const member of members) {
      known.add(member.name);
      if (namespace.name === "skia" && member.name === "Skia") skiaObject = member;
    }
  }
  assert.ok(skiaObject, "the Skia object must be exported");
  for (const file of sources) for (const name of exportsOf(read(file))) known.add(name);

  const resolveChain = (chain) => {
    let type = checker.getTypeOfSymbol(skiaObject);
    for (const part of chain) {
      const property = type.getProperty(part);
      if (!property) return false;
      type = checker.getTypeOfSymbol(property);
    }
    return true;
  };
  assert.equal(resolveChain(["PathBuilder", "Make"]), true);
  assert.equal(resolveChain(["PathBuilder", "Fabricate"]), false, "the chain resolver must reject unknown members");
  assert.equal(known.has("useValue"), false, "the export set must not contain removed hooks");

  const problems = [];
  let checked = 0;
  for (const file of walk(skillDir).filter((candidate) => candidate.endsWith(".md"))) {
    for (const match of read(file).matchAll(/`([^`\n]+)`/g)) {
      const token = match[1];
      const chain = token.match(/^Skia((?:\.\w+)+)(?:\(\))?$/);
      if (chain) {
        checked++;
        if (!resolveChain(chain[1].slice(1).split("."))) problems.push(`${rel(file)}: ${token}`);
      } else if (/^(?:use[A-Z]\w*|[A-Z][A-Za-z0-9]+|[a-z]+[A-Z]\w*)$/.test(token)) {
        checked++;
        if (!known.has(token) && !proseExceptions.has(token)) problems.push(`${rel(file)}: ${token}`);
      }
    }
  }
  assert.ok(checked >= 20, `expected to check the prose symbols, found ${checked}`);
  assert.deepEqual(problems, [], "symbols not found in the pinned packages or the examples");
});
