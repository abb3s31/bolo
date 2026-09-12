'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 📊 مكتبة قراءة وتوليد ملفات Excel احترافياً - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import ExcelJS from 'exceljs'; // 📦 محرك ExcelJS لتوليد الجداول المجدولة الملونة الفاخرة
import * as XLSX from 'xlsx'; // 📦 مكتبة قراءة وتحليل ملفات Excel
import { sanitizeExcelField, isAssessmentItemActive, DEFAULT_THEORY_PRACTICAL_SCHEME, DEFAULT_THEORY_ONLY_SCHEME } from './grade-utils'; // 🛡️ دالة تطهير الصيغ والرموز والمخططات وفحص البنود المفتوحة
import { generateStrongUniqueEmail, generateStrongPassword, INITIAL_PROFILES } from './mock-data'; // 🎲 توليد الحسابات الموحدة
import { formatEnglishDateTime, translateAcademicField, getTranslatedAuditAction, translateAuditDetails } from './date-utils'; // 📅 دوال تنسيق التاريخ وترجمة البنود والتفاصيل الأكاديمية والأمنية
import { AssessmentScheme, AttendanceWarningStatus, CourseType, FinalExamSchedule, FinalExamSlot, StudentTuitionRecord, UserProfile } from '@/types'; // 🔗 استيراد واجهات المخطط وحالة الإنذارات ونوع المادة وجداول الامتحانات والأقساط والملفات الشخصية

