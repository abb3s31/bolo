// 💳 حالة استخدام إدارة وتسجيل الأقساط الدراسية (Manage Tuition UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { TuitionRecord } from '@/core/domain/entities/TuitionRecord';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج طلب تسجيل دفعة قسط دراسي
export interface RecordTuitionPaymentRequestDto {
  readonly recordId?: string; // 🆔 معرف السجل القائم إن وجد
  readonly studentId: string; // 🎓 معرف الطالب
  readonly studentName: string; // 👤 اسم الطالب
  readonly academicYear: string; // 🗓️ السنة الدراسية
  readonly totalAnnualTuition: number; // 💰 القسط السنوي الإجمالي
  readonly paymentAmount: number; // 💵 مبلغ الدفعة الحالية
  readonly receiptNumber: string; // 🧾 رقم وصل القبض المحاسبي
  readonly recordedByUserId: string; // 👤 معرف المحاسب أو المسؤول
  readonly recordedByUserName: string; // 👤 اسم المحاسب
}

// 📤 نموذج استجابة تسجيل الدفعة
export interface RecordTuitionPaymentResponseDto {
  readonly record: TuitionRecord; // 💳 كيان السجل المالي
  readonly remainingAmount: number; // 📉 المبلغ المتبقي
  readonly isFullyPaid: boolean; // 🟢 هل تم السداد الكامل
  readonly message: string; // 💬 رسالة التوضيح
}

// 🧱 صنف حالة استخدام إدارة الأقساط
export class ManageStudentTuitionUseCase
  implements IUseCase<RecordTuitionPaymentRequestDto, RecordTuitionPaymentResponseDto>
{
  // 💉 حقن مستودع التدقيق
  constructor(private readonly auditRepository: IActivityLogRepository) {}

  // 🚀 تنفيذ تسجيل الدفعة
  public async execute(
    request: RecordTuitionPaymentRequestDto
  ): Promise<Result<RecordTuitionPaymentResponseDto, string>> {
    try {
      if (request.paymentAmount <= 0) {
        return Result.fail('مبلغ الدفعة يجب أن يكون أكبر من الصفر ⚠️');
      }

      if (!request.receiptNumber || request.receiptNumber.trim().length === 0) {
        return Result.fail('رقم وصل القبض مطلوب لتوثيق الدفعة رسمياً 🧾⚠️');
      }

      // 🧱 بناء أو تحديث الكيان
      const tuition = new TuitionRecord({
        id: request.recordId || `tui-${Date.now()}-${request.studentId}`,
        studentId: request.studentId,
        studentName: request.studentName,
        academicYear: request.academicYear,
        totalAmount: request.totalAnnualTuition,
        paidAmount: 0,
        remainingAmount: request.totalAnnualTuition,
        status: 'pending',
      });

      // 💵 تسجيل الدفعة
      tuition.recordPayment(request.paymentAmount, request.receiptNumber.trim());

      // 📜 تسجيل العملية في سجل التدقيق المالي
      const log = new ActivityLog({
        id: `act-tui-${Date.now()}`,
        actorId: request.recordedByUserId,
        actorName: request.recordedByUserName,
        actorRole: 'admin',
        action: 'RECORD_TUITION_PAYMENT',
        targetResource: `${request.studentName} - وصل ${request.receiptNumber}`,
        details: `تم استلام دفعة قسط بمبلغ (${request.paymentAmount.toLocaleString()} د.ع) للطالب (${request.studentName}) بموجب الوصل رقم (${request.receiptNumber}). المتبقي: (${tuition.remainingAmount.toLocaleString()} د.ع).`,
        timestamp: new Date().toISOString(),
      });
      await this.auditRepository.log(log);

      return Result.ok({
        record: tuition,
        remainingAmount: tuition.remainingAmount,
        isFullyPaid: tuition.status === 'paid_full',
        message: `تم تسجيل الدفعة وإصدار إشعار القبض بنجاح. المتبقي: ${tuition.remainingAmount.toLocaleString()} د.ع 🧾`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل تسجيل دفعة القسط ❌';
      return Result.fail(errorMsg);
    }
  }
}
