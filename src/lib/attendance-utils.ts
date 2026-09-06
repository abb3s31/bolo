// 📋 مكتبة حسابات وضوابط الحضور والغياب والإجازات لمسار بولونيا - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import {
  AttendanceStatus,
  AttendanceWarningStatus,
  StudentAttendanceRecord,
  StudentCourseAttendanceSummary,
  DayOfWeek,
  LectureType,
} from '@/types'; // 🔗 استيراد الأنواع الرسمية
import { timeStringToMinutes } from './schedule-utils'; // 🕒 دالة تحويل التوقيت للدقائق
import { getStoredData, saveStoredData } from './mock-data'; // 💾 دوال التخزين المحلي الآمن

// ⚙️ واجهة إعدادات مادة معينة (الساعات الكلية المقررة، ومدة النظري والعملي، وعدد المحاضرات الأسبوعية)
export interface CourseDurationSetting {
  total_scheduled_hours?: number;        // ⏳ إجمالي ساعات المادة المقررة في الكورس (مثل: 60 س، 70 س، 75 س، 90 س)
  theory_hours?: number;                 // 📘 مدة المحاضرة النظرية (مثل: 1.5 س)
  practical_hours?: number;              // 🔬 مدة المحاضرة العملية (مثل: 1 س)
  lectures_per_week?: number;            // 🔢 قديم للتوافق العكسي (عدد المحاضرات الإجمالي)
  theory_lectures_per_week?: 1 | 2;      // 📘 عدد محاضرات النظري أسبوعياً (1 أو 2) يحددها رئيس القسم
  practical_lectures_per_week?: 1 | 2;   // 🔬 عدد محاضرات/مختبرات العملي أسبوعياً (1 أو 2) يحددها رئيس القسم
}

// ⚙️ واجهة إعدادات وتخصيص مدد وساعات المحاضرات للقسم
export interface DepartmentLectureDurationConfig {
  allowedDurations: number[]; // [1, 1.5, 2, 2.5, 3]
  defaultTheoryDuration: number; // 1.5
  defaultPracticalDuration: number; // 1
  defaultCourseTotalHours?: number; // 60 (الساعات الكلية الافتراضية للمادة)
  courseCustomDurations?: Record<string, CourseDurationSetting>; // courseId -> custom config
}

// ⚙️ الإعدادات القياسية الافتراضية لمدد المحاضرات (العملي الافتراضي ساعة واحدة والنظري ساعة ونصف والساعات الكلية 60 س)
export const DEFAULT_LECTURE_DURATIONS_CONFIG: DepartmentLectureDurationConfig = {
  allowedDurations: [1, 1.5, 2, 2.5, 3],
  defaultTheoryDuration: 1.5,
  defaultPracticalDuration: 1,
  defaultCourseTotalHours: 60,
  courseCustomDurations: {},
};

// 📥 جلب إعدادات مدد المحاضرات للقسم
export function getDepartmentDurationConfig(deptId?: string): DepartmentLectureDurationConfig {
  const key = deptId ? `dept_duration_config_${deptId}` : 'dept_duration_config_default';
  const loaded = getStoredData<DepartmentLectureDurationConfig>(key, DEFAULT_LECTURE_DURATIONS_CONFIG);
  return {
    ...DEFAULT_LECTURE_DURATIONS_CONFIG,
    ...loaded,
    courseCustomDurations: loaded.courseCustomDurations || {},
  };
}

// 💾 حفظ وتحديث إعدادات مدد المحاضرات للقسم مع إشعار كافة الشاشات
export function saveDepartmentDurationConfig(config: DepartmentLectureDurationConfig, deptId?: string): void {
  const key = deptId ? `dept_duration_config_${deptId}` : 'dept_duration_config_default';
  saveStoredData(key, config);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('lecture_durations_updated'));
    window.dispatchEvent(new Event('storage'));
  }
}

// ⏳ دالة جلب إجمالي الساعات المقررة لمادة دراسية (مخصصة يدوياً مثل 60 أو 70 س أو افتراضية)
export function getCourseTotalScheduledHours(
  config: DepartmentLectureDurationConfig,
  courseId: string,
  fallbackCreditHours?: number
): number {
  const custom = config.courseCustomDurations?.[courseId];
  if (custom && typeof custom.total_scheduled_hours === 'number' && custom.total_scheduled_hours > 0) {
    return custom.total_scheduled_hours;
  }
  if (config.defaultCourseTotalHours && config.defaultCourseTotalHours > 0) {
    return config.defaultCourseTotalHours;
  }
  return fallbackCreditHours && fallbackCreditHours > 0 ? fallbackCreditHours * 15 : 60;
}

