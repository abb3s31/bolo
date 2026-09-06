'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 📘 صفحة إدارة المواد والمقررات الدراسية للمسؤول العام (/sadmin/courses)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا
import AdminCoursesPage from '@/app/admin/courses/page'; // 📦 استيراد مكون إدارة المواد

export default function SuperAdminCoursesPage() {
  // 👑 عرض صفحة إدارة المواد والمقررات الدراسية
  return <AdminCoursesPage />;
}
