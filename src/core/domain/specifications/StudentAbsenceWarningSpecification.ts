// ⚠️ مواصفة فحص وتحديد مستوى إنذار الغياب لمسار بولونيا (Absence Warning Specification) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { ISpecification } from './ISpecification';
import { Attendance } from '../entities/Attendance';

// 🏷️ نوع مستوى الإنذار الأكاديمي
export type AbsenceWarningTier = 'safe' | 'notice_3' | 'warning_5' | 'final_warning_7' | 'deprived_10';

// 📥 نموذج سياق تقييم الغياب
export interface AbsenceEvaluationContext {
  studentId: string; // 🎓 معرف الطالب
  courseId: string; // 📚 معرف المادة
  attendanceRecords: Attendance[]; // 📋 سجلات حضور المادة
  totalScheduledLectures: number; // 🔢 إجمالي المحاضرات المقررة بالفصل (مثال: 30 محاضرة)
}

// 📤 نموذج نتيجة التقييم
export interface AbsenceEvaluationResult {
  absencePercentage: number; // 📊 نسبة الغياب المئوية
  absentCount: number; // 🔢 عدد مرات الغياب غير المبرر
  warningTier: AbsenceWarningTier; // 🏷️ مستوى الإنذار
  warningLabel: string; // 💬 المسمى الرسمي
  isDeprived: boolean; // 🚫 هل يستحق الحرمان من الامتحان
}

// 🧱 صنف مواصفة إنذار الغياب
export class StudentAbsenceWarningSpecification
  implements ISpecification<AbsenceEvaluationContext>
{
  // 🔍 فحص هل تجاوز الطالب حد الخطر (>= 5%)
  public isSatisfiedBy(context: AbsenceEvaluationContext): boolean {
    const evalResult = this.evaluate(context);
    return evalResult.warningTier !== 'safe' && evalResult.warningTier !== 'notice_3';
  }

  // 🧮 التقييم الرياضي الدقيق لنسب الغياب وفق التعليمات الوزارية العراقية
  public evaluate(context: AbsenceEvaluationContext): AbsenceEvaluationResult {
    const total = context.totalScheduledLectures > 0 ? context.totalScheduledLectures : 30;

    // احتساب الغياب غير المبرر (absent)
    const absentCount = context.attendanceRecords.filter(
      r => r.studentId === context.studentId && r.courseId === context.courseId && r.status === 'absent'
    ).length;

    const percentage = Math.round((absentCount / total) * 1000) / 10;

    let tier: AbsenceWarningTier = 'safe';
    let label = 'موقف الغياب سليم وآمن (ضمن الحد المسموح)';
    let isDeprived = false;

    if (percentage >= 10) {
      tier = 'deprived_10';
      label = 'محروم من المادة (تجاوز نسبة 10% غياب)';
      isDeprived = true;
    } else if (percentage >= 7) {
      tier = 'final_warning_7';
      label = 'إنذار نهائي (بلغ 7% غياب)';
    } else if (percentage >= 5) {
      tier = 'warning_5';
      label = 'إنذار أولي (بلغ 5% غياب)';
    } else if (percentage >= 3) {
      tier = 'notice_3';
      label = 'تنبيه غياب (بلغ 3% غياب)';
    }

    return {
      absencePercentage: percentage,
      absentCount,
      warningTier: tier,
      warningLabel: label,
      isDeprived,
    };
  }
}
