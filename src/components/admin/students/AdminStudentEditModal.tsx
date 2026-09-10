'use client'; // ⚡ ينفذ على جهة العميل بمتصفح المستخدم

// ✏️ مكون كارد تعديل بيانات وحساب الطالب الأكاديمي
// 🇮🇶 توثيق عراقي سطر بسطر والتزام نمطي صارم بدون any أو unknown

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import {
  Edit3, Sparkles, Building2, GraduationCap, Sun, Moon,
  Mail, Key, Eye, EyeOff, RefreshCw, ChevronDown, Check,
  AlertCircle, AlertTriangle, ShieldCheck, Users, UserCheck
} from 'lucide-react'; // 🎨 أيقونات لوسيد
import type { UserProfile, Department } from '@/types'; // 🏷️ استيراد الأنواع الرسمية
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 المودال العائم الفاخر
import { AcademicPasswordStrengthBox } from '@/components/AcademicPasswordStrengthBox'; // 🛡️ صندوق قوة كلمة المرور الموحد
import { generateStrongUniqueEmail, generateStrongPassword } from '@/lib/mock-data'; // 💾 مولدات الحسابات
import { checkEmailUniquenessAcrossSystem } from '@/lib/validation-utils'; // 🛡️ فحص فرادة البريد

// 📋 واجهة خصائص مودال تعديل بيانات الطالب
export interface AdminStudentEditModalProps {
  editingStudent: UserProfile | null; // 👤 الطالب قيد التعديل
  setEditingStudent: (s: UserProfile | null) => void; // 🔄 دالة إغلاق وتصفير التعديل
  handleEditStudentSubmit: (e: React.FormEvent) => void; // 💾 دالة حفظ التعديلات
  editWarningError: string; // ⚠️ رسالة الخطأ
  setEditWarningError: (err: string) => void; // 🔄 دالة تحديث الخطأ
  editName: string; // 👤 اسم الطالب
  setEditName: (name: string) => void; // 🔄 دالة تحديث الاسم
  editGender: 'male' | 'female'; // 🚻 جنس الطالب
  setEditGender: (g: 'male' | 'female') => void; // 🔄 دالة تحديث الجنس
  editDeptId: string; // 🏢 معرف القسم
  setEditDeptId: (id: string) => void; // 🔄 دالة تحديث القسم
  departments: Department[]; // 🏢 قائمة الأقسام
  isEditDeptDropdownOpen: boolean; // 🔽 فتح منسدلة القسم
  setIsEditDeptDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 دالة تبديل فتح المنسدلة
  editDeptDropdownRef: React.RefObject<HTMLDivElement | null>; // 📍 مرجع منسدلة القسم
  editStageNum: number; // 🎓 رقم المرحلة
  setEditStageNum: (stage: number) => void; // 🔄 دالة تحديث المرحلة
  isEditStageDropdownOpen: boolean; // 🔽 فتح منسدلة المرحلة
  setIsEditStageDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 دالة تبديل فتح منسدلة المرحلة
  editStageDropdownRef: React.RefObject<HTMLDivElement | null>; // 📍 مرجع منسدلة المرحلة
  editEmail: string; // ✉️ البريد الأكاديمي
  setEditEmail: (email: string) => void; // 🔄 دالة تحديث البريد
  editPassword: string; // 🔑 كلمة المرور
  setEditPassword: (pass: string) => void; // 🔄 دالة تحديث كلمة المرور
  showStudentPassword: boolean; // 👁️ إظهار كلمة المرور
  setShowStudentPassword: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 دالة تبديل إظهار الرمز
  profiles: UserProfile[]; // 👥 قائمة كافة الحسابات
}

