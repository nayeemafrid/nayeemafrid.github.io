(() => {
  'use strict';
  // Asset fallbacks also work when a local image fails after page load.
  document.querySelectorAll('.desktop-brand img, .mobile-brand img').forEach(img => {
    const update = () => img.parentElement.classList.toggle('has-logo', img.naturalWidth > 0);
    img.addEventListener('load', update);
    img.addEventListener('error', update);
    if (img.complete) update();
  });
  const portrait = document.querySelector('.portrait');
  if (portrait) {
    const update = () => {
      const missing = !portrait.naturalWidth;
      portrait.hidden = missing;
      portrait.style.display = missing ? 'none' : '';
      portrait.closest('.hero').classList.toggle('no-portrait', missing);
    };
    portrait.addEventListener('load', update);
    portrait.addEventListener('error', update);
    if (portrait.complete) update();
  }
  const menu = document.querySelector('#mobile-menu');
  const openButton = document.querySelector('.menu-button');
  const closeButton = document.querySelector('.menu-close');
  const links = [...document.querySelectorAll('.desktop-nav a, .mobile-nav a')];
  const sections = [...document.querySelectorAll('main section[id]')];
  const background = [...document.querySelector('main').children].filter(el => el !== menu);
  let previousFocus;
  function closeMenu(restore = true) {
    menu.hidden = true;
    document.body.classList.remove('menu-open');
    background.forEach(el => { el.inert = false; });
    openButton.setAttribute('aria-expanded', 'false');
    if (restore && previousFocus?.getClientRects().length) previousFocus.focus({preventScroll:true});
  }
  function openMenu() {
    previousFocus = document.activeElement;
    menu.hidden = false;
    document.body.classList.add('menu-open');
    background.forEach(el => { el.inert = true; });
    openButton.setAttribute('aria-expanded', 'true');
    closeButton.focus();
  }
  if (menu && openButton && closeButton) {
    openButton.addEventListener('click', openMenu);
    closeButton.addEventListener('click', () => closeMenu());
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      closeMenu(false);
      const target = document.querySelector(link.hash);
      if (target) { target.tabIndex = -1; target.focus({preventScroll:true}); }
    }));
    document.addEventListener('keydown', event => {
      if (menu.hidden) return;
      if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
      if (event.key === 'Tab') {
        const focusable = [closeButton, ...menu.querySelectorAll('a')];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
        else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
      }
    });
    window.matchMedia('(min-width:761px)').addEventListener('change', event => {
      if (event.matches && !menu.hidden) closeMenu(false);
    });
  }
  let scheduled = false;
  // Keep explicit navigation selected, even when a short section cannot
  // reach the top because the document has run out of scrollable space.
  let navigationTarget = sections.some(section => `#${section.id}` === location.hash)
    ? location.hash.slice(1) : null;
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!sections.some(section => `#${section.id}` === link.hash)) return;
      navigationTarget = link.hash.slice(1);
      scheduleUpdate();
    });
  });
  function resumeScrollTracking() {
    navigationTarget = null;
    scheduleUpdate();
  }
  window.addEventListener('wheel', resumeScrollTracking, {passive:true});
  window.addEventListener('touchmove', resumeScrollTracking, {passive:true});
  window.addEventListener('pointerdown', resumeScrollTracking, {passive:true});
  window.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) {
      resumeScrollTracking();
    }
  });
  function updateNavigation() {
    const marker = Math.min(180, window.innerHeight * .28);
    let current = sections[0]?.id;
    sections.forEach(section => { if (section.getBoundingClientRect().top <= marker) current = section.id; });
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) current = sections.at(-1)?.id;
    if (navigationTarget) current = navigationTarget;
    links.forEach(link => {
      const active = link.hash === `#${current}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scheduled = false;
  }
  function scheduleUpdate() {if (!scheduled) {scheduled = true;requestAnimationFrame(updateNavigation);}}
  window.addEventListener('scroll', scheduleUpdate, {passive:true});
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('hashchange', () => {
    navigationTarget = sections.some(section => `#${section.id}` === location.hash)
      ? location.hash.slice(1) : null;
    scheduleUpdate();
  });
  window.addEventListener('load', scheduleUpdate);
  updateNavigation();
})();

// Keep the enlarged name inside its column, including while fonts load.
(() => {
  const heading = document.querySelector('.hero-heading');
  if (!heading) return;
  function fitName() {
    heading.style.fontSize = '';
    const available = heading.clientWidth;
    const required = heading.scrollWidth;
    if (required > available && available > 0) {
      const size = parseFloat(getComputedStyle(heading).fontSize);
      heading.style.fontSize = `${size * available / required * .99}px`;
    }
  }
  new ResizeObserver(fitName).observe(heading.parentElement);
  document.fonts.ready.then(fitName);
  window.addEventListener('resize', fitName);
  fitName();
})();
