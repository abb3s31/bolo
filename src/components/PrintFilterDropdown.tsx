'use client'; // 🚀 تفعيل تشغيل المكون على جهة العميل

// 📦 استيراد الخطافات الأساسية من مكتبة رياكت
import React, { useState, useRef, useEffect, useCallback } from 'react';
// 🚪 استيراد createPortal لعرض القائمة خارج أي حاوية مقصوصة فوق كل شيء بالصفحة
import { createPortal } from 'react-dom';
// 🎨 استيراد أيقونات الأسهم والتأكيد من مكتبة لوسيد آيكونز
import { ChevronDown, Check } from 'lucide-react';

// 🏷️ تعريف واجهة كل خيار داخل القائمة المنسدلة بدون أي أنواع غير آمنة
export interface PrintFilterOption<T extends string | number> {
  id: T; // 🆔 المعرف الفريد للخيار
  label: string; // 📝 النص الواضح للخيار
  count: number; // 🔢 عدد الطلاب التابعين لهذا الخيار
  icon?: React.ReactNode; // 🎨 أيقونة اختيارية بجانب النص
}

// 📋 تعريف الخصائص المستلمة للمكون المنسدل الاحترافي
export interface PrintFilterDropdownProps<T extends string | number> {
  labelPrefix?: string; // 🏷️ بادئة اختيارية قبل الاسم
  options: PrintFilterOption<T>[]; // 📚 قائمة الخيارات المتاحة
  selectedValue: T; // 🎯 القيمة المختارة حالياً
  onSelect: (value: T) => void; // ⚡ دالة التغيير عند اختيار عنصر جديد
  icon?: React.ReactNode; // 🖼️ أيقونة رئيسية تظهر على الزر
  ariaLabel?: string; // ♿ وصف للوصول السهل لذوي الاحتياجات
}

