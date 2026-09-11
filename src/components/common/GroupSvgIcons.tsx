import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية

// 🎨 واجهة خصائص الأيقونات القياسية
interface SvgIconProps {
  className?: string; // 🏷️ كلاسات التنسيق وحجم الأيقونة
  size?: number; // 📏 حجم الأيقونة المخصص بالبكسل
}

// 👥 أيقونة مجموعة الطلاب والكروب الأكاديمي
export const GroupUsersSvg: React.FC<SvgIconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg // 🎨 عنصر الـ SVG النقي
    viewBox="0 0 24 24" // 📐 أبعاد الإطار الداخلي
    fill="none" // ⚪ بدون تعبئة خلفية
    stroke="currentColor" // 🖌️ استخدام لون الخط الحالي المتناسق
    strokeWidth="2" // ✍️ سماكة الخط القياسية
    strokeLinecap="round" // ⭕ حواف ناعمة للأطراف
    strokeLinejoin="round" // 🔗 زوايا دائرية جميلة
    className={className} // 📦 تطبيق كلاسات تايلوند
    width={size} // 📏 العرض المخصص
    height={size} // 📐 الارتفاع المخصص
  >
    {/* 👤 الشخص الأساسي في المجموعة */}
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    {/* 👥 الأعضاء الإضافيون في الكروب */}
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// 🗓️ أيقونة الجدول الأسبوعي المخصص للكروب
export const GroupScheduleSvg: React.FC<SvgIconProps> = ({ className = 'w-5 h-5', size }) => (
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
    {/* 📅 إطار التقويم الأسبوعي */}
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    {/* 🔠 تمثيل أعمدة الكروبات بالجدول */}
    <line x1="9" y1="14" x2="9" y2="18" />
    <line x1="15" y1="14" x2="15" y2="18" />
  </svg>
);

// 📋 أيقونة سجل الحضور والغياب الخاص بالكروب
export const GroupAttendanceSvg: React.FC<SvgIconProps> = ({ className = 'w-5 h-5', size }) => (
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
    {/* 📝 لوح الحضور الخشبي الأكاديمي */}
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    {/* ✅ علامات صح الحضور للكروب */}
    <path d="m9 14 2 2 4-4" />
    <line x1="9" y1="19" x2="15" y2="19" />
  </svg>
);

