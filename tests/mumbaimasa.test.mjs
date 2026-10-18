import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { batchEnd } from "../public/mumbaimasa/script/reader.mjs";

const root = new URL("../public/", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("MUMBAImasa remains a hidden reader-only release", async () => {
  const [home, release, reader] = await Promise.all([
    read("index.html"),
    read("mumbaimasa/index.html"),
    read("mumbaimasa/script/index.html"),
  ]);

  assert.doesNotMatch(home, /mumbaimasa/i);
  assert.match(release, /Patch in development/);
  assert.match(release, /14,839/);
  assert.match(release, /<dt>Project Lead<\/dt><dd>MAO<\/dd>/);
  assert.match(release, /<dt>Translator<\/dt><dd>GPT-6 Astra<\/dd>/);
  assert.match(release, /<dt>Special Thanks<\/dt><dd>gambs<\/dd>/);
  assert.match(reader, /Search Hinglish or 日本語/);
  assert.doesNotMatch(reader, /Search English/i);
});

test("MUMBAImasa publishes the complete bilingual corpus", async () => {
  const index = JSON.parse(await read("mumbaimasa/data/index.json"));
  const scripts = await readdir(new URL("mumbaimasa/data/scripts/", root));

  assert.equal(index.scripts, 882);
  assert.equal(index.passages, 14_839);
  assert.deepEqual(index.sourceCells, { paired: 14_839 });
  assert.equal(scripts.filter((name) => name.endsWith(".json")).length, 882);

  let rows = 0;
  for (const name of scripts) {
    if (!name.endsWith(".json")) continue;
    const script = JSON.parse(await read(`mumbaimasa/data/scripts/${name}`));
    for (const row of script.rows) {
      rows += 1;
      if (row.en?.html?.trim()) {
        assert.ok(row.ja?.html?.trim(), `${name}:${row.key} is missing Japanese`);
      }
      assert.doesNotMatch(row.en?.html ?? "", /<ruby\b/i, `${name}:${row.key} has English furigana`);
      assert.equal(row.sourceStatus, "paired", `${name}:${row.key} is not paired`);
    }
  }
  assert.equal(rows, 14_839);
});

test("MUMBAImasa renders a complete scene instead of hiding it after 80 passages", () => {
  assert.equal(batchEnd(0, 174, false), 174);
  assert.equal(batchEnd(0, 174, true), 80);
  assert.equal(batchEnd(80, 174, true), 160);
});

test("MUMBAImasa repeats its fixed sword maxim consistently", async () => {
  const cases = [
    ["md03_023", "12", "Here lies the law of the sword!"],
    ["md04_039", "27", "HERE LIES THE LAW OF THE SWORD!!"],
    ["md04_047vs", "13", "Here lies the law of the sword."],
    ["md05_006", "7", "Here lies the law of the sword."],
  ];
  for (const [script, key, expected] of cases) {
    const doc = JSON.parse(await read(`mumbaimasa/data/scripts/${script}.json`));
    const row = doc.rows.find((candidate) => candidate.key === key);
    assert.ok(row.en.text.includes(expected), `${script}:${key} does not use the fixed formula`);
  }
});

test("MUMBAImasa public copy contains no internal source-process disclaimers", async () => {
  const pages = [
    await read("mumbaimasa/index.html"),
    await read("mumbaimasa/script/index.html"),
    await read("mumbaimasa/script/reader.mjs"),
  ].join("\n");

  assert.doesNotMatch(
    pages,
    /withheld|nonsexual adaptation|verified source block|invented sentence alignment|conservatively flagged|unbound opening/i,
  );
});
