'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 👑 لوحة تحكم المسؤول العام عن النظام (Super Admin Dashboard) - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect, useMemo } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والحسابات الفورية
import Link from 'next/link'; // 🔗 روابط نكست للتنقل
import Image from 'next/image'; // 🖼️ عرض شعار الجامعة الرسمي
import { useRouter } from 'next/navigation'; // 🛣️ موجه المسارات
import { 
  getStoredData, 
  INITIAL_DEPARTMENTS, 
  INITIAL_PROFILES, 
  INITIAL_COURSES, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_GRADES, 
  INITIAL_FINAL_EXAM_SCHEDULES, 
  INITIAL_FINAL_EXAM_SLOTS, 
  saveStoredData, 
  getAcademicYear, 
  saveAcademicYear,
  formatAcademicYearDisplay
} from '@/lib/mock-data'; // 💾 دوال استرجاع وحفظ البيانات
import { 
  getCurrentSessionUser, 
  syncProfilesFromSupabase, 
  saveAcademicYearToSupabase, 
  syncAcademicYearFromSupabase,
  subscribeToAcademicYearChanges,
  saveFinalExamScheduleToSupabase,
  deleteFinalExamScheduleFromSupabase,
  syncDepartmentsFromSupabase,
  syncCoursesFromSupabase,
  syncGradesFromSupabase,
  syncAuditLogsFromSupabase,
  syncFinalExamSchedulesFromSupabase,
  syncFinalExamSlotsFromSupabase
} from '@/lib/supabase-client'; // 🔌 جلب بيانات الجلسة والمزامنة الحية من Supabase
import { UserProfile, Department, Course, AuditLog, Grade, FinalExamSchedule, FinalExamSlot } from '@/types'; // 🔗 الأنواع الصريحة
import { StudentDemographicsMatrix } from '@/components/analytics/StudentDemographicsMatrix'; // 👥 مصفوفة الإحصائيات الديموغرافية الشاملة للطلاب
import { TeacherDemographicsMatrix } from '@/components/analytics/TeacherDemographicsMatrix'; //  مصفوفة إحصائيات الكادر التدريسي وتوزيع الذكور والإناث
import { calculateStudentDemographics, calculateTeacherDemographics, detectArabicGender } from '@/lib/demographics-utils'; // 🧮 دوال حساب الإحصائيات الديموغرافية والتعرف الذكي على الجنس
import SuperAdminExamApprovalModal from '@/components/exams/SuperAdminExamApprovalModal'; // 📝 نافذة مصادقة جداول الامتحانات
import MasterCampusExamMatrixModal from '@/components/exams/MasterCampusExamMatrixModal'; // 🏛️ مصفوفة إشغال القاعات الامتحانية المركزية
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Layers, 
  ShieldCheck, 
  Calendar, 
  Edit3, 
  Check, 
  Building2, 
  ArrowLeft, 
  FileSpreadsheet, 
  Sparkles, 
  UserCheck, 
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  FileText
} from 'lucide-react'; // 🎨 الأيقونات الرسمية
import ZeroTrustGuard from '@/components/security/ZeroTrustGuard'; // 🛡️ حارس أمان Zero Trust
import { formatEnglishDateTime, getTranslatedAuditAction, translateAuditDetails } from '@/lib/date-utils'; // 📅 دوال تنسيق التواريخ بالأرقام الإنجليزية وترجمة التدقيق

