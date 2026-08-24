(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const readerApp = $("readerApp");
  let data = null;
  let started = false;
  let searchTimer = 0;
  let corpusLimit = 100;
  let tipInstance = 0;
  const tipResolutionCache = new Map();
  const state = {
    scenarioIndex: Math.max(0, Number(localStorage.getItem("bst-scenario-index") || 0)),
    scope: "script",
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function safeRef(ref) { return `ref-${ref.replace(/[^A-Za-z0-9_-]/g, "_")}`; }
  function tipDefinition(groupId, language, scenarioIndex) {
    const cacheKey = `${scenarioIndex}:${groupId}:${language}`;
    if (tipResolutionCache.has(cacheKey)) return tipResolutionCache.get(cacheKey);
    const available = new Set(
      data.scenarios.slice(0, scenarioIndex + 1).map((scenario) => scenario.code.toLocaleLowerCase()),
    );
    const group = data.tipGroups?.[groupId] || [];
    const eligible = group.filter((entry) => {
      const needs = entry.needFiles.map((value) => value.toLocaleLowerCase());
      if (!needs.length) return true;
      return entry.andFlag
        ? needs.every((value) => available.has(value))
        : needs.some((value) => available.has(value));
    });
    eligible.sort((left, right) => right.priority - left.priority || right.id - left.id);
    const localized = (eligible[0] || group[0])?.[language] || null;
    tipResolutionCache.set(cacheKey, localized);
    return localized;
  }
  function tipTrigger(groupId, label, language, scenarioIndex) {
    const localized = tipDefinition(groupId, language, scenarioIndex);
    if (!localized) return null;
    const trigger = el("button", "tip-trigger");
    trigger.type = "button";
    trigger.setAttribute("aria-expanded", "false");
    const tooltipId = `tip-${groupId}-${++tipInstance}`;
    trigger.setAttribute("aria-describedby", tooltipId);
    const visible = el("span", "tip-label");
    appendTaggedText(visible, label, language, scenarioIndex);
    const tooltip = el("span", "tip-preview");
    tooltip.id = tooltipId;
    tooltip.setAttribute("role", "tooltip");
    tooltip.append(el("strong", "tip-title", localized.title));
    tooltip.append(el("span", "tip-body", localized.text));
    trigger.append(visible, tooltip);
    return trigger;
  }
  function appendTaggedText(parent, value, language, scenarioIndex) {
    const pattern = /<ruby=([^>]*)>([\s\S]*?)<\/ruby>|<tips=([^>]*)>([\s\S]*?)<\/tips>|<speed(?:=[^>]*)?>([\s\S]*?)<\/speed>/g;
    let cursor = 0;
    let match;
    while ((match = pattern.exec(value)) !== null) {
      if (match.index > cursor) parent.append(document.createTextNode(value.slice(cursor, match.index)));
      if (match[1] !== undefined) {
        const ruby = el("ruby");
        appendTaggedText(ruby, match[2], language, scenarioIndex);
        const reading = el("rt");
        appendTaggedText(reading, match[1], language, scenarioIndex);
        ruby.append(reading);
        parent.append(ruby);
      } else if (match[3] !== undefined) {
        const trigger = tipTrigger(match[3], match[4], language, scenarioIndex);
        if (trigger) parent.append(trigger);
        else appendTaggedText(parent, match[4], language, scenarioIndex);
      } else {
        appendTaggedText(parent, match[5], language, scenarioIndex);
      }
      cursor = pattern.lastIndex;
    }
    if (cursor < value.length) parent.append(document.createTextNode(value.slice(cursor)));
  }
  function appendDisplayText(parent, value, language, rubySpans = [], scenarioIndex) {
    const characters = Array.from(value || "");
    let cursor = 0;
    [...rubySpans].sort((a, b) => a.start - b.start).forEach((span) => {
      if (span.start < cursor || span.end > characters.length) return;
      appendTaggedText(parent, characters.slice(cursor, span.start).join(""), language, scenarioIndex);
      const ruby = el("ruby");
      appendTaggedText(ruby, span.base, language, scenarioIndex);
      const reading = el("rt");
      appendTaggedText(reading, span.reading, language, scenarioIndex);
      ruby.append(reading);
      parent.append(ruby);
      cursor = span.end;
    });
    appendTaggedText(parent, characters.slice(cursor).join(""), language, scenarioIndex);
  }
  function richParagraph(value, language, rubySpans, scenarioIndex) {
    const paragraph = el("p");
    if (language) paragraph.lang = language;
    appendDisplayText(paragraph, value, language, rubySpans, scenarioIndex);
    return paragraph;
  }
  function normalize(value) { return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " "); }
  function compact(value) { return value.replace(/\s+/g, ""); }
  function isJapanese(value) { return /[\u3040-\u30ff\u3400-\u9fff\uff66-\uff9f]/u.test(value); }
  function rowMatches(row, query) {
    if (!query) return true;
    const needle = normalize(query);
    const compactNeedle = isJapanese(needle) ? compact(needle) : "";
    const haystack = normalize([row.en, row.jp, row.ref, row.speaker?.displayName || "", row.speaker?.id || ""].join("\u0000"));
    return haystack.includes(needle) || (compactNeedle && compact(haystack).includes(compactNeedle));
  }
  function loadData() {
    if (window.BST_BROWSER_DATA) return Promise.resolve(window.BST_BROWSER_DATA);
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "data.js";
      script.onload = () => window.BST_BROWSER_DATA ? resolve(window.BST_BROWSER_DATA) : reject(new Error("Browser data did not initialize."));
      script.onerror = () => reject(new Error("Could not load the offline script data."));
      document.body.append(script);
    });
  }
  function updateUrl(hash = "") {
    try {
      const url = new URL(window.location.href);
      const scenario = data?.scenarios[state.scenarioIndex];
      if (state.scope === "corpus") {
        url.searchParams.set("scope", "all");
        const query = $("searchInput").value.trim();
        query ? url.searchParams.set("q", query) : url.searchParams.delete("q");
        url.searchParams.delete("scenario");
      } else {
        url.searchParams.delete("scope");
        url.searchParams.delete("q");
        if (scenario) url.searchParams.set("scenario", scenario.code);
      }
      if (hash) url.hash = safeRef(hash); else if (state.scope === "corpus") url.hash = "";
      history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } catch { /* file URLs can restrict history updates in some browsers */ }
  }
  function speakerHeading(row, language) {
    const name = language === "ja" ? row.speaker?.id : row.speaker?.displayName;
    if (!name) return null;
    const heading = el("div", "line-cell-heading");
    const speaker = el("span", "speaker speaker-meta");
    speaker.append(el("span", "", name));
    heading.append(speaker);
    return heading;
  }
  function buildLine(row, target = false, scenarioIndex = state.scenarioIndex) {
    const article = el("article", `script-line${row.disposition !== "translated" ? " metadata-row" : ""}${target ? " script-line-target" : ""}`);
    article.id = safeRef(row.ref);
    article.tabIndex = -1;
    article.dataset.ref = row.ref;
    const ref = el("div", "line-ref", `r${row.rowIndex}`);
    ref.title = row.ref;
    const ja = el("div", "line-cell line-ja");
    const jaHeading = speakerHeading(row, "ja");
    if (jaHeading) ja.append(jaHeading);
    if (row.disposition !== "translated") ja.append(el("span", "metadata-label", "Source metadata · not shown in game"));
    ja.append(richParagraph(row.jp, "ja", row.markup?.jpRuby || [], scenarioIndex));
    const en = el("div", "line-cell line-en");
    const enHeading = speakerHeading(row, "en");
    if (enHeading) en.append(enHeading);
    if (row.disposition !== "translated") en.append(el("span", "metadata-label", "English localization intentionally blank"));
    en.append(richParagraph(row.en, "en", row.markup?.enRuby || [], scenarioIndex));
    article.append(ref, ja, en);
    return article;
  }
  function applyDisplay() {
    const roots = [$("scriptRows"), $("corpusResults")];
    roots.forEach((root) => {
      if (!root) return;
      root.classList.add("compact");
    });
  }
  function updateNavigation() {
    $("previousScenario").disabled = state.scenarioIndex <= 0;
    $("nextScenario").disabled = state.scenarioIndex >= data.scenarios.length - 1;
    $("scenarioSelect").value = String(state.scenarioIndex);
  }
  function renderScenario(targetRef = "") {
    if (!started || state.scope !== "script") return;
    const scenario = data.scenarios[state.scenarioIndex];
    const query = $("searchInput").value.trim();
    const visible = scenario.rows.filter((row) => rowMatches(row, query));
    localStorage.setItem("bst-scenario-index", String(state.scenarioIndex));
    $("scenarioTitle").textContent = scenario.code;
    $("scenarioPosition").textContent = `${visible.length.toLocaleString()}${query ? " matching" : ""} rows · script ${scenario.position} of ${data.scenarios.length}`;
    $("searchSummary").textContent = `${visible.length.toLocaleString()}${query ? " matching" : ""} row${visible.length === 1 ? "" : "s"}`;
    const fragment = document.createDocumentFragment();
    visible.forEach((row) => fragment.append(buildLine(row, row.ref === targetRef, state.scenarioIndex)));
    $("scriptRows").replaceChildren(fragment);
    updateNavigation(); applyDisplay(); updateUrl(targetRef);
    if (targetRef) requestAnimationFrame(() => { const target = $(safeRef(targetRef)); target?.scrollIntoView({block:"center"}); target?.focus({preventScroll:true}); });
  }
  function allMatches(query) {
    const hits = [];
    data.scenarios.forEach((scenario, si) => scenario.rows.forEach((row) => { if (rowMatches(row, query)) hits.push({scenario, si, row}); }));
    return hits;
  }
  function renderCorpus() {
    if (!started || state.scope !== "corpus") return;
    const query = $("searchInput").value.trim();
    const prompt = $("corpusPrompt");
    const root = $("corpusResults");
    root.replaceChildren();
    if (query.length < 2) {
      prompt.hidden = false; $("showMore").hidden = true;
      $("searchSummary").textContent = "Enter at least two characters";
      updateUrl(); return;
    }
    prompt.hidden = true;
    const hits = allMatches(query);
    const visible = hits.slice(0, corpusLimit);
    $("searchSummary").textContent = `${hits.length.toLocaleString()} matching row${hits.length === 1 ? "" : "s"} across ${new Set(hits.map((hit) => hit.si)).size.toLocaleString()} scripts`;
    const fragment = document.createDocumentFragment();
    visible.forEach((hit) => {
      const card = el("article", "concordance-hit");
      const button = el("button", "concordance-hit-link concordance-hit-button"); button.type = "button";
      button.append(el("code", "", hit.row.ref), el("span", "", hit.scenario.code), el("strong", "", `r${hit.row.rowIndex} →`));
      button.addEventListener("click", () => jumpToHit(hit.si, hit.row.ref));
      const grid = el("div", "concordance-hit-grid");
      const ja = el("div", "line-cell line-ja"); const jaHeading = speakerHeading(hit.row, "ja"); if (jaHeading) ja.append(jaHeading); ja.append(richParagraph(hit.row.jp, "ja", hit.row.markup?.jpRuby || [], hit.si));
      const en = el("div", "line-cell line-en"); const enHeading = speakerHeading(hit.row, "en"); if (enHeading) en.append(enHeading); en.append(richParagraph(hit.row.en, "en", hit.row.markup?.enRuby || [], hit.si));
      grid.append(ja, en); card.append(button, grid); fragment.append(card);
    });
    root.append(fragment);
    $("showMore").hidden = hits.length <= visible.length;
    $("showMoreCount").textContent = `${visible.length.toLocaleString()} of ${hits.length.toLocaleString()}`;
    applyDisplay(); updateUrl();
  }
  function jumpToHit(si, ref) {
    state.scenarioIndex = si; state.scope = "script"; $("scopeCurrent").checked = true; $("scopeAll").checked = false; $("searchInput").value = "";
    $("currentScriptView").hidden = false; $("corpusView").hidden = true; renderScenario(ref);
  }
  function setScope(scope) {
    state.scope = scope; corpusLimit = 100;
    $("scenarioSelect").disabled = scope === "corpus";
    $("previousScenario").disabled = scope === "corpus" || state.scenarioIndex <= 0;
    $("nextScenario").disabled = scope === "corpus" || state.scenarioIndex >= data.scenarios.length - 1;
    $("currentScriptView").hidden = scope !== "script"; $("corpusView").hidden = scope !== "corpus";
    scope === "script" ? renderScenario() : renderCorpus();
  }
  function selectScenario(index) { state.scenarioIndex = Math.max(0, Math.min(data.scenarios.length - 1, index)); renderScenario(); }
  function initialize() {
    if (started) return;
    started = true;
    state.scenarioIndex = Math.min(state.scenarioIndex, data.scenarios.length - 1);
    data.scenarios.forEach((scenario, i) => { const option = el("option", "", `${String(i + 1).padStart(2,"0")} · ${scenario.code}`); option.value = String(i); $("scenarioSelect").append(option); });
    let pendingRef = "";
    try {
      const url = new URL(window.location.href);
      const requested = url.searchParams.get("scenario");
      const requestedIndex = data.scenarios.findIndex((scenario) => scenario.code === requested);
      if (requestedIndex >= 0) state.scenarioIndex = requestedIndex;
      state.scope = url.searchParams.get("scope") === "all" ? "corpus" : "script";
      if (state.scope === "corpus") { $("scopeAll").checked = true; $("scopeCurrent").checked = false; $("searchInput").value = url.searchParams.get("q") || ""; }
      const requestedHash = decodeURIComponent(url.hash.slice(1));
      if (requestedHash && state.scope === "script") {
        data.scenarios.some((scenario, si) => {
          const row = scenario.rows.find((candidate) => safeRef(candidate.ref) === requestedHash);
          if (!row) return false;
          state.scenarioIndex = si; pendingRef = row.ref; return true;
        });
      }
    } catch { /* keep defaults */ }
    setScope(state.scope);
    if (pendingRef) renderScenario(pendingRef);
  }
  async function startReader() {
    try {
      data = await loadData();
      initialize();
    } catch (error) {
      $("browserHeading").classList.remove("sr-only");
      $("browserHeading").textContent = error.message;
    }
  }
  $("scenarioSelect").addEventListener("change", () => selectScenario(Number($("scenarioSelect").value)));
  $("previousScenario").addEventListener("click", () => selectScenario(state.scenarioIndex - 1));
  $("nextScenario").addEventListener("click", () => selectScenario(state.scenarioIndex + 1));
  $("scopeCurrent").addEventListener("change", () => setScope("script"));
  $("scopeAll").addEventListener("change", () => setScope("corpus"));
  $("searchInput").addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => state.scope === "script" ? renderScenario() : renderCorpus(), 120); });
  $("showMore").addEventListener("click", () => { corpusLimit += 100; renderCorpus(); });
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest?.(".tip-trigger");
    const open = document.querySelectorAll('.tip-trigger[aria-expanded="true"]');
    open.forEach((candidate) => { if (candidate !== trigger) candidate.setAttribute("aria-expanded", "false"); });
    if (trigger) trigger.setAttribute("aria-expanded", trigger.getAttribute("aria-expanded") === "true" ? "false" : "true");
  });
  window.addEventListener("keydown", (event) => {
    if (!started || readerApp.hidden) return;
    if (event.key === "Escape") document.querySelectorAll('.tip-trigger[aria-expanded="true"]').forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
    const editing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName || "");
    if (event.key === "/" && !editing) { event.preventDefault(); $("searchInput").focus(); }
    if (!editing && state.scope === "script" && event.key === "[") { event.preventDefault(); selectScenario(state.scenarioIndex - 1); }
    if (!editing && state.scope === "script" && event.key === "]") { event.preventDefault(); selectScenario(state.scenarioIndex + 1); }
  });
  startReader();
})();
