'use client'; // ⚡ ينفذ على جهة العميل بمتصفح المستخدم

// 📝 مكون كارد إضافة طالب جديد مع توليد بيانات الدخول الأكاديمية
// 🇮🇶 توثيق عراقي سطر بسطر والتزام نمطي صارم بدون any أو unknown

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import {
  Plus, Sparkles, Building2, GraduationCap, Sun, Moon,
  Mail, Key, Eye, EyeOff, RefreshCw, ChevronDown, Check,
  AlertCircle, AlertTriangle, ShieldCheck
} from 'lucide-react'; // 🎨 أيقونات لوسيد
import type { UserProfile, Department } from '@/types'; // 🏷️ استيراد الأنواع الرسمية
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 المودال العائم الفاخر
import { AcademicPasswordStrengthBox } from '@/components/AcademicPasswordStrengthBox'; // 🛡️ صندوق قوة كلمة المرور الموحد
import { generateStrongUniqueEmail, generateStrongPassword } from '@/lib/mock-data'; // 💾 مولدات الحسابات
import { checkEmailUniquenessAcrossSystem } from '@/lib/validation-utils'; // 🛡️ فحص فرادة البريد

// 📋 واجهة خصائص مودال إضافة طالب جديد
export interface AdminStudentAddModalProps {
  showAddModal: boolean; // 🪟 حالة فتح نافذة الإضافة
  setShowAddModal: (open: boolean) => void; // 🔄 دالة فتح وإغلاق النافذة
  handleAddStudent: (e: React.FormEvent) => void; // 💾 دالة حفظ الطالب الجديد
  warningError: string; // ⚠️ رسالة الخطأ
  setWarningError: (err: string) => void; // 🔄 دالة تحديث الخطأ
  addFullName: string; // 👤 اسم الطالب
  setAddFullName: (name: string) => void; // 🔄 دالة تحديث الاسم
  addGender: 'male' | 'female' | null; // 🚻 جنس الطالب
  setAddGender: (g: 'male' | 'female' | null) => void; // 🔄 دالة تحديث الجنس
  addDeptId: string; // 🏢 معرف القسم
  setAddDeptId: (id: string) => void; // 🔄 دالة تحديث القسم
  departments: Department[]; // 🏢 قائمة الأقسام
  isAddDeptDropdownOpen: boolean; // 🔽 فتح منسدلة القسم
  setIsAddDeptDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 دالة تبديل فتح المنسدلة
  addDeptDropdownRef: React.RefObject<HTMLDivElement | null>; // 📍 مرجع منسدلة القسم
  addStageNum: number | null; // 🎓 رقم المرحلة
  setAddStageNum: (stage: number | null) => void; // 🔄 دالة تحديث المرحلة
  isAddStageDropdownOpen: boolean; // 🔽 فتح منسدلة المرحلة
  setIsAddStageDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 دالة تبديل فتح منسدلة المرحلة
  addStageDropdownRef: React.RefObject<HTMLDivElement | null>; // 📍 مرجع منسدلة المرحلة
  customStudentEmail: string; // ✉️ البريد الأكاديمي
  setCustomStudentEmail: (email: string) => void; // 🔄 دالة تحديث البريد
  customStudentPassword: string; // 🔑 كلمة المرور
  setCustomStudentPassword: (pass: string) => void; // 🔄 دالة تحديث كلمة المرور
  showStudentPassword: boolean; // 👁️ إظهار كلمة المرور
  setShowStudentPassword: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 دالة تبديل إظهار الرمز
  profiles: UserProfile[]; // 👥 قائمة كافة الحسابات
}

