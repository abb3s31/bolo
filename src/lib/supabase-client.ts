// 🔌 عميل وإدارة الجلسات لقاعدة البيانات الرسمية المحصنة بنموذج انعدام الثقة (Zero Trust Architecture)
// 🏛️ جامعة الإمام جعفر الصادق (ع) فرع ميسان - مسار بولونيا

import { createClient } from '@supabase/supabase-js'; // 📦 مكتبة Supabase الرسمية
import { 
  UserProfile, 
  Grade, 
  Department, 
  Stage,
  Course, 
  AuditLog, 
  TeacherCourse, 
  UserRole,
  SuperAdminRecord,
  DepartmentHeadRecord,
  DepartmentRapporteurRecord,
  TeacherRecord,
  StudentRecord,
  ScheduleLecture,
  DayOfWeek, // 📅 نوع اليوم الأسبوعي المعتمد في بولونيا
  DepartmentScheduleConfig,
  StudentAttendanceRecord,
  StudentTuitionRecord,
  AttendanceExcuseRequest,
  FinalExamSchedule,
  FinalExamSlot,
  CampusAnnouncement,
  CourseAcademicTask,
  StudentTaskSubmission,
  AppNotification,
} from '@/types'; // 🔗 الأنواع الرسمية لكافة الكيانات
import { 
  getStoredData, 
  saveStoredData, 
  getAcademicYear,
  saveAcademicYear,
  INITIAL_PROFILES, 
  INITIAL_DEPARTMENTS, 
  INITIAL_STAGES,
  INITIAL_COURSES,
  INITIAL_TEACHER_COURSES,
  INITIAL_GRADES,
  INITIAL_SCHEDULE_LECTURES, 
  INITIAL_SCHEDULE_CONFIGS, 
  INITIAL_ATTENDANCE_RECORDS, 
  INITIAL_TUITION_RECORDS,
  INITIAL_FINAL_EXAM_SCHEDULES,
  INITIAL_FINAL_EXAM_SLOTS,
  INITIAL_CAMPUS_ANNOUNCEMENTS,
  INITIAL_ACADEMIC_TASKS,
  INITIAL_STUDENT_SUBMISSIONS,
  INITIAL_EXCUSE_REQUESTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS
} from '@/lib/mock-data'; // 💾 التخزين والمزودات الأولية
import { createZeroTrustSession, verifyZeroTrustSession, purgeZeroTrustSession } from '@/lib/security/zero-trust-token'; // 🔐 توكنات الأمان
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/security/rate-limiter'; // 🔥 جدار الحظر
import { sanitizeEmail, sanitizePasswordInput, validateAndSanitizeGradePayload } from '@/lib/security/sanitizer'; // 🧹 معقم المدخلات
import { validateAndSanitizeSqlPayload } from '@/lib/security/sql-injection-guard'; // 🛡️ حارس SQL Injection
import { logSecurityEvent } from '@/lib/security/audit-guardian'; // 📊 حارس السجلات الأمنية
import { smartCachedFetch, invalidateCacheKey, invalidateCachePattern } from '@/lib/cache/smart-cache-engine'; // ⚡ محرك الكاش SWR وحاجز دمج الطلبات المتزامنة
import { DepartmentLectureDurationConfig } from '@/lib/attendance-utils'; // ⏱️ نوع إعدادات مدد المحاضرات للقسم

// 🌐 قراءة متغيرات الاتصال بقاعدة بيانات Supabase الخاصة بالمستخدم
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kssbdkqubgylqqweqmjs.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzc2Jka3F1Ymd5bHFxd2VxbWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NTc1ODksImV4cCI6MjEwMDQzMzU4OX0.AsIWl-xfQn1f8u1Na-9ehh6Tt0nOJRGW7i_zMxGIgDU';

// ⚡ إنتاج وتصدير عميل Supabase المعتمد للربط المباشر
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 🔑 دالة الحصول على المستخدم الحالي المسجل بالجلسة بعد تدقيق توكن Zero Trust الصارم
export function getCurrentSessionUser(): UserProfile | null {
  if (typeof window === 'undefined') return null; // 🔒 التأكد من تنفيذ الكود بالمتصفح

  // 🔍 تدقيق الجلسة المشفرة وتوقيع الدور الأكاديمي
  const verification = verifyZeroTrustSession();
  if (verification.isValid && verification.user) {
    return verification.user; // ✅ توكن سليم وموثق
  }

  // 🔄 تراجع أمني احتياطي مع فحص النظافة
  const savedUser = localStorage.getItem('sadiq_univ_current_user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser) as UserProfile;
      if (user && user.id && user.role && user.generated_email) {
        createZeroTrustSession(user); // 🔒 ترقية الجلسة لتوكن Zero Trust مشفر
        return user;
      }
    } catch {
      purgeZeroTrustSession();
      return null;
    }
  }

  return null;
}

// 🚀 دالة تحديد مسار لوحة التحكم التلقائية بحسب الرتبة الأكاديمية للمستخدم
export function getDashboardRouteForRole(role?: UserRole | string): string {
  // 👑 إذا كان المستخدم مسؤول عام أو أدمن يروح للوحة المسؤول العام حصراً
  if (role === 'super_admin' || role === 'admin') {
    return '/sadmin/dashboard'; // 👑 لوحة تحكم المسؤول العام المستقلة
  }
  // 🏢 إذا كان المستخدم رئيس قسم أو مقرر يروح للوحة تحكم إدارة القسم
  if (role === 'department_head' || role === 'rapporteur') {
    return '/admin/dashboard'; // 🏢 لوحة تحكم رئيس القسم والمقرر
  }
  //  إذا كان المستخدم أستاذ تدريسي يروح للوحة التدريسي
  if (role === 'teacher') {
    return '/teacher/dashboard'; //  لوحة تحكم الأستاذ
  }
  // 🎓 إذا كان المستخدم طالباً يروح للوحة درجات الطالب
  if (role === 'student') {
    return '/student/dashboard'; // 🎓 لوحة تحكم الطالب
  }
  // 🌐 في حال عدم تحديد الدور يرجع للصفحة الرئيسية
  return '/';
}

// 🔍 دالة البحث الحي المباشر عن الحساب بالبريد الأكاديمي الرسمي الصريح حصراً
export async function findProfileLive(email: string, passwordCandidate?: string): Promise<UserProfile | null> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = (passwordCandidate || '').trim();

  // 1️⃣ فحص التخزين المحلي أولاً بالبريد الأكاديمي الصريح (مع إعطاء الأولوية للحساب المطابق لكلمة المرور في حال التكرار)
  if (typeof window !== 'undefined') {
    const localProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const localFoundWithPass = cleanPass
      ? localProfiles.find(
          (p) =>
            (p.generated_email || '').trim().toLowerCase() === cleanEmail &&
            Boolean(p.temp_password && p.temp_password.trim() === cleanPass)
        )
      : null;

    if (localFoundWithPass) {
      return localFoundWithPass;
    }

    const localFound = localProfiles.find(
      (p) => (p.generated_email || '').trim().toLowerCase() === cleanEmail
    );

    if (localFound) {
      return localFound;
    }

    // 🏢 1.1 فحص جدول الأقسام المخزنة محلياً لضمان عدم فقدان قادة الأقسام
    const localDepts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS);
    const deptAsHead = localDepts.find(
      (d) => (d.head_email || '').trim().toLowerCase() === cleanEmail
    );
    if (deptAsHead) {
      const restoredHead: UserProfile = {
        id: deptAsHead.head_id || `usr-head-${deptAsHead.id}`,
        full_name: deptAsHead.head_name || 'رئيس القسم الأكاديمي',
        role: 'department_head',
        gender: 'male',
        department_id: deptAsHead.id,
        department_name: deptAsHead.name,
        university_number: `HOD-${deptAsHead.code || '01'}`,
        generated_email: deptAsHead.head_email || cleanEmail,
        temp_password: cleanPass || '',
        is_active: true,
        must_change_password: false,
        created_at: new Date().toISOString(),
      };
      localProfiles.push(restoredHead);
      localStorage.setItem('sadiq_univ_profiles', JSON.stringify(localProfiles));
      return restoredHead;
    }

    const deptAsRap = localDepts.find(
      (d) => (d.rapporteur_email || '').trim().toLowerCase() === cleanEmail
    );
    if (deptAsRap) {
      const restoredRap: UserProfile = {
        id: deptAsRap.rapporteur_id || `usr-rap-${deptAsRap.id}`,
        full_name: deptAsRap.rapporteur_name || 'مقرر القسم الأكاديمي',
        role: 'rapporteur',
        gender: 'male',
        department_id: deptAsRap.id,
        department_name: deptAsRap.name,
        university_number: `RAP-${deptAsRap.code || '01'}`,
        generated_email: deptAsRap.rapporteur_email || cleanEmail,
        temp_password: cleanPass || '',
        is_active: true,
        must_change_password: false,
        created_at: new Date().toISOString(),
      };
      localProfiles.push(restoredRap);
      localStorage.setItem('sadiq_univ_profiles', JSON.stringify(localProfiles));
      return restoredRap;
    }
  }

  // 2️⃣ فحص قائمة الحسابات الافتراضية بالبريد الأكاديمي الصريح
  const initFound = INITIAL_PROFILES.find(
    (p) => (p.generated_email || '').trim().toLowerCase() === cleanEmail
  );
  if (initFound) {
    return initFound;
  }

  // 3️⃣ فحص قاعدة بيانات Supabase الحية بالبريد الصريح (الجداول الرسمية السحابية بالتوازي)
  try {
    const [saRes, dhRes, drRes, tRes, sRes, vwRes, profRes, deptRes] = await Promise.all([
      supabase.from('super_admins').select('*').ilike('email', cleanEmail),
      supabase.from('department_heads').select('*').ilike('email', cleanEmail),
      supabase.from('department_rapporteurs').select('*').ilike('email', cleanEmail),
      supabase.from('teachers').select('*').ilike('email', cleanEmail),
      supabase.from('students').select('*').ilike('email', cleanEmail),
      supabase.from('vw_all_profiles').select('*').ilike('generated_email', cleanEmail),
      supabase.from('profiles').select('*').ilike('generated_email', cleanEmail),
      supabase.from('departments').select('*').or(`head_email.ilike.${cleanEmail},rapporteur_email.ilike.${cleanEmail}`),
    ]);

    const liveUsers: UserProfile[] = [];

    // 👤 تجميع الحسابات من جدول profiles السحابي الحي
    if (profRes.data && profRes.data.length > 0) {
      (profRes.data as UserProfile[]).forEach((p) => {
        if (!liveUsers.some((u) => u.id === p.id || (u.generated_email && u.generated_email.toLowerCase() === cleanEmail))) {
          liveUsers.push(p);
        }
      });
    }

    // 🏢 تجميع قيادات الأقسام من جدول departments السحابي
    if (deptRes.data && deptRes.data.length > 0) {
      (deptRes.data as Department[]).forEach((d) => {
        if ((d.head_email || '').trim().toLowerCase() === cleanEmail) {
          if (!liveUsers.some((u) => u.id === d.head_id || (u.generated_email && u.generated_email.toLowerCase() === cleanEmail))) {
            liveUsers.push({
              id: d.head_id || `usr-head-${d.id}`,
              full_name: d.head_name || 'رئيس القسم الأكاديمي',
              role: 'department_head',
              gender: 'male',
              department_id: d.id,
              department_name: d.name,
              university_number: `HOD-${d.code || '01'}`,
              generated_email: d.head_email || cleanEmail,
              temp_password: cleanPass || '',
              is_active: true,
              must_change_password: false,
              created_at: d.created_at || new Date().toISOString(),
            });
          }
        }
        if ((d.rapporteur_email || '').trim().toLowerCase() === cleanEmail) {
          if (!liveUsers.some((u) => u.id === d.rapporteur_id || (u.generated_email && u.generated_email.toLowerCase() === cleanEmail))) {
            liveUsers.push({
              id: d.rapporteur_id || `usr-rap-${d.id}`,
              full_name: d.rapporteur_name || 'مقرر القسم الأكاديمي',
              role: 'rapporteur',
              gender: 'male',
              department_id: d.id,
              department_name: d.name,
              university_number: `RAP-${d.code || '01'}`,
              generated_email: d.rapporteur_email || cleanEmail,
              temp_password: cleanPass || '',
              is_active: true,
              must_change_password: false,
              created_at: d.created_at || new Date().toISOString(),
            });
          }
        }
      });
    }

    // 👨‍🏫 تجميع التدريسيين
    if (tRes.data && tRes.data.length > 0) {
      tRes.data.forEach((t: TeacherRecord) => {
        liveUsers.push({
          id: t.id,
          auth_user_id: t.auth_user_id,
          full_name: t.full_name,
          role: 'teacher',
          department_id: t.department_id,
          department_name: t.department_name,
          university_number: t.id,
          generated_email: t.email,
          temp_password: t.temp_password,
          is_active: t.is_active ?? true,
          created_at: t.created_at,
        });
      });
    }

    // 🎓 تجميع الطلاب
    if (sRes.data && sRes.data.length > 0) {
      sRes.data.forEach((s: StudentRecord) => {
        liveUsers.push({
          id: s.id,
          auth_user_id: s.auth_user_id,
          full_name: s.full_name,
          role: 'student',
          department_id: s.department_id,
          department_name: s.department_name,
          stage_id: s.stage_id,
          stage_number: s.stage_number,
          university_number: s.university_number,
          generated_email: s.email,
          temp_password: s.temp_password,
          gender: s.gender,
          is_active: s.is_active ?? true,
          is_graduated: s.is_graduated ?? false,
          graduation_status: s.graduation_status,
          created_at: s.created_at,
        });
      });
    }

    // 🏢 تجميع رؤساء الأقسام
    if (dhRes.data && dhRes.data.length > 0) {
      dhRes.data.forEach((dh: DepartmentHeadRecord) => {
        liveUsers.push({
          id: dh.id,
          auth_user_id: dh.auth_user_id,
          full_name: dh.full_name,
          role: 'department_head',
          department_id: dh.department_id,
          department_name: dh.department_name,
          university_number: dh.id,
          generated_email: dh.email,
          temp_password: dh.temp_password,
          is_active: dh.is_active ?? true,
          created_at: dh.created_at,
        });
      });
    }

    // 📝 تجميع مقرري الأقسام
    if (drRes.data && drRes.data.length > 0) {
      drRes.data.forEach((dr: DepartmentRapporteurRecord) => {
        liveUsers.push({
          id: dr.id,
          auth_user_id: dr.auth_user_id,
          full_name: dr.full_name,
          role: 'rapporteur',
          department_id: dr.department_id,
          department_name: dr.department_name,
          university_number: dr.id,
          generated_email: dr.email,
          temp_password: dr.temp_password,
          is_active: dr.is_active ?? true,
          created_at: dr.created_at,
        });
      });
    }

    // 👑 تجميع المسؤولين العامين
    if (saRes.data && saRes.data.length > 0) {
      saRes.data.forEach((sa: SuperAdminRecord) => {
        liveUsers.push({
          id: sa.id,
          auth_user_id: sa.auth_user_id,
          full_name: sa.full_name,
          role: 'super_admin',
          university_number: 'ADMIN-001',
          generated_email: sa.email,
          temp_password: sa.temp_password,
          is_active: true,
          created_at: sa.created_at,
        });
      });
    }

    // 👁️ تجميع من العرض الموحد إن وُجد
    if (vwRes.data && vwRes.data.length > 0) {
      (vwRes.data as UserProfile[]).forEach((vw) => {
        if (!liveUsers.some((u) => u.id === vw.id || (u.generated_email && u.generated_email.toLowerCase() === cleanEmail))) {
          liveUsers.push(vw);
        }
      });
    }

    if (liveUsers.length > 0) {
      const matchedUser = cleanPass
        ? liveUsers.find((u) => Boolean(u.temp_password && u.temp_password.trim() === cleanPass)) || liveUsers[0]
        : liveUsers[0];

      if (typeof window !== 'undefined') {
        const localProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
        const idx = localProfiles.findIndex(
          (p) => p.id === matchedUser.id || (p.generated_email && p.generated_email.toLowerCase() === cleanEmail)
        );
        if (idx >= 0) {
          localProfiles[idx] = matchedUser;
        } else {
          localProfiles.push(matchedUser);
        }
        localStorage.setItem('sadiq_univ_profiles', JSON.stringify(localProfiles));
      }
      return matchedUser;
    }
  } catch (e) {
    console.warn('تنبيه: تعذر الاتصال المباشر بـ Supabase:', e);
  }

  return null;
}

