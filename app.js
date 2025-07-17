// التطبيق الرئيسي - محفظتي الموحدة
class UnifiedWalletApp {
    constructor() {
        this.currentUser = null;
        this.currentScreen = 'login';
        this.wallets = [];
        this.transactions = [];
        this.isBalanceHidden = false;

        // تهيئة المدراء
        this.authManager = new AuthenticationManager();
        this.walletManager = new WalletManager();
        this.notificationManager = new NotificationManager();

        this.init();
    }

    // تهيئة التطبيق
    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.showLoadingScreen();
        
        // محاكاة تحميل البيانات
        setTimeout(() => {
            this.hideLoadingScreen();
            this.checkAuthStatus();
        }, 2000);
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // تسجيل الدخول
        document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
        document.getElementById('biometric-login').addEventListener('click', () => this.handleBiometricLogin());
        document.getElementById('register-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterModal();
        });

        // الشاشة الرئيسية
        document.getElementById('refresh-balance').addEventListener('click', () => this.refreshBalances());
        document.getElementById('hide-balance').addEventListener('click', () => this.toggleBalanceVisibility());
        
        // الإجراءات السريعة
        document.getElementById('transfer-btn').addEventListener('click', () => this.showTransferScreen());
        document.getElementById('pay-bills-btn').addEventListener('click', () => this.showBillsScreen());
        document.getElementById('recharge-btn').addEventListener('click', () => this.showRechargeScreen());
        document.getElementById('qr-scan-btn').addEventListener('click', () => this.startQRScan());

        // شريط التنقل
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const screen = item.dataset.screen;
                this.switchScreen(screen);
            });
        });

        // أزرار الإعدادات والإشعارات
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        document.getElementById('notifications-btn').addEventListener('click', () => this.showNotifications());

        // أزرار الإدارة
        document.getElementById('manage-wallets').addEventListener('click', () => this.showWalletManagement());
        document.getElementById('view-all-transactions').addEventListener('click', () => this.showAllTransactions());

        // أزرار الرجوع
        document.getElementById('transfer-back').addEventListener('click', () => this.switchScreen('main'));

        // شاشة التحويل
        this.setupTransferScreen();

        // إدخال رقم الهاتف
        document.getElementById('phone-number').addEventListener('input', this.formatPhoneNumber);
        document.getElementById('pin-code').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
    }

    // عرض شاشة التحميل
    showLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'flex';
    }

    // إخفاء شاشة التحميل
    hideLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'none';
    }

    // فحص حالة المصادقة
    checkAuthStatus() {
        const savedUser = localStorage.getItem('unifiedWallet_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.switchScreen('main');
            this.loadUserWallets();
        } else {
            this.switchScreen('login');
        }
    }

    // تسجيل الدخول
    async handleLogin() {
        const phoneNumber = document.getElementById('phone-number').value;
        const pinCode = document.getElementById('pin-code').value;

        if (!phoneNumber || !pinCode) {
            this.showAlert('يرجى إدخال رقم الهاتف ورمز PIN', 'error');
            return;
        }

        this.showLoading('جاري تسجيل الدخول...');

        try {
            const user = await this.authManager.loginWithPin(phoneNumber, pinCode);
            this.currentUser = user;

            this.hideLoading();
            this.showAlert('تم تسجيل الدخول بنجاح', 'success');
            this.switchScreen('main');
            await this.loadUserWallets();

        } catch (error) {
            this.hideLoading();
            this.showAlert(error.message, 'error');
        }
    }

    // تسجيل الدخول بالبصمة
    async handleBiometricLogin() {
        this.showLoading('جاري التحقق من البصمة...');

        try {
            const user = await this.authManager.loginWithBiometric();
            this.currentUser = user;

            this.hideLoading();
            this.showAlert('تم تسجيل الدخول بالبصمة بنجاح', 'success');
            this.switchScreen('main');
            await this.loadUserWallets();

        } catch (error) {
            this.hideLoading();
            this.showAlert(error.message, 'error');
        }
    }

    // تحميل محافظ المستخدم
    async loadUserWallets() {
        this.showLoading('جاري تحميل المحافظ...');

        try {
            // الحصول على محافظ المستخدم من مدير المحافظ
            this.wallets = this.walletManager.getUserWallets();

            // إذا لم توجد محافظ، إنشاء محافظ تجريبية
            if (this.wallets.length === 0) {
                await this.createDemoWallets();
            }

            // تحديث أرصدة المحافظ
            await this.walletManager.updateAllBalances();
            this.wallets = this.walletManager.getUserWallets();

            this.loadRecentTransactions();
            this.updateUI();
            this.hideLoading();

        } catch (error) {
            this.hideLoading();
            this.showAlert('فشل في تحميل المحافظ', 'error');
        }
    }

    // إنشاء محافظ تجريبية
    async createDemoWallets() {
        const demoWallets = [
            { id: 'jawali', accountNumber: '777123456', pin: '1234' },
            { id: 'onecash', accountNumber: '777234567', pin: '1234' },
            { id: 'cash', accountNumber: '777345678', pin: '1234' },
            { id: 'jaib', accountNumber: '777456789', pin: '1234' },
            { id: 'mfloos', accountNumber: '777567890', pin: '1234' },
            { id: 'mobilemoney', accountNumber: '777678901', pin: '1234' }
        ];

        for (const wallet of demoWallets) {
            try {
                await this.walletManager.addWallet(wallet.id, wallet.accountNumber, wallet.pin);
            } catch (error) {
                console.warn(`فشل في إضافة محفظة ${wallet.id}:`, error.message);
            }
        }
    }

    // تحميل المعاملات الأخيرة
    loadRecentTransactions() {
        this.transactions = [
            {
                id: 1,
                type: 'send',
                title: 'تحويل إلى أحمد محمد',
                wallet: 'جوالي',
                amount: -500,
                time: '10:30 ص',
                date: new Date().toISOString()
            },
            {
                id: 2,
                type: 'receive',
                title: 'استلام من سارة أحمد',
                wallet: 'ONE Cash',
                amount: 1200,
                time: '09:15 ص',
                date: new Date().toISOString()
            },
            {
                id: 3,
                type: 'bill',
                title: 'فاتورة كهرباء',
                wallet: 'Cash',
                amount: -350,
                time: 'أمس',
                date: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 4,
                type: 'send',
                title: 'شحن رصيد',
                wallet: 'Jaib',
                amount: -100,
                time: 'أمس',
                date: new Date(Date.now() - 86400000).toISOString()
            }
        ];
    }

    // تحديث واجهة المستخدم
    updateUI() {
        this.updateUserInfo();
        this.updateTotalBalance();
        this.renderWallets();
        this.renderTransactions();
    }

    // تحديث معلومات المستخدم
    updateUserInfo() {
        if (this.currentUser) {
            document.getElementById('user-name').textContent = `مرحباً ${this.currentUser.name}`;
            document.getElementById('user-phone').textContent = this.currentUser.phone;
        }
    }

    // تحديث الرصيد الإجمالي
    updateTotalBalance() {
        const total = this.wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
        const balanceElement = document.getElementById('total-balance');
        
        if (this.isBalanceHidden) {
            balanceElement.textContent = '••••• ر.ي';
        } else {
            balanceElement.textContent = `${total.toLocaleString()} ر.ي`;
        }
    }

    // عرض المحافظ
    renderWallets() {
        const walletsList = document.getElementById('wallets-list');
        walletsList.innerHTML = '';

        this.wallets.forEach(wallet => {
            const walletCard = this.createWalletCard(wallet);
            walletsList.appendChild(walletCard);
        });
    }

    // إنشاء بطاقة محفظة
    createWalletCard(wallet) {
        const card = document.createElement('div');
        card.className = 'wallet-card';
        card.onclick = () => this.openWalletDetails(wallet);

        const balanceDisplay = this.isBalanceHidden ? 
            '•••••' : wallet.balance.toLocaleString();

        card.innerHTML = `
            <div class="wallet-info">
                <div class="wallet-icon">
                    <img src="${wallet.icon}" alt="${wallet.name}" onerror="this.style.display='none'">
                </div>
                <div class="wallet-details">
                    <h4>${wallet.name}</h4>
                    <p>${wallet.provider}</p>
                </div>
            </div>
            <div class="wallet-balance">
                <div class="amount">${balanceDisplay}</div>
                <div class="currency">ر.ي</div>
            </div>
        `;

        return card;
    }

    // عرض المعاملات
    renderTransactions() {
        const transactionsList = document.getElementById('transactions-list');
        transactionsList.innerHTML = '';

        this.transactions.slice(0, 5).forEach(transaction => {
            const transactionItem = this.createTransactionItem(transaction);
            transactionsList.appendChild(transactionItem);
        });
    }

    // إنشاء عنصر معاملة
    createTransactionItem(transaction) {
        const item = document.createElement('div');
        item.className = 'transaction-item';

        const iconClass = transaction.type === 'send' ? 'fas fa-arrow-up' :
                         transaction.type === 'receive' ? 'fas fa-arrow-down' :
                         'fas fa-file-invoice-dollar';

        const amountClass = transaction.amount > 0 ? 'positive' : 'negative';
        const amountSign = transaction.amount > 0 ? '+' : '';

        item.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-icon ${transaction.type}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="transaction-details">
                    <h5>${transaction.title}</h5>
                    <p>${transaction.wallet}</p>
                </div>
            </div>
            <div class="transaction-amount ${amountClass}">
                <div class="amount">${amountSign}${Math.abs(transaction.amount).toLocaleString()} ر.ي</div>
                <div class="time">${transaction.time}</div>
            </div>
        `;

        return item;
    }

    // محاكاة استدعاء API
    simulateAPICall(delay = 1000) {
        return new Promise((resolve) => {
            setTimeout(resolve, delay);
        });
    }

    // عرض رسالة تنبيه
    showAlert(message, type = 'info') {
        this.notificationManager.showToast(message, type);
    }

    // عرض شاشة التحميل
    showLoading(message = 'جاري التحميل...') {
        this.loadingModal = this.notificationManager.showLoading(message);
    }

    // إخفاء شاشة التحميل
    hideLoading() {
        this.notificationManager.hideLoading();
    }

    // تبديل الشاشات
    switchScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        document.getElementById(`${screenName}-screen`).classList.add('active');
        
        // تحديث شريط التنقل
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-screen="${screenName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        this.currentScreen = screenName;
    }

    // تنسيق رقم الهاتف
    formatPhoneNumber(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 9) {
            value = value.slice(0, 9);
        }
        e.target.value = value;
    }

    // تحديث الأرصدة
    async refreshBalances() {
        this.showLoading('جاري تحديث الأرصدة...');
        await this.simulateAPICall(1500);
        this.updateTotalBalance();
        this.renderWallets();
        this.hideLoading();
        this.showAlert('تم تحديث الأرصدة بنجاح', 'success');
    }

    // إخفاء/إظهار الرصيد
    toggleBalanceVisibility() {
        this.isBalanceHidden = !this.isBalanceHidden;
        const hideBtn = document.getElementById('hide-balance');
        const icon = hideBtn.querySelector('i');
        
        if (this.isBalanceHidden) {
            icon.className = 'fas fa-eye';
            hideBtn.innerHTML = '<i class="fas fa-eye"></i> إظهار';
        } else {
            icon.className = 'fas fa-eye-slash';
            hideBtn.innerHTML = '<i class="fas fa-eye-slash"></i> إخفاء';
        }
        
        this.updateTotalBalance();
        this.renderWallets();
    }

    // تحميل بيانات المستخدم
    loadUserData() {
        // تحميل الإعدادات المحفوظة
        const savedSettings = localStorage.getItem('unifiedWallet_settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.isBalanceHidden = settings.hideBalance || false;
        }
    }

    // حفظ بيانات المستخدم
    saveUserData() {
        const settings = {
            hideBalance: this.isBalanceHidden
        };
        localStorage.setItem('unifiedWallet_settings', JSON.stringify(settings));
    }

    // إعداد شاشة التحويل
    setupTransferScreen() {
        this.currentTransferStep = 1;
        this.selectedSourceWallet = null;
        this.transferData = {};

        // أزرار التنقل
        document.getElementById('transfer-next-btn').addEventListener('click', () => this.nextTransferStep());
        document.getElementById('transfer-prev-btn').addEventListener('click', () => this.prevTransferStep());
        document.getElementById('transfer-confirm-btn').addEventListener('click', () => this.confirmTransfer());

        // اقتراحات المبلغ
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('transfer-amount').value = btn.dataset.amount;
            });
        });
    }

    // عرض شاشة التحويل
    showTransferScreen() {
        this.switchScreen('transfer');
        this.resetTransferForm();
        this.renderSourceWallets();
    }

    // إعادة تعيين نموذج التحويل
    resetTransferForm() {
        this.currentTransferStep = 1;
        this.selectedSourceWallet = null;
        this.transferData = {};

        // إعادة تعيين الخطوات
        this.updateTransferSteps();

        // مسح النموذج
        document.getElementById('destination-wallet').value = '';
        document.getElementById('recipient-number').value = '';
        document.getElementById('transfer-amount').value = '';
        document.getElementById('transfer-note').value = '';
        document.getElementById('transfer-pin').value = '';
    }

    // تحديث مؤشر الخطوات
    updateTransferSteps() {
        for (let i = 1; i <= 3; i++) {
            const step = document.getElementById(`transfer-step-${i}`);
            const content = document.getElementById(`transfer-step-content-${i}`);

            if (i < this.currentTransferStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (i === this.currentTransferStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }

            content.classList.toggle('active', i === this.currentTransferStep);
        }

        // تحديث أزرار التنقل
        const prevBtn = document.getElementById('transfer-prev-btn');
        const nextBtn = document.getElementById('transfer-next-btn');
        const confirmBtn = document.getElementById('transfer-confirm-btn');

        prevBtn.style.display = this.currentTransferStep > 1 ? 'block' : 'none';
        nextBtn.style.display = this.currentTransferStep < 3 ? 'block' : 'none';
        confirmBtn.style.display = this.currentTransferStep === 3 ? 'block' : 'none';
    }

    // عرض المحافظ المصدر
    renderSourceWallets() {
        const container = document.getElementById('source-wallet-selection');
        container.innerHTML = '';

        this.wallets.forEach(wallet => {
            const option = this.createWalletOption(wallet);
            container.appendChild(option);
        });
    }

    // إنشاء خيار محفظة
    createWalletOption(wallet) {
        const option = document.createElement('div');
        option.className = 'wallet-option';
        option.onclick = () => this.selectSourceWallet(wallet);

        const balanceDisplay = this.isBalanceHidden ?
            '•••••' : wallet.balance.toLocaleString();

        option.innerHTML = `
            <div class="wallet-option-info">
                <div class="wallet-option-icon">
                    <img src="${wallet.icon}" alt="${wallet.name}" onerror="this.style.display='none'">
                </div>
                <div class="wallet-option-details">
                    <h4>${wallet.name}</h4>
                    <p>${wallet.provider}</p>
                </div>
            </div>
            <div class="wallet-option-balance">
                <div class="amount">${balanceDisplay}</div>
                <div class="currency">ر.ي</div>
            </div>
        `;

        return option;
    }

    // اختيار المحفظة المصدر
    selectSourceWallet(wallet) {
        this.selectedSourceWallet = wallet;

        // تحديث التحديد البصري
        document.querySelectorAll('.wallet-option').forEach(option => {
            option.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');

        this.transferData.sourceWallet = wallet;
    }

    // الخطوة التالية
    nextTransferStep() {
        if (this.validateCurrentStep()) {
            this.currentTransferStep++;
            this.updateTransferSteps();

            if (this.currentTransferStep === 3) {
                this.updateTransferSummary();
            }
        }
    }

    // الخطوة السابقة
    prevTransferStep() {
        this.currentTransferStep--;
        this.updateTransferSteps();
    }

    // التحقق من صحة الخطوة الحالية
    validateCurrentStep() {
        switch (this.currentTransferStep) {
            case 1:
                if (!this.selectedSourceWallet) {
                    this.showAlert('يرجى اختيار المحفظة المرسلة', 'error');
                    return false;
                }
                return true;

            case 2:
                const destinationWallet = document.getElementById('destination-wallet').value;
                const recipientNumber = document.getElementById('recipient-number').value;
                const amount = parseFloat(document.getElementById('transfer-amount').value);

                if (!destinationWallet) {
                    this.showAlert('يرجى اختيار المحفظة المستقبلة', 'error');
                    return false;
                }

                if (!recipientNumber || recipientNumber.length !== 9) {
                    this.showAlert('يرجى إدخال رقم المستقبل صحيح (9 أرقام)', 'error');
                    return false;
                }

                if (!amount || amount <= 0) {
                    this.showAlert('يرجى إدخال مبلغ صحيح', 'error');
                    return false;
                }

                if (amount > this.selectedSourceWallet.balance) {
                    this.showAlert('المبلغ أكبر من الرصيد المتاح', 'error');
                    return false;
                }

                // حفظ بيانات التحويل
                this.transferData.destinationWallet = destinationWallet;
                this.transferData.recipientNumber = recipientNumber;
                this.transferData.amount = amount;
                this.transferData.note = document.getElementById('transfer-note').value;

                return true;

            default:
                return true;
        }
    }

    // تحديث ملخص التحويل
    updateTransferSummary() {
        const sourceWalletInfo = this.walletManager.getWalletInfo(this.transferData.sourceWallet.id);
        const destinationWalletInfo = this.walletManager.getWalletInfo(this.transferData.destinationWallet);

        const fee = sourceWalletInfo.fees.transfer;
        const total = this.transferData.amount + fee;

        document.getElementById('summary-from-wallet').textContent = this.transferData.sourceWallet.name;
        document.getElementById('summary-to-wallet').textContent = destinationWalletInfo.name;
        document.getElementById('summary-recipient').textContent = `+967${this.transferData.recipientNumber}`;
        document.getElementById('summary-amount').textContent = `${this.transferData.amount.toLocaleString()} ر.ي`;
        document.getElementById('summary-fee').textContent = `${fee.toLocaleString()} ر.ي`;
        document.getElementById('summary-total').textContent = `${total.toLocaleString()} ر.ي`;
    }

    // تأكيد التحويل
    async confirmTransfer() {
        const pin = document.getElementById('transfer-pin').value;

        if (!pin) {
            this.showAlert('يرجى إدخال رمز PIN', 'error');
            return;
        }

        this.showLoading('جاري تنفيذ التحويل...');

        try {
            const result = await this.walletManager.executeTransfer(
                this.transferData.sourceWallet.id,
                this.transferData.destinationWallet,
                this.transferData.amount,
                this.transferData.recipientNumber,
                pin
            );

            this.hideLoading();
            this.showTransferSuccess(result);

            // تحديث البيانات
            await this.loadUserWallets();

        } catch (error) {
            this.hideLoading();
            this.showAlert(error.message, 'error');
        }
    }

    // عرض نجاح التحويل
    showTransferSuccess(result) {
        const message = `
            تم التحويل بنجاح!

            رقم المعاملة: ${result.transactionId}
            المبلغ المحول: ${result.amount.toLocaleString()} ر.ي
            الرسوم: ${result.fee.toLocaleString()} ر.ي
            الرصيد المتبقي: ${result.newBalance.toLocaleString()} ر.ي
        `;

        this.showAlert(message, 'success');
        this.switchScreen('main');
    }

    // الوظائف التي سيتم تطويرها لاحقاً
    showBillsScreen() { console.log('عرض شاشة الفواتير'); }
    showRechargeScreen() { console.log('عرض شاشة الشحن'); }
    startQRScan() { console.log('بدء مسح QR'); }
    showSettings() { console.log('عرض الإعدادات'); }
    showNotifications() {
        this.notificationManager.showNotificationsList();
    }
    showWalletManagement() { console.log('إدارة المحافظ'); }
    showAllTransactions() { console.log('عرض جميع المعاملات'); }
    openWalletDetails(wallet) { console.log('تفاصيل المحفظة:', wallet.name); }
    showRegisterModal() {
        this.notificationManager.showModal(
            'إنشاء حساب جديد',
            `
                <div class="form-group">
                    <label>رقم الهاتف</label>
                    <div class="input-group">
                        <span class="input-prefix">+967</span>
                        <input type="tel" id="register-phone" placeholder="7xxxxxxxx" maxlength="9">
                    </div>
                </div>
                <div class="form-group">
                    <label>رمز PIN</label>
                    <input type="password" id="register-pin" placeholder="أدخل رمز PIN" maxlength="6">
                </div>
                <div class="form-group">
                    <label>تأكيد رمز PIN</label>
                    <input type="password" id="register-pin-confirm" placeholder="أعد إدخال رمز PIN" maxlength="6">
                </div>
            `,
            [
                {
                    text: 'إنشاء الحساب',
                    class: 'btn-primary',
                    action: () => this.handleRegister()
                },
                {
                    text: 'إلغاء',
                    class: 'btn-secondary'
                }
            ]
        );
    }

    // التعامل مع التسجيل
    handleRegister() {
        const phone = document.getElementById('register-phone').value;
        const pin = document.getElementById('register-pin').value;
        const pinConfirm = document.getElementById('register-pin-confirm').value;

        if (!phone || !pin || !pinConfirm) {
            this.showAlert('يرجى ملء جميع الحقول', 'error');
            return;
        }

        if (pin !== pinConfirm) {
            this.showAlert('رمز PIN غير متطابق', 'error');
            return;
        }

        if (phone.length !== 9) {
            this.showAlert('رقم الهاتف يجب أن يكون 9 أرقام', 'error');
            return;
        }

        if (pin.length < 4) {
            this.showAlert('رمز PIN يجب أن يكون 4 أرقام على الأقل', 'error');
            return;
        }

        // محاكاة إنشاء الحساب
        this.showAlert('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول', 'success');

        // ملء بيانات تسجيل الدخول
        document.getElementById('phone-number').value = phone;
        document.getElementById('pin-code').value = pin;
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.app = new UnifiedWalletApp();
});
