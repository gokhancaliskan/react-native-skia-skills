// Network check: every external URL cited in Markdown or recorded in docs/sources.json must respond.
// Kept out of `npm run check` because it depends on third-party availability.
import path from "node:path";
import { externalUrls, read, readJson, rel, root, walk } from "./lib.mjs";

const cited = new Map();
for (const file of walk(root).filter((candidate) => candidate.endsWith(".md"))) {
  for (const url of externalUrls(read(file))) cited.set(url, [...(cited.get(url) ?? []), rel(file)]);
}
const recorded = readJson(path.join(root, "docs", "sources.json")).sources;
for (const source of recorded) {
  if (source.status === "unavailable") continue;
  cited.set(source.url, [...(cited.get(source.url) ?? []), "docs/sources.json"]);
}

async function probe(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        redirect: "follow", signal: AbortSignal.timeout(30000),
        headers: { "user-agent": "react-native-skia-skills-link-check", accept: "text/html,application/json,*/*" },
      });
      await response.arrayBuffer();
      if (response.ok) return { ok: true, status: response.status, finalUrl: response.url };
      if (response.status < 500 && response.status !== 429) return { ok: false, status: response.status };
    } catch (error) {
      if (attempt === 3) return { ok: false, status: error.name };
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
  }
  return { ok: false, status: "retries exhausted" };
}

const urls = [...cited.keys()].sort();
const failures = [];
const queue = [...urls];
await Promise.all(Array.from({ length: 6 }, async () => {
  for (let url = queue.shift(); url; url = queue.shift()) {
    const result = await probe(url);
    console.log(`${result.ok ? "ok  " : "FAIL"} ${result.status} ${url}`);
    if (!result.ok) failures.push(`${url} (${result.status}) cited in ${[...new Set(cited.get(url))].join(", ")}`);
  }
}));

const unavailable = recorded.filter((source) => source.status === "unavailable");
for (const source of unavailable) console.log(`skip recorded as unavailable: ${source.url}`);
console.log(`\n${urls.length - failures.length}/${urls.length} links responded`);
for (const failure of failures) console.log(`  broken: ${failure}`);
process.exit(failures.length === 0 ? 0 : 1);
