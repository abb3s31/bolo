// ⚠️ حالة استخدام تقييم الإنذار الأكاديمي والتعثر الدراسي لمسار بولونيا - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { IGradeRepository } from '@/core/domain/repositories/IGradeRepository';
import { INotificationRepository } from '@/core/domain/repositories/INotificationRepository';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { Notification } from '@/core/domain/entities/Notification';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج طلب فحص الإنذار الأكاديمي
export interface EvaluateAcademicProbationRequestDto {
  readonly studentId: string; // 🎓 معرف الطالب
  readonly academicYear: string; // 🗓️ السنة الدراسية
  readonly evaluatedByUserId: string; // 👤 معرف المشرف أو رئيس القسم
  readonly evaluatedByUserName: string; // 👤 اسم المسؤول
}

// 📤 نموذج استجابة تقييم الإنذار الأكاديمي
export interface EvaluateAcademicProbationResponseDto {
  readonly studentName: string; // 👤 اسم الطالب
  readonly isOnProbation: boolean; // ⚠️ هل الطالب تحت طائلة الإنذار الأكاديمي
  readonly probationReason?: string; // 📝 تفاصيل سبب الإنذار
  readonly failedCoursesCount: number; // 🔴 عدد المواد الراسب بها
  readonly averageScore: number; // 📊 المعدل الفصلي
  readonly adviceMessage: string; // 💬 رسالة التوجيه والإرشاد الأكاديمي
}

// 🧱 صنف حالة استخدام تقييم الإنذار الأكاديمي
export class EvaluateAcademicProbationUseCase
  implements IUseCase<EvaluateAcademicProbationRequestDto, EvaluateAcademicProbationResponseDto>
{
  // 💉 حقن المستودعات
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly gradeRepository: IGradeRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly auditRepository: IActivityLogRepository
  ) {}

  // 🚀 تنفيذ التقييم
  public async execute(
    request: EvaluateAcademicProbationRequestDto
  ): Promise<Result<EvaluateAcademicProbationResponseDto, string>> {
    try {
      // 🔍 1. جلب بيانات الطالب
      const student = await this.studentRepository.getById(request.studentId);
      if (!student) {
        return Result.fail('سجل الطالب غير موجود في المنظومة ❌');
      }

      // 🔍 2. جلب درجات الطالب للسنة المحددة
      const grades = await this.gradeRepository.getAllByStudent(
        student.id,
        request.academicYear
      );

      if (grades.length === 0) {
        return Result.fail('لا توجد درجات مرصودة لتقييم الموقف الأكاديمي ⚠️');
      }

      let totalScores = 0;
      let failedCount = 0;

      for (const grade of grades) {
        const score = grade.totalScore ? grade.totalScore.getValue() : 0;
        totalScores += score;
        if (!grade.isPassed()) {
          failedCount += 1;
        }
      }

      const avgScore = Math.round((totalScores / grades.length) * 10) / 10;

      // ⚖️ 3. شروط الإنذار الأكاديمي وفق مسار بولونيا:
      // (معدل أقل من 50% أو رسوب في مادتين فأكثر)
      const isOnProbation = avgScore < 50 || failedCount >= 2;
      let reason: string | undefined = undefined;

      if (isOnProbation) {
        if (avgScore < 50 && failedCount >= 2) {
          reason = `المعدل الفصلي (${avgScore}%) دون الحد الأدنى مع الرسوب في (${failedCount}) مواد.`;
        } else if (avgScore < 50) {
          reason = `المعدل الفصلي (${avgScore}%) أقل من 50%.`;
        } else {
          reason = `الرسوب في (${failedCount}) مواد دراسية في هذا الفصل.`;
        }

        // 🔔 إرسال إشعار توجيه أكاديمي للطالب
        const notif = new Notification({
          id: `notif-prob-${Date.now()}-${student.id}`,
          title: 'تنبيه إنذار أكاديمي وتوجيه إرشادي ⚠️',
          message: `عزيزي الطالب (${student.fullName})، تقرر وضعك تحت المتابعة الأكاديمية (الإنذار الأكاديمي) بسبب: ${reason}. يرجى مراجعة المرشد الأكاديمي لرئاسة القسم.`,
          type: 'academic',
          targetRole: 'students',
          createdAt: new Date().toISOString(),
          isRead: false,
        });
        await this.notificationRepository.save(notif);

        // 📜 تسجيل العملية في سجل التدقيق
        const log = new ActivityLog({
          id: `act-prob-${Date.now()}`,
          actorId: request.evaluatedByUserId,
          actorName: request.evaluatedByUserName,
          actorRole: 'academic_advisor',
          action: 'EVALUATE_ACADEMIC_PROBATION',
          targetResource: student.fullName,
          details: `تم وضع الطالب (${student.fullName}) تحت طائلة الإنذار الأكاديمي لمسار بولونيا. السبب: (${reason}).`,
          timestamp: new Date().toISOString(),
        });
        await this.auditRepository.log(log);
      }

      const advice = isOnProbation
        ? 'الطالب بحاجة إلى جلسة إرشاد أكاديمي مع رئيس القسم لتقليص المقررات ورفع المعدل ⚠️'
        : 'الموقف الأكاديمي للطالب سليم ومستقر ولا توجد أي مؤشرات تعثر 🟢';

      return Result.ok({
        studentName: student.fullName,
        isOnProbation,
        probationReason: reason,
        failedCoursesCount: failedCount,
        averageScore: avgScore,
        adviceMessage: advice,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل تقييم الإنذار الأكاديمي ❌';
      return Result.fail(errorMsg);
    }
  }
}
