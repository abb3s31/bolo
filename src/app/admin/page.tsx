'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🏢 بوابة تسجيل الدخول المخصصة لرؤساء الأقسام والمقررين (/admin) - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect } from 'react'; // 🔗 خطافات إدارة الحالة ودورة الحياة
import Image from 'next/image'; // 🖼️ مكون الصور المحسن
import { useRouter } from 'next/navigation'; // 🛣️ التوجيه والتنقل بين المسارات
import { loginDepartmentHeadOrRapporteur, getCurrentSessionUser, logoutUser, getDashboardRouteForRole } from '@/lib/supabase-client'; // 🔌 التحقق والجلسة والتوجيه
import { UserProfile } from '@/types'; // 🔗 الأنواع
import { 
  Building2, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  LogOut, 
  X, 
  CheckCircle2,
  Loader2
} from 'lucide-react'; // 🎨 الأيقونات SVG

export default function DepartmentHeadsLoginPage() {
  // 📌 حالات الحقول والرسائل
  const [emailInput, setEmailInput] = useState<string>(''); // ✉️ بريد رئيس/مقرر القسم
  const [passwordInput, setPasswordInput] = useState<string>(''); // 🔑 كلمة المرور
  const [showPassword, setShowPassword] = useState<boolean>(false); // 👁️ إظهار/إخفاء الرمز
  const [errorMessage, setErrorMessage] = useState<string>(''); // ⚠️ نص التنبيه
  const [rememberMe, setRememberMe] = useState<boolean>(false); // 💾 تذكر الحساب
  const [isLoading, setIsLoading] = useState<boolean>(false); // ⏳ حالة التحميل
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true); // 🔍 فحص الجلسة النشطة
  const [currentSessionUser, setCurrentSessionUser] = useState<UserProfile | null>(null); // 👤 الجلسة
  const router = useRouter(); // 🛣️ موجه الصفحات

  // 🔄 فحص الجلسة والبريد المحفوظ والتحويل الفوري للداشبورد إذا مسجل
  useEffect(() => {
    // 👤 قراءة الجلسة المشفرة الحالية
    const user = getCurrentSessionUser();
    
    // 🚀 إذا المستخدم مسجل دخول بالفعل، نوجهه فوراً للداشبورد المخصصة إله
    if (user) {
      setCurrentSessionUser(user); // 💾 حفظ المستخدم
      // 🏢 إذا كان رئيس قسم أو مقرر يروح للوحة تحكم إدارة القسم
      if (user.role === 'department_head' || user.role === 'rapporteur') {
        router.replace('/admin/dashboard');
        return;
      }
      // 👑 إذا كان مسؤول عام أو أدمن يروح للوحة المسؤول العام حصراً
      if (user.role === 'super_admin' || user.role === 'admin') {
        router.replace('/sadmin/dashboard');
        return;
      }
      // 🔀 إذا كان مسجل برتبة أخرى (أستاذ أو طالب) نوجهه لبوابته
      const targetRoute = getDashboardRouteForRole(user.role);
      router.replace(targetRoute);
      return;
    }

    // 💾 استرجاع البريد المحفوظ
    const savedEmail = localStorage.getItem('sadiq_remembered_head_email');
    if (savedEmail) {
      setEmailInput(savedEmail);
      setRememberMe(true);
    }

    // 🔓 إنهاء الفحص وإتاحة الواجهة
    setIsCheckingSession(false);

    // 🏷️ تعيين عنوان المتصفح
    if (typeof document !== 'undefined') {
      document.title = 'بوابة الإدارة ورؤساء الأقسام | جامعة الإمام جعفر الصادق (ع) - فرع ميسان';
    }
  }, [router]);

  // 💾 دالة التبديل التفاعلي الفوري لخيار تذكر البريد
  const handleRememberMeToggle = (checked: boolean) => {
    setRememberMe(checked);
    if (!checked) {
      localStorage.removeItem('sadiq_remembered_head_email'); // 🧹 مسح فوري من التخزين
    } else if (emailInput.trim()) {
      localStorage.setItem('sadiq_remembered_head_email', emailInput.trim().toLowerCase());
    }
  };

  // 🚪 تسجيل الخروج
  const handleLogout = () => {
    logoutUser(); // 🧹 تدمير التوكن
    setCurrentSessionUser(null); // 🔄 تصفير الحالة
    setErrorMessage(''); // 🧹 تنظيف الأخطاء
    setIsCheckingSession(false); // 🔓 تمكين النموذج
  };

  // 🚀 إرسال نموذج الدخول
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 🛑 منع إعادة التحميل
    setErrorMessage(''); // 🧹 تصفير الأخطاء
    setIsLoading(true); // ⏳ بدء المعالجة

    const cleanEmail = emailInput.trim().toLowerCase(); // 🧹 تنظيف البريد
    const cleanPass = passwordInput.trim(); // 🧹 تنظيف الرمز

    if (!cleanEmail) {
      setErrorMessage('يرجى إدخال البريد الأكاديمي.');
      setIsLoading(false);
      return;
    }

    if (!cleanPass) {
      setErrorMessage('يرجى إدخال كلمة المرور.');
      setIsLoading(false);
      return;
    }

    // 🔌 التحقق من بيانات الدخول المباشرة من Supabase
    const result = await loginDepartmentHeadOrRapporteur(cleanEmail, cleanPass);

    if (!result.user) {
      setErrorMessage(result.error || 'بيانات الدخول غير صحيحة أو ليس لديك صلاحية رئيس أو مقرر قسم.');
      setIsLoading(false);
      return;
    }

    // 💾 حفظ البريد
    if (rememberMe) {
      localStorage.setItem('sadiq_remembered_head_email', cleanEmail);
    } else {
      localStorage.removeItem('sadiq_remembered_head_email');
    }

    // 🎯 التوجيه المباشر للوحة إدارة القسم (الداشبورد الرسمية للقسم)
    router.replace('/admin/dashboard');
  };

  const isEmailValidFormat = emailInput.includes('@') && emailInput.includes('.');

  // 🌟 شاشة الفحص والتوجيه التلقائي العالمية الفاخرة لمنع الوميض
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans select-none" dir="rtl">
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          {/* 🖼️ شعار الجامعة الدائري الفاخر */}
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

          <div className="space-y-1.5">
            <h2 className="text-base font-black text-slate-950">جامعة الإمام جعفر الصادق (ع)</h2>
            <p className="text-sm font-black text-slate-700">بوابة إدارة الأقسام الأكاديمية — فرع ميسان</p>
          </div>

          <div className="flex items-center justify-center gap-2.5 py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-black">
            <Loader2 className="w-4 h-4 text-slate-900 animate-spin flex-shrink-0" />
            <span>جاري التحقق من الجلسة ونقلك للوحة الإدارة...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 px-4 font-sans select-none relative overflow-hidden">
      
      {/* 🖼️ الشعار وهوية بوابة القسم */}
      <div className="w-full max-w-md mx-auto text-center space-y-3 mb-5">
        
        <div className="flex justify-center items-center">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center p-1 bg-white rounded-3xl shadow-xs border border-slate-200">
            <Image
              src="/logo.webp"
              alt="جامعة الإمام جعفر الصادق (ع) - فرع ميسان"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            جامعة الإمام جعفر الصادق (ع)
          </h1>
          <p className="text-sm sm:text-base font-black text-slate-900 mt-1">
            فرع ميسان — بوابة إدارة الأقسام الأكاديمية
          </p>
        </div>

      </div>

      {/* 🏛️ كارت الدخول الحصري لرؤساء الأقسام والمقررين بحدود ناعمة */}
      <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-5">
        
        {/* 🛡️ شارة الأمان وتحديد البوابة */}
        <div className="bg-slate-100 border border-slate-200 p-3 rounded-2xl flex items-center justify-center gap-2 text-slate-950 font-black text-sm sm:text-base">
          <ShieldCheck className="w-5 h-5 text-slate-900" />
          <span>تسجيل دخول رئيس القسم / المقرر الأكاديمي</span>
        </div>

        {/* 🚪 جلسة نشطة سابقة */}
        {currentSessionUser && (
          <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-950 text-sm font-black">
            <span className="truncate">مسجل حالياً: <strong>{currentSessionUser.full_name}</strong></span>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-950 rounded-xl text-sm font-black sm:text-sm font-black transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </button>
          </div>
        )}

        {/* ⚠️ تنبيه الأخطاء */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl space-y-1 text-red-950 text-sm font-black animate-in fade-in duration-150">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1 leading-relaxed text-sm">
                <span>{errorMessage}</span>
              </div>
            </div>
          </div>
        )}

        {/* 📝 نموذج تسجيل الدخول */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4" autoComplete="on">
          
          {/* 📧 البريد الأكاديمي */}
          <div className="space-y-1.5">
            <label className="text-sm font-black text-slate-950 flex items-center gap-1">
              <span>البريد الأكاديمي</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute right-3.5 text-slate-900 pointer-events-none">
                {isEmailValidFormat ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Mail className="w-5 h-5 text-slate-950" />
                )}
              </div>

              <input
                id="head-email"
                name="email"
                type="email"
                dir="ltr"
                autoComplete="email"
                inputMode="email"
                aria-label="البريد الأكاديمي"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="a@sadiq.edu.iq"
                className="w-full pl-10 pr-11 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 text-sm font-black transition-all shadow-xs text-left"
              />

              {emailInput.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setEmailInput('');
                    setErrorMessage('');
                  }}
                  className="absolute left-3 p-1.5 text-slate-950 font-black hover:text-black hover:bg-slate-200 transition cursor-pointer rounded-lg"
                  title="مسح الحقل"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 🔑 كلمة المرور */}
          <div className="space-y-1.5">
            <label className="text-sm font-black text-slate-950 flex items-center gap-1">
              <span>كلمة المرور</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute right-3.5 text-slate-950 pointer-events-none">
                <Lock className="w-5 h-5" />
              </div>

              <input
                id="head-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                autoComplete="current-password"
                aria-label="كلمة المرور"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="أدخل كلمة المرور..."
                className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 text-sm font-black transition-all shadow-xs text-left"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 p-1 text-slate-950 font-black hover:text-slate-950 transition cursor-pointer"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5 text-slate-950" />}
              </button>
            </div>
          </div>

          {/* 💾 خيار تذكرني */}
          <div className="flex items-center justify-between text-sm pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-950 font-black">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => handleRememberMeToggle(e.target.checked)}
                className="w-4 h-4 rounded border-slate-400 text-slate-900 focus:ring-slate-900 cursor-pointer"
              />
              <span>تذكر البريد في هذا المتصفح</span>
            </label>
          </div>

          {/* 🔘 زر تسجيل الدخول */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50 border border-[#1e4570]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>جاري التحقق والصلاحيات...</span>
              </span>
            ) : (
              <>
                <Building2 className="w-5 h-5 text-slate-200" />
                <span>دخول لوحة إدارة القسم</span>
              </>
            )}
          </button>

        </form>

      </div>

    </div>
  );
}
