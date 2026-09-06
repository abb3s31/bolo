// ⚠️ استثناءات وأخطاء النطاق المخصصة (Domain Exceptions) - معالجة الأخطاء الصريحة والمحددة

// 🧱 الصنف الأساسي لأخطاء النطاق
export abstract class DomainException extends Error {
  // 🏷️ رمز الخطأ الفريد للتصنيف
  public abstract readonly errorCode: string;

  // 🏗️ مشيد الخطأ
  constructor(message: string) {
    // 📢 تمرير الرسالة للصنف الأب Error
    super(message);
    // 🏷️ ضبط اسم الكلاس
    this.name = this.constructor.name;
    // 🧱 ضبط سلسلة التتبع
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ❌ خطأ عدم العثور على الكيان (Not Found)
export class EntityNotFoundException extends DomainException {
  // 🏷️ رمز الخطأ
  public readonly errorCode = 'ENTITY_NOT_FOUND';

  // 🏗️ المشيد
  constructor(entityName: string, identifier: string) {
    // 📢 رسالة واضحة
    super(`عذراً، لم يتم العثور على ${entityName} بالمعرف أو الرقم (${identifier}) في النظام ❌`);
  }
}

// ⚠️ خطأ التحقق من صحة البيانات (Validation Failed)
export class DomainValidationException extends DomainException {
  // 🏷️ رمز الخطأ
  public readonly errorCode = 'DOMAIN_VALIDATION_FAILED';

  // 🏗️ المشيد
  constructor(message: string) {
    // 📢 رسالة الفحص
    super(`فشل التحقق من صحة البيانات: ${message} ⚠️`);
  }
}

// 🔒 خطأ الصلاحيات والوصول (Unauthorized)
export class DomainUnauthorizedException extends DomainException {
  // 🏷️ رمز الخطأ
  public readonly errorCode = 'DOMAIN_UNAUTHORIZED';

  // 🏗️ المشيد
  constructor(message: string = 'ليس لديك الصلاحيات الكافية لتنفيذ هذا الإجراء 🔒') {
    // 📢 رسالة الصلاحية
    super(message);
  }
}

// ⚡ خطأ التعارض وتكرار البيانات (Conflict)
export class DomainConflictException extends DomainException {
  // 🏷️ رمز الخطأ
  public readonly errorCode = 'DOMAIN_CONFLICT';

  // 🏗️ المشيد
  constructor(message: string) {
    // 📢 رسالة التعارض
    super(`تعارض في البيانات: ${message} ⚡`);
  }
}
