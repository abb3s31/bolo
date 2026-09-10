'use client'; // ⚡ ينفذ بجهة العميل في المتصفح

// ⚖️ نافذة مراجعة ومقارنة الفروقات بين الدرجات السابقة والحديثة لمسار بولونيا
import React from 'react'; // 🔗 مكتبة رياكت
import { History, X, RotateCcw, Save } from 'lucide-react'; // 🎨 أيقونات التفاعل SVG
import { Grade } from '@/types'; // 🔗 الأنواع الصارمة

// 📋 واجهة بيانات فروقات الدرجة المعلقة
export interface PendingGradeDiff {
  gradeId: string; // 🆔 معرف سجل الدرجة
  studentId: string; // 🆔 معرف الطالب
  studentName: string; // 👤 اسم الطالب
  fieldName: keyof Grade; // 📝 مفتاح الحقل المعدل
  fieldLabelAr: string; // 📝 التسمية العربية للحقل
  oldValue: number; // 🔢 الدرجة القديمة
  newValue: number; // 🔢 الدرجة الجديدة
  delta: number; // ⚖️ الفارق الحسابي (+ أو -)
}

// 📋 واجهة خصائص المودال
interface CoursePendingDiffModalProps {
  isOpen: boolean; // 🚪 حالة فتح المودال
  onClose: () => void; // ❌ دالة الإغلاق
  courseName: string; // 📚 اسم المادة الدراسية
  pendingDiffs: Record<string, PendingGradeDiff>; // 📑 قاموس الفروقات المعلقة
  onRevertSingleDiff: (key: string) => void; // 🔄 دالة التراجع عن تعديل مفرد
  onSaveAllPendingGrades: () => void; // 💾 دالة حفظ كافة التعديلات
  isSavingPendingGrades: boolean; // ⏳ حالة التحميل أثناء الحفظ
}

// 📦 المكون الرئيسي لنافذة مقارنة وتأكيد الفروقات
export default function CoursePendingDiffModal({
  isOpen, // 🚪 حالة الفتح
  onClose, // ❌ الإغلاق
  courseName, // 📚 اسم المادة
  pendingDiffs, // 📑 الفروقات
  onRevertSingleDiff, // 🔄 التراجع
  onSaveAllPendingGrades, // 💾 الحفظ
  isSavingPendingGrades // ⏳ التحميل
}: CoursePendingDiffModalProps) {
  // 🛡️ إذا المودال مغلق لا نرسم أي عنصر
  if (!isOpen) return null;

  return (
    // 🌌 خلفية معتمة تملأ كامل الشاشة مع تأثير زجاجي ناعم
    <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150" dir="rtl">
      {/* 📦 صندوق المودال الأبيض بحدود أنيقة وظلال بارزة */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-4xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* 🏷️ هيدر النافذة مع الأيقونة والاسم وزر الإغلاق */}
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-950 rounded-2xl border border-blue-300 shrink-0">
              <History className="w-6 h-6 text-blue-900" />
            </div>
            <div>
              <h3 className="text-xl font-black text-black">مسودة مراجعة ومقارنة التعديلات المعلقة</h3>
              <p className="text-sm font-black text-black mt-0.5">
                مقارنة الدرجة السابقة (قبل التعديل) مقابل الدرجة المقترحة (بعد التعديل) لمادة ({courseName})
              </p>
            </div>
          </div>
          {/* ❌ زر إغلاق المودال */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // 🚪 إغلاق
            className="p-2 text-black hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer" // 🎨 التنسيق
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 📊 جدول مقارنة الدرجات قبل وبعد التعديل */}
        <div className="overflow-x-auto overflow-y-auto border-2 border-slate-300 rounded-2xl flex-1 max-h-[50vh]">
          <table className="w-full text-right border-collapse text-sm">
            {/* 🏷️ عناوين الأعمدة */}
            <thead>
              <tr className="bg-[#0F2942] text-white font-black text-xs sm:text-sm sticky top-0 z-10">
                <th className="p-3 border-l border-[#1e4570] text-center w-12">ت</th>
                <th className="p-3 border-l border-[#1e4570]">اسم الطالب</th>
                <th className="p-3 border-l border-[#1e4570] text-center">نوع التقييم</th>
                <th className="p-3 border-l border-[#1e4570] text-center">الدرجة السابقة</th>
                <th className="p-3 border-l border-[#1e4570] text-center">الدرجة الحديثة</th>
                <th className="p-3 border-l border-[#1e4570] text-center">فارق التغيير</th>
                <th className="p-3 text-center w-24">تراجع</th>
              </tr>
            </thead>
            {/* 📄 صفوف المقارنة لكل طالب وحقل */}
            <tbody className="divide-y divide-slate-200 font-black">
              {Object.entries(pendingDiffs).map(([key, diff], idx) => (
                <tr key={key} className={`hover:bg-slate-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}`}>
                  <td className="p-3 border-l border-slate-300 text-center text-black font-black">{idx + 1}</td>
                  <td className="p-3 border-l border-slate-300 text-black font-black">{diff.studentName}</td>
                  <td className="p-3 border-l border-slate-300 text-center text-black font-black">{diff.fieldLabelAr}</td>
                  <td className="p-3 border-l border-slate-300 text-center">
                    <span className="px-2.5 py-1 bg-slate-100 text-black rounded-lg border border-slate-400 line-through font-black">
                      {diff.oldValue}
                    </span>
                  </td>
                  <td className="p-3 border-l border-slate-300 text-center">
                    <span className="px-2.5 py-1 bg-blue-50 text-black rounded-lg border border-blue-400 font-black">
                      {diff.newValue}
                    </span>
                  </td>
                  <td className="p-3 border-l border-slate-300 text-center">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                      diff.delta > 0 ? 'bg-emerald-100 text-black' : diff.delta < 0 ? 'bg-rose-100 text-black' : 'bg-slate-100 text-black'
                    }`}>
                      {diff.delta > 0 ? `+${diff.delta}` : `${diff.delta}`}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {/* 🔄 زر التراجع عن التعديل الفردي */}
                    <button
                      type="button" // 🔘 نوع الزر
                      onClick={() => onRevertSingleDiff(key)} // 🔄 استدعاء دالة التراجع
                      className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-800 rounded-lg border border-slate-300 hover:border-rose-300 transition cursor-pointer" // 🎨 التنسيق
                      title="تراجع عن هذا التعديل بمفرده"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🔘 شريط أزرار الحفظ والإغلاق السفلي */}
        <div className="pt-3 border-t-2 border-slate-200 flex items-center justify-end gap-3 shrink-0">
          {/* ❌ زر إغلاق المعاينة */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // 🚪 إغلاق
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 text-base font-black rounded-xl border border-slate-300 transition cursor-pointer" // 🎨 ستايل ثانوي
          >
            إغلاق المعاينة
          </button>
          {/* 💾 زر الحفظ والاعتماد الرسمي */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={onSaveAllPendingGrades} // 💾 حفظ رسمي
            disabled={isSavingPendingGrades} // 🔒 تعطيل أثناء الحفظ
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-50" // 🎨 أخضر فاخر
          >
            <Save className="w-5 h-5 text-white" />
            <span>{isSavingPendingGrades ? 'جارٍ الحفظ والاعتماد...' : 'حفظ واعتماد التعديلات رسمياً'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
