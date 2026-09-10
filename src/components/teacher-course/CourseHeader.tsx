'use client'; // ⚡ ينفذ بجهة العميل في المتصفح

// 🏛️ مكون الهيدر الأكاديمي الشامل لمادة الأستاذ
import React from 'react'; // 🔗 مكتبة رياكت
import Link from 'next/link'; // 🔗 روابط التنقل السريعة
import { 
  ArrowRight, 
  BookOpen, 
  Building2, 
  Calendar, 
  GraduationCap, 
  Clock, 
  DoorClosed, 
  ShieldCheck, 
  Lock, 
  Users, 
  Sun, 
  Moon 
} from 'lucide-react'; // 🎨 أيقونات التفاعل SVG
import { Course, ScheduleLecture } from '@/types'; // 🔗 الأنواع الصارمة
import { DAYS_OF_WEEK_LIST } from '@/lib/schedule-utils'; // 🕒 أسماء الأيام الرسمية
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 اسم المرحلة بالعربي
import { formatAcademicYearDisplay } from '@/lib/mock-data'; // 📅 مساعد تنسيق العام الدراسي

// 📋 واجهة خصائص هيدر الكورس
interface CourseHeaderProps {
  course: Course | null; // 📚 بيانات المادة الدراسية
  academicYear: string; // 📅 العام الدراسي
  courseLectures: ScheduleLecture[]; // 🕒 محاضرات المادة المجدولة
  isPracticalCourse: boolean; // 🔬 هل المادة تحتوي على جانب عملي
  isAdmin: boolean; // 👑 هل المستخدم مسؤول عام
  isTheoryTeacher: boolean; // 👨‍🏫 هل هو أستاذ النظري
  isPracticalTeacher: boolean; // 🧪 هل هو أستاذ العملي
  totalCourseStudents: number; // 👥 إجمالي عدد الطلاب
  courseMorning: number; // ☀️ عدد طلاب الصباحي
  morningPercentage: number; // 📊 نسبة الصباحي
  courseEvening: number; // 🌙 عدد طلاب المسائي
  eveningPercentage: number; // 📊 نسبة المسائي
  courseMales: number; // 👨 عدد الذكور
  malePercentage: number; // 📊 نسبة الذكور
  courseFemales: number; // 👩 عدد الإناث
  femalePercentage: number; // 📊 نسبة الإناث
}

