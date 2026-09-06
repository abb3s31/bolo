// 💾 مستودع الجداول الأسبوعية للتخزين المحلي (LocalStorage Schedule Repository) - Clean Architecture

// 🔗 استيراد العقود والكيانات
import { IScheduleRepository } from '@/core/domain/repositories/IScheduleRepository';
import { Schedule, WeekDay } from '@/core/domain/entities/Schedule';
import { INITIAL_SCHEDULE_LECTURES } from '@/lib/mock-data';
import { ScheduleLecture, DayOfWeek } from '@/types';

// 🏷️ مفتاح التخزين
const STORAGE_KEY = 'uomis_schedules_data_v2';

// 🔄 دالة مساعدة لتحويل اليوم بين الأنواع
function toDomainDay(day: DayOfWeek): WeekDay {
  switch (day) {
    case 'saturday':
      return 'Saturday';
    case 'sunday':
      return 'Sunday';
    case 'monday':
      return 'Monday';
    case 'tuesday':
      return 'Tuesday';
    case 'wednesday':
      return 'Wednesday';
    case 'thursday':
    default:
      return 'Thursday';
  }
}

function toScheduleDay(day: WeekDay): DayOfWeek {
  switch (day) {
    case 'Saturday':
      return 'saturday';
    case 'Sunday':
      return 'sunday';
    case 'Monday':
      return 'monday';
    case 'Tuesday':
      return 'tuesday';
    case 'Wednesday':
      return 'wednesday';
    case 'Thursday':
    default:
      return 'thursday';
  }
}

// 🧱 صنف مستودع الجداول
export class LocalStorageScheduleRepository implements IScheduleRepository {
  // 📥 قراءة البيانات
  private getRawList(): ScheduleLecture[] {
    if (typeof window === 'undefined') {
      return INITIAL_SCHEDULE_LECTURES;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SCHEDULE_LECTURES));
        return INITIAL_SCHEDULE_LECTURES;
      }
      return JSON.parse(stored) as ScheduleLecture[];
    } catch {
      return INITIAL_SCHEDULE_LECTURES;
    }
  }

  // 💾 حفظ البيانات
  private saveRawList(list: ScheduleLecture[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.error('فشل حفظ الجدول', e);
      }
    }
  }

  // 📥 جلب جميع المحاضرات
  public async getAll(): Promise<Schedule[]> {
    const list = this.getRawList();
    return list.map(
      raw =>
        new Schedule({
          id: raw.id,
          courseId: raw.course_id,
          courseName: raw.course_name,
          teacherId: raw.teacher_id || '',
          teacherName: raw.teacher_name || '',
          departmentId: raw.department_id,
          stageNumber: raw.stage_number,
          day: toDomainDay(raw.day),
          startTime: raw.start_time,
          endTime: raw.end_time,
          roomHall: raw.room,
          shiftType: 'morning',
        })
    );
  }

  // 🏛️ جلب جدول قسم ومرحلة ونوع دراسة
  public async getByDepartmentAndStage(
    departmentId: string,
    stageNumber: number,
    shiftType: 'morning' | 'evening'
  ): Promise<Schedule[]> {
    const all = await this.getAll();
    return all.filter(
      s =>
        s.departmentId === departmentId &&
        s.stageNumber === stageNumber &&
        s.shiftType === shiftType
    );
  }

  //  جلب جدول أستاذ معين
  public async getByTeacher(teacherId: string): Promise<Schedule[]> {
    const all = await this.getAll();
    return all.filter(s => s.teacherId === teacherId);
  }

  // 💾 حفظ أو تحديث محاضرة
  public async save(schedule: Schedule): Promise<void> {
    const list = this.getRawList();
    const rawLecture: ScheduleLecture = {
      id: schedule.id,
      department_id: schedule.departmentId,
      stage_number: schedule.stageNumber,
      semester: 1,
      course_id: schedule.courseId,
      course_name: schedule.courseName,
      course_code: 'CODE-101',
      teacher_id: schedule.teacherId,
      teacher_name: schedule.teacherName,
      day: toScheduleDay(schedule.day),
      start_time: schedule.startTime,
      end_time: schedule.endTime,
      room: schedule.roomHall,
      color: 'blue',
      type: 'theory',
    };
    const index = list.findIndex(l => l.id === schedule.id);
    if (index >= 0) {
      list[index] = rawLecture;
    } else {
      list.push(rawLecture);
    }
    this.saveRawList(list);
  }

  // 🗑️ حذف محاضرة
  public async delete(id: string): Promise<void> {
    const list = this.getRawList();
    const filtered = list.filter(l => l.id !== id);
    this.saveRawList(filtered);
  }
}
