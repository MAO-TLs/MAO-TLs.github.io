import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage is a release index with stable project routing", async () => {
  const home = await read("public/index.html");

  assert.match(home, /<title>MAO Translations — Releases<\/title>/);
  assert.match(
    home,
    /We translate Japanese visual novels into English\./,
  );
  assert.match(home, /<h2 id="releases-title">Releases<\/h2>/);
  assert.match(home, /WHITE<br \/>ALBUM 2/);
  assert.match(home, /English translation · v1\.2\.6/);
  assert.doesNotMatch(home, /English translation · v1\.2\.0/);
  assert.match(home, /href="\/white-album-2\/"/);
  assert.match(home, /77,198 Japanese\/English lines/);
  assert.match(home, /Downloads and instructions/);
  assert.match(home, /<h3>TSUKIHIME<\/h3>/);
  assert.match(home, /English translation · v1\.1\.0/);
  assert.match(home, /href="\/tsukihime\/"/);
  assert.match(home, /14,620 Japanese\/English lines/);
  assert.match(home, /Play online and read/);
  assert.match(home, /href="\/mission\/">Our mission<\/a>/);
  assert.doesNotMatch(home, /id="mission"|The aircraft are already in the air\./);
  assert.doesNotMatch(home, /class="release-state"|>Complete</);
  assert.doesNotMatch(home, /class="brand footer-brand"/);
  assert.match(home, /class="shell footer-note"/);
  assert.doesNotMatch(home, /<footer>[\s\S]*GitHub/i);
  assert.doesNotMatch(home, /brand-mark|release-index/i);
  assert.doesNotMatch(
    home,
    /catalogue|Published work|translation as a complete release/i,
  );
  assert.doesNotMatch(home, /releases\/download/i);
  assert.doesNotMatch(home, /coming soon/i);
});

test("mission is a separate long-form page", async () => {
  const mission = await read("public/mission/index.html");

  assert.match(mission, /<title>MAO Translations — Our Mission<\/title>/);
  assert.match(mission, /id="mission"/);
  assert.match(mission, /MAO TRANSLATIONS:<br \/>OUR MISSION/);
  assert.doesNotMatch(mission, /class="mission-label"/);
  assert.match(
    mission,
    /Our <em>White Album 2<\/em> translation was the Gutenberg moment/,
  );
  assert.match(mission, /The press works\. Full-scale production begins now\./);
  assert.match(
    mission,
    /The first production line runs backward through the inherited[\s\n]+catalog\./,
  );
  assert.match(
    mission,
    /The second production line runs forward into the untranslated[\s\n]+backlog\./,
  );
  assert.equal(
    (mission.match(/class="mission-pair"/g) ?? []).length,
    2,
    "mission should present both directional statements as split pairs",
  );
  assert.match(mission, /aria-label="The two production lines"/);
  assert.match(mission, /The first line: the inherited catalog/);
  assert.match(mission, /We replace it\./);
  assert.match(mission, /The second line: the untranslated backlog/);
  assert.match(mission, /Everything behind us is audited and replaced\./);
  assert.match(mission, /The second line destroys presumed scarcity\./);
  assert.match(
    mission,
    /<strong>The presses are already running\.<\/strong>/,
  );
  assert.doesNotMatch(
    mission,
    /Trinity test|first bomb|second bomb|Enola Gay|Bockscar|aircraft/i,
  );
  assert.doesNotMatch(mission, /THE HOSTILE TRANSLATION DOCTRINE/);
});

