// 🔒 مدير قفل واستعادة التمرير العام للنوافذ المنبثقة (Global Modal Scroll Lock Manager)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا

let activeModalCount: number = 0; // 🔢 عداد النوافذ المنبثقة المفتوحة حالياً حتى نعرف شوكت نقفل وشوكت نفتح التمرير
let savedScrollY: number = 0; // 📍 تخزين إحداثيات موقع السكرول الدقيق بالمليمتر قبل لا ينفتح الكارد
let lastFocusedElement: HTMLElement | null = null; // 🎯 حفظ الزر أو العنصر اللي داس عليه المستخدم حتى لا يطير التركيز لبداية الصفحة

// 🔒 دالة قفل تمرير الصفحة عند فتح أي نافذة منبثقة أو كارد عائم
export function lockBodyScroll(): void {
  // 🛡️ نتأكد الكود يشتغل داخل بيئة المتصفح مو بالسيرفر
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  // 🔢 نزيد عداد النوافذ المفتوحة بواحد
  activeModalCount++;

  // 🚪 إذا جانت هاي أول نافذة تنفتح حالياً نسجل موقع السكرول ونقفل
  if (activeModalCount === 1) {
    // 📍 نقيس موقع السكرول الحالي للصفحة بكل دقة حتى نحفظه
    const scrollY: number = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    savedScrollY = scrollY; // 💾 نحفظ مكان المستخدم حتى نرجعه لنفس النقطة بالتمام

    // 🎯 نحفظ الزر اللي انضغط عليه حتى نحافظ على الفوكس بمكانه
    lastFocusedElement = (document.activeElement as HTMLElement) || null;

    // 🔒 نقفل تمرير البودي لمنع التمرير الخلفي غير المرغوب
    document.body.style.overflow = 'hidden';
  }
}

// 🔓 دالة استعادة التمرير الطبيعي فور إغلاق كافة النوافذ المنبثقة
export function unlockBodyScroll(): void {
  // 🛡️ نتأكد الكود يشتغل داخل بيئة المتصفح مو بالسيرفر
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  // 🔢 ننقص عداد النوافذ المفتوحة ومنخليه ينزل جوه الصفر أبداً
  activeModalCount = Math.max(0, activeModalCount - 1);

  // 🚪 إذا تسدت كل النوافذ المنبثقة وصار العداد صفر، نفتح التمرير ونرجع السكرول لمكانه
  if (activeModalCount === 0) {
    // 🔓 نرجع التمرير الطبيعي لصفحة الويب
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    // 📍 نأخذ نسخة من الموضع المحفوظ قبل تصفيره
    const targetY: number = savedScrollY;
    const targetElement: HTMLElement | null = lastFocusedElement;

    // 🧹 نصفر المتغيرات المحفوظة للدورة الجاية
    savedScrollY = 0;
    lastFocusedElement = null;

    // 🚀 إذا جان السكرول نازل بالصفحة نرجعه فوراً وبشكل حاسم لنفس المكان
    if (targetY > 0) {
      // ⚡ استرجاع أولي فوري ومباشر
      window.scrollTo({ top: targetY, behavior: 'instant' });

      // 🔄 استرجاع مؤكد مع فريم التحديث لمنع أي قفز من المتصفح
      requestAnimationFrame(() => {
        window.scrollTo({ top: targetY, behavior: 'instant' });
        // 🎯 نرجع التركيز للزر اللي نقر عليه بدون ميسوي سكرول افتراضي
        if (targetElement && typeof targetElement.focus === 'function') {
          try {
            targetElement.focus({ preventScroll: true });
          } catch {
            // 🛡️ نتجاهل أي خطأ إذا جان العنصر انحذف من الصفحة
          }
        }
      });

      // ⏱️ استرجاع إضافي بعد رندر المتصفح حتى نضمن 100% يثبت السكرول بمكانه
      setTimeout(() => {
        window.scrollTo({ top: targetY, behavior: 'instant' });
      }, 15);
    }
  }
}

// 🔄 دالة إعادة ضبط التمرير الإجباري عند التنقل أو حدوث أي استثناء
export function forceUnlockBodyScroll(): void {
  // 🛡️ نتأكد الكود يشتغل بالمتصفح
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  // 📍 نأخذ نسخة من السكرول المحفوظ
  const targetY: number = savedScrollY;

  // 🔢 نصفر العداد والمتغيرات بالكامل
  activeModalCount = 0;
  savedScrollY = 0;
  lastFocusedElement = null;

  // 🔓 نلغي قفل التمرير
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';

  // 🚀 إذا جان اكو سكرول مسجل نرجعه فورياً
  if (targetY > 0) {
    window.scrollTo({ top: targetY, behavior: 'instant' });
  }
}
