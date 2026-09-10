'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🏛️ الهيدر الكحلي الفاخر الاستجابي لجامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect } from 'react'; // 🔗 خطافات رياكت
import Link from 'next/link'; // 🔗 روابط نكست
import Image from 'next/image'; // 🖼️ الصور
import { usePathname, useRouter } from 'next/navigation'; // 🛣️ التوجيه
import { getCurrentSessionUser, logoutUser } from '@/lib/supabase-client'; // 🔌 الجلسة والدخول
import { UserProfile } from '@/types'; // 🔗 الأنواع
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Layers, 
  ShieldCheck, 
  FileSpreadsheet, 
  LogOut, 
  GraduationCap, 
  Menu, 
  X, 
  Building2,
  Sun,
  Moon
} from 'lucide-react'; // 🎨 الأيقونات

export default function Header() {
  const pathname = usePathname(); // 📍 المسار الحالي
  const router = useRouter(); // 🛣️ التوجيه
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 📱 حالة القائمة الجانبية للموبايل

  // 🔄 قراءة جلسة المستخدم المسجل عند تغيير المسار
  useEffect(() => {
    setIsMounted(true);
    setCurrentUser(getCurrentSessionUser());
    setIsMobileMenuOpen(false); // 🔒 إغلاق القائمة الجانبية تلقائياً عند الانتقال
  }, [pathname]);

  // 🛑 إخفاء الهيدر في صفحات تسجيل الدخول الرئيسية
  const authRoutes = [
    '/', 
    '/admin', 
    '/admin/login', 
    '/sadmin', 
    '/sadmin/login', 
    '/super-admin', 
    '/admin-portal-sadiq', 
    '/teacher', 
    '/teacher/login', 
    '/student', 
    '/student/login'
  ];
  if (authRoutes.includes(pathname)) return null;
  if (!isMounted || !currentUser) return null;

  // 🚪 دالة تسجيل الخروج الموجهة حسب الدور الأكاديمي
  const handleLogout = () => {
    const role = currentUser?.role;
    logoutUser();
    
    // 🔀 توجيه كل مستخدم لبوابته المخصصة بعد الخروج
    if (role === 'super_admin' || role === 'admin') {
      router.push('/sadmin');
    } else if (role === 'department_head' || role === 'rapporteur') {
      router.push('/admin');
    } else if (role === 'teacher') {
      router.push('/?portal=teacher');
    } else if (role === 'student') {
      router.push('/?portal=student');
    } else {
      router.push('/');
    }
  };

  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin';
  const isDeptHeadOrRapporteur = currentUser.role === 'department_head' || currentUser.role === 'rapporteur';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs no-print" suppressHydrationWarning>
      <div className="w-full max-w-[1900px] mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-20">
          
          {/* 🖼️ الشعار وهوية الجامعة الصريحة بتنسيق متناسق وأنيق */}
          <div className="flex items-center gap-3.5 select-none">
            <div className="relative w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center flex-shrink-0 bg-slate-50 rounded-2xl p-1 border border-slate-200 shadow-2xs">
              <Image
                src="/logo.webp"
                alt="شعار جامعة الإمام جعفر الصادق (ع) - فرع ميسان"
                width={52}
                height={52}
                className="object-contain"
                priority
              />
            </div>
            <div className="text-right">
              <h1 className="text-base sm:text-lg font-black text-slate-950 leading-snug">
                جامعة الإمام جعفر الصادق (ع)
              </h1>
              <p className="text-xs sm:text-sm font-black text-black leading-tight mt-0.5">
                فرع ميسان — المنصة الأكاديمية المركزية
              </p>
            </div>
          </div>

          {/* 💻 القوائم العلوية للشاشات الكبيرة واللابتوب بحجم مدمج وأنيق */}
          <nav className="hidden lg:flex items-center gap-2 text-[15px] font-black">
            
            {/* 👑 قوائم المسؤول العام الخمسة بحجم مصغر ورشيق */}
            {isSuperAdmin && (
              <>
                {/* 📊 تبويب لوحة الإشراف المصغر */}
                <Link
                  href="/sadmin/dashboard" // 🔗 رابط لوحة الإشراف
                  className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${ // 📐 هوامش وحجم أنيق ومدمج
                    pathname === '/sadmin/dashboard' ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-950 hover:bg-slate-100 hover:text-black font-black' // 🎨 تمييز التبويب النشط
                  }`}
                >
                  <LayoutDashboard className="w-4.5 h-4.5" /> {/* 📐 أيقونة لوحة الإشراف بحجم رشيق */}
                  <span>لوحة الإشراف</span> {/* 🏷️ اسم التبويب */}
                </Link>

                {/* 🏢 تبويب الأقسام العلمية المصغر مع إبقائه فعالاً عند فتح أي قسم */}
                <Link
                  href="/sadmin/departments" // 🔗 رابط الأقسام العلمية
                  className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${ // 📐 هوامش وحجم أنيق ومدمج
                    (pathname?.startsWith('/sadmin/departments') || pathname?.startsWith('/admin/departments')) 
                      ? 'bg-[#0F2942] text-white shadow-xs' 
                      : 'text-slate-950 hover:bg-slate-100 hover:text-black font-black' // 🎨 تمييز التبويب النشط
                  }`}
                >
                  <Layers className="w-4.5 h-4.5" /> {/* 📐 أيقونة الأقسام العلمية بحجم رشيق */}
                  <span>الأقسام العلمية</span> {/* 🏷️ اسم التبويب */}
                </Link>

                {/* 👥 تبويب رؤساء الأقسام والمقررين المصغر */}
                <Link
                  href="/sadmin/department-heads" // 🔗 رابط رؤساء الأقسام والمقررين
                  className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${ // 📐 هوامش وحجم أنيق ومدمج
                    (pathname?.startsWith('/sadmin/department-heads') || pathname?.startsWith('/admin/department-heads')) 
                      ? 'bg-[#0F2942] text-white shadow-xs' 
                      : 'text-slate-950 hover:bg-slate-100 hover:text-black font-black' // 🎨 تمييز التبويب النشط
                  }`}
                >
                  <Building2 className="w-4.5 h-4.5" /> {/* 📐 أيقونة القيادات الأكاديمية بحجم رشيق */}
                  <span>رؤساء الأقسام والمقررين</span> {/* 🏷️ اسم التبويب */}
                </Link>

                {/* 🛡️ تبويب سجل التدقيق المصغر */}
                <Link
                  href="/sadmin/audit-logs" // 🔗 رابط سجل التدقيق الأمني
                  className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${ // 📐 هوامش وحجم أنيق ومدمج
                    pathname === '/sadmin/audit-logs' ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-950 hover:bg-slate-100 hover:text-black font-black' // 🎨 تمييز التبويب النشط
                  }`}
                >
                  <ShieldCheck className="w-4.5 h-4.5" /> {/* 📐 أيقونة سجل التدقيق بحجم رشيق */}
                  <span>سجل التدقيق</span> {/* 🏷️ اسم التبويب */}
                </Link>

                {/* 📊 تبويب التقارير المصغر */}
                <Link
                  href="/sadmin/reports" // 🔗 رابط التقارير المركزية
                  className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${ // 📐 هوامش وحجم أنيق ومدمج
                    pathname === '/sadmin/reports' ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-950 hover:bg-slate-100 hover:text-black font-black' // 🎨 تمييز التبويب النشط
                  }`}
                >
                  <FileSpreadsheet className="w-4.5 h-4.5" /> {/* 📐 أيقونة التقارير بحجم رشيق */}
                  <span>التقارير</span> {/* 🏷️ اسم التبويب */}
                </Link>
              </>
            )}

            {/* 🏢 قوائم رئيس القسم والمقرر */}
            {isDeptHeadOrRapporteur && (
              <Link
                href="/admin/dashboard"
                className={`px-4 py-2.5 rounded-2xl transition flex items-center gap-2 ${
                  pathname === '/admin/dashboard' || pathname === '/admin/department-portal' ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-950 hover:bg-slate-100 hover:text-black font-black'
                }`}
              >
                <Building2 className="w-5 h-5" />
                لوحة إدارة القسم
              </Link>
            )}

            {/* 👨‍🏫 قوائم الأستاذ */}
            {currentUser.role === 'teacher' && (
              <>
                <Link
                  href="/teacher/dashboard"
                  className={`px-4 py-2.5 rounded-2xl transition flex items-center gap-2 ${
                    pathname === '/teacher/dashboard' || pathname.startsWith('/teacher/courses') ? 'bg-[#0F2942] text-white shadow-xs font-black' : 'text-slate-950 hover:bg-slate-100 hover:text-black font-black'
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                  المواد والدرجات
                </Link>

                <Link
                  href="/teacher/audit-logs"
                  className={`px-4 py-2.5 rounded-2xl transition flex items-center gap-2 ${
                    pathname === '/teacher/audit-logs' ? 'bg-[#0F2942] text-white shadow-xs font-black' : 'text-slate-950 hover:bg-slate-100 hover:text-black font-black'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  سجل التعديلات
                </Link>
              </>
            )}

            {/* 🎓 قوائم الطالب */}
            {currentUser.role === 'student' && (
              <Link
                href="/student/dashboard"
                className={`px-4 py-2.5 rounded-2xl transition flex items-center gap-2 ${
                  pathname === '/student/dashboard' ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-950 hover:bg-slate-100 hover:text-black font-black'
                }`}
              >
                <GraduationCap className="w-5 h-5" />
                لوحة درجاتي وسعي المواد
              </Link>
            )}

          </nav>

          {/* 👤 الملف الشخصي وزر تسجيل الخروج */}
          <div className="flex items-center gap-3">
            
            {/* بطاقة المستخدم السريعة بمحاذاة اليمين الصريحة بحجم مدمج وأنيق */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 rounded-xl border border-slate-300 shadow-2xs">
              <div className="text-right w-full">
                <div className="text-sm sm:text-base font-black text-slate-950 flex items-center justify-start gap-1.5 text-right leading-tight">
                  <span>{currentUser.full_name}</span>
                  {currentUser.role === 'student' && (
                    <span className={`px-2 py-0.5 rounded-md text-xs font-black border flex items-center gap-1 ${
                      (currentUser.study_type || 'morning') === 'evening'
                        ? 'bg-indigo-100 text-indigo-950 border-indigo-300'
                        : 'bg-sky-50 text-sky-950 border-sky-300'
                    }`}>
                      {(currentUser.study_type || 'morning') === 'evening' ? (
                        <Moon className="w-3 h-3 text-indigo-700" />
                      ) : (
                        <Sun className="w-3 h-3 text-sky-600" />
                      )}
                      <span>{(currentUser.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'}</span>
                    </span>
                  )}
                </div>
                {/* 🏷️ المسمى الوظيفي ورئاسة القسم باللون الأسود المعتمد */}
                <div className="text-xs sm:text-sm font-black text-black text-right leading-tight mt-0.5">
                  {currentUser.role === 'super_admin' || currentUser.role === 'admin'
                    ? 'المسؤول العام'
                    : currentUser.role === 'department_head'
                    ? `رئيس قسم ${currentUser.department_name || ''}`
                    : currentUser.role === 'rapporteur'
                    ? `مقرر قسم ${currentUser.department_name || ''}`
                    : currentUser.role === 'teacher'
                    ? 'تدريسي' // 👨‍🏫 عرض صفة تدريسي
                    : 'طالب'}
                </div>
              </div>
            </div>

            {/* زر تسجيل الخروج الفوري */}
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-base font-black shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>

            {/* 📱 زر القائمة للشاشات الصغيرة */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-2xl bg-slate-100 border border-slate-300 text-slate-950 hover:bg-slate-200 transition cursor-pointer font-black"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>

        </div>
      </div>

      {/* 📱 القائمة المنسدلة للشاشات الصغيرة (Mobile Menu Drawer) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white p-5 space-y-4 animate-in slide-in-from-top duration-200">
          
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-3 flex items-center justify-between">
            <div>
              <div className="text-base font-black text-slate-950 flex items-center gap-1.5">
                <span>{currentUser.full_name}</span>
                {currentUser.role === 'student' && (
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-black border flex items-center gap-1 ${
                    (currentUser.study_type || 'morning') === 'evening'
                      ? 'bg-indigo-100 text-indigo-950 border-indigo-300'
                      : 'bg-sky-50 text-sky-950 border-sky-300'
                  }`}>
                    {(currentUser.study_type || 'morning') === 'evening' ? (
                      <Moon className="w-3 h-3 text-indigo-700" />
                    ) : (
                      <Sun className="w-3 h-3 text-sky-600" />
                    )}
                    <span>{(currentUser.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'}</span>
                  </span>
                )}
              </div>
              <div className="text-sm font-black text-slate-800">
                {currentUser.role === 'super_admin' || currentUser.role === 'admin'
                  ? 'المسؤول العام'
                  : currentUser.role === 'department_head'
                  ? 'رئيس قسم'
                  : currentUser.role === 'rapporteur'
                  ? 'مقرر قسم'
                  : currentUser.role === 'teacher'
                  ? 'تدريسي' // 👨‍🏫 تدريسي في قائمة الموبايل
                  : 'طالب'}
              </div>
            </div>
            <span className="px-3 py-1 bg-slate-950 text-white text-sm font-black rounded-xl font-mono">
              {currentUser.university_number || 'معتمد'}
            </span>
          </div>

          {/* 👑 روابط المسؤول العام للموبايل */}
          {isSuperAdmin && (
            <div className="grid grid-cols-2 gap-2.5 text-base font-black">
              <Link
                href="/sadmin/dashboard"
                className={`p-3.5 rounded-2xl flex items-center gap-2.5 ${
                  pathname === '/sadmin/dashboard' ? 'bg-[#0F2942] text-white shadow-xs' : 'bg-slate-50 text-slate-950 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                لوحة الإشراف
              </Link>

              <Link
                href="/sadmin/departments"
                className={`p-3.5 rounded-2xl flex items-center gap-2.5 ${
                  (pathname?.startsWith('/sadmin/departments') || pathname?.startsWith('/admin/departments')) ? 'bg-[#0F2942] text-white shadow-xs' : 'bg-slate-50 text-slate-950 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-5 h-5" />
                الأقسام العلمية
              </Link>

              <Link
                href="/sadmin/department-heads"
                className={`p-3.5 rounded-2xl flex items-center gap-2.5 ${
                  (pathname?.startsWith('/sadmin/department-heads') || pathname?.startsWith('/admin/department-heads')) ? 'bg-[#0F2942] text-white shadow-xs' : 'bg-slate-50 text-slate-950 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-5 h-5" />
                رؤساء الأقسام
              </Link>

              <Link
                href="/sadmin/audit-logs"
                className={`p-3.5 rounded-2xl flex items-center gap-2.5 ${
                  pathname === '/sadmin/audit-logs' ? 'bg-[#0F2942] text-white shadow-xs' : 'bg-slate-50 text-slate-950 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                سجل التدقيق
              </Link>

              <Link
                href="/sadmin/reports"
                className={`p-3.5 rounded-2xl flex items-center gap-2.5 ${
                  pathname === '/sadmin/reports' ? 'bg-[#0F2942] text-white shadow-xs' : 'bg-slate-50 text-slate-950 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5" />
                التقارير
              </Link>
            </div>
          )}

          {/* 🏢 روابط رئيس ومقرر القسم للموبايل */}
          {isDeptHeadOrRapporteur && (
            <div className="space-y-2.5 text-base font-black">
              <Link
                href="/admin/dashboard"
                className={`p-3.5 rounded-2xl flex items-center gap-2.5 ${
                  pathname === '/admin/dashboard' || pathname === '/admin/department-portal' ? 'bg-[#0F2942] text-white shadow-xs' : 'bg-slate-50 text-slate-950 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-5 h-5" />
                لوحة إدارة القسم
              </Link>
            </div>
          )}

          {/* 👨‍🏫 روابط الأستاذ للموبايل */}
          {currentUser.role === 'teacher' && (
            <div className="space-y-2.5 text-base font-black">
              <Link
                href="/teacher/dashboard"
                className={`p-3.5 rounded-2xl flex items-center gap-2.5 font-black ${
                  pathname === '/teacher/dashboard' || pathname.startsWith('/teacher/courses') ? 'bg-[#0F2942] text-white shadow-xs' : 'bg-slate-50 text-slate-950 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                المواد والدرجات
              </Link>

              <Link
                href="/teacher/audit-logs"
                className={`p-3.5 rounded-2xl flex items-center gap-2.5 font-black ${
                  pathname === '/teacher/audit-logs' ? 'bg-[#0F2942] text-white shadow-xs' : 'bg-slate-50 text-slate-950 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                سجل التعديلات
              </Link>
            </div>
          )}

          {/* 🎓 روابط الطالب للموبايل */}
          {currentUser.role === 'student' && (
            <Link
              href="/student/dashboard"
              className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-base font-black ${ pathname === '/student/dashboard' ? 'bg-[#0F2942] text-white shadow-xs' : 'bg-slate-50 text-slate-950 hover:bg-slate-100' }`}
            >
              <GraduationCap className="w-5 h-5" />
              لوحة درجاتي وسعي المواد
            </Link>
          )}

        </div>
      )}
    </header>
  );
}
