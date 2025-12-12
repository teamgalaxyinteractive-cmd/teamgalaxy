// feedback-widget.js — redirect fixed + smoother animation + robust pointer handling
(function () {
  if (window.__TG_FEEDBACK_WIDGET_INJECTED__) return;
  window.__TG_FEEDBACK_WIDGET_INJECTED__ = true;

  const REDIRECT_URL = '/user_feedback';
  const BASE_ID = 'tg-feedback-widget-v1-root';
  const DEBUG = false;
  const SHOW_DELAY_MS = 5000; // 5s delay before showing

  // Utilities
  function ce(tag, attrs = {}) {
    const el = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'html') el.innerHTML = attrs[k];
      else if (k === 'text') el.textContent = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    return el;
  }
  function rectsIntersect(a, b, padding = 6) {
    return !(a.right - padding <= b.left + padding ||
             a.left + padding >= b.right - padding ||
             a.bottom - padding <= b.top + padding ||
             a.top + padding >= b.bottom - padding);
  }

  // Create host and shadow, with isolated styles
  function createHost() {
    let host = document.getElementById(BASE_ID);
    if (host) return host;

    host = document.createElement('div');
    host.id = BASE_ID;
    // initial hidden state
    host.style.pointerEvents = 'none';
    host.style.opacity = '0';

    // try shadow root
    let useShadow = false;
    try { if (host.attachShadow) { host._shadow = host.attachShadow({ mode: 'open' }); useShadow = true; } } catch (e) { useShadow = false; }

    // inner structure
    const inner = ce('div', { id: 'tg-inner' });
    const btn = ce('button', { id: 'tg-btn', type: 'button', title: 'Open feedback panel', 'aria-label': 'Open feedback panel (redirects to feedback page)', html: '💬' });
    const label = ce('span', { class: 'tg-fw-label', html: 'Send feedback' });
    const sr = ce('span', { class: 'sr-only', text: 'Open feedback page' });
    inner.appendChild(btn); inner.appendChild(label); inner.appendChild(sr);

    // isolated strong CSS (shadow or fallback)
    const css = `
      :host { all: initial; position: fixed; right: 18px; bottom: 18px; z-index: 2147483647; display:block; pointer-events:none;
             transform: translateY(28px); opacity:0; transition: transform 520ms cubic-bezier(.16,.84,.34,1), opacity 420ms ease;
             will-change: transform, opacity; }
      :host(.tg-visible) { transform: translateY(0); opacity:1; pointer-events:auto; }
      #tg-btn { box-sizing:border-box; width:86px; height:86px; border-radius:22px; background: linear-gradient(180deg,#ff6b6b,#ff4757);
               color:#fff; font-size:40px; display:inline-flex; align-items:center; justify-content:center; border:none;
               cursor:pointer; user-select:none; -webkit-tap-highlight-color:transparent; transition: transform .12s ease, box-shadow .12s ease;
               box-shadow: 0 14px 48px rgba(0,0,0,0.55); outline:none; }
      #tg-btn:hover { transform: translateY(-8px); box-shadow: 0 26px 70px rgba(0,0,0,0.6); }
      #tg-btn:active { transform: translateY(-3px) scale(.995); }
      #tg-btn:focus { outline: 4px solid rgba(255,255,255,0.12); outline-offset: 4px; }
      #tg-btn::before { content:''; position:absolute; inset:-6px; border-radius:26px; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.03), transparent 25%); pointer-events:none; }
      .tg-fw-label { display:none; position:absolute; right:110px; top:50%; transform:translateY(-50%); background: rgba(6,10,20,0.95);
                     color:#fff; font-size:13px; padding:10px 14px; border-radius:12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); pointer-events:none; white-space:nowrap; }
      :host(.show-label) .tg-fw-label { display:block; }
      .sr-only { position:absolute !important; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
      @media (max-width:600px){ #tg-btn{ width:72px; height:72px; font-size:34px;} .tg-fw-label{ right:96px; padding:8px 12px; font-size:12px;} }
      @media (prefers-reduced-motion: reduce){ :host, :host(.tg-visible){ transition: none; transform:none; opacity:1; } }
    `;

    if (useShadow) {
      const style = document.createElement('style'); style.textContent = css;
      host._shadow.appendChild(style);
      host._shadow.appendChild(inner);
    } else {
      // fallback: inject namespaced style into head
      const fsId = BASE_ID + '-fallback-style';
      if (!document.getElementById(fsId)) {
        try {
          const fs = document.createElement('style'); fs.id = fsId;
          // convert :host rules to #BASE_ID selectors for fallback
          const fallback = css.replace(/:host\b/g, `#${BASE_ID}`).replace(/:host\(\.tg-visible\)/g, `#${BASE_ID}.tg-visible`);
          fs.textContent = fallback;
          document.head.appendChild(fs);
        } catch (e) {}
      }
      host.appendChild(inner);
    }

    (document.body || document.documentElement).appendChild(host);
    return host;
  }

  // Wire interactions and robust redirect
  function wire(host) {
    const root = host._shadow || host;
    const btn = root.querySelector('#tg-btn');
    if (!btn) return;

    function doRedirect() {
      try {
        if (window && typeof window.location !== 'undefined' && typeof window.location.assign === 'function') {
          console.debug && console.debug('[TG-WIDGET] redirecting via location.assign ->', REDIRECT_URL);
          window.location.assign(REDIRECT_URL);
          return;
        }
      } catch (e) { console.warn('[TG-WIDGET] location.assign failed, fallbacking', e); }

      // Fallback: try window.open in same tab, then new tab
      try {
        console.debug && console.debug('[TG-WIDGET] fallback redirect via window.open');
        window.open(REDIRECT_URL, '_self');
      } catch (e) {
        try { window.open(REDIRECT_URL, '_blank'); } catch (er) { console.error('[TG-WIDGET] final redirect fallback failed', er); }
      }
    }

    // Ensure button is keyboard accessible
    btn.setAttribute('tabindex', '0');
    btn.addEventListener('click', (e) => {
      try { e.preventDefault(); } catch (err) {}
      // small tactile press feedback
      try {
        btn.style.transform = 'translateY(-3px) scale(.995)';
        setTimeout(() => { btn.style.transform = ''; }, 140);
      } catch (e) {}
      // final redirect
      doRedirect();
    });

    btn.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
        ev.preventDefault();
        btn.click();
      }
    });

    // label show/hide
    host.addEventListener('mouseenter', () => host.classList.add('show-label'));
    host.addEventListener('mouseleave', () => host.classList.remove('show-label'));
    btn.addEventListener('focus', () => host.classList.add('show-label'));
    btn.addEventListener('blur', () => host.classList.remove('show-label'));
  }

  // Place to avoid overlap: keeps similar to earlier logic
  function placeAvoidingOverlap(host) {
    try {
      host.style.position = 'fixed';
      host.style.right = '18px';
      host.style.bottom = '18px';
      host.style.pointerEvents = 'none'; // keep off until we explicitly enable after placement

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
          if (!coll) { host.style.zIndex = '2147483647'; host.style.pointerEvents = 'none'; return; }
        }
        host.style.zIndex = '999999';
      } else {
        host.style.zIndex = '2147483647';
      }
      // keep pointer-events none here; enabling happens when making visible
    } catch (e) {
      console.debug && console.debug('[TG-WIDGET] placeAvoidingOverlap failed', e);
    }
  }

  // Observe changes and nudge placement
  function observeAndAdjust(host) {
    let scheduled = false;
    const adj = () => { scheduled = false; placeAvoidingOverlap(host); };
    const debounced = () => { if (scheduled) return; scheduled = true; setTimeout(adj, 180); };

    try {
      const mo = new MutationObserver(debounced);
      mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    } catch (e) {}
    window.addEventListener('resize', debounced, { passive: true });
    window.addEventListener('orientationchange', debounced, { passive: true });
    window.addEventListener('scroll', debounced, { passive: true });

    setTimeout(debounced, 300);
    setTimeout(debounced, 900);
    setTimeout(debounced, 2200);
  }

  // Init: create, wire, delay show with smooth animation and enable pointer events
  function init() {
    if (!document.body) return setTimeout(init, 50);
    const host = createHost();
    wire(host);

    // initially hidden and non-interactive; placement run just before showing
    host.classList.remove('tg-visible', 'show-label');
    host.style.pointerEvents = 'none';

    setTimeout(() => {
      try {
        placeAvoidingOverlap(host); // compute safe spot before reveal
        // reveal: add class (shadow or fallback CSS will animate)
        host.classList.add('tg-visible');
        // enable pointer events for interaction
        host.style.pointerEvents = 'auto';
        // ensure host visible in case fallback didn't animate
        host.style.opacity = '1';
        // observe changes afterwards
        observeAndAdjust(host);
        // tiny flash to draw attention (avoid if reduced motion)
        try {
          if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const root = host._shadow || host;
            const btn = root.querySelector('#tg-btn');
            if (btn) {
              btn.style.transform = 'translateY(-10px) scale(1.02)';
              setTimeout(() => btn.style.transform = '', 280);
            }
          }
        } catch (e) {}
        console.info('[TG-WIDGET] shown after delay');
      } catch (e) {
        console.error('[TG-WIDGET] show failed', e);
      }
    }, SHOW_DELAY_MS);

    // expose small debug hooks
    window.__TGFW = window.__TGFW || {};
    window.__TGFW.getElement = () => document.getElementById(BASE_ID);
    window.__TGFW.showDebug = function () {
      const hostEl = document.getElementById(BASE_ID);
      if (!hostEl) return console.warn('[TG-WIDGET] not found');
      hostEl.classList.add('tg-debug', 'show-label', 'tg-visible');
      hostEl.style.pointerEvents = 'auto';
      hostEl.style.opacity = '1';
      placeAvoidingOverlap(hostEl);
      console.info('[TG-WIDGET] debug visible');
    };
    window.__TGFW.forceFlash = function () {
      const hostEl = document.getElementById(BASE_ID);
      if (!hostEl) return;
      const root = hostEl._shadow || hostEl;
      const btn = root.querySelector('#tg-btn');
      if (!btn) return;
      btn.style.transform = 'translateY(-10px) scale(1.02)';
      setTimeout(() => btn.style.transform = '', 280);
    };
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else window.addEventListener('DOMContentLoaded', init);

  console.log('[TG-WIDGET] loaded. If redirect still fails: open console and run __TGFW.showDebug() to inspect the element.');
})();