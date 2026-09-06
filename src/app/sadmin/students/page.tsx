'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🛑 تم إلغاء صفحة شؤون وسجلات الطلاب من صلاحيات المسؤول العام وتوجيهها تلقائياً للوحة الإشراف
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا
import { useEffect } from 'react'; // 🔗 خطافات رياكت
import { useRouter } from 'next/navigation'; // 🛣️ التوجيه التلقائي

export default function SuperAdminStudentsPage() {
  const router = useRouter(); // 🛣️ موجه المسارات

  // 🔀 إعادة التوجيه الفوري للوحة الإشراف الرئيسية
  useEffect(() => {
    router.replace('/sadmin/dashboard');
  }, [router]);

  return null;
}
