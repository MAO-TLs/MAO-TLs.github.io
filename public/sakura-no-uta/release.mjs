try {
  const response = await fetch(new URL('./patch-release.json', import.meta.url));
  if (!response.ok) throw Error('Release metadata unavailable');
  const patch = await response.json();
  document.getElementById('download-size').textContent = (patch.size / 1e6).toFixed(1) + ' MB';
  document.getElementById('download-sha').textContent = patch.sha256;
} catch {
  // The download and complete plain-text instructions work without JavaScript.
}
