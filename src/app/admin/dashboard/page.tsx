'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🏢 لوحة تحكم رئيس القسم والمقرر الأكاديمية المركزية (/admin/dashboard)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا
import DepartmentPortalPage from '@/app/admin/department-portal/page'; // 📦 استيراد لوحة إدارة القسم الشاملة

export default function AdminDepartmentDashboard() {
  // 🚀 عرض لوحة إدارة القسم المحمية بالكامل لرئيس القسم والمقرر حصراً
  return <DepartmentPortalPage />;
}
