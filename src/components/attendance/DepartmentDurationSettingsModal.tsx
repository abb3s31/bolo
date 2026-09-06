'use client'; // ⚡ تمكين معالجة جهة العميل في Next.js

// ⚙️ نافذة إدارة وتخصيص الساعات الكلية ومدد المحاضرات النظرية والعملية لرئاسة القسم والمقرر
import React, { useState, useEffect } from 'react'; // ⚛️ استيراد مكتبة React وخطافات الحالة
import {
  Clock,
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
  SlidersHorizontal,
  BookOpen,
  FlaskConical,
  Info,
  ShieldCheck,
  Search,
  RotateCcw,
  Calendar,
  Layers,
} from 'lucide-react'; // 🎨 استيراد أيقونات Lucide SVG الفيكتورية
import { Course } from '@/types'; // 📘 استيراد واجهة المادة
import {
  DepartmentLectureDurationConfig,
  CourseDurationSetting,
  DEFAULT_LECTURE_DURATIONS_CONFIG,
  getDepartmentDurationConfig,
  saveDepartmentDurationConfig,
  formatDurationLabelAr,
} from '@/lib/attendance-utils'; // ⚙️ استيراد أدوات وإعدادات الساعات
import {
  saveDepartmentDurationConfigToSupabase,
  syncDepartmentDurationConfigFromSupabase,
} from '@/lib/supabase-client'; // 🔌 مزامنة قاعدة بيانات Supabase السحابية

// 📋 واجهة الخصائص المستقبلة لمودال تخصيص الساعات
interface DepartmentDurationSettingsModalProps {
  isOpen: boolean;                                     // 🪟 حالة فتح النافذة
  onClose: () => void;                                 // ❌ دالة إغلاق النافذة
  departmentId?: string;                               // 🏢 معرف القسم
  departmentName?: string;                             // 🏢 اسم القسم
  courses: Course[];                                   // 📚 قائمة مواد القسم
  onConfigSaved?: (config: DepartmentLectureDurationConfig) => void; // 💾 رد نداء الحفظ
}

// 🎯 الخيارات الشائعة للساعات الأكاديمية للاختيار السريع
const QUICK_DURATION_PRESETS = [
  { value: 1, label: '1 ساعة (60 دقيقة)' },
  { value: 1.5, label: '1.5 ساعة (90 دقيقة)' },
  { value: 2, label: '2 ساعتان (120 دقيقة)' },
  { value: 2.5, label: '2.5 ساعة (150 دقيقة)' },
  { value: 3, label: '3 ساعات (180 دقيقة)' },
];

// ⏳ الخيارات الشائعة للساعات الكلية للمادة في الكورس
const QUICK_TOTAL_HOURS_PRESETS = [45, 60, 70, 75, 90];

