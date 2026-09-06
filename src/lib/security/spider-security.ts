// 🕷️ محرك تقنية العنكبوت الأمني الاستباقية ومصائد الهوني بوت (Spider Security Web Defense Engine)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { logSecurityEvent } from './audit-guardian'; // 📊 تسجيل الإنذارات في سجل الرقابة

// 🪤 أسماء حقول مصائد الهوني بوت الخفية (Invisible Honeypot Trap Constants)
export const SPIDER_HONEYPOT_FIELD = '_spider_trap_val';      // 🍯 الحقل الوهمي الخفي
export const SPIDER_TIMESTAMP_FIELD = '_spider_trap_stamp';   // ⏱️ طابع التوقيت لكشف السرعة الخارقة للبوتات

// 🤖 تواقيع عناكب الزحف وأدوات الكشط الآلي المحظورة (Bad Bot & Scraper Signatures)
const BAD_SPIDER_USER_AGENTS = [
  /python-requests/i,
  /scrapy/i,
  /sqlmap/i,
  /nikto/i,
  /dirbuster/i,
  /gobuster/i,
  /wpscan/i,
  /curl\//i,
  /wget\//i,
  /headlesschrome/i,
  /puppeteer/i,
  /phantomjs/i,
  /selenium/i,
  /postmanruntime/i,
  /bot\/(?:0|1|2|3)/i,
];

// 🟢 العناكب ومحركات البحث الرسمية المسموح بها (Good Crawlers Whitelist)
const GOOD_SEARCH_CRAWLERS = [
  /googlebot/i,
  /bingbot/i,
  /applebot/i,
  /duckduckbot/i,
];

// 🎛️ مستويات التهديد التراكمي في شبكة العنكبوت الأمني
export type SpiderThreatLevel = 'NORMAL' | 'ELEVATED' | 'SEVERE' | 'QUARANTINE';

// 📊 مصفوفة تقييم التهديدات لجلسات المستخدمين
const sessionThreatScores = new Map<string, number>();

// 📈 إحصائيات شبكة العنكبوت الأمني اللحظية
let totalHoneypotsTriggered = 0;
let totalBadBotsIntercepted = 0;
let totalDomMutationsBlocked = 0;

// 🔍 واجهة نتيجة فحص فخ الهوني بوت
export interface HoneypotCheckResult {
  isSafe: boolean;              // 🛡️ هل النموذج بشري وآمن
  isTrapped: boolean;           // 🪤 هل سقط في فخ العنكبوت
  threatScoreDelta: number;     // 📈 مقدار زيادة التهديد
  reason?: string;              // 📝 تفاصيل كشف الفخ
}

// 🚀 1. دالة فحص وتدقيق مصائد الهوني بوت في النماذج (Validate Honeypot)
export function validateHoneypot(
  formData: Record<string, string | number | boolean | null | undefined | object>,
  context: { actorEmail?: string; formName?: string } = {}
): HoneypotCheckResult {
  const trapValue = formData[SPIDER_HONEYPOT_FIELD];
  const timestampValue = formData[SPIDER_TIMESTAMP_FIELD];
  const now = Date.now();

  // 🪤 1. فحص هل قام البوت بتعبئة الحقل الخفي
  if (trapValue !== undefined && trapValue !== null && String(trapValue).trim() !== '') {
    totalHoneypotsTriggered++;

    // 🚨 تم اصطياد بوت زاحف في الفخ!
    logSecurityEvent({
      eventType: 'HONEYPOT_TRAP_TRIGGERED',
      actorEmail: context.actorEmail,
      targetEntity: context.formName || 'نموذج إدخال',
      details: `🕷️ سقط بوت كشط آلي في فخ الهوني بوت [${SPIDER_HONEYPOT_FIELD}] في نموذج [${context.formName || 'عام'}]. القيمة المحقونة: "${String(trapValue).substring(0, 50)}"`,
      severity: 'CRITICAL',
    });

    return {
      isSafe: false,
      isTrapped: true,
      threatScoreDelta: 50,
      reason: 'تم اصطياد نشاط كشط آلي مشبوه (Spider Honeypot Trap Triggered).',
    };
  }

  // ⏱️ 2. فحص سرعة الإرسال الخارقة غير البشرية (Bot Submitting in < 400ms)
  if (typeof timestampValue === 'number' || (typeof timestampValue === 'string' && !isNaN(Number(timestampValue)))) {
    const elapsed = now - Number(timestampValue);
    if (elapsed > 0 && elapsed < 400) {
      totalHoneypotsTriggered++;

      logSecurityEvent({
        eventType: 'HONEYPOT_TRAP_TRIGGERED',
        actorEmail: context.actorEmail,
        targetEntity: context.formName || 'نموذج إدخال',
        details: `⚡ تم كشف إرسال نموذج فائق السرعة بشكل غير بشري (${elapsed}ms) من قبل بوت آلي.`,
        severity: 'HIGH',
      });

      return {
        isSafe: false,
        isTrapped: true,
        threatScoreDelta: 30,
        reason: 'تم كشف إرسال آلي فائق السرعة غير مطابق للسلوك البشري.',
      };
    }
  }

  return {
    isSafe: true,
    isTrapped: false,
    threatScoreDelta: 0,
  };
}

