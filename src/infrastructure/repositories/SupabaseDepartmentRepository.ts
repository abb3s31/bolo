// ⚡ مستودع الأقسام العلمية السحابي عبر Supabase (Supabase Department Repository) - Clean Architecture

// 🔗 استيراد العقود والكيانات
import { IDepartmentRepository } from '@/core/domain/repositories/IDepartmentRepository';
import { Department } from '@/core/domain/entities/Department';
import { supabase } from '@/lib/supabase-client';
import { Department as DepartmentType } from '@/types';

// 🧱 صنف مستودع الأقسام السحابي
export class SupabaseDepartmentRepository implements IDepartmentRepository {
  // 📥 جلب جميع الأقسام من جدول departments
  public async getAll(): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data) {
      console.warn('⚠️ تعذر جلب الأقسام من Supabase:', error?.message);
      return [];
    }

    return (data as DepartmentType[]).map(
      raw =>
        new Department({
          id: raw.id,
          name: raw.name,
          code: raw.code,
          headOfDepartmentId: raw.head_id,
          headOfDepartmentName: raw.head_name,
          stagesCount: 4,
          isActive: true,
          description: `قسم ${raw.name} الأكاديمي`,
        })
    );
  }

  // 🔍 جلب قسم بالمعرف
  public async getById(id: string): Promise<Department | null> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const raw = data as DepartmentType;
    return new Department({
      id: raw.id,
      name: raw.name,
      code: raw.code,
      headOfDepartmentId: raw.head_id,
      headOfDepartmentName: raw.head_name,
      stagesCount: 4,
      isActive: true,
    });
  }

  // 🔤 جلب قسم بالرمز
  public async getByCode(code: string): Promise<Department | null> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const raw = data as DepartmentType;
    return new Department({
      id: raw.id,
      name: raw.name,
      code: raw.code,
      headOfDepartmentId: raw.head_id,
      headOfDepartmentName: raw.head_name,
      stagesCount: 4,
      isActive: true,
    });
  }

  // 💾 حفظ أو تحديث قسم
  public async save(department: Department): Promise<void> {
    const persistenceData: DepartmentType = {
      id: department.id,
      name: department.name,
      code: department.code,
      head_id: department.headOfDepartmentId,
      head_name: department.headOfDepartmentName,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('departments').upsert(persistenceData, { onConflict: 'id' });

    if (error) {
      throw new Error(`فشل حفظ القسم في Supabase: ${error.message} ❌`);
    }
  }

  // 🗑️ حذف قسم
  public async delete(id: string): Promise<void> {
    const { error } = await supabase.from('departments').delete().eq('id', id);

    if (error) {
      throw new Error(`فشل حذف القسم من Supabase: ${error.message} ❌`);
    }
  }
}
