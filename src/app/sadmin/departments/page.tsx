'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🏢 صفحة إدارة الأقسام العلمية التابعة للمسؤول العام (/sadmin/departments)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا
import AdminDepartmentsPage from '@/app/admin/departments/page'; // 📦 استيراد مكون إدارة الأقسام

export default function SuperAdminDepartmentsPage() {
  // 👑 عرض صفحة إدارة الأقسام العلمية مع حماية المسؤول العام
  return <AdminDepartmentsPage />;
}
