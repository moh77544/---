// نظام المصادقة والأمان
class AuthenticationManager {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 15 * 60 * 1000; // 15 دقيقة
        this.maxLoginAttempts = 3;
        this.lockoutDuration = 30 * 60 * 1000; // 30 دقيقة
        this.biometricCredential = null;
        
        this.init();
    }

    // تهيئة نظام المصادقة
    init() {
        this.setupSessionManagement();
        this.loadStoredCredentials();
        this.checkBiometricSupport();
    }

    // إعداد إدارة الجلسة
    setupSessionManagement() {
        // تحديث وقت النشاط عند التفاعل
        document.addEventListener('click', () => this.updateLastActivity());
        document.addEventListener('keypress', () => this.updateLastActivity());
        document.addEventListener('touchstart', () => this.updateLastActivity());

        // فحص انتهاء الجلسة كل دقيقة
        setInterval(() => this.checkSessionExpiry(), 60000);
    }

    // تسجيل دخول بالرقم ورمز PIN
    async loginWithPin(phoneNumber, pin) {
        try {
            // التحقق من محاولات تسجيل الدخول
            if (this.isAccountLocked(phoneNumber)) {
                const lockoutTime = this.getLockoutRemainingTime(phoneNumber);
                throw new Error(`الحساب مقفل. المحاولة مرة أخرى خلال ${Math.ceil(lockoutTime / 60000)} دقيقة`);
            }

            // التحقق من صحة البيانات
            if (!this.validatePhoneNumber(phoneNumber)) {
                throw new Error('رقم الهاتف غير صحيح');
            }

            if (!this.validatePin(pin)) {
                throw new Error('رمز PIN يجب أن يكون 4-6 أرقام');
            }

            // محاكاة التحقق من البيانات
            const isValid = await this.verifyCredentials(phoneNumber, pin);
            
            if (!isValid) {
                this.recordFailedAttempt(phoneNumber);
                const remainingAttempts = this.getRemainingAttempts(phoneNumber);
                
                if (remainingAttempts <= 0) {
                    this.lockAccount(phoneNumber);
                    throw new Error('تم قفل الحساب بسبب المحاولات الخاطئة المتكررة');
                }
                
                throw new Error(`بيانات تسجيل الدخول غير صحيحة. المحاولات المتبقية: ${remainingAttempts}`);
            }

            // تسجيل دخول ناجح
            this.clearFailedAttempts(phoneNumber);
            const user = await this.createUserSession(phoneNumber, pin);
            
            return user;

        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            throw error;
        }
    }

    // تسجيل دخول بالبصمة
    async loginWithBiometric() {
        try {
            if (!this.isBiometricSupported()) {
                throw new Error('المصادقة البيومترية غير مدعومة في هذا المتصفح');
            }

            if (!this.biometricCredential) {
                throw new Error('لم يتم تسجيل بصمة مسبقاً. يرجى تسجيل الدخول برمز PIN أولاً');
            }

            // التحقق من البصمة
            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: this.generateChallenge(),
                    allowCredentials: [{
                        type: 'public-key',
                        id: this.biometricCredential.id
                    }],
                    timeout: 60000,
                    userVerification: 'required'
                }
            });

            if (!credential) {
                throw new Error('فشل في التحقق من البصمة');
            }

            // إنشاء جلسة المستخدم
            const savedUser = this.getStoredUser();
            if (!savedUser) {
                throw new Error('لم يتم العثور على بيانات المستخدم');
            }

            const user = await this.createUserSession(savedUser.phone, null, 'biometric');
            return user;

        } catch (error) {
            console.error('خطأ في تسجيل الدخول بالبصمة:', error);
            throw error;
        }
    }

    // تسجيل البصمة
    async registerBiometric(phoneNumber) {
        try {
            if (!this.isBiometricSupported()) {
                throw new Error('المصادقة البيومترية غير مدعومة');
            }

            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: this.generateChallenge(),
                    rp: {
                        name: 'محفظتي الموحدة',
                        id: window.location.hostname
                    },
                    user: {
                        id: new TextEncoder().encode(phoneNumber),
                        name: phoneNumber,
                        displayName: `مستخدم ${phoneNumber}`
                    },
                    pubKeyCredParams: [{
                        type: 'public-key',
                        alg: -7 // ES256
                    }],
                    timeout: 60000,
                    attestation: 'none',
                    authenticatorSelection: {
                        authenticatorAttachment: 'platform',
                        userVerification: 'required'
                    }
                }
            });

            if (!credential) {
                throw new Error('فشل في تسجيل البصمة');
            }

            // حفظ بيانات البصمة
            this.biometricCredential = {
                id: credential.rawId,
                publicKey: credential.response.publicKey,
                phoneNumber: phoneNumber,
                registeredAt: new Date().toISOString()
            };

            this.storeBiometricCredential();
            return true;

        } catch (error) {
            console.error('خطأ في تسجيل البصمة:', error);
            throw error;
        }
    }

    // إنشاء جلسة مستخدم
    async createUserSession(phoneNumber, pin, authMethod = 'pin') {
        const user = {
            id: this.generateUserId(),
            phone: phoneNumber,
            name: this.extractNameFromPhone(phoneNumber),
            authMethod: authMethod,
            loginTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            sessionId: this.generateSessionId()
        };

        this.currentUser = user;
        this.storeUserSession(user);
        this.updateLastActivity();

        return user;
    }

    // تسجيل الخروج
    logout() {
        this.currentUser = null;
        this.clearUserSession();
        this.clearStoredCredentials();
        
        // إعادة توجيه لشاشة تسجيل الدخول
        if (window.app) {
            window.app.switchScreen('login');
        }
    }

    // التحقق من صحة الجلسة
    isSessionValid() {
        if (!this.currentUser) {
            return false;
        }

        const lastActivity = new Date(this.currentUser.lastActivity);
        const now = new Date();
        const timeDiff = now.getTime() - lastActivity.getTime();

        return timeDiff < this.sessionTimeout;
    }

    // فحص انتهاء الجلسة
    checkSessionExpiry() {
        if (this.currentUser && !this.isSessionValid()) {
            this.showSessionExpiredDialog();
        }
    }

    // عرض حوار انتهاء الجلسة
    showSessionExpiredDialog() {
        if (confirm('انتهت صلاحية الجلسة. هل تريد تسجيل الدخول مرة أخرى؟')) {
            this.logout();
        } else {
            this.logout();
        }
    }

    // تحديث وقت النشاط الأخير
    updateLastActivity() {
        if (this.currentUser) {
            this.currentUser.lastActivity = new Date().toISOString();
            this.storeUserSession(this.currentUser);
        }
    }

    // التحقق من قفل الحساب
    isAccountLocked(phoneNumber) {
        const lockData = this.getLockData(phoneNumber);
        if (!lockData) return false;

        const now = new Date().getTime();
        return now < lockData.lockedUntil;
    }

    // الحصول على الوقت المتبقي للقفل
    getLockoutRemainingTime(phoneNumber) {
        const lockData = this.getLockData(phoneNumber);
        if (!lockData) return 0;

        const now = new Date().getTime();
        return Math.max(0, lockData.lockedUntil - now);
    }

    // تسجيل محاولة فاشلة
    recordFailedAttempt(phoneNumber) {
        const attempts = this.getFailedAttempts(phoneNumber);
        attempts.push(new Date().toISOString());
        
        localStorage.setItem(`failed_attempts_${phoneNumber}`, JSON.stringify(attempts));
    }

    // الحصول على المحاولات الفاشلة
    getFailedAttempts(phoneNumber) {
        const stored = localStorage.getItem(`failed_attempts_${phoneNumber}`);
        return stored ? JSON.parse(stored) : [];
    }

    // الحصول على المحاولات المتبقية
    getRemainingAttempts(phoneNumber) {
        const attempts = this.getFailedAttempts(phoneNumber);
        return Math.max(0, this.maxLoginAttempts - attempts.length);
    }

    // قفل الحساب
    lockAccount(phoneNumber) {
        const lockData = {
            lockedAt: new Date().toISOString(),
            lockedUntil: new Date().getTime() + this.lockoutDuration
        };
        
        localStorage.setItem(`account_lock_${phoneNumber}`, JSON.stringify(lockData));
    }

    // الحصول على بيانات القفل
    getLockData(phoneNumber) {
        const stored = localStorage.getItem(`account_lock_${phoneNumber}`);
        return stored ? JSON.parse(stored) : null;
    }

    // مسح المحاولات الفاشلة
    clearFailedAttempts(phoneNumber) {
        localStorage.removeItem(`failed_attempts_${phoneNumber}`);
        localStorage.removeItem(`account_lock_${phoneNumber}`);
    }

    // التحقق من صحة رقم الهاتف
    validatePhoneNumber(phoneNumber) {
        return /^7[0-9]{8}$/.test(phoneNumber);
    }

    // التحقق من صحة رمز PIN
    validatePin(pin) {
        return /^[0-9]{4,6}$/.test(pin);
    }

    // محاكاة التحقق من البيانات
    async verifyCredentials(phoneNumber, pin) {
        // محاكاة استدعاء API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // في التطبيق الحقيقي، سيتم التحقق من البيانات مع الخادم
        // للتجربة، نقبل أي رقم هاتف صحيح ورمز PIN من 4-6 أرقام
        return this.validatePhoneNumber(phoneNumber) && this.validatePin(pin);
    }

    // فحص دعم المصادقة البيومترية
    isBiometricSupported() {
        return window.PublicKeyCredential && 
               PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable;
    }

    // فحص دعم المصادقة البيومترية
    async checkBiometricSupport() {
        if (this.isBiometricSupported()) {
            try {
                const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                return available;
            } catch (error) {
                console.warn('خطأ في فحص دعم المصادقة البيومترية:', error);
                return false;
            }
        }
        return false;
    }

    // توليد تحدي للمصادقة البيومترية
    generateChallenge() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return array;
    }

    // توليد معرف مستخدم
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // توليد معرف جلسة
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // استخراج اسم من رقم الهاتف
    extractNameFromPhone(phoneNumber) {
        return `مستخدم ${phoneNumber.substr(-4)}`;
    }

    // حفظ جلسة المستخدم
    storeUserSession(user) {
        localStorage.setItem('unifiedWallet_session', JSON.stringify(user));
    }

    // تحميل جلسة المستخدم
    loadStoredSession() {
        const stored = localStorage.getItem('unifiedWallet_session');
        if (stored) {
            const user = JSON.parse(stored);
            if (this.isSessionValid()) {
                this.currentUser = user;
                return user;
            } else {
                this.clearUserSession();
            }
        }
        return null;
    }

    // مسح جلسة المستخدم
    clearUserSession() {
        localStorage.removeItem('unifiedWallet_session');
    }

    // حفظ بيانات البصمة
    storeBiometricCredential() {
        if (this.biometricCredential) {
            localStorage.setItem('unifiedWallet_biometric', JSON.stringify(this.biometricCredential));
        }
    }

    // تحميل بيانات البصمة
    loadStoredCredentials() {
        const stored = localStorage.getItem('unifiedWallet_biometric');
        if (stored) {
            this.biometricCredential = JSON.parse(stored);
        }
    }

    // مسح بيانات البصمة
    clearStoredCredentials() {
        localStorage.removeItem('unifiedWallet_biometric');
        this.biometricCredential = null;
    }

    // الحصول على المستخدم المحفوظ
    getStoredUser() {
        const stored = localStorage.getItem('unifiedWallet_user');
        return stored ? JSON.parse(stored) : null;
    }

    // الحصول على المستخدم الحالي
    getCurrentUser() {
        return this.currentUser;
    }

    // التحقق من تسجيل الدخول
    isLoggedIn() {
        return this.currentUser !== null && this.isSessionValid();
    }
}

// تصدير الكلاس للاستخدام في التطبيق الرئيسي
window.AuthenticationManager = AuthenticationManager;
