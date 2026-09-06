'use client'; // ⚡ ينفذ بالعميل

// 📦 نافذة التأكيد الاحترافية الفاخرة الشاملة (ConfirmDeleteModal) - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useEffect } from 'react'; // 🔗 رياكت
import { 
  Trash2, 
  X, 
  ShieldAlert, 
  GraduationCap, 
  ArrowRightLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  UserCheck,
  UserMinus,
  Unlink,
  RotateCcw,
  FileText
} from 'lucide-react'; // 🎨 استيراد أيقونات Lucide SVG النقية الكاملة

import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll-lock'; // 🔒 نظام إدارة التمرير المركزي

export type ConfirmModalVariant = 'danger' | 'success' | 'warning' | 'info' | 'primary';
export type ConfirmModalIcon = 'trash' | 'graduation' | 'promote' | 'check' | 'sparkles' | 'alert' | 'user' | 'info' | 'unlink' | 'user-minus' | 'rotate';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;                          // 📦 حالة فتح النافذة
  title?: string;                           // 🏷️ عنوان نافذة الإجراء
  itemName?: string;                        // 👤 اسم العنصر المستهدف (أستاذ / طالب / دفعة / مادة / قسم)
  itemDetails?: string;                     // ℹ️ تفاصيل إضافية (مثل البريد الأكاديمي أو القسم)
  warningMessage?: string;                  // ⚠️ نص الرسالة التوضيحية
  warningNote?: string;                     // 🛡️ نص الملاحظة السفلية المخصصة
  confirmText?: string;                     // 🔘 نص زر التأكيد (افتراضي: تأكيد الإجراء)
  cancelText?: string;                      // 🔘 نص زر الإلغاء (افتراضي: تراجع وإلغاء)
  variant?: ConfirmModalVariant;            // 🎨 نمط الألوان (danger = أحمر للحذف | success = زمردي للترحيل والتخرج)
  iconType?: ConfirmModalIcon;              // 🖼️ نوع أيقونة SVG المناسبة للعملية
  isLoading?: boolean;                      // ⏳ حالة جاري التنفيذ
  onConfirm: () => void;                    // ⚡ دالة تنفيذ الإجراء
  onClose: () => void;                      // ❌ دالة الإغلاق والإلغاء
}

