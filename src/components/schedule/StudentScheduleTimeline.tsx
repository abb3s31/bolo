'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🗓️ المكون التفاعلي الحركي الموحد للجدول الأسبوعي والـ Timeline المباشر - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect, useMemo } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والوقت اللحظي
import Image from 'next/image'; // 🖼️ استيراد مكون الصور من نكست لطباعة شعار الجامعة الرسمي
import { createPortal } from 'react-dom'; // 🚪 بورتال لعرض نافذة الطباعة مباشرة على جذر الصفحة
import { DayOfWeek, ScheduleLecture, DepartmentScheduleConfig, LectureColor, UserProfile, Department } from '@/types'; // 🔗 استيراد الأنواع الرسمية
import { getStoredData, INITIAL_PROFILES, INITIAL_DEPARTMENTS } from '@/lib/mock-data'; // 💾 قراءة بيانات المستخدمين والأقسام الفعلية بالمتصفح
import {
  DAYS_OF_WEEK_LIST,
  LECTURE_COLOR_THEMES,
  LECTURE_TYPE_LABELS,
  timeStringToMinutes,
  minutesToTimeString,
  getTodayDayOfWeek,
  getLectureLiveStatus,
  getLectureProgressPercentage,
  getScheduleConfigOrDefault,
} from '@/lib/schedule-utils'; // 🕒 دوال حسابات الجدول
import {
  Clock,
  Calendar,
  Sparkles,
  MapPin,
  User,
  BookOpen,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sun,
  Moon,
  Radio,
  Printer,
  Building2,
  FlaskConical,
  UserCheck,
  CalendarDays,
  X, // ❌ أيقونة إغلاق نافذة المعاينة والطباعة
} from 'lucide-react'; // 🎨 أيقونات واجهة المستخدم SVG

// 🏷️ واجهة خصائص المكون
interface StudentScheduleTimelineProps {
  departmentId: string;           // 🏢 معرف القسم
  departmentName: string;         // 🏢 اسم القسم بالعربية
  stageNumber: number;            // 🎓 رقم المرحلة (1، 2، 3، 4)
  lectures: ScheduleLecture[];    // 📚 كافة المحاضرات المتاحة
  configs: DepartmentScheduleConfig[]; // ⚙️ إعدادات الدوام والعطل
  initialSemester?: 1 | 2;        // 🗓️ الفصل الدراسي المبدئي
  initialStudyType?: 'morning' | 'evening'; // ☀️🌙 الفترة الدراسية
  showSemesterSwitcher?: boolean; // 🔄 إظهار مبدل الكورس
  departmentHeadName?: string;    // 👤 اسم رئيس القسم الفعلي (اختياري)
  rapporteurName?: string;        // 👤 اسم مقرر القسم الفعلي (اختياري)
}

