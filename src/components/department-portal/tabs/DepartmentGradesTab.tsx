'use client'; // ⚡ تفعيل واجهة العميل التفاعلية في Next.js

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import {
  FileSpreadsheet, // 📊 أيقونة شيت الإكسل
  CheckCircle2, // ✅ أيقونة السعيات المعتمدة
  Award, // 🏆 أيقونة وسام متوسط السعي
  Search, // 🔍 أيقونة البحث اللحظي
  BookOpen, // 📖 أيقونة المادة الدراسية
  ChevronDown, // 🔽 أيقونة السهم للقائمة المنسدلة
  Check, // ✔️ أيقونة التحقق والاختيار
  CheckSquare, // 🔲 أيقونة التحديد الجماعي
  Trash2, // 🗑️ أيقونة الحذف الجماعي
} from 'lucide-react'; // 🎨 استيراد أيقونات مكتبة لوسيد
import AdminPagination from '@/components/AdminPagination'; // 📄 استيراد مكون نظام الصفحات الموحد كافتراضي
import type { Grade, Course, AssessmentScheme } from '@/types'; // 🏷️ استيراد الأنواع والواجهات الصارمة
import { isAssessmentItemActive, getCourseAssessmentScheme, type CourseworkSchemeKey } from '@/lib/grade-utils'; // 🎛️ أدوات فحص البنود النشطة والمفتوحة والمخطط التقييمي

// 📋 واجهة مدخلات مكون تبويب درجات وسعيات مسار بولونيا بقواعد تايب سكريبت صارمة وبدون any
export interface DepartmentGradesTabProps {
  deptGrades: Grade[]; // 📝 مصفوفة درجات القسم الكاملة
  courses: Course[]; // 📚 مصفوفة المقررات العامة
  deptCourses: Course[]; // 🏢 مصفوفة المقررات التابعة للقسم
  deptName: string; // 🏛️ اسم القسم العلمي
  filteredGrades: Grade[]; // 🔍 مصفوفة الدرجات المفلترة
  selectedGradeIds: string[]; // 🔲 معرفات سجلات الدرجات المحددة
  setSelectedGradeIds: (ids: string[]) => void; // 🔄 دالة تحديث السجلات المحددة
  gradeSearch: string; // ✍️ نص البحث بالدرجات
  setGradeSearch: (val: string) => void; // 🔄 دالة تحديث نص البحث
  filterGradeCourse: string; // 📘 المادة المختارة للفلترة
  setFilterGradeCourse: (val: string) => void; // 🔄 دالة تغيير مادة الفلترة
  filterGradeStage: number | 'all'; // 🎓 المرحلة الدراسية المفلترة
  handleSelectGradeStage: (val: number | 'all') => void; // ⚡ دالة تغيير المرحلة
  filterGradeSemester: number | 'all'; // 🗓️ الكورس المفلتر
  setFilterGradeSemester: (val: number | 'all') => void; // ⚡ دالة تغيير الكورس
  isGradeCourseDropdownOpen: boolean; // 📂 حالة فتح قائمة المواد المنسدلة
  setIsGradeCourseDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل فتح/غلق القائمة
  gradeCourseDropdownRef: React.RefObject<HTMLDivElement | null>; // 📍 مرجع القائمة المنسدلة للنقر خارجها
  gradeSelectableCourses: Course[]; // 📋 قائمة المواد القابلة للاختيار
  currentActiveScheme: AssessmentScheme; // 🎛️ مخطط التوزيع المعتمد الفعال
  isExportingGradesExcel: boolean; // ⏳ حالة جاري تصدير الإكسل
  handleExportGradesExcel: () => void; // ⚡ دالة تصدير كشف الدرجات لإكسل
  handleBulkDeleteGrades: () => void; // 🗑️ دالة حذف الدرجات المحددة جماعياً
  gradePage: number; // 📄 رقم الصفحة الحالي
  setGradePage: (p: number) => void; // 🔄 تغيير رقم الصفحة
  gradePageSize: number; // 🔢 عدد العناصر في الصفحة
  setGradePageSize: (s: number) => void; // 🔄 تغيير حجم الصفحة
  calculateCourseworkTotal: (g: Grade, scheme?: AssessmentScheme | null) => number; // 🧮 دالة حساب مجموع السعي الفصلي للبند المفتوح
  calculateFinalTotal: (g: Grade, isSupActive?: boolean, scheme?: AssessmentScheme | null) => number; // 🧮 دالة حساب الدرجة النهائية الكلية للبند المفتوح
  getLetterGrade: (score: number) => string; // 🔤 دالة حساب التقدير الحرفي
  getCourseAssessmentScheme: (course?: Course) => AssessmentScheme; // ⚙️ دالة جلب مخطط تقييم المادة
  getStageNameInArabic: (stg: number) => string; // 🏷️ دالة تحويل رقم المرحلة لاسم عربي
}

