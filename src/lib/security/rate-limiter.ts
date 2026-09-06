// 🛡️ جدار حماية محاولات تسجيل الدخول ضد التخمين والهجمات المكررة (Zero Trust Rate Limiter)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان

// 📊 واجهة سجل تتبع محاولات الدخول للحساب الواحد أو الجهاز
export interface RateLimitRecord {
  attempts: number;        // 🔢 عدد المحاولات الفاشلة المسجلة
  lastAttemptTime: number; // ⏰ توقيت آخر محاولة فاشلة
  lockedUntil: number;     // ⏳ وقت انتهاء الحظر المؤقت (صفر إذا لم يكن محظوراً)
}

// ⚙️ إعدادات جدار الحماية الصارم ضد الهجمات
const MAX_ALLOWED_ATTEMPTS = 15;         // 🛑 سقف محاولات واسع لمنع القفل أثناء التجارب
const LOCKOUT_DURATION_MS = 1 * 60 * 1000; // ⏳ مدة القفل المؤقت: 1 دقيقة
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;   // ⏱️ نافذة حساب المحاولات: 15 دقيقة

// 🔑 بادئة مفاتيح التخزين لجدار الحماية
const STORAGE_PREFIX = 'sadiq_rl_';

// 🧹 دالة تنظيف وتوحيد مفتاح الحساب (Identifier Sanitizer)
function getSafeKey(identifier: string): string {
  const clean = identifier.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, ''); // 🧹 إزالة الرموز الغريبة
  return `${STORAGE_PREFIX}${clean || 'anon'}`; // 🏷️ إرجاع المفتاح المحصن
}

// 🔍 دالة قراءة سجل المحاولات للمستخدم
function getRecord(identifier: string): RateLimitRecord {
  if (typeof window === 'undefined') {
    return { attempts: 0, lastAttemptTime: 0, lockedUntil: 0 };
  }

  const key = getSafeKey(identifier); // 🔑 تجهيز المفتاح
  const raw = localStorage.getItem(key); // 📥 قراءة السجل من التخزين
  if (!raw) {
    return { attempts: 0, lastAttemptTime: 0, lockedUntil: 0 };
  }

  try {
    const record = JSON.parse(raw) as RateLimitRecord;
    const now = Date.now();

    // 🔄 إذا انتهت مدة الحظر وانقضت نافذة المحاولات، يتم تصفير العداد تلقائياً
    if (now > record.lockedUntil && (now - record.lastAttemptTime > ATTEMPT_WINDOW_MS)) {
      localStorage.removeItem(key);
      return { attempts: 0, lastAttemptTime: 0, lockedUntil: 0 };
    }

    return record;
  } catch {
    return { attempts: 0, lastAttemptTime: 0, lockedUntil: 0 };
  }
}

// 💾 دالة حفظ السجل في التخزين
function saveRecord(identifier: string, record: RateLimitRecord): void {
  if (typeof window === 'undefined') return;
  const key = getSafeKey(identifier);
  localStorage.setItem(key, JSON.stringify(record));
}

// 🛡️ 1. دالة فحص حالة الحساب قبل محاولة تسجيل الدخول (Check Rate Limit)
export function checkRateLimit(identifier: string): {
  isAllowed: boolean;
  remainingAttempts: number;
  lockoutRemainingSeconds: number;
  message?: string
} {
  const record = getRecord(identifier);
  const now = Date.now();

  // 🛑 فحص هل الحساب واقع تحت الحظر المؤقت
  if (record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    const minutes = Math.ceil(remainingSeconds / 60);
    return {
      isAllowed: false,
      remainingAttempts: 0,
      lockoutRemainingSeconds: remainingSeconds,
      message: `تم قفل محاولات تسجيل الدخول مؤقتاً لأسباب أمنية بسبب تكرار الأخطاء. يرجى الانتظار ${minutes} دقيقة والمحاولة مجدداً.`,
    };
  }

  // 🔢 حساب المحاولات المتبقية
  const remaining = Math.max(0, MAX_ALLOWED_ATTEMPTS - record.attempts);

  return {
    isAllowed: true,
    remainingAttempts: remaining,
    lockoutRemainingSeconds: 0,
  };
}

// 🚨 2. دالة تسجيل محاولة دخول فاشلة وتطبيق العقوبات التدريجية (Record Failed Attempt)
export function recordFailedAttempt(identifier: string): {
  remainingAttempts: number;
  isLocked: boolean;
  lockoutSeconds: number;
  warningMessage?: string
} {
  const record = getRecord(identifier);
  const now = Date.now();

  record.attempts += 1; // ➕ زيادة عدد المحاولات الفاشلة
  record.lastAttemptTime = now; // ⏰ تحديث وقت المحاولة

  // 🛑 إذا وصل أو تجاوز الحد الأقصى للمحاولات الفاشلة -> قفل فوري للمدة المحددة
  if (record.attempts >= MAX_ALLOWED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS; // ⏳ تسجيل وقت انتهاء القفل
    saveRecord(identifier, record); // 💾 حفظ القفل بالتخزين
    const lockMinutes = Math.ceil(LOCKOUT_DURATION_MS / (60 * 1000)); // ⏱️ حساب الدقائق المتبقية ديناميكياً
    return {
      remainingAttempts: 0,
      isLocked: true,
      lockoutSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      warningMessage: `تم قفل الدخول لهذا الحساب مؤقتاً لمدة ${lockMinutes} دقيقة لحماية بياناتك من محاولات التخمين.`,
    };
  }

  // 💾 حفظ السجل المحدث
  saveRecord(identifier, record);
  const remaining = MAX_ALLOWED_ATTEMPTS - record.attempts;

  // ⚠️ إظهار تحذير تدريجي عند تبقي محاولتين أو أقل
  let warningMessage: string | undefined;
  if (remaining <= 2) {
    warningMessage = `تنبيه أمني: تبقى لديك (${remaining}) محاولات فقط قبل قفل الحساب مؤقتاً!`;
  }

  return {
    remainingAttempts: remaining,
    isLocked: false,
    lockoutSeconds: 0,
    warningMessage,
  };
}

// ✅ 3. دالة تصفير عداد المحاولات عند تسجيل الدخول بنجاح (Reset Rate Limit)
export function resetRateLimit(identifier: string): void {
  if (typeof window === 'undefined') return;
  const key = getSafeKey(identifier);
  localStorage.removeItem(key); // 🧹 مسح سجل المحاولات بعد النجاح
}
