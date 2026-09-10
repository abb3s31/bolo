// 🎓 خطاف مخصص لإدارة شؤون طلبة القسم (إضافة، تعديل، حذف، ترقية، استيراد وتصدير إكسل، معالجة تكرار البريد)
// 🛡️ التزام نمطي صارم بدون any أو unknown مع توثيق عراقي تفصيلي لكل سطر

import { useState, useMemo, useRef } from 'react'; // ⚛️ استيراد خطافات رياكت الأساسية
import type { UserProfile } from '@/types'; // 📚 استيراد واجهة المستخدم الأكاديمي
import type { DepartmentDeleteModalConfig, ImportSummaryReport } from '../types'; // 🏷️ استيراد واجهات البوابة المشتركة
import { calculateSmartDropdownPosition, type SmartDropdownPosition } from '../dropdownUtils'; // 📐 حساب الموضع الذكي للقائمة
import { saveStoredData, generateStrongUniqueEmail, generateStrongPassword } from '@/lib/mock-data'; // 💾 حفظ البيانات ومولدات الحسابات
import { checkEmailUniquenessAcrossSystem, resolveDuplicateEmailsInProfiles } from '@/lib/validation-utils'; // 🛡️ محرك فحص الفرادة ومعالجة التكرار
import { saveProfileToSupabase, deleteProfileFromSupabase } from '@/lib/supabase-client'; // ☁️ المزامنة السحابية مع Supabase
import { detectArabicGender } from '@/lib/demographics-utils'; // 🚻 خوارزمية كشف الجنس من الاسم العربي
import { downloadDepartmentStudentsTemplate, parseExcelFile, exportCustomStudentsList } from '@/lib/excel-utils'; // 📊 دوال التعامل مع الإكسل
import { sendAppNotification } from '@/lib/notification-utils'; // 🔔 مركز الإشعارات

// 📋 واجهة مدخلات خطاف طلاب القسم
export interface UseDepartmentStudentsProps {
  currentDeptId: string; // 🏛️ معرف القسم الأكاديمي الحالي
  deptName: string; // 🏷️ اسم القسم الأكاديمي
  profiles: UserProfile[]; // 👥 كافة المستخدمين في النظام
  setProfiles: React.Dispatch<React.SetStateAction<UserProfile[]>>; // 🔄 دالة تحديث المستخدمين
  academicYear: string; // 📅 السنة الأكاديمية الحالية
  setSuccessMessage: (msg: string) => void; // ✨ دالة إشعار النجاح
  setErrorMessage: (msg: string) => void; // ⚠️ دالة إشعار الخطأ
  setDeleteModalConfig: React.Dispatch<React.SetStateAction<DepartmentDeleteModalConfig>>; // 🗑️ دالة إعداد نافذة الحذف
  setSelectedCardProfile: (p: UserProfile | null) => void; // 📇 دالة تعيين الحساب المعروض بالبطاقة
}

