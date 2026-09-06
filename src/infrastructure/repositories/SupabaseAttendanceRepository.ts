// ⚡ مستودع الحضور السحابي عبر Supabase (Supabase Attendance Repository) - Clean Architecture

// 🔗 استيراد العقود والكيانات والمحولات
import { IAttendanceRepository } from '@/core/domain/repositories/IAttendanceRepository';
import { Attendance } from '@/core/domain/entities/Attendance';
import { AttendanceMapper, StoredAttendanceRecord } from '../mappers/AttendanceMapper';
import { supabase } from '@/lib/supabase-client';

// 🧱 صنف مستودع الحضور السحابي
export class SupabaseAttendanceRepository implements IAttendanceRepository {
  // 📥 جلب سجلات حضور مادة وتاريخ معين
  public async getByCourseAndDate(courseId: string, date: string): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('course_id', courseId)
      .eq('date', date);

    if (error || !data) {
      return [];
    }

    return (data as StoredAttendanceRecord[]).map(item => AttendanceMapper.toDomain(item));
  }

  // 🎓 جلب سجلات حضور وغياب طالب لمادة
  public async getByStudentAndCourse(studentId: string, courseId: string): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    if (error || !data) {
      return [];
    }

    return (data as StoredAttendanceRecord[]).map(item => AttendanceMapper.toDomain(item));
  }

  // 💾 حفظ مجموعة سجلات حضور دفعة واحدة
  public async saveBatch(records: Attendance[]): Promise<void> {
    const persistenceList = records.map(r => AttendanceMapper.toPersistence(r));

    const { error } = await supabase.from('attendance').upsert(persistenceList, { onConflict: 'id' });

    if (error) {
      throw new Error(`فشل حفظ سجلات الحضور في Supabase: ${error.message} ❌`);
    }
  }

  // 💾 حفظ سجل حضور فردي
  public async save(record: Attendance): Promise<void> {
    const persistenceData = AttendanceMapper.toPersistence(record);

    const { error } = await supabase.from('attendance').upsert(persistenceData, { onConflict: 'id' });

    if (error) {
      throw new Error(`فشل حفظ سجل الحضور في Supabase: ${error.message} ❌`);
    }
  }
}
