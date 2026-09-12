'use client'; // ⚡ ينفذ بجهة العميل في المتصفح

// 📊 تبويب رصد وتقييم الدرجات لمادة الأستاذ في مسار بولونيا
import React from 'react'; // 🔗 مكتبة رياكت
import { 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  RotateCcw, 
  Sun, 
  Moon, 
  History, 
  Save, 
  FileSpreadsheet, 
  FileText, 
  Sliders, 
  Download, 
  Upload, 
  Users, 
  Send, 
  Award, 
  Lock, 
  FlaskConical, 
  Info, 
  ListFilter, 
  CheckSquare, 
  Square 
} from 'lucide-react'; // 🎨 أيقونات التفاعل SVG
import { Course, Grade, UserProfile } from '@/types'; // 🔗 الأنواع الصارمة
import { 
  getCourseAssessmentScheme, 
  getCourseGradeLimits, 
  calculateCourseworkTotal, 
  calculateFinalTotal, 
  getLetterGrade, 
  isStudentPassedFirstRound, 
  isStudentEligibleForSupplementary,
  isAssessmentItemActive, 
} from '@/lib/grade-utils'; // 🧮 دوال حسابات الدرجات والمخطط
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧬 محرك استنتاج الجنس
import { AttendanceNoticeCategory } from '@/components/attendance/AttendanceNoticeModal'; // 📢 فئات التبليغات الذكية
import { PendingGradeDiff } from './CoursePendingDiffModal'; // ⚖️ واجهة الفروقات المعلقة

// 📋 واجهة خصائص تبويب الدرجات الصارمة
export interface CourseGradesTabProps {
  course: Course | null; // 📚 بيانات المادة الدراسية
  grades: Grade[]; // 📑 مصفوفة كافة درجات الطلاب
  filteredGrades: Grade[]; // 🔍 الدرجات المفلترة حسب الدراسة
  courseStudents: UserProfile[]; // 👥 ملفات الطلاب المسجلين
  assessmentScheme: ReturnType<typeof getCourseAssessmentScheme>; // 🎛️ مخطط التقييم للمادة
  gradeLimits: ReturnType<typeof getCourseGradeLimits>; // 📏 الحدود القصوى للدرجات
  filterStudyType: 'all' | 'morning' | 'evening'; // ☀️ نوع الفلترة للدراسة
  setFilterStudyType: (type: 'all' | 'morning' | 'evening') => void; // 🔄 تغيير الفلترة
  courseMorning: number; // ☀️ عدد طلاب الصباحي
  courseEvening: number; // 🌙 عدد طلاب المسائي
  pendingDiffs: Record<string, PendingGradeDiff>; // ⚖️ الفروقات المعلقة بالمسودة
  isSavingPendingGrades: boolean; // ⏳ حالة جاري حفظ المسودة
  isTheoryTeacher: boolean; // 👨‍🏫 هل هو أستاذ النظري
  isPracticalTeacher: boolean; // 🧪 هل هو أستاذ العملي
  isPracticalCourse: boolean; // 🔬 هل المادة تحتوي على عملي
  isFinalExamEnabled: boolean; // 📝 هل امتحان الفاينل مفعل
  isSupplementaryEnabled: boolean; // 🔄 هل امتحان الدور الثاني مفعل
  isExportingExcel: boolean; // 📊 حالة جاري تصدير الإكسل
  isExportingPDF: boolean; // 📄 حالة جاري تصدير الـ PDF
  isImportingExcel: boolean; // 📥 حالة جاري استيراد الإكسل
  selectedGradeStudentIds: string[]; // 🆔 معرفات الطلاب المحددين
  setSelectedGradeStudentIds: React.Dispatch<React.SetStateAction<string[]>>; // 🔄 دالة تحديد الطلاب
  toggleSelectAllGrades: (list: Grade[]) => void; // ✅ تحديد / إلغاء تحديد الكل
  toggleSelectGradeStudent: (studentId: string) => void; // 🔘 تحديد طالب مفرد
  handleCellChange: (gradeId: string, fieldName: keyof Grade, rawValue: string) => void; // ✏️ تعديل درجة حقل
  handleSaveAllPendingGrades: () => void; // 💾 حفظ كافة تعديلات المسودة
  handleCancelAllPendingGrades: () => void; // ❌ إلغاء كافة تعديلات المسودة
  handleDownloadTemplate: () => void; // 📥 تنزيل نموذج درجات إكسل
  handleExcelUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; // 📤 رفع واستيراد ملف الإكسل
  handleExportCourseExcel: () => void; // 📊 تصدير الدرجات كإكسل
  handleExportCoursePDF: () => void; // 📄 تصدير سجل الدرجات كـ PDF
  setIsPendingDiffModalOpen: (open: boolean) => void; // ⚖️ فتح نافذة الفروقات
  setIsBulkGradeModalOpen: (open: boolean) => void; // 🎯 فتح نافذة الرصد الموحد
  setBulkGradeValue: (val: string) => void; // 🔢 تعيين قيمة الدرجة الموحدة
  setIsGradeNoticeModalOpen: (open: boolean) => void; // 📢 فتح نافذة التنبيه
  setGradeNoticeTargetStudent: (student: UserProfile | null) => void; // 👤 تعيين الطالب المستهدف بالتنبيه
  setGradeNoticeDefaultCategory: (category: AttendanceNoticeCategory) => void; // 🏷️ تعيين تصنيف التنبيه
  setShowExcelInstructions: (show: boolean) => void; // ℹ️ فتح تعليمات الإكسل
}

