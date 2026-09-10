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
import { AdminStudentAddModal } from '@/components/admin/students/AdminStudentAddModal'; // 📝 مودال إضافة طالب جديد
import { AdminStudentEditModal } from '@/components/admin/students/AdminStudentEditModal'; // ✏️ مودال تعديل بيانات الطالب
import { AdminStudentImportReportModal } from '@/components/admin/students/AdminStudentImportReportModal'; // 📊 مودال تقرير استيراد الطلاب
import { AdminStudentPrintModal } from '@/components/admin/students/AdminStudentPrintModal'; // 🖨️ مودال معاينة وطباعة بطاقات الطلبة
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

      {/* 📝 1. مودال إضافة طالب جديد عبر المكون المستقل */}
      <AdminStudentAddModal
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        handleAddStudent={handleAddStudent}
        warningError={warningError}
        setWarningError={setWarningError}
        addFullName={addFullName}
        setAddFullName={setAddFullName}
        addGender={addGender}
        setAddGender={setAddGender}
        addDeptId={addDeptId}
        setAddDeptId={setAddDeptId}
        departments={departments}
        isAddDeptDropdownOpen={isAddDeptDropdownOpen}
        setIsAddDeptDropdownOpen={setIsAddDeptDropdownOpen}
        addDeptDropdownRef={addDeptDropdownRef}
        addStageNum={addStageNum}
        setAddStageNum={setAddStageNum}
        isAddStageDropdownOpen={isAddStageDropdownOpen}
        setIsAddStageDropdownOpen={setIsAddStageDropdownOpen}
        addStageDropdownRef={addStageDropdownRef}
        customStudentEmail={customStudentEmail}
        setCustomStudentEmail={setCustomStudentEmail}
        customStudentPassword={customStudentPassword}
        setCustomStudentPassword={setCustomStudentPassword}
        showStudentPassword={showStudentPassword}
        setShowStudentPassword={setShowStudentPassword}
        profiles={profiles}
      />
      {/* ✏️ 2. مودال تعديل بيانات الطالب عبر المكون المستقل */}
      <AdminStudentEditModal
        editingStudent={editingStudent}
        setEditingStudent={setEditingStudent}
        handleEditStudentSubmit={handleEditStudentSubmit}
        editWarningError={editWarningError}
        setEditWarningError={setEditWarningError}
        editName={editName}
        setEditName={setEditName}
        editGender={editGender}
        setEditGender={setEditGender}
        editDeptId={editDeptId}
        setEditDeptId={setEditDeptId}
        departments={departments}
        isEditDeptDropdownOpen={isEditDeptDropdownOpen}
        setIsEditDeptDropdownOpen={setIsEditDeptDropdownOpen}
        editDeptDropdownRef={editDeptDropdownRef}
        editStageNum={editStageNum}
        setEditStageNum={setEditStageNum}
        isEditStageDropdownOpen={isEditStageDropdownOpen}
        setIsEditStageDropdownOpen={setIsEditStageDropdownOpen}
        editStageDropdownRef={editStageDropdownRef}
        editEmail={editEmail}
        setEditEmail={setEditEmail}
        editPassword={editPassword}
        setEditPassword={setEditPassword}
        showStudentPassword={showStudentPassword}
        setShowStudentPassword={setShowStudentPassword}
        profiles={profiles}
      />
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

      {/* 📊 نافذة تقرير نتائج استيراد Excel للطلاب عبر المكون المستقل */}
      <AdminStudentImportReportModal
        importReport={importReport}
        setImportReport={setImportReport}
        activeReportTab={activeReportTab}
        setActiveReportTab={setActiveReportTab}
      />
      {/* 🖨️ نافذة معاينة وطباعة بطاقات اعتماد الطلبة عبر المكون المستقل */}
      <AdminStudentPrintModal
        showStudentPrintModal={showStudentPrintModal}
        setShowStudentPrintModal={setShowStudentPrintModal}
        isMounted={isMounted}
        profiles={profiles}
        singleStudentPrintProfile={singleStudentPrintProfile}
        setSingleStudentPrintProfile={setSingleStudentPrintProfile}
        selectedStudentIds={selectedStudentIds}
        departments={departments}
        studentPrintStageFilter={studentPrintStageFilter}
        setStudentPrintStageFilter={setStudentPrintStageFilter}
        studentPrintStudyFilter={studentPrintStudyFilter}
        setStudentPrintStudyFilter={setStudentPrintStudyFilter}
      />
</div>
  );
}
