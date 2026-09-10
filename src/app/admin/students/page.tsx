'use client'; // ⚡ ينفذ بالعميل

//  صفحة إدارة حسابات وجداول الطلاب المتقدمة للأدمن - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect, useMemo, useRef } from 'react'; // 🔗 رياكت
import { createPortal } from 'react-dom'; // 🚪 بورتال لرسم النوافذ في قمة المستند
import Image from 'next/image'; // 🖼️ صور
import { useRouter } from 'next/navigation'; // 🛣️ موجه المسارات
import { 
  getCurrentSessionUser, 
  syncAcademicYearFromSupabase, 
  subscribeToAcademicYearChanges,
  saveProfileToSupabase,
  deleteProfileFromSupabase,
  syncProfilesFromSupabase,
  syncDepartmentsFromSupabase,
  syncCoursesFromSupabase,
  syncGradesFromSupabase
} from '@/lib/supabase-client'; // 🔌 فحص الجلسة والمزامنة السحابية المباشرة
import { UserProfile, Department, Course, Grade } from '@/types'; // 🔗 الأنواع
import { getStoredData, saveStoredData, INITIAL_PROFILES, INITIAL_DEPARTMENTS, INITIAL_COURSES, INITIAL_GRADES, generateStrongUniqueEmail, generateStrongPassword, getAcademicYear, formatAcademicYearDisplay } from '@/lib/mock-data'; // 💾 البيانات
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 المودال العائم
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'; // 🗑️ كارد الحذف الاحترافي الفاخر
import { AcademicPasswordStrengthBox } from '@/components/AcademicPasswordStrengthBox'; // 🛡️ صندوق معايير كلمة المرور الموحد
import { PrintFilterDropdown, PrintFilterOption } from '@/components/PrintFilterDropdown'; // 🖨️ مكون القوائم المنسدلة الاحترافية لفلاتر الطباعة
import { downloadAdminStudentsTemplate, download50RandomAccountsTemplate, parseExcelFile, exportCustomStudentsList } from '@/lib/excel-utils'; // 📥 📤 الاكسل
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 أسماء المراحل العربية الكلمية
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧮 التعرف الذكي على جنس الطالب
import { 
  checkEmailUniquenessAcrossSystem, 
  detectDuplicateEmails, 
  resolveDuplicateEmailsInProfiles 
} from '@/lib/validation-utils'; // 🛡️ محرك فحص فرادة البريد ومنع التكرار الأكاديمي
import { 
  GraduationCap, 
  Download, 
  Upload, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Filter, 
  Users, 
  UserCheck,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  SlidersHorizontal,
  Clock,
  Printer,
  Mail,
  KeyRound,
  Globe,
  Award,
  User,
  Building2,
  RefreshCw,
  X,
  AlertCircle,
  FileSpreadsheet,
  AlertTriangle,
  Key,
  ShieldCheck,
  ChevronDown,
  Eye,
  EyeOff,
  Check
} from 'lucide-react'; // 🎨 الأيقونات

