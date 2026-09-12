'use client'; // ⚡ ينفذ بجهة العميل في المتصفح

// 🎯 مودال رصد درجة موحدة للطلاب المحددين في مادة التدريسي لمسار بولونيا
import React from 'react'; // 🔗 مكتبة رياكت
import { 
  Sliders, 
  X, 
  FileText, 
  ClipboardList, 
  BookOpen, 
  GraduationCap, 
  Award, 
  RotateCcw, 
  FlaskConical, 
  ChevronDown, 
  Check, 
  CheckCircle2 
} from 'lucide-react'; // 🎨 أيقونات التفاعل SVG
import { Grade } from '@/types'; // 🔗 واجهة الدرجات الرسمية
import { getCourseAssessmentScheme, getCourseGradeLimits, isAssessmentItemActive } from '@/lib/grade-utils'; // 🎛️ أدوات معايير التقييم والبنود المفتوحة

// 📋 واجهة خصائص المودال الصارمة
interface CourseBulkGradeModalProps {
  isOpen: boolean; // 🚪 حالة فتح المودال
  onClose: () => void; // ❌ دالة الإغلاق
  selectedGradeStudentIds: string[]; // 🆔 مصفوفة الطلاب المحددين
  isTheoryTeacher: boolean; // 👨‍🏫 هل هو أستاذ النظري
  isPracticalTeacher: boolean; // 🧪 هل هو أستاذ العملي
  isPracticalCourse: boolean; // 🔬 هل المادة تحتوي على جانب عملي
  isFinalExamEnabled: boolean; // 📝 هل الامتحان النهائي مفعل
  isSupplementaryEnabled: boolean; // 🔄 هل امتحان الدور الثاني مفعل
  assessmentScheme: ReturnType<typeof getCourseAssessmentScheme>; // 🎛️ مخطط التقييم للمادة
  gradeLimits: ReturnType<typeof getCourseGradeLimits>; // 📏 الحدود القصوى للدرجات
  bulkSelectedField: keyof Grade; // 🎯 حقل التقييم المختار
  setBulkSelectedField: (field: keyof Grade) => void; // 🔄 دالة تغيير الحقل
  isBulkFieldDropdownOpen: boolean; // 🔽 حالة فتح القائمة المنسدلة
  setIsBulkFieldDropdownOpen: (open: boolean) => void; // 🔄 تغيير حالة القائمة
  bulkGradeValue: string; // 🔢 القيمة المراد رصدها
  setBulkGradeValue: (val: string) => void; // 🔄 تحديث القيمة
  onApplyBulkGrade: () => void; // ⚡ تطبيق الدرجة الموحدة
}

