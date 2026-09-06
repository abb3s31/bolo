// 🎓 حالة استخدام إدارة وتقييم مشاريع التخرج (Manage Graduation Project UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { GraduationProject } from '@/core/domain/entities/GraduationProject';
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج طلب إدارة مشروع التخرج
export interface ManageGraduationProjectRequestDto {
  readonly projectId?: string; // 🆔 معرف المشروع إن وجد
  readonly title: string; // 📝 عنوان المشروع
  readonly abstractText: string; // 📄 الملخص
  readonly departmentId: string; // 🏛️ معرف القسم
  readonly departmentName: string; // 🏛️ اسم القسم
  readonly studentIds: string[]; // 👥 معرفات الطلبة
  readonly supervisorTeacherId: string; //  معرف المشرف
  readonly supervisorTeacherName: string; //  اسم المشرف
  readonly academicYear: string; // 🗓️ السنة
  readonly supervisorScore?: number; // 📊 تقييم المشرف (0-40)
  readonly defenseScore?: number; // ⚖️ تقييم المناقشة (0-60)
  readonly committeeMembers?: string[]; //  أعضاء لجنة المناقشة
  readonly actionType: 'register' | 'grade_supervisor' | 'grade_defense'; // 🎯 نوع الإجراء
}

// 📤 نموذج استجابة مشروع التخرج
export interface ManageGraduationProjectResponseDto {
  readonly project: GraduationProject; // 📜 كيان المشروع المحدث
  readonly finalScore?: number; // 💯 الدرجة الكلية إن اكتملت
  readonly message: string; // 💬 الرسالة
}

// 🧱 صنف حالة استخدام إدارة مشاريع التخرج
export class ManageGraduationProjectUseCase
  implements IUseCase<ManageGraduationProjectRequestDto, ManageGraduationProjectResponseDto>
{
  // 💉 حقن المستودعات
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly auditRepository: IActivityLogRepository
  ) {}

  // 🚀 تنفيذ إدارة المشروع
  public async execute(
    request: ManageGraduationProjectRequestDto
  ): Promise<Result<ManageGraduationProjectResponseDto, string>> {
    try {
      if (!request.title || request.title.trim().length === 0) {
        return Result.fail('يرجى كتابة عنوان مشروع التخرج ⚠️');
      }

      // 🔍 1. التحقق من وجود الطلبة
      const studentNames: string[] = [];
      for (const stdId of request.studentIds) {
        const student = await this.studentRepository.getById(stdId);
        if (student) {
          studentNames.push(student.fullName);
        }
      }

      if (studentNames.length === 0) {
        return Result.fail('يجب ربط طالب واحد على الأقل بالمشروع ❌');
      }

      // 🧱 2. بناء كيان المشروع
      const project = new GraduationProject({
        id: request.projectId || `prj-${Date.now()}`,
        title: request.title.trim(),
        abstractText: request.abstractText,
        departmentId: request.departmentId,
        departmentName: request.departmentName,
        studentIds: request.studentIds,
        studentNames: studentNames,
        supervisorTeacherId: request.supervisorTeacherId,
        supervisorTeacherName: request.supervisorTeacherName,
        academicYear: request.academicYear,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      });

      // 📊 3. تطبيق الإجراءات والتقييمات
      if (request.actionType === 'grade_supervisor' && request.supervisorScore !== undefined) {
        project.submitSupervisorScore(request.supervisorScore);
      } else if (
        request.actionType === 'grade_defense' &&
        request.defenseScore !== undefined &&
        request.committeeMembers
      ) {
        if (request.supervisorScore !== undefined) {
          project.submitSupervisorScore(request.supervisorScore);
        }
        project.recordDefenseEvaluation(
          request.defenseScore,
          request.committeeMembers,
          new Date().toISOString()
        );
      }

      // 📜 4. تسجيل العملية في سجل التدقيق الأمني
      const log = new ActivityLog({
        id: `act-prj-${Date.now()}`,
        actorId: request.supervisorTeacherId,
        actorName: request.supervisorTeacherName,
        actorRole: 'supervisor',
        action: 'MANAGE_GRADUATION_PROJECT',
        targetResource: project.title,
        details: `تم تنفيذ إجراء (${request.actionType}) لمشروع التخرج (${project.title}) للطلبة (${studentNames.join('، ')}). الدرجة النهائية: (${project.finalTotalScore || 'قيد التقييم'}).`,
        timestamp: new Date().toISOString(),
      });
      await this.auditRepository.log(log);

      return Result.ok({
        project,
        finalScore: project.finalTotalScore,
        message: project.finalTotalScore !== undefined
          ? `تم رصد التقييم النهائي لمشروع التخرج (${project.title}) بالدرجة (${project.finalTotalScore}/100) ${project.status === 'passed_completed' ? 'ناجح 🎓' : 'يحتاج مراجعة ⚠️'}`
          : `تم تسجيل وتحديث بيانات مشروع التخرج (${project.title}) بنجاح 📋`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل إدارة مشروع التخرج ❌';
      return Result.fail(errorMsg);
    }
  }
}