export default function SuperAdminDashboard() {
  const router = useRouter(); // 🛣️ كائن التوجيه
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null); // 👤 بيانات المسؤول الحالي

  // 📌 حالات الإحصائيات العامة والسنة الدراسية
  const [profiles, setProfiles] = useState<UserProfile[]>([]); // 👥 قائمة كافة المستخدمين
  const [departments, setDepartments] = useState<Department[]>([]); // 🏢 قائمة الأقسام العلمية
  const [courses, setCourses] = useState<Course[]>([]); // 📘 قائمة المواد الدراسية
  const [grades, setGrades] = useState<Grade[]>([]); // 📊 قائمة الدرجات
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]); // 🛡️ سجلات التدقيق الأمني
  const [examSchedules, setExamSchedules] = useState<FinalExamSchedule[]>([]); // 📝 جداول الامتحانات
  const [examSlots, setExamSlots] = useState<FinalExamSlot[]>([]); // 🕒 فترات الامتحانات
  const [isExamApprovalModalOpen, setIsExamApprovalModalOpen] = useState<boolean>(false); // 🔍 نافذة المصادقة
  const [isExamMatrixModalOpen, setIsExamMatrixModalOpen] = useState<boolean>(false); // 🏛️ نافذة القاعات

  // 📅 حالة السنة الدراسية القابلة للتعديل
  const [academicYear, setAcademicYearState] = useState<string>(() => getAcademicYear()); // 🗓️ السنة الحالية
  const [isEditingYear, setIsEditingYear] = useState<boolean>(false); // ✍️ وضع التعديل
  const [yearInput, setYearInput] = useState<string>(() => getAcademicYear()); // ✍️ نص السنة المدخل
  const [successYearMsg, setSuccessYearMsg] = useState<string>(''); // 📢 رسالة نجاح حفظ السنة

  // 🎛️ حالة التبديل بين مصفوفة أعداد الطلاب ومصفوفة الكادر التدريسي
  const [activeMatrixTab, setActiveMatrixTab] = useState<'students' | 'teachers'>('students');

  // 🔄 التحقق من صلاحية المسؤول العام وتحميل البيانات مع المزامنة الحية من Supabase
  useEffect(() => {
    const user = getCurrentSessionUser(); // 🔍 فحص الجلسة المشفرة
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
      router.push('/sadmin'); // 🚪 طرد أي دور غير مصرح له لبوابة المسؤول
      return;
    }
    setCurrentUser(user); // 💾 تثبيت بيانات المسؤول

    // 💾 تحميل البيانات من التخزين المحلي الآمن
    setProfiles(getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES));
    setDepartments(getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS));
    setCourses(getStoredData<Course[]>('courses', INITIAL_COURSES));
    setGrades(getStoredData<Grade[]>('grades', INITIAL_GRADES));
    setAuditLogs(getStoredData<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS));
    setExamSchedules(getStoredData<FinalExamSchedule[]>('final_exam_schedules', INITIAL_FINAL_EXAM_SCHEDULES));
    setExamSlots(getStoredData<FinalExamSlot[]>('final_exam_slots', INITIAL_FINAL_EXAM_SLOTS));
    
    const curYear = getAcademicYear();
    setAcademicYearState(curYear);
    setYearInput(curYear);

    // 🗓️ جلب ومزامنة السنة الدراسية المعتمدة من Supabase فوراً
    if (typeof syncAcademicYearFromSupabase === 'function') {
      syncAcademicYearFromSupabase().then((liveYear) => {
        if (liveYear) {
          setAcademicYearState(liveYear);
          setYearInput(liveYear);
        }
      }).catch(() => {});
    }

    // 📡 الاشتراك بالبث اللحظي للعام الدراسي في حال تغييره
    let unsubscribeYear: (() => void) | undefined;
    if (typeof subscribeToAcademicYearChanges === 'function') {
      unsubscribeYear = subscribeToAcademicYearChanges((liveYear) => {
        setAcademicYearState(liveYear);
        setYearInput(liveYear);
      });
    }

    // ☁️ المزامنة الحية الفورية مع Supabase لتحديث أي تغييرات أجريت في لوحة ساب بيز
    syncProfilesFromSupabase().then((liveProfiles) => {
      if (liveProfiles && liveProfiles.length > 0) setProfiles(liveProfiles);
    }).catch(() => {});
    syncDepartmentsFromSupabase().then((liveDepts) => {
      if (liveDepts && liveDepts.length > 0) setDepartments(liveDepts);
    }).catch(() => {});
    syncCoursesFromSupabase().then((liveCourses) => {
      if (liveCourses && liveCourses.length > 0) setCourses(liveCourses);
    }).catch(() => {});
    syncGradesFromSupabase().then((liveGrades) => {
      if (liveGrades && liveGrades.length > 0) setGrades(liveGrades);
    }).catch(() => {});
    syncAuditLogsFromSupabase().then((liveLogs) => {
      if (liveLogs && liveLogs.length > 0) setAuditLogs(liveLogs);
    }).catch(() => {});
    syncFinalExamSchedulesFromSupabase().then((liveSchedules) => {
      if (liveSchedules && liveSchedules.length > 0) setExamSchedules(liveSchedules);
    }).catch(() => {});
    syncFinalExamSlotsFromSupabase().then((liveSlots) => {
      if (liveSlots && liveSlots.length > 0) setExamSlots(liveSlots);
    }).catch(() => {});

    return () => {
      if (unsubscribeYear) unsubscribeYear();
    };
  }, [router]);

  // 🌐 1. مزامنة تبويب المصفوفة مع الرابط URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const matrixParam = params.get('matrix') as 'students' | 'teachers' | null;
    if (matrixParam === 'students' || matrixParam === 'teachers') {
      setActiveMatrixTab(matrixParam);
    }
  }, []);

  // 🏷️ 2. تحديث عنوان نافذة المتصفح للمسؤول العام
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const matrixName = activeMatrixTab === 'students' ? 'إحصائيات الطلاب' : 'إحصائيات الأساتذة';
    document.title = `لوحة الإشراف المركزية (${matrixName}) | جامعة الإمام جعفر الصادق (ع) - فرع ميسان`;
  }, [activeMatrixTab]);

  // 🔀 3. دالة تبديل المصفوفة مع تحديث الرابط URL
  const handleMatrixTabSwitch = (tab: 'students' | 'teachers') => {
    setActiveMatrixTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('matrix', tab);
      window.history.pushState({ matrix: tab }, '', url.toString());
    }
  };

  // 🔄 دالة تحديث حالة مصادقة جدول الامتحانات وحفظها سحابياً
  const handleUpdateExamScheduleStatus = (updated: FinalExamSchedule) => {
    const newSchedules = examSchedules.map((s) => (s.id === updated.id ? updated : s));
    setExamSchedules(newSchedules);
    saveStoredData('final_exam_schedules', newSchedules);
    saveFinalExamScheduleToSupabase(updated); // ☁️ حفظ ومزامنة حالة الاعتماد في سحابة Supabase فوراً
  };

  // 🗑️ دالة حذف جدول الامتحانات وبنوده المرتبطة
  const handleDeleteExamSchedule = (scheduleId: string) => {
    const newSchedules = examSchedules.filter((s) => s.id !== scheduleId);
    const newSlots = examSlots.filter((slot) => slot.schedule_id !== scheduleId);
    setExamSchedules(newSchedules);
    setExamSlots(newSlots);
    saveStoredData('final_exam_schedules', newSchedules);
    saveStoredData('final_exam_slots', newSlots);
    deleteFinalExamScheduleFromSupabase(scheduleId); // ☁️ حذف جدول الامتحانات وفتراته من سحابة Supabase فوراً
  };

  // 🗓️ دالة تغيير السنة الدراسية وحفظها سحابياً ومحلياً وبثها لكافة اللوحات
  const handleStepAcademicYear = (direction: 'prev' | 'next') => {
    const match = academicYear.match(/^(\d{4})-(\d{4})$/);
    let startYear = 2026;
    if (match && match[1]) {
      startYear = parseInt(match[1], 10);
    }
    const newStartYear = direction === 'next' ? startYear + 1 : startYear - 1;
    const newYearStr = `${newStartYear}-${newStartYear + 1}`;
    
    saveAcademicYear(newYearStr);
    saveAcademicYearToSupabase(newYearStr);
    setAcademicYearState(newYearStr);
    setYearInput(newYearStr);
    setSuccessYearMsg(`تم اعتماد ومزامنة العام الدراسي: (${newYearStr}) في قاعدة البيانات`);
    setTimeout(() => setSuccessYearMsg(''), 3500);
  };

  // 📊 حساب الأرقام والإحصائيات
  const totalStudents = profiles.filter((p) => p.role === 'student').length;
  const totalTeachers = profiles.filter((p) => p.role === 'teacher').length;
  const totalDepartments = departments.length; // 🏢 إجمالي الأقسام
  const totalCourses = courses.length; // 📚 إجمالي المواد

  // 👥 حساب إحصائيات القيادات (رؤساء الأقسام والمقررين والذكور والإناث والنسب المئوية) بدقة
  const leadershipStats = useMemo(() => {
    const heads = profiles.filter((p) => p.role === 'department_head'); // 👔 رؤساء الأقسام
    const rapporteurs = profiles.filter((p) => p.role === 'rapporteur'); // 📝 المقررين
    const leaders = [...heads, ...rapporteurs]; // 👥 إجمالي القيادات
    const totalLeaders = leaders.length; // 🔢 المجموع الكلي للقيادات
    const headsPct = totalLeaders > 0 ? Math.round((heads.length / totalLeaders) * 100) : 0; // 📊 نسبة رؤساء الأقسام
    const rapporteursPct = totalLeaders > 0 ? Math.round((rapporteurs.length / totalLeaders) * 100) : 0; // 📊 نسبة المقررين
    const malesCount = leaders.filter((l) => (l.gender || detectArabicGender(l.full_name)) === 'male').length; // 👨 الذكور منهم
    const femalesCount = totalLeaders - malesCount; // 👩 الإناث منهم
    const malePct = totalLeaders > 0 ? Math.round((malesCount / totalLeaders) * 100) : 0; // 📊 نسبة الذكور
    const femalePct = totalLeaders > 0 ? Math.round((femalesCount / totalLeaders) * 100) : 0; // 📊 نسبة الإناث

    return {
      totalHeads: heads.length,
      totalRapporteurs: rapporteurs.length,
      headsPct,
      rapporteursPct,
      totalLeaders,
      malesCount,
      femalesCount,
      malePct,
      femalePct,
    };
  }, [profiles]);

  // 🧮 حساب الإحصائيات الديموغرافية الشاملة للطلاب
  const studentDemographics = useMemo(() => {
    return calculateStudentDemographics(profiles, departments);
  }, [profiles, departments]);

  //  حساب الإحصائيات الديموغرافية الشاملة للتدريسيين
  const teacherDemographics = useMemo(() => {
    return calculateTeacherDemographics(profiles, departments);
  }, [profiles, departments]);

  return (
    <ZeroTrustGuard allowedRoles={['super_admin', 'admin']} redirectFallback="/sadmin">
      {/* 🏛️ الحاوية العريضة للمسؤول العام */}
      <div className="space-y-6 font-sans w-full max-w-[1900px] mx-auto px-2 sm:px-4 py-4">
      
      {/* 🏛️ الهيدر الكحلي الفاخر الترحيبي للوحة تحكم المسؤول العام */}
      <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0">
            <Image src="/logo.webp" alt="جامعة الإمام جعفر الصادق" width={80} height={80} className="object-contain" priority />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-700" />
              <span>لوحة الإشراف والتحكم بالمسؤول العام</span>
            </h1>
            <p className="text-base text-slate-950 font-black flex items-center gap-2">
              <span>مرحباً بك:</span>
              <span className="px-3.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-950 rounded-xl font-black text-base">
                {currentUser?.full_name ? `${currentUser.full_name} (المسؤول العام)` : 'المسؤول العام'}
              </span>
              <span className="text-slate-900 font-bold">•</span>
              <span>جامعة الإمام جعفر الصادق (ع) - فرع ميسان</span>
            </p>
            
            {/* 📅 إدارة وتعديل السنة الدراسية وزر مصادقة الجداول ومصفوفة القاعات */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsExamApprovalModalOpen(true)}
                className={`px-4 py-3 rounded-2xl text-base font-black transition cursor-pointer flex items-center gap-2 shadow-xs ${ // 📐 تنسيق زر المصادقة الفاخر
                  examSchedules.filter((s) => s.status === 'pending_approval').length > 0 // 🔍 فحص وجود جداول بانتظار الاعتماد
                    ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse border border-blue-700 shadow-md' // 🎨 لون أزرق ملكي متناسق بدلاً من البرتقالي الفاقع
                    : 'bg-[#0F2942] hover:bg-[#163a5f] text-white border border-[#1e4570]' // 🎨 اللون الكحلي الافتراضي
                }`}
              >
                <FileCheck className="w-5 h-5 text-cyan-300" />
                <span>مصادقة واعتماد الجداول ({examSchedules.filter((s) => s.status === 'pending_approval').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsExamMatrixModalOpen(true)}
                className="px-4 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white border border-[#1e4570] rounded-2xl text-base font-black transition cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <Building2 className="w-5 h-5 text-cyan-300" />
                <span>مصفوفة القاعات الامتحانية</span>
              </button>

              {/* 🗓️ اختيار وتغيير السنة الدراسية بالأسهم عند الضغط على زر التعديل بتصميم كحلي متناسق */}
              <div className="relative">
                {!isEditingYear ? (
                  <div className="flex items-center gap-2.5 bg-[#0F2942] border border-[#1e4570] px-4 py-2.5 rounded-2xl shadow-xs text-white">
                    <Calendar className="w-5 h-5 text-cyan-300" />
                    <span className="text-base font-black text-white">السنة الدراسية:</span>
                    <span className="px-3 py-0.5 bg-[#163a5f] text-cyan-200 rounded-xl font-black text-base shadow-2xs border border-cyan-400/30">
                      <bdi dir="ltr">{formatAcademicYearDisplay(academicYear)}</bdi>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingYear(true)}
                      className="p-1.5 hover:bg-[#1e4570] rounded-xl text-cyan-300 hover:text-white transition cursor-pointer"
                      title="تعديل السنة الدراسية"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 bg-[#0F2942] border border-[#1e4570] px-4 py-2 rounded-2xl shadow-xs animate-in fade-in text-white">
                    <Calendar className="w-5 h-5 text-cyan-300" />
                    <span className="text-base font-black text-white">السنة الدراسية:</span>
                    <span className="px-3 py-0.5 bg-[#163a5f] text-cyan-200 rounded-xl font-black text-base shadow-2xs border border-cyan-400/30">
                      <bdi dir="ltr">{formatAcademicYearDisplay(academicYear)}</bdi>
                    </span>

                    <div className="flex items-center gap-1 mr-1 border-r border-[#1e4570] pr-1.5">
                      {/* ◀️ زر السنة السابقة */}
                      <button
                        type="button"
                        onClick={() => handleStepAcademicYear('prev')}
                        className="p-1.5 hover:bg-[#1e4570] active:bg-[#163a5f] rounded-xl text-cyan-300 hover:text-white transition cursor-pointer"
                        title="السنة الدراسية السابقة"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* ▶️ زر السنة القادمة */}
                      <button
                        type="button"
                        onClick={() => handleStepAcademicYear('next')}
                        className="p-1.5 hover:bg-[#1e4570] active:bg-[#163a5f] rounded-xl text-cyan-300 hover:text-white transition cursor-pointer"
                        title="السنة الدراسية القادمة"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      {/* ✔️ زر إنهاء وحفظ التعديل */}
                      <button
                        type="button"
                        onClick={() => setIsEditingYear(false)}
                        className="p-1.5 hover:bg-emerald-700 bg-emerald-600 text-white rounded-xl transition cursor-pointer mr-0.5 shadow-2xs"
                        title="إنهاء التعديل"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 🌟 رسالة النجاح تطفو فوق التاريخ بشكل مطلق دون التأثير على تخطيط الـ UI */}
                {successYearMsg && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                    <span className="text-sm font-black text-emerald-950 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-xl shadow-md flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                      {successYearMsg}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ⚡ روابط الإجراءات السريعة للمسؤول العام */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/sadmin/departments"
            className="px-4 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-xs transition flex items-center gap-2 border border-[#1e4570]"
          >
            <Layers className="w-5 h-5 text-slate-200" />
            <span>إدارة الأقسام العلمية</span>
          </Link>

          <Link
            href="/sadmin/department-heads"
            className="px-4 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-xs transition flex items-center gap-2 border border-[#1e4570]"
          >
            <Users className="w-5 h-5 text-slate-200" />
            <span>رؤساء الأقسام والمقررين</span>
          </Link>
        </div>
      </div>

      {/* 📊 بطاقات الإحصائيات الأكاديمية العلوية السريعة (KPI Overview Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        
        {/* 🏢 بطاقة الأقسام */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-black text-slate-950">الأقسام العلمية</span>
            <div className="p-2.5 bg-slate-50 text-slate-950 rounded-2xl border border-slate-200">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950">{totalDepartments}</div>
          <p className="text-base text-slate-950 mt-1.5 font-black">أقسام فرع ميسان المعتمدة</p>
        </div>

        {/* 👥 بطاقة رؤساء الأقسام والمقررين مع تفصيل الذكور والإناث */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-black text-slate-950">القيادات (رؤساء ومقررين)</span>
              <div className="p-2.5 bg-blue-50 text-blue-950 rounded-2xl border border-blue-100">
                <Building2 className="w-5 h-5 text-blue-700" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950">{leadershipStats.totalLeaders}</div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200 space-y-1.5 sm:space-y-2">
            {/* 🏢 عدد ونسب رؤساء الأقسام والمقررين بطبقتين عمودية لمنع أي تداخل نهائياً */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <div className="p-1.5 sm:p-2 bg-indigo-50/90 border border-indigo-200/90 rounded-2xl flex flex-col items-center justify-center text-center shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 text-xs font-black text-indigo-950">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                  <span>الرؤساء</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-1 font-black">
                  <span className="text-sm sm:text-base font-black text-indigo-950 font-mono">{leadershipStats.totalHeads}</span>
                  <span className="px-1.5 py-0.5 bg-indigo-200/80 text-indigo-950 rounded-md text-[10px] font-bold font-mono" dir="ltr">
                    {leadershipStats.headsPct}%
                  </span>
                </div>
              </div>

              <div className="p-1.5 sm:p-2 bg-teal-50/90 border border-teal-200/90 rounded-2xl flex flex-col items-center justify-center text-center shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 text-xs font-black text-teal-950">
                  <BookOpen className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>المقررين</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-1 font-black">
                  <span className="text-sm sm:text-base font-black text-teal-950 font-mono">{leadershipStats.totalRapporteurs}</span>
                  <span className="px-1.5 py-0.5 bg-teal-200/80 text-teal-950 rounded-md text-[10px] font-bold font-mono" dir="ltr">
                    {leadershipStats.rapporteursPct}%
                  </span>
                </div>
              </div>
            </div>

            {/* 🚻 عدد ونسب الذكور والإناث من القيادات */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <div className="p-1.5 sm:p-2 bg-blue-50/90 border border-blue-200/90 rounded-2xl flex flex-col items-center justify-center text-center shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 text-xs font-black text-blue-950">
                  <Users className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span>الذكور</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-1 font-black">
                  <span className="text-sm sm:text-base font-black text-blue-950 font-mono">{leadershipStats.malesCount}</span>
                  <span className="px-1.5 py-0.5 bg-blue-200/80 text-blue-950 rounded-md text-[10px] font-bold font-mono" dir="ltr">
                    {leadershipStats.malePct}%
                  </span>
                </div>
              </div>

              <div className="p-1.5 sm:p-2 bg-rose-50/90 border border-rose-200/90 rounded-2xl flex flex-col items-center justify-center text-center shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 text-xs font-black text-rose-950">
                  <UserCheck className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                  <span>الإناث</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-1 font-black">
                  <span className="text-sm sm:text-base font-black text-rose-950 font-mono">{leadershipStats.femalesCount}</span>
                  <span className="px-1.5 py-0.5 bg-rose-200/80 text-rose-950 rounded-md text-[10px] font-bold font-mono" dir="ltr">
                    {leadershipStats.femalePct}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 👨‍🏫 بطاقة الكادر التدريسي بتصميم منسق وموحد بطبقتين */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-black text-slate-950">الكادر التدريسي</span>
              <div className="p-2.5 bg-slate-50 text-slate-950 rounded-2xl border border-slate-200">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950">
              {teacherDemographics.total_teachers}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-200 grid grid-cols-2 gap-1.5 sm:gap-2">
            <div className="p-1.5 sm:p-2 bg-blue-50/90 border border-blue-200/90 rounded-2xl flex flex-col items-center justify-center text-center shadow-2xs">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-blue-950">
                <Users className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span>الذكور</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-1 font-black">
                <span className="text-sm sm:text-base font-black text-blue-950 font-mono">{teacherDemographics.total_males}</span>
                <span className="px-1.5 py-0.5 bg-blue-200/80 text-blue-950 rounded-md text-[10px] font-bold font-mono" dir="ltr">
                  {teacherDemographics.male_percentage}%
                </span>
              </div>
            </div>

            <div className="p-1.5 sm:p-2 bg-rose-50/90 border border-rose-200/90 rounded-2xl flex flex-col items-center justify-center text-center shadow-2xs">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-rose-950">
                <UserCheck className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                <span>الإناث</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-1 font-black">
                <span className="text-sm sm:text-base font-black text-rose-950 font-mono">{teacherDemographics.total_females}</span>
                <span className="px-1.5 py-0.5 bg-rose-200/80 text-rose-950 rounded-md text-[10px] font-bold font-mono" dir="ltr">
                  {teacherDemographics.female_percentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 🎓 بطاقة الطلاب مع إحصائيات الصباحي والمسائي والذكور والإناث بطبقتين */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-black text-slate-950">إجمالي طلبة الجامعة</span>
              <div className="p-2.5 bg-indigo-50 text-indigo-950 rounded-2xl border border-indigo-100">
                <GraduationCap className="w-5 h-5 text-indigo-700" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950">
              {studentDemographics.total_students}
            </div>
          </div>
          
          <div className="mt-3 pt-2.5 border-t border-slate-200 space-y-1.5 sm:space-y-2">
            {/* ☀️ / 🌙 أعداد ونسب طلبة الصباحي والمسائي بالسماوي والكحلي */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <div className="p-1.5 sm:p-2 bg-sky-50/90 border border-sky-300/90 rounded-2xl flex flex-col items-center justify-center text-center shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 text-xs font-black text-sky-950">
                  <Sun className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>الصباحي</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-1 font-black">
                  <span className="text-sm sm:text-base font-black text-sky-950 font-mono">{studentDemographics.total_morning}</span>
                  <span className="px-1.5 py-0.5 bg-sky-200/80 text-sky-950 rounded-md text-[10px] font-bold font-mono" dir="ltr">
                    {studentDemographics.morning_percentage}%
                  </span>
                </div>
              </div>

              <div className="p-1.5 sm:p-2 bg-indigo-50/90 border border-indigo-300/90 rounded-2xl flex flex-col items-center justify-center text-center shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 text-xs font-black text-indigo-950">
                  <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>المسائي</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-1 font-black">
                  <span className="text-sm sm:text-base font-black text-indigo-950 font-mono">{studentDemographics.total_evening}</span>
                  <span className="px-1.5 py-0.5 bg-indigo-200/80 text-indigo-950 rounded-md text-[10px] font-bold font-mono" dir="ltr">
                    {studentDemographics.evening_percentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* 🚻 أعداد ونسب الذكور والإناث */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <div className="p-1.5 sm:p-2 bg-blue-50/90 border border-blue-200/90 rounded-2xl flex flex-col items-center justify-center text-center shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 text-xs font-black text-blue-950">
                  <Users className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span>الذكور</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-1 font-black">
                  <span className="text-sm sm:text-base font-black text-blue-950 font-mono">{studentDemographics.total_males}</span>
                  <span className="px-1.5 py-0.5 bg-blue-200/80 text-blue-950 rounded-md text-[10px] font-bold font-mono" dir="ltr">
                    {studentDemographics.male_percentage}%
                  </span>
                </div>
              </div>

              <div className="p-1.5 sm:p-2 bg-rose-50/90 border border-rose-200/90 rounded-2xl flex flex-col items-center justify-center text-center shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 text-xs font-black text-rose-950">
                  <UserCheck className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                  <span>الإناث</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-1 font-black">
                  <span className="text-sm sm:text-base font-black text-rose-950 font-mono">{studentDemographics.total_females}</span>
                  <span className="px-1.5 py-0.5 bg-rose-200/80 text-rose-950 rounded-md text-[10px] font-bold font-mono" dir="ltr">
                    {studentDemographics.female_percentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📘 بطاقة المواد */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs relative overflow-hidden sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-black text-slate-950">المواد الدراسية</span>
            <div className="p-2.5 bg-slate-50 text-slate-950 rounded-2xl border border-slate-200">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950">{totalCourses}</div>
          <p className="text-base text-slate-950 mt-1.5 font-black">مادة وفق مسار بولونيا</p>
        </div>

      </div>

      {/* 🗂️ وحدات الإدارة المركزية الرئيسية للمسؤول العام */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* 1. وحدة إدارة الأقسام مع توسيط الأيقونة والعنوان والشرح بالمنتصف */}
        <div className="bg-white border border-slate-200 p-6 sm:p-7 rounded-3xl shadow-xs space-y-4 flex flex-col justify-between items-center text-center hover:border-slate-300 transition">
          <div className="space-y-3 flex flex-col items-center text-center w-full">
            <div className="w-14 h-14 bg-slate-50 border border-slate-300 rounded-2xl flex items-center justify-center text-slate-950 shadow-2xs">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-950 text-center">إدارة الأقسام العلمية</h3>
            <p className="text-base text-slate-950 font-black leading-relaxed text-center">
              إضافة وتعديل وحذف الأقسام الأكاديمية الرسمية وتعيين رموزها المعتمدة في فرع ميسان.
            </p>
          </div>
          <Link
            href="/sadmin/departments"
            className="w-full py-3.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-base font-black transition flex items-center justify-center gap-2 shadow-xs border border-[#1e4570]"
          >
            <span>الدخول لإدارة الأقسام</span>
            <ArrowLeft className="w-5 h-5 text-slate-200" />
          </Link>
        </div>

        {/* 2. وحدة إدارة رؤساء الأقسام والمقررين مع توسيط الأيقونة والعنوان والشرح بالمنتصف */}
        <div className="bg-white border border-slate-200 p-6 sm:p-7 rounded-3xl shadow-xs space-y-4 flex flex-col justify-between items-center text-center hover:border-slate-300 transition">
          <div className="space-y-3 flex flex-col items-center text-center w-full">
            <div className="w-14 h-14 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center text-blue-950 shadow-2xs">
              <Users className="w-7 h-7 text-blue-700" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-950 text-center">إدارة رؤساء الأقسام والمقررين</h3>
            <p className="text-base text-slate-950 font-black leading-relaxed text-center">
              إنشاء حسابات رؤساء الأقسام والمقررين وتوليد كلمات المرور وتعيينهم لقيادة الأقسام.
            </p>
          </div>
          <Link
            href="/sadmin/department-heads"
            className="w-full py-3.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-base font-black transition flex items-center justify-center gap-2 shadow-xs border border-[#1e4570]"
          >
            <span>الدخول لإدارة القيادات</span>
            <ArrowLeft className="w-5 h-5 text-slate-200" />
          </Link>
        </div>

        {/* 3. التقارير والإحصائيات المركزية مع توسيط الأيقونة والعنوان والشرح بالمنتصف */}
        <div className="bg-white border border-slate-200 p-6 sm:p-7 rounded-3xl shadow-xs space-y-4 flex flex-col justify-between items-center text-center hover:border-slate-300 transition">
          <div className="space-y-3 flex flex-col items-center text-center w-full">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-950 shadow-2xs">
              <FileSpreadsheet className="w-7 h-7 text-emerald-700" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-950 text-center">التقارير والإحصائيات المركزية</h3>
            <p className="text-base text-slate-950 font-black leading-relaxed text-center">
              تصدير كشوفات الدرجات والمصفوفات الإحصائية الديموغرافية الشاملة لكافة الأقسام والمراحل بصيغة Excel.
            </p>
          </div>
          <Link
            href="/sadmin/reports"
            className="w-full py-3.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-base font-black transition flex items-center justify-center gap-2 shadow-xs border border-[#1e4570]"
          >
            <span>فتح صفحة التقارير</span>
            <ArrowLeft className="w-5 h-5 text-slate-200" />
          </Link>
        </div>

      </div>

      {/* 👥 مصفوفة وإحصائيات التوزيع الديموغرافي الشامل للطلبة والكادر التدريسي */}
      <div className="space-y-4">
        {/* 🏷️ هيدر قسم الإحصائيات الديموغرافية */}
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-950 shadow-2xs">
            <Users className="w-6 h-6 text-indigo-700" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2">
              <span>الإحصائيات الديموغرافية وتوزيع الأقسام</span>
              <span className="px-3 py-0.5 rounded-full bg-indigo-100 text-indigo-950 text-base font-black border border-indigo-200">
                كافة الأقسام الـ 12
              </span>
            </h2>
            <p className="text-base text-slate-950 font-black">
              تحليل أعداد الطلبة والأساتذة، وتعداد ونسب الذكور والإناث موزعة على كافة الأقسام العلمية
            </p>
          </div>
        </div>

        {/* 🎛️ أزرار التبديل ممتدة على طول عرض الصفحة بالكامل بتصميم كحلي فاخر يطابق مصادقة واعتماد */}
        <div className="w-full p-1.5 bg-slate-100 border border-slate-300 rounded-2xl grid grid-cols-2 gap-2 shadow-2xs">
          
          {/* 🎓 زر إحصائيات الطلاب ممتد بعرض النصف بتصميم كحلي متناسق */}
          <button
            type="button" // 🔤 نوع الزر
            id="sadmin-tab-students-matrix" // 🆔 المعرف البرمجي
            onClick={() => handleMatrixTabSwitch('students')} // 🔄 التبديل لمصفوفة الطلاب
            className={`w-full py-3.5 px-4 rounded-xl text-base sm:text-lg font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer select-none active:scale-[0.99] border-2 ${
              activeMatrixTab === 'students'
                ? 'bg-[#0F2942] text-white border-[#1e4570] shadow-sm ring-2 ring-cyan-400/30' // 🎨 المفعل: كحلي ملكي بتصميم مصادقة واعتماد
                : 'bg-white text-slate-900 hover:text-black border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs' // 🎨 غير المفعل: كرت أبيض بحدود واضحة ومحددة
            }`}
          >
            <GraduationCap className={`w-5 h-5 sm:w-6 sm:h-6 ${activeMatrixTab === 'students' ? 'text-cyan-300' : 'text-slate-700'}`} />
            <span>إحصائيات الطلاب</span>
          </button>

          {/* 👥 زر إحصائيات الأساتذة ممتد بعرض النصف بتصميم كحلي متناسق */}
          <button
            type="button" // 🔤 نوع الزر
            id="sadmin-tab-teachers-matrix" // 🆔 المعرف البرمجي
            onClick={() => handleMatrixTabSwitch('teachers')} // 🔄 التبديل لمصفوفة الأساتذة
            className={`w-full py-3.5 px-4 rounded-xl text-base sm:text-lg font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer select-none active:scale-[0.99] border-2 ${
              activeMatrixTab === 'teachers'
                ? 'bg-[#0F2942] text-white border-[#1e4570] shadow-sm ring-2 ring-cyan-400/30' // 🎨 المفعل: كحلي ملكي بتصميم مصادقة واعتماد
                : 'bg-white text-slate-900 hover:text-black border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs' // 🎨 غير المفعل: كرت أبيض بحدود واضحة ومحددة
            }`}
          >
            <Users className={`w-5 h-5 sm:w-6 sm:h-6 ${activeMatrixTab === 'teachers' ? 'text-cyan-300' : 'text-slate-700'}`} />
            <span>إحصائيات الأساتذة</span>
          </button>

        </div>

        {/* 📑 عرض المصفوفة المختارة */}
        {activeMatrixTab === 'students' ? (
          <StudentDemographicsMatrix demographicsData={studentDemographics} />
        ) : (
          <TeacherDemographicsMatrix demographicsData={teacherDemographics} />
        )}
      </div>

      {/* 📜 سجل التدقيق الحصين للنظام */}
      <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-950" />
            <span>آخر سجلات التدقيق والمراقبة الحصينة للنظام</span>
          </h2>
          <Link
            href="/sadmin/audit-logs"
            className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-sm sm:text-base font-black transition flex items-center gap-2 shadow-xs border border-[#1e4570] cursor-pointer"
          >
            <FileText className="w-4 h-4 text-cyan-300" />
            <span>عرض السجل الكامل</span>
            <ArrowLeft className="w-4 h-4 text-slate-300" />
          </Link>
        </div>

        <div className="space-y-3">
          {auditLogs.slice(0, 5).map((log, index) => (
            <div key={log.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-base">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center min-w-[28px] px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-sm font-black text-slate-950 shadow-2xs">
                  {index + 1}
                </span>
                <span className="px-3 py-1 bg-slate-950 text-white rounded-xl text-sm font-black">
                  {getTranslatedAuditAction(log.action)}
                </span>
                <span className="font-black text-slate-950 text-base">{translateAuditDetails(log.details)}</span>
              </div>
              <span className="text-slate-950 text-base font-black flex-shrink-0" dir="ltr">
                {formatEnglishDateTime(log.created_at)}
              </span>
            </div>
          ))}

          {auditLogs.length === 0 && (
            <div className="text-center py-6 text-slate-950 text-base font-black">
              لا توجد سجلات تدقيق مسجلة بعد.
            </div>
          )}
        </div>
      </div>

      {/* 📝 نافذة مصادقة واعتماد جداول الامتحانات النهائية */}
      {currentUser && (
        <SuperAdminExamApprovalModal
          isOpen={isExamApprovalModalOpen}
          onClose={() => setIsExamApprovalModalOpen(false)}
          schedules={examSchedules}
          slots={examSlots}
          students={profiles.filter((p) => p.role === 'student')}
          currentAdmin={currentUser}
          onUpdateScheduleStatus={handleUpdateExamScheduleStatus}
          onDeleteSchedule={handleDeleteExamSchedule}
        />
      )}

      {/* 🏛️ مصفوفة إشغال القاعات الامتحانية المركزية لكافة الأقسام */}
      <MasterCampusExamMatrixModal
        isOpen={isExamMatrixModalOpen}
        onClose={() => setIsExamMatrixModalOpen(false)}
        schedules={examSchedules}
        slots={examSlots}
        departments={departments}
      />

      </div>
    </ZeroTrustGuard>
  );
}
