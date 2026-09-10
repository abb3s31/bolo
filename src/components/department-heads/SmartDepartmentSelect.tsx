'use client'; // ⚡ تفعيل ميزات العميل التفاعلية في Next.js

import React, { useState, useRef, useEffect } from 'react'; // ⚛️ استيراد ريآكت ومكتباتها الأساسية
import { createPortal } from 'react-dom'; // 🚪 استيراد البورتال لفتح القائمة خارج شجرة الـ DOM
import {
  Building2, // 🏢 أيقونة القسم الأكاديمي
  ChevronDown, // 🔽 أيقونة السهم للقائمة المنسدلة
  Check, // ✔️ أيقونة الاختيار والتأكيد
  UserX, // ❌ أيقونة إلغاء تحديد القسم
  Search, // 🔍 أيقونة البحث اللحظي
  X, // ❌ أيقونة مسح البحث
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { Department } from '@/types'; // 🏷️ استيراد نوع القسم الأكاديمي الرسمي

// 📋 واجهة خصائص مكون القائمة المنسدلة الذكية لاختيار القسم الأكاديمي
export interface SmartDepartmentSelectProps {
  departments: Department[]; // 🏢 مصفوفة الأقسام المتاحة
  value: string; // 🔑 معرف القسم المختار حالياً
  onChange: (deptId: string) => void; // 🔄 دالة تحديث معرف القسم المختار
}

// 🏢 مكون القائمة المنسدلة الذكية للأقسام الأكاديمية مع البحث الفوري والمحصورة داخل الشاشة
export const SmartDepartmentSelect: React.FC<SmartDepartmentSelectProps> = ({
  departments, // 🏢 قائمة الأقسام
  value, // 🔑 القيمة الحالية
  onChange, // 🔄 دالة التحديث
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false); // 📂 حالة فتح القائمة
  const [search, setSearch] = useState<string>(''); // 🔍 نص البحث عن الأقسام
  const [coords, setCoords] = useState<{
    top: number; // 📐 مسافة القمة
    bottom: number; // 📐 مسافة القاع
    left: number; // 📐 مسافة اليسار
    width: number; // 📏 عرض القائمة
    maxHeight: number; // 📏 أقصى ارتفاع مسموح
    openUpwards: boolean; // ⬆️ هل تفتح للأعلى
  } | null>(null); // 📐 إحداثيات التموضع المحسوبة

  const buttonRef = useRef<HTMLButtonElement | null>(null); // 🔗 مرجع زر فتح القائمة

  // 📐 دالة حساب الموضع الذكي للقائمة لضمان بقائها داخل حدود الشاشة
  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpwards = spaceBelow < 260 && spaceAbove > spaceBelow;
    const maxHeight = openUpwards
      ? Math.max(160, Math.min(320, spaceAbove - 20))
      : Math.max(160, Math.min(320, spaceBelow - 20));

    setCoords({
      top: rect.bottom + 6,
      bottom: window.innerHeight - rect.top + 6,
      left: rect.left,
      width: rect.width,
      maxHeight,
      openUpwards,
    });
  };

  // 🔄 مراقبة التمرير وتغيير حجم الشاشة لإعادة حساب الموضع
  useEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }
    updatePosition();
    const handleScrollOrResize = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setIsOpen(false);
        return;
      }
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  const selectedDept = departments.find((d) => d.id === value); // 🎯 استخراج بيانات القسم المختار حالياً

  // 🔍 تصفية الأقسام بحسب الاسم والرمز
  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.code && d.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    // 📦 غلاف مكون اختيار القسم
    <div className="relative w-full text-right">
      <label className="text-sm font-black text-slate-950 block mb-1.5">
        القسم الأكاديمي التابع له ({departments.length} قسماً) *
      </label>
      {/* 🔘 زر فتح قائمة الأقسام */}
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
        <span className="flex items-center gap-2.5 truncate flex-1 min-w-0">
          {selectedDept ? (
            <>
              <div className="px-2 py-0.5 bg-[#0F2942] text-white rounded-md text-xs font-mono font-black shrink-0">
                {selectedDept.code || 'DEPT'}
              </div>
              <span className="font-black text-slate-950 text-sm truncate">{selectedDept.name}</span>
            </>
          ) : (
            <>
              <Building2 className="w-4 h-4 text-slate-950 shrink-0" />
              <span className="font-black text-slate-950">-- غير محدد (اختر القسم العلمي التابع له) --</span>
            </>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-950 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-700' : ''
          }`}
        />
      </button>

      {/* 🚪 عرض قائمة الأقسام عبر البورتال */}
      {isOpen && coords && typeof document !== 'undefined' && createPortal(
        <>
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
            {/* 🔍 شريط البحث الفوري */}
            <div className="p-1 border-b border-slate-200 mb-1 sticky top-0 bg-white z-10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-950 absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث باسم القسم أو رمزه..."
                  className="w-full pr-8 pl-7 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-950 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:border-indigo-600 focus:bg-white shadow-2xs transition"
                  onClick={(e) => e.stopPropagation()}
                />
                {search && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearch('');
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-950 hover:text-slate-900 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* خيار غير محدد */}
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
                setSearch('');
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

            {/* قائمة الأقسام */}
            {filteredDepts.map((dept) => {
              const isSelected = dept.id === value;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => {
                    onChange(dept.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-right text-sm font-black flex items-center justify-between transition cursor-pointer border ${
                    isSelected ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs' : 'bg-slate-50 hover:bg-indigo-50 text-slate-950 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-black shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {dept.code || 'DEPT'}
                    </span>
                    <span className="truncate">{dept.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-cyan-200 shrink-0 mr-2" />}
                </button>
              );
            })}

            {filteredDepts.length === 0 && (
              <div className="p-3 text-center text-xs font-black text-slate-950">
                لا توجد أقسام تطابق البحث
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default SmartDepartmentSelect; // 🚀 تصدير المكون كافتراضي
