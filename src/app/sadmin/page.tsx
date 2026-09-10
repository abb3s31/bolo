'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 👑 بوابة تسجيل الدخول المخصصة للمسؤول العام عن النظام (/sadmin) - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect } from 'react'; // 🔗 خطافات إدارة الحالة ودورة الحياة
import Image from 'next/image'; // 🖼️ مكون الصور المحسن
import { useRouter } from 'next/navigation'; // 🛣️ التوجيه والتنقل بين المسارات
import { loginSuperAdmin, getCurrentSessionUser, logoutUser, getDashboardRouteForRole, checkIfSuperAdminExists, registerFirstSuperAdmin } from '@/lib/supabase-client'; // 🔌 التحقق من الجلسة والتوجيه
import { UserProfile } from '@/types'; // 🔗 الأنواع الصريحة
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  LogOut, 
  X, 
  CheckCircle2, 
  KeyRound,
  Loader2,
  UserPlus,
  User
} from 'lucide-react'; // 🎨 الأيقونات الفيكتور SVG

export default function SuperAdminLoginPage() {
  // 📌 حالات الحقول والرسائل والتحقق الأمني
  const [emailInput, setEmailInput] = useState<string>(''); // ✉️ حقل البريد الأكاديمي يبدأ فارغ
  const [passwordInput, setPasswordInput] = useState<string>(''); // 🔑 حقل كلمة المرور يبدأ فارغ
  const [setupFullName, setSetupFullName] = useState<string>(''); // 👤 الاسم الكامل للمسؤول الأول
  const [isInitialSetupMode, setIsInitialSetupMode] = useState<boolean>(false); // 🛠️ وضع التهيئة الأولية
  const [showPassword, setShowPassword] = useState<boolean>(false); // 👁️ إظهار أو إخفاء رمز المرور
  const [errorMessage, setErrorMessage] = useState<string>(''); // ⚠️ نص رسائل التنبيه أو الأخطاء
  const [rememberMe, setRememberMe] = useState<boolean>(false); // 💾 خيار تذكر البريد
  const [isLoading, setIsLoading] = useState<boolean>(false); // ⏳ حالة التحميل أثناء تسجيل الدخول
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true); // 🔍 فحص وجود جلسة نشطة سابقة
  const [currentSessionUser, setCurrentSessionUser] = useState<UserProfile | null>(null); // 👤 بيانات الجلسة الحالية
  const router = useRouter(); // 🛣️ كائن التوجيه والتنقل

  // 🔄 فحص الجلسة والبريد المحفوظ عند فتح الصفحة والتحويل الفوري للداشبورد إذا مسجل
  useEffect(() => {
    // 👤 جلب بيانات المستخدم المسجل إن وجدت الجلسة
    const user = getCurrentSessionUser();
    
    // 🚀 إذا المستخدم مسجل دخول بالفعل، نوجهه فوراً للداشبورد المخصصة إله
    if (user) {
      setCurrentSessionUser(user); // 💾 حفظ بيانات الجلسة
      // 👑 إذا كان مسؤول عام أو أدمن يروح للوحة المسؤول العام حصراً
      if (user.role === 'super_admin' || user.role === 'admin') {
        router.replace('/sadmin/dashboard');
        return;
      }
      // 🔀 إذا كان مسجل بدور ثاني نوجهه للداشبورد المناسبة
      const targetRoute = getDashboardRouteForRole(user.role);
      router.replace(targetRoute);
      return;
    }

    // 💾 استرجاع البريد المحفوظ محلياً إذا كان خيار التذكر مفعّلاً سابقاً
    const savedEmail = localStorage.getItem('sadiq_remembered_superadmin_email');
    if (savedEmail) {
      setEmailInput(savedEmail); // ✉️ تعبئة البريد المحفوظ بالحقل
      setRememberMe(true); // 🔘 تفعيل خيار تذكرني تلقائياً
    }

    // 🔍 فحص هل توجد حسابات مسؤول عام سابقة أم أن المنظومة جديدة بحاجة لتهيئة
    checkIfSuperAdminExists().then((exists) => {
      setIsInitialSetupMode(!exists);
    }).catch(() => {});

    // 🔓 إنهاء حالة الفحص وإظهار واجهة تسجيل الدخول
    setIsCheckingSession(false);

    // 🏷️ تعيين عنوان المتصفح
    if (typeof document !== 'undefined') {
      document.title = 'بوابة الإشراف والمسؤول العام | جامعة الإمام جعفر الصادق (ع) - فرع ميسان';
    }
  }, [router]);

  // 🚪 تسجيل الخروج الفوري
  const handleLogout = () => {
    logoutUser(); // 🧹 مسح الجلسة وتدمير التوكن
    setCurrentSessionUser(null); // 🔄 تصفير بيانات الجلسة
    setErrorMessage(''); // 🧹 مسح أي أخطاء
    setIsCheckingSession(false); // 🔓 ضمان ظهور الفورم بعد الخروج
  };

  // 💾 دالة التبديل التفاعلي الفوري لخيار تذكر البريد
  const handleRememberMeToggle = (checked: boolean) => {
    setRememberMe(checked); // 🔄 تحديث حالة الخيار
    if (!checked) {
      localStorage.removeItem('sadiq_remembered_superadmin_email'); // 🧹 مسح التخزين
    } else if (emailInput.trim()) {
      localStorage.setItem('sadiq_remembered_superadmin_email', emailInput.trim().toLowerCase()); // 💾 حفظ البريد
    }
  };

  // 👑 دالة تهيئة أول حساب مسؤول عام وربطه مباشرة بـ Supabase
  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const cleanName = setupFullName.trim();
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanName) {
      setErrorMessage('يرجى كتابة الاسم الكامل للمسؤول العام.');
      setIsLoading(false);
      return;
    }
    if (!cleanEmail) {
      setErrorMessage('يرجى إدخال البريد الأكاديمي للمسؤول.');
      setIsLoading(false);
      return;
    }
    if (!cleanPass) {
      setErrorMessage('يرجى إدخال كلمة المرور.');
      setIsLoading(false);
      return;
    }

    const result = await registerFirstSuperAdmin({
      fullName: cleanName,
      email: cleanEmail,
      password: cleanPass,
    });

    if (!result.user || result.error) {
      setErrorMessage(result.error || 'تعذر تهيئة حساب المسؤول العام.');
      setIsLoading(false);
      return;
    }

    // 🚀 التوجيه المباشر للوحة الإشراف
    router.replace('/sadmin/dashboard');
  };

  // 🚀 تسجيل الدخول للمسؤول العام
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 🛑 منع إعادة تحميل الصفحة
    setErrorMessage(''); // 🧹 تصفير الأخطاء
    setIsLoading(true); // ⏳ بدء التحميل

    const cleanEmail = emailInput.trim().toLowerCase(); // 🧹 تنظيف البريد
    const cleanPass = passwordInput.trim(); // 🧹 تنظيف الباسورد

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

    // 🔌 استدعاء دالة التحقق الحصرية للمسؤول العام (المباشرة من Supabase)
    const result = await loginSuperAdmin(cleanEmail, cleanPass);

    if (!result.user) {
      setErrorMessage(result.error || 'بيانات الدخول غير صحيحة أو ليس لديك صلاحية المسؤول العام.');
      setIsLoading(false);
      return;
    }

    // 💾 حفظ البريد في الذاكرة إذا كان خيار التذكر مفعّلاً
    if (rememberMe) {
      localStorage.setItem('sadiq_remembered_superadmin_email', cleanEmail);
    } else {
      localStorage.removeItem('sadiq_remembered_superadmin_email');
    }

    // 🎯 التوجيه المباشر للوحة الإشراف الخاصة بالمسؤول العام
    router.replace('/sadmin/dashboard');
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
            <p className="text-sm font-black text-slate-700">بوابة التحكم الأكاديمية العليا — فرع ميسان</p>
          </div>

          <div className="flex items-center justify-center gap-2.5 py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-black">
            <Loader2 className="w-4 h-4 text-slate-900 animate-spin flex-shrink-0" />
            <span>جاري التحقق من الجلسة ونقلك للوحة التحكم...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 px-4 font-sans select-none relative overflow-hidden">
      
      {/* 🖼️ الشعار الرسمي والعناوين الأكاديمية */}
      <div className="w-full max-w-md mx-auto text-center space-y-3 mb-5">
        
        {/* 👑 شارة الشعار بدون حدود سوداء ثقيلة */}
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
            فرع ميسان — بوابة التحكم الأكاديمية العليا
          </p>
        </div>

      </div>

      {/* 🏛️ كارت الدخول الحصري للمسؤول العام بحدود ناعمة */}
      <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden space-y-4">
        
        {/* 🛡️ شارة الأمان وتحديد البوابة */}
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl flex items-center justify-center gap-2 text-slate-950 font-black text-sm font-black sm:text-sm">
          <ShieldCheck className="w-4 h-4 text-slate-900" />
          <span>منطقة تحكم المسؤول العام</span>
        </div>

        {/* 🚪 جلسة نشطة */}
        {currentSessionUser && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-950 text-sm font-black">
            <span className="truncate">مسجل حالياً: <strong>{currentSessionUser.full_name}</strong></span>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-black shadow-xs transition flex items-center gap-1 cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              تسجيل الخروج
            </button>
          </div>
        )}

        {/* ⚠️ تنبيه الأخطاء */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl space-y-1 text-red-900 text-sm font-black animate-in fade-in duration-150">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1 leading-relaxed text-sm font-black">
                <span>{errorMessage}</span>
              </div>
            </div>
          </div>
        )}

        {isInitialSetupMode ? (
          /* 🛠️ نموذج التهيئة الأولية لإنشاء حساب المسؤول العام الأول المعتمد */
          <form onSubmit={handleInitialSetup} noValidate className="space-y-3.5">
            <div className="p-4 bg-slate-50 border border-slate-300 rounded-2xl text-center space-y-2 animate-in fade-in shadow-xs">
              <div className="flex items-center justify-center gap-2 font-black text-base text-black">
                <ShieldCheck className="w-5 h-5 text-black" />
                <span className="font-black text-black text-base">تأسيس حساب المسؤول العام (المنظومة الجامعية)</span>
              </div>
              <p className="text-black leading-relaxed font-black text-sm text-center">
                مرحباً بك. يرجى إدخال بيانات الحساب الرئيسي لاعتماده في إدارة النظام الأكاديمي والربط السحابي المباشر.
              </p>
            </div>

            {/* 👤 الاسم الكامل للمسؤول */}
            <div className="space-y-1">
              <label className="text-sm font-black text-slate-900 flex items-center gap-1">
                <span>الاسم الكامل للمسؤول العام</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute right-3 text-slate-700 pointer-events-none">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={setupFullName}
                  onChange={(e) => {
                    setSetupFullName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="مثال: د. عباس علي حسين"
                  className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-400 text-sm font-black transition-all shadow-xs"
                />
              </div>
            </div>

            {/* 📧 البريد الأكاديمي */}
            <div className="space-y-1">
              <label className="text-sm font-black text-slate-900 flex items-center gap-1">
                <span>البريد الأكاديمي المعتمد</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute right-3 text-slate-700 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  dir="ltr"
                  required
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="admin@sadiq.edu.iq"
                  className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-400 text-sm font-black transition-all shadow-xs text-left"
                />
              </div>
            </div>

            {/* 🔑 كلمة المرور */}
            <div className="space-y-1">
              <label className="text-sm font-black text-slate-900 flex items-center gap-1">
                <span>كلمة المرور المشفرة</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute right-3 text-slate-700 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  required
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="اختر كلمة مرور قوية..."
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-400 text-sm font-black transition-all shadow-xs text-left"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 p-1 text-slate-950 font-black hover:text-slate-900 transition cursor-pointer"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 🔘 زر إنشاء وتثبيت المسؤول العام */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50 border border-[#1e4570] mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>جاري تأسيس الحساب في Supabase...</span>
                </span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-emerald-300" />
                  <span>تأسيس حساب المسؤول العام وبدء المنظومة</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* 📝 نموذج الدخول المعتاد للمسؤول العام */
          <form onSubmit={handleSubmit} noValidate className="space-y-3.5" autoComplete="on">
            
            {/* 📧 البريد الأكاديمي */}
            <div className="space-y-1">
              <label className="text-sm font-black text-slate-900 flex items-center gap-1">
                <span>البريد الأكاديمي</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute right-3 text-slate-900 pointer-events-none">
                  {isEmailValidFormat ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Mail className="w-4 h-4 text-slate-700" />
                  )}
                </div>

                <input
                  id="sadmin-email"
                  name="email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  inputMode="email"
                  aria-label="بريد المسؤول العام"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="admin@sadiq.edu.iq"
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-400 text-sm font-black transition-all shadow-xs text-left"
                />

                {emailInput.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInput('');
                      setErrorMessage('');
                    }}
                    className="absolute left-3 p-1 text-slate-900 font-bold hover:bg-slate-200 transition cursor-pointer"
                    title="مسح"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 🔑 كلمة المرور */}
            <div className="space-y-1">
              <label className="text-sm font-black text-slate-900 flex items-center gap-1">
                <span>كلمة المرور</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute right-3 text-slate-700 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>

                <input
                  id="sadmin-password"
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
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-400 text-sm font-black transition-all shadow-xs text-left"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 p-1 text-slate-950 font-black hover:text-slate-900 transition cursor-pointer"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 💾 تذكرني */}
            <div className="flex items-center justify-between text-sm font-black pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-black">
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
              className="w-full py-3.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50 border border-[#1e4570]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>جاري التحقق من الصلاحيات...</span>
                </span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-slate-200" />
                  <span>دخول لوحة المسؤول العام</span>
                </>
              )}
            </button>

          </form>
        )}

      </div>

    </div>
  );
}
