/*!
 * TeamGalaxy Cookie Consent — Fixed version
 * - Avoids :root leaks (no global CSS variables)
 * - Removes banner from interaction after hide (display:none)
 * - Removes banner from DOM after accept (so nothing blocks page)
 * - Proper modal focus/escape/tab handling
 * - Minimal global side-effects
 *
 * Replace GA_MEASUREMENT_ID with your GA4 id.
 */
(function () {
  'use strict';

  // --------- CONFIG ----------
  const GA_MEASUREMENT_ID = 'G-6C2W9NSNCH'; // <-- REPLACE
  const CONSENT_KEY = 'teamgalaxy_cookie_consent_v1';
  const CONSENT_EXP_DAYS = 365;
  const SHOW_DELAY_MS = 500; // banner show delay after load
  const HIDE_ANIM_MS = 320; // should match CSS transition
  // ---------------------------

  // --- Small helpers ---
  function createEl(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') el.className = attrs[k];
      else if (k === 'html') el.innerHTML = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (!c) return;
      if (typeof c === 'string') el.appendChild(document.createTextNode(c));
      else el.appendChild(c);
    });
    return el;
  }
  function nowISO() { return new Date().toISOString(); }
  function daysSince(iso) {
    try { return (new Date() - new Date(iso)) / (1000 * 60 * 60 * 24); }
    catch (e) { return Infinity; }
  }

  // --- CONSENT store ---
  function saveConsent(obj) {
    obj.timestamp = nowISO();
    localStorage.setItem(CONSENT_KEY, JSON.stringify(obj));
  }
  function readConsent() {
    try { const s = localStorage.getItem(CONSENT_KEY); return s ? JSON.parse(s) : null; }
    catch (e) { return null; }
  }
  function removeConsent() { localStorage.removeItem(CONSENT_KEY); }

  // --- Namespaced CSS ---
  const css = `
  /* All variables and styles are scoped under .tg-cookie-banner-root to prevent leakage */
  .tg-cookie-banner-root { --tg-bg: rgba(7,10,20,0.88); --tg-text: #e9f0ff; --tg-muted: #b9c7e0; --tg-accent: #6b4bff; --tg-radius: 12px; --tg-shadow: 0 10px 40px rgba(3,6,23,0.6); }
  .tg-cookie-banner {
    position: fixed;
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    z-index: 14000;
    display: flex;
    justify-content: center;
    pointer-events: none; /* outer wrapper doesn't capture events */
  }
  .tg-cookie-inner {
    width: 100%;
    max-width: 980px;
    background: var(--tg-bg);
    color: var(--tg-text);
    border-radius: var(--tg-radius);
    box-shadow: var(--tg-shadow);
    padding: 14px 16px;
    display: flex;
    gap: 12px;
    align-items: center;
    pointer-events: auto; /* inner content receives events */
    transform: translateY(24px) scale(0.995);
    opacity: 0;
    transition: transform 300ms cubic-bezier(.2,.9,.2,1), opacity 300ms;
    backdrop-filter: blur(6px) saturate(120%);
    position: relative;
  }
  .tg-cookie-inner.tg-visible { transform: translateY(0) scale(1); opacity: 1; }
  .tg-emoji { font-size: 1.8rem; margin-left: 4px; flex: 0 0 auto; }
  .tg-text-block { flex: 1 1 auto; min-width: 0; }
  .tg-text-block p { margin: 0; line-height: 1.25; }
  .tg-title { font-weight: 700; }
  .tg-sub { color: var(--tg-muted); margin-top: 4px; font-size: 0.92rem; }

  .tg-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; flex: 0 0 auto; }
  .tg-btn { min-height: 42px; min-width: 44px; padding: 8px 12px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; font-family: inherit; background: transparent; color: var(--tg-text); transition: transform 150ms ease; }
  .tg-primary { background: var(--tg-accent); color: white; box-shadow: 0 6px 18px rgba(75,59,255,0.22); }
  .tg-secondary { background: rgba(255,255,255,0.04); color: var(--tg-text); }
  .tg-link { background: transparent; color: var(--tg-muted); text-decoration: underline; padding: 7px 10px; border-radius: 8px; }

  .tg-close { position: absolute; right: 12px; top: 10px; background: transparent; border: none; color: var(--tg-muted); font-size: 1.05rem; cursor: pointer; }

  /* Modal overlay (separate element) */
  .tg-modal {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 15000;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(6,10,18,0.5);
    pointer-events: none;
  }
  .tg-modal[aria-hidden="false"] { display: flex; pointer-events: auto; }
  .tg-modal-inner {
    width: 100%;
    max-width: 720px;
    background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
    border-radius: 14px;
    padding: 20px;
    color: var(--tg-text);
    box-shadow: var(--tg-shadow);
  }
  .tg-modal h2 { margin: 0 0 8px 0; }
  .tg-modal p { margin: 0 0 12px 0; color: var(--tg-muted); }

  .tg-toggle-row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px; border-radius:10px; background: rgba(255,255,255,0.02); margin-bottom:12px; }
  .tg-toggle-row .desc { color: var(--tg-muted); font-size:0.92rem; margin-top:6px; }

  @media (max-width: 740px) {
    .tg-cookie-inner { flex-direction: column; align-items: stretch; padding: 12px; gap: 10px; }
    .tg-actions { justify-content: space-between; }
    .tg-close { right: 8px; top: 6px; }
  }
  @media (prefers-reduced-motion: reduce) { .tg-cookie-inner { transition: none; transform: none; } }
  `;

  // --- Build DOM (namespaced) ---
  const wrapper = createEl('div', { class: 'tg-cookie-banner-root' });
  const styleEl = createEl('style', { type: 'text/css', html: css });
  const banner = createEl('div', { class: 'tg-cookie-banner', id: 'tg-cookie-banner', 'aria-hidden': 'true', role: 'dialog', 'aria-label': 'Cookie consent', 'aria-live': 'polite' });
  const inner = createEl('div', { class: 'tg-cookie-inner', id: 'tg-cookie-inner' });

  const emoji = createEl('div', { class: 'tg-emoji', html: '🍪' });
  const textBlock = createEl('div', { class: 'tg-text-block' });
  const title = createEl('p', { class: 'tg-title', html: '<strong>TeamGalaxy</strong> needs your permission to load analytics cookies.' });
  const sub = createEl('p', { class: 'tg-sub', html: 'We use cookies to improve your experience. You can accept, reject or manage preferences.' });
  textBlock.appendChild(title); textBlock.appendChild(sub);

  const actions = createEl('div', { class: 'tg-actions' });
  const btnAccept = createEl('button', { id: 'tg-accept', class: 'tg-btn tg-primary', type: 'button', html: 'Accept & Continue' });
  const btnReject = createEl('button', { id: 'tg-reject', class: 'tg-btn tg-secondary', type: 'button', html: 'Reject' });
  const btnManage = createEl('button', { id: 'tg-manage', class: 'tg-btn tg-link', type: 'button', html: 'Manage preferences' });
  actions.appendChild(btnAccept); actions.appendChild(btnReject); actions.appendChild(btnManage);

  const closeBtn = createEl('button', { id: 'tg-close', class: 'tg-close', 'aria-label': 'Close cookie banner', html: '&times;' });

  inner.appendChild(emoji); inner.appendChild(textBlock); inner.appendChild(actions); inner.appendChild(closeBtn);
  banner.appendChild(inner);
  wrapper.appendChild(styleEl); wrapper.appendChild(banner);

  // Modal
  const modal = createEl('div', { id: 'tg-preferences', class: 'tg-modal', role: 'dialog', 'aria-modal': 'true', 'aria-hidden': 'true', 'aria-labelledby': 'tg-pref-title' });
  const modalInner = createEl('div', { class: 'tg-modal-inner' });
  const modalTitle = createEl('h2', { id: 'tg-pref-title', html: 'Cookie Preferences' });
  const modalP = createEl('p', { html: 'Choose which cookies you allow us to use. Analytics cookies are optional.' });
  const toggleRow = createEl('div', { class: 'tg-toggle-row' });
  const toggleLabelWrap = createEl('div', {});
  const toggleLabel = createEl('div', { html: '<strong>Analytics cookies</strong>' });
  const toggleDesc = createEl('div', { class: 'desc', html: 'Helps us understand how visitors use the site (optional)' });
  toggleLabelWrap.appendChild(toggleLabel); toggleLabelWrap.appendChild(toggleDesc);
  const toggleInput = createEl('input', { id: 'tg-analytics-toggle', type: 'checkbox', name: 'analytics', 'aria-label': 'Allow analytics cookies' });
  toggleRow.appendChild(toggleLabelWrap); toggleRow.appendChild(toggleInput);
  const modalActions = createEl('div', { class: 'tg-modal-actions' });
  const modalSave = createEl('button', { id: 'tg-save-prefs', class: 'tg-btn tg-primary', type: 'button', html: 'Save preferences' });
  const modalCancel = createEl('button', { id: 'tg-cancel-prefs', class: 'tg-btn tg-secondary', type: 'button', html: 'Cancel' });
  modalActions.appendChild(modalSave); modalActions.appendChild(modalCancel);
  const modalUtil = createEl('div', { class: 'tg-utilities' });
  const clearBtn = createEl('button', { id: 'tg-clear-consent', class: 'tg-btn tg-link', type: 'button', html: 'Remove saved consent' });
  modalUtil.appendChild(clearBtn);
  modalInner.appendChild(modalTitle); modalInner.appendChild(modalP); modalInner.appendChild(toggleRow); modalInner.appendChild(modalActions); modalInner.appendChild(modalUtil);
  modal.appendChild(modalInner);

  // --- Mount to DOM safely (append at end of body) ---
  function mount() {
    if (!document.head.contains(styleEl)) document.head.appendChild(styleEl);
    if (!document.body.contains(wrapper)) document.body.appendChild(wrapper);
    if (!document.body.contains(modal)) document.body.appendChild(modal);
  }

  // --- GA loader (same behavior) ---
  let gaLoaded = false;
  function loadGoogleAnalytics() {
    if (!GA_MEASUREMENT_ID || /^G-XXXXXXXX/.test(GA_MEASUREMENT_ID)) {
      console.warn('TeamGalaxy Cookie: GA_MEASUREMENT_ID missing or placeholder; skipping GA load.');
      return;
    }
    if (gaLoaded || window.dataLayer) return;
    gaLoaded = true;
    const s = document.createElement('script');
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    s.async = true;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
    console.info('TeamGalaxy Cookie: GA4 loaded');
  }

  // --- Show/hide with safe removal of interaction ---
  let hideTimeoutId = null;
  function showBanner() {
    // ensure the element is displayed so it can animate in
    banner.style.display = ''; // remove inline display:none if set
    inner.classList.add('tg-visible');
    banner.setAttribute('aria-hidden', 'false');

    // make sure wrapper doesn't block pointer events globally (only inner is interactive)
    banner.style.pointerEvents = 'auto';
    // focus primary after visible to help keyboard users
    setTimeout(() => { try { btnAccept.focus(); } catch (e) {} }, 260);
  }

  function hideBanner(removeFromDom = false) {
    // animate out
    inner.classList.remove('tg-visible');
    banner.setAttribute('aria-hidden', 'true');

    // After animation, set display:none so it doesn't intercept any clicks (important fix)
    if (hideTimeoutId) clearTimeout(hideTimeoutId);
    hideTimeoutId = setTimeout(() => {
      // disable pointer events and hide
      banner.style.pointerEvents = 'none';
      banner.style.display = 'none';
      if (removeFromDom) {
        try { if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper); } catch (e) {}
      }
    }, HIDE_ANIM_MS + 20);
  }

  // --- Modal helpers with focus management ---
  function openModal() {
    const consent = readConsent();
    toggleInput.checked = !!(consent && consent.analytics === true);
    modal.setAttribute('aria-hidden', 'false');
    modal.style.display = 'flex';
    // prevent background scroll
    const prevOverflow = document.documentElement.style.overflow;
    modal._prevOverflow = prevOverflow;
    document.documentElement.style.overflow = 'hidden';
    // save last focused
    modal._prevFocus = document.activeElement;
    toggleInput.focus();
    document.addEventListener('keydown', modalKeyHandler);
  }
  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
    // restore scroll
    document.documentElement.style.overflow = modal._prevOverflow || '';
    if (modal._prevFocus && typeof modal._prevFocus.focus === 'function') modal._prevFocus.focus();
    document.removeEventListener('keydown', modalKeyHandler);
  }
  function modalKeyHandler(e) {
    if (e.key === 'Escape') return closeModal();
    if (e.key === 'Tab') {
      const focusable = modal.querySelectorAll('button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  // --- Events wiring ---
  function wireEvents() {
    // Accept: save, hide, load GA, remove from DOM after animation
    btnAccept.addEventListener('click', function () {
      saveConsent({ analytics: true });
      // animate hide and remove from DOM to prevent further interference
      hideBanner(true);
      loadGoogleAnalytics();
    });

    // Reject: save, hide (keep in DOM optionally - we remove from interaction)
    btnReject.addEventListener('click', function () {
      saveConsent({ analytics: false });
      hideBanner(true);
    });

    // Manage preferences
    btnManage.addEventListener('click', function () { openModal(); });

    // Close — defer: hide for now but keep consent unset (user can be shown again next load)
    closeBtn.addEventListener('click', function () { hideBanner(false); });

    // Modal save/cancel/clear
    modalSave.addEventListener('click', function () {
      const allow = !!toggleInput.checked;
      saveConsent({ analytics: allow });
      closeModal();
      hideBanner(true);
      if (allow) loadGoogleAnalytics();
    });
    modalCancel.addEventListener('click', function () { closeModal(); });

    clearBtn.addEventListener('click', function () {
      removeConsent();
      closeModal();
      // show banner again so user can choose
      showBanner();
    });

    // Click outside modal to close (only when modal is visible)
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    // keyboard shortcut for dev: ctrl/cmd + c -> open preferences
    document.addEventListener('keydown', function (e) {
      if (document.activeElement && ['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') { openModal(); }
    });
  }

  // --- Initialization logic ---
  function checkExpiryAndPossiblyClear() {
    const c = readConsent();
    if (!c || !c.timestamp) return;
    if (daysSince(c.timestamp) > CONSENT_EXP_DAYS) removeConsent();
  }

  function init() {
    mount();
    wireEvents();
    checkExpiryAndPossiblyClear();

    // Decide initial state
    const existing = readConsent();
    if (existing && typeof existing.analytics !== 'undefined') {
      if (existing.analytics === true) {
        loadGoogleAnalytics();
      }
      // no banner shown if explicit choice exists
      // ensure the wrapper is not visible/interactive
      banner.style.display = 'none';
      banner.style.pointerEvents = 'none';
    } else {
      // show banner after small delay
      setTimeout(showBanner, SHOW_DELAY_MS);
    }

    // Expose small helper API
    window.TeamGalaxyCookies = {
      openBanner: showBanner,
      openPreferences: openModal,
      getConsent: readConsent,
      clearConsent: removeConsent,
      hasAnalyticsConsent: function () { const c = readConsent(); return !!(c && c.analytics === true); }
    };
  }

  // Mount helper: append wrapper (contains styles + banner) at document end
  function mount() {
    // Append style + banner wrapper to body end to minimize interference
    if (!document.body.contains(wrapper)) document.body.appendChild(wrapper);
    if (!document.body.contains(modal)) document.body.appendChild(modal);
  }

  // DOM ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();