// 🛡️ درع الحماية من هجمات تزوير الطلبات من جانب الخادم (SSRF - Server-Side Request Forgery Guard)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { logSecurityEvent } from './audit-guardian'; // 📊 تسجيل الإنذارات في سجل الرقابة

// 🛑 قائمة نطاقات IP الخاصة والمحلية والمحجوزة المحظورة قطعياً (Private & Loopback IP Ranges)
const FORBIDDEN_IP_PATTERNS: RegExp[] = [
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,           // 🏠 عناوين Loopback (127.0.0.0/8)
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,            // 🔒 الشبكات الخاصة الفئة A (10.0.0.0/8)
  /^172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/, // 🔒 الشبكات الخاصة الفئة B (172.16.0.0/12)
  /^192\.168\.\d{1,3}\.\d{1,3}$/,               // 🔒 الشبكات الخاصة الفئة C (192.168.0.0/16)
  /^169\.254\.\d{1,3}\.\d{1,3}$/,               // ☁️ عناوين Link-Local و Cloud Metadata (AWS/GCP/Azure)
  /^0\.0\.0\.0$/,                                // 🛑 عنوان الصفر
  /^::1$/,                                       // 🏠 IPv6 Loopback
  /^fe80:/i,                                     // 🔒 IPv6 Link-Local
  /^fc00:/i,                                     // 🔒 IPv6 Unique Local Address
  /^fd00:/i,                                     // 🔒 IPv6 Unique Local Address
];

// 🛑 قائمة أسماء المضيفين الحساسة والمحظورة (Forbidden Hostnames)
const FORBIDDEN_HOSTNAMES: RegExp[] = [
  /^localhost$/i,
  /^.*\.localhost$/i,
  /^.*\.internal$/i,
  /^.*\.local$/i,
  /^.*\.corp$/i,
  /^metadata\.google\.internal$/i,
  /^169\.254\.169\.254$/i,
  /^instance-data$/i,
];

// 🌐 البروتوكولات المسموح بها فقط
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

// 🔍 واجهة نتيجة فحص الـ SSRF
export interface SsrfCheckResult {
  isSafe: boolean;              // 🛡️ هل الرابط آمن ومصرح به
  sanitizedUrl: string;         // 🧹 الرابط المطهر
  reason?: string;              // 📝 سبب الرفض إن وجد
}

// 🚀 1. دالة فحص وتدقيق الروابط لمنع هجمات SSRF (Validate & Protect Against SSRF)
export function validateUrlAgainstSsrf(
  rawUrl: string,
  context: { actorEmail?: string; source?: string } = {}
): SsrfCheckResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isSafe: false, sanitizedUrl: '', reason: 'الرابط المطلوب فارغ أو غير صالح.' };
  }

  const trimmed = rawUrl.trim();

  // 🔍 1. محاولة قراءة وتفكيك الرابط
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isSafe: false, sanitizedUrl: '', reason: 'صيغة الرابط غير صالحة برمجياً.' };
  }

  // 🛑 2. فحص البروتوكول (منع file://, gopher://, ftp://, dict://)
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    logSecurityEvent({
      eventType: 'UNAUTHORIZED_ROUTE_ACCESS',
      actorEmail: context.actorEmail,
      targetEntity: trimmed,
      details: `🚨 تم كشف واعتراض محاولة استخدام بروتوكول خطير [${parsed.protocol}] في استدعاء خارجي (SSRF Attempt).`,
      severity: 'CRITICAL',
    });

    return {
      isSafe: false,
      sanitizedUrl: '',
      reason: `البروتوكول [${parsed.protocol}] محظور أمنياً. يسمح بـ HTTP و HTTPS فقط.`,
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 🛑 3. فحص أسماء المضيفين الحساسة (Forbidden Hostnames)
  for (const forbiddenHost of FORBIDDEN_HOSTNAMES) {
    if (forbiddenHost.test(hostname)) {
      logSecurityEvent({
        eventType: 'UNAUTHORIZED_ROUTE_ACCESS',
        actorEmail: context.actorEmail,
        targetEntity: hostname,
        details: `🚨 تم كشف واعتراض محاولة استهداف مضيف محلي أو سحابي حساس [${hostname}] (SSRF Hostname Probe).`,
        severity: 'CRITICAL',
      });

      return {
        isSafe: false,
        sanitizedUrl: '',
        reason: 'الوصول إلى الخوادم الداخلية وبيانات السحابة محظور أمنياً.',
      };
    }
  }

  // 🛑 4. فحص عناوين IP المحظورة وشبكات الـ Loopback
  for (const ipPattern of FORBIDDEN_IP_PATTERNS) {
    if (ipPattern.test(hostname)) {
      logSecurityEvent({
        eventType: 'UNAUTHORIZED_ROUTE_ACCESS',
        actorEmail: context.actorEmail,
        targetEntity: hostname,
        details: `🚨 تم كشف واعتراض محاولة الوصول لعنوان IP خاص أو داخلي [${hostname}] (SSRF Private IP Access).`,
        severity: 'CRITICAL',
      });

      return {
        isSafe: false,
        sanitizedUrl: '',
        reason: 'الوصول إلى عناوين الشبكة المحلية والـ Loopback محظور قطعياً.',
      };
    }
  }

  // 🛑 5. حظر المنافذ الحساسة والخدمات الداخلية (Forbidden Sensitive Ports)
  const port = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
  const sensitivePorts = new Set([22, 23, 25, 3306, 5432, 6379, 27017, 9200, 11211, 2375, 8080, 8443]);
  if (sensitivePorts.has(port) && port !== 80 && port !== 443) {
    return {
      isSafe: false,
      sanitizedUrl: '',
      reason: `المنفذ [${port}] غير مصرح به للطلبات الخارجية.`,
    };
  }

  return {
    isSafe: true,
    sanitizedUrl: parsed.toString(),
  };
}
