'use client'; // ⚡ واجهة تفاعلية على متصفح العميل في Next.js

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import { createPortal } from 'react-dom'; // 🚪 بورتال لرسم القائمة المنسدلة في قمة شجرة الدوم
import {
  Edit3, // ✏️ أيقونة تعديل الحساب
  UserPlus, // 👤 أيقونة إضافة طالب جديد
  Plus, // ➕ أيقونة الحفظ والإضافة
  Building2, // 🏢 أيقونة القسم العلمي
  AlertTriangle, // ⚠️ أيقونة التنبيه
  Key, // 🔑 أيقونة كلمة المرور
  Eye, // 👁️ أيقونة إظهار كلمة المرور
  EyeOff, // 🙈 أيقونة إخفاء كلمة المرور
  ShieldCheck, // 🛡️ أيقونة أمان كلمة المرور
  CheckCircle2, // ✅ أيقونة تحقق المعيار بنجاح
  AlertCircle, // ℹ️ أيقونة المعيار غير المكتمل
  ChevronDown, // 🔽 أيقونة القائمة المنسدلة
  Check, // ✔️ أيقونة الاختيار
  Sun, // ☀️ أيقونة الدراسة الصباحية
  Moon, // 🌙 أيقونة الدراسة المسائية
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { UserProfile, StageGroupConfig } from '@/types'; // 🏷️ استيراد الأنواع الصارمة
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 المودال العائم الفاخر
import { generateStrongUniqueEmail, generateStrongPassword } from '@/lib/mock-data'; // 💾 مولدات البيانات الأكاديمية
import { checkEmailUniquenessAcrossSystem } from '@/lib/validation-utils'; // 🛡️ فحص فرادة البريد
import { GroupUsersSvg, GroupBadgeSvg } from '@/components/common/GroupSvgIcons'; // 🎨 استيراد أيقونات الكروبات والشعب النقية

// 📋 واجهة خصائص مودال إضافة وتعديل بيانات وحساب الطالب
export interface StudentModalProps {
  isOpen: boolean; // 📂 حالة ظهور النافذة
  onClose: () => void; // 🛑 دالة إغلاق النافذة وتصفير الحقول
  editingStudentId: string | null; // ✍️ معرف الطالب الجاري تعديله أو null للإضافة
  deptName: string; // 🏢 اسم القسم العلمي
  studentName: string; // 👤 اسم الطالب الثلاثي/الرباعي
  setStudentName: (name: string) => void; // 🔄 دالة تحديث اسم الطالب
  studentNameError: string; // ⚠️ رسالة خطأ الاسم
  setStudentNameError: (error: string) => void; // 🔄 دالة تحديث خطأ الاسم
  studentStage: number | null; // 🎓 المرحلة الدراسية (1 إلى 4 أو null)
  setStudentStage: (stage: number | null) => void; // 🔄 دالة تحديد المرحلة
  isStudentStageDropdownOpen: boolean; // 🔽 حالة فتح دروب داون المراحل
  setIsStudentStageDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 دالة تبديل فتح دروب داون المراحل
  stageButtonRef: React.RefObject<HTMLButtonElement | null>; // 🔗 مرجع زر فتح قائمة المراحل
  stageDropdownCoords: { top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null; // 📐 إحداثيات القائمة
  handleToggleStudentStageDropdown: () => void; // 🔄 دالة فتح/غلق قائمة المراحل
  studentGender: 'male' | 'female' | null; // 🚻 جنس الطالب
  setStudentGender: (gender: 'male' | 'female' | null) => void; // 🔄 دالة تحديد الجنس
  studentStudyType: 'morning' | 'evening' | null; // ☀️🌙 نوع الدوام
  setStudentStudyType: (studyType: 'morning' | 'evening' | null) => void; // 🔄 دالة تحديد نوع الدوام
  studentGroup?: string; // 🏷️ كروب الطالب (A, B, C, D أو فارغ للشعبة العامة)
  setStudentGroup?: (group: string) => void; // 🔄 دالة تحديث كروب الطالب
  stageGroupConfigs?: StageGroupConfig[]; // 📋 قائمة إعدادات الكروبات للمراحل
  customStudentEmail: string; // ✉️ البريد الأكاديمي المخصص أو المولد
  setCustomStudentEmail: (email: string) => void; // 🔄 دالة تحديث البريد
  customStudentPassword: string; // 🔑 كلمة المرور المخصصة أو المولدة
  setCustomStudentPassword: (password: string) => void; // 🔄 دالة تحديث كلمة المرور
  showStudentPassword: boolean; // 👁️ إظهار كلمة المرور
  setShowStudentPassword: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 دالة تبديل إظهار الرمز
  studentPasswordCriteria: { length: boolean; hasUpper: boolean; hasNumber: boolean; hasSpecial: boolean }; // 🔐 معايير الرمز
  studentPasswordStrengthScore: number; // 📊 قوة الرمز من 100
  profiles: UserProfile[]; // 👥 قائمة كافة الحسابات لفحص التكرار
  onSave: (e: React.FormEvent) => void; // 💾 دالة الحفظ
  onAutoGenerateCredentials: () => void; // ⚡ دالة التوليد التلقائي للبيانات
  getStageNameInArabic: (stg: number) => string; // 🏷️ دالة تحويل رقم المرحلة لاسم عربي
}

// 🏛️ مكون النافذة المنبثقة لإضافة وتعديل بيانات وحسابات الطلبة
export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen, // 📂 حالة الفتح
  onClose, // 🛑 دالة الإغلاق
  editingStudentId, // ✍️ معرف الطالب للتعديل
  deptName, // 🏢 اسم القسم
  studentName, // 👤 اسم الطالب
  setStudentName, // 🔄 تحديث الاسم
  studentNameError, // ⚠️ خطأ الاسم
  setStudentNameError, // 🔄 تحديث خطأ الاسم
  studentStage, // 🎓 المرحلة
  setStudentStage, // 🔄 تحديد المرحلة
  isStudentStageDropdownOpen, // 🔽 حالة منسدلة المراحل
  setIsStudentStageDropdownOpen, // 🔄 تبديل حالة منسدلة المراحل
  stageButtonRef, // 🔗 مرجع زر المراحل
  stageDropdownCoords, // 📐 إحداثيات منسدلة المراحل
  handleToggleStudentStageDropdown, // 🔄 فتح/غلق منسدلة المراحل
  studentGender, // 🚻 جنس الطالب
  setStudentGender, // 🔄 تحديد الجنس
  studentStudyType, // ☀️🌙 نوع الدوام
  setStudentStudyType, // 🔄 تحديد نوع الدوام
  studentGroup, // 🏷️ كروب الطالب
  setStudentGroup, // 🔄 تحديد كروب الطالب
  stageGroupConfigs, // 📋 قائمة إعدادات الكروبات للمراحل
  customStudentEmail, // ✉️ البريد
  setCustomStudentEmail, // 🔄 تحديث البريد
  customStudentPassword, // 🔑 الرمز
  setCustomStudentPassword, // 🔄 تحديث الرمز
  showStudentPassword, // 👁️ إظهار الرمز
  setShowStudentPassword, // 🔄 تبديل إظهار الرمز
  studentPasswordCriteria, // 🔐 معايير الرمز
  studentPasswordStrengthScore, // 📊 قوة الرمز
  profiles, // 👥 الحسابات
  onSave, // 💾 دالة الحفظ
  onAutoGenerateCredentials, // ⚡ توليد البيانات
  getStageNameInArabic, // 🏷️ اسم المرحلة بالعربية
}) => {
  // 🔍 فحص إعداد الكروبات للمرحلة والدوام المحددين
  const currentStageConfig = stageGroupConfigs?.find(
    (c) => c.stage_number === studentStage && c.study_type === (studentStudyType || 'morning')
  );
  // ⚙️ هل المرحلة المحددة مقسمة إلى كروبات؟
  const stageHasGroups = Boolean(currentStageConfig?.has_groups && currentStageConfig.groups.length > 0);
  // 📋 قائمة الكروبات المتاحة للمرحلة والدوام
  const availableGroups = currentStageConfig?.groups || ['A', 'B'];

  // 🛑 إذا كانت النافذة مغلقة لا يتم رسم شيء
  if (!isOpen) return null;

  return (
    // 📝 كارت CRUD عائم فوق الكل بخلفية زجاجية كاملة
    <FloatingCrudModal
      isOpen={isOpen} // 📂 حالة الظهور
      onClose={onClose} // 🛑 دالة الإغلاق
      title={editingStudentId ? 'تعديل بيانات الطالب الأكاديمي' : 'تسجيل طالب جديد وتوليد الحساب الأكاديمي'} // 🏷️ العنوان
      subtitle={editingStudentId ? `تعديل بيانات الحساب للطالب في قسم ${deptName}` : `سيتم توليد البريد الأكاديمي وكلمة المرور وحفظ الحساب بقسم ${deptName} فورياً`} // 📝 الوصف
      icon={editingStudentId ? <Edit3 className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />} // 🎨 الأيقونة
      maxWidth="max-w-3xl" // 📏 عرض المودال
      onSubmit={onSave} // 💾 دالة الإرسال
      footer={
        <>
          {/* 🛑 زر الإلغاء */}
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-2xl text-base transition cursor-pointer border border-slate-300"
          >
            إلغاء
          </button>
          {/* 💾 زر الحفظ والتسجيل */}
          <button
            type="submit"
            className="px-7 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-md transition flex items-center gap-2 cursor-pointer border border-[#0F2942] active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>{editingStudentId ? 'حفظ التعديلات' : 'تسجيل وتوليد الحساب'}</span>
          </button>
        </>
      }
    >
      <div className="space-y-5 text-base font-black">
        {/* ⚡ شريط التوليد التلقائي لبيانات الاعتماد الرسمية */}
        <div className="bg-slate-50 border border-slate-300 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="text-sm text-slate-800 font-bold">
            يمكنك التوليد التلقائي لبريد أكاديمي رسمي فريد ورمز دخول معقد فريد 100%:
          </div>
          <button
            type="button"
            onClick={onAutoGenerateCredentials}
            className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer whitespace-nowrap border border-[#0F2942] active:scale-95"
          >
            <span>توليد بريد ورمز معقد تلقائياً</span>
          </button>
        </div>

        {/* 👤 حقل اسم الطالب */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-slate-950 font-black text-base">الاسم الثلاثي أو الرباعي واللقب *</label>
            {studentNameError && (
              <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 animate-pulse">
                {studentNameError}
              </span>
            )}
          </div>
          <input
            type="text"
            required
            value={studentName}
            onChange={(e) => {
              setStudentName(e.target.value);
              if (studentNameError) setStudentNameError('');
            }}
            placeholder="مثال: علي محمد رضا الموسوي..."
            className={`w-full px-4 py-3.5 bg-slate-50 border rounded-2xl text-slate-950 font-black text-base focus:outline-none shadow-2xs placeholder:text-slate-400 placeholder:font-bold ${
              studentNameError ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-300 focus:border-slate-900'
            }`}
          />
        </div>

        {/* 🏛️ القسم والمرحلة الدراسية */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-slate-950 font-black text-base">القسم العلمي الأكاديمي:</label>
            <div className="px-4 py-3.5 bg-slate-100 border border-slate-300 rounded-2xl text-slate-950 font-black text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-700" />
              <span>{deptName}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-slate-950 font-black text-base">المرحلة الدراسية:</label>
            <div>
              <button
                ref={stageButtonRef}
                type="button"
                onClick={handleToggleStudentStageDropdown}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-slate-950 font-black text-base focus:border-slate-900 focus:outline-none flex items-center justify-between cursor-pointer shadow-2xs hover:bg-slate-100 transition-all text-right"
              >
                <span className={studentStage ? 'text-slate-950 font-black' : 'text-slate-500 font-bold'}>
                  {studentStage ? `المرحلة ${getStageNameInArabic(studentStage)}` : 'غير محدد (اختر المرحلة الدراسية)...'}
                </span>
                <ChevronDown className={`w-5 h-5 text-slate-700 transition-transform duration-200 ${isStudentStageDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* 🔽 دروب داون المراحل المخصصة العائمة عبر البورتال */}
              {isStudentStageDropdownOpen && stageDropdownCoords && typeof document !== 'undefined' && createPortal(
                <>
                  <div 
                    className="fixed inset-0 z-[999999]" 
                    onClick={() => setIsStudentStageDropdownOpen(false)} 
                  />
                  <div 
                    style={{
                      position: 'fixed',
                      ...(stageDropdownCoords.openUpwards
                        ? { bottom: `${stageDropdownCoords.bottom}px` }
                        : { top: `${stageDropdownCoords.top}px` }),
                      left: `${stageDropdownCoords.left}px`,
                      width: `${stageDropdownCoords.width}px`,
                      maxHeight: `${stageDropdownCoords.maxHeight || 220}px`,
                    }}
                    className="bg-white border-2 border-slate-300 rounded-2xl shadow-2xl overflow-hidden z-[999999] overflow-y-auto p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                    dir="rtl"
                  >
                    {[
                      { value: 1, label: 'المرحلة الأولى' },
                      { value: 2, label: 'المرحلة الثانية' },
                      { value: 3, label: 'المرحلة الثالثة' },
                      { value: 4, label: 'المرحلة الرابعة' },
                    ].map((stg) => (
                      <button
                        key={stg.value}
                        type="button"
                        onClick={() => {
                          setStudentStage(stg.value);
                          setIsStudentStageDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-right font-black text-sm sm:text-base rounded-xl transition flex items-center justify-between cursor-pointer ${
                          studentStage === stg.value
                            ? 'bg-[#0F2942] text-white shadow-xs'
                            : 'text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <span>{stg.label}</span>
                        {studentStage === stg.value && <Check className="w-5 h-5 text-emerald-400 stroke-[2.5]" />}
                      </button>
                    ))}
                  </div>
                </>,
                document.body
              )}
            </div>
            {studentStage === null && (
              <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>يرجى اختيار المرحلة الدراسية للطالب</span>
              </p>
            )}
          </div>
        </div>

        {/* 🚻 جنس الطالب و ☀️🌙 الفترة الدراسية */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-slate-950 font-black text-base">الجنس (النوع):</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStudentGender('male')}
                className={`py-3 px-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  studentGender === 'male'
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm ring-2 ring-[#0F2942]/30'
                    : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100 hover:border-[#0F2942]'
                }`}
              >
                <span>ذكر (طالب)</span>
              </button>
              <button
                type="button"
                onClick={() => setStudentGender('female')}
                className={`py-3 px-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  studentGender === 'female'
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm ring-2 ring-[#0F2942]/30'
                    : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100 hover:border-[#0F2942]'
                }`}
              >
                <span>أنثى (طالبة)</span>
              </button>
            </div>
            {studentGender === null && (
              <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>يرجى اختيار جنس الطالب (ذكر أو أنثى)</span>
              </p>
            )}
          </div>

          {/* ☀️🌙 محدد الفترة الدراسية (الصباحي / المسائي) */}
          <div className="space-y-2">
            <label className="block text-slate-950 font-black text-base">الفترة الدراسية (نوع الدوام):</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStudentStudyType('morning')}
                className={`py-3 px-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  studentStudyType === 'morning'
                    ? 'bg-[#0F2942] text-white border-[#163a5f] shadow-sm ring-2 ring-[#0F2942]/20'
                    : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>الدراسة الصباحية</span>
              </button>
              <button
                type="button"
                onClick={() => setStudentStudyType('evening')}
                className={`py-3 px-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  studentStudyType === 'evening'
                    ? 'bg-[#0F2942] text-white border-[#163a5f] shadow-sm ring-2 ring-[#0F2942]/20'
                    : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>الدراسة المسائية</span>
              </button>
            </div>
            {studentStudyType === null && (
              <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>يرجى اختيار الفترة الدراسية (الصباحية أو المسائية)</span>
              </p>
            )}
          </div>
        </div>

        {/* 👥 محدد المجموعة والشعبة (الكروب) الأكاديمي لمسار بولونيا */}
        <div className="space-y-2.5 bg-slate-50 border border-slate-300 p-4 rounded-3xl shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="block text-slate-950 font-black text-base flex items-center gap-2">
              <GroupUsersSvg className="w-5 h-5 text-slate-800" />
              <span>المجموعة والشعبة الأكاديمية (الكروب):</span>
            </label>
            {studentStage && (
              <span className={`text-xs px-3 py-1 rounded-xl font-black ${
                stageHasGroups 
                  ? 'bg-blue-100 text-blue-950 border border-blue-300' 
                  : 'bg-slate-200 text-slate-800 border border-slate-300'
              }`}>
                {stageHasGroups ? `المرحلة ${getStageNameInArabic(studentStage)} بها ${availableGroups.length} كروبات` : 'شعبة عامة موحدة'}
              </span>
            )}
          </div>

          {!studentStage ? (
            <p className="text-xs font-bold text-slate-500 py-1">
              يرجى اختيار المرحلة الدراسية أعلاه لتحديد الكروبات المتاحة لها.
            </p>
          ) : !stageHasGroups ? (
            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl">
              <span className="text-sm font-black text-slate-800 flex items-center gap-2">
                <GroupBadgeSvg className="w-4 h-4 text-slate-600" />
                <span>المرحلة {getStageNameInArabic(studentStage)} شعبة عامة موحدة (لا توجد كروبات منفصلة)</span>
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl font-black">
                عامة (بدون كروب)
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* خيار: بدون كروب / عامة */}
                <button
                  type="button"
                  onClick={() => setStudentGroup && setStudentGroup('')}
                  className={`py-2.5 px-3.5 rounded-xl font-black text-sm transition-all flex items-center gap-1.5 cursor-pointer border ${
                    !studentGroup
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm ring-2 ring-[#0F2942]/20'
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>عامة (بدون كروب)</span>
                </button>

                {/* أزرار الكروبات المتاحة A, B, C, D... */}
                {availableGroups.map((grp) => {
                  const isSel = studentGroup === grp;
                  return (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setStudentGroup && setStudentGroup(grp)}
                      className={`py-2.5 px-4 rounded-xl font-black text-sm transition-all flex items-center gap-2 cursor-pointer border ${
                        isSel
                          ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm ring-2 ring-[#0F2942]/20'
                          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-mono font-black ${
                        isSel ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-900'
                      }`}>
                        {grp}
                      </span>
                      <span>كروب {grp}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ✉️ البريد الأكاديمي المخصص و 🔑 كلمة المرور */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* البريد الأكاديمي */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-950 font-black text-sm">
                البريد الأكاديمي (اختياري - يترك فارغاً للتوليد)
              </label>
              <button
                type="button"
                onClick={() => setCustomStudentEmail(generateStrongUniqueEmail('st', profiles))}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                title="توليد بريد أكاديمي رسمي فريد للطالب"
              >
                <span>توليد بريد فريد</span>
              </button>
            </div>
            <input
              type="text"
              value={customStudentEmail}
              onChange={(e) => setCustomStudentEmail(e.target.value)}
              placeholder="مثال: std.2026.haider@sadiq.edu.iq"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-950 font-black text-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none shadow-2xs font-mono"
              dir="ltr"
            />
            {customStudentEmail.trim() && !checkEmailUniquenessAcrossSystem(customStudentEmail, editingStudentId || undefined, profiles).isUnique && (
              <div className="p-2 bg-rose-50 border border-rose-300 rounded-xl text-xs font-black text-rose-950 flex items-center gap-1.5 mt-1.5 animate-in fade-in duration-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{checkEmailUniquenessAcrossSystem(customStudentEmail, editingStudentId || undefined, profiles).errorMessage}</span>
              </div>
            )}
          </div>

          {/* كلمة المرور */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-950 font-black text-sm">
                كلمة المرور (اختياري - تترك فارغة للتوليد)
              </label>
              <button
                type="button"
                onClick={() => setCustomStudentPassword(generateStrongPassword(profiles))}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                title="توليد رمز سري قوي عشوائي غير مكرر نهائياً"
              >
                <Key className="w-3.5 h-3.5 text-emerald-700" />
                <span>توليد رمز عشوائي قوي</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showStudentPassword ? 'text' : 'password'}
                value={customStudentPassword}
                onChange={(e) => setCustomStudentPassword(e.target.value)}
                placeholder="مثال: Sadiq#Std2026!"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-950 font-black text-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none shadow-2xs font-mono"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowStudentPassword((prev) => !prev)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950 p-1.5 rounded-lg hover:bg-slate-200/70 transition cursor-pointer flex items-center justify-center"
                title={showStudentPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                aria-label={showStudentPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showStudentPassword ? (
                  <EyeOff className="w-4.5 h-4.5 text-slate-700" />
                ) : (
                  <Eye className="w-4.5 h-4.5 text-slate-700" />
                )}
              </button>
            </div>
          </div>

        </div>

        {/* 🛡️ شروط ومعايير كلمة المرور التفاعلية */}
        <div className="p-4 bg-slate-50 border border-slate-300 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-700" />
              <span>شروط ومعايير كلمة المرور الأكاديمية:</span>
            </div>
            {customStudentPassword && (
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                studentPasswordStrengthScore === 100 
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-300' 
                  : studentPasswordStrengthScore >= 50 
                    ? 'bg-sky-100 text-sky-950 border-sky-300' 
                    : 'bg-rose-100 text-rose-950 border-rose-300'
              }`}>
                {studentPasswordStrengthScore === 100 ? 'رمز قوي ومثالي' : studentPasswordStrengthScore >= 50 ? 'رمز متوسط' : 'رمز ضعيف'}
              </span>
            )}
          </div>

          {/* مؤشر القوة البصري */}
          {customStudentPassword && (
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  studentPasswordStrengthScore === 100 
                    ? 'bg-emerald-600' 
                    : studentPasswordStrengthScore >= 50 
                      ? 'bg-sky-500' 
                      : 'bg-rose-500'
                }`} 
                style={{ width: `${studentPasswordStrengthScore}%` }}
              />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-black">
            <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
              studentPasswordCriteria.length ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
            }`}>
              {studentPasswordCriteria.length ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              <span>8 خانات فأكثر</span>
            </div>

            <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
              studentPasswordCriteria.hasUpper ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
            }`}>
              {studentPasswordCriteria.hasUpper ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              <span>حرف كبير (A-Z)</span>
            </div>

            <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
              studentPasswordCriteria.hasNumber ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
            }`}>
              {studentPasswordCriteria.hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              <span>رقم (0-9)</span>
            </div>

            <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
              studentPasswordCriteria.hasSpecial ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
            }`}>
              {studentPasswordCriteria.hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              <span>رمز خاص (!@#$)</span>
            </div>
          </div>
        </div>

      </div>
    </FloatingCrudModal>
  );
};

export default StudentModal; // 🚀 تصدير المكون
