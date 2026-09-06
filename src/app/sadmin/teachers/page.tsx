'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

//  صفحة إدارة الكادر التدريسي للمسؤول العام (/sadmin/teachers)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا
import AdminTeachersPage from '@/app/admin/teachers/page'; // 📦 استيراد مكون إدارة الأساتذة

export default function SuperAdminTeachersPage() {
  // 👑 عرض صفحة إدارة الكادر التدريسي
  return <AdminTeachersPage />;
}
