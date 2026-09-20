// Refresh published patch labels without rebuilding the homepage. Static text
// remains available when JavaScript, storage, or GitHub's API is unavailable.
(() => {
  const ttl = 15 * 60 * 1000;
  const valid = value => typeof value === "string" && /^v\d+\.\d+(?:\.\d+)?$/.test(value);
  for (const label of document.querySelectorAll("[data-release-repo]")) {
    const repo = label.dataset.releaseRepo;
    if (!/^[a-z0-9-]+$/.test(repo)) continue;
    const key = `mao-release:${repo}`;
    const show = tag => { label.textContent = `English translation · ${tag}`; };
    let cached;
    try { cached = JSON.parse(localStorage.getItem(key)); } catch {}
    // A cached version must never downgrade a newer checked-in label.
    const current = label.textContent.match(/v\d+\.\d+(?:\.\d+)?$/)?.[0];
    const newer = tag => !current || tag.slice(1).split('.').map(Number).reduce((result, n, i) => result || Math.sign(n - Number(current.slice(1).split('.')[i] || 0)), 0) >= 0;
    if (cached && valid(cached.tag) && newer(cached.tag) && Date.now() - cached.at >= 0 && Date.now() - cached.at < ttl) {
      show(cached.tag);
      // Revalidate on every page load: a fresh cache can predate a new release.
    }
    fetch(`https://api.github.com/repos/MAO-TLs/${repo}/releases/latest`, {
      headers: {Accept: "application/vnd.github+json"},
      signal: AbortSignal.timeout(5000),
    }).then(response => response.ok ? response.json() : Promise.reject())
      .then(release => {
        if (release.draft || release.prerelease || !valid(release.tag_name) || !newer(release.tag_name)) return;
        show(release.tag_name);
        try { localStorage.setItem(key, JSON.stringify({tag: release.tag_name, at: Date.now()})); } catch {}
      }).catch(() => {});
  }
})();
