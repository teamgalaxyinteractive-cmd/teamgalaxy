(function () {
  'use strict';

  // --------- CONFIG ----------
  const GA_MEASUREMENT_ID = 'G-6C2W9NSNCH'; // Tumhara GA4 ID
  const CONSENT_KEY = 'galaxydesigns_cookie_consent_v1';
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
      console.warn('Galaxy Designs cookie: unable to save consent', e);
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

  // --- CSS (Banner + Modal, Premium Dark Theme) ---
  const css = `
  /* Scoped root */
  .gd-cookie-banner-root { 
    --gd-bg: rgba(13, 17, 28, 0.85); /* Glassmorphism background */
    --gd-border: rgba(255, 255, 255, 0.05);
    --gd-text: #F8FAFC;
    --gd-muted: #94A3B8;
    --gd-accent: #00E5FF; /* Neon Cyan */
    --gd-accent-hover: #3B82F6; /* Neon Blue */
    --gd-radius: 16px;
  }

  /* Banner Styles */
  .gd-cookie-banner {
    position: fixed;
    left: 1rem;
    right: 1rem;
    bottom: 1.5rem;
    z-index: 2147483640;
    display: flex;
    justify-content: center;
    pointer-events: none;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .gd-cookie-inner {
    width: 100%;
    max-width: 900px;
    background-color: var(--gd-bg) !important;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    color: var(--gd-text) !important;
    border-radius: var(--gd-radius);
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    padding: 16px 20px;
    display: flex;
    gap: 16px;
    align-items: center;
    pointer-events: auto;
    transform: translateY(30px) scale(0.98);
    opacity: 0;
    transition: transform 0.4s cubic-bezier(.2,.9,.2,1), opacity 0.4s;
    border: 1px solid var(--gd-border);
    position: relative;
  }
  .gd-cookie-inner.gd-visible { transform: translateY(0) scale(1); opacity: 1; }

  .gd-icon { font-size: 1.5rem; color: var(--gd-accent); }
  .gd-text-block { flex: 1; }
  .gd-text-block p { margin: 0; line-height: 1.5; font-size: 14px; color: var(--gd-text); }
  .gd-title { font-weight: 700; margin-bottom: 4px !important; display: block; font-size: 15px; }
  .gd-sub { color: var(--gd-muted) !important; font-size: 13px; }

  /* Buttons */
  .gd-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .gd-btn { 
    padding: 8px 18px;
    border-radius: 8px;
    border: none;
    cursor: pointer; 
    font-weight: 600;
    font-size: 13px;
    transition: all 0.3s ease;
  }
  .gd-btn:focus-visible {
    outline: 2px solid var(--gd-accent);
    outline-offset: 2px;
  }
  .gd-primary {
    background: linear-gradient(135deg, var(--gd-accent-hover), var(--gd-accent)) !important;
    color: #000 !important;
  }
  .gd-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0, 229, 255, 0.3); }
  .gd-secondary {
    background-color: rgba(255,255,255,0.08) !important;
    color: var(--gd-text) !important;
    border: 1px solid var(--gd-border);
  }
  .gd-secondary:hover { background-color: rgba(255,255,255,0.15) !important; }
  .gd-link {
    background: none;
    color: var(--gd-muted);
    text-decoration: underline;
    padding: 5px 10px;
  }
  .gd-link:hover { color: var(--gd-text); }
  .gd-close {
    position: absolute;
    right: 12px;
    top: 12px;
    background: none;
    border: none;
    color: var(--gd-muted);
    font-size: 22px;
    cursor: pointer;
    transition: color 0.2s;
  }
  .gd-close:hover { color: var(--gd-accent); }
  .gd-close:focus-visible { outline: 2px solid var(--gd-accent); outline-offset: 2px; }

  /* MODAL: Premium Glassmorphism */
  .gd-modal {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color: rgba(7, 9, 14, 0.9) !important;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .gd-modal[aria-hidden="false"] {
    display: flex;
    pointer-events: auto;
  }

  .gd-modal-inner {
    width: 100%;
    max-width: 500px;
    background-color: #0D111C !important; 
    color: var(--gd-text) !important;
    border-radius: var(--gd-radius);
    padding: 30px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.7);
    border: 1px solid rgba(0, 229, 255, 0.1);
    position: relative;
    animation: fadeInModal 0.3s ease-out;
  }

  @keyframes fadeInModal {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  .gd-modal h2 {
    margin: 0 0 8px 0;
    color: var(--gd-accent);
    font-size: 22px;
    font-weight: 800;
  }
  .gd-modal p {
    margin: 0 0 24px 0;
    color: var(--gd-muted);
    font-size: 14px;
    line-height: 1.6;
  }

  .gd-toggle-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(59, 130, 246, 0.05);
    padding: 16px;
    border-radius: 12px;
    border: 1px solid rgba(59, 130, 246, 0.1);
    margin-bottom: 24px;
  }
  .gd-toggle-row strong {
    display: block;
    color: var(--gd-text);
    margin-bottom: 4px;
    font-size: 15px;
  }
  .gd-toggle-row .desc {
    color: var(--gd-muted);
    font-size: 13px;
  }
  
  /* Custom Checkbox */
  .gd-toggle-row input[type="checkbox"] {
    appearance: none;
    width: 44px;
    height: 24px;
    background: rgba(255,255,255,0.1);
    border-radius: 24px;
    position: relative;
    cursor: pointer;
    outline: none;
    transition: background 0.3s;
  }
  .gd-toggle-row input[type="checkbox"]::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.3s;
  }
  .gd-toggle-row input[type="checkbox"]:checked {
    background: var(--gd-accent);
  }
  .gd-toggle-row input[type="checkbox"]:checked::after {
    transform: translateX(20px);
    background: #000;
  }

  .gd-modal-actions {
    display: flex;
    gap: 12px;
  }
  .gd-utilities {
    margin-top: 20px;
    text-align: center;
  }

  /* Mobile Tweaks */
  @media (max-width: 600px) {
    .gd-cookie-inner { flex-direction: column; align-items: flex-start; padding: 20px; }
    .gd-actions { width: 100%; justify-content: stretch; flex-direction: column; }
    .gd-btn { width: 100%; text-align: center; }
    .gd-modal-inner { padding: 24px 20px; }
    .gd-modal-actions { flex-direction: column; }
  }
  `;

  // --- Build DOM ---
  const wrapper = createEl('div', { class: 'gd-cookie-banner-root' });
  const styleEl = createEl('style', { type: 'text/css', html: css });

  // Banner HTML
  const banner = createEl('div', {
    class: 'gd-cookie-banner',
    id: 'gd-cookie-banner',
    'aria-hidden': 'true',
    role: 'dialog',
    'aria-label': 'Cookie consent',
    'aria-live': 'polite'
  });

  banner.innerHTML = `
    <div class="gd-cookie-inner" id="gd-cookie-inner">
      <div class="gd-icon" aria-hidden="true"><i class="fas fa-shield-alt"></i></div>
      <div class="gd-text-block">
        <p class="gd-title">Privacy & Cookies</p>
        <p class="gd-sub">Galaxy Designs uses cookies to elevate your experience and analyze site traffic.</p>
      </div>
      <div class="gd-actions">
        <button id="gd-accept" class="gd-btn gd-primary" type="button">Accept All</button>
        <button id="gd-reject" class="gd-btn gd-secondary" type="button">Reject</button>
        <button id="gd-manage" class="gd-btn gd-link" type="button">Preferences</button>
      </div>
      <button id="gd-close" class="gd-close" type="button" aria-label="Close cookie banner">&times;</button>
    </div>
  `;

  // Modal HTML
  const modal = createEl('div', {
    id: 'gd-preferences',
    class: 'gd-modal',
    'aria-hidden': 'true',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'gd-pref-title'
  });

  modal.innerHTML = `
    <div class="gd-modal-inner">
      <h2 id="gd-pref-title">Cookie Preferences</h2>
      <p>Control how Galaxy Designs uses cookies to optimize your browsing experience.</p>
      
      <div class="gd-toggle-row">
        <div>
          <strong>Analytics & Performance</strong>
          <div class="desc">Help us improve the Galaxy Designs platform.</div>
        </div>
        <input type="checkbox" id="gd-analytics-toggle" aria-label="Allow analytics cookies">
      </div>

      <div class="gd-modal-actions">
        <button id="gd-save-prefs" class="gd-btn gd-primary" type="button" style="flex:1;">Save Preferences</button>
        <button id="gd-cancel-prefs" class="gd-btn gd-secondary" type="button" style="flex:1;">Cancel</button>
      </div>
      <div class="gd-utilities">
        <button id="gd-clear-consent" class="gd-btn gd-link" type="button">Reset All Consents</button>
      </div>
    </div>
  `;

  wrapper.appendChild(styleEl);
  wrapper.appendChild(banner);

  function mount() {
    if (!document.head.contains(styleEl)) document.head.appendChild(styleEl);
    if (!document.body.contains(wrapper)) document.body.appendChild(wrapper);
    if (!document.body.contains(modal)) document.body.appendChild(modal);
    
    // Check if FontAwesome is loaded for the shield icon, if not, fallback to text/emoji
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const iconWrap = document.querySelector('.gd-icon');
      if(iconWrap) iconWrap.innerHTML = '✨';
    }
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
    console.log("Galaxy Designs Analytics Loaded 🚀");
  }

  // --- Banner Logic ---
  function showBanner() {
    banner.style.display = 'flex';
    setTimeout(() => {
      const inner = document.getElementById('gd-cookie-inner');
      if (!inner) return;
      inner.classList.add('gd-visible');
      banner.setAttribute('aria-hidden', 'false');
      banner.style.pointerEvents = 'auto';
    }, 10);
  }

  function hideBanner() {
    const inner = document.getElementById('gd-cookie-inner');
    if (inner) inner.classList.remove('gd-visible');
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
    const toggle = document.getElementById('gd-analytics-toggle');
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

    const btnAccept  = document.getElementById('gd-accept');
    const btnReject  = document.getElementById('gd-reject');
    const btnManage  = document.getElementById('gd-manage');
    const btnClose   = document.getElementById('gd-close');
    const btnSave    = document.getElementById('gd-save-prefs');
    const btnCancel  = document.getElementById('gd-cancel-prefs');
    const btnClear   = document.getElementById('gd-clear-consent');

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
        const toggle = document.getElementById('gd-analytics-toggle');
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

    // Small helper API 
    window.GalaxyDesignCookies = {
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
