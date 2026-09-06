// 🛡️ درع حماية الذاكرة والنموذج الأولي للكائنات (Prototype Pollution & Object Integrity Guard)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { logSecurityEvent } from './audit-guardian'; // 📊 تسجيل الإنذارات في سجل الرقابة

// 🚫 المفاتيح الخطيرة التي تستهدف تلويث النموذج الأولي لكائنات الجافاسكربت
const DANGEROUS_PROTO_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

// 🔍 واجهة نتيجة فحص الـ Prototype Pollution
export interface PrototypeCheckResult<T> {
  isSafe: boolean;              // 🛡️ هل الكائن سليم وغير ملوث
  sanitized: T;                 // 🧹 الكائن بعد التطهير
  pollutedKeysCount: number;    // 🔢 عدد المفاتيح الخبيثة التي تم اعتراضها وحذفها
}

// 🚀 1. دالة فحص وتطهير الكائنات العميقة من هجمات Prototype Pollution
export function deepSanitizePrototype<T>(
  input: T,
  context: { actorEmail?: string; source?: string } = {}
): PrototypeCheckResult<T> {
  let pollutedCount = 0;

  type SafeValueType = string | number | boolean | null | undefined | object | SafeValueType[];

  function cleanRecursive(current: SafeValueType): SafeValueType {
    if (!current || typeof current !== 'object') {
      return current;
    }

    if (Array.isArray(current)) {
      return current.map(item => cleanRecursive(item as SafeValueType));
    }

    // 🔒 إنشاء كائن نظيف بدون وراثة مباشرة من Object.prototype إن لزم
    const cleanObj: Record<string, SafeValueType> = {};

    for (const [key, value] of Object.entries(current as Record<string, SafeValueType>)) {
      // 🛑 كشف واعتراض المفاتيح الملوثة
      if (DANGEROUS_PROTO_KEYS.has(key)) {
        pollutedCount++;
        logSecurityEvent({
          eventType: 'PROTOTYPE_POLLUTION_ATTEMPT',
          actorEmail: context.actorEmail,
          targetEntity: context.source || 'كائن بيانات',
          details: `🚨 تم كشف واعتراض محاولة تلويث النموذج الأولي (Prototype Pollution Attack) عبر المفتاح المحظور [${key}]. تم حذف المفتاح فوراً.`,
          severity: 'CRITICAL',
        });
        continue; // تجاهل المفتاح فوراً
      }

      cleanObj[key] = cleanRecursive(value);
    }

    return cleanObj;
  }

  const result = cleanRecursive(input as SafeValueType) as T;

  return {
    isSafe: pollutedCount === 0,
    sanitized: result,
    pollutedKeysCount: pollutedCount,
  };
}

// 🔒 2. دالة تجميد الكائنات الحساسة في الذاكرة (Deep Object Freeze)
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.freeze(obj);
  for (const key of Object.getOwnPropertyNames(obj)) {
    const prop = (obj as Record<string, object | null | undefined>)[key];
    if (prop && typeof prop === 'object' && !Object.isFrozen(prop)) {
      deepFreeze(prop);
    }
  }
  return obj;
}
