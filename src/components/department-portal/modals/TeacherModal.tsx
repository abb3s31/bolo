'use client'; // ⚡ واجهة تفاعلية على متصفح العميل

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import {
  Edit3, // ✏️ أيقونة التعديل
  UserPlus, // 👤 أيقونة إضافة أستاذ جديد
  Plus, // ➕ أيقونة الحفظ والإضافة
  Sparkles, // ✨ أيقونة التوليد التلقائي للبيانات
  Building2, // 🏢 أيقونة القسم العلمي
  AlertTriangle, // ⚠️ أيقونة التنبيه
  Key, // 🔑 أيقونة كلمة المرور
  Eye, // 👁️ أيقونة إظهار كلمة المرور
  EyeOff, // 🙈 أيقونة إخفاء كلمة المرور
  ShieldCheck, // 🛡️ أيقونة أمان كلمة المرور
  CheckCircle2, // ✅ أيقونة تحقق المعيار بنجاح
  AlertCircle, // ℹ️ أيقونة المعيار غير المكتمل
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { UserProfile } from '@/types'; // 🏷️ استيراد الأنواع الصارمة
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 المودال العائم الفاخر
import { generateStrongUniqueEmail, generateStrongPassword } from '@/lib/mock-data'; // 💾 مولدات البريد والرمز الأكاديمي
import { checkEmailUniquenessAcrossSystem } from '@/lib/validation-utils'; // 🛡️ التحقق من فرادة البريد الأكاديمي

// 📋 واجهة خصائص مودال إضافة وتعديل بيانات الأستاذ الأكاديمي
export interface TeacherModalProps {
  isOpen: boolean; // 📂 حالة ظهور النافذة
  onClose: () => void; // 🛑 دالة إغلاق النافذة
  editingTeacherId: string | null; // ✍️ معرف الأستاذ الجاري تعديله أو null للإضافة
  deptName: string; // 🏢 اسم القسم العلمي التابع له
  teacherName: string; // 👤 الاسم الكامل للأستاذ
  setTeacherName: (name: string) => void; // 🔄 دالة تحديث اسم الأستاذ
  nameError: string; // ⚠️ رسالة خطأ الاسم في حال تركه فارغاً
  setNameError: (error: string) => void; // 🔄 دالة تصفير أو تحديث خطأ الاسم
  teacherGender: 'male' | 'female' | null; // 🚻 جنس الأستاذ (ذكر أو أنثى)
  setTeacherGender: (gender: 'male' | 'female' | null) => void; // 🔄 دالة تحديد الجنس
  customTeacherEmail: string; // ✉️ البريد الأكاديمي المخصص أو المولد
  setCustomTeacherEmail: (email: string) => void; // 🔄 دالة تحديث البريد
  customTeacherPassword: string; // 🔑 كلمة المرور المخصصة أو المولدة
  setCustomTeacherPassword: (password: string) => void; // 🔄 دالة تحديث كلمة المرور
  showTeacherPassword: boolean; // 👁️ حالة إظهار أو إخفاء كلمة المرور بنجوم
  setShowTeacherPassword: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 دالة تبديل إظهار كلمة المرور
  passwordCriteria: { length: boolean; hasUpper: boolean; hasNumber: boolean; hasSpecial: boolean }; // 🔐 مؤشرات استيفاء معايير الرمز
  passwordStrengthScore: number; // 📊 درجة قوة الرمز السري من 100
  profiles: UserProfile[]; // 👥 مصفوفة كافة الحسابات للتحقق من منع تكرار البريد
  onSave: (e: React.FormEvent) => void; // 💾 دالة حفظ وتخزين حساب الأستاذ
  onAutoGenerateCredentials: () => void; // ⚡ دالة توليد بيانات الدخول تلقائياً
}

// 🏛️ مكون النافذة المنبثقة لإضافة وتعديل بيانات وحسابات الأساتذة
export const TeacherModal: React.FC<TeacherModalProps> = ({
  isOpen, // 📂 حالة الفتح
  onClose, // 🛑 دالة الإغلاق
  editingTeacherId, // ✍️ معرف الأستاذ
  deptName, // 🏢 اسم القسم
  teacherName, // 👤 الاسم
  setTeacherName, // 🔄 تحديث الاسم
  nameError, // ⚠️ خطأ الاسم
  setNameError, // 🔄 تحديث خطأ الاسم
  teacherGender, // 🚻 الجنس
  setTeacherGender, // 🔄 تحديد الجنس
  customTeacherEmail, // ✉️ البريد
  setCustomTeacherEmail, // 🔄 تحديث البريد
  customTeacherPassword, // 🔑 الرمز
  setCustomTeacherPassword, // 🔄 تحديث الرمز
  showTeacherPassword, // 👁️ إظهار الرمز
  setShowTeacherPassword, // 🔄 تبديل إظهار الرمز
  passwordCriteria, // 🔐 المعايير
  passwordStrengthScore, // 📊 القوة
  profiles, // 👥 الحسابات
  onSave, // 💾 دالة الحفظ
  onAutoGenerateCredentials, // ⚡ التوليد
}) => {
  // 🛑 إذا كانت النافذة مغلقة لا نرسم شيئاً
  if (!isOpen) return null;

  return (
    // 📝 كارت CRUD عائم فوق الكل بخلفية زجاجية كاملة
    <FloatingCrudModal
      isOpen={isOpen} // 📂 تمرير حالة الظهور
      onClose={onClose} // 🛑 تمرير دالة الإغلاق
      title={editingTeacherId ? 'تعديل بيانات الأستاذ الأكاديمي' : 'إضافة أستاذ جديد وتوليد الحساب الأكاديمي'} // 🏷️ العنوان
      subtitle={editingTeacherId ? `تعديل بيانات الحساب للأستاذ في قسم ${deptName}` : `سيتم توليد البريد الأكاديمي وكلمة المرور وحفظ الحساب بقسم ${deptName} فورياً`} // 📝 الوصف
      icon={editingTeacherId ? <Edit3 className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />} // 🎨 الأيقونة التعبيرية
      maxWidth="max-w-3xl" // 📏 عرض المودال
      onSubmit={onSave} // 💾 دالة الإرسال
      footer={
        <>
          {/* 🛑 زر إلغاء العملية وإغلاق النافذة */}
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-2xl text-base transition cursor-pointer border border-slate-300"
          >
            إلغاء
          </button>
          {/* 💾 زر الحفظ والاعتماد */}
          <button
            type="submit"
            className="px-7 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-md transition flex items-center gap-2 cursor-pointer border border-[#0F2942] active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>{editingTeacherId ? 'حفظ التعديلات' : 'إضافة وتوليد الحساب'}</span>
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
            className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black text-sm rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer whitespace-nowrap border border-[#0F2942] active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span>توليد بريد ورمز معقد تلقائياً</span>
          </button>
        </div>

        {/* 👤 حقل الاسم الكامل للأستاذ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-slate-950 font-black text-base">الاسم الكامل واللقب الأكاديمي *</label>
            {nameError && (
              <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 animate-pulse">
                {nameError}
              </span>
            )}
          </div>
          <input
            type="text"
            required
            value={teacherName}
            onChange={(e) => {
              setTeacherName(e.target.value);
              if (nameError) setNameError('');
            }}
            placeholder="مثال: أ.د. كرار جاسم المحمداوي..."
            className={`w-full px-4 py-3.5 bg-slate-50 border rounded-2xl text-slate-950 font-black text-base focus:outline-none shadow-2xs placeholder:text-slate-400 placeholder:font-bold ${
              nameError ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-300 focus:border-slate-900'
            }`}
          />
        </div>

        {/* 🏛️ شبكة معلومات القسم والجنس */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-slate-950 font-black text-base">القسم العلمي الأكاديمي:</label>
            <div className="px-4 py-3.5 bg-slate-100 border border-slate-300 rounded-2xl text-slate-950 font-black text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-700" />
              <span>{deptName}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-slate-950 font-black text-base">الجنس (اللقب والصفة):</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTeacherGender('male')}
                className={`py-3 px-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  teacherGender === 'male'
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm ring-2 ring-[#0F2942]/30'
                    : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100 hover:border-[#0F2942]'
                }`}
              >
                <span>ذكر (أستاذ)</span>
              </button>
              <button
                type="button"
                onClick={() => setTeacherGender('female')}
                className={`py-3 px-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  teacherGender === 'female'
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm ring-2 ring-[#0F2942]/30'
                    : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100 hover:border-[#0F2942]'
                }`}
              >
                <span>أنثى (أستاذة)</span>
              </button>
            </div>
            {teacherGender === null && (
              <p className="text-xs font-bold text-rose-600 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>يرجى اختيار جنس الأستاذ (ذكر أو أنثى)</span>
              </p>
            )}
          </div>
        </div>

        {/* ✉️ حقل البريد الأكاديمي المخصص و 🔑 حقل كلمة المرور */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* البريد الأكاديمي */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-950 font-black text-sm">
                البريد الأكاديمي (اختياري - يترك فارغاً للتوليد)
              </label>
              <button
                type="button"
                onClick={() => setCustomTeacherEmail(generateStrongUniqueEmail('dr', profiles))}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                title="توليد بريد أكاديمي رسمي فريد للأستاذ"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                <span>توليد بريد فريد</span>
              </button>
            </div>
            <input
              type="text"
              value={customTeacherEmail}
              onChange={(e) => setCustomTeacherEmail(e.target.value)}
              placeholder="مثال: dr.karrar@sadiq.edu.iq"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-950 font-black text-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none shadow-2xs font-mono"
              dir="ltr"
            />
            {customTeacherEmail.trim() && !checkEmailUniquenessAcrossSystem(customTeacherEmail, editingTeacherId || undefined, profiles).isUnique && (
              <div className="p-2 bg-rose-50 border border-rose-300 rounded-xl text-xs font-black text-rose-950 flex items-center gap-1.5 mt-1.5 animate-in fade-in duration-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{checkEmailUniquenessAcrossSystem(customTeacherEmail, editingTeacherId || undefined, profiles).errorMessage}</span>
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
                onClick={() => setCustomTeacherPassword(generateStrongPassword(profiles))}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                title="توليد رمز سري قوي عشوائي غير مكرر نهائياً"
              >
                <Key className="w-3.5 h-3.5 text-emerald-700" />
                <span>توليد رمز عشوائي قوي</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showTeacherPassword ? 'text' : 'password'}
                value={customTeacherPassword}
                onChange={(e) => setCustomTeacherPassword(e.target.value)}
                placeholder="مثال: Sadiq#Prof2026!"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-950 font-black text-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none shadow-2xs font-mono"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowTeacherPassword((prev) => !prev)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950 p-1.5 rounded-lg hover:bg-slate-200/70 transition cursor-pointer flex items-center justify-center"
                title={showTeacherPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                aria-label={showTeacherPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showTeacherPassword ? (
                  <EyeOff className="w-4.5 h-4.5 text-slate-700" />
                ) : (
                  <Eye className="w-4.5 h-4.5 text-slate-700" />
                )}
              </button>
            </div>
          </div>

        </div>

        {/* 🛡️ صندوق شروط ومعايير كلمة المرور التفاعلية */}
        <div className="p-4 bg-slate-50 border border-slate-300 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-700" />
              <span>شروط ومعايير كلمة المرور الأكاديمية:</span>
            </div>
            {customTeacherPassword && (
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                passwordStrengthScore === 100 
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-300' 
                  : passwordStrengthScore >= 50 
                    ? 'bg-sky-100 text-sky-950 border-sky-300' 
                    : 'bg-rose-100 text-rose-950 border-rose-300'
              }`}>
                {passwordStrengthScore === 100 ? 'رمز قوي ومثالي' : passwordStrengthScore >= 50 ? 'رمز متوسط' : 'رمز ضعيف'}
              </span>
            )}
          </div>

          {/* مؤشر القوة البصري */}
          {customTeacherPassword && (
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  passwordStrengthScore === 100 
                    ? 'bg-emerald-600' 
                    : passwordStrengthScore >= 50 
                      ? 'bg-sky-500' 
                      : 'bg-rose-500'
                }`} 
                style={{ width: `${passwordStrengthScore}%` }}
              />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-black">
            <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
              passwordCriteria.length ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
            }`}>
              {passwordCriteria.length ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              <span>8 خانات فأكثر</span>
            </div>

            <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
              passwordCriteria.hasUpper ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
            }`}>
              {passwordCriteria.hasUpper ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              <span>حرف كبير (A-Z)</span>
            </div>

            <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
              passwordCriteria.hasNumber ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
            }`}>
              {passwordCriteria.hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              <span>رقم (0-9)</span>
            </div>

            <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
              passwordCriteria.hasSpecial ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
            }`}>
              {passwordCriteria.hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              <span>رمز خاص (!@#$)</span>
            </div>
          </div>
        </div>

      </div>
    </FloatingCrudModal>
  );
};

export default TeacherModal; // 🚀 تصدير المكون الافتراضي
