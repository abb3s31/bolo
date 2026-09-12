'use client'; // ⚡ ينفذ بالعميل على متصفح الأستاذ

// 📋 مكون محرر وسجل الحضور والغياب والإجازات الأكاديمي الشامل والفاخر لمسار بولونيا (AttendanceSheetEditor)
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة ودورة الحياة والمراجع
import {
  Course,
  UserProfile,
  ScheduleLecture,
  StudentAttendanceRecord,
  AttendanceStatus,
  DayOfWeek,
  LectureType,
  AttendanceExcuseRequest,
  CourseWeeklySessionSchedule, // 📅 نوع جدول توقيت المحاضرات المعتمد أسبوعياً
  DepartmentScheduleConfig, // ⚙️ إعدادات جدول القسم والعطل
} from '@/types'; // 🔗 استيراد الأنواع الرسمية المعتمدة في النظام الأكاديمي
import {
  BOLOGNA_SEMESTER_WEEKS,
  ATTENDANCE_STATUS_META,
  calculateLectureDurationHours,
  calculateStudentCourseAttendance,
  getAttendanceWarningBadgeMeta,
  getCourseTotalScheduledHours,
  DepartmentLectureDurationConfig,
  CourseDurationSetting, // ⚙️ نوع إعدادات مدة وعدد المحاضرات للمادة
  getDepartmentDurationConfig,
  saveDepartmentDurationConfig, // 💾 دالة حفظ وتحديث إعدادات ساعات القسم
  formatDurationLabelAr,
  calculateEndTime,
  getCourseLectureDuration,
  getCourseLecturesPerWeek,
} from '@/lib/attendance-utils'; // 🕒 دوال حسابات الحضور وضوابط بولونيا الدقيقة وإعدادات الساعات
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧮 التعرف الذكي على جنس الطلاب
import {
  DAYS_OF_WEEK_LIST,
  calculateDateForAnyDayInWeek,
  getDayOfWeekFromDateString,
  getCurrentAcademicWeek,
  formatDateArabicWithDay,
  IRAQI_ARABIC_MONTHS,
} from '@/lib/schedule-utils'; // 🗓️ دوال الجداول والأسابيع الـ 15 المعتمدة لمسار بولونيا
import ArabicDatePicker from '@/components/schedule/ArabicDatePicker'; // 📅 مكون التقويم الأكاديمي العربي الفاخر
import { getStoredData, saveStoredData, INITIAL_EXCUSE_REQUESTS } from '@/lib/mock-data'; // 💾 دوال التخزين المحلي
import {
  syncDepartmentDurationConfigFromSupabase,
  saveExcuseRequestToSupabase,
  saveDepartmentDurationConfigToSupabase, // ☁️ دالة حفظ إعدادات الساعات في سحابة Supabase
} from '@/lib/supabase-client'; // 🔌 مزامنة قاعدة بيانات Supabase السحابية وحفظ الإجازات
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Sun,
  Moon,
  Timer,
  Save,
  Users,
  Search,
  FileText,
  ClipboardList,
  Square,
  CheckSquare,
  Send,
  BellRing,
  GraduationCap,
  Layers,
  ChevronDown,
  BookOpen,
  FlaskConical,
  Check,
  X,
  Info,
  ShieldCheck,
  RotateCcw,
  Printer,
  Palmtree,
  Hourglass,
  Download,
  Lock,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react'; // 🎨 استيراد أيقونات SVG الفيكتورية عالية الدقة
import { exportBolognaAttendanceReportPDF } from '@/lib/pdf-export'; // 📄 مولد كشف الحضور الأكاديمي الرسمي لمسار بولونيا PDF
import { exportCustomAttendanceList } from '@/lib/excel-utils'; // 📊 مولد كشف الحضور والإنذارات الأكاديمية الرسمي الفاخر Excel
import ExcuseRequestsReviewModal from '@/components/attendance/ExcuseRequestsReviewModal'; // 📑 نافذة تدقيق ومراجعة طلبات الإجازات
import AttendanceNoticeModal, { AttendanceNoticeCategory } from '@/components/attendance/AttendanceNoticeModal'; // 📢 نافذة التبليغات والتنبيهات الذكية
import { GroupUsersSvg, GroupBadgeSvg } from '@/components/common/GroupSvgIcons'; // 👥 استيراد أيقونات الكروبات والشعب الفيكتورية النقية
import { AttendanceHolidaySvg, StudentDaysSheetSvg } from '@/components/common/AttendanceCustomSvgIcons'; // 🏖️ أيقونات العطلة الرسمية وكشف الأيام الفيكتورية النقية بدون برتقالي وبدون بنفسجي
import { isDateOfficialHoliday } from '@/lib/holiday-service'; // 🏖️ دالة التحقق الذكي من العطل الرسمية المعتمدة للقسم
import StudentAttendanceDaysModal from '@/components/attendance/StudentAttendanceDaysModal'; // 📋 نافذة كشف الأيام الشامل للطالب

// 🌟 واجهة بيانات التنبيه العائم التفاعلي الفاخر
export interface AttendanceFloatingToast {
  id: string;
  title: string;
  subtitle?: string;
  type: 'present' | 'absent_unexcused' | 'absent_excused' | 'late' | 'holiday' | 'unset' | 'action' | 'save' | 'pdf' | 'info';
  timestamp: number;
}

// 📋 واجهة الخصائص المستقبلة لمحرر الحضور
interface AttendanceSheetEditorProps {
  course: Course;                               // 📘 بيانات المادة الدراسية
  students: UserProfile[];                      // 👥 قائمة طلاب المرحلة والشعبة
  lectures: ScheduleLecture[];                  // 🕒 المحاضرات المجدولة في الجدول الأسبوعي
  initialRecords: StudentAttendanceRecord[];    // 📋 كافة سجلات الحضور المحفوظة
  onSaveRecords: (records: StudentAttendanceRecord[]) => void; // 💾 دالة حفظ وتثبيت السجلات
  teacherId?: string;                           // 🆔 معرف الأستاذ الحالي
  teacherName?: string;                         // 👤 اسم الأستاذ بالعربية
  currentUser?: UserProfile | null;             // 👤 بيانات المستخدم الحالي للتحقق من الصلاحيات
  departmentHeadName?: string;                  // 🏛️ اسم رئيس القسم المعتمد
  rapporteurName?: string;                      // 📝 اسم مقرر القسم المعتمد
}

// 🗓️ دالة استخراج اليوم الأكاديمي المعتمد من التاريخ التقويمي
function getDayOfWeekFromDate(dateStr: string): DayOfWeek {
  const d = new Date(dateStr);
  const dayIndex = d.getDay(); // 0 = الأحد, 1 = الإثنين, ..., 6 = السبت
  const map: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return map[dayIndex] || 'saturday';
}

// 📅 دالة احتساب التاريخ التقويمي المتسلسل لكل أسبوع (+7 أيام لكل أسبوع)
function calculateCalendarWeekDate(baseDateStr: string, weekNumber: number, targetDay: DayOfWeek): string {
  return calculateDateForAnyDayInWeek(baseDateStr, 1, weekNumber, targetDay);
}

// 🎯 قائمة خيارات أنواع المحاضرات مع الأيقونات والأسماء العربية النقية
const LECTURE_TYPES_CONFIG: { key: LectureType; label_ar: string; icon: typeof BookOpen; badgeClass: string }[] = [
  { key: 'theory', label_ar: 'سجل النظري', icon: BookOpen, badgeClass: 'bg-blue-50 text-blue-950 border-blue-200' },
  { key: 'practical', label_ar: 'سجل العملي / المختبر', icon: FlaskConical, badgeClass: 'bg-emerald-50 text-emerald-950 border-emerald-300' },
  { key: 'tutorial', label_ar: 'سجل المناقشة والتمارين', icon: FileText, badgeClass: 'bg-indigo-50 text-indigo-950 border-indigo-200' },
];

