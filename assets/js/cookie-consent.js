(function () {
  'use strict';

  // --------- CONFIG ----------
  const GA_MEASUREMENT_ID = 'G-6C2W9NSNCH'; // tumhara GA4 ID
  const CONSENT_KEY = 'teamgalaxy_cookie_consent_v1';
  const CONSENT_EXP_DAYS = 365;
  const SHOW_DELAY_MS = 500;
  const HIDE_ANIM_MS = 320;
  // ---------------------------

  // --- Helpers ---
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
    try {
      obj.timestamp = nowISO();
      localStorage.setItem(CONSENT_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn('TeamGalaxy cookie: unable to save consent', e);
    }
  }
  function readConsent() {
    try {
      const s = localStorage.getItem(CONSENT_KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  }
  function removeConsent() {
    try { localStorage.removeItem(CONSENT_KEY); } catch (e) {}
  }

  // --- CSS (Banner + Modal, solid backgrounds) ---
  const css = `
  /* Scoped root */
  .tg-cookie-banner-root { 
    --tg-bg: #020617;
    --tg-text: #f9fafb;
    --tg-muted: #9ca3af;
    --tg-accent: #3b82f6;
    --tg-radius: 12px;
  }

  /* Banner Styles */
  .tg-cookie-banner {
    position: fixed;
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    z-index: 2147483640;
    display: flex;
    justify-content: center;
    pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  .tg-cookie-inner {
    width: 100%;
    max-width: 900px;
    background-color: var(--tg-bg) !important;
    color: var(--tg-text) !important;
    border-radius: var(--tg-radius);
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    padding: 16px;
    display: flex;
    gap: 12px;
    align-items: center;
    pointer-events: auto;
    transform: translateY(24px) scale(0.99);
    opacity: 0;
    transition: transform 0.3s cubic-bezier(.2,.9,.2,1), opacity 0.3s;
    border: 1px solid rgba(255,255,255,0.08);
    position: relative;
  }
  .tg-cookie-inner.tg-visible { transform: translateY(0) scale(1); opacity: 1; }

  .tg-emoji { font-size: 1.5rem; }
  .tg-text-block { flex: 1; }
  .tg-text-block p { margin: 0; line-height: 1.4; font-size: 14px; color: var(--tg-text); }
  .tg-title { font-weight: 700; margin-bottom: 2px !important; display: block; }
  .tg-sub { color: var(--tg-muted) !important; font-size: 13px; }

  /* Buttons */
  .tg-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .tg-btn { 
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    cursor: pointer; 
    font-weight: 600;
    font-size: 13px;
    transition: all 0.2s;
  }
  .tg-btn:focus-visible {
    outline: 2px solid #ffffff;
    outline-offset: 2px;
  }
  .tg-primary {
    background-color: var(--tg-accent) !important;
    color: white !important;
  }
  .tg-primary:hover { opacity: 0.9; }
  .tg-secondary {
    background-color: rgba(255,255,255,0.1) !important;
    color: white !important;
  }
  .tg-secondary:hover { background-color: rgba(255,255,255,0.2) !important; }
  .tg-link {
    background: none;
    color: var(--tg-muted);
    text-decoration: underline;
    padding: 5px 10px;
  }
  .tg-close {
    position: absolute;
    right: 10px;
    top: 10px;
    background: none;
    border: none;
    color: var(--tg-muted);
    font-size: 20px;
    cursor: pointer;
  }
  .tg-close:focus-visible {
    outline: 2px solid #ffffff;
    outline-offset: 2px;
  }

  /* MODAL: solid black card + dark overlay */
  .tg-modal {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color: rgba(0,0,0,0.85) !important;
    backdrop-filter: blur(4px);
  }
  .tg-modal[aria-hidden="false"] {
    display: flex;
    pointer-events: auto;
  }

  .tg-modal-inner {
    width: 100%;
    max-width: 600px;
    background-color: #020617 !important; /* solid dark */
    color: #f9fafb !important;
    border-radius: 14px;
    padding: 24px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.7);
    border: 1px solid rgba(148,163,184,0.5);
    position: relative;
  }

  .tg-modal h2 {
    margin: 0 0 10px 0;
    color: #e5e7eb;
    font-size: 20px;
  }
  .tg-modal p {
    margin: 0 0 20px 0;
    color: #cbd5e1;
    font-size: 14px;
    line-height: 1.5;
  }

  .tg-toggle-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(15,23,42,0.9);
    padding: 15px;
    border-radius: 10px;
    margin-bottom: 20px;
  }
  .tg-toggle-row strong {
    display: block;
    color: #f9fafb;
    margin-bottom: 4px;
  }
  .tg-toggle-row .desc {
    color: #9ca3af;
    font-size: 12px;
  }

  .tg-modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }
  .tg-utilities {
    margin-top: 15px;
    text-align: center;
  }

  /* Mobile Tweaks */
  @media (max-width: 600px) {
    .tg-cookie-inner {
      flex-direction: column;
      align-items: flex-start;
    }
    .tg-actions {
      width: 100%;
      justify-content: space-between;
    }
    .tg-btn {
      flex: 1;
      text-align: center;
    }
  }
  `;

  // --- Build DOM ---
  const wrapper = createEl('div', { class: 'tg-cookie-banner-root' });
  const styleEl = createEl('style', { type: 'text/css', html: css });

  // Banner HTML
  const banner = createEl('div', {
    class: 'tg-cookie-banner',
    id: 'tg-cookie-banner',
    'aria-hidden': 'true',
    role: 'dialog',
    'aria-label': 'Cookie consent',
    'aria-live': 'polite'
  });

  banner.innerHTML = `
    <div class="tg-cookie-inner" id="tg-cookie-inner">
      <div class="tg-emoji" aria-hidden="true">🍪</div>
      <div class="tg-text-block">
        <p class="tg-title">Cookie Consent</p>
        <p class="tg-sub">TeamGalaxy uses cookies for analytics. Manage your preferences.</p>
      </div>
      <div class="tg-actions">
        <button id="tg-accept" class="tg-btn tg-primary" type="button">Accept</button>
        <button id="tg-reject" class="tg-btn tg-secondary" type="button">Reject</button>
        <button id="tg-manage" class="tg-btn tg-link" type="button">Settings</button>
      </div>
      <button id="tg-close" class="tg-close" type="button" aria-label="Close cookie banner">&times;</button>
    </div>
  `;

  // Modal HTML
  const modal = createEl('div', {
    id: 'tg-preferences',
    class: 'tg-modal',
    'aria-hidden': 'true',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'tg-pref-title'
  });

  modal.innerHTML = `
    <div class="tg-modal-inner">
      <h2 id="tg-pref-title">Cookie Preferences</h2>
      <p>Decide which cookies you want to allow.</p>
      
      <div class="tg-toggle-row">
        <div>
          <strong>Analytics Cookies</strong>
          <div class="desc">Help us improve TeamGalaxy.</div>
        </div>
        <input type="checkbox" id="tg-analytics-toggle" style="width:20px; height:20px;" aria-label="Allow analytics cookies">
      </div>

      <div class="tg-modal-actions">
        <button id="tg-save-prefs" class="tg-btn tg-primary" type="button" style="flex:1;">Save Preferences</button>
        <button id="tg-cancel-prefs" class="tg-btn tg-secondary" type="button" style="flex:1;">Cancel</button>
      </div>
      <div class="tg-utilities">
        <button id="tg-clear-consent" class="tg-btn tg-link" type="button">Reset All Consents</button>
      </div>
    </div>
  `;

  wrapper.appendChild(styleEl);
  wrapper.appendChild(banner);

  function mount() {
    if (!document.head.contains(styleEl)) document.head.appendChild(styleEl);
    if (!document.body.contains(wrapper)) document.body.appendChild(wrapper);
    if (!document.body.contains(modal)) document.body.appendChild(modal);
  }

  // --- GA Loader ---
  let gaLoaded = false;
  function loadGoogleAnalytics() {
    if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.startsWith('G-XXX')) return;
    if (gaLoaded || window.dataLayer) return;
    gaLoaded = true;

    const s = document.createElement('script');
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    s.async = true;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
    console.log("TeamGalaxy Analytics Loaded 🚀");
  }

  // --- Banner Logic ---
  function showBanner() {
    banner.style.display = 'flex';
    setTimeout(() => {
      const inner = document.getElementById('tg-cookie-inner');
      if (!inner) return;
      inner.classList.add('tg-visible');
      banner.setAttribute('aria-hidden', 'false');
      banner.style.pointerEvents = 'auto';
    }, 10);
  }

  function hideBanner() {
    const inner = document.getElementById('tg-cookie-inner');
    if (inner) inner.classList.remove('tg-visible');
    banner.setAttribute('aria-hidden', 'true');

    setTimeout(() => {
      banner.style.display = 'none';
      banner.style.pointerEvents = 'none';
    }, HIDE_ANIM_MS);
  }

  // --- Modal Logic + focus handling ---
  let prevOverflow = '';
  let lastFocused = null;

  function getFocusableInModal() {
    return modal.querySelectorAll(
      'button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])'
    );
  }

  function openModal() {
    const consent = readConsent();
    const toggle = document.getElementById('tg-analytics-toggle');
    if (toggle) toggle.checked = !!(consent && consent.analytics);

    lastFocused = document.activeElement;

    modal.setAttribute('aria-hidden', 'false');
    modal.style.display = 'flex';

    prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    const focusables = getFocusableInModal();
    if (focusables.length) focusables[0].focus();

    document.addEventListener('keydown', handleModalKeydown);
  }

  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
    document.documentElement.style.overflow = prevOverflow || '';

    document.removeEventListener('keydown', handleModalKeydown);
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  function handleModalKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      return closeModal();
    }
    if (e.key === 'Tab') {
      const focusables = getFocusableInModal();
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // --- Init ---
  function init() {
    mount();

    const btnAccept  = document.getElementById('tg-accept');
    const btnReject  = document.getElementById('tg-reject');
    const btnManage  = document.getElementById('tg-manage');
    const btnClose   = document.getElementById('tg-close');
    const btnSave    = document.getElementById('tg-save-prefs');
    const btnCancel  = document.getElementById('tg-cancel-prefs');
    const btnClear   = document.getElementById('tg-clear-consent');

    // expiry check
    const c = readConsent();
    if (c && c.timestamp && daysSince(c.timestamp) > CONSENT_EXP_DAYS) {
      removeConsent();
    }

    // Banner events
    if (btnAccept) {
      btnAccept.onclick = () => {
        saveConsent({ analytics: true });
        hideBanner();
        loadGoogleAnalytics();
      };
    }
    if (btnReject) {
      btnReject.onclick = () => {
        saveConsent({ analytics: false });
        hideBanner();
      };
    }
    if (btnManage) {
      btnManage.onclick = () => openModal();
    }
    if (btnClose) {
      btnClose.onclick = () => hideBanner();
    }

    // Modal events
    if (btnSave) {
      btnSave.onclick = () => {
        const toggle = document.getElementById('tg-analytics-toggle');
        const allow = !!(toggle && toggle.checked);
        saveConsent({ analytics: allow });
        closeModal();
        hideBanner();
        if (allow) loadGoogleAnalytics();
      };
    }
    if (btnCancel) {
      btnCancel.onclick = () => closeModal();
    }
    if (btnClear) {
      btnClear.onclick = () => {
        removeConsent();
        closeModal();
        showBanner();
      };
    }

    // Click outside modal closes it
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    // Auto load logic
    const existing = readConsent();
    if (existing) {
      if (existing.analytics) {
        loadGoogleAnalytics();
      }
      // Explicit choice -> don't show banner again
    } else {
      setTimeout(showBanner, SHOW_DELAY_MS);
    }

    // Small helper API (optional dev)
    window.TeamGalaxyCookies = {
      getConsent: readConsent,
      clearConsent: removeConsent,
      openPreferences: openModal,
      openBanner: showBanner
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();