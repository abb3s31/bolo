// ⚡ مستودع الطلاب السحابي عبر Supabase (Supabase Student Repository) - SOLID LSP & Clean Architecture
// 🏛️ مسار بولونيا - جامعة الإمام جعفر الصادق (ع) فرع ميسان

// 🔗 استيراد العقود والكيانات والمحولات
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { Student } from '@/core/domain/entities/Student';
import { Email } from '@/core/domain/value-objects/Email';
import { UniversityNumber } from '@/core/domain/value-objects/UniversityNumber';
import { StudentMapper } from '../mappers/StudentMapper';
import { supabase } from '@/lib/supabase-client';
import { UserProfile, StudentRecord } from '@/types';

// 🧱 صنف مستودع الطلاب السحابي المرتبط بجدول students المستقل
export class SupabaseStudentRepository implements IStudentRepository {
  // 📥 جلب جميع الطلاب من جدول students المستقل في Supabase
  public async getAll(): Promise<Student[]> {
    try {
      // 🔍 محاولة الجلب أولاً من جدول students المستقل
      const { data: sData, error: sError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (!sError && sData && sData.length > 0) {
        return (sData as StudentRecord[]).map(item => {
          const profile: UserProfile = {
            id: item.id,
            auth_user_id: item.auth_user_id,
            full_name: item.full_name,
            role: 'student',
            department_id: item.department_id,
            department_name: item.department_name,
            stage_id: item.stage_id,
            stage_number: item.stage_number,
            university_number: item.university_number,
            generated_email: item.email,
            gender: item.gender,
            temp_password: item.temp_password,
            is_active: item.is_active,
            is_graduated: item.is_graduated,
            graduation_status: item.graduation_status,
            created_at: item.created_at,
          };
          return StudentMapper.toDomain(profile);
        });
      }

      // 🔄 مسار توافقي احتياطي عبر عرض profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (error || !data) {
        return [];
      }

      return (data as UserProfile[]).map(item => StudentMapper.toDomain(item));
    } catch {
      return [];
    }
  }

