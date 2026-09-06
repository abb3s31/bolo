// 💾 مستودع الحضور والغياب للتخزين المحلي (LocalStorage Attendance Repository) - Clean Architecture

// 🔗 استيراد العقود والكيانات والمحولات
import { IAttendanceRepository } from '@/core/domain/repositories/IAttendanceRepository';
import { Attendance } from '@/core/domain/entities/Attendance';
import { AttendanceMapper, StoredAttendanceRecord } from '../mappers/AttendanceMapper';

// 🏷️ مفتاح التخزين
const STORAGE_KEY = 'uomis_attendance_data_v2';

// 🧱 صنف مستودع الحضور
export class LocalStorageAttendanceRepository implements IAttendanceRepository {
  // 📥 قراءة البيانات
  private getRawList(): StoredAttendanceRecord[] {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as StoredAttendanceRecord[]) : [];
    } catch {
      return [];
    }
  }

  // 💾 حفظ البيانات
  private saveRawList(list: StoredAttendanceRecord[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.error('فشل حفظ الحضور', e);
      }
    }
  }

  // 📥 جلب سجلات حضور مادة وتاريخ
  public async getByCourseAndDate(courseId: string, date: string): Promise<Attendance[]> {
    const list = this.getRawList();
    const filtered = list.filter(a => a.course_id === courseId && a.date === date);
    return filtered.map(item => AttendanceMapper.toDomain(item));
  }

  // 🎓 جلب سجلات طالب لمادة معينة
  public async getByStudentAndCourse(studentId: string, courseId: string): Promise<Attendance[]> {
    const list = this.getRawList();
    const filtered = list.filter(a => a.student_id === studentId && a.course_id === courseId);
    return filtered.map(item => AttendanceMapper.toDomain(item));
  }

  // 💾 حفظ مجموعة سجلات حضور
  public async saveBatch(records: Attendance[]): Promise<void> {
    const list = this.getRawList();
    for (const record of records) {
      const raw = AttendanceMapper.toPersistence(record);
      const index = list.findIndex(a => a.id === record.id);
      if (index >= 0) {
        list[index] = raw;
      } else {
        list.unshift(raw);
      }
    }
    this.saveRawList(list);
  }

  // 💾 حفظ سجل حضور فردي
  public async save(record: Attendance): Promise<void> {
    const list = this.getRawList();
    const raw = AttendanceMapper.toPersistence(record);
    const index = list.findIndex(a => a.id === record.id);
    if (index >= 0) {
      list[index] = raw;
    } else {
      list.unshift(raw);
    }
    this.saveRawList(list);
  }
}
