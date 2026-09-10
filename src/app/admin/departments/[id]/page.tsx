'use client'; // ⚡ ينفذ بالعميل

// 🏢 الصفحة الخاصة بالقسم العلمي والمراحل والكورسات - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
// تصميم أكاديمي ملكي موحد لجميع الجداول، تحكم كامل بوحدات مسار بولونيا ECTS لرئيس القسم والمقرر، وعرض الوحدات الكلية والتفصيلية
import { useState, useEffect, use, useMemo, useRef } from 'react'; // 🔗 خطافات رياكت لإدارة الحالات والمراجع
import Link from 'next/link'; // 🔗 روابط التنقل
import { 
  getStoredData, 
  saveStoredData,
  INITIAL_DEPARTMENTS, 
  INITIAL_STAGES, 
  INITIAL_COURSES, 
  INITIAL_PROFILES, 
  INITIAL_GRADES 
} from '@/lib/mock-data'; // 💾 التخزين المحلي
import { 
  syncDepartmentsFromSupabase, 
  syncStagesFromSupabase, 
  syncCoursesFromSupabase, 
  syncProfilesFromSupabase, 
  syncGradesFromSupabase,
  saveCourseToSupabase
} from '@/lib/supabase-client'; // ☁️ المزامنة السحابية المباشرة مع Supabase
import { Department, Stage, Course, UserProfile, Grade } from '@/types'; // 🔗 الأنواع الصريحة
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧮 التعرف الذكي على جنس الطالب
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 أسماء المراحل بالعربية
import { 
  Layers, 
  BookOpen, 
  GraduationCap, 
  ArrowRight, 
  Users, 
  Sun, 
  Moon, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  ChevronsRight, 
  ChevronsLeft,
  ChevronDown,
  UserCheck,
  CheckCircle2,
  Building2,
  Check,
  Award,
  Pencil,
  X,
  Save
} from 'lucide-react'; // 🎨 الأيقونات البرمجية المتجهة النقية
import ZeroTrustGuard from '@/components/security/ZeroTrustGuard'; // 🛡️ حارس أمان Zero Trust
import { sanitizeRouteParam } from '@/lib/security/url-guard'; // 🛡️ معقم مسارات الروابط

