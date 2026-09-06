'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 👑 إعادة التوجيه الفوري والذكي إلى لوحة التحكم أو بوابة المسؤول العام (/sadmin)
import { useEffect } from 'react'; // 🔗 خطافات رياكت ودورة الحياة
import { useRouter } from 'next/navigation'; // 🛣️ موجه المسارات
import { getCurrentSessionUser, getDashboardRouteForRole } from '@/lib/supabase-client'; // 🔌 الجلسة والتوجيه

export default function SuperAdminRedirectPage() {
  const router = useRouter(); // 🛣️ كائن التوجيه

  useEffect(() => {
    // 👤 فحص وجود جلسة نشطة
    const user = getCurrentSessionUser();
    if (user) {
      // 🚀 إذا مسجل دخول نوجهه مباشرة للداشبورد المخصصة إله
      const targetRoute = getDashboardRouteForRole(user.role);
      router.replace(targetRoute);
    } else {
      // 🚪 إذا ما مسجل نوجهه لبوابة المسؤول العام
      router.replace('/sadmin');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans" dir="rtl">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-black text-black">جاري التحقق من الجلسة وتوجيهك...</p>
      </div>
    </div>
  );
}
