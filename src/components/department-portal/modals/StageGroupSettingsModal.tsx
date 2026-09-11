'use client'; // ⚡ واجهة تفاعلية على متصفح العميل في Next.js

import React, { useState, useEffect } from 'react'; // ⚛️ استيراد ريآكت الأساسية والحالات
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 المودال العائم الفاخر
import { StageGroupConfig, UserProfile } from '@/types'; // 🏷️ استيراد الأنواع الصارمة
import { 
  GroupSettingsSvg, 
  GroupUsersSvg, 
  AutoBalanceSvg, 
  AddGroupSvg, 
  GroupBadgeSvg,
  SunSvg,
  MoonSvg,
  BulbSvg,
  CloseSmallSvg
} from '@/components/common/GroupSvgIcons'; // 🎨 استيراد أيقونات SVG النقية
import { generatePresetGroups, autoBalanceStudentsIntoGroups } from '@/lib/groups-service'; // 🛠️ دوال خدمة الكروبات

// 📋 واجهة خصائص نافذة إعدادات الكروبات للمراحل
export interface StageGroupSettingsModalProps {
  isOpen: boolean; // 📂 حالة فتح النافذة
  onClose: () => void; // 🛑 دالة إغلاق النافذة
  departmentId?: string; // 🏢 معرف القسم الحالي
  departmentName?: string; // 🏢 اسم القسم
  deptName?: string; // 🏢 اسم القسم (تسمية بديلة)
  configs?: StageGroupConfig[]; // 📋 قائمة إعدادات الكروبات الحالية
  initialConfigs?: StageGroupConfig[]; // 📋 إعدادات الكروبات الأولية (تسمية بديلة)
  onSaveConfig: (updatedConfig: StageGroupConfig) => Promise<boolean>; // 💾 دالة حفظ الإعداد
  students?: UserProfile[]; // 👥 كافة طلاب القسم لمعاينة التوزيع
  deptStudents?: UserProfile[]; // 👥 طلاب القسم (تسمية بديلة)
  onUpdateStudentsGroup?: (updates: Record<string, string>) => void; // 🔄 دالة تحديث كروبات الطلاب
  onUpdateStudentsBatch?: (updates: Record<string, string>) => void; // 🔄 تحديث الكروبات دفعة واحدة (تسمية بديلة)
  getStageNameInArabic?: (stage: number) => string; // 🏷️ دالة تحويل رقم المرحلة لاسم عربي
}

