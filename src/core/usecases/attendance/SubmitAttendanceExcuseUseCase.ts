// 📝 حالة استخدام تقديم عذر غياب (Submit Attendance Excuse UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { AttendanceExcuse } from '@/core/domain/entities/AttendanceExcuse';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج طلب تقديم عذر غياب
export interface SubmitAttendanceExcuseRequestDto {
  readonly studentId: string; // 🎓 معرف الطالب
  readonly studentName: string; // 👤 اسم الطالب
  readonly courseId: string; // 📚 معرف المادة
  readonly courseName: string; // 📚 اسم المادة
  readonly absenceDate: string; // 🗓️ تاريخ الغياب
  readonly reason: string; // 📝 تفاصيل العذر
  readonly attachmentUrl?: string; // 📎 رابط المرفق
}

// 📤 نموذج استجابة تقديم العذر
export interface SubmitAttendanceExcuseResponseDto {
  readonly excuse: AttendanceExcuse; // 📜 كيان العذر
  readonly message: string; // 💬 الرسالة
}

// 🧱 صنف حالة استخدام تقديم العذر
export class SubmitAttendanceExcuseUseCase
  implements IUseCase<SubmitAttendanceExcuseRequestDto, SubmitAttendanceExcuseResponseDto>
{
  // 💉 حقن مستودع التدقيق
  constructor(private readonly auditRepository: IActivityLogRepository) {}

  // 🚀 تنفيذ التقديم
  public async execute(
    request: SubmitAttendanceExcuseRequestDto
  ): Promise<Result<SubmitAttendanceExcuseResponseDto, string>> {
    try {
      if (!request.reason || request.reason.trim().length === 0) {
        return Result.fail('يرجى كتابة سبب وتفاصيل العذر بوضوح ⚠️');
      }

      // 🧱 إنشاء كيان العذر
      const newExcuse = new AttendanceExcuse({
        id: `exc-${Date.now()}-${request.studentId}`,
        studentId: request.studentId,
        studentName: request.studentName,
        courseId: request.courseId,
        courseName: request.courseName,
        absenceDate: request.absenceDate,
        reason: request.reason.trim(),
        attachmentUrl: request.attachmentUrl,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      });

      // 📜 تسجيل العملية في سجل التدقيق
      const log = new ActivityLog({
        id: `act-exc-${Date.now()}`,
        actorId: request.studentId,
        actorName: request.studentName,
        actorRole: 'student',
        action: 'SUBMIT_ATTENDANCE_EXCUSE',
        targetResource: request.courseName,
        details: `قام الطالب (${request.studentName}) بتقديم طلب عذر غياب عن محاضرة (${request.courseName}) لتاريخ (${request.absenceDate}).`,
        timestamp: new Date().toISOString(),
      });
      await this.auditRepository.log(log);

      return Result.ok({
        excuse: newExcuse,
        message: 'تم إرسال طلب عذر الغياب إلى أستاذ المادة ورئاسة القسم بنجاح 📋',
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل إرسال طلب العذر ❌';
      return Result.fail(errorMsg);
    }
  }
}
