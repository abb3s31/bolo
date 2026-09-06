// 🛡️ ملف دوال التحقق الصارم من فرادة البيانات والبريد الأكاديمي ومنع التكرار نهائياً
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان | مسار بولونيا المعتمد

import { UserProfile, UserRole } from '@/types'; // 🔗 استيراد واجهة المستخدم والأدوار المعتمدة
import { getStoredData, INITIAL_PROFILES, generateStrongUniqueEmail } from '@/lib/mock-data'; // 💾 دوال استرجاع الحسابات وتوليد البريد الفريد
import { supabase } from '@/lib/supabase-client'; // 🔌 عميل سوبابيز للاستعلام السحابي المباشر

// 📋 واجهة نتيجة فحص فرادة البريد الإلكتروني
export interface EmailValidationResult {
  isUnique: boolean; // 🔘 هل البريد فريد ومتاح للاستخدام؟
  conflictUser?: { // 👤 معلومات الحساب المالك للبريد بحال وجود تكرار
    name: string; // 📝 اسم صاحب الحساب
    role: string; // 🎭 دوره الأكاديمي
    department?: string; // 🏢 القسم التابع له
    universityNumber?: string; // 🆔 الرقم الجامعي أو الكود الوظيفي
  };
  errorMessage?: string; // ⚠️ نص رسالة الخطأ الواضحة بالعربي
}

// 🏷️ دالة تحويل الدور الإنكليزي إلى مسمى عربي مفهوم
export function getRoleArabicLabel(role: UserRole | string): string {
  switch (role) { // 🔍 فحص الدور الممرر
    case 'student': // 🎓 طالب
      return 'طالب'; // 🏷️ مسمى الطالب
    case 'teacher': //  أستاذ
      return 'تدريسي'; // 🏷️ مسمى التدريسي
    case 'department_head': // 🏢 رئيس قسم
      return 'رئيس قسم'; // 🏷️ مسمى رئيس القسم
    case 'rapporteur': // 📝 مقرر
      return 'مقرر قسم'; // 🏷️ مسمى المقرر
    case 'super_admin': // 👑 مسؤول عام
    case 'admin': // 🛡️ أدمن
      return 'مدير نظام'; // 🏷️ مسمى المدير
    default: // ❓ دور غير محدد
      return 'مستخدم'; // 🏷️ مسمى عام
  }
}

// 📧 دالة تنظيف وتوحيد صيغة البريد الإلكتروني
export function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase(); // 🧹 تنظيف المسافات وتحويل لحروف صغيرة
  if (!trimmed) return ''; // 🚫 إذا فارغ يرجع فارغ
  if (trimmed.includes('@')) return trimmed; // 📧 إذا بيه علامة @ يبقة نفسه
  return `${trimmed}@sadiq.edu.iq`; // 🏛️ إذا ما بيه @ نضيف نطاق الجامعة الرسمي
}

// 🔍 دالة فحص فرادة البريد محلياً عبر كافة حسابات المنظومة
export function checkEmailUniquenessAcrossSystem(
  email: string, // ✉️ البريد المطلوب فحصه
  excludeUserId?: string, // 🚫 استثناء معرّف الحساب الحالي بحالة التعديل
  existingProfiles?: UserProfile[] // 📚 قائمة الحسابات الاختيارية للفحص
): EmailValidationResult {
  const normalized = normalizeEmail(email); // 🧹 تنظيف البريد المطلوب
  if (!normalized) { // 🚫 التأكد من وجود قيمة للبريد
    return { isUnique: true }; // ✅ نعتبره متاح لحد ما يدخل قيمة
  }

  // 📦 جلب كافة الحسابات من الذاكرة المحلية أو القائمة الممررة
  const allProfiles = existingProfiles && existingProfiles.length > 0 // 🔍 هل تم تمرير مصفوفة حسابات؟
    ? existingProfiles // 📂 نعتمد القائمة الممررة
    : getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES); // 💾 نسحب من اللوكال ستورج

  // 🔎 البحث عن أي حساب يملك نفس البريد باستثناء الحساب الحالي
  const conflict = allProfiles.find((p) => { // 🔍 ندور بالمصفوفة
    if (excludeUserId && p.id === excludeUserId) { // 🚫 نتجاوز الحساب الحالي إذا دا نعدل بيه
      return false; // ⏭️ تخطي
    }
    const userEmail = normalizeEmail(p.generated_email || ''); // 🧹 تنظيف بريد الحساب المسجل
    return userEmail === normalized; // ⚖️ مقارنة البريدين بعد التنظيف
  });

  if (conflict) { // ⚠️ إذا لكينة حساب مسجل مسبقاً بهذا البريد
    const roleText = getRoleArabicLabel(conflict.role); // 🏷️ استخراج مسمى الدور بالعربي
    const deptText = conflict.department_name ? ` في ${conflict.department_name}` : ''; // 🏢 استخراج القسم
    return {
      isUnique: false, // ❌ البريد مكرر ومرفوض
      conflictUser: { // 👤 تجهيز تفاصيل الحساب المتضارب داخلياً
        name: conflict.full_name, // 📝 اسم الشخص
        role: roleText, // 🎭 صفته
        department: conflict.department_name, // 🏢 قسمه
        universityNumber: conflict.university_number, // 🆔 رقمه
      },
      errorMessage: `البريد الإلكتروني (${normalized}) مسجل مسبقاً في المنظومة. يرجى استخدام بريد آخر لمنع التكرار.`, // 🛡️ رسالة آمنة تحمي الخصوصية وتمنع كشف هوية الحسابات
    };
  }

  return { isUnique: true }; // ✅ البريد فريد وجاهز للاستخدام
}

