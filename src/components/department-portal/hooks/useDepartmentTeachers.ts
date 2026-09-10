// 👨‍🏫 خطاف مخصص لإدارة شؤون أساتذة القسم (إضافة، تعديل، حذف، استيراد وتصدير إكسل)
// 🛡️ التزام نمطي صارم بدون any أو unknown مع توثيق عراقي تفصيلي لكل سطر

import { useState, useMemo } from 'react'; // ⚛️ استيراد خطافات إدارة الحالة والذاكرة من React
import type { UserProfile, Course, TeacherCourse } from '@/types'; // 📚 استيراد واجهات البروفايل والمواد والتكليفات
import type { DepartmentDeleteModalConfig, ImportSummaryReport } from '../types'; // 🏷️ استيراد واجهات النافذة المشتركة
import { saveStoredData, generateStrongUniqueEmail, generateStrongPassword } from '@/lib/mock-data'; // 💾 دالة حفظ البيانات ومولدات الحسابات
import { checkEmailUniquenessAcrossSystem } from '@/lib/validation-utils'; // 🛡️ محرك فحص فرادة البريد الأكاديمي
import { saveProfileToSupabase, deleteProfileFromSupabase, saveCourseToSupabase, deleteTeacherCourseFromSupabase } from '@/lib/supabase-client'; // ☁️ المزامنة السحابية مع Supabase
import { detectArabicGender } from '@/lib/demographics-utils'; // 🚻 خوارزمية كشف الجنس من الاسم العربي
import { downloadDepartmentTeachersTemplate, parseExcelFile, exportCustomTeachersList } from '@/lib/excel-utils'; // 📊 دوال التعامل مع الإكسل

// 📋 واجهة مدخلات خطاف أساتذة القسم
export interface UseDepartmentTeachersProps {
  currentDeptId: string; // 🏛️ معرف القسم الأكاديمي الحالي
  deptName: string; // 🏷️ اسم القسم الأكاديمي
  profiles: UserProfile[]; // 👥 مصفوفة جميع المستخدمين في النظام
  setProfiles: React.Dispatch<React.SetStateAction<UserProfile[]>>; // 🔄 دالة تحديث المستخدمين
  teacherCourses: TeacherCourse[]; // 🔗 مصفوفة التكليفات الأكاديمية
  setTeacherCourses: React.Dispatch<React.SetStateAction<TeacherCourse[]>>; // 🔄 دالة تحديث التكليفات
  courses: Course[]; // 📖 مصفوفة المواد الدراسية
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>; // 🔄 دالة تحديث المواد
  setSuccessMessage: (msg: string) => void; // ✨ دالة إشعار النجاح
  setErrorMessage: (msg: string) => void; // ⚠️ دالة إشعار الخطأ
  setDeleteModalConfig: React.Dispatch<React.SetStateAction<DepartmentDeleteModalConfig>>; // 🗑️ دالة إعداد نافذة الحذف
  setSelectedCardProfile: (p: UserProfile | null) => void; // 📇 دالة تعيين البروفايل المعروض بالبطاقة
}

