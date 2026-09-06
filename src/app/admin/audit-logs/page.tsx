'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🛡️ صفحة سجل التدقيق الحصين الشامل الكحلية لجميع التعديلات - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect, useRef } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة ودورة الحياة والمراجع
import { useRouter } from 'next/navigation'; // 🛣️ موجه المسارات
import { getCurrentSessionUser, syncAuditLogsFromSupabase, clearAuditLogsInSupabase, deleteAuditLogsFromSupabase } from '@/lib/supabase-client'; // 🔌 فحص الجلسة ومزامنة وحذف السجلات السحابية
import { getStoredData, saveStoredData, INITIAL_AUDIT_LOGS, getAcademicYear, formatAcademicYearDisplay } from '@/lib/mock-data'; // 💾 التخزين ومساعد تنسيق العام الدراسي
import { AuditLog } from '@/types'; // 🔗 الأنواع الرسمية
import { 
  ShieldCheck, 
  Search, 
  History, 
  Clock, 
  ChevronDown, 
  Check, 
  CheckCircle2, // 🟢 أيقونة التحقق للتنبيه العائم
  X, // ✕ أيقونة إغلاق التنبيه العائم
  Download, 
  Trash2, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeft
} from 'lucide-react'; // 🎨 استيراد أيقونات Lucide SVG النقية ومنها سهم التحول ArrowLeft
import ZeroTrustGuard from '@/components/security/ZeroTrustGuard'; // 🛡️ حارس أمان Zero Trust
import { formatEnglishDateTime, getTranslatedAuditAction, translateAuditDetails, translateAuditValue, formatAuditActorName } from '@/lib/date-utils'; // 📅 تنسيق التواريخ بالأرقام الإنجليزية وترجمة مصطلحات السجل
import { exportCustomAuditLogsList } from '@/lib/excel-utils'; // 📊 تصدير سجلات التدقيق
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'; // 🗑️ كارد الحذف الاحترافي

