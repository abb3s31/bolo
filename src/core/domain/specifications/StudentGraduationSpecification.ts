// 🎓 مواصفة استيفاء شروط التخرج وفق مسار بولونيا (Student Graduation Specification) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { ISpecification } from './ISpecification';
import { Student } from '../entities/Student';
import { Grade } from '../entities/Grade';
import { getStageNameInArabic } from '@/lib/grade-utils';

// 📥 نموذج بيانات تقييم التخرج
export interface StudentGraduationEvaluationContext {
  student: Student; // 🎓 كيان الطالب
  grades: Grade[]; // 📊 درجات الطالب
  totalCompletedCredits: number; // ⏳ إجمالي الساعات المعتمدة ECTS المنجزة
  requiredCredits?: number; // ⏳ الساعات المطلوبة (افتراضي 240 ECTS)
}

// 🧱 صنف مواصفة التخرج
export class StudentGraduationSpecification
  implements ISpecification<StudentGraduationEvaluationContext>
{
  // 🔍 فحص هل الطالب مؤهل للتخرج
  public isSatisfiedBy(context: StudentGraduationEvaluationContext): boolean {
    const minCredits = context.requiredCredits || 240;

    // 1. يجب أن يكون في المرحلة الرابعة
    if (context.student.stageNumber < 4) {
      return false;
    }

    // 2. يجب أن يحقق الحد الأدنى من الساعات المعتمدة
    if (context.totalCompletedCredits < minCredits) {
      return false;
    }

    // 3. يجب ألا تكون لديه أي مادة راسب بها
    const hasFailedCourses = context.grades.some(g => !g.isPassed());
    if (hasFailedCourses) {
      return false;
    }

    return true;
  }

  // 💬 توضيح أسباب عدم الاستيفاء
  public getUnsatisfiedReason(context: StudentGraduationEvaluationContext): string | null {
    const minCredits = context.requiredCredits || 240;

    if (context.student.stageNumber < 4) {
      return `الطالب في المرحلة ${getStageNameInArabic(context.student.stageNumber)} ولم يصل بعد لمرحلة التخرج (المرحلة الرابعة).`;
    }

    if (context.totalCompletedCredits < minCredits) {
      return `عدد الساعات المكتملة (${context.totalCompletedCredits} ECTS) أقل من الحد الأدنى المطلوب للتخرج (${minCredits} ECTS).`;
    }

    const failedCount = context.grades.filter(g => !g.isPassed()).length;
    if (failedCount > 0) {
      return `توجد (${failedCount}) مواد لم يتم اجتيازها بنجاح حتى الآن.`;
    }

    return null;
  }
}
