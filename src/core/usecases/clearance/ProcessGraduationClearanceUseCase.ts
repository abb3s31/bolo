// 📜 حالة استخدام معالجة وتوثيق براءة الذمة الجامعية للتخرج (Process Graduation Clearance UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { GraduationClearance } from '@/core/domain/entities/GraduationClearance';
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج طلب معالجة براءة الذمة
export interface ProcessGraduationClearanceRequestDto {
  readonly clearanceId?: string; // 🆔 معرف البراءة القائم إن وجد
  readonly studentId: string; // 🎓 معرف الطالب
  readonly actionSection: 'department' | 'library' | 'accounts' | 'registration'; // 🏛️ القسم المعني
  readonly decision: 'approve' | 'reject'; // ✅ القرار
  readonly handledByUserId: string; // 👤 معرف المسؤول
  readonly handledByUserName: string; // 👤 اسم المسؤول
  readonly rejectionReason?: string; // 💬 سبب الرفض إن وجد
}

// 📤 نموذج استجابة معالجة براءة الذمة
export interface ProcessGraduationClearanceResponseDto {
  readonly clearance: GraduationClearance; // 📜 كيان براءة الذمة المحدث
  readonly isFullyCleared: boolean; // 🟢 هل اكتملت كافة التواقيع
  readonly message: string; // 💬 الرسالة
}

// 🧱 صنف حالة استخدام براءة الذمة
export class ProcessGraduationClearanceUseCase
  implements IUseCase<ProcessGraduationClearanceRequestDto, ProcessGraduationClearanceResponseDto>
{
  // 💉 حقن المستودعات
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly auditRepository: IActivityLogRepository
  ) {}

  // 🚀 تنفيذ معالجة براءة الذمة
  public async execute(
    request: ProcessGraduationClearanceRequestDto
  ): Promise<Result<ProcessGraduationClearanceResponseDto, string>> {
    try {
      // 🔍 1. جلب بيانات الطالب
      const student = await this.studentRepository.getById(request.studentId);
      if (!student) {
        return Result.fail('سجل الطالب غير موجود في المنظومة ❌');
      }

      // 🧱 2. إنشاء أو استخدام كيان براءة الذمة
      const clearance = new GraduationClearance({
        id: request.clearanceId || `clr-${Date.now()}-${student.id}`,
        studentId: student.id,
        studentName: student.fullName,
        universityNumber: student.universityNumber.getValue(),
        departmentId: student.departmentId,
        departmentName: student.departmentName,
        departmentClearance: request.actionSection === 'department' && request.decision === 'approve' ? 'cleared' : 'pending',
        libraryClearance: request.actionSection === 'library' && request.decision === 'approve' ? 'cleared' : 'pending',
        accountsClearance: request.actionSection === 'accounts' && request.decision === 'approve' ? 'cleared' : 'pending',
        registrationClearance: request.actionSection === 'registration' && request.decision === 'approve' ? 'cleared' : 'pending',
        isFullyCleared: false,
        issuedAt: new Date().toISOString(),
      });

      // ✏️ 3. تطبيق الإجراء
      if (request.decision === 'approve') {
        clearance.approveSection(request.actionSection);
      } else {
        clearance.rejectSection(request.actionSection, request.rejectionReason || 'تم تعليق براءة الذمة لوجود متعلقات.');
      }

      // 📜 4. تسجيل العملية في سجل التدقيق الأمني
      const log = new ActivityLog({
        id: `act-clr-${Date.now()}`,
        actorId: request.handledByUserId,
        actorName: request.handledByUserName,
        actorRole: 'admin',
        action: request.decision === 'approve' ? 'APPROVE_CLEARANCE_SECTION' : 'REJECT_CLEARANCE_SECTION',
        targetResource: `${student.fullName} - ${request.actionSection}`,
        details: `تم ${request.decision === 'approve' ? 'اعتماد' : 'تعليق'} براءة ذمة الطالب (${student.fullName}) في شعبة (${request.actionSection}) من قبل (${request.handledByUserName}).`,
        timestamp: new Date().toISOString(),
      });
      await this.auditRepository.log(log);

      return Result.ok({
        clearance,
        isFullyCleared: clearance.isFullyCleared,
        message: clearance.isFullyCleared
          ? `تهانينا! تم إكمال براءة الذمة الجامعية للطالب (${student.fullName}) بنجاح 🎓`
          : `تم تحديث حالة براءة الذمة لشعبة (${request.actionSection}) بنجاح 📋`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل معالجة براءة الذمة ❌';
      return Result.fail(errorMsg);
    }
  }
}
