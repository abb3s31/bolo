'use client'; // ⚡ واجهة تفاعلية تعمل بمتصفح العميل

// 🖨️ مكون نافذة معاينة وطباعة بطاقات اعتماد الأساتذة (10 بطاقات بالورقة الواحدة A4)
// 🇮🇶 توثيق عراقي سطر بسطر مع التزام نمطي صارم بدون any أو unknown

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import { createPortal } from 'react-dom'; // 🌐 بورتال لعرض نافذة الطباعة في أعلى شجرة DOM
import Image from 'next/image'; // 🖼️ استيراد مكون الصور من نكست لشعار الجامعة
import { Printer, X, Mail, KeyRound, Globe, UserCheck, RefreshCw, AlertCircle, User } from 'lucide-react'; // 🎨 أيقونات لوسيد
import type { UserProfile, Department } from '@/types'; // 🏷️ استيراد الأنواع الرسمية
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧮 محرك كشف جنس الأستاذ من الاسم

// 📋 واجهة خصائص نافذة طباعة بطاقات اعتماد الأساتذة
export interface AdminTeacherPrintModalProps {
  showBatchPrintModal: boolean; // 🪟 حالة فتح نافذة الطباعة الجماعية
  setShowBatchPrintModal: (open: boolean) => void; // 🔄 دالة فتح وإغلاق النافذة
  isMounted: boolean; // ⚡ التأكد من اكتمال تحميل المكون بالمتصفح
  profiles: UserProfile[]; // 👥 مصفوفة كافة البروفايلات بالنظام
  singlePrintTeacher: UserProfile | null; // 👤 أستاذ محدد للطباعة المنفردة أو null للكل
  setSinglePrintTeacher: (teacher: UserProfile | null) => void; // 🔄 دالة تصفير الأستاذ المنفرد
  selectedTeacherIds: string[]; // 🔘 معرفات الأساتذة المحددين
  departments: Department[]; // 🏢 قائمة كافة الأقسام للربط الأكاديمي
}