// 🎯 دالة الخطاف الرئيسية لإدارة أساتذة القسم
export const useDepartmentTeachers = ({
  currentDeptId, // 🏛️ معرف القسم
  deptName, // 🏷️ اسم القسم
  profiles, // 👥 كافة الحسابات
  setProfiles, // 🔄 تحديث الحسابات
  teacherCourses, // 🔗 التكليفات
  setTeacherCourses, // 🔄 تحديث التكليفات
  courses, // 📖 المواد
  setCourses, // 🔄 تحديث المواد
  setSuccessMessage, // ✨ رسالة النجاح
  setErrorMessage, // ⚠️ رسالة الخطأ
  setDeleteModalConfig, // 🗑️ نافذة الحذف
  setSelectedCardProfile, // 📇 بطاقة الأستاذ
}: UseDepartmentTeachersProps) => {
  // 👤 حقول اسم الأستاذ والبيانات الشخصية
  const [teacherName, setTeacherName] = useState<string>(''); // 👤 اسم الأستاذ واللقب الأكاديمي
  const [teacherGender, setTeacherGender] = useState<'male' | 'female' | null>(null); // 🚻 جنس التدريسي
  const [customTeacherEmail, setCustomTeacherEmail] = useState<string>(''); // ✉️ البريد الأكاديمي المخصص
  const [customTeacherPassword, setCustomTeacherPassword] = useState<string>(''); // 🔑 كلمة المرور المخصصة
  const [showTeacherPassword, setShowTeacherPassword] = useState<boolean>(false); // 👁️ إظهار أو إخفاء كلمة المرور
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null); // ✏️ معرف الأستاذ الجاري تعديل بياناته
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false); // 📦 حالة فتح نافذة إضافة وتعديل أستاذ
  const [nameError, setNameError] = useState<string>(''); // ⚠️ نص خطأ التحقق من اسم الأستاذ

  // 📊 حالات استيراد ملفات الإكسل والتقارير
  const [showExcelInstructions, setShowExcelInstructions] = useState<boolean>(false); // ℹ️ عرض نافذة تعليمات الإكسل
  const [isImportingExcel, setIsImportingExcel] = useState<boolean>(false); // ⏳ مؤشر جاري استيراد الإكسل
  const [importReport, setImportReport] = useState<ImportSummaryReport | null>(null); // 📑 تقرير نتائج الاستيراد
  const [activeReportTab, setActiveReportTab] = useState<'accepted' | 'duplicates' | 'rejected'>('accepted'); // 📑 تبويب التقرير النشط

  // 👥 حالات التحديد والتنقل والتصدير
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]); // 🔘 معرفات الأساتذة المحددين
  const [teacherPage, setTeacherPage] = useState<number>(1); // 📄 رقم الصفحة الحالية في جدول الأساتذة
  const [teacherPageSize, setTeacherPageSize] = useState<number>(10); // 📏 عدد الصفوف في الصفحة
  const [isExportingTeachersExcel, setIsExportingTeachersExcel] = useState<boolean>(false); // ⏳ مؤشر جاري تصدير الإكسل

  // 🖨️ حالات طباعة بطاقات الاعتماد للأستاذ
  const [showTeacherPrintModal, setShowTeacherPrintModal] = useState<boolean>(false); // 🖨️ فتح نافذة طباعة بطاقة الأستاذ
  const [singleTeacherPrintProfile, setSingleTeacherPrintProfile] = useState<UserProfile | null>(null); // 👤 بروفايل الأستاذ للطباعة

  // 🔐 شروط ومعايير كلمة المرور التفاعلية للأستاذ
  const passwordCriteria = useMemo(() => {
    const p = customTeacherPassword || ''; // 📝 نص كلمة المرور الحالية
    return {
      length: p.length >= 8, // 📏 ألا يقل الطول عن 8 خانات
      hasUpper: /[A-Z]/.test(p), // 🔠 يحتوي على حرف كبير إنكليزي
      hasNumber: /[0-9]/.test(p), // 🔢 يحتوي على رقم
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(p), // 🔣 يحتوي على رمز خاص
    };
  }, [customTeacherPassword]); // 🔄 إعادة الحساب عند تغير كلمة المرور

  // 💯 حساب درجة قوة كلمة المرور بالنسبة المئوية
  const passwordStrengthScore = useMemo(() => {
    if (!customTeacherPassword) return 0; // 🛑 إذا كانت فارغة النتيجة صفر
    let score = 0; // 🎯 المجموع المبدئي
    if (passwordCriteria.length) score += 25; // ➕ إضافة ربع الدرجة للطول
    if (passwordCriteria.hasUpper) score += 25; // ➕ إضافة ربع الدرجة للحرف الكبير
    if (passwordCriteria.hasNumber) score += 25; // ➕ إضافة ربع الدرجة للرقم
    if (passwordCriteria.hasSpecial) score += 25; // ➕ إضافة ربع الدرجة للرمز الخاص
    return score; // 🏁 إرجاع النتيجة الكاملة
  }, [passwordCriteria, customTeacherPassword]); // 🔄 تحديث النتيجة

  // 🔍 استخراج وتصفية أساتذة القسم الحالي مرتبين حسب الفهرس
  const deptTeachers = useMemo(() => {
    return profiles
      .filter((p) => p.role === 'teacher' && (p.department_id === currentDeptId || p.department_name === deptName)) // 🎯 شرط التابعية للقسم
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)); // 🔢 الترتيب التصاعدي
  }, [profiles, currentDeptId, deptName]); // 🔄 إعادة الفلترة عند تغير القائمة

  // ⚡ توليد بريد ورمز معقد تلقائياً للأستاذ
  const handleAutoGenerateCredentials = () => {
    const genEmail = generateStrongUniqueEmail('dr', profiles); // ✉️ توليد بريد فريد يبدأ بـ dr
    const genPass = generateStrongPassword(); // 🔑 توليد كلمة مرور عشوائية معقدة
    setCustomTeacherEmail(genEmail); // 💾 وضع البريد بالحقل
    setCustomTeacherPassword(genPass); // 💾 وضع الرمز بالحقل
  };

  // 📥 تنزيل نموذج Excel معتمد لأساتذة القسم مع التعليمات
  const handleDownloadTeacherTemplate = async () => {
    await downloadDepartmentTeachersTemplate(deptName); // 📥 إنشاء وتحميل القالب
    setSuccessMessage(`تم تنزيل نموذج إكسل المعتمد لأساتذة قسم (${deptName}) بنجاح!`); // 💬 إشعار النجاح
    setTimeout(() => setSuccessMessage(''), 4000); // ⏱️ إخفاء الإشعار بعد 4 ثوانٍ
  };

  // 📤 استيراد ومعالجة ملف Excel لأساتذة القسم
  const handleTeacherExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // 📁 استخراج الملف المرفوع
    if (!file || !currentDeptId) return; // 🛑 التحقق من وجود الملف ومعرف القسم

    try {
      setIsImportingExcel(true); // ⏳ بدء مؤشر التحميل
      const rows: Record<string, string | number>[] = await parseExcelFile(file); // 📑 قراءة وتحليل بيانات الشيت بنمط دقيق

      const accepted: { name: string; dept: string; email: string }[] = []; // ✅ قائمة المقبولين
      const duplicates: { name: string; email: string; dept: string; reason: string }[] = []; // ⚠️ قائمة المكررين
      const rejected: { rowNumber: number; rawName: string; reason: string }[] = []; // ❌ قائمة المرفوضين

      const newProfilesToAdd: UserProfile[] = []; // 👥 كائنات البروفايل الجديدة للإضافة
      let tempAllProfiles = [...profiles]; // 📋 نسخة مؤقتة لفحص الفرادة الفوري

      rows.forEach((row: Record<string, string | number>, index: number) => {
        const rowNum = index + 2; // 🔢 رقم الصف بالإكسل مع مراعاة الهيدر
        const rawName = String(row['name'] || row['اسم الأستاذ واللقب الأكاديمي'] || row['الاسم'] || row['الاسم الكامل'] || '').trim(); // 👤 قراءة الاسم
        const rawGender = String(row['gender'] || row['الجنس'] || '').trim(); // 🚻 قراءة الجنس
        const rawEmail = String(row['email'] || row['البريد الأكاديمي'] || '').trim(); // ✉️ قراءة البريد
        const rawPass = String(row['pass'] || row['كلمة المرور'] || '').trim(); // 🔑 قراءة الرمز

        if (!rawName || rawName.length < 3) { // ⚠️ فحص سلامة الاسم
          rejected.push({
            rowNumber: rowNum, // 🔢 رقم الصف
            rawName: rawName || 'اسم فارغ', // 📝 الاسم المقروء
            reason: 'حقل الاسم فارغ أو غير مكتمل', // ⚠️ السبب
          });
          return; // 🛑 تجاوز هذا الصف
        }

        // فحص التكرار بالاسم في نفس القسم
        const isNameDuplicate = tempAllProfiles.some(
          (p) => p.department_id === currentDeptId && p.role === 'teacher' && p.full_name.trim().toLowerCase() === rawName.toLowerCase()
        );

        if (isNameDuplicate) { // ⚠️ إذا الاسم مسجل مسبقاً بنفس القسم
          duplicates.push({
            name: rawName, // 👤 الاسم
            email: rawEmail || '—', // ✉️ البريد
            dept: deptName, // 🏛️ القسم
            reason: 'الأستاذ مسجل مسبقاً في هذا القسم', // ⚠️ السبب
          });
          return; // 🛑 تجاوز هذا الصف
        }

        // معالجة البريد الأكاديمي والتحقق من صلاحه وفرادة السجل
        let finalEmail = '';
        if (rawEmail) {
          finalEmail = rawEmail.includes('@') ? rawEmail.toLowerCase() : `${rawEmail.toLowerCase()}@sadiq.edu.iq`;
          if (tempAllProfiles.some((p) => p.generated_email.toLowerCase() === finalEmail)) {
            finalEmail = generateStrongUniqueEmail('dr', tempAllProfiles); // 🛡️ توليد بريد بديل لو وجد تشابه
          }
        } else {
          finalEmail = generateStrongUniqueEmail('dr', tempAllProfiles); // ⚡ توليد آلي جديد
        }

        const finalPass = rawPass || generateStrongPassword(); // 🔑 استخدام المعطى أو توليد قوي
        const detectedGender = (rawGender === 'أنثى' || rawGender === 'female')
          ? 'female'
          : (rawGender === 'ذكر' || rawGender === 'male')
            ? 'male'
            : detectArabicGender(rawName); // 🔍 استنتاج الجنس

        const randomNum = Math.floor(1000 + Math.random() * 9000); // 🔢 توليد رقم أكاديمي عشوائي

        const newTch: UserProfile = {
          id: `usr-tch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, // 🆔 معرف فريد
          full_name: rawName, // 👤 الاسم الكامل
          role: 'teacher', // 🏷️ الدور أستاذ
          department_id: currentDeptId, // 🏛️ معرف القسم
          department_name: deptName, // 🏷️ اسم القسم
          university_number: `TCH-${randomNum}`, // 🔢 الرقم الجامعي
          generated_email: finalEmail, // ✉️ البريد الأكاديمي
          temp_password: finalPass, // 🔑 الرمز المؤقت
          gender: detectedGender as 'male' | 'female', // 🚻 الجنس
          is_active: true, // ✅ الحساب نشط
          must_change_password: false, // 🔒 لا يلزم تغيير الرمز فوراً
          created_at: new Date().toISOString(), // 📅 تاريخ الإنشاء
          order_index: tempAllProfiles.length + 1, // 🔢 فهرس الترتيب
        };

        newProfilesToAdd.push(newTch); // ➕ إضافة للدفعة الجديدة
        tempAllProfiles.push(newTch); // ➕ تحديث القائمة المؤقتة للفحص التالي
        accepted.push({
          name: rawName, // 👤 الاسم
          dept: deptName, // 🏛️ القسم
          email: finalEmail, // ✉️ البريد
        });
      });

      if (newProfilesToAdd.length > 0) { // 🚀 إذا وجد أساتذة مقبولين
        const updated = [...newProfilesToAdd, ...profiles]; // ➕ دمجهم مع الحسابات القديمة
        setProfiles(updated); // 💾 تحديث الحالة في الواجهة
        saveStoredData('profiles', updated); // 💾 تخزين محلي
        // ☁️ رفع ومزامنة كافة التدريسيين المستوردين في سحابة Supabase
        newProfilesToAdd.forEach((teacher) => {
          saveProfileToSupabase(teacher); // ☁️ مزامنة سحابية فردية آمنة
        });
      }

      setImportReport({
        totalRows: rows.length, // 🔢 إجمالي الصفوف
        accepted, // ✅ المقبولون
        duplicates, // ⚠️ المكررون
        rejected, // ❌ المرفوضون
      });
      setActiveReportTab('accepted'); // 🎯 فتح تبويب المقبولين افتراضياً

      setSuccessMessage(`تمت معالجة الملف وإضافة ${accepted.length} أستاذ بنجاح!`); // ✨ رسالة النجاح
      setTimeout(() => setSuccessMessage(''), 4000); // ⏱️ إخفاء الرسالة
    } catch {
      setErrorMessage('حدث خطأ أثناء قراءة ملف Excel، يرجى التأكد من مطابقة الملف المعتمد.'); // ⚠️ رسالة الخطأ
      setTimeout(() => setErrorMessage(''), 4000); // ⏱️ إخفاء الخطأ
    } finally {
      setIsImportingExcel(false); // 🛑 إيقاف مؤشر التحميل
      if (e.target) e.target.value = ''; // 🔄 تصفير قيمة مدخل الملف لإعادة الاختيار
    }
  };

  // 💾 حفظ أستاذ جديد أو تعديل بيانات أستاذ قائم
  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault(); // 🛑 منع إعادة تحميل الصفحة
    if (!teacherName.trim() || !currentDeptId) { // ⚠️ فحص وجود الاسم والقسم
      setNameError('يرجى إدخال اسم الأستاذ واللقب الأكاديمي'); // ⚠️ ضبط رسالة التنبيه
      return; // 🛑 خروج
    }

    if (!teacherGender) { // ⚠️ فحص اختيار الجنس
      setErrorMessage('يرجى تحديد جنس الأستاذ (ذكر أو أنثى)'); // ⚠️ تنبيه باختيار الجنس
      setTimeout(() => setErrorMessage(''), 3500); // ⏱️ إخفاء التنبيه
      return; // 🛑 خروج
    }

    if (customTeacherPassword && customTeacherPassword.length < 8) { // ⚠️ فحص طول كلمة المرور
      setErrorMessage('كلمة المرور المخصصة يجب أن لا تقل عن 8 خانات'); // ⚠️ تنبيه بعدم كفاية الخانات
      setTimeout(() => setErrorMessage(''), 3500); // ⏱️ إخفاء التنبيه
      return; // 🛑 خروج
    }

    if (editingTeacherId) { // ✏️ في حالة التعديل على أستاذ موجود
      const candidateEmail = customTeacherEmail.trim()
        ? (customTeacherEmail.includes('@') ? customTeacherEmail.trim().toLowerCase() : `${customTeacherEmail.trim().toLowerCase()}@sadiq.edu.iq`)
        : ''; // ✉️ معالجة نطاق البريد

      if (candidateEmail) {
        // 🛡️ فحص فرادة البريد الأكاديمي للأستاذ عند التعديل
        const emailCheck = checkEmailUniquenessAcrossSystem(candidateEmail, editingTeacherId, profiles);
        if (!emailCheck.isUnique) { // ⚠️ إذا كان البريد مستخدماً
          setErrorMessage(emailCheck.errorMessage || 'البريد الإلكتروني مسجل مسبقاً لمستخدم آخر. يرجى اختيار بريد بديل.');
          setTimeout(() => setErrorMessage(''), 5000); // ⏱️ مسح الإشعار
          return; // 🛑 إلغاء الحفظ
        }
      }

      let editedTeacherObj: UserProfile | null = null; // 👤 كائن الأستاذ بعد التعديل
      const updated = profiles.map((p) => {
        if (p.id === editingTeacherId) {
          const finalEmail = candidateEmail || p.generated_email; // ✉️ البريد النهائي
          const finalPassword = customTeacherPassword.trim() || p.temp_password; // 🔑 الرمز النهائي

          const updatedTeacher: UserProfile = {
            ...p,
            full_name: teacherName.trim(), // 👤 الاسم المعدل
            gender: teacherGender, // 🚻 الجنس
            generated_email: finalEmail, // ✉️ البريد
            temp_password: finalPassword // 🔑 الرمز
          };
          editedTeacherObj = updatedTeacher; // 💾 الاحتفاظ بالكائن
          return updatedTeacher; // 🔄 إرجاع المحدث
        }
        return p; // ⏭️ بقية الحسابات بدون تغيير
      });
      setProfiles(updated); // 💾 تحديث الحالة
      saveStoredData('profiles', updated); // 💾 حفظ محلي
      if (editedTeacherObj) {
        saveProfileToSupabase(editedTeacherObj); // ☁️ مزامنة فورية مع Supabase
      }
      setEditingTeacherId(null); // 🔄 تصفير معرف التعديل
      setSuccessMessage('تم تعديل بيانات الأستاذ بنجاح ومزامنتها سحابياً!'); // ✨ إشعار النجاح
    } else { // ➕ في حالة إضافة أستاذ جديد
      const randomNum = Math.floor(1000 + Math.random() * 9000); // 🔢 توليد رقم جامعي
      let finalEmail = ''; // ✉️ متغير البريد النهائي
      if (customTeacherEmail.trim()) {
        finalEmail = customTeacherEmail.includes('@')
          ? customTeacherEmail.trim().toLowerCase()
          : `${customTeacherEmail.trim().toLowerCase()}@sadiq.edu.iq`;
      } else {
        finalEmail = generateStrongUniqueEmail('dr', profiles); // ⚡ توليد آلي فريد
      }

      // 🛡️ فحص فرادة البريد الأكاديمي للأستاذ قبل الإضافة لمنع التكرار
      const emailCheck = checkEmailUniquenessAcrossSystem(finalEmail, undefined, profiles);
      if (!emailCheck.isUnique) { // ⚠️ إذا كان البريد مكرراً
        setErrorMessage(emailCheck.errorMessage || 'البريد الإلكتروني مسجل مسبقاً في النظام. يرجى كتابة بريد آخر.');
        setTimeout(() => setErrorMessage(''), 5000); // ⏱️ مسح الإشعار
        return; // 🛑 إلغاء الحفظ
      }

      const finalPassword = customTeacherPassword.trim() || generateStrongPassword(); // 🔑 الرمز النهائي

      const newTeacher: UserProfile = {
        id: `usr-tch-${Date.now()}`, // 🆔 معرف الأستاذ
        full_name: teacherName.trim(), // 👤 الاسم الكامل
        role: 'teacher', // 🏷️ الدور
        department_id: currentDeptId, // 🏛️ معرف القسم
        department_name: deptName, // 🏷️ اسم القسم
        university_number: `TCH-${randomNum}`, // 🔢 الرقم الجامعي
        generated_email: finalEmail, // ✉️ البريد
        temp_password: finalPassword, // 🔑 الرمز
        gender: teacherGender, // 🚻 الجنس
        is_active: true, // ✅ الحساب نشط
        must_change_password: false, // 🔒 السماح بالدخول
        created_at: new Date().toISOString(), // 📅 تاريخ الإضافة
        order_index: 0, // 🔢 في مقدمة القائمة
      };

      const updated = [newTeacher, ...profiles.map((p, idx) => ({ ...p, order_index: idx + 1 }))]; // ➕ إضافة في المقدمة
      setProfiles(updated); // 💾 تحديث الحالة
      saveStoredData('profiles', updated); // 💾 حفظ محلي
      saveProfileToSupabase(newTeacher); // ☁️ رفع سحابي فوري
      setSelectedCardProfile(newTeacher); // 📇 إظهار بطاقة الحساب الجديدة
      setSuccessMessage('تمت إضافة الأستاذ وتوليد حسابه الأكاديمي وتوثيقه سحابياً بنجاح!'); // ✨ إشعار النجاح
    }

    setTeacherName(''); // 🔄 تصفير حقل الاسم
    setCustomTeacherEmail(''); // 🔄 تصفير حقل البريد
    setCustomTeacherPassword(''); // 🔄 تصفير حقل كلمة المرور
    setTeacherGender(null); // 🔄 تصفير اختيار الجنس
    setNameError(''); // 🔄 مسح رسائل الخطأ
    setEditingTeacherId(null); // 🔄 إغلاق وضع التعديل
    setIsTeacherModalOpen(false); // 🔒 إغلاق النافذة المنبثقة
    setTimeout(() => setSuccessMessage(''), 4000); // ⏱️ مسح رسالة النجاح
  };

  // 🗑️ حذف أستاذ وإلغاء كافة تكليفاته الأكاديمية
  const handleDeleteTeacher = (id: string) => {
    const targetTeacher = profiles.find((p) => p.id === id); // 👤 البحث عن الأستاذ المستهدف
    setDeleteModalConfig({
      isOpen: true, // 🪟 فتح نافذة الحذف
      title: 'تأكيد حذف الأستاذ الأكاديمي', // 🏷️ عنوان النافذة
      itemName: targetTeacher?.full_name || 'أستاذ', // 👤 اسم الأستاذ
      itemDetails: `البريد الأكاديمي: ${targetTeacher?.generated_email || '—'} | قسم ${deptName}`, // 📝 التفاصيل
      warningMessage: 'هل أنت متأكد من حذف هذا الأستاذ؟ سيتم إلغاء كافة تكليفاته بالمواد الدراسية فوراً ولا يمكن التراجع عن هذا الإجراء.', // ⚠️ التحذير
      confirmText: 'تأكيد الحذف', // 🔘 نص زر التأكيد
      onConfirm: () => {
        const updatedProfiles = profiles.filter((p: UserProfile): boolean => p.id !== id); // 🗑️ استبعاد الأستاذ
        setProfiles(updatedProfiles); // 💾 تحديث الحالة
        saveStoredData('profiles', updatedProfiles); // 💾 حفظ محلي
        deleteProfileFromSupabase(id, 'teacher'); // ☁️ حذف فوري من Supabase

        // 🔗 حذف كافة تكليفات هذا الأستاذ بالمواد الدراسية
        const tcsToDelete = teacherCourses.filter((tc: TeacherCourse): boolean => tc.teacher_id === id);
        tcsToDelete.forEach((tc: TeacherCourse) => {
          deleteTeacherCourseFromSupabase(tc.id); // ☁️ حذف التكليف سحابياً
        });
        const updatedTCs = teacherCourses.filter((tc: TeacherCourse): boolean => tc.teacher_id !== id);
        setTeacherCourses(updatedTCs); // 💾 تحديث التكليفات
        saveStoredData('teacher_courses', updatedTCs); // 💾 حفظ محلي للتكليفات

        // 🔄 تصفير الأستاذ من المواد التي كان مكلفاً بها
        const updatedCourses = courses.map((c: Course): Course => {
          let isChanged = false; // 🚩 مؤشر التغيير
          const newC = { ...c }; // 📝 نسخة من المادة
          if (newC.theory_teacher_id === id) { // 🔍 إذا كان أستاذ النظري
            newC.theory_teacher_id = undefined; // 🔄 تصفير المعرف
            newC.theory_teacher_name = undefined; // 🔄 تصفير الاسم
            isChanged = true; // 🚩 تم التغيير
          }
          if (newC.practical_teacher_id === id) { // 🔍 إذا كان أستاذ العملي
            newC.practical_teacher_id = undefined; // 🔄 تصفير المعرف
            newC.practical_teacher_name = undefined; // 🔄 تصفير الاسم
            isChanged = true; // 🚩 تم التغيير
          }
          if (isChanged) {
            saveCourseToSupabase(newC); // ☁️ مزامنة المادة بعد تفريغ التكليف
          }
          return newC; // 🔄 إرجاع كائن المادة
        });
        setCourses(updatedCourses); // 💾 تحديث المواد
        saveStoredData('courses', updatedCourses); // 💾 حفظ محلي للمواد

        if (typeof window !== 'undefined') { // 📡 بث أحداث التحديث للنظام
          window.dispatchEvent(new Event('courses_updated'));
          window.dispatchEvent(new Event('teacher_courses_updated'));
          window.dispatchEvent(new Event('storage'));
        }

        setSuccessMessage('تم حذف الأستاذ وإلغاء تكليفاته بنجاح.'); // ✨ رسالة النجاح
        setTimeout(() => setSuccessMessage(''), 3000); // ⏱️ مسح الرسالة
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false })); // 🔒 إغلاق نافذة الحذف
      },
    });
  };

  // 🔑 إعادة تعيين كلمة مرور أستاذ وتوليد رمز سري جديد
  const handleResetTeacherPassword = (id: string) => {
    const newPass = generateStrongPassword(); // 🔑 توليد رمز سري قوي
    const updated = profiles.map((p) => {
      if (p.id === id) {
        const u = { ...p, temp_password: newPass }; // 📝 وضع الرمز الجديد
        setSelectedCardProfile(u); // 📇 إظهار بطاقة الحساب فورا بالرمز الجديد
        return u; // 🔄 إرجاع الحساب المحدث
      }
      return p; // ⏭️ بقية الحسابات
    });
    setProfiles(updated); // 💾 تحديث الحالة
    saveStoredData('profiles', updated); // 💾 حفظ محلي
    setSuccessMessage('تم توليد كلمة مرور جديدة للأستاذ!'); // ✨ إشعار النجاح
    setTimeout(() => setSuccessMessage(''), 3000); // ⏱️ إخفاء الإشعار
  };

  // 🔘 تبديل تحديد كافة الأساتذة في القسم
  const toggleSelectAllTeachers = () => {
    if (selectedTeacherIds.length === deptTeachers.length) {
      setSelectedTeacherIds([]); // 🔄 إلغاء التحديد بالكامل
    } else {
      setSelectedTeacherIds(deptTeachers.map((t) => t.id)); // 🔘 تحديد الكل
    }
  };

  // 🔘 تبديل تحديد أستاذ مفرد
  const toggleSelectTeacher = (id: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id] // 🔄 إضافة أو إزالة المعرف
    );
  };

  // 🗑️ الحذف الجماعي للأساتذة المحددين
  const handleBulkDeleteTeachers = () => {
    const count = selectedTeacherIds.length; // 🔢 عدد الأساتذة المحددين
    if (count === 0) return; // 🛑 إذا لم يتم تحديد أحد نخرج

    setDeleteModalConfig({
      isOpen: true, // 🪟 فتح نافذة الحذف
      title: `تأكيد الحذف الجماعي لـ (${count}) أساتذة`, // 🏷️ عنوان العملية
      itemName: `${count} من أساتذة قسم ${deptName}`, // 👤 العناصر
      itemDetails: `سيتم حذف حسابات الأساتذة المحددين وإلغاء تكليفاتهم بالمواد في القسم.`, // 📝 التفاصيل
      warningMessage: `⚠️ تنبيه أمني: هل أنت متأكد من حذف (${count}) من كادر التدريسيين دفعة واحدة؟ لا يمكن التراجع عن هذه الخطوة.`, // ⚠️ التحذير
      confirmText: `حذف (${count}) أساتذة نهائياً`, // 🔘 زر التأكيد
      onConfirm: () => {
        selectedTeacherIds.forEach((id: string) => {
          deleteProfileFromSupabase(id, 'teacher'); // ☁️ حذف الأساتذة سحابياً
        });

        // 🔗 حذف تكليفات كافة الأساتذة المحددين
        const tcsToDelete = teacherCourses.filter((tc: TeacherCourse): boolean => selectedTeacherIds.includes(tc.teacher_id));
        tcsToDelete.forEach((tc: TeacherCourse) => {
          deleteTeacherCourseFromSupabase(tc.id); // ☁️ حذف التكليفات سحابياً
        });
        const updatedTCs = teacherCourses.filter((tc: TeacherCourse): boolean => !selectedTeacherIds.includes(tc.teacher_id));
        setTeacherCourses(updatedTCs); // 💾 تحديث التكليفات
        saveStoredData('teacher_courses', updatedTCs); // 💾 حفظ محلي

        const updatedProfiles = profiles.filter((p: UserProfile): boolean => !selectedTeacherIds.includes(p.id));
        setProfiles(updatedProfiles); // 💾 تحديث البروفايلات
        saveStoredData('profiles', updatedProfiles); // 💾 حفظ محلي

        // 🔄 تفريغ الأساتذة المحددين من المواد المرتبطة بهم
        const updatedCourses = courses.map((c: Course): Course => {
          let isChanged = false; // 🚩 مؤشر التغيير
          const newC = { ...c }; // 📝 نسخة من المادة
          if (newC.theory_teacher_id && selectedTeacherIds.includes(newC.theory_teacher_id)) {
            newC.theory_teacher_id = undefined; // 🔄 تفريغ أستاذ النظري
            newC.theory_teacher_name = undefined;
            isChanged = true;
          }
          if (newC.practical_teacher_id && selectedTeacherIds.includes(newC.practical_teacher_id)) {
            newC.practical_teacher_id = undefined; // 🔄 تفريغ أستاذ العملي
            newC.practical_teacher_name = undefined;
            isChanged = true;
          }
          if (isChanged) {
            saveCourseToSupabase(newC); // ☁️ مزامنة المادة بعد التحديث
          }
          return newC; // 🔄 إرجاع المادة
        });
        setCourses(updatedCourses); // 💾 تحديث المواد
        saveStoredData('courses', updatedCourses); // 💾 حفظ محلي

        if (typeof window !== 'undefined') { // 📡 بث تحديثات النظام
          window.dispatchEvent(new Event('courses_updated'));
          window.dispatchEvent(new Event('teacher_courses_updated'));
          window.dispatchEvent(new Event('storage'));
        }

        setSelectedTeacherIds([]); // 🔄 تصفير قائمة التحديد
        setSuccessMessage(`تم حذف (${count}) من أساتذة القسم بنجاح وتفريغ تكليفاتهم.`); // ✨ رسالة النجاح
        setTimeout(() => setSuccessMessage(''), 3500); // ⏱️ مسح الإشعار
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false })); // 🔒 إغلاق المودال
      },
    });
  };

  // 📊 تصدير الأساتذة المحددين إلى ملف Excel
  const handleBulkExportTeachersExcel = async () => {
    const selectedTeachersList = deptTeachers.filter((t) => selectedTeacherIds.includes(t.id)); // 🎯 تصفية المحددين
    if (selectedTeachersList.length === 0) return; // 🛑 إذا فارغة خروج

    await exportCustomTeachersList(selectedTeachersList, deptName); // 📊 استدعاء دالة التصدير
    setSuccessMessage(`تم تصدير (${selectedTeachersList.length}) أستاذ إلى ملف Excel بنجاح! 📊`); // ✨ رسالة النجاح
    setTimeout(() => setSuccessMessage(''), 3500); // ⏱️ إخفاء الإشعار
  };

  // 📊 تصدير كادر أساتذة القسم بالكامل إلى ملف Excel مع الحسابات وكلمات المرور
  const handleExportTeachersExcel = async () => {
    try {
      setIsExportingTeachersExcel(true); // ⏳ تفعيل مؤشر التحميل
      const targetTeachers = selectedTeacherIds.length > 0
        ? deptTeachers.filter((t: UserProfile): boolean => selectedTeacherIds.includes(t.id))
        : deptTeachers; // 🎯 إما المحددون أو جميع أساتذة القسم

      if (targetTeachers.length === 0) {
        setErrorMessage('لا يوجد أساتذة في القسم للتصدير حالياً.'); // ⚠️ تنبيه بعدم وجود بيانات
        setTimeout(() => setErrorMessage(''), 3000); // ⏱️ مسح التنبيه
        return; // 🛑 خروج
      }

      await exportCustomTeachersList(targetTeachers, deptName); // 📊 التصدير الفعلي
      setSuccessMessage(`تم بنجاح تصدير كشف (${targetTeachers.length}) أستاذ بالبريد والرمز إلى ملف Excel! 📊`); // ✨ إشعار النجاح
      setTimeout(() => setSuccessMessage(''), 4000); // ⏱️ مسح الإشعار
    } catch (error) {
      console.error('خطأ في تصدير أساتذة القسم:', error); // 🚨 تسجيل الخطأ
      setErrorMessage('حدث خطأ أثناء تصدير ملف الإكسل للأساتذة.'); // ⚠️ إشعار الخطأ
      setTimeout(() => setErrorMessage(''), 4000); // ⏱️ مسح الإشعار
    } finally {
      setIsExportingTeachersExcel(false); // 🛑 إيقاف مؤشر التحميل
    }
  };

  // 🔀 دالة تغيير ترتيب الأستاذ يدوياً في كادر القسم (تقديم وتأخير ⬆️ ⬇️)
  const handleMoveTeacher = (currentIndex: number, direction: 'up' | 'down', currentList: UserProfile[], e: React.MouseEvent) => {
    e.stopPropagation(); // 🛑 منع انتشار الحدث
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1; // 🎯 المؤشر المستهدف
    if (targetIndex < 0 || targetIndex >= currentList.length) return; // 🛑 فحص الحدود

    const listCopy = [...currentList]; // 📋 نسخة من القائمة الحالية
    const itemToMove = listCopy[currentIndex]; // 👤 الأستاذ المنقول
    listCopy[currentIndex] = listCopy[targetIndex]; // 🔄 التبديل
    listCopy[targetIndex] = itemToMove; // 🔄 التبديل

    const targetIds = new Set(listCopy.map((p) => p.id)); // 🔍 المعرفات المتأثرة
    const otherProfiles = profiles.filter((p) => !targetIds.has(p.id)); // 👥 بقية المستخدمين
    const reindexedList = listCopy.map((p, idx) => ({ ...p, order_index: idx })); // 🔢 إعادة ترقيم الفهارس
    const combined = [...reindexedList, ...otherProfiles]; // ➕ دمج القائمة

    setProfiles(combined); // 💾 تحديث الحالة
    saveStoredData('profiles', combined); // 💾 حفظ محلي
  };

  return {
    // 👤 حالات الأستاذ
    teacherName,
    setTeacherName,
    teacherGender,
    setTeacherGender,
    customTeacherEmail,
    setCustomTeacherEmail,
    customTeacherPassword,
    setCustomTeacherPassword,
    showTeacherPassword,
    setShowTeacherPassword,
    editingTeacherId,
    setEditingTeacherId,
    isTeacherModalOpen,
    setIsTeacherModalOpen,
    nameError,
    setNameError,

    // 📊 حالات الإكسل والتقارير
    showExcelInstructions,
    setShowExcelInstructions,
    isImportingExcel,
    setIsImportingExcel,
    importReport,
    setImportReport,
    activeReportTab,
    setActiveReportTab,

    // 👥 التحديد والصفحات والتصدير
    selectedTeacherIds,
    setSelectedTeacherIds,
    teacherPage,
    setTeacherPage,
    teacherPageSize,
    setTeacherPageSize,
    isExportingTeachersExcel,
    setIsExportingTeachersExcel,

    // 🖨️ طباعة البطاقات
    showTeacherPrintModal,
    setShowTeacherPrintModal,
    singleTeacherPrintProfile,
    setSingleTeacherPrintProfile,

    // 🔐 شروط وقوة كلمة المرور
    passwordCriteria,
    passwordStrengthScore,

    // 👥 كادر القسم المصفي
    deptTeachers,

    // ⚡ دوال المعالجة
    handleAutoGenerateCredentials,
    handleDownloadTeacherTemplate,
    handleTeacherExcelUpload,
    handleSaveTeacher,
    handleDeleteTeacher,
    handleResetTeacherPassword,
    toggleSelectAllTeachers,
    toggleSelectTeacher,
    handleBulkDeleteTeachers,
    handleBulkExportTeachersExcel,
    handleExportTeachersExcel,
    handleMoveTeacher,
  };
};
