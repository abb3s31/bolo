'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🏢 مسار تسجيل دخول رؤساء الأقسام والمقررين (/admin/login)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا
import DepartmentHeadsLoginPage from '@/app/admin/page'; // 📦 استيراد صفحة تسجيل دخول الإدارة

export default function AdminLoginSubRoutePage() {
  return <DepartmentHeadsLoginPage />;
}
