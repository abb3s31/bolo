// 📋 أحداث النطاق الخاصة بالحضور والغياب (Attendance Domain Events) - Clean Architecture

// 📜 استيراد الصنف الأساسي
import { BaseDomainEvent } from '../DomainEvent';

// ⚠️ حدث تسجيل غياب طالب عن محاضرة
export class StudentMarkedAbsentEvent extends BaseDomainEvent {
  public readonly eventName = 'STUDENT_MARKED_ABSENT';

  // 🏗️ المشيد
  constructor(
    public readonly studentId: string, // 🎓 معرف الطالب
    public readonly studentName: string, // 👤 اسم الطالب
    public readonly courseId: string, // 📚 معرف المادة
    public readonly courseName: string, // 📚 اسم المادة
    public readonly date: string // 🗓️ تاريخ المحاضرة
  ) {
    super(studentId);
  }
}
