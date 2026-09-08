'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 📅 مكون التقويم الأكاديمي العربي الفاخر (ArabicDatePicker) - جامعة الإمام جعفر الصادق (ع)
import { useState, useRef, useEffect } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة ودورة الحياة
import { createPortal } from 'react-dom'; // 🚪 بورتال للرسم المباشر فوق كافة النوافذ
import { DayOfWeek } from '@/types'; // 🔗 استيراد نوع اليوم الأسبوعي
import { getDayOfWeekFromDateString } from '@/lib/schedule-utils'; // 🗓️ أداة استنتاج اليوم الأسبوعي
import {
  Calendar as CalendarIcon, // 📅 أيقونة التقويم SVG
  ChevronRight, // ➡️ أيقونة الشهر السابق SVG
  ChevronLeft, // ⬅️ أيقونة الشهر التالي SVG
  ChevronDown, // 🔽 أيقونة السهم المنسدل التفاعلي
} from 'lucide-react'; // 🎨 أيقونات SVG نقية

// 📋 واجهة الخصائص المستقبلة لمكون التقويم الأكاديمي
export interface ArabicDatePickerProps {
  value: string; // 📅 التاريخ المحدد بصيغة YYYY-MM-DD
  onChange: (newDate: string) => void; // 🔄 دالة تغيير التاريخ
  onDayDeduce?: (day: DayOfWeek) => void; // 🗓️ دالة رد نداء لإرسال اليوم الأسبوعي المستنتج فورياً
  placeholder?: string; // 🏷️ نص العنصر النائب عند عدم التحديد
  disabled?: boolean; // 🔒 حالة التعطيل
  className?: string; // 🎨 كلاسات إضافية للتصميم
}

// 🗓️ مصفوفة أسماء الشهور بالعربية الفصيحة والمعتمدة بالعراق
const ARABIC_MONTHS = [
  'كانون الثاني',
  'شباط',
  'آذار',
  'نيسان',
  'أيار',
  'حزيران',
  'تموز',
  'آب',
  'أيلول',
  'تشرين الأول',
  'تشرين الثاني',
  'كانون الأول',
];

// 🗓️ مصفوفة أسماء أيام الأسبوع المختصرة بالعربية (تبدأ من السبت أسبوعياً)
const WEEK_DAYS_HEADER = [
  { key: 'sat', label: 'السبت' },
  { key: 'sun', label: 'الأحد' },
  { key: 'mon', label: 'الإثنين' },
  { key: 'tue', label: 'الثلاثاء' },
  { key: 'wed', label: 'الأربعاء' },
  { key: 'thu', label: 'الخميس' },
  { key: 'fri', label: 'الجمعة' },
];

