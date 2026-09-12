'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 📘 صفحة إدارة المواد والمقررات الدراسية - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect, useMemo, useRef } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة ودورة الحياة
import { useRouter } from 'next/navigation'; // 🛣️ موجه المسارات
import { 
  getCurrentSessionUser, 
  saveCourseToSupabase, 
  deleteCourseFromSupabase, 
  syncCoursesFromSupabase,
  syncDepartmentsFromSupabase,
  syncProfilesFromSupabase,
  syncStagesFromSupabase,
  syncTeacherCoursesFromSupabase, // ☁️ مزامنة تكليفات الأساتذة مع السحابة
  saveTeacherCourseToSupabase, // ☁️ حفظ تكليفات الأساتذة سحابياً
  deleteTeacherCourseFromSupabase // ☁️ حذف تكليفات الأساتذة سحابياً عند حذف المادة
} from '@/lib/supabase-client'; // 🔌 فحص الجلسة ودوال المزامنة السحابية الحية
import { getStoredData, saveStoredData, INITIAL_COURSES, INITIAL_DEPARTMENTS, INITIAL_STAGES, INITIAL_PROFILES, INITIAL_TEACHER_COURSES } from '@/lib/mock-data'; // 💾 التخزين
import { Course, Department, Stage, UserProfile, CourseType, AssessmentScheme, TeacherCourse } from '@/types'; // 🔗 الأنواع الرسمية
import { getDefaultAssessmentScheme, getCourseAssessmentScheme, getStageNameInArabic, isAssessmentItemActive } from '@/lib/grade-utils'; // 🧮 دوال حسابات الدرجات وفحص البنود المفتوحة
import { reconcileCoursesWithTeacherCourses } from '@/app/admin/department-portal/page'; // 🔄 دالة التوفيق والتزامن المركزي
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  FlaskConical, 
  Sliders, 
  Check, 
  AlertCircle, 
  AlertTriangle,
  Users,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  SlidersHorizontal,
  Search,
  Clock,
  Filter,
  Edit3,
  Building2,
  Layers,
  GraduationCap,
  Download,
  Upload,
  Info,
  FileSpreadsheet,
  X,
  ChevronDown,
  Calendar,
  Award,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft
} from 'lucide-react'; // 🎨 الأيقونات الفيكتور SVG
import ZeroTrustGuard from '@/components/security/ZeroTrustGuard'; // 🛡️ حارس أمان Zero Trust
import { AdminCourseModal } from '@/components/admin/courses/AdminCourseModal'; // 📝 مودال إضافة وتعديل المادة الدراسية
import { AdminCourseAssessmentModal } from '@/components/admin/courses/AdminCourseAssessmentModal'; // 🎛️ مودال توزيع درجات مسار بولونيا
import { AdminCourseExcelModals } from '@/components/admin/courses/AdminCourseExcelModals'; // 📊 مودالات إكسل المواد
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 كارت CRUD العائم
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'; // 🗑️ كارد الحذف الاحترافي الفاخر
import { exportCustomCoursesList, downloadGeneralCoursesTemplate, parseExcelFile } from '@/lib/excel-utils'; // 📊 ميزات وتوليد واستيراد نماذج Excel

// 📊 نوع بيانات تقرير نتائج استيراد الإكسل
interface CourseImportSummaryReport {
  totalRows: number;
  accepted: { name: string; dept: string; code: string }[];
  duplicates: { name: string; code: string; dept: string; reason: string }[];
  rejected: { rowNumber: number; rawName: string; reason: string }[];
}

