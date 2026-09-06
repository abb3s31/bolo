// 🎓 أحداث النطاق الخاصة بالطلاب (Student Domain Events) - Clean Architecture

// 📜 استيراد الصنف الأساسي
import { BaseDomainEvent } from '../DomainEvent';

// 🌟 حدث إنشاء وقبول طالب جديد
export class StudentCreatedEvent extends BaseDomainEvent {
  public readonly eventName = 'STUDENT_CREATED';

  // 🏗️ المشيد
  constructor(
    public readonly studentId: string, // 🎓 معرف الطالب
    public readonly fullName: string, // 👤 اسم الطالب
    public readonly email: string, // 📧 البريد الجامعي
    public readonly departmentName: string, // 🏛️ القسم
    public readonly stageNumber: number // 🔢 المرحلة
  ) {
    super(studentId);
  }
}

// 🎓 حدث ترقية طالب للمرحلة التالية
export class StudentPromotedEvent extends BaseDomainEvent {
  public readonly eventName = 'STUDENT_PROMOTED';

  // 🏗️ المشيد
  constructor(
    public readonly studentId: string,
    public readonly fullName: string,
    public readonly previousStage: number,
    public readonly newStage: number
  ) {
    super(studentId);
  }
}
