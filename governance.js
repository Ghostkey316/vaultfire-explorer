/* ===== Vaultfire Governance — Belief-Weighted System ===== */
/* Governance tab logic — animations and interactive elements */

// Animate numbers on scroll
function animateValue(el, start, end, duration) {
  const range = end - start;
  const startTime = performance.now();
  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(start + range * eased);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// Observe governance section for animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.how-card, .proposal-card, .comparison-card').forEach(el => {
  observer.observe(el);
});