// 🎓 مكون الصفحة الرئيسي لتفاصيل القسم الأكاديمي
export default function AdminDepartmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params); // 🔗 فك المعرف للقسم بأمان
  const deptId = sanitizeRouteParam(resolvedParams.id, 'dept-1'); // 🛡️ تعقيم المعرف

  // 📌 الحالات الأساسية للبيانات
  const [department, setDepartment] = useState<Department | null>(null); // 🏢 بيانات القسم
  const [stages, setStages] = useState<Stage[]>([]); // 🎓 المراحل الدراسية
  const [courses, setCourses] = useState<Course[]>([]); // 📚 المواد والكورسات
  const [students, setStudents] = useState<UserProfile[]>([]); // 👨‍🎓 طلاب القسم
  const [teachers, setTeachers] = useState<UserProfile[]>([]); // 👨‍🏫 أساتذة القسم
  const [grades, setGrades] = useState<Grade[]>([]); // 📊 سجلات الدرجات

  // 📌 تبويب المرحلة المختارة (1، 2، 3، 4)
  const [activeStageNum, setActiveStageNum] = useState<number>(1); // 🔢 المرحلة النشطة

  // 🔍 حالة البحث في جدول الطلاب
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>(''); // 🔍 نص البحث للطلاب
  const [studentGenderFilter, setStudentGenderFilter] = useState<'all' | 'male' | 'female'>('all'); // 🚻 فلتر الجنس
  const [studentStudyFilter, setStudentStudyFilter] = useState<'all' | 'morning' | 'evening'>('all'); // ☀️🌙 فلتر نوع الدراسة

  // 📄 حالة نظام الصفحات (Pagination) لجدول الطلاب
  const [currentPage, setCurrentPage] = useState<number>(1); // 📄 رقم الصفحة الحالية
  const [pageSize, setPageSize] = useState<number>(10); // 📏 عدد العناصر في الصفحة الواحدة

  // 📄 حالة نظام الصفحات (Pagination) لجدول المواد الدراسية
  const [coursesCurrentPage, setCoursesCurrentPage] = useState<number>(1); // 📄 رقم صفحة المواد الحالية
  const [coursesPageSize, setCoursesPageSize] = useState<number>(5); // 📏 عدد المواد بالصفحة الواحدة (افتراضي 5)
  const [isCoursesPageSizeOpen, setIsCoursesPageSizeOpen] = useState<boolean>(false); // 🔽 حالة فتح قائمة حجم صفحة المواد
  const coursesPageSizeDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع قائمة حجم صفحة المواد

  // 📄 حالة نظام الصفحات (Pagination) لجدول الكادر التدريسي
  const [teachersCurrentPage, setTeachersCurrentPage] = useState<number>(1); // 📄 رقم صفحة الأساتذة الحالية
  const [teachersPageSize, setTeachersPageSize] = useState<number>(5); // 📏 عدد الأساتذة بالصفحة الواحدة (افتراضي 5)
  const [isTeachersPageSizeOpen, setIsTeachersPageSizeOpen] = useState<boolean>(false); // 🔽 حالة فتح قائمة حجم صفحة الأساتذة
  const teachersPageSizeDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع قائمة حجم صفحة الأساتذة

  // 🔽 حالات القوائم المنسدلة المخصصة الاحترافية (Custom Dropdowns)
  const [isPageSizeOpen, setIsPageSizeOpen] = useState<boolean>(false); // 🔽 حالة فتح قائمة حجم الصفحة
  const pageSizeDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع عنصر قائمة حجم الصفحة

  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState<boolean>(false); // 🔽 حالة فتح قائمة فلتر الجنس
  const genderDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع عنصر قائمة فلتر الجنس

  // ⚙️ حالات مودال تعديل وحدات ECTS للمادة لرئيس القسم والمقرر
  const [editingCourseForEcts, setEditingCourseForEcts] = useState<Course | null>(null); // 📝 المادة الجاري تعديل وحداتها
  const [selectedEctsPoints, setSelectedEctsPoints] = useState<number>(5); // 🎯 عدد الوحدات المحدد
  const [isSavingEcts, setIsSavingEcts] = useState<boolean>(false); // ⏳ حالة حفظ الوحدات
  const [ectsSuccessMsg, setEctsSuccessMsg] = useState<string | null>(null); // 🟢 رسالة نجاح تعديل الوحدات

  // 🖱️ إغلاق القوائم المنسدلة المخصصة عند النقر خارجها أو الضغط على Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target; // 🎯 العنصر المستهدف
      if (target instanceof Node) {
        // فحص النقر خارج قائمة حجم صفحة الطلاب
        if (pageSizeDropdownRef.current && !pageSizeDropdownRef.current.contains(target)) {
          setIsPageSizeOpen(false); // 🔒 إغلاق قائمة الحجم للطلاب
        }
        // فحص النقر خارج قائمة حجم صفحة المواد
        if (coursesPageSizeDropdownRef.current && !coursesPageSizeDropdownRef.current.contains(target)) {
          setIsCoursesPageSizeOpen(false); // 🔒 إغلاق قائمة حجم المواد
        }
        // فحص النقر خارج قائمة حجم صفحة الأساتذة
        if (teachersPageSizeDropdownRef.current && !teachersPageSizeDropdownRef.current.contains(target)) {
          setIsTeachersPageSizeOpen(false); // 🔒 إغلاق قائمة حجم الأساتذة
        }
        // فحص النقر خارج قائمة فلتر الجنس
        if (genderDropdownRef.current && !genderDropdownRef.current.contains(target)) {
          setIsGenderDropdownOpen(false); // 🔒 إغلاق قائمة الجنس
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPageSizeOpen(false); // 🔒 إغلاق حجم الطلاب عند ضغط Escape
        setIsCoursesPageSizeOpen(false); // 🔒 إغلاق حجم المواد عند ضغط Escape
        setIsTeachersPageSizeOpen(false); // 🔒 إغلاق حجم الأساتذة عند ضغط Escape
        setIsGenderDropdownOpen(false); // 🔒 إغلاق الجنس عند ضغط Escape
        if (!isSavingEcts) setEditingCourseForEcts(null); // 🔒 إغلاق مودال الوحدات
      }
    };

    document.addEventListener('mousedown', handleClickOutside); // 👂 استماع للنقر
    document.addEventListener('keydown', handleKeyDown); // 👂 استماع للوحة المفاتيح
    return () => {
      document.removeEventListener('mousedown', handleClickOutside); // 🧹 تنظيف مستمع النقر
      document.removeEventListener('keydown', handleKeyDown); // 🧹 تنظيف مستمع المفاتيح
    };
  }, [isSavingEcts]);

  // 🔄 دالة تحميل بيانات القسم والمراحل والمواد والأساتذة
  const loadDepartmentData = () => {
    const allDepts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS); // 📂 جلب الأقسام
    const foundDept = allDepts.find((d) => d.id === deptId) || allDepts[0]; // 🎯 البحث عن القسم
    setDepartment(foundDept); // 💾 حفظ القسم

    const allStages = getStoredData<Stage[]>('stages', INITIAL_STAGES); // 📂 جلب المراحل
    const deptStages = allStages.filter((s) => s.department_id === foundDept?.id); // 🎯 مراحل القسم
    setStages(deptStages); // 💾 حفظ المراحل

    const allCourses = getStoredData<Course[]>('courses', INITIAL_COURSES); // 📂 جلب المواد
    const deptCourses = allCourses.filter((c) => c.department_name === foundDept?.name || c.department_id === foundDept?.id); // 🎯 مواد القسم
    setCourses(deptCourses); // 💾 حفظ المواد

    const allProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES); // 📂 جلب الحسابات
    const deptStudents = allProfiles.filter((p) => p.role === 'student' && (p.department_name === foundDept?.name || p.department_id === foundDept?.id)); // 🎯 طلاب القسم
    setStudents(deptStudents); // 💾 حفظ الطلاب

    const deptTeachers = allProfiles.filter((p) => p.role === 'teacher' && (p.department_name === foundDept?.name || p.department_id === foundDept?.id)); // 🎯 كادر القسم
    setTeachers(deptTeachers); // 💾 حفظ الكادر

    setGrades(getStoredData<Grade[]>('grades', INITIAL_GRADES)); // 📂 جلب الدرجات
  };

  // 🔄 الاستماع للتحديثات والمزامنة السحابية
  useEffect(() => {
    loadDepartmentData(); // 🚀 تحميل أولي للبيانات

    // ☁️ المزامنة السحابية الحية من Supabase
    syncDepartmentsFromSupabase().then((liveDepts) => {
      if (liveDepts && liveDepts.length > 0) {
        const liveDept = liveDepts.find((d) => d.id === deptId); // 🎯 مطابقة القسم
        if (liveDept) setDepartment(liveDept); // 💾 تحديث القسم
      }
    }).catch(() => {});

    syncStagesFromSupabase().then((liveStages) => {
      if (liveStages && liveStages.length > 0) {
        setStages(liveStages.filter((s) => s.department_id === deptId)); // 💾 تحديث المراحل
      }
    }).catch(() => {});

    syncCoursesFromSupabase().then((liveCourses) => {
      if (liveCourses && liveCourses.length > 0) {
        setCourses(liveCourses.filter((c) => c.department_id === deptId || c.department_name === department?.name)); // 💾 تحديث المواد
      }
    }).catch(() => {});

    syncProfilesFromSupabase().then((liveProfiles) => {
      if (liveProfiles && liveProfiles.length > 0) {
        setStudents(liveProfiles.filter((p) => p.role === 'student' && (p.department_id === deptId || p.department_name === department?.name))); // 💾 تحديث الطلاب
        setTeachers(liveProfiles.filter((p) => p.role === 'teacher' && (p.department_id === deptId || p.department_name === department?.name))); // 💾 تحديث الأساتذة
      }
    }).catch(() => {});

    syncGradesFromSupabase().then((liveGrades) => {
      if (liveGrades && liveGrades.length > 0) setGrades(liveGrades); // 💾 تحديث الدرجات
    }).catch(() => {});

    // 📡 الاستماع للتحديثات اللحظية للمواد عبر البوابات
    const handleCoursesSync = () => {
      const latestCourses = getStoredData<Course[]>('courses', INITIAL_COURSES);
      setCourses(latestCourses.filter((c) => c.department_id === deptId || c.department_name === department?.name));
    };

    window.addEventListener('courses_updated', handleCoursesSync);
    window.addEventListener('storage', handleCoursesSync);

    return () => {
      window.removeEventListener('courses_updated', handleCoursesSync);
      window.removeEventListener('storage', handleCoursesSync);
    };
  }, [deptId, department?.name]);

  // 🔍 تصفية المواد حسب المرحلة المختارة
  const stageCourses = useMemo(() => {
    return courses.filter((c) => c.stage_number === activeStageNum); // 📚 مواد المرحلة
  }, [courses, activeStageNum]);
  
  // 🔍 تصفية طلاب المرحلة المختارة
  const stageStudents = useMemo(() => {
    return students.filter((s) => s.stage_number === activeStageNum); // 🎓 طلاب المرحلة
  }, [students, activeStageNum]);

  // 🔍 تصفية الطلاب وفق معايير البحث والجنس ونوع الدراسة
  const filteredStudents = useMemo(() => {
    return stageStudents.filter((s) => {
      const gender = s.gender || detectArabicGender(s.full_name); // 🚻 تحديد الجنس
      const studyType = s.study_type || 'morning'; // ☀️🌙 تحديد نوع الدراسة
      
      const matchesSearch = s.full_name.toLowerCase().includes(studentSearchTerm.trim().toLowerCase()); // 🔍 تطابق البحث
      const matchesGender = studentGenderFilter === 'all' || gender === studentGenderFilter; // 🚻 تطابق الجنس
      const matchesStudy = studentStudyFilter === 'all' || studyType === studentStudyFilter; // ☀️🌙 تطابق الدراسة

      return matchesSearch && matchesGender && matchesStudy; // 🎯 النتيجة النهائية
    });
  }, [stageStudents, studentSearchTerm, studentGenderFilter, studentStudyFilter]);

  // 📄 إعادة ضبط الصفحة الأولى للطلاب عند تغيير المرحلة أو البحث أو الفلاتر
  useEffect(() => {
    setCurrentPage(1); // 🔄 تصفير صفحة الطلاب للبداية
  }, [activeStageNum, studentSearchTerm, studentGenderFilter, studentStudyFilter]);

  // 📄 إعادة ضبط صفحة المواد عند تغيير المرحلة الأكاديمية
  useEffect(() => {
    setCoursesCurrentPage(1); // 🔄 تصفير صفحة المواد للمرحلة الجديدة
  }, [activeStageNum]);

  // 📄 حسابات نظام الصفحات لجدول المواد الدراسية
  const totalCoursesCount = stageCourses.length; // 🔢 إجمالي مواد المرحلة الحالية
  const totalCoursePages = Math.max(1, Math.ceil(totalCoursesCount / coursesPageSize)); // 📄 إجمالي عدد صفحات المواد
  const safeCourseCurrentPage = Math.min(Math.max(1, coursesCurrentPage), totalCoursePages); // 🛡️ رقم صفحة مواد آمن
  const courseStartIndex = (safeCourseCurrentPage - 1) * coursesPageSize; // 🔢 بداية شريحة المواد
  const paginatedCourses = stageCourses.slice(courseStartIndex, courseStartIndex + coursesPageSize); // 📋 المواد المعروضة بالصفحة الحالية

  // 📄 حسابات نظام الصفحات لجدول الكادر التدريسي
  const totalTeachersCount = teachers.length; // 🔢 إجمالي أساتذة القسم
  const totalTeacherPages = Math.max(1, Math.ceil(totalTeachersCount / teachersPageSize)); // 📄 إجمالي صفحات الأساتذة
  const safeTeacherCurrentPage = Math.min(Math.max(1, teachersCurrentPage), totalTeacherPages); // 🛡️ رقم صفحة أساتذة آمن
  const teacherStartIndex = (safeTeacherCurrentPage - 1) * teachersPageSize; // 🔢 بداية شريحة الأساتذة
  const paginatedTeachers = teachers.slice(teacherStartIndex, teacherStartIndex + teachersPageSize); // 📋 الأساتذة المعروضون بالصفحة الحالية

  // 📄 حسابات نظام الصفحات لجدول الطلاب
  const totalStudentsCount = filteredStudents.length; // 🔢 إجمالي الطلاب المفلترين
  const totalPages = Math.max(1, Math.ceil(totalStudentsCount / pageSize)); // 📄 إجمالي عدد الصفحات
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages); // 🛡️ رقم صفحة آمن
  const startIndex = (safeCurrentPage - 1) * pageSize; // 🔢 بداية الشريحة
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + pageSize); // 📋 الطلاب المعروضون في الصفحة الحالية

  // 🧮 إحصائيات طلاب القسم كلياً (ذكور وإناث)
  const totalDeptMales = students.filter((s) => (s.gender || detectArabicGender(s.full_name)) === 'male').length; // 👨 عدد الذكور
  const totalDeptFemales = students.length - totalDeptMales; // 👩 عدد الإناث
  const malePercentage = students.length > 0 ? Math.round((totalDeptMales / students.length) * 100) : 0; // 📊 نسبة الذكور
  const femalePercentage = students.length > 0 ? Math.round((totalDeptFemales / students.length) * 100) : 0; // 📊 نسبة الإناث

  // ☀️🌙 إحصائيات طلاب القسم كلياً (صباحي ومسائي)
  const totalDeptMorning = students.filter((s) => (s.study_type || 'morning') === 'morning').length; // ☀️ عدد الصباحي
  const totalDeptEvening = students.length - totalDeptMorning; // 🌙 عدد المسائي
  const morningPercentage = students.length > 0 ? Math.round((totalDeptMorning / students.length) * 100) : 0; // 📊 نسبة الصباحي
  const eveningPercentage = students.length > 0 ? Math.round((totalDeptEvening / students.length) * 100) : 0; // 📊 نسبة المسائي

  // 👨‍🏫 إحصائيات أساتذة القسم (ذكور وإناث)
  const totalTchMales = teachers.filter((t) => (t.gender || detectArabicGender(t.full_name)) === 'male').length; // 👨 عدد أساتذة ذكور
  const totalTchFemales = teachers.length - totalTchMales; // 👩 عدد أستاذات إناث

  // 🎓 حسابات وحدات مسار بولونيا (ECTS) الشاملة للقسم والمراحل
  const stage1Courses = useMemo(() => courses.filter((c) => c.stage_number === 1), [courses]);
  const stage2Courses = useMemo(() => courses.filter((c) => c.stage_number === 2), [courses]);
  const stage3Courses = useMemo(() => courses.filter((c) => c.stage_number === 3), [courses]);
  const stage4Courses = useMemo(() => courses.filter((c) => c.stage_number === 4), [courses]);

  const stage1Ects = useMemo(() => stage1Courses.reduce((sum, c) => sum + (c.credit_hours || 0), 0), [stage1Courses]);
  const stage2Ects = useMemo(() => stage2Courses.reduce((sum, c) => sum + (c.credit_hours || 0), 0), [stage2Courses]);
  const stage3Ects = useMemo(() => stage3Courses.reduce((sum, c) => sum + (c.credit_hours || 0), 0), [stage3Courses]);
  const stage4Ects = useMemo(() => stage4Courses.reduce((sum, c) => sum + (c.credit_hours || 0), 0), [stage4Courses]);

  const totalDeptEcts = stage1Ects + stage2Ects + stage3Ects + stage4Ects; // 💯 المجموع الكلي لوحدات القسم
  const activeStageEcts = useMemo(() => stageCourses.reduce((sum, c) => sum + (c.credit_hours || 0), 0), [stageCourses]); // 🎯 مجموع وحدات المرحلة النشطة

  // 💾 دالة حفظ وتحديث وحدات المادة في التخزين والسحابة وبث التحديث المباشر
  const handleSaveCourseEcts = async () => {
    if (!editingCourseForEcts) return;
    setIsSavingEcts(true);
    setEctsSuccessMsg(null);

    const updatedCourse: Course = {
      ...editingCourseForEcts,
      credit_hours: selectedEctsPoints,
    };

    // 1. تحديث قائمة المواد محلياً
    const allStoredCourses = getStoredData<Course[]>('courses', INITIAL_COURSES);
    const updatedAllCourses = allStoredCourses.map((c) => (c.id === updatedCourse.id ? updatedCourse : c));
    saveStoredData('courses', updatedAllCourses);

    // تحديث حالة الواجهة الحالية
    setCourses((prev) => prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c)));

    // 2. المزامنة السحابية مع Supabase
    try {
      await saveCourseToSupabase(updatedCourse);
    } catch {}

    // 3. إطلاق أحداث التحديث اللحظي لجميع التبويبات والشاشات (الطلاب والأساتذة)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('courses_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    setEctsSuccessMsg(`تم تحديث وحدات مادة (${updatedCourse.name}) إلى ${selectedEctsPoints} ECTS بنجاح!`);
    setIsSavingEcts(false);

    // إغلاق النافذة بعد ثانية واحدة لإظهار التأكيد
    setTimeout(() => {
      setEditingCourseForEcts(null);
      setEctsSuccessMsg(null);
    }, 1200);
  };

  return (
    <ZeroTrustGuard 
      allowedRoles={['super_admin', 'admin', 'department_head', 'rapporteur']} 
      requiredDepartmentId={deptId} 
      redirectFallback="/sadmin"
    >
      {/* 🏛️ الحاوية العريضة لتقليل المساحات الجانبية الفارغة */}
      <div className="space-y-6 font-sans w-full max-w-[1900px] mx-auto px-2 sm:px-4 py-4" dir="rtl">
      
        {/* 🏛️ ترويسة القسم الأكاديمية الملكية الفاخرة */}
        <div className="bg-white border border-slate-300 p-6 sm:p-7 rounded-3xl shadow-xs flex items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/departments" 
              className="p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-2xl transition border border-slate-300 shadow-2xs active:scale-95 shrink-0"
              title="العودة لقائمة الأقسام العلمية"
            >
              <ArrowRight className="w-6 h-6 text-slate-950" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3.5 py-1 bg-[#0F2942] text-white font-black text-sm sm:text-base rounded-xl shadow-2xs font-mono">
                  {department?.code || 'DEPT'}
                </span>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950">
                  {department?.name || 'القسم العلمي'}
                </h1>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                  <span>معتمد أكاديمياً (مسار بولونيا)</span>
                </span>
              </div>
              <p className="text-sm sm:text-base font-black text-slate-950 mt-1.5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-950 shrink-0" />
                <span>جامعة الإمام جعفر الصادق (ع) - فرع ميسان | الإشراف الأكاديمي والمناهج والكادر</span>
              </p>
            </div>
          </div>
        </div>

        {/* 📊 بطاقات إحصائية سريعة وديموغرافية شاملة للقسم بتصميم Bento كامل العرض وواضح وفخم ومستقل */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* 🎓 بطاقة إجمالي الطلاب */}
          <div className="bg-white border border-slate-300 p-5 rounded-3xl text-right space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between text-slate-950 text-sm sm:text-base font-black">
              <span>إجمالي الطلاب</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shadow-2xs">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950">
              {students.length} <span className="text-sm sm:text-base font-black text-slate-950">طالب/ـة</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-950 pt-2 border-t border-slate-200 flex items-center justify-between">
              <span>عبر المراحل الـ 4</span>
              <span className="px-2.5 py-0.5 bg-slate-100 rounded-lg text-slate-950 font-black border border-slate-300 text-xs">100% مسجلين</span>
            </div>
          </div>

          {/* ☀️🌙 بطاقة توزيع الفترات الدراسية (خالية من اللون البرتقالي) */}
          <div className="bg-white border border-slate-300 p-5 rounded-3xl text-right space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between text-slate-950 text-sm sm:text-base font-black">
              <span>الفترة الدراسية</span>
              <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shadow-2xs">
                <Sun className="w-5 h-5 text-sky-600" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm sm:text-base font-black">
              <span className="text-slate-950 font-black flex items-center gap-1.5">
                <span>صباحي:</span>
                <strong className="text-sky-950 font-black text-base sm:text-lg">{totalDeptMorning}</strong>
              </span>
              <span className="text-slate-400 font-bold">•</span>
              <span className="text-slate-950 font-black flex items-center gap-1.5">
                <span>مسائي:</span>
                <strong className="text-indigo-950 font-black text-base sm:text-lg">{totalDeptEvening}</strong>
              </span>
            </div>
            <div className="pt-1">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex border border-slate-200">
                <div style={{ width: `${morningPercentage}%` }} className="bg-sky-500 h-full transition-all duration-500" title={`صباحي: ${morningPercentage}%`}></div>
                <div style={{ width: `${eveningPercentage}%` }} className="bg-indigo-600 h-full transition-all duration-500" title={`مسائي: ${eveningPercentage}%`}></div>
              </div>
              <div className="flex items-center justify-between text-xs font-black text-slate-950 mt-1.5">
                <span className="text-sky-950">{morningPercentage}% ص</span>
                <span className="text-indigo-950">{eveningPercentage}% م</span>
              </div>
            </div>
          </div>

          {/* 🚻 بطاقة التوزيع الديموغرافي */}
          <div className="bg-white border border-slate-300 p-5 rounded-3xl text-right space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between text-slate-950 text-sm sm:text-base font-black">
              <span>الجنس (ذكور/إناث)</span>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-900 shadow-2xs">
                <Users className="w-5 h-5 text-indigo-800" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm sm:text-base font-black">
              <span className="text-slate-950 font-black flex items-center gap-1.5">
                <span>ذكور:</span>
                <strong className="text-blue-950 font-black text-base sm:text-lg">{totalDeptMales}</strong>
              </span>
              <span className="text-slate-400 font-bold">•</span>
              <span className="text-slate-950 font-black flex items-center gap-1.5">
                <span>إناث:</span>
                <strong className="text-rose-950 font-black text-base sm:text-lg">{totalDeptFemales}</strong>
              </span>
            </div>
            <div className="pt-1">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex border border-slate-200">
                <div style={{ width: `${malePercentage}%` }} className="bg-blue-600 h-full transition-all duration-500" title={`ذكور: ${malePercentage}%`}></div>
                <div style={{ width: `${femalePercentage}%` }} className="bg-rose-500 h-full transition-all duration-500" title={`إناث: ${femalePercentage}%`}></div>
              </div>
              <div className="flex items-center justify-between text-xs font-black text-slate-950 mt-1.5">
                <span className="text-blue-950">{malePercentage}% ذ</span>
                <span className="text-rose-950">{femalePercentage}% ث</span>
              </div>
            </div>
          </div>

          {/* 👨‍🏫 بطاقة الكادر والمواد */}
          <div className="bg-white border border-slate-300 p-5 rounded-3xl text-right space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between text-slate-950 text-sm sm:text-base font-black">
              <span>الكادر والمواد</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 shadow-2xs">
                <BookOpen className="w-5 h-5 text-emerald-700" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-950 flex items-baseline gap-2">
              <span>{teachers.length} <span className="text-xs sm:text-sm font-black text-slate-950">أساتذة</span></span>
              <span className="text-slate-400 font-bold">•</span>
              <span>{courses.length} <span className="text-xs sm:text-sm font-black text-slate-950">مادة</span></span>
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-950 pt-2 border-t border-slate-200 flex items-center justify-between">
              <span>ذكور: <strong className="text-blue-950">{totalTchMales}</strong></span>
              <span className="text-slate-400">|</span>
              <span>إناث: <strong className="text-rose-950">{totalTchFemales}</strong></span>
            </div>
          </div>

          {/* 🎖️ بطاقة وحدات مسار بولونيا الكلية للقسم (ECTS) مع كتابة أسماء المراحل الأربعة كاملة */}
          <div className="bg-white border border-slate-300 p-5 rounded-3xl text-right space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between text-slate-950 text-sm sm:text-base font-black">
              <span>وحدات القسم (ECTS)</span>
              <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-800 shadow-2xs">
                <Award className="w-5 h-5 text-sky-700" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950 font-mono flex items-baseline gap-1.5">
              <span>{totalDeptEcts}</span>
              <span className="text-xs sm:text-sm font-black text-slate-950 font-sans">وحدة معتمدة</span>
            </div>
            <div className="text-xs font-black text-slate-950 pt-2 border-t border-slate-200 grid grid-cols-2 gap-1.5">
              <span className="truncate">المرحلة الأولى: <strong className="text-indigo-950">{stage1Ects}</strong></span>
              <span className="truncate">المرحلة الثانية: <strong className="text-indigo-950">{stage2Ects}</strong></span>
              <span className="truncate">المرحلة الثالثة: <strong className="text-indigo-950">{stage3Ects}</strong></span>
              <span className="truncate">المرحلة الرابعة: <strong className="text-indigo-950">{stage4Ects}</strong></span>
            </div>
          </div>

        </div>

        {/* 🎓 لوحة تصفح المراحل الـ 4 الرئيسية للقسم مع إبراز وحدات كل مرحلة */}
        <div className="bg-white border border-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 pb-4">
            <h2 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-[#0F2942]" />
              <span>المراحل الدراسية لـ ({department?.name})</span>
            </h2>
            <span className="text-xs sm:text-sm font-black text-slate-950">
              اختر المرحلة لاستعراض وإدارة مناهجها ووحداتها وطلبتها المعتمدين
            </span>
          </div>

          {/* 🔘 كروت المراحل الـ 4 بتصميم Bento تفاعلي ومرتب مع رصيد وحدات ECTS لكل مرحلة */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((num) => {
              const countCourses = courses.filter((c) => c.stage_number === num).length; // 📚 مواد المرحلة
              const stgCourses = courses.filter((c) => c.stage_number === num); // 📚 قائمة مواد المرحلة
              const stageEcts = stgCourses.reduce((sum, c) => sum + (c.credit_hours || 0), 0); // 🎖️ مجموع وحدات المرحلة ECTS
              const stgStudents = students.filter((s) => s.stage_number === num); // 🎓 طلاب المرحلة
              const countStds = stgStudents.length; // 🔢 عدد الطلاب
              const stageMales = stgStudents.filter((s) => (s.gender || detectArabicGender(s.full_name)) === 'male').length; // 👨 الذكور
              const stageFemales = countStds - stageMales; // 👩 الإناث
              const stageMorning = stgStudents.filter((s) => (s.study_type || 'morning') === 'morning').length; // ☀️ الصباحي
              const stageEvening = countStds - stageMorning; // 🌙 المسائي
              const isSelected = activeStageNum === num; // 🎯 التحقق من التحديد

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setActiveStageNum(num);
                  }}
                  className={`p-5 rounded-3xl border text-right transition-all duration-200 cursor-pointer relative overflow-hidden active:scale-[0.98] ${
                    isSelected
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-lg ring-2 ring-blue-500/30'
                      : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:border-slate-400 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-lg sm:text-xl">
                      المرحلة {getStageNameInArabic(num)}
                    </span>
                    <span className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-base font-mono shadow-2xs ${
                      isSelected ? 'bg-white/20 text-white border border-white/20' : 'bg-slate-200 text-slate-950 border border-slate-300'
                    }`}>
                      {num}
                    </span>
                  </div>

                  {/* 📚 عدد المواد والوحدات وعدد الطلاب بتصميم كبسولات مريحة وأوضح */}
                  <div className={`text-sm sm:text-base font-black mt-2.5 flex items-center justify-between gap-1.5 flex-wrap ${
                    isSelected ? 'text-blue-100' : 'text-slate-950'
                  }`}>
                    <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black ${
                      isSelected ? 'bg-white/15 text-white' : 'bg-slate-200/90 text-slate-950'
                    }`}>
                      {countCourses} مواد ({stageEcts} ECTS)
                    </span>
                    <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black ${
                      isSelected ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-300/30' : 'bg-indigo-50 text-indigo-950 border border-indigo-200'
                    }`}>
                      {countStds} طالب/ـة
                    </span>
                  </div>

                  {/* 📊 شريط الإحصائيات المصغرة للمرحلة بكبسولات مكبرة وواضحة جداً ومريحة للعين */}
                  <div className={`mt-3.5 pt-3.5 border-t grid grid-cols-2 gap-2 text-xs sm:text-sm font-black ${
                    isSelected ? 'border-white/20' : 'border-slate-300'
                  }`}>
                    {/* ☀️ صباحي (تم استبدال البرتقالي بالسماوي الراقي) */}
                    <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border ${
                      isSelected ? 'bg-white/10 border-white/15 text-white' : 'bg-white border-slate-200 text-slate-950 shadow-2xs'
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <Sun className={`w-4 h-4 shrink-0 ${isSelected ? 'text-sky-300' : 'text-sky-600'}`} />
                        <span>صباحي:</span>
                      </span>
                      <strong className={`font-mono text-sm sm:text-base font-black ${isSelected ? 'text-sky-200' : 'text-slate-950'}`}>
                        {stageMorning}
                      </strong>
                    </div>

                    {/* 🌙 مسائي */}
                    <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border ${
                      isSelected ? 'bg-white/10 border-white/15 text-white' : 'bg-white border-slate-200 text-slate-950 shadow-2xs'
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <Moon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-300' : 'text-indigo-600'}`} />
                        <span>مسائي:</span>
                      </span>
                      <strong className={`font-mono text-sm sm:text-base font-black ${isSelected ? 'text-indigo-200' : 'text-slate-950'}`}>
                        {stageEvening}
                      </strong>
                    </div>

                    {/* 👨 ذكور */}
                    <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border ${
                      isSelected ? 'bg-white/10 border-white/15 text-white' : 'bg-white border-slate-200 text-slate-950 shadow-2xs'
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSelected ? 'bg-cyan-400' : 'bg-blue-600'}`}></span>
                        <span>ذكور:</span>
                      </span>
                      <strong className={`font-mono text-sm sm:text-base font-black ${isSelected ? 'text-cyan-200' : 'text-blue-950'}`}>
                        {stageMales}
                      </strong>
                    </div>

                    {/* 👩 إناث */}
                    <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border ${
                      isSelected ? 'bg-white/10 border-white/15 text-white' : 'bg-white border-slate-200 text-slate-950 shadow-2xs'
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSelected ? 'bg-rose-400' : 'bg-rose-500'}`}></span>
                        <span>إناث:</span>
                      </span>
                      <strong className={`font-mono text-sm sm:text-base font-black ${isSelected ? 'text-rose-200' : 'text-rose-950'}`}>
                        {stageFemales}
                      </strong>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 📘 المواد الكورسات التابعة للمرحلة المختارة (جدول نظامي موحد مع تحكم وإحصائيات ECTS) */}
          <div className="pt-2 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#0F2942]" />
                  <span>المواد الكورسات المعتمدة للمرحلة {getStageNameInArabic(activeStageNum)}:</span>
                  <span className="text-xs sm:text-sm font-black text-slate-950">({stageCourses.length} مادة)</span>
                </h3>
                <p className="text-xs sm:text-sm font-black text-slate-950 mt-1">
                  جدول المقررات الدراسية والوحدات المعتمدة ECTS وفق دليل مسار بولونيا
                </p>
              </div>

              {/* 🎖️ بادج إجمالي وحدات المرحلة الرسمي والأنيق (بديل زر عرض كافة المواد القديم) */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-4 py-2 bg-sky-50 text-slate-950 border border-sky-300 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-2xs">
                  <Award className="w-4 h-4 text-sky-700" />
                  <span>إجمالي وحدات المرحلة {getStageNameInArabic(activeStageNum)}:</span>
                  <strong className="text-sky-950 font-mono text-sm sm:text-base">{activeStageEcts}</strong>
                  <span className="text-sky-900 font-bold">ECTS</span>
                </span>
              </div>
            </div>

            {/* 📋 جدول المواد الدراسية المعتمدة للمرحلة بتصميم مطابق لجدول الطلاب مع إمكانية تعديل الوحدات */}
            <div className="overflow-hidden rounded-3xl border border-slate-300 shadow-xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm sm:text-base font-black">
                  <thead className="bg-slate-100 text-slate-950 font-black border-b border-slate-300">
                    <tr>
                      {/* 🔢 التسلسل */}
                      <th className="p-4 w-16 text-center text-slate-950 font-black">#</th>
                      {/* 🔢 رمز المادة */}
                      <th className="p-4 w-36 text-center text-slate-950 font-black">رمز المادة</th>
                      {/* 📘 اسم المادة الدراسية */}
                      <th className="p-4 min-w-[220px] text-slate-950 font-black">اسم المادة الدراسية</th>
                      {/* ⏳ الوحدات المعتمدة ECTS */}
                      <th className="p-4 w-48 text-center text-slate-950 font-black">الوحدات (ECTS)</th>
                      {/* 👥 الطلبة المسجلون */}
                      <th className="p-4 w-36 text-center text-slate-950 font-black">الطلبة المسجلون</th>
                      {/* 📊 الإجراء وسجل الدرجات */}
                      <th className="p-4 w-40 text-center text-slate-950 font-black">سجل الدرجات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {paginatedCourses.map((c, idx) => {
                      const cGrades = grades.filter((g) => g.course_id === c.id); // 📊 درجات المادة
                      const globalIndex = courseStartIndex + idx + 1; // 🔢 التسلسل العام الدقيق في الصفحة

                      return (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors font-black text-slate-950">
                          {/* 🔢 التسلسل العام للمادة */}
                          <td className="p-4 text-center font-mono text-slate-950 font-black">
                            {globalIndex}
                          </td>

                          {/* 🔢 رمز المادة الكودي */}
                          <td className="p-4 text-center">
                            <span className="px-3 py-1 bg-[#0F2942] text-white font-black text-xs sm:text-sm font-mono rounded-xl shadow-2xs">
                              {c.code}
                            </span>
                          </td>

                          {/* 📘 اسم المادة */}
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <BookOpen className="w-4 h-4 text-[#0F2942] shrink-0" />
                              <span className="font-black text-slate-950">{c.name}</span>
                            </div>
                          </td>

                          {/* ⏳ الساعات المعتمدة ECTS مع زر تعديل تفاعلي لرئيس القسم والمقرر */}
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCourseForEcts(c);
                                setSelectedEctsPoints(c.credit_hours || 5);
                              }}
                              className="text-xs sm:text-sm font-black text-slate-950 bg-sky-100 hover:bg-sky-200 border border-sky-300 px-3.5 py-1.5 rounded-xl transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs active:scale-95 group"
                              title="انقر لتعديل وحدات المادة (رئيس القسم / المقرر)"
                            >
                              <span>{c.credit_hours || 5} وحدات (ECTS)</span>
                              <Pencil className="w-3 h-3 text-sky-800 opacity-60 group-hover:opacity-100 transition" />
                            </button>
                          </td>

                          {/* 👥 الطلبة المسجلون */}
                          <td className="p-4 text-center font-mono text-slate-950 font-black">
                            {cGrades.length} طالب/ـة
                          </td>

                          {/* 📊 رابط سجل درجات بولونيا */}
                          <td className="p-4 text-center">
                            <Link
                              href={`/teacher/courses/${c.id}`}
                              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition shadow-2xs"
                            >
                              <span>عرض السجل</span>
                              <ArrowRight className="w-3.5 h-3.5 rotate-180 text-blue-900" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}

                    {stageCourses.length === 0 && (
                      <tr>
                        {/* 📭 تنبيه عدم وجود مواد بالمرحلة */}
                        <td colSpan={6} className="p-10 text-center text-slate-950 text-base font-black bg-slate-50">
                          لا توجد مواد دراسية مضافة لهذه المرحلة بعد. يمكنك إضافتها من قائمة المواد العامة.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 📄 شريط نظام الصفحات (Pagination) الفاخر لجدول المواد الدراسية مطابق لجدول الطلاب 100% */}
              {totalCoursesCount > 0 && (
                <div className="p-4 bg-slate-50 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-black">
                  
                  {/* ملخص العرض */}
                  <div className="text-slate-950 font-black">
                    عرض من <span className="text-slate-950 font-black font-mono">{courseStartIndex + 1}</span> إلى{' '}
                    <span className="text-slate-950 font-black font-mono">
                      {Math.min(courseStartIndex + coursesPageSize, totalCoursesCount)}
                    </span>{' '}
                    من إجمالي <span className="text-slate-950 font-black font-mono">{totalCoursesCount}</span> مادة
                  </div>

                  {/* أزرار التنقل بين الصفحات والقائمة المنسدلة الاحترافية */}
                  <div className="flex items-center gap-2">
                    
                    {/* 🔽 القائمة المنسدلة الاحترافية لاختيار حجم الصفحة - تظهر للأعلى داخل الشاشة */}
                    <div className="relative" ref={coursesPageSizeDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsCoursesPageSizeOpen((prev) => !prev)}
                        className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer shadow-2xs active:scale-95"
                        title="عدد المواد في الصفحة"
                        aria-expanded={isCoursesPageSizeOpen}
                      >
                        <span>{coursesPageSize} مواد</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-950 transition-transform duration-200 ${isCoursesPageSizeOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* 📋 القائمة المنبثقة للأعلى داخل إطار الجدول والشاشة */}
                      {isCoursesPageSizeOpen && (
                        <div 
                          className="absolute bottom-full mb-2 right-0 z-50 min-w-[130px] bg-white border border-slate-300 rounded-2xl shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                          role="menu"
                        >
                          <div className="px-2.5 py-1 text-[11px] font-black text-slate-600 border-b border-slate-200 pb-1.5 mb-1">
                            عرض في الصفحة:
                          </div>
                          {[
                            { value: 5, label: '5 مواد' },
                            { value: 10, label: '10 مواد' },
                            { value: 20, label: '20 مادة' },
                          ].map((option) => {
                            const isSelected = coursesPageSize === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  setCoursesPageSize(option.value);
                                  setCoursesCurrentPage(1);
                                  setIsCoursesPageSizeOpen(false);
                                }}
                                className={`w-full text-right px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#0F2942] text-white shadow-2xs'
                                    : 'text-slate-950 hover:bg-slate-100'
                                }`}
                                role="menuitem"
                              >
                                <span>{option.label}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* الصفحة الأولى */}
                      <button
                        type="button"
                        onClick={() => setCoursesCurrentPage(1)}
                        disabled={safeCourseCurrentPage <= 1}
                        className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        title="الصفحة الأولى"
                      >
                        <ChevronsRight className="w-4 h-4 text-slate-950" />
                      </button>

                      {/* الصفحة السابقة */}
                      <button
                        type="button"
                        onClick={() => setCoursesCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safeCourseCurrentPage <= 1}
                        className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        title="الصفحة السابقة"
                      >
                        <ChevronRight className="w-4 h-4 text-slate-950" />
                      </button>

                      {/* ترقيم الصفحات */}
                      <div className="px-3 py-1.5 bg-[#0F2942] text-white rounded-xl text-xs font-mono font-black shadow-2xs">
                        {safeCourseCurrentPage} / {totalCoursePages}
                      </div>

                      {/* الصفحة التالية */}
                      <button
                        type="button"
                        onClick={() => setCoursesCurrentPage((p) => Math.min(totalCoursePages, p + 1))}
                        disabled={safeCourseCurrentPage >= totalCoursePages}
                        className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        title="الصفحة التالية"
                      >
                        <ChevronLeft className="w-4 h-4 text-slate-950" />
                      </button>

                      {/* الصفحة الأخيرة */}
                      <button
                        type="button"
                        onClick={() => setCoursesCurrentPage(totalCoursePages)}
                        disabled={safeCourseCurrentPage >= totalCoursePages}
                        className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        title="الصفحة الأخيرة"
                      >
                        <ChevronsLeft className="w-4 h-4 text-slate-950" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 👨‍🏫 الكادر التدريسي المكلف بالقسم العلمي (جدول نظامي موحد مثل الطلاب) */}
          <div className="pt-6 border-t border-slate-300 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-[#0F2942]" />
                  <span>الكادر التدريسي المكلف بـ ({department?.name}):</span>
                  <span className="text-xs sm:text-sm font-black text-slate-950">({teachers.length} أستاذ/ـة)</span>
                </h3>
                <p className="text-xs sm:text-sm font-black text-slate-950 mt-1">
                  أساتذة ومقررو المواد الأكاديمية المكلفون بالتدريس في هذا القسم
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm font-black">
                <span className="text-blue-950 bg-blue-100 px-3 py-1 rounded-xl border border-blue-300">
                  التدريسيين الذكور: {totalTchMales}
                </span>
                <span className="text-rose-950 bg-rose-100 px-3 py-1 rounded-xl border border-rose-300">
                  التدريسيات الإناث: {totalTchFemales}
                </span>
              </div>
            </div>

            {/* 📋 جدول الكادر التدريسي المكلف بالقسم بتصميم مطابق لجدول الطلاب */}
            <div className="overflow-hidden rounded-3xl border border-slate-300 shadow-xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm sm:text-base font-black">
                  <thead className="bg-slate-100 text-slate-950 font-black border-b border-slate-300">
                    <tr>
                      {/* 🔢 التسلسل */}
                      <th className="p-4 w-16 text-center text-slate-950 font-black">#</th>
                      {/* 👤 الاسم الكامل للأستاذ */}
                      <th className="p-4 min-w-[220px] text-slate-950 font-black">اسم الأستاذ / التدريسي الكامل</th>
                      {/* 🚻 الجنس / الرتبة */}
                      <th className="p-4 min-w-[130px] text-center text-slate-950 font-black whitespace-nowrap">الجنس / الرتبة</th>
                      {/* 🏛️ الصفة بالقسم */}
                      <th className="p-4 min-w-[220px] text-center text-slate-950 font-black whitespace-nowrap">الصفة بالقسم</th>
                      {/* 📚 المواد المكلف بها */}
                      <th className="p-4 min-w-[220px] text-center text-slate-950 font-black whitespace-nowrap">المواد المكلف بها</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {paginatedTeachers.map((t, idx) => {
                      const gender = t.gender || detectArabicGender(t.full_name); // 🚻 تحديد الجنس
                      const isFemale = gender === 'female'; // 👩 فحص إن كانت أستاذة
                      const globalIndex = teacherStartIndex + idx + 1; // 🔢 التسلسل العام الدقيق للأستاذ
                      
                      // 📚 فحص المواد المكلف بها الأستاذ في القسم
                      const assignedCourses = courses.filter(
                        (c) => c.theory_teacher_name === t.full_name || c.practical_teacher_name === t.full_name || c.theory_teacher_id === t.id || c.practical_teacher_id === t.id
                      );

                      return (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors font-black text-slate-950">
                          {/* 🔢 التسلسل العام للأستاذ */}
                          <td className="p-4 text-center font-mono text-slate-950 font-black text-base">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-950 border border-slate-300 font-black text-sm rounded-lg shadow-2xs inline-block">
                              {globalIndex}
                            </span>
                          </td>

                          {/* 👤 اسم التدريسي مع الأفاتار بخط كبير واضح */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border shadow-2xs ${
                                isFemale ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-blue-50 text-blue-900 border-blue-200'
                              }`}>
                                <UserCheck className="w-5 h-5" />
                              </div>
                              <span className="font-black text-slate-950 text-base sm:text-lg">{t.full_name}</span>
                            </div>
                          </td>

                          {/* 🚻 الرتبة والجنس */}
                          <td className="p-4 text-center">
                            <span className={`px-3.5 py-1.5 rounded-xl text-sm sm:text-base font-black border inline-block shadow-2xs whitespace-nowrap ${ 
                              isFemale ? 'bg-rose-100 text-rose-950 border-rose-300' : 'bg-blue-100 text-blue-950 border-blue-300' 
                            }`}>
                              {isFemale ? 'أستاذة' : 'أستاذ'}
                            </span>
                          </td>

                          {/* 🏛️ الصفة الأكاديمية (عضو الهيئة التدريسية بسطر واحد دائم بدون أي التفاف) */}
                          <td className="p-4 text-center">
                            <span className="bg-slate-100/90 text-slate-950 px-4 py-1.5 rounded-xl border border-slate-300 text-sm sm:text-base font-black shadow-2xs inline-flex items-center gap-1.5 whitespace-nowrap">
                              <Building2 className="w-4.5 h-4.5 text-[#0F2942] shrink-0" />
                              <span className="whitespace-nowrap">عضو الهيئة التدريسية</span>
                            </span>
                          </td>

                          {/* 📚 المواد المكلف بتدريسها (كادر القسم العام بسطر واحد دائم) */}
                          <td className="p-4 text-center">
                            {assignedCourses.length > 0 ? (
                              <div className="flex flex-wrap items-center justify-center gap-2">
                                <span className="text-emerald-950 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-300 text-sm sm:text-base font-black shadow-2xs whitespace-nowrap">
                                  {assignedCourses.length} مواد
                                </span>
                                <span className="text-sm sm:text-base text-slate-950 font-black">
                                  ({assignedCourses.map((c) => c.name).join('، ')})
                                </span>
                              </div>
                            ) : (
                              <span className="px-4 py-1.5 bg-slate-100/90 text-slate-950 border border-slate-300 rounded-xl text-sm sm:text-base font-black shadow-2xs inline-flex items-center gap-1.5 whitespace-nowrap">
                                <BookOpen className="w-4.5 h-4.5 text-[#0F2942] shrink-0" />
                                <span className="whitespace-nowrap">كادر القسم العام</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {teachers.length === 0 && (
                      <tr>
                        {/* 📭 تنبيه عدم وجود أساتذة */}
                        <td colSpan={5} className="p-10 text-center text-slate-950 text-base font-black bg-slate-50">
                          لا يوجد أساتذة مكلفون بهذا القسم بعد.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 📄 شريط نظام الصفحات (Pagination) الفاخر لجدول الكادر التدريسي مطابق لجدول الطلاب 100% */}
              {totalTeachersCount > 0 && (
                <div className="p-4 bg-slate-50 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-black">
                  
                  {/* ملخص العرض */}
                  <div className="text-slate-950 font-black">
                    عرض من <span className="text-slate-950 font-black font-mono">{teacherStartIndex + 1}</span> إلى{' '}
                    <span className="text-slate-950 font-black font-mono">
                      {Math.min(teacherStartIndex + teachersPageSize, totalTeachersCount)}
                    </span>{' '}
                    من إجمالي <span className="text-slate-950 font-black font-mono">{totalTeachersCount}</span> أستاذ/ـة
                  </div>

                  {/* أزرار التنقل بين الصفحات والقائمة المنسدلة الاحترافية */}
                  <div className="flex items-center gap-2">
                    
                    {/* 🔽 القائمة المنسدلة الاحترافية لاختيار حجم الصفحة - تظهر للأعلى داخل الشاشة */}
                    <div className="relative" ref={teachersPageSizeDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsTeachersPageSizeOpen((prev) => !prev)}
                        className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer shadow-2xs active:scale-95"
                        title="عدد الأساتذة في الصفحة"
                        aria-expanded={isTeachersPageSizeOpen}
                      >
                        <span>{teachersPageSize} أساتذة</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-950 transition-transform duration-200 ${isTeachersPageSizeOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* 📋 القائمة المنبثقة للأعلى داخل إطار الجدول والشاشة */}
                      {isTeachersPageSizeOpen && (
                        <div 
                          className="absolute bottom-full mb-2 right-0 z-50 min-w-[130px] bg-white border border-slate-300 rounded-2xl shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                          role="menu"
                        >
                          <div className="px-2.5 py-1 text-[11px] font-black text-slate-600 border-b border-slate-200 pb-1.5 mb-1">
                            عرض في الصفحة:
                          </div>
                          {[
                            { value: 5, label: '5 أساتذة' },
                            { value: 10, label: '10 أساتذة' },
                            { value: 20, label: '20 أستاذ' },
                          ].map((option) => {
                            const isSelected = teachersPageSize === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  setTeachersPageSize(option.value);
                                  setTeachersCurrentPage(1);
                                  setIsTeachersPageSizeOpen(false);
                                }}
                                className={`w-full text-right px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#0F2942] text-white shadow-2xs'
                                    : 'text-slate-950 hover:bg-slate-100'
                                }`}
                                role="menuitem"
                              >
                                <span>{option.label}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* الصفحة الأولى */}
                      <button
                        type="button"
                        onClick={() => setTeachersCurrentPage(1)}
                        disabled={safeTeacherCurrentPage <= 1}
                        className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        title="الصفحة الأولى"
                      >
                        <ChevronsRight className="w-4 h-4 text-slate-950" />
                      </button>

                      {/* الصفحة السابقة */}
                      <button
                        type="button"
                        onClick={() => setTeachersCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safeTeacherCurrentPage <= 1}
                        className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        title="الصفحة السابقة"
                      >
                        <ChevronRight className="w-4 h-4 text-slate-950" />
                      </button>

                      {/* ترقيم الصفحات */}
                      <div className="px-3 py-1.5 bg-[#0F2942] text-white rounded-xl text-xs font-mono font-black shadow-2xs">
                        {safeTeacherCurrentPage} / {totalTeacherPages}
                      </div>

                      {/* الصفحة التالية */}
                      <button
                        type="button"
                        onClick={() => setTeachersCurrentPage((p) => Math.min(totalTeacherPages, p + 1))}
                        disabled={safeTeacherCurrentPage >= totalTeacherPages}
                        className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        title="الصفحة التالية"
                      >
                        <ChevronLeft className="w-4 h-4 text-slate-950" />
                      </button>

                      {/* الصفحة الأخيرة */}
                      <button
                        type="button"
                        onClick={() => setTeachersCurrentPage(totalTeacherPages)}
                        disabled={safeTeacherCurrentPage >= totalTeacherPages}
                        className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        title="الصفحة الأخيرة"
                      >
                        <ChevronsLeft className="w-4 h-4 text-slate-950" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 🎓 قائمة طلاب المرحلة بالتحديد (مع نظام الترقيم والصفحات والبحث النقي وبدون عمود الحالة الأكاديمية) */}
          <div className="pt-6 border-t border-slate-300 space-y-4">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2.5">
                  <GraduationCap className="w-6 h-6 text-[#0F2942]" />
                  <span>طلاب المرحلة {getStageNameInArabic(activeStageNum)} بـ ({department?.name}):</span>
                  <span className="text-xs sm:text-sm font-black text-slate-950">({stageStudents.length} طالب/ـة)</span>
                </h3>
                <p className="text-xs sm:text-sm font-black text-slate-950 mt-1">
                  جدول الطلاب الرسمي المعتمد في منظومة بولونيا الأكاديمية
                </p>
              </div>

              {/* 🔍 شريط البحث والفلاتر السريعة للطلاب مع قوائم منسدلة احترافية */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative min-w-[220px] sm:min-w-[260px]">
                  {/* 🔍 حقل البحث عن أسماء الطلاب مع تلميح رصاصي هادئ */}
                  <input
                    type="text" // 🔤 نوع الحقل نصي
                    value={studentSearchTerm} // 💾 حفظ قيمة البحث بالـ state
                    onChange={(e) => setStudentSearchTerm(e.target.value)} // 🔄 فلترة فورية مع الكتابة
                    placeholder="ابحث عن اسم الطالب..." // 💡 نص التلميح
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl pr-10 pl-4 py-2 text-sm font-black text-slate-950 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:border-[#0F2942] focus:bg-white transition" // 🎨 تلميح رصاصي جميل
                  />
                  <Search className="w-4 h-4 text-slate-950 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* 🚻 فلتر الجنس بقائمة منسدلة احترافية تظهر داخل الشاشة */}
                <div className="relative" ref={genderDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsGenderDropdownOpen((prev) => !prev)}
                    className="bg-white border border-slate-300 rounded-2xl px-3.5 py-2 text-xs font-black text-slate-950 hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer shadow-2xs active:scale-95"
                    title="تصفية حسب الجنس"
                    aria-expanded={isGenderDropdownOpen}
                  >
                    <span>
                      {studentGenderFilter === 'all' && 'الجنس: الكل'}
                      {studentGenderFilter === 'male' && 'ذكور فقط'}
                      {studentGenderFilter === 'female' && 'إناث فقط'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-950 transition-transform duration-200 ${isGenderDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* 📋 القائمة المنبثقة للأسفل داخل الشاشة */}
                  {isGenderDropdownOpen && (
                    <div 
                      className="absolute top-full mt-2 right-0 z-50 min-w-[150px] bg-white border border-slate-300 rounded-2xl shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                      role="menu"
                    >
                      <button
                        type="button"
                        onClick={() => { setStudentGenderFilter('all'); setIsGenderDropdownOpen(false); }}
                        className={`w-full text-right px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-between cursor-pointer ${
                          studentGenderFilter === 'all' ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-950 hover:bg-slate-100'
                        }`}
                        role="menuitem"
                      >
                        <span>الكل (ذكور وإناث)</span>
                        {studentGenderFilter === 'all' && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStudentGenderFilter('male'); setIsGenderDropdownOpen(false); }}
                        className={`w-full text-right px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-between cursor-pointer ${
                          studentGenderFilter === 'male' ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-950 hover:bg-slate-100'
                        }`}
                        role="menuitem"
                      >
                        <span>ذكور فقط</span>
                        {studentGenderFilter === 'male' && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStudentGenderFilter('female'); setIsGenderDropdownOpen(false); }}
                        className={`w-full text-right px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-between cursor-pointer ${
                          studentGenderFilter === 'female' ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-950 hover:bg-slate-100'
                        }`}
                        role="menuitem"
                      >
                        <span>إناث فقط</span>
                        {studentGenderFilter === 'female' && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* ☀️🌙 فلتر نوع الدراسة (صباحي / مسائي) بنصوص سوداء داكنة */}
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-300 text-xs font-black">
                  <button
                    type="button"
                    onClick={() => setStudentStudyFilter('all')}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-black ${
                      studentStudyFilter === 'all' ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-950 hover:text-black'
                    }`}
                  >
                    الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentStudyFilter('morning')}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 font-black ${
                      studentStudyFilter === 'morning' ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-950 hover:text-black'
                    }`}
                  >
                    <Sun className="w-3 h-3 text-sky-700" />
                    <span>صباحي</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentStudyFilter('evening')}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 font-black ${
                      studentStudyFilter === 'evening' ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-950 hover:text-black'
                    }`}
                  >
                    <Moon className="w-3 h-3 text-indigo-700" />
                    <span>مسائي</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 📋 جدول الطلاب النظيف الاحترافي الخالي من البريد ورمز الدخول والحالة الأكاديمية */}
            <div className="overflow-hidden rounded-3xl border border-slate-300 shadow-xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm sm:text-base font-black">
                  <thead className="bg-slate-100 text-slate-950 font-black border-b border-slate-300">
                    <tr>
                      {/* 🔢 التسلسل */}
                      <th className="p-4 w-16 text-center text-slate-950 font-black">#</th>
                      {/* 👤 الاسم الكامل للطالب */}
                      <th className="p-4 min-w-[220px] text-slate-950 font-black">اسم الطالب الكامل</th>
                      {/* 🚻 جنس الطالب */}
                      <th className="p-4 w-32 text-center text-slate-950 font-black">الجنس</th>
                      {/* ☀️🌙 الفترة الدراسية */}
                      <th className="p-4 w-40 text-center text-slate-950 font-black">الفترة الدراسية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {paginatedStudents.map((std, idx) => {
                      const stdGender = std.gender || detectArabicGender(std.full_name); // 🚻 تحديد الجنس
                      const stdStudyType = std.study_type || 'morning'; // ☀️🌙 تحديد نوع الدراسة
                      const globalIndex = startIndex + idx + 1; // 🔢 التسلسل العام

                      return (
                        <tr 
                          key={std.id} 
                          className="hover:bg-slate-50 transition-colors font-black text-slate-950"
                        >
                          {/* 🔢 التسلسل بالأسود الداكن */}
                          <td className="p-4 text-center font-mono text-slate-950 font-black">
                            {globalIndex}
                          </td>

                          {/* 👤 اسم الطالب الثلاثي */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                                stdGender === 'female' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-blue-50 text-blue-900 border-blue-200'
                              }`}>
                                {std.full_name.trim().charAt(0) || 'ط'}
                              </div>
                              <span className="font-black text-slate-950">{std.full_name}</span>
                            </div>
                          </td>

                          {/* 🚻 الجنس */}
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-black border inline-block ${ 
                              stdGender === 'female' ? 'bg-rose-50 text-rose-950 border-rose-200' : 'bg-blue-50 text-blue-900 border-blue-200' 
                            }`}>
                              {stdGender === 'female' ? 'أنثى' : 'ذكر'}
                            </span>
                          </td>

                          {/* ☀️🌙 الفترة الدراسية */}
                          <td className="p-4 text-center whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-black border inline-flex items-center gap-1.5 ${
                              stdStudyType === 'evening'
                                ? 'bg-indigo-50 text-indigo-950 border-indigo-200'
                                : 'bg-sky-50 text-sky-950 border-sky-300'
                            }`}>
                              {stdStudyType === 'evening' ? (
                                <Moon className="w-3.5 h-3.5 text-indigo-700" />
                              ) : (
                                <Sun className="w-3.5 h-3.5 text-sky-700" />
                              )}
                              <span>{stdStudyType === 'evening' ? 'مسائي' : 'صباحي'}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {paginatedStudents.length === 0 && (
                      <tr>
                        {/* 📭 تنبيه عدم وجود نتائج بنص أسود عريض وواضح */}
                        <td colSpan={4} className="p-10 text-center text-slate-950 text-base font-black bg-slate-50">
                          {studentSearchTerm.trim() ? (
                            <div className="space-y-1">
                              <p className="text-slate-950 font-black">لم يتم العثور على طالب يطابق البحث: &quot;{studentSearchTerm}&quot;</p>
                              <button 
                                type="button" 
                                onClick={() => setStudentSearchTerm('')} 
                                className="text-blue-900 hover:underline text-xs font-black cursor-pointer"
                              >
                                مسح البحث وعرض كل طلاب المرحلة
                              </button>
                            </div>
                          ) : (
                            <p className="text-slate-950 font-black">لا يوجد طلاب مسجلون في المرحلة {getStageNameInArabic(activeStageNum)} لهذا القسم بعد.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 📄 شريط نظام الصفحات (Pagination) الفاخر مع القائمة المنسدلة المخصصة الاحترافية */}
              {totalStudentsCount > 0 && (
                <div className="p-4 bg-slate-50 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-black">
                  
                  {/* ملخص العرض */}
                  <div className="text-slate-950 font-black">
                    عرض من <span className="text-slate-950 font-black font-mono">{startIndex + 1}</span> إلى{' '}
                    <span className="text-slate-950 font-black font-mono">
                      {Math.min(startIndex + pageSize, totalStudentsCount)}
                    </span>{' '}
                    من إجمالي <span className="text-slate-950 font-black font-mono">{totalStudentsCount}</span> طالب
                  </div>

                  {/* أزرار التنقل بين الصفحات والقائمة المنسدلة الاحترافية */}
                  <div className="flex items-center gap-2">
                    
                    {/* 🔽 القائمة المنسدلة الاحترافية لاختيار حجم الصفحة - تظهر للأعلى داخل الشاشة */}
                    <div className="relative" ref={pageSizeDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsPageSizeOpen((prev) => !prev)}
                        className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer shadow-2xs active:scale-95"
                        title="عدد الطلاب في الصفحة"
                        aria-expanded={isPageSizeOpen}
                      >
                        <span>{pageSize} طلاب</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-950 transition-transform duration-200 ${isPageSizeOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* 📋 القائمة المنبثقة للأعلى داخل إطار الجدول والشاشة */}
                      {isPageSizeOpen && (
                        <div 
                          className="absolute bottom-full mb-2 right-0 z-50 min-w-[130px] bg-white border border-slate-300 rounded-2xl shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                          role="menu"
                        >
                          <div className="px-2.5 py-1 text-[11px] font-black text-slate-600 border-b border-slate-200 pb-1.5 mb-1">
                            عرض في الصفحة:
                          </div>
                          {[
                            { value: 5, label: '5 طلاب' },
                            { value: 10, label: '10 طلاب' },
                            { value: 20, label: '20 طالب' },
                            { value: 50, label: '50 طالب' },
                          ].map((option) => {
                            const isSelected = pageSize === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  setPageSize(option.value);
                                  setCurrentPage(1);
                                  setIsPageSizeOpen(false);
                                }}
                                className={`w-full text-right px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#0F2942] text-white shadow-2xs'
                                    : 'text-slate-950 hover:bg-slate-100'
                                }`}
                                role="menuitem"
                              >
                                <span>{option.label}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* الصفحة الأولى */}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(1)}
                        disabled={safeCurrentPage <= 1}
                        className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        title="الصفحة الأولى"
                      >
                        <ChevronsRight className="w-4 h-4 text-slate-950" />
                      </button>

                      {/* الصفحة السابقة */}
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safeCurrentPage <= 1}
                        className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        title="الصفحة السابقة"
                      >
                        <ChevronRight className="w-4 h-4 text-slate-950" />
                      </button>

                      {/* ترقيم الصفحات */}
                      <div className="px-3 py-1.5 bg-[#0F2942] text-white rounded-xl text-xs font-mono font-black shadow-2xs">
                        {safeCurrentPage} / {totalPages}
                      </div>

                      {/* الصفحة التالية */}
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safeCurrentPage >= totalPages}
                        className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        title="الصفحة التالية"
                      >
                        <ChevronLeft className="w-4 h-4 text-slate-950" />
                      </button>

                      {/* الصفحة الأخيرة */}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={safeCurrentPage >= totalPages}
                        className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        title="الصفحة الأخيرة"
                      >
                        <ChevronsLeft className="w-4 h-4 text-slate-950" />
                      </button>
                    </div>

                  </div>

                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* ⚙️ مودال تعديل وحدات مسار بولونيا (ECTS) للمادة لرئيس القسم والمقرر */}
      {editingCourseForEcts && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white border border-slate-300 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* ترويسة المودال */}
            <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-[#0F2942] text-white rounded-2xl shadow-2xs">
                  <Award className="w-5 h-5 text-sky-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-950">
                    تعديل وحدات المادة (مسار بولونيا ECTS)
                  </h3>
                  <p className="text-xs font-black text-slate-600 mt-0.5">
                    تحكم رئيس القسم والمقرر بالخطة الدراسية
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingCourseForEcts(null)}
                disabled={isSavingEcts}
                className="p-2 text-slate-500 hover:text-slate-950 hover:bg-slate-200 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* تفاصيل المادة ونظام النقاط */}
            <div className="p-6 space-y-5">
              
              {/* بطاقة معلومات المادة */}
              <div className="p-4 bg-slate-100 rounded-2xl border border-slate-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black bg-[#0F2942] text-white px-2.5 py-0.5 rounded-lg">
                    {editingCourseForEcts.code}
                  </span>
                  <span className="text-xs font-black text-slate-700">
                    المرحلة {getStageNameInArabic(editingCourseForEcts.stage_number || 1)} • {department?.name}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-black text-slate-950 pt-1">
                  {editingCourseForEcts.name}
                </h4>
              </div>

              {/* أزرار اختيار نقاط ECTS المعتمدة (2 إلى 8) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-black text-slate-950">
                    اختر عدد الوحدات والساعات المعتمدة (ECTS):
                  </label>
                  <span className="text-xs font-black text-sky-950 bg-sky-100 px-3 py-1 rounded-xl border border-sky-300">
                    المحدد: {selectedEctsPoints} ECTS
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {[2, 3, 4, 5, 6, 7, 8].map((pts) => {
                    const isSelected = selectedEctsPoints === pts;
                    return (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => setSelectedEctsPoints(pts)}
                        className={`py-3 px-2 rounded-2xl font-black text-base border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 active:scale-95 shadow-2xs ${
                          isSelected
                            ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-blue-400/40'
                            : 'bg-white text-slate-950 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <Award className={`w-4 h-4 ${isSelected ? 'text-sky-300' : 'text-sky-700'}`} />
                        <span>{pts}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs font-bold text-slate-600 pt-1">
                  💡 المعيار الأكاديمي لمسار بولونيا: 5 إلى 6 وحدات ECTS للمقرر الأساسي، وبمجموع 30 وحدة للفصل و 60 للسنة الدراسية.
                </p>
              </div>

              {/* رسالة النجاح */}
              {ectsSuccessMsg && (
                <div className="p-3 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-2xl text-xs font-black flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>{ectsSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* أزرار الإجراءات */}
            <div className="p-5 bg-slate-50 border-t border-slate-300 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingCourseForEcts(null)}
                disabled={isSavingEcts}
                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 font-black text-xs sm:text-sm transition cursor-pointer disabled:opacity-50"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleSaveCourseEcts}
                disabled={isSavingEcts}
                className="px-6 py-2.5 rounded-xl bg-[#0F2942] hover:bg-[#153a5c] text-white font-black text-xs sm:text-sm transition cursor-pointer shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingEcts ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>جاري الحفظ والمزامنة...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-sky-300" />
                    <span>حفظ واعتماد الوحدات</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </ZeroTrustGuard>
  );
}
