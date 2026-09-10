'use client'; // ⚡ واجهة تفاعلية تعمل بالعميل

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import { createPortal } from 'react-dom'; // 🚪 بورتال لرسم القوائم العائمة
import {
  BookOpen, // 📖 أيقونة المادة الدراسية
  Plus, // ➕ أيقونة الإضافة
  Layers, // 📚 أيقونة الكورس والطبقات
  Award, // 🏆 أيقونة الوحدات والساعات
  Calendar, // 📅 أيقونة الفصل الدراسي
  GraduationCap, // 🎓 أيقونة المرحلة
  Sliders, // ⚙️ أيقونة النوع والخيارات
  Users, // 👥 أيقونة الأساتذة
  FlaskConical, // 🧪 أيقونة المختبر والعملي
  Lock, // 🔒 أيقونة القفل
  Unlock, // 🔓 أيقونة الفتح
  AlertTriangle, // ⚠️ أيقونة التحذير
  Check, // ✔️ أيقونة الاختيار
  ChevronDown, // 🔽 أيقونة القائمة المنسدلة
  UserCheck, // 👤 أيقونة الأستاذ المختار
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { UserProfile, CourseType } from '@/types'; // 🏷️ استيراد الأنواع
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 مودال الكرود العائم

// 📋 واجهة خصائص نافذة إضافة وتعديل المادة الدراسية
export interface CourseModalProps {
  isOpen: boolean; // 📂 حالة فتح المودال
  onClose: () => void; // ❌ دالة إغلاق المودال
  editingCourseId: string | null; // 🆔 معرف المادة الجاري تعديلها
  courseName: string; // 📝 اسم المادة
  setCourseName: (s: string) => void; // 🔄 تحديث اسم المادة
  courseCode: string; // 🔤 كود المادة
  setCourseCode: (s: string) => void; // 🔄 تحديث كود المادة
  courseCredits: number | null; // ⏱️ وحدات وساعات المادة
  setCourseCredits: (c: number | null) => void; // 🔄 تحديث الوحدات
  courseStage: number | null; // 🎓 مرحلة المادة
  setCourseStage: (s: number | null) => void; // 🔄 تحديث المرحلة
  courseSemester: 1 | 2 | null; // 🗓️ كورس المادة
  setCourseSemester: React.Dispatch<React.SetStateAction<1 | 2 | null>>; // 🔄 تحديث الكورس
  courseType: CourseType | null; // 🔬 نوع المادة
  setCourseType: (t: CourseType | null) => void; // 🔄 تحديث نوع المادة
  courseTheoryTeacherId: string; // 👨‍🏫 أستاذ النظري
  setCourseTheoryTeacherId: (id: string) => void; // 🔄 تحديث أستاذ النظري
  coursePracticalTeacherId: string; // 🧪 أستاذ العملي
  setCoursePracticalTeacherId: (id: string) => void; // 🔄 تحديث أستاذ العملي
  isCourseTheoryDropdownOpen: boolean; // 🔽 فتح قائمة أستاذ النظري
  setIsCourseTheoryDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل قائمة النظري
  isCoursePracticalDropdownOpen: boolean; // 🔽 فتح قائمة أستاذ العملي
  setIsCoursePracticalDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل قائمة العملي
  theoryTeacherBtnRef: React.RefObject<HTMLButtonElement | null>; // 🔗 مرجع زر أستاذ النظري
  practicalTeacherBtnRef: React.RefObject<HTMLButtonElement | null>; // 🔗 مرجع زر أستاذ العملي
  theoryTeacherCoords: { top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null; // 📐 إحداثيات منسدلة النظري
  practicalTeacherCoords: { top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null; // 📐 إحداثيات منسدلة العملي
  handleToggleCourseTheoryDropdown: () => void; // 🔄 فتح/غلق منسدلة النظري
  handleToggleCoursePracticalDropdown: () => void; // 🔄 فتح/غلق منسدلة العملي
  courseIsSupplementaryEnabled: boolean; // 🔄 حالة امتحان الدور الثاني
  setCourseIsSupplementaryEnabled: (en: boolean) => void; // 🔄 تحديث الدور الثاني
  courseIsFinalExamEnabled: boolean; // 🎯 حالة الامتحان النهائي
  setCourseIsFinalExamEnabled: (en: boolean) => void; // 🔄 تحديث الامتحان النهائي
  setExamToggleConfirmation: React.Dispatch<React.SetStateAction<{
    isOpen: boolean;
    examType: 'final' | 'supplementary';
    targetState: boolean;
    title: string;
    description: string;
  } | null>>; // 🔐 تعيين حالة نافذة تأكيد الامتحان
  deptName: string; // 🏢 اسم القسم
  handleSaveCourse: (e: React.FormEvent) => void; // 💾 حفظ المادة
  deptTeachers: UserProfile[]; // 👨‍🏫 أساتذة القسم
}

// 🏛️ مكون نافذة إضافة وتعديل المادة الدراسية وتوصيفها وتكليفات أساتذتها
export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen, // 📂 حالة فتح المودال
  onClose, // ❌ دالة إغلاق المودال
  editingCourseId, // 🆔 معرف المادة الجاري تعديلها
  courseName, // 📝 اسم المادة
  setCourseName, // 🔄 تحديث اسم المادة
  courseCode, // 🔤 كود المادة
  setCourseCode, // 🔄 تحديث كود المادة
  courseCredits, // ⏱️ وحدات المادة
  setCourseCredits, // 🔄 تحديث الوحدات
  courseStage, // 🎓 مرحلة المادة
  setCourseStage, // 🔄 تحديث المرحلة
  courseSemester, // 🗓️ كورس المادة
  setCourseSemester, // 🔄 تحديث الكورس
  courseType, // 🔬 نوع المادة
  setCourseType, // 🔄 تحديث نوع المادة
  courseTheoryTeacherId, // 👨‍🏫 أستاذ النظري
  setCourseTheoryTeacherId, // 🔄 تحديث أستاذ النظري
  coursePracticalTeacherId, // 🧪 أستاذ العملي
  setCoursePracticalTeacherId, // 🔄 تحديث أستاذ العملي
  isCourseTheoryDropdownOpen, // 🔽 قائمة أستاذ النظري
  setIsCourseTheoryDropdownOpen, // 🔄 تبديل قائمة النظري
  isCoursePracticalDropdownOpen, // 🔽 قائمة أستاذ العملي
  setIsCoursePracticalDropdownOpen, // 🔄 تبديل قائمة العملي
  theoryTeacherBtnRef, // 🔗 مرجع زر النظري
  practicalTeacherBtnRef, // 🔗 مرجع زر العملي
  theoryTeacherCoords, // 📐 إحداثيات النظري
  practicalTeacherCoords, // 📐 إحداثيات العملي
  handleToggleCourseTheoryDropdown, // 🔄 دالة فتح النظري
  handleToggleCoursePracticalDropdown, // 🔄 دالة فتح العملي
  courseIsSupplementaryEnabled, // 🔄 الدور الثاني
  setCourseIsSupplementaryEnabled, // 🔄 تحديث الدور الثاني
  courseIsFinalExamEnabled, // 🎯 النهائي
  setCourseIsFinalExamEnabled, // 🔄 تحديث النهائي
  setExamToggleConfirmation, // 🔐 تأكيد تبديل الامتحان
  deptName, // 🏢 اسم القسم
  handleSaveCourse, // 💾 دالة حفظ المادة
  deptTeachers, // 👨‍🏫 أساتذة القسم
}) => {
  return (
    <FloatingCrudModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCourseId ? 'تعديل بيانات وتوصيف المادة الدراسية' : 'إضافة مادة دراسية جديدة وتعيين الأساتذة'}
      subtitle={editingCourseId ? `تعديل توصيف وتكليفات مادة (${courseName || 'المادة'}) في قسم ${deptName}` : `إضافة مادة جديدة وتحديد نوعها وتكليف أساتذة النظري والعملي في قسم ${deptName}`}
      icon={<BookOpen className="w-6 h-6" />}
      maxWidth="max-w-4xl"
      onSubmit={handleSaveCourse}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-white hover:bg-[#0F2942] hover:text-white text-[#0F2942] font-black rounded-2xl text-base transition cursor-pointer border-2 border-[#0F2942] shadow-2xs active:scale-95"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="px-7 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-md transition flex items-center gap-2 cursor-pointer border border-[#0F2942] active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>{editingCourseId ? 'حفظ التعديلات الأكاديمية' : 'إضافة المادة وتثبيت التكليف'}</span>
          </button>
        </>
      }
    >
            <div className="space-y-6 text-base font-black">
              
              {/* 🏛️ القسم الأول: البيانات الأساسية للمادة والتوصيف */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
                  <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-2xs">
                    <BookOpen className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-slate-950">بيانات المقرر وتوصيف المسار</h4>
                    <p className="text-xs sm:text-sm font-bold text-slate-600">اسم المادة ورمزها الرسمي ونوع دراستها (نظري / مختبري)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                  {/* اسم المادة */}
                  <div className="col-span-12 md:col-span-7 space-y-2">
                    <label className="block text-slate-950 font-black text-base">اسم المادة الدراسية بالعربية *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        placeholder="مثال: البرمجة الهيكلية بلغة C++..."
                        className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-950 font-black text-base focus:border-slate-900 focus:outline-none shadow-2xs placeholder:text-slate-400 placeholder:font-bold"
                      />
                      <BookOpen className="w-5 h-5 absolute right-3.5 top-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* رمز المادة */}
                  <div className="col-span-12 md:col-span-5 space-y-2">
                    <label className="block text-slate-950 font-black text-base">رمز المادة الأكاديمي (Code) *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={courseCode}
                        onChange={(e) => setCourseCode(e.target.value)}
                        placeholder="مثال: CS201..."
                        className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-950 font-black text-base uppercase focus:border-slate-900 focus:outline-none shadow-2xs placeholder:text-slate-400 placeholder:font-bold font-mono"
                      />
                      <Layers className="w-5 h-5 absolute right-3.5 top-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* نوع المادة وتوصيف المسار الدراسي بتصميم بطاقات تفاعلية فاخرة */}
                  <div className="col-span-12 space-y-2">
                    <label className="block text-slate-950 font-black text-base">نوع المادة وتوصيف المسار الدراسي *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* بطاقة: نظري وعملي */}
                      <button
                        type="button"
                        onClick={() => setCourseType('theory_and_practical')}
                        className={`p-3.5 sm:p-4 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                          courseType === 'theory_and_practical'
                            ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-emerald-400/40'
                            : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl shrink-0 ${courseType === 'theory_and_practical' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                            <FlaskConical className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <div>
                            <div className="text-sm sm:text-base font-black flex items-center gap-2">
                              <span>نظري وعملي (مختبري)</span>
                            </div>
                            <p className={`text-xs font-bold mt-0.5 ${courseType === 'theory_and_practical' ? 'text-slate-300' : 'text-slate-600'}`}>
                              يشمل محاضرات قاعة وتطبيقات مختبرية
                            </p>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border transition-all ${
                          courseType === 'theory_and_practical'
                            ? 'bg-emerald-500 border-emerald-400 text-white'
                            : 'border-slate-300 bg-slate-100'
                        }`}>
                          {courseType === 'theory_and_practical' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>

                      {/* بطاقة: نظري فقط */}
                      <button
                        type="button"
                        onClick={() => setCourseType('theory_only')}
                        className={`p-3.5 sm:p-4 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                          courseType === 'theory_only'
                            ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-cyan-400/40'
                            : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl shrink-0 ${courseType === 'theory_only' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" /> {/* 📖 أيقونة الكتاب */}
                          </div>
                          <div>
                            <div className="text-sm sm:text-base font-black flex items-center gap-2">
                              <span>نظري فقط (بدون عملي)</span> {/* 🏷️ نوع نظري فقط */}
                            </div>
                            <p className={`text-xs font-bold mt-0.5 ${courseType === 'theory_only' ? 'text-slate-300' : 'text-slate-600'}`}>
                              محاضرات نظرية في القاعة فقط {/* 📝 الوصف */}
                            </p>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border transition-all ${
                          courseType === 'theory_only'
                            ? 'bg-cyan-500 border-cyan-400 text-white' // 🎨 مؤشر التحديد
                            : 'border-slate-300 bg-slate-100' // ⚪ غير محدد
                        }`}>
                          {courseType === 'theory_only' && <Check className="w-3.5 h-3.5 stroke-[3]" />} {/* ✅ علامة الصح */}
                        </div>
                      </button>

                    </div>
                    {/* ⚠️ تنبيه توجيهي أحمر إذا جان نوع المادة غير محدد بالمادة */}
                    {courseType === null && (
                      <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>يرجى اختيار نوع المادة وتوصيف المسار الدراسي للمتابعة</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 🎓 القسم الثاني: الخطة الأكاديمية والوحدات */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
                  <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-2xs">
                    <GraduationCap className="w-5 h-5 text-cyan-300" /> {/* 🎓 أيقونة التخرج */}
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-slate-950">التوزيع الأكاديمي والوحدات (ECTS)</h4>
                    <p className="text-xs sm:text-sm font-bold text-slate-600">المرحلة الدراسية والكورس ونقاط مسار بولونيا المعتمدة</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
                  
                  {/* المرحلة الدراسية بتصميم أزرار تفاعلية واضحة ومباشرة */}
                  <div className="col-span-12 sm:col-span-7 space-y-2">
                    <label className="block text-slate-950 font-black text-base">المرحلة الدراسية *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { num: 1, label: 'المرحلة الأولى' },
                        { num: 2, label: 'المرحلة الثانية' },
                        { num: 3, label: 'المرحلة الثالثة' },
                        { num: 4, label: 'المرحلة الرابعة' },
                      ].map((stg) => (
                        <button
                          key={stg.num}
                          type="button"
                          onClick={() => setCourseStage(stg.num)}
                          className={`py-3.5 px-2 rounded-2xl border text-center font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                            courseStage === stg.num
                              ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-cyan-400/40'
                              : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                          }`}
                        >
                          <GraduationCap className={`w-4 h-4 shrink-0 ${courseStage === stg.num ? 'text-cyan-300' : 'text-slate-600'}`} />
                          <span className="whitespace-nowrap">{stg.label}</span>
                        </button>
                      ))}
                    </div>
                    {/* ⚠️ تنبيه توجيهي أحمر إذا جانت المرحلة غير محددة بالمادة */}
                    {courseStage === null && (
                      <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>يرجى اختيار المرحلة الدراسية للمادة</span>
                      </p>
                    )}
                  </div>

                  {/* الكورس الدراسي بتصميم أزرار تفاعلية واضحة ومباشرة (مسح كلمة الفصل) */}
                  <div className="col-span-12 sm:col-span-5 space-y-2">
                    <label className="block text-slate-950 font-black text-base">الكورس *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { sem: 1, title: 'الكورس الأول' },
                        { sem: 2, title: 'الكورس الثاني' },
                      ].map((s) => (
                        <button
                          key={s.sem}
                          type="button"
                          onClick={() => setCourseSemester(s.sem as 1 | 2)}
                          className={`py-3.5 px-3 rounded-2xl border text-center font-black text-base transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                            courseSemester === s.sem
                              ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-blue-400/40'
                              : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                          }`}
                        >
                          <Calendar className={`w-5 h-5 ${courseSemester === s.sem ? 'text-cyan-300' : 'text-blue-600'}`} />
                          <span>{s.title}</span>
                        </button>
                      ))}
                    </div>
                    {/* ⚠️ تنبيه توجيهي أحمر إذا جان الكورس غير محدد بالمادة */}
                    {courseSemester === null && (
                      <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>يرجى اختيار الكورس الدراسي للمادة</span>
                      </p>
                    )}
                  </div>

                  {/* الساعات المعتمدة ECTS */}
                  <div className="col-span-12 space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-950 font-black text-base">الساعات والوحدات المعتمدة (ECTS) *</label>
                      <span className="text-xs font-black text-indigo-950 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                        النقاط المحددة: {courseCredits ? `${courseCredits} ECTS` : 'غير محدد'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {[2, 3, 4, 5, 6, 7, 8].map((pts) => (
                        <button
                          key={pts}
                          type="button"
                          onClick={() => setCourseCredits(pts)}
                          className={`py-3 px-2 rounded-2xl font-black text-base border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                            courseCredits === pts
                              ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-cyan-400/40'
                              : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                          }`}
                        >
                          <Award className={`w-4 h-4 ${courseCredits === pts ? 'text-cyan-300' : 'text-indigo-600'}`} />
                          <span>{pts}</span>
                        </button>
                      ))}
                      <div className="relative">
                        {/* 🎯 حقل الساعات المخصصة بدون أي قص لكلمة مخصص وتوسيط مثالي */}
                        <input
                          type="number"
                          min={1}
                          max={15}
                          value={courseCredits ?? ''}
                          onChange={(e) => setCourseCredits(e.target.value === '' ? null : Number(e.target.value))}
                          placeholder="مخصص"
                          className="w-full h-full px-1.5 py-3 bg-white border border-slate-300 rounded-2xl text-slate-950 font-black text-xs sm:text-sm md:text-base focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/20 focus:outline-none shadow-2xs text-center placeholder:text-slate-600 placeholder:font-black"
                        />
                      </div>
                    </div>
                    {/* ⚠️ تنبيه توجيهي أحمر إذا جانت الساعات غير محددة بالمادة */}
                    {courseCredits === null && (
                      <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>يرجى تحديد الساعات والوحدات المعتمدة (ECTS) للمادة</span>
                      </p>
                    )}
                  </div>

                </div>
              </div>

              {/* 👨‍🏫 القسم الثالث: تكليف الأساتذة وتعيين الصلاحيات */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
                  <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-2xs">
                    <Users className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-slate-950">الكادر التدريسي وتكليف الأساتذة</h4>
                    <p className="text-xs sm:text-sm font-bold text-slate-600">تعيين أستاذ المحاضرات النظرية وأستاذ المختبر والتطبيقات</p>
                  </div>
                </div>

                <div className={`grid grid-cols-1 ${courseType === 'theory_and_practical' ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-4 pt-1`}>
                  
                  {/* أستاذ النظري بقائمة تفاعلية ذكية عبر البورتال تضمن البقاء داخل الشاشة 100% */}
                  <div className="space-y-2 relative z-[999999]">
                    <label className="block text-slate-950 font-black text-base">أستاذ المادة (المحاضرات النظرية)</label>
                    <div className="relative">
                      <button
                        ref={theoryTeacherBtnRef}
                        type="button"
                        onClick={handleToggleCourseTheoryDropdown}
                        className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-950 font-black text-base focus:border-slate-900 focus:outline-none cursor-pointer shadow-2xs text-right flex items-center justify-between transition hover:border-slate-400"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <UserCheck className="w-5 h-5 text-blue-700 shrink-0" />
                          <span className={courseTheoryTeacherId ? 'text-slate-950 font-black' : 'text-slate-500 font-bold'}>
                            {deptTeachers.find((t) => t.id === courseTheoryTeacherId)?.full_name || '-- اختياري: حدد أستاذ النظري --'}
                          </span>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-200 shrink-0 ${isCourseTheoryDropdownOpen ? 'rotate-180 text-blue-700' : ''}`} />
                      </button>

                      {/* القائمة المنبثقة الذكية لأستاذ النظري عبر Portal لضمان عدم خروجها خارج حدود الشاشة */}
                      {isCourseTheoryDropdownOpen && theoryTeacherCoords && typeof document !== 'undefined' && createPortal(
                        <>
                          {/* خلفية شفافة لإغلاق القائمة عند النقر خارجها */}
                          <div 
                            className="fixed inset-0 z-[999999]" 
                            onClick={() => setIsCourseTheoryDropdownOpen(false)} 
                          />
                          {/* حاوية القائمة المتموضعة بدقة ذكية حسب موقع الزر ومساحة الشاشة */}
                          <div 
                            style={{
                              position: 'fixed',
                              ...(theoryTeacherCoords.openUpwards
                                ? { bottom: `${theoryTeacherCoords.bottom}px` }
                                : { top: `${theoryTeacherCoords.top}px` }),
                              left: `${theoryTeacherCoords.left}px`,
                              width: `${theoryTeacherCoords.width}px`,
                              maxHeight: `${theoryTeacherCoords.maxHeight || 220}px`,
                            }}
                            className="bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-[999999] overflow-y-auto p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                            dir="rtl"
                          >
                            {/* خيار إلغاء التحديد */}
                            <button
                              type="button"
                              onClick={() => {
                                setCourseTheoryTeacherId('');
                                setIsCourseTheoryDropdownOpen(false);
                              }}
                              className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                                !courseTheoryTeacherId ? 'bg-[#0F2942] text-white font-black' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span className={!courseTheoryTeacherId ? 'text-white' : 'text-slate-500'}>-- بدون تحديد أستاذ --</span>
                              {!courseTheoryTeacherId && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                            </button>

                            {/* قائمة الأساتذة في القسم */}
                            {deptTeachers.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  setCourseTheoryTeacherId(t.id);
                                  setIsCourseTheoryDropdownOpen(false);
                                }}
                                className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                                  courseTheoryTeacherId === t.id
                                    ? 'bg-[#0F2942] text-white shadow-xs'
                                    : 'text-slate-900 hover:bg-slate-100'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <UserCheck className={`w-4 h-4 ${courseTheoryTeacherId === t.id ? 'text-cyan-300' : 'text-blue-700'}`} />
                                  <span>{t.full_name}</span>
                                </div>
                                {courseTheoryTeacherId === t.id && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                              </button>
                            ))}
                          </div>
                        </>,
                        document.body
                      )}
                    </div>
                  </div>

                  {/* أستاذ العملي بقائمة تفاعلية ذكية عبر البورتال تضمن البقاء داخل الشاشة 100% */}
                  {courseType === 'theory_and_practical' && (
                    <div className="space-y-2 relative z-[999999] animate-in fade-in duration-150">
                      <label className="block text-slate-950 font-black text-base">أستاذ المختبر (التطبيقات والعملي)</label>
                      <div className="relative">
                        <button
                          ref={practicalTeacherBtnRef}
                          type="button"
                          onClick={handleToggleCoursePracticalDropdown}
                          className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-950 font-black text-base focus:border-slate-900 focus:outline-none cursor-pointer shadow-2xs text-right flex items-center justify-between transition hover:border-slate-400"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FlaskConical className="w-5 h-5 text-emerald-700 shrink-0" />
                            <span className={coursePracticalTeacherId ? 'text-slate-950 font-black' : 'text-slate-500 font-bold'}>
                              {deptTeachers.find((t) => t.id === coursePracticalTeacherId)?.full_name || '-- اختياري: حدد أستاذ العملي --'}
                            </span>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-200 shrink-0 ${isCoursePracticalDropdownOpen ? 'rotate-180 text-emerald-700' : ''}`} />
                        </button>

                        {/* القائمة المنبثقة الذكية لأستاذ العملي عبر Portal لضمان عدم خروجها خارج حدود الشاشة */}
                        {isCoursePracticalDropdownOpen && practicalTeacherCoords && typeof document !== 'undefined' && createPortal(
                          <>
                            {/* خلفية شفافة لإغلاق القائمة عند النقر خارجها */}
                            <div 
                              className="fixed inset-0 z-[999999]" 
                              onClick={() => setIsCoursePracticalDropdownOpen(false)} 
                            />
                            {/* حاوية القائمة المتموضعة بدقة ذكية حسب موقع الزر ومساحة الشاشة */}
                            <div 
                              style={{
                                position: 'fixed',
                                ...(practicalTeacherCoords.openUpwards
                                  ? { bottom: `${practicalTeacherCoords.bottom}px` }
                                  : { top: `${practicalTeacherCoords.top}px` }),
                                left: `${practicalTeacherCoords.left}px`,
                                width: `${practicalTeacherCoords.width}px`,
                                maxHeight: `${practicalTeacherCoords.maxHeight || 220}px`,
                              }}
                              className="bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-[999999] overflow-y-auto p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                              dir="rtl"
                            >
                              {/* خيار إلغاء التحديد */}
                              <button
                                type="button"
                                onClick={() => {
                                  setCoursePracticalTeacherId('');
                                  setIsCoursePracticalDropdownOpen(false);
                                }}
                                className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                                  !coursePracticalTeacherId ? 'bg-[#0F2942] text-white font-black' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span className={!coursePracticalTeacherId ? 'text-white' : 'text-slate-500'}>-- بدون تحديد أستاذ --</span>
                                {!coursePracticalTeacherId && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                              </button>

                              {/* قائمة الأساتذة في القسم */}
                              {deptTeachers.map((t) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => {
                                    setCoursePracticalTeacherId(t.id);
                                    setIsCoursePracticalDropdownOpen(false);
                                  }}
                                  className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                                    coursePracticalTeacherId === t.id
                                      ? 'bg-[#0F2942] text-white shadow-xs'
                                      : 'text-slate-900 hover:bg-slate-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <FlaskConical className={`w-4 h-4 ${coursePracticalTeacherId === t.id ? 'text-emerald-300' : 'text-emerald-700'}`} />
                                    <span>{t.full_name}</span>
                                  </div>
                                  {coursePracticalTeacherId === t.id && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                                </button>
                              ))}
                            </div>
                          </>,
                          document.body
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 🎯 القسم الرابع: خيار تفعيل وعرض درجات الامتحان النهائي (الدور الأول) - زران: إغلاق وفتح بتصميم كحلي موحد */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl shadow-2xs ${courseIsFinalExamEnabled ? 'bg-[#0F2942] text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {courseIsFinalExamEnabled ? (
                        <Unlock className="w-5 h-5 text-cyan-300" />
                      ) : (
                        <Lock className="w-5 h-5 text-slate-700" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-black text-slate-950">الامتحان النهائي (الدور الأول)</h4>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                          courseIsFinalExamEnabled 
                            ? 'bg-blue-50 text-[#0F2942] border border-blue-200' 
                            : 'bg-slate-200 text-slate-700 border border-slate-300'
                        }`}>
                          {courseIsFinalExamEnabled ? 'مفتوح ومفعّل' : 'مغلق (الافتراضي)'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-600 mt-0.5">
                        {courseIsFinalExamEnabled 
                          ? 'مفعل ومعروض حالياً: يظهر عمود الامتحان النهائي (من 50) للأستاذ والطلبة وتُحتسب النتائج.' 
                          : 'مغلق ومحجوب: عمود الامتحان النهائي مخفي ويقتصر العرض على السعي الفصلي التكويني فقط.'}
                      </p>
                    </div>
                  </div>

                  {/* زرا التحكم بالامتحان النهائي: إغلاق وفتح بتصميم كحلي ملكي موحد وأيقونات SVG ناصعة */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* زر إغلاق */}
                    <button
                      type="button"
                      onClick={() => {
                        if (courseIsFinalExamEnabled) {
                          setExamToggleConfirmation({
                            isOpen: true,
                            examType: 'final',
                            targetState: false,
                            title: 'تأكيد إغلاق وحجب الامتحان النهائي (الدور الأول)',
                            description: 'هل أنت متأكد من رغبتك في إغلاق وحجب عمود الامتحان النهائي؟ سيقتصر العرض على السعي الفصلي التكويني فقط ولن يتمكن الأستاذ من تعديل الدرجات النهائية.',
                          });
                        }
                      }}
                      className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border flex items-center justify-center gap-1.5 active:scale-95 ${
                        !courseIsFinalExamEnabled
                          ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm ring-2 ring-slate-400/30'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400 shadow-2xs'
                      }`}
                    >
                      <Lock className={`w-4 h-4 ${!courseIsFinalExamEnabled ? 'text-cyan-300' : 'text-slate-500'}`} />
                      <span>إغلاق</span>
                    </button>

                    {/* زر فتح بتصميم كحلي ملكي مطابق تماماً لزر الغلق */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!courseIsFinalExamEnabled) {
                          setExamToggleConfirmation({
                            isOpen: true,
                            examType: 'final',
                            targetState: true,
                            title: 'تأكيد فتح الامتحان النهائي (الدور الأول)',
                            description: 'هل أنت متأكد من رغبتك في فتح وتفعيل عمود الامتحان النهائي (من 50)؟ سيتمكن الأستاذ من رصد الدرجات وستظهر للطلبة ضمن النتائج.',
                          });
                        }
                      }}
                      className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border flex items-center justify-center gap-1.5 active:scale-95 ${
                        courseIsFinalExamEnabled
                          ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm ring-2 ring-slate-400/30'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400 shadow-2xs'
                      }`}
                    >
                      <Unlock className={`w-4 h-4 ${courseIsFinalExamEnabled ? 'text-cyan-300' : 'text-slate-500'}`} />
                      <span>فتح</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 🔄 القسم الخامس: خيار تفعيل فترة رصد درجات الدور الثاني (الإكمال) - زران: إغلاق وفتح بتصميم كحلي موحد */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl shadow-2xs ${courseIsSupplementaryEnabled ? 'bg-[#0F2942] text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {courseIsSupplementaryEnabled ? (
                        <Unlock className="w-5 h-5 text-cyan-300" />
                      ) : (
                        <Lock className="w-5 h-5 text-slate-700" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-black text-slate-950">فترة رصد درجات الدور الثاني (الإكمال)</h4>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                          courseIsSupplementaryEnabled 
                            ? 'bg-blue-50 text-[#0F2942] border border-blue-200' 
                            : 'bg-slate-200 text-slate-700 border border-slate-300'
                        }`}>
                          {courseIsSupplementaryEnabled ? 'مفتوح ومفعّل' : 'مغلق (الافتراضي)'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-600 mt-0.5">
                        {courseIsSupplementaryEnabled 
                          ? 'مفعلة حالياً: سيظهر عمود الدور الثاني (من 50) في جدول الأستاذ لرصد درجات المكملين.' 
                          : 'مغلقة (الدور الأول فقط): عمود الدور الثاني مخفي تماماً لمنع التشتت والتضارب الأكاديمي.'}
                      </p>
                    </div>
                  </div>

                  {/* زرا التحكم بالدور الثاني: إغلاق وفتح بتصميم كحلي ملكي موحد وأيقونات SVG ناصعة */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* زر إغلاق */}
                    <button
                      type="button"
                      onClick={() => {
                        if (courseIsSupplementaryEnabled) {
                          setExamToggleConfirmation({
                            isOpen: true,
                            examType: 'supplementary',
                            targetState: false,
                            title: 'تأكيد إغلاق فترة الدور الثاني',
                            description: 'هل أنت متأكد من إغلاق فترة الدور الثاني؟ سيتم حجب عمود درجات الإكمال عن واجهة الأستاذ للحفاظ على استقرار السجلات الأكاديمية.',
                          });
                        }
                      }}
                      className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border flex items-center justify-center gap-1.5 active:scale-95 ${
                        !courseIsSupplementaryEnabled
                          ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm ring-2 ring-slate-400/30'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400 shadow-2xs'
                      }`}
                    >
                      <Lock className={`w-4 h-4 ${!courseIsSupplementaryEnabled ? 'text-cyan-300' : 'text-slate-500'}`} />
                      <span>إغلاق</span>
                    </button>

                    {/* زر فتح بتصميم كحلي ملكي مطابق تماماً لزر الغلق */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!courseIsSupplementaryEnabled) {
                          setExamToggleConfirmation({
                            isOpen: true,
                            examType: 'supplementary',
                            targetState: true,
                            title: 'تأكيد فتح رصد درجات الدور الثاني (الإكمال)',
                            description: 'هل أنت متأكد من فتح فترة رصد درجات الدور الثاني؟ سيظهر عمود الدور الثاني (من 50) في جدول الأستاذ لرصد درجات الطلبة المكملين.',
                          });
                        }
                      }}
                      className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border flex items-center justify-center gap-1.5 active:scale-95 ${
                        courseIsSupplementaryEnabled
                          ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm ring-2 ring-slate-400/30'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400 shadow-2xs'
                      }`}
                    >
                      <Unlock className={`w-4 h-4 ${courseIsSupplementaryEnabled ? 'text-cyan-300' : 'text-slate-500'}`} />
                      <span>فتح</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 💡 شريط الملاحظات الإرشادي */}
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl text-blue-950 text-sm font-bold flex items-center gap-3">
                <Sliders className="w-5 h-5 text-blue-700 shrink-0" />
                <span>
                  ملاحظة أكاديمية: بعد حفظ المادة، يمكنك في أي وقت النقر على زر <strong className="text-blue-900 underline font-black">تخصيص الدرجات</strong> في جدول المواد لتعديل أوزان بنود بولونيا الـ 7.
                </span>
              </div>

            </div>
          </FloatingCrudModal>

  );
};

export default CourseModal; // 🚀 تصدير المكون كافتراضي
