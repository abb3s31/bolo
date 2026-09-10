'use client'; // ⚡ ينفذ على جهة العميل بمتصفح المستخدم

// 🎛️ مكون المودال التقييمي لتوزيع أوزان درجات مسار بولونيا للمواد
// 🇮🇶 توثيق عراقي سطر بسطر والتزام نمطي صارم بدون any أو unknown

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import { Award, RotateCcw, X, Sliders, FlaskConical, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react'; // 🎨 أيقونات لوسيد
import type { Course, AssessmentScheme } from '@/types'; // 🏷️ استيراد الأنواع الرسمية
import { getDefaultAssessmentScheme } from '@/lib/grade-utils'; // 🧮 دالة التوزيع الافتراضي للدرجات

// 📋 واجهة خصائص مودال التقييم الأكاديمي لبولونيا
export interface AdminCourseAssessmentModalProps {
  isAssessmentModalOpen: boolean; // 🪟 حالة فتح نافذة التقييم
  setIsAssessmentModalOpen: (open: boolean) => void; // 🔄 دالة فتح وإغلاق النافذة
  selectedCourseForAssessment: Course | null; // 📖 المادة المحددة للتقييم
  tempAssessmentScheme: AssessmentScheme; // 📊 نظام التقييم المؤقت قيد التعديل
  setTempAssessmentScheme: React.Dispatch<React.SetStateAction<AssessmentScheme>>; // 🔄 دالة تحديث التوزيع
  handleSaveAssessmentSchemeModal: () => void; // 💾 دالة حفظ نظام التقييم
}

// 🏛️ مكون نافذة توزيع درجات بولونيا للمادة
export const AdminCourseAssessmentModal: React.FC<AdminCourseAssessmentModalProps> = ({
  isAssessmentModalOpen,
  setIsAssessmentModalOpen,
  selectedCourseForAssessment,
  tempAssessmentScheme,
  setTempAssessmentScheme,
  handleSaveAssessmentSchemeModal,
}) => {
  if (!isAssessmentModalOpen || !selectedCourseForAssessment || !tempAssessmentScheme) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl flex flex-col relative overflow-hidden">
            
            {/* الهيدر الثابت */}
            <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-200 bg-white/95 shrink-0 z-10">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-950">
                  تخصيص توزيع أوزان الدرجات: {selectedCourseForAssessment.name} ({selectedCourseForAssessment.code})
                </h3>
                <p className="text-sm text-slate-950 font-black mt-0.5">قسم {selectedCourseForAssessment.department_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssessmentModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-black text-slate-950 cursor-pointer border border-slate-300"
              >
                ✕
              </button>
            </div>

            {/* محتوى الحقول القابل للتمرير داخلياً */}
            <div className="p-5 sm:p-7 overflow-y-auto flex-1 overscroll-contain space-y-4">
              {/* 🎨 شريط القوالب السريعة */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-sky-600" />
                    <span>تطبيق قوالب التوزيع الجاهزة وفق دليل بولونيا:</span>
                  </span>
                  <span className="text-xs font-black text-slate-950">انقر للتعبئة الفورية</span>
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

              {/* شبكة بنود التقييم الـ 8 */}
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
                  const cfg = tempAssessmentScheme[item.key];
                  return (
                    <div 
                      key={item.key} 
                      className={`p-4 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md space-y-3 ${
                        item.isPrac 
                          ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/20' 
                          : item.key === 'final_exam'
                          ? 'bg-sky-50/60 border-sky-300 ring-1 ring-sky-400/30 md:col-span-2'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* ترويسة الكارد */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#0F2942] text-white font-black text-xs flex items-center justify-center shadow-xs">
                            {idx + 1}
                          </span>
                          <span className="font-black text-sm text-slate-950">
                            {item.key === 'final_exam' ? 'الامتحان النهائي' : item.isPrac ? 'بند التقييم العملي' : 'بند التقييم النظري'}
                          </span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                          item.isPrac 
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300 shadow-2xs' 
                            : item.key === 'final_exam' 
                            ? 'bg-sky-100 text-sky-950 border-sky-300 shadow-2xs' 
                            : 'bg-blue-50 text-blue-950 border-blue-200 shadow-2xs'
                        }`}>
                          {item.roleText}
                        </span>
                      </div>

                      {/* حقول الإدخال */}
                      <div className="grid grid-cols-12 gap-3 items-end">
                        {/* 📝 حقل العنوان الموحد */}
                        <div className="col-span-8 space-y-1">
                          <label className="block text-xs font-black text-slate-950">العنوان</label>
                          {/* 📝 حقل تعديل مسمى تقييم المادة مع تلميح رصاصي */}
                          <input
                            type="text" // 🔤 نوع الحقل نصي
                            value={cfg.title_ar} // 💾 قيمة العنوان بالعربية
                            onChange={(e) => { // 🔄 تحديث مسمى التقييم بالعربي والإنجليزي
                              const val = e.target.value;
                              setTempAssessmentScheme({
                                ...tempAssessmentScheme,
                                [item.key]: {
                                  ...cfg,
                                  title_ar: val,
                                  title_en: val,
                                },
                              });
                            }}
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-950 placeholder:text-slate-400 placeholder:font-medium focus:bg-white focus:border-[#0F2942] focus:outline-none transition shadow-2xs" // 🎨 تلميح رصاصي احترافي
                            placeholder={item.defaultAr} // 💡 المسمى الافتراضي كتلميح إرشادي
                          />
                        </div>

                        {/* 🏆 حقل الدرجة */}
                        <div className="col-span-4 space-y-1">
                          <label className="block text-xs font-black text-slate-950">الدرجة (Max)</label>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={50}
                              value={cfg.max_score}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setTempAssessmentScheme({
                                  ...tempAssessmentScheme,
                                  [item.key]: {
                                    ...cfg,
                                    max_score: val < 0 ? 0 : val,
                                  },
                                });
                              }}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-slate-950 text-center focus:bg-white focus:border-[#0F2942] focus:outline-none transition shadow-2xs font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* شريط التحقق من مجموع الأوزان (50 للسعي + 50 للنهائي = 100) */}
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
                  <div className={`p-4 rounded-2xl border-2 transition-all space-y-2 ${
                    isValid ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs' : 'bg-rose-50 border-rose-400 text-rose-950 shadow-xs'
                  }`}>
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
                        <span className={`px-3 py-1.5 rounded-xl text-white shadow-2xs font-black ${isValid ? 'bg-emerald-700' : 'bg-rose-700'}`}>
                          المجموع: {totalScore}/100
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* الفوتر الثابت في أسفل الكارد */}
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/95 shrink-0 z-10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAssessmentModalOpen(false)}
                className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-950 hover:bg-slate-100 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveAssessmentSchemeModal}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black shadow-md cursor-pointer border border-[#163a5f]"
              >
                حفظ التوزيع
              </button>
            </div>
          </div>
        </div>
  );
};
