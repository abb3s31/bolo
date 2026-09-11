'use client'; // ⚡ ينفذ على جهة العميل بالمتصفح

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import Image from 'next/image'; // 🖼️ استيراد مكون الصور من نكست لطباعة شعار الجامعة الرسمي
import { createPortal } from 'react-dom'; // 🚪 بورتال لرسم نوافذ الطباعة فوق شجرة الـ DOM
import {
  X, // ❌ أيقونة إغلاق النوافذ
  Printer, // 🖨️ أيقونة الطباعة وتصدير PDF
  RefreshCw, // 🔄 أيقونة التحديث وإعادة الضبط
  AlertCircle, // ⚠️ أيقونة التنبيه والتحذير
  User, // 👤 أيقونة الأستاذ والمستخدم
  Mail, // ✉️ أيقونة البريد الأكاديمي
  KeyRound, // 🔑 أيقونة كلمة المرور
  Globe, // 🌐 أيقونة رابط البوابة
  GraduationCap, // 🎓 أيقونة المرحلة الأكاديمية
  Clock, // ⏰ أيقونة التوقيت والفترة
  Calendar, // 🗓️ أيقونة التقويم والجدول الأكاديمي
  Layers, // 📚 أيقونة الكورس والطبقات الدراسية
  Sun, // ☀️ أيقونة الدراسة الصباحية
  Moon, // 🌙 أيقونة الدراسة المسائية
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد המعتمدة
import StudentScheduleTimeline from '@/components/schedule/StudentScheduleTimeline'; // 🗓️ مكون الجدول الأسبوعي والـ Timeline
import { PrintFilterDropdown, PrintFilterOption } from '@/components/PrintFilterDropdown'; // 🖨️ قائمة تصفية الطباعة الاحترافية
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧮 التعرف الذكي على جنس التدريسي
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 تحويل رقم المرحلة إلى اسمها العربي المعتمد
import { getAcademicYear } from '@/lib/mock-data'; // 🗓️ دالة العام الدراسي الحالي
import { GroupBadgeSvg } from '@/components/common/GroupSvgIcons'; // 👥 استيراد أيقونة الكروب الفيكتورية النقية SVG
import {
  UserProfile, // 👤 واجهة الملف التعريفي للمستخدم
  Course, // 📚 واجهة بيانات المقرر الدراسي
  TeacherCourse, // 👨‍🏫 واجهة تكليف التدريسي بالمقرر
  ScheduleLecture, // 🕒 واجهة محاضرة الجدول الأسبوعي
  DepartmentScheduleConfig, // ⚙️ واجهة إعدادات الجدول للقسم
  StageGroupConfig, // ⚙️ نوع إعدادات كروبات المراحل الدراسية
} from '@/types'; // 🔗 استيراد الأنواع الرسمية

// 📋 واجهة الخصائص الشاملة لمكون نوافذ الطباعة والمعاينة بالقسم الأكاديمي
export interface DepartmentPrintModalsProps {
  // 🗓️ خصائص معاينة وطباعة الجدول الأسبوعي
  isPreviewScheduleModalOpen: boolean; // 🪟 حالة فتح نافذة معاينة الجدول
  setIsPreviewScheduleModalOpen: (open: boolean) => void; // 🔄 دالة التحكم بفتح نافذة معاينة الجدول
  isSchedulePrintModalOpen: boolean; // 🖨️ حالة فتح مودال طباعة جدول المحاضرات مباشرة
  setIsSchedulePrintModalOpen: (open: boolean) => void; // 🔄 دالة التحكم بمودال طباعة جدول المحاضرات
  currentDeptId: string; // 🏢 معرف القسم الأكاديمي الحالي
  deptName: string; // 🏷️ اسم القسم الأكاديمي الحالي
  currentHead?: { full_name?: string } | null; // 👤 رئيس القسم الأكاديمي
  currentRap?: { full_name?: string } | null; // 👤 مقرر القسم الأكاديمي
  selectedScheduleStage: number; // 🎓 المرحلة المختارة لعرض الجدول
  setSelectedScheduleStage?: React.Dispatch<React.SetStateAction<number>> | ((stage: number) => void); // 🔄 دالة تحديث المرحلة المختارة بالمعاينة والمزامنة مع الصفحة الرئيسية
  scheduleLectures: ScheduleLecture[]; // 📚 محاضرات الجدول للقسم
  scheduleConfigs: DepartmentScheduleConfig[]; // ⚙️ إعدادات الجدول وتوقيتات الدوام
  academicYear?: string; // 🗓️ العام الدراسي الحالي
  selectedScheduleSemester: number; // 🗓️ الكورس الدراسي المختار
  selectedScheduleStudyType: 'morning' | 'evening'; // ☀️🌙 نوع الدراسة
  selectedScheduleGroup?: string; // 👥 الكروب المحدد بالجدول لفتحه بالمعاينة مباشرة
  stageGroupConfigs?: StageGroupConfig[]; // 👥 إعدادات كروبات مراحل القسم الدراسية

  // 👨‍🏫 خصائص نافذة طباعة بطاقات اعتماد الأساتذة
  showTeacherPrintModal: boolean; // 🖨️ حالة فتح نافذة طباعة بطاقات الأساتذة
  setShowTeacherPrintModal: (show: boolean) => void; // 🔄 دالة التحكم بنافذة طباعة الأساتذة
  singleTeacherPrintProfile: UserProfile | null; // 👤 أستاذ فردي للطباعة أو فارغ للكل
  setSingleTeacherPrintProfile: (p: UserProfile | null) => void; // 🔄 دالة تحديد الأستاذ الفردي للطباعة
  selectedTeacherIds: string[]; // 📋 قائمة معرفات الأساتذة المحددين
  deptTeachers: UserProfile[]; // 👥 قائمة كافة أساتذة القسم

  // 🎓 خصائص نافذة طباعة بطاقات اعتماد الطلاب
  showStudentPrintModal: boolean; // 🖨️ حالة فتح نافذة طباعة بطاقات الطلاب
  setShowStudentPrintModal: (show: boolean) => void; // 🔄 دالة التحكم بنافذة طباعة الطلاب
  singleStudentPrintProfile: UserProfile | null; // 🎓 طالب فردي للطباعة أو فارغ للكل
  setSingleStudentPrintProfile: (p: UserProfile | null) => void; // 🔄 دالة تحديد الطالب الفردي للطباعة
  selectedStudentIds: string[]; // 📋 قائمة معرفات الطلاب المحددين
  deptStudents: UserProfile[]; // 👥 قائمة كافة طلاب القسم
  studentPrintStageFilter: number | 'all'; // 📚 فلتر المرحلة لطباعة الطلاب
  setStudentPrintStageFilter: (stage: number | 'all') => void; // 🔄 دالة تعيين فلتر المرحلة
  studentPrintStudyFilter: 'all' | 'morning' | 'evening'; // ☀️🌙 فلتر الفترة لطباعة الطلاب
  setStudentPrintStudyFilter: (study: 'all' | 'morning' | 'evening') => void; // 🔄 دالة تعيين فلتر الفترة

  // 📑 خصائص نافذة طباعة جدول تكليفات الكادر التدريسي الرسمية
  showAssignmentsPrintModal: boolean; // 🖨️ حالة فتح نافذة طباعة جدول التكليفات
  setShowAssignmentsPrintModal: (show: boolean) => void; // 🔄 دالة التحكم بنافذة طباعة التكليفات
  assignmentsPrintScope: 'all' | 'filtered'; // 🎯 نطاق طباعة التكليفات
  setAssignmentsPrintScope: (scope: 'all' | 'filtered') => void; // 🔄 دالة تعيين نطاق طباعة التكليفات
  deptTeacherCourses: TeacherCourse[]; // 📋 كافة تكليفات القسم
  filteredTeacherCourses: TeacherCourse[]; // 📋 التكليفات المفلترة
  courses: Course[]; // 📚 قائمة المقررات الدراسية لجلب التفاصيل

  // ⚡ حالة جهوزية الـ DOM للتثبيت بالبورتال
  isMounted: boolean; // 🌐 تأكيد اكتمال تحميل الواجهة بالعميل قبل استدعاء createPortal
}

// 🖨️ مكون نوافذ المعاينة والطباعة الموحدة لقسم بولونيا الأكاديمي
export const DepartmentPrintModals: React.FC<DepartmentPrintModalsProps> = ({
  isPreviewScheduleModalOpen,
  setIsPreviewScheduleModalOpen,
  isSchedulePrintModalOpen,
  setIsSchedulePrintModalOpen,
  currentDeptId,
  deptName,
  currentHead,
  currentRap,
  selectedScheduleStage,
  setSelectedScheduleStage, // 🔄 دالة تحديث المرحلة بالمعاينة
  scheduleLectures,
  scheduleConfigs,
  academicYear,
  selectedScheduleSemester,
  selectedScheduleStudyType,
  selectedScheduleGroup, // 👥 استلام الكروب المختار لفتحه بالمعاينة والطباعة مباشرة
  stageGroupConfigs, // 👥 استلام إعدادات كروبات المراحل لتمريرها لجدول الطلاب
  showTeacherPrintModal,
  setShowTeacherPrintModal,
  singleTeacherPrintProfile,
  setSingleTeacherPrintProfile,
  selectedTeacherIds,
  deptTeachers,
  showStudentPrintModal,
  setShowStudentPrintModal,
  singleStudentPrintProfile,
  setSingleStudentPrintProfile,
  selectedStudentIds,
  deptStudents,
  studentPrintStageFilter,
  setStudentPrintStageFilter,
  studentPrintStudyFilter,
  setStudentPrintStudyFilter,
  showAssignmentsPrintModal,
  setShowAssignmentsPrintModal,
  assignmentsPrintScope,
  setAssignmentsPrintScope,
  deptTeacherCourses,
  filteredTeacherCourses,
  courses,
  isMounted,
}) => {
  const effectiveAcademicYear = academicYear || getAcademicYear(); // 🗓️ حساب العام الدراسي الأكاديمي الفعلي

  return (
    <>
      {isPreviewScheduleModalOpen && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-2 sm:p-4 overflow-hidden" dir="rtl">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-6xl w-full max-h-[92vh] shadow-2xl flex flex-col text-right relative overflow-hidden">
            {/* 📌 هيدر ثابت ومستقر ما يتحرك أبداً ويه سكرول الجدول */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 bg-white shrink-0 z-30 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-2xs">
                  <Calendar className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2 flex-wrap">
                    <span>معاينة جدول الطلاب</span> {/* 🏷️ عنوان النافذة الرسمي */}
                    {/* 1️⃣ 🎓 وسم المرحلة الدراسية بلون كحلي ملكي أخف وأيقونة تخرج سماوية */}
                    <span className="px-3.5 py-1 rounded-xl bg-[#1e4570] text-white text-xs sm:text-sm font-black border border-[#2e5988] shadow-2xs flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-cyan-300 shrink-0" /> {/* 🎓 أيقونة المرحلة بالسماوي */}
                      <span>المرحلة {getStageNameInArabic(selectedScheduleStage)}</span> {/* 🏷️ اسم المرحلة بالعربية */}
                    </span>
                    {/* 2️⃣ 🗓️ وسم الكورس الدراسي الأكاديمي بلون كحلي ملكي أخف */}
                    <span className="px-3.5 py-1 rounded-xl bg-[#1e4570] text-white text-xs sm:text-sm font-black border border-[#2e5988] shadow-2xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-300 shrink-0" /> {/* 📚 أيقونة الكورس بالسماوي */}
                      <span>الكورس {selectedScheduleSemester === 2 ? 'الثاني' : 'الأول'}</span> {/* 🗓️ اسم الكورس */}
                    </span>
                    {/* 3️⃣ 👥 وسم الكروب الأكاديمي المختار مرتب قبل صباحي بلون كحلي ملكي أخف */}
                    {selectedScheduleGroup && selectedScheduleGroup !== 'all' && (
                      <span className="px-3.5 py-1 rounded-xl bg-[#1e4570] text-white text-xs sm:text-sm font-black border border-[#2e5988] shadow-2xs flex items-center gap-1.5">
                        <GroupBadgeSvg className="w-3.5 h-3.5 text-cyan-300 shrink-0" /> {/* 👥 أيقونة الكروب الفيكتورية SVG */}
                        <span>كروب {selectedScheduleGroup}</span> {/* 🏷️ اسم الكروب */}
                      </span>
                    )}
                    {/* 4️⃣ ☀️🌙 وسم الفترة الدراسية (صباحي / مسائي) مرتب رابعاً بعد الكروب بلون كحلي ملكي أخف */}
                    <span className="px-3.5 py-1 rounded-xl bg-[#1e4570] text-white text-xs sm:text-sm font-black border border-[#2e5988] shadow-2xs flex items-center gap-1.5">
                      {selectedScheduleStudyType === 'evening' ? (
                        <Moon className="w-3.5 h-3.5 text-cyan-300 shrink-0" /> // 🌙 أيقونة المسائي بالسماوي
                      ) : (
                        <Sun className="w-3.5 h-3.5 text-cyan-300 shrink-0" /> // ☀️ أيقونة الصباحي بالسماوي
                      )}
                      <span>{selectedScheduleStudyType === 'evening' ? 'مسائي' : 'صباحي'}</span> {/* 🏷️ اسم الفترة فصيح ومباشر */}
                    </span>
                  </h3>
                  {/* 📝 العنوان الفرعي بحجم أكبر قليلاً ولون أسود فاحم وواضح جداً */}
                  <p className="text-xs sm:text-sm font-black text-slate-950 mt-1">
                    استعراض الجدول الأكاديمي الشامل وفق نظام مسار بولونيا بدقة واكتمال
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewScheduleModalOpen(false)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 cursor-pointer"
                title="إغلاق المعاينة"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 📜 منطقة عرض محتوى الجدول الأكاديمي ممتدة مباشرة بكامل مساحة الكارد الكبير بدون تكرار إطارات */}
            <div
              className="p-0 overflow-y-auto flex-1 overscroll-contain [overflow-anchor:none]"
              style={{ scrollbarGutter: 'stable' }}
            >
              <StudentScheduleTimeline
                departmentId={currentDeptId}
                departmentName={deptName}
                departmentHeadName={currentHead?.full_name}
                rapporteurName={currentRap?.full_name}
                stageNumber={selectedScheduleStage}
                lectures={scheduleLectures}
                configs={scheduleConfigs}
                academicYear={effectiveAcademicYear} // 🗓️ تمرير العام الدراسي العام المعتمد بالنظام
                initialSemester={(selectedScheduleSemester === 2 ? 2 : 1)}
                initialStudyType={selectedScheduleStudyType}
                initialGroup={selectedScheduleGroup && selectedScheduleGroup !== 'all' ? selectedScheduleGroup : undefined} // 👥 فتح المعاينة على الكروب المختار مباشرة
                showSemesterSwitcher={true}
                showStageSwitcher={true} // 🎓 إظهار شريط تبويبات المراحل الأكاديمية الأربعة للمعاينة الحية
                onStageChange={setSelectedScheduleStage} // 🔄 تحديث المرحلة النشطة تلقائياً بالمودال والصفحة فور النقر
                stageGroupConfigs={stageGroupConfigs} // 👥 تمرير إعدادات الكروبات للمعاينة لعزل كل كروب بجدوله الخاص
              />
            </div>
          </div>
        </div>
      )}

      {/* 🖨️ نافذة ومودال طباعة جدول المحاضرات الأسبوعي المعتمد بصيغة PDF مباشرة */}
      {isSchedulePrintModalOpen && (
        <StudentScheduleTimeline
          departmentId={currentDeptId}
          departmentName={deptName}
          departmentHeadName={currentHead?.full_name}
          rapporteurName={currentRap?.full_name}
          stageNumber={selectedScheduleStage}
          lectures={scheduleLectures}
          configs={scheduleConfigs}
          academicYear={effectiveAcademicYear} // 🗓️ تمرير العام الدراسي العام المعتمد بالنظام
          initialSemester={(selectedScheduleSemester === 2 ? 2 : 1)}
          initialStudyType={selectedScheduleStudyType}
          initialGroup={selectedScheduleGroup && selectedScheduleGroup !== 'all' ? selectedScheduleGroup : undefined} // 👥 طباعة الكروب المختار مباشرة
          showSemesterSwitcher={true}
          initialOpenPrintModal={true}
          onClosePrintModal={() => setIsSchedulePrintModalOpen(false)}
          stageGroupConfigs={stageGroupConfigs} // 👥 تمرير إعدادات الكروبات لطباعة جدول الكروب المستقل
        />
      )}

      {showTeacherPrintModal && isMounted && typeof document !== 'undefined' && createPortal((() => {
        const printList = singleTeacherPrintProfile
          ? [singleTeacherPrintProfile]
          : (selectedTeacherIds.length > 0
              ? deptTeachers.filter((t) => selectedTeacherIds.includes(t.id))
              : [...deptTeachers]);

        printList.sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar'));

        return (
          <div 
            id="printable-modal-portal"
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:static print:bg-white print:backdrop-blur-none print:w-full print:h-auto print:min-h-0 print:overflow-visible print:block" 
            dir="rtl"
          >
            <div className="bg-white border-2 border-slate-400 rounded-3xl w-full max-w-5xl max-h-[94vh] shadow-2xl flex flex-col relative overflow-hidden text-right print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none print:overflow-visible print:static print:block print:h-auto">
              
              {/* شريط الأدوات العلوي */}
              <div className="p-4 sm:p-5 border-b-2 border-slate-300 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 z-10 print:hidden no-print">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0F2942] text-cyan-300 rounded-2xl shadow-xs">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-black flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <span>معاينة وطباعة بطاقات اعتماد الأساتذة — قسم {deptName}</span>
                      <span className="px-3 py-1 rounded-full bg-slate-200 text-black text-xs font-black border border-slate-300 whitespace-nowrap shrink-0 inline-block">
                        {printList.length} بطاقة (10 بطاقات بالصفحة PDF)
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm font-black text-slate-800">
                      شبكة ثنائية 2x5 فائقة الكفاءة ومضغوطة لتوفير استهلاك الأوراق
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5 shrink-0">
                  {singleTeacherPrintProfile && (
                    <button
                      type="button"
                      onClick={() => setSingleTeacherPrintProfile(null)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4 text-black" />
                      <span>عرض كافة الأساتذة ({deptTeachers.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => window.print()}
                    disabled={printList.length === 0}
                    className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] disabled:bg-slate-300 text-white rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#0F2942] active:scale-95"
                    title="طباعة وتصدير بطاقات الاعتماد بصيغة PDF (10 بطاقات بالصفحة)"
                  >
                    <Printer className="w-4 h-4 text-cyan-300" />
                    <span>طباعة وتصدير PDF الآن ({printList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowTeacherPrintModal(false);
                      setSingleTeacherPrintProfile(null);
                    }}
                    className="p-2.5 bg-slate-200 hover:bg-slate-300 text-black rounded-2xl transition cursor-pointer shrink-0"
                    title="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* منطقة الطباعة بنظام الشبكة 2 عمود × 5 صفوف */}
              <div className="p-3 sm:p-5 overflow-y-auto flex-1 overscroll-contain printable-batch-area bg-slate-100 print:bg-white print:p-0 print:overflow-visible print:static print:block print:h-auto">
                {printList.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border-2 border-slate-300 space-y-3 my-6">
                    <AlertCircle className="w-10 h-10 text-indigo-950 mx-auto" />
                    <p className="text-base font-black text-black">لا يوجد أساتذة محددين للطباعة حالياً.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 print:grid-cols-2 print:gap-1 w-full cards-grid-8 max-w-5xl mx-auto">
                    {printList.map((teacher: UserProfile, index: number) => {
                      const isFemale = (teacher.gender || detectArabicGender(teacher.full_name)) === 'female';
                      const roleTitle = isFemale ? 'أستاذة جامعية' : 'أستاذ جامعي';
                      const currentOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://192.168.0.185:3000';
                      const loginPortalUrl = `${currentOrigin}/teacher`;
                      const loginPortalCleanUrl = loginPortalUrl.replace(/^https?:\/\//, '');

                      return (
                        <div
                          key={teacher.id || index} // 🔑 مفتاح فريد لكل كارد أستاذ بالرندر
                          className="bg-white border border-slate-400 rounded-xl p-2 print:p-1.5 shadow-xs break-inside-avoid print:break-inside-avoid print:border print:border-slate-500 print:rounded-lg print:shadow-none w-full flex flex-col justify-between card-item-8" // 🗂️ حاوية الكارد الأكاديمي بارتفاع 52 ملم تملأ الورقة بالكامل بدون فراغات زائدة
                        >
                          {/* 🏛️ 1. ترويسة الكارد الرسمية: الشعار وعنوان الجامعة وشارة التدريسي بخطوط سوداء فاحمة وواضحة */}
                          <div className="flex items-center justify-between border-b border-slate-300 pb-1 print:pb-0.5"> {/* 📐 حاوية الترويسة مع خط فاصل داكن */}
                            <div className="flex items-center gap-1.5 overflow-hidden"> {/* 🏢 مجمع الشعار والعناوين الرسمية */}
                              {/* شعار الجامعة الرسمي بجودة واضحة وبحجم مدمج */}
                              <div className="relative w-8 h-8 print:w-7 print:h-7 flex-shrink-0"> {/* 🖼️ إطار أبعاد الشعار الرسمي */}
                                <Image // 🖼️ مكون صورة الشعار
                                  src="/logo.webp" // 📍 مسار الشعار المعتمد
                                  alt="شعار جامعة الصادق" // 🏷️ نص بديل لأغراض الوصولية
                                  width={32} // 📏 العرض بالبكسل
                                  height={32} // 📏 الارتفاع بالبكسل
                                  className="object-contain" // 🎨 احتواء الصورة بالكامل بدون تشويه
                                  priority // ⚡ تحميل سريع وفوري
                                  unoptimized // 🚀 بدون تحسين إضافي للملفات المحلية
                                />
                              </div>
                              {/* العناوين الرسمية لجامعة الإمام الصادق ومسار بولونيا بخط أسود بارز ومقروء */}
                              <div className="flex flex-col justify-center leading-none min-w-0"> {/* 📝 نصوص اسم الجامعة والوزارة */}
                                <h4 className="text-xs print:text-[11px] font-black text-black whitespace-nowrap leading-tight"> {/* 🏛️ اسم الجامعة وفرع ميسان بلون أسود عريض وواضح */}
                                  جامعة الإمام جعفر الصادق (ع) — فرع ميسان
                                </h4>
                                <p className="text-[10px] print:text-[9.5px] text-black font-extrabold whitespace-nowrap leading-tight mt-0.5"> {/* 📜 اسم الوزارة والمسار بخط أسود بارز */}
                                  وزارة التعليم العالي والبحث العلمي — مسار بولونيا
                                </p>
                              </div>
                            </div>
                            {/* شارة الهوية الرسمية للأستاذ أو الأستاذة بخط أسود بارز ومحاط بإطار أنيق */}
                            <span className="px-2 py-0.5 rounded-md bg-white text-black text-[10px] print:text-[9.5px] font-black border border-slate-300 whitespace-nowrap shrink-0 shadow-2xs"> {/* 🏷️ باج الهوية الأكاديمية */}
                              {roleTitle}
                            </span>
                          </div>

                          {/* 👤 2. شريط هوية الأستاذ والقسم التابع إله بخطوط سوداء عريضة */}
                          <div className="flex items-center justify-between gap-2 py-0.5 px-0.5"> {/* 📌 حاوية اسم التدريسي والقسم العلمي بتنسيق ممتلئ وأنيق */}
                            <div className="flex items-center gap-1.5 overflow-hidden"> {/* 🏷️ أيقونة واسم الأستاذ */}
                              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-300"> {/* ⭕ دائرة أيقونة المستخدم */}
                                <User className="w-3 h-3 text-[#0F2942]" /> {/* 👤 أيقونة الأستاذ باللون النيلي */}
                              </div>
                              <span className="text-sm print:text-[12px] font-black text-black truncate"> {/* ✍️ الاسم الكامل للتدريسي بخط أسود كبير وواضح */}
                                {teacher.full_name}
                              </span>
                            </div>
                            <span className="text-[10.5px] print:text-[10px] font-black text-black bg-white px-2 py-0.5 rounded-md border border-slate-300 whitespace-nowrap shrink-0 shadow-2xs"> {/* 🏢 اسم القسم العلمي بخط أسود عريض */}
                              {deptName}
                            </span>
                          </div>

                          {/* 🔐 3. شبكة بيانات الدخول (ألوان موحدة وخانات بيضاء نقية بخطوط سوداء فاحمة) */}
                          <div className="grid grid-cols-2 gap-1.5 print:gap-1 my-0.5"> {/* 🔲 شبكة بعمودين متوازيين للبيانات بتصميم متوحد ونظيف */}
                            {/* صندوق البريد الإلكتروني الأكاديمي بخانة بيضاء نقية مثل الرمز السري تماماً */}
                            <div className="bg-slate-50 border border-slate-300 rounded-md p-1.5 flex flex-col justify-center"> {/* ✉️ بوكس الإيميل الأكاديمي الموحد بحشوة متناسقة */}
                              <div className="flex items-center gap-1 text-[10px] print:text-[9.5px] font-black text-black mb-1"> {/* 🏷️ عنوان حقل الإيميل بخط أسود بارز */}
                                <Mail className="w-3 h-3 text-[#0F2942] shrink-0" /> {/* ✉️ أيقونة البريد بلون نيلي موحد */}
                                <span>البريد الأكاديمي</span>
                              </div>
                              <div className="font-mono text-[10.5px] print:text-[10px] font-black text-black truncate text-center select-all bg-white py-1 px-1.5 rounded border border-slate-300 shadow-2xs" dir="ltr"> {/* 🔤 خانة البريد بيضاء نقية ومحاطة بإطار أنيق مريح */}
                                {teacher.generated_email}
                              </div>
                            </div>

                            {/* صندوق الرمز السري المؤقت بتصميم موحد تماماً مع صندوق البريد بخط أسود */}
                            <div className="bg-slate-50 border border-slate-300 rounded-md p-1.5 flex flex-col justify-center"> {/* 🔑 بوكس كلمة المرور موحد بلون متناسق وبدون أخضر */}
                              <div className="flex items-center gap-1 text-[10px] print:text-[9.5px] font-black text-black mb-1"> {/* 🏷️ عنوان حقل كلمة السر بخط أسود بارز */}
                                <KeyRound className="w-3 h-3 text-[#0F2942] shrink-0" /> {/* 🔑 أيقونة المفتاح بلون نيلي موحد */}
                                <span>كلمة المرور المؤقتة</span>
                              </div>
                              <div className="font-mono text-[12px] print:text-[11px] font-black tracking-widest text-black truncate text-center select-all bg-white py-1 px-1.5 rounded border border-slate-300 shadow-2xs" dir="ltr"> {/* 🔢 خانة الباسورد بيضاء نقية بخط أسود عريض ومتباعد */}
                                {teacher.temp_password || '********'}
                              </div>
                            </div>
                          </div>

                          {/* 🌐 4. رابط المنصة المباشر بحجم خط مطابق لاسم الأستاذ بدون توقيع المستلم وبخط أسود فاحم */}
                          <div className="flex items-center justify-center border-t border-slate-300 pt-1.5 print:pt-1"> {/* 📄 شريط رابط البوابة في المنتصف ومضغوط المساحة */}
                            <div className="flex items-center gap-1.5 font-mono text-xs print:text-[11.5px] font-black text-black truncate select-all bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md" dir="ltr"> {/* 🔗 رابط الدخول بحجم مساوٍ لاسم الأستاذ مع إطار ناعم */}
                              <Globe className="w-3.5 h-3.5 text-[#0F2942] shrink-0" /> {/* 🌐 أيقونة الكرة الأرضية بلون نيلي */}
                              <span className="truncate">{loginPortalCleanUrl}</span> {/* 🌐 رابط البوابة النظيف والواضح */}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })(), document.body)}

      {/* 🖨️ 2. نافذة معاينة وطباعة بطاقات اعتماد الطلبة (10 بطاقات بالورقة الواحدة A4 بنظام الشبكة 2x5) */}
      {showStudentPrintModal && isMounted && typeof document !== 'undefined' && createPortal((() => {
        let printList = singleStudentPrintProfile
          ? [singleStudentPrintProfile]
          : (selectedStudentIds.length > 0
              ? deptStudents.filter((s) => selectedStudentIds.includes(s.id))
              : [...deptStudents]);

        if (!singleStudentPrintProfile) {
          if (studentPrintStageFilter !== 'all') {
            printList = printList.filter((s) => (s.stage_number || 1) === studentPrintStageFilter);
          }
          if (studentPrintStudyFilter !== 'all') {
            printList = printList.filter((s) => (s.study_type || 'morning') === studentPrintStudyFilter);
          }
        }

        printList.sort((a, b) => {
          const stageA = a.stage_number || 1;
          const stageB = b.stage_number || 1;
          if (stageA !== stageB) return stageA - stageB;
          return a.full_name.localeCompare(b.full_name, 'ar');
        });

        const baseStudents = selectedStudentIds.length > 0
          ? deptStudents.filter((s) => selectedStudentIds.includes(s.id))
          : deptStudents;

        // 📊 إحصائيات طلاب القسم المتاحة للطباعة (العدد الكلي وأعداد كل مرحلة وفترة)
        const totalCount = baseStudents.length;
        const stage1Count = baseStudents.filter((s) => (s.stage_number || 1) === 1).length;
        const stage2Count = baseStudents.filter((s) => (s.stage_number || 1) === 2).length;
        const stage3Count = baseStudents.filter((s) => (s.stage_number || 1) === 3).length;
        const stage4Count = baseStudents.filter((s) => (s.stage_number || 1) === 4).length;

        const morningCount = baseStudents.filter((s) => (s.study_type || 'morning') === 'morning').length;
        const eveningCount = baseStudents.filter((s) => (s.study_type || 'morning') === 'evening').length;

        // 🎓 خيارات تصفية المراحل الأكاديمية الاحترافية مع الأعداد الدقيقة
        const stageOptions: PrintFilterOption<number | 'all'>[] = [
          { id: 'all', label: 'كافة المراحل (العدد الكلي)', count: totalCount },
          { id: 1, label: 'المرحلة الأولى', count: stage1Count },
          { id: 2, label: 'المرحلة الثانية', count: stage2Count },
          { id: 3, label: 'المرحلة الثالثة', count: stage3Count },
          { id: 4, label: 'المرحلة الرابعة', count: stage4Count },
        ];

        // ☀️🌙 خيارات تصفية الفترات الدراسية الاحترافية مع الأعداد الدقيقة
        const studyOptions: PrintFilterOption<'all' | 'morning' | 'evening'>[] = [
          { id: 'all', label: 'كافة الفترات (العدد الكلي)', count: totalCount },
          { id: 'morning', label: 'الصباحي', count: morningCount },
          { id: 'evening', label: 'المسائي', count: eveningCount },
        ];

        return (
          <div 
            id="printable-modal-portal"
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:static print:bg-white print:backdrop-blur-none print:w-full print:h-auto print:min-h-0 print:overflow-visible print:block" 
            dir="rtl"
          >
            <div className="bg-white border-2 border-slate-400 rounded-3xl w-full max-w-5xl max-h-[94vh] shadow-2xl flex flex-col relative overflow-hidden text-right print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none print:overflow-visible print:static print:block print:h-auto">
              
              {/* شريط الأدوات العلوي */}
              <div className="p-4 sm:p-5 border-b-2 border-slate-300 bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 z-10 print:hidden no-print">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0F2942] text-cyan-300 rounded-2xl shadow-xs">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-black flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <span>معاينة وطباعة بطاقات اعتماد الطلبة — قسم {deptName}</span>
                      <span className="px-3 py-1 rounded-full bg-slate-200 text-black text-xs font-black border border-slate-300 whitespace-nowrap shrink-0 inline-block">
                        {printList.length} بطاقة (10 بطاقات بالصفحة PDF)
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm font-black text-slate-800">
                      شبكة ثنائية 2x5 فائقة الكفاءة ومضغوطة لتوفير استهلاك الأوراق
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5 shrink-0">
                  {/* فلاتر المرحلة والدراسة الاحترافية بتصميم حديث وأعداد دقيقة */}
                  {!singleStudentPrintProfile && (
                    <div className="flex items-center gap-2.5">
                      <PrintFilterDropdown<number | 'all'>
                        ariaLabel="تصفية طباعة الطلاب حسب المرحلة الأكاديمية"
                        icon={<GraduationCap className="w-4 h-4 text-[#0F2942]" />}
                        options={stageOptions}
                        selectedValue={studentPrintStageFilter}
                        onSelect={(val) => setStudentPrintStageFilter(val)}
                      />

                      <PrintFilterDropdown<'all' | 'morning' | 'evening'>
                        ariaLabel="تصفية طباعة الطلاب حسب الفترة الدراسية"
                        icon={<Clock className="w-4 h-4 text-[#0F2942]" />}
                        options={studyOptions}
                        selectedValue={studentPrintStudyFilter}
                        onSelect={(val) => setStudentPrintStudyFilter(val)}
                      />
                    </div>
                  )}

                  {singleStudentPrintProfile && (
                    <button
                      type="button"
                      onClick={() => setSingleStudentPrintProfile(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4 text-black" />
                      <span>عرض كافة الطلبة ({deptStudents.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => window.print()}
                    disabled={printList.length === 0}
                    className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] disabled:bg-slate-300 text-white rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#0F2942] active:scale-95"
                    title="طباعة وتصدير بطاقات الاعتماد بصيغة PDF (10 بطاقات بالصفحة)"
                  >
                    <Printer className="w-4 h-4 text-cyan-300" />
                    <span>طباعة وتصدير PDF الآن ({printList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowStudentPrintModal(false);
                      setSingleStudentPrintProfile(null);
                    }}
                    className="p-2.5 bg-slate-200 hover:bg-slate-300 text-black rounded-2xl transition cursor-pointer shrink-0"
                    title="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* منطقة الطباعة بنظام الشبكة 2 عمود × 5 صفوف */}
              <div className="p-3 sm:p-5 overflow-y-auto flex-1 overscroll-contain printable-batch-area bg-slate-100 print:bg-white print:p-0 print:overflow-visible print:static print:block print:h-auto">
                {printList.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border-2 border-slate-300 space-y-3 my-6">
                    <AlertCircle className="w-10 h-10 text-indigo-950 mx-auto" />
                    <p className="text-base font-black text-black">لا يوجد طلاب مطابقين للخيارات المحددة حالياً.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 print:grid-cols-2 print:gap-1 w-full cards-grid-8 max-w-5xl mx-auto">
                    {printList.map((student: UserProfile, index: number) => {
                      const curStage = student.stage_number || 1;
                      const stageName = getStageNameInArabic(curStage);
                      const studyName = student.study_type === 'evening' ? 'مسائي' : 'صباحي';
                      const currentOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://192.168.0.185:3000';
                      const loginPortalUrl = `${currentOrigin}/student`;
                      const loginPortalCleanUrl = loginPortalUrl.replace(/^https?:\/\//, '');

                      return (
                        <div
                          key={student.id || index} // 🔑 مفتاح فريد لكل كارد طالب بالرندر
                          className="bg-white border border-slate-400 rounded-xl p-2 print:p-1.5 shadow-xs break-inside-avoid print:break-inside-avoid print:border print:border-slate-500 print:rounded-lg print:shadow-none w-full flex flex-col justify-between card-item-8" // 🗂️ حاوية الكارد الأكاديمي بارتفاع 52 ملم تملأ الورقة بالكامل بدون فراغات زائدة
                        >
                          {/* 🏛️ 1. ترويسة الكارد الرسمية: الشعار وعنوان الجامعة وشارة الطالب بخطوط سوداء فاحمة وواضحة */}
                          <div className="flex items-center justify-between border-b border-slate-300 pb-1 print:pb-0.5"> {/* 📐 حاوية الترويسة مع خط فاصل داكن */}
                            <div className="flex items-center gap-1.5 overflow-hidden"> {/* 🏢 مجمع الشعار والعناوين الرسمية */}
                              {/* شعار الجامعة الرسمي بجودة واضحة وبحجم مدمج */}
                              <div className="relative w-8 h-8 print:w-7 print:h-7 flex-shrink-0"> {/* 🖼️ إطار أبعاد الشعار الرسمي */}
                                <Image // 🖼️ مكون صورة الشعار
                                  src="/logo.webp" // 📍 مسار الشعار المعتمد
                                  alt="شعار جامعة الصادق" // 🏷️ نص بديل لأغراض الوصولية
                                  width={32} // 📏 العرض بالبكسل
                                  height={32} // 📏 الارتفاع بالبكسل
                                  className="object-contain" // 🎨 احتواء الصورة بالكامل بدون تشويه
                                  priority // ⚡ تحميل سريع وفوري
                                  unoptimized // 🚀 بدون تحسين إضافي للملفات المحلية
                                />
                              </div>
                              {/* العناوين الرسمية لجامعة الإمام الصادق ومسار بولونيا بخط أسود بارز ومقروء */}
                              <div className="flex flex-col justify-center leading-none min-w-0"> {/* 📝 نصوص اسم الجامعة والوزارة */}
                                <h4 className="text-xs print:text-[11px] font-black text-black whitespace-nowrap leading-tight"> {/* 🏛️ اسم الجامعة وفرع ميسان بلون أسود عريض وواضح */}
                                  جامعة الإمام جعفر الصادق (ع) — فرع ميسان
                                </h4>
                                <p className="text-[10px] print:text-[9.5px] text-black font-extrabold whitespace-nowrap leading-tight mt-0.5"> {/* 📜 اسم الوزارة والمسار بخط أسود بارز */}
                                  وزارة التعليم العالي والبحث العلمي — مسار بولونيا
                                </p>
                              </div>
                            </div>
                            {/* شارة الهوية الرسمية للطالب الجامعي بخط أسود بارز ومحاط بإطار أنيق */}
                            <span className="px-2 py-0.5 rounded-md bg-white text-black text-[10px] print:text-[9.5px] font-black border border-slate-300 whitespace-nowrap shrink-0 shadow-2xs"> {/* 🏷️ باج هوية الطالب */}
                              بطاقة طالب
                            </span>
                          </div>

                          {/* 👤 2. شريط هوية الطالب وقسمه ومرحلته الدراسية بخطوط سوداء عريضة */}
                          <div className="flex items-center justify-between gap-2 py-0.5 px-0.5"> {/* 📌 حاوية اسم الطالب وبيانات المرحلة بتنسيق ممتلئ وأنيق */}
                            <div className="flex items-center gap-1.5 overflow-hidden"> {/* 🏷️ أيقونة واسم الطالب */}
                              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-300"> {/* ⭕ دائرة أيقونة المستخدم */}
                                <User className="w-3 h-3 text-[#0F2942]" /> {/* 👤 أيقونة الطالب باللون النيلي */}
                              </div>
                              <span className="text-sm print:text-[12px] font-black text-black truncate"> {/* ✍️ الاسم الكامل للطالب بخط أسود كبير وواضح */}
                                {student.full_name}
                              </span>
                            </div>
                            <span className="text-[10.5px] print:text-[10px] font-black text-black bg-white px-2 py-0.5 rounded-md border border-slate-300 whitespace-nowrap shrink-0 shadow-2xs"> {/* 🎓 المرحلة والدراسة واسم الكروب بخط أسود عريض وواضح بالطباعة */}
                              المرحلة {stageName} ({studyName}) — {student.student_group ? `كروب ${student.student_group}` : 'شعبة عامة'}
                            </span>
                          </div>

                          {/* 🔐 3. شبكة بيانات الدخول (ألوان موحدة وخانات بيضاء نقية بخطوط سوداء فاحمة) */}
                          <div className="grid grid-cols-2 gap-1.5 print:gap-1 my-0.5"> {/* 🔲 شبكة بعمودين متوازيين للبيانات بتصميم متوحد ونظيف */}
                            {/* صندوق البريد الإلكتروني الأكاديمي بخانة بيضاء نقية مثل الرمز السري تماماً */}
                            <div className="bg-slate-50 border border-slate-300 rounded-md p-1.5 flex flex-col justify-center"> {/* ✉️ بوكس الإيميل الأكاديمي الموحد بحشوة متناسقة */}
                              <div className="flex items-center gap-1 text-[10px] print:text-[9.5px] font-black text-black mb-1"> {/* 🏷️ عنوان حقل الإيميل بخط أسود بارز */}
                                <Mail className="w-3 h-3 text-[#0F2942] shrink-0" /> {/* ✉️ أيقونة البريد بلون نيلي موحد */}
                                <span>البريد الأكاديمي</span>
                              </div>
                              <div className="font-mono text-[10.5px] print:text-[10px] font-black text-black truncate text-center select-all bg-white py-1 px-1.5 rounded border border-slate-300 shadow-2xs" dir="ltr"> {/* 🔤 خانة البريد بيضاء نقية ومحاطة بإطار أنيق مريح */}
                                {student.generated_email}
                              </div>
                            </div>

                            {/* صندوق الرمز السري المؤقت بتصميم موحد تماماً مع صندوق البريد بخط أسود */}
                            <div className="bg-slate-50 border border-slate-300 rounded-md p-1.5 flex flex-col justify-center"> {/* 🔑 بوكس كلمة المرور موحد بلون متناسق وبدون أخضر */}
                              <div className="flex items-center gap-1 text-[10px] print:text-[9.5px] font-black text-black mb-1"> {/* 🏷️ عنوان حقل كلمة السر بخط أسود بارز */}
                                <KeyRound className="w-3 h-3 text-[#0F2942] shrink-0" /> {/* 🔑 أيقونة المفتاح بلون نيلي موحد */}
                                <span>كلمة المرور المؤقتة</span>
                              </div>
                              <div className="font-mono text-[12px] print:text-[11px] font-black tracking-widest text-black truncate text-center select-all bg-white py-1 px-1.5 rounded border border-slate-300 shadow-2xs" dir="ltr"> {/* 🔢 خانة الباسورد بيضاء نقية بخط أسود عريض ومتباعد */}
                                {student.temp_password || '********'}
                              </div>
                            </div>
                          </div>

                          {/* 🌐 4. رابط المنصة المباشر بحجم خط مطابق لاسم الطالب بدون توقيع المستلم وبخط أسود فاحم */}
                          <div className="flex items-center justify-center border-t border-slate-300 pt-1.5 print:pt-1"> {/* 📄 شريط رابط البوابة في المنتصف ومضغوط المساحة */}
                            <div className="flex items-center gap-1.5 font-mono text-xs print:text-[11.5px] font-black text-black truncate select-all bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md" dir="ltr"> {/* 🔗 رابط الدخول بحجم مساوٍ لاسم الطالب مع إطار ناعم */}
                              <Globe className="w-3.5 h-3.5 text-[#0F2942] shrink-0" /> {/* 🌐 أيقونة الكرة الأرضية بلون نيلي */}
                              <span className="truncate">{loginPortalCleanUrl}</span> {/* 🌐 رابط البوابة النظيف والواضح */}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })(), document.body)}

      {/* ========================================================================= */}
      {/* 🖨️ نافذة معاينة وطباعة جدول تكليفات الكادر التدريسي الرسمية A4 معتمدة */}
      {/* ========================================================================= */}
      {showAssignmentsPrintModal && isMounted && typeof document !== 'undefined' && createPortal((() => {
        // 📋 قائمة التكليفات للطباعة بناءً على النطاق المحدد (المفلترة أو كافة تكليفات القسم)
        const printList = assignmentsPrintScope === 'filtered' 
          ? [...filteredTeacherCourses] 
          : [...deptTeacherCourses];

        // 🔤 فرز التكليفات: حسب اسم الأستاذ ثم اسم المقرر لضمان الترتيب الأكاديمي
        printList.sort((a, b) => (a.teacher_name || '').localeCompare(b.teacher_name || '', 'ar'));

        const totalCoursesCount = printList.length; // 🔢 إجمالي المقررات المكلف بها
        const uniqueTeachersCount = new Set(printList.map((tc) => tc.teacher_id)).size; // 👨‍🏫 إجمالي عدد الأساتذة الفريدين

        return (
          <div 
            id="printable-modal-portal"
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:static print:bg-white print:backdrop-blur-none print:w-full print:h-auto print:min-h-0 print:overflow-visible print:block" 
            dir="rtl"
          >
            <div className="bg-white border-2 border-slate-400 rounded-3xl w-full max-w-5xl max-h-[94vh] shadow-2xl flex flex-col relative overflow-hidden text-right print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none print:overflow-visible print:static print:block print:h-auto">
              
              {/* 🎛️ شريط الأدوات والتحكم العلوي (مخفي أثناء أمر الطباعة no-print) */}
              <div className="p-4 sm:p-5 border-b-2 border-slate-300 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 z-10 print:hidden no-print">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0F2942] text-cyan-300 rounded-2xl shadow-xs">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-black flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <span>معاينة وطباعة جدول تكليفات الكادر التدريسي — قسم {deptName}</span>
                      <span className="px-3 py-1 rounded-full bg-slate-200 text-black text-xs font-black border border-slate-300 whitespace-nowrap shrink-0 inline-block">
                        {totalCoursesCount} تكليف معتمد ({uniqueTeachersCount} أستاذ)
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm font-black text-slate-800">
                      وثيقة أمر إداري رسمية معتمدة وفق متطلبات مسار بولونيا والتعليم العالي
                    </p>
                  </div>
                </div>

                {/* أزرار التحكم والتبديل والطباعة */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 shrink-0">
                  {/* زر التبديل بين طباعة المفلتر أو طباعة الكل */}
                  <div className="flex items-center bg-slate-200 p-1 rounded-xl border border-slate-300 text-xs font-black">
                    <button
                      type="button"
                      onClick={() => setAssignmentsPrintScope('filtered')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        assignmentsPrintScope === 'filtered'
                          ? 'bg-[#0F2942] text-white shadow-xs'
                          : 'text-slate-800 hover:bg-white'
                      }`}
                    >
                      المفلترة حالياً ({filteredTeacherCourses.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignmentsPrintScope('all')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        assignmentsPrintScope === 'all'
                          ? 'bg-[#0F2942] text-white shadow-xs'
                          : 'text-slate-800 hover:bg-white'
                      }`}
                    >
                      كافة التكليفات ({deptTeacherCourses.length})
                    </button>
                  </div>

                  {/* زر أمر الطباعة الفعلي */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    disabled={printList.length === 0}
                    className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] disabled:bg-slate-300 text-white rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#0F2942] active:scale-95"
                    title="طباعة مباشرة أو حفظ بتنسيق PDF رسمي"
                  >
                    <Printer className="w-4 h-4 text-cyan-300" />
                    <span>طباعة وتصدير PDF الآن</span>
                  </button>

                  {/* زر إغلاق نافذة المعاينة */}
                  <button
                    type="button"
                    onClick={() => setShowAssignmentsPrintModal(false)}
                    className="p-2.5 bg-slate-200 hover:bg-slate-300 text-black rounded-2xl transition cursor-pointer"
                    title="إغلاق المعاينة"
                  >
                    <X className="w-5 h-5 text-black" />
                  </button>
                </div>
              </div>

              {/* 📄 جسم الوثيقة الرسمية المعدة للطباعة بحجم A4 */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white print:p-0 print:overflow-visible text-black">
                <div className="max-w-4xl mx-auto border-2 border-black p-6 sm:p-8 rounded-2xl print:border-none print:p-0 print:max-w-none">
                  
                  {/* 🏛️ 1. الترويسة الحكومية والأكاديمية الرسمية */}
                  <div className="flex items-start justify-between border-b-2 border-black pb-4 text-xs sm:text-sm font-black text-black">
                    {/* الجانب الأيمن: الدولة والوزارة والجامعة والكلية */}
                    <div className="space-y-0.5 text-right">
                      <p className="text-sm sm:text-base font-black">جمهورية العراق</p>
                      <p>وزارة التعليم العالي والبحث العلمي</p>
                      <p>جامعة الإمام جعفر الصادق (ع) — فرع ميسان</p>
                      <p>كلية تكنولوجيا المعلومات</p>
                      <p className="font-bold">قسم {deptName}</p>
                    </div>

                    {/* الوسط: شعار الجامعة الرسمي */}
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-1">
                        <Image
                          src="/logo.webp"
                          alt="شعار جامعة الصادق"
                          width={80}
                          height={80}
                          className="object-contain"
                          priority
                          unoptimized
                        />
                      </div>
                      <span className="text-[11px] font-black border border-black px-2 py-0.5 rounded">
                        مسار بولونيا الأكاديمي
                      </span>
                    </div>

                    {/* الجانب الأيسر: التاريخ والعام الدراسي بنصوص سوداء واضحة ومسح رقم الصادر */}
                    <div className="space-y-1 text-left font-mono" dir="ltr">
                      <p className="text-right font-sans font-black text-xs sm:text-sm text-black" dir="rtl">
                        التاريخ: {new Date().toLocaleDateString('ar-IQ-u-nu-latn')} م
                      </p>
                      <p className="text-right font-sans font-black text-xs sm:text-sm text-black" dir="rtl">
                        العام الدراسي: 2026 - 2027
                      </p>
                    </div>
                  </div>

                  {/* 📢 2. عنوان الأمر الإداري والتكليف الأكاديمي بنصوص سوداء فاحمة */}
                  <div className="my-5 text-center border-y border-black py-2.5 bg-slate-50 print:bg-transparent">
                    <h2 className="text-lg sm:text-xl font-black text-black">
                      أمر إداري — جدول توزيع المقررات الدراسية وتكليفات الكادر التدريسي
                    </h2>
                    <p className="text-xs sm:text-sm font-black text-black mt-1">
                      استناداً للصلاحيات الممنوحة لرئاسة القسم، يُكلف السادة التدريسيون المدرجة أسماؤهم أدناه بتدريس المقررات المحددة
                    </p>
                  </div>

                  {/* 📊 3. ملخص إحصائي موجز للوثيقة بنصوص سوداء بالكامل */}
                  <div className="flex items-center justify-between text-xs font-black text-black mb-3 px-1">
                    <span>القسم العلمي: <strong className="text-black">{deptName}</strong></span>
                    <span>عدد الأساتذة المكلفين: <strong className="text-black">{uniqueTeachersCount}</strong></span>
                    <span>إجمالي المقررات الموزعة: <strong className="text-black">{totalCoursesCount}</strong></span>
                    <span>تاريخ الإصدار: <strong className="text-black">{new Date().toLocaleDateString('ar-IQ-u-nu-latn')}</strong></span>
                  </div>

                  {/* 📋 4. جدول التكليفات الأكاديمية عالي الدقة */}
                  {printList.length === 0 ? (
                    <div className="text-center py-10 border border-black rounded-xl my-4 text-black font-black">
                      <p className="font-black text-sm text-black">لا توجد تكليفات لعرضها في نطاق الطباعة المحدد.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="w-full text-right border-collapse border-2 border-black text-xs sm:text-sm font-black text-black">
                        <thead>
                          <tr className="bg-slate-200 border-b-2 border-black text-black">
                            <th className="border border-black p-2 text-center w-10 text-black">ت</th>
                            <th className="border border-black p-2 text-black">اسم التدريسي المكلف</th>
                            <th className="border border-black p-2 text-black">المقرر الدراسي (المادة)</th>
                            {/* 🏷️ عمود طبيعة التكليف الأكاديمي في وثيقة الطباعة الرسمية */}
                            <th className="border border-black p-2 text-center text-black">طبيعة التكليف</th>
                            <th className="border border-black p-2 text-center text-black">رمز المقرر</th>
                            <th className="border border-black p-2 text-center text-black">المرحلة</th>
                            <th className="border border-black p-2 text-center text-black">الكورس</th>
                            <th className="border border-black p-2 text-center text-black">الوحدات (ECTS)</th>
                            <th className="border border-black p-2 text-center text-black">تاريخ التكليف</th>
                            <th className="border border-black p-2 text-center w-28 text-black">توقيع التدريسي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black">
                          {printList.map((tc, idx) => {
                            const courseInfo = courses.find((c) => c.id === tc.course_id);
                            const stageArabic = courseInfo ? `المرحلة ${getStageNameInArabic(courseInfo.stage_number || 1)}` : '—';
                            const semArabic = tc.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول';
                            const ects = courseInfo?.credit_hours || 3;
                            const courseCode = courseInfo?.code || '—';
                            const roleText = tc.role_in_course === 'practical' ? 'مكلف عملي فقط' : tc.role_in_course === 'both' ? 'مكلف نظري وعملي' : 'مكلف نظري فقط';

                            return (
                              <tr key={tc.id} className="border-b border-black text-black">
                                <td className="border border-black p-2 text-center font-mono text-black">{idx + 1}</td>
                                <td className="border border-black p-2 font-black text-black">{tc.teacher_name}</td>
                                <td className="border border-black p-2 font-black text-black">{tc.course_name}</td>
                                <td className="border border-black p-2 text-center font-black text-black">{roleText}</td>
                                <td className="border border-black p-2 text-center font-mono font-bold text-black" dir="ltr">{courseCode}</td>
                                <td className="border border-black p-2 text-center text-black">{stageArabic}</td>
                                <td className="border border-black p-2 text-center text-black">{semArabic}</td>
                                <td className="border border-black p-2 text-center font-mono text-black">{ects} ECTS</td>
                                <td className="border border-black p-2 text-center font-mono text-black">
                                  {new Date(tc.created_at || Date.now()).toLocaleDateString('ar-IQ-u-nu-latn')}
                                </td>
                                <td className="border border-black p-2 text-center">
                                  <div className="h-6 border-b border-dotted border-black"></div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ✍️ 5. قسم التوقيعات والمصادقات الإدارية الرسمية الثنائية المتطابقة 100% بنصوص سوداء فاحمة */}
                  <div className="grid grid-cols-2 gap-16 text-center mt-12 pt-6 border-t-2 border-black text-xs sm:text-sm font-black text-black break-inside-avoid print:break-inside-avoid">
                    {/* الطرف الأيمن: مقرر القسم العلمي */}
                    <div className="space-y-8 flex flex-col items-center justify-between text-black">
                      <div className="text-center">
                        <p className="text-sm sm:text-base font-black text-black">مقرر القسم العلمي</p>
                        <p className="text-xs sm:text-sm font-black mt-1 text-black">حسن عباس</p>
                      </div>
                      <div className="space-y-1.5 w-full text-center text-black font-black">
                        {/* ✍️ سطر التوقيع بالمنتصف هندسياً تماماً تحت اسم المقرر */}
                        <p className="font-black text-center text-black">التوقيع: .....................</p>
                        {/* 📅 سطر التاريخ بالمنتصف هندسياً تماماً تحت سطر التوقيع */}
                        <p className="font-black text-center text-xs text-black">التاريخ: &nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;/ 2026</p>
                      </div>
                    </div>

                    {/* الطرف الأيسر: رئيس القسم العلمي */}
                    <div className="space-y-8 flex flex-col items-center justify-between text-black">
                      <div className="text-center">
                        <p className="text-sm sm:text-base font-black text-black">رئيس القسم العلمي</p>
                        <p className="text-sm sm:text-base font-black mt-1 text-black">أ.م.د. عباس حسن</p>
                      </div>
                      <div className="space-y-1.5 w-full text-center text-black font-black">
                        {/* ✍️ حذفنا كلمة الختم والتوقيع صار بالمنتصف هندسياً مثل مقرر القسم 100% */}
                        <p className="font-black text-center text-black">التوقيع: .....................</p>
                        {/* 📅 سطر التاريخ بالمنتصف هندسياً تماماً تحت سطر التوقيع */}
                        <p className="font-black text-center text-xs text-black">التاريخ: &nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;/ 2026</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        );
      })(), document.body)}

    </>
  );
};

export default DepartmentPrintModals; // 🚀 تصدير المكون كافتراضي
