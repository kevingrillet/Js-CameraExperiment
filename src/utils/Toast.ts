/**
 * Toast - Simple toast notification system
 * Displays temporary messages at the top-right of the screen
 */

export type ToastType = "info" | "warning" | "error" | "success";

export class Toast {
  private static container: HTMLElement | null = null;
  private static readonly DEFAULT_DURATION = 3000; // ms
  private static readonly ERROR_DURATION = 8000; // ms - errors stay longer
  private static readonly MAX_TOASTS = 3; // F23 FIX - Max 3 toasts visible
  private static activeToasts: HTMLElement[] = []; // F23 FIX - FIFO queue

  /**
   * Initialize toast container (call once on app start)
   */
  static init(): void {
    if (this.container !== null) {
      return; // Already initialized
    }

    this.container = document.createElement("div");
    this.container.id = "toast-container";
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    `;
    document.body.appendChild(this.container);
  }

  /**
   * Show a toast message
   * @param message - Message text
   * @param type - Toast type (affects styling)
   * @param duration - Display duration in milliseconds (0 = no auto-dismiss)
   */
  static show(
    message: string,
    type: ToastType = "info",
    duration = this.DEFAULT_DURATION
  ): void {
    if (this.container === null) {
      this.init();
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    // Get icon based on type
    const icon = this.getIcon(type);

    // H2 FIX - Build DOM programmatically to prevent XSS
    const iconSpan = document.createElement("span");
    iconSpan.className = "toast-icon";
    iconSpan.textContent = icon;

    const messageSpan = document.createElement("span");
    messageSpan.className = "toast-message";
    messageSpan.textContent = message;

    const closeBtnEl = document.createElement("button");
    closeBtnEl.className = "toast-close";
    closeBtnEl.setAttribute("aria-label", "Close");
    closeBtnEl.textContent = "×";

    toast.appendChild(iconSpan);
    toast.appendChild(messageSpan);
    toast.appendChild(closeBtnEl);

    // Styling
    toast.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: ${this.getBackgroundColor(type)};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      font-size: 14px;
      animation: slideIn 0.3s ease-out;
      min-width: 300px;
      max-width: 400px;
    `;

    // Close button styling
    closeBtnEl.style.cssText = `
      background: transparent;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      margin-left: auto;
      line-height: 1;
      opacity: 0.8;
    `;
    closeBtnEl.addEventListener("click", () => {
      this.dismiss(toast);
    });

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }

    // F23 FIX - FIFO queue management: dismiss oldest if we have 3 toasts
    if (this.activeToasts.length >= this.MAX_TOASTS) {
      const oldestToast = this.activeToasts.shift();
      if (oldestToast !== undefined) {
        this.dismiss(oldestToast);
      }
    }

    this.activeToasts.push(toast);
    this.container?.appendChild(toast);

    // Add CSS animation if not already added
    if (document.getElementById("toast-styles") === null) {
      const style = document.createElement("style");
      style.id = "toast-styles";
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Dismiss a toast with animation
   */
  private static dismiss(toast: HTMLElement): void {
    // F23 FIX - Remove from active queue
    const index = this.activeToasts.indexOf(toast);
    if (index !== -1) {
      this.activeToasts.splice(index, 1);
    }

    toast.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }

  /**
   * Shorthand methods
   */
  static info(message: string, duration?: number): void {
    this.show(message, "info", duration);
  }

  static warning(message: string, duration?: number): void {
    this.show(message, "warning", duration);
  }

  static error(message: string, duration?: number): void {
    this.show(message, "error", duration ?? this.ERROR_DURATION);
  }

  static success(message: string, duration?: number): void {
    this.show(message, "success", duration);
  }

  /**
   * Get icon for toast type
   */
  private static getIcon(type: ToastType): string {
    switch (type) {
      case "info":
        return "ℹ️";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "success":
        return "✅";
    }
  }

  /**
   * Get background color for toast type
   */
  private static getBackgroundColor(type: ToastType): string {
    switch (type) {
      case "info":
        return "#3498db"; // Blue
      case "warning":
        return "#f39c12"; // Orange
      case "error":
        return "#e74c3c"; // Red
      case "success":
        return "#27ae60"; // Green
    }
  }
}
