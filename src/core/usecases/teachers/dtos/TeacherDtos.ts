//  نماذج نقل البيانات الخاصة بالأساتذة والتدريسيين (Teacher DTOs)

// 🔗 استيراد كيان الأستاذ
import { Teacher } from '@/core/domain/entities/Teacher';

// 📥 نموذج إنشاء أستاذ جديد
export interface CreateTeacherRequestDto {
  readonly fullName: string; // 👤 الاسم الكامل
  readonly academicTitle: string; // 🎓 اللقب العلمي
  readonly specialization: string; // 🔬 التخصص الدقيق
  readonly email: string; // 📧 البريد الرسمي
  readonly departmentId: string; // 🏛️ معرف القسم
  readonly departmentName: string; // 🏛️ اسم القسم
  readonly assignedSubjectIds?: string[]; // 📚 المواد المخصصة
  readonly phone?: string; // 📱 رقم الهاتف
}

// 📤 نموذج استجابة الأستاذ
export interface TeacherResponseDto {
  readonly teacher: Teacher; //  كيان الأستاذ
  readonly message: string; // 💬 الرسالة
}
