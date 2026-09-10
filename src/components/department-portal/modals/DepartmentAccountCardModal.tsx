'use client'; // ⚡ ينفذ على جهة العميل بالمتصفح

import React, { useState } from 'react'; // ⚛️ استيراد مكتبة ريآكت وخطاف إدارة الحالة المحلية
import {
  QrCode, // 🔲 أيقونة رمز الاستجابة السريعة QR
  X, // ❌ أيقونة إغلاق النافذة
  UserCheck, // 👤 أيقونة التدريسي المعتمد
  GraduationCap, // 🎓 أيقونة قبعة التخرج للطالب
  Check, // ✅ أيقونة علامة الصح عند نجاح النسخ
  Copy, // 📋 أيقونة نسخ البيانات للحافظة
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 تحويل رقم المرحلة إلى اسمها العربي المعتمد
import { UserProfile } from '@/types'; // 👤 استيراد واجهة الملف التعريفي للمستخدم

// 📋 واجهة خصائص نافذة بطاقة الحساب الأكاديمي الصادر
export interface DepartmentAccountCardModalProps {
  profile: UserProfile | null; // 👤 بيانات الملف التعريفي للأستاذ أو الطالب المراد عرض بطاقته
  deptName: string; // 🏢 اسم القسم الأكاديمي المعني
  onClose: () => void; // ❌ دالة إغلاق النافذة المنبثقة
}

// 📇 مكون بطاقة بيانات الحساب الأكاديمي الصادر المنبثقة
export const DepartmentAccountCardModal: React.FC<DepartmentAccountCardModalProps> = ({
  profile,
  deptName,
  onClose,
}) => {
  // 📋 حالة حفظ المعرف المنسوخ مؤقتاً لتغيير الأيقونة إلى علامة صح خضراء
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 🛡️ إذا لم يتم اختيار أي ملف تعريفي، لا يتم رسم أي شيء
  if (!profile) return null;

  // 📋 دالة نسخ بيانات الاعتماد الكاملة إلى الحافظة مع إشعار بصري مؤقت
  const handleCopyCredentials = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text); // 📝 كتابة النص في حافظة الجهاز
      setCopiedId(id); // 🎯 تفعيل أيقونة الصح الخضراء
      setTimeout(() => setCopiedId(null), 2000); // ⏱️ إعادة الأيقونة الأصلية بعد ثانيتين
    }
  };

  // 🌐 تحديد رابط البوابة الإلكترونية
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  // 📝 صياغة نص البطاقة الكاملة للنسخ السريع والمشاركة
  const cardSummaryText = `جامعة الإمام جعفر الصادق (ع) - فرع ميسان | قسم ${deptName}\nالاسم: ${profile.full_name}\nالصفة: ${profile.role === 'teacher' ? 'تدريسي' : `طالب - المرحلة ${getStageNameInArabic(profile.stage_number || 1)}`}\nالبريد الأكاديمي: ${profile.generated_email}\n${profile.temp_password ? `الرمز: ${profile.temp_password}\n` : ''}رابط المنصة: ${currentOrigin}`;

  return (
    <div 
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150" 
      dir="rtl"
    >
      <div className="bg-white text-slate-950 border border-slate-300 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-right">
        
        {/* 🏛️ رأس البطاقة الأكاديمية الرسمي */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl border border-blue-200 shadow-2xs">
              <QrCode className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-950">
                بطاقة بيانات الحساب الأكاديمي الصادر
              </h3>
              <p className="text-xs font-bold text-slate-700">
                جامعة الإمام جعفر الصادق (ع) - فرع ميسان | قسم {deptName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            title="إغلاق البطاقة"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 🔲 شبكة الحقول والمعلومات الأكاديمية */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-black">
          {/* 👤 الاسم الكامل */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
            <span className="text-slate-700 text-xs font-bold">الاسم الكامل:</span>
            <p className="text-slate-950 font-black text-base">{profile.full_name}</p>
          </div>

          {/* 🎓 الدور والقسم والمرحلة */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
            <span className="text-slate-700 text-xs font-bold">الصفة والمرحلة:</span>
            <p className="text-slate-950 font-black text-sm flex items-center gap-1.5 mt-0.5">
              {profile.role === 'teacher' ? (
                <>
                  <UserCheck className="w-4 h-4 text-indigo-700 shrink-0" />
                  <span>تدريسي — قسم {deptName}</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>طالب — المرحلة {getStageNameInArabic(profile.stage_number || 1)} ({profile.study_type === 'evening' ? 'الدراسة المسائية' : 'الدراسة الصباحية'})</span>
                </>
              )}
            </p>
          </div>

          {/* ✉️ البريد الأكاديمي */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
            <span className="text-slate-700 text-xs font-bold">البريد الأكاديمي المعتمد:</span>
            <p className="text-blue-950 font-black text-sm select-all font-mono" dir="ltr">{profile.generated_email}</p>
          </div>

          {/* 🔑 كلمة المرور الأكاديمية المؤقتة */}
          {profile.temp_password && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
              <span className="text-slate-700 text-xs font-bold">كلمة المرور الأكاديمية:</span>
              <p className="text-emerald-800 font-black text-sm select-all font-mono" dir="ltr">{profile.temp_password}</p>
            </div>
          )}
        </div>

        {/* 🔘 أزرار الإجراءات والفوتر */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl text-sm transition cursor-pointer"
          >
            إغلاق
          </button>

          <button
            type="button"
            onClick={() => handleCopyCredentials(cardSummaryText, profile.id)}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black transition flex items-center gap-2 cursor-pointer shadow-xs border border-[#0F2942] active:scale-95"
          >
            {copiedId === profile.id ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-cyan-300" />}
            <span>{copiedId === profile.id ? 'تم نسخ البيانات!' : 'نسخ البطاقة بالكامل'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default DepartmentAccountCardModal; // 🚀 تصدير المكون كافتراضي
