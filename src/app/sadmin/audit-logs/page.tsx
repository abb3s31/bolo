'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🛡️ صفحة سجل التدقيق الحصين للمسؤول العام (/sadmin/audit-logs)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا
import AdminAuditLogsPage from '@/app/admin/audit-logs/page'; // 📦 استيراد مكون سجل التدقيق

export default function SuperAdminAuditLogsPage() {
  // 👑 عرض صفحة سجل التدقيق الحصين
  return <AdminAuditLogsPage />;
}
