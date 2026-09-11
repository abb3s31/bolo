'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 📄 محرك ومولد وثيقة السعي والدرجات الرسمية بصيغة PDF الأكاديمية - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import jsPDF from 'jspdf'; // 📦 مكتبة توليد PDF
import html2canvas from 'html2canvas'; // 🖼️ مكتبة تحويل عناصر HTML لكانفاس عالي الدقة
import { Grade, UserProfile, FinalExamSchedule, FinalExamSlot, StudentTuitionRecord, TuitionInstallmentItem, CourseAcademicTask, StudentTaskSubmission, AssessmentScheme } from '@/types'; // 🔗 الأنواع الرسمية والمخطط التقييمي
import { calculateFinalTotal, getLetterGrade } from './grade-utils'; // 🧮 دوال حساب الدرجات والتقديرات
import { getAcademicYear } from './mock-data'; // 🗓️ العام الدراسي المعتمد بالنظام
import { escapeHtml } from './security/xss-guard'; // 🛡️ ترميز وتطهير نصوص HTML ضد XSS
import { checkRateLimit, acquireHeavyTaskLock, releaseHeavyTaskLock } from './security/ddos-guard'; // 🛡️ حارس DDoS ومحدد العمليات الثقيلة

export interface PDFExportOptions {
  student: UserProfile; // 🎓 بيانات الطالب
  grades: Grade[]; // 📊 درجات المواد
  semester: 1 | 2; // 🗓️ الفصل الدراسي
  academicYear?: string; // 📅 السنة الدراسية
  departmentHeadName?: string; // 👤 اسم رئيس القسم
  rapporteurName?: string; // 👤 اسم مقرر القسم
}

// 🗓️ دالة مساعدة لتوحيد وتثبيت العام الدراسي بصيغة (2026 - 2027) دائماً في كافة وثائق PDF
export function formatAcademicYearForPDF(year?: string): string {
  const y = (year || getAcademicYear()).trim();
  if (y.includes('2025') || y === '2026-2025' || y === '2025-2026' || y.includes('2026')) {
    return '2026 - 2027';
  }
  return y;
}

