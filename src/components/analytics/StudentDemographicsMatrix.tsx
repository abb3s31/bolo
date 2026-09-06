'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 👥 مصفوفة الإحصائيات الديموغرافية الشاملة للطلاب (Student Demographics Matrix) - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import React, { useState, useMemo } from 'react'; // 🔗 خطافات رياكت
import { 
  CollegeStudentDemographics, 
  DepartmentStudentDemographics, 
  StageStudentDemographics,
  UserProfile,
  Department 
} from '@/types'; // 🔗 واجهات الأنواع الصريحة
import { calculateStudentDemographics } from '@/lib/demographics-utils'; // 🧮 دوال حساب الإحصائيات
import { 
  Users, 
  UserCheck, 
  GraduationCap, 
  Building2, 
  Search, 
  Layers,
  Sun,
  Moon
} from 'lucide-react'; // 🎨 أيقونات SVG

interface StudentDemographicsMatrixProps {
  profiles?: UserProfile[]; // 👥 قائمة البروفايلات لحساب الإحصائيات تلقائياً
  departments?: Department[]; // 🏛️ قائمة الأقسام
  demographicsData?: CollegeStudentDemographics; // 📊 البيانات المحسوبة مسبقاً إن وجدت
}

export const StudentDemographicsMatrix: React.FC<StudentDemographicsMatrixProps> = ({
  profiles = [],
  departments = [],
  demographicsData
}) => {
  // 🔍 حالة البحث لتصفية الأقسام
  const [searchQuery, setSearchQuery] = useState<string>('');
  // 🔘 مرحلة الفلترة المحددة (0 = كافة المراحل)
  const [selectedStageFilter, setSelectedStageFilter] = useState<number>(0);

  // 🧮 حساب البيانات الديموغرافية الشاملة
  const stats: CollegeStudentDemographics = useMemo(() => {
    if (demographicsData) {
      return demographicsData;
    }
    return calculateStudentDemographics(profiles, departments);
  }, [demographicsData, profiles, departments]);

  // 🔍 تصفية الأقسام حسب نص البحث
  const filteredDepartments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return stats.departments || [];
    }
    return (stats.departments || []).filter((dept: DepartmentStudentDemographics) => 
      dept.department_name.toLowerCase().includes(query) ||
      dept.department_code.toLowerCase().includes(query)
    );
  }, [stats.departments, searchQuery]);

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* 📊 بطاقات الإحصاء العام الشامل للصباحي والمسائي والذكور والإناث */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 1. بطاقة إجمالي طلبة الجامعة */}
        <div className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-5 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-slate-950 mb-1">
                إجمالي طلبة الجامعة
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                {stats.total_students.toLocaleString('en-US')}
                <span className="text-xs sm:text-sm font-black text-slate-950 mr-1.5">طالب/ـة</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-black">
            <span>تغطية الأقسام:</span>
            <span className="text-indigo-950 font-black">{stats.departments_count} قسماً معتمداً</span>
          </div>
        </div>

        {/* 2. بطاقة طلبة الدراسة الصباحية باللون السماوي الأكاديمي الراقي */}
        <div className="relative overflow-hidden bg-sky-50/70 border border-sky-300 rounded-3xl p-5 shadow-sm"> {/* 🎨 كارد الصباحي السماوي الهادئ */}
          <div className="flex items-center justify-between"> {/* 📐 ترتيب العناصر بالهيدر */}
            <div> {/* 📦 حاوية النصوص */}
              <p className="text-sm font-black uppercase tracking-wider text-sky-950 mb-1"> {/* 🏷️ عنوان الدراسة الصباحية */}
                الدراسة الصباحية {/* ☀️ مسمى الدراسة */}
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-sky-950 tracking-tight"> {/* 🔢 تعداد طلبة الصباحي */}
                {(stats.total_morning || 0).toLocaleString('en-US')} {/* 📊 الرقم الإجمالي */}
                <span className="text-xs sm:text-sm font-black text-sky-900 mr-1.5">طالب/ـة</span> {/* 🏷️ اللاحقة */}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-400 flex items-center justify-center text-sky-700 shadow-xs"> {/* ☀️ حاوية أيقونة الشمس السماوية */}
              <Sun className="w-6 h-6" /> {/* ☀️ أيقونة الشمس */}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-sky-200 flex items-center justify-between text-xs font-black"> {/* 📐 فوتر الكارد مع فاصل سماوي */}
            <span className="text-slate-950">نسبة الصباحي:</span> {/* 🏷️ نص النسبة */}
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-950 font-black border border-sky-300"> {/* 🏷️ باج نسبة الصباحي السماوي */}
              {stats.morning_percentage || 0}% {/* 📊 النسبة المئوية */}
            </span>
          </div>
        </div>

        {/* 3. بطاقة طلبة الدراسة المسائية */}
        <div className="relative overflow-hidden bg-indigo-50/60 border border-indigo-300 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-indigo-950 mb-1">
                الدراسة المسائية
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-indigo-950 tracking-tight">
                {(stats.total_evening || 0).toLocaleString('en-US')}
                <span className="text-xs sm:text-sm font-black text-indigo-900 mr-1.5">طالب/ـة</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-400 flex items-center justify-center text-indigo-700 shadow-xs">
              <Moon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-indigo-200 flex items-center justify-between text-xs font-black">
            <span className="text-slate-950">نسبة المسائي:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-950 font-black border border-indigo-300">
              {stats.evening_percentage || 0}%
            </span>
          </div>
        </div>

        {/* 4. بطاقة إجمالي الطلاب الذكور */}
        <div className="relative overflow-hidden bg-blue-50/50 border border-blue-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-950 mb-1">
                الطلاب الذكور
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight">
                {stats.total_males.toLocaleString('en-US')}
                <span className="text-xs sm:text-sm font-black text-blue-950 mr-1.5">طالباً</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700 shadow-xs">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200 flex items-center justify-between text-xs font-black">
            <span className="text-slate-950">نسبة الذكور:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-950 font-black border border-blue-200">
              {stats.male_percentage}%
            </span>
          </div>
        </div>

        {/* 5. بطاقة إجمالي الطالبات الإناث */}
        <div className="relative overflow-hidden bg-rose-50/50 border border-rose-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-rose-950 mb-1">
                الطالبات الإناث
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
                {stats.total_females.toLocaleString('en-US')}
                <span className="text-xs sm:text-sm font-black text-rose-950 mr-1.5">طالبة</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shadow-xs">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-rose-200 flex items-center justify-between text-xs font-black">
            <span className="text-slate-950">نسبة الإناث:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-950 font-black border border-rose-200">
              {stats.female_percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* 📊 تفصيل أعداد الطلاب حسب المراحل الدراسية الأربعة (المرحلة 1 إلى 4) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3"> {/* 📐 حاوية عنوان قسم المراحل */}
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200"> {/* 🎨 أيقونة المراحل بلون سماوي راقي */}
              <Layers className="w-6 h-6" /> {/* 📑 أيقونة الطبقات */}
            </div>
            <div>
              <h4 className="text-lg sm:text-xl font-black text-slate-950">توزيع الطلبة الإجمالي حسب المراحل الدراسية</h4>
              <p className="text-sm sm:text-base text-slate-950 font-black mt-1">إحصائية الذكور والإناث والمجموع لكل مرحلة على مستوى الجامعة</p>
            </div>
          </div>

          {/* 🔘 أزرار التبديل السريع للمراحل */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            {[
              { id: 0, label: 'كافة المراحل' },
              { id: 1, label: 'المرحلة الأولى' },
              { id: 2, label: 'المرحلة الثانية' },
              { id: 3, label: 'المرحلة الثالثة' },
              { id: 4, label: 'المرحلة الرابعة' },
            ].map((btn: { id: number; label: string }) => (
              <button
                key={btn.id}
                onClick={() => setSelectedStageFilter(btn.id)}
                className={`px-4 py-2 rounded-xl text-sm font-black transition-all cursor-pointer ${
                  selectedStageFilter === btn.id
                    ? 'bg-white text-slate-950 shadow-xs border border-slate-200'
                    : 'text-slate-950 hover:text-black font-black'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* 🗂️ شبكة بطاقات المراحل الدراسية الـ 4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((stageNum: number) => {
            const stage: StageStudentDemographics | undefined = stats.stages_summary ? stats.stages_summary[stageNum] : undefined;
            const isHighlighted = selectedStageFilter === 0 || selectedStageFilter === stageNum;
            const stageTotal = stage ? stage.total_students : 0;
            const stageMales = stage ? stage.male_count : 0;
            const stageFemales = stage ? stage.female_count : 0;
            const stageMorning = stage ? stage.morning_count : 0;
            const stageEvening = stage ? stage.evening_count : 0;
            const stageName = stage ? stage.stage_name : `المرحلة ${stageNum}`; // 📝 اسم المرحلة بالعربي
            const stageMorningPct = stage ? (stage.morning_percentage || 0) : (stageTotal > 0 ? Math.round((stageMorning / stageTotal) * 100) : 0); // ☀️ نسبة الصباحي
            const stageEveningPct = stage ? (stage.evening_percentage || 0) : (stageTotal > 0 ? Math.round((stageEvening / stageTotal) * 100) : 0); // 🌙 نسبة المسائي
            const stageMalePct = stage ? (stage.male_percentage || 0) : (stageTotal > 0 ? Math.round((stageMales / stageTotal) * 100) : 0); // 👨 نسبة الذكور
            const stageFemalePct = stage ? (stage.female_percentage || 0) : (stageTotal > 0 ? Math.round((stageFemales / stageTotal) * 100) : 0); // 👩 نسبة الإناث

            return (
              <div
                key={stageNum}
                className={`rounded-2xl border p-5 transition-all duration-300 ${
                  isHighlighted
                    ? 'bg-slate-50 border-slate-300 shadow-xs ring-1 ring-indigo-500/20'
                    : 'bg-slate-50/50 border-slate-200 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-3.5">
                  <span className="px-3.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-950 font-black text-sm border border-indigo-200">
                    {stageName}
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-950">
                    {stageTotal} طالب/ـة
                  </span>
                </div>

                <div className="space-y-2 text-sm sm:text-base"> {/* 📦 مساحة تفاصيل المرحلة */}
                  <div className="flex items-center justify-between"> {/* ☀️ سطر الصباحي */}
                    <span className="text-slate-950 font-black flex items-center gap-1.5 text-xs sm:text-sm"> {/* 🏷️ عنوان الصباحي */}
                      <Sun className="w-4 h-4 text-sky-600" /> {/* ☀️ أيقونة الشمس بلون سماوي */}
                      الصباحي: {/* 🏷️ نص الصباحي */}
                    </span>
                    <span className="font-black text-sky-950 text-sm">{stageMorning}</span> {/* 🔢 عدد طلبة الصباحي بالسماوي */}
                  </div>
                  <div className="flex items-center justify-between"> {/* 🌙 سطر المسائي */}
                    <span className="text-slate-950 font-black flex items-center gap-1.5 text-xs sm:text-sm"> {/* 🏷️ عنوان المسائي */}
                      <Moon className="w-4 h-4 text-indigo-600" /> {/* 🌙 أيقونة القمر البنفسجي */}
                      المسائي: {/* 🏷️ نص المسائي */}
                    </span>
                    <span className="font-black text-indigo-950 text-sm">{stageEvening}</span> {/* 🔢 عدد طلبة المسائي */}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200"> {/* 🚻 سطر الذكور والإناث */}
                    <span className="text-slate-950 font-black flex items-center gap-1.5 text-xs sm:text-sm"> {/* 🏷️ عنوان الجنسين */}
                      <Users className="w-4 h-4 text-blue-600" /> {/* 👥 أيقونة الطلاب */}
                      الذكور / الإناث: {/* 🏷️ مسمى الجنسين */}
                    </span>
                    <span className="font-black text-slate-950 text-xs sm:text-sm"> {/* 🔢 الأعداد */}
                      <span className="text-blue-950">{stageMales}ذ</span> / <span className="text-rose-950">{stageFemales}ث</span> {/* 📊 تفصيل الذكور والإناث */}
                    </span>
                  </div>
                </div>

                {/* 📊 أشرطة النسب المئوية والتوزيع الديموغرافي للمرحلة */}
                <div className="mt-3.5 pt-3 border-t border-slate-200 space-y-2.5">
                  
                  {/* ☀️🌙 الشريط الأول: نسبة الدراسة الصباحية والمسائية مع نسبة واضحة فوق الخط */}
                  <div>
                    {/* 🏷️ نسب الصباحي والمسائي فوق الخط الملون */}
                    <div className="flex items-center justify-between text-[11px] font-black mb-1">
                      <span className="text-sky-900 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block"></span>
                        صباحي: {stageMorningPct}%
                      </span>
                      <span className="text-indigo-900 flex items-center gap-1">
                        مسائي: {stageEveningPct}%
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block"></span>
                      </span>
                    </div>
                    {/* 📏 شريط الصباحي والمسائي الملون */}
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
                      <div 
                        className="bg-sky-500 h-full transition-all duration-500" // 🎨 شريط الصباحي السماوي
                        style={{ width: `${stageMorningPct}%` }} // 📐 العرض بالنسبة المئوية الحقيقية
                        title={`الصباحي: ${stageMorning} (${stageMorningPct}%)`} // 🏷️ تلميح النسبة للصباحي
                      />
                      <div 
                        className="bg-indigo-600 h-full transition-all duration-500" // 🎨 شريط المسائي البنفسجي
                        style={{ width: `${stageEveningPct}%` }} // 📐 العرض بالنسبة المئوية الحقيقية
                        title={`المسائي: ${stageEvening} (${stageEveningPct}%)`} // 🏷️ تلميح النسبة للمسائي
                      />
                    </div>
                  </div>

                  {/* 👨👩 الشريط الثاني أسفل الخط: نسبة الذكور والإناث مع نسبة واضحة فوقه */}
                  <div>
                    {/* 🏷️ نسب الذكور والإناث فوق الخط الثاني */}
                    <div className="flex items-center justify-between text-[11px] font-black mb-1">
                      <span className="text-blue-950 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
                        ذكور: {stageMalePct}%
                      </span>
                      <span className="text-rose-950 flex items-center gap-1">
                        إناث: {stageFemalePct}%
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                      </span>
                    </div>
                    {/* 📏 شريط الذكور والإناث الملون أسفل الخط الأول */}
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
                      <div 
                        className="bg-blue-600 h-full transition-all duration-500" // 🎨 شريط الذكور الأزرق
                        style={{ width: `${stageMalePct}%` }} // 📐 العرض بالنسبة المئوية الحقيقية
                        title={`الذكور: ${stageMales} (${stageMalePct}%)`} // 🏷️ تلميح النسبة للذكور
                      />
                      <div 
                        className="bg-rose-500 h-full transition-all duration-500" // 🎨 شريط الإناث الوردي
                        style={{ width: `${stageFemalePct}%` }} // 📐 العرض بالنسبة المئوية الحقيقية
                        title={`الإناث: ${stageFemales} (${stageFemalePct}%)`} // 🏷️ تلميح النسبة للإناث
                      />
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🏛️ مصفوفة أعداد الطلاب التفصيلية لكافة الأقسام الـ 12 */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-950 flex items-center justify-center border border-indigo-200">
              <Building2 className="w-6 h-6 text-indigo-700" />
            </div>
            <div>
              <h4 className="text-lg sm:text-xl font-black text-slate-950">مصفوفة أعداد الطلاب التفصيلية لكافة الأقسام العلمية</h4>
              <p className="text-sm sm:text-base text-slate-950 font-black mt-1">توزيع الطلاب والصباحي والمسائي والذكور والإناث لكل قسم علمي</p>
            </div>
          </div>

          {/* 🔍 حقل البحث في الأقسام */}
          <div className="relative min-w-[300px]">
            <Search className="w-5 h-5 text-slate-700 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="البحث باسم القسم أو الرمز..."
              className="w-full pl-4 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-950 text-sm placeholder:text-slate-700 font-black focus:outline-none focus:border-indigo-600 transition-all"
            />
          </div>
        </div>

        {/* 📋 جدول المصفوفة الإحصائية التفاعلية */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-right text-sm sm:text-base">
            <thead className="bg-slate-100 text-slate-950 font-black border-b border-slate-200 select-none">
              <tr>
                <th className="p-4 text-center w-14 min-w-[45px] border-l border-slate-200 text-sm sm:text-base">ت</th>
                <th className="p-4 text-right min-w-[180px] text-sm sm:text-base">القسم العلمي</th>
                <th className="p-4 text-center min-w-[110px] bg-slate-50 border-x border-slate-200 text-sm sm:text-base">المرحلة الأولى</th>
                <th className="p-4 text-center min-w-[110px] border-r border-slate-200 text-sm sm:text-base">المرحلة الثانية</th>
                <th className="p-4 text-center min-w-[110px] bg-slate-50 border-r border-slate-200 text-sm sm:text-base">المرحلة الثالثة</th>
                <th className="p-4 text-center min-w-[110px] border-r border-slate-200 text-sm sm:text-base">المرحلة الرابعة</th>
                <th className="p-4 text-center min-w-[90px] text-sky-950 bg-sky-50/60 border-r border-slate-200 font-black text-sm sm:text-base">
                  <div className="flex items-center justify-center gap-1">
                    <Sun className="w-4 h-4 text-sky-600" />
                    <span>الصباحي</span>
                  </div>
                </th>
                <th className="p-4 text-center min-w-[90px] text-indigo-950 bg-indigo-50/50 border-r border-slate-200 font-black text-sm sm:text-base">
                  <div className="flex items-center justify-center gap-1">
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span>المسائي</span>
                  </div>
                </th>
                <th className="p-4 text-center min-w-[80px] text-blue-950 bg-blue-50/50 border-r border-slate-200 font-black text-sm sm:text-base">الذكور</th>
                <th className="p-4 text-center min-w-[80px] text-rose-950 bg-rose-50/50 border-r border-slate-200 font-black text-sm sm:text-base">الإناث</th>
                <th className="p-4 text-center min-w-[90px] text-slate-950 bg-slate-200/60 border-r border-slate-200 font-black text-sm sm:text-base">الإجمالي</th>
                <th className="p-4 text-center min-w-[170px] font-black text-sm sm:text-base">النسبة التوزيعية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-black">
              {filteredDepartments.map((dept: DepartmentStudentDemographics, index: number) => (
                <tr 
                  key={dept.department_id}
                  className={`hover:bg-slate-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                  }`}
                >
                  <td className="p-4 text-center font-black text-slate-950 border-l border-slate-200">
                    <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-lg text-sm font-black text-slate-950 shadow-2xs">
                      {index + 1}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-950 text-sm font-black sm:text-sm border border-slate-300 font-black">
                        {dept.department_code}
                      </span>
                      <span className="font-black text-slate-950 text-sm sm:text-base">{dept.department_name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center border-x border-slate-200 bg-slate-50/30">
                    {(() => {
                      const st = dept.stages ? dept.stages[1] : undefined; // 🔍 قراءة إحصائية المرحلة الأولى
                      if (!st || st.total_students === 0) return <span className="text-slate-950 font-black">-</span>; // 🚫 حالة عدم وجود طلبة
                      return (
                        <div className="inline-flex flex-col items-center">
                          <span className="font-black text-slate-950 text-base">{st.total_students}</span>
                          <span className="text-xs font-black text-slate-700 mt-0.5">
                            <span className="text-sky-900">{st.morning_count}ص</span> / <span className="text-indigo-900">{st.evening_count}م</span>
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-3 text-center border-r border-slate-200">
                    {(() => {
                      const st = dept.stages ? dept.stages[2] : undefined; // 🔍 قراءة إحصائية المرحلة الثانية
                      if (!st || st.total_students === 0) return <span className="text-slate-950 font-black">-</span>; // 🚫 حالة عدم وجود طلبة
                      return (
                        <div className="inline-flex flex-col items-center">
                          <span className="font-black text-slate-950 text-base">{st.total_students}</span>
                          <span className="text-xs font-black text-slate-700 mt-0.5">
                            <span className="text-sky-900">{st.morning_count}ص</span> / <span className="text-indigo-900">{st.evening_count}م</span>
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-3 text-center border-r border-slate-200 bg-slate-50/30">
                    {(() => {
                      const st = dept.stages ? dept.stages[3] : undefined; // 🔍 قراءة إحصائية المرحلة الثالثة
                      if (!st || st.total_students === 0) return <span className="text-slate-950 font-black">-</span>; // 🚫 حالة عدم وجود طلبة
                      return (
                        <div className="inline-flex flex-col items-center">
                          <span className="font-black text-slate-950 text-base">{st.total_students}</span>
                          <span className="text-xs font-black text-slate-700 mt-0.5">
                            <span className="text-sky-900">{st.morning_count}ص</span> / <span className="text-indigo-900">{st.evening_count}م</span>
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-3 text-center border-r border-slate-200">
                    {(() => {
                      const st = dept.stages ? dept.stages[4] : undefined; // 🔍 قراءة إحصائية المرحلة الرابعة
                      if (!st || st.total_students === 0) return <span className="text-slate-950 font-black">-</span>; // 🚫 حالة عدم وجود طلبة
                      return (
                        <div className="inline-flex flex-col items-center">
                          <span className="font-black text-slate-950 text-base">{st.total_students}</span>
                          <span className="text-xs font-black text-slate-700 mt-0.5">
                            <span className="text-sky-900">{st.morning_count}ص</span> / <span className="text-indigo-900">{st.evening_count}م</span>
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-4 text-center font-black text-sky-950 bg-sky-50/30 border-r border-slate-200 text-sm sm:text-base">
                    {dept.morning_count || 0}
                  </td>
                  <td className="p-4 text-center font-black text-indigo-950 bg-indigo-50/30 border-r border-slate-200 text-sm sm:text-base">
                    {dept.evening_count || 0}
                  </td>
                  <td className="p-4 text-center font-black text-blue-950 bg-blue-50/20 border-r border-slate-200 text-sm sm:text-base">
                    {dept.male_count}
                  </td>
                  <td className="p-4 text-center font-black text-rose-950 bg-rose-50/20 border-r border-slate-200 text-sm sm:text-base">
                    {dept.female_count}
                  </td>
                  <td className="p-4 text-center font-black text-slate-950 bg-slate-100/60 border-r border-slate-200 text-sm sm:text-base">
                    {dept.total_students}
                  </td>
                  <td className="p-4">
                    {dept.total_students === 0 ? (
                      <div className="flex items-center justify-center">
                        <span className="inline-flex items-center justify-center px-4 py-1.5 bg-slate-100 text-black font-black rounded-xl border border-slate-300 text-sm sm:text-base shadow-2xs">
                          لا يوجد طلاب
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden flex min-w-[50px]">
                          <div 
                            className="bg-sky-500 h-full transition-all duration-500" // 🎨 تدرج سماوي لطلبة الصباحي
                            style={{ width: `${dept.morning_percentage || 0}%` }} // 📐 عرض نسبة الصباحي بدقة
                            title={`صباحي: ${dept.morning_count || 0} (${dept.morning_percentage || 0}%)`} // 🏷️ تلميح الصباحي
                          />
                          <div 
                            className="bg-indigo-600 h-full transition-all duration-500" // 🎨 تدرج بنفسجي كحلي لطلبة المسائي
                            style={{ width: `${dept.evening_percentage || 0}%` }} // 📐 عرض نسبة المسائي بدقة
                            title={`مسائي: ${dept.evening_count || 0} (${dept.evening_percentage || 0}%)`} // 🏷️ تلميح المسائي
                          />
                        </div>
                        <div className="text-xs font-black whitespace-nowrap flex items-center gap-1 min-w-[85px] justify-end">
                          <span className="text-sky-900">{dept.morning_percentage || 0}% ص</span>
                          <span className="text-slate-400 font-normal">/</span>
                          <span className="text-indigo-900">{dept.evening_percentage || 0}% م</span>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredDepartments.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-950 font-black text-base">
                    {searchQuery ? 'لا يوجد قسم مطابق لمعيار البحث المكتوب.' : 'لا يوجد أقسام علمية مسجلة حالياً لإظهار مصفوفة الإحصاء الطلابي.'}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-100/90 text-slate-950 font-black border-t-2 border-slate-300 text-sm sm:text-base">
              <tr>
                <td colSpan={2} className="p-4 text-right font-black text-indigo-950">
                  المجموع الكلي لكافة الأقسام ({filteredDepartments.length} قسماً)
                </td>
                {[1, 2, 3, 4].map((stageNum: number) => {
                  const stage: StageStudentDemographics | undefined = stats.stages_summary ? stats.stages_summary[stageNum] : undefined;
                  return (
                    <td key={stageNum} className="p-3.5 text-center border-x border-slate-200">
                      <span className="text-slate-950 font-black text-base">{stage ? stage.total_students : 0}</span>
                      <div className="text-xs font-black text-slate-700 mt-0.5">
                        <span className="text-sky-900">{stage ? stage.morning_count : 0}ص</span> / <span className="text-indigo-900">{stage ? stage.evening_count : 0}م</span>
                      </div>
                    </td>
                  );
                })}
                <td className="p-4 text-center text-sky-950 font-black bg-sky-100/60 border-r border-slate-200 text-base sm:text-lg">
                  {stats.total_morning || 0}
                </td>
                <td className="p-4 text-center text-indigo-950 font-black bg-indigo-100/60 border-r border-slate-200 text-base sm:text-lg">
                  {stats.total_evening || 0}
                </td>
                <td className="p-4 text-center text-blue-950 font-black bg-blue-100/60 border-r border-slate-200 text-base sm:text-lg">
                  {stats.total_males}
                </td>
                <td className="p-4 text-center text-rose-950 font-black bg-rose-100/60 border-r border-slate-200 text-base sm:text-lg">
                  {stats.total_females}
                </td>
                <td className="p-4 text-center text-slate-950 font-black text-base sm:text-lg bg-slate-200/80 border-r border-slate-200">
                  {stats.total_students}
                </td>
                <td className="p-4 text-center text-xs sm:text-sm font-black text-slate-950">
                  {stats.morning_percentage || 0}% ص / {stats.evening_percentage || 0}% م
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
