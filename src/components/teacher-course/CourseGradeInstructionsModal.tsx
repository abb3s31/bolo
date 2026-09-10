'use client'; // ⚡ ينفذ بجهة العميل في المتصفح

// ℹ️ نافذة تعليمات وضوابط رصد واستيراد درجات مادة الأستاذ لمسار بولونيا
import React from 'react'; // 🔗 مكتبة رياكت
import { BookOpen, X, CheckCircle2, Download } from 'lucide-react'; // 🎨 أيقونات التفاعل SVG
import { getCourseAssessmentScheme } from '@/lib/grade-utils'; // 🎛️ أدوات معايير التقييم

// 📋 واجهة خصائص المودال
interface CourseGradeInstructionsModalProps {
  isOpen: boolean; // 🚪 حالة فتح المودال
  onClose: () => void; // ❌ دالة الإغلاق
  courseName: string; // 📚 اسم المادة الدراسية
  assessmentScheme: ReturnType<typeof getCourseAssessmentScheme>; // 🎛️ مخطط التقييم المعتمد
  isPracticalCourse: boolean; // 🔬 هل المادة تحتوي جانب عملي
  onDownloadTemplate: () => void; // 📥 دالة تنزيل نموذج الإكسل
}

// 📦 المكون المستقل لتعليمات درجات المادة
export default function CourseGradeInstructionsModal({
  isOpen, // 🚪 حالة الفتح
  onClose, // ❌ الإغلاق
  courseName, // 📚 اسم المادة
  assessmentScheme, // 🎛️ المخطط
  isPracticalCourse, // 🔬 عملي
  onDownloadTemplate // 📥 التحميل
}: CourseGradeInstructionsModalProps) {
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
            <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl border border-blue-200 shrink-0">
              <BookOpen className="w-6 h-6 text-blue-900" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-950">تعليمات وضوابط رصد درجات مادة ({courseName})</h3>
              <p className="text-sm font-bold text-slate-700 mt-0.5">جامعة الإمام جعفر الصادق (ع) - فرع ميسان | مسار بولونيا</p>
            </div>
          </div>
          {/* ❌ زر الإغلاق */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // 🚪 إغلاق
            className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer" // 🎨 التنسيق
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 📄 نصوص وشرح التعليمات الأكاديمية */}
        <div className="space-y-3.5 text-base font-black text-slate-900 leading-relaxed overflow-y-auto pl-1 flex-1">
          {/* 1. الأوزان */}
          <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-blue-950 font-black">
              <CheckCircle2 className="w-5 h-5 text-blue-800 shrink-0" />
              <span>1. توزيع أوزان درجات مسار بولونيا للمادة:</span>
            </div>
            <p className="text-sm text-slate-700 font-bold mr-7">
              يتم احتساب السعي الفصلي (من 50) والامتحان النهائي (من 50) وفق الأوزان المحددة من رئاسة القسم:
              الكويزات ({assessmentScheme.quiz1.max_score + assessmentScheme.quiz2.max_score} درجات)، الواجبات ({assessmentScheme.assignment1.max_score + assessmentScheme.assignment2.max_score} درجات)، التقرير ({assessmentScheme.report.max_score} درجات)، النصفي ({assessmentScheme.midterm.max_score} درجات) {isPracticalCourse ? `، والعملي (${assessmentScheme.practical.max_score} درجات)` : ''}.
            </p>
          </div>

          {/* 2. المطابقة */}
          <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-blue-950 font-black">
              <CheckCircle2 className="w-5 h-5 text-blue-800 shrink-0" />
              <span>2. مطابقة أسماء الطلبة والتسلسل:</span>
            </div>
            <p className="text-sm text-slate-700 font-bold mr-7">
              تتم مطابقة درجات الطلاب تلقائياً بالاسم الرباعي والتسلسل، دون الحاجة للرقم الجامعي.
            </p>
          </div>

          {/* 3. الحدود */}
          <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-blue-950 font-black">
              <CheckCircle2 className="w-5 h-5 text-blue-800 shrink-0" />
              <span>3. حدود الدرجات القصوى والدرجات الرقمية:</span>
            </div>
            <p className="text-sm text-slate-700 font-bold mr-7">
              تأكد من عدم إدخال درجات تتجاوز الحد الأقصى لكل بند، وتجنب استخدام الرموز أو النصوص داخل خلايا الدرجات.
            </p>
          </div>

          {/* 4. الصلاحيات */}
          <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-blue-950 font-black">
              <CheckCircle2 className="w-5 h-5 text-blue-800 shrink-0" />
              <span>4. الصلاحيات الأكاديمية وسجل الأمان:</span>
            </div>
            <p className="text-sm text-slate-700 font-bold mr-7">
              يقوم النظام بتحديث الحقول المصرح لك بها فقط (النظري لأستاذ النظري، والعملي لأستاذ المختبر)، مع توثيق كافة التعديلات في سجل الأمان.
            </p>
          </div>
        </div>

        {/* 🔘 فوتر نافذة التعليمات مع زر تنزيل النموذج */}
        <div className="pt-3 border-t-2 border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button" // 🔘 نوع الزر
            onClick={() => {
              onDownloadTemplate(); // 📥 تنزيل النموذج
              onClose(); // 🚪 إغلاق
            }}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95" // 🎨 كحلي
          >
            <Download className="w-5 h-5 text-cyan-300" />
            <span>تحميل نموذج Excel المعتمد للمادة</span>
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
