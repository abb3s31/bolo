'use client'; // ⚡ ينفذ بجهة العميل في المتصفح

// 📘 مودال تعليمات وضوابط نموذج Excel لرؤساء الأقسام والمقررين
import React from 'react'; // 🔗 مكتبة رياكت
import { 
  BookOpen, 
  CheckCircle2, 
  Download, 
  FileSpreadsheet, 
  UserCheck, 
  ShieldCheck 
} from 'lucide-react'; // 🎨 أيقونات التفاعل SVG
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 المكون العائم الفاخر

// 📋 واجهة خصائص مودال التعليمات
interface DepartmentHeadsExcelInstructionsModalProps {
  isOpen: boolean; // 🚪 حالة فتح أو إغلاق المودال
  onClose: () => void; // ❌ دالة إغلاق المودال
  onDownloadTemplate: () => void; // 📥 دالة تحميل نموذج الإكسل الرسمي
}

// 📦 المكون المستقل لعرض دليل وضوابط نموذج إكسل
export default function DepartmentHeadsExcelInstructionsModal({
  isOpen, // 🚪 حالة الفتح
  onClose, // ❌ دالة الإغلاق
  onDownloadTemplate // 📥 دالة التحميل
}: DepartmentHeadsExcelInstructionsModalProps) {
  return (
    // 📦 استخدام المودال العائم الفاخر
    <FloatingCrudModal
      isOpen={isOpen} // 🚪 ربط حالة الفتح
      onClose={onClose} // ❌ ربط دالة الإغلاق
      maxWidth="max-w-3xl" // 📏 العرض الأقصى للنافذة
      title="دليل وضوابط نموذج Excel لرؤساء الأقسام والمقررين" // 🏷️ عنوان النافذة
      subtitle="جامعة الإمام جعفر الصادق (ع) - فرع ميسان | مسار بولونيا والربط السحابي" // 🏛️ العنوان الفرعي
      icon={<BookOpen className="w-6 h-6 text-white" />} // 📖 أيقونة الهيدر
      footer={
        // 🔘 شريط التذييل السفلي للنافذة مع زر التحميل والإغلاق
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          {/* 🌟 شارة اعتماد النموذج الرسمي */}
          <span className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-2 bg-emerald-50 text-emerald-950 px-3.5 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>نموذج رسمي معتمد وجاهز للاستيراد الفوري</span>
          </span>
          {/* 🔘 أزرار الإجراءات */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* 📥 زر تحميل النموذج الرسمي */}
            <button
              type="button" // 🔘 نوع الزر
              onClick={onDownloadTemplate} // 📥 استدعاء دالة تنزيل الملف
              className="px-5 py-2 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#1e4570]" // 🎨 كحلي ملكي
            >
              <Download className="w-4 h-4 text-cyan-300" />
              <span>تحميل النموذج المعتمد</span>
            </button>
            {/* 🚪 زر الإغلاق العادي */}
            <button
              type="button" // 🔘 نوع الزر
              onClick={onClose} // ❌ إغلاق
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl cursor-pointer border border-slate-300 text-sm transition" // 🎨 ستايل ثانوي
            >
              إغلاق
            </button>
          </div>
        </div>
      }
    >
      {/* 📄 المحتوى الداخلي للتعليمات */}
      <div className="space-y-4 text-sm font-black">
        {/* 🌟 شبكة بطاقات التعليمات الأكاديمية المنظمة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* 📑 كارد 1: هيكلية ورقتي العمل */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-indigo-950 border-b border-slate-200 pb-2">
              <div className="p-2 bg-indigo-100 text-indigo-900 rounded-xl">
                <FileSpreadsheet className="w-4 h-4 text-indigo-800" />
              </div>
              <h4 className="text-sm font-black text-slate-950">1. ورقتي العمل بالملف (Sheets):</h4>
            </div>
            <p className="text-xs sm:text-sm font-black text-slate-950 leading-relaxed">
              يحتوي ملف الإكسل على ورقتين رئيسيتين: ورقة بيانات القيادات لتعبئتها، وورقة إرشادية تتضمن قائمة الأقسام العلمية الـ 12 المعتمدة مع أكوادها.
            </p>
          </div>

          {/* ✍️ كارد 2: حقول الأسماء الأكاديمية */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-emerald-950 border-b border-slate-200 pb-2">
              <div className="p-2 bg-emerald-100 text-emerald-900 rounded-xl">
                <UserCheck className="w-4 h-4 text-emerald-800" />
              </div>
              <h4 className="text-sm font-black text-slate-950">2. الاسم واللقب الأكاديمي:</h4>
            </div>
            <p className="text-xs sm:text-sm font-black text-slate-950 leading-relaxed">
              عمود الاسم الثلاثي فارغ تماماً لتعبئته مباشرة بأسماء الدكاترة والأساتذة (مثال: أ.د. علي حسين الموسوي) بدون الحاجة لمسح أي أسماء تجريبية.
            </p>
          </div>

          {/* 🔑 كارد 3: الحسابات الموحدة المشفرة */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-blue-950 border-b border-slate-200 pb-2">
              <div className="p-2 bg-blue-100 text-blue-900 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-blue-800" />
              </div>
              <h4 className="text-sm font-black text-slate-950">3. البريد وكلمة المرور:</h4>
            </div>
            <p className="text-xs sm:text-sm font-black text-slate-950 leading-relaxed">
              مولدة مسبقاً لكل قسم برموز مشفرة ومعقدة وفريدة تماماً (@sadiq.edu.iq) وتمنع التكرار نهائياً لضمان أعلى مستويات الأمان الجامعي.
            </p>
          </div>

          {/* 🛡️ كارد 4: نظام فحص واستيراد البيانات */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-950 border-b border-slate-200 pb-2">
              <div className="p-2 bg-[#0F2942] text-cyan-300 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-cyan-300" />
              </div>
              <h4 className="text-sm font-black text-slate-950">4. التدقيق ومنع التكرار:</h4>
            </div>
            <p className="text-xs sm:text-sm font-black text-slate-950 leading-relaxed">
              عند رفع واستيراد الملف، يتم فحص السجلات تلقائياً ومطابقتها مع قاعدة بيانات Supabase وعرض تقرير بالمدخلات المعتمدة ورفض أي تكرار.
            </p>
          </div>
        </div>
      </div>
    </FloatingCrudModal>
  );
}
