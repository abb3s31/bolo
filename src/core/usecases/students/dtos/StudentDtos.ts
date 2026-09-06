// 🎓 نماذج نقل البيانات الخاصة بالطلاب (Student DTOs) - Clean Architecture

// 🔗 استيراد كيان الطالب
import { Student } from '@/core/domain/entities/Student';

// 📥 نموذج إنشاء طالب جديد
export interface CreateStudentRequestDto {
  readonly fullName: string; // 👤 الاسم الكامل
  readonly departmentId: string; // 🏛️ معرف القسم
  readonly departmentName: string; // 🏛️ اسم القسم
  readonly stageId?: string; // 🎓 معرف المرحلة
  readonly stageNumber: number; // 🎓 رقم المرحلة (1 - 4)
  readonly universityNumber?: string; // 🔢 الرقم الجامعي (اختياري)
  readonly email?: string; // ✉️ البريد الأكاديمي المخصص (اختياري)
  readonly shiftType?: 'morning' | 'evening'; // ☀️ صباحي / مسائي
}

// 📤 نموذج استجابة إنشاء طالب
export interface StudentResponseDto {
  readonly student: Student; // 🎓 كيان الطالب
  readonly message: string; // 💬 رسالة التوضيح
}

// 📥 نموذج استعلام جلب الطلاب
export interface GetStudentsQueryDto {
  readonly departmentId?: string; // 🏛️ تصفية حسب القسم
  readonly stageNumber?: number; // 🎓 تصفية حسب المرحلة
}
