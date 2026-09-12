'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🔲 صفحة التحقق الإلكتروني المركزية من صحة الوثائق والبطاقات الأكاديمية عبر رمز الاستجابة السريعة (QR Code) - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { use, useEffect, useState } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة ودورة الحياة
import Image from 'next/image'; // 🖼️ مكون الصور
import Link from 'next/link'; // 🔗 روابط نكست
import { getStoredData, INITIAL_PROFILES, INITIAL_GRADES, INITIAL_COURSES } from '@/lib/mock-data'; // 💾 التخزين
import { fetchVerificationProfileAndGrades } from '@/lib/supabase-client'; // ☁️ فحص الوثيقة وسجل الدرجات من سحابة Supabase مباشرة
import { UserProfile, Grade, Course } from '@/types'; // 🔗 الأنواع الرسمية
import { calculateFinalTotal, getLetterGrade, getStageNameInArabic, isStudentPassedFirstRound, getCourseAssessmentScheme, calculateCourseworkTotal } from '@/lib/grade-utils'; // 🧮 دوال حساب الدرجات والمخططات والسعي
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Building2, 
  Award, 
  BookOpen, 
  Printer, 
  QrCode, 
  BadgeCheck, 
  GraduationCap, 
  Hash, 
  Clock 
} from 'lucide-react'; // 🎨 الأيقونات
import { sanitizeRouteParam } from '@/lib/security/sanitizer'; // 🛡️ معقم معاملات المسارات