export default function AdminAuditLogsPage() {
  const router = useRouter();
  // 📌 الحالات
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]); // 💾 مصفوفة السجلات الكاملة
  const [searchTerm, setSearchTerm] = useState<string>(''); // 🔍 نص البحث
  const [selectedField, setSelectedField] = useState<string>('ALL'); // 📑 الحقل المختار
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false); // 📂 حالة فتح القائمة
  const dropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع القائمة المنسدلة

  // 📑 حالات نظام التصفح بالصفحات (Pagination) لتوفير الذاكرة ومنع ثقل المتصفح
  const [currentPage, setCurrentPage] = useState<number>(1); // 📄 رقم الصفحة المعروضة حالياً
  const [pageSize, setPageSize] = useState<number>(15); // 🔢 عدد السجلات المعروضة في الصفحة الواحدة
  const [isPageSizeDropdownOpen, setIsPageSizeDropdownOpen] = useState<boolean>(false); // 📂 حالة فتح قائمة اختيار عدد السجلات المخصصة
  const pageSizeDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع عنصر قائمة عدد السجلات لإغلاقها عند النقر بالخارج

  // 📋 خيارات حقول التعديل
  const fieldOptions = [
    { value: 'ALL', label: 'جميع الحقول والعمليات' },
    { value: 'كويز 1', label: 'كويز 1' },
    { value: 'كويز 2', label: 'كويز 2' },
    { value: 'واجب 1', label: 'واجب 1' },
    { value: 'واجب 2', label: 'واجب 2' },
    { value: 'تقرير', label: 'تقرير' },
    { value: 'نصفي', label: 'امتحان نصفي' },
    { value: 'عملي', label: 'امتحان عملي' },
    { value: 'نهائي', label: 'امتحان نهائي' },
    { value: 'UNAUTHORIZED_ROUTE_ACCESS', label: 'وصول غير مصرح' },
    { value: 'WAF_ANOMALY_BLOCKED', label: 'حظر جدار الحماية' },
    { value: 'WAF_RULE_TRIGGERED', label: 'تنبيه جدار الحماية' },
    { value: 'LOGIN_SUCCESS', label: 'تسجيل دخول ناجح' },
    { value: 'LOGIN_FAILED', label: 'محاولة دخول فاشلة' },
    { value: 'ACCOUNT_LOCKED', label: 'قفل الحساب' },
  ];

  // 🔒 إغلاق القوائم المنسدلة عند النقر في أي مكان خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 🔒 فحص قائمة نوع العملية
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false); // ❌ إغلاق قائمة الحقول
      }
      // 🔒 فحص قائمة عدد السجلات لكل صفحة
      if (pageSizeDropdownRef.current && !pageSizeDropdownRef.current.contains(event.target as Node)) {
        setIsPageSizeDropdownOpen(false); // ❌ إغلاق قائمة عدد السجلات
      }
    };
    document.addEventListener('mousedown', handleClickOutside); // 👂 الاستماع لنقرات الفأرة
    return () => {
      document.removeEventListener('mousedown', handleClickOutside); // 🧹 تنظيف المستمع عند إلغاء التحميل
    };
  }, []);

  // 🔄 فحص الجلسة وقراءة السجل الحصين
  useEffect(() => {
    const user = getCurrentSessionUser();
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
      router.push('/sadmin');
      return;
    }
    setAuditLogs(getStoredData<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS));

    // ☁️ مزامنة سجل التدقيق اللحظي من Supabase
    syncAuditLogsFromSupabase().then((liveLogs) => {
      if (liveLogs && liveLogs.length > 0) setAuditLogs(liveLogs);
    }).catch(() => {});

    // 🏷️ تعيين عنوان المتصفح
    if (typeof document !== 'undefined') {
      document.title = 'سجل التدقيق والتتبع الأمني | جامعة الإمام جعفر الصادق (ع) - فرع ميسان';
    }
  }, [router]);

  // 🔘 حالات نظام التحديد المتعدد لسجلات التدقيق
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // 🔘 دوال نظام التحديد والإجراءات الجماعية لسجلات التدقيق
  const toggleSelectAll = (list: AuditLog[]) => {
    if (selectedLogIds.length === list.length && list.length > 0) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(list.map((l) => l.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedLogIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const confirmBulkDeleteLogs = () => {
    const count = selectedLogIds.length;
    if (count === 0) return;

    const idsToDelete = [...selectedLogIds]; // 📋 نسخ المعرفات قبل التصفير
    const updated = auditLogs.filter((l) => !selectedLogIds.includes(l.id));
    setAuditLogs(updated);
    saveStoredData('audit_logs', updated);
    deleteAuditLogsFromSupabase(idsToDelete); // ☁️ حذف السجلات المحددة من جدول audit_logs في Supabase فوراً
    setSelectedLogIds([]);
    setIsBulkDeleting(false);
    setSuccessMessage(`تم حذف (${count}) سجل من سجلات التدقيق بنجاح.`);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  const confirmClearAllLogs = () => {
    setAuditLogs([]);
    saveStoredData('audit_logs', []);
    clearAuditLogsInSupabase(); // ☁️ تفريغ وأرشفة السجلات في جدول audit_logs بسحابة Supabase
    setSelectedLogIds([]);
    setIsClearAllModalOpen(false);
    setSuccessMessage('تم تفريغ وأرشفة سجل التدقيق بالكامل بنجاح.');
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // 🔄 تصفير الصفحة الحالية للبداية كلما تغير نص البحث أو الفلتر
  useEffect(() => {
    setCurrentPage(1); // 📄 الرجوع للصفحة الأولى لمنع ظهور صفحة فارغة
  }, [searchTerm, selectedField]);

  const handleBulkExportExcel = async (list: AuditLog[]) => {
    const targetLogs = selectedLogIds.length > 0 ? list.filter((l) => selectedLogIds.includes(l.id)) : list; // 📋 السجلات المستهدفة بالتصدير
    if (targetLogs.length === 0) return; // 🚫 إذا فارغة نتوقف

    await exportCustomAuditLogsList(targetLogs, 'كلية_ميسان'); // 📊 توليد ملف الإكسل
    setSuccessMessage(`تم تصدير (${targetLogs.length}) سجل إلى ملف إكسل بنجاح!`); // 📢 رسالة نجاح نقية بدون إيموجي
    setTimeout(() => setSuccessMessage(''), 3500); // ⏳ إخفاء الرسالة بعد 3.5 ثانية
  };

  // 🔍 تصفية وفلترة وترتيب السجلات الأحدث أولاً
  const filteredLogs = auditLogs
    .filter((log: AuditLog) => {
      const actorName = log.actor_name || log.user_name || ''; // 👤 اسم المنفذ
      const studentName = log.student_name || ''; // 🎓 اسم الطالب
      const courseName = log.course_name || ''; // 📘 اسم المادة

      const matchesSearch =
        actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        courseName.toLowerCase().includes(searchTerm.toLowerCase()); // 🔍 مطابقة البحث

      const matchesField = selectedField === 'ALL' || log.field_name === selectedField; // 📑 مطابقة الحقل

      return matchesSearch && matchesField; // ✔️ الشرطان معاً
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // 🕒 الأحدث أولاً

  // 🧮 حسابات التصفح بالصفحات لتقليص استهلاك الذاكرة
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize)); // 📊 إجمالي عدد الصفحات
  const startIndex = (currentPage - 1) * pageSize; // 📍 مؤشر بداية الصفحة الحالية
  const endIndex = Math.min(startIndex + pageSize, filteredLogs.length); // 📍 مؤشر نهاية الصفحة
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex); // ✂️ تقطيع وعرض سجلات الصفحة المحددة فقط دون تحميل الكل بالـ DOM

  return (
    <ZeroTrustGuard allowedRoles={['super_admin', 'admin']} redirectFallback="/sadmin">
      {/* 🏛️ الحاوية العريضة لتقليل المساحات الجانبية الفارغة */}
      <div className="space-y-6 font-sans w-full max-w-[1900px] mx-auto px-2 sm:px-4 py-4" dir="rtl">

      {/* 🔔 التنبيه العائم الفاخر (Light Mode أبيض ناصع) متطابق مع باقي شاشات المنظومة */}
      {successMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200" dir="rtl">
          <div className="p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-emerald-500/80 ring-4 ring-emerald-400/10 flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 border-2 border-emerald-300 rounded-2xl shadow-2xs shrink-0">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-right">
                <h4 className="font-black text-base text-slate-950">إشعار النظام الأكاديمي</h4>
                <p className="font-black text-sm text-slate-950 mt-0.5">{successMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 hover:text-slate-900 border border-slate-300 flex items-center justify-center transition cursor-pointer shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}
      
      {/* 🏛️ هيدر الصفحة الكحلي عريض وبحدود ناعمة مع أزرار الإجراءات */}
      <div className="bg-white border border-slate-200 p-6 sm:p-7 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 font-black text-sm rounded-lg">
              صلاحية المسؤول العام
            </span>
            <span className="px-3 py-0.5 bg-indigo-50 text-indigo-950 border border-indigo-200 font-black text-sm rounded-lg flex items-center gap-1.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-700" />
              <span>العام الدراسي <bdi dir="ltr">{formatAcademicYearDisplay(getAcademicYear())}</bdi></span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-3"> {/* 🏷️ عنوان الصفحة الرئيسي */}
            <ShieldCheck className="w-8 h-8 text-indigo-700" /> {/* 🛡️ أيقونة الدرع الأمني */}
            <span>سجل التدقيق والمراقبة الحصين للنظام</span> {/* 📝 نص العنوان */}
          </h1>
          <p className="text-base text-slate-950 font-black mt-1.5"> {/* 🖤 الوصف التوضيحي باللون الأسود الفاحم بدلاً من الرمادي */}
            جامعة الإمام جعفر الصادق (ع) - فرع ميسان | تتبع فوري لجميع تعديلات الدرجات والأحداث الأمنية
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 📊 زر تصدير السجل كملف إكسل باللون الكحلي الملكي الفاخر المطابق لتبويب سجل التدقيق */}
          <button
            type="button"
            onClick={() => handleBulkExportExcel(filteredLogs)}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black text-sm rounded-xl transition flex items-center gap-2 cursor-pointer border border-[#1e4570] shadow-xs active:scale-95"
          >
            <Download className="w-4 h-4 text-cyan-300" />
            <span>تصدير السجل كملف إكسل</span>
          </button>

          {auditLogs.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearAllModalOpen(true)}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-950 border border-rose-200 font-black text-sm rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <Trash2 className="w-4 h-4 text-rose-700" />
              <span>تفريغ السجل</span>
            </button>
          )}
        </div>
      </div>

      {/* 🔍 شريط البحث والتصفية بحسب الحقول المعدلة بحدود ناعمة وبقاء القوائم المنسدلة داخل الشاشة */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* 🔎 حقل البحث النصي وزر تحديد الكل */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-1">
          <button
            type="button"
            onClick={() => toggleSelectAll(filteredLogs)}
            className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-950 rounded-2xl font-black text-sm transition cursor-pointer border border-slate-300 whitespace-nowrap shadow-2xs"
          >
            {selectedLogIds.length === filteredLogs.length && filteredLogs.length > 0 ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
          </button>
          <div className="relative flex-1 md:max-w-md"> {/* 🔍 حقل البحث التفاعلي */}
            <Search className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-950 pointer-events-none" /> {/* 🖤 أيقونة البحث باللون الأسود الداكن */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم الأستاذ، الطالب، أو نوع العملية..."
              className="w-full pl-4 pr-11 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-950 placeholder:text-slate-500 focus:border-indigo-600 focus:outline-none transition-all" // 🖤 نص الإدخال بالأسود الفاحم
            />
          </div>
        </div>

        {/* 📑 تصفية حسب الحقل المعدل - قائمة مخصصة أنيقة تفتح للداخل ولا تخرج خارج الشاشة */}
        <div className="relative flex items-center gap-2.5" ref={dropdownRef}>
          <span className="text-base font-black text-slate-950 whitespace-nowrap">نوع العملية أو الحقل:</span>
          
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between gap-3 px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-950 hover:bg-slate-100 hover:border-slate-400 focus:outline-none transition-all min-w-[240px] cursor-pointer shadow-2xs"
          >
            <span>{fieldOptions.find(o => o.value === selectedField)?.label || 'جميع الحقول والعمليات'}</span>
            <ChevronDown className={`w-5 h-5 text-slate-950 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} /> {/* 🖤 سهم القائمة المنسدلة بالأسود */}
          </button>

          {/* 📋 القائمة المنسدلة التفاعلية المحمية والمقيدة للداخل */}
          {isDropdownOpen && (
            <div 
              className="absolute left-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto"
            >
              {fieldOptions.map((opt) => {
                const isSelected = selectedField === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedField(opt.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-right px-4 py-3.5 text-base font-black flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#0F2942] text-white font-black'
                        : 'text-slate-950 hover:bg-slate-50 hover:text-black'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-5 h-5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* 🎛️ شريط الإجراءات الجماعية لسجلات التدقيق */}
      {selectedLogIds.length > 0 && (
        <div className="bg-[#0F2942] text-white p-4 sm:px-6 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-[#1e4570] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-cyan-300 rounded-xl border border-cyan-400/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-base text-white">
                تم تحديد <strong className="text-cyan-300 font-mono text-lg font-black">({selectedLogIds.length})</strong> من أصل <span className="font-mono text-slate-300">({filteredLogs.length})</span> سجل
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBulkDeleting(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف المحدد ({selectedLogIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkExportExcel(filteredLogs)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>تصدير المحدد كملف إكسل</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedLogIds([])}
              className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-black text-sm transition cursor-pointer"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* 📜 عرض سجل التعديلات التفصيلي الصريح عريض الشاشة بحدود ناعمة ومترجم 100% */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2.5">
          <History className="w-6 h-6 text-indigo-700" />
          <span>سجل الأحداث الموثقة ({filteredLogs.length})</span>
        </h2>

        <div className="space-y-3.5"> {/* 📦 حاوية بطاقات السجلات المعروضة في الصفحة الحالية */}
          {paginatedLogs.map((log: AuditLog, localIndex: number) => { // 🔁 تكرار فقط سجلات الصفحة الحالية لمنع إرهاق الذاكرة
            const index = startIndex + localIndex; // 🔢 حساب التسلسل العام الدقيق عبر الصفحات
            const isSecurityEvent = 
              log.field_name?.startsWith('LOGIN') || 
              log.field_name?.startsWith('WAF') || 
              log.field_name?.startsWith('UNAUTHORIZED') || 
              log.field_name?.startsWith('ACCOUNT') || 
              log.field_name?.startsWith('RATE') ||
              log.field_name?.startsWith('SESSION') ||
              log.field_name?.startsWith('SSRF') ||
              log.field_name?.startsWith('DDOS') ||
              log.field_name?.startsWith('DOM') ||
              log.field_name?.startsWith('HONEYPOT');

            const translatedAction = getTranslatedAuditAction(log.field_name || log.action);
            const translatedDetails = translateAuditDetails(log.student_name || log.details || '');
            const translatedCourse = translateAuditDetails(log.course_name || 'بوابة النظام');
            const translatedOldVal = translateAuditValue(log.old_value);
            const translatedNewVal = translateAuditValue(log.new_value);
            const translatedActor = formatAuditActorName(log.actor_name);
            const isSelected = selectedLogIds.includes(log.id);

            return (
              <div
                key={log.id}
                className={`p-5 rounded-2xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isSelected ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-400/50' : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      type="checkbox"
                      aria-label={`تحديد سجل ${translatedActor}`}
                      checked={isSelected}
                      onChange={() => toggleSelect(log.id)}
                      className="w-5 h-5 rounded-md border-2 border-slate-400 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                    />
                    <span className="inline-flex items-center justify-center min-w-[28px] px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-sm font-black text-slate-950 shadow-2xs">
                      {index + 1}
                    </span>
                    <span className="font-black text-slate-950 text-base sm:text-lg">{translatedActor}</span>
                    <span className="px-3.5 py-1.5 bg-[#0F2942] text-white text-sm font-black rounded-xl shadow-xs border border-[#1e4570]">
                      {log.actor_role === 'teacher' ? 'تدريسي' : 'مشرف أدمن'}
                    </span>
                    <span className="text-slate-950 font-bold">•</span> {/* 🖤 نقطة الفصل بالأسود */}
                    <span className="text-base text-slate-950 font-black"> {/* 🖤 تفاصيل الحقل بالأسود الفاحم */}
                      {isSecurityEvent ? 'نوع الإجراء الأمني:' : 'عدل حقل:'} <strong className="text-slate-950 font-black">{translatedAction}</strong>
                    </span>
                  </div>

                  <p className="text-base text-slate-950 font-black"> {/* 🖤 تفاصيل السجل بالأسود الفاحم */}
                    {isSecurityEvent ? (
                      <span>تفاصيل الحدث: <span className="text-slate-950 font-black">{translatedDetails}</span></span>
                    ) : (
                      <>
                        الطالب: <span className="text-slate-950 font-black">{log.student_name}</span> | المادة: <span className="text-slate-950 font-black">{translatedCourse}</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-base font-black bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs"> {/* 📦 بطاقة الحالة */}
                    <span className="text-slate-950 text-sm font-black">الحالة السابقة:</span> {/* 🖤 عنوان الحالة السابقة بالأسود */}
                    <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-xl font-black">{translatedOldVal}</span> {/* 🔴 القيمة القديمة */}
                    <ArrowLeft className="w-4 h-4 text-slate-950 shrink-0" /> {/* ⬅️ أيقونة سهم التحول بالأسود الداكن */}
                    <span className="text-slate-950 text-sm font-black">{isSecurityEvent ? 'مستوى الخطورة:' : 'الحالة الجديدة:'}</span> {/* 🖤 عنوان الحالة الجديدة بالأسود */}
                    <span className={`px-2.5 py-1 rounded-xl font-black border ${
                      translatedNewVal.includes('حرج') ? 'bg-red-100 text-red-800 border-red-300' :
                      translatedNewVal.includes('مرتفع') ? 'bg-sky-50 text-sky-800 border-sky-300' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>{translatedNewVal}</span>
                  </div>

                  <div className="text-left text-sm text-slate-950 font-black flex items-center gap-1.5 bg-slate-100 px-4 py-2.5 rounded-2xl border border-slate-200" dir="ltr"> {/* 🖤 توقيت السجل بالأسود */}
                    <Clock className="w-4 h-4 text-slate-950" /> {/* 🖤 أيقونة الساعة بالأسود */}
                    <span>{formatEnglishDateTime(log.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-slate-950 text-base font-black"> {/* 🖤 رسالة لا توجد نتائج بالأسود الفاحم */}
              لا توجد نتائج مطابقة لخصائص البحث في سجل التدقيق.
            </div>
          )}
        </div>

        {/* 📑 شريط التحكم بنظام الصفحات (Pagination Controller) لتوفير الذاكرة وتسهيل التصفح */}
        {filteredLogs.length > 0 && (
          <div className="pt-4 mt-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 select-none">
            
            {/* 📊 إحصائية ومؤشر السجلات المعروضة في الصفحة الحالية */}
            <div className="flex items-center gap-3 text-sm sm:text-base font-black text-slate-950 flex-wrap">
              <span>
                عرض السجلات من <strong className="text-indigo-900 font-mono text-base font-black">{startIndex + 1}</strong> إلى{' '}
                <strong className="text-indigo-900 font-mono text-base font-black">{endIndex}</strong> من أصل{' '}
                <strong className="text-slate-950 font-mono text-base font-black">({filteredLogs.length})</strong> سجل
              </span>

              <span className="text-slate-300 font-bold hidden sm:inline">•</span>

              {/* 🔢 اختيار عدد السجلات المعروضة بكل صفحة بتصميم مخصص فاخر واحترافي */}
              <div className="relative flex items-center gap-2" ref={pageSizeDropdownRef}> {/* 📐 حاوية القائمة المنسدلة المخصصة */}
                <span className="text-slate-950 text-sm font-black whitespace-nowrap">لكل صفحة:</span> {/* 🖤 نص التسمية بالأسود الداكن */}
                
                {/* 🔘 زر فتح وإغلاق قائمة حجم الصفحة التفاعلي الاحترافي */}
                <button
                  type="button" // 🔘 نوع الزر
                  onClick={() => setIsPageSizeDropdownOpen(!isPageSizeDropdownOpen)} // ⚡ تبديل حالة الفتح والإغلاق
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl text-sm font-black text-slate-950 flex items-center justify-between gap-2 transition cursor-pointer shadow-2xs focus:outline-none min-w-[105px]" // 🎨 تنسيق الزر الفاخر
                >
                  <span>{pageSize === 10 ? '10 سجلات' : `${pageSize} سجل`}</span> {/* 🏷️ القيمة الحالية المختارة */}
                  <ChevronDown className={`w-4 h-4 text-slate-950 transition-transform duration-200 ${isPageSizeDropdownOpen ? 'rotate-180' : ''}`} /> {/* 🔽 سهم الدوران المتفاعل */}
                </button>

                {/* 📋 القائمة المنسدلة المخصصة للأعلى بتأثير زجاجي أنيق وأيقونة تأكيد SVG */}
                {isPageSizeDropdownOpen && ( // 🔍 إظهار القائمة فقط عند الفتح
                  <div 
                    className="absolute right-0 bottom-full mb-2 w-36 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1" // 📦 صندوق القائمة للأعلى
                  >
                    {[10, 15, 25, 50, 100].map((size) => { // 🔢 المرور على الخيارات
                      const isSelected = pageSize === size; // 🔍 التحقق إذا كان الخيار محدد
                      return (
                        <button
                          key={size} // 🔑 مفتاح العنصر
                          type="button" // 🔘 نوع الزر
                          onClick={() => {
                            setPageSize(size); // 🔢 تعيين عدد السجلات الجديد
                            setCurrentPage(1); // 📄 إعادة الضبط للصفحة الأولى
                            setIsPageSizeDropdownOpen(false); // ❌ إغلاق القائمة بعد الاختيار
                          }}
                          className={`w-full text-right px-3 py-2 rounded-xl text-sm font-black transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#0F2942] text-white shadow-xs' // 🌟 الخيار المحدد باللون الكحلي الأكاديمي
                              : 'text-slate-950 hover:bg-slate-100' // ⚪ الخيارات الأخرى بنص أسود وتفاعل ناعم
                          }`}
                        >
                          <span>{size === 10 ? '10 سجلات' : `${size} سجل`}</span> {/* 📝 نص الخيار */}
                          {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />} {/* ✔️ أيقونة الصح SVG النقية للخيار النشط */}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 🔘 أزرار التنقل بين الصفحات وأرقام الصفحات */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              
              {/* ◀️ زر الصفحة الأولى */}
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="الصفحة الأولى"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>

              {/* ◀️ زر الصفحة السابقة */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 text-sm font-black cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابقة</span>
              </button>

              {/* 🔢 أرقام الصفحات التفاعلية بذكاء النافذة المنزلقة */}
              <div className="flex items-center gap-1">
                {(() => {
                  const pages: (number | string)[] = []; // 📋 قائمة أرقام الصفحات
                  const delta = 2; // 📏 عدد الصفحات حول الحالية
                  const left = Math.max(1, currentPage - delta); // 📍 الحد الأدنى
                  const right = Math.min(totalPages, currentPage + delta); // 📍 الحد الأقصى

                  if (left > 1) {
                    pages.push(1);
                    if (left > 2) pages.push('...'); //  نقط تخطي
                  }

                  for (let i = left; i <= right; i++) {
                    pages.push(i);
                  }

                  if (right < totalPages) {
                    if (right < totalPages - 1) pages.push('...'); // نقط تخطي
                    pages.push(totalPages);
                  }

                  return pages.map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span key={`dots-${idx}`} className="px-2 text-slate-400 font-black text-sm">
                          ...
                        </span>
                      );
                    }
                    const pageNum = Number(p);
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[36px] h-9 px-2 rounded-xl text-sm font-black transition cursor-pointer flex items-center justify-center ${
                          isActive
                            ? 'bg-[#0F2942] text-white shadow-xs font-black'
                            : 'bg-slate-50 border border-slate-200 text-slate-950 hover:bg-slate-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  });
                })()}
              </div>

              {/* ▶️ زر الصفحة التالية */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 text-sm font-black cursor-pointer shadow-2xs"
              >
                <span>التالية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* ▶️ زر الصفحة الأخيرة */}
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="الصفحة الأخيرة"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}
      </div>

      {/* 🗑️ كارد تأكيد الحذف الجماعي للسجلات المحددة */}
      <ConfirmDeleteModal
        isOpen={isBulkDeleting}
        onClose={() => setIsBulkDeleting(false)}
        title={`تأكيد حذف (${selectedLogIds.length}) من سجلات التدقيق`}
        itemName={`${selectedLogIds.length} من سجلات التدقيق والمراقبة`}
        itemDetails="سيتم إزالة السجلات المحددة نهائياً من قاعدة السجلات المحلية."
        warningMessage="هل أنت متأكد من رغبتك في حذف السجلات المحددة؟ لا يمكن استرجاعها بعد الحذف."
        confirmText={`حذف (${selectedLogIds.length}) سجلات`}
        onConfirm={confirmBulkDeleteLogs}
      />

      {/* 🗑️ كارد تأكيد تفريغ السجل بالكامل مع أيقونة SVG نقية بدلاً من الإيموجي */}
      <ConfirmDeleteModal
        isOpen={isClearAllModalOpen} // 📦 حالة الفتح
        onClose={() => setIsClearAllModalOpen(false)} // ❌ دالة الإغلاق
        title="تأكيد تفريغ سجل التدقيق والمراقبة بالكامل" // 🏷️ العنوان
        itemName={`كامل سجل التدقيق (${auditLogs.length} سجل)`} // 👤 اسم العنصر
        itemDetails="سيتم مسح كافة قيود السجل الأمني وتعديلات الدرجات نهائياً." // ℹ️ التفاصيل
        warningMessage="تنبيه أمني عالي الخطورة: سيتم حذف كافة السجلات التاريخية. يوصى بتصدير السجل إلى ملف إكسل أولاً." // ⚠️ رسالة تحذير نقية مدعومة بـ SVG
        confirmText="تفريغ ومسح السجل بالكامل" // 🔘 زر التأكيد
        onConfirm={confirmClearAllLogs} // ⚡ دالة التنفيذ
      />

      </div>
    </ZeroTrustGuard>
  );
}
