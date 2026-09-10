'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🏛️ مصفوفة إشغال القاعات الامتحانية المركزية لكافة أقسام الكلية (MasterCampusExamMatrixModal) - مسار بولونيا
import { useState, useRef, useEffect, useMemo } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والمراجع
import { FinalExamSchedule, FinalExamSlot, Department } from '@/types'; // 🔗 استيراد الأنواع المحددة والصريحة
import { exportMasterCampusExamMatrixExcel } from '@/lib/excel-utils'; // 📊 تصدير مصفوفة القاعات إلى Excel
import { exportMasterCampusExamMatrixPDF } from '@/lib/pdf-export'; // 📄 تصدير مصفوفة القاعات إلى PDF A4
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 أسماء المراحل بالعربية
import { 
  Building2, 
  Search, 
  X, 
  ChevronDown, 
  Check, 
  FileSpreadsheet, 
  FileText,
  RotateCcw, 
  AlertTriangle, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle2,
  Layers
} from 'lucide-react'; // 🎨 استيراد الأيقونات المعتمدة

// 🏷️ واجهة خصائص المودال المحددة بدقة ومنع any تماماً
interface MasterCampusExamMatrixModalProps {
  isOpen: boolean;                                     // 🚪 حالة فتح أو إغلاق المودال
  onClose: () => void;                                 // 🚪 دالة إغلاق المودال
  schedules: FinalExamSchedule[];                      // 📋 قائمة الجداول الامتحانية المعتمدة
  slots: FinalExamSlot[];                              // 📋 قائمة البنود والمواعيد الامتحانية
  departments: Department[];                           // 🏢 قائمة الأقسام العلمية للكلية
}

