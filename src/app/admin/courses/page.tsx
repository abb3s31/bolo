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
  syncStagesFromSupabase
} from '@/lib/supabase-client'; // 🔌 فحص الجلسة ودوال المزامنة السحابية الحية
import { getStoredData, saveStoredData, INITIAL_COURSES, INITIAL_DEPARTMENTS, INITIAL_STAGES, INITIAL_PROFILES } from '@/lib/mock-data'; // 💾 التخزين
import { Course, Department, Stage, UserProfile, CourseType, AssessmentScheme } from '@/types'; // 🔗 الأنواع الرسمية
import { getDefaultAssessmentScheme, getCourseAssessmentScheme, getStageNameInArabic } from '@/lib/grade-utils'; // 🧮 دوال حسابات الدرجات
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
  Sparkles, 
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

  // 🔄 فحص الجلسة وتحميل البيانات
  useEffect(() => {
    const user = getCurrentSessionUser();
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
      router.push('/sadmin');
      return;
    }
    const loadedDepts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS);
    setCourses(getStoredData<Course[]>('courses', INITIAL_COURSES));
    setDepartments(loadedDepts);
    setStages(getStoredData<Stage[]>('stages', INITIAL_STAGES));
    setProfiles(getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES));
    if (loadedDepts.length > 0) setSelectedDeptId(loadedDepts[0].id);

    // ☁️ المزامنة اللحظية الحية من سحابة Supabase
    syncCoursesFromSupabase().then((liveCourses) => {
      if (liveCourses && liveCourses.length > 0) setCourses(liveCourses);
    }).catch(() => {});
    syncDepartmentsFromSupabase().then((liveDepts) => {
      if (liveDepts && liveDepts.length > 0) setDepartments(liveDepts);
    }).catch(() => {});
    syncStagesFromSupabase().then((liveStages) => {
      if (liveStages && liveStages.length > 0) setStages(liveStages);
    }).catch(() => {});
    syncProfilesFromSupabase().then((liveProfiles) => {
      if (liveProfiles && liveProfiles.length > 0) setProfiles(liveProfiles);
    }).catch(() => {});
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
    setDeletingCourse(null);
    setSuccessMsg(`تم حذف مادة (${deletingCourse.name}) بنجاح.`);
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

    const updatedCourses = courses.filter((c) => !selectedCourseIds.includes(c.id));
    setCourses(updatedCourses);
    saveStoredData('courses', updatedCourses);
    setSelectedCourseIds([]);
    setIsBulkDeleting(false);
    setSuccessMsg(`تم حذف (${count}) من المواد والمقررات الدراسية بنجاح.`);
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

    const cwSum = 
      (tempAssessmentScheme.quiz1.max_score || 0) +
      (tempAssessmentScheme.quiz2.max_score || 0) +
      (tempAssessmentScheme.assignment1.max_score || 0) +
      (tempAssessmentScheme.assignment2.max_score || 0) +
      (tempAssessmentScheme.report.max_score || 0) +
      (tempAssessmentScheme.midterm.max_score || 0) +
      (tempAssessmentScheme.practical.max_score || 0);

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

      {/* 📝 كارت CRUD عائم فوق الكل لإضافة / تعديل مادة دراسية */}
      <FloatingCrudModal
        isOpen={isCourseModalOpen}
        onClose={() => {
          setIsCourseModalOpen(false);
          setEditingCourse(null);
          setIsTheoryTeacherDropdownOpen(false);
          setIsPracticalTeacherDropdownOpen(false);
          setIsDeptDropdownOpen(false);
        }}
        title={editingCourse ? `تعديل المادة الدراسية: ${editingCourse.name}` : 'إضافة مادة (كورس) جديد للمنهج الأكاديمي'}
        subtitle="تحديد وتوصيف المادة، القسم والمرحلة، الكورس، الساعات المعتمدة، وأساتذة النظري والعملي"
        icon={<BookOpen className="w-6 h-6 text-indigo-700" />}
        maxWidth="max-w-4xl"
        onSubmit={handleSaveCourse}
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setIsCourseModalOpen(false);
                setEditingCourse(null);
                setIsTheoryTeacherDropdownOpen(false);
                setIsPracticalTeacherDropdownOpen(false);
                setIsDeptDropdownOpen(false);
              }}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-2xl text-base transition cursor-pointer border border-slate-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-7 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-md transition flex items-center gap-2 cursor-pointer border border-[#163a5f] active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              <span>{editingCourse ? 'حفظ وتثبيت التعديلات' : 'إضافة المادة وتثبيت التكليف'}</span>
            </button>
          </>
        }
      >
        <div className="space-y-6 text-right text-base font-black">
          
          {/* 🏛️ القسم الأول: البيانات الأساسية للمقرر وتوصيفه */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
              <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-2xs">
                <BookOpen className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-950">بيانات المقرر وتوصيف المسار</h4>
                <p className="text-xs sm:text-sm font-black text-slate-950">اسم المادة ورمزها الرسمي ونوع دراستها والقسم التابع لها</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
              {/* اسم المادة */}
              <div className="col-span-12 md:col-span-7 space-y-2">
                <label className="block text-base font-black text-slate-950">اسم المادة الدراسي بالعربية *</label>
                <div className="relative">
                  {/* 📚 حقل إدخال اسم المادة مع تلميح رصاصي راقي */}
                  <input
                    type="text" // 🔤 نوع الحقل نصي
                    required // ⚠️ إجباري
                    value={courseName} // 💾 حفظ اسم المادة
                    onChange={(e) => setCourseName(e.target.value)} // 🔄 تحديث الاسم ويا الكتابة
                    placeholder="مثال: البرمجة الهيكلية بلغة C++" // 💡 نص تلميح للمستخدم
                    className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-950 text-base font-black placeholder:text-slate-400 placeholder:font-medium focus:border-slate-900 focus:outline-none shadow-2xs" // 🎨 تلميح رصاصي أنيق
                  />
                  <BookOpen className="w-5 h-5 absolute right-3.5 top-4 text-slate-950 pointer-events-none" />
                </div>
              </div>

              {/* رمز المادة */}
              <div className="col-span-12 md:col-span-5 space-y-2">
                <label className="block text-base font-black text-slate-950">رمز المادة الأكاديمي (Code) *</label>
                <div className="relative">
                  {/* 🏷️ حقل رمز المادة مع تلميح رصاصي مرتب */}
                  <input
                    type="text" // 🔤 نوع الحقل نصي
                    required // ⚠️ إجباري
                    value={courseCode} // 💾 حفظ كود المادة
                    onChange={(e) => setCourseCode(e.target.value)} // 🔄 تحديث الكود
                    placeholder="مثال: CS201" // 💡 كود استرشادي
                    className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-950 text-base font-black placeholder:text-slate-400 placeholder:font-medium focus:border-slate-900 focus:outline-none uppercase shadow-2xs font-mono" // 🎨 تلميح رصاصي
                  />
                  <Layers className="w-5 h-5 absolute right-3.5 top-4 text-slate-950 pointer-events-none" />
                </div>
              </div>

              {/* القسم المستهدف بقائمة تفاعلية مخصصة */}
              <div className="col-span-12 space-y-2 relative z-[999999]">
                <label className="block text-base font-black text-slate-950">القسم العلمي الأكاديمي *</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeptDropdownOpen(!isDeptDropdownOpen);
                      setIsTheoryTeacherDropdownOpen(false);
                      setIsPracticalTeacherDropdownOpen(false);
                    }}
                    className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-950 font-black text-base focus:border-slate-900 focus:outline-none cursor-pointer shadow-2xs text-right flex items-center justify-between transition hover:border-slate-400"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="w-5 h-5 text-slate-950 shrink-0" />
                      <span className="text-slate-950 font-black">
                        {departments.find((d) => d.id === selectedDeptId)?.name || 'اختر القسم العلمي'}
                      </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-950 transition-transform duration-200 shrink-0 ${isDeptDropdownOpen ? 'rotate-180 text-blue-700' : ''}`} />
                  </button>

                  {/* القائمة المنبثقة للقسم */}
                  {isDeptDropdownOpen && (
                    <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-300 p-2 z-[999999] max-h-60 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150">
                      {departments.map((d: Department) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setSelectedDeptId(d.id);
                            setIsDeptDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-right font-black text-sm sm:text-base transition flex items-center justify-between cursor-pointer ${
                            selectedDeptId === d.id
                              ? 'bg-[#0F2942] text-white shadow-xs'
                              : 'text-slate-950 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className={`w-4 h-4 ${selectedDeptId === d.id ? 'text-cyan-300' : 'text-slate-950'}`} />
                            <span>{d.name}</span>
                          </div>
                          {selectedDeptId === d.id && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* نوع المادة وتوصيفها بتصميم بطاقات تفاعلية فاخرة */}
              <div className="col-span-12 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-base font-black text-slate-950">توصيف ونوع المادة *</label>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all ${
                    courseType === null
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  }`}>
                    {courseType === null ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>غير محدد</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{courseType === 'theory_and_practical' ? 'نظري وعملي' : 'نظري فقط'}</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* بطاقة: نظري وعملي */}
                  <button
                    type="button"
                    onClick={() => setCourseType('theory_and_practical')}
                    className={`p-3.5 sm:p-4 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                      courseType === 'theory_and_practical'
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-emerald-400/40'
                        : 'bg-white text-slate-950 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${courseType === 'theory_and_practical' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                        <FlaskConical className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-black flex items-center gap-2">
                          <span>نظري وعملي (مختبري)</span>
                        </div>
                        <p className={`text-xs font-black mt-0.5 ${courseType === 'theory_and_practical' ? 'text-slate-100' : 'text-slate-950'}`}>
                          يشمل محاضرات قاعة وتطبيقات مختبرية
                        </p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border transition-all ${
                      courseType === 'theory_and_practical'
                        ? 'bg-emerald-500 border-emerald-400 text-white'
                        : 'border-slate-300 bg-slate-100'
                    }`}>
                      {courseType === 'theory_and_practical' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>

                  {/* بطاقة: نظري فقط */}
                  <button
                    type="button"
                    onClick={() => setCourseType('theory_only')}
                    className={`p-3.5 sm:p-4 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                      courseType === 'theory_only'
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-cyan-400/40'
                        : 'bg-white text-slate-950 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${courseType === 'theory_only' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-black flex items-center gap-2">
                          <span>نظري فقط (بدون عملي)</span>
                        </div>
                        <p className={`text-xs font-black mt-0.5 ${courseType === 'theory_only' ? 'text-slate-100' : 'text-slate-950'}`}>
                          محاضرات نظرية في القاعة فقط
                        </p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border transition-all ${
                      courseType === 'theory_only'
                        ? 'bg-cyan-500 border-cyan-400 text-white'
                        : 'border-slate-300 bg-slate-100'
                    }`}>
                      {courseType === 'theory_only' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>

                </div>
                {courseType === null && (
                  <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>يرجى اختيار نوع المادة (نظري وعملي أو نظري فقط)</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 🎓 القسم الثاني: الخطة الأكاديمية والوحدات */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
              <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-2xs">
                <GraduationCap className="w-5 h-5 text-sky-300" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-950">التوزيع الأكاديمي والوحدات (ECTS)</h4>
                <p className="text-xs sm:text-sm font-black text-slate-950">المرحلة الدراسية والكورس وساعاتها المعتمدة</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
              
              {/* المرحلة الدراسية بتصميم أزرار تفاعلية واضحة ومباشرة */}
              <div className="col-span-12 sm:col-span-7 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-base font-black text-slate-950">المرحلة الدراسية *</label>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all ${
                    selectedStageNum === null
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  }`}>
                    {selectedStageNum === null ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>غير محدد</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>المرحلة {selectedStageNum}</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { num: 1, label: 'المرحلة الأولى' },
                    { num: 2, label: 'المرحلة الثانية' },
                    { num: 3, label: 'المرحلة الثالثة' },
                    { num: 4, label: 'المرحلة الرابعة' },
                  ].map((stg) => (
                    <button
                      key={stg.num}
                      type="button"
                      onClick={() => setSelectedStageNum(stg.num)}
                      className={`py-3.5 px-2 rounded-2xl border text-center font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                        selectedStageNum === stg.num
                          ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                          : 'bg-white text-slate-950 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      <GraduationCap className={`w-4 h-4 shrink-0 ${selectedStageNum === stg.num ? 'text-sky-300' : 'text-slate-950'}`} />
                      <span className="whitespace-nowrap">{stg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* الكورس بتصميم أزرار تفاعلية واضحة ومباشرة مع حذف كلمة الفصل */}
              <div className="col-span-12 sm:col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-base font-black text-slate-950">الكورس *</label>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all ${
                    selectedSemester === null
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  }`}>
                    {selectedSemester === null ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>غير محدد</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{selectedSemester === 1 ? 'الكورس الأول' : 'الكورس الثاني'}</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { sem: 1, title: 'الكورس الأول' },
                    { sem: 2, title: 'الكورس الثاني' },
                  ].map((s) => (
                    <button
                      key={s.sem}
                      type="button"
                      onClick={() => setSelectedSemester(s.sem as 1 | 2)}
                      className={`py-3.5 px-3 rounded-2xl border text-center font-black text-base transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                        selectedSemester === s.sem
                          ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                          : 'bg-white text-slate-950 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      <Calendar className={`w-5 h-5 ${selectedSemester === s.sem ? 'text-cyan-300' : 'text-blue-600'}`} />
                      <span>{s.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* الساعات المعتمدة ECTS */}
              <div className="col-span-12 space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-base font-black text-slate-950">الساعات والوحدات المعتمدة (ECTS) *</label>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all ${
                    creditHours === null
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  }`}>
                    {creditHours === null ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>غير محدد</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>النقاط المحددة: {creditHours} ECTS</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {[2, 3, 4, 5, 6, 7, 8].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setCreditHours(pts)}
                      className={`py-3 px-2 rounded-2xl font-black text-base border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                        creditHours === pts
                          ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                          : 'bg-white text-slate-950 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      <Award className={`w-4 h-4 ${creditHours === pts ? 'text-sky-300' : 'text-slate-950'}`} />
                      <span>{pts}</span>
                    </button>
                  ))}
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={creditHours ?? ''}
                      onChange={(e) => setCreditHours(e.target.value ? Number(e.target.value) : null)}
                      placeholder="مخصص"
                      title="تحديد ساعات معتمدة مخصصة"
                      className={`w-full h-full py-3 px-1 text-center rounded-2xl font-black text-xs sm:text-sm transition-all focus:outline-none shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        creditHours !== null && ![2, 3, 4, 5, 6, 7, 8].includes(creditHours)
                          ? 'bg-[#0F2942] text-white border-2 border-[#0F2942] ring-2 ring-[#0F2942]/30 placeholder:text-slate-300'
                          : 'bg-white text-slate-950 border border-slate-300 hover:border-slate-400 focus:border-slate-900 placeholder:text-slate-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 👨‍🏫 القسم الثالث: الكادر التدريسي وتكليف الأساتذة */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
              <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-2xs">
                <Users className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-950">الكادر التدريسي وتكليف الأساتذة</h4>
                <p className="text-xs sm:text-sm font-black text-slate-950">تعيين أستاذ المحاضرات النظرية وأستاذ المختبر والتطبيقات</p>
              </div>
            </div>

            <div className={`grid grid-cols-1 ${courseType === 'theory_and_practical' ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-4 pt-1`}>
              
              {/* أستاذ النظري بقائمة تفاعلية فاخرة تفتح للأعلى وتمنع أي قص */}
              <div className="space-y-2 relative z-[999999]">
                <label className="block text-base font-black text-slate-950">أستاذ النظري (المحاضرات)</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTheoryTeacherDropdownOpen(!isTheoryTeacherDropdownOpen);
                      setIsPracticalTeacherDropdownOpen(false);
                      setIsDeptDropdownOpen(false);
                    }}
                    className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-950 font-black text-base focus:border-slate-900 focus:outline-none cursor-pointer shadow-2xs text-right flex items-center justify-between transition hover:border-slate-400"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <UserCheck className="w-5 h-5 text-blue-700 shrink-0" />
                      <span className="text-slate-950 font-black">
                        {deptTeachers.find((t) => t.id === theoryTeacherId)?.full_name || '-- اختياري: حدد أستاذ النظري --'}
                      </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-950 transition-transform duration-200 shrink-0 ${isTheoryTeacherDropdownOpen ? 'rotate-180 text-blue-700' : ''}`} />
                  </button>

                  {/* القائمة المنبثقة المخصصة لأستاذ النظري تفتح للأعلى بأمان كامل */}
                  {isTheoryTeacherDropdownOpen && (
                    <div className="absolute bottom-full right-0 left-0 mb-2 bg-white rounded-2xl shadow-2xl border border-slate-300 p-2 z-[999999] max-h-60 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setTheoryTeacherId('');
                          setIsTheoryTeacherDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                          !theoryTeacherId ? 'bg-slate-100 text-slate-950 font-black' : 'text-slate-950 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-slate-950 font-black">-- بدون تحديد أستاذ --</span>
                        {!theoryTeacherId && <Check className="w-4 h-4 text-slate-950" />}
                      </button>

                      {deptTeachers.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setTheoryTeacherId(t.id);
                            setIsTheoryTeacherDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                            theoryTeacherId === t.id
                              ? 'bg-[#0F2942] text-white shadow-xs'
                              : 'text-slate-950 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <UserCheck className={`w-4 h-4 ${theoryTeacherId === t.id ? 'text-cyan-300' : 'text-blue-700'}`} />
                            <span>{t.full_name}</span>
                          </div>
                          {theoryTeacherId === t.id && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* أستاذ العملي بقائمة تفاعلية فاخرة تفتح للأعلى وتمنع أي قص */}
              {courseType === 'theory_and_practical' && (
                <div className="space-y-2 relative z-[999999] animate-in fade-in duration-150">
                  <label className="block text-base font-black text-slate-950">أستاذ المختبر / العملي</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPracticalTeacherDropdownOpen(!isPracticalTeacherDropdownOpen);
                        setIsTheoryTeacherDropdownOpen(false);
                        setIsDeptDropdownOpen(false);
                      }}
                      className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-950 font-black text-base focus:border-slate-900 focus:outline-none cursor-pointer shadow-2xs text-right flex items-center justify-between transition hover:border-slate-400"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FlaskConical className="w-5 h-5 text-emerald-700 shrink-0" />
                        <span className="text-slate-950 font-black">
                          {deptTeachers.find((t) => t.id === practicalTeacherId)?.full_name || '-- اختياري: حدد أستاذ العملي --'}
                        </span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-950 transition-transform duration-200 shrink-0 ${isPracticalTeacherDropdownOpen ? 'rotate-180 text-emerald-700' : ''}`} />
                    </button>

                    {/* القائمة المنبثقة المخصصة لأستاذ العملي تفتح للأعلى بأمان كامل */}
                    {isPracticalTeacherDropdownOpen && (
                      <div className="absolute bottom-full right-0 left-0 mb-2 bg-white rounded-2xl shadow-2xl border border-slate-300 p-2 z-[999999] max-h-60 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            setPracticalTeacherId('');
                            setIsPracticalTeacherDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                            !practicalTeacherId ? 'bg-slate-100 text-slate-950 font-black' : 'text-slate-950 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-slate-950 font-black">-- بدون تحديد أستاذ --</span>
                          {!practicalTeacherId && <Check className="w-4 h-4 text-slate-950" />}
                        </button>

                        {deptTeachers.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setPracticalTeacherId(t.id);
                              setIsPracticalTeacherDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                              practicalTeacherId === t.id
                                ? 'bg-[#0F2942] text-white shadow-xs'
                                : 'text-slate-950 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <FlaskConical className={`w-4 h-4 ${practicalTeacherId === t.id ? 'text-emerald-300' : 'text-emerald-700'}`} />
                              <span>{t.full_name}</span>
                            </div>
                            {practicalTeacherId === t.id && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </FloatingCrudModal>

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
                      {course.theory_teacher_name ? (
                        <span className="font-black text-slate-900 inline-flex items-center gap-1.5 text-sm whitespace-nowrap">
                          <Users className="w-4 h-4 text-[#0F2942]" />
                          <span>{course.theory_teacher_name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold text-xs whitespace-nowrap">غير معين</span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {isPractical ? (
                        course.practical_teacher_name ? (
                          <span className="font-black text-slate-900 inline-flex items-center gap-1.5 text-sm whitespace-nowrap">
                            <FlaskConical className="w-4 h-4 text-emerald-700" />
                            <span>{course.practical_teacher_name}</span>
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold text-xs whitespace-nowrap">غير معين</span>
                        )
                      ) : (
                        <span className="text-slate-400 font-medium text-xs whitespace-nowrap">— نظري فقط</span>
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

      {/* 🎛️ المودال التقييمي للمسؤول العام الثابت والمركز */}
      {isAssessmentModalOpen && selectedCourseForAssessment && tempAssessmentScheme && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl flex flex-col relative overflow-hidden">
            
            {/* الهيدر الثابت */}
            <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-200 bg-white/95 shrink-0 z-10">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-950">
                  تخصيص توزيع أوزان الدرجات: {selectedCourseForAssessment.name} ({selectedCourseForAssessment.code})
                </h3>
                <p className="text-sm text-slate-950 font-black mt-0.5">قسم {selectedCourseForAssessment.department_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssessmentModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-black text-slate-950 cursor-pointer border border-slate-300"
              >
                ✕
              </button>
            </div>

            {/* محتوى الحقول القابل للتمرير داخلياً */}
            <div className="p-5 sm:p-7 overflow-y-auto flex-1 overscroll-contain space-y-4">
              {/* 🎨 شريط القوالب السريعة */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span>تطبيق قوالب التوزيع الجاهزة وفق دليل بولونيا:</span>
                  </span>
                  <span className="text-xs font-black text-slate-950">انقر للتعبئة الفورية</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTempAssessmentScheme(getDefaultAssessmentScheme('theory_and_practical'))}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-900 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <FlaskConical className="w-4 h-4 text-emerald-600" />
                    <span>القالب القياسي (عملي 10 + سعي 40 + نهائي 50)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempAssessmentScheme(getDefaultAssessmentScheme('theory_only'))}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-900 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>القالب النظري (نصفي 15 + تقرير 15 + سعي 20 + نهائي 50)</span>
                  </button>
                </div>
              </div>

              {/* شبكة بنود التقييم الـ 8 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[50vh] overflow-y-auto p-1">
                {(
                  [
                    { key: 'quiz1', defaultAr: 'كويز (1)', isPrac: false, roleText: 'خاص بأستاذ النظري' },
                    { key: 'quiz2', defaultAr: 'كويز (2)', isPrac: false, roleText: 'خاص بأستاذ النظري' },
                    { key: 'assignment1', defaultAr: 'واجب (1)', isPrac: false, roleText: 'خاص بأستاذ النظري' },
                    { key: 'assignment2', defaultAr: 'واجب (2)', isPrac: false, roleText: 'خاص بأستاذ النظري' },
                    { key: 'report', defaultAr: 'تقرير ونشاط', isPrac: false, roleText: 'خاص بأستاذ النظري' },
                    { key: 'midterm', defaultAr: 'امتحان نصفي', isPrac: false, roleText: 'خاص بأستاذ النظري' },
                    { key: 'practical', defaultAr: 'مختبر وعملي', isPrac: true, roleText: 'خاص بأستاذ العملي' },
                    { key: 'final_exam', defaultAr: 'امتحان نهائي', isPrac: false, roleText: 'الامتحان النهائي' },
                  ] as const
                ).map((item, idx) => {
                  const cfg = tempAssessmentScheme[item.key];
                  return (
                    <div 
                      key={item.key} 
                      className={`p-4 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md space-y-3 ${
                        item.isPrac 
                          ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/20' 
                          : item.key === 'final_exam'
                          ? 'bg-sky-50/60 border-sky-300 ring-1 ring-sky-400/30 md:col-span-2'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* ترويسة الكارد */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#0F2942] text-white font-black text-xs flex items-center justify-center shadow-xs">
                            {idx + 1}
                          </span>
                          <span className="font-black text-sm text-slate-950">
                            {item.key === 'final_exam' ? 'الامتحان النهائي' : item.isPrac ? 'بند التقييم العملي' : 'بند التقييم النظري'}
                          </span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                          item.isPrac 
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300 shadow-2xs' 
                            : item.key === 'final_exam' 
                            ? 'bg-sky-100 text-sky-950 border-sky-300 shadow-2xs' 
                            : 'bg-blue-50 text-blue-950 border-blue-200 shadow-2xs'
                        }`}>
                          {item.roleText}
                        </span>
                      </div>

                      {/* حقول الإدخال */}
                      <div className="grid grid-cols-12 gap-3 items-end">
                        {/* 📝 حقل العنوان الموحد */}
                        <div className="col-span-8 space-y-1">
                          <label className="block text-xs font-black text-slate-950">العنوان</label>
                          {/* 📝 حقل تعديل مسمى تقييم المادة مع تلميح رصاصي */}
                          <input
                            type="text" // 🔤 نوع الحقل نصي
                            value={cfg.title_ar} // 💾 قيمة العنوان بالعربية
                            onChange={(e) => { // 🔄 تحديث مسمى التقييم بالعربي والإنجليزي
                              const val = e.target.value;
                              setTempAssessmentScheme({
                                ...tempAssessmentScheme,
                                [item.key]: {
                                  ...cfg,
                                  title_ar: val,
                                  title_en: val,
                                },
                              });
                            }}
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-950 placeholder:text-slate-400 placeholder:font-medium focus:bg-white focus:border-[#0F2942] focus:outline-none transition shadow-2xs" // 🎨 تلميح رصاصي احترافي
                            placeholder={item.defaultAr} // 💡 المسمى الافتراضي كتلميح إرشادي
                          />
                        </div>

                        {/* 🏆 حقل الدرجة */}
                        <div className="col-span-4 space-y-1">
                          <label className="block text-xs font-black text-slate-950">الدرجة (Max)</label>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={50}
                              value={cfg.max_score}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setTempAssessmentScheme({
                                  ...tempAssessmentScheme,
                                  [item.key]: {
                                    ...cfg,
                                    max_score: val < 0 ? 0 : val,
                                  },
                                });
                              }}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-slate-950 text-center focus:bg-white focus:border-[#0F2942] focus:outline-none transition shadow-2xs font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* شريط التحقق من مجموع الأوزان (50 للسعي + 50 للنهائي = 100) */}
              {(() => {
                const cwSum = 
                  (tempAssessmentScheme.quiz1.max_score || 0) +
                  (tempAssessmentScheme.quiz2.max_score || 0) +
                  (tempAssessmentScheme.assignment1.max_score || 0) +
                  (tempAssessmentScheme.assignment2.max_score || 0) +
                  (tempAssessmentScheme.report.max_score || 0) +
                  (tempAssessmentScheme.midterm.max_score || 0) +
                  (tempAssessmentScheme.practical.max_score || 0);

                const finalScore = tempAssessmentScheme.final_exam.max_score || 0;
                const totalScore = cwSum + finalScore;
                const isValid = cwSum === 50 && finalScore === 50;

                return (
                  <div className={`p-4 rounded-2xl border-2 transition-all space-y-2 ${
                    isValid ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs' : 'bg-rose-50 border-rose-400 text-rose-950 shadow-xs'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {isValid ? (
                          <div className="p-1.5 bg-emerald-600 text-white rounded-xl shadow-2xs">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="p-1.5 bg-rose-600 text-white rounded-xl shadow-2xs">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <span className="font-black text-sm block">
                            {isValid 
                              ? 'التوزيع الأكاديمي مطابق تماماً لمعايير مسار بولونيا (سعي 50 + نهائي 50 = 100)'
                              : `تنبيه: مجموع بنود السعي يجب أن يكون 50 بالضبط (الحالي: ${cwSum}) والنهائي 50 (الحالي: ${finalScore})`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm font-black shrink-0">
                        <span className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl shadow-2xs">السعي: {cwSum}/50</span>
                        <span className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl shadow-2xs">النهائي: {finalScore}/50</span>
                        <span className={`px-3 py-1.5 rounded-xl text-white shadow-2xs font-black ${isValid ? 'bg-emerald-700' : 'bg-rose-700'}`}>
                          المجموع: {totalScore}/100
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* الفوتر الثابت في أسفل الكارد */}
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/95 shrink-0 z-10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAssessmentModalOpen(false)}
                className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-950 hover:bg-slate-100 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveAssessmentSchemeModal}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black shadow-md cursor-pointer border border-[#163a5f]"
              >
                حفظ التوزيع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ℹ️ نافذة تعليمات وضوابط استيراد ملف Excel للمواد لكافة أقسام الجامعة */}
      {showExcelInstructions && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
                  <BookOpen className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">تعليمات وضوابط استيراد المواد والمناهج الأكاديمية</h3>
                  <p className="text-sm font-black text-slate-950 mt-0.5">جامعة الإمام جعفر الصادق (ع) - فرع ميسان | المنظومة المركزية</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExcelInstructions(false)}
                className="p-2 text-slate-950 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 text-base font-black text-slate-950 leading-relaxed max-h-[60vh] overflow-y-auto pl-1">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>1. اسم المادة الدراسية بالعربية *:</span>
                </div>
                <p className="text-sm text-slate-950 font-black mr-7">
                  حقل إلزامي. اكتب اسم المادة الرسمي بالعربية (مثال: البرمجة كائنية التوجه، تراكيب البيانات).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>2. القسم العلمي التابع له *:</span>
                </div>
                <p className="text-sm text-slate-950 font-black mr-7">
                  حقل إلزامي. اكتب اسم القسم العلمي المطابق للأقسام المعتمدة بالجامعة (من ورقة قائمة_الأقسام_المعتمدة).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>3. رمز المادة (الكود الأكاديمي):</span>
                </div>
                <p className="text-sm text-slate-950 font-black mr-7">
                  اختياري (مثال: CS201). في حال تركه فارغاً سيقوم النظام بتوليد رمز أكاديمي نظامي تلقائياً.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>4. المرحلة الدراسية والكورس *:</span>
                </div>
                <p className="text-sm text-slate-950 font-black mr-7">
                  اكتب رقم المرحلة من (1) إلى (4)، ورقم الكورس (1) للكورس الأول أو (2) للكورس الثاني.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>5. نوع المادة والساعات ECTS *:</span>
                </div>
                <p className="text-sm text-slate-950 font-black mr-7">
                  اكتب (نظري وعملي) للمواد التي تشمل مختبر، أو (نظري فقط). واكتب ساعات الـ ECTS من 1 إلى 15 (الافتراضي 3).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl text-base transition flex items-center gap-2 cursor-pointer border border-slate-300"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>تنزيل النموذج المعتمد</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExcelInstructions(false)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#163a5f]"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 نافذة تقرير نتائج استيراد Excel للمواد (المقبول والمكرر والمرفوض) */}
      {importReport && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-right max-h-[90vh] overflow-y-auto">
            
            {/* عنوان التقرير */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
                  <FileSpreadsheet className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950">
                    تقرير نتائج استيراد المواد والمناهج ({importReport.totalRows} صف تمت معالجته)
                  </h3>
                  <p className="text-sm font-black text-slate-950">
                    تم فحص أسماء المواد والأقسام العلمية والتحقق الصارم من عدم التكرار
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setImportReport(null)}
                className="p-2 text-slate-950 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* بطاقات الإحصائيات السريعة الثلاث */}
            <div className="grid grid-cols-3 gap-3">
              
              {/* المقبول */}
              <button
                type="button"
                onClick={() => setActiveReportTab('accepted')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  activeReportTab === 'accepted'
                    ? 'bg-emerald-100 border-emerald-500 shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-emerald-950">المقبول والمضاف</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-2xl font-black text-emerald-950 mt-1">
                  {importReport.accepted.length}
                </div>
              </button>

              {/* المكرر */}
              <button
                type="button"
                onClick={() => setActiveReportTab('duplicates')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  activeReportTab === 'duplicates'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المكرر (المستبعد)</span>
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {importReport.duplicates.length}
                </div>
              </button>

              {/* المرفوض */}
              <button
                type="button"
                onClick={() => setActiveReportTab('rejected')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  activeReportTab === 'rejected'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المرفوض (بيانات ناقصة)</span>
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {importReport.rejected.length}
                </div>
              </button>

            </div>

            {/* تفاصيل التبويب النشط */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-2">
              
              {activeReportTab === 'accepted' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>قائمة المواد التي تم قبولها وإضافتها بنجاح:</span>
                  </h4>
                  {importReport.accepted.length === 0 ? (
                    <p className="text-sm text-slate-950 font-black py-2">لا يوجد صفوف مقبولة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.accepted.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-950 font-black">{item.name}</span>
                            <span className="text-slate-950 font-black mx-1.5">•</span>
                            <span className="text-slate-950 font-black">{item.dept}</span>
                          </div>
                          <span className="text-blue-950 bg-blue-100 px-2 py-0.5 rounded border border-blue-200 font-mono text-xs" dir="ltr">
                            {item.code}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeReportTab === 'duplicates' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                    <span>قائمة المواد المكررة المستبعدة لوجودها مسبقاً في القسم:</span>
                  </h4>
                  {importReport.duplicates.length === 0 ? (
                    <p className="text-sm text-slate-950 font-black py-2">رائع! لم يتم رصد أي مواد مكررة في الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.duplicates.map((item, idx) => (
                        <div key={idx} className="py-2.5 space-y-1 text-sm font-black">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-950 font-black">{item.name} ({item.dept})</span>
                            <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs">
                              تم منعها منعاً للتكرار
                            </span>
                          </div>
                          <p className="text-xs text-rose-900 font-bold">
                            السبب: {item.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeReportTab === 'rejected' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                    <span>قائمة الصفوف المرفوضة لعدم صلاحية أو اكتمال البيانات:</span>
                  </h4>
                  {importReport.rejected.length === 0 ? (
                    <p className="text-sm text-slate-950 font-black py-2">لا يوجد أي صفوف مرفوضة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.rejected.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-950 font-black">الصف {item.rowNumber}:</span>
                            <span className="text-slate-950 font-black mx-1.5">{item.rawName}</span>
                          </div>
                          <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs font-bold">
                            {item.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* زر الإغلاق */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setImportReport(null)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#163a5f]"
              >
                إغلاق التقرير
              </button>
            </div>

          </div>
        </div>
      )}

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
