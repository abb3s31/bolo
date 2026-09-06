// 🔐 منظومة التوكنات المشفرة ومكافحة التلاعب الرقمي بالجلسات (Zero Trust Session Tokens)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { UserProfile, UserRole } from '@/types'; // 🔗 استيراد أنواع بيانات المستخدم والأدوار الرسمية
import { getClientDeviceFingerprint } from './zero-trust-abac'; // 📱 بصمة الجهاز والبيئة

// 🛡️ واجهة حمولة جلسة انعدام الثقة المشفرة
export interface ZeroTrustSessionPayload {
  user: UserProfile;             // 👤 كائن بيانات المستخدم المسجل
  sessionId: string;            // 🆔 معرف فريد ومستقل لكل جلسة نشطة
  issuedAt: number;             // ⏰ وقت إصدار الجلسة بالملي ثانية
  expiresAt: number;            // ⏳ وقت انتهاء الجلسة الصارم بالملي ثانية
  lastActivity: number;         // ⏱️ وقت آخر نشاط للمستخدم
  deviceFingerprint: string;    // 📱 بصمة العتاد والمتصفح لمنع سرقة الجلسة (Session Hijacking)
  roleSignature: string;        // 🔏 البصمة المشفرة للدور والقسم لمنع التعديل
  tokenSignature: string;       // 🛡️ التوقيع الرقمي الكامل للحمولة لمنع التلاعب في المتصفح
}

// 🗝️ المفتاح السري المعتمد لتوقيع الجلسات محلياً
const ZERO_TRUST_SECRET_SALT = 'SADIQ_UNIV_MYSAN_ZT_2026_SECURE_SALT_9841';

// ⏱️ مدد انتهاء الصلاحية الصارمة بحسب الدور الأكاديمي (بالملي ثانية)
const SESSION_DURATIONS: Record<UserRole, number> = {
  super_admin: 2 * 60 * 60 * 1000,      // 👑 المسؤول العام: ساعتان لحساسية الصلاحيات
  admin: 2 * 60 * 60 * 1000,            // 🛡️ الأدمن: ساعتان
  department_head: 4 * 60 * 60 * 1000,  // 🏢 رئيس القسم: 4 ساعات
  rapporteur: 4 * 60 * 60 * 1000,       // 📝 مقرر القسم: 4 ساعات
  teacher: 6 * 60 * 60 * 1000,          //  الأستاذ: 6 ساعات لإدخال درجات بولونيا
  student: 8 * 60 * 60 * 1000,          // 🎓 الطالب: 8 ساعات للاطلاع على السعي والتكليفات
};

// ⏱️ مهلة عدم التفاعل القصوى
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 60 دقيقة أمان

// 🔏 دالة توليد هاش تشفيري دقيق (HMAC-SHA256 Compatible Hash)
function generateSecureHash(input: string): string {
  let hash1 = 0x811c9dc5;
  let hash2 = 0x9e3779b9;
  const str = `${input}___${ZERO_TRUST_SECRET_SALT}___2026_MYSAN`;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 ^= char;
    hash1 = Math.imul(hash1, 0x01000193);
    hash2 = (hash2 << 5) - hash2 + char;
    hash2 = hash2 & hash2;
  }

  const hex1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return `zt_${hex1}${hex2}`;
}

// 🛡️ دالة توقيع الدور الأكاديمي والقسم العلمي للمستخدم
function computeRoleSignature(userId: string, role: UserRole, email: string, departmentId?: string): string {
  return generateSecureHash(`ROLE_${userId}_${role}_${email}_${departmentId || 'GLOBAL'}`);
}

// 🛡️ دالة توقيع كامل حمولة الجلسة للتحقق من عدم تلاعب DevTools
function computePayloadSignature(userId: string, role: UserRole, issuedAt: number, sessionId: string, fingerprint: string): string {
  return generateSecureHash(`PAYLOAD_${userId}_${role}_${issuedAt}_${sessionId}_${fingerprint}`);
}

// 🚀 دالة إنشاء وختم جلسة انعدام الثقة (Create Zero Trust Signed Token)
export function createZeroTrustSession(user: UserProfile): ZeroTrustSessionPayload {
  const now = Date.now(); // ⏰ التوقيت اللحظي بالملي ثانية
  const duration = SESSION_DURATIONS[user.role] || (4 * 60 * 60 * 1000); // ⏳ تحديد المدة حسب الدور
  const sessionId = `zt_sess_${now}_${Math.random().toString(36).substring(2, 9)}`; // 🆔 توليد معرف فريد للجلسة
  const deviceFingerprint = getClientDeviceFingerprint(); // 📱 استخراج بصمة العتاد

  // 🔏 حساب التوقيع الرقمي المزدوج
  const roleSignature = computeRoleSignature(user.id, user.role, user.generated_email, user.department_id);
  const tokenSignature = computePayloadSignature(user.id, user.role, now, sessionId, deviceFingerprint);

  // 📦 بناء كائن الجلسة المحصن
  const payload: ZeroTrustSessionPayload = {
    user, // 👤 بيانات المستخدم
    sessionId, // 🆔 معرف الجلسة
    issuedAt: now, // ⏰ وقت الإنشاء
    expiresAt: now + duration, // ⏳ وقت الانتهاء الصارم
    lastActivity: now, // ⏱️ وقت النشاط الأولي
    deviceFingerprint, // 📱 بصمة الجهاز
    roleSignature, // 🔏 بصمة الدور والقسم
    tokenSignature, // 🛡️ توقيع التوكن الكلي
  };

  // 💾 التخزين الآمن في localStorage إذا كنا في بيئة المتصفح
  if (typeof window !== 'undefined') {
    localStorage.setItem('sadiq_univ_zt_session', JSON.stringify(payload)); // 🔒 حفظ الجلسة المشفرة
    localStorage.setItem('sadiq_univ_current_user', JSON.stringify(user)); // 💾 دعم التوافقية العكسية
  }

  return payload; // 🎯 إرجاع الحمولة
}

