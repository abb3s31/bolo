'use client'; // ⚡ ينفذ بالعميل

//  لوحة تحكم الأستاذ الأكاديمية - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect } from 'react'; // 🔗 رياكت
import Link from 'next/link'; // 🔗 نكست
import Image from 'next/image'; // 🖼️ الصور
import { 
  getCurrentSessionUser, 
  syncAcademicYearFromSupabase, 
  subscribeToAcademicYearChanges,
  syncTeacherCoursesFromSupabase,
  syncCoursesFromSupabase,
  syncProfilesFromSupabase,
  syncScheduleLecturesFromSupabase,
  syncScheduleConfigsFromSupabase,
  syncFinalExamSchedulesFromSupabase,
  syncFinalExamSlotsFromSupabase
} from '@/lib/supabase-client'; // 🔌 الجلسة والمزامنة السحابية للعام الدراسي والتكليفات والجداول والامتحانات
import { getStoredData, INITIAL_COURSES, INITIAL_TEACHER_COURSES, INITIAL_SCHEDULE_LECTURES, INITIAL_SCHEDULE_CONFIGS, INITIAL_FINAL_EXAM_SCHEDULES, INITIAL_FINAL_EXAM_SLOTS, INITIAL_PROFILES, getAcademicYear, formatAcademicYearDisplay } from '@/lib/mock-data'; // 💾 البيانات
import { UserProfile, Course, TeacherCourse, ScheduleLecture, DepartmentScheduleConfig, FinalExamSchedule, FinalExamSlot } from '@/types'; // 🔗 الأنواع
import { reconcileCoursesWithTeacherCourses } from '@/app/admin/department-portal/page'; // 🔄 محرك التوفيق والتزامن المركزي بين المواد والتكليفات
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧮 التعرف الذكي على جنس الطلاب
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 دالة أسماء المراحل بالعربية
import { BookOpen, ChevronLeft, Layers, Clock, Calendar, FileText, ShieldCheck, Users, Sun, Moon, Building2, GraduationCap, ArrowLeft, ClipboardCheck, Award, Lock, Unlock, RotateCcw, FlaskConical } from 'lucide-react'; // 🎨 الأيقونات SVG
import ZeroTrustGuard from '@/components/security/ZeroTrustGuard'; // 🛡️ حارس أمان Zero Trust
import TeacherScheduleTimeline from '@/components/schedule/TeacherScheduleTimeline'; // 🕒 مكون جدول ومواقيت الأستاذ
import TeacherExamDutiesView from '@/components/exams/TeacherExamDutiesView'; // 📝 مكون جدول المراقبات الامتحانية للأستاذ
import { TeacherAssessmentsManager } from '@/components/assessments/TeacherAssessmentsManager'; // 📚 مكون إدارة التكليفات والامتحانات الفصلية

// 📑 أنواع التبويبات المعتمدة في لوحة تحكم الأستاذ
export type TeacherDashboardTab = 'courses' | 'assessments' | 'schedule' | 'exams';

// 📋 مصفوفة التبويبات المعتمدة للتحقق
const VALID_TEACHER_TABS: readonly TeacherDashboardTab[] = [
  'courses',
  'assessments',
  'schedule',
  'exams'
] as const;

// 🏷️ عناوين ونصوص التبويبات لعنوان نافذة المتصفح
const TEACHER_TAB_TITLES: Record<TeacherDashboardTab, string> = {
  courses: 'المواد ورصد السعيات',
  assessments: 'التكليفات والامتحانات الفصلية',
  schedule: 'الجدول التدريسي الأسبوعي',
  exams: 'جدول المراقبات الامتحانية'
};