test("metadata and public assets use canonical site URLs", async () => {
  const [home, mission, notFound, robots, sitemap, favicon] = await Promise.all([
    read("public/index.html"),
    read("public/mission/index.html"),
    read("public/404.html"),
    read("public/robots.txt"),
    read("public/sitemap.xml"),
    readFile(new URL("../public/favicon.png", import.meta.url)),
  ]);

  assert.match(home, /rel="canonical" href="https:\/\/mao-tls\.github\.io\/"/);
  assert.match(home, /property="og:url" content="https:\/\/mao-tls\.github\.io\/"/);
  assert.match(home, /href="\/styles\.css"/);
  for (const page of [home, mission, notFound]) {
    assert.match(
      page,
      /rel="icon" href="\/favicon\.png" type="image\/png" sizes="512x512"/,
    );
    assert.doesNotMatch(page, /favicon\.svg/);
  }
  assert.deepEqual(
    [...favicon.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
    "favicon should be a valid PNG asset",
  );
  assert.match(
    home,
    /https:\/\/mao-tls\.github\.io\/white-album-2\/wa2-winter-night-960\.webp/,
  );
  assert.match(home, /src="\/tsukihime-moon-clouds\.webp"/);
  assert.match(
    mission,
    /rel="canonical" href="https:\/\/mao-tls\.github\.io\/mission\/"/,
  );
  assert.match(
    mission,
    /property="og:url" content="https:\/\/mao-tls\.github\.io\/mission\/"/,
  );
  assert.match(robots, /Sitemap: https:\/\/mao-tls\.github\.io\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/mao-tls\.github\.io\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/mao-tls\.github\.io\/mission\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/mao-tls\.github\.io\/tsukihime\/<\/loc>/);
});

test("navigation and fallback page remain accessible", async () => {
  const [home, mission, notFound] = await Promise.all([
    read("public/index.html"),
    read("public/mission/index.html"),
    read("public/404.html"),
  ]);

  assert.match(home, /class="skip-link" href="#releases"/);
  assert.match(home, /<nav aria-label="Primary navigation">/);
  assert.match(
    home,
    /href="#releases" aria-current="page">Releases<\/a>[\s\S]*href="\/mission\/">Our mission<\/a>[\s\S]*href="https:\/\/github\.com\/MAO-TLs">GitHub<\/a>/,
  );
  assert.match(
    mission,
    /href="\/#releases">Releases<\/a>[\s\S]*href="\/mission\/" aria-current="page">Our mission<\/a>[\s\S]*href="https:\/\/github\.com\/MAO-TLs">GitHub<\/a>/,
  );
  assert.match(home, /aria-labelledby="releases-title"/);
  assert.match(mission, /aria-labelledby="mission-title"/);
  assert.match(home, /alt="Snowflake over a moonlit winter landscape"/);
  assert.match(home, /alt="Full moon among deep blue clouds"/);
  assert.match(notFound, /meta name="robots" content="noindex"/);
  assert.match(notFound, /href="\/">/);
});

test("stylesheet includes responsive and reduced-motion behavior", async () => {
  const css = await read("public/styles.css");

  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(
    css,
    /\.mission-pair p\s*\{[\s\S]*?padding: 26px 28px 28px;[\s\S]*?text-align: center;/,
  );
  assert.match(css, /\.masthead\s*\{[\s\S]*?min-height: 92px/);
  assert.match(css, /\.brand\s*\{[\s\S]*?line-height: 1\.5/);
  assert.match(css, /--nav-text-size: 13px/);
  assert.match(css, /\.mission-grid\s*\{[\s\S]*?max-width: 820px/);
  assert.match(css, /\.mission-heading\s*\{[\s\S]*?text-align: center/);
  assert.match(css, /\.mission-body p\s*\{[\s\S]*?line-height: 1\.74/);
  assert.match(css, /\.mission-body > p\s*\{[\s\S]*?text-align: justify/);
  assert.match(
    css,
    /\.masthead nav\s*\{[\s\S]*?font-size: var\(--nav-text-size\)/,
  );
  assert.match(
    css,
    /\.footer-note\s*\{[\s\S]*?justify-content: center/,
  );
  assert.match(
    css,
    /\.footer-note p\s*\{[\s\S]*?max-width: 960px[\s\S]*?font-size: var\(--nav-text-size\)[\s\S]*?text-align: center/,
  );
  assert.doesNotMatch(
    css,
    /\.release-state|\.footer-brand|\.footer-link|\.mission-label/,
  );
  assert.match(
    css,
    /@media \(max-width: 640px\)[\s\S]*?\.masthead\s*\{[\s\S]*?min-height: 74px/,
  );
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /a:focus-visible/);
});

test("Pages workflow validates and publishes only the public directory", async () => {
  const workflow = await read(".github/workflows/pages.yml");

  assert.match(workflow, /run: npm test/);
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /enablement: true/);
  assert.match(workflow, /path: public/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
});
