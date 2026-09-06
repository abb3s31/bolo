// ⚖️ حالة استخدام تطبيق ومنح درجات القرار الوزاري (Apply Decision Marks UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { IGradeRepository } from '@/core/domain/repositories/IGradeRepository';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { DecisionMarksEligibilitySpecification } from '@/core/domain/specifications/DecisionMarksEligibilitySpecification';
import { ExamCommitteeDecision } from '@/core/domain/entities/ExamCommitteeDecision';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج طلب منح درجات القرار
export interface ApplyDecisionMarksRequestDto {
  readonly studentId: string; // 🎓 معرف الطالب
  readonly studentName: string; // 👤 اسم الطالب
  readonly courseId: string; // 📚 معرف المادة
  readonly courseName: string; // 📚 اسم المادة
  readonly academicYear: string; // 🗓️ السنة الدراسية
  readonly marksToGrant: number; // ➕ عدد الدرجات (1 - 5)
  readonly alreadyUsedMarks?: number; // 🔢 الدرجات المستخدمة مسبقاً
  readonly committeeHeadName: string; //  رئيس اللجنة الامتحانية
  readonly reason?: string; // 📝 نص القرار
}

// 📤 نموذج استجابة تطبيق القرار
export interface ApplyDecisionMarksResponseDto {
  readonly decision: ExamCommitteeDecision; // ⚖️ كيان القرار
  readonly updatedFinalScore: number; // 💯 الدرجة الجديدة بعد القرار (50)
  readonly message: string; // 💬 رسالة التوضيح
}

// 🧱 صنف حالة استخدام درجات القرار
export class ApplyDecisionMarksUseCase
  implements IUseCase<ApplyDecisionMarksRequestDto, ApplyDecisionMarksResponseDto>
{
  // 💉 حقن المستودعات المطلوبة
  constructor(
    private readonly gradeRepository: IGradeRepository,
    private readonly auditRepository: IActivityLogRepository
  ) {}

  // 🚀 تنفيذ القرار
  public async execute(
    request: ApplyDecisionMarksRequestDto
  ): Promise<Result<ApplyDecisionMarksResponseDto, string>> {
    try {
      // 🔍 1. جلب سجل الدرجة
      const grade = await this.gradeRepository.getByStudentAndCourse(
        request.studentId,
        request.courseId,
        request.academicYear
      );

      if (!grade) {
        return Result.fail('لا يوجد سجل درجات مرصود لهذا الطالب في هذه المادة ❌');
      }

      // 🔍 2. التحقق من الاستحقاق عبر المواصفة
      const spec = new DecisionMarksEligibilitySpecification();
      const context = {
        grade,
        requestedMarks: request.marksToGrant,
        alreadyUsedDecisionMarksThisYear: request.alreadyUsedMarks || 0,
      };

      if (!spec.isSatisfiedBy(context)) {
        const reason = spec.getUnsatisfiedReason(context) || 'الشروط الوزارية غير مستوفاة ⚠️';
        return Result.fail(reason);
      }

      const originalTotal = grade.totalScore ? grade.totalScore.getValue() : 0;
      const newScore = originalTotal + request.marksToGrant;

      // ✏️ 3. تعديل الدرجة في كيان النطاق (إضافة الدرجات للامتحان النهائي)
      const currentFinal = grade.finalExamScore ? grade.finalExamScore.getValue() : 0;
      grade.updateScores(undefined, undefined, currentFinal + request.marksToGrant);

      // 💾 4. حفظ الدرجة المحدثة
      await this.gradeRepository.save(grade);

      // ⚖️ 5. إنشاء كيان قرار اللجنة
      const decision = new ExamCommitteeDecision({
        id: `dec-${Date.now()}-${request.studentId}`,
        studentId: request.studentId,
        studentName: request.studentName,
        courseId: request.courseId,
        courseName: request.courseName,
        academicYear: request.academicYear,
        originalScore: originalTotal,
        grantedMarks: request.marksToGrant,
        newFinalScore: newScore,
        decisionType: 'pass_assistance',
        committeeHeadName: request.committeeHeadName,
        reason: request.reason || 'قرار اللجنة الامتحانية بموجب التعليمات الوزارية للمساعدة على النجاح.',
        appliedAt: new Date().toISOString(),
      });

      // 📜 6. تسجيل العملية في سجل التدقيق
      const log = new ActivityLog({
        id: `act-dec-${Date.now()}`,
        actorId: request.committeeHeadName,
        actorName: request.committeeHeadName,
        actorRole: 'exam_committee_head',
        action: 'APPLY_DECISION_MARKS',
        targetResource: `${request.studentName} - ${request.courseName}`,
        details: `تم منح الطالب (${request.studentName}) عدد (${request.marksToGrant}) درجات قرار في مادة (${request.courseName}) لتصبح درجته (${newScore}) (ناجح بالقرار).`,
        timestamp: new Date().toISOString(),
      });
      await this.auditRepository.log(log);

      return Result.ok({
        decision,
        updatedFinalScore: newScore,
        message: `تم بنجاح منح (${request.marksToGrant}) درجات قرار وتعديل النتيجة إلى (${newScore} - ناجح بالقرار) ⚖️`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل تطبيق قرار اللجنة الامتحانية ❌';
      return Result.fail(errorMsg);
    }
  }
}