  // 🔍 جلب طالب بالمعرف
  public async getById(id: string): Promise<Student | null> {
    try {
      const { data: sData, error: sError } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!sError && sData) {
        const item = sData as StudentRecord;
        const profile: UserProfile = {
          id: item.id,
          auth_user_id: item.auth_user_id,
          full_name: item.full_name,
          role: 'student',
          department_id: item.department_id,
          department_name: item.department_name,
          stage_id: item.stage_id,
          stage_number: item.stage_number,
          university_number: item.university_number,
          generated_email: item.email,
          gender: item.gender,
          temp_password: item.temp_password,
          is_active: item.is_active,
          is_graduated: item.is_graduated,
          graduation_status: item.graduation_status,
          created_at: item.created_at,
        };
        return StudentMapper.toDomain(profile);
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'student')
        .maybeSingle();

      if (!data) return null;
      return StudentMapper.toDomain(data as UserProfile);
    } catch {
      return null;
    }
  }

  // 🔢 جلب طالب بالرقم الجامعي
  public async getByUniversityNumber(uniNum: UniversityNumber): Promise<Student | null> {
    try {
      const { data: sData, error: sError } = await supabase
        .from('students')
        .select('*')
        .eq('university_number', uniNum.getValue())
        .maybeSingle();

      if (!sError && sData) {
        const item = sData as StudentRecord;
        const profile: UserProfile = {
          id: item.id,
          auth_user_id: item.auth_user_id,
          full_name: item.full_name,
          role: 'student',
          department_id: item.department_id,
          department_name: item.department_name,
          stage_id: item.stage_id,
          stage_number: item.stage_number,
          university_number: item.university_number,
          generated_email: item.email,
          gender: item.gender,
          temp_password: item.temp_password,
          is_active: item.is_active,
          is_graduated: item.is_graduated,
          graduation_status: item.graduation_status,
          created_at: item.created_at,
        };
        return StudentMapper.toDomain(profile);
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('university_number', uniNum.getValue())
        .eq('role', 'student')
        .maybeSingle();

      if (!data) return null;
      return StudentMapper.toDomain(data as UserProfile);
    } catch {
      return null;
    }
  }

  // 📧 جلب طالب بالبريد الإلكتروني
  public async getByEmail(email: Email): Promise<Student | null> {
    try {
      const { data: sData, error: sError } = await supabase
        .from('students')
        .select('*')
        .ilike('email', email.getValue())
        .maybeSingle();

      if (!sError && sData) {
        const item = sData as StudentRecord;
        const profile: UserProfile = {
          id: item.id,
          auth_user_id: item.auth_user_id,
          full_name: item.full_name,
          role: 'student',
          department_id: item.department_id,
          department_name: item.department_name,
          stage_id: item.stage_id,
          stage_number: item.stage_number,
          university_number: item.university_number,
          generated_email: item.email,
          gender: item.gender,
          temp_password: item.temp_password,
          is_active: item.is_active,
          is_graduated: item.is_graduated,
          graduation_status: item.graduation_status,
          created_at: item.created_at,
        };
        return StudentMapper.toDomain(profile);
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('generated_email', email.getValue())
        .eq('role', 'student')
        .maybeSingle();

      if (!data) return null;
      return StudentMapper.toDomain(data as UserProfile);
    } catch {
      return null;
    }
  }

  // 🏛️ جلب طلاب قسم ومرحلة
  public async getByDepartmentAndStage(
    departmentId: string,
    stageNumber: number
  ): Promise<Student[]> {
    try {
      const { data: sData, error: sError } = await supabase
        .from('students')
        .select('*')
        .eq('department_id', departmentId)
        .eq('stage_number', stageNumber);

      if (!sError && sData && sData.length > 0) {
        return (sData as StudentRecord[]).map(item => {
          const profile: UserProfile = {
            id: item.id,
            auth_user_id: item.auth_user_id,
            full_name: item.full_name,
            role: 'student',
            department_id: item.department_id,
            department_name: item.department_name,
            stage_id: item.stage_id,
            stage_number: item.stage_number,
            university_number: item.university_number,
            generated_email: item.email,
            gender: item.gender,
            temp_password: item.temp_password,
            is_active: item.is_active,
            is_graduated: item.is_graduated,
            graduation_status: item.graduation_status,
            created_at: item.created_at,
          };
          return StudentMapper.toDomain(profile);
        });
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('department_id', departmentId)
        .eq('stage_number', stageNumber)
        .eq('role', 'student');

      if (!data) return [];
      return (data as UserProfile[]).map(item => StudentMapper.toDomain(item));
    } catch {
      return [];
    }
  }

  // 💾 حفظ أو تحديث طالب في جدول students المستقل في Supabase
  public async save(student: Student): Promise<void> {
    const record: StudentRecord = {
      id: student.id,
      department_id: student.departmentId,
      department_name: student.departmentName,
      stage_id: student.stageId,
      stage_number: student.stageNumber,
      full_name: student.fullName,
      university_number: student.universityNumber.getValue(),
      email: student.email.getValue(),
      is_active: student.isActive,
      created_at: student.enrolledAt,
    };

    // ⚡ حفظ في جدول students المستقل
    const { error: sError } = await supabase.from('students').upsert(record, { onConflict: 'id' });

    if (sError) {
      // محاولة تراجعية في profiles
      const persistenceData = StudentMapper.toPersistence(student);
      const { error } = await supabase.from('profiles').upsert(persistenceData, { onConflict: 'id' });
      if (error) {
        throw new Error(`فشل حفظ الطالب في Supabase: ${error.message} ❌`);
      }
    }
  }

  // 💾 حفظ مجموعة طلاب في جدول students المستقل
  public async saveBatch(students: Student[]): Promise<void> {
    const recordList: StudentRecord[] = students.map(student => ({
      id: student.id,
      department_id: student.departmentId,
      department_name: student.departmentName,
      stage_id: student.stageId,
      stage_number: student.stageNumber,
      full_name: student.fullName,
      university_number: student.universityNumber.getValue(),
      email: student.email.getValue(),
      is_active: student.isActive,
      created_at: student.enrolledAt,
    }));

    const { error: sError } = await supabase.from('students').upsert(recordList, { onConflict: 'id' });

    if (sError) {
      const persistenceList = students.map(s => StudentMapper.toPersistence(s));
      const { error } = await supabase.from('profiles').upsert(persistenceList, { onConflict: 'id' });
      if (error) {
        throw new Error(`فشل حفظ دفعة الطلاب في Supabase: ${error.message} ❌`);
      }
    }
  }

  // 🗑️ حذف طالب
  public async delete(id: string): Promise<void> {
    await supabase.from('students').delete().eq('id', id);
    await supabase.from('profiles').delete().eq('id', id);
  }
}
