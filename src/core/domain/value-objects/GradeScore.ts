// 📊 كائن قيمة يمثل الدرجة الأكاديمية (0 - 100) مع التقدير اللفظي - SOLID Domain Logic

// 🔒 صنف كائن القيمة للدرجة الأكاديمية
export class GradeScore {
  // 🏷️ تخزين الدرجة الرقمية
  private readonly value: number;

  // 🏗️ المشيد الخاص
  private constructor(score: number) {
    // 🔢 حفظ القيمة بعد التقريب لأقرب منزلة عشرية
    this.value = Math.round(score * 100) / 100;
  }

  // 🏭 دالة المصنع لإنشاء وفحص الدرجة
  public static create(rawScore: number): GradeScore {
    // 🔍 فحص هل الدرجة رقم صالح
    if (isNaN(rawScore) || rawScore === null || rawScore === undefined) {
      // ⚠️ رمي خطأ إذا القيمة غير رقمية
      throw new Error('الدرجة لازم تكون رقم صحيح أو عشري صالح ❌');
    }

    // 🔍 فحص الحدود بين 0 و 100
    if (rawScore < 0 || rawScore > 100) {
      // ⚠️ رمي خطأ خارج النطاق
      throw new Error('الدرجة لازم تكون بين الصفر والـ 100 فقط ⚠️');
    }

    // 🌟 إرجاع الكائن المعتمد
    return new GradeScore(rawScore);
  }

  // 📤 استرجاع القيمة الرقمية
  public getValue(): number {
    // 📄 إرجاع الرقم
    return this.value;
  }

  // 🎓 حساب التقدير الجامعي المعتمد في العراق
  public getLetterRating(): string {
    // 🌟 امتياز (90 - 100)
    if (this.value >= 90) return 'امتياز';
    // 🌟 جيد جداً (80 - 89.9)
    if (this.value >= 80) return 'جيد جداً';
    // 🌟 جيد (70 - 79.9)
    if (this.value >= 70) return 'جيد';
    // 🌟 متوسط (60 - 69.9)
    if (this.value >= 60) return 'متوسط';
    // 🌟 مقبول (50 - 59.9)
    if (this.value >= 50) return 'مقبول';
    // ❌ راسب (أقل من 50)
    return 'راسب';
  }

  // 🟢 التحقق من النجاح
  public isPassed(): boolean {
    // 🔍 هل الدرجة 50 فما فوق
    return this.value >= 50;
  }
}