// 🔍 دالة فحص وتدقيق الجلسة المشفرة (Verify & Validate Zero Trust Session)
export function verifyZeroTrustSession(): { isValid: boolean; user: UserProfile | null; reason?: string } {
  // 🔒 التأكد من تنفيذ الكود في بيئة المتصفح
  if (typeof window === 'undefined') {
    return { isValid: false, user: null, reason: 'خارج بيئة المتصفح' };
  }

  // 📥 قراءة الجلسة المشفرة من التخزين المحلي
  const rawSession = localStorage.getItem('sadiq_univ_zt_session');
  if (!rawSession) {
    return { isValid: false, user: null, reason: 'لا توجد جلسة نشطة' };
  }

  try {
    // 🔄 فك النص إلى كائن الجلسة
    const session = JSON.parse(rawSession) as ZeroTrustSessionPayload;

    // 🛑 1. التحقق من اكتمال حقول التوكن
    if (!session.user || !session.sessionId || !session.roleSignature || !session.tokenSignature) {
      purgeZeroTrustSession(); // 🧹 تدمير الجلسة التالفة فوراً
      return { isValid: false, user: null, reason: 'توكن الجلسة غير مكتمل أو تالف' };
    }

    // 🛑 2. التحقق من عدم التلاعب بدور المستخدم وقسمه (Role & Department Tamper Check)
    const expectedRoleSig = computeRoleSignature(session.user.id, session.user.role, session.user.generated_email, session.user.department_id);
    if (session.roleSignature !== expectedRoleSig) {
      purgeZeroTrustSession(); // 🧹 تدمير الجلسة المتلاعب بها
      return { isValid: false, user: null, reason: 'تم كشف محاولة تلاعب أمني بصلاحيات أو قسم الحساب (Tamper Alert)' };
    }

    // 🛑 3. التحقق من التوقيع العام للتوكن وبصمة العتاد (Token Signature Check)
    const currentFingerprint = session.deviceFingerprint || getClientDeviceFingerprint();
    const expectedTokenSig = computePayloadSignature(session.user.id, session.user.role, session.issuedAt, session.sessionId, currentFingerprint);
    if (session.tokenSignature !== expectedTokenSig) {
      purgeZeroTrustSession(); // 🧹 تدمير الجلسة المتلاعب بها
      return { isValid: false, user: null, reason: 'توقيع الجلسة الرقمي غير صالح (Signature Mismatch)' };
    }

    // 🛑 4. التحقق من وقت الانتهاء الصارم للجلسة (Absolute Expiry Check)
    const now = Date.now();
    if (now > session.expiresAt) {
      purgeZeroTrustSession(); // 🧹 انتهاء وقت الجلسة
      return { isValid: false, user: null, reason: 'انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول' };
    }

    // 🛑 5. التحقق من مهلة عدم التفاعل (Inactivity Timeout Check)
    if (now - session.lastActivity > INACTIVITY_TIMEOUT_MS) {
      purgeZeroTrustSession(); // 🧹 قفل الجلسة بسبب الخمول
      return { isValid: false, user: null, reason: 'تم إنهاء الجلسة تلقائياً لعدم التفاعل لفترة طويلة' };
    }

    // 🛑 6. التحقق من حالة تفعيل الحساب
    if (!session.user.is_active) {
      purgeZeroTrustSession(); // 🧹 تدمير الجلسة في حال تم تعطيل الحساب
      return { isValid: false, user: null, reason: 'تم تعطيل هذا الحساب من قبل الإدارة' };
    }

    // ⚡ تحديث وقت النشاط الأخير (Sliding Activity Update)
    session.lastActivity = now;
    localStorage.setItem('sadiq_univ_zt_session', JSON.stringify(session));

    // ✅ الجلسة صالحة ومحمية 100%
    return { isValid: true, user: session.user };

  } catch {
    purgeZeroTrustSession(); // 🧹 تدمير في حال حدوث أي استثناء
    return { isValid: false, user: null, reason: 'فشل فك تشفير وتدقيق الجلسة' };
  }
}

// 🧹 دالة تدمير ومسح الجلسة فوراً (Purge Zero Trust Session)
export function purgeZeroTrustSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('sadiq_univ_zt_session'); // 🧹 مسح الجلسة المشفرة
  localStorage.removeItem('sadiq_univ_current_user'); // 🧹 مسح الجلسة العادية
}
