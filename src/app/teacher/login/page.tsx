'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

//  مسار تسجيل دخول الأساتذة والتدريسيين (/teacher/login)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا
import TeacherLoginPage from '@/app/teacher/page'; // 📦 استيراد صفحة دخول الأساتذة

export default function TeacherLoginSubRoutePage() {
  return <TeacherLoginPage />;
}