// ⏳ دالة جلب مدة المحاضرة الواحدة لمادة دراسية (نظري أو عملي)
export function getCourseLectureDuration(
  config: DepartmentLectureDurationConfig,
  courseId: string,
  lectureType: LectureType
): number {
  const custom = config.courseCustomDurations?.[courseId];
  if (custom) {
    if (lectureType === 'practical' && typeof custom.practical_hours === 'number' && custom.practical_hours > 0) {
      return custom.practical_hours;
    }
    if (lectureType !== 'practical' && typeof custom.theory_hours === 'number' && custom.theory_hours > 0) {
      return custom.theory_hours;
    }
  }
  return lectureType === 'practical'
    ? (config.defaultPracticalDuration ?? 1)
    : (config.defaultTheoryDuration ?? 1.5);
}

// 🔢 دالة استخراج عدد المحاضرات الأسبوعية المعتمدة للمادة (1 أو 2 محاضرة) لكل مسار تدريسي بشكل مستقل
export function getCourseLecturesPerWeek(
  config: DepartmentLectureDurationConfig,
  courseId: string,
  lectureType: LectureType = 'theory',
  scheduleLecturesCount?: number
): 1 | 2 {
  const custom = config.courseCustomDurations?.[courseId];
  if (custom) {
    // 🔬 للعملي: فحص إذا حدد رئيس القسم عدد محاضرات/مختبرات العملي
    if (lectureType === 'practical') {
      if (custom.practical_lectures_per_week === 1 || custom.practical_lectures_per_week === 2) {
        return custom.practical_lectures_per_week;
      }
    } else {
      // 📘 للنظري: فحص إذا حدد رئيس القسم عدد محاضرات النظري
      if (custom.theory_lectures_per_week === 1 || custom.theory_lectures_per_week === 2) {
        return custom.theory_lectures_per_week;
      }
    }

    // دعم الحقل القديم للتوافق العكسي
    if (typeof custom.lectures_per_week === 'number' && (custom.lectures_per_week === 1 || custom.lectures_per_week === 2)) {
      return custom.lectures_per_week as 1 | 2;
    }
  }

  // إذا كانت هناك محاضرات مجدولة فعلية من هذا النوع
  if (typeof scheduleLecturesCount === 'number' && scheduleLecturesCount > 0) {
    return scheduleLecturesCount >= 2 ? 2 : 1;
  }

  // الافتراضي الأكاديمي: العملي مختبر واحد (1)، والنظري محاضرتان (2) ما لم يعتمد رئيس القسم غير ذلك
  return lectureType === 'practical' ? 1 : 2;
}

// 🔤 تنسيق نص مدة المحاضرة بالعربية الفصحى الواضحة
export function formatDurationLabelAr(hours: number): string {
  if (hours === 1) return 'ساعة تدريسية واحدة (60 دقيقة)';
  if (hours === 1.5) return 'ساعة ونصف (90 دقيقة)';
  if (hours === 2) return 'ساعتان تدريسيتان (120 دقيقة)';
  if (hours === 2.5) return 'ساعتان ونصف (150 دقيقة)';
  if (hours === 3) return '3 ساعات تدريسية (180 دقيقة)';
  if (hours === 4) return '4 ساعات تدريسية (240 دقيقة)';
  return `${hours} ساعات تدريسية`;
}

