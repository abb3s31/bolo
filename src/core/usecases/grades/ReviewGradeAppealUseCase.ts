// ⚖️ حالة استخدام مراجعة وتدقيق اعتراض الدرجات (Review Grade Appeal UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { GradeAppeal } from '@/core/domain/entities/GradeAppeal';
import { IGradeRepository } from '@/core/domain/repositories/IGradeRepository';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج طلب مراجعة الاعتراض
export interface ReviewGradeAppealRequestDto {
  readonly appeal: GradeAppeal; // 📜 كيان الاعتراض
  readonly decision: 'accepted_modified' | 'rejected_identical'; // ⚖️ قرار اللجنة الامتحانية
  readonly newScoreIfModified?: number; // 💯 الدرجة الجديدة بعد إعادة الجمع (في حال القبول)
  readonly reviewerName: string; //  اسم رئيس اللجنة الامتحانية أو المدقق
  readonly notes: string; // 💬 نص محضر التدقيق
}

// 📤 نموذج استجابة مراجعة الاعتراض
export interface ReviewGradeAppealResponseDto {
  readonly appeal: GradeAppeal; // 📜 كيان الاعتراض المحدث
  readonly message: string; // 💬 الرسالة
}

// 🧱 صنف حالة استخدام مراجعة الاعتراض
export class ReviewGradeAppealUseCase
  implements IUseCase<ReviewGradeAppealRequestDto, ReviewGradeAppealResponseDto>
{
  // 💉 حقن المستودعات
  constructor(
    private readonly gradeRepository: IGradeRepository,
    private readonly auditRepository: IActivityLogRepository
  ) {}

  // 🚀 تنفيذ مراجعة الاعتراض
  public async execute(
    request: ReviewGradeAppealRequestDto
  ): Promise<Result<ReviewGradeAppealResponseDto, string>> {
    try {
      const appeal = request.appeal;

      if (request.decision === 'accepted_modified') {
        if (request.newScoreIfModified === undefined || request.newScoreIfModified < 0) {
          return Result.fail('يرجى تحديد الدرجة الجديدة المصححة بعد التدقيق ⚠️');
        }

        appeal.acceptModification(
          request.newScoreIfModified,
          request.reviewerName,
          request.notes
        );

        // 🔄 تعديل سجل الدرجة في المستودع
        const grade = await this.gradeRepository.getByStudentAndCourse(
          appeal.studentId,
          appeal.courseId,
          appeal.academicYear
        );

        if (grade) {
          // تعديل درجة الامتحان النهائي لتعكس التصحيح
          const currentMidterm = grade.midtermScore ? grade.midtermScore.getValue() : 0;
          const currentCoursework = grade.courseworkScore ? grade.courseworkScore.getValue() : 0;
          const newFinal = Math.max(0, request.newScoreIfModified - (currentMidterm + currentCoursework));

          grade.updateScores(undefined, undefined, newFinal);
          await this.gradeRepository.save(grade);
        }
      } else {
        appeal.rejectIdentical(request.reviewerName, request.notes);
      }

      // 📜 تسجيل العملية في سجل التدقيق الأمني
      const log = new ActivityLog({
        id: `act-rev-apl-${Date.now()}`,
        actorId: request.reviewerName,
        actorName: request.reviewerName,
        actorRole: 'exam_committee',
        action: request.decision === 'accepted_modified' ? 'ACCEPT_GRADE_APPEAL' : 'REJECT_GRADE_APPEAL',
        targetResource: `${appeal.studentName} - ${appeal.courseName}`,
        details: `تم ${request.decision === 'accepted_modified' ? `قبول اعتراض وتعديل درجة الطالب إلى (${request.newScoreIfModified})` : 'رفض الاعتراض وتأكيد مطابقة الدرجة'}. المحضر: (${request.notes}).`,
        timestamp: new Date().toISOString(),
      });
      await this.auditRepository.log(log);

      return Result.ok({
        appeal,
        message: request.decision === 'accepted_modified'
          ? `تم قبول الاعتراض وتعديل الدرجة رسمياً إلى (${request.newScoreIfModified}) في السجلات ⚖️`
          : `تم حسم الاعتراض وتأكيد صحة ومطابقة الدرجة الدفترية الأصلية 📋`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل مراجعة وحسم الاعتراض ❌';
      return Result.fail(errorMsg);
    }
  }
}