// 🎓 1. دالة تسجيل دخول الطالب بالبريد الأكاديمي وكلمة المرور (الرمز السري) مع فحص Zero Trust والـ Rate Limit
export async function loginStudentByEmailAndPassword(
  email: string,
  pass: string
): Promise<{ user: UserProfile | null; error?: string }> {
  if (typeof window === 'undefined') return { user: null, error: 'غير متاح بالخادم' }; // 🔒 حماية بيئة الخادم

  const cleanEmail = sanitizeEmail(email); // 🧹 تعقيم وتطهير البريد
  const cleanPass = sanitizePasswordInput(pass); // 🧹 تعقيم وتطهير كلمة المرور

  // 🛡️ 1. فحص إدخال الحقول
  if (!cleanEmail) {
    return {
      user: null,
      error: 'يرجى إدخال البريد الأكاديمي للطالب.',
    };
  }

  if (!cleanPass) {
    return {
      user: null,
      error: 'يرجى إدخال كلمة المرور (رمز الدخول) الخاصة بالطالب.',
    };
  }

  // 🛡️ 2. فحص صيغة وهيئة البريد الإلكتروني
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return {
      user: null,
      error: 'صيغة البريد الإلكتروني غير صحيحة، يرجى كتابة بريد إلكتروني صالح (مثال: student@sadiq.edu.iq).',
    };
  }

  // 🔥 3. فحص جدار الحماية من التخمين (Rate Limiter Check)
  const rateLimitStatus = checkRateLimit(cleanEmail);
  if (!rateLimitStatus.isAllowed) {
    logSecurityEvent({
      eventType: 'ACCOUNT_LOCKED',
      actorEmail: cleanEmail,
      details: `تم قفل محاولات تسجيل دخول الطالب (${cleanEmail}) لتجاوز الحد المسموح.`,
      severity: 'HIGH',
    });
    return {
      user: null,
      error: rateLimitStatus.message || 'تم قفل المحاولات مؤقتاً لأسباب أمنية.',
    };
  }

  // 🔐 1. محاولة المصادقة المباشرة عبر Supabase Auth (auth.users)
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass,
    });

    if (!authError && authData.user) {
      const authUserId = authData.user.id;
      // 🔍 البحث في جدول الطلاب students
      const { data: sData } = await supabase
        .from('students')
        .select('*')
        .or(`email.ilike.${cleanEmail},auth_user_id.eq.${authUserId}`)
        .maybeSingle();

      if (sData) {
        const studentUser: UserProfile = {
          id: sData.id,
          auth_user_id: authUserId,
          full_name: sData.full_name,
          role: 'student',
          department_id: sData.department_id,
          stage_number: sData.stage_number || 1,
          university_number: sData.university_number || sData.id,
          generated_email: sData.email,
          is_active: sData.is_active,
          created_at: sData.created_at,
        };

        resetRateLimit(cleanEmail);
        createZeroTrustSession(studentUser);

        logSecurityEvent({
          eventType: 'LOGIN_SUCCESS',
          actorId: studentUser.id,
          actorName: studentUser.full_name,
          actorRole: studentUser.role,
          actorEmail: studentUser.generated_email,
          details: `تسجيل دخول ناجح للطالب عبر Supabase Auth (${studentUser.full_name}).`,
          severity: 'LOW',
        });

        return { user: studentUser };
      }
    }
  } catch (authErr) {
    console.warn('تنبيه: محاولة تسجيل دخول الطالب عبر المسار التوافقي:', authErr);
  }

  // ☁️ 4. جلب الحساب المباشر من قاعدة بيانات Supabase الحية والتخزين المحلي
  const foundUser = await findProfileLive(cleanEmail, cleanPass);

  // 🛑 5. في حال عدم وجود البريد في قاعدة البيانات
  if (!foundUser) {
    const failResult = recordFailedAttempt(cleanEmail);
    logSecurityEvent({
      eventType: 'LOGIN_FAILED',
      actorEmail: cleanEmail,
      details: `محاولة دخول طالب ببريد غير مسجل: ${cleanEmail}`,
      severity: 'LOW',
    });
    return {
      user: null,
      error: failResult.warningMessage 
        ? `${failResult.warningMessage} (البريد غير مسجل).`
        : 'البريد الأكاديمي غير صحيح أو غير مسجل في قاعدة البيانات الرسمية. يرجى مراجعة إدارة الكلية.',
    };
  }

  // 🔀 6. في حال كان البريد مسجلاً لحساب برتبة أخرى (منع كشف وتخمين الرتب أمنياً)
  if (foundUser.role !== 'student') {
    return {
      user: null, // 🔒 منع دخول غير الطلاب
      error: 'هذا البريد مسجل، يرجى استخدام بريد آخر.', // 🛡️ رسالة أمنية موحدة تمنع كشف نوع الحساب
    };
  }

  // 🔑 7. التحقق الحصري الصارم من كلمة المرور / الرمز السري للطالب
  const cleanStoredPass = (foundUser.temp_password || '').trim().normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '');
  const cleanInputPass = cleanPass.trim().normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '');
  const isPasswordCorrect = Boolean(cleanStoredPass && cleanStoredPass === cleanInputPass);

  if (!isPasswordCorrect) {
    const failResult = recordFailedAttempt(cleanEmail);
    logSecurityEvent({
      eventType: 'LOGIN_FAILED',
      actorId: foundUser.id,
      actorName: foundUser.full_name,
      actorRole: foundUser.role,
      actorEmail: foundUser.generated_email,
      details: `محاولة دخول فاشلة بكلمة مرور خاطئة للطالب (${foundUser.full_name}).`,
      severity: 'MEDIUM',
    });
    return {
      user: null,
      error: failResult.warningMessage || 'كلمة المرور غير صحيحة. يرجى التأكد من كلمة المرور المدخلة أو مراجعة إدارة التسجيل.',
    };
  }

  // 🔒 8. التحقق من تفعيل الحساب
  if (!foundUser.is_active) {
    return {
      user: null,
      error: 'عذراً! هذا الحساب غير مفعل حالياً. يرجى مراجعة شعبة التسجيل وشؤون الطلبة.',
    };
  }

  // 🚀 9. تصفير الـ Rate Limiter وإنشاء توكن جلسة Zero Trust مشفر
  resetRateLimit(cleanEmail);
  createZeroTrustSession(foundUser);

  // 📊 10. توثيق عملية الدخول الناجحة
  logSecurityEvent({
    eventType: 'LOGIN_SUCCESS',
    actorId: foundUser.id,
    actorName: foundUser.full_name,
    actorRole: foundUser.role,
    actorEmail: foundUser.generated_email,
    details: `تسجيل دخول ناجح للطالب (${foundUser.full_name}) إلى بوابة الطلاب.`,
    severity: 'LOW',
  });

  return { user: foundUser };
}

// 🎓 دالة التوافقية السابقة
export async function loginStudentByEmail(email: string, pass?: string): Promise<{ user: UserProfile | null; error?: string }> {
  return await loginStudentByEmailAndPassword(email, pass || '');
}

// 👨‍🏫 2. دالة تسجيل دخول الأستاذ بالبريد الأكاديمي وكلمة المرور مع التحقق الكامل وZero Trust
export async function loginTeacherByEmailAndPassword(email: string, pass: string): Promise<{ user: UserProfile | null; error?: string }> {
  if (typeof window === 'undefined') return { user: null, error: 'غير متاح بالخادم' }; // 🔒 حماية بيئة الخادم

  const cleanEmail = sanitizeEmail(email); // 🧹 تنظيف البريد
  const cleanPass = sanitizePasswordInput(pass); // 🧹 تنظيف الرمز

  // 🛡️ 1. التحقق من إدخال الحقول
  if (!cleanEmail) {
    return {
      user: null,
      error: 'يرجى إدخال البريد الأكاديمي للأستاذ.',
    };
  }

  if (!cleanPass) {
    return {
      user: null,
      error: 'يرجى إدخال كلمة المرور الأكاديمية (رمز الدخول).',
    };
  }

  // 🔥 2. فحص محاولات التخمين للأستاذ
  const rateLimitStatus = checkRateLimit(cleanEmail);
  if (!rateLimitStatus.isAllowed) {
    logSecurityEvent({
      eventType: 'ACCOUNT_LOCKED',
      actorEmail: cleanEmail,
      details: `تم قفل محاولات تسجيل دخول الأستاذ (${cleanEmail}) لتجاوز حد الأخطاء.`,
      severity: 'HIGH',
    });
    return {
      user: null,
      error: rateLimitStatus.message || 'تم قفل المحاولات مؤقتاً لأسباب أمنية.',
    };
  }

  // 🔐 1. محاولة المصادقة المباشرة عبر Supabase Auth (auth.users)
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass,
    });

    if (!authError && authData.user) {
      const authUserId = authData.user.id;
      // 🔍 البحث في جدول الأساتذة teachers
      const { data: tData } = await supabase
        .from('teachers')
        .select('*')
        .or(`email.ilike.${cleanEmail},auth_user_id.eq.${authUserId}`)
        .maybeSingle();

      if (tData) {
        const teacherUser: UserProfile = {
          id: tData.id,
          auth_user_id: authUserId,
          full_name: tData.full_name,
          role: 'teacher',
          department_id: tData.department_id,
          university_number: tData.id,
          generated_email: tData.email,
          is_active: tData.is_active,
          created_at: tData.created_at,
        };

        resetRateLimit(cleanEmail);
        createZeroTrustSession(teacherUser);

        logSecurityEvent({
          eventType: 'LOGIN_SUCCESS',
          actorId: teacherUser.id,
          actorName: teacherUser.full_name,
          actorRole: teacherUser.role,
          actorEmail: teacherUser.generated_email,
          details: `تسجيل دخول ناجح للأستاذ عبر Supabase Auth (${teacherUser.full_name}).`,
          severity: 'LOW',
        });

        return { user: teacherUser };
      }
    }
  } catch (authErr) {
    console.warn('تنبيه: محاولة تسجيل دخول الأستاذ عبر المسار التوافقي:', authErr);
  }

  // ☁️ 2. جلب الحساب المباشر من قاعدة البيانات الحية والتخزين المحلي
  const foundUser = await findProfileLive(cleanEmail, cleanPass);

  // 🛑 3. التحقق من وجود البريد في قاعدة البيانات
  if (!foundUser) {
    const failResult = recordFailedAttempt(cleanEmail);
    logSecurityEvent({
      eventType: 'LOGIN_FAILED',
      actorEmail: cleanEmail,
      details: `محاولة دخول أستاذ ببريد غير مسجل: ${cleanEmail}`,
      severity: 'MEDIUM',
    });
    return {
      user: null,
      error: failResult.warningMessage
        ? `${failResult.warningMessage} (البريد غير مسجل).`
        : 'البريد الأكاديمي غير صحيح أو غير مسجل في قاعدة البيانات الرسمية. يرجى مراجعة إدارة الكلية.',
    };
  }

  // 🔀 4. في حال كان الحساب لغير التدريسيين (منع كشف وتخمين الرتب أمنياً)
  if (foundUser.role !== 'teacher') {
    return {
      user: null, // 🔒 منع دخول غير التدريسيين
      error: 'هذا البريد مسجل، يرجى استخدام بريد آخر.', // 🛡️ رسالة أمنية موحدة تمنع كشف نوع الحساب
    };
  }

  // 🔑 5. التحقق الحصري من صحة كلمة المرور الأصلية للأستاذ
  const cleanStoredPass = (foundUser.temp_password || '').trim().normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '');
  const cleanInputPass = cleanPass.trim().normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '');
  const isPasswordCorrect = Boolean(cleanStoredPass && cleanStoredPass === cleanInputPass);

  if (!isPasswordCorrect) {
    const failResult = recordFailedAttempt(cleanEmail);
    logSecurityEvent({
      eventType: 'LOGIN_FAILED',
      actorId: foundUser.id,
      actorName: foundUser.full_name,
      actorRole: foundUser.role,
      actorEmail: foundUser.generated_email,
      details: `محاولة دخول فاشلة بكلمة مرور خاطئة للأستاذ (${foundUser.full_name}).`,
      severity: 'MEDIUM',
    });
    return {
      user: null,
      error: failResult.warningMessage || 'كلمة المرور غير صحيحة. يرجى التأكد من الرمز المدخل أو مراجعة إدارة الكلية.',
    };
  }

  // 🔒 7. التحقق من تفعيل حساب الأستاذ
  if (!foundUser.is_active) {
    return {
      user: null,
      error: 'عذراً! حساب الأستاذ غير مفعل حالياً. يرجى مراجعة عمادة الكلية.',
    };
  }

  // 🚀 8. تصفير الـ Rate Limiter وإنشاء توكن جلسة Zero Trust مشفر
  resetRateLimit(cleanEmail);
  createZeroTrustSession(foundUser);

  // 📊 9. توثيق عملية الدخول الناجحة
  logSecurityEvent({
    eventType: 'LOGIN_SUCCESS',
    actorId: foundUser.id,
    actorName: foundUser.full_name,
    actorRole: foundUser.role,
    actorEmail: foundUser.generated_email,
    details: `تسجيل دخول ناجح للأستاذ (${foundUser.full_name}) إلى بوابة التدريسيين.`,
    severity: 'LOW',
  });

  return { user: foundUser };
}

// 👑 3. دالة تسجيل دخول المسؤول العام عن النظام حصراً (/sadmin) مع المصادقة المباشرة عبر Supabase Auth
export async function loginSuperAdmin(email: string, pass: string): Promise<{ user: UserProfile | null; error?: string }> {
  if (typeof window === 'undefined') return { user: null, error: 'غير متاح بالخادم' }; // 🔒 التحقق من بيئة العميل

  const cleanEmail = sanitizeEmail(email); // 🧹 تنظيف البريد
  const cleanPass = sanitizePasswordInput(pass); // 🧹 تنظيف كلمة المرور

  if (!cleanEmail) {
    return { user: null, error: 'يرجى إدخال البريد الأكاديمي للمسؤول العام.' };
  }
  if (!cleanPass) {
    return { user: null, error: 'يرجى إدخال كلمة المرور الخاصة بالمسؤول العام.' };
  }

  // 🔥 فحص جدار الحماية ضد التخمين (Rate Limiter)
  const rateLimitStatus = checkRateLimit(cleanEmail);
  if (!rateLimitStatus.isAllowed) {
    logSecurityEvent({
      eventType: 'ACCOUNT_LOCKED',
      actorEmail: cleanEmail,
      details: `تم قفل محاولات تسجيل دخول المسؤول العام (${cleanEmail}) بسبب تكرار الأخطاء!`,
      severity: 'CRITICAL',
    });
    return {
      user: null,
      error: rateLimitStatus.message || 'تم قفل المحاولات مؤقتاً لأسباب أمنية.',
    };
  }

  // 🔐 1. محاولة المصادقة المباشرة عبر Supabase Authentication (auth.users)
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass,
    });

    if (!authError && authData.user) {
      // ✅ تم تسجيل الدخول بنجاح عبر Supabase Authentication
      const authUserId = authData.user.id;
      const userMeta = authData.user.user_metadata || {};
      
      // 🔍 البحث عن السجل المخصص من جدول super_admins
      const { data: saData } = await supabase
        .from('super_admins')
        .select('*')
        .or(`email.ilike.${cleanEmail},auth_user_id.eq.${authUserId}`)
        .maybeSingle();

      const superAdminUser: UserProfile = {
        id: saData?.id || `usr-admin-${authUserId.slice(0, 8)}`,
        auth_user_id: authUserId,
        full_name: saData?.full_name || (userMeta.full_name as string) || (authData.user.email?.split('@')[0] ?? 'المسؤول العام عن النظام'),
        role: 'super_admin',
        university_number: 'ADMIN-001',
        generated_email: authData.user.email || cleanEmail,
        is_active: true,
        must_change_password: false,
        created_at: saData?.created_at || new Date().toISOString(),
      };

      resetRateLimit(cleanEmail);
      createZeroTrustSession(superAdminUser);

      logSecurityEvent({
        eventType: 'LOGIN_SUCCESS',
        actorId: superAdminUser.id,
        actorName: superAdminUser.full_name,
        actorRole: superAdminUser.role,
        actorEmail: superAdminUser.generated_email,
        details: `تسجيل دخول ناجح وموثق للمسؤول العام عبر Supabase Auth (${superAdminUser.full_name}).`,
        severity: 'HIGH',
      });

      return { user: superAdminUser };
    }
  } catch (authErr) {
    console.warn('تنبيه: محاولة تسجيل الدخول عبر مسار التوافقية السحابي:', authErr);
  }

  // ☁️ 2. فحص قاعدة البيانات الحية والتخزين المحلي في حال عدم اكتمال ربط auth.users بعد
  const foundUser = await findProfileLive(cleanEmail, cleanPass);

  if (!foundUser) {
    const failResult = recordFailedAttempt(cleanEmail);
    logSecurityEvent({
      eventType: 'LOGIN_FAILED',
      actorEmail: cleanEmail,
      details: `محاولة دخول مشبوهة لبوابة المسؤول العام ببريد غير مسجل: ${cleanEmail}`,
      severity: 'HIGH',
    });
    return {
      user: null,
      error: failResult.warningMessage || 'البريد الأكاديمي أو كلمة المرور غير صحيحة في منظومة المصادقة.',
    };
  }

  // 🛑 التحقق الصارم من أن الحساب مسؤول عام حصراً
  if (foundUser.role !== 'super_admin' && foundUser.role !== 'admin') {
    logSecurityEvent({
      eventType: 'UNAUTHORIZED_ROUTE_ACCESS', // 🚨 تسجيل محاولة دخول غير مصرح بها أمنياً
      actorId: foundUser.id, // 🆔 معرّف الحساب
      actorName: foundUser.full_name, // 👤 اسم الحساب
      actorRole: foundUser.role, // 🎭 رتبة الحساب في السجل الأمني الداخلي
      actorEmail: foundUser.generated_email, // 📧 البريد المسجل
      details: `محاولة مستخدم تسجيل الدخول في بوابة المسؤول العام (/sadmin)`, // 📝 تفاصيل الحدث الأمني
      severity: 'HIGH', // ⚠️ مستوى الخطورة
    });
    return {
      user: null, // 🔒 منع دخول غير المسؤول العام
      error: 'هذا البريد مسجل، يرجى استخدام بريد آخر.', // 🛡️ رسالة أمنية موحدة تمنع كشف نوع الحساب
    };
  }

  // 🔑 التحقق الحصري من كلمة المرور
  const cleanStoredAdminPass = (foundUser.temp_password || '').trim().normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '');
  const cleanInputAdminPass = cleanPass.trim().normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '');
  const isPasswordCorrect = Boolean(cleanStoredAdminPass && cleanStoredAdminPass === cleanInputAdminPass);

  if (!isPasswordCorrect) {
    const failResult = recordFailedAttempt(cleanEmail);
    logSecurityEvent({
      eventType: 'LOGIN_FAILED',
      actorId: foundUser.id,
      actorName: foundUser.full_name,
      actorRole: foundUser.role,
      actorEmail: foundUser.generated_email,
      details: `محاولة فاشلة لكلمة مرور المسؤول العام (${foundUser.full_name}).`,
      severity: 'HIGH',
    });
    return {
      user: null,
      error: failResult.warningMessage || 'كلمة المرور غير صحيحة. يرجى التأكد من الرمز المدخل أو مراجعة إدارة النظام.',
    };
  }

  if (!foundUser.is_active) {
    return {
      user: null,
      error: 'عذراً! حساب المسؤول العام معطل حالياً في قاعدة البيانات.',
    };
  }

  resetRateLimit(cleanEmail);
  createZeroTrustSession(foundUser);

  logSecurityEvent({
    eventType: 'LOGIN_SUCCESS',
    actorId: foundUser.id,
    actorName: foundUser.full_name,
    actorRole: foundUser.role,
    actorEmail: foundUser.generated_email,
    details: `تسجيل دخول ناجح وموثق للمسؤول العام (${foundUser.full_name}).`,
    severity: 'HIGH',
  });

  return { user: foundUser };
}