// ☁️ دالة فحص فرادة البريد الإلكتروني سحابياً عبر قاعدة بيانات Supabase
export async function checkEmailExistsInSupabase(
  email: string, // ✉️ البريد المطلوب تدقيقه سحابياً
  excludeUserId?: string // 🚫 استثناء الحساب الحالي بالتعديل
): Promise<EmailValidationResult> {
  const normalized = normalizeEmail(email); // 🧹 تنظيف البريد
  if (!normalized) { // 🚫 التأكد من القيمة
    return { isUnique: true }; // ✅ نعتبره متاح
  }

  try {
    // 🔍 استعلام جدول profiles العام بالسحابة للتحقق من وجود البريد
    const { data, error } = await supabase // ⚡ طلب مباشر من سوبابيز
      .from('profiles') // 🏛️ جدول الحسابات
      .select('id, full_name, role, department_name, university_number, generated_email') // 📊 الحقول المطلوبة
      .ilike('generated_email', normalized) // 🔎 مطابقة البريد بدون تحسس لحجم الحروف
      .maybeSingle(); // 🎯 إرجاع سجل واحد إن وجد

    if (error && error.code !== 'PGRST116') { // ⚠️ إذا اكو خطأ حقيقي غير خطأ عدم وجود سجل
      console.warn('تحذير أثناء فحص البريد في Supabase:', error.message); // 📝 تسجيل التحذير
      return { isUnique: true }; // 🛡️ السماح مع الاعتماد على الفحص المحلي
    }

    if (data && (!excludeUserId || data.id !== excludeUserId)) { // ⚠️ إذا لكينة سجل مطابق وبـ ID مختلف
      const roleText = getRoleArabicLabel(data.role as UserRole); // 🏷️ استخراج المسمى بالعربي
      return {
        isUnique: false, // ❌ البريد موجود مسبقاً بالسحابة
        conflictUser: { // 👤 تفاصيل صاحب الحساب
          name: data.full_name, // 📝 اسمه
          role: roleText, // 🎭 دوره
          department: data.department_name, // 🏢 قسمه
          universityNumber: data.university_number, // 🆔 رقمه
        },
        errorMessage: `البريد الإلكتروني (${normalized}) مسجل مسبقاً في المنظومة. يرجى إدخال بريد آخر.`, // 🛡️ رسالة آمنة لحماية الخصوصية
      };
    }

    return { isUnique: true }; // ✅ البريد غير موجود بالسحابة وفريد
  } catch (err) { // ⚠️ التقاط أي خطأ استثنائي
    console.error('خطأ فحص فرادة البريد في Supabase:', err); // 📝 تسجيل الخطأ
    return { isUnique: true }; // 🛡️ التراجع للفحص المحلي بحالة انقطاع النت
  }
}

// 🔍 دالة فحص وكشف كافة الحسابات التي تشترك بالبريد في المنظومة حالياً
export function detectDuplicateEmails(profiles: UserProfile[]): Array<{ email: string; count: number; profiles: UserProfile[] }> {
  const emailMap = new Map<string, UserProfile[]>(); // 🗺️ خريطة تجميع الحسابات حسب البريد

  profiles.forEach((p) => { // 🔄 المرور على كل الحسابات
    const email = normalizeEmail(p.generated_email || ''); // 🧹 تنظيف البريد
    if (!email) return; // 🚫 تخطي الحسابات الما عدهه بريد
    const existing = emailMap.get(email) || []; // 📦 جلب القائمة الحالية أو مصفوفة فارغة
    existing.push(p); // ➕ إضافة الحساب للمجموعة
    emailMap.set(email, existing); // 💾 تحديث الخريطة
  });

  const duplicates: Array<{ email: string; count: number; profiles: UserProfile[] }> = []; // 📋 مصفوفة الحسابات المكررة

  emailMap.forEach((userList, email) => { // 🔄 فحص التكرارات
    if (userList.length > 1) { // ⚠️ إذا البريد مشترك لأكثر من حساب
      duplicates.push({ // ➕ إدراجه بقائمة المشاكل
        email, // ✉️ البريد المكرر
        count: userList.length, // 🔢 عدد الحسابات المشتركة بيه
        profiles: userList, // 👥 الحسابات المتضاربة
      });
    }
  });

  return duplicates; // 📤 إرجاع التقرير الشامل للتكرارات
}

