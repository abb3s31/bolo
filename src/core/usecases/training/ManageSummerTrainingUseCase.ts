// 🏭 حالة استخدام إدارة وتقييم التدريب الصيفي (Manage Summer Training UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { SummerTraining } from '@/core/domain/entities/SummerTraining';
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج طلب إدارة التدريب الصيفي
export interface ManageSummerTrainingRequestDto {
  readonly trainingId?: string; // 🆔 معرف السجل إن وجد
  readonly studentId: string; // 🎓 معرف الطالب
  readonly trainingOrganizationName: string; // 🏢 جهة التدريب
  readonly trainingField: string; // 🛠️ تخصص التدريب
  readonly startDate: string; // 🗓️ تاريخ البدء
  readonly endDate: string; // 🗓️ تاريخ الانتهاء
  readonly totalWeeks: number; // ⏳ عدد الأسابيع
  readonly fieldScore?: number; // 📊 تقييم المشرف الموقعي (0-50)
  readonly academicScore?: number; // 📑 تقييم التقرير (0-50)
  readonly notes?: string; // 💬 ملاحظات
  readonly actionType: 'register_placement' | 'grade_field' | 'grade_academic'; // 🎯 نوع الإجراء
  readonly evaluatedByUserId: string; // 👤 معرف المسؤول/المشرف
  readonly evaluatedByUserName: string; // 👤 اسم المشرف
}

// 📤 نموذج استجابة إدارة التدريب الصيفي
export interface ManageSummerTrainingResponseDto {
  readonly training: SummerTraining; // 📜 كيان التدريب المحدث
  readonly isPassed: boolean; // 🟢 هل اجتاز الطالب متطلب التدريب بنجاح
  readonly finalScore?: number; // 💯 الدرجة الكلية إن اكتملت
  readonly message: string; // 💬 الرسالة
}

// 🧱 صنف حالة استخدام التدريب الصيفي
export class ManageSummerTrainingUseCase
  implements IUseCase<ManageSummerTrainingRequestDto, ManageSummerTrainingResponseDto>
{
  // 💉 حقن المستودعات
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly auditRepository: IActivityLogRepository
  ) {}

  // 🚀 تنفيذ إدارة التدريب الصيفي
  public async execute(
    request: ManageSummerTrainingRequestDto
  ): Promise<Result<ManageSummerTrainingResponseDto, string>> {
    try {
      // 🔍 1. جلب بيانات الطالب
      const student = await this.studentRepository.getById(request.studentId);
      if (!student) {
        return Result.fail('سجل الطالب غير موجود في المنظومة ❌');
      }

      // 🧱 2. بناء كيان التدريب الصيفي
      const training = new SummerTraining({
        id: request.trainingId || `trn-${Date.now()}-${student.id}`,
        studentId: student.id,
        studentName: student.fullName,
        universityNumber: student.universityNumber.getValue(),
        departmentId: student.departmentId,
        departmentName: student.departmentName,
        trainingOrganizationName: request.trainingOrganizationName,
        trainingField: request.trainingField,
        startDate: request.startDate,
        endDate: request.endDate,
        totalWeeks: request.totalWeeks,
        status: 'placed_registered',
      });

      // 📊 3. تطبيق التقييمات حسب الإجراء
      if (request.actionType === 'grade_field' && request.fieldScore !== undefined) {
        training.recordFieldScore(request.fieldScore);
      } else if (request.actionType === 'grade_academic' && request.academicScore !== undefined) {
        if (request.fieldScore !== undefined) {
          training.recordFieldScore(request.fieldScore);
        }
        training.recordAcademicScore(request.academicScore, request.notes);
      }

      // 📜 4. تسجيل العملية في سجل التدقيق الأمني
      const log = new ActivityLog({
        id: `act-trn-${Date.now()}`,
        actorId: request.evaluatedByUserId,
        actorName: request.evaluatedByUserName,
        actorRole: 'training_supervisor',
        action: 'MANAGE_SUMMER_TRAINING',
        targetResource: `${student.fullName} - ${request.trainingOrganizationName}`,
        details: `تم تنفيذ إجراء (${request.actionType}) للتدريب الصيفي للطالب (${student.fullName}) لدى (${request.trainingOrganizationName}). الدرجة الكلية: (${training.finalTotalScore || 'قيد التقييم'}).`,
        timestamp: new Date().toISOString(),
      });
      await this.auditRepository.log(log);

      let msg = '';
      if (training.finalTotalScore !== undefined) {
        msg = training.isPassed
          ? `تهانينا! استوفى الطالب (${student.fullName}) متطلب التدريب الصيفي بنجاح بالدرجة (${training.finalTotalScore}/100) 🏭`
          : `لم يستوفِ الطالب متطلب التدريب الصيفي بالدرجة (${training.finalTotalScore}/100) ويتطلب إعادة التدريب ⚠️`;
      } else {
        msg = `تم تسجيل جهة التدريب الصيفي (${request.trainingOrganizationName}) للطالب (${student.fullName}) بنجاح 📋`;
      }

      return Result.ok({
        training,
        isPassed: training.isPassed,
        finalScore: training.finalTotalScore,
        message: msg,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل إدارة التدريب الصيفي ❌';
      return Result.fail(errorMsg);
    }
  }
}