// 🤖 2. دالة كشف وتدقيق عناكب الزحف والبوتات المشبوهة (Detect Bad Bot / Spider)
export function detectBadBotSpider(
  userAgent: string | undefined | null,
  context: { actorEmail?: string; path?: string } = {}
): { isBadBot: boolean; botName?: string; isGoodBot: boolean } {
  if (!userAgent || typeof userAgent !== 'string') {
    return { isBadBot: false, isGoodBot: false };
  }

  const ua = userAgent.trim();

  // 🟢 1. فحص هل هو محرك بحث عالمي موثوق
  for (const goodPattern of GOOD_SEARCH_CRAWLERS) {
    if (goodPattern.test(ua)) {
      return { isBadBot: false, isGoodBot: true, botName: 'SearchEngineBot' };
    }
  }

  // 🔴 2. فحص هل يطابق أداة كشط أو فحص ثغرات
  for (const badPattern of BAD_SPIDER_USER_AGENTS) {
    if (badPattern.test(ua)) {
      totalBadBotsIntercepted++;

      // 🚨 تدوين إنذار فوري
      logSecurityEvent({
        eventType: 'BAD_BOT_DETECTED',
        actorEmail: context.actorEmail,
        targetEntity: context.path || 'مسار النظام',
        details: `🕷️ تم كشف واعتراض عنكبوت كشط أو أداة فحص ثغرات محظورة (${ua.substring(0, 60)}) في المسار [${context.path || '/'}].`,
        severity: 'CRITICAL',
      });

      return {
        isBadBot: true,
        isGoodBot: false,
        botName: ua.substring(0, 40),
      };
    }
  }

  return { isBadBot: false, isGoodBot: false };
}

// 👁️ 3. دالة تسجيل محاولة تلاعب بشجرة عناصر الـ DOM
export function registerDomTamperingEvent(fieldName: string, actorEmail?: string): void {
  totalDomMutationsBlocked++;

  logSecurityEvent({
    eventType: 'DOM_TAMPERING_DETECTED',
    actorEmail,
    targetEntity: fieldName,
    details: `🚨 تم كشف واعتراض محاولة إزالة القفل أو التلاعب بخصائص حقل [${fieldName}] عبر أدوات المطورين (DOM Tampering Attack). تم إعادة القفل وحماية الدرجة فوراً.`,
    severity: 'CRITICAL',
  });
}

// 📈 4. دالة تحديث واستخراج مستوى التهديد التراكمي للجلسة (Threat Level Mesh)
export function getSessionThreatLevel(identifier: string): SpiderThreatLevel {
  const score = sessionThreatScores.get(identifier) || 0;
  if (score >= 80) return 'QUARANTINE';
  if (score >= 45) return 'SEVERE';
  if (score >= 20) return 'ELEVATED';
  return 'NORMAL';
}

export function escalateThreatScore(identifier: string, delta: number): SpiderThreatLevel {
  const current = sessionThreatScores.get(identifier) || 0;
  const newScore = Math.min(100, current + delta);
  sessionThreatScores.set(identifier, newScore);
  return getSessionThreatLevel(identifier);
}

// 📊 5. دالة جلب مقاييس ومؤشرات رادار شبكة العنكبوت الأمني للوحة التحكم
export function getSpiderRadarMetrics(): {
  activeHoneypots: number;
  trappedBotsCount: number;
  blockedDomMutations: number;
  overallThreatLevel: SpiderThreatLevel;
  spiderWebIntegrity: number;
} {
  const totalIncidents = totalHoneypotsTriggered + totalBadBotsIntercepted + totalDomMutationsBlocked;
  
  let overallThreat: SpiderThreatLevel = 'NORMAL';
  if (totalIncidents > 20) overallThreat = 'SEVERE';
  else if (totalIncidents > 5) overallThreat = 'ELEVATED';

  // حساب نسبة تكامل وسلامة شبكة العنكبوت (من 95% إلى 100%)
  const integrity = Math.max(92, 100 - (totalIncidents * 0.5));

  return {
    activeHoneypots: 12, // عدد أفخاخ الهوني بوت المزروعة في النماذج
    trappedBotsCount: totalHoneypotsTriggered + totalBadBotsIntercepted,
    blockedDomMutations: totalDomMutationsBlocked,
    overallThreatLevel: overallThreat,
    spiderWebIntegrity: Math.round(integrity * 10) / 10,
  };
}
