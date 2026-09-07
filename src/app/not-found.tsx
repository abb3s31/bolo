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
    // 🧱 الحاوية الرئيسية لكامل الصفحة متمركزة 100% في منتصف الشاشة بدون أي سكرول
    <div className="flex-1 min-h-screen sm:h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4 font-sans select-none text-center overflow-y-auto sm:overflow-hidden">
      
      {/* 🏛️ بطاقة الخطأ الأكاديمية الفاخرة المنسقة بألوان متناسقة مع الصفحة */}
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
        
        {/* 🔝 1. هوية واسم الجامعة في أعلى البطاقة وبشكل واضح ومكبّر وبدون حدود سوداء */}
        <div className="space-y-2 pb-3 border-b border-slate-100">
          
          {/* 🖼️ حاوية شعار الجامعة النظيف والمكبّر بدون أي إطار أو حدود سوداء */}
          <div className="flex justify-center">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
              <Image
                src="/logo.webp"
                alt="شعار جامعة الإمام جعفر الصادق (ع) - فرع ميسان"
                width={96}
                height={96}
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* 🏛️ نص اسم الجامعة بحجم مكبّر وواضح جداً وبارز في الأعلى */}
          <div className="space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 leading-tight">
              جامعة الإمام جعفر الصادق (ع)
            </h2>
            <p className="text-sm sm:text-base font-black text-slate-700">
              فرع ميسان — المنظومة الأكاديمية المركزية
            </p>
          </div>

        </div>

        {/* 🔢 2. رمز الخطأ 404 بنص مكبّر وألوان رمادية كحلية متناسقة */}
        <div className="space-y-2">
          
          {/* 🏷️ شارة الخطأ البارزة بنص مكبّر متناسق تماماً مع هوية الموقع */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 border border-slate-300 rounded-2xl text-slate-800 text-sm sm:text-base font-black shadow-xs">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
            <span>خطأ 404 — الصفحة غير موجودة</span>
          </div>

          {/* 📢 العنوان الرئيسي لتنبيه عدم توفر الصفحة */}
          <h1 className="text-xl sm:text-2xl font-black text-slate-950">
            الصفحة المطلوبة غير متوفرة
          </h1>

          {/* 📝 الشرح التوضيحي للخطأ بلون ناعم ومريح */}
          <p className="text-sm sm:text-base text-slate-700 font-black leading-relaxed max-w-sm mx-auto">
            يبدو أن الرابط الذي حاولت الوصول إليه غير صحيح أو تم نقله في المنظومة الأكاديمية.
          </p>

        </div>

        {/* 🔀 3. زر العودة للبوابة الرئيسية مع أيقونة كحلية وتصميم احترافي مركّز */}
        <div className="pt-1">
          {/* 🔗 رابط التنقل المباشر لصفحة البداية الرسمية للمنظومة */}
          <Link
            href="/"
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-md transition cursor-pointer"
          >
            {/* 🏠 أيقونة البيت الأنيقة */}
            <Home className="w-5 h-5 text-slate-200" />
            {/* 📝 نص العودة للبوابة الرئيسية */}
            <span>العودة للبوابة الرئيسية</span>
          </Link>
        </div>

      </div>

    </div>
  );
}