// ⚙️ أيقونة إعدادات وتخصيص شعب وكروبات المرحلة
export const GroupSettingsSvg: React.FC<SvgIconProps> = ({ className = 'w-5 h-5', size }) => (
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
    {/* 🧩 مسارات الترس الهيكلي النظيف */}
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// 🔀 أيقونة التوزيع التلقائي المتوازن للطلاب بين الكروبات
export const AutoBalanceSvg: React.FC<SvgIconProps> = ({ className = 'w-5 h-5', size }) => (
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
    {/* ⚖️ أسهم التوزيع المتوازن للجهد الطلابي */}
    <path d="m16 3 4 4-4 4" />
    <path d="M20 7H4" />
    <path d="m8 21-4-4 4-4" />
    <path d="M4 17h16" />
  </svg>
);

// ➕ أيقونة إضافة كروب جديد بنقرة زر
export const AddGroupSvg: React.FC<SvgIconProps> = ({ className = 'w-5 h-5', size }) => (
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
    {/* ➕ إشارة الزائد مع دائرة محكمة */}
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

// 🛡️ شارة الكروب الأكاديمي الموحد (Group Badge)
export const GroupBadgeSvg: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
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
    {/* 🏷️ شارة الدرع الأكاديمي الحصين */}
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ☀️ أيقونة الشمس للدراسة الصباحية
export const SunSvg: React.FC<SvgIconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg // 🎨 عنصر الـ SVG للشمس
    viewBox="0 0 24 24" // 📐 أبعاد الإطار الداخلي
    fill="none" // ⚪ بدون تعبئة مبدئية
    stroke="currentColor" // 🖌️ استخدام لون السترينغ الحالي
    strokeWidth="2" // ✍️ سماكة الخط الواضحة
    strokeLinecap="round" // ⭕ تدوير أطراف الخطوط
    strokeLinejoin="round" // 🔗 تدوير الزوايا المتقاطعة
    className={className} // 📦 كلاسات التايلوند
    width={size} // 📏 العرض المخصص
    height={size} // 📐 الارتفاع المخصص
  >
    {/* 🟡 قرص الشمس المركزي */}
    <circle cx="12" cy="12" r="5" />
    {/* ☀️ أشعة الشمس الصباحية المشرقة */}
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

// 🌙 أيقونة الهلال للدراسة المسائية
export const MoonSvg: React.FC<SvgIconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg // 🎨 عنصر الـ SVG للقمر
    viewBox="0 0 24 24" // 📐 أبعاد الإطار الداخلي
    fill="none" // ⚪ بدون تعبئة
    stroke="currentColor" // 🖌️ استخدام اللون المتناسق
    strokeWidth="2" // ✍️ سماكة الخط
    strokeLinecap="round" // ⭕ حواف ناعمة
    strokeLinejoin="round" // 🔗 زوايا دائرية
    className={className} // 📦 كلاسات التايلوند
    width={size} // 📏 العرض
    height={size} // 📐 الارتفاع
  >
    {/* 🌙 مسار انحناء الهلال المسائي */}
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

// 💡 أيقونة المصباح الإرشادي لتنبيهات مسار بولونيا
export const BulbSvg: React.FC<SvgIconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg // 🎨 عنصر الـ SVG للمصباح
    viewBox="0 0 24 24" // 📐 أبعاد الإطار الداخلي
    fill="none" // ⚪ بدون تعبئة داخلية
    stroke="currentColor" // 🖌️ استخدام لون السترينغ
    strokeWidth="2" // ✍️ سماكة الخط القياسية
    strokeLinecap="round" // ⭕ حواف ناعمة للأطراف
    strokeLinejoin="round" // 🔗 زوايا دائرية متصلة
    className={className} // 📦 كلاسات التايلوند
    width={size} // 📏 العرض المخصص
    height={size} // 📐 الارتفاع المخصص
  >
    {/* 💡 زجاج المصباح وتوهج الفكرة */}
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
  </svg>
);

// 🏛️ أيقونة الشعبة العامة الموحدة (بدون كروب)
export const GeneralCohortSvg: React.FC<SvgIconProps> = ({ className = 'w-4 h-4', size }) => (
  <svg // 🎨 عنصر الـ SVG للشعبة العامة
    viewBox="0 0 24 24" // 📐 أبعاد الإطار الداخلي
    fill="none" // ⚪ بدون تعبئة
    stroke="currentColor" // 🖌️ استخدام لون الخط
    strokeWidth="2" // ✍️ سماكة الخط
    strokeLinecap="round" // ⭕ حواف ناعمة
    strokeLinejoin="round" // 🔗 زوايا دائرية
    className={className} // 📦 كلاسات التايلوند
    width={size} // 📏 العرض
    height={size} // 📐 الارتفاع
  >
    {/* 🏛️ تمثيل قاعة المحاضرات المشتركة والطبقات العامة */}
    <path d="M4 18v3" />
    <path d="M8 18v3" />
    <path d="M12 18v3" />
    <path d="M16 18v3" />
    <path d="M20 18v3" />
    <path d="M2 18h20" />
    <path d="M12 2 2 7h20L12 2z" />
    <path d="M6 10v4" />
    <path d="M10 10v4" />
    <path d="M14 10v4" />
    <path d="M18 10v4" />
  </svg>
);

// ✖️ أيقونة الإلغاء أو الحذف السريع للكروب
export const CloseSmallSvg: React.FC<SvgIconProps> = ({ className = 'w-3.5 h-3.5', size }) => (
  <svg // 🎨 عنصر الـ SVG لعلامة الإغلاق
    viewBox="0 0 24 24" // 📐 أبعاد الإطار الداخلي
    fill="none" // ⚪ بدون تعبئة
    stroke="currentColor" // 🖌️ استخدام لون الخط
    strokeWidth="2.5" // ✍️ سماكة قوية للوضوح
    strokeLinecap="round" // ⭕ حواف ناعمة
    strokeLinejoin="round" // 🔗 زوايا دائرية
    className={className} // 📦 كلاسات التايلوند
    width={size} // 📏 العرض
    height={size} // 📐 الارتفاع
  >
    {/* ❌ خطي التقاطع النظيفين */}
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
