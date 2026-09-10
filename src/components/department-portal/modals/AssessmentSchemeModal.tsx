'use client'; // ⚡ تفعيل واجهة العميل التفاعلية في Next.js

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import {
  Sliders, // 🎛️ أيقونة أشرطة التحكم بالتوزيع
  Sparkles, // ✨ أيقونة القوالب الجاهزة
  FlaskConical, // 🧪 أيقونة المختبر والعملي
  BookOpen, // 📖 أيقونة النظري
  CheckCircle2, // ✅ أيقونة النجاح والمطابقة
  AlertCircle, // ⚠️ أيقونة التنبيه بالخلل
  Check, // ✔️ أيقونة الحفظ والاعتماد
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { Course, AssessmentScheme } from '@/types'; // 🏷️ استيراد الأنواع والواجهات الصارمة

// 📋 واجهة مدخلات نافذة تخصيص بنود وأوزان مسار بولونيا الـ 7
export interface AssessmentSchemeModalProps {
  isOpen: boolean; // 📂 حالة ظهور النافذة
  onClose: () => void; // 🛑 دالة إغلاق النافذة
  course: Course | null; // 📚 المقرر الدراسي المستهدف بالتخصيص
  tempAssessmentScheme: AssessmentScheme | null; // 🎛️ المخطط المؤقت الجاري تعديله (يقبل null قبل الفتح)
  setTempAssessmentScheme: React.Dispatch<React.SetStateAction<AssessmentScheme | null>>; // 🔄 دالة تحديث المخطط بما فيها إمكانية تفريغه
  deptName: string; // 🏛️ اسم القسم العلمي
  onSave: () => void; // 💾 دالة حفظ واعتماد التوزيع
  getStageNameInArabic: (stg: number) => string; // 🏷️ دالة تحويل رقم المرحلة لاسم عربي
  getDefaultAssessmentScheme: (type: 'theory_and_practical' | 'theory_only') => AssessmentScheme; // ⚙️ دالة توليد القالب الافتراضي
}

// 🏛️ مكون النافذة المنبثقة لتخصيص توزيع الدرجات وفق معايير مسار بولونيا
export const AssessmentSchemeModal: React.FC<AssessmentSchemeModalProps> = ({
  isOpen, // 📂 حالة الفتح
  onClose, // 🛑 دالة الإغلاق
  course, // 📚 المقرر
  tempAssessmentScheme, // 🎛️ المخطط المؤقت
  setTempAssessmentScheme, // 🔄 تحديث المخطط
  deptName, // 🏛️ اسم القسم
  onSave, // 💾 دالة الحفظ
  getStageNameInArabic, // 🏷️ اسم المرحلة
  getDefaultAssessmentScheme, // ⚙️ القالب الافتراضي
}) => {
  // 🛑 التحقق من شروط العرض
  if (!isOpen || !course || !tempAssessmentScheme) return null;

  return (
    // 🌌 غطاء التعتيم الخلفي للنافذة المنبثقة
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-150"
      dir="rtl"
    >
      {/* 📦 الحاوية البيضاء الرئيسية للمودال */}
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col relative overflow-hidden">
        {/* 🏷️ رأس النافذة الثابت */}
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 bg-white/95 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-950 border border-blue-300 rounded-2xl">
              <Sliders className="w-6 h-6 text-blue-900" /> {/* 🎛️ أيقونة رأس المودال */}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-900 text-white text-sm font-black rounded-md">
                  {course.code} {/* 🏷️ كود المادة */}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-sm font-black border ${
                    course.course_type === 'theory_and_practical' || course.has_practical
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                      : 'bg-blue-100 text-blue-950 border-blue-300'
                  }`}
                >
                  {course.course_type === 'theory_and_practical' || course.has_practical ? 'نظري وعملي' : 'نظري فقط'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-950 mt-0.5">
                تخصيص توزيع أوزان وعناوين التقييم: {course.name}
              </h3>
              <p className="text-sm font-black text-slate-950 font-black">
                قسم {deptName} | المرحلة {getStageNameInArabic(course.stage_number || 1)} • الكورس{' '}
                {course.semester === 2 ? 'الثاني' : 'الأول'}
              </p>
            </div>
          </div>

          {/* ✖️ زر الإغلاق */}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-xl text-sm font-black transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>

        {/* 📜 جسم الحقول القابل للتمرير داخلياً */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 overscroll-contain space-y-4">
          {/* 🎨 شريط القوالب السريعة */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <span>تطبيق قوالب التوزيع الجاهزة وفق دليل بولونيا:</span>
              </span>
              <span className="text-xs font-bold text-slate-500">انقر للتعبئة الفورية</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setTempAssessmentScheme(getDefaultAssessmentScheme('theory_and_practical'))}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-900 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              >
                <FlaskConical className="w-4 h-4 text-emerald-600" />
                <span>القالب القياسي (عملي 10 + سعي 40 + نهائي 50)</span>
              </button>
              <button
                type="button"
                onClick={() => setTempAssessmentScheme(getDefaultAssessmentScheme('theory_only'))}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-900 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>القالب النظري (نصفي 15 + تقرير 15 + سعي 20 + نهائي 50)</span>
              </button>
            </div>
          </div>

          {/* 🧮 شبكة بنود التقييم الـ 8 (الـ 7 للسعي + الامتحان النهائي) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[50vh] overflow-y-auto p-1">
            {(
              [
                { key: 'quiz1', defaultAr: 'كويز (1)', isPrac: false, roleText: 'خاص بأستاذ النظري' },
                { key: 'quiz2', defaultAr: 'كويز (2)', isPrac: false, roleText: 'خاص بأستاذ النظري' },
                { key: 'assignment1', defaultAr: 'واجب (1)', isPrac: false, roleText: 'خاص بأستاذ النظري' },
                { key: 'assignment2', defaultAr: 'واجب (2)', isPrac: false, roleText: 'خاص بأستاذ النظري' },
                { key: 'report', defaultAr: 'تقرير ونشاط', isPrac: false, roleText: 'خاص بأستاذ النظري' },
                { key: 'midterm', defaultAr: 'امتحان نصفي', isPrac: false, roleText: 'خاص بأستاذ النظري' },
                { key: 'practical', defaultAr: 'مختبر وعملي', isPrac: true, roleText: 'خاص بأستاذ العملي' },
                { key: 'final_exam', defaultAr: 'امتحان نهائي', isPrac: false, roleText: 'الامتحان النهائي' },
              ] as const
            ).map((item, idx) => {
              const config = tempAssessmentScheme[item.key];
              return (
                <div
                  key={item.key}
                  className={`p-4 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md space-y-3 ${
                    item.isPrac
                      ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/20'
                      : item.key === 'final_exam'
                      ? 'bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-400/30 md:col-span-2'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* ترويسة الكارد الصغير */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#0F2942] text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {idx + 1}
                      </span>
                      <span className="font-black text-sm text-slate-950">
                        {item.key === 'final_exam' ? 'الامتحان النهائي' : item.isPrac ? 'بند التقييم العملي' : 'بند التقييم النظري'}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                        item.isPrac
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-300 shadow-2xs'
                          : item.key === 'final_exam'
                          ? 'bg-indigo-100 text-indigo-950 border-indigo-300 shadow-2xs'
                          : 'bg-blue-50 text-blue-950 border-blue-200 shadow-2xs'
                      }`}
                    >
                      {item.roleText}
                    </span>
                  </div>

                  {/* حقل العنوان وحقل الدرجة العظمى في صف واحد مرتب وواسع */}
                  <div className="grid grid-cols-12 gap-3 items-end">
                    {/* 📝 حقل العنوان الموحد */}
                    <div className="col-span-8 sm:col-span-8 space-y-1">
                      <label className="block text-xs font-black text-slate-700">العنوان</label>
                      <input
                        type="text"
                        value={config.title_ar}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTempAssessmentScheme({
                            ...tempAssessmentScheme,
                            [item.key]: {
                              ...config,
                              title_ar: val,
                              title_en: val,
                            },
                          });
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-950 placeholder:text-slate-400 focus:bg-white focus:border-[#0F2942] focus:outline-none transition shadow-2xs"
                        placeholder={item.defaultAr}
                      />
                    </div>

                    {/* 🏆 حقل الدرجة العظمى */}
                    <div className="col-span-4 sm:col-span-4 space-y-1">
                      <label className="block text-xs font-black text-slate-700">الدرجة (Max)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={config.max_score}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setTempAssessmentScheme({
                              ...tempAssessmentScheme,
                              [item.key]: {
                                ...config,
                                max_score: val < 0 ? 0 : val,
                              },
                            });
                          }}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-slate-950 text-center focus:bg-white focus:border-[#0F2942] focus:outline-none transition shadow-2xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ⚖️ شريط التحقق من مجموع الأوزان (50 للسعي + 50 للنهائي = 100) */}
          {(() => {
            const cwSum =
              (tempAssessmentScheme.quiz1.max_score || 0) +
              (tempAssessmentScheme.quiz2.max_score || 0) +
              (tempAssessmentScheme.assignment1.max_score || 0) +
              (tempAssessmentScheme.assignment2.max_score || 0) +
              (tempAssessmentScheme.report.max_score || 0) +
              (tempAssessmentScheme.midterm.max_score || 0) +
              (tempAssessmentScheme.practical.max_score || 0);

            const finalScore = tempAssessmentScheme.final_exam.max_score || 0;
            const totalScore = cwSum + finalScore;
            const isValid = cwSum === 50 && finalScore === 50;

            return (
              <div
                className={`p-4 rounded-2xl border-2 transition-all space-y-2 ${
                  isValid ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs' : 'bg-rose-50 border-rose-400 text-rose-950 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {isValid ? (
                      <div className="p-1.5 bg-emerald-600 text-white rounded-xl shadow-2xs">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-rose-600 text-white rounded-xl shadow-2xs">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <span className="font-black text-sm block">
                        {isValid
                          ? 'التوزيع الأكاديمي مطابق تماماً لمعايير مسار بولونيا (سعي 50 + نهائي 50 = 100)'
                          : `تنبيه: مجموع بنود السعي يجب أن يكون 50 بالضبط (الحالي: ${cwSum}) والنهائي 50 (الحالي: ${finalScore})`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-black shrink-0">
                    <span className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl shadow-2xs">السعي: {cwSum}/50</span>
                    <span className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl shadow-2xs">النهائي: {finalScore}/50</span>
                    <span
                      className={`px-3 py-1.5 rounded-xl text-white shadow-2xs font-black ${
                        isValid ? 'bg-emerald-700' : 'bg-rose-700'
                      }`}
                    >
                      المجموع: {totalScore}/100
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* 🔘 أزرار الإجراءات والفوتر الثابت للنافذة */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/95 shrink-0 z-10 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white hover:bg-[#0F2942] hover:text-white text-[#0F2942] rounded-xl text-sm font-black transition cursor-pointer border-2 border-[#0F2942] shadow-2xs active:scale-95"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm font-black shadow-md transition flex items-center gap-1.5 cursor-pointer border border-[#0F2942]"
          >
            <Check className="w-4 h-4 text-emerald-300" />
            <span>حفظ وتثبيت التوزيع المخصص</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentSchemeModal; // 🚀 تصدير المكون كافتراضي
