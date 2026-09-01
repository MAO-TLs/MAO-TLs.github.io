import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage is a chronological release grid with stable project routing", async () => {
  const [home, css] = await Promise.all([
    read("public/index.html"),
    read("public/styles.css"),
  ]);

  assert.match(home, /<title>MAO Translations — Releases<\/title>/);
  assert.match(
    home,
    /We translate Japanese visual novels into English\./,
  );
  assert.match(home, /<h2 id="releases-title">Releases<\/h2>/);
  assert.match(home, /CROSS†<br \/>CHANNEL/);
  assert.match(home, /Translation audit · annotated edition/);
  assert.match(home, /href="\/cross-channel\/"/);
  assert.match(home, /38,637 units/);
  assert.match(home, /6,978 passages/);
  assert.match(home, /Read the audits/);
  assert.match(home, /George Henry Shaft’s English/);
  assert.doesNotMatch(home, /50,942|MAO English v1\.0\.0|Downloads, script, and audits|complete MAO English/i);
  assert.match(home, /BLACK<br \/>SHEEP<br \/>TOWN/);
  assert.match(home, /English translation · v1\.2\.1[\s\S]*?BLACK<br \/>SHEEP<br \/>TOWN/);
  assert.match(home, /href="\/black-sheep-town\/"/);
  assert.match(home, /29,753 Japanese\/English lines/);
  assert.match(home, /<dt>Includes<\/dt>\s*<dd>Full game<\/dd>/);
  assert.match(home, /verified Steam Windows\/Wine installer/);
  assert.doesNotMatch(home, /dual-version|Steam\/retail|Japanese\/English rows/);
  assert.match(home, /WHITE<br \/>ALBUM 2/);
  assert.match(home, /English translation · v1\.3\.6/);
  assert.match(home, /href="\/white-album-2\/"/);
  assert.match(home, /77,198 Japanese\/English lines/);
  assert.match(home, /Downloads and instructions/);
  assert.match(home, /<h3>TSUKIHIME<\/h3>/);
  assert.match(home, /English translation · v1\.2\.1[\s\S]*?<h3>TSUKIHIME<\/h3>/);
  assert.equal(
    (home.match(/English translation · v1\.2\.1/g) ?? []).length,
    2,
    "homepage should publish v1.2.1 for BLACK SHEEP TOWN and Tsukihime",
  );
  assert.match(home, /href="\/tsukihime\/"/);
  assert.match(home, /14,620 Japanese\/English lines/);
  assert.match(home, /Play online and read/);
  assert.match(home, /class="release-catalog"/);
  assert.match(css, /\.release-catalog\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s);
  assert.ok(home.indexOf("CROSS†<br />CHANNEL") < home.indexOf("BLACK<br />SHEEP<br />TOWN"));
  assert.ok(home.indexOf("BLACK<br />SHEEP<br />TOWN") < home.indexOf("<h3>TSUKIHIME</h3>"));
  assert.ok(home.indexOf("<h3>TSUKIHIME</h3>") < home.indexOf("WHITE<br />ALBUM 2"));
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
  assert.match(home, /<section class="testimonials" aria-label="Independent assessments">/);
  assert.match(
    home,
    /MAO Translations introduced the first full-scale agentic visual novel\s*translation workflow in the summer of 2026\. We apply it in both\s*directions: to bring works from the untranslated backlog into English,\s*and to audit and replace inherited translations that do not survive\s*comparison against the Japanese\./,
  );
  assert.equal((home.match(/<figure class="testimonial">/g) ?? []).length, 2);
  assert.match(home, /There are many depressing moments of what most people would/);
  assert.match(home, /Carter “Quof” Collins/);
  assert.match(home, /professional translator\s*of <em>Ascendance of a Bookworm<\/em> and\s*<em>Lazy Dungeon Master<\/em>/);
  assert.match(home, /on MAO Translations’ English\s*translation of <em>BLACK SHEEP TOWN<\/em>/);
  assert.match(home, /Far superior to the existing Todokanai TL… the definitive way/);
  assert.match(home, /href="https:\/\/www\.reddit\.com\/user\/gambs\/"/);
  assert.match(home, /<strong>gambs<\/strong>/);
  assert.match(home, /<em>r\/visualnovels<\/em> head moderator,\s*JLPT N1 \+ Kanken 2/);
  assert.match(home, /on MAO Translations’ English translation of\s*<em>WHITE ALBUM 2<\/em>/);
  assert.ok(home.indexOf('class="testimonials"') > home.indexOf('class="release-catalog"'));
  assert.ok(home.indexOf('class="testimonials"') < home.indexOf("<footer>"));
  assert.match(home, /The original works and all associated trademarks\s*belong to their respective owners\./);
  assert.match(css, /\.testimonial-grid\s*\{[^}]*grid-template-columns: repeat\(2,/s);
  assert.match(
    css,
    /\.testimonial-intro\s*\{[^}]*margin: 0 auto 40px;[^}]*border-top: 1px solid var\(--line\);[^}]*border-bottom: 1px solid var\(--line\);[^}]*background: var\(--paper\);[^}]*font-family: var\(--serif\);[^}]*font-size: clamp\(28px, 2\.6vw, 36px\);[^}]*text-align: center;/s,
  );
  assert.match(
    css,
    /@media \(max-width: 640px\)[\s\S]*\.testimonial-intro\s*\{[^}]*font-size: clamp\(28px, 8\.5vw, 38px\);/,
  );
  assert.match(css, /\.testimonial blockquote\s*\{[^}]*font-family: var\(--serif\);/s);
});