// 🎨 📊 دالة مركزية فائقة الجودة لتوليد ملفات Excel ملونة مع تلوين الصف الأول (Header) بالأزرق الكحلي الداكن والخط الأبيض العريض
export async function generateAndDownloadExcel(
  sheets: {
    sheetName: string;
    columns: { header: string; key: string; width?: number }[];
    data: Record<string, string | number>[];
    headerColor?: string; // ARGB مثل FF1E293B
  }[],
  fileName: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'جامعة الإمام جعفر الصادق (ع) - فرع ميسان';
  workbook.created = new Date();

  for (const sheetConfig of sheets) {
    const worksheet = workbook.addWorksheet(sheetConfig.sheetName, {
      views: [{ rightToLeft: true, showGridLines: true }],
    });

    worksheet.columns = sheetConfig.columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 24,
    }));

    // 🎨 1️⃣ تلوين وتنسيق الصف الأول بالكامل (Header Row Styling)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 32;
    const headerBgColor = sheetConfig.headerColor || 'FF1E293B'; // كحلي داكن فاخر

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: headerBgColor },
      };
      cell.font = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' }, // أبيض ناصع
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF334155' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        right: { style: 'thin', color: { argb: 'FF334155' } },
      };
    });

    // 📝 2️⃣ إضافة البيانات وتنسيق الصفوف الداخلية
    sheetConfig.data.forEach((rowValues, rowIndex) => {
      const row = worksheet.addRow(rowValues);
      row.height = 24;
      const isEven = rowIndex % 2 === 1;

      row.eachCell((cell) => {
        cell.font = {
          name: 'Segoe UI',
          size: 10,
          bold: false,
          color: { argb: 'FF0F172A' },
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
        };
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }, // تظليل خفيف جداً وراقي للصفوف الزوجية
          };
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    // 📐 3️⃣ ضبط عرض الأعمدة التلقائي العريض مع حماية هوامش القراءة
    worksheet.columns.forEach((column, idx) => {
      let maxLen = 18;
      const colDef = sheetConfig.columns[idx];
      if (colDef && colDef.header) {
        maxLen = Math.max(maxLen, colDef.header.length + 6);
      }
      sheetConfig.data.forEach((row) => {
        const val = colDef ? row[colDef.key] : '';
        if (val !== undefined && val !== null) {
          maxLen = Math.max(maxLen, String(val).length + 4);
        }
      });
      column.width = Math.max(maxLen, colDef?.width || 20);
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// 📥 دالة إنشاء وتنزيل نموذج Excel احترافي لدرجات الطلاب للأستاذ بدون الرقم الجامعي مع اسم الأستاذ والمرحلة والكورس والتاريخ بالاسم
export async function downloadTeacherGradeTemplate(
  courseName: string, 
  students: { full_name: string; university_number?: string }[],
  scheme?: AssessmentScheme,
  courseType?: CourseType,
  context?: {
    teacherName?: string;
    stage?: number | string;
    semester?: number | string;
    isSupplementaryEnabled?: boolean;
    isFinalExamEnabled?: boolean; // 🎯 خيار تفعيل/حجب عمود الامتحان النهائي الدور الأول
  }
): Promise<void> {
  const todayDate = new Date();
  const dateFormatted = todayDate.toISOString().split('T')[0]; // 📅 صيغة التاريخ الدقيقة (مثل 2026-09-01)
  const todayStr = todayDate.toLocaleDateString('ar-IQ-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });
  const hasPractical = courseType !== 'theory_only' && (!scheme || scheme.practical.max_score > 0);
  const isSupActive = context?.isSupplementaryEnabled === true; // 🔄 افتراضياً مغلق
  const isFinalActive = context?.isFinalExamEnabled === true; // 🎯 القيمة الافتراضية مغلق، ويتغير النموذج حسب القيمة إذا كانت مفتوحة أو مغلقة

  // 🧹 دالة تنظيف الكلمات للاستخدام الآمن في أسماء الملفات
  const cleanForFileName = (text: string): string => {
    return text.replace(/[\\/:*?"<>|]/g, '_').trim();
  };

  const cleanCourse = cleanForFileName(courseName);
  const cleanTeacher = context?.teacherName ? `_${cleanForFileName(context.teacherName)}` : '';
  const stagePart = context?.stage ? `_المرحلة_${context.stage}` : '';
  const semesterPart = context?.semester ? `_الكورس_${context.semester}` : '';
  const finalTag = isFinalActive ? '_مع_النهائي' : '_السعي_فقط'; // 🏷️ وسم حالة الفاينل في اسم الملف
  const supTag = isSupActive ? '_دور_ثاني' : ''; // 🏷️ وسم حالة الدور الثاني في اسم الملف

  // 🎛️ تحديد المخطط التقييمي المعتمد
  const effectiveScheme: AssessmentScheme = scheme || (hasPractical ? DEFAULT_THEORY_PRACTICAL_SCHEME : DEFAULT_THEORY_ONLY_SCHEME);

  // 🔍 فحص حالة كل بند هل هو مفتوح أم مغلق لإخفائه بالكامل من نموذج الإكسل
  const hasQuiz1 = isAssessmentItemActive(effectiveScheme.quiz1);
  const hasQuiz2 = isAssessmentItemActive(effectiveScheme.quiz2);
  const hasAssignment1 = isAssessmentItemActive(effectiveScheme.assignment1);
  const hasAssignment2 = isAssessmentItemActive(effectiveScheme.assignment2);
  const hasReport = isAssessmentItemActive(effectiveScheme.report);
  const hasMidterm = isAssessmentItemActive(effectiveScheme.midterm);
  const hasPracticalActive = hasPractical && isAssessmentItemActive(effectiveScheme.practical);
  const hasFinalActive = isFinalActive && isAssessmentItemActive(effectiveScheme.final_exam);

  const columns: { header: string; key: string; width: number }[] = [
    { header: 'ت', key: 'seq', width: 10 },
    { header: 'اسم الطالب الرباعي', key: 'std_name', width: 36 },
  ];

  if (hasQuiz1) columns.push({ header: `${effectiveScheme.quiz1.title_ar} (${effectiveScheme.quiz1.max_score})`, key: 'q1', width: 18 });
  if (hasQuiz2) columns.push({ header: `${effectiveScheme.quiz2.title_ar} (${effectiveScheme.quiz2.max_score})`, key: 'q2', width: 18 });
  if (hasAssignment1) columns.push({ header: `${effectiveScheme.assignment1.title_ar} (${effectiveScheme.assignment1.max_score})`, key: 'a1', width: 18 });
  if (hasAssignment2) columns.push({ header: `${effectiveScheme.assignment2.title_ar} (${effectiveScheme.assignment2.max_score})`, key: 'a2', width: 18 });
  if (hasReport) columns.push({ header: `${effectiveScheme.report.title_ar} (${effectiveScheme.report.max_score})`, key: 'rep', width: 18 });
  if (hasMidterm) columns.push({ header: `${effectiveScheme.midterm.title_ar} (${effectiveScheme.midterm.max_score})`, key: 'mid', width: 18 });
  if (hasPracticalActive) columns.push({ header: `${effectiveScheme.practical.title_ar} (${effectiveScheme.practical.max_score})`, key: 'prac', width: 18 });
  if (hasFinalActive) columns.push({ header: `${effectiveScheme.final_exam.title_ar} (${effectiveScheme.final_exam.max_score})`, key: 'fin', width: 18 });
  if (isSupActive) columns.push({ header: 'امتحان الدور الثاني (50)', key: 'sup', width: 24 });

  const mappedRows: Record<string, string | number>[] = students.map((std, idx) => {
    const row: Record<string, string | number> = {
      seq: idx + 1,
      std_name: sanitizeExcelField(std.full_name),
    };
    if (hasQuiz1) row.q1 = effectiveScheme.quiz1.max_score * 0.9;
    if (hasQuiz2) row.q2 = effectiveScheme.quiz2.max_score;
    if (hasAssignment1) row.a1 = effectiveScheme.assignment1.max_score * 0.8;
    if (hasAssignment2) row.a2 = effectiveScheme.assignment2.max_score;
    if (hasReport) row.rep = effectiveScheme.report.max_score * 0.95;
    if (hasMidterm) row.mid = effectiveScheme.midterm.max_score * 0.9;
    if (hasPracticalActive) row.prac = effectiveScheme.practical.max_score;
    if (hasFinalActive) row.fin = effectiveScheme.final_exam.max_score * 0.9;
    if (isSupActive) row.sup = '';
    return row;
  });

  const paddedCount = Math.max(50, mappedRows.length);
  const rows: Record<string, string | number>[] = Array.from({ length: paddedCount }, (_, idx) => {
    if (idx < mappedRows.length) {
      return mappedRows[idx]!;
    }
    const i = idx + 1;
    const emptyRow: Record<string, string | number> = {
      seq: i,
      std_name: '',
    };
    if (hasQuiz1) emptyRow.q1 = effectiveScheme.quiz1.max_score * 0.9;
    if (hasQuiz2) emptyRow.q2 = effectiveScheme.quiz2.max_score;
    if (hasAssignment1) emptyRow.a1 = effectiveScheme.assignment1.max_score * 0.8;
    if (hasAssignment2) emptyRow.a2 = effectiveScheme.assignment2.max_score;
    if (hasReport) emptyRow.rep = effectiveScheme.report.max_score * 0.95;
    if (hasMidterm) emptyRow.mid = effectiveScheme.midterm.max_score * 0.9;
    if (hasPracticalActive) emptyRow.prac = effectiveScheme.practical.max_score;
    if (hasFinalActive) emptyRow.fin = effectiveScheme.final_exam.max_score * 0.9;
    if (isSupActive) emptyRow.sup = '';
    return emptyRow;
  });

  await generateAndDownloadExcel(
    [
      {
        sheetName: 'سجل_الدرجات',
        columns,
        data: rows,
        headerColor: 'FF0F2942',
      },
      {
        sheetName: 'تعليمات_رصد_الدرجات',
        columns: [
          { header: 'البند التوجيهي', key: 'item', width: 30 },
          { header: 'الضوابط الأكاديمية لمسار بولونيا', key: 'details', width: 65 },
        ],
        data: [
          { item: 'المؤسسة والجامعة', details: 'جامعة الإمام جعفر الصادق (ع) - فرع ميسان' },
          { item: 'المادة الدراسية', details: courseName },
          ...(context?.teacherName ? [{ item: 'أستاذ المادة', details: context.teacherName }] : []),
          ...(context?.stage ? [{ item: 'المرحلة الدراسية', details: `المرحلة ${context.stage}` }] : []),
          ...(context?.semester ? [{ item: 'الفصل / الكورس', details: `الكورس ${context.semester === 1 || context.semester === '1' ? 'الأول' : 'الثاني'}` }] : []),
          { 
            item: 'حالة الامتحان النهائي (الدور الأول)', 
            details: isFinalActive 
              ? 'مفتوح ومفعل: عمود الامتحان النهائي (من 50) متاح للرصد والتقييم' 
              : 'مغلق ومحجوب: النموذج يقتصر على السعي الفصلي التكويني فقط (من 50)' 
          },
          { 
            item: 'حالة فترة الدور الثاني (الإكمال)', 
            details: isSupActive 
              ? 'مفتوحة ومفعلة: عمود الدور الثاني متاح لرصد درجات المكملين' 
              : 'مغلقة: مقتصر على الدور الأول فقط' 
          },
          { item: 'تاريخ تنزيل النموذج', details: todayStr },
          { item: 'مطابقة الطلاب', details: 'تتم المطابقة تلقائياً بالاسم الرباعي والتسلسل.' },
          { item: 'الحدود القصوى', details: 'يرجى الالتزام بالأوزان المحددة بين القوسين وعدم إدخال درجات أعلى من السقف المحدد.' },
        ],
        headerColor: 'FF1E3A8A',
      }
    ],
    `نموذج_درجات_${cleanCourse}${cleanTeacher}${stagePart}${semesterPart}${finalTag}${supTag}_${dateFormatted}.xlsx`
  );
}

// 📋 📥 دالة تنزيل نموذج Excel احترافي للحضور والغياب الأسبوعي (15 أسبوعاً) بدون الرقم الجامعي مع اسم الأستاذ والمرحلة والكورس والتاريخ بالاسم
export async function downloadTeacherAttendanceTemplate(
  courseName: string,
  students: { full_name: string }[],
  context?: {
    teacherName?: string;
    stage?: number | string;
    semester?: number | string;
  }
): Promise<void> {
  const todayDate = new Date();
  const dateFormatted = todayDate.toISOString().split('T')[0]; // 📅 صيغة التاريخ الدقيقة
  const todayStr = todayDate.toLocaleDateString('ar-IQ-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });

  // 🧹 دالة تنظيف الكلمات للاستخدام الآمن في أسماء الملفات
  const cleanForFileName = (text: string): string => {
    return text.replace(/[\\/:*?"<>|]/g, '_').trim();
  };

  const cleanCourse = cleanForFileName(courseName);
  const cleanTeacher = context?.teacherName ? `_${cleanForFileName(context.teacherName)}` : '';
  const stagePart = context?.stage ? `_المرحلة_${context.stage}` : '';
  const semesterPart = context?.semester ? `_الكورس_${context.semester}` : '';

  const columns = [
    { header: 'ت', key: 'seq', width: 10 },
    { header: 'اسم الطالب الرباعي', key: 'std_name', width: 36 },
  ];

  for (let w = 1; w <= 15; w++) {
    columns.push({ header: `أسبوع ${w} (حاضر / غائب / مجاز)`, key: `week_${w}`, width: 22 });
  }

  const mappedRows: Record<string, string | number>[] = students.map((std, idx) => {
    const row: Record<string, string | number> = {
      seq: idx + 1,
      std_name: sanitizeExcelField(std.full_name),
    };
    for (let w = 1; w <= 15; w++) {
      row[`week_${w}`] = 'حاضر';
    }
    return row;
  });

  const paddedCount = Math.max(50, mappedRows.length);
  const rows: Record<string, string | number>[] = Array.from({ length: paddedCount }, (_, idx) => {
    if (idx < mappedRows.length) {
      return mappedRows[idx]!;
    }
    const i = idx + 1;
    const emptyRow: Record<string, string | number> = {
      seq: i,
      std_name: '',
    };
    for (let w = 1; w <= 15; w++) {
      emptyRow[`week_${w}`] = '';
    }
    return emptyRow;
  });

  await generateAndDownloadExcel(
    [
      {
        sheetName: 'سجل_الحضور_والغياب',
        columns,
        data: rows,
        headerColor: 'FF065F46',
      },
      {
        sheetName: 'تعليمات_الحضور_والغياب',
        columns: [
          { header: 'بند التعليمات', key: 'item', width: 30 },
          { header: 'الضوابط الأكاديمية والغيابات', key: 'details', width: 65 },
        ],
        data: [
          { item: 'المؤسسة والجامعة', details: 'جامعة الإمام جعفر الصادق (ع) - فرع ميسان' },
          { item: 'المادة الدراسية', details: courseName },
          ...(context?.teacherName ? [{ item: 'أستاذ المادة', details: context.teacherName }] : []),
          ...(context?.stage ? [{ item: 'المرحلة الدراسية', details: `المرحلة ${context.stage}` }] : []),
          ...(context?.semester ? [{ item: 'الفصل / الكورس', details: `الكورس ${context.semester === 1 || context.semester === '1' ? 'الأول' : 'الثاني'}` }] : []),
          { item: 'تاريخ التنزيل', details: todayStr },
          { item: 'الخيارات المقبولة في خلايا الأسابيع', details: 'اكتب: (حاضر) أو (غائب) أو (مجاز) أو (م - مجاز بعذر رسمي).' },
          { item: 'نسب الحرمان والإنذار', details: 'يتم احتساب نسبة الغياب تلقائياً (الإنذار الأول 5%، الإنذار النهائي 7%، الحرمان 10%).' },
        ],
        headerColor: 'FF0F2942',
      }
    ],
    `نموذج_حضور_${cleanCourse}${cleanTeacher}${stagePart}${semesterPart}_${dateFormatted}.xlsx`
  );
}

// 📥 دالة تنزيل قالب رفع الطلاب الجماعي لـ الأدمن مع الصف الأول ملون بالأزرق الكحلي والتعليمات
export async function downloadAdminStudentsTemplate(deptName: string = 'جميع الأقسام'): Promise<void> {
  const todayDate = new Date();
  const dateFormatted = todayDate.toISOString().split('T')[0];
  const todayArabic = todayDate.toLocaleDateString('ar-IQ-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });

  const sampleData: Record<string, string | number>[] = [];
  const generatedStudentEmails = new Set<string>();

  for (let i = 1; i <= 50; i++) {
    let stdEmail = '';
    do {
      const rand = Math.floor(1000 + Math.random() * 9000);
      stdEmail = `std.${i}.${rand}@sadiq.edu.iq`;
    } while (generatedStudentEmails.has(stdEmail));
    generatedStudentEmails.add(stdEmail);

    sampleData.push({
      seq: i,
      name: '', // 📝 فارغ ليكتبه المستخدم مباشرة
      dept: deptName === 'جميع الأقسام' ? 'هندسة تقنيات الحاسوب' : deptName,
      stage: ((i - 1) % 4) + 1,
      gender: '',
      uni_num: `2026${Math.floor(10000 + Math.random() * 90000)}`,
      phone: '',
      email: stdEmail,
    });
  }

  const instructionsData: Record<string, string | number>[] = [
    {
      item: 'المؤسسة والجامعة',
      details: 'جامعة الإمام جعفر الصادق (ع) - فرع ميسان | المنصة الأكاديمية المركزية',
    },
    {
      item: 'تاريخ تنزيل النموذج',
      details: todayArabic,
    },
    {
      item: 'المرحلة الدراسية',
      details: 'اكتب رقم المرحلة من 1 إلى 4 حصراً.',
    },
    {
      item: 'البريد الأكاديمي والرقم الجامعي',
      details: 'حقول اختيارية. في حال تركها فارغة، سيقوم النظام تلقائياً بتوليد بريد رسمي فريد ورقم جامعي تلقائي بدون أي تكرار نهائياً.',
    },
    {
      item: 'الجنس',
      details: 'اكتب (ذكر) أو (أنثى)، أو سيقوم النظام بالتعرف الذكي التلقائي من الاسم الثلاثي.',
    },
  ];

  await generateAndDownloadExcel(
    [
      {
        sheetName: 'بيانات_الطلاب',
        columns: [
          { header: 'الرقم', key: 'seq', width: 10 },
          { header: 'الاسم الثلاثي واللقب للطالب', key: 'name', width: 35 },
          { header: 'القسم العلمي التابع له', key: 'dept', width: 30 },
          { header: 'المرحلة الدراسية (1-4)', key: 'stage', width: 22 },
          { header: 'الجنس (ذكر / أنثى)', key: 'gender', width: 20 },
          { header: 'الرقم الجامعي (اختياري)', key: 'uni_num', width: 25 },
          { header: 'رقم الهاتف', key: 'phone', width: 22 },
          { header: 'البريد البديل للإشعارات', key: 'email', width: 30 },
        ],
        data: sampleData,
        headerColor: 'FF1E293B',
      },
      {
        sheetName: 'تعليمات_الاستيراد',
        columns: [
          { header: 'بند التعليمات', key: 'item', width: 32 },
          { header: 'التفاصيل والضوابط', key: 'details', width: 65 },
        ],
        data: instructionsData,
        headerColor: 'FF1E3A8A',
      },
    ],
    `نموذج_استيراد_الطلاب_${dateFormatted}.xlsx`
  );
}

// 🎁 🎲 دالة تنزيل قالب 50 بريد ورمز عشوائي جديد تماماً وغير مكرر نهائياً مع الصف الأول ملون
export async function download50RandomAccountsTemplate(deptName: string = 'جميع الأقسام'): Promise<void> {
  const todayDate = new Date();
  const dateFormatted = todayDate.toISOString().split('T')[0];
  const todayArabic = todayDate.toLocaleDateString('ar-IQ-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });
  const generatedAccounts: Record<string, string | number>[] = [];
  
  for (let i = 1; i <= 50; i++) {
    const uniNum = `2026${Math.floor(10000 + Math.random() * 90000)}`;
    const randomEmail = generateStrongUniqueEmail('st', INITIAL_PROFILES);
    const isFemale = i % 2 === 0;

    generatedAccounts.push({
      org: 'جامعة الإمام جعفر الصادق (ع) - فرع ميسان',
      issue_date: todayArabic,
      dept: deptName,
      seq: i,
      name: isFemale ? `طالبة جديدة ${i}` : `طالب جديد ${i}`,
      gender: isFemale ? 'أنثى' : 'ذكر',
      uni_num: uniNum,
      email: randomEmail,
      stage: (i % 4) + 1,
    });
  }

  await generateAndDownloadExcel(
    [
      {
        sheetName: '50_حساب_عشوائي',
        columns: [
          { header: 'الكلية والمؤسسة', key: 'org', width: 35 },
          { header: 'تاريخ الإصدار', key: 'issue_date', width: 22 },
          { header: 'القسم العلمي', key: 'dept', width: 28 },
          { header: 'تسلسل الحساب', key: 'seq', width: 16 },
          { header: 'الاسم الكامل المقترح', key: 'name', width: 28 },
          { header: 'الجنس', key: 'gender', width: 16 },
          { header: 'الرقم الجامعي المولّد', key: 'uni_num', width: 24 },
          { header: 'البريد الأكاديمي المولّد', key: 'email', width: 32 },
          { header: 'المرحلة الدراسية', key: 'stage', width: 20 },
        ],
        data: generatedAccounts,
        headerColor: 'FF1E293B',
      },
    ],
    `نموذج_50_حساب_طلبة_فريد_${dateFormatted}.xlsx`
  );
}

// 📥 دالة تنزيل قالب رفع الأساتذة الجماعي لـ الأدمن مع الصف الأول ملون بالأزرق الكحلي والتعليمات
export async function downloadAdminTeachersTemplate(departments: { id: string; name: string }[] = []): Promise<void> {
  const todayDate = new Date();
  const dateFormatted = todayDate.toISOString().split('T')[0];
  const todayArabic = todayDate.toLocaleDateString('ar-IQ-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });

  const deptsList = departments.length > 0 ? departments : [
    { id: '1', name: 'هندسة تقنيات الحاسوب' },
    { id: '2', name: 'القانون' },
    { id: '3', name: 'العلوم المالية والمصرفية' },
    { id: '4', name: 'هندسة الحاسوب والبرمجيات' },
    { id: '5', name: 'إدارة الأعمال' },
    { id: '6', name: 'المحاسبة' },
    { id: '7', name: 'الإعلام' },
    { id: '8', name: 'اللغة الانكليزية' },
    { id: '9', name: 'علوم القرآن والتربية الإسلامية' },
    { id: '10', name: 'هندسة تقنيات الأجهزة الطبية' },
    { id: '11', name: 'التربية البدنية وعلوم الرياضة' },
    { id: '12', name: 'التصميم الداخلي والديكور' },
  ];

  const sampleData: Record<string, string | number>[] = [];
  const generatedTeacherEmails = new Set<string>();

  for (let i = 1; i <= 50; i++) {
    const deptObj = deptsList[(i - 1) % deptsList.length];
    let tchEmail = '';
    do {
      const rand = Math.floor(100 + Math.random() * 900);
      tchEmail = `dr.tch.${i}.${rand}@sadiq.edu.iq`;
    } while (generatedTeacherEmails.has(tchEmail));
    generatedTeacherEmails.add(tchEmail);

    sampleData.push({
      seq: i,
      name: '', // 📝 فارغ ليكتبه المستخدم مباشرة
      dept: deptObj ? deptObj.name : 'هندسة تقنيات الحاسوب',
      courses: '',
      gender: '',
      email: tchEmail,
      pass: generateStrongPassword(),
      alt_email: '',
    });
  }

  const instructionsData: Record<string, string | number>[] = [
    {
      item: 'المؤسسة والجامعة',
      details: 'جامعة الإمام جعفر الصادق (ع) - فرع ميسان | المنصة الأكاديمية المركزية',
    },
    {
      item: 'تاريخ تنزيل النموذج',
      details: todayArabic,
    },
    {
      item: 'القسم العلمي التابع له',
      details: 'يرجى كتابة اسم القسم كما هو معتمد في قائمة الأقسام أدناه.',
    },
    {
      item: 'البريد وكلمة المرور',
      details: 'حقول اختيارية. سيقوم النظام تلقائياً بتوليد بريد رسمي فريد ورمز دخول سري معقد غير مكرر.',
    },
    {
      item: 'قائمة الأقسام الرسمية',
      details: deptsList.map((d, i) => `${i + 1}. ${d.name}`).join(' | '),
    },
  ];

  await generateAndDownloadExcel(
    [
      {
        sheetName: 'بيانات_الأساتذة',
        columns: [
          { header: 'الرقم', key: 'seq', width: 10 },
          { header: 'الاسم الثلاثي واللقب الأكاديمي', key: 'name', width: 35 },
          { header: 'القسم العلمي التابع له', key: 'dept', width: 30 },
          { header: 'المواد المخصصة (مفصولة بفاصلة)', key: 'courses', width: 32 },
          { header: 'الجنس (ذكر / أنثى)', key: 'gender', width: 20 },
          { header: 'البريد الأكاديمي (اختياري)', key: 'email', width: 32 },
          { header: 'كلمة المرور (اختياري)', key: 'pass', width: 22 },
          { header: 'بريد التنبيهات البديل', key: 'alt_email', width: 30 },
        ],
        data: sampleData,
        headerColor: 'FF1E293B',
      },
      {
        sheetName: 'تعليمات_الاستيراد_والأقسام',
        columns: [
          { header: 'بند التعليمات', key: 'item', width: 32 },
          { header: 'التفاصيل والضوابط', key: 'details', width: 65 },
        ],
        data: instructionsData,
        headerColor: 'FF1E3A8A',
      },
    ],
    `نموذج_استيراد_الأساتذة_${dateFormatted}.xlsx`
  );
}

// 📥 دالة تنزيل نموذج Excel معتمد لاستيراد كادر تدريسيي قسم محدد مع التعليمات والضوابط وتاريخ التنزيل
export async function downloadDepartmentTeachersTemplate(deptName: string): Promise<void> {
  const todayDate = new Date();
  const dateFormatted = todayDate.toISOString().split('T')[0];
  const todayArabic = todayDate.toLocaleDateString('ar-IQ-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });

  const sampleData: Record<string, string | number>[] = [];
  const generatedTeacherEmails = new Set<string>();

  for (let i = 1; i <= 50; i++) {
    let tchEmail = '';
    do {
      const rand = Math.floor(100 + Math.random() * 900);
      tchEmail = `dr.tch.${i}.${rand}@sadiq.edu.iq`;
    } while (generatedTeacherEmails.has(tchEmail));
    generatedTeacherEmails.add(tchEmail);

    sampleData.push({
      seq: i,
      name: '', // 📝 فارغ ليكتبه المستخدم مباشرة
      dept: deptName,
      gender: '',
      email: tchEmail,
      pass: generateStrongPassword(),
    });
  }

  const instructionsData: Record<string, string | number>[] = [
    {
      item: 'المؤسسة والجامعة',
      details: 'جامعة الإمام جعفر الصادق (ع) - فرع ميسان | المنصة الأكاديمية المركزية',
    },
    {
      item: 'القسم العلمي التابع له',
      details: `قسم ${deptName}`,
    },
    {
      item: 'تاريخ تنزيل النموذج',
      details: todayArabic,
    },
    {
      item: 'حقل اسم الأستاذ واللقب الأكاديمي',
      details: 'يرجى كتابة الاسم الثلاثي واللقب الأكاديمي للأستاذ (مثال: أ.د. كرار جاسم المحمداوي).',
    },
    {
      item: 'الجنس',
      details: 'اكتب (ذكر) أو (أنثى)، أو سيقوم النظام بالتعرف الذكي التلقائي من الاسم الثلاثي.',
    },
    {
      item: 'البريد الأكاديمي وكلمة المرور',
      details: 'حقول اختيارية. تم توليد نماذج معقدة غير مكررة مسبقاً، ويمكنك تعديلها أو تركها ليقوم النظام بتوليدها تلقائياً عند الاستيراد.',
    },
    {
      item: 'شروط كلمة المرور المخصصة',
      details: 'في حال كتابة كلمة مرور مخصصة يجب ألا تقل عن 8 خانات وتحتوي على حرف كبير ورقم ورمز خاص.',
    },
  ];

  await generateAndDownloadExcel(
    [
      {
        sheetName: 'بيانات_الأساتذة',
        columns: [
          { header: 'الرقم', key: 'seq', width: 10 },
          { header: 'اسم الأستاذ واللقب الأكاديمي', key: 'name', width: 35 },
          { header: 'القسم العلمي', key: 'dept', width: 30 },
          { header: 'الجنس (ذكر / أنثى)', key: 'gender', width: 20 },
          { header: 'البريد الأكاديمي (اختياري)', key: 'email', width: 32 },
          { header: 'كلمة المرور (اختياري)', key: 'pass', width: 22 },
        ],
        data: sampleData,
        headerColor: 'FF1E293B',
      },
      {
        sheetName: 'تعليمات_الاستيراد',
        columns: [
          { header: 'بند التعليمات', key: 'item', width: 32 },
          { header: 'التفاصيل والضوابط', key: 'details', width: 65 },
        ],
        data: instructionsData,
        headerColor: 'FF1E3A8A',
      },
    ],
    `نموذج_استيراد_أساتذة_قسم_${deptName.replace(/\s+/g, '_')}_${dateFormatted}.xlsx`
  );
}

// 📥 دالة تنزيل نموذج Excel معتمد لاستيراد طلبة قسم محدد مع التعليمات والضوابط والمراحل الدراسية
export async function downloadDepartmentStudentsTemplate(deptName: string): Promise<void> {
  const todayDate = new Date();
  const dateFormatted = todayDate.toISOString().split('T')[0];
  const todayArabic = todayDate.toLocaleDateString('ar-IQ-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });

  const sampleData: Record<string, string | number>[] = [];
  const generatedStudentEmails = new Set<string>();

  for (let i = 1; i <= 50; i++) {
    let stdEmail = '';
    do {
      const rand = Math.floor(1000 + Math.random() * 9000);
      stdEmail = `std.${i}.${rand}@sadiq.edu.iq`;
    } while (generatedStudentEmails.has(stdEmail));
    generatedStudentEmails.add(stdEmail);

    sampleData.push({
      seq: i,
      name: '', // 📝 فارغ ليكتبه المستخدم
      dept: deptName,
      stage: ((i - 1) % 4) + 1, // تدرج المراحل من 1 إلى 4
      group: '', // 👥 الكروب أو الشعبة الدراسية (اختياري، مثل: A أو B أو فارغ للشعبة العامة)
      study_type: i % 4 === 0 ? 'مسائي' : 'صباحي', // ☀️🌙 نوع الدراسة الافتراضي
      gender: '',
      email: stdEmail,
      pass: generateStrongPassword(),
    });
  }

  const instructionsData: Record<string, string | number>[] = [
    {
      item: 'المؤسسة والجامعة',
      details: 'جامعة الإمام جعفر الصادق (ع) - فرع ميسان | المنصة الأكاديمية المركزية',
    },
    {
      item: 'القسم العلمي التابع له',
      details: `قسم ${deptName}`,
    },
    {
      item: 'تاريخ تنزيل النموذج',
      details: todayArabic,
    },
    {
      item: 'حقل اسم الطالب',
      details: 'يرجى كتابة الاسم الثلاثي أو الرباعي للطالب/ـة (مثال: حيدر مهدي صادق الموسوي).',
    },
    {
      item: 'المرحلة الدراسية',
      details: 'اكتب رقم المرحلة من (1) إلى (4).',
    },
    {
      item: 'الكروب أو الشعبة الدراسية (اختياري)',
      details: 'حقل اختياري. اكتب اسم الكروب للمرحلة مثل (A أو B أو C أو D)، أو اتركه فارغاً ليكون الطالب ضمن الشعبة العامة الموحدة.',
    },
    {
      item: 'الفترة الدراسية (صباحي / مسائي)',
      details: 'اكتب (صباحي) أو (مسائي). في حال ترك الحقل فارغاً سيعتمده النظام كـ (صباحي) تلقائياً.',
    },
    {
      item: 'الجنس',
      details: 'اكتب (ذكر) أو (أنثى)، أو سيقوم النظام بالتعرف الذكي التلقائي من الاسم الثلاثي.',
    },
    {
      item: 'البريد الأكاديمي وكلمة المرور',
      details: 'حقول اختيارية. تم توليد نماذج معقدة غير مكررة مسبقاً، ويمكنك تعديلها أو تركها ليقوم النظام بتوليدها تلقائياً عند الاستيراد.',
    },
    {
      item: 'شروط كلمة المرور المخصصة',
      details: 'في حال كتابة كلمة مرور مخصصة يجب ألا تقل عن 8 خانات وتحتوي على حرف كبير ورقم ورمز خاص.',
    },
  ];

  await generateAndDownloadExcel(
    [
      {
        sheetName: 'بيانات_الطلبة',
        columns: [
          { header: 'الرقم', key: 'seq', width: 10 },
          { header: 'اسم الطالب الثلاثي / الرباعي', key: 'name', width: 35 },
          { header: 'القسم العلمي', key: 'dept', width: 30 },
          { header: 'المرحلة الدراسية (1-4)', key: 'stage', width: 22 },
          { header: 'الكروب / الشعبة (A, B, C... اختياري)', key: 'group', width: 26 },
          { header: 'الفترة الدراسية (صباحي / مسائي)', key: 'study_type', width: 26 },
          { header: 'الجنس (ذكر / أنثى)', key: 'gender', width: 20 },
          { header: 'البريد الأكاديمي (اختياري)', key: 'email', width: 32 },
          { header: 'كلمة المرور (اختياري)', key: 'pass', width: 22 },
        ],
        data: sampleData,
        headerColor: 'FF1E293B',
      },
      {
        sheetName: 'تعليمات_الاستيراد',
        columns: [
          { header: 'بند التعليمات', key: 'item', width: 32 },
          { header: 'التفاصيل والضوابط', key: 'details', width: 65 },
        ],
        data: instructionsData,
        headerColor: 'FF1E3A8A',
      },
    ],
    `نموذج_استيراد_طلبة_قسم_${deptName.replace(/\s+/g, '_')}_${dateFormatted}.xlsx`
  );
}

// 📥 دالة تنزيل نموذج Excel معتمد لاستيراد المواد والمقررات الدراسية لقسم محدد
export async function downloadDepartmentCoursesTemplate(
  deptName: string,
  teachersList: { id: string; full_name: string }[] = [],
  context?: {
    isFinalExamEnabled?: boolean;
    isSupplementaryEnabled?: boolean;
    semester?: number | 'all';
  }
): Promise<void> {
  const todayDate = new Date();
  const dateFormatted = todayDate.toISOString().split('T')[0];
  const todayArabic = todayDate.toLocaleDateString('ar-IQ-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });
  const isFinalActive = context?.isFinalExamEnabled === true; // 🎯 الافتراضي مغلق
  const isSupActive = context?.isSupplementaryEnabled === true; // 🔄 الافتراضي مغلق

  // 📝 مصفوفة نماذج بيانات مواد تجريبية لتسهيل التعبئة على المستخدم
  const sampleData: Record<string, string | number>[] = []; // 📋 تهيئة مصفوفة البيانات التجريبية

  // 🛠️ دالة مساعدة لبناء الصف التجريبي وفق الأدوار النشطة فقط
  const buildCourseRow = (
    seq: number, // 🔢 رقم التسلسل
    name: string, // 📘 اسم المادة
    code: string, // 🏷️ رمز المادة
    stage: number, // 🎓 المرحلة
    semester: number, // 🗓️ الكورس
    courseType: string, // 🔬 نوع المادة
    credits: number, // ⏱️ الساعات
    theoryTeacher: string, // 👨‍🏫 أستاذ النظري
    practicalTeacher: string // 🧪 أستاذ العملي
  ): Record<string, string | number> => {
    const rowObj: Record<string, string | number> = {
      seq: seq, // 🔢 تسلسل الصف
      name: name, // 📘 اسم المادة
      code: code, // 🏷️ رمز المادة
      stage: stage, // 🎓 رقم المرحلة
      semester: semester, // 🗓️ الكورس
      course_type: courseType, // 🔬 نوع وتوصيف المادة
      credits: credits, // ⏱️ عدد ساعات بولونيا
      theory_teacher: theoryTeacher, // 👨‍🏫 اسم أستاذ النظري
      practical_teacher: practicalTeacher, // 🧪 اسم أستاذ العملي
    }; // 📦 بناء الكائن الأساسي

    // 🎯 إضافة حقل الفاينل بالصف حصراً إذا كان دور الفاينل مفعلاً ومفتوحاً بالقسم
    if (isFinalActive) {
      rowObj.is_final = 'مفعل'; // 🔓 تثبيت حالة التفعيل للامتحان النهائي
    }

    // 🔄 إضافة حقل الدور الثاني بالصف حصراً إذا كان دور الإكمال مفعلاً ومفتوحاً بالقسم
    if (isSupActive) {
      rowObj.is_sup = 'مفعل'; // 🔄 تثبيت حالة التفعيل للدور الثاني
    }

    return rowObj; // ↩️ إرجاع الصف المكتمل
  };

  // 📝 إضافة 5 مواد تجريبية واقعية لتوضيح طريقة الملء
  sampleData.push(
    buildCourseRow(1, 'مقدمة في التخصص والمهارات الأكاديمية', 'CS101', 1, 1, 'نظري فقط', 3, teachersList.length > 0 ? teachersList[0].full_name : '', ''), // 1️⃣ مادة أولى
    buildCourseRow(2, 'أساسيات البرمجة والتراكيب المنطقية', 'CS102', 1, 1, 'نظري وعملي', 5, teachersList.length > 0 ? teachersList[0].full_name : '', teachersList.length > 1 ? teachersList[1].full_name : (teachersList[0]?.full_name || '')), // 2️⃣ مادة ثانية
    buildCourseRow(3, 'اللغة الإنجليزية التخصصية 1', 'ENG101', 1, 1, 'نظري فقط', 2, '', ''), // 3️⃣ مادة ثالثة
    buildCourseRow(4, 'الرياضيات المتقطعة والجبر الخطي', 'MTH101', 1, 2, 'نظري فقط', 4, '', ''), // 4️⃣ مادة رابعة
    buildCourseRow(5, 'البرمجة كائنية التوجه (OOP)', 'CS201', 2, 1, 'نظري وعملي', 5, '', '') // 5️⃣ مادة خامسة
  );

  // 📜 صفوف إضافية فارغة جاهزة للإدخال المباشر تتطابق مع الحقول النشطة
  for (let i = 6; i <= 30; i++) {
    const emptyRow = buildCourseRow(
      i, // 🔢 الرقم التسلسلي
      '', // 📘 اسم المادة فارغ
      '', // 🏷️ الرمز فارغ
      Math.min(4, Math.floor((i - 1) / 8) + 1), // 🎓 المرحلة
      ((i - 1) % 2) + 1, // 🗓️ الكورس
      'نظري وعملي', // 🔬 النوع الافتراضي
      3, // ⏱️ الساعات الافتراضية
      '', // 👨‍🏫 النظري فارغ
      '' // 🧪 العملي فارغ
    );
    sampleData.push(emptyRow); // 📥 إضافة الصف الفارغ للمصفوفة
  }

  // 📋 تجهيز بنود ورقة تعليمات الاستيراد الأساسية
  const instructionsData: Record<string, string | number>[] = [
    {
      item: 'المؤسسة والجامعة', // 🏛️ البند
      details: 'جامعة الإمام جعفر الصادق (ع) - فرع ميسان | المنصة الأكاديمية المركزية', // 📝 الشرح
    },
    {
      item: 'القسم العلمي التابع له', // 🏢 القسم
      details: `قسم ${deptName}`, // 🏷️ اسم القسم
    },
    {
      item: 'تاريخ تنزيل النموذج', // 📅 التاريخ
      details: todayArabic, // 📆 التاريخ باللغة العربية
    },
    {
      item: 'اسم المادة الدراسية *', // 📘 اسم المادة
      details: 'حقل إلزامي. اكتب اسم المادة الرسمي بالعربية (مثال: البرمجة الكينونية، حقوق الإنسان).', // ⚠️ التوضيح
    },
    {
      item: 'رمز المادة (الكود)', // 🏷️ الكود
      details: 'حقل اختياري. يمكنك كتابة الكود (مثال: CS201) أو تركه فارغاً ليولده النظام تلقائياً.', // 💡 التوضيح
    },
    {
      item: 'المرحلة الدراسية *', // 🎓 المرحلة
      details: 'اكتب رقم المرحلة من (1) إلى (4).', // 🔢 التوضيح
    },
    {
      item: 'الكورس الدراسي *', // 🗓️ تعديل مسمى الكورس الدراسي وحذف كلمة الفصل
      details: 'اكتب رقم (1) للكورس الأول أو (2) للكورس الثاني.', // 🎯 توضيح الكورس الأول أو الثاني
    },
    {
      item: 'نوع وتوصيف المادة *', // 🔬 النوع
      details: 'اكتب (نظري وعملي) إذا كانت المادة تشمل مختبر، أو (نظري فقط) إذا كانت بدون عملي.', // 🧪 التوضيح
    },
    {
      item: 'الساعات والوحدات المعتمدة (ECTS) *', // ⏱️ الساعات
      details: 'اكتب عدد الساعات المعتمدة في مسار بولونيا من 1 إلى 15 (الافتراضي: 3 ECTS).', // 📊 التوضيح
    },
    {
      item: 'أستاذ النظري وأستاذ العملي', // 👨‍🏫 الأساتذة
      details: 'حقول اختيارية. يمكنك كتابة الاسم المطابق للأستاذ من ورقة (قائمة_أساتذة_القسم) ليتم تكليفه تلقائياً.', // 👤 التوضيح
    },
  ];

  // 🎯 تضمين توضيح الفاينل بالتعليمات فقط وفقط إذا كان الامتحان النهائي مفعلاً ومفتوحاً بالقسم
  if (isFinalActive) {
    instructionsData.push({
      item: 'حالة الامتحان النهائي (الدور الأول)', // 🎯 بند النهائي
      details: 'مفعل ومفتوح حالياً في القسم: يمكنك كتابة (مفعل) أو (مغلق). الافتراضي: مفعل.', // 🔓 شرح التفعيل
    });
  }

  // 🔄 تضمين توضيح الدور الثاني بالتعليمات فقط وفقط إذا كانت فترة الدور الثاني مفعلة ومفتوحة بالقسم
  if (isSupActive) {
    instructionsData.push({
      item: 'حالة فترة الدور الثاني (الإكمال)', // 🔄 بند الدور الثاني
      details: 'مفعلة ومفتوحة حالياً في القسم: يمكنك كتابة (مفعل) أو (مغلق). الافتراضي: مفعل.', // 🔄 شرح التفعيل
    });
  }

  // 📊 تجهيز أعمدة جدول المواد بالنموذج مع استبعاد تام للأدوار المغلقة
  const coursesColumns = [
    { header: 'الرقم', key: 'seq', width: 10 }, // 🔢 عمود الرقم
    { header: 'اسم المادة الدراسية بالعربية *', key: 'name', width: 35 }, // 📘 عمود الاسم
    { header: 'رمز المادة (الكود)', key: 'code', width: 18 }, // 🏷️ عمود الرمز
    { header: 'المرحلة الدراسية (1-4) *', key: 'stage', width: 22 }, // 🎓 عمود المرحلة
    { header: 'الكورس (1 أو 2) *', key: 'semester', width: 18 }, // 🗓️ عمود الكورس الدراسي
    { header: 'نوع المادة (نظري وعملي / نظري فقط) *', key: 'course_type', width: 32 }, // 🔬 عمود النوع
    { header: 'الساعات المعتمدة ECTS *', key: 'credits', width: 22 }, // ⏱️ عمود الوحدات
    { header: 'أستاذ النظري (اختياري)', key: 'theory_teacher', width: 30 }, // 👨‍🏫 عمود النظري
    { header: 'أستاذ العملي (اختياري)', key: 'practical_teacher', width: 30 }, // 🧪 عمود العملي
  ];

  // 🎯 إضافة عمود النهائي بالنموذج حصراً عند كونه متاحاً ومفتوحاً في القسم
  if (isFinalActive) {
    coursesColumns.push({ header: 'الامتحان النهائي (مفعل / مغلق)', key: 'is_final', width: 26 }); // 🔓 عمود الفاينل
  }

  // 🔄 إضافة عمود الدور الثاني بالنموذج حصراً عند كونه متاحاً ومفتوحاً في القسم
  if (isSupActive) {
    coursesColumns.push({ header: 'الدور الثاني (مفعل / مغلق)', key: 'is_sup', width: 26 }); // 🔄 عمود الدور الثاني
  }

  const sheetsToExport = [
    {
      sheetName: 'بيانات_المواد', // 📊 اسم ورقة المواد
      columns: coursesColumns, // 📋 الأعمدة المجهزة ديناميكياً
      data: sampleData, // 📦 البيانات التجريبية المتوافقة
      headerColor: 'FF0F2942', // 🎨 لون الترويسة كحلي ملكي
    },
    {
      sheetName: 'تعليمات_الاستيراد', // ℹ️ اسم ورقة التعليمات
      columns: [
        { header: 'بند التعليمات', key: 'item', width: 32 }, // 📌 عمود البند
        { header: 'التفاصيل والضوابط الأكاديمية', key: 'details', width: 68 }, // 📜 عمود التفاصيل
      ],
      data: instructionsData, // 📋 بيانات التعليمات المتوافقة
      headerColor: 'FF1E3A8A', // 🎨 لون أزرق رسمي
    },
  ];

  // 📋 إذا وجد أساتذة في القسم نضيف ورقة بأسماء الأساتذة لتسهيل النسخ واللصق
  if (teachersList.length > 0) {
    sheetsToExport.push({
      sheetName: 'قائمة_أساتذة_القسم',
      columns: [
        { header: 'ت', key: 'seq', width: 8 },
        { header: 'اسم الأستاذ المعتمد في القسم', key: 'name', width: 35 },
      ],
      data: teachersList.map((t, idx) => ({ seq: idx + 1, name: t.full_name })),
      headerColor: 'FF065F46',
    });
  }

  await generateAndDownloadExcel(
    sheetsToExport,
    `نموذج_استيراد_مواد_قسم_${deptName.replace(/\s+/g, '_')}_${dateFormatted}.xlsx`
  );
}

// 📥 دالة تنزيل قالب Excel عام للمقررات والمناهج الدراسية لكافة أقسام الجامعة
export async function downloadGeneralCoursesTemplate(
  departments: { id: string; name: string }[]
): Promise<void> {
  const todayDate = new Date();
  const dateFormatted = todayDate.toISOString().split('T')[0];
  const todayArabic = todayDate.toLocaleDateString('ar-IQ-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });

  const deptsList = departments.length > 0 ? departments : [
    { id: '1', name: 'هندسة تقنيات الحاسوب' },
    { id: '2', name: 'القانون' },
    { id: '3', name: 'العلوم المالية والمصرفية' },
    { id: '4', name: 'هندسة الحاسوب والبرمجيات' },
    { id: '5', name: 'إدارة الأعمال' },
  ];

  const defaultDeptName = deptsList[0]?.name || 'هندسة تقنيات الحاسوب';

  const sampleData: Record<string, string | number>[] = [
    {
      seq: 1,
      name: 'مقدمة في التخصص والمهارات الأكاديمية',
      code: 'CS101',
      department: defaultDeptName,
      stage: 1,
      semester: 1,
      course_type: 'نظري فقط',
      credits: 3,
    },
    {
      seq: 2,
      name: 'أساسيات البرمجة والتراكيب المنطقية',
      code: 'CS102',
      department: defaultDeptName,
      stage: 1,
      semester: 1,
      course_type: 'نظري وعملي',
      credits: 5,
    },
    {
      seq: 3,
      name: 'اللغة الإنجليزية التخصصية 1',
      code: 'ENG101',
      department: defaultDeptName,
      stage: 1,
      semester: 1,
      course_type: 'نظري فقط',
      credits: 2,
    },
    {
      seq: 4,
      name: 'الرياضيات المتقطعة والجبر الخطي',
      code: 'MTH101',
      department: defaultDeptName,
      stage: 1,
      semester: 2,
      course_type: 'نظري فقط',
      credits: 4,
    },
    {
      seq: 5,
      name: 'البرمجة كائنية التوجه (OOP)',
      code: 'CS201',
      department: defaultDeptName,
      stage: 2,
      semester: 1,
      course_type: 'نظري وعملي',
      credits: 5,
    },
  ];

  for (let i = 6; i <= 30; i++) {
    sampleData.push({
      seq: i,
      name: '',
      code: '',
      department: deptsList[(i - 1) % deptsList.length]?.name || defaultDeptName,
      stage: Math.min(4, Math.floor((i - 1) / 8) + 1),
      semester: ((i - 1) % 2) + 1,
      course_type: 'نظري وعملي',
      credits: 3,
    });
  }

  const instructionsData: Record<string, string | number>[] = [
    {
      item: 'المؤسسة والجامعة',
      details: 'جامعة الإمام جعفر الصادق (ع) - فرع ميسان | المنصة الأكاديمية المركزية',
    },
    {
      item: 'تاريخ تنزيل النموذج',
      details: todayArabic,
    },
    {
      item: 'اسم المادة الدراسية بالعربية *',
      details: 'حقل إلزامي. اكتب اسم المادة الرسمي بالعربية.',
    },
    {
      item: 'القسم العلمي التابع له *',
      details: 'حقل إلزامي. اختر أو اكتب اسم القسم العلمي المطابق من ورقة (قائمة_الأقسام_المعتمدة).',
    },
    {
      item: 'رمز المادة (الكود)',
      details: 'حقل اختياري. يمكنك كتابة الكود (مثال: CS201) أو تركه فارغاً ليولده النظام تلقائياً.',
    },
    {
      item: 'المرحلة الدراسية *',
      details: 'اكتب رقم المرحلة من (1) إلى (4).',
    },
    {
      item: 'الكورس الدراسي *', // 🗓️ تعديل مسمى الكورس الدراسي وحذف كلمة الفصل
      details: 'اكتب رقم (1) للكورس الأول أو (2) للكورس الثاني.', // 🎯 توضيح الكورس الأول أو الثاني
    },
    {
      item: 'نوع وتوصيف المادة *',
      details: 'اكتب (نظري وعملي) إذا كانت المادة تشمل مختبر، أو (نظري فقط) إذا كانت بدون عملي.',
    },
    {
      item: 'الساعات والوحدات المعتمدة (ECTS) *',
      details: 'اكتب عدد الساعات المعتمدة في مسار بولونيا من 1 إلى 15 (الافتراضي: 3 ECTS).',
    },
  ];

  const sheetsToExport = [
    {
      sheetName: 'بيانات_المواد',
      columns: [
        { header: 'الرقم', key: 'seq', width: 10 },
        { header: 'اسم المادة الدراسية بالعربية *', key: 'name', width: 35 },
        { header: 'القسم العلمي التابع له *', key: 'department', width: 30 },
        { header: 'رمز المادة (الكود)', key: 'code', width: 18 },
        { header: 'المرحلة الدراسية (1-4) *', key: 'stage', width: 22 },
        { header: 'الكورس (1 أو 2) *', key: 'semester', width: 18 }, // 📊 تعديل رأس العمود بنموذج إكسل ليكون الكورس بدلاً من الفصل
        { header: 'نوع المادة (نظري وعملي / نظري فقط) *', key: 'course_type', width: 32 },
        { header: 'الساعات المعتمدة ECTS *', key: 'credits', width: 22 },
      ],
      data: sampleData,
      headerColor: 'FF0F2942',
    },
    {
      sheetName: 'تعليمات_الاستيراد',
      columns: [
        { header: 'بند التعليمات', key: 'item', width: 32 },
        { header: 'التفاصيل والضوابط الأكاديمية', key: 'details', width: 68 },
      ],
      data: instructionsData,
      headerColor: 'FF1E3A8A',
    },
    {
      sheetName: 'قائمة_الأقسام_المعتمدة',
      columns: [
        { header: 'ت', key: 'seq', width: 8 },
        { header: 'اسم القسم العلمي المعتمد في الجامعة', key: 'name', width: 38 },
      ],
      data: deptsList.map((d, idx) => ({ seq: idx + 1, name: d.name })),
      headerColor: 'FF065F46',
    },
  ];

  await generateAndDownloadExcel(
    sheetsToExport,
    `نموذج_استيراد_مقررات_الجامعة_${dateFormatted}.xlsx`
  );
}

// 🏛️ قائمة الأقسام الرسمية الـ 12 المعتمدة في كلية ميسان
export const OFFICIAL_COLLEGE_DEPARTMENTS = [
  { name: 'هندسة الحاسوب', prefix: 'cce', code: 'CCE' },
  { name: 'هندسة تقنيات الحاسوب', prefix: 'cte', code: 'CTE' },
  { name: 'هندسة ميكانيك القوى', prefix: 'pme', code: 'PME' },
  { name: 'تقنيات التجميل والليزر', prefix: 'clt', code: 'CLT' },
  { name: 'تقنيات المختبرات الطبية', prefix: 'mlt', code: 'MLT' },
  { name: 'المحاسبة', prefix: 'acc', code: 'ACC' },
  { name: 'إدارة الأعمال', prefix: 'bus', code: 'BUS' },
  { name: 'اقتصاديات نفط وغاز', prefix: 'pge', code: 'PGE' },
  { name: 'علوم القرأن', prefix: 'qur', code: 'QUR' },
  { name: 'اللغة الانكليزية', prefix: 'eng', code: 'ENG' },
  { name: 'القانون', prefix: 'law', code: 'LAW' },
  { name: 'التربية الفنية', prefix: 'art', code: 'ART' },
];

// 📥 دالة تنزيل قالب Excel احترافي لاستيراد رؤساء الأقسام والمقررين مع الصف الأول ملون بالأزرق الكحلي الفاخر وتضمين الأقسام الـ 12
export async function downloadDepartmentHeadsTemplate(departments: { id: string; name: string }[]): Promise<void> {
  const todayDate = new Date();
  const dateFormatted = todayDate.toISOString().split('T')[0];
  const todayArabic = todayDate.toLocaleDateString('ar-IQ-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });

  const getDeptPrefix = (deptName: string) => {
    if (deptName.includes('تقنيات الحاسوب')) return 'cte';
    if (deptName.includes('هندسة الحاسوب')) return 'cce';
    if (deptName.includes('ميكانيك')) return 'pme';
    if (deptName.includes('التجميل') || deptName.includes('الليزر')) return 'clt';
    if (deptName.includes('المختبرات') || deptName.includes('الطبية')) return 'mlt';
    if (deptName.includes('المحاسبة')) return 'acc';
    if (deptName.includes('الأعمال')) return 'bus';
    if (deptName.includes('نفط') || deptName.includes('غاز')) return 'pge';
    if (deptName.includes('القرأن') || deptName.includes('القرآن')) return 'qur';
    if (deptName.includes('الانكليزية') || deptName.includes('الإنجليزية')) return 'eng';
    if (deptName.includes('القانون')) return 'law';
    if (deptName.includes('التربية الفنية') || deptName.includes('الفنية')) return 'art';
    return 'dept';
  };

  // 🏛️ بناء قائمة الأقسام المعتمدة التي تبدأ دائماً بالأقسام الـ 12 الرسمية
  const deptsList: { name: string; prefix: string; code?: string }[] = OFFICIAL_COLLEGE_DEPARTMENTS.map(d => ({
    name: d.name,
    prefix: d.prefix,
    code: d.code,
  }));

  // إضافة أي أقسام إضافية مسجلة بالنظام إذا كانت غير موجودة في الـ 12
  departments.forEach(dept => {
    if (dept.name && !deptsList.some(d => d.name.trim() === dept.name.trim())) {
      deptsList.push({
        name: dept.name.trim(),
        prefix: getDeptPrefix(dept.name),
      });
    }
  });

  // 🎲 توليد بريد ورمز عشوائي معقد فريد 100% لكل منصب (رئيس ومقرر) في كافة الأقسام الـ 12
  const generatedEmails = new Set<string>();
  const sampleData: Record<string, string | number>[] = [];
  let seq = 1;

  for (const dept of deptsList) {
    const prefix = dept.prefix || getDeptPrefix(dept.name);

    // 1️⃣ منصب رئيس قسم
    let headEmail = '';
    do {
      const rand = Math.floor(100 + Math.random() * 900);
      headEmail = `head.${prefix}.${seq}.${rand}@sadiq.edu.iq`;
    } while (generatedEmails.has(headEmail));
    generatedEmails.add(headEmail);

    sampleData.push({
      seq: seq++,
      name: '', // 📝 فارغ تماماً ليكتبه المستخدم مباشرة
      role: 'رئيس قسم',
      dept: dept.name,
      email: headEmail,
      pass: generateStrongPassword(),
      gender: '',
    });

    // 2️⃣ منصب مقرر قسم
    let rapEmail = '';
    do {
      const rand = Math.floor(100 + Math.random() * 900);
      rapEmail = `rap.${prefix}.${seq}.${rand}@sadiq.edu.iq`;
    } while (generatedEmails.has(rapEmail));
    generatedEmails.add(rapEmail);

    sampleData.push({
      seq: seq++,
      name: '', // 📝 فارغ تماماً ليكتبه المستخدم مباشرة
      role: 'مقرر قسم',
      dept: dept.name,
      email: rapEmail,
      pass: generateStrongPassword(),
      gender: '',
    });
  }

  // 📜 صفحة التعليمات وقائمة الأقسام الرسمية
  const instructionsData: Record<string, string | number>[] = [
    {
      item: 'المؤسسة الأكاديمية',
      details: 'جامعة الإمام جعفر الصادق (ع) - فرع ميسان | المنصة الأكاديمية المركزية',
    },
    {
      item: 'تاريخ تنزيل النموذج',
      details: todayArabic,
    },
    {
      item: 'عدد الأقسام المعتمدة بالنموذج',
      details: `${deptsList.length} قسماً علمياً (لكل قسم رئيس ومقرر بإجمالي ${sampleData.length} حساباً قيادياً)`,
    },
    {
      item: 'حقل الاسم الثلاثي واللقب',
      details: 'يرجى كتابة الاسم الثلاثي واللقب الأكاديمي لكل رئيس قسم ومقرر في العمود المخصص.',
    },
    {
      item: 'الموقع الإداري المسموح',
      details: 'يجب كتابة إما (رئيس قسم) أو (مقرر قسم) حصراً في عمود الموقع الإداري.',
    },
    {
      item: 'القسم العلمي التابع له',
      details: 'يرجى نسخ اسم القسم كما هو معتمد في قائمة الأقسام أدناه لتجنب عدم التطابق.',
    },
    {
      item: 'البريد الأكاديمي وكلمة المرور',
      details: 'تم توليد بريد أكاديمي وكلمة مرور معقدة فريدة عشوائياً لكل منصب بدون تكرار، ويمكنك تعديلها إذا رغبت.',
    },
    {
      item: 'الجنس',
      details: 'اكتب (ذكر) أو (أنثى)، أو سيقوم النظام بالتعرف الذكي التلقائي من الاسم الثلاثي.',
    },
    {
      item: 'قائمة الأقسام الرسمية الـ 12 المعتمدة',
      details: OFFICIAL_COLLEGE_DEPARTMENTS.map((d, i) => `${i + 1}. ${d.name} (${d.code})`).join(' | '),
    },
  ];

  // إضافة تفاصيل كل قسم من الأقسام الـ 12 في ورقة التعليمات
  deptsList.forEach((d, i) => {
    instructionsData.push({
      item: `القسم الأكاديمي ${i + 1}: ${d.name}`,
      details: `الرمز الأكاديمي: ${d.code || 'DEPT'} | بادئة البريد الرسمي: ${d.prefix}`,
    });
  });

  await generateAndDownloadExcel(
    [
      {
        sheetName: 'بيانات_القيادات',
        columns: [
          { header: 'الرقم', key: 'seq', width: 10 },
          { header: 'الاسم الثلاثي واللقب الأكاديمي', key: 'name', width: 35 },
          { header: 'الموقع الإداري', key: 'role', width: 22 },
          { header: 'القسم العلمي التابع له', key: 'dept', width: 32 },
          { header: 'البريد الأكاديمي (اختياري)', key: 'email', width: 32 },
          { header: 'كلمة المرور (اختياري)', key: 'pass', width: 22 },
          { header: 'الجنس (ذكر / أنثى)', key: 'gender', width: 20 },
        ],
        data: sampleData,
        headerColor: 'FF1E293B', // 🎨 لون كحلي داكن ملكي فاخر للصف الأول
      },
      {
        sheetName: 'تعليمات_الاستيراد_والأقسام',
        columns: [
          { header: 'بند التعليمات', key: 'item', width: 32 },
          { header: 'التفاصيل والضوابط', key: 'details', width: 65 },
        ],
        data: instructionsData,
        headerColor: 'FF1E3A8A', // 🎨 لون أزرق ملكي أكاديمي لصفحة التعليمات
      },
    ],
    `نموذج_استيراد_رؤساء_الأقسام_والمقررين_${dateFormatted}.xlsx`
  );
}

// 📂 دالة قراءة وتحليل ملف Excel المرفوع بأمان مع التطهير ضد حقن الصيغ
export async function parseExcelFile(file: File): Promise<Record<string, string | number>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawData = XLSX.utils.sheet_to_json<Record<string, string | number>>(worksheet);

  const sanitizedData: Record<string, string | number>[] = rawData.map((row) => {
    const cleanRow: Record<string, string | number> = {};
    for (const key of Object.keys(row)) {
      const val = row[key];
      cleanRow[key] = typeof val === 'number' ? val : sanitizeExcelField(val);
    }
    return cleanRow;
  });

  return sanitizedData;
}

// 📤 دالة تصدير كادر أساتذة القسم إلى Excel مع البريد الأكاديمي والرمز السري المعتمد
export async function exportCustomTeachersList(teachers: { full_name: string; gender?: string; generated_email: string; temp_password?: string }[], deptName: string): Promise<void> {
  // 📝 تحويل قائمة الأساتذة إلى صفوف جدول إكسل منسقة
  const data = teachers.map((t, idx) => ({
    seq: idx + 1, // 🔢 التسلسل
    name: t.full_name, // 👤 اسم الأستاذ واللقب الأكاديمي
    gender: t.gender === 'female' ? 'أنثى' : 'ذكر', // 🚻 الجنس
    email: t.generated_email, // ✉️ البريد الأكاديمي المعتمد
    pass: t.temp_password || '—', // 🔑 كلمة المرور والرمز السري المعتمد
    dept: deptName, // 🏢 القسم الأكاديمي
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10); // 📅 تاريخ اليوم للتسمية
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'كادر_الأساتذة', // 📑 اسم ورقة العمل بالإكسل
        columns: [
          { header: 'ت', key: 'seq', width: 8 }, // 🔢 رقم التسلسل
          { header: 'اسم الأستاذ واللقب الأكاديمي', key: 'name', width: 34 }, // 👤 الاسم واللقب
          { header: 'الجنس', key: 'gender', width: 14 }, // 🚻 الجنس
          { header: 'البريد الأكاديمي الرسمي', key: 'email', width: 34 }, // ✉️ البريد الرسمي
          { header: 'كلمة المرور (الرمز السري)', key: 'pass', width: 25 }, // 🔑 كلمة المرور
          { header: 'القسم الأكاديمي', key: 'dept', width: 25 }, // 🏢 اسم القسم
        ],
        data, // 📊 مصفوفة البيانات
        headerColor: 'FF0F2942', // 🎨 كحلي ملكي رسمي
      },
    ],
    `اساتذة_قسم_${deptName}_${dateFormatted}.xlsx` // 📁 اسم الملف عند التحميل
  );
}

// 📤 دالة تصدير كشف طلبة القسم إلى Excel مع الرقم الجامعي، المرحلة، الكروب، الفترة، البريد، والرمز السري
export async function exportCustomStudentsList(
  students: {
    full_name: string; // 👤 اسم الطالب الثلاثي
    university_number: string; // 🆔 الرقم الجامعي
    stage_number?: number; // 🎓 رقم المرحلة الدراسية
    student_group?: string; // 👥 اسم الكروب أو الشعبة الدراسية
    study_type?: string; // ☀️🌙 نوع الدراسة صباحي أو مسائي
    gender?: string; // 🚻 الجنس
    generated_email: string; // ✉️ البريد الأكاديمي الرسمي
    temp_password?: string; // 🔑 كلمة المرور المؤقتة
  }[],
  deptName: string // 🏢 اسم القسم الأكاديمي
): Promise<void> {
  // 📝 تحويل مصفوفة الطلبة إلى صفوف إكسل كاملة الحقول
  const data = students.map((s, idx) => ({
    seq: idx + 1, // 🔢 التسلسل
    name: s.full_name, // 👤 اسم الطالب الثلاثي
    uniNum: s.university_number, // 🆔 الرقم الجامعي
    stage: `المرحلة ${s.stage_number || 1}`, // 🎓 المرحلة الدراسية
    group: s.student_group ? `كروب ${s.student_group}` : 'عامة / موحدة', // 👥 الكروب أو الشعبة الدراسية
    studyType: s.study_type === 'evening' ? 'مسائي' : 'صباحي', // ☀️🌙 الفترة الدراسية
    gender: s.gender === 'female' ? 'أنثى' : 'ذكر', // 🚻 الجنس
    email: s.generated_email, // ✉️ البريد الأكاديمي
    pass: s.temp_password || '—', // 🔑 كلمة المرور والرمز السري
    dept: deptName, // 🏢 القسم الأكاديمي
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10); // 📅 تاريخ اليوم للتسمية
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'شؤون_الطلبة', // 📑 اسم ورقة العمل بالإكسل
        columns: [
          { header: 'ت', key: 'seq', width: 8 }, // 🔢 رقم التسلسل
          { header: 'اسم الطالب الثلاثي', key: 'name', width: 34 }, // 👤 اسم الطالب
          { header: 'الرقم الجامعي', key: 'uniNum', width: 18 }, // 🆔 الرقم الجامعي
          { header: 'المرحلة الدراسية', key: 'stage', width: 16 }, // 🎓 المرحلة
          { header: 'الكروب / الشعبة', key: 'group', width: 18 }, // 👥 الكروب أو الشعبة الدراسية
          { header: 'الفترة الدراسية', key: 'studyType', width: 18 }, // ☀️ نوع الدراسة
          { header: 'الجنس', key: 'gender', width: 14 }, // 🚻 الجنس
          { header: 'البريد الأكاديمي الرسمي', key: 'email', width: 34 }, // ✉️ البريد الرسمي
          { header: 'كلمة المرور (الرمز السري)', key: 'pass', width: 25 }, // 🔑 كلمة المرور
          { header: 'القسم الأكاديمي', key: 'dept', width: 25 }, // 🏢 القسم الأكاديمي
        ],
        data, // 📊 مصفوفة البيانات
        headerColor: 'FF0F2942', // 🎨 كحلي ملكي رسمي
      },
    ],
    `طلبة_قسم_${deptName}_${dateFormatted}.xlsx` // 📁 اسم الملف عند التحميل
  );
}

// 📤 دالة تصدير قائمة المواد المحددة إلى Excel بتنسيق فاخر
export async function exportCustomCoursesList(courses: { code: string; name: string; department_name?: string; stage_number?: number; semester?: number; course_type?: string; theory_teacher_name?: string; practical_teacher_name?: string; credit_hours?: number }[], collegeName: string = 'كلية_ميسان'): Promise<void> {
  const data = courses.map((c, idx) => ({
    seq: idx + 1,
    code: c.code,
    name: c.name,
    dept: c.department_name || '—',
    stage: `المرحلة ${c.stage_number || 1}`,
    semester: c.semester === 2 ? 'الفصل الثاني' : 'الفصل الأول',
    type: c.course_type === 'theory_and_practical' ? 'نظري وعملي' : 'نظري فقط',
    theoryTeacher: c.theory_teacher_name || 'غير معين',
    practicalTeacher: c.practical_teacher_name || '—',
    credits: c.credit_hours || 3,
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'المواد والكورسات المحددة',
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'رمز المادة', key: 'code', width: 14 },
          { header: 'اسم المادة الدراسية', key: 'name', width: 32 },
          { header: 'القسم الأكاديمي', key: 'dept', width: 24 },
          { header: 'المرحلة', key: 'stage', width: 16 },
          { header: 'الفصل الدراسي', key: 'semester', width: 16 },
          { header: 'نوع المادة', key: 'type', width: 18 },
          { header: 'أستاذ النظري', key: 'theoryTeacher', width: 28 },
          { header: 'أستاذ العملي', key: 'practicalTeacher', width: 28 },
          { header: 'الوحدات', key: 'credits', width: 10 },
        ],
        data,
        headerColor: 'FF0F2942', // كحلي ملكي فاخر
      },
    ],
    `مقررات_دراسية_محددة_${collegeName}_${dateFormatted}.xlsx`
  );
}

// 📤 دالة تصدير قائمة رؤساء الأقسام والمقررين المحددين إلى Excel بتنسيق فاخر
export async function exportCustomDeptHeadsList(leaders: { full_name: string; role: string; department_name?: string; gender?: string; generated_email: string; temp_password?: string }[], collegeName: string = 'كلية_ميسان'): Promise<void> {
  const data = leaders.map((l, idx) => ({
    seq: idx + 1,
    name: l.full_name,
    roleTitle: l.role === 'department_head' ? 'رئيس قسم' : 'مقرر قسم',
    dept: l.department_name || 'غير مرتبط',
    gender: l.gender === 'female' ? 'أنثى' : 'ذكر',
    email: l.generated_email,
    pass: l.temp_password || '••••••••',
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'القيادات الإدارية المحددة',
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'الاسم الأكاديمي', key: 'name', width: 32 },
          { header: 'الموقع الإداري', key: 'roleTitle', width: 18 },
          { header: 'القسم المرتبط', key: 'dept', width: 24 },
          { header: 'الجنس', key: 'gender', width: 14 },
          { header: 'البريد الأكاديمي', key: 'email', width: 32 },
          { header: 'كلمة المرور', key: 'pass', width: 22 },
        ],
        data,
        headerColor: 'FF0F2942', // كحلي ملكي فاخر
      },
    ],
    `قيادات_أقسام_محددة_${collegeName}_${dateFormatted}.xlsx`
  );
}

// 📤 دالة تصدير قائمة الأقسام العلمية المحددة إلى Excel بتنسيق فاخر
export async function exportCustomDepartmentsList(depts: { name: string; code: string; head_name?: string; rapporteur_name?: string }[], collegeName: string = 'كلية_ميسان'): Promise<void> {
  const data = depts.map((d, idx) => ({
    seq: idx + 1,
    name: d.name,
    code: d.code,
    head: d.head_name || 'غير معين',
    rapporteur: d.rapporteur_name || 'غير معين',
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'الأقسام العلمية المحددة',
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'اسم القسم العلمي', key: 'name', width: 32 },
          { header: 'رمز القسم (الكود)', key: 'code', width: 18 },
          { header: 'رئيس القسم', key: 'head', width: 28 },
          { header: 'مقرر القسم', key: 'rapporteur', width: 28 },
        ],
        data,
        headerColor: 'FF0F2942', // كحلي ملكي فاخر
      },
    ],
    `أقسام_علمية_محددة_${collegeName}_${dateFormatted}.xlsx`
  );
}

// 📤 دالة تصدير سجلات التدقيق والمراقبة المحددة إلى Excel بتنسيق فاخر ومترجم للعربية بالكامل بدون عمود IP
export async function exportCustomAuditLogsList(
  logs: { 
    created_at: string; 
    actor_name?: string; 
    user_name?: string; 
    action?: string; 
    field_name?: string; 
    student_name?: string; 
    course_name?: string; 
    old_value?: string | number | boolean | null; 
    new_value?: string | number | boolean | null; 
    ip_address?: string 
  }[], 
  collegeName: string = 'كلية_ميسان'
): Promise<void> {
  // 🔄 معالجة وترجمة بيانات السجلات صراحةً
  const data = logs.map((l, idx) => {
    // 📝 ترجمة اسم الحقل أو الحدث (مثل final_exam إلى الامتحان النهائي)
    const rawField = l.field_name || '';
    const translatedField = translateAcademicField(rawField) || getTranslatedAuditAction(rawField) || rawField || '—';

    // 📘 اسم المادة الدراسية الفعلي كما هو مسجل
    const translatedCourse = l.course_name || '—';

    // ⚡ ترجمة نوع العملية بالكامل 100% في العمود D بدون أي مصطلح إنجليزي
    const rawAction = l.action || '';
    const translatedAction = getTranslatedAuditAction(rawAction) || (
      rawAction === 'GRADE_MUTATION' ? 'رصد درجة نظري/سعي' :
      rawAction === 'LOGIN_SUCCESS' ? 'تسجيل دخول ناجح' :
      rawAction === 'LOGIN_FAILED' ? 'محاولة دخول فاشلة' :
      rawAction || 'تعديل'
    );

    // 🎓 تنظيف وترجمة بيانات العمود F (الطالب المعني):
    // تعريب المسارات والأكواد البرمجية مع الحفاظ على أسماء الطلبة كما هي بدون تغيير
    const rawStudent = l.student_name || '—';
    const translatedStudent = translateAuditDetails(rawStudent);

    return {
      seq: idx + 1,
      date: formatEnglishDateTime(l.created_at),
      actor: l.actor_name || l.user_name || 'النظام الأمني',
      action: translatedAction,
      field: translatedField,
      student: translatedStudent,
      course: translatedCourse,
      oldVal: l.old_value !== undefined && l.old_value !== null ? String(l.old_value) : '0',
      newVal: l.new_value !== undefined && l.new_value !== null ? String(l.new_value) : '0',
    };
  });

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'سجل التدقيق والمراقبة',
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'التاريخ والوقت', key: 'date', width: 24 },
          { header: 'المنفّذ (المستخدم)', key: 'actor', width: 28 },
          { header: 'نوع العملية', key: 'action', width: 24 },
          { header: 'الحقل / الحدث', key: 'field', width: 26 },
          { header: 'الطالب المعني', key: 'student', width: 28 },
          { header: 'المادة الدراسية', key: 'course', width: 26 },
          { header: 'القيمة السابقة', key: 'oldVal', width: 16 },
          { header: 'القيمة الجديدة', key: 'newVal', width: 16 },
        ],
        data,
        headerColor: 'FF0F2942', // كحلي ملكي فاخر
      },
    ],
    `سجل_التدقيق_والمراقبة_${collegeName}_${dateFormatted}.xlsx`
  );
}

// 📅 دالة تنزيل قالب Excel معتمد ومخصص لمحاضرات الجدول الأسبوعي لقسم علمي
export async function generateDepartmentScheduleTemplate(
  deptName: string,
  coursesList: { id: string; name: string; code: string; stage_number?: number; semester?: number; course_type?: string }[] = [],
  teachersList: { id: string; full_name: string }[] = []
): Promise<void> {
  const todayDate = new Date();
  const dateFormatted = todayDate.toISOString().split('T')[0];
  const todayArabic = todayDate.toLocaleDateString('ar-IQ-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });

  const sampleData: Record<string, string | number>[] = [
    {
      seq: 1,
      course_name: coursesList[0]?.name || 'تراكيب البيانات والخوارزميات',
      stage: coursesList[0]?.stage_number || 1,
      semester: coursesList[0]?.semester || 1,
      study_type: 'صباحي',
      target_group: 'A', // 👥 كروب A مستقل
      week_number: 1,
      date: '2026-09-13',
      day: 'الأحد',
      start_time: '08:30 ص',
      end_time: '10:30 ص',
      room: 'قاعة 101',
      lecture_type: 'محاضرة نظرية',
      teacher_name: teachersList[0]?.full_name || '',
      notes: 'محاضرة أسبوعية منتظمة لكروب A',
    },
    {
      seq: 2,
      course_name: coursesList[1]?.name || 'البرمجة الكينونية المتقدمة',
      stage: coursesList[1]?.stage_number || 1,
      semester: coursesList[1]?.semester || 1,
      study_type: 'صباحي',
      target_group: 'B', // 👥 كروب B مستقل
      week_number: 1,
      date: '2026-09-14',
      day: 'الإثنين',
      start_time: '10:30 ص',
      end_time: '12:30 م',
      room: 'مختبر الحاسوب 1',
      lecture_type: 'مختبر وتطبيق عملي',
      teacher_name: teachersList[1]?.full_name || teachersList[0]?.full_name || '',
      notes: 'جلسة تطبيق عملي معملية لكروب B',
    },
    {
      seq: 3,
      course_name: coursesList[2]?.name || 'قواعد البيانات العلائقية',
      stage: coursesList[2]?.stage_number || 2,
      semester: coursesList[2]?.semester || 1,
      study_type: 'مسائي',
      target_group: '', // 🛑 فارغ للشعبة الموحدة
      week_number: 1,
      date: '2026-09-15',
      day: 'الثلاثاء',
      start_time: '02:00 م',
      end_time: '04:00 م',
      room: 'قاعة 202',
      lecture_type: 'محاضرة نظرية',
      teacher_name: teachersList[2]?.full_name || teachersList[0]?.full_name || '',
      notes: 'دراسة مسائية لشعبة موحدة',
    },
  ];

  // إضافة أسطر فارغة إضافية لتسهيل الإدخال
  for (let i = 4; i <= 25; i++) {
    sampleData.push({
      seq: i,
      course_name: '',
      stage: Math.min(4, Math.floor((i - 1) / 6) + 1),
      semester: 1,
      study_type: 'صباحي',
      target_group: '', // 👥 حقل الكروب فارغ افتراضياً
      week_number: 1,
      date: '',
      day: 'الأحد',
      start_time: '08:30 ص',
      end_time: '10:30 ص',
      room: 'قاعة 101',
      lecture_type: 'محاضرة نظرية',
      teacher_name: '',
      notes: '',
    });
  }

  const instructionsData: Record<string, string | number>[] = [
    {
      item: 'المؤسسة والجامعة',
      details: 'جامعة الإمام جعفر الصادق (ع) - فرع ميسان | المنصة الأكاديمية المركزية',
    },
    {
      item: 'القسم العلمي التابع له',
      details: `قسم ${deptName}`,
    },
    {
      item: 'تاريخ تنزيل النموذج',
      details: todayArabic,
    },
    {
      item: 'اسم المادة الدراسية *',
      details: 'حقل إلزامي. اكتب اسم المادة الرسمي كما هو مسجل في ورقة (قائمة_مواد_القسم) أو اكتب رمزها.',
    },
    {
      item: 'المرحلة الدراسية *',
      details: 'اكتب رقم المرحلة من (1) إلى (4).',
    },
    {
      item: 'الكورس الدراسي *', // 🗓️ تعديل مسمى الكورس الدراسي وحذف كلمة الفصل
      details: 'اكتب رقم (1) للكورس الأول أو (2) للكورس الثاني.', // 🎯 توضيح الكورس الأول أو الثاني
    },
    {
      item: 'الفترة الدراسية *',
      details: 'اكتب (صباحي) للدراسة الصباحية أو (مسائي) للدراسة المسائية.',
    },
    {
      item: 'الكروب المستهدف (اختياري)',
      details: 'اكتب رمز الكروب مثل (A أو B أو C أو D) إذا كانت المرحلة مقسمة لكروبات مستقلة، أو اتركه فارغاً إذا كانت المرحلة شعبة موحدة.',
    },
    {
      item: 'اليوم الأسبوعي *',
      details: 'اكتب اليوم بالعربية: (السبت، الأحد، الإثنين، الثلاثاء، الأربعاء، الخميس، الجمعة).',
    },
    {
      item: 'وقت البدء ووقت الانتهاء *',
      details: 'اكتب الوقت بنظام 12 ساعة مع الفترة (مثال: 08:30 ص أو 02:00 م) أو بنظام 24 ساعة (مثال: 08:30 أو 14:00).',
    },
    {
      item: 'القاعة / المختبر *',
      details: 'اكتب اسم القاعة الدراسية أو المختبر (مثال: قاعة 101، مدرج A، مختبر البرمجيات).',
    },
    {
      item: 'طبيعة المحاضرة *',
      details: 'اكتب (محاضرة نظرية) أو (مختبر وتطبيق عملي).',
    },
    {
      item: 'الأستاذ المحاضر',
      details: 'حقل اختياري. اكتب اسم الأستاذ المطابق من ورقة (قائمة_أساتذة_القسم) ليتم تعيينه تلقائياً للمحاضرة.',
    },
    {
      item: 'الأسبوع الدراسي (اختياري)',
      details: 'اكتب رقم الأسبوع من (1) إلى (15) لمسار بولونيا. الافتراضي هو الأسبوع (1).',
    },
    {
      item: 'تاريخ المحاضرة (اختياري)',
      details: 'اكتب تاريخ المحاضرة بصيغة (YYYY-MM-DD) مثل 2026-09-13. عند كتابة تاريخ الأسبوع الأول، يتم توليد تواريخ الـ 15 أسبوعاً تلقائياً بموجب مسار بولونيا.',
    },
    {
      item: 'ملاحظات',
      details: 'حقل اختياري لأي ملاحظات أو توجيهات إضافية بخصوص المحاضرة.',
    },
  ];

  const sheetsToExport = [
    {
      sheetName: 'بيانات_المحاضرات',
      columns: [
        { header: 'الرقم', key: 'seq', width: 8 },
        { header: 'اسم المادة الدراسية *', key: 'course_name', width: 35 },
        { header: 'المرحلة (1-4) *', key: 'stage', width: 16 },
        { header: 'الكورس (1 أو 2) *', key: 'semester', width: 16 }, // 📊 تعديل رأس العمود ليكون الكورس بدلاً من الفصل
        { header: 'الفترة (صباحي / مسائي) *', key: 'study_type', width: 24 },
        { header: 'الكروب (A, B... أو فارغ للشعبة الموحدة)', key: 'target_group', width: 26 }, // 👥 عمود الكروب المستقل
        { header: 'الأسبوع (1-15)', key: 'week_number', width: 16 },
        { header: 'تاريخ المحاضرة', key: 'date', width: 16 },
        { header: 'اليوم الأسبوعي *', key: 'day', width: 18 },
        { header: 'وقت البدء *', key: 'start_time', width: 16 },
        { header: 'وقت الانتهاء *', key: 'end_time', width: 16 },
        { header: 'القاعة / المختبر *', key: 'room', width: 22 },
        { header: 'طبيعة المحاضرة (نظرية / عملية) *', key: 'lecture_type', width: 30 },
        { header: 'الأستاذ المحاضر (اختياري)', key: 'teacher_name', width: 28 },
        { header: 'ملاحظات (اختياري)', key: 'notes', width: 30 },
      ],
      data: sampleData,
      headerColor: 'FF0F2942',
    },
    {
      sheetName: 'تعليمات_الاستيراد',
      columns: [
        { header: 'بند التعليمات', key: 'item', width: 32 },
        { header: 'التفاصيل والضوابط الأكاديمية', key: 'details', width: 68 },
      ],
      data: instructionsData,
      headerColor: 'FF1E3A8A',
    },
  ];

  // 📋 إذا وجد مواد في القسم نضيف ورقة بمواد القسم لتسهيل النسخ
  if (coursesList.length > 0) {
    sheetsToExport.push({
      sheetName: 'قائمة_مواد_القسم',
      columns: [
        { header: 'ت', key: 'seq', width: 8 },
        { header: 'اسم المادة الدراسية', key: 'name', width: 35 },
        { header: 'رمز المادة', key: 'code', width: 16 },
        { header: 'المرحلة', key: 'stage', width: 12 },
        { header: 'الكورس', key: 'semester', width: 12 },
        { header: 'النوع', key: 'type', width: 20 },
      ],
      data: coursesList.map((c, idx) => ({
        seq: idx + 1,
        name: c.name,
        code: c.code,
        stage: `المرحلة ${c.stage_number || 1}`,
        semester: `الكورس ${(c.semester || 1) === 2 ? 'الثاني' : 'الأول'}`,
        type: c.course_type === 'theory_only' ? 'نظري فقط' : 'نظري وعملي',
      })),
      headerColor: 'FF0284C7',
    });
  }

  // 📋 إذا وجد أساتذة في القسم نضيف ورقة بأسماء الأساتذة
  if (teachersList.length > 0) {
    sheetsToExport.push({
      sheetName: 'قائمة_أساتذة_القسم',
      columns: [
        { header: 'ت', key: 'seq', width: 8 },
        { header: 'اسم الأستاذ المعتمد في القسم', key: 'name', width: 35 },
      ],
      data: teachersList.map((t, idx) => ({ seq: idx + 1, name: t.full_name })),
      headerColor: 'FF065F46',
    });
  }

  await generateAndDownloadExcel(
    sheetsToExport,
    `نموذج_استيراد_جدول_قسم_${deptName.replace(/\s+/g, '_')}_${dateFormatted}.xlsx`
  );
}

// 📤 دالة تصدير قائمة محاضرات الجدول الأسبوعي إلى Excel بتنسيق فاخر
export async function exportCustomScheduleList(
  lectures: {
    course_name: string;
    course_code?: string;
    stage_number?: number;
    semester?: number;
    study_type?: string;
    target_group?: string; // 👥 الكروب الأكاديمي المستهدف بالمحاضرة
    day: string;
    start_time: string;
    end_time: string;
    room: string;
    type?: string;
    teacher_name?: string;
    notes?: string;
    week_number?: number;
    date?: string;
  }[],
  deptName: string = 'القسم_الأكاديمي'
): Promise<void> {
  const dayNameMap: Record<string, string> = {
    saturday: 'السبت',
    sunday: 'الأحد',
    monday: 'الإثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
  };

  const data = lectures.map((l, idx) => ({
    seq: idx + 1,
    course_name: l.course_name,
    course_code: l.course_code || '—',
    stage: `المرحلة ${l.stage_number || 1}`,
    semester: `الكورس ${(l.semester || 1) === 2 ? 'الثاني' : 'الأول'}`,
    study_type: (l.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي',
    group: l.target_group && l.target_group !== 'all' ? `كروب ${l.target_group}` : 'شعبة موحدة', // 👥 توضيح الكروب أو الشعبة الموحدة
    week_number: l.week_number ? `الأسبوع ${l.week_number}` : '—',
    date: l.date || '—',
    day: dayNameMap[l.day] || l.day,
    start_time: l.start_time,
    end_time: l.end_time,
    room: l.room,
    type: l.type === 'practical' ? 'مختبر وعملي' : 'محاضرة نظرية',
    teacher_name: l.teacher_name || 'غير معين',
    notes: l.notes || '—',
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'جدول_المحاضرات',
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'اسم المادة الدراسية', key: 'course_name', width: 32 },
          { header: 'رمز المادة', key: 'course_code', width: 14 },
          { header: 'المرحلة', key: 'stage', width: 14 },
          { header: 'الكورس', key: 'semester', width: 14 },
          { header: 'الفترة', key: 'study_type', width: 14 },
          { header: 'الكروب / الشعبة', key: 'group', width: 18 }, // 👥 عمود الكروب المعتمد
          { header: 'الأسبوع الدراسي', key: 'week_number', width: 16 },
          { header: 'تاريخ المحاضرة', key: 'date', width: 16 },
          { header: 'اليوم الأسبوعي', key: 'day', width: 16 },
          { header: 'وقت البدء', key: 'start_time', width: 14 },
          { header: 'وقت الانتهاء', key: 'end_time', width: 14 },
          { header: 'القاعة / المختبر', key: 'room', width: 22 },
          { header: 'طبيعة المحاضرة', key: 'type', width: 20 },
          { header: 'الأستاذ المحاضر', key: 'teacher_name', width: 28 },
          { header: 'ملاحظات', key: 'notes', width: 28 },
        ],
        data,
        headerColor: 'FF0F2942', // كحلي ملكي فاخر
      },
    ],
    `جدول_محاضرات_قسم_${deptName.replace(/\s+/g, '_')}_${dateFormatted}.xlsx`
  );
}

// 📥 📅 دالة تنزيل قالب Excel معتمد ومخصص لاستيراد جدول الامتحانات النهائية لقسم محدد
export async function downloadFinalExamScheduleTemplate(
  deptName: string,
  coursesList: { id: string; name: string; code: string; stage_number?: number; semester?: number }[] = []
): Promise<void> {
  const todayDate = new Date();
  const dateFormatted = todayDate.toISOString().split('T')[0];
  const todayArabic = todayDate.toLocaleDateString('ar-IQ-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });

  // 🏛️ نماذج قاعات وبنايات نموذجية
  const defaultHalls = [
    { building: 'بناية الأقسام المركزية', hall: 'مدرج الخوارزمي (قاعة 101)' },
    { building: 'بناية الأقسام المركزية', hall: 'مدرج ابن الهيثم (قاعة 102)' },
    { building: 'بناية الأقسام المركزية', hall: 'قاعة المتنبي (قاعة 201)' },
    { building: 'بناية العمادة والمختبرات', hall: 'مختبر الحاسوب المركزي 1' },
    { building: 'بناية العمادة والمختبرات', hall: 'مختبر الشبكات والذكاء الاصطناعي' },
  ];

  // 📝 توليد بيانات تجريبية واقعية بناء على مواد القسم
  const sampleData: Record<string, string | number>[] = [];
  
  if (coursesList.length > 0) {
    coursesList.slice(0, 6).forEach((c, idx) => {
      const examDate = new Date(todayDate);
      examDate.setDate(todayDate.getDate() + (idx * 3) + 7);
      const dateStr = examDate.toISOString().split('T')[0];
      const daysArr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const dayName = daysArr[examDate.getDay()] || 'الأحد';
      const hallObj = defaultHalls[idx % defaultHalls.length];

      sampleData.push({
        seq: idx + 1,
        exam_date: dateStr,
        exam_day: dayName,
        course_name: c.name,
        course_code: c.code || `CRS-${c.stage_number || 1}0${idx + 1}`,
        stage_number: c.stage_number || 1,
        semester: c.semester || 1,
        start_time: '09:00',
        end_time: '12:00',
        duration_hours: 3,
        building_name: hallObj.building,
        hall_name: hallObj.hall,
        supervisor_name: 'اللجنة الامتحانية المركزية',
        notes: 'يمنع إدخال الهاتف الذكي وتبرز الهوية الجامعية',
      });
    });
  } else {
    sampleData.push(
      {
        seq: 1,
        exam_date: '2026-09-08',
        exam_day: 'الثلاثاء',
        course_name: 'قواعد اللغة الإنجليزية والصوتيات',
        course_code: 'ENG101',
        stage_number: 1,
        semester: 1,
        start_time: '09:00',
        end_time: '12:00',
        duration_hours: 3,
        building_name: 'بناية الأقسام المركزية',
        hall_name: 'مدرج الخوارزمي (قاعة 101)',
        supervisor_name: 'أ. د. عباس حسن',
        notes: 'يمنع إدخال الهاتف الذكي',
      },
      {
        seq: 2,
        exam_date: '2026-09-11',
        exam_day: 'الجمعة',
        course_name: 'مهارات القراءة والاستيعاب المتقدم',
        course_code: 'ENG102',
        stage_number: 1,
        semester: 1,
        start_time: '09:00',
        end_time: '12:00',
        duration_hours: 3,
        building_name: 'بناية الأقسام المركزية',
        hall_name: 'مدرج ابن الهيثم (قاعة 102)',
        supervisor_name: 'م. م. سارة علي',
        notes: 'إحضار قلم جاف أزرق',
      }
    );
  }

  // صفوف فارغة إضافية جاهزة للإدخال المباشر
  const currentCount = sampleData.length;
  for (let i = currentCount + 1; i <= 25; i++) {
    sampleData.push({
      seq: i,
      exam_date: '',
      exam_day: '',
      course_name: '',
      course_code: '',
      stage_number: 1,
      semester: 1,
      start_time: '09:00',
      end_time: '12:00',
      duration_hours: 3,
      building_name: 'بناية الأقسام المركزية',
      hall_name: '',
      supervisor_name: '',
      notes: '',
    });
  }

  // ورقة التعليمات والضوابط
  const instructionsData: Record<string, string | number>[] = [
    {
      item: 'المؤسسة والجامعة',
      details: 'جامعة الإمام جعفر الصادق (ع) - فرع ميسان | المنصة الأكاديمية المركزية - مسار بولونيا',
    },
    {
      item: 'القسم العلمي التابع له',
      details: `قسم ${deptName}`,
    },
    {
      item: 'تاريخ تنزيل النموذج',
      details: todayArabic,
    },
    {
      item: 'تاريخ الامتحان (YYYY-MM-DD) *',
      details: 'حقل إلزامي. اكتب التاريخ بصيغة السنة-الشهر-اليوم (مثال: 2026-09-15).',
    },
    {
      item: 'اسم اليوم بالعربية',
      details: 'حقل اختياري. يمكنك كتابة (السبت، الأحد، الإثنين، الثلاثاء، الأربعاء، الخميس، الجمعة) أو تركه ليحسبه النظام تلقائياً من التاريخ.',
    },
    {
      item: 'اسم المادة الدراسية *',
      details: 'حقل إلزامي. اكتب اسم المادة الرسمي بالعربية مطابقاً لما هو مسجل في ورقة (قائمة_مواد_القسم).',
    },
    {
      item: 'رمز المادة (الكود)',
      details: 'حقل اختياري. يمكنك كتابة كود المادة (مثال: CS101) لتسهيل المطابقة التلقائية.',
    },
    {
      item: 'المرحلة الدراسية (1-4) *',
      details: 'حقل إلزامي. اكتب رقم المرحلة من (1) إلى (4).',
    },
    {
      item: 'الفصل الدراسي (1 أو 2) *',
      details: 'حقل إلزامي. اكتب (1) للكورس الأول أو (2) للكورس الثاني.',
    },
    {
      item: 'وقت بدء الامتحان (HH:mm) *',
      details: 'حقل إلزامي. اكتب وقت البدء بنظام 24 ساعة (مثال: 09:00 أو 08:30).',
    },
    {
      item: 'وقت انتهاء الامتحان (HH:mm) *',
      details: 'حقل إلزامي. اكتب وقت الانتهاء بنظام 24 ساعة (مثال: 12:00 أو 11:30).',
    },
    {
      item: 'مدة الامتحان بالساعات *',
      details: 'حقل إلزامي. اكتب مدة الامتحان بالساعات (مثال: 3 أو 2.5 أو 2).',
    },
    {
      item: 'البناية الامتحانية *',
      details: 'حقل إلزامي. اكتب اسم البناية (مثال: بناية الأقسام المركزية، بناية العمادة والمختبرات).',
    },
    {
      item: 'القاعة الامتحانية *',
      details: 'حقل إلزامي. اكتب اسم القاعة أو المدرج (مثال: مدرج الخوارزمي - قاعة 101).',
    },
    {
      item: 'المشرف / رئيس القاعة',
      details: 'حقل اختياري. اكتب اسم رئيس اللجنة أو المشرف على القاعة.',
    },
    {
      item: 'ملاحظات وضوابط خاصة',
      details: 'حقل اختياري. اكتب أي تعليمات خاصة بالمادة للطلاب (مثال: يسمح بالآلة الحاسبة الهندسية).',
    },
  ];

  const sheetsToExport = [
    {
      sheetName: 'جدول_الامتحانات',
      columns: [
        { header: 'ت', key: 'seq', width: 8 },
        { header: 'تاريخ الامتحان (YYYY-MM-DD) *', key: 'exam_date', width: 26 },
        { header: 'اليوم', key: 'exam_day', width: 14 },
        { header: 'اسم المادة الدراسية *', key: 'course_name', width: 34 },
        { header: 'رمز المادة', key: 'course_code', width: 16 },
        { header: 'المرحلة (1-4) *', key: 'stage_number', width: 16 },
        { header: 'الكورس (1 أو 2) *', key: 'semester', width: 16 },
        { header: 'الفترة الدراسية', key: 'study_type', width: 16 },
        { header: 'وقت البدء (09:00) *', key: 'start_time', width: 18 },
        { header: 'وقت الانتهاء (12:00) *', key: 'end_time', width: 18 },
        { header: 'المدة بالساعات *', key: 'duration_hours', width: 16 },
        { header: 'البناية الامتحانية *', key: 'building_name', width: 28 },
        { header: 'القاعة الامتحانية *', key: 'hall_name', width: 28 },
        { header: 'المشرف / رئيس القاعة', key: 'supervisor_name', width: 24 },
        { header: 'ملاحظات خاصة', key: 'notes', width: 30 },
      ],
      data: sampleData,
      headerColor: 'FF0F2942', // كحلي ملكي رسمي للجامعة
    },
    {
      sheetName: 'تعليمات_الاستيراد',
      columns: [
        { header: 'بند التعليمات والضوابط', key: 'item', width: 32 },
        { header: 'التفاصيل والإرشادات الأكاديمية', key: 'details', width: 70 },
      ],
      data: instructionsData,
      headerColor: 'FF1E3A8A', // أزرق ملكي أكاديمي
    },
  ];

  // ورقة قائمة مواد القسم
  if (coursesList.length > 0) {
    sheetsToExport.push({
      sheetName: 'قائمة_مواد_القسم',
      columns: [
        { header: 'ت', key: 'seq', width: 8 },
        { header: 'اسم المادة المعتمدة', key: 'name', width: 35 },
        { header: 'رمز المادة', key: 'code', width: 16 },
        { header: 'المرحلة', key: 'stage', width: 12 },
        { header: 'الفصل الدراسي', key: 'semester', width: 14 },
      ],
      data: coursesList.map((c, idx) => ({
        seq: idx + 1,
        name: c.name,
        code: c.code || '—',
        stage: c.stage_number || 1,
        semester: c.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول',
      })),
      headerColor: 'FF065F46', // زمردي داكن
    });
  }

  // ورقة القاعات المقترحة
  sheetsToExport.push({
    sheetName: 'قائمة_القاعات_المقترحة',
    columns: [
      { header: 'ت', key: 'seq', width: 8 },
      { header: 'البناية الامتحانية', key: 'building', width: 30 },
      { header: 'اسم القاعة / المدرج / المختبر', key: 'hall', width: 32 },
    ],
    data: defaultHalls.map((h, idx) => ({
      seq: idx + 1,
      building: h.building,
      hall: h.hall,
    })),
    headerColor: 'FF1E293B', // سليت داكن
  });

  await generateAndDownloadExcel(
    sheetsToExport,
    `نموذج_استيراد_جدول_امتحانات_قسم_${deptName.replace(/\s+/g, '_')}_${dateFormatted}.xlsx`
  );
}

// 📤 📅 دالة تصدير قائمة مواعيد الامتحانات المحددة أو الكاملة إلى Excel بتنسيق فاخر
export async function exportCustomFinalExamSlotsList(
  slotsList: {
    course_name: string;
    course_code?: string;
    stage_number: number;
    study_type?: 'morning' | 'evening' | 'both';
    exam_date: string;
    exam_day: string;
    start_time: string;
    end_time: string;
    duration_hours: number;
    building_name: string;
    hall_name: string;
    supervisor_name?: string;
    notes?: string;
  }[],
  deptName: string,
  stageName: string,
  semesterName: string,
  attemptName: string
): Promise<void> {
  const dayNameMap: Record<string, string> = {
    saturday: 'السبت',
    sunday: 'الأحد',
    monday: 'الإثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
  };

  const data = slotsList.map((s, idx) => ({
    seq: idx + 1,
    course_name: s.course_name,
    course_code: s.course_code || '—',
    stage: `المرحلة ${s.stage_number}`,
    study_type: s.study_type === 'evening' ? 'مسائي' : s.study_type === 'both' ? 'صباحي ومسائي' : 'صباحي',
    exam_date: s.exam_date,
    exam_day: dayNameMap[s.exam_day] || s.exam_day,
    timing: `${s.start_time} - ${s.end_time}`,
    duration: `${s.duration_hours} ساعات`,
    building: s.building_name,
    hall: s.hall_name,
    supervisor: s.supervisor_name || 'اللجنة الامتحانية المركزية',
    notes: s.notes || '—',
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'جدول_الامتحانات_النهائية',
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'اسم المادة الدراسية', key: 'course_name', width: 34 },
          { header: 'رمز المادة', key: 'course_code', width: 14 },
          { header: 'المرحلة', key: 'stage', width: 14 },
          { header: 'الفترة', key: 'study_type', width: 14 },
          { header: 'تاريخ الامتحان', key: 'exam_date', width: 18 },
          { header: 'اليوم', key: 'exam_day', width: 14 },
          { header: 'توقيت الامتحان', key: 'timing', width: 18 },
          { header: 'المدة', key: 'duration', width: 14 },
          { header: 'البناية الامتحانية', key: 'building', width: 28 },
          { header: 'القاعة الامتحانية', key: 'hall', width: 28 },
          { header: 'المشرف / رئيس القاعة', key: 'supervisor', width: 26 },
          { header: 'ملاحظات', key: 'notes', width: 28 },
        ],
        data,
        headerColor: 'FF0F2942', // كحلي ملكي فاخر
      },
    ],
    `جدول_امتحانات_${deptName.replace(/\s+/g, '_')}_${stageName.replace(/\s+/g, '_')}_${semesterName.replace(/\s+/g, '_')}_${attemptName.replace(/\s+/g, '_')}_${dateFormatted}.xlsx`
  );
}

// 📤 🏛️ دالة تصدير مصفوفة إشغال القاعات الامتحانية المركزية لكافة أقسام الكلية إلى Excel
export async function exportMasterCampusExamMatrixExcel(
  slotsList: FinalExamSlot[],
  schedulesList: FinalExamSchedule[],
  filterDateLabel: string,
  filterDeptLabel: string
): Promise<void> {
  const dayNameMap: Record<string, string> = {
    saturday: 'السبت',
    sunday: 'الأحد',
    monday: 'الإثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
  };

  const scheduleMap = new Map(schedulesList.map((s) => [s.id, s]));

  const data = slotsList.map((s, idx) => {
    const sch = scheduleMap.get(s.schedule_id);
    return {
      seq: idx + 1,
      exam_date: s.exam_date,
      exam_day: dayNameMap[s.exam_day] || s.exam_day,
      timing: `${s.start_time} - ${s.end_time}`,
      duration: `${s.duration_hours || 3} ساعات`,
      dept_name: sch?.department_name || '—',
      course_name: s.course_name,
      course_code: s.course_code || '—',
      stage: `المرحلة ${s.stage_number}`,
      semester: sch?.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول',
      attempt: sch?.attempt_type === 'second_attempt' ? 'الدور الثاني' : 'الدور الأول',
      building: s.building_name,
      hall: s.hall_name,
      supervisor: s.supervisor_name || 'اللجنة الامتحانية المركزية',
      status: sch?.status === 'approved' ? 'معتمد رسمياً' : 'قيد المصادقة',
      notes: s.notes || '—',
    };
  });

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'مصفوفة_القاعات_المركزية',
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'تاريخ الامتحان', key: 'exam_date', width: 16 },
          { header: 'اليوم', key: 'exam_day', width: 14 },
          { header: 'توقيت الامتحان', key: 'timing', width: 18 },
          { header: 'المدة', key: 'duration', width: 12 },
          { header: 'القسم الأكاديمي', key: 'dept_name', width: 28 },
          { header: 'المادة الدراسية', key: 'course_name', width: 34 },
          { header: 'رمز المادة', key: 'course_code', width: 14 },
          { header: 'المرحلة', key: 'stage', width: 14 },
          { header: 'الكورس', key: 'semester', width: 14 },
          { header: 'الدور', key: 'attempt', width: 14 },
          { header: 'البناية الامتحانية', key: 'building', width: 26 },
          { header: 'القاعة / المدرج', key: 'hall', width: 26 },
          { header: 'المشرف / رئيس القاعة', key: 'supervisor', width: 26 },
          { header: 'موقف الاعتماد', key: 'status', width: 16 },
          { header: 'ملاحظات', key: 'notes', width: 28 },
        ],
        data,
        headerColor: 'FF0F2942', // كحلي ملكي فاخر
      },
    ],
    `مصفوفة_القاعات_المركزية_${filterDateLabel.replace(/\s+/g, '_')}_${dateFormatted}.xlsx`
  );
}

