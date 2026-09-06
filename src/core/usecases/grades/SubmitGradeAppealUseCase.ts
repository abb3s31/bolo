// 📝 حالة استخدام تقديم اعتراض على نتيجة امتحان (Submit Grade Appeal UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { GradeAppeal } from '@/core/domain/entities/GradeAppeal';
import { IGradeRepository } from '@/core/domain/repositories/IGradeRepository';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج طلب تقديم الاعتراض
export interface SubmitGradeAppealRequestDto {
  readonly studentId: string; // 🎓 معرف الطالب
  readonly studentName: string; // 👤 اسم الطالب
  readonly courseId: string; // 📚 معرف المادة
  readonly courseName: string; // 📚 اسم المادة
  readonly academicYear: string; // 🗓️ السنة الدراسية
  readonly reason: string; // 📝 تفاصيل وسبب الاعتراض
}

// 📤 نموذج استجابة تقديم الاعتراض
export interface SubmitGradeAppealResponseDto {
  readonly appeal: GradeAppeal; // 📜 كيان الاعتراض
  readonly message: string; // 💬 الرسالة
}

// 🧱 صنف حالة استخدام تقديم الاعتراض
export class SubmitGradeAppealUseCase
  implements IUseCase<SubmitGradeAppealRequestDto, SubmitGradeAppealResponseDto>
{
  // 💉 حقن المستودعات
  constructor(
    private readonly gradeRepository: IGradeRepository,
    private readonly auditRepository: IActivityLogRepository
  ) {}

  // 🚀 تنفيذ التقديم
  public async execute(
    request: SubmitGradeAppealRequestDto
  ): Promise<Result<SubmitGradeAppealResponseDto, string>> {
    try {
      if (!request.reason || request.reason.trim().length === 0) {
        return Result.fail('يرجى توضيح سبب الاعتراض بالتفصيل ⚠️');
      }

      // 🔍 1. جلب الدرجة المعترض عليها
      const grade = await this.gradeRepository.getByStudentAndCourse(
        request.studentId,
        request.courseId,
        request.academicYear
      );

      if (!grade) {
        return Result.fail('لا يوجد سجل درجات مسجل لهذه المادة لتقديم اعتراض ❌');
      }

      const originalScore = grade.totalScore ? grade.totalScore.getValue() : 0;

      // 🧱 2. إنشاء كيان الاعتراض
      const appeal = new GradeAppeal({
        id: `apl-${Date.now()}-${request.studentId}`,
        studentId: request.studentId,
        studentName: request.studentName,
        courseId: request.courseId,
        courseName: request.courseName,
        academicYear: request.academicYear,
        originalFinalScore: originalScore,
        studentObjectionReason: request.reason.trim(),
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      });

      // 📜 3. تسجيل العملية في سجل التدقيق
      const log = new ActivityLog({
        id: `act-apl-${Date.now()}`,
        actorId: request.studentId,
        actorName: request.studentName,
        actorRole: 'student',
        action: 'SUBMIT_GRADE_APPEAL',
        targetResource: `${request.courseName} - ${originalScore}`,
        details: `قام الطالب (${request.studentName}) بتقديم اعتراض رسمي على نتيجة مادة (${request.courseName}) للدرجة (${originalScore}).`,
        timestamp: new Date().toISOString(),
      });
      await this.auditRepository.log(log);

      return Result.ok({
        appeal,
        message: 'تم تسجيل طلب الاعتراض وإحالته إلى اللجنة الامتحانية للتدقيق والمطابقة 📋',
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل تقديم الاعتراض ❌';
      return Result.fail(errorMsg);
    }
  }
}
