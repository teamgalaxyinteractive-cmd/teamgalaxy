(function() {
    const initDevWidget = () => {
        if (document.getElementById('dev-widget-container')) return;

        const style = document.createElement('style');
        style.textContent = `
            #dev-widget-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                z-index: 9999999;
                pointer-events: none;
                font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
            }

            .dev-banner-main {
                pointer-events: auto;
                background: rgba(13, 17, 23, 0.85);
                backdrop-filter: blur(12px) saturate(180%);
                -webkit-backdrop-filter: blur(12px) saturate(180%);
                border-bottom: 1px solid rgba(59, 130, 246, 0.3);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
                padding: 12px 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: devSlideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            }

            @keyframes devSlideDown {
                from { transform: translateY(-100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .dev-content-wrapper {
                max-width: 1200px;
                width: 100%;
                display: flex;
                align-items: center;
                gap: 20px;
            }

            .dev-status-indicator {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .dev-icon-gear {
                font-size: 22px;
                animation: devRotate 6s linear infinite;
                filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.5));
            }

            @keyframes devRotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            .dev-text-area {
                flex: 1;
            }

            .dev-text-area h4 {
                margin: 0;
                color: #60a5fa;
                font-size: 14px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .dev-text-area p {
                margin: 2px 0 0 0;
                color: #e2e8f0;
                font-size: 13px;
                line-height: 1.5;
                opacity: 0.9;
            }

            .dev-close-action {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #94a3b8;
                cursor: pointer;
                width: 28px;
                height: 28px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                font-size: 16px;
            }

            .dev-close-action:hover {
                background: rgba(239, 68, 68, 0.15);
                color: #f87171;
                border-color: rgba(239, 68, 68, 0.2);
                transform: scale(1.05);
            }

            @media (max-width: 768px) {
                .dev-banner-main { padding: 10px 15px; }
                .dev-icon-gear { display: none; }
                .dev-text-area p { font-size: 11px; }
                .dev-text-area h4 { font-size: 12px; }
            }
        `;
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.id = 'dev-widget-container';
        container.innerHTML = `
            <div class="dev-banner-main" id="devBanner">
                <div class="dev-content-wrapper">
                    <div class="dev-status-indicator">
                        <span class="dev-icon-gear">⚙️</span>
                    </div>
                    <div class="dev-text-area">
                        <h4>Development Mode Active</h4>
                        <p>Our website is currently undergoing live enhancements to provide you with a better experience. You may encounter temporary adjustments. For support, please contact the <b>Admin</b> or <b>IT Developer</b>.</p>
                    </div>
                    <button class="dev-close-action" id="closeDevWidget" title="Dismiss Notification">✕</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentElement('afterbegin', container);

        document.getElementById('closeDevWidget').onclick = function() {
            const banner = document.getElementById('devBanner');
            banner.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            banner.style.transform = 'translateY(-100%)';
            banner.style.opacity = '0';
            setTimeout(() => {
                container.remove();
            }, 400);
        };
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDevWidget);
    } else {
        initDevWidget();
    }
})();
