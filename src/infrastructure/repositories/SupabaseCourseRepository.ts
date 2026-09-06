// ⚡ مستودع المواد الدراسية السحابي عبر Supabase (Supabase Course Repository) - Clean Architecture

// 🔗 استيراد العقود والكيانات
import { ICourseRepository } from '@/core/domain/repositories/ICourseRepository';
import { Course } from '@/core/domain/entities/Course';
import { supabase } from '@/lib/supabase-client';
import { Course as CourseType } from '@/types';

// 🧱 صنف مستودع المواد السحابي
export class SupabaseCourseRepository implements ICourseRepository {
  // 📥 جلب جميع المواد
  public async getAll(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data) {
      console.warn('⚠️ تعذر جلب المواد من Supabase:', error?.message);
      return [];
    }

    return (data as CourseType[]).map(
      raw =>
        new Course({
          id: raw.id,
          name: raw.name,
          code: raw.code,
          departmentId: raw.department_id || 'dept-1',
          stageNumber: raw.stage_number || 1,
          semester: (raw.semester as 1 | 2) || 1,
          creditHours: raw.credit_hours || 3,
          theoryHours: 2,
          practicalHours: raw.has_practical ? 2 : 0,
          isActive: true,
        })
    );
  }

  // 🔍 جلب مادة بالمعرف
  public async getById(id: string): Promise<Course | null> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const raw = data as CourseType;
    return new Course({
      id: raw.id,
      name: raw.name,
      code: raw.code,
      departmentId: raw.department_id || 'dept-1',
      stageNumber: raw.stage_number || 1,
      semester: (raw.semester as 1 | 2) || 1,
      creditHours: raw.credit_hours || 3,
      theoryHours: 2,
      practicalHours: raw.has_practical ? 2 : 0,
      isActive: true,
    });
  }

  // 🏛️ جلب مواد قسم ومرحلة وفصل
  public async getByDepartmentAndStage(
    departmentId: string,
    stageNumber: number,
    semester?: 1 | 2
  ): Promise<Course[]> {
    let query = supabase
      .from('courses')
      .select('*')
      .eq('department_id', departmentId)
      .eq('stage_number', stageNumber);

    if (semester !== undefined) {
      query = query.eq('semester', semester);
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    return (data as CourseType[]).map(
      raw =>
        new Course({
          id: raw.id,
          name: raw.name,
          code: raw.code,
          departmentId: raw.department_id || departmentId,
          stageNumber: raw.stage_number || stageNumber,
          semester: (raw.semester as 1 | 2) || 1,
          creditHours: raw.credit_hours || 3,
          theoryHours: 2,
          practicalHours: raw.has_practical ? 2 : 0,
          isActive: true,
        })
    );
  }

  // 💾 حفظ مادة
  public async save(course: Course): Promise<void> {
    const persistenceData: CourseType = {
      id: course.id,
      stage_id: `stage-${course.departmentId}-${course.stageNumber}`,
      academic_year_id: 'year-2026',
      name: course.name,
      code: course.code,
      department_id: course.departmentId,
      stage_number: course.stageNumber,
      semester: course.semester,
      credit_hours: course.creditHours,
      has_practical: course.practicalHours > 0,
    };

    const { error } = await supabase.from('courses').upsert(persistenceData, { onConflict: 'id' });

    if (error) {
      throw new Error(`فشل حفظ المادة في Supabase: ${error.message} ❌`);
    }
  }

  // 🗑️ حذف مادة
  public async delete(id: string): Promise<void> {
    const { error } = await supabase.from('courses').delete().eq('id', id);

    if (error) {
      throw new Error(`فشل حذف المادة من Supabase: ${error.message} ❌`);
    }
  }
}
