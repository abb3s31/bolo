'use client'; // ⚡ ينفذ بالعميل على متصفح الطالب

// 🎓 مكون لوحة متابعة الحضور والغيابات والإجازات الرسمية للطالب لمسار بولونيا (StudentAttendanceView)
import { useState, useMemo, useEffect, useRef } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة ودورة الحياة والمراجع
import {
  Course,
  StudentAttendanceRecord,
  AttendanceStatus,
  StudentCourseAttendanceSummary,
  AttendanceWarningStatus,
  AttendanceExcuseRequest,
  DepartmentScheduleConfig, // ⚙️ إعدادات الجدول وتاريخ الانطلاق
} from '@/types'; // 🔗 استيراد الأنواع الرسمية
import { saveExcuseRequestToSupabase, syncExcuseRequestsFromSupabase } from '@/lib/supabase-client'; // ☁️ المزامنة السحابية للأعذار الطبية
import {
  BOLOGNA_SEMESTER_WEEKS,
  ATTENDANCE_STATUS_META,
  calculateStudentCourseAttendance,
  getAttendanceWarningBadgeMeta,
  BOLOGNA_ATTENDANCE_THRESHOLDS,
  DepartmentLectureDurationConfig,
  getDepartmentDurationConfig,
  getCourseTotalScheduledHours,
} from '@/lib/attendance-utils'; // 🕒 أدوات وحسابات الحضور وضوابط بولونيا الدقيقة
import {
  calculateDateForAnyDayInWeek,
  getCurrentAcademicWeek,
  formatDateArabicWithDay,
  IRAQI_ARABIC_MONTHS,
} from '@/lib/schedule-utils'; // 🗓️ دوال حسابات الأسابيع وتواريخ التقويم الذكية
import { syncDepartmentDurationConfigFromSupabase } from '@/lib/supabase-client'; // 🔌 مزامنة قاعدة بيانات Supabase
import { getStoredData, saveStoredData, INITIAL_EXCUSE_REQUESTS } from '@/lib/mock-data'; // 💾 التخزين المحلي
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Ban,
  Sun,
  Moon,
  Timer,
  BookOpen,
  Filter,
  Layers,
  Sparkles,
  Printer,
  ShieldCheck,
  FileText,
  ChevronDown,
  Info,
  PlusCircle,
  Send,
  ClipboardList,
  GraduationCap,
  Check,
  Palmtree,
  FlaskConical,
} from 'lucide-react'; // 🎨 الأيقونات الفيكتورية SVG
import ExcuseRequestModal from '@/components/attendance/ExcuseRequestModal'; // 📑 نافذة تقديم عذر رسمي

// 📋 واجهة الخصائص المستقبلة للوحة الطالب
interface StudentAttendanceViewProps {
  studentId: string;                     // 🎓 معرف الطالب
  studentName: string;                   // 👤 اسم الطالب
  universityNumber?: string;             // 🔢 الرقم الجامعي
  departmentId?: string;                 // 🏢 معرف القسم
  stageNumber?: number;                  // 🎓 رقم المرحلة
  courses: Course[];                     // 📘 المواد الدراسية المسجلة
  records: StudentAttendanceRecord[];    // 📋 كافة سجلات الحضور المحفوظة
  activeSemester: 1 | 2;                 // 🗓️ الكورس الفصلي المختار
  onAttendanceUpdated?: (updated: StudentAttendanceRecord[]) => void; // 💾 رد نداء التحديث
}