export default function DepartmentDurationSettingsModal({
  isOpen,
  onClose,
  departmentId,
  departmentName = 'القسم الأكاديمي',
  courses,
  onConfigSaved,
}: DepartmentDurationSettingsModalProps) {
  // ⚙️ حالة الإعدادات الحالية
  const [config, setConfig] = useState<DepartmentLectureDurationConfig>(DEFAULT_LECTURE_DURATIONS_CONFIG);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false); // 💬 رسالة تأكيد الحفظ
  const [courseSearch, setCourseSearch] = useState<string>(''); // 🔍 بحث المواد

  // 🔄 تحميل إعدادات القسم عند الفتح ومزامنتها سحابياً مع Supabase
  useEffect(() => {
    if (isOpen) {
      const loaded = getDepartmentDurationConfig(departmentId);
      setConfig(loaded);
      setSaveSuccess(false);
      setCourseSearch('');

      // ☁️ محاولة المزامنة السحابية من قاعدة بيانات Supabase
      syncDepartmentDurationConfigFromSupabase(departmentId).then((cloudConfig) => {
        if (cloudConfig) {
          setConfig(cloudConfig);
        }
      }).catch(() => {});
    }
  }, [isOpen, departmentId]);

  if (!isOpen) return null;

  // ➕ دالة إضافة مدة مخصصة جديدة
  const handleAddDuration = (valNum: number) => {
    if (isNaN(valNum) || valNum <= 0 || valNum > 8) return;
    if (config.allowedDurations.includes(valNum)) return;

    const updated: DepartmentLectureDurationConfig = {
      ...config,
      allowedDurations: [...config.allowedDurations, valNum].sort((a, b) => a - b),
    };
    setConfig(updated);
  };

  // ➖ دالة حذف مدة مخصصة
  const handleRemoveDuration = (valNum: number) => {
    if (valNum === config.defaultTheoryDuration || valNum === config.defaultPracticalDuration) {
      return;
    }
    const updated: DepartmentLectureDurationConfig = {
      ...config,
      allowedDurations: config.allowedDurations.filter((d) => d !== valNum),
    };
    setConfig(updated);
  };

  // 🎯 دالة تخصيص الساعات الكلية المقررة لمادة معينة (مثال: 60 س، 70 س، 90 س)
  const handleCourseTotalHoursChange = (courseId: string, totalHours: number) => {
    const currentCustom = { ...(config.courseCustomDurations || {}) };
    const prevSetting: CourseDurationSetting = currentCustom[courseId] || {};
    
    currentCustom[courseId] = {
      ...prevSetting,
      total_scheduled_hours: totalHours > 0 ? totalHours : undefined,
    };

    setConfig({
      ...config,
      courseCustomDurations: currentCustom,
    });
  };

  // 🎯 دالة تخصيص مدة المحاضرة النظرية لمادة معينة
  const handleCourseTheoryDurationChange = (courseId: string, duration: number) => {
    const currentCustom = { ...(config.courseCustomDurations || {}) };
    const prevSetting: CourseDurationSetting = currentCustom[courseId] || {};
    
    currentCustom[courseId] = {
      ...prevSetting,
      theory_hours: duration > 0 ? duration : undefined,
    };

    setConfig({
      ...config,
      courseCustomDurations: currentCustom,
    });
  };

  // 🎯 دالة تخصيص مدة المحاضرة العملية لمادة معينة
  const handleCoursePracticalDurationChange = (courseId: string, duration: number) => {
    const currentCustom = { ...(config.courseCustomDurations || {}) };
    const prevSetting: CourseDurationSetting = currentCustom[courseId] || {};
    
    currentCustom[courseId] = {
      ...prevSetting,
      practical_hours: duration > 0 ? duration : undefined,
    };

    setConfig({
      ...config,
      courseCustomDurations: currentCustom,
    });
  };

  // 🔢 دالة تخصيص عدد المحاضرات الأسبوعية لمادة معينة (1 أو 2 محاضرة - قديم للتوافق)
  const handleCourseLecturesPerWeekChange = (courseId: string, count: number) => {
    const currentCustom = { ...(config.courseCustomDurations || {}) };
    const prevSetting: CourseDurationSetting = currentCustom[courseId] || {};
    
    currentCustom[courseId] = {
      ...prevSetting,
      lectures_per_week: count === 1 || count === 2 ? count : 2,
    };

    setConfig({
      ...config,
      courseCustomDurations: currentCustom,
    });
  };

  // 📘 دالة تخصيص عدد محاضرات النظري لمادة معينة (1 أو 2)
  const handleCourseTheoryLecturesPerWeekChange = (courseId: string, count: 1 | 2) => {
    const currentCustom = { ...(config.courseCustomDurations || {}) };
    const prevSetting: CourseDurationSetting = currentCustom[courseId] || {};
    
    currentCustom[courseId] = {
      ...prevSetting,
      theory_lectures_per_week: count,
    };

    setConfig({
      ...config,
      courseCustomDurations: currentCustom,
    });
  };

  // 🔬 دالة تخصيص عدد محاضرات/مختبرات العملي لمادة معينة (1 أو 2)
  const handleCoursePracticalLecturesPerWeekChange = (courseId: string, count: 1 | 2) => {
    const currentCustom = { ...(config.courseCustomDurations || {}) };
    const prevSetting: CourseDurationSetting = currentCustom[courseId] || {};
    
    currentCustom[courseId] = {
      ...prevSetting,
      practical_lectures_per_week: count,
    };

    setConfig({
      ...config,
      courseCustomDurations: currentCustom,
    });
  };

  // 🔄 إعادة ضبط مادة معينة للافتراضي
  const handleResetCourseSettings = (courseId: string) => {
    const currentCustom = { ...(config.courseCustomDurations || {}) };
    delete currentCustom[courseId];
    setConfig({
      ...config,
      courseCustomDurations: currentCustom,
    });
  };

  // 💾 دالة حفظ الإعدادات ومزامنتها محلياً وسحابياً مع Supabase
  const handleSave = async () => {
    saveDepartmentDurationConfig(config, departmentId);
    try {
      await saveDepartmentDurationConfigToSupabase(config, departmentId);
    } catch (err) {
      console.warn('تنبيه أثناء حفظ مدد المحاضرات في Supabase:', err);
    }

    setSaveSuccess(true);
    if (onConfigSaved) {
      onConfigSaved(config);
    }
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  // 🔍 تصفية المواد بالبحث
  const filteredCourses = courses.filter((c) => {
    if (!courseSearch.trim()) return true;
    const q = courseSearch.toLowerCase().trim();
    return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
  });

  return (
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-2 sm:p-4 animate-in fade-in duration-150 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-right relative animate-in zoom-in-95 duration-200">
        
        {/* 📌 رأس النافذة */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white border-b-2 border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 text-cyan-300 rounded-2xl border border-white/20 shrink-0">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>تخصيص وإعداد ساعات ومواقيت المحاضرات</span>
                <span className="px-3 py-0.5 bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 rounded-xl text-xs font-black">
                  مسار بولونيا
                </span>
              </h3>
              <p className="text-xs sm:text-sm font-bold text-slate-300 mt-0.5">
                {departmentName} — تحديد الساعات الكلية للمواد ومدد المحاضرات النظرية والعملية
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer shrink-0"
            title="إغلاق النافذة"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 📜 محتوى النافذة القابل للتمرير */}
        <div className="p-5 sm:p-7 space-y-6 flex-1 overflow-y-auto bg-slate-50/50">
          
          {/* ℹ️ صندوق توضيحي */}
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-800 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm font-bold text-blue-950 leading-relaxed space-y-1">
              <p>
                <strong>الضوابط المركزية لمسار بولونيا:</strong> الساعات الكلية المقررة للمادة (مثل <strong>60 ساعة</strong> أو <strong>70 ساعة</strong>) هي الأساس المعتمد لاحتساب نسب الغياب والإنذارات الأكاديمية (5% إنذار أولي، 7% إنذار نهائي، 10% حرمان).
              </p>
              <p className="text-blue-800">
                المدد الافتراضية المعتمدة للجلسة الواحدة: <strong>ساعة ونصف (1.5 س)</strong> للنظري، و <strong>ساعة واحدة (1 س)</strong> للعملي، مع إمكانية التخصيص الحر لكل مادة أدناه.
              </p>
            </div>
          </div>

          {/* 1. الإعدادات العامة للقسم */}
          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-2xs space-y-4">
            <h4 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-5 h-5 text-indigo-700" />
              <span>1. الإعدادات والمدد العامة الافتراضية للقسم:</span>
            </h4>

            {/* المدد المتاحة في القوائم */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-black text-slate-800">
                المدد الزمنية المعتمدة في قوائم الاختيار (بالساعات):
              </label>

              <div className="flex flex-wrap items-center gap-2">
                {config.allowedDurations.map((dur) => (
                  <div
                    key={dur}
                    className="px-3.5 py-1.5 bg-slate-100 border-2 border-slate-300 rounded-xl flex items-center gap-2 text-sm font-black text-slate-950 shadow-2xs"
                  >
                    <Clock className="w-4 h-4 text-indigo-700" />
                    <span>{formatDurationLabelAr(dur)}</span>
                    {config.allowedDurations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDuration(dur)}
                        className="p-1 hover:bg-rose-100 hover:text-rose-700 text-slate-400 rounded-lg transition cursor-pointer"
                        title={`إزالة ${dur} ساعة`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* أزرار الإضافة السريعة */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-bold text-slate-600">إضافة سريعة:</span>
                {QUICK_DURATION_PRESETS.map((preset) => {
                  if (config.allowedDurations.includes(preset.value)) return null;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleAddDuration(preset.value)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-950 border border-slate-300 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3 h-3 text-blue-700" />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* الإعدادات الثلاثية: الساعات الكلية + النظري الافتراضي + العملي الافتراضي */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              
              {/* الساعات الكلية الافتراضية */}
              <div className="p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
                <label className="block text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-700" />
                  <span>الساعات الكلية الافتراضية للمادة:</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="15"
                    max="180"
                    step="5"
                    value={config.defaultCourseTotalHours || 60}
                    onChange={(e) => setConfig({ ...config, defaultCourseTotalHours: parseInt(e.target.value, 10) || 60 })}
                    className="w-full px-3 py-2 bg-white border-2 border-slate-300 rounded-xl text-sm font-black text-slate-950 font-mono text-center focus:outline-none focus:border-[#0F2942]"
                  />
                  <span className="text-xs font-black text-slate-700 shrink-0">ساعة/كورس</span>
                </div>
              </div>

              {/* النظري الافتراضي */}
              <div className="p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
                <label className="block text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-800" />
                  <span>مدة المحاضرة النظرية الافتراضية:</span>
                </label>
                <select
                  value={config.defaultTheoryDuration}
                  onChange={(e) => setConfig({ ...config, defaultTheoryDuration: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-300 rounded-xl text-sm font-black text-slate-950 focus:outline-none focus:border-[#0F2942]"
                >
                  {config.allowedDurations.map((d) => (
                    <option key={d} value={d}>
                      {formatDurationLabelAr(d)}
                    </option>
                  ))}
                </select>
              </div>

              {/* العملي الافتراضي */}
              <div className="p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
                <label className="block text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-emerald-800" />
                  <span>مدة المحاضرة العملية الافتراضية:</span>
                </label>
                <select
                  value={config.defaultPracticalDuration}
                  onChange={(e) => setConfig({ ...config, defaultPracticalDuration: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-300 rounded-xl text-sm font-black text-slate-950 focus:outline-none focus:border-[#0F2942]"
                >
                  {config.allowedDurations.map((d) => (
                    <option key={d} value={d}>
                      {formatDurationLabelAr(d)}
                    </option>
                  ))}
                </select>
              </div>

            </div>

          </div>

          {/* 2. جدول تخصيص الساعات لكل مادة دراسية على حدة */}
          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-700" />
                  <span>2. تخصيص الساعات الكلية ومدد المحاضرات لمواد القسم ({courses.length} مادة):</span>
                </h4>
                <p className="text-xs font-bold text-slate-600 mt-0.5">
                  يمكنك تخصيص إجمالي الساعات الكلية (مثل 60 س أو 70 س) ومدة النظري والعملي لكل مقرر على حدة
                </p>
              </div>

              {/* شريط البحث عن مادة */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث عن مادة..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-950 focus:bg-white focus:outline-none focus:border-[#0F2942]"
                />
              </div>
            </div>

            {/* جدول المواد */}
            <div className="border-2 border-slate-200 rounded-2xl overflow-hidden overflow-x-auto max-h-[380px]">
              <table className="w-full text-right border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-950 border-b-2 border-slate-200 font-black sticky top-0 z-10">
                    <th className="p-3 border-l border-slate-200 min-w-[200px]">المادة الدراسية</th>
                    <th className="p-3 border-l border-slate-200 text-center min-w-[170px]">
                      الساعات الكلية المقررة (الكورس)
                    </th>
                    <th className="p-3 border-l border-slate-200 text-center min-w-[140px]">
                      مدة النظري (للمحاضرة)
                    </th>
                    <th className="p-3 border-l border-slate-200 text-center min-w-[140px]">
                      مدة العملي (للمحاضرة)
                    </th>
                    <th className="p-3 border-l border-slate-200 text-center min-w-[140px]">
                      المحاضرات أسبوعياً
                    </th>
                    <th className="p-3 text-center w-16">إعادة ضبط</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-black">
                  {filteredCourses.map((c) => {
                    const customSetting: CourseDurationSetting = config.courseCustomDurations?.[c.id] || {};
                    const totalHours = customSetting.total_scheduled_hours || config.defaultCourseTotalHours || ((c.credit_hours || 3) * 15);
                    const theoryDur = customSetting.theory_hours || config.defaultTheoryDuration || 1.5;
                    const practicalDur = customSetting.practical_hours || config.defaultPracticalDuration || 1;
                    const isPracticalCourse = c.course_type !== 'theory_only';
                    const hasCustom = Boolean(config.courseCustomDurations?.[c.id]);

                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-slate-50 transition ${hasCustom ? 'bg-blue-50/40' : 'bg-white'}`}
                      >
                        {/* المادة والرمز */}
                        <td className="p-3 border-l border-slate-200">
                          <div className="font-black text-slate-950 text-sm sm:text-base leading-tight">
                            {c.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {c.code}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-black border ${
                              isPracticalCourse
                                ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                                : 'bg-blue-50 text-blue-950 border-blue-200'
                            }`}>
                              {isPracticalCourse ? 'نظري وعملي' : 'نظري فقط'}
                            </span>
                          </div>
                        </td>

                        {/* إجمالي الساعات الكلية للمادة (إدخال يدوي حر + أزرار سريعة) */}
                        <td className="p-2.5 border-l border-slate-200 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                min="15"
                                max="180"
                                step="5"
                                value={totalHours}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  handleCourseTotalHoursChange(c.id, isNaN(val) ? 60 : val);
                                }}
                                className="w-20 px-2 py-1.5 bg-white border-2 border-slate-300 rounded-xl font-mono text-base font-black text-center text-slate-950 focus:border-[#0F2942] focus:outline-none"
                              />
                              <span className="text-xs font-black text-slate-700">ساعة</span>
                            </div>

                            {/* اختصارات سريعة (60، 70، 90) */}
                            <div className="flex items-center gap-1">
                              {QUICK_TOTAL_HOURS_PRESETS.slice(1, 4).map((h) => (
                                <button
                                  key={h}
                                  type="button"
                                  onClick={() => handleCourseTotalHoursChange(c.id, h)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black border transition cursor-pointer ${
                                    totalHours === h
                                      ? 'bg-[#0F2942] text-white border-[#0F2942]'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                                  }`}
                                >
                                  {h}س
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>

                        {/* مدة المحاضرة النظرية */}
                        <td className="p-2.5 border-l border-slate-200 text-center">
                          <select
                            value={theoryDur}
                            onChange={(e) => handleCourseTheoryDurationChange(c.id, parseFloat(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-950 focus:border-[#0F2942] focus:outline-none"
                          >
                            {config.allowedDurations.map((d) => (
                              <option key={d} value={d}>
                                {d === 1 ? '1 ساعة' : d === 1.5 ? '1.5 ساعة' : `${d} ساعات`}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* مدة المحاضرة العملية */}
                        <td className="p-2.5 border-l border-slate-200 text-center">
                          {isPracticalCourse ? (
                            <select
                              value={practicalDur}
                              onChange={(e) => handleCoursePracticalDurationChange(c.id, parseFloat(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-950 focus:border-[#0F2942] focus:outline-none"
                            >
                              {config.allowedDurations.map((d) => (
                                <option key={d} value={d}>
                                  {d === 1 ? '1 ساعة' : d === 1.5 ? '1.5 ساعة' : `${d} ساعات`}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-slate-400 font-bold block py-1.5">
                              — لا يوجد عملي —
                            </span>
                          )}
                        </td>

                        {/* عدد محاضرات النظري والعملي أسبوعياً (1 أو 2 بشكل مستقل) */}
                        <td className="p-2.5 border-l border-slate-200 text-center">
                          <div className="flex flex-col gap-1.5 items-center">
                            {/* النظري */}
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-bold text-slate-700 w-10 text-right">نظري:</span>
                              <div className="inline-flex p-0.5 bg-slate-100 border border-slate-300 rounded-lg gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleCourseTheoryLecturesPerWeekChange(c.id, 1)}
                                  className={`px-2 py-0.5 rounded text-[11px] font-black transition cursor-pointer ${
                                    (customSetting.theory_lectures_per_week || customSetting.lectures_per_week || 2) === 1
                                      ? 'bg-blue-800 text-white shadow-2xs'
                                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200'
                                  }`}
                                  title="محاضرة نظرية واحدة في الأسبوع"
                                >
                                  1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCourseTheoryLecturesPerWeekChange(c.id, 2)}
                                  className={`px-2 py-0.5 rounded text-[11px] font-black transition cursor-pointer ${
                                    (customSetting.theory_lectures_per_week || customSetting.lectures_per_week || 2) === 2
                                      ? 'bg-blue-800 text-white shadow-2xs'
                                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200'
                                  }`}
                                  title="محاضرتان نظريتان في الأسبوع"
                                >
                                  2
                                </button>
                              </div>
                            </div>

                            {/* العملي */}
                            {isPracticalCourse && (
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] font-bold text-slate-700 w-10 text-right">عملي:</span>
                                <div className="inline-flex p-0.5 bg-slate-100 border border-slate-300 rounded-lg gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleCoursePracticalLecturesPerWeekChange(c.id, 1)}
                                    className={`px-2 py-0.5 rounded text-[11px] font-black transition cursor-pointer ${
                                      (customSetting.practical_lectures_per_week ?? (customSetting.lectures_per_week || 1)) === 1
                                        ? 'bg-emerald-800 text-white shadow-2xs'
                                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200'
                                    }`}
                                    title="مختبر عملي واحد في الأسبوع"
                                  >
                                    1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCoursePracticalLecturesPerWeekChange(c.id, 2)}
                                    className={`px-2 py-0.5 rounded text-[11px] font-black transition cursor-pointer ${
                                      (customSetting.practical_lectures_per_week ?? (customSetting.lectures_per_week || 1)) === 2
                                        ? 'bg-emerald-800 text-white shadow-2xs'
                                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200'
                                    }`}
                                    title="مختبران عمليان في الأسبوع"
                                  >
                                    2
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* زر إعادة الضبط */}
                        <td className="p-2.5 text-center">
                          {hasCustom ? (
                            <button
                              type="button"
                              onClick={() => handleResetCourseSettings(c.id)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-xl border border-slate-300 transition cursor-pointer"
                              title="إعادة الضبط للافتراضي"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-bold">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* 💾 فوتر أزرار الحفظ والإغلاق */}
        <div className="p-4 sm:p-5 bg-slate-100 border-t-2 border-slate-300 flex items-center justify-between gap-3 shrink-0">
          <div>
            {saveSuccess && (
              <span className="text-emerald-800 font-black text-sm sm:text-base flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-5 h-5 text-emerald-600 stroke-[3]" />
                <span>تم حفظ واعتماد تخصيص الساعات وتطبيقها في كامل المنظومة!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white hover:bg-slate-200 text-slate-900 border-2 border-slate-300 rounded-2xl font-black text-sm sm:text-base transition cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-2xl font-black text-sm sm:text-base transition-all shadow-md flex items-center gap-2 cursor-pointer border-2 border-emerald-500"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-100" />
              <span>حفظ واعتماد التخصيص الآن</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
