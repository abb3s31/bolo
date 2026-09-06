'use client'; // ⚡ ينفذ بالعميل على متصفح الأستاذ

//  المكون التفاعلي الحركي الموحد للجدول الأسبوعي والـ Timeline الخاص بعضو هيئة التدريس
import { useState, useEffect, useMemo } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والوقت اللحظي
import Image from 'next/image'; // 🖼️ استيراد مكون الصور من نكست لطباعة شعار الجامعة الرسمي
import { createPortal } from 'react-dom'; // 🚪 بورتال لعرض نافذة الطباعة مباشرة على جذر الصفحة
import { DayOfWeek, ScheduleLecture, DepartmentScheduleConfig, LectureColor, UserProfile, Department } from '@/types'; // 🔗 استيراد الأنواع
import { getStoredData, INITIAL_PROFILES, INITIAL_DEPARTMENTS } from '@/lib/mock-data'; // 💾 دوال وسجلات التخزين المحلي للبحث عن مسؤولي الأقسام
import {
  DAYS_OF_WEEK_LIST,
  LECTURE_COLOR_THEMES,
  LECTURE_TYPE_LABELS,
  timeStringToMinutes,
  minutesToTimeString,
  getTodayDayOfWeek,
  getLectureLiveStatus,
  getLectureProgressPercentage,
} from '@/lib/schedule-utils'; // 🕒 دوال حسابات الجدول
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 أسماء المراحل بالعربية
import {
  Clock,
  Calendar,
  Sparkles,
  MapPin,
  GraduationCap,
  BookOpen,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Layers,
  Radio,
  Printer,
  Award,
  Sun,
  Moon,
  Building2,
  CalendarDays,
  FlaskConical,
  UserCheck,
  X, // ❌ أيقونة إغلاق نافذة المعاينة والطباعة
} from 'lucide-react'; // 🎨 أيقونات واجهة المستخدم SVG

// 🏷️ واجهة خصائص مكون جدول الأستاذ
interface TeacherScheduleTimelineProps {
  teacherId: string;              // 🆔 معرف الأستاذ
  teacherName: string;            // 👤 اسم الأستاذ بالعربية
  departmentName: string;         // 🏢 اسم القسم
  departmentId?: string;          // 🏢 معرف القسم إذا توفر
  departmentHeadName?: string;    // 👑 اسم رئيس القسم الفعلي
  rapporteurName?: string;        // 📋 اسم مقرر القسم الفعلي
  lectures: ScheduleLecture[];    // 📚 كافة محاضرات النظام
  configs: DepartmentScheduleConfig[]; // ⚙️ إعدادات العطل
  initialSemester?: 1 | 2;        // 🗓️ الفصل الدراسي المبدئي
}

