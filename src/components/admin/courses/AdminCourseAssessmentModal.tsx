'use client'; // ⚡ ينفذ على جهة العميل بمتصفح المستخدم

// 🎛️ مكون المودال التقييمي لتوزيع أوزان درجات مسار بولونيا للمواد في لوحة الإدارة
// 🇮🇶 توثيق عراقي سطر بسطر والتزام نمطي صارم بدون any أو unknown وبدون برتقالي وبنفسجي

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import {
  Sliders, // 🎛️ أشرطة التحكم بالتوزيع
  FlaskConical, // 🧪 أيقونة المختبر والعملي
  BookOpen, // 📖 أيقونة النظري
  CheckCircle2, // ✅ أيقونة النجاح والمطابقة
  AlertCircle, // ⚠️ أيقونة التنبيه بالخلل
  Lock, // 🔒 أيقونة القفل للبند المغلق
  Unlock, // 🔓 أيقونة الفتح للبند المفعل
  Scale, // ⚖️ أيقونة الموازنة التلقائية للسعي
} from 'lucide-react'; // 🎨 أيقونات لوسيد
import type { Course, AssessmentScheme } from '@/types'; // 🏷️ استيراد الأنواع الرسمية
import {
  getDefaultAssessmentScheme, // 🧮 دالة التوزيع الافتراضي للدرجات
  redistributeAssessmentScoresOnToggle, // 🔄 دالة إعادة توزيع الدرجات بذكاء عند قفل البند
  isAssessmentItemActive, // ❓ دالة فحص كون البند مفعلاً
  type CourseworkSchemeKey, // 🏷️ نوع مفاتيح السعي
} from '@/lib/grade-utils'; // 🧮 أدوات معايير التقييم

// 📋 واجهة خصائص مودال التقييم الأكاديمي لبولونيا
export interface AdminCourseAssessmentModalProps {
  isAssessmentModalOpen: boolean; // 🪟 حالة فتح نافذة التقييم
  setIsAssessmentModalOpen: (open: boolean) => void; // 🔄 دالة فتح وإغلاق النافذة
  selectedCourseForAssessment: Course | null; // 📖 المادة المحددة للتقييم
  tempAssessmentScheme: AssessmentScheme; // 📊 نظام التقييم المؤقت قيد التعديل
  setTempAssessmentScheme: React.Dispatch<React.SetStateAction<AssessmentScheme>>; // 🔄 دالة تحديث التوزيع
  handleSaveAssessmentSchemeModal: () => void; // 💾 دالة حفظ نظام التقييم
}

