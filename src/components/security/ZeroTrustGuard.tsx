'use client'; // ⚡ ينفذ بالعميل في المتصفح

// 🛡️ حارس المسارات الميكروية وتفويض الصلاحيات الصارم (Zero Trust Route & Scope Guard)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا

import { useEffect, useState, ReactNode } from 'react'; // 🔗 خطافات رياكت
import { useRouter } from 'next/navigation'; // 🛣️ موجه الصفحات
import { verifyZeroTrustSession, purgeZeroTrustSession } from '@/lib/security/zero-trust-token'; // 🔐 التحقق من التوكن
import { validateDepartmentScope, validateCourseTeacherScope } from '@/lib/security/zero-trust-abac'; // 🎛️ محرك ABAC
import { validateSafeInternalRedirect } from '@/lib/security/url-guard'; // 🛡️ حارس الروابط وإعادة التوجيه
import { logSecurityEvent } from '@/lib/security/audit-guardian'; // 📊 تسجيل الأحداث
import { UserRole, UserProfile, Course, TeacherCourse } from '@/types'; // 🔗 الأنواع الصريحة
import { getStoredData, INITIAL_COURSES, INITIAL_TEACHER_COURSES } from '@/lib/mock-data'; // 💾 البيانات
import { ShieldAlert, ShieldCheck, Lock, GraduationCap } from 'lucide-react'; // 🎨 الأيقونات SVG
import { getArabicRoleLabel } from '@/lib/date-utils'; // 🎓 ترجمة الأدوار الأكاديمية للعربية الرسمية

// 🛡️ واجهة خصائص مكون حارس المسار
export interface ZeroTrustGuardProps {
  children: ReactNode;               // 📦 محتوى الصفحة المحمية
  allowedRoles: UserRole[];          // 🎭 الأدوار المسموح لها حصراً بالدخول
  requiredDepartmentId?: string;     // 🏢 قصر الوصول على قسم محدد (اختياري)
  requiredCourseId?: string;         // 📘 قصر الوصول على مادة محددة للأستاذ (اختياري)
  redirectFallback?: string;         // 🛣️ مسار الإعادة عند فشل التحقق (افتراضي '/')
}

