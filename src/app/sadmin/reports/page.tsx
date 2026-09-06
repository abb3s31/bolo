'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 📊 صفحة استخراج التقارير المركزية للمسؤول العام (/sadmin/reports)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا
import AdminReportsPage from '@/app/admin/reports/page'; // 📦 استيراد مكون التقارير

export default function SuperAdminReportsPage() {
  // 👑 عرض صفحة استخراج وتصدير التقارير
  return <AdminReportsPage />;
}
