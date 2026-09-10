'use client'; // ⚡ ينفذ على جهة العميل بمتصفح المستخدم

// 📚 مكون كارد إضافة وتعديل المادة الدراسية (Course Modal) بنظام مسار بولونيا
// 🇮🇶 توثيق عراقي سطر بسطر والتزام نمطي صارم بدون any أو unknown

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import {
  BookOpen, Plus, Edit3, Building2, GraduationCap, Layers,
  Award, Clock, Check, ChevronDown, UserCheck, FlaskConical,
  CheckCircle2, AlertCircle, Calendar, Users
} from 'lucide-react'; // 🎨 أيقونات لوسيد
import type { Course, CourseType, Department, UserProfile } from '@/types'; // 🏷️ استيراد الأنواع الرسمية
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 المودال العائم الفاخر

// 📋 واجهة خصائص مودال إضافة وتعديل المادة الدراسية
export interface AdminCourseModalProps {
  isCourseModalOpen: boolean; // 🪟 حالة فتح نافذة المادة
  setIsCourseModalOpen: (open: boolean) => void; // 🔄 دالة التحكم بفتح النافذة
  editingCourse: Course | null; // 📖 المادة قيد التعديل أو null للإضافة
  setEditingCourse: (course: Course | null) => void; // 🔄 دالة تصفير التعديل
  handleSaveCourse: (e: React.FormEvent) => void; // 💾 دالة حفظ المادة
  courseName: string; // 🏷️ اسم المادة بالعربي
  setCourseName: (name: string) => void; // 🔄 دالة تحديث اسم المادة
  courseCode: string; // 🔢 كود المادة الأكاديمي
  setCourseCode: (code: string) => void; // 🔄 دالة تحديث كود المادة
  courseType: CourseType | null; // 🔬 نوع المادة (نظري / عملي / مشترك)
  setCourseType: (type: CourseType | null) => void; // 🔄 دالة تحديد نوع المادة
  selectedDeptId: string; // 🏢 معرف القسم المختار
  setSelectedDeptId: (id: string) => void; // 🔄 دالة تحديد القسم
  departments: Department[]; // 🏢 قائمة كافة الأقسام
  isDeptDropdownOpen: boolean; // 🔽 فتح منسدلة القسم
  setIsDeptDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 دالة فتح وإغلاق منسدلة القسم
  selectedStageNum: number | null; // 🎓 رقم المرحلة
  setSelectedStageNum: (stage: number | null) => void; // 🔄 دالة تحديث المرحلة
  selectedSemester: 1 | 2 | null; // 🗓️ الكورس (الأول / الثاني)
  setSelectedSemester: (sem: 1 | 2 | null) => void; // 🔄 دالة تحديث الكورس
  creditHours: number | null; // 🏆 وحدات المادة المعتمدة (ECTS)
  setCreditHours: (credits: number | null) => void; // 🔄 دالة تحديث الوحدات
  theoryTeacherId: string; // 👤 معرف أستاذ النظري
  setTheoryTeacherId: (id: string) => void; // 🔄 دالة تحديد أستاذ النظري
  isTheoryTeacherDropdownOpen: boolean; // 🔽 فتح منسدلة أستاذ النظري
  setIsTheoryTeacherDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 دالة فتح منسدلة النظري
  practicalTeacherId: string; // 🧪 معرف أستاذ العملي
  setPracticalTeacherId: (id: string) => void; // 🔄 دالة تحديد أستاذ العملي
  isPracticalTeacherDropdownOpen: boolean; // 🔽 فتح منسدلة أستاذ العملي
  setIsPracticalTeacherDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 دالة فتح منسدلة العملي
  deptTeachers: UserProfile[]; // 👨‍🏫 قائمة أساتذة القسم المتاحين
}