export default function PublicVerifyTranscriptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params); // 🔗 فك البارامترات
  const entityId = sanitizeRouteParam(resolvedParams.id, '');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [studentGrades, setStudentGrades] = useState<Grade[]>([]);
  const [verifyDate, setVerifyDate] = useState<string>('');

  // 🔄 البحث عن الحساب أو الطالب صاحب الوثيقة
  useEffect(() => {
    setVerifyDate(new Date().toLocaleString('ar-IQ-u-nu-latn', { dateStyle: 'full', timeStyle: 'short' }));
    
    // 💾 أولاً: فحص الكاش المحلي السريع
    const profiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const found = profiles.find(
      (p) =>
        p.university_number === entityId ||
        p.id === entityId ||
        p.generated_email.toLowerCase() === entityId.toLowerCase()
    );
    if (found) {
      setProfile(found);

      // 📊 إذا كان طالباً، جلب درجات مواده المعتمدة
      if (found.role === 'student') {
        const allGrades = getStoredData<Grade[]>('grades', INITIAL_GRADES);
        const myGrades = allGrades.filter(
          (g) => g.student_id === found.id || g.university_number === found.university_number
        );
        setStudentGrades(myGrades);
      }
    }

    // ☁️ ثانياً: الاستعلام السحابي اللحظي المباشر من قاعدة بيانات Supabase (لضمان الفحص من أي جهاز أو هاتف خارجي)
    fetchVerificationProfileAndGrades(entityId).then(({ profile: liveProf, grades: liveGrades }) => {
      if (liveProf) {
        setProfile(liveProf);
        if (liveGrades && liveGrades.length > 0) {
          setStudentGrades(liveGrades);
        }
      }
    }).catch(() => {});
  }, [entityId]);

  // 🧮 حساب المعدل الفصلي ونقاط بولونيا مع مراعاة حالة الامتحان النهائي والدور الثاني لكل مقرر
  const courses = getStoredData<Course[]>('courses', INITIAL_COURSES);
  const totalCourses = studentGrades.length;
  const totalScoreSum = studentGrades.reduce((sum, g) => {
    const cObj = courses.find((c) => c.id === g.course_id);
    const courseScheme = cObj ? getCourseAssessmentScheme(cObj) : undefined;
    const isFinalActive = cObj?.is_final_exam_enabled === true;
    const isSupActive = cObj?.is_supplementary_exam_enabled === true;
    const cw = courseScheme ? calculateCourseworkTotal(g, courseScheme) : (g.final_coursework_total || 0);
    return sum + (isFinalActive ? calculateFinalTotal(g, isSupActive, courseScheme) : cw);
  }, 0);
  const completedGrades = studentGrades.filter((g) => {
    const cObj = courses.find((c) => c.id === g.course_id);
    const courseScheme = cObj ? getCourseAssessmentScheme(cObj) : undefined;
    const isFinalActive = cObj?.is_final_exam_enabled === true;
    const isSupActive = cObj?.is_supplementary_exam_enabled === true;
    const cw = courseScheme ? calculateCourseworkTotal(g, courseScheme) : (g.final_coursework_total || 0);
    return isFinalActive ? calculateFinalTotal(g, isSupActive, courseScheme) >= 50 : cw >= 25;
  });
  const avgScore = totalCourses > 0 ? (totalScoreSum / totalCourses).toFixed(1) : '0.0';

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center bg-slate-50 py-10 px-4 font-sans select-none" dir="rtl">
      
      {/* 🏛️ بطاقة التحقق الرسمية الفاخرة بحدود ناعمة */}
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-center relative overflow-hidden">
        
        {/* 🛡️ شريط أمان علوي هولوغرافي */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500"></div>

        {/* 🖼️ الشعار وهوية الجامعة بدون حدود سوداء */}
        <div className="flex flex-col items-center space-y-2 pt-2">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center p-1 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <Image src="/logo.webp" alt="جامعة الصادق فرع ميسان" width={96} height={96} className="object-contain" priority />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950">جامعة الإمام جعفر الصادق (ع)</h1>
            <p className="text-base sm:text-lg font-black text-emerald-800 mt-1">فرع ميسان — بوابة التحقق الرقمي المركزي المعتمدة</p>
          </div>
        </div>

        {/* 🟢 حالة التوثيق بحدود ناعمة */}
        {profile ? (
          <div className="p-5 sm:p-6 bg-emerald-50 border border-emerald-400 rounded-3xl space-y-3 text-right relative overflow-hidden shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center border border-emerald-300 shrink-0">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-emerald-950">
                    {profile.role === 'student' ? 'وثيقة سعي أكاديمية معتمدة وموثقة رسمياً' : 'بطاقة اعتماد أكاديمية رسمية مسجلة'}
                  </h2>
                  <span className="px-3 py-0.5 bg-emerald-200/80 text-emerald-950 rounded-full text-base font-black">
                    موثق 100%
                  </span>
                </div>
                <p className="text-base font-black text-emerald-900 leading-relaxed">
                  تمت مطابقة السجل إلكترونياً مع قاعدة بيانات شعبة شؤون الطلبة والتسجيل واللجان الامتحانية.
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-base font-black text-emerald-800">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                تاريخ الفحص: {verifyDate}
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                البصمة: zt_valid_{profile.id.substring(0, 8)}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-red-50 border border-red-300 rounded-3xl space-y-2.5 text-center shadow-2xs">
            <div className="w-14 h-14 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mx-auto border border-red-300">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-red-950">الوثيقة غير مسجلة أو غير صالحة</h2>
            <p className="text-base font-black text-red-800 leading-relaxed max-w-md mx-auto">
              لم يتم العثور على سجل مطابق للرقم المدخل ({entityId}). يرجى مراجعة إدارة الكلية وشعبة التسجيل وشؤون الطلبة.
            </p>
          </div>
        )}

        {/* 📋 بيانات وثيقة أو بطاقة المستخدم المعنية بحدود ناعمة */}
        {profile && (
          <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 text-right text-base font-black space-y-3 shadow-2xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
              <span className="text-slate-700">الاسم الرباعي واللقب:</span>
              <span className="font-black text-slate-950 text-lg">{profile.full_name}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
              <span className="text-slate-700">الصفة الأكاديمية:</span>
              <span className="font-black text-slate-950">
                {profile.role === 'super_admin' ? 'المسؤول العام عن المنظومة' :
                 profile.role === 'department_head' ? 'رئيس قسم أكاديمي' :
                 profile.role === 'rapporteur' ? 'مقرر قسم أكاديمي' :
                 profile.role === 'teacher' ? 'تدريسي' : 'طالب جامعي'}
              </span>
            </div>

            {profile.department_name && (
              <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                <span className="text-slate-700">القسم العلمي:</span>
                <span className="font-black text-slate-900">{profile.department_name}</span>
              </div>
            )}

            {profile.stage_number && (
              <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                <span className="text-slate-700">المرحلة الأكاديمية:</span>
                <span className="font-black text-slate-900">المرحلة {getStageNameInArabic(profile.stage_number)}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-700">الرقم الجامعي / الوظيفي:</span>
              <span className="font-black text-slate-950 bg-slate-200 px-3 py-1 rounded-xl font-mono text-base">{profile.university_number}</span>
            </div>
          </div>
        )}

        {/* 📊 بطاقات الإحصاءات الأكاديمية السريعة للطالب */}
        {profile && profile.role === 'student' && studentGrades.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-slate-100 border border-slate-200 text-slate-900 rounded-2xl text-center space-y-1">
              <span className="block text-sm font-black text-slate-700">إجمالي المواد</span>
              <strong className="text-xl font-black font-mono">{totalCourses}</strong>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl text-center space-y-1">
              <span className="block text-sm font-black text-emerald-700">المواد المجتازة</span>
              <strong className="text-xl font-black font-mono">{completedGrades.length} / {totalCourses}</strong>
            </div>
            <div className="p-4 bg-cyan-50 border border-cyan-300 text-cyan-950 rounded-2xl text-center space-y-1">
              <span className="block text-sm font-black text-cyan-700">المعدل الفصلي</span>
              <strong className="text-xl font-black font-mono">{avgScore}%</strong>
            </div>
          </div>
        )}

        {/* 📊 جدول ملخص الدرجات المعتمدة إذا كان المعرف لطالب */}
        {profile && profile.role === 'student' && studentGrades.length > 0 && (
          <div className="space-y-3 text-right">
            <h3 className="text-base font-black text-slate-950 flex items-center gap-2 justify-start">
              <BookOpen className="w-5 h-5 text-blue-700" />
              <span>المواد الدراسية والسعيات المعتمدة رسمياً (مسار بولونيا)</span>
            </h3>

            {(() => {
              const hasAnyFinalActive = studentGrades.some((g) => courses.find((c) => c.id === g.course_id)?.is_final_exam_enabled === true);
              return (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-right text-base font-black">
                    <thead className="bg-slate-100 text-slate-900 border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">المادة الدراسية</th>
                        <th className="p-3.5 text-center">السعي (50)</th>
                        {/* 🎯 عمود النهائي يظهر فقط إذا كان مفعلاً */}
                        {hasAnyFinalActive && (
                          <th className="p-3.5 text-center">النهائي (50)</th>
                        )}
                        <th className="p-3.5 text-center">
                          {hasAnyFinalActive ? 'المجموع (100)' : 'المجموع'}
                        </th>
                        <th className="p-3.5 text-center">التقدير</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {studentGrades.map((g) => {
                        const cObj = courses.find((c) => c.id === g.course_id);
                        const courseScheme = cObj ? getCourseAssessmentScheme(cObj) : undefined;
                        const isFinalActive = cObj?.is_final_exam_enabled === true;
                        const isSupActive = cObj?.is_supplementary_exam_enabled === true;
                        const cwTotal = courseScheme ? calculateCourseworkTotal(g, courseScheme) : (g.final_coursework_total || 0);
                        const finalScore = isFinalActive ? calculateFinalTotal(g, isSupActive, courseScheme) : cwTotal;
                        const letter = isFinalActive ? getLetterGrade(finalScore) : 'سعي فقط';
                        const isPassed1st = isStudentPassedFirstRound(g, courseScheme);
                        const examText = !isFinalActive
                          ? 'مغلق'
                          : (isSupActive && !isPassed1st && g.supplementary_exam != null && g.supplementary_exam > 0)
                            ? `${g.supplementary_exam} (دور 2)`
                            : `${g.final_exam != null ? g.final_exam : '-'}`;

                        return (
                          <tr key={g.id} className="hover:bg-slate-50 transition">
                            <td className="p-3.5 font-black text-slate-950">{g.course_name}</td>
                            <td className="p-3.5 text-center font-black text-slate-900 bg-slate-50 font-mono">{cwTotal}</td>
                            {/* 🎯 خلية الفاينل تظهر فقط إذا كان الفاينل مفعلاً لأي مادة */}
                            {hasAnyFinalActive && <td className="p-3.5 text-center font-bold text-slate-700 font-mono">{examText}</td>}
                            <td className="p-3.5 text-center font-black text-emerald-950 bg-emerald-50 font-mono">
                              {isFinalActive ? (finalScore > 0 ? finalScore : '-') : `${cwTotal} (سعي)`}
                            </td>
                            <td className="p-3.5 text-center font-black whitespace-nowrap">{letter}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* 🖨️ أزرار الإجراءات والطباعة */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-base font-black rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Printer className="w-5 h-5 text-white" />
            <span>طباعة تقرير التحقق الرسمي</span>
          </button>

          <Link 
            href="/" 
            className="text-base font-black text-slate-900 hover:underline flex items-center gap-2"
          >
            <ArrowRight className="w-5 h-5 text-slate-900" />
            <span>العودة للبوابة الرئيسية</span>
          </Link>
        </div>

      </div>

    </div>
  );
}
