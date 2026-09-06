// 🏆 حالة استخدام استخراج وترتيب خريجي الأوائل (Calculate Top Graduates UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { TopGraduateRank } from '@/core/domain/entities/TopGraduateRank';
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { IGradeRepository } from '@/core/domain/repositories/IGradeRepository';
import { ICourseRepository } from '@/core/domain/repositories/ICourseRepository';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج طلب استخراج الأوائل
export interface CalculateTopGraduatesRequestDto {
  readonly departmentId: string; // 🏛️ معرف القسم
  readonly graduationYear: string; // 🗓️ سنة التخرج
  readonly topLimit?: number; // 🔢 عدد المراكز المطلوبة (افتراضي 3 أو 10)
  readonly calculatedByUserId: string; // 👤 معرف المسؤول
  readonly calculatedByUserName: string; // 👤 اسم المسؤول
}

// 📤 نموذج نتائج ترتيب الأوائل
export interface CalculateTopGraduatesResponseDto {
  readonly departmentName: string; // 🏛️ اسم القسم
  readonly graduationYear: string; // 🗓️ سنة التخرج
  readonly topGraduates: TopGraduateRank[]; // 🥇 قائمة الأوائل المرتبين تنازلياً
  readonly totalGraduatesCount: number; // 👥 إجمالي عدد الخريجين
  readonly message: string; // 💬 الرسالة
}

// 🧱 صنف حالة استخدام استخراج الأوائل
export class CalculateTopGraduatesUseCase
  implements IUseCase<CalculateTopGraduatesRequestDto, CalculateTopGraduatesResponseDto>
{
  // 💉 حقن المستودعات
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly gradeRepository: IGradeRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly auditRepository: IActivityLogRepository
  ) {}

  // 🚀 تنفيذ الحساب والترتيب
  public async execute(
    request: CalculateTopGraduatesRequestDto
  ): Promise<Result<CalculateTopGraduatesResponseDto, string>> {
    try {
      const limit = request.topLimit || 3;

      // 🔍 1. جلب طلاب المرحلة الرابعة (الخريجين) للقسم المحدد
      const departmentStudents = await this.studentRepository.getByDepartmentAndStage(
        request.departmentId,
        4
      );

      if (departmentStudents.length === 0) {
        return Result.fail('لا يوجد طلاب مسجلون في مرحلة التخرج لهذا القسم ❌');
      }

      const allCourses = await this.courseRepository.getAll();
      const courseMap = new Map<string, number>();
      for (const course of allCourses) {
        courseMap.set(course.id, course.creditHours);
      }

      const studentGpaList: {
        studentId: string;
        studentName: string;
        universityNumber: string;
        departmentId: string;
        departmentName: string;
        gpa: number;
        completedCredits: number;
      }[] = [];

      // 🧮 2. احتساب المعدل التراكمي الموزون لكل خريج
      for (const student of departmentStudents) {
        const studentGrades = await this.gradeRepository.getAllByStudent(student.id);

        let totalWeightedPoints = 0;
        let totalCredits = 0;

        for (const grade of studentGrades) {
          const credits = courseMap.get(grade.courseId) || 3;
          const score = grade.totalScore ? grade.totalScore.getValue() : 0;
          totalWeightedPoints += score * credits;
          totalCredits += credits;
        }

        const cumulativeGpa = totalCredits > 0
          ? Math.round((totalWeightedPoints / totalCredits) * 100) / 100
          : 0;

        studentGpaList.push({
          studentId: student.id,
          studentName: student.fullName,
          universityNumber: student.universityNumber.getValue(),
          departmentId: student.departmentId,
          departmentName: student.departmentName,
          gpa: cumulativeGpa,
          completedCredits: totalCredits,
        });
      }

      // 🏆 3. الترتيب التنازلي حسب المعدل التراكمي
      studentGpaList.sort((a, b) => b.gpa - a.gpa);

      const topRanked: TopGraduateRank[] = [];
      const sliceCount = Math.min(limit, studentGpaList.length);

      for (let i = 0; i < sliceCount; i++) {
        const item = studentGpaList[i];
        let rating = 'مقبول';
        if (item.gpa >= 90) rating = 'امتياز';
        else if (item.gpa >= 80) rating = 'جيد جداً';
        else if (item.gpa >= 70) rating = 'جيد';
        else if (item.gpa >= 60) rating = 'متوسط';

        topRanked.push(
          new TopGraduateRank({
            rankPosition: i + 1,
            studentId: item.studentId,
            studentName: item.studentName,
            universityNumber: item.universityNumber,
            departmentId: item.departmentId,
            departmentName: item.departmentName,
            cumulativeGpa: item.gpa,
            totalCreditsCompleted: item.completedCredits,
            graduationYear: request.graduationYear,
            graduationRating: rating,
            isEligibleForHonors: item.gpa >= 80,
          })
        );
      }

      const deptName = departmentStudents[0].departmentName;

      // 📜 4. توثيق العملية في سجل التدقيق الأمني
      const log = new ActivityLog({
        id: `act-top-${Date.now()}`,
        actorId: request.calculatedByUserId,
        actorName: request.calculatedByUserName,
        actorRole: 'admin',
        action: 'CALCULATE_TOP_GRADUATES',
        targetResource: `${deptName} - ${request.graduationYear}`,
        details: `تم استخراج وترتيب قائمة الأوائل لقسم (${deptName}) للعام الدراسي (${request.graduationYear}) بعدد (${topRanked.length}) مراكز.`,
        timestamp: new Date().toISOString(),
      });
      await this.auditRepository.log(log);

      return Result.ok({
        departmentName: deptName,
        graduationYear: request.graduationYear,
        topGraduates: topRanked,
        totalGraduatesCount: departmentStudents.length,
        message: `تم استخراج وترتيب خريجي الأوائل لقسم (${deptName}) بنجاح 🏆`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل استخراج الأوائل ❌';
      return Result.fail(errorMsg);
    }
  }
}
