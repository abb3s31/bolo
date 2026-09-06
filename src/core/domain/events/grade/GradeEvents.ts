// 📊 أحداث النطاق الخاصة بالدرجات والتقييمات (Grade Domain Events) - Clean Architecture

// 📜 استيراد الصنف الأساسي
import { BaseDomainEvent } from '../DomainEvent';

// 📝 حدث رصد وتحديث درجة طالب
export class GradeSubmittedEvent extends BaseDomainEvent {
  public readonly eventName = 'GRADE_SUBMITTED';

  // 🏗️ المشيد
  constructor(
    public readonly gradeId: string, // 🆔 معرف سجل الدرجة
    public readonly studentId: string, // 🎓 معرف الطالب
    public readonly studentName: string, // 👤 اسم الطالب
    public readonly courseId: string, // 📚 معرف المادة
    public readonly courseName: string, // 📚 اسم المادة
    public readonly totalScore: number, // 📊 الدرجة الكلية
    public readonly isPassed: boolean // 🟢 هل ناجح أم راسب
  ) {
    super(gradeId);
  }
}

// 🔒 حدث قفل واعتماد درجات مادة بالكامل
export class CourseGradesLockedEvent extends BaseDomainEvent {
  public readonly eventName = 'COURSE_GRADES_LOCKED';

  // 🏗️ المشيد
  constructor(
    public readonly courseId: string,
    public readonly courseName: string,
    public readonly totalStudentsCount: number,
    public readonly lockedBy: string
  ) {
    super(courseId);
  }
}
