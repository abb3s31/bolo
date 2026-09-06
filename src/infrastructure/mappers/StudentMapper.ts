// 🔄 محول بيانات الطالب (Student Data Mapper) - Clean Architecture Interface Adapter

// 🔗 استيراد الكيان وكائنات القيمة والأنواع
import { Student } from '@/core/domain/entities/Student';
import { Email } from '@/core/domain/value-objects/Email';
import { UniversityNumber } from '@/core/domain/value-objects/UniversityNumber';
import { UserProfile } from '@/types';

// 🧱 صنف محول بيانات الطالب
export class StudentMapper {
  // 📥 تحويل كائن قاعدة البيانات / الواجهة إلى كيان نطاق نقي (To Domain)
  public static toDomain(raw: UserProfile): Student {
    // 📧 تحويل البريد لكائن قيمة
    const email = Email.create(raw.generated_email || `${raw.university_number}@sadiq.edu.iq`);
    // 🔢 تحويل الرقم الجامعي لكائن قيمة
    const universityNumber = UniversityNumber.create(raw.university_number);

    // 🧱 إنشاء كيان الطالب
    return new Student({
      id: raw.id,
      fullName: raw.full_name,
      universityNumber,
      email,
      departmentId: raw.department_id || 'dept-1',
      departmentName: raw.department_name || 'هندسة تقنيات الحاسوب',
      stageId: raw.stage_id || 'stage-dept-1-1',
      stageNumber: raw.stage_number || 1,
      shiftType: 'morning',
      isActive: raw.is_active,
      enrolledAt: raw.created_at || new Date().toISOString(),
    });
  }

  // 📤 تحويل كيان النطاق إلى كائن بيانات لقاعدة البيانات / العرض (To Persistence / DTO)
  public static toPersistence(student: Student): UserProfile {
    return {
      id: student.id,
      full_name: student.fullName,
      role: 'student',
      university_number: student.universityNumber.getValue(),
      generated_email: student.email.getValue(),
      department_id: student.departmentId,
      department_name: student.departmentName,
      stage_id: student.stageId,
      stage_number: student.stageNumber,
      is_active: student.isActive,
      created_at: student.enrolledAt,
    };
  }
}
