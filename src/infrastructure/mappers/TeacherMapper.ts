// 🔄 محول بيانات التدريسي (Teacher Data Mapper) - Clean Architecture

// 🔗 استيراد الكيان وكائنات القيمة والأنواع
import { Teacher } from '@/core/domain/entities/Teacher';
import { Email } from '@/core/domain/value-objects/Email';
import { UserProfile } from '@/types';

// 🧱 صنف محول بيانات التدريسي
export class TeacherMapper {
  // 📥 تحويل كائن قاعدة البيانات إلى كيان نطاق نقي
  public static toDomain(raw: UserProfile): Teacher {
    const email = Email.create(raw.generated_email || `${raw.university_number}@sadiq.edu.iq`);

    return new Teacher({
      id: raw.id,
      fullName: raw.full_name,
      academicTitle: raw.role === 'department_head' ? 'رئيس قسم' : 'تدريسي',
      specialization: raw.department_name || 'التعليم الأكاديمي',
      email,
      departmentId: raw.department_id || 'dept-1',
      departmentName: raw.department_name || 'هندسة تقنيات الحاسوب',
      assignedSubjectIds: [],
      isActive: raw.is_active,
    });
  }

  // 📤 تحويل كيان النطاق إلى نموذج التخزين
  public static toPersistence(teacher: Teacher): UserProfile {
    return {
      id: teacher.id,
      full_name: teacher.fullName,
      role: 'teacher',
      university_number: teacher.id,
      generated_email: teacher.email.getValue(),
      department_id: teacher.departmentId,
      department_name: teacher.departmentName,
      is_active: teacher.isActive,
    };
  }
}
