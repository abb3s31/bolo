'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 📊 مكتبة قراءة وتوليد ملفات Excel احترافياً - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import ExcelJS from 'exceljs'; // 📦 محرك ExcelJS لتوليد الجداول المجدولة الملونة الفاخرة
import * as XLSX from 'xlsx'; // 📦 مكتبة قراءة وتحليل ملفات Excel
import { sanitizeExcelField } from './grade-utils'; // 🛡️ دالة تطهير الصيغ والرموز
import { generateStrongUniqueEmail, generateStrongPassword, INITIAL_PROFILES } from './mock-data'; // 🎲 توليد الحسابات الموحدة
import { formatEnglishDateTime, translateAcademicField, getTranslatedAuditAction, translateAuditDetails } from './date-utils'; // 📅 دوال تنسيق التاريخ وترجمة البنود والتفاصيل الأكاديمية والأمنية
import { AssessmentScheme, CourseType, FinalExamSchedule, FinalExamSlot, StudentTuitionRecord, UserProfile } from '@/types'; // 🔗 استيراد واجهات المخطط ونوع المادة وجداول الامتحانات والأقساط والملفات الشخصية

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

  const q1Label = scheme ? `${scheme.quiz1.title_ar} (${scheme.quiz1.max_score})` : 'الكويز1 (5)';
  const q2Label = scheme ? `${scheme.quiz2.title_ar} (${scheme.quiz2.max_score})` : 'الكويز2 (5)';
  const a1Label = scheme ? `${scheme.assignment1.title_ar} (${scheme.assignment1.max_score})` : 'الواجب1 (5)';
  const a2Label = scheme ? `${scheme.assignment2.title_ar} (${scheme.assignment2.max_score})` : 'الواجب2 (5)';
  const repLabel = scheme ? `${scheme.report.title_ar} (${scheme.report.max_score})` : 'التقرير (10)';
  const midLabel = scheme ? `${scheme.midterm.title_ar} (${scheme.midterm.max_score})` : 'الميدترم (10)';
  const pracLabel = scheme ? `${scheme.practical.title_ar} (${scheme.practical.max_score})` : 'العملي (10)';
  const finLabel = scheme ? `${scheme.final_exam.title_ar} (${scheme.final_exam.max_score})` : 'النهائي (50)';
  const supLabel = 'امتحان الدور الثاني (50)';

  const columns = [
    { header: 'ت', key: 'seq', width: 10 },
    { header: 'اسم الطالب الرباعي', key: 'std_name', width: 36 },
    { header: q1Label, key: 'q1', width: 18 },
    { header: q2Label, key: 'q2', width: 18 },
    { header: a1Label, key: 'a1', width: 18 },
    { header: a2Label, key: 'a2', width: 18 },
    { header: repLabel, key: 'rep', width: 18 },
    { header: midLabel, key: 'mid', width: 18 },
  ];

  if (hasPractical) {
    columns.push({ header: pracLabel, key: 'prac', width: 18 });
  }
  
  // 🎯 إضافة عمود الامتحان النهائي الدور الأول فقط إذا كان مفعلاً
  if (isFinalActive) {
    columns.push({ header: finLabel, key: 'fin', width: 18 });
  }

  // 🔄 إضافة عمود الدور الثاني فقط في حال كانت فترة الدور الثاني مفعلة رسمياً من رئاسة القسم
  if (isSupActive) {
    columns.push({ header: supLabel, key: 'sup', width: 24 });
  }

  const mappedRows: Record<string, string | number>[] = students.map((std, idx) => {
    const row: Record<string, string | number> = {
      seq: idx + 1,
      std_name: sanitizeExcelField(std.full_name),
      q1: scheme ? (scheme.quiz1.max_score * 0.9) : 4.5,
      q2: scheme ? scheme.quiz2.max_score : 5,
      a1: scheme ? (scheme.assignment1.max_score * 0.8) : 4,
      a2: scheme ? scheme.assignment2.max_score : 5,
      rep: scheme ? (scheme.report.max_score * 0.95) : 9.5,
      mid: scheme ? (scheme.midterm.max_score * 0.9) : 9,
    };
    if (hasPractical) {
      row.prac = scheme ? scheme.practical.max_score : 10;
    }
    // 🎯 إضافة درجة الفاينل في النموذج فقط في حال كان مفعلاً
    if (isFinalActive) {
      row.fin = scheme ? (scheme.final_exam.max_score * 0.9) : 45;
    }
    if (isSupActive) {
      row.sup = ''; // حقل فارغ للدور الثاني
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
      q1: scheme ? (scheme.quiz1.max_score * 0.9) : 4.5,
      q2: scheme ? scheme.quiz2.max_score : 5,
      a1: scheme ? (scheme.assignment1.max_score * 0.8) : 4,
      a2: scheme ? scheme.assignment2.max_score : 5,
      rep: scheme ? (scheme.report.max_score * 0.95) : 9.5,
      mid: scheme ? (scheme.midterm.max_score * 0.9) : 9,
    };
    if (hasPractical) {
      emptyRow.prac = scheme ? scheme.practical.max_score : 10;
    }
    // 🎯 إضافة درجة الفاينل للأسطر الفارغة فقط إذا كان مفعلاً
    if (isFinalActive) {
      emptyRow.fin = scheme ? (scheme.final_exam.max_score * 0.9) : 45;
    }
    if (isSupActive) {
      emptyRow.sup = '';
    }
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

  // 📝 نماذج بيانات مواد تجريبية لتسهيل التعبئة على المستخدم مع حالة الأدوار الافتراضية
  const sampleData: Record<string, string | number>[] = [
    {
      seq: 1,
      name: 'مقدمة في التخصص والمهارات الأكاديمية',
      code: 'CS101',
      stage: 1,
      semester: 1,
      course_type: 'نظري فقط',
      credits: 3,
      theory_teacher: teachersList.length > 0 ? teachersList[0].full_name : '',
      practical_teacher: '',
      is_final: isFinalActive ? 'مفعل' : 'مغلق',
      is_sup: isSupActive ? 'مفعل' : 'مغلق',
    },
    {
      seq: 2,
      name: 'أساسيات البرمجة والتراكيب المنطقية',
      code: 'CS102',
      stage: 1,
      semester: 1,
      course_type: 'نظري وعملي',
      credits: 5,
      theory_teacher: teachersList.length > 0 ? teachersList[0].full_name : '',
      practical_teacher: teachersList.length > 1 ? teachersList[1].full_name : (teachersList[0]?.full_name || ''),
      is_final: isFinalActive ? 'مفعل' : 'مغلق',
      is_sup: isSupActive ? 'مفعل' : 'مغلق',
    },
    {
      seq: 3,
      name: 'اللغة الإنجليزية التخصصية 1',
      code: 'ENG101',
      stage: 1,
      semester: 1,
      course_type: 'نظري فقط',
      credits: 2,
      theory_teacher: '',
      practical_teacher: '',
      is_final: isFinalActive ? 'مفعل' : 'مغلق',
      is_sup: isSupActive ? 'مفعل' : 'مغلق',
    },
    {
      seq: 4,
      name: 'الرياضيات المتقطعة والجبر الخطي',
      code: 'MTH101',
      stage: 1,
      semester: 2,
      course_type: 'نظري فقط',
      credits: 4,
      theory_teacher: '',
      practical_teacher: '',
      is_final: isFinalActive ? 'مفعل' : 'مغلق',
      is_sup: isSupActive ? 'مفعل' : 'مغلق',
    },
    {
      seq: 5,
      name: 'البرمجة كائنية التوجه (OOP)',
      code: 'CS201',
      stage: 2,
      semester: 1,
      course_type: 'نظري وعملي',
      credits: 5,
      theory_teacher: '',
      practical_teacher: '',
      is_final: isFinalActive ? 'مفعل' : 'مغلق',
      is_sup: isSupActive ? 'مفعل' : 'مغلق',
    },
  ];

  // 📜 صفوف إضافية فارغة جاهزة للإدخال المباشر
  for (let i = 6; i <= 30; i++) {
    sampleData.push({
      seq: i,
      name: '',
      code: '',
      stage: Math.min(4, Math.floor((i - 1) / 8) + 1),
      semester: ((i - 1) % 2) + 1,
      course_type: 'نظري وعملي',
      credits: 3,
      theory_teacher: '',
      practical_teacher: '',
      is_final: isFinalActive ? 'مفعل' : 'مغلق',
      is_sup: isSupActive ? 'مفعل' : 'مغلق',
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
      details: 'حقل إلزامي. اكتب اسم المادة الرسمي بالعربية (مثال: البرمجة الكينونية، حقوق الإنسان).',
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
    {
      item: 'أستاذ النظري وأستاذ العملي',
      details: 'حقول اختيارية. يمكنك كتابة الاسم المطابق للأستاذ من ورقة (قائمة_أساتذة_القسم) ليتم تكليفه تلقائياً.',
    },
    {
      item: 'حالة الامتحان النهائي (الدور الأول)',
      details: isFinalActive 
        ? 'مفعل ومفتوح حالياً في القسم: يمكنك كتابة (مفعل) أو (مغلق). الافتراضي: مغلق.' 
        : 'مغلق ومحجوب حالياً في القسم: الافتراضي مغلق ويقتصر على السعي فقط.',
    },
    {
      item: 'حالة فترة الدور الثاني (الإكمال)',
      details: isSupActive 
        ? 'مفعلة ومفتوحة حالياً في القسم: يمكنك كتابة (مفعل) أو (مغلق). الافتراضي: مغلق.' 
        : 'مغلقة حالياً في القسم: الافتراضي مغلق.',
    },
  ];

  const sheetsToExport = [
    {
      sheetName: 'بيانات_المواد',
      columns: [
        { header: 'الرقم', key: 'seq', width: 10 },
        { header: 'اسم المادة الدراسية بالعربية *', key: 'name', width: 35 },
        { header: 'رمز المادة (الكود)', key: 'code', width: 18 },
        { header: 'المرحلة الدراسية (1-4) *', key: 'stage', width: 22 },
        { header: 'الكورس (1 أو 2) *', key: 'semester', width: 18 }, // 📊 تعديل رأس العمود بنموذج إكسل ليكون الكورس بدلاً من الفصل
        { header: 'نوع المادة (نظري وعملي / نظري فقط) *', key: 'course_type', width: 32 },
        { header: 'الساعات المعتمدة ECTS *', key: 'credits', width: 22 },
        { header: 'أستاذ النظري (اختياري)', key: 'theory_teacher', width: 30 },
        { header: 'أستاذ العملي (اختياري)', key: 'practical_teacher', width: 30 },
        { header: 'الامتحان النهائي (مفعل / مغلق)', key: 'is_final', width: 26 },
        { header: 'الدور الثاني (مفعل / مغلق)', key: 'is_sup', width: 26 },
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

// 📤 دالة تصدير قائمة الأساتذة المحددين إلى Excel بتنسيق فاخر
export async function exportCustomTeachersList(teachers: { full_name: string; gender?: string; generated_email: string; temp_password?: string }[], deptName: string): Promise<void> {
  const data = teachers.map((t, idx) => ({
    seq: idx + 1,
    name: t.full_name,
    gender: t.gender === 'female' ? 'أنثى' : 'ذكر',
    email: t.generated_email,
    pass: t.temp_password || '••••••••',
    dept: deptName,
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'كادر التدريسيين المحددين',
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'اسم الأستاذ واللقب الأكاديمي', key: 'name', width: 32 },
          { header: 'الجنس', key: 'gender', width: 14 },
          { header: 'البريد الأكاديمي', key: 'email', width: 32 },
          { header: 'كلمة المرور', key: 'pass', width: 22 },
          { header: 'القسم الأكاديمي', key: 'dept', width: 25 },
        ],
        data,
        headerColor: 'FF0F2942', // كحلي ملكي فاخر
      },
    ],
    `اساتذة_محددين_قسم_${deptName}_${dateFormatted}.xlsx`
  );
}

// 📤 دالة تصدير قائمة الطلاب المحددين إلى Excel بتنسيق فاخر
export async function exportCustomStudentsList(students: { full_name: string; university_number: string; stage_number?: number; study_type?: string; gender?: string; generated_email: string; temp_password?: string }[], deptName: string): Promise<void> {
  const data = students.map((s, idx) => ({
    seq: idx + 1,
    name: s.full_name,
    uniNum: s.university_number,
    stage: `المرحلة ${s.stage_number || 1}`,
    studyType: s.study_type === 'evening' ? 'مسائي' : 'صباحي',
    gender: s.gender === 'female' ? 'أنثى' : 'ذكر',
    email: s.generated_email,
    pass: s.temp_password || '••••••••',
    dept: deptName,
  }));

  const dateFormatted = new Date().toISOString().slice(0, 10);
  await generateAndDownloadExcel(
    [
      {
        sheetName: 'طلبة القسم المحددين',
        columns: [
          { header: 'ت', key: 'seq', width: 8 },
          { header: 'اسم الطالب الثلاثي', key: 'name', width: 32 },
          { header: 'الرقم الجامعي', key: 'uniNum', width: 18 },
          { header: 'المرحلة الدراسية', key: 'stage', width: 16 },
          { header: 'الفترة الدراسية', key: 'studyType', width: 18 },
          { header: 'الجنس', key: 'gender', width: 14 },
          { header: 'البريد الأكاديمي', key: 'email', width: 32 },
          { header: 'كلمة المرور', key: 'pass', width: 22 },
          { header: 'القسم الأكاديمي', key: 'dept', width: 25 },
        ],
        data,
        headerColor: 'FF0F2942', // كحلي ملكي فاخر
      },
    ],
    `طلبة_محددين_قسم_${deptName}_${dateFormatted}.xlsx`
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
      day: 'الأحد',
      start_time: '08:30 ص',
      end_time: '10:30 ص',
      room: 'قاعة 101',
      lecture_type: 'محاضرة نظرية',
      teacher_name: teachersList[0]?.full_name || '',
      notes: 'محاضرة أسبوعية منتظمة',
    },
    {
      seq: 2,
      course_name: coursesList[1]?.name || 'البرمجة الكينونية المتقدمة',
      stage: coursesList[1]?.stage_number || 1,
      semester: coursesList[1]?.semester || 1,
      study_type: 'صباحي',
      day: 'الإثنين',
      start_time: '10:30 ص',
      end_time: '12:30 م',
      room: 'مختبر الحاسوب 1',
      lecture_type: 'مختبر وتطبيق عملي',
      teacher_name: teachersList[1]?.full_name || teachersList[0]?.full_name || '',
      notes: 'جلسة تطبيق عملي معملية',
    },
    {
      seq: 3,
      course_name: coursesList[2]?.name || 'قواعد البيانات العلائقية',
      stage: coursesList[2]?.stage_number || 2,
      semester: coursesList[2]?.semester || 1,
      study_type: 'مسائي',
      day: 'الثلاثاء',
      start_time: '02:00 م',
      end_time: '04:00 م',
      room: 'قاعة 202',
      lecture_type: 'محاضرة نظرية',
      teacher_name: teachersList[2]?.full_name || teachersList[0]?.full_name || '',
      notes: 'دراسة مسائية',
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
    day: string;
    start_time: string;
    end_time: string;
    room: string;
    type?: string;
    teacher_name?: string;
    notes?: string;
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