export default function AdminCoursesPage() {
  const router = useRouter();
  // 📌 الحالات
  const [courses, setCourses] = useState<Course[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<TeacherCourse[]>([]); // 📋 سجل تكليفات الأساتذة
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null); // 🗑️ حالة المادة المراد حذفها
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]); // 🔘 معرفات المواد المحددة
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false); // 🗑️ كارد الحذف الجماعي
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);

  // 📌 نمط الترتيب والتصفية والبحث
  const [sortMode, setSortMode] = useState<'custom' | 'newest' | 'oldest' | 'name_asc' | 'code_asc' | 'stage_asc'>('custom');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [isFilterDeptDropdownOpen, setIsFilterDeptDropdownOpen] = useState<boolean>(false); // 🔽 حالة قائمة تصفية القسم
  const filterDeptDropdownRef = useRef<HTMLDivElement>(null); // 🎯 مرجع قائمة تصفية القسم

  // 📄 حالات نظام الصفحات (Pagination) المتقدم لجدول المواد الدراسية
  const [currentPage, setCurrentPage] = useState<number>(1); // 📄 رقم الصفحة الحالية
  const [pageSize, setPageSize] = useState<number>(10); // 📏 عدد المواد في الصفحة الواحدة
  const [isPageSizeOpen, setIsPageSizeOpen] = useState<boolean>(false); // 🔽 حالة فتح قائمة حجم الصفحة
  const pageSizeDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع قائمة حجم الصفحة

  // 📄 تصفير الصفحة للبداية عند تغيير معايير البحث أو التصفية
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterDept, sortMode]);

  // 🖱️ إغلاق القوائم المنسدلة عند النقر خارجها أو الضغط على Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (filterDeptDropdownRef.current && !filterDeptDropdownRef.current.contains(target)) {
        setIsFilterDeptDropdownOpen(false);
      }
      if (pageSizeDropdownRef.current && !pageSizeDropdownRef.current.contains(target)) {
        setIsPageSizeOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFilterDeptDropdownOpen(false);
        setIsPageSizeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 📌 حالات كارت CRUD العائم للمواد
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // 📌 حقول المادة - جعل القيم الافتراضية غير محددة
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedStageNum, setSelectedStageNum] = useState<number | null>(null); // 🎓 المرحلة الدراسية - غير محدد
  const [selectedSemester, setSelectedSemester] = useState<1 | 2 | null>(null); // 🗓️ الكورس الدراسي - غير محدد
  const [courseType, setCourseType] = useState<CourseType | null>(null); // 🔬 نوع المادة - غير محدد
  const [theoryTeacherId, setTheoryTeacherId] = useState('');
  const [practicalTeacherId, setPracticalTeacherId] = useState('');
  const [creditHours, setCreditHours] = useState<number | null>(null); // ⏱️ الساعات المعتمدة - غير محدد
  const [isTheoryTeacherDropdownOpen, setIsTheoryTeacherDropdownOpen] = useState(false); // 🔽 حالة قائمة أستاذ النظري
  const [isPracticalTeacherDropdownOpen, setIsPracticalTeacherDropdownOpen] = useState(false); // 🔽 حالة قائمة أستاذ العملي
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false); // 🔽 حالة قائمة الأقسام
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showExcelInstructions, setShowExcelInstructions] = useState(false); // ℹ️ نافذة تعليمات استيراد المواد
  const [isImportingExcel, setIsImportingExcel] = useState(false); // ⏳ حالة جاري استيراد إكسل للمواد
  const [importReport, setImportReport] = useState<CourseImportSummaryReport | null>(null); // 📊 تقرير استيراد المواد
  const [activeReportTab, setActiveReportTab] = useState<'accepted' | 'duplicates' | 'rejected'>('accepted'); // 📑 التبويب النشط في التقرير

  // 🎛️ نافذة تخصيص التوزيع
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [selectedCourseForAssessment, setSelectedCourseForAssessment] = useState<Course | null>(null);
  const [tempAssessmentScheme, setTempAssessmentScheme] = useState<AssessmentScheme>(getDefaultAssessmentScheme('theory_and_practical'));

  // 👨‍🏫 دالة استخراج أساتذة النظري المكلفين بالمادة
  const getCourseTheoryTeachers = (course: Course): { id: string; name: string }[] => {
    const list: { id: string; name: string }[] = [];
    const directAssignments = teacherCourses.filter(
      (tc: TeacherCourse): boolean =>
        Boolean(
          (tc.course_id && String(tc.course_id).trim() === String(course.id).trim()) ||
          (tc.course_name && course.name && tc.course_name.trim() === course.name.trim())
        )
    );

    directAssignments.forEach((tc: TeacherCourse) => {
      if (tc.role_in_course === 'theory' || tc.role_in_course === 'both' || !tc.role_in_course) {
        const prof = profiles.find((p: UserProfile): boolean => p.id === tc.teacher_id);
        const name = tc.teacher_name || prof?.full_name || 'أستاذ المادة';
        if (!list.some((item) => item.id === tc.teacher_id || item.name === name)) {
          list.push({ id: tc.teacher_id, name });
        }
      }
    });

    if (list.length === 0 && course.theory_teacher_name && course.theory_teacher_name.trim() !== '') {
      list.push({ id: course.theory_teacher_id || `temp-th-${course.id}`, name: course.theory_teacher_name.trim() });
    }
    return list;
  };

  // 🧪 دالة استخراج أساتذة العملي المكلفين بالمادة
  const getCoursePracticalTeachers = (course: Course): { id: string; name: string }[] => {
    const list: { id: string; name: string }[] = [];
    const directAssignments = teacherCourses.filter(
      (tc: TeacherCourse): boolean =>
        Boolean(
          (tc.course_id && String(tc.course_id).trim() === String(course.id).trim()) ||
          (tc.course_name && course.name && tc.course_name.trim() === course.name.trim())
        )
    );

    directAssignments.forEach((tc: TeacherCourse) => {
      if (tc.role_in_course === 'practical' || tc.role_in_course === 'both') {
        const prof = profiles.find((p: UserProfile): boolean => p.id === tc.teacher_id);
        const name = tc.teacher_name || prof?.full_name || 'أستاذ العملي';
        if (!list.some((item) => item.id === tc.teacher_id || item.name === name)) {
          list.push({ id: tc.teacher_id, name });
        }
      }
    });

    if (list.length === 0 && course.practical_teacher_name && course.practical_teacher_name.trim() !== '') {
      list.push({ id: course.practical_teacher_id || `temp-pr-${course.id}`, name: course.practical_teacher_name.trim() });
    }
    return list;
  };

  // 🔄 فحص الجلسة وتحميل البيانات والتوفيق المركزي
  useEffect(() => {
    const user = getCurrentSessionUser();
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
      router.push('/sadmin');
      return;
    }
    const loadedDepts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS);
    const loadedCourses = getStoredData<Course[]>('courses', INITIAL_COURSES);
    const loadedTCs = getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES);
    const loadedProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);

    // 🔄 توفيق فوري لكافة المواد مع سجلات التكليفات لضمان خلوها من أي "غير معيّن" خاطئ
    const rec = reconcileCoursesWithTeacherCourses(loadedCourses, loadedTCs, loadedProfiles);
    setCourses(rec.reconciledCourses);
    setTeacherCourses(loadedTCs);
    setDepartments(loadedDepts);
    setStages(getStoredData<Stage[]>('stages', INITIAL_STAGES));
    setProfiles(loadedProfiles);
    if (loadedDepts.length > 0) setSelectedDeptId(loadedDepts[0].id);

    // ☁️ المزامنة اللحظية الحية من سحابة Supabase
    const syncAll = async () => {
      try {
        const [liveCourses, liveDepts, liveStages, liveProfiles, liveTCs] = await Promise.all([
          syncCoursesFromSupabase(),
          syncDepartmentsFromSupabase(),
          syncStagesFromSupabase(),
          syncProfilesFromSupabase(),
          syncTeacherCoursesFromSupabase(),
        ]);

        const c = liveCourses && liveCourses.length > 0 ? liveCourses : loadedCourses;
        const tc = liveTCs && liveTCs.length > 0 ? liveTCs : loadedTCs;
        const p = liveProfiles && liveProfiles.length > 0 ? liveProfiles : loadedProfiles;

        const reconciled = reconcileCoursesWithTeacherCourses(c, tc, p);
        setCourses(reconciled.reconciledCourses);
        if (liveTCs) setTeacherCourses(liveTCs);
        if (liveDepts && liveDepts.length > 0) setDepartments(liveDepts);
        if (liveStages && liveStages.length > 0) setStages(liveStages);
        if (liveProfiles && liveProfiles.length > 0) setProfiles(liveProfiles);
      } catch (err) {
        console.warn('تنبيه: تعذر إكمال المزامنة السحابية الشاملة للمواد:', err);
      }
    };
    syncAll();

    // 📡 الاستماع للتحديثات اللحظية المباشرة بين النوافذ والتبويبات
    const handleSyncEvent = () => {
      const currentC = getStoredData<Course[]>('courses', INITIAL_COURSES);
      const currentTC = getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES);
      const currentP = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
      const r = reconcileCoursesWithTeacherCourses(currentC, currentTC, currentP);
      setCourses(r.reconciledCourses);
      setTeacherCourses(currentTC);
      setProfiles(currentP);
    };

    window.addEventListener('courses_updated', handleSyncEvent);
    window.addEventListener('teacher_courses_updated', handleSyncEvent);
    window.addEventListener('storage', handleSyncEvent);

    return () => {
      window.removeEventListener('courses_updated', handleSyncEvent);
      window.removeEventListener('teacher_courses_updated', handleSyncEvent);
      window.removeEventListener('storage', handleSyncEvent);
    };
  }, [router]);

  // تصفية أساتذة القسم المختار
  const deptTeachers = profiles.filter((p) => p.role === 'teacher' && p.department_id === selectedDeptId);

  // 💾 إضافة أو تعديل مادة دراسية
  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim() || !selectedDeptId) return;

    if (!courseType) {
      setErrorMsg('يرجى تحديد نوع وتوصيف المادة الدراسية (نظري فقط أو نظري وعملي)');
      setTimeout(() => setErrorMsg(''), 3500);
      return;
    }

    if (!selectedStageNum) {
      setErrorMsg('يرجى اختيار المرحلة الدراسية للمادة');
      setTimeout(() => setErrorMsg(''), 3500);
      return;
    }

    if (!selectedSemester) {
      setErrorMsg('يرجى اختيار الكورس الدراسي للمادة');
      setTimeout(() => setErrorMsg(''), 3500);
      return;
    }

    if (!creditHours || creditHours <= 0) {
      setErrorMsg('يرجى تحديد الساعات والوحدات المعتمدة (ECTS) للمادة');
      setTimeout(() => setErrorMsg(''), 3500);
      return;
    }

    const dept = departments.find((d: Department) => d.id === selectedDeptId);
    const targetStage = stages.find((s: Stage) => s.department_id === selectedDeptId && s.stage_number === Number(selectedStageNum));
    const theoryTeacher = deptTeachers.find((t) => t.id === theoryTeacherId);
    const practicalTeacher = courseType === 'theory_and_practical' ? deptTeachers.find((t) => t.id === practicalTeacherId) : null;

    if (editingCourse) {
      // ✏️ تعديل مادة قائمة
      let updatedCourseToSync: Course | null = null;
      const updated = courses.map((c) => {
        if (c.id === editingCourse.id) {
          const edited: Course = {
            ...c,
            department_id: selectedDeptId,
            department_name: dept?.name || c.department_name,
            stage_id: targetStage?.id || c.stage_id,
            stage_number: Number(selectedStageNum),
            semester: selectedSemester,
            name: courseName.trim(),
            code: courseCode.trim().toUpperCase() || c.code,
            credit_hours: Number(creditHours!),
            course_type: courseType!,
            has_practical: courseType === 'theory_and_practical',
            theory_teacher_id: theoryTeacher ? theoryTeacher.id : undefined,
            theory_teacher_name: theoryTeacher ? theoryTeacher.full_name : undefined,
            practical_teacher_id: practicalTeacher ? practicalTeacher.id : undefined,
            practical_teacher_name: practicalTeacher ? practicalTeacher.full_name : undefined,
          };
          updatedCourseToSync = edited;
          return edited;
        }
        return c;
      });

      setCourses(updated);
      saveStoredData('courses', updated);
      if (updatedCourseToSync) {
        saveCourseToSupabase(updatedCourseToSync); // ☁️ مزامنة التعديل سحابياً
      }

      // 🔄 مزامنة التكليفات ثنائياً عبر دالة التوفيق المركزي
      const rec = reconcileCoursesWithTeacherCourses(updated, teacherCourses, profiles);
      setTeacherCourses(rec.reconciledTCs);
      saveStoredData('teacher_courses', rec.reconciledTCs);
      const targetId = editingCourse.id;
      const courseTCs = rec.reconciledTCs.filter((tc: TeacherCourse): boolean => tc.course_id === targetId);
      courseTCs.forEach((tc: TeacherCourse) => {
        saveTeacherCourseToSupabase(tc); // ☁️ رفع التكليف سحابياً
      });
      window.dispatchEvent(new CustomEvent('teacher_courses_updated', { detail: rec.reconciledTCs }));
      window.dispatchEvent(new CustomEvent('courses_updated', { detail: updated }));

      setIsCourseModalOpen(false);
      setEditingCourse(null);
      setSuccessMsg(`تم تحديث بيانات مادة (${courseName.trim()}) بنجاح!`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } else {
      // ➕ إضافة مادة جديدة
      const newCourse: Course = {
        id: `course-${Date.now()}`,
        stage_id: targetStage?.id || `stage-${selectedDeptId}-${selectedStageNum}`,
        academic_year_id: 'year-2026',
        department_id: selectedDeptId,
        name: courseName.trim(),
        code: courseCode.trim().toUpperCase() || 'CS101',
        credit_hours: Number(creditHours!),
        semester: selectedSemester!,
        stage_number: Number(selectedStageNum!),
        department_name: dept?.name || 'القسم',
        course_type: courseType!,
        has_practical: courseType === 'theory_and_practical',
        theory_teacher_id: theoryTeacher ? theoryTeacher.id : undefined,
        theory_teacher_name: theoryTeacher ? theoryTeacher.full_name : undefined,
        practical_teacher_id: practicalTeacher ? practicalTeacher.id : undefined,
        practical_teacher_name: practicalTeacher ? practicalTeacher.full_name : undefined,
        assessment_scheme: getDefaultAssessmentScheme(courseType!),
        created_at: new Date().toISOString(),
        order_index: 0,
      };

      const updated = [newCourse, ...courses.map((c, idx) => ({ ...c, order_index: idx + 1 }))];
      setCourses(updated);
      saveStoredData('courses', updated);
      saveCourseToSupabase(newCourse); // ☁️ حفظ المادة سحابياً

      // 🔄 مزامنة التكليفات ثنائياً للمادة الجديدة عبر دالة التوفيق المركزي
      const rec = reconcileCoursesWithTeacherCourses(updated, teacherCourses, profiles);
      setTeacherCourses(rec.reconciledTCs);
      saveStoredData('teacher_courses', rec.reconciledTCs);
      const newCourseTCs = rec.reconciledTCs.filter((tc: TeacherCourse): boolean => tc.course_id === newCourse.id);
      newCourseTCs.forEach((tc: TeacherCourse) => {
        saveTeacherCourseToSupabase(tc); // ☁️ رفع التكليف الجديد سحابياً
      });
      window.dispatchEvent(new CustomEvent('teacher_courses_updated', { detail: rec.reconciledTCs }));
      window.dispatchEvent(new CustomEvent('courses_updated', { detail: updated }));

      setSortMode('custom');
      setIsCourseModalOpen(false);
      setSuccessMsg(`تمت إضافة مادة (${newCourse.name}) بنجاح ووضعها في بداية القائمة!`);
      setTimeout(() => setSuccessMsg(''), 3500);
    }

    setCourseName('');
    setCourseCode('');
    setCreditHours(null); // 🔄 تصفير الساعات
    setSelectedStageNum(null); // 🔄 تصفير المرحلة
    setSelectedSemester(null); // 🔄 تصفير الكورس
    setCourseType(null); // 🔄 تصفير نوع المادة
    setTheoryTeacherId('');
    setPracticalTeacherId('');
  };

  // 📥 تنزيل نموذج Excel معتمد للمقررات لكافة الأقسام
  const handleDownloadTemplate = async () => {
    await downloadGeneralCoursesTemplate(departments);
    setSuccessMsg('تم تنزيل نموذج إكسل المعتمد للمواد والمقررات بنجاح! 📊');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // 📤 معالجة واستيراد ملف Excel للمواد لكافة الأقسام
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImportingExcel(true);
      const rows = await parseExcelFile(file);

      const accepted: { name: string; dept: string; code: string }[] = [];
      const duplicates: { name: string; code: string; dept: string; reason: string }[] = [];
      const rejected: { rowNumber: number; rawName: string; reason: string }[] = [];

      const newCoursesToAdd: Course[] = [];
      let tempAllCourses = [...courses];

      rows.forEach((row, index) => {
        const rowNum = index + 2;
        const rawName = String(row['name'] || row['اسم المادة الدراسية بالعربية *'] || row['اسم المادة الدراسية'] || row['اسم المادة'] || row['المادة'] || '').trim();
        const rawDept = String(row['department'] || row['القسم العلمي التابع له *'] || row['القسم العلمي'] || row['القسم'] || '').trim();
        const rawCode = String(row['code'] || row['رمز المادة (الكود)'] || row['رمز المادة'] || row['الكود'] || '').trim().toUpperCase();
        const rawStage = Number(row['stage'] || row['المرحلة الدراسية (1-4) *'] || row['المرحلة الدراسية'] || row['المرحلة'] || 1);
        const rawSemester = Number(row['semester'] || row['الكورس (1 أو 2) *'] || row['الفصل (1 أو 2) *'] || row['الفصل الدراسي'] || row['الكورس الدراسي'] || row['الكورس'] || 1);
        const rawType = String(row['course_type'] || row['نوع المادة (نظري وعملي / نظري فقط) *'] || row['نوع المادة'] || '').trim();
        const rawCredits = Number(row['credits'] || row['الساعات المعتمدة ECTS *'] || row['الساعات المعتمدة'] || row['الوحدات'] || 3);

        if (!rawName || rawName.length < 2) {
          rejected.push({
            rowNumber: rowNum,
            rawName: rawName || 'اسم مادة فارغ',
            reason: 'حقل اسم المادة فارغ أو غير مكتمل',
          });
          return;
        }

        // مطابقة القسم العلمي
        let targetDept = departments.find(
          (d) => d.name.trim().toLowerCase() === rawDept.toLowerCase() || d.name.includes(rawDept)
        );
        if (!targetDept) {
          targetDept = departments[0];
        }

        const deptId = targetDept ? targetDept.id : (departments[0]?.id || 'dept-1');
        const deptName = targetDept ? targetDept.name : (departments[0]?.name || 'هندسة تقنيات الحاسوب');

        // فحص التكرار داخل نفس القسم بالاسم
        const isDuplicate = tempAllCourses.some(
          (c) => c.department_id === deptId && c.name.trim().toLowerCase() === rawName.toLowerCase()
        );
        if (isDuplicate) {
          duplicates.push({
            name: rawName,
            code: rawCode || '—',
            dept: deptName,
            reason: 'المادة مضافة مسبقاً في هذا القسم بنفس الاسم',
          });
          return;
        }

        const stageNumber = [1, 2, 3, 4].includes(rawStage) ? rawStage : 1;
        const semesterNumber = (rawSemester === 2 ? 2 : 1) as 1 | 2;
        const isTheoryOnly = rawType.includes('فقط') || rawType === 'theory_only' || (!rawType.includes('عملي') && rawType.includes('نظري') && !rawType.includes('و'));
        const courseTypeParsed: CourseType = isTheoryOnly ? 'theory_only' : 'theory_and_practical';
        const creditHoursParsed = Math.max(1, Math.min(15, rawCredits || 3));

        const existingDeptCount = tempAllCourses.filter((c) => c.department_id === deptId).length;
        const finalCode = rawCode || `CRS-${stageNumber}0${existingDeptCount + 1}`;

        const newCourseId = `crs-${Date.now()}-${index}`;
        const newCourse: Course = {
          id: newCourseId,
          department_id: deptId,
          department_name: deptName,
          stage_id: `stage-${deptId}-${stageNumber}`,
          stage_number: stageNumber,
          academic_year_id: 'year-2026',
          name: rawName,
          code: finalCode,
          credit_hours: creditHoursParsed,
          semester: semesterNumber,
          course_type: courseTypeParsed,
          has_practical: courseTypeParsed === 'theory_and_practical',
          assessment_scheme: getDefaultAssessmentScheme(courseTypeParsed),
          created_at: new Date().toISOString(),
          order_index: newCoursesToAdd.length,
        };

        newCoursesToAdd.push(newCourse);
        tempAllCourses.push(newCourse);

        accepted.push({
          name: rawName,
          dept: deptName,
          code: finalCode,
        });
      });

      if (newCoursesToAdd.length > 0) {
        const merged = [...newCoursesToAdd, ...courses.map((c, idx) => ({ ...c, order_index: idx + newCoursesToAdd.length }))];
        setCourses(merged);
        saveStoredData('courses', merged);
        newCoursesToAdd.forEach((c) => saveCourseToSupabase(c)); // ☁️ رفع المقررات المستوردة إلى Supabase فوراً
        setSortMode('custom');
      }

      setImportReport({
        totalRows: rows.length,
        accepted,
        duplicates,
        rejected,
      });
      setActiveReportTab(accepted.length > 0 ? 'accepted' : (duplicates.length > 0 ? 'duplicates' : 'rejected'));

      if (accepted.length > 0) {
        setSuccessMsg(`تمت معالجة الملف وإضافة (${accepted.length}) مادة دراسية بنجاح! 📊🎉`);
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch {
      setErrorMsg('حدث خطأ أثناء قراءة ملف Excel، يرجى التأكد من اختيار ملف Excel صالح (.xlsx)');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setIsImportingExcel(false);
      e.target.value = '';
    }
  };

  // 🔀 تغيير ترتيب المادة يدوياً (تقديم وتأخير ⬆️ ⬇️)
  const handleMoveCourse = (currentIndex: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedCourses.length) return;

    const currentList = [...sortedCourses];
    const itemToMove = currentList[currentIndex];
    currentList[currentIndex] = currentList[targetIndex];
    currentList[targetIndex] = itemToMove;

    const reindexed = currentList.map((c, idx) => ({ ...c, order_index: idx }));
    setCourses(reindexed);
    saveStoredData('courses', reindexed);
    setSortMode('custom');
    setSuccessMsg(`تم تغيير ترتيب مادة (${itemToMove.name}) بنجاح!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // 🗑️ فتح كارد تأكيد حذف المادة الدراسية
  const handleDeleteCourse = (id: string) => {
    const target = courses.find((c: Course) => c.id === id);
    if (target) {
      setDeletingCourse(target);
    }
  };

  // 🗑️ تنفيذ حذف المادة بعد التأكيد
  const confirmExecuteDeleteCourse = () => {
    if (!deletingCourse) return;
    const deletedId = deletingCourse.id;
    const updated = courses.filter((c: Course) => c.id !== deletedId);
    setCourses(updated);
    saveStoredData('courses', updated);
    deleteCourseFromSupabase(deletedId); // ☁️ حذف المادة سحابياً

    // 🔗 حذف تكليفات الأساتذة المقترنة بهذه المادة محلياً وسحابياً
    const tcsToDelete = teacherCourses.filter((tc: TeacherCourse): boolean => tc.course_id === deletedId);
    tcsToDelete.forEach((tc: TeacherCourse) => {
      deleteTeacherCourseFromSupabase(tc.id); // ☁️ حذف التكليف سحابياً لمنع ظهوره كأثر قديم
    });
    const updatedTCs = teacherCourses.filter((tc: TeacherCourse): boolean => tc.course_id !== deletedId);
    setTeacherCourses(updatedTCs);
    saveStoredData('teacher_courses', updatedTCs);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('courses_updated'));
      window.dispatchEvent(new Event('teacher_courses_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    setDeletingCourse(null);
    setSuccessMsg(`تم حذف مادة (${deletingCourse.name}) وتكليفاتها بنجاح.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // 🔘 دوال نظام التحديد والإجراءات الجماعية للمواد
  const toggleSelectAll = (list: Course[]) => {
    if (selectedCourseIds.length === list.length && list.length > 0) {
      setSelectedCourseIds([]);
    } else {
      setSelectedCourseIds(list.map((c) => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const confirmBulkDeleteCourses = () => {
    const count = selectedCourseIds.length;
    if (count === 0) return;

    selectedCourseIds.forEach((id) => {
      deleteCourseFromSupabase(id); // ☁️ حذف المواد سحابياً
    });

    // 🔗 حذف كافة تكليفات المواد المحددة محلياً وسحابياً
    const tcsToDelete = teacherCourses.filter((tc: TeacherCourse): boolean => selectedCourseIds.includes(tc.course_id));
    tcsToDelete.forEach((tc: TeacherCourse) => {
      deleteTeacherCourseFromSupabase(tc.id); // ☁️ حذف التكليفات سحابياً
    });
    const updatedTCs = teacherCourses.filter((tc: TeacherCourse): boolean => !selectedCourseIds.includes(tc.course_id));
    setTeacherCourses(updatedTCs);
    saveStoredData('teacher_courses', updatedTCs);

    const updatedCourses = courses.filter((c) => !selectedCourseIds.includes(c.id));
    setCourses(updatedCourses);
    saveStoredData('courses', updatedCourses);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('courses_updated'));
      window.dispatchEvent(new Event('teacher_courses_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    setSelectedCourseIds([]);
    setIsBulkDeleting(false);
    setSuccessMsg(`تم حذف (${count}) من المواد والمقررات وتكليفاتها بنجاح.`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleBulkExportExcel = async (list: Course[]) => {
    const selectedCoursesList = list.filter((c) => selectedCourseIds.includes(c.id));
    if (selectedCoursesList.length === 0) return;

    await exportCustomCoursesList(selectedCoursesList, 'كلية_ميسان');
    setSuccessMsg(`تم تصدير (${selectedCoursesList.length}) مادة إلى ملف Excel بنجاح! 📊`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // 🎛️ فتح نافذة تخصيص التوزيع
  const handleOpenAssessmentModal = (course: Course) => {
    setSelectedCourseForAssessment(course);
    const scheme = getCourseAssessmentScheme(course);
    setTempAssessmentScheme(JSON.parse(JSON.stringify(scheme)));
    setIsAssessmentModalOpen(true);
  };

  // 💾 حفظ المخطط التقييمي
  const handleSaveAssessmentSchemeModal = () => {
    if (!selectedCourseForAssessment || !tempAssessmentScheme) return;

    // 🧮 حساب مجموع بنود السعي التكويني المفتوحة فقط
    const getActiveScore = (key: keyof AssessmentScheme) => {
      const item = tempAssessmentScheme[key];
      return isAssessmentItemActive(item) ? (item.max_score || 0) : 0;
    };

    const cwSum = 
      getActiveScore('quiz1') +
      getActiveScore('quiz2') +
      getActiveScore('assignment1') +
      getActiveScore('assignment2') +
      getActiveScore('report') +
      getActiveScore('midterm') +
      getActiveScore('practical');

    const finalScore = tempAssessmentScheme.final_exam.max_score || 0;

    if (cwSum !== 50 || finalScore !== 50) {
      setErrorMsg(`⚠️ تنبيه: مجموع بنود السعي يجب أن يساوي 50 درجة بالضبط (الحالي: ${cwSum}) والنهائي 50 درجة (الحالي: ${finalScore})!`);
      setTimeout(() => setErrorMsg(''), 5000);
      return;
    }

    const updated = courses.map((c) => {
      if (c.id === selectedCourseForAssessment.id) {
        return {
          ...c,
          assessment_scheme: tempAssessmentScheme,
        };
      }
      return c;
    });

    setCourses(updated);
    saveStoredData('courses', updated);
    const updatedTargetCourse = updated.find((c) => c.id === selectedCourseForAssessment.id);
    if (updatedTargetCourse) {
      saveCourseToSupabase(updatedTargetCourse); // ☁️ حفظ المخطط التقييمي المخصص في سحابة Supabase
    }
    setIsAssessmentModalOpen(false);
    setSuccessMsg(`تم تثبيت المخطط التقييمي المخصص لمادة (${selectedCourseForAssessment.name}) بنجاح!`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // 🧮 تصفية وترتيب المواد
  const sortedCourses = useMemo(() => {
    let list = [...courses];

    // تصفية بالقسم
    if (filterDept !== 'all') {
      list = list.filter((c) => c.department_id === filterDept);
    }

    // تصفية بالبحث
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (c.department_name && c.department_name.toLowerCase().includes(q)) ||
          (c.theory_teacher_name && c.theory_teacher_name.toLowerCase().includes(q)) ||
          (c.practical_teacher_name && c.practical_teacher_name.toLowerCase().includes(q))
      );
    }

    // تطبيق الترتيب
    switch (sortMode) {
      case 'newest':
        return list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      case 'oldest':
        return list.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
      case 'name_asc':
        return list.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      case 'code_asc':
        return list.sort((a, b) => a.code.localeCompare(b.code, 'en'));
      case 'stage_asc':
        return list.sort((a, b) => (a.stage_number || 1) - (b.stage_number || 1));
      case 'custom':
      default:
        return list;
    }
  }, [courses, sortMode, searchQuery, filterDept]);

  // 🧮 حسابات التقطيع والتصفح لنظام الصفحات (Pagination) لجدول المواد الدراسية
  const totalCoursesCount = sortedCourses.length;
  const totalPages = Math.max(1, Math.ceil(totalCoursesCount / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedCourses = sortedCourses.slice(startIndex, startIndex + pageSize);

  return (
    <ZeroTrustGuard allowedRoles={['super_admin', 'admin']} redirectFallback="/sadmin">
      {/* 🏛️ الحاوية العريضة لتقليل المساحات الجانبية الفارغة */}
      <div className="space-y-6 font-sans w-full max-w-[1900px] mx-auto px-2 sm:px-4 py-4">
      
      {/* 🏛️ هيدر الصفحة الكحلي عريض الشاشة بحدود ناعمة */}
      <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-slate-900" />
            <span>إدارة المواد والمقررات الدراسية وتوزيع الدرجات</span>
          </h1>
          <p className="text-sm font-black sm:text-sm text-slate-950 font-black mt-1">
            جامعة الإمام جعفر الصادق (ع) - فرع ميسان | إدارة المواد وتعيين أساتذة النظري والعملي وضبط أوزان بولونيا الـ 7
          </p>
        </div>
      </div>

      {/* 🔔 التنبيه العائم الفاخر (Light Mode أبيض ناصع) عند إضافة أو تعديل أو حذف مادة دراسية */}
      {successMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200" dir="rtl">
          <div className="p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-emerald-500/80 ring-4 ring-emerald-400/10 flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 border-2 border-emerald-300 rounded-2xl shadow-2xs shrink-0">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-right">
                <h4 className="font-black text-base text-slate-950">إشعار النظام الأكاديمي</h4>
                <p className="font-black text-sm text-slate-950 mt-0.5">{successMsg}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg('')}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 hover:text-slate-900 border border-slate-300 flex items-center justify-center transition cursor-pointer shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* ⚠️ تنبيه الخطأ العائم الفاخر (Light Mode أبيض ناصع) */}
      {errorMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200" dir="rtl">
          <div className="p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-rose-500/80 ring-4 ring-rose-400/10 flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-rose-50 text-rose-700 border-2 border-rose-300 rounded-2xl shadow-2xs shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-right">
                <h4 className="font-black text-base text-slate-950">تنبيه النظام الأكاديمي</h4>
                <p className="font-black text-sm text-slate-950 mt-0.5">{errorMsg}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 hover:text-slate-900 border border-slate-300 flex items-center justify-center transition cursor-pointer shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* 📊 شريط إحصائيات المقررات الدراسية وشريط الإجراءات الموحد بسطر كامل */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
              <BookOpen className="w-7 h-7 text-slate-950" />
              <span>المقررات والمناهج الدراسية المعتمدة</span>
            </h3>
            <p className="text-base sm:text-lg font-black text-slate-700 mt-0.5">
              إدارة كافة المواد الدراسية، توصيف النظري والعملي، وتعيين الأساتذة المكلفين
            </p>
          </div>

          {/* 📊 شارات الإحصائيات للمواد الدراسية */}
          <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base font-black">
            <span className="bg-slate-100 text-slate-950 px-3.5 py-1.5 rounded-2xl border border-slate-300 shadow-2xs whitespace-nowrap">
              إجمالي المواد: {courses.length}
            </span>
            <span className="bg-emerald-100 text-emerald-950 px-3.5 py-1.5 rounded-2xl border border-emerald-300 shadow-2xs whitespace-nowrap">
              نظري وعملي: {courses.filter((c) => c.course_type === 'theory_and_practical' || c.has_practical).length}
            </span>
            <span className="bg-blue-100 text-blue-950 px-3.5 py-1.5 rounded-2xl border border-blue-300 shadow-2xs whitespace-nowrap">
              نظري فقط: {courses.filter((c) => c.course_type === 'theory_only' && !c.has_practical).length}
            </span>
          </div>
        </div>

        {/* 🛠️ أزرار الإجراءات الأربعة بسطر واحد كامل وموحد التصميم الكحلي الفاخر */}
        <div className="flex items-center gap-2.5 flex-nowrap shrink-0 overflow-x-auto max-w-full pb-1 xl:pb-0">
          {/* ➕ زر فتح كارت إضافة مادة دراسية جديدة */}
          <button
            type="button"
            onClick={() => {
              setEditingCourse(null);
              setCourseName('');
              setCourseCode('');
              setSelectedStageNum(null); // 🔄 تصفير المرحلة
              setSelectedSemester(null); // 🔄 تصفير الكورس
              setCourseType(null); // 🔄 تصفير نوع المادة
              setTheoryTeacherId('');
              setPracticalTeacherId('');
              setCreditHours(null); // 🔄 تصفير الساعات
              if (departments.length > 0) setSelectedDeptId(departments[0].id);
              setIsCourseModalOpen(true);
            }}
            className="px-4.5 py-2.5 sm:px-5 sm:py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-sm sm:text-base shadow-xs transition flex items-center gap-2 cursor-pointer border border-[#163a5f] shrink-0 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5 text-cyan-300" />
            <span>إضافة مادة دراسية جديدة</span>
          </button>

          {/* 📥 زر تنزيل نموذج Excel لمواد الجامعة */}
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-4.5 py-2.5 sm:px-5 sm:py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-sm sm:text-base shadow-xs transition flex items-center gap-2 cursor-pointer border border-[#163a5f] shrink-0 active:scale-95 whitespace-nowrap"
            title="تنزيل نموذج Excel المعتمد للمقررات والمناهج الدراسية"
          >
            <Download className="w-5 h-5 text-emerald-400" />
            <span>نموذج Excel</span>
          </button>

          {/* ℹ️ زر تعليمات الاستيراد */}
          <button
            type="button"
            onClick={() => setShowExcelInstructions(true)}
            className="px-4 py-2.5 sm:px-4.5 sm:py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-sm sm:text-base shadow-xs transition flex items-center gap-2 cursor-pointer border border-[#163a5f] shrink-0 active:scale-95 whitespace-nowrap"
            title="تعليمات وضوابط استيراد المواد الدراسية"
          >
            <Info className="w-5 h-5 text-cyan-300" />
            <span>التعليمات</span>
          </button>

          {/* 📤 زر استيراد ملف Excel للمواد */}
          <label className="px-4.5 py-2.5 sm:px-5 sm:py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-sm sm:text-base shadow-xs transition flex items-center gap-2 cursor-pointer border border-[#163a5f] shrink-0 active:scale-95 whitespace-nowrap">
            <Upload className="w-5 h-5 text-cyan-300" />
            <span>{isImportingExcel ? 'جاري الاستيراد...' : 'استيراد Excel'}</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleExcelUpload}
              disabled={isImportingExcel}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 📝 مودال إضافة وتعديل المادة الدراسية عبر المكون المستقل */}
      <AdminCourseModal
        isCourseModalOpen={isCourseModalOpen}
        setIsCourseModalOpen={setIsCourseModalOpen}
        editingCourse={editingCourse}
        setEditingCourse={setEditingCourse}
        handleSaveCourse={handleSaveCourse}
        courseName={courseName}
        setCourseName={setCourseName}
        courseCode={courseCode}
        setCourseCode={setCourseCode}
        courseType={courseType}
        setCourseType={setCourseType}
        selectedDeptId={selectedDeptId}
        setSelectedDeptId={setSelectedDeptId}
        departments={departments}
        isDeptDropdownOpen={isDeptDropdownOpen}
        setIsDeptDropdownOpen={setIsDeptDropdownOpen}
        selectedStageNum={selectedStageNum}
        setSelectedStageNum={setSelectedStageNum}
        selectedSemester={selectedSemester}
        setSelectedSemester={setSelectedSemester}
        creditHours={creditHours}
        setCreditHours={setCreditHours}
        theoryTeacherId={theoryTeacherId}
        setTheoryTeacherId={setTheoryTeacherId}
        isTheoryTeacherDropdownOpen={isTheoryTeacherDropdownOpen}
        setIsTheoryTeacherDropdownOpen={setIsTheoryTeacherDropdownOpen}
        practicalTeacherId={practicalTeacherId}
        setPracticalTeacherId={setPracticalTeacherId}
        isPracticalTeacherDropdownOpen={isPracticalTeacherDropdownOpen}
        setIsPracticalTeacherDropdownOpen={setIsPracticalTeacherDropdownOpen}
        deptTeachers={deptTeachers}
      />

      {/* 📊 قائمة المواد الحالية مع شريط البحث والترتيب والفرز */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        
        {/* شريط البحث وتصفية القسم والترتيب */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2.5">
              <BookOpen className="w-7 h-7 text-indigo-700" />
              <span>المواد والكورسات المعتمدة بالأقسام والمراحل</span>
              <span className="px-3.5 py-1 rounded-full bg-slate-100 text-slate-950 text-base font-black border border-slate-300">
                {sortedCourses.length} من {courses.length}
              </span>
            </h2>
            <p className="text-base text-slate-950 font-black mt-1">
              يمكنك تخصيص الترتيب أو الفرز واستخدام أزرار التقديم والتأخير ⬆️ ⬇️ لنقل أي مادة
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* تصفية بالقسم - قائمة منسدلة مخصصة وفخمة */}
            <div className="relative" ref={filterDeptDropdownRef}>
              <button
                type="button"
                onClick={() => setIsFilterDeptDropdownOpen(!isFilterDeptDropdownOpen)}
                className={`flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border-2 rounded-2xl px-4 py-2 text-base font-black text-slate-950 transition cursor-pointer shadow-xs ${
                  isFilterDeptDropdownOpen ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <Filter className="w-4 h-4 text-indigo-700 shrink-0" />
                <span>
                  {filterDept === 'all'
                    ? `كافة الأقسام (${departments.length})`
                    : departments.find((d) => d.id === filterDept)?.name || 'اختر قسماً'}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-950 transition-transform ${isFilterDeptDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFilterDeptDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-50 p-2 space-y-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterDept('all');
                      setIsFilterDeptDropdownOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                      filterDept === 'all'
                        ? 'bg-indigo-50 text-indigo-950 border border-indigo-300'
                        : 'text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    <span>كافة الأقسام ({departments.length})</span>
                    {filterDept === 'all' && <Check className="w-4 h-4 text-indigo-700" />}
                  </button>

                  {departments.map((d) => {
                    const isSelected = filterDept === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setFilterDept(d.id);
                          setIsFilterDeptDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-950 border border-indigo-300'
                            : 'text-slate-950 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-950 shrink-0" />
                          <span>{d.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-700" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* حقل البحث */}
            <div className="relative w-full sm:w-72">
              <Search className="w-5 h-5 text-slate-950 absolute right-3.5 top-1/2 -translate-y-1/2" />
              {/* 🔍 حقل البحث عن المواد مع تلميح رصاصي هادئ */}
              <input
                type="text" // 🔤 نوع الحقل نصي
                value={searchQuery} // 💾 قيمة البحث
                onChange={(e) => setSearchQuery(e.target.value)} // 🔄 فلترة تلقائية
                placeholder="ابحث عن مادة أو كود أو أستاذ..." // 💡 نص التلميح
                className="w-full pr-11 pl-3 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-950 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:border-slate-900" // 🎨 تلميح رصاصي slate-400
              />
            </div>
          </div>
        </div>

        {/* أزرار الترتيب */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-sm font-black text-slate-950">
            <SlidersHorizontal className="w-4 h-4 text-slate-900" />
            <span>ترتيب المواد:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSortMode('custom')}
              className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                sortMode === 'custom'
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                  : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>ترتيب يدوي مخصص (الافتراضي)</span>
            </button>

            <button
              type="button"
              onClick={() => setSortMode('newest')}
              className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                sortMode === 'newest'
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                  : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>الأحدث أولاً</span>
            </button>

            <button
              type="button"
              onClick={() => setSortMode('name_asc')}
              className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                sortMode === 'name_asc'
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                  : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>أبجدياً (أ - ي)</span>
            </button>

            <button
              type="button"
              onClick={() => setSortMode('stage_asc')}
              className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                sortMode === 'stage_asc'
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                  : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>حسب المرحلة (الأولى - الرابعة)</span>
            </button>
          </div>
        </div>

        {/* 🎛️ شريط الإجراءات الجماعية الفاخر للمواد الدراسية */}
        {selectedCourseIds.length > 0 && (
          <div className="bg-[#0F2942] text-white p-4 sm:px-6 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-[#163a5f] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 text-cyan-200 rounded-xl border border-white/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-base text-white">
                  تم تحديد <strong className="text-cyan-200 font-mono text-lg font-black">({selectedCourseIds.length})</strong> من أصل <span className="font-mono text-slate-200">({sortedCourses.length})</span> مادة دراسية
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleting(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف المحدد ({selectedCourseIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkExportExcel(sortedCourses)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>تصدير المحدد Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCourseIds([])}
                className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-black text-sm transition cursor-pointer"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-3xl border border-slate-300">
          <table className="w-full text-right text-base border-collapse whitespace-nowrap">
            <thead className="bg-[#0F2942] text-white font-black border-b border-[#0F2942]">
              <tr>
                <th className="p-4 text-center w-12 whitespace-nowrap">
                  <input
                    type="checkbox"
                    aria-label="تحديد كافة المواد المعروضة في الصفحة"
                    checked={paginatedCourses.length > 0 && paginatedCourses.every((c) => selectedCourseIds.includes(c.id))}
                    onChange={() => {
                      const pageIds = paginatedCourses.map((c) => c.id);
                      const allSelected = pageIds.every((id) => selectedCourseIds.includes(id));
                      if (allSelected) {
                        setSelectedCourseIds((prev) => prev.filter((id) => !pageIds.includes(id)));
                      } else {
                        setSelectedCourseIds((prev) => Array.from(new Set([...prev, ...pageIds])));
                      }
                    }}
                    className="w-5 h-5 rounded-md border-2 border-slate-300 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                  />
                </th>
                <th className="p-4 text-center w-16 whitespace-nowrap text-white">#</th>
                <th className="p-4 whitespace-nowrap text-white">رمز المادة</th>
                <th className="p-4 whitespace-nowrap text-white">اسم المادة</th>
                <th className="p-4 whitespace-nowrap text-white">القسم والمرحلة</th>
                <th className="p-4 whitespace-nowrap text-white">نوع المادة</th>
                <th className="p-4 text-center whitespace-nowrap text-white">الوحدات (ECTS)</th>
                <th className="p-4 whitespace-nowrap text-white">أستاذ النظري</th>
                <th className="p-4 whitespace-nowrap text-white">أستاذ العملي</th>
                <th className="p-4 text-center whitespace-nowrap text-white">الترتيب</th>
                <th className="p-4 text-center whitespace-nowrap text-white">توزيع الدرجات</th>
                <th className="p-4 text-center whitespace-nowrap text-white">التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-black text-slate-950">
              {paginatedCourses.map((course: Course, index: number) => {
                const isPractical = course.course_type === 'theory_and_practical' || course.has_practical;
                const globalIndex = startIndex + index;
                const isFirst = globalIndex === 0;
                const isLast = globalIndex === sortedCourses.length - 1;
                const isSelected = selectedCourseIds.includes(course.id);

                return (
                  <tr key={course.id} className={`${isSelected ? 'bg-blue-50/70 ring-1 ring-blue-300' : 'hover:bg-slate-50'} transition`}>
                    <td className="p-4 text-center whitespace-nowrap">
                      <input
                        type="checkbox"
                        aria-label={`تحديد ${course.name}`}
                        checked={isSelected}
                        onChange={() => toggleSelect(course.id)}
                        className="w-5 h-5 rounded-md border-2 border-slate-300 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                      />
                    </td>
                    <td className="p-4 text-center font-black text-slate-950 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-300 text-slate-950 font-black text-sm shadow-2xs">
                        {globalIndex + 1}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-black text-[#0F2942] text-sm whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg">
                        {course.code}
                      </span>
                    </td>
                    <td className="p-4 font-black text-slate-950 text-base whitespace-nowrap">
                      <span className="hover:text-[#0F2942] transition">{course.name}</span>
                    </td>
                    <td className="p-4 text-slate-950 font-black whitespace-nowrap text-sm">
                      <span className="text-slate-900">{course.department_name}</span>
                      <span className="text-slate-400 font-black mx-1.5">•</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-md text-xs">
                        المرحلة {getStageNameInArabic(course.stage_number || 1)}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {isPractical ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-xl text-xs font-black whitespace-nowrap">
                          <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
                          <span>نظري وعملي</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-950 border border-blue-200 rounded-xl text-xs font-black whitespace-nowrap">
                          <BookOpen className="w-3.5 h-3.5 text-[#0F2942]" />
                          <span>نظري فقط</span>
                        </span>
                      )}
                    </td>

                    {/* 🎓 عمود الساعات والوحدات المعتمدة ECTS */}
                    <td className="p-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0F2942]/10 text-[#0F2942] border border-[#0F2942]/30 rounded-xl text-xs font-black shadow-2xs whitespace-nowrap">
                        <Award className="w-3.5 h-3.5 text-[#0F2942]" />
                        <span>{course.credit_hours || 3} ECTS</span>
                      </span>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {(() => {
                        const thTeachers = getCourseTheoryTeachers(course); // 📋 جلب كافة أساتذة النظري المكلفين
                        if (thTeachers.length > 0) { // ✅ إذا وُجد أساتذة مكلفين
                          return (
                            <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                              {thTeachers.map((t) => (
                                <span
                                  key={t.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 font-black text-xs shadow-2xs"
                                >
                                  <Users className="w-3.5 h-3.5 text-[#0F2942]" />
                                  <span>{t.name}</span>
                                </span>
                              ))}
                            </div>
                          );
                        }
                        return <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-bold text-xs whitespace-nowrap">غير معين</span>;
                      })()}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {isPractical ? (
                        (() => {
                          const prTeachers = getCoursePracticalTeachers(course); // 📋 جلب كافة أساتذة العملي المكلفين
                          if (prTeachers.length > 0) { // ✅ إذا وُجد أساتذة عملي مكلفين
                            return (
                              <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                                {prTeachers.map((t) => (
                                  <span
                                    key={t.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 font-black text-xs shadow-2xs"
                                  >
                                    <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>{t.name}</span>
                                  </span>
                                ))}
                              </div>
                            );
                          }
                          return <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 font-bold text-xs whitespace-nowrap">غير معين</span>;
                        })()
                      ) : (
                        <span className="text-black font-black text-xs sm:text-sm whitespace-nowrap">— نظري فقط</span>
                      )}
                    </td>
                    
                    {/* 🎛️ أزرار التقديم والتأخير للمادة */}
                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => handleMoveCourse(globalIndex, 'up', e)}
                          disabled={isFirst}
                          title="تقديم المادة للأعلى"
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isFirst
                              ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-[#0F2942] hover:text-white shadow-2xs'
                          }`}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleMoveCourse(globalIndex, 'down', e)}
                          disabled={isLast}
                          title="تأخير المادة للأسفل"
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isLast
                              ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-[#0F2942] hover:text-white shadow-2xs'
                          }`}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="p-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenAssessmentModal(course)}
                        className="px-3.5 py-1.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                      >
                        <Sliders className="w-3.5 h-3.5 text-cyan-200" />
                        <span>تخصيص</span>
                      </button>
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                        {/* ✏️ زر تعديل المادة بالخلفية البيضاء والأيقونة الكحلية الملكية #0F2942 */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCourse(course);
                            setCourseName(course.name);
                            setCourseCode(course.code);
                            setSelectedDeptId(course.department_id || (departments[0]?.id || ''));
                            setSelectedStageNum(course.stage_number || 1);
                            setSelectedSemester(course.semester || 1);
                            setCourseType(course.course_type || (course.has_practical ? 'theory_and_practical' : 'theory_only'));
                            setTheoryTeacherId(course.theory_teacher_id || '');
                            setPracticalTeacherId(course.practical_teacher_id || '');
                            setCreditHours(course.credit_hours || 3);
                            setIsCourseModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#0F2942] rounded-xl transition border border-slate-300 font-black text-xs flex items-center gap-1 cursor-pointer shadow-2xs whitespace-nowrap"
                          title="تعديل بيانات المادة"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#0F2942]" />
                          <span>تعديل</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(course.id)}
                          className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-xl transition border border-rose-200 cursor-pointer shadow-2xs whitespace-nowrap"
                          title="حذف المادة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {sortedCourses.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-12 text-center bg-white">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-14 h-14 bg-blue-50 text-blue-900 border border-blue-200 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                        <BookOpen className="w-7 h-7 text-blue-900" />
                      </div>
                      <h4 className="text-xl font-black text-slate-950">
                        {courses.length === 0 ? 'لا توجد مواد دراسية مضافة حتى الآن' : 'لم يتم العثور على أي مادة مطابقة'}
                      </h4>
                      <p className="text-sm font-black text-slate-950 leading-relaxed">
                        {courses.length === 0
                          ? 'يمكنك إضافة المواد الدراسية يدوياً أو استيرادها دفعة واحدة عبر ملف Excel.'
                          : 'يرجى مراجعة محددات التصفية أو كلمة البحث.'}
                      </p>
                      {courses.length === 0 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCourse(null);
                              setIsCourseModalOpen(true);
                            }}
                            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-sm font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 border border-[#163a5f]"
                          >
                            <Plus className="w-4 h-4 text-cyan-300" />
                            <span>إضافة مادة جديدة</span>
                          </button>
                          <label className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95">
                            <Download className="w-4 h-4 text-white" />
                            <span>استيراد المواد من Excel</span>
                            <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} disabled={isImportingExcel} className="hidden" />
                          </label>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 📄 شريط التنقل بين الصفحات (Pagination Controls) مع قائمة منسدلة داخل الشاشة تفتح للأعلى */}
        {totalCoursesCount > 0 && (
          <div className="bg-white border border-slate-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            {/* 📊 ملخص عدد العناصر المعروضة */}
            <div className="text-sm font-black text-slate-950 flex items-center gap-1.5">
              <span>عرض</span>
              <span className="font-mono text-indigo-950 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                {startIndex + 1}
              </span>
              <span>إلى</span>
              <span className="font-mono text-indigo-950 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                {Math.min(startIndex + pageSize, totalCoursesCount)}
              </span>
              <span>من إجمالي</span>
              <span className="font-mono text-slate-950 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-300">
                {totalCoursesCount}
              </span>
              <span>مادة دراسية</span>
            </div>

            {/* 🔘 أزرار التنقل بين الصفحات واختيار حجم الصفحة */}
            <div className="flex items-center gap-2">
              {/* 📏 القائمة المنسدلة المخصصة لاختيار حجم الصفحة (تفتح للأعلى داخل الشاشة والجدول) */}
              <div className="relative" ref={pageSizeDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsPageSizeOpen(!isPageSizeOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-950 border border-slate-300 rounded-xl text-xs font-black transition cursor-pointer shadow-2xs"
                  title="تحديد عدد المواد المعروضة في الصفحة"
                >
                  <span>{pageSize} مادة / صفحة</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isPageSizeOpen ? 'rotate-180' : ''}`} />
                </button>

                {isPageSizeOpen && (
                  <div className="absolute bottom-full mb-2 right-0 bg-white border border-slate-300 rounded-2xl shadow-xl z-50 w-36 overflow-hidden py-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    {[5, 10, 20, 50].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setPageSize(size);
                          setCurrentPage(1);
                          setIsPageSizeOpen(false);
                        }}
                        className={`w-full px-3.5 py-2 text-right text-xs font-black flex items-center justify-between transition hover:bg-indigo-50 cursor-pointer ${
                          pageSize === size ? 'bg-indigo-100 text-indigo-950' : 'text-slate-950'
                        }`}
                      >
                        <span>{size} مواد</span>
                        {pageSize === size && <Check className="w-3.5 h-3.5 text-indigo-700" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block" />

              {/* أزرار الصفحات */}
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="p-2 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="الصفحة الأولى"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="p-2 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="الصفحة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* مؤشر الصفحة */}
              <span className="px-3 py-1.5 bg-slate-100 border border-slate-300 text-slate-950 rounded-xl text-xs font-black font-mono">
                {safeCurrentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-2 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="الصفحة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="p-2 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="الصفحة الأخيرة"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 🎛️ مودال تقييم وتوزيع درجات بولونيا عبر المكون المستقل */}
      <AdminCourseAssessmentModal
        isAssessmentModalOpen={isAssessmentModalOpen}
        setIsAssessmentModalOpen={setIsAssessmentModalOpen}
        selectedCourseForAssessment={selectedCourseForAssessment}
        tempAssessmentScheme={tempAssessmentScheme}
        setTempAssessmentScheme={setTempAssessmentScheme}
        handleSaveAssessmentSchemeModal={handleSaveAssessmentSchemeModal}
      />
      {/* 📊 نوافذ تعليمات وتقرير استيراد ملفات الإكسل للمواد عبر المكون المستقل */}
      <AdminCourseExcelModals
        showExcelInstructions={showExcelInstructions}
        setShowExcelInstructions={setShowExcelInstructions}
        handleDownloadTemplate={handleDownloadTemplate}
        importReport={importReport}
        setImportReport={setImportReport}
        activeReportTab={activeReportTab}
        setActiveReportTab={setActiveReportTab}
      />
      {/* 🗑️ كارد تأكيد حذف المادة الدراسية الاحترافي الفاخر */}
      <ConfirmDeleteModal
        isOpen={!!deletingCourse}
        onClose={() => setDeletingCourse(null)}
        title="تأكيد حذف المادة الدراسية"
        itemName={deletingCourse?.name || ''}
        itemDetails={`رمز المادة: ${deletingCourse?.code || '—'} | المرحلة ${deletingCourse?.stage_number || 1} - الكورس ${deletingCourse?.semester === 1 ? 'الأول' : 'الثاني'}`}
        warningMessage="هل أنت متأكد من حذف هذه المادة الدراسية؟ سيتم حذف كافة السجلات والدرجات والتوزيعات المرتبطة بها."
        onConfirm={confirmExecuteDeleteCourse}
      />

      {/* 🗑️ كارد تأكيد الحذف الجماعي للمواد الدراسية */}
      <ConfirmDeleteModal
        isOpen={isBulkDeleting}
        onClose={() => setIsBulkDeleting(false)}
        title={`تأكيد الحذف الجماعي لـ (${selectedCourseIds.length}) مواد دراسية`}
        itemName={`${selectedCourseIds.length} من المواد والكورسات المعتمدة`}
        itemDetails="سيتم حذف المواد المحددة وكافة توزيعات الدرجات وسجلات الطلاب المرتبطة بها نهائياً."
        warningMessage="⚠️ تنبيه أمني: هل أنت متأكد من حذف المواد الدراسية المحددة دفعة واحدة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText={`حذف (${selectedCourseIds.length}) مواد نهائياً`}
        onConfirm={confirmBulkDeleteCourses}
      />

      </div>
    </ZeroTrustGuard>
  );
}