// 📦 المكون المستقل لتبويب رصد وتقييم درجات المادة
export default function CourseGradesTab({
  course, // 📚 المادة
  grades, // 📑 الدرجات
  filteredGrades, // 🔍 المفلترة
  courseStudents, // 👥 الطلاب
  assessmentScheme, // 🎛️ المخطط
  gradeLimits, // 📏 الحدود
  filterStudyType, // ☀️ نوع الدراسة
  setFilterStudyType, // 🔄 تغيير الفلتر
  courseMorning, // ☀️ صباحي
  courseEvening, // 🌙 مسائي
  pendingDiffs, // ⚖️ الفروقات
  isSavingPendingGrades, // ⏳ حالة الحفظ
  isTheoryTeacher, // 👨‍🏫 أستاذ النظري
  isPracticalTeacher, // 🧪 أستاذ العملي
  isPracticalCourse, // 🔬 عملي
  isFinalExamEnabled, // 📝 فاينل مفعل
  isSupplementaryEnabled, // 🔄 دور ثاني مفعل
  isExportingExcel, // 📊 تصدير إكسل
  isExportingPDF, // 📄 تصدير PDF
  isImportingExcel, // 📥 استيراد إكسل
  selectedGradeStudentIds, // 🆔 الطلاب المحددين
  setSelectedGradeStudentIds, // 🔄 تحديث التحديد
  toggleSelectAllGrades, // ✅ تحديد الكل
  toggleSelectGradeStudent, // 🔘 تحديد مفرد
  handleCellChange, // ✏️ تعديل درجة
  handleSaveAllPendingGrades, // 💾 حفظ الكل
  handleCancelAllPendingGrades, // ❌ إلغاء الكل
  handleDownloadTemplate, // 📥 تنزيل النموذج
  handleExcelUpload, // 📤 رفع الإكسل
  handleExportCourseExcel, // 📊 تصدير الإكسل
  handleExportCoursePDF, // 📄 تصدير PDF
  setIsPendingDiffModalOpen, // ⚖️ نافذة الفروقات
  setIsBulkGradeModalOpen, // 🎯 نافذة الرصد الموحد
  setBulkGradeValue, // 🔢 قيمة الرصد
  setIsGradeNoticeModalOpen, // 📢 نافذة التنبيه
  setGradeNoticeTargetStudent, // 👤 الطالب المستهدف
  setGradeNoticeDefaultCategory, // 🏷️ تصنيف التنبيه
  setShowExcelInstructions, // ℹ️ تعليمات الإكسل
}: CourseGradesTabProps) {
  return (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b-2 border-slate-100 pb-5">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex flex-wrap items-center gap-2.5">
                <span className="p-2 bg-blue-50 text-blue-900 border border-blue-200 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs">
                  <BookOpen className="w-6 h-6 text-blue-900" />
                </span>
                <span>سجل رصد وتقييم درجات مسار بولونيا</span>
                <span className="px-3.5 py-1 bg-slate-900 text-white rounded-xl text-base font-black font-mono shadow-2xs">
                  {filteredGrades.length} طالب
                </span>
              </h2>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <p className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-1.5">
                  <span>الأوزان والعناوين المعتمدة تتبع المخطط الأكاديمي المخصص لمادة</span>
                  <strong className="text-blue-950 font-black">({course?.name})</strong>
                </p>

                {/* 🏷️ شارة الكورس الدراسي الحالي */}
                <span className="px-3.5 py-1 rounded-xl text-xs sm:text-sm font-black bg-[#0F2942] text-white shadow-2xs flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-300 shrink-0" />
                  <span>{course?.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول'}</span>
                </span>

                {/* 🎯 شارة حالة فترة الامتحان النهائي الدور الأول تظهر حصراً إذا كانت مفعلة */}
                {isFinalExamEnabled && (
                  <span className="px-3.5 py-1 rounded-xl text-xs sm:text-sm font-black bg-slate-100 text-slate-900 border border-slate-300 shadow-2xs flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>فترة الامتحان النهائي (الدور الأول) مفعلة ومعتمدة</span>
                  </span>
                )}

                {/* 🔄 شارة حالة فترة الامتحان المعتمدة من رئاسة القسم - تظهر حصراً عند تفعيل الدور الثاني */}
                {isSupplementaryEnabled && (
                  <span className="px-3.5 py-1 rounded-xl text-xs sm:text-sm font-black bg-slate-100 text-slate-900 border border-slate-300 shadow-2xs flex items-center gap-1.5 animate-in fade-in">
                    <RotateCcw className="w-4 h-4 text-[#0F2942] shrink-0" />
                    <span>فترة رصد الدور الثاني (الإكمال) مفعلة من رئاسة القسم</span>
                  </span>
                )}
              </div>
            </div>

            {/* ☀️ / 🌙 أزرار تصفية درجات الطلاب حسب الفترة الدراسية بتصميم بارز واحترافي */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border-2 border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setFilterStudyType('all')}
                className={`px-5 py-2.5 rounded-xl text-base sm:text-lg font-black transition-all cursor-pointer select-none active:scale-95 flex items-center gap-2 ${
                  filterStudyType === 'all'
                    ? 'bg-[#0F2942] text-white shadow-md ring-2 ring-blue-500/20'
                    : 'text-slate-800 hover:text-slate-950 hover:bg-slate-200/80'
                }`}
              >
                <span>الكل</span>
                <span className="font-mono font-black text-base opacity-90">({grades.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterStudyType('morning')}
                className={`px-5 py-2.5 rounded-xl text-base sm:text-lg font-black transition-all cursor-pointer select-none active:scale-95 flex items-center gap-2 ${
                  filterStudyType === 'morning'
                    ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-500/20'
                    : 'text-emerald-950 hover:bg-emerald-100/80'
                }`}
              >
                <Sun className={`w-5 h-5 shrink-0 transition-colors ${
                  filterStudyType === 'morning' ? 'text-white' : 'text-emerald-800'
                }`} />
                <span>الصباحي</span>
                <span className="font-mono font-black text-base opacity-90">({courseMorning})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterStudyType('evening')}
                className={`px-5 py-2.5 rounded-xl text-base sm:text-lg font-black transition-all cursor-pointer select-none active:scale-95 flex items-center gap-2 ${
                  filterStudyType === 'evening'
                    ? 'bg-indigo-700 text-white shadow-md ring-2 ring-indigo-500/20'
                    : 'text-indigo-950 hover:bg-indigo-100/80'
                }`}
              >
                <Moon className={`w-5 h-5 shrink-0 transition-colors ${
                  filterStudyType === 'evening' ? 'text-white' : 'text-indigo-800'
                }`} />
                <span>المسائي</span>
                <span className="font-mono font-black text-base opacity-90">({courseEvening})</span>
              </button>
            </div>
          </div>

          {/* 🎛️ شريط الإجراءات والمسودات وأدوات التصدير والاستيراد لدرجات المادة */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-blue-50/50 to-slate-50 border-2 border-slate-300 rounded-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* ⚖️ زر معاينة الفروقات */}
              {Object.keys(pendingDiffs).length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsPendingDiffModalOpen(true)}
                  className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white border-2 border-[#1e4570] rounded-xl font-black text-base transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 animate-in fade-in"
                  title="عرض كشف تفصيلي بمقارنة الدرجة القديمة قبل التعديل مقابل الحديثة بعد التعديل"
                >
                  <History className="w-5 h-5 text-cyan-300" />
                  <span>معاينة الفروقات ({Object.keys(pendingDiffs).length})</span>
                </button>
              )}

              {/* 💾 زر حفظ التعديلات */}
              {Object.keys(pendingDiffs).length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveAllPendingGrades}
                  disabled={isSavingPendingGrades}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-base transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 ring-2 ring-emerald-400"
                  title="حفظ كافة التعديلات المدخلة بالمسودة في قاعدة البيانات"
                >
                  {isSavingPendingGrades ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 text-emerald-200" />
                      <span>حفظ واعتماد التعديلات ({Object.keys(pendingDiffs).length})</span>
                    </>
                  )}
                </button>
              )}

              {/* 🔄 زر إلغاء التعديلات */}
              {Object.keys(pendingDiffs).length > 0 && (
                <button
                  type="button"
                  onClick={handleCancelAllPendingGrades}
                  disabled={isSavingPendingGrades}
                  className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-black text-base transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 animate-in fade-in"
                  title="إلغاء كافة التعديلات واستعادة الدرجات الأصلية"
                >
                  <RotateCcw className="w-5 h-5 text-rose-200" />
                  <span>إلغاء التعديلات</span>
                </button>
              )}

              {/* حالة المسودة والتوجيه الإرشادي */}
              <div className="flex items-center gap-2">
                {Object.keys(pendingDiffs).length > 0 ? (
                  <div className="flex items-center gap-2.5 text-black bg-blue-100 px-4 py-2 rounded-2xl border-2 border-blue-400 text-base font-black animate-in fade-in shadow-xs">
                    <Info className="w-5 h-5 text-blue-900 shrink-0" />
                    <span>يوجد <strong className="text-black font-black underline">({Object.keys(pendingDiffs).length})</strong> تعديلات في المسودة لم تُحفظ بعد.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-black bg-slate-100 px-4 py-2 rounded-2xl border-2 border-slate-300 text-base font-black shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-800 shrink-0" />
                    <span>عدّل أي درجة في الجدول أو حدد الطلاب لرصد درجة موحدة ومشاهدة المقارنة المباشرة.</span>
                  </div>
                )}
              </div>
            </div>

            {/* 🖨️📥 أزرار التصدير والاستيراد الرسمية لدرجات المادة */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportCoursePDF}
                disabled={isExportingPDF || grades.length === 0}
                className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 active:scale-95"
                title="تصدير كشف درجات وسعي المادة الرسمي A4"
              >
                {isExportingPDF ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>جاري التصدير...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 text-cyan-300" />
                    <span>تصدير كشف المادة (PDF)</span>
                  </>
                )}
              </button>

              {/* 📊 زر تصدير درجات وسعي بولونيا الفعلي Excel */}
              <button
                type="button"
                onClick={handleExportCourseExcel}
                disabled={isExportingExcel || grades.length === 0}
                className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-base font-black rounded-xl border border-[#1e4570] transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                title="تصدير كشف درجات وسعي المادة الفعلي إلى Excel الفاخر"
              >
                {isExportingExcel ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>جاري التوليد...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    <span>تصدير السعي (Excel)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-base font-black rounded-xl border-2 border-slate-300 transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                title="تنزيل نموذج Excel المعتمد لرصد درجات المادة وفق مسار بولونيا"
              >
                <Download className="w-5 h-5 text-emerald-800" />
                <span>نموذج Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExcelInstructions(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-base font-black rounded-xl border-2 border-slate-300 transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                title="تعليمات وضوابط رصد واستيراد درجات المادة"
              >
                <Info className="w-5 h-5 text-blue-800" />
                <span>التعليمات</span>
              </button>

              <label className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm border border-[#1e4570] active:scale-95">
                <Upload className="w-5 h-5 text-cyan-200" />
                <span>{isImportingExcel ? 'جاري التحليل...' : 'استيراد ملف Excel'}</span>
                <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} disabled={isImportingExcel} className="hidden" />
              </label>
            </div>
          </div>

        {/* 🎛️ شريط الإجراءات الجماعية لطلاب درجات السعي عند التحديد */}
        {(() => {
          const visibleSelectedCount = selectedGradeStudentIds.filter(id => filteredGrades.some(g => g.student_id === id)).length;
          if (visibleSelectedCount === 0 || filteredGrades.length === 0) return null;

          return (
            <div className="bg-[#0F2942] text-white p-4 sm:px-6 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-[#1e4570] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-cyan-300 rounded-xl border border-cyan-400/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-black text-base text-white">
                    تم تحديد <strong className="text-cyan-300 font-mono text-lg font-black">({visibleSelectedCount})</strong> من أصل <span className="font-mono text-slate-300">({filteredGrades.length})</span> طالب/ـة
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* 🎯 رصد درجة موحدة للطلاب المحددين */}
                <button
                  type="button"
                  onClick={() => {
                    setBulkGradeValue('');
                    setIsBulkGradeModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Sliders className="w-4 h-4 text-emerald-200" />
                  <span>رصد درجة موحدة للمحددين</span>
                </button>

                {/* 📢 إرسال تنبيه للمحددين */}
                <button
                  type="button"
                  onClick={() => {
                    setGradeNoticeTargetStudent(null);
                    setGradeNoticeDefaultCategory('general_announcement');
                    setIsGradeNoticeModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Send className="w-4 h-4 text-cyan-200" />
                  <span>إرسال تنبيه للمحددين</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGradeStudentIds([])}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-black text-sm transition cursor-pointer"
                >
                  إلغاء التحديد
                </button>
              </div>
            </div>
          );
        })()}

        {/* 🎯 تنبيه حالة الامتحان النهائي الدور الأول يظهر حصراً إذا كان مفعلاً من رئاسة القسم */}
        {isFinalExamEnabled && (
          <div className="p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-slate-900 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#0F2942] text-white rounded-xl shadow-xs shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-950 flex items-center gap-2">
                  <span>فترة رصد درجات الامتحان النهائي (الدور الأول) مفتوحة ومفعلة</span>
                  <span className="text-xs px-2.5 py-1 bg-slate-200 text-slate-900 rounded-lg font-mono flex items-center gap-1 border border-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                    <span>مفعلة</span>
                  </span>
                </h4>
                <p className="text-xs sm:text-sm font-bold text-slate-700">
                  تم فتح رصد درجات الفاينل برخصة من رئاسة القسم والمقرر. يمكنك إدخال وتعديل درجات النهائي (من 50) واحتساب النتيجة والمجموع الكلي من (100).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 shadow-2xs flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#0F2942]" />
                <span>الرصد النهائي نشط</span>
              </span>
            </div>
          </div>
        )}

        {/* 🔄 تنبيه فترة الدور الثاني والضوابط الأكاديمية */}
        {isSupplementaryEnabled && (
          <div className="p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-slate-900 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#0F2942] text-white rounded-xl shadow-xs shrink-0">
                <RotateCcw className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-950">فترة رصد درجات الدور الثاني (الإكمال) مفتوحة ومفعلة</h4>
                <p className="text-xs sm:text-sm font-bold text-slate-700">
                  وفق ضوابط مسار بولونيا، يُتاح الرصد حصراً للطلبة الراسبين/المكملين في الدور الأول (السعي + النهائي &lt; 50)، بينما يحتفظ الطلبة الناجحون بنتيجتهم الأصلية.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 shadow-2xs flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5 text-[#0F2942]" />
                <span>المؤهلون لدور 2: {grades.filter((g) => isStudentEligibleForSupplementary(g, assessmentScheme)).length} طالب</span>
              </span>
              <span className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-black text-slate-900 shadow-2xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>الناجحون دور أول: {grades.filter((g) => isStudentPassedFirstRound(g, assessmentScheme)).length} طالب</span>
              </span>
            </div>
          </div>
        )}

        {/* 📱 حاوية السحب الأفقي للجداول الاستجابية للموبايل والتابلت */}
        <div className="overflow-x-auto w-full rounded-2xl border-2 border-slate-300 shadow-2xs">
          <table className="w-full text-center text-base font-black border-collapse min-w-[1150px]">
            <thead className="bg-slate-100 text-black font-black border-b-2 border-slate-300">
              <tr>
                <th className="p-4 text-center w-20 text-base border-x border-slate-300">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleSelectAllGrades(filteredGrades)}
                      className="p-1 text-[#0F2942] hover:scale-110 transition cursor-pointer"
                      title="تحديد كافة الطلاب"
                    >
                      {selectedGradeStudentIds.length === filteredGrades.length && filteredGrades.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                    <span>ت</span>
                  </div>
                </th>
                {/* 👤 اسم الطالب الثلاثي */}
                <th className="p-4 text-right min-w-[240px] text-base text-black font-black border-x border-slate-300">اسم الطالب</th>
                
                {/* 1. البند الأول - كويز 1 (يظهر فقط إذا كان مفتوحاً) */}
                {isAssessmentItemActive(assessmentScheme.quiz1) && (
                  <th className="p-3 bg-slate-50 border-x border-slate-300">
                    <div className="font-black text-black text-base">{assessmentScheme.quiz1.title_ar}</div>
                    <span className="text-sm font-black text-blue-900">({assessmentScheme.quiz1.max_score})</span>
                  </th>
                )}

                {/* 2. البند الثاني - كويز 2 (يظهر فقط إذا كان مفتوحاً) */}
                {isAssessmentItemActive(assessmentScheme.quiz2) && (
                  <th className="p-3 bg-slate-50 border-x border-slate-300">
                    <div className="font-black text-black text-base">{assessmentScheme.quiz2.title_ar}</div>
                    <span className="text-sm font-black text-blue-900">({assessmentScheme.quiz2.max_score})</span>
                  </th>
                )}

                {/* 3. البند الثالث - واجب 1 (يظهر فقط إذا كان مفتوحاً) */}
                {isAssessmentItemActive(assessmentScheme.assignment1) && (
                  <th className="p-3 bg-slate-50 border-x border-slate-300">
                    <div className="font-black text-black text-base">{assessmentScheme.assignment1.title_ar}</div>
                    <span className="text-sm font-black text-blue-900">({assessmentScheme.assignment1.max_score})</span>
                  </th>
                )}

                {/* 4. البند الرابع - واجب 2 (يظهر فقط إذا كان مفتوحاً) */}
                {isAssessmentItemActive(assessmentScheme.assignment2) && (
                  <th className="p-3 bg-slate-50 border-x border-slate-300">
                    <div className="font-black text-black text-base">{assessmentScheme.assignment2.title_ar}</div>
                    <span className="text-sm font-black text-blue-900">({assessmentScheme.assignment2.max_score})</span>
                  </th>
                )}

                {/* 5. البند الخامس - تقرير وبحث (يظهر فقط إذا كان مفتوحاً) */}
                {isAssessmentItemActive(assessmentScheme.report) && (
                  <th className="p-3 bg-slate-50 border-x border-slate-300">
                    <div className="font-black text-black text-base">{assessmentScheme.report.title_ar}</div>
                    <span className="text-sm font-black text-blue-900">({assessmentScheme.report.max_score})</span>
                  </th>
                )}

                {/* 6. البند السادس - امتحان نصفي (يظهر فقط إذا كان مفتوحاً) */}
                {isAssessmentItemActive(assessmentScheme.midterm) && (
                  <th className="p-3 bg-slate-50 border-x border-slate-300">
                    <div className="font-black text-black text-base">{assessmentScheme.midterm.title_ar}</div>
                    <span className="text-sm font-black text-blue-900">({assessmentScheme.midterm.max_score})</span>
                  </th>
                )}

                {/* 7. البند السابع - الامتحان العملي / المختبري (يظهر فقط إذا كان مفتوحاً) */}
                {isPracticalCourse && isAssessmentItemActive(assessmentScheme.practical) && (
                  <th className="p-3 bg-emerald-50 text-emerald-950 border-x-2 border-emerald-300">
                    <div className="font-black flex items-center justify-center gap-1 text-base text-black">
                      <FlaskConical className="w-4 h-4 text-emerald-800" />
                      <span>{assessmentScheme.practical.title_ar}</span>
                    </div>
                    <span className="text-sm font-black text-emerald-900">({assessmentScheme.practical.max_score})</span>
                  </th>
                )}

                {/* مجموع السعي التكويني */}
                <th className="p-4 bg-slate-200 text-black font-black min-w-[100px] border-x-2 border-slate-400 text-base">
                  <div>مجموع السعي</div>
                  <span className="text-sm font-black text-black">(50)</span>
                </th>

                {/* 🎯 الامتحان النهائي (الدور الأول) - يظهر حصراً إذا كان مفعلاً من رئاسة القسم والمقرر */}
                {isFinalExamEnabled && (
                  <th className="p-3 bg-slate-200/90 text-slate-950 border-x-2 border-slate-300 text-base animate-in fade-in">
                    <div className="font-black text-slate-950">{assessmentScheme.final_exam.title_ar}</div>
                    <span className="text-sm font-black text-slate-700">({assessmentScheme.final_exam.max_score})</span>
                  </th>
                )}

                {/* 🔄 دور ثاني - يظهر حصراً إذا كان مفعلاً من رئاسة القسم */}
                {isSupplementaryEnabled && (
                  <th className="p-3 bg-slate-200/90 text-slate-950 border-x-2 border-slate-300 text-base animate-in fade-in">
                    <div className="font-black text-slate-950 flex items-center justify-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5 text-[#0F2942]" />
                      <span>دور ثاني</span>
                    </div>
                    <span className="text-sm font-black text-slate-700">({assessmentScheme.final_exam.max_score})</span>
                  </th>
                )}

                {/* المجموع الكلي */}
                <th className="p-4 bg-slate-200 text-slate-950 min-w-[100px] border-x-2 border-slate-300 text-base">
                  <div className="font-black text-slate-950">{isFinalExamEnabled ? 'المجموع الكلي' : 'السعي المعتمد'}</div>
                  <span className="text-sm font-black text-slate-900">({isFinalExamEnabled ? '100' : '50'})</span>
                </th>

                {/* 🅰️ عمود التقدير الحرفي أو حالة النتيجة */}
                <th className="p-4 border-x border-slate-300 min-w-[120px] text-base text-black font-black">
                  {isFinalExamEnabled ? 'التقدير' : 'حالة النتيجة'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={15} className="p-8 text-center text-slate-500 font-black">
                    لا توجد سجلات درجات مطابقة للبحث أو الفلتر المختار
                  </td>
                </tr>
              ) : (
                filteredGrades.map((g, index) => {
                  const isPassedFirstRound = isStudentPassedFirstRound(g, assessmentScheme); // 🛡️ فحص النجاح بالدور الأول للمخطط
                  const courseworkTotal = calculateCourseworkTotal(g, assessmentScheme); // 📝 السعي التكويني من 50 للبند المفتوح فقط
                  const finalTot = isFinalExamEnabled ? calculateFinalTotal(g, isSupplementaryEnabled, assessmentScheme) : courseworkTotal; // 💯 احتساب المجموع للبند المفتوح
                  const letterGrad = isFinalExamEnabled ? getLetterGrade(finalTot) : 'بانتظار الفاينل'; // 🅰️ التقدير الأكاديمي
                  const stdObj = courseStudents.find((s) => s.id === g.student_id || s.university_number === g.university_number);
                  const stdGender = stdObj?.gender || detectArabicGender(g.student_name);
                  const stdStudyType = stdObj?.study_type || 'morning';

                  const isSelected = selectedGradeStudentIds.includes(g.student_id);

                  return (
                    <tr key={g.id} className={`hover:bg-slate-50 transition ${isSelected ? 'bg-blue-50/80 ring-1 ring-blue-300' : ''}`}>
                      <td className="p-4 text-center font-black text-black whitespace-nowrap border-x border-slate-300">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleSelectGradeStudent(g.student_id)}
                          className="p-1 text-[#0F2942] hover:scale-110 transition cursor-pointer"
                          title={`تحديد ${g.student_name}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-500" />
                          )}
                        </button>
                        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-xl bg-slate-100 border border-slate-300 text-black font-black text-xs shadow-2xs">
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    
                    {/* 👤 اسم الطالب في السطر الأول وتحته شارات الجنس والفترة الدراسية بأناقة وتصميم فاخر */}
                    <td className="p-3.5 text-right min-w-[200px] border-x border-slate-300">
                      <div className="flex flex-col items-start gap-1">
                        {/* السطر الأول: اسم الطالب الرباعي بخط عريض وواضح */}
                        <div className="font-black text-slate-950 text-base sm:text-lg tracking-tight">
                          {g.student_name}
                        </div>
                        {/* السطر الثاني: وسوم واضحة ومقروءة للفترة والجنس */}
                        <div className="flex items-center gap-2 pt-1">
                          {/* ☀️ / 🌙 شارة الصباحي والمسائي */}
                          <span className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-black border-2 flex items-center gap-1.5 shadow-2xs ${
                            stdStudyType === 'evening'
                              ? 'bg-indigo-50 text-indigo-950 border-indigo-300'
                              : 'bg-emerald-50 text-emerald-950 border-emerald-300'
                          }`}>
                            {stdStudyType === 'evening' ? (
                              <Moon className="w-3.5 h-3.5 text-indigo-800 shrink-0" />
                            ) : (
                              <Sun className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                            )}
                            <span>{stdStudyType === 'evening' ? 'مسائي' : 'صباحي'}</span>
                          </span>

                          {/* 👨 / 👩 شارة الجنس */}
                          <span className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-black border-2 shadow-2xs ${
                            stdGender === 'female'
                              ? 'bg-rose-50 text-rose-950 border-rose-300'
                              : 'bg-blue-50 text-blue-950 border-blue-300'
                          }`}>
                            {stdGender === 'female' ? 'أنثى' : 'ذكر'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 1. كويز 1 - يظهر فقط إذا كان البند مفتوحاً */}
                    {isAssessmentItemActive(assessmentScheme.quiz1) && (
                      <td className="p-2 border-x border-slate-300">
                        <div className="flex flex-col items-center justify-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={gradeLimits.quiz1 || 5}
                            disabled={!isTheoryTeacher}
                            value={g.quiz1}
                            onChange={(e) => handleCellChange(g.id, 'quiz1', e.target.value)}
                            title={!isTheoryTeacher ? '🔒 مخصص لأستاذ النظري فقط' : `الحد الأقصى: ${gradeLimits.quiz1 || 5}`}
                            className={`w-18 p-2.5 rounded-xl text-center font-black text-base focus:outline-none transition ${
                              !isTheoryTeacher
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : pendingDiffs[`${g.id}-quiz1`]
                                ? 'bg-blue-50/80 border-2 border-blue-600 text-blue-950 ring-2 ring-blue-200'
                                : 'bg-slate-50 border-2 border-slate-300 text-black focus:border-[#0F2942]'
                            }`}
                          />
                          {pendingDiffs[`${g.id}-quiz1`] && (
                            <div 
                              className="text-[11px] font-black flex items-center justify-center gap-1 bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded-md border border-blue-300 mt-1 shadow-2xs animate-in fade-in"
                              title={`الدرجة السابقة: ${pendingDiffs[`${g.id}-quiz1`].oldValue} ➔ المقترحة: ${pendingDiffs[`${g.id}-quiz1`].newValue}`}
                            >
                              <span className="line-through text-slate-500">{pendingDiffs[`${g.id}-quiz1`].oldValue}</span>
                              <span className="text-blue-900 font-bold">➔</span>
                              <span className="text-emerald-800 font-bold">{pendingDiffs[`${g.id}-quiz1`].newValue}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 2. كويز 2 - يظهر فقط إذا كان البند مفتوحاً */}
                    {isAssessmentItemActive(assessmentScheme.quiz2) && (
                      <td className="p-2 border-x border-slate-300">
                        <div className="flex flex-col items-center justify-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={gradeLimits.quiz2 || 5}
                            disabled={!isTheoryTeacher}
                            value={g.quiz2}
                            onChange={(e) => handleCellChange(g.id, 'quiz2', e.target.value)}
                            title={!isTheoryTeacher ? '🔒 مخصص لأستاذ النظري فقط' : `الحد الأقصى: ${gradeLimits.quiz2 || 5}`}
                            className={`w-18 p-2.5 rounded-xl text-center font-black text-base focus:outline-none transition ${
                              !isTheoryTeacher
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : pendingDiffs[`${g.id}-quiz2`]
                                ? 'bg-blue-50/80 border-2 border-blue-600 text-blue-950 ring-2 ring-blue-200'
                                : 'bg-slate-50 border-2 border-slate-300 text-black focus:border-[#0F2942]'
                            }`}
                          />
                          {pendingDiffs[`${g.id}-quiz2`] && (
                            <div 
                              className="text-[11px] font-black flex items-center justify-center gap-1 bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded-md border border-blue-300 mt-1 shadow-2xs animate-in fade-in"
                              title={`الدرجة السابقة: ${pendingDiffs[`${g.id}-quiz2`].oldValue} ➔ المقترحة: ${pendingDiffs[`${g.id}-quiz2`].newValue}`}
                            >
                              <span className="line-through text-slate-500">{pendingDiffs[`${g.id}-quiz2`].oldValue}</span>
                              <span className="text-blue-900 font-bold">➔</span>
                              <span className="text-emerald-800 font-bold">{pendingDiffs[`${g.id}-quiz2`].newValue}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 3. واجب 1 - يظهر فقط إذا كان البند مفتوحاً */}
                    {isAssessmentItemActive(assessmentScheme.assignment1) && (
                      <td className="p-2 border-x border-slate-300">
                        <div className="flex flex-col items-center justify-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={gradeLimits.assignment1 || 5}
                            disabled={!isTheoryTeacher}
                            value={g.assignment1}
                            onChange={(e) => handleCellChange(g.id, 'assignment1', e.target.value)}
                            title={!isTheoryTeacher ? '🔒 مخصص لأستاذ النظري فقط' : `الحد الأقصى: ${gradeLimits.assignment1 || 5}`}
                            className={`w-18 p-2.5 rounded-xl text-center font-black text-base focus:outline-none transition ${
                              !isTheoryTeacher
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : pendingDiffs[`${g.id}-assignment1`]
                                ? 'bg-blue-50/80 border-2 border-blue-600 text-blue-950 ring-2 ring-blue-200'
                                : 'bg-slate-50 border-2 border-slate-300 text-black focus:border-[#0F2942]'
                            }`}
                          />
                          {pendingDiffs[`${g.id}-assignment1`] && (
                            <div 
                              className="text-[11px] font-black flex items-center justify-center gap-1 bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded-md border border-blue-300 mt-1 shadow-2xs animate-in fade-in"
                              title={`الدرجة السابقة: ${pendingDiffs[`${g.id}-assignment1`].oldValue} ➔ المقترحة: ${pendingDiffs[`${g.id}-assignment1`].newValue}`}
                            >
                              <span className="line-through text-slate-500">{pendingDiffs[`${g.id}-assignment1`].oldValue}</span>
                              <span className="text-blue-900 font-bold">➔</span>
                              <span className="text-emerald-800 font-bold">{pendingDiffs[`${g.id}-assignment1`].newValue}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 4. واجب 2 - يظهر فقط إذا كان البند مفتوحاً */}
                    {isAssessmentItemActive(assessmentScheme.assignment2) && (
                      <td className="p-2 border-x border-slate-300">
                        <div className="flex flex-col items-center justify-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={gradeLimits.assignment2 || 5}
                            disabled={!isTheoryTeacher}
                            value={g.assignment2}
                            onChange={(e) => handleCellChange(g.id, 'assignment2', e.target.value)}
                            title={!isTheoryTeacher ? '🔒 مخصص لأستاذ النظري فقط' : `الحد الأقصى: ${gradeLimits.assignment2 || 5}`}
                            className={`w-18 p-2.5 rounded-xl text-center font-black text-base focus:outline-none transition ${
                              !isTheoryTeacher
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : pendingDiffs[`${g.id}-assignment2`]
                                ? 'bg-blue-50/80 border-2 border-blue-600 text-blue-950 ring-2 ring-blue-200'
                                : 'bg-slate-50 border-2 border-slate-300 text-black focus:border-[#0F2942]'
                            }`}
                          />
                          {pendingDiffs[`${g.id}-assignment2`] && (
                            <div 
                              className="text-[11px] font-black flex items-center justify-center gap-1 bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded-md border border-blue-300 mt-1 shadow-2xs animate-in fade-in"
                              title={`الدرجة السابقة: ${pendingDiffs[`${g.id}-assignment2`].oldValue} ➔ المقترحة: ${pendingDiffs[`${g.id}-assignment2`].newValue}`}
                            >
                              <span className="line-through text-slate-500">{pendingDiffs[`${g.id}-assignment2`].oldValue}</span>
                              <span className="text-blue-900 font-bold">➔</span>
                              <span className="text-emerald-800 font-bold">{pendingDiffs[`${g.id}-assignment2`].newValue}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 5. تقرير وبحث - يظهر فقط إذا كان البند مفتوحاً */}
                    {isAssessmentItemActive(assessmentScheme.report) && (
                      <td className="p-2 border-x border-slate-300">
                        <div className="flex flex-col items-center justify-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={gradeLimits.report || 10}
                            disabled={!isTheoryTeacher}
                            value={g.report}
                            onChange={(e) => handleCellChange(g.id, 'report', e.target.value)}
                            title={!isTheoryTeacher ? '🔒 مخصص لأستاذ النظري فقط' : `الحد الأقصى: ${gradeLimits.report || 10}`}
                            className={`w-18 p-2.5 rounded-xl text-center font-black text-base focus:outline-none transition ${
                              !isTheoryTeacher
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : pendingDiffs[`${g.id}-report`]
                                ? 'bg-blue-50/80 border-2 border-blue-600 text-blue-950 ring-2 ring-blue-200'
                                : 'bg-slate-50 border-2 border-slate-300 text-black focus:border-[#0F2942]'
                            }`}
                          />
                          {pendingDiffs[`${g.id}-report`] && (
                            <div 
                              className="text-[11px] font-black flex items-center justify-center gap-1 bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded-md border border-blue-300 mt-1 shadow-2xs animate-in fade-in"
                              title={`الدرجة السابقة: ${pendingDiffs[`${g.id}-report`].oldValue} ➔ المقترحة: ${pendingDiffs[`${g.id}-report`].newValue}`}
                            >
                              <span className="line-through text-slate-500">{pendingDiffs[`${g.id}-report`].oldValue}</span>
                              <span className="text-blue-900 font-bold">➔</span>
                              <span className="text-emerald-800 font-bold">{pendingDiffs[`${g.id}-report`].newValue}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 6. امتحان نصفي - يظهر فقط إذا كان البند مفتوحاً */}
                    {isAssessmentItemActive(assessmentScheme.midterm) && (
                      <td className="p-2 border-x border-slate-300">
                        <div className="flex flex-col items-center justify-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={gradeLimits.midterm || 10}
                            disabled={!isTheoryTeacher}
                            value={g.midterm}
                            onChange={(e) => handleCellChange(g.id, 'midterm', e.target.value)}
                            title={!isTheoryTeacher ? '🔒 مخصص لأستاذ النظري فقط' : `الحد الأقصى: ${gradeLimits.midterm || 10}`}
                            className={`w-18 p-2.5 rounded-xl text-center font-black text-base focus:outline-none transition ${
                              !isTheoryTeacher
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : pendingDiffs[`${g.id}-midterm`]
                                ? 'bg-blue-50/80 border-2 border-blue-600 text-blue-950 ring-2 ring-blue-200'
                                : 'bg-slate-50 border-2 border-slate-300 text-black focus:border-[#0F2942]'
                            }`}
                          />
                          {pendingDiffs[`${g.id}-midterm`] && (
                            <div 
                              className="text-[11px] font-black flex items-center justify-center gap-1 bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded-md border border-blue-300 mt-1 shadow-2xs animate-in fade-in"
                              title={`الدرجة السابقة: ${pendingDiffs[`${g.id}-midterm`].oldValue} ➔ المقترحة: ${pendingDiffs[`${g.id}-midterm`].newValue}`}
                            >
                              <span className="line-through text-slate-500">{pendingDiffs[`${g.id}-midterm`].oldValue}</span>
                              <span className="text-blue-900 font-bold">➔</span>
                              <span className="text-emerald-800 font-bold">{pendingDiffs[`${g.id}-midterm`].newValue}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 7. امتحان عملي - يظهر فقط إذا كان البند مفتوحاً والمادة تحتوي عملي */}
                    {isPracticalCourse && isAssessmentItemActive(assessmentScheme.practical) && (
                      <td className="p-2 bg-emerald-50/50 border-x-2 border-emerald-300">
                        <div className="flex flex-col items-center justify-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={gradeLimits.practical || 10}
                            disabled={!isPracticalTeacher}
                            value={g.practical}
                            onChange={(e) => handleCellChange(g.id, 'practical', e.target.value)}
                            title={!isPracticalTeacher ? '🔒 مخصص لأستاذ العملي فقط' : `الحد الأقصى: ${gradeLimits.practical || 10}`}
                            className={`w-18 p-2.5 rounded-xl text-center font-black text-base focus:outline-none transition ${
                              !isPracticalTeacher
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : pendingDiffs[`${g.id}-practical`]
                                ? 'bg-blue-50/80 border-2 border-blue-600 text-blue-950 ring-2 ring-blue-200'
                                : 'bg-emerald-50 border-2 border-emerald-300 text-emerald-950 focus:border-emerald-700'
                            }`}
                          />
                          {pendingDiffs[`${g.id}-practical`] && (
                            <div 
                              className="text-[11px] font-black flex items-center justify-center gap-1 bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded-md border border-blue-300 mt-1 shadow-2xs animate-in fade-in"
                              title={`الدرجة السابقة: ${pendingDiffs[`${g.id}-practical`].oldValue} ➔ المقترحة: ${pendingDiffs[`${g.id}-practical`].newValue}`}
                            >
                              <span className="line-through text-slate-500">{pendingDiffs[`${g.id}-practical`].oldValue}</span>
                              <span className="text-blue-900 font-bold">➔</span>
                              <span className="text-emerald-800 font-bold">{pendingDiffs[`${g.id}-practical`].newValue}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 🧮 مجموع السعي النهائي (من 50) */}
                    <td className="p-4 bg-slate-100 font-black text-black text-lg border-x-2 border-slate-400">
                      {g.final_coursework_total}
                    </td>

                    {/* 🎯 8. الامتحان النهائي (الدور الأول) - يظهر حصراً إذا كان مفعلاً من رئاسة القسم والمقرر */}
                    {isFinalExamEnabled && (
                      <td className="p-2 bg-slate-50 border-x-2 border-slate-200 animate-in fade-in">
                        <div className="flex flex-col items-center justify-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={50}
                            disabled={!isTheoryTeacher}
                            value={g.final_exam}
                            onChange={(e) => handleCellChange(g.id, 'final_exam', e.target.value)}
                            title={!isTheoryTeacher ? '🔒 مخصص لأستاذ النظري فقط' : 'الحد الأقصى: 50'}
                            className={`w-20 p-2.5 rounded-xl text-center font-black text-base focus:outline-none transition ${
                              !isTheoryTeacher
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : pendingDiffs[`${g.id}-final_exam`]
                                ? 'bg-slate-100 border-2 border-[#0F2942] text-slate-950 ring-2 ring-[#0F2942]/20'
                                : 'bg-white border-2 border-slate-300 text-slate-950 focus:border-[#0F2942]'
                            }`}
                          />
                          {pendingDiffs[`${g.id}-final_exam`] && (
                            <div 
                              className="text-[11px] font-black flex items-center justify-center gap-1 bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded-md border border-slate-300 mt-1 shadow-2xs animate-in fade-in"
                              title={`الدرجة السابقة: ${pendingDiffs[`${g.id}-final_exam`].oldValue} ➔ المقترحة: ${pendingDiffs[`${g.id}-final_exam`].newValue}`}
                            >
                              <span className="line-through text-slate-500">{pendingDiffs[`${g.id}-final_exam`].oldValue}</span>
                              <span className="text-[#0F2942] font-bold">➔</span>
                              <span className="text-emerald-700 font-bold">{pendingDiffs[`${g.id}-final_exam`].newValue}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 🔄 الدور الثاني (الإكمال) - يظهر حصراً إذا كان مفعلاً من رئاسة القسم ومتاح فقط للراسبين في الدور الأول */}
                    {isSupplementaryEnabled && (
                      <td className="p-2 bg-slate-50 border-x-2 border-slate-200 animate-in fade-in">
                        {isPassedFirstRound ? (
                          <div className="flex flex-col items-center justify-center">
                            <span 
                              className="px-2.5 py-1.5 bg-slate-100 text-slate-900 border border-slate-300 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1 shadow-2xs select-none"
                              title="الطالب ناجح ومجتاز من الدور الأول (لا يحتاج دور ثاني)"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                              <span>ناجح دور أول</span>
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max={50}
                              disabled={!isTheoryTeacher}
                              value={g.supplementary_exam || ''}
                              onChange={(e) => handleCellChange(g.id, 'supplementary_exam', e.target.value)}
                              placeholder="-"
                              title={!isTheoryTeacher ? '🔒 مخصص لأستاذ النظري فقط' : 'درجة الدور الثاني (من 50) - مخصص للطلبة الراسبين/المكملين بالدور الأول'}
                              className={`w-20 p-2 rounded-xl text-center font-black text-base focus:outline-none transition ${
                                !isTheoryTeacher
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                  : pendingDiffs[`${g.id}-supplementary_exam`]
                                  ? 'bg-slate-100 border-2 border-[#0F2942] text-slate-950 ring-2 ring-[#0F2942]/20'
                                  : 'bg-white border-2 border-slate-300 text-slate-950 focus:border-[#0F2942] shadow-2xs'
                              }`}
                            />
                            {pendingDiffs[`${g.id}-supplementary_exam`] && (
                              <div 
                                className="text-[11px] font-black flex items-center justify-center gap-1 bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded-md border border-slate-300 mt-1 shadow-2xs animate-in fade-in"
                                title={`الدرجة السابقة: ${pendingDiffs[`${g.id}-supplementary_exam`].oldValue} ➔ المقترحة: ${pendingDiffs[`${g.id}-supplementary_exam`].newValue}`}
                              >
                                <span className="line-through text-slate-500">{pendingDiffs[`${g.id}-supplementary_exam`].oldValue}</span>
                                <span className="text-[#0F2942] font-bold">➔</span>
                                <span className="text-emerald-700 font-bold">{pendingDiffs[`${g.id}-supplementary_exam`].newValue}</span>
                              </div>
                            )}
                            <span className="text-[10px] text-slate-700 font-black mt-0.5 flex items-center gap-0.5">
                              <RotateCcw className="w-2.5 h-2.5 text-[#0F2942]" />
                              <span>مؤهل لدور 2</span>
                            </span>
                          </div>
                        )}
                      </td>
                    )}

                    {/* 💯 المجموع الإجمالي الفعلي (من 100) */}
                    <td className="p-4 bg-slate-100 font-black text-slate-950 text-base border-x-2 border-slate-300">
                      {finalTot}
                    </td>

                    {/* 🅰️ التقدير الحرفي أو حالة المادة */}
                    <td className="p-4 border-x border-slate-300 whitespace-nowrap text-center">
                      {isFinalExamEnabled ? (
                        <span className={`px-3 py-1 rounded-xl font-black text-base whitespace-nowrap inline-block ${ finalTot >= 50 ? 'bg-slate-100 text-slate-950 border border-slate-300' : 'bg-rose-50 text-rose-950 border border-rose-200' }`}>
                          {letterGrad}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap inline-flex items-center gap-1 shadow-2xs">
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          <span>بانتظار الفاينل</span>
                        </span>
                      )}
                    </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
  );
}
