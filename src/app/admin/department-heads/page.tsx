'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🏢 إدارة رؤساء الأقسام والمقررين (CRUD) - لوحة المسؤول العام - جامعة الإمام جعفر الصادق (ع) فرع ميسان
import { useState, useEffect, useMemo, useRef } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والذاكرة والمراجع
import { useRouter } from 'next/navigation'; // 🛣️ موجه المسارات
import { 
  getStoredData, 
  saveStoredData, 
  INITIAL_PROFILES, 
  INITIAL_DEPARTMENTS, 
  generateStrongUniqueEmail, 
  generateStrongPassword 
} from '@/lib/mock-data'; // 💾 التخزين والمولدات
import { 
  getCurrentSessionUser, 
  saveProfileToSupabase, 
  deleteProfileFromSupabase,
  syncProfilesFromSupabase,
  syncDepartmentsFromSupabase,
  saveDepartmentToSupabase
} from '@/lib/supabase-client'; // 🔌 الجلسة الحالية وحفظ وحذف ومزامنة السحابة الحية
import { UserProfile, Department } from '@/types'; // 🔗 واجهات الأنواع
import { downloadDepartmentHeadsTemplate, parseExcelFile, exportCustomDeptHeadsList, OFFICIAL_COLLEGE_DEPARTMENTS } from '@/lib/excel-utils'; // 📊 استيراد وتصدير إكسل والأقسام الـ 12 المعتمدة
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧬 التعرف الذكي على جنس الاسم
import { 
  checkEmailUniquenessAcrossSystem, 
  detectDuplicateEmails, 
  resolveDuplicateEmailsInProfiles 
} from '@/lib/validation-utils'; // 🛡️ محرك فحص فرادة البريد الأكاديمي الشامل
import { 
  CheckCircle2, 
  AlertTriangle, 
  X 
} from 'lucide-react'; // 🎨 أيقونات التنبيهات العائمة
import ZeroTrustGuard from '@/components/security/ZeroTrustGuard'; // 🛡️ حارس أمان Zero Trust
import DepartmentHeadsPrintModal from '@/components/department-heads/DepartmentHeadsPrintModal'; // 🖨️ مكون نافذة طباعة بطاقات اعتماد القيادات الأكاديمية المستقل
import DepartmentHeadModal from '@/components/department-heads/DepartmentHeadModal'; // 🏛️ مكون مودال إضافة وتعديل رئيس القسم أو المقرر
import ReplaceLeaderConfirmModal, { ReplaceLeaderData } from '@/components/department-heads/ReplaceLeaderConfirmModal'; // ⚠️ مكون مودال تأكيد استبدال القيادات
import DepartmentHeadCardModal from '@/components/department-heads/DepartmentHeadCardModal'; // 📇 بطاقة بيانات الاعتماد
import DepartmentHeadsExcelReportModal, { ImportSummaryReport } from '@/components/department-heads/DepartmentHeadsExcelReportModal'; // 📊 تقرير استيراد إكسل
import DepartmentHeadsExcelInstructionsModal from '@/components/department-heads/DepartmentHeadsExcelInstructionsModal'; // 📘 دليل وضوابط إكسل
import DepartmentHeadsHeader from '@/components/department-heads/DepartmentHeadsHeader'; // 🏷️ هيدر وشريط أدوات الإدارة
import DepartmentHeadsTable from '@/components/department-heads/DepartmentHeadsTable'; // 📋 جدول القيادات والترقيم

export default function DepartmentHeadsManagementPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // 📌 حقول نموذج إضافة / تعديل رئيس قسم أو مقرر
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'department_head' | 'rapporteur' | ''>('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null); // 🚻 حالة تحديد جنس المسؤول الأكاديمي (الافتراضي غير محدد)
  const [genderError, setGenderError] = useState<string>(''); // ⚠️ تنبيه عدم اختيار الجنس
  const [customEmail, setCustomEmail] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [showHeadPassword, setShowHeadPassword] = useState<boolean>(false); // 👁️ إظهار أو إخفاء الرمز السري لرئيس القسم أو المقرر بنجوم أو نص صريح
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'department_head' | 'rapporteur'>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL'); // 🏛️ تصفية واختيار حسب القسم
  const [sortMode, setSortMode] = useState<'custom' | 'newest' | 'oldest' | 'name_asc' | 'dept_asc'>('custom');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCardProfile, setSelectedCardProfile] = useState<UserProfile | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [showExcelInstructions, setShowExcelInstructions] = useState(false);

  // 🖨️ حالات طباعة وتصدير بطاقات اعتماد القيادات الأكاديمية (رؤساء الأقسام والمقررين)
  const [showBatchPrintModal, setShowBatchPrintModal] = useState<boolean>(false); // 🖨️ نافذة المعاينة والطباعة الجماعية
  const [batchPrintDeptFilter, setBatchPrintDeptFilter] = useState<string>('all'); // 🏛️ فلترة الطباعة بالقسم (الكل أو قسم محدد)
  const [singlePrintProfile, setSinglePrintProfile] = useState<UserProfile | null>(null); // 👤 طباعة بطاقة فردية لمسؤول محدد
  const [isPrintDeptDropdownOpen, setIsPrintDeptDropdownOpen] = useState<boolean>(false); // 🔽 حالة فتح القائمة المنسدلة الاحترافية للأقسام
  const printDeptDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع القائمة المنسدلة لإغلاقها عند النقر بالخارج

  // ⚡ حالة التحقق من اكتمال تحميل الصفحة بالعميل لتفعيل البورتال بأمان
  const [isMounted, setIsMounted] = useState<boolean>(false); // 🌐 حالة التثبيت في متصفح العميل
  useEffect(() => { // ⚡ خطاف التحميل الأولي
    setIsMounted(true); // 🚀 تفعيل البورتال بعد اكتمال العرض الأولي
  }, []); // 🔒 يتنفذ مرة واحدة فقط

  // 🖨️ إدارة كلاس الطباعة على جسم الصفحة لضمان خروج وثيقة الطباعة A4 بدون أي مساحات فارغة
  useEffect(() => { // 🔄 مراقبة فتح وإغلاق مودال الطباعة
    if (showBatchPrintModal) { // 🟢 إذا فتحت نافذة المعاينة والطباعة
      document.body.classList.add('print-modal-active'); // 📄 تمكين نمط الطباعة المنعزل على الجسم
      return () => { // 🧹 دالة التنظيف عند الإغلاق
        document.body.classList.remove('print-modal-active'); // 🔒 إزالة الكلاس فور إغلاق نافذة المعاينة
      };
    }
  }, [showBatchPrintModal]); // 🎯 يعتمد حصراً على حالة فتح المودال

  // 📊 نافذة تقرير نتائج استيراد ملف Excel
  const [importReport, setImportReport] = useState<ImportSummaryReport | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<'accepted' | 'duplicates' | 'rejected'>('accepted');

  // ⚠️ حالة نافذة تأكيد استبدال رئيس القسم أو المقرر الحالي
  const [replaceModalData, setReplaceModalData] = useState<ReplaceLeaderData | null>(null);
  const [nameError, setNameError] = useState<string>(''); // ⚠️ تنبيه خطأ الاسم
  const [deletingLeaderProfile, setDeletingLeaderProfile] = useState<UserProfile | null>(null); // 🗑️ حالة مسؤول القسم المراد حذفه
  const [selectedLeaderIds, setSelectedLeaderIds] = useState<string[]>([]); // 🔘 معرفات القيادات المحددة
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false); // 🗑️ حالة نافذة الحذف الجماعي

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 📄 حالات نظام الصفحات (Pagination) المتقدم لجدول رؤساء الأقسام والمقررين
  const [currentPage, setCurrentPage] = useState<number>(1); // 📄 رقم الصفحة الحالية
  const [pageSize, setPageSize] = useState<number>(10); // 📏 عدد المسؤولين في الصفحة الواحدة

  // 📄 تصفير الصفحة للبداية عند تغيير معايير البحث أو التصفية
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRole, selectedDeptFilter, sortMode]);


  // 🔄 تحميل البيانات والتحقق من صلاحية المسؤول العام
  useEffect(() => {
    const user = getCurrentSessionUser();
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
      router.push('/sadmin'); // 🔒 حظر غير المصرح لهم وإعادتهم لصفحة دخول المسؤول العام
      return;
    }

    const loadedProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const loadedDepts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS);
    setProfiles(loadedProfiles);
    setDepartments(loadedDepts);

    // ☁️ مزامنة حية من Supabase للقيادات والأقسام
    syncProfilesFromSupabase().then((liveProfiles) => {
      if (liveProfiles && liveProfiles.length > 0) setProfiles(liveProfiles);
    }).catch(() => {});
    syncDepartmentsFromSupabase().then((liveDepts) => {
      if (liveDepts && liveDepts.length > 0) setDepartments(liveDepts);
    }).catch(() => {});

    // 🏷️ تعيين عنوان المتصفح
    if (typeof document !== 'undefined') {
      document.title = 'إدارة رؤساء ومقرري الأقسام | جامعة الإمام جعفر الصادق (ع) - فرع ميسان';
    }
  }, [router]);

  // 🔀 دالة تغيير الترتيب اليدوي (تقديم وتأخير ⬆️ ⬇️)
  const handleMoveHead = (currentIndex: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedProfiles.length) return;

    const currentList = [...sortedProfiles];
    const itemToMove = currentList[currentIndex];
    currentList[currentIndex] = currentList[targetIndex];
    currentList[targetIndex] = itemToMove;

    const targetIds = new Set(currentList.map(p => p.id));
    const otherProfiles = profiles.filter(p => !targetIds.has(p.id));
    const reindexedList = currentList.map((p, idx) => ({ ...p, order_index: idx }));
    const combined = [...reindexedList, ...otherProfiles];

    setProfiles(combined);
    saveStoredData('profiles', combined);
    setSortMode('custom');
    setSuccessMessage(`تم تغيير ترتيب حساب (${itemToMove.full_name}) بنجاح!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // 📧 دالة توليد بريد أكاديمي رسمي فريد 100% بدون أي تكرار مع كافة مستخدمي النظام
  const handleGenerateUniqueEmail = () => {
    const dept = departments.find((d) => d.id === selectedDeptId);
    let deptPrefix = 'dept';
    if (dept) {
      if (dept.name.includes('تقنيات الحاسوب')) deptPrefix = 'cce';
      else if (dept.name.includes('القانون')) deptPrefix = 'law';
      else if (dept.name.includes('المالية') || dept.name.includes('المصرفية')) deptPrefix = 'fin';
      else if (dept.name.includes('البرمجيات')) deptPrefix = 'ce';
      else if (dept.name.includes('الأعمال')) deptPrefix = 'bus';
      else if (dept.name.includes('المحاسبة')) deptPrefix = 'acc';
      else if (dept.name.includes('الإعلام')) deptPrefix = 'med';
      else if (dept.name.includes('الانكليزية')) deptPrefix = 'eng';
      else if (dept.name.includes('القرآن')) deptPrefix = 'isl';
      else if (dept.name.includes('الطبية')) deptPrefix = 'bme';
      else if (dept.name.includes('الرياضة')) deptPrefix = 'pe';
      else if (dept.name.includes('الديكور') || dept.name.includes('التصميم')) deptPrefix = 'id';
      else if (dept.name.includes('السيبراني')) deptPrefix = 'csec';
      else deptPrefix = dept.code?.toLowerCase() || 'dept';
    }

    const rolePrefix = selectedRole === 'department_head' ? 'head' : 'rap';
    const existingEmails = new Set(profiles.map((p) => (p.generated_email || '').toLowerCase().trim()));

    // 🔒 فحص شامل لضمان عدم وجود البريد إطلاقاً في قاعدة البيانات
    let candidateEmail = `${rolePrefix}.${deptPrefix}@sadiq.edu.iq`;
    let attempts = 0;
    while (existingEmails.has(candidateEmail.toLowerCase()) && attempts < 500) {
      const randNum = Math.floor(100 + Math.random() * 900);
      candidateEmail = `${rolePrefix}.${deptPrefix}.${randNum}@sadiq.edu.iq`;
      attempts++;
    }

    setCustomEmail(candidateEmail);
    setSuccessMessage(`تم توليد بريد أكاديمي فريد 100%: (${candidateEmail})`);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // 🔑 دالة توليد رمز سري عشوائي قوي جداً غير مكرر إطلاقاً في قاعدة البيانات والنظام
  const handleGenerateUniquePassword = () => {
    const existingPasswords = new Set(profiles.map((p) => (p.temp_password || '').trim()).filter(Boolean));
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const specials = '!@#$%^&*';
    const allChars = uppers + lowers + digits + specials;

    let strongPass = '';
    let attempts = 0;
    let isUnique = false;

    while (!isUnique && attempts < 500) {
      attempts++;
      strongPass = 'Sq#';
      for (let i = 0; i < 9; i++) {
        strongPass += allChars.charAt(Math.floor(Math.random() * allChars.length));
      }
      strongPass += '!';
      if (!existingPasswords.has(strongPass)) {
        isUnique = true;
      }
    }

    setCustomPassword(strongPass);
    setSuccessMessage(`🔒 تم توليد رمز سري قوي وفريد بنجاح (غير مكرر 100%)`);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // 🎲 دالة توليد بريد أكاديمي ورمز دخول فريد ومعقد معاً بدون أي تكرار
  const handleAutoGenerateCredentials = () => {
    handleGenerateUniqueEmail();
    handleGenerateUniquePassword();
  };

  // 🔍 تصفية وترتيب رؤساء الأقسام والمقررين
  const sortedProfiles = useMemo(() => {
    let list = profiles.filter((p) => p.role === 'department_head' || p.role === 'rapporteur');

    if (filterRole !== 'ALL') {
      list = list.filter((p) => p.role === filterRole);
    }

    // 🏛️ تصفية واختيار حسب القسم الأكاديمي المحدد من القائمة المنسدلة
    if (selectedDeptFilter !== 'ALL') {
      list = list.filter(
        (p) => p.department_id === selectedDeptFilter || p.department_name === selectedDeptFilter
      );
    }

    if (searchQuery.trim()) {
      const term = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.full_name.toLowerCase().includes(term) ||
          (p.department_name && p.department_name.toLowerCase().includes(term)) ||
          p.generated_email.toLowerCase().includes(term) ||
          p.university_number.toLowerCase().includes(term)
      );
    }

    switch (sortMode) {
      case 'newest':
        return list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      case 'oldest':
        return list.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
      case 'name_asc':
        return list.sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar'));
      case 'dept_asc':
        return list.sort((a, b) => (a.department_name || '').localeCompare(b.department_name || '', 'ar'));
      case 'custom':
      default:
        return list;
    }
  }, [profiles, filterRole, selectedDeptFilter, searchQuery, sortMode]);

  // 💾 دالة الحفظ الفعلي بعد التأكد أو الاستبدال
  const executeProfileSave = (
    name: string,
    role: 'department_head' | 'rapporteur',
    deptId: string,
    email: string,
    password: string,
    gender: 'male' | 'female', // 🚻 جنس المسؤول الأكاديمي
    replaceLeaderId?: string
  ) => {
    // 🛡️ فحص فرادة البريد الإلكتروني قبل الحفظ الفعلي
    const emailCheck = checkEmailUniquenessAcrossSystem(email, replaceLeaderId, profiles); // 🔍 فحص البريد بالنظام
    if (!emailCheck.isUnique) { // ⚠️ إذا كان البريد مأخوذ مسبقاً
      setNameError(emailCheck.errorMessage || 'البريد الإلكتروني مسجل مسبقاً في النظام. يرجى اختيار بريد آخر.'); // 💬 إشعار الأدمن
      return; // 🚫 إيقاف الحفظ
    }

    const dept = departments.find((d) => d.id === deptId);
    const deptName = dept ? dept.name : 'القسم الأكاديمي';
    const isFemale = gender === 'female';
    const roleTitle = role === 'department_head'
      ? (isFemale ? 'رئيسة قسم' : 'رئيس قسم')
      : (isFemale ? 'مقررة قسم' : 'مقرر قسم');
    const randomCode = Math.floor(1000 + Math.random() * 9000);

    const newProfile: UserProfile = {
      id: `usr-${role}-${Date.now()}`,
      full_name: name.trim(),
      role: role,
      gender: gender, // 🚻 حفظ وتثبيت جنس المسؤول
      department_id: deptId,
      department_name: deptName,
      university_number: `${role === 'department_head' ? 'HOD' : 'RAP'}-${randomCode}`,
      generated_email: email,
      temp_password: password,
      is_active: true,
      must_change_password: false,
      created_at: new Date().toISOString(),
      order_index: 0,
    };

    // 🔄 إذا كان هناك قائد سابق تم استبداله، نحوله إلى تدريسي في نفس القسم
    let baseProfiles = [...profiles];
    if (replaceLeaderId) {
      baseProfiles = baseProfiles.map((p) => {
        if (p.id === replaceLeaderId) {
          return {
            ...p,
            role: 'teacher' as const,
          };
        }
        return p;
      });
    }

    // ⬆️ وضع الحساب الجديد في البداية فوراً
    const updatedProfiles = [newProfile, ...baseProfiles];
    setProfiles(updatedProfiles);
    saveStoredData('profiles', updatedProfiles);
    saveProfileToSupabase(newProfile); // ☁️ رفع الحساب إلى Supabase فوراً

    // 🏢 تحديث جدول الأقسام
    const updatedDepts = departments.map((d) => {
      if (d.id === deptId) {
        if (role === 'department_head') {
          return { ...d, head_id: newProfile.id, head_name: newProfile.full_name, head_email: newProfile.generated_email };
        } else {
          return { ...d, rapporteur_id: newProfile.id, rapporteur_name: newProfile.full_name, rapporteur_email: newProfile.generated_email };
        }
      }
      return d;
    });
    setDepartments(updatedDepts);
    saveStoredData('departments', updatedDepts);
    const targetDept = updatedDepts.find((d) => d.id === deptId);
    if (targetDept) {
      saveDepartmentToSupabase(targetDept); // ☁️ حفظ بيانات القيادة في جدول الأقسام سحابياً
    }

    setSelectedCardProfile(newProfile); // 📇 فتح بطاقة الاعتماد
    setSuccessMessage(
      replaceLeaderId
        ? `تم استبدال ${roleTitle} السابق وتعيين (${newProfile.full_name}) ${roleTitle} لقسم (${deptName}) بنجاح!`
        : `تم إنشاء حساب ${roleTitle} وربطه بقسم (${deptName}) بنجاح!`
    );
    setShowAddModal(false);
    setFullName('');
    setCustomEmail('');
    setCustomPassword('');
    setReplaceModalData(null);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // ➕ إضافة أو تعديل رئيس قسم / مقرر مع كشف المسؤول الحالي وإمكانية الاستبدال
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setNameError('يرجى كتابة الاسم الثلاثي واللقب الأكاديمي أولاً.');
      return;
    }
    if (!selectedRole) {
      setNameError('يرجى اختيار الموقع الإداري (رئيس قسم أو مقرر قسم).');
      return;
    }
    if (!selectedDeptId) {
      setNameError('يرجى اختيار القسم الأكاديمي التابع له أولاً.');
      return;
    }
    if (!selectedGender) {
      setGenderError('يرجى تحديد الجنس الأكاديمي (ذكر / أنثى) للمسؤول أولاً.');
      return;
    }
    setGenderError('');
    setNameError('');

    const dept = departments.find((d) => d.id === selectedDeptId);
    const deptName = dept ? dept.name : 'القسم الأكاديمي';
    const roleTitle = selectedRole === 'department_head' ? 'رئيس قسم' : 'مقرر قسم';

    if (editingId) {
      // 🛡️ فحص فرادة البريد الأكاديمي بالتعديل ومنع التكرار
      if (customEmail.trim()) { // 🔍 إذا كتب بريد للتعديل
        const emailCheck = checkEmailUniquenessAcrossSystem(customEmail.trim(), editingId, profiles); // 🔍 فحص البريد مع استثناء الحساب نفسه
        if (!emailCheck.isUnique) { // ⚠️ إذا كان البريد مكرر
          setNameError(emailCheck.errorMessage || 'البريد الإلكتروني مسجل مسبقاً لمستخدم آخر.'); // 💬 رسالة الخطأ
          return; // 🚫 رفض الحفظ
        }
      }

      // ✏️ وضع التعديل
      let editedProfile: UserProfile | null = null;
      const updatedProfiles = profiles.map((p) => {
        if (p.id === editingId) {
          const updated: UserProfile = {
            ...p,
            full_name: fullName.trim(),
            role: selectedRole as 'department_head' | 'rapporteur',
            gender: selectedGender, // 🚻 تحديث وتأكيد جنس المسؤول الأكاديمي
            department_id: selectedDeptId,
            department_name: deptName,
            generated_email: customEmail.trim() ? customEmail.trim().toLowerCase() : p.generated_email,
            temp_password: customPassword.trim() ? customPassword.trim() : p.temp_password,
          };
          editedProfile = updated;
          return updated;
        }
        return p;
      });

      setProfiles(updatedProfiles);
      saveStoredData('profiles', updatedProfiles);
      if (editedProfile) {
        saveProfileToSupabase(editedProfile); // ☁️ رفع التعديل إلى Supabase فوراً
      }

      // 🔄 تحديث بيانات القسم في جدول الأقسام
      const updatedDepts = departments.map((d) => {
        if (d.id === selectedDeptId) {
          if (selectedRole === 'department_head') {
            return { ...d, head_id: editingId, head_name: fullName.trim(), head_email: customEmail.trim() || d.head_email };
          } else {
            return { ...d, rapporteur_id: editingId, rapporteur_name: fullName.trim(), rapporteur_email: customEmail.trim() || d.rapporteur_email };
          }
        }
        return d;
      });
      setDepartments(updatedDepts);
      saveStoredData('departments', updatedDepts);

      setEditingId(null);
      setShowAddModal(false);
      setFullName('');
      setCustomEmail('');
      setCustomPassword('');
      setSuccessMessage('تم تحديث بيانات الحساب الإداري وربطه بالقسم بنجاح!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      // ➕ فحص هل القسم فيه رئيس قسم أو مقرر حالي بالفعل
      const existingLeader = profiles.find(
        (p) => p.department_id === selectedDeptId && p.role === selectedRole
      );

      const prefix = selectedRole === 'department_head' ? 'head' : 'rap';
      let finalEmail = '';
      if (customEmail.trim()) {
        finalEmail = customEmail.includes('@') ? customEmail.trim().toLowerCase() : `${customEmail.trim().toLowerCase()}@sadiq.edu.iq`;
      } else {
        finalEmail = generateStrongUniqueEmail(prefix, profiles);
      }

      // 🛡️ فحص فرادة البريد الأكاديمي قبل الإضافة ومنع التكرار نهائياً
      const emailCheck = checkEmailUniquenessAcrossSystem(finalEmail, undefined, profiles); // 🔍 تدقيق البريد بالنظام
      if (!emailCheck.isUnique) { // ⚠️ إذا كان البريد مكرراً
        setNameError(emailCheck.errorMessage || 'البريد الإلكتروني مسجل مسبقاً في النظام. يرجى اختيار بريد آخر.'); // 💬 إظهار رسالة الرفض
        return; // 🚫 إيقاف الحفظ
      }

      const finalPassword = customPassword.trim() ? customPassword.trim() : generateStrongPassword();

      if (existingLeader) {
        // ⚠️ القسم فيه مسؤول حالي -> فتح نافذة تأكيد الاستبدال
        setReplaceModalData({
          existingLeader,
          roleTitle,
          deptName,
          newProfileData: {
            fullName: fullName.trim(),
            role: selectedRole as 'department_head' | 'rapporteur',
            deptId: selectedDeptId,
            email: finalEmail,
            password: finalPassword,
            gender: selectedGender, // 🚻 تمرير جنس المسؤول الجديد لنافذة الاستبدال
          },
        });
        return;
      }

      // لا يوجد مسؤول حالي -> إضافة مباشرة
      executeProfileSave(fullName.trim(), selectedRole as 'department_head' | 'rapporteur', selectedDeptId, finalEmail, finalPassword, selectedGender);
    }
  };

  // 🗑️ فتح كارد تأكيد حذف حساب رئيس قسم أو مقرر
  const handleDelete = (id: string) => {
    const target = profiles.find((p) => p.id === id);
    if (target) {
      setDeletingLeaderProfile(target);
    }
  };

  // 🗑️ تنفيذ الحذف النهائي بعد التأكيد في الكارد
  const confirmExecuteDeleteLeader = () => {
    if (!deletingLeaderProfile) return;
    const id = deletingLeaderProfile.id;
    const target = deletingLeaderProfile;

    const updatedProfiles = profiles.filter((p) => p.id !== id);
    setProfiles(updatedProfiles);
    saveStoredData('profiles', updatedProfiles);
    deleteProfileFromSupabase(id); // ☁️ حذف الحساب من Supabase فوراً

    // 🏢 إخلاء الخانة من القسم المعني
    if (target && target.department_id) {
      const updatedDepts = departments.map((d) => {
        if (d.id === target.department_id) {
          if (target.role === 'department_head') {
            return { ...d, head_id: undefined, head_name: undefined, head_email: undefined };
          } else if (target.role === 'rapporteur') {
            return { ...d, rapporteur_id: undefined, rapporteur_name: undefined, rapporteur_email: undefined };
          }
        }
        return d;
      });
      setDepartments(updatedDepts);
      saveStoredData('departments', updatedDepts);
      const targetDept = updatedDepts.find((d) => d.id === target.department_id);
      if (targetDept) {
        saveDepartmentToSupabase(targetDept); // ☁️ حفظ إخلاء القسم في Supabase
      }
    }

    setDeletingLeaderProfile(null);
    setSuccessMessage('تم حذف الحساب وفك ارتباطه من القسم بنجاح.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // 🔘 دوال نظام التحديد والإجراءات الجماعية لقيادات الأقسام
  const toggleSelectAll = (list: UserProfile[]) => {
    if (selectedLeaderIds.length === list.length && list.length > 0) {
      setSelectedLeaderIds([]);
    } else {
      setSelectedLeaderIds(list.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedLeaderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const confirmBulkDeleteLeaders = () => {
    const count = selectedLeaderIds.length;
    if (count === 0) return;

    const updatedProfiles = profiles.filter((p) => !selectedLeaderIds.includes(p.id));
    setProfiles(updatedProfiles);
    saveStoredData('profiles', updatedProfiles);

    // 🏢 إخلاء الخانات من الأقسام المعنية
    const updatedDepts = departments.map((d) => {
      let headId = d.head_id;
      let headName = d.head_name;
      let headEmail = d.head_email;
      let rappId = d.rapporteur_id;
      let rappName = d.rapporteur_name;
      let rappEmail = d.rapporteur_email;

      if (headId && selectedLeaderIds.includes(headId)) {
        headId = undefined;
        headName = undefined;
        headEmail = undefined;
      }
      if (rappId && selectedLeaderIds.includes(rappId)) {
        rappId = undefined;
        rappName = undefined;
        rappEmail = undefined;
      }

      return {
        ...d,
        head_id: headId,
        head_name: headName,
        head_email: headEmail,
        rapporteur_id: rappId,
        rapporteur_name: rappName,
        rapporteur_email: rappEmail,
      };
    });

    setDepartments(updatedDepts);
    saveStoredData('departments', updatedDepts);
    updatedDepts.forEach((d) => saveDepartmentToSupabase(d)); // ☁️ مزامنة تحديثات الأقسام في Supabase

    // ☁️ حذف الحسابات من Supabase
    selectedLeaderIds.forEach((id) => deleteProfileFromSupabase(id));

    setSelectedLeaderIds([]);
    setIsBulkDeleting(false);
    setSuccessMessage(`تم حذف (${count}) من مسؤولي الأقسام وفك ارتباطاتهم بنجاح.`);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  const handleBulkExportExcel = async (list: UserProfile[]) => {
    const selectedLeadersList = list.filter((p) => selectedLeaderIds.includes(p.id));
    if (selectedLeadersList.length === 0) return;

    await exportCustomDeptHeadsList(selectedLeadersList, 'كلية_ميسان');
    setSuccessMessage(`تم تصدير (${selectedLeadersList.length}) حساب إداري إلى ملف Excel بنجاح! 📊`);
    setTimeout(() => setSuccessMessage(''), 3500);
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
      setSuccessMessage(`تم بنجاح تصحيح (${fixedCount}) حسابات وفصل البريد الأكاديمي المكرر وتوليد بريد فريد جديد!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  // 🔑 إعادة تعيين وتوليد كلمة مرور جديدة معقدة
  const handleResetPassword = (id: string) => {
    const newPass = generateStrongPassword();
    const updatedProfiles = profiles.map((p) => {
      if (p.id === id) {
        const updated = { ...p, temp_password: newPass };
        setSelectedCardProfile(updated);
        return updated;
      }
      return p;
    });

    setProfiles(updatedProfiles);
    saveStoredData('profiles', updatedProfiles);
    setSuccessMessage('تم توليد كلمة مرور جديدة للحساب بنجاح!');
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // 📋 نسخ بيانات الاعتماد
  const handleCopyCredentials = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 📥 تنزيل نموذج Excel العربي المعتمد مع التعليمات وتاريخ التنزيل
  const handleDownloadTemplate = async () => {
    await downloadDepartmentHeadsTemplate(departments.map(d => ({ id: d.id, name: d.name })));
    setSuccessMessage('تم تنزيل نموذج إكسل المعتمد بنجاح مع تلوين الصف الأول وحسابات فريدة لكل قسم!');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // 📤 رفع واستيراد ملف Excel مع منع التكرار 100% وإظهار التقرير التفصيلي
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImportingExcel(true);
      const rows = await parseExcelFile(file);

      if (rows.length === 0) {
        setErrorMessage('ملف Excel فارغ أو لا يحتوي على صفوف بيانات صالحة!');
        setTimeout(() => setErrorMessage(''), 4000);
        setIsImportingExcel(false);
        return;
      }

      const acceptedList: { name: string; role: string; dept: string; email: string }[] = [];
      const duplicateList: { name: string; email: string; role: string; dept: string; reason: string }[] = [];
      const rejectedList: { rowNumber: number; rawName: string; reason: string }[] = [];
      
      const newProfilesToAdd: UserProfile[] = [];
      const updatedDepts = [...departments];
      const existingEmails = new Set(profiles.map(p => (p.generated_email || '').toLowerCase().trim()));

      let rowNumber = 1;
      for (const row of rows) {
        rowNumber++;
        const rawName = String(
          row['الاسم الثلاثي واللقب الأكاديمي'] || 
          row['الاسم الكامل'] || 
          row['اسم التدريسي'] || 
          row['الاسم'] || 
          ''
        ).trim();

        // 1️⃣ فحص الاسم الفارغ -> مرفوض
        if (!rawName) {
          rejectedList.push({
            rowNumber,
            rawName: '— (حقل فارغ)',
            reason: 'حقل الاسم الثلاثي واللقب الأكاديمي فارغ في هذا الصف',
          });
          continue;
        }

        const rawRole = String(row['الموقع الإداري'] || row['الموقع'] || row['الدور'] || '').trim();
        const role: 'department_head' | 'rapporteur' = rawRole.includes('رئيس') ? 'department_head' : 'rapporteur';
        const roleTitle = role === 'department_head' ? 'رئيس قسم' : 'مقرر قسم';

        const rawDept = String(row['القسم العلمي التابع له'] || row['القسم العلمي'] || row['القسم'] || '').trim();
        
        // 🏢 مطابقة القسم العلمي بالاسم العربي
        let matchedDept = updatedDepts.find(d => d.name.trim() === rawDept);
        if (!matchedDept && rawDept) {
          matchedDept = updatedDepts.find(d => d.name.includes(rawDept) || rawDept.includes(d.name));
        }

        // 🏛️ إذا لم يكن القسم منشأ مسبقاً، نتحقق من مطابقته مع الأقسام الـ 12 الرسمية وننشئه فوراً
        if (!matchedDept && rawDept) {
          const cleanRaw = rawDept.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
          const official = OFFICIAL_COLLEGE_DEPARTMENTS.find(od => {
            const cleanOfficial = od.name.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
            return cleanOfficial === cleanRaw || cleanOfficial.includes(cleanRaw) || cleanRaw.includes(cleanOfficial);
          });

          if (official) {
            const newDept: Department = {
              id: `dept-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: official.name,
              code: official.code,
              order_index: updatedDepts.length,
              created_at: new Date().toISOString(),
            };
            updatedDepts.push(newDept);
            matchedDept = newDept;
            saveDepartmentToSupabase(newDept); // ☁️ حفظ القسم الجديد في Supabase سحابياً
          }
        }

        if (!matchedDept && rawDept) {
          rejectedList.push({
            rowNumber,
            rawName,
            reason: `القسم (${rawDept}) غير معتمد في قائمة الأقسام الرسمية`,
          });
          continue;
        }

        const deptId = matchedDept ? matchedDept.id : (updatedDepts[0]?.id || 'dept-1');
        const deptName = matchedDept ? matchedDept.name : (updatedDepts[0]?.name || 'القسم الأكاديمي');

        // 2️⃣ فحص التكرار الصارم للبريد المكتوب يدوياً
        let email = String(row['البريد الأكاديمي (اختياري)'] || row['البريد الأكاديمي'] || row['البريد'] || '').trim().toLowerCase();
        
        if (email && existingEmails.has(email)) {
          duplicateList.push({
            name: rawName,
            email,
            role: roleTitle,
            dept: deptName,
            reason: 'البريد الأكاديمي مسجل مسبقاً لمستخدم آخر في قاعدة البيانات أو مكرر في الملف',
          });
          continue; // 🚫 منع التكرار نهائياً
        }

        // 3️⃣ فحص هل نفس الاسم ونفس الموقع مضاف مسبقاً لنفس القسم
        const isDuplicateLeader = profiles.some(
          p => p.full_name.trim() === rawName && p.department_id === deptId && p.role === role
        ) || newProfilesToAdd.some(
          p => p.full_name.trim() === rawName && p.department_id === deptId && p.role === role
        );

        if (isDuplicateLeader) {
          duplicateList.push({
            name: rawName,
            email: email || '—',
            role: roleTitle,
            dept: deptName,
            reason: `الأستاذ مسجل مسبقاً في النظام كـ ${roleTitle} لقسم (${deptName})`,
          });
          continue; // 🚫 منع التكرار نهائياً
        }

        // توليد بريد فريد إذا لم يُكتب
        if (!email) {
          const prefix = role === 'department_head' ? 'head' : 'rap';
          email = generateStrongUniqueEmail(prefix, [...profiles, ...newProfilesToAdd]);
        }
        existingEmails.add(email);

        // 🔑 كلمة المرور
        const password = String(row['كلمة المرور (اختياري)'] || row['كلمة المرور'] || row['الرمز السري'] || '').trim() || generateStrongPassword();

        // ⚧ الجنس
        const rawGender = String(row['الجنس (ذكر / أنثى)'] || row['الجنس'] || '').trim();
        const gender: 'male' | 'female' = rawGender === 'أنثى' ? 'female' : (rawGender === 'ذكر' ? 'male' : detectArabicGender(rawName));

        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const newProf: UserProfile = {
          id: `usr-${role}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          full_name: rawName,
          role: role,
          department_id: deptId,
          department_name: deptName,
          university_number: `${role === 'department_head' ? 'HOD' : 'RAP'}-${randomCode}`,
          generated_email: email,
          temp_password: password,
          gender: gender,
          is_active: true,
          must_change_password: false,
          created_at: new Date().toISOString(),
          order_index: 0,
        };

        newProfilesToAdd.push(newProf);
        acceptedList.push({
          name: rawName,
          role: roleTitle,
          dept: deptName,
          email: email,
        });

        // 🏢 تحديث جدول الأقسام
        const deptIdx = updatedDepts.findIndex(d => d.id === deptId);
        if (deptIdx !== -1) {
          if (role === 'department_head') {
            updatedDepts[deptIdx] = {
              ...updatedDepts[deptIdx],
              head_id: newProf.id,
              head_name: newProf.full_name,
              head_email: newProf.generated_email,
            };
          } else {
            updatedDepts[deptIdx] = {
              ...updatedDepts[deptIdx],
              rapporteur_id: newProf.id,
              rapporteur_name: newProf.full_name,
              rapporteur_email: newProf.generated_email,
            };
          }
        }
      }

      // 💾 حفظ المقبولين فقط في قاعدة البيانات
      if (newProfilesToAdd.length > 0) {
        const combined = [...newProfilesToAdd, ...profiles];
        setProfiles(combined);
        saveStoredData('profiles', combined);

        setDepartments(updatedDepts);
        saveStoredData('departments', updatedDepts);
      }

      // 📇 فتح نافذة التقرير الشامل للمستخدم
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

    } catch (err) {
      console.error('خطأ أثناء قراءة ملف Excel:', err);
      setErrorMessage('حدث خطأ أثناء قراءة ملف Excel. يرجى التأكد من استخدام النموذج المعتمد.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsImportingExcel(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const selectedDepartmentObj = departments.find(d => d.id === selectedDeptId);

  return (
    <ZeroTrustGuard allowedRoles={['super_admin', 'admin']} redirectFallback="/sadmin">
      {/* 🏛️ الحاوية العريضة لتقليل المساحات الجانبية الفارغة */}
      <div className="space-y-6 font-sans w-full max-w-[1900px] mx-auto px-2 sm:px-4 py-4" dir="rtl">
      
        {/* 🔔 التنبيه العائم الفاخر عند إضافة أو تعديل أو حذف رئيس قسم أو مقرر */}
        {successMessage && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200">
            <div className="p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-emerald-500/80 ring-4 ring-emerald-400/10 flex items-center justify-between gap-4 backdrop-blur-xl">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 border-2 border-emerald-300 rounded-2xl shadow-2xs shrink-0">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="text-right">
                  <h4 className="font-black text-base text-slate-950">إشعار النظام الأكاديمي</h4>
                  <p className="font-black text-sm text-slate-950 mt-0.5">{successMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage('')}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 hover:text-slate-900 border border-slate-300 flex items-center justify-center transition cursor-pointer shrink-0"
                title="إغلاق التنبيه"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* ⚠️ تنبيه الخطأ العائم الفاخر */}
        {errorMessage && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200">
            <div className="p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-rose-500/80 ring-4 ring-rose-400/10 flex items-center justify-between gap-4 backdrop-blur-xl">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-rose-50 text-rose-700 border-2 border-rose-300 rounded-2xl shadow-2xs shrink-0">
                  <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="text-right">
                  <h4 className="font-black text-base text-slate-950">تنبيه النظام الأكاديمي</h4>
                  <p className="font-black text-sm text-slate-950 mt-0.5">{errorMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 hover:text-slate-900 border border-slate-300 flex items-center justify-center transition cursor-pointer shrink-0"
                title="إغلاق التنبيه"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* 🏛️ الهيدر الكحلي الإداري والعمليات السريعة واستيراد Excel */}
        <DepartmentHeadsHeader
          departmentsCount={departments.length}
          onOpenAddModal={() => {
            setEditingId(null);
            setFullName('');
            setCustomEmail('');
            setCustomPassword('');
            setSelectedRole('');
            setSelectedDeptId('');
            setSelectedGender(null);
            setNameError('');
            setGenderError('');
            setShowAddModal(true);
          }}
          onDownloadTemplate={handleDownloadTemplate}
          onImportExcel={handleImportExcel}
          isImportingExcel={isImportingExcel}
          fileInputRef={fileInputRef}
          onOpenExcelInstructions={() => setShowExcelInstructions(true)}
          onOpenPrintModal={() => {
            setBatchPrintDeptFilter('all');
            setSinglePrintProfile(null);
            setShowBatchPrintModal(true);
          }}
        />

        {/* 📊 نافذة تقرير نتائج استيراد Excel (المقبول والمكرر والمرفوض) */}
        {importReport && (
          <DepartmentHeadsExcelReportModal
            report={importReport}
            activeReportTab={activeReportTab}
            setActiveReportTab={setActiveReportTab}
            onClose={() => setImportReport(null)}
          />
        )}

        {/* 🏛️ 🎛️ مودال إضافة وتعديل رئيس القسم والمقرر وربطه بالقسم */}
        <DepartmentHeadModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingId(null);
          }}
          editingId={editingId}
          fullName={fullName}
          setFullName={setFullName}
          nameError={nameError}
          setNameError={setNameError}
          selectedGender={selectedGender}
          setSelectedGender={setSelectedGender}
          genderError={genderError}
          setGenderError={setGenderError}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          selectedDeptId={selectedDeptId}
          setSelectedDeptId={setSelectedDeptId}
          departments={departments}
          customEmail={customEmail}
          setCustomEmail={setCustomEmail}
          customPassword={customPassword}
          setCustomPassword={setCustomPassword}
          showHeadPassword={showHeadPassword}
          setShowHeadPassword={setShowHeadPassword}
          handleAutoGenerateCredentials={handleAutoGenerateCredentials}
          handleGenerateUniqueEmail={handleGenerateUniqueEmail}
          handleGenerateUniquePassword={handleGenerateUniquePassword}
          handleSave={handleSave}
          profiles={profiles}
        />

        {/* ⚠️ مودال تأكيد استبدال المسؤول الحالي بالقسم */}
        <ReplaceLeaderConfirmModal
          data={replaceModalData}
          onClose={() => setReplaceModalData(null)}
          onConfirm={executeProfileSave}
        />

        {/* 📇 نافذة / بطاقة الاعتماد الأكاديمي الرسمية */}
        {selectedCardProfile && (
          <DepartmentHeadCardModal
            profile={selectedCardProfile}
            onClose={() => setSelectedCardProfile(null)}
            onPrint={(profile) => {
              setSinglePrintProfile(profile);
              setShowBatchPrintModal(true);
            }}
            onCopyCredentials={handleCopyCredentials}
            copiedId={copiedId}
          />
        )}

        {/* 📋 جدول الحسابات الإدارية المسجلة مع شريط الترتيب والفرز والترقيم */}
        <DepartmentHeadsTable
          profiles={profiles}
          departments={departments}
          sortedProfiles={sortedProfiles}
          filterRole={filterRole}
          setFilterRole={setFilterRole}
          selectedDeptFilter={selectedDeptFilter}
          setSelectedDeptFilter={setSelectedDeptFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortMode={sortMode}
          setSortMode={setSortMode}
          selectedLeaderIds={selectedLeaderIds}
          setSelectedLeaderIds={setSelectedLeaderIds}
          toggleSelect={toggleSelect}
          toggleSelectAll={toggleSelectAll}
          handleMoveHead={handleMoveHead}
          onSelectCard={(p) => setSelectedCardProfile(p)}
          onSelectPrint={(p) => {
            setSinglePrintProfile(p);
            setShowBatchPrintModal(true);
          }}
          onEdit={(p) => {
            setEditingId(p.id);
            setFullName(p.full_name);
            setSelectedRole(p.role as 'department_head' | 'rapporteur');
            if (p.department_id) setSelectedDeptId(p.department_id);
            setCustomEmail(p.generated_email || '');
            setCustomPassword(p.temp_password || '');
            setSelectedGender(p.gender || null);
            setGenderError('');
            setShowAddModal(true);
          }}
          onDelete={(id) => handleDelete(id)}
          handleFixDuplicateEmails={handleFixDuplicateEmails}
          handleBulkExportExcel={handleBulkExportExcel}
          confirmBulkDeleteLeaders={confirmBulkDeleteLeaders}
          isBulkDeleting={isBulkDeleting}
          setIsBulkDeleting={setIsBulkDeleting}
          deletingLeaderProfile={deletingLeaderProfile}
          setDeletingLeaderProfile={setDeletingLeaderProfile}
          confirmExecuteDeleteLeader={confirmExecuteDeleteLeader}
          pageSize={pageSize}
          setPageSize={setPageSize}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onOpenAddModal={() => {
            setFullName('');
            setCustomEmail('');
            setCustomPassword('');
            setSelectedGender(null);
            setGenderError('');
            setEditingId(null);
            setShowAddModal(true);
          }}
          handleImportExcel={handleImportExcel}
          isImportingExcel={isImportingExcel}
        />

        {/* 📘 كارد تعليمات وضوابط نموذج Excel الفاخر */}
        <DepartmentHeadsExcelInstructionsModal
          isOpen={showExcelInstructions}
          onClose={() => setShowExcelInstructions(false)}
          onDownloadTemplate={handleDownloadTemplate}
        />

        {/* 🖨️ نافذة معاينة وطباعة بطاقات اعتماد وتسليم الحسابات لرؤساء ومقرري الأقسام */}
        <DepartmentHeadsPrintModal
          isOpen={showBatchPrintModal}
          onClose={() => {
            setShowBatchPrintModal(false);
            setSinglePrintProfile(null);
          }}
          isMounted={isMounted}
          profiles={profiles}
          departments={departments}
          singlePrintProfile={singlePrintProfile}
          setSinglePrintProfile={setSinglePrintProfile}
          batchPrintDeptFilter={batchPrintDeptFilter}
          setBatchPrintDeptFilter={setBatchPrintDeptFilter}
        />

      </div>
    </ZeroTrustGuard>
  );
}
