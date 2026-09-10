(() => {
  const catalog = document.querySelector(".release-catalog");
  const cards = [...catalog.querySelectorAll(".release-card")];
  let frame;
  function layout() {
    catalog.classList.remove("is-stacked");
    catalog.style.removeProperty("--art-width");
    if (innerWidth <= 800) return;
    const available = cards[0].clientWidth;
    // Start small and grow only enough to accommodate the text column.
    let width = Math.min(180, available * .2);
    for (let i = 0; i < 16; i++) {
      catalog.style.setProperty("--art-width", width + "px");
      const textHeight = Math.max(...cards.map(card =>
        card.querySelector(".release-copy").getBoundingClientRect().height));
      if (textHeight <= width * 1.5 + .5) return;
      width = Math.ceil(textHeight / 1.5);
      if (width > available * .45) break;
    }
    catalog.classList.add("is-stacked");
  }
  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(layout);
  }
  let lastWidth;
  new ResizeObserver(([entry]) => {
    if (entry.contentRect.width !== lastWidth) {
      lastWidth = entry.contentRect.width;
      schedule();
    }
  }).observe(catalog);
  document.fonts.ready.then(schedule);
  schedule();
})();