test("BLACK SHEEP TOWN uses canonical routes and shared MAO header metrics", async () => {
  const [release, script, css] = await Promise.all([
    read("public/black-sheep-town/index.html"),
    read("public/black-sheep-town/script.html"),
    read("public/black-sheep-town/styles.css"),
  ]);

  for (const page of [release, script]) {
    assert.doesNotMatch(page, /href="index(?:\.html)?(?:#install)?"/);
    assert.match(page, /class="wordmark" href="\/">MAO Translations<\/a>/);
    assert.match(page, /href="\/black-sheep-town\/"/);
    assert.match(page, /rel="icon" href="favicon\.svg" type="image\/svg\+xml"/);
    assert.match(
      page,
      /href="https:\/\/github\.com\/MAO-TLs\/black-sheep-town">GitHub<\/a>/,
    );
    assert.doesNotMatch(page, /class="nav-links"[^>]*>[\s\S]*?>Install<\/a>/);
  }
  assert.match(
    release,
    /rel="canonical" href="https:\/\/mao-tls\.github\.io\/black-sheep-town\/"/,
  );
  assert.match(release, /Download complete release/);
  assert.match(release, /<span class="release-label">Status<\/span><strong class="release-status">Complete<\/strong>/);
  assert.match(release, /<p class="eyebrow">Read online<\/p>/);
  assert.match(release, /<p class="eyebrow">Installation<\/p><h2>How to install the patch<\/h2>/);
  assert.match(script, /Script Version v1\.2\.1/);
  assert.match(script, /29,753 release lines/);
  assert.doesNotMatch(`${release}\n${script}`, /Read offline|Patch available|Game patch|Install v1\.1\.2|Read the script|release rows|matching row|retail release/i);
  assert.match(
    release,
    /window\.location\.pathname === "\/black-sheep-town\/index\.html"[\s\S]*?window\.location\.replace\(`\/black-sheep-town\/\$\{window\.location\.search\}\$\{window\.location\.hash\}`\)/,
  );
  assert.doesNotMatch(script, /sectionSelect|>Section<|>Complete script</);
  assert.match(
    css,
    /body \{[^}]*font-family: var\(--sans\);[^}]*line-height: 1\.5;/,
  );
});

