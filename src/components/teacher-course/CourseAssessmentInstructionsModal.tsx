'use client'; // ⚡ ينفذ بجهة العميل في المتصفح

// 📝 مودال تعليمات وضوابط التكليفات والامتحانات الفصلية لمسار بولونيا
import React from 'react'; // 🔗 مكتبة رياكت
import { FileText, X, CheckCircle2 } from 'lucide-react'; // 🎨 أيقونات التفاعل SVG
import { getCourseAssessmentScheme, isAssessmentItemActive } from '@/lib/grade-utils'; // 🎛️ أدوات معايير التقييم وفحص البنود النشطة

// 📋 واجهة خصائص المودال
interface CourseAssessmentInstructionsModalProps {
  isOpen: boolean; // 🚪 حالة فتح المودال
  onClose: () => void; // ❌ دالة إغلاق المودال
  courseName: string; // 📚 اسم المادة الدراسية
  assessmentScheme?: ReturnType<typeof getCourseAssessmentScheme>; // 🎛️ مخطط التقييم المعتمد للمادة
}

// 📦 المكون المستقل لتعليمات التكليفات والامتحانات
export default function CourseAssessmentInstructionsModal({
  isOpen, // 🚪 حالة الفتح
  onClose, // ❌ الإغلاق
  courseName, // 📚 اسم المادة
  assessmentScheme // 🎛️ المخطط
}: CourseAssessmentInstructionsModalProps) {
  // 🧮 صياغة نص البنود النشطة للتكليفات
  const activePlanText = React.useMemo(() => {
    if (!assessmentScheme) {
      return 'يتضمن مسار بولونيا تقييماً دورياً يشمل التكليفات والواجبات والتقارير والامتحانات الفصلية وفق مخطط المادة المعتمد من رئاسة القسم.';
    }
    const parts: string[] = [];
    const q1 = isAssessmentItemActive(assessmentScheme.quiz1);
    const q2 = isAssessmentItemActive(assessmentScheme.quiz2);
    if (q1 && q2) parts.push('كويزين دوريين');
    else if (q1 || q2) parts.push('كويز فصلي');

    const a1 = isAssessmentItemActive(assessmentScheme.assignment1);
    const a2 = isAssessmentItemActive(assessmentScheme.assignment2);
    if (a1 && a2) parts.push('واجبين بيتيين');
    else if (a1 || a2) parts.push('واجب فصلي');

    if (isAssessmentItemActive(assessmentScheme.report)) parts.push('تقريراً علمياً ونشاطاً');
    if (isAssessmentItemActive(assessmentScheme.midterm)) parts.push('امتحاناً نصف فصلي');
    if (isAssessmentItemActive(assessmentScheme.practical)) parts.push('تقييم الجانب العملي والمختبري');

    return parts.length > 0 
      ? `يتضمن تقييم المادة في مسار بولونيا: ${parts.join('، ')} وفق الأوزان المعتمدة من رئاسة القسم.`
      : 'يتضمن مسار بولونيا تقييماً مستمراً وفق التوزيع المعتمد من رئاسة القسم.';
  }, [assessmentScheme]);

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
              {activePlanText}
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
