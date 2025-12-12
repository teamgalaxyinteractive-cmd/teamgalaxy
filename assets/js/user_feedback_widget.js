// feedback-widget.js — delayed, animated, nicer UI, shadow-dom isolated, robust placement
(function () {
  if (window.__TG_FEEDBACK_WIDGET_INJECTED__) return;
  window.__TG_FEEDBACK_WIDGET_INJECTED__ = true;

  const REDIRECT_URL = '/user_feedback';
  const BASE_ID = 'tg-feedback-widget-v1-root';
  const DEBUG = false;

  // Show delay (ms)
  const SHOW_DELAY_MS = 5000; // 5 seconds initial hidden period

  // Utility: create element
  function ce(tag, attrs = {}) {
    const el = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'html') el.innerHTML = attrs[k];
      else if (k === 'text') el.textContent = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    return el;
  }

  // Collision detection helper
  function rectsIntersect(a, b, padding = 6) {
    return !(a.right - padding <= b.left + padding ||
             a.left + padding >= b.right - padding ||
             a.bottom - padding <= b.top + padding ||
             a.top + padding >= b.bottom - padding);
  }

  // Create host and shadow content (if available)
  function createHost() {
    let host = document.getElementById(BASE_ID);
    if (host) return host;

    host = document.createElement('div');
    host.id = BASE_ID;
    // prevent accidental fading from host by default
    host.style.pointerEvents = 'none';
    host.style.opacity = '0';
    host.style.transition = 'opacity 360ms ease';

    // Try Shadow DOM for style isolation
    let useShadow = false;
    try {
      if (host.attachShadow) {
        host._shadow = host.attachShadow({ mode: 'open' });
        useShadow = true;
      }
    } catch (e) {
      useShadow = false;
    }

    // Build inner markup
    const inner = ce('div', { id: 'tg-inner' });
    const btn = ce('button', { id: 'tg-btn', type: 'button', title: 'Open feedback panel', 'aria-label': 'Open feedback panel (redirects to feedback page)', html: '&#128172;' }); // 💬
    const label = ce('span', { class: 'tg-fw-label', html: 'Send feedback' });
    const sr = ce('span', { class: 'sr-only', text: 'Open feedback page' });

    inner.appendChild(btn);
    inner.appendChild(label);
    inner.appendChild(sr);

    // Strong isolated CSS for shadow root
    const widgetCSS = `
      :host {
        all: initial;
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 2147483647;
        display: block;
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        transform: translateY(28px);
        opacity: 0;
        transition: transform 420ms cubic-bezier(.2,.9,.2,1), opacity 360ms ease;
      }

      :host(.tg-visible) {
        transform: translateY(0);
        opacity: 1;
        pointer-events: auto;
      }

      #tg-btn {
        box-sizing: border-box;
        position: relative;
        width: 84px;
        height: 84px;
        border-radius: 20px;
        background: linear-gradient(180deg,#ff6b6b,#ff4757);
        background-origin: border-box;
        padding: 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 38px;
        line-height: 1;
        border: none;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        box-shadow: 0 12px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(255,99,130,0.06) inset;
        transition: transform .14s ease, box-shadow .14s ease;
        outline: none;
      }
      #tg-btn:hover { transform: translateY(-8px); box-shadow: 0 20px 56px rgba(0,0,0,0.6); }
      #tg-btn:active { transform: translateY(-3px) scale(.99); }
      #tg-btn:focus { outline: 4px solid rgba(255,255,255,0.12); outline-offset: 4px; }

      /* decorative ring for subtle polish */
      #tg-btn::before {
        content: "";
        position: absolute;
        inset: -6px;
        border-radius: 26px;
        background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.03), transparent 25%);
        pointer-events: none;
      }

      .tg-fw-label {
        display: none;
        position: absolute;
        right: 106px;
        top: 50%;
        transform: translateY(-50%);
        background: linear-gradient(180deg, rgba(3,7,18,0.95), rgba(12,16,28,0.9));
        color: #fff;
        font-size: 13px;
        padding: 10px 14px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        pointer-events: none;
        white-space: nowrap;
        letter-spacing: 0.1px;
      }
      :host(.show-label) .tg-fw-label { display: block; }

      .sr-only {
        position: absolute !important;
        width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
      }

      :host(.tg-debug) #tg-btn {
        box-shadow: 0 0 0 6px rgba(255,0,0,0.12) inset, 0 20px 60px rgba(0,0,0,0.6);
      }

      @media (max-width: 600px) {
        #tg-btn { width: 72px; height: 72px; font-size: 32px; border-radius: 18px; }
        .tg-fw-label { right: 94px; padding: 8px 12px; font-size: 12px; border-radius: 10px; }
      }
    `;

    if (useShadow) {
      const style = document.createElement('style');
      style.textContent = widgetCSS;
      host._shadow.appendChild(style);
      host._shadow.appendChild(inner);
    } else {
      // Fallback: minimal namespaced style injection to avoid page overrides
      const fallbackCSS = `
        #${BASE_ID} { position: fixed !important; right: 18px !important; bottom: 18px !important; z-index: 2147483647 !important; pointer-events: none !important; transform: translateY(28px); opacity: 0; transition: transform 420ms cubic-bezier(.2,.9,.2,1), opacity 360ms ease !important; }
        #${BASE_ID}.tg-visible { transform: translateY(0) !important; opacity: 1 !important; pointer-events: auto !important; }
        #${BASE_ID} #tg-btn { width:84px !important; height:84px !important; border-radius:20px !important; font-size:38px !important; background: linear-gradient(180deg,#ff6b6b,#ff4757) !important; box-shadow: 0 12px 40px rgba(0,0,0,0.55) !important; border: none !important; cursor: pointer !important; display:inline-flex !important; align-items:center !important; justify-content:center !important; }
        #${BASE_ID} .tg-fw-label { display:none !important; position:absolute !important; right:106px !important; top:50% !important; transform:translateY(-50%) !important; background: rgba(3,7,18,0.95) !important; color:#fff !important; padding:10px 14px !important; border-radius:12px !important; box-shadow:0 10px 30px rgba(0,0,0,0.5) !important; pointer-events:none !important; white-space:nowrap !important; }
        #${BASE_ID}.show-label .tg-fw-label { display:block !important; }
        @media (max-width:600px) { #${BASE_ID} #tg-btn { width:72px !important; height:72px !important; font-size:32px !important; } #${BASE_ID} .tg-fw-label { right:94px !important; padding:8px 12px !important; } }
      `;
      const fsId = BASE_ID + '-fallback-style';
      if (!document.getElementById(fsId)) {
        const fs = document.createElement('style');
        fs.id = fsId;
        fs.textContent = fallbackCSS;
        document.head.appendChild(fs);
      }
      host.appendChild(inner);
    }

    // append host, but keep it invisible/untouchable initially
    (document.body || document.documentElement).appendChild(host);
    return host;
  }

  // Wire interactions
  function wire(host) {
    const root = host._shadow || host;
    const btn = root.querySelector('#tg-btn');
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      try { window.location.href = REDIRECT_URL; } catch (err) { console.error('[TG-WIDGET] redirect failed', err); }
    });
    btn.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
        ev.preventDefault(); btn.click();
      }
    });

    // show/hide label on hover/focus when not debug
    if (!DEBUG) {
      host.addEventListener('mouseenter', () => host.classList.add('show-label'));
      host.addEventListener('mouseleave', () => host.classList.remove('show-label'));
      btn.addEventListener('focus', () => host.classList.add('show-label'));
      btn.addEventListener('blur', () => host.classList.remove('show-label'));
    }
  }

  // Placement: avoid collisions; this runs right before showing
  function placeAvoidingOverlap(host) {
    try {
      const root = host._shadow || host;
      // ensure host uses fixed coordinates
      host.style.position = 'fixed';
      host.style.right = '18px';
      host.style.bottom = '18px';
      host.style.pointerEvents = 'none'; // keep off until explicitly enabled

      const els = Array.from(document.querySelectorAll('body *'));
      const candidates = [];
      for (const el of els) {
        if (el === host) continue;
        if (!(el instanceof HTMLElement)) continue;
        const st = window.getComputedStyle(el);
        if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) === 0) continue;
        const pos = st.position;
        const z = parseInt(st.zIndex, 10);
        if (pos === 'fixed' || pos === 'sticky' || pos === 'absolute' || (!isNaN(z) && z >= 1000)) {
          const r = el.getBoundingClientRect();
          if (!(r.width === 0 && r.height === 0)) candidates.push(el);
        }
      }

      let step = Math.max(12, Math.round(Math.min(window.innerHeight, window.innerWidth) * 0.02));
      let maxAttempts = Math.ceil(window.innerHeight / step) + 12;
      let attempts = 0;
      let bottom = 18;
      let right = 18;
      host.style.right = right + 'px';
      host.style.bottom = bottom + 'px';

      let hRect = host.getBoundingClientRect();
      while (attempts < maxAttempts) {
        let collides = false;
        for (const c of candidates) {
          const cRect = c.getBoundingClientRect();
          if (rectsIntersect(hRect, cRect, 8)) { collides = true; break; }
        }
        if (!collides) break;
        bottom += step;
        host.style.bottom = bottom + 'px';
        hRect = host.getBoundingClientRect();
        attempts++;
      }

      if (attempts >= maxAttempts) {
        // try shift left fallback
        let shifted = 0;
        while (shifted <= 200) {
          right += 20;
          host.style.right = right + 'px';
          shifted += 20;
          hRect = host.getBoundingClientRect();
          let coll = false;
          for (const c of candidates) {
            const cRect = c.getBoundingClientRect();
            if (rectsIntersect(hRect, cRect, 8)) { coll = true; break; }
          }
          if (!coll) { host.style.zIndex = '2147483647'; return; }
        }
        host.style.zIndex = '999999';
      } else {
        host.style.zIndex = '2147483647';
      }
    } catch (e) {
      if (window.console && console.debug) console.debug('[TG-WIDGET] place failed', e);
    }
  }

  // Observe page changes and nudge if needed after shown
  function observeAndAdjust(host) {
    let scheduled = false;
    const adjust = () => { scheduled = false; try { placeAvoidingOverlap(host); } catch (e) {} };
    const debounced = () => { if (scheduled) return; scheduled = true; setTimeout(adjust, 180); };

    try {
      const mo = new MutationObserver(debounced);
      mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    } catch (e) {}
    window.addEventListener('resize', debounced, { passive: true });
    window.addEventListener('orientationchange', debounced, { passive: true });
    window.addEventListener('scroll', debounced, { passive: true });

    // a few scheduled adjustments (late loads)
    setTimeout(debounced, 300);
    setTimeout(debounced, 900);
    setTimeout(debounced, 2200);
  }

  // Debug helpers
  window.__TGFW = window.__TGFW || {};
  window.__TGFW.getElement = () => document.getElementById(BASE_ID);
  window.__TGFW.showDebug = function () {
    const host = document.getElementById(BASE_ID);
    if (!host) return console.warn('[TG-WIDGET] not found');
    host.classList.add('tg-debug', 'show-label', 'tg-visible');
    host.style.pointerEvents = 'auto';
    host.style.opacity = '1';
    placeAvoidingOverlap(host);
    console.info('[TG-WIDGET] debug-visible');
  };
  window.__TGFW.hideDebug = function () {
    const host = document.getElementById(BASE_ID);
    if (!host) return;
    host.classList.remove('tg-debug', 'show-label', 'tg-visible');
    host.style.pointerEvents = 'none';
    host.style.opacity = '0';
    console.info('[TG-WIDGET] debug-hidden');
  };
  window.__TGFW.forceFlash = function (times = 3) {
    const host = document.getElementById(BASE_ID);
    if (!host) return;
    const root = host._shadow || host;
    const btn = root.querySelector('#tg-btn');
    if (!btn) return;
    let i = 0;
    const iv = setInterval(() => {
      btn.style.transform = 'translateY(-14px) scale(1.02)';
      setTimeout(() => btn.style.transform = '', 220);
      i++;
      if (i >= times) clearInterval(iv);
    }, 380);
  };

  // Initialize: create host, wire, but DO NOT show immediately
  function init() {
    if (!document.body) return setTimeout(init, 50);
    const host = createHost();
    host.id = BASE_ID; // ensure id present for debug APIs
    const root = host._shadow || host;

    wire(host);

    // keep hidden initially for SHOW_DELAY_MS to avoid "random ghumta" while layout is settling
    host.style.pointerEvents = 'none';
    host.classList.remove('tg-visible', 'show-label');

    // Wait SHOW_DELAY_MS, then run placement and reveal with slide-from-bottom
    setTimeout(() => {
      try {
        placeAvoidingOverlap(host);
        // allow pointer events after placement
        host.style.pointerEvents = 'auto';
        // make visible using host class — shadow CSS will animate transform/opacity
        host.classList.add('tg-visible');
        // small opacity safety
        host.style.opacity = '1';
        // start observing page changes for later nudges
        observeAndAdjust(host);
        // gentle entrance cue
        try { window.__TGFW.forceFlash(1); } catch (e) {}
        console.log('[TG-WIDGET] shown after delay');
      } catch (e) {
        console.error('[TG-WIDGET] show failed', e);
      }
    }, SHOW_DELAY_MS);

    // Informational console
    console.log('[TG-WIDGET] initialized (will appear after ' + (SHOW_DELAY_MS/1000) + 's). Use __TGFW.getElement(), __TGFW.showDebug() in console for debugging.');
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else window.addEventListener('DOMContentLoaded', init);
})();