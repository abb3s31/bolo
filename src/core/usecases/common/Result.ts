// 🛡️ نمط النتيجة الآمن (Result Pattern) - معالجة الأخطاء الصارمة وتفادي الانهيارات غير المتوقعة

// 🧱 صنف النتيجة الموحد (Result Pattern)
export class Result<T, E = string> {
  // 🟢 هل العملية نجحت
  public readonly isSuccess: boolean;
  // 🔴 هل العملية فشلت
  public readonly isFailure: boolean;
  // 📦 القيمة الراجعة عند النجاح
  private readonly _value?: T;
  // ⚠️ رسالة أو كائن الخطأ عند الفشل
  private readonly _error?: E;

  // 🏗️ المشيد الخاص
  private constructor(isSuccess: boolean, error?: E, value?: T) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._error = error;
    this._value = value;
  }

  // 🎯 دالة بناء نتيجة ناجحة
  public static ok<U>(value: U): Result<U, never> {
    return new Result<U, never>(true, undefined, value);
  }

  // ❌ دالة بناء نتيجة فاشلة
  public static fail<F>(error: F): Result<never, F> {
    return new Result<never, F>(false, error, undefined);
  }

  // 📦 استخراج القيمة
  public getValue(): T {
    if (!this.isSuccess || this._value === undefined) {
      throw new Error('لا يمكن استخراج القيمة من نتيجة غير ناجحة ⚠️');
    }
    return this._value;
  }

  // ⚠️ استخراج الخطأ
  public getError(): E {
    if (this.isSuccess || this._error === undefined) {
      throw new Error('لا يوجد خطأ لأن العملية ناجحة');
    }
    return this._error;
  }
}
