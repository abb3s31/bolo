// 🔢 كائن قيمة يمثل الرقم الجامعي للطالب أو الأستاذ - معايير الجودة ومبادئ SOLID

// 🔒 صنف كائن القيمة للرقم الجامعي (Immutable Value Object)
export class UniversityNumber {
  // 🏷️ تخزين القيمة النصية للرقم الجامعي
  private readonly value: string;

  // 🏗️ المشيد الخاص لضمان إنشاء الرقم بعد التدقيق
  private constructor(uniNum: string) {
    // 🧹 تنظيف المسافات الزائدة
    this.value = uniNum.trim();
  }

  // 🏭 دالة المصنع لإنشاء وفحص الرقم الجامعي
  public static create(rawNumber: string): UniversityNumber {
    // 🔍 فحص هل الرقم فارغ
    if (!rawNumber || rawNumber.trim().length === 0) {
      // ⚠️ إشعار بالخطأ
      throw new Error('الرقم الجامعي ما يصير يكون فارغ ❌');
    }

    // 🧹 إزالة المسافات
    const cleaned = rawNumber.trim();

    // 📏 التحقق من أن طول الرقم الجامعي مناسب (مثلاً لا يقل عن 4 أحرف/أرقام)
    if (cleaned.length < 4) {
      // ⚠️ إشعار بقصر الرقم الجامعي
      throw new Error('الرقم الجامعي قصير جداً ولا يطابق المعايير الأكاديمية ⚠️');
    }

    // 🌟 إرجاع كائن الرقم الجامعي الصالح
    return new UniversityNumber(cleaned);
  }

  // 📤 دالة استرجاع القيمة
  public getValue(): string {
    // 📄 إرجاع الرقم المخزن
    return this.value;
  }

  // ⚖️ دالة مقارنة رقمين جامعيين
  public equals(other: UniversityNumber): boolean {
    // 🔍 مطابقة الرقمين
    return this.value === other.getValue();
  }
}
