'use client'; // ⚡ ينفذ بجهة العميل في المتصفح

// 📋 جدول حسابات رؤساء ومقرري الأقسام مع البحث، والفلترة، والإجراءات الفردية والجماعية، والترقيم المتقدم
import React, { useState, useRef, useEffect } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والذاكرة والمراجع
import { 
  Building2, 
  UserCheck, 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Download, 
  UserPlus, 
  ArrowUp, 
  ArrowDown, 
  QrCode, 
  Printer, 
  Edit3, 
  ChevronDown, 
  Check, 
  ChevronsRight, 
  ChevronRight, 
  ChevronLeft, 
  ChevronsLeft 
} from 'lucide-react'; // 🎨 أيقونات التفاعل SVG
import { UserProfile, Department } from '@/types'; // 🔗 واجهات الأنواع الصارمة
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧬 كاشف الجنس الذكي للاسم العربي
import { detectDuplicateEmails } from '@/lib/validation-utils'; // 🛡️ محرك كشف البريد المكرر
import SmartDepartmentFilterSelect from '@/components/department-heads/SmartDepartmentFilterSelect'; // 🏛️ مكون تصفية الأقسام
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'; // 🗑️ مودال تأكيد الحذف الفاخر

// 📋 واجهة خصائص جدول القيادات الإدارية
interface DepartmentHeadsTableProps {
  profiles: UserProfile[]; // 👥 قائمة كافة المستخدمين بالنظام
  departments: Department[]; // 🏢 قائمة الأقسام الأكاديمية
  sortedProfiles: UserProfile[]; // 📑 قائمة القيادات بعد الفلترة والترتيب
  filterRole: 'ALL' | 'department_head' | 'rapporteur'; // 🎭 فلتر الموقع الإداري
  setFilterRole: (role: 'ALL' | 'department_head' | 'rapporteur') => void; // 🔄 تغيير فلتر الموقع
  selectedDeptFilter: string; // 🏛️ فلتر القسم المختار
  setSelectedDeptFilter: (deptId: string) => void; // 🔄 تغيير فلتر القسم
  searchQuery: string; // 🔍 نص البحث
  setSearchQuery: (query: string) => void; // 🔄 تغيير نص البحث
  sortMode: 'custom' | 'newest' | 'oldest' | 'name_asc' | 'dept_asc'; // 🔀 نمط الترتيب
  setSortMode: (mode: 'custom' | 'newest' | 'oldest' | 'name_asc' | 'dept_asc') => void; // 🔄 تغيير الترتيب
  selectedLeaderIds: string[]; // 🆔 مصفوفة المعرفات المحددة للإجراءات الجماعية
  setSelectedLeaderIds: React.Dispatch<React.SetStateAction<string[]>>; // 🔄 تحديث المعرفات المحددة
  toggleSelect: (id: string) => void; // 🔘 تبديل تحديد عنصر مفرد
  toggleSelectAll: (currentProfiles: UserProfile[]) => void; // 🔘 تحديد أو إلغاء تحديد الكل
  handleMoveHead: (index: number, direction: 'up' | 'down', e: React.MouseEvent) => void; // ⬆️⬇️ تقديم وتأخير المسؤول
  onSelectCard: (profile: UserProfile) => void; // 📇 فتح بطاقة الحساب
  onSelectPrint: (profile: UserProfile) => void; // 🖨️ فتح نافذة طباعة بطاقة المسؤول
  onEdit: (profile: UserProfile) => void; // ✏️ بدء تعديل المسؤول
  onDelete: (id: string) => void; // 🗑️ طلب حذف مسؤول
  handleFixDuplicateEmails: () => void; // 🛡️ حل وتفريد الإيميلات المكررة
  handleBulkExportExcel: (profilesToExport: UserProfile[]) => void; // 📊 تصدير المحدد إكسل
  confirmBulkDeleteLeaders: () => void; // 🗑️ تنفيذ الحذف الجماعي
  isBulkDeleting: boolean; // ⚠️ حالة فتح مودال الحذف الجماعي
  setIsBulkDeleting: (open: boolean) => void; // 🔄 تغيير حالة مودال الحذف الجماعي
  deletingLeaderProfile: UserProfile | null; // 👤 المسؤول قيد الحذف الفردي
  setDeletingLeaderProfile: (profile: UserProfile | null) => void; // 🔄 تغيير المسؤول قيد الحذف
  confirmExecuteDeleteLeader: () => void; // 🗑️ تأكيد الحذف الفردي
  pageSize: number; // 🔢 عدد العناصر بالصفحة
  setPageSize: (size: number) => void; // 🔄 تغيير عدد العناصر بالصفحة
  currentPage: number; // 📄 رقم الصفحة الحالي
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>; // 🔄 تغيير رقم الصفحة
  onOpenAddModal: () => void; // ➕ فتح نافذة إضافة مسؤول
  handleImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void; // 📤 معالجة استيراد الإكسل
  isImportingExcel: boolean; // ⏳ حالة التحميل للاستيراد
}