export default function TeacherScheduleTimeline({
  teacherId,
  teacherName,
  departmentName,
  departmentId,
  departmentHeadName,
  rapporteurName,
  lectures,
  configs,
  initialSemester = 1,
}: TeacherScheduleTimelineProps) {
  // 📌 الحالات
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(initialSemester);
  const [selectedStage, setSelectedStage] = useState<number | 'all'>('all');
  const [selectedStudyType, setSelectedStudyType] = useState<'all' | 'morning' | 'evening'>('all');
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

  // 🕒 تحديث الساعة الحية كل ثانية
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

  // 📚 كافة محاضرات الأستاذ المتاحة
  const myAllLectures = useMemo(() => {
    return lectures.filter(
      (l) => (l.teacher_id === teacherId || l.teacher_name === teacherName)
    );
  }, [lectures, teacherId, teacherName]);

  // 🔢 عدد المحاضرات لكل كورس
  const sem1Count = useMemo(() => {
    return myAllLectures.filter((l) => (l.semester || 1) === 1).length;
  }, [myAllLectures]);

  const sem2Count = useMemo(() => {
    return myAllLectures.filter((l) => (l.semester || 1) === 2).length;
  }, [myAllLectures]);

  // 📚 تصفية المحاضرات الخاصة بالأستاذ بحسب المحددات النشطة
  const myLectures = useMemo(() => {
    return myAllLectures.filter((l) => {
      if ((l.semester || 1) !== selectedSemester) return false;
      if (selectedStage !== 'all' && l.stage_number !== selectedStage) return false;
      if (selectedStudyType !== 'all' && (l.study_type || 'morning') !== selectedStudyType) return false;
      return true;
    });
  }, [myAllLectures, selectedSemester, selectedStage, selectedStudyType]);

  // 🖨️ الأيام المعتمدة لطباعة جدول الأستاذ (السبت للخميس، وإذا الجمعة بيها محاضرات تنضاف أوتوماتيك)
  const printScheduleDays = useMemo(() => {
    const hasFriday = myLectures.some((l) => l.day === 'friday'); // 🔍 فحص هل يوم الجمعة يحتوي على محاضرات
    return hasFriday ? DAYS_OF_WEEK_LIST : DAYS_OF_WEEK_LIST.filter((d) => d.key !== 'friday'); // 🗓️ تجهيز قائمة الأيام
  }, [myLectures]);

  // 🔢 حساب أكبر عدد محاضرات باليوم الواحد للأستاذ لتحديد عدد أعمدة الجدول المطبوع (أقل شي 4 أعمدة)
  const printMaxSlots = useMemo(() => {
    let max = 4; // 📌 نبدي بـ 4 فترات قياسية
    printScheduleDays.forEach((d) => {
      const count = myLectures.filter((l) => l.day === d.key).length; // 📊 حساب محاضرات هذا اليوم
      if (count > max) max = count; // 📈 تحديث الحد الأقصى إذا زاد
    });
    return max; // 🎯 إرجاع عدد الأعمدة المطلوب
  }, [printScheduleDays, myLectures]);

  // 👤 استخراج الاسم الفعلي لرئيس القسم العلمي من البروفايلات أو بيانات القسم
  const resolvedHeadName = useMemo(() => {
    // 1️⃣ إذا ممرر بالخصائص نستعمله مباشرة
    if (departmentHeadName && departmentHeadName.trim() !== '') {
      return departmentHeadName.trim(); // 🎯 الاسم الممرر من الأب
    }
    // 2️⃣ البحث الفعلي بالتخزين المحلي
    if (typeof window !== 'undefined') {
      // فحص بيانات القسم المسجلة في departments
      const depts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS); // 📂 جلب كل الأقسام
      const targetDept = depts.find((d) => (departmentId && d.id === departmentId) || d.name === departmentName); // 🔍 البحث عن القسم
      if (targetDept?.head_name && targetDept.head_name.trim() !== '') {
        return targetDept.head_name.trim(); // 🎯 اسم رئيس القسم من سجل القسم
      }
      // فحص حسابات المستخدمين في profiles لدور رئيس القسم
      const profiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES); // 📂 جلب بروفايلات المستخدمين
      const headUser = profiles.find((p) => p.role === 'department_head' && ((departmentId && p.department_id === departmentId) || p.department_name === departmentName)); // 🔍 مطابقة رئيس القسم
      if (headUser?.full_name && headUser.full_name.trim() !== '') {
        return headUser.full_name.trim(); // 🎯 اسم رئيس القسم من البروفايل
      }
    }
    // 3️⃣ نص بديل رسمي إذا لم يعين
    return 'رئاسة القسم العلمي'; // 🛡️ بديل رسمي موحد
  }, [departmentHeadName, departmentId, departmentName]);

  // 👤 استخراج الاسم الفعلي لمقرر القسم العلمي من البروفايلات أو بيانات القسم
  const resolvedRapporteurName = useMemo(() => {
    // 1️⃣ إذا ممرر بالخصائص نستعمله فوراً
    if (rapporteurName && rapporteurName.trim() !== '') {
      return rapporteurName.trim(); // 🎯 الاسم الممرر من الأب
    }
    // 2️⃣ البحث الفعلي بالتخزين المحلي
    if (typeof window !== 'undefined') {
      // فحص بيانات القسم المسجلة في departments
      const depts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS); // 📂 جلب كل الأقسام
      const targetDept = depts.find((d) => (departmentId && d.id === departmentId) || d.name === departmentName); // 🔍 البحث عن القسم
      if (targetDept?.rapporteur_name && targetDept.rapporteur_name.trim() !== '') {
        return targetDept.rapporteur_name.trim(); // 🎯 اسم مقرر القسم من سجل القسم
      }
      // فحص حسابات المستخدمين في profiles لدور مقرر القسم
      const profiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES); // 📂 جلب بروفايلات المستخدمين
      const rapUser = profiles.find((p) => p.role === 'rapporteur' && ((departmentId && p.department_id === departmentId) || p.department_name === departmentName)); // 🔍 مطابقة مقرر القسم
      if (rapUser?.full_name && rapUser.full_name.trim() !== '') {
        return rapUser.full_name.trim(); // 🎯 اسم مقرر القسم من البروفايل
      }
    }
    // 3️⃣ نص بديل رسمي إذا لم يعين
    return 'مقررية القسم العلمي'; // 🛡️ بديل رسمي موحد
  }, [rapporteurName, departmentId, departmentName]);

  // 📅 محاضرات اليوم المختار
  const dayLectures = useMemo(() => {
    return myLectures
      .filter((l) => l.day === selectedDay)
      .sort((a, b) => timeStringToMinutes(a.start_time) - timeStringToMinutes(b.start_time));
  }, [myLectures, selectedDay]);

  // 🔴 المحاضرة الجارية حالياً للأستاذ
  const liveLecture = useMemo(() => {
    if (selectedDay !== currentRealDay) return null;
    return dayLectures.find((l) => {
      const start = timeStringToMinutes(l.start_time);
      const end = timeStringToMinutes(l.end_time);
      return currentTimeMinutes >= start && currentTimeMinutes < end;
    }) || null;
  }, [dayLectures, selectedDay, currentRealDay, currentTimeMinutes]);

  // ⏳ المحاضرة القادمة للأستاذ اليوم
  const nextUpcomingLecture = useMemo(() => {
    if (selectedDay !== currentRealDay) return null;
    return dayLectures.find((l) => timeStringToMinutes(l.start_time) > currentTimeMinutes) || null;
  }, [dayLectures, selectedDay, currentRealDay, currentTimeMinutes]);

  // 📊 حساب إجمالي ساعات التدريس الأسبوعية
  const totalWeeklyHours = useMemo(() => {
    let totalMinutes = 0;
    myLectures.forEach((l) => {
      const start = timeStringToMinutes(l.start_time);
      const end = timeStringToMinutes(l.end_time);
      if (end > start) totalMinutes += (end - start);
    });
    return Math.round((totalMinutes / 60) * 10) / 10;
  }, [myLectures]);

  return (
    <div className="bg-white border-2 border-slate-200 rounded-3xl shadow-sm overflow-hidden font-sans animate-in fade-in duration-200">
      
      {/* 🧭 1. شريط التحكم والهيدر الرئيسي */}
      <div className="p-5 sm:p-6 bg-white border-b border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-[#0F2942] font-black text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-4 h-4 text-blue-700" />
                <span>الجدول التدريسي والمخطط الزمني</span>
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-900 border border-slate-300 font-black text-sm rounded-xl">
                الأستاذ: {teacherName} ({departmentName})
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-[#0F2942]" />
              <span>جدول المحاضرات الأسبوعي للأستاذ</span>
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

            <div className="flex items-center bg-slate-100 p-1.5 border border-slate-300 rounded-2xl">
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`px-4 py-2 rounded-xl text-base font-black transition flex items-center gap-2 cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-white text-slate-950 shadow-xs border border-slate-300'
                    : 'text-slate-700 hover:text-black'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>المخطط الزمني</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('weekly')}
                className={`px-4 py-2 rounded-xl text-base font-black transition flex items-center gap-2 cursor-pointer ${
                  viewMode === 'weekly'
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-700 hover:text-black'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>الجدول الأسبوعي</span>
              </button>
            </div>
          </div>
        </div>

        {/* 🔄 أزرار تبديل الكورس وتصفية المرحلة والفترة مع الشارات والعدادات المحدثة */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-black text-slate-800">الكورس الدراسي:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedSemester(1)}
                className={`px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer border flex items-center gap-2 ${
                  selectedSemester === 1
                    ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>الكورس الأول</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                  selectedSemester === 1
                    ? 'bg-white/20 text-white border-white/30'
                    : sem1Count > 0
                    ? 'bg-blue-100 text-blue-950 border-blue-300'
                    : 'bg-slate-200 text-slate-600 border-slate-300'
                }`}>
                  {sem1Count}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSemester(2)}
                className={`px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer border flex items-center gap-2 ${
                  selectedSemester === 2
                    ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>الكورس الثاني</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                  selectedSemester === 2
                    ? 'bg-white/20 text-white border-white/30'
                    : sem2Count > 0
                    ? 'bg-blue-100 text-blue-950 border-blue-300'
                    : 'bg-slate-200 text-slate-600 border-slate-300'
                }`}>
                  {sem2Count}
                </span>
              </button>
            </div>
          </div>

          {/* محدد الفترة الصباحي / المسائي للأستاذ */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-black text-slate-800">الفترة:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedStudyType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border ${
                  selectedStudyType === 'all'
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudyType('morning')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border flex items-center gap-1.5 ${
                  selectedStudyType === 'morning'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>الصباحي</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudyType('evening')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border flex items-center gap-1.5 ${
                  selectedStudyType === 'evening'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>المسائي</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🗓️ 2. شريط أزرار أيام الأسبوع الـ 7 */}
      <div className="p-3 sm:p-4 bg-slate-50/80 border-b border-slate-200">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
          {DAYS_OF_WEEK_LIST.map((d) => {
            const isSelected = selectedDay === d.key;
            const isToday = currentRealDay === d.key;
            const dayLecturesCount = myLectures.filter((l) => l.day === d.key).length;

            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setSelectedDay(d.key)}
                className={`h-20 sm:h-22 p-2 sm:p-2.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-between text-center cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/20'
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
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🔴 3. بطاقة المحاضرة الجارية الآن */}
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
                    <span>أنت تحاضر الآن</span>
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
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#0F2942]" />
                    <span>المرحلة الدراسية: {liveLecture.stage_number}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full sm:w-60 bg-white border border-rose-300 rounded-2xl p-3 text-right shadow-2xs">
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-700 mb-1">
                <span>زمن المحاضرة:</span>
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

      {/* ⏱️ 4. نمط المخطط الزمني */}
      {viewMode === 'timeline' && (
        <div className="p-5 sm:p-7 space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-950 text-white rounded-2xl shadow-xs">
                <Calendar className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2">
                  <span>جدول محاضراتك ليوم {DAYS_OF_WEEK_LIST.find((d) => d.key === selectedDay)?.label_ar}</span>
                  {selectedDay === currentRealDay && (
                    <span className="px-3 py-0.5 bg-rose-100 text-rose-950 text-xs sm:text-sm font-black rounded-full border border-rose-300">
                      اليوم الفعلي
                    </span>
                  )}
                </h3>
                <p className="text-sm sm:text-base text-slate-700 font-black mt-0.5">
                  إجمالي المحاضرات المكلف بها: {dayLectures.length} محاضرة
                </p>
              </div>
            </div>

            {selectedDay === currentRealDay && nextUpcomingLecture && !liveLecture && (
              <div className="px-4 py-2 bg-blue-50 border border-blue-300 rounded-2xl flex items-center gap-2 text-blue-950 text-sm sm:text-base font-black shadow-2xs">
                <Clock className="w-4 h-4 text-blue-700" />
                <span>
                  محاضرتك القادمة: <strong>{nextUpcomingLecture.course_name}</strong> (المرحلة {getStageNameInArabic(nextUpcomingLecture.stage_number)}) في{' '}
                  <span className="font-mono">{nextUpcomingLecture.start_time}</span>
                </span>
              </div>
            )}
          </div>

          {dayLectures.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-3xl bg-slate-50 border-2 border-dashed border-slate-300 space-y-2">
              <Coffee className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-base sm:text-lg font-black text-slate-950">لا توجد محاضرات مكلف بها لهذا اليوم</h4>
              <p className="text-sm sm:text-base text-slate-600 font-black">
                جدولك فارغ اليوم، يمكنك استغلال الوقت في الأنشطة البحثية والإشراف الأكاديمي.
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
                        <span className="px-3 py-1 bg-blue-100 text-blue-950 border border-blue-200 font-black text-xs sm:text-sm rounded-xl">
                          المرحلة {getStageNameInArabic(lecture.stage_number)}
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

                        <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black border flex items-center gap-1.5 ${
                          (lecture.study_type || 'morning') === 'evening'
                            ? 'bg-indigo-50 text-indigo-950 border-indigo-200'
                            : 'bg-sky-50 text-sky-950 border-sky-300'
                        }`}>
                          {(lecture.study_type || 'morning') === 'evening' ? (
                            <Moon className="w-3.5 h-3.5 text-indigo-600" />
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
                          <span>المكان المحدد:</span>
                          <strong className="text-slate-950">{lecture.room}</strong>
                        </div>

                        <div className="flex items-center gap-2 p-2.5 bg-white/90 rounded-xl border border-slate-300">
                          <GraduationCap className="w-4 h-4 text-[#0F2942]" />
                          <span>المرحلة المستهدفة:</span>
                          <strong className="text-slate-950">المرحلة {getStageNameInArabic(lecture.stage_number)}</strong>
                        </div>
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

      {/* 📊 5. نمط الجدول التدريسي الأسبوعي الشامل */}
      {viewMode === 'weekly' && (
        <div className="p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-wrap gap-3">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2.5">
                <CalendarDays className="w-5 h-5 text-[#0F2942]" />
                <span>الجدول التدريسي الأسبوعي الشامل — الكورس {selectedSemester === 1 ? 'الأول' : 'الثاني'}</span>
              </h3>
              <p className="text-xs sm:text-sm font-black text-slate-700 mt-0.5">
                توزيع كافة محاضرات الأستاذ على مدار أيام الأسبوع مع توضيح القاعات والمراحل الدراسية
              </p>
            </div>

            {/* 🖨️ زر فتح نافذة معاينة وطباعة الجدول التدريسي بتصميم كحلي ملكي فاخر #0F2942 */}
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm transition cursor-pointer flex items-center gap-2 border border-[#1e4570] shadow-md active:scale-95 shrink-0"
            >
              <Printer className="w-4 h-4 text-cyan-300" />
              <span>طباعة الجدول التدريسي</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
            {DAYS_OF_WEEK_LIST.map((d) => {
              const dayLecs = myLectures
                .filter((l) => l.day === d.key)
                .sort((a, b) => timeStringToMinutes(a.start_time) - timeStringToMinutes(b.start_time));
              const isToday = currentRealDay === d.key;

              return (
                <div
                  key={d.key}
                  className={`rounded-2xl border-2 transition-all flex flex-col overflow-hidden ${
                    isToday
                      ? 'bg-blue-50/40 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  <div className={`p-3 border-b flex items-center justify-between ${
                    isToday
                      ? 'bg-[#0F2942] text-white border-[#0F2942]'
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
                    <span className={`px-1.5 py-0.5 rounded-md font-black text-[10px] border ${
                      isToday 
                        ? 'bg-white/20 text-white border-white/20' 
                        : dayLecs.length > 0
                        ? 'bg-blue-50 text-blue-950 border-blue-200'
                        : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}>
                      {dayLecs.length > 0 ? `${dayLecs.length} محاضرات` : 'فارغ'}
                    </span>
                  </div>

                  <div className="p-2.5 space-y-2 flex-1 flex flex-col">
                    {dayLecs.length === 0 ? (
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
                                <Clock className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                                <span>{lec.start_time} - {lec.end_time}</span>
                              </span>
                              <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-950 border border-blue-200 text-[10px] font-black shrink-0">
                                مرحلة {lec.stage_number}
                              </span>
                            </div>

                            <h5 className="text-xs sm:text-sm font-black text-slate-950 leading-snug line-clamp-2">
                              {lec.course_name}
                            </h5>

                            <div className="space-y-0.5 pt-1 border-t border-slate-200/60 text-[11px] font-black">
                              <div className="flex items-center justify-between gap-1 text-slate-900">
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 text-[#0F2942] shrink-0" />
                                  <span className="truncate">{lec.room}</span>
                                </span>
                                <span className="text-slate-600 font-bold shrink-0">{typeInfo.ar}</span>
                              </div>
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

          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-black text-blue-950 font-bold flex-wrap gap-2">
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-700" />
              <span>إجمالي النصاب الأسبوعي المقرر:</span>
              <strong className="text-blue-950 font-black">{totalWeeklyHours} ساعة معتمدة</strong>
            </span>
            <span className="text-xs sm:text-sm font-black text-blue-900 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-700" />
              <span>جامعة الإمام جعفر الصادق (ع) - فرع ميسان | الشؤون العلمية</span>
            </span>
          </div>
        </div>
      )}

      {/* 🖨️ نافذة معاينة وطباعة جدول النصاب والعبء التدريسي الأسبوعي بنظام الصفوف والأعمدة الأكاديمية */}
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
                      <span>معاينة وثيقة جدول النصاب التدريسي الأسبوعي المعتمد</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-950 text-xs font-black border border-slate-300">
                        {teacherName}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-950 text-xs font-black border border-blue-200">
                        الكورس {selectedSemester === 1 ? 'الأول' : 'الثاني'}
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
                  
                  {/* 🏛️ 1. الترويسة الأكاديمية الرسمية */}
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
                        جدول النصاب والعبء التدريسي الأسبوعي المعتمد
                      </h1>
                      <div className="text-xs font-black text-black mt-0.5">
                        العام الدراسي 2025 - 2026
                      </div>
                    </div>

                    {/* بيانات الجدول - يسار */}
                    <div className="text-left space-y-1 text-xs font-black text-black font-sans">
                      <div><span>الأستاذ:</span> <strong className="text-black">{teacherName}</strong></div>
                      <div><span>الفصل:</span> <strong className="text-black">الكورس {selectedSemester === 1 ? 'الأول' : 'الثاني'}</strong></div>
                      <div><span>إجمالي النصاب:</span> <strong className="text-black">{totalWeeklyHours} ساعة معتمدة ({myLectures.length} محاضرات)</strong></div>
                      <div><span>تاريخ الإصدار:</span> <strong className="text-black" dir="ltr">{new Date().toLocaleDateString('ar-IQ-u-nu-latn')}</strong></div>
                    </div>
                  </div>

                  {/* 📊 2. جدول المصفوفة الرسمية (صفوف للأيام وأعمدة للمحاضرات) */}
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-right border-collapse border-2 border-black text-black table-fixed">
                      {/* ترويسة الأعمدة */}
                      <thead>
                        <tr className="bg-slate-100 border-b-2 border-black text-black">
                          <th className="p-2.5 text-center font-black border border-black text-xs sm:text-sm w-24">
                            اليوم
                          </th>
                          {Array.from({ length: printMaxSlots }).map((_, slotIdx) => {
                            const slotLabels = ['المحاضرة الأولى', 'المحاضرة الثانية', 'المحاضرة الثالثة', 'المحاضرة الرابعة', 'المحاضرة الخامسة', 'المحاضرة السادسة'];
                            return (
                              <th key={slotIdx} className="p-2.5 text-center font-black border border-black text-xs sm:text-sm">
                                {slotLabels[slotIdx] || `المحاضرة ${slotIdx + 1}`}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      {/* صفوف الأيام والمحاضرات */}
                      <tbody>
                        {printScheduleDays.map((d) => {
                          const dayLecs = myLectures
                            .filter((l) => l.day === d.key)
                            .sort((a, b) => timeStringToMinutes(a.start_time) - timeStringToMinutes(b.start_time));

                          if (dayLecs.length === 0) {
                            return (
                              <tr key={d.key} className="border-b border-black">
                                <td className="p-2.5 text-center font-black border border-black bg-slate-50 text-black text-xs sm:text-sm">
                                  {d.label_ar}
                                </td>
                                <td
                                  colSpan={printMaxSlots}
                                  className="p-3 text-center font-black border border-black bg-white text-black text-xs sm:text-sm"
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
                                    <td key={slotIdx} className="p-2 text-center text-black font-black border border-black bg-white align-middle text-sm">
                                      —
                                    </td>
                                  );
                                }
                                const typeLabel = lec.type === 'practical' ? 'عملي' : lec.type === 'tutorial' ? 'حلقة نقاشية' : 'نظري';
                                return (
                                  <td key={slotIdx} className="p-2 border border-black bg-white align-top text-right text-xs">
                                    {/* توقيت المحاضرة ونوعها */}
                                    <div className="flex items-center justify-between border-b border-black pb-1 mb-1 font-black">
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
                                    {/* المرحلة والدراسة والقاعة */}
                                    <div className="text-[10px] font-black text-black space-y-0.5 pt-1 border-t border-dashed border-black">
                                      <div className="truncate">
                                        <span className="text-black font-black">المرحلة: </span>
                                        <span className="text-black font-black">المرحلة {getStageNameInArabic(lec.stage_number || 1)} ({lec.study_type === 'evening' ? 'مسائي' : 'صباحي'})</span>
                                      </div>
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

                  {/* ✍️ 3. التواقيع والأختام الرسمية المعتمدة */}
                  <div className="grid grid-cols-4 gap-4 text-center pt-6 mt-4 border-t-2 border-black text-black">
                    <div>
                      <p className="font-black text-xs sm:text-sm text-black">عضو هيئة التدريس</p>
                      <p className="font-black text-[11px] text-black mt-1">{teacherName}</p>
                      <div className="mt-5 text-[10px] font-black text-black">التوقيع: ____________________</div>
                    </div>
                    <div>
                      <p className="font-black text-xs sm:text-sm text-black">مقرر القسم العلمي</p>
                      <p className="font-black text-[11px] text-black mt-1">{resolvedRapporteurName}</p>
                      <div className="mt-5 text-[10px] font-black text-black">التوقيع: ____________________</div>
                    </div>
                    <div>
                      <p className="font-black text-xs sm:text-sm text-black">رئيس قسم {departmentName}</p>
                      <p className="font-black text-[11px] text-black mt-1">{resolvedHeadName}</p>
                      <div className="mt-5 text-[10px] font-black text-black">التوقيع: ____________________</div>
                    </div>
                    <div>
                      <p className="font-black text-xs sm:text-sm text-black">الختم والتصديق / عمادة الكلية</p>
                      <p className="font-black text-[11px] text-black mt-1">أ.د. حيدر جاسم كاظم</p>
                      <div className="mt-5 text-[10px] font-black text-black">التوقيع: ____________________</div>
                    </div>
                  </div>

                  {/* 📝 4. التذييل والتوثيق الإلكتروني */}
                  <div className="flex items-center justify-between text-[10px] font-black text-black pt-2 border-t border-black">
                    <span>المنصة الأكاديمية المركزية — مسار بولونيا التعليمي — جامعة الإمام جعفر الصادق (ع) - فرع ميسان</span>
                    <span>وثيقة نصاب تدريسي رسمية صادرة إلكترونياً وغير قابلة للشطب أو التعديل اليدوي</span>
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
