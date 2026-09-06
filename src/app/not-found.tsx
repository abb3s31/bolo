'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم مباشرة

import { useEffect } from 'react'; // 🔗 خطافات رياكت
import Image from 'next/image'; // 🖼️ استيراد مكوّن عرض الصور المحسنة من نكست
import Link from 'next/link'; // 🔗 استيراد مكوّن الروابط للتنقل السريع بين الصفحات
import { Home, AlertCircle } from 'lucide-react'; // 🎨 استيراد الأيقونات المتناسقة مع هوية المنظومة

// 🚀 المكوّن الافتراضي لصفحة خطأ 404
export default function NotFound() {
  // 🏷️ تعيين عنوان نافذة المتصفح لصفحة 404
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'الصفحة غير موجودة (404) | جامعة الإمام جعفر الصادق (ع) - فرع ميسان';
    }
  }, []);

  // 🎨 إرجاع هيكل الواجهة لصفحة الخطأ المتناسقة
  return (
    // 🧱 الحاوية الرئيسية لكامل الصفحة متمركزة 100% في منتصف الشاشة عمودياً وأفقياً
    <div className="flex-1 min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 py-8 px-4 font-sans select-none text-center">
      
      {/* 🏛️ بطاقة الخطأ الأكاديمية الفاخرة المنسقة بألوان متناسقة مع الصفحة */}
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* 🔝 1. هوية واسم الجامعة في أعلى البطاقة وبشكل واضح ومكبّر وبدون حدود سوداء */}
        <div className="space-y-3 pb-4 border-b border-slate-100">
          
          {/* 🖼️ حاوية شعار الجامعة النظيف والمكبّر بدون أي إطار أو حدود سوداء */}
          <div className="flex justify-center">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
              <Image
                src="/logo.webp"
                alt="شعار جامعة الإمام جعفر الصادق (ع) - فرع ميسان"
                width={128}
                height={128}
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* 🏛️ نص اسم الجامعة بحجم مكبّر وواضح جداً وبارز في الأعلى */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 leading-tight">
              جامعة الإمام جعفر الصادق (ع)
            </h2>
            <p className="text-base font-black text-slate-700">
              فرع ميسان — المنظومة الأكاديمية المركزية
            </p>
          </div>

        </div>

        {/* 🔢 2. رمز الخطأ 404 بنص مكبّر وألوان رمادية كحلية متناسقة */}
        <div className="space-y-3">
          
          {/* 🏷️ شارة الخطأ البارزة بنص مكبّر متناسق تماماً مع هوية الموقع */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-300 rounded-2xl text-slate-800 text-base font-black shadow-xs">
            <AlertCircle className="w-5 h-5 text-slate-700" />
            <span>خطأ 404 — الصفحة غير موجودة</span>
          </div>

          {/* 📢 العنوان الرئيسي لتنبيه عدم توفر الصفحة */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950">
            الصفحة المطلوبة غير متوفرة
          </h1>

          {/* 📝 الشرح التوضيحي للخطأ بلون ناعم ومريح */}
          <p className="text-base text-slate-700 font-black leading-relaxed max-w-sm mx-auto">
            يبدو أن الرابط الذي حاولت الوصول إليه غير صحيح أو تم نقله في المنظومة الأكاديمية.
          </p>

        </div>

        {/* 🔀 3. زر العودة للبوابة الرئيسية مع أيقونة كحلية متناسقة */}
        <div className="pt-2 space-y-4">
          <Link
            href="/"
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-md transition cursor-pointer"
          >
            <Home className="w-5 h-5 text-slate-200" />
            <span>العودة للبوابة الرئيسية</span>
          </Link>

          {/* 🌐 روابط البوابات المباشرة */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-base font-black text-slate-950 mb-3">أو التوجه المباشر لبوابتك:</p>
            <div className="grid grid-cols-2 gap-2 text-base font-black">
              <Link
                href="/sadmin"
                className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 transition flex items-center justify-center"
              >
                👑 المسؤول العام
              </Link>
              <Link
                href="/admin"
                className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 transition flex items-center justify-center"
              >
                🏢 رئيس / مقرر القسم
              </Link>
              <Link
                href="/?portal=teacher"
                className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 transition flex items-center justify-center font-bold"
              >
                بوابة الأساتذة
              </Link>
              <Link
                href="/?portal=student"
                className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 transition flex items-center justify-center font-bold"
              >
                🎓 بوابة الطلاب
              </Link>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
