const button = document.querySelector('.menu-button');
const nav = document.querySelector('.nav-list');

function closeMenu() {
  nav?.classList.remove('open');
  button?.setAttribute('aria-expanded', 'false');
  if (button) button.textContent = 'Menu';
}

button?.addEventListener('click', () => {
  const open = nav?.classList.toggle('open') ?? false;
  button.setAttribute('aria-expanded', String(open));
  button.textContent = open ? 'Close' : 'Menu';
});

document.querySelectorAll('.nav-list a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu();
    button?.focus();
  }
});
document.addEventListener('click', (event) => {
  if (nav?.classList.contains('open') && !event.target.closest('.nav-wrap')) closeMenu();
});
addEventListener('scroll', () => document.querySelector('.site-header')?.classList.toggle('scrolled', scrollY > 8), { passive: true });