// 🍞 دالة عرض إشعار عائم فاخر (Light Mode أبيض ناصع) غير معطل للواجهة أثناء تصدير ملفات PDF مع أيقونة SVG فيكتور
function showPdfToast(message: string, isError = true) {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('pdf-system-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'pdf-system-toast';
  toast.dir = 'rtl';
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 999999;
    padding: 12px 22px;
    background: rgba(255, 255, 255, 0.98);
    color: #0f172a;
    font-family: inherit;
    font-weight: 900;
    font-size: 15px;
    border-radius: 18px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 4px ${isError ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)'};
    border: 2px solid ${isError ? 'rgba(244, 63, 94, 0.8)' : 'rgba(16, 185, 129, 0.8)'};
    backdrop-filter: blur(16px);
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.3s ease;
  `;

  const iconSvg = isError
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

  toast.innerHTML = `<span style="display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 32px; height: 32px; border-radius: 10px; background: ${isError ? '#fff1f2' : '#ecfdf5'}; color: ${isError ? '#e11d48' : '#059669'}; border: 1.5px solid ${isError ? '#fecdd3' : '#a7f3d0'};">${iconSvg}</span><span style="font-weight: 900; color: #0f172a;">${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-10px)';
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

// 🖨️ دالة التوليد والتصدير الفوري لوثيقة السعي الأكاديمية الرسمية بصيغة PDF A4
export async function exportStudentTranscriptPDF(options: PDFExportOptions): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 🛡️ 1. فحص سقف معدل الطلبات للعمليات الثقيلة (Heavy Compute Rate Limit)
  const rateLimit = checkRateLimit(options.student.id, 'HEAVY_COMPUTE');
  if (!rateLimit.allowed) {
    showPdfToast(rateLimit.reason || '⚠️ يرجى الانتظار قليلاً قبل تصدير ملف جديد لحماية المنظومة.');
    return false;
  }

  // 🔒 2. قفل التزامن الفردي (Single-Flight Mutex)
  const lockKey = `pdf-export-${options.student.id}`;
  if (!acquireHeavyTaskLock(lockKey)) {
    showPdfToast('⏳ عملية تصدير الوثيقة قيد المعالجة بالفعل، يرجى الانتظار لحين اكتمالها.');
    return false;
  }

  const { student, grades, semester, academicYear = getAcademicYear(), departmentHeadName = 'رئاسة القسم العلمي', rapporteurName = 'مقررية القسم العلمي' } = options;

  // 📝 1. إنشاء حاوية مؤقتة منسقة بدقة A4 للطباعة عالية الجودة
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px'; // 📐 عرض ورقة A4 القياسي (210mm عند 96DPI)
  container.style.minHeight = '1123px'; // 📐 ارتفاع ورقة A4 القياسي (297mm)
  container.style.padding = '35px 30px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Tajawal', sans-serif";
  container.style.direction = 'rtl';
  container.style.boxSizing = 'border-box';

  const todayStr = new Date().toLocaleDateString('ar-IQ-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 🧮 حساب المعدل التراكمي ومجموع السعي
  let totalCoursework = 0;
  let totalCredits = 0;
  grades.forEach((g) => {
    totalCoursework += g.final_coursework_total || 0;
    totalCredits += 3;
  });
  const avgCoursework = grades.length > 0 ? (totalCoursework / grades.length).toFixed(1) : '0';

  // 🏛️ بناء جدول بنود مسار بولونيا الـ 7
  const tableRowsHtml = grades.map((g, idx) => {
    const finalScore = calculateFinalTotal(g);
    const letter = getLetterGrade(finalScore);

    return `
      <tr style="border-bottom: 1px solid #000000; text-align: center; vertical-align: middle; font-size: 11px; color: #000000; height: 36px;">
        <td style="padding: 0 2px; font-weight: 900; border: 1.5px solid #000000; width: 26px; color: #000000; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${idx + 1}</td>
        <td style="padding: 0 8px; font-weight: 900; text-align: right; border: 1.5px solid #000000; color: #000000; font-size: 11.5px; vertical-align: middle; height: 36px; line-height: 36px;">${escapeHtml(g.course_name)}</td>
        <td style="padding: 0 2px; border: 1.5px solid #000000; color: #000000; font-weight: 800; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${g.quiz1}</td>
        <td style="padding: 0 2px; border: 1.5px solid #000000; color: #000000; font-weight: 800; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${g.quiz2}</td>
        <td style="padding: 0 2px; border: 1.5px solid #000000; color: #000000; font-weight: 800; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${g.assignment1}</td>
        <td style="padding: 0 2px; border: 1.5px solid #000000; color: #000000; font-weight: 800; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${g.assignment2}</td>
        <td style="padding: 0 2px; border: 1.5px solid #000000; color: #000000; font-weight: 800; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${g.report}</td>
        <td style="padding: 0 2px; border: 1.5px solid #000000; color: #000000; font-weight: 800; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${g.midterm}</td>
        <td style="padding: 0 2px; border: 1.5px solid #000000; color: #000000; font-weight: 800; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${g.practical}</td>
        <td style="padding: 0 2px; font-weight: 900; background-color: #ffffff; border: 2.5px solid #000000; color: #000000; font-size: 12.5px; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${g.final_coursework_total}</td>
        <td style="padding: 0 2px; border: 1.5px solid #000000; color: #000000; font-weight: 900; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${g.final_exam || '-'}</td>
        <td style="padding: 0 2px; font-weight: 900; background-color: #ffffff; border: 2.5px solid #000000; color: #000000; font-size: 12.5px; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${finalScore > 0 ? finalScore : '-'}</td>
        <td style="padding: 0 2px; font-weight: 900; color: #000000; border: 1.5px solid #000000; width: 95px; min-width: 95px; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">
          <span style="white-space: nowrap; display: inline-block; direction: rtl; unicode-bidi: isolate; font-size: 11px; font-weight: 900; vertical-align: middle; line-height: 1;">${letter}</span>
        </td>
      </tr>
    `;
  }).join('');

  // 🖼️ توليد شفرة رمز التحقق QR ديناميكياً
  const qrVerificationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/verify/${encodeURIComponent(student.university_number)}` 
    : `https://sadiq.edu.iq/verify/${encodeURIComponent(student.university_number)}`;

  // 🏛️ هيكل الوثيقة الأكاديمية الرسمي الفاخر
  container.innerHTML = `
    <div style="border: 2.5px solid #000000; padding: 20px; border-radius: 16px; min-height: 1050px; display: flex; flex-direction: column; justify-content: space-between; color: #000000; background-color: #ffffff;">
      
      <!-- 🏛️ ترويسة الوثيقة الرسمية -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000000; padding-bottom: 12px;">
          <div style="text-align: right; line-height: 1.35; color: #000000;">
            <p style="margin: 0; font-size: 11px; font-weight: 900; color: #000000;">جمهورية العراق — وزارة التعليم العالي والبحث العلمي</p>
            <h2 style="margin: 3px 0 0; font-size: 15px; font-weight: 900; color: #000000;">جامعة الإمام جعفر الصادق (ع)</h2>
            <p style="margin: 0; font-size: 12px; font-weight: 900; color: #000000;">فرع ميسان — شعبة التسجيل وشؤون الطلبة</p>
          </div>

          <div style="text-align: center;">
            <img src="/logo.webp" alt="شعار الجامعة" style="width: 65px; height: 65px; object-fit: contain;" />
            <div style="font-size: 9px; font-weight: 900; color: #000000; margin-top: 2px;">مسار بولونيا المعتمد</div>
          </div>

          <div style="text-align: left; line-height: 1.35; font-size: 11px; color: #000000;">
            <p style="margin: 0; font-weight: 900; color: #000000;">التاريخ: <strong style="color: #000000;">${todayStr}</strong></p>
            <p style="margin: 0; font-weight: 900; color: #000000;">العام الدراسي: <strong style="color: #000000;">${escapeHtml(formatAcademicYearForPDF(academicYear))}</strong></p>
            <p style="margin: 0; font-weight: 900; color: #000000;">الفصل: <strong style="color: #000000;">${semester === 1 ? 'الكورس الأول' : 'الكورس الثاني'}</strong></p>
            <p style="margin: 2px 0 0; font-weight: 900; color: #000000;">كود الوثيقة: TR-${escapeHtml(student.university_number)}</p>
          </div>
        </div>

        <div style="text-align: center; margin: 14px 0 10px;">
          <h1 style="margin: 0; font-size: 16px; font-weight: 900; color: #000000; text-decoration: underline;">
            كشف السعي والدرجات الفصلي المعتمد (مسار بولونيا) — المرحلة ${student.stage_number || 1} (${semester === 1 ? 'الكورس الأول' : 'الكورس الثاني'})
          </h1>
        </div>

        <!-- 👤 بطاقة بيانات الطالب الأكاديمية -->
        <div style="background-color: #ffffff; border: 2px solid #000000; border-radius: 12px; padding: 10px 14px; margin-bottom: 14px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 11.5px; color: #000000;">
          <div>
            <span style="color: #000000; font-size: 10px; font-weight: 900; display: block;">اسم الطالب الرباعي:</span>
            <strong style="color: #000000; font-size: 13px; font-weight: 900;">${escapeHtml(student.full_name)}</strong>
          </div>
          <div>
            <span style="color: #000000; font-size: 10px; font-weight: 900; display: block;">الرقم الجامعي الأكاديمي:</span>
            <strong style="color: #000000; font-weight: 900; font-family: 'Tajawal', system-ui, sans-serif;">${escapeHtml(student.university_number)}</strong>
          </div>
          <div>
            <span style="color: #000000; font-size: 10px; font-weight: 900; display: block;">القسم الأكاديمي:</span>
            <strong style="color: #000000; font-weight: 900;">${escapeHtml(student.department_name || 'القسم الأكاديمي')}</strong>
          </div>
          <div>
            <span style="color: #000000; font-size: 10px; font-weight: 900; display: block;">المرحلة والفترة الدراسية:</span>
            <strong style="color: #000000; font-weight: 900;">المرحلة ${student.stage_number || 1} — ${(student.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'}</strong>
          </div>
        </div>

        <!-- 📊 جدول بنود السعي الـ 7 والامتحان النهائي -->
        <table style="width: 100%; border-collapse: collapse; border: 2px solid #000000; margin-bottom: 12px;">
          <thead>
            <tr style="background-color: #000000; color: #ffffff; font-size: 10px; font-weight: 900; text-align: center; vertical-align: middle;">
              <th style="padding: 8px 2px; border: 1.5px solid #000000; width: 26px; color: #ffffff; text-align: center; vertical-align: middle;">ت</th>
              <th style="padding: 8px 6px; border: 1.5px solid #000000; text-align: right; color: #ffffff; vertical-align: middle;">المادة الدراسية</th>
              <th style="padding: 8px 2px; border: 1.5px solid #000000; color: #ffffff; width: 32px; text-align: center; vertical-align: middle;">كويز1<br/>(5)</th>
              <th style="padding: 8px 2px; border: 1.5px solid #000000; color: #ffffff; width: 32px; text-align: center; vertical-align: middle;">كويز2<br/>(5)</th>
              <th style="padding: 8px 2px; border: 1.5px solid #000000; color: #ffffff; width: 32px; text-align: center; vertical-align: middle;">واجب1<br/>(5)</th>
              <th style="padding: 8px 2px; border: 1.5px solid #000000; color: #ffffff; width: 32px; text-align: center; vertical-align: middle;">واجب2<br/>(5)</th>
              <th style="padding: 8px 2px; border: 1.5px solid #000000; color: #ffffff; width: 35px; text-align: center; vertical-align: middle;">تقرير<br/>(10)</th>
              <th style="padding: 8px 2px; border: 1.5px solid #000000; color: #ffffff; width: 35px; text-align: center; vertical-align: middle;">نصفي<br/>(10)</th>
              <th style="padding: 8px 2px; border: 1.5px solid #000000; color: #ffffff; width: 35px; text-align: center; vertical-align: middle;">عملي<br/>(10)</th>
              <th style="padding: 8px 2px; border: 2.5px solid #000000; background-color: #000000; color: #ffffff; width: 55px; font-weight: 900; text-align: center; vertical-align: middle;">السعي<br/>(50)</th>
              <th style="padding: 8px 2px; border: 1.5px solid #000000; color: #ffffff; width: 40px; text-align: center; vertical-align: middle;">نهائي<br/>(50)</th>
              <th style="padding: 8px 2px; border: 2.5px solid #000000; background-color: #000000; color: #ffffff; width: 58px; font-weight: 900; text-align: center; vertical-align: middle;">المجموع<br/>(100)</th>
              <th style="padding: 8px 2px; border: 1.5px solid #000000; color: #ffffff; width: 95px; min-width: 95px; white-space: nowrap; text-align: center; vertical-align: middle;">التقدير</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <!-- 📈 ملخص الأداء الأكاديمي -->
        <div style="background-color: #ffffff; border: 2px solid #000000; border-radius: 10px; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; font-weight: 900; color: #000000;">
          <div>عدد المواد المسجلة: <strong style="color: #000000;">${grades.length} مواد</strong></div>
          <div>متوسط السعي الفصلي: <strong style="color: #000000; font-size: 13px;">${avgCoursework} / 50</strong></div>
          <div>الحالة الأكاديمية: <strong style="color: #000000;">مسجل ومستمر بالدوام الرسمي</strong></div>
        </div>
      </div>

      <!-- 🔲 التحقق والتواقيع والأختام الرسمية باللون الأسود الواضح -->
      <div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center; margin-top: 20px; padding-top: 14px; border-top: 1.5px dashed #000000; font-size: 11.5px; color: #000000;">
          <div>
            <p style="margin: 0; color: #000000; font-weight: 900;">مقرر القسم العلمي</p>
            <p style="margin: 5px 0 20px; font-weight: 900; color: #000000; font-size: 13px;">${rapporteurName}</p>
            <div style="font-size: 10px; color: #000000; font-weight: 900;">التوقيع: ..........................</div>
          </div>

          <div>
            <p style="margin: 0; color: #000000; font-weight: 900;">رئيس القسم العلمي</p>
            <p style="margin: 5px 0 20px; font-weight: 900; color: #000000; font-size: 13px;">${departmentHeadName}</p>
            <div style="font-size: 10px; color: #000000; font-weight: 900;">التوقيع: ..........................</div>
          </div>

          <div>
            <p style="margin: 0; color: #000000; font-weight: 900;">الختم والتصديق المركزي</p>
            <div style="width: 75px; height: 75px; border: 2px dashed #000000; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 5px auto 0; color: #000000; font-size: 9px; font-weight: 900; transform: rotate(-10deg);">
              جامعة الصادق<br/>فرع ميسان<br/>معتمد رسمياً
            </div>
          </div>
        </div>

        <!-- 🛡️ شريط الباركود والتأكيد الرقمي -->
        <div style="margin-top: 16px; padding-top: 8px; border-top: 1.5px solid #000000; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #000000; font-weight: 900;">
          <div>
            <span>التحقق الرقمي الفوري: </span>
            <span style="font-family: 'Tajawal', system-ui, sans-serif; color: #000000; font-weight: 900;">${qrVerificationUrl}</span>
          </div>
          <div>
            <span>نظام الإدارة الأكاديمية ومسار بولونيا © ${new Date().getFullYear()}</span>
          </div>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  try {
    // ⏱️ تأكيد تحميل كامل الخطوط وحساب مساحات النص بدقة لضمان التوسيط
    if (typeof document !== 'undefined' && document.fonts) {
      await document.fonts.ready;
    }
    await new Promise((resolve) => setTimeout(resolve, 80));

    // 📸 تحويل العنصر لصورة كانفاس عالية الدقة (Scale = 2 لضمان وضوح الطباعة)
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    const safeStudentName = (student.full_name || 'الطالب').replace(/[/\\?%*:|"<>]/g, '_').trim();
    const safeYear = (academicYear || getAcademicYear()).replace(/[/\\?%*:|"<>]/g, '-').trim();
    const semLabel = semester === 1 ? 'الكورس_الاول' : 'الكورس_الثاني';
    const stageLabel = student.stage_number === 1 ? 'الأولى' : student.stage_number === 2 ? 'الثانية' : student.stage_number === 3 ? 'الثالثة' : student.stage_number === 4 ? 'الرابعة' : `${student.stage_number || 1}`;

    pdf.save(`وثيقة_سعي_الطالب_${safeStudentName}_المرحلة_${stageLabel}_${semLabel}_${safeYear}.pdf`);

    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    releaseHeavyTaskLock(lockKey);
    return true;
  } catch {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    releaseHeavyTaskLock(lockKey);
    return false;
  }
}

export interface CourseGradeSheetPDFOptions {
  courseName: string;
  courseCode: string;
  stageNumber: number;
  semester: 1 | 2;
  academicYear?: string;
  teacherName: string;
  practicalTeacherName?: string; // 🔬 أستاذ العملي
  hasPractical?: boolean; // 🏷️ هل المادة تحتوي على مختبر وعملي؟
  departmentName: string;
  departmentHeadName?: string; // 🏛️ اسم رئيس القسم الأكاديمي
  rapporteurName?: string; // 📋 اسم مقرر القسم الأكاديمي
  grades: Grade[];
  scheme?: AssessmentScheme; // 🎛️ المخطط التقييمي المعتمد من رئيس القسم
  isFinalExamEnabled?: boolean; // 🎯 هل الامتحان النهائي مفعل ومعتمد من رئاسة القسم؟
}

// 🖨️ دالة توليد وتصدير كشف درجات المادة الأكاديمي الشامل A4 لجميع طلاب الشعبة
export async function exportCourseGradeSheetPDF(options: CourseGradeSheetPDFOptions): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 🛡️ 1. فحص سقف معدل الطلبات للعمليات الثقيلة (Heavy Compute Rate Limit)
  const rateLimit = checkRateLimit(`course-${options.courseCode}`, 'HEAVY_COMPUTE');
  if (!rateLimit.allowed) {
    showPdfToast(rateLimit.reason || '⚠️ يرجى الانتظار قليلاً قبل تصدير ملف جديد لحماية المنظومة.');
    return false;
  }

  // 🔒 2. قفل التزامن الفردي (Single-Flight Mutex)
  const lockKey = `pdf-export-course-${options.courseCode}`;
  if (!acquireHeavyTaskLock(lockKey)) {
    showPdfToast('⏳ عملية تصدير كشف درجات المادة قيد المعالجة، يرجى الانتظار لحين اكتمالها.');
    return false;
  }

  const {
    courseName,
    courseCode,
    stageNumber,
    semester,
    academicYear = getAcademicYear(),
    teacherName,
    practicalTeacherName,
    hasPractical,
    departmentName,
    departmentHeadName,
    rapporteurName,
    grades,
    isFinalExamEnabled = false, // 🎯 حالة تفعيل رصد درجات الامتحان النهائي الدور الأول
  } = options;

  // 🎯 تحديد هل الفاينل مفعل لإظهار حقوله أو إخفائها ومطابقة الجدول المعروض
  const isFinalExamActive = isFinalExamEnabled === true;
  const displayAcademicYear = formatAcademicYearForPDF(academicYear);

  const isPractical = hasPractical !== undefined 
    ? hasPractical 
    : (options.scheme?.practical.max_score ? options.scheme.practical.max_score > 0 : true);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px';
  container.style.minHeight = '1123px';
  container.style.padding = '30px 25px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.fontFamily = "'Tajawal', sans-serif";
  container.style.direction = 'rtl';
  container.style.boxSizing = 'border-box';

  const todayStr = new Date().toLocaleDateString('ar-IQ-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const stageArabicName = stageNumber === 1 ? 'الأولى' : stageNumber === 2 ? 'الثانية' : stageNumber === 3 ? 'الثالثة' : stageNumber === 4 ? 'الرابعة' : `${stageNumber}`;
  const semesterArabicName = semester === 1 ? 'الكورس الأول' : 'الكورس الثاني';

  const tableRowsHtml = grades.map((g, idx) => {
    const finalScore = calculateFinalTotal(g);
    const letter = getLetterGrade(finalScore);

    return `
      <tr style="border-bottom: 1px solid #000000; text-align: center; vertical-align: middle; font-size: 11px; color: #000000; height: 36px;">
        <td style="padding: 0 2px; font-weight: 900; border: 1.5px solid #000000; width: 26px; color: #000000; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${idx + 1}</td>
        <td style="padding: 0 8px; font-weight: 900; text-align: right; border: 1.5px solid #000000; font-size: 11.5px; color: #000000; vertical-align: middle; height: 36px; line-height: 36px;">${g.student_name}</td>
        <td style="padding: 0 2px; border: 1.5px solid #000000; font-weight: 800; color: #000000; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${g.quiz1}</td>
        <td style="padding: 0 2px; border: 1.5px solid #000000; font-weight: 800; color: #000000; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${g.quiz2}</td>
        <td style="padding: 0 2px; border: 1.5px solid #000000; font-weight: 800; color: #000000; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${g.assignment1}</td>
        <td style="padding: 0 2px; border: 1.5px solid #000000; font-weight: 800; color: #000000; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${g.assignment2}</td>
        <td style="padding: 0 2px; border: 1.5px solid #000000; font-weight: 800; color: #000000; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${g.report}</td>
        <td style="padding: 0 2px; border: 1.5px solid #000000; font-weight: 800; color: #000000; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${g.midterm}</td>
        ${isPractical ? `<td style="padding: 0 2px; border: 1.5px solid #000000; font-weight: 800; color: #000000; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${g.practical}</td>` : ''}
        <td style="padding: 0 2px; font-weight: 900; background-color: #ffffff; border: 2.5px solid #000000; color: #000000; font-size: 13px; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${g.final_coursework_total}</td>
        ${isFinalExamActive ? `
          <td style="padding: 0 2px; border: 1.5px solid #000000; font-weight: 900; color: #000000; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${g.final_exam || '-'}</td>
          <td style="padding: 0 2px; font-weight: 900; background-color: #ffffff; border: 2.5px solid #000000; color: #000000; font-size: 12.5px; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">${finalScore > 0 ? finalScore : '-'}</td>
          <td style="padding: 0 2px; font-weight: 900; color: #000000; border: 1.5px solid #000000; width: 95px; min-width: 95px; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">
            <span style="white-space: nowrap; display: inline-block; direction: rtl; unicode-bidi: isolate; font-size: 11px; font-weight: 900; vertical-align: middle; line-height: 1;">${letter}</span>
          </td>
        ` : `
          <td style="padding: 0 6px; border: 1.5px solid #000000; font-weight: 900; color: #000000; text-align: center; vertical-align: middle; height: 36px; line-height: 36px;">
            <span style="display: inline-block; padding: 2px 10px; border: 1px solid #000000; border-radius: 6px; font-size: 11px; font-weight: 900; background-color: #ffffff;">بانتظار الفاينل</span>
          </td>
        `}
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div style="border: 2.5px solid #000000; padding: 20px; border-radius: 16px; min-height: 1060px; display: flex; flex-direction: column; justify-content: space-between; color: #000000; background-color: #ffffff;">
      
      <div>
        <!-- 🏛️ الترويسة الأكاديمية الرسمية باللون الأسود الكامل -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000000; padding-bottom: 12px;">
          <div style="text-align: right; line-height: 1.35; color: #000000;">
            <p style="margin: 0; font-size: 11px; font-weight: 900; color: #000000;">جمهورية العراق — وزارة التعليم العالي والبحث العلمي</p>
            <h2 style="margin: 3px 0 0; font-size: 15px; font-weight: 900; color: #000000;">جامعة الإمام جعفر الصادق (ع)</h2>
            <p style="margin: 0; font-size: 12px; font-weight: 900; color: #000000;">فرع ميسان — قسم ${departmentName}</p>
          </div>

          <div style="text-align: center;">
            <img src="/logo.webp" alt="الجامعة" style="width: 65px; height: 65px; object-fit: contain;" />
            <div style="font-size: 9px; font-weight: 900; color: #000000; margin-top: 2px;">مسار بولونيا المعتمد</div>
          </div>

          <div style="text-align: left; line-height: 1.35; font-size: 11px; color: #000000;">
            <p style="margin: 0; font-weight: 900; color: #000000;">التاريخ: <strong style="color: #000000;">${todayStr}</strong></p>
            <p style="margin: 0; font-weight: 900; color: #000000;">العام الدراسي: <strong style="color: #000000;">${displayAcademicYear}</strong></p>
            <p style="margin: 0; font-weight: 900; color: #000000;">الفصل: <strong style="color: #000000;">${semesterArabicName}</strong></p>
          </div>
        </div>

        <!-- 📄 عنوان الوثيقة الرسمي متضمناً اسم المادة والمرحلة والكورس ونوع الكشف -->
        <div style="text-align: center; margin: 14px 0 10px;">
          <h1 style="margin: 0; font-size: 16px; font-weight: 900; color: #000000; text-decoration: underline;">
            ${isFinalExamActive 
              ? `كشف درجات وسعي مادة ${courseName} — المرحلة ${stageArabicName} (${semesterArabicName})` 
              : `كشف السعي الفصلي التكويني لمادة ${courseName} (من 50 درجة) — المرحلة ${stageArabicName} (${semesterArabicName})`}
          </h1>
        </div>

        <!-- 📘 بطاقة تفاصيل المادة وأستاذ المادة وحالة الرصد باللون الأسود الواضح -->
        <div style="background-color: #ffffff; border: 2px solid #000000; border-radius: 12px; padding: 10px 14px; margin-bottom: 14px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 11.5px; color: #000000; align-items: center;">
          <div><span style="color: #000000; font-weight: 900;">المادة:</span> <strong style="color: #000000; font-weight: 900;">${courseName}</strong></div>
          <div><span style="color: #000000; font-weight: 900;">أستاذ المادة:</span> <strong style="color: #000000; font-weight: 900;">${teacherName}</strong></div>
          <div><span style="color: #000000; font-weight: 900;">نوع المادة:</span> <strong style="color: #000000; font-weight: 900;">${isPractical ? 'نظري وعملي' : 'نظري فقط'}</strong></div>
          <div><span style="color: #000000; font-weight: 900;">الحالة:</span> <strong style="color: #000000; font-weight: 900;">${isFinalExamActive ? 'معتمد رسمياً (درجات النهائي)' : 'السعي التكويني معتمد رسمياً'}</strong></div>
        </div>

        <!-- 📊 جدول درجات الطلاب الرسمي فائق الترتيب والوضوح متطابق 100% مع الشاشة -->
        <table style="width: 100%; border-collapse: collapse; border: 2px solid #000000; margin-bottom: 12px;">
          <thead>
            <tr style="background-color: #000000; color: #ffffff; font-size: 10px; font-weight: 900; text-align: center; vertical-align: middle;">
              <th style="padding: 8px 2px; width: 26px; border: 1.5px solid #000000; color: #ffffff; text-align: center; vertical-align: middle;">ت</th>
              <th style="padding: 8px 6px; text-align: right; min-width: 145px; border: 1.5px solid #000000; color: #ffffff; vertical-align: middle;">اسم الطالب الرباعي</th>
              <th style="padding: 8px 2px; border: 1.5px solid #000000; color: #ffffff; width: 32px; text-align: center; vertical-align: middle;">${options.scheme?.quiz1.title_ar || 'ك1'}<br/>(${options.scheme?.quiz1.max_score || 5})</th>
              <th style="padding: 8px 2px; border: 1.5px solid #000000; color: #ffffff; width: 32px; text-align: center; vertical-align: middle;">${options.scheme?.quiz2.title_ar || 'ك2'}<br/>(${options.scheme?.quiz2.max_score || 5})</th>
              <th style="padding: 8px 2px; border: 1.5px solid #000000; color: #ffffff; width: 32px; text-align: center; vertical-align: middle;">${options.scheme?.assignment1.title_ar || 'و1'}<br/>(${options.scheme?.assignment1.max_score || 5})</th>
              <th style="padding: 8px 2px; border: 1.5px solid #000000; color: #ffffff; width: 32px; text-align: center; vertical-align: middle;">${options.scheme?.assignment2.title_ar || 'و2'}<br/>(${options.scheme?.assignment2.max_score || 5})</th>
              <th style="padding: 8px 2px; border: 1.5px solid #000000; color: #ffffff; width: 35px; text-align: center; vertical-align: middle;">${options.scheme?.report.title_ar || 'تقرير'}<br/>(${options.scheme?.report.max_score || 10})</th>
              <th style="padding: 8px 2px; border: 1.5px solid #000000; color: #ffffff; width: 35px; text-align: center; vertical-align: middle;">${options.scheme?.midterm.title_ar || 'نصف'}<br/>(${options.scheme?.midterm.max_score || 10})</th>
              ${isPractical ? `<th style="padding: 8px 2px; border: 1.5px solid #000000; color: #ffffff; width: 35px; text-align: center; vertical-align: middle;">${options.scheme?.practical.title_ar || 'عملي'}<br/>(${options.scheme?.practical.max_score || 10})</th>` : ''}
              <th style="padding: 8px 4px; border: 2.5px solid #000000; background-color: #000000; color: #ffffff; width: 65px; font-weight: 900; text-align: center; vertical-align: middle;">${isFinalExamActive ? 'السعي' : 'السعي المعتمد'}<br/>(50)</th>
              ${isFinalExamActive ? `
                <th style="padding: 8px 2px; border: 1.5px solid #000000; color: #ffffff; width: 40px; text-align: center; vertical-align: middle;">${options.scheme?.final_exam.title_ar || 'نهائي'}<br/>(${options.scheme?.final_exam.max_score || 50})</th>
                <th style="padding: 8px 2px; border: 2.5px solid #000000; background-color: #000000; color: #ffffff; width: 58px; font-weight: 900; text-align: center; vertical-align: middle;">المجموع<br/>(100)</th>
                <th style="padding: 8px 2px; border: 1.5px solid #000000; color: #ffffff; width: 95px; min-width: 95px; white-space: nowrap; text-align: center; vertical-align: middle;">التقدير</th>
              ` : `
                <th style="padding: 8px 6px; border: 1.5px solid #000000; color: #ffffff; width: 110px; text-align: center; vertical-align: middle;">حالة النتيجة</th>
              `}
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- 🔲 التواقيع الرسمية متضمنة أسماء رئيس القسم والمقرر الفعليين باللون الأسود الصريح -->
      <div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center; margin-top: 15px; padding-top: 12px; border-top: 1.5px dashed #000000; font-size: 11.5px; color: #000000;">
          <div>
            <p style="margin: 0; color: #000000; font-weight: 900;">أستاذ المادة</p>
            <p style="margin: 5px 0 20px; font-weight: 900; color: #000000; font-size: 13px;">${teacherName}</p>
            <div style="font-size: 10px; color: #000000; font-weight: 900;">التوقيع: .................................</div>
          </div>
          <div>
            <p style="margin: 0; color: #000000; font-weight: 900;">مقرر القسم العلمي</p>
            <p style="margin: 5px 0 20px; font-weight: 900; color: #000000; font-size: 13px;">${rapporteurName || 'مقررية القسم العلمي'}</p>
            <div style="font-size: 10px; color: #000000; font-weight: 900;">التوقيع: .................................</div>
          </div>
          <div>
            <p style="margin: 0; color: #000000; font-weight: 900;">رئيس القسم العلمي</p>
            <p style="margin: 5px 0 20px; font-weight: 900; color: #000000; font-size: 13px;">${departmentHeadName || 'رئاسة القسم العلمي'}</p>
            <div style="font-size: 10px; color: #000000; font-weight: 900;">التوقيع: .................................</div>
          </div>
        </div>

        <div style="margin-top: 14px; padding-top: 8px; border-top: 1.5px solid #000000; display: flex; justify-content: space-between; font-size: 10px; color: #000000; font-weight: 900;">
          <span>جامعة الإمام جعفر الصادق (ع) — فرع ميسان | مسار بولونيا المعتمد</span>
          <span>صفحة كشف الدرجات الرسمية المعتمدة © ${new Date().getFullYear()}</span>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  try {
    // ⏱️ تأكيد تحميل كامل الخطوط وحساب مساحات النص بدقة لضمان التوسيط
    if (typeof document !== 'undefined' && document.fonts) {
      await document.fonts.ready;
    }
    await new Promise((resolve) => setTimeout(resolve, 80));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    // 🏷️ تسمية الملف الرسمي بالمادة والمرحلة والكورس والعام الدراسي 2026-2027
    const cleanCourse = (courseName || 'المادة').replace(/[/\\?%*:|"<>]/g, '_').trim();
    const semFileLabel = semester === 1 ? 'الكورس_الاول' : 'الكورس_الثاني';
    const finalFileName = isFinalExamActive
      ? `كشف_درجات_مادة_${cleanCourse}_المرحلة_${stageArabicName}_${semFileLabel}_2026-2027.pdf`
      : `كشف_سعي_مادة_${cleanCourse}_المرحلة_${stageArabicName}_${semFileLabel}_2026-2027.pdf`;

    pdf.save(finalFileName);

    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    releaseHeavyTaskLock(lockKey);
    return true;
  } catch {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    releaseHeavyTaskLock(lockKey);
    return false;
  }
}

// 🏷️ واجهة خيارات تصدير سجل الحضور والغياب الأسبوعي
export interface AttendanceSheetExportOptions {
  courseName: string;            // 📘 اسم المادة
  courseCode: string;            // 🏷️ رمز المادة
  stageNumber: number;           // 🎓 رقم المرحلة
  semester: 1 | 2;               // 🗓️ الفصل الدراسي
  studyType?: 'morning' | 'evening'; // ☀️🌙 نوع الدراسة (صباحي / مسائي)
  academicYear?: string;         // 📅 السنة الدراسية
  teacherName?: string;          //  اسم الأستاذ
  practicalTeacherName?: string; // 🔬 أستاذ العملي
  departmentName: string;        // 🏢 اسم القسم
  departmentHeadName?: string;   // 🏛️ اسم رئيس القسم الأكاديمي
  rapporteurName?: string;       // 📋 اسم مقرر القسم الأكاديمي
  scheduleInfo?: string;         // ⏰ أوقات المحاضرات المجدولة
  students: { student_name: string; university_number?: string }[]; // 👥 قائمة الطلاب
}

// 📋 دالة تصدير سجل الحضور والغياب الأسبوعي الرسمي A4 Landscape
export async function exportCourseAttendanceSheetPDF(options: AttendanceSheetExportOptions): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const {
    courseName,
    courseCode,
    stageNumber,
    semester,
    studyType = 'morning',
    academicYear = getAcademicYear(),
    teacherName = 'أستاذ المادة',
    practicalTeacherName,
    departmentName,
    departmentHeadName,
    rapporteurName,
    scheduleInfo = 'بحسب الجدول المعتمد',
    students,
  } = options;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '1123px'; // 📐 عرض A4 بالعرض Landscape (297mm)
  container.style.minHeight = '794px'; // 📐 ارتفاع A4 بالعرض (210mm)
  container.style.padding = '25px 20px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Tajawal', sans-serif";
  container.style.direction = 'rtl';
  container.style.boxSizing = 'border-box';

  const todayStr = new Date().toLocaleDateString('ar-IQ-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const stageArabicName = stageNumber === 1 ? 'الأولى' : stageNumber === 2 ? 'الثانية' : stageNumber === 3 ? 'الثالثة' : stageNumber === 4 ? 'الرابعة' : `${stageNumber}`;
  const semesterArabicName = semester === 1 ? 'الكورس الأول' : 'الكورس الثاني';
  const studyTypeArabicName = studyType === 'evening' ? 'الدراسة المسائية' : 'الدراسة الصباحية';

  const tableRowsHtml = students.map((s, idx) => {
    let weekCells = '';
    for (let w = 1; w <= 15; w++) {
      weekCells += `<td style="padding: 4px 1px; border-left: 1px solid #000000; width: 32px; height: 22px; vertical-align: middle; text-align: center;"></td>`;
    }

    return `
      <tr style="border-bottom: 1px solid #000000; text-align: center; vertical-align: middle; font-size: 10px; color: #000000;">
        <td style="padding: 6px 2px; font-weight: 900; border-left: 1px solid #000000; width: 28px; color: #000000; vertical-align: middle; text-align: center;">${idx + 1}</td>
        <td style="padding: 6px 8px; font-weight: 900; text-align: right; border-left: 1px solid #000000; width: 220px; font-size: 12px; color: #000000; vertical-align: middle;">${s.student_name}</td>
        ${weekCells}
        <td style="padding: 6px 4px; font-weight: 900; border-left: 1px solid #000000; width: 45px; background-color: #ffffff; color: #000000; vertical-align: middle; text-align: center;"></td>
        <td style="padding: 6px 4px; font-weight: 900; border-left: 1px solid #000000; width: 45px; background-color: #ffffff; color: #000000; vertical-align: middle; text-align: center;"></td>
        <td style="padding: 6px 4px; font-size: 10px; color: #000000; vertical-align: middle; text-align: center;"></td>
      </tr>
    `;
  }).join('');

  let weekHeaders = '';
  for (let w = 1; w <= 15; w++) {
    weekHeaders += `<th style="padding: 6px 1px; border-left: 1px solid #ffffff; width: 32px; font-size: 9px; color: #ffffff; vertical-align: middle; text-align: center;">أ ${w}</th>`;
  }

  container.innerHTML = `
    <div style="border: 2.5px solid #000000; padding: 16px; border-radius: 14px; min-height: 740px; display: flex; flex-direction: column; justify-content: space-between; color: #000000; background-color: #ffffff;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000000; padding-bottom: 10px;">
          <div style="text-align: right; line-height: 1.3; color: #000000;">
            <p style="margin: 0; font-size: 10.5px; font-weight: 900; color: #000000;">جمهورية العراق — وزارة التعليم العالي والبحث العلمي</p>
            <h2 style="margin: 2px 0 0; font-size: 14px; font-weight: 900; color: #000000;">جامعة الإمام جعفر الصادق (ع) — فرع ميسان</h2>
            <p style="margin: 0; font-size: 11px; font-weight: 900; color: #000000;">قسم ${departmentName} | المرحلة ${stageArabicName} — ${studyTypeArabicName} (${semesterArabicName})</p>
          </div>

          <div style="text-align: center; color: #000000;">
            <h1 style="margin: 0; font-size: 15px; font-weight: 900; color: #000000; border-bottom: 2px solid #000000; padding-bottom: 2px;">
              سجل متابعة الحضور والغياب الأسبوعي للطلبة (مسار بولونيا)
            </h1>
            <p style="margin: 3px 0 0; font-size: 11px; font-weight: 900; color: #000000;">
              مادة: <strong style="color: #000000;">${courseName}</strong> | موعد المحاضرة: <strong style="color: #000000;">${scheduleInfo}</strong>
            </p>
          </div>

          <div style="text-align: left; line-height: 1.3; font-size: 10.5px; color: #000000;">
            <p style="margin: 0; font-weight: 900; color: #000000;">العام الدراسي: <strong style="color: #000000;">${formatAcademicYearForPDF(academicYear)}</strong></p>
            <p style="margin: 0; font-weight: 900; color: #000000;">أستاذ النظري: <strong style="color: #000000;">${teacherName}</strong></p>
            ${practicalTeacherName ? `<p style="margin: 0; font-weight: 900; color: #000000;">أستاذ العملي: <strong style="color: #000000;">${practicalTeacherName}</strong></p>` : ''}
            <p style="margin: 0; font-weight: 900; color: #000000;">تاريخ الإصدار: <strong style="color: #000000;">${todayStr}</strong></p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; border: 2px solid #000000;">
          <thead>
            <tr style="background-color: #000000; color: #ffffff; text-align: center; vertical-align: middle; font-size: 9.5px; font-weight: 900;">
              <th style="padding: 7px 2px; border-left: 1px solid #ffffff; width: 28px; color: #ffffff; vertical-align: middle; text-align: center;">ت</th>
              <th style="padding: 7px 8px; border-left: 1px solid #ffffff; width: 220px; color: #ffffff; vertical-align: middle; text-align: right;">اسم الطالب الرباعي</th>
              ${weekHeaders}
              <th style="padding: 7px 4px; border-left: 1px solid #ffffff; width: 45px; color: #ffffff; vertical-align: middle; text-align: center;">الغياب</th>
              <th style="padding: 7px 4px; border-left: 1px solid #ffffff; width: 45px; color: #ffffff; vertical-align: middle; text-align: center;">النسبة %</th>
              <th style="padding: 7px 4px; color: #ffffff; vertical-align: middle; text-align: center;">الملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 15px; border-top: 1.5px solid #000000; padding-top: 10px; color: #000000;">
        <div style="display: flex; justify-content: space-around; text-align: center; font-size: 11px; font-weight: 900; color: #000000;">
          <div>
            <p style="margin: 0; color: #000000;">أستاذ المادة</p>
            <p style="margin: 3px 0 0; color: #000000; font-size: 12px;">${teacherName}</p>
            <div style="margin-top: 18px; border-bottom: 1px dotted #000000; width: 130px;"></div>
          </div>
          ${practicalTeacherName ? `
            <div>
              <p style="margin: 0; color: #000000;">أستاذ المختبر والعملي</p>
              <p style="margin: 3px 0 0; color: #000000; font-size: 12px;">${practicalTeacherName}</p>
              <div style="margin-top: 18px; border-bottom: 1px dotted #000000; width: 130px;"></div>
            </div>
          ` : ''}
          <div>
            <p style="margin: 0; color: #000000;">مقرر القسم العلمي</p>
            <p style="margin: 3px 0 0; color: #000000; font-size: 12px;">${rapporteurName || 'مقررية القسم العلمي'}</p>
            <div style="margin-top: 18px; border-bottom: 1px dotted #000000; width: 130px;"></div>
          </div>
          <div>
            <p style="margin: 0; color: #000000;">رئيس القسم العلمي</p>
            <p style="margin: 3px 0 0; color: #000000; font-size: 12px;">${departmentHeadName || 'رئاسة القسم العلمي'}</p>
            <div style="margin-top: 18px; border-bottom: 1px dotted #000000; width: 130px;"></div>
          </div>
        </div>

        <div style="margin-top: 10px; display: flex; justify-content: space-between; font-size: 9.5px; color: #000000; font-weight: 900;">
          <span>جامعة الإمام جعفر الصادق (ع) — فرع ميسان | مسار بولونيا المعتمد</span>
          <span>استمارة الحضور والغياب الأسبوعية الرسمية © ${new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // ⏱️ تأكيد تحميل كامل الخطوط وحساب مساحات النص بدقة لضمان التوسيط
    if (typeof document !== 'undefined' && document.fonts) {
      await document.fonts.ready;
    }
    await new Promise((resolve) => setTimeout(resolve, 80));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    const safeCourse = (courseName || 'المادة').replace(/[/\\?%*:|"<>]/g, '_').trim();
    const safeYear = (academicYear || getAcademicYear()).replace(/[/\\?%*:|"<>]/g, '-').trim();
    const semFile = semester === 1 ? 'الكورس_الاول' : 'الكورس_الثاني';
    const studyFile = studyType === 'evening' ? 'مسائي' : 'صباحي';
    const finalAttendanceFileName = `سجل_حضور_مادة_${safeCourse}_المرحلة_${stageArabicName}_${semFile}_${studyFile}_${safeYear}.pdf`;

    pdf.save(finalAttendanceFileName);

    document.body.removeChild(container);
    return true;
  } catch {
    document.body.removeChild(container);
    return false;
  }
}

// =========================================================================
// 📜 واجهة ودالة توليد كتب الإنذارات والحرمان الأكاديمية الرسمية لمسار بولونيا
// =========================================================================
export interface OfficialWarningLetterOptions {
  studentName: string;                     // 👤 اسم الطالب الرباعي
  universityNumber: string;                // 🔢 الرقم الجامعي
  departmentName: string;                  // 🏢 اسم القسم العلمي
  stageNumber: number;                     // 🎓 رقم المرحلة
  courseName: string;                      // 📘 اسم المادة الدراسية
  courseCode: string;                      // 🏷️ رمز المادة
  totalScheduledHours: number;             // ⏳ إجمالي ساعات المادة المجدولة
  unexcusedAbsenceHours: number;           // 🔴 ساعات الغياب غير المبرر
  absencePercentage: number;               // 📊 نسبة الغياب المئوية (%)
  warningStatus: 'warning_1' | 'warning_2' | 'banned'; // ⚠️ نوع الإنذار أو الحرمان
  academicYear?: string;                   // 📅 العام الدراسي
  semester?: 1 | 2;                        // 🗓️ الكورس
  headName?: string;                       // 👤 اسم رئيس القسم
  rapporteurName?: string;                 // 👤 اسم مقرر القسم
  deanName?: string;                       // 👤 اسم عميد الكلية
}

// 🖨️ دالة توليد وطباعة كتاب الأمر الإداري الخاص بالإنذار أو الحرمان الأكاديمي لمسار بولونيا بصيغة PDF
export async function exportOfficialWarningLetterPDF(options: OfficialWarningLetterOptions): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const {
    studentName,
    universityNumber,
    departmentName,
    stageNumber,
    courseName,
    courseCode,
    totalScheduledHours,
    unexcusedAbsenceHours,
    absencePercentage,
    warningStatus,
    academicYear = getAcademicYear(),
    semester = 1,
    headName = 'رئاسة القسم العلمي',
    rapporteurName = 'مقررية القسم العلمي',
    deanName = 'عمادة الكلية'
  } = options;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px'; // 📐 A4 Portrait (210mm)
  container.style.minHeight = '1123px'; // 📐 A4 Portrait (297mm)
  container.style.padding = '35px 30px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Tajawal', sans-serif";
  container.style.direction = 'rtl';
  container.style.boxSizing = 'border-box';

  const todayStr = new Date().toLocaleDateString('ar-IQ-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const refNumber = `ج ص / م / ${Math.floor(1000 + Math.random() * 9000)}`;

  let warningTitle = 'أمر إداري: إنذار أولي لتجاوز نسبة الغياب (5%)';
  let warningBadgeColor = '#d97706';
  let warningBg = '#fef3c7';
  let decisionText = `
    نظراً لتجاوز الطالب المذكور تفاصيله أدناه لنسبة الغياب المحددة بـ (5%) من مجموع الساعات المقررة للمادة وفقاً لضوابط وتعليمات مسار بولونيا المعتمدة من وزارة التعليم العالي والبحث العلمي،
    <strong>تقرر توجيه إنذار أولي</strong> للطالب المومأ إليه، وعليه الحضور والالتزام بالمحاضرات القادمة تجنباً لصدور الإنذار النهائي وتطبيق عقوبة الحرمان.
  `;

  if (warningStatus === 'warning_2') {
    warningTitle = 'أمر إداري: إنذار نهائي لتجاوز نسبة الغياب (7%)';
    warningBadgeColor = '#ea580c';
    warningBg = '#ffedd5';
    decisionText = `
      نظراً لتجاوز الطالب المذكور تفاصيله أدناه لنسبة الغياب المحددة بـ (7%) من مجموع الساعات المقررة للمادة وفقاً لضوابط وتعليمات مسار بولونيا،
      <strong>تقرر توجيه إنذار نهائي</strong> للطالب المومأ إليه. يُعد هذا الإنذار التنبيه الأخير، وفي حال تسجيل أي غياب إضافي سيتم حرمانه نهائياً من الامتحان الفصلي للمادة.
    `;
  } else if (warningStatus === 'banned') {
    warningTitle = 'أمر إداري: قرار حرمان رسمي من الامتحان النهائي لتجاوز نسبة الغياب (10%)';
    warningBadgeColor = '#dc2626';
    warningBg = '#fee2e2';
    decisionText = `
      استناداً إلى المادة (12) من دليل إجراءات مسار بولونيا في الجامعات العراقية، وبناءً على تجاوز الطالب لنسبة الغياب غير المبرر المحددة بـ (10%) من إجمالي الساعات المقررة،
      <strong>تقرر حرمان الطالب من دخول الامتحان النهائي (الدور الأول)</strong> في مادة (${courseName}) للعام الدراسي (${academicYear})، وتُعد نتيجته في الامتحان النهائي (صفراً) مع إلزامه بإعادة المادة أو الدخول للامتحان التكميلي وفق الضوابط.
    `;
  }

  container.innerHTML = `
    <div style="border: 2.5px solid #0f172a; padding: 25px 20px; border-radius: 16px; min-height: 1050px; display: flex; flex-direction: column; justify-content: space-between;">
      
      <div>
        <!-- 🏛️ الترويسة الرسمية -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px;">
          <div style="text-align: right; line-height: 1.35;">
            <p style="margin: 0; font-size: 11px; font-weight: bold; color: #475569;">جمهورية العراق</p>
            <p style="margin: 0; font-size: 11px; font-weight: bold; color: #475569;">وزارة التعليم العالي والبحث العلمي</p>
            <h2 style="margin: 3px 0 0; font-size: 14px; font-weight: 900; color: #0f172a;">جامعة الإمام جعفر الصادق (ع)</h2>
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #1e3a8a;">فرع ميسان — كلية تكنولوجيا المعلومات</p>
            <p style="margin: 0; font-size: 10.5px; font-weight: 800; color: #334155;">قسم ${departmentName}</p>
          </div>

          <div style="text-align: center;">
            <img src="/logo.webp" alt="الجامعة" style="width: 70px; height: 70px; object-fit: contain;" />
            <div style="font-size: 9px; font-weight: 900; color: #0f172a; margin-top: 2px;">مسار بولونيا (Bologna Process)</div>
          </div>

          <div style="text-align: left; line-height: 1.4; font-size: 11px;">
            <p style="margin: 0; font-weight: bold;">العدد: <strong style="font-family: 'Tajawal', system-ui, sans-serif;">${refNumber}</strong></p>
            <p style="margin: 0; font-weight: bold;">التاريخ: <strong>${todayStr}</strong></p>
            <p style="margin: 0; font-weight: bold;">العام الدراسي: <strong>${formatAcademicYearForPDF(academicYear)}</strong></p>
            <p style="margin: 0; font-weight: bold;">الكورس: <strong>${semester === 1 ? 'الأول' : 'الثاني'}</strong></p>
          </div>
        </div>

        <!-- 🏷️ عنوان الكتاب والأمر الإداري -->
        <div style="text-align: center; margin: 20px 0 15px;">
          <span style="display: inline-block; background-color: ${warningBg}; color: ${warningBadgeColor}; border: 1.5px solid ${warningBadgeColor}; padding: 6px 16px; border-radius: 25px; font-size: 13px; font-weight: 900;">
            ${warningTitle}
          </span>
        </div>

        <!-- 👤 معلومات الطالب الموجه إليه الأمر -->
        <div style="background-color: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 12px 16px; margin-bottom: 18px; line-height: 1.6; font-size: 12px;">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div><span style="color: #64748b;">إلى الطالب:</span> <strong style="font-size: 13px; color: #0f172a;">${studentName}</strong></div>
            <div><span style="color: #64748b;">الرقم الجامعي:</span> <strong style="font-family: 'Tajawal', system-ui, sans-serif; color: #1e3a8a;">${universityNumber}</strong></div>
            <div><span style="color: #64748b;">القسم الأكاديمي:</span> <strong>قسم ${departmentName}</strong></div>
            <div><span style="color: #64748b;">المرحلة الدراسية:</span> <strong>المرحلة ${stageNumber}</strong></div>
          </div>
        </div>

        <!-- 📜 نص القرار والأمر الإداري -->
        <div style="text-align: justify; line-height: 1.8; font-size: 12px; color: #1e293b; margin-bottom: 18px; padding: 0 5px;">
          ${decisionText}
        </div>

        <!-- 📊 جدول إحصائيات الموقف والغياب -->
        <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #0f172a; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff; text-align: center; font-size: 10.5px; font-weight: 900;">
              <th style="padding: 7px; border-left: 1px solid #ffffff;">المادة الدراسية</th>
              <th style="padding: 7px; border-left: 1px solid #ffffff;">رمز المادة</th>
              <th style="padding: 7px; border-left: 1px solid #ffffff;">الساعات المجدولة</th>
              <th style="padding: 7px; border-left: 1px solid #ffffff;">ساعات الغياب الفعلي</th>
              <th style="padding: 7px; border-left: 1px solid #ffffff;">نسبة الغياب %</th>
              <th style="padding: 7px;">الموقف القانوني</th>
            </tr>
          </thead>
          <tbody>
            <tr style="text-align: center; font-size: 11px; font-weight: bold; background-color: #ffffff;">
              <td style="padding: 8px; border-left: 1px solid #cbd5e1; font-weight: 900; text-align: right; padding-right: 12px;">${courseName}</td>
              <td style="padding: 8px; border-left: 1px solid #cbd5e1; font-family: 'Tajawal', system-ui, sans-serif;">${courseCode}</td>
              <td style="padding: 8px; border-left: 1px solid #cbd5e1;">${totalScheduledHours} ساعة</td>
              <td style="padding: 8px; border-left: 1px solid #cbd5e1; color: #dc2626; font-weight: 900;">${unexcusedAbsenceHours} ساعة</td>
              <td style="padding: 8px; border-left: 1px solid #cbd5e1; color: #dc2626; font-weight: 900; font-family: 'Tajawal', system-ui, sans-serif;">${absencePercentage}%</td>
              <td style="padding: 8px; font-weight: 900; color: ${warningBadgeColor};">
                ${warningStatus === 'banned' ? 'حرمان من الامتحان 🚫' : warningStatus === 'warning_2' ? 'إنذار نهائي 🚨' : 'إنذار أولي ⚠️'}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 💡 ملاحظة قانونية وتوجيه -->
        <div style="background-color: #f1f5f9; border-right: 4px solid #0f172a; padding: 10px 14px; border-radius: 8px; font-size: 10.5px; color: #334155; line-height: 1.6;">
          <strong>تنبيه أكاديمي:</strong> في حال وجود أعذار أو إجازات طبية رسمية صادرة من مؤسسات صحية معتمدة ومصادق عليها من المركز الصحي الجامعي، يتوجب تقديمها إلكترونياً عبر المنظومة أو مراجعة رئاسة القسم خلال مدة أقصاها (3) أيام من تاريخ الغياب.
        </div>
      </div>

      <!-- ✍️ التواقيع والاعتماد الرسمي -->
      <div style="margin-top: 25px; border-top: 2px solid #0f172a; padding-top: 15px;">
        <div style="display: flex; justify-content: space-between; text-align: center; font-size: 11px; font-weight: 900;">
          <div>
            <p style="margin: 0; color: #475569;">مقرر القسم العلمي</p>
            <p style="margin: 4px 0 0; color: #0f172a;">${rapporteurName}</p>
            <div style="margin-top: 30px; border-bottom: 1px dotted #94a3b8; width: 140px; margin-left: auto; margin-right: auto;"></div>
          </div>

          <div>
            <p style="margin: 0; color: #475569;">رئيس القسم العلمي</p>
            <p style="margin: 4px 0 0; color: #0f172a;">${headName}</p>
            <div style="margin-top: 30px; border-bottom: 1px dotted #94a3b8; width: 140px; margin-left: auto; margin-right: auto;"></div>
          </div>

          <div>
            <p style="margin: 0; color: #475569;">عميد الكلية</p>
            <p style="margin: 4px 0 0; color: #0f172a;">${deanName}</p>
            <div style="margin-top: 30px; border-bottom: 1px dotted #94a3b8; width: 140px; margin-left: auto; margin-right: auto;"></div>
          </div>
        </div>

        <div style="margin-top: 15px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b;">
          <span>جامعة الإمام جعفر الصادق (ع) — فرع ميسان | المنظومة الأكاديمية لمسار بولونيا</span>
          <span>كتاب إداري رسمي صادر إلكترونياً وموثق © ${new Date().getFullYear()}</span>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4'); // Portrait
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`كتاب_إنذار_${studentName}_${courseCode}.pdf`);

    document.body.removeChild(container);
    return true;
  } catch {
    document.body.removeChild(container);
    return false;
  }
}

// ==============================================================================
// 📝 واجهة خيارات تصدير جدول الامتحانات النهائية الرسمي A4 PDF
// ==============================================================================
export interface ExportFinalExamSchedulePDFOptions {
  departmentName: string;            // 🏢 اسم القسم
  stageNumber: number;               // 🎓 المرحلة
  semester: 1 | 2;                   // 🗓️ الكورس الدراسي
  academicYear: string;              // 🗓️ العام الدراسي
  attemptType: 'first_attempt' | 'second_attempt'; // 🎯 الدور (أول / ثاني)
  slots: {
    course_name: string;
    course_code: string;
    exam_date: string;
    exam_day: string;
    start_time: string;
    end_time: string;
    building_name: string;
    hall_name: string;
    study_type?: 'morning' | 'evening' | 'both';
    supervisor_name?: string;
    notes?: string;
  }[];
  instructions?: string[];           // 📋 التعليمات الامتحانية
  headName?: string;                 // 👤 رئيس القسم
  rapporteurName?: string;           // 👤 مقرر القسم
  examCommitteeHead?: string;        // 👤 رئيس اللجنة الامتحانية
}

// 📄 دالة تصدير وطباعة جدول الامتحانات النهائية الرسمي A4 PDF
export async function exportFinalExamSchedulePDF(options: ExportFinalExamSchedulePDFOptions): Promise<boolean> {
  const {
    departmentName,
    stageNumber,
    semester,
    academicYear,
    attemptType,
    slots,
    instructions = [
      'الحضور إلى القاعة الامتحانية قبل 15 دقيقة من الموعد المحدد لبدء الامتحان.',
      'إبراز الهوية الجامعية الموحدة شرط أساسي ومسبق لدخول القاعة الامتحانية.',
      'يمنع منعاً باتاً إدخال أجهزة الهاتف النقال والساعات الذكية إلى داخل القاعة الامتحانية.',
      'الالتزام التام بالزي الجامعي الموحد والتعليمات الانضباطية النافذة.',
      'تغلق القاعات الامتحانية بعد مرور 15 دقيقة من موعد البدء ولا يسمح للمتأخرين بالدخول.',
      'يمنع استخدام أي قصاصات أو مذكرات غير مصرح بها داخل القاعة.'
    ],
    headName = 'رئاسة القسم العلمي',
    rapporteurName = 'مقررية القسم العلمي',
    examCommitteeHead = 'رئاسة اللجنة الامتحانية المركزية'
  } = options;

  const attemptLabel = attemptType === 'first_attempt' ? 'الدور الأول' : 'الدور الثاني';
  const semesterLabel = semester === 1 ? 'الكورس الأول' : 'الكورس الثاني';

  const dayArabicNames: Record<string, string> = {
    saturday: 'السبت',
    sunday: 'الأحد',
    monday: 'الإثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة'
  };

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-10000px';
  container.style.left = '-10000px';
  container.style.width = '800px';
  container.style.minHeight = '1120px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'Cairo, Tahoma, sans-serif';
  container.style.direction = 'rtl';
  container.style.padding = '35px 40px';
  container.style.boxSizing = 'border-box';

  const stageArabicName = stageNumber === 1 ? 'الأولى' : stageNumber === 2 ? 'الثانية' : stageNumber === 3 ? 'الثالثة' : stageNumber === 4 ? 'الرابعة' : `${stageNumber}`;
  const attemptArabicName = attemptType === 'first_attempt' ? 'الدور_الاول' : 'الدور_الثاني';
  const semesterArabicFile = semester === 1 ? 'الكورس_الاول' : 'الكورس_الثاني';

  const rowsHtml = slots.map((s, idx) => {
    const dayName = dayArabicNames[s.exam_day.toLowerCase()] || s.exam_day;
    const studyTypeLabel = s.study_type === 'evening' ? 'مسائي' : s.study_type === 'both' ? 'صباحي ومسائي' : 'صباحي';
    return `
      <tr style="background-color: #ffffff; text-align: center; vertical-align: middle; font-size: 10.5px; color: #000000;">
        <td style="padding: 7px 4px; border: 1px solid #000000; font-weight: 900; color: #000000; vertical-align: middle; text-align: center;">${idx + 1}</td>
        <td style="padding: 7px 5px; border: 1px solid #000000; font-weight: 900; color: #000000; vertical-align: middle; text-align: center;">${dayName}</td>
        <td style="padding: 7px 5px; border: 1px solid #000000; font-family: 'Tajawal', system-ui, sans-serif; font-weight: 900; color: #000000; vertical-align: middle; text-align: center;">${s.exam_date}</td>
        <td style="padding: 7px 4px; border: 1px solid #000000; font-weight: 900; color: #000000; vertical-align: middle; text-align: center;">${studyTypeLabel}</td>
        <td style="padding: 7px 5px; border: 1px solid #000000; font-family: 'Tajawal', system-ui, sans-serif; font-weight: 900; color: #000000; vertical-align: middle; text-align: center;">${s.start_time} - ${s.end_time}</td>
        <td style="padding: 7px 8px; border: 1px solid #000000; text-align: right; font-weight: 900; color: #000000; vertical-align: middle;">
          <div>${s.course_name}</div>
          <span style="font-size: 9.5px; font-family: 'Tajawal', system-ui, sans-serif; color: #000000; font-weight: 900;">[${s.course_code}]</span>
        </td>
        <td style="padding: 7px 6px; border: 1px solid #000000; font-weight: 900; color: #000000; vertical-align: middle; text-align: center;">
          <div>${s.building_name}</div>
          <div style="font-size: 10px; color: #000000; font-weight: 900;">${s.hall_name}</div>
        </td>
        <td style="padding: 7px 6px; border: 1px solid #000000; font-size: 10px; font-weight: 900; color: #000000; vertical-align: middle; text-align: center;">
          ${s.supervisor_name || 'اللجنة الامتحانية'}
        </td>
        <td style="padding: 7px 6px; border: 1px solid #000000; font-size: 9.5px; color: #000000; font-weight: 800; vertical-align: middle; text-align: center;">
          ${s.notes || '—'}
        </td>
      </tr>
    `;
  }).join('');

  const instructionsHtml = instructions.map((inst, i) => `
    <li style="margin-bottom: 3px; font-size: 10px; font-weight: 900; color: #000000; line-height: 1.4;">
      <strong>${i + 1}.</strong> ${inst}
    </li>
  `).join('');

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; justify-content: space-between; min-height: 1050px; color: #000000; background-color: #ffffff;">
      <div>
        
        <!-- 🏛️ الترويسة الوزارية والجامعية الرسمية باللون الأسود الكامل -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000000; padding-bottom: 12px;">
          <div style="text-align: right; line-height: 1.35; color: #000000;">
            <h3 style="margin: 0; font-size: 13px; font-weight: 900; color: #000000;">جمهورية العراق</h3>
            <h4 style="margin: 2px 0 0; font-size: 12px; font-weight: 900; color: #000000;">وزارة التعليم العالي والبحث العلمي</h4>
            <h4 style="margin: 2px 0 0; font-size: 13px; font-weight: 900; color: #000000;">جامعة الإمام جعفر الصادق (ع)</h4>
            <p style="margin: 2px 0 0; font-size: 11px; font-weight: 900; color: #000000;">فرع ميسان • اللجنة الامتحانية المركزية</p>
          </div>

          <div style="text-align: center;">
            <img src="/logo.webp" alt="الجامعة" style="width: 65px; height: 65px; object-fit: contain;" />
            <span style="font-size: 9.5px; font-weight: 900; color: #000000; display: block; margin-top: 2px;">مسار بولونيا</span>
          </div>

          <div style="text-align: left; line-height: 1.35; font-size: 11px; color: #000000;">
            <p style="margin: 0; font-weight: 900; color: #000000;">القسم: <strong style="color: #000000;">${departmentName}</strong></p>
            <p style="margin: 2px 0 0; font-weight: 900; color: #000000;">المرحلة الدراسية: <strong style="color: #000000;">المرحلة ${stageArabicName}</strong></p>
            <p style="margin: 2px 0 0; font-weight: 900; color: #000000;">العام الدراسي: <strong style="color: #000000;">${formatAcademicYearForPDF(academicYear)}</strong></p>
            <p style="margin: 2px 0 0; font-weight: 900; color: #000000;">${semesterLabel} • ${attemptLabel}</p>
          </div>
        </div>

        <!-- 📌 عنوان الوثيقة الرسمي -->
        <div style="text-align: center; margin: 14px 0 12px; background-color: #000000; padding: 10px 16px; border-radius: 12px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 15px; font-weight: 900; color: #ffffff;">
            جدول الامتحانات النهائية الرسمية (${semesterLabel} - ${attemptLabel})
          </h2>
          <p style="margin: 3px 0 0; font-size: 11px; font-weight: 800; color: #ffffff;">
            قسم ${departmentName} • المرحلة ${stageArabicName} • العام الجامعي ${academicYear} (مسار بولونيا)
          </p>
        </div>

        <!-- 📋 جدول مواعيد وقاعات الامتحانات -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px; border: 2px solid #000000;">
          <thead>
            <tr style="background-color: #000000; color: #ffffff; text-align: center; vertical-align: middle; font-size: 10px; font-weight: 900;">
              <th style="padding: 8px 4px; border: 1px solid #000000; width: 24px; color: #ffffff; vertical-align: middle; text-align: center;">ت</th>
              <th style="padding: 8px 5px; border: 1px solid #000000; width: 55px; color: #ffffff; vertical-align: middle; text-align: center;">اليوم</th>
              <th style="padding: 8px 5px; border: 1px solid #000000; width: 70px; color: #ffffff; vertical-align: middle; text-align: center;">التاريخ</th>
              <th style="padding: 8px 4px; border: 1px solid #000000; width: 55px; color: #ffffff; vertical-align: middle; text-align: center;">الفترة</th>
              <th style="padding: 8px 5px; border: 1px solid #000000; width: 80px; color: #ffffff; vertical-align: middle; text-align: center;">وقت الامتحان</th>
              <th style="padding: 8px 8px; border: 1px solid #000000; text-align: right; color: #ffffff; vertical-align: middle;">المادة الدراسية والرمز</th>
              <th style="padding: 8px 6px; border: 1px solid #000000; width: 130px; color: #ffffff; vertical-align: middle; text-align: center;">البناية والقاعة الامتحانية</th>
              <th style="padding: 8px 6px; border: 1px solid #000000; width: 100px; color: #ffffff; vertical-align: middle; text-align: center;">المشرف / الإشراف</th>
              <th style="padding: 8px 6px; border: 1px solid #000000; width: 75px; color: #ffffff; vertical-align: middle; text-align: center;">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- ⚠️ صندوق التعليمات والضوابط الامتحانية الإلزامية -->
        <div style="margin-top: 14px; border: 2px solid #000000; background-color: #ffffff; border-radius: 10px; padding: 10px 14px; color: #000000;">
          <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 5px; color: #000000;">
            <span style="font-size: 12px; font-weight: 900; color: #000000;">⚠️ التعليمات والضوابط الامتحانية العامة الواجب الالتزام بها:</span>
          </div>
          <ul style="margin: 0; padding-right: 18px; list-style-type: none; color: #000000;">
            ${instructionsHtml}
          </ul>
        </div>

      </div>

      <!-- ✍️ التواقيع الرسمية للعمادة ورئاسة القسم واللجنة الامتحانية -->
      <div style="margin-top: 15px; border-top: 2px solid #000000; padding-top: 12px; color: #000000;">
        <div style="display: flex; justify-content: space-around; text-align: center; font-size: 11px; font-weight: 900; color: #000000;">
          <div>
            <p style="margin: 0; color: #000000;">مقرر القسم العلمي</p>
            <p style="margin: 4px 0 0; color: #000000; font-weight: 900; font-size: 12px;">${rapporteurName}</p>
            <div style="margin-top: 25px; border-bottom: 1px dotted #000000; width: 125px;"></div>
            <span style="font-size: 9px; color: #000000; font-weight: 900; margin-top: 2px; display: block;">التوقيع والتاريخ</span>
          </div>

          <div>
            <p style="margin: 0; color: #000000;">رئيس القسم العلمي</p>
            <p style="margin: 4px 0 0; color: #000000; font-weight: 900; font-size: 12px;">${headName}</p>
            <div style="margin-top: 25px; border-bottom: 1px dotted #000000; width: 125px;"></div>
            <span style="font-size: 9px; color: #000000; font-weight: 900; margin-top: 2px; display: block;">التوقيع والختم</span>
          </div>

          <div>
            <p style="margin: 0; color: #000000;">رئيس اللجنة الامتحانية</p>
            <p style="margin: 4px 0 0; color: #000000; font-weight: 900; font-size: 12px;">${examCommitteeHead}</p>
            <div style="margin-top: 25px; border-bottom: 1px dotted #000000; width: 125px;"></div>
            <span style="font-size: 9px; color: #000000; font-weight: 900; margin-top: 2px; display: block;">المصادقة والاعتماد</span>
          </div>

          <div>
            <p style="margin: 0; color: #000000;">عميد الكلية</p>
            <p style="margin: 4px 0 0; color: #000000; font-weight: 900; font-size: 12px;">أ.د. عميد الكلية المحترم</p>
            <div style="margin-top: 25px; border-bottom: 1px dotted #000000; width: 125px;"></div>
            <span style="font-size: 9px; color: #000000; font-weight: 900; margin-top: 2px; display: block;">الاعتماد النهائي</span>
          </div>
        </div>

        <div style="margin-top: 12px; display: flex; justify-content: space-between; font-size: 9.5px; color: #000000; font-weight: 900; border-top: 1px solid #000000; padding-top: 6px;">
          <span>جامعة الإمام جعفر الصادق (ع) — فرع ميسان | وثيقة جدول الامتحانات النهائية الرسمية</span>
          <span>رمز التحقق الرقمي المعتمد: EXAM-${stageNumber}-${semester}-${new Date().getFullYear()} • مسار بولونيا 📜</span>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4'); // Portrait
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    const safeDept = (departmentName || 'القسم').replace(/[/\\?%*:|"<>]/g, '_').trim();
    const safeYear = (academicYear || getAcademicYear()).replace(/[/\\?%*:|"<>]/g, '-').trim();
    const finalScheduleFileName = `جدول_الامتحانات_النهائية_قسم_${safeDept}_المرحلة_${stageArabicName}_${semesterArabicFile}_${attemptArabicName}_${safeYear}.pdf`;

    pdf.save(finalScheduleFileName);

    document.body.removeChild(container);
    return true;
  } catch {
    document.body.removeChild(container);
    return false;
  }
}

// =========================================================================
//  4. تصدير أمر التكليف بالمراقبات الامتحانية للتدريسي (Teacher Proctoring Order PDF)
// =========================================================================
export interface TeacherProctoringExportOptions {
  teacherName: string;
  departmentName: string;
  academicYear?: string;
  semester: 1 | 2;
  slots: FinalExamSlot[];
  deanshipSigner?: string;
}

export async function exportTeacherProctoringSchedulePDF(options: TeacherProctoringExportOptions): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const {
    teacherName,
    departmentName,
    academicYear = getAcademicYear(),
    semester,
    slots,
    deanshipSigner = 'عمادة الكلية',
  } = options;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px'; // A4 Portrait width
  container.style.minHeight = '1123px'; // A4 Portrait height
  container.style.padding = '35px 30px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Tajawal', sans-serif";
  container.style.direction = 'rtl';
  container.style.boxSizing = 'border-box';

  const todayStr = new Date().toLocaleDateString('ar-IQ-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const dayArabicNames: Record<string, string> = {
    saturday: 'السبت',
    sunday: 'الأحد',
    monday: 'الإثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
  };

  const rowsHtml = slots.map((s, idx) => `
    <tr style="border-bottom: 1px solid #cbd5e1; text-align: center; font-size: 11px;">
      <td style="padding: 7px 4px; font-weight: bold; border-left: 1px solid #e2e8f0; width: 30px;">${idx + 1}</td>
      <td style="padding: 7px 6px; font-weight: 800; border-left: 1px solid #e2e8f0;">
        ${dayArabicNames[s.exam_day] || s.exam_day}
        <span style="display: block; font-family: 'Tajawal', system-ui, sans-serif; font-size: 10px; color: #475569;">${s.exam_date}</span>
      </td>
      <td style="padding: 7px 6px; font-family: 'Tajawal', system-ui, sans-serif; font-weight: 900; color: #1e3a8a; border-left: 1px solid #e2e8f0;">
        ${s.start_time} - ${s.end_time}
      </td>
      <td style="padding: 7px 8px; font-weight: 900; text-align: right; border-left: 1px solid #e2e8f0;">
        ${s.course_name}
        <span style="display: block; font-family: 'Tajawal', system-ui, sans-serif; font-size: 9.5px; color: #64748b;">[${s.course_code}] • المرحلة ${s.stage_number} • ${s.study_type === 'evening' ? 'الدراسة المسائية' : 'الدراسة الصباحية'}</span>
      </td>
      <td style="padding: 7px 6px; border-left: 1px solid #e2e8f0; font-weight: bold;">
        <strong style="color: #047857; display: block;">${s.hall_name}</strong>
        <span style="font-size: 9.5px; color: #475569;">${s.building_name}</span>
      </td>
      <td style="padding: 7px 6px; font-size: 10px; color: #334155;">
        ${s.notes || 'الالتزام بضوابط المراقبة'}
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div style="border: 2px solid #0f172a; padding: 20px; border-radius: 12px; min-height: 1050px; display: flex; flex-direction: column; justify-content: space-between;">
      
      <div>
        <!-- الترويسة -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px;">
          <div style="text-align: right; line-height: 1.3;">
            <p style="margin: 0; font-size: 10px; font-weight: bold; color: #475569;">جمهورية العراق — وزارة التعليم العالي والبحث العلمي</p>
            <h2 style="margin: 2px 0 0; font-size: 14px; font-weight: 900; color: #0f172a;">جامعة الإمام جعفر الصادق (ع) — فرع ميسان</h2>
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #1e3a8a;">اللجنة الامتحانية المركزية | قسم ${departmentName}</p>
          </div>

          <div style="text-align: center;">
            <h1 style="margin: 0; font-size: 15px; font-weight: 900; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 2px;">
              أمر تكليف بمراقبة الامتحانات النهائية
            </h1>
            <span style="display: inline-block; margin-top: 3px; font-size: 10px; font-weight: 900; background-color: #0f172a; color: #ffffff; padding: 2px 8px; border-radius: 4px;">
              مسار بولونيا — ${semester === 1 ? 'الكورس الأول' : 'الكورس الثاني'}
            </span>
          </div>

          <div style="text-align: left; line-height: 1.3; font-size: 10px;">
            <p style="margin: 0; font-weight: bold;">العام الدراسي: <strong>${formatAcademicYearForPDF(academicYear)}</strong></p>
            <p style="margin: 0; font-weight: bold;">العدد: <strong>EX-PRC/${Date.now().toString().slice(-5)}</strong></p>
            <p style="margin: 0; font-weight: bold;">تاريخ الأمر: <strong>${todayStr}</strong></p>
          </div>
        </div>

        <!-- بيانات الأستاذ -->
        <div style="margin-top: 15px; padding: 12px 16px; background-color: #f8fafc; border: 1.5px solid #0f172a; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
          <div>
            <span style="color: #475569; font-weight: bold;">اسم التدريسي / المراقب:</span>
            <strong style="font-size: 13px; font-weight: 900; color: #0f172a; margin-right: 6px;">${teacherName}</strong>
          </div>
          <div>
            <span style="color: #475569; font-weight: bold;">القسم المعين:</span>
            <strong style="color: #1e3a8a; font-weight: 900; margin-right: 4px;">${departmentName}</strong>
          </div>
          <div>
            <span style="color: #475569; font-weight: bold;">عدد المراقبات:</span>
            <strong style="color: #047857; font-weight: 900; margin-right: 4px;">${slots.length} مراقبات</strong>
          </div>
        </div>

        <!-- نص الأمر -->
        <p style="margin: 12px 0 8px; font-size: 11px; font-weight: 800; color: #1e293b; line-height: 1.5;">
          استناداً إلى الصلاحيات المخولة وبناءً على مقتضيات المصلحة العامة لتنظيم سير الامتحانات النهائية للعام الدراسي (${academicYear})، تقرر تكليفكم بمراقبة وإشراف القاعات الامتحانية وفق الجدول الموضح أدناه:
        </p>

        <!-- جدول المراقبات -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px; border: 1.5px solid #0f172a;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff; font-size: 10.5px; font-weight: 900; text-align: center;">
              <th style="padding: 7px 3px; border-left: 1px solid #334155; width: 30px;">#</th>
              <th style="padding: 7px 6px; border-left: 1px solid #334155; width: 105px;">اليوم والتاريخ</th>
              <th style="padding: 7px 6px; border-left: 1px solid #334155; width: 95px;">التوقيت</th>
              <th style="padding: 7px 8px; border-left: 1px solid #334155; text-align: right;">المادة والمرحلة</th>
              <th style="padding: 7px 6px; border-left: 1px solid #334155; width: 140px;">القاعة والبناية</th>
              <th style="padding: 7px 6px; width: 120px;">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- واجبات المراقب -->
        <div style="margin-top: 15px; border: 1.5px solid #cbd5e1; background-color: #f1f5f9; border-radius: 8px; padding: 10px 14px; font-size: 10px; font-weight: 800; color: #334155;">
          <strong style="color: #0f172a; display: block; margin-bottom: 4px;">📌 تعليمات ومسؤوليات المراقب والمشرف الامتحاني:</strong>
          <ul style="margin: 0; padding-right: 18px;">
            <li>التواجد في القاعة الامتحانية قبل 20 دقيقة من موعد بدء الامتحان واستلام الدفاتر والأسئلة.</li>
            <li>التحقق من الهويات الجامعية الموحدة لجميع الطلبة ومطابقتها مع بطاقات الجلوس.</li>
            <li>منع دخول الهواتف المحمولة والساعات الذكية والتأكد من توقيع الطلبة في سجل الحضور الامتحاني.</li>
          </ul>
        </div>
      </div>

      <!-- التواقيع -->
      <div style="margin-top: 20px; border-top: 1.5px solid #0f172a; padding-top: 15px;">
        <div style="display: flex; justify-content: space-around; text-align: center; font-size: 10.5px; font-weight: 900;">
          <div>
            <p style="margin: 0; color: #475569;">رئيس اللجنة الامتحانية</p>
            <p style="margin: 3px 0 0; color: #0f172a; font-weight: 900;">أ.م.د. رئيس اللجنة الامتحانية</p>
            <div style="margin-top: 30px; border-bottom: 1px dotted #94a3b8; width: 140px;"></div>
            <span style="font-size: 8.5px; color: #94a3b8; margin-top: 2px; display: block;">المصادقة والتوقيع</span>
          </div>

          <div>
            <p style="margin: 0; color: #475569;">عميد الكلية</p>
            <p style="margin: 3px 0 0; color: #0f172a; font-weight: 900;">${deanshipSigner}</p>
            <div style="margin-top: 30px; border-bottom: 1px dotted #94a3b8; width: 140px;"></div>
            <span style="font-size: 8.5px; color: #94a3b8; margin-top: 2px; display: block;">الاعتماد والختم الرسمي</span>
          </div>
        </div>

        <div style="margin-top: 12px; display: flex; justify-content: space-between; font-size: 8.5px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 6px;">
          <span>جامعة الإمام جعفر الصادق (ع) — فرع ميسان | أمر تكليف رسمي بمراقبة الامتحانات</span>
          <span>باركود التحقق: PROCTOR-${Date.now().toString().slice(-6)} 🛡️</span>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`أمر_تكليف_مراقبة_${teacherName.replace(/\s+/g, '_')}_${academicYear}.pdf`);

    document.body.removeChild(container);
    return true;
  } catch {
    document.body.removeChild(container);
    return false;
  }
}

// =========================================================================
// 🏛️ 5. تصدير مصفوفة إشغال القاعات الامتحانية المركزية للكلية (Master Campus Matrix PDF)
// =========================================================================
export interface MasterExamMatrixExportOptions {
  collegeName?: string;
  academicYear?: string;
  filterDate?: string;
  filterDeptName?: string;
  slots: FinalExamSlot[];
  schedules: FinalExamSchedule[];
}

export async function exportMasterCampusExamMatrixPDF(options: MasterExamMatrixExportOptions): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const {
    collegeName = 'جامعة الإمام جعفر الصادق (ع) — فرع ميسان',
    academicYear = getAcademicYear(),
    filterDate = 'كافة التواريخ',
    filterDeptName = 'كافة الأقسام الأكاديمية',
    slots,
    schedules,
  } = options;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '1123px'; // A4 Landscape
  container.style.minHeight = '794px';
  container.style.padding = '25px 20px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Tajawal', sans-serif";
  container.style.direction = 'rtl';
  container.style.boxSizing = 'border-box';

  const todayStr = new Date().toLocaleDateString('ar-IQ-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const dayArabicNames: Record<string, string> = {
    saturday: 'السبت',
    sunday: 'الأحد',
    monday: 'الإثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
  };

  const rowsHtml = slots.map((s, idx) => {
    const sch = schedules.find((sc) => sc.id === s.schedule_id);
    return `
      <tr style="border-bottom: 1px solid #cbd5e1; text-align: center; font-size: 10px;">
        <td style="padding: 5px 2px; font-weight: bold; border-left: 1px solid #e2e8f0; width: 25px;">${idx + 1}</td>
        <td style="padding: 5px; font-weight: bold; border-left: 1px solid #e2e8f0; width: 85px;">
          ${dayArabicNames[s.exam_day] || s.exam_day} (${s.exam_date})
        </td>
        <td style="padding: 5px; font-family: 'Tajawal', system-ui, sans-serif; font-weight: 900; color: #1e3a8a; border-left: 1px solid #e2e8f0; width: 80px;">
          ${s.start_time} - ${s.end_time}
        </td>
        <td style="padding: 5px 6px; font-weight: 900; text-align: right; border-left: 1px solid #e2e8f0;">
          ${s.course_name}
          <span style="font-family: 'Tajawal', system-ui, sans-serif; font-size: 9px; color: #64748b;">[${s.course_code}]</span>
        </td>
        <td style="padding: 5px; font-weight: bold; border-left: 1px solid #e2e8f0; width: 110px;">
          ${sch ? sch.department_name : 'القسم'} (م ${s.stage_number})
        </td>
        <td style="padding: 5px; border-left: 1px solid #e2e8f0; width: 130px; font-weight: 800; color: #047857;">
          ${s.hall_name}
          <span style="display: block; font-size: 8.5px; color: #64748b;">${s.building_name}</span>
        </td>
        <td style="padding: 5px; font-weight: bold; width: 110px; color: #0f172a;">
          ${s.supervisor_name || 'غير محدد'}
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div style="border: 2px solid #0f172a; padding: 15px; border-radius: 10px; min-height: 740px; display: flex; flex-direction: column; justify-content: space-between;">
      
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px;">
          <div style="text-align: right; line-height: 1.25;">
            <p style="margin: 0; font-size: 10px; font-weight: bold; color: #475569;">جمهورية العراق — وزارة التعليم العالي والبحث العلمي</p>
            <h2 style="margin: 2px 0 0; font-size: 13px; font-weight: 900; color: #0f172a;">${collegeName}</h2>
            <p style="margin: 0; font-size: 10.5px; font-weight: 800; color: #1e3a8a;">اللجنة الامتحانية المركزية وإشغال القاعات والمدرجات</p>
          </div>

          <div style="text-align: center;">
            <h1 style="margin: 0; font-size: 14px; font-weight: 900; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 2px;">
              مصفوفة إشغال القاعات الامتحانية المركزية لكافة الأقسام
            </h1>
            <p style="margin: 2px 0 0; font-size: 10px; font-weight: 800; color: #475569;">
              التصفية: <strong>${filterDeptName}</strong> • التاريخ: <strong>${filterDate}</strong>
            </p>
          </div>

          <div style="text-align: left; line-height: 1.25; font-size: 10px;">
            <p style="margin: 0; font-weight: bold;">العام الدراسي: <strong>${formatAcademicYearForPDF(academicYear)}</strong></p>
            <p style="margin: 0; font-weight: bold;">إجمالي المواعيد: <strong>${slots.length} امتحان</strong></p>
            <p style="margin: 0; font-weight: bold;">تاريخ التصدير: <strong>${todayStr}</strong></p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 8px; border: 1.5px solid #0f172a;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff; font-size: 9.5px; font-weight: 900; text-align: center;">
              <th style="padding: 5px 2px; border-left: 1px solid #334155; width: 25px;">#</th>
              <th style="padding: 5px; border-left: 1px solid #334155; width: 85px;">اليوم والتاريخ</th>
              <th style="padding: 5px; border-left: 1px solid #334155; width: 80px;">التوقيت</th>
              <th style="padding: 5px 6px; border-left: 1px solid #334155; text-align: right;">المادة الامتحانية</th>
              <th style="padding: 5px; border-left: 1px solid #334155; width: 110px;">القسم والمرحلة</th>
              <th style="padding: 5px; border-left: 1px solid #334155; width: 130px;">القاعة والبناية</th>
              <th style="padding: 5px; width: 110px;">المشرف / المراقب</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 10px; border-top: 1.5px solid #0f172a; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; font-weight: 800; color: #475569;">
        <span>جامعة الإمام جعفر الصادق (ع) — فرع ميسان | تقرير إشغال القاعات الامتحانية المركزي المعتمد</span>
        <span>مصادقة اللجنة الامتحانية المركزية والعمادة 🏛️</span>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`مصفوفة_القاعات_الامتحانية_المركزية_${academicYear}.pdf`);

    document.body.removeChild(container);
    return true;
  } catch {
    document.body.removeChild(container);
    return false;
  }
}

// =========================================================================
// 💳 6. تصدير وصل / سند تسديد القسط الدراسي الرسمي (Tuition Receipt PDF)
// =========================================================================
export interface TuitionReceiptExportOptions {
  record: StudentTuitionRecord;
  departmentName: string;
  deanName?: string;
  accountantName?: string;
}

export async function exportTuitionSettlementReceiptPDF(options: TuitionReceiptExportOptions): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const {
    record,
    departmentName,
    deanName = 'أ.د. عميد الكلية المحترم',
    accountantName = 'شعبة الشؤون المالية والحسابات',
  } = options;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px'; // A4 Portrait
  container.style.minHeight = '1123px';
  container.style.padding = '35px 30px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Tajawal', sans-serif";
  container.style.direction = 'rtl';
  container.style.boxSizing = 'border-box';

  const todayStr = new Date().toLocaleDateString('ar-IQ-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const installmentsRows = record.paid_installments.map((item, idx) => `
    <tr style="border-bottom: 1px solid #cbd5e1; text-align: center; font-size: 11px;">
      <td style="padding: 7px 4px; font-weight: bold; border-left: 1px solid #e2e8f0; width: 35px;">${idx + 1}</td>
      <td style="padding: 7px 6px; font-weight: 900; border-left: 1px solid #e2e8f0;">الدفعة / القسط رقم (${item.installment_num})</td>
      <td style="padding: 7px 6px; font-family: 'Tajawal', system-ui, sans-serif; font-weight: 900; color: #047857; border-left: 1px solid #e2e8f0;">${item.amount.toLocaleString()} د.ع</td>
      <td style="padding: 7px 6px; font-family: 'Tajawal', system-ui, sans-serif; border-left: 1px solid #e2e8f0;">${item.paid_at}</td>
      <td style="padding: 7px 6px; font-family: 'Tajawal', system-ui, sans-serif; font-weight: bold; border-left: 1px solid #e2e8f0;">${item.receipt_no}</td>
      <td style="padding: 7px 6px; font-size: 10px; color: #475569;">${item.note || 'تسديد معتمد'}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div style="border: 2px solid #0f172a; padding: 20px; border-radius: 12px; min-height: 1050px; display: flex; flex-direction: column; justify-content: space-between;">
      
      <div>
        <!-- الترويسة -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px;">
          <div style="text-align: right; line-height: 1.3;">
            <p style="margin: 0; font-size: 10px; font-weight: bold; color: #475569;">جمهورية العراق — وزارة التعليم العالي والبحث العلمي</p>
            <h2 style="margin: 2px 0 0; font-size: 14px; font-weight: 900; color: #0f172a;">جامعة الإمام جعفر الصادق (ع) — فرع ميسان</h2>
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #1e3a8a;">شعبة الشؤون المالية والحسابات | قسم ${departmentName}</p>
          </div>

          <div style="text-align: center;">
            <h1 style="margin: 0; font-size: 16px; font-weight: 900; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 2px;">
              سند وموقف تسديد القسط الدراسي
            </h1>
            <span style="display: inline-block; margin-top: 4px; font-size: 10.5px; font-weight: 900; background-color: #0f172a; color: #ffffff; padding: 2px 10px; border-radius: 4px;">
              وثيقة مالية رسمية معتمدة
            </span>
          </div>

          <div style="text-align: left; line-height: 1.3; font-size: 10px;">
            <p style="margin: 0; font-weight: bold;">العام الدراسي: <strong>${formatAcademicYearForPDF(record.academic_year)}</strong></p>
            <p style="margin: 0; font-weight: bold;">رقم السند: <strong>TUIT-${record.id.slice(0, 8)}</strong></p>
            <p style="margin: 0; font-weight: bold;">تاريخ الإصدار: <strong>${todayStr}</strong></p>
          </div>
        </div>

        <!-- بيانات الطالب والموقف المالي -->
        <div style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px;">
          <div style="padding: 10px 14px; background-color: #f8fafc; border: 1.5px solid #0f172a; border-radius: 8px;">
            <p style="margin: 0 0 4px;">اسم الطالب: <strong style="font-size: 12px; color: #0f172a;">${record.student_name}</strong></p>
            <p style="margin: 0 0 4px;">الرقم الجامعي: <strong style="font-family: 'Tajawal', system-ui, sans-serif;">${record.student_code || '---'}</strong></p>
            <p style="margin: 0;">القسم والمرحلة: <strong>قسم ${departmentName} — المرحلة ${record.stage_number}</strong></p>
          </div>

          <div style="padding: 10px 14px; background-color: #f8fafc; border: 1.5px solid #0f172a; border-radius: 8px;">
            <p style="margin: 0 0 4px;">القسط السنوي الإجمالي: <strong style="font-family: 'Tajawal', system-ui, sans-serif; color: #1e3a8a;">${record.total_amount.toLocaleString()} د.ع</strong></p>
            <p style="margin: 0 0 4px;">المبلغ المسدد: <strong style="font-family: 'Tajawal', system-ui, sans-serif; color: #047857;">${record.paid_amount.toLocaleString()} د.ع</strong></p>
            <p style="margin: 0;">المبلغ المتبقي: <strong style="font-family: 'Tajawal', system-ui, sans-serif; color: ${record.remaining_amount > 0 ? '#b91c1c' : '#047857'};">${record.remaining_amount.toLocaleString()} د.ع</strong></p>
          </div>
        </div>

        <!-- حالة التسديد -->
        <div style="margin-top: 12px; padding: 8px 14px; border-radius: 6px; font-size: 11px; font-weight: 900; display: flex; justify-content: space-between; align-items: center; background-color: ${record.status === 'fully_settled' ? '#ecfdf5; border: 1px solid #10b981; color: #065f46;' : '#fffbeb; border: 1px solid #f59e0b; color: #92400e;'}">
          <span>موقف التسديد الحالي: ${record.status === 'fully_settled' ? '🟢 مسدد بالكامل (براءة ذمة مالية تامة)' : record.status === 'partially_settled' ? '🟡 مسدد جزئياً (بذمته متبقيات)' : '🔴 غير مسدد (بذمته قسط متأخر)'}</span>
          <span>عدد الدفعات المعتمدة: ${record.paid_installments.length} من أصل ${record.installments_count}</span>
        </div>

        <!-- جدول تفاصيل الدفعات المسددة -->
        <h4 style="margin: 15px 0 6px; font-size: 11px; font-weight: 900; color: #0f172a;">سجل دفعات الأقساط المسددة في الحسابات:</h4>
        <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #0f172a;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff; font-size: 10.5px; font-weight: 900; text-align: center;">
              <th style="padding: 6px 4px; border-left: 1px solid #334155; width: 35px;">#</th>
              <th style="padding: 6px; border-left: 1px solid #334155;">الدفعة / المرحلة</th>
              <th style="padding: 6px; border-left: 1px solid #334155; width: 120px;">المبلغ المسدد</th>
              <th style="padding: 6px; border-left: 1px solid #334155; width: 95px;">تاريخ التسديد</th>
              <th style="padding: 6px; border-left: 1px solid #334155; width: 120px;">رقم وصل القبض</th>
              <th style="padding: 6px; width: 110px;">الملاحظة</th>
            </tr>
          </thead>
          <tbody>
            ${installmentsRows.length > 0 ? installmentsRows : `
              <tr>
                <td colspan="6" style="padding: 15px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: bold;">
                  لا توجد دفعات مسجلة حتى الآن.
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- إشعار وملاحظات -->
        <div style="margin-top: 15px; border: 1.5px solid #cbd5e1; background-color: #f8fafc; border-radius: 8px; padding: 10px 14px; font-size: 10px; font-weight: 800; color: #334155;">
          <strong style="color: #0f172a; display: block; margin-bottom: 3px;">📌 ضوابط وتعليمات الشؤون المالية:</strong>
          <ul style="margin: 0; padding-right: 18px;">
            <li>يعتبر هذا السند وثيقة مالية رسمية صادرة من نظام الحسابات الإلكتروني الموحد لجامعة الإمام جعفر الصادق (ع).</li>
            <li>يُشترط تسديد كامل الأقساط الدراسية المقررة للحصول على النتيجة النهائية وبراءة الذمة للتخرج والترقية للمرحلة اللاحقة.</li>
          </ul>
        </div>
      </div>

      <!-- التواقيع -->
      <div style="margin-top: 20px; border-top: 1.5px solid #0f172a; padding-top: 15px;">
        <div style="display: flex; justify-content: space-around; text-align: center; font-size: 10.5px; font-weight: 900;">
          <div>
            <p style="margin: 0; color: #475569;">مدير الحسابات والشؤون المالية</p>
            <p style="margin: 3px 0 0; color: #0f172a; font-weight: 900;">${accountantName}</p>
            <div style="margin-top: 30px; border-bottom: 1px dotted #94a3b8; width: 140px;"></div>
            <span style="font-size: 8.5px; color: #94a3b8; margin-top: 2px; display: block;">التوقيع والختم المالي</span>
          </div>

          <div>
            <p style="margin: 0; color: #475569;">عميد الكلية</p>
            <p style="margin: 3px 0 0; color: #0f172a; font-weight: 900;">${deanName}</p>
            <div style="margin-top: 30px; border-bottom: 1px dotted #94a3b8; width: 140px;"></div>
            <span style="font-size: 8.5px; color: #94a3b8; margin-top: 2px; display: block;">المصادقة والاعتماد الرسمي</span>
          </div>
        </div>

        <div style="margin-top: 12px; display: flex; justify-content: space-between; font-size: 8.5px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 6px;">
          <span>جامعة الإمام جعفر الصادق (ع) — فرع ميسان | سند تسديد الأقساط الإلكتروني المعتمد</span>
          <span>رمز التدقيق المالي: PAY-REC-${Date.now().toString().slice(-6)} 🛡️</span>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`سند_تسديد_أقساط_${record.student_name.replace(/\s+/g, '_')}_${record.academic_year}.pdf`);

    document.body.removeChild(container);
    return true;
  } catch {
    document.body.removeChild(container);
    return false;
  }
}

// =========================================================================
// 🧾 6.2 تصدير وصل قبض مالي فردي رسمي (Single Tuition Receipt Voucher PDF)
// =========================================================================
export interface SingleTuitionReceiptExportOptions {
  record: StudentTuitionRecord;
  installment: TuitionInstallmentItem;
  departmentName: string;
  cashierName?: string;
}

export async function exportSingleTuitionReceiptPDF(options: SingleTuitionReceiptExportOptions): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const {
    record,
    installment,
    departmentName,
    cashierName = 'شعبة الشؤون المالية والحسابات',
  } = options;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px';
  container.style.padding = '40px 30px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Tajawal', sans-serif";
  container.style.direction = 'rtl';
  container.style.boxSizing = 'border-box';

  const methodLabel = installment.payment_method === 'electronic' ? 'دفع إلكتروني' : installment.payment_method === 'bank_cheque' ? 'صك مصدق' : installment.payment_method === 'exemption' ? 'إعفاء مالي معتمد' : 'تسديد نقدي';

  container.innerHTML = `
    <div style="border: 3px double #0f2942; padding: 24px; border-radius: 16px; background-color: #ffffff;">
      
      <!-- الترويسة -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f2942; padding-bottom: 12px;">
        <div style="text-align: right; line-height: 1.4;">
          <p style="margin: 0; font-size: 11px; font-weight: bold; color: #475569;">جمهورية العراق — وزارة التعليم العالي والبحث العلمي</p>
          <h2 style="margin: 2px 0 0; font-size: 15px; font-weight: 900; color: #0f2942;">جامعة الإمام جعفر الصادق (ع) — فرع ميسان</h2>
          <p style="margin: 0; font-size: 11px; font-weight: bold; color: #1e3a8a;">شعبة الشؤون المالية والحسابات | قسم ${departmentName}</p>
        </div>

        <div style="text-align: center;">
          <h1 style="margin: 0; font-size: 18px; font-weight: 900; color: #0f2942; border-bottom: 2px solid #0f2942; padding-bottom: 2px;">
            وصل قبض مالي رسمي
          </h1>
          <span style="display: inline-block; margin-top: 4px; font-size: 11px; font-weight: 900; background-color: #0f2942; color: #ffffff; padding: 2px 12px; border-radius: 6px;">
            نسخة الطالب / الحسابات المعتمدة
          </span>
        </div>

        <div style="text-align: left; line-height: 1.4; font-size: 11px;">
          <p style="margin: 0; font-weight: bold;">رقم الوصل: <strong style="color: #047857;">${installment.receipt_no}</strong></p>
          <p style="margin: 0; font-weight: bold;">تاريخ القبض: <strong>${installment.paid_at}</strong></p>
          <p style="margin: 0; font-weight: bold;">العام الدراسي: <strong>${formatAcademicYearForPDF(record.academic_year)}</strong></p>
        </div>
      </div>

      <!-- تفاصيل الوصل والمستلم -->
      <div style="margin-top: 20px; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 16px; background-color: #f8fafc; font-size: 13px; line-height: 2;">
        <p style="margin: 0;">استلمنا من الطالب/ـة: <strong style="font-size: 15px; color: #0f2942;">${record.student_name}</strong> (الرقم الجامعي: <strong>${record.student_code || '—'}</strong>)</p>
        <p style="margin: 0;">القسم الأكاديمي والمرحلة: <strong>قسم ${departmentName} — المرحلة ${record.stage_number} (${(record.study_type || 'morning') === 'evening' ? 'الدراسة المسائية' : 'الدراسة الصباحية'})</strong></p>
        <p style="margin: 0;">مبلغاً وقدره: <strong style="font-size: 16px; color: #047857;">${installment.amount.toLocaleString()} دينار عراقي</strong></p>
        <p style="margin: 0;">عن تسديد: <strong>الدفعة رقم (${installment.installment_num}) من الأقساط الدراسية المقررة</strong></p>
        <p style="margin: 0;">طريقة التسديد: <strong>${methodLabel}</strong> ${installment.note ? ` | ملاحظات: ${installment.note}` : ''}</p>
      </div>

      <!-- جدول الموقف المالي بعد التسديد -->
      <div style="margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 12px; text-align: center;">
        <div style="padding: 10px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px;">
          <span style="display: block; color: #475569; font-size: 10.5px; font-weight: bold;">صافي القسط السنوي</span>
          <strong style="color: #0f2942; font-size: 13px;">${record.total_amount.toLocaleString()} د.ع</strong>
        </div>
        <div style="padding: 10px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px;">
          <span style="display: block; color: #065f46; font-size: 10.5px; font-weight: bold;">إجمالي المسدد حتى الآن</span>
          <strong style="color: #047857; font-size: 13px;">${record.paid_amount.toLocaleString()} د.ع</strong>
        </div>
        <div style="padding: 10px; background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px;">
          <span style="display: block; color: #9f1239; font-size: 10.5px; font-weight: bold;">المتبقي في الذمة</span>
          <strong style="color: #be123c; font-size: 13px;">${record.remaining_amount.toLocaleString()} د.ع</strong>
        </div>
      </div>

      <!-- التواقيع والختم -->
      <div style="margin-top: 35px; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 30px;">
        <div style="text-align: center; font-size: 11px;">
          <p style="margin: 0; font-weight: bold; color: #475569;">توقيع الطالب المسدد</p>
          <div style="margin-top: 35px; border-bottom: 1px dotted #94a3b8; width: 140px;"></div>
        </div>

        <div style="text-align: center; font-size: 11px;">
          <p style="margin: 0; font-weight: bold; color: #475569;">المحاسب المستلم</p>
          <p style="margin: 2px 0 0; font-weight: 900; color: #0f2942;">${installment.cashier_name || cashierName}</p>
          <div style="margin-top: 35px; border-bottom: 1px dotted #94a3b8; width: 140px;"></div>
          <span style="font-size: 9px; color: #94a3b8; margin-top: 2px; display: block;">الختم المالي لشعبة الحسابات</span>
        </div>
      </div>

      <div style="margin-top: 25px; border-top: 1px solid #cbd5e1; padding-top: 6px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b;">
        <span>جامعة الإمام جعفر الصادق (ع) — فرع ميسان | النظام الإلكتروني الموحد للشؤون المالية</span>
        <span>رقم التتبع: REC-VERIFIED-${Date.now().toString().slice(-6)} 🛡️</span>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 10, pdfWidth, Math.min(pdfHeight, 280));
    pdf.save(`وصل_قبض_${installment.receipt_no}_${record.student_name.replace(/\s+/g, '_')}.pdf`);

    document.body.removeChild(container);
    return true;
  } catch {
    document.body.removeChild(container);
    return false;
  }
}

// =========================================================================
// ⚠️ 7. تصدير كتاب إنذار وتحذير الغياب الرسمي للطالب (Absence Warning Letter PDF)
// =========================================================================
export interface AbsenceWarningExportOptions {
  studentName: string;
  studentCode?: string;
  departmentName: string;
  stageNumber: number;
  academicYear?: string;
  warningLevel: 'absence_warning_1' | 'absence_warning_2' | 'absence_warning_3';
  customDetails?: string;
  headName?: string;
  rapporteurName?: string;
}

export async function exportAbsenceWarningNoticePDF(options: AbsenceWarningExportOptions): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const {
    studentName,
    studentCode,
    departmentName,
    stageNumber,
    academicYear = getAcademicYear(),
    warningLevel,
    customDetails,
    headName = 'رئاسة القسم العلمي',
    rapporteurName = 'مقررية القسم العلمي',
  } = options;

  const warningTitles: Record<string, { title: string; badge: string; color: string; desc: string }> = {
    absence_warning_1: {
      title: 'أمر إداري: تحذير غياب أولي (نسبة 5%)',
      badge: 'تحذير أول ⚠️',
      color: '#d97706',
      desc: 'نظراً لتجاوزكم نسبة الغيابات المحددة بـ (5%) من ساعات المساق التعليمي لمسار بولونيا.',
    },
    absence_warning_2: {
      title: 'أمر إداري: تحذير غياب ثانٍ (نسبة 7%)',
      badge: 'تحذير ثانٍ ⏳',
      color: '#c2410c',
      desc: 'نظراً لتجاوزكم نسبة الغيابات المحددة بـ (7%) من ساعات المساق التعليمي وتخلفكم عن المعالجة.',
    },
    absence_warning_3: {
      title: 'أمر إداري: إنذار غياب نهائي ومخاطر الرسوب (نسبة 10%)',
      badge: 'إنذار نهائي 🚨',
      color: '#b91c1c',
      desc: 'نظراً لبلوغكم نسبة الغياب القصوى (10%)، وهو الحد الحرج الذي يترتب عليه الحرمان من الامتحان النهائي والرسوب بالغياب.',
    },
  };

  const currentWarning = warningTitles[warningLevel] || warningTitles.absence_warning_1;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px';
  container.style.minHeight = '1123px';
  container.style.padding = '35px 30px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Tajawal', sans-serif";
  container.style.direction = 'rtl';
  container.style.boxSizing = 'border-box';

  const todayStr = new Date().toLocaleDateString('ar-IQ-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  container.innerHTML = `
    <div style="border: 2px solid #0f172a; padding: 20px; border-radius: 12px; min-height: 1050px; display: flex; flex-direction: column; justify-content: space-between;">
      
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px;">
          <div style="text-align: right; line-height: 1.3;">
            <p style="margin: 0; font-size: 10px; font-weight: bold; color: #475569;">جمهورية العراق — وزارة التعليم العالي والبحث العلمي</p>
            <h2 style="margin: 2px 0 0; font-size: 14px; font-weight: 900; color: #0f172a;">جامعة الإمام جعفر الصادق (ع) — فرع ميسان</h2>
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #1e3a8a;">رئاسة ومقررية قسم ${departmentName}</p>
          </div>

          <div style="text-align: center;">
            <h1 style="margin: 0; font-size: 15px; font-weight: 900; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 2px;">
              ${currentWarning.title}
            </h1>
            <span style="display: inline-block; margin-top: 4px; font-size: 11px; font-weight: 900; background-color: ${currentWarning.color}; color: #ffffff; padding: 2px 10px; border-radius: 4px;">
              ${currentWarning.badge}
            </span>
          </div>

          <div style="text-align: left; line-height: 1.3; font-size: 10px;">
            <p style="margin: 0; font-weight: bold;">العام الدراسي: <strong>${formatAcademicYearForPDF(academicYear)}</strong></p>
            <p style="margin: 0; font-weight: bold;">العدد: <strong>WARN-ABS/${Date.now().toString().slice(-5)}</strong></p>
            <p style="margin: 0; font-weight: bold;">التاريخ: <strong>${todayStr}</strong></p>
          </div>
        </div>

        <div style="margin-top: 20px; padding: 12px 16px; background-color: #f8fafc; border: 1.5px solid #0f172a; border-radius: 8px; font-size: 11px;">
          <p style="margin: 0 0 6px;">إلى الطالب: <strong style="font-size: 13px; color: #0f172a;">${studentName}</strong> (الرقم الجامعي: <strong style="font-family: 'Tajawal', system-ui, sans-serif;">${studentCode || '---'}</strong>)</p>
          <p style="margin: 0;">القسم والمرحلة: <strong>قسم ${departmentName} — المرحلة ${stageNumber} (مسار بولونيا)</strong></p>
        </div>

        <div style="margin-top: 20px; font-size: 12px; line-height: 1.8; color: #1e293b; text-align: justify;">
          <p style="font-weight: 800;">
            ${currentWarning.desc}
          </p>
          <p style="font-weight: bold;">
            ${customDetails || 'يُعد هذا الكتاب تبليغاً رسمياً بضرورة الالتزام التام بجدول المحاضرات اليومية ومراجعة مقررية القسم لبيان أسباب التغيب، علماً أن تجاوز النسبة المسموح بها قانونياً (10%) سيؤدي إلى ترقين القيد أو الرسوب في المادة الدراسية بموجب تعليمات انضباط الطلبة وضوابط مسار بولونيا.'}
          </p>
        </div>

        <div style="margin-top: 20px; border: 1.5px solid #fca5a5; background-color: #fef2f2; border-radius: 8px; padding: 12px 16px; font-size: 10.5px; font-weight: 800; color: #991b1b;">
          <strong style="display: block; margin-bottom: 4px;">🚨 الضوابط الوزارية الصارمة للغيابات:</strong>
          <ul style="margin: 0; padding-right: 18px;">
            <li>لا تُقبل الأعذار الطبية إلا إذا كانت صادرة من جهة صحية رسمية ومصدقة أصولياً وخلال 48 ساعة من تاريخ الانقطاع.</li>
            <li>الطالب الذي يتجاوز نسبة 10% من الغيابات يُحرم تلقائياً من دخول الامتحانات النهائية الفاينل في المواد المشمولة.</li>
          </ul>
        </div>
      </div>

      <div style="margin-top: 30px; border-top: 1.5px solid #0f172a; padding-top: 15px;">
        <div style="display: flex; justify-content: space-around; text-align: center; font-size: 11px; font-weight: 900;">
          <div>
            <p style="margin: 0; color: #475569;">مقرر القسم العلمي</p>
            <p style="margin: 3px 0 0; color: #0f172a; font-weight: 900;">${rapporteurName}</p>
            <div style="margin-top: 30px; border-bottom: 1px dotted #94a3b8; width: 140px;"></div>
            <span style="font-size: 8.5px; color: #94a3b8; margin-top: 2px; display: block;">التوقيع</span>
          </div>

          <div>
            <p style="margin: 0; color: #475569;">رئيس القسم العلمي</p>
            <p style="margin: 3px 0 0; color: #0f172a; font-weight: 900;">${headName}</p>
            <div style="margin-top: 30px; border-bottom: 1px dotted #94a3b8; width: 140px;"></div>
            <span style="font-size: 8.5px; color: #94a3b8; margin-top: 2px; display: block;">الختم والمصادقة الرسمية</span>
          </div>
        </div>

        <div style="margin-top: 15px; display: flex; justify-content: space-between; font-size: 8.5px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 6px;">
          <span>جامعة الإمام جعفر الصادق (ع) — فرع ميسان | أمر إنذار وتحذير غياب رسمي</span>
          <span>رمز الأرشفة الإدارية: WARN-${Date.now().toString().slice(-6)} 📜</span>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`إنذار_غياب_${studentName.replace(/\s+/g, '_')}_${stageNumber}.pdf`);

    document.body.removeChild(container);
    return true;
  } catch {
    document.body.removeChild(container);
    return false;
  }
}

