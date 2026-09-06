'use client'; // ⚡ ينفذ بالعميل على متصفح الطالب

// 📢 مكون استعراض التعميمات والقرارات الرسمية للطلبة - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import React, { useState, useMemo } from 'react'; // ⚛️ استيراد رياكت وإدارة الحالة والذاكرة المؤقتة
import { 
  Megaphone, 
  Search, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  Shirt, 
  GraduationCap, 
  Palmtree, 
  Bell, 
  CheckCircle2, 
  Printer, 
  Building2,
  Filter,
  type LucideIcon
} from 'lucide-react'; // 🎨 أيقونات فيكتور تفاعلية
import { CampusAnnouncement, AnnouncementCategory, UserProfile } from '@/types'; // 🔗 واجهات الأنواع الصريحة لمنع أي أخطاء
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🧮 أسماء المراحل بالعربي

// 📋 الخصائص المستقبلة لمكون تعميمات الطالب
interface StudentAnnouncementsViewProps {
  currentUser: UserProfile;                     // 👤 الملف الشخصي للطالب الحالي
  announcements: CampusAnnouncement[];          // 📋 قائمة التعميمات المتزامنة سحابياً
}

// 🏷️ إعدادات وتصنيفات التعميمات الرسمية
const CATEGORY_META: Record<AnnouncementCategory, { label: string; icon: LucideIcon; color: string; bg: string; border: string }> = {
  term_commencement: { label: 'بدء واستئناف الدوام', icon: GraduationCap, color: 'text-slate-900', bg: 'bg-slate-100', border: 'border-slate-300' },
  official_holiday: { label: 'عطلة رسمية (العراق)', icon: Palmtree, color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  uniform_compliance: { label: 'الالتزام بالزي الموحد والباج', icon: Shirt, color: 'text-blue-900', bg: 'bg-blue-50', border: 'border-blue-200' },
  absence_warning_1: { label: 'تحذير غياب أولي (5%)', icon: AlertTriangle, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  absence_warning_2: { label: 'تحذير غياب ثانٍ (7%)', icon: AlertTriangle, color: 'text-rose-800', bg: 'bg-rose-100', border: 'border-rose-300' },
  absence_warning_3: { label: 'إنذار غياب نهائي (10%)', icon: AlertTriangle, color: 'text-red-800', bg: 'bg-red-50', border: 'border-red-300' },
  tuition_notice: { label: 'تبليغ تسديد أقساط', icon: Sparkles, color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200' },
  general: { label: 'تعميم وقرار رسمي عام', icon: Bell, color: 'text-slate-800', bg: 'bg-slate-50', border: 'border-slate-200' },
};

export default function StudentAnnouncementsView({
  currentUser,
  announcements
}: StudentAnnouncementsViewProps) {
  // 📌 حالات الفلترة والبحث
  const [selectedCategory, setSelectedCategory] = useState<'all' | AnnouncementCategory>('all'); // 🏷️ الفلترة بالتصنيف
  const [searchQuery, setSearchQuery] = useState<string>(''); // 🔍 نص البحث

  // 🎯 تصفية التعميمات الخاصة بهذا الطالب بناءً على قسمه ومرحلته والاستهداف
  const studentAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      // 🏢 فحص تطابق القسم أو إذا كان تعميم شامل للكلية
      const isDeptMatch = a.target_scope === 'all_stages' || a.department_id === currentUser.department_id;
      if (!isDeptMatch) return false;

      // 🎓 فحص تطابق المرحلة الدراسية (null يعني كل المراحل)
      if (a.target_stage !== null && a.target_stage !== currentUser.stage_number) {
        return false;
      }

      // 👤 فحص الاستهداف الفردي أو الجماعي المخصص
      if (a.target_scope === 'single_student' || a.target_scope === 'selected_students') {
        if (!a.target_student_ids || !a.target_student_ids.includes(currentUser.id)) {
          return false;
        }
      }

      // 🏷️ الفلترة بالتصنيف إذا اختار تصنيف محدد
      if (selectedCategory !== 'all' && a.category !== selectedCategory) {
        return false;
      }

      // 🔍 البحث بالكلمات المفتاحية في العنوان والنص
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
      }

      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // ⏳ الترتيب من الأحدث للأقدم
  }, [announcements, currentUser, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-right" dir="rtl">
      
      {/* 📢 كارت الترويسة الرسمي للتعميمات والتبليغات */}
      <div className="bg-gradient-to-r from-[#0F2942] via-[#163a5f] to-[#0F2942] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-white/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-sky-300 shadow-inner">
              <Megaphone className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-black rounded-xl">
                  اللوحة الرسمية
                </span>
                <span className="text-white/80 text-xs font-black">
                  جامعة الإمام جعفر الصادق (ع) - فرع ميسان
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mt-1">
                التعميمات والقرارات الأكاديمية الرسمية
              </h2>
              <p className="text-white/75 text-sm mt-1 font-medium">
                متابعة مباشرة للكتب الرسمية، العطل، قرارات الزي الجامعي، ومواعيد الامتحانات الصادرة من رئاسة القسم والعمادة.
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center self-stretch md:self-auto">
            <span className="text-white/80 text-xs font-black block">إجمالي التعميمات المنشورة</span>
            <span className="text-2xl font-black text-sky-300 font-mono">{studentAnnouncements.length}</span>
          </div>
        </div>
      </div>

      {/* 🔍 شريط البحث والتصفية بالتصنيفات */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-xs space-y-4">
        
        {/* 🔎 حقل البحث النصي */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في نصوص وعناوين القرارات والتعميمات الرسمية..."
            className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-black text-slate-950 focus:outline-none focus:border-[#0F2942] focus:bg-white transition shadow-inner"
          />
        </div>

        {/* 🔘 أزرار التصفية السريعة للتصنيفات */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer border ${
              selectedCategory === 'all'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            كافة التعميمات ({announcements.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('official_holiday')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer border flex items-center gap-1.5 ${
              selectedCategory === 'official_holiday'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Palmtree className="w-3.5 h-3.5" />
            <span>العطل الرسمية</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('uniform_compliance')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer border flex items-center gap-1.5 ${
              selectedCategory === 'uniform_compliance'
                ? 'bg-blue-800 text-white border-blue-800 shadow-xs'
                : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>الزي الموحد</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('term_commencement')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer border flex items-center gap-1.5 ${
              selectedCategory === 'term_commencement'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>استئناف الدوام</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('general')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer border flex items-center gap-1.5 ${
              selectedCategory === 'general'
                ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>قرارات عامة</span>
          </button>
        </div>

      </div>

      {/* 📋 قائمة بطاقات التعميمات الرسمية */}
      <div className="space-y-4">
        {studentAnnouncements.map((ann) => {
          const meta = CATEGORY_META[ann.category] || CATEGORY_META.general;
          const IconComp = meta.icon;
          const formattedDate = new Date(ann.created_at).toLocaleDateString('ar-IQ-u-nu-latn', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          return (
            <div
              key={ann.id}
              className={`bg-white border rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition relative overflow-hidden space-y-4 ${
                ann.is_urgent ? 'border-rose-300 ring-2 ring-rose-400/20' : 'border-slate-200'
              }`}
            >
              {/* 🚨 شريط علوي بارز إذا كان التعميم عاجلاً */}
              {ann.is_urgent && (
                <div className="bg-rose-600 text-white px-4 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-xs mb-1">
                  <AlertTriangle className="w-4 h-4 text-white" />
                  <span>تعميم رسمي عاجل وهام جداً</span>
                </div>
              )}

              {/* 🏷️ ترويسة بطاقة التعميم */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl border ${meta.bg} ${meta.border} ${meta.color}`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-xl text-xs font-black border ${meta.bg} ${meta.border} ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                        {ann.target_stage === null ? 'كافة المراحل' : `المرحلة ${getStageNameInArabic(ann.target_stage)}`}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-950 mt-1.5">
                      {ann.title}
                    </h3>
                  </div>
                </div>

                {/* 📅 تاريخ ووقت النشر */}
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-center font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formattedDate}</span>
                </div>
              </div>

              {/* 📅 بانر تاريخ النفاذ أو موعد العطلة إن وجد */}
              {ann.effective_date && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs sm:text-sm font-black">
                  <Calendar className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>تاريخ النفاذ والبدء المعتمد:</span>
                  <span className="font-mono underline">{ann.effective_date}</span>
                </div>
              )}

              {/* 📄 نص ومضمون التعميم الرسمي */}
              <div className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                {ann.content}
              </div>

              {/* 👤 تذييل البطاقة بمعلومات الناشر والجهة الرسمية */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600 font-bold">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-900" />
                  <span>الجهة المصدرة: <strong>{ann.author_name} ({ann.author_role})</strong></span>
                </div>
                <div className="flex items-center gap-1 text-emerald-700 font-black">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>موثق رسمياً</span>
                </div>
              </div>

            </div>
          );
        })}

        {/* 📭 حالة عدم وجود تعميمات مطابقة */}
        {studentAnnouncements.length === 0 && (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-3">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Megaphone className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-slate-900">لا توجد تعميمات حالياً</h4>
            <p className="text-sm font-bold text-slate-500 max-w-md mx-auto">
              لم تصدر أي كتب أو تعميمات رسمية موجهة لك في الوقت الراهن. سيتم إشعارك فور صدور أي قرار رسمي جديد.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
