// 🛡️ حارس ومكتشف محاولات حجب الخدمة ومحدد معدل الطلبات الذكي (DDoS & Rate Limiting Sentinel)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { logSecurityEvent } from './audit-guardian'; // 📊 تسجيل الإنذارات الأمنية

// 📊 مستويات وتصنيفات سقف الطلبات المسموح بها (Rate Limit Tiers)
export type RateLimitTier = 'AUTH_VERIFY' | 'HEAVY_COMPUTE' | 'STANDARD_API' | 'SEARCH_QUERY';

// ⚙️ إعدادات وتكوينات المستويات (نافذة زمنية بالملي ثانية + الحد الأقصى)
const TIER_CONFIGS: Record<RateLimitTier, { windowMs: number; maxRequests: number; burstThreshold: number }> = {
  // 🔐 1. بوابات تسجيل الدخول والتحقق من الوثائق (25 طلب / دقيقة)
  AUTH_VERIFY: { windowMs: 60 * 1000, maxRequests: 25, burstThreshold: 10 },
  
  // 📄 2. العمليات الحسابية الثقيلة وتصدير الـ PDF والإكسل (8 طلبات / دقيقة)
  HEAVY_COMPUTE: { windowMs: 60 * 1000, maxRequests: 8, burstThreshold: 3 },
  
  // 🔍 3. استعلامات البحث الأكاديمي (40 طلب / دقيقة)
  SEARCH_QUERY: { windowMs: 60 * 1000, maxRequests: 40, burstThreshold: 15 },
  
  // 📊 4. تصفح لوحات التحكم والاستعلامات العامة (120 طلب / دقيقة)
  STANDARD_API: { windowMs: 60 * 1000, maxRequests: 120, burstThreshold: 40 },
};

// ⏳ مدة الحظر المؤقت في سجن الآي بي (5 دقائق)
const JAIL_DURATION_MS = 5 * 60 * 1000;

// 💾 سجلات الطلبات في الذاكرة (In-Memory Sliding Window Log)
const requestLogs = new Map<string, number[]>();

// 🚫 مصفوفة الحظر المؤقت (Jailed Clients Map: identifier -> unbanTimestamp)
const jailedClients = new Map<string, number>();

// 🔍 واجهة نتيجة فحص معدل الطلبات
export interface RateLimitCheckResult {
  allowed: boolean;              // 🛡️ هل يسمح بالطلب
  remaining: number;             // 🔢 الطلبات المتبقية في النافذة الحالية
  resetSeconds: number;          // ⏳ ثواني التصفير للنافذة
  isJailed: boolean;             // 🚨 هل العميل في قائمة الحظر المؤقت
  jailRemainingSeconds?: number; // ⏳ ثواني الحظر المتبقية
  reason?: string;               // 📝 سبب الرفض إن وجد
}

