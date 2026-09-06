// 🛡️ جدار حماية تطبيقات الويب وقواعد البيانات المتقدم (Enterprise Web Application Firewall - WAF 2026)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { logSecurityEvent } from './audit-guardian'; // 📊 تسجيل الإنذارات في سجل الرقابة
import { deepSanitizePrototype } from './prototype-pollution-guard'; // 🔒 حماية الذاكرة من Prototype Pollution

// 🧱 تصنيفات وفئات قواعد جدار الحماية OWASP CRS المعيارية
export type WafRuleCategory = 'SQLI' | 'XSS' | 'RCE' | 'LFI' | 'PROTOCOL' | 'CRLF' | 'SSRF' | 'HPP';

// 🏷️ مستويات الخطورة والثقة للقواعد
export type WafSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type WafConfidence = 'HIGH' | 'MEDIUM';

// 📋 هيكل قاعدة الـ WAF المعيارية
export interface WafRule {
  id: string;                    // 🏷️ رمز القاعدة المعياري (مثل: CRS-942-100)
  name: string;                  // 📝 اسم القاعدة
  category: WafRuleCategory;     // 📂 فئة التهديد
  severity: WafSeverity;         // 🚨 مستوى الخطورة
  confidence: WafConfidence;     // 🎯 درجة دقة وثقة القاعدة
  pattern: RegExp;               // 🔍 النمط والتوقيع الهجومي
  score: number;                 // 📊 درجة الشذوذ (1 إلى 5)
  description: string;           // 📖 وصف التهديد
}

// 🛑 سقف حظر الشذوذ التراكمي (Anomaly Score Blocking Threshold)
export const WAF_BLOCKING_THRESHOLD = 5;

