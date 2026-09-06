// 📚 مواصفة فحص المتطلبات السابقة للمادة الدراسية (Course Prerequisites Specification) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { ISpecification } from './ISpecification';
import { Grade } from '../entities/Grade';

// 📥 سياق تقييم استيفاء المتطلب السابق
export interface CoursePrerequisiteContext {
  readonly targetCourseName: string; // 📚 اسم المادة المراد تسجيلها
  readonly prerequisiteCourseIds: string[]; // 🆔 معرفات المواد المتطلبة السابقة
  readonly studentGrades: Grade[]; // 📊 درجات الطالب السابقة
  readonly requestedTotalCredits: number; // ⏳ إجمالي الساعات المطلوبة لهذا الفصل
  readonly maxAllowedCreditsPerSemester?: number; // ⏳ الحد الأقصى للساعات المعتمدة (افتراضي 30 ECTS)
}

// 🧱 صنف مواصفة المتطلب السابق
export class CoursePrerequisitesSpecification
  implements ISpecification<CoursePrerequisiteContext>
{
  // 🔍 فحص هل الطالب مستوفٍ للشروط ومؤهل لتسجيل المادة
  public isSatisfiedBy(context: CoursePrerequisiteContext): boolean {
    const maxCredits = context.maxAllowedCreditsPerSemester || 30;

    // 1. فحص الحد الأقصى للساعات المعتمدة في الفصل الواحد (لا يتجاوز 30 ECTS)
    if (context.requestedTotalCredits > maxCredits) {
      return false;
    }

    // 2. إذا لم تكن هناك متطلبات سابقة للمادة، يمكن التسجيل مباشرة
    if (context.prerequisiteCourseIds.length === 0) {
      return true;
    }

    // 3. التحقق من نجاح الطالب في كافة المواد المتطلبة السابقة
    for (const prereqId of context.prerequisiteCourseIds) {
      const passed = context.studentGrades.some(
        g => g.courseId === prereqId && g.isPassed()
      );
      if (!passed) {
        return false;
      }
    }

    return true;
  }

  // 💬 توضيح سبب عدم الاستيفاء إن وجد
  public getUnsatisfiedReason(context: CoursePrerequisiteContext): string | null {
    const maxCredits = context.maxAllowedCreditsPerSemester || 30;

    if (context.requestedTotalCredits > maxCredits) {
      return `إجمالي الساعات المسجلة (${context.requestedTotalCredits} ECTS) يتجاوز الحد الأقصى المسموح به فصلياً (${maxCredits} ECTS).`;
    }

    for (const prereqId of context.prerequisiteCourseIds) {
      const passed = context.studentGrades.some(
        g => g.courseId === prereqId && g.isPassed()
      );
      if (!passed) {
        return `لم يجتز الطالب المتطلب السابق الإجباري لمادة (${context.targetCourseName}).`;
      }
    }

    return null;
  }
}
