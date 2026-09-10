'use client'; // ⚡ ينفذ بجهة العميل في المتصفح

// 📝 مودال تعليمات وضوابط التكليفات والامتحانات الفصلية لمسار بولونيا
import React from 'react'; // 🔗 مكتبة رياكت
import { FileText, X, CheckCircle2 } from 'lucide-react'; // 🎨 أيقونات التفاعل SVG

// 📋 واجهة خصائص المودال
interface CourseAssessmentInstructionsModalProps {
  isOpen: boolean; // 🚪 حالة فتح المودال
  onClose: () => void; // ❌ دالة إغلاق المودال
  courseName: string; // 📚 اسم المادة الدراسية
}

// 📦 المكون المستقل لتعليمات التكليفات والامتحانات
export default function CourseAssessmentInstructionsModal({
  isOpen, // 🚪 حالة الفتح
  onClose, // ❌ الإغلاق
  courseName // 📚 اسم المادة
}: CourseAssessmentInstructionsModalProps) {
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
            <div className="p-3 bg-sky-100 text-sky-900 rounded-2xl border border-sky-200 shrink-0">
              <FileText className="w-6 h-6 text-sky-900" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-950">تعليمات وضوابط التكليفات والامتحانات</h3>
              <p className="text-sm font-bold text-slate-700 mt-0.5">مادة: {courseName} | مسار بولونيا</p>
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
          {/* 1. خطة التقييم */}
          <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-sky-950 font-black">
              <CheckCircle2 className="w-5 h-5 text-sky-800 shrink-0" />
              <span>1. خطة التقييم والتكليفات المستمرة:</span>
            </div>
            <p className="text-sm text-slate-700 font-bold mr-7">
              يتضمن مسار بولونيا تقييماً دورياً يشمل كويزين، واجبين بيتيين، تقريراً علمياً، وامتحاناً نصف فصلي.
            </p>
          </div>

          {/* 2. مواعيد التسليم */}
          <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-sky-950 font-black">
              <CheckCircle2 className="w-5 h-5 text-sky-800 shrink-0" />
              <span>2. مواعيد التسليم والتصحيح:</span>
            </div>
            <p className="text-sm text-slate-700 font-bold mr-7">
              يجب تحديد مواعيد تسليم واضحة للتكليفات، مع إمكانية تصحيح إجابات الطلاب وإرسال الملاحظات التوجيهية لهم مباشرة عبر المنظومة.
            </p>
          </div>
        </div>

        {/* 🔘 زر الإغلاق */}
        <div className="pt-3 border-t-2 border-slate-200 flex justify-end shrink-0">
          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // 🚪 إغلاق
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 text-base font-black rounded-xl border border-slate-300 transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
