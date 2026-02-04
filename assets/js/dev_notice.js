(function () {
    if (document.getElementById('devNotification')) return;

    const widgetHTML = `
        <div id="devNotification" class="dev-notification">
            <div class="dev-container">
                <div class="dev-glass">
                    <div class="dev-icon">⚙️</div>

                    <div class="dev-text">
                        <p class="dev-title">Development Mode Active</p>
                        <p>
                            This website is currently under development. 
                            Some features may behave unexpectedly, but everything is being handled smoothly.
                        </p>
                        <p class="dev-sub">
                            For more information, please contact the admin or IT developer.
                        </p>
                    </div>

                    <button id="closeDevNotification" class="dev-close" aria-label="Close">×</button>
                </div>
            </div>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        :root {
            --dev-bg: rgba(12, 16, 24, 0.88);
            --dev-border: rgba(100, 194, 255, 0.25);
            --dev-accent: #64c2ff;
            --dev-text: #e6e6e6;
            --dev-muted: #9aa4b2;
        }

        .dev-notification {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 9999;
            animation: slideDown 0.45s cubic-bezier(.4,0,.2,1);
        }

        @keyframes slideDown {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .dev-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 12px 20px;
        }

        .dev-glass {
            display: flex;
            align-items: flex-start;
            gap: 16px;
            padding: 14px 18px;

            background: linear-gradient(
                135deg,
                rgba(18, 23, 34, 0.92),
                rgba(10, 14, 22, 0.92)
            );

            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);

            border: 1px solid var(--dev-border);
            border-radius: 14px;

            box-shadow:
                0 10px 30px rgba(0, 0, 0, 0.55),
                inset 0 0 0 1px rgba(255,255,255,0.02);
        }

        .dev-icon {
            font-size: 26px;
            color: var(--dev-accent);
            animation: pulse 2.2s infinite;
            margin-top: 2px;
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.12); }
            100% { transform: scale(1); }
        }

        .dev-text {
            flex: 1;
        }

        .dev-title {
            margin: 0 0 6px 0;
            font-size: 15px;
            font-weight: 600;
            color: var(--dev-accent);
            letter-spacing: 0.3px;
        }

        .dev-text p {
            margin: 0 0 6px 0;
            font-size: 14px;
            line-height: 1.6;
            color: var(--dev-text);
        }

        .dev-sub {
            color: var(--dev-muted);
            font-size: 13px;
        }

        .dev-close {
            background: rgba(255,255,255,0.06);
            border: 1px solid var(--dev-border);
            color: var(--dev-accent);
            width: 34px;
            height: 34px;
            border-radius: 10px;
            font-size: 22px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            flex-shrink: 0;
        }

        .dev-close:hover {
            background: rgba(100,194,255,0.2);
            color: #fff;
            transform: rotate(90deg) scale(1.05);
            box-shadow: 0 0 15px rgba(100,194,255,0.35);
        }

        @media (max-width: 768px) {
            .dev-glass {
                flex-direction: column;
                align-items: center;
                text-align: center;
            }

            .dev-close {
                align-self: flex-end;
            }
        }
    `;
    document.head.appendChild(style);
    document.body.insertAdjacentHTML('afterbegin', widgetHTML);

    const notification = document.getElementById('devNotification');

    document.getElementById('closeDevNotification').addEventListener('click', () => {
        notification.style.animation = 'slideDown 0.35s ease reverse';
        setTimeout(() => notification.remove(), 350);
        localStorage.setItem('devNotificationClosed', 'true');
    });

    if (localStorage.getItem('devNotificationClosed') === 'true') {
        notification.style.display = 'none';
    }
})();