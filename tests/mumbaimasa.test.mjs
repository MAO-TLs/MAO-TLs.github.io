import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

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
      assert.equal(row.sourceStatus, "paired", `${name}:${row.key} is not paired`);
    }
  }
  assert.equal(rows, 14_839);
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