// 🏛️ مكون نافذة طباعة بطاقات اعتماد الأساتذة المعتمد
export const AdminTeacherPrintModal: React.FC<AdminTeacherPrintModalProps> = ({
  showBatchPrintModal, // 🪟 حالة الفتح
  setShowBatchPrintModal, // 🔄 دالة التحكم
  isMounted, // ⚡ جهوزية المتصفح
  profiles, // 👥 الحسابات
  singlePrintTeacher, // 👤 الأستاذ المنفرد
  setSinglePrintTeacher, // 🔄 تصفير المنفرد
  selectedTeacherIds, // 🔘 المحددون
  departments, // 🏢 الأقسام
}) => {
  if (!showBatchPrintModal || !isMounted || typeof document === 'undefined') return null;

  return createPortal(
    (() => {
        const teacherProfiles = profiles.filter((p) => p.role === 'teacher');
        let printList = singlePrintTeacher
          ? [singlePrintTeacher]
          : (selectedTeacherIds.length > 0
              ? teacherProfiles.filter((t) => selectedTeacherIds.includes(t.id))
              : [...teacherProfiles]);

        printList.sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar'));

        return (
          <div 
            id="printable-modal-portal"
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:static print:bg-white print:backdrop-blur-none print:w-full print:h-auto print:min-h-0 print:overflow-visible print:block" 
            dir="rtl"
          >
            <div className="bg-white border-2 border-slate-400 rounded-3xl w-full max-w-7xl max-h-[94vh] shadow-2xl flex flex-col relative overflow-hidden text-right print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none print:overflow-visible print:static print:block print:h-auto">
              
              {/* شريط الأدوات العلوي */}
              <div className="p-4 sm:p-5 border-b-2 border-slate-300 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 z-10 print:hidden no-print">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0F2942] text-cyan-300 rounded-2xl shadow-xs">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-black flex items-center gap-2">
                      <span>معاينة وطباعة بطاقات اعتماد الأساتذة</span>
                      <span className="px-3 py-1 rounded-full bg-slate-200 text-black text-xs font-black border border-slate-300 whitespace-nowrap shrink-0 inline-block">
                        {printList.length} بطاقة (10 بطاقات بالورقة الواحدة A4)
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm font-black text-black">
                      شبكة ثنائية 2x5 فائقة الكفاءة ومضغوطة لتوفير استهلاك الأوراق
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {singlePrintTeacher && (
                    <button
                      type="button"
                      onClick={() => setSinglePrintTeacher(null)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4 text-black" />
                      <span>عرض كافة الأساتذة ({teacherProfiles.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => window.print()}
                    disabled={printList.length === 0}
                    className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] disabled:bg-slate-300 text-white rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#1e4570] active:scale-95"
                  >
                    <Printer className="w-4 h-4 text-cyan-300" />
                    <span>طباعة الآن ({printList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowBatchPrintModal(false);
                      setSinglePrintTeacher(null);
                    }}
                    className="p-2.5 bg-slate-200 hover:bg-slate-300 text-black rounded-2xl transition cursor-pointer border border-slate-300"
                    title="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* منطقة الطباعة بنظام الشبكة 2 عمود × 4 صفوف */}
              <div className="p-3 sm:p-5 overflow-y-auto flex-1 overscroll-contain printable-batch-area bg-slate-100 print:bg-white print:p-0 print:overflow-visible print:static print:block print:h-auto">
                {printList.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border-2 border-slate-300 space-y-3 my-6">
                    <AlertCircle className="w-10 h-10 text-indigo-950 mx-auto" />
                    <p className="text-base font-black text-black">لا يوجد أساتذة محددين للطباعة حالياً.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 print:grid-cols-2 print:gap-1 w-full cards-grid-8 max-w-5xl mx-auto">
                    {printList.map((teacher: UserProfile, index: number) => {
                      const isFemale = (teacher.gender || detectArabicGender(teacher.full_name)) === 'female';
                      const roleTitle = isFemale ? 'أستاذة جامعية' : 'أستاذ جامعي';
                      const currentOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://192.168.0.185:3000';
                      const loginPortalUrl = `${currentOrigin}/teacher`;
                      const loginPortalCleanUrl = loginPortalUrl.replace(/^https?:\/\//, '');
                      const deptName = teacher.department_name || departments.find((d) => d.id === teacher.department_id)?.name || 'القسم العام';

                      return (
                        <div
                          key={teacher.id || index} // 🔑 مفتاح فريد لكل كارد أستاذ بالرندر
                          className="bg-white border border-slate-400 rounded-xl p-2 print:p-1.5 shadow-xs break-inside-avoid print:break-inside-avoid print:border print:border-slate-500 print:rounded-lg print:shadow-none w-full flex flex-col justify-between card-item-8" // 🗂️ حاوية الكارد الأكاديمي بارتفاع 52 ملم تملأ الورقة بالكامل بدون فراغات زائدة
                        >
                          {/* 🏛️ 1. ترويسة الكارد الرسمية: الشعار وعنوان الجامعة وفرع ميسان وشارة التدريسي بخطوط سوداء فاحمة وواضحة */}
                          <div className="flex items-center justify-between border-b border-slate-300 pb-1 print:pb-0.5"> {/* 📐 حاوية الترويسة مع خط فاصل داكن */}
                            <div className="flex items-center gap-1.5 overflow-hidden"> {/* 🏢 مجمع الشعار والعناوين الرسمية */}
                              {/* شعار الجامعة الرسمي بجودة واضحة وبحجم مدمج */}
                              <div className="relative w-8 h-8 print:w-7 print:h-7 flex-shrink-0"> {/* 🖼️ إطار أبعاد الشعار الرسمي */}
                                <Image // 🖼️ مكون صورة الشعار
                                  src="/logo.webp" // 📍 مسار الشعار المعتمد
                                  alt="شعار جامعة الصادق" // 🏷️ نص بديل لأغراض الوصولية
                                  width={32} // 📏 العرض بالبكسل
                                  height={32} // 📏 الارتفاع بالبكسل
                                  className="object-contain" // 🎨 احتواء الصورة بالكامل بدون تشويه
                                  priority // ⚡ تحميل سريع وفوري
                                  unoptimized // 🚀 بدون تحسين إضافي للملفات المحلية
                                />
                              </div>
                              {/* العناوين الرسمية لجامعة الإمام الصادق ومسار بولونيا وفرع ميسان بخط أسود بارز ومقروء */}
                              <div className="flex flex-col justify-center leading-none min-w-0"> {/* 📝 نصوص اسم الجامعة والوزارة */}
                                <h4 className="text-xs print:text-[11px] font-black text-black whitespace-nowrap leading-tight"> {/* 🏛️ اسم الجامعة وفرع ميسان بلون أسود عريض وواضح */}
                                  جامعة الإمام جعفر الصادق (ع) — فرع ميسان
                                </h4>
                                <p className="text-[10px] print:text-[9.5px] text-black font-extrabold whitespace-nowrap leading-tight mt-0.5"> {/* 📜 اسم الوزارة والمسار بخط أسود بارز */}
                                  وزارة التعليم العالي والبحث العلمي — مسار بولونيا
                                </p>
                              </div>
                            </div>
                            {/* شارة الهوية الرسمية للأستاذ أو الأستاذة بخط أسود بارز ومحاط بإطار أنيق */}
                            <span className="px-2 py-0.5 rounded-md bg-white text-black text-[10px] print:text-[9.5px] font-black border border-slate-300 whitespace-nowrap shrink-0 shadow-2xs"> {/* 🏷️ باج الهوية الأكاديمية */}
                              {roleTitle}
                            </span>
                          </div>

                          {/* 👤 2. شريط هوية الأستاذ والقسم التابع إله بخطوط سوداء عريضة */}
                          <div className="flex items-center justify-between gap-2 py-0.5 px-0.5"> {/* 📌 حاوية اسم التدريسي والقسم العلمي بتنسيق ممتلئ وأنيق */}
                            <div className="flex items-center gap-1.5 overflow-hidden"> {/* 🏷️ أيقونة واسم الأستاذ */}
                              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-300"> {/* ⭕ دائرة أيقونة المستخدم */}
                                <User className="w-3 h-3 text-[#0F2942]" /> {/* 👤 أيقونة الأستاذ باللون النيلي */}
                              </div>
                              <span className="text-sm print:text-[12px] font-black text-black truncate"> {/* ✍️ الاسم الكامل للتدريسي بخط أسود كبير وواضح */}
                                {teacher.full_name}
                              </span>
                            </div>
                            <span className="text-[10.5px] print:text-[10px] font-black text-black bg-white px-2 py-0.5 rounded-md border border-slate-300 whitespace-nowrap shrink-0 shadow-2xs"> {/* 🏢 اسم القسم العلمي بخط أسود عريض */}
                              {deptName}
                            </span>
                          </div>

                          {/* 🔐 3. شبكة بيانات الدخول (ألوان موحدة وخانات بيضاء نقية بخطوط سوداء فاحمة) */}
                          <div className="grid grid-cols-2 gap-1.5 print:gap-1 my-0.5"> {/* 🔲 شبكة بعمودين متوازيين للبيانات بتصميم متوحد ونظيف */}
                            {/* صندوق البريد الإلكتروني الأكاديمي بخانة بيضاء نقية مثل الرمز السري تماماً */}
                            <div className="bg-slate-50 border border-slate-300 rounded-md p-1.5 flex flex-col justify-center"> {/* ✉️ بوكس الإيميل الأكاديمي الموحد بحشوة متناسقة */}
                              <div className="flex items-center gap-1 text-[10px] print:text-[9.5px] font-black text-black mb-1"> {/* 🏷️ عنوان حقل الإيميل بخط أسود بارز */}
                                <Mail className="w-3 h-3 text-[#0F2942] shrink-0" /> {/* ✉️ أيقونة البريد بلون نيلي موحد */}
                                <span>البريد الأكاديمي</span>
                              </div>
                              <div className="font-mono text-[10.5px] print:text-[10px] font-black text-black truncate text-center select-all bg-white py-1 px-1.5 rounded border border-slate-300 shadow-2xs" dir="ltr"> {/* 🔤 خانة البريد بيضاء نقية ومحاطة بإطار أنيق مريح */}
                                {teacher.generated_email}
                              </div>
                            </div>

                            {/* صندوق الرمز السري المؤقت بتصميم موحد تماماً مع صندوق البريد بخط أسود */}
                            <div className="bg-slate-50 border border-slate-300 rounded-md p-1.5 flex flex-col justify-center"> {/* 🔑 بوكس كلمة المرور موحد بلون متناسق وبدون أخضر */}
                              <div className="flex items-center gap-1 text-[10px] print:text-[9.5px] font-black text-black mb-1"> {/* 🏷️ عنوان حقل كلمة السر بخط أسود بارز */}
                                <KeyRound className="w-3 h-3 text-[#0F2942] shrink-0" /> {/* 🔑 أيقونة المفتاح بلون نيلي موحد */}
                                <span>كلمة المرور المؤقتة</span>
                              </div>
                              <div className="font-mono text-[12px] print:text-[11px] font-black tracking-widest text-black truncate text-center select-all bg-white py-1 px-1.5 rounded border border-slate-300 shadow-2xs" dir="ltr"> {/* 🔢 خانة الباسورد بيضاء نقية بخط أسود عريض ومتباعد */}
                                {teacher.temp_password || '********'}
                              </div>
                            </div>
                          </div>

                          {/* 🌐 4. رابط المنصة المباشر بحجم خط مطابق لاسم الأستاذ بدون توقيع المستلم وبخط أسود فاحم */}
                          <div className="flex items-center justify-center border-t border-slate-300 pt-1.5 print:pt-1"> {/* 📄 شريط رابط البوابة في المنتصف ومضغوط المساحة */}
                            <div className="flex items-center gap-1.5 font-mono text-xs print:text-[11.5px] font-black text-black truncate select-all bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md" dir="ltr"> {/* 🔗 رابط الدخول بحجم مساوٍ لاسم الأستاذ مع إطار ناعم */}
                              <Globe className="w-3.5 h-3.5 text-[#0F2942] shrink-0" /> {/* 🌐 أيقونة الكرة الأرضية بلون نيلي */}
                              <span className="truncate">{loginPortalCleanUrl}</span> {/* 🌐 رابط البوابة النظيف والواضح */}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

    })(),
    document.body
  );
};
