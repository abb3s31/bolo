import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية

// 🎨 واجهة خصائص الأيقونات الفيكتورية النقية
export interface SvgIconProps {
  className?: string; // 🏷️ كلاسات التنسيق والحجم واللون
  size?: number; // 📏 حجم الأيقونة بالبكسل اختياري
}

// 🟢 1. أيقونة ساعات الحضور الفعلي (AttendancePresentSvg) - أخضر زمردي
export const AttendancePresentSvg: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg // 🎨 عنصر الـ SVG النقي
    viewBox="0 0 24 24" // 📐 أبعاد الإطار
    fill="none" // 🚫 بدون تعبئة خلفية
    stroke="currentColor" // 🖌️ استخدام لون النص الحالي
    strokeWidth="2.2" // 📏 سُمك خط الرسم الواضح
    strokeLinecap="round" // 🔘 نهايات دائرية ناعمة
    strokeLinejoin="round" // 🔘 زوايا التقاء دائرية
    className={className} // 🏷️ الكلاسات الممررة
    width={size} // 📏 العرض
    height={size} // 📏 الارتفاع
  >
    {/* 🛡️ درع الحضور الأكاديمي الحامي */}
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    {/* ✔️ علامة الصح الصريحة للحضور */}
    <polyline points="9 12 11.5 14.5 16 9.5" />
  </svg>
);

// 🔵 2. أيقونة ساعات الإجازة الرسمية والطبية (AttendanceExcusedSvg) - أزرق كحلي ملكي
export const AttendanceExcusedSvg: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg // 🎨 عنصر الـ SVG النقي
    viewBox="0 0 24 24" // 📐 أبعاد الإطار
    fill="none" // 🚫 بدون تعبئة
    stroke="currentColor" // 🖌️ لون الخط
    strokeWidth="2.2" // 📏 سُمك الخط
    strokeLinecap="round" // 🔘 نهايات دائرية
    strokeLinejoin="round" // 🔘 زوايا دائرية
    className={className} // 🏷️ الكلاسات
    width={size} // 📏 العرض
    height={size} // 📏 الارتفاع
  >
    {/* 📄 ملف كتاب الإجازة الرسمية */}
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    {/* 📐 طية الصفحة العلوية */}
    <polyline points="14 2 14 8 20 8" />
    {/* 🏥 خط الصليب الطبي / الإجازة الرسمية */}
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

// 🏖️ 3. أيقونة ساعات العطلة الرسمية وتعطيل الدوام (AttendanceHolidaySvg) - سماوي أزرق بحري نقي
export const AttendanceHolidaySvg: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg // 🎨 عنصر الـ SVG النقي
    viewBox="0 0 24 24" // 📐 أبعاد الإطار
    fill="none" // 🚫 بدون تعبئة
    stroke="currentColor" // 🖌️ لون الخط
    strokeWidth="2.2" // 📏 سُمك الخط
    strokeLinecap="round" // 🔘 نهايات دائرية
    strokeLinejoin="round" // 🔘 زوايا دائرية
    className={className} // 🏷️ الكلاسات
    width={size} // 📏 العرض
    height={size} // 📏 الارتفاع
  >
    {/* 🌴 جذع نخلة العطلة الرسمية الأكاديمية */}
    <path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h11z" />
    {/* 🌴 سعفة النخلة اليمنى */}
    <path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-9" />
    {/* 🌴 جذع النخلة المائل الطبيعي */}
    <path d="M5.8 21a8.9 8.9 0 0 1 6.7-13.8" />
    {/* 🏖️ خط رمال الشاطئ والعطلة الهادئة */}
    <path d="M2 21h20" />
  </svg>
);

// 🔴 4. أيقونة ساعات الغياب غير المبرر (AttendanceAbsenceSvg) - أحمر قرمزي صريح
export const AttendanceAbsenceSvg: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg // 🎨 عنصر الـ SVG النقي
    viewBox="0 0 24 24" // 📐 أبعاد الإطار
    fill="none" // 🚫 بدون تعبئة
    stroke="currentColor" // 🖌️ لون الخط
    strokeWidth="2.2" // 📏 سُمك الخط
    strokeLinecap="round" // 🔘 نهايات دائرية
    strokeLinejoin="round" // 🔘 زوايا دائرية
    className={className} // 🏷️ الكلاسات
    width={size} // 📏 العرض
    height={size} // 📏 الارتفاع
  >
    {/* ⭕ دائرة الإنذار والغياب */}
    <circle cx="12" cy="12" r="10" />
    {/* ❌ خط علامة الضرب المائل الأول */}
    <line x1="15" y1="9" x2="9" y2="15" />
    {/* ❌ خط علامة الضرب المائل الثاني */}
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

