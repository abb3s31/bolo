'use client'; // ⚡ ينفذ بجهة العميل في المتصفح

// 🏷️ مكون الهيدر وشريط الإجراءات السريعة والاستيراد لإدارة رؤساء الأقسام والمقررين
import React from 'react'; // 🔗 مكتبة رياكت
import Image from 'next/image'; // 🖼️ مكون تحسين الصور
import Link from 'next/link'; // 🔗 روابط التنقل السريعة
import { 
  ShieldCheck, 
  Calendar, 
  Layers, 
  FileSpreadsheet, 
  UserPlus, 
  Download, 
  Upload, 
  BookOpen, 
  Printer 
} from 'lucide-react'; // 🎨 أيقونات التفاعل SVG
import { getAcademicYear, formatAcademicYearDisplay } from '@/lib/mock-data'; // 📅 مساعد تنسيق العام الدراسي

// 📋 واجهة خصائص هيدر رؤساء الأقسام
interface DepartmentHeadsHeaderProps {
  departmentsCount: number; // 🔢 إجمالي عدد الأقسام الأكاديمية
  onOpenAddModal: () => void; // ➕ فتح نافذة إضافة رئيس أو مقرر جديد
  onDownloadTemplate: () => void; // 📥 تنزيل نموذج الإكسل الرسمي
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void; // 📤 معالجة ملف استيراد الإكسل
  isImportingExcel: boolean; // ⏳ حالة التحميل أثناء الاستيراد
  fileInputRef: React.RefObject<HTMLInputElement | null>; // 📁 مرجع عنصر رفع الملف
  onOpenExcelInstructions: () => void; // 📘 فتح نافذة دليل التعليمات
  onOpenPrintModal: () => void; // 🖨️ فتح نافذة طباعة بطاقات الاعتماد
}

