// 🗓️ مواصفة منع تعارض وضمان فترات الراحة بين الامتحانات - Clean Architecture & SOLID OCP

// 📜 استيراد العقود
import { ISpecification } from './ISpecification';

// 📥 نموذج الامتحان المجدول
export interface ScheduledExamSlot {
  readonly examId: string; // 🆔 معرف الامتحان
  readonly courseId: string; // 📚 معرف المادة
  readonly courseName: string; // 📚 اسم المادة
  readonly departmentId: string; // 🏛️ معرف القسم
  readonly stageNumber: number; // 🎓 المرحلة
  readonly examDate: string; // 🗓️ تاريخ الامتحان (YYYY-MM-DD)
  readonly startTime: string; // ⏰ وقت البدء (09:00)
}

// 📥 سياق تقييم تعارض الامتحانات
export interface ExamConflictContext {
  readonly targetDepartmentId: string; // 🏛️ معرف القسم
  readonly targetStageNumber: number; // 🎓 المرحلة
  readonly proposedExamDate: string; // 🗓️ التاريخ المقترح للامتحان
  readonly existingExams: ScheduledExamSlot[]; // 📋 قائمة الامتحانات المجدولة بالفعل
}

// 🧱 صنف مواصفة فحص تعارض الامتحانات
export class ExamScheduleConflictSpecification
  implements ISpecification<ExamConflictContext>
{
  // 🔍 فحص هل الجدول المقترح سليم وخالٍ من التعارض (True = سليم، False = متعارض)
  public isSatisfiedBy(context: ExamConflictContext): boolean {
    const conflicts = context.existingExams.filter(exam => {
      // فحص نفس القسم ونفس المرحلة
      if (
        exam.departmentId === context.targetDepartmentId &&
        exam.stageNumber === context.targetStageNumber
      ) {
        // 1. تعارض في نفس اليوم تماماً
        if (exam.examDate === context.proposedExamDate) {
          return true;
        }

        // 2. فحص هل يوجد فاصل زمني (يوم راحة) بين الامتحانين
        const proposedTime = new Date(context.proposedExamDate).getTime();
        const existingTime = new Date(exam.examDate).getTime();
        const diffDays = Math.abs(proposedTime - existingTime) / (1000 * 60 * 60 * 24);

        if (diffDays < 1) {
          return true;
        }
      }
      return false;
    });

    return conflicts.length === 0;
  }

  // 💬 توضيح سبب التعارض
  public getUnsatisfiedReason(context: ExamConflictContext): string | null {
    const sameDay = context.existingExams.find(
      e =>
        e.departmentId === context.targetDepartmentId &&
        e.stageNumber === context.targetStageNumber &&
        e.examDate === context.proposedExamDate
    );

    if (sameDay) {
      return `يوجد امتحان آخر مجدول في نفس اليوم لمادة (${sameDay.courseName}) لنفس المرحلة.`;
    }

    return null;
  }
}
