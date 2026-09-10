'use client'; // ⚡ تفعيل واجهة العميل التفاعلية في Next.js

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import {
  UserPlus, // 👤 أيقونة إضافة مسؤول
  X, // ❌ أيقونة إغلاق المودال
  Key, // 🔑 أيقونة المفتاح وتوليد البيانات
  User, // 👤 أيقونة المسؤول والنوع
  Check, // ✔️ أيقونة التحقق
  RefreshCw, // 🔄 أيقونة إعادة التوليد
  Eye, // 👁️ أيقونة إظهار كلمة المرور
  EyeOff, // 🙈 أيقونة إخفاء كلمة المرور
  AlertCircle, // ⚠️ أيقونة التنبيه
  UserCheck, // 🤝 أيقونة حفظ المسؤول وتعيينه
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { Department, UserProfile } from '@/types'; // 🏷️ استيراد الأنواع الرسمية
import { checkEmailUniquenessAcrossSystem } from '@/lib/validation-utils'; // 🔐 التحقق المركزي من فرادة البريد
import { AcademicPasswordStrengthBox } from '@/components/AcademicPasswordStrengthBox'; // 🛡️ صندوق معايير كلمة المرور
import SmartRoleSelect from './SmartRoleSelect'; // 🎭 مكون اختيار الموقع الإداري الذكي
import SmartDepartmentSelect from './SmartDepartmentSelect'; // 🏢 مكون اختيار القسم الذكي

// 📋 واجهة خصائص نافذة إضافة وتعديل رئيس القسم والمقرر
export interface DepartmentHeadModalProps {
  isOpen: boolean; // 📂 حالة فتح المودال
  onClose: () => void; // 🛑 دالة إغلاق المودال
  editingId: string | null; // 🆔 معرف الحساب الجاري تعديله
  fullName: string; // ✍️ الاسم الكامل
  setFullName: (name: string) => void; // 🔄 تحديث الاسم
  nameError: string; // ⚠️ رسالة خطأ الاسم
  setNameError: (err: string) => void; // 🔄 تحديث خطأ الاسم
  selectedRole: 'department_head' | 'rapporteur' | ''; // 🎭 الموقع الإداري المختار
  setSelectedRole: (role: 'department_head' | 'rapporteur' | '') => void; // 🔄 تحديث الموقع
  selectedGender: 'male' | 'female' | null; // 🚻 الجنس المختار
  setSelectedGender: (g: 'male' | 'female' | null) => void; // 🔄 تحديث الجنس
  genderError: string; // ⚠️ رسالة خطأ الجنس
  setGenderError: (err: string) => void; // 🔄 تحديث خطأ الجنس
  selectedDeptId: string; // 🏢 معرف القسم المرتبط
  setSelectedDeptId: (id: string) => void; // 🔄 تحديث القسم
  departments: Department[]; // 🏢 مصفوفة الأقسام الأكاديمية
  customEmail: string; // ✉️ البريد الأكاديمي
  setCustomEmail: (email: string) => void; // 🔄 تحديث البريد
  customPassword: string; // 🔑 كلمة المرور
  setCustomPassword: (pass: string) => void; // 🔄 تحديث كلمة المرور
  showHeadPassword: boolean; // 👁️ إظهار/إخفاء كلمة المرور
  setShowHeadPassword: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل ظهور الرمز
  handleAutoGenerateCredentials: () => void; // ⚡ توليد البريد والرمز معاً
  handleGenerateUniqueEmail: () => void; // ⚡ توليد بريد فقط
  handleGenerateUniquePassword: () => void; // ⚡ توليد رمز فقط
  handleSave: (e: React.FormEvent) => void; // 💾 دالة حفظ البيانات
  profiles: UserProfile[]; // 👥 مصفوفة مستخدمي النظام للتحقق
}

// 🏛️ مكون نافذة إضافة وتعديل رئيس القسم أو المقرر الأكاديمي
export const DepartmentHeadModal: React.FC<DepartmentHeadModalProps> = ({
  isOpen, // 📂 الفتح
  onClose, // 🛑 الإغلاق
  editingId, // 🆔 معرف التعديل
  fullName, // ✍️ الاسم
  setFullName, // 🔄 تحديث الاسم
  nameError, // ⚠️ خطأ الاسم
  setNameError, // 🔄 تحديث خطأ الاسم
  selectedRole, // 🎭 الموقع
  setSelectedRole, // 🔄 تحديث الموقع
  selectedGender, // 🚻 الجنس
  setSelectedGender, // 🔄 تحديث الجنس
  genderError, // ⚠️ خطأ الجنس
  setGenderError, // 🔄 تحديث خطأ الجنس
  selectedDeptId, // 🏢 القسم
  setSelectedDeptId, // 🔄 تحديث القسم
  departments, // 🏢 الأقسام
  customEmail, // ✉️ البريد
  setCustomEmail, // 🔄 تحديث البريد
  customPassword, // 🔑 كلمة المرور
  setCustomPassword, // 🔄 تحديث كلمة المرور
  showHeadPassword, // 👁️ إظهار الرمز
  setShowHeadPassword, // 🔄 تحديث إظهار الرمز
  handleAutoGenerateCredentials, // ⚡ توليد تلقائي
  handleGenerateUniqueEmail, // ⚡ توليد بريد
  handleGenerateUniquePassword, // ⚡ توليد رمز
  handleSave, // 💾 حفظ
  profiles, // 👥 الحسابات
}) => {
  // 🛑 إذا المودال مغلق لا نرندر شي
  if (!isOpen) return null;

  return (
    // 🌌 غطاء التعتيم الخلفي للمودال
    <div className="fixed inset-0 w-full h-full min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-3 sm:p-6 overflow-hidden">
      {/* 📦 الصندوق الرئيسي الأبيض للمودال */}
      <div className="bg-white border border-slate-300 rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 text-right overflow-hidden relative">
        
        {/* 📌 رأس الكارد العائم الثابت في الأعلى */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5 sm:p-6 shrink-0 bg-white/95 z-30">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
              <UserPlus className="w-6 h-6 text-indigo-700" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950">
                {editingId ? 'تعديل بيانات الحساب الإداري وتغيير القسم' : 'إضافة رئيس قسم أو مقرر جديد وربطه بالقسم'}
              </h3>
              <p className="text-xs sm:text-sm font-black text-slate-950 mt-0.5">
                جامعة الإمام جعفر الصادق (ع) - فرع ميسان | إدارة وتعيين القيادات الأكاديمية
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-950 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 📝 نموذج الإدخال مع التمرير الداخلي السلس */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
            
            {/* ⚡ شريط التوليد التلقائي للبريد والرمز المعقد */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-slate-800 font-bold">
                يمكنك التوليد التلقائي لبريد أكاديمي رسمي ورمز دخول معقد فريد 100%:
              </div>
              <button
                type="button"
                onClick={handleAutoGenerateCredentials}
                className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black text-xs sm:text-sm rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer whitespace-nowrap border border-[#1e4570]"
              >
                <Key className="w-4 h-4 text-cyan-300" />
                <span>توليد بريد ورمز معقد تلقائياً (بدون تكرار)</span>
              </button>
            </div>

            {/* شبكة الحقول المنظمة والواضحة */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start overflow-visible">
              
              {/* 👤 الاسم الكامل (7 أعمدة) */}
              <div className="space-y-1.5 sm:col-span-7">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-black text-slate-950 block">الاسم الثلاثي واللقب الأكاديمي *</label>
                  {nameError && (
                    <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 animate-pulse">
                      {nameError}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFullName(val);
                    if (nameError) setNameError('');
                  }}
                  placeholder="مثال: أ.م.د. علي حسن الموسوي"
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-slate-950 font-black text-sm placeholder:text-slate-400 placeholder:font-medium focus:outline-none transition ${
                    nameError ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-300 focus:border-indigo-600'
                  }`}
                />
              </div>

              {/* 🎭 الدور والموقع الإداري (5 أعمدة) */}
              <div className="sm:col-span-5">
                <SmartRoleSelect
                  value={selectedRole}
                  onChange={(role) => setSelectedRole(role)}
                />
              </div>

              {/* 🚻 تحديد الجنس (ذكر / أنثى) بالهوية الكحلية الملكية الموحدة */}
              <div className="space-y-1.5 sm:col-span-12">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-black text-slate-950 block">الجنس الأكاديمي (ذكر / أنثى) *</label>
                  {genderError && (
                    <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 animate-pulse">
                      {genderError}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 border border-slate-300 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGender('male');
                      setGenderError('');
                    }}
                    className={`py-2.5 px-4 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 cursor-pointer border-2 shadow-2xs ${
                      selectedGender === 'male'
                        ? 'bg-[#0F2942] text-white border-[#0F2942] ring-2 ring-[#0F2942]/20 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4.5 h-4.5 shrink-0" />
                    <span>ذكر (مسؤول أكاديمي)</span>
                    {selectedGender === 'male' && <Check className="w-4 h-4 text-cyan-200" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGender('female');
                      setGenderError('');
                    }}
                    className={`py-2.5 px-4 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 cursor-pointer border-2 shadow-2xs ${
                      selectedGender === 'female'
                        ? 'bg-[#0F2942] text-white border-[#0F2942] ring-2 ring-[#0F2942]/20 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4.5 h-4.5 shrink-0" />
                    <span>أنثى (مسؤولة أكاديمية)</span>
                    {selectedGender === 'female' && <Check className="w-4 h-4 text-cyan-200" />}
                  </button>
                </div>
              </div>

              {/* 🏢 القسم الأكاديمي المرتبط */}
              <div className="sm:col-span-12">
                <SmartDepartmentSelect
                  departments={departments}
                  value={selectedDeptId}
                  onChange={(deptId) => setSelectedDeptId(deptId)}
                />
              </div>

              {/* ✉️ البريد الأكاديمي (6 أعمدة مع زر توليد علوي خاص به) */}
              <div className="space-y-1.5 sm:col-span-6">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-black text-slate-950 block">البريد الأكاديمي (اختياري)</label>
                  <button
                    type="button"
                    onClick={handleGenerateUniqueEmail}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                    title="توليد بريد أكاديمي رسمي فريد 100% غير مكرر"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-700" />
                    <span>توليد بريد فريد</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={customEmail}
                  onChange={(e) => {
                    setCustomEmail(e.target.value);
                    setNameError('');
                  }}
                  placeholder="مثال: head.cce@sadiq.edu.iq أو اضغط زر التوليد أعلاه"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 font-black text-sm placeholder:text-slate-400 placeholder:font-medium focus:border-indigo-600 focus:outline-none transition"
                  dir={customEmail ? "ltr" : "rtl"}
                />
              </div>

              {/* 🔑 كلمة المرور (6 أعمدة مع زر توليد علوي خاص به) */}
              <div className="space-y-1.5 sm:col-span-6">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-black text-slate-950 block">الرمز السري / كلمة المرور (اختياري)</label>
                  <button
                    type="button"
                    onClick={handleGenerateUniquePassword}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                    title="توليد رمز سري عشوائي قوي جداً وفريد 100% غير مكرر داخل قاعدة البيانات"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                    <span>توليد رمز عشوائي قوي</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showHeadPassword ? 'text' : 'password'}
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="مثال: Sadiq#Admin2026! أو اضغط زر التوليد أعلاه"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 font-black text-sm placeholder:text-slate-400 placeholder:font-medium focus:border-indigo-600 focus:outline-none transition"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowHeadPassword((prev) => !prev)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950 p-1.5 rounded-lg hover:bg-slate-200/70 transition cursor-pointer flex items-center justify-center"
                    title={showHeadPassword ? 'إخفاء الرمز السري' : 'إظهار الرمز السري'}
                    aria-label={showHeadPassword ? 'إخفاء الرمز السري' : 'إظهار الرمز السري'}
                  >
                    {showHeadPassword ? (
                      <EyeOff className="w-5 h-5 text-slate-700" />
                    ) : (
                      <Eye className="w-5 h-5 text-slate-700" />
                    )}
                  </button>
                </div>
              </div>

              {/* ⚠️ شريط تنبيه فرادة البريد */}
              {customEmail.trim() && !checkEmailUniquenessAcrossSystem(customEmail, editingId || undefined, profiles).isUnique && (
                <div className="col-span-1 sm:col-span-12 p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center gap-3 text-rose-950 shadow-xs animate-in fade-in duration-200">
                  <div className="p-2 bg-rose-200/70 text-rose-700 rounded-xl shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-black text-rose-950 leading-relaxed">
                    {checkEmailUniquenessAcrossSystem(customEmail, editingId || undefined, profiles).errorMessage}
                  </p>
                </div>
              )}

              {/* 🛡️ صندوق معايير وشروط كلمة المرور الأكاديمية */}
              {customPassword && (
                <div className="col-span-1 sm:col-span-12">
                  <AcademicPasswordStrengthBox password={customPassword} />
                </div>
              )}

            </div>
          </div>

          {/* 📌 فوتر الكارد العائم الثابت في الأسفل */}
          <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-slate-200 bg-slate-50/95 shrink-0 z-30">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl text-sm transition cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={Boolean(customEmail.trim() && !checkEmailUniquenessAcrossSystem(customEmail, editingId || undefined, profiles).isUnique)}
              className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm shadow-xs transition flex items-center gap-2 cursor-pointer border border-[#0F2942] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserCheck className="w-4 h-4 text-cyan-200" />
              <span>{editingId ? 'حفظ التعديلات' : 'توليد الحساب وربطه بالقسم'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default DepartmentHeadModal; // 🚀 تصدير المكون كافتراضي