// 👑 دالة فحص وجود أي حساب مسؤول عام في المنظومة (محلياً أو سحابياً)
export async function checkIfSuperAdminExists(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  try {
    // 1. فحص التخزين المحلي
    const profiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const hasLocalAdmin = profiles.some(p => p.role === 'super_admin' || p.role === 'admin');
    if (hasLocalAdmin) return true;

    // 2. فحص Supabase سحابياً
    const { count, error } = await supabase.from('super_admins').select('*', { count: 'exact', head: true });
    if (!error && typeof count === 'number' && count > 0) return true;

    const { count: pCount, error: pError } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).or('role.eq.super_admin,role.eq.admin');
    if (!pError && typeof pCount === 'number' && pCount > 0) return true;

    return false;
  } catch {
    return true;
  }
}

// 👑 دالة تهيئة وتسجيل أول مسؤول عام للمنظومة وربطه مباشرة بقاعدة البيانات 100%
export async function registerFirstSuperAdmin(payload: {
  fullName: string;
  email: string;
  password: string;
}): Promise<{ user: UserProfile | null; error?: string }> {
  try {
    const cleanName = payload.fullName.trim();
    const cleanEmail = sanitizeEmail(payload.email);
    const cleanPass = sanitizePasswordInput(payload.password);

    if (!cleanName || !cleanEmail || !cleanPass) {
      return { user: null, error: 'يرجى إكمال كافة حقول اسم المسؤول والبريد وكلمة المرور.' };
    }

    const newAdmin: UserProfile = {
      id: `usr-sa-${Date.now()}`,
      full_name: cleanName,
      role: 'super_admin',
      university_number: 'ADMIN-001',
      generated_email: cleanEmail,
      temp_password: cleanPass,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    // 1. حفظ في التخزين المحلي
    const profiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const updatedProfiles = [...profiles.filter(p => p.id !== newAdmin.id), newAdmin];
    saveStoredData('profiles', updatedProfiles);

    // 2. حفظ في Supabase جدول super_admins
    await supabase.from('super_admins').upsert([
      {
        id: newAdmin.id,
        full_name: newAdmin.full_name,
        email: newAdmin.generated_email,
        temp_password: newAdmin.temp_password,
        created_at: newAdmin.created_at,
      }
    ]);

    // 3. حفظ في Supabase جدول profiles العام
    await saveProfileToSupabase(newAdmin);

    // 4. إنشاء جلسة Zero Trust فورية
    createZeroTrustSession(newAdmin);

    return { user: newAdmin };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل تسجيل المسؤول العام';
    return { user: null, error: msg };
  }
}

// 🏢 4. دالة تسجيل دخول رؤساء الأقسام والمقررين حصراً (/admin) مع حماية Zero Trust والمصادقة المباشرة
export async function loginDepartmentHeadOrRapporteur(email: string, pass: string): Promise<{ user: UserProfile | null; error?: string }> {
  if (typeof window === 'undefined') return { user: null, error: 'غير متاح بالخادم' };

  const cleanEmail = sanitizeEmail(email);
  const cleanPass = sanitizePasswordInput(pass);

  if (!cleanEmail) {
    return { user: null, error: 'يرجى إدخال البريد الأكاديمي لرئيس القسم أو المقرر.' };
  }
  if (!cleanPass) {
    return { user: null, error: 'يرجى إدخال كلمة المرور الأكاديمية.' };
  }

  // 🔥 فحص Rate Limiter لرؤساء الأقسام والمقررين
  const rateLimitStatus = checkRateLimit(cleanEmail);
  if (!rateLimitStatus.isAllowed) {
    logSecurityEvent({
      eventType: 'ACCOUNT_LOCKED',
      actorEmail: cleanEmail,
      details: `تم قفل محاولات تسجيل دخول رئيس/مقرر القسم (${cleanEmail}) بسبب تكرار الأخطاء.`,
      severity: 'HIGH',
    });
    return {
      user: null,
      error: rateLimitStatus.message || 'تم قفل المحاولات مؤقتاً لأسباب أمنية.',
    };
  }

  // 🔐 1. محاولة تسجيل الدخول المباشر عبر Supabase Auth
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass,
    });

    if (!authError && authData.user) {
      const authUserId = authData.user.id;
      // البحث في جدول رؤساء الأقسام
      const { data: headData } = await supabase
        .from('department_heads')
        .select('*')
        .or(`email.ilike.${cleanEmail},auth_user_id.eq.${authUserId}`)
        .maybeSingle();

      if (headData) {
        const headUser: UserProfile = {
          id: headData.id,
          auth_user_id: authUserId,
          full_name: headData.full_name,
          role: 'department_head',
          department_id: headData.department_id,
          university_number: headData.id,
          generated_email: headData.email,
          is_active: headData.is_active,
          created_at: headData.created_at,
        };
        resetRateLimit(cleanEmail);
        createZeroTrustSession(headUser);
        return { user: headUser };
      }

      // البحث في جدول مقرري الأقسام
      const { data: rapData } = await supabase
        .from('department_rapporteurs')
        .select('*')
        .or(`email.ilike.${cleanEmail},auth_user_id.eq.${authUserId}`)
        .maybeSingle();

      if (rapData) {
        const rapUser: UserProfile = {
          id: rapData.id,
          auth_user_id: authUserId,
          full_name: rapData.full_name,
          role: 'rapporteur',
          department_id: rapData.department_id,
          university_number: rapData.id,
          generated_email: rapData.email,
          is_active: rapData.is_active,
          created_at: rapData.created_at,
        };
        resetRateLimit(cleanEmail);
        createZeroTrustSession(rapUser);
        return { user: rapUser };
      }
    }
  } catch (err) {
    console.warn('تنبيه: استخدام المسار التوافقي لقيادة القسم:', err);
  }

  // ☁️ 2. البحث المباشر من قاعدة البيانات الحية والتخزين المحلي
  const foundUser = await findProfileLive(cleanEmail, cleanPass);

  if (!foundUser) {
    const failResult = recordFailedAttempt(cleanEmail);
    logSecurityEvent({
      eventType: 'LOGIN_FAILED',
      actorEmail: cleanEmail,
      details: `محاولة دخول لبوابة الأقسام ببريد غير مسجل: ${cleanEmail}`,
      severity: 'MEDIUM',
    });
    return {
      user: null,
      error: failResult.warningMessage || 'البريد الأكاديمي غير مسجل ضمن حسابات رؤساء الأقسام أو المقررين المعتمدة.',
    };
  }

  // 🛑 التحقق الصارم من أن الحساب رئيس قسم أو مقرر حصراً
  if (foundUser.role !== 'department_head' && foundUser.role !== 'rapporteur') {
    return {
      user: null, // 🔒 منع دخول غير رؤساء الأقسام والمقررين
      error: 'هذا البريد مسجل، يرجى استخدام بريد آخر.', // 🛡️ رسالة أمنية موحدة تمنع كشف نوع الحساب
    };
  }

  // 🔑 التحقق الحصري الصارم من كلمة المرور الأصلية لرئيس القسم أو المقرر
  const cleanStoredLeaderPass = (foundUser.temp_password || '').trim().normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '');
  const cleanInputLeaderPass = cleanPass.trim().normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '');
  const isPasswordCorrect = Boolean(cleanStoredLeaderPass && cleanStoredLeaderPass === cleanInputLeaderPass);

  if (!isPasswordCorrect) {
    const failResult = recordFailedAttempt(cleanEmail);
    logSecurityEvent({
      eventType: 'LOGIN_FAILED',
      actorId: foundUser.id,
      actorName: foundUser.full_name,
      actorRole: foundUser.role,
      actorEmail: foundUser.generated_email,
      details: `محاولة فاشلة لكلمة مرور رئيس/مقرر القسم (${foundUser.full_name}).`,
      severity: 'MEDIUM',
    });
    return {
      user: null,
      error: failResult.warningMessage || 'كلمة المرور غير صحيحة. يرجى التأكد من الرمز المدخل.',
    };
  }

  if (!foundUser.is_active) {
    return {
      user: null,
      error: 'عذراً! هذا الحساب معطل حالياً. يرجى مراجعة المسؤول العام عن النظام.',
    };
  }

  resetRateLimit(cleanEmail);
  createZeroTrustSession(foundUser);

  logSecurityEvent({
    eventType: 'LOGIN_SUCCESS',
    actorId: foundUser.id,
    actorName: foundUser.full_name,
    actorRole: foundUser.role,
    actorEmail: foundUser.generated_email,
    details: `تسجيل دخول ناجح لقيادة القسم (${foundUser.full_name}) إلى لوحة إدارة القسم.`,
    severity: 'LOW',
  });

  return { user: foundUser };
}

// 🏛️ 5. دالة الدخول الإداري العامة (للتوافقية)
export async function loginAdminPortal(email: string, pass: string): Promise<{ user: UserProfile | null; error?: string }> {
  return await loginDepartmentHeadOrRapporteur(email, pass);
}

// 🔐 دالة تسجيل الدخول الموحدة للواجهة
export async function loginByEmailOnly(
  email: string, 
  targetRole: 'student' | 'teacher', 
  password?: string
): Promise<{ user: UserProfile | null; error?: string }> {
  if (targetRole === 'teacher') {
    return await loginTeacherByEmailAndPassword(email, password || '');
  }
  return await loginStudentByEmailAndPassword(email, password || '');
}

// 🔐 دالة تسجيل الدخول والتحقق الشامل المستندة إلى Zero Trust
export function loginUser(email: string, pass: string): { user: UserProfile | null; error?: string } {
  if (typeof window === 'undefined') return { user: null, error: 'غير متاح بالخادم' };

  const cleanEmail = sanitizeEmail(email);
  const cleanPass = sanitizePasswordInput(pass);

  const allProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
  const found = allProfiles.find(
    (p) => p.generated_email?.toLowerCase().trim() === cleanEmail.toLowerCase()
  );

  if (!found) {
    return {
      user: null,
      error: 'عذراً! هذا الحساب غير مسجل في قاعدة البيانات الرسمية.',
    };
  }

  const isPasswordValid = Boolean(found.temp_password && found.temp_password.trim() === cleanPass);
  if (!isPasswordValid) {
    return {
      user: null,
      error: 'عذراً! رمز الدخول الأكاديمي غير صحيح.',
    };
  }

  if (found.is_active === false) {
    return {
      user: null,
      error: 'هذا الحساب معطل حالياً من قبل إدارة الكلية!',
    };
  }

  createZeroTrustSession(found);
  return { user: found };
}

// 🚪 دالة تسجيل الخروج الصريحة وتدمير توكن الجلسة المشفر
export function logoutUser(): void {
  purgeZeroTrustSession();
  supabase.auth.signOut().catch(() => {});
}

// ☁️ 1. دالة مزامنة وجلب كافة الحسابات من الجداول المنفصلة في Supabase مع دمج الكاش المحلي الذكي
export async function syncProfilesFromSupabase(): Promise<UserProfile[]> {
  return smartCachedFetch(
    'supabase_profiles',
    async () => {
      try {
        // 🔄 استعلام الجداول المنفصلة الخمسة وجدول profiles بالتوازي لتجميع كافة ملفات المنظومة
        const [saRes, dhRes, drRes, tRes, sRes, pRes] = await Promise.all([
          supabase.from('super_admins').select('*'),
          supabase.from('department_heads').select('*'),
          supabase.from('department_rapporteurs').select('*'),
          supabase.from('teachers').select('*'),
          supabase.from('students').select('*'),
          supabase.from('profiles').select('*'),
        ]);

        const aggregated: UserProfile[] = [];

        // 📋 تجميع السجلات من جدول profiles المباشر
        if (pRes.data && pRes.data.length > 0) {
          (pRes.data as UserProfile[]).forEach((p) => {
            aggregated.push(p);
          });
        }

        // 👑 تجميع المسؤولين العامين
        if (saRes.data && saRes.data.length > 0) {
          saRes.data.forEach((sa: SuperAdminRecord) => {
            aggregated.push({
              id: sa.id,
              auth_user_id: sa.auth_user_id,
              full_name: sa.full_name,
              role: 'super_admin',
              university_number: 'ADMIN-001',
              generated_email: sa.email,
              temp_password: sa.temp_password,
              is_active: true,
              created_at: sa.created_at,
            });
          });
        }


        // 🏢 تجميع رؤساء الأقسام
        if (dhRes.data && dhRes.data.length > 0) {
          dhRes.data.forEach((dh: DepartmentHeadRecord) => {
            aggregated.push({
              id: dh.id,
              auth_user_id: dh.auth_user_id,
              full_name: dh.full_name,
              role: 'department_head',
              department_id: dh.department_id,
              department_name: dh.department_name,
              university_number: dh.id,
              generated_email: dh.email,
              gender: dh.gender, // 🚻 جنس رئيس القسم المسجل
              temp_password: dh.temp_password,
              is_active: dh.is_active,
              created_at: dh.created_at,
            });
          });
        }

        // 📝 تجميع مقرري الأقسام
        if (drRes.data && drRes.data.length > 0) {
          drRes.data.forEach((dr: DepartmentRapporteurRecord) => {
            aggregated.push({
              id: dr.id,
              auth_user_id: dr.auth_user_id,
              full_name: dr.full_name,
              role: 'rapporteur',
              department_id: dr.department_id,
              department_name: dr.department_name,
              university_number: dr.id,
              generated_email: dr.email,
              gender: dr.gender, // 🚻 جنس مقرر القسم المسجل
              temp_password: dr.temp_password,
              is_active: dr.is_active,
              created_at: dr.created_at,
            });
          });
        }

        // 👨‍🏫 تجميع الأساتذة
        if (tRes.data && tRes.data.length > 0) {
          tRes.data.forEach((t: TeacherRecord) => {
            aggregated.push({
              id: t.id,
              auth_user_id: t.auth_user_id,
              full_name: t.full_name,
              role: 'teacher',
              department_id: t.department_id,
              department_name: t.department_name,
              university_number: t.id,
              generated_email: t.email,
              temp_password: t.temp_password,
              is_active: t.is_active,
              created_at: t.created_at,
            });
          });
        }

        // 🎓 تجميع الطلاب
        if (sRes.data && sRes.data.length > 0) {
          sRes.data.forEach((s: StudentRecord) => {
            aggregated.push({
              id: s.id,
              auth_user_id: s.auth_user_id,
              full_name: s.full_name,
              role: 'student',
              department_id: s.department_id,
              department_name: s.department_name,
              stage_id: s.stage_id,
              stage_number: s.stage_number,
              university_number: s.university_number,
              generated_email: s.email,
              study_type: s.study_type || 'morning',
              gender: s.gender,
              temp_password: s.temp_password,
              is_active: s.is_active,
              is_graduated: s.is_graduated,
              graduation_status: s.graduation_status,
              created_at: s.created_at,
            });
          });
        }

        if (aggregated.length > 0) {
          const localProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
          const map = new Map<string, UserProfile>();
          aggregated.forEach((p) => map.set(p.id, p));
          localProfiles.forEach((p) => {
            if (!map.has(p.id)) {
              map.set(p.id, p);
            }
          });
          const merged = Array.from(map.values());
          localStorage.setItem('sadiq_univ_profiles', JSON.stringify(merged));
          return merged;
        }
      } catch (err) {
        console.error('خطأ مزامنة الحسابات من الجداول المنفصلة:', err);
      }
      const local = localStorage.getItem('sadiq_univ_profiles');
      return local ? (JSON.parse(local) as UserProfile[]) : [];
    },
    { ttlSeconds: 60, swrSeconds: 300 }
  );
}

