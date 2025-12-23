/**
 * Toast Notification Manager
 * Shows temporary notifications for important game events
 */

class ToastManager {
    constructor() {
        this.container = document.getElementById('toast-container');
        this.coinContainer = document.getElementById('coin-indicator-container');
        this.toasts = [];
    }

    /**
     * Show a toast notification
     * @param {Object} options - Toast options
     * @param {string} options.title - Toast title
     * @param {string} options.message - Toast message (optional)
     * @param {string} options.type - Toast type: 'success', 'warning', 'error', 'info'
     * @param {string} options.icon - Emoji icon (optional, defaults based on type)
     * @param {number} options.duration - Duration in ms (default: 3000)
     */
    show({ title, message = '', type = 'info', icon, duration = 3000 }) {
        // Default icons based on type
        const defaultIcons = {
            success: '✓',
            warning: '⚠',
            error: '✗',
            info: 'ℹ'
        };

        const toastEl = document.createElement('div');
        toastEl.className = `toast toast-${type}`;
        toastEl.innerHTML = `
            <span class="toast-icon">${icon || defaultIcons[type]}</span>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
        `;

        this.container.appendChild(toastEl);
        this.toasts.push(toastEl);

        // Auto remove after duration
        setTimeout(() => {
            this.dismiss(toastEl);
        }, duration);

        return toastEl;
    }

    /**
     * Dismiss a toast with exit animation
     */
    dismiss(toastEl) {
        if (!toastEl.parentElement) return;

        toastEl.classList.add('toast-exit');
        setTimeout(() => {
            toastEl.remove();
            this.toasts = this.toasts.filter(t => t !== toastEl);
        }, 300);
    }

    /**
     * Show a floating coin indicator at the center of the screen
     * @param {number} value - The coin value collected
     */
    showCoinCollected(value) {
        const indicator = document.createElement('div');
        indicator.className = 'coin-indicator';
        indicator.textContent = `+$${value}`;

        // Position at center of screen
        indicator.style.left = '50%';
        indicator.style.top = '50%';
        indicator.style.transform = 'translate(-50%, -50%)';

        this.coinContainer.appendChild(indicator);

        // Remove after animation completes
        setTimeout(() => {
            indicator.remove();
        }, 1000);
    }

    // Convenience methods
    success(title, message, icon) {
        return this.show({ title, message, type: 'success', icon });
    }

    warning(title, message, icon) {
        return this.show({ title, message, type: 'warning', icon });
    }

    error(title, message, icon) {
        return this.show({ title, message, type: 'error', icon });
    }

    info(title, message, icon) {
        return this.show({ title, message, type: 'info', icon });
    }
}

// Export singleton instance
export const toastManager = new ToastManager();
