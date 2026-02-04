(function() {
    // Check if widget already exists to prevent duplicates
    if (document.getElementById('devNotification')) return;

    // Create the widget HTML
    const widgetHTML = `
        <div id="devNotification" class="dev-notification">
            <div class="notification-content">
                <p>Website is under development. You might encounter some issues during this phase. We'll keep them minimal and handle everything smoothly.</p>
                <p>For more information, contact admin or IT developer.</p>
                <button id="closeDevNotification" class="close-btn">&times;</button>
            </div>
        </div>
    `;

    // Add CSS styles
    const style = document.createElement('style');
    style.textContent = `
        .dev-notification {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background-color: rgba(230, 230, 230, 0.85);
            padding: 7px 0;
            z-index: 9999;
            border-bottom: 1px solid #ccc;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }

        .notification-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
        }

        .notification-content p {
            margin: 0;
            font-size: 14px;
            color: #333;
            line-height: 1.4;
        }

        .notification-content p:first-child {
            flex: 1;
            margin-right: 15px;
        }

        .close-btn {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 25px;
            height: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s ease;
        }

        .close-btn:hover {
            background-color: rgba(0,0,0,0.1);
            color: #333;
        }
    `;
    document.head.appendChild(style);

    // Insert widget into DOM
    document.body.insertAdjacentHTML('afterbegin', widgetHTML);

    // Add event listeners
    document.getElementById('closeDevNotification').addEventListener('click', function() {
        const notification = document.getElementById('devNotification');
        notification.style.transform = 'translateY(-100%)';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
        localStorage.setItem('devNotificationClosed', 'true');
    });

    // Check if user previously closed the notification
    if (localStorage.getItem('devNotificationClosed') === 'true') {
        document.getElementById('devNotification').style.display = 'none';
    }
})();