// 📦 المكون الرئيسي لجدول القيادات
export default function DepartmentHeadsTable({
  profiles, // 👥 الكل
  departments, // 🏢 الأقسام
  sortedProfiles, // 📑 المفلتر
  filterRole, // 🎭 الموقع
  setFilterRole, // 🔄 تغيير الموقع
  selectedDeptFilter, // 🏛️ فلتر القسم
  setSelectedDeptFilter, // 🔄 تغيير فلتر القسم
  searchQuery, // 🔍 البحث
  setSearchQuery, // 🔄 تغيير البحث
  sortMode, // 🔀 نمط الترتيب
  setSortMode, // 🔄 تغيير الترتيب
  selectedLeaderIds, // 🆔 المحدد
  setSelectedLeaderIds, // 🔄 تحديث المحدد
  toggleSelect, // 🔘 تحديد مفرد
  toggleSelectAll, // 🔘 تحديد الكل
  handleMoveHead, // ⬆️⬇️ نقل
  onSelectCard, // 📇 كارد
  onSelectPrint, // 🖨️ طباعة
  onEdit, // ✏️ تعديل
  onDelete, // 🗑️ حذف
  handleFixDuplicateEmails, // 🛡️ تصحيح التكرار
  handleBulkExportExcel, // 📊 تصدير المحدد
  confirmBulkDeleteLeaders, // 🗑️ تأكيد الحذف الجماعي
  isBulkDeleting, // ⚠️ مودال الحذف الجماعي
  setIsBulkDeleting, // 🔄 حالة الحذف الجماعي
  deletingLeaderProfile, // 👤 الحذف الفردي
  setDeletingLeaderProfile, // 🔄 حالة الحذف الفردي
  confirmExecuteDeleteLeader, // 🗑️ تأكيد الحذف الفردي
  pageSize, // 🔢 حجم الصفحة
  setPageSize, // 🔄 تغيير الحجم
  currentPage, // 📄 رقم الصفحة
  setCurrentPage, // 🔄 تغيير رقم الصفحة
  onOpenAddModal, // ➕ فتح مودال الإضافة
  handleImportExcel, // 📤 استيراد
  isImportingExcel // ⏳ حالة الاستيراد
}: DepartmentHeadsTableProps) {
  // 🔽 حالة فتح وإغلاق القائمة المنسدلة لفلتر الدور
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false); // 🔽 القائمة مفتوحة أم مغلقة
  const filterDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع قائمة فلتر الدور

  // 🔽 حالة فتح وإغلاق القائمة المنسدلة لحجم الصفحة
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false); // 🔽 قائمة حجم الصفحة مفتوحة أم مغلقة
  const pageSizeDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع قائمة حجم الصفحة

  // 🧹 إغلاق القوائم المنسدلة عند النقر خارجها
  useEffect(() => {
    // 🖱️ دالة معالجة النقر الخارجي
    const handleClickOutside = (event: MouseEvent) => {
      // 🛡️ فحص قائمة فلتر الدور
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false); // ❌ إغلاق قائمة الدور
      }
      // 🛡️ فحص قائمة حجم الصفحة
      if (pageSizeDropdownRef.current && !pageSizeDropdownRef.current.contains(event.target as Node)) {
        setIsPageSizeOpen(false); // ❌ إغلاق قائمة حجم الصفحة
      }
    };

    // 👂 إضافة المستمع للأحداث
    document.addEventListener('mousedown', handleClickOutside);

    // 🧹 إزالة المستمع لمنع تسريب الذاكرة
    return () => {
      document.removeEventListener('mousedown', handleClickOutside); // 🧹 تنظيف
    };
  }, []); // 🔄 يعمل مرة واحدة عند تحميل المكون

  // 🔢 إحصائيات الترقيم والتجزئة
  const totalLeadersCount = sortedProfiles.length; // 🔢 إجمالي عدد القيادات
  const totalPages = Math.max(1, Math.ceil(totalLeadersCount / pageSize)); // 📄 إجمالي عدد الصفحات
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages); // 🎯 الصفحة الآمنة الحالية
  const startIndex = (safeCurrentPage - 1) * pageSize; // 📍 بداية الشريحة الحالية
  const paginatedLeaders = sortedProfiles.slice(startIndex, startIndex + pageSize); // 📑 القيادات المعروضة بالصفحة

  return (
    // 📦 حاوية الجدول الرئيسية البيضاء
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* 🔍 شريط البحث وفلاتر القيادات الأكاديمية */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        {/* 📌 الجزء الأيمن: عنوان الجدول وإحصائيات الرتب */}
        <div>
          <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-900" />
            <span>قائمة القيادات الأكاديمية ({sortedProfiles.length} مسجلاً)</span>
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-950 text-xs font-black rounded-lg border border-blue-200">
              {profiles.filter((p) => p.role === 'department_head').length} رئيس قسم
            </span>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-950 text-xs font-black rounded-lg border border-indigo-200">
              {profiles.filter((p) => p.role === 'rapporteur').length} مقرر قسم
            </span>
          </div>
        </div>

        {/* 🎛️ الجزء الأيسر: فلتر الموقع وحقل البحث */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 🎭 القائمة المنسدلة لفلتر الدور */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              type="button" // 🔘 نوع الزر
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)} // 🔄 فتح/إغلاق
              className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-black text-slate-950 flex items-center gap-2 hover:bg-slate-100 transition cursor-pointer" // 🎨 ستايل
            >
              <Building2 className="w-4 h-4 text-slate-900" />
              <span>
                {filterRole === 'ALL' ? 'كافة القيادات (رؤساء ومقررين)' : filterRole === 'department_head' ? 'رؤساء الأقسام فقط' : 'مقررو الأقسام فقط'}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-950 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* 📑 محتوى القائمة المنسدلة للفلتر */}
            {isFilterDropdownOpen && (
              <div className="absolute top-full mt-1.5 right-0 bg-white border border-slate-300 rounded-2xl shadow-xl py-1.5 min-w-[220px] z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button" // 🔘 نوع الزر
                  onClick={() => {
                    setFilterRole('ALL'); // 🔄 تصفية للكل
                    setIsFilterDropdownOpen(false); // ❌ إغلاق القائمة
                  }}
                  className={`w-full px-4 py-2.5 text-right text-sm font-black flex items-center justify-between transition hover:bg-indigo-50 cursor-pointer ${
                    filterRole === 'ALL' ? 'bg-indigo-100 text-indigo-950' : 'text-slate-950'
                  }`}
                >
                  <span>كافة القيادات (الكل)</span>
                  {filterRole === 'ALL' && <Check className="w-4 h-4 text-indigo-700" />}
                </button>

                <button
                  type="button" // 🔘 نوع الزر
                  onClick={() => {
                    setFilterRole('department_head'); // 🔄 رؤساء فقط
                    setIsFilterDropdownOpen(false); // ❌ إغلاق
                  }}
                  className={`w-full px-4 py-2.5 text-right text-sm font-black flex items-center justify-between transition hover:bg-indigo-50 cursor-pointer ${
                    filterRole === 'department_head' ? 'bg-indigo-100 text-indigo-950' : 'text-slate-950'
                  }`}
                >
                  <span>رؤساء الأقسام فقط</span>
                  {filterRole === 'department_head' && <Check className="w-4 h-4 text-indigo-700" />}
                </button>

                <button
                  type="button" // 🔘 نوع الزر
                  onClick={() => {
                    setFilterRole('rapporteur'); // 🔄 مقررين فقط
                    setIsFilterDropdownOpen(false); // ❌ إغلاق
                  }}
                  className={`w-full px-4 py-2.5 text-right text-sm font-black flex items-center justify-between transition hover:bg-indigo-50 cursor-pointer ${
                    filterRole === 'rapporteur' ? 'bg-indigo-100 text-indigo-950' : 'text-slate-950'
                  }`}
                >
                  <span>مقررو الأقسام فقط</span>
                  {filterRole === 'rapporteur' && <Check className="w-4 h-4 text-indigo-700" />}
                </button>
              </div>
            )}
          </div>

          {/* 🔍 حقل البحث في جدول المسؤولين */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-950" />
            <input
              type="text" // 🔤 نوع الإدخال نصي
              value={searchQuery} // 💾 القيمة
              onChange={(e) => setSearchQuery(e.target.value)} // 🔄 التحديث عند الكتابة
              placeholder="بحث بالاسم أو القسم أو البريد..." // 💡 التلميح
              className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-black text-slate-950 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:border-slate-900" // 🎨 التصميم
            />
          </div>
        </div>
      </div>

      {/* 🔄 أزرار الترتيب وتصفية القسم */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* 🏷️ عنوان الترتيب */}
        <div className="flex items-center gap-2 text-sm font-black text-slate-950">
          <SlidersHorizontal className="w-4 h-4 text-slate-900" />
          <span>نمط الترتيب:</span>
        </div>

        {/* 🔘 خيارات الترتيب */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 🔀 ترتيب يدوي مخصص */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={() => setSortMode('custom')} // 🔄 تغيير النمط
            className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
              sortMode === 'custom'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>ترتيب يدوي مخصص (الافتراضي)</span>
          </button>

          {/* ⏰ الأحدث أولاً */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={() => setSortMode('newest')} // 🔄 تغيير النمط
            className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
              sortMode === 'newest'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>الأحدث أولاً</span>
          </button>

          {/* 🔤 أبجدياً (أ - ي) */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={() => setSortMode('name_asc')} // 🔄 تغيير النمط
            className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
              sortMode === 'name_asc'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <span>أبجدياً (أ - ي)</span>
          </button>

          {/* 🏛️ حسب القسم */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={() => setSortMode('dept_asc')} // 🔄 تغيير النمط
            className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
              sortMode === 'dept_asc'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <span>حسب القسم</span>
          </button>

          {/* 🏛️ القائمة المنسدلة الذكية لاختيار وتصفية القسم */}
          <SmartDepartmentFilterSelect
            departments={departments}
            profiles={profiles}
            value={selectedDeptFilter}
            onChange={(val) => setSelectedDeptFilter(val)}
          />
        </div>
      </div>

      {/* ⚠️ شريط ذكي لكشف الحسابات المشتركة بنفس البريد وحلها تلقائياً */}
      {(() => {
        const leadershipProfiles = profiles.filter((p) => p.role === 'department_head' || p.role === 'rapporteur'); // 🛡️ تصفية القيادات
        const currentDuplicates = detectDuplicateEmails(leadershipProfiles); // 🔎 فحص التكرار
        if (currentDuplicates.length === 0) return null; // ✨ لا يوجد تكرار

        return (
          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-rose-950 shadow-xs animate-in fade-in duration-200 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-200/60 text-rose-700 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm text-rose-950">
                  تنبيه أمني: يوجد ({currentDuplicates.length}) بريد أكاديمي مكرر لأكثر من مسؤول قسم في الكلية!
                </h4>
                <p className="text-xs font-black text-rose-800 mt-0.5">
                  البريد ({currentDuplicates.map((d) => d.email).join(', ')}) مشترك بين: {currentDuplicates.flatMap((d) => d.profiles.map((p) => p.full_name)).join(' و ')}.
                </p>
              </div>
            </div>
            <button
              type="button" // 🔘 نوع الزر
              onClick={handleFixDuplicateEmails} // ⚡ استدعاء دالة الإصلاح
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95 whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4 text-rose-200" />
              <span>فصل الحسابات وتوليد بريد فريد فوراً ⚡</span>
            </button>
          </div>
        );
      })()}

      {/* 🎛️ شريط الإجراءات الجماعية الفاخر للمسؤولين المحددين */}
      {selectedLeaderIds.length > 0 && (
        <div className="bg-[#0F2942] text-white p-4 sm:px-6 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-[#1e4570] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-cyan-300 rounded-xl border border-cyan-400/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-base text-white">
                تم تحديد <strong className="text-cyan-300 font-mono text-lg font-black">({selectedLeaderIds.length})</strong> من أصل <span className="font-mono text-slate-300">({sortedProfiles.length})</span> من القيادات الإدارية
              </span>
            </div>
          </div>

          {/* 🔘 أزرار الإجراءات الجماعية */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 🗑️ حذف جماعي */}
            <button
              type="button" // 🔘 نوع الزر
              onClick={() => setIsBulkDeleting(true)} // 🗑️ فتح مودال الحذف
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف وفك ارتباط المحدد ({selectedLeaderIds.length})</span>
            </button>

            {/* 📊 تصدير إكسل للمحدد */}
            <button
              type="button" // 🔘 نوع الزر
              onClick={() => handleBulkExportExcel(sortedProfiles)} // 📊 تصدير المحدد
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>تصدير المحدد Excel</span>
            </button>

            {/* ❌ إلغاء التحديد */}
            <button
              type="button" // 🔘 نوع الزر
              onClick={() => setSelectedLeaderIds([])} // ❌ تصفير التحديد
              className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-black text-sm transition cursor-pointer"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* 📊 جدول الحسابات الإدارية أو الحالة الفارغة */}
      {sortedProfiles.length === 0 ? (
        // 📭 الحالة الفارغة عند عدم وجود نتائج
        <div className="py-16 px-6 text-center bg-white rounded-3xl border-2 border-dashed border-slate-300 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
              <UserCheck className="w-7 h-7 text-indigo-900" />
            </div>
            <h4 className="text-xl font-black text-slate-950">
              {profiles.filter((p) => p.role === 'department_head' || p.role === 'rapporteur').length === 0
                ? 'لا توجد قيادات أكاديمية مسجلة حتى الآن'
                : 'لم يتم العثور على أي حساب مطابق'}
            </h4>
            <p className="text-sm font-black text-slate-950 leading-relaxed">
              {profiles.filter((p) => p.role === 'department_head' || p.role === 'rapporteur').length === 0
                ? 'يمكنك تعيين رؤساء الأقسام والمقررين وتوليد بيانات دخولهم، أو استيراد القوائم دفعة واحدة من ملف Excel.'
                : 'يرجى مراجعة محددات التصفية أو كلمة البحث.'}
            </p>
            {/* ➕ أزرار العمل في الحالة الفارغة الكاملة */}
            {profiles.filter((p) => p.role === 'department_head' || p.role === 'rapporteur').length === 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button" // 🔘 نوع الزر
                  onClick={onOpenAddModal} // ➕ إضافة
                  className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-sm font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 border border-[#0F2942]"
                >
                  <UserPlus className="w-4 h-4 text-cyan-300" />
                  <span>إضافة رئيس قسم أو مقرر</span>
                </button>
                <label className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95">
                  <Download className="w-4 h-4 text-white" />
                  <span>استيراد من Excel</span>
                  <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} disabled={isImportingExcel} className="hidden" />
                </label>
              </div>
            )}

            {/* 🔄 زر إلغاء تصفية القسم إذا كان مفعلاً */}
            {selectedDeptFilter !== 'ALL' && (
              <div className="pt-2">
                <button
                  type="button" // 🔘 نوع الزر
                  onClick={() => setSelectedDeptFilter('ALL')} // 🔄 إعادة العرض للكل
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-950 text-sm font-black rounded-xl transition cursor-pointer border border-slate-300"
                >
                  إلغاء تصفية القسم وعرض كافة القيادات
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // 📋 الجدول الرئيسي للبيانات
        <div className="overflow-hidden rounded-3xl border border-slate-300 shadow-xs bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-base font-black">
              {/* 🏷️ هيدر الأعمدة */}
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-950 font-black text-base">
                  {/* 🔘 مربع تحديد الكل */}
                  <th className="p-4 text-center w-12 whitespace-nowrap text-base">
                    <input
                      type="checkbox" // 🔘 نوع العنصر
                      aria-label="تحديد كافة المسؤولين المعروضين" // ♿ إمكانية الوصول
                      checked={selectedLeaderIds.length === sortedProfiles.length && sortedProfiles.length > 0} // ✅ حالة التحديد الشامل
                      onChange={() => toggleSelectAll(sortedProfiles)} // 🔄 تبديل التحديد
                      className="w-5 h-5 rounded-md border-2 border-slate-400 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                    />
                  </th>
                  <th className="p-4 text-center w-16 whitespace-nowrap text-base">#</th>
                  <th className="p-4 whitespace-nowrap text-base min-w-[200px]">الاسم الأكاديمي الكامل</th>
                  <th className="p-4 text-center whitespace-nowrap text-base w-32">الجنس</th>
                  <th className="p-4 text-center whitespace-nowrap text-base w-40">الموقع الإداري</th>
                  <th className="p-4 whitespace-nowrap text-base min-w-[180px]">القسم العلمي المرتبط</th>
                  <th className="p-4 text-center whitespace-nowrap text-base">طلبة القسم (ذكور / إناث)</th>
                  <th className="p-4 text-center whitespace-nowrap text-base">كادر القسم (ذكور / إناث)</th>
                  <th className="p-4 text-center whitespace-nowrap text-base w-32">الترتيب</th>
                  <th className="p-4 text-center whitespace-nowrap text-base w-36">الإجراءات</th>
                </tr>
              </thead>
              {/* 📄 صفوف المسؤولين بالجدول */}
              <tbody className="divide-y divide-slate-200 font-black text-slate-950 text-base">
                {paginatedLeaders.map((p, index) => {
                  const pGender = p.gender || detectArabicGender(p.full_name); // 🚻 تحديد الجنس
                  const globalIndex = startIndex + index + 1; // 🔢 التسلسل العام
                  const isFirst = (startIndex + index) === 0; // 🔝 هل هو الأول
                  const isLast = (startIndex + index) === sortedProfiles.length - 1; // 🔚 هل هو الأخير
                  const isSelected = selectedLeaderIds.includes(p.id); // 🔘 هل محدد

                  return (
                    <tr key={p.id} className={`${isSelected ? 'bg-blue-50/70 ring-1 ring-blue-300' : 'hover:bg-slate-50'} transition`}>
                      {/* 🔘 مربع اختيار الصف */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox" // 🔘 نوع الإدخال
                          aria-label={`تحديد ${p.full_name}`} // ♿ إمكانية الوصول
                          checked={isSelected} // ✅ حالة التحديد
                          onChange={() => toggleSelect(p.id)} // 🔄 التبديل
                          className="w-5 h-5 rounded-md border-2 border-slate-400 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                        />
                      </td>
                      {/* 🔢 التسلسل الرقمي */}
                      <td className="p-4 text-center font-mono font-black text-slate-950 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-xl text-base shadow-2xs">
                          {globalIndex}
                        </span>
                      </td>
                      
                      {/* 👤 الاسم الأكاديمي مع الأفاتار */}
                      <td className="p-4 font-black text-slate-950 text-base whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                            pGender === 'female' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-blue-50 text-blue-900 border-blue-200'
                          }`}>
                            {p.role === 'department_head' ? <Building2 className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                          </div>
                          <span className="font-black text-slate-950 text-base">{p.full_name}</span>
                        </div>
                      </td>

                      {/* ⚧ الجنس */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-xl text-sm font-black border inline-block ${ pGender === 'female' ? 'bg-rose-100 text-rose-950 border-rose-300' : 'bg-blue-100 text-blue-950 border-blue-300' }`}>
                          {pGender === 'female' ? 'أنثى' : 'ذكر'}
                        </span>
                      </td>

                      {/* 🏛️ الموقع الإداري */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-black border bg-[#0F2942] text-white border-[#1e4570] shadow-xs">
                          {p.role === 'department_head' ? (
                            <Building2 className="w-4 h-4 text-cyan-300 shrink-0" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-cyan-300 shrink-0" />
                          )}
                          <span>
                            {p.role === 'department_head'
                              ? (pGender === 'female' ? 'رئيسة قسم' : 'رئيس قسم')
                              : (pGender === 'female' ? 'مقررة قسم' : 'مقرر قسم')}
                          </span>
                        </div>
                      </td>

                      {/* 🏢 القسم المرتبط */}
                      <td className="p-4 text-slate-950 font-black text-base whitespace-nowrap">
                        <span className="px-3 py-1 bg-slate-100 text-slate-950 border border-slate-300 rounded-xl text-sm font-black inline-block">
                          {p.department_name || 'غير مرتبط'}
                        </span>
                      </td>
                      
                      {/* 👥 إحصائية طلبة القسم */}
                      <td className="p-4 text-center whitespace-nowrap">
                        {(() => {
                          const deptStudents = profiles.filter(
                            (s) => s.role === 'student' && (s.department_id === p.department_id || s.department_name === p.department_name)
                          ); // 👥 الطلبة
                          const males = deptStudents.filter((s) => (s.gender || detectArabicGender(s.full_name)) === 'male').length; // 👨 الذكور
                          const females = deptStudents.length - males; // 👩 الإناث

                          return (
                            <div className="inline-flex flex-col items-center">
                              <span className="font-black text-slate-950 text-sm">{deptStudents.length} طالب/ـة</span>
                              <div className="text-xs font-black flex items-center gap-1.5 mt-0.5">
                                <span className="text-blue-950 bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-300">{males} ذ</span>
                                <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-300">{females} ث</span>
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* 👨‍🏫 إحصائية تدريسيي القسم */}
                      <td className="p-4 text-center whitespace-nowrap">
                        {(() => {
                          const deptTeachers = profiles.filter(
                            (t) => t.role === 'teacher' && (t.department_id === p.department_id || t.department_name === p.department_name)
                          ); // 👨‍🏫 التدريسيين
                          const tchMales = deptTeachers.filter((t) => (t.gender || detectArabicGender(t.full_name)) === 'male').length; // 👨 الذكور
                          const tchFemales = deptTeachers.length - tchMales; // 👩 الإناث

                          return (
                            <div className="inline-flex flex-col items-center">
                              <span className="font-black text-slate-950 text-sm">{deptTeachers.length} تدريسي/ـة</span>
                              <div className="text-xs font-black flex items-center gap-1.5 mt-0.5">
                                <span className="text-blue-950 bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-300">{tchMales} ذ</span>
                                <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-300">{tchFemales} ث</span>
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* 🎛️ أزرار التقديم والتأخير */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* ⬆️ تقديم */}
                          <button
                            type="button" // 🔘 نوع الزر
                            onClick={(e) => handleMoveHead(startIndex + index, 'up', e)} // ⬆️ رفع
                            disabled={isFirst} // 🔒 تعطيل للأول
                            title="تقديم الحساب للأعلى" // 💡 تلميح
                            className={`p-2 rounded-xl border transition cursor-pointer ${
                              isFirst
                                ? 'bg-slate-100 text-slate-950 opacity-30 border-slate-200 cursor-not-allowed'
                                : 'bg-white text-slate-950 border-slate-300 hover:bg-slate-900 hover:text-white shadow-2xs'
                            }`}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          {/* ⬇️ تأخير */}
                          <button
                            type="button" // 🔘 نوع الزر
                            onClick={(e) => handleMoveHead(startIndex + index, 'down', e)} // ⬇️ تنزيل
                            disabled={isLast} // 🔒 تعطيل للأخير
                            title="تأخير الحساب للأسفل" // 💡 تلميح
                            className={`p-2 rounded-xl border transition cursor-pointer ${
                              isLast
                                ? 'bg-slate-100 text-slate-950 opacity-30 border-slate-200 cursor-not-allowed'
                                : 'bg-white text-slate-950 border-slate-300 hover:bg-slate-900 hover:text-white shadow-2xs'
                            }`}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* ⚙️ أزرار الإجراءات الفردية */}
                      <td className="p-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* 📇 عرض البطاقة ونسخ الحساب */}
                          <button
                            type="button" // 🔘 نوع الزر
                            onClick={() => onSelectCard(p)} // 📇 فتح البطاقة
                            className="p-2 bg-slate-100 hover:bg-[#0F2942] hover:text-white rounded-xl text-slate-950 transition cursor-pointer border border-slate-300 shadow-2xs"
                            title="عرض ونسخ بيانات الدخول"
                          >
                            <QrCode className="w-5 h-5" />
                          </button>

                          {/* 🖨️ طباعة بطاقة تسليم الحساب الرسمية */}
                          <button
                            type="button" // 🔘 نوع الزر
                            onClick={() => onSelectPrint(p)} // 🖨️ فتح الطباعة
                            className="p-2 bg-slate-100 hover:bg-[#0F2942] hover:text-white rounded-xl text-slate-950 transition cursor-pointer border border-slate-300 shadow-2xs"
                            title="طباعة بطاقة تسليم الحساب الرسمية (PDF)"
                          >
                            <Printer className="w-5 h-5" />
                          </button>

                          {/* ✏️ تعديل البيانات */}
                          <button
                            type="button" // 🔘 نوع الزر
                            onClick={() => onEdit(p)} // ✏️ بدء التعديل
                            className="p-2 bg-slate-100 hover:bg-[#0F2942] hover:text-white text-slate-950 rounded-xl transition cursor-pointer border border-slate-300 shadow-2xs"
                            title="تعديل البيانات"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>

                          {/* 🗑️ حذف الحساب */}
                          <button
                            type="button" // 🔘 نوع الزر
                            onClick={() => onDelete(p.id)} // 🗑️ طلب الحذف
                            className="p-2 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-900 rounded-xl transition cursor-pointer border border-rose-200 shadow-2xs"
                            title="حذف الحساب"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 📄 شريط نظام الصفحات المتقدم (Pagination) */}
          {totalLeadersCount > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-black">
              {/* 📊 ملخص العرض */}
              <div className="text-slate-950 font-black">
                عرض من <span className="text-slate-950 font-black font-mono">{startIndex + 1}</span> إلى{' '}
                <span className="text-slate-950 font-black font-mono">
                  {Math.min(startIndex + pageSize, totalLeadersCount)}
                </span>{' '}
                من أصل <span className="text-slate-950 font-black font-mono">{totalLeadersCount}</span> مسؤول
              </div>

              {/* 🎛️ خيارات التحكم بالصفحات وحجم الصفحة */}
              <div className="flex items-center gap-2">
                {/* 🔽 القائمة المنسدلة لحجم الصفحة */}
                <div className="relative" ref={pageSizeDropdownRef}>
                  <button
                    type="button" // 🔘 نوع الزر
                    onClick={() => setIsPageSizeOpen(!isPageSizeOpen)} // 🔄 فتح/إغلاق
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-950 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    aria-expanded={isPageSizeOpen}
                  >
                    <span>{pageSize} مسؤولين</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-950 transition-transform duration-200 ${isPageSizeOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* 📑 خيارات الحجم */}
                  {isPageSizeOpen && (
                    <div 
                      className="absolute bottom-full mb-2 right-0 z-50 min-w-[130px] bg-white border border-slate-300 rounded-2xl shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                      role="menu"
                    >
                      <div className="px-2.5 py-1 text-[11px] font-black text-slate-950 border-b border-slate-200 pb-1.5 mb-1">
                        عرض في الصفحة:
                      </div>
                      {[
                        { value: 5, label: '5 مسؤولين' },
                        { value: 10, label: '10 مسؤولين' },
                        { value: 20, label: '20 مسؤول' },
                        { value: 50, label: '50 مسؤول' },
                      ].map((option) => {
                        const isOptSelected = pageSize === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setPageSize(option.value); // 🔢 تعيين الحجم
                              setCurrentPage(1); // 🔄 العودة للأولى
                              setIsPageSizeOpen(false); // ❌ إغلاق
                            }}
                            className={`w-full text-right px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-between cursor-pointer ${
                              isOptSelected
                                ? 'bg-[#0F2942] text-white shadow-2xs'
                                : 'text-slate-950 hover:bg-slate-100'
                            }`}
                            role="menuitem"
                          >
                            <span>{option.label}</span>
                            {isOptSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 🔘 أزرار التنقل بين الصفحات */}
                <div className="flex items-center gap-1">
                  {/* ⏭️ الصفحة الأولى */}
                  <button
                    type="button" // 🔘 نوع الزر
                    onClick={() => setCurrentPage(1)} // ⏭️ انتقال
                    disabled={safeCurrentPage <= 1} // 🔒 تعطيل
                    className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    title="الصفحة الأولى"
                  >
                    <ChevronsRight className="w-4 h-4 text-slate-950" />
                  </button>
                  {/* ▶️ الصفحة السابقة */}
                  <button
                    type="button" // 🔘 نوع الزر
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} // ▶️ انتقال
                    disabled={safeCurrentPage <= 1} // 🔒 تعطيل
                    className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    title="الصفحة السابقة"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-950" />
                  </button>
                  {/* 🔢 العداد الحالي */}
                  <div className="px-3 py-1.5 bg-[#0F2942] text-white rounded-xl text-xs font-mono font-black shadow-2xs">
                    {safeCurrentPage} / {totalPages}
                  </div>
                  {/* ◀️ الصفحة التالية */}
                  <button
                    type="button" // 🔘 نوع الزر
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} // ◀️ انتقال
                    disabled={safeCurrentPage >= totalPages} // 🔒 تعطيل
                    className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    title="الصفحة التالية"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-950" />
                  </button>
                  {/* ⏮️ الصفحة الأخيرة */}
                  <button
                    type="button" // 🔘 نوع الزر
                    onClick={() => setCurrentPage(totalPages)} // ⏮️ انتقال
                    disabled={safeCurrentPage >= totalPages} // 🔒 تعطيل
                    className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    title="الصفحة الأخيرة"
                  >
                    <ChevronsLeft className="w-4 h-4 text-slate-950" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🗑️ كارد تأكيد حذف رئيس قسم أو مقرر احترافي فاخر (ConfirmDeleteModal) */}
      <ConfirmDeleteModal
        isOpen={!!deletingLeaderProfile}
        onClose={() => setDeletingLeaderProfile(null)}
        title="تأكيد حذف الحساب الإداري الأكاديمي"
        itemName={deletingLeaderProfile?.full_name || 'حساب إداري'}
        itemDetails={`الموقع: ${deletingLeaderProfile?.role === 'department_head' ? 'رئيس قسم' : 'مقرر قسم'} | ${deletingLeaderProfile?.department_name || ''}`}
        warningMessage="سيتم إزالة الحساب الرسمي وفك ارتباطه من القسم وإلغاء صلاحياته الإدارية نهائياً."
        onConfirm={confirmExecuteDeleteLeader}
      />

      {/* 🗑️ كارد تأكيد الحذف الجماعي لمسؤولي الأقسام */}
      <ConfirmDeleteModal
        isOpen={isBulkDeleting}
        onClose={() => setIsBulkDeleting(false)}
        title={`تأكيد الحذف الجماعي لـ (${selectedLeaderIds.length}) من القيادات الإدارية`}
        itemName={`${selectedLeaderIds.length} من رؤساء ومقرري الأقسام`}
        itemDetails="سيتم حذف الحسابات المحددة وفك ارتباطاتها الإدارية بالأقسام وإلغاء كافة صلاحياتها فوراً."
        warningMessage="تنبيه أمني: هل أنت متأكد من حذف الحسابات الإدارية المحددة دفعة واحدة؟ لا يمكن التراجع عن هذه العملية."
        confirmText={`حذف (${selectedLeaderIds.length}) حسابات نهائياً`}
        onConfirm={confirmBulkDeleteLeaders}
      />
    </div>
  );
}