export default function StudentAttendanceView({
  studentId,
  studentName,
  universityNumber = '20261001',
  departmentId = 'dept-1',
  stageNumber = 2,
  courses,
  records,
  activeSemester,
  onAttendanceUpdated,
}: StudentAttendanceViewProps) {
  // 🗓️ 1. الحالة: الكورس الدراسي المختار من قبل الطالب (الكورس الأول أو الكورس الثاني)
  const [currentSemester, setCurrentSemester] = useState<1 | 2>(activeSemester || 1);

  // 🔄 مزامنة الكورس عند تغير الخاصية من الخارج
  useEffect(() => {
    if (activeSemester) {
      setCurrentSemester(activeSemester);
    }
  }, [activeSemester]);

  // 📱 2. الحالة: نمط العرض النشط (ملخص المواد summary / جدول تفصيلي table / الإجازات excuses)
  const [activeViewMode, setActiveViewMode] = useState<'summary' | 'table' | 'excuses'>('summary');

  // 🔍 3. حالات تصفية الجدول التفصيلي
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all'); // 📘 المادة المحددة
  const [selectedWeek, setSelectedWeek] = useState<string>('all'); // 🗓️ الأسبوع المحدد
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // 🔘 الحالة المحددة
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'theory' | 'practical'>('all'); // 🏷️ نوع المسار (نظري / عملي)

  // 🔽 4. حالات القوائم المنسدلة الاحترافية المخصصة
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState<boolean>(false); // 📘 قائمة المادة
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState<boolean>(false); // 🗓️ قائمة الأسبوع
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState<boolean>(false); // 🔘 قائمة الحالة
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState<boolean>(false); // 🏷️ قائمة نوع المسار
  const courseDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع قائمة المادة
  const weekDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع قائمة الأسبوع
  const statusDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع قائمة الحالة
  const typeDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع قائمة نوع المسار

  // 📑 5. حالات النوافذ المنبثقة للأعذار
  const [isExcuseModalOpen, setIsExcuseModalOpen] = useState<boolean>(false); // 📑 نافذة تقديم عذر

  // 📄 6. قائمة طلبات الإجازات الخاصة بالطالب
  const [excuseRequests, setExcuseRequests] = useState<AttendanceExcuseRequest[]>([]);

  // 🔒 7. إغلاق القوائم المنسدلة عند النقر بالخارج
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
        setIsCourseDropdownOpen(false);
      }
      if (weekDropdownRef.current && !weekDropdownRef.current.contains(event.target as Node)) {
        setIsWeekDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setIsTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 🔄 8. جلب وتحديث طلبات الإجازات للطالب
  useEffect(() => {
    const all = getStoredData<AttendanceExcuseRequest[]>('excuse_requests', INITIAL_EXCUSE_REQUESTS);
    setExcuseRequests(all.filter((r) => r.student_id === studentId));

    // ☁️ المزامنة اللحظية للأعذار من Supabase
    syncExcuseRequestsFromSupabase().then((liveExcuses) => {
      if (liveExcuses && liveExcuses.length > 0) {
        setExcuseRequests(liveExcuses.filter((r) => r.student_id === studentId));
      }
    }).catch(() => {});
  }, [studentId]);

  // ⚙️ 8.1 جلب إعدادات مدد وساعات المحاضرات للقسم ومزامنتها لحظياً
  const [durationConfig, setDurationConfig] = useState<DepartmentLectureDurationConfig>(() =>
    getDepartmentDurationConfig(departmentId)
  );

  useEffect(() => {
    const handleDurationSync = () => {
      const updated = getDepartmentDurationConfig(departmentId);
      setDurationConfig(updated);
    };

    // ☁️ محاولة جلب التخصيصات من السحابة للقسم
    syncDepartmentDurationConfigFromSupabase(departmentId).then((cloudConfig) => {
      if (cloudConfig && typeof cloudConfig === 'object') {
        const updated = getDepartmentDurationConfig(departmentId);
        setDurationConfig(updated);
      }
    }).catch(() => {});

    window.addEventListener('lecture_durations_updated', handleDurationSync);
    window.addEventListener('storage', handleDurationSync);
    return () => {
      window.removeEventListener('lecture_durations_updated', handleDurationSync);
      window.removeEventListener('storage', handleDurationSync);
    };
  }, [departmentId]);

  // 📚 9. تصفية المواد حسب الكورس الدراسي المختار
  const semesterCourses = useMemo(() => {
    return courses.filter((c) => (c.semester || 1) === currentSemester);
  }, [courses, currentSemester]);

  // 🧮 10. حساب الملخص الإحصائي الشامل لجميع المواد لمسار بولونيا مع دعم الساعات المخصصة
  const courseSummaries = useMemo<StudentCourseAttendanceSummary[]>(() => {
    return semesterCourses.map((c) => {
      const customTotal = getCourseTotalScheduledHours(durationConfig, c.id, c.credit_hours);
      return calculateStudentCourseAttendance(
        studentId,
        c.id,
        records,
        c.name,
        c.code,
        c.credit_hours || 3,
        customTotal
      );
    });
  }, [semesterCourses, studentId, records, durationConfig]);

  // ⚠️ 11. رصد المواد التي دخلت مرحلة الإنذار أو الحرمان الأكاديمي
  const alertCourses = useMemo(() => {
    return courseSummaries.filter((s) => s.warning_status !== 'safe');
  }, [courseSummaries]);

  // 📊 12. الإحصائيات الإجمالية للطالب
  const totalScheduledHours = useMemo(() => {
    return courseSummaries.reduce((sum, c) => sum + c.total_scheduled_hours, 0);
  }, [courseSummaries]);

  const totalUnexcusedHours = useMemo(() => {
    return courseSummaries.reduce((sum, c) => sum + c.total_unexcused_absence_hours, 0);
  }, [courseSummaries]);

  const overallAbsencePercentage = totalScheduledHours > 0
    ? Math.round((totalUnexcusedHours / totalScheduledHours) * 100 * 10) / 10
    : 0;

  // 🔍 13. تصفية السجلات التفصيلية للجدول
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (r.student_id !== studentId) return false;
      if (selectedCourseId !== 'all' && r.course_id !== selectedCourseId) return false;
      if (selectedWeek !== 'all' && r.week_number !== parseInt(selectedWeek)) return false;
      if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
      if (selectedTypeFilter !== 'all' && r.lecture_type !== selectedTypeFilter) return false;
      
      const course = courses.find((c) => c.id === r.course_id);
      if (course && (course.semester || 1) !== currentSemester) return false;
      
      return true;
    });
  }, [records, studentId, selectedCourseId, selectedWeek, selectedStatus, selectedTypeFilter, courses, currentSemester]);

  // 🏷️ قراءة اسم المسار المختار للفلتر
  const selectedTypeLabel = useMemo(() => {
    if (selectedTypeFilter === 'all') return 'كافة المسارات (نظري وعملي)';
    if (selectedTypeFilter === 'theory') return 'سجل النظري فقط';
    if (selectedTypeFilter === 'practical') return 'سجل العملي / المختبر';
    return 'مسار محدد';
  }, [selectedTypeFilter]);

  // 📆 استخراج تاريخ انطلاق الفصل الدراسي المعتمد للقسم (مسار بولونيا)
  const effectiveStartDate = useMemo(() => {
    if (typeof window !== 'undefined') {
      const scheduleConfigs = getStoredData<DepartmentScheduleConfig[]>('department_schedule_configs', []);
      const deptCfg = scheduleConfigs.find(
        (c) => c.department_id === departmentId && c.start_date && c.start_date.trim() !== ''
      );
      if (deptCfg?.start_date) return deptCfg.start_date;
      const anyWithDate = scheduleConfigs.find((c) => c.start_date && c.start_date.trim() !== '');
      if (anyWithDate?.start_date) return anyWithDate.start_date;
    }
    return '2026-09-20';
  }, [departmentId]);

  // ⚡ احتساب الأسبوع الأكاديمي الحالي التلقائي نسبة لتاريخ اليوم الفعلي
  const currentAcademicWeek = useMemo(() => {
    return getCurrentAcademicWeek(effectiveStartDate);
  }, [effectiveStartDate]);

  // 🏷️ قراءة اسم المادة المختارة للفلتر
  const selectedCourseLabel = useMemo(() => {
    if (selectedCourseId === 'all') return `كافة المواد الدراسية (${semesterCourses.length})`;
    const found = semesterCourses.find((c) => c.id === selectedCourseId);
    return found ? `${found.name} (${found.code})` : 'مادة محددة';
  }, [selectedCourseId, semesterCourses]);

  // 🏷️ قراءة اسم الأسبوع المختار للفلتر مع التاريخ المحسوب وشارة الأسبوع الحالي
  const selectedWeekLabel = useMemo(() => {
    if (selectedWeek === 'all') return 'كافة الأسابيع (1 - 15)';
    const wNum = parseInt(selectedWeek, 10);
    const weekSaturdayDate = calculateDateForAnyDayInWeek(effectiveStartDate, 1, wNum, 'saturday');
    const dParts = weekSaturdayDate.split('-');
    const dayNum = dParts.length === 3 ? parseInt(dParts[2], 10) : '';
    const monthName = dParts.length === 3 ? (IRAQI_ARABIC_MONTHS[parseInt(dParts[1], 10) - 1] || '') : '';
    const isCurr = currentAcademicWeek === wNum;
    return `الأسبوع ${wNum} (${dayNum} ${monthName})${isCurr ? ' — الأسبوع الحالي' : ''}`;
  }, [selectedWeek, effectiveStartDate, currentAcademicWeek]);

  // 🏷️ قراءة اسم الحالة المختارة للفلتر
  const selectedStatusLabel = useMemo(() => {
    if (selectedStatus === 'all') return 'كافة الحالات';
    if (selectedStatus === 'present') return 'حاضر فقط';
    if (selectedStatus === 'absent_unexcused') return 'غائب بدون عذر';
    if (selectedStatus === 'absent_excused') return 'مجاز بعذر رسمي';
    if (selectedStatus === 'late') return 'متأخر عن المحاضرة';
    if (selectedStatus === 'holiday') return 'عطلة رسمية';
    return 'حالة محددة';
  }, [selectedStatus]);

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* 🌟 1. الهيدر العام للوحة حضور الطالب */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="px-3.5 py-1.5 bg-indigo-50 border-2 border-indigo-200 text-indigo-950 text-xs sm:text-sm font-black rounded-2xl flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-4 h-4 text-indigo-700 shrink-0" />
              <span>نظام تتبع الحضور والغيابات — مسار بولونيا</span>
            </span>
            
            {/* أزرار التبديل السريع بين الكورس الأول والثاني */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border-2 border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setCurrentSemester(1)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer select-none ${
                  currentSemester === 1
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-800 hover:text-slate-950 hover:bg-slate-200'
                }`}
              >
                الكورس الأول
              </button>
              <button
                type="button"
                onClick={() => setCurrentSemester(2)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer select-none ${
                  currentSemester === 2
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-800 hover:text-slate-950 hover:bg-slate-200'
                }`}
              >
                الكورس الثاني
              </button>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-950 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#0F2942] text-white flex items-center justify-center shrink-0 shadow-md">
              <ClipboardList className="w-6 h-6 text-cyan-300" />
            </div>
            <span>متابعة الحضور والغيابات والإجازات الرسمية</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 font-bold mt-1.5 leading-relaxed">
            سجل إلكتروني معتمد لكل المواد والمحاضرات مع التنبيه التلقائي لحدود الإنذارات والحرمان الأكاديمي لمسار بولونيا
          </p>
        </div>

        {/* 🎛️ أزرار الإجراءات السريعة للطالب */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          
          {/* 📑 تقديم عذر رسمي */}
          <button
            type="button"
            onClick={() => setIsExcuseModalOpen(true)}
            className="px-4 py-3 bg-[#0F2942] hover:bg-[#163a5f] active:scale-95 text-white rounded-2xl font-black text-sm sm:text-base transition-all shadow-sm flex items-center gap-2 cursor-pointer border-2 border-[#1e4570]"
            title="تقديم طلب إجازة أو تقرير طبي رسمي"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300 shrink-0" />
            <span>تقديم عذر رسمي</span>
          </button>

          {/* 🎛️ أزرار التبديل بين أنماط العرض */}
          <div className="bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-200 flex items-center gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveViewMode('summary')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer select-none ${
                activeViewMode === 'summary'
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'text-slate-800 hover:text-black hover:bg-slate-200'
              }`}
            >
              موقف المواد
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('table')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer select-none ${
                activeViewMode === 'table'
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'text-slate-800 hover:text-black hover:bg-slate-200'
              }`}
            >
              السجل التفصيلي
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('excuses')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer select-none ${
                activeViewMode === 'excuses'
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'text-slate-800 hover:text-black hover:bg-slate-200'
              }`}
            >
              الإجازات ({excuseRequests.length})
            </button>
          </div>

        </div>
      </div>

      {/* ⚠️ 2. شريط التنبيه الحرج إذا كان هناك إنذار أو حرمان في أي مادة */}
      {alertCourses.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 p-5 rounded-3xl shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-center gap-3 text-rose-950 font-black text-base sm:text-lg">
            <AlertTriangle className="w-6 h-6 text-rose-700 shrink-0 animate-bounce" />
            <span>تنبيه أكاديمي هام: تجاوزت حاجز الغياب القانوني في ({alertCourses.length}) مادة دراسية!</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {alertCourses.map((c) => {
              const meta = getAttendanceWarningBadgeMeta(c.warning_status);
              return (
                <div key={c.course_id} className="bg-white p-4 rounded-2xl border-2 border-rose-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-slate-950 text-base">{c.course_name}</h4>
                    <span className="text-xs font-bold text-slate-600 block mt-0.5">{c.course_code}</span>
                    <div className="text-xs font-black text-rose-800 mt-1">
                      نسبة الغياب: <span className="font-mono text-sm">{c.absence_percentage}%</span> ({c.total_unexcused_absence_hours} ساعة)
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-black border ${meta.badgeClass}`}>
                    {meta.label_ar}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1️⃣ العرض الأول: بطاقات ملخص موقف الحضور والغياب لجميع المواد */}
      {/* ========================================================================= */}
      {activeViewMode === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in fade-in duration-150">
          {courseSummaries.map((summary) => {
            const course = courses.find((c) => c.id === summary.course_id);
            const meta = getAttendanceWarningBadgeMeta(summary.warning_status);
            const progressWidth = Math.min(100, (summary.absence_percentage / 12) * 100);

            return (
              <div
                key={summary.course_id}
                className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 border-b-2 border-slate-100 pb-3.5">
                    <div>
                      <span className="px-3 py-1 bg-slate-100 text-slate-800 text-sm font-mono font-black rounded-xl">
                        {summary.course_code}
                      </span>
                      <h4 className="text-lg sm:text-xl font-black text-slate-950 mt-1 leading-tight">
                        {summary.course_name}
                      </h4>
                    </div>

                    <span className={`px-3.5 py-1.5 rounded-xl text-sm font-black border ${meta.badgeClass} shrink-0`}>
                      {meta.label_ar}
                    </span>
                  </div>

                  {/* شريط نسبة الغياب وحواجز الإنذار لمسار بولونيا */}
                  <div className="space-y-2 pt-3">
                    <div className="flex items-center justify-between text-sm sm:text-base font-black">
                      <span className="text-slate-800">إجمالي الغياب غير المبرر:</span>
                      <span className={`font-black font-mono text-base ${
                        summary.absence_percentage >= 10 ? 'text-rose-700' : summary.absence_percentage >= 5 ? 'text-sky-700' : 'text-emerald-700'
                      }`}>
                        {summary.absence_percentage}% ({summary.total_unexcused_absence_hours} س من {summary.total_scheduled_hours} س)
                      </span>
                    </div>

                    {/* شريط التقدم المرئي */}
                    <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden relative border border-slate-300 shadow-inner">
                      {/* خط مؤشر الإنذار الأولي 5% */}
                      <div className="absolute top-0 bottom-0 left-[41.6%] w-0.5 bg-sky-500 z-10" title="حد الإنذار الأولي 5%" />
                      {/* خط مؤشر الإنذار النهائي 7% */}
                      <div className="absolute top-0 bottom-0 left-[58.3%] w-0.5 bg-rose-500 z-10" title="حد الإنذار النهائي 7%" />
                      {/* خط مؤشر الحرمان 10% */}
                      <div className="absolute top-0 bottom-0 left-[83.3%] w-0.5 bg-red-600 z-10" title="حد الحرمان 10%" />

                      <div
                        className={`h-full transition-all duration-500 ${
                          summary.absence_percentage >= 10
                            ? 'bg-red-600'
                            : summary.absence_percentage >= 7
                            ? 'bg-rose-500'
                            : summary.absence_percentage >= 5
                            ? 'bg-sky-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-black text-slate-600">
                      <span>0%</span>
                      <span className="text-sky-700">إنذار 1 (5%)</span>
                      <span className="text-rose-700">إنذار 2 (7%)</span>
                      <span className="text-rose-900">حرمان (10%)</span>
                    </div>
                  </div>

                  {/* 🔬 تفصيل ساعات النظري وساعات العملي المنفصلة مع اسم أستاذ كل مسار */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3">
                    <div className="bg-blue-50/80 p-3 rounded-2xl border border-blue-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-blue-950">
                          <BookOpen className="w-4 h-4 text-blue-700 shrink-0" />
                          <span>ساعات النظري (Theory)</span>
                        </div>
                        <span className="text-[11px] font-black text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded-md truncate max-w-[130px]" title={course?.theory_teacher_name || 'أستاذ النظري'}>
                          👨‍🏫 {course?.theory_teacher_name || 'أستاذ النظري'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-700">
                        حضور: <strong className="text-emerald-700 font-mono text-sm">{summary.theory_present_hours ?? 0} س</strong> • غياب: <strong className="text-rose-700 font-mono text-sm">{summary.theory_absence_hours ?? 0} س</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        المقرر: {summary.theory_scheduled_hours ?? 0} ساعة
                      </div>
                    </div>

                    <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                          <Layers className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>ساعات العملي (Lab)</span>
                        </div>
                        {course?.has_practical && (
                          <span className="text-[11px] font-black text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded-md truncate max-w-[130px]" title={course?.practical_teacher_name || 'أستاذ العملي'}>
                            🔬 {course?.practical_teacher_name || 'أستاذ العملي'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-700">
                        حضور: <strong className="text-emerald-700 font-mono text-sm">{summary.practical_present_hours ?? 0} س</strong> • غياب: <strong className="text-rose-700 font-mono text-sm">{summary.practical_absence_hours ?? 0} س</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        المقرر: {summary.practical_scheduled_hours ?? 0} ساعة
                      </div>
                    </div>
                  </div>

                  {/* عدادات الجلسات للمادة */}
                  <div className="grid grid-cols-4 gap-2 pt-3 text-center">
                    <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-200">
                      <div className="text-xs font-black text-emerald-800">حاضر</div>
                      <div className="text-lg font-black text-emerald-950 mt-0.5 font-mono">{summary.present_count}</div>
                    </div>
                    <div className="bg-rose-50 p-2.5 rounded-2xl border border-rose-200">
                      <div className="text-xs font-black text-rose-800">غائب</div>
                      <div className="text-lg font-black text-rose-950 mt-0.5 font-mono">{summary.absent_unexcused_count}</div>
                    </div>
                    <div className="bg-blue-50 p-2.5 rounded-2xl border border-blue-200">
                      <div className="text-xs font-black text-blue-800">إجازة</div>
                      <div className="text-lg font-black text-blue-950 mt-0.5 font-mono">{summary.absent_excused_count}</div>
                    </div>
                    <div className="bg-slate-100 p-2.5 rounded-2xl border border-slate-300">
                      <div className="text-xs font-black text-slate-700">متأخر</div>
                      <div className="text-lg font-black text-slate-950 mt-0.5 font-mono">{summary.late_count}</div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCourseId(summary.course_id);
                    setActiveViewMode('table');
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-95 mt-2"
                >
                  <ClipboardList className="w-4 h-4 text-cyan-300" />
                  <span>عرض السجل التفصيلي للمادة</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2️⃣ العرض الثاني: الجدول التفصيلي لجلسات وسجلات الحضور */}
      {/* ========================================================================= */}
      {activeViewMode === 'table' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* شريط الفلاتر والقوائم المنسدلة الاحترافية */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-slate-950 flex items-center gap-2">
                <Filter className="w-5 h-5 text-[#0F2942]" />
                <span>تصفية سجلات الحضور:</span>
              </span>
              <span className="text-sm font-bold text-slate-600">
                المعروض: <strong className="font-mono text-slate-950 text-base">({filteredRecords.length})</strong> جلسة
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
              
              {/* 1. فلتر المادة الدراسية (قائمة منسدلة مخصصة) */}
              <div className="space-y-1 relative" ref={courseDropdownRef}>
                <label className="block text-sm font-black text-slate-800">المادة الدراسية:</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCourseDropdownOpen(!isCourseDropdownOpen);
                    setIsWeekDropdownOpen(false);
                    setIsStatusDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 hover:bg-white border-2 rounded-2xl text-sm font-black text-slate-950 flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right ${
                    isCourseDropdownOpen ? 'border-[#0F2942] ring-2 ring-[#0F2942]/20' : 'border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <BookOpen className="w-4 h-4 text-blue-700 shrink-0" />
                    <span className="truncate">{selectedCourseLabel}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${isCourseDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                </button>

                {isCourseDropdownOpen && (
                  <div className="absolute top-full right-0 left-0 mt-2 bg-white border-2 border-slate-300 rounded-2xl shadow-xl z-50 p-2 space-y-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCourseId('all');
                        setIsCourseDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                        selectedCourseId === 'all' ? 'bg-[#0F2942] text-white' : 'text-slate-950 hover:bg-slate-100'
                      }`}
                    >
                      <span>كافة المواد الدراسية ({semesterCourses.length})</span>
                      {selectedCourseId === 'all' && <Check className="w-4 h-4 text-cyan-300" />}
                    </button>
                    {semesterCourses.map((c) => {
                      const isSel = selectedCourseId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCourseId(c.id);
                            setIsCourseDropdownOpen(false);
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                            isSel ? 'bg-[#0F2942] text-white' : 'text-slate-950 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{c.name} ({c.code})</span>
                          {isSel && <Check className="w-4 h-4 text-cyan-300" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. فلتر الأسبوع الدراسي (قائمة منسدلة مخصصة) */}
              <div className="space-y-1 relative" ref={weekDropdownRef}>
                <label className="block text-sm font-black text-slate-800">الأسبوع الدراسي:</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsWeekDropdownOpen(!isWeekDropdownOpen);
                    setIsCourseDropdownOpen(false);
                    setIsStatusDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 hover:bg-white border-2 rounded-2xl text-sm font-black text-slate-950 flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right ${
                    isWeekDropdownOpen ? 'border-[#0F2942] ring-2 ring-[#0F2942]/20' : 'border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Calendar className="w-4 h-4 text-indigo-700 shrink-0" />
                    <span className="truncate">{selectedWeekLabel}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${isWeekDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                </button>

                {isWeekDropdownOpen && (
                  <div className="absolute top-full right-0 left-0 mt-2 bg-white border-2 border-slate-300 rounded-2xl shadow-xl z-50 p-2 space-y-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWeek('all');
                        setIsWeekDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                        selectedWeek === 'all' ? 'bg-[#0F2942] text-white' : 'text-slate-950 hover:bg-slate-100'
                      }`}
                    >
                      <span>كافة الأسابيع (1 - 15)</span>
                      {selectedWeek === 'all' && <Check className="w-4 h-4 text-cyan-300" />}
                    </button>
                    {BOLOGNA_SEMESTER_WEEKS.map((w) => {
                      const isSel = selectedWeek === w.week.toString();
                      const isCurr = currentAcademicWeek === w.week;
                      const weekSaturdayDate = calculateDateForAnyDayInWeek(effectiveStartDate, 1, w.week, 'saturday');
                      const dParts = weekSaturdayDate.split('-');
                      const dayNum = dParts.length === 3 ? parseInt(dParts[2], 10) : '';
                      const monthName = dParts.length === 3 ? (IRAQI_ARABIC_MONTHS[parseInt(dParts[1], 10) - 1] || '') : '';

                      return (
                        <button
                          key={w.week}
                          type="button"
                          onClick={() => {
                            setSelectedWeek(w.week.toString());
                            setIsWeekDropdownOpen(false);
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                            isSel ? 'bg-[#0F2942] text-white' : 'text-slate-950 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>الأسبوع {w.week}</span>
                            <span className={`text-xs ${isSel ? 'text-cyan-200' : 'text-slate-500'}`}>
                              ({dayNum} {monthName})
                            </span>
                            {isCurr && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                isSel ? 'bg-cyan-400 text-slate-950 border-cyan-300' : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                              }`}>
                                الحالي
                              </span>
                            )}
                          </div>
                          {isSel && <Check className="w-4 h-4 text-cyan-300" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. فلتر حالة الحضور (قائمة منسدلة مخصصة) */}
              <div className="space-y-1 relative" ref={statusDropdownRef}>
                <label className="block text-sm font-black text-slate-800">حالة الحضور:</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsStatusDropdownOpen(!isStatusDropdownOpen);
                    setIsCourseDropdownOpen(false);
                    setIsWeekDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 hover:bg-white border-2 rounded-2xl text-sm font-black text-slate-950 flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right ${
                    isStatusDropdownOpen ? 'border-[#0F2942] ring-2 ring-[#0F2942]/20' : 'border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate">{selectedStatusLabel}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${isStatusDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                </button>

                {isStatusDropdownOpen && (
                  <div className="absolute top-full right-0 left-0 mt-2 bg-white border-2 border-slate-300 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    {[
                      { key: 'all', label: 'كافة الحالات', icon: <Layers className="w-4 h-4 text-slate-700" /> },
                      { key: 'present', label: 'حاضر فقط', icon: <CheckCircle2 className="w-4 h-4 text-emerald-700" /> },
                      { key: 'absent_unexcused', label: 'غائب بدون عذر', icon: <XCircle className="w-4 h-4 text-rose-700" /> },
                      { key: 'absent_excused', label: 'مجاز بعذر رسمي', icon: <FileText className="w-4 h-4 text-blue-700" /> },
                      { key: 'late', label: 'متأخر عن المحاضرة', icon: <Timer className="w-4 h-4 text-slate-700" /> },
                      { key: 'holiday', label: 'عطلة رسمية', icon: <Palmtree className="w-4 h-4 text-sky-700" /> },
                    ].map((st) => {
                      const isSel = selectedStatus === st.key;
                      return (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => {
                            setSelectedStatus(st.key);
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                            isSel ? 'bg-[#0F2942] text-white' : 'text-slate-950 hover:bg-slate-100'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {st.icon}
                            <span>{st.label}</span>
                          </span>
                          {isSel && <Check className="w-4 h-4 text-cyan-300" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. فلتر المسار التدريسي (نظري / عملي ومختبر) */}
              <div className="space-y-1 relative" ref={typeDropdownRef}>
                <label className="block text-sm font-black text-slate-800">المسار التدريسي:</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsTypeDropdownOpen(!isTypeDropdownOpen);
                    setIsCourseDropdownOpen(false);
                    setIsWeekDropdownOpen(false);
                    setIsStatusDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 hover:bg-white border-2 rounded-2xl text-sm font-black text-slate-950 flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right ${
                    isTypeDropdownOpen ? 'border-[#0F2942] ring-2 ring-[#0F2942]/20' : 'border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <BookOpen className="w-4 h-4 text-blue-700 shrink-0" />
                    <span className="truncate">{selectedTypeLabel}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${isTypeDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                </button>

                {isTypeDropdownOpen && (
                  <div className="absolute top-full right-0 left-0 mt-2 bg-white border-2 border-slate-300 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    {[
                      { key: 'all', label: 'كافة المسارات (نظري وعملي)', icon: <Layers className="w-4 h-4 text-slate-700" /> },
                      { key: 'theory', label: 'سجل النظري فقط', icon: <BookOpen className="w-4 h-4 text-blue-700" /> },
                      { key: 'practical', label: 'سجل العملي / المختبر', icon: <FlaskConical className="w-4 h-4 text-emerald-700" /> },
                    ].map((t) => {
                      const isSel = selectedTypeFilter === t.key;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => {
                            setSelectedTypeFilter(t.key as 'all' | 'theory' | 'practical');
                            setIsTypeDropdownOpen(false);
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                            isSel ? 'bg-[#0F2942] text-white' : 'text-slate-950 hover:bg-slate-100'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {t.icon}
                            <span>{t.label}</span>
                          </span>
                          {isSel && <Check className="w-4 h-4 text-cyan-300" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* 📋 جدول السجلات التفصيلية */}
          <div className="border-2 border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
            
            {/* ترويسة الجدول الفاخرة */}
            <div className="grid grid-cols-12 bg-slate-100 text-slate-950 border-b-2 border-slate-200 text-sm sm:text-base font-black p-4 text-center items-center">
              <div className="col-span-2 sm:col-span-1">الأسبوع</div>
              <div className="col-span-4 sm:col-span-3 text-right pr-2">المادة الدراسية</div>
              <div className="col-span-3 sm:col-span-2">اليوم والتاريخ</div>
              <div className="hidden sm:block sm:col-span-2">المحاضرة والنوع</div>
              <div className="col-span-3 sm:col-span-2">حالة الحضور</div>
              <div className="hidden sm:block sm:col-span-2 text-left pl-2">العذر والملاحظات</div>
            </div>

            {/* صفوف السجلات */}
            {filteredRecords.length > 0 ? (
              <div className="divide-y-2 divide-slate-200">
                {filteredRecords.map((rec) => {
                  const meta = ATTENDANCE_STATUS_META[rec.status] || ATTENDANCE_STATUS_META.present;

                  return (
                    <div
                      key={rec.id}
                      className={`grid grid-cols-12 items-center p-4 sm:p-5 text-sm sm:text-base font-black hover:bg-slate-50 transition ${
                        rec.status === 'absent_unexcused' ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      {/* الأسبوع */}
                      <div className="col-span-2 sm:col-span-1 text-center font-black">
                        <span className="px-3 py-1 bg-slate-100 text-slate-900 rounded-xl border border-slate-300 font-mono text-sm font-black">
                          أسبوع {rec.week_number}
                        </span>
                      </div>

                      {/* المادة وأستاذ المحاضرة المسجل */}
                      <div className="col-span-4 sm:col-span-3 text-right pr-2">
                        <h5 className="font-black text-slate-950 leading-tight text-base sm:text-lg">{rec.course_name}</h5>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-xs font-bold text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {rec.course_code}
                          </span>
                          <span className="text-xs font-black text-blue-950 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 flex items-center gap-1 shadow-2xs">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span>الأستاذ: {rec.recorded_by_teacher_name || 'أستاذ المادة'}</span>
                          </span>
                        </div>
                      </div>

                      {/* اليوم والتاريخ */}
                      <div className="col-span-3 sm:col-span-2 text-center">
                        <div className="font-black text-slate-950 font-mono text-sm sm:text-base">{rec.date}</div>
                        <div className="text-xs font-bold text-slate-600 mt-0.5">{rec.day}</div>
                      </div>

                      {/* التوقيت والنوع والمحاضرة */}
                      <div className="hidden sm:block sm:col-span-2 text-center">
                        <div className="text-slate-950 font-black font-mono text-xs sm:text-sm">{rec.start_time} - {rec.end_time}</div>
                        <div className="text-xs font-black text-indigo-700 font-bold mt-1 flex items-center justify-center gap-1">
                          <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-lg">
                            {rec.lecture_type === 'practical'
                              ? (rec.lecture_slot === 2 ? 'مختبر 2' : 'مختبر 1')
                              : (rec.lecture_slot === 2 ? 'محاضرة 2' : 'محاضرة 1')}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-slate-800 font-bold border border-slate-200">
                            {rec.lecture_type === 'practical' ? 'عملي / مختبر' : 'نظري'} • {rec.duration_hours === 1 ? '1 س' : rec.duration_hours === 1.5 ? '1.5 س' : `${rec.duration_hours || 1.5} س`}
                          </span>
                        </div>
                      </div>

                      {/* حالة الحضور الملونة مع أيقونات SVG كاملة */}
                      <div className="col-span-3 sm:col-span-2 text-center">
                        <span className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-black inline-flex items-center gap-2 ${meta.badgeBg} ${meta.badgeText} shadow-2xs border`}>
                          {rec.status === 'present' && <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />}
                          {rec.status === 'absent_unexcused' && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                          {rec.status === 'absent_excused' && <FileText className="w-4 h-4 text-blue-700 shrink-0" />}
                          {rec.status === 'late' && <Timer className="w-4 h-4 text-slate-700 shrink-0" />}
                          {rec.status === 'holiday' && <Sun className="w-4 h-4 text-sky-600 shrink-0" />}
                          <span>{meta.label_ar}</span>
                        </span>
                      </div>

                      {/* العذر والملاحظات */}
                      <div className="hidden sm:block sm:col-span-2 text-left pl-2 text-xs sm:text-sm font-black">
                        {rec.excuse_reason && (
                          <div className="text-blue-900 font-bold leading-tight">
                            📄 {rec.excuse_reason}
                            {rec.excuse_document_ref && (
                              <span className="block text-xs font-bold text-slate-600 mt-0.5 font-mono">({rec.excuse_document_ref})</span>
                            )}
                          </div>
                        )}
                        {rec.late_minutes && (
                          <div className="text-slate-700 font-bold font-mono">⏱️ تأخر {rec.late_minutes} دقيقة</div>
                        )}
                        {rec.notes && !rec.excuse_reason && (
                          <div className="text-slate-700 font-bold">{rec.notes}</div>
                        )}
                        {!rec.excuse_reason && !rec.notes && !rec.late_minutes && (
                          <span className="text-slate-400 font-bold">-</span>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-14 text-center space-y-2 bg-slate-50">
                <Info className="w-12 h-12 text-slate-400 mx-auto" />
                <h4 className="text-lg font-black text-slate-900">لا توجد سجلات تطابق خيارات التصفية</h4>
                <p className="text-sm text-slate-600 font-bold">
                  جرّب تغيير المادة الدراسية أو الأسبوع أو إظهار كافة الحالات
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3️⃣ العرض الثالث: قائمة وموقف طلبات الإجازات والأعذار الرسمية */}
      {/* ========================================================================= */}
      {activeViewMode === 'excuses' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-700" />
              <span>طلبات الإجازات والأعذار الرسمية المقدمة: ({excuseRequests.length})</span>
            </h3>

            <button
              type="button"
              onClick={() => setIsExcuseModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 shadow-xs border border-indigo-500"
            >
              <Send className="w-4 h-4 text-cyan-200" />
              <span>تقديم طلب جديد 📝</span>
            </button>
          </div>

          <div className="border-2 border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
            <div className="grid grid-cols-12 bg-slate-100 text-slate-950 border-b-2 border-slate-200 text-xs sm:text-sm font-black p-4 text-center items-center">
              <div className="col-span-1">#</div>
              <div className="col-span-4 sm:col-span-3 text-right pr-2">المادة الدراسية</div>
              <div className="col-span-2">الأسبوع والتاريخ</div>
              <div className="col-span-3 sm:col-span-4 text-right pr-2">تفاصيل العذر والمرجع</div>
              <div className="col-span-2">حالة الطلب</div>
            </div>

            <div className="divide-y-2 divide-slate-200">
              {excuseRequests.map((req, idx) => (
                <div key={req.id} className="grid grid-cols-12 items-center p-4 text-xs sm:text-sm font-black hover:bg-slate-50 transition">
                  <div className="col-span-1 text-center font-bold text-slate-700 font-mono">{idx + 1}</div>
                  
                  <div className="col-span-4 sm:col-span-3 text-right pr-2">
                    <h5 className="font-black text-slate-950 leading-tight text-sm sm:text-base">{req.course_name}</h5>
                    <span className="text-xs font-bold text-slate-600 block mt-0.5 font-mono">{req.course_code}</span>
                  </div>

                  <div className="col-span-2 text-center">
                    <span className="px-2.5 py-1 bg-slate-100 font-bold text-slate-900 rounded-xl block text-xs font-mono">
                      أسبوع {req.week_number}
                    </span>
                    <span className="text-xs font-bold text-slate-600 block mt-1 font-mono">{req.date}</span>
                  </div>

                  <div className="col-span-3 sm:col-span-4 text-right pr-2 space-y-1">
                    <p className="font-bold text-slate-900 leading-snug">{req.reason_details}</p>
                    <span className="text-xs font-bold text-slate-600 block font-mono">📄 {req.document_reference}</span>
                    {req.review_notes && (
                      <span className="text-xs font-bold text-indigo-700 block">💡 ملاحظة اللجنة: {req.review_notes}</span>
                    )}
                  </div>

                  <div className="col-span-2 text-center">
                    <span className={`px-3 py-1.5 rounded-2xl text-xs font-black inline-block border ${
                      req.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : req.status === 'rejected'
                        ? 'bg-rose-100 text-rose-900 border-rose-300'
                        : 'bg-blue-50 text-blue-950 border-blue-200'
                    }`}>
                      {req.status === 'approved' ? 'مقبول ✅' : req.status === 'rejected' ? 'مرفوض ❌' : 'قيد المراجعة ⏳'}
                    </span>
                  </div>
                </div>
              ))}

              {excuseRequests.length === 0 && (
                <div className="p-12 text-center text-slate-600 text-xs sm:text-sm font-bold bg-slate-50">
                  لم تقدم أي طلبات إجازة رسمية حتى الآن.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 📑 نافذة تقديم عذر رسمي */}
      <ExcuseRequestModal
        isOpen={isExcuseModalOpen}
        onClose={() => setIsExcuseModalOpen(false)}
        studentId={studentId}
        studentName={studentName}
        universityNumber={universityNumber}
        departmentId={departmentId}
        stageNumber={stageNumber}
        courses={semesterCourses}
        onSubmitExcuse={(req) => {
          const all = getStoredData<AttendanceExcuseRequest[]>('excuse_requests', INITIAL_EXCUSE_REQUESTS);
          const updated = [req, ...all];
          saveStoredData('excuse_requests', updated);
          setExcuseRequests((prev) => [req, ...prev]);
          saveExcuseRequestToSupabase(req); // ☁️ رفع طلب العذر إلى سحابة Supabase فوراً
        }}
      />

    </div>
  );
}