export default function StudentScheduleTimeline({
  departmentId,
  departmentName,
  stageNumber,
  lectures,
  configs,
  initialSemester = 1,
  initialStudyType = 'morning',
  showSemesterSwitcher = true,
  departmentHeadName,
  rapporteurName,
}: StudentScheduleTimelineProps) {
  // 📌 الحالات
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(initialSemester);
  const [selectedStudyType, setSelectedStudyType] = useState<'morning' | 'evening'>(initialStudyType);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('saturday');
  const [viewMode, setViewMode] = useState<'timeline' | 'weekly'>('timeline');
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number>(0);
  const [currentRealDay, setCurrentRealDay] = useState<DayOfWeek>('saturday');
  const [currentClockString, setCurrentClockString] = useState<string>('');
  const [isMounted, setIsMounted] = useState<boolean>(false); // ⚡ حالة التأكد من تحميل المكون على متصفح العميل
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false); // 🖨️ حالة فتح وإغلاق نافذة المعاينة والطباعة الرسمية

  // ⚡ تفعيل حالة الجاهزية للعميل
  useEffect(() => {
    setIsMounted(true); // 🚀 المكون اشتغل بالمتصفح
  }, []);

  // 🖨️ إضافة وحذف كلاس الطباعة على وسم body لتفعيل عزل الصفحة بـ globals.css
  useEffect(() => {
    if (isPrintModalOpen) {
      document.body.classList.add('print-modal-active'); // 🔒 حجب باقي أجزاء الصفحة ومنع طباعتها
    } else {
      document.body.classList.remove('print-modal-active'); // 🔓 رفع الحجب بعد إغلاق نافذة الطباعة
    }
    return () => {
      document.body.classList.remove('print-modal-active'); // 🧹 تنظيف التأثير عند تفريغ المكون
    };
  }, [isPrintModalOpen]);

  // 🕒 مؤقت حركي حي لتحديث وقت النظام كل ثانية
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      setCurrentTimeMinutes(hours * 60 + minutes);
      setCurrentRealDay(getTodayDayOfWeek());
      setCurrentClockString(
        now.toLocaleTimeString('ar-IQ-u-nu-latn', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };

    updateTime();
    const today = getTodayDayOfWeek();
    setSelectedDay(today);

    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // ⚙️ استخراج إعدادات الدوام والعطل للمرحلة والكورس المختارين
  const activeConfig = useMemo(() => {
    return getScheduleConfigOrDefault(configs, departmentId, stageNumber, selectedSemester);
  }, [configs, departmentId, stageNumber, selectedSemester]);

  // 📚 تصفية المحاضرات الخاصة بالقسم والمرحلة والكورس والفترة المختارين
  const stageLectures = useMemo(() => {
    return lectures.filter(
      (l) =>
        l.department_id === departmentId &&
        l.stage_number === stageNumber &&
        (l.semester || 1) === selectedSemester &&
        (l.study_type || 'morning') === selectedStudyType
    );
  }, [lectures, departmentId, stageNumber, selectedSemester, selectedStudyType]);

  // 🖨️ الأيام المعتمدة لطباعة الجدول الأسبوعي (السبت للخميس، وإذا الجمعة بيها محاضرات تنضاف أوتوماتيك)
  const printScheduleDays = useMemo(() => {
    const hasFriday = stageLectures.some((l) => l.day === 'friday'); // 🔍 فحص هل يوم الجمعة يحتوي على محاضرات
    return hasFriday ? DAYS_OF_WEEK_LIST : DAYS_OF_WEEK_LIST.filter((d) => d.key !== 'friday'); // 🗓️ تجهيز قائمة الأيام
  }, [stageLectures]);

  // 🔢 حساب أكبر عدد محاضرات باليوم الواحد لتحديد عدد أعمدة الجدول المطبوع (أقل شي 4 أعمدة)
  const printMaxSlots = useMemo(() => {
    let max = 4; // 📌 نبدي بـ 4 فترات قياسية
    printScheduleDays.forEach((d) => {
      const count = stageLectures.filter((l) => l.day === d.key).length; // 📊 حساب محاضرات هذا اليوم
      if (count > max) max = count; // 📈 تحديث الحد الأقصى إذا زاد
    });
    return max; // 🎯 إرجاع عدد الأعمدة المطلوب
  }, [printScheduleDays, stageLectures]);

  // 👤 استخراج الاسم الفعلي لرئيس القسم العلمي من البروفايلات أو بيانات القسم
  const resolvedHeadName = useMemo(() => {
    // 1️⃣ إذا ممرر بالخصائص نستعمله مباشرة
    if (departmentHeadName && departmentHeadName.trim() !== '') {
      return departmentHeadName.trim();
    }
    // 2️⃣ البحث الفعلي بالتخزين المحلي
    if (typeof window !== 'undefined') {
      // فحص بيانات القسم المسجلة في departments
      const depts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS);
      const targetDept = depts.find((d) => d.id === departmentId || d.name === departmentName);
      if (targetDept?.head_name && targetDept.head_name.trim() !== '') {
        return targetDept.head_name.trim(); // 🎯 اسم رئيس القسم من سجل القسم
      }
      // فحص حسابات المستخدمين في profiles لدور رئيس القسم
      const profiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
      const headUser = profiles.find((p) => p.role === 'department_head' && (p.department_id === departmentId || p.department_name === departmentName));
      if (headUser?.full_name && headUser.full_name.trim() !== '') {
        return headUser.full_name.trim(); // 🎯 اسم رئيس القسم من سجل البروفايلات
      }
    }
    // 3️⃣ نص بديل رسمي إذا لم يعين
    return 'رئاسة القسم العلمي';
  }, [departmentHeadName, departmentId, departmentName]);

  // 👤 استخراج الاسم الفعلي لمقرر القسم العلمي من البروفايلات أو بيانات القسم
  const resolvedRapporteurName = useMemo(() => {
    // 1️⃣ إذا ممرر بالخصائص نستعمله فوراً
    if (rapporteurName && rapporteurName.trim() !== '') {
      return rapporteurName.trim();
    }
    // 2️⃣ البحث الفعلي بالتخزين المحلي
    if (typeof window !== 'undefined') {
      // فحص بيانات القسم المسجلة في departments
      const depts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS);
      const targetDept = depts.find((d) => d.id === departmentId || d.name === departmentName);
      if (targetDept?.rapporteur_name && targetDept.rapporteur_name.trim() !== '') {
        return targetDept.rapporteur_name.trim(); // 🎯 اسم مقرر القسم من سجل القسم
      }
      // فحص حسابات المستخدمين في profiles لدور مقرر القسم
      const profiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
      const rapUser = profiles.find((p) => p.role === 'rapporteur' && (p.department_id === departmentId || p.department_name === departmentName));
      if (rapUser?.full_name && rapUser.full_name.trim() !== '') {
        return rapUser.full_name.trim(); // 🎯 اسم مقرر القسم من سجل البروفايلات
      }
    }
    // 3️⃣ نص بديل رسمي إذا لم يعين
    return 'مقررية القسم العلمي';
  }, [rapporteurName, departmentId, departmentName]);

  // 🔢 حساب أعداد المحاضرات لكل كورس وفترة
  const sem1Count = useMemo(() => {
    return lectures.filter(
      (l) =>
        l.department_id === departmentId &&
        l.stage_number === stageNumber &&
        (l.semester || 1) === 1 &&
        (l.study_type || 'morning') === selectedStudyType
    ).length;
  }, [lectures, departmentId, stageNumber, selectedStudyType]);

  const sem2Count = useMemo(() => {
    return lectures.filter(
      (l) =>
        l.department_id === departmentId &&
        l.stage_number === stageNumber &&
        (l.semester || 1) === 2 &&
        (l.study_type || 'morning') === selectedStudyType
    ).length;
  }, [lectures, departmentId, stageNumber, selectedStudyType]);

  const morningCount = useMemo(() => {
    return lectures.filter(
      (l) =>
        l.department_id === departmentId &&
        l.stage_number === stageNumber &&
        (l.semester || 1) === selectedSemester &&
        (l.study_type || 'morning') === 'morning'
    ).length;
  }, [lectures, departmentId, stageNumber, selectedSemester]);

  const eveningCount = useMemo(() => {
    return lectures.filter(
      (l) =>
        l.department_id === departmentId &&
        l.stage_number === stageNumber &&
        (l.semester || 1) === selectedSemester &&
        (l.study_type || 'morning') === 'evening'
    ).length;
  }, [lectures, departmentId, stageNumber, selectedSemester]);

  // 📅 محاضرات اليوم المختار مرتبة تصاعدياً بحسب وقت البدء
  const dayLectures = useMemo(() => {
    return stageLectures
      .filter((l) => l.day === selectedDay)
      .sort((a, b) => timeStringToMinutes(a.start_time) - timeStringToMinutes(b.start_time));
  }, [stageLectures, selectedDay]);

  // 🏖️ هل اليوم المختار عطلة رسمية؟
  const isSelectedDayOff = activeConfig.off_days.includes(selectedDay);
  const isTodayOff = activeConfig.off_days.includes(currentRealDay);

  // 🔴 استخراج المحاضرة الجارية حالياً إن وجدت
  const liveLecture = useMemo(() => {
    if (selectedDay !== currentRealDay || isTodayOff) return null;
    return dayLectures.find((l) => {
      const start = timeStringToMinutes(l.start_time);
      const end = timeStringToMinutes(l.end_time);
      return currentTimeMinutes >= start && currentTimeMinutes < end;
    }) || null;
  }, [dayLectures, selectedDay, currentRealDay, isTodayOff, currentTimeMinutes]);

  // ⏳ استخراج المحاضرة القادمة إن وجدت
  const nextUpcomingLecture = useMemo(() => {
    if (selectedDay !== currentRealDay || isTodayOff) return null;
    return dayLectures.find((l) => timeStringToMinutes(l.start_time) > currentTimeMinutes) || null;
  }, [dayLectures, selectedDay, currentRealDay, isTodayOff, currentTimeMinutes]);

  return (
    <div className="bg-white border-2 border-slate-200 rounded-3xl shadow-sm font-sans animate-in fade-in duration-200">
      
      {/* 🧭 1. شريط التحكم والهيدر الرئيسي الموحد الثابت أعلى الكارد */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 space-y-4 p-5 sm:p-6 shadow-xs rounded-t-3xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-[#0F2942] font-black text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-4 h-4 text-blue-700" />
                <span>الجدول الأكاديمي والمخطط الزمني</span>
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-900 border border-slate-300 font-black text-sm rounded-xl">
                المرحلة {stageNumber} — قسم {departmentName}
              </span>
              <span className={`px-3 py-1 rounded-xl text-sm font-black border flex items-center gap-1.5 ${
                selectedStudyType === 'evening'
                  ? 'bg-indigo-50 text-indigo-950 border-indigo-200'
                  : 'bg-sky-50 text-sky-950 border-sky-300'
              }`}>
                {selectedStudyType === 'evening' ? (
                  <Moon className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Sun className="w-4 h-4 text-sky-600" />
                )}
                <span>{selectedStudyType === 'evening' ? 'الدراسة المسائية' : 'الدراسة الصباحية'}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-[#0F2942]" />
              <span>مواقيت المحاضرات والمسار الزمني الأكاديمي</span>
            </h2>
          </div>

          {/* ⌚ الساعة ومحدد نمط العرض */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <div className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl flex items-center gap-2.5 shadow-2xs">
              <Clock className="w-5 h-5 text-[#0F2942] shrink-0" />
              <div className="text-right">
                <div className="text-xs font-black text-slate-700 leading-none">توقيت ميسان الحي</div>
                <div className="text-base font-black text-emerald-800 font-mono leading-tight mt-0.5">
                  {currentClockString || '08:30:00 ص'}
                </div>
              </div>
            </div>

            {/* 🎛️ أزرار نمط العرض (المخطط الزمني / الجدول الأسبوعي) بتصميم موحد وفخم */}
            <div className="flex items-center bg-slate-100 p-1.5 border border-slate-300 rounded-2xl gap-1">
              {/* 🕒 زر المخطط الزمني بتصميم كحلي فاخر مطابق لزر الجدول الأسبوعي */}
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`px-4 py-2 rounded-xl text-base font-black transition flex items-center gap-2 cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-black'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>المخطط الزمني</span>
              </button>
              {/* 🗓️ زر الجدول الأسبوعي بلون الهوية الملكي #0F2942 */}
              <button
                type="button"
                onClick={() => setViewMode('weekly')}
                className={`px-4 py-2 rounded-xl text-base font-black transition flex items-center gap-2 cursor-pointer ${
                  viewMode === 'weekly'
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-black'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>الجدول الأسبوعي</span>
              </button>
            </div>
          </div>
        </div>

        {/* 🔄 أزرار تبديل الكورس والفترة الدراسية مع الشارات والعدادات بتصميم موحد تماماً */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
          {showSemesterSwitcher && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-black text-slate-800">الفصل الدراسي:</span>
              <div className="flex items-center bg-slate-100 p-1 border border-slate-300 rounded-2xl gap-1">
                {/* 📘 زر الكورس الأول بتصميم مطابق تماماً لزر الجدول الأسبوعي #0F2942 */}
                <button
                  type="button"
                  onClick={() => setSelectedSemester(1)}
                  className={`px-4 py-1.5 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-2 ${
                    selectedSemester === 1
                      ? 'bg-[#0F2942] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white hover:text-black'
                  }`}
                >
                  <span>الكورس الأول</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                    selectedSemester === 1
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {sem1Count}
                  </span>
                </button>
                {/* 📗 زر الكورس الثاني بتصميم مطابق تماماً لزر الجدول الأسبوعي #0F2942 */}
                <button
                  type="button"
                  onClick={() => setSelectedSemester(2)}
                  className={`px-4 py-1.5 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-2 ${
                    selectedSemester === 2
                      ? 'bg-[#0F2942] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white hover:text-black'
                  }`}
                >
                  <span>الكورس الثاني</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                    selectedSemester === 2
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {sem2Count}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* محدد الفترة الصباحي / المسائي بتصميم مطابق تماماً لزر الجدول الأسبوعي */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-black text-slate-800">الفترة:</span>
            <div className="flex items-center bg-slate-100 p-1 border border-slate-300 rounded-2xl gap-1">
              {/* ☀️ زر الفترة الصباحية بتصميم كحلي فاخر مطابق لزر الجدول الأسبوعي #0F2942 */}
              <button
                type="button"
                onClick={() => setSelectedStudyType('morning')}
                className={`px-4 py-1.5 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-2 ${
                  selectedStudyType === 'morning'
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-black'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>الصباحي</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                  selectedStudyType === 'morning'
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}>
                  {morningCount}
                </span>
              </button>
              {/* 🌙 زر الفترة المسائية بتصميم كحلي فاخر مطابق لزر الجدول الأسبوعي #0F2942 */}
              <button
                type="button"
                onClick={() => setSelectedStudyType('evening')}
                className={`px-4 py-1.5 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-2 ${
                  selectedStudyType === 'evening'
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-black'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>المسائي</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                  selectedStudyType === 'evening'
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}>
                  {eveningCount}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🗓️ 2. شريط أزرار أيام الأسبوع الـ 7 الموحد والمتناسق تماماً */}
      <div className="p-3 sm:p-4 bg-slate-50/80 border-b border-slate-200">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
          {DAYS_OF_WEEK_LIST.map((d) => {
            const isSelected = selectedDay === d.key;
            const isToday = currentRealDay === d.key;
            const isOffDay = activeConfig.off_days.includes(d.key);
            const dayLecturesCount = stageLectures.filter((l) => l.day === d.key).length;

            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setSelectedDay(d.key)}
                className={`h-20 sm:h-22 p-2 sm:p-2.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-between text-center cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/20'
                    : isOffDay
                    ? 'bg-slate-100/90 border-slate-200 text-slate-700 hover:bg-slate-200/80'
                    : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <div className="flex flex-col items-center gap-0.5 w-full">
                  {isToday && (
                    <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] sm:text-xs font-black rounded-full shadow-2xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>اليوم</span>
                    </span>
                  )}
                  <span className={`text-xs sm:text-base font-black truncate w-full ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                    {d.label_ar}
                  </span>
                </div>

                <div className="w-full flex justify-center">
                  {isOffDay ? (
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black inline-flex items-center gap-1 truncate ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      <Sun className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>عطلة</span>
                    </span>
                  ) : (
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black truncate border ${
                        isSelected
                          ? 'bg-white/20 text-white border-white/20'
                          : dayLecturesCount > 0
                          ? 'bg-blue-50 text-blue-950 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {dayLecturesCount > 0 ? `${dayLecturesCount} محاضرات` : 'فارغ'}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🔴 3. بطاقة المحاضرة الجارية الآن (إن وجدت) */}
      {selectedDay === currentRealDay && liveLecture && (
        <div className="p-5 sm:p-6 bg-rose-50 border-b border-rose-200 text-slate-900 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3.5 bg-rose-100 border border-rose-300 text-rose-700 rounded-2xl flex items-center justify-center">
                <Radio className="w-6 h-6 text-rose-600 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1 bg-rose-600 text-white font-black text-xs sm:text-sm rounded-full flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>جارية الآن</span>
                  </span>
                  <span className="text-sm sm:text-base font-black text-rose-950 font-mono">
                    {liveLecture.start_time} - {liveLecture.end_time}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-950 mt-1">
                  {liveLecture.course_name} ({liveLecture.course_code})
                </h3>
                <div className="flex items-center gap-4 text-sm sm:text-base font-black text-slate-800 mt-1">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span>{liveLecture.room}</span>
                  </span>
                  {liveLecture.teacher_name && (
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[#0F2942]" />
                      <span>{liveLecture.teacher_name}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full sm:w-60 bg-white border border-rose-300 rounded-2xl p-3 text-right shadow-2xs">
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-700 mb-1">
                <span>التقدم الزمني:</span>
                <strong className="text-rose-700 text-sm sm:text-base">
                  {getLectureProgressPercentage(liveLecture, currentTimeMinutes)}%
                </strong>
              </div>
              <div className="w-full h-2.5 bg-rose-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full transition-all duration-1000"
                  style={{ width: `${getLectureProgressPercentage(liveLecture, currentTimeMinutes)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⏱️ 4. العرض الرئيسي: نمط المخطط الزمني */}
      {viewMode === 'timeline' && (
        <div className="p-5 sm:p-7 space-y-6">
          
          {/* هيدر اليوم المختار */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-950 text-white rounded-2xl shadow-xs">
                <Calendar className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2">
                  <span>جدول يوم {DAYS_OF_WEEK_LIST.find((d) => d.key === selectedDay)?.label_ar}</span>
                  {selectedDay === currentRealDay && (
                    <span className="px-3 py-0.5 bg-rose-100 text-rose-950 text-xs sm:text-sm font-black rounded-full border border-rose-300">
                      اليوم الفعلي
                    </span>
                  )}
                </h3>
                <p className="text-sm sm:text-base text-slate-700 font-black mt-0.5">
                  {isSelectedDayOff ? 'عطلة رسمية معتمدة' : `إجمالي المحاضرات المقررة: ${dayLectures.length} محاضرة`}
                </p>
              </div>
            </div>

            {selectedDay === currentRealDay && nextUpcomingLecture && !liveLecture && (
              <div className="px-4 py-2 bg-blue-50 border border-blue-300 rounded-2xl flex items-center gap-2 text-blue-950 text-sm sm:text-base font-black shadow-2xs animate-in fade-in">
                <Clock className="w-4 h-4 text-blue-700" />
                <span>
                  المحاضرة القادمة: <strong>{nextUpcomingLecture.course_name}</strong> في الساعة{' '}
                  <span className="font-mono">{nextUpcomingLecture.start_time}</span>
                </span>
              </div>
            )}
          </div>

          {/* حالة اليوم الفارغ أو العطلة */}
          {isSelectedDayOff ? (
            <div className="py-12 px-4 text-center rounded-3xl bg-slate-50 border-2 border-dashed border-slate-300 space-y-3">
              <div className="w-14 h-14 bg-slate-200 text-slate-900 border-2 border-slate-400 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                <Coffee className="w-7 h-7 text-slate-700" />
              </div>
              <h4 className="text-lg sm:text-xl font-black text-slate-950">اليوم عطلة رسمية وأكاديمية</h4>
              <p className="text-sm sm:text-base text-slate-700 font-black max-w-md mx-auto">
                لا توجد محاضرات دراسية مجدولة لهذا اليوم بحسب الخطة المعتمدة من رئاسة القسم.
              </p>
            </div>
          ) : dayLectures.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-3xl bg-slate-50 border-2 border-dashed border-slate-300 space-y-2">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-base sm:text-lg font-black text-slate-950">لا توجد محاضرات مجدولة لهذا اليوم</h4>
              <p className="text-sm sm:text-base text-slate-600 font-black">
                لم يتم إدراج محاضرات في جدول هذا اليوم لهذا الكورس حتى الآن.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayLectures.map((lecture, idx) => {
                const liveStatus = getLectureLiveStatus(
                  lecture,
                  currentTimeMinutes,
                  selectedDay,
                  currentRealDay
                );
                const theme = LECTURE_COLOR_THEMES[lecture.color] || LECTURE_COLOR_THEMES.blue;
                const typeInfo = LECTURE_TYPE_LABELS[lecture.type] || LECTURE_TYPE_LABELS.theory;

                return (
                  <div
                    key={lecture.id}
                    className={`rounded-2xl border-2 p-4 sm:p-5 transition-all shadow-2xs ${
                      liveStatus === 'live'
                        ? 'bg-white border-rose-500 shadow-md ring-2 ring-rose-500/20'
                        : `${theme.bgLight} ${theme.border} hover:border-slate-400`
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-xl bg-[#0F2942] text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-2xs">
                          {idx + 1}
                        </span>
                        <span className="px-3 py-1 bg-slate-950 text-white font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 font-mono shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lecture.start_time} - {lecture.end_time}</span>
                        </span>
                        <span className={`px-3 py-1 ${theme.badgeBg} ${theme.badgeText} font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5`}>
                          {lecture.type === 'practical' ? (
                            <FlaskConical className="w-3.5 h-3.5" />
                          ) : lecture.type === 'tutorial' ? (
                            <Sparkles className="w-3.5 h-3.5" />
                          ) : (
                            <BookOpen className="w-3.5 h-3.5" />
                          )}
                          <span>{typeInfo.ar}</span>
                        </span>
                        {/* ☀️ / 🌙 شارة الصباحي والمسائي بالأيقونات الفيكتورية */}
                        <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black border flex items-center gap-1 shadow-2xs ${
                          (lecture.study_type || 'morning') === 'evening'
                            ? 'bg-indigo-50 text-indigo-950 border-indigo-300'
                            : 'bg-sky-50 text-sky-950 border-sky-300'
                        }`}>
                          {(lecture.study_type || 'morning') === 'evening' ? (
                            <Moon className="w-3.5 h-3.5 text-indigo-700" />
                          ) : (
                            <Sun className="w-3.5 h-3.5 text-sky-600" />
                          )}
                          <span>{(lecture.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'}</span>
                        </span>
                      </div>

                      <div>
                        {liveStatus === 'live' && (
                          <span className="px-3 py-1 bg-rose-600 text-white font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-2xs animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                            <span>جارية الآن</span>
                          </span>
                        )}
                        {liveStatus === 'upcoming' && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-950 font-black text-xs sm:text-sm rounded-xl border border-blue-300 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-700" />
                            <span>قادمة اليوم</span>
                          </span>
                        )}
                        {liveStatus === 'finished' && (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-950 font-black text-xs sm:text-sm rounded-xl border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>مكتملة</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-base sm:text-xl font-black text-slate-950 flex items-center gap-2.5">
                        <span>{lecture.course_name}</span>
                        <span className="px-2.5 py-0.5 bg-slate-200 text-slate-900 text-xs font-mono font-black rounded-lg">
                          {lecture.course_code}
                        </span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-sm sm:text-base font-black text-slate-800">
                        <div className="flex items-center gap-2 p-2.5 bg-white/90 rounded-xl border border-slate-300">
                          <MapPin className="w-4 h-4 text-[#0F2942]" />
                          <span>المكان:</span>
                          <strong className="text-slate-950">{lecture.room}</strong>
                        </div>

                        {lecture.teacher_name && (
                          <div className="flex items-center gap-2 p-2.5 bg-white/90 rounded-xl border border-slate-300">
                            <UserCheck className="w-4 h-4 text-blue-700" />
                            <span>الأستاذ:</span>
                            <strong className="text-slate-950">{lecture.teacher_name}</strong>
                          </div>
                        )}
                      </div>

                      {lecture.notes && (
                        <div className="mt-2 p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-950 text-xs sm:text-sm font-black flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                          <span>{lecture.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 📊 5. نمط الجدول الأسبوعي الشامل */}
      {viewMode === 'weekly' && (
        <div className="p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-wrap gap-3">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2.5">
                <CalendarDays className="w-5 h-5 text-[#0F2942]" />
                <span>الجدول الأسبوعي الشامل — الكورس {selectedSemester === 1 ? 'الأول' : 'الثاني'}</span>
              </h3>
              <p className="text-xs sm:text-sm font-black text-slate-700 mt-0.5">
                استعراض جدول الأسبوع الكامل من السبت إلى الجمعة مع توضيح القاعات وأوقات الدوام
              </p>
            </div>

            {/* 🖨️ زر فتح نافذة معاينة وطباعة الجدول الرسمي بتصميم كحلي ملكي فاخر #0F2942 */}
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm transition cursor-pointer flex items-center gap-2 border border-[#1e4570] shadow-md active:scale-95 shrink-0"
            >
              <Printer className="w-4 h-4 text-cyan-300" />
              <span>طباعة الجدول الرسمي</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
            {DAYS_OF_WEEK_LIST.map((d) => {
              const isOff = activeConfig.off_days.includes(d.key);
              const dayLecs = stageLectures
                .filter((l) => l.day === d.key)
                .sort((a, b) => timeStringToMinutes(a.start_time) - timeStringToMinutes(b.start_time));
              const isToday = currentRealDay === d.key;

              return (
                <div
                  key={d.key}
                  className={`rounded-2xl border-2 transition-all flex flex-col overflow-hidden ${
                    isToday
                      ? 'bg-blue-50/40 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : isOff
                      ? 'bg-slate-50/70 border-slate-200'
                      : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  <div className={`p-3 border-b flex items-center justify-between ${
                    isToday
                      ? 'bg-[#0F2942] text-white border-[#0F2942]'
                      : isOff
                      ? 'bg-slate-100 border-slate-200 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-950'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm sm:text-base">{d.label_ar}</span>
                      {isToday && (
                        <span className="px-1.5 py-0.5 bg-rose-600 text-white font-black text-[10px] rounded-md shadow-2xs">
                          اليوم
                        </span>
                      )}
                    </div>
                    {isOff ? (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-200 font-black text-[10px] rounded-md flex items-center gap-1">
                        <Sun className="w-3 h-3 text-emerald-600" />
                        <span>عطلة</span>
                      </span>
                    ) : (
                      <span className={`px-1.5 py-0.5 rounded-md font-black text-[10px] border ${
                        isToday 
                          ? 'bg-white/20 text-white border-white/20' 
                          : dayLecs.length > 0
                          ? 'bg-blue-50 text-blue-950 border-blue-200'
                          : 'bg-slate-200 text-slate-700 border-slate-300'
                      }`}>
                        {dayLecs.length > 0 ? `${dayLecs.length} محاضرات` : 'فارغ'}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 space-y-2 flex-1 flex flex-col">
                    {isOff ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-6 text-center p-2 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-emerald-900 space-y-1">
                        <Coffee className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-black">عطلة رسمية معتمدة</span>
                      </div>
                    ) : dayLecs.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-6 text-center p-2 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 space-y-1">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <span className="text-xs font-bold">لا توجد محاضرات</span>
                      </div>
                    ) : (
                      dayLecs.map((lec) => {
                        const theme = LECTURE_COLOR_THEMES[lec.color] || LECTURE_COLOR_THEMES.blue;
                        const typeInfo = LECTURE_TYPE_LABELS[lec.type] || LECTURE_TYPE_LABELS.theory;

                        return (
                          <div
                            key={lec.id}
                            className={`p-2.5 rounded-xl border-2 ${theme.bgLight} ${theme.border} space-y-1.5 shadow-2xs transition-all hover:scale-[1.01]`}
                          >
                            <div className="flex items-center justify-between gap-1 text-[11px] font-black">
                              <span className="text-slate-950 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-700 shrink-0" />
                                <span>{lec.start_time} - {lec.end_time}</span>
                              </span>
                              <span className={`px-1.5 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} text-[10px] font-black shrink-0`}>
                                {typeInfo.ar.includes('مختبر') ? 'عملي' : typeInfo.ar.includes('حلقة') ? 'مناقشة' : 'نظري'}
                              </span>
                            </div>

                            <h5 className="text-xs sm:text-sm font-black text-slate-950 leading-snug line-clamp-2">
                              {lec.course_name}
                            </h5>

                            <div className="space-y-0.5 pt-1 border-t border-slate-200/60 text-[11px] font-black">
                              <div className="flex items-center gap-1 text-slate-900 truncate">
                                <MapPin className="w-3 h-3 text-[#0F2942] shrink-0" />
                                <span className="truncate">{lec.room}</span>
                              </div>
                              {lec.teacher_name && (
                                <div className="flex items-center gap-1 text-slate-700 truncate">
                                  <UserCheck className="w-3 h-3 text-blue-700 shrink-0" />
                                  <span className="truncate">{lec.teacher_name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-black text-slate-950 flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-emerald-600" />
              <span>أيام العطل الأسبوعية المعتمدة:</span>
              <strong className="text-slate-950">
                {activeConfig.off_days
                  .map((k) => DAYS_OF_WEEK_LIST.find((d) => d.key === k)?.label_ar)
                  .join(' و ')}
              </strong>
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#0F2942]" />
              <span>جامعة الإمام جعفر الصادق (ع) - فرع ميسان</span>
            </span>
          </div>
        </div>
      )}

      {/* 🖨️ نافذة معاينة وطباعة جدول المحاضرات الأسبوعي المعتمد بنظام الصفوف والأعمدة الأكاديمية */}
      {isPrintModalOpen && isMounted && typeof document !== 'undefined' && createPortal(
        (
          <div
            id="printable-modal-portal"
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:static print:bg-white print:backdrop-blur-none print:w-full print:h-auto print:min-h-0 print:overflow-visible print:block"
            dir="rtl"
          >
            {/* 📄 تنسيقات الطباعة الإلزامية لفرض العرض الأفقي والتسطير الواضح للجدول */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                @page {
                  size: A4 landscape !important;
                  margin: 6mm !important;
                }
                #printable-modal-portal {
                  width: 100% !important;
                  height: auto !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  background: #ffffff !important;
                }
                #printable-modal-portal table {
                  border-collapse: collapse !important;
                  width: 100% !important;
                }
                #printable-modal-portal th, 
                #printable-modal-portal td {
                  border: 1.5px solid #000000 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            `}} />

            <div className="bg-white border-2 border-slate-400 rounded-3xl w-full max-w-7xl max-h-[94vh] shadow-2xl flex flex-col relative overflow-hidden text-right print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none print:overflow-visible print:static print:block print:h-auto">
              
              {/* 🎛️ شريط الأدوات العلوي للمعاينة السريعة (مخفي كلياً بالطباعة) */}
              <div className="p-4 sm:p-5 border-b-2 border-slate-300 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 z-10 print:hidden no-print">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0F2942] text-cyan-300 rounded-2xl shadow-xs">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-black flex items-center gap-2 flex-wrap">
                      <span>معاينة وثيقة جدول المحاضرات الأسبوعي المعتمد</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-950 text-xs font-black border border-slate-300">
                        المرحلة {stageNumber} — الكورس {selectedSemester === 1 ? 'الأول' : 'الثاني'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-950 text-xs font-black border border-blue-200">
                        {selectedStudyType === 'morning' ? 'الدراسة الصباحية' : 'الدراسة المسائية'}
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm font-black text-slate-700 mt-0.5">
                      تنسيق أكاديمي رسمي مخصص للطباعة على ورقة A4 بنظام الصفوف والأعمدة المعتمد
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#1e4570] active:scale-95"
                  >
                    <Printer className="w-4 h-4 text-cyan-300" />
                    <span>طباعة الآن (A4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(false)}
                    className="p-2.5 bg-slate-200 hover:bg-slate-300 text-black rounded-2xl transition cursor-pointer"
                    title="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 📄 منطقة الوثيقة الرسمية المجهزة للطباعة بنظام الصفوف والأعمدة */}
              <div className="p-4 sm:p-8 overflow-y-auto flex-1 overscroll-contain bg-slate-100 print:bg-white print:p-0 print:overflow-visible print:static print:block print:h-auto">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-300 print:border-none print:p-1 max-w-6xl mx-auto shadow-sm print:shadow-none space-y-5">
                  
                  {/* 🏛️ 1. الترويسة الأكاديمية الرسمية باللون الأسود الخالص */}
                  <div className="flex items-center justify-between border-b-2 border-black pb-4 text-black">
                    {/* الجهة الأكاديمية - يمين */}
                    <div className="text-right space-y-1">
                      <div className="text-sm font-black text-black">جمهورية العراق</div>
                      <div className="text-xs font-black text-black">وزارة التعليم العالي والبحث العلمي</div>
                      <div className="text-sm font-black text-black">جامعة الإمام جعفر الصادق (ع)</div>
                      <div className="text-xs font-black text-black">فرع ميسان — كلية تكنولوجيا المعلومات</div>
                      <div className="text-xs font-black text-black">قسم {departmentName}</div>
                    </div>

                    {/* الشعار والعنوان - وسط */}
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-1">
                        <Image
                          src="/logo.webp"
                          alt="شعار جامعة الإمام جعفر الصادق (ع)"
                          width={80}
                          height={80}
                          className="object-contain mx-auto"
                          priority
                        />
                      </div>
                      <h1 className="text-base sm:text-lg font-black text-black tracking-tight">
                        جدول المحاضرات الأسبوعي المعتمد
                      </h1>
                      <div className="text-xs font-black text-black mt-0.5">
                        العام الدراسي 2025 - 2026
                      </div>
                    </div>

                    {/* بيانات الجدول - يسار */}
                    <div className="text-left space-y-1 text-xs font-black text-black font-sans">
                      <div><span>المرحلة:</span> <strong className="text-black font-black">المرحلة {stageNumber}</strong></div>
                      <div><span>الفصل:</span> <strong className="text-black font-black">الكورس {selectedSemester === 1 ? 'الأول' : 'الثاني'}</strong></div>
                      <div><span>الدراسة:</span> <strong className="text-black font-black">{selectedStudyType === 'morning' ? 'الصباحية' : 'المسائية'}</strong></div>
                      <div><span>تاريخ الإصدار:</span> <strong className="text-black font-black" dir="ltr">{new Date().toLocaleDateString('ar-IQ-u-nu-latn')}</strong></div>
                    </div>
                  </div>

                  {/* 📊 2. جدول المصفوفة الرسمية (صفوف للأيام وأعمدة للمحاضرات) */}
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-right border-collapse border-2 border-black text-black table-fixed">
                      {/* ترويسة الأعمدة */}
                      <thead>
                        <tr className="bg-slate-100 border-b-2 border-black text-black">
                          <th className="p-2.5 text-center font-black border border-black text-xs sm:text-sm w-24 text-black">
                            اليوم
                          </th>
                          {Array.from({ length: printMaxSlots }).map((_, slotIdx) => {
                            const slotLabels = ['المحاضرة الأولى', 'المحاضرة الثانية', 'المحاضرة الثالثة', 'المحاضرة الرابعة', 'المحاضرة الخامسة', 'المحاضرة السادسة'];
                            return (
                              <th key={slotIdx} className="p-2.5 text-center font-black border border-black text-xs sm:text-sm text-black">
                                {slotLabels[slotIdx] || `المحاضرة ${slotIdx + 1}`}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      {/* صفوف الأيام والمحاضرات */}
                      <tbody>
                        {printScheduleDays.map((d) => {
                          const isOff = activeConfig.off_days.includes(d.key);
                          const dayLecs = stageLectures
                            .filter((l) => l.day === d.key)
                            .sort((a, b) => timeStringToMinutes(a.start_time) - timeStringToMinutes(b.start_time));

                          if (isOff && dayLecs.length === 0) {
                            return (
                              <tr key={d.key} className="border-b border-black">
                                <td className="p-2.5 text-center font-black border border-black bg-slate-50 text-black text-xs sm:text-sm">
                                  {d.label_ar}
                                </td>
                                <td
                                  colSpan={printMaxSlots}
                                  className="p-3 text-center font-black border border-black bg-slate-50 text-black text-xs sm:text-sm"
                                >
                                  عطلة رسمية معتمدة
                                </td>
                              </tr>
                            );
                          }

                          if (dayLecs.length === 0) {
                            return (
                              <tr key={d.key} className="border-b border-black">
                                <td className="p-2.5 text-center font-black border border-black bg-slate-50 text-black text-xs sm:text-sm">
                                  {d.label_ar}
                                </td>
                                <td
                                  colSpan={printMaxSlots}
                                  className="p-3 text-center font-black border border-black bg-white text-black text-base"
                                >
                                  —
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={d.key} className="border-b border-black">
                              <td className="p-2.5 text-center font-black border border-black bg-slate-50 text-black text-xs sm:text-sm align-middle">
                                <div className="font-black text-sm text-black">{d.label_ar}</div>
                                <div className="text-[10px] font-black text-black mt-0.5">{dayLecs.length} محاضرات</div>
                              </td>
                              {Array.from({ length: printMaxSlots }).map((_, slotIdx) => {
                                const lec = dayLecs[slotIdx];
                                if (!lec) {
                                  return (
                                    <td key={slotIdx} className="p-2 text-center text-black font-black border border-black bg-white align-middle text-base">
                                      —
                                    </td>
                                  );
                                }
                                const typeLabel = lec.type === 'practical' ? 'عملي' : lec.type === 'tutorial' ? 'حلقة نقاشية' : 'نظري'; // 🏷️ نوع المحاضرة строго طبق النوع المصرح به
                                return (
                                  <td key={slotIdx} className="p-2 border border-black bg-white align-top text-right text-xs text-black">
                                    {/* توقيت المحاضرة ونوعها */}
                                    <div className="flex items-center justify-between border-b border-black/20 pb-1 mb-1 font-black">
                                      <span className="text-[11px] font-mono text-black font-black" dir="ltr">
                                        {lec.start_time} - {lec.end_time}
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-black text-[10px] font-black text-black">
                                        {typeLabel}
                                      </span>
                                    </div>
                                    {/* اسم المادة الدراسية */}
                                    <div className="font-black text-xs sm:text-sm text-black leading-tight mb-1">
                                      {lec.course_name}
                                    </div>
                                    {/* كود المادة */}
                                    {lec.course_code && (
                                      <div className="text-[10px] font-mono text-black font-black mb-0.5" dir="ltr">
                                        {lec.course_code}
                                      </div>
                                    )}
                                    {/* التدريسي والقاعة */}
                                    <div className="text-[10px] font-black text-black space-y-0.5 pt-1 border-t border-dashed border-black/25">
                                      {lec.teacher_name && (
                                        <div className="truncate">
                                          <span className="text-black font-black">م.د: </span>
                                          <span className="text-black font-black">{lec.teacher_name}</span>
                                        </div>
                                      )}
                                      <div className="truncate">
                                        <span className="text-black font-black">المكان: </span>
                                        <span className="text-black font-black">{lec.room}</span>
                                      </div>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* ✍️ 3. التواقيع والأختام الرسمية بالأسماء الحقيقية والنصوص السوداء الصريحة */}
                  <div className="grid grid-cols-3 gap-6 text-center pt-6 mt-4 border-t-2 border-black text-black">
                    <div>
                      <p className="font-black text-xs sm:text-sm text-black">مقرر القسم العلمي</p>
                      <p className="font-black text-xs sm:text-sm text-black mt-1">{resolvedRapporteurName}</p>
                      <div className="mt-5 text-[11px] font-black text-black">التوقيع: .....................</div>
                    </div>
                    <div>
                      <p className="font-black text-xs sm:text-sm text-black">رئيس قسم {departmentName}</p>
                      <p className="font-black text-xs sm:text-sm text-black mt-1">{resolvedHeadName}</p>
                      <div className="mt-5 text-[11px] font-black text-black">التوقيع: .....................</div>
                    </div>
                    <div>
                      <p className="font-black text-xs sm:text-sm text-black">الختم والتصديق المركزي / عمادة الكلية</p>
                      <p className="font-black text-xs sm:text-sm text-black mt-1">أ.د. حيدر جاسم كاظم</p>
                      <div className="mt-5 text-[11px] font-black text-black">التوقيع: .....................</div>
                    </div>
                  </div>

                  {/* 📝 4. التذييل والتوثيق الإلكتروني باللون الأسود الحاد */}
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-black text-black pt-2.5 border-t-2 border-black">
                    <span>المنصة الأكاديمية المركزية — مسار بولونيا التعليمي — جامعة الإمام جعفر الصادق (ع) - فرع ميسان</span>
                    <span>وثيقة رسمية صادرة إلكترونياً وغير قابلة للشطب أو التعديل اليدوي</span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        ),
        document.body
      )}

    </div>
  );
}