// 🎯 دالة الخطاف الرئيسية لإدارة شؤون طلبة القسم
export const useDepartmentStudents = ({
  currentDeptId, // 🏛️ معرف القسم
  deptName, // 🏷️ اسم القسم
  profiles, // 👥 الحسابات
  setProfiles, // 🔄 تحديث الحسابات
  academicYear, // 📅 السنة الأكاديمية
  setSuccessMessage, // ✨ رسالة النجاح
  setErrorMessage, // ⚠️ رسالة الخطأ
  setDeleteModalConfig, // 🗑️ نافذة الحذف
  setSelectedCardProfile, // 📇 بطاقة الطالب
}: UseDepartmentStudentsProps) => {
  // 👤 حقول نموذج الطالب
  const [studentName, setStudentName] = useState<string>(''); // 👤 اسم الطالب الثلاثي أو الرباعي
  const [studentStage, setStudentStage] = useState<number | null>(null); // 🎓 المرحلة الدراسية (1-4)
  const [studentGender, setStudentGender] = useState<'male' | 'female' | null>(null); // 🚻 الجنس
  const [studentStudyType, setStudentStudyType] = useState<'morning' | 'evening' | null>(null); // ☀️ الفترة (صباحي / مسائي)
  const [customStudentEmail, setCustomStudentEmail] = useState<string>(''); // ✉️ البريد المخصص
  const [customStudentPassword, setCustomStudentPassword] = useState<string>(''); // 🔑 الرمز المخصص
  const [showStudentPassword, setShowStudentPassword] = useState<boolean>(false); // 👁️ إظهار أو إخفاء الرمز
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null); // ✏️ معرف الطالب الجاري تعديله
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false); // 📦 حالة فتح نافذة الطالب
  const [studentNameError, setStudentNameError] = useState<string>(''); // ⚠️ خطأ التحقق من الاسم

  // 🔍 حالات التصفية والبحث
  const [studentSearch, setStudentSearch] = useState<string>(''); // 🔍 نص البحث
  const [filterStudentStage, setFilterStudentStage] = useState<number | 'all'>('all'); // 🎓 فلتر المرحلة
  const [filterStudentStudyType, setFilterStudentStudyType] = useState<'all' | 'morning' | 'evening'>('all'); // ☀️ فلتر الدراسة

  // 📊 حالات استيراد ملفات الإكسل
  const [showStudentExcelInstructions, setShowStudentExcelInstructions] = useState<boolean>(false); // ℹ️ تعليمات الإكسل
  const [isImportingStudentExcel, setIsImportingStudentExcel] = useState<boolean>(false); // ⏳ مؤشر تحميل الاستيراد
  const [studentImportReport, setStudentImportReport] = useState<ImportSummaryReport | null>(null); // 📑 تقرير الاستيراد
  const [studentActiveReportTab, setStudentActiveReportTab] = useState<'accepted' | 'duplicates' | 'rejected'>('accepted'); // 📑 تبويب التقرير النشط

  // 👥 حالات التحديد والتنقل
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]); // 🔘 معرفات الطلبة المحددين
  const [studentPage, setStudentPage] = useState<number>(1); // 📄 الصفحة الحالية
  const [studentPageSize, setStudentPageSize] = useState<number>(10); // 📏 عدد الطلبة في الصفحة
  const [isExportingStudentsExcel, setIsExportingStudentsExcel] = useState<boolean>(false); // ⏳ مؤشر تصدير الإكسل

  // 🚀 حالات الترحيل الجماعي للمراحل
  const [isBulkPromotionModalOpen, setIsBulkPromotionModalOpen] = useState<boolean>(false); // 🪟 نافذة الترحيل الجماعي
  const [bulkPromoteSourceStage, setBulkPromoteSourceStage] = useState<number>(1); // 🔢 المرحلة المصدر المراد ترحيلها

  // 🔽 قائمة اختيار المرحلة المنسدلة الذكية
  const [isStudentStageDropdownOpen, setIsStudentStageDropdownOpen] = useState<boolean>(false); // 🔓 حالة فتح القائمة
  const [stageDropdownCoords, setStageDropdownCoords] = useState<SmartDropdownPosition | null>(null); // 📐 إحداثيات القائمة
  const stageButtonRef = useRef<HTMLButtonElement | null>(null); // 🔘 مرجع زر القائمة

  // 🖨️ حالات طباعة بطاقات اعتماد الطلبة
  const [showStudentPrintModal, setShowStudentPrintModal] = useState<boolean>(false); // 🖨️ فتح نافذة الطباعة
  const [singleStudentPrintProfile, setSingleStudentPrintProfile] = useState<UserProfile | null>(null); // 👤 طالب مفرد للطباعة
  const [studentPrintStageFilter, setStudentPrintStageFilter] = useState<number | 'all'>('all'); // 🎓 فلتر مرحلة الطباعة
  const [studentPrintStudyFilter, setStudentPrintStudyFilter] = useState<'all' | 'morning' | 'evening'>('all'); // ☀️ فلتر دراسة الطباعة

  // 🔐 شروط ومعايير كلمة المرور التفاعلية للطالب
  const studentPasswordCriteria = useMemo(() => {
    const p = customStudentPassword || ''; // 📝 نص كلمة المرور الحالية للطالب
    return {
      length: p.length >= 8, // 📏 طول كلمة المرور 8 محارف على الأقل
      hasUpper: /[A-Z]/.test(p), // 🔠 وجود حرف كبير إنجليزي
      hasNumber: /[0-9]/.test(p), // 🔢 وجود رقم
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(p), // 🔣 وجود رمز خاص
    };
  }, [customStudentPassword]); // 🔄 إعادة الاحتساب عند تغير رمز الطالب

  // 💯 حساب درجة قوة كلمة المرور بالنسبة المئوية للطالب
  const studentPasswordStrengthScore = useMemo(() => {
    if (!customStudentPassword) return 0; // 🛑 إذا كانت فارغة النتيجة صفر
    let score = 0; // 🎯 المجموع المبدئي
    if (studentPasswordCriteria.length) score += 25; // ➕ إضافة ربع الدرجة للطول
    if (studentPasswordCriteria.hasUpper) score += 25; // ➕ إضافة ربع الدرجة للحرف الكبير
    if (studentPasswordCriteria.hasNumber) score += 25; // ➕ إضافة ربع الدرجة للرقم
    if (studentPasswordCriteria.hasSpecial) score += 25; // ➕ إضافة ربع الدرجة للرمز الخاص
    return score; // 🏁 إرجاع النتيجة الكاملة
  }, [studentPasswordCriteria, customStudentPassword]); // 🔄 تحديث النتيجة

  // 🔍 تصفية طلاب القسم بالكامل
  const deptStudents = useMemo(() => {
    return profiles.filter(
      (p) => p.role === 'student' && (p.department_id === currentDeptId || p.department_name === deptName)
    );
  }, [profiles, currentDeptId, deptName]);

  // 🔍 تصفية طلاب القسم بحسب نص البحث والمرحلة والفترة
  const filteredStudents = useMemo(() => {
    const term = studentSearch.toLowerCase();
    return deptStudents.filter((s) => {
      const matchesSearch =
        s.full_name.toLowerCase().includes(term) ||
        s.university_number.toLowerCase().includes(term) ||
        s.generated_email.toLowerCase().includes(term);
      const matchesStage = filterStudentStage === 'all' || (s.stage_number || 1) === filterStudentStage;
      const matchesStudyType = filterStudentStudyType === 'all' || (s.study_type || 'morning') === filterStudentStudyType;
      return matchesSearch && matchesStage && matchesStudyType;
    });
  }, [deptStudents, studentSearch, filterStudentStage, filterStudentStudyType]);

  // 🔽 دالة فتح وإغلاق قائمة المرحلة مع الحساب الذكي لموضعها
  const handleToggleStudentStageDropdown = () => {
    if (!isStudentStageDropdownOpen && stageButtonRef.current) {
      setStageDropdownCoords(calculateSmartDropdownPosition(stageButtonRef.current, 220)); // 📐 حساب الموضع
      setIsStudentStageDropdownOpen(true); // 🔓 فتح
    } else {
      setIsStudentStageDropdownOpen(false); // 🔒 إغلاق
    }
  };

  // ⚡ توليد بريد ورمز معقد تلقائياً للطالب
  const handleAutoGenerateStudentCredentials = () => {
    const genEmail = generateStrongUniqueEmail('st', profiles); // ✉️ توليد بريد فريد يبدأ بـ st
    const genPass = generateStrongPassword(); // 🔑 توليد رمز سري قوي
    setCustomStudentEmail(genEmail); // 💾 وضع البريد بالحقل
    setCustomStudentPassword(genPass); // 💾 وضع الرمز بالحقل
  };

  // 📥 تنزيل نموذج Excel معتمد لطلبة القسم
  const handleDownloadStudentTemplate = async () => {
    await downloadDepartmentStudentsTemplate(deptName); // 📥 تحميل القالب
    setSuccessMessage(`تم تنزيل نموذج إكسل المعتمد لطلبة قسم (${deptName}) بنجاح!`); // ✨ إشعار النجاح
    setTimeout(() => setSuccessMessage(''), 4000); // ⏱️ إخفاء الإشعار
  };

  // 📤 استيراد ومعالجة ملف Excel لطلبة القسم
  const handleStudentExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // 📁 استخراج الملف
    if (!file || !currentDeptId) return; // 🛑 التحقق من وجود الملف ومعرف القسم

    try {
      setIsImportingStudentExcel(true); // ⏳ بدء التحميل
      const rows: Record<string, string | number>[] = await parseExcelFile(file); // 📑 قراءة الشيت بنمط صارم

      const accepted: { name: string; dept: string; email: string }[] = [];
      const duplicates: { name: string; email: string; dept: string; reason: string }[] = [];
      const rejected: { rowNumber: number; rawName: string; reason: string }[] = [];

      const newProfilesToAdd: UserProfile[] = [];
      let tempAllProfiles = [...profiles];

      rows.forEach((row: Record<string, string | number>, index: number) => {
        const rowNum = index + 2; // 🔢 رقم الصف بالإكسل
        const rawName = String(row['name'] || row['اسم الطالب الثلاثي / الرباعي'] || row['اسم الطالب'] || row['الاسم'] || '').trim();
        const rawStage = Number(row['stage'] || row['المرحلة الدراسية (1-4)'] || row['المرحلة'] || 1);
        const rawGender = String(row['gender'] || row['الجنس'] || '').trim();
        const rawEmail = String(row['email'] || row['البريد الأكاديمي'] || '').trim();
        const rawPass = String(row['pass'] || row['كلمة المرور'] || '').trim();
        const rawStudyType = String(row['study_type'] || row['نوع الدراسة (صباحي / مسائي)'] || row['الدراسة'] || 'morning').trim();

        if (!rawName || rawName.length < 3) {
          rejected.push({
            rowNumber: rowNum,
            rawName: rawName || 'اسم فارغ',
            reason: 'حقل اسم الطالب فارغ أو غير مكتمل',
          });
          return;
        }

        // فحص التكرار بالاسم في نفس القسم والمرحلة
        const isNameDuplicate = tempAllProfiles.some(
          (p) => p.department_id === currentDeptId && p.role === 'student' && p.full_name.trim().toLowerCase() === rawName.toLowerCase()
        );

        if (isNameDuplicate) {
          duplicates.push({
            name: rawName,
            email: rawEmail || '—',
            dept: deptName,
            reason: 'الطالب مسجل مسبقاً في هذا القسم',
          });
          return;
        }

        let finalEmail = '';
        if (rawEmail) {
          finalEmail = rawEmail.includes('@') ? rawEmail.toLowerCase() : `${rawEmail.toLowerCase()}@sadiq.edu.iq`;
          if (tempAllProfiles.some((p) => p.generated_email.toLowerCase() === finalEmail)) {
            finalEmail = generateStrongUniqueEmail('st', tempAllProfiles);
          }
        } else {
          finalEmail = generateStrongUniqueEmail('st', tempAllProfiles);
        }

        const finalPass = rawPass || generateStrongPassword();
        const detectedGender = (rawGender === 'أنثى' || rawGender === 'female')
          ? 'female'
          : (rawGender === 'ذكر' || rawGender === 'male')
            ? 'male'
            : detectArabicGender(rawName);

        const detectedStudyType: 'morning' | 'evening' = (rawStudyType.includes('مسائ') || rawStudyType.toLowerCase() === 'evening')
          ? 'evening'
          : 'morning';

        const stageNum = Math.min(4, Math.max(1, isNaN(rawStage) ? 1 : rawStage));
        const randomNum = Math.floor(100000 + Math.random() * 900000);

        const newStd: UserProfile = {
          id: `usr-std-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          full_name: rawName,
          role: 'student',
          department_id: currentDeptId,
          department_name: deptName,
          stage_number: stageNum,
          stage_id: `stage-${currentDeptId}-${stageNum}`,
          study_type: detectedStudyType,
          university_number: `STU-${randomNum}`,
          generated_email: finalEmail,
          temp_password: finalPass,
          gender: detectedGender as 'male' | 'female',
          is_active: true,
          must_change_password: false,
          created_at: new Date().toISOString(),
          order_index: tempAllProfiles.length + 1,
        };

        newProfilesToAdd.push(newStd);
        tempAllProfiles.push(newStd);
        accepted.push({
          name: rawName,
          dept: deptName,
          email: finalEmail,
        });
      });

      if (newProfilesToAdd.length > 0) {
        const updated = [...newProfilesToAdd, ...profiles];
        setProfiles(updated);
        saveStoredData('profiles', updated);
        newProfilesToAdd.forEach((student) => {
          saveProfileToSupabase(student); // ☁️ رفع سحابي
        });
      }

      setStudentImportReport({
        totalRows: rows.length,
        accepted,
        duplicates,
        rejected,
      });
      setStudentActiveReportTab('accepted');

      setSuccessMessage(`تمت معالجة ملف الطلاب وإضافة ${accepted.length} طالب بنجاح!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch {
      setErrorMessage('حدث خطأ أثناء قراءة ملف Excel، يرجى التأكد من مطابقة الملف المعتمد.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsImportingStudentExcel(false);
      if (e.target) e.target.value = '';
    }
  };

  // 💾 حفظ أو تعديل طالب في القسم
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !currentDeptId) {
      setStudentNameError('يرجى إدخال اسم الطالب كاملاً');
      return;
    }

    if (!studentStage) {
      setErrorMessage('يرجى تحديد المرحلة الدراسية للطالب');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    if (!studentStudyType) {
      setErrorMessage('يرجى اختيار نوع الدراسة (صباحي أو مسائي)');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    if (!studentGender) {
      setErrorMessage('يرجى تحديد جنس الطالب (ذكر أو أنثى)');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    if (customStudentPassword && customStudentPassword.length < 8) {
      setErrorMessage('كلمة المرور المخصصة يجب أن لا تقل عن 8 خانات');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    if (editingStudentId) {
      const candidateEmail = customStudentEmail.trim()
        ? (customStudentEmail.includes('@') ? customStudentEmail.trim().toLowerCase() : `${customStudentEmail.trim().toLowerCase()}@sadiq.edu.iq`)
        : '';

      if (candidateEmail) {
        const emailCheck = checkEmailUniquenessAcrossSystem(candidateEmail, editingStudentId, profiles);
        if (!emailCheck.isUnique) {
          setErrorMessage(emailCheck.errorMessage || 'البريد الإلكتروني مسجل مسبقاً لمستخدم آخر. يرجى اختيار بريد بديل.');
          setTimeout(() => setErrorMessage(''), 5000);
          return;
        }
      }

      let editedStudentObj: UserProfile | null = null;
      const updated = profiles.map((p) => {
        if (p.id === editingStudentId) {
          const finalEmail = candidateEmail || p.generated_email;
          const finalPassword = customStudentPassword.trim() || p.temp_password;

          const updatedStd: UserProfile = {
            ...p,
            full_name: studentName.trim(),
            stage_number: studentStage,
            stage_id: `stage-${currentDeptId}-${studentStage}`,
            study_type: studentStudyType,
            gender: studentGender,
            generated_email: finalEmail,
            temp_password: finalPassword
          };
          editedStudentObj = updatedStd;
          return updatedStd;
        }
        return p;
      });
      setProfiles(updated);
      saveStoredData('profiles', updated);
      if (editedStudentObj) {
        saveProfileToSupabase(editedStudentObj); // ☁️ مزامنة سحابية
      }
      setEditingStudentId(null);
      setSuccessMessage('تم تعديل بيانات الطالب بنجاح ومزامنتها سحابياً!');
    } else {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      let finalEmail = '';
      if (customStudentEmail.trim()) {
        finalEmail = customStudentEmail.includes('@')
          ? customStudentEmail.trim().toLowerCase()
          : `${customStudentEmail.trim().toLowerCase()}@sadiq.edu.iq`;
      } else {
        finalEmail = generateStrongUniqueEmail('st', profiles);
      }

      const emailCheck = checkEmailUniquenessAcrossSystem(finalEmail, undefined, profiles);
      if (!emailCheck.isUnique) {
        setErrorMessage(emailCheck.errorMessage || 'البريد الإلكتروني مسجل مسبقاً في النظام. يرجى كتابة بريد آخر.');
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }

      const finalPassword = customStudentPassword.trim() || generateStrongPassword();

      const newStudent: UserProfile = {
        id: `usr-std-${Date.now()}`,
        full_name: studentName.trim(),
        role: 'student',
        department_id: currentDeptId,
        department_name: deptName,
        stage_number: studentStage,
        stage_id: `stage-${currentDeptId}-${studentStage}`,
        study_type: studentStudyType,
        university_number: `STU-${randomNum}`,
        generated_email: finalEmail,
        temp_password: finalPassword,
        gender: studentGender,
        is_active: true,
        must_change_password: false,
        created_at: new Date().toISOString(),
        order_index: 0,
      };

      const updated = [newStudent, ...profiles.map((p, idx) => ({ ...p, order_index: idx + 1 }))];
      setProfiles(updated);
      saveStoredData('profiles', updated);
      saveProfileToSupabase(newStudent); // ☁️ مزامنة سحابية
      setSelectedCardProfile(newStudent);
      setSuccessMessage('تمت إضافة الطالب وتوليد حسابه الأكاديمي وتوثيقه سحابياً بنجاح!');
    }

    setStudentName('');
    setStudentStage(null);
    setStudentGender(null);
    setStudentStudyType(null);
    setCustomStudentEmail('');
    setCustomStudentPassword('');
    setStudentNameError('');
    setEditingStudentId(null);
    setIsStudentModalOpen(false);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // 🛡️ معالجة فورية وتلقائية للبريد الإلكتروني المكرر لكافة المستخدمين
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
    } else {
      setSuccessMessage('لا يوجد أي بريد إلكتروني مكرر في النظام. كافة الحسابات فريدة ومؤمنة بنسبة 100%! ✨');
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  // 🗑️ حذف طالب فردي
  const handleDeleteStudent = (id: string) => {
    const targetStudent = profiles.find((p) => p.id === id);
    setDeleteModalConfig({
      isOpen: true,
      title: 'تأكيد حذف حساب الطالب',
      itemName: targetStudent?.full_name || 'طالب',
      itemDetails: `المرحلة ${targetStudent?.stage_number || 1} - قسم ${deptName}`,
      warningMessage: 'هل أنت متأكد من حذف هذا الطالب نهائياً من سجلات القسم؟ لا يمكن استرجاع بياناته بعد الحذف.',
      confirmText: 'تأكيد الحذف',
      onConfirm: () => {
        const updated = profiles.filter((p) => p.id !== id);
        setProfiles(updated);
        saveStoredData('profiles', updated);
        deleteProfileFromSupabase(id, 'student'); // ☁️ حذف سحابي
        setSuccessMessage('تم حذف حساب الطالب بنجاح.');
        setTimeout(() => setSuccessMessage(''), 3000);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 🎓 ترحيل طالب فردي إلى المرحلة التالية عند نجاحه أو تثبيت تخرجه
  const handlePromoteStudent = (student: UserProfile, e?: React.MouseEvent) => {
    // 🛑 منع انتشار النقر
    if (e) e.stopPropagation();

    const currentStage = Number(student.stage_number) || 1;
    const stageNames: Record<number, string> = { 1: 'الأولى', 2: 'الثانية', 3: 'الثالثة', 4: 'الرابعة' };

    // 🎓 إذا كان الطالب بالمرحلة الرابعة، يتم تسجيل تخرجه فوراً
    if (currentStage >= 4) {
      if (student.is_graduated === true || String(student.is_graduated) === 'true') {
        setErrorMessage('هذا الطالب مثبت تخرجه مسبقاً كخريج معتمد.');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      let graduatedStudentObj: UserProfile | null = null;
      const updated = profiles.map((p) => {
        if (p.id === student.id) {
          const stdObj: UserProfile = {
            ...p,
            stage_number: 4,
            is_graduated: true,
            graduation_status: 'خريج معتمد (ناجح بنجاح)',
          };
          graduatedStudentObj = stdObj;
          return stdObj;
        }
        return p;
      });
      setProfiles(updated);
      saveStoredData('profiles', updated);
      if (graduatedStudentObj) {
        saveProfileToSupabase(graduatedStudentObj);
      }

      // 🔔 إرسال إشعار التخرج الفوري للطالب
      sendAppNotification({
        recipient_id: student.id,
        recipient_role: 'student',
        title: 'مبارك التخرج والنجاح الأكاديمي! 🎓',
        message: `تم اعتماد تخرجك بنجاح من قسم ${deptName} للعام الدراسي ${academicYear}. نتمنى لك دوام التوفيق والتميز!`,
        type: 'system_announcement',
        link: '/student/dashboard',
      });

      setSuccessMessage(`مبارك! تم تثبيت تخرج الطالب (${student.full_name}) بنجاح.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      return;
    }

    const nextStage = currentStage + 1;
    const nextStageName = stageNames[nextStage] || `${nextStage}`;

    let promotedStudentObj: UserProfile | null = null;
    const updated = profiles.map((p) => {
      if (p.id === student.id) {
        const stdObj: UserProfile = {
          ...p,
          stage_number: nextStage,
          stage_id: `stage-${currentDeptId || p.department_id || 'dept-1'}-${nextStage}`,
          is_graduated: false,
        };
        promotedStudentObj = stdObj;
        return stdObj;
      }
      return p;
    });
    setProfiles(updated);
    saveStoredData('profiles', updated);
    if (promotedStudentObj) {
      saveProfileToSupabase(promotedStudentObj);
    }

    // 🔄 ضبط التصفية لتظهر المرحلة الجديدة للطالب المنقول فوراً
    setFilterStudentStage(nextStage);

    // 🔔 إرسال إشعار الترحيل الأكاديمي للطالب
    sendAppNotification({
      recipient_id: student.id,
      recipient_role: 'student',
      title: `تهانينا بالنجاح! تم ترحيلك إلى المرحلة ${nextStageName} 🚀`,
      message: `اعتمدت رئاسة ومقررية قسم ${deptName} ترحيلك بنجاح إلى المرحلة ${nextStage} (${nextStageName}) للعام الدراسي ${academicYear}.`,
      type: 'system_announcement',
      link: '/student/dashboard',
    });

    setSuccessMessage(`تم بنجاح ترحيل الطالب (${student.full_name}) إلى المرحلة ${nextStageName}! 🎉`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // 🎓 ترحيل مرحلة كاملة جماعياً بنقرة واحدة (Bulk Promotion)
  const handleBulkPromoteStage = (fromStage: number) => {
    // 🔢 تحويل رقم المرحلة إلى عدد صحيح مضمون
    const stageNum = Number(fromStage) || 1;

    // 🎯 استخراج الطلاب المؤهلين في هذه المرحلة بدقة (المراحل 1-3 مؤهلة دائماً، والمرحلة 4 لمن لم يتخرج بعد)
    const targetStudents = deptStudents.filter((s) => {
      const sStage = Number(s.stage_number) || 1;
      if (sStage !== stageNum) return false;
      if (stageNum < 4) return true;
      const isGrad = s.is_graduated === true || String(s.is_graduated) === 'true';
      return !isGrad;
    });

    if (targetStudents.length === 0) {
      setErrorMessage(`لا يوجد طلاب مؤهلين في المرحلة ${stageNum} حالياً لترحيلهم.`);
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    const nextStage = stageNum + 1;
    const stageNames: Record<number, string> = { 1: 'الأولى', 2: 'الثانية', 3: 'الثالثة', 4: 'الرابعة' };
    const fromName = stageNames[stageNum] || `${stageNum}`;
    const toName = stageNum >= 4 ? 'التخرج النهائي' : (stageNames[nextStage] || `${nextStage}`);

    const targetIds = new Set(targetStudents.map((s) => s.id));
    const updatedProfilesToSync: UserProfile[] = [];
    const updated = profiles.map((p) => {
      if (targetIds.has(p.id)) {
        if (stageNum >= 4) {
          const gradObj: UserProfile = {
            ...p,
            stage_number: 4,
            is_graduated: true,
            graduation_status: 'خريج معتمد (ناجح بنجاح)',
          };
          updatedProfilesToSync.push(gradObj);
          return gradObj;
        }
        const promObj: UserProfile = {
          ...p,
          stage_number: nextStage,
          stage_id: `stage-${currentDeptId || p.department_id || 'dept-1'}-${nextStage}`,
          is_graduated: false,
        };
        updatedProfilesToSync.push(promObj);
        return promObj;
      }
      return p;
    });

    setProfiles(updated);
    saveStoredData('profiles', updated);
    updatedProfilesToSync.forEach((std) => {
      saveProfileToSupabase(std);
    });

    // 🔔 إرسال إشعارات جماعية لكافة الطلاب المشمولين بالترحيل
    targetStudents.forEach((st) => {
      sendAppNotification({
        recipient_id: st.id,
        recipient_role: 'student',
        title: stageNum >= 4 ? 'مبارك التخرج والنجاح الأكاديمي! 🎓' : `تم ترحيلك إلى المرحلة ${toName} 🚀`,
        message: stageNum >= 4
          ? `تم اعتماد تخرجك بنجاح من قسم ${deptName} للعام الدراسي ${academicYear}.`
          : `اعتمدت رئاسة القسم ترحيلك بنجاح إلى المرحلة ${toName}. نتمنى لك دوام التفوق!`,
        type: 'system_announcement',
        link: '/student/dashboard',
      });
    });

    setIsBulkPromotionModalOpen(false);
    // 🔄 الانتقال تلقائياً لتصفية المرحلة الجديدة ليرى المستخدم الطلاب المنقولين فوراً
    setFilterStudentStage(stageNum >= 4 ? 4 : nextStage);
    setSuccessMessage(stageNum >= 4
      ? `تم بنجاح تثبيت تخرج جميع طلاب المرحلة الرابعة (${targetStudents.length} طالب) في قسم ${deptName}! 🎓`
      : `تم بنجاح ترحيل (${targetStudents.length}) طالب من المرحلة ${fromName} إلى المرحلة ${toName}! 🎉`
    );
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  // 🔘 تبديل تحديد كافة الطلاب
  const toggleSelectAllStudents = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  // 🔘 تبديل تحديد طالب مفرد
  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // 🗑️ الحذف الجماعي للطلبة المحددين
  const handleBulkDeleteStudents = () => {
    const count = selectedStudentIds.length;
    if (count === 0) return;

    setDeleteModalConfig({
      isOpen: true,
      title: `تأكيد الحذف الجماعي لـ (${count}) طلبة`,
      itemName: `${count} من طلبة قسم ${deptName}`,
      itemDetails: `سيتم حذف الحسابات الجامعية وسجلات الدرجات والأقساط للطلبة المحددين نهائياً من قاعدة البيانات.`,
      warningMessage: `⚠️ تنبيه فائق الأهمية: هل أنت متأكد من حذف (${count}) طالب دفعة واحدة؟ سيترتب على هذا الإجراء إزالة سجلاتهم الأكاديمية تماماً.`,
      confirmText: `حذف (${count}) طلبة نهائياً`,
      onConfirm: () => {
        selectedStudentIds.forEach((id: string) => {
          deleteProfileFromSupabase(id, 'student'); // ☁️ حذف سحابي
        });

        const updated = profiles.filter((p: UserProfile): boolean => !selectedStudentIds.includes(p.id));
        setProfiles(updated);
        saveStoredData('profiles', updated);
        setSelectedStudentIds([]);
        setSuccessMessage(`تم حذف (${count}) من طلبة القسم بنجاح.`);
        setTimeout(() => setSuccessMessage(''), 3500);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 📊 تصدير الطلبة المحددين إلى ملف Excel
  const handleBulkExportStudentsExcel = async () => {
    const selectedStudentsList = deptStudents.filter((s) => selectedStudentIds.includes(s.id));
    if (selectedStudentsList.length === 0) return;

    await exportCustomStudentsList(selectedStudentsList, deptName);
    setSuccessMessage(`تم تصدير (${selectedStudentsList.length}) طالب إلى ملف Excel بنجاح! 📊`);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // 📊 تصدير كشف طلبة القسم إلى Excel (مع الرقم الجامعي، المرحلة، الفترة، البريد، والرمز السري)
  const handleExportStudentsExcel = async () => {
    try {
      setIsExportingStudentsExcel(true);
      const targetStudents = selectedStudentIds.length > 0
        ? deptStudents.filter((s: UserProfile): boolean => selectedStudentIds.includes(s.id))
        : (filteredStudents.length > 0 ? filteredStudents : deptStudents);

      if (targetStudents.length === 0) {
        setErrorMessage('لا يوجد طلاب في القسم للتصدير حالياً.');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      await exportCustomStudentsList(targetStudents, deptName);
      setSuccessMessage(`تم بنجاح تصدير كشف (${targetStudents.length}) طالب بالرقم الجامعي والبريد والرمز إلى ملف Excel! 📊`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      console.error('خطأ في تصدير طلبة القسم:', error);
      setErrorMessage('حدث خطأ أثناء تصدير ملف الإكسل للطلاب.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsExportingStudentsExcel(false);
    }
  };

  return {
    // 👤 حالات الطالب
    studentName,
    setStudentName,
    studentStage,
    setStudentStage,
    studentGender,
    setStudentGender,
    studentStudyType,
    setStudentStudyType,
    customStudentEmail,
    setCustomStudentEmail,
    customStudentPassword,
    setCustomStudentPassword,
    showStudentPassword,
    setShowStudentPassword,
    editingStudentId,
    setEditingStudentId,
    isStudentModalOpen,
    setIsStudentModalOpen,
    studentNameError,
    setStudentNameError,

    // 🔍 الفلاتر والبحث
    studentSearch,
    setStudentSearch,
    filterStudentStage,
    setFilterStudentStage,
    filterStudentStudyType,
    setFilterStudentStudyType,

    // 📊 الإكسل
    showStudentExcelInstructions,
    setShowStudentExcelInstructions,
    isImportingStudentExcel,
    setIsImportingStudentExcel,
    studentImportReport,
    setStudentImportReport,
    studentActiveReportTab,
    setStudentActiveReportTab,

    // 👥 التحديد والصفحات
    selectedStudentIds,
    setSelectedStudentIds,
    studentPage,
    setStudentPage,
    studentPageSize,
    setStudentPageSize,
    isExportingStudentsExcel,
    setIsExportingStudentsExcel,

    // 🚀 الترحيل
    isBulkPromotionModalOpen,
    setIsBulkPromotionModalOpen,
    bulkPromoteSourceStage,
    setBulkPromoteSourceStage,

    // 🔽 القائمة المنسدلة الذكية
    isStudentStageDropdownOpen,
    setIsStudentStageDropdownOpen,
    stageDropdownCoords,
    setStageDropdownCoords,
    stageButtonRef,
    handleToggleStudentStageDropdown,

    // 🖨️ الطباعة
    showStudentPrintModal,
    setShowStudentPrintModal,
    singleStudentPrintProfile,
    setSingleStudentPrintProfile,
    studentPrintStageFilter,
    setStudentPrintStageFilter,
    studentPrintStudyFilter,
    setStudentPrintStudyFilter,

    // 🔐 شروط وقوة كلمة المرور
    studentPasswordCriteria,
    studentPasswordStrengthScore,

    // 📋 القوائم المصفاة
    deptStudents,
    filteredStudents,

    // ⚡ دوال المعالجة
    handleAutoGenerateStudentCredentials,
    handleDownloadStudentTemplate,
    handleStudentExcelUpload,
    handleSaveStudent,
    handleFixDuplicateEmails,
    handleDeleteStudent,
    handlePromoteStudent,
    handleBulkPromoteStage,
    handleBulkDeleteStudents,
    handleBulkExportStudentsExcel,
    handleExportStudentsExcel,
    toggleSelectAllStudents,
    toggleSelectStudent,
  };
};
