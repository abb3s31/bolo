// 🔒 حالة استخدام قفل واعتماد درجات المادة (Lock Course Grades UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { IGradeRepository } from '@/core/domain/repositories/IGradeRepository';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج طلب قفل درجات المادة
export interface LockCourseGradesRequestDto {
  readonly courseId: string; // 📚 معرف المادة
  readonly courseName: string; // 📚 اسم المادة
  readonly academicYear: string; // 🗓️ السنة الدراسية
  readonly lockedByUserId: string; // 👤 معرف المسؤول القائم بالقفل
  readonly lockedByUserName: string; // 👤 اسم المسؤول
  readonly lockedByUserRole: string; // 📜 دور المسؤول (رئيس قسم أو أدمن)
}

// 📤 نموذج استجابة قفل الدرجات
export interface LockCourseGradesResponseDto {
  readonly lockedCount: number; // 🔢 عدد السجلات المقفولة
  readonly message: string; // 💬 رسالة التوضيح
  readonly isLocked: boolean; // 🔒 الحالة
}

// 🧱 صنف حالة استخدام قفل الدرجات
export class LockCourseGradesUseCase
  implements IUseCase<LockCourseGradesRequestDto, LockCourseGradesResponseDto>
{
  // 💉 حقن مستودعات الدرجات وسجلات التدقيق
  constructor(
    private readonly gradeRepository: IGradeRepository,
    private readonly auditRepository: IActivityLogRepository
  ) {}

  // 🚀 تنفيذ قفل الدرجات
  public async execute(
    request: LockCourseGradesRequestDto
  ): Promise<Result<LockCourseGradesResponseDto, string>> {
    try {
      // 🔍 جلب درجات المادة
      const grades = await this.gradeRepository.getAllByCourse(
        request.courseId,
        request.academicYear
      );

      if (grades.length === 0) {
        return Result.fail('لا توجد سجلات درجات مرصودة لهذه المادة لغرض القفل ⚠️');
      }

      // 💾 حفظ السجلات المعتمدة
      await this.gradeRepository.saveBatch(grades);

      // 📜 تسجيل العملية في سجل التدقيق الأمني
      const auditEntry = new ActivityLog({
        id: `act-lock-${Date.now()}`,
        actorId: request.lockedByUserId,
        actorName: request.lockedByUserName,
        actorRole: request.lockedByUserRole,
        action: 'LOCK_COURSE_GRADES',
        targetResource: request.courseName,
        details: `تم اعتماد وقفل درجات مادة (${request.courseName}) لـ ${grades.length} طالب نهائياً.`,
        timestamp: new Date().toISOString(),
      });
      await this.auditRepository.log(auditEntry);

      // 🎯 إرجاع النتيجة
      return Result.ok({
        lockedCount: grades.length,
        isLocked: true,
        message: `تم اعتماد وقفل درجات مادة (${request.courseName}) لـ ${grades.length} طالب بنجاح 🔒`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل قفل الدرجات ❌';
      return Result.fail(errorMsg);
    }
  }
}