export default function ConfirmDeleteModal({
  isOpen,
  title = 'تأكيد الإجراء الأكاديمي',
  itemName,
  itemDetails,
  warningMessage = 'هل أنت متأكد من تنفيذ هذا الإجراء؟',
  warningNote,
  confirmText,
  cancelText = 'تراجع وإلغاء',
  variant = 'danger',
  iconType,
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) {
  // 🔒 قفل واستعادة تمرير الصفحة بشكل آمن ومحمي 100%
  useEffect(() => {
    if (isOpen) {
      lockBodyScroll();
      return () => {
        unlockBodyScroll();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 🎨 تحديد نوع الأيقونة تلقائياً إن لم يتم تمريرها صراحة
  const resolvedIconType: ConfirmModalIcon = iconType || (
    variant === 'success' ? 'check' :
    variant === 'warning' ? 'alert' :
    variant === 'info' ? 'info' :
    variant === 'primary' ? 'rotate' : 'trash'
  );

  // 🎯 استخراج نصوص وألوان الثيم المناسبة
  const isSuccess = variant === 'success' || resolvedIconType === 'graduation' || resolvedIconType === 'promote' || resolvedIconType === 'check';
  const isPrimary = variant === 'primary' || resolvedIconType === 'rotate';
  const isWarning = variant === 'warning' || resolvedIconType === 'alert';
  const isInfo = variant === 'info' || resolvedIconType === 'info';

  const defaultConfirmText = isSuccess 
    ? (resolvedIconType === 'graduation' ? 'تثبيت التخرج' : resolvedIconType === 'promote' ? 'تأكيد الترحيل' : 'تأكيد الاعتماد')
    : isPrimary
    ? 'تأكيد الإجراء'
    : (isWarning ? 'متابعة وتأكيد' : 'تأكيد الحذف النهائي');

  const finalConfirmText = confirmText || defaultConfirmText;

  // 🎨 تعيين مكون أيقونة SVG المناسبة
  const renderTopSvgIcon = () => {
    switch (resolvedIconType) {
      case 'graduation':
        return <GraduationCap className="w-10 h-10 text-emerald-700 relative z-10" />;
      case 'promote':
        return <ArrowRightLeft className="w-10 h-10 text-emerald-700 relative z-10" />;
      case 'sparkles':
        return <Sparkles className="w-10 h-10 text-emerald-700 relative z-10" />;
      case 'check':
        return <CheckCircle2 className="w-10 h-10 text-emerald-700 relative z-10" />;
      case 'user':
        return <UserCheck className="w-10 h-10 text-emerald-700 relative z-10" />;
      case 'alert': // ⚠️ بحالة أيقونة التنبيه العلوية
        return <AlertTriangle className="w-10 h-10 relative z-10 text-rose-700" />; // 🛑 تلوين الأيقونة بالأحمر الياقوتي لجميع الأنماط تماشياً مع هوية النظام الأكاديمي ومنع البرتقالي
      case 'info':
        return <Info className="w-10 h-10 text-blue-700 relative z-10" />;
      case 'rotate':
        return <RotateCcw className="w-10 h-10 text-slate-900 relative z-10" />;
      case 'user-minus':
        return <UserMinus className="w-10 h-10 text-rose-700 relative z-10" />;
      case 'unlink':
        return <Unlink className="w-10 h-10 text-rose-700 relative z-10" />;
      case 'trash':
      default:
        return <Trash2 className="w-10 h-10 text-rose-700 relative z-10" />;
    }
  };

  const renderButtonSvgIcon = () => {
    switch (resolvedIconType) {
      case 'graduation':
        return <GraduationCap className="w-4 h-4 text-white" />;
      case 'promote':
        return <ArrowRightLeft className="w-4 h-4 text-white" />;
      case 'sparkles':
        return <Sparkles className="w-4 h-4 text-white" />;
      case 'check':
        return <CheckCircle2 className="w-4 h-4 text-white" />;
      case 'user':
        return <UserCheck className="w-4 h-4 text-white" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-white" />;
      case 'info':
        return <Info className="w-4 h-4 text-white" />;
      case 'rotate':
        return <RotateCcw className="w-4 h-4 text-white" />;
      case 'user-minus':
        return <UserMinus className="w-4 h-4 text-white" />;
      case 'unlink':
        return <Unlink className="w-4 h-4 text-white" />;
      case 'trash':
      default:
        return <Trash2 className="w-4 h-4 text-white" />;
    }
  };

  const modalOverlay = (
    // 🔮 خلفية زجاجية غامقة وثابتة بالكامل تغطي 100% من أبعاد الشاشة بدون أي فجوة
    <div 
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-150"
      dir="rtl"
      onClick={onClose}
    >
      {/* 🏛️ الكارد العائم الأنيق بحدود ناعمة وتوسيط هندسي تام */}
      <div 
        className="relative z-10 bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ❌ زر الإغلاق السريع في الزاوية بأيقونة SVG سوداء واضحة */}
        <button
          type="button" // 🔘 نوع الزر
          onClick={onClose} // ⚡ استدعاء دالة الإغلاق
          disabled={isLoading} // ⏳ تعطيل الزر أثناء التحميل
          className="absolute top-4 left-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-950 rounded-2xl transition cursor-pointer border border-slate-300 z-10 font-black" // 🎨 حدود وأيقونة سوداء داكنة
        >
          <X className="w-5 h-5 text-slate-950" /> {/* ❌ أيقونة الإغلاق SVG بلون أسود داكن */}
        </button>

        {/* 🚨 المنطقة العلوية وأيقونة SVG الدائرية الفخمة */}
        <div className="p-6 sm:p-7 pt-8 text-center space-y-4"> {/* 📐 حاوية المحتوى الداخلي */}
          
          {/* دائرة الأيقونة المتوهجة بحواف ناعمة وألوان مناسبة للعملية */}
          <div className={`w-20 h-20 rounded-3xl border-2 flex items-center justify-center mx-auto shadow-inner relative ${ // 🎨 إطار الأيقونة البارز
            isSuccess 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : isPrimary
              ? 'bg-slate-100 border-slate-300 text-slate-900' 
              : isInfo
              ? 'bg-blue-50 border-blue-200 text-blue-700' 
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            <div className={`absolute inset-0 rounded-3xl animate-ping opacity-60 ${ // 💫 تأثير التوهج النابض
              isSuccess ? 'bg-emerald-400/20' : isPrimary ? 'bg-slate-400/20' : isInfo ? 'bg-blue-400/20' : 'bg-rose-400/20'
            }`} />
            {renderTopSvgIcon()} {/* 🖼️ رندر أيقونة SVG المناسبة */}
          </div>

          {/* العنوان الرسمي مع رسالة التحذير باللون الأسود الداكن 100% */}
          <div className="space-y-2"> {/* 📐 تباعد رأسي أنيق بين العنوان والرسالة */}
            <h3 className="text-xl sm:text-2xl font-black text-slate-950"> {/* 🏷️ عنوان النافذة الرسمي بلون أسود فاحم */}
              {title} {/* 📝 نص العنوان */}
            </h3>
            <div className="flex items-center justify-center gap-2 text-sm font-black text-slate-950 leading-relaxed px-2 flex-wrap"> {/* 📐 حاوية الرسالة باللون الأسود الكامل بدلاً من الرمادي */}
              {isSuccess ? ( // 🔍 فحص حالة النجاح
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" /> // 🌟 أيقونة SVG للنجاح
              ) : isInfo ? ( // 🔍 فحص حالة المعلومة
                <Info className="w-4.5 h-4.5 text-blue-600 shrink-0" /> // ℹ️ أيقونة SVG للمعلومة
              ) : isPrimary ? ( // 🔍 فحص الحالة الأساسية
                <RotateCcw className="w-4.5 h-4.5 text-slate-950 shrink-0" /> // 🔄 أيقونة SVG سوداء للإجراء
              ) : ( // 🛑 حالة الخطر والتحذير والحذف النهائي بالأحمر الياقوتي
                <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" /> // 🛑 أيقونة SVG حمراء ياقوتية متناسقة 100% مع هوية الحذف
              )}
              <span className="text-slate-950 font-black">{warningMessage.replace(/^[⚠️\s]+/, '')}</span> {/* 🖤 نص الرسالة بلون أسود فاحم صريح */}
            </div>
          </div>

          {/* 📇 بطاقة تفاصيل العنصر المستهدف بالعملية بنصوص وأيقونات سوداء داكنة */}
          {(itemName || itemDetails) && ( // 🔍 التحقق من وجود تفاصيل للعنصر
            <div className="p-4 bg-slate-50 border border-slate-300 rounded-2xl text-right space-y-2 my-3 shadow-2xs"> {/* 📦 إطار البطاقة الأنيق */}
              {itemName && ( // 🏷️ إذا وجد اسم العنصر
                <div className="flex items-center gap-2"> {/* 📐 سطر اسم العنصر */}
                  <span className="text-xs font-black text-slate-950 flex items-center gap-1.5 shrink-0"> {/* 🖤 عنوان الحقل بالأسود الفاحم */}
                    <FileText className="w-3.5 h-3.5 text-slate-950 shrink-0" /> {/* 🖤 أيقونة SVG بلون أسود كامل */}
                    <span>العنصر:</span> {/* 🏷️ التسمية */}
                  </span>
                  <span className="text-sm font-black text-slate-950">{itemName}</span> {/* 🖤 اسم العنصر بالأسود الفاحم */}
                </div>
              )}
              {itemDetails && ( // ℹ️ إذا وجدت تفاصيل إضافية
                <div className="flex items-center gap-2"> {/* 📐 سطر التفاصيل الإضافية */}
                  <span className="text-xs font-black text-slate-950 flex items-center gap-1.5 shrink-0"> {/* 🖤 عنوان الحقل بالأسود الفاحم */}
                    <Info className="w-3.5 h-3.5 text-slate-950 shrink-0" /> {/* 🖤 أيقونة SVG بلون أسود كامل */}
                    <span>التفاصيل:</span> {/* 🏷️ التسمية */}
                  </span>
                  <span className="text-xs font-black text-slate-950 font-mono" dir="ltr">{itemDetails}</span> {/* 🖤 نص التفاصيل بالأسود الفاحم */}
                </div>
              )}
            </div>
          )}

          {/* ⚠️ شريط توضيح الأمان والملاحظة الذكية */}
          <div className={`p-3 rounded-2xl border flex items-center gap-2.5 text-right ${ // 📐 حاوية شريط الملاحظة
            isSuccess
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : isPrimary
              ? 'bg-slate-100 border-slate-300 text-slate-950'
              : isInfo
              ? 'bg-blue-50 border-blue-200 text-blue-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}>
            {isSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            ) : isPrimary ? (
              <RotateCcw className="w-5 h-5 text-slate-950 shrink-0" />
            ) : isInfo ? (
              <Info className="w-5 h-5 text-blue-700 shrink-0" />
            ) : ( // 🛑 بحالة الحذف والخطر والتحذير الأكاديمي
              <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0" /> // 🛑 درع الأمان باللون الأحمر الياقوتي
            )}
            <span className="text-xs font-black">
              {warningNote || (
                isSuccess
                  ? 'سيتم اعتماد الإجراء الأكاديمي وترقية وتحديث السجلات في قاعدة البيانات فوراً.'
                  : 'سيتم تحديث قاعدة البيانات وإلغاء كافة الارتباطات الأكاديمية فوراً.'
              )}
            </span>
          </div>

        </div>

        {/* 🔘 أزرار الفوتر الثابتة بالأسفل مع نصوص سوداء واضحة */}
        <div className="p-4 sm:p-5 bg-slate-50/95 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0"> {/* 📐 فوتر النافذة */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // ⚡ دالة الإغلاق
            disabled={isLoading} // ⏳ حالة التعطيل
            className="flex-1 py-3 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-950 font-black rounded-2xl text-sm transition cursor-pointer text-center shadow-2xs whitespace-nowrap" // 🖤 نص الزر بالأسود الفاحم text-slate-950 بدلاً من الرمادي
          >
            {cancelText} {/* 🏷️ تراجع وإلغاء */}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 px-4 disabled:opacity-50 text-white font-black rounded-2xl text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg whitespace-nowrap ${
              isSuccess
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : isPrimary
                ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
                : isInfo
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
            }`}
          >
            {renderButtonSvgIcon()}
            <span className="whitespace-nowrap">{isLoading ? 'جاري التنفيذ...' : finalConfirmText}</span>
          </button>
        </div>

      </div>
    </div>
  );

  return modalOverlay;
}