// 📤 💳 دالة تصدير سجلات الأقساط والمواقف المالية للطلبة إلى Excel
export async function exportTuitionRecordsExcel(
  records: StudentTuitionRecord[],
  deptName: string,
  stageLabel: string
): Promise<void> {
  const statusMap: Record<string, string> = {
    fully_settled: 'مسدد بالكامل',
    partially_settled: 'مسدد جزئياً',
    unsettled: 'غير مسدد',
    exempt: 'معفى من القسط',
  };

  const discountMap: Record<string, string> = {
    none: 'بدون تخفيض',
    martyrs_family: 'ذوو الشهداء (50%)',
    top_student: 'الطالب المتفوق (الأول)',
    siblings: 'إخوة دارسون (10%)',
    destitute_aid: 'رعاية اجتماعية',
    custom: 'تخفيض خاص',
  };

  const data = records.map((r, idx) => ({
    seq: idx + 1,
    student_name: r.student_name,
    student_code: r.student_code || '—',
    stage: `المرحلة ${r.stage_number}`,
    study_type: (r.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي',
    base_amount: (r.base_amount || r.total_amount).toLocaleString() + ' د.ع',
    discount_type: discountMap[r.discount_type || 'none'] || 'بدون تخفيض',
    discount_amount: (r.discount_amount || 0).toLocaleString() + ' د.ع',
    total_amount: r.total_amount.toLocaleString() + ' د.ع',
    paid_amount: r.paid_amount.toLocaleString() + ' د.ع',
    remaining_amount: r.remaining_amount.toLocaleString() + ' د.ع',
    installments_count: `${r.paid_installments.length} من ${r.installments_count}`,
    status: statusMap[r.status] || r.status,
    clearance: r.status === 'fully_settled' || r.financial_clearance === 'cleared' ? 'مبرأ الذمة' : 'غير مبرأ',
    unpaid_stages: r.unpaid_stages_count > 0 ? `${r.unpaid_stages_count} مراحل` : 'لا توجد',
    notes: r.notes || '—',
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'سجل_الأقساط_المالية',
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'اسم الطالب الرباعي', key: 'student_name', width: 34 },
          { header: 'الرقم الجامعي', key: 'student_code', width: 16 },
          { header: 'المرحلة', key: 'stage', width: 14 },
          { header: 'نوع الدراسة', key: 'study_type', width: 14 },
          { header: 'القسط الأساسي', key: 'base_amount', width: 18 },
          { header: 'نوع التخفيض', key: 'discount_type', width: 22 },
          { header: 'قيمة الخصم', key: 'discount_amount', width: 16 },
          { header: 'الصافي المطلوب', key: 'total_amount', width: 18 },
          { header: 'المبلغ المسدد', key: 'paid_amount', width: 18 },
          { header: 'المتبقي في الذمة', key: 'remaining_amount', width: 18 },
          { header: 'الدفعات المسددة', key: 'installments_count', width: 16 },
          { header: 'موقف التسديد', key: 'status', width: 18 },
          { header: 'براءة الذمة', key: 'clearance', width: 16 },
          { header: 'متأخرات سابقة', key: 'unpaid_stages', width: 16 },
          { header: 'ملاحظات', key: 'notes', width: 26 },
        ],
        data,
        headerColor: 'FF0F2942', // كحلي ملكي فاخر
      },
    ],
    `كشف_أقساط_${deptName.replace(/\s+/g, '_')}_${stageLabel.replace(/\s+/g, '_')}_${dateFormatted}.xlsx`
  );
}

