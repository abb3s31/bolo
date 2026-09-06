//  حالة استخدام تكليف أستاذ بمادة دراسية (Assign Teacher To Course UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { ITeacherRepository } from '@/core/domain/repositories/ITeacherRepository';
import { ICourseRepository } from '@/core/domain/repositories/ICourseRepository';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج طلب تكليف الأستاذ
export interface AssignTeacherToCourseRequestDto {
  readonly teacherId: string; //  معرف الأستاذ
  readonly courseId: string; // 📚 معرف المادة
  readonly assignedByUserId: string; // 👤 معرف المسؤول
  readonly assignedByUserName: string; // 👤 اسم المسؤول
  readonly assignedByUserRole: string; // 📜 دور المسؤول
}

// 📤 نموذج استجابة التكليف
export interface AssignTeacherToCourseResponseDto {
  readonly teacherName: string; // 👤 اسم الأستاذ
  readonly courseName: string; // 📚 اسم المادة
  readonly message: string; // 💬 رسالة التوضيح
}

// 🧱 صنف حالة استخدام تكليف الأستاذ
export class AssignTeacherToCourseUseCase
  implements IUseCase<AssignTeacherToCourseRequestDto, AssignTeacherToCourseResponseDto>
{
  // 💉 حقن المستودعات
  constructor(
    private readonly teacherRepository: ITeacherRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly auditRepository: IActivityLogRepository
  ) {}

  // 🚀 تنفيذ التكليف
  public async execute(
    request: AssignTeacherToCourseRequestDto
  ): Promise<Result<AssignTeacherToCourseResponseDto, string>> {
    try {
      // 🔍 جلب الأستاذ
      const teacher = await this.teacherRepository.getById(request.teacherId);
      if (!teacher) {
        return Result.fail('الأستاذ المطلوب غير موجود في النظام ❌');
      }

      // 🔍 جلب المادة
      const course = await this.courseRepository.getById(request.courseId);
      if (!course) {
        return Result.fail('المادة الدراسية المطلوبة غير موجودة في النظام ❌');
      }

      // ➕ إضافة المادة لقائمة مواد الأستاذ في النطاق
      teacher.assignSubject(course.id);
      await this.teacherRepository.save(teacher);

      // 📜 تسجيل العملية في سجل التدقيق
      const auditLog = new ActivityLog({
        id: `act-assign-${Date.now()}`,
        actorId: request.assignedByUserId,
        actorName: request.assignedByUserName,
        actorRole: request.assignedByUserRole,
        action: 'ASSIGN_TEACHER_COURSE',
        targetResource: `${teacher.fullName} - ${course.name}`,
        details: `تم تكليف الأستاذ (${teacher.fullName}) بتدريس مادة (${course.name}).`,
        timestamp: new Date().toISOString(),
      });
      await this.auditRepository.log(auditLog);

      // 🎯 إرجاع النتيجة
      return Result.ok({
        teacherName: teacher.fullName,
        courseName: course.name,
        message: `تم تكليف الأستاذ (${teacher.fullName}) بتدريس مادة (${course.name}) بنجاح`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل تكليف الأستاذ بالمادة ❌';
      return Result.fail(errorMsg);
    }
  }
}
