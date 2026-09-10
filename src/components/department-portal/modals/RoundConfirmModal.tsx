'use client'; // ⚡ واجهة تفاعلية تعمل بمتصفح العميل

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import {
  X, // ❌ أيقونة الإغلاق
  Lock, // 🔒 أيقونة القفل
  Unlock, // 🔓 أيقونة الفتح
  CheckCircle2, // ✅ أيقونة التأكيد
  Info, // ℹ️ أيقونة المعلومات
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🏷️ أداة استخراج اسم المرحلة بالعربية

// 📋 واجهة بيانات تأكيد فتح وإغلاق الدور الأكاديمي
export interface RoundActionConfirmation {
  isOpen: boolean; // 🪟 حالة ظهور المودال
  round: 'final' | 'supplementary'; // 🎯 الدور الأول أو الدور الثاني
  enable: boolean; // ⚡ true للفتح، false للقفل
  targetSemester: 1 | 2 | 'all'; // 📚 الكورس المستهدف
  targetStage: number | 'all'; // 🎓 المرحلة المستهدفة
  targetCourseId?: string; // 📖 معرف المادة الفردية
  targetCourseName?: string; // 🏷️ اسم المادة الفردية
  targetCourseIds?: string[]; // 📋 قائمة معرفات المواد
  affectedCount: number; // 🔢 عدد المواد المتأثرة
  title: string; // 📌 عنوان العملية
  description: string; // 📝 وصف تفصيلي للعملية
}

// 📋 واجهة خصائص مودال تأكيد فتح وإغلاق الأدوار الامتحانية
export interface RoundConfirmModalProps {
  modalData: RoundActionConfirmation | null; // 📦 بيانات نافذة التأكيد
  onClose: () => void; // ❌ دالة الإغلاق والتراجع
  onConfirm: () => void; // ✅ دالة تأكيد الإجراء والتنفيذ
}

// 🏛️ مكون مودال تأكيد فتح وإغلاق الأدوار الامتحانية (الدور الأول والثاني)
export const RoundConfirmModal: React.FC<RoundConfirmModalProps> = ({
  modalData,
  onClose,
  onConfirm,
}) => {
  if (!modalData?.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150" dir="rtl">
      <div 
        className="bg-white border-2 border-slate-300 rounded-3xl max-w-md w-full shadow-2xl p-5 space-y-3 text-right relative animate-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ❌ زر الإغلاق السريع */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-950 hover:text-black hover:bg-slate-100 rounded-xl transition cursor-pointer"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 🛡️ شارة وأيقونة رأس المودال */}
        <div className="flex flex-col items-center justify-center text-center pt-1">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm mb-1.5 ${
            modalData.enable 
              ? 'bg-[#0F2942] text-white ring-3 ring-[#0F2942]/15' 
              : 'bg-slate-800 text-white ring-3 ring-slate-800/15'
          }`}>
            {modalData.enable ? (
              <Unlock className="w-6 h-6 text-emerald-400" />
            ) : (
              <Lock className="w-6 h-6 text-slate-300" />
            )}
          </div>

          <span className="px-3 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1.5 border shadow-2xs bg-slate-100 text-slate-950 border-slate-300">
            {modalData.enable ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0F2942]" />
                <span>طلب فتح وتفعيل رسمي</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-slate-950" />
                <span>طلب إغلاق وحجب رسمي</span>
              </>
            )}
          </span>

          <h3 className="text-lg sm:text-xl font-black text-slate-950 mt-1.5">
            {modalData.title}
          </h3>
          <p className="text-xs sm:text-sm font-black text-slate-950 mt-1 leading-relaxed">
            {modalData.description}
          </p>
        </div>

        {/* 📋 صندوق تفاصيل العملية ونطاق التأثير */}
        <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs sm:text-sm font-black text-slate-950">
          <div className="flex items-center justify-between py-1 border-b border-slate-200">
            <span className="text-slate-950 font-black">الدور الأكاديمي:</span>
            <span className="text-slate-950 font-black">
              {modalData.round === 'final' ? 'الامتحان النهائي (الدور الأول)' : 'الدور الثاني'}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-200">
            <span className="text-slate-950 font-black">الكورس الدراسي:</span>
            <span className="text-slate-950 font-black">
              {modalData.targetSemester === 1 
                ? 'الكورس الأول' 
                : modalData.targetSemester === 2 
                ? 'الكورس الثاني' 
                : 'كافة الكورسات'}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-200">
            <span className="text-slate-950 font-black">النطاق الأكاديمي:</span>
            <span className="text-slate-950 font-black">
              {modalData.targetCourseId
                ? (modalData.targetCourseName || 'مادة دراسية محددة')
                : modalData.targetStage === 'all'
                ? 'كافة المراحل الدراسية للقسم'
                : `المرحلة ${getStageNameInArabic(Number(modalData.targetStage))}`}
            </span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-950 font-black">عدد المواد المتأثرة:</span>
            <span className="px-2.5 py-0.5 bg-[#0F2942] text-white rounded-lg font-mono font-bold text-xs shadow-2xs">
              {modalData.affectedCount} مواد دراسية
            </span>
          </div>
        </div>

        {/* 💡 إشعار وتنبيه توجيهي رسمي */}
        <div className="p-2.5 sm:p-3 bg-slate-100/90 border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-950 flex items-start gap-2">
          <Info className="w-4 h-4 text-[#0F2942] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            {modalData.enable ? (
              <span>
                فور التأكيد، سيتم تفعيل إمكانية رصد وإدخال الدرجات من قبل التدريسيين المعنيين لهذه المواد، وستنعكس مباشرة وبشكل حي في بوابات الطلبة.
              </span>
            ) : (
              <span>
                فور التأكيد، سيتم قفل وتجميد إدخال درجات هذا الدور وحجبها عن بوابات الطلبة، واقتصار العرض على السعي الفصلي التكويني فقط لحين الاعتماد الرسمي.
              </span>
            )}
          </div>
        </div>

        {/* 🔘 أزرار اتخاذ القرار والتنفيذ */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              {modalData.enable ? 'نعم، تأكيد الفتح والتفعيل' : 'نعم، تأكيد الإغلاق والحجب'}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 bg-white hover:bg-slate-100 text-slate-950 rounded-xl font-black text-sm transition border border-slate-300 cursor-pointer active:scale-95 shadow-2xs"
          >
            تراجع وإلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoundConfirmModal; // 🚀 تصدير المكون كافتراضي
