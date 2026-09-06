'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 👥 صفحة إدارة رؤساء الأقسام والمقررين للمسؤول العام (/sadmin/department-heads)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا
import DepartmentHeadsManagementPage from '@/app/admin/department-heads/page'; // 📦 استيراد مكون إدارة القيادات

export default function SuperAdminDepartmentHeadsPage() {
  // 👑 عرض صفحة إدارة رؤساء الأقسام والمقررين
  return <DepartmentHeadsManagementPage />;
}
