(function() {
    // 1. Function to Initialize Widget
    const initDevWidget = () => {
        // Prevent duplicate injection
        if (document.getElementById('dev-widget-container')) return;

        // 2. CSS Styles (Injecting directly with high priority)
        const style = document.createElement('style');
        style.textContent = `
            #dev-widget-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                z-index: 9999999;
                pointer-events: none; /* Allows clicks through container */
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }

            .dev-banner-main {
                pointer-events: auto; /* Re-enable clicks for the banner */
                background: rgba(20, 25, 35, 0.85);
                backdrop-filter: blur(15px) saturate(160%);
                -webkit-backdrop-filter: blur(15px) saturate(160%);
                border-bottom: 1px solid rgba(59, 130, 246, 0.4);
                box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
                padding: 14px 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: devSlideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            }

            @keyframes devSlideDown {
                from { transform: translateY(-100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .dev-content-wrapper {
                max-width: 1100px;
                width: 100%;
                display: flex;
                align-items: center;
                gap: 18px;
            }

            .dev-icon-gear {
                font-size: 24px;
                display: flex;
                align-items: center;
                animation: devRotate 4s linear infinite;
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
                color: #3b82f6; /* Electric Blue */
                font-size: 15px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.8px;
            }

            .dev-text-area p {
                margin: 2px 0 0 0;
                color: #cbd5e1; /* Light Greyish Blue */
                font-size: 13.5px;
                line-height: 1.4;
            }

            .dev-close-action {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #94a3b8;
                cursor: pointer;
                width: 30px;
                height: 30px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                font-size: 18px;
            }

            .dev-close-action:hover {
                background: rgba(239, 68, 68, 0.2);
                color: #ef4444;
                border-color: rgba(239, 68, 68, 0.3);
            }

            @media (max-width: 768px) {
                .dev-banner-main { padding: 10px 15px; }
                .dev-icon-gear { display: none; }
                .dev-text-area p { font-size: 12px; }
            }
        `;
        document.head.appendChild(style);

        // 3. HTML Structure
        const container = document.createElement('div');
        container.id = 'dev-widget-container';
        container.innerHTML = `
            <div class="dev-banner-main" id="devBanner">
                <div class="dev-content-wrapper">
                    <div class="dev-icon-gear">⚙️</div>
                    <div class="dev-text-area">
                        <h4>Development Mode Active</h4>
                        <p>Website par kaam chal raha hai. Behatar experience ke liye changes ho rahe hain. Support ke liye Admin ko contact karein.</p>
                    </div>
                    <button class="dev-close-action" id="closeDevWidget" title="Dismiss">×</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentElement('afterbegin', container);

        // 4. Close Logic (No LocalStorage)
        document.getElementById('closeDevWidget').onclick = function() {
            const banner = document.getElementById('devBanner');
            banner.style.transition = '0.4s ease';
            banner.style.transform = 'translateY(-100%)';
            banner.style.opacity = '0';
            setTimeout(() => {
                container.remove();
            }, 400);
        };
    };

    // Script injection check: Ensure body is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDevWidget);
    } else {
        initDevWidget();
    }
})();
