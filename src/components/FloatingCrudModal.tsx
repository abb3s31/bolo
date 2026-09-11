'use client'; // ⚡ ينفذ بالعميل

// 📦 مكون كارت الـ CRUD العائم الفاخر - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { ReactNode, useEffect, useState, useRef } from 'react'; // 🔗 رياكت
import { createPortal } from 'react-dom'; // 🌐 بورتال للرسم المباشر على جذر الصفحة
import { X } from 'lucide-react'; // 🎨 الأيقونات
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll-lock'; // 🔒 نظام إدارة التمرير المركزي

interface FloatingCrudModalProps {
  isOpen: boolean; // 🟢 فتح النافذة
  onClose: () => void; // 🔴 إغلاق النافذة
  title: ReactNode; // 🏷️ العنوان
  subtitle?: ReactNode; // 📜 الوصف الفرعي (يقبل نصاً أو باجات مخصصة)
  icon?: ReactNode; // 🎨 الأيقونة
  children: ReactNode; // 📦 محتوى النموذج أو البيانات
  footer?: ReactNode; // 🔘 الفوتر الثابت في أسفل الكارد
  maxWidth?: string; // 📐 العرض الأقصى
  onSubmit?: (e: React.FormEvent) => void; // ⚡ دالة إرسال النموذج المباشرة
  bodyClassName?: string; // 🎨 كلاسات مخصصة لمحتوى الكارد الداخلي
}

export default function FloatingCrudModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = 'max-w-2xl',
  onSubmit,
  bodyClassName, // 🎨 كلاسات مخصصة لمحتوى الكارد
}: FloatingCrudModalProps) {
  // ⚡ التحقق من اكتمال تحميل الصفحة بالعميل لاستخدام البورتال بأمان
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null); // 📍 مرجع محتوى الكارد الداخلي

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🔒 قفل واستعادة تمرير الصفحة بشكل آمن ومحمي 100%
  useEffect(() => {
    if (isOpen) {
      lockBodyScroll();
      // 🔝 تصفير موضع التمرير الداخلي للكارد فور فتحه ليكون من أول سطر
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
      return () => {
        unlockBodyScroll();
      };
    }
  }, [isOpen]);

  // ⌨️ الاستماع لزر الهروب Escape لإغلاق النافذة العائمة بسلاسة وسرعة
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null; // 🛑 إذا لم تكن مفتوحة لا ترسم شيء

  // 📋 محتوى البطاقة العائمة وهيكلها الكامل
  const modalBody = (
    <div 
      className={`relative z-10 w-full ${maxWidth} max-h-[90vh] bg-white border border-slate-300 rounded-3xl shadow-2xl flex flex-col transform transition-all animate-in zoom-in-95 duration-200 overflow-hidden`}
      onClick={(e) => e.stopPropagation()}
    >
      
      {/* 🏛️ شريط العنوان والهيدر الثابت في أعلى الكارد */}
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-white shrink-0 flex items-start justify-between z-30 sticky top-0 shadow-2xs">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2.5 bg-[#0F2942] text-white rounded-2xl flex-shrink-0 shadow-xs">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight">{title}</h3>
            {subtitle && <div className="text-xs sm:text-sm font-black text-slate-950 mt-1 flex items-center gap-2 flex-wrap">{subtitle}</div>}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-950 font-black rounded-xl transition cursor-pointer border border-slate-300 shadow-xs shrink-0"
          title="إغلاق الكارت"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 📦 محتوى الكارد في المنتصف مع تمرير داخلي سلس وأنيق أو كلاسات مخصصة */}
      <div ref={contentRef} className={bodyClassName || "p-5 sm:p-7 pb-6 sm:pb-8 overflow-y-auto flex-1 min-h-0 overscroll-contain scroll-smooth"}>
        {children}
      </div>

      {/* 🔘 الفوتر الثابت في أسفل الكارد تماماً وبشكل صلب ومثبت 100% بحيث لا يظهر أي عنصر أسفله إطلاقاً */}
      {footer && (
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 shrink-0 z-30 sticky bottom-0 flex items-center justify-end gap-3 shadow-xs">
          {footer}
        </div>
      )}

    </div>
  );

  // 🌐 العرض النهائي المغلف في نافذة زجاجية تملأ 100% من أبعاد الشاشة بدون أي فجوة وبأعلى طبقة ظهور
  const modalOverlay = (
    <div 
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden" 
      dir="rtl"
      onClick={onClose}
    >
      {/* 🌫️ خلفية نقر زجاجية كاملة الأبعاد تغطي 100% من الشاشة من الحافة للحافة */}
      <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-full h-full z-0 bg-transparent" />

      {onSubmit ? (
        <form 
          onSubmit={onSubmit} 
          onClick={(e) => e.stopPropagation()} 
          className={`relative z-10 w-full ${maxWidth} max-h-[90vh] flex flex-col items-center justify-center`}
        >
          {modalBody}
        </form>
      ) : (
        modalBody
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalOverlay, document.body) : null;
}