export default function AttendanceSheetEditor({
  course,
  students,
  lectures,
  initialRecords,
  onSaveRecords,
  teacherId = 'usr-teacher-1',
  teacherName = 'أستاذ المادة',
  currentUser,
  departmentHeadName = 'رئاسة القسم العلمي',
  rapporteurName = 'مقررية القسم العلمي',
}: AttendanceSheetEditorProps) {
  // 📆 استخراج تاريخ انطلاق الفصل الدراسي المعتمد للقسم (مسار بولونيا)
  const effectiveStartDate = useMemo(() => {
    if (typeof window !== 'undefined') {
      const scheduleConfigs = getStoredData<DepartmentScheduleConfig[]>('department_schedule_configs', []);
      const deptCfg = scheduleConfigs.find(
        (c) => c.department_id === course.department_id && c.start_date && c.start_date.trim() !== ''
      );
      if (deptCfg?.start_date) return deptCfg.start_date;
      const anyWithDate = scheduleConfigs.find((c) => c.start_date && c.start_date.trim() !== '');
      if (anyWithDate?.start_date) return anyWithDate.start_date;
    }
    const lecWithDate = lectures.find((l) => l.date && l.date.trim() !== '');
    if (lecWithDate?.date) return lecWithDate.date;
    return '2026-09-20';
  }, [course.department_id, lectures]);

  // ⚡ احتساب الأسبوع الأكاديمي الحالي التلقائي نسبة لتاريخ اليوم الفعلي
  const currentAcademicWeek = useMemo(() => {
    return getCurrentAcademicWeek(effectiveStartDate);
  }, [effectiveStartDate]);

  // 📌 1. حالة الأسبوع الدراسي المختار من 1 إلى 15 (مسار بولونيا - يبدأ تلقائياً من الأسبوع الحالي)
  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    return getCurrentAcademicWeek(effectiveStartDate);
  });

  // 🎯 2. حالة رقم المحاضرة في الأسبوع أو اليوم (المحاضرة 1 أو المحاضرة 2)
  const [selectedLectureSlot, setSelectedLectureSlot] = useState<1 | 2>(1);

  // ⚙️ 3. قراءة إعدادات مدد وساعات المحاضرات المعتمدة والمخصصة من رئاسة القسم
  const [durationConfig, setDurationConfig] = useState<DepartmentLectureDurationConfig>(() =>
    getDepartmentDurationConfig(course.department_id)
  );

  // ⏳ إجمالي الساعات المقررة للمادة (مخصصة يدوياً مثل 60 أو 70 س أو الافتراضية)
  const courseTotalHours = useMemo(() => {
    return getCourseTotalScheduledHours(durationConfig, course.id, course.credit_hours);
  }, [durationConfig, course.id, course.credit_hours]);

  // ⏳ دالة استخراج المدة الافتراضية للمادة بناءً على تخصيص القسم (العملي 1 ساعة والنظري 1.5 ساعة والمخصص)
  const getLectureTypeDefaultDuration = useCallback(
    (type: LectureType) => {
      return getCourseLectureDuration(durationConfig, course.id, type);
    },
    [durationConfig, course.id]
  );

  // 🏷️ نوع المحاضرة الافتراضي المبدئي (نظري أو عملي)
  const initialLectureType: LectureType = 'theory';
  const initialDuration = getLectureTypeDefaultDuration(initialLectureType);

  // ⏳ 4. حالة مدة المحاضرة بالساعات الفعلية (العملي 1 ساعة والنظري 1.5 ساعة أو المخصص)
  const [selectedDurationHours, setSelectedDurationHours] = useState<number>(initialDuration);

  // 🔄 الاستماع للتحديثات الحية لتخصيصات الساعات من لوحة رئيس ومقرر القسم وسحابة Supabase
  useEffect(() => {
    const handleDurationSync = () => {
      const updated = getDepartmentDurationConfig(course.department_id);
      setDurationConfig(updated);
    };

    // ☁️ مزامنة سحابية لإعدادات مدد وساعات المحاضرات
    syncDepartmentDurationConfigFromSupabase(course.department_id).then((cloudConfig) => {
      if (cloudConfig && typeof cloudConfig === 'object') {
        const updated = getDepartmentDurationConfig(course.department_id);
        setDurationConfig(updated);
      }
    }).catch(() => { });

    window.addEventListener('lecture_durations_updated', handleDurationSync);
    window.addEventListener('storage', handleDurationSync);
    return () => {
      window.removeEventListener('lecture_durations_updated', handleDurationSync);
      window.removeEventListener('storage', handleDurationSync);
    };
  }, [course.department_id]);

  // 📌 5. حالة التاريخ واليوم ونوع المحاضرة والتوقيت
  const todayIso = new Date().toISOString().split('T')[0]; // 📅 تاريخ اليوم بصيغة ISO
  const [selectedDate, setSelectedDate] = useState<string>(todayIso); // 📆 التاريخ المختار
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('saturday'); // 🗓️ اليوم المختار
  const [selectedStartTime, setSelectedStartTime] = useState<string>('08:30'); // ⏰ وقت البدء
  const [selectedEndTime, setSelectedEndTime] = useState<string>(() => calculateEndTime('08:30', initialDuration)); // ⏰ وقت الانتهاء المحسوب تلقائياً
  const [selectedLectureType, setSelectedLectureType] = useState<LectureType>(initialLectureType); // 🏷️ نوع المحاضرة

  // 🏖️ فحص ذكي هل تاريخ الجلسة الحالية يصادف عطلة رسمية معتمدة من رئاسة ومقررية القسم
  const officialHolidayInfo = useMemo(() => {
    return isDateOfficialHoliday(selectedDate, course.department_id, course.stage_number);
  }, [selectedDate, course.department_id, course.stage_number]);

  // 📅 سجل المواعيد والتوقيتات المعتمدة من رئاسة ومقررية القسم لكل أسبوع
  const [weeklySchedules, setWeeklySchedules] = useState<CourseWeeklySessionSchedule[]>(() => {
    return getStoredData<CourseWeeklySessionSchedule[]>('course_weekly_schedules', []);
  });

  // 🛡️ فحص صلاحية رئاسة القسم أو المقرر أو المشرف العام
  const isDeptAuthorized = useMemo<boolean>(() => {
    if (!currentUser) return false;
    return ['department_head', 'rapporteur', 'super_admin'].includes(currentUser.role);
  }, [currentUser]);

  // 🔍 6. حالات البحث والتصفية
  const [searchQuery, setSearchQuery] = useState<string>(''); // 🔍 نص البحث عن طالب
  const [studyTypeFilter, setStudyTypeFilter] = useState<'all' | 'morning' | 'evening'>('all'); // ☀️🌙 تصفية الفترة الدراسية
  const [attendanceGroupFilter, setAttendanceGroupFilter] = useState<string>('all'); // 👥 تصفية الكروب لسجل الحضور ('all' | 'unassigned' | 'A' | 'B'...)

  // 📑 7. حالات النوافذ المنبثقة للإجازات والتبليغات
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false); // 📑 نافذة مراجعة الإجازات
  const [excuseRequests, setExcuseRequests] = useState<AttendanceExcuseRequest[]>([]); // 📄 طلبات الإجازات
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState<boolean>(false); // 📢 نافذة إرسال التبليغات
  const [noticeTargetStudent, setNoticeTargetStudent] = useState<UserProfile | null>(null); // 👤 الطالب المستهدف بالتبليغ
  const [noticeDefaultCategory, setNoticeDefaultCategory] = useState<AttendanceNoticeCategory>('warning_1'); // ⚠️ فئة التبليغ الافتراضية
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false); // ⏳ حالة تصدير إكسل الفاخر
  const [isTeacherDaysModalOpen, setIsTeacherDaysModalOpen] = useState<boolean>(false); // 📋 حالة فتح نافذة كشف الأيام للطالب
  const [teacherSelectedStudentForDays, setTeacherSelectedStudentForDays] = useState<UserProfile | null>(null); // 🎓 الطالب المختار لكشف الأيام

  // 🔢 7.1.1 عدد محاضرات النظري المعتمدة أسبوعياً من قبل رئاسة القسم (1 أو 2)
  const theoryLecturesCount = useMemo<1 | 2>(() => {
    const theoryLecs = lectures.filter(
      (l) =>
        (l.course_id === course.id || (course.code && l.course_code === course.code) || (course.name && l.course_name === course.name)) &&
        (l.type || 'theory') === 'theory'
    );
    return getCourseLecturesPerWeek(durationConfig, course.id, 'theory', theoryLecs.length);
  }, [durationConfig, course.id, course.code, course.name, lectures]);

  // 🔬 7.1.2 عدد محاضرات/مختبرات العملي المعتمدة أسبوعياً من قبل رئاسة القسم (1 أو 2)
  const practicalLecturesCount = useMemo<1 | 2>(() => {
    const pracLecs = lectures.filter(
      (l) =>
        (l.course_id === course.id || (course.code && l.course_code === course.code) || (course.name && l.course_name === course.name)) &&
        l.type === 'practical'
    );
    return getCourseLecturesPerWeek(durationConfig, course.id, 'practical', pracLecs.length);
  }, [durationConfig, course.id, course.code, course.name, lectures]);

  // 🎯 7.1.3 عدد المحاضرات المعتمدة للمسار التدريسي المحدد حالياً (نظري أو عملي)
  const maxLecturesPerWeek = useMemo<1 | 2>(() => {
    return selectedLectureType === 'practical' ? practicalLecturesCount : theoryLecturesCount;
  }, [selectedLectureType, practicalLecturesCount, theoryLecturesCount]);

  // 🔄 7.1.4 إعادة ضبط رقم المحاضرة إلى 1 تلقائياً إذا كان المسار المحدد معتمداً بمحاضرة واحدة فقط
  useEffect(() => {
    if (maxLecturesPerWeek === 1 && selectedLectureSlot === 2) {
      setSelectedLectureSlot(1);
    }
  }, [maxLecturesPerWeek, selectedLectureSlot]);

  // ⚙️ 7.1.5 دالة تحديث واعتماد عدد محاضرات النظري أو العملي من قبل رئيس القسم أو المقرر فورياً
  const handleUpdateTrackLecturesCount = (type: LectureType, count: 1 | 2) => {
    const currentCustom = durationConfig.courseCustomDurations?.[course.id] || {};
    const updatedCustom: CourseDurationSetting = {
      ...currentCustom,
      ...(type === 'practical'
        ? { practical_lectures_per_week: count }
        : { theory_lectures_per_week: count }),
    };

    const updatedConfig: DepartmentLectureDurationConfig = {
      ...durationConfig,
      courseCustomDurations: {
        ...(durationConfig.courseCustomDurations || {}),
        [course.id]: updatedCustom,
      },
    };

    setDurationConfig(updatedConfig);
    saveDepartmentDurationConfig(updatedConfig, course.department_id);
    saveDepartmentDurationConfigToSupabase(updatedConfig, course.department_id).catch(() => {});

    // إذا تم تقليص المحاضرات إلى 1 وكان الأستاذ يفتح المحاضرة 2، يتم التبديل التلقائي للمحاضرة 1 فوراً
    if (count === 1 && selectedLectureSlot === 2) {
      loadSessionData(selectedWeek, 1, type);
    }

    showFloatingToast({
      title: `تم بنجاح اعتماد ${count === 1 ? 'محاضرة واحدة' : 'محاضرتين'} لـ (${type === 'practical' ? 'سجل العملي' : 'سجل النظري'}) 🛡️`,
      subtitle: `اعتماد رسمي من ${currentUser?.role === 'rapporteur' ? 'مقرر القسم' : 'رئاسة القسم'} لمقرر (${course.name})`,
      type: 'save',
    });
  };

  // 🔒 7.2 تحديد المسارات المسموحة للأستاذ المسجل حالياً (نظري فقط، عملي فقط، أو كلاهما)
  const allowedLectureTypes = useMemo<LectureType[]>(() => {
    const isAdminUser = currentUser && ['super_admin', 'admin', 'department_head', 'rapporteur'].includes(currentUser.role);

    // فحص هل المادة نظرية فقط بطبيعتها
    const isTheoryOnlyCourse = course.course_type === 'theory_only' || (!course.has_practical && course.course_type !== 'theory_and_practical');

    // فحص هل المادة تحتوي على مختبر أو جانب عملي معتمد
    const hasPractical = !isTheoryOnlyCourse && Boolean(
      course.has_practical ||
      course.course_type === 'theory_and_practical' ||
      (course.practical_teacher_id && course.practical_teacher_id !== 'none') ||
      lectures.some((l) => (l.course_id === course.id || l.course_name === course.name) && l.type === 'practical')
    );

    // إذا كانت المادة نظرية فقط
    if (!hasPractical) {
      return ['theory'];
    }

    // إذا كان المستخدم مديراً أو رئيس قسم أو مقرراً
    if (isAdminUser) {
      return ['theory', 'practical'];
    }

    const currentUserId = (currentUser?.id || teacherId || '').trim();
    const theoryTeacherId = (course.theory_teacher_id || '').trim();
    const practicalTeacherId = (course.practical_teacher_id || '').trim();

    const isTheory = Boolean(theoryTeacherId && theoryTeacherId === currentUserId) || (!theoryTeacherId && !practicalTeacherId);
    const isPractical = Boolean(practicalTeacherId && practicalTeacherId === currentUserId);

    if (isTheory && isPractical) {
      return ['theory', 'practical'];
    }
    if (isPractical && !isTheory) {
      return ['practical'];
    }
    if (isTheory && !isPractical) {
      return ['theory'];
    }

    return ['theory', 'practical'];
  }, [currentUser, teacherId, course, lectures]);

  // 🔄 ضبط تلقائي لرقم المحاضرة ونوعها عند تغير الصلاحيات أو إعدادات القسم
  useEffect(() => {
    if (selectedLectureSlot > maxLecturesPerWeek) {
      setSelectedLectureSlot(1);
    }
  }, [maxLecturesPerWeek, selectedLectureSlot]);

  useEffect(() => {
    if (!allowedLectureTypes.includes(selectedLectureType)) {
      setSelectedLectureType(allowedLectureTypes[0] || 'theory');
    }
  }, [allowedLectureTypes, selectedLectureType]);

  // 🔘 8. حالات التحديد المتعدد للطلبة
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]); // 👥 قائمة معرفات الطلبة المحددين

  // 🔔 9. حالات الحفظ والتصدير
  const [isSaving, setIsSaving] = useState<boolean>(false); // ⏳ حالة جاري الحفظ
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false); // ⏳ حالة جاري تصدير PDF

  // 📢 حالة التنبيه العائم الفاخر عند تسجيل الحضور أو إنجاز أي عملية
  const [floatingToast, setFloatingToast] = useState<AttendanceFloatingToast | null>(null);

  // 🔔 دالة إطلاق التنبيه العائم فورياً مع أيقونة SVG فيكتور
  const showFloatingToast = useCallback((toast: Omit<AttendanceFloatingToast, 'id' | 'timestamp'>) => {
    setFloatingToast({
      ...toast,
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    });
  }, []);

  // ⏱️ الإخفاء التلقائي للتنبيه العائم بعد 2.8 ثانية
  useEffect(() => {
    if (!floatingToast) return;
    const timer = setTimeout(() => {
      setFloatingToast(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [floatingToast]);

  // 🔄 9. تحميل طلبات الإجازات الخاصة بهذه المادة
  useEffect(() => {
    const loaded = getStoredData<AttendanceExcuseRequest[]>('excuse_requests', INITIAL_EXCUSE_REQUESTS);
    setExcuseRequests(loaded.filter((e) => e.course_id === course.id));
  }, [course.id]);

  const pendingExcusesCount = excuseRequests.filter((e) => e.status === 'pending').length; // 🔢 عدد الإجازات المعلقة

  // 📋 11. خريطة الجلسة الحالية لكل طالب
  const [currentSessionMap, setCurrentSessionMap] = useState<
    Record<
      string,
      {
        status: AttendanceStatus;
        excuse_reason: string;
        excuse_document_ref: string;
        late_minutes: number;
        notes: string;
      }
    >
  >(() => {
    const initialMap: Record<
      string,
      {
        status: AttendanceStatus;
        excuse_reason: string;
        excuse_document_ref: string;
        late_minutes: number;
        notes: string;
      }
    > = {};

    students.forEach((st) => {
      const existing = initialRecords.find(
        (r) =>
          r.student_id === st.id &&
          r.course_id === course.id &&
          r.week_number === 1 &&
          (r.lecture_slot === 1 || !r.lecture_slot) &&
          r.lecture_type === 'theory'
      );

      initialMap[st.id] = {
        status: existing ? existing.status : 'unset',
        excuse_reason: existing?.excuse_reason || '',
        excuse_document_ref: existing?.excuse_document_ref || '',
        late_minutes: existing?.late_minutes || 0,
        notes: existing?.notes || '',
      };
    });

    return initialMap;
  });

  // 📸 11.1 لقطة البداية للمسودة لرصد التعديلات والتراجع
  const [initialSnapshotMap, setInitialSnapshotMap] = useState<
    Record<
      string,
      {
        status: AttendanceStatus;
        excuse_reason: string;
        excuse_document_ref: string;
        late_minutes: number;
        notes: string;
      }
    >
  >(() => {
    const snapMap: Record<
      string,
      {
        status: AttendanceStatus;
        excuse_reason: string;
        excuse_document_ref: string;
        late_minutes: number;
        notes: string;
      }
    > = {};

    students.forEach((st) => {
      const existing = initialRecords.find(
        (r) =>
          r.student_id === st.id &&
          r.course_id === course.id &&
          r.week_number === 1 &&
          (r.lecture_slot === 1 || !r.lecture_slot) &&
          r.lecture_type === 'theory'
      );

      snapMap[st.id] = {
        status: existing ? existing.status : 'unset',
        excuse_reason: existing?.excuse_reason || '',
        excuse_document_ref: existing?.excuse_document_ref || '',
        late_minutes: existing?.late_minutes || 0,
        notes: existing?.notes || '',
      };
    });

    return snapMap;
  });

  // ⚖️ رصد التعديلات المعلقة بالجلسة لتفعيل نظام المسودة وزري الحفظ والتراجع
  const hasPendingChanges = useMemo<boolean>(() => {
    const keys = Object.keys(currentSessionMap);
    if (keys.length === 0) return false;
    return keys.some((k) => {
      const current = currentSessionMap[k];
      const snapshot = initialSnapshotMap[k];
      if (!snapshot) return current?.status !== 'unset';
      return current?.status !== snapshot.status;
    });
  }, [currentSessionMap, initialSnapshotMap]);

  // ↩️ دالة إلغاء التعديلات المعلقة واستعادة كشف الجلسة المحفوظ
  const handleDiscardChanges = () => {
    setCurrentSessionMap(JSON.parse(JSON.stringify(initialSnapshotMap)));
    showFloatingToast({
      title: 'تم إلغاء التعديلات بنجاح ↩️',
      subtitle: 'تمت استعادة حالة الكشف الأصلية للجلسة',
      type: 'info',
    });
  };

  // 🔄 12. دالة مركزية ذكية لتحميل بيانات الجلسة بحسب (الأسبوع، رقم المحاضرة، ونوع المحاضرة)
  const loadSessionData = (targetWeek: number, targetSlot: 1 | 2, targetType: LectureType) => {
    setSelectedWeek(targetWeek);
    setSelectedLectureSlot(targetSlot);
    setSelectedLectureType(targetType);

    const updatedMap: Record<
      string,
      {
        status: AttendanceStatus;
        excuse_reason: string;
        excuse_document_ref: string;
        late_minutes: number;
        notes: string;
      }
    > = {};

    let hasFoundExisting = false;

    students.forEach((st) => {
      const existing = initialRecords.find(
        (r) =>
          r.student_id === st.id &&
          r.course_id === course.id &&
          r.week_number === targetWeek &&
          (r.lecture_slot === targetSlot || (!r.lecture_slot && targetSlot === 1)) &&
          r.lecture_type === targetType
      );

      if (existing) {
        hasFoundExisting = true;
        updatedMap[st.id] = {
          status: existing.status,
          excuse_reason: existing.excuse_reason || '',
          excuse_document_ref: existing.excuse_document_ref || '',
          late_minutes: existing.late_minutes || 0,
          notes: existing.notes || '',
        };
        let effectiveExistingDate = existing.date;
        if (existing.date === '2026-09-20' && (existing.day !== 'sunday' || targetWeek > 1)) {
          effectiveExistingDate = calculateDateForAnyDayInWeek(effectiveStartDate || '2026-09-20', 1, targetWeek, existing.day);
        }
        setSelectedDate(effectiveExistingDate);
        setSelectedDay(existing.day);
        setSelectedStartTime(existing.start_time);
        setSelectedEndTime(existing.end_time);
        setSelectedDurationHours(existing.duration_hours || getLectureTypeDefaultDuration(targetType));
      } else {
        updatedMap[st.id] = {
          status: 'unset',
          excuse_reason: '',
          excuse_document_ref: '',
          late_minutes: 0,
          notes: '',
        };
      }
    });

    // إذا لم تكن هناك جلسة سابقة مرصودة، التحقق من التوقيت المعتمد من رئاسة القسم أو حسابه ديناميكياً
    if (!hasFoundExisting) {
      // 1. هل اعتمد رئيس القسم أو المقرر موعداً مخصصاً لهذا الأسبوع والمحاضرة؟
      const customSchedule = weeklySchedules.find(
        (s) =>
          s.course_id === course.id &&
          s.week_number === targetWeek &&
          s.lecture_slot === targetSlot &&
          s.lecture_type === targetType
      );

      if (customSchedule) {
        setSelectedDate(customSchedule.date);
        setSelectedDay(customSchedule.day);
        setSelectedStartTime(customSchedule.start_time);
        setSelectedEndTime(customSchedule.end_time);
        setSelectedDurationHours(customSchedule.duration_hours);
      } else {
        // 2. احتساب التوقيت التقويمي المتسلسل للأسبوع استناداً إلى جدول المادة المعتمد (+7 أيام لكل أسبوع)
        const typeDefault = getLectureTypeDefaultDuration(targetType);
        const matchedLec = lectures.find((l) => (l.type || 'theory') === targetType);
        const scheduledDay: DayOfWeek = matchedLec?.day || (targetSlot === 2 ? 'tuesday' : 'saturday');
        const scheduledStart = matchedLec?.start_time || '08:30';
        const dur = matchedLec ? calculateLectureDurationHours(matchedLec.start_time, matchedLec.end_time) : typeDefault;
        const scheduledDur = dur > 0 ? dur : typeDefault;
        const scheduledEnd = matchedLec?.end_time || calculateEndTime(scheduledStart, scheduledDur);

        // 📅 تاريخ الأسبوع التقويمي المحسوب بدقة من جدول القسم والتعاقب الذكي للأسابيع الـ 15
        let computedWeekDate = '';
        if (matchedLec?.custom_weekly_dates && matchedLec.custom_weekly_dates[targetWeek]) {
          computedWeekDate = matchedLec.custom_weekly_dates[targetWeek]; // 🗓️ أخذ التاريخ المحسوب تلقائياً لهذا الأسبوع
        } else if (matchedLec?.weekly_overrides && matchedLec.weekly_overrides[targetWeek]?.date) {
          const overrideVal = matchedLec.weekly_overrides[targetWeek]?.date;
          computedWeekDate = overrideVal || ''; // 📌 أخذ استثناء تاريخ هذا الأسبوع المخصص
        } else if (matchedLec?.date && getDayOfWeekFromDateString(matchedLec.date) === scheduledDay) {
          computedWeekDate = calculateDateForAnyDayInWeek(matchedLec.date, matchedLec.week_number || 1, targetWeek, scheduledDay);
        } else {
          computedWeekDate = calculateDateForAnyDayInWeek(effectiveStartDate || '2026-09-20', 1, targetWeek, scheduledDay);
        }

        const overrideDay = (matchedLec?.weekly_overrides && matchedLec.weekly_overrides[targetWeek]?.day) || scheduledDay;
        const overrideStart = (matchedLec?.weekly_overrides && matchedLec.weekly_overrides[targetWeek]?.start_time) || scheduledStart;
        const overrideEnd = (matchedLec?.weekly_overrides && matchedLec.weekly_overrides[targetWeek]?.end_time) || scheduledEnd;

        setSelectedDate(computedWeekDate);
        setSelectedDay(overrideDay);
        setSelectedStartTime(overrideStart);
        setSelectedEndTime(overrideEnd);
        setSelectedDurationHours(scheduledDur);
      }
    }

    setCurrentSessionMap(updatedMap);
    setInitialSnapshotMap(JSON.parse(JSON.stringify(updatedMap)));
    setSelectedStudentIds([]);
  };

  // 💾 اعتماد وحفظ توقيت هذا الأسبوع من قبل رئيس القسم أو المقرر
  const handleSaveWeeklySchedule = () => {
    const newScheduleItem: CourseWeeklySessionSchedule = {
      course_id: course.id,
      week_number: selectedWeek,
      lecture_slot: selectedLectureSlot,
      lecture_type: selectedLectureType,
      date: selectedDate,
      day: selectedDay,
      start_time: selectedStartTime,
      end_time: selectedEndTime,
      duration_hours: selectedDurationHours,
      approved_by_name: currentUser?.full_name || departmentHeadName || 'رئاسة القسم',
      approved_by_role: currentUser?.role === 'rapporteur' ? 'مقرر القسم' : 'رئيس القسم',
      updated_at: new Date().toISOString(),
    };

    const updated = [
      ...weeklySchedules.filter(
        (s) =>
          !(
            s.course_id === course.id &&
            s.week_number === selectedWeek &&
            s.lecture_slot === selectedLectureSlot &&
            s.lecture_type === selectedLectureType
          )
      ),
      newScheduleItem,
    ];

    setWeeklySchedules(updated);
    saveStoredData('course_weekly_schedules', updated);

    showFloatingToast({
      title: `تم بنجاح اعتماد وتثبيت توقيت الأسبوع ${selectedWeek} 🛡️`,
      subtitle: `${DAYS_OF_WEEK_LIST.find((d) => d.key === selectedDay)?.label_ar || selectedDay} • ${selectedDate} • ${selectedStartTime} إلى ${selectedEndTime}`,
      type: 'save',
    });
  };

  // 🔄 تعميم هذا التوقيت على كافة الأسابيع المتبقية بفاصل 7 أيام لكل أسبوع
  const handleApplyScheduleToRemainingWeeks = () => {
    const currentBaseDate = new Date(selectedDate);
    const newItems: CourseWeeklySessionSchedule[] = [];

    for (let w = selectedWeek + 1; w <= 15; w++) {
      const dateStr = calculateDateForAnyDayInWeek(selectedDate, selectedWeek, w, selectedDay);

      newItems.push({
        course_id: course.id,
        week_number: w,
        lecture_slot: selectedLectureSlot,
        lecture_type: selectedLectureType,
        date: dateStr,
        day: selectedDay,
        start_time: selectedStartTime,
        end_time: selectedEndTime,
        duration_hours: selectedDurationHours,
        approved_by_name: currentUser?.full_name || departmentHeadName || 'رئاسة القسم',
        approved_by_role: currentUser?.role === 'rapporteur' ? 'مقرر القسم' : 'رئيس القسم',
        updated_at: new Date().toISOString(),
      });
    }

    const otherWeeks = weeklySchedules.filter(
      (s) =>
        !(
          s.course_id === course.id &&
          s.week_number > selectedWeek &&
          s.lecture_slot === selectedLectureSlot &&
          s.lecture_type === selectedLectureType
        )
    );

    const merged = [...otherWeeks, ...newItems];
    setWeeklySchedules(merged);
    saveStoredData('course_weekly_schedules', merged);

    showFloatingToast({
      title: `تم بنجاح تعميم التوقيت على كافة الأسابيع المتبقية! 🚀`,
      subtitle: `تمت جدولة وتحديث الأسابيع من ${selectedWeek + 1} إلى 15 بفاصل أسبوعي منتظم`,
      type: 'action',
    });
  };

  // 🔄 12.1 حساب السجلات التراكمية الحية لدمج الجلسة الحالية المعروضة مع السجلات التراكمية فورياً
  const liveRecords = useMemo(() => {
    // استبعاد السجلات السابقة الخاصة بهذه الجلسة بالتحديد
    const otherRecords = initialRecords.filter(
      (r) =>
        !(
          r.course_id === course.id &&
          r.week_number === selectedWeek &&
          (r.lecture_slot === selectedLectureSlot || (!r.lecture_slot && selectedLectureSlot === 1)) &&
          r.lecture_type === selectedLectureType
        )
    );

    // دمج السجلات الحالية من الجلسة المفتوحة حالياً في المحرر لضمان التحديث اللحظي 100%
    const sessionRecords: StudentAttendanceRecord[] = students.map((st) => {
      const entry = currentSessionMap[st.id] || {
        status: 'unset' as AttendanceStatus,
        excuse_reason: '',
        excuse_document_ref: '',
        late_minutes: 0,
        notes: '',
      };

      return {
        id: `att-live-${course.id}-w${selectedWeek}-s${selectedLectureSlot}-${selectedLectureType}-${st.id}`,
        student_id: st.id,
        student_name: st.full_name,
        university_number: st.university_number || st.id,
        course_id: course.id,
        course_name: course.name,
        course_code: course.code,
        department_id: course.department_id || 'dept-1',
        stage_number: course.stage_number || 1,
        semester: (course.semester || 1) as 1 | 2,
        academic_year_id: 'year-2026',
        week_number: selectedWeek,
        lecture_slot: selectedLectureSlot,
        lecture_type: selectedLectureType,
        day: selectedDay,
        date: selectedDate,
        start_time: selectedStartTime,
        end_time: selectedEndTime,
        duration_hours: selectedDurationHours,
        status: entry.status,
        excuse_reason: entry.excuse_reason.trim() || undefined,
        excuse_document_ref: entry.excuse_document_ref.trim() || undefined,
        late_minutes: entry.late_minutes || undefined,
        recorded_by_teacher_id: teacherId,
        recorded_by_teacher_name: selectedLectureType === 'practical' ? (course.practical_teacher_name || teacherName) : (course.theory_teacher_name || teacherName),
        notes: entry.notes.trim() || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    return [...otherRecords, ...sessionRecords];
  }, [
    initialRecords,
    course,
    selectedWeek,
    selectedLectureSlot,
    selectedLectureType,
    selectedDay,
    selectedDate,
    selectedStartTime,
    selectedEndTime,
    selectedDurationHours,
    students,
    currentSessionMap,
    teacherId,
    teacherName,
  ]);

  // 🔄 13. دوال التبديل السريع
  const handleWeekChange = (newWeek: number) => {
    loadSessionData(newWeek, selectedLectureSlot, selectedLectureType);
  };

  const handleSlotChange = (newSlot: 1 | 2) => {
    loadSessionData(selectedWeek, newSlot, selectedLectureType);
  };

  const handleLectureTypeChange = (newType: LectureType) => {
    // إذا كان المسار الجديد معتمداً بمحاضرة واحدة فقط وكنا على المحاضرة 2، نرجع للمحاضرة 1 تلقائياً
    const targetMax = newType === 'practical' ? practicalLecturesCount : theoryLecturesCount;
    const targetSlot: 1 | 2 = targetMax === 1 && selectedLectureSlot === 2 ? 1 : selectedLectureSlot;
    loadSessionData(selectedWeek, targetSlot, newType);
  };

  // 🔘 14. دوال التحديد المتعدد لطلاب الشعبة
  const toggleSelectAll = (list: UserProfile[]) => {
    if (selectedStudentIds.length === list.length && list.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(list.map((st) => st.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ⚡ 15. تطبيق حالة حضور جماعية للطلاب المحددين
  const handleBulkSetStatus = (status: AttendanceStatus) => {
    if (selectedStudentIds.length === 0) return;
    const updated = { ...currentSessionMap };
    selectedStudentIds.forEach((stId) => {
      updated[stId] = {
        ...(updated[stId] || {
          excuse_reason: '',
          excuse_document_ref: '',
          late_minutes: 0,
          notes: '',
        }),
        status,
      };
    });
    setCurrentSessionMap(updated);

    const count = selectedStudentIds.length;
    const statusMeta = ATTENDANCE_STATUS_META[status];
    showFloatingToast({
      title: `تم تعيين (${count}) طالب [${statusMeta.label_ar}] بنجاح`,
      subtitle: `تطبيق جماعي على الطلبة المحددين`,
      type: status as AttendanceFloatingToast['type'],
    });

    setSelectedStudentIds([]);
  };

  // ⚡ 16. تعيين حالة موحدة لجميع الطلاب أو لطلاب الكروب المختار
  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<
      string,
      {
        status: AttendanceStatus;
        excuse_reason: string;
        excuse_document_ref: string;
        late_minutes: number;
        notes: string;
      }
    > = { ...currentSessionMap };

    // 👥 تحديد الطلاب المستهدفين (إذا محدد كروب أو دراسة معينة يطبق عليهم فقط)
    const targetStudents = (attendanceGroupFilter !== 'all' || studyTypeFilter !== 'all')
      ? filteredStudents
      : students;

    targetStudents.forEach((st) => {
      updated[st.id] = {
        ...(updated[st.id] || {
          excuse_reason: '',
          excuse_document_ref: '',
          late_minutes: 0,
          notes: '',
        }),
        status,
      };
    });
    setCurrentSessionMap(updated);

    const count = targetStudents.length;
    const groupNameDesc = attendanceGroupFilter !== 'all'
      ? (attendanceGroupFilter === 'unassigned' ? 'الشعبة العامة' : `كروب ${attendanceGroupFilter}`)
      : 'كافة الطلبة';
    const duration = selectedDurationHours === 1 ? '1 س' : selectedDurationHours === 1.5 ? '1.5 س' : `${selectedDurationHours} س`;
    if (status === 'present') {
      showFloatingToast({
        title: `تم تعيين (${count} طالب في ${groupNameDesc}) حاضرين بنجاح`,
        subtitle: `إجراء سريع للجلسة • احتساب ${duration} للمحاضرة للكروب`,
        type: 'present',
      });
    } else if (status === 'absent_unexcused') {
      showFloatingToast({
        title: `تم تعيين (${count} طالب في ${groupNameDesc}) غائبين`,
        subtitle: `إجراء سريع للجلسة • رصد غياب غير مبرر للكروب`,
        type: 'absent_unexcused',
      });
    } else if (status === 'absent_excused') {
      showFloatingToast({
        title: `تم تعيين (${count} طالب في ${groupNameDesc}) مجازين 📄`,
        subtitle: `إجراء سريع للجلسة • تسجيل إجازة رسمية للكروب`,
        type: 'absent_excused',
      });
    } else if (status === 'holiday') {
      showFloatingToast({
        title: `تم تسجيل الجلسة عطلة لـ (${count} طالب في ${groupNameDesc}) 🏖️`,
        subtitle: `استثناء عام للجلسة الحالية بدون غيابات`,
        type: 'holiday',
      });
    } else if (status === 'unset') {
      showFloatingToast({
        title: `تمت إعادة تعيين حالة الحضور إلى (غير محدد) لـ (${count} طالب في ${groupNameDesc}) ⚪`,
        subtitle: `إلغاء التحديد وتصفير الكشف للجلسة`,
        type: 'unset',
      });
    }
  };

  // 🔄 17. تعديل حالة طالب فردي مع إشعار عائم فوري وإمكانية إلغاء التحديد إلى غير محدد
  const handleStudentStatusChange = (studentId: string, status: AttendanceStatus) => {
    const st = students.find((s) => s.id === studentId);
    const stName = st?.full_name || 'الطالب';
    const duration = selectedDurationHours === 1 ? '1 س' : selectedDurationHours === 1.5 ? '1.5 س' : `${selectedDurationHours} س`;

    const currentStatus = currentSessionMap[studentId]?.status;
    const nextStatus: AttendanceStatus = currentStatus === status ? 'unset' : status;

    setCurrentSessionMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {
          excuse_reason: '',
          excuse_document_ref: '',
          late_minutes: 0,
          notes: '',
        }),
        status: nextStatus,
      },
    }));

    if (nextStatus === 'unset') {
      showFloatingToast({
        title: `تم إلغاء تحديد الحالة للطالب [${stName}]`,
        subtitle: `الحالة أصبحت غير محددة لهذه الجلسة`,
        type: 'unset',
      });
    } else if (nextStatus === 'present') {
      showFloatingToast({
        title: `تم تسجيل [${stName}] حاضر`,
        subtitle: `تم احتساب ${duration} للمحاضرة في الساعات المنجزة`,
        type: 'present',
      });
    } else if (nextStatus === 'absent_unexcused') {
      showFloatingToast({
        title: `تم تسجيل [${stName}] غائب`,
        subtitle: `تم احتساب غياب غير مبرر وإضافته لنسبة الحرمان`,
        type: 'absent_unexcused',
      });
    } else if (nextStatus === 'absent_excused') {
      showFloatingToast({
        title: `تم تسجيل [${stName}] إجازة رسمية`,
        subtitle: `عذر رسمي معتمد معفى من نسبة الحرمان الأكاديمي`,
        type: 'absent_excused',
      });
    } else if (nextStatus === 'late') {
      showFloatingToast({
        title: `تم تسجيل [${stName}] متأخر`,
        subtitle: `تم رصد تأخر الطالب عن موعد بدء المحاضرة`,
        type: 'late',
      });
    } else if (nextStatus === 'holiday') {
      showFloatingToast({
        title: `تم تسجيل [${stName}] عطلة`,
        subtitle: `استثناء رسمي معتمد للجلسة الحالية`,
        type: 'holiday',
      });
    }
  };

  // 🔄 18. تعديل تفاصيل العذر أو مدة التأخر أو الملاحظات لطالب معين
  const handleStudentFieldChange = (
    studentId: string,
    field: 'excuse_reason' | 'excuse_document_ref' | 'late_minutes' | 'notes',
    value: string | number
  ) => {
    setCurrentSessionMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {
          status: 'unset',
          excuse_reason: '',
          excuse_document_ref: '',
          late_minutes: 0,
          notes: '',
        }),
        [field]: value,
      },
    }));
  };

  // 💾 19. دالة حفظ وتثبيت كشف الحضور للجلسة في قاعدة البيانات المحلية والسحابية
  const handleSaveAttendance = () => {
    setIsSaving(true);
    const duration = selectedDurationHours || calculateLectureDurationHours(selectedStartTime, selectedEndTime);

    // استبعاد السجلات السابقة لهذه المادة وهذا الأسبوع ورقم المحاضرة ونوعها لنفس الطلاب لتحديثها
    const remainingRecords = initialRecords.filter(
      (r) =>
        !(
          r.course_id === course.id &&
          r.week_number === selectedWeek &&
          (r.lecture_slot === selectedLectureSlot || (!r.lecture_slot && selectedLectureSlot === 1)) &&
          r.lecture_type === selectedLectureType
        )
    );

    const newRecords: StudentAttendanceRecord[] = students.map((st) => {
      const entry = currentSessionMap[st.id] || {
        status: 'unset' as AttendanceStatus,
        excuse_reason: '',
        excuse_document_ref: '',
        late_minutes: 0,
        notes: '',
      };

      return {
        id: `att-${course.id}-w${selectedWeek}-s${selectedLectureSlot}-${selectedLectureType}-${st.id}`,
        student_id: st.id,
        student_name: st.full_name,
        university_number: st.university_number || st.id,
        course_id: course.id,
        course_name: course.name,
        course_code: course.code,
        department_id: course.department_id || 'dept-1',
        stage_number: course.stage_number || 1,
        semester: (course.semester || 1) as 1 | 2,
        academic_year_id: 'year-2026',
        week_number: selectedWeek,
        lecture_slot: selectedLectureSlot,
        lecture_type: selectedLectureType,
        day: selectedDay,
        date: selectedDate,
        start_time: selectedStartTime,
        end_time: selectedEndTime,
        duration_hours: duration,
        status: entry.status,
        excuse_reason: entry.excuse_reason.trim() || undefined,
        excuse_document_ref: entry.excuse_document_ref.trim() || undefined,
        late_minutes: entry.late_minutes || undefined,
        recorded_by_teacher_id: teacherId,
        recorded_by_teacher_name: selectedLectureType === 'practical' ? (course.practical_teacher_name || teacherName) : (course.theory_teacher_name || teacherName),
        notes: entry.notes.trim() || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    const allUpdated = [...remainingRecords, ...newRecords];
    onSaveRecords(allUpdated);

    // تحديث لقطة البداية للمسودة لتصفير حالة التعديلات المعلقة فورياً
    setInitialSnapshotMap(JSON.parse(JSON.stringify(currentSessionMap)));

    // 📢 إرسال حدث تحديث الحضور لإشعار لوحة الطالب ورئيس القسم فورياً
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('attendance_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    const typeNameAr = selectedLectureType === 'practical' ? 'العملي' : 'النظري';
    const slotNameAr = selectedLectureSlot === 2 ? 'المحاضرة الثانية' : 'المحاضرة الأولى';

    setIsSaving(false);
    // 🌟 إطلاق تنبيه عائم واحد موحد وفخم يحتوي على كافة تفاصيل الجلسة المحفوظة
    showFloatingToast({
      title: `تم بنجاح حفظ وتثبيت كشف حضور (${course.name})`,
      subtitle: `الأسبوع ${selectedWeek} - ${slotNameAr} (${typeNameAr} • ${duration} ساعات) ومزامنته سحابياً`,
      type: 'save',
    });
  };

  // 📄 20. دالة تصدير كشف الحضور والغياب الرسمي كـ PDF معتمد للتوقيع والمصادقة
  const handleExportAttendancePDF = async () => {
    setIsExportingPDF(true);
    showFloatingToast({
      title: `جاري توليد وتصدير كشف الحضور الرسمي PDF`,
      subtitle: `تجهيز وثيقة مسار بولونيا الرسمية للتوقيع والاعتماد`,
      type: 'pdf',
    });

    // إعداد قائمة الطلاب مع ملخصات الغياب لمسار بولونيا بحسب الكروب المفلتر
    const customTotal = getCourseTotalScheduledHours(durationConfig, course.id, course.credit_hours);
    const targetStudentsForExport = attendanceGroupFilter !== 'all' ? filteredStudents : students;
    const pdfStudentsData = targetStudentsForExport.map((st) => {
      const summary = calculateStudentCourseAttendance(
        st.id,
        course.id,
        initialRecords,
        course.name,
        course.code,
        course.credit_hours || 3,
        customTotal
      );

      return {
        studentId: st.id,
        studentName: st.full_name,
        universityNumber: st.university_number || st.id,
        studyType: st.study_type || 'morning',
        presentCount: summary.present_count,
        unexcusedAbsenceCount: summary.absent_unexcused_count,
        excusedAbsenceCount: summary.absent_excused_count,
        lateCount: summary.late_count,
        totalUnexcusedHours: summary.total_unexcused_absence_hours,
        absencePercentage: summary.absence_percentage,
        warningStatus: summary.warning_status,
      };
    });

    const success = await exportBolognaAttendanceReportPDF({
      courseName: course.name,
      courseCode: course.code,
      stageNumber: course.stage_number || 1,
      semester: (course.semester || 1) as 1 | 2,
      academicYear: '2026-2027',
      departmentName: course.department_name || 'القسم الأكاديمي',
      teacherName: teacherName,
      selectedWeek: selectedWeek,
      students: pdfStudentsData,
    });

    setIsExportingPDF(false);
    if (success) {
      // 🌟 إظهار التنبيه العائم الفاخر لتحميل ملف الـ PDF بنجاح
      showFloatingToast({
        title: `تم تصدير ملف PDF بنجاح`,
        subtitle: `تم تحميل كشف حضور مادة (${course.name}) بجودة طباعة A4 عالية`,
        type: 'pdf',
      });
    }
  };

  // 📊 21. دالة تصدير كشف الحضور والإنذارات الرسمي لمسار بولونيا إلى Excel الفاخر
  const handleExportAttendanceExcel = async () => {
    setIsExportingExcel(true);
    showFloatingToast({
      title: `جاري توليد كشف الحضور الرسمي Excel`,
      subtitle: `تجهيز جدول إكسل الملون بألوان الكحلي الملكي لمسار بولونيا`,
      type: 'save',
    });

    try {
      const customTotal = getCourseTotalScheduledHours(durationConfig, course.id, course.credit_hours);
      const targetStudentsForExcel = attendanceGroupFilter !== 'all' ? filteredStudents : students;
      const excelRecords = targetStudentsForExcel.map((st) => {
        const summary = calculateStudentCourseAttendance(
          st.id,
          course.id,
          initialRecords,
          course.name,
          course.code,
          course.credit_hours || 3,
          customTotal
        );

        return {
          student_name: st.full_name, // 👤 اسم الطالب الثلاثي
          university_number: st.university_number || st.id, // 🆔 الرقم الجامعي
          stage_number: course.stage_number || 1, // 🎓 رقم المرحلة
          study_type: (st.study_type || 'morning') as 'morning' | 'evening', // ☀️ نوع الدراسة
          course_name: course.name, // 📘 اسم المادة
          total_hours: customTotal, // ⏳ الساعات المقررة
          present_hours: summary.total_present_hours || 0, // 🟢 ساعات الحضور الفعلي
          excused_hours: summary.total_excused_absence_hours || 0, // 🔵 ساعات الإجازة الرسمية
          holiday_hours: summary.total_holiday_hours || 0, // 🏖️ ساعات العطلة الرسمية
          unexcused_hours: summary.total_unexcused_absence_hours || 0, // 🔴 ساعات الغياب غير المبرر
          absence_percentage: summary.absence_percentage, // 📊 نسبة الغياب
          warning_status: summary.warning_status, // ⚠️ الموقف والإنذار
          notes: summary.warning_status === 'banned' ? 'تجاوز حد الغياب 10%' : undefined, // 📝 ملاحظة
        };
      });

      await exportCustomAttendanceList(excelRecords, course.department_name || 'القسم الأكاديمي');

      showFloatingToast({
        title: `تم تصدير ملف Excel بنجاح`,
        subtitle: `تم تنزيل كشف حضور مادة (${course.name}) بتنسيق بولونيا الفاخر`,
        type: 'save',
      });
    } catch {
      showFloatingToast({
        title: `حدث خطأ أثناء تصدير ملف الإكسل`,
        subtitle: `يرجى المحاولة مرة أخرى لاحقاً`,
        type: 'save',
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  // 👥 استخراج الكروبات المتاحة بين طلاب المادة
  const availableStudentGroups = useMemo(() => {
    const groupsSet = new Set<string>();
    students.forEach((st) => {
      if (st.student_group && st.student_group !== 'unassigned') {
        groupsSet.add(st.student_group);
      }
    });
    return Array.from(groupsSet).sort();
  }, [students]);

  // 🔍 19. تصفية الطلاب بحسب البحث والفترة الدراسية والكروب المحدد
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      if (studyTypeFilter !== 'all') {
        const stdStudy = st.study_type || 'morning';
        if (stdStudy !== studyTypeFilter) return false;
      }
      if (attendanceGroupFilter !== 'all') {
        const stdGrp = st.student_group || 'unassigned';
        if (stdGrp !== attendanceGroupFilter) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        st.full_name.toLowerCase().includes(q) ||
        (st.university_number && st.university_number.includes(q))
      );
    });
  }, [students, searchQuery, studyTypeFilter, attendanceGroupFilter]);

  // 📊 19. إحصائيات الجلسة الحالية
  const sessionStats = useMemo(() => {
    let present = 0;
    let absentUnexcused = 0;
    let absentExcused = 0;
    let holiday = 0;
    let late = 0;
    let unset = 0;

    students.forEach((st) => {
      const entry = currentSessionMap[st.id];
      if (!entry || entry.status === 'unset') unset++;
      else if (entry.status === 'present') present++;
      else if (entry.status === 'absent_unexcused') absentUnexcused++;
      else if (entry.status === 'absent_excused') absentExcused++;
      else if (entry.status === 'holiday') holiday++;
      else if (entry.status === 'late') late++;
    });

    return { present, absentUnexcused, absentExcused, holiday, late, unset };
  }, [students, currentSessionMap]);

  // 🕒 20. قراءة نص اليوم الحالي بالعربية
  const currentDayLabel = useMemo(() => {
    return DAYS_OF_WEEK_LIST.find((d) => d.key === selectedDay)?.label_ar || 'السبت';
  }, [selectedDay]);

  // 🏷️ 21. قراءة بيانات نوع المحاضرة الحالية
  const currentLectureTypeConfig = useMemo(() => {
    return LECTURE_TYPES_CONFIG.find((t) => t.key === selectedLectureType) || LECTURE_TYPES_CONFIG[0];
  }, [selectedLectureType]);

  const LectureTypeIcon = currentLectureTypeConfig.icon;

  return (
    <div className="space-y-6 relative" dir="rtl">

      {/* 🌟 0. التنبيه العائم الفاخر (Light Mode أبيض ناصع) مع أيقونات SVG فيكتور صريحة */}
      {floatingToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[999999] max-w-xl w-[94%] sm:w-auto min-w-[340px] pointer-events-auto transition-all duration-300 ease-out transform animate-in fade-in slide-in-from-top-6"
        >
          <div className={`px-4 py-3.5 sm:px-5 sm:py-4 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between gap-4 text-right border-2 ${floatingToast.type === 'present'
              ? 'bg-white/95 border-emerald-500/80 text-slate-950 shadow-emerald-950/10 ring-4 ring-emerald-400/10'
              : floatingToast.type === 'absent_unexcused'
                ? 'bg-white/95 border-rose-500/80 text-slate-950 shadow-rose-950/10 ring-4 ring-rose-400/10'
                : floatingToast.type === 'absent_excused'
                  ? 'bg-white/95 border-blue-500/80 text-slate-950 shadow-blue-950/10 ring-4 ring-blue-400/10'
                  : floatingToast.type === 'late'
                    ? 'bg-white/95 border-slate-500/80 text-slate-950 shadow-slate-950/10 ring-4 ring-slate-400/10'
                    : floatingToast.type === 'holiday'
                      ? 'bg-white/95 border-sky-500/80 text-slate-950 shadow-sky-950/10 ring-4 ring-sky-400/10'
                      : floatingToast.type === 'unset'
                        ? 'bg-white/95 border-slate-300 text-slate-950 shadow-slate-950/10 ring-4 ring-slate-200/50'
                        : 'bg-white/95 border-indigo-400/80 text-slate-950 shadow-indigo-950/10 ring-4 ring-indigo-300/20'
            }`}>
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-2xs ${floatingToast.type === 'present'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : floatingToast.type === 'absent_unexcused'
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : floatingToast.type === 'absent_excused'
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : floatingToast.type === 'late'
                        ? 'bg-slate-100 border-slate-300 text-slate-700'
                        : floatingToast.type === 'holiday'
                          ? 'bg-sky-50 border-sky-300 text-sky-700'
                          : floatingToast.type === 'unset'
                            ? 'bg-slate-100 border-slate-300 text-slate-700'
                            : 'bg-indigo-50 border-indigo-300 text-indigo-700'
                }`}>
                {floatingToast.type === 'present' && <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />}
                {floatingToast.type === 'absent_unexcused' && <XCircle className="w-6 h-6 stroke-[2.5]" />}
                {floatingToast.type === 'absent_excused' && <FileText className="w-6 h-6 stroke-[2.5]" />}
                {floatingToast.type === 'late' && <Timer className="w-6 h-6 stroke-[2.5]" />}
                {floatingToast.type === 'holiday' && <Palmtree className="w-6 h-6 stroke-[2.5]" />}
                {floatingToast.type === 'save' && <Save className="w-6 h-6 stroke-[2.5]" />}
                {floatingToast.type === 'pdf' && <Download className="w-6 h-6 stroke-[2.5]" />}
                {floatingToast.type === 'unset' && <HelpCircle className="w-6 h-6 stroke-[2.5]" />}
                {(floatingToast.type === 'action' || floatingToast.type === 'info') && <Info className="w-6 h-6 stroke-[2.5]" />}
              </div>
              <div className="flex flex-col text-right">
                <span className="font-black text-sm sm:text-base text-slate-950 tracking-wide">{floatingToast.title}</span>
                {floatingToast.subtitle && (
                  <span className="text-xs sm:text-sm font-bold text-slate-600 mt-0.5">{floatingToast.subtitle}</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFloatingToast(null)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition shrink-0 cursor-pointer border border-slate-200"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* 🌟 1. الهيدر الأكاديمي لمحرر الحضور والغياب بتنسيق متوازن واحترافي */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl text-slate-950 border-2 border-slate-200 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="px-3.5 py-1.5 bg-indigo-50 border-2 border-indigo-200 text-indigo-950 text-xs sm:text-sm font-black rounded-2xl shadow-2xs">
              <span>نظام الحضور والغياب والإجازات — مسار بولونيا</span>
            </span>
            <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-950 border-2 border-emerald-300 font-black text-xs sm:text-sm rounded-2xl shadow-2xs">
              الأسبوع {selectedWeek} من 15
            </span>
            <span className="px-3.5 py-1.5 bg-slate-100 text-slate-950 border-2 border-slate-300 font-black text-xs sm:text-sm rounded-2xl shadow-2xs">
              إجمالي الشعبة: {students.length} طالب
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-950 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#0F2942] text-white flex items-center justify-center shrink-0 shadow-md">
              <ClipboardList className="w-6 h-6 text-cyan-300" />
            </div>
            <span>تسجيل ومتابعة الحضور: {course.name}</span>
            <span className="text-indigo-900 text-lg font-mono font-black">({course.code})</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 font-bold mt-1.5 leading-relaxed">
            تسجيل الحضور والغيابات بعذر وبدون عذر والإجازات الرسمية مع الرصد التلقائي المباشر لحدود الحرمان الأكاديمي (5% إنذار أولي • 7% إنذار نهائي • 10% حرمان رسمي)
          </p>
        </div>

        {/* 🎛️ أزرار الإجراءات السريعة والحفظ في الهيدر */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">

          {/* 📢 زر إرسال تبليغ عام للمرحلة */}
          <button
            type="button"
            onClick={() => {
              setNoticeTargetStudent(null);
              setNoticeDefaultCategory('warning_1');
              setIsNoticeModalOpen(true);
            }}
            className="px-4 py-3 bg-[#0F2942] hover:bg-[#163a5f] active:scale-95 text-white rounded-2xl font-black text-sm sm:text-base transition-all shadow-sm flex items-center gap-2 cursor-pointer border-2 border-[#1e4570]"
            title="إرسال تبليغ رسمي لكافة طلاب الشعبة"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300 shrink-0" />
            <span>إرسال تبليغ عام</span>
          </button>

          {/* 📑 زر مراجعة طلبات الإجازات */}
          <button
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            className={`px-4 py-3 rounded-2xl font-black text-sm sm:text-base transition-all shadow-sm flex items-center gap-2 cursor-pointer border-2 ${pendingExcusesCount > 0
                ? 'bg-rose-700 hover:bg-rose-800 text-white border-rose-500 ring-2 ring-rose-300/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
              }`}
            title="مراجعة وتدقيق طلبات الإجازات المقدمة من الطلاب"
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300 shrink-0" />
            <span>طلبات الإجازات ({pendingExcusesCount})</span>
          </button>

          {/* 📄 زر تصدير كشف الحضور والغياب الأكاديمي الرسمي PDF */}
          <button
            type="button"
            onClick={handleExportAttendancePDF}
            disabled={isExportingPDF}
            className="px-4 sm:px-5 py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-2xl font-black text-sm sm:text-base transition-all shadow-md flex items-center gap-2 cursor-pointer border-2 border-slate-700 disabled:opacity-50"
            title="تصدير كشف الحضور والغياب الرسمي لمسار بولونيا بصيغة PDF للطباعة والمصادقة"
          >
            <Printer className="w-5 h-5 text-cyan-300 shrink-0" />
            <span>{isExportingPDF ? 'جاري التصدير...' : 'تصدير الكشف (PDF)'}</span>
          </button>

          {/* 📊 زر تصدير كشف الحضور والإنذارات الأكاديمي الرسمي Excel */}
          <button
            type="button"
            onClick={handleExportAttendanceExcel}
            disabled={isExportingExcel}
            className="px-4 sm:px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] active:scale-95 text-white rounded-2xl font-black text-sm sm:text-base transition-all shadow-md flex items-center gap-2 cursor-pointer border-2 border-[#1e4570] disabled:opacity-50"
            title="تصدير كشف وسجل الحضور والغيابات والإنذارات الأكاديمية إلى Excel الفاخر"
          >
            {isExportingExcel ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span>{isExportingExcel ? 'جاري التوليد...' : 'تصدير الكشف (Excel)'}</span>
          </button>

          {/* ↩️ زر إلغاء التعديلات والتراجع عند وجود مسودة غير محفوظة */}
          {hasPendingChanges && (
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="px-4 sm:px-5 py-3 bg-slate-100 hover:bg-rose-50 text-rose-700 hover:text-rose-900 active:scale-95 rounded-2xl font-black text-sm sm:text-base transition-all shadow-sm flex items-center gap-2 cursor-pointer border-2 border-rose-300 animate-in fade-in"
              title="إلغاء كافة التعديلات غير المحفوظة واسترجاع الكشف الأصلي"
            >
              <RotateCcw className="w-5 h-5 text-rose-600 shrink-0 stroke-[2.5]" />
              <span>إلغاء</span>
            </button>
          )}

          {/* 💾 زر الحفظ الأساسي للجلسة */}
          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={isSaving || !hasPendingChanges}
            className={`px-5 sm:px-6 py-3 active:scale-95 rounded-2xl font-black text-sm sm:text-base transition-all shadow-md flex items-center gap-2 border-2 ${hasPendingChanges
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400 ring-2 ring-emerald-300/40 cursor-pointer shadow-sm'
                : 'bg-emerald-800/80 text-white border-emerald-700 cursor-not-allowed opacity-80'
              }`}
            title="حفظ وتثبيت سجلات الحضور للجلسة المختارة"
          >
            <Save className="w-5 h-5 text-white shrink-0 stroke-[2.5]" />
            <span>
              {isSaving
                ? 'جاري الحفظ...'
                : hasPendingChanges
                  ? 'حفظ التعديل'
                  : 'التعديلات محفوظة'}
            </span>
          </button>
        </div>
      </div>

      {/* 🏖️ تنبيه العطلة الرسمية المعتمدة للجلسة الحالية من قبل رئاسة ومقررية القسم */}
      {officialHolidayInfo && (
        <div className="bg-sky-50 border-2 border-sky-300 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700 shrink-0 shadow-2xs">
              <AttendanceHolidaySvg className="w-6 h-6 text-sky-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-sky-200/80 text-sky-950 font-black text-xs rounded-lg border border-sky-300">
                  عطلة رسمية معتمدة 🏖️
                </span>
                <span className="text-xs text-sky-800 font-bold">
                  بتاريخ ({formatDateArabicWithDay(selectedDate)})
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-sky-950 mt-1">
                {officialHolidayInfo.title}
              </h3>
              <p className="text-xs text-sky-800 mt-0.5">
                أعلنت رئاسة ومقررية القسم هذا اليوم كعطلة رسمية. يمكنك تثبيت حالة كافة الطلبة كعطلة رسمية بنقرة واحدة لحفظ ساعاتهم دون احتساب أي غياب.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const updated = { ...currentSessionMap };
              students.forEach((st) => {
                if (updated[st.id]) {
                  updated[st.id] = {
                    ...updated[st.id],
                    status: 'holiday',
                    notes: `عطلة رسمية: ${officialHolidayInfo.title}`,
                  };
                }
              });
              setCurrentSessionMap(updated);
              showFloatingToast({
                title: 'تم تثبيت العطلة الرسمية لكافة الطلاب بنجاح 🏖️',
                subtitle: officialHolidayInfo.title,
                type: 'holiday',
              });
            }}
            className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] active:scale-95 text-white rounded-2xl font-black text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border border-[#0F2942] shrink-0"
            title="تثبيت حالة العطلة الرسمية لكافة طلبة الشعبة لهذه الجلسة"
          >
            <AttendanceHolidaySvg className="w-4 h-4 text-cyan-300 shrink-0" />
            <span>تثبيت العطلة للجميع 🏖️</span>
          </button>
        </div>
      )}

      {/* 🎛️ 2. شريط تحديد الأسبوع الدراسي والمعلومات الزمنية للمحاضرة */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-slate-200 shadow-sm space-y-6">

        {/* 🗓️ شبكة اختيار الأسبوع الدراسي من 1 إلى 15 */}
        <div className="space-y-3">
          {/* شريط عنوان الأسابيع مع بيان المسار التدريسي النشط ودليل الرموز التوضيحي للأستاذ */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-slate-100 p-3.5 sm:p-4 rounded-2xl border-2 border-slate-300 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0F2942]" />
                <span>حدد الأسبوع الدراسي لمسار بولونيا (15 أسبوع):</span>
              </label>

              {/* 🏷️ شارة السياق المفتوح البارزة: توضح للأستاذ هل هو في النظري أو العملي وعدد المحاضرات المعتمدة */}
              <div
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-2xs border-2 ${
                  selectedLectureType === 'practical'
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                    : 'bg-blue-100 text-blue-950 border-blue-300'
                }`}
              >
                {selectedLectureType === 'practical' ? (
                  <>
                    <FlaskConical className="w-4 h-4 text-emerald-800 shrink-0" />
                    <span>سجل العملي / المختبر</span>
                    <span className="bg-white/90 px-2 py-0.5 rounded-lg text-xs font-black text-emerald-950 shadow-2xs border border-emerald-200">
                      {maxLecturesPerWeek === 1 ? 'مختبر واحد أسبوعياً' : 'مختبران أسبوعياً'}
                    </span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 text-blue-900 shrink-0" />
                    <span>سجل النظري</span>
                    <span className="bg-white/90 px-2 py-0.5 rounded-lg text-xs font-black text-blue-950 shadow-2xs border border-blue-200">
                      {maxLecturesPerWeek === 1 ? 'محاضرة واحدة أسبوعياً' : 'محاضرتان أسبوعياً'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* دليل دلالات الرموز التوضيحي للأستاذ لبيان معنى المؤشرات بوضوح */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap text-xs sm:text-sm font-black">
              {/* شارة تم الرصد */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-950 border-2 border-emerald-300 rounded-xl shadow-2xs">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span>
                  تم رصد الحضور (
                  {selectedLectureType === 'practical' ? 'العملي' : 'النظري'}
                  {maxLecturesPerWeek >= 2 ? ` - م${selectedLectureSlot}` : ''}
                  )
                </span>
              </div>

              {/* شارة غير مرصود */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-800 border-2 border-slate-300 rounded-xl shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400 shrink-0 inline-block" />
                <span>غير مرصود بعد</span>
              </div>

              {/* شارة الأسبوع الحالي الفعلي بالتقويم */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-950 rounded-xl shadow-2xs border-2 border-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 inline-block animate-pulse" />
                <span className="text-xs font-black">
                  الأسبوع الحالي: {currentAcademicWeek} ({formatDateArabicWithDay(calculateDateForAnyDayInWeek(effectiveStartDate, 1, currentAcademicWeek, 'saturday'))})
                </span>
              </div>

              {/* شارة الأسبوع المفتوح حالياً للرصد */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F2942] text-white rounded-xl shadow-2xs border-2 border-[#0F2942]">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0 inline-block animate-pulse" />
                <span className="text-xs font-black">
                  المعروض للرصد: أسبوع {selectedWeek} ({formatDateArabicWithDay(calculateDateForAnyDayInWeek(effectiveStartDate, 1, selectedWeek, 'saturday'))})
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-15 gap-2 overflow-x-auto pb-1">
            {BOLOGNA_SEMESTER_WEEKS.map((w) => {
              const isSelected = selectedWeek === w.week;
              const isCurr = currentAcademicWeek === w.week;
              const weekSaturdayDate = calculateDateForAnyDayInWeek(effectiveStartDate, 1, w.week, 'saturday');
              const dParts = weekSaturdayDate.split('-');
              const dayNum = dParts.length === 3 ? parseInt(dParts[2], 10) : '';
              const monthName = dParts.length === 3 ? (IRAQI_ARABIC_MONTHS[parseInt(dParts[1], 10) - 1] || '') : '';

              // 🔍 1. فحص هل تم رصد وتثبيت هذا الأسبوع للمسار والمحاضرة المحددة حالياً في قاعدة البيانات
              const isRecordedInStore = initialRecords.some(
                (r) =>
                  r.course_id === course.id &&
                  r.week_number === w.week &&
                  (r.lecture_slot === selectedLectureSlot || (!r.lecture_slot && selectedLectureSlot === 1)) &&
                  r.lecture_type === selectedLectureType &&
                  r.status !== 'unset'
              );

              // 🔄 فحص إذا كان الأسبوع المفتوح حالياً يحتوي على رصد حي غير محفوظ بعد
              const hasLiveEdits = isSelected && Object.values(currentSessionMap).some((s) => s.status !== 'unset');
              const isCurrentSessionRecorded = isRecordedInStore || hasLiveEdits;

              // 🔍 2. فحص تفصيلي للمحاضرة الأولى والمحاضرة الثانية لهذا المسار (إذا كانت المادة محاضرتين أسبوعياً)
              const isSlot1Recorded = initialRecords.some(
                (r) =>
                  r.course_id === course.id &&
                  r.week_number === w.week &&
                  (r.lecture_slot === 1 || !r.lecture_slot) &&
                  r.lecture_type === selectedLectureType &&
                  r.status !== 'unset'
              ) || (isSelected && selectedLectureSlot === 1 && hasLiveEdits);

              const isSlot2Recorded = initialRecords.some(
                (r) =>
                  r.course_id === course.id &&
                  r.week_number === w.week &&
                  r.lecture_slot === 2 &&
                  r.lecture_type === selectedLectureType &&
                  r.status !== 'unset'
              ) || (isSelected && selectedLectureSlot === 2 && hasLiveEdits);

              const trackNameAr = selectedLectureType === 'practical' ? 'سجل العملي' : 'سجل النظري';

              return (
                <button
                  key={w.week}
                  type="button"
                  onClick={() => handleWeekChange(w.week)}
                  title={`الأسبوع ${w.week} (${trackNameAr} - ${maxLecturesPerWeek >= 2 ? `محاضرة ${selectedLectureSlot}` : 'محاضرة وحيدة'})${isCurr ? ' - الأسبوع الفعلي الحالي' : ''}: ${isCurrentSessionRecorded ? 'تم رصد وتثبيت الحضور ✓' : 'غير مرصود بعد'}`}
                  className={`py-2 px-1.5 rounded-2xl text-center font-black transition-all cursor-pointer relative border-2 select-none active:scale-95 flex flex-col items-center justify-between min-h-[84px] ${
                    isSelected
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md scale-105 z-10 ring-2 ring-blue-500/20'
                      : isCurr
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-400 hover:bg-emerald-100 shadow-2xs'
                        : isCurrentSessionRecorded
                          ? 'bg-emerald-50/50 text-emerald-950 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                          : 'bg-slate-50 text-slate-800 hover:bg-slate-100 hover:border-slate-400 border-slate-300'
                  }`}
                >
                  {/* رأس الكارت: شارة الأسبوع مع مؤشر الرصد المصمم بدقة */}
                  <div className="w-full flex items-center justify-between px-0.5">
                    <span className={`text-[11px] font-black ${isSelected ? 'text-cyan-300' : isCurr ? 'text-emerald-800' : 'text-slate-600'}`}>
                      أسبوع
                    </span>

                    {/* شارة الرصد الخضراء العصرية (Badge مع Check ✓) تظل واضحة حتى لو كان الأسبوع محدداً */}
                    {isCurrentSessionRecorded ? (
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shadow-xs shrink-0 ${
                          isSelected
                            ? 'bg-emerald-500 text-white ring-2 ring-emerald-300/40'
                            : 'bg-emerald-600 text-white'
                        }`}
                        title="تم رصد وتثبيت الحضور لهذا الأسبوع والمحاضرة"
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                      </span>
                    ) : (
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isSelected ? 'bg-slate-600' : isCurr ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                        title={isCurr ? 'الأسبوع الحالي غير مرصود بعد' : 'غير مرصود بعد'}
                      />
                    )}
                  </div>

                  {/* رقم الأسبوع البارز */}
                  <div className="text-lg sm:text-xl font-black font-mono leading-none my-0.5">
                    {w.week}
                  </div>

                  {/* تاريخ هذا الأسبوع المحسوب ديناميكياً */}
                  <div className={`text-[9px] font-black leading-tight my-0.5 ${isSelected ? 'text-cyan-200' : 'text-slate-800'}`}>
                    {dayNum} {monthName.substring(0, 5)}
                  </div>

                  {/* أسفل الكارت: إذا كان المسار بمحاضرتين تظهر شارات م1 وم2، وإذا بمحاضرة واحدة تظهر شارة مرصود/غير مسجل */}
                  {maxLecturesPerWeek >= 2 ? (
                    <div
                      className="flex items-center gap-1 mt-0.5"
                      title={`المحاضرة 1: ${isSlot1Recorded ? 'تم الرصد ✓' : 'غير مرصودة'} | المحاضرة 2: ${isSlot2Recorded ? 'تم الرصد ✓' : 'غير مرصودة'}`}
                    >
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-black flex items-center gap-0.5 transition-all ${
                          selectedLectureSlot === 1
                            ? isSelected
                              ? 'bg-cyan-400 text-slate-950 shadow-xs ring-1 ring-cyan-200'
                              : 'bg-blue-800 text-white shadow-2xs'
                            : isSlot1Recorded
                              ? isSelected
                                ? 'bg-emerald-400 text-emerald-950'
                                : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                              : isSelected
                                ? 'bg-slate-700 text-slate-300'
                                : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        م1{isSlot1Recorded && <Check className="w-2 h-2 stroke-[3]" />}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-black flex items-center gap-0.5 transition-all ${
                          selectedLectureSlot === 2
                            ? isSelected
                              ? 'bg-cyan-400 text-slate-950 shadow-xs ring-1 ring-cyan-200'
                              : 'bg-blue-800 text-white shadow-2xs'
                            : isSlot2Recorded
                              ? isSelected
                                ? 'bg-emerald-400 text-emerald-950'
                                : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                              : isSelected
                                ? 'bg-slate-700 text-slate-300'
                                : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        م2{isSlot2Recorded && <Check className="w-2 h-2 stroke-[3]" />}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[10px] font-black mt-0.5">
                      {isCurrentSessionRecorded ? (
                        <span className={`px-2 py-0.5 rounded-md ${isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-950 border border-emerald-300'}`}>
                          مرصود ✓
                        </span>
                      ) : (
                        <span className={`px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                          غير مسجل
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 🎯 شريط تبديل المحاضرة الأسبوعية والمسار التدريسي المعتمد بتصميم بارز وفاخر */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* 1. كارت تسجيل المحاضرة في الأسبوع (المحاضرة 1 أو 2) حسب اعتماد القسم للنظري أو العملي */}
          <div className="p-4 bg-white border-2 border-slate-300 rounded-2xl shadow-2xs space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-base font-black text-black flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-700 shrink-0" />
                <span>تسجيل المحاضرة في الأسبوع:</span>
              </span>

              {/* تحكم رئيس ومقرر القسم المباشر بعدد محاضرات هذا المسار، أو شارة القفل للتدريسي */}
              {isDeptAuthorized ? (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-300 shadow-2xs">
                  <span className="text-xs font-black text-slate-800 px-1">
                    اعتماد {selectedLectureType === 'practical' ? 'العملي' : 'النظري'}:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateTrackLecturesCount(selectedLectureType, 1)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                      maxLecturesPerWeek === 1
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                    title="اعتماد محاضرة واحدة فقط أسبوعياً لهذا المسار"
                  >
                    1 محاضرة
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateTrackLecturesCount(selectedLectureType, 2)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                      maxLecturesPerWeek === 2
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                    title="اعتماد محاضرتين أسبوعياً لهذا المسار"
                  >
                    2 محاضرتان
                  </button>
                </div>
              ) : maxLecturesPerWeek === 1 ? (
                <span className="px-3.5 py-1.5 bg-slate-100 text-slate-800 border-2 border-slate-300 rounded-xl text-sm font-black flex items-center gap-1.5 shadow-2xs">
                  <Lock className="w-4 h-4 text-slate-700 shrink-0" />
                  <span>
                    {selectedLectureType === 'practical' ? 'مختبر واحد أسبوعياً معتمد من القسم' : 'محاضرة واحدة أسبوعياً معتمدة من القسم'}
                  </span>
                </span>
              ) : (
                <span className="px-3.5 py-1.5 bg-blue-100 text-blue-950 border-2 border-blue-300 rounded-xl text-sm font-black flex items-center gap-1.5 shadow-2xs">
                  <Layers className="w-4 h-4 text-blue-900 shrink-0" />
                  <span>
                    {selectedLectureType === 'practical' ? 'مختبران أسبوعياً معتمدان من القسم' : 'محاضرتان أسبوعياً معتمدتان من القسم'}
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSlotChange(1)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm sm:text-base font-black transition-all cursor-pointer flex items-center justify-center gap-2.5 border-2 select-none ${selectedLectureSlot === 1
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md scale-[1.02] ring-2 ring-blue-500/20'
                    : 'bg-slate-50 text-slate-800 hover:text-slate-950 hover:bg-slate-100 border-slate-300'
                  }`}
              >
                <Layers className={`w-4 h-4 ${selectedLectureSlot === 1 ? 'text-cyan-300' : 'text-slate-500'}`} />
                <span>{selectedLectureType === 'practical' ? 'المختبر الأول' : 'المحاضرة الأولى'}</span>
                <span className={`px-2 py-0.5 font-mono text-xs rounded-md ${selectedLectureSlot === 1 ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-200 text-slate-800'}`}>1</span>
              </button>

              {maxLecturesPerWeek >= 2 && (
                <button
                  type="button"
                  onClick={() => handleSlotChange(2)}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm sm:text-base font-black transition-all cursor-pointer flex items-center justify-center gap-2.5 border-2 select-none ${selectedLectureSlot === 2
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md scale-[1.02] ring-2 ring-blue-500/20'
                      : 'bg-slate-50 text-slate-800 hover:text-slate-950 hover:bg-slate-100 border-slate-300'
                    }`}
                >
                  <Layers className={`w-4 h-4 ${selectedLectureSlot === 2 ? 'text-cyan-300' : 'text-slate-500'}`} />
                  <span>{selectedLectureType === 'practical' ? 'المختبر الثاني' : 'المحاضرة الثانية'}</span>
                  <span className={`px-2 py-0.5 font-mono text-xs rounded-md ${selectedLectureSlot === 2 ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-200 text-slate-800'}`}>2</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. كارت المسار التدريسي المعتمد (سجل النظري / سجل العملي) حسب تكليف الأستاذ */}
          <div className="p-4 bg-white border-2 border-slate-300 rounded-2xl shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-black flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-700 shrink-0" />
                <span>المسار التدريسي المعتمد:</span>
              </span>
              {allowedLectureTypes.length === 1 ? (
                <span className="px-3.5 py-1.5 bg-slate-100 text-black border-2 border-slate-300 rounded-xl text-sm font-black flex items-center gap-1.5 shadow-2xs">
                  <Lock className="w-4 h-4 text-slate-700 shrink-0" />
                  <span>{allowedLectureTypes[0] === 'practical' ? 'مكلف بالعملي حصراً' : 'مكلف بالنظري حصراً'}</span>
                </span>
              ) : (
                <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-950 border-2 border-emerald-300 rounded-xl text-sm font-black flex items-center gap-1.5 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>مكلف بالنظري والعملي</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {allowedLectureTypes.includes('theory') && (
                <button
                  type="button"
                  onClick={() => handleLectureTypeChange('theory')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm sm:text-base font-black transition-all cursor-pointer flex items-center justify-center gap-2.5 border-2 select-none ${selectedLectureType === 'theory'
                      ? 'bg-blue-800 text-white border-blue-800 shadow-md scale-[1.02] ring-2 ring-blue-400/30'
                      : 'bg-slate-50 text-slate-800 hover:text-slate-950 hover:bg-slate-100 border-slate-300'
                    }`}
                >
                  <BookOpen className={`w-4 h-4 ${selectedLectureType === 'theory' ? 'text-cyan-200' : 'text-blue-700'}`} />
                  <span>سجل النظري</span>
                </button>
              )}

              {allowedLectureTypes.includes('practical') && (
                <button
                  type="button"
                  onClick={() => handleLectureTypeChange('practical')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm sm:text-base font-black transition-all cursor-pointer flex items-center justify-center gap-2.5 border-2 select-none ${selectedLectureType === 'practical'
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-md scale-[1.02] ring-2 ring-emerald-400/30'
                      : 'bg-slate-50 text-slate-800 hover:text-slate-950 hover:bg-slate-100 border-slate-300'
                    }`}
                >
                  <FlaskConical className={`w-4 h-4 ${selectedLectureType === 'practical' ? 'text-emerald-200' : 'text-emerald-700'}`} />
                  <span>سجل العملي / المختبر</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* 🎛️ بطاقات المواعيد والتوقيتات المعتمدة من رئاسة ومقررية القسم (تحكم كامل لرئيس القسم والمقرر، ومقفلة للتدريسي) */}
        <div className="space-y-3 pt-2">

          {/* شريط الإشعار الأمني والتحكم الإداري برئاسة القسم */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-100 border-2 border-slate-300 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-2 text-slate-950">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <span className="text-sm sm:text-base font-black">
                  المواعيد والتوقيتات معتمدة ومصادق عليها حصراً من رئاسة القسم
                </span>
                <span className="text-xs text-slate-600 font-bold block sm:inline-block sm:mr-2">
                  (الأسبوع {selectedWeek} • محاضرة {selectedLectureSlot} • {selectedLectureType === 'practical' ? 'سجل العملي' : 'سجل النظري'})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isDeptAuthorized ? (
                <>
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-950 border-2 border-emerald-300 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-800" />
                    <span>صلاحية التعديل والاعتماد مفعلة</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveWeeklySchedule}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm border border-emerald-600"
                    title={`اعتماد وتثبيت توقيت الأسبوع ${selectedWeek}`}
                  >
                    <Save className="w-4 h-4 shrink-0" />
                    <span>اعتماد توقيت هذا الأسبوع</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyScheduleToRemainingWeeks}
                    className="px-3.5 py-2 bg-blue-800 hover:bg-blue-900 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm border border-blue-700"
                    title="تعميم هذا التوقيت على كافة الأسابيع المتبقية حتى الأسبوع 15 بزيادة أسبوعية منتظمة"
                  >
                    <RotateCcw className="w-4 h-4 shrink-0" />
                    <span>تعميم على باقي الأسابيع</span>
                  </button>
                </>
              ) : (
                <span className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 shadow-2xs">
                  <Lock className="w-4 h-4 text-slate-600" />
                  <span>مقفلة ومحمية ضد التعديل</span>
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">

            {/* 1. تاريخ المحاضرة (تحكم كامل برقم التاريخ التقويمي لكل أسبوع) */}
            <div className={`p-3.5 border-2 rounded-2xl space-y-1.5 shadow-2xs ${isDeptAuthorized ? 'bg-white border-blue-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100' : 'bg-slate-50 border-slate-300'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#0F2942]" />
                  <span>تاريخ المحاضرة:</span>
                </span>
                {isDeptAuthorized ? (
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    تعديل حر
                  </span>
                ) : (
                  <span title="محدد ومصادق من رئاسة القسم">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  </span>
                )}
              </div>
              {isDeptAuthorized ? (
                <ArabicDatePicker
                  value={selectedDate}
                  onChange={(newDate) => {
                    setSelectedDate(newDate);
                    if (newDate) {
                      setSelectedDay(getDayOfWeekFromDate(newDate));
                    }
                  }}
                  onDayDeduce={(dayFound) => {
                    setSelectedDay(dayFound);
                  }}
                  placeholder="حدد تاريخ المحاضرة"
                />
              ) : (
                <div className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-sm sm:text-base font-black text-slate-950 text-center shadow-2xs select-all flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>{selectedDate ? formatDateArabicWithDay(selectedDate) : '—'}</span>
                </div>
              )}
            </div>

            {/* 2. يوم المحاضرة (تزامن تلقائي واختيار يدوي حر لرئيس القسم) */}
            <div className={`p-3.5 border-2 rounded-2xl space-y-1.5 shadow-2xs ${isDeptAuthorized ? 'bg-white border-blue-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100' : 'bg-slate-50 border-slate-300'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-700" />
                  <span>يوم المحاضرة:</span>
                </span>
                {isDeptAuthorized ? (
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    تعديل حر
                  </span>
                ) : (
                  <span title="محدد ومصادق من رئاسة القسم">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  </span>
                )}
              </div>
              {isDeptAuthorized ? (
                <select
                  value={selectedDay}
                  onChange={(e) => {
                    const newDay = e.target.value as DayOfWeek;
                    setSelectedDay(newDay);
                    const updatedDate = calculateDateForAnyDayInWeek(effectiveStartDate, 1, selectedWeek, newDay);
                    setSelectedDate(updatedDate);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-base sm:text-lg font-black text-slate-950 text-center shadow-inner outline-hidden focus:bg-white focus:border-blue-600 transition cursor-pointer"
                >
                  {DAYS_OF_WEEK_LIST.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label_ar}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-base sm:text-lg font-black text-slate-950 text-center shadow-2xs">
                  {currentDayLabel}
                </div>
              )}
            </div>

            {/* 3. مدة المحاضرة (الساعات) */}
            <div className={`p-3.5 border-2 rounded-2xl space-y-1.5 shadow-2xs ${isDeptAuthorized ? 'bg-white border-indigo-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100' : 'bg-slate-50 border-slate-300'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Hourglass className="w-4 h-4 text-indigo-700" />
                  <span>مدة المحاضرة:</span>
                </span>
                {isDeptAuthorized ? (
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    تعديل حر
                  </span>
                ) : (
                  <span title="محدد ومصادق من رئاسة القسم">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  </span>
                )}
              </div>
              {isDeptAuthorized ? (
                <select
                  value={selectedDurationHours}
                  onChange={(e) => {
                    const newDur = parseFloat(e.target.value);
                    setSelectedDurationHours(newDur);
                    setSelectedEndTime(calculateEndTime(selectedStartTime, newDur));
                  }}
                  className="w-full px-3 py-2 bg-white border-2 border-indigo-200 rounded-xl text-base sm:text-lg font-black text-indigo-950 text-center shadow-inner outline-hidden focus:border-indigo-600 transition cursor-pointer"
                >
                  <option value={1}>ساعة واحدة (60 دقيقة)</option>
                  <option value={1.5}>ساعة ونصف (90 دقيقة)</option>
                  <option value={2}>ساعتان (120 دقيقة)</option>
                  <option value={2.5}>ساعتان ونصف (150 دقيقة)</option>
                  <option value={3}>ثلاث ساعات (180 دقيقة)</option>
                </select>
              ) : (
                <div className="w-full px-3 py-2.5 bg-white border-2 border-indigo-200 rounded-xl text-base sm:text-lg font-black text-indigo-950 text-center shadow-2xs">
                  {formatDurationLabelAr(selectedDurationHours)}
                </div>
              )}
            </div>

            {/* 4. وقت البدء */}
            <div className={`p-3.5 border-2 rounded-2xl space-y-1.5 shadow-2xs ${isDeptAuthorized ? 'bg-white border-emerald-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100' : 'bg-slate-50 border-slate-300'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>وقت البدء:</span>
                </span>
                {isDeptAuthorized ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    تعديل حر
                  </span>
                ) : (
                  <span title="محدد ومصادق من رئاسة القسم">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  </span>
                )}
              </div>
              {isDeptAuthorized ? (
                <input
                  type="time"
                  value={selectedStartTime}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setSelectedStartTime(newStart);
                    if (newStart) {
                      setSelectedEndTime(calculateEndTime(newStart, selectedDurationHours));
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border-2 border-emerald-200 rounded-xl text-base sm:text-lg font-black text-emerald-950 font-mono text-center shadow-inner outline-hidden focus:border-emerald-600 transition"
                />
              ) : (
                <div className="w-full px-3 py-2.5 bg-white border-2 border-emerald-200 rounded-xl text-base sm:text-lg font-black text-emerald-950 font-mono text-center shadow-2xs">
                  {selectedStartTime || '—'}
                </div>
              )}
            </div>

            {/* 5. وقت الانتهاء */}
            <div className={`p-3.5 border-2 rounded-2xl space-y-1.5 shadow-2xs ${isDeptAuthorized ? 'bg-white border-rose-300 focus-within:border-rose-600 focus-within:ring-2 focus-within:ring-rose-100' : 'bg-slate-50 border-slate-300'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-700" />
                  <span>وقت الانتهاء:</span>
                </span>
                {isDeptAuthorized ? (
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    تعديل حر
                  </span>
                ) : (
                  <span title="محدد ومصادق من رئاسة القسم">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  </span>
                )}
              </div>
              {isDeptAuthorized ? (
                <input
                  type="time"
                  value={selectedEndTime}
                  onChange={(e) => {
                    const newEnd = e.target.value;
                    setSelectedEndTime(newEnd);
                    if (newEnd && selectedStartTime) {
                      const dur = calculateLectureDurationHours(selectedStartTime, newEnd);
                      if (dur > 0) setSelectedDurationHours(dur);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border-2 border-rose-200 rounded-xl text-base sm:text-lg font-black text-rose-950 font-mono text-center shadow-inner outline-hidden focus:border-rose-600 transition"
                />
              ) : (
                <div className="w-full px-3 py-2.5 bg-white border-2 border-rose-200 rounded-xl text-base sm:text-lg font-black text-rose-950 font-mono text-center shadow-2xs">
                  {selectedEndTime || '—'}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* 📊 4. شريط إحصائيات الجلسة والتحكم الجماعي السريع */}
      <div className="bg-slate-100 p-5 sm:p-6 rounded-3xl border-2 border-slate-200 flex flex-col xl:flex-row items-center justify-between gap-4 shadow-2xs">

        {/* أزرار الإجراءات السريعة للجلسة بأيقونات SVG صريحة ونقية */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          <span className="text-base font-black text-slate-950 ml-1">إجراء سريع للجلسة:</span>

          <button
            type="button"
            onClick={() => handleMarkAll('present')}
            className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 border border-emerald-500"
            title="تعيين جميع طلاب القاعة حاضرين دفعة واحدة"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>تعيين الكل حاضرين ({selectedDurationHours === 1 ? '1 س' : selectedDurationHours === 1.5 ? '1.5 س' : `${selectedDurationHours} س`})</span>
          </button>

          <button
            type="button"
            onClick={() => handleMarkAll('absent_unexcused')}
            className="px-3.5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 border border-rose-500"
            title="تعيين جميع طلاب القاعة غائبين دفعة واحدة"
          >
            <XCircle className="w-4 h-4 text-rose-200" />
            <span>تعيين الكل غائبين</span>
          </button>

          <button
            type="button"
            onClick={() => handleMarkAll('absent_excused')}
            className="px-3.5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 border border-blue-600"
            title="تعيين جميع طلاب القاعة مجازين دفعة واحدة"
          >
            <FileText className="w-4 h-4 text-cyan-200" />
            <span>تعيين الكل مجازين</span>
          </button>

          <button
            type="button"
            onClick={() => handleMarkAll('holiday')}
            className="px-3.5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 border border-sky-500"
            title="تسجيل اليوم عطلة رسمية لكافة طلاب القاعة"
          >
            <Palmtree className="w-4 h-4 text-sky-200" />
            <span>تسجيل اليوم عطلة رسمية</span>
          </button>
        </div>

        {/* عدادات إحصائيات الجلسة الحالية مع إبراز غير محدد وحذف متأخر */}
        <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto justify-end flex-wrap">
          {/* شارة غير محدد الكبيرة والواضحة بلون رمادي/سليت داكن فخم بدون برتقالي */}
          <span className="px-4 py-2 bg-slate-200 text-slate-950 border-2 border-slate-400 rounded-2xl text-sm sm:text-base font-black font-mono shadow-xs flex items-center gap-2">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800 stroke-[2.5]" />
            <span>غير محدد: {sessionStats.unset}</span>
          </span>
          <span className="px-4 py-2 bg-emerald-100 text-emerald-950 border-2 border-emerald-300 rounded-2xl text-sm font-black font-mono shadow-2xs flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>حاضر: {sessionStats.present}</span>
          </span>
          <span className="px-4 py-2 bg-rose-100 text-rose-950 border-2 border-rose-300 rounded-2xl text-sm font-black font-mono shadow-2xs flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-700" />
            <span>غائب: {sessionStats.absentUnexcused}</span>
          </span>
          <span className="px-4 py-2 bg-blue-100 text-blue-950 border-2 border-blue-300 rounded-2xl text-sm font-black font-mono shadow-2xs flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-700" />
            <span>إجازة: {sessionStats.absentExcused}</span>
          </span>
          <span className="px-4 py-2 bg-sky-100 text-sky-950 border-2 border-sky-300 rounded-2xl text-sm font-black font-mono shadow-2xs flex items-center gap-1.5">
            <Palmtree className="w-4 h-4 text-sky-700" />
            <span>عطلة: {sessionStats.holiday}</span>
          </span>
          <span className="px-4 py-2 bg-[#0F2942] text-white rounded-2xl text-sm font-black font-mono shadow-2xs border border-[#1e4570]">
            الإجمالي: {students.length}
          </span>
        </div>

      </div>

      {/* 🔍 5. شريط البحث والتصفية مع زري حفظ التعديلات وإلغاء بنزولهما للأسفل باحترافية */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full bg-slate-50 p-3 sm:p-4 rounded-3xl border-2 border-slate-200 shadow-2xs">

        {/* الجانب الأيمن: أدوات البحث وفلاتر الدراسة وتحديد الكل */}
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* زر تحديد / إلغاء تحديد الكل */}
          <button
            type="button"
            onClick={() => toggleSelectAll(filteredStudents)}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-950 rounded-2xl font-black text-sm sm:text-base transition cursor-pointer border-2 border-slate-300 whitespace-nowrap shadow-xs flex items-center gap-2 active:scale-95"
          >
            {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
              <CheckSquare className="w-5 h-5 text-blue-700" />
            ) : (
              <Square className="w-5 h-5 text-slate-500" />
            )}
            <span>تحديد الكل ({filteredStudents.length})</span>
          </button>

          {/* فلاتر الدراسة (الصباحي / المسائي) */}
          <div className="p-1 bg-white border-2 border-slate-300 rounded-2xl flex items-center gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setStudyTypeFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-sm sm:text-base font-black transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1.5 ${studyTypeFilter === 'all'
                  ? 'bg-[#0F2942] text-white shadow-md'
                  : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                }`}
            >
              <span>الكل</span>
              <span className="font-mono text-sm font-black opacity-90">({students.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setStudyTypeFilter('morning')}
              className={`px-3.5 py-2 rounded-xl text-sm sm:text-base font-black transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1.5 ${studyTypeFilter === 'morning'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-emerald-950 hover:bg-emerald-100'
                }`}
            >
              <Sun className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>الصباحي</span>
              <span className="font-mono text-sm font-black opacity-90">({students.filter((s) => (s.study_type || 'morning') === 'morning').length})</span>
            </button>

            <button
              type="button"
              onClick={() => setStudyTypeFilter('evening')}
              className={`px-3.5 py-2 rounded-xl text-sm sm:text-base font-black transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1.5 ${studyTypeFilter === 'evening'
                  ? 'bg-indigo-700 text-white shadow-md'
                  : 'text-indigo-950 hover:bg-indigo-100'
                }`}
            >
              <Moon className="w-4 h-4 text-indigo-700 shrink-0" />
              <span>المسائي</span>
              <span className="font-mono text-sm font-black opacity-90">({students.filter((s) => s.study_type === 'evening').length})</span>
            </button>
          </div>

          {/* 👥 شريط فلترة وتخصيص سجل حضور الكروبات والشعب */}
          <div className="p-1 bg-white border-2 border-slate-300 rounded-2xl flex items-center gap-1 shadow-2xs flex-wrap">
            <button
              type="button"
              onClick={() => setAttendanceGroupFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1.5 ${
                attendanceGroupFilter === 'all'
                  ? 'bg-[#0F2942] text-white shadow-md'
                  : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <GroupUsersSvg className="w-3.5 h-3.5 shrink-0" />
              <span>كافة الكروبات</span>
              <span className="font-mono text-xs font-black opacity-90">({students.length})</span>
            </button>

            {/* شعبة عامة (غير مخصص لكروب) */}
            {students.some((s) => !s.student_group || s.student_group === 'unassigned') && (
              <button
                type="button"
                onClick={() => setAttendanceGroupFilter('unassigned')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1.5 ${
                  attendanceGroupFilter === 'unassigned'
                    ? 'bg-[#0F2942] text-white shadow-md'
                    : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <GroupBadgeSvg className="w-3.5 h-3.5 shrink-0" />
                <span>شعبة عامة</span>
                <span className="font-mono text-xs font-black opacity-90">
                  ({students.filter((s) => !s.student_group || s.student_group === 'unassigned').length})
                </span>
              </button>
            )}

            {/* أزرار الكروبات المتاحة */}
            {availableStudentGroups.map((grp) => {
              const grpCount = students.filter((s) => s.student_group === grp).length;
              const isSel = attendanceGroupFilter === grp;
              return (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setAttendanceGroupFilter(grp)}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1.5 ${
                    isSel
                      ? 'bg-blue-700 text-white shadow-md'
                      : 'text-blue-950 hover:bg-blue-50'
                  }`}
                >
                  <GroupBadgeSvg className="w-3.5 h-3.5 shrink-0" />
                  <span>سجل كروب {grp}</span>
                  <span className="font-mono text-xs font-black opacity-90">({grpCount})</span>
                </button>
              );
            })}
          </div>

          {/* 🔍 حقل البحث بالاسم فقط (بدون الرقم الجامعي) */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="ابحث عن طالب بالاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-2.5 pr-12 bg-white border-2 border-slate-300 rounded-2xl text-base font-black text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0F2942] shadow-2xs"
            />
            <Search className="w-5 h-5 text-slate-400 absolute right-4 top-3" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-4 top-3 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 💾 زري حفظ التعديلات وإلغاء بنزولهما بجانب شريط البحث بطريقة احترافية وفخمة */}
        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
          {/* 💾 زر حفظ التعديل الاحترافي والبارز */}
          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={isSaving || !hasPendingChanges}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 border-2 shadow-sm ${hasPendingChanges
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400 ring-2 ring-emerald-300/40 cursor-pointer active:scale-95'
                : 'bg-emerald-800 text-white border-emerald-700 cursor-not-allowed opacity-80'
              }`}
            title={hasPendingChanges ? 'حفظ وتثبيت التعديلات المنجزة على الكشف' : 'لا توجد تعديلات جديدة غير محفوظة'}
          >
            <Save className="w-4 h-4 text-white shrink-0 stroke-[2.5]" />
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
          </button>

          {/* ↩️ زر إلغاء التعديل الاحترافي والبارز */}
          <button
            type="button"
            onClick={handleDiscardChanges}
            disabled={!hasPendingChanges}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 border-2 shadow-sm ${hasPendingChanges
                ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-400 ring-2 ring-rose-300/40 cursor-pointer active:scale-95'
                : 'bg-slate-700 text-white border-slate-600 cursor-not-allowed opacity-80'
              }`}
            title={hasPendingChanges ? 'إلغاء التعديلات غير المحفوظة واسترجاع الكشف السابق' : 'لا توجد تعديلات لإلغائها'}
          >
            <RotateCcw className="w-4 h-4 text-white shrink-0 stroke-[2.5]" />
            <span>إلغاء</span>
          </button>
        </div>

      </div>

      {/* 🎛️ 6. شريط الإجراءات الجماعية العائم عند تحديد طلاب */}
      {selectedStudentIds.length > 0 && (
        <div className="bg-[#0F2942] text-white p-4 sm:px-6 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border-2 border-[#1e4570] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-cyan-300 rounded-xl border border-cyan-400/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-base text-white">
                تم تحديد <strong className="text-cyan-300 font-mono text-xl font-black">({selectedStudentIds.length})</strong> من أصل <span className="font-mono text-slate-300">({filteredStudents.length})</span> طالب
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 📢 إرسال تنبيه للمحددين */}
            <button
              type="button"
              onClick={() => {
                setNoticeTargetStudent(null);
                setNoticeDefaultCategory('warning_1');
                setIsNoticeModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-black text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border border-blue-500"
            >
              <Send className="w-4 h-4 text-cyan-200" />
              <span>إرسال تنبيه للمحددين</span>
            </button>

            {/* تعيين حاضر */}
            <button
              type="button"
              onClick={() => handleBulkSetStatus('present')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تعيين حاضر ({selectedDurationHours} س)</span>
            </button>

            {/* تعيين غائب */}
            <button
              type="button"
              onClick={() => handleBulkSetStatus('absent_unexcused')}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <XCircle className="w-4 h-4" />
              <span>تعيين غائب ({selectedDurationHours} س)</span>
            </button>

            {/* تعيين مجاز */}
            <button
              type="button"
              onClick={() => handleBulkSetStatus('absent_excused')}
              className="px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl font-black text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>تعيين إجازة</span>
            </button>

            {/* تعيين غير محدد */}
            <button
              type="button"
              onClick={() => handleBulkSetStatus('unset')}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-black text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border border-slate-600"
            >
              <HelpCircle className="w-4 h-4 text-slate-300" />
              <span>تعيين غير محدد</span>
            </button>

            {/* إلغاء التحديد */}
            <button
              type="button"
              onClick={() => setSelectedStudentIds([])}
              className="px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-black text-sm transition cursor-pointer"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* 📋 7. جدول رصد الحضور والتسجيل التفصيلي لكل طالب */}
      <div className="border-2 border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">

        {/* رأس الجدول الفاخر مع خطوط واضحة وأعمدة منفصلة ومنظمة تشمل ساعات الإجازة والعطل */}
        <div className="overflow-x-auto w-full">
          <div className="min-w-[1360px]">
            <div className="grid grid-cols-[60px_minmax(190px,1.4fr)_minmax(210px,1.5fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(130px,0.9fr)_minmax(130px,0.9fr)_minmax(150px,1.1fr)] bg-slate-100 text-slate-950 border-b-2 border-slate-200 text-sm sm:text-base font-black p-4 text-center items-center gap-3">
              <div className="flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleSelectAll(filteredStudents)}
                  className="p-1 text-[#0F2942] hover:scale-110 transition cursor-pointer"
                  title="تحديد الكل"
                >
                  {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-blue-700" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500" />
                  )}
                </button>
                <span>ت</span>
              </div>

              <div className="text-right pr-2">اسم الطالب والشعبة</div>
              <div>حالة الحضور (محاضرة {selectedLectureSlot} • {selectedDurationHours} ساعات)</div>
              <div className="text-center">ساعات الحضور المنجزة</div>
              <div className="text-center">ساعات ونسبة الغياب</div>
              <div className="text-center">ساعات الإجازة</div>
              <div className="text-center">ساعات العطل</div>
              <div className="text-center">الموقف والتبليغ</div>
            </div>

            {/* صفوف الطلاب */}
            <div className="divide-y-2 divide-slate-200">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-slate-600 font-bold space-y-2">
                  <Users className="w-12 h-12 text-slate-400 mx-auto" />
                  <p className="text-lg font-black text-slate-900">لا يوجد طلاب مطابقين لمعايير البحث والتصفية.</p>
                </div>
              ) : (
                filteredStudents.map((st, idx) => {
                  const entry = currentSessionMap[st.id] || {
                    status: 'unset' as AttendanceStatus,
                    excuse_reason: '',
                    excuse_document_ref: '',
                    late_minutes: 0,
                    notes: '',
                  };

                  // 🧮 حساب موقف الطالب مفصولاً بدقة للمسار والمحاضرة الحالية (النظري مفصول عن العملي، ومحاضرة 1 مفصولة عن 2)
                  const summary = calculateStudentCourseAttendance(
                    st.id,
                    course.id,
                    liveRecords,
                    course.name,
                    course.code,
                    course.credit_hours || 3,
                    courseTotalHours,
                    selectedLectureType, // 📘 فصل النظري عن العملي بدقة
                    selectedLectureSlot  // 🕒 فصل المحاضرة الأولى عن المحاضرة الثانية
                  );
                  const warningMeta = getAttendanceWarningBadgeMeta(summary.warning_status);
                  const isSelected = selectedStudentIds.includes(st.id);

                  return (
                    <div
                      key={st.id}
                      className={`p-4 sm:p-5 hover:bg-slate-50 transition flex flex-col space-y-3.5 ${isSelected
                          ? 'bg-blue-50/80 ring-2 ring-blue-400'
                          : entry.status === 'absent_unexcused'
                            ? 'bg-rose-50/40'
                            : ''
                        }`}
                    >
                      <div className="grid grid-cols-[60px_minmax(190px,1.4fr)_minmax(210px,1.5fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(130px,0.9fr)_minmax(130px,0.9fr)_minmax(150px,1.1fr)] items-center gap-3 text-base font-black">

                        {/* التسلسل ومربع التحديد */}
                        <div className="flex items-center justify-center gap-1.5 font-black text-slate-950">
                          <button
                            type="button"
                            onClick={() => toggleSelect(st.id)}
                            className="p-1 text-[#0F2942] hover:scale-110 transition cursor-pointer"
                            title={`تحديد ${st.full_name}`}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-blue-700" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-500" />
                            )}
                          </button>
                          <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 bg-slate-100 border border-slate-300 rounded-xl text-sm font-black shadow-2xs">
                            {idx + 1}
                          </span>
                        </div>

                        {/* 👤 اسم الطالب وشاراته الأكاديمية (بدون الرقم الجامعي) */}
                        <div className="text-right">
                          {(() => {
                            const stGender = st.gender || detectArabicGender(st.full_name);
                            const stStudy = st.study_type || 'morning';

                            return (
                              <div className="flex flex-col items-start gap-1.5">
                                <h4 className="font-black text-slate-950 leading-tight text-lg tracking-tight">
                                  {st.full_name}
                                </h4>

                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                  {/* ☀️ / 🌙 شارة الصباحي والمسائي */}
                                  <span className={`px-2 py-0.5 rounded-lg text-xs font-black border flex items-center gap-1 shadow-2xs ${stStudy === 'evening'
                                      ? 'bg-indigo-50 text-indigo-950 border-indigo-200'
                                      : 'bg-emerald-50 text-emerald-950 border-emerald-200'
                                    }`}>
                                    {stStudy === 'evening' ? (
                                      <Moon className="w-3 h-3 text-indigo-700 shrink-0" />
                                    ) : (
                                      <Sun className="w-3 h-3 text-emerald-700 shrink-0" />
                                    )}
                                    <span>{stStudy === 'evening' ? 'مسائي' : 'صباحي'}</span>
                                  </span>

                                  {/* 👨 / 👩 شارة الجنس */}
                                  <span className={`px-2 py-0.5 rounded-lg text-xs font-black border shadow-2xs ${stGender === 'female'
                                      ? 'bg-rose-50 text-rose-950 border-rose-200'
                                      : 'bg-blue-50 text-blue-950 border-blue-200'
                                    }`}>
                                    {stGender === 'female' ? 'أنثى' : 'ذكر'}
                                  </span>

                                  {/* ⏳ شارة ساعات المحاضرة الحالية */}
                                  <span className="px-2 py-0.5 bg-slate-900 text-white font-mono font-black text-xs rounded-lg border border-slate-700 shadow-2xs flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-cyan-300 shrink-0" />
                                    <span>{selectedDurationHours === 1 ? '1 س' : selectedDurationHours === 1.5 ? '1.5 س' : `${selectedDurationHours} س`} للمحاضرة</span>
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* 🔘 أزرار اختيار الحالة مع استبدال اللون البرتقالي بلون رمادي فخم */}
                        <div className="flex flex-col items-center justify-center gap-1.5">

                          {/* مؤشر حالة غير محدد (كبير، بارز، وبلون رمادي/سليت داكن أنيق بدون برتقالي) */}
                          {entry.status === 'unset' && (
                            <div className="w-full flex items-center justify-center mb-1 animate-in fade-in">
                              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-200 text-slate-950 text-sm font-black rounded-2xl border-2 border-slate-400 shadow-xs">
                                <HelpCircle className="w-4 h-4 text-slate-800 stroke-[2.5]" />
                                <span>غير محدد</span>
                              </span>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-center gap-1.5 w-full">
                            {/* حاضر 🟢 */}
                            <button
                              type="button"
                              onClick={() => handleStudentStatusChange(st.id, 'present')}
                              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1 border-2 ${entry.status === 'present'
                                  ? 'bg-emerald-700 text-white border-emerald-600 shadow-md scale-105 ring-2 ring-emerald-400/30'
                                  : 'bg-slate-50 text-slate-800 hover:bg-emerald-50 border-slate-300'
                                }`}
                              title="تسجيل الطالب حاضر في هذه المحاضرة"
                            >
                              <CheckCircle2 className={`w-4 h-4 ${entry.status === 'present' ? 'text-emerald-200' : 'text-emerald-700'}`} />
                              <span>حاضر</span>
                            </button>

                            {/* غائب بدون عذر 🔴 */}
                            <button
                              type="button"
                              onClick={() => handleStudentStatusChange(st.id, 'absent_unexcused')}
                              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1 border-2 ${entry.status === 'absent_unexcused'
                                  ? 'bg-rose-700 text-white border-rose-600 shadow-md scale-105 ring-2 ring-rose-400/30'
                                  : 'bg-slate-50 text-slate-800 hover:bg-rose-50 border-slate-300'
                                }`}
                              title="تسجيل غياب غير مبرر للطالب"
                            >
                              <XCircle className={`w-4 h-4 ${entry.status === 'absent_unexcused' ? 'text-rose-200' : 'text-rose-700'}`} />
                              <span>غائب</span>
                            </button>

                            {/* مجاز بعذر رسمي 📄 */}
                            <button
                              type="button"
                              onClick={() => handleStudentStatusChange(st.id, 'absent_excused')}
                              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1 border-2 ${entry.status === 'absent_excused'
                                  ? 'bg-blue-800 text-white border-blue-700 shadow-md scale-105 ring-2 ring-blue-400/30'
                                  : 'bg-slate-50 text-slate-800 hover:bg-blue-50 border-slate-300'
                                }`}
                              title="تسجيل إجازة رسمية أو عذر طبي معتمد"
                            >
                              <FileText className={`w-4 h-4 ${entry.status === 'absent_excused' ? 'text-cyan-200' : 'text-blue-700'}`} />
                              <span>إجازة</span>
                            </button>

                            {/* عطلة رسمية 🏖️ */}
                            <button
                              type="button"
                              onClick={() => handleStudentStatusChange(st.id, 'holiday')}
                              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1 border-2 ${entry.status === 'holiday'
                                  ? 'bg-sky-700 text-white border-sky-600 shadow-md scale-105 ring-2 ring-sky-400/30'
                                  : 'bg-slate-50 text-slate-800 hover:bg-sky-50 border-slate-300'
                                }`}
                              title="تسجيل عطلة رسمية أو استثناء عام"
                            >
                              <Palmtree className={`w-4 h-4 ${entry.status === 'holiday' ? 'text-sky-200' : 'text-sky-700'}`} />
                              <span>عطلة</span>
                            </button>
                          </div>

                        </div>

                        {/* 📊 4. عمود ساعات الحضور المنجزة (موحد الحجم والتصميم هندسياً بارتفاع h-[92px]) */}
                        <div className="flex flex-col justify-between gap-1 p-3 bg-white border-2 border-emerald-300 rounded-2xl text-right shadow-2xs h-[92px]">
                          <div className="text-xs font-black text-emerald-950 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0 stroke-[2.5]" />
                              <span>حضور ({selectedLectureType === 'practical' ? 'العملي' : 'النظري'}):</span>
                            </span>
                            <span className="font-mono font-black text-emerald-800 text-xs px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md">
                              {summary.attendance_rate_percentage || 0}%
                            </span>
                          </div>
                          <div className="text-sm sm:text-base font-black text-slate-950 flex items-baseline justify-between">
                            <span className="text-emerald-800 font-mono text-base sm:text-lg font-black">
                              {summary.total_present_hours || 0} س
                            </span>
                            <span className="text-slate-600 font-bold text-[11px] font-mono">
                              ({summary.present_count || 0} محاضرة)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex border border-slate-300 shadow-inner">
                            <div
                              className="bg-emerald-600 h-full transition-all"
                              style={{ width: `${Math.min(100, summary.attendance_rate_percentage || 0)}%` }}
                              title={`حضور منجز: ${summary.total_present_hours || 0} ساعة`}
                            />
                          </div>
                        </div>

                        {/* 🔴 5. عمود ساعات ونسبة الغياب (موحد الحجم والتصميم هندسياً بارتفاع h-[92px]) */}
                        <div className="flex flex-col justify-between gap-1 p-3 bg-white border-2 border-rose-300 rounded-2xl text-right shadow-2xs h-[92px]">
                          <div className="text-xs font-black text-rose-950 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5 text-rose-700 shrink-0 stroke-[2.5]" />
                              <span>غياب ({selectedLectureType === 'practical' ? 'العملي' : 'النظري'}):</span>
                            </span>
                            <span className="font-mono font-black text-rose-700 text-xs px-1.5 py-0.5 bg-rose-50 border border-rose-200 rounded-md">
                              {summary.absence_percentage || 0}%
                            </span>
                          </div>
                          <div className="text-sm sm:text-base font-black text-slate-950 flex items-baseline justify-between">
                            <span className="text-rose-800 font-mono text-base sm:text-lg font-black">
                              {summary.total_unexcused_absence_hours || 0} س
                            </span>
                            <span className="text-slate-600 font-bold text-[11px] font-mono">
                              ({summary.absent_unexcused_count || 0} محاضرة)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex border border-slate-300 shadow-inner">
                            <div
                              className={`h-full transition-all ${summary.absence_percentage >= 10
                                  ? 'bg-rose-700'
                                  : summary.absence_percentage >= 7
                                    ? 'bg-rose-500'
                                    : summary.absence_percentage >= 5
                                      ? 'bg-rose-400'
                                      : 'bg-slate-400'
                                }`}
                              style={{ width: `${Math.min(100, (summary.absence_percentage || 0) * 10)}%` }}
                              title={`غياب غير مبرر: ${summary.total_unexcused_absence_hours || 0} ساعة (${summary.absence_percentage || 0}%)`}
                            />
                          </div>
                        </div>

                        {/* 📄 6. عمود ساعات الإجازة (موحد الحجم والتصميم هندسياً بارتفاع h-[92px]) */}
                        <div className="flex flex-col justify-between gap-1 p-3 bg-white border-2 border-blue-300 rounded-2xl text-right shadow-2xs h-[92px]">
                          <div className="text-xs font-black text-blue-950 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-blue-700 shrink-0 stroke-[2.5]" />
                              <span>إجازات رسمية:</span>
                            </span>
                            <span className="font-mono font-black text-blue-800 text-xs px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded-md">
                              {summary.total_scheduled_hours > 0 ? Math.round(((summary.total_excused_absence_hours || 0) / summary.total_scheduled_hours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="text-sm sm:text-base font-black text-slate-950 flex items-baseline justify-between">
                            <span className="text-blue-900 font-mono text-base sm:text-lg font-black">
                              {summary.total_excused_absence_hours || 0} س
                            </span>
                            <span className="text-slate-600 font-bold text-[11px] font-mono">
                              ({summary.absent_excused_count || 0} محاضرة)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex border border-slate-300 shadow-inner">
                            <div
                              className="bg-blue-600 h-full transition-all"
                              style={{ width: `${Math.min(100, summary.total_scheduled_hours > 0 ? ((summary.total_excused_absence_hours || 0) / summary.total_scheduled_hours) * 100 : 0)}%` }}
                              title={`إجازات رسمية: ${summary.total_excused_absence_hours || 0} ساعة`}
                            />
                          </div>
                        </div>

                        {/* 🏖️ 7. عمود ساعات العطل (موحد الحجم والتصميم هندسياً بارتفاع h-[92px]) */}
                        <div className="flex flex-col justify-between gap-1 p-3 bg-white border-2 border-sky-300 rounded-2xl text-right shadow-2xs h-[92px]">
                          <div className="text-xs font-black text-sky-950 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Palmtree className="w-3.5 h-3.5 text-sky-700 shrink-0 stroke-[2.5]" />
                              <span>عطل رسمية:</span>
                            </span>
                            <span className="font-mono font-black text-sky-800 text-xs px-1.5 py-0.5 bg-sky-50 border border-sky-200 rounded-md">
                              {summary.total_scheduled_hours > 0 ? Math.round(((summary.total_holiday_hours || (summary.holiday_count * selectedDurationHours)) / summary.total_scheduled_hours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="text-sm sm:text-base font-black text-slate-950 flex items-baseline justify-between">
                            <span className="text-sky-900 font-mono text-base sm:text-lg font-black">
                              {summary.total_holiday_hours || (summary.holiday_count * selectedDurationHours)} س
                            </span>
                            <span className="text-slate-600 font-bold text-[11px] font-mono">
                              ({summary.holiday_count || 0} يوم)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex border border-slate-300 shadow-inner">
                            <div
                              className="bg-sky-600 h-full transition-all"
                              style={{ width: `${Math.min(100, summary.total_scheduled_hours > 0 ? ((summary.total_holiday_hours || (summary.holiday_count * selectedDurationHours)) / summary.total_scheduled_hours) * 100 : 0)}%` }}
                              title={`عطل رسمية: ${summary.total_holiday_hours || (summary.holiday_count * selectedDurationHours)} ساعة`}
                            />
                          </div>
                        </div>

                        {/* ⚠️ 8. عمود الموقف الأكاديمي والإنذارات وزر التنبيه الفوري (موحد الحجم بارتفاع h-[92px]) */}
                        <div className="flex flex-col justify-between items-center p-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl shadow-2xs h-[92px]">
                          <span
                            className={`w-full py-1 px-2 rounded-xl text-xs sm:text-sm font-black border text-center shadow-2xs whitespace-nowrap leading-snug ${warningMeta.badgeClass}`}
                            title={warningMeta.label_ar}
                          >
                            {warningMeta.label_ar}
                          </span>
                          <div className="flex flex-col gap-1 w-full mt-1">
                            {/* 📋 زر كشف الأيام الشامل للطالب */}
                            <button
                              type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
                              onClick={() => { // ⚡ فتح نافذة كشف الأيام لهذا الطالب
                                setTeacherSelectedStudentForDays(st);
                                setIsTeacherDaysModalOpen(true);
                              }}
                              className="w-full py-1 px-2.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-950 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs border border-blue-200"
                              title={`عرض كشف أيام الحضور والغياب والإجازات والعطل للطالب ${st.full_name}`}
                            >
                              <StudentDaysSheetSvg className="w-3.5 h-3.5 text-blue-700 shrink-0" /> {/* 📋 أيقونة كشف الأيام الفيكتورية */}
                              <span>كشف الأيام</span> {/* 📝 نص الزر */}
                            </button>

                            {/* 📢 زر إرسال تبليغ رسمي للطالب */}
                            <button
                              type="button"
                              onClick={() => {
                                setNoticeTargetStudent(st);
                                if (summary.warning_status === 'banned') {
                                  setNoticeDefaultCategory('banned');
                                } else if (summary.warning_status === 'warning_2') {
                                  setNoticeDefaultCategory('warning_2');
                                } else if (summary.warning_status === 'warning_1') {
                                  setNoticeDefaultCategory('warning_1');
                                } else {
                                  setNoticeDefaultCategory('general_announcement');
                                }
                                setIsNoticeModalOpen(true);
                              }}
                              className="w-full py-1 px-2.5 bg-[#0F2942] hover:bg-[#163a5f] active:scale-95 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs border border-[#1e4570]"
                              title={`إرسال تبليغ رسمي للطالب ${st.full_name}`}
                            >
                              <Send className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                              <span>تبليغ الطالب</span>
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 📑 8. نافذة مراجعة واعتماد طلبات الإجازات */}
      <ExcuseRequestsReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        requests={excuseRequests}
        reviewerId={teacherId}
        reviewerName={teacherName}
        reviewerRole="teacher"
        onUpdateRequest={(updated) => {
          const all = getStoredData<AttendanceExcuseRequest[]>('excuse_requests', INITIAL_EXCUSE_REQUESTS);
          const newAll = all.map((r) => (r.id === updated.id ? updated : r));
          saveStoredData('excuse_requests', newAll);
          saveExcuseRequestToSupabase(updated); // ☁️ حفظ ومزامنة حالة العذر في سحابة Supabase فوراً
          setExcuseRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          showFloatingToast({
            title: `تم تحديث حالة طلب الإجازة بنجاح`,
            subtitle: updated.status === 'approved' ? 'تمت الموافقة على الإجازة الرسمية' : 'تم رفض طلب الإجازة',
            type: updated.status === 'approved' ? 'absent_excused' : 'absent_unexcused',
          });
        }}
        onUpdateAttendanceRecord={(cId, wNum, sId, reason, docRef) => {
          // تحديث الحالة فوراً في الـ currentSessionMap إذا كان نفس الأسبوع المفتوح
          if (wNum === selectedWeek) {
            setCurrentSessionMap((prev) => ({
              ...prev,
              [sId]: {
                status: 'absent_excused',
                excuse_reason: reason,
                excuse_document_ref: docRef,
                late_minutes: 0,
                notes: 'تم قبول الإجازة رسمياً من قبل أستاذ المادة',
              },
            }));
          }

          // وتحديث كافة السجلات المحفوظة في قاعدة البيانات لهذا الطالب وهذا الأسبوع
          const matchingRecords = initialRecords.filter((r) => r.course_id === cId && r.week_number === wNum && r.student_id === sId);
          const otherRecords = initialRecords.filter((r) => !(r.course_id === cId && r.week_number === wNum && r.student_id === sId));
          const studentProfile = students.find((s) => s.id === sId);

          let updatedForStudent: StudentAttendanceRecord[] = [];
          if (matchingRecords.length > 0) {
            updatedForStudent = matchingRecords.map((rec) => ({
              ...rec,
              status: 'absent_excused',
              excuse_reason: reason,
              excuse_document_ref: docRef,
              notes: 'تم قبول الإجازة رسمياً من قبل أستاذ المادة',
              updated_at: new Date().toISOString(),
            }));
          } else {
            updatedForStudent = [{
              id: `att-${cId}-w${wNum}-${sId}`,
              student_id: sId,
              student_name: studentProfile?.full_name || 'طالب',
              university_number: studentProfile?.university_number || '20261001',
              course_id: cId,
              course_name: course.name,
              course_code: course.code,
              department_id: course.department_id || 'dept-1',
              stage_number: course.stage_number || 1,
              semester: (course.semester || 1) as 1 | 2,
              academic_year_id: 'year-2026',
              week_number: wNum,
              lecture_slot: 1,
              lecture_type: selectedLectureType,
              day: selectedDay,
              date: selectedDate,
              start_time: selectedStartTime,
              end_time: selectedEndTime,
              duration_hours: selectedDurationHours,
              status: 'absent_excused',
              excuse_reason: reason,
              excuse_document_ref: docRef,
              recorded_by_teacher_id: teacherId,
              recorded_by_teacher_name: teacherName,
              notes: 'تم قبول الإجازة رسمياً من قبل أستاذ المادة',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }];
          }

          const allUpdated = [...otherRecords, ...updatedForStudent];
          onSaveRecords(allUpdated);
        }}
      />

      {/* 📢 10. نافذة التبليغات والتنبيهات الذكية للحضور والغيابات والعطل والامتحانات */}
      <AttendanceNoticeModal
        isOpen={isNoticeModalOpen}
        onClose={() => {
          setIsNoticeModalOpen(false);
          setNoticeTargetStudent(null);
        }}
        departmentId={course.department_id || 'dept-1'}
        departmentName={course.department_name || 'القسم الأكاديمي'}
        students={students}
        initialStudent={noticeTargetStudent}
        initialSelectedStudentIds={selectedStudentIds}
        defaultCategory={noticeDefaultCategory}
        onNoticeSent={(summary) => {
          // 📢 إظهار التنبيه العائم الفاخر عند إرسال التبليغ
          showFloatingToast({
            title: `تم إرسال التبليغ الأكاديمي بنجاح`,
            subtitle: summary,
            type: 'info',
          });
        }}
      />

      {/* 📋 11. نافذة كشف الأيام الشامل للطالب للتدريسي */}
      <StudentAttendanceDaysModal
        isOpen={isTeacherDaysModalOpen}
        onClose={() => {
          setIsTeacherDaysModalOpen(false);
          setTeacherSelectedStudentForDays(null);
        }}
        student={teacherSelectedStudentForDays}
        records={initialRecords}
      />

    </div>
  );
}
