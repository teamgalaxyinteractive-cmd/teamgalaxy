// feedback-widget.js (shadow-dom backed, robust, debuggable)
(function () {
  if (window.__TG_FEEDBACK_WIDGET_INJECTED__) return;
  window.__TG_FEEDBACK_WIDGET_INJECTED__ = true;

  const REDIRECT_URL = '/user_feedback';
  const BASE_ID = 'tg-feedback-widget-v1-root';
  const HOST_ID = 'tg-feedback-widget-host-v1';
  const DEBUG = false; // set to true for always-visible label + red outline

  // Utility: create element with attrs
  function ce(tag, attrs = {}) {
    const el = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'html') el.innerHTML = attrs[k];
      else if (k === 'text') el.textContent = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    return el;
  }

  // Strong CSS that will be inserted inside shadow root (isolated)
  const widgetCSS = `
    :host {
      all: initial; /* reset inherited UA/host styles */
      position: fixed;
      right: 30px;
      bottom: 30px;
      z-index: 2147483647;
      display: block;
      pointer-events: auto;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #tg-btn {
      box-sizing: border-box;
      position: relative;
      width: 72px;
      height: 72px;
      border-radius: 999px;
      background: linear-gradient(180deg,#ff4757,#e84118);
      box-shadow: 0 10px 30px rgba(0,0,0,0.55);
      color: #fff;
      font-size: 34px;
      line-height: 72px;
      text-align: center;
      border: 0;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      transition: transform .12s ease, box-shadow .12s ease, opacity .12s;
      outline: none;
    }
    #tg-btn:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(0,0,0,0.6); }
    #tg-btn:active { transform: translateY(-2px) scale(.985); }
    #tg-btn:focus { outline: 4px solid rgba(255,200,200,0.16); outline-offset: 4px; }

    /* label bubble */
    .tg-fw-label {
      display: ${DEBUG ? 'block' : 'none'};
      position: absolute;
      right: 92px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0,0,0,0.78);
      color: #fff;
      font-size: 13px;
      padding: 8px 10px;
      border-radius: 8px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.45);
      pointer-events: none;
      white-space: nowrap;
    }
    :host(.show-label) .tg-fw-label { display: block; }

    /* accessible off-screen text */
    .sr-only {
      position: absolute !important;
      width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
    }

    /* debug outline */
    :host(.tg-debug) #tg-btn { box-shadow: 0 0 0 4px rgba(255,0,0,0.12) inset, 0 10px 30px rgba(0,0,0,0.55); border: 2px dashed rgba(255,0,0,0.12); }
  `;

  // Fallback non-shadow CSS for environments that don't support shadow DOM
  const fallbackCSS = `
    /* namespaced ID-based fallback to reduce overrides */
    #${HOST_ID} { position: fixed !important; right: 18px !important; bottom: 18px !important; z-index: 2147483647 !important; pointer-events:auto !important; }
    #${HOST_ID} #tg-btn { width:72px !important; height:72px !important; border-radius:999px !important; background: linear-gradient(180deg,#ff4757,#e84118) !important; color:#fff !important; font-size:34px !important; display:inline-flex !important; align-items:center !important; justify-content:center !important; box-shadow:0 10px 30px rgba(0,0,0,0.55) !important; border:0 !important; cursor:pointer !important; user-select:none !important; -webkit-tap-highlight-color:transparent !important; }
    #${HOST_ID} .tg-fw-label { display: ${DEBUG ? 'block' : 'none'} !important; position:absolute !important; right:92px !important; top:50% !important; transform:translateY(-50%) !important; background:rgba(0,0,0,0.78) !important; color:#fff !important; padding:8px 10px !important; border-radius:8px !important; box-shadow:0 6px 18px rgba(0,0,0,0.45) !important; white-space:nowrap !important; pointer-events:none !important; }
    #${HOST_ID}.show-label .tg-fw-label { display:block !important; }
  `;

  // Helpers for collision detection
  function rectsIntersect(a, b, padding = 6) {
    return !(a.right - padding <= b.left + padding ||
             a.left + padding >= b.right - padding ||
             a.bottom - padding <= b.top + padding ||
             a.top + padding >= b.bottom - padding);
  }

  // create host container and shadow root (if possible)
  function createHost() {
    let host = document.getElementById(BASE_ID);
    if (host) return host;

    host = document.createElement('div');
    host.id = BASE_ID;

    // Try to attach a shadow root to isolate styles
    let useShadow = false;
    try {
      if (host.attachShadow) {
        host._shadow = host.attachShadow({ mode: 'open' });
        useShadow = true;
      }
    } catch (e) {
      useShadow = false;
    }

    // Build inner content
    const inner = ce('div', { id: 'tg-inner' });
    const btn = ce('button', { id: 'tg-btn', type: 'button', title: 'Open feedback panel', 'aria-label': 'Open feedback panel (redirects to feedback page)', html: '💬' });
    const label = ce('span', { class: 'tg-fw-label', html: 'Send feedback' });
    const sr = ce('span', { class: 'sr-only', text: 'Open feedback page' });

    inner.appendChild(btn);
    inner.appendChild(label);
    inner.appendChild(sr);

    if (useShadow) {
      // append style and inner to shadow root
      const style = document.createElement('style');
      style.textContent = widgetCSS;
      host._shadow.appendChild(style);
      host._shadow.appendChild(inner);
    } else {
      // fallback: put everything in normal DOM with a namespaced id and injected style
      host.appendChild(inner);
      // inject fallback css once
      if (!document.getElementById(BASE_ID + '-fallback-style')) {
        try {
          const fs = document.createElement('style');
          fs.id = BASE_ID + '-fallback-style';
          fs.textContent = fallbackCSS;
          document.head.appendChild(fs);
        } catch (e) {}
      }
    }

    // append to body (as last child)
    (document.body || document.documentElement).appendChild(host);
    return host;
  }

  // ensure button is interactive and wired
  function wire(host) {
    // If we used shadow root, query inside it; else query host subtree
    const root = host._shadow || host;
    const btn = root.querySelector('#tg-btn');
    const label = root.querySelector('.tg-fw-label');

    if (!btn) return null;

    // Click redirect (safe)
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        window.location.href = REDIRECT_URL;
      } catch (err) {
        console.error('[TG-WIDGET] redirect failed', err);
      }
    });

    // keyboard support
    btn.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
        ev.preventDefault();
        btn.click();
      }
    });

    // hover label toggling when not debug
    if (!DEBUG) {
      host.addEventListener('mouseenter', () => host.classList.add('show-label'));
      host.addEventListener('mouseleave', () => host.classList.remove('show-label'));
      // also support focus/blur for keyboard users
      btn.addEventListener('focus', () => host.classList.add('show-label'));
      btn.addEventListener('blur', () => host.classList.remove('show-label'));
    }

    return { btn, label };
  }

  // placement: avoid collisions with other fixed/sticky/high-z elements
  function placeAvoidingOverlap(host) {
    try {
      const root = host._shadow || host;
      const btn = root.querySelector('#tg-btn');
      if (!btn) return;

      // ensure fixed positioning on the host (shadow doesn't inherit host positioning)
      host.style.position = 'fixed';
      host.style.right = '18px';
      host.style.bottom = '18px';
      host.style.zIndex = '2147483647';
      host.style.pointerEvents = 'auto';

      // Build list of candidate blocking elements
      const els = Array.from(document.querySelectorAll('body *'));
      const candidates = [];
      els.forEach(el => {
        if (el === host) return;
        if (!(el instanceof HTMLElement)) return;
        const st = window.getComputedStyle(el);
        if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) === 0) return;
        const pos = st.position;
        const z = parseInt(st.zIndex, 10);
        if (pos === 'fixed' || pos === 'sticky' || pos === 'absolute' || (!isNaN(z) && z >= 1000)) {
          const r = el.getBoundingClientRect();
          if (!(r.width === 0 && r.height === 0)) candidates.push(el);
        }
      });

      // Start at bottom-right and nudge up until no collision
      let step = Math.max(12, Math.round(Math.min(window.innerHeight, window.innerWidth) * 0.02));
      let maxAttempts = Math.ceil(window.innerHeight / step) + 10;
      let attempts = 0;
      // initialize numeric bottom/right
      let bottom = 18;
      let right = 18;
      host.style.right = right + 'px';
      host.style.bottom = bottom + 'px';

      let wRect = host.getBoundingClientRect();
      while (attempts < maxAttempts) {
        let collides = false;
        for (const c of candidates) {
          const cRect = c.getBoundingClientRect();
          if (rectsIntersect(wRect, cRect, 6)) { collides = true; break; }
        }
        if (!collides) break;
        bottom += step;
        host.style.bottom = bottom + 'px';
        wRect = host.getBoundingClientRect();
        attempts++;
      }

      // If still colliding, try shifting left in small increments
      if (attempts >= maxAttempts) {
        let shifted = 0;
        while (shifted <= 160) {
          right += 18;
          host.style.right = right + 'px';
          shifted += 18;
          wRect = host.getBoundingClientRect();
          let coll = false;
          for (const c of candidates) {
            const cRect = c.getBoundingClientRect();
            if (rectsIntersect(wRect, cRect, 6)) { coll = true; break; }
          }
          if (!coll) {
            host.style.zIndex = '2147483647';
            return;
          }
        }
        // final fallback: lower z-index to avoid stealing modal clicks
        host.style.zIndex = '999999';
      } else {
        host.style.zIndex = '2147483647';
      }
    } catch (e) {
      // fail silently but log in dev console
      if (window.console && console.debug) console.debug('[TG-WIDGET] place failed', e);
    }
  }

  // observe DOM changes and adjust
  function observeAndAdjust(host) {
    let scheduled = false;
    const adjust = () => {
      scheduled = false;
      placeAvoidingOverlap(host);
    };
    const debounced = () => { if (scheduled) return; scheduled = true; setTimeout(adjust, 160); };

    try {
      const mo = new MutationObserver(debounced);
      mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    } catch (e) {}

    window.addEventListener('resize', debounced, { passive: true });
    window.addEventListener('orientationchange', debounced, { passive: true });
    window.addEventListener('scroll', debounced, { passive: true });

    // schedule a few adjustments for late-loaded content
    setTimeout(debounced, 120);
    setTimeout(debounced, 700);
    setTimeout(debounced, 2000);
  }

  // exposed debug helpers
  window.__TGFW = window.__TGFW || {};
  window.__TGFW.getElement = () => document.getElementById(BASE_ID);
  window.__TGFW.showDebug = function () {
    const host = document.getElementById(BASE_ID);
    if (!host) return console.warn('[TG-WIDGET] no element');
    host.classList.add('tg-debug', 'show-label');
    host.style.width = '88px';
    host.style.height = '88px';
    placeAvoidingOverlap(host);
    console.info('[TG-WIDGET] debug visible');
  };
  window.__TGFW.hideDebug = function () {
    const host = document.getElementById(BASE_ID);
    if (!host) return;
    host.classList.remove('tg-debug', 'show-label');
    placeAvoidingOverlap(host);
    console.info('[TG-WIDGET] debug hidden');
  };
  window.__TGFW.forceFlash = function (times = 3) {
    const host = document.getElementById(BASE_ID);
    if (!host) return;
    const root = host._shadow || host;
    const btn = root.querySelector('#tg-btn');
    if (!btn) return;
    let i = 0;
    const iv = setInterval(() => {
      btn.style.transform = 'translateY(-12px) scale(1.02)';
      setTimeout(() => btn.style.transform = '', 180);
      i++;
      if (i >= times) clearInterval(iv);
    }, 320);
  };

  // init logic
  function init() {
    if (!document.body) return setTimeout(init, 50);
    const host = createHost();
    // if createHost appended but shadow root exists, set an id on host for easier debugging
    host.id = BASE_ID;

    // If shadow used, host._shadow exists. Ensure host has the public fallback id for query
    try {
      // wire button events
      wire(host);
      // initial placement
      placeAvoidingOverlap(host);
      // observe changes
      observeAndAdjust(host);
      // small visible cue
      setTimeout(() => { try { window.__TGFW.forceFlash(2); } catch (e) {} }, 350);
      console.log('[TG-WIDGET] initialized (shadow:' + (!!host._shadow) + ')');
      console.log('  - run __TGFW.getElement(), __TGFW.showDebug(), or __TGFW.forceFlash() from console for debugging');
    } catch (e) {
      console.error('[TG-WIDGET] init failed', e);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else window.addEventListener('DOMContentLoaded', init);

  console.log('[TG-WIDGET] loaded. If you cannot see it, run __TGFW.showDebug() in the console.');
})();