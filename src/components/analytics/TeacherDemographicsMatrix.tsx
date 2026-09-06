'use client'; // ⚡ ينفذ ببيئة المتصفح للمستخدم للتفاعل المباشر

// 📦 استيراد الأدوات والمكتبات الأساسية من ريأكت
import React, { useState, useMemo } from 'react';
// 🎨 استيراد أيقونات Lucide المعبرة
import { 
  Users, 
  UserCheck, 
  Search, 
  Building2, 
  Layers,
  GraduationCap
} from 'lucide-react';
// 🔗 استيراد واجهات الأنواع الصريحة لمنع any تماماً
import { 
  CollegeTeacherDemographics, 
  DepartmentTeacherDemographics, 
  UserProfile, 
  Department 
} from '@/types';
// 🧮 استيراد دوال الحسابات الديموغرافية
import { calculateTeacherDemographics } from '@/lib/demographics-utils';

// 📋 تعريف خصائص المكون (Props Interface)
interface TeacherDemographicsMatrixProps {
  profiles?: UserProfile[]; // 👥 مصفوفة المستخدمين لتوليد إحصائيات التدريسيين منها تلقائياً
  departments?: Department[]; // 🏛️ مصفوفة الأقسام الأكاديمية الـ 12
  demographicsData?: CollegeTeacherDemographics; // 📊 أو تمرير بيانات إحصائية جاهزة ومحسوبة مسبقاً
}