// 📥 💳 دالة تحميل نموذج وقالب إكسل الرسمي للأقساط والتخفيضات المالية
export async function downloadTuitionRecordsTemplate(
  deptName: string,
  studentsList: UserProfile[] = []
): Promise<void> {
  const instructionsData = [
    { item: '1. حقول أساسية وإلزامية', details: 'يجب ملء الرقم الجامعي للطالب، اسم الطالب الرباعي، المرحلة (1-4)، ونوع الدراسة (صباحي / مسائي).' },
    { item: '2. القسط السنوي الأساسي', details: 'يُكتب القسط الأساسي المعتمد بالدينار العراقي كأرقام فقط (مثال: 1800000 أو 2200000).' },
    { item: '3. أنواع ونسب التخفيض المعتمدة', details: 'بدون تخفيض (0%) | ذوو الشهداء (50%) | الطالب الأول (100%) | إخوة دارسون (10%) | رعاية اجتماعية | تخفيض مخصص.' },
    { item: '4. حساب الصافي والمتبقي', details: 'يقوم النظام بحساب قيمة الخصم وصافي القسط المطلوب تلقائياً بناءً على نسبة التخفيض المدخلة.' },
    { item: '5. متأخرات المراحل السابقة', details: 'في حال وجود متأخرات على الطالب من مراحل سابقة، يُسجل عدد المراحل (مثلاً: 1 أو 2) لتنبيهه ومتابعة تسويتها.' },
  ];

  const sampleData = studentsList.length > 0 
    ? studentsList.slice(0, 10).map((std, idx) => {
        const isEvening = (std.study_type || 'morning') === 'evening';
        const stg = std.stage_number || 1;
        const defaultBase = stg === 1 ? (isEvening ? 2200000 : 1800000) : (isEvening ? 2300000 : 1900000);
        return {
          seq: idx + 1,
          student_code: std.university_number || `ENG-2026-${String(idx + 1).padStart(3, '0')}`,
          student_name: std.full_name,
          stage_number: stg,
          study_type: isEvening ? 'مسائي' : 'صباحي',
          base_amount: defaultBase,
          discount_type: 'بدون تخفيض',
          discount_percentage: 0,
          notes: 'تسجيل قسط سنوي معتمد',
          unpaid_stages_count: 0,
        };
      })
    : [
        {
          seq: 1,
          student_code: 'ENG-2026-001',
          student_name: 'علي كريم خضير',
          stage_number: 1,
          study_type: 'صباحي',
          base_amount: 1800000,
          discount_type: 'بدون تخفيض',
          discount_percentage: 0,
          notes: 'تسجيل اعتيادي',
          unpaid_stages_count: 0,
        },
        {
          seq: 2,
          student_code: 'ENG-2026-002',
          student_name: 'فاطمة جواد كاظم',
          stage_number: 1,
          study_type: 'صباحي',
          base_amount: 1800000,
          discount_type: 'ذوو الشهداء (50%)',
          discount_percentage: 50,
          notes: 'كتاب مؤسسة الشهداء ذي العدد 1234',
          unpaid_stages_count: 0,
        },
      ];

  const sheetsToExport: {
    sheetName: string;
    columns: { header: string; key: string; width?: number }[];
    data: Record<string, string | number>[];
    headerColor?: string;
  }[] = [
    {
      sheetName: 'سجل_الأقساط_والتخفيضات',
      columns: [
        { header: 'ت', key: 'seq', width: 8 },
        { header: 'الرقم الجامعي للطالب *', key: 'student_code', width: 22 },
        { header: 'اسم الطالب الرباعي *', key: 'student_name', width: 34 },
        { header: 'المرحلة (1-4) *', key: 'stage_number', width: 14 },
        { header: 'نوع الدراسة (صباحي / مسائي) *', key: 'study_type', width: 24 },
        { header: 'القسط السنوي الأساسي (د.ع) *', key: 'base_amount', width: 24 },
        { header: 'نوع التخفيض المعتمد', key: 'discount_type', width: 24 },
        { header: 'نسبة التخفيض (%)', key: 'discount_percentage', width: 16 },
        { header: 'سند التخفيض أو رقم القرار', key: 'notes', width: 30 },
        { header: 'متأخرات مراحل سابقة (عدد)', key: 'unpaid_stages_count', width: 22 },
      ],
      data: sampleData,
      headerColor: 'FF0F2942', // كحلي ملكي
    },
    {
      sheetName: 'تعليمات_الاستيراد',
      columns: [
        { header: 'بند التعليمات والضوابط المالية', key: 'item', width: 32 },
        { header: 'التفاصيل والإرشادات المحاسبية', key: 'details', width: 70 },
      ],
      data: instructionsData,
      headerColor: 'FF1E3A8A', // أزرق ملكي
    },
  ];

  if (studentsList.length > 0) {
    sheetsToExport.push({
      sheetName: 'قائمة_طلبة_القسم',
      columns: [
        { header: 'ت', key: 'seq', width: 8 },
        { header: 'اسم الطالب', key: 'name', width: 34 },
        { header: 'الرقم الجامعي', key: 'code', width: 18 },
        { header: 'المرحلة', key: 'stage', width: 12 },
        { header: 'نوع الدراسة', key: 'study_type', width: 14 },
      ],
      data: studentsList.map((s, idx) => ({
        seq: idx + 1,
        name: s.full_name,
        code: s.university_number || '—',
        stage: s.stage_number || 1,
        study_type: (s.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي',
      })),
      headerColor: 'FF065F46', // زمردي
    });
  }

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    sheetsToExport,
    `نموذج_أقساط_وتخفيضات_${deptName.replace(/\s+/g, '_')}_${dateFormatted}.xlsx`
  );
}

