// Network check: re-tests the machine-checkable compatibility claims in docs/sources.json
// against live registries and documentation. A failure means the research is stale, not
// that the expected value should be edited to match.
import path from "node:path";
import { readJson, root } from "./lib.mjs";

const { claims, sources, researchedOn } = readJson(path.join(root, "docs", "sources.json"));
const sourceUrl = (id) => sources.find((source) => source.id === id).url;
const cache = new Map();

async function get(url, options = {}) {
  const key = `${options.redirect ?? "follow"} ${url}`;
  if (!cache.has(key)) {
    cache.set(key, fetch(url, {
      redirect: options.redirect ?? "follow", signal: AbortSignal.timeout(45000),
      headers: { "user-agent": "react-native-skia-skills-source-check" },
    }).then(async (response) => ({ status: response.status, url: response.url, location: response.headers.get("location"), text: await response.text() })));
  }
  return cache.get(key);
}
const registry = async (name) => JSON.parse((await get(`https://registry.npmjs.org/${name.replace("/", "%2f")}`)).text);
const pageText = (html) => html.replace(/<[^>]*>/g, " ").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&#x27;/g, "'").replace(/\s+/g, " ");

const checks = {
  async "npm-dist-tag"({ package: name, tag, equals }) {
    const actual = (await registry(name))["dist-tags"][tag];
    return actual === equals ? null : `dist-tag ${tag} is ${actual}, expected ${equals}`;
  },
  async "npm-majors"({ package: name, includes, excludes = [] }) {
    const majors = new Set(Object.keys((await registry(name)).versions).filter((v) => !v.includes("-")).map((v) => Number(v.split(".")[0])));
    const missing = includes.filter((major) => !majors.has(major));
    const present = excludes.filter((major) => majors.has(major));
    return missing.length || present.length ? `stable majors are ${[...majors].sort()}` : null;
  },
  async "npm-peer"({ package: name, version, peer, equals }) {
    const actual = (await registry(name)).versions[version]?.peerDependencies?.[peer];
    return actual === equals ? null : `peer ${peer} of ${name}@${version} is ${actual}, expected ${equals}`;
  },
  async "npm-version"({ package: name, version }) {
    return (await registry(name)).versions[version] ? null : `${name}@${version} is not published`;
  },
  async redirect({ from, to }) {
    const response = await get(from);
    return response.url.replace(/\/$/, "") === to ? null : `${from} resolves to ${response.url}, expected ${to}`;
  },
  async "json-fields"({ source, fields }) {
    const json = JSON.parse((await get(sourceUrl(source))).text);
    const wrong = Object.entries(fields).filter(([key, value]) => json[key] !== value).map(([key]) => `${key}=${json[key]}`);
    return wrong.length ? `differs: ${wrong.join(", ")}` : null;
  },
  async "page-contains"({ source, phrases }) {
    const text = pageText((await get(sourceUrl(source))).text);
    const missing = phrases.filter((phrase) => !text.includes(phrase));
    return missing.length ? `page no longer contains: ${missing.map((p) => JSON.stringify(p)).join(", ")}` : null;
  },
  async "matrix-row"({ source, header, row }) {
    const text = pageText((await get(sourceUrl(source))).text);
    const missing = [header, row].filter((cells) => !text.includes(cells));
    return missing.length ? `support table changed; missing ${missing.map((cells) => JSON.stringify(cells)).join(" and ")}` : null;
  },
  async status({ url, equals }) {
    const response = await get(url);
    return response.status === equals ? null : `status is ${response.status}, expected ${equals}`;
  },
};

let failed = 0;
let checked = 0;
for (const claim of claims) {
  if (!claim.check) continue;
  checked++;
  let problem;
  try {
    const run = checks[claim.check.type];
    problem = run ? await run(claim.check) : `unknown check type ${claim.check.type}`;
  } catch (error) {
    problem = `could not be checked: ${error.message}`;
  }
  console.log(`${problem ? "FAIL" : "ok  "} ${claim.id}${problem ? `\n       ${problem}` : ""}`);
  if (problem) failed++;
}
const manual = claims.filter((claim) => !claim.check).length;
console.log(`\n${checked - failed}/${checked} live claims still hold (researched ${researchedOn}); ${manual} claims have no automated check`);
process.exit(failed === 0 ? 0 : 1);
