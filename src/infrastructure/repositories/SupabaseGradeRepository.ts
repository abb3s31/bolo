// ⚡ مستودع الدرجات السحابي عبر Supabase (Supabase Grade Repository) - Clean Architecture

// 🔗 استيراد العقود والكيانات والمحولات
import { IGradeRepository } from '@/core/domain/repositories/IGradeRepository';
import { Grade } from '@/core/domain/entities/Grade';
import { GradeMapper } from '../mappers/GradeMapper';
import { supabase } from '@/lib/supabase-client';
import { Grade as GradeType } from '@/types';

// 🧱 صنف مستودع الدرجات السحابي
export class SupabaseGradeRepository implements IGradeRepository {
  // 🔍 جلب سجل درجة طالب لمادة وسنة معينة
  public async getByStudentAndCourse(
    studentId: string,
    courseId: string,
    academicYear: string
  ): Promise<Grade | null> {
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .eq('academic_year_id', academicYear)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return GradeMapper.toDomain(data as GradeType);
  }

  // 🎓 جلب جميع درجات طالب
  public async getAllByStudent(studentId: string, academicYear?: string): Promise<Grade[]> {
    let query = supabase.from('grades').select('*').eq('student_id', studentId);

    if (academicYear) {
      query = query.eq('academic_year_id', academicYear);
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    return (data as GradeType[]).map(item => GradeMapper.toDomain(item));
  }

  // 📚 جلب درجات مادة معينة
  public async getAllByCourse(courseId: string, academicYear: string): Promise<Grade[]> {
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .eq('course_id', courseId)
      .eq('academic_year_id', academicYear);

    if (error || !data) {
      return [];
    }

    return (data as GradeType[]).map(item => GradeMapper.toDomain(item));
  }

  // 💾 حفظ سجل درجات
  public async save(grade: Grade): Promise<void> {
    const persistenceData = GradeMapper.toPersistence(grade);

    const { error } = await supabase.from('grades').upsert(persistenceData, { onConflict: 'id' });

    if (error) {
      throw new Error(`فشل حفظ الدرجة في Supabase: ${error.message} ❌`);
    }
  }

  // 💾 حفظ مجموعة درجات دفعة واحدة
  public async saveBatch(grades: Grade[]): Promise<void> {
    const persistenceList = grades.map(g => GradeMapper.toPersistence(g));

    const { error } = await supabase.from('grades').upsert(persistenceList, { onConflict: 'id' });

    if (error) {
      throw new Error(`فشل حفظ دفعة الدرجات في Supabase: ${error.message} ❌`);
    }
  }
}