// 📤 دالة تصدير قائمة تكليفات الكادر التدريسي إلى Excel بتنسيق فاخر
export async function exportCustomTeacherCoursesList(
  assignments: {
    teacher_name: string; // 👤 اسم الأستاذ المكلف
    teacher_email?: string; // 📧 البريد الأكاديمي للأستاذ
    course_name: string; // 📝 اسم المادة الدراسية
    course_code?: string; // 🔢 رمز المادة الكودي
    stage_number?: number; // 🎓 رقم المرحلة الدراسية
    semester?: number; // 🗓️ الفصل الدراسي (1 أو 2)
    role_in_course?: 'theory' | 'practical' | 'both'; // 🏷️ طبيعة التكليف (نظري/عملي)
    created_at?: string; // ⏰ تاريخ التكليف
  }[],
  deptName: string // 🏢 اسم القسم الأكاديمي
): Promise<void> {
  // 🗺️ قاموس ترجمة صفة التدريس والتكليف
  const roleMap: Record<string, string> = {
    theory: 'نظري فقط', // 📖 نظري فقط
    practical: 'عملي فقط', // 🔬 عملي فقط
    both: 'نظري وعملي', // 📚 نظري وعملي
  };

  // 📝 تجهيز مصفوفة البيانات للصفوف الإكسل
  const data = assignments.map((a, idx) => ({
    seq: idx + 1, // 🔢 التسلسل
    teacher: a.teacher_name, // 👤 اسم الأستاذ
    email: a.teacher_email || '—', // 📧 البريد الأكاديمي
    course: a.course_name, // 📘 المادة الدراسية
    code: a.course_code || '—', // 🔠 رمز المادة
    stage: a.stage_number ? `المرحلة ${a.stage_number}` : '—', // 🎓 المرحلة
    semester: a.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول', // 🗓️ الكورس
    role: a.role_in_course ? roleMap[a.role_in_course] || a.role_in_course : 'نظري وعملي', // 🏷️ طبيعة التكليف
    date: a.created_at ? a.created_at.slice(0, 10) : '—', // 📅 تاريخ التكليف
    dept: deptName, // 🏢 القسم الأكاديمي
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10); // 📅 تاريخ اليوم للتسمية
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'تكليفات_التدريسيين', // 📑 اسم ورقة العمل
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'اسم الأستاذ المكلف', key: 'teacher', width: 32 },
          { header: 'البريد الأكاديمي', key: 'email', width: 32 },
          { header: 'المادة الدراسية', key: 'course', width: 30 },
          { header: 'رمز المادة', key: 'code', width: 14 },
          { header: 'المرحلة', key: 'stage', width: 16 },
          { header: 'الفصل الدراسي', key: 'semester', width: 16 },
          { header: 'طبيعة التكليف', key: 'role', width: 18 },
          { header: 'تاريخ التكليف', key: 'date', width: 16 },
          { header: 'القسم الأكاديمي', key: 'dept', width: 25 },
        ],
        data,
        headerColor: 'FF0F2942', // 🎨 كحلي ملكي فاخر
      },
    ],
    `تكليفات_كادر_${deptName}_${dateFormatted}.xlsx`
  );
}

