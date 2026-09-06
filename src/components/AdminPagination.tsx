'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 📄 مكون نظام الصفحات الموحد والفاخر (AdminPagination) - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useRef, useEffect } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والمراجع ودورة الحياة
import { 
  ChevronRight, 
  ChevronLeft, 
  ChevronsRight, 
  ChevronsLeft, 
  ChevronDown, 
  Check 
} from 'lucide-react'; // 🎨 أيقونات SVG الرسمية للتنقل بين الصفحات

// 📋 واجهة خصائص مكون شريط الصفحات الموحد
export interface AdminPaginationProps {
  currentPage: number; // 📄 رقم الصفحة الحالية (يبدأ من 1)
  totalItems: number; // 🔢 إجمالي عدد العناصر المفلترة
  pageSize: number; // 📏 عدد العناصر في الصفحة الواحدة
  onPageChange: (page: number) => void; // 🔄 دالة تغيير الصفحة الحالية
  onPageSizeChange?: (size: number) => void; // 🔄 دالة تغيير حجم الصفحة
  pageSizeOptions?: readonly number[]; // 📐 مصفوفة خيارات حجم الصفحة
  itemLabel?: string; // 🏷️ اسم العنصر المعروض (مثال: "أستاذ"، "طالب"، "مادة")
  className?: string; // 🎨 كلاسات إضافية لتخصيص المظهر
}

// 📐 الخيارات الافتراضية لعدد العناصر في الصفحة
const DEFAULT_PAGE_SIZE_OPTIONS: readonly number[] = [5, 10, 20, 50, 100] as const;