// ⏰ حساب وقت الانتهاء التلقائي بناءً على وقت البدء والمدة
export function calculateEndTime(startTime: string, durationHours: number): string {
  if (!startTime) return '10:00';
  const parts = startTime.split(':');
  const startH = parseInt(parts[0] || '8', 10);
  const startM = parseInt(parts[1] || '30', 10);
  const totalMinutes = startH * 60 + startM + Math.round(durationHours * 60);
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

// 🔢 قائمة أسابيع الفصل الدراسي المعتمدة بنظام بولونيا (15 أسبوعاً دراسياً)
export const BOLOGNA_SEMESTER_WEEKS: { week: number; label_ar: string; label_en: string }[] = Array.from(
  { length: 15 },
  (_, idx) => ({
    week: idx + 1,
    label_ar: `الأسبوع ${idx + 1}`,
    label_en: `Week ${idx + 1}`,
  })
);

// 🚥 التكوين البصري واللوني لحالات الحضور والغياب والإجازات الـ 5
export const ATTENDANCE_STATUS_META: Record<
  AttendanceStatus,
  {
    label_ar: string;       // 📝 الاسم بالعربية
    label_en: string;       // 🔤 الاسم بالإنكليزية
    icon: string;           // 🎨 الإيموجي الدال
    colorName: string;      // 🏷️ اسم اللون
    bgLight: string;        // 🎨 خلفية خفيفة
    textDark: string;       // 🎨 نص بارز
    border: string;         // 🎨 لون الإطار
    badgeBg: string;        // 🎨 خلفية الشارة
    badgeText: string;      // 🎨 نص الشارة
    impactOnAbsence: boolean;// ⚠️ هل يؤثر على ساعات الغياب المحسوبة للحرمان؟
  }
> = {
  present: {
    label_ar: 'حاضر',
    label_en: 'Present',
    icon: '🟢',
    colorName: 'زمردي',
    bgLight: 'bg-emerald-50',
    textDark: 'text-emerald-950',
    border: 'border-emerald-400',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    impactOnAbsence: false,
  },
  absent_unexcused: {
    label_ar: 'غائب (بدون عذر)',
    label_en: 'Unexcused Absence',
    icon: '🔴',
    colorName: 'أحمر قرمزي',
    bgLight: 'bg-rose-50',
    textDark: 'text-rose-950',
    border: 'border-rose-500',
    badgeBg: 'bg-rose-600',
    badgeText: 'text-white',
    impactOnAbsence: true,
  },
  absent_excused: {
    label_ar: 'مجاز (عذر رسمي/طبي)',
    label_en: 'Excused Leave',
    icon: '🔵',
    colorName: 'أزرق',
    bgLight: 'bg-blue-50',
    textDark: 'text-blue-950',
    border: 'border-blue-400',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
    impactOnAbsence: false,
  },
  holiday: {
    label_ar: 'عطلة رسمية',
    label_en: 'Official Holiday',
    icon: '🏖️',
    colorName: 'سماوي',
    bgLight: 'bg-sky-50',
    textDark: 'text-sky-950',
    border: 'border-sky-400',
    badgeBg: 'bg-sky-600',
    badgeText: 'text-white',
    impactOnAbsence: false,
  },
  late: {
    label_ar: 'متأخر عن المحاضرة',
    label_en: 'Late Arrival',
    icon: '⏱️',
    colorName: 'رمادي',
    bgLight: 'bg-slate-100',
    textDark: 'text-slate-900',
    border: 'border-slate-300',
    badgeBg: 'bg-slate-700',
    badgeText: 'text-white',
    impactOnAbsence: false,
  },
  unset: {
    label_ar: 'غير محدد',
    label_en: 'Unset',
    icon: '⚪',
    colorName: 'رمادي محايد',
    bgLight: 'bg-slate-100',
    textDark: 'text-slate-700',
    border: 'border-slate-300',
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-800',
    impactOnAbsence: false,
  },
};

// ⚠️ نسب الإنذارات الرسمية لمسار بولونيا المعتمدة من وزارة التعليم العالي
export const BOLOGNA_ATTENDANCE_THRESHOLDS = {
  WARNING_1_PERCENT: 5,   // 🟡 إنذار أولي عند 5%
  WARNING_2_PERCENT: 7,   // 🟠 إنذار نهائي عند 7%
  BANNED_PERCENT: 10,     // 🔴 حرمان كامل عند 10%
};

// 🧮 حساب مدة المحاضرة بالساعات بناءً على وقت البدء والانتهاء
export function calculateLectureDurationHours(startTime: string, endTime: string): number {
  const startMin = timeStringToMinutes(startTime);
  const endMin = timeStringToMinutes(endTime);
  const diffMinutes = endMin - startMin;
  if (diffMinutes <= 0) return 2; // افتراضي ساعتان
  return parseFloat((diffMinutes / 60).toFixed(1));
}

// 🧮 حساب ملخص غياب وحضور الطالب في مادة معينة مع دعم التخصيص اليدوي للساعات الكلية (مثل: 60 س أو 70 س)
export function calculateStudentCourseAttendance(
  studentId: string,
  courseId: string,
  records: StudentAttendanceRecord[],
  courseName: string,
  courseCode: string,
  courseCreditHours: number = 3,
  customTotalScheduledHours?: number,
  filterLectureType?: LectureType, // 📘 فلترة المسار التدريسي: نظري أو عملي
  filterLectureSlot?: number       // 🕒 فلترة رقم المحاضرة في الأسبوع: المحاضرة 1 أو 2
): StudentCourseAttendanceSummary {
  // تصفية سجلات هذا الطالب في هذه المادة مع دعم الفلترة الدقيقة للمسار ورقم المحاضرة
  const courseRecords = records.filter((r) => {
    const isStudentMatch = r.student_id === studentId || r.university_number === studentId;
    const isCourseMatch = r.course_id === courseId;
    if (!isStudentMatch || !isCourseMatch) return false;

    // فصل سجل النظري عن سجل العملي بدقة
    if (filterLectureType && r.lecture_type !== filterLectureType) return false;

    // فصل سجل المحاضرة الأولى عن المحاضرة الثانية
    if (filterLectureSlot !== undefined && filterLectureSlot !== null) {
      const recSlot = r.lecture_slot || 1;
      if (recSlot !== filterLectureSlot) return false;
    }

    return true;
  });

  let presentCount = 0;
  let absentUnexcusedCount = 0;
  let absentExcusedCount = 0;
  let holidayCount = 0;
  let lateCount = 0;

  let totalUnexcusedHours = 0;
  let totalExcusedHours = 0;
  let totalPresentHours = 0;
  let totalHolidayHours = 0; // 🏖️ عداد ساعات العطل الرسمية

  let theoryAbsenceHours = 0;
  let theoryPresentHours = 0;
  let practicalAbsenceHours = 0;
  let practicalPresentHours = 0;

  courseRecords.forEach((r) => {
    const dur = r.duration_hours || 1.5;
    const isPractical = r.lecture_type === 'practical';

    if (r.status === 'present') {
      presentCount++;
      totalPresentHours += dur;
      if (isPractical) practicalPresentHours += dur;
      else theoryPresentHours += dur;
    } else if (r.status === 'absent_unexcused') {
      absentUnexcusedCount++;
      totalUnexcusedHours += dur;
      if (isPractical) practicalAbsenceHours += dur;
      else theoryAbsenceHours += dur;
    } else if (r.status === 'absent_excused') {
      absentExcusedCount++;
      totalExcusedHours += dur;
    } else if (r.status === 'holiday') {
      holidayCount++;
      totalHolidayHours += dur; // 🏖️ إضافة مدة المحاضرة لساعات العطل الرسمية
    } else if (r.status === 'late') {
      lateCount++;
      totalPresentHours += dur;
      if (isPractical) practicalPresentHours += dur;
      else theoryPresentHours += dur;
    }
  });

  // إجمالي الساعات المقررة للمادة في الكورس (تخصيص يدوي كـ 60 أو 70 أو بناءً على الوحدات)
  const baseScheduledHours = customTotalScheduledHours && customTotalScheduledHours > 0
    ? customTotalScheduledHours
    : (courseCreditHours || 3) * 15;
  const totalAbsenceHours = totalUnexcusedHours + totalExcusedHours;

  // نسبة الساعات المقدرة للنظري والعملي
  const estimatedTheoryWeeklyHours = Math.max(1, Math.round((courseCreditHours || 3) * 0.67));
  const theoryScheduledHours = Math.round(baseScheduledHours * 0.67);
  const practicalScheduledHours = baseScheduledHours - theoryScheduledHours;

  // تحديد الساعات المستهدفة بحسب الفلترة (نظري فقط / عملي فقط / الكل)
  let targetScheduledHours = baseScheduledHours;
  if (filterLectureType === 'theory') {
    targetScheduledHours = theoryScheduledHours;
  } else if (filterLectureType === 'practical') {
    targetScheduledHours = practicalScheduledHours;
  }

  // إذا كانت الفلترة لمحاضرة واحدة أسبوعياً من أصل محاضرتين
  if (filterLectureSlot !== undefined && filterLectureSlot !== null) {
    targetScheduledHours = Math.max(1, Math.round(targetScheduledHours / 2));
  }

  const totalScheduledHours = targetScheduledHours;

  // نسبة الغياب غير المبرر (التي تحتسب للحرمان)
  const absencePercentage = totalScheduledHours > 0 
    ? parseFloat(((totalUnexcusedHours / totalScheduledHours) * 100).toFixed(1)) 
    : 0;

  // نسبة الغياب الكلية
  const totalAbsencePercentage = totalScheduledHours > 0 
    ? parseFloat(((totalAbsenceHours / totalScheduledHours) * 100).toFixed(1)) 
    : 0;

  // نسبة الحضور الفعلية (افتراضياً 0% إذا لم تكن هناك محاضرات مرصودة)
  const actualLectures = presentCount + absentUnexcusedCount + absentExcusedCount + lateCount;
  const attendanceRate = actualLectures > 0 
    ? parseFloat((((presentCount + lateCount) / actualLectures) * 100).toFixed(1)) 
    : 0; // 0️⃣ القيمة الافتراضية 0 للحضور عند البداية

  // تحديد حالة الإنذار وفق ضوابط بولونيا
  let warningStatus: AttendanceWarningStatus = 'safe';
  if (absencePercentage >= BOLOGNA_ATTENDANCE_THRESHOLDS.BANNED_PERCENT) {
    warningStatus = 'banned';
  } else if (absencePercentage >= BOLOGNA_ATTENDANCE_THRESHOLDS.WARNING_2_PERCENT) {
    warningStatus = 'warning_2';
  } else if (absencePercentage >= BOLOGNA_ATTENDANCE_THRESHOLDS.WARNING_1_PERCENT) {
    warningStatus = 'warning_1';
  }

  return {
    course_id: courseId,
    course_name: courseName,
    course_code: courseCode,
    total_lectures_count: courseRecords.length,
    present_count: presentCount,
    absent_unexcused_count: absentUnexcusedCount,
    absent_excused_count: absentExcusedCount,
    holiday_count: holidayCount,
    late_count: lateCount,
    total_scheduled_hours: totalScheduledHours,
    total_unexcused_absence_hours: totalUnexcusedHours,
    total_excused_absence_hours: totalExcusedHours,
    total_holiday_hours: totalHolidayHours, // 🏖️ إجمالي ساعات العطل الرسمية للمادة
    total_absence_hours: totalAbsenceHours,
    absence_percentage: absencePercentage,
    total_absence_percentage: totalAbsencePercentage,
    warning_status: warningStatus,
    attendance_rate_percentage: attendanceRate,

    // 🔬 📚 تفصيل ساعات النظري والعملي المنفصلة
    theory_scheduled_hours: theoryScheduledHours,
    theory_absence_hours: theoryAbsenceHours,
    theory_present_hours: theoryPresentHours,
    practical_scheduled_hours: practicalScheduledHours,
    practical_absence_hours: practicalAbsenceHours,
    practical_present_hours: practicalPresentHours,
    total_present_hours: theoryPresentHours + practicalPresentHours,
  };
}

// 🏷️ استخراج تفاصيل شارة الإنذار الأكاديمي لمسار بولونيا
export function getAttendanceWarningBadgeMeta(status: AttendanceWarningStatus): {
  label_ar: string;
  badgeClass: string;
  cardBorderClass: string;
  icon: string;
  description: string;
} {
  switch (status) {
    case 'safe':
      return {
        label_ar: 'الوضع آمن (أقل من 5%)',
        badgeClass: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-black',
        cardBorderClass: 'border-emerald-300',
        icon: '🛡️',
        description: 'سجل الحضور ممتاز وضمن الحدود الأكاديمية الآمنة.',
      };
    case 'warning_1':
      return {
        label_ar: 'إنذار أولي (تجاوز 5%)',
        badgeClass: 'bg-blue-100 text-blue-950 border border-blue-300 font-black',
        cardBorderClass: 'border-blue-400',
        icon: '⚠️',
        description: 'تنبيه: اقتربت من حاجز الإنذار النهائي. يرجى الالتزام بالحضور.',
      };
    case 'warning_2':
      return {
        label_ar: 'إنذار نهائي (تجاوز 7%)',
        badgeClass: 'bg-rose-100 text-rose-950 border border-rose-300 font-black',
        cardBorderClass: 'border-rose-400',
        icon: '🚨',
        description: 'تحذير شديد: أنت على وشك الحرمان من الامتحان النهائي في حال غياب محاضرة إضافية.',
      };
    case 'banned':
      return {
        label_ar: 'محروم من الامتحان (تجاوز 10%)',
        badgeClass: 'bg-red-700 text-white font-black shadow-xs', // 🛑 شارة حمراء ثابتة بدون وميض بناءً على طلب المستخدم
        cardBorderClass: 'border-red-600 ring-2 ring-red-500/20',
        icon: '🚫',
        description: 'تم حرمان الطالب من دخول الامتحان النهائي لتجاوزه النسبة القانونية للغياب (10%).',
      };
  }
}
