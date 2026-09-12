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
  Lock, // 🔒 أيقونة القفل للبند المعطل
  Unlock, // 🔓 أيقونة الفتح للبند المفعل
  Scale, // ⚖️ أيقونة الموازنة التلقائية
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { Course, AssessmentScheme } from '@/types'; // 🏷️ استيراد الأنواع والواجهات الصارمة
import {
  redistributeAssessmentScoresOnToggle,
  isAssessmentItemActive,
  type CourseworkSchemeKey,
} from '@/lib/grade-utils'; // 🧮 استيراد أدوات التوزيع الذكية ومطابقة المعايير

// 📋 واجهة مدخلات نافذة تخصيص بنود وأوزان مسار بولونيا الـ 7
export interface AssessmentSchemeModalProps {
  isOpen: boolean; // 📂 حالة ظهور النافذة
  onClose: () => void; // 🛑 دالة إغلاق النافذة
  course: Course | null; // 📚 المقرر الدراسي المستهدف بالتخصيص أو المرجع
  targetCourses?: Course[]; // 📚 قائمة المقررات المستهدفة بالتوزيع (فردي أو جماعي)
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
  course, // 📚 المقرر المرجعي
  targetCourses = [], // 📚 المقررات المستهدفة
  tempAssessmentScheme, // 🎛️ المخطط المؤقت
  setTempAssessmentScheme, // 🔄 تحديث المخطط
  deptName, // 🏛️ اسم القسم
  onSave, // 💾 دالة الحفظ
  getStageNameInArabic, // 🏷️ اسم المرحلة
  getDefaultAssessmentScheme, // ⚙️ القالب الافتراضي
}) => {
  // 🛑 التحقق من شروط العرض
  if (!isOpen || !course || !tempAssessmentScheme) return null;

  // 🔢 فحص هل العملية تخصيص جماعي لمجموعة مواد محددة
  const isBatch = targetCourses.length > 1; // 📊 هل هناك أكثر من مادة محددة؟

  // 🧮 حساب مجموع بنود السعي المفتوحة والامتحان النهائي وصلاحية المخطط بدقة
  const { cwSum, finalScore, totalScore, isValid } = React.useMemo(() => {
    if (!tempAssessmentScheme) return { cwSum: 0, finalScore: 0, totalScore: 0, isValid: false };
    
    // دالة تحقق داخلية من البند المفتوح
    const getScore = (key: keyof AssessmentScheme) => {
      const item = tempAssessmentScheme[key];
      return isAssessmentItemActive(item) ? (item.max_score || 0) : 0;
    };

    const cw =
      getScore('quiz1') +
      getScore('quiz2') +
      getScore('assignment1') +
      getScore('assignment2') +
      getScore('report') +
      getScore('midterm') +
      getScore('practical');
    const fn = tempAssessmentScheme.final_exam.max_score || 0;
    return {
      cwSum: cw,
      finalScore: fn,
      totalScore: cw + fn,
      isValid: cw === 50 && fn === 50,
    };
  }, [tempAssessmentScheme]);

  // ⚖️ دالة الموازنة التلقائية لدرجات البنود المفتوحة لتساوي 50 بالضبط
  const handleAutoBalanceOpenItems = () => {
    if (!tempAssessmentScheme) return;
    const cwKeys: CourseworkSchemeKey[] = ['quiz1', 'quiz2', 'assignment1', 'assignment2', 'report', 'midterm', 'practical'];
    const openKeys = cwKeys.filter((k) => isAssessmentItemActive(tempAssessmentScheme[k]));
    if (openKeys.length === 0) return;

    const diff = 50 - cwSum;
    if (diff === 0) return;

    // إضافة الفارق للامتحان النصفي إذا كان مفتوحاً
    if (openKeys.includes('midterm')) {
      setTempAssessmentScheme({
        ...tempAssessmentScheme,
        midterm: {
          ...tempAssessmentScheme.midterm,
          max_score: Math.max(0, (tempAssessmentScheme.midterm.max_score || 0) + diff),
        },
      });
    } else {
      // أو إضافته لأول بند مفتوح
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
              <div className="flex items-center gap-2 flex-wrap">
                {isBatch ? (
                  <span className="px-3 py-0.5 bg-[#0F2942] text-cyan-300 text-sm font-black rounded-lg border border-cyan-400/30">
                    تخصيص وتعميم جماعي: ({targetCourses.length}) مواد محددة {/* 👥 بادج التخصيص الجماعي */}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-900 text-white text-sm font-black rounded-md">
                    {course.code} {/* 🏷️ كود المادة */}
                  </span>
                )}
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
                {isBatch
                  ? `تخصيص وتعميم أوزان التقييم على المواد المحددة (${targetCourses.map((c) => c.name).join('، ')})`
                  : `تخصيص توزيع أوزان وعناوين التقييم: ${course.name}`}
              </h3>
              <p className="text-sm font-black text-slate-950">
                قسم {deptName} | المرحلة {getStageNameInArabic(course.stage_number || 1)} • الكورس{' '}
                {course.semester === 2 ? 'الثاني' : 'الأول'}
              </p>
            </div>
          </div>

          {/* ✖️ زر الإغلاق */}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-xl text-sm transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>

        {/* 📜 جسم الحقول القابل للتمرير داخلياً */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 overscroll-contain space-y-4">
          {/* 🎨 شريط القوالب السريعة وأدوات الموازنة */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <span>تطبيق قوالب التوزيع الجاهزة وفق دليل بولونيا:</span>
              </span>
              <span className="text-xs font-bold text-slate-500">انقر للتعبئة الفورية</span>
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

              {/* ⚖️ زر الموازنة السريعة إذا كان هناك فارق بالدرجات */}
              {cwSum !== 50 && (
                <button
                  type="button"
                  onClick={handleAutoBalanceOpenItems}
                  className="mr-auto px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border-2 border-blue-400 rounded-xl text-xs sm:text-sm font-black text-blue-950 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 animate-pulse"
                >
                  <Scale className="w-4 h-4 text-blue-800" />
                  <span>موازنة السعي تلقائياً إلى 50 ({cwSum < 50 ? `+${50 - cwSum}` : `${50 - cwSum}`})</span>
                </button>
              )}
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
              const isItemEnabled = item.key === 'final_exam' ? true : isAssessmentItemActive(config);

              return (
                <div
                  key={item.key}
                  className={`p-4 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md space-y-3 ${
                    !isItemEnabled
                      ? 'bg-slate-100/70 border-slate-300 opacity-75'
                      : item.isPrac
                      ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/20'
                      : item.key === 'final_exam'
                      ? 'bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-400/30 md:col-span-2'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* ترويسة الكارد الصغير مع زر فتح وغلق البند بحرية */}
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
                      {/* 🔘 مفتاح فتح أو غلق البند بحرية كاملة لرئيس القسم والمقرر */}
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

                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                          !isItemEnabled
                            ? 'bg-slate-200 text-slate-700 border-slate-300'
                            : item.isPrac
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300 shadow-2xs'
                            : item.key === 'final_exam'
                            ? 'bg-indigo-100 text-indigo-950 border-indigo-300 shadow-2xs'
                            : 'bg-blue-50 text-blue-950 border-blue-200 shadow-2xs'
                        }`}
                      >
                        {item.roleText}
                      </span>
                    </div>
                  </div>

                  {/* حقل العنوان وحقل الدرجة العظمى في صف واحد مرتب وواسع */}
                  <div className="grid grid-cols-12 gap-3 items-end">
                    {/* 📝 حقل العنوان الموحد */}
                    <div className="col-span-8 sm:col-span-8 space-y-1">
                      <label className={`block text-xs font-black ${isItemEnabled ? 'text-slate-700' : 'text-slate-400'}`}>
                        العنوان
                      </label>
                      <input
                        type="text"
                        disabled={!isItemEnabled}
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
                        className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-black transition shadow-2xs ${
                          !isItemEnabled
                            ? 'bg-slate-200/60 border border-slate-300 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-50 border border-slate-300 text-slate-950 placeholder:text-slate-400 focus:bg-white focus:border-[#0F2942] focus:outline-none'
                        }`}
                        placeholder={item.defaultAr}
                      />
                    </div>

                    {/* 🏆 حقل الدرجة العظمى */}
                    <div className="col-span-4 sm:col-span-4 space-y-1">
                      <label className={`block text-xs font-black ${isItemEnabled ? 'text-slate-700' : 'text-slate-400'}`}>
                        الدرجة (Max)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          disabled={!isItemEnabled}
                          value={isItemEnabled ? config.max_score : 0}
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
                          className={`w-full px-3 py-2.5 rounded-xl text-base font-black text-center transition shadow-2xs font-mono ${
                            !isItemEnabled
                              ? 'bg-slate-200/60 border border-slate-300 text-slate-400 cursor-not-allowed'
                              : 'bg-slate-50 border border-slate-300 text-slate-950 focus:bg-white focus:border-[#0F2942] focus:outline-none'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ⚪ إشعار حالة البند المغلق */}
                  {!isItemEnabled && (
                    <div className="text-[11px] font-black text-slate-600 bg-slate-200/60 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-300">
                      <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span>هذا البند مغلق حالياً وسيتم إخفاؤه تماماً من لوحات القسم والتدريسي والطلاب.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ⚖️ شريط التحقق من مجموع الأوزان (50 للسعي + 50 للنهائي = 100) */}
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
                      : `تنبيه: مجموع بنود السعي المفتوحة يجب أن يكون 50 بالضبط (الحالي: ${cwSum}) والنهائي 50 (الحالي: ${finalScore})`}
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
        </div>

        {/* 🔘 أزرار الإجراءات والفوتر الثابت للنافذة مع بادج التحقق اللحظي */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/95 shrink-0 z-10 flex flex-wrap items-center justify-between gap-3">
          {/* 🏷️ مؤشر الحالة المرئي في أسفل النافذة - تم مسح "وجاهز للاعتماد السحابي ✨" */}
          {isValid ? (
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900 bg-emerald-100/70 border border-emerald-300 px-3 py-2 rounded-xl shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>المخطط مطابق لمعايير بولونيا 100%</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-black text-rose-900 bg-rose-100/70 border border-rose-300 px-3 py-2 rounded-xl shadow-2xs">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>يجب موازنة درجات السعي (50) والنهائي (50) لتفعيل زر الحفظ ⚠️</span>
            </div>
          )}

          <div className="flex items-center gap-2 mr-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white hover:bg-[#0F2942] hover:text-white text-[#0F2942] rounded-xl text-sm font-black transition cursor-pointer border-2 border-[#0F2942] shadow-2xs active:scale-95"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={!isValid}
              onClick={onSave}
              className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-sm shadow-md transition flex items-center gap-1.5 cursor-pointer border border-[#0F2942] active:scale-95"
            >
              <Check className="w-4 h-4 text-emerald-300" />
              <span>حفظ وتثبيت التوزيع المخصص</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentSchemeModal; // 🚀 تصدير المكون كافتراضي