// 📤 دالة تصدير سجل درجات وسعيات مسار بولونيا إلى Excel بتنسيق فاخر
export async function exportCustomGradesList(
  grades: {
    student_name: string; // 👤 اسم الطالب الثلاثي
    university_number: string; // 🆔 الرقم الجامعي
    course_name: string; // 📝 اسم المادة الدراسية
    quiz1: number; // 📝 كويز 1
    quiz2: number; // 📝 كويز 2
    assignment1: number; // 📑 واجب 1
    assignment2: number; // 📑 واجب 2
    report: number; // 📄 تقرير ومشاريع
    midterm: number; // 🎯 امتحان منتصف الفصل
    practical: number; // 🔬 التقييم العملي والنشاط
    final_coursework_total: number; // 💯 مجموع السعي الفصلي (من 50)
    final_exam: number; // 📝 الامتحان النهائي (من 50)
    supplementary_exam?: number | null; // 🔄 امتحان الدور الثاني (إن وجد)
    final_total?: number; // 💯 المجموع الكلي النهائي من 100
    letter_grade?: string; // 🅰️ التقدير الحرفي المعتمد
    is_locked: boolean; // 🔒 هل السعي مقفول ومعتمد رسمياً؟
  }[],
  deptName: string, // 🏢 اسم القسم الأكاديمي
  courseFilterName: string = 'كافة المواد', // 📘 اسم المادة المصفاة للتسمية
  scheme?: AssessmentScheme // 🎛️ المخطط التقييمي للمادة لإخفاء البنود المغلقة
): Promise<void> {
  // 🔍 فحص حالة كل بند إذا كان المخطط متوفراً
  const hasQuiz1 = !scheme || isAssessmentItemActive(scheme.quiz1);
  const hasQuiz2 = !scheme || isAssessmentItemActive(scheme.quiz2);
  const hasAssignment1 = !scheme || isAssessmentItemActive(scheme.assignment1);
  const hasAssignment2 = !scheme || isAssessmentItemActive(scheme.assignment2);
  const hasReport = !scheme || isAssessmentItemActive(scheme.report);
  const hasMidterm = !scheme || isAssessmentItemActive(scheme.midterm);
  const hasPractical = !scheme || isAssessmentItemActive(scheme.practical);

  // 📝 تجهيز البيانات وتحويل الأرقام والتقديرات لصيغة قابلة للتصدير مع إخفاء البنود المغلقة
  const data = grades.map((g, idx) => {
    const rowObj: Record<string, string | number> = {
      seq: idx + 1, // 🔢 التسلسل
      student: g.student_name, // 👤 الطالب
      uniNum: g.university_number, // 🆔 الرقم الجامعي
      course: g.course_name, // 📘 المادة
    };
    if (hasQuiz1) rowObj.q1 = g.quiz1;
    if (hasQuiz2) rowObj.q2 = g.quiz2;
    if (hasAssignment1) rowObj.a1 = g.assignment1;
    if (hasAssignment2) rowObj.a2 = g.assignment2;
    if (hasReport) rowObj.rep = g.report;
    if (hasMidterm) rowObj.mid = g.midterm;
    if (hasPractical) rowObj.prac = g.practical;
    rowObj.coursework = g.final_coursework_total;
    rowObj.finalExam = g.final_exam;
    rowObj.suppExam = g.supplementary_exam ?? '—';
    rowObj.total = g.final_total ?? (g.final_coursework_total + g.final_exam);
    rowObj.gradeLetter = g.letter_grade || '—';
    rowObj.status = g.is_locked ? 'معتمد ومقفل' : 'مسودة قيد الرصد';
    rowObj.dept = deptName;
    return rowObj;
  });

  const columns: { header: string; key: string; width: number }[] = [
    { header: 'ت', key: 'seq', width: 8 },
    { header: 'اسم الطالب الثلاثي', key: 'student', width: 32 },
    { header: 'الرقم الجامعي', key: 'uniNum', width: 18 },
    { header: 'المادة الدراسية', key: 'course', width: 28 },
  ];

  if (hasQuiz1) columns.push({ header: scheme ? `${scheme.quiz1.title_ar} (${scheme.quiz1.max_score})` : 'كويز 1 (5)', key: 'q1', width: 12 });
  if (hasQuiz2) columns.push({ header: scheme ? `${scheme.quiz2.title_ar} (${scheme.quiz2.max_score})` : 'كويز 2 (5)', key: 'q2', width: 12 });
  if (hasAssignment1) columns.push({ header: scheme ? `${scheme.assignment1.title_ar} (${scheme.assignment1.max_score})` : 'واجب 1 (5)', key: 'a1', width: 12 });
  if (hasAssignment2) columns.push({ header: scheme ? `${scheme.assignment2.title_ar} (${scheme.assignment2.max_score})` : 'واجب 2 (5)', key: 'a2', width: 12 });
  if (hasReport) columns.push({ header: scheme ? `${scheme.report.title_ar} (${scheme.report.max_score})` : 'تقرير (5)', key: 'rep', width: 12 });
  if (hasMidterm) columns.push({ header: scheme ? `${scheme.midterm.title_ar} (${scheme.midterm.max_score})` : 'نصفي (15)', key: 'mid', width: 12 });
  if (hasPractical) columns.push({ header: scheme ? `${scheme.practical.title_ar} (${scheme.practical.max_score})` : 'عملي (10)', key: 'prac', width: 12 });
  columns.push(
    { header: 'مجموع السعي (50)', key: 'coursework', width: 18 },
    { header: 'الامتحان النهائي (50)', key: 'finalExam', width: 20 },
    { header: 'الدور الثاني', key: 'suppExam', width: 14 },
    { header: 'المجموع الكلي (100)', key: 'total', width: 20 },
    { header: 'التقدير', key: 'gradeLetter', width: 12 },
    { header: 'حالة السجل', key: 'status', width: 16 },
    { header: 'القسم الأكاديمي', key: 'dept', width: 24 }
  );

  const dateFormatted = new Date().toISOString().slice(0, 10); // 📅 تاريخ اليوم للتسمية
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'سجل_درجات_بولونيا', // 📑 اسم ورقة العمل
        columns,
        data,
        headerColor: 'FF0F2942', // 🎨 كحلي ملكي فاخر
      },
    ],
    `سجل_درجات_بولونيا_${deptName}_${courseFilterName.replace(/\s+/g, '_')}_${dateFormatted}.xlsx`
  );
}