// 📦 المكون المستقل لنافذة الرصد الموحد
export default function CourseBulkGradeModal({
  isOpen, // 🚪 حالة الفتح
  onClose, // ❌ دالة الإغلاق
  selectedGradeStudentIds, // 🆔 الطلاب
  isTheoryTeacher, // 👨‍🏫 النظري
  isPracticalTeacher, // 🧪 العملي
  isPracticalCourse, // 🔬 كورس عملي
  isFinalExamEnabled, // 📝 النهائي
  isSupplementaryEnabled, // 🔄 الإكمال
  assessmentScheme, // 🎛️ المخطط
  gradeLimits, // 📏 الحدود
  bulkSelectedField, // 🎯 الحقل المختار
  setBulkSelectedField, // 🔄 تغيير الحقل
  isBulkFieldDropdownOpen, // 🔽 حالة المنسدلة
  setIsBulkFieldDropdownOpen, // 🔄 تبديل المنسدلة
  bulkGradeValue, // 🔢 القيمة
  setBulkGradeValue, // 🔄 تحديث القيمة
  onApplyBulkGrade // ⚡ تطبيق
}: CourseBulkGradeModalProps) {
  // 🛡️ إذا لم تكن النافذة مفتوحة لا ترسم شيئاً
  if (!isOpen) return null;

  // 📋 توليد قائمة عناصر التقييم المتاحة وفق صلاحيات الأستاذ والبنود المفتوحة فقط
  const availableBulkAssessmentItems = [
    ...(isTheoryTeacher ? [
      ...(isAssessmentItemActive(assessmentScheme.quiz1) ? [{ key: 'quiz1' as keyof Grade, title: assessmentScheme.quiz1.title_ar, max: assessmentScheme.quiz1.max_score, icon: FileText, desc: 'امتحان الكويز الأول' }] : []),
      ...(isAssessmentItemActive(assessmentScheme.quiz2) ? [{ key: 'quiz2' as keyof Grade, title: assessmentScheme.quiz2.title_ar, max: assessmentScheme.quiz2.max_score, icon: FileText, desc: 'امتحان الكويز الثاني' }] : []),
      ...(isAssessmentItemActive(assessmentScheme.assignment1) ? [{ key: 'assignment1' as keyof Grade, title: assessmentScheme.assignment1.title_ar, max: assessmentScheme.assignment1.max_score, icon: ClipboardList, desc: 'الواجب الدراسي الأول' }] : []),
      ...(isAssessmentItemActive(assessmentScheme.assignment2) ? [{ key: 'assignment2' as keyof Grade, title: assessmentScheme.assignment2.title_ar, max: assessmentScheme.assignment2.max_score, icon: ClipboardList, desc: 'الواجب الدراسي الثاني' }] : []),
      ...(isAssessmentItemActive(assessmentScheme.report) ? [{ key: 'report' as keyof Grade, title: assessmentScheme.report.title_ar, max: assessmentScheme.report.max_score, icon: BookOpen, desc: 'تقرير وبحث الفصل' }] : []),
      ...(isAssessmentItemActive(assessmentScheme.midterm) ? [{ key: 'midterm' as keyof Grade, title: assessmentScheme.midterm.title_ar, max: assessmentScheme.midterm.max_score, icon: GraduationCap, desc: 'امتحان نصف الفصل (المدتيرم)' }] : []),
      ...(isFinalExamEnabled ? [{ key: 'final_exam' as keyof Grade, title: assessmentScheme.final_exam.title_ar, max: assessmentScheme.final_exam.max_score, icon: Award, desc: 'الامتحان النهائي للمادة' }] : []),
      ...(isSupplementaryEnabled ? [{ key: 'supplementary_exam' as keyof Grade, title: 'امتحان الدور الثاني (الإكمال)', max: 50, icon: RotateCcw, desc: 'امتحان الدور الثاني' }] : []),
    ] : []),
    ...(isPracticalTeacher && isPracticalCourse && isAssessmentItemActive(assessmentScheme.practical) ? [
      { key: 'practical' as keyof Grade, title: assessmentScheme.practical.title_ar, max: assessmentScheme.practical.max_score, icon: FlaskConical, desc: 'امتحان التقييم العملي' },
    ] : []),
  ];

  // 🎯 العنصر المختار حالياً
  const currentBulkItem = availableBulkAssessmentItems.find(item => item.key === bulkSelectedField) || availableBulkAssessmentItems[0];
  const CurrentIcon = currentBulkItem?.icon || FileText; // 🎨 أيقونة العنصر المختار

  return (
    // 🌌 خلفية معتمة تملأ كامل الشاشة مع تأثير زجاجي ناعم
    <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-3 sm:p-4 animate-in fade-in duration-150" dir="rtl">
      {/* 📦 صندوق المودال الأبيض بحدود أنيقة */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-right relative animate-in zoom-in-95 duration-200">
        
        {/* 📌 الهيدر الثابت للكارد */}
        <div className="p-5 sm:p-6 bg-white border-b-2 border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-950 rounded-2xl border-2 border-blue-300 shrink-0">
              <Sliders className="w-6 h-6 text-blue-900" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-black">رصد درجة موحدة للطلاب المحددين</h3>
              <p className="text-xs sm:text-sm font-black text-slate-800 mt-0.5">
                سيتم تطبيق الدرجة على ({selectedGradeStudentIds.length}) طالب محدد في المسودة
              </p>
            </div>
          </div>
          {/* ❌ زر إغلاق النافذة */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // 🚪 دالة الإغلاق
            className="p-2 text-black hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0"
            title="إغلاق النافذة"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 📜 الجسم القابل للتمرير */}
        <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {/* 🎯 اختيار بند التقييم */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-base font-black text-black flex items-center gap-1.5">
                <Sliders className="w-5 h-5 text-blue-900" />
                <span>اختر بند التقييم المطلوب:</span>
              </label>
              <span className="text-sm font-black text-black">
                الحد الأقصى: <strong className="text-black font-black underline">{gradeLimits[bulkSelectedField] || currentBulkItem?.max || 50}</strong> درجة
              </span>
            </div>

            {/* زر تشغيل القائمة المنسدلة */}
            <div className="relative">
              <button
                type="button" // 🔘 نوع الزر
                onClick={() => setIsBulkFieldDropdownOpen(!isBulkFieldDropdownOpen)} // 🔄 فتح/إغلاق
                className="w-full p-4 bg-slate-50 hover:bg-slate-100 border-2 border-slate-400 hover:border-black rounded-2xl flex items-center justify-between gap-3 transition cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-[#0F2942] text-white rounded-xl shadow-sm shrink-0">
                    <CurrentIcon className="w-6 h-6 text-cyan-300" />
                  </div>
                  <div className="text-right">
                    <div className="font-black text-lg text-black flex items-center gap-2.5">
                      <span>{currentBulkItem?.title}</span>
                      <span className="px-2.5 py-0.5 bg-blue-100 text-black rounded-lg text-sm font-black border border-blue-300">
                        من {currentBulkItem?.max}
                      </span>
                    </div>
                    <p className="text-sm font-black text-black mt-1">{currentBulkItem?.desc}</p>
                  </div>
                </div>

                <div className="p-2 bg-slate-200 text-black rounded-xl border border-slate-300">
                  <ChevronDown className={`w-6 h-6 transition-transform duration-200 ${isBulkFieldDropdownOpen ? 'rotate-180 text-black' : 'text-black'}`} />
                </div>
              </button>

              {/* القائمة المنسدلة المنبثقة */}
              {isBulkFieldDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setIsBulkFieldDropdownOpen(false)}
                  />
                  <div className="absolute top-full mt-2 right-0 left-0 bg-white border-2 border-slate-400 rounded-2xl shadow-2xl p-2 z-50 max-h-60 overflow-y-auto space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
                    {availableBulkAssessmentItems.map((item) => {
                      const isSelected = item.key === bulkSelectedField;
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            setBulkSelectedField(item.key);
                            setIsBulkFieldDropdownOpen(false);
                          }}
                          className={`w-full p-3 rounded-xl flex items-center justify-between gap-3 transition cursor-pointer text-right ${
                            isSelected
                              ? 'bg-[#0F2942] text-white shadow-sm'
                              : 'hover:bg-slate-100 text-black'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20 text-cyan-300' : 'bg-slate-200 text-slate-800'}`}>
                              <ItemIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-base font-black text-black">{item.title}</div>
                              <div className="text-sm font-black text-black mt-0.5">{item.desc}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-1 bg-slate-200 text-black rounded-lg text-sm font-black border border-slate-400">
                              من {item.max}
                            </span>
                            {isSelected && <Check className="w-5 h-5 text-blue-900 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* شرائح الاختيار السريع */}
            <div className="pt-1">
              <div className="text-xs font-black text-black mb-1.5">اختيار سريع ومباشر:</div>
              <div className="flex flex-wrap items-center gap-1.5">
                {availableBulkAssessmentItems.map((item) => {
                  const isSelected = item.key === bulkSelectedField;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setBulkSelectedField(item.key);
                        setIsBulkFieldDropdownOpen(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                        isSelected
                          ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-black border-slate-400'
                      }`}
                    >
                      {item.title} ({item.max})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* إدخال الدرجة */}
          <div className="space-y-2.5 pt-2.5 border-t-2 border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-black">
                الدرجة الموحدة المراد رصدها:
              </label>
              <span className="text-xs font-black text-black bg-blue-100 px-2.5 py-0.5 rounded-md border border-blue-300">
                الحد الأقصى: {gradeLimits[bulkSelectedField] || 50}
              </span>
            </div>

            <div className="relative">
              <input
                type="number" // 🔢 نوع الحقل رقمي
                step="0.5" // 🎯 خطوة الزيادة نصف درجة
                min="0" // 🛑 أقل درجة صفر
                max={gradeLimits[bulkSelectedField] || 50} // 🔝 أقصى حد للدرجة
                value={bulkGradeValue} // 💾 قيمة الدرجة بالحالة
                onChange={(e) => setBulkGradeValue(e.target.value)} // 🔄 تحديث القيمة فوراً
                placeholder="أدخل الدرجة (مثال: 4.5)" // 💡 نص التلميح التوضيحي
                className="w-full p-3 bg-slate-50 border-2 border-slate-400 hover:border-black focus:border-[#0F2942] rounded-2xl font-black text-xl text-black placeholder:text-base placeholder:font-medium placeholder:text-slate-400 text-center focus:outline-none transition shadow-inner" // 🎨 تلميح رصاصي مريح للعين
                autoFocus // 🎯 تركيز مباشر
              />
            </div>

            {/* أزرار مساعدة سريعة */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setBulkGradeValue(String(gradeLimits[bulkSelectedField] || 5))}
                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-black border-2 border-emerald-400 rounded-xl text-xs font-black transition cursor-pointer"
              >
                الدرجة الكاملة ({gradeLimits[bulkSelectedField] || 5})
              </button>
              <button
                type="button"
                onClick={() => setBulkGradeValue(String((gradeLimits[bulkSelectedField] || 5) / 2))}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-black border-2 border-blue-400 rounded-xl text-xs font-black transition cursor-pointer"
              >
                نصف الدرجة ({(gradeLimits[bulkSelectedField] || 5) / 2})
              </button>
              <button
                type="button"
                onClick={() => setBulkGradeValue('0')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-black border-2 border-slate-400 rounded-xl text-xs font-black transition cursor-pointer"
              >
                صفر (0)
              </button>
            </div>
          </div>
        </div>

        {/* 📌 الفوتر الثابت للكارد */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t-2 border-slate-200 flex items-center justify-end gap-3 shrink-0 rounded-b-3xl">
          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // 🚪 إغلاق
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-sm sm:text-base font-black rounded-xl border-2 border-slate-400 transition cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button" // 🔘 نوع الزر
            onClick={onApplyBulkGrade} // ⚡ تطبيق الدرجة
            className="px-7 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-sm sm:text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
          >
            <CheckCircle2 className="w-5 h-5 text-cyan-300" />
            <span>تطبيق على ({selectedGradeStudentIds.length}) طالب</span>
          </button>
        </div>
      </div>
    </div>
  );
}
