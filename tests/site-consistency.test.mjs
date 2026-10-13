import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('reader uses the shared script-version label', () => {
  assert.ok(read("public/black-sheep-town/script.html").includes("Script version v1.2.5"));
});

test('GitHub navigation opens this title repository', () => {
  for (const file of ["public/black-sheep-town/index.html","public/black-sheep-town/script.html"]) {
    const text = read(file);
    assert.ok(text.includes('href="https://github.com/MAO-TLs/black-sheep-town">GitHub</a>'), file);
    assert.ok(!text.includes('href="https://github.com/MAO-TLs">GitHub</a>'), file);
  }
});

test('release metadata links to the existing installation section', () => {
  const home = read("public/black-sheep-town/index.html");
  assert.ok(home.includes('href="#install">Installation instructions</a>'));
  assert.ok(home.includes('id="install"'));
  assert.ok(home.includes('Patch version'));
});

test('long installation filenames can wrap on narrow screens', () => {
  const css = read('public/black-sheep-town/styles.css');
  assert.ok(css.includes('.install-steps li > div { min-width: 0; }'));
  assert.ok(css.includes('.install-steps .text-link { max-width: 100%; overflow-wrap: anywhere; }'));
});

