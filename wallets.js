// إدارة المحافظ الإلكترونية
class WalletManager {
    constructor() {
        this.supportedWallets = {
            jawali: {
                id: 'jawali',
                name: 'جوالي',
                nameEn: 'Jawali',
                provider: 'WeCash YE',
                packageId: 'com.ama.wecashmobileapp',
                icon: 'https://play-lh.googleusercontent.com/NuKV_Snecpx633RHzIWvFauG32WBAk-jt3lcZOajw2w7VD8Hdt8h5Lb0pYLopB_Qk4Y=w240-h480',
                color: '#4361ee',
                features: ['transfer', 'bills', 'recharge', 'qr'],
                supportedCurrencies: ['YER', 'SAR', 'USD'],
                maxTransfer: 3000000,
                fees: {
                    transfer: 20,
                    billPayment: 15,
                    recharge: 10
                }
            },
            onecash: {
                id: 'onecash',
                name: 'ONE Cash',
                nameEn: 'ONE Cash',
                provider: 'ONECASHYE',
                packageId: 'com.one.onecustomer',
                icon: 'https://play-lh.googleusercontent.com/OF2xMRUmNH47BIaOTbv7GgvmLRTQbT1xHkFF_Ocswx6Jq5gfX4VlfAl_275UmjH2pg=w240-h480',
                color: '#059669',
                features: ['transfer', 'bills', 'recharge', 'qr', 'international'],
                supportedCurrencies: ['YER', 'SAR', 'USD'],
                maxTransfer: 3000000,
                fees: {
                    transfer: 0, // مجاني للمستخدمين
                    billPayment: 10,
                    recharge: 5
                }
            },
            cash: {
                id: 'cash',
                name: 'Cash',
                nameEn: 'Cash',
                provider: 'Tamkeen Financial',
                packageId: 'com.tamkeen.sms',
                icon: 'https://play-lh.googleusercontent.com/zkV8HeO6iF2xa77ObHdKfAXfrfjU5fgWB0XsWt7_DmG4VGSKob2jU_CrqWyKQtghQyE=w240-h480',
                color: '#dc2626',
                features: ['transfer', 'bills', 'recharge', 'qr', 'offline'],
                supportedCurrencies: ['YER'],
                maxTransfer: 2000000,
                fees: {
                    transfer: 25,
                    billPayment: 20,
                    recharge: 15
                }
            },
            jaib: {
                id: 'jaib',
                name: 'Jaib',
                nameEn: 'Jaib Digital Wallet',
                provider: 'AHD Financial',
                packageId: 'com.ahd.jaib',
                icon: 'https://play-lh.googleusercontent.com/EAaXnjh1FVPYpI5qWZwWvZIV5oD1hm9auDX0owOgREBjMAzYKX9od1USWRzlXIhRvKMx=w240-h480',
                color: '#7c3aed',
                features: ['transfer', 'bills', 'recharge', 'qr', 'entertainment'],
                supportedCurrencies: ['YER'],
                maxTransfer: 1500000,
                fees: {
                    transfer: 15,
                    billPayment: 12,
                    recharge: 8
                }
            },
            mfloos: {
                id: 'mfloos',
                name: 'mFloos',
                nameEn: 'mFloos - Customers',
                provider: 'Alkuraimi Islamic Microfinance Bank',
                packageId: 'wallet.mfloos.com.mflooswallet.customer',
                icon: 'https://play-lh.googleusercontent.com/mNvakjEk-3VX7icU5w4xmAhT4MQgGAGcQYpRvPkBLVTzD-sYnmzAH_wuglMujTsaqQ=w240-h480',
                color: '#0891b2',
                features: ['transfer', 'bills', 'recharge', 'banking'],
                supportedCurrencies: ['YER'],
                maxTransfer: 1000000,
                fees: {
                    transfer: 10,
                    billPayment: 8,
                    recharge: 5
                }
            },
            mobilemoney: {
                id: 'mobilemoney',
                name: 'Mobile Money',
                nameEn: 'Mobile Money Wallet',
                provider: 'CAC Bank',
                packageId: 'cac.mobilemoney.app',
                icon: 'https://play-lh.googleusercontent.com/51r7PLMlK0gVvITgOoJ7BnGX-9Gq3_ayiSiHHxSDbJZPCgABXI_LnU6jNCHAefWHvSPV=w240-h480',
                color: '#ea580c',
                features: ['transfer', 'bills', 'recharge', 'atm'],
                supportedCurrencies: ['YER'],
                maxTransfer: 2500000,
                fees: {
                    transfer: 18,
                    billPayment: 15,
                    recharge: 12
                }
            }
        };

        this.userWallets = [];
        this.init();
    }

