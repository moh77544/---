// نظام الإشعارات والتنبيهات
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.toastContainer = null;
        this.modalContainer = null;
        this.init();
    }

    // تهيئة نظام الإشعارات
    init() {
        this.createToastContainer();
        this.createModalContainer();
        this.loadStoredNotifications();
    }

    // إنشاء حاوية التوست
    createToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'toast-container';
        this.toastContainer.innerHTML = '';
        document.body.appendChild(this.toastContainer);
    }

    // إنشاء حاوية المودال
    createModalContainer() {
        this.modalContainer = document.createElement('div');
        this.modalContainer.className = 'modal-container';
        this.modalContainer.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.style.display='none'"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title"></h3>
                    <button class="modal-close" onclick="this.closest('.modal-container').style.display='none'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body"></div>
                <div class="modal-footer"></div>
            </div>
        `;
        document.body.appendChild(this.modalContainer);
    }

    // عرض تنبيه توست
    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = this.getToastIcon(type);
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // إضافة التوست
        this.toastContainer.appendChild(toast);

        // تحريك التوست للداخل
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 100);

        // إزالة التوست تلقائياً
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }

        return toast;
    }

    // إزالة التوست
    removeToast(toast) {
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }

    // الحصول على أيقونة التوست
    getToastIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle',
            loading: 'fas fa-spinner fa-spin'
        };
        return icons[type] || icons.info;
    }

    // عرض مودال
    showModal(title, content, buttons = []) {
        const modal = this.modalContainer;
        
        modal.querySelector('.modal-title').textContent = title;
        modal.querySelector('.modal-body').innerHTML = content;
        
        // إضافة الأزرار
        const footer = modal.querySelector('.modal-footer');
        footer.innerHTML = '';
        
        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = `btn ${button.class || 'btn-primary'}`;
            btn.textContent = button.text;
            btn.onclick = () => {
                if (button.action) button.action();
                modal.style.display = 'none';
            };
            footer.appendChild(btn);
        });

        // إضافة زر إغلاق افتراضي إذا لم توجد أزرار
        if (buttons.length === 0) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'btn btn-secondary';
            closeBtn.textContent = 'إغلاق';
            closeBtn.onclick = () => modal.style.display = 'none';
            footer.appendChild(closeBtn);
        }

        modal.style.display = 'flex';
        return modal;
    }

    // عرض مودال تأكيد
    showConfirm(title, message, onConfirm, onCancel) {
        return this.showModal(title, `<p>${message}</p>`, [
            {
                text: 'تأكيد',
                class: 'btn-primary',
                action: onConfirm
            },
            {
                text: 'إلغاء',
                class: 'btn-secondary',
                action: onCancel
            }
        ]);
    }

    // عرض مودال تحميل
    showLoading(message = 'جاري التحميل...') {
        const loadingContent = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p>${message}</p>
            </div>
        `;
        
        const modal = this.showModal('', loadingContent, []);
        modal.classList.add('loading-modal');
        
        // منع إغلاق مودال التحميل بالنقر خارجه
        modal.querySelector('.modal-overlay').onclick = null;
        modal.querySelector('.modal-close').style.display = 'none';
        
        return modal;
    }

    // إخفاء مودال التحميل
    hideLoading() {
        const loadingModal = document.querySelector('.loading-modal');
        if (loadingModal) {
            loadingModal.style.display = 'none';
            loadingModal.classList.remove('loading-modal');
        }
    }

    // إضافة إشعار
    addNotification(notification) {
        const newNotification = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };
        
        this.notifications.unshift(newNotification);
        this.saveNotifications();
        this.updateNotificationBadge();
        
        return newNotification;
    }

    // وضع علامة مقروء على الإشعار
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.updateNotificationBadge();
        }
    }

    // وضع علامة مقروء على جميع الإشعارات
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.saveNotifications();
        this.updateNotificationBadge();
    }

    // حذف إشعار
    deleteNotification(notificationId) {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.saveNotifications();
        this.updateNotificationBadge();
    }

    // الحصول على الإشعارات غير المقروءة
    getUnreadNotifications() {
        return this.notifications.filter(n => !n.read);
    }

    // الحصول على عدد الإشعارات غير المقروءة
    getUnreadCount() {
        return this.getUnreadNotifications().length;
    }

    // تحديث شارة الإشعارات
    updateNotificationBadge() {
        const badge = document.querySelector('#notifications-btn .badge');
        const unreadCount = this.getUnreadCount();
        
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // عرض قائمة الإشعارات
    showNotificationsList() {
        const notificationsHtml = this.notifications.length > 0 ? 
            this.notifications.map(n => this.renderNotification(n)).join('') :
            '<div class="no-notifications">لا توجد إشعارات</div>';

        const content = `
            <div class="notifications-header">
                <button class="btn btn-link" onclick="window.notificationManager.markAllAsRead()">
                    وضع علامة مقروء على الكل
                </button>
            </div>
            <div class="notifications-list">
                ${notificationsHtml}
            </div>
        `;

        this.showModal('الإشعارات', content, []);
    }

    // عرض إشعار واحد
    renderNotification(notification) {
        const timeAgo = this.getTimeAgo(notification.timestamp);
        const readClass = notification.read ? 'read' : 'unread';
        
        return `
            <div class="notification-item ${readClass}" data-id="${notification.id}">
                <div class="notification-icon ${notification.type}">
                    <i class="${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <h4>${notification.title}</h4>
                    <p>${notification.message}</p>
                    <span class="notification-time">${timeAgo}</span>
                </div>
                <div class="notification-actions">
                    ${!notification.read ? `
                        <button onclick="window.notificationManager.markAsRead(${notification.id})" title="وضع علامة مقروء">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button onclick="window.notificationManager.deleteNotification(${notification.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // الحصول على أيقونة الإشعار
    getNotificationIcon(type) {
        const icons = {
            transaction: 'fas fa-exchange-alt',
            security: 'fas fa-shield-alt',
            system: 'fas fa-cog',
            promotion: 'fas fa-gift',
            warning: 'fas fa-exclamation-triangle'
        };
        return icons[type] || 'fas fa-bell';
    }

    // حساب الوقت المنقضي
    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);

        if (diffInSeconds < 60) return 'الآن';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} دقيقة`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ساعة`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} يوم`;
        return time.toLocaleDateString('ar-SA');
    }

    // حفظ الإشعارات
    saveNotifications() {
        localStorage.setItem('unifiedWallet_notifications', JSON.stringify(this.notifications));
    }

    // تحميل الإشعارات المحفوظة
    loadStoredNotifications() {
        const stored = localStorage.getItem('unifiedWallet_notifications');
        if (stored) {
            this.notifications = JSON.parse(stored);
            this.updateNotificationBadge();
        }
    }

    // إضافة إشعار معاملة
    addTransactionNotification(type, amount, wallet) {
        const messages = {
            send: `تم إرسال ${amount.toLocaleString()} ر.ي من ${wallet}`,
            receive: `تم استلام ${amount.toLocaleString()} ر.ي في ${wallet}`,
            bill: `تم دفع فاتورة بمبلغ ${amount.toLocaleString()} ر.ي من ${wallet}`
        };

        this.addNotification({
            type: 'transaction',
            title: 'معاملة جديدة',
            message: messages[type] || `معاملة بمبلغ ${amount.toLocaleString()} ر.ي`
        });
    }

    // إضافة إشعار أمني
    addSecurityNotification(message) {
        this.addNotification({
            type: 'security',
            title: 'تنبيه أمني',
            message: message
        });
    }

    // إضافة إشعار نظام
    addSystemNotification(message) {
        this.addNotification({
            type: 'system',
            title: 'إشعار النظام',
            message: message
        });
    }
}

// تصدير الكلاس للاستخدام في التطبيق الرئيسي
window.NotificationManager = NotificationManager;
