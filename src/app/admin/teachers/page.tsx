'use client'; // ⚡ ينفذ بالعميل

//  صفحة إدارة الكادر التدريسي (الأساتذة) الكحلية الاستجابية 100% المبنية بكروت عائمة - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect, useMemo, useRef } from 'react'; // 🔗 رياكت
import { createPortal } from 'react-dom'; // 🚪 بورتال لرسم النوافذ في قمة المستند
import Image from 'next/image'; // 🖼️ الصور
import { useRouter } from 'next/navigation'; // 🛣️ موجه المسارات
import { 
  getCurrentSessionUser, 
  saveProfileToSupabase, 
  deleteProfileFromSupabase, 
  syncProfilesFromSupabase, 
  saveTeacherCourseToSupabase, 
  deleteTeacherCourseFromSupabase,
  syncDepartmentsFromSupabase,
  syncCoursesFromSupabase,
  syncTeacherCoursesFromSupabase
} from '@/lib/supabase-client'; // 🔌 فحص الجلسة ودوال المزامنة السحابية المباشرة
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 المكون العائم الفاخر للـ CRUD
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'; // 🗑️ كارد الحذف الاحترافي الفاخر
import { AcademicPasswordStrengthBox } from '@/components/AcademicPasswordStrengthBox'; // 🛡️ صندوق معايير كلمة المرور الموحد
import { getStoredData, saveStoredData, INITIAL_PROFILES, INITIAL_DEPARTMENTS, INITIAL_COURSES, INITIAL_TEACHER_COURSES, generateStrongUniqueEmail, generateStrongPassword } from '@/lib/mock-data'; // 💾 التخزين والدوال القوية
import { UserProfile, Department, Course, TeacherCourse } from '@/types'; // 🔗 الأنواع
import { parseExcelFile, downloadAdminTeachersTemplate, exportCustomTeachersList } from '@/lib/excel-utils'; // 📊 ميزة الجداول المجدولة
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧮 التعرف الذكي على جنس الأستاذ
import { 
  checkEmailUniquenessAcrossSystem, 
  detectDuplicateEmails, 
  resolveDuplicateEmailsInProfiles 
} from '@/lib/validation-utils'; // 🛡️ محرك فحص فرادة البريد ومنع التكرار الأكاديمي
import { 
  Users, 
  Plus, 
  Upload, 
  Download, 
  CheckCircle2, 
  QrCode, 
  Printer, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  X, 
  Search, 
  Filter, 
  UserCheck, 
  GraduationCap,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  SlidersHorizontal,
  Clock,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Building2,
  ChevronDown,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  User, // 👤 أيقونة المستخدم بصيغة SVG الرسمية
  Mail, // ✉️ أيقونة البريد الإلكتروني الرسمي
  KeyRound, // 🔑 أيقونة كلمة المرور والرمز السري
  Globe, // 🌐 أيقونة رابط المنصة وبوابة الدخول
  Eye, // 👁️ أيقونة إظهار الرمز السري
  EyeOff, // 👁️‍🗨️ أيقونة إخفاء الرمز السري
  Award // 🎖️ أيقونة الموقع الإداري والرتبة الأكاديمية
} from 'lucide-react'; // 🎨 الأيقونات

