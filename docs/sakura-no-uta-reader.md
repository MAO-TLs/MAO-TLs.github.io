# Sakura no Uta release and reader

The release and reader live at `/sakura-no-uta/` and `/sakura-no-uta/script/`.
Version 1.0.0 publishes 285 scripts and 65,164 passages. The Japanese is checked
against the immutable game source; English is checked against the final
manuscript and the installed patch projection. Choices and displayed speaker
names match the patch. Private editorial notes and drafts are not exported.
The homepage includes the release card. Release assets are attached to
`sakura-no-uta-v1.0.0` in this repository; `patch-release.json` records the ZIP
and patch checksums and the supported Re:Graphic 10th Anniversary edition.

## Updating the reviewed corpus

Use the existing reader schema, not sentence-by-sentence guessing:

- `public/sakura-no-uta/data/index.json`: `scripts`, `passages`, `sections` (string
  IDs), `sectionLabels`, `scriptsIndex` entries `{id, title, section, count,
  sha256}`. IDs must be unique.
- `data/scripts/<id>.json`: `{rows: [{key, ja: {text, html}, en: {text, html}}]}`.
  `key` is a stable source-block key. Both languages must be present.
- `data/search.json`: `[{script, key, ja, en}]`, with plain text string fields.
  Counts and references must match the script files exactly.
- HTML must be escaped and allowlisted by the exporter before publication.
  The renderer accepts presentation markup, not arbitrary source HTML.
- Keep the original Japanese intact; no furigana in English. Preserve paragraph
  boundaries. Use the established `speech`, `speaker`, and choice classes.
- Whole-word English search, Japanese phrase search, deep links, current/all
  scopes, complete current-script rendering and browser Back are already wired.
- Corpus accounting checks all 65,164 passages, their search records, all 285
  script checksums, 524 Japanese ruby spans and 17 choice blocks.
- This title has no comparator translation or comparative audit. Those controls
  are absent; the ordinary Japanese/MAO view has no redundant edition headings.
- Installation, update, removal and troubleshooting guidance covers the single
  overlay file. The ZIP contains that file, README.txt and SHA256SUMS.txt, and
  no game executable or Wine runtime. Native Windows and a full manual
  playthrough remain unverified; opening/wrapping was checked in Wine on macOS.
- Run `npm test`, then inspect release and reader pages at desktop and mobile
  sizes, search both languages, and follow a result into context and back.

## Theme and image

The shared publication/reader styles are identical to the MAO templates;
`styles.css` changes the palette and hero presentation only. The hero image is
original AI-generated background art, with no character or third-party image
included. Generated using the built-in image tool on 2026-10-23.

Prompt: Original wide anime visual-novel background of sakura blossoms against
an extremely light powder-blue spring sky, luminous white sunlight, delicate
blush-pink flowers, branches framing the upper edge and right side, distant
flowering trees, a few drifting petals, and quiet left/center space for the title.
Watercolor-like atmosphere with crisp foreground blossoms. No girl, people,
silhouettes, buildings, text, logos, or watermark.
