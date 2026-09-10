'use client'; // ⚡ ينفذ بجهة العميل في المتصفح

// 📋 مودال معاينة ومطابقة سجل الحضور من ملف Excel لمادة التدريسي
import React from 'react'; // 🔗 مكتبة رياكت
import { ClipboardList, X, CheckCircle2 } from 'lucide-react'; // 🎨 أيقونات التفاعل SVG

// 📋 واجهة خصائص المودال
interface CourseAttendanceExcelPreviewModalProps {
  rows: Record<string, string | number | null | undefined>[] | null; // 📑 صفوف ملف إكسل الحضور
  onClose: () => void; // ❌ دالة إغلاق المودال
  courseName: string; // 📚 اسم المادة الدراسية
  onConfirmImport: () => void; // ⚡ دالة تأكيد واستيراد الحضور
}

// 📦 المكون المستقل لمعاينة سجل الحضور
export default function CourseAttendanceExcelPreviewModal({
  rows, // 📑 الصفوف
  onClose, // ❌ الإغلاق
  courseName, // 📚 اسم المادة
  onConfirmImport // ⚡ التأكيد
}: CourseAttendanceExcelPreviewModalProps) {
  // 🛡️ إذا لم تكن هناك صفوف لا ترسم المودال
  if (!rows) return null;

  return (
    // 🌌 خلفية معتمة تملأ كامل الشاشة مع تأثير زجاجي ناعم
    <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150" dir="rtl">
      {/* 📦 صندوق المودال الأبيض بحدود أنيقة */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-5xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* 🏷️ هيدر النافذة */}
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-950 rounded-2xl border border-emerald-300 shrink-0">
              <ClipboardList className="w-6 h-6 text-emerald-900" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-950">معاينة ومطابقة سجل الحضور من ملف Excel لمادة ({courseName})</h3>
              <p className="text-sm font-bold text-slate-700 mt-0.5">
                تم العثور على ({rows.length}) سجل طالب جاهز للاستيراد
              </p>
            </div>
          </div>
          {/* ❌ زر الإغلاق */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // 🚪 إغلاق
            className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 📊 جدول معاينة الحضور لـ 15 أسبوعاً */}
        <div className="overflow-x-auto overflow-y-auto border-2 border-slate-200 rounded-2xl flex-1 max-h-[45vh]">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-emerald-900 text-white font-black text-xs sm:text-sm sticky top-0 z-10">
                <th className="p-3 border-l border-emerald-800 text-center w-12">ت</th>
                <th className="p-3 border-l border-emerald-800 min-w-[180px]">اسم الطالب الرباعي</th>
                {Array.from({ length: 15 }, (_, i) => (
                  <th key={i} className="p-2 border-l border-emerald-800 text-center text-xs">أ {i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const stdName = String(row['اسم الطالب الرباعي'] || row['اسم الطالب'] || row['student_name'] || row['الاسم'] || row['std_name'] || '').trim();
                return (
                  <tr key={idx} className={`border-b border-slate-200 font-black ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <td className="p-2.5 border-l border-slate-200 text-center text-slate-700">{idx + 1}</td>
                    <td className="p-2.5 border-l border-slate-200 text-slate-950 font-bold">{stdName || '—'}</td>
                    {Array.from({ length: 15 }, (_, i) => {
                      const wVal = String(row[`أسبوع ${i + 1} (حاضر / غائب / مجاز)`] || row[`أسبوع ${i + 1}`] || row[`اسبوع ${i + 1}`] || row[`week_${i + 1}`] || '-');
                      const isAbsent = wVal.includes('غائب') || wVal.includes('غياب');
                      const isExcused = wVal.includes('مجاز') || wVal.includes('عذر');
                      return (
                        <td key={i} className={`p-2 border-l border-slate-200 text-center text-xs ${isAbsent ? 'text-rose-600 font-black bg-rose-50' : isExcused ? 'text-blue-700 font-black bg-blue-50' : 'text-emerald-700 font-bold'}`}>
                          {wVal}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 🔘 الفوتر وأزرار التأكيد */}
        <div className="pt-3 border-t-2 border-slate-200 flex flex-wrap items-center justify-end gap-3 shrink-0">
          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // 🚪 إغلاق
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 text-base font-black rounded-xl border border-slate-300 transition cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button" // 🔘 نوع الزر
            onClick={onConfirmImport} // ⚡ استيراد الحضور
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>تأكيد واستيراد سجل الحضور الآن</span>
          </button>
        </div>
      </div>
    </div>
  );
}