// 📋 5. أيقونة زر كشف أيام الطالب التفاعلي (StudentDaysSheetSvg)
export const StudentDaysSheetSvg: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg // 🎨 عنصر الـ SVG النقي
    viewBox="0 0 24 24" // 📐 أبعاد الإطار
    fill="none" // 🚫 بدون تعبئة
    stroke="currentColor" // 🖌️ لون الخط
    strokeWidth="2.2" // 📏 سُمك الخط
    strokeLinecap="round" // 🔘 نهايات دائرية
    strokeLinejoin="round" // 🔘 زوايا دائرية
    className={className} // 🏷️ الكلاسات
    width={size} // 📏 العرض
    height={size} // 📏 الارتفاع
  >
    {/* 📅 إطار التقويم الأكاديمي */}
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    {/* 📌 مشبك التقويم الأيمن */}
    <line x1="16" y1="2" x2="16" y2="6" />
    {/* 📌 مشبك التقويم الأيسر */}
    <line x1="8" y1="2" x2="8" y2="6" />
    {/* ➖ خط فاصل هيدر التقويم */}
    <line x1="3" y1="10" x2="21" y2="10" />
    {/* 🔍 عدسة الفحص والتدقيق لكشف الأيام */}
    <circle cx="11" cy="15" r="2.5" />
    <line x1="13" y1="17" x2="16" y2="20" />
  </svg>
);

// 📢 6. أيقونة إعلان عطلة رسمية وتعطيل الدوام (DeclareHolidaySvg)
export const DeclareHolidaySvg: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg // 🎨 عنصر الـ SVG النقي
    viewBox="0 0 24 24" // 📐 أبعاد الإطار
    fill="none" // 🚫 بدون تعبئة
    stroke="currentColor" // 🖌️ لون الخط
    strokeWidth="2.2" // 📏 سُمك الخط
    strokeLinecap="round" // 🔘 نهايات دائرية
    strokeLinejoin="round" // 🔘 زوايا دائرية
    className={className} // 🏷️ الكلاسات
    width={size} // 📏 العرض
    height={size} // 📏 الارتفاع
  >
    {/* 📅 إطار تقويم العطلة */}
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    {/* ☀️ شمس التعطيل الرسمية النقية في منتصف التقويم */}
    <circle cx="12" cy="16" r="2" />
    <line x1="12" y1="13" x2="12" y2="12" />
    <line x1="12" y1="20" x2="12" y2="19" />
    <line x1="9" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="15" y2="16" />
  </svg>
);

// 🕒 7. أيقونة ساعات وتوقيت المحاضرة (ClockDurationSvg)
export const ClockDurationSvg: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg // 🎨 عنصر الـ SVG النقي
    viewBox="0 0 24 24" // 📐 أبعاد الإطار
    fill="none" // 🚫 بدون تعبئة
    stroke="currentColor" // 🖌️ لون الخط
    strokeWidth="2.2" // 📏 سُمك الخط
    strokeLinecap="round" // 🔘 نهايات دائرية
    strokeLinejoin="round" // 🔘 زوايا دائرية
    className={className} // 🏷️ الكلاسات
    width={size} // 📏 العرض
    height={size} // 📏 الارتفاع
  >
    {/* ⭕ قرص الساعة الدائري */}
    <circle cx="12" cy="12" r="10" />
    {/* ⏱️ عقارب الساعة الأكاديمية */}
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// 🖨️ 8. أيقونة طباعة وتصدير الكشف الأكاديمي (PrintReportSvg)
export const PrintReportSvg: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg // 🎨 عنصر الـ SVG النقي
    viewBox="0 0 24 24" // 📐 أبعاد الإطار
    fill="none" // 🚫 بدون تعبئة
    stroke="currentColor" // 🖌️ لون الخط
    strokeWidth="2.2" // 📏 سُمك الخط
    strokeLinecap="round" // 🔘 نهايات دائرية
    strokeLinejoin="round" // 🔘 زوايا دائرية
    className={className} // 🏷️ الكلاسات
    width={size} // 📏 العرض
    height={size} // 📏 الارتفاع
  >
    {/* 🖨️ رأس الطابعة الأكاديمية ودرج الورق العلوي */}
    <polyline points="6 9 6 2 18 2 18 9" />
    {/* 🖨️ هيكل الطابعة الرئيسي */}
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    {/* 📄 ورقة التقرير المطبوعة الخارجة من الأسفل */}
    <rect x="6" y="14" width="12" height="8" rx="1" />
  </svg>
);