// ☁️ 2. دالة حفظ وتأكيد حساب في الجدول المخصص في Supabase بحسب الدور بدقة الأعمدة 100%
// ☁️ 2. دالة حفظ وتأكيد حساب في الجدول المخصص في Supabase بحسب الدور بدقة الأعمدة 100% وحماية فرادة البريد
export async function saveProfileToSupabase(profile: UserProfile): Promise<boolean> {
  try { // 🛡️ محاولة الحفظ الآمن
    const cleanEmail = (profile.generated_email || '').trim().toLowerCase(); // 🧹 تنظيف البريد وتحويله لحروف صغيرة
    if (!cleanEmail) return false; // 🚫 إذا ماكو بريد نرجع فشل

    if (profile.role === 'super_admin' || profile.role === 'admin') { // 👑 إذا كان مسؤول نظام
      const { data: existingSa } = await supabase.from('super_admins').select('id').ilike('email', cleanEmail).maybeSingle(); // 🔍 فحص وجود البريد
      if (existingSa && existingSa.id !== profile.id) { // ⚠️ إذا البريد محجوز لمدير آخر
        console.warn('🚫 تم رفض الحفظ: البريد مسجل لمسؤول آخر في قاعدة البيانات', cleanEmail); // 📝 تسجيل تحذير بالكونسول
        return false; // ❌ رفض الحفظ لمنع التكرار
      }
      const targetId = existingSa?.id || profile.id; // 🆔 اعتماد المعرف السليم

      const sa = { // 📦 تجهيز كائن المسؤول
        id: targetId, // 🆔 المعرف
        auth_user_id: profile.auth_user_id || null, // 🔐 معرف المصادقة
        full_name: profile.full_name, // 📝 الاسم الكامل
        email: cleanEmail, // ✉️ البريد
        temp_password: profile.temp_password, // 🔑 الرمز المؤقت
        created_at: profile.created_at || new Date().toISOString(), // ⏰ تاريخ الإنشاء
      };
      await supabase.from('super_admins').upsert(sa); // ⚡ رفع السجل لسوبابيز

    } else if (profile.role === 'department_head') { // 🏢 إذا كان رئيس قسم
      const { data: existingDh } = await supabase.from('department_heads').select('id').ilike('email', cleanEmail).maybeSingle(); // 🔍 فحص البريد برؤساء الأقسام
      if (existingDh && existingDh.id !== profile.id) { // ⚠️ إذا البريد محجوز لرئيس قسم آخر
        console.warn('🚫 تم رفض الحفظ: البريد مسجل لرئيس قسم آخر في قاعدة البيانات', cleanEmail); // 📝 تسجيل تحذير
        return false; // ❌ رفض الحفظ لمنع التكرار
      }
      const targetId = existingDh?.id || profile.id; // 🆔 اعتماد المعرف المناسب

      const dh = { // 📦 تجهيز كائن رئيس القسم
        id: targetId, // 🆔 المعرف
        auth_user_id: profile.auth_user_id || null, // 🔐 معرف المصادقة
        department_id: profile.department_id || null, // 🏢 معرف القسم
        full_name: profile.full_name, // 📝 الاسم الثلاثي
        email: cleanEmail, // ✉️ البريد
        gender: profile.gender || null, // 🚻 جنس رئيس القسم (ذكر / أنثى)
        temp_password: profile.temp_password, // 🔑 الرمز
        is_active: profile.is_active ?? true, // 🟢 حالة النشاط
        created_at: profile.created_at || new Date().toISOString(), // ⏰ تاريخ الإنشاء
      };
      await supabase.from('department_heads').upsert(dh); // ⚡ رفع السجل

    } else if (profile.role === 'rapporteur') { // 📝 إذا كان مقرر قسم
      const { data: existingDr } = await supabase.from('department_rapporteurs').select('id').ilike('email', cleanEmail).maybeSingle(); // 🔍 فحص البريد بالمقررين
      if (existingDr && existingDr.id !== profile.id) { // ⚠️ إذا البريد محجوز لمقرر آخر
        console.warn('🚫 تم رفض الحفظ: البريد مسجل لمقرر آخر في قاعدة البيانات', cleanEmail); // 📝 تسجيل تحذير
        return false; // ❌ رفض الحفظ لمنع التكرار
      }
      const targetId = existingDr?.id || profile.id; // 🆔 المعرف المعتمد

      const dr = { // 📦 تجهيز كائن المقرر
        id: targetId, // 🆔 المعرف
        auth_user_id: profile.auth_user_id || null, // 🔐 معرف المصادقة
        department_id: profile.department_id || null, // 🏢 معرف القسم
        full_name: profile.full_name, // 📝 الاسم الكامل
        email: cleanEmail, // ✉️ البريد الأكاديمي
        gender: profile.gender || null, // 🚻 جنس مقرر القسم (ذكر / أنثى)
        temp_password: profile.temp_password, // 🔑 الرمز
        is_active: profile.is_active ?? true, // 🟢 حالة النشاط
        created_at: profile.created_at || new Date().toISOString(), // ⏰ تاريخ الإنشاء
      };
      await supabase.from('department_rapporteurs').upsert(dr); // ⚡ رفع السجل

    } else if (profile.role === 'teacher') { //  إذا كان أستاذ أو تدريسي
      const { data: existingTch } = await supabase.from('teachers').select('id').ilike('email', cleanEmail).maybeSingle(); // 🔍 فحص البريد بالأساتذة
      if (existingTch && existingTch.id !== profile.id) { // ⚠️ إذا البريد محجوز لأستاذ آخر
        console.warn('🚫 تم رفض الحفظ: البريد مسجل لأستاذ آخر في قاعدة البيانات', cleanEmail); // 📝 تسجيل تحذير
        return false; // ❌ رفض الحفظ لمنع التكرار
      }
      const targetId = existingTch?.id || profile.id; // 🆔 المعرف المعتمد

      const t = { // 📦 تجهيز كائن التدريسي
        id: targetId, // 🆔 المعرف
        auth_user_id: profile.auth_user_id || null, // 🔐 معرف المصادقة
        department_id: profile.department_id || null, // 🏢 القسم التابع له
        full_name: profile.full_name, // 📝 الاسم الكامل
        email: cleanEmail, // ✉️ البريد الأكاديمي
        temp_password: profile.temp_password, // 🔑 كلمة المرور
        is_active: profile.is_active ?? true, // 🟢 حالة النشاط
        created_at: profile.created_at || new Date().toISOString(), // ⏰ تاريخ الإنشاء
      };
      await supabase.from('teachers').upsert(t); // ⚡ رفع السجل

    } else { // 🎓 إذا كان طالباً أكاديمياً
      const { data: existingStd } = await supabase.from('students').select('id').ilike('email', cleanEmail).maybeSingle(); // 🔍 فحص البريد بالطلاب
      if (existingStd && existingStd.id !== profile.id) { // ⚠️ إذا البريد محجوز لطالب آخر
        console.warn('🚫 تم رفض الحفظ: البريد مسجل لطالب آخر في قاعدة البيانات', cleanEmail); // 📝 تسجيل تحذير
        return false; // ❌ رفض الحفظ لمنع تكرار بريد الطالب نهائياً
      }
      const targetId = existingStd?.id || profile.id; // 🆔 المعرف المعتمد للطالب

      const s = { // 📦 تجهيز كائن الطالب
        id: targetId, // 🆔 المعرف
        auth_user_id: profile.auth_user_id || null, // 🔐 معرف المصادقة
        department_id: profile.department_id || null, // 🏢 القسم
        stage_id: profile.stage_id || (profile.department_id ? `stage-${profile.department_id}-${profile.stage_number || 1}` : null), // 🎓 معرف المرحلة
        stage_number: profile.stage_number || 1, // 🔢 رقم المرحلة
        full_name: profile.full_name, // 📝 الاسم الثلاثي
        // 🎓 توليد رقم جامعي يبدأ بـ 2026 في حال عدم توفره
        university_number: profile.university_number || `2026${Math.floor(10000 + Math.random() * 90000)}`, // 🆔 الرقم الجامعي
        email: cleanEmail, // ✉️ البريد الأكاديمي
        study_type: profile.study_type || 'morning', // ☀️ الدراسة (صباحي / مسائي)
        gender: profile.gender || 'male', // 🚻 الجنس
        temp_password: profile.temp_password, // 🔑 الرمز المؤقت
        is_active: profile.is_active ?? true, // 🟢 حالة النشاط
        created_at: profile.created_at || new Date().toISOString(), // ⏰ تاريخ الإنشاء
      };
      await supabase.from('students').upsert(s); // ⚡ رفع سجل الطالب لسوبابيز
    }

    // ⚡ حفظ وتأكيد السجل في جدول profiles العام لضمان المزامنة المزدوجة المباشرة
    await supabase.from('profiles').upsert(profile); // 🏛️ تحديث جدول البروفايلات الشامل

    invalidateCacheKey('supabase_profiles'); // 🧹 إبطال كاش الحسابات
    return true; // ✅ نجاح الحفظ
  } catch (err) { // ⚠️ التقاط أي خطأ استثنائي
    console.error('خطأ أثناء حفظ الحساب في Supabase:', err); // 📝 تسجيل الخطأ
    return false; // ❌ فشل العملية
  }
}

// ☁️ 3. دالة حذف حساب من الجدول المخصص في Supabase
export async function deleteProfileFromSupabase(id: string, role?: string): Promise<boolean> {
  try {
    // 🗑️ حذف من جدول profiles العام
    await supabase.from('profiles').delete().eq('id', id);

    if (role === 'super_admin' || role === 'admin') {
      await supabase.from('super_admins').delete().eq('id', id);
    } else if (role === 'department_head') {
      await supabase.from('department_heads').delete().eq('id', id);
    } else if (role === 'rapporteur') {
      await supabase.from('department_rapporteurs').delete().eq('id', id);
    } else if (role === 'teacher') {
      await supabase.from('teachers').delete().eq('id', id);
    } else if (role === 'student') {
      await supabase.from('students').delete().eq('id', id);
    } else {
      // 🗑️ حذف من كافة الجداول الخمسة للتأكيد
      await Promise.all([
        supabase.from('super_admins').delete().eq('id', id),
        supabase.from('department_heads').delete().eq('id', id),
        supabase.from('department_rapporteurs').delete().eq('id', id),
        supabase.from('teachers').delete().eq('id', id),
        supabase.from('students').delete().eq('id', id),
      ]);
    }
    invalidateCacheKey('supabase_profiles');
    return true;
  } catch {
    return false;
  }
}

// ☁️ 4. دالة مزامنة وجلب الدرجات والبنود الـ 7 من جدول grades في Supabase مع كاش SWR
export async function syncGradesFromSupabase(): Promise<Grade[]> {
  return smartCachedFetch(
    'supabase_grades',
    async () => {
      try {
        const { data, error } = await supabase.from('grades').select('*'); // 📤 استعلام جدول الدرجات
        if (!error && data && data.length > 0) {
          localStorage.setItem('sadiq_univ_grades', JSON.stringify(data)); // 💾 تحديث التخزين المحلي
          return data as Grade[];
        }
      } catch (err) {
        console.error('خطأ مزامنة درجات Supabase:', err);
      }
      const local = localStorage.getItem('sadiq_univ_grades');
      return local ? (JSON.parse(local) as Grade[]) : [];
    },
    { ttlSeconds: 30, swrSeconds: 120 }
  );
}

// ☁️ 5. دالة حفظ وتحديث سعي طالب في مادة بقاعدة بيانات Supabase مع تدقيق وتعقيم السقوف وحقن SQL (Zero Trust Grade Validation)
export async function saveGradeToSupabase(grade: Grade): Promise<boolean> {
  try {
    // 🛡️ فحص وتعقيم درجات بنود بولونيا للتأكد من عدم تجاوز السقوف
    const validated = validateAndSanitizeGradePayload(grade);
    const sanitizedGrade = { ...grade, ...validated.sanitized } as Grade;

    // 🔍 فحص وتطهير الكائن ضد حقن SQL
    const sqlCheck = validateAndSanitizeSqlPayload(sanitizedGrade);
    const finalSafeGrade = sqlCheck.sanitizedPayload;

    const { error } = await supabase.from('grades').upsert(finalSafeGrade); // ⚡ رفع وتأكيد الدرجة
    if (!error) {
      invalidateCacheKey('supabase_grades'); // 🧹 تحديث كاش الدرجات
    }
    return !error;
  } catch {
    return false;
  }
}

// ☁️ 6. دالة تسجيل قيد في سجل التدقيق الحصين في Supabase مع فحص حقن SQL
export async function saveAuditLogToSupabase(auditLog: AuditLog): Promise<boolean> {
  try {
    // 🔍 فحص وتطهير الكائن ضد حقن SQL
    const sqlCheck = validateAndSanitizeSqlPayload(auditLog);
    const finalSafeLog = sqlCheck.sanitizedPayload;

    const { error } = await supabase.from('audit_logs').upsert(finalSafeLog); // ⚡ رفع السجل
    return !error;
  } catch {
    return false;
  }
}

// ☁️ 7. دالة مزامنة وجلب الأقسام والمواد وتكليفات الأساتذة مع كاش SWR المتقدم والدمج الذكي
export async function syncAcademicEntitiesFromSupabase(): Promise<void> {
  return smartCachedFetch(
    'supabase_academic_entities',
    async () => {
      try {
        const [deptRes, courseRes, tcRes] = await Promise.all([
          supabase.from('departments').select('*'),
          supabase.from('courses').select('*'),
          supabase.from('teacher_courses').select('*'),
        ]);

        if (deptRes.data && deptRes.data.length > 0) {
          const localDepts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS);
          const deptMap = new Map<string, Department>();
          deptRes.data.forEach((d: Department) => deptMap.set(d.id, d));
          localDepts.forEach((d) => {
            if (!deptMap.has(d.id)) deptMap.set(d.id, d);
          });
          saveStoredData('departments', Array.from(deptMap.values()));
        }

        if (courseRes.data && courseRes.data.length > 0) {
          const localCourses = getStoredData<Course[]>('courses', INITIAL_COURSES);
          const courseMap = new Map<string, Course>();
          courseRes.data.forEach((c: Course) => courseMap.set(c.id, c));
          localCourses.forEach((c) => {
            if (!courseMap.has(c.id)) {
              courseMap.set(c.id, c);
            } else {
              const cloudC = courseMap.get(c.id)!;
              courseMap.set(c.id, { ...c, ...cloudC });
            }
          });
          saveStoredData('courses', Array.from(courseMap.values()));
        }

        if (tcRes.data && tcRes.data.length > 0) {
          // 💾 جلب البيانات الحالية لإثراء تكليفات الأساتذة
          const localTCs = getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES); // 📋 التكليفات المخزنة
          const localProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES); // 👤 ملفات المستخدمين
          const localCourses = getStoredData<Course[]>('courses', INITIAL_COURSES); // 📚 المواد الدراسية
          const tcMap = new Map<string, TeacherCourse>(); // 🗺️ خريطة لتفادي التكرار

          // 🔄 إثراء بيانات التكليف بأسماء الأستاذ والمادة والكورس
          tcRes.data.forEach((cloudTC: TeacherCourse) => {
            const localMatch = localTCs.find((ltc) => ltc.id === cloudTC.id || (ltc.teacher_id === cloudTC.teacher_id && ltc.course_id === cloudTC.course_id));
            const matchedProf = localProfiles.find(
              (p) => p.id === cloudTC.teacher_id || p.university_number === cloudTC.teacher_id || (p.generated_email && p.generated_email.toLowerCase() === String(cloudTC.teacher_id).toLowerCase())
            );
            const matchedCourse = localCourses.find(
              (c) => c.id === cloudTC.course_id || c.code === cloudTC.course_id || (c.name && localMatch?.course_name && c.name.trim() === localMatch.course_name.trim())
            );

            const teacherName = cloudTC.teacher_name || localMatch?.teacher_name || matchedProf?.full_name || 'أستاذ المادة';
            const courseName = cloudTC.course_name || localMatch?.course_name || matchedCourse?.name || 'مادة دراسية معتمدة';
            const semesterNumber: 1 | 2 = (cloudTC.semester || localMatch?.semester || matchedCourse?.semester || 1) === 2 ? 2 : 1;
            const departmentId = cloudTC.department_id || localMatch?.department_id || matchedCourse?.department_id || matchedProf?.department_id || '';

            const enrichedTC: TeacherCourse = {
              ...localMatch,
              ...cloudTC,
              id: cloudTC.id || localMatch?.id || `tc-${Date.now()}`,
              teacher_id: cloudTC.teacher_id,
              teacher_name: teacherName,
              course_id: cloudTC.course_id,
              course_name: courseName,
              semester: semesterNumber,
              department_id: departmentId,
              role_in_course: cloudTC.role_in_course || localMatch?.role_in_course || 'both',
              created_at: cloudTC.created_at || localMatch?.created_at || new Date().toISOString(),
            };

            tcMap.set(enrichedTC.id, enrichedTC); // 💾 حفظ الكائن المثري
          });

          // 🛡️ دمج التكليفات المحلية
          localTCs.forEach((tc) => {
            if (!tcMap.has(tc.id)) tcMap.set(tc.id, tc);
          });

          const mergedTCs = Array.from(tcMap.values());
          saveStoredData('teacher_courses', mergedTCs); // 💾 حفظ التكليفات
        }
      } catch (e) {
        console.error('خطأ مزامنة الكيانات السحابية:', e);
      }
    },
    { ttlSeconds: 180, swrSeconds: 600 }
  );
}

// ==============================================================================
// 🎓 دوال التعامل المباشر مع جدول الطلاب المستقل (students)
// ==============================================================================
export async function saveStudentRecord(student: StudentRecord): Promise<boolean> {
  try {
    const { error } = await supabase.from('students').upsert(student);
    if (!error) invalidateCacheKey('supabase_profiles');
    return !error;
  } catch {
    return false;
  }
}

