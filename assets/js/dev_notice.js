(function() {
    // Check if widget already exists to prevent duplicates
    if (document.getElementById('devNotification')) return;

    // Create the widget HTML
    const widgetHTML = `
        <div id="devNotification" class="dev-notification">
            <div class="notification-container">
                <div class="notification-icon">⚙️</div>
                <div class="notification-text">
                    <p><strong>Development Mode Active</strong></p>
                    <p>Website is under development. You might encounter some issues during this phase. We'll keep them minimal and handle everything smoothly.</p>
                    <p>For more information, contact admin or IT developer.</p>
                </div>
                <button id="closeDevNotification" class="close-btn" aria-label="Close notification">×</button>
            </div>
        </div>
    `;

    // Add CSS styles optimized for dark theme
    const style = document.createElement('style');
    style.textContent = `
        .dev-notification {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background: linear-gradient(135deg, rgba(10, 14, 23, 0.95) 0%, rgba(24, 31, 43, 0.95) 100%);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            padding: 12px 0;
            z-index: 9999;
            border-bottom: 1px solid rgba(100, 194, 255, 0.3);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            animation: slideDown 0.4s ease-out;
        }

        @keyframes slideDown {
            from {
                transform: translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .notification-container {            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            align-items: flex-start;
            gap: 15px;
        }

        .notification-icon {
            font-size: 24px;
            margin-top: 2px;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }

        .notification-text {
            flex: 1;
        }

        .notification-text p {
            margin: 0 0 5px 0;
            font-size: 14px;
            line-height: 1.5;
            color: #e0e0e0;
        }

        .notification-text p:first-child {
            color: #64c2ff;
            font-weight: 600;
            font-size: 15px;
        }

        .close-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(100, 194, 255, 0.3);
            color: #64c2ff;
            font-size: 20px;
            cursor: pointer;
            padding: 5px 10px;
            border-radius: 6px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;            transition: all 0.3s ease;
            flex-shrink: 0;
        }

        .close-btn:hover {
            background: rgba(100, 194, 255, 0.2);
            color: #ffffff;
            transform: rotate(90deg);
            border-color: #64c2ff;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
            .notification-container {
                padding: 0 15px;
                flex-direction: column;
            }
            
            .notification-icon {
                align-self: center;
            }
            
            .close-btn {
                align-self: flex-end;
            }
        }
    `;
    document.head.appendChild(style);

    // Insert widget into DOM
    document.body.insertAdjacentHTML('afterbegin', widgetHTML);

    // Add event listeners
    document.getElementById('closeDevNotification').addEventListener('click', function() {
        const notification = document.getElementById('devNotification');
        notification.style.animation = 'slideDown 0.4s ease-out reverse';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 400);
        localStorage.setItem('devNotificationClosed', 'true');
    });

    // Check if user previously closed the notification
    if (localStorage.getItem('devNotificationClosed') === 'true') {
        const notification = document.getElementById('devNotification');
        notification.style.animation = 'slideDown 0.4s ease-out reverse';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 10);
    }})();