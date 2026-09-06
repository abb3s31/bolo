// 🎓 حالة استخدام ترحيل وترقية الطلاب للمرحلة التالية (Promote Students UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج طلب ترحيل طلاب مرحلة
export interface PromoteStudentsRequestDto {
  readonly departmentId: string; // 🏛️ معرف القسم
  readonly departmentName: string; // 🏛️ اسم القسم
  readonly currentStageNumber: number; // 🎓 رقم المرحلة الحالية (1, 2, 3)
  readonly studentIds: string[]; // 🎓 قائمة معرفات الطلاب المؤهلين للنجاح والترقية
  readonly promotedByUserId: string; // 👤 معرف المسؤول
  readonly promotedByUserName: string; // 👤 اسم المسؤول
  readonly promotedByUserRole: string; // 📜 دور المسؤول
}

// 📤 نموذج استجابة الترحيل
export interface PromoteStudentsResponseDto {
  readonly promotedCount: number; // 🔢 عدد الطلاب المرحلين
  readonly nextStageNumber: number; // 🎓 رقم المرحلة الجديدة
  readonly message: string; // 💬 الرسالة
}

// 🧱 صنف حالة استخدام ترحيل الطلاب
export class PromoteStudentsUseCase
  implements IUseCase<PromoteStudentsRequestDto, PromoteStudentsResponseDto>
{
  // 💉 حقن مستودع الطلاب وسجلات التدقيق
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly auditRepository: IActivityLogRepository
  ) {}

  // 🚀 تنفيذ الترحيل
  public async execute(
    request: PromoteStudentsRequestDto
  ): Promise<Result<PromoteStudentsResponseDto, string>> {
    try {
      if (request.currentStageNumber >= 4) {
        return Result.fail('طلاب المرحلة الرابعة خريجون ولا يمكن ترحيلهم لمرحلة تالية ⚠️');
      }

      if (request.studentIds.length === 0) {
        return Result.fail('قائمة الطلاب المؤهلين للترقية فارغة ⚠️');
      }

      // 📥 جلب جميع طلاب القسم والمرحلة
      const allStageStudents = await this.studentRepository.getByDepartmentAndStage(
        request.departmentId,
        request.currentStageNumber
      );

      const promotedStudents = [];

      for (const student of allStageStudents) {
        if (request.studentIds.includes(student.id)) {
          student.promoteToNextStage();
          await this.studentRepository.save(student);
          promotedStudents.push(student);
        }
      }

      const nextStage = request.currentStageNumber + 1;

      // 📜 تسجيل العملية في سجل التدقيق
      const log = new ActivityLog({
        id: `act-prm-${Date.now()}`,
        actorId: request.promotedByUserId,
        actorName: request.promotedByUserName,
        actorRole: request.promotedByUserRole,
        action: 'PROMOTE_STUDENTS_STAGE',
        targetResource: `${request.departmentName} - مرحلة ${nextStage}`,
        details: `تم ترحيل وترقية ${promotedStudents.length} طالب من المرحلة ${request.currentStageNumber} إلى المرحلة ${nextStage}.`,
        timestamp: new Date().toISOString(),
      });
      await this.auditRepository.log(log);

      return Result.ok({
        promotedCount: promotedStudents.length,
        nextStageNumber: nextStage,
        message: `تم بنجاح ترحيل ${promotedStudents.length} طالب إلى المرحلة ${nextStage} في ${request.departmentName} 🎓`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل ترحيل الطلاب ❌';
      return Result.fail(errorMsg);
    }
  }
}
