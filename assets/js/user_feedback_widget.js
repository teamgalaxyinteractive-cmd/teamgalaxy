// feedback-widget.js
// Standalone script to inject a non-overlapping floating feedback button
// Usage: include this file on any page. Button redirects to /user_feedback.

(function () {
  if (window.__TG_FEEDBACK_WIDGET_INJECTED__) return;
  window.__TG_FEEDBACK_WIDGET_INJECTED__ = true;

  const REDIRECT_URL = '/user_feedback';
  const ID = 'tg-feedback-widget-v1';
  const STYLE_ID = 'tg-feedback-widget-style-v1';

  // CSS for the widget
  const css = `
  /* widget container */
  #${ID} {
    position:fixed;
    right:18px;
    bottom:18px;
    z-index: 2147483000; /* very high but below browser chrome */
    display:flex;
    align-items:center;
    justify-content:center;
    width:64px;
    height:64px;
    border-radius:999px;
    background:linear-gradient(180deg,#ff4757,#e84118);
    box-shadow: 0 8px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06);
    color:#fff;
    font-size:28px;
    cursor:pointer;
    border: 0;
    transition: transform .12s ease, box-shadow .12s ease, opacity .12s;
    user-select:none;
    -webkit-tap-highlight-color: transparent;
  }
  #${ID}:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.5); }
  #${ID}:active { transform: translateY(-1px) scale(.99); }
  #${ID}:focus { outline: 3px solid rgba(255,200,200,.15); outline-offset: 4px; }
  /* small label that can appear to the left if there's space */
  #${ID} .tg-fw-label {
    display:none;
    position:absolute;
    right:80px;
    white-space:nowrap;
    background: rgba(0,0,0,0.75);
    color: #fff;
    font-size: 13px;
    padding: 8px 10px;
    border-radius: 8px;
    box-shadow: 0 6px 18px rgba(0,0,0,0.45);
    transform-origin: right center;
    transform: translateY(-2px);
  }
  #${ID}:hover .tg-fw-label { display:block; }
  /* accessibility: hide for visual but available to screen readers */
  #${ID} .sr-only {
    position: absolute !important;
    width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;
  }
  `;

  // inject style
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  // helper: check if two rects intersect (with a small padding)
  function rectsIntersect(a, b, padding = 6) {
    return !(a.right - padding <= b.left + padding ||
             a.left + padding >= b.right - padding ||
             a.bottom - padding <= b.top + padding ||
             a.top + padding >= b.bottom - padding);
  }

  // create widget element
  function createWidget() {
    if (document.getElementById(ID)) return document.getElementById(ID);

    const btn = document.createElement('button');
    btn.id = ID;
    btn.type = 'button';
    btn.title = 'Open feedback panel';
    btn.setAttribute('aria-label', 'Open feedback panel (redirects to feedback page)');
    btn.innerHTML = `
      <span aria-hidden="true">💬</span>
      <span class="tg-fw-label" aria-hidden="true">Send feedback</span>
      <span class="sr-only">Open feedback page</span>
    `;
    // click behaviour: navigate
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        // prefer SPA-friendly navigation if available
        if (window.history && typeof window.history.pushState === 'function' && window.location.pathname !== REDIRECT_URL) {
          // If you want pure redirect uncomment next line and comment pushState:
          // window.location.href = REDIRECT_URL;
          // We'll try a normal top-level redirect to be safe
          window.location.href = REDIRECT_URL;
        } else {
          window.location.href = REDIRECT_URL;
        }
      } catch (_) {
        window.location.href = REDIRECT_URL;
      }
    });

    // keyboard accessible: Enter / Space
    btn.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        btn.click();
      }
    });

    // allow right-click context menu (don't block)
    btn.style.touchAction = 'manipulation';

    document.body.appendChild(btn);
    return btn;
  }

  // attempt to place widget at bottom-right but avoid overlapping other fixed/sticky elements
  function placeWidgetAvoidingOverlap(widget) {
    const viewport = document.documentElement.getBoundingClientRect();
    // start from bottom-right margin values used in CSS
    const marginRight = 18;
    const marginBottom = 18;
    // compute current widget rect by temporarily setting to that position (already styled as fixed).
    widget.style.right = marginRight + 'px';
    widget.style.bottom = marginBottom + 'px';
    widget.style.top = '';
    widget.style.left = '';
    widget.style.opacity = '1';

    // find potential colliding elements: all elements with position fixed or sticky or absolute + high z-index
    const candidates = Array.from(document.querySelectorAll('body *')).filter(el => {
      if (el === widget) return false;
      if (!(el instanceof HTMLElement)) return false;
      const st = window.getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') return false;
      const pos = st.position;
      if (pos === 'fixed' || pos === 'sticky' || pos === 'absolute') {
        // ignore elements with zero-size
        const r = el.getBoundingClientRect();
        return !(r.width === 0 && r.height === 0);
      }
      // also consider sticky and fixed-like floating UI by z-index threshold
      const z = parseInt(st.zIndex, 10);
      if (!Number.isNaN(z) && z >= 1000) return true;
      return false;
    });

    // we will try to move the widget upward in steps until it doesn't intersect any candidate
    const step = 8; // px per attempt
    const maxAttempts = Math.ceil(window.innerHeight / step) + 10;
    let attempts = 0;
    // compute bounding rect of widget
    let wRect = widget.getBoundingClientRect();

    // loop until no intersection with any candidate or reached top limit
    while (attempts < maxAttempts) {
      let collides = false;
      for (const c of candidates) {
        try {
          const cRect = c.getBoundingClientRect();
          if (rectsIntersect(wRect, cRect, 6)) {
            collides = true;
            break;
          }
        } catch (err) { /* ignore weird elements */ }
      }
      if (!collides) break;
      // nudge widget upward by 'step' px
      const currentBottom = parseFloat(widget.style.bottom || marginBottom);
      const newBottom = currentBottom + step; // increase bottom moves it up visually
      widget.style.bottom = newBottom + 'px';
      // update rect and loop
      wRect = widget.getBoundingClientRect();
      attempts += 1;
    }

    // as fallback, if still colliding, move slightly left so it can sit beside other widget
    // check one more time
    let finalCollide = false;
    wRect = widget.getBoundingClientRect();
    for (const c of candidates) {
      const cRect = c.getBoundingClientRect();
      if (rectsIntersect(wRect, cRect, 6)) { finalCollide = true; break; }
    }
    if (finalCollide) {
      // attempt a left shift in steps up to 120px
      const maxLeftShift = 120;
      let shifted = 0;
      while (shifted < maxLeftShift) {
        const currentRight = parseFloat(widget.style.right || marginRight);
        const newRight = currentRight + 16; // move left by increasing right
        widget.style.right = newRight + 'px';
        shifted += 16;
        wRect = widget.getBoundingClientRect();
        // re-check collisions
        let coll = false;
        for (const c of candidates) {
          const cRect = c.getBoundingClientRect();
          if (rectsIntersect(wRect, cRect, 6)) { coll = true; break; }
        }
        if (!coll) { finalCollide = false; break; }
      }
    }

    // If still colliding, reduce z-index to avoid stealing clicks from modal overlays
    if (finalCollide) {
      widget.style.zIndex = 999999;
    } else {
      // ensure top visibility for normal pages
      widget.style.zIndex = 2147483000;
    }
  }

  // observe DOM mutations (new floating elements added) and re-run placement occasionally
  function observeAndAdjust(widget) {
    let scheduled = false;
    const adjust = () => {
      scheduled = false;
      placeWidgetAvoidingOverlap(widget);
    };
    const debouncedAdjust = () => {
      if (scheduled) return;
      scheduled = true;
      setTimeout(adjust, 160);
    };

    // watch for layout changes
    const mo = new MutationObserver(debouncedAdjust);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

    // also adjust on resize / scroll / orientationchange
    window.addEventListener('resize', debouncedAdjust, { passive: true });
    window.addEventListener('orientationchange', debouncedAdjust, { passive: true });
    window.addEventListener('scroll', debouncedAdjust, { passive: true });

    // initial run + small delayed runs (to catch late-loading widgets)
    setTimeout(debouncedAdjust, 200);
    setTimeout(debouncedAdjust, 1000);
    setTimeout(debouncedAdjust, 2500);
  }

  // main insertion flow
  function init() {
    // If body not ready, wait
    if (!document.body) {
      return setTimeout(init, 50);
    }
    const widget = createWidget();
    placeWidgetAvoidingOverlap(widget);
    observeAndAdjust(widget);
  }

  // run on ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    window.addEventListener('DOMContentLoaded', init);
  }

})();