// 🏛️ مكون نافذة تعديل بيانات الطالب
export const AdminStudentEditModal: React.FC<AdminStudentEditModalProps> = ({
  editingStudent,
  setEditingStudent,
  handleEditStudentSubmit,
  editWarningError,
  setEditWarningError,
  editName,
  setEditName,
  editGender,
  setEditGender,
  editDeptId,
  setEditDeptId,
  departments,
  isEditDeptDropdownOpen,
  setIsEditDeptDropdownOpen,
  editDeptDropdownRef,
  editStageNum,
  setEditStageNum,
  isEditStageDropdownOpen,
  setIsEditStageDropdownOpen,
  editStageDropdownRef,
  editEmail,
  setEditEmail,
  editPassword,
  setEditPassword,
  showStudentPassword,
  setShowStudentPassword,
  profiles,
}) => {
  if (!editingStudent) return null;

  return (
        <FloatingCrudModal
          title={`تعديل بيانات الطالب: ${editingStudent.full_name}`}
          subtitle="تعديل الاسم والجنس والبريد وكلمة المرور والقسم والمرحلة"
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          icon={<Edit3 className="w-6 h-6 text-indigo-700" />}
          maxWidth="max-w-3xl"
          onSubmit={handleEditStudentSubmit}
          footer={
            <>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-5 py-2.5 bg-slate-100 text-slate-950 font-black rounded-xl text-sm border border-slate-300 cursor-pointer hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm shadow-md cursor-pointer border border-[#1e4570] active:scale-95"
              >
                حفظ التعديلات
              </button>
            </>
          }
        >
          <div className="space-y-4 text-right">
            {editWarningError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-black flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{editWarningError}</span>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-black text-slate-950 mb-1.5">الاسم الكامل</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full p-3.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-950 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* اختيار القسم للتعديل */}
              <div className="relative" ref={editDeptDropdownRef}>
                <label className="block text-sm font-black text-slate-950 mb-1.5">القسم العلمي</label>
                <button
                  type="button"
                  onClick={() => setIsEditDeptDropdownOpen(!isEditDeptDropdownOpen)}
                  className={`w-full p-3.5 bg-slate-50 hover:bg-slate-100 border-2 rounded-xl text-slate-950 font-black text-sm flex items-center justify-between transition cursor-pointer ${
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

              {/* اختيار المرحلة للتعديل */}
              <div className="relative" ref={editStageDropdownRef}>
                <label className="block text-sm font-black text-slate-950 mb-1.5">المرحلة الدراسية</label>
                <button
                  type="button"
                  onClick={() => setIsEditStageDropdownOpen(!isEditStageDropdownOpen)}
                  className={`w-full p-3.5 bg-slate-50 hover:bg-slate-100 border-2 rounded-xl text-slate-950 font-black text-sm flex items-center justify-between transition cursor-pointer ${
                    isEditStageDropdownOpen ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-700 shrink-0" />
                    <span>
                      {editStageNum === 1 ? 'المرحلة الأولى' : editStageNum === 2 ? 'المرحلة الثانية' : editStageNum === 3 ? 'المرحلة الثالثة' : 'المرحلة الرابعة'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform ${isEditStageDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isEditStageDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 text-right">
                    {[
                      { key: 1, label: 'المرحلة الأولى 1️⃣' },
                      { key: 2, label: 'المرحلة الثانية 2️⃣' },
                      { key: 3, label: 'المرحلة الثالثة 3️⃣' },
                      { key: 4, label: 'المرحلة الرابعة 4️⃣' },
                    ].map((stg) => {
                      const isSelected = editStageNum === stg.key;
                      return (
                        <button
                          key={stg.key}
                          type="button"
                          onClick={() => {
                            setEditStageNum(stg.key);
                            setIsEditStageDropdownOpen(false);
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
              <label className="block text-sm font-black text-slate-950 mb-1.5">الجنس (النوع الاجتماعي)</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEditGender('male')}
                  className={`p-3 rounded-xl border text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                    editGender === 'male'
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>ذكر (طالب)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditGender('female')}
                  className={`p-3 rounded-xl border text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                    editGender === 'female'
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-5 h-5" />
                  <span>أنثى (طالبة)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-sm font-black text-slate-950">البريد الأكاديمي</label>
                  <button
                    type="button"
                    onClick={() => setEditEmail(generateStrongUniqueEmail('st', profiles))}
                    className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-md text-xs font-black flex items-center gap-1 transition cursor-pointer"
                    title="توليد بريد أكاديمي جديد غير مكرر"
                  >
                    <RefreshCw className="w-3 h-3 text-indigo-700" />
                    <span>توليد بريد فريد</span>
                  </button>
                </div>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => {
                    setEditEmail(e.target.value);
                    setEditWarningError('');
                  }}
                  className="w-full p-3.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-950 focus:border-indigo-600 focus:outline-none"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-sm font-black text-slate-950">كلمة المرور الجديدة</label>
                  <button
                    type="button"
                    onClick={() => setEditPassword(generateStrongPassword(profiles))}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-md text-xs font-black flex items-center gap-1 transition cursor-pointer"
                    title="توليد رمز سري قوي عشوائي جديد غير مكرر"
                  >
                    <Key className="w-3 h-3 text-emerald-700" />
                    <span>توليد رمز عشوائي قوي</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="اتركه فارغاً للإبقاء على الحالية"
                  className="w-full p-3.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-950 focus:border-indigo-600 focus:outline-none"
                  dir="ltr"
                />
              </div>

              {/* ⚠️ شريط تنبيه فرادة البريد يمتد بكامل عرض الكارد بحجم خط متوسط وأيقونة SVG نقية */}
              {editEmail.trim() && editingStudent && !checkEmailUniquenessAcrossSystem(editEmail, editingStudent.id, profiles).isUnique && (
                <div className="col-span-1 sm:col-span-2 p-3 sm:p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center gap-3 text-rose-950 shadow-xs animate-in fade-in duration-200">
                  <div className="p-2 bg-rose-200/70 text-rose-700 rounded-xl shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-black text-rose-950 leading-relaxed">
                    {checkEmailUniquenessAcrossSystem(editEmail, editingStudent.id, profiles).errorMessage}
                  </p>
                </div>
              )}

            </div>

            {/* 🛡️ صندوق معايير وشروط كلمة المرور الأكاديمية التفاعلي الموحد */}
            {editPassword && (
              <AcademicPasswordStrengthBox password={editPassword} />
            )}

          </div>
        </FloatingCrudModal>

  );
};