// 🔧 دالة المعالجة التلقائية السريعة لكافة الإيميلات المكررة حالياً بقاعدة البيانات
export function resolveDuplicateEmailsInProfiles(profiles: UserProfile[]): {
  updatedProfiles: UserProfile[]; // 📦 المصفوفة المعالجة النظيفة
  fixedCount: number; // 🔢 عدد الحسابات التي تم إصلاح بريدها
  fixedDetails: Array<{ name: string; oldEmail: string; newEmail: string }>; // 📝 سجل التعديلات التفصيلي
} {
  const seenEmails = new Set<string>(); // 🗄️ مجموعة لتتبع الإيميلات المحجوزة
  const fixedDetails: Array<{ name: string; oldEmail: string; newEmail: string }> = []; // 📋 سجل العمليات
  let fixedCount = 0; // 🔢 عداد الحسابات المعدلة

  const updatedProfiles = profiles.map((p) => { // 🔄 فحص كل حساب
    const email = normalizeEmail(p.generated_email || ''); // 🧹 تنظيف البريد
    
    // 🔍 إذا البريد فارغ أو مكرر وسبق أن انحجز لحساب قبله
    if (!email || seenEmails.has(email)) {
      fixedCount++; // ➕ زيادة عداد التصحيح
      // 🎲 تحديد البادئة المناسبة حسب دور المستخدم
      const prefix = p.role === 'student' ? 'st' : p.role === 'teacher' ? 'dr' : p.role === 'department_head' ? 'head' : 'rap';
      // 🎲 توليد بريد أكاديمي فريد جديد ومضمون
      const newEmail = generateStrongUniqueEmail(prefix, profiles);
      seenEmails.add(newEmail); // 💾 حجز البريد الجديد
      fixedDetails.push({ // 📝 توثيق الإصلاح
        name: p.full_name, // 👤 اسم الحساب
        oldEmail: email || 'بدون بريد', // ✉️ البريد القديم
        newEmail, // ✉️ البريد الجديد المولد
      });
      return { // 🔄 إرجاع كائن الحساب مع البريد الجديد
        ...p, // 📋 باقي البيانات كما هي
        generated_email: newEmail, // ✨ البريد الجديد الفريد
      };
    }

    seenEmails.add(email); // 💾 حجز البريد الأول كبريد أصلي
    return p; // ✅ إبقاء الحساب كما هو
  });

  return { updatedProfiles, fixedCount, fixedDetails }; // 📤 تصدير النتيجة النهائية
}

// 🔑 واجهة نتيجة فحص معايير كلمة المرور الأكاديمية
export interface PasswordCriteriaResult {
  hasMinLength: boolean; // 📏 هل الطول 8 خانات فأكثر
  hasUpper: boolean; // 🔠 هل يحتوي على حرف كبير إنجليزي
  hasNumber: boolean; // 🔢 هل يحتوي على رقم من 0 إلى 9
  hasSpecial: boolean; // 🔣 هل يحتوي على رمز خاص
  score: number; // 📊 النسبة المئوية لقوة الرمز (0 إلى 100)
  strengthLabel: 'رمز ضعيف' | 'رمز متوسط' | 'رمز قوي ومثالي'; // 🏷️ التقييم النصي الرسمي
}

// 🛡️ دالة تقييم كلمة المرور الأكاديمية الموحدة لجميع شاشات ومودالات المنظومة
export function evaluatePasswordCriteria(password: string): PasswordCriteriaResult {
  const hasMinLength = (password || '').length >= 8; // 📏 فحص أن الطول 8 خانات على الأقل
  const hasUpper = /[A-Z]/.test(password || ''); // 🔠 فحص وجود حرف إنجليزي كبير
  const hasNumber = /[0-9]/.test(password || ''); // 🔢 فحص وجود أرقام
  const hasSpecial = /[^A-Za-z0-9]/.test(password || ''); // 🔣 فحص وجود رموز خاصة مثل !@#$
  
  let score = 0; // 💯 تهيئة الدرجة المئوية
  if (hasMinLength) score += 25; // ➕ إضافة 25 درجة للطول الكافي
  if (hasUpper) score += 25; // ➕ إضافة 25 درجة للحرف الكبير
  if (hasNumber) score += 25; // ➕ إضافة 25 درجة للأرقام
  if (hasSpecial) score += 25; // ➕ إضافة 25 درجة للرموز الخاصة
  
  // 🏷️ تعيين الوصف النصي المعتمد وفق الدرجة المئوية
  const strengthLabel: 'رمز ضعيف' | 'رمز متوسط' | 'رمز قوي ومثالي' = 
    score === 100 ? 'رمز قوي ومثالي' : score >= 50 ? 'رمز متوسط' : 'رمز ضعيف';
  
  return { // 📤 إرجاع التقييم الكامل
    hasMinLength, // 📏 نتيجة الطول
    hasUpper, // 🔠 نتيجة الحرف الكبير
    hasNumber, // 🔢 نتيجة الرقم
    hasSpecial, // 🔣 نتيجة الرمز الخاص
    score, // 📊 الدرجة المئوية
    strengthLabel, // 🏷️ الوصف النصي
  };
}
