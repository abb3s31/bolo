'use client'; // ⚡ ينفذ على جهة العميل بمتصفح المستخدم

// 🖨️ مكون نافذة معاينة وطباعة بطاقات اعتماد الطلبة (10 بطاقات بالورقة الواحدة A4)
// 🇮🇶 توثيق عراقي سطر بسطر والتزام نمطي صارم بدون any أو unknown

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import { createPortal } from 'react-dom'; // 🌐 بورتال لعرض نافذة الطباعة في أعلى شجرة DOM
import Image from 'next/image'; // 🖼️ استيراد مكون الصور من نكست لشعار الجامعة
import { Printer, X, Mail, KeyRound, Globe, UserCheck, RefreshCw, AlertCircle, User, Filter, GraduationCap, Clock } from 'lucide-react'; // 🎨 أيقونات لوسيد
import type { UserProfile, Department } from '@/types'; // 🏷️ استيراد الأنواع الرسمية
import { PrintFilterDropdown, PrintFilterOption } from '@/components/PrintFilterDropdown'; // 🖨️ قائمة تصفية الطباعة
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧮 محرك كشف جنس الطالب من الاسم
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 تحويل رقم المرحلة إلى اسمها العربي

// 📋 واجهة خصائص نافذة طباعة بطاقات اعتماد الطلبة
export interface AdminStudentPrintModalProps {
  showStudentPrintModal: boolean; // 🪟 حالة فتح نافذة الطباعة
  setShowStudentPrintModal: (open: boolean) => void; // 🔄 دالة التحكم بالفتح
  isMounted: boolean; // ⚡ اكتمال تحميل المتصفح
  profiles: UserProfile[]; // 👥 مصفوفة كافة الحسابات
  singleStudentPrintProfile: UserProfile | null; // 👤 طالب محدد أو null للكل
  setSingleStudentPrintProfile: (s: UserProfile | null) => void; // 🔄 دالة تصفير المنفرد
  selectedStudentIds: string[]; // 🔘 معرفات الطلاب المحددين
  departments: Department[]; // 🏢 قائمة كافة الأقسام
  studentPrintStageFilter: number | 'all'; // 🎓 فلتر مرحلة الطباعة
  setStudentPrintStageFilter: (f: number | 'all') => void; // 🔄 دالة تحديث فلتر المرحلة
  studentPrintStudyFilter: 'all' | 'morning' | 'evening'; // ☀️🌙 فلتر دراسة الطباعة
  setStudentPrintStudyFilter: (f: 'all' | 'morning' | 'evening') => void; // 🔄 دالة تحديث فلتر الدراسة
}

