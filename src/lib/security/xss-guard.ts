// 🛡️ حارس ومكتشف محاولات حقن السكربتات الخبيثة (Cross-Site Scripting - XSS Sentinel)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { logSecurityEvent } from './audit-guardian'; // 📊 تسجيل الإنذارات الأمنية

// 🚫 مصفوفة الأنماط والتواقيع الهجومية لحقن السكربتات (XSS Attack Patterns & Signatures)
const XSS_ATTACK_PATTERNS: Array<{ name: string; pattern: RegExp; severity: 'HIGH' | 'CRITICAL' }> = [
  // 1️⃣ أنماط وسوم التنفيذ والتحميل المباشر للسكربتات
  { name: 'SCRIPT_TAG_INJECTION', pattern: /<\s*script\b[^>]*>[\s\S]*?(?:<\s*\/\s*script\s*>|$)/i, severity: 'CRITICAL' },
  { name: 'IFRAME_TAG_INJECTION', pattern: /<\s*iframe\b[^>]*>/i, severity: 'CRITICAL' },
  { name: 'OBJECT_EMBED_TAG_INJECTION', pattern: /<\s*(?:object|embed|applet)\b[^>]*>/i, severity: 'CRITICAL' },
  { name: 'SVG_MATH_TAG_INJECTION', pattern: /<\s*(?:svg|math)\b[^>]*>/i, severity: 'HIGH' },
  { name: 'BASE_META_LINK_INJECTION', pattern: /<\s*(?:base|meta|link)\b[^>]*>/i, severity: 'HIGH' },

  // 2️⃣ أنماط مستمعات الأحداث التلقائية (Inline JavaScript Event Handlers)
  { 
    name: 'INLINE_EVENT_HANDLER', 
    pattern: /\bon(?:load|error|click|dblclick|mouseover|mouseout|mouseenter|mouseleave|focus|blur|change|submit|keydown|keypress|keyup|pointerdown|pointerup|animationstart|animationend|toggle)\s*=/i, 
    severity: 'CRITICAL' 
  },

  // 3️⃣ أنماط سكيمات وروابط الجافاسكربت الخبيثة (Malicious URI Schemes)
  { name: 'JAVASCRIPT_URI_SCHEME', pattern: /\b(?:javascript|vbscript|data:text\/html|livescript)\s*:/i, severity: 'CRITICAL' },
  
  // 4️⃣ أنماط دوال التنفيذ الديناميكي والالتفاف (Dynamic Execution & Obfuscation)
  { name: 'EVAL_EXECUTION_ATTEMPT', pattern: /\b(?:eval|Function|setTimeout|setInterval)\s*\(/i, severity: 'CRITICAL' },
  { name: 'STRING_FROM_CHAR_CODE', pattern: /String\s*\.\s*fromCharCode\s*\(/i, severity: 'HIGH' },
  { name: 'DOCUMENT_COOKIE_ACCESS', pattern: /document\s*\.\s*(?:cookie|domain|location)/i, severity: 'CRITICAL' },
  { name: 'WINDOW_LOCATION_ASSIGN', pattern: /window\s*\.\s*location/i, severity: 'HIGH' },
];

// 🔍 واجهة نتيجة فحص الأمان ضد XSS
export interface XssCheckResult {
  isSafe: boolean;              // 🛡️ هل النص آمن وخالٍ من حقن السكربتات
  threatName?: string;          // 🏷️ اسم التهديد المكتشف إن وجد
  sanitizedValue: string;       // 🧹 القيمة بعد التنظيف والتطهير
  details?: string;             // 📝 تفاصيل إضافية
}

// 🚀 1. دالة فحص وتدقيق النصوص ضد هجمات حقن السكربتات (Detect XSS)
export function detectXss(
  input: string,
  context: { actorEmail?: string; fieldName?: string } = {}
): XssCheckResult {
  if (!input || typeof input !== 'string') {
    return { isSafe: true, sanitizedValue: '' };
  }

  const trimmed = input.trim();

  // 🔍 فحص النص مقابل كافة الأنماط الهجومية
  for (const { name, pattern, severity } of XSS_ATTACK_PATTERNS) {
    if (pattern.test(trimmed)) {
      // 🚨 تم اكتشاف نمط XSS خبيث! تسجيل فوري في سجل الرقابة
      logSecurityEvent({
        eventType: 'SESSION_TAMPERED',
        actorEmail: context.actorEmail,
        targetEntity: context.fieldName || 'حقل إدخال واجهة',
        details: `🚨 تم كشف واعتراض محاولة حقن سكربت XSS بنمط [${name}] في حقل [${context.fieldName || 'عام'}]. القيمة المشبوهة: "${trimmed.substring(0, 60)}"`,
        severity,
      });

      // 🧹 تطهير القيمة بإزالة الوسوم والأحداث
      const sanitized = stripXss(trimmed);

      return {
        isSafe: false,
        threatName: name,
        sanitizedValue: sanitized,
        details: `تم اكتشاف محاولة حقن سكربت خبيثة (${name}) وتم حظرها وتطهيرها فوراً.`,
      };
    }
  }

  // ✅ القيمة آمنة
  return {
    isSafe: true,
    sanitizedValue: stripXss(trimmed),
  };
}

// 🧹 2. دالة إزالة وسوم السكربتات والأحداث بالكامل (XSS Stripper)
export function stripXss(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 🛑 مسح وسوم script ومحتواها
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // 🛑 مسح وسوم style ومحتواها
    .replace(/<[^>]+>/g, '')                                           // 🧹 إزالة كافة وسوم HTML
    .replace(/on\w+\s*=/gi, '')                                        // 🛑 إزالة أي مستمعات أحداث
    .replace(/javascript:/gi, '')                                      // 🛑 إزالة سكيمة javascript:
    .replace(/vbscript:/gi, '')                                        // 🛑 إزالة سكيمة vbscript:
    .replace(/data:text\/html/gi, '')                                  // 🛑 إزالة data URIs الخطيرة
    .trim();
}

// 🔤 3. دالة ترميز وتشفير نصوص HTML الآمنة (HTML Entity Encoding)
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';

  const htmlEntitiesMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return str.replace(/[&<>"'`/=\\]/g, (char) => htmlEntitiesMap[char] || char);
}

// 🔗 4. دالة فحص وتطهير الروابط لمنع الروابط الخبيثة (Safe URL Scheme Guard)
export function sanitizeSafeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '#';

  const cleanUrl = url.trim();

  // السماح بالروابط النسبية
  if (cleanUrl.startsWith('/') || cleanUrl.startsWith('#')) {
    return cleanUrl;
  }

  // السماح بـ http و https ومطابقة البريد mailto
  try {
    const parsed = new URL(cleanUrl, 'http://dummy.local');
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:') {
      // التأكد من عدم وجود javascript: داخل المسار
      if (/javascript:|data:|vbscript:/i.test(cleanUrl)) {
        return '#';
      }
      return cleanUrl;
    }
  } catch {
    return '#';
  }

  return '#';
}

// 📦 5. دالة فحص وتطهير كائن البيانات بالكامل من هجمات XSS
export function validateAndSanitizeXssPayload<T extends object>(
  payload: T,
  actorEmail?: string
): { isSafe: boolean; sanitizedPayload: T; blockedFields: string[] } {
  let isOverallSafe = true;
  const blockedFields: string[] = [];
  const sanitized = { ...payload } as Record<string, string | number | boolean | null | undefined>;

  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      const check = detectXss(value, { actorEmail, fieldName: key });
      if (!check.isSafe) {
        isOverallSafe = false;
        blockedFields.push(key);
        sanitized[key] = check.sanitizedValue;
      }
    }
  }

  return {
    isSafe: isOverallSafe,
    sanitizedPayload: sanitized as T,
    blockedFields,
  };
}
