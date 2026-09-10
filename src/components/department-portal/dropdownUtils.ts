// 📐 دوال مساعدة رياضية لحساب مواضع القوائم المنسدلة الذكية وضمان بقائها داخل الشاشة 100%
// 🛡️ معالجة آمنة لـ SSR ومنع خروج القوائم خارج حدود نافذة المتصفح

// 📐 واجهة إحداثيات ومقاسات القائمة المنسدلة الذكية
export interface SmartDropdownPosition {
  top?: number; // 📍 المسافة من أعلى الشاشة
  bottom?: number; // 📍 المسافة من أسفل الشاشة عند الفتح للأعلى
  left: number; // 📍 المسافة من يسار الشاشة
  width: number; // 📏 العرض المحسوب للقائمة
  maxHeight: number; // 📐 أقصى ارتفاع مسموح به
  openUpwards: boolean; // 🔄 هل تفتح القائمة للأعلى
}

// 📐 دالة الحساب الهندسي الذكي لموضع القائمة المنسدلة
export const calculateSmartDropdownPosition = (
  buttonEl: HTMLElement, // 🔘 عنصر الزر المشغل للقائمة
  preferredHeight = 260, // 📏 الارتفاع النموذجي المفضل للقائمة
  preferredWidth?: number // 📐 العرض المفضل إن وجد
): SmartDropdownPosition => {
  // 🛑 فحص أمان بيئة التشغيل للـ SSR
  if (typeof window === 'undefined') {
    return { top: 0, bottom: undefined, left: 0, width: 200, maxHeight: preferredHeight, openUpwards: false };
  }

  // 📐 استخراج حدود وموقع الزر بالبكسل من الشاشة
  const rect = buttonEl.getBoundingClientRect();
  const viewportHeight = window.innerHeight; // 📱 ارتفاع نافذة العرض
  const viewportWidth = window.innerWidth; // 📱 عرض نافذة العرض

  // 📏 حساب المساحة الصافية المتوفرة أعلى وأسفل الزر داخل الشاشة مع هامش أمان 12px
  const spaceBelow = Math.max(0, viewportHeight - rect.bottom - 12);
  const spaceAbove = Math.max(0, rect.top - 12);

  let openUpwards = false; // 🔄 مؤشر اتجاه الفتح

  // 🚀 اتخاذ القرار: إذا كانت المساحة بالأسفل كافية نفتح للأسفل، وإلا نفتح للأعلى
  if (spaceBelow >= preferredHeight) {
    openUpwards = false;
  } else if (spaceAbove >= preferredHeight) {
    openUpwards = true;
  } else {
    openUpwards = spaceAbove > spaceBelow;
  }

  // 🛡️ تحديد أقصى ارتفاع مسموح به للقائمة لمنع خروجها نهائياً عن الشاشة
  const availableSpace = openUpwards ? spaceAbove : spaceBelow;
  const maxHeight = Math.min(preferredHeight, Math.max(120, availableSpace - 6));

  // 📍 الحساب الرياضي الدقيق لمنع أي طيران أو فجوة:
  const top = openUpwards ? undefined : Math.max(12, rect.bottom + 6);
  const bottom = openUpwards ? Math.max(12, (viewportHeight - rect.top) + 6) : undefined;

  // 📐 العرض المستهدف مع تقييده بأبعاد الشاشة
  const targetWidth = preferredWidth || Math.max(rect.width, 220);
  const left = Math.max(12, Math.min(rect.left, viewportWidth - targetWidth - 12));

  return {
    top,
    bottom,
    left,
    width: targetWidth,
    maxHeight,
    openUpwards,
  };
};

// 📐 دالة الحساب الهندسي الدقيق لموضع قوائم التكليفات والبحث
export const getPreciseDropdownPosition = (
  buttonEl: HTMLElement,
  maxMenuHeight = 280
): SmartDropdownPosition => {
  if (typeof window === 'undefined') {
    return { top: 0, left: 0, width: 300, maxHeight: maxMenuHeight, openUpwards: false };
  }
  const rect = buttonEl.getBoundingClientRect();
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const spaceBelow = vh - rect.bottom;
  const spaceAbove = rect.top;

  const openUpwards = spaceBelow < 220 && spaceAbove > spaceBelow;
  const width = rect.width;
  let left = rect.left;
  if (left + width > vw - 16) {
    left = Math.max(16, vw - width - 16);
  }
  if (left < 16) left = 16;

  if (openUpwards) {
    return {
      bottom: vh - rect.top + 6,
      left,
      width,
      maxHeight: Math.min(maxMenuHeight, Math.max(140, spaceAbove - 24)),
      openUpwards: true,
    };
  } else {
    return {
      top: rect.bottom + 6,
      left,
      width,
      maxHeight: Math.min(maxMenuHeight, Math.max(140, spaceBelow - 24)),
      openUpwards: false,
    };
  }
};
