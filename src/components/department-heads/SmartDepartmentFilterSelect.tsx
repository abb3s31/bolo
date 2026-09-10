'use client'; // ⚡ تفعيل ميزات العميل التفاعلية في Next.js

import React, { useState, useRef, useEffect, useMemo } from 'react'; // ⚛️ استيراد ريآكت وهواكس الحالة والمراجع والذاكرة المؤقتة
import { createPortal } from 'react-dom'; // 🚪 استيراد بورتال لعرض القائمة خارج شجرة الـ DOM
import {
  Building2, // 🏢 أيقونة القسم الأكاديمي
  Layers, // 📚 أيقونة كافة الأقسام
  ChevronDown, // 🔽 أيقونة السهم للقائمة المنسدلة
  Check, // ✔️ أيقونة التحقق والاختيار
  Search, // 🔍 أيقونة حقل البحث
  X, // ❌ أيقونة مسح البحث وإلغاء التصفية
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { Department, UserProfile } from '@/types'; // 🏷️ استيراد الأنواع الرسمية
import { OFFICIAL_COLLEGE_DEPARTMENTS } from '@/lib/excel-utils'; // 🏛️ استيراد قائمة الأقسام الرسمية للكلية

// 📋 واجهة خصائص مكون تصفية الأقسام الذكي في جدول القيادات
export interface SmartDepartmentFilterSelectProps {
  departments: Department[]; // 🏢 مصفوفة الأقسام المسجلة بالنظام
  profiles: UserProfile[]; // 👥 مصفوفة مستخدمي النظام لحساب القيادات
  value: string; // 🔑 المعرف أو الاسم المختار للفلترة
  onChange: (deptIdOrName: string) => void; // 🔄 دالة تغيير خيار الفلترة
}

// 🏛️ مكون القائمة المنسدلة الذكية لاختيار وتصفية القسم في شريط الترتيب
export const SmartDepartmentFilterSelect: React.FC<SmartDepartmentFilterSelectProps> = ({
  departments, // 🏢 الأقسام
  profiles, // 👥 الحسابات
  value, // 🔑 القيمة
  onChange, // 🔄 دالة التحديث
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false); // 📂 حالة فتح القائمة
  const [search, setSearch] = useState<string>(''); // 🔍 نص البحث
  const [coords, setCoords] = useState<{
    top: number; // 📐 مسافة القمة
    bottom: number; // 📐 مسافة القاع
    left: number; // 📐 مسافة اليسار
    width: number; // 📏 عرض القائمة
    maxHeight: number; // 📏 أقصى ارتفاع
    openUpwards: boolean; // ⬆️ هل تفتح للأعلى
  } | null>(null); // 📐 إحداثيات تموضع القائمة

  const buttonRef = useRef<HTMLButtonElement | null>(null); // 🔗 مرجع زر فتح القائمة

  // 📐 دالة حساب الموقع الذكي للقائمة
  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpwards = spaceBelow < 280 && spaceAbove > spaceBelow;
    const maxHeight = openUpwards
      ? Math.max(160, Math.min(340, spaceAbove - 20))
      : Math.max(160, Math.min(340, spaceBelow - 20));

    setCoords({
      top: rect.bottom + 6,
      bottom: window.innerHeight - rect.top + 6,
      left: Math.max(10, Math.min(rect.left, window.innerWidth - 320)),
      width: Math.max(rect.width, 280),
      maxHeight,
      openUpwards,
    });
  };

  // 🔄 مراقبة التمرير وتغيير حجم الشاشة
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

  // 🔄 دمج الأقسام الـ 12 الرسمية مع الأقسام الموجودة لظهور كافة الأقسام
  const allDepts = useMemo(() => {
    const list: { id: string; name: string; code?: string }[] = [...departments];
    OFFICIAL_COLLEGE_DEPARTMENTS.forEach((od) => {
      if (!list.some((d) => d.name.trim() === od.name.trim())) {
        list.push({
          id: `official-${od.code}`,
          name: od.name,
          code: od.code,
        });
      }
    });
    return list;
  }, [departments]);

  const selectedDept = allDepts.find((d) => d.id === value || d.name === value); // 🎯 استخراج القسم المختار

  // 🔍 تصفية الأقسام حسب نص البحث
  const filteredDepts = allDepts.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.code && d.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    // 📦 غلاف زر فلترة الأقسام
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!isOpen) updatePosition();
          setIsOpen(!isOpen);
          setSearch('');
        }}
        className={`px-3.5 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer border ${
          value !== 'ALL'
            ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
            : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
        }`}
      >
        <Building2 className={`w-4 h-4 shrink-0 ${value !== 'ALL' ? 'text-cyan-300' : 'text-slate-950'}`} />
        <span className="truncate max-w-[200px]">
          {value === 'ALL'
            ? 'اختيار قسم محدد (كافة الأقسام)'
            : `القسم: ${selectedDept ? selectedDept.name : value}`}
        </span>
        {value !== 'ALL' ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange('ALL');
              setIsOpen(false);
            }}
            className="p-0.5 hover:bg-white/20 rounded-full transition"
            title="إلغاء التصفية وعرض كافة الأقسام"
          >
            <X className="w-3.5 h-3.5 text-cyan-200" />
          </span>
        ) : (
          <ChevronDown className={`w-4 h-4 text-slate-950 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* 🚪 عرض القائمة عبر البورتال */}
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
            className="bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-[999999] p-2 flex flex-col animate-in fade-in zoom-in-95 duration-150 text-right overflow-hidden"
            dir="rtl"
          >
            {/* 🔍 شريط البحث عن الأقسام */}
            <div className="relative mb-2 shrink-0">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-950" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن اسم القسم..."
                autoFocus
                className="w-full pr-9 pl-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-950 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:border-indigo-600"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-950 hover:text-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 📋 قائمة الخيارات مع التمرير الداخلي */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 overscroll-contain space-y-1">
              {/* خيار كافة الأقسام */}
              <button
                type="button"
                onClick={() => {
                  onChange('ALL');
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-right text-xs sm:text-sm font-black flex items-center justify-between transition cursor-pointer border ${
                  value === 'ALL'
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-950 border-transparent'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Layers className={`w-4 h-4 shrink-0 ${value === 'ALL' ? 'text-cyan-200' : 'text-slate-950'}`} />
                  <span>كافة الأقسام (عرض كل القيادات)</span>
                </span>
                {value === 'ALL' ? (
                  <Check className="w-4 h-4 text-cyan-200 shrink-0" />
                ) : (
                  <span className="text-xs bg-slate-200 text-slate-950 font-black px-2 py-0.5 rounded-full font-mono">
                    {profiles.filter(p => p.role === 'department_head' || p.role === 'rapporteur').length}
                  </span>
                )}
              </button>

              {/* عناصر الأقسام الـ 12 */}
              {filteredDepts.map((dept) => {
                const isSelected = value === dept.id || value === dept.name;
                const deptLeaders = profiles.filter(
                  (p) =>
                    (p.department_id === dept.id || p.department_name === dept.name) &&
                    (p.role === 'department_head' || p.role === 'rapporteur')
                );
                const hasHead = deptLeaders.some((p) => p.role === 'department_head');
                const hasRap = deptLeaders.some((p) => p.role === 'rapporteur');

                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      onChange(dept.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-right text-xs sm:text-sm font-black flex items-center justify-between transition cursor-pointer border ${
                      isSelected
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                        : 'hover:bg-indigo-50 text-slate-950 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-200' : 'text-indigo-700'}`} />
                      <span className="truncate">{dept.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 mr-2">
                      {hasHead && hasRap ? (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                          مكتمل (2)
                        </span>
                      ) : deptLeaders.length > 0 ? (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${isSelected ? 'bg-sky-800 text-sky-100' : 'bg-sky-50 text-sky-800 border border-sky-200'}`}>
                          1 مسؤول
                        </span>
                      ) : (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${isSelected ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-950 border border-slate-300'}`}>
                          شاغر (0)
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-cyan-200 shrink-0" />}
                    </div>
                  </button>
                );
              })}

              {filteredDepts.length === 0 && (
                <div className="py-4 text-center text-xs text-slate-950 font-black">
                  لم يتم العثور على أي قسم يطابق البحث
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default SmartDepartmentFilterSelect; // 🚀 تصدير المكون كافتراضي
