'use client'; // ⚡ ينفذ على جهة العميل بمتصفح المستخدم

// 📝 مكون كارد إضافة أستاذ جديد وتوليد بياناته المعتمدة
// 🇮🇶 توثيق عراقي سطر بسطر والتزام نمطي صارم بدون any أو unknown

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import { Plus, Sparkles, Building2, User, Mail, Key, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, AlertTriangle, RefreshCw, ChevronDown, Check } from 'lucide-react'; // 🎨 أيقونات لوسيد
import type { UserProfile, Department, Course } from '@/types'; // 🏷️ استيراد الأنواع الرسمية
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 المودال العائم الفاخر
import { AcademicPasswordStrengthBox } from '@/components/AcademicPasswordStrengthBox'; // 🛡️ صندوق قوة كلمة المرور الموحد
import { generateStrongUniqueEmail, generateStrongPassword } from '@/lib/mock-data'; // 💾 مولدات البريد وكلمة المرور
import { checkEmailUniquenessAcrossSystem } from '@/lib/validation-utils'; // 🛡️ محرك فحص فرادة البريد الأكاديمي

// 📋 واجهة خصائص نافذة إضافة أستاذ جديد
export interface AdminTeacherAddModalProps {
  showAddModal: boolean; // 🪟 حالة ظهور نافذة الإضافة
  setShowAddModal: (open: boolean) => void; // 🔄 دالة فتح وإغلاق النافذة
  handleAddTeacher: (e: React.FormEvent) => void; // 💾 دالة حفظ الأستاذ الجديد
  addTeacherError: string; // ⚠️ رسالة خطأ الإضافة
  setAddTeacherError: (err: string) => void; // 🔄 دالة تحديث رسالة الخطأ
  fullName: string; // 👤 الاسم الكامل للأستاذ
  setFullName: (name: string) => void; // 🔄 دالة تحديث الاسم
  teacherGender: 'male' | 'female' | null; // 🚻 جنس الأستاذ (ذكر أو أنثى)
  setTeacherGender: (gender: 'male' | 'female' | null) => void; // 🔄 دالة تحديد الجنس
  selectedDeptId: string; // 🏢 معرف القسم المختار
  setSelectedDeptId: (id: string) => void; // 🔄 دالة تحديد القسم
  departments: Department[]; // 🏢 قائمة كافة الأقسام العلمية
  customTeacherEmail: string; // ✉️ البريد الأكاديمي
  setCustomTeacherEmail: (email: string) => void; // 🔄 دالة تحديث البريد
  customTeacherPassword: string; // 🔑 كلمة المرور
  setCustomTeacherPassword: (pass: string) => void; // 🔄 دالة تحديث كلمة المرور
  showTeacherPassword: boolean; // 👁️ إظهار كلمة المرور
  setShowTeacherPassword: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 دالة تبديل إظهار الرمز
  isAddDeptDropdownOpen: boolean; // 🔽 فتح منسدلة القسم
  setIsAddDeptDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 دالة تبديل فتح المنسدلة
  addDeptDropdownRef: React.RefObject<HTMLDivElement | null>; // 📍 مرجع المنسدلة
  courses: Course[]; // 📖 قائمة كافة المواد
  selectedCourseIds: string[]; // 📚 المواد المختارة للتكليف
  setSelectedCourseIds: React.Dispatch<React.SetStateAction<string[]>>; // 🔄 دالة تحديث المواد المختارة
  profiles: UserProfile[]; // 👥 كافة الحسابات لفحص التكرار
}

