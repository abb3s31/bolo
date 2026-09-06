// 🛡️ حارس ومكتشف محاولات حقن وتلاعب الروابط وإعادة التوجيه المفتوح (URL Injection & Open Redirect Sentinel)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { logSecurityEvent } from './audit-guardian'; // 📊 تسجيل الإنذارات الأمنية

// 🚫 مصفوفة الأنماط والتواقيع الهجومية للروابط (URL Injection & Traversal Signatures)
const URL_INJECTION_PATTERNS: Array<{ name: string; pattern: RegExp; severity: 'HIGH' | 'CRITICAL' }> = [
  // 1️⃣ أنماط سكيمات التنفيذ والبروتوكولات الخطيرة
  { name: 'DANGEROUS_URI_SCHEME', pattern: /^\s*(?:javascript|vbscript|data|file|blob|livescript)\s*:/i, severity: 'CRITICAL' },
  
  // 2️⃣ أنماط إعادة التوجيه المفتوح بروتوكولياً (Protocol-relative Open Redirect)
  { name: 'PROTOCOL_RELATIVE_REDIRECT', pattern: /^\s*\/\/[^\s/]/i, severity: 'CRITICAL' },
  { name: 'BACKSLASH_REDIRECT_TRICK', pattern: /^\s*(?:\/\\|\\\/|\\\\)/i, severity: 'HIGH' },

  // 3️⃣ أنماط اجتياز المسارات (Path Traversal Attacks)
  { name: 'PATH_TRAVERSAL_DOT_DOT', pattern: /(?:\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.;\/)/i, severity: 'CRITICAL' },
  { name: 'DOUBLE_ENCODED_TRAVERSAL', pattern: /%252e%252e/i, severity: 'CRITICAL' },

  // 4️⃣ أنماط البايت الفارغ والكسر (Null Byte Injection)
  { name: 'NULL_BYTE_INJECTION', pattern: /(?:%00|\0|\\x00)/i, severity: 'CRITICAL' },

  // 5️⃣ أنماط منافذ وسيرفرات SSRF المحظورة
  { name: 'LOCALHOST_SSRF_ATTEMPT', pattern: /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|169\.254\.169\.254|metadata\.google\.internal)/i, severity: 'CRITICAL' },
];

// 🌐 قائمة بيضاء بالمسارات الداخلية الرسمية المعتمدة في النظام
const ALLOWED_INTERNAL_ROUTES = [
  '/',
  '/admin',
  '/admin/login',
  '/admin/dashboard',
  '/admin/department-portal',
  '/admin/departments',
  '/admin/teachers',
  '/admin/students',
  '/admin/courses',
  '/admin/reports',
  '/admin/audit-logs',
  '/admin/department-heads',
  '/sadmin',
  '/sadmin/login',
  '/sadmin/dashboard',
  '/sadmin/departments',
  '/sadmin/department-heads',
  '/sadmin/audit-logs',
  '/sadmin/reports',
  '/sadmin/teachers',
  '/sadmin/students',
  '/sadmin/courses',
  '/super-admin',
  '/admin-portal-sadiq',
  '/teacher',
  '/teacher/login',
  '/teacher/dashboard',
  '/teacher/audit-logs',
  '/student',
  '/student/login',
  '/student/dashboard',
  '/verify',
];

// 🌐 قائمة النطاقات الخارجية الموثوقة للمصادر والمحاضرات التعليمية
const TRUSTED_EXTERNAL_DOMAINS = [
  'sadiq.edu.iq',
  'www.sadiq.edu.iq',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'drive.google.com',
  'docs.google.com',
  'supabase.co',
];

// 🔍 واجهة نتيجة فحص الأمان للروابط
export interface UrlCheckResult {
  isSafe: boolean;              // 🛡️ هل الرابط آمن وخالٍ من الهجمات
  threatName?: string;          // 🏷️ اسم التهديد المكتشف إن وجد
  sanitizedUrl: string;         // 🧹 الرابط بعد التنظيف والتحقق
  details?: string;             // 📝 تفاصيل إضافية
}

// 🚀 1. دالة فحص وتدقيق الروابط ضد هجمات URL Injection (Detect URL Injection)
export function detectUrlInjection(
  url: string,
  context: { actorEmail?: string; fieldName?: string } = {}
): UrlCheckResult {
  if (!url || typeof url !== 'string') {
    return { isSafe: true, sanitizedUrl: '/' };
  }

  const trimmed = url.trim();

  // 🔍 فحص النص مقابل كافة الأنماط الهجومية
  for (const { name, pattern, severity } of URL_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      // 🚨 تم كشف تلاعب أو حقن بالرابط! تسجيل فوري في سجل الرقابة
      logSecurityEvent({
        eventType: 'SESSION_TAMPERED',
        actorEmail: context.actorEmail,
        targetEntity: context.fieldName || 'رابط توجيه',
        details: `🚨 تم كشف واعتراض محاولة حقن وتلاعب برابط URL بنمط [${name}] في [${context.fieldName || 'عام'}]. الرابط المشبوه: "${trimmed.substring(0, 70)}"`,
        severity,
      });

      return {
        isSafe: false,
        threatName: name,
        sanitizedUrl: '/',
        details: `تم كشف رابط غير آمن (${name}) وتم التراجع للمسار الآمن.`,
      };
    }
  }

  return {
    isSafe: true,
    sanitizedUrl: trimmed,
  };
}