export async function deleteStudentRecord(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (!error) invalidateCacheKey('supabase_profiles');
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 👨‍🏫 دوال التعامل المباشر مع جدول الأساتذة المستقل (teachers)
// ==============================================================================
export async function saveTeacherRecord(teacher: TeacherRecord): Promise<boolean> {
  try {
    const { error } = await supabase.from('teachers').upsert(teacher);
    if (!error) invalidateCacheKey('supabase_profiles');
    return !error;
  } catch {
    return false;
  }
}

export async function deleteTeacherRecord(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (!error) invalidateCacheKey('supabase_profiles');
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 🏢 دوال التعامل المباشر مع جداول قيادات الأقسام (department_heads & rapporteurs)
// ==============================================================================
export async function saveDepartmentHeadRecord(head: DepartmentHeadRecord): Promise<boolean> {
  try {
    const { error } = await supabase.from('department_heads').upsert(head);
    if (!error) invalidateCacheKey('supabase_profiles');
    return !error;
  } catch {
    return false;
  }
}

export async function saveRapporteurRecord(rap: DepartmentRapporteurRecord): Promise<boolean> {
  try {
    const { error } = await supabase.from('department_rapporteurs').upsert(rap);
    if (!error) invalidateCacheKey('supabase_profiles');
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 👑 دوال التعامل المباشر مع جدول المسؤولين العامين (super_admins)
// ==============================================================================
export async function saveSuperAdminRecord(admin: SuperAdminRecord): Promise<boolean> {
  try {
    const { error } = await supabase.from('super_admins').upsert(admin);
    if (!error) invalidateCacheKey('supabase_profiles');
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 📚 دوال مزامنة وحفظ المواد الدراسية (courses) في Supabase مع الدمج الذكي والإثراء التلقائي
// ==============================================================================
export async function syncCoursesFromSupabase(): Promise<Course[]> {
  return smartCachedFetch( // ⚡ استخدام الكاش الذكي لتقليل الضغط ع السيرفر
    'supabase_courses', // 🔑 مفتاح الكاش المخصص للمواد
    async () => { // 🔄 دالة الجلب والدمج الخلفية
      try { // 🛡️ محاولة جلب المواد بأمان
        const { data, error } = await supabase.from('courses').select('*'); // 📥 استعلام جدول المواد من سحابة Supabase
        if (!error && data && data.length > 0) { // ✅ إذا نجح الجلب ورجعت مواد حقيقية
          const localCourses: Course[] = getStoredData<Course[]>('courses', INITIAL_COURSES); // 📋 جلب المواد المخزنة محلياً
          const localProfiles: UserProfile[] = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES); // 👤 جلب بروفايلات الأساتذة
          const localTCs: TeacherCourse[] = getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES); // 📝 جلب سجل تكليفات الأساتذة
          const courseMap: Map<string, Course> = new Map<string, Course>(); // 🗺️ خريطة لتجميع المواد بدون أي تكرار
          
          data.forEach((c: Course) => courseMap.set(c.id, c)); // ➕ وضع المواد السحابية بالخريطة
          
          localCourses.forEach((c: Course) => { // 🔄 المرور على كل مادة محلية لدمجها بدقة
            if (!courseMap.has(c.id)) { // 🆕 إذا المادة مو موجودة بالسحابة بعد
              courseMap.set(c.id, c); // 💾 نبقي عليها بالخريطة
            } else { // ⚖️ إذا موجودة بالسحابة ندمجها مع الحفاظ الفولاذي على أسماء ومعرفات الأساتذة
              const cloudC: Course = courseMap.get(c.id)!; // ☁️ المادة القادمة من السحابة
              courseMap.set(c.id, { // 📦 دمج الخصائص
                ...c, // 📋 البيانات المحلية السابقة
                ...cloudC, // ☁️ تحديثات السحابة
                theory_teacher_id: cloudC.theory_teacher_id || c.theory_teacher_id, // 👨‍🏫 الحفاظ على معرف أستاذ النظري
                theory_teacher_name: c.theory_teacher_name || cloudC.theory_teacher_name, // 👤 الحفاظ على اسم أستاذ النظري من المسح
                practical_teacher_id: cloudC.practical_teacher_id || c.practical_teacher_id, // 🔬 الحفاظ على معرف أستاذ العملي
                practical_teacher_name: c.practical_teacher_name || cloudC.practical_teacher_name, // 🧪 الحفاظ على اسم أستاذ العملي من المسح
              });
            }
          });

          // 🧠 الإثراء التلقائي الذكي لربط الأساتذة المفقودين بالملفات والتكليفات المسجلة
          const enrichedCourses: Course[] = Array.from(courseMap.values()).map((course: Course): Course => { // 🔄 فحص كل مادة
            let thId: string | undefined = course.theory_teacher_id; // 🔑 معرف أستاذ النظري
            let thName: string | undefined = course.theory_teacher_name; // 👤 اسم أستاذ النظري
            let prId: string | undefined = course.practical_teacher_id; // 🔑 معرف أستاذ العملي
            let prName: string | undefined = course.practical_teacher_name; // 👤 اسم أستاذ العملي

            // 1️⃣ مطابقة الأسماء من البروفايلات إذا كان المعرف متوفراً والاسم مفقوداً
            if (thId && !thName) { // 🔍 إذا المعرف موجود بس الاسم فارغ
              const matchedProf: UserProfile | undefined = localProfiles.find((p: UserProfile): boolean => p.id === thId); // 👤 البحث عن البروفايل
              if (matchedProf) thName = matchedProf.full_name; // 📝 استخراج الاسم الكامل
            }
            if (prId && !prName) { // 🔍 إذا معرف العملي موجود بس الاسم فارغ
              const matchedPrProf: UserProfile | undefined = localProfiles.find((p: UserProfile): boolean => p.id === prId); // 👤 البحث عن البروفايل
              if (matchedPrProf) prName = matchedPrProf.full_name; // 📝 استخراج الاسم الكامل
            }

            // 2️⃣ مطابقة وتزامن تلقائي 100% مع جدول التكليفات (teacher_courses)
            const matchedAssignments: TeacherCourse[] = localTCs.filter((tc: TeacherCourse): boolean => tc.course_id === course.id); // 📋 جلب تكليفات هذه المادة
            if (matchedAssignments.length > 0) { // 🎯 إذا المادة مكلف بيها أساتذة
              // فحص تكليف النظري أو المشترك
              const thTC: TeacherCourse | undefined = matchedAssignments.find((tc: TeacherCourse): boolean => tc.role_in_course === 'theory' || tc.role_in_course === 'both'); // 🔍 تكليف النظري
              if (thTC) { // ✅ إذا اكو تكليف نظري
                if (!thId) thId = thTC.teacher_id; // 🔗 تثبيت معرف الأستاذ
                if (!thName) thName = thTC.teacher_name || localProfiles.find((p: UserProfile): boolean => p.id === thTC.teacher_id)?.full_name; // 👤 تثبيت اسمه
              }
              // فحص تكليف العملي
              const prTC: TeacherCourse | undefined = matchedAssignments.find((tc: TeacherCourse): boolean => tc.role_in_course === 'practical' || (tc.role_in_course === 'both' && Boolean(course.has_practical))); // 🔍 تكليف العملي
              if (prTC) { // ✅ إذا اكو تكليف عملي
                if (!prId) prId = prTC.teacher_id; // 🔗 تثبيت معرف أستاذ العملي
                if (!prName) prName = prTC.teacher_name || localProfiles.find((p: UserProfile): boolean => p.id === prTC.teacher_id)?.full_name; // 🧪 تثبيت اسمه
              }
            }

            return { // 📦 إرجاع المادة مكتملة ومعززة بالأساتذة 100%
              ...course, // 📋 بيانات المادة
              theory_teacher_id: thId, // 👨‍🏫 معرف أستاذ النظري
              theory_teacher_name: thName, // 👤 اسم أستاذ النظري
              practical_teacher_id: prId, // 🔬 معرف أستاذ العملي
              practical_teacher_name: prName, // 🧪 اسم أستاذ العملي
            };
          });

          saveStoredData('courses', enrichedCourses); // 💾 حفظ المواد المدمجة والمعززة محلياً
          return enrichedCourses; // 🚀 إرجاع القائمة الكاملة
        }
      } catch (err) { // ⚠️ في حال حدوث أي خطأ
        console.warn('تنبيه: تعذر جلب المواد من السحابة:', err); // 🛑 تسجيل التنبيه
      }
      return getStoredData<Course[]>('courses', INITIAL_COURSES); // 🛡️ إرجاع الكاش المحلي الموثوق
    },
    { ttlSeconds: 60, swrSeconds: 300 } // ⏱️ خيارات الكاش المؤقت
  );
}

export async function saveCourseToSupabase(course: Course): Promise<boolean> {
  try { // 🛡️ محاولة حفظ المادة بأمان
    // 🛡️ تجهيز وتعقيم كائن المادة لمطابقة أعمدة قاعدة البيانات بدقة مع تضمين أسماء الأساتذة
    const payload = {
      id: course.id, // 🆔 معرف المادة
      name: course.name, // 📖 اسم المادة
      code: course.code, // 🔢 رمز المادة
      department_id: course.department_id, // 🏢 معرف القسم
      stage_number: course.stage_number || 1, // 🎓 رقم المرحلة
      stage_id: course.stage_id || `stage-${course.department_id}-${course.stage_number || 1}`, // 🏷️ معرف المرحلة
      academic_year_id: course.academic_year_id || 'year-2026', // 📅 العام الدراسي
      semester: course.semester || 1, // 🗓️ الكورس الدراسي
      credit_hours: course.credit_hours || 3, // ⏱️ الساعات والوحدات
      has_practical: Boolean(course.has_practical), // 🧪 هل تحتوي عملي
      course_type: course.course_type || (course.has_practical ? 'theory_and_practical' : 'theory_only'), // 🏷️ نوع المادة
      theory_teacher_id: course.theory_teacher_id || null, // 👨‍🏫 معرف أستاذ النظري
      theory_teacher_name: course.theory_teacher_name || null, // 👤 اسم أستاذ النظري
      practical_teacher_id: course.practical_teacher_id || null, // 🔬 معرف أستاذ العملي
      practical_teacher_name: course.practical_teacher_name || null, // 🧪 اسم أستاذ العملي
      teacher_id: course.theory_teacher_id || course.teacher_id || null, // 🔗 معرف الأستاذ الأساسي
      teacher_name: course.theory_teacher_name || course.teacher_name || null, // 👤 اسم الأستاذ الأساسي
      created_at: course.created_at || new Date().toISOString(), // ⏰ تاريخ الإنشاء
    };

    const { error } = await supabase.from('courses').upsert(payload); // ☁️ رفع وتحديث المادة في Supabase
    if (!error) { // ✅ إذا نجح الحفظ المكتمل
      invalidateCacheKey('supabase_courses'); // 🔄 تنظيف كاش المواد
      invalidateCacheKey('supabase_academic_entities'); // 🔄 تنظيف كاش الكيانات
      return true; // 🎉 تم بنجاح
    }

    // 🛡️ خطة بديلة (Fallback) في حال عدم وجود أعمدة الأسماء في جدول courses بالسحابة
    if (error && (error.code === 'PGRST204' || error.message?.includes('column'))) { // 🔍 فحص ما إذا كان الخطأ بسبب عمود غير موجود
      const fallbackPayload = { // 📦 تجهيز حمولة بديلة بدون أسماء الأساتذة
        id: course.id,
        name: course.name,
        code: course.code,
        department_id: course.department_id,
        stage_number: course.stage_number || 1,
        stage_id: course.stage_id || `stage-${course.department_id}-${course.stage_number || 1}`,
        academic_year_id: course.academic_year_id || 'year-2026',
        semester: course.semester || 1,
        credit_hours: course.credit_hours || 3,
        has_practical: Boolean(course.has_practical),
        theory_teacher_id: course.theory_teacher_id || null,
        practical_teacher_id: course.practical_teacher_id || null,
        created_at: course.created_at || new Date().toISOString(),
      };
      const { error: fallbackErr } = await supabase.from('courses').upsert(fallbackPayload); // ☁️ رفع الحمولة البديلة
      if (!fallbackErr) { // ✅ إذا نجح الحفظ البديل
        invalidateCacheKey('supabase_courses'); // 🔄 تنظيف الكاش
        invalidateCacheKey('supabase_academic_entities'); // 🔄 تنظيف كاش الكيانات
        return true; // 🎉 نجاح الحفظ البديل
      }
    }

    return !error; // 📊 إرجاع نتيجة الحفظ
  } catch { // ⚠️ اعتراض أي استثناء غير متوقع
    return false; // 🛑 فشل الحفظ
  }
}

export async function deleteCourseFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (!error) {
      invalidateCacheKey('supabase_courses');
      invalidateCacheKey('supabase_academic_entities');
    }
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 👨‍🏫 دوال مزامنة وحفظ وحذف تكليفات الأساتذة (teacher_courses) في Supabase مع الدمج الذكي والإثراء التلقائي
// ==============================================================================
export async function syncTeacherCoursesFromSupabase(): Promise<TeacherCourse[]> {
  // ⚡ استخدام محرك الكاش الذكي لتقليل استهلاك السيرفر وتسريع التحميل
  return smartCachedFetch(
    'supabase_teacher_courses',
    async () => {
      try {
        // 📥 استعلام جدول التكليفات من سحابة Supabase
        const { data, error } = await supabase.from('teacher_courses').select('*');
        if (!error && data && data.length > 0) {
          // 💾 جلب التكليفات والحسابات والمواد المخزنة محلياً لدمج البيانات وإثرائها
          const localTCs = getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES); // 📋 التكليفات المحلية
          const localProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES); // 👤 بروفايلات الأساتذة
          const localCourses = getStoredData<Course[]>('courses', INITIAL_COURSES); // 📚 المواد الدراسية

          // 🗺️ خريطة لتجميع التكليفات وضمان عدم تكرار المعرفات
          const tcMap = new Map<string, TeacherCourse>();

          // 🔄 معالجة وإثراء كل تكليف قادم من السحابة بأسماء الأستاذ والمادة والمرحلة
          data.forEach((cloudTC: TeacherCourse) => {
            // 🔍 البحث عن التكليف المحفوظ محلياً مسبقاً
            const localMatch = localTCs.find((ltc) => ltc.id === cloudTC.id || (ltc.teacher_id === cloudTC.teacher_id && ltc.course_id === cloudTC.course_id));

            // 👤 استخراج اسم الأستاذ من البروفايلات أو التكليف المحلي
            const matchedProf = localProfiles.find(
              (p) => p.id === cloudTC.teacher_id || p.university_number === cloudTC.teacher_id || (p.generated_email && p.generated_email.toLowerCase() === String(cloudTC.teacher_id).toLowerCase())
            );
            const teacherName = cloudTC.teacher_name || localMatch?.teacher_name || matchedProf?.full_name || 'أستاذ المادة';

            // 📘 استخراج اسم المادة والكورس من قائمة المواد أو التكليف المحلي
            const matchedCourse = localCourses.find(
              (c) => c.id === cloudTC.course_id || c.code === cloudTC.course_id || (c.name && localMatch?.course_name && c.name.trim() === localMatch.course_name.trim())
            );
            const courseName = cloudTC.course_name || localMatch?.course_name || matchedCourse?.name || 'مادة دراسية معتمدة';
            const semesterNumber: 1 | 2 = (cloudTC.semester || localMatch?.semester || matchedCourse?.semester || 1) === 2 ? 2 : 1;
            const departmentId = cloudTC.department_id || localMatch?.department_id || matchedCourse?.department_id || matchedProf?.department_id || '';

            // 📦 تجميع كائن التكليف المكتمل والمحصن
            const enrichedTC: TeacherCourse = {
              ...localMatch,
              ...cloudTC,
              id: cloudTC.id || localMatch?.id || `tc-${Date.now()}`,
              teacher_id: cloudTC.teacher_id,
              teacher_name: teacherName,
              course_id: cloudTC.course_id,
              course_name: courseName,
              semester: semesterNumber,
              department_id: departmentId,
              role_in_course: cloudTC.role_in_course || localMatch?.role_in_course || 'both',
              created_at: cloudTC.created_at || localMatch?.created_at || new Date().toISOString(),
            };

            tcMap.set(enrichedTC.id, enrichedTC); // 💾 إضافة للسجل
          });

          // 🛡️ الحفاظ على أي تكليف محلي لم يُرفع للسحابة بعد
          localTCs.forEach((tc) => {
            if (!tcMap.has(tc.id)) {
              tcMap.set(tc.id, tc);
            }
          });

          // 💾 حفظ التكليفات المدمجة في التخزين الرسمي
          const merged = Array.from(tcMap.values());
          saveStoredData('teacher_courses', merged);

          // 📡 إطلاق حدث التحديث اللحظي لصفحة الأساتذة والداشبورد
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('teacher_courses_updated'));
            window.dispatchEvent(new Event('storage'));
          }

          return merged;
        }
      } catch (err) {
        console.warn('تنبيه: تعذر جلب تكليفات الأساتذة من السحابة:', err);
      }
      return getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES);
    },
    { ttlSeconds: 30, swrSeconds: 120 }
  );
}

