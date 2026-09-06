// 🛡️ حارس ومكتشف محاولات حقن قواعد البيانات (SQL Injection Sentinel & Defense Engine)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { logSecurityEvent } from './audit-guardian'; // 📊 تسجيل الإنذارات الأمنية

// 🚫 مصفوفة الأنماط والتواقيع الهجومية لحقن SQL (SQL Injection Attack Signatures)
const SQL_INJECTION_PATTERNS: Array<{ name: string; pattern: RegExp; severity: 'HIGH' | 'CRITICAL' }> = [
  // 1️⃣ أنماط الاستعلامات المتعددة والـ UNION
  { name: 'UNION_SELECT_INJECTION', pattern: /\bunion\s+(?:all\s+)?select\b/i, severity: 'CRITICAL' },
  { name: 'INFORMATION_SCHEMA_ATTEMPT', pattern: /\binformation_schema\b/i, severity: 'CRITICAL' },
  { name: 'PG_CATALOG_ATTEMPT', pattern: /\bpg_catalog\b/i, severity: 'CRITICAL' },

  // 2️⃣ أنماط التجاوز والتعطيل المنطقي (Tautology / Boolean-based)
  { name: 'OR_TRUE_TAUTOLOGY', pattern: /'\s*or\s+['"\d\w]+=['"\d\w]+/i, severity: 'HIGH' },
  { name: 'OR_1_EQUALS_1', pattern: /\bor\s+(?:1\s*=\s*1|true\s*=\s*true)\b/i, severity: 'HIGH' },
  { name: 'AND_1_EQUALS_1', pattern: /\band\s+(?:1\s*=\s*1|true\s*=\s*true)\b/i, severity: 'HIGH' },
  { name: 'ADMIN_COMMENT_INJECTION', pattern: /admin'\s*--/i, severity: 'HIGH' },

  // 3️⃣ أنماط أوامر التخريب وتعديل البيانات المزدوجة (Piggybacked Queries)
  { name: 'DROP_TABLE_ATTEMPT', pattern: /;\s*drop\s+table\b/i, severity: 'CRITICAL' },
  { name: 'DROP_DATABASE_ATTEMPT', pattern: /;\s*drop\s+database\b/i, severity: 'CRITICAL' },
  { name: 'DELETE_FROM_ATTEMPT', pattern: /;\s*delete\s+from\b/i, severity: 'CRITICAL' },
  { name: 'TRUNCATE_TABLE_ATTEMPT', pattern: /;\s*truncate\s+table\b/i, severity: 'CRITICAL' },
  { name: 'UPDATE_SET_ATTEMPT', pattern: /;\s*update\s+[a-z0-9_]+\s+set\b/i, severity: 'CRITICAL' },
  { name: 'INSERT_INTO_ATTEMPT', pattern: /;\s*insert\s+into\b/i, severity: 'CRITICAL' },

  // 4️⃣ أنماط التعليقات وكسر السياق الخبيثة
  { name: 'SQL_LINE_COMMENT', pattern: /(?:--|#|\/\*)/i, severity: 'HIGH' },
  { name: 'MULTILINE_COMMENT_INJECTION', pattern: /\/\*[\s\S]*?\*\//, severity: 'HIGH' },
  { name: 'HEX_SQL_PAYLOAD', pattern: /0x[0-9a-fA-F]{4,}/i, severity: 'HIGH' },

  // 5️⃣ أنماط دوال النظام والتنفيذ الخارجي
  { name: 'EXEC_SYSTEM_COMMAND', pattern: /\b(?:xp_cmdshell|exec\s*\(|execute\s*\(|sp_executesql)\b/i, severity: 'CRITICAL' },
  { name: 'BENCHMARK_OR_SLEEP', pattern: /\b(?:benchmark|pg_sleep|sleep)\s*\(/i, severity: 'CRITICAL' },
  { name: 'WAITFOR_DELAY_ATTEMPT', pattern: /\bwaitfor\s+delay\b/i, severity: 'CRITICAL' },
  { name: 'EXTRACT_XML_ATTEMPT', pattern: /\bextractvalue\s*\(/i, severity: 'HIGH' },
];

// 🔍 واجهة نتيجة فحص الأمان ضد حقن SQL
export interface SqlCheckResult {
  isSafe: boolean;              // 🛡️ هل النص آمن وخالٍ من الهجمات
  threatName?: string;          // 🏷️ اسم التهديد المكتشف إن وجد
  sanitizedValue: string;       // 🧹 القيمة بعد التنظيف والتطهير
  details?: string;             // 📝 تفاصيل إضافية
}

// 🚀 1. دالة فحص وتدقيق النصوص ضد هجمات حقن SQL (Detect SQL Injection)
export function detectSqlInjection(
  input: string,
  context: { actorEmail?: string; fieldName?: string } = {}
): SqlCheckResult {
  // إذا كانت القيمة فارغة أو ليست نصاً
  if (!input || typeof input !== 'string') {
    return { isSafe: true, sanitizedValue: '' };
  }

  const trimmed = input.trim();

  // 🔍 فحص النص مقابل كافة الأنماط الهجومية
  for (const { name, pattern, severity } of SQL_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      // 🚨 تم اكتشاف نمط حقن خبيث! تسجيل فوري في سجل الرقابة
      logSecurityEvent({
        eventType: 'SESSION_TAMPERED',
        actorEmail: context.actorEmail,
        targetEntity: context.fieldName || 'حقل إدخال بيانات',
        details: `🚨 تم كشف واعتراض محاولة حقن SQL Injection بنمط [${name}] في حقل [${context.fieldName || 'عام'}]. القيمة المدخلة المشبوهة: "${trimmed.substring(0, 50)}"`,
        severity,
      });

      // 🧹 تطهير القيمة بإزالة الرموز الخطيرة
      const sanitized = sanitizeSqlString(trimmed);

      return {
        isSafe: false,
        threatName: name,
        sanitizedValue: sanitized,
        details: `تم اكتشاف محاولة حقن خبيثة (${name}) وتم حظرها فوراً.`,
      };
    }
  }

  // ✅ القيمة آمنة
  return {
    isSafe: true,
    sanitizedValue: sanitizeSqlString(trimmed),
  };
}

// 🧹 2. دالة تنظيف وتطهير نصوص المعاملات من رموز الكسر (SQL Parameter Sanitizer)
export function sanitizeSqlString(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/['";\\]/g, '')     // 🛡️ إزالة علامات الاقتباس والفواصل المنقوطة
    .replace(/--/g, '')          // 🛑 إزالة رموز التعليقات الأحادية
    .replace(/\/\*[\s\S]*?\*\//g, '') // 🛑 إزالة التعليقات متعددة الأسطر
    .replace(/\0/g, '')          // 🧹 إزالة الـ Null Bytes
    .trim();
}

// 🎓 3. التحقق الصارم من الرقم الجامعي للطلاب (Strict University ID Whitelist)
export function isStrictUniversityNumber(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  // 🎓 أرقام فقط مكونة من 8 خانات (مثل 20261001)
  return /^\d{8}$/.test(id.trim());
}

// 🔑 4. التحقق الصارم من المعرفات الأكاديمية (Strict Alphanumeric ID Whitelist)
export function isStrictAcademicId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  // أحرف إنجليزية وأرقام وشرطات فقط
  return /^[a-zA-Z0-9_-]{1,64}$/.test(id.trim());
}

// 📦 5. دالة فحص وتطهير كائن البيانات بالكامل قبل الحفظ أو التحديث في قاعدة البيانات
export function validateAndSanitizeSqlPayload<T extends object>(
  payload: T,
  actorEmail?: string
): { isSafe: boolean; sanitizedPayload: T; blockedFields: string[] } {
  let isOverallSafe = true;
  const blockedFields: string[] = [];
  const sanitized = { ...payload } as Record<string, string | number | boolean | null | undefined>;

  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      const check = detectSqlInjection(value, { actorEmail, fieldName: key });
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