export default function ArabicDatePicker({
  value,
  onChange,
  onDayDeduce,
  placeholder = '-- / -- / ---- تحديد تاريخ المحاضرة',
  disabled = false,
  className = '',
}: ArabicDatePickerProps) {
  // 🚪 حالة فتح أو إغلاق نافذة التقويم
  const [isOpen, setIsOpen] = useState<boolean>(false);
  // 🎯 مرجع زر التقويم الرئيسي لحساب الموضع
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // 📍 إحداثيات موضع النافذة المنبثقة الذكية
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  // 🗓️ استخراج السنة والشهر واليوم المبدئي من القيمة المحددة أو استخدام تاريخ اليوم
  const initialDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear() || 2026);
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth() ?? 8); // 8 = سبتمبر / أيلول

  // 🔄 مزامنة العرض عند تغيير التاريخ الخارجي
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // 📐 دالة الحساب الذكي لموضع التقويم ليبقى 100% داخل حدود الشاشة المرئية تماماً بدون أي خروج للأعلى أو الأسفل
  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect(); // 📏 أبعاد وموقع الزر
    const viewportWidth = window.innerWidth; // 🌐 عرض الشاشة
    const viewportHeight = window.innerHeight; // 🌐 ارتفاع الشاشة
    const popoverWidth = 320; // 📐 العرض الثابت للتقويم
    const popoverHeight = 350; // 📐 الارتفاع الدقيق للتقويم

    const spaceBelow = viewportHeight - rect.bottom; // ⬇️ المساحة المتبقية بالأسفل
    const spaceAbove = rect.top; // ⬆️ المساحة المتبقية بالأعلى

    let top: number;

    // 🚀 إذا كانت المساحة بالأسفل كافية نفتح للأسفل، وإلا نفتح للأعلى
    if (spaceBelow >= popoverHeight) {
      top = rect.bottom + 6;
    } else if (spaceAbove >= popoverHeight) {
      top = rect.top - popoverHeight - 6;
    } else {
      // إذا كانت المساحة ضيقة بالجهتين، نضع القائمة في الجهة التي تحتوي على المساحة الأكبر
      if (spaceAbove > spaceBelow) {
        top = rect.top - popoverHeight - 6;
      } else {
        top = rect.bottom + 6;
      }
    }

    // 🛡️ صمام أمان حديدي: إلزام بقاء التقويم داخل إطار الشاشة بنسبة 100% وعدم خروجه إطلاقاً
    if (top + popoverHeight > viewportHeight - 12) {
      top = Math.max(12, viewportHeight - popoverHeight - 12);
    }
    if (top < 12) {
      top = 12;
    }

    // 🛡️ ضبط الموضع الأفقي لمنع الخروج عن حواف الشاشة
    let left = rect.left;
    if (left + popoverWidth > viewportWidth - 12) {
      left = Math.max(12, viewportWidth - popoverWidth - 12);
    }
    if (left < 12) {
      left = 12;
    }

    setCoords({ top, left, width: popoverWidth });
  };

  // 🔘 فتح وإغلاق التقويم وتحديث الإحداثيات
  const toggleCalendar = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // 🔄 إغلاق التقويم عند تغيير حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('resize', handleResize);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  // 🔄 التنقل للشهر السابق
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  // 🔄 التنقل للشهر التالي
  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // 🌟 الانتقال المباشر لتاريخ اليوم الحالي
  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`; // 📅 صياغة التاريخ بأرقام إنكليزية
    onChange(dateStr);
    if (onDayDeduce) {
      const dayFound = getDayOfWeekFromDateString(dateStr);
      if (dayFound) onDayDeduce(dayFound);
    }
    setIsOpen(false);
  };


  // 🧮 حساب أيام الشهر وأيام الإزاحة في التقويم
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // 🧮 حساب أول يوم في الشهر لمطابقته مع السبت (0 = السبت، 1 = الأحد، ... 6 = الجمعة)
  const getFirstDayOffset = (year: number, month: number) => {
    const jsDay = new Date(year, month, 1).getDay(); // 0 = الأحد في الجافاسكربت
    return (jsDay + 1) % 7;
  };

  const daysCount = getDaysInMonth(viewYear, viewMonth);
  const firstDayOffset = getFirstDayOffset(viewYear, viewMonth);

  // 🎯 اختيار يوم محدد من شبكة التقويم
  const handleSelectDay = (dayNumber: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(dayNumber).padStart(2, '0');
    const dateString = `${viewYear}-${formattedMonth}-${formattedDay}`; // 📅 التاريخ بأرقام إنكليزية 100%

    onChange(dateString); // 🔄 تحديث التاريخ
    if (onDayDeduce) {
      const deduced = getDayOfWeekFromDateString(dateString); // 🗓️ استنتاج اليوم الأسبوعي
      if (deduced) onDayDeduce(deduced);
    }
    setIsOpen(false); // 🚪 إغلاق التقويم
  };

  // 📅 تنسيق عرض التاريخ المحدد داخل الزر بأرقام إنكليزية وبشكل كامل وظاهر بدون أي قص
  const displayFormattedDate = () => {
    if (!value) return placeholder;
    const parts = value.split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const mIdx = parseInt(parts[1], 10) - 1;
      const d = parts[2];
      const monthName = ARABIC_MONTHS[mIdx] || '';
      const dayOfWeekKey = getDayOfWeekFromDateString(value);
      const dayNamesMap: Record<string, string> = {
        saturday: 'السبت',
        sunday: 'الأحد',
        monday: 'الإثنين',
        tuesday: 'الثلاثاء',
        wednesday: 'الأربعاء',
        thursday: 'الخميس',
        friday: 'الجمعة',
      };
      const dayName = dayOfWeekKey ? dayNamesMap[dayOfWeekKey] : '';
      return `${dayName ? `${dayName}، ` : ''}${d} ${monthName} ${y}`; // 📌 التاريخ المعرب بأرقام إنكليزية وظاهر بالكامل
    }
    return value;
  };

  // 📅 اليوم الحالي للمقارنة
  const todayObj = new Date();
  const isCurrentMonthView = todayObj.getFullYear() === viewYear && todayObj.getMonth() === viewMonth;
  const todayDayNum = todayObj.getDate();

  return (
    <div className="relative w-full">
      {/* 🔘 زر فتح وإغلاق التقويم الأكاديمي مع إظهار النص كاملاً بدون أي قص */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={toggleCalendar} /* 🗓️ حدث النقر لفتح وإغلاق نافذة التقويم المنبثقة فوراً */
        /* 🔘 زر فتح وإغلاق التقويم مع تثبيت أدنى ارتفاع min-h-[48px] ليتطابق بالمليمتر مع القوائم المجاورة */
        className={`w-full min-h-[48px] px-3.5 py-2.5 bg-white border-2 rounded-xl text-sm font-black flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right ${
          isOpen ? 'border-[#0F2942] ring-2 ring-[#0F2942]/20' : 'border-slate-300 hover:border-slate-400'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''} ${className}`}
        title={displayFormattedDate()}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-blue-50 text-[#0F2942] rounded-lg shrink-0 border border-blue-200">
            <CalendarIcon className="w-4 h-4 text-[#0F2942]" />
          </div>
          <span className={`text-sm font-black whitespace-nowrap ${!value ? 'text-slate-500 font-bold' : 'text-slate-950'}`}>
            {displayFormattedDate()}
          </span>
        </div>

        {/* 🔽 أيقونة السهم المنسدل التفاعلي لإضفاء مظهر احترافي متوازن */}
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 mr-1.5 ${isOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
      </button>

      {/* 🚪 البورتال المنبثق للتقويم الفاخر بطبقة z-[999999] والمحكوم 100% بحدود الشاشة */}
      {isOpen && coords && typeof document !== 'undefined' && createPortal(
        <>
          {/* 🌫️ خلفية شفافة لالتقاط النقرات الخارجية وإغلاق التقويم */}
          <div
            className="fixed inset-0 z-[999999] bg-transparent"
            onClick={() => setIsOpen(false)}
          />

          {/* 📦 نافذة التقويم المنسدلة الذكية المقيدة داخل حدود الشاشة 100% */}
          <div
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
            }}
            className="z-[999999] bg-white border-2 border-[#0F2942] rounded-2xl shadow-2xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150 text-right select-none"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1️⃣ الشريط العلوي: الشهر والسنة بالعربية وأزرار التنقل SVG */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#0F2942] hover:text-white text-slate-700 transition cursor-pointer border border-slate-200"
                title="الشهر السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="text-center">
                <span className="font-black text-sm text-[#0F2942] block">
                  {ARABIC_MONTHS[viewMonth]} ({viewMonth + 1})
                </span>
                <span className="font-mono text-xs font-bold text-slate-600 block">
                  {viewYear}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#0F2942] hover:text-white text-slate-700 transition cursor-pointer border border-slate-200"
                title="الشهر التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* 2️⃣ ترويسة أسماء أيام الأسبوع */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEK_DAYS_HEADER.map((wd) => (
                <span key={wd.key} className="text-[11px] font-black text-slate-700 py-1">
                  {wd.label}
                </span>
              ))}
            </div>

            {/* 3️⃣ شبكة الأيام (أرقام إنكليزية 100%) */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* خلايا الإزاحة للشهر */}
              {Array.from({ length: firstDayOffset }).map((_, idx) => (
                <span key={`empty-${idx}`} className="p-2 text-transparent text-xs pointer-events-none">
                  -
                </span>
              ))}

              {/* أيام الشهر الفعلية */}
              {Array.from({ length: daysCount }).map((_, idx) => {
                const dayNum = idx + 1;
                const formattedM = String(viewMonth + 1).padStart(2, '0');
                const formattedD = String(dayNum).padStart(2, '0');
                const thisDateStr = `${viewYear}-${formattedM}-${formattedD}`;
                const isSelected = value === thisDateStr;
                const isToday = isCurrentMonthView && dayNum === todayDayNum;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    className={`py-1.5 px-1 rounded-xl text-xs font-mono font-black transition-all cursor-pointer flex flex-col items-center justify-center border ${
                      isSelected
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs scale-105'
                        : isToday
                        ? 'bg-blue-50 text-[#0F2942] border-blue-300 font-bold hover:bg-blue-100'
                        : 'bg-slate-50/70 hover:bg-slate-100 text-slate-900 border-transparent'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {isSelected && <span className="w-1 h-1 rounded-full bg-cyan-300 mt-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* 4️⃣ الفوتر السريع: زر اليوم وزر مسح التاريخ وزر الإغلاق */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs font-black gap-1.5">
              <button
                type="button"
                onClick={handleSelectToday}
                className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0F2942] border border-blue-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-blue-700" />
                <span>اليوم ({todayDayNum})</span>
              </button>



              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