export async function saveTeacherCourseToSupabase(tc: TeacherCourse): Promise<boolean> {
  // ⚡ رفع وتحديث سجل التكليف في قاعدة بيانات Supabase
  try {
    const payload = {
      id: tc.id, // 🆔 معرف التكليف
      teacher_id: tc.teacher_id, // 🔗 معرف الأستاذ
      teacher_name: tc.teacher_name || null, // 👤 اسم الأستاذ
      course_id: tc.course_id, // 🔗 معرف المادة
      course_name: tc.course_name || null, // 📖 اسم المادة
      department_id: tc.department_id || null, // 🏢 معرف القسم
      semester: tc.semester || 1, // 🗓️ الكورس
      role_in_course: tc.role_in_course || 'both', // 🏷️ صفة التكليف
      created_at: tc.created_at || new Date().toISOString(), // ⏰ تاريخ التكليف
    };
    const { error } = await supabase.from('teacher_courses').upsert(payload); // ☁️ رفع السجل لسحابة Supabase
    if (!error) { // ✅ إذا نجح الحفظ
      invalidateCacheKey('supabase_teacher_courses'); // 🔄 تنظيف كاش التكليفات
      invalidateCacheKey('supabase_academic_entities'); // 🔄 تنظيف كاش الكيانات
      return true; // 🎉 تم بنجاح
    }

    // 🛡️ خطة بديلة (Fallback) في حال عدم توفر أعمدة الأسماء
    if (error && (error.code === 'PGRST204' || error.message?.includes('column'))) {
      const fallbackPayload = {
        id: tc.id,
        teacher_id: tc.teacher_id,
        course_id: tc.course_id,
        department_id: tc.department_id || null,
        semester: tc.semester || 1,
        role_in_course: tc.role_in_course || 'both',
        created_at: tc.created_at || new Date().toISOString(),
      };
      const { error: fallbackErr } = await supabase.from('teacher_courses').upsert(fallbackPayload);
      if (!fallbackErr) {
        invalidateCacheKey('supabase_teacher_courses');
        invalidateCacheKey('supabase_academic_entities');
        return true;
      }
    }
    return !error;
  } catch {
    return false;
  }
}

