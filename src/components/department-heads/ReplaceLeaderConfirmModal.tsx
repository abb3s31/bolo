'use client'; // ⚡ تفعيل ميزات العميل التفاعلية في Next.js

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import {
  AlertCircle, // ⚠️ أيقونة التنبيه والتحذير الأمني
  RefreshCw, // 🔄 أيقونة الاستبدال والتأكيد
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { UserProfile } from '@/types'; // 🏷️ استيراد نوع مستخدم النظام

// 📋 واجهة بيانات نافذة تأكيد استبدال رئيس القسم أو المقرر
export interface ReplaceLeaderData {
  existingLeader: UserProfile; // 👤 المسؤول الحالي المشغول به المنصب
  roleTitle: string; // 🏷️ اسم المنصب بالعربية (رئيس قسم / مقرر قسم)
  deptName: string; // 🏢 اسم القسم الأكاديمي
  newProfileData: {
    fullName: string; // ✍️ اسم المسؤول الجديد
    role: 'department_head' | 'rapporteur'; // 🎭 المنصب
    deptId: string; // 🏢 معرف القسم
    email: string; // ✉️ البريد
    password: string; // 🔑 كلمة المرور
    gender: 'male' | 'female'; // 🚻 الجنس
  };
}

// 📋 واجهة خصائص مودال تأكيد استبدال القيادات
export interface ReplaceLeaderConfirmModalProps {
  data: ReplaceLeaderData | null; // 📦 بيانات الاستبدال أو null إذا المودال مغلق
  onClose: () => void; // 🛑 دالة إلغاء وإغلاق المودال
  onConfirm: (
    fullName: string,
    role: 'department_head' | 'rapporteur',
    deptId: string,
    email: string,
    password: string,
    gender: 'male' | 'female',
    replaceExistingId: string
  ) => void; // ⚡ دالة تنفيذ الاستبدال الفعلي
}

// ⚠️ مكون نافذة تأكيد استبدال رئيس القسم أو المقرر الحالي
export const ReplaceLeaderConfirmModal: React.FC<ReplaceLeaderConfirmModalProps> = ({
  data, // 📦 البيانات
  onClose, // 🛑 الإغلاق
  onConfirm, // ⚡ التأكيد
}) => {
  // 🛑 إذا ماكو بيانات استبدال لا نرندر شي
  if (!data) return null;

  return (
    // 🌌 غطاء التعتيم الخلفي للمودال
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-3 sm:p-6 overflow-hidden">
      {/* 📦 الصندوق الأبيض لمودال التأكيد */}
      <div className="bg-white border border-slate-300 rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] shadow-2xl flex flex-col space-y-5 animate-in zoom-in-95 duration-200 text-right overflow-y-auto overscroll-contain">
        
        {/* ⚠️ عنوان وتفاصيل الاستبدال */}
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-rose-100 text-rose-900 rounded-2xl shrink-0 border border-rose-300">
            <AlertCircle className="w-7 h-7 text-rose-700" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-950">
              تأكيد استبدال {data.roleTitle}
            </h3>
            <p className="text-sm font-bold text-slate-800 leading-relaxed">
              قسم <strong className="text-indigo-950 font-black font-extrabold">({data.deptName})</strong> لديه حالياً {data.roleTitle} وهو:
            </p>
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-950 font-black text-sm my-2">
              {data.existingLeader.full_name} ({data.existingLeader.generated_email})
            </div>
            <p className="text-sm font-bold text-slate-900 leading-relaxed">
              هل تريد استبداله وتعيين <strong className="text-emerald-800 font-black">({data.newProfileData.fullName})</strong> كـ {data.roleTitle} الجديد للقسم؟
            </p>
          </div>
        </div>

        {/* 🔘 أزرار الإلغاء والتأكيد */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl text-sm transition cursor-pointer"
          >
            إلغاء التغيير
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm(
                data.newProfileData.fullName,
                data.newProfileData.role,
                data.newProfileData.deptId,
                data.newProfileData.email,
                data.newProfileData.password,
                data.newProfileData.gender,
                data.existingLeader.id
              );
            }}
            className="px-6 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-black rounded-xl text-sm transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-indigo-200" />
            <span>نعم، استبدال وتعيين الجديد</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ReplaceLeaderConfirmModal; // 🚀 تصدير المكون كافتراضي