// 🚀 1. دالة فحص وتدقيق معدل الطلبات اللحظي (Check Rate Limit)
export function checkRateLimit(
  rawIdentifier: string | undefined | null,
  tier: RateLimitTier = 'STANDARD_API'
): RateLimitCheckResult {
  const now = Date.now();
  const identifier = (rawIdentifier && rawIdentifier.trim()) || getClientFingerprintFallback();
  const config = TIER_CONFIGS[tier];

  // 🛑 1. فحص هل العميل محظور مؤقتاً في السجن الأمني
  const jailExpiry = jailedClients.get(identifier);
  if (jailExpiry) {
    if (now < jailExpiry) {
      const jailRemainingSeconds = Math.ceil((jailExpiry - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetSeconds: jailRemainingSeconds,
        isJailed: true,
        jailRemainingSeconds,
        reason: `تم تقييد الوصول مؤقتاً لحماية النظام من إغراق الطلبات (DDoS Protection). يرجى الانتظار ${jailRemainingSeconds} ثانية.`,
      };
    } else {
      // انتهت مدة الحظر المؤقت
      jailedClients.delete(identifier);
    }
  }

  // 🧹 2. جلب وتحديث سجل الطلبات للنافذة المنزلقة (Sliding Window Log)
  const windowStart = now - config.windowMs;
  const history = requestLogs.get(identifier) || [];
  const validHistory = history.filter((timestamp) => timestamp > windowStart);

  // 🔍 3. فحص الإغراق اللحظي السريع (Burst Rate Detection: أكثر من سقف الـ burst في 3 ثوانٍ)
  const recentBurstCount = validHistory.filter((timestamp) => timestamp > now - 3000).length;
  if (recentBurstCount >= config.burstThreshold) {
    // 🚨 تفعيل الحظر المؤقت الفوري للعميل
    const unbanAt = now + JAIL_DURATION_MS;
    jailedClients.set(identifier, unbanAt);

    // 📊 تسجيل إنذار أمني خطير
    logSecurityEvent({
      eventType: 'DDOS_ATTACK_ATTEMPT',
      targetEntity: `RateLimit [${tier}]`,
      details: `🚨 تم كشف واعتراض هجوم إغراق سريع (DDoS Burst Attack) من المعرف [${identifier}]. تم حظر العميل مؤقتاً لمدة 5 دقائق.`,
      severity: 'CRITICAL',
    });

    return {
      allowed: false,
      remaining: 0,
      resetSeconds: Math.ceil(JAIL_DURATION_MS / 1000),
      isJailed: true,
      jailRemainingSeconds: Math.ceil(JAIL_DURATION_MS / 1000),
      reason: `تم كشف إرسال طلبات متكررة غير طبيعية وتم حظر الوصول مؤقتاً لحماية المنظومة.`,
    };
  }

  // 🛑 4. فحص تجاوز الحد الأقصى للنافذة
  if (validHistory.length >= config.maxRequests) {
    const oldestRequest = validHistory[0] || now;
    const resetSeconds = Math.ceil((oldestRequest + config.windowMs - now) / 1000);

    // تسجيل تحذير أمني
    logSecurityEvent({
      eventType: 'RATE_LIMIT_EXCEEDED',
      targetEntity: `RateLimit [${tier}]`,
      details: `تجاوز العميل [${identifier}] سقف الطلبات المسموح (${config.maxRequests} طلب / دقيقة).`,
      severity: 'MEDIUM',
    });

    return {
      allowed: false,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
      isJailed: false,
      reason: `لقد تجاوزت الحد الأقصى للطلبات المسموح بها (${config.maxRequests} طلب). يرجى الانتظار ${Math.max(1, resetSeconds)} ثانية.`,
    };
  }

  // ✅ 5. الطلب سليم وضمن المعدل الطبيعي -> تسجيل الطابع الزمني
  validHistory.push(now);
  requestLogs.set(identifier, validHistory);

  const remaining = Math.max(0, config.maxRequests - validHistory.length);
  const resetSeconds = Math.ceil(config.windowMs / 1000);

  return {
    allowed: true,
    remaining,
    resetSeconds,
    isJailed: false,
  };
}

// 🔒 6. قفل التزامن الفردي للعمليات الثقيلة (Single-Flight Mutex for Heavy Tasks)
const activeHeavyTasks = new Set<string>();

export function acquireHeavyTaskLock(taskKey: string): boolean {
  if (activeHeavyTasks.has(taskKey)) {
    return false; // العملية قيد التنفيذ حالياً لنفس العميل
  }
  activeHeavyTasks.add(taskKey);
  return true;
}

export function releaseHeavyTaskLock(taskKey: string): void {
  activeHeavyTasks.delete(taskKey);
}

// 🛠️ 7. دالة استخراج بصمة بديلة للعميل في المتصفح
function getClientFingerprintFallback(): string {
  if (typeof window === 'undefined') return 'server-context';
  try {
    const nav = window.navigator;
    const scr = window.screen;
    return `fp-${nav.userAgent.length}-${scr.width}x${scr.height}-${nav.language}`;
  } catch {
    return 'client-fallback';
  }
}