// 🏛️ مكون نافذة طباعة بطاقات اعتماد الطلبة المعتمد
export const AdminStudentPrintModal: React.FC<AdminStudentPrintModalProps> = ({
  showStudentPrintModal,
  setShowStudentPrintModal,
  isMounted,
  profiles,
  singleStudentPrintProfile,
  setSingleStudentPrintProfile,
  selectedStudentIds,
  departments,
  studentPrintStageFilter,
  setStudentPrintStageFilter,
  studentPrintStudyFilter,
  setStudentPrintStudyFilter,
}) => {
  if (!showStudentPrintModal || !isMounted || typeof document === 'undefined') return null;

  return createPortal(
    (() => {
        const studentProfiles = profiles.filter((p) => p.role === 'student');
        const baseStudents = singleStudentPrintProfile
          ? [singleStudentPrintProfile]
          : (selectedStudentIds.length > 0
              ? studentProfiles.filter((s) => selectedStudentIds.includes(s.id))
              : studentProfiles);

        // 📊 إحصائيات طلاب النظام المتاحة للطباعة (العدد الكلي وأعداد كل مرحلة وفترة)
        const totalCount = baseStudents.length;
        const stage1Count = baseStudents.filter((s) => (s.stage_number || 1) === 1).length;
        const stage2Count = baseStudents.filter((s) => (s.stage_number || 1) === 2).length;
        const stage3Count = baseStudents.filter((s) => (s.stage_number || 1) === 3).length;
        const stage4Count = baseStudents.filter((s) => (s.stage_number || 1) === 4).length;

        const morningCount = baseStudents.filter((s) => (s.study_type || 'morning') === 'morning').length;
        const eveningCount = baseStudents.filter((s) => (s.study_type || 'morning') === 'evening').length;

        // 🎓 خيارات تصفية المراحل الأكاديمية الاحترافية مع الأعداد الدقيقة
        const stageOptions: PrintFilterOption<number | 'all'>[] = [
          { id: 'all', label: 'كافة المراحل (العدد الكلي)', count: totalCount },
          { id: 1, label: 'المرحلة الأولى', count: stage1Count },
          { id: 2, label: 'المرحلة الثانية', count: stage2Count },
          { id: 3, label: 'المرحلة الثالثة', count: stage3Count },
          { id: 4, label: 'المرحلة الرابعة', count: stage4Count },
        ];

        // ☀️🌙 خيارات تصفية الفترات الدراسية الاحترافية مع الأعداد الدقيقة
        const studyOptions: PrintFilterOption<'all' | 'morning' | 'evening'>[] = [
          { id: 'all', label: 'كافة الفترات (العدد الكلي)', count: totalCount },
          { id: 'morning', label: 'الصباحي', count: morningCount },
          { id: 'evening', label: 'المسائي', count: eveningCount },
        ];

        let printList = singleStudentPrintProfile
          ? [singleStudentPrintProfile]
          : (selectedStudentIds.length > 0
              ? studentProfiles.filter((s) => selectedStudentIds.includes(s.id))
              : [...studentProfiles]);

        if (!singleStudentPrintProfile) {
          if (studentPrintStageFilter !== 'all') {
            printList = printList.filter((s) => (s.stage_number || 1) === studentPrintStageFilter);
          }
          if (studentPrintStudyFilter !== 'all') {
            printList = printList.filter((s) => (s.study_type || 'morning') === studentPrintStudyFilter);
          }
        }

        printList.sort((a, b) => {
          const stageA = a.stage_number || 1;
          const stageB = b.stage_number || 1;
          if (stageA !== stageB) return stageA - stageB;
          return a.full_name.localeCompare(b.full_name, 'ar');
        });

        return (
          <div 
            id="printable-modal-portal"
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:static print:bg-white print:backdrop-blur-none print:w-full print:h-auto print:min-h-0 print:overflow-visible print:block" 
            dir="rtl"
          >
            <div className="bg-white border-2 border-slate-400 rounded-3xl w-full max-w-7xl max-h-[94vh] shadow-2xl flex flex-col relative overflow-hidden text-right print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none print:overflow-visible print:static print:block print:h-auto">
              
              {/* شريط الأدوات العلوي */}
              <div className="p-4 sm:p-5 border-b-2 border-slate-300 bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 z-10 print:hidden no-print">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0F2942] text-cyan-300 rounded-2xl shadow-xs">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-black flex items-center gap-2">
                      <span>معاينة وطباعة بطاقات اعتماد الطلبة</span>
                      <span className="px-3 py-0.5 rounded-full bg-slate-200 text-black text-xs font-black border border-slate-300">
                        {printList.length} بطاقة (10 بطاقات بالورقة الواحدة A4)
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm font-black text-slate-700">
                      شبكة ثنائية 2x5 فائقة الكفاءة ومضغوطة لتوفير استهلاك الأوراق
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* فلاتر المرحلة والدراسة الاحترافية بتصميم حديث وأعداد دقيقة */}
                  {!singleStudentPrintProfile && (
                    <div className="flex items-center gap-2.5">
                      <PrintFilterDropdown<number | 'all'>
                        ariaLabel="تصفية طباعة الطلاب حسب المرحلة الأكاديمية"
                        icon={<GraduationCap className="w-4 h-4 text-[#0F2942]" />}
                        options={stageOptions}
                        selectedValue={studentPrintStageFilter}
                        onSelect={(val) => setStudentPrintStageFilter(val)}
                      />

                      <PrintFilterDropdown<'all' | 'morning' | 'evening'>
                        ariaLabel="تصفية طباعة الطلاب حسب الفترة الدراسية"
                        icon={<Clock className="w-4 h-4 text-[#0F2942]" />}
                        options={studyOptions}
                        selectedValue={studentPrintStudyFilter}
                        onSelect={(val) => setStudentPrintStudyFilter(val)}
                      />
                    </div>
                  )}

                  {singleStudentPrintProfile && (
                    <button
                      type="button"
                      onClick={() => setSingleStudentPrintProfile(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4 text-black" />
                      <span>عرض كافة الطلبة ({studentProfiles.length})</span>
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
                      setShowStudentPrintModal(false);
                      setSingleStudentPrintProfile(null);
                    }}
                    className="p-2.5 bg-slate-200 hover:bg-slate-300 text-black rounded-2xl transition cursor-pointer"
                    title="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* منطقة الطباعة بنظام الشبكة 2 عمود × 5 صفوف (10 كروت بكل صفحة A4) */}
              <div className="p-3 sm:p-5 overflow-y-auto flex-1 overscroll-contain printable-batch-area bg-slate-100 print:bg-white print:p-0 print:overflow-visible print:static print:block print:h-auto">
                {printList.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border-2 border-slate-300 space-y-3 my-6">
                    <AlertCircle className="w-10 h-10 text-indigo-950 mx-auto" />
                    <p className="text-base font-black text-black">لا يوجد طلاب مطابقين للخيارات المحددة حالياً.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 print:grid-cols-2 print:gap-1.5 w-full cards-grid-8">
                    {printList.map((student: UserProfile, index: number) => {
                      const curStage = student.stage_number || 1;
                      const stageName = getStageNameInArabic(curStage);
                      const studyName = student.study_type === 'evening' ? 'مسائي' : 'صباحي';
                      const currentOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://192.168.0.185:3000';
                      const loginPortalUrl = `${currentOrigin}/student`;
                      const loginPortalCleanUrl = loginPortalUrl.replace(/^https?:\/\//, '');
                      const deptName = student.department_name || departments.find((d) => d.id === student.department_id)?.name || 'القسم العام';

                      return (
                        <div
                          key={student.id || index} // 🔑 مفتاح فريد لكل كارد طالب بالرندر
                          className="bg-white border border-slate-400 rounded-xl p-2 print:p-1.5 shadow-xs break-inside-avoid print:break-inside-avoid print:border print:border-slate-500 print:rounded-lg print:shadow-none w-full flex flex-col justify-between card-item-8" // 🗂️ حاوية الكارد الأكاديمي بارتفاع 52 ملم تملأ الورقة بالكامل بدون فراغات زائدة
                        >
                          {/* 🏛️ 1. ترويسة الكارد الرسمية: الشعار وعنوان الجامعة وشارة الطالب بخطوط سوداء فاحمة وواضحة */}
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
                              {/* العناوين الرسمية لجامعة الإمام الصادق ومسار بولونيا بخط أسود بارز ومقروء */}
                              <div className="flex flex-col justify-center leading-none min-w-0"> {/* 📝 نصوص اسم الجامعة والوزارة */}
                                <h4 className="text-xs print:text-[11px] font-black text-black whitespace-nowrap leading-tight"> {/* 🏛️ اسم الجامعة وفرع ميسان بلون أسود عريض وواضح */}
                                  جامعة الإمام جعفر الصادق (ع) — فرع ميسان
                                </h4>
                                <p className="text-[10px] print:text-[9.5px] text-black font-extrabold whitespace-nowrap leading-tight mt-0.5"> {/* 📜 اسم الوزارة والمسار بخط أسود بارز */}
                                  وزارة التعليم العالي والبحث العلمي — مسار بولونيا
                                </p>
                              </div>
                            </div>
                            {/* شارة الهوية الرسمية للطالب الجامعي بخط أسود بارز ومحاط بإطار أنيق */}
                            <span className="px-2 py-0.5 rounded-md bg-white text-black text-[10px] print:text-[9.5px] font-black border border-slate-300 whitespace-nowrap shrink-0 shadow-2xs"> {/* 🏷️ باج هوية الطالب */}
                              بطاقة طالب
                            </span>
                          </div>

                          {/* 👤 2. شريط هوية الطالب وقسمه ومرحلته الدراسية بخطوط سوداء عريضة */}
                          <div className="flex items-center justify-between gap-2 py-0.5 px-0.5"> {/* 📌 حاوية اسم الطالب وبيانات القسم والمرحلة */}
                            <div className="flex items-center gap-1.5 overflow-hidden"> {/* 🏷️ أيقونة واسم الطالب */}
                              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-300"> {/* ⭕ دائرة أيقونة المستخدم */}
                                <User className="w-3 h-3 text-[#0F2942]" /> {/* 👤 أيقونة الطالب باللون النيلي */}
                              </div>
                              <span className="text-sm print:text-[12px] font-black text-black truncate"> {/* ✍️ الاسم الكامل للطالب بخط أسود كبير وواضح */}
                                {student.full_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0"> {/* 🏷️ باجات القسم والمرحلة الدراسية */}
                              <span className="text-[10px] print:text-[9.5px] font-black text-black bg-white px-1.5 py-0.5 rounded-md border border-slate-300 whitespace-nowrap shadow-2xs"> {/* 🏢 اسم القسم العلمي */}
                                {deptName}
                              </span>
                              <span className="text-[10px] print:text-[9.5px] font-black text-black bg-white px-1.5 py-0.5 rounded-md border border-slate-300 whitespace-nowrap shadow-2xs"> {/* 🎓 المرحلة والدراسة */}
                                المرحلة {stageName} ({studyName})
                              </span>
                            </div>
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
                                {student.generated_email}
                              </div>
                            </div>

                            {/* صندوق الرمز السري المؤقت بتصميم موحد تماماً مع صندوق البريد بخط أسود */}
                            <div className="bg-slate-50 border border-slate-300 rounded-md p-1.5 flex flex-col justify-center"> {/* 🔑 بوكس كلمة المرور موحد بلون متناسق وبدون أخضر */}
                              <div className="flex items-center gap-1 text-[10px] print:text-[9.5px] font-black text-black mb-1"> {/* 🏷️ عنوان حقل كلمة السر بخط أسود بارز */}
                                <KeyRound className="w-3 h-3 text-[#0F2942] shrink-0" /> {/* 🔑 أيقونة المفتاح بلون نيلي موحد */}
                                <span>كلمة المرور المؤقتة</span>
                              </div>
                              <div className="font-mono text-[12px] print:text-[11px] font-black tracking-widest text-black truncate text-center select-all bg-white py-1 px-1.5 rounded border border-slate-300 shadow-2xs" dir="ltr"> {/* 🔢 خانة الباسورد بيضاء نقية بخط أسود عريض ومتباعد */}
                                {student.temp_password || '********'}
                              </div>
                            </div>
                          </div>

                          {/* 🌐 4. رابط المنصة المباشر بحجم خط مطابق لاسم الطالب بدون توقيع المستلم وبخط أسود فاحم */}
                          <div className="flex items-center justify-center border-t border-slate-300 pt-1.5 print:pt-1"> {/* 📄 شريط رابط البوابة في المنتصف ومضغوط المساحة */}
                            <div className="flex items-center gap-1.5 font-mono text-xs print:text-[11.5px] font-black text-black truncate select-all bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md" dir="ltr"> {/* 🔗 رابط الدخول بحجم مساوٍ لاسم الطالب مع إطار ناعم */}
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
