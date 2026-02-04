(function() {
    // 1. Check if widget already exists
    if (document.getElementById('dev-notification-wrapper')) return;

    // 2. CSS with Variables & Premium Stylings
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --dev-bg: rgba(15, 18, 25, 0.85);
            --dev-accent: #3b82f6;
            --dev-accent-glow: rgba(59, 130, 246, 0.5);
            --dev-text-main: #f8fafc;
            --dev-text-dim: #94a3b8;
            --dev-border: rgba(255, 255, 255, 0.08);
        }

        #dev-notification-wrapper {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 700px;
            z-index: 999999;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            pointer-events: none; /* Allows clicking through the wrapper edges */
        }

        .dev-banner {
            pointer-events: auto;
            background: var(--dev-bg);
            backdrop-filter: blur(12px) saturate(180%);
            -webkit-backdrop-filter: blur(12px) saturate(180%);
            border: 1px solid var(--dev-border);
            border-top: 2px solid var(--dev-accent);
            border-radius: 12px;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 16px;
            box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.7), 
                        0 0 20px 0 rgba(59, 130, 246, 0.1);
            animation: slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            transition: all 0.3s ease;
        }

        @keyframes slideInUp {
            from { transform: translateY(-30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .dev-icon-box {
            background: rgba(59, 130, 246, 0.15);
            width: 42px;
            height: 42px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .dev-icon-box svg {
            width: 24px;
            height: 24px;
            fill: var(--dev-accent);
            animation: rotateGear 4s linear infinite;
        }

        @keyframes rotateGear {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .dev-content {
            flex-grow: 1;
        }

        .dev-title {
            color: var(--dev-accent);
            font-weight: 700;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 2px 0;
        }

        .dev-desc {
            color: var(--dev-text-main);
            font-size: 13px;
            margin: 0;
            line-height: 1.4;
        }

        .dev-footer {
            margin-top: 4px;
            font-size: 11px;
            color: var(--dev-text-dim);
        }

        .dev-close-btn {
            background: transparent;
            border: none;
            color: var(--dev-text-dim);
            cursor: pointer;
            padding: 4px;
            border-radius: 6px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .dev-close-btn:hover {
            background: rgba(255, 255, 255, 0.05);
            color: #ff4d4d;
        }

        @media (max-width: 600px) {
            .dev-banner { padding: 12px; gap: 12px; }
            .dev-desc { font-size: 12px; }
            .dev-icon-box { display: none; }
        }
    `;
    document.head.appendChild(style);

    // 3. Create the UI
    const container = document.createElement('div');
    container.id = 'dev-notification-wrapper';
    
    container.innerHTML = `
        <div class="dev-banner" id="devBanner">
            <div class="dev-icon-box">
                <svg viewBox="0 0 24 24"><path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.47,5.34 14.86,5.12L14.47,2.47C14.44,2.23 14.24,2.05 14,2.05H10C9.76,2.05 9.56,2.23 9.53,2.47L9.14,5.12C8.53,5.34 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.53,18.66 9.14,18.88L9.53,21.53C9.56,21.77 9.76,21.95 10,21.95H14C14.24,21.95 14.44,21.77 14.47,21.53L14.86,18.88C15.47,18.66 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" /></svg>
            </div>
            <div class="dev-content">
                <p class="dev-title">Development Mode Active</p>
                <p class="dev-desc">We're fine-tuning the experience. You may see some temporary shifts.</p>
                <div class="dev-footer">Contact IT Support for inquiries.</div>
            </div>
            <button class="dev-close-btn" id="closeDev" aria-label="Dismiss">
                <svg style="width:20px;height:20px" viewBox="0 0 24 24"><path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>
            </button>
        </div>
    `;

    // 4. Persistence & Logic
    const isClosed = localStorage.getItem('dev_banner_hidden');
    
    if (!isClosed) {
        document.body.appendChild(container);
        
        document.getElementById('closeDev').addEventListener('click', () => {
            const banner = document.getElementById('devBanner');
            banner.style.opacity = '0';
            banner.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                container.remove();
                localStorage.setItem('dev_banner_hidden', 'true');
            }, 300);
        });
    }
})();
