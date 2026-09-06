// 📧 كائن قيمة يمثل البريد الإلكتروني الأكاديمي مع التحقق الصارم - SOLID & Clean Architecture

// 🔒 صنف كائن القيمة للبريد الإلكتروني - غير قابل للتعديل بعد الإنشاء (Immutable)
export class Email {
  // 🏷️ تخزين القيمة النصية الصافية للبريد
  private readonly value: string;

  // 🏗️ المشيد الخاص لمنع الإنشاء العشوائي بدون فحص
  private constructor(email: string) {
    // 🧹 تنظيف البريد وتحويله لحروف صغيرة
    this.value = email.toLowerCase().trim();
  }

  // 🏭 دالة المصنع لإنشاء وفحص البريد الإلكتروني
  public static create(rawEmail: string): Email {
    // 🔍 فحص هل البريد فارغ أو غير موجود
    if (!rawEmail || rawEmail.trim().length === 0) {
      // ⚠️ رمي خطأ إذا البريد فارغ
      throw new Error('البريد الإلكتروني ما يصير يكون فارغ ❌');
    }

    // 🧪 فحص بنية البريد عبر نمط Regex دقيق
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // 🔍 التحقق من مطابقة النمط
    if (!emailRegex.test(rawEmail.trim())) {
      // ⚠️ رمي خطأ إذا صيغة البريد مو صحيحة
      throw new Error('صيغة البريد الإلكتروني غير صالحة ⚠️');
    }

    // 🌟 إرجاع كائن البريد بعد اجتياز الفحص
    return new Email(rawEmail);
  }

  // 📤 دالة استرجاع القيمة النصية
  public getValue(): string {
    // 📄 إرجاع القيمة المخزونة
    return this.value;
  }

  // ⚖️ دالة مقارنة بريدين إلكترونيين
  public equals(other: Email): boolean {
    // 🔍 مطابقة القيمة مع الكائن الآخر
    return this.value === other.getValue();
  }
}
