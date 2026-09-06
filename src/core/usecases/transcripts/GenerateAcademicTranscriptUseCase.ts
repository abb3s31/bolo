// 📜 حالة استخدام إصدار كشف الدرجات والوثيقة الأكاديمية (Generate Academic Transcript UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import {
  GenerateTranscriptRequestDto,
  GenerateTranscriptResponseDto,
  TranscriptCourseItemDto,
} from './dtos/TranscriptDtos';
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { IGradeRepository } from '@/core/domain/repositories/IGradeRepository';
import { ICourseRepository } from '@/core/domain/repositories/ICourseRepository';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 🧱 صنف حالة استخدام إصدار الوثيقة
export class GenerateAcademicTranscriptUseCase
  implements IUseCase<GenerateTranscriptRequestDto, GenerateTranscriptResponseDto>
{
  // 💉 حقن المستودعات المطلوبة
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly gradeRepository: IGradeRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly auditRepository: IActivityLogRepository
  ) {}

  // 🚀 تنفيذ إصدار الوثيقة
  public async execute(
    request: GenerateTranscriptRequestDto
  ): Promise<Result<GenerateTranscriptResponseDto, string>> {
    try {
      // 🔍 1. جلب بيانات الطالب
      const student = await this.studentRepository.getById(request.studentId);
      if (!student) {
        return Result.fail('سجل الطالب غير موجود في المنظومة ❌');
      }

      // 🔍 2. جلب جميع درجات ومواد الطالب
      const [grades, allCourses] = await Promise.all([
        this.gradeRepository.getAllByStudent(student.id),
        this.courseRepository.getAll(),
      ]);

      if (grades.length === 0) {
        return Result.fail('لا توجد درجات مرصودة لهذا الطالب لغرض إصدار الوثيقة ⚠️');
      }

      const courseMap = new Map(allCourses.map(c => [c.id, c]));

      let weightedSum = 0;
      let totalCredits = 0;
      const transcriptCourses: TranscriptCourseItemDto[] = [];

      // 📊 3. معالجة وتفصيل كل مادة
      for (const grade of grades) {
        const course = courseMap.get(grade.courseId);
        const score = grade.totalScore ? grade.totalScore.getValue() : 0;
        const credits = course ? course.creditHours : 3;

        weightedSum += score * credits;
        totalCredits += credits;

        const rating = grade.totalScore ? grade.totalScore.getLetterRating() : 'راسب';
        let status: 'ناجح' | 'راسب' | 'ناجح بالقرار' = score >= 50 ? 'ناجح' : 'راسب';

        transcriptCourses.push({
          courseCode: course ? course.code : 'CS-MOD',
          courseName: grade.courseName,
          stageNumber: course ? course.stageNumber : 1,
          semester: course ? course.semester : 1,
          creditHours: credits,
          score,
          letterRating: rating,
          status,
        });
      }

      const gpa = totalCredits > 0 ? Math.round((weightedSum / totalCredits) * 100) / 100 : 0;

      // 🏆 التقدير التراكمي العام
      let generalRating = 'راسب';
      if (gpa >= 90) generalRating = 'امتياز';
      else if (gpa >= 80) generalRating = 'جيد جداً';
      else if (gpa >= 70) generalRating = 'جيد';
      else if (gpa >= 60) generalRating = 'متوسط';
      else if (gpa >= 50) generalRating = 'مقبول';

      const docNum = `DOC-SADIQ-${new Date().getFullYear()}-${student.universityNumber.getValue()}`;
      const qrPayload = `SADIQ_VERIFY:${student.id}:${student.universityNumber.getValue()}:${docNum}`;

      // 📜 4. توثيق العملية في سجل التدقيق الأمني
      const log = new ActivityLog({
        id: `act-doc-${Date.now()}`,
        actorId: request.issuedByUserId,
        actorName: request.issuedByUserName,
        actorRole: 'admin',
        action: 'GENERATE_ACADEMIC_TRANSCRIPT',
        targetResource: `${student.fullName} - ${docNum}`,
        details: `تم إصدار كشف درجات أكاديمي رسمي للطالب (${student.fullName}) بالرقم (${docNum}) بمعدل (${gpa}%). الغرض: (${request.issuePurpose || 'عام'}).`,
        timestamp: new Date().toISOString(),
      });
      await this.auditRepository.log(log);

      return Result.ok({
        documentNumber: docNum,
        studentFullName: student.fullName,
        universityNumber: student.universityNumber.getValue(),
        departmentName: student.departmentName,
        graduationYear: student.stageNumber >= 4 ? `${new Date().getFullYear()}` : undefined,
        totalCreditsCompleted: totalCredits,
        cumulativeGpa: gpa,
        generalRating,
        courses: transcriptCourses,
        qrVerificationCode: qrPayload,
        issuedDate: new Date().toISOString(),
        isOfficial: true,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل إصدار كشف الدرجات الأكاديمي ❌';
      return Result.fail(errorMsg);
    }
  }
}