export default function AdminStudentsPage() {
  const router = useRouter();
  // 📌 📊 حالات البيانات المحلية
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [academicYear, setAcademicYear] = useState<string>(() => getAcademicYear());

  // 📊 نافذة تقرير نتائج استيراد ملف Excel للطلاب
  const [importReport, setImportReport] = useState<{
    totalRows: number;
    accepted: { name: string; dept: string; stage: number; uniNum: string }[];
    duplicates: { name: string; uniNum: string; dept: string; reason: string }[];
    rejected: { rowNumber: number; rawName: string; reason: string }[];
  } | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<'accepted' | 'duplicates' | 'rejected'>('accepted');

  // 📌 📊 حالات البحث والتصفية والفرز والصفحات
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedStageFilter, setSelectedStageFilter] = useState('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<'ALL' | 'male' | 'female'>('ALL');
  const [sortBy, setSortBy] = useState<'custom' | 'newest' | 'oldest' | 'name' | 'uni_num' | 'dept' | 'stage'>('custom');
  
  // 📖 نظام الصفحات (Pagination System)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 🖨️ حالات طباعة بطاقات اعتماد الطلبة (10 بطاقات بالورقة الواحدة A4)
  const [showStudentPrintModal, setShowStudentPrintModal] = useState<boolean>(false);
  const [singleStudentPrintProfile, setSingleStudentPrintProfile] = useState<UserProfile | null>(null);
  const [studentPrintStageFilter, setStudentPrintStageFilter] = useState<number | 'all'>('all');
  const [studentPrintStudyFilter, setStudentPrintStudyFilter] = useState<'all' | 'morning' | 'evening'>('all');
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (showStudentPrintModal) {
      document.body.classList.add('print-modal-active');
    } else {
      document.body.classList.remove('print-modal-active');
    }
    return () => {
      document.body.classList.remove('print-modal-active');
    };
  }, [showStudentPrintModal]);

  // 📌 حالات المودالات العائمة والتنبيهات
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<UserProfile | null>(null);
  const [successMsg, setSuccessMsg] = useState(''); // ⚠️ رسائل التنبيه والنجاح
  const [warningError, setWarningError] = useState(''); // ⚠️ رسالة الخطأ لإضافة طالب
  const [editWarningError, setEditWarningError] = useState(''); // ⚠️ رسالة الخطأ لتعديل طالب

  // 🔘 حالات نظام التحديد المتعدد لطلاب الكلية
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  // 📌 حقول نموذج الإضافة
  const [addFullName, setAddFullName] = useState('');
  const [addGender, setAddGender] = useState<'male' | 'female' | null>(null); // 🚹🚺 الجنس غير محدد افتراضياً
  const [addDeptId, setAddDeptId] = useState('');
  const [addStageNum, setAddStageNum] = useState<number | null>(null); // 🎓 المرحلة غير محددة افتراضياً
  const [customStudentEmail, setCustomStudentEmail] = useState('');
  const [customStudentPassword, setCustomStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState<boolean>(false); // 👁️ إظهار أو إخفاء الرمز السري للطالب بنجوم أو نص صريح

  // 📌 حقول نموذج التعديل
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female'>('male');
  const [editDeptId, setEditDeptId] = useState('');
  const [editStageNum, setEditStageNum] = useState<number>(1);

  // 🔽 حالات ومراجع القوائم المنسدلة المخصصة
  const [isFilterDeptDropdownOpen, setIsFilterDeptDropdownOpen] = useState<boolean>(false);
  const [isAddDeptDropdownOpen, setIsAddDeptDropdownOpen] = useState<boolean>(false);
  const [isAddStageDropdownOpen, setIsAddStageDropdownOpen] = useState<boolean>(false);
  const [isEditDeptDropdownOpen, setIsEditDeptDropdownOpen] = useState<boolean>(false);
  const [isEditStageDropdownOpen, setIsEditStageDropdownOpen] = useState<boolean>(false);

  const filterDeptDropdownRef = useRef<HTMLDivElement>(null);
  const addDeptDropdownRef = useRef<HTMLDivElement>(null);
  const addStageDropdownRef = useRef<HTMLDivElement>(null);
  const editDeptDropdownRef = useRef<HTMLDivElement>(null);
  const editStageDropdownRef = useRef<HTMLDivElement>(null);

  // 🖱️ إغلاق القوائم المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (filterDeptDropdownRef.current && !filterDeptDropdownRef.current.contains(target)) {
        setIsFilterDeptDropdownOpen(false);
      }
      if (addDeptDropdownRef.current && !addDeptDropdownRef.current.contains(target)) {
        setIsAddDeptDropdownOpen(false);
      }
      if (addStageDropdownRef.current && !addStageDropdownRef.current.contains(target)) {
        setIsAddStageDropdownOpen(false);
      }
      if (editDeptDropdownRef.current && !editDeptDropdownRef.current.contains(target)) {
        setIsEditDeptDropdownOpen(false);
      }
      if (editStageDropdownRef.current && !editStageDropdownRef.current.contains(target)) {
        setIsEditStageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 🛡️ شروط ومعايير كلمة المرور الأكاديمية
  const hasMinLength = (pwd: string) => pwd.length >= 8;
  const hasUpper = (pwd: string) => /[A-Z]/.test(pwd);
  const hasNumber = (pwd: string) => /[0-9]/.test(pwd);
  const hasSpecial = (pwd: string) => /[^A-Za-z0-9]/.test(pwd);

  const calculatePasswordStrength = (pwd: string): number => {
    if (!pwd) return 0;
    let score = 0;
    if (hasMinLength(pwd)) score += 25;
    if (hasUpper(pwd)) score += 25;
    if (hasNumber(pwd)) score += 25;
    if (hasSpecial(pwd)) score += 25;
    return score;
  };

  const passwordStrengthScore = calculatePasswordStrength(customStudentPassword);
  const editPasswordStrengthScore = calculatePasswordStrength(editPassword);

  // 🔄 فحص الجلسة وتحميل البيانات الأكاديمية الأولية والسنة الدراسية
  useEffect(() => {
    const user = getCurrentSessionUser();
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin' && user.role !== 'department_head' && user.role !== 'rapporteur')) {
      router.push('/admin');
      return;
    }
    const profs = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const depts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS);
    const crss = getStoredData<Course[]>('courses', INITIAL_COURSES);
    const grds = getStoredData<Grade[]>('grades', INITIAL_GRADES);

    setProfiles(profs);
    setDepartments(depts);
    setCourses(crss);
    setGrades(grds);
    setAcademicYear(getAcademicYear());

    // ☁️ مزامنة العام الدراسي مع Supabase
    if (typeof syncAcademicYearFromSupabase === 'function') {
      syncAcademicYearFromSupabase().then((yr) => {
        if (yr) setAcademicYear(yr);
      }).catch(() => {});
    }

    // 📡 الاشتراك بالبث اللحظي للعام الدراسي
    let unsubscribeYear: (() => void) | undefined;
    if (typeof subscribeToAcademicYearChanges === 'function') {
      unsubscribeYear = subscribeToAcademicYearChanges((liveYear) => {
        setAcademicYear(liveYear);
      });
    }
    
    if (user.department_id) {
      setAddDeptId(user.department_id);
      setSelectedDeptFilter(user.department_id);
    } else if (depts.length > 0) {
      setAddDeptId(depts[0].id);
    }

    // ☁️ المزامنة اللحظية الحية مع Supabase لكافة بيانات الطلاب
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

    return () => {
      if (unsubscribeYear) unsubscribeYear();
    };
  }, [router]);

  // ➕ إضافة طالب جديد مع الفحص الشامل
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setWarningError('');

    if (!addFullName.trim()) {
      setWarningError('يرجى كتابة الاسم الثلاثي للطالب بشكل صريح.');
      return;
    }

    // 🛡️ فحص المرحلة الدراسية والتأكد من تحديدها
    if (!addStageNum) {
      setWarningError('يرجى اختيار المرحلة الدراسية للطالب أولاً.');
      return;
    }

    // 🛡️ فحص جنس الطالب والتأكد من تحديده
    if (!addGender) {
      setWarningError('يرجى تحديد جنس الطالب (ذكر أو أنثى).');
      return;
    }

    const dept = departments.find((d) => d.id === addDeptId); // 🏢 مطابقة القسم المختار
    const finalEmail = customStudentEmail.trim() || generateStrongUniqueEmail('st', profiles); // ✉️ اعتماد البريد المدخل أو توليد فريد
    
    // 🛡️ فحص فرادة البريد الأكاديمي الصارم ومنع التكرار نهائياً
    const emailCheck = checkEmailUniquenessAcrossSystem(finalEmail, undefined, profiles); // 🔍 فحص البريد بالنظام
    if (!emailCheck.isUnique) { // ⚠️ إذا كان البريد مستخدم مسبقاً
      setWarningError(emailCheck.errorMessage || 'البريد الإلكتروني مسجل مسبقاً في النظام. يرجى استخدام بريد آخر.'); // 💬 عرض رسالة الرفض
      return; // 🚫 إيقاف الحفظ فوراً
    }

    const finalPassword = customStudentPassword.trim() || generateStrongPassword(); // 🔑 كلمة المرور
    // 🎓 توليد رقم جامعي رسمي يبدأ بعام 2026
    const generatedUniNum = `2026${Math.floor(10000 + Math.random() * 90000)}`;

    const newStudent: UserProfile = {
      id: `usr-st-${Date.now()}`,
      full_name: addFullName.trim(),
      role: 'student',
      gender: addGender,
      department_id: addDeptId,
      department_name: dept?.name || 'قسم أكاديمي',
      stage_number: Number(addStageNum),
      university_number: generatedUniNum,
      generated_email: finalEmail,
      temp_password: finalPassword,
      is_active: true,
      must_change_password: false,
      created_at: new Date().toISOString(),
      order_index: 0,
    };

    // ⬆️ وضع الطالب الجديد في بداية القائمة فوراً
    const updatedProfiles = [newStudent, ...profiles.map((p, idx) => ({ ...p, order_index: idx + 1 }))];
    setProfiles(updatedProfiles);
    saveStoredData('profiles', updatedProfiles);
    saveProfileToSupabase(newStudent); // ☁️ رفع حساب الطالب الجديد إلى Supabase فوراً
    setSortBy('custom');

    setShowAddModal(false);
    setAddFullName('');
    setCustomStudentEmail('');
    setCustomStudentPassword('');
    setAddGender(null); // 🔄 تصفير الجنس ليكون غير محدد
    setAddStageNum(null); // 🔄 تصفير المرحلة لتكون غير محددة
    setSuccessMsg(`تم إضافة الطالب (${newStudent.full_name}) وتوليد البريد الأكاديمي (${finalEmail}) بنجاح ووضعه في بداية القائمة!`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // 🔀 دالة تغيير ترتيب الطالب يدوياً (تقديم وتأخير ⬆️ ⬇️)
  const handleMoveStudent = (currentIndex: number, direction: 'up' | 'down', currentList: UserProfile[], e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    const listCopy = [...currentList];
    const itemToMove = listCopy[currentIndex];
    listCopy[currentIndex] = listCopy[targetIndex];
    listCopy[targetIndex] = itemToMove;

    const targetIds = new Set(listCopy.map(p => p.id));
    const otherProfiles = profiles.filter(p => !targetIds.has(p.id));
    const reindexedList = listCopy.map((p, idx) => ({ ...p, order_index: idx }));
    const combined = [...reindexedList, ...otherProfiles];

    setProfiles(combined);
    saveStoredData('profiles', combined);
    setSortBy('custom');
    setSuccessMsg(`تم تغيير ترتيب الطالب (${itemToMove.full_name}) بنجاح!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ✏️ تعديل بيانات طالب
  const handleEditStudentSubmit = (e: React.FormEvent) => { // ⚡ دالة حفظ تعديل الطالب
    e.preventDefault(); // 🛑 منع إعادة تحميل الصفحة
    if (!editingStudent) return; // 🚫 تأكيد وجود طالب قيد التعديل
    setEditWarningError(''); // 🧹 تصفير رسائل الخطأ

    // 🛡️ فحص فرادة البريد الأكاديمي بالتعديل ومنع التكرار
    if (editEmail.trim()) { // 🔍 إذا تم إدخال بريد للتعديل
      const emailCheck = checkEmailUniquenessAcrossSystem(editEmail.trim(), editingStudent.id, profiles); // 🔍 فحص البريد باستثناء الطالب نفسه
      if (!emailCheck.isUnique) { // ⚠️ إذا كان البريد مأخوذ من طالب أو أستاذ ثاني
        setEditWarningError(emailCheck.errorMessage || 'البريد الإلكتروني مسجل مسبقاً لمستخدم آخر. يرجى إدخال بريد آخر.'); // 💬 رسالة الخطأ
        return; // 🚫 رفض الحفظ
      }
    }

    const dept = departments.find((d) => d.id === editDeptId);
    const updatedProfiles = profiles.map((p) => {
      if (p.id === editingStudent.id) {
        return {
          ...p,
          full_name: editName.trim(),
          gender: editGender,
          generated_email: editEmail.trim(),
          temp_password: editPassword.trim() || p.temp_password || 'Sadiq#Student2026!',
          department_id: editDeptId,
          department_name: dept?.name || p.department_name,
          stage_number: Number(editStageNum),
        };
      }
      return p;
    });

    setProfiles(updatedProfiles);
    saveStoredData('profiles', updatedProfiles);
    const updatedStudent = updatedProfiles.find((p) => p.id === editingStudent.id);
    if (updatedStudent) {
      saveProfileToSupabase(updatedStudent); // ☁️ تحديث بيانات الطالب في Supabase
    }
    setEditingStudent(null);
    setSuccessMsg('تم تحديث بيانات الطالب وحفظها بقاعدة البيانات الموحدة بنجاح!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // 🔧 دالة المعالجة التلقائية لكافة الحسابات المكررة وتوليد بريد أكاديمي فريد
  const handleFixDuplicateEmails = () => {
    const { updatedProfiles, fixedCount, fixedDetails } = resolveDuplicateEmailsInProfiles(profiles);
    if (fixedCount > 0) {
      setProfiles(updatedProfiles);
      saveStoredData('profiles', updatedProfiles);
      // ☁️ مزامنة الحسابات المصححة مع سوبابيز
      fixedDetails.forEach((detail) => {
        const found = updatedProfiles.find((p) => p.full_name === detail.name);
        if (found) saveProfileToSupabase(found);
      });
      setSuccessMsg(`تم بنجاح تصحيح (${fixedCount}) حسابات وفصل البريد الأكاديمي المكرر وتوليد بريد فريد جديد!`);
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  // 🗑️ حذف طالب
  const handleConfirmDelete = () => {
    if (!deletingStudent) return;
    const updatedProfiles = profiles.filter((p) => p.id !== deletingStudent.id);
    setProfiles(updatedProfiles);
    saveStoredData('profiles', updatedProfiles);
    deleteProfileFromSupabase(deletingStudent.id, 'student'); // ☁️ حذف حساب الطالب من Supabase
    setDeletingStudent(null);
    setSuccessMsg('تم حذف حساب الطالب نهائياً من قاعدة البيانات الأكاديمية.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // 🔘 دوال نظام التحديد والإجراءات الجماعية لطلاب الكلية
  const toggleSelectAll = (list: UserProfile[]) => {
    if (selectedStudentIds.length === list.length && list.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(list.map((s) => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const confirmBulkDeleteStudents = () => {
    const count = selectedStudentIds.length;
    if (count === 0) return;

    const updatedProfiles = profiles.filter((p) => !selectedStudentIds.includes(p.id));
    const updatedGrades = grades.filter((g) => !selectedStudentIds.includes(g.student_id));
    setProfiles(updatedProfiles);
    setGrades(updatedGrades);
    saveStoredData('profiles', updatedProfiles);
    saveStoredData('grades', updatedGrades);
    selectedStudentIds.forEach((id) => deleteProfileFromSupabase(id, 'student')); // ☁️ حذف الطلبة المحددين من Supabase
    setSelectedStudentIds([]);
    setIsBulkDeleting(false);
    setSuccessMsg(`تم حذف (${count}) من طلاب الكلية بنجاح.`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleBulkExportExcel = async (list: UserProfile[]) => {
    const selectedStudentsList = list.filter((s) => selectedStudentIds.includes(s.id));
    if (selectedStudentsList.length === 0) return;

    await exportCustomStudentsList(selectedStudentsList, 'كلية_ميسان');
    setSuccessMsg(`تم تصدير (${selectedStudentsList.length}) طالب إلى ملف Excel بنجاح! 📊`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // 📥 استيراد ملف Excel مع منع التكرار الصارم وتقرير النتائج الشامل
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      if (data.length === 0) {
        setWarningError('ملف Excel فارغ أو لا يحتوي على صفوف بيانات صالحة!');
        setTimeout(() => setWarningError(''), 4000);
        return;
      }

      const acceptedList: { name: string; dept: string; stage: number; uniNum: string }[] = [];
      const duplicateList: { name: string; uniNum: string; dept: string; reason: string }[] = [];
      const rejectedList: { rowNumber: number; rawName: string; reason: string }[] = [];

      const importedStudents: UserProfile[] = [];
      const existingEmails = new Set(profiles.map((p) => (p.generated_email || '').toLowerCase().trim()));
      const existingUniNums = new Set(profiles.map((p) => p.university_number));

      let rowIdx = 1;
      data.forEach((row) => {
        rowIdx++;
        const name = String(
          row['الاسم الثلاثي واللقب للطالب'] || 
          row['الاسم الكامل'] || 
          row['اسم الطالب'] || 
          row['الاسم المقترح'] || 
          ''
        ).trim();

        // 1️⃣ فحص الاسم الفارغ
        if (!name) {
          rejectedList.push({
            rowNumber: rowIdx,
            rawName: '— (حقل فارغ)',
            reason: 'حقل الاسم الثلاثي واللقب فارغ في هذا الصف',
          });
          return;
        }

        const rawDept = String(row['القسم العلمي التابع له'] || row['القسم العلمي'] || row['القسم'] || '').trim();
        let matchedDept = departments.find((d) => d.name.trim() === rawDept);
        if (!matchedDept && rawDept) {
          matchedDept = departments.find((d) => d.name.includes(rawDept) || rawDept.includes(d.name));
        }

        if (!matchedDept && rawDept) {
          rejectedList.push({
            rowNumber: rowIdx,
            rawName: name,
            reason: `القسم (${rawDept}) غير مسجل في قائمة الأقسام الرسمية`,
          });
          return;
        }

        const deptId = matchedDept ? matchedDept.id : (departments[0]?.id || 'dept-1');
        const deptName = matchedDept ? matchedDept.name : (departments[0]?.name || 'هندسة تقنيات الحاسوب');
        const stageNum = Number(row['المرحلة الدراسية (1-4)'] || row['المرحلة الدراسية'] || row['رقم المرحلة'] || 1);

        let uniNum = String(row['الرقم الجامعي (اختياري)'] || row['الرقم الجامعي'] || row['الرقم الجامعي المولّد'] || '').trim();
        
        // 2️⃣ فحص تكرار الرقم الجامعي إذا تم كتابته يدوياً
        if (uniNum && existingUniNums.has(uniNum)) {
          duplicateList.push({
            name,
            uniNum,
            dept: deptName,
            reason: 'الرقم الجامعي مسجل مسبقاً لطالب آخر في النظام أو مكرر بالملف',
          });
          return; // 🚫 منع التكرار نهائياً
        }

        // 3️⃣ فحص تكرار اسم الطالب في نفس القسم والمرحلة
        const isDuplicateStudent = profiles.some(
          (p) => p.full_name.trim() === name && p.department_id === deptId && p.stage_number === stageNum && p.role === 'student'
        ) || importedStudents.some(
          (p) => p.full_name.trim() === name && p.department_id === deptId && p.stage_number === stageNum && p.role === 'student'
        );

        if (isDuplicateStudent) {
          duplicateList.push({
            name,
            uniNum: uniNum || '—',
            dept: `${deptName} - مرحلة ${stageNum}`,
            reason: 'الطالب مسجل مسبقاً في نفس القسم والمرحلة الدراسية',
          });
          return; // 🚫 منع التكرار نهائياً
        }

        if (!uniNum) {
          do {
            // 🎓 توليد رقم جامعي يبدأ بعام 2026
            uniNum = `2026${Math.floor(10000 + Math.random() * 90000)}`;
          } while (existingUniNums.has(uniNum));
        }
        existingUniNums.add(uniNum);

        let email = String(row['البريد الأكاديمي'] || row['البريد العشوائي الفريد'] || row['البريد'] || '').trim().toLowerCase();
        if (!email || existingEmails.has(email)) {
          email = generateStrongUniqueEmail('st', [...profiles, ...importedStudents]);
        }
        existingEmails.add(email);

        // 👥 التعرف على الجنس
        let rowGender: 'male' | 'female' = detectArabicGender(name);
        const rawGenderVal = String(row['الجنس'] || row['الجنس (ذكر / أنثى)'] || row['gender'] || '').trim();
        if (rawGenderVal.includes('أنثى') || rawGenderVal.includes('انثى') || rawGenderVal.toLowerCase() === 'female') {
          rowGender = 'female';
        } else if (rawGenderVal.includes('ذكر') || rawGenderVal.toLowerCase() === 'male') {
          rowGender = 'male';
        }

        const newProfile: UserProfile = {
          id: `usr-imp-${Date.now()}-${rowIdx}-${Math.random().toString(36).substring(2, 6)}`,
          full_name: name,
          role: 'student',
          gender: rowGender,
          department_id: deptId,
          department_name: deptName,
          stage_number: stageNum,
          university_number: uniNum,
          generated_email: email,
          temp_password: 'N/A',
          is_active: true,
          must_change_password: false,
          created_at: new Date().toISOString(),
          order_index: 0,
        };

        importedStudents.push(newProfile);
        acceptedList.push({
          name,
          dept: deptName,
          stage: stageNum,
          uniNum,
        });
      });

      if (importedStudents.length > 0) {
        const combined = [...importedStudents, ...profiles];
        setProfiles(combined);
        saveStoredData('profiles', combined);
        importedStudents.forEach((s) => saveProfileToSupabase(s)); // ☁️ حفظ الطلبة المستوردين في Supabase
        setSuccessMsg(`🎉 تم استيراد (${importedStudents.length}) طالب بنجاح ووضعهم في بداية القائمة!`);
      }

      // 📇 عرض نافذة التقرير الشامل
      setImportReport({
        totalRows: data.length,
        accepted: acceptedList,
        duplicates: duplicateList,
        rejected: rejectedList,
      });

      if (acceptedList.length > 0) {
        setActiveReportTab('accepted');
      } else if (duplicateList.length > 0) {
        setActiveReportTab('duplicates');
      } else {
        setActiveReportTab('rejected');
      }

      setTimeout(() => setSuccessMsg(''), 5000);
    } catch {
      setWarningError('حدث خطأ أثناء قراءة ملف الاكسل. يرجى التثبت من صيغة البيانات.');
      setTimeout(() => setWarningError(''), 4000);
    } finally {
      e.target.value = '';
    }
  };

  // 🔍 📊 تصفية وفرز قائمة الطلاب
  const allStudents = profiles.filter((p) => p.role === 'student');
  const filteredStudents = allStudents.filter((std) => {
    const matchesSearch =
      std.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.university_number.includes(searchTerm) ||
      std.generated_email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDeptFilter === 'ALL' || std.department_id === selectedDeptFilter;
    const matchesStage = selectedStageFilter === 'ALL' || String(std.stage_number) === selectedStageFilter;
    const matchesGender = selectedGenderFilter === 'ALL' || std.gender === selectedGenderFilter;

    return matchesSearch && matchesDept && matchesStage && matchesGender;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    if (sortBy === 'name') return a.full_name.localeCompare(b.full_name, 'ar');
    if (sortBy === 'uni_num') return a.university_number.localeCompare(b.university_number);
    if (sortBy === 'stage') return (a.stage_number || 1) - (b.stage_number || 1);
    if (sortBy === 'dept') return (a.department_name || '').localeCompare(b.department_name || '', 'ar');
    return 0;
  });

  // 📖 حساب الصفحات (Pagination logic)
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 font-sans w-full max-w-[1900px] mx-auto px-2 sm:px-4 py-4">
      
      {/* 🏛️ الهيدر الرئيسي لإدارة الطلاب بالسنة الدراسية بحدود ناعمة */}
      <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
            <Image src="/logo.webp" alt="جامعة الصادق فرع ميسان" fill className="object-contain" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-slate-950" />
              <span>إدارة حسابات وجداول الطلاب</span>
            </h1>
            <p className="text-sm font-black sm:text-sm text-slate-950 font-black mt-1">
              جامعة الإمام جعفر الصادق (ع) - فرع ميسان | إدارة البيانات الرسمية والمقاعد الأكاديمية
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm font-black text-slate-950 font-black">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-950 border border-indigo-200 font-black text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                <Calendar className="w-4 h-4 text-indigo-700" />
                <span>السنة الدراسية: <bdi dir="ltr">{formatAcademicYearDisplay(academicYear)}</bdi></span>
              </span>
            </div>
          </div>
        </div>

        {/* 🔘 أزرار العمليات الرئيسية */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setAddGender(null); // 🚹🚺 تصفير الجنس ليكون غير محدد
              setAddStageNum(null); // 🎓 تصفير المرحلة لتكون غير محددة
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-sm font-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer border border-[#1e4570]"
          >
            <Plus className="w-4 h-4" />
            إضافة طالب جديد
          </button>

          <button
            type="button"
            onClick={() => {
              setSingleStudentPrintProfile(null);
              setStudentPrintStageFilter(selectedStageFilter === 'ALL' ? 'all' : Number(selectedStageFilter));
              setStudentPrintStudyFilter('all');
              setShowStudentPrintModal(true);
            }}
            className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-sm font-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer border border-[#1e4570] active:scale-95"
            title="طباعة بطاقات اعتماد الطلبة (8 بالورقة الواحدة A4)"
          >
            <Printer className="w-4 h-4 text-cyan-300" />
            <span>طباعة بطاقات الطلبة (8 بالورقة)</span>
          </button>

          <button
            onClick={() => downloadAdminStudentsTemplate(departments[0]?.name)}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-950 border border-slate-300 text-sm font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="ينزل ملف اكسل يحوي اسم القسم وتاريخ اليوم"
          >
            <Download className="w-4 h-4" />
            قالب الجدول
          </button>

          <button
            onClick={() => download50RandomAccountsTemplate(departments[0]?.name)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="توليد وتنزيل 50 حساب عشوائي جديد"
          >
            <Download className="w-4 h-4" />
            تنزيل 50 حساب عشوائي جديد
          </button>

          <label className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-950 border border-slate-300 text-sm font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs">
            <Upload className="w-4 h-4" />
            استيراد ملف إكسل
            <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
          </label>
        </div>
      </div>

      {/* 🔔 التنبيه العائم الفاخر (Light Mode أبيض ناصع) عند إضافة أو تعديل أو حذف طالب */}
      {successMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200" dir="rtl">
          <div className="p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-emerald-500/80 ring-4 ring-emerald-400/10 flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 border-2 border-emerald-300 rounded-2xl shadow-2xs shrink-0">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-right">
                <h4 className="font-black text-base text-slate-950">إشعار النظام الأكاديمي</h4>
                <p className="font-bold text-sm text-slate-600 mt-0.5">{successMsg}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg('')}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* 🔍 شريط البحث والتصفية والترتيب والتبويبات المباشرة بحدود ناعمة */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          
          {/* 🔍 البحث المباشر */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-700 absolute right-3.5 top-3.5" />
            {/* 🔍 البحث المباشر بالاسم أو البريد الأكاديمي */}
            <input
              type="text"
              placeholder="ابحث بالاسم أو البريد الأكاديمي..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-3 pr-10 py-2.5 text-sm font-black bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:border-slate-900 text-slate-950 placeholder:text-slate-700"
            />
          </div>

          {/* 🏢 تصفية بحسب القسم - قائمة مخصصة */}
          <div className="relative" ref={filterDeptDropdownRef}>
            <button
              type="button"
              onClick={() => setIsFilterDeptDropdownOpen(!isFilterDeptDropdownOpen)}
              className={`w-full p-2.5 bg-slate-50 hover:bg-slate-100 border-2 rounded-2xl text-sm font-black text-slate-950 flex items-center justify-between transition cursor-pointer ${
                isFilterDeptDropdownOpen ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-700 shrink-0" />
                <span>
                  {selectedDeptFilter === 'ALL'
                    ? `جميع الأقسام العلمية (${departments.length})`
                    : departments.find((d) => d.id === selectedDeptFilter)?.name || 'اختر قسماً'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform ${isFilterDeptDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFilterDeptDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-50 p-2 space-y-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-right">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDeptFilter('ALL');
                    setCurrentPage(1);
                    setIsFilterDeptDropdownOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                    selectedDeptFilter === 'ALL'
                      ? 'bg-indigo-50 text-indigo-950 border border-indigo-300 font-black'
                      : 'text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>جميع الأقسام العلمية ({departments.length})</span>
                  {selectedDeptFilter === 'ALL' && <Check className="w-4 h-4 text-indigo-700" />}
                </button>

                {departments.map((d) => {
                  const isSelected = selectedDeptFilter === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setSelectedDeptFilter(d.id);
                        setCurrentPage(1);
                        setIsFilterDeptDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-950 border border-indigo-300 font-black'
                          : 'text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
                        <span>{d.name}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-700" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 📊 عداد إجمالي الطلاب */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-300 text-sm font-black">
            <span className="text-slate-950">إجمالي طلاب الجامعة:</span>
            <span className="text-indigo-950 bg-indigo-100 px-3 py-1 rounded-xl border border-indigo-300 font-black">
              {allStudents.length} طالب/ـة
            </span>
          </div>

        </div>

        {/* 🎓 تبويبات المراحل الدراسية والنوع الاجتماعي (الجنس) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
          {/* تبويبات المراحل */}
          <div className="flex-1 flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-300 gap-1 overflow-x-auto min-w-[320px]">
            {[
              { id: 'ALL', label: 'كافة المراحل' },
              { id: '1', label: 'المرحلة الأولى' },
              { id: '2', label: 'المرحلة الثانية' },
              { id: '3', label: 'المرحلة الثالثة' },
              { id: '4', label: 'المرحلة الرابعة' },
            ].map((stg) => (
              <button
                key={stg.id}
                onClick={() => { setSelectedStageFilter(stg.id); setCurrentPage(1); }}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  selectedStageFilter === stg.id
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                {stg.label}
              </button>
            ))}
          </div>

          {/* تبويبات الجنس */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-300">
            <span className="text-sm font-black text-slate-950 px-2">الجنس:</span>
            {[
              { id: 'ALL', label: 'الكل' },
              { id: 'male', label: 'الطلاب الذكور' },
              { id: 'female', label: 'الطالبات الإناث' },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => { setSelectedGenderFilter(g.id as 'ALL' | 'male' | 'female'); setCurrentPage(1); }}
                className={`px-3.5 py-1.5 rounded-xl text-sm font-black transition-all cursor-pointer ${
                  selectedGenderFilter === g.id
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-950 hover:text-black hover:bg-slate-200/60 font-black'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* 🔄 أزرار الترتيب */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm font-black text-slate-950">
            <SlidersHorizontal className="w-4 h-4 text-slate-900" />
            <span>ترتيب الطلاب:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSortBy('custom')}
              className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                sortBy === 'custom'
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                  : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>ترتيب مخصص (الافتراضي)</span>
            </button>

            <button
              type="button"
              onClick={() => setSortBy('newest')}
              className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                sortBy === 'newest'
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                  : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>الأحدث أولاً</span>
            </button>

            <button
              type="button"
              onClick={() => setSortBy('name')}
              className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                sortBy === 'name'
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                  : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>أبجدياً (أ - ي)</span>
            </button>

            <button
              type="button"
              onClick={() => setSortBy('stage')}
              className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                sortBy === 'stage'
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                  : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>حسب المرحلة</span>
            </button>

            <button
              type="button"
              onClick={() => setSortBy('dept')}
              className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                sortBy === 'dept'
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                  : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>حسب القسم</span>
            </button>
          </div>
        </div>

      </div>

      {/* 📊 جدول عرض الطلاب المزود بنظام الصفحات بحدود ناعمة */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-950">
              قائمة الطلاب المسجلين بقاعدة البيانات الرسمية للكلية
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* 🧹 مسحنا زر إلغاء تحديد الكل لمنع الازدواجية ويه زر إلغاء التحديد بالشريط الكحلي ومربع رأس الجدول */}
            <span className="px-3.5 py-1.5 bg-slate-100 text-slate-950 text-sm font-black rounded-xl border border-slate-300">
              إجمالي المعروض: {filteredStudents.length} طالب
            </span>
          </div>
        </div>

        {/* ⚠️ شريط ذكي لكشف الحسابات المشتركة بنفس البريد وحلها تلقائياً */}
        {(() => {
          const currentDuplicates = detectDuplicateEmails(allStudents);
          if (currentDuplicates.length === 0) return null;

          return (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-rose-950 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-200/60 text-rose-700 rounded-xl">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-rose-950">
                    تنبيه أمني: يوجد ({currentDuplicates.length}) بريد أكاديمي مكرر لأكثر من طالب في الكلية!
                  </h4>
                  <p className="text-xs font-black text-rose-800 mt-0.5">
                    البريد ({currentDuplicates.map((d) => d.email).join(', ')}) مشترك بين: {currentDuplicates.flatMap((d) => d.profiles.map((p) => p.full_name)).join(' و ')}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFixDuplicateEmails}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95 whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4 text-rose-200" />
                <span>فصل الحسابات وتوليد بريد فريد فوراً ⚡</span>
              </button>
            </div>
          );
        })()}

        {/* 🎛️ شريط الإجراءات الجماعية الفاخر لطلاب الكلية */}
        {selectedStudentIds.length > 0 && (
          <div className="bg-[#0F2942] text-white p-4 sm:px-6 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-[#1e4570] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 text-cyan-300 rounded-xl border border-cyan-400/30">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-base text-white">
                  تم تحديد <strong className="text-cyan-300 font-mono text-lg font-black">({selectedStudentIds.length})</strong> من أصل <span className="font-mono text-slate-300">({filteredStudents.length})</span> طالب
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSingleStudentPrintProfile(null);
                  setShowStudentPrintModal(true);
                }}
                className="px-4 py-2 bg-[#1e4570] hover:bg-[#25558a] text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs border border-cyan-400/30 active:scale-95"
                title="طباعة بطاقات الطلاب المحددين (10 بطاقات بالورقة الواحدة A4)"
              >
                <Printer className="w-4 h-4 text-cyan-300" />
                <span>طباعة بطاقات المحدد ({selectedStudentIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBulkDeleting(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف المحدد ({selectedStudentIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkExportExcel(filteredStudents)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>تصدير المحدد Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStudentIds([])}
                className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-black text-sm transition cursor-pointer"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm sm:text-base">
            <thead className="bg-slate-100 text-slate-950 border-b-2 border-slate-300 font-black">
              <tr>
                <th className="p-4 border-b border-slate-200 text-center w-12">
                  <input
                    type="checkbox"
                    aria-label="تحديد كافة الطلاب المعروضين"
                    checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={() => toggleSelectAll(filteredStudents)}
                    className="w-5 h-5 rounded-md border-2 border-slate-400 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                  />
                </th>
                {/* 🔢 تسلسل الطالب */}
                <th className="p-4 border-b border-slate-200 text-center w-16">ت</th>
                {/* 👤 اسم الطالب */}
                <th className="p-4 border-b border-slate-200">اسم الطالب</th>
                {/* 🚻 الجنس */}
                <th className="p-4 border-b border-slate-200 text-center">الجنس</th>
                {/* 🏢 القسم الأكاديمي */}
                <th className="p-4 border-b border-slate-200">القسم</th>
                {/* 📚 المرحلة الدراسية */}
                <th className="p-4 border-b border-slate-200">المرحلة</th>
                {/* ✉️ البريد الأكاديمي */}
                <th className="p-4 border-b border-slate-200">البريد الأكاديمي</th>
                {/* 🔀 ترتيب العرض */}
                <th className="p-4 border-b border-slate-200 text-center">الترتيب</th>
                {/* ⚙️ التحكم والعمليات */}
                <th className="p-4 border-b border-slate-200 text-center">التحكم والعمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-black text-slate-950">
              {paginatedStudents.map((std, index) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + index;
                const isFirst = globalIndex === 0;
                const isLast = globalIndex === filteredStudents.length - 1;
                const isSelected = selectedStudentIds.includes(std.id);

                return (
                  <tr key={std.id} className={`${isSelected ? 'bg-blue-50/70 ring-1 ring-blue-300' : 'hover:bg-slate-50'} transition`}>
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        aria-label={`تحديد ${std.full_name}`}
                        checked={isSelected}
                        onChange={() => toggleSelect(std.id)}
                        className="w-5 h-5 rounded-md border-2 border-slate-400 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                      />
                    </td>
                    <td className="p-4 text-center font-black text-slate-950">
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-lg text-sm font-black shadow-2xs">
                        {globalIndex + 1}
                      </span>
                    </td>
                    {/* 👤 اسم الطالب الثلاثي */}
                    <td className="p-4 text-slate-950 font-black">{std.full_name}</td>
                    <td className="p-4 text-center">
                      {std.gender === 'female' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-950 border border-rose-200 text-sm font-black">
                          <UserCheck className="w-4 h-4 text-rose-700" />
                          <span>أنثى</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-950 border border-blue-200 text-sm font-black">
                          <Users className="w-4 h-4 text-blue-700" />
                          <span>ذكر</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-950 font-black">{std.department_name}</td>
                    <td className="p-4 text-slate-950 font-black">المرحلة {getStageNameInArabic(std.stage_number || 1)}</td>
                    <td className="p-4 text-slate-950 font-black bg-slate-50/50">{std.generated_email}</td>
                    
                    {/* 🎛️ أزرار التقديم والتأخير */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleMoveStudent(globalIndex, 'up', filteredStudents, e)}
                          disabled={isFirst}
                          title="تقديم الطالب للأعلى"
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isFirst
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-40'
                              : 'bg-white text-slate-950 border-slate-300 hover:bg-slate-900 hover:text-white shadow-2xs'
                          }`}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleMoveStudent(globalIndex, 'down', filteredStudents, e)}
                          disabled={isLast}
                          title="تأخير الطالب للأسفل"
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isLast
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-40'
                              : 'bg-white text-slate-950 border-slate-300 hover:bg-slate-900 hover:text-white shadow-2xs'
                          }`}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSingleStudentPrintProfile(std);
                            setShowStudentPrintModal(true);
                          }}
                          className="p-2 bg-slate-100 hover:bg-[#0F2942] hover:text-white text-slate-950 rounded-xl transition border border-slate-300 font-black cursor-pointer shadow-2xs"
                          title="طباعة بطاقة اعتماد الطالب (8 بالورقة)"
                        >
                          <Printer className="w-4 h-4 text-indigo-950 hover:text-white" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingStudent(std);
                            setEditName(std.full_name);
                            setEditGender(std.gender || 'male');
                            setEditEmail(std.generated_email);
                            setEditDeptId(std.department_id || '');
                            setEditStageNum(std.stage_number || 1);
                          }}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-900 hover:text-white border border-slate-300 text-slate-950 rounded-xl text-sm font-black transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                          تعديل
                        </button>

                        <button
                          onClick={() => setDeletingStudent(std)}
                          className="px-3.5 py-2 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-900 rounded-xl text-sm font-black transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedStudents.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-12 text-center bg-white">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-14 h-14 bg-blue-50 text-blue-900 border border-blue-200 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                        <GraduationCap className="w-7 h-7 text-blue-900" />
                      </div>
                      <h4 className="text-xl font-black text-slate-950">
                        {allStudents.length === 0 ? 'لا يوجد طلاب مسجلون حتى الآن' : 'لم يتم العثور على أي طالب مطابق'}
                      </h4>
                      <p className="text-sm font-black text-slate-600 leading-relaxed">
                        {allStudents.length === 0
                          ? 'يمكنك تسجيل الطلاب يدوياً أو استيراد القوائم الأكاديمية دفعة واحدة عبر ملف Excel.'
                          : 'يرجى مراجعة محددات التصفية أو كلمة البحث.'}
                      </p>
                      {allStudents.length === 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAddFullName('');
                              setShowAddModal(true);
                            }}
                            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-sm font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 border border-[#1e4570]"
                          >
                            <Plus className="w-4 h-4 text-cyan-300" />
                            <span>إضافة طالب جديد</span>
                          </button>
                          <label className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95">
                            <Download className="w-4 h-4 text-white" />
                            <span>استيراد الطلاب من Excel</span>
                            <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
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

        {/* 📖 شريط تنقل الصفحات (Pagination Controls) */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-sm font-black text-slate-950">
              الصفحة {currentPage} من أصل {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-950 font-black rounded-xl text-sm disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
                السابقة
              </button>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-950 font-black rounded-xl text-sm disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
              >
                التالية
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 📦 ➕ كارت عائم لإضافة طالب جديد */}
      {showAddModal && (
        <FloatingCrudModal
          title="إضافة حساب طالب جديد"
          subtitle="توليد أو إدخال البريد وكلمة المرور واختيار القسم والمرحلة وحفظ البيانات مباشرة"
          isOpen={showAddModal}
          onClose={() => { 
            setShowAddModal(false); 
            setWarningError('');
            setAddFullName('');
            setCustomStudentEmail('');
            setCustomStudentPassword('');
            setShowStudentPassword(false);
            setAddGender(null); // 🔄 تصفير الجنس
            setAddStageNum(null); // 🔄 تصفير المرحلة
          }}
          icon={<Plus className="w-6 h-6 text-indigo-700" />}
          maxWidth="max-w-3xl"
          onSubmit={handleAddStudent}
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setAddFullName('');
                  setCustomStudentEmail('');
                  setCustomStudentPassword('');
                  setShowStudentPassword(false);
                  setAddGender(null); // 🔄 تصفير الجنس
                  setAddStageNum(null); // 🔄 تصفير المرحلة
                }}
                className="px-5 py-2.5 bg-slate-100 text-slate-950 font-black rounded-xl text-sm border border-slate-300 cursor-pointer hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm shadow-md cursor-pointer border border-[#1e4570] active:scale-95"
              >
                حفظ وإضافة الطالب
              </button>
            </>
          }
        >
          <div className="space-y-4 text-right">
            
            {warningError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-950 text-sm font-black">
                {warningError}
              </div>
            )}

            {/* ⚡ شريط التوليد التلقائي لبيانات الاعتماد الرسمية */}
            <div className="p-4 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-700 text-white rounded-xl shadow-xs">
                  <Key className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-950">توليد بيانات اعتماد الطالب تلقائياً</h4>
                  <p className="text-xs font-bold text-slate-700">إنشاء بريد أكاديمي معتمد ورمز دخول معقد فريد بنقرة واحدة</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCustomStudentEmail(generateStrongUniqueEmail('st', profiles));
                  setCustomStudentPassword(generateStrongPassword());
                }}
                className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>توليد البريد والرمز معاً</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-950 mb-1.5">الاسم الكامل</label>
              <input
                type="text"
                required
                value={addFullName}
                onChange={(e) => setAddFullName(e.target.value)}
                placeholder="أحمد علي حميد"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 font-black text-sm placeholder:text-slate-700 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* اختيار القسم للإضافة */}
              <div className="relative" ref={addDeptDropdownRef}>
                <label className="block text-sm font-black text-slate-950 mb-1.5">القسم</label>
                <button
                  type="button"
                  onClick={() => setIsAddDeptDropdownOpen(!isAddDeptDropdownOpen)}
                  className={`w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 border-2 rounded-xl text-slate-950 font-black text-sm flex items-center justify-between transition cursor-pointer ${
                    isAddDeptDropdownOpen ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-700 shrink-0" />
                    <span>{departments.find((d) => d.id === addDeptId)?.name || 'اختر قسماً'}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform ${isAddDeptDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAddDeptDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-right">
                    {departments.map((d) => {
                      const isSelected = addDeptId === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setAddDeptId(d.id);
                            setIsAddDeptDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-lg text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                            isSelected ? 'bg-indigo-50 text-indigo-950 border border-indigo-300' : 'text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
                            <span>{d.name}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-700" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* اختيار المرحلة للإضافة */}
              <div className="relative" ref={addStageDropdownRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-black text-slate-950">المرحلة *</label>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                    addStageNum === null
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  }`}>
                    {addStageNum === null ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>غير محدد</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>المرحلة {addStageNum}</span>
                      </>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddStageDropdownOpen(!isAddStageDropdownOpen)}
                  className={`w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 border-2 rounded-xl text-slate-950 font-black text-sm flex items-center justify-between transition cursor-pointer ${
                    isAddStageDropdownOpen ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-700 shrink-0" />
                    <span>
                      {addStageNum === 1
                        ? 'المرحلة الأولى'
                        : addStageNum === 2
                        ? 'المرحلة الثانية'
                        : addStageNum === 3
                        ? 'المرحلة الثالثة'
                        : addStageNum === 4
                        ? 'المرحلة الرابعة'
                        : '-- اختر المرحلة الدراسية --'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform ${isAddStageDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAddStageDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 text-right">
                    {[
                      { key: 1, label: 'المرحلة الأولى 1️⃣' },
                      { key: 2, label: 'المرحلة الثانية 2️⃣' },
                      { key: 3, label: 'المرحلة الثالثة 3️⃣' },
                      { key: 4, label: 'المرحلة الرابعة 4️⃣' },
                    ].map((stg) => {
                      const isSelected = addStageNum === stg.key;
                      return (
                        <button
                          key={stg.key}
                          type="button"
                          onClick={() => {
                            setAddStageNum(stg.key);
                            setIsAddStageDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-lg text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                            isSelected ? 'bg-indigo-50 text-indigo-950 border border-indigo-300' : 'text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <span>{stg.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-indigo-700" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-black text-slate-950">الجنس (النوع) *</label>
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                  addGender === null
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                }`}>
                  {addGender === null ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>غير محدد</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{addGender === 'male' ? 'ذكر (طالب)' : 'أنثى (طالبة)'}</span>
                    </>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAddGender('male')}
                  className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    addGender === 'male'
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>ذكر (طالب)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddGender('female')}
                  className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    addGender === 'female'
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>أنثى (طالبة)</span>
                </button>
              </div>
              {addGender === null && (
                <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>يرجى اختيار جنس الطالب (ذكر أو أنثى)</span>
                </p>
              )}
            </div>

            {/* ✉️ حقل البريد المخصص و 🔑 حقل كلمة المرور */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-slate-950 font-black text-xs">
                    البريد الأكاديمي (اختياري)
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomStudentEmail(generateStrongUniqueEmail('st', profiles))}
                    className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-md text-[11px] font-black flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-2xs"
                    title="توليد بريد أكاديمي رسمي فريد للطالب"
                  >
                    <RefreshCw className="w-3 h-3 text-indigo-700" />
                    <span>توليد بريد فريد</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={customStudentEmail}
                  onChange={(e) => {
                    setCustomStudentEmail(e.target.value);
                    setWarningError('');
                  }}
                  placeholder="مثال: st.ahmed2026@sadiq.edu.iq"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 font-black text-xs placeholder:text-slate-700 focus:border-indigo-600 focus:outline-none shadow-2xs"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-slate-950 font-black text-xs">
                    كلمة المرور (اختياري)
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomStudentPassword(generateStrongPassword(profiles))}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-md text-[11px] font-black flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-2xs"
                    title="توليد رمز سري قوي غير مكرر نهائياً"
                  >
                    <Key className="w-3 h-3 text-emerald-700" />
                    <span>توليد رمز عشوائي قوي</span>
                  </button>
                </div>
                <div className="relative">
                  {/* 🔑 حقل كلمة المرور بنجوم افتراضية للأمان وحشوة للأيقونة */}
                  <input
                    type={showStudentPassword ? 'text' : 'password'}
                    value={customStudentPassword}
                    onChange={(e) => setCustomStudentPassword(e.target.value)}
                    placeholder="مثال: Sadiq#Stud2026!"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 font-black text-xs placeholder:text-slate-700 focus:border-indigo-600 focus:outline-none shadow-2xs"
                    dir="ltr"
                  />
                  {/* 👁️ زر إظهار وإخفاء الرمز السري بأيقونة SVG نقية */}
                  <button
                    type="button"
                    onClick={() => setShowStudentPassword((prev) => !prev)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950 p-1 rounded-lg hover:bg-slate-200/70 transition cursor-pointer flex items-center justify-center"
                    title={showStudentPassword ? 'إخفاء الرمز السري' : 'إظهار الرمز السري'}
                    aria-label={showStudentPassword ? 'إخفاء الرمز السري' : 'إظهار الرمز السري'}
                  >
                    {showStudentPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-700" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-700" />
                    )}
                  </button>
                </div>
              </div>

              {/* ⚠️ شريط تنبيه فرادة البريد يمتد بكامل عرض الكارد بحجم خط متوسط وأيقونة SVG نقية */}
              {customStudentEmail.trim() && !checkEmailUniquenessAcrossSystem(customStudentEmail, undefined, profiles).isUnique && (
                <div className="col-span-1 sm:col-span-2 p-3 sm:p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center gap-3 text-rose-950 shadow-xs animate-in fade-in duration-200">
                  <div className="p-2 bg-rose-200/70 text-rose-700 rounded-xl shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-black text-rose-950 leading-relaxed">
                    {checkEmailUniquenessAcrossSystem(customStudentEmail, undefined, profiles).errorMessage}
                  </p>
                </div>
              )}

              {/* 🛡️ صندوق معايير وشروط كلمة المرور الأكاديمية التفاعلي الموحد */}
              {customStudentPassword && (
                <div className="col-span-1 sm:col-span-2">
                  <AcademicPasswordStrengthBox password={customStudentPassword} />
                </div>
              )}

            </div>

          </div>
        </FloatingCrudModal>
      )}

      {/* ✏️ كارت تعديل طالب */}
      {editingStudent && (
        <FloatingCrudModal
          title={`تعديل بيانات الطالب: ${editingStudent.full_name}`}
          subtitle="تعديل الاسم والجنس والبريد وكلمة المرور والقسم والمرحلة"
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          icon={<Edit3 className="w-6 h-6 text-indigo-700" />}
          maxWidth="max-w-3xl"
          onSubmit={handleEditStudentSubmit}
          footer={
            <>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-5 py-2.5 bg-slate-100 text-slate-950 font-black rounded-xl text-sm border border-slate-300 cursor-pointer hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm shadow-md cursor-pointer border border-[#1e4570] active:scale-95"
              >
                حفظ التعديلات
              </button>
            </>
          }
        >
          <div className="space-y-4 text-right">
            {editWarningError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-black flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{editWarningError}</span>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-black text-slate-950 mb-1.5">الاسم الكامل</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full p-3.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-950 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* اختيار القسم للتعديل */}
              <div className="relative" ref={editDeptDropdownRef}>
                <label className="block text-sm font-black text-slate-950 mb-1.5">القسم العلمي</label>
                <button
                  type="button"
                  onClick={() => setIsEditDeptDropdownOpen(!isEditDeptDropdownOpen)}
                  className={`w-full p-3.5 bg-slate-50 hover:bg-slate-100 border-2 rounded-xl text-slate-950 font-black text-sm flex items-center justify-between transition cursor-pointer ${
                    isEditDeptDropdownOpen ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-700 shrink-0" />
                    <span>{departments.find((d) => d.id === editDeptId)?.name || 'اختر قسماً'}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform ${isEditDeptDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isEditDeptDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-right">
                    {departments.map((d) => {
                      const isSelected = editDeptId === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setEditDeptId(d.id);
                            setIsEditDeptDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-lg text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                            isSelected ? 'bg-indigo-50 text-indigo-950 border border-indigo-300' : 'text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
                            <span>{d.name}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-700" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* اختيار المرحلة للتعديل */}
              <div className="relative" ref={editStageDropdownRef}>
                <label className="block text-sm font-black text-slate-950 mb-1.5">المرحلة الدراسية</label>
                <button
                  type="button"
                  onClick={() => setIsEditStageDropdownOpen(!isEditStageDropdownOpen)}
                  className={`w-full p-3.5 bg-slate-50 hover:bg-slate-100 border-2 rounded-xl text-slate-950 font-black text-sm flex items-center justify-between transition cursor-pointer ${
                    isEditStageDropdownOpen ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-700 shrink-0" />
                    <span>
                      {editStageNum === 1 ? 'المرحلة الأولى' : editStageNum === 2 ? 'المرحلة الثانية' : editStageNum === 3 ? 'المرحلة الثالثة' : 'المرحلة الرابعة'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform ${isEditStageDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isEditStageDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 text-right">
                    {[
                      { key: 1, label: 'المرحلة الأولى 1️⃣' },
                      { key: 2, label: 'المرحلة الثانية 2️⃣' },
                      { key: 3, label: 'المرحلة الثالثة 3️⃣' },
                      { key: 4, label: 'المرحلة الرابعة 4️⃣' },
                    ].map((stg) => {
                      const isSelected = editStageNum === stg.key;
                      return (
                        <button
                          key={stg.key}
                          type="button"
                          onClick={() => {
                            setEditStageNum(stg.key);
                            setIsEditStageDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-lg text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                            isSelected ? 'bg-indigo-50 text-indigo-950 border border-indigo-300' : 'text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <span>{stg.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-indigo-700" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-950 mb-1.5">الجنس (النوع الاجتماعي)</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEditGender('male')}
                  className={`p-3 rounded-xl border text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                    editGender === 'male'
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>ذكر (طالب)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditGender('female')}
                  className={`p-3 rounded-xl border text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                    editGender === 'female'
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-5 h-5" />
                  <span>أنثى (طالبة)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-sm font-black text-slate-950">البريد الأكاديمي</label>
                  <button
                    type="button"
                    onClick={() => setEditEmail(generateStrongUniqueEmail('st', profiles))}
                    className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-md text-xs font-black flex items-center gap-1 transition cursor-pointer"
                    title="توليد بريد أكاديمي جديد غير مكرر"
                  >
                    <RefreshCw className="w-3 h-3 text-indigo-700" />
                    <span>توليد بريد فريد</span>
                  </button>
                </div>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => {
                    setEditEmail(e.target.value);
                    setEditWarningError('');
                  }}
                  className="w-full p-3.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-950 focus:border-indigo-600 focus:outline-none"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-sm font-black text-slate-950">كلمة المرور الجديدة</label>
                  <button
                    type="button"
                    onClick={() => setEditPassword(generateStrongPassword(profiles))}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-md text-xs font-black flex items-center gap-1 transition cursor-pointer"
                    title="توليد رمز سري قوي عشوائي جديد غير مكرر"
                  >
                    <Key className="w-3 h-3 text-emerald-700" />
                    <span>توليد رمز عشوائي قوي</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="اتركه فارغاً للإبقاء على الحالية"
                  className="w-full p-3.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-950 focus:border-indigo-600 focus:outline-none"
                  dir="ltr"
                />
              </div>

              {/* ⚠️ شريط تنبيه فرادة البريد يمتد بكامل عرض الكارد بحجم خط متوسط وأيقونة SVG نقية */}
              {editEmail.trim() && editingStudent && !checkEmailUniquenessAcrossSystem(editEmail, editingStudent.id, profiles).isUnique && (
                <div className="col-span-1 sm:col-span-2 p-3 sm:p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center gap-3 text-rose-950 shadow-xs animate-in fade-in duration-200">
                  <div className="p-2 bg-rose-200/70 text-rose-700 rounded-xl shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-black text-rose-950 leading-relaxed">
                    {checkEmailUniquenessAcrossSystem(editEmail, editingStudent.id, profiles).errorMessage}
                  </p>
                </div>
              )}

            </div>

            {/* 🛡️ صندوق معايير وشروط كلمة المرور الأكاديمية التفاعلي الموحد */}
            {editPassword && (
              <AcademicPasswordStrengthBox password={editPassword} />
            )}

          </div>
        </FloatingCrudModal>
      )}

      {/* 🗑️ مودال تأكيد الحذف الاحترافي الفاخر */}
      <ConfirmDeleteModal
        isOpen={!!deletingStudent}
        onClose={() => setDeletingStudent(null)}
        title="تأكيد حذف حساب الطالب"
        itemName={deletingStudent?.full_name || 'طالب'}
        itemDetails={`الرقم الجامعي: ${deletingStudent?.university_number || '—'} | البريد: ${deletingStudent?.generated_email || '—'}`}
        warningMessage="سيتم مسح حساب هذا الطالب وكافة سجلاته الأكاديمية ودرجاته نهائياً من النظام السحابي."
        onConfirm={handleConfirmDelete}
      />

      {/* 🗑️ كارد تأكيد الحذف الجماعي للطلاب */}
      <ConfirmDeleteModal
        isOpen={isBulkDeleting}
        onClose={() => setIsBulkDeleting(false)}
        title={`تأكيد الحذف الجماعي لـ (${selectedStudentIds.length}) طلاب`}
        itemName={`${selectedStudentIds.length} من طلبة الكلية`}
        itemDetails="سيتم حذف حسابات الطلاب المحددين وكافة سجلاتهم ودرجاتهم الأكاديمية نهائياً من النظام."
        warningMessage="⚠️ تنبيه أمني: هل أنت متأكد من حذف الطلاب المحددين دفعة واحدة؟ لا يمكن التراجع عن هذه العملية."
        confirmText={`حذف (${selectedStudentIds.length}) طلاب نهائياً`}
        onConfirm={confirmBulkDeleteStudents}
      />

      {/* 📊 نافذة تقرير نتائج استيراد Excel للطلاب (المقبول والمكرر والمرفوض) */}
      {importReport && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-right max-h-[90vh] overflow-y-auto">
            
            {/* عنوان التقرير */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950">
                    تقرير نتائج استيراد ملف Excel للطلبة ({importReport.totalRows} صف)
                  </h3>
                  <p className="text-sm font-bold text-slate-700">
                    تم فحص كافة السجلات والتحقق الصارم من عدم التكرار
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setImportReport(null)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
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
                    <span>قائمة الطلبة المقبولين والمضافين لقاعدة البيانات بنجاح:</span>
                  </h4>
                  {importReport.accepted.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">لا يوجد صفوف مقبولة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.accepted.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-950 font-black">{item.name}</span>
                            <span className="text-slate-500 font-bold mx-1.5">•</span>
                            <span className="text-slate-700">{item.dept} (مرحلة {item.stage})</span>
                          </div>
                          <span className="text-blue-950 bg-blue-100 px-2 py-0.5 rounded border border-blue-200 font-mono text-xs" dir="ltr">
                            {item.uniNum}
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
                    <span>قائمة السجلات المكررة التي تم استبعادها لحماية البيانات:</span>
                  </h4>
                  {importReport.duplicates.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">رائع! لم يتم رصد أي طلاب مكررين في الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.duplicates.map((item, idx) => (
                        <div key={idx} className="py-2.5 space-y-1 text-sm font-black">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-950 font-black">{item.name} ({item.dept})</span>
                            <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs font-black">
                              تم منعه منعاً للتكرار
                            </span>
                          </div>
                          <p className="text-xs text-rose-900 font-bold">
                            السبب: {item.reason} {item.uniNum !== '—' && `(الرقم: ${item.uniNum})`}
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
                    <p className="text-sm text-slate-600 font-bold py-2">لا يوجد أي صفوف مرفوضة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.rejected.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-700 font-bold">الصف رقم {item.rowNumber}: </span>
                            <span className="text-slate-950 font-black">{item.rawName}</span>
                          </div>
                          <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs font-black">
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
            <div className="flex items-center justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setImportReport(null)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-sm transition cursor-pointer shadow-xs"
              >
                إغلاق التقرير ومتابعة العمل
              </button>
            </div>

          </div>
        </div>
      )}

    
      {/* 🖨️ نافذة معاينة وطباعة بطاقات اعتماد الطلبة (10 بطاقات بالورقة الواحدة A4 بنظام الشبكة 2x5) */}
      {showStudentPrintModal && isMounted && typeof document !== 'undefined' && createPortal((() => {
        const studentProfiles = profiles.filter((p) => p.role === 'student');
        const baseStudents = singleStudentPrintProfile
          ? [singleStudentPrintProfile]
          : (selectedStudentIds.length > 0
              ? studentProfiles.filter((s) => selectedStudentIds.includes(s.id))
              : studentProfiles);

        // 📊 إحصائيات طلاب النظام المتاحة للطباعة (العدد الكلي وأعداد كل مرحلة وفترة)
        const totalCount = baseStudents.length;
        const stage1Count = baseStudents.filter((s) => (s.stage_number || 1) === 1).length;
        const stage2Count = baseStudents.filter((s) => (s.stage_number || 1) === 2).length;
        const stage3Count = baseStudents.filter((s) => (s.stage_number || 1) === 3).length;
        const stage4Count = baseStudents.filter((s) => (s.stage_number || 1) === 4).length;

        const morningCount = baseStudents.filter((s) => (s.study_type || 'morning') === 'morning').length;
        const eveningCount = baseStudents.filter((s) => (s.study_type || 'morning') === 'evening').length;

        // 🎓 خيارات تصفية المراحل الأكاديمية الاحترافية مع الأعداد الدقيقة
        const stageOptions: PrintFilterOption<number | 'all'>[] = [
          { id: 'all', label: 'كافة المراحل (العدد الكلي)', count: totalCount },
          { id: 1, label: 'المرحلة الأولى', count: stage1Count },
          { id: 2, label: 'المرحلة الثانية', count: stage2Count },
          { id: 3, label: 'المرحلة الثالثة', count: stage3Count },
          { id: 4, label: 'المرحلة الرابعة', count: stage4Count },
        ];

        // ☀️🌙 خيارات تصفية الفترات الدراسية الاحترافية مع الأعداد الدقيقة
        const studyOptions: PrintFilterOption<'all' | 'morning' | 'evening'>[] = [
          { id: 'all', label: 'كافة الفترات (العدد الكلي)', count: totalCount },
          { id: 'morning', label: 'الصباحي', count: morningCount },
          { id: 'evening', label: 'المسائي', count: eveningCount },
        ];

        let printList = singleStudentPrintProfile
          ? [singleStudentPrintProfile]
          : (selectedStudentIds.length > 0
              ? studentProfiles.filter((s) => selectedStudentIds.includes(s.id))
              : [...studentProfiles]);

        if (!singleStudentPrintProfile) {
          if (studentPrintStageFilter !== 'all') {
            printList = printList.filter((s) => (s.stage_number || 1) === studentPrintStageFilter);
          }
          if (studentPrintStudyFilter !== 'all') {
            printList = printList.filter((s) => (s.study_type || 'morning') === studentPrintStudyFilter);
          }
        }

        printList.sort((a, b) => {
          const stageA = a.stage_number || 1;
          const stageB = b.stage_number || 1;
          if (stageA !== stageB) return stageA - stageB;
          return a.full_name.localeCompare(b.full_name, 'ar');
        });

        return (
          <div 
            id="printable-modal-portal"
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:static print:bg-white print:backdrop-blur-none print:w-full print:h-auto print:min-h-0 print:overflow-visible print:block" 
            dir="rtl"
          >
            <div className="bg-white border-2 border-slate-400 rounded-3xl w-full max-w-7xl max-h-[94vh] shadow-2xl flex flex-col relative overflow-hidden text-right print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none print:overflow-visible print:static print:block print:h-auto">
              
              {/* شريط الأدوات العلوي */}
              <div className="p-4 sm:p-5 border-b-2 border-slate-300 bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 z-10 print:hidden no-print">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0F2942] text-cyan-300 rounded-2xl shadow-xs">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-black flex items-center gap-2">
                      <span>معاينة وطباعة بطاقات اعتماد الطلبة</span>
                      <span className="px-3 py-0.5 rounded-full bg-slate-200 text-black text-xs font-black border border-slate-300">
                        {printList.length} بطاقة (10 بطاقات بالورقة الواحدة A4)
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm font-black text-slate-700">
                      شبكة ثنائية 2x5 فائقة الكفاءة ومضغوطة لتوفير استهلاك الأوراق
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* فلاتر المرحلة والدراسة الاحترافية بتصميم حديث وأعداد دقيقة */}
                  {!singleStudentPrintProfile && (
                    <div className="flex items-center gap-2.5">
                      <PrintFilterDropdown<number | 'all'>
                        ariaLabel="تصفية طباعة الطلاب حسب المرحلة الأكاديمية"
                        icon={<GraduationCap className="w-4 h-4 text-[#0F2942]" />}
                        options={stageOptions}
                        selectedValue={studentPrintStageFilter}
                        onSelect={(val) => setStudentPrintStageFilter(val)}
                      />

                      <PrintFilterDropdown<'all' | 'morning' | 'evening'>
                        ariaLabel="تصفية طباعة الطلاب حسب الفترة الدراسية"
                        icon={<Clock className="w-4 h-4 text-[#0F2942]" />}
                        options={studyOptions}
                        selectedValue={studentPrintStudyFilter}
                        onSelect={(val) => setStudentPrintStudyFilter(val)}
                      />
                    </div>
                  )}

                  {singleStudentPrintProfile && (
                    <button
                      type="button"
                      onClick={() => setSingleStudentPrintProfile(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4 text-black" />
                      <span>عرض كافة الطلبة ({studentProfiles.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => window.print()}
                    disabled={printList.length === 0}
                    className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] disabled:bg-slate-300 text-white rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#1e4570] active:scale-95"
                  >
                    <Printer className="w-4 h-4 text-cyan-300" />
                    <span>طباعة الآن ({printList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowStudentPrintModal(false);
                      setSingleStudentPrintProfile(null);
                    }}
                    className="p-2.5 bg-slate-200 hover:bg-slate-300 text-black rounded-2xl transition cursor-pointer"
                    title="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* منطقة الطباعة بنظام الشبكة 2 عمود × 5 صفوف (10 كروت بكل صفحة A4) */}
              <div className="p-3 sm:p-5 overflow-y-auto flex-1 overscroll-contain printable-batch-area bg-slate-100 print:bg-white print:p-0 print:overflow-visible print:static print:block print:h-auto">
                {printList.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border-2 border-slate-300 space-y-3 my-6">
                    <AlertCircle className="w-10 h-10 text-indigo-950 mx-auto" />
                    <p className="text-base font-black text-black">لا يوجد طلاب مطابقين للخيارات المحددة حالياً.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 print:grid-cols-2 print:gap-1.5 w-full cards-grid-8">
                    {printList.map((student: UserProfile, index: number) => {
                      const curStage = student.stage_number || 1;
                      const stageName = getStageNameInArabic(curStage);
                      const studyName = student.study_type === 'evening' ? 'مسائي' : 'صباحي';
                      const currentOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://192.168.0.185:3000';
                      const loginPortalUrl = `${currentOrigin}/student`;
                      const loginPortalCleanUrl = loginPortalUrl.replace(/^https?:\/\//, '');
                      const deptName = student.department_name || departments.find((d) => d.id === student.department_id)?.name || 'القسم العام';

                      return (
                        <div
                          key={student.id || index} // 🔑 مفتاح فريد لكل كارد طالب بالرندر
                          className="bg-white border border-slate-400 rounded-xl p-2 print:p-1.5 shadow-xs break-inside-avoid print:break-inside-avoid print:border print:border-slate-500 print:rounded-lg print:shadow-none w-full flex flex-col justify-between card-item-8" // 🗂️ حاوية الكارد الأكاديمي بارتفاع 52 ملم تملأ الورقة بالكامل بدون فراغات زائدة
                        >
                          {/* 🏛️ 1. ترويسة الكارد الرسمية: الشعار وعنوان الجامعة وشارة الطالب بخطوط سوداء فاحمة وواضحة */}
                          <div className="flex items-center justify-between border-b border-slate-300 pb-1 print:pb-0.5"> {/* 📐 حاوية الترويسة مع خط فاصل داكن */}
                            <div className="flex items-center gap-1.5 overflow-hidden"> {/* 🏢 مجمع الشعار والعناوين الرسمية */}
                              {/* شعار الجامعة الرسمي بجودة واضحة وبحجم مدمج */}
                              <div className="relative w-8 h-8 print:w-7 print:h-7 flex-shrink-0"> {/* 🖼️ إطار أبعاد الشعار الرسمي */}
                                <Image // 🖼️ مكون صورة الشعار
                                  src="/logo.webp" // 📍 مسار الشعار المعتمد
                                  alt="شعار جامعة الصادق" // 🏷️ نص بديل لأغراض الوصولية
                                  width={32} // 📏 العرض بالبكسل
                                  height={32} // 📏 الارتفاع بالبكسل
                                  className="object-contain" // 🎨 احتواء الصورة بالكامل بدون تشويه
                                  priority // ⚡ تحميل سريع وفوري
                                  unoptimized // 🚀 بدون تحسين إضافي للملفات المحلية
                                />
                              </div>
                              {/* العناوين الرسمية لجامعة الإمام الصادق ومسار بولونيا بخط أسود بارز ومقروء */}
                              <div className="flex flex-col justify-center leading-none min-w-0"> {/* 📝 نصوص اسم الجامعة والوزارة */}
                                <h4 className="text-xs print:text-[11px] font-black text-black whitespace-nowrap leading-tight"> {/* 🏛️ اسم الجامعة وفرع ميسان بلون أسود عريض وواضح */}
                                  جامعة الإمام جعفر الصادق (ع) — فرع ميسان
                                </h4>
                                <p className="text-[10px] print:text-[9.5px] text-black font-extrabold whitespace-nowrap leading-tight mt-0.5"> {/* 📜 اسم الوزارة والمسار بخط أسود بارز */}
                                  وزارة التعليم العالي والبحث العلمي — مسار بولونيا
                                </p>
                              </div>
                            </div>
                            {/* شارة الهوية الرسمية للطالب الجامعي بخط أسود بارز ومحاط بإطار أنيق */}
                            <span className="px-2 py-0.5 rounded-md bg-white text-black text-[10px] print:text-[9.5px] font-black border border-slate-300 whitespace-nowrap shrink-0 shadow-2xs"> {/* 🏷️ باج هوية الطالب */}
                              بطاقة طالب
                            </span>
                          </div>

                          {/* 👤 2. شريط هوية الطالب وقسمه ومرحلته الدراسية بخطوط سوداء عريضة */}
                          <div className="flex items-center justify-between gap-2 py-0.5 px-0.5"> {/* 📌 حاوية اسم الطالب وبيانات القسم والمرحلة */}
                            <div className="flex items-center gap-1.5 overflow-hidden"> {/* 🏷️ أيقونة واسم الطالب */}
                              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-300"> {/* ⭕ دائرة أيقونة المستخدم */}
                                <User className="w-3 h-3 text-[#0F2942]" /> {/* 👤 أيقونة الطالب باللون النيلي */}
                              </div>
                              <span className="text-sm print:text-[12px] font-black text-black truncate"> {/* ✍️ الاسم الكامل للطالب بخط أسود كبير وواضح */}
                                {student.full_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0"> {/* 🏷️ باجات القسم والمرحلة الدراسية */}
                              <span className="text-[10px] print:text-[9.5px] font-black text-black bg-white px-1.5 py-0.5 rounded-md border border-slate-300 whitespace-nowrap shadow-2xs"> {/* 🏢 اسم القسم العلمي */}
                                {deptName}
                              </span>
                              <span className="text-[10px] print:text-[9.5px] font-black text-black bg-white px-1.5 py-0.5 rounded-md border border-slate-300 whitespace-nowrap shadow-2xs"> {/* 🎓 المرحلة والدراسة */}
                                المرحلة {stageName} ({studyName})
                              </span>
                            </div>
                          </div>

                          {/* 🔐 3. شبكة بيانات الدخول (ألوان موحدة وخانات بيضاء نقية بخطوط سوداء فاحمة) */}
                          <div className="grid grid-cols-2 gap-1.5 print:gap-1 my-0.5"> {/* 🔲 شبكة بعمودين متوازيين للبيانات بتصميم متوحد ونظيف */}
                            {/* صندوق البريد الإلكتروني الأكاديمي بخانة بيضاء نقية مثل الرمز السري تماماً */}
                            <div className="bg-slate-50 border border-slate-300 rounded-md p-1.5 flex flex-col justify-center"> {/* ✉️ بوكس الإيميل الأكاديمي الموحد بحشوة متناسقة */}
                              <div className="flex items-center gap-1 text-[10px] print:text-[9.5px] font-black text-black mb-1"> {/* 🏷️ عنوان حقل الإيميل بخط أسود بارز */}
                                <Mail className="w-3 h-3 text-[#0F2942] shrink-0" /> {/* ✉️ أيقونة البريد بلون نيلي موحد */}
                                <span>البريد الأكاديمي</span>
                              </div>
                              <div className="font-mono text-[10.5px] print:text-[10px] font-black text-black truncate text-center select-all bg-white py-1 px-1.5 rounded border border-slate-300 shadow-2xs" dir="ltr"> {/* 🔤 خانة البريد بيضاء نقية ومحاطة بإطار أنيق مريح */}
                                {student.generated_email}
                              </div>
                            </div>

                            {/* صندوق الرمز السري المؤقت بتصميم موحد تماماً مع صندوق البريد بخط أسود */}
                            <div className="bg-slate-50 border border-slate-300 rounded-md p-1.5 flex flex-col justify-center"> {/* 🔑 بوكس كلمة المرور موحد بلون متناسق وبدون أخضر */}
                              <div className="flex items-center gap-1 text-[10px] print:text-[9.5px] font-black text-black mb-1"> {/* 🏷️ عنوان حقل كلمة السر بخط أسود بارز */}
                                <KeyRound className="w-3 h-3 text-[#0F2942] shrink-0" /> {/* 🔑 أيقونة المفتاح بلون نيلي موحد */}
                                <span>كلمة المرور المؤقتة</span>
                              </div>
                              <div className="font-mono text-[12px] print:text-[11px] font-black tracking-widest text-black truncate text-center select-all bg-white py-1 px-1.5 rounded border border-slate-300 shadow-2xs" dir="ltr"> {/* 🔢 خانة الباسورد بيضاء نقية بخط أسود عريض ومتباعد */}
                                {student.temp_password || '********'}
                              </div>
                            </div>
                          </div>

                          {/* 🌐 4. رابط المنصة المباشر بحجم خط مطابق لاسم الطالب بدون توقيع المستلم وبخط أسود فاحم */}
                          <div className="flex items-center justify-center border-t border-slate-300 pt-1.5 print:pt-1"> {/* 📄 شريط رابط البوابة في المنتصف ومضغوط المساحة */}
                            <div className="flex items-center gap-1.5 font-mono text-xs print:text-[11.5px] font-black text-black truncate select-all bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md" dir="ltr"> {/* 🔗 رابط الدخول بحجم مساوٍ لاسم الطالب مع إطار ناعم */}
                              <Globe className="w-3.5 h-3.5 text-[#0F2942] shrink-0" /> {/* 🌐 أيقونة الكرة الأرضية بلون نيلي */}
                              <span className="truncate">{loginPortalCleanUrl}</span> {/* 🌐 رابط البوابة النظيف والواضح */}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })(), document.body)}
</div>
  );
}
