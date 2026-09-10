'use client'; // ⚡ واجهة تفاعلية على متصفح العميل في Next.js

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import { createPortal } from 'react-dom'; // 🚪 بورتال لرسم القائمة المنسدلة في قمة المستند
import {
  ArrowRightLeft, // 🔄 أيقونة التكليفات
  Plus, // ➕ أيقونة إضافة تكليف
  FileSpreadsheet, // 📊 أيقونة ملف الإكسل
  Printer, // 🖨️ أيقونة الطباعة
  Search, // 🔍 أيقونة البحث
  Users, // 👥 أيقونة الأساتذة
  ChevronDown, // 🔽 أيقونة القائمة المنسدلة
  Check, // ✔️ أيقونة الاختيار
  CheckSquare, // ☑️ أيقونة التحديد
  UserMinus, // 🚫 أيقونة إلغاء التكليف
  BookOpen, // 📖 أيقونة المادة النظري
  FlaskConical, // 🧪 أيقونة المختبر والعملي
  Layers, // 📚 أيقونة التكليف المشترك
  Edit3, // ✏️ أيقونة التعديل
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { UserProfile, Course, TeacherCourse } from '@/types'; // 🏷️ استيراد الأنواع الصارمة
import AdminPagination from '@/components/AdminPagination'; // 📄 مكون نظام الصفحات الموحد والفاخر
import AssignmentModal from '../modals/AssignmentModal'; // 🪟 مودال إضافة وتعديل التكليف

// 📋 واجهة خصائص تبويب إدارة وتكليف الأساتذة بالمواد
export interface DepartmentAssignmentsTabProps {
  deptTeacherCourses: TeacherCourse[]; // 📋 كافة تكليفات القسم
  deptTeachers: UserProfile[]; // 👨‍🏫 أساتذة القسم
  deptCourses: Course[]; // 📚 مواد القسم
  courses: Course[]; // 📖 كافة المواد للكلية
  deptName: string; // 🏢 اسم القسم
  assignmentSearch: string; // 🔍 نص البحث بالتكليفات
  setAssignmentSearch: (s: string) => void; // 🔄 تحديث بحث التكليفات
  filterAssignmentTeacher: string | 'all'; // 👤 الأستاذ المفلتر
  setFilterAssignmentTeacher: (t: string | 'all') => void; // 🔄 تحديث أستاذ الفلترة
  filterAssignmentStage: number | 'all'; // 🎓 المرحلة المفلترة
  setFilterAssignmentStage: (s: number | 'all') => void; // 🔄 تحديث مرحلة الفلترة
  filterAssignmentSemester: number | 'all'; // 🗓️ الكورس المفلتر
  setFilterAssignmentSemester: (s: number | 'all') => void; // 🔄 تحديث كورس الفلترة
  filterAssignmentRole: 'all' | 'theory' | 'practical' | 'both'; // 🏷️ طبيعة التكليف المفلترة
  setFilterAssignmentRole: (r: 'all' | 'theory' | 'practical' | 'both') => void; // 🔄 تحديث طبيعة التكليف
  filteredTeacherCourses: TeacherCourse[]; // 📋 التكليفات بعد تطبيق الفلاتر والبحث
  selectedAssignmentIds: string[]; // 🔘 التكليفات المحددة للعمليات الجماعية
  setSelectedAssignmentIds: React.Dispatch<React.SetStateAction<string[]>>; // 🔄 تحديث التحديد
  assignmentPage: number; // 🔢 الصفحة الحالية
  setAssignmentPage: (p: number) => void; // 🔄 تغيير الصفحة
  assignmentPageSize: number; // 📏 حجم الصفحة
  setAssignmentPageSize: (s: number) => void; // 🔄 تغيير حجم الصفحة
  isAssignmentModalOpen: boolean; // 📂 حالة فتح مودال التكليف
  setIsAssignmentModalOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 فتح/إغلاق المودال
  editingAssignment: TeacherCourse | null; // ✍️ التكليف للتعديل
  setEditingAssignment: React.Dispatch<React.SetStateAction<TeacherCourse | null>>; // 🔄 تحديث التكليف للتعديل
  selectedTeacherId: string; // 🆔 الأستاذ المختار
  setSelectedTeacherId: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث الأستاذ المختار
  selectedCourseId: string; // 🆔 المادة المختارة
  setSelectedCourseId: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث المادة المختارة
  selectedAssignRole: 'theory' | 'practical' | 'both'; // 🏷️ طبيعة التكليف
  setSelectedAssignRole: React.Dispatch<React.SetStateAction<'theory' | 'practical' | 'both'>>; // 🔄 تحديث طبيعة التكليف
  isAssignTeacherDropdownOpen: boolean; // 🔽 دروب داون الأستاذ بالمودال
  setIsAssignTeacherDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل دروب داون الأستاذ
  assignTeacherButtonRef: React.RefObject<HTMLButtonElement | null>; // 🔗 مرجع زر الأستاذ بالمودال
  assignTeacherCoords: { top?: number; bottom?: number; left: number; width: number; maxHeight: number; openUpwards: boolean } | null; // 📐 إحداثيات دروب داون الأستاذ
  handleToggleAssignTeacherDropdown: () => void; // 🔄 فتح/غلق دروب داون الأستاذ
  assignTeacherSearchQuery: string; // 🔍 بحث الأستاذ بالمودال
  setAssignTeacherSearchQuery: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث بحث الأستاذ
  isAssignCourseDropdownOpen: boolean; // 🔽 دروب داون المادة بالمودال
  setIsAssignCourseDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل دروب داون المادة
  assignCourseButtonRef: React.RefObject<HTMLButtonElement | null>; // 🔗 مرجع زر المادة بالمودال
  assignCourseCoords: { top?: number; bottom?: number; left: number; width: number; maxHeight: number; openUpwards: boolean } | null; // 📐 إحداثيات دروب داون المادة
  handleToggleAssignCourseDropdown: () => void; // 🔄 فتح/غلق دروب داون المادة
  assignCourseSearchQuery: string; // 🔍 بحث المادة بالمودال
  setAssignCourseSearchQuery: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث بحث المادة
  isFilterTeacherDropdownOpen: boolean; // 🔽 دروب داون فلتر الأستاذ بالجدول
  setIsFilterTeacherDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل دروب داون فلتر الأستاذ
  filterTeacherButtonRef: React.RefObject<HTMLButtonElement | null>; // 🔗 مرجع زر فلتر الأستاذ
  filterTeacherCoords: { top?: number; bottom?: number; left: number; width: number; maxHeight: number; openUpwards: boolean } | null; // 📐 إحداثيات دروب داون فلتر الأستاذ
  handleToggleFilterTeacherDropdown: () => void; // 🔄 فتح/غلق دروب داون فلتر الأستاذ
  filterTeacherSearchQuery: string; // 🔍 بحث فلتر الأستاذ
  setFilterTeacherSearchQuery: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث بحث فلتر الأستاذ
  isExportingAssignmentsExcel: boolean; // ⏳ تصدير إكسل
  handleExportAssignmentsExcel: () => void; // 📊 تصدير إكسل
  setAssignmentsPrintScope: (scope: 'filtered' | 'all') => void; // 🖨️ تحديد نطاق الطباعة
  setShowAssignmentsPrintModal: (show: boolean) => void; // 🖨️ فتح الطباعة
  handleSaveEditedAssignment: (e: React.FormEvent) => void; // 💾 حفظ تعديل التكليف
  handleAssignTeacher: (e: React.FormEvent) => void; // 💾 حفظ تكليف جديد
  handleBulkRemoveAssignments: () => void; // 🗑️ حذف جماعي للتكليفات
  handleOpenEditAssignment: (tc: TeacherCourse) => void; // ✏️ فتح تعديل تكليف
  handleRemoveAssignment: (id: string) => void; // 🚫 إلغاء تكليف فردي
  getStageNameInArabic: (stg: number) => string; // 🏷️ اسم المرحلة بالعربية
}

// 🏛️ مكون تبويب إدارة تكليفات الكادر التدريسي لقسم الكلية
export const DepartmentAssignmentsTab: React.FC<DepartmentAssignmentsTabProps> = ({
  deptTeacherCourses, // 📋 تكليفات القسم
  deptTeachers, // 👨‍🏫 أساتذة القسم
  deptCourses, // 📚 مواد القسم
  courses, // 📖 كافة المواد
  deptName, // 🏢 اسم القسم
  assignmentSearch, // 🔍 نص البحث
  setAssignmentSearch, // 🔄 تحديث البحث
  filterAssignmentTeacher, // 👤 أستاذ الفلترة
  setFilterAssignmentTeacher, // 🔄 تحديث أستاذ الفلترة
  filterAssignmentStage, // 🎓 مرحلة الفلترة
  setFilterAssignmentStage, // 🔄 تحديث مرحلة الفلترة
  filterAssignmentSemester, // 🗓️ كورس الفلترة
  setFilterAssignmentSemester, // 🔄 تحديث كورس الفلترة
  filterAssignmentRole, // 🏷️ طبيعة التكليف
  setFilterAssignmentRole, // 🔄 تحديث طبيعة التكليف
  filteredTeacherCourses, // 📋 التكليفات المفلترة
  selectedAssignmentIds, // 🔘 المحدد للعمليات
  setSelectedAssignmentIds, // 🔄 تحديث التحديد
  assignmentPage, // 🔢 الصفحة الحالية
  setAssignmentPage, // 🔄 تغيير الصفحة
  assignmentPageSize, // 📏 حجم الصفحة
  setAssignmentPageSize, // 🔄 تغيير حجم الصفحة
  isAssignmentModalOpen, // 📂 حالة مودال التكليف
  setIsAssignmentModalOpen, // 🔄 فتح/إغلاق المودال
  editingAssignment, // ✍️ التكليف للتعديل
  setEditingAssignment, // 🔄 تحديث التكليف للتعديل
  selectedTeacherId, // 🆔 الأستاذ المختار
  setSelectedTeacherId, // 🔄 تحديث الأستاذ
  selectedCourseId, // 🆔 المادة المختارة
  setSelectedCourseId, // 🔄 تحديث المادة
  selectedAssignRole, // 🏷️ طبيعة التكليف
  setSelectedAssignRole, // 🔄 تحديث طبيعة التكليف
  isAssignTeacherDropdownOpen, // 🔽 دروب داون الأستاذ بالمودال
  setIsAssignTeacherDropdownOpen, // 🔄 تبديل دروب داون الأستاذ
  assignTeacherButtonRef, // 🔗 مرجع زر الأستاذ
  assignTeacherCoords, // 📐 إحداثيات دروب داون الأستاذ
  handleToggleAssignTeacherDropdown, // 🔄 فتح/غلق دروب داون الأستاذ
  assignTeacherSearchQuery, // 🔍 بحث الأستاذ
  setAssignTeacherSearchQuery, // 🔄 تحديث بحث الأستاذ
  isAssignCourseDropdownOpen, // 🔽 دروب داون المادة بالمودال
  setIsAssignCourseDropdownOpen, // 🔄 تبديل دروب داون المادة
  assignCourseButtonRef, // 🔗 مرجع زر المادة
  assignCourseCoords, // 📐 إحداثيات دروب داون المادة
  handleToggleAssignCourseDropdown, // 🔄 فتح/غلق دروب داون المادة
  assignCourseSearchQuery, // 🔍 بحث المادة
  setAssignCourseSearchQuery, // 🔄 تحديث بحث المادة
  isFilterTeacherDropdownOpen, // 🔽 دروب داون فلتر الأستاذ بالجدول
  setIsFilterTeacherDropdownOpen, // 🔄 تبديل دروب داون فلتر الأستاذ
  filterTeacherButtonRef, // 🔗 مرجع زر فلتر الأستاذ
  filterTeacherCoords, // 📐 إحداثيات دروب داون فلتر الأستاذ
  handleToggleFilterTeacherDropdown, // 🔄 فتح/غلق دروب داون فلتر الأستاذ
  filterTeacherSearchQuery, // 🔍 بحث فلتر الأستاذ
  setFilterTeacherSearchQuery, // 🔄 تحديث بحث فلتر الأستاذ
  isExportingAssignmentsExcel, // ⏳ تصدير إكسل
  handleExportAssignmentsExcel, // 📊 تصدير إكسل
  setAssignmentsPrintScope, // 🖨️ تحديد نطاق الطباعة
  setShowAssignmentsPrintModal, // 🖨️ فتح الطباعة
  handleSaveEditedAssignment, // 💾 حفظ التعديل
  handleAssignTeacher, // 💾 حفظ التكليف
  handleBulkRemoveAssignments, // 🗑️ حذف جماعي
  handleOpenEditAssignment, // ✏️ فتح التعديل
  handleRemoveAssignment, // 🚫 إلغاء التكليف
  getStageNameInArabic, // 🏷️ اسم المرحلة
}) => {
  return (
    <div className="space-y-4" dir="rtl">
      {/* 📊 شريط إحصائيات التكليفات وشريط الإجراءات */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        {/* 🏷️ الهيدر والإحصائيات العلوية */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
              <ArrowRightLeft className="w-7 h-7 text-[#0F2942]" />
              <span>تكليفات الكادر التدريسي لقسم {deptName}</span>
            </h3>
            <p className="text-base sm:text-lg font-black text-slate-700 mt-1">
              إدارة توزيع المواد الدراسية وتكليف الأساتذة وتثبيت الصلاحيات الأكاديمية
            </p>
          </div>

          {/* 🏷️ إحصائيات التكليفات */}
          <div className="flex flex-wrap items-center gap-2.5 text-base font-black">
            <span className="bg-slate-100 text-slate-950 px-4 py-2 rounded-2xl border border-slate-300 shadow-2xs">
              إجمالي التكليفات: {deptTeacherCourses.length}
            </span>
            <span className="bg-blue-100 text-blue-950 px-4 py-2 rounded-2xl border border-blue-300 shadow-2xs">
              الأساتذة المكلفون: {new Set(deptTeacherCourses.map((tc) => tc.teacher_id)).size} أستاذ
            </span>
          </div>
        </div>

        {/* 🛠️ شريط أزرار العمليات المنسقة */}
        <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-3">
          {/* ➕ زر فتح كارت إضافة تكليف جديد */}
          <button
            type="button"
            onClick={() => {
              setEditingAssignment(null);
              setSelectedTeacherId('');
              setSelectedCourseId('');
              setIsAssignmentModalOpen(true);
            }}
            className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0 flex items-center gap-2.5"
            title="تكليف أستاذ بمادة دراسية جديدة"
          >
            <Plus className="w-5 h-5 text-cyan-300" />
            <span>تكليف أستاذ بمادة جديدة</span>
          </button>

          {/* 📊 زر تصدير جدول تكليفات التدريسيين إلى ملف Excel معتمد */}
          <button
            type="button"
            onClick={handleExportAssignmentsExcel}
            disabled={isExportingAssignmentsExcel}
            className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0 flex items-center gap-2.5 disabled:opacity-50"
            title="تصدير جدول تكليفات الكادر التدريسي لمواد القسم إلى ملف Excel"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            <span>{isExportingAssignmentsExcel ? 'جاري التصدير...' : selectedAssignmentIds.length > 0 ? `تصدير المحدد (${selectedAssignmentIds.length}) Excel` : 'تصدير التكليفات (Excel)'}</span>
          </button>

          {/* 🖨️ زر طباعة جدول تكليفات الكادر التدريسي المعتمد PDF */}
          <button
            type="button"
            onClick={() => {
              setAssignmentsPrintScope('filtered');
              setShowAssignmentsPrintModal(true);
            }}
            className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0 flex items-center gap-2.5"
            title="طباعة وتصدير جدول تكليفات الأساتذة PDF"
          >
            <Printer className="w-5 h-5 text-cyan-300" />
            <span>طباعة التكليفات (PDF)</span>
          </button>
        </div>
      </div>

      {/* 🪟 كارت CRUD موحد لإضافة وتعديل تكليف تدريسي */}
      <AssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => {
          setIsAssignmentModalOpen(false);
          setEditingAssignment(null);
          setSelectedTeacherId('');
          setSelectedCourseId('');
        }}
        editingAssignment={editingAssignment}
        deptName={deptName}
        deptTeachers={deptTeachers}
        deptCourses={deptCourses}
        deptTeacherCourses={deptTeacherCourses}
        selectedTeacherId={selectedTeacherId}
        setSelectedTeacherId={setSelectedTeacherId}
        selectedCourseId={selectedCourseId}
        setSelectedCourseId={setSelectedCourseId}
        selectedAssignRole={selectedAssignRole}
        setSelectedAssignRole={setSelectedAssignRole}
        isAssignTeacherDropdownOpen={isAssignTeacherDropdownOpen}
        setIsAssignTeacherDropdownOpen={setIsAssignTeacherDropdownOpen}
        assignTeacherButtonRef={assignTeacherButtonRef}
        assignTeacherCoords={assignTeacherCoords}
        handleToggleAssignTeacherDropdown={handleToggleAssignTeacherDropdown}
        assignTeacherSearchQuery={assignTeacherSearchQuery}
        setAssignTeacherSearchQuery={setAssignTeacherSearchQuery}
        isAssignCourseDropdownOpen={isAssignCourseDropdownOpen}
        setIsAssignCourseDropdownOpen={setIsAssignCourseDropdownOpen}
        assignCourseButtonRef={assignCourseButtonRef}
        assignCourseCoords={assignCourseCoords}
        handleToggleAssignCourseDropdown={handleToggleAssignCourseDropdown}
        assignCourseSearchQuery={assignCourseSearchQuery}
        setAssignCourseSearchQuery={setAssignCourseSearchQuery}
        handleSaveEditedAssignment={handleSaveEditedAssignment}
        handleAssignTeacher={handleAssignTeacher}
        getStageNameInArabic={getStageNameInArabic}
      />

      {/* 📋 جدول التكليفات الحالية */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        
        {/* 🎛️ شريط التحكم العلوي: فلاتر متعددة الأبعاد + قائمة منسدلة ذكية للأساتذة */}
        <div className="space-y-4 border-b border-slate-200 pb-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
                <Layers className="w-7 h-7 text-[#0F2942]" />
                <span>جدول التكليفات الدراسية المعتمدة ({deptTeacherCourses.length})</span>
              </h3>
              <p className="text-base sm:text-lg font-black text-slate-700 mt-1">
                قائمة الأساتذة والمقررات الدراسية المكلفين بتدريسها وتوثيق تواريخ التكليف الأكاديمي
              </p>
            </div>

            {/* 🔍 حقل البحث السريع في التكليفات */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4.5 h-4.5 absolute right-3.5 top-3.5 text-slate-700" />
              <input
                type="text"
                value={assignmentSearch}
                onChange={(e) => setAssignmentSearch(e.target.value)}
                placeholder="بحث باسم الأستاذ أو المادة..."
                className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-950 focus:border-slate-900 focus:outline-none shadow-2xs placeholder:text-slate-500 placeholder:font-bold"
              />
            </div>
          </div>

          {/* 🏷️ شريط فلاتر متناسق: صفان متوازنان هندسياً */}
          <div className="space-y-3 pt-1">
            
            {/* 🔹 السطر الأول: منسدلة اختيار الأستاذ المكلف + تبويبات المراحل الدراسية */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* 1. قائمة منسدلة تفاعلية ذكية لاختيار وتصفية الأستاذ المكلف */}
              <div className="relative">
                <button
                  ref={filterTeacherButtonRef}
                  type="button"
                  onClick={handleToggleFilterTeacherDropdown}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 border-2 border-slate-300 hover:border-[#0F2942] rounded-2xl text-slate-950 font-black text-sm sm:text-base flex items-center justify-between gap-3 shadow-2xs transition-all cursor-pointer min-w-[260px]"
                  title="تصفية التكليفات حسب الأستاذ المكلف"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-lg bg-[#0F2942] text-cyan-300 flex items-center justify-center shrink-0 shadow-2xs">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="font-black text-slate-950 text-sm sm:text-base truncate">
                      {filterAssignmentTeacher === 'all' 
                        ? 'كافة الأساتذة المكلفين' 
                        : (deptTeachers.find((t) => t.id === filterAssignmentTeacher)?.full_name || 'أستاذ غير معروف')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-black bg-blue-100 text-blue-950 border border-blue-200">
                      {filterAssignmentTeacher === 'all' 
                        ? deptTeacherCourses.length 
                        : deptTeacherCourses.filter((tc) => tc.teacher_id === filterAssignmentTeacher).length}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-900 transition-transform duration-200 ${isFilterTeacherDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                  </div>
                </button>

                {/* 📋 القائمة المنسدلة الاحترافية العائمة عبر Portal */}
                {isFilterTeacherDropdownOpen && filterTeacherCoords && typeof document !== 'undefined' && createPortal(
                  <>
                    <div 
                      className="fixed inset-0 z-[999999]" 
                      onClick={() => {
                        setIsFilterTeacherDropdownOpen(false);
                        setFilterTeacherSearchQuery('');
                      }} 
                    />
                    <div 
                      style={{
                        position: 'fixed',
                        ...(filterTeacherCoords.openUpwards
                          ? { bottom: `${filterTeacherCoords.bottom}px` }
                          : { top: `${filterTeacherCoords.top}px` }),
                        left: `${filterTeacherCoords.left}px`,
                        width: `${Math.max(280, filterTeacherCoords.width)}px`,
                        maxHeight: `${filterTeacherCoords.maxHeight}px`,
                      }}
                      className="bg-white border-2 border-slate-400 rounded-2xl shadow-2xl overflow-hidden z-[999999] flex flex-col p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150"
                      dir="rtl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative shrink-0">
                        <Search className="w-4 h-4 absolute right-3 top-3 text-slate-900" />
                        <input
                          type="text"
                          value={filterTeacherSearchQuery}
                          onChange={(e) => setFilterTeacherSearchQuery(e.target.value)}
                          placeholder="بحث سريع باسم التدريسي..."
                          className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-400 rounded-xl text-sm font-black text-slate-950 placeholder:text-slate-500 focus:border-slate-900 focus:outline-none"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div className="overflow-y-auto space-y-1 flex-1 min-h-0 pr-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setFilterAssignmentTeacher('all');
                            setIsFilterTeacherDropdownOpen(false);
                            setFilterTeacherSearchQuery('');
                          }}
                          className={`w-full p-2.5 rounded-xl text-right font-black text-sm sm:text-base transition flex items-center justify-between cursor-pointer border ${
                            filterAssignmentTeacher === 'all'
                              ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                              : 'text-slate-950 hover:bg-slate-100 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>كافة الأساتذة المكلفين</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-black ${
                              filterAssignmentTeacher === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950'
                            }`}>
                              {deptTeacherCourses.length}
                            </span>
                            {filterAssignmentTeacher === 'all' && <Check className="w-4 h-4 text-cyan-300 stroke-[3]" />}
                          </div>
                        </button>

                        {deptTeachers
                          .filter((t) => {
                            if (!filterTeacherSearchQuery) return true;
                            return t.full_name.toLowerCase().includes(filterTeacherSearchQuery.toLowerCase());
                          })
                          .map((t) => {
                            const count = deptTeacherCourses.filter((tc) => tc.teacher_id === t.id).length;
                            const isSelected = filterAssignmentTeacher === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  setFilterAssignmentTeacher(t.id);
                                  setIsFilterTeacherDropdownOpen(false);
                                  setFilterTeacherSearchQuery('');
                                }}
                                className={`w-full p-2.5 rounded-xl text-right font-black text-sm sm:text-base transition flex items-center justify-between cursor-pointer border ${
                                  isSelected
                                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                                    : 'text-slate-950 hover:bg-slate-100 border-transparent'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950'
                                  }`}>
                                    {t.full_name.charAt(0)}
                                  </div>
                                  <span className="truncate">{t.full_name}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 mr-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-black ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-950 border border-blue-200'
                                  }`}>
                                    {count} مواد
                                  </span>
                                  {isSelected && <Check className="w-4 h-4 text-cyan-300 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </>,
                  document.body
                )}
              </div>

              {/* 2. أزرار تصفية المراحل الدراسية */}
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-slate-950 whitespace-nowrap">المرحلة:</span>
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-300 gap-1 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => setFilterAssignmentStage('all')}
                    className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      filterAssignmentStage === 'all'
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span>كافة المراحل</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                      filterAssignmentStage === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {deptTeacherCourses.length}
                    </span>
                  </button>

                  {[
                    { num: 1, name: 'الأولى' },
                    { num: 2, name: 'الثانية' },
                    { num: 3, name: 'الثالثة' },
                    { num: 4, name: 'الرابعة' },
                  ].map((st) => {
                    const count = deptTeacherCourses.filter((tc) => {
                      const course = courses.find((c) => c.id === tc.course_id);
                      return (course?.stage_number || 1) === st.num;
                    }).length;
                    return (
                      <button
                        key={st.num}
                        type="button"
                        onClick={() => setFilterAssignmentStage(st.num)}
                        className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                          filterAssignmentStage === st.num
                            ? 'bg-[#0F2942] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-white'
                        }`}
                      >
                        <span>المرحلة {st.name}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                          filterAssignmentStage === st.num ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 🔹 السطر الثاني: تبويبات الكورس الدراسي + تبويبات طبيعة التكليف الأكاديمي */}
            <div className="flex flex-wrap items-center justify-start gap-4 sm:gap-6">
              {/* 3. تصفية الكورس الدراسي */}
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-slate-950 whitespace-nowrap">الكورس:</span>
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-300 gap-1 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => setFilterAssignmentSemester('all')}
                    className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      filterAssignmentSemester === 'all'
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span>كافة الكورسات</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                      filterAssignmentSemester === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {deptTeacherCourses.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterAssignmentSemester(1)}
                    className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      filterAssignmentSemester === 1
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span>الكورس الأول</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                      filterAssignmentSemester === 1 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {deptTeacherCourses.filter((tc) => (tc.semester || 1) === 1).length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterAssignmentSemester(2)}
                    className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      filterAssignmentSemester === 2
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span>الكورس الثاني</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                      filterAssignmentSemester === 2 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {deptTeacherCourses.filter((tc) => (tc.semester || 1) === 2).length}
                    </span>
                  </button>
                </div>
              </div>

              {/* 4. تصفية طبيعة التكليف الأكاديمي */}
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-slate-950 whitespace-nowrap">طبيعة التكليف:</span>
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-300 gap-1 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => setFilterAssignmentRole('all')}
                    className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      filterAssignmentRole === 'all'
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span>كافة التكليفات</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                      filterAssignmentRole === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {deptTeacherCourses.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterAssignmentRole('theory')}
                    className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      filterAssignmentRole === 'theory'
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <BookOpen className={`w-3.5 h-3.5 ${filterAssignmentRole === 'theory' ? 'text-cyan-300' : 'text-slate-600'}`} />
                    <span>مكلف نظري فقط</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                      filterAssignmentRole === 'theory' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {deptTeacherCourses.filter((tc) => tc.role_in_course === 'theory' || !tc.role_in_course).length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterAssignmentRole('practical')}
                    className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      filterAssignmentRole === 'practical'
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <FlaskConical className={`w-3.5 h-3.5 ${filterAssignmentRole === 'practical' ? 'text-cyan-300' : 'text-slate-600'}`} />
                    <span>مكلف عملي فقط</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                      filterAssignmentRole === 'practical' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {deptTeacherCourses.filter((tc) => tc.role_in_course === 'practical').length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterAssignmentRole('both')}
                    className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      filterAssignmentRole === 'both'
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <Layers className={`w-3.5 h-3.5 ${filterAssignmentRole === 'both' ? 'text-cyan-300' : 'text-slate-600'}`} />
                    <span>مكلف نظري وعملي</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                      filterAssignmentRole === 'both' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {deptTeacherCourses.filter((tc) => tc.role_in_course === 'both').length}
                    </span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 🔘 شريط الإجراءات الجماعية العائم للتكليفات المحددة */}
        {selectedAssignmentIds.length > 0 && (
          <div className="p-4 bg-[#0F2942] text-white border border-[#163a5f] rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 text-cyan-300 rounded-xl border border-cyan-400/30">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span className="font-black text-white text-base">
                تم تحديد <strong className="text-cyan-300 font-mono text-lg font-black">({selectedAssignmentIds.length})</strong> تكليفات أكاديمية
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportAssignmentsExcel}
                disabled={isExportingAssignmentsExcel}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                title="تصدير التكليفات المحددة إلى ملف Excel"
              >
                <FileSpreadsheet className="w-4.5 h-4.5" />
                <span>{isExportingAssignmentsExcel ? 'جاري التصدير...' : `تصدير المحدد (${selectedAssignmentIds.length}) Excel`}</span>
              </button>
              <button
                type="button"
                onClick={handleBulkRemoveAssignments}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <UserMinus className="w-4.5 h-4.5" />
                <span>إلغاء التكليفات المحددة ({selectedAssignmentIds.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedAssignmentIds([])}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-black text-sm transition cursor-pointer"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        )}
        
        {filteredTeacherCourses.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-200 text-slate-950 font-black text-base space-y-2">
            <Layers className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-lg font-black text-slate-950">لا توجد تكليفات مطابقة للبحث أو التصفية الحالية.</p>
            <p className="text-base font-black text-slate-600">يمكنك تكليف أستاذ بمادة جديدة أو تعديل معايير التصفية المختارة أعلاه.</p>
          </div>
        ) : (
          <>
          <div className="overflow-x-auto rounded-2xl border border-slate-300 shadow-xs bg-white">
            <table className="w-full text-right border-collapse text-base font-black whitespace-nowrap">
              <thead>
                <tr className="bg-[#0F2942] text-white font-black text-base whitespace-nowrap border-b border-[#0F2942]">
                  <th className="p-4 text-center text-base w-12 whitespace-nowrap text-white">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={filteredTeacherCourses.length > 0 && filteredTeacherCourses.every((tc) => selectedAssignmentIds.includes(tc.id))}
                      onClick={() => {
                        const isAllSelected = filteredTeacherCourses.length > 0 && filteredTeacherCourses.every((tc) => selectedAssignmentIds.includes(tc.id));
                        if (!isAllSelected) {
                          const visibleIds = filteredTeacherCourses.map((tc) => tc.id);
                          setSelectedAssignmentIds(Array.from(new Set([...selectedAssignmentIds, ...visibleIds])));
                        } else {
                          const visibleIds = new Set(filteredTeacherCourses.map((tc) => tc.id));
                          setSelectedAssignmentIds(selectedAssignmentIds.filter((id) => !visibleIds.has(id)));
                        }
                      }}
                      className={`w-6 h-6 rounded-lg transition-all flex items-center justify-center cursor-pointer mx-auto shadow-md border-2 ${
                        filteredTeacherCourses.length > 0 && filteredTeacherCourses.every((tc) => selectedAssignmentIds.includes(tc.id))
                          ? 'bg-white text-[#0F2942] border-white ring-2 ring-white/70'
                          : 'bg-white text-[#0F2942] border-white hover:bg-slate-100 ring-2 ring-white/40'
                      }`}
                      title="تحديد كافة التكليفات المعروضة"
                      aria-label="تحديد كافة التكليفات المعروضة"
                    >
                      {filteredTeacherCourses.length > 0 && filteredTeacherCourses.every((tc) => selectedAssignmentIds.includes(tc.id)) ? (
                        <Check className="w-4 h-4 stroke-[3.5] text-[#0F2942]" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-xs bg-transparent" />
                      )}
                    </button>
                  </th>
                  <th className="p-4 text-center text-base w-16 whitespace-nowrap text-white font-black">ت</th>
                  <th className="p-4 text-right text-base sm:text-lg whitespace-nowrap text-white font-black">اسم الأستاذ المكلف</th>
                  <th className="p-4 text-right text-base sm:text-lg whitespace-nowrap text-white font-black">المادة المكلف بها</th>
                  <th className="p-4 text-center text-base whitespace-nowrap text-white font-black">طبيعة التكليف</th>
                  <th className="p-4 text-center text-base whitespace-nowrap text-white font-black">المرحلة</th>
                  <th className="p-4 text-center text-base whitespace-nowrap text-white font-black">الكورس</th>
                  <th className="p-4 text-center text-base whitespace-nowrap text-white font-black">تاريخ التكليف</th>
                  <th className="p-4 text-center text-base whitespace-nowrap text-white font-black">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-black text-slate-950 text-base whitespace-nowrap">
                {(() => {
                  const totalAssignmentsCount = filteredTeacherCourses.length;
                  const safeAssignmentPage = Math.max(1, Math.min(assignmentPage, Math.max(1, Math.ceil(totalAssignmentsCount / assignmentPageSize))));
                  const assignmentStartIndex = (safeAssignmentPage - 1) * assignmentPageSize;
                  const paginatedTeacherCourses = filteredTeacherCourses.slice(assignmentStartIndex, assignmentStartIndex + assignmentPageSize);

                  return paginatedTeacherCourses.map((tc, index) => {
                    const actualIndex = assignmentStartIndex + index;
                    const isSelected = selectedAssignmentIds.includes(tc.id);
                    const courseInfo = courses.find((c) => c.id === tc.course_id);
                    const stageArabic = courseInfo ? `المرحلة ${getStageNameInArabic(courseInfo.stage_number || 1)}` : '—';

                    return (
                      <tr key={tc.id} className={`transition ${isSelected ? 'bg-blue-50/70 ring-1 ring-blue-300' : 'hover:bg-slate-50'} whitespace-nowrap`}>
                        <td className="p-4 text-center whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedAssignmentIds(selectedAssignmentIds.filter((id) => id !== tc.id));
                              } else {
                                setSelectedAssignmentIds([...selectedAssignmentIds, tc.id]);
                              }
                            }}
                            className="w-5 h-5 rounded-md text-[#0F2942] focus:ring-[#0F2942] cursor-pointer"
                            aria-label={`تحديد تكليف ${tc.teacher_name}`}
                          />
                        </td>

                        <td className="p-4 text-center font-black text-slate-950 text-base whitespace-nowrap">
                          <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-300 text-slate-950 font-black text-sm shadow-2xs">
                            {actualIndex + 1}
                          </span>
                        </td>

                        <td className="p-4 font-black text-slate-950 text-base sm:text-lg whitespace-nowrap">
                          <span className="inline-flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#0F2942]/10 text-[#0F2942] flex items-center justify-center shrink-0 border border-[#0F2942]/20">
                              <Users className="w-4.5 h-4.5 text-[#0F2942]" />
                            </div>
                            <span className="text-slate-950 font-black text-base sm:text-lg">{tc.teacher_name}</span>
                          </span>
                        </td>

                        <td className="p-4 font-black text-slate-950 text-base sm:text-lg whitespace-nowrap">
                          <span className="inline-flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center shrink-0 border border-indigo-200">
                              <BookOpen className="w-4.5 h-4.5 text-indigo-700" />
                            </div>
                            <span className="text-slate-950 font-black text-base sm:text-lg">{tc.course_name}</span>
                          </span>
                        </td>

                        <td className="p-4 text-center whitespace-nowrap">
                          <span className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black border shadow-2xs whitespace-nowrap inline-flex items-center gap-1.5 ${
                            tc.role_in_course === 'practical'
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                              : tc.role_in_course === 'both'
                              ? 'bg-purple-100 text-purple-950 border-purple-300'
                              : 'bg-blue-100 text-blue-950 border-blue-300'
                          }`}>
                            {tc.role_in_course === 'practical' ? (
                              <>
                                <FlaskConical className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                                <span>مكلف عملي فقط</span>
                              </>
                            ) : tc.role_in_course === 'both' ? (
                              <>
                                <Layers className="w-3.5 h-3.5 text-purple-800 shrink-0" />
                                <span>مكلف نظري وعملي</span>
                              </>
                            ) : (
                              <>
                                <BookOpen className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                                <span>مكلف نظري فقط</span>
                              </>
                            )}
                          </span>
                        </td>

                        <td className="p-4 text-center whitespace-nowrap">
                          <span className="px-3.5 py-1.5 rounded-xl text-sm sm:text-base font-black bg-slate-100 text-slate-950 border border-slate-300 shadow-2xs whitespace-nowrap inline-block">
                            {stageArabic}
                          </span>
                        </td>

                        <td className="p-4 text-center whitespace-nowrap">
                          <span className={`px-3.5 py-1.5 rounded-xl text-sm sm:text-base font-black border shadow-2xs whitespace-nowrap ${
                            tc.semester === 2 
                              ? 'bg-teal-50 text-teal-950 border-teal-300' 
                              : 'bg-[#0F2942]/10 text-[#0F2942] border-[#0F2942]/25'
                          }`}>
                            الكورس {tc.semester === 2 ? 'الثاني' : 'الأول'}
                          </span>
                        </td>

                        <td className="p-4 text-center whitespace-nowrap">
                          <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-950 font-mono font-black text-sm sm:text-base inline-block shadow-2xs">
                            {new Date(tc.created_at || Date.now()).toLocaleDateString('ar-IQ-u-nu-latn')}
                          </span>
                        </td>

                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAssignment(tc)}
                              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-[#0F2942] font-black rounded-xl transition text-sm cursor-pointer border border-slate-300 shadow-2xs hover:shadow-md active:scale-95 inline-flex items-center justify-center gap-1.5"
                              title="تعديل هذا التكليف الأكاديمي"
                            >
                              <Edit3 className="w-4 h-4 text-[#0F2942] shrink-0" />
                              <span>تعديل</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveAssignment(tc.id)}
                              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl transition text-sm cursor-pointer border border-rose-500 shadow-2xs hover:shadow-md active:scale-95 inline-flex items-center justify-center gap-1.5"
                              title="إلغاء تكليف الأستاذ بهذه المادة"
                            >
                              <UserMinus className="w-4 h-4 text-white shrink-0" />
                              <span>إلغاء</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <AdminPagination
              currentPage={Math.max(1, Math.min(assignmentPage, Math.max(1, Math.ceil(filteredTeacherCourses.length / assignmentPageSize))))}
              totalItems={filteredTeacherCourses.length}
              pageSize={assignmentPageSize}
              onPageChange={(page) => setAssignmentPage(page)}
              onPageSizeChange={(size) => {
                setAssignmentPageSize(size);
                setAssignmentPage(1);
              }}
              itemLabel="تكليف"
            />
          </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DepartmentAssignmentsTab; // 🚀 تصدير المكون
