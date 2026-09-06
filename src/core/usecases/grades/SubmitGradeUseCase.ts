// 📊 حالة استخدام رصد وتعديل الدرجات الأكاديمية (Submit Grade UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { SubmitGradeRequestDto, SubmitGradeResponseDto } from './dtos/GradeDtos';
import { IGradeRepository } from '@/core/domain/repositories/IGradeRepository';
import { Grade } from '@/core/domain/entities/Grade';
import { GradeScore } from '@/core/domain/value-objects/GradeScore';

// 🧱 صنف حالة استخدام رصد الدرجة
export class SubmitGradeUseCase
  implements IUseCase<SubmitGradeRequestDto, SubmitGradeResponseDto>
{
  // 💉 حقن مستودع الدرجات
  constructor(private readonly gradeRepository: IGradeRepository) {}

  // 🚀 تنفيذ رصد الدرجة
  public async execute(
    request: SubmitGradeRequestDto
  ): Promise<Result<SubmitGradeResponseDto, string>> {
    try {
      // 🔍 البحث عن سجل درجات موجود للطالب
      const existingGrade = await this.gradeRepository.getByStudentAndCourse(
        request.studentId,
        request.courseId,
        request.academicYear
      );

      let targetGrade: Grade;

      if (existingGrade) {
        // ✏️ تحديث السجل القائم
        existingGrade.updateScores(
          request.midtermScore,
          request.courseworkScore,
          request.finalExamScore
        );
        targetGrade = existingGrade;
      } else {
        // 🧱 بناء سجل درجات جديد
        targetGrade = new Grade({
          id: `grd-${Date.now()}-${request.studentId}`,
          studentId: request.studentId,
          studentName: request.studentName,
          courseId: request.courseId,
          courseName: request.courseName,
          academicYear: request.academicYear,
          midtermScore:
            request.midtermScore !== undefined
              ? GradeScore.create(request.midtermScore)
              : undefined,
          courseworkScore:
            request.courseworkScore !== undefined
              ? GradeScore.create(request.courseworkScore)
              : undefined,
          finalExamScore:
            request.finalExamScore !== undefined
              ? GradeScore.create(request.finalExamScore)
              : undefined,
        });
      }

      // 💾 حفظ السجل في المستودع
      await this.gradeRepository.save(targetGrade);

      // 🧮 حساب القيم الراجعة
      const totalScoreVal = targetGrade.totalScore ? targetGrade.totalScore.getValue() : 0;
      const letterRating = targetGrade.totalScore
        ? targetGrade.totalScore.getLetterRating()
        : 'قيد الإكمال';
      const isPassed = targetGrade.totalScore ? targetGrade.totalScore.isPassed() : false;

      // 🎯 إرجاع النتيجة
      return Result.ok({
        grade: targetGrade,
        totalScore: totalScoreVal,
        letterRating,
        isPassed,
        message: 'تم حفظ ورصد الدرجة الأكاديمية بنجاح',
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل رصد الدرجة ❌';
      return Result.fail(errorMsg);
    }
  }
}
