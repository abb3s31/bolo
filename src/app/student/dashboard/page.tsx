'use client'; // ⚡ ينفذ بالعميل

import { useState, useEffect, useMemo } from 'react'; // 🔗 رياكت
import Image from 'next/image'; // 🖼️ الصور
import { 
  getCurrentSessionUser, 
  syncTuitionRecordsFromSupabase, 
  syncAcademicYearFromSupabase, 
  subscribeToAcademicYearChanges,
  syncGradesFromSupabase,
  syncCoursesFromSupabase,
  syncAttendanceRecordsFromSupabase,
  syncScheduleLecturesFromSupabase,
  syncScheduleConfigsFromSupabase,
  syncFinalExamSchedulesFromSupabase,
  syncFinalExamSlotsFromSupabase,
  syncAcademicTasksFromSupabase,
  syncTaskSubmissionsFromSupabase,
  syncCampusAnnouncementsFromSupabase,
} from '@/lib/supabase-client'; // 🔌 الجلسة والمزامنة السحابية الشاملة لكافة الجداول
import { getStoredData, INITIAL_GRADES, INITIAL_COURSES, INITIAL_SCHEDULE_LECTURES, INITIAL_SCHEDULE_CONFIGS, INITIAL_ATTENDANCE_RECORDS, INITIAL_FINAL_EXAM_SCHEDULES, INITIAL_FINAL_EXAM_SLOTS, INITIAL_TUITION_RECORDS, INITIAL_ACADEMIC_TASKS, INITIAL_STUDENT_SUBMISSIONS, INITIAL_PROFILES, getAcademicYear, formatAcademicYearDisplay } from '@/lib/mock-data'; // 💾 البيانات والملفات الشخصية
import { UserProfile, Grade, Course, ScheduleLecture, DepartmentScheduleConfig, StudentAttendanceRecord, FinalExamSchedule, FinalExamSlot, StudentTuitionRecord, CourseAcademicTask, StudentTaskSubmission, CampusAnnouncement } from '@/types'; // 🔗 الأنواع الرسمية
import { calculateCourseworkTotal, calculateFinalTotal, getLetterGrade, getStageNameInArabic, getCourseAssessmentScheme, isStudentPassedFirstRound } from '@/lib/grade-utils'; // 🧮 الحسابات وأسماء المراحل والمخطط وفحص الدور الأول
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧮 التعرف الذكي على جنس الطالب
import { exportStudentTranscriptPDF } from '@/lib/pdf-export'; // 📄 مولد وثيقة السعي PDF
import { getTodayDayOfWeek, timeStringToMinutes } from '@/lib/schedule-utils'; // 🕒 أدوات الجدول واليوم
import { BookOpen, Layers, FileText, Target, Activity, FileSpreadsheet, ChevronDown, ChevronUp, Calendar, Download, FlaskConical, Clock, UserCheck, ShieldCheck, Award, Sparkles, Radio, ArrowLeft, CheckSquare, ClipboardList, CreditCard, AlertTriangle, GraduationCap, Sun, Moon, Megaphone, Lock } from 'lucide-react'; // 🎨 الأيقونات
import ZeroTrustGuard from '@/components/security/ZeroTrustGuard'; // 🛡️ حارس أمان Zero Trust
import StudentScheduleTimeline from '@/components/schedule/StudentScheduleTimeline'; // 🗓️ مكون الـ Timeline والجدول التفاعلي
import StudentAttendanceView from '@/components/attendance/StudentAttendanceView'; // 📋 مكون سجل الحضور والغيابات للطالب
import StudentFinalExamScheduleView from '@/components/exams/StudentFinalExamScheduleView'; // 📝 جدول الامتحانات النهائية للطالب
import StudentTuitionFinancialCard from '@/components/tuition/StudentTuitionFinancialCard'; // 💳 بطاقة الموقف المالي للأقساط
import { StudentAssessmentsPortal } from '@/components/assessments/StudentAssessmentsPortal'; // 📚 مركز التكليفات والامتحانات الفصلية
import StudentAnnouncementsView from '@/components/announcements/StudentAnnouncementsView'; // 📢 مكون استعراض التعميمات والتبليغات الرسمية للطلاب

// 📑 أنواع التبويبات المعتمدة في لوحة تحكم الطالب
export type StudentDashboardTab = 'grades' | 'schedule' | 'attendance' | 'exams' | 'assessments' | 'tuition' | 'announcements';

// 📋 مصفوفة التبويبات المعتمدة للتحقق
const VALID_STUDENT_TABS: readonly StudentDashboardTab[] = [
  'grades',
  'assessments',
  'schedule',
  'attendance',
  'exams',
  'tuition',
  'announcements'
] as const;

// 🏷️ عناوين ونصوص التبويبات لعنوان نافذة المتصفح
const STUDENT_TAB_TITLES: Record<StudentDashboardTab, string> = {
  grades: 'لوحة درجاتي وسعي المواد',
  assessments: 'التكليفات والامتحانات الفصلية',
  schedule: 'الجدول الدراسي الأسبوعي',
  attendance: 'سجل الحضور والغيابات',
  exams: 'جدول الامتحانات النهائية',
  tuition: 'الموقف المالي والأقساط',
  announcements: 'التعميمات والتبليغات الرسمية'
};