// 🏛️ مكون مودال إضافة أستاذ جديد
export const AdminTeacherAddModal: React.FC<AdminTeacherAddModalProps> = ({
  showAddModal,
  setShowAddModal,
  handleAddTeacher,
  addTeacherError,
  setAddTeacherError,
  fullName,
  setFullName,
  teacherGender,
  setTeacherGender,
  selectedDeptId,
  setSelectedDeptId,
  departments,
  customTeacherEmail,
  setCustomTeacherEmail,
  customTeacherPassword,
  setCustomTeacherPassword,
  showTeacherPassword,
  setShowTeacherPassword,
  isAddDeptDropdownOpen,
  setIsAddDeptDropdownOpen,
  addDeptDropdownRef,
  courses,
  selectedCourseIds,
  setSelectedCourseIds,
  profiles,
}) => {
  return (
    <FloatingCrudModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setShowTeacherPassword(false);
        }}
        title="إضافة أستاذ جديد وتوليد بياناته الموثقة"
        subtitle="سيتم حفظ البريد المعقد والرمز العشوائي وتزامنهما فوراً بقاعدة البيانات"
        icon={<Plus className="w-6 h-6" />}
        onSubmit={handleAddTeacher}
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setShowTeacherPassword(false);
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl text-sm cursor-pointer border border-slate-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm shadow-md cursor-pointer border border-[#1e4570] active:scale-95"
            >
              حفظ الأستاذ وتوليد البطاقة
            </button>
          </>
        }
      >
        <div className="space-y-4 text-sm font-black">
          {addTeacherError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-black flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{addTeacherError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-950 mb-1.5 font-black text-sm">الاسم الكامل للأستاذ</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="د. أحمد فاضل المحمداوي"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 font-black text-sm placeholder:text-slate-700 focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div className="relative" ref={addDeptDropdownRef}>
              <label className="block text-slate-950 mb-1.5 font-black text-sm">القسم العلمي</label>
              <button
                type="button"
                onClick={() => setIsAddDeptDropdownOpen(!isAddDeptDropdownOpen)}
                className={`w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 border-2 rounded-xl text-slate-950 font-black text-sm flex items-center justify-between transition cursor-pointer ${
                  isAddDeptDropdownOpen ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-700 shrink-0" />
                  <span>{departments.find((d) => d.id === selectedDeptId)?.name || 'اختر قسماً'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform ${isAddDeptDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAddDeptDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-right">
                  {departments.map((d) => {
                    const isSelected = selectedDeptId === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setSelectedDeptId(d.id);
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
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-slate-950 font-black text-sm">الجنس (النوع) *</label>
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-all ${
                  teacherGender === null
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {teacherGender === null ? (
                    <>
                      <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                      <span>غير محدد</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{teacherGender === 'male' ? 'ذكر (أستاذ)' : 'أنثى (أستاذة)'}</span>
                    </>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTeacherGender('male')}
                  className={`py-2.5 px-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                    teacherGender === 'male'
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>ذكر (أستاذ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherGender('female')}
                  className={`py-2.5 px-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                    teacherGender === 'female'
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>أنثى (أستاذة)</span>
                </button>
              </div>
              {teacherGender === null && (
                <p className="text-xs font-bold text-rose-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>يرجى النقر لاختيار جنس الأستاذ (ذكر أو أنثى)</span>
                </p>
              )}
            </div>
          </div>

          {/* ✉️ البريد والرمز السري مع أزرار التوليد المنفصلة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <label className="block text-slate-950 font-black text-sm">البريد الأكاديمي (اختياري)</label>
                <button
                  type="button"
                  onClick={() => setCustomTeacherEmail(generateStrongUniqueEmail('dr', profiles))}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                  title="توليد بريد أكاديمي رسمي فريد للأستاذ"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-700" />
                  <span>توليد بريد فريد</span>
                </button>
              </div>
              <input
                type="text"
                value={customTeacherEmail}
                onChange={(e) => {
                  setCustomTeacherEmail(e.target.value);
                  setAddTeacherError('');
                }}
                placeholder="اتركه فارغاً للتوليد التلقائي أو اضغط الزر"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 font-black text-sm placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none"
                dir="ltr"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <label className="block text-slate-950 font-black text-sm">الرمز السري / كلمة المرور (اختياري)</label>
                <button
                  type="button"
                  onClick={() => setCustomTeacherPassword(generateStrongPassword(profiles))}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                  title="توليد رمز سري عشوائي قوي جداً وغير مكرر نهائياً"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                  <span>توليد رمز عشوائي قوي</span>
                </button>
              </div>
              <div className="relative">
                {/* 🔑 حقل كلمة المرور بنجوم افتراضية للأمان وحشوة للأيقونة */}
                <input
                  type={showTeacherPassword ? 'text' : 'password'}
                  value={customTeacherPassword}
                  onChange={(e) => setCustomTeacherPassword(e.target.value)}
                  placeholder="اتركه فارغاً للتوليد التلقائي أو اضغط الزر"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 font-black text-sm placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none"
                  dir="ltr"
                />
                {/* 👁️ زر إظهار وإخفاء الرمز السري بأيقونة SVG نقية */}
                <button
                  type="button"
                  onClick={() => setShowTeacherPassword((prev) => !prev)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950 p-1.5 rounded-lg hover:bg-slate-200/70 transition cursor-pointer flex items-center justify-center"
                  title={showTeacherPassword ? 'إخفاء الرمز السري' : 'إظهار الرمز السري'}
                  aria-label={showTeacherPassword ? 'إخفاء الرمز السري' : 'إظهار الرمز السري'}
                >
                  {showTeacherPassword ? (
                    <EyeOff className="w-5 h-5 text-slate-700" />
                  ) : (
                    <Eye className="w-5 h-5 text-slate-700" />
                  )}
                </button>
              </div>
            </div>

            {/* ⚠️ شريط تنبيه فرادة البريد يمتد بكامل عرض الكارد بحجم خط متوسط وأيقونة SVG نقية */}
            {customTeacherEmail.trim() && !checkEmailUniquenessAcrossSystem(customTeacherEmail, undefined, profiles).isUnique && (
              <div className="col-span-1 md:col-span-2 p-3 sm:p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center gap-3 text-rose-950 shadow-xs animate-in fade-in duration-200">
                <div className="p-2 bg-rose-200/70 text-rose-700 rounded-xl shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-xs sm:text-sm font-black text-rose-950 leading-relaxed">
                  {checkEmailUniquenessAcrossSystem(customTeacherEmail, undefined, profiles).errorMessage}
                </p>
              </div>
            )}

            {/* 🛡️ صندوق معايير وشروط كلمة المرور الأكاديمية التفاعلي الموحد */}
            {customTeacherPassword && (
              <div className="col-span-1 md:col-span-2">
                <AcademicPasswordStrengthBox password={customTeacherPassword} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-950 mb-2 font-black text-sm">تحديد المواد المكلف بها الأستاذ:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-300">
              {courses.map((c) => (
                <label key={c.id} className="p-3 bg-white rounded-lg border border-slate-300 flex items-center gap-2.5 text-slate-950 font-black cursor-pointer hover:border-slate-950 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedCourseIds.includes(c.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedCourseIds([...selectedCourseIds, c.id]);
                      else setSelectedCourseIds(selectedCourseIds.filter((id) => id !== c.id));
                    }}
                    className="rounded accent-slate-900 w-4 h-4"
                  />
                  <span>{c.name} ({c.department_name})</span>
                </label>
              ))}
            </div>
          </div>

        </div>
      </FloatingCrudModal>

  );
};
