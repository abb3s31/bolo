'use client'; // ⚡ المكون يشتغل بجهة العميل في المتصفح

// 📇 نافذة / بطاقة الاعتماد الإداري الرسمية لرئيس القسم أو المقرر
import React from 'react'; // 🔗 استيراد مكتبة رياكت
import { QrCode, X, Building2, UserCheck, Printer, Check, Copy } from 'lucide-react'; // 🎨 استيراد أيقونات التفاعل SVG
import { UserProfile } from '@/types'; // 🔗 استيراد واجهة بيانات المستخدم الصارمة

// 📋 واجهة خصائص مودال بطاقة الاعتماد الإداري
interface DepartmentHeadCardModalProps {
  profile: UserProfile; // 👤 بيانات المسؤول الأكاديمي المختار
  onClose: () => void; // ❌ دالة إغلاق النافذة المنبثقة
  onPrint: (profile: UserProfile) => void; // 🖨️ دالة فتح نافذة الطباعة المباشرة للبطاقة
  onCopyCredentials: (text: string, id: string) => void; // 📋 دالة نسخ بيانات الحساب للحافظة
  copiedId: string | null; // 🆔 معرف الحساب الذي تم نسخه لتأكيد النجاح
}

// 🪪 المكون الرئيسي لعرض كارد اعتماد الحساب
export default function DepartmentHeadCardModal({
  profile, // 👤 بيانات المسؤول
  onClose, // ❌ دالة الإغلاق
  onPrint, // 🖨️ دالة الطباعة
  onCopyCredentials, // 📋 دالة النسخ
  copiedId // 🆔 حالة النسخ
}: DepartmentHeadCardModalProps) {
  // 🌐 تحديد مسار المنصة الحالي بشكل آمن للعميل
  const currentOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://192.168.0.185:3000'; // 🌐 الرابط الجاري
  
  // 📄 نص بيانات الاعتماد الكاملة لنسخها للحافظة
  const credentialsText = `حساب إداري - جامعة الإمام جعفر الصادق (ع) فرع ميسان\nالاسم: ${profile.full_name}\nالدور: ${profile.role === 'department_head' ? 'رئيس قسم' : 'مقرر قسم'}\nالقسم: ${profile.department_name}\nالبريد: ${profile.generated_email}\nالرمز: ${profile.temp_password}\nرابط الدخول: ${currentOrigin}/admin`; // 📝 تجميع نص الحساب

  return (
    // 🌌 خلفية معتمة تملأ كامل الشاشة مع تأثير زجاجي ناعم
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
      {/* 📦 صندوق البطاقة الرئيسي الأبيض بحدود أنيقة */}
      <div className="bg-white text-slate-950 border border-slate-300 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-right">
        {/* 🏷️ هيدر النافذة مع الأيقونة وشعار الجامعة وزر الإغلاق */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          {/* 📌 الجزء الأيمن: أيقونة الباركود والعناوين */}
          <div className="flex items-center gap-3">
            {/* 🔲 أيقونة QR الأنيقة */}
            <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
              <QrCode className="w-6 h-6 text-indigo-700" />
            </div>
            {/* 📝 العناوين الرسمية */}
            <div>
              <h3 className="text-lg font-black text-slate-950">
                بطاقة بيانات الاعتماد الإداري الرسمية
              </h3>
              <p className="text-xs font-black text-slate-950">
                جامعة الإمام جعفر الصادق (ع) - فرع ميسان
              </p>
            </div>
          </div>
          {/* ❌ زر إغلاق النافذة */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // 🚪 استدعاء دالة الإغلاق
            className="p-2 text-slate-950 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer" // 🎨 التنسيق اللوني والتفاعلي
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 📊 شبكة عرض بيانات الحساب بالتفصيل */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-black">
          {/* 👤 حقل الاسم الكامل */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
            <span className="text-slate-950 text-xs font-black">الاسم الكامل:</span>
            <p className="text-slate-950 font-black text-base">{profile.full_name}</p>
          </div>

          {/* 🏛️ حقل الموقع الإداري والقسم الأكاديمي */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
            <span className="text-slate-950 text-xs font-black">الموقع والقسم:</span>
            <p className="text-slate-950 font-black text-sm flex items-center gap-1.5 mt-0.5">
              {profile.role === 'department_head' ? (
                <Building2 className="w-4 h-4 text-indigo-700 shrink-0" />
              ) : (
                <UserCheck className="w-4 h-4 text-slate-950 shrink-0" />
              )}
              <span>{profile.role === 'department_head' ? 'رئيس قسم' : 'مقرر قسم'} — {profile.department_name}</span>
            </p>
          </div>

          {/* ✉️ حقل البريد الإلكتروني الأكاديمي الرسمي */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
            <span className="text-slate-950 text-xs font-black">البريد الأكاديمي الإداري:</span>
            <p className="text-blue-950 font-black text-sm select-all font-mono" dir="ltr">{profile.generated_email}</p>
          </div>

          {/* 🔑 حقل كلمة المرور الأكاديمية المؤقتة */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
            <span className="text-slate-950 text-xs font-black">كلمة المرور الأكاديمية:</span>
            <p className="text-emerald-800 font-black text-sm select-all font-mono" dir="ltr">{profile.temp_password}</p>
          </div>
        </div>

        {/* 🔘 شريط أزرار التحكم السفلي للبطاقة */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-200">
          {/* ❌ زر الإغلاق العادي */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // 🚪 دالة الإغلاق
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl text-sm transition cursor-pointer border border-slate-300 hover:border-slate-400 shadow-2xs" // 🎨 التنسيق الجمالي
          >
            إغلاق
          </button>

          {/* 🖨️ زر طباعة بطاقة التسليم الفردية المباشرة */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={() => onPrint(profile)} // 🖨️ استدعاء دالة الطباعة المباشرة لهذا الحساب
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black transition flex items-center gap-2 cursor-pointer shadow-xs border border-[#1e4570]" // 🎨 كحلي ملكي
          >
            <Printer className="w-5 h-5 text-cyan-300" />
            <span>طباعة بطاقة التسليم</span>
          </button>

          {/* 📋 زر نسخ بيانات الحساب بالكامل للحافظة */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={() => onCopyCredentials(credentialsText, profile.id)} // 📋 استدعاء دالة النسخ
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black transition flex items-center gap-2 cursor-pointer shadow-xs border border-[#1e4570]" // 🎨 كحلي ملكي متناسق
          >
            {copiedId === profile.id ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-cyan-300" />}
            <span>{copiedId === profile.id ? 'تم نسخ البيانات!' : 'نسخ بيانات الحساب بالكامل'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
