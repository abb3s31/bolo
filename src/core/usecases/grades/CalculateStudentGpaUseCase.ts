// 🧮 حالة استخدام احتساب المعدل الفصلي والتراكمي (Calculate Student GPA UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { IGradeRepository } from '@/core/domain/repositories/IGradeRepository';
import { ICourseRepository } from '@/core/domain/repositories/ICourseRepository';

// 📥 نموذج طلب احتساب المعدل
export interface CalculateGpaRequestDto {
  readonly studentId: string; // 🎓 معرف الطالب
  readonly academicYear?: string; // 🗓️ السنة الدراسية
}

// 📤 نموذج مخرجات المعدل المحسوب
export interface CalculateGpaResponseDto {
  readonly studentId: string; // 🎓 معرف الطالب
  readonly totalCourses: number; // 📚 عدد المواد
  readonly totalPassedCourses: number; // 🟢 عدد المواد الناجح بها
  readonly totalFailedCourses: number; // 🔴 عدد المواد الراسب بها
  readonly totalCredits: number; // ⏳ إجمالي الساعات المعتمدة ECTS
  readonly gpaPercentage: number; // 📊 المعدل المئوي العام (0 - 100)
  readonly letterRating: string; // 🏆 التقدير الأكاديمي العام (امتياز، جيد جداً...)
  readonly isEligibleForGraduation: boolean; // 🎓 هل مؤهل للتخرج
}

// 🧱 صنف حالة استخدام احتساب المعدل
export class CalculateStudentGpaUseCase
  implements IUseCase<CalculateGpaRequestDto, CalculateGpaResponseDto>
{
  // 💉 حقن مستودعات الدرجات والمواد
  constructor(
    private readonly gradeRepository: IGradeRepository,
    private readonly courseRepository: ICourseRepository
  ) {}

  // 🚀 تنفيذ الحساب
  public async execute(
    request: CalculateGpaRequestDto
  ): Promise<Result<CalculateGpaResponseDto, string>> {
    try {
      // 🔍 جلب جميع درجات الطالب
      const grades = await this.gradeRepository.getAllByStudent(
        request.studentId,
        request.academicYear
      );

      if (grades.length === 0) {
        return Result.fail('لا توجد سجلات درجات مرصودة لهذا الطالب ⚠️');
      }

      // 📥 جلب جميع المواد لحساب الأوزان والساعات المعتمدة
      const allCourses = await this.courseRepository.getAll();
      const courseMap = new Map(allCourses.map(c => [c.id, c]));

      let weightedSum = 0;
      let totalCredits = 0;
      let passedCount = 0;
      let failedCount = 0;

      for (const grade of grades) {
        const score = grade.totalScore ? grade.totalScore.getValue() : 0;
        const course = courseMap.get(grade.courseId);
        const credits = course ? course.creditHours : 3; // افتراض 3 ساعات ECTS

        weightedSum += score * credits;
        totalCredits += credits;

        if (score >= 50) {
          passedCount += 1;
        } else {
          failedCount += 1;
        }
      }

      const gpa = totalCredits > 0 ? Math.round((weightedSum / totalCredits) * 100) / 100 : 0;

      // 🏆 تحديد التقدير العام
      let rating = 'راسب';
      if (gpa >= 90) rating = 'امتياز';
      else if (gpa >= 80) rating = 'جيد جداً';
      else if (gpa >= 70) rating = 'جيد';
      else if (gpa >= 60) rating = 'متوسط';
      else if (gpa >= 50) rating = 'مقبول';

      // 🎯 إرجاع النتيجة المحسوبة
      return Result.ok({
        studentId: request.studentId,
        totalCourses: grades.length,
        totalPassedCourses: passedCount,
        totalFailedCourses: failedCount,
        totalCredits,
        gpaPercentage: gpa,
        letterRating: rating,
        isEligibleForGraduation: failedCount === 0 && gpa >= 50,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل احتساب المعدل ❌';
      return Result.fail(errorMsg);
    }
  }
}
