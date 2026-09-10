'use client'; // ⚡ تفعيل ميزات العميل التفاعلية في Next.js

import React, { useState, useRef, useEffect } from 'react'; // ⚛️ استيراد ريآكت والهوكس الأساسية
import Image from 'next/image'; // 🖼️ استيراد مكون الصور المحسن من Next.js
import { createPortal } from 'react-dom'; // 🚪 استيراد بورتال لعرض المودال
import {
  Printer, // 🖨️ أيقونة الطباعة المباشرة
  ChevronDown, // 🔽 أيقونة السهم للقائمة المنسدلة
  Building2, // 🏢 أيقونة القسم الأكاديمي
  RefreshCw, // 🔄 أيقونة إعادة التعيين وعرض الكل
  X, // ❌ أيقونة الإغلاق
  AlertCircle, // ⚠️ أيقونة التنبيه
  User, // 👤 أيقونة المسؤول الأكاديمي
  Mail, // ✉️ أيقونة البريد الإلكتروني
  KeyRound, // 🔑 أيقونة كلمة المرور
  Globe, // 🌐 أيقونة الرابط الإلكتروني
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { UserProfile, Department } from '@/types'; // 🏷️ استيراد الأنواع الرسمية

// 📋 واجهة مدخلات نافذة معاينة وطباعة بطاقات اعتماد القيادات الأكاديمية
export interface DepartmentHeadsPrintModalProps {
  isOpen: boolean; // 📂 حالة فتح نافذة الطباعة
  onClose: () => void; // 🛑 دالة إغلاق نافذة الطباعة
  isMounted: boolean; // ⚡ التحقق من تحميل الصفحة على العميل
  profiles: UserProfile[]; // 👥 مصفوفة الحسابات الإدارية
  departments: Department[]; // 🏢 مصفوفة الأقسام الأكاديمية
  singlePrintProfile: UserProfile | null; // 👤 الحساب الفردي المحدد للطباعة
  setSinglePrintProfile: (p: UserProfile | null) => void; // 🔄 تحديث الحساب الفردي
  batchPrintDeptFilter: string; // 🔍 فلتر القسم المختار للطباعة
  setBatchPrintDeptFilter: (f: string) => void; // 🔄 تحديث فلتر القسم
}

// 🖨️ مكون نافذة معاينة وطباعة بطاقات اعتماد وتسليم الحسابات لرؤساء ومقرري الأقسام
export const DepartmentHeadsPrintModal: React.FC<DepartmentHeadsPrintModalProps> = ({
  isOpen, // 📂 حالة الفتح
  onClose, // 🛑 دالة الإغلاق
  isMounted, // ⚡ حالة التحميل
  profiles, // 👥 الحسابات
  departments, // 🏢 الأقسام
  singlePrintProfile, // 👤 الحساب الفردي
  setSinglePrintProfile, // 🔄 تحديث الحساب الفردي
  batchPrintDeptFilter, // 🔍 فلتر القسم
  setBatchPrintDeptFilter, // 🔄 تحديث فلتر القسم
}) => {
  const [isPrintDeptDropdownOpen, setIsPrintDeptDropdownOpen] = useState<boolean>(false); // 📂 حالة قائمة الأقسام بالطباعة
  const printDeptDropdownRef = useRef<HTMLDivElement | null>(null); // 🔗 مرجع قائمة الأقسام

  // 👂 إغلاق قائمة الأقسام عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (printDeptDropdownRef.current && !printDeptDropdownRef.current.contains(event.target as Node)) {
        setIsPrintDeptDropdownOpen(false);
      }
    };
    if (isPrintDeptDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPrintDeptDropdownOpen]);

  // 🛑 التحقق من الشروط قبل الرندر
  if (!isOpen || !isMounted || typeof document === 'undefined') return null;

  // 👥 استخراج كافة القيادات الأكاديمية (رؤساء ومقررين)
  const allLeaders = profiles.filter(
    (p: UserProfile) => p.role === 'department_head' || p.role === 'rapporteur'
  );

  // 🎯 تحديد القائمة المستهدفة للطباعة
  let printList: UserProfile[] = [];
  if (singlePrintProfile) {
    printList = [singlePrintProfile];
  } else if (batchPrintDeptFilter === 'all') {
    printList = [...allLeaders];
  } else {
    printList = allLeaders.filter(
      (p: UserProfile) =>
        p.department_id === batchPrintDeptFilter || p.department_name === batchPrintDeptFilter
    );
  }

  // 🔄 ترتيب البطاقات: حسب القسم أولاً، ورئيس القسم يسبق المقرر داخل نفس القسم
  printList.sort((a: UserProfile, b: UserProfile) => {
    const deptA = a.department_name || '';
    const deptB = b.department_name || '';
    const deptCompare = deptA.localeCompare(deptB, 'ar');
    if (deptCompare !== 0) return deptCompare;
    if (a.role === 'department_head' && b.role !== 'department_head') return -1;
    if (a.role !== 'department_head' && b.role === 'department_head') return 1;
    return a.full_name.localeCompare(b.full_name, 'ar');
  });

  return createPortal(
    // 🌌 غطاء التعتيم الخلفي للمودال مع دعم تنسيق الطباعة المباشرة A4
    <div
      id="printable-modal-portal"
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:static print:bg-white print:backdrop-blur-none print:w-full print:h-auto print:min-h-0 print:overflow-visible print:block"
      dir="rtl"
    >
      {/* 📦 الصندوق الرئيسي للمودال بعرض موسع وفخم */}
      <div className="bg-white border-2 border-slate-400 rounded-3xl w-full max-w-7xl max-h-[94vh] shadow-2xl flex flex-col relative overflow-hidden text-right print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none print:overflow-visible print:static print:block print:h-auto">
        {/* 🎛️ شريط الأدوات والتحكم العلوي (مخفي تماماً أثناء الطباعة) */}
        <div className="p-4 sm:p-5 border-b-2 border-slate-300 bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 z-10 print:hidden no-print">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0F2942] text-cyan-300 rounded-2xl shadow-xs">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-black flex items-center gap-2">
                <span>معاينة وطباعة بطاقات اعتماد القيادات الأكاديمية</span>
                <span className="px-3 py-1 rounded-full bg-slate-200 text-black text-xs font-black border border-slate-300 whitespace-nowrap shrink-0 inline-block">
                  {printList.length} بطاقة (10 بطاقات بالورقة الواحدة A4)
                </span>
              </h3>
              <p className="text-xs sm:text-sm font-black text-black">
                شبكة ثنائية 2x5 فائقة الكفاءة ومضغوطة لتوفير استهلاك الأوراق
              </p>
            </div>
          </div>

          {/* 🎯 عناصر التحكم والفلترة وزر الطباعة الموحد */}
          <div className="flex flex-wrap items-center gap-3">
            {/* 🏛️ القائمة المنسدلة الاحترافية لاختيار القسم العلمي */}
            {!singlePrintProfile && (
              <div className="relative" ref={printDeptDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsPrintDeptDropdownOpen(!isPrintDeptDropdownOpen)}
                  className="px-4 py-2.5 bg-white border-2 border-slate-300 hover:border-slate-800 text-black rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-between gap-2 shadow-2xs min-w-[200px]"
                >
                  <span className="truncate">
                    {batchPrintDeptFilter === 'all'
                      ? `كافة الأقسام (الكل - ${allLeaders.length} بطاقة)`
                      : departments.find(
                          (d: Department) =>
                            d.id === batchPrintDeptFilter || d.name === batchPrintDeptFilter
                        )?.name || batchPrintDeptFilter}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-black transition-transform duration-200 shrink-0 ${
                      isPrintDeptDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* قائمة الأقسام العائمة ذات التصميم الفاخر */}
                {isPrintDeptDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-right max-h-72 overflow-y-auto">
                    {/* خيار كافة الأقسام */}
                    <button
                      type="button"
                      onClick={() => {
                        setBatchPrintDeptFilter('all');
                        setIsPrintDeptDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-right text-xs sm:text-sm font-black flex items-center justify-between transition cursor-pointer ${
                        batchPrintDeptFilter === 'all'
                          ? 'bg-[#0F2942] text-white'
                          : 'text-black hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2
                          className={`w-4 h-4 ${
                            batchPrintDeptFilter === 'all' ? 'text-cyan-300' : 'text-indigo-950'
                          }`}
                        />
                        <span>كافة الأقسام (طباعة الكل دفعة واحدة)</span>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                          batchPrintDeptFilter === 'all'
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 text-black'
                        }`}
                      >
                        {allLeaders.length}
                      </span>
                    </button>

                    <div className="my-1 border-t border-slate-200" />

                    {/* قائمة الأقسام الفرعية */}
                    {departments.map((dept: Department) => {
                      const deptLeadersCount = allLeaders.filter(
                        (l: UserProfile) =>
                          l.department_id === dept.id || l.department_name === dept.name
                      ).length;
                      const isSelected =
                        batchPrintDeptFilter === dept.id || batchPrintDeptFilter === dept.name;

                      return (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => {
                            setBatchPrintDeptFilter(dept.id);
                            setIsPrintDeptDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-right text-xs sm:text-sm font-black flex items-center justify-between transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#0F2942] text-white'
                              : 'text-black hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Building2
                              className={`w-4 h-4 shrink-0 ${
                                isSelected ? 'text-cyan-300' : 'text-indigo-950'
                              }`}
                            />
                            <span className="truncate">{dept.name}</span>
                          </div>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-black shrink-0 ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-200 text-black'
                            }`}
                          >
                            {deptLeadersCount} قيادات
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 🔄 زر الرجوع لعرض كافة الأقسام إذا كانت المعاينة لبطاقة فردية */}
            {singlePrintProfile && (
              <button
                type="button"
                onClick={() => {
                  setSinglePrintProfile(null);
                  setBatchPrintDeptFilter('all');
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black border-2 border-slate-300 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4 text-black" />
                <span>عرض وطباعة كافة القيادات ({allLeaders.length})</span>
              </button>
            )}

            {/* 🖨️ زر طباعة الكل بزر واحد / طباعة البطاقات الآن */}
            <button
              type="button"
              onClick={() => window.print()}
              disabled={printList.length === 0}
              className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] disabled:bg-slate-300 text-white rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#1e4570] active:scale-95"
            >
              <Printer className="w-4 h-4 text-cyan-300" />
              <span>
                {printList.length === allLeaders.length ? 'طباعة الكل بزر واحد' : 'طباعة الآن'} (
                {printList.length})
              </span>
            </button>

            {/* ✖️ زر إغلاق نافذة المعاينة والطباعة */}
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsPrintDeptDropdownOpen(false);
              }}
              className="p-2.5 bg-slate-200 hover:bg-slate-300 text-black rounded-2xl transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 📜 منطقة المعاينة والطباعة الرسمية المتوافقة مع ورق A4 */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain printable-batch-area bg-slate-100 print:bg-white print:p-0 print:overflow-visible print:static print:block print:h-auto">
          {printList.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border-2 border-slate-300 space-y-3 my-6">
              <AlertCircle className="w-10 h-10 text-indigo-950 mx-auto" />
              <p className="text-base font-black text-black">
                لا توجد حسابات قيادية مسجلة تطابق القسم المختار حالياً.
              </p>
              <p className="text-sm font-black text-black">يرجى اختيار قسم آخر أو طباعة كافة الأقسام.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 print:grid-cols-2 print:gap-1 w-full cards-grid-8 max-w-5xl mx-auto">
              {printList.map((leader: UserProfile, index: number) => {
                const currentOrigin =
                  typeof window !== 'undefined' && window.location.origin
                    ? window.location.origin
                    : 'http://192.168.0.185:3000';
                const loginPortalUrl = `${currentOrigin}/admin`;
                const loginPortalCleanUrl = loginPortalUrl.replace(/^https?:\/\//, '');
                const isDeptHead = leader.role === 'department_head';
                const isFemale = leader.gender === 'female';
                const roleArabicTitle = isDeptHead
                  ? isFemale
                    ? 'رئيسة القسم العلمي'
                    : 'رئيس القسم العلمي'
                  : isFemale
                  ? 'مقررة القسم العلمي'
                  : 'مقرر القسم العلمي';

                return (
                  <div
                    key={leader.id || index}
                    className="bg-white border border-slate-400 rounded-xl p-2 print:p-1.5 shadow-xs break-inside-avoid print:break-inside-avoid print:border print:border-slate-500 print:rounded-lg print:shadow-none w-full flex flex-col justify-between card-item-8"
                  >
                    {/* 🏛️ 1. ترويسة الكارد الرسمية: الشعار وعنوان الجامعة وفرع ميسان وشارة الموقع الأكاديمي */}
                    <div className="flex items-center justify-between border-b border-slate-300 pb-1 print:pb-0.5">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <div className="relative w-8 h-8 print:w-7 print:h-7 flex-shrink-0">
                          <Image
                            src="/logo.webp"
                            alt="شعار جامعة الصادق"
                            width={32}
                            height={32}
                            className="object-contain"
                            priority
                            unoptimized
                          />
                        </div>
                        <div className="flex flex-col justify-center leading-none min-w-0">
                          <h4 className="text-xs print:text-[11px] font-black text-black whitespace-nowrap leading-tight">
                            جامعة الإمام جعفر الصادق (ع) — فرع ميسان
                          </h4>
                          <p className="text-[10px] print:text-[9.5px] text-black font-extrabold whitespace-nowrap leading-tight mt-0.5">
                            وزارة التعليم العالي والبحث العلمي — مسار بولونيا
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-white text-black text-[10px] print:text-[9.5px] font-black border border-slate-300 whitespace-nowrap shrink-0 shadow-2xs">
                        {roleArabicTitle}
                      </span>
                    </div>

                    {/* 👤 2. شريط هوية المسؤول والقسم العلمي */}
                    <div className="flex items-center justify-between gap-2 py-0.5 px-0.5">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-300">
                          <User className="w-3 h-3 text-[#0F2942]" />
                        </div>
                        <span className="text-sm print:text-[12px] font-black text-black truncate">
                          {leader.full_name}
                        </span>
                      </div>
                      <span className="text-[10.5px] print:text-[10px] font-black text-black bg-white px-2 py-0.5 rounded-md border border-slate-300 whitespace-nowrap shrink-0 shadow-2xs">
                        {leader.department_name || 'غير محدد'}
                      </span>
                    </div>

                    {/* 🔐 3. شبكة بيانات الدخول */}
                    <div className="grid grid-cols-2 gap-1.5 print:gap-1 my-0.5">
                      <div className="bg-slate-50 border border-slate-300 rounded-md p-1.5 flex flex-col justify-center">
                        <div className="flex items-center gap-1 text-[10px] print:text-[9.5px] font-black text-black mb-1">
                          <Mail className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                          <span>البريد الأكاديمي</span>
                        </div>
                        <div
                          className="font-mono text-[10.5px] print:text-[10px] font-black text-black truncate text-center select-all bg-white py-1 px-1.5 rounded border border-slate-300 shadow-2xs"
                          dir="ltr"
                        >
                          {leader.generated_email}
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-300 rounded-md p-1.5 flex flex-col justify-center">
                        <div className="flex items-center gap-1 text-[10px] print:text-[9.5px] font-black text-black mb-1">
                          <KeyRound className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                          <span>كلمة المرور المؤقتة</span>
                        </div>
                        <div
                          className="font-mono text-[12px] print:text-[11px] font-black tracking-widest text-black truncate text-center select-all bg-white py-1 px-1.5 rounded border border-slate-300 shadow-2xs"
                          dir="ltr"
                        >
                          {leader.temp_password || '********'}
                        </div>
                      </div>
                    </div>

                    {/* 🌐 4. رابط المنصة المباشر */}
                    <div className="flex items-center justify-center border-t border-slate-300 pt-1.5 print:pt-1">
                      <div
                        className="flex items-center gap-1.5 font-mono text-xs print:text-[11.5px] font-black text-black truncate select-all bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md"
                        dir="ltr"
                      >
                        <Globe className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                        <span className="truncate">{loginPortalCleanUrl}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DepartmentHeadsPrintModal; // 🚀 تصدير المكون كافتراضي
