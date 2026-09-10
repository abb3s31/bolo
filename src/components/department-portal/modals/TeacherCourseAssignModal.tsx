'use client'; // ⚡ واجهة تفاعلية تعمل بمتصفح العميل

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import {
  BookOpen, // 📖 أيقونة المادة
  Users, // 👥 أيقونة الأساتذة
  Search, // 🔍 أيقونة البحث
  Check, // ✔️ أيقونة الاختيار
  Plus, // ➕ أيقونة الإضافة
  UserMinus, // 🚫 أيقونة إلغاء التكليف
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { UserProfile, Course, TeacherCourse } from '@/types'; // 🏷️ استيراد الأنواع
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 مودال الكرود العائم
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🏷️ اسم المرحلة بالعربية

// 📋 واجهة خصائص مودال تكليف الأستاذ بالمواد
export interface TeacherCourseAssignModalProps {
  isOpen: boolean; // 🪟 حالة فتح المودال
  onClose: () => void; // ❌ دالة الإغلاق
  crudTeacher: UserProfile | null; // 👤 بيانات الأستاذ المحدد
  deptName: string; // 🏢 اسم القسم
  deptCourses: Course[]; // 📚 مواد القسم
  courses: Course[]; // 📚 قائمة المواد الإجمالية
  deptTeacherCourses: TeacherCourse[]; // 🔗 تكليفات مواد القسم
  teacherCrudSearchQuery: string; // 🔍 نص البحث
  setTeacherCrudSearchQuery: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث نص البحث
  teacherCrudCourseId: string; // 📖 معرف المادة المختارة
  setTeacherCrudCourseId: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث المادة
  handleAssignCourseToSpecificTeacher: (e: React.FormEvent) => void; // ➕ تثبيت التكليف
  handleRemoveAssignment: (tcId: string) => void; // 🗑️ إلغاء التكليف
}

// 🏛️ مكون مودال تكليف الأستاذ بالمواد واستعراض مقرراته
export const TeacherCourseAssignModal: React.FC<TeacherCourseAssignModalProps> = ({
  isOpen,
  onClose,
  crudTeacher,
  deptName,
  deptCourses,
  courses,
  deptTeacherCourses,
  teacherCrudSearchQuery,
  setTeacherCrudSearchQuery,
  teacherCrudCourseId,
  setTeacherCrudCourseId,
  handleAssignCourseToSpecificTeacher,
  handleRemoveAssignment,
}) => {
  return (
      <FloatingCrudModal
        isOpen={isOpen && !!crudTeacher}
        onClose={() => {
          onClose();
          setTeacherCrudCourseId('');
          setTeacherCrudSearchQuery('');
        }}
        title={`إدارة تكليفات المواد — الأستاذ: ${crudTeacher?.full_name || ''}`}
        subtitle={`تكليف مقررات جديدة، استعراض المواد المكلف بها حالياً، وإلغاء التكليف مع المزامنة التلقائية`}
        icon={<BookOpen className="w-6 h-6" />}
        maxWidth="max-w-3xl"
        footer={
          <button
            type="button"
            onClick={() => {
              onClose();
              setTeacherCrudCourseId('');
              setTeacherCrudSearchQuery('');
            }}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-2xl text-sm transition cursor-pointer border border-slate-300"
          >
            إغلاق
          </button>
        }
      >
        <div className="space-y-5 text-base font-black">
          {/* بطاقة معلومات الأستاذ الملخصة */}
          {crudTeacher && (() => {
            const currentAssignments = deptTeacherCourses.filter((tc) => tc.teacher_id === crudTeacher.id);
            return (
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0F2942] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    <Users className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-950 text-base sm:text-lg">{crudTeacher.full_name}</h4>
                    <p className="text-xs sm:text-sm text-slate-700 font-mono" dir="ltr">{crudTeacher.generated_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-black">
                  <span className="px-3 py-1 bg-blue-100 text-blue-950 rounded-xl border border-blue-200">
                    قسم {deptName}
                  </span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-950 rounded-xl border border-emerald-200 font-mono">
                    {currentAssignments.length} مواد مكلف بها
                  </span>
                </div>
              </div>
            );
          })()}

          {/* ➕ نموذج تكليف مادة جديدة للأستاذ (Create) */}
          <form onSubmit={handleAssignCourseToSpecificTeacher} className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-3">
            <label className="block text-slate-950 font-black text-sm sm:text-base">
              ➕ تكليف الأستاذ بمادة دراسية جديدة من مواد القسم:
            </label>
            
            <div className="space-y-2">
              {/* حقل البحث السريع في المواد */}
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-3 text-slate-700" />
                <input
                  type="text"
                  value={teacherCrudSearchQuery}
                  onChange={(e) => setTeacherCrudSearchQuery(e.target.value)}
                  placeholder="بحث باسم أو رمز المادة..."
                  className="w-full pl-3 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-950 placeholder:text-slate-500 focus:border-slate-900 focus:outline-none"
                />
              </div>

              {/* قائمة المواد المتاحة للاختيار */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 bg-white border border-slate-300 rounded-xl">
                {(() => {
                  const alreadyAssignedCourseIds = new Set(
                    deptTeacherCourses
                      .filter((tc) => tc.teacher_id === crudTeacher?.id)
                      .map((tc) => tc.course_id)
                  );

                  const availableCourses = deptCourses
                    .filter((c) => {
                      if (!teacherCrudSearchQuery) return true;
                      const q = teacherCrudSearchQuery.toLowerCase();
                      return (
                        c.name.toLowerCase().includes(q) ||
                        (c.code && c.code.toLowerCase().includes(q)) ||
                        `مرحلة ${c.stage_number}`.includes(q)
                      );
                    });

                  if (availableCourses.length === 0) {
                    return (
                      <div className="text-center py-4 text-xs font-black text-slate-700">
                        لا توجد مواد مطابقة للبحث
                      </div>
                    );
                  }

                  return availableCourses.map((c) => {
                    const isAlready = alreadyAssignedCourseIds.has(c.id);
                    const isSelected = teacherCrudCourseId === c.id;
                    const stageArabic = `المرحلة ${getStageNameInArabic(c.stage_number || 1)}`;
                    const semArabic = c.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول';

                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={isAlready}
                        onClick={() => setTeacherCrudCourseId(c.id)}
                        className={`w-full p-2.5 rounded-xl text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer border ${
                          isAlready
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                            : isSelected
                              ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                              : 'text-slate-950 hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <BookOpen className="w-4 h-4 shrink-0" />
                          <span className="truncate">{c.name}</span>
                          <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-950'}`}>
                            {c.code}
                          </span>
                          {/* 🎓 المرحلة والكورس بلون أسود بارز وواضح */}
                          <span className={`text-xs font-black ${isSelected ? 'text-cyan-300' : 'text-slate-950'}`}>
                            ({stageArabic} • {semArabic})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 mr-2">
                          {isAlready ? (
                            <span className="text-[11px] text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-black">
                              مكلف بها مسبقاً
                            </span>
                          ) : isSelected ? (
                            <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                          ) : (
                            <span className="text-xs font-mono">{c.credit_hours || 3} ECTS</span>
                          )}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="submit"
                disabled={!teacherCrudCourseId}
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] disabled:bg-slate-300 text-white font-black rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer border border-[#0F2942] active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-cyan-300" />
                <span>تثبيت تكليف هذه المادة للأستاذ</span>
              </button>
            </div>
          </form>

          {/* 📋 قائمة المواد المكلف بها حالياً (Read & Delete) */}
          <div className="space-y-2">
            <h4 className="font-black text-slate-950 text-sm sm:text-base flex items-center justify-between">
              <span>المواد المكلف بتدريسها حالياً:</span>
              <span className="text-xs font-mono bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300">
                {deptTeacherCourses.filter((tc) => tc.teacher_id === crudTeacher?.id).length} مواد
              </span>
            </h4>

            {(() => {
              const currentList = deptTeacherCourses.filter((tc) => tc.teacher_id === crudTeacher?.id);
              if (currentList.length === 0) {
                return (
                  <div className="text-center py-6 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 text-xs sm:text-sm font-black">
                    هذا الأستاذ غير مكلف بتدريس أي مادة حتى الآن. يمكنك اختيار مادة من الأعلى وتكليفه بها.
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  {currentList.map((tc, idx) => {
                    const cInfo = courses.find((c) => c.id === tc.course_id);
                    const stageArabic = cInfo ? `المرحلة ${getStageNameInArabic(cInfo.stage_number || 1)}` : '—';
                    const semArabic = tc.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول';

                    return (
                      <div
                        key={tc.id}
                        className="p-3 bg-white border border-slate-300 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center font-mono text-xs text-slate-950 font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-black text-slate-950 text-sm sm:text-base flex items-center gap-2">
                              <span>{tc.course_name}</span>
                              {cInfo?.code && (
                                <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                  {cInfo.code}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600 font-bold flex items-center gap-2 mt-0.5">
                              <span>{stageArabic}</span>
                              <span>•</span>
                              <span>{semArabic}</span>
                              <span>•</span>
                              <span className="font-mono text-slate-500">
                                {new Date(tc.created_at || Date.now()).toLocaleDateString('ar-IQ-u-nu-latn')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* زر إلغاء تكليف هذه المادة للأستاذ */}
                        <button
                          type="button"
                          onClick={() => handleRemoveAssignment(tc.id)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                          title="إلغاء تكليف هذه المادة للأستاذ"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>إلغاء التكليف</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </FloatingCrudModal>


  );
};

export default TeacherCourseAssignModal; // 🚀 تصدير المكون كافتراضي
