// ⚡ قاطع الدائرة الكهربائية لحماية الاتصال بالبيانات والخدمات السحابية (Circuit Breaker Resilience Pattern)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { logSecurityEvent } from './audit-guardian'; // 📊 تسجيل الإنذارات

// 🎛️ حالات قاطع الدائرة (Circuit States)
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number; // 🛑 عدد الإخفاقات المتتالية لفتح القاطع (افتراضي 5)
  recoveryTimeMs: number;    // ⏳ مدة الانتظار قبل اختبار العودة نصف المفتوحة (افتراضي 30 ثانية)
  timeoutMs: number;         // ⏱️ مهلة انتهاء الطلب (افتراضي 8 ثوانٍ)
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private nextAttemptTime = 0;
  private readonly config: CircuitBreakerConfig;
  private readonly name: string;

  constructor(name = 'SupabaseDatabaseCircuit', config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      recoveryTimeMs: config.recoveryTimeMs || 30 * 1000,
      timeoutMs: config.timeoutMs || 8 * 1000,
    };
  }

  // 🔍 معرفة حالة القاطع الحالية
  public getState(): CircuitState {
    const now = Date.now();
    if (this.state === 'OPEN' && now >= this.nextAttemptTime) {
      this.state = 'HALF_OPEN';
    }
    return this.state;
  }

  // 🚀 تنفيذ عملية محمية بقاطع الدائرة
  public async execute<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T> | T
  ): Promise<T> {
    const currentState = this.getState();

    // 🛑 إذا كان القاطع مفتوحاً -> تقديم البيانات الاحتياطية فوراً لحماية الخادم
    if (currentState === 'OPEN') {
      return fallback();
    }

    try {
      // ⏱️ تنفيذ الطلب مع مؤقت مهلة Timeout
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Operation timeout after ${this.config.timeoutMs}ms`)), this.config.timeoutMs)
        ),
      ]);

      // ✅ نجاح العملية -> تصفير العدادات والعودة للحالة المغلقة
      this.onSuccess();
      return result;

    } catch (err) {
      // 🚨 فشل العملية -> زيادة العداد وفحص تجاوز السقف
      this.onFailure(err as Error | object | string);
      return fallback();
    }
  }

  // ✅ تسجيل نجاح العملية
  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  // 🚨 تسجيل إخفاق العملية
  private onFailure(error: Error | object | string): void {
    this.failureCount++;
    const errMsg = error instanceof Error ? error.message : typeof error === 'string' ? error : 'خطأ غير محدد في اتصال البيانات';

    if (this.failureCount >= this.config.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.config.recoveryTimeMs;

      // 📊 تسجيل إنذار أمني لفتح القاطع
      logSecurityEvent({
        eventType: 'CIRCUIT_BREAKER_TRIGGERED',
        targetEntity: `CircuitBreaker [${this.name}]`,
        details: `🚨 تم فتح قاطع الدائرة (${this.name}) بسبب تكرار ${this.failureCount} أخطاء بالاتصال. الخطأ الأخير: "${errMsg}". سيتم تقديم الاستجابات البديلة لمدة ${Math.ceil(this.config.recoveryTimeMs / 1000)} ثانية.`,
        severity: 'CRITICAL',
      });
    }
  }
}

// 🌐 قاطع الدائرة العالمي لقاعدة بيانات المنظومة
export const globalSupabaseCircuit = new CircuitBreaker('GlobalSupabaseDatabase', {
  failureThreshold: 5,
  recoveryTimeMs: 20 * 1000,
  timeoutMs: 6 * 1000,
});
