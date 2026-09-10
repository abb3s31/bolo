'use client'; // ⚡ واجهة تفاعلية على متصفح العميل في Next.js

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import {
  Users, // 👥 أيقونة كادر التدريسيين
  Plus, // ➕ أيقونة إضافة أستاذ جديد
  Printer, // 🖨️ أيقونة طباعة بطاقات PDF
  Download, // 📥 أيقونة تنزيل النماذج وتصدير الإكسل
  Info, // ℹ️ أيقونة التعليمات والضوابط
  Upload, // 📤 أيقونة استيراد الإكسل
  FileSpreadsheet, // 📊 أيقونة ملف الإكسل
  Trash2, // 🗑️ أيقونة الحذف الفردي والجماعي
  ArrowUp, // ⬆️ أيقونة تقديم الأستاذ للأعلى
  ArrowDown, // ⬇️ أيقونة تأخير الأستاذ للأسفل
  QrCode, // 🪪 أيقونة عرض كود الاستجابة السريعة والبطاقة
  Edit3, // ✏️ أيقونة التعديل الأكاديمي
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { UserProfile, TeacherCourse } from '@/types'; // 🏷️ استيراد الواجهات والأنواع الصارمة
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧮 محرك الكشف الذكي عن الجنس العربي
import AdminPagination from '@/components/AdminPagination'; // 📄 مكون نظام الصفحات الموحد والفاخر
import TeacherModal from '../modals/TeacherModal'; // 🪟 مودال إضافة وتعديل حسابات الأساتذة

// 📋 واجهة خصائص تبويب إدارة أساتذة القسم
export interface DepartmentTeachersTabProps {
  deptTeachers: UserProfile[]; // 👨‍🏫 قائمة أساتذة القسم الحالي
  deptName: string; // 🏛️ اسم القسم العلمي الأكاديمي
  teacherCourses: TeacherCourse[]; // 📚 قائمة تكليفات المواد للأساتذة
  teacherPage: number; // 🔢 رقم الصفحة الحالية للجدول
  setTeacherPage: (page: number) => void; // 🔄 دالة تغيير الصفحة
  teacherPageSize: number; // 📏 عدد العناصر بالصفحة
  setTeacherPageSize: (size: number) => void; // 🔄 دالة تغيير حجم الصفحة
  selectedTeacherIds: string[]; // 🔘 معرفات الأساتذة المحددين للعمليات الجماعية
  setSelectedTeacherIds: React.Dispatch<React.SetStateAction<string[]>>; // 🔄 دالة تحديث التحديد
  isTeacherModalOpen: boolean; // 📂 حالة فتح نافذة إضافة وتعديل الأستاذ
  setIsTeacherModalOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 دالة فتح وإغلاق النافذة
  editingTeacherId: string | null; // ✍️ معرف الأستاذ الجاري تعديله
  setEditingTeacherId: React.Dispatch<React.SetStateAction<string | null>>; // 🔄 دالة تحديد معرف الأستاذ
  teacherName: string; // 👤 اسم الأستاذ
  setTeacherName: React.Dispatch<React.SetStateAction<string>>; // 🔄 دالة تحديث الاسم
  customTeacherEmail: string; // ✉️ البريد الأكاديمي
  setCustomTeacherEmail: React.Dispatch<React.SetStateAction<string>>; // 🔄 دالة تحديث البريد
  customTeacherPassword: string; // 🔑 كلمة المرور
  setCustomTeacherPassword: React.Dispatch<React.SetStateAction<string>>; // 🔄 دالة تحديث كلمة المرور
  teacherGender: 'male' | 'female' | null; // 🚻 جنس التدريسي
  setTeacherGender: React.Dispatch<React.SetStateAction<'male' | 'female' | null>>; // 🔄 دالة تحديد الجنس
  showTeacherPassword: boolean; // 👁️ إظهار كلمة المرور
  setShowTeacherPassword: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 دالة تبديل إظهار الرمز
  nameError: string; // ⚠️ رسالة خطأ الاسم
  setNameError: React.Dispatch<React.SetStateAction<string>>; // 🔄 دالة تحديث خطأ الاسم
  profiles: UserProfile[]; // 👥 قائمة كافة البروفايلات للتحقق الشامل
  isImportingExcel: boolean; // ⏳ حالة جاري استيراد إكسل
  isExportingTeachersExcel: boolean; // ⏳ حالة جاري تصدير إكسل
  handleDownloadTeacherTemplate: () => void; // 📥 دالة تنزيل قالب إكسل
  setShowExcelInstructions: (val: boolean) => void; // ℹ️ دالة فتح تعليمات الإكسل
  handleTeacherExcelUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; // 📤 دالة رفع ملف الإكسل
  handleExportTeachersExcel: () => void; // 📊 دالة تصدير إكسل لكافة الأساتذة
  handleSaveTeacher: (e: React.FormEvent) => void; // 💾 دالة حفظ وتخزين الأستاذ
  handleAutoGenerateCredentials: () => void; // ⚡ دالة التوليد التلقائي للبيانات
  passwordCriteria: { length: boolean; hasUpper: boolean; hasNumber: boolean; hasSpecial: boolean }; // 🔐 معايير كلمة المرور
  passwordStrengthScore: number; // 📊 نسبة قوة كلمة المرور
  handleBulkDeleteTeachers: () => void; // 🗑️ دالة حذف الأساتذة المحددين
  handleBulkExportTeachersExcel: () => void; // 📥 دالة تصدير الأساتذة المحددين إكسل
  toggleSelectAllTeachers: () => void; // 🔘 دالة تحديد/إلغاء تحديد الكل
  toggleSelectTeacher: (id: string) => void; // 🔘 دالة تحديد/إلغاء أستاذ فردي
  handleMoveTeacher: (index: number, direction: 'up' | 'down', teachers: UserProfile[], e: React.MouseEvent) => void; // 🔄 دالة إعادة ترتيب الأستاذ
  setSingleTeacherPrintProfile: (profile: UserProfile | null) => void; // 🖨️ دالة تخصيص أستاذ للطباعة الفردية
  setShowTeacherPrintModal: (show: boolean) => void; // 🖨️ دالة فتح نافذة الطباعة
  setSelectedCardProfile: (profile: UserProfile | null) => void; // 🪪 دالة عرض بطاقة الـ QR
  handleDeleteTeacher: (id: string) => void; // 🗑️ دالة حذف أستاذ فردي
}

// 🏛️ مكون تبويب إدارة كادر تدريسيي القسم
export const DepartmentTeachersTab: React.FC<DepartmentTeachersTabProps> = ({
  deptTeachers, // 👨‍🏫 أساتذة القسم
  deptName, // 🏛️ اسم القسم
  teacherCourses, // 📚 تكليفات المواد
  teacherPage, // 🔢 الصفحة الحالية
  setTeacherPage, // 🔄 دالة تغيير الصفحة
  teacherPageSize, // 📏 حجم الصفحة
  setTeacherPageSize, // 🔄 دالة تغيير حجم الصفحة
  selectedTeacherIds, // 🔘 المحدد للعمليات الجماعية
  setSelectedTeacherIds, // 🔄 دالة تحديث التحديد
  isTeacherModalOpen, // 📂 حالة ظهور المودال
  setIsTeacherModalOpen, // 🔄 فتح/إغلاق المودال
  editingTeacherId, // ✍️ معرف الأستاذ للتعديل
  setEditingTeacherId, // 🔄 تحديث المعرف
  teacherName, // 👤 الاسم
  setTeacherName, // 🔄 تحديث الاسم
  customTeacherEmail, // ✉️ البريد
  setCustomTeacherEmail, // 🔄 تحديث البريد
  customTeacherPassword, // 🔑 الرمز
  setCustomTeacherPassword, // 🔄 تحديث الرمز
  teacherGender, // 🚻 الجنس
  setTeacherGender, // 🔄 تحديث الجنس
  showTeacherPassword, // 👁️ إظهار الرمز
  setShowTeacherPassword, // 🔄 تحديث إظهار الرمز
  nameError, // ⚠️ خطأ الاسم
  setNameError, // 🔄 تحديث خطأ الاسم
  profiles, // 👥 الحسابات
  isImportingExcel, // ⏳ جاري الاستيراد
  isExportingTeachersExcel, // ⏳ جاري التصدير
  handleDownloadTeacherTemplate, // 📥 تنزيل القالب
  setShowExcelInstructions, // ℹ️ فتح التعليمات
  handleTeacherExcelUpload, // 📤 رفع الإكسل
  handleExportTeachersExcel, // 📊 تصدير الأساتذة
  handleSaveTeacher, // 💾 حفظ الأستاذ
  handleAutoGenerateCredentials, // ⚡ توليد البيانات
  passwordCriteria, // 🔐 المعايير
  passwordStrengthScore, // 📊 القوة
  handleBulkDeleteTeachers, // 🗑️ حذف المحدد
  handleBulkExportTeachersExcel, // 📥 تصدير المحدد
  toggleSelectAllTeachers, // 🔘 تحديد الكل
  toggleSelectTeacher, // 🔘 تحديد أستاذ
  handleMoveTeacher, // 🔄 تقديم/تأخير
  setSingleTeacherPrintProfile, // 🖨️ تخصيص الطباعة الفردية
  setShowTeacherPrintModal, // 🖨️ فتح الطباعة
  setSelectedCardProfile, // 🪪 عرض البطاقة
  handleDeleteTeacher, // 🗑️ حذف أستاذ
}) => {
  // 🧮 حساب الإحصائيات الديموغرافية للأساتذة
  const totalDeptTch = deptTeachers.length;
  const totalMales = deptTeachers.filter((t) => (t.gender || detectArabicGender(t.full_name)) === 'male').length;
  const totalFemales = totalDeptTch - totalMales;
  const malePct = totalDeptTch > 0 ? Math.round((totalMales / totalDeptTch) * 100) : 0;
  const femalePct = totalDeptTch > 0 ? Math.round((totalFemales / totalDeptTch) * 100) : 0;

  return (
    <div className="space-y-4" dir="rtl">
      {/* 📊 شريط كادر التدريسيين وإحصائياته وشريط الأزرار بسطر واحد احترافي */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
        {/* 🏷️ الصف العلوي: العنوان والتوصيف + الإحصائيات الديموغرافية */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
              <Users className="w-7 h-7 text-slate-950" />
              <span>كادر التدريسيين المعتمد لقسم {deptName}</span>
            </h3>
            <p className="text-base sm:text-lg font-black text-slate-700 mt-1">
              إجمالي التدريسيين المكلفين بالتدريس الفعلي في القسم
            </p>
          </div>

          {/* 🧮 شارات الإحصائيات (الإجمالي، الذكور، الإناث) */}
          <div className="flex flex-wrap items-center gap-2.5 text-base font-black">
            <span className="bg-slate-100 text-slate-950 px-4 py-2 rounded-2xl border border-slate-300 shadow-2xs">
              الإجمالي: {totalDeptTch} تدريسي
            </span>
            <span className="bg-blue-100 text-blue-950 px-4 py-2 rounded-2xl border border-blue-300 shadow-2xs">
              الذكور: {totalMales} ({malePct}%)
            </span>
            <span className="bg-rose-100 text-rose-950 px-4 py-2 rounded-2xl border border-rose-300 shadow-2xs">
              الإناث: {totalFemales} ({femalePct}%)
            </span>
          </div>
        </div>

        {/* 🔘 شريط الأزرار بسطر واحد احترافي وموحد 100% */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-3 overflow-x-auto flex-nowrap">
          {/* ➕ زر فتح كارت الإضافة وتوليد الحساب العائم */}
          <button
            type="button"
            onClick={() => {
              setEditingTeacherId(null);
              setTeacherName('');
              setCustomTeacherEmail('');
              setCustomTeacherPassword('');
              setTeacherGender(null);
              setShowTeacherPassword(false);
              setNameError('');
              setIsTeacherModalOpen(true);
            }}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-sm transition flex items-center gap-2 cursor-pointer border border-[#163a5f] shrink-0 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5 text-cyan-300" />
            <span>إضافة أستاذ جديد</span>
          </button>

          {/* 🖨️ زر طباعة وتصدير بطاقات اعتماد الأساتذة بصيغة PDF */}
          <button
            type="button"
            onClick={() => {
              setSingleTeacherPrintProfile(null);
              setShowTeacherPrintModal(true);
            }}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#163a5f] shrink-0 whitespace-nowrap"
            title="طباعة بطاقات حسابات الأساتذة وتصديرها كملف PDF"
          >
            <Printer className="w-5 h-5 text-cyan-300" />
            <span>طباعة البطاقات (PDF)</span>
          </button>

          {/* 📥 زر تنزيل نموذج Excel المعتمد */}
          <button
            type="button"
            onClick={handleDownloadTeacherTemplate}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#163a5f] shrink-0 whitespace-nowrap"
            title="تنزيل نموذج Excel المعتمد لأساتذة القسم"
          >
            <Download className="w-5 h-5 text-emerald-300" />
            <span>نموذج Excel</span>
          </button>

          {/* ℹ️ زر تعليمات الاستيراد */}
          <button
            type="button"
            onClick={() => setShowExcelInstructions(true)}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#163a5f] shrink-0 whitespace-nowrap"
            title="تعليمات وضوابط الاستيراد"
          >
            <Info className="w-5 h-5 text-sky-300" />
            <span>التعليمات</span>
          </button>

          {/* 📤 زر استيراد ملف Excel لأساتذة القسم */}
          <label className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-base font-black rounded-2xl transition flex items-center gap-2 cursor-pointer shadow-sm border border-[#163a5f] shrink-0 active:scale-95 whitespace-nowrap">
            <Upload className="w-5 h-5 text-cyan-300" />
            <span>{isImportingExcel ? 'جاري الاستيراد...' : 'استيراد Excel'}</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleTeacherExcelUpload}
              disabled={isImportingExcel}
              className="hidden"
            />
          </label>

          {/* 📊 زر تصدير كادر الأساتذة إلى Excel */}
          <button
            type="button"
            onClick={handleExportTeachersExcel}
            disabled={isExportingTeachersExcel}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#163a5f] shrink-0 whitespace-nowrap disabled:opacity-50"
            title="تصدير كادر الأساتذة إلى ملف Excel مع البريد الأكاديمي والرمز السري"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            <span>{isExportingTeachersExcel ? 'جاري التصدير...' : selectedTeacherIds.length > 0 ? `تصدير المحدد (${selectedTeacherIds.length}) Excel` : 'تصدير الأساتذة (Excel)'}</span>
          </button>
        </div>
      </div>

      {/* 🪟 كارت CRUD عائم فوق الكل لإضافة / تعديل أستاذ */}
      <TeacherModal
        isOpen={isTeacherModalOpen}
        onClose={() => {
          setIsTeacherModalOpen(false);
          setEditingTeacherId(null);
          setTeacherName('');
          setCustomTeacherEmail('');
          setCustomTeacherPassword('');
          setNameError('');
        }}
        editingTeacherId={editingTeacherId}
        deptName={deptName}
        teacherName={teacherName}
        setTeacherName={setTeacherName}
        nameError={nameError}
        setNameError={setNameError}
        teacherGender={teacherGender}
        setTeacherGender={setTeacherGender}
        customTeacherEmail={customTeacherEmail}
        setCustomTeacherEmail={setCustomTeacherEmail}
        customTeacherPassword={customTeacherPassword}
        setCustomTeacherPassword={setCustomTeacherPassword}
        showTeacherPassword={showTeacherPassword}
        setShowTeacherPassword={setShowTeacherPassword}
        passwordCriteria={passwordCriteria}
        passwordStrengthScore={passwordStrengthScore}
        profiles={profiles}
        onSave={handleSaveTeacher}
        onAutoGenerateCredentials={handleAutoGenerateCredentials}
      />

      {/* 📋 جدول أساتذة القسم المعتمدين */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-slate-900" />
            <span>قائمة أساتذة قسم {deptName} ({deptTeachers.length})</span>
          </h3>
        </div>

        {/* 🎛️ شريط الإجراءات الجماعية الفاخر عند تحديد الأساتذة */}
        {selectedTeacherIds.length > 0 && (
          <div className="bg-[#0F2942] text-white p-4 sm:px-6 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-[#0F2942] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 text-cyan-300 rounded-xl border border-cyan-400/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-base text-white">
                  تم تحديد <strong className="text-cyan-300 font-mono text-lg font-black">({selectedTeacherIds.length})</strong> من أصل <span className="font-mono text-slate-300">({deptTeachers.length})</span> تدريسي
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleBulkDeleteTeachers}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف المحدد ({selectedTeacherIds.length})</span>
              </button>

              <button
                type="button"
                onClick={handleBulkExportTeachersExcel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>تصدير المحدد Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTeacherIds([])}
                className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-black text-sm transition cursor-pointer"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        )}
        
        {deptTeachers.length === 0 ? (
          <p className="text-center py-10 text-slate-950 font-black text-base">لا يوجد أساتذة مضافين في هذا القسم حتى الآن.</p>
        ) : (
          <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right border-collapse text-base font-black">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-950 font-black text-base">
                  <th className="p-4 text-center text-base w-12">
                    <input
                      type="checkbox"
                      aria-label="تحديد جميع الأساتذة"
                      checked={deptTeachers.length > 0 && selectedTeacherIds.length === deptTeachers.length}
                      onChange={toggleSelectAllTeachers}
                      className="w-5 h-5 rounded-md border-2 border-slate-400 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                    />
                  </th>
                  <th className="p-4 text-center text-base w-14">ت</th>
                  <th className="p-4 text-base">اسم الأستاذ</th>
                  <th className="p-4 text-center text-base">الترتيب</th>
                  <th className="p-4 text-base">الجنس</th>
                  <th className="p-4 text-base">البريد الأكاديمي</th>
                  <th className="p-4 text-base">المواد المكلف بها</th>
                  <th className="p-4 text-center text-base">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-black text-slate-950 text-base">
                {(() => {
                  // 🧮 حسابات شريحة الصفحة لجدول الأساتذة
                  const totalTeachersCount = deptTeachers.length; // 🔢 إجمالي عدد أساتذة القسم
                  const safeTeacherPage = Math.max(1, Math.min(teacherPage, Math.max(1, Math.ceil(totalTeachersCount / teacherPageSize)))); // 🛡️ حماية رقم الصفحة
                  const teacherStartIndex = (safeTeacherPage - 1) * teacherPageSize; // 📍 بداية شريحة العرض
                  const paginatedDeptTeachers = deptTeachers.slice(teacherStartIndex, teacherStartIndex + teacherPageSize); // 📋 أساتذة الصفحة الحالية

                  return paginatedDeptTeachers.map((t, index) => {
                    const actualIndex = teacherStartIndex + index; // 🔢 التسلسل العام الحقيقي للأستاذ
                    const assigned = teacherCourses.filter((tc) => tc.teacher_id === t.id); // 📚 المواد المكلف بتدريسها
                    const gender = t.gender || detectArabicGender(t.full_name); // 🚻 تحديد جنس التدريسي
                    const isFirst = actualIndex === 0; // 🔝 هل هو الأول بالقائمة الكلية
                    const isLast = actualIndex === totalTeachersCount - 1; // 🔚 هل هو الأخير بالقائمة الكلية
                    const isSelected = selectedTeacherIds.includes(t.id); // 🔘 هل تم تحديده بمربع الاختيار

                    return (
                      <tr key={t.id} className={`transition ${isSelected ? 'bg-blue-50/70 font-black' : 'hover:bg-slate-50'}`}>
                        {/* 🔘 مربع التحديد الفردي */}
                        <td className="p-4 text-center whitespace-nowrap w-12" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`تحديد ${t.full_name}`}
                            checked={isSelected}
                            onChange={() => toggleSelectTeacher(t.id)}
                            className="w-5 h-5 rounded-md border-2 border-slate-400 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                          />
                        </td>

                        {/* 🔢 عمود التسلسل والترتيب الرقمي */}
                        <td className="p-4 text-center font-black text-slate-950 text-base whitespace-nowrap">
                          <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-300 text-slate-950 font-black text-base shadow-2xs">
                            {actualIndex + 1}
                          </span>
                        </td>

                        {/* 👤 اسم الأستاذ الكامل */}
                        <td className="p-4 font-black text-slate-950 text-lg whitespace-nowrap">
                          <span className="font-black text-slate-950 text-lg tracking-tight">
                            {t.full_name}
                          </span>
                        </td>

                        {/* 🎛️ عمود أزرار التقديم والتأخير للترتيب */}
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleMoveTeacher(actualIndex, 'up', deptTeachers, e)}
                              disabled={isFirst}
                              title="تقديم الأستاذ للأعلى"
                              className={`p-2 rounded-xl border transition cursor-pointer ${
                                isFirst
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-40'
                                  : 'bg-white text-slate-950 border-slate-300 hover:bg-[#0F2942] hover:text-white shadow-2xs active:scale-95'
                              }`}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleMoveTeacher(actualIndex, 'down', deptTeachers, e)}
                              disabled={isLast}
                              title="تأخير الأستاذ للأسفل"
                              className={`p-2 rounded-xl border transition cursor-pointer ${
                                isLast
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-40'
                                  : 'bg-white text-slate-950 border-slate-300 hover:bg-[#0F2942] hover:text-white shadow-2xs active:scale-95'
                              }`}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                        {/* 🚻 عمود جنس الأستاذ */}
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-3.5 py-1.5 rounded-xl text-base font-black border ${ gender === 'female' ? 'bg-rose-100 text-rose-950 border-rose-300' : 'bg-blue-100 text-blue-950 border-blue-300' }`}>
                            {gender === 'female' ? 'أنثى' : 'ذكر'}
                          </span>
                        </td>

                        {/* ✉️ عمود البريد الأكاديمي */}
                        <td className="p-4 text-slate-950 text-base font-black select-all whitespace-nowrap" dir="ltr">
                          {t.generated_email}
                        </td>

                        {/* 📚 عمود المواد المكلف بها */}
                        <td className="p-4 whitespace-nowrap">
                          <span className="bg-blue-50 text-blue-950 px-3.5 py-1.5 rounded-xl text-base font-black border border-blue-200">
                            {assigned.length} مواد
                          </span>
                        </td>

                        {/* ⚙️ عمود أزرار الإجراءات */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {/* 🖨️ زر طباعة بطاقة الأستاذ الفردية كـ PDF */}
                            <button
                              type="button"
                              onClick={() => {
                                setSingleTeacherPrintProfile(t);
                                setShowTeacherPrintModal(true);
                              }}
                              className="p-2.5 bg-white hover:bg-slate-100 text-[#0F2942] rounded-xl transition cursor-pointer border border-slate-300 shadow-2xs hover:shadow-md active:scale-95"
                              title="طباعة بطاقة حساب الأستاذ (PDF)"
                            >
                              <Printer className="w-5 h-5 text-[#0F2942]" />
                            </button>

                            {/* 🪪 زر بطاقة الأستاذ ورمز QR */}
                            <button
                              type="button"
                              onClick={() => setSelectedCardProfile(t)}
                              className="p-2.5 bg-white hover:bg-slate-100 text-[#0F2942] rounded-xl transition cursor-pointer border border-slate-300 shadow-2xs hover:shadow-md active:scale-95"
                              title="عرض بطاقة الأستاذ ورمز QR"
                            >
                              <QrCode className="w-5 h-5 text-[#0F2942]" />
                            </button>

                            {/* ✏️ زر تعديل بيانات الأستاذ */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTeacherId(t.id);
                                setTeacherName(t.full_name);
                                setCustomTeacherEmail(t.generated_email || '');
                                setCustomTeacherPassword(t.temp_password || '');
                                setTeacherGender((t.gender || detectArabicGender(t.full_name)) as 'male' | 'female');
                                setNameError('');
                                setIsTeacherModalOpen(true);
                              }}
                              className="p-2.5 bg-white hover:bg-slate-100 text-[#0F2942] rounded-xl transition cursor-pointer border border-slate-300 shadow-2xs hover:shadow-md active:scale-95"
                              title="تعديل بيانات الأستاذ"
                            >
                              <Edit3 className="w-5 h-5 text-[#0F2942]" />
                            </button>

                            {/* 🗑️ زر حذف الأستاذ */}
                            <button
                              type="button"
                              onClick={() => handleDeleteTeacher(t.id)}
                              className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition cursor-pointer border border-rose-500 shadow-2xs hover:shadow-md active:scale-95"
                              title="حذف الأستاذ"
                            >
                              <Trash2 className="w-5 h-5 text-white" />
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

          {/* 📄 شريط نظام الصفحات لجدول الأساتذة */}
          <div className="mt-4">
            <AdminPagination
              currentPage={Math.max(1, Math.min(teacherPage, Math.max(1, Math.ceil(deptTeachers.length / teacherPageSize))))}
              totalItems={deptTeachers.length}
              pageSize={teacherPageSize}
              onPageChange={(page) => setTeacherPage(page)}
              onPageSizeChange={(size) => {
                setTeacherPageSize(size);
                setTeacherPage(1);
              }}
              itemLabel="أستاذ/ـة"
            />
          </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DepartmentTeachersTab; // 🚀 تصدير المكون
