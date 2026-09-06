'use client'; // ⚡ تمكين العمل في بيئة العميل التفاعلية

// 🛡️ مكون صندوق معايير كلمة المرور الأكاديمية التفاعلي الموحد
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان | مسار بولونيا
import React from 'react'; // ⚛️ استيراد مكتبة رياكت
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'; // 🎨 أيقونات SVG برمجية نقية
import { evaluatePasswordCriteria } from '@/lib/validation-utils'; // 🔍 استيراد دالة الفحص المركزية

// 📋 واجهة خصائص المكون
interface AcademicPasswordStrengthBoxProps {
  password: string; // 🔑 كلمة المرور المطلوب تقييمها
  className?: string; // 🎨 كلاسات إضافية اختيارية
}

// 🛡️ المكون البرمجي لصندوق معايير كلمة المرور بحجم متوسط متناسق
export function AcademicPasswordStrengthBox({ password, className = '' }: AcademicPasswordStrengthBoxProps) {
  // 🚫 إذا كان حقل كلمة المرور فارغاً لا يتم عرض الصندوق
  if (!password || !password.trim()) {
    return null;
  }

  // 🔍 تقييم كلمة المرور عبر الدالة المركزية
  const { hasMinLength, hasUpper, hasNumber, hasSpecial, score, strengthLabel } = evaluatePasswordCriteria(password);

  return (
    <div className={`p-4 sm:p-5 bg-slate-50 border border-slate-300 rounded-2xl space-y-3.5 animate-in fade-in duration-200 ${className}`}>
      {/* 🏷️ رأس الصندوق: العنوان والشارة التقييمية */}
      <div className="flex items-center justify-between">
        <div className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-700 shrink-0" />
          <span>شروط ومعايير كلمة المرور الأكاديمية:</span>
        </div>
        
        {/* ⭐ شارة التقييم بلون متناسق وبحجم متوسط */}
        <span className={`text-xs sm:text-sm font-black px-3.5 py-1 rounded-xl border shadow-xs ${
          score === 100 
            ? 'bg-emerald-100 text-emerald-950 border-emerald-300' 
            : score >= 50 
              ? 'bg-sky-100 text-sky-950 border-sky-300' 
              : 'bg-rose-100 text-rose-950 border-rose-300'
        }`}>
          {strengthLabel}
        </span>
      </div>

      {/* 📊 شريط مؤشر القوة البصري التفاعلي */}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            score === 100 
              ? 'bg-emerald-600' 
              : score >= 50 
                ? 'bg-sky-500' 
                : 'bg-rose-500'
          }`} 
          style={{ width: `${score}%` }}
        />
      </div>

      {/* 🧩 بطاقات الشروط الأربعة بأيقونات SVG برمجية نقية */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs sm:text-sm font-black">
        {/* 1️⃣ شرط الطول 8 خانات */}
        <div className={`p-2.5 sm:p-3 rounded-2xl border flex items-center gap-2 font-black shadow-2xs ${
          hasMinLength ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
        }`}>
          {hasMinLength ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />}
          <span>8 خانات فأكثر</span>
        </div>

        {/* 2️⃣ شرط الحرف الكبير */}
        <div className={`p-2.5 sm:p-3 rounded-2xl border flex items-center gap-2 font-black shadow-2xs ${
          hasUpper ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
        }`}>
          {hasUpper ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />}
          <span>حرف كبير (A-Z)</span>
        </div>

        {/* 3️⃣ شرط الرقم */}
        <div className={`p-2.5 sm:p-3 rounded-2xl border flex items-center gap-2 font-black shadow-2xs ${
          hasNumber ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
        }`}>
          {hasNumber ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />}
          <span>رقم (0-9)</span>
        </div>

        {/* 4️⃣ شرط الرمز الخاص */}
        <div className={`p-2.5 sm:p-3 rounded-2xl border flex items-center gap-2 font-black shadow-2xs ${
          hasSpecial ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
        }`}>
          {hasSpecial ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />}
          <span>رمز خاص (!@#$)</span>
        </div>
      </div>
    </div>
  );
}
