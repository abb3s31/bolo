import React from 'react'; // ⚛️ استيراد ريآكت الأساسي

// 🎨 واجهة خصائص الأيقونات الفيكتورية النقية
export interface SvgIconProps {
  className?: string; // 🏷️ كلاسات التنسيق والحجم بتايلوند
  size?: number; // 📏 حجم الأيقونة بالبكسل
}

// 🗓️ أيقونة التقويم الأكاديمي لأسابيع الفصل (CalendarDaysSvg)
export const CalendarDaysSvg: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
  >
    {/* 📅 إطار التقويم الرئيسي */}
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    {/* 🔘 نقاط أيام المحاضرات */}
    <path d="M8 14h.01" />
    <path d="M12 14h.01" />
    <path d="M16 14h.01" />
    <path d="M8 18h.01" />
    <path d="M12 18h.01" />
    <path d="M16 18h.01" />
  </svg>
);

// ✅ أيقونة علامة الصح الدائرية الأكاديمية (CheckCircle2Svg)
export const CheckCircle2Svg: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
  >
    {/* ⭕ الدائرة المحيطة */}
    <circle cx="12" cy="12" r="10" />
    {/* ✔️ مسار علامة الصح النقي */}
    <path d="m9 12 2 2 4-4" />
  </svg>
);

// 📚 أيقونة الطبقات والأسابيع التراكمية (LayersSvg)
export const LayersSvg: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
  >
    {/* 📦 الطبقة العلوية */}
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    {/* 📦 الطبقة الوسطى */}
    <polyline points="2 17 12 22 22 17" />
    {/* 📦 الطبقة السفلية */}
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

// ✋ أيقونة اليد للتحديد اليدوي الحر (HandCustomSvg)
export const HandCustomSvg: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
  >
    {/* ✋ أصابع وكف اليد المخصص */}
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
);

// 🔽 أيقونة السهم المنسدل الفيكتوري النقي (ChevronDownSvg)
export const ChevronDownSvg: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
  >
    {/* 🔻 زاوية السهم لأسفل */}
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// 📌 أيقونة التثبيت للأسبوع الحالي (PinSvg)
export const PinSvg: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
  >
    {/* 📌 رأس الدبوس */}
    <line x1="12" y1="17" x2="12" y2="22" />
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
  </svg>
);

// 🌟 أيقونة النجوم والأولويات (SparkleSvg)
export const SparkleSvg: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
  >
    {/* ✨ بريق النجم الرباعي */}
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

// 🗓️ أيقونة التقويم الفردي البسيط (CalendarSingleSvg)
export const CalendarSingleSvg: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