export default function ZeroTrustGuard({
  children,
  allowedRoles,
  requiredDepartmentId,
  requiredCourseId,
  redirectFallback,
}: ZeroTrustGuardProps) {
  const router = useRouter(); // 🛣️ موجه المسارات

  // ⚡ منع أخطاء الـ Hydration والتطابق التام بين السيرفر والعميل
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [securityReason, setSecurityReason] = useState<string>(''); // ⚠️ سبب المنع الأمني

  useEffect(() => {
    setIsMounted(true);

    // 🔍 1. تدقيق التوكن المشفر وصحة الجلسة
    const sessionCheck = verifyZeroTrustSession();

    if (!sessionCheck.isValid || !sessionCheck.user) {
      // 🛑 في حال عدم وجود جلسة صالحة أو انتهاء صلاحيتها
      setIsAuthorized(false);
      setSecurityReason(sessionCheck.reason || 'جلسة الدخول غير صالحة أو منتهية.');
      
      // 📊 تسجيل محاولة وصول غير مصرح بها
      logSecurityEvent({
        eventType: 'UNAUTHORIZED_ROUTE_ACCESS',
        details: `محاولة وصول غير مصرح بها إلى مسار محمي (${typeof window !== 'undefined' ? window.location.pathname : 'مسار'}) بدون جلسة صالحة.`,
        severity: 'MEDIUM',
      });

      // 🔄 إعادة التوجيه الفوري للبوابة المناسبة بعد التحقق الأمني من الرابط
      const defaultTarget = 
        allowedRoles.includes('super_admin') || allowedRoles.includes('admin') ? '/sadmin' :
        allowedRoles.includes('department_head') || allowedRoles.includes('rapporteur') ? '/admin' :
        allowedRoles.includes('teacher') ? '/teacher' :
        allowedRoles.includes('student') ? '/student' :
        '/';
      const safeTargetUrl = validateSafeInternalRedirect(redirectFallback, defaultTarget);

      const timer = setTimeout(() => {
        router.replace(safeTargetUrl);
      }, 1000);

      return () => clearTimeout(timer);
    }

    const user = sessionCheck.user;

    // 🛑 2. تدقيق الدور الأكاديمي المسموح به (Role-Based Access Control)
    if (!allowedRoles.includes(user.role)) {
      const userRoleLabel = getArabicRoleLabel(user.role);
      const allowedRolesLabels = allowedRoles.map((r) => getArabicRoleLabel(r)).join('، ');

      setIsAuthorized(false);
      setSecurityReason(`عذراً! دورك الأكاديمي الحالي (${userRoleLabel}) لا يمتلك الصلاحية لدخول هذه الصفحة المحمية.`);

      // 📊 تسجيل محاولة تصعيد صلاحيات (Privilege Escalation Attempt)
      logSecurityEvent({
        eventType: 'UNAUTHORIZED_ROUTE_ACCESS',
        actorId: user.id,
        actorName: user.full_name,
        actorRole: user.role,
        actorEmail: user.generated_email,
        details: `تم منع المستخدم (${user.full_name}) من دخول مسار يتطلب أدوار: [${allowedRolesLabels}]`,
        severity: 'HIGH',
      });

      // 🔄 توجيه لبوابة المستخدم الصحيحة
      const targetUrl = 
        user.role === 'super_admin' || user.role === 'admin' ? '/sadmin/dashboard' :
        user.role === 'department_head' || user.role === 'rapporteur' ? '/admin/dashboard' :
        user.role === 'teacher' ? '/teacher/dashboard' :
        '/student/dashboard';

      const timer = setTimeout(() => {
        router.replace(targetUrl);
      }, 1200);

      return () => clearTimeout(timer);
    }

    // 🛑 3. تدقيق نطاق القسم العلمي (Department-Scope Isolation)
    if (requiredDepartmentId) {
      const deptCheck = validateDepartmentScope(user, requiredDepartmentId);
      if (!deptCheck.allowed) {
        setIsAuthorized(false);
        setSecurityReason(deptCheck.reason || 'ليس لديك إذن للوصول لبيانات هذا القسم العلمي.');
        
        const timer = setTimeout(() => {
          router.replace('/admin/department-portal');
        }, 1200);

        return () => clearTimeout(timer);
      }
    }

    // 🛑 4. تدقيق نطاق المادة المكلفة للتدريسي (Course-Scope Assignment Check)
    if (requiredCourseId && user.role === 'teacher') {
      const courses = getStoredData<Course[]>('courses', INITIAL_COURSES);
      const teacherCourses = getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES);
      const courseCheck = validateCourseTeacherScope(user, requiredCourseId, courses, teacherCourses);
      
      if (!courseCheck.allowed) {
        setIsAuthorized(false);
        setSecurityReason(courseCheck.reason || 'لست الأستاذ المكلف بتدريس هذه المادة.');

        const timer = setTimeout(() => {
          router.replace('/teacher/dashboard');
        }, 1200);

        return () => clearTimeout(timer);
      }
    }

    // ✅ تم التحقق بنجاح تام وفق معايير الحماية
    setIsAuthorized(true);
  }, [allowedRoles, requiredDepartmentId, requiredCourseId, redirectFallback, router]);

  // ⏳ شاشة التحقق الأمني الاحترافية الفاتحة المتطابقة كلياً بين السيرفر والعميل (Zero Hydration Mismatch)
  if (!isMounted || isAuthorized === null) {
    return (
      <div 
        className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans select-none relative overflow-hidden" 
        dir="rtl"
      >
        {/* توهج أزرق سماوي خفيف وناعم في الخلفية */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />

        {/* الكارد الأبيض الفاخر */}
        <div className="relative bg-white border-2 border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl max-w-md w-full text-center space-y-6 animate-in fade-in duration-200">
          
          {/* أيقونة الدرع الأكاديمي الكحلي الملكي */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-100 rounded-3xl animate-ping opacity-50" />
            <div className="relative w-20 h-20 bg-[#0F2942] border-2 border-slate-700 rounded-3xl flex items-center justify-center shadow-lg shadow-slate-900/20">
              <ShieldCheck className="w-10 h-10 text-white" strokeWidth={2.2} />
            </div>
          </div>

          {/* النصوص التعريفية الرسمية باللغة العربية الصافية 100% */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-slate-100 border-2 border-slate-400 rounded-full text-xs font-black text-black">
              <GraduationCap className="w-4 h-4 text-black" />
              <span>جامعة الإمام جعفر الصادق (ع)</span>
            </div>
            
            <h3 className="text-xl sm:text-2xl font-black text-black tracking-tight">
              جاري فحص وتأكيد الصلاحيات
            </h3>
            
            <p className="text-xs sm:text-sm font-black text-black">
              التحقق من الهوية الرقمية والتوثيق الأمني المشفر
            </p>
          </div>

          {/* شريط التقدم الأزرق الكحلي المتحرك بسلاسة */}
          <div className="space-y-2 pt-1">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-300">
              <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-emerald-600 h-full rounded-full w-full animate-pulse" />
            </div>
            <div className="flex items-center justify-between text-xs font-black text-black px-1">
              <span>فحص وتدقيق الجلسة</span>
              <span>تشفير أمني معتمد</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // 🛑 شاشة الرفض الأمني والتوجيه التلقائي بالنمط الفاتح
  if (!isAuthorized) {
    return (
      <div 
        className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans select-none relative overflow-hidden" 
        dir="rtl"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-rose-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative bg-white border-2 border-rose-300 rounded-3xl p-8 sm:p-10 shadow-xl max-w-md w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-rose-50 border-2 border-rose-300 rounded-3xl mx-auto flex items-center justify-center text-rose-700 shadow-lg shadow-rose-600/15">
            <ShieldAlert className="w-10 h-10" strokeWidth={2.2} />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-black">تم رفض الوصول</h3>
            <p className="text-sm sm:text-base font-black text-black leading-relaxed">{securityReason}</p>
          </div>

          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm font-black text-rose-950 flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>جاري توجيهك التلقائي إلى بوابتك المصرح بها...</span>
          </div>

          <button
            type="button"
            onClick={() => {
              purgeZeroTrustSession();
              router.replace('/');
            }}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-base rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
            <Lock className="w-4 h-4" strokeWidth={2.2} />
            <span>تسجيل الخروج والعودة للرئيسية</span>
          </button>
        </div>
      </div>
    );
  }

  // 🔓 عرض محتوى الصفحة المعتمد
  return <>{children}</>;
}