// 🏛️ المكون الرئيسي لهيدر صفحة إدارة القيادات الأكاديمية
export default function DepartmentHeadsHeader({
  departmentsCount, // 🔢 عدد الأقسام
  onOpenAddModal, // ➕ إضافة
  onDownloadTemplate, // 📥 تحميل النموذج
  onImportExcel, // 📤 الاستيراد
  isImportingExcel, // ⏳ حالة الاستيراد
  fileInputRef, // 📁 مرجع الملف
  onOpenExcelInstructions, // 📘 دليل النموذج
  onOpenPrintModal // 🖨️ الطباعة
}: DepartmentHeadsHeaderProps) {
  return (
    // 🧱 حاوية الهيدر الرأسية
    <div className="space-y-6">
      {/* 🏛️ الهيدر الأبيض الإداري الترحيبي بحدود ناعمة */}
      <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* 📌 الجزء الأيمن: شعار الجامعة والعناوين والأوسمة */}
        <div className="flex items-center gap-4">
          {/* 🖼️ شعار جامعة الإمام جعفر الصادق الرسمية */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
            <Image src="/logo.webp" alt="جامعة الإمام جعفر الصادق" width={64} height={64} className="object-contain" priority />
          </div>
          {/* 📝 تفاصيل الصلاحية والعام الدراسي والعنوان */}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 font-black text-sm rounded-lg">
                صلاحية المسؤول العام
              </span>
              <span className="px-3 py-0.5 bg-indigo-50 text-indigo-950 border border-indigo-200 font-black text-sm rounded-lg flex items-center gap-1.5 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                <span>العام الدراسي <bdi dir="ltr">{formatAcademicYearDisplay(getAcademicYear())}</bdi></span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2 mt-1">
              <ShieldCheck className="w-6 h-6 text-slate-900" />
              <span>إدارة رؤساء الأقسام والمقررين (ربط القيادات بالـ {departmentsCount} قسماً)</span>
            </h1>
            <p className="text-sm text-slate-950 font-black mt-1">
              جامعة الإمام جعفر الصادق (ع) - فرع ميسان | تعيين وتعديل وحذف القيادات وربطهم بالأقسام
            </p>
          </div>
        </div>

        {/* 🔙 روابط العودة السريعة */}
        <div className="flex items-center gap-2">
          {/* 🏢 رابط إدارة الأقسام */}
          <Link
            href="/sadmin/departments"
            className="px-4 py-2 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black shadow-xs transition flex items-center gap-1.5 border border-[#1e4570]"
          >
            <Layers className="w-4 h-4 text-cyan-300" />
            <span>إدارة الأقسام ({departmentsCount})</span>
          </Link>

          {/* 📊 رابط لوحة التحكم الرئيسية */}
          <Link
            href="/sadmin/dashboard"
            className="px-4 py-2 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black shadow-xs transition flex items-center gap-1.5 border border-[#1e4570]"
          >
            <span>لوحة التحكم الرئيسية</span>
          </Link>
        </div>
      </div>

      {/* 📊 بطاقة إدارة ملفات Excel (تنزيل النموذج واستيراد البيانات) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
        {/* 🏷️ هيدر قسم إكسل */}
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-950">إدارة الاستيراد الجماعي عبر ملفات Excel الملونة والمنظمة</h3>
            <p className="text-sm text-slate-950 font-black mt-0.5">
              حقول الأسماء فارغة للبدء الفوري، مع بريد ورمز عشوائي فريد لكل منصب ومنع تام للتكرار
            </p>
          </div>
        </div>

        {/* 🔘 أزرار التنزيل والرفع وإضافة رئيس/مقرر جديد ودليل التعليمات والطباعة */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* ➕ زر إضافة رئيس قسم أو مقرر جديد */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={onOpenAddModal} // ➕ فتح المودال
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#0F2942]" // 🎨 كحلي
          >
            <UserPlus className="w-4 h-4 text-cyan-300" />
            <span>إضافة رئيس قسم أو مقرر جديد</span>
          </button>

          {/* 📥 زر تحميل نموذج إكسل المعتمد */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={onDownloadTemplate} // 📥 تنزيل النموذج
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#1e4570] active:scale-95" // 🎨 ستايل كحلي
          >
            <Download className="w-4 h-4 text-cyan-300" />
            <span>تحميل نموذج Excel المعتمد</span>
          </button>

          {/* 📤 زر استيراد ملف إكسل */}
          <label className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#1e4570] active:scale-95">
            <Upload className="w-4 h-4 text-cyan-300" />
            <span>{isImportingExcel ? 'جارٍ فحص واستيراد البيانات...' : 'استيراد ملف Excel للبيانات'}</span>
            <input
              ref={fileInputRef} // 📁 مرجع الملف
              type="file" // 📄 حقل رفع
              accept=".xlsx, .xls" // 📋 الامتدادات المدعومة
              onChange={onImportExcel} // ⚡ المعالجة عند الاختيار
              disabled={isImportingExcel} // 🔒 التعطيل أثناء العمل
              className="hidden" // 👁️ إخفاء العنصر التقليدي
            />
          </label>

          {/* 📘 زر دليل وتعليمات النموذج */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={onOpenExcelInstructions} // 📘 فتح التعليمات
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-sm font-black rounded-xl transition flex items-center gap-2 cursor-pointer border border-[#1e4570] shadow-xs active:scale-95" // 🎨 كحلي
          >
            <BookOpen className="w-4 h-4 text-cyan-300" />
            <span>دليل وضوابط النموذج</span>
          </button>

          {/* 🖨️ زر طباعة بطاقات الاعتماد الأكاديمي (الكل / حسب القسم) */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={onOpenPrintModal} // 🖨️ فتح نافذة الطباعة
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#1e4570] active:scale-95" // 🎨 كحلي متناسق
          >
            <Printer className="w-4 h-4 text-cyan-300" />
            <span>طباعة بطاقات الاعتماد (الكل / حسب القسم)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