    // تهيئة مدير المحافظ
    init() {
        this.loadUserWallets();
    }

    // تحميل محافظ المستخدم
    loadUserWallets() {
        const savedWallets = localStorage.getItem('unifiedWallet_userWallets');
        if (savedWallets) {
            this.userWallets = JSON.parse(savedWallets);
        }
    }

    // حفظ محافظ المستخدم
    saveUserWallets() {
        localStorage.setItem('unifiedWallet_userWallets', JSON.stringify(this.userWallets));
    }

    // إضافة محفظة جديدة
    async addWallet(walletId, accountNumber, pin) {
        const walletInfo = this.supportedWallets[walletId];
        if (!walletInfo) {
            throw new Error('محفظة غير مدعومة');
        }

        // التحقق من صحة البيانات
        if (!this.validateAccountNumber(accountNumber)) {
            throw new Error('رقم الحساب غير صحيح');
        }

        if (!this.validatePin(pin)) {
            throw new Error('رمز PIN غير صحيح');
        }

        // التحقق من عدم وجود المحفظة مسبقاً
        const existingWallet = this.userWallets.find(w => w.id === walletId);
        if (existingWallet) {
            throw new Error('هذه المحفظة مضافة مسبقاً');
        }

        // محاكاة التحقق من المحفظة
        await this.verifyWalletCredentials(walletId, accountNumber, pin);

        // إضافة المحفظة
        const newWallet = {
            id: walletId,
            accountNumber: accountNumber,
            pin: this.encryptPin(pin),
            balance: await this.fetchWalletBalance(walletId, accountNumber),
            status: 'active',
            addedAt: new Date().toISOString(),
            lastSync: new Date().toISOString()
        };

        this.userWallets.push(newWallet);
        this.saveUserWallets();

        return newWallet;
    }

    // إزالة محفظة
    removeWallet(walletId) {
        const index = this.userWallets.findIndex(w => w.id === walletId);
        if (index === -1) {
            throw new Error('المحفظة غير موجودة');
        }

        this.userWallets.splice(index, 1);
        this.saveUserWallets();
    }

    // تحديث رصيد محفظة
    async updateWalletBalance(walletId) {
        const wallet = this.userWallets.find(w => w.id === walletId);
        if (!wallet) {
            throw new Error('المحفظة غير موجودة');
        }

        const newBalance = await this.fetchWalletBalance(walletId, wallet.accountNumber);
        wallet.balance = newBalance;
        wallet.lastSync = new Date().toISOString();
        
        this.saveUserWallets();
        return newBalance;
    }

    // تحديث جميع الأرصدة
    async updateAllBalances() {
        const updatePromises = this.userWallets.map(wallet => 
            this.updateWalletBalance(wallet.id)
        );

        await Promise.all(updatePromises);
    }

    // تنفيذ تحويل
    async executeTransfer(fromWalletId, toWalletId, amount, recipientNumber, pin) {
        const fromWallet = this.userWallets.find(w => w.id === fromWalletId);
        if (!fromWallet) {
            throw new Error('محفظة المرسل غير موجودة');
        }

        const fromWalletInfo = this.supportedWallets[fromWalletId];
        const toWalletInfo = this.supportedWallets[toWalletId];

        // التحقق من الرصيد
        const fee = fromWalletInfo.fees.transfer;
        const totalAmount = amount + fee;

        if (fromWallet.balance < totalAmount) {
            throw new Error('الرصيد غير كافي');
        }

        // التحقق من الحد الأقصى للتحويل
        if (amount > fromWalletInfo.maxTransfer) {
            throw new Error(`الحد الأقصى للتحويل هو ${fromWalletInfo.maxTransfer.toLocaleString()} ر.ي`);
        }

        // التحقق من رمز PIN
        if (!this.verifyPin(pin, fromWallet.pin)) {
            throw new Error('رمز PIN غير صحيح');
        }

        // تنفيذ التحويل
        await this.processTransfer({
            fromWallet: fromWalletId,
            toWallet: toWalletId,
            amount: amount,
            fee: fee,
            recipientNumber: recipientNumber,
            timestamp: new Date().toISOString()
        });

        // تحديث الرصيد
        fromWallet.balance -= totalAmount;
        this.saveUserWallets();

        return {
            success: true,
            transactionId: this.generateTransactionId(),
            amount: amount,
            fee: fee,
            total: totalAmount,
            newBalance: fromWallet.balance
        };
    }