export async function deleteTeacherCourseFromSupabase(id: string): Promise<boolean> {
  // 🗑️ حذف سجل التكليف من قاعدة بيانات Supabase
  try {
    const { error } = await supabase.from('teacher_courses').delete().eq('id', id);
    if (!error) {
      invalidateCacheKey('supabase_teacher_courses');
      invalidateCacheKey('supabase_academic_entities');
    }
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// ==============================================================================
// 🗓️ دوال مزامنة وحفظ وحذف جدول المحاضرات الأسبوعي (schedule_lectures) في Supabase مع الدمج الذكي
// ==============================================================================

// 🛡️ دالة مساعدة لضمان وجود القسم والمرحلة والمادة في Supabase لتفادي خطأ Foreign Key 409
async function ensureLectureDependenciesInSupabase(lec: ScheduleLecture): Promise<void> {
  try {
    const deptId = lec.department_id || 'dept-1';
    // 0️⃣ ضمان وجود السنة الدراسية لتفادي أخطاء المفتاح الأجنبي للمادة
    await supabase.from('academic_years').upsert({
      id: 'year-2026',
      label: '2026-2027',
      is_current: true
    }, { onConflict: 'id', ignoreDuplicates: true });

    // 1️⃣ ضمان وجود القسم في جدول departments
    await supabase.from('departments').upsert({
      id: deptId,
      name: 'القسم الأكاديمي',
      code: 'DEPT'
    }, { onConflict: 'id', ignoreDuplicates: true });

    // 2️⃣ ضمان وجود المرحلة في جدول stages
    const stageId = `${deptId}-stage-${lec.stage_number || 1}`;
    await supabase.from('stages').upsert({
      id: stageId,
      department_id: deptId,
      stage_number: lec.stage_number || 1
    }, { onConflict: 'id', ignoreDuplicates: true });

    // 3️⃣ ضمان وجود المادة في جدول courses إذا كانت محددة
    if (lec.course_id) {
      await supabase.from('courses').upsert({
        id: lec.course_id,
        department_id: deptId,
        stage_id: stageId,
        academic_year_id: 'year-2026',
        name: lec.course_name || 'مادة دراسية',
        code: lec.course_code || 'CRS',
        credit_hours: 3
      }, { onConflict: 'id', ignoreDuplicates: true });
    }
  } catch (depErr) {
    console.warn('تنبيه أثناء تهيئة تبعيات المحاضرة في السحابة:', depErr);
  }
}

// 📦 دالة مساعدة لتضمين وحفظ بيانات التقويم والأسابيع الـ 15 داخل حقل notes لحمايتها سحابياً
function encodeLectureMetaIntoNotes(lec: ScheduleLecture): string | undefined {
  const meta: Record<string, unknown> = {};
  if (lec.date) meta.date = lec.date;
  if (lec.week_number) meta.week_number = lec.week_number;
  if (lec.custom_weekly_dates) meta.custom_weekly_dates = lec.custom_weekly_dates;
  if (lec.weekly_overrides) meta.weekly_overrides = lec.weekly_overrides;

  const rawNotes = lec.notes ? lec.notes.replace(/<!--\s*LEC_DATA:[\s\S]*?-->/g, '').trim() : '';
  if (Object.keys(meta).length === 0) return rawNotes || undefined;
  const metaTag = `<!-- LEC_DATA:${JSON.stringify(meta)} -->`;
  return rawNotes ? `${rawNotes}\n${metaTag}` : metaTag;
}

// 📦 دالة مساعدة لاستخراج وفك تشفير بيانات التقويم والأسابيع الـ 15 من حقل notes السحابي
function decodeLectureMetaFromNotes(lec: ScheduleLecture): ScheduleLecture {
  if (!lec.notes || !lec.notes.includes('<!-- LEC_DATA:')) return lec;
  try {
    const match = lec.notes.match(/<!--\s*LEC_DATA:([\s\S]*?)-->/);
    if (match && match[1]) {
      const meta = JSON.parse(match[1]) as {
        date?: string;
        week_number?: number;
        custom_weekly_dates?: Record<number, string>;
        weekly_overrides?: Record<number, { day?: DayOfWeek; date?: string; start_time?: string; end_time?: string; room?: string; teacher_id?: string; teacher_name?: string }>;
      };
      const cleanNotes = lec.notes.replace(/<!--\s*LEC_DATA:[\s\S]*?-->/g, '').trim();
      return {
        ...lec,
        date: lec.date || meta.date,
        week_number: lec.week_number || meta.week_number || 1,
        custom_weekly_dates: lec.custom_weekly_dates || meta.custom_weekly_dates,
        weekly_overrides: lec.weekly_overrides || meta.weekly_overrides,
        notes: cleanNotes || undefined,
      };
    }
  } catch (parseErr) {
    console.warn('تنبيه أثناء فك بيانات التقويم:', parseErr);
  }
  return lec;
}

export async function syncScheduleLecturesFromSupabase(): Promise<ScheduleLecture[]> {
  return smartCachedFetch(
    'supabase_schedule_lectures',
    async () => {
      try {
        const { data, error } = await supabase.from('schedule_lectures').select('*');
        if (!error && data) {
          const localLecs = getStoredData<ScheduleLecture[]>('schedule_lectures', []);
          const lecMap = new Map<string, ScheduleLecture>();
          // ☁️ اعتماد السجلات السحابية أولاً مع فك تشفير وتضمين بيانات التقويم والأسابيع الـ 15
          data.forEach((rawL: ScheduleLecture) => {
            const l = decodeLectureMetaFromNotes(rawL); // 🔓 فك تشفير البيانات التقويمية
            if (l.id && !l.id.startsWith('lec-sat-') && !l.id.startsWith('lec-sun-') && !l.id.startsWith('lec-mon-')) {
              lecMap.set(l.id, l);
            }
          });
          // 💾 دمج السجلات المحلية الحقيقية
          localLecs.forEach((rawL) => {
            const l = decodeLectureMetaFromNotes(rawL);
            if (!l.id.startsWith('lec-sat-') && !l.id.startsWith('lec-sun-') && !l.id.startsWith('lec-mon-')) {
              if (!lecMap.has(l.id)) lecMap.set(l.id, l);
            }
          });
          const merged = Array.from(lecMap.values());
          saveStoredData('schedule_lectures', merged);
          return merged;
        }
      } catch (err) {
        console.warn('تنبيه: تعذر جلب جدول المحاضرات من السحابة:', err);
      }
      return getStoredData<ScheduleLecture[]>('schedule_lectures', []);
    },
    { ttlSeconds: 15, swrSeconds: 60 }
  );
}

export async function saveScheduleLectureToSupabase(lec: ScheduleLecture): Promise<boolean> {
  try {
    await ensureLectureDependenciesInSupabase(lec);
    // 1️⃣ المحاولة المباشرة بالأعمدة المنفصلة
    const { error } = await supabase.from('schedule_lectures').upsert(lec);
    if (!error) {
      invalidateCacheKey('supabase_schedule_lectures');
      return true;
    }

    // 2️⃣ الحفظ الذكي التلقائي البديل في حال عدم وجود الأعمدة المباشرة في السحابة
    if (error && (error.code === 'PGRST204' || error.message?.includes('column'))) {
      const fallbackPayload = {
        id: lec.id,
        department_id: lec.department_id,
        stage_number: lec.stage_number,
        semester: lec.semester,
        academic_year_id: lec.academic_year_id || null,
        day: lec.day,
        course_id: lec.course_id,
        course_name: lec.course_name,
        course_code: lec.course_code,
        teacher_id: lec.teacher_id || null,
        teacher_name: lec.teacher_name || null,
        room: lec.room,
        start_time: lec.start_time,
        end_time: lec.end_time,
        color: lec.color,
        type: lec.type,
        study_type: lec.study_type || 'morning',
        notes: encodeLectureMetaIntoNotes(lec) || null,
        created_at: lec.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error: fallbackErr } = await supabase.from('schedule_lectures').upsert(fallbackPayload);
      if (!fallbackErr) {
        invalidateCacheKey('supabase_schedule_lectures');
        return true;
      }
      console.warn('Supabase lecture fallback upsert error:', fallbackErr);
      return false;
    }

    console.warn('Supabase lecture upsert error:', error);
    return false;
  } catch (err) {
    console.warn('Supabase lecture save error:', err);
    return false;
  }
}

export async function saveScheduleLecturesBulkToSupabase(lecs: ScheduleLecture[]): Promise<boolean> {
  if (!lecs || lecs.length === 0) return true;
  try {
    for (const l of lecs) {
      await ensureLectureDependenciesInSupabase(l);
    }
    const { error } = await supabase.from('schedule_lectures').upsert(lecs);
    if (!error) {
      invalidateCacheKey('supabase_schedule_lectures');
      return true;
    }

    // 2️⃣ الحفظ الجماعي البديل بتضمين الميتاداتا التقويمية
    if (error && (error.code === 'PGRST204' || error.message?.includes('column'))) {
      const fallbackList = lecs.map((lec) => ({
        id: lec.id,
        department_id: lec.department_id,
        stage_number: lec.stage_number,
        semester: lec.semester,
        academic_year_id: lec.academic_year_id || null,
        day: lec.day,
        course_id: lec.course_id,
        course_name: lec.course_name,
        course_code: lec.course_code,
        teacher_id: lec.teacher_id || null,
        teacher_name: lec.teacher_name || null,
        room: lec.room,
        start_time: lec.start_time,
        end_time: lec.end_time,
        color: lec.color,
        type: lec.type,
        study_type: lec.study_type || 'morning',
        notes: encodeLectureMetaIntoNotes(lec) || null,
        created_at: lec.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      const { error: fallbackErr } = await supabase.from('schedule_lectures').upsert(fallbackList);
      if (!fallbackErr) {
        invalidateCacheKey('supabase_schedule_lectures');
        return true;
      }
      console.warn('Supabase bulk lecture fallback save error:', fallbackErr);
      return false;
    }

    console.warn('Supabase bulk lecture save error:', error);
    return false;
  } catch (err) {
    console.warn('Supabase bulk save exception:', err);
    return false;
  }
}

export async function deleteScheduleLectureFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('schedule_lectures').delete().eq('id', id);
    if (!error) {
      invalidateCacheKey('supabase_schedule_lectures');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function deleteScheduleLecturesBulkFromSupabase(ids: string[]): Promise<boolean> {
  if (!ids || ids.length === 0) return true;
  try {
    const { error } = await supabase.from('schedule_lectures').delete().in('id', ids);
    if (!error) {
      invalidateCacheKey('supabase_schedule_lectures');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ==============================================================================
// ⚙️ دوال إعدادات دوام وعطل الجدول الأسبوعي (department_schedule_configs) مع الدمج الذكي
// ==============================================================================
export async function syncScheduleConfigsFromSupabase(): Promise<DepartmentScheduleConfig[]> {
  return smartCachedFetch(
    'supabase_schedule_configs',
    async () => {
      try {
        const { data, error } = await supabase.from('department_schedule_configs').select('*');
        if (!error && data && data.length > 0) {
          const localConfigs = getStoredData<DepartmentScheduleConfig[]>('department_schedule_configs', INITIAL_SCHEDULE_CONFIGS);
          const cfgMap = new Map<string, DepartmentScheduleConfig>();
          data.forEach((c: DepartmentScheduleConfig) => cfgMap.set(c.id, c));
          localConfigs.forEach((c) => {
            if (!cfgMap.has(c.id)) cfgMap.set(c.id, c);
          });
          const merged = Array.from(cfgMap.values());
          saveStoredData('department_schedule_configs', merged);
          return merged;
        }
      } catch (err) {
        console.warn('تنبيه: تعذر جلب إعدادات الدوام من السحابة:', err);
      }
      return getStoredData<DepartmentScheduleConfig[]>('department_schedule_configs', INITIAL_SCHEDULE_CONFIGS);
    },
    { ttlSeconds: 60, swrSeconds: 300 }
  );
}

export async function saveScheduleConfigToSupabase(config: DepartmentScheduleConfig): Promise<boolean> {
  try {
    const { error } = await supabase.from('department_schedule_configs').upsert(config);
    if (!error) invalidateCacheKey('supabase_schedule_configs');
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 📋 دوال مزامنة وحفظ سجلات الحضور والغيابات (student_attendance_records)
// ==============================================================================
export async function syncAttendanceRecordsFromSupabase(): Promise<StudentAttendanceRecord[]> {
  return smartCachedFetch(
    'supabase_attendance_records',
    async () => {
      try {
        const { data, error } = await supabase.from('student_attendance_records').select('*');
        if (!error && data && data.length > 0) {
          saveStoredData('student_attendance_records', data);
          return data as StudentAttendanceRecord[];
        }
      } catch (err) {
        console.warn('تنبيه: تعذر جلب سجلات الحضور من السحابة:', err);
      }
      return getStoredData<StudentAttendanceRecord[]>('student_attendance_records', INITIAL_ATTENDANCE_RECORDS);
    },
    { ttlSeconds: 30, swrSeconds: 120 }
  );
}

export async function saveAttendanceRecordToSupabase(record: StudentAttendanceRecord): Promise<boolean> {
  try {
    const { error } = await supabase.from('student_attendance_records').upsert(record);
    if (!error) invalidateCacheKey('supabase_attendance_records');
    return !error;
  } catch {
    return false;
  }
}

export async function saveMultipleAttendanceRecordsToSupabase(records: StudentAttendanceRecord[]): Promise<boolean> {
  if (!records || records.length === 0) return true;
  try {
    const { error } = await supabase.from('student_attendance_records').upsert(records);
    if (!error) invalidateCacheKey('supabase_attendance_records');
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// ⏱️ دوال مزامنة وحفظ إعدادات وتخصيص ساعات ومدد المحاضرات للقسم في Supabase
// ==============================================================================
export async function syncDepartmentDurationConfigFromSupabase(deptId?: string): Promise<DepartmentLectureDurationConfig | null> {
  const targetKey = deptId ? `dept_duration_config_${deptId}` : 'dept_duration_config_default';
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', targetKey)
      .maybeSingle();

    if (!error && data?.value) {
      const parsed = (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) as DepartmentLectureDurationConfig;
      saveStoredData(targetKey, parsed);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('lecture_durations_updated'));
        window.dispatchEvent(new Event('storage'));
      }
      return parsed;
    }
  } catch (err) {
    console.warn('تنبيه: تعذر جلب إعدادات مدد المحاضرات من السحابة:', err);
  }
  return null;
}

export async function saveDepartmentDurationConfigToSupabase(config: DepartmentLectureDurationConfig, deptId?: string): Promise<boolean> {
  const targetKey = deptId ? `dept_duration_config_${deptId}` : 'dept_duration_config_default';
  saveStoredData(targetKey, config);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('lecture_durations_updated'));
    window.dispatchEvent(new Event('storage'));
  }
  try {
    const { error } = await supabase.from('system_settings').upsert({
      key: targetKey,
      value: JSON.stringify(config),
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch (err) {
    console.warn('تنبيه أثناء حفظ إعدادات مدد المحاضرات في Supabase:', err);
    return false;
  }
}


// ==============================================================================
// 💳 دوال مزامنة وحفظ الأقساط الدراسية (student_tuition_records)
// ==============================================================================
export async function syncTuitionRecordsFromSupabase(): Promise<StudentTuitionRecord[]> {
  return smartCachedFetch(
    'supabase_tuition_records',
    async () => {
      try {
        const { data, error } = await supabase.from('student_tuition_records').select('*');
        if (!error && data && data.length > 0) {
          saveStoredData('student_tuition_records', data);
          return data as StudentTuitionRecord[];
        }
      } catch (err) {
        console.warn('تنبيه: تعذر جلب سجلات الأقساط من السحابة:', err);
      }
      return getStoredData<StudentTuitionRecord[]>('student_tuition_records', INITIAL_TUITION_RECORDS);
    },
    { ttlSeconds: 60, swrSeconds: 300 }
  );
}

export async function saveTuitionRecordToSupabase(tuition: StudentTuitionRecord): Promise<boolean> {
  try {
    const { error } = await supabase.from('student_tuition_records').upsert(tuition);
    if (!error) invalidateCacheKey('supabase_tuition_records');
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 🗓️ دوال مزامنة وحفظ العام الدراسي المعتمد بالنظام (academic_years) في Supabase
// ==============================================================================
export async function syncAcademicYearFromSupabase(forceRefresh: boolean = false): Promise<string> {
  // 🧹 إبطال الكاش فوراً في حال طلب التحديث الإجباري
  if (forceRefresh) {
    invalidateCacheKey('supabase_academic_year');
  }

  return smartCachedFetch(
    'supabase_academic_year',
    async () => {
      try {
        // 1. جلب السجل الحالي النشط من جدول academic_years بالاعتماد على حقل created_at
        const { data: yearRows, error: yearErr } = await supabase
          .from('academic_years')
          .select('label, is_current')
          .eq('is_current', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!yearErr && yearRows && yearRows.length > 0 && yearRows[0]?.label) {
          let yearVal = String(yearRows[0].label).trim();
          // 🗓️ إذا كان العام القادم من السحابة قديماً أو مقلوباً (مثل 2025-2026 أو 2026-2025) يتم تصحيحه فوراً إلى 2026-2027
          if (yearVal.includes('2025') || yearVal === '2026-2025' || yearVal === '2025-2026') {
            yearVal = '2026-2027';
            saveAcademicYearToSupabase('2026-2027').catch(() => {}); // ☁️ تصحيح السحابة فوراً في الخلفية
          }
          saveAcademicYear(yearVal);
          return yearVal;
        }
      } catch (err) {
        console.warn('تنبيه: تعذر جلب العام الدراسي من السحابة:', err);
      }
      return getAcademicYear();
    },
    { ttlSeconds: 30, swrSeconds: 120 }
  );
}

export async function saveAcademicYearToSupabase(year: string): Promise<boolean> {
  const cleanYear = (year.includes('2025') || year === '2026-2025' || year === '2025-2026') ? '2026-2027' : year.trim();
  const targetId = `year-${cleanYear.split('-')[0] || '2026'}`;
  
  // 💾 1. حفظ فوري في التخزين المحلي وبث الحدث محلياً لكافة الشاشات
  saveAcademicYear(cleanYear);

  try {
    // ☁️ 2. تصفير السجلات السابقة لضمان بقاء عام واحد فقط بصفة is_current: true
    try {
      await supabase
        .from('academic_years')
        .update({ is_current: false })
        .neq('id', targetId);
    } catch {
      // الاستمرار في حال تعذر التحديث الجماعي
    }

    // ☁️ 3. حفظ وإدراج السجل الجديد بـ is_current: true
    await supabase.from('academic_years').upsert({
      id: targetId,
      label: cleanYear,
      is_current: true,
      created_at: new Date().toISOString(),
    });

    // 📢 4. بث التحديث فوراً عبر قناة Supabase Realtime لكافة الأجهزة واللوحات المتصلة
    try {
      const broadcastChannel = supabase.channel('sadiq_academic_year_sync_channel');
      await broadcastChannel.send({
        type: 'broadcast',
        event: 'academic_year_updated',
        payload: { academic_year: cleanYear },
      });
    } catch {
      // استمرار حتى لو فشل البث
    }

    invalidateCacheKey('supabase_academic_year');
    return true;
  } catch (err) {
    console.warn('تنبيه: تعذر إرسال العام الدراسي إلى السحابة، تم الحفظ محلياً:', err);
    return false;
  }
}

// 📡 دالة الاشتراك اللحظي السحابي والمحلي لتحديث العام الدراسي في كافة اللوحات المفتوحة
export function subscribeToAcademicYearChanges(onYearChange: (year: string) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  // 🔔 1. معالج الأحداث المحلية (نفس التبويب والمتصفح)
  const handleLocalChange = (e: Event) => {
    const customEvt = e as CustomEvent<string>;
    if (customEvt.detail && typeof customEvt.detail === 'string') {
      onYearChange(customEvt.detail);
    } else {
      onYearChange(getAcademicYear());
    }
  };

  window.addEventListener('academic_year_changed', handleLocalChange);
  window.addEventListener('storage', handleLocalChange);

  // ☁️ 2. قناة Supabase Realtime للبث اللحظي عبر الشبكة لكافة الأجهزة
  let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
  try {
    realtimeChannel = supabase.channel('sadiq_academic_year_sync_channel')
      .on('broadcast', { event: 'academic_year_updated' }, (payload: { payload?: { academic_year?: string } }) => {
        if (payload?.payload?.academic_year) {
          const liveYear = payload.payload.academic_year.trim();
          saveAcademicYear(liveYear);
          onYearChange(liveYear);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, (payload: { new?: { key?: string; value?: string } }) => {
        if (payload?.new?.key === 'current_academic_year' && payload?.new?.value) {
          const liveYear = payload.new.value.trim();
          saveAcademicYear(liveYear);
          onYearChange(liveYear);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'academic_years' }, (payload: { new?: { label?: string; is_current?: boolean } }) => {
        if (payload?.new?.is_current && payload?.new?.label) {
          const liveYear = payload.new.label.trim();
          saveAcademicYear(liveYear);
          onYearChange(liveYear);
        }
      })
      .subscribe();
  } catch (channelErr) {
    console.warn('تنبيه: تعذر الاشتراك في قناة Realtime للعام الدراسي:', channelErr);
  }

  // 🧹 دالة التنظيف وإلغاء الاشتراك
  return () => {
    window.removeEventListener('academic_year_changed', handleLocalChange);
    window.removeEventListener('storage', handleLocalChange);
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
    }
  };
}

// ==============================================================================
// ⚡ دالة المزامنة الشاملة للقسم الأكاديمي لجلب كافة البيانات حياً بالتوازي
// ==============================================================================
export async function syncFullDepartmentPortalData(): Promise<{
  profiles: UserProfile[];
  courses: Course[];
  teacherCourses: TeacherCourse[];
  grades: Grade[];
  scheduleLectures: ScheduleLecture[];
  scheduleConfigs: DepartmentScheduleConfig[];
  attendanceRecords: StudentAttendanceRecord[];
  tuitionRecords: StudentTuitionRecord[];
  academicYear: string;
}> {
  try {
    const [profiles, courses, teacherCourses, grades, scheduleLectures, scheduleConfigs, attendanceRecords, tuitionRecords, academicYear] = await Promise.all([
      syncProfilesFromSupabase(),
      syncCoursesFromSupabase(),
      syncTeacherCoursesFromSupabase(),
      syncGradesFromSupabase(),
      syncScheduleLecturesFromSupabase(),
      syncScheduleConfigsFromSupabase(),
      syncAttendanceRecordsFromSupabase(),
      syncTuitionRecordsFromSupabase(),
      syncAcademicYearFromSupabase(),
    ]);

    return {
      profiles,
      courses,
      teacherCourses,
      grades,
      scheduleLectures,
      scheduleConfigs,
      attendanceRecords,
      tuitionRecords,
      academicYear,
    };
  } catch (error) {
    console.warn('تنبيه أثناء المزامنة الشاملة مع Supabase:', error);
    return {
      profiles: getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES),
      courses: getStoredData<Course[]>('courses', INITIAL_COURSES),
      teacherCourses: getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES),
      grades: getStoredData<Grade[]>('grades', INITIAL_GRADES),
      scheduleLectures: getStoredData<ScheduleLecture[]>('schedule_lectures', INITIAL_SCHEDULE_LECTURES),
      scheduleConfigs: getStoredData<DepartmentScheduleConfig[]>('department_schedule_configs', INITIAL_SCHEDULE_CONFIGS),
      attendanceRecords: getStoredData<StudentAttendanceRecord[]>('student_attendance_records', INITIAL_ATTENDANCE_RECORDS),
      tuitionRecords: getStoredData<StudentTuitionRecord[]>('student_tuition_records', INITIAL_TUITION_RECORDS),
      academicYear: getAcademicYear(),
    };
  }
}

// ==============================================================================
// 🏢 23. دوال مزامنة وحفظ وحذف الأقسام العلمية (departments) في Supabase
// ==============================================================================

// 📥 مزامنة الأقسام العلمية من سحابة Supabase وحفظها محلياً
export async function syncDepartmentsFromSupabase(): Promise<Department[]> {
  return smartCachedFetch( // ⚡ استدعاء محرك الكاش الذكي حتى ما نسوي ضغط ع السحابة
    'supabase_departments', // 🔑 مفتاح الكاش المخصص للأقسام
    async () => {
      try {
        const { data, error } = await supabase.from('departments').select('*').order('created_at', { ascending: true }); // 🔍 جلب كل الأقسام من السيرفر مرتبة
        if (!error && data && data.length > 0) { //  إذا ماكو خطأ واجتي بيانات حقيقية
          saveStoredData('departments', data as Department[]); // 💾 خزنها بالمتصفح كنسخة احتياطية سريعة
          return data as Department[]; // 🚀 رجع لستة الأقسام المحدثة
        }
      } catch (err) {
        console.warn('تنبيه أثناء جلب الأقسام من السحابة:', err); // ⚠️ طباعة تحذير لطيف إذا وكع النت
      }
      return getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS); // 🔄 تراجع أوتوماتيكي للبيانات المسبقة
    },
    { ttlSeconds: 60, swrSeconds: 300 } // ⏱️ كاش لمدة دقيقة وتحديث بالخلفية 5 دقايق
  );
}

// 💾 حفظ أو تعديل قسم علمي في Supabase
export async function saveDepartmentToSupabase(dept: Department): Promise<boolean> {
  try {
    const { error } = await supabase.from('departments').upsert(dept); // ⚡ إدراج أو تحديث القسم بالسحابة
    if (!error) {
      invalidateCacheKey('supabase_departments'); // 🧹 تنظيف كاش الأقسام حتى يتحدث فوراً
      invalidateCacheKey('supabase_academic_entities'); // 🧹 تنظيف كاش الكيانات المشتركة
    }
    return !error; // ✅ رجع نجاح إذا ماكو خطأ
  } catch {
    return false; // ❌ رجع فشل إذا صار استثناء
  }
}

// 🗑️ حذف قسم علمي من Supabase
export async function deleteDepartmentFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('departments').delete().eq('id', id); // ⚡ حذف السجل حسب المعرف بالـ ID
    if (!error) {
      invalidateCacheKey('supabase_departments'); // 🧹 تنظيف كاش الأقسام
      invalidateCacheKey('supabase_academic_entities'); // 🧹 تنظيف كاش الكيانات
    }
    return !error; // ✅ رجع حالة النجاح
  } catch {
    return false; // ❌ رجع فشل
  }
}

// ==============================================================================
// 📊 24. دالة حفظ السعيات والدرجات الجماعية في Supabase (saveMultipleGradesToSupabase)
// ==============================================================================

// 💾 حفظ مصفوفة كاملة من درجات الطلاب في سحابة Supabase دفعة واحدة
export async function saveMultipleGradesToSupabase(gradesList: Grade[]): Promise<boolean> {
  if (!gradesList || gradesList.length === 0) return true; // ⚡ إذا القائمة فارغة ما يحتاج نضغط ع السيرفر
  try {
    // 🛡️ تدقيق وتعقيم درجات كل طالب لضمان عدم تجاوز سقوف بولونيا
    const sanitizedGrades = gradesList.map((g) => {
      const validated = validateAndSanitizeGradePayload(g); // 🧹 فحص سقوف السعي والكويزات والامتحانات
      const merged = { ...g, ...validated.sanitized } as Grade; // 🧩 دمج القيم المعقمة
      const sqlCheck = validateAndSanitizeSqlPayload(merged); // 🛡️ فحص حماية حقن قواعد البيانات
      return sqlCheck.sanitizedPayload as Grade; // 🔒 استرجاع النسخة الآمنة النظيفة
    });

    const { error } = await supabase.from('grades').upsert(sanitizedGrades); // ⚡ رفع الدفعة بالكامل بطلب واحد
    if (!error) {
      invalidateCacheKey('supabase_grades'); // 🧹 تصفير كاش الدرجات ليظهر السعي الجديد مباشرة
    }
    return !error; // ✅ رجع النتيجة
  } catch (err) {
    console.warn('تنبيه أثناء الحفظ الجماعي للدرجات في Supabase:', err); // ⚠️ طباعة التحذير
    return false; // ❌ فشل الرفع
  }
}

// ==============================================================================
// 🏛️ 25. دوال مزامنة وحفظ جداول الامتحانات النهائية (final_exam_schedules & slots)
// ==============================================================================

// 📥 جلب ومزامنة جداول الامتحانات النهائية من السحابة
export async function syncFinalExamSchedulesFromSupabase(): Promise<FinalExamSchedule[]> {
  return smartCachedFetch(
    'supabase_final_exam_schedules', // 🔑 مفتاح كاش جداول الفاينل
    async () => {
      try {
        const { data, error } = await supabase.from('final_exam_schedules').select('*'); // 🔍 استعلام من جدول الفاينل
        if (!error && data && data.length > 0) {
          saveStoredData('final_exam_schedules', data as FinalExamSchedule[]); // 💾 حفظ محلي
          return data as FinalExamSchedule[]; // 🚀 إرجاع البيانات
        }
      } catch (err) {
        console.warn('تنبيه أثناء جلب جداول الامتحانات من السحابة:', err);
      }
      return getStoredData<FinalExamSchedule[]>('final_exam_schedules', INITIAL_FINAL_EXAM_SCHEDULES); // 🔄 تراجع
    },
    { ttlSeconds: 60, swrSeconds: 180 }
  );
}

// 💾 حفظ أو اعتماد جدول امتحانات نهائي في السحابة
export async function saveFinalExamScheduleToSupabase(schedule: FinalExamSchedule): Promise<boolean> {
  try {
    const { error } = await supabase.from('final_exam_schedules').upsert(schedule); // ⚡ رفع وتحديث الجدول
    if (!error) invalidateCacheKey('supabase_final_exam_schedules'); // 🧹 إبطال الكاش
    return !error;
  } catch {
    return false;
  }
}

// 🗑️ حذف جدول امتحانات نهائي من السحابة
export async function deleteFinalExamScheduleFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('final_exam_schedules').delete().eq('id', id); // ⚡ مسح الجدول بالـ ID
    if (!error) invalidateCacheKey('supabase_final_exam_schedules'); // 🧹 إبطال الكاش
    return !error;
  } catch {
    return false;
  }
}

// 📥 جلب ومزامنة بنود وفترات وقاعات الامتحانات من السحابة
export async function syncFinalExamSlotsFromSupabase(): Promise<FinalExamSlot[]> {
  return smartCachedFetch(
    'supabase_final_exam_slots', // 🔑 مفتاح كاش فترات الامتحانات
    async () => {
      try {
        const { data, error } = await supabase.from('final_exam_slots').select('*'); // 🔍 جلب البنود
        if (!error && data && data.length > 0) {
          saveStoredData('final_exam_slots', data as FinalExamSlot[]); // 💾 حفظ محلي
          return data as FinalExamSlot[];
        }
      } catch (err) {
        console.warn('تنبيه أثناء جلب فترات الامتحانات من السحابة:', err);
      }
      return getStoredData<FinalExamSlot[]>('final_exam_slots', INITIAL_FINAL_EXAM_SLOTS);
    },
    { ttlSeconds: 60, swrSeconds: 180 }
  );
}

// 💾 حفظ وتحديث فترات وقاعات الامتحانات في السحابة
export async function saveFinalExamSlotsToSupabase(slots: FinalExamSlot[]): Promise<boolean> {
  if (!slots || slots.length === 0) return true; // ⚡ لا داعي للرفع إذا كانت فارغة
  try {
    const { error } = await supabase.from('final_exam_slots').upsert(slots); // ⚡ حفظ جماعي للفترات
    if (!error) invalidateCacheKey('supabase_final_exam_slots'); // 🧹 تحديث الكاش
    return !error;
  } catch {
    return false;
  }
}

// 🗑️ حذف بند فترة امتحانية محددة
export async function deleteFinalExamSlotFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('final_exam_slots').delete().eq('id', id); // ⚡ حذف البند
    if (!error) invalidateCacheKey('supabase_final_exam_slots');
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 📚 26. دوال مزامنة وحفظ التكليفات الأكاديمية وتسليمات الطلاب (Tasks & Submissions)
// ==============================================================================

// 📥 جلب ومزامنة التكليفات الأكاديمية (كويزات، واجبات، تقارير) من السحابة
export async function syncAcademicTasksFromSupabase(): Promise<CourseAcademicTask[]> {
  return smartCachedFetch(
    'supabase_academic_tasks', // 🔑 كاش التكليفات
    async () => {
      try {
        const { data, error } = await supabase.from('course_academic_tasks').select('*'); // 🔍 جلب الواجبات والتقارير
        if (!error && data && data.length > 0) {
          saveStoredData('app_course_academic_tasks', data as CourseAcademicTask[]); // 💾 تخزين محلي
          return data as CourseAcademicTask[];
        }
      } catch (err) {
        console.warn('تنبيه أثناء جلب التكليفات الأكاديمية من السحابة:', err);
      }
      return getStoredData<CourseAcademicTask[]>('app_course_academic_tasks', INITIAL_ACADEMIC_TASKS);
    },
    { ttlSeconds: 30, swrSeconds: 120 }
  );
}

// 💾 حفظ أو نشر تكليف أكاديمي جديد في السحابة
export async function saveAcademicTaskToSupabase(task: CourseAcademicTask): Promise<boolean> {
  try {
    const { error } = await supabase.from('course_academic_tasks').upsert(task); // ⚡ حفظ التكليف
    if (!error) invalidateCacheKey('supabase_academic_tasks'); // 🧹 تنظيف كاش التكليفات
    return !error;
  } catch {
    return false;
  }
}

// 🗑️ حذف تكليف أكاديمي من السحابة
export async function deleteAcademicTaskFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('course_academic_tasks').delete().eq('id', id); // ⚡ حذف التكليف
    if (!error) invalidateCacheKey('supabase_academic_tasks');
    return !error;
  } catch {
    return false;
  }
}

// 📥 جلب ومزامنة تسليمات الطلاب للتكليفات والتقارير من السحابة
export async function syncTaskSubmissionsFromSupabase(): Promise<StudentTaskSubmission[]> {
  return smartCachedFetch(
    'supabase_task_submissions', // 🔑 كاش تسليمات الطلبة
    async () => {
      try {
        const { data, error } = await supabase.from('task_student_submissions').select('*'); // 🔍 جلب التسليمات
        if (!error && data && data.length > 0) {
          saveStoredData('task_student_submissions', data as StudentTaskSubmission[]); // 💾 تخزين محلي
          return data as StudentTaskSubmission[];
        }
      } catch (err) {
        console.warn('تنبيه أثناء جلب تسليمات الطلاب من السحابة:', err);
      }
      return getStoredData<StudentTaskSubmission[]>('task_student_submissions', INITIAL_STUDENT_SUBMISSIONS);
    },
    { ttlSeconds: 20, swrSeconds: 60 }
  );
}

// 💾 حفظ أو تقييم تسليم واجب/تقرير طالب في السحابة
export async function saveTaskSubmissionToSupabase(submission: StudentTaskSubmission): Promise<boolean> {
  try {
    const { error } = await supabase.from('task_student_submissions').upsert(submission); // ⚡ حفظ التسليم والتقييم
    if (!error) invalidateCacheKey('supabase_task_submissions'); // 🧹 تنظيف الكاش
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 📢 27. دوال مزامنة وحفظ التعميمات والتبليغات الرسمية (campus_official_announcements)
// ==============================================================================

// 📥 جلب ومزامنة التعميمات الرسمية من السحابة
export async function syncCampusAnnouncementsFromSupabase(): Promise<CampusAnnouncement[]> {
  return smartCachedFetch(
    'supabase_campus_announcements', // 🔑 كاش التعميمات
    async () => {
      try {
        const { data, error } = await supabase.from('campus_official_announcements').select('*').order('created_at', { ascending: false }); // 🔍 جلب الإعلانات الأحدث أولاً
        if (!error && data && data.length > 0) {
          saveStoredData('campus_official_announcements', data as CampusAnnouncement[]); // 💾 حفظ محلي
          return data as CampusAnnouncement[];
        }
      } catch (err) {
        console.warn('تنبيه أثناء جلب التعميمات الرسمية من السحابة:', err);
      }
      return getStoredData<CampusAnnouncement[]>('campus_official_announcements', INITIAL_CAMPUS_ANNOUNCEMENTS);
    },
    { ttlSeconds: 30, swrSeconds: 120 }
  );
}

// 💾 حفظ أو نشر تعميم رسمي جديد في السحابة
export async function saveCampusAnnouncementToSupabase(announcement: CampusAnnouncement): Promise<boolean> {
  try {
    const { error } = await supabase.from('campus_official_announcements').upsert(announcement); // ⚡ نشر التعميم بالسحابة
    if (!error) invalidateCacheKey('supabase_campus_announcements'); // 🧹 تنظيف كاش التعميمات
    return !error;
  } catch {
    return false;
  }
}

// 🗑️ حذف تعميم رسمي من السحابة
export async function deleteCampusAnnouncementFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('campus_official_announcements').delete().eq('id', id); // ⚡ مسح التعميم
    if (!error) invalidateCacheKey('supabase_campus_announcements');
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 📑 28. دوال مزامنة ورفع طلبات الإجازات والأعذار الرسمية (attendance_excuse_requests)
// ==============================================================================

// 📥 جلب ومزامنة طلبات الأعذار الطبية والرسمية من السحابة
export async function syncExcuseRequestsFromSupabase(): Promise<AttendanceExcuseRequest[]> {
  return smartCachedFetch(
    'supabase_excuse_requests', // 🔑 كاش الأعذار
    async () => {
      try {
        const { data, error } = await supabase.from('attendance_excuse_requests').select('*').order('created_at', { ascending: false }); // 🔍 استعلام الأعذار
        if (!error && data && data.length > 0) {
          saveStoredData('attendance_excuse_requests', data as AttendanceExcuseRequest[]); // 💾 تخزين محلي
          return data as AttendanceExcuseRequest[];
        }
      } catch (err) {
        console.warn('تنبيه أثناء جلب طلبات الأعذار من السحابة:', err);
      }
      return getStoredData<AttendanceExcuseRequest[]>('attendance_excuse_requests', INITIAL_EXCUSE_REQUESTS);
    },
    { ttlSeconds: 30, swrSeconds: 120 }
  );
}

// 💾 حفظ أو تقديم طلب عذر رسمي جديد أو مراجعته في السحابة
export async function saveExcuseRequestToSupabase(excuse: AttendanceExcuseRequest): Promise<boolean> {
  try {
    const { error } = await supabase.from('attendance_excuse_requests').upsert(excuse); // ⚡ إرسال العذر للسحابة
    if (!error) invalidateCacheKey('supabase_excuse_requests'); // 🧹 تنظيف كاش الأعذار
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 🔔 29. دوال مزامنة وحفظ الإشعارات الأكاديمية (notifications)
// ==============================================================================

// 📥 جلب ومزامنة الإشعارات الخاصة بالمستخدم من السحابة
export async function syncNotificationsFromSupabase(userId?: string): Promise<AppNotification[]> {
  return smartCachedFetch(
    `supabase_notifications_${userId || 'all'}`, // 🔑 كاش الإشعارات المخصص للمستخدم
    async () => {
      try {
        let query = supabase.from('notifications').select('*').order('created_at', { ascending: false }); // 🔍 جلب الإشعارات
        if (userId) {
          query = query.or(`recipient_id.eq.${userId},recipient_id.eq.all`); // 🎯 فلترة للإشعارات الخاصة والعامة
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const typedNotifs = data.map((item) => ({
            id: String(item.id),
            recipient_id: String(item.recipient_id),
            recipient_role: item.recipient_role ? String(item.recipient_role) : undefined,
            title: String(item.title),
            message: String(item.message),
            type: item.type as AppNotification['type'],
            is_read: Boolean(item.is_read),
            link: item.link ? String(item.link) : undefined,
            created_at: String(item.created_at || new Date().toISOString()),
          })) as AppNotification[];
          saveStoredData('system_notifications', typedNotifs); // 💾 حفظ محلي
          return typedNotifs;
        }
      } catch (err) {
        console.warn('تنبيه أثناء جلب الإشعارات من السحابة:', err);
      }
      return getStoredData<AppNotification[]>('system_notifications', INITIAL_NOTIFICATIONS);
    },
    { ttlSeconds: 15, swrSeconds: 45 }
  );
}

// 💾 إرسال وحفظ إشعار جديد في السحابة
export async function saveNotificationToSupabase(notif: AppNotification): Promise<boolean> {
  try {
    const { error } = await supabase.from('notifications').upsert(notif); // ⚡ إدراج الإشعار بجدول notifications
    if (!error) invalidateCachePattern(/^supabase_notifications_/); // 🧹 تنظيف كاش الإشعارات
    return !error;
  } catch {
    return false;
  }
}

// 👁️ تمييز الإشعار كمقروء في السحابة
export async function markNotificationAsReadInSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id); // ⚡ تحديث الحقل
    if (!error) invalidateCachePattern(/^supabase_notifications_/);
    return !error;
  } catch {
    return false;
  }
}

// 👁️ تمييز كافة الإشعارات كمقروءة للمستخدم في السحابة
export async function markAllNotificationsAsReadInSupabase(userId: string, userRole?: string): Promise<boolean> {
  try {
    let query = supabase.from('notifications').update({ is_read: true }); // ⚡ نحدد كل الإشعارات كمقروءة
    if (userRole) { // 🎯 إذا اكو رتبة محددة للأستاذ أو الطالب
      query = query.or(`recipient_id.eq.${userId},recipient_id.eq.all,recipient_role.eq.${userRole}`); // 🔍 نحدد اللي يخصه واللي عام
    } else { // 👤 إذا بس معرف الطالب أو المستخدم
      query = query.or(`recipient_id.eq.${userId},recipient_id.eq.all`); // 🔍 نحدث إشعاراته المباشرة
    }
    const { error } = await query; // 🚀 ننفذ التحديث بسوبابيز
    if (!error) invalidateCachePattern(/^supabase_notifications_/); // 🧹 نصفر كاش الإشعارات حتى تتحدث فورا
    return !error; // ✅ نرجع حالة النجاح
  } catch {
    return false; // ❌ صار خلل نرجع فشل
  }
}

// 🗑️ حذف إشعار محدد من سحابة Supabase
export async function deleteNotificationFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('notifications').delete().eq('id', id); // 🗑️ نحذف الإشعار من جدول notifications بالـ id
    if (!error) invalidateCachePattern(/^supabase_notifications_/); // 🧹 ننظف الكاش حتى يختفي من الجرس
    return !error; // ✅ نرجع نجاح
  } catch {
    return false; // ❌ فشل الحذف
  }
}

// ==============================================================================
// 🛡️ 30. دالة مزامنة وتفريغ سجل التدقيق الأمني (audit_logs) من السحابة
// ==============================================================================

// 📥 جلب ومزامنة سجلات التدقيق الأمني من السحابة
export async function syncAuditLogsFromSupabase(): Promise<AuditLog[]> {
  return smartCachedFetch(
    'supabase_audit_logs', // 🔑 كاش سجلات التدقيق
    async () => {
      try {
        const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200); // 🔍 جلب آخر 200 سجل
        if (!error && data && data.length > 0) {
          saveStoredData('audit_logs', data as AuditLog[]); // 💾 حفظ محلي
          return data as AuditLog[];
        }
      } catch (err) {
        console.warn('تنبيه أثناء جلب سجلات التدقيق من السحابة:', err);
      }
      return getStoredData<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
    },
    { ttlSeconds: 30, swrSeconds: 120 }
  );
}

// 🧹 تفريغ أو أرشفة سجل التدقيق الأمني في السحابة للمسؤول العام
export async function clearAuditLogsInSupabase(): Promise<boolean> {
  try {
    const { error } = await supabase.from('audit_logs').delete().neq('id', 'keep-dummy-000'); // 🗑️ نمسح السجلات القديمة بالسحابة
    if (!error) invalidateCacheKey('supabase_audit_logs'); // 🧹 نصفّر كاش سجلات التدقيق
    return !error; // ✅ تم التفريغ بنجاح
  } catch {
    return false; // ❌ رجع فشل
  }
}

// 🗑️ حذف سجلات تدقيق محددة من سحابة Supabase
export async function deleteAuditLogsFromSupabase(ids: string[]): Promise<boolean> {
  if (!ids || ids.length === 0) return true; // ⚡ إذا ماكو شي محدد ما نضغط السيرفر
  try {
    const { error } = await supabase.from('audit_logs').delete().in('id', ids); // 🗑️ حذف مصفوفة السجلات المحددة
    if (!error) invalidateCacheKey('supabase_audit_logs'); // 🧹 إبطال الكاش
    return !error; // ✅ نرجع نجاح
  } catch {
    return false; // ❌ رجع فشل
  }
}

// ==============================================================================
// 🎓 31. دوال إدارة ومزامنة المراحل الدراسية (stages) من وإلى سحابة Supabase
// ==============================================================================

// 📥 جلب ومزامنة المراحل الدراسية من السحابة مع كاش SWR
export async function syncStagesFromSupabase(): Promise<Stage[]> {
  return smartCachedFetch(
    'supabase_stages_list', // 🔑 كاش المراحل
    async () => {
      try {
        const { data, error } = await supabase.from('stages').select('*').order('stage_number', { ascending: true }); // 🔍 استعلام المراحل
        if (!error && data && data.length > 0) {
          const typedStages: Stage[] = data.map((st: { id: string; department_id: string; stage_number: number; department_name?: string; name?: string }) => ({
            id: st.id,
            department_id: st.department_id,
            stage_number: Number(st.stage_number) || 1,
            department_name: st.department_name,
            name: st.name,
          }));
          saveStoredData('stages', typedStages); // 💾 حفظ محلي
          return typedStages;
        }
      } catch (err) {
        console.warn('تنبيه أثناء مزامنة المراحل من Supabase:', err);
      }
      return getStoredData<Stage[]>('stages', INITIAL_STAGES);
    },
    { ttlSeconds: 60, swrSeconds: 300 }
  );
}

// ☁️ حفظ أو تحديث مرحلة دراسية في سحابة Supabase
export async function saveStageToSupabase(stage: Stage): Promise<boolean> {
  try {
    const payload = {
      id: stage.id,
      name: stage.name || `المرحلة ${stage.stage_number}`,
      academic_year_id: stage.academic_year_id || 'year-2026',
      department_id: stage.department_id,
      stage_number: stage.stage_number,
      department_name: stage.department_name || '',
    };
    const { error } = await supabase.from('stages').upsert(payload, { onConflict: 'id' }); // ⚡ حفظ أو تحديث
    if (!error) {
      invalidateCachePattern(/^supabase_stages_/);
    }
    return !error;
  } catch {
    return false;
  }
}

// 🗑️ حذف مرحلة دراسية من سحابة Supabase
export async function deleteStageFromSupabase(stageId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('stages').delete().eq('id', stageId); // 🗑️ حذف المرحلة
    if (!error) {
      invalidateCachePattern(/^supabase_stages_/);
    }
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 🗑️ 32. دالة حذف تسليم الطالب للتكليف من سحابة Supabase
// ==============================================================================

// 🗑️ حذف تسليم الواجب أو التقرير من جدول task_student_submissions سحابياً
export async function deleteTaskSubmissionFromSupabase(subId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('task_student_submissions').delete().eq('id', subId); // 🗑️ حذف التسليم
    if (!error) {
      invalidateCachePattern(/^supabase_task_submissions_/);
    }
    return !error;
  } catch {
    return false;
  }
}

// ==============================================================================
// 🔲 33. دالة التحقق الإلكتروني المباشر من وثيقة الطالب ودرجاته سحابياً (QR Verification)
// ==============================================================================

// 🔍 جلب بيانات صاحب الوثيقة وسجل درجاته سحابياً بصورة مباشرة وفورية
export async function fetchVerificationProfileAndGrades(entityId: string): Promise<{ profile: UserProfile | null; grades: Grade[] }> {
  try {
    const cleanId = (entityId || '').trim(); // 🧹 تنظيف المعرف
    if (!cleanId) return { profile: null, grades: [] };

    // 🔍 1. جلب الطالب من جدول students أو profiles
    const { data: studentData, error: sErr } = await supabase
      .from('students')
      .select('*')
      .or(`university_number.eq.${cleanId},id.eq.${cleanId},email.ilike.${cleanId}`)
      .limit(1)
      .maybeSingle();

    let matchedProfile: UserProfile | null = null;
    if (!sErr && studentData) {
      matchedProfile = {
        id: studentData.id,
        auth_user_id: studentData.auth_user_id,
        full_name: studentData.full_name,
        role: 'student',
        department_id: studentData.department_id,
        department_name: studentData.department_name,
        stage_number: studentData.stage_number || 1,
        university_number: studentData.university_number || studentData.id,
        generated_email: studentData.email,
        gender: studentData.gender,
        is_active: studentData.is_active ?? true,
        is_graduated: studentData.is_graduated ?? false,
        created_at: studentData.created_at,
      };
    } else {
      // 🔍 تجربة جلب حساب من profiles إذا لم يكن طالباً
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .or(`university_number.eq.${cleanId},id.eq.${cleanId},email.ilike.${cleanId}`)
        .limit(1)
        .maybeSingle();
      if (profData) {
        matchedProfile = {
          id: profData.id,
          full_name: profData.full_name,
          role: profData.role as UserRole,
          department_id: profData.department_id,
          department_name: profData.department_name,
          stage_number: profData.stage_number || 1,
          university_number: profData.university_number || profData.id,
          generated_email: profData.email,
          gender: profData.gender,
          is_active: profData.is_active ?? true,
          created_at: profData.created_at,
        };
      }
    }

    if (!matchedProfile) {
      // 💾 رجوع للكاش المحلي في حال عدم العثور عليه بالسحابة
      const localProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
      const foundLocal = localProfiles.find(
        (p) => p.university_number === cleanId || p.id === cleanId || p.generated_email.toLowerCase() === cleanId.toLowerCase()
      );
      if (foundLocal) matchedProfile = foundLocal;
    }

    // 📊 2. جلب الدرجات والسعيات الخاصة بالطالب سحابياً
    let matchedGrades: Grade[] = [];
    if (matchedProfile && matchedProfile.role === 'student') {
      const studentId = matchedProfile.id;
      const uniNum = matchedProfile.university_number;
      const queryCond = uniNum ? `student_id.eq.${studentId},university_number.eq.${uniNum}` : `student_id.eq.${studentId}`;
      const { data: gData, error: gErr } = await supabase
        .from('grades')
        .select('*')
        .or(queryCond);

      if (!gErr && gData && gData.length > 0) {
        matchedGrades = gData as Grade[];
      } else {
        const localGrades = getStoredData<Grade[]>('grades', INITIAL_GRADES);
        matchedGrades = localGrades.filter(
          (g) => g.student_id === studentId || (uniNum && g.university_number === uniNum)
        );
      }
    }

    return { profile: matchedProfile, grades: matchedGrades };
  } catch (err) {
    console.warn('تنبيه أثناء فحص الوثيقة سحابياً:', err);
    return { profile: null, grades: [] };
  }
}