// 📤 دالة تصدير كشف الحضور والغيابات والإنذارات لمسار بولونيا إلى Excel بتنسيق فاخر
export async function exportCustomAttendanceList(
  records: {
    student_name: string; // 👤 اسم الطالب الثلاثي
    university_number: string; // 🆔 الرقم الجامعي
    stage_number: number; // 🎓 رقم المرحلة الدراسية
    study_type: 'morning' | 'evening'; // ☀️ نوع الدراسة (صباحي / مسائي)
    course_name: string; // 📝 اسم المادة الدراسية
    total_hours: number; // ⏳ إجمالي الساعات المقررة
    present_hours?: number; // 🟢 ساعات الحضور الفعلي
    excused_hours: number; // 🔵 ساعات الإجازة الرسمية
    holiday_hours?: number; // 🏖️ ساعات العطلة الرسمية
    unexcused_hours: number; // 🔴 ساعات الغياب بدون عذر
    absence_percentage: number; // 📊 نسبة الغياب الكلية
    warning_status: AttendanceWarningStatus | 'none' | 'first_warning' | 'final_warning' | 'dismissed'; // ⚠️ حالة الإنذار الأكاديمي
    notes?: string; // 📝 ملاحظات
  }[],
  deptName: string // 🏢 اسم القسم الأكاديمي
): Promise<void> {
  // 🏷️ قاموس مسميات وتوصيفات الإنذارات الأكاديمية الرسمية لبولونيا
  const warningLabels: Record<string, string> = {
    safe: 'طبيعي (مستمر بالدوام)',
    none: 'طبيعي (مستمر بالدوام)',
    warning_1: 'إنذار أولي (5%)',
    first_warning: 'إنذار أولي (5%)',
    warning_2: 'إنذار نهائي (7%)',
    final_warning: 'إنذار نهائي (7%)',
    banned: 'حرمان رسمي وتجاوز الحد (10%)',
    dismissed: 'حرمان رسمي وتجاوز الحد (10%)',
  };

  // 📝 تجهيز البيانات وتنسيق نسب وساعات الحضور والإجازات والعطل والغياب
  const data = records.map((r, idx) => ({
    seq: idx + 1, // 🔢 التسلسل
    student: r.student_name, // 👤 اسم الطالب
    uniNum: r.university_number, // 🆔 الرقم الجامعي
    stage: `المرحلة ${r.stage_number}`, // 🎓 المرحلة
    studyType: r.study_type === 'evening' ? 'مسائي' : 'صباحي', // ☀️ نوع الدراسة
    course: r.course_name, // 📘 المادة
    total: r.total_hours, // الساعات المقررة
    present: r.present_hours ?? 0, // 🟢 ساعات الحضور الفعلي
    excused: r.excused_hours, // 🔵 ساعات الإجازة
    holiday: r.holiday_hours ?? 0, // 🏖️ ساعات العطلة الرسمية
    unexcused: r.unexcused_hours, // 🔴 ساعات الغياب
    pct: `${r.absence_percentage.toFixed(1)}%`, // النسبة
    status: warningLabels[r.warning_status] || 'طبيعي', // الموقف الأكاديمي
    notes: r.notes || '—', // ملاحظات
    dept: deptName, // القسم
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10); // 📅 تاريخ اليوم للتسمية
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'سجل_الحضور_والإنذارات', // 📑 اسم ورقة العمل
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'اسم الطالب الثلاثي', key: 'student', width: 32 },
          { header: 'الرقم الجامعي', key: 'uniNum', width: 18 },
          { header: 'المرحلة', key: 'stage', width: 14 },
          { header: 'الدراسة', key: 'studyType', width: 14 },
          { header: 'المادة الدراسية', key: 'course', width: 28 },
          { header: 'الساعات المقررة', key: 'total', width: 16 },
          { header: 'ساعات الحضور (س)', key: 'present', width: 18 },
          { header: 'ساعات الإجازة (س)', key: 'excused', width: 18 },
          { header: 'ساعات العطلة (س)', key: 'holiday', width: 18 },
          { header: 'ساعات الغياب (س)', key: 'unexcused', width: 18 },
          { header: 'نسبة الغياب', key: 'pct', width: 14 },
          { header: 'الموقف والإنذار الأكاديمي', key: 'status', width: 28 },
          { header: 'ملاحظات', key: 'notes', width: 22 },
          { header: 'القسم الأكاديمي', key: 'dept', width: 24 },
        ],
        data,
        headerColor: 'FF0F2942', // 🎨 كحلي ملكي فاخر
      },
    ],
    `سجل_الغيابات_والإنذارات_${deptName}_${dateFormatted}.xlsx`
  );
}

// 📤 1️⃣ دالة تصدير كشف تسليمات التكليف الأكاديمي والدرجات والاستلال إلى Excel بتنسيق فاخر
export async function exportTaskSubmissionsExcel(
  taskTitle: string, // 📌 عنوان التكليف
  courseName: string, // 📘 اسم المادة
  submissions: {
    student_name: string; // 👤 اسم الطالب
    university_number?: string; // 🆔 الرقم الجامعي
    submission_type: 'individual' | 'group'; // 👥 نوع التقديم
    group_members_names?: string[]; // 🤝 أسماء أعضاء الفريق إن وُجد
    review_decision?: 'pending' | 'accepted' | 'rejected' | 'needs_revision'; // ⚖️ قرار التدريسي
    decision_reason?: string; // 💬 سبب القرار
    score?: number; // 💯 الدرجة
    max_score: number; // 🎯 الدرجة العظمى
    plagiarism_percentage?: number; // 📊 نسبة الاستلال
    teacher_feedback?: string; // 📝 ملاحظات التدريسي
    submitted_at?: string; // ⏰ تاريخ ووقت التسليم
    graded_by?: string; // 👨‍🏫 اسم المدقق
  }[],
  deptName: string = 'القسم الأكاديمي' // 🏢 اسم القسم
): Promise<void> {
  const decisionLabels: Record<string, string> = {
    pending: 'قيد التدقيق',
    accepted: 'مقبول ومعتمد',
    rejected: 'مرفوض',
    needs_revision: 'يحتاج تعديل',
  };

  const data = submissions.map((s, idx) => ({
    seq: idx + 1,
    student: s.student_name,
    uniNum: s.university_number || '—',
    type: s.submission_type === 'group' ? 'جماعي (فريق)' : 'فردي',
    groupMembers: s.group_members_names && s.group_members_names.length > 0 ? s.group_members_names.join('، ') : '—',
    decision: decisionLabels[s.review_decision || 'pending'] || 'قيد التدقيق',
    scoreText: s.score !== undefined ? `${s.score} / ${s.max_score}` : `— / ${s.max_score}`,
    plagiarism: s.plagiarism_percentage !== undefined ? `${s.plagiarism_percentage}%` : '—',
    reason: s.decision_reason || '—',
    feedback: s.teacher_feedback || '—',
    submittedAt: s.submitted_at ? new Date(s.submitted_at).toLocaleString('ar-IQ') : '—',
    gradedBy: s.graded_by || '—',
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'تسليمات_التكليف',
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'اسم الطالب', key: 'student', width: 30 },
          { header: 'الرقم الجامعي', key: 'uniNum', width: 18 },
          { header: 'نوع التقديم', key: 'type', width: 14 },
          { header: 'أعضاء الفريق', key: 'groupMembers', width: 34 },
          { header: 'قرار التدقيق', key: 'decision', width: 18 },
          { header: 'الدرجة المرصودة', key: 'scoreText', width: 16 },
          { header: 'نسبة الاستلال', key: 'plagiarism', width: 14 },
          { header: 'سبب القرار', key: 'reason', width: 28 },
          { header: 'ملاحظات الأستاذ', key: 'feedback', width: 30 },
          { header: 'تاريخ التسليم', key: 'submittedAt', width: 22 },
          { header: 'المدقق', key: 'gradedBy', width: 20 },
        ],
        data,
        headerColor: 'FF0F2942',
      },
    ],
    `تسليمات_${taskTitle.replace(/\s+/g, '_')}_${courseName.replace(/\s+/g, '_')}_${dateFormatted}.xlsx`
  );
}

// 📤 2️⃣ دالة تصدير كتالوج كافة تكليفات وواجبات القسم إلى Excel
export async function exportDepartmentTasksCatalogExcel(
  tasks: {
    title: string; // 📌 عنوان التكليف
    course_name: string; // 📘 المادة
    task_type: string; // 🏷️ نوع التكليف
    stage_number: number; // 🎓 المرحلة
    study_type: 'morning' | 'evening' | 'both'; // ☀️ نوع الدراسة
    max_score: number; // 🎯 الدرجة العظمى
    due_date?: string; // ⏳ الموعد النهائي
    submissions_count: number; // 📥 عدد التسليمات
    accepted_count: number; // ✅ المقبولة
    is_submission_open: boolean; // 🔒 حالة الاستقبال
    created_at?: string; // 📅 تاريخ الإنشاء
  }[],
  deptName: string // 🏢 اسم القسم
): Promise<void> {
  const typeMap: Record<string, string> = {
    quiz: 'كويز',
    assignment: 'واجب منزلي',
    report: 'تقرير بحثي',
    midterm: 'امتحان مدتيرم',
    practical: 'امتحان عملي',
  };

  const studyMap: Record<string, string> = {
    morning: 'صباحي',
    evening: 'مسائي',
    both: 'صباحي ومسائي',
  };

  const data = tasks.map((t, idx) => ({
    seq: idx + 1,
    title: t.title,
    course: t.course_name,
    type: typeMap[t.task_type] || t.task_type,
    stage: `المرحلة ${t.stage_number}`,
    study: studyMap[t.study_type] || 'صباحي',
    maxScore: t.max_score,
    submissions: `${t.submissions_count} (مقبول: ${t.accepted_count})`,
    dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString('ar-IQ') : 'غير محدد',
    status: t.is_submission_open ? 'مفتوح للاستقبال' : 'مقفل',
    dept: deptName,
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'دليل_تكليفات_القسم',
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'عنوان التكليف / الواجب', key: 'title', width: 32 },
          { header: 'المادة الدراسية', key: 'course', width: 28 },
          { header: 'النوع', key: 'type', width: 16 },
          { header: 'المرحلة', key: 'stage', width: 14 },
          { header: 'نوع الدراسة', key: 'study', width: 16 },
          { header: 'الدرجة العظمى', key: 'maxScore', width: 14 },
          { header: 'موقف التسليمات', key: 'submissions', width: 22 },
          { header: 'الموعد النهائي', key: 'dueDate', width: 18 },
          { header: 'حالة الاستقبال', key: 'status', width: 18 },
          { header: 'القسم الأكاديمي', key: 'dept', width: 24 },
        ],
        data,
        headerColor: 'FF0F2942',
      },
    ],
    `دليل_تكليفات_${deptName}_${dateFormatted}.xlsx`
  );
}

// 📤 3️⃣ دالة تصدير جدول مراقبات الامتحانات الرسمية للأستاذ إلى Excel
export async function exportTeacherExamDutiesExcel(
  teacherName: string, // 👤 اسم الأستاذ
  duties: {
    course_code: string; // 🔢 كود المادة
    course_name: string; // 📘 اسم المادة
    department_name: string; // 🏢 القسم
    stage_number: number; // 🎓 المرحلة
    study_type: string; // ☀️ نوع الدراسة
    exam_date: string; // 📅 تاريخ الامتحان
    exam_day: string; // 🗓️ اليوم
    exam_period: string; // ⏰ الفترة الامتحانية
    hall_name: string; // 🏛️ القاعة أو المدرج
    duty_role: string; // 🛡️ صفة التكليف
  }[],
  semesterName: string = 'الكورس الأول' // 📚 الفصل الدراسي
): Promise<void> {
  const data = duties.map((d, idx) => ({
    seq: idx + 1,
    courseCode: d.course_code,
    course: d.course_name,
    dept: d.department_name,
    stage: `المرحلة ${d.stage_number}`,
    study: d.study_type === 'evening' ? 'مسائي' : 'صباحي',
    day: d.exam_day,
    date: d.exam_date,
    period: d.exam_period,
    hall: d.hall_name,
    role: d.duty_role,
    teacher: teacherName,
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'جدول_مراقبات_الأستاذ',
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'رمز المادة', key: 'courseCode', width: 14 },
          { header: 'المادة الدراسية', key: 'course', width: 28 },
          { header: 'القسم الأكاديمي', key: 'dept', width: 24 },
          { header: 'المرحلة', key: 'stage', width: 14 },
          { header: 'الدراسة', key: 'study', width: 12 },
          { header: 'اليوم', key: 'day', width: 14 },
          { header: 'التاريخ', key: 'date', width: 16 },
          { header: 'الفترة الامتحانية', key: 'period', width: 22 },
          { header: 'القاعة / المدرج', key: 'hall', width: 20 },
          { header: 'صفة المراقبة', key: 'role', width: 18 },
          { header: 'اسم الأستاذ', key: 'teacher', width: 26 },
        ],
        data,
        headerColor: 'FF0F2942',
      },
    ],
    `جدول_مراقبات_${teacherName.replace(/\s+/g, '_')}_${semesterName.replace(/\s+/g, '_')}_${dateFormatted}.xlsx`
  );
}

// 📤 4️⃣ دالة تصدير مصفوفة إشغال القاعات والمختبرات الشاملة للكلية إلى Excel
export async function exportCampusHallOccupancyExcel(
  dayName: string, // 🗓️ اليوم المختار
  occupancyData: {
    room_name: string; // 🏛️ اسم القاعة / المختبر
    room_type: string; // 🏷️ نوع القاعة
    capacity: number; // 👥 السعة
    building: string; // 🏢 المبنى / الجناح
    slot1_content: string; // ⏰ الفترة 1 (08:30 - 10:30)
    slot2_content: string; // ⏰ الفترة 2 (10:45 - 12:45)
    slot3_content: string; // ⏰ الفترة 3 (01:00 - 03:00)
  }[],
  collegeName: string = 'كلية_ميسان' // 🏛️ اسم الكلية
): Promise<void> {
  const data = occupancyData.map((o, idx) => ({
    seq: idx + 1,
    room: o.room_name,
    type: o.room_type,
    capacity: o.capacity,
    building: o.building,
    slot1: o.slot1_content || 'متاحة (شاغرة)',
    slot2: o.slot2_content || 'متاحة (شاغرة)',
    slot3: o.slot3_content || 'متاحة (شاغرة)',
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: `إشغال_القاعات_${dayName}`,
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'القاعة / المختبر', key: 'room', width: 22 },
          { header: 'النوع', key: 'type', width: 16 },
          { header: 'السعة', key: 'capacity', width: 12 },
          { header: 'الموقع / المبنى', key: 'building', width: 18 },
          { header: 'الفترة 1 (08:30 - 10:30)', key: 'slot1', width: 34 },
          { header: 'الفترة 2 (10:45 - 12:45)', key: 'slot2', width: 34 },
          { header: 'الفترة 3 (01:00 - 03:00)', key: 'slot3', width: 34 },
        ],
        data,
        headerColor: 'FF0F2942',
      },
    ],
    `مصفوفة_إشغال_القاعات_${dayName}_${collegeName}_${dateFormatted}.xlsx`
  );
}