// 💎 مكون القائمة المنسدلة الاحترافية بتصميم عائم فوق الجميع Z-99999999
export function PrintFilterDropdown<T extends string | number>({
  labelPrefix,
  options,
  selectedValue,
  onSelect,
  icon,
  ariaLabel,
}: PrintFilterDropdownProps<T>): React.ReactElement {
  // 🔘 حالة فتح أو إغلاق القائمة المنسدلة
  const [isOpen, setIsOpen] = useState<boolean>(false);
  // 🌐 حالة التحقق من اكتمال التثبيت بالمتصفح لاستخدام البورتال بأمان
  const [isMounted, setIsMounted] = useState<boolean>(false);
  // 📍 إحداثيات الزر على الشاشة لوضع القائمة تحته مباشرة
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number; minWidth: number }>({
    top: 0,
    right: 0,
    minWidth: 220,
  });

  // 🔘 مرجع زر الفتح
  const buttonRef = useRef<HTMLButtonElement>(null);
  // 📜 مرجع صندوق القائمة المنسدلة المنبثقة
  const menuRef = useRef<HTMLDivElement>(null);

  // 🔍 العثور على الخيار المختار حالياً لعرض بياناته على الزر
  const currentOption = options.find((opt) => opt.id === selectedValue) || options[0];

  // ⚡ تفعيل حالة التثبيت بالعميل
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 📐 دالة حساب موقع الزر بدقة متناهية على مستوى الشاشة
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuCoords({
        top: rect.bottom + 6, // 📏 مسافة 6 بكسل تحت الزر مباشرة
        right: Math.max(8, window.innerWidth - rect.right), // 📐 محاذاة حافة اليمين مع حافة الزر بدقة
        minWidth: Math.max(rect.width, 240), // 📐 عرض القائمة لا يقل عن عرض الزر أو 240 بكسل
      });
    }
  }, []);

  // 🔄 تحديث الموقع عند الفتح أو التمرير أو تغيير أبعاد الشاشة
  useEffect(() => {
    if (!isOpen) return;

    updatePosition(); // 📐 حساب فوري للموقع

    // 📜 دالة التعامل مع التمرير وتغيير الحجم
    const handleScrollOrResize = () => {
      updatePosition();
    };

    // 👂 الاستماع للتمرير بكل النوافذ وتغيير الحجم
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // 🛡️ الاستماع للنقر خارج القائمة أو زر هروب لإغلاقها
  useEffect(() => {
    if (!isOpen) return;

    // 🖱️ دالة فحص النقر خارج حدود الزر وصندوق القائمة
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(target);
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(target);

      if (isOutsideButton && isOutsideMenu) {
        setIsOpen(false); // 🔒 إغلاق القائمة فوراً
      }
    }

    // ⌨️ دالة إغلاق القائمة عند الضغط على مفتاح Escape
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false); // 🔒 إغلاق القائمة فوراً
      }
    }

    // 👂 تسجيل المستمعات
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    // 🧹 تنظيف المستمعات لمنع تسريب الذاكرة
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    // 📦 الحاوية النسبية للزر
    <div className="relative inline-block text-right select-none" dir="rtl">
      {/* 🔘 الزر الرئيسي لفتح وتفعيل القائمة المنسدلة */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          updatePosition();
          setIsOpen((prev) => !prev);
        }}
        aria-expanded={isOpen}
        aria-label={ariaLabel || currentOption?.label}
        className={`group flex items-center justify-between gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-white border-2 rounded-xl sm:rounded-2xl transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md select-none ${
          isOpen
            ? 'border-[#0F2942] ring-2 ring-[#0F2942]/10 bg-slate-50/80'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        {/* 🎨 الجانب الأيمن: الأيقونة مع التسمية الحالية */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 🖼️ عرض الأيقونة الرئيسية إن وُجدت */}
          {icon && (
            <span className="text-slate-700 group-hover:text-[#0F2942] transition-colors shrink-0">
              {icon}
            </span>
          )}
          {/* 📝 عرض البادئة واسم الخيار المختار */}
          <span className="text-xs sm:text-sm font-black text-slate-900 whitespace-nowrap">
            {labelPrefix ? `${labelPrefix}: ` : ''}
            {currentOption ? currentOption.label.replace(/\s*\(العدد الكلي\)\s*/g, '') : ''}
          </span>
        </div>

        {/* 🔢 الجانب الأيسر: بادج العدد وسهم الفتح الهابط */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 🏷️ شارة عدد الطلاب التابعين لهذا الفلتر المختار */}
          {currentOption && (
            <span className="px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-black bg-cyan-50 text-cyan-900 border border-cyan-200/80 group-hover:bg-cyan-100 transition-colors">
              {currentOption.count}
            </span>
          )}

          {/* 🔽 أيقونة السهم مع حركة دوران ناعمة عند فتح القائمة */}
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-[#0F2942]' : 'group-hover:text-slate-700'
            }`}
          />
        </div>
      </button>

      {/* 📜 صندوق القائمة المنسدلة المنبثق عبر البورتال ليظهر فوق الكل بنظام Z-99999999 بدون أي قص */}
      {isOpen && isMounted && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          role="menu"
          dir="rtl"
          style={{
            position: 'fixed',
            top: `${menuCoords.top}px`,
            right: `${menuCoords.right}px`,
            minWidth: `${menuCoords.minWidth}px`,
            zIndex: 99999999, // 🔝 ظهور قطعي فوق الكل وفوق كافة النوافذ المنبثقة
          }}
          className="bg-white rounded-2xl border-2 border-slate-300 shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto"
        >
          {/* 📋 تكرار وعرض كل خيار مع عدده بدقة واحترافية */}
          <div className="flex flex-col gap-1">
            {options.map((option) => {
              // 🎯 فحص هل هذا العنصر هو المختار حالياً
              const isSelected = option.id === selectedValue;

              return (
                // 🔘 زر اختيار العنصر
                <button
                  key={String(option.id)}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSelect(option.id); // ⚡ تنفيذ دالة التغيير وتمرير القيمة
                    setIsOpen(false); // 🔒 إغلاق القائمة فوراً
                  }}
                  className={`group w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer text-right ${
                    isSelected
                      ? 'bg-[#0F2942] text-white shadow-xs'
                      : 'text-slate-800 hover:bg-cyan-50 hover:text-cyan-950'
                  }`}
                >
                  {/* 📝 اسم الخيار مع أيقونة التأكيد إن كان محدداً */}
                  <div className="flex items-center gap-2 min-w-0">
                    {/* ✅ علامة الصح للأستاذ أو المرحلة المختارة */}
                    {isSelected ? (
                      <Check className="w-4 h-4 text-cyan-300 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 shrink-0 inline-block" />
                    )}
                    {/* 🔤 نص الخيار */}
                    <span className="truncate">{option.label}</span>
                  </div>

                  {/* 🔢 شارة عدد الطلاب الاحترافية كدام كل خيار */}
                  <div className="shrink-0">
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg text-xs font-black border transition-colors ${
                        isSelected
                          ? 'bg-white/20 text-cyan-200 border-white/30'
                          : 'bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-cyan-100 group-hover:text-cyan-900 group-hover:border-cyan-300'
                      }`}
                    >
                      {option.count === 0
                        ? '0 طالب'
                        : option.count === 1
                        ? 'طالب واحد'
                        : option.count === 2
                        ? 'طالبان'
                        : option.count >= 3 && option.count <= 10
                        ? `${option.count} طلاب`
                        : `${option.count} طالب`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
