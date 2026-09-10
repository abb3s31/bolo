'use client'; // ⚡ واجهة تفاعلية على متصفح العميل في Next.js

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import { createPortal } from 'react-dom'; // 🚪 بورتال لرسم القوائم المنسدلة في قمة المستند
import {
  ArrowRightLeft, // 🔄 أيقونة التكليف الأكاديمي
  Edit3, // ✏️ أيقونة التعديل
  Save, // 💾 أيقونة حفظ التعديل
  CheckCircle2, // ✅ أيقونة تثبيت التكليف
  Users, // 👥 أيقونة الأساتذة
  ChevronDown, // 🔽 أيقونة القائمة المنسدلة
  Search, // 🔍 أيقونة البحث
  Check, // ✔️ أيقونة الاختيار
  BookOpen, // 📖 أيقونة المادة الدراسية
  FlaskConical, // 🧪 أيقونة المختبر والعملي
  Layers, // 📚 أيقونة التكليف المشترك نظري وعملي
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { UserProfile, Course, TeacherCourse } from '@/types'; // 🏷️ استيراد الأنواع الصارمة
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 المودال العائم الفاخر

// 📋 واجهة خصائص مودال إضافة وتعديل تكليفات الأساتذة
export interface AssignmentModalProps {
  isOpen: boolean; // 📂 حالة فتح النافذة
  onClose: () => void; // 🛑 دالة إغلاق النافذة
  editingAssignment: TeacherCourse | null; // ✍️ التكليف الجاري تعديله أو null للإضافة
  deptName: string; // 🏢 اسم القسم العلمي
  deptTeachers: UserProfile[]; // 👨‍🏫 أساتذة القسم
  deptCourses: Course[]; // 📚 مواد القسم
  deptTeacherCourses: TeacherCourse[]; // 📋 كافة تكليفات القسم
  selectedTeacherId: string; // 🆔 معرف الأستاذ المختار
  setSelectedTeacherId: (id: string) => void; // 🔄 تحديث الأستاذ المختار
  selectedCourseId: string; // 🆔 معرف المادة المختارة
  setSelectedCourseId: (id: string) => void; // 🔄 تحديث المادة المختارة
  selectedAssignRole: 'theory' | 'practical' | 'both'; // 🏷️ طبيعة التكليف
  setSelectedAssignRole: (role: 'theory' | 'practical' | 'both') => void; // 🔄 تحديث طبيعة التكليف
  isAssignTeacherDropdownOpen: boolean; // 🔽 فتح دروب داون الأساتذة
  setIsAssignTeacherDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل دروب داون الأساتذة
  assignTeacherButtonRef: React.RefObject<HTMLButtonElement | null>; // 🔗 مرجع زر دروب داون الأساتذة
  assignTeacherCoords: { top?: number; bottom?: number; left: number; width: number; maxHeight: number; openUpwards: boolean } | null; // 📐 إحداثيات دروب داون الأساتذة
  handleToggleAssignTeacherDropdown: () => void; // 🔄 فتح/غلق دروب داون الأساتذة
  assignTeacherSearchQuery: string; // 🔍 بحث دروب داون الأساتذة
  setAssignTeacherSearchQuery: (q: string) => void; // 🔄 تحديث بحث الأساتذة
  isAssignCourseDropdownOpen: boolean; // 🔽 فتح دروب داون المواد
  setIsAssignCourseDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل دروب داون المواد
  assignCourseButtonRef: React.RefObject<HTMLButtonElement | null>; // 🔗 مرجع زر دروب داون المواد
  assignCourseCoords: { top?: number; bottom?: number; left: number; width: number; maxHeight: number; openUpwards: boolean } | null; // 📐 إحداثيات دروب داون المواد
  handleToggleAssignCourseDropdown: () => void; // 🔄 فتح/غلق دروب داون المواد
  assignCourseSearchQuery: string; // 🔍 بحث دروب داون المواد
  setAssignCourseSearchQuery: (q: string) => void; // 🔄 تحديث بحث المواد
  handleSaveEditedAssignment: (e: React.FormEvent) => void; // 💾 دالة حفظ تعديل التكليف
  handleAssignTeacher: (e: React.FormEvent) => void; // 💾 دالة إضافة تكليف جديد
  getStageNameInArabic: (stg: number) => string; // 🏷️ اسم المرحلة بالعربية
}

// 🏛️ مكون النافذة المنبثقة لإضافة وتعديل تكليف أستاذ بمادة دراسية
export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen, // 📂 حالة الفتح
  onClose, // 🛑 دالة الإغلاق
  editingAssignment, // ✍️ التكليف للتعديل
  deptName, // 🏢 اسم القسم
  deptTeachers, // 👨‍🏫 أساتذة القسم
  deptCourses, // 📚 مواد القسم
  deptTeacherCourses, // 📋 تكليفات القسم
  selectedTeacherId, // 🆔 الأستاذ المختار
  setSelectedTeacherId, // 🔄 تحديث الأستاذ
  selectedCourseId, // 🆔 المادة المختارة
  setSelectedCourseId, // 🔄 تحديث المادة
  selectedAssignRole, // 🏷️ طبيعة التكليف
  setSelectedAssignRole, // 🔄 تحديث طبيعة التكليف
  isAssignTeacherDropdownOpen, // 🔽 دروب داون الأساتذة
  setIsAssignTeacherDropdownOpen, // 🔄 تبديل دروب داون الأساتذة
  assignTeacherButtonRef, // 🔗 مرجع زر الأساتذة
  assignTeacherCoords, // 📐 إحداثيات دروب داون الأساتذة
  handleToggleAssignTeacherDropdown, // 🔄 فتح/غلق دروب داون الأساتذة
  assignTeacherSearchQuery, // 🔍 بحث الأساتذة
  setAssignTeacherSearchQuery, // 🔄 تحديث بحث الأساتذة
  isAssignCourseDropdownOpen, // 🔽 دروب داون المواد
  setIsAssignCourseDropdownOpen, // 🔄 تبديل دروب داون المواد
  assignCourseButtonRef, // 🔗 مرجع زر المواد
  assignCourseCoords, // 📐 إحداثيات دروب داون المواد
  handleToggleAssignCourseDropdown, // 🔄 فتح/غلق دروب داون المواد
  assignCourseSearchQuery, // 🔍 بحث المواد
  setAssignCourseSearchQuery, // 🔄 تحديث بحث المواد
  handleSaveEditedAssignment, // 💾 حفظ التعديل
  handleAssignTeacher, // 💾 إضافة التكليف
  getStageNameInArabic, // 🏷️ اسم المرحلة
}) => {
  // 🛑 التحقق من حالة الفتح
  if (!isOpen) return null;

  return (
    // 📝 كارت CRUD عائم فوق الكل لإضافة وتعديل تكليف تدريسي
    <FloatingCrudModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAssignment ? 'تعديل التكليف الأكاديمي' : 'تكليف أستاذ بتدريس مادة معينة'}
      subtitle={
        editingAssignment
          ? 'تعديل الأستاذ المكلف أو تغيير المقرر الدراسي المخصص مع تحديث الصلاحيات الأكاديمية فوراً'
          : `ربط وتكليف أستاذ من كادر قسم ${deptName} بمقرر دراسي معتمد ومنحه صلاحيات رصد الدرجات`
      }
      icon={editingAssignment ? <Edit3 className="w-6 h-6" /> : <ArrowRightLeft className="w-6 h-6" />}
      maxWidth="max-w-2xl"
      onSubmit={editingAssignment ? handleSaveEditedAssignment : handleAssignTeacher}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-white hover:bg-[#0F2942] hover:text-white text-[#0F2942] font-black rounded-2xl text-sm transition cursor-pointer border-2 border-[#0F2942] shadow-2xs active:scale-95"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-sm shadow-md transition flex items-center gap-2 cursor-pointer border border-[#0F2942] active:scale-95 whitespace-nowrap"
          >
            {editingAssignment ? (
              <>
                <Save className="w-4 h-4 text-emerald-300" />
                <span>حفظ التعديل الأكاديمي</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>تثبيت التكليف الأكاديمي</span>
              </>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-5 text-base font-black">
        <div className="space-y-4">
          
          {/* 👨‍🏫 القائمة المنسدلة التفاعلية الفاخرة لاختيار الأستاذ المكلف */}
          <div className="space-y-2">
            <label className="block text-slate-950 font-black text-base">اختر الأستاذ المكلف *</label>
            <div>
              <button
                ref={assignTeacherButtonRef}
                type="button"
                onClick={handleToggleAssignTeacherDropdown}
                className="w-full px-4 py-3.5 bg-white hover:bg-slate-50 border-2 border-slate-400 hover:border-[#0F2942] focus:border-[#0F2942] rounded-2xl text-slate-950 font-black text-base focus:outline-none flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-9 h-9 rounded-xl bg-[#0F2942] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    <Users className="w-4 h-4 text-cyan-300" />
                  </div>
                  {selectedTeacherId ? (
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-black text-slate-950 text-base">
                        {deptTeachers.find((t) => t.id === selectedTeacherId)?.full_name}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-950 text-xs font-black border border-blue-200 shrink-0">
                        {deptTeacherCourses.filter((tc) => tc.teacher_id === selectedTeacherId).length} مواد مكلف بها
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-950 font-black text-base">-- انقر لاختيار الأستاذ من كادر القسم --</span>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-900 transition-transform duration-200 shrink-0 ${isAssignTeacherDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
              </button>

              {/* 📋 القائمة المنسدلة الاحترافية العائمة عبر Portal */}
              {isAssignTeacherDropdownOpen && assignTeacherCoords && typeof document !== 'undefined' && createPortal(
                <>
                  <div 
                    className="fixed inset-0 z-[9999998]" 
                    onClick={() => {
                      setIsAssignTeacherDropdownOpen(false);
                      setAssignTeacherSearchQuery('');
                    }} 
                  />
                  <div 
                    style={{
                      position: 'fixed',
                      ...(assignTeacherCoords.openUpwards
                        ? { bottom: `${assignTeacherCoords.bottom}px` }
                        : { top: `${assignTeacherCoords.top}px` }),
                      left: `${assignTeacherCoords.left}px`,
                      width: `${assignTeacherCoords.width}px`,
                      maxHeight: `${assignTeacherCoords.maxHeight}px`,
                    }}
                    className="bg-white border-2 border-slate-400 rounded-2xl shadow-2xl overflow-hidden z-[9999999] flex flex-col p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150"
                    dir="rtl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 🔍 حقل البحث السريع داخل قائمة الأساتذة */}
                    <div className="relative shrink-0">
                      <Search className="w-4 h-4 absolute right-3 top-3 text-slate-900" />
                      <input
                        type="text"
                        value={assignTeacherSearchQuery}
                        onChange={(e) => setAssignTeacherSearchQuery(e.target.value)}
                        placeholder="بحث سريع بالاسم..."
                        className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-400 rounded-xl text-sm font-black text-slate-950 placeholder:text-slate-950 placeholder:font-black focus:border-slate-900 focus:outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="overflow-y-auto space-y-1 flex-1 min-h-0 pr-0.5">
                      {deptTeachers
                        .filter((t) => !assignTeacherSearchQuery || t.full_name.toLowerCase().includes(assignTeacherSearchQuery.toLowerCase()))
                        .map((t) => {
                          const count = deptTeacherCourses.filter((tc) => tc.teacher_id === t.id).length;
                          const isSelected = selectedTeacherId === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                setSelectedTeacherId(t.id);
                                setIsAssignTeacherDropdownOpen(false);
                                setAssignTeacherSearchQuery('');
                              }}
                              className={`w-full p-2.5 rounded-xl text-right font-black text-base transition flex items-center justify-between cursor-pointer border ${
                                isSelected
                                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                                  : 'text-slate-950 hover:bg-slate-100 border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950'
                                }`}>
                                  {t.full_name.charAt(0)}
                                </div>
                                <div className="truncate text-right">
                                  <div className={`text-sm sm:text-base font-black truncate ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                                    {t.full_name}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 mr-2">
                                <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-black ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-950 border border-blue-200'
                                }`}>
                                  {count} مواد
                                </span>
                                {isSelected && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                              </div>
                            </button>
                          );
                        })}
                      {deptTeachers.filter((t) => !assignTeacherSearchQuery || t.full_name.toLowerCase().includes(assignTeacherSearchQuery.toLowerCase())).length === 0 && (
                        <div className="text-center py-4 text-sm font-black text-slate-950">
                          لا يوجد تدريسي مطابق لبحثك
                        </div>
                      )}
                    </div>
                  </div>
                </>,
                document.body
              )}
            </div>
          </div>

          {/* 📚 القائمة المنسدلة التفاعلية الفاخرة لاختيار المادة الدراسية */}
          <div className="space-y-2">
            <label className="block text-slate-950 font-black text-base">اختر المادة الدراسية *</label>
            <div>
              <button
                ref={assignCourseButtonRef}
                type="button"
                onClick={handleToggleAssignCourseDropdown}
                className="w-full px-4 py-3.5 bg-white hover:bg-slate-50 border-2 border-slate-400 hover:border-[#0F2942] focus:border-[#0F2942] rounded-2xl text-slate-950 font-black text-base focus:outline-none flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-9 h-9 rounded-xl bg-[#0F2942] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    <BookOpen className="w-4 h-4 text-cyan-300" />
                  </div>
                  {selectedCourseId ? (
                    (() => {
                      const selC = deptCourses.find((c) => c.id === selectedCourseId);
                      if (!selC) return <span className="text-slate-950 font-black text-base">-- انقر لاختيار المادة الدراسية --</span>;
                      return (
                        <div className="flex items-center gap-2 truncate flex-wrap text-slate-950 font-black">
                          <span className="font-black text-slate-950 text-base truncate">{selC.name}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-950 font-mono text-xs font-black">
                            {selC.code}
                          </span>
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-950 text-xs sm:text-sm font-black border border-slate-300 shadow-2xs">
                            المرحلة {getStageNameInArabic(selC.stage_number || 1)}
                          </span>
                          <span className="px-2.5 py-1 rounded-xl bg-blue-100 text-blue-950 text-xs sm:text-sm font-black border border-blue-300 shadow-2xs">
                            {selC.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول'}
                          </span>
                        </div>
                      );
                    })()
                  ) : (
                    <span className="text-slate-950 font-black text-base">-- انقر لاختيار المادة الدراسية من القسم --</span>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-900 transition-transform duration-200 shrink-0 ${isAssignCourseDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
              </button>

              {/* 📋 القائمة المنسدلة الاحترافية العائمة عبر Portal */}
              {isAssignCourseDropdownOpen && assignCourseCoords && typeof document !== 'undefined' && createPortal(
                <>
                  <div 
                    className="fixed inset-0 z-[9999998]" 
                    onClick={() => {
                      setIsAssignCourseDropdownOpen(false);
                      setAssignCourseSearchQuery('');
                    }} 
                  />
                  <div 
                    style={{
                      position: 'fixed',
                      ...(assignCourseCoords.openUpwards
                        ? { bottom: `${assignCourseCoords.bottom}px` }
                        : { top: `${assignCourseCoords.top}px` }),
                      left: `${assignCourseCoords.left}px`,
                      width: `${assignCourseCoords.width}px`,
                      maxHeight: `${assignCourseCoords.maxHeight}px`,
                    }}
                    className="bg-white border-2 border-slate-400 rounded-2xl shadow-2xl overflow-hidden z-[9999999] flex flex-col p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150"
                    dir="rtl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 🔍 حقل البحث السريع داخل قائمة المواد */}
                    <div className="relative shrink-0">
                      <Search className="w-4 h-4 absolute right-3 top-3 text-slate-900" />
                      <input
                        type="text"
                        value={assignCourseSearchQuery}
                        onChange={(e) => setAssignCourseSearchQuery(e.target.value)}
                        placeholder="بحث سريع باسم أو رمز المادة..."
                        className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-400 rounded-xl text-sm font-black text-slate-950 placeholder:text-slate-950 placeholder:font-black focus:border-slate-900 focus:outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="overflow-y-auto space-y-1 flex-1 min-h-0 pr-0.5">
                      {deptCourses
                        .filter((c) => {
                          if (!assignCourseSearchQuery) return true;
                          const q = assignCourseSearchQuery.toLowerCase();
                          const stageName = `المرحلة ${getStageNameInArabic(c.stage_number || 1)}`;
                          const semName = c.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول';
                          return (
                            c.name.toLowerCase().includes(q) ||
                            (c.code && c.code.toLowerCase().includes(q)) ||
                            stageName.includes(q) ||
                            semName.includes(q) ||
                            `مرحلة ${c.stage_number}`.includes(q) ||
                            `كورس ${c.semester}`.includes(q)
                          );
                        })
                        .map((c) => {
                          const isSelected = selectedCourseId === c.id;
                          const stageArabic = `المرحلة ${getStageNameInArabic(c.stage_number || 1)}`;
                          const semArabic = c.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول';

                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedCourseId(c.id);
                                setIsAssignCourseDropdownOpen(false);
                                setAssignCourseSearchQuery('');
                              }}
                              className={`w-full p-2.5 rounded-xl text-right font-black text-base transition flex items-center justify-between cursor-pointer border ${
                                isSelected
                                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                                  : 'text-slate-950 hover:bg-slate-100 border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <div className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-800'
                                }`}>
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <div className="truncate text-right">
                                  <div className={`text-sm sm:text-base font-black truncate ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                                    {c.name}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-md ${
                                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950 font-bold'
                                    }`}>
                                      {c.code}
                                    </span>
                                    <span className={`text-xs sm:text-sm font-black ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                                      {stageArabic}
                                    </span>
                                    <span className={isSelected ? 'text-white/60' : 'text-slate-400'}>•</span>
                                    <span className={`text-xs sm:text-sm font-black ${isSelected ? 'text-cyan-200' : 'text-slate-950'}`}>
                                      {semArabic}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 mr-2">
                                <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-black ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                                }`}>
                                  {c.credit_hours || 3} ECTS
                                </span>
                                {isSelected && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                              </div>
                            </button>
                          );
                        })}
                      {deptCourses.filter((c) => {
                        if (!assignCourseSearchQuery) return true;
                        const q = assignCourseSearchQuery.toLowerCase();
                        const stageName = `المرحلة ${getStageNameInArabic(c.stage_number || 1)}`;
                        const semName = c.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول';
                        return (
                          c.name.toLowerCase().includes(q) ||
                          (c.code && c.code.toLowerCase().includes(q)) ||
                          stageName.includes(q) ||
                          semName.includes(q) ||
                          `مرحلة ${c.stage_number}`.includes(q) ||
                          `كورس ${c.semester}`.includes(q)
                        );
                      }).length === 0 && (
                        <div className="text-center py-4 text-sm font-black text-slate-950">
                          لا توجد مادة مطابقة لبحثك
                        </div>
                      )}
                    </div>
                  </div>
                </>,
                document.body
              )}
            </div>
          </div>

          {/* 🏷️ طبيعة التكليف الأكاديمي (نظري / عملي / كلاهما) */}
          <div className="space-y-2">
            <label className="block text-slate-950 font-black text-base">طبيعة التكليف الأكاديمي *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedAssignRole('theory')}
                className={`p-3 rounded-xl border-2 text-sm sm:text-base font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                  selectedAssignRole === 'theory'
                    ? 'bg-[#0F2942] border-[#0F2942] text-white shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <BookOpen className={`w-4 h-4 shrink-0 ${selectedAssignRole === 'theory' ? 'text-cyan-300' : 'text-blue-700'}`} />
                <span>مكلف نظري فقط</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAssignRole('practical')}
                className={`p-3 rounded-xl border-2 text-sm sm:text-base font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                  selectedAssignRole === 'practical'
                    ? 'bg-[#0F2942] border-[#0F2942] text-white shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <FlaskConical className={`w-4 h-4 shrink-0 ${selectedAssignRole === 'practical' ? 'text-cyan-300' : 'text-emerald-700'}`} />
                <span>مكلف عملي فقط</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAssignRole('both')}
                className={`p-3 rounded-xl border-2 text-sm sm:text-base font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                  selectedAssignRole === 'both'
                    ? 'bg-[#0F2942] border-[#0F2942] text-white shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Layers className={`w-4 h-4 shrink-0 ${selectedAssignRole === 'both' ? 'text-cyan-300' : 'text-cyan-600'}`} />
                <span>مكلف نظري وعملي</span>
              </button>
            </div>
          </div>

        </div>

        {/* ℹ️ ملاحظة تنبيهية توجيهية */}
        <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl text-slate-950 text-sm sm:text-base font-black leading-relaxed">
          <span>سيتم إرسال إشعار أكاديمي فوري وتحديث حساب الأستاذ وصلاحيات الرصد تلقائياً فور تثبيت التكليف.</span>
        </div>

      </div>
    </FloatingCrudModal>
  );
};

export default AssignmentModal; // 🚀 تصدير المكون
