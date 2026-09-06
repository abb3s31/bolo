// 📊 حالة استخدام استخراج إحصائيات وتحليلات القسم (Department Analytics UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { ITeacherRepository } from '@/core/domain/repositories/ITeacherRepository';
import { ICourseRepository } from '@/core/domain/repositories/ICourseRepository';
import { IGradeRepository } from '@/core/domain/repositories/IGradeRepository';

// 📥 نموذج طلب التحليلات
export interface DepartmentAnalyticsRequestDto {
  readonly departmentId: string; // 🏛️ معرف القسم
  readonly academicYear?: string; // 🗓️ السنة الدراسية
}

// 📤 نموذج نتائج التحليلات
export interface DepartmentAnalyticsResponseDto {
  readonly departmentId: string; // 🏛️ معرف القسم
  readonly totalStudents: number; // 🎓 عدد الطلاب
  readonly totalTeachers: number; //  عدد الأساتذة
  readonly totalCourses: number; // 📚 عدد المواد
  readonly passRatePercentage: number; // 🟢 نسبة النجاح العامة
  readonly atRiskCount: number; // ⚠️ عدد الطلاب المتعثرين
  readonly averageScore: number; // 📊 متوسط الدرجات العام
}

// 🧱 صنف حالة استخدام التحليلات
export class GetDepartmentAnalyticsUseCase
  implements IUseCase<DepartmentAnalyticsRequestDto, DepartmentAnalyticsResponseDto>
{
  // 💉 حقن المستودعات المطلوبة
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly teacherRepository: ITeacherRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly gradeRepository: IGradeRepository
  ) {}

  // 🚀 تنفيذ استخراج التحليلات
  public async execute(
    request: DepartmentAnalyticsRequestDto
  ): Promise<Result<DepartmentAnalyticsResponseDto, string>> {
    try {
      // 🎓 جلب طلاب وأساتذة ومواد القسم
      const [allStudents, allTeachers, allCourses] = await Promise.all([
        this.studentRepository.getAll(),
        this.teacherRepository.getByDepartment(request.departmentId),
        this.courseRepository.getAll(),
      ]);

      const deptStudents = allStudents.filter(s => s.departmentId === request.departmentId);
      const deptCourses = allCourses.filter(c => c.departmentId === request.departmentId);

      let totalScores = 0;
      let scoresCount = 0;
      let passedCount = 0;
      let atRiskCount = 0;

      // 🔍 احتساب الدرجات لطلاب القسم
      for (const student of deptStudents) {
        const studentGrades = await this.gradeRepository.getAllByStudent(
          student.id,
          request.academicYear
        );

        let studentPassedAll = true;
        for (const g of studentGrades) {
          const score = g.totalScore ? g.totalScore.getValue() : 0;
          totalScores += score;
          scoresCount += 1;
          if (score < 50) {
            studentPassedAll = false;
          }
        }

        if (studentGrades.length > 0) {
          if (studentPassedAll) passedCount += 1;
          else atRiskCount += 1;
        }
      }

      const avgScore = scoresCount > 0 ? Math.round((totalScores / scoresCount) * 10) / 10 : 0;
      const passRate =
        deptStudents.length > 0 ? Math.round((passedCount / deptStudents.length) * 100) : 0;

      return Result.ok({
        departmentId: request.departmentId,
        totalStudents: deptStudents.length,
        totalTeachers: allTeachers.length,
        totalCourses: deptCourses.length,
        passRatePercentage: passRate,
        atRiskCount,
        averageScore: avgScore,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل استخراج تحليلات القسم ❌';
      return Result.fail(errorMsg);
    }
  }
}
