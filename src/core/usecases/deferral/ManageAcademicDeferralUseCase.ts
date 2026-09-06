// ⏸️ حالة استخدام إدارة ومعالجة قرارات التأجيل واستئناف القيد الأكاديمي (Manage Academic Deferral UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { AcademicDeferral, AcademicDeferralType } from '@/core/domain/entities/AcademicDeferral';
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { INotificationRepository } from '@/core/domain/repositories/INotificationRepository';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';
import { Notification } from '@/core/domain/entities/Notification';

// 📥 نموذج طلب إدارة معاملات التأجيل
export interface ManageAcademicDeferralRequestDto {
  readonly deferralId?: string; // 🆔 معرف المعاملة إن وجد
  readonly studentId: string; // 🎓 معرف الطالب
  readonly deferralType: AcademicDeferralType; // 🏷️ نوع الطلب
  readonly academicYear: string; // 🗓️ السنة
  readonly reason: string; // 📝 السبب
  readonly supportingDocumentUrl?: string; // 📎 المرفق
  readonly actionType: 'submit_request' | 'approve_decision' | 'reject_decision'; // 🎯 نوع الإجراء
  readonly boardDecisionNumber?: string; // ⚖️ رقم القرار
  readonly boardNotes?: string; // 💬 ملاحظات المجلس
  readonly handledByUserId: string; // 👤 معرف المسؤول
  readonly handledByUserName: string; // 👤 اسم المسؤول
}

// 📤 نموذج استجابة معاملة التأجيل
export interface ManageAcademicDeferralResponseDto {
  readonly deferral: AcademicDeferral; // 📜 كيان المعاملة المحدث
  readonly isStudentStatusUpdated: boolean; // 🟢 هل تم تغيير حالة قيد الطالب
  readonly message: string; // 💬 الرسالة
}

// 🧱 صنف حالة استخدام إدارة التأجيل واستئناف القيد
export class ManageAcademicDeferralUseCase
  implements IUseCase<ManageAcademicDeferralRequestDto, ManageAcademicDeferralResponseDto>
{
  // 💉 حقن المستودعات
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly auditRepository: IActivityLogRepository
  ) {}

  // 🚀 تنفيذ إدارة ومعالجة الطلب
  public async execute(
    request: ManageAcademicDeferralRequestDto
  ): Promise<Result<ManageAcademicDeferralResponseDto, string>> {
    try {
      // 🔍 1. جلب الطالب
      const student = await this.studentRepository.getById(request.studentId);
      if (!student) {
        return Result.fail('سجل الطالب غير موجود في المنظومة ❌');
      }

      // 🧱 2. بناء كيان المعاملة
      const deferral = new AcademicDeferral({
        id: request.deferralId || `def-${Date.now()}-${student.id}`,
        studentId: student.id,
        studentName: student.fullName,
        universityNumber: student.universityNumber.getValue(),
        departmentId: student.departmentId,
        departmentName: student.departmentName,
        stageNumber: student.stageNumber,
        academicYear: request.academicYear,
        deferralType: request.deferralType,
        reason: request.reason,
        supportingDocumentUrl: request.supportingDocumentUrl,
        status: 'pending_review',
        requestedAt: new Date().toISOString(),
      });

      let isStudentUpdated = false;

      // ⚖️ 3. تطبيق قرارات المجلس وتحديث حالة قيد الطالب في النظام
      if (request.actionType === 'approve_decision' && request.boardDecisionNumber) {
        deferral.approveByBoard(request.boardDecisionNumber, request.boardNotes);

        if (request.deferralType === 'year_deferral' || request.deferralType === 'semester_deferral') {
          student.deactivate(); // تجميد/تأجيل القيد
          await this.studentRepository.save(student);
          isStudentUpdated = true;
        } else if (request.deferralType === 'resume_study') {
          student.activate(); // إعادة تنشيط واستئناف القيد
          await this.studentRepository.save(student);
          isStudentUpdated = true;
        } else if (request.deferralType === 'dismissal_withdrawal') {
          student.deactivate(); // ترقين القيد
          await this.studentRepository.save(student);
          isStudentUpdated = true;
        }

        // 🔔 بث إشعار للطالب
        const notif = new Notification({
          id: `notif-def-${Date.now()}`,
          title: '⚖️ صدور أمر مجلس الكلية بشأن القيد الأكاديمي',
          message: `صدر أمر مجلس الكلية ذي الرقم (${request.boardDecisionNumber}) بالموافقة على معاملة (${this.formatType(request.deferralType)}) للعام الدراسي (${request.academicYear}).`,
          targetRole: 'students',
          targetDepartmentId: student.departmentId,
          type: 'administrative',
          createdAt: new Date().toISOString(),
          isRead: false,
        });
        await this.notificationRepository.save(notif);
      } else if (request.actionType === 'reject_decision') {
        deferral.rejectByBoard(request.boardNotes || 'لم يستوفِ الطالب شروط وضوابط التأجيل المقررة.');
      }

      // 📜 4. توثيق العملية في سجل التدقيق الأمني
      const log = new ActivityLog({
        id: `act-def-${Date.now()}`,
        actorId: request.handledByUserId,
        actorName: request.handledByUserName,
        actorRole: 'college_board_secretary',
        action: 'MANAGE_ACADEMIC_DEFERRAL',
        targetResource: `${student.fullName} - ${this.formatType(request.deferralType)}`,
        details: `تم تنفيذ إجراء (${request.actionType}) لمعاملة (${this.formatType(request.deferralType)}) للطالب (${student.fullName}). الموقف: (${deferral.status}).`,
        timestamp: new Date().toISOString(),
      });
      await this.auditRepository.log(log);

      return Result.ok({
        deferral,
        isStudentStatusUpdated: isStudentUpdated,
        message: deferral.status === 'approved_by_board'
          ? `تم اعتماد أمر مجلس الكلية برقم (${deferral.boardDecisionNumber}) وتحديث حالة قيد الطالب (${student.fullName}) بنجاح ⚖️`
          : deferral.status === 'rejected'
          ? `تم تسجيل قرار رفض طلب المعاملة للطالب (${student.fullName}) ⚠️`
          : `تم تسجيل طلب (${this.formatType(request.deferralType)}) وإحالته لمجلس الكلية 📋`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل إدارة معاملة القيد الأكاديمي ❌';
      return Result.fail(errorMsg);
    }
  }

  // 🏷️ تعريب نوع المعاملة
  private formatType(type: AcademicDeferralType): string {
    switch (type) {
      case 'year_deferral':
        return 'تأجيل سنة دراسية';
      case 'semester_deferral':
        return 'تأجيل فصل دراسي';
      case 'resume_study':
        return 'استئناف وإعادة قيد';
      case 'dismissal_withdrawal':
        return 'ترقين قيد / انسحاب';
    }
  }
}