// 📤 5️⃣ دالة تصدير سجل طلبات الأعذار والإجازات الرسمية إلى Excel
export async function exportExcuseRequestsExcel(
  requests: {
    student_name: string; // 👤 اسم الطالب
    university_number?: string; // 🆔 الرقم الجامعي
    course_name: string; // 📘 المادة
    week_number: number; // 📅 رقم الأسبوع
    reason_type: string; // 🏷️ نوع العذر (مرضي / رسمي / طارئ)
    reason_details: string; // 📝 تفاصيل العذر
    document_reference?: string; // 📑 رقم ومرفق الكتاب
    status: 'pending' | 'approved' | 'rejected'; // ⚖️ حالة الطلب
    reviewed_by_name?: string; // 👤 اسم المراجع
    review_notes?: string; // 💬 ملاحظات التدقيق
    created_at: string; // ⏰ تاريخ التقديم
  }[],
  deptName: string // 🏢 اسم القسم
): Promise<void> {
  const statusLabels: Record<string, string> = {
    pending: 'قيد المراجعة',
    approved: 'مقبول ومعتمد',
    rejected: 'مرفوض',
  };

  const data = requests.map((r, idx) => ({
    seq: idx + 1,
    student: r.student_name,
    uniNum: r.university_number || '—',
    course: r.course_name,
    week: `الأسبوع ${r.week_number}`,
    type: r.reason_type,
    details: r.reason_details,
    docRef: r.document_reference || '—',
    status: statusLabels[r.status] || 'قيد المراجعة',
    reviewer: r.reviewed_by_name || '—',
    notes: r.review_notes || '—',
    createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString('ar-IQ') : '—',
    dept: deptName,
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'طلبات_الأعذار_والإجازات',
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'اسم الطالب', key: 'student', width: 30 },
          { header: 'الرقم الجامعي', key: 'uniNum', width: 18 },
          { header: 'المادة الدراسية', key: 'course', width: 28 },
          { header: 'الأسبوع', key: 'week', width: 14 },
          { header: 'نوع العذر', key: 'type', width: 16 },
          { header: 'تفاصيل العذر', key: 'details', width: 32 },
          { header: 'رقم / مرجع الكتاب', key: 'docRef', width: 20 },
          { header: 'حالة القرار', key: 'status', width: 18 },
          { header: 'اسم المدقق', key: 'reviewer', width: 22 },
          { header: 'ملاحظات القرار', key: 'notes', width: 28 },
          { header: 'تاريخ التقديم', key: 'createdAt', width: 18 },
          { header: 'القسم الأكاديمي', key: 'dept', width: 24 },
        ],
        data,
        headerColor: 'FF0F2942',
      },
    ],
    `سجل_الأعذار_والإجازات_${deptName}_${dateFormatted}.xlsx`
  );
}

// 📤 6️⃣ دالة تصدير كشف الدرجات والسعي الأكاديمي الرسمي للطالب إلى Excel
export async function exportStudentTranscriptExcel(
  student: {
    full_name: string; // 👤 اسم الطالب
    university_number: string; // 🆔 الرقم الجامعي
    department_name: string; // 🏢 القسم الأكاديمي
    stage_number: number; // 🎓 المرحلة
    study_type?: string; // ☀️ نوع الدراسة
  },
  coursesGrades: {
    course_code: string; // 🔢 كود المادة
    course_name: string; // 📘 اسم المادة
    credit_hours: number; // ⚖️ عدد الساعات / وحدات ECTS
    semester: number; // 📚 الفصل
    coursework_total: number; // 💯 السعي الفصلي (من 50)
    final_exam?: number | null; // 📝 الامتحان النهائي (من 50)
    final_total: number; // 💯 المجموع الكلي النهائي (من 100)
    letter_grade: string; // 🅰️ التقدير الحرفي
    status_label: string; // ✅ الحالة (ناجح / مكمل)
  }[],
  gpa: number // 📊 المعدل التراكمي
): Promise<void> {
  const data = coursesGrades.map((cg, idx) => ({
    seq: idx + 1,
    code: cg.course_code,
    name: cg.course_name,
    credits: cg.credit_hours,
    semester: cg.semester === 1 ? 'الكورس 1' : 'الكورس 2',
    coursework: cg.coursework_total,
    finalExam: cg.final_exam !== undefined && cg.final_exam !== null ? cg.final_exam : '—',
    total: cg.final_total,
    grade: cg.letter_grade,
    status: cg.status_label,
  }));

  // سطر المعدل التراكمي في نهاية الجدول
  data.push({
    seq: data.length + 1,
    code: 'المعدل التراكمي العام',
    name: `GPA: ${gpa.toFixed(2)}%`,
    credits: coursesGrades.reduce((sum, c) => sum + c.credit_hours, 0),
    semester: '—',
    coursework: 0,
    finalExam: 0,
    total: gpa,
    grade: '—',
    status: 'معتمد رسمياً',
  });

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'وثيقة_السعي_والدرجات',
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'كود المادة', key: 'code', width: 22 },
          { header: 'اسم المادة الدراسية', key: 'name', width: 30 },
          { header: 'الوحدات (ECTS)', key: 'credits', width: 14 },
          { header: 'الفصل', key: 'semester', width: 14 },
          { header: 'السعي الفصلي (50)', key: 'coursework', width: 18 },
          { header: 'الامتحان النهائي (50)', key: 'finalExam', width: 20 },
          { header: 'المجموع الكلي (100)', key: 'total', width: 20 },
          { header: 'التقدير', key: 'grade', width: 12 },
          { header: 'النتيجة والموقف', key: 'status', width: 18 },
        ],
        data,
        headerColor: 'FF0F2942',
      },
    ],
    `وثيقة_درجات_${student.full_name.replace(/\s+/g, '_')}_${student.university_number}_${dateFormatted}.xlsx`
  );
}

// 📤 7️⃣ دالة تصدير كشف الحضور الشخصي للطالب لكافة المواد إلى Excel
export async function exportStudentPersonalAttendanceExcel(
  studentName: string, // 👤 اسم الطالب
  universityNumber: string, // 🆔 الرقم الجامعي
  departmentName: string, // 🏢 القسم
  records: {
    course_name: string; // 📘 المادة
    total_hours: number; // ⏳ الساعات المقررة
    unexcused_hours: number; // ❌ غياب بدون عذر
    excused_hours: number; // 📑 غياب بعذر
    absence_percentage: number; // 📊 نسبة الغياب
    warning_label: string; // ⚠️ الموقف الأكاديمي
  }[]
): Promise<void> {
  const data = records.map((r, idx) => ({
    seq: idx + 1,
    course: r.course_name,
    total: r.total_hours,
    unexcused: r.unexcused_hours,
    excused: r.excused_hours,
    pct: `${r.absence_percentage.toFixed(1)}%`,
    status: r.warning_label,
    student: studentName,
    uniNum: universityNumber,
    dept: departmentName,
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'تقرير_الحضور_والغياب',
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'المادة الدراسية', key: 'course', width: 30 },
          { header: 'الساعات المقررة', key: 'total', width: 16 },
          { header: 'غياب بدون عذر (ساعات)', key: 'unexcused', width: 22 },
          { header: 'غياب بعذر (ساعات)', key: 'excused', width: 20 },
          { header: 'نسبة الغياب', key: 'pct', width: 14 },
          { header: 'الموقف والإنذار الأكاديمي', key: 'status', width: 26 },
          { header: 'اسم الطالب', key: 'student', width: 28 },
          { header: 'الرقم الجامعي', key: 'uniNum', width: 18 },
          { header: 'القسم الأكاديمي', key: 'dept', width: 24 },
        ],
        data,
        headerColor: 'FF0F2942',
      },
    ],
    `تقرير_حضور_${studentName.replace(/\s+/g, '_')}_${universityNumber}_${dateFormatted}.xlsx`
  );
}

// 📤 8️⃣ دالة تصدير الجدول الدراسي الأسبوعي المنظم إلى Excel (للطالب أو الأستاذ)
export async function exportPersonalWeeklyScheduleExcel(
  userName: string, // 👤 اسم صاحب الجدول (الطالب أو التدريسي)
  userRoleLabel: string, // 🏷️ صفة المستخدم (طالب / أستاذ)
  departmentName: string, // 🏢 القسم الأكاديمي
  lectures: {
    day_arabic: string; // 🗓️ اليوم بالعربية
    lecture_order_label: string; // 🥇 تسلسل المحاضرة (الأولى، الثانية...)
    time_slot: string; // ⏰ التوقيت (من - إلى)
    course_name: string; // 📘 اسم المادة
    course_code: string; // 🔢 كود المادة
    room_name: string; // 🏛️ القاعة أو المختبر
    partner_name: string; // 👤 اسم الأستاذ (إذا كان طالباً) أو المرحلة (إذا كان تدريسياً)
    study_type_label: string; // ☀️ الدراسة (صباحي / مسائي)
  }[]
): Promise<void> {
  const data = lectures.map((l, idx) => ({
    seq: idx + 1,
    day: l.day_arabic,
    order: l.lecture_order_label,
    time: l.time_slot,
    course: l.course_name,
    code: l.course_code,
    room: l.room_name,
    partner: l.partner_name,
    study: l.study_type_label,
    owner: userName,
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'الجدول_الأسبوعي',
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'اليوم', key: 'day', width: 14 },
          { header: 'تسلسل المحاضرة', key: 'order', width: 18 },
          { header: 'التوقيت الأكاديمي', key: 'time', width: 22 },
          { header: 'المادة الدراسية', key: 'course', width: 28 },
          { header: 'كود المادة', key: 'code', width: 14 },
          { header: 'القاعة / المختبر', key: 'room', width: 20 },
          { header: userRoleLabel === 'طالب' ? 'أستاذ المادة' : 'المرحلة الدراسية', key: 'partner', width: 26 },
          { header: 'نوع الدراسة', key: 'study', width: 14 },
          { header: 'الاسم', key: 'owner', width: 26 },
        ],
        data,
        headerColor: 'FF0F2942',
      },
    ],
    `الجدول_الأسبوعي_${userName.replace(/\s+/g, '_')}_${dateFormatted}.xlsx`
  );
}

// 📤 9️⃣ دالة تصدير سجل الحضور التفصيلي لمادة دراسية لجميع الأسابيع (1-15) إلى Excel
export async function exportCourseAttendanceMatrixExcel(
  courseName: string, // 📘 اسم المادة
  departmentName: string, // 🏢 اسم القسم
  stageName: string, // 🎓 المرحلة
  studyTypeName: string, // ☀️ الدراسة
  weeksCount: number, // 🔢 عدد الأسابيع (مثلاً 15)
  studentsMatrix: {
    seq: number; // 🔢 التسلسل
    student_name: string; // 👤 اسم الطالب
    university_number: string; // 🆔 الرقم الجامعي
    weekly_status: Record<number, string>; // 📅 حالة كل أسبوع (حاضر / غائب / مجاز)
    unexcused_hours: number; // ❌ ساعات بدون عذر
    excused_hours: number; // 📑 ساعات بعذر
    absence_percentage: number; // 📊 نسبة الغياب
    warning_status_label: string; // ⚠️ الإنذار
  }[]
): Promise<void> {
  // بناء أعمدة الأسابيع ديناميكياً
  const weekCols = Array.from({ length: weeksCount }, (_, i) => ({
    header: `أسبوع ${i + 1}`,
    key: `w${i + 1}`,
    width: 12,
  }));

  const columns = [
    { header: 'ت', key: 'seq', width: 8 },
    { header: 'اسم الطالب الثلاثي', key: 'student', width: 32 },
    { header: 'الرقم الجامعي', key: 'uniNum', width: 18 },
    ...weekCols,
    { header: 'غياب بدون عذر (ساعات)', key: 'unexcused', width: 22 },
    { header: 'غياب بعذر (ساعات)', key: 'excused', width: 20 },
    { header: 'نسبة الغياب', key: 'pct', width: 14 },
    { header: 'الموقف والإنذار', key: 'warning', width: 26 },
  ];

  const data = studentsMatrix.map((s) => {
    const rowObj: Record<string, string | number> = {
      seq: s.seq,
      student: s.student_name,
      uniNum: s.university_number,
      unexcused: s.unexcused_hours,
      excused: s.excused_hours,
      pct: `${s.absence_percentage.toFixed(1)}%`,
      warning: s.warning_status_label,
    };
    for (let w = 1; w <= weeksCount; w++) {
      rowObj[`w${w}`] = s.weekly_status[w] || 'حاضر';
    }
    return rowObj;
  });

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'شيت_الأسابيع_والحضور',
        columns,
        data,
        headerColor: 'FF0F2942',
      },
    ],
    `شيت_حضور_${courseName.replace(/\s+/g, '_')}_${stageName.replace(/\s+/g, '_')}_${dateFormatted}.xlsx`
  );
}

// 📤 🔟 دالة تصدير سجل التعميمات والتبليغات الرسمية إلى Excel
export async function exportCampusAnnouncementsExcel(
  announcements: {
    title: string; // 📌 العنوان
    category: string; // 🏷️ التصنيف
    priority: string; // ⚡ الأهمية
    target_scope: string; // 🎯 النطاق المستهدف
    stage_number?: number; // 🎓 المرحلة
    study_type?: string; // ☀️ الدراسة
    author_name?: string; // 👤 الناشر
    created_at: string; // 📅 تاريخ النشر
    content: string; // 📝 نص التبليغ
  }[],
  deptName: string // 🏢 القسم الأكاديمي
): Promise<void> {
  const categoryLabels: Record<string, string> = {
    general: 'إعلان عام',
    exam_schedule: 'جدول امتحانات',
    tuition: 'أقساط دراسية',
    holiday: 'عطلة رسمية',
    disciplinary: 'إنذار / حرمان',
    uniform: 'الزي الجامعي الموحد',
  };

  const priorityLabels: Record<string, string> = {
    urgent: 'عاجل ومهم جداً',
    high: 'مرتفع الأهمية',
    normal: 'اعتيادي',
  };

  const scopeLabels: Record<string, string> = {
    all: 'الجميع (أساتذة وطلاب)',
    students_only: 'الطلاب فقط',
    teachers_only: 'الأساتذة فقط',
  };

  const data = announcements.map((a, idx) => ({
    seq: idx + 1,
    title: a.title,
    category: categoryLabels[a.category] || a.category,
    priority: priorityLabels[a.priority] || a.priority,
    scope: scopeLabels[a.target_scope] || 'الجميع',
    stage: a.stage_number ? `المرحلة ${a.stage_number}` : 'كافة المراحل',
    study: a.study_type === 'evening' ? 'مسائي' : a.study_type === 'morning' ? 'صباحي' : 'الكل',
    author: a.author_name || 'رئاسة القسم',
    date: a.created_at ? new Date(a.created_at).toLocaleDateString('ar-IQ') : '—',
    content: a.content,
    dept: deptName,
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'سجل_التعميمات_والتبليغات',
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'عنوان التبليغ', key: 'title', width: 32 },
          { header: 'التصنيف', key: 'category', width: 18 },
          { header: 'الأهمية', key: 'priority', width: 16 },
          { header: 'الجمهور المستهدف', key: 'scope', width: 22 },
          { header: 'المرحلة', key: 'stage', width: 14 },
          { header: 'نوع الدراسة', key: 'study', width: 14 },
          { header: 'الجهة الناشرة', key: 'author', width: 22 },
          { header: 'تاريخ النشر', key: 'date', width: 18 },
          { header: 'نص التبليغ الرسمي', key: 'content', width: 45 },
          { header: 'القسم الأكاديمي', key: 'dept', width: 24 },
        ],
        data,
        headerColor: 'FF0F2942',
      },
    ],
    `سجل_التبليغات_${deptName}_${dateFormatted}.xlsx`
  );
}

// 📤 1️⃣1️⃣ دالة تصدير جدول الامتحانات النهائية الرسمية إلى Excel الفاخر
export async function exportFinalExamScheduleExcel(
  departmentName: string, // 🏢 اسم القسم الأكاديمي
  stageNumber: number, // 🎓 رقم المرحلة الدراسية
  semester: 1 | 2, // 📚 رقم الكورس الدراسي
  attemptType: 'first_attempt' | 'second_attempt', // 🎯 الدور الأول أو الثاني
  academicYear: string, // 🗓️ العام الدراسي المعتمد
  slots: {
    course_code: string; // 🔢 كود ورمز المادة
    course_name: string; // 📘 اسم المادة الدراسية
    exam_date: string; // 📅 تاريخ انعقاد الامتحان
    exam_day: string; // 🗓️ اليوم (السبت، الأحد...)
    start_time: string; // ⏰ توقيت البدء
    end_time: string; // ⏰ توقيت النهاية
    hall_name?: string; // 🏛️ اسم القاعة أو المدرج الامتحاني
    notes?: string; // 📝 الملاحظات والتعليمات الامتحانية
  }[]
): Promise<void> {
  // 🗺️ قاموس أسماء الأيام بالعربية الفصيحة
  const dayArabicNames: Record<string, string> = {
    saturday: 'السبت',
    sunday: 'الأحد',
    monday: 'الإثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
  };

  const attemptLabel = attemptType === 'second_attempt' ? 'الدور الثاني (الإكمال)' : 'الدور الأول'; // 🎯 صياغة الدور
  const semesterLabel = semester === 2 ? 'الكورس الثاني' : 'الكورس الأول'; // 📚 صياغة الكورس
  const stageLabel = `المرحلة ${stageNumber}`; // 🎓 صياغة المرحلة

  // 📝 تحويل مصفوفة الامتحانات لصفوف إكسل
  const data = slots.map((s, idx) => ({
    seq: idx + 1, // 🔢 التسلسل
    courseCode: s.course_code || '—', // 🏷️ رمز المادة
    courseName: s.course_name, // 📘 اسم المادة
    examDay: dayArabicNames[s.exam_day] || s.exam_day, // 🗓️ اليوم بالعربية
    examDate: s.exam_date, // 📅 التاريخ
    examTime: `${s.start_time} - ${s.end_time}`, // ⏰ التوقيت
    hall: s.hall_name || 'القاعات الامتحانية المعتمدة', // 🏛️ القاعة
    notes: s.notes || 'الالتزام بالتعليمات الامتحانية والزي الموحد', // 📝 الملاحظات
    dept: departmentName, // 🏢 القسم
    stage: stageLabel, // 🎓 المرحلة
    semester: semesterLabel, // 📚 الكورس
    attempt: attemptLabel, // 🎯 الدور
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10); // 📅 تاريخ اليوم للتسمية
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'جدول_الامتحانات_النهائية', // 📑 اسم ورقة العمل
        columns: [
          { header: 'ت', key: 'seq', width: 8 }, // 🔢 رقم التسلسل
          { header: 'رمز المادة', key: 'courseCode', width: 14 }, // 🏷️ رمز المادة
          { header: 'المادة الدراسية', key: 'courseName', width: 32 }, // 📘 اسم المادة
          { header: 'اليوم', key: 'examDay', width: 14 }, // 🗓️ اليوم
          { header: 'تاريخ الامتحان', key: 'examDate', width: 16 }, // 📅 التاريخ
          { header: 'التوقيت الامتحاني', key: 'examTime', width: 20 }, // ⏰ التوقيت
          { header: 'القاعة / المدرج', key: 'hall', width: 24 }, // 🏛️ القاعة
          { header: 'الملاحظات والتعليمات', key: 'notes', width: 35 }, // 📝 التعليمات
          { header: 'القسم الأكاديمي', key: 'dept', width: 24 }, // 🏢 القسم
          { header: 'المرحلة', key: 'stage', width: 14 }, // 🎓 المرحلة
          { header: 'الكورس', key: 'semester', width: 16 }, // 📚 الكورس
          { header: 'الدور', key: 'attempt', width: 18 }, // 🎯 الدور
        ],
        data, // 📊 مصفوفة البيانات
        headerColor: 'FF0F2942', // 🎨 كحلي ملكي فاخر
      },
    ],
    `جدول_الامتحانات_النهائية_${departmentName.replace(/\s+/g, '_')}_${stageLabel.replace(/\s+/g, '_')}_${dateFormatted}.xlsx`
  );
}