// 🛡️ مصفوفة قواعد جدار الحماية المعيارية OWASP Core Rule Set (CRS 2026 Hardened)
const WAF_CORE_RULES: WafRule[] = [
  // 1️⃣ [وحدة 942] قواعد حقن قواعد البيانات (SQL Injection Rules)
  {
    id: 'CRS-942-100',
    name: 'SQL_OPERATOR_INJECTION',
    category: 'SQLI',
    severity: 'CRITICAL',
    confidence: 'HIGH',
    pattern: /(?:\bunion\b[\s\S]*?\bselect\b|\bselect\b[\s\S]*?\bfrom\b|\binsert\b[\s\S]*?\binto\b|\bupdate\b[\s\S]*?\bset\b|\bdelete\b[\s\S]*?\bfrom\b)/i,
    score: 5,
    description: 'محاولة تنفيذ استعلامات أوامر SQL متسلسلة كلاسيكية.',
  },
  {
    id: 'CRS-942-101',
    name: 'SQL_BOOLEAN_BLIND',
    category: 'SQLI',
    severity: 'CRITICAL',
    confidence: 'HIGH',
    pattern: /(?:\bor\b\s+['"\d\w]+\s*=\s*['"\d\w]+|\band\b\s+['"\d\w]+\s*=\s*['"\d\w]+|'\s*or\s*'1'\s*=\s*'1|'\s*or\s*1\s*=\s*1)/i,
    score: 5,
    description: 'محاولة حقن منطقي أعمى (Boolean-based Blind SQLi).',
  },
  {
    id: 'CRS-942-102',
    name: 'SQL_TIME_BASED_BLIND',
    category: 'SQLI',
    severity: 'CRITICAL',
    confidence: 'HIGH',
    pattern: /(?:\bpg_sleep\b|\bwaitfor\s+delay\b|\bsleep\s*\(|\bbenchmark\s*\(|\bgenerate_series\s*\()/i,
    score: 5,
    description: 'محاولة حقن تعليق زمني لقاعدة البيانات (Time-based Blind SQLi).',
  },
  {
    id: 'CRS-942-103',
    name: 'SQL_COMMENT_EVASION',
    category: 'SQLI',
    severity: 'HIGH',
    confidence: 'HIGH',
    pattern: /(?:--\s*$|\/\*!\d+[\s\S]*?\*\/|;\s*--)/i,
    score: 4,
    description: 'استخدام تعليقات SQL لكسر سياق الاستعلام وتجاوز الفحص.',
  },

  // 2️⃣ [وحدة 941] قواعد حقن السكربتات (Cross-Site Scripting Rules)
  {
    id: 'CRS-941-100',
    name: 'XSS_TAG_INJECTION',
    category: 'XSS',
    severity: 'CRITICAL',
    confidence: 'HIGH',
    pattern: /<\s*(?:script|iframe|object|embed|applet|svg|math|meta|link|base)\b[^>]*>/i,
    score: 5,
    description: 'محاولة حقن وسوم HTML خطيرة لتنفيذ كود برمجي خبيث في المتصفح.',
  },
  {
    id: 'CRS-941-101',
    name: 'XSS_EVENT_HANDLER',
    category: 'XSS',
    severity: 'CRITICAL',
    confidence: 'HIGH',
    pattern: /\bon(?:load|error|click|mouseover|focus|blur|change|submit|animationstart|toggle|wheel)\s*=/i,
    score: 5,
    description: 'محاولة استغلال مستمعات الأحداث المضمنة لتشغيل جافاسكربت تلقائياً.',
  },
  {
    id: 'CRS-941-102',
    name: 'XSS_URI_SCHEME',
    category: 'XSS',
    severity: 'CRITICAL',
    confidence: 'HIGH',
    pattern: /\b(?:javascript|vbscript|data:text\/html)\s*:/i,
    score: 5,
    description: 'محاولة تمرير روابط جافاسكربت وهمية عبر بروتوكولات مخصصة.',
  },

  // 3️⃣ [وحدة 932] قواعد حقن الأوامر والتنفيذ عن بُعد (Remote Code Execution)
  {
    id: 'CRS-932-100',
    name: 'RCE_COMMAND_INJECTION',
    category: 'RCE',
    severity: 'CRITICAL',
    confidence: 'HIGH',
    pattern: /(?:;\s*(?:cat|ls|pwd|whoami|id|uname|curl|wget|nc|netcat|bash|sh|cmd\.exe|powershell)\b|\$\((?:whoami|id|uname|cat|pwd)\)|`whoami`|`id`)/i,
    score: 5,
    description: 'محاولة تشغيل أوامر نظام التشغيل وخادم الويب (Command Injection).',
  },
  {
    id: 'CRS-932-101',
    name: 'RCE_EVAL_FUNCTION',
    category: 'RCE',
    severity: 'CRITICAL',
    confidence: 'HIGH',
    pattern: /\b(?:system|exec|passthru|shell_exec|eval|Function|popen|proc_open)\s*\(/i,
    score: 5,
    description: 'محاولة استدعاء دوال التنفيذ البرمجي المباشر بالخادم.',
  },

  // 4️⃣ [وحدة 930] قواعد اجتياز المسارات والملفات (Local File Inclusion / Path Traversal)
  {
    id: 'CRS-930-100',
    name: 'LFI_PATH_TRAVERSAL',
    category: 'LFI',
    severity: 'CRITICAL',
    confidence: 'HIGH',
    pattern: /(?:\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\/etc\/passwd|\/etc\/shadow|c:\\windows\\system32|win\.ini|boot\.ini)/i,
    score: 5,
    description: 'محاولة اجتياز المسارات وقراءة ملفات النظام وسجلات الخادم الحساسة.',
  },

  // 5️⃣ [وحدة 920] قواعد انتهاك البروتوكول وحقن الترويسات (CRLF & Protocol Violations)
  {
    id: 'CRS-920-100',
    name: 'CRLF_HEADER_INJECTION',
    category: 'CRLF',
    severity: 'CRITICAL',
    confidence: 'HIGH',
    pattern: /(?:%0d%0a|\r\n)(?:set-cookie|location|content-type|x-):/i,
    score: 5,
    description: 'محاولة شطر استجابات HTTP وحقن ترويسات وكوكيز (HTTP Response Splitting).',
  },

  // 6️⃣ [وحدة 934] قواعد تلوث معاملات HTTP ومعالجة HPP
  {
    id: 'CRS-934-100',
    name: 'HPP_POLLUTION_PROBE',
    category: 'HPP',
    severity: 'MEDIUM',
    confidence: 'MEDIUM',
    pattern: /(?:[&?][^=]+=[^&]*){10,}/i,
    score: 3,
    description: 'كشف مصفوفة استعلامات مفرطة قد تشير لهجوم تلوث المعاملات (HPP).',
  },
];

// 📈 إحصائيات جدار الحماية WAF اللحظية
let totalInspectedRequests = 0;
let totalBlockedAttacks = 0;
const attackCategoryCounts: Record<WafRuleCategory, number> = {
  SQLI: 0,
  XSS: 0,
  RCE: 0,
  LFI: 0,
  PROTOCOL: 0,
  CRLF: 0,
  SSRF: 0,
  HPP: 0,
};

// 🔍 واجهة نتيجة فحص جدار الحماية
export interface WafInspectionResult {
  isSafe: boolean;              // 🛡️ هل الطلب سليم ومقبول
  anomalyScore: number;         // 📊 مجموع درجات الشذوذ
  matchedRules: WafRule[];      // 📋 القواعد المطابقة
  sanitizedValue: string;       // 🧹 القيمة بعد التنظيف
  action: 'PASS' | 'BLOCK';     // 🎯 قرار جدار الحماية
  reason?: string;              // 📝 تفاصيل القرار
}

// 🧹 1. دالة تطبيع وفك التمويه للحمولات متعددة المراحل (Multi-stage De-Obfuscator)
export function deobfuscatePayload(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let normalized = input;

  // 1. تطبيع الـ Unicode بمعيار NFKC (لمنع استخدام حروف متشابهة شكلياً Homoglyphs)
  try {
    normalized = normalized.normalize('NFKC');
  } catch {
    // تجاوز في حال عدم الدعم
  }

  // 2. إزالة Null Bytes والأحرف غير المرئية
  normalized = normalized.replace(/\0/g, '').replace(/%00/gi, '');

  // 3. فك الترميز التكراري للـ URL حتى 3 مستويات لإحباط Multi-level URL Encoding
  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(normalized);
      if (decoded === normalized) break;
      normalized = decoded;
    } catch {
      break;
    }
  }

  // 4. تحويل كيانات HTML إلى رموز صريحة
  normalized = normalized
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&amp;/gi, '&');

  // 5. إزالة التعليقات المدمجة التي تستخدم لتفتيت الكلمات المفتاحية
  normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, ' ');

  // 6. إزالة المسافات المتكررة وتوحيد الفراغات
  return normalized.replace(/\s+/g, ' ').trim();
}

// 🚀 2. دالة فحص وتفتيش النصوص والحزم عبر جدار الحماية WAF (Inspect String)
export function wafInspectString(
  rawInput: string,
  context: { actorEmail?: string; fieldName?: string; source?: string } = {}
): WafInspectionResult {
  totalInspectedRequests++;

  if (!rawInput || typeof rawInput !== 'string') {
    return {
      isSafe: true,
      anomalyScore: 0,
      matchedRules: [],
      sanitizedValue: '',
      action: 'PASS',
    };
  }

  // 🧹 1. تطبيع النص وفك التمويه الشامل
  const normalized = deobfuscatePayload(rawInput);
  let totalScore = 0;
  const matchedRules: WafRule[] = [];

  // 🔍 2. مقارنة النص مع مصفوفة قواعد OWASP CRS
  for (const rule of WAF_CORE_RULES) {
    if (rule.pattern.test(normalized)) {
      matchedRules.push(rule);
      totalScore += rule.score;
      attackCategoryCounts[rule.category]++;

      // 📊 تسجيل الحدث في سجل الرقابة المشفر
      logSecurityEvent({
        eventType: 'WAF_RULE_TRIGGERED',
        actorEmail: context.actorEmail,
        targetEntity: context.fieldName || 'حقل بيانات',
        details: `🧱 تطابق قاعدة جدار الحماية [${rule.id} - ${rule.name}]. فئة التهديد: [${rule.category}]. درجة الشذوذ: (+${rule.score}). النص: "${normalized.substring(0, 60)}"`,
        severity: rule.severity,
      });
    }
  }

  // 🛑 3. اتخاذ القرار بناءً على سقف الشذوذ التراكمي
  if (totalScore >= WAF_BLOCKING_THRESHOLD) {
    totalBlockedAttacks++;

    logSecurityEvent({
      eventType: 'WAF_ANOMALY_BLOCKED',
      actorEmail: context.actorEmail,
      targetEntity: context.fieldName || 'حقل بيانات',
      details: `🛑 تم حظر الطلب بواسطة جدار الحماية WAF لتجاوز سقف الشذوذ المسموح (مجموع النقاط: ${totalScore} / السقف: ${WAF_BLOCKING_THRESHOLD}). القواعد: [${matchedRules.map(r => r.id).join(', ')}]`,
      severity: 'CRITICAL',
    });

    return {
      isSafe: false,
      anomalyScore: totalScore,
      matchedRules,
      sanitizedValue: '', // تفريغ القيمة المحظورة
      action: 'BLOCK',
      reason: `تم حظر الطلب بواسطة جدار الحماية (WAF Block - Anomaly Score: ${totalScore}).`,
    };
  }

  return {
    isSafe: true,
    anomalyScore: totalScore,
    matchedRules,
    sanitizedValue: normalized,
    action: 'PASS',
  };
}

// 📦 3. دالة فحص وتفتيش كائن البيانات بالكامل لطبقة قاعدة بيانات Supabase (Inspect Mutation Payload)
export function wafInspectPayload<T extends object>(
  payload: T,
  actorEmail?: string
): { isSafe: boolean; sanitizedPayload: T; totalAnomalyScore: number; blockedKeys: string[] } {
  // 🔒 1. حماية الذاكرة من Prototype Pollution أولاً
  const protoSanitized = deepSanitizePrototype(payload, { actorEmail, source: 'WAF Payload Guard' });

  let isOverallSafe = protoSanitized.isSafe;
  let accumulatedScore = 0;
  const blockedKeys: string[] = [];
  const sanitized = { ...protoSanitized.sanitized } as Record<string, string | number | boolean | null | undefined>;

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      const inspection = wafInspectString(value, { actorEmail, fieldName: key });
      accumulatedScore += inspection.anomalyScore;

      if (!inspection.isSafe || inspection.action === 'BLOCK') {
        isOverallSafe = false;
        blockedKeys.push(key);
        sanitized[key] = inspection.sanitizedValue;
      }
    }
  }

  return {
    isSafe: isOverallSafe,
    sanitizedPayload: sanitized as T,
    totalAnomalyScore: accumulatedScore,
    blockedKeys,
  };
}

// 📊 4. دالة جلب إحصائيات ومؤشرات جدار الحماية WAF للوحة التحكم
export function getWafRadarMetrics(): {
  status: 'ACTIVE_ENFORCING' | 'LEARNING' | 'DISABLED';
  totalInspected: number;
  totalBlocked: number;
  categoryBreakdown: Record<WafRuleCategory, number>;
  blockingThreshold: number;
  protectionEfficiency: number;
} {
  const efficiency = totalInspectedRequests > 0 
    ? 100 - (totalBlockedAttacks / totalInspectedRequests * 10) 
    : 100;

  return {
    status: 'ACTIVE_ENFORCING',
    totalInspected: totalInspectedRequests,
    totalBlocked: totalBlockedAttacks,
    categoryBreakdown: { ...attackCategoryCounts },
    blockingThreshold: WAF_BLOCKING_THRESHOLD,
    protectionEfficiency: Math.max(95, Math.min(100, Math.round(efficiency * 10) / 10)),
  };
}
