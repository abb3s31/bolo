//  حالة استخدام احتساب النصاب والعبء التدريسي للأساتذة (Calculate Teacher Workload UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { TeacherWorkload } from '@/core/domain/entities/TeacherWorkload';
import { ITeacherRepository } from '@/core/domain/repositories/ITeacherRepository';
import { ICourseRepository } from '@/core/domain/repositories/ICourseRepository';

// 📥 نموذج طلب احتساب النصاب
export interface CalculateTeacherWorkloadRequestDto {
  readonly teacherId: string; //  معرف الأستاذ
  readonly graduationSupervisionHours?: number; // 🎓 ساعات الإشراف على مشاريع التخرج (اختياري)
}

// 📤 نموذج نتائج النصاب التدريسي
export interface CalculateTeacherWorkloadResponseDto {
  readonly workload: TeacherWorkload; // 📊 كيان النصاب المحسوب
  readonly statusMessage: string; // 💬 رسالة الموقف القانوني
}

// 🧱 صنف حالة استخدام احتساب النصاب
export class CalculateTeacherWorkloadUseCase
  implements IUseCase<CalculateTeacherWorkloadRequestDto, CalculateTeacherWorkloadResponseDto>
{
  // 💉 حقن مستودعات الأساتذة والمواد
  constructor(
    private readonly teacherRepository: ITeacherRepository,
    private readonly courseRepository: ICourseRepository
  ) {}

  // 🚀 تنفيذ الحساب
  public async execute(
    request: CalculateTeacherWorkloadRequestDto
  ): Promise<Result<CalculateTeacherWorkloadResponseDto, string>> {
    try {
      // 🔍 1. جلب بيانات الأستاذ
      const teacher = await this.teacherRepository.getById(request.teacherId);
      if (!teacher) {
        return Result.fail('الأستاذ المطلوب غير موجود في المنظومة ❌');
      }

      // 🔍 2. جلب كافة المواد المكلف بها
      const allCourses = await this.courseRepository.getAll();
      const assignedCourses = allCourses.filter(c => teacher.assignedSubjectIds.includes(c.id));

      let totalTheory = 0;
      let totalPractical = 0;

      for (const course of assignedCourses) {
        totalTheory += course.theoryHours;
        totalPractical += course.practicalHours;
      }

      // ⚖️ 3. تحديد النصاب القانوني المطلوب حسب اللقب العلمي (وفق قانون الخدمة الجامعية العراقي)
      let requiredQuota = 12; // افتراضي: مدرس مساعد (12-14 ساعة)
      if (teacher.academicTitle.includes('أستاذ مساعد')) {
        requiredQuota = 8;
      } else if (teacher.academicTitle.includes('أستاذ') && !teacher.academicTitle.includes('مساعد')) {
        requiredQuota = 6;
      } else if (teacher.academicTitle.includes('مدرس') && !teacher.academicTitle.includes('مساعد')) {
        requiredQuota = 10;
      }

      const supervision = request.graduationSupervisionHours || 0;

      // 🧱 4. بناء كيان النصاب
      const workload = new TeacherWorkload({
        teacherId: teacher.id,
        teacherName: teacher.fullName,
        academicTitle: teacher.academicTitle,
        assignedCoursesCount: assignedCourses.length,
        totalTheoryHours: totalTheory,
        totalPracticalHours: totalPractical,
        totalSupervisionHours: supervision,
        totalWeeklyHours: totalTheory + totalPractical + supervision,
        requiredQuotaHours: requiredQuota,
        overloadHours: 0,
        isQuotaFulfilled: false,
      });

      const message = workload.isQuotaFulfilled
        ? `الأستاذ مستوفٍ لنصابه القانوني (${workload.totalWeeklyHours} / ${workload.requiredQuotaHours} ساعة أسبوعياً) مع ${workload.overloadHours} ساعات إضافية 🟢`
        : `الأستاذ بحاجة إلى (${workload.requiredQuotaHours - workload.totalWeeklyHours}) ساعات إضافية لاستيفاء النصاب القانوني ⚠️`;

      return Result.ok({
        workload,
        statusMessage: message,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل احتساب النصاب التدريسي ❌';
      return Result.fail(errorMsg);
    }
  }
}
