// 🔒 مدير قفل واستعادة التمرير العام للنوافذ المنبثقة (Global Modal Scroll Lock Manager)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا

let activeModalCount = 0; // 🔢 عداد النوافذ المنبثقة المفتوحة حالياً

// 🔒 دالة قفل تمرير الصفحة عند فتح أي نافذة منبثقة
export function lockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  activeModalCount++;
  if (activeModalCount === 1) {
    document.body.style.overflow = 'hidden';
  }
}

// 🔓 دالة استعادة التمرير الطبيعي فور إغلاق كافة النوافذ المنبثقة
export function unlockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  activeModalCount = Math.max(0, activeModalCount - 1);
  if (activeModalCount === 0) {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }
}

// 🔄 دالة إعادة ضبط التمرير الإجباري عند التنقل أو حدوث أي استثناء
export function forceUnlockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  activeModalCount = 0;
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}
