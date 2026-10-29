// Keep contact links direct while leaving the full form out of the initial layout.
const contactSection = document.querySelector('.contact-section');
const contactDetails = document.querySelector('.contact-disclosure');
function revealTarget(hash, focusContact = false) {
  if (!hash) return;
  const target = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!target) return;
  const parentDetails = target.closest('details');
  if (parentDetails) parentDetails.open = true;
  if (target === contactSection && contactDetails) {
    contactDetails.open = true;
    if (focusContact) requestAnimationFrame(() => contactDetails.querySelector('input:not([type="hidden"]):not([tabindex="-1"])')?.focus({ preventScroll: true }));
  }
}
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (contactSection && link.hash === `#${contactSection.id}`) {
      event.preventDefault();
      revealTarget(link.hash, true);
      history.pushState(null, '', link.hash);
      contactSection.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    } else revealTarget(link.hash);
  });
});
window.addEventListener('hashchange', () => revealTarget(location.hash));
revealTarget(location.hash);