// 🏛️ مكون نافذة إضافة طالب جديد
export const AdminStudentAddModal: React.FC<AdminStudentAddModalProps> = ({
  showAddModal,
  setShowAddModal,
  handleAddStudent,
  warningError,
  setWarningError,
  addFullName,
  setAddFullName,
  addGender,
  setAddGender,
  addDeptId,
  setAddDeptId,
  departments,
  isAddDeptDropdownOpen,
  setIsAddDeptDropdownOpen,
  addDeptDropdownRef,
  addStageNum,
  setAddStageNum,
  isAddStageDropdownOpen,
  setIsAddStageDropdownOpen,
  addStageDropdownRef,
  customStudentEmail,
  setCustomStudentEmail,
  customStudentPassword,
  setCustomStudentPassword,
  showStudentPassword,
  setShowStudentPassword,
  profiles,
}) => {
  if (!showAddModal) return null;

  return (
        <FloatingCrudModal
          title="إضافة حساب طالب جديد"
          subtitle="توليد أو إدخال البريد وكلمة المرور واختيار القسم والمرحلة وحفظ البيانات مباشرة"
          isOpen={showAddModal}
          onClose={() => { 
            setShowAddModal(false); 
            setWarningError('');
            setAddFullName('');
            setCustomStudentEmail('');
            setCustomStudentPassword('');
            setShowStudentPassword(false);
            setAddGender(null); // 🔄 تصفير الجنس
            setAddStageNum(null); // 🔄 تصفير المرحلة
          }}
          icon={<Plus className="w-6 h-6 text-indigo-700" />}
          maxWidth="max-w-3xl"
          onSubmit={handleAddStudent}
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setAddFullName('');
                  setCustomStudentEmail('');
                  setCustomStudentPassword('');
                  setShowStudentPassword(false);
                  setAddGender(null); // 🔄 تصفير الجنس
                  setAddStageNum(null); // 🔄 تصفير المرحلة
                }}
                className="px-5 py-2.5 bg-slate-100 text-slate-950 font-black rounded-xl text-sm border border-slate-300 cursor-pointer hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm shadow-md cursor-pointer border border-[#1e4570] active:scale-95"
              >
                حفظ وإضافة الطالب
              </button>
            </>
          }
        >
          <div className="space-y-4 text-right">
            
            {warningError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-950 text-sm font-black">
                {warningError}
              </div>
            )}

            {/* ⚡ شريط التوليد التلقائي لبيانات الاعتماد الرسمية */}
            <div className="p-4 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-700 text-white rounded-xl shadow-xs">
                  <Key className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-950">توليد بيانات اعتماد الطالب تلقائياً</h4>
                  <p className="text-xs font-bold text-slate-700">إنشاء بريد أكاديمي معتمد ورمز دخول معقد فريد بنقرة واحدة</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCustomStudentEmail(generateStrongUniqueEmail('st', profiles));
                  setCustomStudentPassword(generateStrongPassword());
                }}
                className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>توليد البريد والرمز معاً</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-950 mb-1.5">الاسم الكامل</label>
              <input
                type="text"
                required
                value={addFullName}
                onChange={(e) => setAddFullName(e.target.value)}
                placeholder="أحمد علي حميد"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 font-black text-sm placeholder:text-slate-700 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* اختيار القسم للإضافة */}
              <div className="relative" ref={addDeptDropdownRef}>
                <label className="block text-sm font-black text-slate-950 mb-1.5">القسم</label>
                <button
                  type="button"
                  onClick={() => setIsAddDeptDropdownOpen(!isAddDeptDropdownOpen)}
                  className={`w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 border-2 rounded-xl text-slate-950 font-black text-sm flex items-center justify-between transition cursor-pointer ${
                    isAddDeptDropdownOpen ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-700 shrink-0" />
                    <span>{departments.find((d) => d.id === addDeptId)?.name || 'اختر قسماً'}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform ${isAddDeptDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAddDeptDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-right">
                    {departments.map((d) => {
                      const isSelected = addDeptId === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setAddDeptId(d.id);
                            setIsAddDeptDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-lg text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                            isSelected ? 'bg-indigo-50 text-indigo-950 border border-indigo-300' : 'text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
                            <span>{d.name}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-700" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* اختيار المرحلة للإضافة */}
              <div className="relative" ref={addStageDropdownRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-black text-slate-950">المرحلة *</label>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                    addStageNum === null
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  }`}>
                    {addStageNum === null ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>غير محدد</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>المرحلة {addStageNum}</span>
                      </>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddStageDropdownOpen(!isAddStageDropdownOpen)}
                  className={`w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 border-2 rounded-xl text-slate-950 font-black text-sm flex items-center justify-between transition cursor-pointer ${
                    isAddStageDropdownOpen ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-700 shrink-0" />
                    <span>
                      {addStageNum === 1
                        ? 'المرحلة الأولى'
                        : addStageNum === 2
                        ? 'المرحلة الثانية'
                        : addStageNum === 3
                        ? 'المرحلة الثالثة'
                        : addStageNum === 4
                        ? 'المرحلة الرابعة'
                        : '-- اختر المرحلة الدراسية --'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform ${isAddStageDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAddStageDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 text-right">
                    {[
                      { key: 1, label: 'المرحلة الأولى 1️⃣' },
                      { key: 2, label: 'المرحلة الثانية 2️⃣' },
                      { key: 3, label: 'المرحلة الثالثة 3️⃣' },
                      { key: 4, label: 'المرحلة الرابعة 4️⃣' },
                    ].map((stg) => {
                      const isSelected = addStageNum === stg.key;
                      return (
                        <button
                          key={stg.key}
                          type="button"
                          onClick={() => {
                            setAddStageNum(stg.key);
                            setIsAddStageDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-lg text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                            isSelected ? 'bg-indigo-50 text-indigo-950 border border-indigo-300' : 'text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <span>{stg.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-indigo-700" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-black text-slate-950">الجنس (النوع) *</label>
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                  addGender === null
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                }`}>
                  {addGender === null ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>غير محدد</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{addGender === 'male' ? 'ذكر (طالب)' : 'أنثى (طالبة)'}</span>
                    </>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAddGender('male')}
                  className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    addGender === 'male'
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>ذكر (طالب)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddGender('female')}
                  className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    addGender === 'female'
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>أنثى (طالبة)</span>
                </button>
              </div>
              {addGender === null && (
                <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>يرجى اختيار جنس الطالب (ذكر أو أنثى)</span>
                </p>
              )}
            </div>

            {/* ✉️ حقل البريد المخصص و 🔑 حقل كلمة المرور */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-slate-950 font-black text-xs">
                    البريد الأكاديمي (اختياري)
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomStudentEmail(generateStrongUniqueEmail('st', profiles))}
                    className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-md text-[11px] font-black flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-2xs"
                    title="توليد بريد أكاديمي رسمي فريد للطالب"
                  >
                    <RefreshCw className="w-3 h-3 text-indigo-700" />
                    <span>توليد بريد فريد</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={customStudentEmail}
                  onChange={(e) => {
                    setCustomStudentEmail(e.target.value);
                    setWarningError('');
                  }}
                  placeholder="مثال: st.ahmed2026@sadiq.edu.iq"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 font-black text-xs placeholder:text-slate-700 focus:border-indigo-600 focus:outline-none shadow-2xs"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-slate-950 font-black text-xs">
                    كلمة المرور (اختياري)
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomStudentPassword(generateStrongPassword(profiles))}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-md text-[11px] font-black flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-2xs"
                    title="توليد رمز سري قوي غير مكرر نهائياً"
                  >
                    <Key className="w-3 h-3 text-emerald-700" />
                    <span>توليد رمز عشوائي قوي</span>
                  </button>
                </div>
                <div className="relative">
                  {/* 🔑 حقل كلمة المرور بنجوم افتراضية للأمان وحشوة للأيقونة */}
                  <input
                    type={showStudentPassword ? 'text' : 'password'}
                    value={customStudentPassword}
                    onChange={(e) => setCustomStudentPassword(e.target.value)}
                    placeholder="مثال: Sadiq#Stud2026!"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 font-black text-xs placeholder:text-slate-700 focus:border-indigo-600 focus:outline-none shadow-2xs"
                    dir="ltr"
                  />
                  {/* 👁️ زر إظهار وإخفاء الرمز السري بأيقونة SVG نقية */}
                  <button
                    type="button"
                    onClick={() => setShowStudentPassword((prev) => !prev)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950 p-1 rounded-lg hover:bg-slate-200/70 transition cursor-pointer flex items-center justify-center"
                    title={showStudentPassword ? 'إخفاء الرمز السري' : 'إظهار الرمز السري'}
                    aria-label={showStudentPassword ? 'إخفاء الرمز السري' : 'إظهار الرمز السري'}
                  >
                    {showStudentPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-700" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-700" />
                    )}
                  </button>
                </div>
              </div>

              {/* ⚠️ شريط تنبيه فرادة البريد يمتد بكامل عرض الكارد بحجم خط متوسط وأيقونة SVG نقية */}
              {customStudentEmail.trim() && !checkEmailUniquenessAcrossSystem(customStudentEmail, undefined, profiles).isUnique && (
                <div className="col-span-1 sm:col-span-2 p-3 sm:p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center gap-3 text-rose-950 shadow-xs animate-in fade-in duration-200">
                  <div className="p-2 bg-rose-200/70 text-rose-700 rounded-xl shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-black text-rose-950 leading-relaxed">
                    {checkEmailUniquenessAcrossSystem(customStudentEmail, undefined, profiles).errorMessage}
                  </p>
                </div>
              )}

              {/* 🛡️ صندوق معايير وشروط كلمة المرور الأكاديمية التفاعلي الموحد */}
              {customStudentPassword && (
                <div className="col-span-1 sm:col-span-2">
                  <AcademicPasswordStrengthBox password={customStudentPassword} />
                </div>
              )}

            </div>

          </div>
        </FloatingCrudModal>

  );
};
