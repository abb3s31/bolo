'use client'; // ⚡ واجهة تفاعلية على متصفح العميل في Next.js

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import {
  Sparkles, // ✨ أيقونة الترحيل الذكي
  X, // ✖️ أيقونة الإغلاق
  Check, // ✔️ أيقونة الاختيار
  CheckCircle2, // ✅ أيقونة التأكيد
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { UserProfile } from '@/types'; // 🏷️ استيراد الأنواع الصارمة

// 📋 واجهة خصائص نافذة الترحيل الجماعي للمرحلة الدراسية
export interface BulkPromotionModalProps {
  isOpen: boolean; // 📂 حالة ظهور النافذة
  onClose: () => void; // 🛑 دالة إغلاق النافذة
  deptName: string; // 🏢 اسم القسم العلمي
  academicYear: string; // 🗓️ العام الدراسي الحالي
  deptStudents: UserProfile[]; // 👥 قائمة طلاب القسم
  bulkPromoteSourceStage: number; // 🎓 المرحلة المصدر المختارة للترحيل
  setBulkPromoteSourceStage: (stage: number) => void; // 🔄 دالة تغيير المرحلة المصدر
  onConfirmPromote: (sourceStage: number) => void; // ⚡ دالة تنفيذ الترحيل الجماعي
}

// 🏛️ مكون النافذة المنبثقة للترحيل الجماعي لطلاب المرحلة الدراسية بالكامل
export const BulkPromotionModal: React.FC<BulkPromotionModalProps> = ({
  isOpen, // 📂 حالة الفتح
  onClose, // 🛑 دالة الإغلاق
  deptName, // 🏢 اسم القسم
  academicYear, // 🗓️ العام الدراسي
  deptStudents, // 👥 طلاب القسم
  bulkPromoteSourceStage, // 🎓 المرحلة المصدر
  setBulkPromoteSourceStage, // 🔄 تحديث المرحلة
  onConfirmPromote, // ⚡ تأكيد الترحيل
}) => {
  // 🛑 إذا كانت النافذة مغلقة لا نرسم شيئاً
  if (!isOpen) return null;

  // 🧮 حساب عدد الطلاب المؤهلين للمرحلة المختارة حالياً
  const eligibleStudentsCount = deptStudents.filter((s) => {
    const sStage = Number(s.stage_number) || 1;
    if (sStage !== Number(bulkPromoteSourceStage)) return false;
    if (Number(bulkPromoteSourceStage) < 4) return true;
    const isGrad = s.is_graduated === true || String(s.is_graduated) === 'true';
    return !isGrad;
  }).length;

  return (
    // 🌌 غطاء التعتيم الخلفي للنافذة
    <div
      className="fixed inset-0 z-[999999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden min-h-[100dvh]"
      dir="rtl"
    >
      {/* 📦 الحاوية البيضاء الرئيسية للمودال */}
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full max-h-[90vh] shadow-2xl flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* 🏷️ الهيدر الثابت للنافذة */}
        <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-200 bg-white shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-950 rounded-2xl border border-emerald-100">
              <Sparkles className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950">الترحيل الجماعي لطلاب المرحلة</h3>
              <p className="text-sm font-black text-slate-700">قسم {deptName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl transition cursor-pointer border border-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 📜 محتوى الخيارات القابل للتمرير داخلياً */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain space-y-4 text-sm font-black">
          <div>
            <label className="block text-slate-800 font-bold mb-2">
              اختر المرحلة المراد ترحيل طلابها الناجحين:
            </label>

            {/* 📋 شبكة خيارات المراحل الأربعة */}
            <div className="grid grid-cols-1 gap-2.5">
              {[
                { stage: 1, label: 'ترحيل طلاب المرحلة الأولى إلى المرحلة الثانية', sub: 'نقل طلاب المرحلة الأولى للثانية' },
                { stage: 2, label: 'ترحيل طلاب المرحلة الثانية إلى المرحلة الثالثة', sub: 'نقل طلاب المرحلة الثانية للثالثة' },
                { stage: 3, label: 'ترحيل طلاب المرحلة الثالثة إلى المرحلة الرابعة', sub: 'نقل طلاب المرحلة الثالثة للمنتهية' },
                { stage: 4, label: `تخريج طلاب المرحلة الرابعة (دفعة ${academicYear})`, sub: 'اعتماد تخرج الدفعة وتثبيت الحالة' },
              ].map((item) => {
                const studentCount = deptStudents.filter((s) => {
                  const sStage = Number(s.stage_number) || 1;
                  if (sStage !== item.stage) return false;
                  if (item.stage < 4) return true;
                  const isGrad = s.is_graduated === true || String(s.is_graduated) === 'true';
                  return !isGrad;
                }).length;
                const isSelected = bulkPromoteSourceStage === item.stage;

                return (
                  <button
                    key={item.stage}
                    type="button"
                    onClick={() => setBulkPromoteSourceStage(item.stage)}
                    className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {item.stage === 4 ? '🎓' : item.stage}
                      </div>
                      <div>
                        <div className={`font-black text-sm ${isSelected ? 'text-emerald-950' : 'text-slate-900'}`}>
                          {item.label}
                        </div>
                        <div className="text-xs font-bold text-slate-500">
                          {item.sub}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                        isSelected 
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}>
                        {studentCount} طالب
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 📊 صندوق ملخص العملية */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <span>إجمالي الطلاب المؤهلين للترحيل:</span>
              <strong className="text-emerald-800 font-black text-sm">
                {eligibleStudentsCount} طالب
              </strong>
            </div>
            <div className="text-xs font-black text-slate-600 leading-relaxed">
              سيتم تحديث مرحلة جميع الطلاب تلقائياً وإرسال إشعارات تهنئة رسمية إلى حساباتهم وتوثيق العملية في سجلات التدقيق.
            </div>
          </div>
        </div>

        {/* 🔘 الفوتر الثابت في أسفل الكارد */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 shrink-0 z-10 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-sm font-black transition cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => onConfirmPromote(bulkPromoteSourceStage)}
            disabled={eligibleStudentsCount === 0}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] disabled:opacity-50 text-white font-black rounded-xl text-sm font-black shadow-md transition flex items-center gap-1.5 cursor-pointer border border-[#163a5f]"
          >
            <CheckCircle2 className="w-4 h-4 text-cyan-300" />
            <span>تأكيد واعتماد الترحيل الجماعي</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default BulkPromotionModal; // 🚀 تصدير المكون