// =============================================================================
// 📝 دالة تصدير ورقة التكليف والامتحان الفصلي الرسمي PDF بحجم A4
// (كويز، واجب، تقرير، مدتيرم، عملي)
// =============================================================================
export async function exportCourseTaskBriefPDF(options: {
  task: import('@/types').CourseAcademicTask;
  departmentName?: string;
  headName?: string;
  rapporteurName?: string;
}): Promise<boolean> {
  const { 
    task, 
    departmentName = task.department_name || 'القسم الأكاديمي', 
    headName = 'رئاسة القسم العلمي',
    rapporteurName = 'مقررية القسم العلمي'
  } = options;

  const stageArabicName = task.stage_number === 1 ? 'الأولى' : task.stage_number === 2 ? 'الثانية' : task.stage_number === 3 ? 'الثالثة' : task.stage_number === 4 ? 'الرابعة' : `${task.stage_number}`;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px'; // 📐 A4 Portrait (210mm)
  container.style.minHeight = '1123px'; // 📐 A4 Portrait (297mm)
  container.style.padding = '35px 30px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.fontFamily = "'Tajawal', sans-serif";
  container.style.direction = 'rtl';
  container.style.boxSizing = 'border-box';

  const todayStr = new Date().toLocaleDateString('ar-IQ-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const refNumber = `ج ص / تكليف / ${Math.floor(1000 + Math.random() * 9000)}`;

  let typeLabel = '📝 كويز وامتحان فصلي قصير';

  const dueDateFormatted = new Date(task.due_date).toLocaleString('ar-IQ-u-nu-latn', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const finalDeadlineFormatted = task.final_deadline
    ? new Date(task.final_deadline).toLocaleString('ar-IQ-u-nu-latn', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  container.innerHTML = `
    <div style="border: 2.5px solid #000000; padding: 20px; border-radius: 14px; min-height: 1050px; display: flex; flex-direction: column; justify-content: space-between; position: relative; color: #000000; background-color: #ffffff;">
      
      <!-- ترويسة الكتاب الرسمي -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000000; padding-bottom: 12px;">
          <div style="text-align: right; font-size: 11px; line-height: 1.35; color: #000000;">
            <p style="margin: 0; font-weight: 900;">جمهورية العراق</p>
            <p style="margin: 0; font-weight: 900;">وزارة التعليم العالي والبحث العلمي</p>
            <p style="margin: 0; font-weight: 900;">جامعة الإمام جعفر الصادق (ع) — فرع ميسان</p>
            <p style="margin: 0; font-weight: 900; color: #000000;">قسم ${departmentName}</p>
          </div>

          <div style="text-align: center;">
            <div style="width: 55px; height: 55px; margin: 0 auto; border-radius: 50%; background: #ffffff; border: 1.5px solid #000000; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              🏛️
            </div>
            <p style="margin: 3px 0 0; font-size: 9.5px; font-weight: 900; color: #000000;">مسار بولونيا الأكاديمي</p>
          </div>

          <div style="text-align: left; font-size: 10.5px; line-height: 1.35; color: #000000;">
            <p style="margin: 0; font-weight: 900;">العدد: <strong>${refNumber}</strong></p>
            <p style="margin: 0; font-weight: 900;">التاريخ: <strong>${todayStr}</strong></p>
            <p style="margin: 0; font-weight: 900;">المرحلة: <strong>المرحلة ${stageArabicName}</strong></p>
          </div>
        </div>

        <!-- شريط نوع التكليف والوزن التقييمي -->
        <div style="margin-top: 14px; background-color: #000000; border: 2px solid #000000; border-radius: 10px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; color: #ffffff;">
          <div style="font-size: 13px; font-weight: 900; color: #ffffff;">
            ${typeLabel}
          </div>
          <div style="font-size: 11.5px; font-weight: 900; color: #ffffff;">
            الوزن التقييمي المعتمد: <strong>${task.max_score} درجات</strong> من السعي التكويني
          </div>
        </div>

        <!-- تفاصيل المهمة والتعليمات -->
        <div style="margin-top: 14px; background: #ffffff; border: 2px solid #000000; border-radius: 10px; padding: 14px; color: #000000;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 11px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1.5px solid #000000; color: #000000;">
            <div><span style="color: #000000; font-weight: 900;">المادة الدراسية:</span> <strong style="color: #000000; font-weight: 900;">${task.course_name}</strong></div>
            <div><span style="color: #000000; font-weight: 900;">أستاذ المادة:</span> <strong style="color: #000000; font-weight: 900;">${task.teacher_name}</strong></div>
            <div><span style="color: #000000; font-weight: 900;">نوع التقديم:</span> <strong style="color: #000000; font-weight: 900;">${task.submission_mode === 'group_only' ? `جماعي (فرق عمل بحد أقصى ${task.max_group_size || 4} طلاب)` : (task.submission_mode === 'group_allowed' ? `فردي أو جماعي (أقصى حد ${task.max_group_size || 4} طلاب)` : 'فردي (لكل طالب منفرد)')}</strong></div>
          </div>

          <h2 style="margin: 0 0 8px; font-size: 14px; font-weight: 900; color: #000000;">
            📌 عنوان التكليف: ${task.title}
          </h2>
          
          <div style="font-size: 11px; line-height: 1.6; color: #000000; font-weight: 800; margin-bottom: 12px;">
            ${task.description || ''}
          </div>

          ${task.included_topics ? `
            <div style="background: #ffffff; border: 1.5px solid #000000; border-radius: 8px; padding: 10px; margin-bottom: 10px; font-size: 10.5px; color: #000000;">
              <strong style="color: #000000;">🎯 المواضيع والمفردات المشمولة في التكليف:</strong>
              <p style="margin: 4px 0 0; line-height: 1.5; color: #000000; font-weight: 800;">${task.included_topics}</p>
            </div>
          ` : ''}

          <!-- مواعيد الاستحقاق والنهائية -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; font-size: 10.5px; color: #000000;">
            <div style="background: #ffffff; border: 1.5px solid #000000; border-radius: 8px; padding: 8px 12px;">
              <strong style="color: #000000;">⏰ الموعد النهائي للتسليم:</strong>
              <div style="color: #000000; font-weight: 900; margin-top: 2px;">${dueDateFormatted}</div>
            </div>
            ${finalDeadlineFormatted ? `
              <div style="background: #ffffff; border: 1.5px solid #000000; border-radius: 8px; padding: 8px 12px;">
                <strong style="color: #000000;">🚫 إغلاق بوابة التسليم نهائياً:</strong>
                <div style="color: #000000; font-weight: 900; margin-top: 2px;">${finalDeadlineFormatted}</div>
              </div>
            ` : ''}
          </div>
        </div>

        ${task.assignment_questions ? `
          <!-- أسئلة التكليف أو الواجب -->
          <div style="margin-top: 12px; background: #ffffff; border: 2px solid #000000; border-radius: 8px; padding: 12px; color: #000000;">
            <h3 style="margin: 0 0 6px; font-size: 12px; font-weight: 900; color: #000000;">
              ❓ متطلبات وأسئلة التكليف والواجب:
            </h3>
            <p style="margin: 0; font-size: 10.5px; line-height: 1.6; color: #000000; font-weight: 800; white-space: pre-wrap;">
              ${task.assignment_questions}
            </p>
          </div>
        ` : ''}

        ${task.report_topics && task.report_topics.length > 0 ? `
          <!-- عناوين ومحاور التقارير المقترحة -->
          <div style="margin-top: 12px; background: #ffffff; border: 2px solid #000000; border-radius: 8px; padding: 12px; color: #000000;">
            <h3 style="margin: 0 0 6px; font-size: 12px; font-weight: 900; color: #000000;">
              📑 قائمة العناوين والمحاور المعتمدة لكتابة التقرير (يختار الطالب عنواناً واحداً):
            </h3>
            <ul style="margin: 0; padding-right: 18px; font-size: 10.5px; line-height: 1.6; color: #000000;">
              ${task.report_topics.map((top, idx) => `
                <li style="margin-bottom: 4px;">
                  <strong style="color: #000000;">${idx + 1}. ${top.title}</strong>
                  ${top.description ? `<span style="color: #000000; font-size: 9.5px; font-weight: 800;"> - ${top.description}</span>` : ''}
                </li>
              `).join('')}
            </ul>
            ${task.report_guidelines ? `
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1.5px dashed #000000; font-size: 10px; color: #000000;">
                <strong style="color: #000000;">📋 شروط وضوابط التقرير:</strong> ${task.report_guidelines}
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${task.late_penalty_warning ? `
          <!-- تحذير التأخير -->
          <div style="margin-top: 12px; background: #ffffff; border: 2px solid #000000; border-radius: 8px; padding: 10px; color: #000000;">
            <h3 style="margin: 0 0 4px; font-size: 11.5px; font-weight: 900; color: #000000;">
              ⚠️ تنبيه وتحذير التأخير عن التسليم أو الامتحان:
            </h3>
            <p style="margin: 0; font-size: 10.5px; line-height: 1.5; color: #000000; font-weight: 800;">
              ${task.late_penalty_warning}
            </p>
          </div>
        ` : ''}
      </div>

      <!-- التوقيعات الرسمية والختم باللون الأسود الكامل -->
      <div>
        <div style="margin-top: 20px; display: flex; justify-content: space-around; text-align: center; font-size: 11px; padding: 0 15px; color: #000000;">
          <div>
            <p style="margin: 0; color: #000000; font-weight: 900;">أستاذ المادة والمنسق</p>
            <p style="margin: 4px 0 0; color: #000000; font-weight: 900; font-size: 12px;">${task.teacher_name}</p>
            <div style="margin-top: 25px; border-bottom: 1px dotted #000000; width: 130px;"></div>
            <span style="font-size: 9px; color: #000000; font-weight: 900; margin-top: 2px; display: block;">التوقيع والاعتماد</span>
          </div>

          <div>
            <p style="margin: 0; color: #000000; font-weight: 900;">مقرر القسم العلمي</p>
            <p style="margin: 4px 0 0; color: #000000; font-weight: 900; font-size: 12px;">${rapporteurName}</p>
            <div style="margin-top: 25px; border-bottom: 1px dotted #000000; width: 130px;"></div>
            <span style="font-size: 9px; color: #000000; font-weight: 900; margin-top: 2px; display: block;">التدقيق والمراجعة</span>
          </div>

          <div>
            <p style="margin: 0; color: #000000; font-weight: 900;">رئيس القسم العلمي</p>
            <p style="margin: 4px 0 0; color: #000000; font-weight: 900; font-size: 12px;">${headName}</p>
            <div style="margin-top: 25px; border-bottom: 1px dotted #000000; width: 130px;"></div>
            <span style="font-size: 9px; color: #000000; font-weight: 900; margin-top: 2px; display: block;">الختم والمصادقة</span>
          </div>
        </div>

        <div style="margin-top: 14px; display: flex; justify-content: space-between; font-size: 9.5px; color: #000000; font-weight: 900; border-top: 1.5px solid #000000; padding-top: 6px;">
          <span>جامعة الإمام جعفر الصادق (ع) — فرع ميسان | ورقة تكليف وامتحان فصلي معتمدة</span>
          <span>رمز الوثيقة الأكاديمية: TASK-${task.id} 📜</span>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    const safeCourse = (task.course_name || task.course_code || 'تكليف').replace(/[/\\?%*:|"<>]/g, '_').trim();
    const safeTitle = (task.title || 'تكليف').replace(/[/\\?%*:|"<>]/g, '_').trim();
    pdf.save(`ورقة_تكليف_مادة_${safeCourse}_المرحلة_${stageArabicName}_${safeTitle}.pdf`);

    document.body.removeChild(container);
    return true;
  } catch {
    document.body.removeChild(container);
    return false;
  }
}

// =========================================================================
// 📑 10. تصدير كشف وسجل تسليمات الواجبات والتقارير الرسمية A4 Landscape
// =========================================================================
export interface TaskSubmissionsExportOptions {
  task: CourseAcademicTask;
  submissions: StudentTaskSubmission[];
  allStudents: UserProfile[];
  teacherName?: string;
  headName?: string;
  rapporteurName?: string;
  departmentName?: string;
}

export async function exportTaskSubmissionsReportPDF(options: TaskSubmissionsExportOptions): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const { 
    task, 
    submissions, 
    allStudents, 
    teacherName = task.teacher_name, 
    headName = 'رئاسة القسم العلمي', 
    rapporteurName = 'مقررية القسم العلمي', 
    departmentName = task.department_name || 'القسم الأكاديمي' 
  } = options;

  const stageArabicName = task.stage_number === 1 ? 'الأولى' : task.stage_number === 2 ? 'الثانية' : task.stage_number === 3 ? 'الثالثة' : task.stage_number === 4 ? 'الرابعة' : `${task.stage_number}`;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '1120px'; // A4 Landscape width
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '25px 30px';
  container.style.fontFamily = "'Tajawal', sans-serif, Arial";
  container.style.direction = 'rtl';
  container.style.color = '#000000';
  container.style.boxSizing = 'border-box';

  const rowsHTML = allStudents.map((std, idx) => {
    const sub = submissions.find((s) => s.student_id === std.id || s.group_members?.some((m) => m.student_id === std.id));
    const isSubmitted = !!sub;
    const isGraded = isSubmitted && sub.score !== undefined && sub.score !== null;

    let subTypeStr = '—';
    let groupNamesStr = '';
    if (isSubmitted) {
      if (sub.submission_type === 'group' && sub.group_members && sub.group_members.length > 0) {
        subTypeStr = 'جماعي 👥';
        groupNamesStr = sub.group_members.map((m) => m.full_name).join('، ');
      } else {
        subTypeStr = 'فردي 👤';
      }
    }

    const subTimeStr = sub ? new Date(sub.submitted_at).toLocaleDateString('ar-IQ-u-nu-latn', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    
    // 🚦 صياغة قرار التدقيق الأكاديمي
    let decisionBadge = '<span style="color:#000000; font-weight:900; background:#ffffff; padding:3px 6px; border-radius:4px; border:1px solid #000000;">لم يُسلَم ❌</span>';
    if (isSubmitted) {
      if (sub.review_decision === 'accepted') {
        decisionBadge = '<span style="color:#000000; font-weight:900; background:#ffffff; padding:3px 6px; border-radius:4px; border:1.5px solid #000000;">مقبول 🟢</span>';
      } else if (sub.review_decision === 'needs_revision') {
        decisionBadge = '<span style="color:#000000; font-weight:900; background:#ffffff; padding:3px 6px; border-radius:4px; border:1.5px solid #000000;">يحتاج تعديل 🟡</span>';
      } else if (sub.review_decision === 'rejected') {
        decisionBadge = '<span style="color:#000000; font-weight:900; background:#ffffff; padding:3px 6px; border-radius:4px; border:1.5px solid #000000;">مرفوض 🔴</span>';
      } else {
        decisionBadge = '<span style="color:#000000; font-weight:900; background:#ffffff; padding:3px 6px; border-radius:4px; border:1.5px solid #000000;">قيد التدقيق ⏳</span>';
      }
    }

    const scoreStr = isGraded ? `<span style="font-size:11px; font-weight:900; color:#000000;">${sub.score} / ${task.max_score}</span>` : (isSubmitted ? '<span style="color:#000000; font-weight:700;">—</span>' : '—');
    
    // الاستلال العلمي
    const plagStr = (sub && sub.plagiarism_percentage !== undefined && sub.plagiarism_percentage !== null) 
      ? `<span style="font-size:9.5px; font-weight:900; color:#000000;">${sub.plagiarism_percentage}%</span>` 
      : '—';

    const feedbackStr = sub?.decision_reason || sub?.teacher_feedback || '—';

    return `
      <tr style="border-bottom: 1px solid #000000; font-size: 10px; color: #000000; background-color: #ffffff; vertical-align: middle; text-align: center;">
        <td style="padding: 7px 6px; text-align: center; font-weight: 900; border-left: 1px solid #000000; color: #000000; vertical-align: middle;">${idx + 1}</td>
        <td style="padding: 7px 12px; font-weight: 900; border-left: 1px solid #000000; color: #000000; vertical-align: middle; text-align: right;">${std.full_name}</td>
        <td style="padding: 7px 6px; text-align: center; font-weight: 900; border-left: 1px solid #000000; color: #000000; vertical-align: middle;">${subTypeStr}</td>
        <td style="padding: 7px 8px; font-size: 9.5px; font-weight: 800; border-left: 1px solid #000000; color: #000000; vertical-align: middle; text-align: right;">${groupNamesStr || '—'}</td>
        <td style="padding: 7px 6px; text-align: center; font-size: 9.5px; font-weight: 800; border-left: 1px solid #000000; direction: ltr; color: #000000; vertical-align: middle;">${subTimeStr}</td>
        <td style="padding: 7px 6px; text-align: center; border-left: 1px solid #000000; color: #000000; vertical-align: middle;">${decisionBadge}</td>
        ${task.task_type === 'report' ? `<td style="padding: 7px 6px; text-align: center; border-left: 1px solid #000000; color: #000000; vertical-align: middle;">${plagStr}</td>` : ''}
        <td style="padding: 7px 6px; text-align: center; border-left: 1px solid #000000; color: #000000; vertical-align: middle;">${scoreStr}</td>
        <td style="padding: 7px 8px; font-size: 9.5px; font-weight: 800; color: #000000; max-width: 170px; vertical-align: middle; text-align: right;">${feedbackStr}</td>
      </tr>
    `;
  }).join('');

  const submittedCount = submissions.length;
  const acceptedCount = submissions.filter((s) => s.review_decision === 'accepted').length;
  const revisionCount = submissions.filter((s) => s.review_decision === 'needs_revision').length;
  const rejectedCount = submissions.filter((s) => s.review_decision === 'rejected').length;
  const unsubmittedCount = allStudents.length - submittedCount;

  container.innerHTML = `
    <div style="border: 2.5px solid #000000; padding: 18px; border-radius: 12px; color: #000000; background-color: #ffffff;">
      
      <!-- الهيدر الرسمي للجامعة -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000000; padding-bottom: 10px; color: #000000;">
        <div style="text-align: right; color: #000000;">
          <h4 style="margin: 0; font-size: 11px; font-weight: 900; color: #000000;">جمهورية العراق — وزارة التعليم العالي والبحث العلمي</h4>
          <h3 style="margin: 3px 0 0; font-size: 14px; font-weight: 900; color: #000000;">جامعة الإمام جعفر الصادق (ع) — فرع ميسان</h3>
          <p style="margin: 2px 0 0; font-size: 11.5px; font-weight: 900; color: #000000;">قسم ${departmentName} | مسار بولونيا</p>
        </div>
        <div style="text-align: center; color: #000000;">
          <div style="font-size: 16px; font-weight: 900; color: #000000; border: 2px solid #000000; padding: 6px 16px; border-radius: 8px; background: #ffffff;">
            كشف وتقييم تسليمات التكليف الأكاديمي والقرارات
          </div>
          <span style="font-size: 10.5px; font-weight: 900; color: #000000; margin-top: 4px; display: block;">العام الدراسي ${formatAcademicYearForPDF(task.academic_year)}</span>
        </div>
        <div style="text-align: left; font-size: 10.5px; font-weight: 900; color: #000000;">
          <p style="margin: 0; color: #000000;">المادة: <strong style="color: #000000;">${task.course_name}</strong></p>
          <p style="margin: 2px 0 0; color: #000000;">المرحلة: <strong style="color: #000000;">المرحلة ${stageArabicName}</strong> • <strong style="color: #000000;">${task.study_type === 'evening' ? 'الدراسة المسائية' : task.study_type === 'both' ? 'صباحي ومسائي' : 'الدراسة الصباحية'}</strong></p>
          <p style="margin: 2px 0 0; color: #000000;">تاريخ التصدير: <strong style="color: #000000;">${new Date().toLocaleDateString('ar-IQ-u-nu-latn')}</strong></p>
        </div>
      </div>

      <!-- بطاقة بيانات التكليف والإحصائيات -->
      <div style="margin-top: 10px; display: grid; grid-template-columns: 1.5fr 1fr 1fr 2fr; gap: 8px; background: #ffffff; border: 2px solid #000000; padding: 8px 12px; border-radius: 8px; font-size: 10.5px; font-weight: 900; color: #000000; align-items: center;">
        <div>📌 عنوان التكليف: <strong style="color: #000000;">${task.title}</strong> (${task.task_type === 'assignment' ? 'واجب بيتي' : 'تقرير فصلي'})</div>
        <div> التدريسي: <strong style="color: #000000;">${teacherName}</strong></div>
        <div>💯 الدرجة العظمى: <strong style="color: #000000;">${task.max_score} درجات</strong></div>
        <div style="text-align: left; color: #000000;">
          <span>🟢 مقبول: <strong>${acceptedCount}</strong></span> | 
          <span>🟡 تعديل: <strong>${revisionCount}</strong></span> | 
          <span>🔴 مرفوض: <strong>${rejectedCount}</strong></span> | 
          <span>❌ لم يسلموا: <strong>${unsubmittedCount}</strong></span>
        </div>
      </div>

      <!-- جدول التسليمات والتقييمات -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 12px; border: 2px solid #000000;">
        <thead>
          <tr style="background-color: #000000; color: #ffffff; font-size: 9.5px; font-weight: 900; text-align: center; vertical-align: middle;">
            <th style="padding: 8px 5px; width: 28px; text-align: center; border-left: 1px solid #ffffff; color: #ffffff; vertical-align: middle;">ت</th>
            <th style="padding: 8px 12px; text-align: right; border-left: 1px solid #ffffff; color: #ffffff; vertical-align: middle;">اسم الطالب الرباعي</th>
            <th style="padding: 8px 5px; width: 65px; text-align: center; border-left: 1px solid #ffffff; color: #ffffff; vertical-align: middle;">نوع التقديم</th>
            <th style="padding: 8px 8px; text-align: right; border-left: 1px solid #ffffff; color: #ffffff; vertical-align: middle;">أعضاء الفريق (إن وجد)</th>
            <th style="padding: 8px 5px; width: 100px; text-align: center; border-left: 1px solid #ffffff; color: #ffffff; vertical-align: middle;">وقت التسليم</th>
            <th style="padding: 8px 5px; width: 85px; text-align: center; border-left: 1px solid #ffffff; color: #ffffff; vertical-align: middle;">قرار التدقيق</th>
            ${task.task_type === 'report' ? '<th style="padding: 8px 5px; width: 65px; text-align: center; border-left: 1px solid #ffffff; color: #ffffff; vertical-align: middle;">الاستلال %</th>' : ''}
            <th style="padding: 8px 5px; width: 70px; text-align: center; border-left: 1px solid #ffffff; color: #ffffff; vertical-align: middle;">الدرجة</th>
            <th style="padding: 8px 8px; text-align: right; color: #ffffff; vertical-align: middle;">ملاحظات / أسباب القرار</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>

      <!-- التواقيع والمصادقات -->
      <div style="margin-top: 22px; border-top: 1.5px solid #000000; padding-top: 12px; color: #000000;">
        <div style="display: flex; justify-content: space-around; text-align: center; font-size: 11px; font-weight: 900; color: #000000;">
          <div>
            <p style="margin: 0; color: #000000;">أستاذ المادة والمنسق</p>
            <p style="margin: 4px 0 0; color: #000000; font-weight: 900; font-size: 12px;">${teacherName}</p>
            <div style="margin-top: 25px; border-bottom: 1px dotted #000000; width: 130px;"></div>
            <span style="font-size: 9px; color: #000000; font-weight: 900; margin-top: 2px; display: block;">التوقيع والاعتماد</span>
          </div>

          <div>
            <p style="margin: 0; color: #000000;">مقرر القسم العلمي</p>
            <p style="margin: 4px 0 0; color: #000000; font-weight: 900; font-size: 12px;">${rapporteurName}</p>
            <div style="margin-top: 25px; border-bottom: 1px dotted #000000; width: 130px;"></div>
            <span style="font-size: 9px; color: #000000; font-weight: 900; margin-top: 2px; display: block;">التدقيق والمراجعة</span>
          </div>

          <div>
            <p style="margin: 0; color: #000000;">رئيس القسم العلمي</p>
            <p style="margin: 4px 0 0; color: #000000; font-weight: 900; font-size: 12px;">${headName}</p>
            <div style="margin-top: 25px; border-bottom: 1px dotted #000000; width: 130px;"></div>
            <span style="font-size: 9px; color: #000000; font-weight: 900; margin-top: 2px; display: block;">الختم والمصادقة</span>
          </div>
        </div>

        <div style="margin-top: 12px; display: flex; justify-content: space-between; font-size: 9.5px; color: #000000; font-weight: 900; border-top: 1px solid #000000; padding-top: 6px;">
          <span>جامعة الإمام جعفر الصادق (ع) — فرع ميسان | كشف تسليمات الواجبات والتقارير المعتمد لمسار بولونيا</span>
          <span>رمز الوثيقة: SUB-RPT-${task.id} 🛡️</span>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    const safeCourse = (task.course_name || task.course_code || 'تكليف').replace(/[/\\?%*:|"<>]/g, '_').trim();
    const safeTitle = (task.title || 'تقرير').replace(/[/\\?%*:|"<>]/g, '_').trim();
    pdf.save(`كشف_تسليمات_مادة_${safeCourse}_المرحلة_${stageArabicName}_${safeTitle}.pdf`);

    document.body.removeChild(container);
    return true;
  } catch {
    document.body.removeChild(container);
    return false;
  }
}

// ==============================================================================
// 📋 واجهة خيارات تصدير كشف الحضور والغياب الأكاديمي الرسمي لمسار بولونيا A4 PDF
// ==============================================================================
export interface ExportBolognaAttendanceReportPDFOptions {
  courseName: string;                     // 📘 اسم المادة الدراسية
  courseCode: string;                     // 🏷️ رمز المادة
  stageNumber: number;                    // 🎓 رقم المرحلة
  semester: 1 | 2;                        // 🗓️ الكورس الدراسي
  academicYear: string;                   // 📅 العام الدراسي
  departmentName: string;                 // 🏢 اسم القسم الأكاديمي
  teacherName: string;                    // 👤 اسم التدريسي
  departmentHeadName?: string;            // 👤 اسم رئيس القسم
  rapporteurName?: string;                // 👤 اسم مقرر القسم
  selectedWeek?: number;                  // 🔢 رقم الأسبوع المحدد أو الكلي
  students: {
    studentId: string;                    // 🎓 معرف الطالب
    studentName: string;                  // 👤 اسم الطالب
    universityNumber: string;             // 🔢 الرقم الجامعي
    studyType?: string;                   // ☀️ نوع الدراسة (صباحي / مسائي)
    presentCount: number;                 // 🟢 عدد مرات الحضور
    unexcusedAbsenceCount: number;        // 🔴 عدد الغيابات غير المبررة
    excusedAbsenceCount: number;          // 🟡 عدد الإجازات الرسمية
    lateCount: number;                    // ⏱️ عدد مرات التأخر
    totalUnexcusedHours: number;          // ⏱️ إجمالي ساعات الغياب
    absencePercentage: number;            // 📊 نسبة الغياب المئوية
    warningStatus: 'safe' | 'warning_1' | 'warning_2' | 'banned'; // ⚠️ الموقف الأكاديمي
  }[];
}

// 📄 دالة تصدير كشف الحضور والغياب لمادة دراسية A4 Landscape PDF
export async function exportBolognaAttendanceReportPDF(options: ExportBolognaAttendanceReportPDFOptions): Promise<boolean> {
  const {
    courseName,
    courseCode,
    stageNumber,
    semester,
    academicYear,
    departmentName,
    teacherName,
    departmentHeadName = 'رئاسة القسم العلمي',
    rapporteurName = 'مقررية القسم العلمي',
    selectedWeek,
    students,
  } = options;

  if (typeof document === 'undefined') return false;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '1200px';
  container.style.padding = '30px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.fontFamily = "'Tajawal', sans-serif";
  container.style.direction = 'rtl';
  container.style.boxSizing = 'border-box';

  const todayStr = new Date().toLocaleDateString('ar-IQ-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const stageArabicName = stageNumber === 1 ? 'الأولى' : stageNumber === 2 ? 'الثانية' : stageNumber === 3 ? 'الثالثة' : 'الرابعة';

  const tableRowsHtml = students.map((s, idx) => {
    let badgeLabel = 'طبيعي (آمن)';
    let badgeColor = '#047857';
    let badgeBg = '#ecfdf5';

    if (s.warningStatus === 'warning_1') {
      badgeLabel = 'إنذار أولي (5%)';
      badgeColor = '#b45309';
      badgeBg = '#fef3c7';
    } else if (s.warningStatus === 'warning_2') {
      badgeLabel = 'إنذار نهائي (7%)';
      badgeColor = '#c2410c';
      badgeBg = '#ffedd5';
    } else if (s.warningStatus === 'banned') {
      badgeLabel = 'حرمان رسمي (10%)';
      badgeColor = '#b91c1c';
      badgeBg = '#fee2e2';
    }

    return `
      <tr style="border-bottom: 1px solid #000000; text-align: center; vertical-align: middle; font-size: 11px; height: 32px;">
        <td style="border: 1.5px solid #000000; font-weight: 900; width: 30px;">${idx + 1}</td>
        <td style="border: 1.5px solid #000000; font-weight: 900; text-align: right; padding: 0 8px; font-size: 11.5px;">${escapeHtml(s.studentName)}</td>
        <td style="border: 1.5px solid #000000; font-family: monospace; font-weight: 900; width: 110px;">${escapeHtml(s.universityNumber)}</td>
        <td style="border: 1.5px solid #000000; font-weight: 900; width: 70px;">${s.studyType === 'evening' ? 'مسائي' : 'صباحي'}</td>
        <td style="border: 1.5px solid #000000; font-weight: 900; color: #047857; width: 55px;">${s.presentCount}</td>
        <td style="border: 1.5px solid #000000; font-weight: 900; color: #0369a1; width: 55px;">${s.excusedAbsenceCount}</td>
        <td style="border: 1.5px solid #000000; font-weight: 900; color: #b45309; width: 55px;">${s.lateCount}</td>
        <td style="border: 1.5px solid #000000; font-weight: 900; color: #b91c1c; font-size: 12px; width: 75px;">${s.totalUnexcusedHours} س</td>
        <td style="border: 1.5px solid #000000; font-weight: 900; font-size: 12px; font-family: monospace; width: 75px;">${s.absencePercentage}%</td>
        <td style="border: 1.5px solid #000000; font-weight: 900; width: 130px; background-color: ${badgeBg}; color: ${badgeColor};">
          ${badgeLabel}
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div style="border: 2px solid #000000; padding: 18px 22px; border-radius: 12px; background-color: #ffffff; min-height: 750px; display: flex; flex-direction: column; justify-content: space-between;">
      
      <div>
        <!-- 🏛️ الترويسة الأكاديمية -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000000; padding-bottom: 10px;">
          <div style="text-align: right; line-height: 1.35; color: #000000;">
            <p style="margin: 0; font-size: 11px; font-weight: 900;">جمهورية العراق — وزارة التعليم العالي والبحث العلمي</p>
            <h2 style="margin: 3px 0 0; font-size: 14px; font-weight: 900; color: #000000;">جامعة الإمام جعفر الصادق (ع) — فرع ميسان</h2>
            <p style="margin: 0; font-size: 11px; font-weight: 900; color: #000000;">قسم ${escapeHtml(departmentName)}</p>
          </div>

          <div style="text-align: center;">
            <img src="/logo.webp" alt="شعار الجامعة" style="width: 65px; height: 65px; object-fit: contain;" />
            <div style="font-size: 10px; font-weight: 900; color: #000000; margin-top: 2px;">مسار بولونيا (Bologna Process)</div>
          </div>

          <div style="text-align: left; line-height: 1.4; font-size: 11px; font-weight: 900; color: #000000;">
            <p style="margin: 0;">المرحلة: <strong>${stageArabicName}</strong></p>
            <p style="margin: 0;">العام الدراسي: <strong>${escapeHtml(formatAcademicYearForPDF(academicYear))}</strong></p>
            <p style="margin: 0;">الكورس: <strong>${semester === 1 ? 'الأول' : 'الثاني'}</strong></p>
            <p style="margin: 0;">التاريخ: <strong>${todayStr}</strong></p>
          </div>
        </div>

        <!-- 🏷️ عنوان الوثيقة -->
        <div style="text-align: center; margin: 12px 0;">
          <h1 style="margin: 0; font-size: 16px; font-weight: 900; color: #000000;">
            كشف الحضور والغيابات وموقف الحرمان الأكاديمي لمادة: ${escapeHtml(courseName)} (${escapeHtml(courseCode)})
          </h1>
          <p style="margin: 4px 0 0; font-size: 11px; font-weight: 900; color: #000000;">
            ${selectedWeek ? `سجل الأسبوع الدراسي: (${selectedWeek})` : 'سجل الحضور التراكمي الفصلي الشامل (15 أسبوعاً)'} — أستاذ المادة: ${escapeHtml(teacherName)}
          </p>
        </div>

        <!-- 📊 جدول الحضور والغياب -->
        <table style="width: 100%; border-collapse: collapse; border: 2px solid #000000; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #000000; font-size: 11px; font-weight: 900; height: 34px;">
              <th style="border: 1.5px solid #000000; width: 30px;">ت</th>
              <th style="border: 1.5px solid #000000; text-align: right; padding: 0 8px;">اسم الطالب الرباعي</th>
              <th style="border: 1.5px solid #000000; width: 110px;">الرقم الجامعي</th>
              <th style="border: 1.5px solid #000000; width: 70px;">الدراسة</th>
              <th style="border: 1.5px solid #000000; width: 55px;">حاضر</th>
              <th style="border: 1.5px solid #000000; width: 55px;">إجازة</th>
              <th style="border: 1.5px solid #000000; width: 55px;">متأخر</th>
              <th style="border: 1.5px solid #000000; width: 75px;">ساعات الغياب</th>
              <th style="border: 1.5px solid #000000; width: 75px;">نسبة الغياب</th>
              <th style="border: 1.5px solid #000000; width: 130px;">الموقف الأكاديمي</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- ✍️ التواقيع والمصادقات الرسمية -->
      <div style="margin-top: 22px; border-top: 1.5px solid #000000; padding-top: 12px; color: #000000;">
        <div style="display: flex; justify-content: space-around; text-align: center; font-size: 11px; font-weight: 900;">
          <div>
            <p style="margin: 0;">أستاذ المادة</p>
            <p style="margin: 4px 0 0; font-weight: 900; font-size: 12px;">${escapeHtml(teacherName)}</p>
            <div style="margin-top: 25px; border-bottom: 1px dotted #000000; width: 130px;"></div>
            <span style="font-size: 9px; margin-top: 2px; display: block;">التوقيع والاعتماد</span>
          </div>

          <div>
            <p style="margin: 0;">مقرر القسم العلمي</p>
            <p style="margin: 4px 0 0; font-weight: 900; font-size: 12px;">${escapeHtml(rapporteurName)}</p>
            <div style="margin-top: 25px; border-bottom: 1px dotted #000000; width: 130px;"></div>
            <span style="font-size: 9px; margin-top: 2px; display: block;">التدقيق والمراجعة</span>
          </div>

          <div>
            <p style="margin: 0;">رئيس القسم العلمي</p>
            <p style="margin: 4px 0 0; font-weight: 900; font-size: 12px;">${escapeHtml(departmentHeadName)}</p>
            <div style="margin-top: 25px; border-bottom: 1px dotted #000000; width: 130px;"></div>
            <span style="font-size: 9px; margin-top: 2px; display: block;">الختم والمصادقة</span>
          </div>
        </div>

        <div style="margin-top: 12px; display: flex; justify-content: space-between; font-size: 9.5px; font-weight: 900; border-top: 1px solid #000000; padding-top: 6px;">
          <span>جامعة الإمام جعفر الصادق (ع) — فرع ميسان | كشف الحضور والغياب المعتمد لمسار بولونيا</span>
          <span>رمز الوثيقة: ATT-${courseCode}-${new Date().getFullYear()} 🛡️</span>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    const safeCourse = (courseName || courseCode || 'مادة').replace(/[/\\?%*:|"<>]/g, '_').trim();
    pdf.save(`كشف_حضور_مادة_${safeCourse}_المرحلة_${stageArabicName}.pdf`);

    document.body.removeChild(container);
    return true;
  } catch {
    document.body.removeChild(container);
    return false;
  }
}

// ==============================================================================
// 📋 واجهة بيانات المقرر الدراسي لتصدير الـ PDF الأكاديمي المعتمد
// ==============================================================================
export interface DepartmentCoursePDFItem {
  id: string; // 🆔 الآيدي المميز للمادة
  name: string; // 📘 اسم المادة الدراسية بالعربي
  code: string; // 🏷️ كود المادة الأكاديمي
  stage: number; // 🎓 رقم المرحلة الدراسية من 1 لـ 4
  semester: number; // 🗓️ الكورس الدراسي 1 أو 2
  course_type: string; // 🔬 نوع المادة إذا نظري فقط أو نظري وعملي
  credits?: number | null; // ⏱️ وحدات وساعات بولونيا المعتمدة ECTS
  theory_hours?: number; // 📚 ساعات النظري الأسبوعية
  practical_hours?: number; // 🧪 ساعات العملي الأسبوعية
  theory_teacher_name?: string; // 👨‍🏫 اسم أستاذ النظري المكلف
  practical_teacher_name?: string; // 🧪 اسم أستاذ العملي المكلف
  is_final_exam_enabled?: boolean; // 🎯 حالة رصد درجات الفاينل الدور الأول
  is_supplementary_exam_enabled?: boolean; // 🔄 حالة رصد درجات الدور الثاني
}

// ==============================================================================
// 📋 واجهة خيارات تصدير جدول ومقررات القسم بصيغة PDF A4 Landscape
// ==============================================================================
export interface ExportDepartmentCoursesPDFOptions {
  departmentName: string; // 🏢 اسم القسم الأكاديمي
  collegeName?: string; // 🏛️ اسم الكلية التابع إلها القسم
  academicYear?: string; // 📅 السنة الدراسية المعتمدة
  departmentHeadName?: string; // 👤 اسم رئيس القسم الأكاديمي
  rapporteurName?: string; // 👤 اسم مقرر القسم الأكاديمي
  stageFilter?: number | 'all'; // 🎓 تصفية المرحلة المحددة إذا جانت مفلترة
  semesterFilter?: number | 'all'; // 🗓️ تصفية الكورس المحدد إذا جان مفلتر
  isSelectiveExport?: boolean; // 🔍 هل التصدير لمواد محددة فقط اختارهن المستخدم؟
  courses: DepartmentCoursePDFItem[]; // 📚 مصفوفة المواد والمقررات المراد طباعتها
}

// ==============================================================================
// 🖨️ دالة توليد وتصدير كشف المواد والمقررات الدراسية الرسمية المعتمدة بصيغة PDF A4 Landscape
// ==============================================================================
export async function exportDepartmentCoursesPDF(options: ExportDepartmentCoursesPDFOptions): Promise<boolean> {
  // 🌐 التأكد من وجود نافذة المتصفح حتى لا يضرب بالسيرفر
  if (typeof window === 'undefined') return false;

  // 🛡️ 1. فحص سقف معدل الطلبات للعمليات الثقيلة لمنع الضغط المفرط
  const rateLimit = checkRateLimit(`dept-courses-${options.departmentName}`, 'HEAVY_COMPUTE');
  // 🔍 إذا تجاوز المستخدم الحد المسموح نعرضله إشعار ونوقف العملية
  if (!rateLimit.allowed) {
    showPdfToast(rateLimit.reason || '⚠️ يرجى الانتظار شوية قبل تصدير ملف جديد لحماية المنظومة.');
    return false;
  }

  // 🔒 2. قفل التزامن الفردي حتى لا يضغط الزر مرتين بنفس اللحظة
  const lockKey = `pdf-export-dept-courses-${options.departmentName}`;
  // 🛑 فحص أخذ القفل بنجاح
  if (!acquireHeavyTaskLock(lockKey)) {
    showPdfToast('⏳ عملية تجهيز كشف المواد قيد المعالجة، انتظر لحظات وتكمل.');
    return false;
  }

  // 📦 تفكيك المتغيرات من كائن الخيارات الممرر للدالة
  const {
    departmentName, // 🏢 اسم القسم
    collegeName = 'كلية تكنولوجيا المعلومات', // 🏛️ اسم الكلية الافتراضي
    academicYear = getAcademicYear(), // 📅 العام الدراسي
    departmentHeadName = 'رئيس القسم العلمي', // 👤 اسم رئيس القسم الافتراضي
    rapporteurName = 'مقرر القسم العلمي', // 👤 اسم المقرر الافتراضي
    stageFilter = 'all', // 🎓 المرحلة المفلترة
    semesterFilter = 'all', // 🗓️ الكورس المفلتر
    isSelectiveExport = false, // 🔍 هل التصدير محدد
    courses, // 📚 قائمة المواد
  } = options;

  // 🎯 توحيد وتنسيق العام الدراسي ليطلع 2026 - 2027
  const displayAcademicYear = formatAcademicYearForPDF(academicYear);

  // 🕒 تاريخ اليوم الحالي بالتنسيق العربي العراقي الجميل
  const todayStr = new Date().toLocaleDateString('ar-IQ-u-nu-latn', {
    year: 'numeric', // 🗓️ السنة
    month: 'long', // 🌙 الشهر بالاسم العربي
    day: 'numeric', // ☀️ اليوم
  });

  // 🎓 تحويل رقم المرحلة المفلترة للاسم العربي
  const stageFilterText = stageFilter === 1 ? 'المرحلة الأولى' : stageFilter === 2 ? 'المرحلة الثانية' : stageFilter === 3 ? 'المرحلة الثالثة' : stageFilter === 4 ? 'المرحلة الرابعة' : 'كافة المراحل الدراسية';
  // 🗓️ تحويل رقم الكورس المفلتر للاسم العربي
  const semesterFilterText = semesterFilter === 1 ? 'الكورس الأول' : semesterFilter === 2 ? 'الكورس الثاني' : 'كافة الكورسات';

  // 🏗️ إنشاء الحاوية المؤقتة لتجهيز شكل الصفحة قبل التحويل لصورة
  const container = document.createElement('div');
  container.style.position = 'fixed'; // 📌 تثبيت العنصر
  container.style.top = '-9999px'; // 🙈 إخفاء العنصر خارج الشاشة من فوق
  container.style.left = '-9999px'; // 🙈 إخفاء العنصر خارج الشاشة من اليسار
  container.style.width = '1123px'; // 📐 عرض ورقة A4 بالعرض Landscape تماماً
  container.style.minHeight = '794px'; // 📐 ارتفاع ورقة A4 بالعرض Landscape تماماً
  container.style.padding = '24px 30px'; // 🔲 حواف داخلية مريحة ومتناسقة
  container.style.backgroundColor = '#ffffff'; // ⚪ خلفية بيضاء نقية للطباعة الرسمية
  container.style.color = '#000000'; // ⚫ لون نص أسود داكن عالي التباين
  container.style.fontFamily = "'Tajawal', sans-serif"; // ✍️ خط تجوال العربي الرسمي
  container.style.direction = 'rtl'; // ➡️ توجيه من اليمين لليسار
  container.style.boxSizing = 'border-box'; // 📏 ضبط نظام البوكس موديل

  // 🧮 إحصائيات المقررات المعروضة بالكشف
  const totalCoursesCount = courses.length; // 🔢 إجمالي عدد المواد بالكشف
  const theoryPracticalCount = courses.filter((c) => c.course_type === 'theory_and_practical' || (c.practical_hours && c.practical_hours > 0)).length; // 🧪 عدد مواد النظري والعملي
  const theoryOnlyCount = courses.filter((c) => c.course_type === 'theory_only' && (!c.practical_hours || c.practical_hours === 0)).length; // 📖 عدد مواد النظري فقط
  const totalEctsCredits = courses.reduce((acc, c) => acc + (c.credits || 5), 0); // ⏱️ إجمالي وحدات بولونيا

  // 🔍 فحص هل يوجد أي مادة لديها الدور الأول أو الدور الثاني مفتوح لإخفاء الأعمدة بالكامل عند الإغلاق
  const hasAnyFinalExamOpen = courses.some((c) => c.is_final_exam_enabled === true); // 🎯 هل الدور الأول مفتوح لأي مادة بالكشف؟
  const hasAnySupplementaryOpen = courses.some((c) => c.is_supplementary_exam_enabled === true); // 🔄 هل الدور الثاني مفتوح لأي مادة بالكشف؟

  // 📝 توليد صفوف جدول المواد سطراً بسطر باحترافية وتنسيق عالي وألوان سوداء نقية
  const tableRowsHtml = courses.map((c, idx) => {
    // 🧪 فحص إذا المادة بيها عملي
    const isPractical = c.course_type === 'theory_and_practical' || (c.practical_hours !== undefined && c.practical_hours > 0);
    // 🎓 اسم المرحلة العربي
    const stageName = c.stage === 1 ? 'الأولى' : c.stage === 2 ? 'الثانية' : c.stage === 3 ? 'الثالثة' : c.stage === 4 ? 'الرابعة' : `${c.stage}`;
    // 🗓️ اسم الكورس العربي
    const semName = c.semester === 1 ? 'الأول' : 'الثاني';
    // 🎨 تلوين تبادلي خفيف جداً للصفوف للقراءة المريحة
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

    return `
      <tr style="border-bottom: 1.5px solid #000000; background-color: ${rowBg}; text-align: center; vertical-align: middle; font-size: 11px; color: #000000; height: 34px;">
        <td style="padding: 0 4px; font-weight: 900; border: 1.5px solid #000000; width: 32px; color: #000000; text-align: center; vertical-align: middle;">${idx + 1}</td>
        <td style="padding: 0 8px; font-weight: 900; text-align: right; border: 1.5px solid #000000; font-size: 11.5px; color: #000000; vertical-align: middle;">${escapeHtml(c.name)}</td>
        <td style="padding: 0 4px; border: 1.5px solid #000000; font-weight: 900; font-family: monospace; color: #000000; text-align: center; vertical-align: middle; width: 75px;">${escapeHtml(c.code)}</td>
        <td style="padding: 0 4px; border: 1.5px solid #000000; font-weight: 900; color: #000000; text-align: center; vertical-align: middle; width: 120px;">${stageName} — كورس ${semName}</td>
        <td style="padding: 0 4px; border: 1.5px solid #000000; font-weight: 900; color: #000000; text-align: center; vertical-align: middle; width: 95px;">
          ${isPractical ? '<span style="color: #000000; font-weight: 900;">نظري وعملي</span>' : '<span style="color: #000000; font-weight: 900;">نظري فقط</span>'}
        </td>
        <!-- ⚖️ عمود عدد وحدات بولونيا ECTS مع حاوية LTR صريحة لمنع تداخل الأرقام مع النص -->
        <td style="padding: 0 4px; border: 1.5px solid #000000; font-weight: 900; color: #000000; text-align: center; vertical-align: middle; width: 85px;">
          <!-- 📦 فلكس بوكس صريح LTR لفصل رقم الوحدات عن كلمة ECTS تماماً وتجنب التراكب في html2canvas -->
          <div dir="ltr" style="display: inline-flex; align-items: center; justify-content: center; gap: 5px; width: 100%;">
            <!-- 🔢 رقم الساعات المعتمدة للوحدة مع خط تجوال لمنع التصاق الرموز -->
            <span style="font-weight: 900; font-size: 12px; color: #000000; font-family: 'Tajawal', sans-serif;">${c.credits || 5}</span>
            <!-- 🌐 رمز وحدات بولونيا ECTS الأكاديمي بلون أسود داكن -->
            <span style="font-size: 10px; color: #000000; font-weight: 900; font-family: 'Tajawal', sans-serif;">ECTS</span>
          </div>
        </td>
        <td style="padding: 0 6px; border: 1.5px solid #000000; font-weight: 900; color: #000000; text-align: right; vertical-align: middle;">
          ${escapeHtml(c.theory_teacher_name || '— لم يحدد —')}
        </td>
        <td style="padding: 0 6px; border: 1.5px solid #000000; font-weight: 900; color: #000000; text-align: right; vertical-align: middle;">
          ${isPractical ? escapeHtml(c.practical_teacher_name || '— لم يحدد —') : '<span style="color: #000000; font-weight: 900;">— نظري فقط</span>'}
        </td>
        ${hasAnyFinalExamOpen ? `
          <td style="padding: 0 4px; border: 1.5px solid #000000; font-weight: 900; text-align: center; vertical-align: middle; width: 110px;">
            ${c.is_final_exam_enabled 
              ? '<span style="color: #000000; font-weight: 900;">مفتوح للرصد</span>' 
              : '<span style="color: #000000; font-weight: 900;">—</span>'}
          </td>
        ` : ''}
        ${hasAnySupplementaryOpen ? `
          <td style="padding: 0 4px; border: 1.5px solid #000000; font-weight: 900; text-align: center; vertical-align: middle; width: 110px;">
            ${c.is_supplementary_exam_enabled 
              ? '<span style="color: #000000; font-weight: 900;">مفتوح للرصد</span>' 
              : '<span style="color: #000000; font-weight: 900;">—</span>'}
          </td>
        ` : ''}
      </tr>
    `;
  }).join('');

  // 📄 تجهيز قالب الـ HTML الكامل للوثيقة الرسمية متضمن الترويسة والجدول والتواقيع
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; justify-content: space-between; min-height: 746px;">
      
      <div>
        <!-- 🏛️ الترويسة الأكاديمية الرسمية للجامعة والوزارة بلون أسود ناصع وواضح -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #000000; padding-bottom: 12px;">
          <div style="text-align: right; line-height: 1.4; color: #000000;">
            <p style="margin: 0; font-size: 11px; font-weight: 900; color: #000000;">جمهورية العراق — وزارة التعليم العالي والبحث العلمي</p>
            <h2 style="margin: 3px 0 0; font-size: 15px; font-weight: 900; color: #000000;">جامعة الإمام جعفر الصادق (ع) — فرع ميسان</h2>
            <p style="margin: 2px 0 0; font-size: 12px; font-weight: 900; color: #000000;">${escapeHtml(collegeName)} — قسم ${escapeHtml(departmentName)}</p>
          </div>

          <div style="text-align: center;">
            <img src="/logo.webp" alt="شعار الجامعة" style="width: 65px; height: 65px; object-fit: contain;" />
            <!-- 🏷️ عنوان النظام بنص عربي فقط وحذف أي نص إنكليزي تلبية لطلب المستخدم -->
            <div style="font-size: 11.5px; font-weight: 900; color: #000000; margin-top: 2px;">مسار بولونيا</div>
          </div>

          <div style="text-align: left; line-height: 1.45; font-size: 11px; font-weight: 900; color: #000000;">
            <p style="margin: 0; color: #000000;">العام الدراسي: <strong style="color: #000000;">${escapeHtml(displayAcademicYear)}</strong></p>
            <p style="margin: 0; color: #000000;">نطاق الكشف: <strong style="color: #000000;">${escapeHtml(stageFilterText)} (${escapeHtml(semesterFilterText)})</strong></p>
            <p style="margin: 0; color: #000000;">تاريخ الإصدار: <strong style="color: #000000;">${todayStr}</strong></p>
            <p style="margin: 0; color: #000000;">إجمالي المواد المعتمدة: <strong style="color: #000000;">${totalCoursesCount} مادة</strong></p>
          </div>
        </div>

        <!-- 🏷️ عنوان الوثيقة البارز بدون تداخل الحروف وبألوان سوداء نقية -->
        <div style="text-align: center; margin: 12px 0 10px 0;">
          <h1 style="margin: 0; font-size: 16.5px; font-weight: 900; color: #000000; letter-spacing: normal;">
            كشف المقررات والمناهج الدراسية وتوصيف الأساتذة والأدوار الامتحانية
          </h1>
          <p style="margin: 4px 0 0; font-size: 11.5px; font-weight: 900; color: #000000; letter-spacing: normal;">
            قسم ${escapeHtml(departmentName)} ${isSelectiveExport ? '(كشف خاص بالمواد المحددة)' : '— القائمة الأكاديمية المعتمدة'}
          </p>
        </div>

        <!-- 🧮 شريط إحصائيات المقررات المعتمدة بنصوص وأرقام سوداء واضحة تماماً -->
        <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f8fafc; border: 1.5px solid #000000; border-radius: 8px; padding: 6px 16px; margin-bottom: 10px; font-size: 11px; font-weight: 900; color: #000000;">
          <div>إجمالي المواد بالكشف: <span style="color: #000000; font-weight: 900;">${totalCoursesCount} مادة</span></div>
          <div>المواد النظرية والعملية: <span style="color: #000000; font-weight: 900;">${theoryPracticalCount} مادة</span></div>
          <div>المواد النظرية فقط: <span style="color: #000000; font-weight: 900;">${theoryOnlyCount} مادة</span></div>
          <div>إجمالي وحدات بولونيا: <span style="color: #000000; font-weight: 900;">${totalEctsCredits} وحدة معتمدة</span></div>
        </div>

        <!-- 📊 جدول المواد والمقررات الدراسية الاحترافي مع حدود سوداء واضحة -->
        <table style="width: 100%; border-collapse: collapse; border: 2px solid #000000;">
          <thead>
            <tr style="background-color: #0F2942; color: #ffffff; font-size: 11px; font-weight: 900; height: 34px;">
              <th style="border: 1.5px solid #000000; width: 32px; text-align: center; color: #ffffff;">ت</th>
              <th style="border: 1.5px solid #000000; text-align: right; padding: 0 8px; color: #ffffff;">اسم المادة الدراسية</th>
              <th style="border: 1.5px solid #000000; width: 75px; text-align: center; color: #ffffff;">رمز المادة</th>
              <th style="border: 1.5px solid #000000; width: 120px; text-align: center; color: #ffffff;">المرحلة والكورس</th>
              <th style="border: 1.5px solid #000000; width: 95px; text-align: center; color: #ffffff;">نوع المادة</th>
              <th style="border: 1.5px solid #000000; width: 85px; text-align: center; color: #ffffff;">الوحدات</th>
              <th style="border: 1.5px solid #000000; text-align: right; padding: 0 6px; color: #ffffff;">أستاذ النظري</th>
              <th style="border: 1.5px solid #000000; text-align: right; padding: 0 6px; color: #ffffff;">أستاذ العملي</th>
              ${hasAnyFinalExamOpen ? '<th style="border: 1.5px solid #000000; width: 110px; text-align: center; color: #ffffff;">النهائي (الدور الأول)</th>' : ''}
              ${hasAnySupplementaryOpen ? '<th style="border: 1.5px solid #000000; width: 110px; text-align: center; color: #ffffff;">حالة الدور الثاني</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- ✍️ صندوق المصادقات والتواقيع الرسمية الثنائي (المقرر ورئيس القسم فقط بدون العميد وبدون العبارات الفرعية) -->
      <div style="margin-top: 22px; border-top: 2px solid #000000; padding-top: 14px; color: #000000;">
        <div style="display: flex; justify-content: space-around; text-align: center; font-size: 12px; font-weight: 900;">
          <!-- 👤 توقيع مقرر القسم العلمي -->
          <div style="min-width: 220px;">
            <p style="margin: 0; color: #000000; font-size: 12px; font-weight: 900;">مقرر القسم العلمي</p>
            <p style="margin: 6px 0 0; font-weight: 900; font-size: 13px; color: #000000;">${escapeHtml(rapporteurName)}</p>
            <div style="margin: 28px auto 0 auto; border-bottom: 1.5px dotted #000000; width: 180px;"></div>
          </div>

          <!-- 👤 توقيع رئيس القسم العلمي -->
          <div style="min-width: 220px;">
            <p style="margin: 0; color: #000000; font-size: 12px; font-weight: 900;">رئيس القسم العلمي</p>
            <p style="margin: 6px 0 0; font-weight: 900; font-size: 13px; color: #000000;">${escapeHtml(departmentHeadName)}</p>
            <div style="margin: 28px auto 0 auto; border-bottom: 1.5px dotted #000000; width: 180px;"></div>
          </div>
        </div>

        <!-- 🛡️ التذييل الرسمي المعتمد للجامعة بحذف رمز التحقق تماماً -->
        <div style="margin-top: 18px; text-align: center; font-size: 10px; font-weight: 900; border-top: 1.5px solid #000000; padding-top: 6px; color: #000000;">
          <span>جامعة الإمام جعفر الصادق (ع) — فرع ميسان | المنصة الأكاديمية المركزية لنظام مسار بولونيا</span>
        </div>
      </div>

    </div>
  `;

  // 📌 إلحاق الحاوية بالـ DOM بالمتصفح لمعالجتها
  document.body.appendChild(container);

  try {
    // ⏱️ انتظار لحظي لضمان تحميل وتطبيق الخطوط والصور
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 🖼️ تحويل محتوى الـ HTML إلى Canvas عالي الدقة (scale 2)
    const canvas = await html2canvas(container, {
      scale: 2, // 🔍 مقياس دقة مضاعف للحصول على نصوص حادة كالليزر
      useCORS: true, // 🌐 دعم تحميل الصور الخارجية
      logging: false, // 🤫 كتم سجلات الكونسول
      backgroundColor: '#ffffff', // ⚪ خلفية بيضاء نقية
    });

    // 📸 استخراج الصورة بجودة عالية من الكانفاس
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    // 📄 إنشاء ملف PDF جديد بنظام A4 بالعرض Landscape
    const pdf = new jsPDF('l', 'mm', 'a4');
    // 📐 حساب أبعاد صفحة الـ PDF
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // 🖼️ رسم الصورة الممسوحة على مساحة الـ PDF بالكامل
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    // 🏷️ تنظيف وتجهيز اسم الملف الرسمي ليكون معبراً واحترافياً
    const cleanDept = (departmentName || 'القسم').replace(/[/\\?%*:|"<>]/g, '_').trim();
    const cleanStage = stageFilter === 1 ? 'المرحلة_الاولى' : stageFilter === 2 ? 'المرحلة_الثانية' : stageFilter === 3 ? 'المرحلة_الثالثة' : stageFilter === 4 ? 'المرحلة_الرابعة' : 'كافة_المراحل';
    const cleanSem = semesterFilter === 1 ? 'الكورس_الاول' : semesterFilter === 2 ? 'الكورس_الثاني' : 'كافة_الكورسات';
    const finalFileName = `كشف_مقررات_قسم_${cleanDept}_${cleanStage}_${cleanSem}_2026-2027.pdf`;

    // 💾 تنزيل ملف الـ PDF مباشرة على جهاز المستخدم
    pdf.save(finalFileName);

    // 🧹 إزالة الحاوية المؤقتة من جسم الصفحة بعد اكتمال التصدير
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    // 🔓 فك قفل التزامن بعد النجاح
    releaseHeavyTaskLock(lockKey);
    // ✅ إرجاع نجاح العملية
    return true;
  } catch {
    // 🧹 إزالة الحاوية المؤقتة في حالة حدوث أي خطأ
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    // 🔓 فك قفل التزامن عند الفشل
    releaseHeavyTaskLock(lockKey);
    // ❌ إرجاع فشل العملية
    return false;
  }
}