export default function TeacherDashboard() {
  // 📌 الحالات
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [teacherCourseItems, setTeacherCourseItems] = useState<TeacherCourse[]>([]);
  const [scheduleLectures, setScheduleLectures] = useState<ScheduleLecture[]>([]);
  const [scheduleConfigs, setScheduleConfigs] = useState<DepartmentScheduleConfig[]>([]);
  const [finalExamSchedules, setFinalExamSchedules] = useState<FinalExamSchedule[]>([]);
  const [finalExamSlots, setFinalExamSlots] = useState<FinalExamSlot[]>([]);
  const [activeDashboardView, setActiveDashboardView] = useState<TeacherDashboardTab>('courses');

  // 🗓️ حالة العام الدراسي المعتمد والمتزامن حياً مع السحابة
  const [academicYear, setAcademicYear] = useState<string>(() => getAcademicYear());

  // 🗓️ تبويب الكورس المختار (1: الكورس الأول, 2: الكورس الثاني) - في منتصف الصفحة
  const [activeSemester, setActiveSemester] = useState<1 | 2>(1);

  // 🔄 دالة مركزية لقراءة البيانات ومطابقة تكليفات الأستاذ بدقة ومرونة تامة
  const loadData = () => {
    // 👤 جلب المستخدم الحالي المسجل بالجلسة
    const user = getCurrentSessionUser();
    setCurrentUser(user);

    if (user) {
      // 💾 قراءة الجداول من التخزين المحلي
      const allProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES); // 👥 كافة الحسابات
      const rawCourses = getStoredData<Course[]>('courses', INITIAL_COURSES); // 📚 كافة المواد الخام
      const teacherCourses = getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES); // 📋 سجل التكليفات
      const { reconciledCourses: allCourses, reconciledTCs: allTCs } = reconcileCoursesWithTeacherCourses(rawCourses, teacherCourses, allProfiles); // 🔄 توفيق مركزي فوري لكافة المواد والتكليفات
      const allLecs = getStoredData<ScheduleLecture[]>('schedule_lectures', INITIAL_SCHEDULE_LECTURES); // 🕒 المحاضرات
      const allConfigs = getStoredData<DepartmentScheduleConfig[]>('department_schedule_configs', INITIAL_SCHEDULE_CONFIGS); // ⚙️ الإعدادات
      const allSchedules = getStoredData<FinalExamSchedule[]>('final_exam_schedules', INITIAL_FINAL_EXAM_SCHEDULES); // 📝 الامتحانات
      const allSlots = getStoredData<FinalExamSlot[]>('final_exam_slots', INITIAL_FINAL_EXAM_SLOTS); // 🪑 القاعات

      // 🔤 دالة تطبيع وتنظيف النصوص العربية لإزالة الفروقات الإملائية والمسافات الخفية
      const normalizeArabic = (s?: string) => {
        if (!s) return '';
        return s
          .trim()
          .toLowerCase()
          .replace(/[أإآ]/g, 'ا')
          .replace(/ة/g, 'ه')
          .replace(/ى/g, 'ي')
          .replace(/ئ/g, 'ي')
          .replace(/ؤ/g, 'و')
          .replace(/[^\p{L}\p{N}]/gu, '');
      };

      const userNormName = normalizeArabic(user.full_name); // 🔤 اسم الأستاذ المعياري
      const userCleanEmail = (user.generated_email || '').trim().toLowerCase(); // ✉️ البريد المنظف

      // 🔍 1. فلترة تكليفات المواد لهذا الأستاذ بالمعرف أو الاسم أو البريد الأكاديمي أو الرقم الجامعي من التكليفات الموفقة
      const myCourseItems = allTCs.filter((tc: TeacherCourse): boolean => {
        if (!user) return false;
        const tcNormName = normalizeArabic(tc.teacher_name); // 🔤 اسم الأستاذ بالسجل

        const matchId = Boolean(tc.teacher_id && user.id && String(tc.teacher_id).trim() === String(user.id).trim());
        const matchUniNum = Boolean(tc.teacher_id && user.university_number && String(tc.teacher_id).trim() === String(user.university_number).trim());
        const matchAuthId = Boolean(tc.teacher_id && user.auth_user_id && String(tc.teacher_id).trim() === String(user.auth_user_id).trim());
        const matchName = Boolean(tcNormName && userNormName && (tcNormName === userNormName || tcNormName.includes(userNormName) || userNormName.includes(tcNormName)));
        const matchEmail = Boolean(tc.teacher_id && userCleanEmail && String(tc.teacher_id).trim().toLowerCase() === userCleanEmail);
        
        // 🔗 فحص بروفايل الأستاذ في قائمة المستخدمين
        const linkedProf = allProfiles.find(
          (p) =>
            p.id === tc.teacher_id ||
            p.university_number === tc.teacher_id ||
            (p.generated_email && p.generated_email.toLowerCase() === String(tc.teacher_id).toLowerCase())
        );
        const matchLinkedProf = Boolean(
          linkedProf &&
            ((linkedProf.full_name && user.full_name && normalizeArabic(linkedProf.full_name) === userNormName) ||
              linkedProf.id === user.id ||
              (linkedProf.generated_email && userCleanEmail && linkedProf.generated_email.trim().toLowerCase() === userCleanEmail))
        );

        return matchId || matchUniNum || matchAuthId || matchName || matchEmail || matchLinkedProf;
      });

      // 🔍 2. استخراج المواد المسندة مباشرة للأستاذ في جدول المواد الرئيسي
      const directAssignedCourses = allCourses.filter((c) => {
        if (!user) return false;
        const thNorm = normalizeArabic(c.theory_teacher_name);
        const prNorm = normalizeArabic(c.practical_teacher_name);

        const matchTheoryId = Boolean(c.theory_teacher_id && user.id && String(c.theory_teacher_id).trim() === String(user.id).trim());
        const matchPracticalId = Boolean(c.practical_teacher_id && user.id && String(c.practical_teacher_id).trim() === String(user.id).trim());
        const matchTheoryAuth = Boolean(c.theory_teacher_id && user.auth_user_id && String(c.theory_teacher_id).trim() === String(user.auth_user_id).trim());
        const matchPracticalAuth = Boolean(c.practical_teacher_id && user.auth_user_id && String(c.practical_teacher_id).trim() === String(user.auth_user_id).trim());
        const matchTheoryUni = Boolean(c.theory_teacher_id && user.university_number && String(c.theory_teacher_id).trim() === String(user.university_number).trim());
        const matchPracticalUni = Boolean(c.practical_teacher_id && user.university_number && String(c.practical_teacher_id).trim() === String(user.university_number).trim());
        const matchTheoryName = Boolean(thNorm && userNormName && (thNorm === userNormName || thNorm.includes(userNormName) || userNormName.includes(thNorm)));
        const matchPracticalName = Boolean(prNorm && userNormName && (prNorm === userNormName || prNorm.includes(userNormName) || userNormName.includes(prNorm)));

        return matchTheoryId || matchPracticalId || matchTheoryAuth || matchPracticalAuth || matchTheoryUni || matchPracticalUni || matchTheoryName || matchPracticalName;
      });

      // 📚 3. تحويل تكليفات الأستاذ إلى كائنات مواد كاملة
      const convertedTCList: Course[] = myCourseItems.map((tc) => {
        const matchedCourse = allCourses.find(
          (c) =>
            (tc.course_id && String(c.id).trim() === String(tc.course_id).trim()) ||
            (tc.course_name && c.name && normalizeArabic(c.name) === normalizeArabic(tc.course_name)) ||
            (tc.course_id && c.code && normalizeArabic(c.code) === normalizeArabic(String(tc.course_id)))
        );
        if (matchedCourse) {
          return {
            ...matchedCourse,
            semester: tc.semester || matchedCourse.semester || 1,
          };
        }
        // 🛡️ إنشاء كائن مادة افتراضي في حال لم يتوفر في الكاش المحلي بعد
        const fallbackCourse: Course = {
          id: tc.course_id || tc.id,
          stage_id: 'stage-1',
          academic_year_id: 'year-2026',
          name: tc.course_name || 'مادة دراسية معتمدة',
          code: tc.course_id || 'CRS-01',
          department_id: tc.department_id || user.department_id || '',
          department_name: user.department_name || 'القسم الأكاديمي',
          stage_number: 1,
          semester: tc.semester || 1,
          credit_hours: 3,
          course_type: 'theory_only',
          created_at: tc.created_at || new Date().toISOString(),
        };
        return fallbackCourse;
      });

      // 🧹 4. دمج كافة مصادر المواد وإزالة التكرار
      const allAssignedList = [...directAssignedCourses, ...convertedTCList];
      const uniqueCourses = Array.from(
        new Map(allAssignedList.map((c) => [c.id || c.name || c.code, c])).values()
      );

      setProfiles(allProfiles);
      setAssignedCourses(uniqueCourses);
      setTeacherCourseItems(myCourseItems);
      setScheduleLectures(allLecs);
      setScheduleConfigs(allConfigs);
      setFinalExamSchedules(allSchedules);
      setFinalExamSlots(allSlots);
    }
  };

  // 🔄 تحميل المواد المسندة للأستاذ الحالي ومزامنة السحابة
  useEffect(() => {
    loadData();

    // ☁️ المزامنة السحابية الحية المتوازية للتكليفات والمواد والحسابات
    Promise.all([
      syncTeacherCoursesFromSupabase(),
      syncCoursesFromSupabase(),
      syncProfilesFromSupabase(),
      syncScheduleLecturesFromSupabase(),
      syncScheduleConfigsFromSupabase(),
      syncFinalExamSchedulesFromSupabase(),
      syncFinalExamSlotsFromSupabase()
    ]).then(() => {
      loadData(); // 🔄 إعادة تحميل وتوفيق البيانات لحظياً بعد اكتمال وصول بيانات السحابة
    }).catch((err) => {
      console.warn('تنبيه: تعذر إكمال المزامنة السحابية الشاملة للأستاذ:', err);
    });

    // 📡 الاستماع للأحداث اللحظية المباشرة بين النوافذ والتبويبات
    window.addEventListener('storage', loadData); // 💾 استماع للتخزين بين النوافذ
    window.addEventListener('semester-start-date-updated', loadData); // 📅 استماع لتحديث تاريخ انطلاق الفصل
    window.addEventListener('teacher_courses_updated', loadData);
    window.addEventListener('courses_updated', loadData);
    window.addEventListener('profiles_updated', loadData);
    window.addEventListener('final_exam_schedules_updated', loadData);
    window.addEventListener('final_exam_slots_updated', loadData);

    // ☁️ جلب ومزامنة العام الدراسي من السحابة
    if (typeof syncAcademicYearFromSupabase === 'function') {
      syncAcademicYearFromSupabase().then((liveYear) => {
        if (liveYear) setAcademicYear(liveYear);
      }).catch(() => {});
    }

    // 📡 الاشتراك بالبث اللحظي للعام الدراسي
    let unsubscribeYear: (() => void) | undefined;
    if (typeof subscribeToAcademicYearChanges === 'function') {
      unsubscribeYear = subscribeToAcademicYearChanges((liveYear) => {
        setAcademicYear(liveYear);
      });
    }

    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('semester-start-date-updated', loadData); // 🧹 تنظيف مستمع تاريخ الفصل
      window.removeEventListener('teacher_courses_updated', loadData);
      window.removeEventListener('courses_updated', loadData);
      window.removeEventListener('profiles_updated', loadData);
      window.removeEventListener('final_exam_schedules_updated', loadData);
      window.removeEventListener('final_exam_slots_updated', loadData);
      if (unsubscribeYear) unsubscribeYear();
    };
  }, []);

  // 🌐 1. مزامنة التبويب مع الرابط URL عند أول تحميل أو التنقل بالمتصفح
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncTabFromUrl = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab') as TeacherDashboardTab | null;
      if (tabParam && VALID_TEACHER_TABS.includes(tabParam)) {
        setActiveDashboardView(tabParam);
      }
    };

    syncTabFromUrl();
    window.addEventListener('popstate', syncTabFromUrl);
    return () => {
      window.removeEventListener('popstate', syncTabFromUrl);
    };
  }, []);

  // 🏷️ 2. تحديث اسم نافذة المتصفح ديناميكياً بحسب التبويب النشط للأستاذ
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const tabName = TEACHER_TAB_TITLES[activeDashboardView] || 'بوابة التدريسي';
    const deptTitle = currentUser?.department_name || 'القسم الأكاديمي';
    document.title = `${tabName} | ${currentUser?.full_name || 'تدريسي'} (${deptTitle}) — جامعة الإمام جعفر الصادق (ع)`;
  }, [activeDashboardView, currentUser]);

  // 🔀 3. دالة التبديل بين التبويبات وتحديث الرابط URL في المتصفح فورياً
  const handleTeacherTabSwitch = (newTab: TeacherDashboardTab) => {
    setActiveDashboardView(newTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.pushState({ tab: newTab }, '', url.toString());
    }
  };

  // 🔍 تصفية المواد المكلف بها الأستاذ بحسب الكورس المختار
  const filteredCourses = assignedCourses.filter((c) => (c.semester || 1) === activeSemester);

  return (
    <ZeroTrustGuard allowedRoles={['teacher']} redirectFallback="/?portal=teacher">
      {/* 🏛️ الحاوية العريضة لتقليل المساحات الجانبية الفارغة */}
      <div className="space-y-6 font-sans w-full max-w-[1900px] mx-auto px-2 sm:px-4 py-4" dir="rtl">

        {/* 🏛️ الهيدر الكحلي الفاخر الترحيبي للأستاذ مع إبراز القسم الأكاديمي بحدود ناعمة */}
        <div className="bg-white border border-slate-200 p-6 sm:p-7 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0">
              <Image src="/logo.webp" alt="جامعة الصادق فرع ميسان" width={90} height={90} className="object-contain" priority />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-4 py-1.5 bg-slate-950 text-white font-black text-base rounded-xl shadow-xs flex items-center gap-1.5">
                  <GraduationCap className="w-5 h-5 text-cyan-300" />
                  <span>بوابة التدريسي</span>
                </span>
                <span className="px-4 py-1.5 bg-blue-50 text-blue-950 border border-blue-300 font-black text-base rounded-xl flex items-center gap-1.5">
                  <Building2 className="w-5 h-5 text-blue-700" />
                  <span>قسم {(currentUser?.department_name || 'اللغة الإنجليزية').replace(/^قسم\s+/, '').trim()}</span>
                </span>
                <span className="px-4 py-1.5 bg-indigo-50 text-indigo-950 border border-indigo-300 font-black text-base rounded-xl flex items-center gap-1.5 shadow-2xs">
                  <Calendar className="w-5 h-5 text-indigo-700" />
                  <span>العام الدراسي: <bdi dir="ltr">{formatAcademicYearDisplay(academicYear)}</bdi></span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 flex items-center gap-2 mt-2">
                أهلاً بك، {currentUser?.full_name || 'أستاذ المادة'}
              </h1>
              <p className="text-base sm:text-lg text-slate-950 font-black mt-1.5 leading-relaxed">
                جامعة الإمام جعفر الصادق (ع) - فرع ميسان | الكادر التدريسي لقسم <strong className="text-blue-950 font-black">{(currentUser?.department_name || 'اللغة الإنجليزية').replace(/^قسم\s+/, '').trim()}</strong>
              </p>
              <p className="text-base sm:text-lg text-slate-800 font-black mt-0.5 leading-relaxed">
                لوحة رصد وإدخال درجات السعي الفصلية وفق مسار بولونيا للمواد المكلف بتدريسها
              </p>
            </div>
          </div>

          {/* 📊 بطاقة إحصائية سريعة للأستاذ مع الصباحي والمسائي */}
          {(() => {
            // 👥 حساب طلاب كافة المواد المكلف بها الأستاذ
            const teacherStudents = profiles.filter((p) => {
              if (p.role !== 'student') return false;
              return assignedCourses.some(
                (c) => (c.department_id === p.department_id || c.department_name === p.department_name) && c.stage_number === p.stage_number
              );
            });
            const totalTStds = teacherStudents.length;
            const totalTMorning = teacherStudents.filter((s) => (s.study_type || 'morning') === 'morning').length;
            const totalTEvening = totalTStds - totalTMorning;
            const totalTeacherEcts = assignedCourses.reduce((sum, c) => sum + (c.credit_hours || 0), 0); // 🎖️ إجمالي وحدات ECTS المكلف بها

            return (
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-slate-50 border border-slate-300 p-4 rounded-2xl text-base font-black text-black">
                <div className="text-center px-2.5 sm:px-3">
                  <span className="text-black text-xs sm:text-sm font-black flex items-center justify-center gap-1 mb-1">
                    <BookOpen className="w-4 h-4 text-black" />
                    <span>المواد المكلف بها</span>
                  </span>
                  <span className="text-black font-black text-lg sm:text-xl">{assignedCourses.length} مادة</span>
                </div>
                <div className="w-px h-10 bg-slate-300"></div>
                <div className="text-center px-2.5 sm:px-3">
                  <span className="text-sky-950 text-xs sm:text-sm font-black flex items-center gap-1 justify-center mb-1">
                    <Award className="w-4 h-4 text-sky-800" />
                    <span>العبء التدريسي</span>
                  </span>
                  <span className="text-sky-950 font-black text-lg sm:text-xl">{totalTeacherEcts} ECTS</span>
                </div>
                <div className="w-px h-10 bg-slate-300"></div>
                <div className="text-center px-2.5 sm:px-3">
                  <span className="text-black text-xs sm:text-sm font-black flex items-center justify-center gap-1 mb-1">
                    <Users className="w-4 h-4 text-black" />
                    <span>إجمالي الطلاب</span>
                  </span>
                  <span className="text-black font-black text-lg sm:text-xl">{totalTStds}</span>
                </div>
                <div className="w-px h-10 bg-slate-300"></div>
                <div className="text-center px-2.5 sm:px-3">
                  <span className="text-emerald-950 text-xs sm:text-sm font-black flex items-center gap-1 justify-center mb-1">
                    <Sun className="w-4 h-4 text-emerald-800" />
                    <span>الصباحي</span>
                  </span>
                  <span className="text-emerald-950 font-black text-lg sm:text-xl">{totalTMorning}</span>
                </div>
                <div className="w-px h-10 bg-slate-300"></div>
                <div className="text-center px-2.5 sm:px-3">
                  <span className="text-indigo-950 text-xs sm:text-sm font-black flex items-center gap-1 justify-center mb-1">
                    <Moon className="w-4 h-4 text-indigo-800" />
                    <span>المسائي</span>
                  </span>
                  <span className="text-indigo-950 font-black text-lg sm:text-xl">{totalTEvening}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* 🧭 محدد العرض الرئيسي: المواد ورصد السعيات أو الجدول التدريسي أو جدول المراقبات */}
        <div className="flex justify-center sticky top-20 z-40">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-5xl bg-white/95 backdrop-blur-md p-3 rounded-3xl border border-slate-200 shadow-sm">
            <button
              type="button"
              id="teacher-tab-courses"
              onClick={() => handleTeacherTabSwitch('courses')}
              className={`py-4 px-4 rounded-2xl text-center transition-all cursor-pointer flex items-center justify-center gap-2.5 select-none active:scale-[0.98] ${activeDashboardView === 'courses'
                  ? 'bg-[#0F2942] text-white shadow-md font-black ring-2 ring-blue-500/30'
                  : 'bg-slate-50 text-black hover:bg-slate-100 font-black border border-slate-300'
                }`}
            >
              <BookOpen className="w-6 h-6 text-cyan-300" />
              <span className="text-lg font-black">المواد والسعيات</span>
            </button>

            <button
              type="button"
              id="teacher-tab-assessments"
              onClick={() => handleTeacherTabSwitch('assessments')}
              className={`py-4 px-4 rounded-2xl text-center transition-all cursor-pointer flex items-center justify-center gap-2.5 select-none active:scale-[0.98] ${activeDashboardView === 'assessments'
                  ? 'bg-cyan-700 text-white shadow-md font-black ring-2 ring-cyan-400'
                  : 'bg-slate-50 text-black hover:bg-slate-100 font-black border border-slate-300'
                }`}
            >
              <FileText className="w-6 h-6 text-cyan-200" />
              <span className="text-lg font-black">التكليفات</span>
            </button>

            <button
              type="button"
              id="teacher-tab-schedule"
              onClick={() => handleTeacherTabSwitch('schedule')}
              className={`py-4 px-4 rounded-2xl text-center transition-all cursor-pointer flex items-center justify-center gap-2.5 select-none active:scale-[0.98] ${activeDashboardView === 'schedule'
                  ? 'bg-indigo-700 text-white shadow-md font-black ring-2 ring-indigo-400'
                  : 'bg-slate-50 text-black hover:bg-slate-100 font-black border border-slate-300'
                }`}
            >
              <Clock className="w-6 h-6 text-indigo-200" />
              <span className="text-lg font-black">جدولي التدريسي</span>
            </button>

            <button
              type="button"
              id="teacher-tab-exams"
              onClick={() => handleTeacherTabSwitch('exams')}
              className={`py-4 px-4 rounded-2xl text-center transition-all cursor-pointer flex items-center justify-center gap-2.5 select-none active:scale-[0.98] ${activeDashboardView === 'exams'
                  ? 'bg-rose-700 text-white shadow-md font-black ring-2 ring-rose-400'
                  : 'bg-slate-50 text-black hover:bg-slate-100 font-black border border-slate-300'
                }`}
            >
              <ShieldCheck className="w-6 h-6 text-rose-200" />
              <span className="text-lg font-black">جدول المراقبات</span>
            </button>
          </div>
        </div>

        {/* 📚 1. شاشة إدارة التكليفات والامتحانات الفصلية للأستاذ */}
        {activeDashboardView === 'assessments' && currentUser && (
          <TeacherAssessmentsManager
            teacherId={currentUser.id}
            teacherName={currentUser.full_name}
            assignedCourses={teacherCourseItems.length > 0 ? teacherCourseItems : assignedCourses.map((c) => ({
              id: `tc-${c.id}`,
              teacher_id: currentUser.id,
              teacher_name: currentUser.full_name,
              course_id: c.id,
              course_name: c.name,
              department_id: c.department_id,
              semester: c.semester || 1,
            }))}
          />
        )}

        {/* 🗓️ 2. شاشة الجدول التدريسي والـ Timeline للأستاذ */}
        {activeDashboardView === 'schedule' && currentUser && (
          <TeacherScheduleTimeline
            teacherId={currentUser.id}
            teacherName={currentUser.full_name}
            departmentName={currentUser.department_name || 'القسم الأكاديمي'}
            departmentId={currentUser.department_id}
            lectures={scheduleLectures}
            configs={scheduleConfigs}
            academicYear={academicYear} // 🗓️ تمرير العام الدراسي المعتمد المتزامن
            initialSemester={activeSemester}
          />
        )}

        {/* 📝 2. شاشة جدول المراقبات والإشراف الامتحاني للأستاذ */}
        {activeDashboardView === 'exams' && currentUser && (
          <TeacherExamDutiesView
            currentUser={currentUser}
            schedules={finalExamSchedules}
            slots={finalExamSlots}
          />
        )}

        {/* 🎓 3. شاشة المواد المكلف بها ورصد الدرجات بحدود ناعمة */}
        {activeDashboardView === 'courses' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-7">

            <div className="text-center space-y-1.5">
              <h2 className="text-lg sm:text-xl font-black text-black flex items-center justify-center gap-2.5">
                <Layers className="w-6 h-6 text-black" />
                <span>اختر الكورس الدراسي لعرض وإدخال الدرجات</span>
              </h2>
            </div>

            {/* 🔘 أزرار التبديل في منتصف الشاشة بخطوط واضحة وأيقونات SVG */}
            <div className="flex justify-center">
              <div className="grid grid-cols-2 gap-3.5 w-full max-w-xl bg-slate-50 p-2.5 rounded-2xl border border-slate-300">

                <button
                  onClick={() => setActiveSemester(1)}
                  className={`py-4 px-5 rounded-2xl text-center transition-all cursor-pointer ${activeSemester === 1
                      ? 'bg-[#0F2942] text-white shadow-md font-black ring-2 ring-blue-500/20'
                      : 'bg-white text-black hover:bg-slate-200 font-black border border-slate-300'
                    }`}
                >
                  <div className="text-lg font-black">الكورس الأول</div>
                </button>

                <button
                  onClick={() => setActiveSemester(2)}
                  className={`py-4 px-5 rounded-2xl text-center transition-all cursor-pointer ${activeSemester === 2
                      ? 'bg-[#0F2942] text-white shadow-md font-black ring-2 ring-blue-500/20'
                      : 'bg-white text-black hover:bg-slate-200 font-black border border-slate-300'
                    }`}
                >
                  <div className="text-lg font-black">الكورس الثاني</div>
                </button>

              </div>
            </div>

            {/* 📘 2. بطاقات المواد المسندة للأستاذ على شكل كروت مستوردة */}
            <div className="space-y-4 pt-2">
              <h3 className="text-lg sm:text-xl font-black text-black flex items-center gap-2.5">
                <BookOpen className="w-6 h-6 text-black" />
                <span>مواد {activeSemester === 1 ? 'الكورس الأول' : 'الكورس الثاني'} المكلف بها: ({filteredCourses.length})</span>
              </h3>

              <div className="space-y-6">
                {filteredCourses.map((course) => {
                  // 👥 استخراج وحساب طلاب المرحلة والقسم لهذه المادة (صباحي ومسائي وذكور وإناث)
                  let courseStudents = profiles.filter(
                    (p) =>
                      p.role === 'student' &&
                      (p.department_id === course.department_id || p.department_name === course.department_name) &&
                      p.stage_number === course.stage_number
                  );
                  if (courseStudents.length === 0) {
                    courseStudents = profiles.filter(
                      (p) =>
                        p.role === 'student' &&
                        (p.department_id === course.department_id || p.department_name === course.department_name)
                    );
                  }
                  const totalStds = courseStudents.length;
                  const stdMorning = courseStudents.filter((s) => (s.study_type || 'morning') === 'morning').length;
                  const stdEvening = totalStds - stdMorning;
                  const stdMales = courseStudents.filter((s) => (s.gender || detectArabicGender(s.full_name)) === 'male').length;
                  const stdFemales = totalStds - stdMales;
                  const malePct = totalStds > 0 ? Math.round((stdMales / totalStds) * 100) : 0;
                  const femalePct = totalStds > 0 ? Math.round((stdFemales / totalStds) * 100) : 0;
                  const morningPct = totalStds > 0 ? Math.round((stdMorning / totalStds) * 100) : 0;
                  const eveningPct = totalStds > 0 ? Math.round((stdEvening / totalStds) * 100) : 0;

                  return (
                    <div 
                      key={course.id} 
                      className="group relative w-full bg-white border-2 border-slate-200 hover:border-[#0F2942] rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 space-y-6 overflow-hidden"
                    >
                      {/* 🏷️ 1. الشريط العلوي للكارت الممتد: معلومات المادة والمرحلة والكورس والوحدات */}
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-slate-100 pb-5">
                        {/* اليمين: كود المادة واسمها والقسم */}
                        <div className="flex items-center gap-3.5">
                          <span className="px-4 py-2 bg-[#0F2942] text-white font-mono font-black text-base sm:text-lg rounded-2xl shadow-xs tracking-wider">
                            {course.code}
                          </span>
                          <div>
                            <h3 className="text-2xl sm:text-3xl font-black text-black group-hover:text-[#0F2942] transition-colors leading-tight">
                              {course.name}
                            </h3>
                            {course.department_name && (
                              <span className="text-xs sm:text-sm font-black text-black block mt-0.5">
                                {course.department_name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* اليسار: شارات المرحلة والكورس والوحدات وحالة رصد الأدوار الأكاديمية */}
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="px-3.5 py-1.5 bg-slate-100 text-slate-900 border-2 border-slate-300 rounded-xl text-sm sm:text-base font-black flex items-center gap-1.5 shadow-2xs">
                            <GraduationCap className="w-5 h-5 text-[#0F2942]" />
                            <span>المرحلة {getStageNameInArabic(course.stage_number || 1)}</span>
                          </span>

                          <span className="px-3.5 py-1.5 bg-slate-100 text-slate-900 border-2 border-slate-300 rounded-xl text-sm sm:text-base font-black flex items-center gap-1.5 shadow-2xs">
                            <Layers className="w-4 h-4 text-[#0F2942]" />
                            <span>{activeSemester === 1 ? 'الكورس الأول' : 'الكورس الثاني'}</span>
                          </span>

                          <span className="px-3.5 py-1.5 bg-slate-100 text-slate-900 border-2 border-slate-300 rounded-xl text-sm sm:text-base font-black flex items-center gap-1.5 shadow-2xs">
                            <Award className="w-4 h-4 text-[#0F2942]" />
                            <span>{course.credit_hours || 5} وحدات معتمدة (ECTS)</span>
                          </span>

                          {/* 🏷️ شارة صفة التكليف الأكاديمي للأستاذ (نظري فقط / عملي فقط / نظري وعملي) */}
                          {(() => {
                            const myTC = teacherCourseItems.find((tc: TeacherCourse): boolean => tc.course_id === course.id || tc.course_name === course.name);
                            const role = myTC?.role_in_course || (course.has_practical ? 'both' : 'theory');
                            if (role === 'both') {
                              return (
                                <span className="px-3.5 py-1.5 bg-purple-50 text-purple-950 border-2 border-purple-300 rounded-xl text-sm sm:text-base font-black flex items-center gap-1.5 shadow-2xs">
                                  <Layers className="w-4 h-4 text-purple-700" />
                                  <span>مكلف نظري وعملي</span>
                                </span>
                              );
                            }
                            if (role === 'practical') {
                              return (
                                <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-950 border-2 border-emerald-300 rounded-xl text-sm sm:text-base font-black flex items-center gap-1.5 shadow-2xs">
                                  <FlaskConical className="w-4 h-4 text-emerald-700" />
                                  <span>مكلف عملي فقط</span>
                                </span>
                              );
                            }
                            return (
                              <span className="px-3.5 py-1.5 bg-blue-50 text-blue-950 border-2 border-blue-300 rounded-xl text-sm sm:text-base font-black flex items-center gap-1.5 shadow-2xs">
                                <BookOpen className="w-4 h-4 text-blue-700" />
                                <span>مكلف نظري فقط</span>
                              </span>
                            );
                          })()}

                          {/* 🔓 شارة حالة الامتحان النهائي (الدور الأول) تظهر حصراً إذا كان متاحاً للرصد */}
                          {course.is_final_exam_enabled && (
                            <span className="px-3.5 py-1.5 bg-slate-100 text-slate-900 border-2 border-slate-300 rounded-xl text-sm sm:text-base font-black flex items-center gap-1.5 shadow-2xs">
                              <Unlock className="w-4 h-4 text-emerald-600" />
                              <span>النهائي (دور 1): متاح للرصد</span>
                            </span>
                          )}

                          {/* 🔄 شارة حالة فترة الدور الثاني للمادة */}
                          {course.is_supplementary_exam_enabled && (
                            <span className="px-3.5 py-1.5 bg-slate-100 text-slate-900 border-2 border-slate-300 rounded-xl text-sm sm:text-base font-black flex items-center gap-1.5 shadow-2xs">
                              <RotateCcw className="w-4 h-4 text-[#0F2942]" />
                              <span>الدور الثاني: متاح للرصد</span>
                            </span>
                          )}

                          <span className="px-3.5 py-1.5 bg-slate-100 text-slate-900 border-2 border-slate-300 rounded-xl text-sm sm:text-base font-black flex items-center gap-1.5 shadow-2xs">
                            <ShieldCheck className="w-4 h-4 text-[#0F2942]" />
                            <span>مسار بولونيا • 15 أسبوعاً</span>
                          </span>
                        </div>
                      </div>

                      {/* 📊 2. وسط الكارت الممتد: شبكة إحصائيات الطلاب المستفيدة من كامل العرض */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                        {/* لوحة الطلاب والدراسة (صباحي / مسائي) - 6 أعمدة */}
                        <div className="lg:col-span-6 bg-slate-50 border-2 border-slate-200 p-5 rounded-2xl space-y-3.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 text-black font-black">
                              <span className="p-2.5 bg-blue-100 text-blue-950 rounded-xl">
                                <Users className="w-5 h-5 text-blue-950" />
                              </span>
                              <span className="text-base sm:text-lg font-black">
                                إجمالي المسجلين في المادة: <strong className="text-blue-950 text-xl font-mono">{totalStds}</strong> طالب/ـة
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="bg-white border-2 border-emerald-200 p-3 rounded-xl flex items-center justify-between shadow-2xs">
                              <span className="flex items-center gap-1.5 text-sm sm:text-base font-black text-emerald-950">
                                <Sun className="w-4 h-4 text-emerald-700" />
                                <span>الصباحي:</span>
                              </span>
                              <strong className="text-emerald-950 font-mono text-base font-black">{stdMorning} ({morningPct}%)</strong>
                            </div>

                            <div className="bg-white border-2 border-indigo-200 p-3 rounded-xl flex items-center justify-between shadow-2xs">
                              <span className="flex items-center gap-1.5 text-sm sm:text-base font-black text-indigo-950">
                                <Moon className="w-4 h-4 text-indigo-700" />
                                <span>المسائي:</span>
                              </span>
                              <strong className="text-indigo-950 font-mono text-base font-black">{stdEvening} ({eveningPct}%)</strong>
                            </div>
                          </div>
                        </div>

                        {/* لوحة توزيع الجنس (ذكور / إناث مع شريط النسبة) - 6 أعمدة */}
                        <div className="lg:col-span-6 bg-slate-50 border-2 border-slate-200 p-5 rounded-2xl space-y-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-black font-black text-base sm:text-lg">توزيع الطلبة حسب الجنس:</span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm sm:text-base font-black text-blue-950 flex items-center gap-1.5 bg-white border border-blue-200 px-3 py-1 rounded-xl shadow-2xs">
                                <span className="w-3 h-3 rounded-full bg-blue-700"></span>
                                <span>الذكور: <strong className="font-mono text-base">{stdMales}</strong> ({malePct}%)</span>
                              </span>
                              <span className="text-sm sm:text-base font-black text-rose-950 flex items-center gap-1.5 bg-white border border-rose-200 px-3 py-1 rounded-xl shadow-2xs">
                                <span className="w-3 h-3 rounded-full bg-rose-600"></span>
                                <span>الإناث: <strong className="font-mono text-base">{stdFemales}</strong> ({femalePct}%)</span>
                              </span>
                            </div>
                          </div>

                          {/* شريط التوزيع البصري العريض والواضح */}
                          <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden flex border border-slate-300 shadow-inner">
                            <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${malePct}%` }} title={`الذكور: ${malePct}%`}></div>
                            <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${femalePct}%` }} title={`الإناث: ${femalePct}%`}></div>
                          </div>

                          <div className="flex items-center justify-between text-xs font-black text-black">
                            <span>نسبة الذكور ({malePct}%)</span>
                            <span>نسبة الإناث ({femalePct}%)</span>
                          </div>
                        </div>
                      </div>

                      {/* 🚀 3. فوتر الكارت الممتد وزر الانتقال المريح */}
                      <div className="pt-4 border-t-2 border-slate-100 flex flex-wrap items-center justify-between gap-4">
                        <div className="text-sm sm:text-base text-black font-black flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl shadow-2xs">
                          <ShieldCheck className="w-5 h-5 text-blue-900 shrink-0" />
                          <span>المادة معتمدة ومسندة رسمياً من رئاسة القسم</span>
                        </div>

                        <Link
                          href={`/teacher/courses/${course.id}`}
                          className="px-8 py-3.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base sm:text-lg shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-[#1e4570] group-hover:scale-[1.01] active:scale-95"
                        >
                          <ClipboardCheck className="w-5 h-5 text-cyan-300" />
                          <span>رصد الدرجات والحضور</span>
                          <ArrowLeft className="w-5 h-5 text-white mr-1" />
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {filteredCourses.length === 0 && (
                  <div className="text-center py-14 bg-slate-50 rounded-3xl border border-slate-200 text-slate-950 text-base sm:text-lg font-black">
                    لم تكلف بمواد دراسية في {activeSemester === 1 ? 'الكورس الأول' : 'الكورس الثاني'} بعد.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </ZeroTrustGuard>
  );
}
