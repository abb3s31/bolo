'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🎓 مسار تسجيل دخول الطلاب (/student/login)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا
import StudentLoginPage from '@/app/student/page'; // 📦 استيراد صفحة دخول الطلاب

export default function StudentLoginSubRoutePage() {
  return <StudentLoginPage />;
}