    // دفع فاتورة
    async payBill(walletId, billType, billNumber, amount, pin) {
        const wallet = this.userWallets.find(w => w.id === walletId);
        if (!wallet) {
            throw new Error('المحفظة غير موجودة');
        }

        const walletInfo = this.supportedWallets[walletId];
        const fee = walletInfo.fees.billPayment;
        const totalAmount = amount + fee;

        if (wallet.balance < totalAmount) {
            throw new Error('الرصيد غير كافي');
        }

        if (!this.verifyPin(pin, wallet.pin)) {
            throw new Error('رمز PIN غير صحيح');
        }

        // تنفيذ دفع الفاتورة
        await this.processBillPayment({
            wallet: walletId,
            billType: billType,
            billNumber: billNumber,
            amount: amount,
            fee: fee,
            timestamp: new Date().toISOString()
        });

        wallet.balance -= totalAmount;
        this.saveUserWallets();

        return {
            success: true,
            transactionId: this.generateTransactionId(),
            amount: amount,
            fee: fee,
            total: totalAmount,
            newBalance: wallet.balance
        };
    }

    // شحن رصيد
    async rechargeBalance(walletId, phoneNumber, amount, pin) {
        const wallet = this.userWallets.find(w => w.id === walletId);
        if (!wallet) {
            throw new Error('المحفظة غير موجودة');
        }

        const walletInfo = this.supportedWallets[walletId];
        const fee = walletInfo.fees.recharge;
        const totalAmount = amount + fee;

        if (wallet.balance < totalAmount) {
            throw new Error('الرصيد غير كافي');
        }

        if (!this.verifyPin(pin, wallet.pin)) {
            throw new Error('رمز PIN غير صحيح');
        }

        // تنفيذ شحن الرصيد
        await this.processRecharge({
            wallet: walletId,
            phoneNumber: phoneNumber,
            amount: amount,
            fee: fee,
            timestamp: new Date().toISOString()
        });

        wallet.balance -= totalAmount;
        this.saveUserWallets();

        return {
            success: true,
            transactionId: this.generateTransactionId(),
            amount: amount,
            fee: fee,
            total: totalAmount,
            newBalance: wallet.balance
        };
    }

    // الحصول على معلومات محفظة
    getWalletInfo(walletId) {
        return this.supportedWallets[walletId];
    }

    // الحصول على محافظ المستخدم
    getUserWallets() {
        return this.userWallets.map(userWallet => {
            const walletInfo = this.supportedWallets[userWallet.id];
            return {
                ...walletInfo,
                ...userWallet,
                accountNumber: userWallet.accountNumber
            };
        });
    }

    // التحقق من صحة رقم الحساب
    validateAccountNumber(accountNumber) {
        return /^[0-9]{9}$/.test(accountNumber);
    }

    // التحقق من صحة رمز PIN
    validatePin(pin) {
        return /^[0-9]{4,6}$/.test(pin);
    }

    // تشفير رمز PIN
    encryptPin(pin) {
        // تشفير بسيط للتجربة - في الإنتاج يجب استخدام تشفير قوي
        return btoa(pin);
    }

    // فك تشفير رمز PIN
    decryptPin(encryptedPin) {
        return atob(encryptedPin);
    }

    // التحقق من رمز PIN
    verifyPin(pin, encryptedPin) {
        return pin === this.decryptPin(encryptedPin);
    }

    // توليد معرف معاملة
    generateTransactionId() {
        return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }

    // محاكاة التحقق من بيانات المحفظة
    async verifyWalletCredentials(walletId, accountNumber, pin) {
        // محاكاة استدعاء API للتحقق
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // في التطبيق الحقيقي، سيتم التحقق من البيانات مع خوادم المحفظة
        return true;
    }

    // محاكاة جلب رصيد المحفظة
    async fetchWalletBalance(walletId, accountNumber) {
        // محاكاة استدعاء API لجلب الرصيد
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // إرجاع رصيد عشوائي للتجربة
        return Math.floor(Math.random() * 50000) + 1000;
    }

    // محاكاة تنفيذ التحويل
    async processTransfer(transferData) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        // في التطبيق الحقيقي، سيتم إرسال البيانات لخوادم المحفظة
        console.log('تم تنفيذ التحويل:', transferData);
    }

    // محاكاة دفع الفاتورة
    async processBillPayment(billData) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('تم دفع الفاتورة:', billData);
    }

    // محاكاة شحن الرصيد
    async processRecharge(rechargeData) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('تم شحن الرصيد:', rechargeData);
    }
}

// تصدير الكلاس للاستخدام في التطبيق الرئيسي
window.WalletManager = WalletManager;
