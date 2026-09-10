'use client'; // ⚡ ينفذ بجهة العميل في المتصفح

// 🎛️ شريط التبويبات الأربعة لمادة الأستاذ بتصميم احترافي ملكي
import React from 'react'; // 🔗 مكتبة رياكت
import { BookOpen, CheckSquare, ClipboardList, History } from 'lucide-react'; // 🎨 أيقونات التفاعل SVG

// 📋 واجهة خصائص شريط التبويبات
interface CourseTabsBarProps {
  activeCourseTab: 'grades' | 'attendance' | 'audit' | 'assessments'; // 📑 التبويب النشط حالياً
  onTabChange: (tab: 'grades' | 'attendance' | 'audit' | 'assessments') => void; // 🔄 دالة تبديل التبويب
  gradesCount: number; // 🔢 عدد الطلاب في سجل الدرجات
  auditLogsCount: number; // 🔢 إجمالي عدد حركات التدقيق للمادة
}

// 📦 المكون المستقل لشريط تبويبات مادة التدريسي
export default function CourseTabsBar({
  activeCourseTab, // 📑 التبويب النشط
  onTabChange, // 🔄 دالة التبديل
  gradesCount, // 🔢 عدد الطلاب
  auditLogsCount // 🔢 عدد الحركات
}: CourseTabsBarProps) {
  return (
    // 🎛️ حاوية شبكة التبويبات الأربعة
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3 rounded-3xl border-2 border-slate-200 shadow-sm" dir="rtl">
      {/* 1. رصد وتقييم الدرجات */}
      <button
        type="button" // 🔘 نوع الزر
        onClick={() => onTabChange('grades')} // 🔄 تفعيل الدرجات
        className={`px-4 py-3.5 rounded-2xl text-base font-black transition-all cursor-pointer flex items-center justify-between gap-3 border-2 active:scale-95 shadow-xs ${
          activeCourseTab === 'grades'
            ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/20'
            : 'bg-slate-50 hover:bg-slate-100 text-slate-950 border-slate-200 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
            activeCourseTab === 'grades' ? 'bg-white/15 text-cyan-300' : 'bg-blue-100 text-blue-900'
          }`}>
            <BookOpen className="w-5 h-5" />
          </span>
          <span className="text-sm sm:text-base font-black">رصد وتقييم الدرجات</span>
        </div>
        <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black shrink-0 ${
          activeCourseTab === 'grades' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-950 border border-blue-200'
        }`}>
          {gradesCount} طالب
        </span>
      </button>

      {/* 2. تسجيل وإدارة الحضور والغياب */}
      <button
        type="button" // 🔘 نوع الزر
        onClick={() => onTabChange('attendance')} // 🔄 تفعيل الحضور
        className={`px-4 py-3.5 rounded-2xl text-base font-black transition-all cursor-pointer flex items-center justify-between gap-3 border-2 active:scale-95 shadow-xs ${
          activeCourseTab === 'attendance'
            ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/20'
            : 'bg-slate-50 hover:bg-slate-100 text-slate-950 border-slate-200 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
            activeCourseTab === 'attendance' ? 'bg-white/15 text-emerald-300' : 'bg-emerald-100 text-emerald-900'
          }`}>
            <CheckSquare className="w-5 h-5" />
          </span>
          <span className="text-sm sm:text-base font-black">إدارة الحضور والغياب</span>
        </div>
        <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black shrink-0 ${
          activeCourseTab === 'attendance' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-950 border border-emerald-200'
        }`}>
          15 أسبوعاً
        </span>
      </button>

      {/* 3. التكليفات والامتحانات الفصلية */}
      <button
        type="button" // 🔘 نوع الزر
        onClick={() => onTabChange('assessments')} // 🔄 تفعيل التكليفات
        className={`px-4 py-3.5 rounded-2xl text-base font-black transition-all cursor-pointer flex items-center justify-between gap-3 border-2 active:scale-95 shadow-xs ${
          activeCourseTab === 'assessments'
            ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/20'
            : 'bg-slate-50 hover:bg-slate-100 text-slate-950 border-slate-200 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
            activeCourseTab === 'assessments' ? 'bg-white/15 text-sky-300' : 'bg-sky-100 text-sky-900'
          }`}>
            <ClipboardList className="w-5 h-5" />
          </span>
          <span className="text-sm sm:text-base font-black">التكليفات والامتحانات</span>
        </div>
        <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black shrink-0 ${
          activeCourseTab === 'assessments' ? 'bg-white/20 text-white' : 'bg-sky-50 text-sky-950 border border-sky-200'
        }`}>
          أنشطة فصلية
        </span>
      </button>

      {/* 4. سجل العمليات والأمان */}
      <button
        type="button" // 🔘 نوع الزر
        onClick={() => onTabChange('audit')} // 🔄 تفعيل التدقيق
        className={`px-4 py-3.5 rounded-2xl text-base font-black transition-all cursor-pointer flex items-center justify-between gap-3 border-2 active:scale-95 shadow-xs ${
          activeCourseTab === 'audit'
            ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/20'
            : 'bg-slate-50 hover:bg-slate-100 text-slate-950 border-slate-200 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
            activeCourseTab === 'audit' ? 'bg-white/15 text-indigo-300' : 'bg-indigo-100 text-indigo-900'
          }`}>
            <History className="w-5 h-5" />
          </span>
          <span className="text-sm sm:text-base font-black">سجل العمليات والأمان</span>
        </div>
        <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black shrink-0 ${
          activeCourseTab === 'audit' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950 border border-slate-300'
        }`}>
          {auditLogsCount} عملية
        </span>
      </button>
    </div>
  );
}
