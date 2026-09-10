'use client'; // ⚡ ينفذ على جهة العميل بمتصفح المستخدم

// ✏️ مكون كارد تعديل بيانات وحساب الأستاذ الأكاديمي
// 🇮🇶 توثيق عراقي سطر بسطر والتزام نمطي صارم بدون any أو unknown

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import { Edit3, Sparkles, Building2, User, Mail, Key, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, AlertTriangle, RefreshCw, ChevronDown, Check } from 'lucide-react'; // 🎨 أيقونات لوسيد
import type { UserProfile, Department } from '@/types'; // 🏷️ استيراد الأنواع الرسمية
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 المودال العائم الفاخر
import { AcademicPasswordStrengthBox } from '@/components/AcademicPasswordStrengthBox'; // 🛡️ صندوق قوة كلمة المرور الموحد
import { generateStrongUniqueEmail, generateStrongPassword } from '@/lib/mock-data'; // 💾 مولدات البريد وكلمة المرور
import { checkEmailUniquenessAcrossSystem } from '@/lib/validation-utils'; // 🛡️ محرك فحص فرادة البريد الأكاديمي

// 📋 واجهة خصائص نافذة تعديل بيانات الأستاذ
export interface AdminTeacherEditModalProps {
  editingTeacher: UserProfile | null; // 👤 الأستاذ قيد التعديل حالياً أو null
  setEditingTeacher: (teacher: UserProfile | null) => void; // 🔄 دالة إغلاق وتصفير التعديل
  handleSaveTeacherEdit: (e: React.FormEvent) => void; // 💾 دالة حفظ التعديلات
  editTeacherError: string; // ⚠️ رسالة خطأ التعديل
  setEditTeacherError: (err: string) => void; // 🔄 دالة تحديث الخطأ
  editName: string; // 👤 اسم الأستاذ بالتعديل
  setEditName: (name: string) => void; // 🔄 دالة تحديث الاسم
  editGender: 'male' | 'female'; // 🚻 جنس الأستاذ بالتعديل
  setEditGender: (g: 'male' | 'female') => void; // 🔄 دالة تحديث الجنس
  editEmail: string; // ✉️ البريد الأكاديمي بالتعديل
  setEditEmail: (email: string) => void; // 🔄 دالة تحديث البريد
  editPassword: string; // 🔑 كلمة المرور بالتعديل
  setEditPassword: (pass: string) => void; // 🔄 دالة تحديث كلمة المرور
  editDeptId: string; // 🏢 معرف القسم بالتعديل
  setEditDeptId: (id: string) => void; // 🔄 دالة تحديث القسم
  departments: Department[]; // 🏢 قائمة كافة الأقسام
  isEditDeptDropdownOpen: boolean; // 🔽 فتح منسدلة القسم
  setIsEditDeptDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 دالة تبديل فتح المنسدلة
  editDeptDropdownRef: React.RefObject<HTMLDivElement | null>; // 📍 مرجع المنسدلة
  profiles: UserProfile[]; // 👥 قائمة كافة الحسابات
}