test("BLACK SHEEP TOWN renders shipped tags, Tips, and bilingual speaker labels", async () => {
  const [app, dataScript, css, script] = await Promise.all([
    read("public/black-sheep-town/app.js"),
    read("public/black-sheep-town/data.js"),
    read("public/black-sheep-town/styles.css"),
    read("public/black-sheep-town/script.html"),
  ]);
  const data = JSON.parse(
    dataScript.trim().replace(/^window\.BST_BROWSER_DATA=/, "").replace(/;$/, ""),
  );
  const tagNames = new Set();
  const tipGroupIds = new Set();
  for (const scenario of data.scenarios) {
    for (const row of scenario.rows) {
      for (const value of [row.jp, row.en]) {
        for (const match of value.matchAll(/<\/?([A-Za-z][A-Za-z0-9_-]*)(?:=[^>]*)?>/g)) {
          tagNames.add(match[1].toLowerCase());
        }
        for (const match of value.matchAll(/<tips=([^>]*)>/g)) tipGroupIds.add(match[1]);
      }
    }
  }

  assert.deepEqual([...tagNames].sort(), ["ruby", "speed", "tips"]);
  assert.equal(tipGroupIds.size, 97);
  assert.equal(data.tipCount, 211);
  assert.equal(data.tipGroupCount, 98);
  assert.equal(Object.keys(data.tipGroups).length, 98);
  for (const groupId of tipGroupIds) {
    assert.ok(data.tipGroups[groupId]?.length, `missing Tips group ${groupId}`);
    for (const entry of data.tipGroups[groupId]) {
      assert.ok(entry.needFiles.length);
      for (const language of ["ja", "en"]) {
        assert.ok(entry[language].title.trim());
        assert.ok(entry[language].text.trim());
      }
    }
  }
  assert.match(app, /<speed\(\?:=\[\^>\]\*\)\?>/);
  assert.match(app, /tipTrigger\(match\[3\], match\[4\], language, scenarioIndex\)/);
  assert.match(app, /data\.tipGroups\?\.\[groupId\]/);
  assert.match(app, /eligible\[0\] \|\| group\[0\]/);
  assert.match(app, /el\("button", "tip-trigger"\)/);
  assert.match(app, /localized\.title/);
  assert.match(app, /localized\.text/);
  assert.match(app, /aria-expanded/);
  assert.match(css, /\.tip-trigger/);
  assert.match(css, /rgba\(45,106,160,/);
  assert.match(css, /\.tip-preview/);
  assert.match(script, /id="showTips" type="checkbox" checked/);
  assert.match(script, />Display Tips<\/span>/);
  assert.match(app, /showTips: localStorage\.getItem\("bst-show-tips"\) !== "false"/);
  assert.match(app, /if \(!state\.showTips\) return null/);
  assert.match(app, /\$\("showTips"\)\.checked = state\.showTips/);
  assert.match(app, /localStorage\.setItem\("bst-show-tips", String\(state\.showTips\)\)/);
  assert.match(app, /language === "ja" \? row\.speaker\?\.id : row\.speaker\?\.displayName/);
  assert.match(app, /speakerHeading\(row, "ja"\)/);
  assert.match(app, /speakerHeading\(row, "en"\)/);
  assert.match(app, /speakerHeading\(hit\.row, "ja"\)/);
  assert.match(app, /speakerHeading\(hit\.row, "en"\)/);
  assert.doesNotMatch(app, /showSpeakers|hide-speakers|confidence-dot/);
  assert.match(app, /el\("div", "line-ref", `\$\{row\.rowIndex\}`\)/);
  assert.doesNotMatch(app, /line-ref", `r\$\{/);

  assert.doesNotMatch(script, /Show speaker names|showSpeakers/);
  assert.ok(data.scenarios.every((scenario) => !("title" in scenario)));
  assert.match(app, /`\$\{String\(i \+ 1\)\.padStart\(2,"0"\)\} · \$\{scenario\.code\}`/);
});

test("BLACK SHEEP TOWN v1.2.1 is bound to the verified Steam-only release", async () => {
  const [siteManifestText, browserManifestText, release] = await Promise.all([
    read("public/black-sheep-town/site_manifest.json"),
    read("public/black-sheep-town/browser_manifest.json"),
    read("public/black-sheep-town/index.html"),
  ]);
  const siteManifest = JSON.parse(siteManifestText);
  const browserManifest = JSON.parse(browserManifestText);
  const archiveHash = "4f09ec06e718a205cd3cbb4fabd9ba755c72b30f6117e16ba3165718f333af22";

  assert.equal(siteManifest.release, "v1.2.1");
  assert.equal(siteManifest.status, "installer_static_verified_steam_release_site");
  assert.deepEqual(siteManifest.supported_builds, ["steam-build-13300478"]);
  assert.equal(siteManifest.archive.bytes, 7058547);
  assert.equal(siteManifest.archive.sha256, archiveHash);
  assert.equal(siteManifest.checks.retail_payload_absent, true);
  assert.equal(siteManifest.checks.runtime_evidence_bound, false);
  assert.equal(siteManifest.checks.runtime_validation_waived, true);
  assert.equal(browserManifest.patch_publication.archive_sha256, archiveHash);
  assert.equal(browserManifest.patch_publication.archive_bytes, 7058547);
  assert.equal((release.match(new RegExp(archiveHash, "g")) ?? []).length, 2);
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
  const [home, mission, notFound, robots, sitemap, favicon, crossHero] = await Promise.all([
    read("public/index.html"),
    read("public/mission/index.html"),
    read("public/404.html"),
    read("public/robots.txt"),
    read("public/sitemap.xml"),
    readFile(new URL("../public/favicon.png", import.meta.url)),
    readFile(new URL("../public/cross-channel-tower-hero-v1.png", import.meta.url)),
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
  assert.deepEqual(
    [...crossHero.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
    "CROSS†CHANNEL homepage art should be a valid PNG asset",
  );
  assert.match(home, /src="\/cross-channel-tower-hero-v1\.png"/);
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
  assert.match(sitemap, /<loc>https:\/\/mao-tls\.github\.io\/black-sheep-town\/<\/loc>/);
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
  assert.match(home, /alt="Black ink linework of a dense city street"/);
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