// 👑 المكون البصري الفاخر لإحصائيات توزيع الكادر التدريسي والذكور والإناث (المسؤول العام)
export const TeacherDemographicsMatrix: React.FC<TeacherDemographicsMatrixProps> = ({
  profiles = [], // 👥 القيمة الافتراضية للبروفايلات
  departments = [], // 🏛️ القيمة الافتراضية للأقسام
  demographicsData, // 📊 البيانات الجاهزة إن وجدت
}) => {
  // 🔍 حالة البحث السريع عن الأقسام
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 🧮 حساب البيانات الديموغرافية الشاملة للتدريسيين بكافة الأقسام
  const stats: CollegeTeacherDemographics = useMemo(() => {
    // 🛡️ إذا تم تمرير بيانات جاهزة، نستخدمها مباشرة
    if (demographicsData) {
      return demographicsData;
    }
    // ⚡ وإلا نقوم بحسابها فورياً بدقة من مصفوفة البروفايلات والأقسام
    return calculateTeacherDemographics(profiles, departments);
  }, [demographicsData, profiles, departments]);

  // 🔎 تصفية الأقسام بناءً على كلمة البحث
  const filteredDepartments: DepartmentTeacherDemographics[] = useMemo(() => {
    // 🧹 تنظيف نص البحث
    const query = searchQuery.trim().toLowerCase();
    // ⚡ إذا لا يوجد بحث، نرجع كل الأقسام
    if (!query) {
      return stats.departments;
    }
    // 🎯 فلترة الأقسام بناءً على الاسم أو الكود
    return stats.departments.filter((dept: DepartmentTeacherDemographics) => 
      dept.department_name.toLowerCase().includes(query) || 
      dept.department_code.toLowerCase().includes(query)
    );
  }, [stats.departments, searchQuery]);

  return (
    <div className="space-y-6 w-full" dir="rtl">
      {/* 🌟 بطاقات المؤشرات الرئيسية (KPI Cards) للكادر التدريسي بالجامعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
        
        {/* 1. بطاقة إجمالي الكادر التدريسي الكلي */}
        <div className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              {/* 🏷️ عنوان البطاقة */}
              <p className="text-base font-black uppercase tracking-wider text-slate-950 mb-1">
                إجمالي الكادر التدريسي (الكل)
              </p>
              {/* 🔢 الرقم الإجمالي الكلي للأساتذة */}
              <h3 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                {stats.total_teachers.toLocaleString('en-US')}
                <span className="text-base font-black text-slate-950 mr-2">أستاذ وتدريسي</span>
              </h3>
            </div>
            {/* 🎨 أيقونة مميزة */}
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-2xs">
              <GraduationCap className="w-7 h-7" />
            </div>
          </div>

          {/* 📊 شريط ملخص التوزيع الإجمالي */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-sm sm:text-base text-slate-950 mb-1.5 font-black">
              <span>تغطية الأقسام العلمية:</span>
              <span className="text-indigo-950 font-black">{stats.departments_count} قسماً معتمداً</span>
            </div>
            {/* 🏷️ إظهار نسبتي الذكور والإناث كل واحدة فوق لونها المطابق تماماً بناءً على طلب المستخدم */}
            <div className="flex items-center justify-between text-xs sm:text-sm font-black mt-2.5 mb-1.5">
              <span className="text-blue-700 flex items-center gap-1.5 font-black">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                <span>ذكور: {stats.male_percentage}%</span>
              </span>
              <span className="text-rose-600 flex items-center gap-1.5 font-black">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span>إناث: {stats.female_percentage}%</span>
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex border border-slate-200">
              <div 
                className="bg-blue-600 h-full transition-all duration-700" 
                style={{ width: `${stats.total_teachers > 0 ? stats.male_percentage : 50}%` }}
                title={`الذكور: ${stats.male_percentage}%`}
              />
              <div 
                className="bg-rose-500 h-full transition-all duration-700" 
                style={{ width: `${stats.total_teachers > 0 ? stats.female_percentage : 50}%` }}
                title={`الإناث: ${stats.female_percentage}%`}
              />
            </div>
          </div>
        </div>

        {/* 2. بطاقة إجمالي التدريسيين الذكور */}
        <div className="relative overflow-hidden bg-blue-50/40 border border-blue-200 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              {/* 🏷️ عنوان البطاقة */}
              <p className="text-base font-black uppercase tracking-wider text-blue-950 mb-1">
                إجمالي التدريسيين الذكور
              </p>
              {/* 🔢 الرقم الإجمالي للذكور */}
              <h3 className="text-3xl sm:text-4xl font-black text-blue-950 tracking-tight">
                {stats.total_males.toLocaleString('en-US')}
                <span className="text-base font-black text-blue-900 mr-2">تدريسي</span>
              </h3>
            </div>
            {/* 🎨 أيقونة مميزة */}
            <div className="w-14 h-14 rounded-2xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700 shadow-2xs">
              <Users className="w-7 h-7" />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200/80 flex items-center justify-between text-sm sm:text-base font-black text-blue-950">
            <span>النسبة المئوية من الكادر:</span>
            <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-950 font-black border border-blue-300">
              {stats.male_percentage}%
            </span>
          </div>
        </div>

        {/* 3. بطاقة إجمالي التدريسيات الإناث */}
        <div className="relative overflow-hidden bg-rose-50/40 border border-rose-200 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              {/* 🏷️ عنوان البطاقة */}
              <p className="text-base font-black uppercase tracking-wider text-rose-950 mb-1">
                إجمالي التدريسيات الإناث
              </p>
              {/* 🔢 الرقم الإجمالي للإناث */}
              <h3 className="text-3xl sm:text-4xl font-black text-rose-950 tracking-tight">
                {stats.total_females.toLocaleString('en-US')}
                <span className="text-base font-black text-rose-900 mr-2">تدريسية</span>
              </h3>
            </div>
            {/* 🎨 أيقونة مميزة */}
            <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shadow-2xs">
              <UserCheck className="w-7 h-7" />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-rose-200/80 flex items-center justify-between text-sm sm:text-base font-black text-rose-950">
            <span>النسبة المئوية من الكادر:</span>
            <span className="px-3 py-1 rounded-xl bg-rose-100 text-rose-950 font-black border border-rose-300">
              {stats.female_percentage}%
            </span>
          </div>
        </div>

      </div>

      {/* 📊 جدول مصفوفة الكادر التدريسي المفصل للأقسام الـ 12 */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs w-full">
        
        {/* 🏷️ شريط عنوان الجدول مع البحث السريع */}
        <div className="p-6 sm:p-8 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/70">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-700" />
              <span>مصفوفة توزيع الكادر التدريسي على الأقسام العلمية ({filteredDepartments.length} قسماً)</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-950 font-black mt-1.5">
              توزيع التدريسيين والتدريسيات ونسب التكليف الأكاديمي المباشر في فرع ميسان
            </p>
          </div>

          {/* 🔍 حقل البحث في الأقسام */}
          <div className="relative w-full md:w-80">
            <Search className="w-5 h-5 text-slate-700 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="ابحث عن قسم علمي أو رمز..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-11 py-3 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-950 placeholder:text-slate-700 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>
        </div>

        {/* 📋 جدول العرض الشامل */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-right text-sm sm:text-base border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-950 font-black">
                <th className="p-4 text-center w-16 text-sm sm:text-base">ت</th>
                <th className="p-4 text-sm sm:text-base">القسم العلمي الأكاديمي</th>
                <th className="p-4 text-center text-sm sm:text-base">الرمز الأكاديمي</th>
                <th className="p-4 text-center bg-blue-50/50 text-blue-950 text-sm sm:text-base">
                  <div className="flex items-center justify-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-700" />
                    <span>التدريسيين الذكور</span>
                  </div>
                </th>
                <th className="p-4 text-center bg-rose-50/50 text-rose-950 text-sm sm:text-base">
                  <div className="flex items-center justify-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-rose-700" />
                    <span>التدريسيات الإناث</span>
                  </div>
                </th>
                <th className="p-4 text-center text-sm sm:text-base">المجموع الكلي</th>
                <th className="p-4 text-center w-64 text-sm sm:text-base">شريط التوزيع النسبي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-black text-slate-950">
              {filteredDepartments.map((dept, index) => {
                return (
                  <tr key={dept.department_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-center text-slate-950 font-black text-base">
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-lg text-sm font-black text-slate-950 shadow-2xs">
                        {index + 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-5 h-5 text-indigo-700 flex-shrink-0" />
                        <span className="font-black text-slate-950 text-sm sm:text-base">{dept.department_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-950 text-sm font-black border border-slate-300">
                        {dept.department_code || 'DEPT'}
                      </span>
                    </td>
                    <td className="p-4 text-center bg-blue-50/30">
                      <div className="flex flex-col items-center justify-center">
                        <span className="font-black text-blue-950 text-base sm:text-lg">
                          {dept.male_count}
                        </span>
                        <span className="text-sm font-black text-blue-950">
                          ({dept.male_percentage}%)
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center bg-rose-50/30">
                      <div className="flex flex-col items-center justify-center">
                        <span className="font-black text-rose-950 text-base sm:text-lg">
                          {dept.female_count}
                        </span>
                        <span className="text-sm font-black text-rose-950">
                          ({dept.female_percentage}%)
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-3.5 py-1.5 bg-slate-100 text-slate-950 font-black rounded-xl border border-slate-300 text-sm sm:text-base shadow-2xs">
                        {dept.total_teachers} أستاذ/ـة
                      </span>
                    </td>
                    <td className="p-4">
                      {dept.total_teachers === 0 ? (
                        <div className="flex items-center justify-center">
                          <span className="inline-flex items-center justify-center px-4 py-1.5 bg-slate-100 text-black font-black rounded-xl border border-slate-300 text-sm sm:text-base shadow-2xs">
                            لا يوجد كادر
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden flex border border-slate-200">
                            <div 
                              className="bg-blue-600 h-full transition-all duration-500" 
                              style={{ width: `${dept.male_percentage}%` }} 
                              title={`ذكور: ${dept.male_count} (${dept.male_percentage}%)`}
                            />
                            <div 
                              className="bg-rose-500 h-full transition-all duration-500" 
                              style={{ width: `${dept.female_percentage}%` }} 
                              title={`إناث: ${dept.female_count} (${dept.female_percentage}%)`}
                            />
                          </div>
                          <div className="text-xs sm:text-sm font-black whitespace-nowrap flex items-center gap-1 min-w-[85px] justify-end">
                            <span className="text-blue-900">{dept.male_percentage}% ذ</span>
                            <span className="text-slate-400 font-normal">/</span>
                            <span className="text-rose-900">{dept.female_percentage}% ث</span>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredDepartments.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-950 font-black text-base">
                    {searchQuery ? 'لا يوجد قسم مطابق لكلمة البحث الحالية.' : 'لا يوجد أقسام علمية مسجلة حالياً لعرض مصفوفة الكادر التدريسي.'}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/90 text-slate-950 font-black text-sm sm:text-base border-t-2 border-slate-300">
                <td colSpan={3} className="p-4 text-right pr-6 font-black text-indigo-950">
                  المجموع الكلي لكافة الأقسام ({stats.departments_count} قسماً):
                </td>
                <td className="p-4 text-center bg-blue-100/70 text-blue-950 font-black border border-blue-200 text-base sm:text-lg">
                  {stats.total_males} ذ ({stats.male_percentage}%)
                </td>
                <td className="p-4 text-center bg-rose-100/70 text-rose-950 font-black border border-rose-200 text-base sm:text-lg">
                  {stats.total_females} ث ({stats.female_percentage}%)
                </td>
                <td className="p-4 text-center font-black text-slate-950 text-base sm:text-lg">
                  {stats.total_teachers} تدريسي
                </td>
                <td className="p-4 text-center font-black text-slate-950 text-xs sm:text-sm">
                  <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                    <span className="text-blue-900">{stats.male_percentage || 0}% ذ</span>
                    <span className="text-slate-400 font-normal">/</span>
                    <span className="text-rose-900">{stats.female_percentage || 0}% ث</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>
    </div>
  );
};
