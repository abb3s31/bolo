'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

//  بوابة تسجيل الدخول المخصصة للكادر التدريسي والأساتذة (/teacher)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا
import { useState, useEffect } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة ودورة الحياة
import Image from 'next/image'; // 🖼️ مكون الصور المحسن لشعار الجامعة
import Link from 'next/link'; // 🔗 روابط التنقل
import { useRouter } from 'next/navigation'; // 🛣️ موجه المسارات
import { 
  loginTeacherByEmailAndPassword, 
  getCurrentSessionUser, 
  logoutUser, 
  getDashboardRouteForRole 
} from '@/lib/supabase-client'; // 🔌 دوال التحقق والجلسات
import { UserProfile } from '@/types'; // 🔗 واجهات الأنواع الصريحة
import { 
  BookOpen, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  LogOut, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  GraduationCap, 
  ShieldCheck, 
  Building2 
} from 'lucide-react'; // 🎨 الأيقونات الفيكتور SVG

export default function TeacherLoginPage() {
  const router = useRouter(); // 🛣️ موجه الصفحات

  // 📌 حالات الحقول والرسائل
  const [emailInput, setEmailInput] = useState<string>(''); // ✉️ حقل البريد الأكاديمي للأستاذ
  const [passwordInput, setPasswordInput] = useState<string>(''); // 🔑 حقل كلمة المرور
  const [showPassword, setShowPassword] = useState<boolean>(false); // 👁️ إظهار/إخفاء الرمز
  const [errorMessage, setErrorMessage] = useState<string>(''); // ⚠️ نص رسالة الخطأ
  const [rememberMe, setRememberMe] = useState<boolean>(false); // 💾 تذكر البريد
  const [isLoading, setIsLoading] = useState<boolean>(false); // ⏳ حالة جاري تسجيل الدخول
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true); // 🔍 فحص الجلسة السابقة
  const [currentSessionUser, setCurrentSessionUser] = useState<UserProfile | null>(null); // 👤 الجلسة الحالية

  // 🔄 فحص وجود جلسة نشطة مسبقاً والتحويل الفوري للوحة الأستاذ
  useEffect(() => {
    const user = getCurrentSessionUser(); // 🔍 قراءة الجلسة المشفرة
    
    if (user) {
      setCurrentSessionUser(user); // 💾 حفظ المستخدم
      //  إذا كان أستاذ يروح فوراً للداشبورد المخصصة إله
      if (user.role === 'teacher') {
        router.replace('/teacher/dashboard');
        return;
      }
      // 🔀 إذا كان مسجل برتبة ثانية نوجهه للداشبورد الخاصة بدوره
      const targetRoute = getDashboardRouteForRole(user.role);
      router.replace(targetRoute);
      return;
    }

    // 🔀 إعادة التوجيه التلقائي للبوابة المركزية الموحدة مع تفعيل تبويب الأساتذة
    router.replace('/?portal=teacher');
  }, [router]);

  // 🚪 دالة تسجيل الخروج السريع
  const handleLogout = () => {
    logoutUser(); // 🧹 مسح الجلسة
    setCurrentSessionUser(null);
    setErrorMessage('');
    setIsCheckingSession(false);
  };

  // 💾 دالة التبديل التفاعلي الفوري لخيار تذكر البريد
  const handleRememberMeToggle = (checked: boolean) => {
    setRememberMe(checked);
    if (!checked) {
      localStorage.removeItem('sadiq_remembered_teacher_email'); // 🧹 مسح فوري من التخزين
    } else if (emailInput.trim()) {
      localStorage.setItem('sadiq_remembered_teacher_email', emailInput.trim().toLowerCase());
    }
  };

  // 💡 إضافة امتداد النطاق الرسمي للجامعة
  const handleAppendDomain = () => {
    const trimmed = emailInput.trim();
    if (!trimmed.includes('@')) {
      setEmailInput(`${trimmed}@sadiq.edu.iq`);
    } else {
      const usernamePart = trimmed.split('@')[0];
      setEmailInput(`${usernamePart}@sadiq.edu.iq`);
    }
    setErrorMessage('');
  };

  // 🚀 إرسال نموذج تسجيل الدخول
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanEmail) {
      setErrorMessage('يرجى إدخال البريد الأكاديمي للأستاذ.');
      setIsLoading(false);
      return;
    }

    if (!cleanPass) {
      setErrorMessage('يرجى إدخال كلمة المرور الأكاديمية (رمز الدخول).');
      setIsLoading(false);
      return;
    }

    // 🔌 التحقق الحصري من حساب الأستاذ المباشر من Supabase
    const result = await loginTeacherByEmailAndPassword(cleanEmail, cleanPass);

    if (!result.user) {
      setErrorMessage(result.error || 'فشلت عملية التحقق من بيانات الأستاذ. يرجى مراجعة إدارة الكلية.');
      setIsLoading(false);
      return;
    }

    // 💾 حفظ البريد في حال اختيار تذكرني
    if (rememberMe) {
      localStorage.setItem('sadiq_remembered_teacher_email', cleanEmail);
    } else {
      localStorage.removeItem('sadiq_remembered_teacher_email');
    }

    // 🎯 التوجيه المباشر للوحة تحكم الأستاذ
    router.replace('/teacher/dashboard');
  };

  const isEmailValidFormat = emailInput.includes('@') && emailInput.includes('.');

  // 🌟 شاشة الفحص والتوجيه التلقائي
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans select-none" dir="rtl">
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center p-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs">
            <Image
              src="/logo.webp"
              alt="جامعة الإمام جعفر الصادق (ع)"
              width={70}
              height={70}
              className="object-contain"
              priority
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-slate-950 font-black text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-blue-800" />
              <span>جاري تدقيق الجلسة الأكاديمية للأستاذ...</span>
            </div>
            <p className="text-sm font-black text-slate-950 font-black">بوابة الأساتذة والتدريسيين — مسار بولونيا</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
      
      {/* 🔝 الهيدر العلوي الخفيف */}
      <header className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <Image src="/logo.webp" alt="جامعة الإمام جعفر الصادق" width={48} height={48} className="object-contain" priority />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-950 leading-tight">جامعة الإمام جعفر الصادق (ع)</h1>
            <p className="text-sm font-black text-slate-950">فرع ميسان — بوابة الأساتذة والتدريسيين</p>
          </div>
        </div>

        {/* 🌐 روابط البوابات الأخرى */}
        <div className="flex items-center gap-2">
          <Link
            href="/student"
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-950 text-sm font-black transition flex items-center gap-1.5 shadow-2xs"
          >
            <GraduationCap className="w-4 h-4 text-indigo-700" />
            <span className="hidden sm:inline">بوابة الطلاب</span>
          </Link>
          <Link
            href="/admin"
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-950 text-sm font-black transition flex items-center gap-1.5 shadow-2xs"
          >
            <Building2 className="w-4 h-4 text-blue-700" />
            <span className="hidden sm:inline">بوابة الإدارة</span>
          </Link>
        </div>
      </header>

      {/* 🏛️ الحاوية المركزية لبطاقة الدخول */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* 🏷️ الشعار والعنوان الترحيبي */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto text-blue-900 shadow-xs">
              <BookOpen className="w-8 h-8 text-blue-800" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950">تسجيل دخول التدريسيين</h2>
            <p className="text-sm text-slate-950 font-black">
              المنصة الأكاديمية لإدارة المواد والتقييمات والدرجات وفق مسار بولونيا
            </p>
          </div>

          {/* ⚠️ رسائل التنبيه أو الخطأ */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-sm text-rose-950 font-black animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-700 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* 📝 نموذج تسجيل الدخول */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* ✉️ حقل البريد الأكاديمي للأستاذ */}
            <div className="space-y-1.5">
              <label className="block text-sm font-black text-slate-950">
                البريد الإلكتروني الأكاديمي للأستاذ
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@sadiq.edu.iq"
                  dir="ltr"
                  className="w-full px-4 py-3.5 pl-11 text-sm sm:text-base font-black bg-slate-50 border border-slate-300 rounded-xl text-slate-950 placeholder:text-slate-700 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs text-left"
                />
                <Mail className="w-5 h-5 text-slate-950 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
              
              {/* 💡 زر إضافة النطاق بنقرة واحدة */}
              {!isEmailValidFormat && emailInput.trim().length > 1 && (
                <button
                  type="button"
                  onClick={handleAppendDomain}
                  className="text-sm font-black sm:text-sm text-blue-900 hover:text-blue-950 font-black flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>إكمال النطاق تلقائياً (@sadiq.edu.iq)</span>
                </button>
              )}
            </div>

            {/* 🔑 حقل كلمة المرور */}
            <div className="space-y-1.5">
              <label className="block text-sm font-black text-slate-950">
                كلمة المرور الأكاديمية (رمز الدخول)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full px-4 py-3.5 pl-11 pr-11 text-sm sm:text-base font-black bg-slate-50 border border-slate-300 rounded-xl text-slate-950 placeholder:text-slate-700 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs text-left"
                />
                <Lock className="w-5 h-5 text-slate-950 absolute left-3.5 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-950 font-black hover:text-slate-950 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5 text-slate-950" />}
                </button>
              </div>
            </div>

            {/* 💾 تذكر البريد */}
            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => handleRememberMeToggle(e.target.checked)}
                  className="w-4 h-4 text-blue-700 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="font-black text-slate-950">تذكر بريدي الأكاديمي</span>
              </label>
            </div>

            {/* 🚀 زر الدخول */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm sm:text-base font-black transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 border border-[#1e4570]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5" />
                  <span>الدخول لبوابة التدريسيين</span>
                </>
              )}
            </button>
          </form>

          {/* 🔒 معلومات الأمان والتحقق */}
          <div className="pt-3 border-t border-slate-200 text-center">
            <div className="flex items-center justify-center gap-1.5 text-sm font-black sm:text-sm text-slate-950 font-black">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>نظام موثق ومحمي بتقنية انعدام الثقة (Zero Trust Architecture)</span>
            </div>
          </div>

        </div>
      </main>

      {/* 🏛️ الفوتر السفلي الرسمي */}
      <footer className="w-full max-w-6xl mx-auto p-4 text-center text-sm font-black sm:text-sm text-slate-950 font-black">
        جامعة الإمام جعفر الصادق (ع) — فرع ميسان | المنصة الأكاديمية المركزية لمسار بولونيا © {new Date().getFullYear()}
      </footer>

    </div>
  );
}
