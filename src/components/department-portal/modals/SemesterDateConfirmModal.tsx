'use client'; // ⚡ واجهة تفاعلية تعمل بمتصفح العميل

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import { createPortal } from 'react-dom'; // 🌐 بورتال لعرض المودال فوق الشاشة
import {
  CalendarDays, // 🗓️ أيقونة التقويم
  Info, // ℹ️ أيقونة المعلومات
  Check, // ✔️ أيقونة التأكيد
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد

// 📋 واجهة خصائص مودال تأكيد تاريخ انطلاق الفصل الدراسي
export interface SemesterDateConfirmModalProps {
  isOpen: boolean; // 🪟 حالة فتح المودال
  pendingDate: string | null; // 📅 التاريخ الجديد المختار
  currentStartDate: string; // 📅 التاريخ الحالي المعتمد
  onClose: () => void; // ❌ دالة الإغلاق والتراجع
  onConfirm: () => void; // ✅ دالة تأكيد واعتماد التاريخ
}

// 🏛️ مكون مودال تأكيد تعديل تاريخ انطلاق الفصل الدراسي (مسار بولونيا)
export const SemesterDateConfirmModal: React.FC<SemesterDateConfirmModalProps> = ({
  isOpen,
  pendingDate,
  currentStartDate,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !pendingDate || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        className="bg-white border-2 border-[#0F2942] rounded-3xl shadow-2xl max-w-md w-full p-5 space-y-4 text-right animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 🏷️ الرأس والأيقونة */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3.5">
          <div className="p-2.5 bg-blue-100 text-[#0F2942] rounded-xl border border-blue-300 shrink-0 shadow-2xs">
            <CalendarDays className="w-5 h-5 text-[#0F2942]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-black">
              تأكيد تعديل تاريخ انطلاق الفصل الدراسي
            </h3>
            <p className="text-xs sm:text-sm font-bold text-black mt-0.5">
              التقويم الأكاديمي المعتمد — مسار بولونيا (15 أسبوعاً)
            </p>
          </div>
        </div>

        {/* 📊 مقارنة التاريخ الحالي بالتاريخ الجديد */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* التاريخ الحالي */}
          <div className="p-3 bg-slate-100/90 rounded-2xl border-2 border-slate-300 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-black">
              <CalendarDays className="w-3.5 h-3.5 text-black shrink-0" />
              <span>التاريخ الحالي المعتمد</span>
            </div>
            <span className="text-sm sm:text-base font-black text-black block font-mono">
              {currentStartDate || 'غير محدد'}
            </span>
          </div>

          {/* التاريخ الجديد المختار */}
          <div className="p-3 bg-blue-50 rounded-2xl border-2 border-blue-500 space-y-1 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-black">
              <CalendarDays className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
              <span>التاريخ الجديد المختار</span>
            </div>
            <span className="text-sm sm:text-base font-black text-black block font-mono">
              {pendingDate}
            </span>
          </div>
        </div>

        {/* ℹ️ تنبيه توضيحي */}
        <div className="p-3.5 bg-blue-50/80 border-2 border-blue-200 rounded-2xl flex items-start gap-2.5 shadow-2xs">
          <div className="p-1.5 bg-[#0F2942] text-white rounded-lg shrink-0 border border-blue-300 mt-0.5 shadow-2xs">
            <Info className="w-4 h-4 text-cyan-300" />
          </div>
          <p className="leading-relaxed text-xs sm:text-sm font-bold text-black pt-0.5">
            <strong className="text-black font-black ml-1 underline decoration-[#0F2942] decoration-2">تنبيه تنظيمي:</strong>
            سيؤدي حفظ هذا التاريخ إلى إعادة احتساب وتحديث تواريخ كافة الأسابيع الـ 15 وجداول المحاضرات تلقائياً وفق التاريخ الجديد المختار (+7 أيام لكل أسبوع).
          </p>
        </div>

        {/* 🔘 أزرار الإجراء */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-black rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border-2 border-slate-400 active:scale-95 shadow-2xs"
          >
            إلغاء والتراجع
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-xs sm:text-sm font-black transition shadow-md cursor-pointer border-2 border-[#0F2942] active:scale-95 flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
            <span>تأكيد وحفظ التاريخ</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SemesterDateConfirmModal; // 🚀 تصدير المكون كافتراضي
