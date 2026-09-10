'use client'; // ⚡ تفعيل واجهة العميل التفاعلية في Next.js

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import Image from 'next/image'; // 🖼️ استيراد مكون الصور المحسن من Next.js
import { createPortal } from 'react-dom'; // 🚪 استيراد بورتال لعرض القوائم المنسدلة على مستوى الجسم
import {
  Building2, // 🏢 أيقونة القسم والصرح الجامعي
  ShieldCheck, // 🛡️ أيقونة الصلاحيات الإدارية
  Calendar, // 🗓️ أيقونة التقويم والعام الدراسي
  ChevronDown, // 🔽 أيقونة السهم للقوائم المنسدلة
  Check, // ✔️ أيقونة التحقق والاختيار
  FileText, // 📜 أيقونة ملفات ومقرر القسم
  Users, // 👥 أيقونة الكادر التدريسي
  GraduationCap, // 🎓 أيقونة طلبة القسم
  BookOpen, // 📖 أيقونة المواد الدراسية
  CheckCircle2, // ✅ أيقونة التنبيه الناجح
  AlertCircle, // ⚠️ أيقونة التنبيه بالخطأ
  X, // ❌ أيقونة إغلاق التنبيهات
  Layers, // 📚 أيقونة التكليفات
  FileSpreadsheet, // 📑 أيقونة سجل الدرجات
  Clock, // 🕒 أيقونة الجدول الأسبوعي
  ClipboardList, // 📋 أيقونة سجل الحضور والغياب
  CheckSquare, // ☑️ أيقونة تدقيق المهام والامتحانات
  CreditCard, // 💳 أيقونة الأقساط الدراسية
  BarChart3, // 📊 أيقونة الإحصائيات والتحليلات
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { Department, UserProfile } from '@/types'; // 🏷️ استيراد الأنواع الرسمية
import type { DepartmentAdminTab } from './types'; // 📑 استيراد نوع التبويبات المعتمدة من ملف الأنواع المحلي مباشرة

// 📋 واجهة إحداثيات القائمة المنسدلة لتبديل القسم
export interface DeptSwitcherCoords {
  top?: number; // 📐 المسافة من الأعلى
  bottom?: number; // 📐 المسافة من الأسفل
  left: number; // 📐 المسافة من اليسار
  width: number; // 📏 عرض القائمة
  maxHeight?: number; // 📏 أقصى ارتفاع مسموح
  openUpwards?: boolean; // ⬆️ فتح القائمة للأعلى عند ضيق المساحة
}

// 📋 واجهة خصائص هيدر وشريط تبويبات بوابة القسم الأكاديمي
export interface DepartmentPortalHeaderProps {
  currentDepartment: Department | null; // 🏢 بيانات القسم الحالي
  currentUser: UserProfile | null; // 👤 بيانات المستخدم الإداري الحالي
  academicYear: string; // 🗓️ العام الدراسي الحالي
  formatAcademicYearDisplay: (y: string) => string; // 🔤 دالة تنسيق عرض العام الدراسي
  deptName: string; // 🏛️ اسم القسم العلمي
  departments: Department[]; // 🏢 مصفوفة الأقسام المتاحة بالجامعة
  currentDeptId: string; // 🔑 معرف القسم الحالي
  setCurrentDeptId: (id: string) => void; // 🔄 دالة تغيير القسم المختار
  isDeptSwitcherDropdownOpen: boolean; // 📂 حالة فتح قائمة تبديل الأقسام
  setIsDeptSwitcherDropdownOpen: (open: boolean) => void; // 🔄 تحديث حالة القائمة
  deptSwitcherButtonRef: React.RefObject<HTMLButtonElement | null>; // 🔗 مرجع زر تبديل الأقسام
  handleToggleDeptSwitcherDropdown: () => void; // ⚡ دالة تبديل فتح وإغلاق القائمة
  deptSwitcherCoords: DeptSwitcherCoords | null; // 📐 إحداثيات تموضع القائمة المنسدلة
  currentHead: UserProfile | { full_name: string; generated_email?: string } | null | undefined; // 👨‍💼 رئيس القسم الحالي
  currentRap: UserProfile | { full_name: string; generated_email?: string } | null | undefined; // 📝 مقرر القسم الحالي
  deptTeachersCount: number; // 🔢 عدد أساتذة القسم
  deptStudentsCount: number; // 🔢 عدد طلبة القسم
  deptCoursesCount: number; // 🔢 عدد مواد القسم
  deptTeacherCoursesCount: number; // 🔢 عدد تكليفات القسم
  deptGradesCount: number; // 🔢 عدد سجلات درجات القسم
  successMessage: string; // 💬 نص إشعار النجاح
  setSuccessMessage: (msg: string) => void; // 🔄 تفريغ إشعار النجاح
  errorMessage: string; // 💬 نص إشعار الخطأ
  setErrorMessage: (msg: string) => void; // 🔄 تفريغ إشعار الخطأ
  activeTab: DepartmentAdminTab; // 📑 التبويب الفعال حالياً
  handleTabSwitch: (tab: DepartmentAdminTab) => void; // 🔀 دالة الانتقال بين التبويبات
}

// 🏛️ مكون هيدر وشريط تنقل بوابة إدارة القسم الأكاديمي الموحد
export const DepartmentPortalHeader: React.FC<DepartmentPortalHeaderProps> = ({
  currentDepartment, // 🏢 القسم الحالي
  currentUser, // 👤 المستخدم الحالي
  academicYear, // 🗓️ العام الدراسي
  formatAcademicYearDisplay, // 🔤 تنسيق العام
  deptName, // 🏛️ اسم القسم
  departments, // 🏢 الأقسام
  currentDeptId, // 🔑 معرف القسم
  setCurrentDeptId, // 🔄 دالة تغيير القسم
  isDeptSwitcherDropdownOpen, // 📂 حالة القائمة
  setIsDeptSwitcherDropdownOpen, // 🔄 تحديث القائمة
  deptSwitcherButtonRef, // 🔗 مرجع الزر
  handleToggleDeptSwitcherDropdown, // ⚡ دالة النقر
  deptSwitcherCoords, // 📐 الإحداثيات
  currentHead, // 👨‍💼 رئيس القسم
  currentRap, // 📝 مقرر القسم
  deptTeachersCount, // 🔢 عدد الأساتذة
  deptStudentsCount, // 🔢 عدد الطلبة
  deptCoursesCount, // 🔢 عدد المواد
  deptTeacherCoursesCount, // 🔢 عدد التكليفات
  deptGradesCount, // 🔢 عدد الدرجات
  successMessage, // 💬 رسالة النجاح
  setSuccessMessage, // 🔄 تفريغ النجاح
  errorMessage, // 💬 رسالة الخطأ
  setErrorMessage, // 🔄 تفريغ الخطأ
  activeTab, // 📑 التبويب الفعال
  handleTabSwitch, // 🔀 دالة التبديل
}) => {
  return (
    // 🧱 غلاف الهيدر الموحد والتنبيهات وشريط التبويبات
    <div className="space-y-4">
      {/* 🏛️ الهيدر الكحلي الرسمي لإدارة القسم بحدود ناعمة */}
      <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* 🖼️ شعار الجامعة الرسمي عالي الجودة */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
              <Image src="/logo.webp" alt="جامعة الإمام جعفر الصادق" width={64} height={64} className="object-contain" priority />
            </div>
            <div>
              {/* 🏷️ الوسوم الرسمية الثلاثة موحدة بنمط ولون كحلي ملكي راقٍ ومتناسق 100% */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. وسم رمز وكود القسم الموحد */}
                <span className="px-3 py-1 bg-blue-50 text-blue-950 border border-blue-200 font-black text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                  <Building2 className="w-4 h-4 text-[#0F2942]" />
                  <span>{currentDepartment?.code || 'القسم'}</span>
                </span>

                {/* 2. وسم بوابة الدور الإداري الموحد */}
                <span className="px-3 py-1 bg-blue-50 text-blue-950 border border-blue-200 font-black text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-[#0F2942]" />
                  <span>
                    {currentUser?.role === 'department_head' ? 'بوابة رئيس القسم' : currentUser?.role === 'rapporteur' ? 'بوابة مقرر القسم' : 'صلاحية المسؤول العام'}
                  </span>
                </span>

                {/* 3. وسم العام الدراسي الموحد بنفس النمط اللوني */}
                <span className="px-3 py-1 bg-blue-50 text-blue-950 border border-blue-200 font-black text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                  <Calendar className="w-4 h-4 text-[#0F2942]" />
                  <span>العام الدراسي <bdi dir="ltr">{formatAcademicYearDisplay(academicYear)}</bdi></span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 flex items-center gap-2 mt-2">
                <Building2 className="w-7 h-7 text-slate-900" />
                <span>لوحة إدارة قسم {deptName}</span>
              </h1>
              <p className="text-base sm:text-lg font-black text-black mt-1">
                جامعة الإمام جعفر الصادق (ع) - فرع ميسان
              </p>
            </div>
          </div>

          {/* 🏢 خيار تبديل القسم للمسؤول العام بقائمة مخصصة وفاخرة */}
          {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-300">
              <span className="text-sm font-black text-slate-950 px-2">تبديل القسم:</span>
              <div className="relative">
                <button
                  ref={deptSwitcherButtonRef}
                  type="button"
                  onClick={handleToggleDeptSwitcherDropdown}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border-2 border-slate-400 hover:border-slate-800 rounded-xl text-sm font-black text-slate-950 flex items-center gap-2 cursor-pointer shadow-xs transition"
                >
                  <Building2 className="w-4 h-4 text-blue-900" />
                  <span>
                    {departments.find((d) => d.id === currentDeptId)?.name || 'اختر قسماً'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform ${isDeptSwitcherDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDeptSwitcherDropdownOpen && typeof document !== 'undefined' && createPortal(
                  <>
                    <div
                      className="fixed inset-0 z-[999999] cursor-default"
                      onClick={() => setIsDeptSwitcherDropdownOpen(false)}
                    />
                    <div
                      style={{
                        position: 'fixed',
                        ...(deptSwitcherCoords?.openUpwards
                          ? { bottom: `${deptSwitcherCoords.bottom}px` }
                          : { top: `${deptSwitcherCoords?.top}px` }),
                        left: deptSwitcherCoords?.left,
                        minWidth: Math.max(220, deptSwitcherCoords?.width || 220),
                        maxHeight: deptSwitcherCoords?.maxHeight || 260,
                        zIndex: 999999,
                      }}
                      className="bg-white border-2 border-slate-300 rounded-2xl shadow-2xl p-2 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150 text-right"
                      dir="rtl"
                    >
                      {departments.map((d) => {
                        const isSelected = d.id === currentDeptId;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              setCurrentDeptId(d.id);
                              setIsDeptSwitcherDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 text-blue-950 border border-blue-300 font-black'
                                : 'text-slate-900 hover:bg-slate-100 font-bold'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-blue-900 shrink-0" />
                              <span>{d.name} ({d.code})</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-blue-800 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </>,
                  document.body
                )}
              </div>
            </div>
          )}
        </div>

        {/* 🏢 شريط تفاصيل القسم المرتبط والقيادة الأكاديمية */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-base font-black text-slate-950">
          <div className="space-y-1">
            <span className="text-sm font-black text-slate-950 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-900" />
              <span>رئيس القسم:</span>
            </span>
            <span className="font-black text-slate-950 text-base sm:text-lg">{currentHead?.full_name || 'غير معين'}</span>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-black text-slate-950 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-900" />
              <span>مقرر القسم:</span>
            </span>
            <span className="font-black text-slate-950 text-base sm:text-lg">{currentRap?.full_name || 'غير معين'}</span>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-black text-slate-950 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-900" />
              <span>التدريسيين والطلبة:</span>
            </span>
            <span className="font-black text-slate-950 text-base sm:text-lg">{deptTeachersCount} أستاذ • {deptStudentsCount} طالب</span>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-black text-slate-950 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-cyan-900" />
              <span>المناهج والمراحل:</span>
            </span>
            <span className="font-black text-slate-950 text-base sm:text-lg">{deptCoursesCount} مادة • 4 مراحل دراسية</span>
          </div>
        </div>
      </div>

      {/* 🔔 التنبيه العائم الفاخر عند نجاح الإجراءات */}
      {successMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200" dir="rtl">
          <div className="p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-emerald-500/80 ring-4 ring-emerald-400/10 flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 border-2 border-emerald-300 rounded-2xl shadow-2xs shrink-0">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-right">
                <h4 className="font-black text-base text-slate-950">إشعار النظام الأكاديمي</h4>
                <p className="font-bold text-sm text-slate-600 mt-0.5">{successMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* ⚠️ التنبيه العائم الفاخر عند حدوث خطأ */}
      {errorMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200" dir="rtl">
          <div className="p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-rose-500/80 ring-4 ring-rose-400/10 flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-rose-50 text-rose-700 border-2 border-rose-300 rounded-2xl shadow-2xs shrink-0">
                <AlertCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-right">
                <h4 className="font-black text-base text-slate-950">تنبيه النظام</h4>
                <p className="font-bold text-sm text-slate-600 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* 🔀 شريط التبويبات الـ 11 المنسق والمتوازن بدقة هندسية شاملة وبدون تثبيت مزعج */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-2 sm:p-2.5 rounded-3xl shadow-sm relative z-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2 sm:gap-2.5">
          
          {/* 1. أساتذة القسم */}
          <button
            type="button"
            id="admin-tab-teachers"
            onClick={() => handleTabSwitch('teachers')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'teachers'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <Users className={`w-5 h-5 flex-shrink-0 ${activeTab === 'teachers' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">الأساتذة</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${activeTab === 'teachers' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950 border border-slate-300'}`}>
              {deptTeachersCount}
            </span>
          </button>

          {/* 2. طلاب القسم */}
          <button
            type="button"
            id="admin-tab-students"
            onClick={() => handleTabSwitch('students')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'students'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <GraduationCap className={`w-5 h-5 flex-shrink-0 ${activeTab === 'students' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">الطلاب</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${activeTab === 'students' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950 border border-slate-300'}`}>
              {deptStudentsCount}
            </span>
          </button>

          {/* 3. مواد القسم */}
          <button
            type="button"
            id="admin-tab-courses"
            onClick={() => handleTabSwitch('courses')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'courses'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <BookOpen className={`w-5 h-5 flex-shrink-0 ${activeTab === 'courses' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">المواد</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${activeTab === 'courses' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950 border border-slate-300'}`}>
              {deptCoursesCount}
            </span>
          </button>

          {/* 4. تكليفات المواد */}
          <button
            type="button"
            id="admin-tab-assignments"
            onClick={() => handleTabSwitch('assignments')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'assignments'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <Layers className={`w-5 h-5 flex-shrink-0 ${activeTab === 'assignments' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">التكليفات</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${activeTab === 'assignments' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950 border border-slate-300'}`}>
              {deptTeacherCoursesCount}
            </span>
          </button>

          {/* 5. درجات وسعيات القسم */}
          <button
            type="button"
            id="admin-tab-grades"
            onClick={() => handleTabSwitch('grades')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'grades'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <FileSpreadsheet className={`w-5 h-5 flex-shrink-0 ${activeTab === 'grades' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">الدرجات</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${activeTab === 'grades' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950 border border-slate-300'}`}>
              {deptGradesCount}
            </span>
          </button>

          {/* 6. الجدول الأسبوعي */}
          <button
            type="button"
            id="admin-tab-schedule"
            onClick={() => handleTabSwitch('schedule')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'schedule'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <Clock className={`w-5 h-5 flex-shrink-0 ${activeTab === 'schedule' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">الجدول</span>
          </button>

          {/* 7. الحضور والإنذارات */}
          <button
            type="button"
            id="admin-tab-attendance"
            onClick={() => handleTabSwitch('attendance')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'attendance'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <ClipboardList className={`w-5 h-5 flex-shrink-0 ${activeTab === 'attendance' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">الحضور</span>
          </button>

          {/* 8. جداول الامتحانات النهائية */}
          <button
            type="button"
            id="admin-tab-exams"
            onClick={() => handleTabSwitch('exams')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'exams'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <FileText className={`w-5 h-5 flex-shrink-0 ${activeTab === 'exams' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">الامتحانات</span>
          </button>

          {/* 9. تدقيق التكليفات والامتحانات الفصلية */}
          <button
            type="button"
            id="admin-tab-course_tasks"
            onClick={() => handleTabSwitch('course_tasks')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'course_tasks'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <CheckSquare className={`w-5 h-5 flex-shrink-0 ${activeTab === 'course_tasks' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">المهام</span>
          </button>

          {/* 10. تسديد الأقساط الدراسية */}
          <button
            type="button"
            id="admin-tab-tuition"
            onClick={() => handleTabSwitch('tuition')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'tuition'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <CreditCard className={`w-5 h-5 flex-shrink-0 ${activeTab === 'tuition' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">الأقساط</span>
          </button>

          {/* 11. الرسوم البيانية والإحصائيات */}
          <button
            type="button"
            id="admin-tab-analytics"
            onClick={() => handleTabSwitch('analytics')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'analytics'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <BarChart3 className={`w-5 h-5 flex-shrink-0 ${activeTab === 'analytics' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">التحليلات</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepartmentPortalHeader; // 🚀 تصدير المكون كافتراضي
