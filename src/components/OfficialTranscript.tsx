'use client'; // ⚡ ينفذ بالعميل

// 📜 المكون المخصص لكشف الشهادة والدرجات الرسمي المطبوع - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import Image from 'next/image'; // 🖼️ الصور
import { QRCodeSVG } from 'qrcode.react'; // 🔲 رمز التوثيق
import { UserProfile, Grade, Course } from '@/types'; // 🔗 الأنواع
import { calculateFinalTotal, getLetterGrade, calculateStudentGPA, getStageNameInArabic, isStudentPassedFirstRound } from '@/lib/grade-utils'; // 🧮 الحسابات

interface OfficialTranscriptProps {
  student: UserProfile;
  grades: Grade[];
  courses: Course[];
}

export default function OfficialTranscript({ student, grades, courses }: OfficialTranscriptProps) {
  // 🧮 حساب المعدل التراكمي الكلي مع مراعاة حالة الدور الثاني لكل مادة
  const gradesWithCredits = grades.map((g) => {
    const courseObj = courses.find((c) => c.id === g.course_id);
    const isSupActive = courseObj?.is_supplementary_exam_enabled === true;
    const finalScore = calculateFinalTotal(g, isSupActive);
    return {
      grade: {
        ...g,
        final_total: finalScore,
      },
      creditHours: courseObj?.credit_hours || 3,
    };
  });
  const currentGPA = calculateStudentGPA(gradesWithCredits);

  // 🔲 رابط التوثيق للـ QR
  const verifyUrl = `http://localhost:3000/verify/${student.university_number}`;

  return (
    <div className="bg-white text-slate-900 p-8 sm:p-10 border border-slate-300 rounded-3xl max-w-4xl mx-auto my-6 space-y-7 font-sans shadow-2xl relative overflow-hidden">
      
      {/* 🏛️ ترويسة الشهادة الرسمية */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6">
        
        <div className="space-y-1.5 text-right">
          <h2 className="text-2xl font-black text-slate-900">جمهورية العراق</h2>
          <h3 className="text-base font-black text-slate-800">وزارة التعليم العالي والبحث العلمي</h3>
          <h1 className="text-xl font-black text-slate-900">جامعة الإمام جعفر الصادق (ع)</h1>
          <p className="text-base font-black text-slate-700">فرع ميسان — قسم التسجيل والأمور الطلابية</p>
        </div>

        {/* 🖼️ الشعار الرسمي بدون حدود سوداء */}
        <div className="relative w-32 h-32 p-1 border border-slate-200 rounded-full flex items-center justify-center bg-white shadow-xs">
          <Image
            src="/logo.webp"
            alt="شعار جامعة الإمام جعفر الصادق (ع) - فرع ميسان"
            width={110}
            height={110}
            className="object-contain"
            priority
          />
        </div>

        <div className="space-y-1.5 text-left text-base font-black font-mono">
          <div><strong className="text-slate-900">العدد:</strong> ص/{new Date().getFullYear()}/1098</div>
          <div><strong className="text-slate-900">التاريخ:</strong> {new Date().toLocaleDateString('ar-IQ-u-nu-latn')}</div>
          <div><strong className="text-slate-900">الرمز الأكاديمي:</strong> {student.university_number}</div>
        </div>

      </div>

      {/* 👤 بيانات الطالب الأكاديمية */}
      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-300 text-base font-black">
        <div><span className="text-slate-950 font-black">اسم الطالب الرباعي:</span> <span className="font-black text-slate-900">{student.full_name}</span></div>
        <div><span className="text-slate-950 font-black">القسم العلمي:</span> <span className="font-black text-slate-900">{student.department_name}</span></div>
        {/* ✉️ البريد الأكاديمي الرسمي للطالب */}
        <div><span className="text-slate-950 font-black">البريد الأكاديمي:</span> <span className="font-black text-slate-900 font-mono" dir="ltr">{student.generated_email || '—'}</span></div>
        <div><span className="text-slate-950 font-black">المرحلة الدراسية:</span> <span className="font-black text-slate-900">المرحلة {getStageNameInArabic(student.stage_number || 1)}</span></div>
      </div>

      {/* 📊 جدول الدرجات المطبوع */}
      <div className="overflow-x-auto">
        <table className="w-full text-center text-base font-black border-collapse border border-slate-300">
          <thead className="bg-slate-100 text-slate-950 font-black border-b border-slate-300">
            <tr>
              <th className="p-4 w-16 border border-slate-300 text-center">ت</th>
              <th className="p-4 border border-slate-300 text-right">المادة الدراسية (الكورس)</th>
              <th className="p-4 border border-slate-300 font-mono">الساعات المعتمدة</th>
              <th className="p-4 border border-slate-300 font-mono">السعي (50)</th>
              <th className="p-4 border border-slate-300 font-mono">النهائي (50)</th>
              <th className="p-4 border border-slate-300 font-mono">المجموع (100)</th>
              <th className="p-4 border border-slate-300">التقدير الحرفي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 text-base font-black">
            {grades.map((g, index) => {
              const cObj = courses.find((c) => c.id === g.course_id);
              const isFinalActive = cObj?.is_final_exam_enabled === true;
              const isSupActive = cObj?.is_supplementary_exam_enabled === true;
              const finalTot = isFinalActive ? calculateFinalTotal(g, isSupActive) : (g.final_coursework_total || 0);
              const letterGrad = isFinalActive ? getLetterGrade(finalTot) : 'سعي فقط';
              const isPassed1st = isStudentPassedFirstRound(g);
              const examGradeText = !isFinalActive
                ? 'مغلق'
                : (isSupActive && !isPassed1st && g.supplementary_exam != null && g.supplementary_exam > 0)
                  ? `${g.supplementary_exam} (دور ثاني)`
                  : `${g.final_exam || '-'}`;

              return (
                <tr key={g.id} className="hover:bg-slate-50">
                  <td className="p-3.5 border border-slate-300 text-center font-black text-slate-950 font-mono">{index + 1}</td>
                  <td className="p-3.5 border border-slate-300 text-right font-black text-slate-950">{g.course_name}</td>
                  <td className="p-3.5 border border-slate-300 font-black font-mono">{cObj?.credit_hours || 3}</td>
                  <td className="p-3.5 border border-slate-300 font-black font-mono">{g.final_coursework_total}</td>
                  <td className="p-3.5 border border-slate-300 font-black font-mono">{examGradeText}</td>
                  <td className="p-3.5 border border-slate-300 font-black text-slate-950 font-mono">{finalTot}</td>
                  <td className="p-3.5 border border-slate-300 font-black text-center whitespace-nowrap">{letterGrad}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 🧮 ملخص المعدل التراكمي وختم التوثيق بالرمز */}
      <div className="pt-5 border-t-2 border-slate-900 flex items-center justify-between">
        
        {/* 🔲 رمز الاستجابة السريعة للتحقق */}
        <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-300">
          <QRCodeSVG value={verifyUrl} size={75} />
          <div className="text-base font-black text-slate-700 space-y-0.5">
            <div className="text-slate-950 font-black">رمز التوثيق الإلكتروني الرسمي</div>
            <div className="text-sm font-black text-slate-700">امسح للتحقق من صحة الصدور</div>
          </div>
        </div>

        {/* 🏆 النتيجة والمعدل */}
        <div className="text-left space-y-1">
          <div className="text-base font-black text-slate-700">المعدل التراكمي الفصلي العام:</div>
          <div className="text-3xl font-black text-slate-900 font-mono">{currentGPA} / 100</div>
          <div className="text-base font-black text-emerald-800">النتيجة: {Number(currentGPA) >= 50 ? 'ناجح' : 'مكمل'}</div>
        </div>

      </div>

      {/* 🖋️ التواقيع والأختام */}
      <div className="pt-8 grid grid-cols-3 text-center text-base font-black text-slate-900">
        <div>
          <p>توقيع مقرر القسم</p>
          <div className="h-12"></div>
          <p className="text-sm font-black text-slate-700 font-mono">التاريخ: ... / ... / {new Date().getFullYear()}</p>
        </div>
        <div>
          <p>توقيع رئيس القسم العلمي</p>
          <div className="h-12"></div>
          <p className="text-sm font-black text-slate-700">التوقيع والختم الرسمي</p>
        </div>
        <div>
          <p>مصادقة عميد الكلية</p>
          <div className="h-12"></div>
          <p className="text-sm font-black text-slate-700">جامعة الإمام جعفر الصادق (ع)</p>
        </div>
      </div>

    </div>
  );
}
