// 📚 حالة استخدام تسجيل مادة دراسية وفحص المتطلبات (Enroll Course UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { ICourseRepository } from '@/core/domain/repositories/ICourseRepository';
import { IGradeRepository } from '@/core/domain/repositories/IGradeRepository';
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { CoursePrerequisitesSpecification } from '@/core/domain/specifications/CoursePrerequisitesSpecification';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج طلب تسجيل المادة
export interface EnrollCourseRequestDto {
  readonly studentId: string; // 🎓 معرف الطالب
  readonly courseId: string; // 📚 معرف المادة المراد تسجيلها
  readonly prerequisiteCourseIds?: string[]; // 🆔 معرفات المواد المتطلبة السابقة
  readonly currentEnrolledCredits: number; // ⏳ الساعات المسجلة حالياً
}

// 📤 نموذج استجابة تسجيل المادة
export interface EnrollCourseResponseDto {
  readonly courseName: string; // 📚 اسم المادة
  readonly creditsAdded: number; // ⏳ الساعات المضافة
  readonly newTotalCredits: number; // ⏳ إجمالي الساعات بعد التسجيل
  readonly message: string; // 💬 رسالة التوضيح
}

// 🧱 صنف حالة استخدام تسجيل المادة
export class EnrollCourseUseCase
  implements IUseCase<EnrollCourseRequestDto, EnrollCourseResponseDto>
{
  // 💉 حقن المستودعات
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly gradeRepository: IGradeRepository,
    private readonly auditRepository: IActivityLogRepository
  ) {}

  // 🚀 تنفيذ التسجيل
  public async execute(
    request: EnrollCourseRequestDto
  ): Promise<Result<EnrollCourseResponseDto, string>> {
    try {
      // 🔍 1. جلب بيانات الطالب
      const student = await this.studentRepository.getById(request.studentId);
      if (!student) {
        return Result.fail('سجل الطالب غير موجود في المنظومة ❌');
      }

      // 🔍 2. جلب بيانات المادة
      const course = await this.courseRepository.getById(request.courseId);
      if (!course) {
        return Result.fail('المادة الدراسية غير موجودة ❌');
      }

      // 🔍 3. جلب درجات الطالب السابقة
      const previousGrades = await this.gradeRepository.getAllByStudent(student.id);

      // ⚖️ 4. التحقق عبر مواصفة المتطلبات السابقة والساعات المعتمدة
      const spec = new CoursePrerequisitesSpecification();
      const context = {
        targetCourseName: course.name,
        prerequisiteCourseIds: request.prerequisiteCourseIds || [],
        studentGrades: previousGrades,
        requestedTotalCredits: request.currentEnrolledCredits + course.creditHours,
        maxAllowedCreditsPerSemester: 30, // 30 ECTS
      };

      if (!spec.isSatisfiedBy(context)) {
        const reason = spec.getUnsatisfiedReason(context) || 'لم يتم استيفاء شروط تسجيل المادة ⚠️';
        return Result.fail(reason);
      }

      const newTotal = request.currentEnrolledCredits + course.creditHours;

      // 📜 5. تسجيل العملية في سجل التدقيق الأمني
      const log = new ActivityLog({
        id: `act-enr-${Date.now()}`,
        actorId: student.id,
        actorName: student.fullName,
        actorRole: 'student',
        action: 'ENROLL_COURSE',
        targetResource: course.name,
        details: `قام الطالب (${student.fullName}) بتسجيل مادة (${course.name}) بواقع (${course.creditHours} ECTS). إجمالي الساعات: (${newTotal} ECTS).`,
        timestamp: new Date().toISOString(),
      });
      await this.auditRepository.log(log);

      return Result.ok({
        courseName: course.name,
        creditsAdded: course.creditHours,
        newTotalCredits: newTotal,
        message: `تم تسجيل مادة (${course.name}) بنجاح. إجمالي الساعات المعتمدة لهذا الفصل: (${newTotal} ECTS) 📚`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل تسجيل المادة الدراسية ❌';
      return Result.fail(errorMsg);
    }
  }
}