// 🏛️ المكون الرئيسي لنافذة ضبط وتخصيص شعب وكروبات المراحل
export const StageGroupSettingsModal: React.FC<StageGroupSettingsModalProps> = ({
  isOpen, // 📂 حالة الفتح
  onClose, // 🛑 دالة الإغلاق
  departmentId = 'dept-1', // 🏢 معرف القسم
  departmentName, // 🏢 اسم القسم
  deptName, // 🏢 اسم القسم البديل
  configs, // 📋 الإعدادات
  initialConfigs, // 📋 الإعدادات البديلة
  onSaveConfig, // 💾 حفظ الإعداد
  students, // 👥 الطلاب
  deptStudents, // 👥 الطلاب البديلة
  onUpdateStudentsGroup, // 🔄 تحديث كروبات الطلاب
  onUpdateStudentsBatch, // 🔄 تحديث الكروبات البديلة
  getStageNameInArabic: getStageNameInArabicProp, // 🏷️ اسم المرحلة بالعربية
}) => {
  // 🏢 تحديد اسم القسم الفعال
  const effectiveDeptName = departmentName || deptName || 'القسم الأكاديمي';
  // 📋 تحديد مصفوفة الإعدادات الفعالة
  const effectiveConfigs = configs || initialConfigs || [];
  // 👥 تحديد مصفوفة طلاب القسم الفعالة
  const effectiveStudents = students || deptStudents || [];
  // 🔄 تحديد دالة تحديث الكروبات الفعالة
  const effectiveUpdateGroup = onUpdateStudentsGroup || onUpdateStudentsBatch;
  // 🏷️ دالة اسم المرحلة بالعربية الفعالة
  const getStageNameInArabic = getStageNameInArabicProp || ((s: number) => (s === 1 ? 'الأولى' : s === 2 ? 'الثانية' : s === 3 ? 'الثالثة' : s === 4 ? 'الرابعة' : `المرحلة ${s}`));

  // 🎓 المرحلة الدراسية المحددة للتهيئة (1 إلى 4)
  const [selectedStage, setSelectedStage] = useState<number>(1);
  // ☀️🌙 نوع الدوام المحدد للتهيئة (صباحي / مسائي)
  const [selectedStudyType, setSelectedStudyType] = useState<'morning' | 'evening'>('morning');
  // ⚙️ حالة تفعيل الكروبات للمرحلة المحددة
  const [hasGroups, setHasGroups] = useState<boolean>(false);
  // 📋 قائمة أسماء الكروبات للمرحلة المحددة
  const [activeGroups, setActiveGroups] = useState<string[]>([]);
  // ➕ حقل كتابة اسم كروب مخصص جديد
  const [newGroupName, setNewGroupName] = useState<string>('');
  // ⏳ حالة جاري الحفظ
  const [isSaving, setIsSaving] = useState<boolean>(false);
  // 📢 رسالة تأكيد النجاح وحالتها مع النوع الصارم
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  // 🔄 مزامنة الحالة المحلية عند تبديل المرحلة أو نوع الدوام أو فتح المودال
  useEffect(() => {
    // 🔍 البحث عن الإعداد المخزن للمرحلة والدوام المحددين
    const found = effectiveConfigs.find(
      (c) => c.stage_number === selectedStage && c.study_type === selectedStudyType
    );
    if (found) {
      setHasGroups(found.has_groups);
      setActiveGroups(found.groups || []);
    } else {
      // 🛡️ إعداد افتراضي نظيف للمرحلة
      setHasGroups(false);
      setActiveGroups([]);
    }
    setStatusMessage(null);
  }, [selectedStage, selectedStudyType, effectiveConfigs, isOpen]);

  // 🛑 إذا كانت النافذة مغلقة لا يتم رسم أي كائن
  if (!isOpen) return null;

  // 👥 استخراج طلاب المرحلة المحددة والدوام المحدد لحساب أعداد كل كروب
  const stageStudents = effectiveStudents.filter(
    (s) =>
      (Number(s.stage_number) || 1) === selectedStage &&
      (s.study_type || 'morning') === selectedStudyType &&
      !s.is_graduated
  );

  // 🔢 معالج اختيار أحد الخيارات السريعة الجاهزة (بدون كروبات، كروبين، 3، 4)
  const handleSelectPreset = (count: number) => {
    if (count === 0) {
      setHasGroups(false);
      setActiveGroups([]);
    } else {
      setHasGroups(true);
      setActiveGroups(generatePresetGroups(count));
    }
  };

  // ➕ معالج إضافة كروب إضافي مخصص
  const handleAddCustomGroup = () => {
    const cleanName = newGroupName.trim().toUpperCase();
    if (!cleanName) return;
    // 🔒 منع التكرار
    if (activeGroups.includes(cleanName)) return;
    setHasGroups(true);
    setActiveGroups((prev) => [...prev, cleanName]);
    setNewGroupName('');
  };

  // 🗑️ معالج حذف كروب معين
  const handleRemoveGroup = (groupToRemove: string) => {
    const updated = activeGroups.filter((g) => g !== groupToRemove);
    setActiveGroups(updated);
    if (updated.length === 0) {
      setHasGroups(false);
    }
  };

  // ⚖️ معالج التوزيع التلقائي المتوازن لطلبة المرحلة على الكروبات المفعلة
  const handleAutoBalance = () => {
    if (!hasGroups || activeGroups.length === 0) {
      setStatusMessage({ text: 'يرجى تفعيل الكروبات أولاً لتتمكن من التوزيع التلقائي.', type: 'warning' });
      return;
    }
    if (stageStudents.length === 0) {
      setStatusMessage({ text: 'لا يوجد طلاب مسجلون حالياً في هذه المرحلة وهذا الدوام.', type: 'info' });
      return;
    }

    // ⚡ حساب التوزيع التدويري المتوازن
    const assignments = autoBalanceStudentsIntoGroups(stageStudents, activeGroups);
    if (effectiveUpdateGroup) {
      effectiveUpdateGroup(assignments);
      setStatusMessage({ text: `تم توزيع ${stageStudents.length} طالب بالتساوي على (${activeGroups.join(', ')}) بنجاح!`, type: 'success' });
    }
  };

  // 💾 معالج حفظ الإعداد في قاعدة البيانات
  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    // 📦 تكوين كائن الإعداد المحصن
    const updatedConfig: StageGroupConfig = {
      id: `grp_${departmentId}_s${selectedStage}_${selectedStudyType}`,
      department_id: departmentId,
      stage_number: selectedStage,
      study_type: selectedStudyType,
      has_groups: hasGroups && activeGroups.length > 0,
      group_count: hasGroups ? activeGroups.length : 0,
      groups: hasGroups ? activeGroups : [],
      default_group: hasGroups && activeGroups.length > 0 ? activeGroups[0] : undefined,
      updated_at: new Date().toISOString(),
    };

    const success = await onSaveConfig(updatedConfig);
    setIsSaving(false);
    if (success) {
      setStatusMessage({ text: 'تم حفظ إعدادات الكروبات بنجاح وتمت المزامنة مع سوبابيز.', type: 'success' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setStatusMessage({ text: 'حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى.', type: 'error' });
    }
  };

  return (
    <FloatingCrudModal
      isOpen={isOpen} // 📂 حالة الفتح
      onClose={onClose} // 🛑 دالة الإغلاق
      title="إدارة وتخصيص شعب وكروبات المرحلة الدراسية" // 🏷️ العنوان
      subtitle={`تحديد عدد الكروبات والجداول لكل مرحلة في قسم ${effectiveDeptName}`} // 📝 الوصف
      icon={<GroupSettingsSvg className="w-6 h-6 text-cyan-400" />} // 🎨 الأيقونة
      maxWidth="max-w-3xl" // 📏 العرض الأقصى
      footer={
        <div className="flex items-center justify-between w-full">
          {/* 📢 رسالة الحالة المدعومة بأيقونات SVG النظيفة */}
          <div className="text-sm font-black">
            {statusMessage && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-black ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                  : statusMessage.type === 'warning'
                  ? 'bg-blue-50 text-blue-950 border-blue-300 shadow-2xs'
                  : statusMessage.type === 'info'
                  ? 'bg-sky-50 text-sky-900 border-sky-300 shadow-2xs'
                  : 'bg-rose-50 text-rose-900 border-rose-300 shadow-2xs'
              }`}>
                {statusMessage.type === 'success' && (
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {statusMessage.type === 'warning' && (
                  <svg className="w-4 h-4 text-blue-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
                {statusMessage.type === 'info' && (
                  <svg className="w-4 h-4 text-sky-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                )}
                {statusMessage.type === 'error' && (
                  <svg className="w-4 h-4 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                )}
                <span>{statusMessage.text}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {/* 🛑 زر الإلغاء */}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-2xl text-base transition cursor-pointer border border-slate-300"
            >
              إلغاء
            </button>
            {/* 💾 زر الحفظ والاعتماد */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-md transition flex items-center gap-2 cursor-pointer border border-[#0F2942] active:scale-95 disabled:opacity-50"
            >
              <GroupBadgeSvg className="w-4 h-4 text-emerald-300" />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ واعتماد التكوين'}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-base font-black" dir="rtl">
        
        {/* 1️⃣ شريط اختيار المرحلة الدراسية */}
        <div className="space-y-2">
          <label className="block text-slate-950 font-black text-base">
            اختر المرحلة الدراسية المراد تهيئتها:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((stg) => {
              const isSel = selectedStage === stg;
              return (
                <button
                  key={stg}
                  type="button"
                  onClick={() => setSelectedStage(stg)}
                  className={`py-3 px-2 rounded-2xl font-black text-sm sm:text-base transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                    isSel
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/20'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>المرحلة {getStageNameInArabic(stg)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2️⃣ شريط اختيار نوع الدوام (الصباحي أو المسائي) */}
        <div className="space-y-2">
          <label className="block text-slate-950 font-black text-base">
            الفترة الدراسية (نوع الدوام):
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedStudyType('morning')}
              className={`py-3 px-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                selectedStudyType === 'morning'
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/20'
                  : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <SunSvg className={`w-5 h-5 transition-colors ${selectedStudyType === 'morning' ? 'text-cyan-300' : 'text-cyan-600'}`} />
              <span>الدراسة الصباحية</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStudyType('evening')}
              className={`py-3 px-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                selectedStudyType === 'evening'
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/20'
                  : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <MoonSvg className={`w-5 h-5 transition-colors ${selectedStudyType === 'evening' ? 'text-indigo-200' : 'text-indigo-600'}`} />
              <span>الدراسة المسائية</span>
            </button>
          </div>
        </div>

        {/* 💡 كارد التعليمات الإرشادي لمسار بولونيا - في المنتصف وبتصميم احترافي رفيع المستوى بالهوية الملكية */}
        <div className="bg-gradient-to-r from-sky-50/95 via-cyan-50/70 to-blue-50/90 border-2 border-cyan-400/80 p-4 sm:p-5 rounded-3xl shadow-xs space-y-3">
          {/* 🏛️ ترويسة الكارد مع أيقونة المصباح باللون الكحلي والسماوي الملكي الموحد */}
          <div className="flex items-center gap-3 border-b border-cyan-200/80 pb-3">
            <div className="p-2.5 bg-[#0F2942] text-cyan-300 rounded-2xl shadow-xs shrink-0">
              <BulbSvg className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="text-right">
              <h4 className="text-base sm:text-lg font-black text-[#0F2942]">
                تنبيه وإرشادات مسار بولونيا الأكاديمي
              </h4>
              <p className="text-xs sm:text-sm font-bold text-slate-700">
                ميزات استقلالية الشعب الدراسية والكروبات للمرحلة
              </p>
            </div>
          </div>

          {/* 🔲 شبكة البنود التعليمية الاحترافية الثنائية المتوازنة بدقة */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-black">
            <div className="bg-white/95 border border-cyan-200/90 p-3.5 rounded-2xl flex items-center justify-center text-center shadow-2xs">
              <span className="text-[#0F2942] leading-snug">جدول أسبوعي مخصص ومستقل لكل كروب</span>
            </div>
            <div className="bg-white/95 border border-cyan-200/90 p-3.5 rounded-2xl flex items-center justify-center text-center shadow-2xs">
              <span className="text-[#0F2942] leading-snug">سجل حضور وغياب منفصل لكل كروب</span>
            </div>
          </div>
        </div>

        {/* 3️⃣ خيارات تحديد عدد الكروبات (بدون كروب، كروبين، 3 كروبات، 4 كروبات) */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-300 shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="block text-slate-950 font-black text-base">
              تحديد عدد الكروبات للمرحلة {getStageNameInArabic(selectedStage)} ({selectedStudyType === 'morning' ? 'الصباحي' : 'المسائي'}):
            </label>
            <span className="text-xs bg-cyan-50 text-cyan-900 px-3 py-1 rounded-xl border border-cyan-300 font-black">
              {hasGroups ? `مفعل: ${activeGroups.length} كروب` : 'شعبة عامة موحدة'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* خيار: بدون كروب (شعبة عامة) */}
            <button
              type="button"
              onClick={() => handleSelectPreset(0)}
              className={`py-3 px-2 rounded-2xl text-sm font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                !hasGroups || activeGroups.length === 0
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/20'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>بدون كروبات</span>
              <span className="text-xs opacity-75 font-normal">(شعبة موحدة)</span>
            </button>

            {/* خيار: كروبين A, B */}
            <button
              type="button"
              onClick={() => handleSelectPreset(2)}
              className={`py-3 px-2 rounded-2xl text-sm font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                hasGroups && activeGroups.length === 2 && activeGroups.includes('A') && activeGroups.includes('B')
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/20'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>كروبين</span>
              <span className="text-xs opacity-75 font-mono">(A, B)</span>
            </button>

            {/* خيار: 3 كروبات A, B, C */}
            <button
              type="button"
              onClick={() => handleSelectPreset(3)}
              className={`py-3 px-2 rounded-2xl text-sm font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                hasGroups && activeGroups.length === 3 && activeGroups.includes('C')
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/20'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>3 كروبات</span>
              <span className="text-xs opacity-75 font-mono">(A, B, C)</span>
            </button>

            {/* خيار: 4 كروبات A, B, C, D */}
            <button
              type="button"
              onClick={() => handleSelectPreset(4)}
              className={`py-3 px-2 rounded-2xl text-sm font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                hasGroups && activeGroups.length === 4 && activeGroups.includes('D')
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/20'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>4 كروبات</span>
              <span className="text-xs opacity-75 font-mono">(A, B, C, D)</span>
            </button>
          </div>

          {/* 4️⃣ عرض شارات الكروبات المفعلة مع إمكانية الحذف والإضافة المخصصة */}
          {hasGroups && (
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="text-sm text-slate-900 font-bold">
                الكروبات المعتمدة حالياً في جدول وحضور هذه المرحلة:
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {activeGroups.map((grp) => {
                  const countInGroup = stageStudents.filter((s) => s.student_group === grp).length;
                  return (
                    <div
                      key={grp}
                      className="bg-white border-2 border-slate-300 px-3.5 py-1.5 rounded-2xl flex items-center gap-2 shadow-2xs"
                    >
                      <span className="w-7 h-7 rounded-xl bg-[#0F2942] text-white font-mono font-black flex items-center justify-center text-sm">
                        {grp}
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        كروب {grp}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-mono">
                        {countInGroup} طالب
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGroup(grp)}
                        className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1 rounded-lg transition cursor-pointer"
                        title={`حذف كروب ${grp}`}
                      >
                        <CloseSmallSvg className="w-3.5 h-3.5 text-rose-600" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* إضافة كروب مخصص إضافي مثل E, F أو أي تسمية */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="اسم كروب إضافي (مثال: E أو F)..."
                  className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-950 focus:border-slate-900 focus:outline-none w-60"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomGroup();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomGroup}
                  className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-sm font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                >
                  <AddGroupSvg className="w-4 h-4 text-cyan-200" />
                  <span>إضافة كروب</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5️⃣ زر التوزيع المتوازن الذكي (Auto-Balance) لطلبة المرحلة */}
        {hasGroups && activeGroups.length > 0 && (
          <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="space-y-1 text-right">
              <div className="text-base text-blue-950 font-black flex items-center gap-2">
                <AutoBalanceSvg className="w-5 h-5 text-blue-800" />
                <span>التوزيع التلقائي المتوازن للطلاب ({stageStudents.length} طالب)</span>
              </div>
              <p className="text-xs text-blue-900 font-bold">
                يقوم بتوزيع كافة طلبة المرحلة بالتساوي وبالترتيب الأبجدي على الكروبات المفعلة ({activeGroups.join(', ')}) بضغطة زر.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAutoBalance}
              className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-black text-sm rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
            >
              <AutoBalanceSvg className="w-4 h-4 text-cyan-300" />
              <span>توزيع الطلاب بالتساوي آلياً</span>
            </button>
          </div>
        )}

      </div>
    </FloatingCrudModal>
  );
};

export default StageGroupSettingsModal; // 🚀 تصدير المكون
