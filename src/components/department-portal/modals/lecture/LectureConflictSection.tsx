'use client'; // ⚡ ينفذ على جهة العميل بمتصفح المستخدم

// 🛡️ مكون كاشف التعارض الزمني وقائمة محاضرات اليوم المجدولة لمودال المحاضرات
// 🇮🇶 توثيق عراقي سطر بسطر والتزام نمطي صارم بدون any أو unknown

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import {
  Clock, // 🕒 أيقونة الوقت والتوقيت
  AlertCircle, // ⚠️ أيقونة التنبيه بالتعارض
  CheckCircle2, // ✅ أيقونة سلامة الوقت من التعارض
  Calendar, // 🗓️ أيقونة التقويم الأكاديمي
  Moon, // 🌙 أيقونة الدراسة المسائية
  Sun, // ☀️ أيقونة الدراسة الصباحية
  FlaskConical, // 🧪 أيقونة المختبر العملي
  BookOpen, // 📖 أيقونة المحاضرة النظرية
  Edit3, // ✏️ أيقونة تعديل المحاضرة
  Check, // ✔️ أيقونة المحاضرة المضافة للتو
  Trash2, // 🗑️ أيقونة حذف المحاضرة
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type {
  ScheduleLecture, // 📋 واجهة المحاضرة المجدولة
  DayOfWeek, // 🗓️ نوع أيام الأسبوع
  DepartmentScheduleConfig, // ⚙️ نوع إعدادات الجدول للقسم
} from '@/types'; // 🔗 استيراد الأنواع الرسمية
import {
  DAYS_OF_WEEK_LIST, // 🗓️ قائمة أيام الأسبوع المعربة
  timeStringToMinutes, // ⏱️ تحويل الوقت لدقائق للترتيب
  calculateDateForAnyDayInWeek, // 📅 حساب التاريخ الحقيقي لليوم
  formatArabicLectureCount, // 🔤 صياغة عداد المحاضرات بالعربي
  formatArabicOrdinalLectureName, // 🎖️ صياغة اسم تسلسل المحاضرة بالعربي
  type ScheduleConflict, // ⚠️ واجهة بيانات التعارض الزمني
} from '@/lib/schedule-utils'; // 🕒 دوال حسابات الجدول الأسبوعي

// 📋 واجهة خصائص مكون كاشف التعارض ومحاضرات اليوم
export interface LectureConflictSectionProps {
  lecDay: DayOfWeek | ''; // 🗓️ اليوم المختار حالياً
  lecStartTime: string; // ⏰ وقت البدء
  lecEndTime: string; // ⏰ وقت الانتهاء
  currentLecConflicts: ScheduleConflict[]; // ⚠️ قائمة التضاربات المحسوبة
  scheduleLectures: ScheduleLecture[]; // 📋 كافة محاضرات الجدول
  selectedScheduleStage: number; // 🎓 المرحلة المختارة
  selectedScheduleSemester: 1 | 2; // 🗓️ الكورس المختار
  lecStudyType: 'morning' | 'evening'; // ☀️🌙 نوع الدراسة
  lecWeekNumber: number; // 🔢 رقم الأسبوع الحالي بالاستمارة
  selectedScheduleWeek: number; // 🔢 رقم الأسبوع بالبوابة
  editingLectureId: string | null; // ✏️ معرف المحاضرة قيد التعديل
  recentlyAddedLectureId: string | null; // 🌟 معرف المحاضرة المضافة للتو
  currentScheduleConfig: DepartmentScheduleConfig; // ⚙️ إعدادات الجدول للقسم
  lecListContainerRef: React.RefObject<HTMLDivElement | null>; // 📍 مرجع حاوية السكرول
  isLectureInCurrentDept: (l: ScheduleLecture) => boolean; // 🏢 فحص تبعية المحاضرة للقسم
  handleEditLecture: (lec: ScheduleLecture) => void; // ✏️ دالة طلب تعديل المحاضرة
  handleDeleteLecture: (id: string) => void; // 🗑️ دالة حذف المحاضرة
}

// 🏛️ دالة المكون الرئيسية لعرض كاشف التعارض وقائمة محاضرات اليوم
export const LectureConflictSection: React.FC<LectureConflictSectionProps> = ({
  lecDay, // 🗓️ اليوم المختار
  lecStartTime, // ⏰ وقت البدء
  lecEndTime, // ⏰ وقت الانتهاء
  currentLecConflicts, // ⚠️ التضاربات
  scheduleLectures, // 📋 المحاضرات
  selectedScheduleStage, // 🎓 المرحلة
  selectedScheduleSemester, // 🗓️ الكورس
  lecStudyType, // ☀️🌙 نوع الدراسة
  lecWeekNumber, // 🔢 أسبوع الاستمارة
  selectedScheduleWeek, // 🔢 أسبوع البوابة
  editingLectureId, // ✏️ المحاضرة قيد التعديل
  recentlyAddedLectureId, // 🌟 المحاضرة المضافة للتو
  currentScheduleConfig, // ⚙️ إعدادات الجدول
  lecListContainerRef, // 📍 مرجع السكرول
  isLectureInCurrentDept, // 🏢 شرط تبعية القسم
  handleEditLecture, // ✏️ دالة التعديل
  handleDeleteLecture, // 🗑️ دالة الحذف
}) => {
  return (
    // 📊 العمود الأيسر (الرصد الذكي + كاشف التعارضات + محاضرات اليوم) - 5 أعمدة
    <div className="lg:col-span-5 space-y-3.5">
      {/* ⚠️ 1. بطاقة كاشف التعارض والتضارب الزمني اللحظي */}
      {!lecDay || !lecStartTime || !lecEndTime ? (
        // ℹ️ إشعار المطالبة بإكمال المدخلات الزمنية
        <div className="p-3.5 bg-slate-100 border-2 border-slate-300 rounded-2xl flex items-center gap-2.5 text-slate-950 shadow-2xs">
          <Clock className="w-5 h-5 text-slate-600 shrink-0" />
          <div className="text-xs sm:text-sm font-black text-slate-950">
            يرجى تحديد اليوم الأسبوعي ووقتي البدء والانتهاء لتفعيل كاشف التعارض الزمني
          </div>
        </div>
      ) : currentLecConflicts.length > 0 ? (
        // 🚨 بطاقة التنبيه بوجود تعارض زمني
        <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2 animate-in slide-in-from-top-1 duration-200 shadow-xs">
          <div className="flex items-center gap-2 text-rose-950 font-black text-sm sm:text-base">
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
            <span>كاشف التعارض والتضارب الزمني ({currentLecConflicts.length}):</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {currentLecConflicts.map((c: ScheduleConflict, i: number) => (
              <div key={i} className="text-xs sm:text-sm font-black text-rose-950 bg-white p-2.5 rounded-xl border border-rose-200 flex items-start gap-2 shadow-2xs">
                <span className="px-2 py-0.5 bg-rose-700 text-white rounded-md text-[11px] font-black shrink-0">
                  {c.type === 'room' ? 'القاعة' : c.type === 'teacher' ? 'الأستاذ' : 'المرحلة'}
                </span>
                <span className="leading-snug">{c.message}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // ✅ بطاقة تأكيد خلو التوقيت والقاعة من أي تعارض
        <div className="p-3.5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-950 shadow-2xs animate-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs sm:text-sm font-black">
            لا يوجد أي تعارض زمني أو انشغال للقاعة والأستاذ في هذا التوقيت
          </div>
        </div>
      )}

      {/* 📋 2. قائمة المحاضرات المجدولة لهذا اليوم بسكرول مستقل واحترافي لمنع تمدد المودال */}
      <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl space-y-3 shadow-sm flex flex-col">
        {/* 🗓️ ترويسة قائمة المحاضرات: السطر الأول يضم العنوان وعداد المحاضرات، والسطر الثاني يضم الوسوم أسفلهما */}
        <div className="space-y-2 border-b border-slate-200 pb-3 shrink-0">
          {/* السطر الأول: عنوان المحاضرات مع الأيقونة يميناً + عداد المحاضرات يساراً */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-xs shrink-0">
                <Calendar className="w-4 h-4 text-cyan-300" />
              </div>
              <span className="text-sm sm:text-base font-black text-slate-950">
                محاضرات ({lecDay ? (DAYS_OF_WEEK_LIST.find((d) => d.key === lecDay)?.label_ar || lecDay) : 'غير محدد'})
              </span>
            </div>
            <span className="text-xs font-black text-blue-950 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 shadow-2xs shrink-0">
              {formatArabicLectureCount(lecDay ? scheduleLectures.filter((l: ScheduleLecture) => isLectureInCurrentDept(l) && l.stage_number === selectedScheduleStage && l.semester === selectedScheduleSemester && (l.study_type || 'morning') === lecStudyType && l.day === lecDay).length : 0)}
            </span>
          </div>

          {/* السطر الثاني: الوسوم أسفل العنوان وعداد المحاضرات */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* 🏷️ شارة نوع الدراسة موحدة باللون الأزرق الأكاديمي الاحترافي */}
            <span className="text-xs px-2.5 py-0.5 rounded-lg font-black flex items-center gap-1 bg-blue-50 text-blue-950 border border-blue-200 shadow-2xs">
              {lecStudyType === 'evening' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                  <span>مسائي</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                  <span>صباحي</span>
                </>
              )}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-950 border border-blue-200 font-black shadow-2xs">
              الأسبوع {lecWeekNumber}
            </span>
            {(() => {
              const baseStart = currentScheduleConfig?.start_date || '2026-09-20'; // 📅 تاريخ الانطلاق المعتمد
              const computedDate = lecDay ? calculateDateForAnyDayInWeek(baseStart, 1, lecWeekNumber, lecDay) : ''; // 📅 الحساب الدقيق للتاريخ
              return computedDate ? (
                <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-950 border border-blue-200 shadow-2xs">
                  {computedDate}
                </span>
              ) : null;
            })()}
          </div>
        </div>

        {!lecDay ? (
          // ℹ️ تنبيه عند عدم اختيار يوم
          <div className="text-sm sm:text-base font-black text-slate-800 bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-300 text-center shadow-2xs">
            حدد اليوم الأسبوعي من القائمة لاستعراض كافة المحاضرات المجدولة فيه.
          </div>
        ) : scheduleLectures.filter((l: ScheduleLecture) => isLectureInCurrentDept(l) && l.stage_number === selectedScheduleStage && l.semester === selectedScheduleSemester && (l.study_type || 'morning') === lecStudyType && l.day === lecDay).length === 0 ? (
          // ℹ️ تنبيه عند خلو اليوم من المحاضرات
          <div className="text-sm sm:text-base font-black text-slate-800 bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-300 text-center shadow-2xs">
            لا توجد محاضرات مجدولة لهذا اليوم حتى الآن.
          </div>
        ) : (
          // 📋 قائمة المحاضرات داخل حاوية التمرير
          <div 
            ref={lecListContainerRef} 
            className="space-y-3 p-1 overflow-y-auto max-h-[440px] sm:max-h-[470px] pr-1.5 scroll-smooth"
            style={{ scrollbarWidth: 'thin' }}
          >
            {scheduleLectures
              .filter((l: ScheduleLecture) => isLectureInCurrentDept(l) && l.stage_number === selectedScheduleStage && l.semester === selectedScheduleSemester && (l.study_type || 'morning') === lecStudyType && l.day === lecDay)
              // 🕒 ترتيب المحاضرات زمنياً من الصباح للمساء بشكل طبيعي واحترافي
              .sort((a: ScheduleLecture, b: ScheduleLecture) => (timeStringToMinutes(a.start_time) - timeStringToMinutes(b.start_time)) || a.course_name.localeCompare(b.course_name, 'ar'))
              .map((lecItem: ScheduleLecture, idx: number) => {
                const isNewlyAdded = recentlyAddedLectureId === lecItem.id; // 🌟 فحص هل المحاضرة مضافة أو محدثة للتو
                const isEditingCurrent = editingLectureId === lecItem.id; // ✏️ فحص هل المحاضرة هي قيد التعديل الآن
                return (
                  <div
                    key={lecItem.id}
                    id={`lec-card-${lecItem.id}`} // 🆔 معرف الكارت لعمل سكرول فوري إليه
                    className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all space-y-3 ${
                      isEditingCurrent
                        ? 'bg-blue-50/95 border-[#0F2942] ring-3 ring-blue-500/20 shadow-md scale-[1.01]'
                        : isNewlyAdded
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm'
                        : 'bg-white border-slate-300 shadow-2xs hover:border-slate-400 hover:shadow-xs'
                    }`}
                  >
                    {/* 🏷️ 1. الترويسة: الشارات على اليمين + أزرار تعديل وحذف على اليسار مصفوفة أفقياً */}
                    <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* 🎖️ وسم تسلسل المحاضرة الأكاديمي الفصيح بتصميم كحلي ملكي راقٍ ومرتب بدون أي نقاط */}
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-[#0F2942] text-white border border-[#0F2942] flex items-center gap-1.5 shadow-2xs shrink-0">
                          {/* 🏷️ عرض تسلسل المحاضرة (المحاضرة الأولى، المحاضرة الثانية...) بنص واضح ومباشر */}
                          <span>{formatArabicOrdinalLectureName(idx + 1)}</span>
                        </span>
                        {/* نوع الدراسة موحد بلون أزرق أكاديمي */}
                        <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-blue-50 text-blue-950 border border-blue-200 flex items-center gap-1 shadow-2xs">
                          {(lecItem.study_type || 'morning') === 'evening' ? (
                            <>
                              <Moon className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                              <span>مسائي</span>
                            </>
                          ) : (
                            <>
                              <Sun className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                              <span>صباحي</span>
                            </>
                          )}
                        </span>

                        {/* طبيعة المحاضرة موحدة بلون أزرق أكاديمي */}
                        <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-blue-50 text-blue-950 border border-blue-200 flex items-center gap-1 shadow-2xs">
                          {lecItem.type === 'practical' ? (
                            <>
                              <FlaskConical className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                              <span>مختبر عملي</span>
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                              <span>محاضرة نظرية</span>
                            </>
                          )}
                        </span>

                        {/* رقم الأسبوع والتاريخ الأكاديمي الحقيقي موحد ومطابق ليوم وأسبوع المحاضرة بلون أزرق أكاديمي */}
                        {(() => {
                          const baseStart = currentScheduleConfig?.start_date || '2026-09-20';
                          const previewWeek = lecWeekNumber || selectedScheduleWeek;
                          const actualDate = lecItem.weekly_overrides?.[previewWeek]?.date
                            || lecItem.custom_weekly_dates?.[previewWeek]
                            || calculateDateForAnyDayInWeek(baseStart, 1, previewWeek, lecItem.day);

                          return (
                            <>
                              <span className="bg-blue-50 text-blue-950 px-2 py-0.5 rounded-lg border border-blue-200 text-xs font-black shadow-2xs">
                                الأسبوع {previewWeek}
                              </span>
                              {actualDate && (
                                <span className="bg-blue-50 text-blue-950 px-2 py-0.5 rounded-lg border border-blue-200 text-xs font-mono font-black shadow-2xs">
                                  {actualDate}
                                </span>
                              )}
                            </>
                          );
                        })()}

                        {/* شارة قيد التعديل */}
                        {isEditingCurrent && (
                          <span className="px-2 py-0.5 bg-[#0F2942] text-white text-[11px] font-black rounded-lg shadow-xs flex items-center gap-1 animate-pulse">
                            <Edit3 className="w-3 h-3 text-cyan-300" />
                            <span>قيد التعديل</span>
                          </span>
                        )}

                        {/* شارة أضيفت للتو */}
                        {isNewlyAdded && (
                          <span className="px-2 py-0.5 bg-emerald-700 text-white text-[11px] font-black rounded-lg flex items-center gap-1 shadow-2xs">
                            <Check className="w-3.5 h-3.5 text-white shrink-0" />
                            <span>أُضيفت للتو</span>
                          </span>
                        )}
                      </div>

                      {/* 🛠️ أزرار التعديل والحذف: أفقية أنيقة متساوية الحجم */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleEditLecture(lecItem)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-[#0F2942] text-blue-950 hover:text-white border border-blue-300 hover:border-[#0F2942] rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="تعديل بيانات هذه المحاضرة"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLecture(lecItem.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-800 hover:text-white border border-rose-300 hover:border-rose-600 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="حذف هذه المحاضرة من الجدول"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>

                    {/* 📖 2. اسم المادة الأكاديمية: بخط بارز وكامل دون أي اقتطاع */}
                    <div className="text-slate-950 font-black text-sm sm:text-base leading-snug">
                      {lecItem.course_name}
                    </div>

                    {/* 🏛️ 3. شريط المعلومات: الوقت بسطر مستقل، وتحته القاعة والأستاذ بشكل ثابت واحترافي */}
                    <div className="pt-2.5 border-t border-slate-100 space-y-2">
                      {/* ⏱️ السطر الأول: باج التوقيت الأكاديمي الصريح بنظام 12 ساعة مع (ص) و (م) */}
                      <div className="flex items-center">
                        {(() => {
                          const format12Hour = (timeStr: string): { time: string; period: 'ص' | 'م' } => {
                            if (!timeStr) return { time: '00:00', period: 'ص' };
                            const parts = timeStr.trim().split(':');
                            let h = parseInt(parts[0] || '0', 10);
                            const m = (parts[1] || '00').padStart(2, '0');
                            let period: 'ص' | 'م' = 'ص';
                            if (h === 12 || h === 0) period = 'م';
                            else if (h >= 13 && h <= 23) { period = 'م'; h -= 12; }
                            else if (h >= 1 && h <= 7) period = 'م';
                            else period = 'ص';
                            const hStr = h < 10 ? `0${h}` : `${h}`;
                            return { time: `${hStr}:${m}`, period };
                          };
                          const st12 = format12Hour(lecItem.start_time);
                          const et12 = format12Hour(lecItem.end_time);
                          return (
                            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-950 px-3 py-1 rounded-lg border border-blue-200 shadow-2xs select-none">
                              <Clock className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                              <div className="inline-flex items-center gap-1 text-xs font-mono font-black" dir="rtl">
                                <span className="inline-flex items-center gap-1">
                                  <span dir="ltr" className="font-mono font-bold tracking-tight">{st12.time}</span>
                                  <span className="text-[10px] font-black text-blue-900 bg-blue-100/90 px-1 py-0.2 rounded border border-blue-200">{st12.period}</span>
                                </span>
                                <span className="text-blue-400 font-bold px-0.5 select-none leading-none">—</span>
                                <span className="inline-flex items-center gap-1">
                                  <span dir="ltr" className="font-mono font-bold tracking-tight">{et12.time}</span>
                                  <span className="text-[10px] font-black text-blue-900 bg-blue-100/90 px-1 py-0.2 rounded border border-blue-200">{et12.period}</span>
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* 🏛️ السطر الثاني: القاعة والأستاذ جنباً إلى جنب أسفل التوقيت مباشرة بشكل موحد */}
                      <div className="flex items-center gap-2 text-xs font-black text-blue-950 flex-wrap">
                        <span className="bg-blue-50 text-blue-950 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs flex items-center gap-1">
                          <span>القاعة:</span>
                          <strong className="text-blue-950 font-black">{lecItem.room || 'غير محددة'}</strong>
                        </span>
                        {lecItem.teacher_name && (
                          <span className="bg-blue-50 text-blue-950 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs flex items-center gap-1">
                            <span>الأستاذ:</span>
                            <strong className="text-blue-950 font-black">{lecItem.teacher_name}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LectureConflictSection; // 🚀 تصدير المكون
