'use client'; // ⚡ واجهة تفاعلية تشتغل بمتصفح العميل

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import { createPortal } from 'react-dom'; // 🌐 بورتال للرسم المباشر على جذر الصفحة
import {
  Users, // 👥 أيقونة الأساتذة
  FlaskConical, // 🧪 أيقونة المختبر والعملي
  Search, // 🔍 أيقونة البحث
  Check, // ✔️ أيقونة الصح
  CheckCircle2, // ✅ أيقونة التحديد
  UserMinus, // 🚫 أيقونة إلغاء التعيين
  GraduationCap, // 🎓 أيقونة المرحلة الدراسية
  Calendar, // 📅 أيقونة الكورس والفصل الدراسي
  AlertTriangle, // ⚠️ أيقونة تحذير تأكيد الإلغاء
  User, // 👤 أيقونة الأستاذ
  X, // ❌ أيقونة الإغلاق
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { UserProfile, Course } from '@/types'; // 🏷️ استيراد الأنواع البرمجية المعتمدة
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

// 🧹 دالة تنظيف وتوحيد نصوص الأسماء العربية للبحث الدقيق
const normalizeArabicText = (str: string): string => {
  return (str || '')
    .trim() // ✂️ إزالة الفراغات من الأطراف
    .toLowerCase() // 🔤 تحويل لصغير للأحرف الإنكليزية إن وجدت
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // 🧹 إزالة التشكيل والتطويل
    .replace(/[أإآ]/g, 'ا') // 🎯 توحيد الألفات
    .replace(/ة/g, 'ه') // 🎯 توحيد التاء المربوطة
    .replace(/ى/g, 'ي') // 🎯 توحيد الياء
    .replace(/\s+/g, ' '); // 📏 دمج الفراغات المتعددة بفراغ واحد
};

// 🏛️ مكون مودال التكليف والتعيين السريع للأستاذ بمادة دراسية بتصميم تنفيذي فاخر ومدمج
export const QuickAssignModal: React.FC<QuickAssignModalProps> = ({
  quickAssignConfig, // ⚙️ حالة التعيين
  setQuickAssignConfig, // 🔄 تحديث الحالة
  deptName, // 🏢 اسم القسم
  handleSaveQuickAssign, // 💾 حفظ التعيين
  deptTeachers, // 👨‍🏫 أساتذة القسم
}) => {
  // 🛡️ حالة طلب تأكيد إلغاء التكليف بكارد عائم مستقل لتجنب الضغط بالخطأ
  const [isConfirmingUnassign, setIsConfirmingUnassign] = React.useState<boolean>(false);

  // 🔄 تصفير حالة تأكيد الإلغاء إذا تغيرت حالة فتح المودال أو المادة
  React.useEffect(() => {
    setIsConfirmingUnassign(false); // 🔄 إعادة الحالة للوضع الطبيعي
  }, [quickAssignConfig.isOpen, quickAssignConfig.course?.id]);

  return (
    <>
      <FloatingCrudModal
        isOpen={quickAssignConfig.isOpen && !!quickAssignConfig.course}
        onClose={() => {
          setIsConfirmingUnassign(false); // 🔄 تصفير التأكيد عند قفل النافذة
          setQuickAssignConfig((prev) => ({ ...prev, isOpen: false })); // 🔒 قفل المودال
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
        bodyClassName="p-4 sm:p-5 overflow-hidden flex flex-col flex-1 min-h-0"
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault(); // 🛑 منع إعادة تحميل الصفحة
          if (quickAssignConfig.selectedTeacherId) { // 🔍 التأكد من اختيار أستاذ
            handleSaveQuickAssign(quickAssignConfig.selectedTeacherId); // 💾 حفظ التعيين
          }
        }}
        footer={
          <div className="flex items-center justify-between w-full gap-3 flex-wrap">
            {/* زر إلغاء التعيين وسحب التكليف الذي يفتح كارد التأكيد العائم المستقل */}
            {((quickAssignConfig.role === 'theory' && quickAssignConfig.course?.theory_teacher_id) ||
              (quickAssignConfig.role === 'practical' && quickAssignConfig.course?.practical_teacher_id)) ? (
              <button
                type="button"
                onClick={() => setIsConfirmingUnassign(true)} // 🛡️ فتح كارد التأكيد العائم بـ z-[999999]
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 font-black rounded-2xl text-xs sm:text-sm transition cursor-pointer border border-rose-300 shadow-2xs active:scale-95 flex items-center gap-1.5"
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
                  setIsConfirmingUnassign(false); // 🔄 تصفير التأكيد
                  setQuickAssignConfig((prev) => ({ ...prev, isOpen: false })); // 🔒 إغلاق
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-black font-black rounded-2xl text-xs sm:text-sm transition cursor-pointer border-2 border-slate-400 shadow-2xs active:scale-95"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={!quickAssignConfig.selectedTeacherId}
                className="px-5 py-2 bg-[#0F2942] hover:bg-[#163a5f] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer border border-[#0F2942] active:scale-95 whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>تأكيد التعيين والتكليف</span>
              </button>
            </div>
          </div>
        }
      >
        {quickAssignConfig.course && (
          <div className="space-y-3 text-right flex flex-col flex-1 min-h-0">
            {/* 📋 كارت بيانات المادة المستهدفة - تصميم تنفيذي فخم، مدمج وثابت بالأعلى بدون أي انزلاق */}
            <div className="p-3 bg-gradient-to-r from-slate-50 via-blue-50/25 to-slate-50 border border-slate-300 rounded-2xl shadow-2xs shrink-0">
              {/* الصف العلوي: رمز المادة واسمها وصفة التكليف */}
              <div className="flex items-center justify-between gap-2.5 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black bg-[#0F2942] text-white px-2.5 py-1 rounded-lg shadow-2xs">
                    {quickAssignConfig.course.code}
                  </span>
                  <h3 className="font-black text-black text-sm sm:text-base leading-tight">
                    {quickAssignConfig.course.name}
                  </h3>
                </div>

                {/* شارة صفة التدريس المطلوبة */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border shadow-2xs ${
                  quickAssignConfig.role === 'theory'
                    ? 'bg-blue-50 text-black border-blue-300'
                    : 'bg-emerald-50 text-black border-emerald-300'
                }`}>
                  {quickAssignConfig.role === 'theory' ? (
                    <>
                      <Users className="w-3.5 h-3.5 text-[#0F2942]" />
                      <span className="text-black font-black">تدريس النظري</span>
                    </>
                  ) : (
                    <>
                      <FlaskConical className="w-3.5 h-3.5 text-emerald-800" />
                      <span className="text-black font-black">تدريس العملي والمختبر</span>
                    </>
                  )}
                </span>
              </div>

              {/* الصف السفلي: شارات المرحلة والكورس بنصوص سوداء داكنة وواضحة جداً */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-300 mt-2 flex-wrap">
                {/* شارة المرحلة الدراسية الواضحة والبارزة بحجم متوسط ونصوص سوداء */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-300 text-black text-xs sm:text-sm font-black shadow-2xs">
                  <GraduationCap className="w-4 h-4 text-[#0F2942] shrink-0" />
                  <span className="text-black font-black">المرحلة:</span>
                  <span className="text-black font-black">
                    المرحلة {getStageNameInArabic(quickAssignConfig.course.stage_number || 1)}
                  </span>
                </div>

                {/* شارة الكورس أو الفصل الدراسي الواضحة والبارزة بحجم متوسط ونصوص سوداء */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-300 text-black text-xs sm:text-sm font-black shadow-2xs">
                  <Calendar className="w-4 h-4 text-[#0F2942] shrink-0" />
                  <span className="text-black font-black">الكورس:</span>
                  <span className="text-black font-black">
                    {quickAssignConfig.course.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول'}
                  </span>
                </div>
              </div>
            </div>

            {/* 🔍 حقل البحث السريع بنص أسود داكن وأيقونة واضحة */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-black absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quickAssignConfig.searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const query = e.target.value; // 📝 قراءة نص البحث
                  setQuickAssignConfig((prev) => ({ ...prev, searchQuery: query })); // 🔄 تحديث البحث
                }}
                placeholder="ابحث عن اسم الأستاذ أو لقبه العلمي..."
                className="w-full pl-4 pr-10 py-2.5 bg-white border-2 border-slate-300 rounded-2xl text-black font-black text-sm focus:border-[#0F2942] focus:ring-1 focus:ring-[#0F2942] outline-hidden transition placeholder:text-slate-600 placeholder:font-bold"
              />
            </div>

            {(() => {
              const query = normalizeArabicText(quickAssignConfig.searchQuery); // 🔍 تنظيف وتوحيد نص البحث

              // 🎯 فرز الأساتذة بحيث يظهر المكلف حالياً في الصدارة
              const sortedTeachers = [...deptTeachers].sort((a: UserProfile, b: UserProfile) => {
                const isA = (quickAssignConfig.role === 'theory' && quickAssignConfig.course?.theory_teacher_id === a.id) ||
                            (quickAssignConfig.role === 'practical' && quickAssignConfig.course?.practical_teacher_id === a.id); // 📌 أستاذ A مكلف
                const isB = (quickAssignConfig.role === 'theory' && quickAssignConfig.course?.theory_teacher_id === b.id) ||
                            (quickAssignConfig.role === 'practical' && quickAssignConfig.course?.practical_teacher_id === b.id); // 📌 أستاذ B مكلف
                return (isB ? 1 : 0) - (isA ? 1 : 0); // 🔝 تقديم المعين حالياً
              });

              // 🎯 استخراج الأساتذة الفريدين بالمعرف والاسم الموحد
              const seenIds = new Set<string>(); // 🛡️ مجموعة معرفات الأساتذة
              const uniqueTeachers: UserProfile[] = []; // 📋 قائمة الأساتذة النهائية

              sortedTeachers.forEach((teacher: UserProfile) => {
                if (!seenIds.has(teacher.id)) { // 🔍 التحقق من عدم التكرار
                  seenIds.add(teacher.id); // 🔒 تسجيل المعرف
                  uniqueTeachers.push(teacher); // ➕ إضافة التدريسي
                }
              });

              // 🎯 تصفية الأساتذة بحسب الاسم واللقب العلمي فقط وبدون أي إظهار للبريد
              const availableTeachers = uniqueTeachers.filter((p: UserProfile): boolean => {
                if (!query) return true; // ✅ إذا ماكو نص بحث يظهر الكل
                return (
                  normalizeArabicText(p.full_name).includes(query) ||
                  (Boolean(p.scientific_title) && normalizeArabicText(p.scientific_title || '').includes(query))
                );
              });

              return (
                <div className="space-y-2 flex flex-col flex-1 min-h-0">
                  {/* 👥 شريط عنوان قائمة الأساتذة: نص أكبر بحجم متوسط ونصوص سوداء داكنة */}
                  <div className="flex items-center justify-between px-1 text-sm sm:text-base shrink-0">
                    <div className="flex items-center gap-2 font-black text-black">
                      <Users className="w-5 h-5 text-[#0F2942] shrink-0" />
                      <span className="text-black font-black text-sm sm:text-base">قائمة الأساتذة والتدريسيين المتاحين</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border-2 border-slate-300 text-black font-black shadow-2xs text-xs sm:text-sm">
                      <span className="text-black font-black">عدد التدريسيين:</span>
                      <span className="text-white font-black text-xs sm:text-sm bg-[#0F2942] px-2.5 py-0.5 rounded-lg shadow-2xs">
                        {availableTeachers.length}
                      </span>
                      {query && availableTeachers.length !== uniqueTeachers.length && (
                        <span className="text-black font-bold text-xs">
                          من أصل {uniqueTeachers.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 👥 قائمة الأساتذة للاختيار المباشر بسكرول مخصص ونصوص سوداء بالكامل وبدون حروف */}
                  <div 
                    className="space-y-2 overflow-y-auto p-1.5 border-2 border-slate-200 rounded-2xl bg-slate-50/50 flex-1 min-h-0"
                    style={{
                      maxHeight: '260px', // 📏 أقصى ارتفاع مريح يمنع أي سكرول في جسم المودال
                      overflowY: 'auto', // 🔄 سكرول عمودي سلس
                      scrollbarWidth: 'thin', // 🎨 سكرول نحيف وعصري
                      scrollbarColor: '#0F2942 #E2E8F0', // 🎨 ألوان السكرول الكحلي والرمادي
                    }}
                  >
                    {availableTeachers.length === 0 ? (
                      <div className="text-center py-6 text-black font-black text-sm bg-white rounded-xl border border-dashed border-slate-300">
                        لا يوجد أساتذة مطابقون لمعايير البحث في كادر القسم
                      </div>
                    ) : (
                      availableTeachers.map((teacher: UserProfile) => {
                        const isSelected = quickAssignConfig.selectedTeacherId === teacher.id; // 🔘 هل الأستاذ محدد حالياً
                        const isCurrentlyAssigned = 
                          (quickAssignConfig.role === 'theory' && quickAssignConfig.course?.theory_teacher_id === teacher.id) ||
                          (quickAssignConfig.role === 'practical' && quickAssignConfig.course?.practical_teacher_id === teacher.id); // 📌 هل هو المكلف رسمياً

                        return (
                          <div
                            key={teacher.id}
                            onClick={() => {
                              setQuickAssignConfig((prev) => ({ ...prev, selectedTeacherId: teacher.id })); // 🎯 اختيار هذا التدريسي
                            }}
                            className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-blue-50/95 border-[#0F2942] shadow-xs'
                                : 'bg-white hover:bg-slate-50 border-slate-300'
                            }`}
                          >
                            {/* 👤 أيقونة رمزية موحدة واسم الأستاذ بنص أسود داكن وبدون أي حروف */}
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                                isSelected ? 'bg-[#0F2942] text-white shadow-2xs' : 'bg-slate-100 border border-slate-300 text-black'
                              }`}>
                                <User className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-black'}`} /> {/* 👤 أيقونة الأستاذ */}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-black text-sm sm:text-base">
                                    {teacher.full_name}
                                  </span>
                                  {isCurrentlyAssigned && (
                                    <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-emerald-100 text-emerald-950 border border-emerald-400">
                                      معيّن حالياً
                                    </span>
                                  )}
                                </div>
                                {/* 🔒 عرض اللقب العلمي بنص أسود داكن واضح */}
                                <span className="text-xs sm:text-sm text-black font-bold">
                                  {teacher.scientific_title || 'كادر تدريسي بالقسم'}
                                </span>
                              </div>
                            </div>

                            {/* 🔘 دائرة الاختيار والتحديد الأنيقة والواضحة */}
                            <div className="shrink-0">
                              {isSelected ? (
                                <div className="w-6 h-6 rounded-full bg-[#0F2942] text-white flex items-center justify-center shadow-xs">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-slate-600" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </FloatingCrudModal>

      {/* 🔐 كارد تأكيد إلغاء التكليف العائم بـ z-[999999] في منتصف الشاشة وفق طلب المستخدم */}
      {isConfirmingUnassign && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150" 
          dir="rtl"
          onClick={() => setIsConfirmingUnassign(false)}
        >
          <div 
            className="bg-white border-2 border-slate-300 rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4 text-right relative animate-in zoom-in-95 duration-150 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ❌ زر الإغلاق السريع */}
            <button
              type="button"
              onClick={() => setIsConfirmingUnassign(false)}
              className="absolute top-4 left-4 p-2 text-black hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ⚠️ أيقونة التنبيه التحذيري */}
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>

            {/* 🏷️ النصوص التوضيحية للتأكيد */}
            <div className="text-center space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-black">
                تأكيد إلغاء التكليف الدراسي
              </h3>
              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                هل أنت متأكد من رغبتك في إلغاء تكليف الأستاذ لمادة{' '}
                <span className="font-black text-black">
                  ({quickAssignConfig.course?.name})
                </span>{' '}
                وتحويل الخانة إلى غير معيّن؟
              </p>
            </div>

            {/* 🔘 أزرار الإجراء: تأكيد الإلغاء أو التراجع */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingUnassign(false); // 🔄 إغلاق كارد التأكيد
                  handleSaveQuickAssign(null); // 🚫 تنفيذ إلغاء التكليف
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-sm transition cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <UserMinus className="w-4 h-4" />
                <span>نعم، تأكيد الإلغاء</span>
              </button>

              <button
                type="button"
                onClick={() => setIsConfirmingUnassign(false)}
                className="flex-1 py-2.5 bg-white hover:bg-slate-100 text-black font-black rounded-2xl text-sm transition cursor-pointer border-2 border-slate-300 active:scale-95 text-center shadow-2xs"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default QuickAssignModal; // 🚀 تصدير المكون كافتراضي
