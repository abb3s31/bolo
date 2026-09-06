'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🌐 البوابة الأكاديمية المركزية الموحدة - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة ودورة حياة الصفحة
import Image from 'next/image';   // 🖼️ مكون الصور المحسن من Next.js لعرض شعار الجامعة
import Link from 'next/link';     // 🔗 روابط نكست للتنقل بين البوابات
import { useRouter } from 'next/navigation'; // 🛣️ موجه الصفحات للتنقل بعد تسجيل الدخول
import { loginByEmailOnly, getCurrentSessionUser, logoutUser, getDashboardRouteForRole } from '@/lib/supabase-client'; // 🔌 دوال التحقق من البريد والجلسة والتوجيه
import { UserProfile } from '@/types'; // 🔗 واجهات الأنواع الصريحة لمنع الأخطاء البرمجية
import { 
  GraduationCap, 
  BookOpen, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  LogOut, 
  X, 
  CheckCircle2,
  Loader2,
  Building2,
  ShieldCheck
} from 'lucide-react'; // 🎨 الأيقونات التفاعلية الرسمية

export default function BolognaPublicPortalPage() {
  // 📌 اختيار البوابة النشطة: 'student' (بوابة الطلاب) أو 'teacher' (بوابة التدريسيين)
  const [activePortal, setActivePortal] = useState<'student' | 'teacher'>('student');
  
  // 📌 حقول نموذج الدخول بالبريد الأكاديمي ومتابعة الجلسة الحالية
  const [emailInput, setEmailInput] = useState<string>(''); // ✉️ البريد المكتوب بالحقل
  const [passwordInput, setPasswordInput] = useState<string>(''); // 🔑 كلمة مرور الأستاذ
  const [showPassword, setShowPassword] = useState<boolean>(false); // 👁️ إظهار أو إخفاء كلمة المرور
  const [errorMessage, setErrorMessage] = useState<string>(''); // ⚠️ نص رسالة الخطأ إن وجدت
  const [mismatchedPortal, setMismatchedPortal] = useState<'student' | 'teacher' | null>(null); // 🔄 كشف البوابة المعاكسة
  const [rememberMe, setRememberMe] = useState<boolean>(false); // 💾 خيار حفظ البريد على المتصفح
  const [isLoading, setIsLoading] = useState<boolean>(false); // ⏳ حالة التحميل أثناء مطابقة قاعدة البيانات
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true); // 🔍 فحص الجلسة السابقة
  const [currentSessionUser, setCurrentSessionUser] = useState<UserProfile | null>(null); // 👤 بيانات المستخدم المسجل حالياً
  const router = useRouter(); // 🛣️ كائن التوجيه

  // 🔄 فحص الجلسة المفتوحة مسبقاً والبريد المحفوظ عند تحميل الصفحة والتحويل الفوري للداشبورد إذا مسجل
  useEffect(() => {
    // 👤 كشف الجلسة المفتوحة مسبقاً في المتصفح
    const user = getCurrentSessionUser();
    
    // 🚀 إذا كان المستخدم مسجل دخول، نوجهه فوراً للداشبورد المخصصة إله
    if (user) {
      setCurrentSessionUser(user); // 💾 تخزين بيانات الحساب المفتوح
      const targetRoute = getDashboardRouteForRole(user.role);
      router.replace(targetRoute);
      return;
    }

    // 🔍 فحص هل تم تمرير باراميتر البوابة في الرابط (مثل /?portal=teacher أو /?portal=student)
    let initialPortal: 'student' | 'teacher' = 'student';
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const requestedPortal = urlParams.get('portal');
      if (requestedPortal === 'teacher' || requestedPortal === 'student') {
        initialPortal = requestedPortal;
      }
    }
    setActivePortal(initialPortal);

    // 🧹 تنظيف المفتاح القديم المشترك لضمان الفصل التام
    localStorage.removeItem('sadiq_remembered_email');

    // 💾 استرجاع البريد المحفوظ محلياً للبوابة المحددة حصراً
    const targetStorageKey = initialPortal === 'student' ? 'sadiq_remembered_student_email' : 'sadiq_remembered_teacher_email';
    const savedEmail = localStorage.getItem(targetStorageKey);
    if (savedEmail) {
      setEmailInput(savedEmail); // ✍️ تعبئة الحقل تلقائياً للبوابة المختارة
      setRememberMe(true); // 🔘 تفعيل علامة الصح
    } else {
      setEmailInput(''); // 🧹 تفريغ الحقل إذا غير مفعل
      setRememberMe(false); // 🔘 إلغاء التفعيل
    }

    // 🔓 إنهاء حالة الفحص وإظهار الواجهة
    setIsCheckingSession(false);
  }, [router]);

  // 🏷️ تحديث عنوان نافذة المتصفح ديناميكياً بحسب البوابة المختارة
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const portalName = activePortal === 'student' ? 'بوابة الطلبة' : 'بوابة التدريسيين';
    document.title = `${portalName} | جامعة الإمام جعفر الصادق (ع) - فرع ميسان`;
  }, [activePortal]);

  // 🚪 دالة تسجيل الخروج الفورية من صفحة الدخول الرئيسية
  const handleLogoutFromLogin = () => {
    logoutUser(); // 🧹 مسح الجلسة من التخزين المحلي
    setCurrentSessionUser(null); // 🔄 تصفير الحالة
    setErrorMessage(''); // 🧹 مسح الأخطاء
    setMismatchedPortal(null); // 🧹 تصفير البوابة المقترحة
    setIsCheckingSession(false); // 🔓 تمكين النموذج
  };

  // 💾 دالة التبديل التفاعلي الفوري لخيار تذكر البريد
  const handleRememberMeToggle = (checked: boolean) => {
    setRememberMe(checked);
    const storageKey = activePortal === 'student' ? 'sadiq_remembered_student_email' : 'sadiq_remembered_teacher_email';
    if (!checked) {
      localStorage.removeItem(storageKey); // 🧹 مسح فوري من التخزين المحلي
    } else if (emailInput.trim()) {
      localStorage.setItem(storageKey, emailInput.trim().toLowerCase()); // 💾 حفظ فوري للبريد المدخل
    }
  };

  // 💡 إضافة امتداد النطاق الرسمي للجامعة بنقرة واحدة
  const handleAppendDomain = () => {
    const trimmed = emailInput.trim(); // ✂️ تنظيف الفراغات
    if (!trimmed.includes('@')) {
      setEmailInput(`${trimmed}@sadiq.edu.iq`); // ➕ إضافة النطاق مباشرة بعد الاسم
    } else {
      const usernamePart = trimmed.split('@')[0]; // ✂️ أخذ الجزء الأول فقط قبل @
      setEmailInput(`${usernamePart}@sadiq.edu.iq`); // 🔄 تصحيح النطاق إلى النطاق الرسمي
    }
    setErrorMessage(''); // 🧹 مسح رسائل الخطأ السابقة
    setMismatchedPortal(null); // 🧹 تصفير البوابة المقترحة
  };

  // 🚀 دالة تسجيل الدخول والتحقق من قاعدة البيانات
  const handleLoginSubmit = async (
    e?: React.FormEvent,
    overrideEmail?: string,
    overridePortal?: 'student' | 'teacher',
    overridePassword?: string
  ) => {
    if (e) e.preventDefault(); // 🛑 منع إعادة تحميل الصفحة الافتراضي
    setErrorMessage(''); // 🧹 تصفير الأخطاء
    setMismatchedPortal(null); // 🧹 تصفير التنبيهات
    setIsLoading(true); // ⏳ بدء حالة التحميل

    // 📧 تحديد البريد المستهدف والبوابة المطلوبة وكلمة المرور
    const targetEmail = (overrideEmail !== undefined ? overrideEmail : emailInput).trim().toLowerCase();
    const targetPortal = overridePortal || activePortal;
    const targetPassword = overridePassword !== undefined ? overridePassword : passwordInput;

    // 🛡️ 1. التحقق من إدخال البريد وعدم تركه فارغاً
    if (!targetEmail) {
      setErrorMessage(targetPortal === 'student' ? 'يرجى إدخال البريد الأكاديمي للطالب.' : 'يرجى إدخال البريد الأكاديمي للأستاذ.');
      setIsLoading(false);
      return;
    }

    // 🛡️ 2. التحقق من صحة صياغة وهيئة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      setErrorMessage('صيغة البريد الإلكتروني غير صحيحة، يرجى كتابة بريد إلكتروني صالح (مثال: name@sadiq.edu.iq).');
      setIsLoading(false);
      return;
    }

    // 🛡️ 3. التحقق من إدخال كلمة المرور (الرمز الأكاديمي) للطالب والأستاذ
    if (!targetPassword.trim()) {
      setErrorMessage(
        targetPortal === 'student'
          ? 'يرجى إدخال كلمة المرور الأكاديمية (رمز الدخول) الخاصة بالطالب.'
          : 'يرجى إدخال كلمة المرور الأكاديمية (رمز الدخول) الخاصة بالأستاذ.'
      );
      setIsLoading(false);
      return;
    }

    // 💾 4. حفظ أو حذف البريد من التخزين بشكل منفصل تماماً لكل بوابة
    const targetStorageKey = targetPortal === 'student' ? 'sadiq_remembered_student_email' : 'sadiq_remembered_teacher_email';
    if (rememberMe) {
      localStorage.setItem(targetStorageKey, targetEmail);
    } else {
      localStorage.removeItem(targetStorageKey);
    }

    // 🔍 5. الفحص والمطابقة الحصرية بقاعدة البيانات سحابياً من Supabase ومحلياً
    const res = await loginByEmailOnly(targetEmail, targetPortal, targetPassword);

    if (res.error || !res.user) {
      const errorStr = res.error || 'فشلت عملية التحقق من قاعدة البيانات. يرجى مراجعة إدارة الكلية.';
      setErrorMessage(errorStr);
      
      // 💡 الكشف الذكي عما إذا كان الحساب ينتمي للبوابة الأخرى
      if (errorStr.includes('بوابة الأساتذة')) {
        setMismatchedPortal('teacher');
      } else if (errorStr.includes('بوابة الطلاب')) {
        setMismatchedPortal('student');
      }

      setIsLoading(false);
      return;
    }

    // 🚀 التوجيه فورياً للوحة المعتمدة بحسب دور المستخدم
    const targetRoute = getDashboardRouteForRole(res.user.role);
    router.replace(targetRoute);
  };

  // 🔀 دالة التبديل الفوري للبوابة مع استرجاع البريد المخصص لكل بوابة حصراً
  const handleSwitchPortal = (newPortal: 'student' | 'teacher') => {
    setActivePortal(newPortal); // 🔄 تغيير البوابة النشطة
    setMismatchedPortal(null); // 🧹 تصفير التنبيه
    setErrorMessage(''); // 🧹 مسح رسالة الخطأ
    setPasswordInput(''); // 🧹 مسح حقل كلمة المرور

    // 🌐 تحديث مسار الرابط بهدوء ليعكس البوابة المحددة
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/?portal=${newPortal}`);
    }

    // 💾 استرجاع البريد المحفوظ الخاص بالبوابة المحددة حصراً
    const targetKey = newPortal === 'student' ? 'sadiq_remembered_student_email' : 'sadiq_remembered_teacher_email';
    const savedEmail = localStorage.getItem(targetKey);
    if (savedEmail) {
      setEmailInput(savedEmail); // ✍️ تعبئة الحقل ببريد البوابة الخاصة بها
      setRememberMe(true); // 🔘 تفعيل خيار التذكر
    } else {
      setEmailInput(''); // 🧹 تفريغ الحقل إذا لم يكن محفوظاً
      setRememberMe(false); // 🔘 إلغاء التفعيل
    }
  };

  // 🔍 التحقق اللحظي من صيغة البريد لإظهار علامة الصح
  const isEmailValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim());
  // 💡 شرط إظهار زر الإكمال السريع للنطاق
  const showDomainHelper = emailInput.trim().length > 1 && !emailInput.includes('@');

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
            <p className="text-sm font-black text-slate-700">المنظومة الأكاديمية المركزية — فرع ميسان</p>
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 py-4 sm:py-8 px-4 sm:px-6 font-sans selection:bg-slate-900 selection:text-white">
      
      {/* 🏛️ الترويسة الأكاديمية الكحلية - مظهر أنيق ومحكم بدون هوامش مفرطة */}
      <div className="w-full max-w-lg text-center space-y-2 mb-4 sm:mb-6">
        
        {/* 🖼️ شعار الجامعة المعتمد بحجم متناسق واحترافي */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto flex items-center justify-center">
          <Image
            src="/logo.webp"
            alt="شعار جامعة الإمام جعفر الصادق (ع) - فرع ميسان"
            width={112}
            height={112}
            className="object-contain drop-shadow-sm"
            priority
          />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            جامعة الإمام جعفر الصادق (ع)
          </h1>
          <p className="text-base sm:text-lg font-black text-slate-700 mt-1">
            فرع ميسان — البوابة الأكاديمية المركزية الموحدة
          </p>
        </div>

      </div>

      {/* 🏛️ كارت الدخول الكحلي الأكاديمي المصمم بقياسات متناسقة 100% وبحدود ناعمة */}
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-5">
        
        {/* 🔀 تبويب الاختيار المزدوج للبوابة (استجابي ومحكم بحدود ناعمة) */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
          
          {/* 🎓 زر بوابة الطلاب */}
          <button
            type="button"
            onClick={() => handleSwitchPortal('student')}
            className={`py-3 px-3 rounded-xl font-black text-base transition-all flex items-center justify-center gap-2 cursor-pointer ${ activePortal === 'student' ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-bold' }`}
          >
            <GraduationCap className="w-5 h-5" />
            <span className="truncate">بوابة الطلاب</span>
          </button>

          {/*  زر بوابة الأساتذة */}
          <button
            type="button"
            onClick={() => handleSwitchPortal('teacher')}
            className={`py-3 px-3 rounded-xl font-black text-base transition-all flex items-center justify-center gap-2 cursor-pointer ${ activePortal === 'teacher' ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-800 hover:text-slate-950 hover:bg-slate-200 font-black' }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="truncate">بوابة الأساتذة</span>
          </button>

        </div>

        {/* 📋 عنوان البوابة المختارة */}
        <div className="text-center">
          <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center justify-center gap-2">
            {activePortal === 'student' ? (
              <>
                <GraduationCap className="w-5 h-5 text-slate-900" />
                الدخول بالبريد الأكاديمي والرمز السري للطالب
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5 text-slate-900" />
                الدخول بالبريد وكلمة المرور للتدريسيين
              </>
            )}
          </h2>
        </div>

        {/* 🚪 تنبيه وميزة تسجيل الخروج الفورية عند وجود جلسة نشطة بالمتصفح بحدود ناعمة */}
        {currentSessionUser && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-blue-950 text-base font-black">
            <span className="truncate">مسجل بـ: <strong>{currentSessionUser.full_name}</strong></span>
            <button
              type="button"
              onClick={handleLogoutFromLogin}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-base font-black shadow-2xs transition flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </button>
          </div>
        )}

        {/* ⚠️ تنبيه الأخطاء التفاعلي عند إدخال بريد خاطئ أو كلمة مرور غير صحيحة بحدود ناعمة */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3 text-red-900 text-base font-black animate-in fade-in duration-150">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1 leading-relaxed text-base font-black">
                <span>{errorMessage}</span>
              </div>
            </div>

            {/* 💡 زر التبديل السريع إذا كان الحساب ينتمي للبوابة الأخرى */}
            {mismatchedPortal && (
              <div className="pt-2 border-t border-red-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSwitchPortal(mismatchedPortal)}
                  className="px-3.5 py-1.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base flex items-center justify-center cursor-pointer transition shadow-2xs border border-[#1e4570]"
                >
                  <span>التبديل إلى {mismatchedPortal === 'student' ? 'بوابة الطلاب' : 'بوابة الأساتذة'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 📝 نموذج الدخول (مع منع التنبيهات الإنجليزية التلقائية للمتصفح noValidate) */}
        <form onSubmit={handleLoginSubmit} noValidate className="space-y-4" autoComplete="on">
          
          {/* 📧 حقل إدخال البريد الأكاديمي */}
          <div className="space-y-2">
            <div className="relative flex items-center">
              {/* ✉️ أيقونة البريد أو علامة الصح عند استيفاء الصيغة */}
              <div className="absolute right-3.5 text-slate-900 pointer-events-none">
                {isEmailValidFormat ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Mail className="w-5 h-5 text-slate-900" />
                )}
              </div>

              {/* ⌨️ حقل إدخال البريد الأكاديمي */}
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                aria-label="البريد الأكاديمي الرسمي"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (errorMessage) {
                    setErrorMessage('');
                    setMismatchedPortal(null);
                  }
                }}
                placeholder={activePortal === 'student' ? 'أدخل بريدك الأكاديمي (مثال: student@sadiq.edu.iq)...' : 'أدخل بريدك الأكاديمي المعتمد...'}
                className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-500 text-base font-black transition-all shadow-xs"
              />

              {/* ❌ زر المسح السريع عند وجود نص مكتوب */}
              {emailInput.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setEmailInput('');
                    setErrorMessage('');
                    setMismatchedPortal(null);
                  }}
                  className="absolute left-3.5 p-1 text-slate-900 font-bold hover:text-slate-800 rounded-full hover:bg-slate-200 transition cursor-pointer"
                  title="مسح النص"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 💡 شريط الإكمال السريع للنطاق بنص عربي واضح ومميز */}
            {showDomainHelper && (
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 animate-in fade-in duration-150">
                <span className="text-base font-black text-slate-700">إكمال سريع للبريد الأكاديمي:</span>
                <button
                  type="button"
                  onClick={handleAppendDomain}
                  className="px-3.5 py-1.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl transition font-black text-base shadow-xs cursor-pointer border border-[#1e4570]"
                >
                  + @sadiq.edu.iq
                </button>
              </div>
            )}
          </div>

          {/* 🔑 حقل كلمة المرور (الرمز الأكاديمي السري) للطالب والأستاذ */}
          <div className="space-y-2 animate-in fade-in duration-150">
            <div className="relative flex items-center">
              {/* 🔒 أيقونة القفل */}
              <div className="absolute right-3.5 text-slate-900 pointer-events-none">
                <Lock className="w-5 h-5 text-slate-900" />
              </div>

              {/* ⌨️ حقل إدخال كلمة المرور / الرمز */}
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                aria-label={activePortal === 'student' ? 'كلمة المرور للطالب' : 'كلمة المرور الأكاديمية للأستاذ'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (errorMessage) {
                    setErrorMessage('');
                    setMismatchedPortal(null);
                  }
                }}
                placeholder={
                  activePortal === 'student'
                    ? 'أدخل كلمة المرور الأكاديمية للطالب...'
                    : 'أدخل كلمة المرور الأكاديمية...'
                }
                className="w-full pl-12 pr-11 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-slate-950 placeholder-slate-400 focus:outline-none focus:border-slate-500 text-base font-black transition-all shadow-xs font-mono"
              />

              {/* 👁️ زر إظهار وإخفاء كلمة المرور */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 p-1 text-slate-950 font-black hover:text-slate-900 transition cursor-pointer"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 🔘 خيار تذكرني على هذا الجهاز */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-base font-black text-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => handleRememberMeToggle(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 border-2 border-slate-400 focus:ring-0 cursor-pointer"
              />
              <span>تذكر بريدي الأكاديمي على هذا المتصفح</span>
            </label>
          </div>

          {/* 🔘 زر تسجيل الدخول الكحلي الرسمي */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-base sm:text-lg border border-[#1e4570]"
          >
            {isLoading ? 'جاري التحقق من قاعدة البيانات...' : `تسجيل الدخول إلى ${activePortal === 'student' ? 'بوابة الطلاب' : 'بوابة الأساتذة'}`}
          </button>
        </form>

      </div>

    </div>
  );
}
