'use client'; // ⚡ ينفذ بجهة العميل في المتصفح

// 📋 مودال تعليمات وضوابط الحضور والغياب الأسبوعي لمسار بولونيا
import React from 'react'; // 🔗 مكتبة رياكت
import { ClipboardList, X, CheckCircle2, Download } from 'lucide-react'; // 🎨 أيقونات التفاعل SVG

// 📋 واجهة خصائص المودال
interface CourseAttendanceInstructionsModalProps {
  isOpen: boolean; // 🚪 حالة فتح المودال
  onClose: () => void; // ❌ دالة الإغلاق
  onDownloadTemplate: () => void; // 📥 دالة تحميل نموذج إكسل للحضور
}

// 📦 المكون المستقل لتعليمات الحضور والغياب
export default function CourseAttendanceInstructionsModal({
  isOpen, // 🚪 حالة الفتح
  onClose, // ❌ الإغلاق
  onDownloadTemplate // 📥 التحميل
}: CourseAttendanceInstructionsModalProps) {
  // 🛡️ إذا لم تكن النافذة مفتوحة لا ترسم شيئاً
  if (!isOpen) return null;

  return (
    // 🌌 خلفية معتمة تملأ كامل الشاشة مع تأثير زجاجي ناعم
    <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150" dir="rtl">
      {/* 📦 صندوق المودال الأبيض بحدود أنيقة */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* 🏷️ هيدر النافذة */}
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-950 rounded-2xl border border-emerald-300 shrink-0">
              <ClipboardList className="w-6 h-6 text-emerald-900" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-950">تعليمات وضوابط رصد الحضور والغياب الأسبوعي</h3>
              <p className="text-sm font-bold text-slate-700 mt-0.5">جامعة الإمام جعفر الصادق (ع) - فرع ميسان | مسار بولونيا</p>
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

        {/* 📄 نصوص التعليمات */}
        <div className="space-y-3.5 text-base font-black text-slate-900 leading-relaxed overflow-y-auto pl-1 flex-1">
          {/* 1. الأسابيع */}
          <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-950 font-black">
              <CheckCircle2 className="w-5 h-5 text-emerald-800 shrink-0" />
              <span>1. نظام الأسابيع الدراسية المعتمد (15 أسبوعاً):</span>
            </div>
            <p className="text-sm text-slate-700 font-bold mr-7">
              يتكون الكورس الدراسي من 15 أسبوعاً تدريسياً معتمداً. يتم تسجيل حضور الطلاب لكل محاضرة بدقة.
            </p>
          </div>

          {/* 2. نسب الغياب والإنذارات */}
          <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-950 font-black">
              <CheckCircle2 className="w-5 h-5 text-emerald-800 shrink-0" />
              <span>2. نسب الغياب والإنذارات الأكاديمية:</span>
            </div>
            <p className="text-sm text-slate-700 font-bold mr-7">
              - <strong>الإنذار الأولي:</strong> عند بلوغ الغياب 5% من مجموع ساعات المادة.<br />
              - <strong>الإنذار النهائي:</strong> عند بلوغ الغياب 7% من مجموع ساعات المادة.<br />
              - <strong>الحرمان من الامتحان:</strong> عند تجاوز الغياب 10% بدون عذر رسمي مشروع.
            </p>
          </div>

          {/* 3. خيارات الرصد */}
          <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-950 font-black">
              <CheckCircle2 className="w-5 h-5 text-emerald-800 shrink-0" />
              <span>3. خيارات رصد الحضور المقبولة في Excel:</span>
            </div>
            <p className="text-sm text-slate-700 font-bold mr-7">
              يقبل النظام الكلمات التالية في خلايا الأسابيع: (حاضر)، (غائب)، (مجاز بعذر رسمي).
            </p>
          </div>
        </div>

        {/* 🔘 الفوتر وأزرار العمل */}
        <div className="pt-3 border-t-2 border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button" // 🔘 نوع الزر
            onClick={() => {
              onDownloadTemplate(); // 📥 تنزيل النموذج
              onClose(); // 🚪 إغلاق
            }}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            <Download className="w-5 h-5 text-emerald-200" />
            <span>تحميل نموذج Excel للحضور (15 أسبوعاً)</span>
          </button>

          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // 🚪 إغلاق
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 text-base font-black rounded-xl border border-slate-300 transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