// 🏛️ مكون مودال إدارة المادة الأكاديمية
export const AdminCourseModal: React.FC<AdminCourseModalProps> = ({
  isCourseModalOpen,
  setIsCourseModalOpen,
  editingCourse,
  setEditingCourse,
  handleSaveCourse,
  courseName,
  setCourseName,
  courseCode,
  setCourseCode,
  courseType,
  setCourseType,
  selectedDeptId,
  setSelectedDeptId,
  departments,
  isDeptDropdownOpen,
  setIsDeptDropdownOpen,
  selectedStageNum,
  setSelectedStageNum,
  selectedSemester,
  setSelectedSemester,
  creditHours,
  setCreditHours,
  theoryTeacherId,
  setTheoryTeacherId,
  isTheoryTeacherDropdownOpen,
  setIsTheoryTeacherDropdownOpen,
  practicalTeacherId,
  setPracticalTeacherId,
  isPracticalTeacherDropdownOpen,
  setIsPracticalTeacherDropdownOpen,
  deptTeachers,
}) => {
  return (
      <FloatingCrudModal
        isOpen={isCourseModalOpen}
        onClose={() => {
          setIsCourseModalOpen(false);
          setEditingCourse(null);
          setIsTheoryTeacherDropdownOpen(false);
          setIsPracticalTeacherDropdownOpen(false);
          setIsDeptDropdownOpen(false);
        }}
        title={editingCourse ? `تعديل المادة الدراسية: ${editingCourse.name}` : 'إضافة مادة (كورس) جديد للمنهج الأكاديمي'}
        subtitle="تحديد وتوصيف المادة، القسم والمرحلة، الكورس، الساعات المعتمدة، وأساتذة النظري والعملي"
        icon={<BookOpen className="w-6 h-6 text-indigo-700" />}
        maxWidth="max-w-4xl"
        onSubmit={handleSaveCourse}
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setIsCourseModalOpen(false);
                setEditingCourse(null);
                setIsTheoryTeacherDropdownOpen(false);
                setIsPracticalTeacherDropdownOpen(false);
                setIsDeptDropdownOpen(false);
              }}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-2xl text-base transition cursor-pointer border border-slate-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-7 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-md transition flex items-center gap-2 cursor-pointer border border-[#163a5f] active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              <span>{editingCourse ? 'حفظ وتثبيت التعديلات' : 'إضافة المادة وتثبيت التكليف'}</span>
            </button>
          </>
        }
      >
        <div className="space-y-6 text-right text-base font-black">
          
          {/* 🏛️ القسم الأول: البيانات الأساسية للمقرر وتوصيفه */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
              <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-2xs">
                <BookOpen className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-950">بيانات المقرر وتوصيف المسار</h4>
                <p className="text-xs sm:text-sm font-black text-slate-950">اسم المادة ورمزها الرسمي ونوع دراستها والقسم التابع لها</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
              {/* اسم المادة */}
              <div className="col-span-12 md:col-span-7 space-y-2">
                <label className="block text-base font-black text-slate-950">اسم المادة الدراسي بالعربية *</label>
                <div className="relative">
                  {/* 📚 حقل إدخال اسم المادة مع تلميح رصاصي راقي */}
                  <input
                    type="text" // 🔤 نوع الحقل نصي
                    required // ⚠️ إجباري
                    value={courseName} // 💾 حفظ اسم المادة
                    onChange={(e) => setCourseName(e.target.value)} // 🔄 تحديث الاسم ويا الكتابة
                    placeholder="مثال: البرمجة الهيكلية بلغة C++" // 💡 نص تلميح للمستخدم
                    className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-950 text-base font-black placeholder:text-slate-400 placeholder:font-medium focus:border-slate-900 focus:outline-none shadow-2xs" // 🎨 تلميح رصاصي أنيق
                  />
                  <BookOpen className="w-5 h-5 absolute right-3.5 top-4 text-slate-950 pointer-events-none" />
                </div>
              </div>

              {/* رمز المادة */}
              <div className="col-span-12 md:col-span-5 space-y-2">
                <label className="block text-base font-black text-slate-950">رمز المادة الأكاديمي (Code) *</label>
                <div className="relative">
                  {/* 🏷️ حقل رمز المادة مع تلميح رصاصي مرتب */}
                  <input
                    type="text" // 🔤 نوع الحقل نصي
                    required // ⚠️ إجباري
                    value={courseCode} // 💾 حفظ كود المادة
                    onChange={(e) => setCourseCode(e.target.value)} // 🔄 تحديث الكود
                    placeholder="مثال: CS201" // 💡 كود استرشادي
                    className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-950 text-base font-black placeholder:text-slate-400 placeholder:font-medium focus:border-slate-900 focus:outline-none uppercase shadow-2xs font-mono" // 🎨 تلميح رصاصي
                  />
                  <Layers className="w-5 h-5 absolute right-3.5 top-4 text-slate-950 pointer-events-none" />
                </div>
              </div>

              {/* القسم المستهدف بقائمة تفاعلية مخصصة */}
              <div className="col-span-12 space-y-2 relative z-[999999]">
                <label className="block text-base font-black text-slate-950">القسم العلمي الأكاديمي *</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeptDropdownOpen(!isDeptDropdownOpen);
                      setIsTheoryTeacherDropdownOpen(false);
                      setIsPracticalTeacherDropdownOpen(false);
                    }}
                    className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-950 font-black text-base focus:border-slate-900 focus:outline-none cursor-pointer shadow-2xs text-right flex items-center justify-between transition hover:border-slate-400"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="w-5 h-5 text-slate-950 shrink-0" />
                      <span className="text-slate-950 font-black">
                        {departments.find((d) => d.id === selectedDeptId)?.name || 'اختر القسم العلمي'}
                      </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-950 transition-transform duration-200 shrink-0 ${isDeptDropdownOpen ? 'rotate-180 text-blue-700' : ''}`} />
                  </button>

                  {/* القائمة المنبثقة للقسم */}
                  {isDeptDropdownOpen && (
                    <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-300 p-2 z-[999999] max-h-60 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150">
                      {departments.map((d: Department) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setSelectedDeptId(d.id);
                            setIsDeptDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-right font-black text-sm sm:text-base transition flex items-center justify-between cursor-pointer ${
                            selectedDeptId === d.id
                              ? 'bg-[#0F2942] text-white shadow-xs'
                              : 'text-slate-950 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className={`w-4 h-4 ${selectedDeptId === d.id ? 'text-cyan-300' : 'text-slate-950'}`} />
                            <span>{d.name}</span>
                          </div>
                          {selectedDeptId === d.id && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* نوع المادة وتوصيفها بتصميم بطاقات تفاعلية فاخرة */}
              <div className="col-span-12 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-base font-black text-slate-950">توصيف ونوع المادة *</label>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all ${
                    courseType === null
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  }`}>
                    {courseType === null ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>غير محدد</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{courseType === 'theory_and_practical' ? 'نظري وعملي' : 'نظري فقط'}</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* بطاقة: نظري وعملي */}
                  <button
                    type="button"
                    onClick={() => setCourseType('theory_and_practical')}
                    className={`p-3.5 sm:p-4 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                      courseType === 'theory_and_practical'
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-emerald-400/40'
                        : 'bg-white text-slate-950 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
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
                        <p className={`text-xs font-black mt-0.5 ${courseType === 'theory_and_practical' ? 'text-slate-100' : 'text-slate-950'}`}>
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
                        : 'bg-white text-slate-950 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${courseType === 'theory_only' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-black flex items-center gap-2">
                          <span>نظري فقط (بدون عملي)</span>
                        </div>
                        <p className={`text-xs font-black mt-0.5 ${courseType === 'theory_only' ? 'text-slate-100' : 'text-slate-950'}`}>
                          محاضرات نظرية في القاعة فقط
                        </p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border transition-all ${
                      courseType === 'theory_only'
                        ? 'bg-cyan-500 border-cyan-400 text-white'
                        : 'border-slate-300 bg-slate-100'
                    }`}>
                      {courseType === 'theory_only' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>

                </div>
                {courseType === null && (
                  <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>يرجى اختيار نوع المادة (نظري وعملي أو نظري فقط)</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 🎓 القسم الثاني: الخطة الأكاديمية والوحدات */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
              <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-2xs">
                <GraduationCap className="w-5 h-5 text-sky-300" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-950">التوزيع الأكاديمي والوحدات (ECTS)</h4>
                <p className="text-xs sm:text-sm font-black text-slate-950">المرحلة الدراسية والكورس وساعاتها المعتمدة</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
              
              {/* المرحلة الدراسية بتصميم أزرار تفاعلية واضحة ومباشرة */}
              <div className="col-span-12 sm:col-span-7 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-base font-black text-slate-950">المرحلة الدراسية *</label>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all ${
                    selectedStageNum === null
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  }`}>
                    {selectedStageNum === null ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>غير محدد</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>المرحلة {selectedStageNum}</span>
                      </>
                    )}
                  </span>
                </div>
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
                      onClick={() => setSelectedStageNum(stg.num)}
                      className={`py-3.5 px-2 rounded-2xl border text-center font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                        selectedStageNum === stg.num
                          ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                          : 'bg-white text-slate-950 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      <GraduationCap className={`w-4 h-4 shrink-0 ${selectedStageNum === stg.num ? 'text-sky-300' : 'text-slate-950'}`} />
                      <span className="whitespace-nowrap">{stg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* الكورس بتصميم أزرار تفاعلية واضحة ومباشرة مع حذف كلمة الفصل */}
              <div className="col-span-12 sm:col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-base font-black text-slate-950">الكورس *</label>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all ${
                    selectedSemester === null
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  }`}>
                    {selectedSemester === null ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>غير محدد</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{selectedSemester === 1 ? 'الكورس الأول' : 'الكورس الثاني'}</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { sem: 1, title: 'الكورس الأول' },
                    { sem: 2, title: 'الكورس الثاني' },
                  ].map((s) => (
                    <button
                      key={s.sem}
                      type="button"
                      onClick={() => setSelectedSemester(s.sem as 1 | 2)}
                      className={`py-3.5 px-3 rounded-2xl border text-center font-black text-base transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                        selectedSemester === s.sem
                          ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                          : 'bg-white text-slate-950 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      <Calendar className={`w-5 h-5 ${selectedSemester === s.sem ? 'text-cyan-300' : 'text-blue-600'}`} />
                      <span>{s.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* الساعات المعتمدة ECTS */}
              <div className="col-span-12 space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-base font-black text-slate-950">الساعات والوحدات المعتمدة (ECTS) *</label>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all ${
                    creditHours === null
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  }`}>
                    {creditHours === null ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>غير محدد</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>النقاط المحددة: {creditHours} ECTS</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {[2, 3, 4, 5, 6, 7, 8].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setCreditHours(pts)}
                      className={`py-3 px-2 rounded-2xl font-black text-base border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                        creditHours === pts
                          ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                          : 'bg-white text-slate-950 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      <Award className={`w-4 h-4 ${creditHours === pts ? 'text-sky-300' : 'text-slate-950'}`} />
                      <span>{pts}</span>
                    </button>
                  ))}
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={creditHours ?? ''}
                      onChange={(e) => setCreditHours(e.target.value ? Number(e.target.value) : null)}
                      placeholder="مخصص"
                      title="تحديد ساعات معتمدة مخصصة"
                      className={`w-full h-full py-3 px-1 text-center rounded-2xl font-black text-xs sm:text-sm transition-all focus:outline-none shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        creditHours !== null && ![2, 3, 4, 5, 6, 7, 8].includes(creditHours)
                          ? 'bg-[#0F2942] text-white border-2 border-[#0F2942] ring-2 ring-[#0F2942]/30 placeholder:text-slate-300'
                          : 'bg-white text-slate-950 border border-slate-300 hover:border-slate-400 focus:border-slate-900 placeholder:text-slate-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 👨‍🏫 القسم الثالث: الكادر التدريسي وتكليف الأساتذة */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
              <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-2xs">
                <Users className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-950">الكادر التدريسي وتكليف الأساتذة</h4>
                <p className="text-xs sm:text-sm font-black text-slate-950">تعيين أستاذ المحاضرات النظرية وأستاذ المختبر والتطبيقات</p>
              </div>
            </div>

            <div className={`grid grid-cols-1 ${courseType === 'theory_and_practical' ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-4 pt-1`}>
              
              {/* أستاذ النظري بقائمة تفاعلية فاخرة تفتح للأعلى وتمنع أي قص */}
              <div className="space-y-2 relative z-[999999]">
                <label className="block text-base font-black text-slate-950">أستاذ النظري (المحاضرات)</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTheoryTeacherDropdownOpen(!isTheoryTeacherDropdownOpen);
                      setIsPracticalTeacherDropdownOpen(false);
                      setIsDeptDropdownOpen(false);
                    }}
                    className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-950 font-black text-base focus:border-slate-900 focus:outline-none cursor-pointer shadow-2xs text-right flex items-center justify-between transition hover:border-slate-400"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <UserCheck className="w-5 h-5 text-blue-700 shrink-0" />
                      <span className="text-slate-950 font-black">
                        {deptTeachers.find((t) => t.id === theoryTeacherId)?.full_name || '-- اختياري: حدد أستاذ النظري --'}
                      </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-950 transition-transform duration-200 shrink-0 ${isTheoryTeacherDropdownOpen ? 'rotate-180 text-blue-700' : ''}`} />
                  </button>

                  {/* القائمة المنبثقة المخصصة لأستاذ النظري تفتح للأعلى بأمان كامل */}
                  {isTheoryTeacherDropdownOpen && (
                    <div className="absolute bottom-full right-0 left-0 mb-2 bg-white rounded-2xl shadow-2xl border border-slate-300 p-2 z-[999999] max-h-60 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setTheoryTeacherId('');
                          setIsTheoryTeacherDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                          !theoryTeacherId ? 'bg-slate-100 text-slate-950 font-black' : 'text-slate-950 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-slate-950 font-black">-- بدون تحديد أستاذ --</span>
                        {!theoryTeacherId && <Check className="w-4 h-4 text-slate-950" />}
                      </button>

                      {deptTeachers.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setTheoryTeacherId(t.id);
                            setIsTheoryTeacherDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                            theoryTeacherId === t.id
                              ? 'bg-[#0F2942] text-white shadow-xs'
                              : 'text-slate-950 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <UserCheck className={`w-4 h-4 ${theoryTeacherId === t.id ? 'text-cyan-300' : 'text-blue-700'}`} />
                            <span>{t.full_name}</span>
                          </div>
                          {theoryTeacherId === t.id && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* أستاذ العملي بقائمة تفاعلية فاخرة تفتح للأعلى وتمنع أي قص */}
              {courseType === 'theory_and_practical' && (
                <div className="space-y-2 relative z-[999999] animate-in fade-in duration-150">
                  <label className="block text-base font-black text-slate-950">أستاذ المختبر / العملي</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPracticalTeacherDropdownOpen(!isPracticalTeacherDropdownOpen);
                        setIsTheoryTeacherDropdownOpen(false);
                        setIsDeptDropdownOpen(false);
                      }}
                      className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-950 font-black text-base focus:border-slate-900 focus:outline-none cursor-pointer shadow-2xs text-right flex items-center justify-between transition hover:border-slate-400"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FlaskConical className="w-5 h-5 text-emerald-700 shrink-0" />
                        <span className="text-slate-950 font-black">
                          {deptTeachers.find((t) => t.id === practicalTeacherId)?.full_name || '-- اختياري: حدد أستاذ العملي --'}
                        </span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-950 transition-transform duration-200 shrink-0 ${isPracticalTeacherDropdownOpen ? 'rotate-180 text-emerald-700' : ''}`} />
                    </button>

                    {/* القائمة المنبثقة المخصصة لأستاذ العملي تفتح للأعلى بأمان كامل */}
                    {isPracticalTeacherDropdownOpen && (
                      <div className="absolute bottom-full right-0 left-0 mb-2 bg-white rounded-2xl shadow-2xl border border-slate-300 p-2 z-[999999] max-h-60 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            setPracticalTeacherId('');
                            setIsPracticalTeacherDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                            !practicalTeacherId ? 'bg-slate-100 text-slate-950 font-black' : 'text-slate-950 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-slate-950 font-black">-- بدون تحديد أستاذ --</span>
                          {!practicalTeacherId && <Check className="w-4 h-4 text-slate-950" />}
                        </button>

                        {deptTeachers.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setPracticalTeacherId(t.id);
                              setIsPracticalTeacherDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                              practicalTeacherId === t.id
                                ? 'bg-[#0F2942] text-white shadow-xs'
                                : 'text-slate-950 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <FlaskConical className={`w-4 h-4 ${practicalTeacherId === t.id ? 'text-emerald-300' : 'text-emerald-700'}`} />
                              <span>{t.full_name}</span>
                            </div>
                            {practicalTeacherId === t.id && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </FloatingCrudModal>

  );
};