export default function MasterCampusExamMatrixModal({
  isOpen,
  onClose,
  schedules,
  slots,
  departments,
}: MasterCampusExamMatrixModalProps) {
  // 🎯 حالات الفلاتر والبحث
  const [filterDate, setFilterDate] = useState<string>('all'); // 📅 تاريخ الامتحان المختار
  const [filterDept, setFilterDept] = useState<string>('all'); // 🏢 القسم الأكاديمي المختار
  const [filterStage, setFilterStage] = useState<string>('all'); // 🎓 المرحلة الدراسية
  const [searchQuery, setSearchQuery] = useState<string>(''); // 🔍 نص البحث السريع
  const [toastMsg, setToastMsg] = useState<string>(''); // 🔔 رسالة التنبيه العائم
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false); // ⏳ حالة تصدير Excel
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false); // ⏳ حالة تصدير PDF

  // 🎛️ حالات فتح واتجاه القوائم المنسدلة الذكية
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState<boolean>(false); // 📅 فتح قائمة التاريخ
  const [dateDropdownPlacement, setDateDropdownPlacement] = useState<'top' | 'bottom'>('bottom'); // ↕️ اتجاه فتح التاريخ
  const dateDropdownRef = useRef<HTMLDivElement | null>(null); // 📍 مرجع قائمة التاريخ

  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState<boolean>(false); // 🏢 فتح قائمة الأقسام
  const [deptDropdownPlacement, setDeptDropdownPlacement] = useState<'top' | 'bottom'>('bottom'); // ↕️ اتجاه فتح الأقسام
  const deptDropdownRef = useRef<HTMLDivElement | null>(null); // 📍 مرجع قائمة الأقسام

  // 📆 أسماء الأيام بالعربية
  const dayArabicNames: Record<string, string> = {
    saturday: 'السبت',
    sunday: 'الأحد',
    monday: 'الإثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
  };

  // 🧠 فحص المساحة المتاحة أسفل القائمة لفتحها للأعلى (Drop-Up) أو للأسفل (Drop-Down)
  const toggleDateDropdown = () => {
    if (!isDateDropdownOpen && dateDropdownRef.current) {
      const rect = dateDropdownRef.current.getBoundingClientRect(); // 📐 قياس أبعاد العنصر
      const spaceBelow = window.innerHeight - rect.bottom; // 📏 حساب المساحة المتبقية
      setDateDropdownPlacement(spaceBelow < 260 ? 'top' : 'bottom'); // 🔀 الاتجاه
    }
    setIsDateDropdownOpen(!isDateDropdownOpen); // 🔄 تبديل الفتح
    setIsDeptDropdownOpen(false); // 🔒 إغلاق الأخرى
  };

  const toggleDeptDropdown = () => {
    if (!isDeptDropdownOpen && deptDropdownRef.current) {
      const rect = deptDropdownRef.current.getBoundingClientRect(); // 📐 قياس أبعاد العنصر
      const spaceBelow = window.innerHeight - rect.bottom; // 📏 حساب المساحة المتبقية
      setDeptDropdownPlacement(spaceBelow < 260 ? 'top' : 'bottom'); // 🔀 الاتجاه
    }
    setIsDeptDropdownOpen(!isDeptDropdownOpen); // 🔄 تبديل الفتح
    setIsDateDropdownOpen(false); // 🔒 إغلاق الأخرى
  };

  // 🖱️ إغلاق القوائم المنسدلة تلقائياً عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(target)) {
        setIsDateDropdownOpen(false);
      }
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(target)) {
        setIsDeptDropdownOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 📅 استخراج التواريخ الامتحانية المتاحة بدون تكرار
  const availableDates = useMemo(() => {
    return Array.from(new Set(slots.map((s) => s.exam_date))).sort();
  }, [slots]);

  // 🗺️ خريطة الجداول لتسريع الوصول
  const scheduleMap = useMemo(() => {
    return new Map<string, FinalExamSchedule>(schedules.map((s) => [s.id, s]));
  }, [schedules]);

  // ⚠️ كشف التضارب المركزي بين القاعات والأوقات
  const collisionSlotIds = useMemo(() => {
    const collisionIds = new Set<string>();

    for (let i = 0; i < slots.length; i++) {
      const s1 = slots[i];
      for (let j = i + 1; j < slots.length; j++) {
        const s2 = slots[j];
        if (s1.exam_date === s2.exam_date && s1.hall_name.trim().toLowerCase() === s2.hall_name.trim().toLowerCase()) {
          // فحص تداخل الوقت
          const isOverlapping = (s1.start_time < s2.end_time && s1.end_time > s2.start_time);
          if (isOverlapping) {
            collisionIds.add(s1.id);
            collisionIds.add(s2.id);
          }
        }
      }
    }
    return collisionIds;
  }, [slots]);

  // 🔍 تصفية بنود الامتحانات بحسب التاريخ والقسم والمرحلة والبحث
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (filterDate !== 'all' && slot.exam_date !== filterDate) return false;
      
      const schedule = scheduleMap.get(slot.schedule_id);
      if (filterDept !== 'all') {
        if (!schedule || schedule.department_id !== filterDept) return false;
      }

      if (filterStage !== 'all') {
        if (String(slot.stage_number) !== filterStage) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = slot.course_name.toLowerCase().includes(q);
        const matchCode = (slot.course_code || '').toLowerCase().includes(q);
        const matchHall = slot.hall_name.toLowerCase().includes(q);
        const matchBuilding = slot.building_name.toLowerCase().includes(q);
        const matchSupervisor = (slot.supervisor_name || '').toLowerCase().includes(q);
        const matchDept = (schedule?.department_name || '').toLowerCase().includes(q);
        return matchName || matchCode || matchHall || matchBuilding || matchSupervisor || matchDept;
      }

      return true;
    });
  }, [slots, filterDate, filterDept, filterStage, searchQuery, scheduleMap]);

  // 📊 حساب الإحصائيات الدقيقة للقاعات والمشرفين
  const totalHallsOccupied = useMemo(() => {
    return new Set(filteredSlots.map((s) => `${s.building_name}-${s.hall_name}`)).size;
  }, [filteredSlots]);

  const totalSupervisors = useMemo(() => {
    return new Set(filteredSlots.map((s) => s.supervisor_name).filter(Boolean)).size;
  }, [filteredSlots]);

  const totalDeptsActive = useMemo(() => {
    return new Set(filteredSlots.map((s) => scheduleMap.get(s.schedule_id)?.department_id).filter(Boolean)).size;
  }, [filteredSlots, scheduleMap]);

  // 🏷️ نصوص الأزرار الحالية
  const selectedDateLabel = filterDate === 'all' 
    ? `كافة التواريخ (${availableDates.length})` 
    : filterDate;

  const selectedDeptLabel = filterDept === 'all' 
    ? `كافة الأقسام (${departments.length})` 
    : (departments.find(d => d.id === filterDept)?.name || filterDept);

  // 🔄 إعادة تعيين جميع الفلاتر
  const handleResetFilters = () => {
    setFilterDate('all');
    setFilterDept('all');
    setFilterStage('all');
    setSearchQuery('');
  };

  // 📤 تصدير المصفوفة المركزية إلى Excel
  const handleExportExcel = async () => {
    if (filteredSlots.length === 0) {
      setToastMsg('لا توجد بيانات مطابقة لتصديرها.');
      setTimeout(() => setToastMsg(''), 4000);
      return;
    }

    try {
      setIsExportingExcel(true);
      await exportMasterCampusExamMatrixExcel(
        filteredSlots,
        schedules,
        filterDate === 'all' ? 'كافة_التواريخ' : filterDate,
        filterDept === 'all' ? 'كافة_الأقسام' : selectedDeptLabel
      );
      setToastMsg(`تم تصدير المصفوفة المركزية (${filteredSlots.length} مادة) إلى Excel بنجاح`);
      setTimeout(() => setToastMsg(''), 4000);
    } catch {
      setToastMsg('حدث خطأ أثناء تصدير ملف الإكسل.');
      setTimeout(() => setToastMsg(''), 4000);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // 📄 تصدير مصفوفة القاعات المركزية إلى PDF A4 Landscape
  const handleExportPDF = async () => {
    if (filteredSlots.length === 0) {
      setToastMsg('لا توجد بيانات مطابقة لتصديرها.');
      setTimeout(() => setToastMsg(''), 4000);
      return;
    }

    try {
      setIsExportingPDF(true);
      const success = await exportMasterCampusExamMatrixPDF({
        filterDate: filterDate === 'all' ? 'كافة التواريخ' : filterDate,
        filterDeptName: filterDept === 'all' ? 'كافة الأقسام الأكاديمية' : selectedDeptLabel,
        slots: filteredSlots,
        schedules,
      });

      if (success) {
        setToastMsg(`تم تصدير المصفوفة المركزية (${filteredSlots.length} مادة) إلى PDF بنجاح`);
      } else {
        setToastMsg('تعذر إتمام تصدير ملف الـ PDF.');
      }
      setTimeout(() => setToastMsg(''), 4000);
    } catch {
      setToastMsg('حدث خطأ أثناء تصدير ملف الـ PDF.');
      setTimeout(() => setToastMsg(''), 4000);
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (!isOpen) return null; // 🚫 إرجاع فارغ إذا كان المودال مغلقاً

  const hasActiveFilters = filterDate !== 'all' || filterDept !== 'all' || filterStage !== 'all' || searchQuery.trim().length > 0;

  return (
    // 🔮 خلفية زجاجية غامرة تغطي كامل الشاشة
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none" dir="rtl">
      
      {/* 🔔 التنبيه العائم الفاخر (Light Mode أبيض ناصع) */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200" dir="rtl">
          <div className="p-4 sm:px-6 sm:py-3.5 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-indigo-400/80 ring-4 ring-indigo-300/20 flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-700 border-2 border-indigo-300 rounded-xl shadow-2xs shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="font-black text-sm text-slate-950">{toastMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMsg('')}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* 🏛️ الكارد العائم الرئيسي للمصفوفة */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-7xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* 📌 1. ترويسة الكارد الموحدة الفاخرة (Header) */}
        <div className="flex-shrink-0 flex flex-wrap items-center justify-between border-b border-slate-200 p-5 sm:p-6 bg-white z-30 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-[#0F2942] text-white rounded-2xl shadow-xs">
              <Building2 className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-3 py-0.5 bg-[#0F2942] text-white rounded-lg text-xs font-black">
                  اللجنة الامتحانية المركزية
                </span>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-950 border border-blue-200 rounded-lg text-xs font-bold font-mono">
                  {filteredSlots.length} مادة امتحانية
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-lg text-xs font-bold font-mono">
                  {totalHallsOccupied} قاعة ومدرج مشغولة
                </span>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-900 border border-slate-300 rounded-lg text-xs font-bold font-mono">
                  {totalSupervisors} مشرف ومراقب
                </span>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-900 border border-slate-300 rounded-lg text-xs font-bold">
                  {totalDeptsActive} أقسام مشاركة
                </span>
                {collisionSlotIds.size > 0 && (
                  <span className="px-2.5 py-0.5 bg-rose-100 text-rose-950 border border-rose-300 rounded-lg text-xs font-black flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                    <span>تم رصد {collisionSlotIds.size} مواعيد متضاربة</span>
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950">
                مصفوفة إشغال القاعات الامتحانية المركزية
              </h3>
            </div>
          </div>

          {/* أزرار الإجراءات في الترويسة: تصدير إكسل + تصدير PDF + إغلاق */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExportingPDF || filteredSlots.length === 0}
              className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#16385c] disabled:opacity-50 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              title="تصدير جدول مصفوفة القاعات المركزية إلى ملف PDF A4"
            >
              <FileText className="w-4 h-4 text-cyan-300" />
              <span>{isExportingPDF ? 'جاري التصدير...' : 'تصدير المصفوفة (PDF)'}</span>
            </button>

            {/* 📊 زر تصدير إكسل متناسق 100% ويا ديزاين زر الـ PDF الكحلي الفاخر */}
            <button
              type="button" // 🔘 نوع الزر حتى ما يسوي سبمت للفورم بالغلط
              onClick={handleExportExcel} // ⚡ يشغل دالة تصدير بيانات المصفوفة لملف إكسل
              disabled={isExportingExcel || filteredSlots.length === 0} // 🔒 يتعطل إذا ديصدر أو ماكو بيانات مصفاة
              className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#16385c] disabled:opacity-50 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap" // 🎨 نفس ستايل زر الـ PDF بالضبط كحلي أنيق وراقي
              title="تصدير جدول مصفوفة القاعات المركزية إلى ملف Excel" // 💡 تلميح توضيحي للمستخدم عند الوقوف على الزر
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" /> {/* 📗 أيقونة الإكسل بلون زمردي فاقع ومتناسق ويه الكحلي */}
              <span>{isExportingExcel ? 'جاري التصدير...' : 'تصدير المصفوفة (Excel)'}</span> {/* 📝 نص الزر مضاف إله أقواس مثل (PDF) */}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-2xl transition cursor-pointer border border-slate-200"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 🎛️ 2. شريط الفلاتر والبحث السريع والمراحل */}
        <div className="flex-shrink-0 bg-slate-50 px-5 sm:px-6 py-3.5 border-b border-slate-200 z-20 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            
            {/* 📅 قائمة التاريخ المنسدلة الذكية */}
            <div className="sm:col-span-3 relative" ref={dateDropdownRef}>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الامتحان:</label>
              <button
                type="button"
                onClick={toggleDateDropdown}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-950 flex items-center justify-between shadow-2xs hover:border-slate-400 transition cursor-pointer font-mono"
              >
                <span className="truncate">{selectedDateLabel}</span>
                <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* القائمة المنبثقة الذكية */}
              {isDateDropdownOpen && (
                <div 
                  className={`absolute z-[99999] right-0 left-0 bg-white border border-slate-300 rounded-2xl shadow-2xl py-1.5 max-h-56 overflow-y-auto ${
                    dateDropdownPlacement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                  }`}
                >
                  <div
                    onClick={() => {
                      setFilterDate('all');
                      setIsDateDropdownOpen(false);
                    }}
                    className={`px-3.5 py-2 text-xs sm:text-sm font-bold flex items-center justify-between cursor-pointer transition ${
                      filterDate === 'all' 
                        ? 'bg-[#0F2942] text-white' 
                        : 'text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    <span>كافة التواريخ الامتحانية ({availableDates.length})</span>
                    {filterDate === 'all' && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>

                  {availableDates.map((d) => (
                    <div
                      key={d}
                      onClick={() => {
                        setFilterDate(d);
                        setIsDateDropdownOpen(false);
                      }}
                      className={`px-3.5 py-2 text-xs sm:text-sm font-bold font-mono flex items-center justify-between cursor-pointer transition ${
                        filterDate === d 
                          ? 'bg-[#0F2942] text-white' 
                          : 'text-slate-950 hover:bg-slate-100'
                      }`}
                    >
                      <span>{d}</span>
                      {filterDate === d && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 🏢 قائمة الأقسام المنسدلة الذكية */}
            <div className="sm:col-span-4 relative" ref={deptDropdownRef}>
              <label className="block text-xs font-bold text-slate-700 mb-1">القسم الأكاديمي:</label>
              <button
                type="button"
                onClick={toggleDeptDropdown}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-950 flex items-center justify-between shadow-2xs hover:border-slate-400 transition cursor-pointer"
              >
                <span className="truncate">{selectedDeptLabel}</span>
                <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform ${isDeptDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* القائمة المنبثقة الذكية */}
              {isDeptDropdownOpen && (
                <div 
                  className={`absolute z-[99999] right-0 left-0 bg-white border border-slate-300 rounded-2xl shadow-2xl py-1.5 max-h-56 overflow-y-auto ${
                    deptDropdownPlacement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                  }`}
                >
                  <div
                    onClick={() => {
                      setFilterDept('all');
                      setIsDeptDropdownOpen(false);
                    }}
                    className={`px-3.5 py-2 text-xs sm:text-sm font-bold flex items-center justify-between cursor-pointer transition ${
                      filterDept === 'all' 
                        ? 'bg-[#0F2942] text-white' 
                        : 'text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    <span>كافة الأقسام العلمية ({departments.length})</span>
                    {filterDept === 'all' && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>

                  {departments.map((dept) => (
                    <div
                      key={dept.id}
                      onClick={() => {
                        setFilterDept(dept.id);
                        setIsDeptDropdownOpen(false);
                      }}
                      className={`px-3.5 py-2 text-xs sm:text-sm font-bold flex items-center justify-between cursor-pointer transition ${
                        filterDept === dept.id 
                          ? 'bg-[#0F2942] text-white' 
                          : 'text-slate-950 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{dept.name}</span>
                      {filterDept === dept.id && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 🔍 حقل البحث السريع */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">البحث السريع:</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالمادة، القاعة، المشرف، الرمز..."
                  className="w-full pr-9 pl-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-2xs"
                />
              </div>
            </div>

            {/* 🔄 زر إعادة الضبط */}
            {hasActiveFilters && (
              <div className="sm:col-span-1">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full py-2 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  title="إلغاء جميع الفلاتر"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تصفير</span>
                </button>
              </div>
            )}

          </div>

          {/* 🎓 أشرطة تصفية المراحل الدراسية السريعة */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">المرحلة:</span>
            {[
              { id: 'all', label: 'كافة المراحل' },
              { id: '1', label: 'المرحلة الأولى' },
              { id: '2', label: 'المرحلة الثانية' },
              { id: '3', label: 'المرحلة الثالثة' },
              { id: '4', label: 'المرحلة الرابعة' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setFilterStage(st.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterStage === st.id
                    ? 'bg-[#0F2942] text-white shadow-2xs'
                    : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

        </div>

        {/* 📋 3. منطقة جدول المصفوفة المركزية */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden shadow-xs">
            
            {/* ترويسة الجدول الثابتة */}
            <div className="grid grid-cols-12 bg-[#0F2942] text-white p-3 sm:p-3.5 text-xs sm:text-sm font-black text-center sticky top-0 z-10 shadow-2xs items-center">
              <div className="col-span-1">#</div>
              <div className="col-span-2">اليوم والتاريخ</div>
              <div className="col-span-2">التوقيت والمدة</div>
              <div className="col-span-3 text-right pr-2">المادة الأكاديمية والقسم</div>
              <div className="col-span-2">البناية والقاعة الامتحانية</div>
              <div className="col-span-2">المشرف / الاعتماد</div>
            </div>

            {/* صفوف بيانات الجدول */}
            <div className="divide-y divide-slate-200">
              {filteredSlots.map((slot, idx) => {
                const schedule = scheduleMap.get(slot.schedule_id);
                const hasCollision = collisionSlotIds.has(slot.id);

                return (
                  <div
                    key={slot.id}
                    className={`grid grid-cols-12 items-center p-3 sm:p-4 text-xs sm:text-sm font-bold text-center transition ${
                      hasCollision 
                        ? 'bg-rose-50/70 border-r-4 border-r-rose-600' 
                        : (idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/60 hover:bg-slate-100/70')
                    }`}
                  >
                    {/* 1. التسلسل */}
                    <div className="col-span-1 font-black text-slate-900 font-mono flex items-center justify-center gap-1">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center text-xs font-black border border-slate-200">
                        {idx + 1}
                      </span>
                    </div>
                    
                    {/* 2. اليوم والتاريخ */}
                    <div className="col-span-2 text-center space-y-0.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-950 border border-blue-200 rounded-md text-xs font-black inline-block">
                        {dayArabicNames[slot.exam_day] || slot.exam_day}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-950 block">
                        {slot.exam_date}
                      </span>
                    </div>

                    {/* 3. التوقيت والمدة */}
                    <div className="col-span-2 text-center space-y-1">
                      <div className="font-mono font-black text-slate-950 text-xs sm:text-sm">
                        {slot.start_time} - {slot.end_time}
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-bold inline-block font-sans">
                        {slot.duration_hours || 3} ساعات
                      </span>
                    </div>

                    {/* 4. المادة والقسم والمرحلة */}
                    <div className="col-span-3 text-right pr-2 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong className="text-slate-950 font-black text-xs sm:text-sm">
                          {slot.course_name}
                        </strong>
                        {slot.course_code && (
                          <span className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono border border-slate-300 font-bold">
                            [{slot.course_code}]
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 flex-wrap">
                        <span className="text-slate-900 font-bold">
                          {schedule ? `قسم ${schedule.department_name}` : 'القسم الأكاديمي'}
                        </span>
                        <span>•</span>
                        <span className="text-slate-700">
                          {getStageNameInArabic(slot.stage_number)}
                        </span>
                        <span>•</span>
                        <span className="text-slate-600">
                          {schedule?.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول'}
                        </span>
                        <span>•</span>
                        <span className="text-sky-800 font-black">
                          {slot.study_type === 'evening' ? 'مسائي' : 'صباحي'}
                        </span>
                      </div>
                    </div>

                    {/* 5. البناية والقاعة */}
                    <div className="col-span-2 text-center space-y-1">
                      <span className="font-black text-emerald-950 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-300 block text-xs sm:text-sm font-sans shadow-2xs">
                        {slot.hall_name}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 block truncate">
                        {slot.building_name}
                      </span>
                      {hasCollision && (
                        <span className="text-[11px] font-black text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-md inline-block">
                          🚨 تضارب إشغال قاعة
                        </span>
                      )}
                    </div>

                    {/* 6. المشرف / المراقب وموقف الاعتماد */}
                    <div className="col-span-2 text-center space-y-1">
                      <div className="flex items-center justify-center gap-1 text-slate-900 font-black text-xs">
                        <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{slot.supervisor_name || 'اللجنة الامتحانية'}</span>
                      </div>
                      <div>
                        {schedule?.status === 'approved' ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-950 rounded-md text-[10px] font-black border border-emerald-300">
                            معتمد رسمياً
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-950 rounded-md text-[10px] font-bold border border-blue-200">
                            قيد المصادقة
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}

              {/* حالة عدم وجود بيانات */}
              {filteredSlots.length === 0 && (
                <div className="p-12 text-center text-slate-600 font-bold space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="text-sm sm:text-base font-black text-slate-800">
                    لا توجد مواعيد امتحانية مطابقة للبحث أو الفلاتر المحددة.
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-2 bg-[#0F2942] hover:bg-[#16385c] text-white text-xs font-black rounded-xl cursor-pointer shadow-xs transition"
                    >
                      إعادة ضبط الفلاتر
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* 📌 4. شريط الملخص السفلي (Footer) */}
        <div className="flex-shrink-0 bg-slate-100 px-5 sm:px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs font-bold text-slate-700 gap-2">
          <div className="flex items-center gap-2">
            <span>إجمالي المعروض في المصفوفة: <strong className="text-slate-950 font-black font-mono">{filteredSlots.length}</strong> مادة</span>
            <span>من أصل <strong className="text-slate-950 font-black font-mono">{slots.length}</strong> مادة امتحانية مركزية</span>
          </div>

          <div className="text-slate-600 text-[11px] font-bold">
            جامعة الإمام جعفر الصادق (ع) - فرع ميسان | مصفوفة الامتحانات المركزية
          </div>
        </div>

      </div>
    </div>
  );
}
