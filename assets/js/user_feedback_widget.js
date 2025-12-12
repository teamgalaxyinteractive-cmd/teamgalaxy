// feedback-widget.js (debuggable, more visible, robust against CSS overrides)
(function () {
  if (window.__TG_FEEDBACK_WIDGET_INJECTED__) return;
  window.__TG_FEEDBACK_WIDGET_INJECTED__ = true;

  const REDIRECT_URL = '/user_feedback';
  const ID = 'tg-feedback-widget-v1';
  const STYLE_ID = 'tg-feedback-widget-style-v1';

  // Toggle this to true to always show label + red outline for debugging
  const DEBUG = false;

  const css = `
  /* Strong !important rules to avoid host page overrides */
  #${ID} {
    position: fixed !important;
    right: 18px !important;
    bottom: 18px !important;
    z-index: 2147483640 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 72px !important;
    height: 72px !important;
    border-radius: 999px !important;
    background: linear-gradient(180deg,#ff4757,#e84118) !important;
    box-shadow: 0 10px 30px rgba(0,0,0,0.55) !important;
    color: #fff !important;
    font-size: 34px !important;
    cursor: pointer !important;
    border: 0 !important;
    transition: transform .12s ease, box-shadow .12s ease, opacity .12s !important;
    user-select: none !important;
    -webkit-tap-highlight-color: transparent !important;
    opacity: 1 !important;
    outline: none !important;
  }
  #${ID}:hover { transform: translateY(-6px) !important; box-shadow: 0 16px 40px rgba(0,0,0,0.6) !important; }
  #${ID}:active { transform: translateY(-2px) scale(.985) !important; }
  #${ID}:focus { outline: 4px solid rgba(255,200,200,0.16) !important; outline-offset: 4px !important; }

  /* Label always visible in debug, else on hover */
  #${ID} .tg-fw-label {
    display: ${DEBUG ? 'block' : 'none'}; /* will be toggled by JS for non-debug */
    position: absolute !important;
    right: 92px !important;
    white-space: nowrap !important;
    background: rgba(0,0,0,0.78) !important;
    color: #fff !important;
    font-size: 13px !important;
    padding: 8px 10px !important;
    border-radius: 8px !important;
    box-shadow: 0 6px 18px rgba(0,0,0,0.45) !important;
    transform-origin: right center !important;
    transform: translateY(-2px) !important;
    pointer-events: none !important;
    opacity: 1 !important;
  }
  #${ID}.show-label .tg-fw-label { display:block !important; }

  #${ID} .sr-only {
    position: absolute !important;
    width:1px !important;height:1px !important;padding:0 !important;margin:-1px !important;overflow:hidden !important;clip:rect(0,0,0,0) !important;white-space:nowrap !important;border:0 !important;
  }

  /* debug helper (red outline) */
  #${ID}.tg-debug { box-shadow: 0 0 0 3px rgba(255,0,0,0.18) inset !important; border:2px dashed rgba(255,0,0,0.12) !important; }
  `;

  // inject style
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
    console.debug('[TG-WIDGET] style injected');
  }

  // helper intersection test
  function rectsIntersect(a, b, padding = 6) {
    return !(a.right - padding <= b.left + padding ||
             a.left + padding >= b.right - padding ||
             a.bottom - padding <= b.top + padding ||
             a.top + padding >= b.bottom - padding);
  }

  function createWidget() {
    if (document.getElementById(ID)) return document.getElementById(ID);

    const btn = document.createElement('button');
    btn.id = ID;
    btn.type = 'button';
    btn.title = 'Open feedback panel';
    btn.setAttribute('aria-label', 'Open feedback panel (redirects to feedback page)');
    btn.innerHTML = `
      <span aria-hidden="true" style="line-height:1">${DEBUG ? '💬' : '💬'}</span>
      <span class="tg-fw-label" aria-hidden="true">Send feedback</span>
      <span class="sr-only">Open feedback page</span>
    `;

    // Inline defensive styles (helps override aggressive page CSS)
    btn.style.setProperty('position', 'fixed', 'important');
    btn.style.setProperty('right', '18px', 'important');
    btn.style.setProperty('bottom', '18px', 'important');
    btn.style.setProperty('width', '72px', 'important');
    btn.style.setProperty('height', '72px', 'important');
    btn.style.setProperty('fontSize', '34px', 'important');

    // click behaviour: safe redirect
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      try { window.location.href = REDIRECT_URL; } catch (err) { console.error('[TG-WIDGET] redirect failed', err); }
    });

    btn.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        btn.click();
      }
    });

    // append as the very last child of body (helps avoid some stacking contexts)
    try {
      document.body.appendChild(btn);
    } catch (err) {
      // fallback: try document.documentElement
      try { document.documentElement.appendChild(btn); } catch (e) { console.error('[TG-WIDGET] append failed', e); }
    }

    return btn;
  }

  function placeWidgetAvoidingOverlap(widget) {
    // ensure it uses fixed positioning and visible size
    widget.style.setProperty('position', 'fixed', 'important');
    widget.style.setProperty('right', '18px', 'important');
    widget.style.setProperty('bottom', '18px', 'important');
    widget.style.setProperty('display', 'flex', 'important');

    // collect candidates (fixed/absolute/sticky or high z-index)
    const all = Array.from(document.querySelectorAll('body *'));
    const candidates = [];
    for (const el of all) {
      if (el === widget) continue;
      if (!(el instanceof HTMLElement)) continue;
      const st = window.getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) === 0) continue;
      const pos = st.position;
      const z = isNaN(parseInt(st.zIndex, 10)) ? 0 : parseInt(st.zIndex, 10);
      if (pos === 'fixed' || pos === 'sticky' || pos === 'absolute' || z >= 1000) {
        const r = el.getBoundingClientRect();
        if (!(r.width === 0 && r.height === 0)) candidates.push(el);
      }
    }

    // start at bottom-right, nudge up until no collision
    let step = 12;
    const maxAttempts = Math.ceil(window.innerHeight / step) + 10;
    let attempts = 0;
    widget.style.setProperty('right', '18px', 'important');
    widget.style.setProperty('bottom', '18px', 'important');

    let wRect = widget.getBoundingClientRect();
    while (attempts < maxAttempts) {
      let collides = false;
      for (const c of candidates) {
        const cRect = c.getBoundingClientRect();
        if (rectsIntersect(wRect, cRect, 6)) { collides = true; break; }
      }
      if (!collides) break;
      const currentBottom = parseFloat(widget.style.bottom || '18');
      widget.style.setProperty('bottom', (currentBottom + step) + 'px', 'important');
      wRect = widget.getBoundingClientRect();
      attempts++;
    }

    // final collision check — try shifting left as a fallback
    let finalCollide = false;
    wRect = widget.getBoundingClientRect();
    for (const c of candidates) {
      const cRect = c.getBoundingClientRect();
      if (rectsIntersect(wRect, cRect, 6)) { finalCollide = true; break; }
    }
    if (finalCollide) {
      let shifted = 0;
      while (shifted <= 160) {
        const currentRight = parseFloat(widget.style.right || '18');
        widget.style.setProperty('right', (currentRight + 18) + 'px', 'important');
        shifted += 18;
        wRect = widget.getBoundingClientRect();
        let coll = false;
        for (const c of candidates) {
          const cRect = c.getBoundingClientRect();
          if (rectsIntersect(wRect, cRect, 6)) { coll = true; break; }
        }
        if (!coll) { finalCollide = false; break; }
      }
    }

    // if still colliding, lower z-index slightly to avoid taking clicks from modals
    if (finalCollide) widget.style.setProperty('zIndex', '999999', 'important');
    else widget.style.setProperty('zIndex', '2147483640', 'important');

    // ensure label shows on hover (non-debug)
    if (!DEBUG) {
      widget.addEventListener('mouseenter', () => widget.classList.add('show-label'));
      widget.addEventListener('mouseleave', () => widget.classList.remove('show-label'));
    }

    console.debug('[TG-WIDGET] placed (bottom/right)', {
      bottom: widget.style.bottom,
      right: widget.style.right,
      zIndex: widget.style.zIndex
    });
  }

  // Observe DOM changes and reposition
  function observeAndAdjust(widget) {
    let scheduled = false;
    const adjust = () => { scheduled = false; try { placeWidgetAvoidingOverlap(widget); } catch (e) { console.warn('[TG-WIDGET] adjust failed', e); } };
    const debouncedAdjust = () => { if (scheduled) return; scheduled = true; setTimeout(adjust, 160); };

    const mo = new MutationObserver(debouncedAdjust);
    try { mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] }); } catch (e) { /* fail silently */ }

    window.addEventListener('resize', debouncedAdjust, { passive: true });
    window.addEventListener('orientationchange', debouncedAdjust, { passive: true });
    window.addEventListener('scroll', debouncedAdjust, { passive: true });

    // schedule a few runs (for late loads)
    setTimeout(debouncedAdjust, 200);
    setTimeout(debouncedAdjust, 900);
    setTimeout(debouncedAdjust, 2400);
  }

  // Public debug helpers
  window.__TGFW = window.__TGFW || {};
  window.__TGFW.getElement = () => document.getElementById(ID);
  window.__TGFW.showDebug = function () {
    const el = document.getElementById(ID);
    if (!el) return console.warn('[TG-WIDGET] not found');
    el.classList.add('tg-debug', 'show-label');
    el.style.setProperty('width', '88px', 'important');
    el.style.setProperty('height', '88px', 'important');
    el.style.setProperty('fontSize', '40px', 'important');
    placeWidgetAvoidingOverlap(el);
    console.info('[TG-WIDGET] debug-visible');
  };
  window.__TGFW.hideDebug = function () {
    const el = document.getElementById(ID);
    if (!el) return;
    el.classList.remove('tg-debug', 'show-label');
    el.style.setProperty('width', '72px', 'important');
    el.style.setProperty('height', '72px', 'important');
    el.style.setProperty('fontSize', '34px', 'important');
    placeWidgetAvoidingOverlap(el);
  };
  window.__TGFW.forceFlash = function (times = 3) {
    const el = document.getElementById(ID);
    if (!el) return;
    let i = 0;
    const iv = setInterval(() => {
      el.style.transform = 'translateY(-12px) scale(1.02)';
      setTimeout(() => el.style.transform = '', 180);
      i++;
      if (i >= times) clearInterval(iv);
    }, 320);
  };

  function init() {
    if (!document.body) return setTimeout(init, 50);
    const widget = createWidget();
    placeWidgetAvoidingOverlap(widget);
    observeAndAdjust(widget);
    // small visible pulse to indicate presence (only if not debug)
    setTimeout(() => { try { window.__TGFW.forceFlash(2); } catch (e) {} }, 350);
    console.debug('[TG-WIDGET] initialized');
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else window.addEventListener('DOMContentLoaded', init);

  // Quick usage helpers logged so you know
  console.log('[TG-WIDGET] feedback widget script loaded. If you cannot see it: run `__TGFW.getElement()` in console, or `__TGFW.showDebug()` to make it obvious.');
})();