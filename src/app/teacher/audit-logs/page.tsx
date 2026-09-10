'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🛡️ صفحة سجل التعديلات الشخصي الشامل للأستاذ - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect, useMemo, useRef } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والذاكرة ودورة الحياة
import { getCurrentSessionUser, syncAuditLogsFromSupabase } from '@/lib/supabase-client'; // 🔌 فحص الجلسة ودوال المزامنة السحابية
import { getStoredData, INITIAL_AUDIT_LOGS } from '@/lib/mock-data'; // 💾 قراءة بيانات السجلات
import { AuditLog, UserProfile } from '@/types'; // 🔗 واجهات الأنواع
import { 
  ShieldCheck, 
  History, 
  Clock, 
  Search, 
  Filter, 
  Users, 
  BookOpen, 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  Check,
  RotateCcw,
  FileText,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react'; // 🎨 الأيقونات SVG
import ZeroTrustGuard from '@/components/security/ZeroTrustGuard'; // 🛡️ حارس أمان Zero Trust
import { formatEnglishDateTime, translateAcademicField, getTranslatedAuditAction } from '@/lib/date-utils'; // 📅 دوال التنسيق والترجمة
import { exportCustomAuditLogsList } from '@/lib/excel-utils'; // 📊 تصدير السجل إلى Excel

// 🧹 دالة تنظيف وترجمة تفاصيل السجل النصية الإنجليزية وتحويل final_exam والمصطلحات إلى العربية الفصيحة
function cleanTranslateLogDetails(details: string | null | undefined): string {
  // فحص إذا كانت التفاصيل فارغة
  if (!details) return '';
  
  // استبدال وترجمة المصطلحات الإنجليزية بالكامل
  return details
    .replace(/final_exam/gi, 'الامتحان النهائي')
    .replace(/final/gi, 'الامتحان النهائي')
    .replace(/practical_exam/gi, 'الامتحان العملي')
    .replace(/practical/gi, 'الامتحان / السعي العملي')
    .replace(/theory/gi, 'النظري')
    .replace(/midterm_exam/gi, 'الامتحان النصفي')
    .replace(/midterm/gi, 'الامتحان النصفي')
    .replace(/quizzes/gi, 'الكويزات والواجبات')
    .replace(/quiz_1/gi, 'كويز 1')
    .replace(/quiz_2/gi, 'كويز 2')
    .replace(/assignment_1/gi, 'واجب 1')
    .replace(/assignment_2/gi, 'واجب 2')
    .replace(/assignments/gi, 'الواجبات والتكليفات')
    .replace(/reports/gi, 'التقارير والأبحاث')
    .replace(/report/gi, 'تقرير / بحث')
    .replace(/attendance/gi, 'الحضور والغياب')
    .replace(/activity/gi, 'النشاط الصفي')
    .replace(/activities/gi, 'الأنشطة الصفية')
    .replace(/coursework/gi, 'السعي الفصلي')
    .replace(/LOGIN_SUCCESS/gi, 'تسجيل دخول ناجح')
    .replace(/LOGIN_FAILED/gi, 'محاولة دخول فاشلة')
    .replace(/GRADE_MUTATION/gi, 'تعديل درجة سعي')
    .replace(/student_name/gi, 'اسم الطالب')
    .replace(/university_number/gi, 'الرقم الجامعي');
}

// 🎨 مكون القائمة المنسدلة المخصصة الاحترافية (Custom Professional Dropdown)
interface CustomSelectProps {
  label: string; // 🏷️ عنوان الحقل
  value: string; // 📌 القيمة المحددة حالياً
  onChange: (val: string) => void; // ⚡ دالة تغيير القيمة
  options: { value: string; label: string }[]; // 📋 قائمة الخيارات
  icon?: React.ReactNode; // 🎨 أيقونة اختيارية
}

function CustomSelect({ label, value, onChange, options, icon }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false); // حالة فتح/إغلاق القائمة
  const dropdownRef = useRef<HTMLDivElement>(null); // مرجع العنصر لاكتشاف النقر الخارجي

  // الخيار النشط حالياً
  const selectedOption = options.find((o) => o.value === value) || options[0];

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* تسمية القائمة باللون الأسود الصريح */}
      <label className="block text-base font-black text-black mb-2">
        {label}
      </label>

      {/* زر فتح القائمة المنسدلة الفاخر */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border-2 border-slate-300 hover:border-blue-600 rounded-2xl text-base font-black text-black flex items-center justify-between shadow-xs transition cursor-pointer active:scale-98"
      >
        <div className="flex items-center gap-2.5 truncate">
          {icon}
          <span className="truncate text-black">{selectedOption ? selectedOption.label : 'اختر...'}</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-black transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180 text-blue-900' : ''}`} />
      </button>

      {/* نافذة الخيارات المنسدلة للأسفل */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 left-0 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 rounded-xl text-base font-black flex items-center justify-between text-right transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-black hover:bg-slate-100 hover:text-black'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-5 h-5 text-white flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TeacherAuditLogsPage() {
  // 📌 الحالات الرئيسية للبيانات
  const [myLogs, setMyLogs] = useState<AuditLog[]>([]); // 📋 قائمة السجلات الخاصة بالأستاذ
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null); // 👤 بيانات الأستاذ الحالي

  // 🔍 حالات البحث والفلترة ونظام الصفحات
  const [searchTerm, setSearchTerm] = useState<string>(''); // 🔎 نص البحث
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL'); // 📘 فلترة المادة
  const [selectedField, setSelectedField] = useState<string>('ALL'); // 📝 فلترة البند الأكاديمي
  const [currentPage, setCurrentPage] = useState<number>(1); // 📄 رقم الصفحة الحالية
  const [pageSize, setPageSize] = useState<number>(10); // 🔢 عدد العناصر بالصفحة الواحدة
  const [exportNotice, setExportNotice] = useState<string>(''); // 📢 إشعار التصدير

  // 🔄 تحميل سجلات هذا الأستاذ عند بدء الصفحة
  useEffect(() => {
    // 👤 جلب بيانات المستخدم المسجل حالياً
    const user = getCurrentSessionUser();
    setCurrentUser(user);

    if (user) {
      // 💾 قراءة سجلات التدقيق وفلترة السجلات التابعة لهذا الأستاذ فقط
      const allLogs = getStoredData<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
      const filtered = allLogs.filter((l) => l.actor_id === user.id || l.actor_name === user.full_name);
      setMyLogs(filtered);

      // ☁️ جلب ومزامنة سجلات التدقيق اللحظية من Supabase
      syncAuditLogsFromSupabase().then((liveLogs) => {
        if (liveLogs && liveLogs.length > 0) {
          const liveFiltered = liveLogs.filter((l) => l.actor_id === user.id || l.actor_name === user.full_name);
          setMyLogs(liveFiltered);
        }
      }).catch(() => {});
    }

    // 🏷️ تعيين عنوان المتصفح
    if (typeof document !== 'undefined') {
      document.title = 'سجل التعديلات الأكاديمية للأستاذ | جامعة الإمام جعفر الصادق (ع) - فرع ميسان';
    }
  }, []);

  // 📊 استخراج قائمة خيارات المواد المتاحة في السجلات
  const courseOptions = useMemo(() => {
    const rawNames = myLogs
      .map((l) => l.course_name)
      .filter((name): name is string => Boolean(name && name.trim() !== ''));
    const unique = Array.from(new Set(rawNames));

    return [
      { value: 'ALL', label: 'جميع المواد الدراسية' },
      ...unique.map((c) => ({
        value: c,
        label: c,
      })),
    ];
  }, [myLogs]);

  // 📝 استخراج قائمة خيارات بنود التعديل المترجمة للعربية
  const fieldOptions = useMemo(() => {
    const rawFields = myLogs
      .map((l) => l.field_name)
      .filter((f): f is string => Boolean(f && f.trim() !== ''));
    const unique = Array.from(new Set(rawFields));

    return [
      { value: 'ALL', label: 'جميع البنود والتقييمات' },
      ...unique.map((f) => ({
        value: f,
        label: translateAcademicField(f) || getTranslatedAuditAction(f),
      })),
    ];
  }, [myLogs]);

  // 🔢 خيارات عدد العناصر بالصفحة
  const pageSizeOptions = [
    { value: '5', label: '5 عمليات في الصفحة' },
    { value: '10', label: '10 عمليات في الصفحة' },
    { value: '20', label: '20 عملية في الصفحة' },
    { value: '50', label: '50 عملية في الصفحة' },
  ];

  // 🔎 تصفية السجلات بناءً على البحث والفلترة
  const filteredLogs = useMemo(() => {
    return myLogs.filter((log) => {
      // 1. فلترة المادة الدراسية
      if (selectedCourse !== 'ALL' && log.course_name !== selectedCourse) {
        return false;
      }

      // 2. فلترة البند الأكاديمي
      if (selectedField !== 'ALL' && log.field_name !== selectedField) {
        return false;
      }

      // 3. فلترة نص البحث في اسم الطالب أو المادة أو البند أو التفاصيل
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase().trim();
        const stdName = (log.student_name || '').toLowerCase();
        const crsName = (log.course_name || '').toLowerCase();
        const fldName = (log.field_name || '').toLowerCase();
        const fldArabic = translateAcademicField(log.field_name).toLowerCase();
        const details = cleanTranslateLogDetails(log.details).toLowerCase();
        const dateStr = formatEnglishDateTime(log.created_at).toLowerCase();

        return (
          stdName.includes(query) ||
          crsName.includes(query) ||
          fldName.includes(query) ||
          fldArabic.includes(query) ||
          details.includes(query) ||
          dateStr.includes(query)
        );
      }

      return true;
    });
  }, [myLogs, selectedCourse, selectedField, searchTerm]);

  // 📄 حساب إجمالي الصفحات وتقسيم البيانات (Pagination)
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // 🔄 إعادة تعيين الصفحة الأولى عند تغيير البحث أو الفلاتر
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCourse, selectedField, pageSize]);

  // 🧮 إحصائيات سريعة للوحة العلوية بخطوط سوداء صريحة
  const metrics = useMemo(() => {
    const uniqueStudents = new Set(myLogs.map((l) => l.student_name).filter(Boolean)).size;
    const uniqueCourses = new Set(myLogs.map((l) => l.course_name).filter(Boolean)).size;
    const lastLogTime = myLogs.length > 0 ? formatEnglishDateTime(myLogs[0].created_at) : 'لا يوجد';
    return {
      total: myLogs.length,
      students: uniqueStudents,
      courses: uniqueCourses,
      lastUpdate: lastLogTime,
    };
  }, [myLogs]);

  // 📊 دالة تصدير السجلات المعروضة إلى ملف Excel
  const handleExportExcel = async () => {
    if (filteredLogs.length === 0) return;
    await exportCustomAuditLogsList(filteredLogs, currentUser?.full_name || 'الأستاذ');
    setExportNotice(`تم تصدير (${filteredLogs.length}) تعديل إلى ملف Excel بنجاح! 📊`);
    setTimeout(() => setExportNotice(''), 3500);
  };

  // 🔄 دالة تصفير جميع الفلاتر والبحث
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCourse('ALL');
    setSelectedField('ALL');
    setCurrentPage(1);
  };

  return (
    <ZeroTrustGuard allowedRoles={['teacher', 'super_admin', 'admin']} redirectFallback="/?portal=teacher">
      {/* 🏛️ الحاوية المتناسقة مع هوامش آمنة من الحواف */}
      <div className="space-y-6 font-sans w-full max-w-[1900px] mx-auto px-2 sm:px-4 py-4" dir="rtl">
        
        {/* 🏛️ هيدر الصفحة الرسمي والأكاديمي */}
        <div className="bg-white border border-slate-300 p-6 sm:p-7 rounded-3xl shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-black flex items-center gap-3">
              <span className="p-2.5 bg-blue-100 text-blue-950 rounded-2xl">
                <ShieldCheck className="w-7 h-7 text-blue-950" />
              </span>
              <span>سجل التعديلات والعمليات الشخصي للأستاذ</span>
            </h1>
            <p className="text-base sm:text-lg font-black text-black">
              متابعة وتوثيق جميع التعديلات والدرجات التي قمت بها في موادك الدراسية وفق معايير مسار بولونيا
            </p>
          </div>

          {/* زر تصدير السجل إلى Excel */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              disabled={filteredLogs.length === 0}
              className="px-5 py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-2xl text-base shadow-sm transition flex items-center gap-2.5 cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>تصدير كشف Excel</span>
            </button>
          </div>
        </div>

        {/* 📢 إشعار التصدير الناجح */}
        {exportNotice && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-400 text-black rounded-2xl font-black text-base flex items-center gap-2.5 shadow-xs animate-fade-in">
            <CheckCircle2 className="w-6 h-6 text-emerald-700 flex-shrink-0" />
            <span className="text-black">{exportNotice}</span>
          </div>
        )}

        {/* 📊 بطاقات الإحصائيات السريعة الأربعة بنصوص سوداء واضحة تماماً */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* إجمالي العمليات */}
          <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-950 rounded-2xl">
              <History className="w-6 h-6 text-blue-950" />
            </div>
            <div>
              <p className="text-base font-black text-black">إجمالي العمليات المسجلة</p>
              <p className="text-2xl sm:text-3xl font-black text-black mt-0.5">{metrics.total} عملية</p>
            </div>
          </div>

          {/* الطلاب المعدل عليهم */}
          <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-950 rounded-2xl">
              <Users className="w-6 h-6 text-emerald-900" />
            </div>
            <div>
              <p className="text-base font-black text-black">الطلبة المتأثرون بالتعديل</p>
              <p className="text-2xl sm:text-3xl font-black text-black mt-0.5">{metrics.students} طالب/ـة</p>
            </div>
          </div>

          {/* المواد المعنية */}
          <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="p-3 bg-indigo-100 text-indigo-950 rounded-2xl">
              <BookOpen className="w-6 h-6 text-indigo-950" />
            </div>
            <div>
              <p className="text-base font-black text-black">المواد الدراسية المعنية</p>
              <p className="text-2xl sm:text-3xl font-black text-black mt-0.5">{metrics.courses} مادة</p>
            </div>
          </div>

          {/* توقيت آخر عملية */}
          <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="p-3 bg-cyan-100 text-cyan-950 rounded-2xl">
              <Clock className="w-6 h-6 text-cyan-950" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-black text-black">آخر تعديل مسجل</p>
              <p className="text-base sm:text-lg font-black text-black mt-0.5 truncate" dir="ltr">
                {metrics.lastUpdate}
              </p>
            </div>
          </div>
        </div>

        {/* 🔍 صندوق البحث والفلترة المتقدمة بالقوائم المنسدلة الاحترافية */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 text-xl font-black text-black">
              <Filter className="w-5 h-5 text-blue-950" />
              <span>البحث وتصفية السجلات</span>
            </div>
            
            {(searchTerm || selectedCourse !== 'ALL' || selectedField !== 'ALL') && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer border border-slate-300"
              >
                <RotateCcw className="w-4 h-4 text-black" />
                <span>إعادة ضبط الفلاتر</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 🔎 حقل البحث النصي المطور */}
            <div className="relative">
              <label className="block text-base font-black text-black mb-2">
                بحث بالاسم، المادة، أو البند:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="اكتب اسم الطالب، المادة، أو البند..."
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-300 rounded-2xl text-base font-black text-black placeholder:text-slate-500 focus:border-blue-600 focus:outline-hidden transition shadow-xs"
                />
                <Search className="w-5 h-5 text-black absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* 📘 القائمة المنسدلة الاحترافية لتصفية المواد الدراسية */}
            <CustomSelect
              label="تصفية حسب المادة الدراسية:"
              value={selectedCourse}
              onChange={setSelectedCourse}
              options={courseOptions}
              icon={<BookOpen className="w-4 h-4 text-blue-900" />}
            />

            {/* 📝 القائمة المنسدلة الاحترافية لتصفية البنود الأكاديمية */}
            <CustomSelect
              label="تصفية حسب نوع البند:"
              value={selectedField}
              onChange={setSelectedField}
              options={fieldOptions}
              icon={<FileText className="w-4 h-4 text-indigo-900" />}
            />
          </div>
        </div>

        {/* 📜 قائمة عرض التعديلات المفصلة */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <h2 className="text-xl sm:text-2xl font-black text-black flex items-center gap-2.5">
              <History className="w-6 h-6 text-blue-950" />
              <span>العمليات المطابقة ({filteredLogs.length})</span>
            </h2>

            {/* قائمة منسدلة أنيقة لاختيار عدد العناصر لكل صفحة */}
            <div className="w-52">
              <CustomSelect
                label="عرض في الصفحة:"
                value={String(pageSize)}
                onChange={(v) => setPageSize(Number(v))}
                options={pageSizeOptions}
              />
            </div>
          </div>

          {/* عرض البطاقات السجلية بنصوص سوداء واضحة وترجمة شاملة */}
          <div className="space-y-4">
            {paginatedLogs.map((log) => {
              // ترجمة اسم البند وتفاصيل السجل بالكامل
              const arabicField = translateAcademicField(log.field_name);
              const cleanDetails = cleanTranslateLogDetails(log.details);
              // اسم المادة كما هو مسجل في النظام
              const courseDisplayName = log.course_name || 'غير محدد';

              return (
                <div 
                  key={log.id} 
                  className="p-5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-400 rounded-2xl transition-all shadow-xs hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* 👤 معلومات الطالب والمادة والبند */}
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-lg sm:text-xl font-black text-black flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-950" />
                        <span>الطالب: {log.student_name || 'طالب مخصص'}</span>
                      </span>

                      {/* شارة البند الأكاديمي المترجم بالكامل */}
                      <span className="px-3.5 py-1 bg-blue-100 text-blue-950 border border-blue-300 rounded-xl text-base font-black flex items-center gap-1.5 shadow-2xs">
                        <FileText className="w-4 h-4 text-blue-950" />
                        <span>{arabicField}</span>
                      </span>
                    </div>

                    {/* المادة والتفاصيل المترجمة الصريحة */}
                    <div className="flex flex-wrap items-center gap-2 text-base font-black text-black">
                      <span className="px-3 py-1 bg-slate-100 text-black border border-slate-300 rounded-xl text-sm font-black flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-black" />
                        <span>المادة: {courseDisplayName}</span>
                      </span>

                      {cleanDetails && cleanDetails !== 'تعديل درجة' && (
                        <span className="text-black text-base font-black">
                          • {cleanDetails}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 🔄 القيم السابقة والجديدة والتوقيت */}
                  <div className="flex flex-wrap items-center gap-4 md:justify-end">
                    {/* مقارنة الدرجة (السابق -> الجديد) */}
                    <div className="flex items-center gap-2.5 bg-slate-50 border-2 border-slate-200 px-4 py-2.5 rounded-xl text-base font-black shadow-2xs">
                      <span className="text-black text-sm font-black">السابق:</span>
                      <span className="px-3 py-1 bg-rose-100 text-rose-950 border border-rose-300 rounded-lg text-base font-black">
                        {log.old_value !== null && log.old_value !== undefined ? String(log.old_value) : '0'}
                      </span>
                      
                      <ArrowLeft className="w-4 h-4 text-black" />
                      
                      <span className="text-black text-sm font-black">الجديد:</span>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-lg text-base font-black">
                        {log.new_value !== null && log.new_value !== undefined ? String(log.new_value) : '0'}
                      </span>
                    </div>

                    {/* توقيت التعديل */}
                    <div className="text-base font-black text-black bg-slate-50 border-2 border-slate-200 px-4 py-2.5 rounded-xl flex items-center gap-2" dir="ltr">
                      <Clock className="w-4 h-4 text-black" />
                      <span>{formatEnglishDateTime(log.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* حالة عدم وجود سجلات */}
            {filteredLogs.length === 0 && (
              <div className="text-center py-14 bg-slate-50 rounded-2xl border-2 border-slate-200 text-black space-y-2">
                <History className="w-10 h-10 text-black mx-auto" />
                <p className="text-xl font-black text-black">لا توجد عمليات تعديل مطابقة لمعايير البحث الحالية.</p>
                <p className="text-base font-black text-black">يمكنك تجربة كتابة اسم مختلف أو إعادة ضبط خيارات الفلترة.</p>
              </div>
            )}
          </div>

          {/* 📄 شريط التنقل بين الصفحات (Pagination Bar) */}
          {totalPages > 1 && (
            <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-base font-black text-black">
                عرض الصفحات: <span className="text-black font-black">{currentPage}</span> من إجمالي <span className="text-black font-black">{totalPages}</span> صفحة
                ({filteredLogs.length} عملية)
              </div>

              <div className="flex items-center gap-2">
                {/* زر السابق */}
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-black font-black rounded-xl text-base transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed border border-slate-300"
                >
                  <ChevronRight className="w-5 h-5 text-black" />
                  <span>السابق</span>
                </button>

                {/* أزرار أرقام الصفحات */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // إظهار الصفحات القريبة من الصفحة الحالية فقط إذا كان العدد كبيراً
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-11 h-11 rounded-xl font-black text-base transition cursor-pointer ${
                            currentPage === page
                              ? 'bg-[#0F2942] text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-black border border-slate-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }
                    if (page === currentPage - 3 || page === currentPage + 3) {
                      return <span key={page} className="px-1 text-black font-black">...</span>;
                    }
                    return null;
                  })}
                </div>

                {/* زر التالي */}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-black font-black rounded-xl text-base transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed border border-slate-300"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-5 h-5 text-black" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </ZeroTrustGuard>
  );
}
