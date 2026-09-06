// 🏛️ التخطيط الهيكلي الرئيسي لجميع الصفحات - جامعة الإمام جعفر الصادق (ع) فرع ميسان

import type { Metadata } from 'next'; // 🏷️ الميتا داتا الرسمية للموقع
import './globals.css'; // 🎨 الملف التنسيقي العام
import Header from '@/components/Header'; // 🔝 الهيدر العلوي للجامعة

// 🏷️ معلومات SEO والميتا داتا الرسمية للجامعة
export const metadata: Metadata = {
  title: 'نظام إدارة الدرجات (مسار بولونيا) | جامعة الإمام جعفر الصادق (ع) - فرع ميسان',
  description: 'المنصة الرسمية لإدارة ومتابعة درجات الطلاب والأستاذة والنتائج الأكاديمية بنظام الكورسات والساعات المعتمدة لجامعة الإمام جعفر الصادق فرع ميسان.',
  keywords: ['جامعة الصادق', 'فرع ميسان', 'مسار بولونيا', 'نظام الدرجات', 'العراق'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 🛡️ تفعيل الوضع الفاتح الشامل والأنيق مع منع وميض الهيدريشن
    <html lang="ar" dir="rtl" className="h-full" suppressHydrationWarning>
      <body className="h-full flex flex-col bg-slate-50 text-slate-900 antialiased font-sans selection:bg-slate-900 selection:text-white" suppressHydrationWarning>
        
        {/* 🔝 الهيدر العلوي المزود بالشعار للجامعة (يظهر فقط عند تسجيل الدخول) */}
        <Header />

        {/* 📦 المحتوى المتغير للصفحات بدون هوامش زائدة تشوه صفحة الدخول */}
        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>

      </body>
    </html>
  );
}
