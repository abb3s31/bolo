//  حالة استخدام مراجعة وقبول/رفض عذر الغياب (Review Attendance Excuse UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { AttendanceExcuse } from '@/core/domain/entities/AttendanceExcuse';
import { IAttendanceRepository } from '@/core/domain/repositories/IAttendanceRepository';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج طلب مراجعة العذر
export interface ReviewAttendanceExcuseRequestDto {
  readonly excuse: AttendanceExcuse; // 📜 كيان العذر
  readonly decision: 'approve' | 'reject'; // ✅ القرار (قبول / رفض)
  readonly reviewerName: string; // 👤 اسم المراجع
  readonly reviewerRole: string; // 📜 دور المراجع
  readonly notes?: string; // 💬 الملاحظات
}

// 📤 نموذج استجابة المراجعة
export interface ReviewAttendanceExcuseResponseDto {
  readonly excuse: AttendanceExcuse; // 📜 كيان العذر المحدث
  readonly message: string; // 💬 الرسالة
}

// 🧱 صنف حالة استخدام مراجعة العذر
export class ReviewAttendanceExcuseUseCase
  implements IUseCase<ReviewAttendanceExcuseRequestDto, ReviewAttendanceExcuseResponseDto>
{
  // 💉 حقن مستودع الحضور ومستودع التدقيق
  constructor(
    private readonly attendanceRepository: IAttendanceRepository,
    private readonly auditRepository: IActivityLogRepository
  ) {}

  // 🚀 تنفيذ مراجعة العذر
  public async execute(
    request: ReviewAttendanceExcuseRequestDto
  ): Promise<Result<ReviewAttendanceExcuseResponseDto, string>> {
    try {
      const excuse = request.excuse;

      if (request.decision === 'approve') {
        excuse.approve(request.reviewerName, request.notes);

        // 🔄 تحديث سجل الحضور ليصبح (مجاز / excused)
        const records = await this.attendanceRepository.getByStudentAndCourse(
          excuse.studentId,
          excuse.courseId
        );
        const targetRecord = records.find(r => r.date === excuse.absenceDate);
        if (targetRecord) {
          targetRecord.updateStatus('excused', `عذر مقبول: ${excuse.reason}`);
          await this.attendanceRepository.save(targetRecord);
        }
      } else {
        excuse.reject(request.reviewerName, request.notes || 'تم رفض العذر من قبل الإدارة.');
      }

      // 📜 تسجيل العملية في سجل التدقيق
      const log = new ActivityLog({
        id: `act-rev-${Date.now()}`,
        actorId: request.reviewerName,
        actorName: request.reviewerName,
        actorRole: request.reviewerRole,
        action: request.decision === 'approve' ? 'APPROVE_EXCUSE' : 'REJECT_EXCUSE',
        targetResource: `${excuse.studentName} - ${excuse.courseName}`,
        details: `تم ${request.decision === 'approve' ? 'قبول' : 'رفض'} عذر الطالب (${excuse.studentName}) لمادة (${excuse.courseName}) لتاريخ (${excuse.absenceDate}).`,
        timestamp: new Date().toISOString(),
      });
      await this.auditRepository.log(log);

      return Result.ok({
        excuse,
        message: `تم ${request.decision === 'approve' ? 'قبول' : 'رفض'} عذر الغياب بنجاح`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل مراجعة عذر الغياب ❌';
      return Result.fail(errorMsg);
    }
  }
}
