/* Philosophy — stacking cards.
   As each card slides up over the one before, the covered card eases back to
   96%, so the stack reads as depth. Drawings play once when a card arrives,
   and the rail's index follows whichever card is on top. */
(function () {
  "use strict";
  var host = document.querySelector("[data-philo]");
  if (!host) return;
  var cards = [].slice.call(host.querySelectorAll(".philo-card"));
  var dots = [].slice.call(host.querySelectorAll("[data-philo-dot]"));
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("is-drawn"); io.unobserve(e.target); }
    });
  }, { threshold: 0.45 });
  cards.forEach(function (c) { io.observe(c); });

  var ticking = false;
  function update() {
    ticking = false;
    var current = 0;
    cards.forEach(function (card, i) {
      var r = card.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.6) current = i;
      if (reduced || i === cards.length - 1) return;
      var next = cards[i + 1].getBoundingClientRect();
      var overlap = Math.max(0, r.bottom - next.top);
      var p = Math.min(1, overlap / r.height);
      card.style.transform = p ? "scale(" + (1 - p * 0.04).toFixed(4) + ")" : "";
    });
    dots.forEach(function (d, i) { d.classList.toggle("is-on", i === current); });
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