export default function AdminPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  itemLabel = 'عنصر',
  className = '',
}: AdminPaginationProps) {
  // 🔽 حالة فتح وإغلاق القائمة المنسدلة لاختيار حجم الصفحة
  const [isPageSizeOpen, setIsPageSizeOpen] = useState<boolean>(false);
  // 🔗 مرجع عنصر القائمة المنسدلة للتعامل مع النقر الخارجي
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // 🧮 حساب إجمالي الصفحات والتأكد من أمان القيم الرقمية
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize)); // 📄 حساب إجمالي الصفحات بدون كسر وبحد أدنى صفحة واحدة
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages); // 🛡️ حماية رقم الصفحة من التجاوز السالب أو الأكبر من الحد
  const startIndex = (safeCurrentPage - 1) * pageSize; // 📍 مؤشر بداية عناصر الصفحة الحالية
  const endIndex = Math.min(startIndex + pageSize, totalItems); // 📍 مؤشر نهاية عناصر الصفحة الحالية

  // 🖱️ مستمع لإغلاق القائمة المنسدلة عند النقر خارجها أو الضغط على Escape
  useEffect(() => {
    // 🔍 دالة فحص النقر خارج القائمة المنسدلة
    const handleOutsideClick = (event: MouseEvent) => {
      // 🛡️ التحقق من وجود المرجع وأن النقر حصل خارجه
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPageSizeOpen(false); // ❌ إغلاق القائمة المنسدلة
      }
    };

    // ⌨️ دالة التعامل مع زر الهروب Escape
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPageSizeOpen(false); // ❌ إغلاق القائمة عند الضغط على Escape
      }
    };

    // 👂 تسجيل المستمعات في المستند
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    // 🧹 تنظيف المستمعات عند إلغاء تركيب المكون لمنع تسريب الذاكرة
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 🛡️ في حال عدم وجود أي عناصر لا نعرض شريط التصفح
  if (totalItems <= 0) {
    return null; // 🚫 إخفاء الشريط عند فراغ القائمة
  }

  return (
    // 🏛️ الحاوية الرئيسية لشريط الصفحات بتصميم أبيض كحلي ناصع وحدود ناعمة متوافقة مع الهوية
    <div
      dir="rtl"
      className={`bg-white border border-slate-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs select-none ${className}`}
    >
      {/* 📊 ملخص عدد العناصر المعروضة */}
      <div className="text-sm font-black text-slate-950 flex items-center gap-1.5 flex-wrap">
        <span>عرض</span>
        {/* 🔢 رقم أول عنصر في الصفحة */}
        <span className="font-mono text-[#0F2942] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
          {startIndex + 1}
        </span>
        <span>إلى</span>
        {/* 🔢 رقم آخر عنصر في الصفحة */}
        <span className="font-mono text-[#0F2942] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
          {endIndex}
        </span>
        <span>من إجمالي</span>
        {/* 🔢 إجمالي عدد العناصر المفلترة الكلية */}
        <span className="font-mono text-slate-950 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-300">
          {totalItems}
        </span>
        <span>{itemLabel}</span>
      </div>

      {/* 🔘 أزرار التنقل بين الصفحات واختيار حجم الصفحة */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 📏 القائمة المنسدلة المخصصة لاختيار حجم الصفحة */}
        {onPageSizeChange && (
          <div className="relative" ref={dropdownRef}>
            {/* 🔘 زر فتح وإغلاق قائمة عدد العناصر */}
            <button
              type="button"
              onClick={() => setIsPageSizeOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-950 border border-slate-300 rounded-xl text-xs font-black transition cursor-pointer shadow-2xs active:scale-95"
              title={`تحديد عدد عناصر ${itemLabel} في الصفحة`}
            >
              <span>{pageSize} / صفحة</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isPageSizeOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* 📋 القائمة المنسدلة التي تفتح للأعلى بأمان لمنع تجاوز إطار الجدول */}
            {isPageSizeOpen && (
              <div className="absolute bottom-full mb-2 right-0 bg-white border border-slate-300 rounded-2xl shadow-xl z-50 w-36 overflow-hidden py-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-black text-slate-500 border-b border-slate-100 bg-slate-50">
                  عدد العناصر بالصفحة:
                </div>
                {pageSizeOptions.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      onPageSizeChange(size); // 🔄 تحديث حجم الصفحة
                      onPageChange(1); // 🔄 الرجوع للصفحة الأولى فور تغيير الحجم
                      setIsPageSizeOpen(false); // ❌ إغلاق القائمة
                    }}
                    className={`w-full px-3.5 py-2 text-right text-xs font-black flex items-center justify-between transition hover:bg-blue-50 cursor-pointer ${
                      pageSize === size ? 'bg-blue-100 text-[#0F2942]' : 'text-slate-950'
                    }`}
                  >
                    <span>{size} {itemLabel}</span>
                    {pageSize === size && <Check className="w-3.5 h-3.5 text-[#0F2942] stroke-[3]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ➖ فاصل عمودي ناعم */}
        <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block" />

        {/* ⏪ زر الانتقال إلى الصفحة الأولى */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          className="p-2 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs active:scale-95"
          title="الصفحة الأولى"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>

        {/* ◀️ زر الانتقال إلى الصفحة السابقة */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage === 1}
          className="p-2 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs active:scale-95"
          title="الصفحة السابقة"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* 🔢 مؤشر أرقام الصفحات الحالية من الإجمالي */}
        <div className="px-3 py-1.5 bg-slate-100 border border-slate-300 text-slate-950 rounded-xl text-xs font-black font-mono flex items-center gap-1 shadow-2xs">
          <span>صفحة</span>
          <span className="text-[#0F2942] font-black">{safeCurrentPage}</span>
          <span>من</span>
          <span>{totalPages}</span>
        </div>

        {/* ▶️ زر الانتقال إلى الصفحة التالية */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage === totalPages}
          className="p-2 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs active:scale-95"
          title="الصفحة التالية"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* ⏩ زر الانتقال إلى الصفحة الأخيرة */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={safeCurrentPage === totalPages}
          className="p-2 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs active:scale-95"
          title="الصفحة الأخيرة"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
