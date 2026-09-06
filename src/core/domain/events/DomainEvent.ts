// 📢 واجهة ونوع حدث النطاق (Domain Event Interface) - Clean Architecture & DDD

// 🏛️ واجهة حدث النطاق الأساسية
export interface IDomainEvent {
  readonly eventName: string; // 🏷️ اسم الحدث الفريد (مثال: STUDENT_CREATED)
  readonly occurredAt: string; // ⏰ التوقيت الدقيق لوقوع الحدث
  readonly aggregateId: string; // 🆔 معرف الكيان أو التجميع المرتبط بالحدث
}

// 🧱 الصنف التجريدي الأساسي لأحداث النطاق
export abstract class BaseDomainEvent implements IDomainEvent {
  public abstract readonly eventName: string;
  public readonly occurredAt: string;
  public readonly aggregateId: string;

  // 🏗️ المشيد
  constructor(aggregateId: string) {
    this.aggregateId = aggregateId;
    this.occurredAt = new Date().toISOString();
  }
}