export default function AdminTeachersPage() {
  const router = useRouter();
  // 📌 الحالات
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<TeacherCourse[]>([]);

  // 📌 حالات كروت CRUD العائمة
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<UserProfile | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<UserProfile | null>(null);

  // 📌 حقول إضافة أستاذ جديد
  const [fullName, setFullName] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [teacherGender, setTeacherGender] = useState<'male' | 'female' | null>(null); // ⚤ جنس الأستاذ - غير محدد افتراضياً
  const [customTeacherEmail, setCustomTeacherEmail] = useState('');
  const [customTeacherPassword, setCustomTeacherPassword] = useState('');
  const [showTeacherPassword, setShowTeacherPassword] = useState<boolean>(false); // 👁️ إظهار أو إخفاء الرمز السري للأستاذ بنجوم أو نص صريح
  
  // ✏️ حقول تعديل أستاذ
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editDeptId, setEditDeptId] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female'>('male');
  const [addTeacherError, setAddTeacherError] = useState(''); // ⚠️ رسالة خطأ إضافة الأستاذ
  const [editTeacherError, setEditTeacherError] = useState(''); // ⚠️ رسالة خطأ تعديل الأستاذ

  // 🔍 حالات التصفية والبحث والترتيب
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<'ALL' | 'male' | 'female'>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [sortMode, setSortMode] = useState<'custom' | 'newest' | 'oldest' | 'name_asc' | 'dept_asc' | 'courses_desc'>('custom');

  // 🔽 حالات ومراجع القوائم المنسدلة المخصصة
  const [isAddDeptDropdownOpen, setIsAddDeptDropdownOpen] = useState<boolean>(false);
  const [isEditDeptDropdownOpen, setIsEditDeptDropdownOpen] = useState<boolean>(false);
  const [isFilterDeptDropdownOpen, setIsFilterDeptDropdownOpen] = useState<boolean>(false);

  const addDeptDropdownRef = useRef<HTMLDivElement>(null);
  const editDeptDropdownRef = useRef<HTMLDivElement>(null);
  const filterDeptDropdownRef = useRef<HTMLDivElement>(null);

  // 📄 حالات نظام الصفحات (Pagination) المتقدم لجدول الأساتذة
  const [currentPage, setCurrentPage] = useState<number>(1); // 📄 رقم الصفحة الحالية
  const [pageSize, setPageSize] = useState<number>(10); // 📏 عدد الأساتذة في الصفحة الواحدة
  const [isPageSizeOpen, setIsPageSizeOpen] = useState<boolean>(false); // 🔽 حالة فتح قائمة حجم الصفحة
  const pageSizeDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع قائمة حجم الصفحة

  // 📄 تصفير الصفحة للبداية عند تغيير معايير البحث أو التصفية
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDeptFilter, selectedGenderFilter, sortMode]);

  // 🖱️ إغلاق القوائم المنسدلة عند النقر خارجها أو الضغط على Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (addDeptDropdownRef.current && !addDeptDropdownRef.current.contains(target)) {
        setIsAddDeptDropdownOpen(false);
      }
      if (editDeptDropdownRef.current && !editDeptDropdownRef.current.contains(target)) {
        setIsEditDeptDropdownOpen(false);
      }
      if (filterDeptDropdownRef.current && !filterDeptDropdownRef.current.contains(target)) {
        setIsFilterDeptDropdownOpen(false);
      }
      if (pageSizeDropdownRef.current && !pageSizeDropdownRef.current.contains(target)) {
        setIsPageSizeOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAddDeptDropdownOpen(false);
        setIsEditDeptDropdownOpen(false);
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

  // 📊 نافذة تقرير نتائج استيراد ملف Excel للأساتذة
  const [importReport, setImportReport] = useState<{
    totalRows: number;
    accepted: { name: string; dept: string; email: string }[];
    duplicates: { name: string; email: string; dept: string; reason: string }[];
    rejected: { rowNumber: number; rawName: string; reason: string }[];
  } | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<'accepted' | 'duplicates' | 'rejected'>('accepted');

  // 🖨️ طباعة بطاقات الاعتماد (8 بطاقات بالورقة الواحدة A4)
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false);
  const [singlePrintTeacher, setSinglePrintTeacher] = useState<UserProfile | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [createdTeacherCard, setCreatedTeacherCard] = useState<{ teacher: UserProfile; qrValue: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 🔘 حالات نظام التحديد المتعدد لأساتذة الكلية
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  // 🌐 تثبيت المكون بالعميل
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 🖨️ تفعيل كلاس print-modal-active على جسم الصفحة لمنع ظهور أي صفحات بيضاء أثناء الطباعة
  useEffect(() => {
    if (showBatchPrintModal) {
      document.body.classList.add('print-modal-active');
    } else {
      document.body.classList.remove('print-modal-active');
    }
    return () => {
      document.body.classList.remove('print-modal-active');
    };
  }, [showBatchPrintModal]);

  // 🔄 فحص الجلسة وتحميل البيانات
  useEffect(() => {
    const user = getCurrentSessionUser();
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin' && user.role !== 'department_head' && user.role !== 'rapporteur')) {
      router.push('/admin');
      return;
    }
    const loadedProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const loadedDepts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS);
    setProfiles(loadedProfiles);
    setDepartments(loadedDepts);
    setCourses(getStoredData<Course[]>('courses', INITIAL_COURSES));
    setTeacherCourses(getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES));
    
    if (user.department_id) {
      setSelectedDeptId(user.department_id);
      setSelectedDeptFilter(user.department_id);
    } else if (loadedDepts.length > 0) {
      setSelectedDeptId(loadedDepts[0].id);
    }

    // ☁️ المزامنة اللحظية الحية مع Supabase
    syncProfilesFromSupabase().then((liveProfiles) => {
      if (liveProfiles && liveProfiles.length > 0) setProfiles(liveProfiles);
    }).catch(() => {});
    syncDepartmentsFromSupabase().then((liveDepts) => {
      if (liveDepts && liveDepts.length > 0) setDepartments(liveDepts);
    }).catch(() => {});
    syncCoursesFromSupabase().then((liveCourses) => {
      if (liveCourses && liveCourses.length > 0) setCourses(liveCourses);
    }).catch(() => {});
    syncTeacherCoursesFromSupabase().then((liveTCs) => {
      if (liveTCs && liveTCs.length > 0) setTeacherCourses(liveTCs);
    }).catch(() => {});
  }, [router]);

  // ➕ دالة إضافة أستاذ جديد وحفظه فوراً بقاعدة البيانات الرسمية
  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setAddTeacherError(''); // 🧹 تصفير رسائل الخطأ
    if (!fullName || !selectedDeptId) return;

    if (!teacherGender) {
      setAddTeacherError('يرجى تحديد جنس الأستاذ (ذكر أو أنثى)');
      return;
    }

    const dept = departments.find((d) => d.id === selectedDeptId);
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    
    // 📧 البريد الأكاديمي العشوائي 100% الفريد للأستاذ
    const generatedEmail = customTeacherEmail.trim()
      ? (customTeacherEmail.includes('@') ? customTeacherEmail.trim().toLowerCase() : `${customTeacherEmail.trim().toLowerCase()}@sadiq.edu.iq`)
      : generateStrongUniqueEmail('dr', profiles);
    
    // 🛡️ فحص فرادة البريد الأكاديمي للأستاذ ومنع التكرار نهائياً
    const emailCheck = checkEmailUniquenessAcrossSystem(generatedEmail, undefined, profiles); // 🔍 فحص البريد بالنظام
    if (!emailCheck.isUnique) { // ⚠️ إذا كان البريد مستخدم مسبقاً
      setAddTeacherError(emailCheck.errorMessage || 'البريد الإلكتروني مسجل مسبقاً في النظام. يرجى كتابة بريد آخر.'); // 💬 إشعار الأدمن
      return; // 🚫 إيقاف الحفظ فوراً
    }
    
    // 🔑 الرمز المعقد
    const tempPassword = customTeacherPassword.trim() || generateStrongPassword(profiles);

    const newTeacherProfile: UserProfile = {
      id: `usr-tch-${Date.now()}`,
      full_name: fullName,
      role: 'teacher',
      department_id: selectedDeptId,
      department_name: dept?.name || 'القسم',
      university_number: `TCH-${randomCode}`,
      generated_email: generatedEmail,
      temp_password: tempPassword,
      gender: teacherGender!,
      is_active: true,
      must_change_password: true,
      created_at: new Date().toISOString(),
      order_index: 0,
    };

    // ⬆️ وضع الحساب الجديد في البداية فوراً
    const updatedProfiles = [newTeacherProfile, ...profiles.map((p, idx) => ({ ...p, order_index: idx + 1 }))];
    setProfiles(updatedProfiles);
    saveStoredData('profiles', updatedProfiles);
    saveProfileToSupabase(newTeacherProfile); // ☁️ رفع الحساب الجديد لـ Supabase فوراً
    setSortMode('custom');

    // 🔗 ربط الأستاذ بالمواد
    const newTCs: TeacherCourse[] = selectedCourseIds.map((cId) => {
      const cObj = courses.find((c) => c.id === cId);
      return {
        id: `tc-${Date.now()}-${Math.random()}`,
        teacher_id: newTeacherProfile.id,
        teacher_name: newTeacherProfile.full_name,
        course_id: cId,
        course_name: cObj?.name || 'مادة',
        department_id: selectedDeptId,
        semester: cObj?.semester || 1,
      };
    });

    const updatedTCs = [...teacherCourses, ...newTCs];
    setTeacherCourses(updatedTCs);
    saveStoredData('teacher_courses', updatedTCs);
    newTCs.forEach((tc) => saveTeacherCourseToSupabase(tc)); // ☁️ رفع تكليفات المواد لـ Supabase

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('teacher_courses_updated'));
      window.dispatchEvent(new Event('courses_updated'));
      window.dispatchEvent(new Event('profiles_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    // 🔲 حزم بيانات الـ QR
    const qrData = JSON.stringify({
      url: 'http://localhost:3000',
      name: newTeacherProfile.full_name,
      email: generatedEmail,
      pass: tempPassword,
      tch: `TCH-${randomCode}`,
      dept: newTeacherProfile.department_name,
      type: 'sadiq_teacher_card',
    });

    setCreatedTeacherCard({ teacher: newTeacherProfile, qrValue: qrData });
    setFullName('');
    setSelectedCourseIds([]);
    setTeacherGender(null); // 🔄 تصفير جنس الأستاذ
    setShowAddModal(false);
    setSuccessMsg('تم حفظ حساب الأستاذ ووضعه في بداية القائمة بنجاح!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // 🔀 دالة تغيير ترتيب الأستاذ يدوياً (تقديم وتأخير ⬆️ ⬇️)
  const handleMoveTeacher = (currentIndex: number, direction: 'up' | 'down', currentList: UserProfile[], e: React.MouseEvent) => {
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
    setSortMode('custom');
    setSuccessMsg(`تم تغيير ترتيب أستاذ (${itemToMove.full_name}) بنجاح!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ✏️ حفظ التعديلات بقاعدة البيانات
  const handleSaveTeacherEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setEditTeacherError(''); // 🧹 تصفير رسائل الخطأ

    // 🛡️ فحص فرادة البريد الأكاديمي للأستاذ عند التعديل
    if (editEmail.trim()) { // 🔍 إذا كتب بريد للتعديل
      const emailCheck = checkEmailUniquenessAcrossSystem(editEmail.trim(), editingTeacher.id, profiles); // 🔍 فحص البريد مع استثناء الأستاذ نفسه
      if (!emailCheck.isUnique) { // ⚠️ إذا كان البريد محجوز لحساب آخر
        setEditTeacherError(emailCheck.errorMessage || 'البريد الإلكتروني مسجل مسبقاً لمستخدم آخر. يرجى اختيار بريد بديل.'); // 💬 رسالة الخطأ
        return; // 🚫 منع الحفظ
      }
    }

    const dept = departments.find((d) => d.id === editDeptId);

    const updatedProfiles = profiles.map((p) => {
      if (p.id === editingTeacher.id) {
        return {
          ...p,
          full_name: editName,
          generated_email: editEmail,
          temp_password: editPassword,
          department_id: editDeptId,
          department_name: dept?.name || p.department_name,
        };
      }
      return p;
    });

    setProfiles(updatedProfiles);
    saveStoredData('profiles', updatedProfiles);
    const updatedProfile = updatedProfiles.find((p) => p.id === editingTeacher.id);
    if (updatedProfile) {
      saveProfileToSupabase(updatedProfile); // ☁️ تحديث بيانات الأستاذ بالسحابة
    }
    setEditingTeacher(null);
    setSuccessMsg('تم حفظ وتحديث بيانات الأستاذ بقاعدة البيانات بنجاح!');
    setTimeout(() => setSuccessMsg(''), 3000);
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

  // 🗑️ تأكيد حذف أستاذ
  const confirmDeleteTeacher = () => {
    if (!deletingTeacher) return;

    const updatedProfiles = profiles.filter((p) => p.id !== deletingTeacher.id);
    setProfiles(updatedProfiles);
    saveStoredData('profiles', updatedProfiles);
    deleteProfileFromSupabase(deletingTeacher.id, 'teacher'); // ☁️ حذف الأستاذ من سحابة Supabase

    setDeletingTeacher(null);
    setSuccessMsg('تم حذف حساب الأستاذ من قاعدة البيانات بنجاح.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // 🔘 دوال نظام التحديد والإجراءات الجماعية لأساتذة الكلية
  const toggleSelectAll = (list: UserProfile[]) => {
    if (selectedTeacherIds.length === list.length && list.length > 0) {
      setSelectedTeacherIds([]);
    } else {
      setSelectedTeacherIds(list.map((t) => t.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const confirmBulkDeleteTeachers = () => {
    const count = selectedTeacherIds.length;
    if (count === 0) return;

    const updatedProfiles = profiles.filter((p) => !selectedTeacherIds.includes(p.id));
    const updatedTCs = teacherCourses.filter((tc) => !selectedTeacherIds.includes(tc.teacher_id));
    setProfiles(updatedProfiles);
    setTeacherCourses(updatedTCs);
    saveStoredData('profiles', updatedProfiles);
    saveStoredData('teacher_courses', updatedTCs);
    selectedTeacherIds.forEach((id) => deleteProfileFromSupabase(id, 'teacher')); // ☁️ حذف الأساتذة المحددين من Supabase
    setSelectedTeacherIds([]);
    setIsBulkDeleting(false);
    setSuccessMsg(`تم حذف (${count}) من أساتذة الكلية بنجاح.`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleBulkExportExcel = async (list: UserProfile[]) => {
    const selectedTeachersList = list.filter((t) => selectedTeacherIds.includes(t.id));
    if (selectedTeachersList.length === 0) return;

    await exportCustomTeachersList(selectedTeachersList, 'كلية_ميسان');
    setSuccessMsg(`تم تصدير (${selectedTeachersList.length}) أستاذ إلى ملف Excel بنجاح! 📊`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // 📂 رفع واستيراد أساتذة من ملف Excel مع منع التكرار الصارم وتقرير النتائج
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await parseExcelFile(file);
      if (rows.length === 0) {
        setErrorMsg('ملف Excel فارغ أو لا يحتوي على صفوف بيانات صالحة!');
        setTimeout(() => setErrorMsg(''), 4000);
        return;
      }

      const acceptedList: { name: string; dept: string; email: string }[] = [];
      const duplicateList: { name: string; email: string; dept: string; reason: string }[] = [];
      const rejectedList: { rowNumber: number; rawName: string; reason: string }[] = [];

      const importedTeachers: UserProfile[] = [];
      const existingEmails = new Set(profiles.map((p) => (p.generated_email || '').toLowerCase().trim()));

      let rowNum = 1;
      for (const row of rows) {
        rowNum++;
        const name = String(
          row['الاسم الثلاثي واللقب الأكاديمي'] || 
          row['الاسم الكامل'] || 
          row['اسم الأستاذ'] || 
          row['الاسم'] || 
          ''
        ).trim();

        // 1️⃣ فحص الاسم الفارغ
        if (!name) {
          rejectedList.push({
            rowNumber: rowNum,
            rawName: '— (حقل فارغ)',
            reason: 'حقل الاسم الثلاثي واللقب الأكاديمي فارغ في هذا الصف',
          });
          continue;
        }

        const rawDept = String(row['القسم العلمي التابع له'] || row['القسم العلمي'] || row['القسم'] || '').trim();
        let matchedDept = departments.find((d) => d.name.trim() === rawDept);
        if (!matchedDept && rawDept) {
          matchedDept = departments.find((d) => d.name.includes(rawDept) || rawDept.includes(d.name));
        }

        if (!matchedDept && rawDept) {
          rejectedList.push({
            rowNumber: rowNum,
            rawName: name,
            reason: `القسم (${rawDept}) غير معتمد في قائمة الأقسام الرسمية`,
          });
          continue;
        }

        const deptId = matchedDept ? matchedDept.id : (selectedDeptId || departments[0]?.id || 'dept-1');
        const deptName = matchedDept ? matchedDept.name : (departments.find((d) => d.id === deptId)?.name || 'القسم الأكاديمي');

        // 2️⃣ فحص التكرار للبريد
        let email = String(row['البريد الأكاديمي (اختياري)'] || row['البريد الأكاديمي'] || row['البريد'] || '').trim().toLowerCase();
        if (email && existingEmails.has(email)) {
          duplicateList.push({
            name,
            email,
            dept: deptName,
            reason: 'البريد الأكاديمي مسجل مسبقاً في قاعدة البيانات أو مكرر بالملف',
          });
          continue; // 🚫 منع التكرار نهائياً
        }

        // 3️⃣ فحص تكرار الاسم في نفس القسم
        const isDuplicateTeacher = profiles.some(
          (p) => p.full_name.trim() === name && p.department_id === deptId && p.role === 'teacher'
        ) || importedTeachers.some(
          (p) => p.full_name.trim() === name && p.department_id === deptId && p.role === 'teacher'
        );

        if (isDuplicateTeacher) {
          duplicateList.push({
            name,
            email: email || '—',
            dept: deptName,
            reason: `الأستاذ مسجل مسبقاً في الكادر التدريسي لقسم (${deptName})`,
          });
          continue; // 🚫 منع التكرار نهائياً
        }

        if (!email) {
          email = generateStrongUniqueEmail('dr', [...profiles, ...importedTeachers]);
        }
        existingEmails.add(email);

        const pass = String(row['كلمة المرور (اختياري)'] || row['كلمة المرور'] || row['الرمز السري'] || '').trim() || generateStrongPassword();
        const rawGender = String(row['الجنس (ذكر / أنثى)'] || row['الجنس'] || '').trim();
        const gender: 'male' | 'female' = rawGender === 'أنثى' ? 'female' : (rawGender === 'ذكر' ? 'male' : detectArabicGender(name));

        const randomCode = Math.floor(1000 + Math.random() * 9000);
        importedTeachers.push({
          id: `usr-tch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          full_name: name,
          role: 'teacher',
          department_id: deptId,
          department_name: deptName,
          university_number: `TCH-${randomCode}`,
          generated_email: email,
          temp_password: pass,
          gender: gender,
          is_active: true,
          must_change_password: true,
          created_at: new Date().toISOString(),
          order_index: 0,
        });

        acceptedList.push({
          name,
          dept: deptName,
          email,
        });
      }

      if (importedTeachers.length > 0) {
        const combined = [...importedTeachers, ...profiles];
        setProfiles(combined);
        saveStoredData('profiles', combined);
        importedTeachers.forEach((t) => saveProfileToSupabase(t)); // ☁️ حفظ الأساتذة المستوردين في Supabase
        setSuccessMsg(`🎉 تم استيراد (${importedTeachers.length}) أستاذ بنجاح ووضعهم في بداية القائمة!`);
      }

      // 📇 عرض نافذة التقرير الشامل
      setImportReport({
        totalRows: rows.length,
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

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setErrorMsg('حدث خطأ أثناء قراءة ملف Excel! يرجى التأكد من النموذج.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      e.target.value = '';
    }
  };

  const teacherProfiles = profiles.filter((p) => p.role === 'teacher');

  return (
    <div className="space-y-6 font-sans w-full max-w-[1900px] mx-auto px-2 sm:px-4 py-4">
      
      {/* 🔔 التنبيه العائم الفاخر (Light Mode أبيض ناصع) عند إضافة أو تعديل أو حذف أستاذ */}
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
                <p className="font-bold text-sm text-slate-600 mt-0.5">{errorMsg}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* 🏛️ هيدر الصفحة الكحلي عريض الشاشة بحدود ناعمة */}
      <div className="bg-white border border-slate-200 p-6 sm:p-7 rounded-3xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-700" />
            <span>إدارة الكادر التدريسي (الأساتذة)</span>
          </h1>
          <p className="text-base text-slate-700 font-black mt-1.5">
            جامعة الإمام جعفر الصادق (ع) - فرع ميسان | تكليف المواد الأكاديمية وصلاحيات السعي
          </p>
        </div>

        {/* 📥 أزرار الإضافة والطباعة والجداول */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setFullName('');
              setSelectedCourseIds([]);
              setTeacherGender(null); // 🔄 تصفير جنس الأستاذ
              setCustomTeacherEmail('');
              setCustomTeacherPassword('');
              setAddTeacherError('');
              setShowAddModal(true);
            }}
            className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white text-base font-black rounded-2xl transition flex items-center gap-2.5 cursor-pointer shadow-xs border border-[#1e4570]"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة أستاذ جديد</span>
          </button>

          <button
            onClick={() => setShowBatchPrintModal(true)}
            className="px-5 py-3 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-300 text-base font-black rounded-2xl transition flex items-center gap-2.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-5 h-5" />
            <span>طباعة بطاقات الأساتذة</span>
          </button>

          <button
            onClick={() => downloadAdminTeachersTemplate(departments.map(d => ({ id: d.id, name: d.name })))}
            className="px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-900 text-base font-black rounded-2xl border border-slate-300 transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-5 h-5 text-emerald-700" />
            <span>تحميل نموذج Excel المعتمد</span>
          </button>
          
          <label className="px-5 py-3 bg-indigo-700 hover:bg-indigo-800 text-white text-base font-black rounded-2xl transition flex items-center gap-2.5 cursor-pointer shadow-xs">
            <Upload className="w-5 h-5 text-indigo-200" />
            <span>استيراد ملف Excel</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* ✅ تنبيه النجاح بحدود ناعمة */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-400 rounded-2xl flex items-center gap-3 text-emerald-950 text-sm font-black shadow-xs">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-700" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 📝 1. كارت إضافة أستاذ جديد عائم فوق الصفحة (Floating Create Modal) */}
      <FloatingCrudModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setShowTeacherPassword(false);
        }}
        title="إضافة أستاذ جديد وتوليد بياناته الموثقة"
        subtitle="سيتم حفظ البريد المعقد والرمز العشوائي وتزامنهما فوراً بقاعدة البيانات"
        icon={<Plus className="w-6 h-6" />}
        onSubmit={handleAddTeacher}
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setShowTeacherPassword(false);
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl text-sm cursor-pointer border border-slate-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm shadow-md cursor-pointer border border-[#1e4570] active:scale-95"
            >
              حفظ الأستاذ وتوليد البطاقة
            </button>
          </>
        }
      >
        <div className="space-y-4 text-sm font-black">
          {addTeacherError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-black flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{addTeacherError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-950 mb-1.5 font-black text-sm">الاسم الكامل للأستاذ</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="د. أحمد فاضل المحمداوي"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 font-black text-sm placeholder:text-slate-700 focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div className="relative" ref={addDeptDropdownRef}>
              <label className="block text-slate-950 mb-1.5 font-black text-sm">القسم العلمي</label>
              <button
                type="button"
                onClick={() => setIsAddDeptDropdownOpen(!isAddDeptDropdownOpen)}
                className={`w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 border-2 rounded-xl text-slate-950 font-black text-sm flex items-center justify-between transition cursor-pointer ${
                  isAddDeptDropdownOpen ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-700 shrink-0" />
                  <span>{departments.find((d) => d.id === selectedDeptId)?.name || 'اختر قسماً'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform ${isAddDeptDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAddDeptDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-right">
                  {departments.map((d) => {
                    const isSelected = selectedDeptId === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setSelectedDeptId(d.id);
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
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-slate-950 font-black text-sm">الجنس (النوع) *</label>
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-all ${
                  teacherGender === null
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {teacherGender === null ? (
                    <>
                      <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                      <span>غير محدد</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{teacherGender === 'male' ? 'ذكر (أستاذ)' : 'أنثى (أستاذة)'}</span>
                    </>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTeacherGender('male')}
                  className={`py-2.5 px-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                    teacherGender === 'male'
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>ذكر (أستاذ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherGender('female')}
                  className={`py-2.5 px-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                    teacherGender === 'female'
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>أنثى (أستاذة)</span>
                </button>
              </div>
              {teacherGender === null && (
                <p className="text-xs font-bold text-rose-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>يرجى النقر لاختيار جنس الأستاذ (ذكر أو أنثى)</span>
                </p>
              )}
            </div>
          </div>

          {/* ✉️ البريد والرمز السري مع أزرار التوليد المنفصلة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <label className="block text-slate-950 font-black text-sm">البريد الأكاديمي (اختياري)</label>
                <button
                  type="button"
                  onClick={() => setCustomTeacherEmail(generateStrongUniqueEmail('dr', profiles))}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                  title="توليد بريد أكاديمي رسمي فريد للأستاذ"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-700" />
                  <span>توليد بريد فريد</span>
                </button>
              </div>
              <input
                type="text"
                value={customTeacherEmail}
                onChange={(e) => {
                  setCustomTeacherEmail(e.target.value);
                  setAddTeacherError('');
                }}
                placeholder="اتركه فارغاً للتوليد التلقائي أو اضغط الزر"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 font-black text-sm placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none"
                dir="ltr"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <label className="block text-slate-950 font-black text-sm">الرمز السري / كلمة المرور (اختياري)</label>
                <button
                  type="button"
                  onClick={() => setCustomTeacherPassword(generateStrongPassword(profiles))}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                  title="توليد رمز سري عشوائي قوي جداً وغير مكرر نهائياً"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                  <span>توليد رمز عشوائي قوي</span>
                </button>
              </div>
              <div className="relative">
                {/* 🔑 حقل كلمة المرور بنجوم افتراضية للأمان وحشوة للأيقونة */}
                <input
                  type={showTeacherPassword ? 'text' : 'password'}
                  value={customTeacherPassword}
                  onChange={(e) => setCustomTeacherPassword(e.target.value)}
                  placeholder="اتركه فارغاً للتوليد التلقائي أو اضغط الزر"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 font-black text-sm placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none"
                  dir="ltr"
                />
                {/* 👁️ زر إظهار وإخفاء الرمز السري بأيقونة SVG نقية */}
                <button
                  type="button"
                  onClick={() => setShowTeacherPassword((prev) => !prev)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950 p-1.5 rounded-lg hover:bg-slate-200/70 transition cursor-pointer flex items-center justify-center"
                  title={showTeacherPassword ? 'إخفاء الرمز السري' : 'إظهار الرمز السري'}
                  aria-label={showTeacherPassword ? 'إخفاء الرمز السري' : 'إظهار الرمز السري'}
                >
                  {showTeacherPassword ? (
                    <EyeOff className="w-5 h-5 text-slate-700" />
                  ) : (
                    <Eye className="w-5 h-5 text-slate-700" />
                  )}
                </button>
              </div>
            </div>

            {/* ⚠️ شريط تنبيه فرادة البريد يمتد بكامل عرض الكارد بحجم خط متوسط وأيقونة SVG نقية */}
            {customTeacherEmail.trim() && !checkEmailUniquenessAcrossSystem(customTeacherEmail, undefined, profiles).isUnique && (
              <div className="col-span-1 md:col-span-2 p-3 sm:p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center gap-3 text-rose-950 shadow-xs animate-in fade-in duration-200">
                <div className="p-2 bg-rose-200/70 text-rose-700 rounded-xl shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-xs sm:text-sm font-black text-rose-950 leading-relaxed">
                  {checkEmailUniquenessAcrossSystem(customTeacherEmail, undefined, profiles).errorMessage}
                </p>
              </div>
            )}

            {/* 🛡️ صندوق معايير وشروط كلمة المرور الأكاديمية التفاعلي الموحد */}
            {customTeacherPassword && (
              <div className="col-span-1 md:col-span-2">
                <AcademicPasswordStrengthBox password={customTeacherPassword} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-950 mb-2 font-black text-sm">تحديد المواد المكلف بها الأستاذ:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-300">
              {courses.map((c) => (
                <label key={c.id} className="p-3 bg-white rounded-lg border border-slate-300 flex items-center gap-2.5 text-slate-950 font-black cursor-pointer hover:border-slate-950 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedCourseIds.includes(c.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedCourseIds([...selectedCourseIds, c.id]);
                      else setSelectedCourseIds(selectedCourseIds.filter((id) => id !== c.id));
                    }}
                    className="rounded accent-slate-900 w-4 h-4"
                  />
                  <span>{c.name} ({c.department_name})</span>
                </label>
              ))}
            </div>
          </div>

        </div>
      </FloatingCrudModal>

      {/* ✏️ 2. كارت تعديل بيانات أستاذ عائم فوق الصفحة (Floating Update Modal) */}
      <FloatingCrudModal
        isOpen={!!editingTeacher}
        onClose={() => setEditingTeacher(null)}
        title="تعديل حساب وبريد ورمز الأستاذ"
        subtitle="تعديل البريد والرمز والقسم المعتمد وحفظ البيانات مباشرة في قاعدة البيانات"
        icon={<Edit3 className="w-6 h-6" />}
        onSubmit={handleSaveTeacherEdit}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditingTeacher(null)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl text-sm cursor-pointer border border-slate-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm shadow-md cursor-pointer border border-[#1e4570] active:scale-95"
            >
              حفظ وتثبيت التعديلات
            </button>
          </>
        }
      >
        <div className="space-y-4 text-sm font-black">
          {editTeacherError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-black flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{editTeacherError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-950 mb-1.5 font-black text-sm">الاسم الكامل للأستاذ</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-950 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <label className="block text-slate-950 font-black text-sm">البريد الأكاديمي</label>
                <button
                  type="button"
                  onClick={() => setEditEmail(generateStrongUniqueEmail('dr', profiles))}
                  className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-md text-xs font-black flex items-center gap-1 transition cursor-pointer"
                  title="توليد بريد أكاديمي جديد غير مكرر"
                >
                  <Sparkles className="w-3 h-3 text-indigo-700" />
                  <span>توليد بريد فريد</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={editEmail}
                onChange={(e) => {
                  setEditEmail(e.target.value);
                  setEditTeacherError('');
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-950 text-sm focus:border-indigo-600 focus:outline-none"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-slate-950 mb-1.5 font-black text-sm">الجنس (النوع)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditGender('male')}
                  className={`py-2.5 px-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                    editGender === 'male'
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>ذكر (أستاذ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditGender('female')}
                  className={`py-2.5 px-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                    editGender === 'female'
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>أنثى (أستاذة)</span>
                </button>
              </div>
            </div>

            {/* ⚠️ شريط تنبيه فرادة البريد يمتد بكامل عرض الكارد بحجم خط متوسط وأيقونة SVG نقية */}
            {editEmail.trim() && editingTeacher && !checkEmailUniquenessAcrossSystem(editEmail, editingTeacher.id, profiles).isUnique && (
              <div className="col-span-1 md:col-span-3 p-3 sm:p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center gap-3 text-rose-950 shadow-xs animate-in fade-in duration-200">
                <div className="p-2 bg-rose-200/70 text-rose-700 rounded-xl shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-xs sm:text-sm font-black text-rose-950 leading-relaxed">
                  {checkEmailUniquenessAcrossSystem(editEmail, editingTeacher.id, profiles).errorMessage}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <label className="block text-slate-950 font-black text-sm">رمز الدخول / كلمة المرور</label>
                <button
                  type="button"
                  onClick={() => setEditPassword(generateStrongPassword(profiles))}
                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-md text-xs font-black flex items-center gap-1 transition cursor-pointer"
                  title="توليد رمز سري قوي عشوائي جديد غير مكرر"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-700" />
                  <span>توليد رمز عشوائي قوي</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-950 text-sm focus:border-indigo-600 focus:outline-none"
                dir="ltr"
              />
            </div>

            <div className="relative" ref={editDeptDropdownRef}>
              <label className="block text-slate-950 mb-1.5 font-black text-sm">القسم العلمي</label>
              <button
                type="button"
                onClick={() => setIsEditDeptDropdownOpen(!isEditDeptDropdownOpen)}
                className={`w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 border-2 rounded-xl text-slate-950 font-black text-sm flex items-center justify-between transition cursor-pointer ${
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

            {/* 🛡️ صندوق معايير وشروط كلمة المرور الأكاديمية التفاعلي الموحد */}
            {editPassword && (
              <div className="col-span-1 md:col-span-2">
                <AcademicPasswordStrengthBox password={editPassword} />
              </div>
            )}
          </div>

        </div>
      </FloatingCrudModal>

      {/* 🗑️ 3. كارد تأكيد حذف أستاذ احترافي فاخر (ConfirmDeleteModal) */}
      <ConfirmDeleteModal
        isOpen={!!deletingTeacher}
        onClose={() => setDeletingTeacher(null)}
        title="تأكيد حذف حساب الأستاذ الأكاديمي"
        itemName={deletingTeacher?.full_name || 'أستاذ'}
        itemDetails={`الرقم الوظيفي: ${deletingTeacher?.university_number || '—'} | ${deletingTeacher?.department_name || ''}`}
        warningMessage="سيتم إزالة الحساب الرسمي للأستاذ من قاعدة البيانات وإلغاء كافة تكليفاته الأكاديمية بالمواد فوراً."
        onConfirm={confirmDeleteTeacher}
      />

      {/* 🗑️ كارد تأكيد الحذف الجماعي للأساتذة */}
      <ConfirmDeleteModal
        isOpen={isBulkDeleting}
        onClose={() => setIsBulkDeleting(false)}
        title={`تأكيد الحذف الجماعي لـ (${selectedTeacherIds.length}) أساتذة`}
        itemName={`${selectedTeacherIds.length} من كادر الأساتذة`}
        itemDetails="سيتم حذف حسابات الأساتذة المحددين وإلغاء كافة تكليفاته بالمواد في الأقسام فوراً."
        warningMessage="⚠️ تنبيه أمني: هل أنت متأكد من حذف الأساتذة المحددين دفعة واحدة؟ لا يمكن التراجع عن هذه العملية."
        confirmText={`حذف (${selectedTeacherIds.length}) أساتذة نهائياً`}
        onConfirm={confirmBulkDeleteTeachers}
      />

      {/* 🖨️ 4. كارت الطباعة الجماعية (8 بطاقات بالورقة الواحدة A4 بنظام الشبكة 2x4) للأساتذة */}
      {showBatchPrintModal && isMounted && typeof document !== 'undefined' && createPortal((() => {
        const teacherProfiles = profiles.filter((p) => p.role === 'teacher');
        let printList = singlePrintTeacher
          ? [singlePrintTeacher]
          : (selectedTeacherIds.length > 0
              ? teacherProfiles.filter((t) => selectedTeacherIds.includes(t.id))
              : [...teacherProfiles]);

        printList.sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar'));

        return (
          <div 
            id="printable-modal-portal"
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:static print:bg-white print:backdrop-blur-none print:w-full print:h-auto print:min-h-0 print:overflow-visible print:block" 
            dir="rtl"
          >
            <div className="bg-white border-2 border-slate-400 rounded-3xl w-full max-w-7xl max-h-[94vh] shadow-2xl flex flex-col relative overflow-hidden text-right print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none print:overflow-visible print:static print:block print:h-auto">
              
              {/* شريط الأدوات العلوي */}
              <div className="p-4 sm:p-5 border-b-2 border-slate-300 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 z-10 print:hidden no-print">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0F2942] text-cyan-300 rounded-2xl shadow-xs">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-black flex items-center gap-2">
                      <span>معاينة وطباعة بطاقات اعتماد الأساتذة</span>
                      <span className="px-3 py-0.5 rounded-full bg-slate-200 text-black text-xs font-black border border-slate-300">
                        {printList.length} بطاقة (8 بطاقات بالورقة الواحدة A4)
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm font-black text-slate-700">
                      شبكة ثنائية 2x4 فائقة الكفاءة بسطر واحد لكل خانة لتوفير استهلاك الأوراق
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {singlePrintTeacher && (
                    <button
                      type="button"
                      onClick={() => setSinglePrintTeacher(null)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4 text-black" />
                      <span>عرض كافة الأساتذة ({teacherProfiles.length})</span>
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
                      setShowBatchPrintModal(false);
                      setSinglePrintTeacher(null);
                    }}
                    className="p-2.5 bg-slate-200 hover:bg-slate-300 text-black rounded-2xl transition cursor-pointer border border-slate-300"
                    title="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* منطقة الطباعة بنظام الشبكة 2 عمود × 4 صفوف */}
              <div className="p-3 sm:p-5 overflow-y-auto flex-1 overscroll-contain printable-batch-area bg-slate-100 print:bg-white print:p-0 print:overflow-visible print:static print:block print:h-auto">
                {printList.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border-2 border-slate-300 space-y-3 my-6">
                    <AlertCircle className="w-10 h-10 text-indigo-950 mx-auto" />
                    <p className="text-base font-black text-black">لا يوجد أساتذة محددين للطباعة حالياً.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 print:grid-cols-2 print:gap-1.5 w-full cards-grid-8">
                    {printList.map((teacher: UserProfile, index: number) => {
                      const isFemale = (teacher.gender || detectArabicGender(teacher.full_name)) === 'female';
                      const roleTitle = isFemale ? 'أستاذة جامعية' : 'أستاذ جامعي';
                      const currentOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://192.168.0.185:3000';
                      const loginPortalUrl = `${currentOrigin}/teacher`;
                      const loginPortalCleanUrl = loginPortalUrl.replace(/^https?:\/\//, '');
                      const deptName = teacher.department_name || departments.find((d) => d.id === teacher.department_id)?.name || 'القسم العام';

                      return (
                        <div
                          key={teacher.id || index}
                          className="bg-white border border-slate-900 rounded-lg p-2 print:p-1 shadow-xs break-inside-avoid print:break-inside-avoid print:border print:border-slate-950 print:rounded-md print:shadow-none w-full flex flex-col gap-1 print:gap-0.5 card-item-8"
                        >
                          {/* 🏛️ ترويسة البطاقة الرسمية بسطرين متناسقين ومرتبين بجانب الشعار */}
                          <div className="flex items-center justify-between border-b border-slate-900 pb-1 print:pb-0.5">
                            <div className="flex items-center gap-2 overflow-hidden w-full">
                              {/* شعار الجامعة الرسمي */}
                              <div className="relative w-7 h-7 print:w-6 print:h-6 flex-shrink-0">
                                <Image
                                  src="/logo.webp"
                                  alt="شعار جامعة الصادق"
                                  width={28}
                                  height={28}
                                  className="object-contain"
                                  priority
                                  unoptimized
                                />
                              </div>
                              {/* النصوص الرسمية للترويسة بسطرين مرتبين ومنسقين */}
                              <div className="flex flex-col justify-center leading-none min-w-0">
                                <h4 className="text-[11px] print:text-[9.5px] font-black text-black whitespace-nowrap leading-tight">
                                  جامعة الإمام جعفر الصادق (عليه السلام) — فرع ميسان
                                </h4>
                                <p className="text-[9.5px] print:text-[8px] text-slate-700 font-bold whitespace-nowrap leading-tight mt-0.5">
                                  جمهورية العراق — وزارة التعليم العالي والبحث العلمي (مسار بولونيا)
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* 📝 عنوان محضر التسليم بسطر واحد مدمج ومحكم المسافات */}
                          <div className="text-center py-0.5 bg-slate-100 rounded border border-slate-300 flex items-center justify-center gap-1.5 print:py-0.5 whitespace-nowrap shrink-0">
                            <Award className="w-3 h-3 text-indigo-950 shrink-0" />
                            <h5 className="text-[10px] print:text-[9.5px] font-black text-black whitespace-nowrap leading-tight">
                              بطاقة تسليم بيانات الاعتماد الأكاديمي الرسمي ({roleTitle})
                            </h5>
                          </div>

                          {/* 📋 جدول بيانات الاعتماد والتسليم الموزون والواضح جداً للطباعة */}
                          <div className="overflow-hidden border border-slate-900 rounded flex-1 flex flex-col card-table-container">
                            <table className="w-full h-full border-collapse text-right text-xs print:text-[10px] flex-1 table-fixed">
                              <colgroup>
                                <col style={{ width: '16%' }} />
                                <col style={{ width: '28%' }} />
                                <col style={{ width: '17%' }} />
                                <col style={{ width: '39%' }} />
                              </colgroup>
                              <tbody className="h-full">
                                {/* الصف الأول: اسم الأستاذ + الصفة الأكاديمية */}
                                <tr className="border-b border-slate-900 h-1/3">
                                  {/* خانة تسمية الاسم */}
                                  <td className="w-[16%] bg-slate-100 px-1 py-0.5 font-black text-black border-l border-slate-900 whitespace-nowrap shrink-0 align-middle overflow-hidden">
                                    <div className="flex items-center gap-0.5 whitespace-nowrap text-[9px] print:text-[8.5px] font-black text-slate-900">
                                      <User className="w-2.5 h-2.5 print:w-2 print:h-2 text-indigo-950 shrink-0" />
                                      <span>اسم الأستاذ:</span>
                                    </div>
                                  </td>
                                  {/* خانة قيمة الاسم بخط كبير وعريض وواضح جداً */}
                                  <td className="w-[28%] bg-white px-1.5 py-0.5 font-black text-black border-l border-slate-900 align-middle overflow-hidden">
                                    <div className="w-full text-right break-words leading-tight text-xs print:text-[10.5px] font-black text-black">
                                      {teacher.full_name}
                                    </div>
                                  </td>
                                  {/* خانة تسمية الصفة */}
                                  <td className="w-[17%] bg-slate-100 px-1 py-0.5 font-black text-black border-l border-slate-900 whitespace-nowrap shrink-0 align-middle overflow-hidden">
                                    <div className="flex items-center gap-0.5 whitespace-nowrap text-[9px] print:text-[8.5px] font-black text-slate-900">
                                      <Award className="w-2.5 h-2.5 print:w-2 print:h-2 text-indigo-950 shrink-0" />
                                      <span>الصفة:</span>
                                    </div>
                                  </td>
                                  {/* خانة قيمة الصفة بخط بارز وواضح جداً */}
                                  <td className="w-[39%] bg-white px-1.5 py-0.5 font-black text-black align-middle overflow-hidden">
                                    <div className="w-full text-right break-words leading-tight text-xs print:text-[10.5px] font-black text-black">
                                      {isFemale ? 'تدريسية' : 'تدريسي'}
                                    </div>
                                  </td>
                                </tr>

                                {/* الصف الثاني: القسم العلمي + البريد الأكاديمي */}
                                <tr className="border-b border-slate-900 h-1/3">
                                  {/* خانة تسمية القسم العلمي */}
                                  <td className="w-[16%] bg-slate-100 px-1 py-0.5 font-black text-black border-l border-slate-900 whitespace-nowrap shrink-0 align-middle overflow-hidden">
                                    <div className="flex items-center gap-0.5 whitespace-nowrap text-[9px] print:text-[8.5px] font-black text-slate-900">
                                      <Building2 className="w-2.5 h-2.5 print:w-2 print:h-2 text-indigo-950 shrink-0" />
                                      <span>القسم العلمي:</span>
                                    </div>
                                  </td>
                                  {/* خانة قيمة القسم العلمي مضمونة الظهور وبخط واضح جداً */}
                                  <td className="w-[28%] bg-white px-1.5 py-0.5 font-black text-black border-l border-slate-900 align-middle overflow-hidden">
                                    <div className="w-full text-right break-words leading-tight text-xs print:text-[10px] font-black text-black">
                                      {deptName}
                                    </div>
                                  </td>
                                  {/* خانة تسمية البريد الأكاديمي */}
                                  <td className="w-[17%] bg-slate-100 px-1 py-0.5 font-black text-black border-l border-slate-900 whitespace-nowrap shrink-0 align-middle overflow-hidden">
                                    <div className="flex items-center gap-0.5 whitespace-nowrap text-[9px] print:text-[8.5px] font-black text-slate-900">
                                      <Mail className="w-2.5 h-2.5 print:w-2 print:h-2 text-indigo-950 shrink-0" />
                                      <span>البريد الأكاديمي:</span>
                                    </div>
                                  </td>
                                  {/* خانة قيمة البريد الأكاديمي بخط أسود عريض وواضح جداً */}
                                  <td className="w-[39%] bg-white px-1.5 py-0.5 font-black text-black select-all font-mono align-middle overflow-hidden">
                                    <div className="w-full text-left font-mono break-all leading-tight text-[10px] print:text-[9.5px] font-black tracking-tight text-black" dir="ltr">
                                      {teacher.generated_email}
                                    </div>
                                  </td>
                                </tr>

                                {/* الصف الثالث: كلمة المرور + بوابة الدخول */}
                                <tr className="h-1/3">
                                  {/* خانة تسمية كلمة المرور */}
                                  <td className="w-[16%] bg-slate-100 px-1 py-0.5 font-black text-black border-l border-slate-900 whitespace-nowrap shrink-0 align-middle overflow-hidden">
                                    <div className="flex items-center gap-0.5 whitespace-nowrap text-[9px] print:text-[8.5px] font-black text-slate-900">
                                      <KeyRound className="w-2.5 h-2.5 print:w-2 print:h-2 text-indigo-950 shrink-0" />
                                      <span>كلمة المرور:</span>
                                    </div>
                                  </td>
                                  {/* خانة قيمة كلمة المرور بخط كبير جداً 12px وبارز لمنع أي لبس */}
                                  <td className="w-[28%] bg-white px-1.5 py-0.5 font-black text-black select-all font-mono border-l border-slate-900 align-middle overflow-hidden text-center" dir="ltr">
                                    <div className="w-full text-center font-mono break-all leading-tight text-sm print:text-[12px] font-black tracking-wider text-black" dir="ltr">
                                      {teacher.temp_password || '********'}
                                    </div>
                                  </td>
                                  {/* خانة تسمية بوابة الدخول */}
                                  <td className="w-[17%] bg-slate-100 px-1 py-0.5 font-black text-black border-l border-slate-900 whitespace-nowrap shrink-0 align-middle overflow-hidden">
                                    <div className="flex items-center gap-0.5 whitespace-nowrap text-[9px] print:text-[8.5px] font-black text-slate-900">
                                      <Globe className="w-2.5 h-2.5 print:w-2 print:h-2 text-indigo-950 shrink-0" />
                                      <span>بوابة الدخول:</span>
                                    </div>
                                  </td>
                                  {/* خانة قيمة رابط المنصة بخط واضح وأسود عريض */}
                                  <td className="w-[39%] bg-white px-1.5 py-0.5 font-black text-black select-all font-mono align-middle overflow-hidden">
                                    <div className="w-full text-left font-mono break-all leading-tight text-[10px] print:text-[9.5px] font-black tracking-tight text-black" dir="ltr">
                                      {loginPortalCleanUrl}
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
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

      {/* 📊 نافذة تقرير نتائج استيراد Excel للأساتذة (المقبول والمكرر والمرفوض) */}
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
                    تقرير نتائج استيراد ملف Excel للكادر التدريسي ({importReport.totalRows} صف)
                  </h3>
                  <p className="text-sm font-bold text-slate-700">
                    تم فحص كافة البيانات والتحقق الصارم من عدم التكرار
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
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
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
                    <span>قائمة الأساتذة المقبولين والمضافين لقاعدة البيانات بنجاح:</span>
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
                            <span className="text-slate-700">{item.dept}</span>
                          </div>
                          <span className="text-blue-950 bg-blue-100 px-2 py-0.5 rounded border border-blue-200 font-mono text-xs" dir="ltr">
                            {item.email}
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
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    <span>قائمة الحسابات المكررة التي تم استبعادها لحماية البيانات:</span>
                  </h4>
                  {importReport.duplicates.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">رائع! لم يتم رصد أي حسابات مكررة في الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.duplicates.map((item, idx) => (
                        <div key={idx} className="py-2.5 space-y-1 text-sm font-black">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-950 font-black">{item.name} ({item.dept})</span>
                            <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs">
                              تم منعه منعاً للتكرار
                            </span>
                          </div>
                          <p className="text-xs text-rose-900 font-bold">
                            ⚠️ السبب: {item.reason} {item.email !== '—' && `(${item.email})`}
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
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm transition cursor-pointer shadow-xs border border-[#1e4570]"
              >
                إغلاق التقرير ومتابعة العمل
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🔍 شريط البحث والتصفية والترتيب بحسب القسم والجنس */}
      {(() => {
        const teacherProfiles = profiles.filter((p) => p.role === 'teacher');
        const totalTch = teacherProfiles.length;
        const totalMales = teacherProfiles.filter((t) => (t.gender || detectArabicGender(t.full_name)) === 'male').length;
        const totalFemales = totalTch - totalMales;
        const malePct = totalTch > 0 ? Math.round((totalMales / totalTch) * 100) : 0;
        const femalePct = totalTch > 0 ? Math.round((totalFemales / totalTch) * 100) : 0;

        let filteredTeachers = teacherProfiles.filter((t) => {
          const gender = t.gender || detectArabicGender(t.full_name);
          const matchesGender = selectedGenderFilter === 'ALL' || gender === selectedGenderFilter;
          const matchesDept = selectedDeptFilter === 'ALL' || t.department_id === selectedDeptFilter || t.department_name === selectedDeptFilter;
          const matchesSearch = !searchQuery.trim() || 
            t.full_name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
            (t.generated_email || '').toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
            (t.university_number || '').toLowerCase().includes(searchQuery.trim().toLowerCase());
          return matchesGender && matchesDept && matchesSearch;
        });

        // 🔄 تطبيق الترتيب والفرز
        switch (sortMode) {
          case 'newest':
            filteredTeachers.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
            break;
          case 'oldest':
            filteredTeachers.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
            break;
          case 'name_asc':
            filteredTeachers.sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar'));
            break;
          case 'dept_asc':
            filteredTeachers.sort((a, b) => (a.department_name || '').localeCompare(b.department_name || '', 'ar'));
            break;
          case 'courses_desc':
            filteredTeachers.sort((a, b) => {
              const countA = teacherCourses.filter((tc) => tc.teacher_id === a.id).length;
              const countB = teacherCourses.filter((tc) => tc.teacher_id === b.id).length;
              return countB - countA;
            });
            break;
          case 'custom':
          default:
            break;
        }

        return (
          <>
            {/* 📊 شريط التصفية والإحصائيات والترتيب للكادر التدريسي */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                
                {/* 🔍 البحث المباشر */}
                <div className="relative">
                  <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ابحث باسم الأستاذ، البريد، أو الرقم..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-11 py-3.5 text-base font-black bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:border-slate-900 text-slate-950 placeholder:text-slate-400"
                  />
                </div>

                {/* 🏢 تصفية بحسب القسم - قائمة مخصصة */}
                <div className="relative" ref={filterDeptDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsFilterDeptDropdownOpen(!isFilterDeptDropdownOpen)}
                    className={`w-full p-3.5 bg-slate-50 hover:bg-slate-100 border-2 rounded-2xl text-base font-black text-slate-950 flex items-center justify-between transition cursor-pointer ${
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
                          setIsFilterDeptDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
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
                              setIsFilterDeptDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
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

                {/* 📊 ملخص توزيع الذكور والإناث */}
                <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-300 text-base font-black">
                  <span className="text-blue-950 bg-blue-100 px-3.5 py-1.5 rounded-xl border border-blue-300">
                     الذكور: {totalMales} ({malePct}%)
                  </span>
                  <span className="text-rose-950 bg-rose-100 px-3.5 py-1.5 rounded-xl border border-rose-300">
                     الإناث: {totalFemales} ({femalePct}%)
                  </span>
                </div>

              </div>

              {/* 🎓 تبويبات تصفية الجنس (الذكور والإناث) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-300">
                  <span className="text-base font-black text-slate-950 px-2">الجنس:</span>
                  {[
                    { id: 'ALL', label: `الكل (${totalTch})` },
                    { id: 'male', label: `الأساتذة الذكور (${totalMales})` },
                    { id: 'female', label: `الأستاذات الإناث (${totalFemales})` },
                  ].map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGenderFilter(g.id as 'ALL' | 'male' | 'female')}
                      className={`px-4 py-2 rounded-xl text-base font-black transition-all cursor-pointer ${
                        selectedGenderFilter === g.id
                          ? 'bg-[#0F2942] text-white shadow-xs'
                          : 'text-slate-700 hover:text-black hover:bg-slate-200/60 font-black'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                <span className="text-base font-black text-slate-700">
                  المعروض: {filteredTeachers.length} من أصل {totalTch} تدريسي
                </span>
              </div>

              {/* 🔄 أزرار الترتيب والفرز */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2 text-base font-black text-slate-950">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-700" />
                  <span>نمط الترتيب:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSortMode('custom')}
                    className={`px-4 py-2.5 rounded-xl text-base font-black transition-all flex items-center gap-2 cursor-pointer border ${
                      sortMode === 'custom'
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    <span>ترتيب مخصص (الافتراضي)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSortMode('newest')}
                    className={`px-4 py-2.5 rounded-xl text-base font-black transition-all flex items-center gap-2 cursor-pointer border ${
                      sortMode === 'newest'
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>الأحدث أولاً</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSortMode('name_asc')}
                    className={`px-4 py-2.5 rounded-xl text-base font-black transition-all flex items-center gap-2 cursor-pointer border ${
                      sortMode === 'name_asc'
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>أبجدياً (أ - ي)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSortMode('dept_asc')}
                    className={`px-4 py-2.5 rounded-xl text-base font-black transition-all flex items-center gap-2 cursor-pointer border ${
                      sortMode === 'dept_asc'
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>حسب القسم</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSortMode('courses_desc')}
                    className={`px-4 py-2.5 rounded-xl text-base font-black transition-all flex items-center gap-2 cursor-pointer border ${
                      sortMode === 'courses_desc'
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>الأكثر تكليفاً بالمواد</span>
                  </button>
                </div>
              </div>

            </div>

            {/* 📊 5. قائمة الأساتذة الحاليين مع أزرار التقديم والتأخير والكروت العائمة */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-950">قائمة الأساتذة المسجلين بقاعدة البيانات الرسمية للكلية</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(filteredTeachers)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-950 rounded-xl font-black text-sm transition cursor-pointer border border-slate-300"
                  >
                    {selectedTeacherIds.length === filteredTeachers.length && filteredTeachers.length > 0 ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                  </button>
                  <span className="text-base font-black text-slate-950 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-300">
                    المعروض: {filteredTeachers.length} من {totalTch}
                  </span>
                </div>
              </div>

              {/* ⚠️ شريط ذكي لكشف الحسابات المشتركة بنفس البريد وحلها تلقائياً للأساتذة */}
              {(() => {
                const currentDuplicates = detectDuplicateEmails(teacherProfiles);
                if (currentDuplicates.length === 0) return null;

                return (
                  <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-rose-950 shadow-xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-rose-200/60 text-rose-700 rounded-xl">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-rose-950">
                          تنبيه أمني: يوجد ({currentDuplicates.length}) بريد أكاديمي مكرر لأكثر من تدريسي في الكلية!
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
                      <Sparkles className="w-4 h-4 text-rose-200" />
                      <span>فصل الحسابات وتوليد بريد فريد فوراً ⚡</span>
                    </button>
                  </div>
                );
              })()}

              {/* 🎛️ شريط الإجراءات الجماعية الفاخر لأساتذة الكلية */}
              {selectedTeacherIds.length > 0 && (
                <div className="bg-[#0F2942] text-white p-4 sm:px-6 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-[#1e4570] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 text-cyan-300 rounded-xl border border-cyan-400/30">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-black text-base text-white">
                        تم تحديد <strong className="text-cyan-300 font-mono text-lg font-black">({selectedTeacherIds.length})</strong> من أصل <span className="font-mono text-slate-300">({filteredTeachers.length})</span> تدريسي
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
                      <span>حذف المحدد ({selectedTeacherIds.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBulkExportExcel(filteredTeachers)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>تصدير المحدد Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBatchPrintModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Printer className="w-4 h-4" />
                      <span>طباعة بطاقات المحدد ({selectedTeacherIds.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTeacherIds([])}
                      className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-black text-sm transition cursor-pointer"
                    >
                      إلغاء التحديد
                    </button>
                  </div>
                </div>
              )}

              {/* 🧮 حسابات نظام الصفحات لجدول الكادر التدريسي */}
              {(() => {
                const totalTeachersCount = filteredTeachers.length;
                const totalPages = Math.max(1, Math.ceil(totalTeachersCount / pageSize));
                const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
                const startIndex = (safeCurrentPage - 1) * pageSize;
                const paginatedTeachers = filteredTeachers.slice(startIndex, startIndex + pageSize);

                return (
                  <div className="overflow-hidden rounded-3xl border border-slate-300 shadow-xs bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-sm sm:text-base font-black">
                        <thead className="bg-slate-100 text-slate-950 font-black border-b border-slate-300">
                          <tr>
                            {/* 🔘 مربع التحديد */}
                            <th className="p-4 w-12 text-center">
                              <input
                                type="checkbox"
                                aria-label="تحديد كافة الأساتذة"
                                checked={selectedTeacherIds.length === filteredTeachers.length && filteredTeachers.length > 0}
                                onChange={() => toggleSelectAll(filteredTeachers)}
                                className="w-5 h-5 rounded-md border-2 border-slate-400 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                              />
                            </th>
                            {/* 🔢 التسلسل */}
                            <th className="p-4 w-16 text-center text-slate-950 font-black">#</th>
                            {/* 👤 اسم الأستاذ الكامل مع الأفاتار */}
                            <th className="p-4 min-w-[220px] text-slate-950 font-black">اسم الأستاذ / التدريسي الكامل</th>
                            {/* 🚻 الجنس / الرتبة */}
                            <th className="p-4 w-36 text-center text-slate-950 font-black">الجنس / الرتبة</th>
                            {/* 🏢 القسم العلمي */}
                            <th className="p-4 w-48 text-center text-slate-950 font-black">القسم العلمي</th>
                            {/* 📚 المواد المكلف بتدريسها */}
                            <th className="p-4 min-w-[240px] text-center text-slate-950 font-black">المواد المكلف بها</th>
                            {/* 🎛️ الترتيب */}
                            <th className="p-4 w-32 text-center text-slate-950 font-black">الترتيب</th>
                            {/* ⚙️ الإجراءات */}
                            <th className="p-4 w-40 text-center text-slate-950 font-black">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          {paginatedTeachers.map((teacher, index) => {
                            const assignedCourses = teacherCourses.filter((tc) => tc.teacher_id === teacher.id);
                            const gender = teacher.gender || detectArabicGender(teacher.full_name);
                            const isFemale = gender === 'female';
                            const globalIndex = startIndex + index + 1;
                            const isFirst = index === 0 && safeCurrentPage === 1;
                            const isLast = index === paginatedTeachers.length - 1 && safeCurrentPage === totalPages;
                            const isSelected = selectedTeacherIds.includes(teacher.id);

                            return (
                              <tr 
                                key={teacher.id} 
                                className={`hover:bg-slate-50 transition-colors font-black text-slate-950 ${
                                  isSelected ? 'bg-blue-50/70 ring-1 ring-blue-300' : ''
                                }`}
                              >
                                {/* 🔘 مربع التحديد */}
                                <td className="p-4 text-center">
                                  <input
                                    type="checkbox"
                                    aria-label={`تحديد ${teacher.full_name}`}
                                    checked={isSelected}
                                    onChange={() => toggleSelect(teacher.id)}
                                    className="w-5 h-5 rounded-md border-2 border-slate-400 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                                  />
                                </td>

                                {/* 🔢 التسلسل */}
                                <td className="p-4 text-center font-mono text-slate-950 font-black">
                                  {globalIndex}
                                </td>

                                {/* 👤 اسم الأستاذ مع الأفاتار */}
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                                      isFemale ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-blue-50 text-blue-900 border-blue-200'
                                    }`}>
                                      <UserCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <span className="font-black text-slate-950 text-base block">{teacher.full_name}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* 🚻 الجنس والرتبة */}
                                <td className="p-4 text-center">
                                  <span className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-black border inline-block ${
                                    isFemale ? 'bg-rose-100 text-rose-950 border-rose-300' : 'bg-blue-100 text-blue-950 border-blue-300'
                                  }`}>
                                    {isFemale ? 'أستاذة (أنثى)' : 'أستاذ (ذكر)'}
                                  </span>
                                </td>

                                {/* 🏢 القسم العلمي */}
                                <td className="p-4 text-center">
                                  <span className="px-3 py-1 bg-slate-100 text-slate-950 border border-slate-300 rounded-xl text-xs sm:text-sm font-black inline-block">
                                    {teacher.department_name || 'غير محدد'}
                                  </span>
                                </td>

                                {/* 📚 المواد المكلف بتدريسها */}
                                <td className="p-4 text-center">
                                  {assignedCourses.length > 0 ? (
                                    <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xs mx-auto">
                                      <span className="text-emerald-950 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-300 text-xs font-black">
                                        {assignedCourses.length} مواد
                                      </span>
                                      <span className="text-xs text-slate-950 font-bold">
                                        ({assignedCourses.map((c) => c.course_name).join('، ')})
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-950 text-xs font-black bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                      لم تكلف مواد بعد
                                    </span>
                                  )}
                                </td>

                                {/* 🎛️ أزرار التقديم والتأخير */}
                                <td className="p-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => handleMoveTeacher(startIndex + index, 'up', filteredTeachers, e)}
                                      disabled={isFirst}
                                      title="تقديم الأستاذ للأعلى"
                                      className={`p-1.5 rounded-xl border transition cursor-pointer ${
                                        isFirst
                                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-40'
                                          : 'bg-white text-slate-950 border-slate-300 hover:bg-slate-900 hover:text-white shadow-2xs'
                                      }`}
                                    >
                                      <ArrowUp className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleMoveTeacher(startIndex + index, 'down', filteredTeachers, e)}
                                      disabled={isLast}
                                      title="تأخير الأستاذ للأسفل"
                                      className={`p-1.5 rounded-xl border transition cursor-pointer ${
                                        isLast
                                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-40'
                                          : 'bg-white text-slate-950 border-slate-300 hover:bg-slate-900 hover:text-white shadow-2xs'
                                      }`}
                                    >
                                      <ArrowDown className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>

                                {/* ⚙️ الإجراءات (تعديل، حذف) */}
                                <td className="p-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSinglePrintTeacher(teacher);
                                        setShowBatchPrintModal(true);
                                      }}
                                      className="p-2 bg-slate-100 hover:bg-[#0F2942] hover:text-white text-slate-950 rounded-xl transition border border-slate-300 font-black cursor-pointer shadow-2xs"
                                      title="طباعة بطاقة اعتماد الأستاذ (8 بالورقة)"
                                    >
                                      <Printer className="w-4 h-4 text-indigo-950 hover:text-white" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingTeacher(teacher);
                                        setEditName(teacher.full_name);
                                        setEditEmail(teacher.generated_email);
                                        setEditPassword(teacher.temp_password || '');
                                        setEditDeptId(teacher.department_id || (departments[0]?.id || ''));
                                        setEditGender((teacher.gender || detectArabicGender(teacher.full_name)) as 'male' | 'female');
                                      }}
                                      className="p-2 bg-slate-100 hover:bg-[#0F2942] hover:text-white text-slate-950 rounded-xl transition border border-slate-300 font-black cursor-pointer shadow-2xs"
                                      title="تعديل بيانات التدريسي"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setDeletingTeacher(teacher)}
                                      className="p-2 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-900 rounded-xl transition border border-rose-200 font-black cursor-pointer shadow-2xs"
                                      title="حذف التدريسي"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {paginatedTeachers.length === 0 && (
                            <tr>
                              <td colSpan={8} className="p-10 text-center text-slate-950 text-base font-black bg-slate-50">
                                {searchQuery.trim() ? (
                                  <div className="space-y-1">
                                    <p className="text-slate-950 font-black">لم يتم العثور على أستاذ يطابق البحث: &quot;{searchQuery}&quot;</p>
                                    <button 
                                      type="button" 
                                      onClick={() => setSearchQuery('')} 
                                      className="text-blue-900 hover:underline text-xs font-black cursor-pointer"
                                    >
                                      مسح البحث وعرض كافة الأساتذة
                                    </button>
                                  </div>
                                ) : (
                                  <div className="max-w-md mx-auto space-y-3">
                                    <div className="w-14 h-14 bg-blue-50 text-blue-900 border border-blue-200 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                                      <UserCheck className="w-7 h-7 text-blue-900" />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-950">
                                      {profiles.filter((p) => p.role === 'teacher').length === 0 ? 'لا يوجد أساتذة مضافون حتى الآن' : 'لم يتم العثور على أي أستاذ مطابق'}
                                    </h4>
                                    <p className="text-sm font-black text-slate-600 leading-relaxed">
                                      {profiles.filter((p) => p.role === 'teacher').length === 0
                                        ? 'يمكنك إضافة أساتذة القسم يدوياً، أو استيراد القائمة دفعة واحدة من ملف Excel.'
                                        : 'يرجى مراجعة محددات التصفية أو كلمة البحث.'}
                                    </p>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* 📄 شريط نظام الصفحات المتقدم مع القائمة المنسدلة المخصصة الاحترافية */}
                    {totalTeachersCount > 0 && (
                      <div className="p-4 bg-slate-50 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-black">
                        {/* ملخص العرض */}
                        <div className="text-slate-950 font-black">
                          عرض من <span className="text-slate-950 font-black font-mono">{startIndex + 1}</span> إلى{' '}
                          <span className="text-slate-950 font-black font-mono">
                            {Math.min(startIndex + pageSize, totalTeachersCount)}
                          </span>{' '}
                          من إجمالي <span className="text-slate-950 font-black font-mono">{totalTeachersCount}</span> تدريسي
                        </div>

                        {/* أزرار التنقل والقائمة المنسدلة الاحترافية */}
                        <div className="flex items-center gap-2">
                          
                          {/* 🔽 قائمة حجم الصفحة تفتح للأعلى داخل إطار الشاشة والجدول */}
                          <div className="relative" ref={pageSizeDropdownRef}>
                            <button
                              type="button"
                              onClick={() => setIsPageSizeOpen((prev) => !prev)}
                              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer shadow-2xs active:scale-95"
                              title="عدد الأساتذة في الصفحة"
                              aria-expanded={isPageSizeOpen}
                            >
                              <span>{pageSize} أساتذة</span>
                              <ChevronDown className={`w-3.5 h-3.5 text-slate-950 transition-transform duration-200 ${isPageSizeOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isPageSizeOpen && (
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
                                  { value: 50, label: '50 أستاذ' },
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
                            <button
                              type="button"
                              onClick={() => setCurrentPage(1)}
                              disabled={safeCurrentPage <= 1}
                              className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                              title="الصفحة الأولى"
                            >
                              <ChevronsRight className="w-4 h-4 text-slate-950" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                              disabled={safeCurrentPage <= 1}
                              className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                              title="الصفحة السابقة"
                            >
                              <ChevronRight className="w-4 h-4 text-slate-950" />
                            </button>
                            <div className="px-3 py-1.5 bg-[#0F2942] text-white rounded-xl text-xs font-mono font-black shadow-2xs">
                              {safeCurrentPage} / {totalPages}
                            </div>
                            <button
                              type="button"
                              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                              disabled={safeCurrentPage >= totalPages}
                              className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                              title="الصفحة التالية"
                            >
                              <ChevronLeft className="w-4 h-4 text-slate-950" />
                            </button>
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
                );
              })()}

            </div>
          </>
        );
      })()}

    </div>
  );
}