// 🏛️ مكون تبويب درجات وسعيات مسار بولونيا المستقل
export const DepartmentGradesTab: React.FC<DepartmentGradesTabProps> = ({
  deptGrades, // 📝 درجات القسم
  courses, // 📚 المواد العامة
  deptCourses, // 🏢 مواد القسم
  deptName, // 🏛️ اسم القسم
  filteredGrades, // 🔍 الدرجات المفلترة
  selectedGradeIds, // 🔲 السجلات المحددة
  setSelectedGradeIds, // 🔄 تحديث التحديد
  gradeSearch, // ✍️ نص البحث
  setGradeSearch, // 🔄 تحديث البحث
  filterGradeCourse, // 📘 المادة المفلترة
  setFilterGradeCourse, // 🔄 تحديث المادة
  filterGradeStage, // 🎓 المرحلة
  handleSelectGradeStage, // ⚡ دالة المرحلة
  filterGradeSemester, // 🗓️ الكورس
  setFilterGradeSemester, // ⚡ دالة الكورس
  isGradeCourseDropdownOpen, // 📂 حالة القائمة
  setIsGradeCourseDropdownOpen, // 🔄 تبديل القائمة
  gradeCourseDropdownRef, // 📍 مرجع القائمة
  gradeSelectableCourses, // 📋 المواد القابلة للاختيار
  currentActiveScheme, // 🎛️ المخطط الفعال
  isExportingGradesExcel, // ⏳ حالة تصدير إكسل
  handleExportGradesExcel, // ⚡ دالة تصدير إكسل
  handleBulkDeleteGrades, // 🗑️ دالة الحذف الجماعي
  gradePage, // 📄 الصفحة
  setGradePage, // 🔄 تحديث الصفحة
  gradePageSize, // 🔢 حجم الصفحة
  setGradePageSize, // 🔄 تحديث الحجم
  calculateCourseworkTotal, // 🧮 حساب السعي
  calculateFinalTotal, // 🧮 حساب النهائي
  getLetterGrade, // 🔤 حساب التقدير
  getCourseAssessmentScheme, // ⚙️ جلب المخطط
  getStageNameInArabic, // 🏷️ اسم المرحلة
}) => {
  return (
    // 📦 الحاوية الرئيسية للتبويب مع أنيميشن ظهور سلس
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 📊 بطاقات الإحصائيات السريعة للسعيات والدرجات (3 كروت متناسقة باللون الأسود الواضح) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1️⃣ كارت إجمالي السجلات */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-950 text-base font-black mb-1">
            <span>إجمالي السجلات الأكاديمية</span> {/* 🏷️ عنوان الكارت */}
            <FileSpreadsheet className="w-5 h-5 text-blue-900" /> {/* 📊 أيقونة الكارت */}
          </div>
          <p className="text-3xl font-black text-slate-950 mt-1">{deptGrades.length}</p> {/* 🔢 العدد الكلي */}
          <p className="text-sm text-slate-950 font-black mt-1.5">سجل رصد بولونيا</p> {/* 📝 الوصف */}
        </div>

        {/* 2️⃣ كارت السعيات المعتمدة */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-950 text-base font-black mb-1">
            <span>السعيات المعتمدة</span> {/* 🏷️ عنوان الكارت */}
            <CheckCircle2 className="w-5 h-5 text-emerald-900" /> {/* ✅ أيقونة الاعتماد */}
          </div>
          <p className="text-3xl font-black text-slate-950 mt-1">
            {deptGrades.filter((g) => g.is_locked).length} {/* 🔢 عدد السجلات المقفولة */}
          </p>
          <p className="text-sm text-slate-950 font-black mt-1.5">سجل معتمد ونهائي</p> {/* 📝 الوصف */}
        </div>

        {/* 3️⃣ كارت متوسط السعي الفصلي */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-950 text-base font-black mb-1">
            <span>متوسط السعي (من 50)</span> {/* 🏷️ عنوان الكارت */}
            <Award className="w-5 h-5 text-indigo-900" /> {/* 🏆 أيقونة الوسام */}
          </div>
          <p className="text-3xl font-black text-slate-950 mt-1">
            {deptGrades.length > 0
              ? (
                  deptGrades.reduce((acc, g) => {
                    const c = courses.find((crs) => crs.id === g.course_id || crs.name === g.course_name); // 🔍 إيجاد المادة
                    const scheme = c ? getCourseAssessmentScheme(c) : undefined; // 🎛️ جلب مخطط تقييم المادة
                    return acc + calculateCourseworkTotal(g, scheme); // 🧮 جمع السعي للبنود المفتوحة فقط
                  }, 0) / deptGrades.length
                ).toFixed(1)
              : '0.0'} {/* 🧮 حساب المتوسط الموزون */}
          </p>
          <p className="text-sm text-slate-950 font-black mt-1.5">درجة السعي الفصلي الموزون</p> {/* 📝 الوصف */}
        </div>
      </div>

      {/* 📋 كارد جدول السعيات والدرجات مع الفلاتر والأدوات */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        {/* 🧭 رأس التبويب وعنوان القسم وزر تصدير الإكسل */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
              <FileSpreadsheet className="w-7 h-7 text-[#0F2942]" /> {/* 📊 الأيقونة الرسمية */}
              <span>سجلات درجات وسعيات مسار بولونيا لطلاب قسم {deptName} ({filteredGrades.length})</span> {/* 🏷️ العنوان بالعدد */}
            </h2>
            <p className="text-sm sm:text-base font-black text-slate-950 mt-1">
              متابعة وتدقيق درجات البنود الـ 7 للسعي الفصلي والامتحان النهائي ومطابقتها للمعايير الأكاديمية {/* 📝 التوصيف الأكاديمي */}
            </p>
          </div>
          {/* 📊 زر تصدير كشف الدرجات والسعيات الرسمية لمسار بولونيا إلى Excel بتصميم كحلي ملكي */}
          <button
            type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
            onClick={handleExportGradesExcel} // ⚡ استدعاء دالة تصدير كشف درجات بولونيا
            disabled={isExportingGradesExcel || filteredGrades.length === 0} // 🛑 تعطيل الزر أثناء التصدير أو عدم توفر بيانات
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-sm sm:text-base transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 border border-[#163a5f]" // 🎨 تصميم كحلي ملكي موحد
            title="تصدير كشف الدرجات والسعيات لمسار بولونيا إلى ملف Excel" // 💡 نص التلميح
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-300" /> {/* 📊 أيقونة الإكسل بلون زمردي مشرق */}
            <span>{isExportingGradesExcel ? 'جاري التصدير...' : selectedGradeIds.length > 0 ? `تصدير المحدد (${selectedGradeIds.length}) Excel` : 'تصدير الدرجات (Excel)'}</span> {/* 🏷️ نص تفاعلي حسب التحديد */}
          </button>
        </div>

        {/* 🔍 شريط البحث وفلاتر المراحل والمواد المنظم في صفين أنيقين */}
        <div className="space-y-3 pt-2">
          {/* السطر الأول: حقل البحث + قائمة اختيار المادة الدراسية */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" /> {/* 🔍 أيقونة البحث */}
              <input
                type="text"
                value={gradeSearch}
                onChange={(e) => setGradeSearch(e.target.value)}
                placeholder="بحث باسم الطالب، المادة، أو الرقم الجامعي..."
                className="w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-950 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2942]"
              />
            </div>

            {/* 📘 قائمة اختيار المادة الدراسية المخصصة الفاخرة (Custom Pop-out Dropdown) */}
            <div ref={gradeCourseDropdownRef} className="relative w-full sm:w-80 shrink-0 z-[999999]">
              <button
                type="button"
                onClick={() => setIsGradeCourseDropdownOpen((prev) => !prev)}
                className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-black transition-all flex items-center justify-between gap-3 shadow-2xs cursor-pointer ${
                  isGradeCourseDropdownOpen
                    ? 'bg-white border-[#0F2942] ring-2 ring-[#0F2942]/20 text-[#0F2942]'
                    : filterGradeCourse !== 'all'
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-950 border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <BookOpen className={`w-4 h-4 shrink-0 ${filterGradeCourse !== 'all' && !isGradeCourseDropdownOpen ? 'text-blue-300' : 'text-slate-700'}`} />
                  <span className="truncate font-black">
                    {filterGradeCourse !== 'all' && deptCourses.find((c) => c.id === filterGradeCourse)
                      ? `${deptCourses.find((c) => c.id === filterGradeCourse)?.name} (${deptCourses.find((c) => c.id === filterGradeCourse)?.code})`
                      : filterGradeStage === 'all'
                      ? `كافة المواد الدراسية (${gradeSelectableCourses.length})`
                      : `كافة مواد المرحلة ${getStageNameInArabic(filterGradeStage)} (${gradeSelectableCourses.length})`}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    isGradeCourseDropdownOpen ? 'rotate-180 text-[#0F2942]' : filterGradeCourse !== 'all' ? 'text-white' : 'text-slate-600'
                  }`}
                />
              </button>

              {/* 📋 القائمة المنسدلة المنبثقة بتصميم فاخر وظلال أنيقة */}
              {isGradeCourseDropdownOpen && (
                <div
                  className="absolute top-full right-0 mt-2 w-full min-w-[280px] sm:min-w-[340px] max-w-[95vw] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-[999999] animate-in fade-in zoom-in-95 duration-150"
                  style={{ zIndex: 999999 }}
                >
                  <div className="p-2.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs font-black text-slate-700">
                    <span>تصفية بحسب المادة</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-900 font-bold">
                      {gradeSelectableCourses.length} مادة
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 p-1.5 space-y-1">
                    {/* خيار كافة المواد */}
                    <button
                      type="button"
                      onClick={() => {
                        setFilterGradeCourse('all');
                        setIsGradeCourseDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-right transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        filterGradeCourse === 'all'
                          ? 'bg-[#0F2942] text-white shadow-xs font-black'
                          : 'hover:bg-slate-100 text-slate-900 font-bold'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className={`w-4 h-4 ${filterGradeCourse === 'all' ? 'text-cyan-300' : 'text-slate-500'}`} />
                        <span className="text-sm sm:text-base font-black">
                          {filterGradeStage === 'all'
                            ? `كافة المواد الدراسية`
                            : `كافة مواد المرحلة ${getStageNameInArabic(filterGradeStage)}`}
                        </span>
                      </div>
                      {filterGradeCourse === 'all' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>

                    {/* المواد الدراسية المتاحة */}
                    {gradeSelectableCourses.map((c) => {
                      const isSelected = filterGradeCourse === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setFilterGradeCourse(c.id);
                            setIsGradeCourseDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-right transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-[#0F2942] text-white shadow-xs'
                              : 'hover:bg-slate-100 text-slate-950'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className={`font-black text-base truncate ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                              {c.name}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-sm">
                              <span className={`px-2 py-0.5 rounded-lg font-mono font-black text-xs ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-950 border border-slate-300'
                              }`}>
                                {c.code}
                              </span>
                              <span className={isSelected ? 'text-white font-black text-sm' : 'text-slate-950 font-black text-sm'}>
                                • {c.semester === 2 ? 'كورس ثاني' : 'كورس أول'}
                              </span>
                              <span className={isSelected ? 'text-white font-black text-sm' : 'text-slate-950 font-black text-sm'}>
                                • المرحلة {getStageNameInArabic(c.stage_number || 1)}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* السطر الثاني: تبويبات المراحل بكامل العرض + تبويبات الكورسات المرتبة أفقياً */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* 🏷️ فلاتر المراحل الأكاديمية مع الشارات */}
            <div className="flex-1 flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-300 gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  handleSelectGradeStage('all');
                  setSelectedGradeIds([]);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  filterGradeStage === 'all'
                    ? 'bg-[#0F2942] text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                <span>كافة المراحل</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                  filterGradeStage === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {deptGrades.length}
                </span>
              </button>
              {[1, 2, 3, 4].map((stageNum: number) => {
                const count = deptGrades.filter((g) => {
                  const c = courses.find((crs) => crs.id === g.course_id);
                  return (c?.stage_number || 1) === stageNum;
                }).length;
                const isSel = filterGradeStage === stageNum;
                return (
                  <button
                    key={stageNum}
                    type="button"
                    onClick={() => {
                      handleSelectGradeStage(stageNum);
                      setSelectedGradeIds([]);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      isSel
                        ? 'bg-[#0F2942] text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span>المرحلة {getStageNameInArabic(stageNum)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                      isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 🗓️ فلاتر الكورسات الدراسية لسجل الدرجات مرتبة أفقياً كشريط تبويبات فاخر */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-300 gap-1 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  setFilterGradeSemester('all');
                  setSelectedGradeIds([]);
                }}
                className={`flex-1 sm:flex-initial py-2 px-3.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  filterGradeSemester === 'all'
                    ? 'bg-[#0F2942] text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                <span>كافة الكورسات</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                  filterGradeSemester === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {deptGrades.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterGradeSemester(1);
                  setSelectedGradeIds([]);
                }}
                className={`flex-1 sm:flex-initial py-2 px-3.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  filterGradeSemester === 1
                    ? 'bg-[#0F2942] text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                <span>الكورس الأول</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                  filterGradeSemester === 1 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {deptGrades.filter((g) => {
                    const c = courses.find((crs) => crs.id === g.course_id);
                    return (g.semester || c?.semester || 1) === 1;
                  }).length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterGradeSemester(2);
                  setSelectedGradeIds([]);
                }}
                className={`flex-1 sm:flex-initial py-2 px-3.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  filterGradeSemester === 2
                    ? 'bg-[#0F2942] text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                <span>الكورس الثاني</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                  filterGradeSemester === 2 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {deptGrades.filter((g) => {
                    const c = courses.find((crs) => crs.id === g.course_id);
                    return (g.semester || c?.semester || 1) === 2;
                  }).length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 🔘 شريط الإجراءات الجماعية العائم لسجلات الدرجات المحددة */}
        {selectedGradeIds.length > 0 && (
          <div className="p-3.5 bg-blue-50 border-2 border-blue-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-5 h-5 text-blue-700" />
              <span className="font-black text-blue-950 text-base">
                تم تحديد <strong className="font-mono">{selectedGradeIds.length}</strong> سجلات درجات
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportGradesExcel}
                disabled={isExportingGradesExcel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isExportingGradesExcel ? 'جاري التصدير...' : `تصدير المحدد (${selectedGradeIds.length}) Excel`}</span>
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteGrades}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف سجلات الدرجات المحددة ({selectedGradeIds.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedGradeIds([])}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-black text-sm transition cursor-pointer"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        )}

        {/* 📋 جدول الدرجات والسعيات المتقدم */}
        {filteredGrades.length === 0 ? (
          <div className="text-center py-14 bg-slate-50 rounded-3xl border border-slate-200 space-y-2">
            <p className="text-lg font-black text-slate-950">
              لا توجد درجات مسجلة مطابقة لمعايير البحث الحالية.
            </p>
            <p className="text-base font-bold text-slate-600">
              يرجى تعديل معايير البحث أو اختيار مادة أو مرحلة أخرى.
            </p>
          </div>
        ) : (
          <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right border-collapse text-base font-black">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-950 font-black text-base">
                  {/* 🔘 مربع اختيار تحديد الكل */}
                  <th className="p-3 text-center w-12">
                    <input
                      type="checkbox"
                      checked={filteredGrades.length > 0 && filteredGrades.every((g) => selectedGradeIds.includes(g.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGradeIds(filteredGrades.map((g) => g.id));
                        } else {
                          setSelectedGradeIds([]);
                        }
                      }}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title="تحديد الكل"
                    />
                  </th>
                  <th className="p-3 text-center text-base w-12">ت</th>
                  <th className="p-3 text-base min-w-[170px]">اسم الطالب</th>
                  <th className="p-3 text-base min-w-[200px]">المادة</th>

                  {/* 1️⃣ كويز 1 - يظهر فقط إذا كان مفتوحاً */}
                  {isAssessmentItemActive(currentActiveScheme.quiz1) && (
                    <th className="p-3 text-center text-sm font-black text-slate-950 whitespace-nowrap" title={`البند الأول: ${currentActiveScheme.quiz1?.title_ar || 'كويز (1)'}`}>
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{currentActiveScheme.quiz1?.title_ar || 'كويز (1)'}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-[#0F2942] text-white text-xs font-black shadow-2xs">
                          {currentActiveScheme.quiz1?.max_score ?? 5}
                        </span>
                      </div>
                    </th>
                  )}

                  {/* 2️⃣ كويز 2 - يظهر فقط إذا كان مفتوحاً */}
                  {isAssessmentItemActive(currentActiveScheme.quiz2) && (
                    <th className="p-3 text-center text-sm font-black text-slate-950 whitespace-nowrap" title={`البند الثاني: ${currentActiveScheme.quiz2?.title_ar || 'كويز (2)'}`}>
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{currentActiveScheme.quiz2?.title_ar || 'كويز (2)'}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-[#0F2942] text-white text-xs font-black shadow-2xs">
                          {currentActiveScheme.quiz2?.max_score ?? 5}
                        </span>
                      </div>
                    </th>
                  )}

                  {/* 3️⃣ واجب 1 - يظهر فقط إذا كان مفتوحاً */}
                  {isAssessmentItemActive(currentActiveScheme.assignment1) && (
                    <th className="p-3 text-center text-sm font-black text-slate-950 whitespace-nowrap" title={`البند الثالث: ${currentActiveScheme.assignment1?.title_ar || 'واجب (1)'}`}>
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{currentActiveScheme.assignment1?.title_ar || 'واجب (1)'}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-[#0F2942] text-white text-xs font-black shadow-2xs">
                          {currentActiveScheme.assignment1?.max_score ?? 5}
                        </span>
                      </div>
                    </th>
                  )}

                  {/* 4️⃣ واجب 2 - يظهر فقط إذا كان مفتوحاً */}
                  {isAssessmentItemActive(currentActiveScheme.assignment2) && (
                    <th className="p-3 text-center text-sm font-black text-slate-950 whitespace-nowrap" title={`البند الرابع: ${currentActiveScheme.assignment2?.title_ar || 'واجب (2)'}`}>
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{currentActiveScheme.assignment2?.title_ar || 'واجب (2)'}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-[#0F2942] text-white text-xs font-black shadow-2xs">
                          {currentActiveScheme.assignment2?.max_score ?? 5}
                        </span>
                      </div>
                    </th>
                  )}

                  {/* 5️⃣ تقرير ونشاط - يظهر فقط إذا كان مفتوحاً */}
                  {isAssessmentItemActive(currentActiveScheme.report) && (
                    <th className="p-3 text-center text-sm font-black text-slate-950 whitespace-nowrap" title={`بند التقرير والنشاط: ${currentActiveScheme.report?.title_ar || 'تقرير وبحث'}`}>
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{currentActiveScheme.report?.title_ar || 'تقرير'}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-[#0F2942] text-white text-xs font-black shadow-2xs">
                          {currentActiveScheme.report?.max_score ?? 10}
                        </span>
                      </div>
                    </th>
                  )}

                  {/* 6️⃣ امتحان نصفي - يظهر فقط إذا كان مفتوحاً */}
                  {isAssessmentItemActive(currentActiveScheme.midterm) && (
                    <th className="p-3 text-center text-sm font-black text-slate-950 whitespace-nowrap" title={`امتحان منتصف الفصل: ${currentActiveScheme.midterm?.title_ar || 'امتحان نصفي'}`}>
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{currentActiveScheme.midterm?.title_ar || 'نصفي'}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-[#0F2942] text-white text-xs font-black shadow-2xs">
                          {currentActiveScheme.midterm?.max_score ?? 10}
                        </span>
                      </div>
                    </th>
                  )}

                  {/* 7️⃣ مختبر وعملي - يظهر فقط إذا كان مفتوحاً */}
                  {isAssessmentItemActive(currentActiveScheme.practical) && (
                    <th className="p-3 text-center text-sm font-black text-slate-950 whitespace-nowrap" title={`التقييم العملي والمختبري: ${currentActiveScheme.practical?.title_ar || 'مختبر وعملي'}`}>
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{currentActiveScheme.practical?.title_ar || 'عملي'}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-[#0F2942] text-white text-xs font-black shadow-2xs">
                          {currentActiveScheme.practical?.max_score ?? 10}
                        </span>
                      </div>
                    </th>
                  )}
                  <th className="p-3 text-center bg-slate-200 text-base text-slate-950 font-black whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>السعي</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-white text-xs font-black shadow-2xs">50</span>
                    </div>
                  </th>
                  <th className="p-3 text-center text-base whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>النهائي</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-white text-xs font-black shadow-2xs">50</span>
                    </div>
                  </th>
                  <th className="p-3 text-center bg-blue-50 text-blue-950 text-base font-black whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>المجموع</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-[#0F2942] text-white text-xs font-black shadow-2xs">100</span>
                    </div>
                  </th>
                  <th className="p-3 text-center text-base whitespace-nowrap">التقدير</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-black text-slate-950 text-base">
                {(() => {
                  // 🧮 حسابات شريحة الصفحة لجدول الدرجات والسعي
                  const totalGradesCount = filteredGrades.length; // 🔢 إجمالي سجلات الدرجات بعد الفلترة
                  const safeGradePage = Math.max(1, Math.min(gradePage, Math.max(1, Math.ceil(totalGradesCount / gradePageSize)))); // 🛡️ حماية رقم الصفحة
                  const gradeStartIndex = (safeGradePage - 1) * gradePageSize; // 📍 بداية شريحة الدرجات
                  const paginatedGrades = filteredGrades.slice(gradeStartIndex, gradeStartIndex + gradePageSize); // 📋 سجلات درجات الصفحة الحالية

                  return paginatedGrades.map((g, index) => {
                    const actualIndex = gradeStartIndex + index; // 🔢 التسلسل العام الحقيقي للدرجة
                    const course = courses.find((c) => c.id === g.course_id);
                    const isSupActive = course?.is_supplementary_exam_enabled === true;
                    const rowScheme = getCourseAssessmentScheme(course);
                    const courseworkTotal = calculateCourseworkTotal(g, rowScheme);
                    const finalTotal = calculateFinalTotal(g, isSupActive, rowScheme); // 💯 حساب النهائي للبند المفتوح بالمخطط
                    const letterGrade = getLetterGrade(finalTotal);
                    const isSelected = selectedGradeIds.includes(g.id);

                    return (
                      <tr key={g.id} className={`transition ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedGradeIds(selectedGradeIds.filter((id) => id !== g.id));
                              } else {
                                setSelectedGradeIds([...selectedGradeIds, g.id]);
                              }
                            }}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-center font-black text-slate-950 text-base whitespace-nowrap">
                          <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-950 font-black text-sm shadow-2xs">
                            {actualIndex + 1}
                          </span>
                        </td>
                        <td className="p-3 font-black text-slate-950 text-base whitespace-nowrap">
                          <div className="font-black text-slate-950 text-base">{g.student_name}</div>
                          <div className="mt-1">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-400 rounded-lg text-slate-950 font-mono font-black text-xs inline-block shadow-2xs">
                              {g.university_number}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-900 text-base">
                          <div className="font-black text-slate-950 text-base">{g.course_name}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-black text-slate-950">
                              المرحلة {getStageNameInArabic(course?.stage_number || 1)}
                            </span>
                            <span className="text-slate-950 font-black mx-0.5">•</span>
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border shadow-2xs ${ g.semester === 2 ? 'bg-teal-100 text-teal-950 border-teal-400' : 'bg-sky-100 text-sky-950 border-sky-400' }`}>
                              كورس {g.semester === 2 ? 'ثاني' : 'أول'}
                            </span>
                          </div>
                        </td>

                        {/* 1️⃣ كويز 1 - يظهر فقط إذا كان البند مفتوحاً */}
                        {isAssessmentItemActive(currentActiveScheme.quiz1) && (
                          <td className="p-3 text-center text-base whitespace-nowrap" title={`${rowScheme.quiz1?.title_ar || 'كويز (1)'} (من ${rowScheme.quiz1?.max_score ?? 5})`}>
                            <span className="font-black text-slate-950 text-base">{g.quiz1}</span>
                          </td>
                        )}

                        {/* 2️⃣ كويز 2 - يظهر فقط إذا كان البند مفتوحاً */}
                        {isAssessmentItemActive(currentActiveScheme.quiz2) && (
                          <td className="p-3 text-center text-base whitespace-nowrap" title={`${rowScheme.quiz2?.title_ar || 'كويز (2)'} (من ${rowScheme.quiz2?.max_score ?? 5})`}>
                            <span className="font-black text-slate-950 text-base">{g.quiz2}</span>
                          </td>
                        )}

                        {/* 3️⃣ واجب 1 - يظهر فقط إذا كان البند مفتوحاً */}
                        {isAssessmentItemActive(currentActiveScheme.assignment1) && (
                          <td className="p-3 text-center text-base whitespace-nowrap" title={`${rowScheme.assignment1?.title_ar || 'واجب (1)'} (من ${rowScheme.assignment1?.max_score ?? 5})`}>
                            <span className="font-black text-slate-950 text-base">{g.assignment1}</span>
                          </td>
                        )}

                        {/* 4️⃣ واجب 2 - يظهر فقط إذا كان البند مفتوحاً */}
                        {isAssessmentItemActive(currentActiveScheme.assignment2) && (
                          <td className="p-3 text-center text-base whitespace-nowrap" title={`${rowScheme.assignment2?.title_ar || 'واجب (2)'} (من ${rowScheme.assignment2?.max_score ?? 5})`}>
                            <span className="font-black text-slate-950 text-base">{g.assignment2}</span>
                          </td>
                        )}

                        {/* 5️⃣ تقرير ونشاط - يظهر فقط إذا كان البند مفتوحاً */}
                        {isAssessmentItemActive(currentActiveScheme.report) && (
                          <td className="p-3 text-center text-base whitespace-nowrap" title={`${rowScheme.report?.title_ar || 'تقرير'} (من ${rowScheme.report?.max_score ?? 10})`}>
                            <span className="font-black text-slate-950 text-base">{g.report}</span>
                          </td>
                        )}

                        {/* 6️⃣ امتحان نصفي - يظهر فقط إذا كان البند مفتوحاً */}
                        {isAssessmentItemActive(currentActiveScheme.midterm) && (
                          <td className="p-3 text-center text-base whitespace-nowrap" title={`${rowScheme.midterm?.title_ar || 'نصفي'} (من ${rowScheme.midterm?.max_score ?? 10})`}>
                            <span className="font-black text-slate-950 text-base">{g.midterm}</span>
                          </td>
                        )}

                        {/* 7️⃣ مختبر وعملي - يظهر فقط إذا كان البند مفتوحاً */}
                        {isAssessmentItemActive(currentActiveScheme.practical) && (
                          <td className="p-3 text-center text-base whitespace-nowrap" title={`${rowScheme.practical?.title_ar || 'عملي'} (من ${rowScheme.practical?.max_score ?? 10})`}>
                            <span className="font-black text-slate-950 text-base">{g.practical || 0}</span>
                          </td>
                        )}
                        <td className="p-3 text-center font-black text-slate-950 bg-slate-100/80 text-base whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-300 shadow-2xs inline-block font-black whitespace-nowrap">
                            {courseworkTotal} <span className="text-xs text-slate-500 font-bold">/ 50</span>
                          </span>
                        </td>
                        <td className="p-3 text-center text-base font-black whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200 shadow-2xs inline-block font-black whitespace-nowrap">
                            {g.final_exam !== undefined ? g.final_exam : '—'} <span className="text-xs text-slate-500 font-bold">/ 50</span>
                          </span>
                        </td>
                        <td className="p-3 text-center font-black text-blue-950 bg-blue-50/70 text-base whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-blue-100/80 rounded-lg border border-blue-200 shadow-2xs inline-block font-black whitespace-nowrap">
                            {finalTotal} <span className="text-xs text-blue-600 font-bold">/ 100</span>
                          </span>
                        </td>
                        <td className="p-3 text-center text-base whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black border shadow-2xs ${
                            finalTotal >= 90
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                              : finalTotal >= 80
                              ? 'bg-teal-100 text-teal-950 border-teal-300'
                              : finalTotal >= 70
                              ? 'bg-blue-100 text-blue-950 border-blue-300'
                              : finalTotal >= 60
                              ? 'bg-sky-100 text-sky-950 border-sky-300'
                              : finalTotal >= 50
                              ? 'bg-slate-100 text-slate-950 border-slate-300'
                              : 'bg-rose-100 text-rose-950 border-rose-300'
                          }`}>
                            {letterGrade}
                          </span>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>

          {/* 📄 شريط نظام الصفحات الموحد والفاخر لجدول الدرجات والسعي */}
          <div className="mt-4">
            <AdminPagination
              currentPage={Math.max(1, Math.min(gradePage, Math.max(1, Math.ceil(filteredGrades.length / gradePageSize))))}
              totalItems={filteredGrades.length}
              pageSize={gradePageSize}
              onPageChange={(page: number) => setGradePage(page)}
              onPageSizeChange={(size: number) => {
                setGradePageSize(size);
                setGradePage(1);
              }}
              itemLabel="سجل/طالب"
            />
          </div>
          </>
        )}

      </div>
    </div>
  );
};

export default DepartmentGradesTab; // 🚀 تصدير المكون