// 📦 المكون الرئيسي لهيدر مادة التدريسي
export default function CourseHeader({
  course, // 📚 المادة
  academicYear, // 📅 العام الدراسي
  courseLectures, // 🕒 المحاضرات
  isPracticalCourse, // 🔬 عملي
  isAdmin, // 👑 إدارة
  isTheoryTeacher, // 👨‍🏫 النظري
  isPracticalTeacher, // 🧪 العملي
  totalCourseStudents, // 👥 إجمالي الطلاب
  courseMorning, // ☀️ صباحي
  morningPercentage, // 📊 نسبة الصباحي
  courseEvening, // 🌙 مسائي
  eveningPercentage, // 📊 نسبة المسائي
  courseMales, // 👨 ذكور
  malePercentage, // 📊 نسبة الذكور
  courseFemales, // 👩 إناث
  femalePercentage // 📊 نسبة الإناث
}: CourseHeaderProps) {
  return (
    // 🏛️ الهيدر الأكاديمي لمادة الأستاذ بتنسيق متوازن واحترافي 100%
    <div className="bg-white border-2 border-slate-200 p-6 sm:p-7 rounded-3xl shadow-sm space-y-5 text-right" dir="rtl">
      <div className="flex flex-col gap-4">
        {/* 📚 السطر الأول: زر العودة + اسم المادة والأيقونة بتصميم كبير وواضح وبارز في الأعلى */}
        <div className="flex items-center gap-4">
          <Link 
            href="/teacher/dashboard" 
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-950 rounded-2xl transition border-2 border-slate-300 font-black shadow-xs flex items-center justify-center shrink-0"
            title="العودة للمواد والتكليفات"
          >
            <ArrowRight className="w-6 h-6 text-black" />
          </Link>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#0F2942] text-white flex items-center justify-center shadow-md shrink-0 border border-[#1e4570]">
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-300" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-black tracking-tight">
              {course?.name}
            </h1>
          </div>
        </div>

        {/* 🏷️ السطر الثاني: الشارات الأكاديمية للمادة مكبرة ومضاف إليها رمز المادة بالأسفل */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-4 py-2 bg-blue-50 text-blue-950 border-2 border-blue-200 font-black text-sm sm:text-base rounded-2xl flex items-center gap-2 shadow-2xs">
            <Building2 className="w-4 h-4 text-blue-800 shrink-0" />
            <span>قسم {course?.department_name || 'هندسة تقنيات الحاسوب'}</span>
          </span>
          <span className="px-4 py-2 bg-indigo-50 text-indigo-950 border-2 border-indigo-200 font-black text-sm sm:text-base rounded-2xl flex items-center gap-2 shadow-2xs">
            <Calendar className="w-4 h-4 text-indigo-800 shrink-0" />
            <span>العام الدراسي <bdi dir="ltr">{formatAcademicYearDisplay(academicYear)}</bdi></span>
          </span>
          <span className="px-4 py-2 bg-slate-100 text-black border-2 border-slate-300 font-black text-sm sm:text-base rounded-2xl flex items-center gap-2 shadow-2xs">
            <GraduationCap className="w-5 h-5 text-blue-900 shrink-0" />
            <span>المرحلة {getStageNameInArabic(course?.stage_number || 1)} • الكورس {course?.semester === 1 ? 'الأول' : 'الثاني'}</span>
          </span>
          {course?.code && (
            <span className="px-4 py-2 bg-slate-100 text-black border-2 border-slate-300 font-mono font-black text-sm sm:text-base rounded-2xl flex items-center gap-2 shadow-2xs">
              <span className="font-sans text-slate-700 font-black">رمز المادة:</span>
              <span className="text-black font-black">{course?.code}</span>
            </span>
          )}
        </div>
      </div>

      {/* 🕒 شريط مواعيد المحاضرات المجدولة للمادة إن وجدت */}
      {courseLectures.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t-2 border-slate-100 text-base font-black text-black">
          <span className="flex items-center gap-1.5 text-indigo-950 bg-indigo-50 px-3.5 py-1.5 rounded-xl border-2 border-indigo-200 text-sm font-black shadow-2xs">
            <Clock className="w-4 h-4 text-indigo-800" />
            <span>مواعيد المحاضرات المجدولة:</span>
          </span>
          {courseLectures.map((lec) => (
            <span key={lec.id} className="bg-slate-100 px-3.5 py-1.5 rounded-xl border-2 border-slate-300 text-black text-sm font-black flex items-center gap-1.5 shadow-2xs">
              <strong>{DAYS_OF_WEEK_LIST.find((d: { key: string; label_ar: string }) => d.key === lec.day)?.label_ar || lec.day}</strong>
              <span>({lec.start_time} - {lec.end_time}) • </span>
              <DoorClosed className="w-4 h-4 text-slate-800 inline" />
              <span>{lec.room}</span>
            </span>
          ))}
        </div>
      )}

      {/* 👨‍🏫 بطاقة الأستاذ المكلف والموقع الأكاديمي والصلاحية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t-2 border-slate-100">
        {/* 1. أستاذ النظري */}
        <div className="flex items-center gap-3">
          <span className="p-3 bg-blue-100 text-blue-950 rounded-2xl border border-blue-300">
            <GraduationCap className="w-6 h-6 text-blue-900" />
          </span>
          <div>
            <span className="text-black font-black text-sm sm:text-base block">أستاذ النظري:</span>
            <strong className="text-black font-black text-lg sm:text-xl block mt-0.5">
              {course?.theory_teacher_name || 'غير محدد'}
            </strong>
          </div>
        </div>

        {/* 2. أستاذ العملي (إن وجد) */}
        {isPracticalCourse && (
          <div className="flex items-center gap-3">
            <span className="p-3 bg-emerald-100 text-emerald-950 rounded-2xl border border-emerald-300">
              <BookOpen className="w-6 h-6 text-emerald-900" />
            </span>
            <div>
              <span className="text-black font-black text-sm sm:text-base block">أستاذ العملي / المختبر:</span>
              <strong className="text-black font-black text-lg sm:text-xl block mt-0.5">
                {course?.practical_teacher_name || 'غير محدد'}
              </strong>
            </div>
          </div>
        )}

        {/* 3. الصلاحية الحالية */}
        <div className="flex items-center gap-3">
          <span className="p-3 bg-sky-100 text-sky-950 rounded-2xl border border-sky-300">
            <ShieldCheck className="w-6 h-6 text-sky-900" />
          </span>
          <div>
            <span className="text-black font-black text-sm sm:text-base block">صلاحيتك الحالية:</span>
            <strong className="text-black font-black text-lg sm:text-xl block mt-0.5">
              {isAdmin
                ? 'تحكم كامل (إدارة عليا)'
                : !isPracticalCourse
                ? (isTheoryTeacher ? 'أستاذ المادة (رصد النظري والنهائي)' : 'مشاهدة فقط')
                : isTheoryTeacher && isPracticalTeacher
                ? 'أستاذ النظري والعملي للمادة'
                : isTheoryTeacher
                ? 'أستاذ النظري (رصد النظري والنهائي)'
                : isPracticalTeacher
                ? 'أستاذ العملي (رصد درجة العملي فقط)'
                : 'مشاهدة فقط'}
            </strong>
          </div>
        </div>
      </div>

      {/* 📊 إحصائية سريعة وديموغرافية شاملة لطلاب المادة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-base font-black">
        {/* 1. إجمالي الطلاب */}
        <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-black shrink-0" />
            <span className="text-black font-black text-sm sm:text-base">إجمالي الطلاب:</span>
          </div>
          <strong className="text-black font-black text-lg sm:text-xl">{totalCourseStudents}</strong>
        </div>

        {/* 2. الصباحي */}
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-emerald-800 shrink-0" />
            <span className="text-emerald-950 font-black text-sm sm:text-base">الصباحي:</span>
          </div>
          <strong className="text-emerald-950 font-black text-base sm:text-lg">{courseMorning} ({morningPercentage}%)</strong>
        </div>

        {/* 3. المسائي */}
        <div className="p-4 bg-indigo-50 border-2 border-indigo-300 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-800 shrink-0" />
            <span className="text-indigo-950 font-black text-sm sm:text-base">المسائي:</span>
          </div>
          <strong className="text-indigo-950 font-black text-base sm:text-lg">{courseEvening} ({eveningPercentage}%)</strong>
        </div>

        {/* 4. الذكور */}
        <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-700 shrink-0"></span>
            <span className="text-blue-950 font-black text-sm sm:text-base">الذكور:</span>
          </div>
          <strong className="text-blue-950 font-black text-base sm:text-lg">{courseMales} ({malePercentage}%)</strong>
        </div>

        {/* 5. الإناث */}
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-700 shrink-0"></span>
            <span className="text-rose-950 font-black text-sm sm:text-base">الإناث:</span>
          </div>
          <strong className="text-rose-950 font-black text-base sm:text-lg">{courseFemales} ({femalePercentage}%)</strong>
        </div>
      </div>

      {/* 🔒 شريط تنبيه وتوضيح الصلاحيات المعزولة للأستاذ */}
      {!isAdmin && (
        <div className="p-4 sm:p-5 bg-blue-100/80 border-2 border-blue-400 rounded-2xl text-base sm:text-lg font-black text-black flex items-center shadow-xs">
          {isPracticalCourse ? (
            <>
              {isTheoryTeacher && isPracticalTeacher && (
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-blue-900 shrink-0" />
                  <span className="text-black leading-relaxed"><strong>صلاحية أكاديمية كاملة:</strong> أنت مكلف بتدريس ورصد درجات الجانبين <strong>النظري والعملي</strong> لهذه المادة بالكامل.</span>
                </div>
              )}
              {isTheoryTeacher && !isPracticalTeacher && (
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-blue-900 shrink-0" />
                  <span className="text-black leading-relaxed"><strong>ملاحظة الصلاحيات:</strong> أنت مكلف بتدريس الجانب <strong>النظري</strong>، حقل العملي مقفل لأستاذ المختبر ({course?.practical_teacher_name || 'غير معين'}).</span>
                </div>
              )}
              {isPracticalTeacher && !isTheoryTeacher && (
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-blue-900 shrink-0" />
                  <span className="text-black leading-relaxed"><strong>ملاحظة الصلاحيات:</strong> أنت مكلف بتدريس الجانب <strong>العملي</strong>، يمكنك تعديل درجات العملي فقط وبقية حقول النظري مقفلة لأستاذ النظري ({course?.theory_teacher_name || 'غير معين'}).</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-900 shrink-0" />
              <span className="text-black leading-relaxed">هذه المادة <strong>نظرية فقط</strong>، يتم احتساب السعي من 50 على بنود النظري والامتحان النصفي والتقارير.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
