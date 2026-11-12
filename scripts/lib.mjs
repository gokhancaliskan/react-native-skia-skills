import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const skillName = "react-native-skia";
export const skillDir = path.join(root, "skills", skillName);
export const scopedSkia = "@shopify/react-native-skia";
export const unscopedSkia = "react-native-skia";

const ignoredDirs = new Set(["node_modules", ".git", ".validation", "coverage"]);

export const read = (file) => readFileSync(file, "utf8");
export const readJson = (file) => JSON.parse(read(file));
export const rel = (file) => path.relative(root, file).split(path.sep).join("/");

export function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name) || entry.name === ".DS_Store") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files.sort();
}

export function stripCode(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
}

export function markdownLinks(markdown) {
  const links = [];
  for (const match of stripCode(markdown).matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) links.push(match[1]);
  return links;
}

export function externalUrls(text) {
  const urls = new Set();
  for (const match of text.matchAll(/https?:\/\/[^\s)>"'`\]]+/g)) urls.add(match[0].replace(/[.,;:]+$/, ""));
  // OWNER is the documented placeholder for the future GitHub account; such URLs cannot exist yet.
  return [...urls].filter((url) => !url.includes("/OWNER/"));
}

export function headingAnchors(markdown) {
  const anchors = new Set();
  for (const match of markdown.matchAll(/^#{1,6}\s+(.+)$/gm)) {
    anchors.add(match[1].trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-"));
  }
  return anchors;
}

export const compilerFlags = [
  "--ignoreConfig", "--noEmit", "--pretty", "false", "--strict", "--skipLibCheck", "--jsx", "react-jsx",
  "--target", "ES2022", "--module", "ESNext", "--moduleResolution", "Bundler",
  "--lib", "ES2022", "--types", "react", "--allowImportingTsExtensions",
];

// Runs the TypeScript compiler installed in `cwd` and returns structured diagnostics.
export function typeDiagnostics(cwd, files) {
  const tsc = path.join(cwd, "node_modules", "typescript", "bin", "tsc");
  const result = spawnSync(process.execPath, [tsc, ...compilerFlags, ...files], { cwd, encoding: "utf8" });
  if (result.error) throw result.error;
  const diagnostics = [];
  const unparsed = [];
  for (const line of `${result.stdout}\n${result.stderr}`.split("\n")) {
    const match = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/);
    if (match) {
      diagnostics.push({ file: path.resolve(cwd, match[1]), line: Number(match[2]), code: match[4], message: match[5] });
    } else if (/error TS\d+/.test(line)) unparsed.push(line);
  }
  if (unparsed.length > 0) throw new Error(`Unlocated compiler errors:\n${unparsed.join("\n")}`);
  return { status: result.status, diagnostics };
}

// Fixture headers look like `// expect: TS2305 useValue | TS2339 moveTo`.
export function fixtureExpectations(source, key) {
  const match = source.match(new RegExp(`^// ${key}: (.+)$`, "m"));
  if (!match) return null;
  return match[1].split("|").map((item) => {
    const [code, ...rest] = item.trim().split(" ");
    return { code, text: rest.join(" ") };
  });
}

// A fixture passes only when every expected error occurs and nothing else is reported.
export function fixtureProblems(diagnostics, expectations) {
  const problems = [];
  const matches = (d, e) => d.code === e.code && d.message.includes(e.text);
  for (const e of expectations) {
    if (!diagnostics.some((d) => matches(d, e))) problems.push(`missing ${e.code} mentioning "${e.text}"`);
  }
  for (const d of diagnostics) {
    if (!expectations.some((e) => matches(d, e))) problems.push(`unexpected ${d.code} at line ${d.line}: ${d.message}`);
  }
  return problems;
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error) throw result.error;
  return result;
}
