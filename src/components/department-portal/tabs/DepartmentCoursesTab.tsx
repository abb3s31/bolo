'use client'; // ⚡ واجهة تفاعلية تعمل بمتصفح العميل

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import { createPortal } from 'react-dom'; // 🚪 بورتال لرسم القوائم العائمة
import {
  BookOpen, // 📖 أيقونة المادة الدراسية
  Plus, // ➕ أيقونة الإضافة
  Layers, // 📚 أيقونة الكورس
  Award, // 🏆 أيقونة الوحدات
  Calendar, // 📅 أيقونة الفصل
  Sliders, // ⚙️ أيقونة النوع
  Users, // 👥 أيقونة الأساتذة
  FlaskConical, // 🧪 أيقونة المختبر والعملي
  Lock, // 🔒 أيقونة القفل
  Unlock, // 🔓 أيقونة الفتح
  AlertTriangle, // ⚠️ أيقونة التحذير
  Check, // ✔️ أيقونة الصح
  CheckCircle2, // ✅ أيقونة التحديد
  CheckSquare, // ☑️ أيقونة التحديد المربع
  ChevronDown, // 🔽 أيقونة القائمة المنسدلة
  UserPlus, // 👤 أيقونة تكليف الأستاذ
  Edit3, // ✏️ أيقونة التعديل
  Trash2, // 🗑️ أيقونة الحذف
  Download, // 📥 أيقونة التنزيل
  Upload, // 📤 أيقونة الرفع
  Printer, // 🖨️ أيقونة الطباعة
  FileSpreadsheet, // 📑 أيقونة الإكسل
  FileText, // 📜 أيقونة ملف PDF
  Search, // 🔍 أيقونة البحث
  Sparkles, // ✨ أيقونة مسار بولونيا
  Info, // ℹ️ أيقونة التعليمات
  X, // ❌ أيقونة الإغلاق
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { UserProfile, Course, CourseType, AssessmentScheme } from '@/types'; // 🏷️ استيراد الأنواع الصارمة
import AdminPagination from '@/components/AdminPagination'; // 📄 مكون الترقيم الموحد
import CourseModal from '../modals/CourseModal'; // 🪟 مودال إضافة وتعديل المادة
import QuickAssignModal, { QuickAssignState } from '../modals/QuickAssignModal'; // ⚡ مودال التكليف السريع للأستاذ
import AssessmentSchemeModal from '../modals/AssessmentSchemeModal'; // 🎛️ مودال تخصيص درجات بولونيا الـ 7

// 📋 واجهة خصائص تبويب إدارة المواد والمقررات الدراسية
export interface DepartmentCoursesTabProps {
  deptName: string; // 🏢 اسم القسم
  deptCourses: Course[]; // 📚 مواد القسم
  courses: Course[]; // 📖 كافة المواد
  deptTeachers: UserProfile[]; // 👨‍🏫 أساتذة القسم
  courseSearch: string; // 🔍 نص البحث في المواد
  setCourseSearch: (s: string) => void; // 🔄 تحديث بحث المواد
  filterCourseStage: number | 'all'; // 🎓 تصفية المرحلة
  setFilterCourseStage: (s: number | 'all') => void; // 🔄 تحديث تصفية المرحلة
  filterCourseSemester: number | 'all'; // 🗓️ تصفية الكورس
  setFilterCourseSemester: (sem: number | 'all') => void; // 🔄 تحديث تصفية الكورس
  filterCourseType: 'all' | 'theory_and_practical' | 'theory_only'; // 🔬 تصفية نوع المادة
  setFilterCourseType: (t: 'all' | 'theory_and_practical' | 'theory_only') => void; // 🔄 تحديث تصفية نوع المادة
  selectedCourseIds: string[]; // 🔘 المواد المحددة
  setSelectedCourseIds: React.Dispatch<React.SetStateAction<string[]>>; // 🔄 تحديث المواد المحددة
  coursePage: number; // 🔢 الصفحة الحالية
  setCoursePage: (p: number) => void; // 🔄 تحديث الصفحة
  coursePageSize: number; // 📏 حجم الصفحة
  setCoursePageSize: (s: number) => void; // 🔄 تحديث حجم الصفحة
  isCourseModalOpen: boolean; // 📂 فتح مودال المادة
  setIsCourseModalOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل مودال المادة
  editingCourseId: string | null; // 🆔 معرف المادة الجاري تعديلها
  setEditingCourseId: React.Dispatch<React.SetStateAction<string | null>>; // 🔄 تحديث معرف التعديل
  courseName: string; // 📝 اسم المادة
  setCourseName: (s: string) => void; // 🔄 تحديث اسم المادة
  courseCode: string; // 🔤 كود المادة
  setCourseCode: (s: string) => void; // 🔄 تحديث كود المادة
  courseCredits: number | null; // ⏱️ وحدات المادة
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
  isCourseTheoryDropdownOpen: boolean; // 🔽 فتح قائمة النظري
  setIsCourseTheoryDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل قائمة النظري
  isCoursePracticalDropdownOpen: boolean; // 🔽 فتح قائمة العملي
  setIsCoursePracticalDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل قائمة العملي
  theoryTeacherBtnRef: React.RefObject<HTMLButtonElement | null>; // 🔗 مرجع زر النظري
  practicalTeacherBtnRef: React.RefObject<HTMLButtonElement | null>; // 🔗 مرجع زر العملي
  theoryTeacherCoords: { top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null; // 📐 إحداثيات النظري
  practicalTeacherCoords: { top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null; // 📐 إحداثيات العملي
  handleToggleCourseTheoryDropdown: () => void; // 🔄 فتح/غلق قائمة النظري
  handleToggleCoursePracticalDropdown: () => void; // 🔄 فتح/غلق قائمة العملي
  courseIsSupplementaryEnabled: boolean; // 🔄 الدور الثاني
  setCourseIsSupplementaryEnabled: (en: boolean) => void; // 🔄 تحديث الدور الثاني
  courseIsFinalExamEnabled: boolean; // 🎯 النهائي
  setCourseIsFinalExamEnabled: (en: boolean) => void; // 🔄 تحديث النهائي
  examToggleConfirmation: {
    isOpen: boolean;
    examType: 'final' | 'supplementary';
    targetState: boolean;
    title: string;
    description: string;
  } | null; // 🔐 تأكيد الامتحان
  setExamToggleConfirmation: React.Dispatch<React.SetStateAction<{
    isOpen: boolean;
    examType: 'final' | 'supplementary';
    targetState: boolean;
    title: string;
    description: string;
  } | null>>; // 🔄 تحديث تأكيد الامتحان
  handleConfirmExamToggle: () => void; // ⚡ تأكيد تبديل الامتحان
  quickAssignConfig: QuickAssignState; // ⚙️ حالة التعيين السريع
  setQuickAssignConfig: React.Dispatch<React.SetStateAction<QuickAssignState>>; // 🔄 تحديث التعيين السريع
  handleSaveQuickAssign: (teacherId: string | null) => void; // 💾 حفظ التعيين السريع
  handleOpenQuickAssign: (c: Course, role: 'theory' | 'practical') => void; // ⚡ فتح التعيين السريع
  handleSaveCourse: (e: React.FormEvent) => void; // 💾 حفظ المادة
  handleDeleteCourse: (id: string) => void; // 🗑️ حذف مادة
  handleBulkDeleteCourses: () => void; // 🗑️ حذف جماعي للمواد
  handleExportCoursesExcel: () => void; // 📑 تصدير إكسل
  isExportingCoursesExcel: boolean; // ⏳ حالة تصدير إكسل
  handleExportCoursesPDF: () => void; // 📜 تصدير PDF
  showCourseExcelInstructions: boolean; // ℹ️ تعليمات الاستيراد
  setShowCourseExcelInstructions: (s: boolean) => void; // 🔄 تحديث تعليمات الاستيراد
  isImportingCourseExcel: boolean; // ⏳ حالة استيراد إكسل
  handleCourseExcelUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; // 📤 رفع ملف إكسل
  handleDownloadCourseTemplate: () => void; // 📥 تنزيل قالب إكسل
  handleOpenAssessmentModal: (course: Course) => void; // 🎛️ فتح أوزان بولونيا للمادة الفردية
  handleOpenBatchAssessmentModal: () => void; // 🎛️ فتح أوزان بولونيا وتعميمها على المواد المحددة جماعياً
  isAssessmentModalOpen: boolean; // 📂 حالة فتح نافذة أوزان بولونيا
  setIsAssessmentModalOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل حالة نافذة الأوزان
  selectedCourseForAssessment: Course | null; // 📖 المادة المرجعية لتوزيع الدرجات
  targetCoursesForAssessment: Course[]; // 📚 قائمة المواد المستهدفة بالتوزيع (فردي أو جماعي)
  tempAssessmentScheme: AssessmentScheme | null; // 🎛️ المخطط التقييمي المؤقت الجاري تعديله
  setTempAssessmentScheme: React.Dispatch<React.SetStateAction<AssessmentScheme | null>>; // 🔄 تحديث المخطط المؤقت
  handleSaveAssessmentSchemeModal: () => void; // 💾 حفظ واعتماد مخطط بولونيا سحابياً ومحلياً
  getDefaultAssessmentScheme: (type: 'theory_and_practical' | 'theory_only') => AssessmentScheme; // ⚙️ دالة توليد القالب الافتراضي
  handleBulkToggleFinalExam: (enable: boolean) => void; // 🎯 تبديل جماعي للفاينل
  handleBulkToggleSupplementaryExam: (enable: boolean) => void; // 🔄 تبديل جماعي للدور الثاني
  filteredCourses: Course[]; // 📋 المواد المفلترة
    getStageNameInArabic: (stg: number) => string; // 🏷️ اسم المرحلة بالعربية
  finalOpenCount: number; // 🔢 عدد مواد الفاينل المفتوحة
  isBulkFinalOpen: boolean; // 🔓 حالة فتح الفاينل الشامل
  isBulkFinalPartial: boolean; // ⚖️ حالة الفاينل الجزئي
  isBulkSupOpen: boolean; // 🔓 حالة فتح الدور الثاني الشامل
  isBulkSupPartial: boolean; // ⚖️ حالة الدور الثاني الجزئي
  supOpenCount: number; // 🔢 عدد مواد الدور الثاني المفتوحة
  activeTargetRoundCourses: Course[]; // 📚 المواد المستهدفة للأدوار
  deptSem1CourseIds: string[]; // 📋 معرفات مواد الكورس الأول
  deptSem2CourseIds: string[]; // 📋 معرفات مواد الكورس الثاني
  isExportingCoursesPDF: boolean; // 🖨️ حالة تصدير PDF
  getCourseTheoryTeachers: (course: Course) => Array<{ id: string; name: string }>; // 👨‍🏫 جلب أساتذة النظري
  getCoursePracticalTeachers: (course: Course) => Array<{ id: string; name: string }>; // 🧪 جلب أساتذة العملي
  requestToggleRoundAction: (params: {
    round: 'final' | 'supplementary';
    enable: boolean;
    targetSemester?: 1 | 2 | 'all';
    courseId?: string;
    courseName?: string;
    courseIds?: string[];
  }) => void; // 🛡️ طلب تأكيد فتح/إغلاق الدور الأكاديمي
}

// 🏛️ مكون تبويب إدارة المواد والمقررات الدراسية لقسم الكلية
export const DepartmentCoursesTab: React.FC<DepartmentCoursesTabProps> = ({
  deptName, // 🏢 اسم القسم
  deptCourses, // 📚 مواد القسم
  courses, // 📖 كافة المواد
  deptTeachers, // 👨‍🏫 أساتذة القسم
  courseSearch, // 🔍 نص البحث
  setCourseSearch, // 🔄 تحديث البحث
  filterCourseStage, // 🎓 مرحلة التصفية
  setFilterCourseStage, // 🔄 تحديث المرحلة
  filterCourseSemester, // 🗓️ كورس التصفية
  setFilterCourseSemester, // 🔄 تحديث الكورس
  filterCourseType, // 🔬 نوع المادة
  setFilterCourseType, // 🔄 تحديث النوع
  selectedCourseIds, // 🔘 المواد المحددة
  setSelectedCourseIds, // 🔄 تحديث التحديد
  coursePage, // 🔢 الصفحة الحالية
  setCoursePage, // 🔄 تحديث الصفحة
  coursePageSize, // 📏 حجم الصفحة
  setCoursePageSize, // 🔄 تحديث الحجم
  isCourseModalOpen, // 📂 فتح المودال
  setIsCourseModalOpen, // 🔄 تبديل المودال
  editingCourseId, // 🆔 معرف التعديل
  setEditingCourseId, // 🔄 تحديث المعرف
  courseName, // 📝 اسم المادة
  setCourseName, // 🔄 تحديث الاسم
  courseCode, // 🔤 كود المادة
  setCourseCode, // 🔄 تحديث الكود
  courseCredits, // ⏱️ وحدات المادة
  setCourseCredits, // 🔄 تحديث الوحدات
  courseStage, // 🎓 مرحلة المادة
  setCourseStage, // 🔄 تحديث المرحلة
  courseSemester, // 🗓️ كورس المادة
  setCourseSemester, // 🔄 تحديث الكورس
  courseType, // 🔬 نوع المادة
  setCourseType, // 🔄 تحديث النوع
  courseTheoryTeacherId, // 👨‍🏫 أستاذ النظري
  setCourseTheoryTeacherId, // 🔄 تحديث أستاذ النظري
  coursePracticalTeacherId, // 🧪 أستاذ العملي
  setCoursePracticalTeacherId, // 🔄 تحديث أستاذ العملي
  isCourseTheoryDropdownOpen, // 🔽 قائمة النظري
  setIsCourseTheoryDropdownOpen, // 🔄 تبديل النظري
  isCoursePracticalDropdownOpen, // 🔽 قائمة العملي
  setIsCoursePracticalDropdownOpen, // 🔄 تبديل العملي
  theoryTeacherBtnRef, // 🔗 مرجع زر النظري
  practicalTeacherBtnRef, // 🔗 مرجع زر العملي
  theoryTeacherCoords, // 📐 إحداثيات النظري
  practicalTeacherCoords, // 📐 إحداثيات العملي
  handleToggleCourseTheoryDropdown, // 🔄 فتح النظري
  handleToggleCoursePracticalDropdown, // 🔄 فتح العملي
  courseIsSupplementaryEnabled, // 🔄 الدور الثاني
  setCourseIsSupplementaryEnabled, // 🔄 تحديث الدور الثاني
  courseIsFinalExamEnabled, // 🎯 النهائي
  setCourseIsFinalExamEnabled, // 🔄 تحديث النهائي
  examToggleConfirmation, // 🔐 تأكيد الامتحان
  setExamToggleConfirmation, // 🔄 تحديث تأكيد الامتحان
  handleConfirmExamToggle, // ⚡ تأكيد تبديل الامتحان
  quickAssignConfig, // ⚙️ التعيين السريع
  setQuickAssignConfig, // 🔄 تحديث التعيين
  handleSaveQuickAssign, // 💾 حفظ التعيين
  handleOpenQuickAssign, // ⚡ فتح التعيين
  handleSaveCourse, // 💾 حفظ المادة
  handleDeleteCourse, // 🗑️ حذف المادة
  handleBulkDeleteCourses, // 🗑️ حذف جماعي
  handleExportCoursesExcel, // 📑 تصدير إكسل
  isExportingCoursesExcel, // ⏳ حالة تصدير إكسل
  handleExportCoursesPDF, // 📜 تصدير PDF
  showCourseExcelInstructions, // ℹ️ تعليمات الاستيراد
  setShowCourseExcelInstructions, // 🔄 تحديث التعليمات
  isImportingCourseExcel, // ⏳ حالة الاستيراد
  handleCourseExcelUpload, // 📤 رفع إكسل
  handleDownloadCourseTemplate, // 📥 تنزيل القالب
  handleOpenAssessmentModal, // 🎛️ فتح أوزان بولونيا للمادة الفردية
  handleOpenBatchAssessmentModal, // 🎛️ فتح وتعميم أوزان بولونيا للمواد المحددة جماعياً
  isAssessmentModalOpen, // 📂 حالة فتح نافذة الأوزان
  setIsAssessmentModalOpen, // 🔄 تبديل حالة النافذة
  selectedCourseForAssessment, // 📖 المادة المرجعية للتوزيع
  targetCoursesForAssessment, // 📚 قائمة المواد المستهدفة بالتوزيع
  tempAssessmentScheme, // 🎛️ المخطط المؤقت
  setTempAssessmentScheme, // 🔄 تحديث المخطط المؤقت
  handleSaveAssessmentSchemeModal, // 💾 حفظ واعتماد مخطط الدرجات
  getDefaultAssessmentScheme, // ⚙️ توليد القالب الافتراضي
  handleBulkToggleFinalExam, // 🎯 تبديل جماعي للفاينل
  handleBulkToggleSupplementaryExam, // 🔄 تبديل جماعي للدور الثاني
  filteredCourses, // 📋 المواد المفلترة
    getStageNameInArabic, // 🏷️ اسم المرحلة
  finalOpenCount, // 🔢 عدد مواد الفاينل المفتوحة
  isBulkFinalOpen, // 🔓 حالة فتح الفاينل
  isBulkFinalPartial, // ⚖️ حالة الفاينل الجزئي
  isBulkSupOpen, // 🔓 حالة فتح الدور الثاني
  isBulkSupPartial, // ⚖️ حالة الدور الثاني الجزئي
  supOpenCount, // 🔢 عدد مواد الدور الثاني المفتوحة
  activeTargetRoundCourses, // 📚 المواد المستهدفة للأدوار
  deptSem1CourseIds, // 📋 معرفات الكورس الأول
  deptSem2CourseIds, // 📋 معرفات الكورس الثاني
  isExportingCoursesPDF, // 🖨️ تصدير PDF
  getCourseTheoryTeachers, // 👨‍🏫 أساتذة النظري
  getCoursePracticalTeachers, // 🧪 أساتذة العملي
  requestToggleRoundAction, // 🛡️ طلب تبديل الدور
}) => {
  return (
        <div className="space-y-4">
          
          {/* 📊 شريط إحصائيات المواد الدراسية وشريط الأزرار الأربعة بسطر واحد احترافي */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
            {/* 🏷️ الصف العلوي: العنوان والتوصيف + إحصائيات المواد */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
                  <BookOpen className="w-7 h-7 text-slate-950" />
                  <span>المواد والمقررات الدراسية لقسم {deptName}</span>
                </h3>
                <p className="text-base sm:text-lg font-black text-slate-700 mt-1">
                  إدارة المناهج وتوصيف المقررات (نظري وعملي) وتعيين أساتذة التدريس
                </p>
              </div>

              {/* 🧮 شارات إحصائيات المقررات بتصميم متناسق ومريح للعين سطر بسطر */}
              <div className="flex flex-wrap items-center gap-2.5 text-base font-black"> {/* 📦 حاوية الشارات الثلاثية */}
                {/* 📊 وسم إجمالي عدد المواد في القسم */}
                <span className="bg-[#0F2942]/10 text-[#0F2942] border border-[#0F2942]/20 px-4 py-2 rounded-2xl shadow-2xs">
                  الإجمالي: {deptCourses.length} مادة
                </span>
                {/* 🧪 وسم نظري وعملي بتصميم مطابق وموحد تماماً مع الوسوم المجاورة */}
                <span className="bg-slate-100 text-slate-900 border border-slate-300 px-4 py-2 rounded-2xl shadow-2xs">
                  نظري وعملي: {deptCourses.filter((c) => c.course_type === 'theory_and_practical' || c.has_practical).length}
                </span>
                {/* 📖 وسم نظري فقط بتصميم رمادي فاتح فاخر */}
                <span className="bg-slate-100 text-slate-900 border border-slate-300 px-4 py-2 rounded-2xl shadow-2xs">
                  نظري فقط: {deptCourses.filter((c) => c.course_type === 'theory_only' && !c.has_practical).length}
                </span>
              </div>
            </div>

            {/* 🔘 شريط الأزرار الأربعة بسطر واحد احترافي وموحد 100% */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3 overflow-x-auto flex-nowrap">
              {/* ➕ زر فتح كارت إضافة مادة جديدة */}
              <button
                type="button"
                onClick={() => {
                  setEditingCourseId(null);
                  setCourseName('');
                  setCourseCode('');
                  setCourseCredits(null); // 🔄 تصفير الساعات والوحدات لتكون غير محددة افتراضياً حتى يختار المستخدم
                  setCourseStage(null); // 🔄 تصفير المرحلة الدراسية لتكون غير محددة افتراضياً
                  setCourseSemester(null); // 🔄 تصفير الكورس ليكون غير محدد افتراضياً
                  setCourseType(null); // 🔄 تصفير نوع المادة ليكون غير محدد افتراضياً
                  setCourseTheoryTeacherId('');
                  setCoursePracticalTeacherId('');
                  setCourseIsSupplementaryEnabled(false); // 🔄 تصفير حالة الدور الثاني للوضع الافتراضي
                  setCourseIsFinalExamEnabled(false); // 🎯 تصفير حالة الامتحان النهائي الدور الأول للوضع الافتراضي
                  setIsCourseModalOpen(true);
                }}
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-sm transition flex items-center gap-2 cursor-pointer border border-[#0F2942] shrink-0 active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-5 h-5 text-cyan-300" />
                <span>إضافة مادة دراسية جديدة</span>
              </button>

              {/* 📥 زر تنزيل نموذج Excel لمواد القسم بتصميم كحلي فاخر مطابق لزر إضافة مادة */}
              <button
                type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
                onClick={handleDownloadCourseTemplate} // ⚡ تشغيل دالة تنزيل قالب المواد المعتمد
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0 whitespace-nowrap" // 🎨 تصميم كحلي ملكي موحد
                title="تنزيل نموذج Excel المعتمد لمواد ومقررات القسم" // 💡 نص التلميح
              >
                <Download className="w-5 h-5 text-emerald-300" /> {/* 📥 أيقونة التنزيل باللون الزمردي الزاهي */}
                <span>نموذج Excel</span> {/* 📝 نص الزر */}
              </button>

              {/* ℹ️ زر تعليمات الاستيراد للمواد بتصميم كحلي فاخر مطابق لزر إضافة مادة */}
              <button
                type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
                onClick={() => setShowCourseExcelInstructions(true)} // ⚡ فتح نافذة التعليمات للمواد
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0 whitespace-nowrap" // 🎨 تصميم كحلي ملكي موحد
                title="تعليمات وضوابط استيراد المواد الدراسية" // 💡 نص التلميح
              >
                <Info className="w-5 h-5 text-sky-300" /> {/* ℹ️ أيقونة المعلومات بلون سماوي جميل */}
                <span>التعليمات</span> {/* 📝 نص الزر */}
              </button>

              {/* 📤 زر استيراد ملف Excel للمواد بأيقونة فيروزية أنيقة متناسقة */}
              <label className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-base font-black rounded-2xl transition flex items-center gap-2 cursor-pointer shadow-sm border border-[#0F2942] shrink-0 active:scale-95 whitespace-nowrap">
                <Upload className="w-5 h-5 text-cyan-300" />
                <span>{isImportingCourseExcel ? 'جاري الاستيراد...' : 'استيراد Excel'}</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleCourseExcelUpload}
                  disabled={isImportingCourseExcel}
                  className="hidden"
                />
              </label>

              {/* 🖨️ زر تصدير وطباعة كشف المواد الدراسية PDF الرسمي المعتمد بجانب أزرار Excel */}
              <button
                type="button" // 🔘 نوع الزر لمنع الإرسال التلقائي للنماذج
                onClick={handleExportCoursesPDF} // ⚡ تشغيل دالة تصدير وطباعة PDF للمواد الدراسية
                disabled={isExportingCoursesPDF} // 🛑 تعطيل الزر أثناء التصدير لمنع النقرات المتكررة
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0 whitespace-nowrap disabled:opacity-50" // 🎨 تصميم كحلي ملكي موحد ومتطابق مع أزرار إكسل
                title="طباعة وتصدير كشف المواد والمقررات الدراسية المعتمدة رسمياً بصيغة PDF" // 💡 نص التلميح
              >
                <Printer className="w-5 h-5 text-rose-300" /> {/* 🖨️ أيقونة الطابعة باللون الوردي الناصع لتمييزها بجانب أزرار إكسل */}
                <span>{isExportingCoursesPDF ? 'جاري إعداد PDF...' : selectedCourseIds.length > 0 ? `طباعة المحدد (${selectedCourseIds.length}) PDF` : 'طباعة كشف المواد (PDF)'}</span> {/* 🏷️ نص الزر التفاعلي الذكي */}
              </button>

              {/* 📊 زر تصدير كشف المواد الدراسية إلى Excel مع التدريسيين والوحدات ورموز المواد */}
              <button
                type="button"
                onClick={handleExportCoursesExcel}
                disabled={isExportingCoursesExcel}
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0 whitespace-nowrap disabled:opacity-50"
                title="تصدير كشف المواد والمقررات الدراسية إلى ملف Excel"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
                <span>{isExportingCoursesExcel ? 'جاري التصدير...' : selectedCourseIds.length > 0 ? `تصدير المحدد (${selectedCourseIds.length}) Excel` : 'تصدير المواد (Excel)'}</span>
              </button>

              {/* 🎛️ زر عام لتخصيص وتعميم درجات بولونيا على المواد المحددة من الجدول */}
              <button
                type="button" // 🔘 نوع الزر
                onClick={handleOpenBatchAssessmentModal} // ⚡ تشغيل نافذة التخصيص الجماعي للمواد المحددة
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0 whitespace-nowrap" // 🎨 تصميم كحلي ملكي فاخر
                title="تخصيص توزيع درجات مسار بولونيا الـ 7 للمواد المحددة وتعميمها دفعة واحدة" // 💡 نص التلميح
              >
                <Sliders className="w-5 h-5 text-cyan-300" /> {/* 🎛️ أيقونة أشرطة التوزيع بلون سماوي ناصع */}
                <span>
                  {selectedCourseIds.length > 0
                    ? `تخصيص درجات بولونيا (${selectedCourseIds.length})`
                    : 'تخصيص درجات بولونيا (للمحدد)'}
                </span> {/* 📝 نص الزر الذكي */}
              </button>
            </div>
          </div>

          {/* 📝 كارت CRUD عائم فوق الكل لإضافة / تعديل مادة دراسية بخلفية زجاجية كاملة */}
          {/* 📝 كارت إضافة وتعديل مادة دراسية المستقل */}
          <CourseModal
            isOpen={isCourseModalOpen}
            onClose={() => {
              setIsCourseModalOpen(false);
              setEditingCourseId(null);
              setCourseName('');
              setCourseCode('');
              setCourseCredits(null);
              setCourseStage(null);
              setCourseSemester(null);
              setCourseType(null);
              setCourseTheoryTeacherId('');
              setCoursePracticalTeacherId('');
              setIsCourseTheoryDropdownOpen(false);
              setIsCoursePracticalDropdownOpen(false);
              setCourseIsSupplementaryEnabled(false);
              setCourseIsFinalExamEnabled(false);
            }}
            editingCourseId={editingCourseId}
            courseName={courseName}
            setCourseName={setCourseName}
            courseCode={courseCode}
            setCourseCode={setCourseCode}
            courseCredits={courseCredits}
            setCourseCredits={setCourseCredits}
            courseStage={courseStage}
            setCourseStage={setCourseStage}
            courseSemester={courseSemester}
            setCourseSemester={setCourseSemester}
            courseType={courseType}
            setCourseType={setCourseType}
            courseTheoryTeacherId={courseTheoryTeacherId}
            setCourseTheoryTeacherId={setCourseTheoryTeacherId}
            coursePracticalTeacherId={coursePracticalTeacherId}
            setCoursePracticalTeacherId={setCoursePracticalTeacherId}
            isCourseTheoryDropdownOpen={isCourseTheoryDropdownOpen}
            setIsCourseTheoryDropdownOpen={setIsCourseTheoryDropdownOpen}
            isCoursePracticalDropdownOpen={isCoursePracticalDropdownOpen}
            setIsCoursePracticalDropdownOpen={setIsCoursePracticalDropdownOpen}
            theoryTeacherBtnRef={theoryTeacherBtnRef}
            practicalTeacherBtnRef={practicalTeacherBtnRef}
            theoryTeacherCoords={theoryTeacherCoords}
            practicalTeacherCoords={practicalTeacherCoords}
            handleToggleCourseTheoryDropdown={handleToggleCourseTheoryDropdown}
            handleToggleCoursePracticalDropdown={handleToggleCoursePracticalDropdown}
            courseIsSupplementaryEnabled={courseIsSupplementaryEnabled}
            setCourseIsSupplementaryEnabled={setCourseIsSupplementaryEnabled}
            courseIsFinalExamEnabled={courseIsFinalExamEnabled}
            setCourseIsFinalExamEnabled={setCourseIsFinalExamEnabled}
            setExamToggleConfirmation={setExamToggleConfirmation}
            deptName={deptName}
            handleSaveCourse={handleSaveCourse}
            deptTeachers={deptTeachers}
          />
          {/* ⚡ مودال التعيين والتكليف السريع للأستاذ المستقل */}
          <QuickAssignModal
            quickAssignConfig={quickAssignConfig}
            setQuickAssignConfig={setQuickAssignConfig}
            deptName={deptName}
            handleSaveQuickAssign={handleSaveQuickAssign}
            deptTeachers={deptTeachers}
          />

          {/* 🎛️ نافذة تخصيص وتعميم درجات مسار بولونيا الـ 7 للمقررات الدراسية (فردي أو جماعي) */}
          <AssessmentSchemeModal
            isOpen={isAssessmentModalOpen} // 📂 حالة فتح النافذة
            onClose={() => setIsAssessmentModalOpen(false)} // 🛑 إغلاق النافذة
            course={selectedCourseForAssessment} // 📖 المقرر الدراسي المرجعي
            targetCourses={targetCoursesForAssessment} // 📚 قائمة المواد المستهدفة بالتوزيع
            tempAssessmentScheme={tempAssessmentScheme} // 🎛️ المخطط المؤقت
            setTempAssessmentScheme={setTempAssessmentScheme} // 🔄 دالة تحديث المخطط
            deptName={deptName} // 🏛️ اسم القسم العلمي
            onSave={handleSaveAssessmentSchemeModal} // 💾 حفظ المخطط سحابياً ومحلياً
            getStageNameInArabic={getStageNameInArabic} // 🏷️ اسم المرحلة بالعربي
            getDefaultAssessmentScheme={getDefaultAssessmentScheme} // ⚙️ توليد القالب الافتراضي
          />

          {/* 🔐 نافذة تأكيد تغيير حالة الامتحان (فتح أو إغلاق الدور الأول أو الدور الثاني) */}
          {/* 🔐 نافذة تأكيد تغيير حالة الامتحان الموحدة بنسبة 100% في منتصف الشاشة بدون أي سكرول */}
          {examToggleConfirmation && examToggleConfirmation.isOpen && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150" dir="rtl">
              <div 
                className="bg-white border-2 border-slate-300 rounded-3xl max-w-md w-full shadow-2xl p-5 space-y-3 text-right relative animate-in zoom-in-95 duration-150 my-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* ❌ زر الإغلاق السريع باللون الأسود */}
                <button
                  type="button"
                  onClick={() => setExamToggleConfirmation(null)}
                  className="absolute top-4 left-4 p-2 text-slate-950 hover:text-black hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* 🛡️ شارة وأيقونة رأس المودال المركزية الفاخرة بدون مبالغة بالحجم */}
                <div className="flex flex-col items-center justify-center text-center pt-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm mb-1.5 ${
                    examToggleConfirmation.targetState 
                      ? 'bg-[#0F2942] text-white ring-3 ring-[#0F2942]/15' 
                      : 'bg-slate-800 text-white ring-3 ring-slate-800/15'
                  }`}>
                    {examToggleConfirmation.targetState ? (
                      <Unlock className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Lock className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  <span className="px-3 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1.5 border shadow-2xs bg-slate-100 text-slate-950 border-slate-300">
                    {examToggleConfirmation.targetState ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0F2942]" />
                        <span>طلب فتح وتفعيل رسمي</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-slate-950" />
                        <span>طلب إغلاق وحجب رسمي</span>
                      </>
                    )}
                  </span>

                  <h3 className="text-lg sm:text-xl font-black text-slate-950 mt-1.5">
                    {examToggleConfirmation.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-black text-slate-950 mt-1 leading-relaxed">
                    {examToggleConfirmation.description}
                  </p>
                </div>

                {/* 📋 صندوق تفاصيل العملية ونطاق التأثير بنصوص سوداء وواضحة جداً 100% */}
                <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs sm:text-sm font-black text-slate-950">
                  <div className="flex items-center justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-950 font-black">الدور الأكاديمي:</span>
                    <span className="text-slate-950 font-black">
                      {examToggleConfirmation.examType === 'final' ? 'الامتحان النهائي (الدور الأول)' : 'الدور الثاني (الإكمال)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-950 font-black">الكورس الدراسي:</span>
                    <span className="text-slate-950 font-black">
                      {(courseSemester || 1) === 1 ? 'الكورس الأول' : 'الكورس الثاني'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-950 font-black">المادة الدراسية:</span>
                    <span className="text-slate-950 font-black">
                      {courseName.trim() || 'المادة الدراسية الحالية'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-950 font-black">المرحلة الدراسية:</span>
                    <span className="px-2.5 py-0.5 bg-[#0F2942] text-white rounded-lg font-mono font-bold text-xs shadow-2xs">
                      المرحلة {getStageNameInArabic(courseStage || 1)}
                    </span>
                  </div>
                </div>

                {/* 💡 إشعار وتنبيه توجيهي رسمي بنص أسود صريح ومدمج */}
                <div className="p-2.5 sm:p-3 bg-slate-100/90 border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-950 flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#0F2942] shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    {examToggleConfirmation.targetState ? (
                      <span>
                        فور التأكيد، سيتم تفعيل إمكانية رصد وإدخال درجات هذا الدور من قبل التدريسي المكلف، وستنعكس مباشرة وبشكل حي في بوابات الطلبة.
                      </span>
                    ) : (
                      <span>
                        فور التأكيد، سيتم قفل وتجميد إدخال درجات هذا الدور وحجبها عن بوابات الطلبة، واقتصار العرض على السعي الفصلي التكويني فقط لحين الاعتماد الرسمي.
                      </span>
                    )}
                  </div>
                </div>

                {/* 🔘 أزرار اتخاذ القرار والتنفيذ الموزونة والفاخرة */}
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmExamToggle}
                    className="flex-1 py-2.5 px-4 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {examToggleConfirmation.targetState ? 'نعم، تأكيد الفتح والتفعيل' : 'نعم، تأكيد الإغلاق والحجب'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExamToggleConfirmation(null)}
                    className="py-2.5 px-5 bg-white hover:bg-slate-100 text-slate-950 rounded-xl font-black text-sm transition border border-slate-300 cursor-pointer active:scale-95 shadow-2xs"
                  >
                    تراجع وإلغاء
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* جدول مواد القسم مع تفاصيل النظري والعملي والتحكم الكامل */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            
            {/* 🎛️ شريط التحكم العلوي: فلاتر المراحل والكورسات والأنواع + البحث السريع */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
                    <BookOpen className="w-6 h-6 text-slate-900" />
                    <span>مواد قسم {deptName} المعتمدة ({deptCourses.length})</span>
                  </h3>
                  <p className="text-base sm:text-lg font-black text-slate-700 mt-1">
                    قائمة المقررات الدراسية وتوصيفها الأكاديمي وصلاحيات الرصد المنفصلة للنظري والعملي
                  </p>
                </div>

                {/* 🔍 حقل البحث السريع في المواد */}
                <div className="relative w-full lg:w-72">
                  <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-700" />
                  <input
                    type="text"
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    placeholder="بحث باسم المادة، الرمز، أو الأستاذ..."
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-950 focus:border-slate-900 focus:outline-none shadow-2xs placeholder:text-slate-400 placeholder:font-bold"
                  />
                </div>
              </div>

              {/* 🏷️ شريط الفلاتر والتبويبات المنظم والأنيق بتصميم عصري ومرتب 100% */}
              <div className="space-y-3.5 pt-2"> {/* 📦 الحاوية الرأسية للفلاتر والتبويبات بتصميم فاخر */}
                
                {/* 📌 الصف الأول: تصفية المراحل الدراسية في شريط تبويبات كبسولي احترافي */}
                <div className="flex items-center justify-between flex-wrap gap-2.5"> {/* 🧭 صف تبويبات المراحل */}
                  <div className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-300 gap-1.5 flex-wrap"> {/* 🎨 كبسولة تبويبات المراحل الرصاصية */}
                    <span className="text-sm sm:text-base font-black text-slate-950 px-2.5 flex items-center gap-1.5"> {/* 🏷️ عنوان تصفية المرحلة */}
                      <Layers className="w-4 h-4 text-[#0F2942]" /> {/* 📑 أيقونة الطبقات الكحلية */}
                      <span>المرحلة:</span> {/* 🏷️ نص تسمية المرحلة */}
                    </span>

                    {/* 🔘 تبويب كافة المراحل */}
                    <button
                      type="button" // 🛑 نوع الزر لمنع الإرسال
                      onClick={() => setFilterCourseStage('all')} // ⚡ تصفية كافة المراحل
                      className={`py-2 px-3.5 sm:px-4 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 ${ // 🎨 تنسيقات الزر
                        filterCourseStage === 'all' // 🔍 هل التبويب نشط؟
                          ? 'bg-[#0F2942] text-white shadow-xs border border-[#163a5f]' // 👑 كحلي ملكي راقي للتبويب النشط
                          : 'text-slate-800 hover:bg-white hover:text-slate-950 border border-transparent hover:border-slate-200' // ⚪ تبويب غير نشط
                      }`}
                    >
                      <span>كافة المراحل</span> {/* 🏷️ نص التبويب */}
                      <span className={`px-2 py-0.5 rounded-full text-xs sm:text-sm font-mono font-black ${ // 🔢 بادج العداد
                        filterCourseStage === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800' // 🎨 لون البادج
                      }`}>
                        {deptCourses.length} {/* 🔢 إجمالي المواد بالقسم */}
                      </span>
                    </button>

                    {/* 🔘 أزرار المراحل الأربعة بالقسم */}
                    {[
                      { num: 1, name: 'الأولى' }, // 🥇 المرحلة الأولى
                      { num: 2, name: 'الثانية' }, // 🥈 المرحلة الثانية
                      { num: 3, name: 'الثالثة' }, // 🥉 المرحلة الثالثة
                      { num: 4, name: 'الرابعة' }, // 🎓 المرحلة الرابعة
                    ].map((st) => { // 🔄 تكرار المراحل
                      const count = deptCourses.filter((c) => (Number(c.stage_number) || 1) === st.num).length; // 🧮 حساب عدد مواد كل مرحلة بدقة
                      return (
                        <button
                          key={st.num} // 🔑 المفتاح الفريد
                          type="button" // 🛑 نوع الزر
                          onClick={() => setFilterCourseStage(st.num)} // ⚡ تصفية مواد المرحلة المختارة
                          className={`py-2 px-3.5 sm:px-4 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 ${ // 🎨 التنسيقات
                            filterCourseStage === st.num // 🔍 هل المرحلة مختارة؟
                              ? 'bg-[#0F2942] text-white shadow-xs border border-[#163a5f]' // 👑 كحلي ملكي للمرحلة النشطة
                              : 'text-slate-800 hover:bg-white hover:text-slate-950 border border-transparent hover:border-slate-200' // ⚪ مرحلة غير نشطة
                          }`}
                        >
                          <span>المرحلة {st.name}</span> {/* 🏷️ اسم المرحلة */}
                          <span className={`px-2 py-0.5 rounded-full text-xs sm:text-sm font-mono font-black ${ // 🔢 بادج العداد
                            filterCourseStage === st.num ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800' // 🎨 لون البادج
                          }`}>
                            {count} {/* 🔢 عدد مواد المرحلة */}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 📌 الصف الثاني: تصفية الكورس الدراسي وتصفية نوع المقرر */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200"> {/* 🧭 صف الكورس والنوع */}
                  {/* 1. تصفية الكورس الدراسي */}
                  <div className="flex items-center gap-2 flex-wrap"> {/* 📅 حاوية أزرار الكورسات */}
                    <span className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-1.5 ml-1"> {/* 🏷️ عنوان فلتر الكورس */}
                      <Calendar className="w-4 h-4 text-[#0F2942]" /> {/* 📅 أيقونة التقويم للكورس */}
                      <span>الكورس:</span> {/* 🏷️ النص التوضيحي للكورس */}
                    </span>

                    <button
                      type="button" // 🛑 نوع الزر
                      onClick={() => setFilterCourseSemester('all')} // ⚡ عرض كافة الكورسات
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-95 ${ // 🎨 التنسيقات
                        filterCourseSemester === 'all' // 🔍 هل التبويب نشط؟
                          ? 'bg-[#0F2942] text-white shadow-xs border border-[#163a5f]' // 👑 كحلي ملكي للنشط
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' // ⚪ زر غير نشط
                      }`}
                    >
                      <span>كافة الكورسات</span> {/* 🏷️ النص */}
                      <span className={`px-2 py-0.5 rounded-full text-xs sm:text-sm font-mono font-black ${ // 🔢 بادج العداد
                        filterCourseSemester === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800' // 🎨 لون البادج
                      }`}>
                        {deptCourses.length} {/* 🔢 العدد الكلي */}
                      </span>
                    </button>

                    <button
                      type="button" // 🛑 نوع الزر
                      onClick={() => setFilterCourseSemester(1)} // ⚡ تصفية الكورس الأول
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-95 ${ // 🎨 التنسيقات
                        filterCourseSemester === 1 // 🔍 هل الكورس الأول نشط؟
                          ? 'bg-[#0F2942] text-white shadow-xs border border-[#163a5f]' // 👑 كحلي ملكي للنشط
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' // ⚪ زر غير نشط
                      }`}
                    >
                      <span>الكورس الأول</span> {/* 🏷️ الكورس الأول */}
                      <span className={`px-2 py-0.5 rounded-full text-xs sm:text-sm font-mono font-black ${ // 🔢 بادج العداد
                        filterCourseSemester === 1 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800' // 🎨 لون البادج
                      }`}>
                        {deptCourses.filter((c) => (Number(c.semester) || 1) === 1).length} {/* 🔢 عدد مواد الكورس الأول */}
                      </span>
                    </button>

                    <button
                      type="button" // 🛑 نوع الزر
                      onClick={() => setFilterCourseSemester(2)} // ⚡ تصفية الكورس الثاني
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-95 ${ // 🎨 التنسيقات
                        filterCourseSemester === 2 // 🔍 هل الكورس الثاني نشط؟
                          ? 'bg-[#0F2942] text-white shadow-xs border border-[#163a5f]' // 👑 كحلي ملكي للنشط
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' // ⚪ زر غير نشط
                      }`}
                    >
                      <span>الكورس الثاني</span> {/* 🏷️ الكورس الثاني */}
                      <span className={`px-2 py-0.5 rounded-full text-xs sm:text-sm font-mono font-black ${ // 🔢 بادج العداد
                        filterCourseSemester === 2 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800' // 🎨 لون البادج
                      }`}>
                        {deptCourses.filter((c) => (Number(c.semester) || 1) === 2).length} {/* 🔢 عدد مواد الكورس الثاني */}
                      </span>
                    </button>
                  </div>

                  {/* 2. تصفية نوع المقرر */}
                  <div className="flex items-center gap-2 flex-wrap"> {/* 🧪 حاوية أزرار نوع المقرر */}
                    <span className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-1.5 ml-1"> {/* 🏷️ عنوان الفلتر */}
                      <Sparkles className="w-4 h-4 text-[#0F2942]" /> {/* ✨ أيقونة التمييز للنوع */}
                      <span>النوع:</span> {/* 🏷️ نص تسمية نوع المادة */}
                    </span>
                    <button
                      type="button" // 🛑 نوع الزر
                      onClick={() => setFilterCourseType('all')} // ⚡ عرض كافة الأنواع
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer whitespace-nowrap active:scale-95 ${ // 🎨 التنسيقات
                        filterCourseType === 'all' // 🔍 هل الكل نشط؟
                          ? 'bg-[#0F2942] text-white shadow-xs border border-[#163a5f]' // 👑 كحلي ملكي للنشط
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' // ⚪ زر غير نشط
                      }`}
                    >
                      الكل {/* 🏷️ كافة الأنواع */}
                    </button>
                    <button
                      type="button" // 🛑 نوع الزر
                      onClick={() => setFilterCourseType('theory_and_practical')} // ⚡ تصفية نظري وعملي
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-95 ${ // 🎨 التنسيقات
                        filterCourseType === 'theory_and_practical' // 🔍 هل نظري وعملي نشط؟
                          ? 'bg-[#0F2942] text-white shadow-xs border border-[#163a5f]' // 👑 كحلي ملكي للنشط
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' // ⚪ زر غير نشط
                      }`}
                    >
                      <FlaskConical className="w-4 h-4" /> {/* 🧪 أيقونة المختبر */}
                      <span>نظري وعملي</span> {/* 🏷️ نظري وعملي */}
                    </button>
                    <button
                      type="button" // 🛑 نوع الزر
                      onClick={() => setFilterCourseType('theory_only')} // ⚡ تصفية نظري فقط
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-95 ${ // 🎨 التنسيقات
                        filterCourseType === 'theory_only' // 🔍 هل نظري فقط نشط؟
                          ? 'bg-[#0F2942] text-white shadow-xs border border-[#163a5f]' // 👑 كحلي ملكي للنشط
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' // ⚪ زر غير نشط
                      }`}
                    >
                      <BookOpen className="w-4 h-4" /> {/* 📖 أيقونة الكتاب */}
                      <span>نظري فقط</span> {/* 🏷️ نظري فقط */}
                    </button>
                  </div>
                </div>

                {/* 📌 الصف الثالث: التحكم الجماعي بالدور الأول والدور الثاني للمرحلة والكورس أو المواد المحددة بمقاسات متوسطة وأنيقة */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-slate-200 bg-gradient-to-r from-slate-100/90 via-blue-50/40 to-slate-100/90 p-3 sm:p-3.5 rounded-2xl border shadow-2xs"> {/* 🛡️ حاوية التحكم الجماعي الفاخرة بمقاس متوسط */}
                  
                  {/* 🎯 التحكم الجماعي بالامتحان النهائي (الدور الأول): نصوص متوسطة وشارة حالة وزران شغالين تفاعلياً */}
                  <div className="flex items-center gap-2.5 flex-wrap"> {/* 🎯 مجموعة الدور الأول */}
                    <span className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5"> {/* 🏷️ النص التوضيحي بمقاس متوسط ومريح */}
                      <FileText className="w-4 h-4 text-[#0F2942]" /> {/* 📄 أيقونة الامتحان */}
                      <span>
                        {selectedCourseIds.length > 0 // 🔍 هل اكو مواد محددة بالـ checkbox؟
                          ? `النهائي (الدور الأول) — للمحدد (${selectedCourseIds.length}):` // 🎯 عنوان مخصص للمحدد
                          : filterCourseSemester === 1 // 🔍 هل فلتر الكورس الأول مفعّل؟
                          ? 'النهائي (الدور الأول) — الكورس الأول:' // 🎯 عنوان الكورس الأول
                          : filterCourseSemester === 2 // 🔍 هل فلتر الكورس الثاني مفعّل؟
                          ? 'النهائي (الدور الأول) — الكورس الثاني:' // 🎯 عنوان الكورس الثاني
                          : 'النهائي (الدور الأول):'} {/* 🎯 العنوان العام */}
                      </span>
                    </span>

                    {/* شارة حالة الدور الأول للمواد المستهدفة حالياً بمقاس متوسط رشيق */}
                    {isBulkFinalOpen ? ( // 🔍 هل كافة المواد مفتوحة؟
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-lg text-xs font-black inline-flex items-center gap-1.5 shadow-2xs"> {/* 🟢 شارة النجاح الأخضر */}
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span> {/* 🟢 نقطة نبض خضراء */}
                        <span>مفتوح ومفعّل ({finalOpenCount}/{activeTargetRoundCourses.length})</span> {/* 🏷️ نص الحالة مع العداد الدقيق */}
                      </span>
                    ) : isBulkFinalPartial ? ( // 🔍 هل اكو فتح جزئي لبعض المواد؟
                      <span className="px-2.5 py-0.5 bg-sky-50 text-sky-950 border border-sky-300 rounded-lg text-xs font-black inline-flex items-center gap-1.5 shadow-2xs"> {/* 🩵 شارة الفتح الجزئي النيلية الهادئة */}
                        <span className="w-2 h-2 rounded-full bg-sky-600"></span> {/* 🩵 نقطة نيلية هادئة مريحة للعين */}
                        <span>مفتوح جزئياً ({finalOpenCount}/{activeTargetRoundCourses.length})</span> {/* 🏷️ نص الفتح الجزئي الدقيق */}
                      </span>
                    ) : ( // 🔍 الحالة الافتراضية: مغلق
                      <span className="px-2.5 py-0.5 bg-slate-200/90 text-slate-900 border border-slate-300 rounded-lg text-xs font-black inline-flex items-center gap-1.5 shadow-2xs"> {/* ⚪ شارة القفل الرصاصية */}
                        <Lock className="w-3 h-3 text-slate-700" /> {/* 🔒 قفل رصاصي مصغر */}
                        <span>مغلق (الافتراضي)</span> {/* 🏷️ نص الغلق الافتراضي */}
                      </span>
                    )}

                    {/* كبسولة زري إغلاق وفتح بحجم متوسط متناسق وأداء تفاعلي حقيقي 100% */}
                    <div className="inline-flex items-center bg-white border border-slate-300 rounded-xl p-0.5 shadow-2xs gap-1"> {/* 📦 كبسولة الزرين بمقاس مدمج */}
                      {/* زر إغلاق النهائي للمرحلة */}
                      <button
                        type="button" // 🛑 نوع الزر
                        onClick={() => handleBulkToggleFinalExam(false)} // 🔒 إغلاق النهائي مع استهداف المفتوح فقط
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95 whitespace-nowrap ${ // 🎨 التنسيقات المتوسطة
                          !isBulkFinalOpen && !isBulkFinalPartial // 🔍 إذا مغلق بالكامل
                            ? 'bg-[#0F2942] text-white shadow-xs ring-1 ring-[#0F2942]' // 👑 كحلي ملكي مفعل
                            : 'bg-transparent text-slate-800 hover:bg-slate-100 hover:text-slate-950' // ⚪ شفاف بانتظار الضغط
                        }`}
                        title="إغلاق وحجب الامتحان النهائي للمواد المفتوحة فقط مع طلب تأكيد رسمي" // 💡 تلميح الزر
                      >
                        <Lock className={`w-3.5 h-3.5 ${!isBulkFinalOpen && !isBulkFinalPartial ? 'text-cyan-300' : 'text-slate-600'}`} /> {/* 🔒 أيقونة القفل */}
                        <span>إغلاق</span> {/* 🏷️ نص الإغلاق */}
                      </button>

                      {/* زر فتح النهائي للمرحلة مع تمييز واضح وبارز عند الفتح الجزئي */}
                      <button
                        type="button" // 🛑 نوع الزر
                        onClick={() => handleBulkToggleFinalExam(true)} // 🔓 فتح النهائي مع طلب تأكيد
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95 whitespace-nowrap ${ // 🎨 التنسيقات المتوسطة
                          isBulkFinalOpen // 🔍 إذا مفتوح بالكامل 100%
                            ? 'bg-[#0F2942] text-white shadow-xs ring-1 ring-[#0F2942]' // 👑 تصميم كحلي ملكي مفعل بالكامل
                            : isBulkFinalPartial // 🌟 عند الفتح الجزئي نجعله زراً محدداً ومميزاً بوضوح تام ليعرفه المستخدم
                            ? 'bg-sky-100 text-sky-950 border-2 border-sky-400 font-black shadow-xs ring-1 ring-sky-300' // 🩵 زر محدد بوضوح للفتح الجزئي
                            : 'bg-transparent text-slate-800 hover:bg-slate-100 hover:text-slate-950' // ⚪ تصميم أبيض هادئ بانتظار النقر
                        }`}
                        title="فتح وتفعيل درجات الامتحان النهائي للدور الأول مع طلب تأكيد رسمي" // 💡 تلميح الزر
                      >
                        <Unlock className={`w-3.5 h-3.5 ${isBulkFinalOpen ? 'text-cyan-300' : isBulkFinalPartial ? 'text-sky-700' : 'text-slate-600'}`} /> {/* 🔓 أيقونة الفتح */}
                        <span>فتح</span> {/* 🏷️ نص الفتح */}
                        {isBulkFinalPartial && <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse"></span>} {/* 🩵 نقطة نبض دلالية للفتح الجزئي */}
                      </button>
                    </div>
                  </div>

                  {/* 🔄 التحكم الجماعي بفترة الدور الثاني: نصوص متوسطة وشارة حالة وزران شغالين تفاعلياً */}
                  <div className="flex items-center gap-2.5 flex-wrap"> {/* 🔄 مجموعة الدور الثاني */}
                    <span className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5"> {/* 🏷️ النص التوضيحي بمقاس متوسط */}
                      <Award className="w-4 h-4 text-[#0F2942]" /> {/* 🏆 أيقونة الدور الثاني */}
                      <span>
                        {selectedCourseIds.length > 0 // 🔍 هل اكو مواد محددة بالـ checkbox؟
                          ? `فترة الدور الثاني — للمحدد (${selectedCourseIds.length}):` // 🎯 عنوان مخصص للمحدد
                          : filterCourseSemester === 1 // 🔍 هل فلتر الكورس الأول مفعّل؟
                          ? 'فترة الدور الثاني — الكورس الأول:' // 🎯 عنوان الكورس الأول
                          : filterCourseSemester === 2 // 🔍 هل فلتر الكورس الثاني مفعّل؟
                          ? 'فترة الدور الثاني — الكورس الثاني:' // 🎯 عنوان الكورس الثاني
                          : 'فترة الدور الثاني:'} {/* 🎯 العنوان العام */}
                      </span>
                    </span>

                    {/* شارة حالة الدور الثاني للمواد المستهدفة حالياً بمقاس متوسط */}
                    {isBulkSupOpen ? ( // 🔍 هل كافة المواد مفتوحة بالدور الثاني؟
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-lg text-xs font-black inline-flex items-center gap-1.5 shadow-2xs"> {/* 🟢 شارة النجاح الأخضر */}
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span> {/* 🟢 نقطة نبض خضراء */}
                        <span>مفتوح ومفعّل ({supOpenCount}/{activeTargetRoundCourses.length})</span> {/* 🏷️ نص الحالة مع العداد الدقيق */}
                      </span>
                    ) : isBulkSupPartial ? ( // 🔍 هل اكو فتح جزئي للدور الثاني؟
                      <span className="px-2.5 py-0.5 bg-sky-50 text-sky-950 border border-sky-300 rounded-lg text-xs font-black inline-flex items-center gap-1.5 shadow-2xs"> {/* 🩵 شارة الفتح الجزئي النيلية الهادئة */}
                        <span className="w-2 h-2 rounded-full bg-sky-600"></span> {/* 🩵 نقطة نيلية هادئة مريحة للعين */}
                        <span>مفتوح جزئياً ({supOpenCount}/{activeTargetRoundCourses.length})</span> {/* 🏷️ نص الفتح الجزئي الدقيق */}
                      </span>
                    ) : ( // 🔍 الحالة الافتراضية: مغلق
                      <span className="px-2.5 py-0.5 bg-slate-200/90 text-slate-900 border border-slate-300 rounded-lg text-xs font-black inline-flex items-center gap-1.5 shadow-2xs"> {/* ⚪ شارة القفل الرصاصية */}
                        <Lock className="w-3 h-3 text-slate-700" /> {/* 🔒 قفل رصاصي */}
                        <span>مغلق (الافتراضي)</span> {/* 🏷️ نص الغلق الافتراضي */}
                      </span>
                    )}

                    {/* كبسولة زري إغلاق وفتح بمقاس متوسط متناسق وأداء تفاعلي حقيقي 100% */}
                    <div className="inline-flex items-center bg-white border border-slate-300 rounded-xl p-0.5 shadow-2xs gap-1"> {/* 📦 كبسولة الزرين */}
                      {/* زر إغلاق الدور الثاني للمرحلة */}
                      <button
                        type="button" // 🛑 نوع الزر
                        onClick={() => handleBulkToggleSupplementaryExam(false)} // 🔒 إغلاق الدور الثاني للمفتوح فقط
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95 whitespace-nowrap ${ // 🎨 التنسيقات المتوسطة
                          !isBulkSupOpen && !isBulkSupPartial // 🔍 إذا مغلق حالياً
                            ? 'bg-[#0F2942] text-white shadow-xs ring-1 ring-[#0F2942]' // 👑 تصميم كحلي ملكي مفعّل
                            : 'bg-transparent text-slate-800 hover:bg-slate-100 hover:text-slate-950' // ⚪ تصميم أبيض هادئ بانتظار النقر
                        }`}
                        title="إغلاق رصد الدور الثاني للمواد المفتوحة فقط مع طلب تأكيد رسمي" // 💡 تلميح الزر
                      >
                        <Lock className={`w-3.5 h-3.5 ${!isBulkSupOpen && !isBulkSupPartial ? 'text-cyan-300' : 'text-slate-600'}`} /> {/* 🔒 أيقونة القفل */}
                        <span>إغلاق</span> {/* 🏷️ نص الإغلاق */}
                      </button>

                      {/* زر فتح الدور الثاني للمرحلة مع تمييز واضح للفتح الجزئي */}
                      <button
                        type="button" // 🛑 نوع الزر
                        onClick={() => handleBulkToggleSupplementaryExam(true)} // 🔓 فتح الدور الثاني مع طلب تأكيد
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95 whitespace-nowrap ${ // 🎨 التنسيقات المتوسطة
                          isBulkSupOpen // 🔍 إذا مفتوح بالكامل
                            ? 'bg-[#0F2942] text-white shadow-xs ring-1 ring-[#0F2942]' // 👑 تصميم كحلي ملكي مفعّل
                            : isBulkSupPartial // 🌟 عند الفتح الجزئي نجعله زراً محدداً ومميزاً بوضوح تام ليعرفه المستخدم
                            ? 'bg-sky-100 text-sky-950 border-2 border-sky-400 font-black shadow-xs ring-1 ring-sky-300' // 🩵 زر محدد بوضوح للفتح الجزئي
                            : 'bg-transparent text-slate-800 hover:bg-slate-100 hover:text-slate-950' // ⚪ تصميم أبيض هادئ بانتظار النقر
                        }`}
                        title="فتح وتفعيل فترة رصد درجات الدور الثاني مع طلب تأكيد رسمي" // 💡 تلميح الزر
                      >
                        <Unlock className={`w-3.5 h-3.5 ${isBulkSupOpen ? 'text-cyan-300' : isBulkSupPartial ? 'text-sky-700' : 'text-slate-600'}`} /> {/* 🔓 أيقونة الفتح */}
                        <span>فتح</span> {/* 🏷️ نص الفتح */}
                        {isBulkSupPartial && <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse"></span>} {/* 🩵 نقطة نبض دلالية للفتح الجزئي */}
                      </button>
                    </div>
                  </div>

                </div>

                {/* 📌 الصف الرابع (أسفل): صف التحديد السريع للمواد مع أزرار مصغرة وأنيقة وزر كحلي ملكي لتحديد كل الكورسات */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200"> {/* 🧭 حاوية التحديد السريع في أسفل الكارد */}
                  
                  {/* أزرار التحديد السريع للكورسات بحجم مصغر احترافي */}
                  <div className="flex items-center gap-2 flex-wrap"> {/* 🎯 مجموعة أزرار التحديد السريع */}
                    <span className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1.5 ml-1"> {/* 🏷️ عنوان التحديد السريع */}
                      <CheckSquare className="w-4 h-4 text-[#0F2942]" /> {/* ☑️ أيقونة المربع المحدد */}
                      <span>تحديد سريع:</span> {/* 🏷️ نص التحديد السريع */}
                    </span>

                    {/* زر تحديد كل الكورسات مثل ألوان أزرار الكورسين بحجم مصغر */}
                    <button
                      type="button" // 🛑 نوع الزر
                      onClick={() => { // ⚡ ضغطة تحديد كل الكورسات
                        const allIds = deptCourses.map((c) => c.id); // 📋 معرفات كل مواد الكورسات في القسم
                        const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedCourseIds.includes(id)); // 🔍 هل كل الكورسات محددة حالياً؟
                        if (isAllSelected) { // 🔍 إذا كلهن محددات
                          setSelectedCourseIds([]); // ❌ نلغي التحديد بالكامل
                        } else { // 🔍 إذا مو كلهن محددات
                          setSelectedCourseIds(allIds); // 👑 نحدد كل كورسات ومواد القسم دفعة واحدة
                        } // 🔚 نهاية الشرط
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95 border ${ // 🎨 التنسيقات المصغرة
                        deptCourses.length > 0 && deptCourses.every((c) => selectedCourseIds.includes(c.id)) // 🔍 هل كل الكورسات محددة حالياً؟
                          ? 'bg-[#0F2942] text-white border-[#163a5f] shadow-xs' // 👑 كحلي ملكي للنشط
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border-slate-300' // ⚪ رمادي فاتح لغير النشط مثل باقي الأزرار
                      }`}
                      title="تحديد أو إلغاء تحديد كافة كورسات ومواد القسم" // 💡 تلميح الزر
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${deptCourses.length > 0 && deptCourses.every((c) => selectedCourseIds.includes(c.id)) ? 'text-cyan-300' : 'text-slate-600'}`} /> {/* ✅ أيقونة الصح مطابقة لأزرار الكورسات */}
                      <span>تحديد كل الكورسات</span> {/* 🏷️ تسمية الزر المعتمدة */}
                      <span className={`px-1.5 py-0.5 rounded-md text-xs font-mono font-black ${ // 🔢 بادج العداد
                        deptCourses.length > 0 && deptCourses.every((c) => selectedCourseIds.includes(c.id)) ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800' // 🎨 لون البادج
                      }`}>
                        {deptCourses.length} {/* 🔢 عدد كل المواد بالقسم */}
                      </span>
                    </button>

                    {/* زر التحديد السريع لمواد الكورس الأول بحجم مصغر احترافي وتسمية محدثة */}
                    <button
                      type="button" // 🛑 نوع الزر
                      onClick={() => { // ⚡ ضغطة تحديد مواد الكورس الأول
                        const isAllSem1Selected = deptSem1CourseIds.length > 0 && deptSem1CourseIds.every((id: string) => selectedCourseIds.includes(id)); // 🔍 فحص هل كل مواد الكورس الأول محددة
                        if (isAllSem1Selected) { // 🔍 إذا كلهن محددات
                          setSelectedCourseIds(selectedCourseIds.filter((id) => !deptSem1CourseIds.includes(id))); // ❌ نلغي تحديد مواد الكورس الأول
                        } else { // 🔍 إذا مو كلهن محددات
                          setSelectedCourseIds(Array.from(new Set([...selectedCourseIds, ...deptSem1CourseIds]))); // ✅ نضيف مواد الكورس الأول للتحديد
                        } // 🔚 نهاية الشرط
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95 border ${ // 🎨 التنسيقات المصغرة
                        deptSem1CourseIds.length > 0 && deptSem1CourseIds.every((id: string) => selectedCourseIds.includes(id)) // 🔍 هل مواد الكورس الأول محددة بالكامل؟
                          ? 'bg-[#0F2942] text-white border-[#163a5f] shadow-xs' // 👑 كحلي ملكي للنشط
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border-slate-300' // ⚪ رمادي فاتح لغير النشط
                      }`}
                      title="تحديد أو إلغاء تحديد كافة مواد الكورس الأول للقسم" // 💡 تلميح الزر
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${deptSem1CourseIds.length > 0 && deptSem1CourseIds.every((id: string) => selectedCourseIds.includes(id)) ? 'text-cyan-300' : 'text-slate-600'}`} /> {/* ✅ أيقونة الصح */}
                      <span>تحديد مواد الكورس الأول</span> {/* 🏷️ نص الزر المحدث */}
                      <span className={`px-1.5 py-0.5 rounded-md text-xs font-mono font-black ${ // 🔢 بادج العداد المصغر
                        deptSem1CourseIds.length > 0 && deptSem1CourseIds.every((id: string) => selectedCourseIds.includes(id)) ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800' // 🎨 لون البادج
                      }`}>
                        {deptSem1CourseIds.length} {/* 🔢 عدد مواد الكورس الأول */}
                      </span>
                    </button>

                    {/* زر التحديد السريع لمواد الكورس الثاني بحجم مصغر احترافي وتسمية محدثة */}
                    <button
                      type="button" // 🛑 نوع الزر
                      onClick={() => { // ⚡ ضغطة تحديد مواد الكورس الثاني
                        const isAllSem2Selected = deptSem2CourseIds.length > 0 && deptSem2CourseIds.every((id: string) => selectedCourseIds.includes(id)); // 🔍 فحص هل كل مواد الكورس الثاني محددة
                        if (isAllSem2Selected) { // 🔍 إذا كلهن محددات
                          setSelectedCourseIds(selectedCourseIds.filter((id) => !deptSem2CourseIds.includes(id))); // ❌ نلغي تحديد مواد الكورس الثاني
                        } else { // 🔍 إذا مو كلهن محددات
                          setSelectedCourseIds(Array.from(new Set([...selectedCourseIds, ...deptSem2CourseIds]))); // ✅ نضيف مواد الكورس الثاني للتحديد
                        } // 🔚 نهاية الشرط
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95 border ${ // 🎨 التنسيقات المصغرة
                        deptSem2CourseIds.length > 0 && deptSem2CourseIds.every((id: string) => selectedCourseIds.includes(id)) // 🔍 هل مواد الكورس الثاني محددة بالكامل؟
                          ? 'bg-[#0F2942] text-white border-[#163a5f] shadow-xs' // 👑 كحلي ملكي للنشط
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border-slate-300' // ⚪ رمادي فاتح لغير النشط
                      }`}
                      title="تحديد أو إلغاء تحديد كافة مواد الكورس الثاني للقسم" // 💡 تلميح الزر
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${deptSem2CourseIds.length > 0 && deptSem2CourseIds.every((id: string) => selectedCourseIds.includes(id)) ? 'text-cyan-300' : 'text-slate-600'}`} /> {/* ✅ أيقونة الصح */}
                      <span>تحديد مواد الكورس الثاني</span> {/* 🏷️ نص الزر المحدث */}
                      <span className={`px-1.5 py-0.5 rounded-md text-xs font-mono font-black ${ // 🔢 بادج العداد المصغر
                        deptSem2CourseIds.length > 0 && deptSem2CourseIds.every((id: string) => selectedCourseIds.includes(id)) ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800' // 🎨 لون البادج
                      }`}>
                        {deptSem2CourseIds.length} {/* 🔢 عدد مواد الكورس الثاني */}
                      </span>
                    </button>
                  </div>

                  {/* أزرار الحذف وإلغاء التحديد والطباعة السريعة تظهر بجانب التحديد السريع عند وجود مواد محددة بنفس الحجم المصغر الاحترافي */}
                  {selectedCourseIds.length > 0 && ( // 🔍 تظهر فقط عند وجود مواد محددة
                    <div className="flex items-center gap-2"> {/* 🛡️ حاوية الحذف والإلغاء والطباعة بجانب التحديد السريع */}
                      {/* 🖨️ زر طباعة المواد المحددة بصيغة PDF الفاخرة */}
                      <button
                        type="button" // 🛑 نوع الزر
                        onClick={handleExportCoursesPDF} // ⚡ تشغيل طباعة المواد المحددة
                        disabled={isExportingCoursesPDF} // 🛑 تعطيل الزر أثناء التصدير
                        className="px-3 py-1.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border border-[#163a5f] disabled:opacity-50" // 🎨 تنسيق كحلي ملكي مصغر
                        title="طباعة وتصدير المواد المحددة فقط بصيغة PDF الرسمية" // 💡 تلميح الزر
                      >
                        <Printer className="w-3.5 h-3.5 text-rose-300" /> {/* 🖨️ أيقونة الطابعة */}
                        <span>{isExportingCoursesPDF ? 'جاري التصدير...' : `طباعة PDF (${selectedCourseIds.length})`}</span> {/* 🏷️ نص الزر */}
                      </button>

                      {/* 📊 زر تصدير المواد المحددة إلى Excel */}
                      <button
                        type="button" // 🛑 نوع الزر لمنع أي إرسال غير مقصود
                        onClick={handleExportCoursesExcel} // ⚡ تصدير المواد المحددة لملف Excel
                        disabled={isExportingCoursesExcel} // 🛑 تعطيل الزر أثناء التصدير
                        className="px-3 py-1.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border border-[#163a5f] disabled:opacity-50" // 🎨 تنسيق كحلي ملكي مصغر
                        title="تصدير المواد الدراسية المحددة فقط إلى ملف Excel معتمد" // 💡 تلميح الزر
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" /> {/* 📊 أيقونة الإكسل بلون زمردي */}
                        <span>{isExportingCoursesExcel ? 'جاري التصدير...' : `تصدير Excel (${selectedCourseIds.length})`}</span> {/* 🏷️ نص الزر */}
                      </button>

                      {/* زر حذف المواد المحددة بنفس الحجم */}
                      <button
                        type="button" // 🛑 نوع الزر
                        onClick={handleBulkDeleteCourses} // 🗑️ حذف المواد المحددة
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95" // 🎨 التنسيقات المصغرة الاحترافية
                        title="حذف المواد الدراسية المحددة نهائياً" // 💡 تلميح الزر
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {/* 🗑️ أيقونة سلة المهملات */}
                        <span>حذف ({selectedCourseIds.length})</span> {/* 🏷️ نص الحذف مع العداد */}
                      </button>

                      {/* زر إلغاء التحديد بنفس الحجم */}
                      <button
                        type="button" // 🛑 نوع الزر
                        onClick={() => setSelectedCourseIds([])} // ⚡ تصفير التحديد
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer active:scale-95 shadow-2xs" // 🎨 التنسيقات المصغرة الاحترافية
                        title="إلغاء اختيار المواد المحددة" // 💡 تلميح الزر
                      >
                        إلغاء التحديد ({selectedCourseIds.length}) {/* 🏷️ نص الإلغاء مع العداد */}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-200 text-slate-950 font-black text-base space-y-1">
                <p>لا توجد مواد دراسية مطابقة للبحث أو التصفية في هذا القسم.</p>
                <p className="text-base font-black text-slate-700 font-bold">يمكنك إضافة مادة جديدة أو تغيير معايير التصفية.</p>
              </div>
            ) : (
              <>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-right border-collapse text-sm font-black whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#0F2942] text-white font-black text-sm whitespace-nowrap border-b border-[#0F2942]">
                      <th className="p-3.5 text-center text-sm w-12 whitespace-nowrap text-white">
                        {/* زر تحديد كافة المواد المعروضة في رأس الجدول باللون الأبيض لكي يتميز بوضوح تام */}
                        <button
                          type="button" // 🛑 نوع الزر
                          onClick={() => { // ⚡ تبديل تحديد كافة المواد المعروضة
                            const allVisibleSelected = filteredCourses.length > 0 && filteredCourses.every((c) => selectedCourseIds.includes(c.id)); // 🔍 فحص هل كل المعروض محدد
                            if (allVisibleSelected) { // 🔍 إذا كلهن محددات
                              const visibleIds = new Set(filteredCourses.map((c) => c.id)); // 📋 معرفات المعروض
                              setSelectedCourseIds(selectedCourseIds.filter((id) => !visibleIds.has(id))); // ❌ إلغاء تحديد المعروض
                            } else { // 🔍 إذا مو كلهن محددات
                              const visibleIds = filteredCourses.map((c) => c.id); // 📋 معرفات المعروض
                              setSelectedCourseIds(Array.from(new Set([...selectedCourseIds, ...visibleIds]))); // ✅ إضافة كافة المعروض للتحديد
                            } // 🔚 نهاية الشرط
                          }}
                          className={`w-4.5 h-4.5 mx-auto rounded-md border-2 transition flex items-center justify-center cursor-pointer shadow-xs active:scale-95 ${ // 🎨 التنسيقات البيضاء المميزة
                            filteredCourses.length > 0 && filteredCourses.every((c) => selectedCourseIds.includes(c.id)) // 🔍 هل الكل محدد؟
                              ? 'bg-white text-[#0F2942] border-white shadow-sm ring-2 ring-white/50' // ⚪ مربع أبيض ناصع مع علامة صح كحلية لكي يتميز بوضوح تام
                              : filteredCourses.some((c) => selectedCourseIds.includes(c.id)) // 🔍 هل جزء محدد؟
                              ? 'bg-white/20 text-white border-white' // 🔲 مربع بتحديد جزئي بخط أبيض
                              : 'bg-transparent text-transparent border-white hover:bg-white/20' // 🔲 مربع بحدود بيضاء ناصعة على الخلفية الكحلية
                          }`}
                          title="تحديد الكل" // 💡 تلميح الزر
                          aria-label="تحديد كافة المواد المعروضة" // ♿ دعم إمكانية الوصول
                        >
                          {filteredCourses.length > 0 && filteredCourses.every((c) => selectedCourseIds.includes(c.id)) ? ( // 🔍 فحص اكتمال التحديد
                            <Check className="w-3.5 h-3.5 stroke-[3.5]" /> // ✔️ علامة الصح الكحلية البارزة
                          ) : filteredCourses.some((c) => selectedCourseIds.includes(c.id)) ? ( // 🔍 فحص التحديد الجزئي
                            <span className="w-2 h-0.5 bg-white rounded-full"></span> // ➖ خط التحديد الجزئي الأبيض
                          ) : null}
                        </button>
                      </th>
                      <th className="p-3.5 text-center text-sm w-14 whitespace-nowrap text-white">ت</th>
                      <th className="p-3.5 text-right text-sm whitespace-nowrap text-white">اسم المادة الدراسية</th>
                      <th className="p-3.5 text-right text-sm whitespace-nowrap text-white">رمز المادة</th>
                      <th className="p-3.5 text-right text-sm whitespace-nowrap text-white">المرحلة والكورس</th>
                      <th className="p-3.5 text-right text-sm whitespace-nowrap text-white">نوع المادة والتوصيف</th>
                      <th className="p-3.5 text-right text-sm whitespace-nowrap text-white">أستاذ النظري</th>
                      <th className="p-3.5 text-right text-sm whitespace-nowrap text-white">أستاذ العملي</th>
                      <th className="p-3.5 text-center text-sm whitespace-nowrap text-white">النهائي (الدور الأول)</th>
                      <th className="p-3.5 text-center text-sm whitespace-nowrap text-white">حالة رصد الدور الثاني</th>
                      <th className="p-3.5 text-center text-sm whitespace-nowrap text-white">توزيع درجات بولونيا</th>
                      <th className="p-3.5 text-center text-sm whitespace-nowrap text-white">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-black text-slate-950 text-sm whitespace-nowrap">
                    {(() => {
                      // 🧮 حسابات شريحة الصفحة لجدول المواد الدراسية
                      const totalCoursesCount = filteredCourses.length; // 🔢 إجمالي المواد بعد الفلترة
                      const safeCoursePage = Math.max(1, Math.min(coursePage, Math.max(1, Math.ceil(totalCoursesCount / coursePageSize)))); // 🛡️ حماية رقم الصفحة
                      const courseStartIndex = (safeCoursePage - 1) * coursePageSize; // 📍 بداية شريحة المواد
                      const paginatedCourses = filteredCourses.slice(courseStartIndex, courseStartIndex + coursePageSize); // 📋 مواد الصفحة الحالية

                      return paginatedCourses.map((c, index) => {
                        const actualIndex = courseStartIndex + index; // 🔢 التسلسل العام الحقيقي للمادة
                      const isPractical = c.course_type === 'theory_and_practical' || c.has_practical;
                      const isSelected = selectedCourseIds.includes(c.id);
                      const isSupActive = c.is_supplementary_exam_enabled === true;
                      const isFinalActive = c.is_final_exam_enabled === true; // 🎯 حالة تفعيل الامتحان النهائي الدور الأول
                      
                      return (
                        <tr key={c.id} className={`transition ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'} whitespace-nowrap`}>
                          <td className="p-3 text-center whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedCourseIds(selectedCourseIds.filter((id) => id !== c.id));
                                } else {
                                  setSelectedCourseIds([...selectedCourseIds, c.id]);
                                }
                              }}
                              className="w-4 h-4 rounded text-[#0F2942] focus:ring-[#0F2942] cursor-pointer"
                            />
                          </td>
                          <td className="p-3 text-center font-black text-slate-950 text-sm whitespace-nowrap">
                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-950 font-black text-xs shadow-2xs">
                              {actualIndex + 1}
                            </span>
                          </td>
                          <td className="p-3 font-black text-slate-950 text-base whitespace-nowrap">{c.name}</td>
                          <td className="p-3 font-black text-slate-700 text-sm font-mono whitespace-nowrap">{c.code}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="text-slate-950 font-black text-sm">المرحلة {getStageNameInArabic(c.stage_number || 1)}</span>
                            <span className="text-slate-400 font-bold mx-1">•</span>
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-black border whitespace-nowrap ${ c.semester === 2 ? 'bg-teal-50 text-teal-950 border-teal-300 shadow-2xs' : 'bg-[#0F2942]/10 text-[#0F2942] border-[#0F2942]/20 shadow-2xs' }`}>
                              الكورس {c.semester === 2 ? 'الثاني' : 'الأول'}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {isPractical ? (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-xl text-xs font-black inline-flex items-center gap-1.5 whitespace-nowrap">
                                <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
                                <span>نظري وعملي</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-[#0F2942]/10 text-[#0F2942] border border-[#0F2942]/20 rounded-xl text-xs font-black inline-flex items-center gap-1.5 whitespace-nowrap">
                                <BookOpen className="w-3.5 h-3.5 text-[#0F2942]" />
                                <span>نظري فقط</span>
                              </span>
                            )}
                          </td>
                          {/* 👨‍🏫 عمود أستاذ النظري التفاعلي: يقرأ كافة الأساتذة المكلفين ويدعم التعيين السريع المباشر */}
                          <td className="p-3 whitespace-nowrap">
                            {(() => {
                              const theoryTeachers = getCourseTheoryTeachers(c); // 📋 جلب كافة الأساتذة المكلفين نظري
                              if (theoryTeachers.length > 0) { // ✅ إذا كان هناك أستاذ أو أكثر مكلفين
                                return (
                                  <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                                    {theoryTeachers.map((t: { id: string; name: string }) => (
                                      <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => handleOpenQuickAssign(c, 'theory')}
                                        className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50/90 hover:bg-blue-100 border border-blue-200 text-blue-950 font-black text-xs transition cursor-pointer active:scale-95 shadow-2xs"
                                        title={`انقر لتعديل أو إلغاء تعيين أستاذ النظري لمادة (${c.name})`}
                                      >
                                        <Users className="w-3.5 h-3.5 text-[#0F2942] group-hover:scale-110 transition" />
                                        <span>{t.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                );
                              }
                              return (
                                <button
                                  type="button" // 🛑 نوع الزر بدون إرسال
                                  onClick={() => handleOpenQuickAssign(c, 'theory')} // ⚡ فتح مودال التعيين السريع للنظري
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-dashed border-slate-300 hover:border-slate-400 text-slate-800 font-black text-xs transition cursor-pointer active:scale-95 shadow-2xs" // 🎨 تصميم أنيق بدون برتقالي وبإطار متقطع فخم
                                  title={`انقر لتعيين وتكليف أستاذ النظري لمادة (${c.name}) فورياً`} // 🏷️ تلميح الزر
                                >
                                  <UserPlus className="w-3.5 h-3.5 text-[#0F2942]" /> {/* 👤 أيقونة التعيين بلون كحلي كلاسيكي */}
                                  <span>غير معيّن (تعيين أستاذ)</span> {/* 📝 نص الزر */}
                                </button>
                              );
                            })()}
                          </td>

                          {/* 🧪 عمود أستاذ العملي التفاعلي: يدعم تعدد الأساتذة والتعيين السريع المباشر */}
                          <td className="p-3 whitespace-nowrap">
                            {isPractical ? (
                              (() => {
                                const practicalTeachers = getCoursePracticalTeachers(c); // 📋 جلب كافة أساتذة العملي المكلفين
                                if (practicalTeachers.length > 0) { // ✅ إذا كان هناك أساتذة عملي مكلفين
                                  return (
                                    <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                                      {practicalTeachers.map((t: { id: string; name: string }) => (
                                        <button
                                          key={t.id}
                                          type="button"
                                          onClick={() => handleOpenQuickAssign(c, 'practical')}
                                          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 font-black text-xs transition cursor-pointer active:scale-95 shadow-2xs"
                                          title={`انقر لتعديل أو إلغاء تعيين أستاذ العملي لمادة (${c.name})`}
                                        >
                                          <FlaskConical className="w-3.5 h-3.5 text-emerald-700 group-hover:scale-110 transition" />
                                          <span>{t.name}</span>
                                        </button>
                                      ))}
                                    </div>
                                  );
                                }
                                return (
                                  <button
                                    type="button" // 🛑 نوع الزر بدون إرسال
                                    onClick={() => handleOpenQuickAssign(c, 'practical')} // ⚡ فتح مودال التعيين السريع للعملي
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-dashed border-slate-300 hover:border-slate-400 text-slate-800 font-black text-xs transition cursor-pointer active:scale-95 shadow-2xs" // 🎨 تصميم هادئ ومتناسق بدون ألوان فاقعة
                                    title={`انقر لتعيين وتكليف أستاذ العملي لمادة (${c.name}) فورياً`} // 🏷️ تلميح الزر
                                  >
                                    <UserPlus className="w-3.5 h-3.5 text-[#0F2942]" /> {/* 👤 أيقونة الإضافة بلون كحلي رسمي */}
                                    <span>غير معيّن (تعيين أستاذ)</span> {/* 📝 نص الزر */}
                                  </button>
                                );
                              })()
                            ) : (
                              <span className="text-black font-black text-xs sm:text-sm whitespace-nowrap">— نظري فقط</span>
                            )}
                          </td>

                          {/* 🎯 عمود مفتاح التحكم بالامتحان النهائي الدور الأول - زران: إغلاق وفتح والافتراضي مغلق ويطلب تأكيد */}
                          <td className="p-3 text-center whitespace-nowrap"> {/* 🏷️ خلية الدور الأول بالجدول */}
                            <div className="inline-flex items-center bg-slate-100 border border-slate-300 rounded-xl p-0.5 shadow-2xs gap-1"> {/* 📦 كبسولة الزرين المتناسقة */}
                              {/* زر إغلاق الامتحان النهائي للمادة */}
                              <button
                                type="button" // 🛑 نوع الزر لمنع التقديم
                                onClick={() => { // ⚡ حدث النقر لطلب الإغلاق
                                  if (isFinalActive) { // 🔍 إذا كان مفتوحاً نطلب تأكيد الإغلاق
                                    requestToggleRoundAction({ // 🛡️ فتح نافذة التأكيد الرسمية
                                      round: 'final', // 🎯 استهداف الدور الأول
                                      enable: false, // 🔒 طلب القفل والحجب
                                      courseId: c.id, // 🔑 معرف المادة الحالية
                                      courseName: c.name, // 🏷️ اسم المادة للتوضيح
                                    });
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 active:scale-95 whitespace-nowrap ${ // 🎨 التنسيقات العامة
                                  !isFinalActive // 🔍 فحص هل المادة مغلقة حالياً
                                    ? 'bg-[#0F2942] text-white shadow-xs' // 👑 كحلي ملكي راقي لحالة الإغلاق (الافتراضي)
                                    : 'bg-transparent text-slate-600 hover:bg-white hover:text-slate-950' // ⚪ زر أبيض هادئ عند الفتح
                                }`}
                                title={!isFinalActive ? 'الامتحان النهائي مغلق ومحجوب حالياً (الافتراضي)' : 'انقر لإغلاق وحجب الامتحان النهائي مع طلب تأكيد'} // 💡 تلميح الزر
                              >
                                <Lock className={`w-3.5 h-3.5 ${!isFinalActive ? 'text-cyan-300' : 'text-slate-500'}`} /> {/* 🔒 أيقونة القفل الفيكتور */}
                                <span>إغلاق</span> {/* 🏷️ نص الإغلاق */}
                              </button>

                              {/* زر فتح الامتحان النهائي للمادة */}
                              <button
                                type="button" // 🛑 نوع الزر لمنع التقديم
                                onClick={() => { // ⚡ حدث النقر لطلب الفتح
                                  if (!isFinalActive) { // 🔍 إذا كان مغلقاً نطلب تأكيد الفتح
                                    requestToggleRoundAction({ // 🛡️ فتح نافذة التأكيد الرسمية
                                      round: 'final', // 🎯 استهداف الدور الأول
                                      enable: true, // 🔓 طلب الفتح والتفعيل
                                      courseId: c.id, // 🔑 معرف المادة الحالية
                                      courseName: c.name, // 🏷️ اسم المادة للتوضيح
                                    });
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 active:scale-95 whitespace-nowrap ${ // 🎨 التنسيقات العامة
                                  isFinalActive // 🔍 فحص هل المادة مفتوحة حالياً
                                    ? 'bg-[#0F2942] text-white shadow-xs' // 👑 كحلي ملكي راقي لحالة الفتح
                                    : 'bg-transparent text-slate-600 hover:bg-white hover:text-slate-950' // ⚪ زر أبيض هادئ عند القفل
                                }`}
                                title={isFinalActive ? 'الامتحان النهائي مفتوح ومفعّل حالياً' : 'انقر لفتح وتفعيل الامتحان النهائي مع طلب تأكيد'} // 💡 تلميح الزر
                              >
                                <Unlock className={`w-3.5 h-3.5 ${isFinalActive ? 'text-cyan-300' : 'text-slate-500'}`} /> {/* 🔓 أيقونة الفتح الفيكتور */}
                                <span>فتح</span> {/* 🏷️ نص الفتح */}
                              </button>
                            </div>
                          </td>

                          {/* 🔄 عمود مفتاح التحكم بالدور الثاني للمادة - زران: إغلاق وفتح والافتراضي مغلق ويطلب تأكيد */}
                          <td className="p-3 text-center whitespace-nowrap"> {/* 🏷️ خلية الدور الثاني بالجدول */}
                            <div className="inline-flex items-center bg-slate-100 border border-slate-300 rounded-xl p-0.5 shadow-2xs gap-1"> {/* 📦 كبسولة الزرين المتناسقة */}
                              {/* زر إغلاق الدور الثاني للمادة */}
                              <button
                                type="button" // 🛑 نوع الزر لمنع التقديم
                                onClick={() => { // ⚡ حدث النقر لطلب الإغلاق
                                  if (isSupActive) { // 🔍 إذا كان مفتوحاً نطلب تأكيد الإغلاق
                                    requestToggleRoundAction({ // 🛡️ فتح نافذة التأكيد الرسمية
                                      round: 'supplementary', // 🔄 استهداف الدور الثاني
                                      enable: false, // 🔒 طلب القفل والاعتماد على الدور الأول
                                      courseId: c.id, // 🔑 معرف المادة الحالية
                                      courseName: c.name, // 🏷️ اسم المادة للتوضيح
                                    });
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 active:scale-95 whitespace-nowrap ${ // 🎨 التنسيقات العامة
                                  !isSupActive // 🔍 فحص هل الدور الثاني مغلق حالياً
                                    ? 'bg-[#0F2942] text-white shadow-xs' // 👑 كحلي ملكي راقي لحالة الإغلاق (الافتراضي)
                                    : 'bg-transparent text-slate-600 hover:bg-white hover:text-slate-950' // ⚪ زر أبيض هادئ عند الفتح
                                }`}
                                title={!isSupActive ? 'فترة الدور الثاني مغلقة حالياً (الافتراضي)' : 'انقر لإغلاق الدور الثاني مع طلب تأكيد'} // 💡 تلميح الزر
                              >
                                <Lock className={`w-3.5 h-3.5 ${!isSupActive ? 'text-cyan-300' : 'text-slate-500'}`} /> {/* 🔒 أيقونة القفل الفيكتور */}
                                <span>إغلاق</span> {/* 🏷️ نص الإغلاق */}
                              </button>

                              {/* زر فتح الدور الثاني للمادة */}
                              <button
                                type="button" // 🛑 نوع الزر لمنع التقديم
                                onClick={() => { // ⚡ حدث النقر لطلب الفتح
                                  if (!isSupActive) { // 🔍 إذا كان مغلقاً نطلب تأكيد الفتح
                                    requestToggleRoundAction({ // 🛡️ فتح نافذة التأكيد الرسمية
                                      round: 'supplementary', // 🔄 استهداف الدور الثاني
                                      enable: true, // 🔓 طلب فتح وتفعيل الدور الثاني
                                      courseId: c.id, // 🔑 معرف المادة الحالية
                                      courseName: c.name, // 🏷️ اسم المادة للتوضيح
                                    });
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 active:scale-95 whitespace-nowrap ${ // 🎨 التنسيقات العامة
                                  isSupActive // 🔍 فحص هل الدور الثاني مفتوح حالياً
                                    ? 'bg-[#0F2942] text-white shadow-xs' // 👑 كحلي ملكي راقي لحالة الفتح
                                    : 'bg-transparent text-slate-600 hover:bg-white hover:text-slate-950' // ⚪ زر أبيض هادئ عند القفل
                                }`}
                                title={isSupActive ? 'فترة الدور الثاني مفتوحة ومفعّلة حالياً' : 'انقر لفتح وتفعيل فترة الدور الثاني مع طلب تأكيد'} // 💡 تلميح الزر
                              >
                                <Unlock className={`w-3.5 h-3.5 ${isSupActive ? 'text-cyan-300' : 'text-slate-500'}`} /> {/* 🔓 أيقونة الفتح الفيكتور */}
                                <span>فتح</span> {/* 🏷️ نص الفتح */}
                              </button>
                            </div>
                          </td>

                          <td className="p-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenAssessmentModal(c)}
                              className="px-3 py-1.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-xs font-black transition shadow-2xs inline-flex items-center justify-center gap-1.5 mx-auto cursor-pointer border border-[#0F2942] whitespace-nowrap active:scale-95"
                              title="تخصيص أوزان وعناوين بنود التقييم الـ 7"
                            >
                              <Sliders className="w-3.5 h-3.5 text-cyan-300" />
                              <span>تخصيص الدرجات</span>
                            </button>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                              {/* ✏️ زر تعديل المادة الدراسية باللون الأبيض الفاخر وأيقونة كحلية واضحة */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCourseId(c.id);
                                  setCourseName(c.name);
                                  setCourseCode(c.code);
                                  setCourseCredits(c.credit_hours);
                                  setCourseStage(c.stage_number || 1);
                                  setCourseSemester((c.semester || 1) as 1 | 2);
                                  setCourseType(c.course_type || (c.has_practical ? 'theory_and_practical' : 'theory_only'));
                                  setCourseTheoryTeacherId(c.theory_teacher_id || '');
                                  setCoursePracticalTeacherId(c.practical_teacher_id || '');
                                  setCourseIsSupplementaryEnabled(c.is_supplementary_exam_enabled === true); // 🔄 تحميل حالة الدور الثاني للمادة
                                  setCourseIsFinalExamEnabled(c.is_final_exam_enabled === true); // 🎯 تحميل حالة الامتحان النهائي الدور الأول للمادة
                                  setIsCourseModalOpen(true);
                                }}
                                className="p-2 bg-white hover:bg-slate-100 text-[#0F2942] rounded-xl transition cursor-pointer border border-slate-300 shadow-2xs hover:shadow-md active:scale-95"
                                title="تعديل المادة"
                              >
                                <Edit3 className="w-4 h-4 text-[#0F2942]" />
                              </button>
                              {/* 🗑️ زر حذف المادة الياقوتي البارز والواضح */}
                              <button
                                type="button"
                                onClick={() => handleDeleteCourse(c.id)}
                                className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition cursor-pointer border border-rose-500 shadow-2xs hover:shadow-md active:scale-95"
                                title="حذف المادة"
                              >
                                <Trash2 className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                  </tbody>
                </table>
              </div>

              {/* 📄 شريط نظام الصفحات الموحد والفاخر لجدول المواد والمقررات */}
              <div className="mt-4">
                <AdminPagination
                  currentPage={Math.max(1, Math.min(coursePage, Math.max(1, Math.ceil(filteredCourses.length / coursePageSize))))}
                  totalItems={filteredCourses.length}
                  pageSize={coursePageSize}
                  onPageChange={(page) => setCoursePage(page)}
                  onPageSizeChange={(size) => {
                    setCoursePageSize(size);
                    setCoursePage(1);
                  }}
                  itemLabel="مادة"
                />
              </div>
              </>
            )}
          </div>

        </div>

  );
};

export default DepartmentCoursesTab; // 🚀 تصدير المكون كافتراضي
