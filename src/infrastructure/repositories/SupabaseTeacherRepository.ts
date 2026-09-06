// ⚡ مستودع التدريسيين السحابي عبر Supabase (Supabase Teacher Repository) - SOLID LSP & Clean Architecture
// 🏛️ مسار بولونيا - جامعة الإمام جعفر الصادق (ع) فرع ميسان

// 🔗 استيراد العقود والكيانات والمحولات
import { ITeacherRepository } from '@/core/domain/repositories/ITeacherRepository';
import { Teacher } from '@/core/domain/entities/Teacher';
import { Email } from '@/core/domain/value-objects/Email';
import { TeacherMapper } from '../mappers/TeacherMapper';
import { supabase } from '@/lib/supabase-client';
import { UserProfile, TeacherRecord, DepartmentHeadRecord, DepartmentRapporteurRecord } from '@/types';

// 🧱 صنف مستودع التدريسيين السحابي
export class SupabaseTeacherRepository implements ITeacherRepository {
  // 📥 جلب جميع الأساتذة من قاعدة بيانات Supabase
  public async getAll(): Promise<Teacher[]> {
    try {
      // 🔍 استعلام الجداول المخصصة بالتوازي (teachers, department_heads, department_rapporteurs)
      const [tRes, dhRes, drRes] = await Promise.all([
        supabase.from('teachers').select('*').order('full_name', { ascending: true }),
        supabase.from('department_heads').select('*').order('full_name', { ascending: true }),
        supabase.from('department_rapporteurs').select('*').order('full_name', { ascending: true }),
      ]);

      const list: UserProfile[] = [];

      if (tRes.data && tRes.data.length > 0) {
        (tRes.data as TeacherRecord[]).forEach(item => {
          list.push({
            id: item.id,
            auth_user_id: item.auth_user_id,
            full_name: item.full_name,
            role: 'teacher',
            department_id: item.department_id,
            department_name: item.department_name,
            university_number: item.id,
            generated_email: item.email,
            temp_password: item.temp_password,
            is_active: item.is_active,
            created_at: item.created_at,
          });
        });
      }

      if (dhRes.data && dhRes.data.length > 0) {
        (dhRes.data as DepartmentHeadRecord[]).forEach(item => {
          list.push({
            id: item.id,
            auth_user_id: item.auth_user_id,
            full_name: item.full_name,
            role: 'department_head',
            department_id: item.department_id,
            department_name: item.department_name,
            university_number: item.id,
            generated_email: item.email,
            temp_password: item.temp_password,
            is_active: item.is_active,
            created_at: item.created_at,
          });
        });
      }

      if (drRes.data && drRes.data.length > 0) {
        (drRes.data as DepartmentRapporteurRecord[]).forEach(item => {
          list.push({
            id: item.id,
            auth_user_id: item.auth_user_id,
            full_name: item.full_name,
            role: 'rapporteur',
            department_id: item.department_id,
            department_name: item.department_name,
            university_number: item.id,
            generated_email: item.email,
            temp_password: item.temp_password,
            is_active: item.is_active,
            created_at: item.created_at,
          });
        });
      }

      if (list.length > 0) {
        return list.map(item => TeacherMapper.toDomain(item));
      }

      // 🔄 مسار توافقي احتياطي عبر عرض profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['teacher', 'department_head', 'rapporteur'])
        .order('full_name', { ascending: true });

      if (error || !data) {
        return [];
      }

      return (data as UserProfile[]).map(item => TeacherMapper.toDomain(item));
    } catch {
      return [];
    }
  }

  // 🔍 جلب أستاذ بالمعرف
  public async getById(id: string): Promise<Teacher | null> {
    try {
      const { data: tData } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (tData) {
        const item = tData as TeacherRecord;
        const profile: UserProfile = {
          id: item.id,
          auth_user_id: item.auth_user_id,
          full_name: item.full_name,
          role: 'teacher',
          department_id: item.department_id,
          department_name: item.department_name,
          university_number: item.id,
          generated_email: item.email,
          temp_password: item.temp_password,
          is_active: item.is_active,
          created_at: item.created_at,
        };
        return TeacherMapper.toDomain(profile);
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!data) return null;
      return TeacherMapper.toDomain(data as UserProfile);
    } catch {
      return null;
    }
  }

  // 📧 جلب أستاذ بالبريد الإلكتروني
  public async getByEmail(email: Email): Promise<Teacher | null> {
    try {
      const { data: tData } = await supabase
        .from('teachers')
        .select('*')
        .ilike('email', email.getValue())
        .maybeSingle();

      if (tData) {
        const item = tData as TeacherRecord;
        const profile: UserProfile = {
          id: item.id,
          auth_user_id: item.auth_user_id,
          full_name: item.full_name,
          role: 'teacher',
          department_id: item.department_id,
          department_name: item.department_name,
          university_number: item.id,
          generated_email: item.email,
          temp_password: item.temp_password,
          is_active: item.is_active,
          created_at: item.created_at,
        };
        return TeacherMapper.toDomain(profile);
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('generated_email', email.getValue())
        .maybeSingle();

      if (!data) return null;
      return TeacherMapper.toDomain(data as UserProfile);
    } catch {
      return null;
    }
  }

  // 🏛️ جلب أساتذة قسم محدد
  public async getByDepartment(departmentId: string): Promise<Teacher[]> {
    try {
      const { data: tData } = await supabase
        .from('teachers')
        .select('*')
        .eq('department_id', departmentId);

      if (tData && tData.length > 0) {
        const list = (tData as TeacherRecord[]).map(item => {
          const profile: UserProfile = {
            id: item.id,
            auth_user_id: item.auth_user_id,
            full_name: item.full_name,
            role: 'teacher',
            department_id: item.department_id,
            department_name: item.department_name,
            university_number: item.id,
            generated_email: item.email,
            temp_password: item.temp_password,
            is_active: item.is_active,
            created_at: item.created_at,
          };
          return TeacherMapper.toDomain(profile);
        });
        return list;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('department_id', departmentId)
        .in('role', ['teacher', 'department_head', 'rapporteur']);

      if (!data) return [];
      return (data as UserProfile[]).map(item => TeacherMapper.toDomain(item));
    } catch {
      return [];
    }
  }

  // 💾 حفظ أو تحديث أستاذ في Supabase
  public async save(teacher: Teacher): Promise<void> {
    const record: TeacherRecord = {
      id: teacher.id,
      department_id: teacher.departmentId,
      department_name: teacher.departmentName,
      full_name: teacher.fullName,
      email: teacher.email.getValue(),
      is_active: teacher.isActive,
      created_at: new Date().toISOString(),
    };

    const { error: tError } = await supabase.from('teachers').upsert(record, { onConflict: 'id' });

    if (tError) {
      const persistenceData = TeacherMapper.toPersistence(teacher);
      const { error } = await supabase.from('profiles').upsert(persistenceData, { onConflict: 'id' });
      if (error) {
        throw new Error(`فشل حفظ الأستاذ في Supabase: ${error.message} ❌`);
      }
    }
  }

  // 🗑️ حذف أستاذ
  public async delete(id: string): Promise<void> {
    await supabase.from('teachers').delete().eq('id', id);
    await supabase.from('profiles').delete().eq('id', id);
  }
}