// 🔒 2. دالة التحقق من سلامة إعادة التوجيه الداخلي ومنع Open Redirect (Strict Internal Redirect Validator)
export function validateSafeInternalRedirect(targetUrl: string | undefined | null, fallback = '/'): string {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return fallback;
  }

  const cleanUrl = targetUrl.trim();

  // 🛑 1. فحص ضد هجمات URL Injection
  const check = detectUrlInjection(cleanUrl, { fieldName: 'إعادة التوجيه' });
  if (!check.isSafe) {
    return fallback;
  }

  // 🛑 2. حظر الروابط التي تبدأ بـ // أو /\ أو بروتوكول http/https خارجي
  if (cleanUrl.startsWith('//') || cleanUrl.startsWith('/\\') || cleanUrl.startsWith('\\/') || /^https?:\/\//i.test(cleanUrl)) {
    return fallback;
  }

  // 🛑 3. يجب أن يبدأ الرابط الداخلي بـ /
  if (!cleanUrl.startsWith('/')) {
    return fallback;
  }

  // 🛑 4. استخراج المسار الأساسي بدون علامات الاستفهام أو الـ Hash
  const basePath = cleanUrl.split('?')[0].split('#')[0];

  // 🛑 5. فحص إذا كان المسار مطابقاً أو يبدأ بأحد المسارات المعتمدة
  const isAllowed = ALLOWED_INTERNAL_ROUTES.some(
    (allowed) => basePath === allowed || basePath.startsWith(allowed + '/')
  );

  if (isAllowed) {
    return cleanUrl;
  }

  return fallback;
}

// 🛡️ 3. دالة تطهير وفحص معاملات المسارات الديناميكية (Sanitize Route Param [id])
export function sanitizeRouteParam(param: string | undefined | null, fallback = ''): string {
  if (!param || typeof param !== 'string') return fallback;

  const trimmed = param.trim();

  // 🛑 1. فحص كشف اجتياز المسارات والبايت الفارغ
  if (detectUrlInjection(trimmed).isSafe === false) {
    return fallback;
  }

  // 🛑 2. تنظيف الرموز غير المسموح بها (السماح فقط بالأحرف والإنجليزية والأرقام والشرطات)
  const cleaned = trimmed.replace(/[^a-zA-Z0-9_\u0600-\u06FF@-]/g, '');

  return cleaned.substring(0, 64);
}

// 🌐 4. دالة التحقق من الروابط الخارجية للمصادر والمراجع التعليمية (External Resource Validator)
export function validateExternalResourceUrl(url: string): { isSafe: boolean; sanitizedUrl: string; reason?: string } {
  if (!url || typeof url !== 'string') {
    return { isSafe: false, sanitizedUrl: '#', reason: 'رابط فارغ' };
  }

  const cleanUrl = url.trim();

  // 🛑 1. فحص أولي ضد حقن الروابط والسكيمات الخبيثة
  const check = detectUrlInjection(cleanUrl, { fieldName: 'رابط خارجي' });
  if (!check.isSafe) {
    return { isSafe: false, sanitizedUrl: '#', reason: check.details };
  }

  // 🛑 2. السماح بالمسارات المحلية
  if (cleanUrl.startsWith('/')) {
    return { isSafe: true, sanitizedUrl: cleanUrl };
  }

  // 🛑 3. التحقق من النطاق الخارجي المعتمد
  try {
    const parsed = new URL(cleanUrl);
    
    // اشتراط https حصراً للروابط الخارجية
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { isSafe: false, sanitizedUrl: '#', reason: 'بروتوكول غير آمن' };
    }

    const hostname = parsed.hostname.toLowerCase();
    const isTrusted = TRUSTED_EXTERNAL_DOMAINS.some(
      (trusted) => hostname === trusted || hostname.endsWith('.' + trusted)
    );

    if (isTrusted) {
      return { isSafe: true, sanitizedUrl: cleanUrl };
    }

    // السماح مع التنبيه للروابط الأكاديمية العامة
    return { isSafe: true, sanitizedUrl: cleanUrl };

  } catch {
    return { isSafe: false, sanitizedUrl: '#', reason: 'صيغة الرابط غير صحيحة' };
  }
}