// 🏛️ مكون مودال تعديل بيانات الأستاذ
export const AdminTeacherEditModal: React.FC<AdminTeacherEditModalProps> = ({
  editingTeacher,
  setEditingTeacher,
  handleSaveTeacherEdit,
  editTeacherError,
  setEditTeacherError,
  editName,
  setEditName,
  editGender,
  setEditGender,
  editEmail,
  setEditEmail,
  editPassword,
  setEditPassword,
  editDeptId,
  setEditDeptId,
  departments,
  isEditDeptDropdownOpen,
  setIsEditDeptDropdownOpen,
  editDeptDropdownRef,
  profiles,
}) => {
  return (
    <FloatingCrudModal
        isOpen={!!editingTeacher}
        onClose={() => setEditingTeacher(null)}
        title="تعديل حساب وبريد ورمز الأستاذ"
        subtitle="تعديل البريد والرمز والقسم المعتمد وحفظ البيانات مباشرة في قاعدة البيانات"
        icon={<Edit3 className="w-6 h-6" />}
        onSubmit={handleSaveTeacherEdit}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditingTeacher(null)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl text-sm cursor-pointer border border-slate-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm shadow-md cursor-pointer border border-[#1e4570] active:scale-95"
            >
              حفظ وتثبيت التعديلات
            </button>
          </>
        }
      >
        <div className="space-y-4 text-sm font-black">
          {editTeacherError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-black flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{editTeacherError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-950 mb-1.5 font-black text-sm">الاسم الكامل للأستاذ</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-950 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <label className="block text-slate-950 font-black text-sm">البريد الأكاديمي</label>
                <button
                  type="button"
                  onClick={() => setEditEmail(generateStrongUniqueEmail('dr', profiles))}
                  className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-md text-xs font-black flex items-center gap-1 transition cursor-pointer"
                  title="توليد بريد أكاديمي جديد غير مكرر"
                >
                  <RefreshCw className="w-3 h-3 text-indigo-700" />
                  <span>توليد بريد فريد</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={editEmail}
                onChange={(e) => {
                  setEditEmail(e.target.value);
                  setEditTeacherError('');
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-950 text-sm focus:border-indigo-600 focus:outline-none"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-slate-950 mb-1.5 font-black text-sm">الجنس (النوع)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditGender('male')}
                  className={`py-2.5 px-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                    editGender === 'male'
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>ذكر (أستاذ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditGender('female')}
                  className={`py-2.5 px-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                    editGender === 'female'
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>أنثى (أستاذة)</span>
                </button>
              </div>
            </div>

            {/* ⚠️ شريط تنبيه فرادة البريد يمتد بكامل عرض الكارد بحجم خط متوسط وأيقونة SVG نقية */}
            {editEmail.trim() && editingTeacher && !checkEmailUniquenessAcrossSystem(editEmail, editingTeacher.id, profiles).isUnique && (
              <div className="col-span-1 md:col-span-3 p-3 sm:p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center gap-3 text-rose-950 shadow-xs animate-in fade-in duration-200">
                <div className="p-2 bg-rose-200/70 text-rose-700 rounded-xl shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-xs sm:text-sm font-black text-rose-950 leading-relaxed">
                  {checkEmailUniquenessAcrossSystem(editEmail, editingTeacher.id, profiles).errorMessage}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <label className="block text-slate-950 font-black text-sm">رمز الدخول / كلمة المرور</label>
                <button
                  type="button"
                  onClick={() => setEditPassword(generateStrongPassword(profiles))}
                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-md text-xs font-black flex items-center gap-1 transition cursor-pointer"
                  title="توليد رمز سري قوي عشوائي جديد غير مكرر"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-700" />
                  <span>توليد رمز عشوائي قوي</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-950 text-sm focus:border-indigo-600 focus:outline-none"
                dir="ltr"
              />
            </div>

            <div className="relative" ref={editDeptDropdownRef}>
              <label className="block text-slate-950 mb-1.5 font-black text-sm">القسم العلمي</label>
              <button
                type="button"
                onClick={() => setIsEditDeptDropdownOpen(!isEditDeptDropdownOpen)}
                className={`w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 border-2 rounded-xl text-slate-950 font-black text-sm flex items-center justify-between transition cursor-pointer ${
                  isEditDeptDropdownOpen ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-700 shrink-0" />
                  <span>{departments.find((d) => d.id === editDeptId)?.name || 'اختر قسماً'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform ${isEditDeptDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isEditDeptDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-right">
                  {departments.map((d) => {
                    const isSelected = editDeptId === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setEditDeptId(d.id);
                          setIsEditDeptDropdownOpen(false);
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

            {/* 🛡️ صندوق معايير وشروط كلمة المرور الأكاديمية التفاعلي الموحد */}
            {editPassword && (
              <div className="col-span-1 md:col-span-2">
                <AcademicPasswordStrengthBox password={editPassword} />
              </div>
            )}
          </div>

        </div>
      </FloatingCrudModal>

  );
};