// 🏛️ مكون نافذة توزيع درجات بولونيا للمادة في لوحة الإدارة العامة
export const AdminCourseAssessmentModal: React.FC<AdminCourseAssessmentModalProps> = ({
  isAssessmentModalOpen, // 🪟 حالة الفتح
  setIsAssessmentModalOpen, // 🔄 تغيير حالة الفتح
  selectedCourseForAssessment, // 📖 المادة المختارة
  tempAssessmentScheme, // 📊 المخطط الحالي
  setTempAssessmentScheme, // 🔄 تحديث المخطط
  handleSaveAssessmentSchemeModal, // 💾 حفظ التوزيع
}) => {
  // 🛡️ التحقق من توفر المادة والمخطط قبل الرسم
  if (!isAssessmentModalOpen || !selectedCourseForAssessment || !tempAssessmentScheme) return null;

  // 🧮 حساب مجموع بنود السعي المفتوحة فقط والنهائي بدقة متناهية
  const getActiveScore = (key: keyof AssessmentScheme) => {
    const item = tempAssessmentScheme[key]; // 📦 جلب إعدادات البند
    return isAssessmentItemActive(item) ? (item.max_score || 0) : 0; // 🔢 احتساب الدرجة فقط إذا كان البند مفتوحاً
  };

  // 🧮 حساب مجموع السعي الفعلي للبنود المفتوحة
  const cwSum =
    getActiveScore('quiz1') +
    getActiveScore('quiz2') +
    getActiveScore('assignment1') +
    getActiveScore('assignment2') +
    getActiveScore('report') +
    getActiveScore('midterm') +
    getActiveScore('practical');

  const finalScore = tempAssessmentScheme.final_exam.max_score || 0; // 📝 درجة النهائي
  const totalScore = cwSum + finalScore; // 🎯 مجموع المادة الكامل
  const isValid = cwSum === 50 && finalScore === 50; // ✅ هل المخطط يطابق معيار 50+50 بالضبط

  // ⚖️ دالة الموازنة التلقائية لدرجات بنود السعي المفتوحة لتصل إلى 50
  const handleAutoBalanceOpenItems = () => {
    const cwKeys: CourseworkSchemeKey[] = ['quiz1', 'quiz2', 'assignment1', 'assignment2', 'report', 'midterm', 'practical']; // 🔑 مفاتيح السعي
    const openKeys = cwKeys.filter((k) => isAssessmentItemActive(tempAssessmentScheme[k])); // 🔍 استخراج البنود المفتوحة فقط
    if (openKeys.length === 0) return; // 🛑 إذا كانت كلها مغلقة لا نفعل شيئاً

    const diff = 50 - cwSum; // ➖ حساب الفارق المتبقي عن الـ 50
    if (diff === 0) return; // 🎯 إذا كان المجموع 50 بالضبط فلا داعي للتعديل

    // 💡 إضافة الفارق للنصفي إن كان مفتوحاً
    if (openKeys.includes('midterm')) {
      setTempAssessmentScheme({
        ...tempAssessmentScheme,
        midterm: {
          ...tempAssessmentScheme.midterm,
          max_score: Math.max(0, (tempAssessmentScheme.midterm.max_score || 0) + diff),
        },
      });
    } else {
      // 💡 أو إضافته لأول بند سعي مفتوح
      const firstOpen = openKeys[0];
      setTempAssessmentScheme({
        ...tempAssessmentScheme,
        [firstOpen]: {
          ...tempAssessmentScheme[firstOpen],
          max_score: Math.max(0, (tempAssessmentScheme[firstOpen].max_score || 0) + diff),
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* 🏷️ الهيدر الثابت */}
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

        {/* 📜 محتوى الحقول القابل للتمرير داخلياً */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 overscroll-contain space-y-4">
          {/* 🎨 شريط القوالب السريعة وأدوات الموازنة */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-600" />
                <span>تطبيق قوالب التوزيع الجاهزة وفق دليل بولونيا:</span>
              </span>
              <span className="text-xs font-black text-slate-950">انقر للتعبئة الفورية</span>
            </div>
            <div className="flex flex-wrap gap-2.5 items-center">
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

              {/* ⚖️ زر الموازنة التلقائية للسعي */}
              {cwSum !== 50 && (
                <button
                  type="button"
                  onClick={handleAutoBalanceOpenItems}
                  className="mr-auto px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border-2 border-blue-400 rounded-xl text-xs sm:text-sm font-black text-blue-950 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <Scale className="w-4 h-4 text-blue-800" />
                  <span>موازنة السعي تلقائياً إلى 50 ({cwSum < 50 ? `+${50 - cwSum}` : `${50 - cwSum}`})</span>
                </button>
              )}
            </div>
          </div>

          {/* 🧮 شبكة بنود التقييم الـ 8 مع أزرار الفتح والغلق */}
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
              const cfg = tempAssessmentScheme[item.key]; // 📦 إعدادات البند الحالية
              const isItemEnabled = item.key === 'final_exam' ? true : isAssessmentItemActive(cfg); // ❓ حالة التفعيل

              return (
                <div 
                  key={item.key} 
                  className={`p-4 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md space-y-3 ${
                    !isItemEnabled
                      ? 'bg-slate-100/70 border-slate-300 opacity-75'
                      : item.isPrac 
                      ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/20' 
                      : item.key === 'final_exam'
                      ? 'bg-sky-50/60 border-sky-300 ring-1 ring-sky-400/30 md:col-span-2'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* ترويسة الكارد مع زر الفتح والغلق */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shadow-xs ${
                        isItemEnabled ? 'bg-[#0F2942] text-white' : 'bg-slate-400 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={`font-black text-sm ${isItemEnabled ? 'text-slate-950' : 'text-slate-500'}`}>
                        {item.key === 'final_exam' ? 'الامتحان النهائي' : item.isPrac ? 'بند التقييم العملي' : 'بند التقييم النظري'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* 🔘 مفتاح فتح أو غلق البند بحرية كاملة مع إعادة توزيع الدرجات */}
                      {item.key !== 'final_exam' && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = redistributeAssessmentScoresOnToggle(
                              tempAssessmentScheme,
                              item.key as CourseworkSchemeKey,
                              !isItemEnabled
                            );
                            setTempAssessmentScheme(updated);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-2xs border ${
                            isItemEnabled
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 active:scale-95'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300 active:scale-95'
                          }`}
                          title={isItemEnabled ? 'انقر لغلق البند ونقل درجاته للبنود المفتوحة' : 'انقر لإعادة فتح وتفعيل البند'}
                        >
                          {isItemEnabled ? (
                            <>
                              <Unlock className="w-3.5 h-3.5 text-white shrink-0" />
                              <span>مفتوح</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                              <span>مغلق</span>
                            </>
                          )}
                        </button>
                      )}

                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                        !isItemEnabled
                          ? 'bg-slate-200 text-slate-700 border-slate-300'
                          : item.isPrac 
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-300 shadow-2xs' 
                          : item.key === 'final_exam' 
                          ? 'bg-sky-100 text-sky-950 border-sky-300 shadow-2xs' 
                          : 'bg-blue-50 text-blue-950 border-blue-200 shadow-2xs'
                      }`}>
                        {item.roleText}
                      </span>
                    </div>
                  </div>

                  {/* حقول الإدخال */}
                  <div className="grid grid-cols-12 gap-3 items-end">
                    {/* 📝 حقل العنوان الموحد */}
                    <div className="col-span-8 space-y-1">
                      <label className={`block text-xs font-black ${isItemEnabled ? 'text-slate-950' : 'text-slate-400'}`}>
                        العنوان
                      </label>
                      <input
                        type="text" // 🔤 نوع الحقل نصي
                        disabled={!isItemEnabled} // 🚫 تعطيل عند غلق البند
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
                        className={`w-full px-3.5 py-2 rounded-xl text-sm font-black transition shadow-2xs ${
                          !isItemEnabled
                            ? 'bg-slate-200/60 border border-slate-300 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-50 border border-slate-300 text-slate-950 placeholder:text-slate-400 placeholder:font-medium focus:bg-white focus:border-[#0F2942] focus:outline-none'
                        }`}
                        placeholder={item.defaultAr} // 💡 المسمى الافتراضي كتلميح إرشادي
                      />
                    </div>

                    {/* 🏆 حقل الدرجة */}
                    <div className="col-span-4 space-y-1">
                      <label className={`block text-xs font-black ${isItemEnabled ? 'text-slate-950' : 'text-slate-400'}`}>
                        الدرجة (Max)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          disabled={!isItemEnabled}
                          value={isItemEnabled ? cfg.max_score : 0}
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
                          className={`w-full px-3 py-2 rounded-xl text-base font-black text-center transition shadow-2xs font-mono ${
                            !isItemEnabled
                              ? 'bg-slate-200/60 border border-slate-300 text-slate-400 cursor-not-allowed'
                              : 'bg-slate-50 border border-slate-300 text-slate-950 focus:bg-white focus:border-[#0F2942] focus:outline-none'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* شريط التحقق من مجموع الأوزان (50 للسعي + 50 للنهائي = 100) */}
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
                      : `تنبيه: مجموع بنود السعي المفتوحة يجب أن يكون 50 بالضبط (الحالي: ${cwSum}) والنهائي 50 (الحالي: ${finalScore})`}
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
        </div>

        {/* 🔘 الفوتر الثابت في أسفل الكارد */}
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

