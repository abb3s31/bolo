'use client'; // ⚡ واجهة تفاعلية على متصفح العميل في Next.js

import React, { useMemo } from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية مع useMemo
import {
  GraduationCap, // 🎓 أيقونة شؤون الطلاب والشهادات
  Plus, // ➕ أيقونة تسجيل طالب جديد
  Printer, // 🖨️ أيقونة طباعة بطاقات PDF
  Download, // 📥 أيقونة التنزيل وتصدير الإكسل
  Info, // ℹ️ أيقونة التعليمات
  Upload, // 📤 أيقونة استيراد الإكسل
  FileSpreadsheet, // 📊 أيقونة ملف الإكسل
  Search, // 🔍 أيقونة البحث
  Trash2, // 🗑️ أيقونة الحذف
  ArrowUpRight, // ↗️ أيقونة ترحيل النجاح للمرحلة القادمة
  QrCode, // 🪪 أيقونة بطاقة الطالب والـ QR
  Edit3, // ✏️ أيقونة التعديل
  Sun, // ☀️ أيقونة الدراسة الصباحية
  Moon, // 🌙 أيقونة الدراسة المسائية
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { UserProfile, StageGroupConfig } from '@/types'; // 🏷️ استيراد الأنواع الصارمة المحدثة
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧮 التعرف الذكي على الجنس العربي
import AdminPagination from '@/components/AdminPagination'; // 📄 مكون نظام الصفحات الموحد والفاخر
import StudentModal from '../modals/StudentModal'; // 🪟 مودال تسجيل وتعديل الطالب
import BulkPromotionModal from '../modals/BulkPromotionModal'; // 🪟 مودال الترحيل الجماعي للمرحلة
import StageGroupSettingsModal from '../modals/StageGroupSettingsModal'; // 🪟 مودال إدارة وتوزيع كروبات المراحل الأكاديمية
import { GroupSettingsSvg, GroupBadgeSvg, GroupUsersSvg, GeneralCohortSvg } from '@/components/common/GroupSvgIcons'; // 🎨 أيقونات SVG النقية لإدارة الكروبات والشعب
import { getGroupsForStage } from '@/lib/groups-service'; // 🏷️ دوال مساعدة لاستخراج كروبات المرحلة

// 📋 واجهة خصائص تبويب إدارة طلبة القسم
export interface DepartmentStudentsTabProps {
  deptStudents: UserProfile[]; // 👥 كافة طلبة القسم العلمي
  deptName: string; // 🏢 اسم القسم
  academicYear: string; // 🗓️ العام الدراسي الحالي
  filteredStudents: UserProfile[]; // 📋 قائمة الطلبة بعد تطبيق الفلاتر والبحث
  studentSearch: string; // 🔍 نص البحث بالاسم أو البريد
  setStudentSearch: (search: string) => void; // 🔄 دالة تحديث نص البحث
  filterStudentStage: number | 'all'; // 🎓 المرحلة المفلترة
  setFilterStudentStage: (stage: number | 'all') => void; // 🔄 دالة تصفية المرحلة
  filterStudentStudyType: 'all' | 'morning' | 'evening'; // ☀️🌙 نوع الدوام المفلتر
  setFilterStudentStudyType: (type: 'all' | 'morning' | 'evening') => void; // 🔄 دالة تصفية الدوام
  studentGroup: string; // 🏷️ كروب الطالب الحالي قيد التسجيل أو التعديل
  setStudentGroup: React.Dispatch<React.SetStateAction<string>>; // 🔄 دالة تحديث كروب الطالب
  filterStudentGroup: string; // 🏷️ الكروب المفلتر لعرض طلابه فقط
  setFilterStudentGroup: (group: string) => void; // 🔄 دالة تحديث تصفية الكروب
  stageGroupConfigs: StageGroupConfig[]; // 📋 إعدادات كروبات مراحل القسم الأكاديمي
  isStageGroupModalOpen: boolean; // 📂 حالة فتح مودال إعدادات الكروبات
  setIsStageGroupModalOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 فتح/إغلاق مودال الكروبات
  handleSaveStageGroupConfig: (config: StageGroupConfig) => Promise<boolean>; // 💾 حفظ إعدادات كروبات المرحلة
  handleUpdateStudentsGroupBatch: (assignments: Record<string, string>) => void; // 👥 توزيع أو نقل مجموعة طلبة بين الكروبات
  handleBulkAssignGroup: (targetGroup: string) => void; // 🔀 تعيين كروب جماعي للطلبة المحددين
  studentPage: number; // 🔢 الصفحة الحالية
  studentPageSize: number; // 📏 حجم الصفحة
  setStudentPageSize: (size: number) => void; // 🔄 دالة تغيير حجم الصفحة
  setStudentPage: (page: number) => void; // 🔄 دالة تغيير الصفحة
  selectedStudentIds: string[]; // 🔘 معرفات الطلبة المحددين
  setSelectedStudentIds: React.Dispatch<React.SetStateAction<string[]>>; // 🔄 دالة تحديث التحديد
  isStudentModalOpen: boolean; // 📂 حالة فتح مودال الطالب
  setIsStudentModalOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 فتح/إغلاق المودال
  editingStudentId: string | null; // ✍️ معرف الطالب للتعديل
  setEditingStudentId: React.Dispatch<React.SetStateAction<string | null>>; // 🔄 تحديد معرف التعديل
  studentName: string; // 👤 اسم الطالب
  setStudentName: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث الاسم
  studentNameError: string; // ⚠️ خطأ الاسم
  setStudentNameError: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث خطأ الاسم
  studentStage: number | null; // 🎓 المرحلة
  setStudentStage: React.Dispatch<React.SetStateAction<number | null>>; // 🔄 تحديد المرحلة
  isStudentStageDropdownOpen: boolean; // 🔽 دروب داون المرحلة
  setIsStudentStageDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل دروب داون المرحلة
  stageButtonRef: React.RefObject<HTMLButtonElement | null>; // 🔗 مرجع زر المرحلة
  stageDropdownCoords: { top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null; // 📐 إحداثيات الدروب داون
  handleToggleStudentStageDropdown: () => void; // 🔄 فتح/إغلاق دروب داون المرحلة
  studentGender: 'male' | 'female' | null; // 🚻 جنس الطالب
  setStudentGender: React.Dispatch<React.SetStateAction<'male' | 'female' | null>>; // 🔄 تحديد الجنس
  studentStudyType: 'morning' | 'evening' | null; // ☀️🌙 نوع الدوام
  setStudentStudyType: React.Dispatch<React.SetStateAction<'morning' | 'evening' | null>>; // 🔄 تحديد الدوام
  customStudentEmail: string; // ✉️ البريد
  setCustomStudentEmail: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث البريد
  customStudentPassword: string; // 🔑 الرمز
  setCustomStudentPassword: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث الرمز
  showStudentPassword: boolean; // 👁️ إظهار الرمز
  setShowStudentPassword: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل إظهار الرمز
  studentPasswordCriteria: { length: boolean; hasUpper: boolean; hasNumber: boolean; hasSpecial: boolean }; // 🔐 معايير الرمز
  studentPasswordStrengthScore: number; // 📊 قوة الرمز
  profiles: UserProfile[]; // 👥 الحسابات
  isImportingStudentExcel: boolean; // ⏳ استيراد إكسل
  isExportingStudentsExcel: boolean; // ⏳ تصدير إكسل
  handleDownloadStudentTemplate: () => void; // 📥 تنزيل القالب
  setShowStudentExcelInstructions: (show: boolean) => void; // ℹ️ فتح التعليمات
  handleStudentExcelUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; // 📤 رفع الإكسل
  handleExportStudentsExcel: () => void; // 📊 تصدير الطلبة
  handleSaveStudent: (e: React.FormEvent) => void; // 💾 حفظ الطالب
  handleAutoGenerateStudentCredentials: () => void; // ⚡ توليد البيانات
  handleBulkDeleteStudents: () => void; // 🗑️ حذف المحدد
  handleBulkExportStudentsExcel: () => void; // 📥 تصدير المحدد إكسل
  toggleSelectAllStudents: () => void; // 🔘 تحديد الكل
  toggleSelectStudent: (id: string) => void; // 🔘 تحديد طالب
  handlePromoteStudent: (student: UserProfile, e?: React.MouseEvent) => void; // 🚀 ترحيل طالب
  setSingleStudentPrintProfile: (profile: UserProfile | null) => void; // 🖨️ تخصيص طباعة فردية
  setShowStudentPrintModal: (show: boolean) => void; // 🖨️ فتح الطباعة
  setSelectedCardProfile: (profile: UserProfile | null) => void; // 🪪 عرض البطاقة
  handleDeleteStudent: (id: string) => void; // 🗑️ حذف طالب
  isBulkPromotionModalOpen: boolean; // 📂 مودال الترحيل الجماعي
  setIsBulkPromotionModalOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل مودال الترحيل
  bulkPromoteSourceStage: number; // 🎓 مرحلة الترحيل الجماعي
  setBulkPromoteSourceStage: (stage: number) => void; // 🔄 تحديد مرحلة الترحيل
  handleBulkPromoteStage: (stage: number) => void; // ⚡ تنفيذ الترحيل الجماعي
  getStageNameInArabic: (stg: number) => string; // 🏷️ اسم المرحلة بالعربية
}

// 🏛️ مكون تبويب إدارة طلاب القسم الأكاديمي
export const DepartmentStudentsTab: React.FC<DepartmentStudentsTabProps> = ({
  deptStudents, // 👥 طلاب القسم
  deptName, // 🏢 اسم القسم
  academicYear, // 🗓️ العام الدراسي
  filteredStudents, // 📋 الطلاب بعد التصفية
  studentSearch, // 🔍 نص البحث
  setStudentSearch, // 🔄 تحديث البحث
  filterStudentStage, // 🎓 مرحلة التصفية
  setFilterStudentStage, // 🔄 تحديث مرحلة التصفية
  filterStudentStudyType, // ☀️🌙 دوام التصفية
  setFilterStudentStudyType, // 🔄 تحديث دوام التصفية
  studentGroup, // 🏷️ كروب الطالب الحالي
  setStudentGroup, // 🔄 تحديد كروب الطالب
  filterStudentGroup, // 🏷️ فلترة الكروب
  setFilterStudentGroup, // 🔄 تحديث فلترة الكروب
  stageGroupConfigs, // 📋 إعدادات الكروبات للمراحل
  isStageGroupModalOpen, // 📂 حالة فتح نافذة الكروبات
  setIsStageGroupModalOpen, // 🔄 فتح/إغلاق نافذة الكروبات
  handleSaveStageGroupConfig, // 💾 دالة حفظ إعدادات الكروبات
  handleUpdateStudentsGroupBatch, // 👥 التوزيع الجماعي للكروبات
  handleBulkAssignGroup, // 🔀 تعيين كروب جماعي للمحددين
  studentPage, // 🔢 الصفحة الحالية
  setStudentPage, // 🔄 تحديث الصفحة
  studentPageSize, // 📏 حجم الصفحة
  setStudentPageSize, // 🔄 تحديث حجم الصفحة
  selectedStudentIds, // 🔘 المحدد للعمليات الجماعية
  setSelectedStudentIds, // 🔄 تحديث التحديد
  isStudentModalOpen, // 📂 حالة مودال الطالب
  setIsStudentModalOpen, // 🔄 فتح/إغلاق المودال
  editingStudentId, // ✍️ معرف التعديل
  setEditingStudentId, // 🔄 تحديث معرف التعديل
  studentName, // 👤 اسم الطالب
  setStudentName, // 🔄 تحديث الاسم
  studentNameError, // ⚠️ خطأ الاسم
  setStudentNameError, // 🔄 تحديث خطأ الاسم
  studentStage, // 🎓 المرحلة
  setStudentStage, // 🔄 تحديد المرحلة
  isStudentStageDropdownOpen, // 🔽 دروب داون المرحلة
  setIsStudentStageDropdownOpen, // 🔄 تبديل دروب داون المرحلة
  stageButtonRef, // 🔗 مرجع زر المرحلة
  stageDropdownCoords, // 📐 إحداثيات الدروب داون
  handleToggleStudentStageDropdown, // 🔄 فتح/غلق الدروب داون
  studentGender, // 🚻 جنس الطالب
  setStudentGender, // 🔄 تحديد الجنس
  studentStudyType, // ☀️🌙 نوع الدوام
  setStudentStudyType, // 🔄 تحديد نوع الدوام
  customStudentEmail, // ✉️ البريد
  setCustomStudentEmail, // 🔄 تحديث البريد
  customStudentPassword, // 🔑 الرمز
  setCustomStudentPassword, // 🔄 تحديث الرمز
  showStudentPassword, // 👁️ إظهار الرمز
  setShowStudentPassword, // 🔄 تبديل إظهار الرمز
  studentPasswordCriteria, // 🔐 معايير الرمز
  studentPasswordStrengthScore, // 📊 قوة الرمز
  profiles, // 👥 الحسابات
  isImportingStudentExcel, // ⏳ استيراد إكسل
  isExportingStudentsExcel, // ⏳ تصدير إكسل
  handleDownloadStudentTemplate, // 📥 تنزيل القالب
  setShowStudentExcelInstructions, // ℹ️ فتح التعليمات
  handleStudentExcelUpload, // 📤 رفع الإكسل
  handleExportStudentsExcel, // 📊 تصدير الطلبة
  handleSaveStudent, // 💾 حفظ الطالب
  handleAutoGenerateStudentCredentials, // ⚡ توليد البيانات
  handleBulkDeleteStudents, // 🗑️ حذف المحدد
  handleBulkExportStudentsExcel, // 📥 تصدير المحدد
  toggleSelectAllStudents, // 🔘 تحديد الكل
  toggleSelectStudent, // 🔘 تحديد طالب
  handlePromoteStudent, // 🚀 ترحيل طالب
  setSingleStudentPrintProfile, // 🖨️ تخصيص الطباعة الفردية
  setShowStudentPrintModal, // 🖨️ فتح الطباعة
  setSelectedCardProfile, // 🪪 عرض البطاقة
  handleDeleteStudent, // 🗑️ حذف طالب
  isBulkPromotionModalOpen, // 📂 مودال الترحيل الجماعي
  setIsBulkPromotionModalOpen, // 🔄 تبديل مودال الترحيل
  bulkPromoteSourceStage, // 🎓 مرحلة الترحيل
  setBulkPromoteSourceStage, // 🔄 تحديد مرحلة الترحيل
  handleBulkPromoteStage, // ⚡ تنفيذ الترحيل
  getStageNameInArabic, // 🏷️ اسم المرحلة بالعربية
}) => {
  // 🧮 حساب الإحصائيات الديموغرافية والنوعية لطلبة القسم
  const totalDeptStds = deptStudents.length;
  const totalStdMales = deptStudents.filter((s) => (s.gender || detectArabicGender(s.full_name)) === 'male').length;
  const totalStdFemales = totalDeptStds - totalStdMales;
  const totalMorningStds = deptStudents.filter((s) => (s.study_type || 'morning') === 'morning').length;
  const totalEveningStds = deptStudents.filter((s) => s.study_type === 'evening').length;
  const stdMalePct = totalDeptStds > 0 ? Math.round((totalStdMales / totalDeptStds) * 100) : 0;
  const stdFemalePct = totalDeptStds > 0 ? Math.round((totalStdFemales / totalDeptStds) * 100) : 0;

  // 🏷️ استخراج قائمة الكروبات المتاحة للمرحلة والفترة المحددة
  const activeStageGroups = useMemo<string[]>(() => {
    if (filterStudentStage !== 'all') {
      const study = filterStudentStudyType === 'all' ? 'morning' : filterStudentStudyType;
      const groups = getGroupsForStage(stageGroupConfigs, filterStudentStage, study);
      return groups;
    }
    const allGroups = new Set<string>();
    deptStudents.forEach((s) => {
      if (s.student_group) allGroups.add(s.student_group);
    });
    return Array.from(allGroups).sort();
  }, [stageGroupConfigs, filterStudentStage, filterStudentStudyType, deptStudents]);

  // 🧮 استخراج قائمة الطلاب بحسب المرحلة والدوام لتحديث عدادات الكروبات بدقة متطابقة
  const groupContextStudents = useMemo<UserProfile[]>(() => {
    return deptStudents.filter((s) => {
      const matchStage = filterStudentStage === 'all' || (Number(s.stage_number) || 1) === filterStudentStage;
      const matchStudy = filterStudentStudyType === 'all' || (s.study_type || 'morning') === filterStudentStudyType;
      return matchStage && matchStudy;
    });
  }, [deptStudents, filterStudentStage, filterStudentStudyType]);

  return (
    <div className="space-y-4" dir="rtl">
      {/* 📊 شريط إحصائيات طلاب القسم وشريط الأزرار الأربعة بسطر واحد احترافي */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
        {/* 🏷️ الصف العلوي: العنوان والتوصيف + الإحصائيات الديموغرافية والنوعية */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
              <GraduationCap className="w-7 h-7 text-slate-950" />
              <span>إحصائيات طلبة قسم {deptName}</span>
            </h3>
            <p className="text-base sm:text-lg font-black text-slate-700 mt-1">
              توزيع طلبة القسم حسب المراحل الدراسية والنوع والفترة (صباحي / مسائي)
            </p>
          </div>

          {/* 🧮 شارات الإحصائيات الخمسة للطلبة */}
          <div className="flex flex-wrap items-center gap-2 text-base font-black">
            <span className="bg-slate-100 text-slate-950 px-3.5 py-2 rounded-2xl border border-slate-300 shadow-2xs">
              الإجمالي: {totalDeptStds}
            </span>
            <span className="bg-blue-50 text-blue-950 px-3.5 py-2 rounded-2xl border border-blue-300 shadow-2xs flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-[#0F2942]" />
              <span>الصباحي:</span>
              <strong className="font-mono">{totalMorningStds}</strong>
            </span>
            <span className="bg-indigo-50 text-indigo-950 px-3.5 py-2 rounded-2xl border border-indigo-300 shadow-2xs flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-indigo-600" />
              <span>المسائي:</span>
              <strong className="font-mono">{totalEveningStds}</strong>
            </span>
            <span className="bg-blue-100 text-blue-950 px-3.5 py-2 rounded-2xl border border-blue-300 shadow-2xs">
               الذكور: {totalStdMales} ({stdMalePct}%)
            </span>
            <span className="bg-rose-100 text-rose-950 px-3.5 py-2 rounded-2xl border border-rose-300 shadow-2xs">
               الإناث: {totalStdFemales} ({stdFemalePct}%)
            </span>
          </div>
        </div>

        {/* 🔘 شريط الأزرار بسطر واحد احترافي وموحد 100% */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-3 overflow-x-auto flex-nowrap">
          {/* ➕ زر فتح كارت إضافة طالب جديد */}
          <button
            type="button"
            onClick={() => {
              setEditingStudentId(null);
              setStudentName('');
              setCustomStudentEmail('');
              setCustomStudentPassword('');
              setStudentStage(null);
              setStudentGender(null);
              setShowStudentPassword(false);
              setStudentStudyType(null);
              setStudentGroup(''); // 🏷️ تصفير حقل الكروب للطالب الجديد
              setStudentNameError('');
              setIsStudentModalOpen(true);
            }}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-sm transition flex items-center gap-2 cursor-pointer border border-[#163a5f] shrink-0 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5 text-cyan-300" />
            <span>تسجيل طالب جديد</span>
          </button>

          {/* 👥 زر إدارة الكروبات والشعب الأكاديمية لرئيس القسم والمقرر */}
          <button
            type="button"
            onClick={() => setIsStageGroupModalOpen(true)}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#163a5f] shrink-0 whitespace-nowrap"
            title="تحديد عدد الكروبات لكل مرحلة (بدون كروب، A B، A B C، A B C D أو أكثر) مع التوزيع المتوازن"
          >
            <GroupSettingsSvg className="w-5 h-5 text-emerald-300" />
            <span>إدارة الكروبات والشعب</span>
          </button>

          {/* 🖨️ زر طباعة وتصدير بطاقات اعتماد الطلبة بصيغة PDF */}
          <button
            type="button"
            onClick={() => {
              setSingleStudentPrintProfile(null);
              setShowStudentPrintModal(true);
            }}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#163a5f] shrink-0 whitespace-nowrap"
            title="طباعة بطاقات حسابات الطلبة وتصديرها كملف PDF"
          >
            <Printer className="w-5 h-5 text-cyan-300" />
            <span>طباعة البطاقات (PDF)</span>
          </button>

          {/* 📥 زر تنزيل نموذج Excel لطلبة القسم */}
          <button
            type="button"
            onClick={handleDownloadStudentTemplate}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#163a5f] shrink-0 whitespace-nowrap"
            title="تنزيل نموذج Excel المعتمد لطلبة القسم"
          >
            <Download className="w-5 h-5 text-emerald-300" />
            <span>نموذج Excel</span>
          </button>

          {/* ℹ️ زر تعليمات استيراد الطلبة */}
          <button
            type="button"
            onClick={() => setShowStudentExcelInstructions(true)}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#163a5f] shrink-0 whitespace-nowrap"
            title="تعليمات وضوابط استيراد الطلبة"
          >
            <Info className="w-5 h-5 text-sky-300" />
            <span>التعليمات</span>
          </button>

          {/* 📤 زر استيراد ملف Excel للطلبة */}
          <label className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-base font-black rounded-2xl transition flex items-center gap-2 cursor-pointer shadow-sm border border-[#163a5f] shrink-0 active:scale-95 whitespace-nowrap">
            <Upload className="w-5 h-5 text-cyan-300" />
            <span>{isImportingStudentExcel ? 'جاري الاستيراد...' : 'استيراد Excel'}</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleStudentExcelUpload}
              disabled={isImportingStudentExcel}
              className="hidden"
            />
          </label>

          {/* 📊 زر تصدير بيانات الطلبة إلى Excel */}
          <button
            type="button"
            onClick={handleExportStudentsExcel}
            disabled={isExportingStudentsExcel}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#163a5f] shrink-0 whitespace-nowrap disabled:opacity-50"
            title="تصدير قائمة الطلاب إلى ملف Excel مع البريد الأكاديمي والرمز السري"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            <span>{isExportingStudentsExcel ? 'جاري التصدير...' : selectedStudentIds.length > 0 ? `تصدير المحدد (${selectedStudentIds.length}) Excel` : 'تصدير الطلاب (Excel)'}</span>
          </button>
        </div>
      </div>

      {/* 🪟 كارت CRUD عائم فوق الكل لإضافة / تعديل طالب */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setIsStudentStageDropdownOpen(false);
          setEditingStudentId(null);
          setStudentName('');
          setCustomStudentEmail('');
          setCustomStudentPassword('');
          setStudentStage(null);
          setStudentGender(null);
          setStudentStudyType(null);
          setStudentGroup(''); // 🏷️ تصفير الكروب
          setStudentNameError('');
        }}
        editingStudentId={editingStudentId}
        deptName={deptName}
        studentName={studentName}
        setStudentName={setStudentName}
        studentNameError={studentNameError}
        setStudentNameError={setStudentNameError}
        studentStage={studentStage}
        setStudentStage={setStudentStage}
        isStudentStageDropdownOpen={isStudentStageDropdownOpen}
        setIsStudentStageDropdownOpen={setIsStudentStageDropdownOpen}
        stageButtonRef={stageButtonRef}
        stageDropdownCoords={stageDropdownCoords}
        handleToggleStudentStageDropdown={handleToggleStudentStageDropdown}
        studentGender={studentGender}
        setStudentGender={setStudentGender}
        studentStudyType={studentStudyType}
        setStudentStudyType={setStudentStudyType}
        studentGroup={studentGroup}
        setStudentGroup={setStudentGroup}
        stageGroupConfigs={stageGroupConfigs}
        customStudentEmail={customStudentEmail}
        setCustomStudentEmail={setCustomStudentEmail}
        customStudentPassword={customStudentPassword}
        setCustomStudentPassword={setCustomStudentPassword}
        showStudentPassword={showStudentPassword}
        setShowStudentPassword={setShowStudentPassword}
        studentPasswordCriteria={studentPasswordCriteria}
        studentPasswordStrengthScore={studentPasswordStrengthScore}
        profiles={profiles}
        onSave={handleSaveStudent}
        onAutoGenerateCredentials={handleAutoGenerateStudentCredentials}
        getStageNameInArabic={getStageNameInArabic}
      />

      {/* 📋 جدول طلاب القسم مع نظام الترحيل الأكاديمي */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        
        {/* 🎛️ شريط التحكم العلوي: فلاتر المراحل + زر الترحيل الجماعي + البحث */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
              <GraduationCap className="w-6 h-6 text-slate-900" />
              <span>طلاب قسم {deptName} ({deptStudents.length})</span>
            </h3>
            <p className="text-base sm:text-lg font-black text-slate-700 mt-1">
              إدارة السجلات الأكاديمية وترحيل الطلاب الناجحين بين المراحل الدراسية الـ 4
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* 🚀 زر الترحيل الجماعي للمرحلة */}
            <button
              type="button"
              onClick={() => {
                const activeStageWithStudents = [1, 2, 3, 4].find((st) => deptStudents.some((s) => (Number(s.stage_number) || 1) === st && !s.is_graduated));
                if (activeStageWithStudents) {
                  setBulkPromoteSourceStage(activeStageWithStudents);
                }
                setIsBulkPromotionModalOpen(true);
              }}
              className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-base font-black shadow-xs transition flex items-center gap-2 cursor-pointer border border-[#163a5f] active:scale-95"
              title="ترحيل طلاب مرحلة دراسية كاملة إلى المرحلة التالية"
            >
              <ArrowUpRight className="w-5 h-5 text-cyan-300" />
              <span>ترحيل مرحلة دراسية (جماعي)</span>
            </button>

            {/* 🔍 حقل البحث السريع بالاسم أو البريد */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-700" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="بحث بالاسم أو البريد الأكاديمي..."
                className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-950 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 🏷️ تبويبات تصفية المراحل الدراسية والفترة الدراسية */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex-1 flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-300 gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setFilterStudentStage('all');
                setFilterStudentGroup('all');
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${ filterStudentStage === 'all' ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-700 hover:bg-white' }`}
            >
              <span>كافة المراحل</span>
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                filterStudentStage === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
              }`}>
                {deptStudents.length}
              </span>
            </button>

            {[
              { num: 1, name: 'الأولى' },
              { num: 2, name: 'الثانية' },
              { num: 3, name: 'الثالثة' },
              { num: 4, name: 'الرابعة' },
            ].map((st) => {
              const count = deptStudents.filter((s) => (s.stage_number || 1) === st.num).length;
              return (
                <button
                  key={st.num}
                  type="button"
                  onClick={() => {
                    setFilterStudentStage(st.num);
                    setFilterStudentGroup('all');
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${ filterStudentStage === st.num ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-700 hover:bg-white' }`}
                >
                  <span>المرحلة {st.name}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                    filterStudentStage === st.num ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* تصفية الفترة الصباحي / المسائي */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-black text-slate-950 ml-1">الفترة:</span>
            <button
              type="button"
              onClick={() => {
                setFilterStudentStudyType('all');
                setFilterStudentGroup('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-sm sm:text-base font-black transition cursor-pointer ${ filterStudentStudyType === 'all' ? 'bg-[#0F2942] text-white shadow-2xs' : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterStudentStudyType('morning');
                setFilterStudentGroup('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-1.5 ${ filterStudentStudyType === 'morning' ? 'bg-[#0F2942] text-white shadow-2xs border border-[#163a5f]' : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' }`}
            >
              <Sun className="w-4 h-4" />
              <span>الصباحي ({totalMorningStds})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterStudentStudyType('evening');
                setFilterStudentGroup('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-1.5 ${ filterStudentStudyType === 'evening' ? 'bg-[#0F2942] text-white shadow-2xs border border-[#163a5f]' : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' }`}
            >
              <Moon className="w-4 h-4" />
              <span>المسائي ({totalEveningStds})</span>
            </button>
          </div>
        </div>

        {/* 🏷️ شريط تبويبات تصفية الكروبات والشعب الأكاديمية */}
        {/* 🏷️ شريط تبويبات تصفية الكروبات والشعب الأكاديمية بتصميم كبسولات عصري فاخر */}
        {activeStageGroups.length > 0 && (
          <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/90 flex flex-wrap items-center gap-1.5 shadow-2xs">
            {/* 🏷️ شارة تصنيف الكروب */}
            <span className="text-xs sm:text-sm font-black text-slate-700 bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200/60 flex items-center gap-1.5 shadow-2xs select-none">
              <GroupBadgeSvg className="w-4 h-4 text-[#0F2942]" />
              <span>الكروب:</span>
            </span>

            {/* 🌐 تبويب كافة الكروبات */}
            <button
              type="button"
              onClick={() => setFilterStudentGroup('all')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-black transition cursor-pointer flex items-center gap-2 select-none active:scale-95 whitespace-nowrap ${
                filterStudentGroup === 'all'
                  ? 'bg-[#0F2942] text-white shadow-xs border border-[#0F2942]'
                  : 'bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-950 border border-slate-200/90 shadow-2xs'
              }`}
            >
              <GroupUsersSvg className={`w-4 h-4 ${filterStudentGroup === 'all' ? 'text-cyan-300' : 'text-slate-600'}`} />
              <span>كافة الكروبات</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                filterStudentGroup === 'all' ? 'bg-white/20 text-white border-white/30' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {groupContextStudents.length}
              </span>
            </button>

            {/* 🏛️ تبويب عامة (بدون كروب) */}
            <button
              type="button"
              onClick={() => setFilterStudentGroup('none')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-black transition cursor-pointer flex items-center gap-2 select-none active:scale-95 whitespace-nowrap ${
                filterStudentGroup === 'none'
                  ? 'bg-[#0F2942] text-white shadow-xs border border-[#0F2942]'
                  : 'bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-950 border border-slate-200/90 shadow-2xs'
              }`}
            >
              <GeneralCohortSvg className={`w-4 h-4 ${filterStudentGroup === 'none' ? 'text-emerald-300' : 'text-slate-600'}`} />
              <span>عامة (بدون كروب)</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                filterStudentGroup === 'none' ? 'bg-white/20 text-white border-white/30' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {groupContextStudents.filter((s) => !s.student_group).length}
              </span>
            </button>

            {/* 🔠 تبويبات الكروبات الفردية المعتمدة (مثل كروب C، كروب A...) */}
            {activeStageGroups.map((grp) => {
              const grpCount = groupContextStudents.filter((s) => s.student_group === grp).length;
              const isSelected = filterStudentGroup === grp;
              return (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setFilterStudentGroup(grp)}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-black transition cursor-pointer flex items-center gap-2 select-none active:scale-95 whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#0F2942] text-white shadow-xs border border-[#0F2942]'
                      : 'bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-950 border border-slate-200/90 shadow-2xs'
                  }`}
                >
                  <GroupBadgeSvg className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-300' : 'text-slate-600'}`} />
                  <span>كروب {grp}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                    isSelected ? 'bg-white/20 text-white border-white/30' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {grpCount}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 🎛️ شريط الإجراءات الجماعية الفاخر عند تحديد الطلاب */}
        {selectedStudentIds.length > 0 && (
          <div className="bg-[#0F2942] text-white p-4 sm:px-6 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-[#0F2942] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-base text-white">
                  تم تحديد <strong className="text-emerald-300 font-mono text-lg font-black">({selectedStudentIds.length})</strong> من أصل <span className="font-mono text-slate-300">({filteredStudents.length})</span> طالب
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* 🏷️ أزرار تعيين الكروب السريع للمحددين */}
              {activeStageGroups.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700">
                  <span className="text-xs font-black text-cyan-300 px-1">تعيين كروب:</span>
                  {activeStageGroups.map((grp) => (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => handleBulkAssignGroup(grp)}
                      className="px-2.5 py-1 bg-[#163a5f] hover:bg-cyan-700 text-white rounded-lg text-xs font-black transition cursor-pointer shadow-2xs active:scale-95"
                      title={`نقل الطلاب المحددين إلى كروب ${grp}`}
                    >
                      كروب {grp}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleBulkAssignGroup('')}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-black transition cursor-pointer"
                    title="إلغاء الكروب وجعلهم في الشعبة العامة"
                  >
                    عامة
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleBulkDeleteStudents}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف المحدد ({selectedStudentIds.length})</span>
              </button>

              <button
                type="button"
                onClick={handleBulkExportStudentsExcel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>تصدير المحدد Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStudentIds([])}
                className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-black text-sm transition cursor-pointer"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        )}

        {/* 📋 جدول بيانات الطلاب مع عمود الترحيل الأكاديمي الفوري */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-200 text-slate-950 font-black text-base space-y-1">
            <p>لا يوجد طلاب مطابقين للتصفية في هذا القسم.</p>
            <p className="text-base font-black text-slate-700 font-bold">يمكنك تسجيل طلاب جدد أو اختيار مرحلة دراسية أخرى.</p>
          </div>
        ) : (
          <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-right border-collapse text-base font-black whitespace-nowrap">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-950 font-black text-base whitespace-nowrap">
                  <th className="p-4 text-center text-base w-12 whitespace-nowrap">
                    <input
                      type="checkbox"
                      aria-label="تحديد جميع الطلاب المعروضين"
                      checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                      onChange={toggleSelectAllStudents}
                      className="w-5 h-5 rounded-md border-2 border-slate-400 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                    />
                  </th>
                  <th className="p-4 text-center text-base w-14 whitespace-nowrap">ت</th>
                  <th className="p-4 text-base whitespace-nowrap">اسم الطالب الثلاثي</th>
                  <th className="p-4 text-base whitespace-nowrap">الجنس</th>
                  <th className="p-4 text-base whitespace-nowrap">الفترة</th>
                  <th className="p-4 text-base whitespace-nowrap">المرحلة الدراسية</th>
                  <th className="p-4 text-center text-base whitespace-nowrap">الكروب / الشعبة</th>
                  <th className="p-4 text-base whitespace-nowrap">البريد الأكاديمي</th>
                  <th className="p-4 text-center text-base whitespace-nowrap">ترحيل النجاح</th>
                  <th className="p-4 text-center text-base whitespace-nowrap">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-black text-slate-950 text-base">
                {(() => {
                  // 🧮 حسابات شريحة الصفحة لجدول طلبة القسم
                  const totalStudentsCount = filteredStudents.length;
                  const safeStudentPage = Math.max(1, Math.min(studentPage, Math.max(1, Math.ceil(totalStudentsCount / studentPageSize))));
                  const studentStartIndex = (safeStudentPage - 1) * studentPageSize;
                  const paginatedStudents = filteredStudents.slice(studentStartIndex, studentStartIndex + studentPageSize);

                  return paginatedStudents.map((s, index) => {
                    const actualIndex = studentStartIndex + index;
                    const curStage = s.stage_number || 1;
                    const stdGender = s.gender || detectArabicGender(s.full_name);
                    const isSelected = selectedStudentIds.includes(s.id);

                    return (
                      <tr key={s.id} className={`transition whitespace-nowrap ${isSelected ? 'bg-blue-50/70 font-black' : 'hover:bg-slate-50'}`}>
                        {/* 🔘 مربع التحديد الفردي */}
                        <td className="p-4 text-center whitespace-nowrap w-12" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`تحديد ${s.full_name}`}
                            checked={isSelected}
                            onChange={() => toggleSelectStudent(s.id)}
                            className="w-5 h-5 rounded-md border-2 border-slate-400 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                          />
                        </td>

                        {/* 🔢 تسلسل الطالب */}
                        <td className="p-4 text-center font-black text-slate-950 text-base whitespace-nowrap">
                          <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-300 text-slate-950 font-black text-base shadow-2xs">
                            {actualIndex + 1}
                          </span>
                        </td>

                        {/* 👤 اسم الطالب الثلاثي */}
                        <td className="p-4 font-black text-slate-950 text-lg whitespace-nowrap">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            {s.is_graduated && <GraduationCap className="w-5 h-5 text-emerald-600 inline shrink-0" />}
                            <span className="whitespace-nowrap">{s.full_name}</span>
                          </div>
                        </td>

                        {/* 🚻 جنس الطالب */}
                        <td className="p-4 whitespace-nowrap">
                          <span className={`inline-flex items-center whitespace-nowrap px-3 py-1 rounded-xl text-base font-black border ${ stdGender === 'female' ? 'bg-rose-100 text-rose-950 border-rose-300' : 'bg-blue-100 text-blue-950 border-blue-300' }`}>
                            {stdGender === 'female' ? 'أنثى' : 'ذكر'}
                          </span>
                        </td>

                        {/* ☀️🌙 الفترة الدراسية */}
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-xl text-base font-black border inline-flex items-center gap-1.5 whitespace-nowrap w-fit ${
                            (s.study_type || 'morning') === 'evening'
                              ? 'bg-indigo-50 text-indigo-950 border-indigo-200'
                              : 'bg-emerald-50 text-emerald-950 border-emerald-200'
                          }`}>
                            {(s.study_type || 'morning') === 'evening' ? (
                              <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
                            ) : (
                              <Sun className="w-4 h-4 text-emerald-700 shrink-0" />
                            )}
                            <span className="whitespace-nowrap">{(s.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'}</span>
                          </span>
                        </td>

                        {/* 📚 المرحلة الدراسية */}
                        <td className="p-4 whitespace-nowrap">
                          <span className={`inline-flex items-center whitespace-nowrap px-3 py-1 rounded-xl text-base font-black border ${ curStage === 1 ? 'bg-sky-50 text-sky-950 border-sky-200' : curStage === 2 ? 'bg-blue-50 text-blue-950 border-blue-200' : curStage === 3 ? 'bg-indigo-50 text-indigo-950 border-indigo-200' : 'bg-emerald-50 text-emerald-950 border-emerald-300' }`}>
                            المرحلة {getStageNameInArabic(curStage)} {curStage === 4 ? '(النهائية)' : ''}
                          </span>
                        </td>

                        {/* 🏷️ الكروب أو الشعبة */}
                        <td className="p-4 text-center whitespace-nowrap">
                          {s.student_group ? (
                            <span className="inline-flex items-center whitespace-nowrap gap-1.5 px-3 py-1 rounded-xl text-sm font-black bg-cyan-50 text-[#0F2942] border border-cyan-300 shadow-2xs">
                              <GroupBadgeSvg className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                              <span>كروب {s.student_group}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center whitespace-nowrap gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
                              <span>عامة / موحدة</span>
                            </span>
                          )}
                        </td>

                        {/* ✉️ البريد الأكاديمي */}
                        <td className="p-4 text-slate-950 text-base font-black select-all whitespace-nowrap" dir="ltr">
                          {s.generated_email}
                        </td>
                        
                        {/* 🚀 زر الترحيل الأكاديمي الفردي */}
                        <td className="p-4 text-center whitespace-nowrap">
                          {curStage < 4 ? (
                            <button
                              type="button"
                              onClick={(e) => handlePromoteStudent(s, e)}
                              className="px-3.5 py-2 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-base font-black transition shadow-2xs inline-flex items-center justify-center gap-1.5 mx-auto cursor-pointer border border-[#163a5f] active:scale-95 whitespace-nowrap flex-nowrap"
                              title={`ترحيل الطالب إلى المرحلة ${getStageNameInArabic(curStage + 1)}`}
                            >
                              <ArrowUpRight className="w-4 h-4 text-cyan-300 shrink-0" />
                              <span className="whitespace-nowrap">ترحيل للمرحلة {getStageNameInArabic(curStage + 1)}</span>
                            </button>
                          ) : s.is_graduated ? (
                            <span
                              className="px-3.5 py-2 rounded-xl text-base font-black inline-flex items-center justify-center gap-1.5 mx-auto bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs select-none whitespace-nowrap flex-nowrap"
                              title="تم تثبيت واعتماد تخرج الطالب رسمياً"
                            >
                              <GraduationCap className="w-5 h-5 text-[#0F2942] shrink-0" />
                              <span className="whitespace-nowrap">خريج معتمد</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handlePromoteStudent(s, e)}
                              className="px-3.5 py-2 rounded-xl text-base font-black transition inline-flex items-center justify-center gap-1.5 mx-auto cursor-pointer bg-[#0F2942] hover:bg-[#163a5f] text-white border border-[#163a5f] shadow-2xs active:scale-95 whitespace-nowrap flex-nowrap"
                              title="اعتماد وتثبيت تخرج الطالب"
                            >
                              <GraduationCap className="w-5 h-5 text-white shrink-0" />
                              <span className="whitespace-nowrap">تثبيت التخرج</span>
                            </button>
                          )}
                        </td>

                        {/* 🛠️ الإجراءات الأساسية */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2 whitespace-nowrap flex-nowrap">
                            {/* 🖨️ زر طباعة بطاقة الطالب الفردية كـ PDF */}
                            <button
                              type="button"
                              onClick={() => {
                                setSingleStudentPrintProfile(s);
                                setShowStudentPrintModal(true);
                              }}
                              className="p-2.5 bg-white hover:bg-slate-100 text-[#0F2942] rounded-xl transition cursor-pointer border border-slate-300 shadow-2xs hover:shadow-md active:scale-95"
                              title="طباعة بطاقة حساب الطالب (PDF)"
                            >
                              <Printer className="w-5 h-5 text-[#0F2942]" />
                            </button>

                            {/* 🪪 زر بطاقة الطالب ورمز QR */}
                            <button
                              type="button"
                              onClick={() => setSelectedCardProfile(s)}
                              className="p-2.5 bg-white hover:bg-slate-100 text-[#0F2942] rounded-xl transition cursor-pointer border border-slate-300 shadow-2xs hover:shadow-md active:scale-95"
                              title="عرض بطاقة الطالب"
                            >
                              <QrCode className="w-5 h-5 text-[#0F2942]" />
                            </button>

                            {/* ✏️ زر تعديل بيانات الطالب */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStudentId(s.id);
                                setStudentName(s.full_name);
                                setCustomStudentEmail(s.generated_email || '');
                                setCustomStudentPassword(s.temp_password || '');
                                setStudentStage(s.stage_number || 1);
                                setStudentGender((s.gender || detectArabicGender(s.full_name)) as 'male' | 'female');
                                const currentStudyType: 'morning' | 'evening' = (s.study_type === 'evening' || String(s.study_type) === 'مسائي') ? 'evening' : 'morning';
                                setStudentStudyType(currentStudyType);
                                setStudentGroup(s.student_group || ''); // 🏷️ تعبئة كروب الطالب للتعديل
                                setStudentNameError('');
                                setIsStudentModalOpen(true);
                              }}
                              className="p-2.5 bg-white hover:bg-slate-100 text-[#0F2942] rounded-xl transition cursor-pointer border border-slate-300 shadow-2xs hover:shadow-md active:scale-95"
                              title="تعديل البيانات"
                            >
                              <Edit3 className="w-5 h-5 text-[#0F2942]" />
                            </button>

                            {/* 🗑️ زر حذف الطالب */}
                            <button
                              type="button"
                              onClick={() => handleDeleteStudent(s.id)}
                              className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition cursor-pointer border border-rose-500 shadow-2xs hover:shadow-md active:scale-95"
                              title="حذف الطالب"
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

          {/* 📄 شريط نظام الصفحات لجدول الطلبة */}
          <div className="mt-4">
            <AdminPagination
              currentPage={Math.max(1, Math.min(studentPage, Math.max(1, Math.ceil(filteredStudents.length / studentPageSize))))}
              totalItems={filteredStudents.length}
              pageSize={studentPageSize}
              onPageChange={(page) => setStudentPage(page)}
              onPageSizeChange={(size) => {
                setStudentPageSize(size);
                setStudentPage(1);
              }}
              itemLabel="طالب/ـة"
            />
          </div>
          </>
        )}
      </div>

      {/* 🪟 مودال الترحيل الجماعي للمرحلة الدراسية بالكامل */}
      <BulkPromotionModal
        isOpen={isBulkPromotionModalOpen}
        onClose={() => setIsBulkPromotionModalOpen(false)}
        deptName={deptName}
        academicYear={academicYear}
        deptStudents={deptStudents}
        bulkPromoteSourceStage={bulkPromoteSourceStage}
        setBulkPromoteSourceStage={setBulkPromoteSourceStage}
        onConfirmPromote={handleBulkPromoteStage}
      />

      {/* 🪟 مودال إدارة وتوزيع كروبات المراحل الأكاديمية لرئيس القسم والمقرر */}
      <StageGroupSettingsModal
        isOpen={isStageGroupModalOpen}
        onClose={() => setIsStageGroupModalOpen(false)}
        deptName={deptName}
        deptStudents={deptStudents}
        initialConfigs={stageGroupConfigs}
        onSaveConfig={handleSaveStageGroupConfig}
        onUpdateStudentsBatch={handleUpdateStudentsGroupBatch}
      />
    </div>
  );
};

export default DepartmentStudentsTab; // 🚀 تصدير المكون
