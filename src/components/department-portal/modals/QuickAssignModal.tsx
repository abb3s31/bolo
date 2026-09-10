'use client'; // ⚡ واجهة تفاعلية تعمل بمتصفح العميل

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import {
  Users, // 👥 أيقونة الأساتذة
  FlaskConical, // 🧪 أيقونة المختبر والعملي
  Search, // 🔍 أيقونة البحث
  Check, // ✔️ أيقونة الصح
  CheckCircle2, // ✅ أيقونة التحديد
  UserMinus, // 🚫 أيقونة إلغاء التعيين
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { UserProfile, Course } from '@/types'; // 🏷️ استيراد الأنواع
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 مودال الكرود العائم
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🏷️ دالة اسم المرحلة بالعربية

// ⚡ واجهة كائن حالة مودال التعيين والتكليف السريع للأستاذ من داخل جدول المقررات مباشرة
export interface QuickAssignState {
  isOpen: boolean; // 🪟 حالة فتح نافذة المودال السريع
  course: Course | null; // 📖 كائن المادة الدراسية المستهدفة بالتعيين
  role: 'theory' | 'practical'; // 🏷️ صفة التدريس المطلوبة (نظري أو عملي)
  selectedTeacherId: string; // 👨‍🏫 معرف الأستاذ المختار للتعيين
  searchQuery: string; // 🔍 نص البحث لتصفية الأساتذة بسرعة
}

// 📋 واجهة خصائص مودال التكليف والتعيين السريع للأستاذ
export interface QuickAssignModalProps {
  quickAssignConfig: QuickAssignState; // ⚙️ حالة التعيين السريع
  setQuickAssignConfig: React.Dispatch<React.SetStateAction<QuickAssignState>>; // 🔄 تحديث حالة التعيين السريع
  deptName: string; // 🏢 اسم القسم
  handleSaveQuickAssign: (teacherId: string | null) => void; // 💾 دالة حفظ التعيين السريع
  deptTeachers: UserProfile[]; // 👨‍🏫 أساتذة القسم
}

// 🏛️ مكون مودال التكليف والتعيين السريع للأستاذ بمادة دراسية
export const QuickAssignModal: React.FC<QuickAssignModalProps> = ({
  quickAssignConfig, // ⚙️ حالة التعيين
  setQuickAssignConfig, // 🔄 تحديث الحالة
  deptName, // 🏢 اسم القسم
  handleSaveQuickAssign, // 💾 حفظ التعيين
  deptTeachers, // 👨‍🏫 أساتذة القسم
}) => {
  return (
    <FloatingCrudModal
      isOpen={quickAssignConfig.isOpen && !!quickAssignConfig.course}
            onClose={() => {
              setQuickAssignConfig((prev) => ({ ...prev, isOpen: false }));
            }}
            title={
              quickAssignConfig.role === 'theory'
                ? 'تعيين وتكليف أستاذ النظري'
                : 'تعيين وتكليف أستاذ العملي والمختبر'
            }
            subtitle={
              quickAssignConfig.course
                ? `تعيين وتكليف سريع لأستاذ مادة (${quickAssignConfig.course.name}) [${quickAssignConfig.course.code}] في قسم ${deptName}`
                : ''
            }
            icon={quickAssignConfig.role === 'theory' ? <Users className="w-6 h-6" /> : <FlaskConical className="w-6 h-6" />}
            maxWidth="max-w-xl"
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              if (quickAssignConfig.selectedTeacherId) {
                handleSaveQuickAssign(quickAssignConfig.selectedTeacherId);
              }
            }}
            footer={
              <div className="flex items-center justify-between w-full gap-3 flex-wrap">
                {/* زر إلغاء التعيين وتفريغ الخانة إذا كانت المادة محدد لها أستاذ */}
                {((quickAssignConfig.role === 'theory' && quickAssignConfig.course?.theory_teacher_id) ||
                  (quickAssignConfig.role === 'practical' && quickAssignConfig.course?.practical_teacher_id)) ? (
                  <button
                    type="button"
                    onClick={() => handleSaveQuickAssign(null)}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 font-black rounded-2xl text-xs sm:text-sm transition cursor-pointer border border-rose-300 shadow-2xs active:scale-95 flex items-center gap-1.5"
                    title="إلغاء التعيين وسحب التكليف وجعل الخانة غير معيّن"
                  >
                    <UserMinus className="w-4 h-4 text-rose-600" />
                    <span>إلغاء التعيين (غير معيّن)</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickAssignConfig((prev) => ({ ...prev, isOpen: false }));
                    }}
                    className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-black rounded-2xl text-xs sm:text-sm transition cursor-pointer border-2 border-slate-300 shadow-2xs active:scale-95"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={!quickAssignConfig.selectedTeacherId}
                    className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer border border-[#0F2942] active:scale-95 whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>تأكيد التعيين والتكليف</span>
                  </button>
                </div>
              </div>
            }
          >
            {quickAssignConfig.course && (
              <div className="space-y-4 text-right">
                {/* 📋 كارت بيانات المادة المستهدفة */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black bg-[#0F2942] text-white px-2 py-0.5 rounded-lg">
                        {quickAssignConfig.course.code}
                      </span>
                      <span className="font-black text-slate-950 text-base">
                        {quickAssignConfig.course.name}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-600 mt-1 flex items-center gap-2">
                      <span>المرحلة {getStageNameInArabic(quickAssignConfig.course.stage_number || 1)}</span>
                      <span>•</span>
                      <span>الكورس {quickAssignConfig.course.semester === 2 ? 'الثاني' : 'الأول'}</span>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-xl text-xs font-black border ${
                    quickAssignConfig.role === 'theory'
                      ? 'bg-blue-50 text-blue-950 border-blue-200'
                      : 'bg-emerald-50 text-emerald-950 border-emerald-300'
                  }`}>
                    {quickAssignConfig.role === 'theory' ? 'تدريس الجانب النظري' : 'تدريس الجانب العملي والمختبر'}
                  </span>
                </div>

                {/* 🔍 حقل البحث السريع عن الأستاذ */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={quickAssignConfig.searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const query = e.target.value;
                      setQuickAssignConfig((prev) => ({ ...prev, searchQuery: query }));
                    }}
                    placeholder="ابحث باسم التدريسي أو البريد الإلكتروني..."
                    className="w-full pl-4 pr-10 py-2.5 bg-white border-2 border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/10 outline-hidden transition"
                  />
                </div>

                {/* 👥 قائمة الأساتذة للاختيار المباشر */}
                <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar p-1">
                  {(() => {
                    const query = quickAssignConfig.searchQuery.trim().toLowerCase();
                    const availableTeachers = deptTeachers.filter((p: UserProfile): boolean => {
                      if (!query) return true;
                      return (
                        p.full_name.toLowerCase().includes(query) ||
                        (p.generated_email && p.generated_email.toLowerCase().includes(query)) ||
                        (Boolean(p.scientific_title) && (p.scientific_title || '').toLowerCase().includes(query))
                      );
                    });

                    if (availableTeachers.length === 0) {
                      return (
                        <div className="text-center py-8 text-slate-500 font-bold text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          لا يوجد أساتذة مطابقون لمعايير البحث في كادر القسم
                        </div>
                      );
                    }

                    return availableTeachers.map((teacher: UserProfile) => {
                      const isSelected = quickAssignConfig.selectedTeacherId === teacher.id;
                      const isCurrentlyAssigned = 
                        (quickAssignConfig.role === 'theory' && quickAssignConfig.course?.theory_teacher_id === teacher.id) ||
                        (quickAssignConfig.role === 'practical' && quickAssignConfig.course?.practical_teacher_id === teacher.id);

                      return (
                        <div
                          key={teacher.id}
                          onClick={() => {
                            setQuickAssignConfig((prev) => ({ ...prev, selectedTeacherId: teacher.id }));
                          }}
                          className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-blue-50/90 border-[#0F2942] shadow-xs ring-1 ring-[#0F2942]'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                              isSelected ? 'bg-[#0F2942] text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {teacher.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-950 text-sm">{teacher.full_name}</span>
                                {isCurrentlyAssigned && (
                                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    معيّن حالياً
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 font-bold">{teacher.scientific_title || teacher.generated_email || 'كادر تدريسي'}</span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isSelected ? (
                              <div className="w-6 h-6 rounded-full bg-[#0F2942] text-white flex items-center justify-center shadow-xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </FloatingCrudModal>

  );
};

export default QuickAssignModal; // 🚀 تصدير المكون كافتراضي
