'use client'; // ⚡ تفعيل ميزات العميل التفاعلية في Next.js

import React, { useState, useRef, useEffect } from 'react'; // ⚛️ استيراد ريآكت والهوكس الأساسية
import { createPortal } from 'react-dom'; // 🚪 استيراد البورتال لفتح القائمة خارج شجرة الـ DOM
import {
  Building2, // 🏢 أيقونة رئاسة القسم الأكاديمي
  UserCheck, // 👤 أيقونة مقرر القسم المعتمد
  UserX, // ❌ أيقونة إلغاء تحديد الموقع الإداري
  ChevronDown, // 🔽 أيقونة السهم للقائمة المنسدلة
  Check, // ✔️ أيقونة الاختيار والتأكيد
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد بنقاء SVG عالي

// 📋 واجهة خصائص مكون القائمة المنسدلة الذكية للموقع الإداري
export interface SmartRoleSelectProps {
  value: 'department_head' | 'rapporteur' | ''; // 🏷️ قيمة الموقع الإداري المختار
  onChange: (role: 'department_head' | 'rapporteur' | '') => void; // 🔄 دالة تحديث الموقع الإداري
}

// 🎭 مكون القائمة المنسدلة الذكية للموقع الإداري المحصورة 100% داخل الشاشة
export const SmartRoleSelect: React.FC<SmartRoleSelectProps> = ({
  value, // 🏷️ القيمة المختارة
  onChange, // 🔄 دالة التحديث
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false); // 📂 حالة فتح وإغلاق القائمة
  const [coords, setCoords] = useState<{
    top: number; // 📐 مسافة القمة
    bottom: number; // 📐 مسافة القاع
    left: number; // 📐 مسافة اليسار
    width: number; // 📏 عرض القائمة
    maxHeight: number; // 📏 أقصى ارتفاع مسموح
    openUpwards: boolean; // ⬆️ هل تفتح للأعلى
  } | null>(null); // 📐 إحداثيات تموضع القائمة المنسدلة

  const buttonRef = useRef<HTMLButtonElement | null>(null); // 🔗 مرجع زر فتح القائمة لحساب الموقع

  // 📐 دالة حساب الموضع الذكي للقائمة لضمان بقائها داخل حدود الشاشة
  const updatePosition = () => {
    if (!buttonRef.current) return; // 🛑 إذا الزر مو موجود نطلع
    const rect = buttonRef.current.getBoundingClientRect(); // 📏 جلب أبعاد وموقع الزر بالبكسل
    const spaceBelow = window.innerHeight - rect.bottom; // 📐 المساحة المتاحة أسفل الزر
    const spaceAbove = rect.top; // 📐 المساحة المتاحة أعلى الزر
    const openUpwards = spaceBelow < 180 && spaceAbove > spaceBelow; // 🚀 فتح للأعلى إذا المساحة تحت ضيقة
    const maxHeight = openUpwards
      ? Math.max(120, Math.min(240, spaceAbove - 20)) // 📏 حساب الارتفاع عند الفتح للأعلى
      : Math.max(120, Math.min(240, spaceBelow - 20)); // 📏 حساب الارتفاع عند الفتح للأسفل

    setCoords({
      top: rect.bottom + 6, // ⬇️ التموضع أسفل الزر مع هامش 6px
      bottom: window.innerHeight - rect.top + 6, // ⬆️ التموضع أعلى الزر مع هامش 6px
      left: rect.left, // ⬅️ المحاذاة مع يسار الزر
      width: rect.width, // 📏 نفس عرض الزر بالضبط
      maxHeight, // 📏 الارتفاع الأقصى المحسوب
      openUpwards, // 🔄 اتجاه الفتح
    });
  };

  // 🔄 مراقبة التمرير وتغيير حجم الشاشة لإعادة ضبط الموضع أو الإغلاق
  useEffect(() => {
    if (!isOpen) {
      setCoords(null); // 🧹 تصفير الإحداثيات عند الإغلاق
      return;
    }
    updatePosition(); // 📐 حساب الموضع فور الفتح
    const handleScrollOrResize = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setIsOpen(false); // 🛑 إغلاق القائمة إذا خرج الزر عن حدود الشاشة
        return;
      }
      updatePosition(); // 🔄 إعادة حساب الموضع اللحظي
    };

    window.addEventListener('scroll', handleScrollOrResize, true); // 👂 الاستماع لحدث التمرير
    window.addEventListener('resize', handleScrollOrResize); // 👂 الاستماع لتغيير حجم النافذة
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true); // 🧹 تنظيف مستمع التمرير
      window.removeEventListener('resize', handleScrollOrResize); // 🧹 تنظيف مستمع الحجم
    };
  }, [isOpen]);

  return (
    // 📦 الحاوية العامة لمكون اختيار الرتبة
    <div className="relative w-full text-right">
      <label className="text-sm font-black text-slate-950 block mb-1.5">
        الموقع الإداري *
      </label>
      {/* 🔘 زر فتح القائمة المنسدلة */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!isOpen) updatePosition();
          setIsOpen(!isOpen);
        }}
        className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-slate-950 font-black text-sm flex items-center justify-between gap-2 transition cursor-pointer text-right shadow-2xs ${
          isOpen ? 'border-indigo-600 ring-4 ring-indigo-500/10' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          {value === 'department_head' ? (
            <>
              <Building2 className="w-4 h-4 text-indigo-700 shrink-0" />
              <span className="font-black text-slate-950">رئيس قسم</span>
            </>
          ) : value === 'rapporteur' ? (
            <>
              <UserCheck className="w-4 h-4 text-indigo-700 shrink-0" />
              <span className="font-black text-slate-950">مقرر قسم</span>
            </>
          ) : (
            <>
              <UserX className="w-4 h-4 text-slate-950 shrink-0" />
              <span className="font-black text-slate-950">-- غير محدد (اختر الموقع الإداري) --</span>
            </>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-950 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-700' : ''
          }`}
        />
      </button>

      {/* 🚪 عرض القائمة عبر البورتال لتفادي مشاكل الـ Z-Index والـ Overflow */}
      {isOpen && coords && typeof document !== 'undefined' && createPortal(
        <>
          {/* 🌌 غطاء شفاف للنقر خارج القائمة لإغلاقها */}
          <div className="fixed inset-0 z-[999998]" onClick={() => setIsOpen(false)} />
          <div
            style={{
              position: 'fixed',
              ...(coords.openUpwards
                ? { bottom: `${coords.bottom}px` }
                : { top: `${coords.top}px` }),
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
            }}
            className="bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-[999999] p-1.5 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 space-y-1 text-right divide-y divide-slate-100"
            dir="rtl"
          >
            {/* 1. خيار غير محدد */}
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-right text-sm font-black flex items-center justify-between transition cursor-pointer border ${
                !value ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-950 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <UserX className={`w-4 h-4 shrink-0 ${!value ? 'text-cyan-200' : 'text-slate-950'}`} />
                <span>-- غير محدد (إلغاء التحديد) --</span>
              </span>
              {!value && <Check className="w-4 h-4 text-cyan-200 shrink-0" />}
            </button>

            {/* 2. رئيس قسم */}
            <button
              type="button"
              onClick={() => {
                onChange('department_head');
                setIsOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-right text-sm font-black flex items-center justify-between transition cursor-pointer border ${
                value === 'department_head' ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs' : 'bg-slate-50 hover:bg-indigo-50 text-slate-950 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <Building2 className={`w-4 h-4 shrink-0 ${value === 'department_head' ? 'text-cyan-200' : 'text-indigo-700'}`} />
                <span>رئيس قسم</span>
              </span>
              {value === 'department_head' && <Check className="w-4 h-4 text-cyan-200 shrink-0" />}
            </button>

            {/* 3. مقرر قسم */}
            <button
              type="button"
              onClick={() => {
                onChange('rapporteur');
                setIsOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-right text-sm font-black flex items-center justify-between transition cursor-pointer border ${
                value === 'rapporteur' ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs' : 'bg-slate-50 hover:bg-indigo-50 text-slate-950 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <UserCheck className={`w-4 h-4 shrink-0 ${value === 'rapporteur' ? 'text-cyan-200' : 'text-indigo-700'}`} />
                <span>مقرر قسم</span>
              </span>
              {value === 'rapporteur' && <Check className="w-4 h-4 text-cyan-200 shrink-0" />}
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default SmartRoleSelect; // 🚀 تصدير المكون كافتراضي
