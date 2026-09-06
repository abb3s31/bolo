'use client'; // ⚡ ينفذ بالعميل

// 📢 مركز التعميمات والتبليغات والإنذارات الجامعية للطالب (StudentAnnouncementsFeed)
import { useState, useMemo } from 'react'; // 🔗 رياكت
import { CampusAnnouncement, AnnouncementCategory, UserProfile } from '@/types'; // 🔗 الأنواع
import { exportAbsenceWarningNoticePDF } from '@/lib/pdf-export'; // 📄 مولد كتاب الإنذار PDF
import { 
  Bell, 
  Palmtree, 
  GraduationCap, 
  Shirt, 
  AlertTriangle, 
  Sparkles, 
  Download, 
  Calendar, 
  Clock, 
  Filter, 
  CheckCircle2, 
  ShieldCheck,
  Building2,
  type LucideIcon
} from 'lucide-react'; // 🎨 الأيقونات

interface StudentAnnouncementsFeedProps {
  student: UserProfile;                                // 🎓 بيانات الطالب
  announcements: CampusAnnouncement[];                 // 📋 كافة التعميمات
  departmentName?: string;                             // 🏢 اسم القسم
}

export default function StudentAnnouncementsFeed({
  student,
  announcements,
  departmentName = 'القسم الأكاديمي',
}: StudentAnnouncementsFeedProps) {
  const [filterCategory, setFilterCategory] = useState<'all' | AnnouncementCategory>('all');
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  // 🔍 تصفية الإعلانات الموجهة لهذا الطالب بالتحديد أو لمرحلته أو لكافة المراحل في قسمه
  const studentAnnouncements = useMemo(() => {
    return announcements
      .filter((a) => {
        // فحص القسم
        if (a.department_id !== student.department_id) return false;

        // فحص الاستهداف الفردي
        if (a.target_student_ids && a.target_student_ids.length > 0) {
          return a.target_student_ids.includes(student.id);
        }

        // فحص المرحلة
        if (a.target_stage !== null && a.target_stage !== (student.stage_number || 1)) {
          return false;
        }

        return true;
      })
      .filter((a) => {
        if (filterCategory !== 'all' && a.category !== filterCategory) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [announcements, student, filterCategory]);

  // 🏷️ معلومات التصنيفات
  const categoryMetadata: Record<AnnouncementCategory, { label: string; icon: LucideIcon; color: string; bg: string }> = {
    term_commencement: { label: 'بدء واستئناف الدوام', icon: GraduationCap, color: 'text-slate-900', bg: 'bg-slate-100 border-slate-300' },
    official_holiday: { label: 'عطلة رسمية (العراق)', icon: Palmtree, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    uniform_compliance: { label: 'الالتزام بالزي الموحد', icon: Shirt, color: 'text-blue-900', bg: 'bg-blue-50 border-blue-200' },
    absence_warning_1: { label: 'تحذير غياب أولي (5%)', icon: AlertTriangle, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
    absence_warning_2: { label: 'تحذير غياب ثانٍ (7%)', icon: AlertTriangle, color: 'text-rose-800', bg: 'bg-rose-100 border-rose-300' },
    absence_warning_3: { label: 'إنذار غياب نهائي (10%)', icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-50 border-red-300' },
    tuition_notice: { label: 'تبليغ تسديد أقساط', icon: Sparkles, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    general: { label: 'تعميم وقرار عام', icon: Bell, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  };

  // 📄 تصدير كتاب إنذار الغياب PDF
  const handleExportAbsencePDF = async (ann: CampusAnnouncement) => {
    if (!ann.category.startsWith('absence_warning')) return;

    setIsExportingPDF(true);
    await exportAbsenceWarningNoticePDF({
      studentName: student.full_name,
      studentCode: student.university_number || '---',
      departmentName,
      stageNumber: student.stage_number || 1,
      warningLevel: ann.category as 'absence_warning_1' | 'absence_warning_2' | 'absence_warning_3',
      customDetails: ann.content,
    });
    setIsExportingPDF(false);
  };

  return (
    <div className="space-y-6">
      
      {/* 🎛️ الهيدر وشريط الفلاتر بحدود ناعمة */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 bg-slate-900 text-white rounded-xl text-sm font-black">
              قسم {departmentName}
            </span>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-black">
              المرحلة {student.stage_number || 1}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-indigo-700" />
            <span>لوحة التعميمات والتبليغات الرسمية (Campus Announcements Feed)</span>
          </h3>
          <p className="text-base text-slate-700 font-black mt-1">
            القرارات الجامعية، العطل الرسمية، مواعيد الدوام، والإنذارات الرسمية
          </p>
        </div>

        {/* فلاتر التصنيف */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-300">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-4 py-2 rounded-xl text-base font-black transition cursor-pointer ${ filterCategory === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:text-black' }`}
          >
            الكل ({studentAnnouncements.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory('term_commencement')}
            className={`px-4 py-2 rounded-xl text-base font-black transition cursor-pointer ${ filterCategory === 'term_commencement' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:text-black' }`}
          >
            الدوام 🚀
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory('official_holiday')}
            className={`px-4 py-2 rounded-xl text-base font-black transition cursor-pointer ${ filterCategory === 'official_holiday' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:text-black' }`}
          >
            العطل 🌴
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory('uniform_compliance')}
            className={`px-4 py-2 rounded-xl text-base font-black transition cursor-pointer ${ filterCategory === 'uniform_compliance' ? 'bg-sky-700 text-white shadow-xs' : 'text-slate-700 hover:text-black' }`}
          >
            الزي 👔
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory('absence_warning_1')}
            className={`px-4 py-2 rounded-xl text-base font-black transition cursor-pointer ${ filterCategory.startsWith('absence_warning') ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-700 hover:text-black' }`}
          >
            الإنذارات ⚠️
          </button>
        </div>
      </div>

      {/* 📋 بطاقات التعميمات والتبليغات */}
      <div className="space-y-4">
        {studentAnnouncements.map((ann) => {
          const meta = categoryMetadata[ann.category] || categoryMetadata.general;
          const isWarning = ann.category.startsWith('absence_warning');
          const CategoryIcon = meta.icon;

          return (
            <div
              key={ann.id}
              className={`bg-white rounded-3xl border p-6 sm:p-7 space-y-4 shadow-xs transition hover:shadow-md ${
                isWarning
                  ? 'border-rose-500 ring-2 ring-rose-400/40 bg-rose-50/15'
                  : ann.is_urgent
                  ? 'border-rose-400 ring-2 ring-rose-400/40'
                  : 'border-slate-200'
              }`}
            >
              {/* هيدر البطاقة */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`px-3 py-1 rounded-xl text-sm font-black border flex items-center gap-2 ${meta.bg} ${meta.color}`}>
                    <CategoryIcon className="w-4 h-4" />
                    <span>{meta.label}</span>
                  </span>

                  {ann.is_urgent && (
                    <span className="px-3 py-1 bg-rose-600 text-white rounded-xl text-sm font-black animate-pulse">
                      عاجل وهام 🚨
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm font-black text-slate-700 font-mono">
                  <Calendar className="w-4 h-4 text-indigo-700" />
                  <span>{new Date(ann.created_at).toLocaleDateString('ar-IQ-u-nu-latn')}</span>
                </div>
              </div>

              {/* العنوان والمحتوى */}
              <div>
                <h4 className="font-black text-lg sm:text-xl text-slate-950 leading-snug">
                  {ann.title}
                </h4>
                <p className="text-base font-black text-slate-800 mt-2.5 leading-relaxed whitespace-pre-line bg-slate-50 p-5 rounded-2xl border border-slate-300">
                  {ann.content}
                </p>
              </div>

              {/* تذييل البطاقة */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-base font-black text-slate-700">
                <div className="flex items-center gap-2">
                  <span>الصادر عن: <strong className="text-slate-950">{ann.author_name} ({ann.author_role})</strong></span>
                  {ann.effective_date && (
                    <>
                      <span>•</span>
                      <span>موعد السريان / العطلة: <strong className="text-indigo-700 font-mono">{ann.effective_date}</strong></span>
                    </>
                  )}
                </div>

                {isWarning && (
                  <button
                    type="button"
                    onClick={() => handleExportAbsencePDF(ann)}
                    disabled={isExportingPDF}
                    className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl text-base font-black transition cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل كتاب الإنذار الرسمي PDF 📄</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}

        {studentAnnouncements.length === 0 && (
          <div className="bg-white p-14 rounded-3xl border border-slate-200 text-center space-y-2 shadow-xs">
            <Bell className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-base font-black text-slate-950">لا توجد تعميمات جديدة حالياً</h4>
            <p className="text-base text-slate-700 font-black">يتم نشر التبليغات والقرارات والعطل الرسمية من قبل رئاسة القسم فور صدورها.</p>
          </div>
        )}
      </div>

    </div>
  );
}
