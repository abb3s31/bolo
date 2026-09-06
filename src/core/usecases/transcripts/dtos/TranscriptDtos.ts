// 📜 نماذج نقل بيانات إصدار الوثيقة وكشف الدرجات الأكاديمي (Academic Transcript DTOs) - Clean Architecture

// 📥 نموذج طلب إصدار وثيقة كشف درجات رسمية
export interface GenerateTranscriptRequestDto {
  readonly studentId: string; // 🎓 معرف الطالب
  readonly issuePurpose?: string; // 🎯 الغرض من الإصدار (لغرض التعيين، إكمال الدراسات العليا...)
  readonly issuedByUserId: string; // 👤 معرف المسؤول مصدر الوثيقة
  readonly issuedByUserName: string; // 👤 اسم المسؤول
}

// 📋 نموذج تفاصيل المادة ضمن كشف الدرجات
export interface TranscriptCourseItemDto {
  readonly courseCode: string; // 🔢 رمز المادة
  readonly courseName: string; // 📚 اسم المادة
  readonly stageNumber: number; // 🎓 المرحلة
  readonly semester: number; // 🗓️ الفصل الدراسي
  readonly creditHours: number; // ⏳ الساعات المعتمدة ECTS
  readonly score: number; // 💯 الدرجة النهائية
  readonly letterRating: string; // 🏆 التقدير الأكاديمي
  readonly status: 'ناجح' | 'راسب' | 'ناجح بالقرار'; // 🟢 موقف المادة
}

// 📤 نموذج مخرجات الوثيقة الأكاديمية الرسمية
export interface GenerateTranscriptResponseDto {
  readonly documentNumber: string; // 📜 رقم الوثيقة الرسمي الفريد
  readonly studentFullName: string; // 👤 اسم الطالب الرباعي واللقب
  readonly universityNumber: string; // 🔢 الرقم الجامعي
  readonly departmentName: string; // 🏛️ القسم الأكاديمي
  readonly graduationYear?: string; // 🎓 سنة التخرج
  readonly totalCreditsCompleted: number; // ⏳ إجمالي الساعات المعتمدة ECTS
  readonly cumulativeGpa: number; // 📊 المعدل التراكمي المئوي
  readonly generalRating: string; // 🏆 التقدير العام (امتياز، جيد جداً...)
  readonly courses: TranscriptCourseItemDto[]; // 📚 جدول تفاصيل المواد والدرجات
  readonly qrVerificationCode: string; // 🔲 رمز التحقق الرقمي المشفر QR
  readonly issuedDate: string; // ⏰ تاريخ الإصدار الرسمي
  readonly isOfficial: boolean; // 🏛️ هل الوثيقة معتمدة ورسمية
}