export default function StudentDashboard() {
  // 📌 الحالات
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [studentGrades, setStudentGrades] = useState<Grade[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [scheduleLectures, setScheduleLectures] = useState<ScheduleLecture[]>([]);
  const [scheduleConfigs, setScheduleConfigs] = useState<DepartmentScheduleConfig[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendanceRecord[]>([]);
  const [finalExamSchedules, setFinalExamSchedules] = useState<FinalExamSchedule[]>([]);
  const [finalExamSlots, setFinalExamSlots] = useState<FinalExamSlot[]>([]);
  const [tuitionRecords, setTuitionRecords] = useState<StudentTuitionRecord[]>([]);
  const [academicTasks, setAcademicTasks] = useState<CourseAcademicTask[]>([]);
  const [submissions, setSubmissions] = useState<StudentTaskSubmission[]>([]);
  const [campusAnnouncements, setCampusAnnouncements] = useState<CampusAnnouncement[]>(() =>
    getStoredData<CampusAnnouncement[]>('campus_official_announcements', [])
  );
  const [activeDashboardView, setActiveDashboardView] = useState<StudentDashboardTab>('grades');
  const [isExportingPDF, setIsExportingPDF] = useState(false); // ⏳ حالة تصدير PDF

  // 🗓️ حالة العام الدراسي المعتمد والمتزامن مع السحابة
  const [academicYear, setAcademicYear] = useState<string>(() => getAcademicYear());
  
  // 🗓️ تبويب الكورس المختار (1: الكورس الأول, 2: الكورس الثاني) - في منتصف الصفحة
  const [activeSemester, setActiveSemester] = useState<1 | 2>(1);

  // 📂 حالة المواد المفتوحة/المطوية عند النقر على المادة
  const [expandedCourseIds, setExpandedCourseIds] = useState<string[]>([]);

  // 🔄 تحميل بيانات الطالب ودرجاته وحماية الجلسة ومزامنة العام الدراسي
  useEffect(() => {
    const user = getCurrentSessionUser();
    if (!user || user.role !== 'student') {
      window.location.href = '/?portal=student'; // 🔒 حماية الجلسة من الرجوع وتوجيهه لبوابة الطلاب المركزية
      return;
    }
    setCurrentUser(user);

    const allGrades = getStoredData<Grade[]>('grades', INITIAL_GRADES);
    const allCourses = getStoredData<Course[]>('courses', INITIAL_COURSES);
    const allLectures = getStoredData<ScheduleLecture[]>('schedule_lectures', INITIAL_SCHEDULE_LECTURES);
    const allConfigs = getStoredData<DepartmentScheduleConfig[]>('department_schedule_configs', INITIAL_SCHEDULE_CONFIGS);
    const allAttendance = getStoredData<StudentAttendanceRecord[]>('student_attendance_records', INITIAL_ATTENDANCE_RECORDS);
    const allExamSchedules = getStoredData<FinalExamSchedule[]>('final_exam_schedules', INITIAL_FINAL_EXAM_SCHEDULES);
    const allExamSlots = getStoredData<FinalExamSlot[]>('final_exam_slots', INITIAL_FINAL_EXAM_SLOTS);
    const allTuition = getStoredData<StudentTuitionRecord[]>('student_tuition_records', INITIAL_TUITION_RECORDS);
    const allTasks = getStoredData<CourseAcademicTask[]>('app_course_academic_tasks', INITIAL_ACADEMIC_TASKS);
    const allSubs = getStoredData<StudentTaskSubmission[]>('task_student_submissions', INITIAL_STUDENT_SUBMISSIONS);
    
    // 🔍 تصفية درجات هذا الطالب تحديداً
    const myGrades = allGrades.filter((g) => g.student_id === user.id || g.university_number === user.university_number);

    setStudentGrades(myGrades);
    setCourses(allCourses);
    setScheduleLectures(allLectures);
    setScheduleConfigs(allConfigs);
    setAttendanceRecords(allAttendance);
    setFinalExamSchedules(allExamSchedules);
    setFinalExamSlots(allExamSlots);
    setTuitionRecords(allTuition);
    setAcademicTasks(allTasks);
    setSubmissions(allSubs);

    // 🔓 فتح كافة كروت المواد تلقائياً في البداية
    setExpandedCourseIds(myGrades.map((g) => g.id));

    // ⚡ 💳 مزامنة حية ومباشرة للأقساط مع سحابة Supabase
    syncTuitionRecordsFromSupabase()
      .then((cloudTuition) => {
        if (cloudTuition && cloudTuition.length > 0) {
          setTuitionRecords(cloudTuition);
        }
      })
      .catch((err) => {
        console.warn('تنبيه: تعذر المزامنة السحابية للأقساط، استمرار العمل على الكاش المحلي:', err);
      });

    // ☁️ 1. مزامنة درجات وسعي الطالب اللحظية من Supabase
    syncGradesFromSupabase().then((cloudGrades) => {
      if (cloudGrades && cloudGrades.length > 0) {
        const myCloudGrades = cloudGrades.filter((g) => g.student_id === user.id || g.university_number === user.university_number);
        if (myCloudGrades.length > 0) setStudentGrades(myCloudGrades);
      }
    }).catch(() => {});

    // ☁️ 2. مزامنة المواد الدراسية من Supabase
    syncCoursesFromSupabase().then((cloudCourses) => {
      if (cloudCourses && cloudCourses.length > 0) setCourses(cloudCourses);
    }).catch(() => {});

    // ☁️ 3. مزامنة سجلات الحضور والغيابات من Supabase
    syncAttendanceRecordsFromSupabase().then((cloudAttendance) => {
      if (cloudAttendance && cloudAttendance.length > 0) setAttendanceRecords(cloudAttendance);
    }).catch(() => {});

    // ☁️ 4. مزامنة محاضرات الجدول الأسبوعي وتكوينات القاعات من Supabase
    syncScheduleLecturesFromSupabase().then((cloudLectures) => {
      if (cloudLectures && cloudLectures.length > 0) setScheduleLectures(cloudLectures);
    }).catch(() => {});
    syncScheduleConfigsFromSupabase().then((cloudConfigs) => {
      if (cloudConfigs && cloudConfigs.length > 0) setScheduleConfigs(cloudConfigs);
    }).catch(() => {});

    // ☁️ 5. مزامنة جداول الامتحانات النهائية وفتراتها من Supabase
    syncFinalExamSchedulesFromSupabase().then((cloudSchedules) => {
      if (cloudSchedules && cloudSchedules.length > 0) setFinalExamSchedules(cloudSchedules);
    }).catch(() => {});
    syncFinalExamSlotsFromSupabase().then((cloudSlots) => {
      if (cloudSlots && cloudSlots.length > 0) setFinalExamSlots(cloudSlots);
    }).catch(() => {});

    // ☁️ 6. مزامنة التكليفات الأكاديمية وتسليمات الطالب من Supabase
    syncAcademicTasksFromSupabase().then((cloudTasks) => {
      if (cloudTasks && cloudTasks.length > 0) setAcademicTasks(cloudTasks);
    }).catch(() => {});
    syncTaskSubmissionsFromSupabase().then((cloudSubs) => {
      if (cloudSubs && cloudSubs.length > 0) setSubmissions(cloudSubs);
    }).catch(() => {});

    // ☁️ 7. مزامنة التعميمات الرسمية والتبليغات من Supabase
    syncCampusAnnouncementsFromSupabase().then((cloudAnn) => {
      if (cloudAnn && cloudAnn.length > 0) setCampusAnnouncements(cloudAnn);
    }).catch(() => {});

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

    // 📡 الاستماع للتحديثات اللحظية المباشرة للأقساط بين اللوحات والتبويبات
    const handleTuitionSync = () => {
      const latestTuition = getStoredData<StudentTuitionRecord[]>('student_tuition_records', INITIAL_TUITION_RECORDS);
      setTuitionRecords(latestTuition);
    };

    // 📡 الاستماع للتحديثات اللحظية المباشرة لسجلات الحضور فور حفظ الأستاذ
    const handleAttendanceSync = () => {
      const latestAttendance = getStoredData<StudentAttendanceRecord[]>('student_attendance_records', INITIAL_ATTENDANCE_RECORDS);
      setAttendanceRecords(latestAttendance);
    };

    // 📡 الاستماع للتحديثات اللحظية المباشرة للمواد وتفعيل الامتحانات فور تعديل رئيس القسم
    const handleCoursesSync = () => {
      const latestCourses = getStoredData<Course[]>('courses', INITIAL_COURSES);
      setCourses(latestCourses);
    };

    window.addEventListener('tuition_records_updated', handleTuitionSync);
    window.addEventListener('attendance_updated', handleAttendanceSync);
    window.addEventListener('courses_updated', handleCoursesSync);
    window.addEventListener('storage', handleTuitionSync);
    window.addEventListener('storage', handleAttendanceSync);
    window.addEventListener('storage', handleCoursesSync);

    return () => {
      window.removeEventListener('tuition_records_updated', handleTuitionSync);
      window.removeEventListener('attendance_updated', handleAttendanceSync);
      window.removeEventListener('courses_updated', handleCoursesSync);
      window.removeEventListener('storage', handleTuitionSync);
      window.removeEventListener('storage', handleAttendanceSync);
      window.removeEventListener('storage', handleCoursesSync);
      if (unsubscribeYear) unsubscribeYear();
    };
  }, []);

  // 🌐 1. مزامنة التبويب مع الرابط URL عند أول تحميل أو التنقل بالمتصفح
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncTabFromUrl = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab') as StudentDashboardTab | null;
      if (tabParam && VALID_STUDENT_TABS.includes(tabParam)) {
        setActiveDashboardView(tabParam);
      }
    };

    syncTabFromUrl();
    window.addEventListener('popstate', syncTabFromUrl);
    return () => {
      window.removeEventListener('popstate', syncTabFromUrl);
    };
  }, []);

  // 🏷️ 2. تحديث اسم نافذة المتصفح ديناميكياً بحسب التبويب النشط للطالب
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const tabName = STUDENT_TAB_TITLES[activeDashboardView] || 'بوابة الطالب';
    const deptTitle = currentUser?.department_name || 'القسم الأكاديمي';
    document.title = `${tabName} | ${currentUser?.full_name || 'الطالب'} (${deptTitle}) — جامعة الإمام جعفر الصادق (ع)`;
  }, [activeDashboardView, currentUser]);

  // 🔀 3. دالة التبديل بين التبويبات وتحديث الرابط URL في المتصفح فورياً
  const handleStudentTabSwitch = (newTab: StudentDashboardTab) => {
    setActiveDashboardView(newTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.pushState({ tab: newTab }, '', url.toString());
    }
  };

  // 📄 دالة تصدير وثيقة السعي الرسمية PDF المعتمدة
  const handleExportPDF = async () => {
    if (!currentUser) return;
    setIsExportingPDF(true);
    try {
      // 👥 استخراج الحسابات لجلب أسماء رئيس ومقرر القسم الحقيقيين
      const allProfiles: UserProfile[] = getStoredData('profiles', INITIAL_PROFILES);
      const headUser = allProfiles.find(
        (p) => p.role === 'department_head' && (p.department_id === currentUser.department_id || p.department_name === currentUser.department_name)
      );
      const rapUser = allProfiles.find(
        (p) => p.role === 'rapporteur' && (p.department_id === currentUser.department_id || p.department_name === currentUser.department_name)
      );

      await exportStudentTranscriptPDF({
        student: currentUser,
        grades: filteredGrades,
        semester: activeSemester,
        academicYear: academicYear || getAcademicYear(),
        departmentHeadName: headUser?.full_name?.trim() || 'رئاسة القسم العلمي',
        rapporteurName: rapUser?.full_name?.trim() || 'مقررية القسم العلمي',
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  // 🔀 دالة النقر على المادة للطي والتوسيع
  const toggleCourseExpand = (id: string) => {
    if (expandedCourseIds.includes(id)) {
      setExpandedCourseIds(expandedCourseIds.filter((cId) => cId !== id));
    } else {
      setExpandedCourseIds([...expandedCourseIds, id]);
    }
  };

  // 🎨 دالة تحديد لون شارة الدرجات وفق المعايير الأكاديمية (أخضر كامل، أزرق معتدل، أحمر صفر) بحدود ناعمة
  const getGradeBadgeStyle = (grade: number, maxGrade: number) => {
    if (maxGrade > 0 && grade >= maxGrade) {
      return 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-black'; // 🟢 أخضر فاتح للدرجة الكاملة
    }
    if (grade === 0) {
      return 'bg-red-100 text-red-950 border border-red-400 font-black'; // 🔴 أحمر فاتح للصفر
    }
    return 'bg-blue-50 text-blue-950 border border-blue-200 font-black'; // 🔵 أزرق فاتح أكاديمي أنيق
  };

  // 🎨 دالة تلوين السعي النهائي (50 من 50 أخضر فاتح، أقل من 50 أزرق معتدل، أقل من 25 أحمر) بحدود ناعمة
  const getCourseworkBadgeStyle = (total: number) => {
    if (total >= 50) {
      return 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-black'; // 🟢 50 من 50 أخضر فاتح
    }
    if (total < 25) {
      return 'bg-red-100 text-red-950 border border-red-400 font-black'; // 🔴 أقل من 25 أحمر فاتح
    }
    return 'bg-blue-50 text-blue-950 border border-blue-300 font-black'; // 🔵 أزرق أكاديمي رسمي
  };

  // 🕒 تنسيق التواريخ بشكل عربي مقروء
  const formatDateArabic = (isoString?: string) => {
    if (!isoString) return 'لا يوجد تعديل حديث';
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString('ar-IQ-u-nu-latn')} ${d.toLocaleTimeString('ar-IQ-u-nu-latn', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoString;
    }
  };

  // 🔍 تصفية مواد ودرجات الكورس المختار (الكورس الأول أو الثاني)
  const filteredGrades = studentGrades.filter((g) => {
    const cObj = courses.find((c) => c.id === g.course_id);
    const semester = g.semester || cObj?.semester || 1;
    return semester === activeSemester;
  });

  // 🎖️ احتساب مجموع وحدات الفصل الدراسي ECTS المسجل بها الطالب
  const totalSemesterEcts = useMemo(() => {
    return filteredGrades.reduce((sum, g) => {
      const cObj = courses.find((c) => c.id === g.course_id || c.name === g.course_name);
      return sum + (cObj?.credit_hours || 0);
    }, 0);
  }, [filteredGrades, courses]);

  // 🕒 حساب المحاضرات المجدولة لليوم الحالي للطالب
  const todayDay = getTodayDayOfWeek();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const studentTodayLectures = useMemo(() => {
    if (!currentUser) return [];
    return scheduleLectures
      .filter(
        (l) =>
          l.department_id === currentUser.department_id &&
          l.stage_number === (currentUser.stage_number || 1) &&
          l.semester === activeSemester &&
          l.day === todayDay
      )
      .sort((a, b) => timeStringToMinutes(a.start_time) - timeStringToMinutes(b.start_time));
  }, [scheduleLectures, currentUser, activeSemester, todayDay]);

  const currentLiveLecture = useMemo(() => {
    return studentTodayLectures.find((l) => {
      const s = timeStringToMinutes(l.start_time);
      const e = timeStringToMinutes(l.end_time);
      return currentMinutes >= s && currentMinutes < e;
    }) || null;
  }, [studentTodayLectures, currentMinutes]);

  const nextUpcomingLecture = useMemo(() => {
    return studentTodayLectures.find((l) => timeStringToMinutes(l.start_time) > currentMinutes) || null;
  }, [studentTodayLectures, currentMinutes]);

  return (
    <ZeroTrustGuard allowedRoles={['student']} redirectFallback="/?portal=student">
      {/* 🏛️ الحاوية العريضة لتقليل المساحات الجانبية الفارغة */}
      <div className="space-y-6 font-sans w-full max-w-[1900px] mx-auto px-2 sm:px-4 py-4">
      
      {/* 🏛️ الهيدر الكحلي الفاخر الترحيبي للطالب مع إبراز القسم الأكاديمي بحدود ناعمة */}
      <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
              <Image src="/logo.webp" alt="جامعة الصادق فرع ميسان" width={80} height={80} className="object-contain" priority />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-slate-900 text-white font-black text-sm font-black rounded-xl shadow-2xs">
                  بوابة الطالب الأكاديمية
                </span>
                <span className="px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 font-black text-sm font-black rounded-xl">
                  🏢 قسم: {currentUser?.department_name || 'القسم الأكاديمي'}
                </span>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-950 border border-indigo-200 font-black text-sm font-black rounded-xl flex items-center gap-1.5 shadow-2xs">
                  <Calendar className="w-4 h-4 text-indigo-700" />
                  <span>العام الدراسي: <bdi dir="ltr">{formatAcademicYearDisplay(academicYear)}</bdi></span>
                </span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 font-black text-sm font-black rounded-xl">
                  🎓 {currentUser?.stage_number === 4 ? 'المرحلة الرابعة (سنة التخرج)' : `المرحلة ${getStageNameInArabic(currentUser?.stage_number || 1)}`}
                </span>
                {(() => {
                  const sGender = currentUser?.gender || detectArabicGender(currentUser?.full_name || '');
                  return (
                    <span className={`px-2.5 py-1 rounded-xl font-black text-sm border ${ sGender === 'female' ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-blue-100 text-blue-900 border-blue-300' }`}>
                      {sGender === 'female' ? 'طالبة (أنثى)' : 'طالب (ذكر)'}
                    </span>
                  );
                })()}

                {/* ☀️ / 🌙 شارة الفترة الدراسية الرسمية للطالب (صباحي / مسائي) */}
                <span className={`px-2.5 py-1 rounded-xl font-black text-sm border flex items-center gap-1.5 ${
                  (currentUser?.study_type || 'morning') === 'evening'
                    ? 'bg-indigo-100 text-indigo-950 border-indigo-300'
                    : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                }`}>
                  {(currentUser?.study_type || 'morning') === 'evening' ? (
                    <Moon className="w-4 h-4 text-indigo-700" />
                  ) : (
                    <Sun className="w-4 h-4 text-emerald-700" />
                  )}
                  <span>{(currentUser?.study_type || 'morning') === 'evening' ? 'الدراسة المسائية' : 'الدراسة الصباحية'}</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2 mt-1.5">
                <span>أهلاً بك، {currentUser?.full_name}</span>
                <Sparkles className="w-5 h-5 text-blue-600 fill-blue-500" />
              </h1>
              {/* 🎓 اسم الجامعة والبريد الأكاديمي المعتمد للطالب */}
              <p className="text-sm font-black sm:text-sm text-slate-950 font-black mt-1">
                جامعة الإمام جعفر الصادق (ع) - فرع ميسان | البريد الأكاديمي: <strong className="text-slate-950 font-mono" dir="ltr">{currentUser?.generated_email || ''}</strong>
              </p>
            </div>
          </div>

          {/* 📄 زر تصدير وثيقة السعي المعتمدة PDF */}
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPDF || filteredGrades.length === 0}
            className="w-full md:w-auto px-6 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black text-sm font-black sm:text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 border border-[#1e4570]"
            title="تصدير وثيقة السعي الأكاديمية الرسمية بصيغة PDF A4"
          >
            {isExportingPDF ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>جاري التصدير...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-cyan-300" />
                <span>تصدير وثيقة السعي (PDF)</span>
              </>
            )}
          </button>
        </div>

        {/* 📊 بطاقات الإحصائيات الأكاديمية المتطورة للطالب */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-200">
          <div className="bg-slate-50 border border-slate-300 p-4 rounded-2xl">
            <span className="text-slate-950 text-sm font-black block">المرحلة الدراسية</span>
            <span className="text-slate-950 font-black text-base mt-0.5 block">{getStageNameInArabic(currentUser?.stage_number || 1)}</span>
          </div>
          <div className="bg-slate-50 border border-slate-300 p-4 rounded-2xl">
            <span className="text-slate-950 text-sm font-black block">عدد المواد المسجلة</span>
            <span className="text-blue-950 font-black text-base mt-0.5 block">{filteredGrades.length} مواد</span>
          </div>
          <div className="bg-slate-50 border border-slate-300 p-4 rounded-2xl">
            <span className="text-slate-950 text-sm font-black block">إجمالي الوحدات المسجلة</span>
            <span className="text-slate-950 font-black text-base mt-0.5 block">{filteredGrades.length * 3} وحدة (ECTS)</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl">
            <span className="text-emerald-950 text-sm font-black block">حالة الحساب</span>
            <span className="text-emerald-950 font-black text-base mt-0.5 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>طالب منتظم ومسجل</span>
            </span>
          </div>
        </div>
      </div>

      {/* 🧭 محدد القسم الرئيسي: السجل الأكاديمي والدرجات أو التكليفات أو الجدول أو الحضور أو الامتحانات أو الأقساط أو التعميمات */}
      <div className="flex justify-center sticky top-20 z-40">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 w-full max-w-7xl bg-white/95 backdrop-blur-md p-3 rounded-3xl border border-slate-200 shadow-sm">
          <button
            type="button"
            id="student-tab-grades"
            onClick={() => handleStudentTabSwitch('grades')}
            className={`py-3.5 px-3 rounded-2xl text-center transition-all cursor-pointer flex items-center justify-center gap-2 select-none active:scale-[0.98] ${
              activeDashboardView === 'grades'
                ? 'bg-[#0F2942] text-white shadow-md font-black ring-2 ring-blue-500/30'
                : 'bg-slate-50 text-slate-950 hover:bg-slate-100 font-black border border-slate-300'
            }`}
          >
            <BookOpen className="w-5 h-5 text-cyan-300" />
            <span className="text-base font-black">السجل الأكاديمي</span>
          </button>

          <button
            type="button"
            id="student-tab-assessments"
            onClick={() => handleStudentTabSwitch('assessments')}
            className={`py-3.5 px-3 rounded-2xl text-center transition-all cursor-pointer flex items-center justify-center gap-2 relative select-none active:scale-[0.98] ${
              activeDashboardView === 'assessments'
                ? 'bg-cyan-700 text-white shadow-md font-black ring-2 ring-cyan-400'
                : 'bg-slate-50 text-slate-950 hover:bg-slate-100 font-black border border-slate-300'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 text-cyan-200" />
            <span className="text-base font-black">التكليفات</span>
            {(() => {
              const pendingCount = academicTasks.filter(
                (t) =>
                  (t.task_type === 'assignment' || t.task_type === 'report') &&
                  t.is_submission_open !== false &&
                  !submissions.some((s) => s.task_id === t.id && (s.student_id === currentUser?.id || s.group_members?.some((m) => m.student_id === currentUser?.id)))
              ).length;
              const revisionCount = submissions.filter(
                (s) =>
                  (s.student_id === currentUser?.id || s.group_members?.some((m) => m.student_id === currentUser?.id)) &&
                  s.review_decision === 'needs_revision'
              ).length;
              return (
                <div className="flex items-center gap-1">
                  {revisionCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-600 text-white text-xs font-black rounded-full shadow-xs animate-bounce flex items-center gap-0.5" title={`${revisionCount} تكليفات تحتاج تعديل`}>
                      <AlertTriangle className="w-3 h-3 text-white inline" />
                      <span>{revisionCount}</span>
                    </span>
                  )}
                  {pendingCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-600 text-white text-xs font-black rounded-full shadow-xs animate-pulse" title={`${pendingCount} تكليفات بانتظار التسليم`}>
                      {pendingCount}
                    </span>
                  )}
                </div>
              );
            })()}
          </button>

          <button
            type="button"
            id="student-tab-schedule"
            onClick={() => handleStudentTabSwitch('schedule')}
            className={`py-3.5 px-3 rounded-2xl text-center transition-all cursor-pointer flex items-center justify-center gap-2 select-none active:scale-[0.98] ${
              activeDashboardView === 'schedule'
                ? 'bg-indigo-700 text-white shadow-md font-black ring-2 ring-indigo-400/40'
                : 'bg-slate-50 text-slate-950 hover:bg-slate-100 font-black border border-slate-300'
            }`}
          >
            <Clock className="w-5 h-5 text-indigo-200" />
            <span className="text-base font-black">الجدول الدراسي</span>
          </button>

          <button
            type="button"
            id="student-tab-attendance"
            onClick={() => handleStudentTabSwitch('attendance')}
            className={`py-3.5 px-3 rounded-2xl text-center transition-all cursor-pointer flex items-center justify-center gap-2 select-none active:scale-[0.98] ${
              activeDashboardView === 'attendance'
                ? 'bg-emerald-700 text-white shadow-md font-black ring-2 ring-emerald-400/40'
                : 'bg-slate-50 text-slate-950 hover:bg-slate-100 font-black border border-slate-300'
            }`}
          >
            <ClipboardList className="w-5 h-5 text-emerald-200" />
            <span className="text-base font-black">سجل الحضور</span>
          </button>

          <button
            type="button"
            id="student-tab-exams"
            onClick={() => handleStudentTabSwitch('exams')}
            className={`py-3.5 px-3 rounded-2xl text-center transition-all cursor-pointer flex items-center justify-center gap-2 select-none active:scale-[0.98] ${
              activeDashboardView === 'exams'
                ? 'bg-rose-700 text-white shadow-md font-black ring-2 ring-rose-400'
                : 'bg-slate-50 text-slate-950 hover:bg-slate-100 font-black border border-slate-300'
            }`}
          >
            <FileText className="w-5 h-5 text-rose-200" />
            <span className="text-base font-black">الامتحانات</span>
          </button>

          <button
            type="button"
            id="student-tab-tuition"
            onClick={() => handleStudentTabSwitch('tuition')}
            className={`py-3.5 px-3 rounded-2xl text-center transition-all cursor-pointer flex items-center justify-center gap-2 select-none active:scale-[0.98] ${
              activeDashboardView === 'tuition'
                ? 'bg-emerald-800 text-white shadow-md font-black ring-2 ring-emerald-400'
                : 'bg-slate-50 text-slate-950 hover:bg-slate-100 font-black border border-slate-300'
            }`}
          >
            <CreditCard className="w-5 h-5 text-emerald-200" />
            <span className="text-base font-black">الأقساط</span>
          </button>

          <button
            type="button"
            id="student-tab-announcements"
            onClick={() => handleStudentTabSwitch('announcements')}
            className={`py-3.5 px-3 rounded-2xl text-center transition-all cursor-pointer flex items-center justify-center gap-2 select-none active:scale-[0.98] ${
              activeDashboardView === 'announcements'
                ? 'bg-[#0F2942] text-white shadow-md font-black ring-2 ring-blue-500/40'
                : 'bg-slate-50 text-slate-950 hover:bg-slate-100 font-black border border-slate-300'
            }`}
          >
            <Megaphone className="w-5 h-5 text-blue-200" />
            <span className="text-base font-black">التعميمات</span>
          </button>
        </div>
      </div>

      {/* ⚠️ تنبيه التكليفات التي تحتاج تعديل وإعادة رفع */}
      {(() => {
        const needsRevisionSubs = submissions.filter(
          (s) =>
            (s.student_id === currentUser?.id || s.group_members?.some((m) => m.student_id === currentUser?.id)) &&
            s.review_decision === 'needs_revision'
        );
        if (needsRevisionSubs.length === 0 || activeDashboardView === 'assessments') return null;
        return (
          <div className="p-5 bg-rose-50 border border-rose-400 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-950 animate-in slide-in-from-top-1">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-600 text-white rounded-2xl flex items-center justify-center shrink-0 animate-bounce">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-black text-rose-950">
                  ⚠️ تنبيه أكاديمي عاجل: لديك ({needsRevisionSubs.length}) تكليف طلب الأستاذ تعديله وإعادة رفعه!
                </h4>
                <p className="text-sm text-rose-950 font-black mt-0.5">
                  يرجى مراجعة التوجيهات الأكاديمية ورفع النسخة المعدلة قبل انقضاء المهلة المحددة.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveDashboardView('assessments')}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 shadow-xs"
            >
              <span>الانتقال للتكليفات والرفع 🔄</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        );
      })()}

      {/* 🔔 شريط تنبيه المحاضرة الحالية أو القادمة عند التواجد في شاشة الدرجات */}
      {activeDashboardView === 'grades' && (currentLiveLecture || nextUpcomingLecture) && (
        <div className={`p-5 rounded-3xl border shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top-1 ${
          currentLiveLecture
            ? 'bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 text-white border-rose-500/50'
            : 'bg-blue-50/90 text-blue-950 border-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl flex items-center justify-center ${
              currentLiveLecture ? 'bg-rose-500/30 text-rose-300 animate-pulse' : 'bg-[#0F2942] text-white'
            }`}>
              {currentLiveLecture ? <Radio className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 text-sm font-black sm:text-sm font-black rounded-full ${ currentLiveLecture ? 'bg-rose-600 text-white animate-ping' : 'bg-blue-100 text-blue-950' }`}>
                  {currentLiveLecture ? '🔴 جارية الآن' : '⏳ القادمة اليوم'}
                </span>
                <span className="text-sm font-black">
                  {(currentLiveLecture || nextUpcomingLecture)?.start_time} - {(currentLiveLecture || nextUpcomingLecture)?.end_time}
                </span>
              </div>
              <h4 className="text-base font-black mt-1">
                {(currentLiveLecture || nextUpcomingLecture)?.course_name} — 🚪 {(currentLiveLecture || nextUpcomingLecture)?.room} (أستاذ: {(currentLiveLecture || nextUpcomingLecture)?.teacher_name || 'المقرر'})
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveDashboardView('schedule')}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-950 text-sm font-black rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 shadow-xs"
          >
            <span>فتح المخطط الزمني للجدول</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 🗓️ 1. عرض شاشة الجدول الأسبوعي والـ Timeline الحركي */}
      {activeDashboardView === 'schedule' && (
        <StudentScheduleTimeline
          departmentId={currentUser?.department_id || 'dept-1'}
          departmentName={currentUser?.department_name || 'القسم الأكاديمي'}
          stageNumber={currentUser?.stage_number || 1}
          lectures={scheduleLectures}
          configs={scheduleConfigs}
          initialSemester={activeSemester}
        />
      )}

      {/* 📋 2. عرض شاشة سجل الحضور والغيابات والإجازات الشاملة */}
      {activeDashboardView === 'attendance' && (
        <StudentAttendanceView
          studentId={currentUser?.id || ''}
          studentName={currentUser?.full_name || 'الطالب'}
          courses={courses}
          records={attendanceRecords}
          activeSemester={activeSemester}
        />
      )}

      {/* 📝 3. عرض شاشة جدول الامتحانات النهائية الفاينل الرسمية المعتمدة */}
      {activeDashboardView === 'exams' && currentUser && (
        <StudentFinalExamScheduleView
          currentUser={currentUser}
          schedules={finalExamSchedules}
          slots={finalExamSlots}
        />
      )}

      {/* 🎓 4. عرض شاشة درجات السعي ومسار بولونيا */}
      {activeDashboardView === 'grades' && (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 shadow-xs space-y-6">
        
        <div className="text-center space-y-1">
          <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center justify-center gap-2">
            <Layers className="w-5 h-5 text-slate-950" />
            <span>جدول كورسات المرحلة {getStageNameInArabic(currentUser?.stage_number || 1)}</span>
          </h2>
          <p className="text-sm text-slate-950 font-black">اختر الكورس وانقر على المادة لعرض أساتذة المادة وتفاصيل توزيع الدرجات وتواريخ التعديل المعتمدة</p>
        </div>

        {/* 🔘 أزرار التبديل في منتصف الشاشة (Centered Tabs) */}
        <div className="flex justify-center">
          <div className="grid grid-cols-2 gap-3 w-full max-w-lg bg-slate-50 p-2 rounded-2xl border border-slate-300">
            
            <button
              onClick={() => setActiveSemester(1)}
              className={`py-3.5 px-4 rounded-xl text-center transition-all cursor-pointer ${
                activeSemester === 1
                  ? 'bg-[#0F2942] text-white shadow-md font-black'
                  : 'bg-white text-slate-950 hover:bg-slate-200 font-black border border-slate-300'
              }`}
            >
              <div className="text-base font-black">الكورس الأول</div>
            </button>

            <button
              onClick={() => setActiveSemester(2)}
              className={`py-3.5 px-4 rounded-xl text-center transition-all cursor-pointer ${
                activeSemester === 2
                  ? 'bg-[#0F2942] text-white shadow-md font-black'
                  : 'bg-white text-slate-950 hover:bg-slate-200 font-black border border-slate-300'
              }`}
            >
              <div className="text-base font-black">الكورس الثاني</div>
            </button>

          </div>
        </div>

        {/* 📘 2. عرض مواد الكورس المختار بنص مكبر جداً ومبارز */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base sm:text-lg font-black text-slate-950 bg-slate-100 border border-slate-300 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-2xs">
              <BookOpen className="w-5 h-5 text-[#0F2942]" />
              <span>مواد {activeSemester === 1 ? 'الكورس الأول' : 'الكورس الثاني'} ({filteredGrades.length} مواد)</span>
            </h3>

            {/* 🎖️ بادج إجمالي وحدات الفصل الدراسي ECTS للطالب */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3.5 py-1.5 bg-slate-100 text-slate-950 border border-slate-300 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-2xs">
                <Award className="w-4 h-4 text-[#0F2942]" />
                <span>إجمالي وحدات الفصل:</span>
                <strong className="text-slate-950 font-mono text-sm sm:text-base">{totalSemesterEcts}</strong>
                <span className="text-slate-700 font-bold">ECTS</span>
                <span className="text-[11px] font-bold text-slate-500 border-r border-slate-300 pr-1.5 mr-1">نصاب بولونيا: 30 وحدة</span>
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {filteredGrades.map((g) => {
              const isExpanded = expandedCourseIds.includes(g.id);
              const courseworkStyle = getCourseworkBadgeStyle(g.final_coursework_total);
              
              // 🔍 جلب بيانات المقرر والمخطط التقييمي المعتمد
              const courseObj = courses.find((c) => c.id === g.course_id || c.name === g.course_name);
              const scheme = getCourseAssessmentScheme(courseObj);
              const isPractical = courseObj?.course_type === 'theory_and_practical' || courseObj?.has_practical; // 🔬 هل المادة نظرية وعملية مشتركة؟
              const isFinalActive = courseObj?.is_final_exam_enabled === true; // 🎯 هل درجات الامتحان النهائي الدور الأول معتمدة ومفعلة من رئاسة القسم أو المقرر؟
              const isSupActive = courseObj?.is_supplementary_exam_enabled === true; // 🔄 هل الدور الثاني مفعل؟
              const finalTot = isFinalActive ? calculateFinalTotal(g, isSupActive) : g.final_coursework_total; // 💯 احتساب المجموع
              const letterGrad = isFinalActive ? getLetterGrade(finalTot) : 'بانتظار الفاينل'; // 🅰️ التقدير الأكاديمي
              const isPassedFirstRound = isFinalActive && isStudentPassedFirstRound(g); // 🛡️ التحقق من النجاح بالدور الأول

              //  أساتذة المادة
              const theoryTeacherName = courseObj?.theory_teacher_name || 'أستاذ النظري';
              const practicalTeacherName = isPractical ? (courseObj?.practical_teacher_name || 'أستاذ العملي (المختبر)') : null;

              return (
                <div
                  key={g.id}
                  className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs transition-all"
                >
                  
                  {/* 👆 ترويسة كارت المادة القابلة للنقر لتوسيع أو طي الدرجات */}
                  <div
                    onClick={() => toggleCourseExpand(g.id)}
                    className="p-5 sm:p-6 bg-slate-50 hover:bg-slate-100 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <span className="px-4 py-2 bg-[#0F2942] text-white font-black text-base rounded-2xl shadow-xs tracking-wide">
                        {g.course_name}
                      </span>

                      {/* 🏷️ شارات نوع المادة والوحدات وأستاذ النظري والعملي في الهيدر */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 🎖️ شارة وحدات المادة ECTS */}
                        <span className="px-3.5 py-1.5 bg-slate-100 text-slate-900 border border-slate-300 font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                          <Award className="w-4 h-4 text-[#0F2942]" />
                          <span>{courseObj?.credit_hours || 5} وحدات (ECTS)</span>
                        </span>

                        {isPractical ? (
                          <span className="px-3.5 py-1.5 bg-slate-100 text-slate-900 border border-slate-300 font-black text-base rounded-xl flex items-center gap-1.5 shadow-2xs">
                            <FlaskConical className="w-4 h-4 text-[#0F2942]" />
                            <span>نظري وعملي</span>
                          </span>
                        ) : (
                          <span className="px-3.5 py-1.5 bg-slate-100 text-slate-900 border border-slate-300 font-black text-base rounded-xl flex items-center gap-1.5 shadow-2xs">
                            <BookOpen className="w-4 h-4 text-[#0F2942]" />
                            <span>نظري فقط</span>
                          </span>
                        )}

                        <span className="px-3.5 py-1.5 bg-slate-100 text-slate-900 border border-slate-300 font-black text-base rounded-xl flex items-center gap-1.5 shadow-2xs">
                          <Calendar className="w-4 h-4 text-[#0F2942]" />
                          <span>{courseObj?.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول'}</span>
                        </span>

                        <span className="px-3.5 py-1.5 bg-slate-100 text-slate-900 border border-slate-300 font-black text-base rounded-xl flex items-center gap-1.5 shadow-2xs">
                          <UserCheck className="w-4 h-4 text-[#0F2942]" />
                          <span>أستاذ النظري: {theoryTeacherName}</span>
                        </span>

                        {practicalTeacherName && (
                          <span className="px-3.5 py-1.5 bg-slate-100 text-slate-900 border border-slate-300 font-black text-base rounded-xl flex items-center gap-1.5 shadow-2xs">
                            <FlaskConical className="w-4 h-4 text-[#0F2942]" />
                            <span>أستاذ العملي: {practicalTeacherName}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-between sm:justify-end">
                      {/* 🌟 السعي النهائي */}
                      <div className={`px-4 py-2 rounded-2xl shadow-xs font-black text-base ${courseworkStyle}`}>
                        <span>السعي النهائي: {g.final_coursework_total} / 50</span>
                      </div>

                      {/* 💯 المجموع الكلي يظهر حصراً إذا كان الفاينل معتمداً ومفعلاً من القسم */}
                      {isFinalActive && (
                        <div className="px-4 py-2 bg-slate-900 text-white rounded-2xl font-black text-base shadow-xs">
                          <span>المجموع: {finalTot} / 100 ({letterGrad})</span>
                        </div>
                      )}

                      {/* 🔽 زر التوسيع والطي */}
                      <div className="p-2 bg-white border border-slate-300 rounded-xl text-slate-950">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* 📋 قوائم الدرجات المنسقة بحسب الفئات الـ 5 (تظهر عند النقر وتوسع الكارت) بحدود ناعمة */}
                  {isExpanded && (
                    <div className="p-6 bg-white border-t border-slate-200 space-y-5 animate-in fade-in duration-200">
                      
                      {/* 👨‍🏫 شريط معلومات طاقم التدريس وتواريخ التعديل المنفصلة (يتكيف تلقائياً: كارت واحد للنظري، وكارتان للنظري والعملي) */}
                      <div className={`grid grid-cols-1 ${isPractical ? 'md:grid-cols-2' : ''} gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black`}>
                        
                        {/* 📘 جانب النظري ومعدل الدرجة وتاريخ التعديل */}
                        <div className="p-3.5 bg-white border border-blue-200 rounded-xl space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between text-blue-950">
                            <span className="flex items-center gap-1.5 font-black text-sm sm:text-base">
                              <BookOpen className="w-4 h-4 text-blue-700" />
                              <span>{isPractical ? 'الجانب النظري والنهائي' : 'أستاذ المادة وتدريس المنهج'}</span>
                            </span>
                            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-950 rounded-lg text-sm font-black flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                              <span>{theoryTeacherName}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm font-black text-slate-950 pt-1">
                            <Clock className="w-4 h-4 text-slate-950" />
                            <span>آخر تحديث: <strong>{formatDateArabic(g.theory_updated_at || g.updated_at)}</strong></span>
                            {g.theory_updated_by && (
                              <span className="text-slate-950 font-black">بواسطة ({g.theory_updated_by})</span>
                            )}
                          </div>
                        </div>

                        {/* 🔬 جانب العملي ومعدل الدرجة وتاريخ التعديل (يظهر حصراً في المواد النظرية والعملية) */}
                        {isPractical && (
                          <div className="p-3.5 bg-white border border-emerald-200 rounded-xl space-y-1.5 shadow-2xs">
                            <div className="flex items-center justify-between text-emerald-950">
                              <span className="flex items-center gap-1.5 font-black text-sm sm:text-base">
                                <FlaskConical className="w-4 h-4 text-emerald-700" />
                                <span>الجانب العملي (المختبر)</span>
                              </span>
                              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-950 rounded-lg text-sm font-black flex items-center gap-1">
                                <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
                                <span>{practicalTeacherName}</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm font-black text-slate-950 pt-1">
                              <Clock className="w-4 h-4 text-slate-950" />
                              <span>آخر تحديث: <strong>{formatDateArabic(g.practical_updated_at || g.updated_at)}</strong></span>
                              {g.practical_updated_by && (
                                <span className="text-slate-950 font-black">بواسطة ({g.practical_updated_by})</span>
                              )}
                            </div>
                          </div>
                        )}

                      </div>

                      {/* 🧮 شبكة بنود التقييم الـ 7 التفصيلية مع العناوين ثنائية اللغة والأوزان المخصصة */}
                      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isPractical ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
                        
                        {/* 1️⃣ قائمة الكويزات (Quizzes) بحدود ناعمة */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between text-sm font-black text-slate-950 border-b border-slate-200 pb-2">
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-slate-950" />
                              <span>الكويزات (Quizzes)</span>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm font-black pt-1">
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                              <div>
                                <div className="text-slate-950 font-black">{scheme.quiz1.title_ar}</div>
                                <div className="text-sm font-black text-slate-950 font-black" dir="ltr">{scheme.quiz1.title_en}</div>
                              </div>
                              <span className={`px-3 py-1 rounded-lg text-sm font-black sm:text-sm font-black ${getGradeBadgeStyle(g.quiz1, scheme.quiz1.max_score)}`}>
                                {g.quiz1} / {scheme.quiz1.max_score}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                              <div>
                                <div className="text-slate-950 font-black">{scheme.quiz2.title_ar}</div>
                                <div className="text-sm font-black text-slate-950 font-black" dir="ltr">{scheme.quiz2.title_en}</div>
                              </div>
                              <span className={`px-3 py-1 rounded-lg text-sm font-black sm:text-sm font-black ${getGradeBadgeStyle(g.quiz2, scheme.quiz2.max_score)}`}>
                                {g.quiz2} / {scheme.quiz2.max_score}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2️⃣ قائمة الواجبات (Homeworks) بحدود ناعمة */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between text-sm font-black text-slate-950 border-b border-slate-200 pb-2">
                            <div className="flex items-center gap-1.5">
                              <FileSpreadsheet className="w-4 h-4 text-slate-950" />
                              <span>الواجبات (Assignments)</span>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm font-black pt-1">
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                              <div>
                                <div className="text-slate-950 font-black">{scheme.assignment1.title_ar}</div>
                                <div className="text-sm font-black text-slate-950 font-black" dir="ltr">{scheme.assignment1.title_en}</div>
                              </div>
                              <span className={`px-3 py-1 rounded-lg text-sm font-black sm:text-sm font-black ${getGradeBadgeStyle(g.assignment1, scheme.assignment1.max_score)}`}>
                                {g.assignment1} / {scheme.assignment1.max_score}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                              <div>
                                <div className="text-slate-950 font-black">{scheme.assignment2.title_ar}</div>
                                <div className="text-sm font-black text-slate-950 font-black" dir="ltr">{scheme.assignment2.title_en}</div>
                              </div>
                              <span className={`px-3 py-1 rounded-lg text-sm font-black sm:text-sm font-black ${getGradeBadgeStyle(g.assignment2, scheme.assignment2.max_score)}`}>
                                {g.assignment2} / {scheme.assignment2.max_score}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3️⃣ قائمة التقرير / النشاط (Report) بحدود ناعمة */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between text-sm font-black text-slate-950 border-b border-slate-200 pb-2">
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-slate-950" />
                              <span>التقارير والنشاط</span>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm font-black pt-1">
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                              <div>
                                <div className="text-slate-950 font-black">{scheme.report.title_ar}</div>
                                <div className="text-sm font-black text-slate-950 font-black" dir="ltr">{scheme.report.title_en}</div>
                              </div>
                              <span className={`px-3 py-1 rounded-lg text-sm font-black sm:text-sm font-black ${getGradeBadgeStyle(g.report, scheme.report.max_score)}`}>
                                {g.report} / {scheme.report.max_score}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 4️⃣ قائمة الميدتيرم (Midterm Exam) بحدود ناعمة */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between text-sm font-black text-slate-950 border-b border-slate-200 pb-2">
                            <div className="flex items-center gap-1.5">
                              <Target className="w-4 h-4 text-slate-950" />
                              <span>الامتحان النصفي</span>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm font-black pt-1">
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                              <div>
                                <div className="text-slate-950 font-black">{scheme.midterm.title_ar}</div>
                                <div className="text-sm font-black text-slate-950 font-black" dir="ltr">{scheme.midterm.title_en}</div>
                              </div>
                              <span className={`px-3 py-1 rounded-lg text-sm font-black sm:text-sm font-black ${getGradeBadgeStyle(g.midterm, scheme.midterm.max_score)}`}>
                                {g.midterm} / {scheme.midterm.max_score}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 5️⃣ قائمة العملي (Practical) - تظهر إذا كانت المادة تحتوي عملي بحدود ناعمة */}
                        {isPractical && (
                          <div className="p-4 bg-emerald-50/60 border border-emerald-300 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between text-sm font-black text-emerald-950 border-b border-emerald-200 pb-2">
                              <div className="flex items-center gap-1.5">
                                <FlaskConical className="w-4 h-4 text-emerald-700" />
                                <span>التقييم المختبري</span>
                              </div>
                            </div>
                            <div className="space-y-2 text-sm font-black pt-1">
                              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-emerald-200">
                                <div>
                                  <div className="text-emerald-950 font-black">{scheme.practical.title_ar}</div>
                                  <div className="text-sm text-emerald-950 font-black" dir="ltr">{scheme.practical.title_en}</div>
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-sm font-black ${getGradeBadgeStyle(g.practical, scheme.practical.max_score)}`}>
                                  {g.practical} / {scheme.practical.max_score}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>

                      {/* 🏁 بطاقة الامتحان النهائي والدور الثاني والنتيجة الكلية تظهر حصراً إذا كان الفاينل مفعلاً ومفتوحاً */}
                      {isFinalActive && (
                        <div className="p-5 bg-[#0F2942] text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#1e4570]">
                          <div className="flex items-center gap-3">
                            <Award className="w-7 h-7 text-yellow-400 shrink-0" />
                            <div>
                              <div className="text-sm text-slate-300 font-black">الامتحان النهائي والموقف الأكاديمي:</div>
                              <div className="text-base font-black flex flex-wrap items-center gap-2 mt-0.5">
                                <span>{scheme.final_exam.title_ar}: <strong className="text-cyan-300 font-mono text-lg">{g.final_exam} / 50</strong></span>
                                {isPassedFirstRound ? (
                                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 rounded-lg text-xs font-black flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>ناجح من الدور الأول</span>
                                  </span>
                                ) : isSupActive ? (
                                  g.supplementary_exam != null && g.supplementary_exam > 0 ? (
                                    <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/50 rounded-lg text-xs font-black flex items-center gap-1">
                                      <span>الدور الثاني: {g.supplementary_exam} / 50</span>
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/50 rounded-lg text-xs font-black flex items-center gap-1">
                                      <span>مؤهل لامتحان الدور الثاني</span>
                                    </span>
                                  )
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-sm text-slate-300 block font-black">المجموع الكلي:</span>
                              <span className="text-2xl font-black text-emerald-400">{finalTot} / 100</span>
                            </div>
                            <span className={`px-4 py-2 rounded-xl font-black text-sm flex items-center gap-1.5 shadow-xs ${
                              finalTot >= 50 ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white'
                            }`}>
                              <span>{letterGrad}</span>
                              <span>•</span>
                              <span>
                                {isPassedFirstRound 
                                  ? 'ناجح (دور أول)' 
                                  : (isSupActive && g.supplementary_exam != null && g.supplementary_exam > 0 && finalTot >= 50)
                                  ? 'ناجح (دور ثاني)'
                                  : 'مكمل'}
                              </span>
                            </span>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })}

            {filteredGrades.length === 0 && (
              <div className="py-12 text-center text-slate-950 text-sm font-black bg-slate-50 rounded-3xl border border-slate-200">
                لا توجد درجات مسجلة لك في {activeSemester === 1 ? 'الكورس الأول' : 'الكورس الثاني'} حتى الآن.
              </div>
            )}
          </div>

        </div>

      </div>
      )}

      {/* 📚 2. عرض مركز التكليفات والامتحانات الفصلية (كويزات، واجبات، تقارير، مدتيرم، عملي) */}
      {activeDashboardView === 'assessments' && currentUser && (
        <StudentAssessmentsPortal
          studentDepartmentId={currentUser.department_id || 'dept-1'}
          studentStageNumber={currentUser.stage_number || 1}
        />
      )}

      {/* 💳 5. عرض بطاقة الموقف المالي وتسديد الأقساط */}
      {activeDashboardView === 'tuition' && currentUser && (
        <StudentTuitionFinancialCard
          student={currentUser}
          tuitionRecord={tuitionRecords.find((r) => 
            (r.student_id === currentUser.id || (currentUser.university_number && r.student_code === currentUser.university_number)) &&
            (r.stage_number === (currentUser.stage_number || 1))
          )}
          departmentName={currentUser.department_name}
        />
      )}

      {/* 📢 6. عرض التعميمات والتبليغات الرسمية الصادرة من رئاسة القسم والعمادة */}
      {activeDashboardView === 'announcements' && currentUser && (
        <StudentAnnouncementsView
          currentUser={currentUser}
          announcements={campusAnnouncements}
        />
      )}

      </div>
    </ZeroTrustGuard>
  );
}
