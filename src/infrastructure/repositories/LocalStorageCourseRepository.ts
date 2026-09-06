// 💾 مستودع المواد الدراسية للتخزين المحلي (LocalStorage Course Repository) - Clean Architecture

// 🔗 استيراد العقود والكيانات
import { ICourseRepository } from '@/core/domain/repositories/ICourseRepository';
import { Course } from '@/core/domain/entities/Course';
import { INITIAL_COURSES } from '@/lib/mock-data';
import { Course as CourseType } from '@/types';

// 🏷️ مفتاح التخزين
const STORAGE_KEY = 'uomis_courses_data_v2';

// 🧱 صنف مستودع المواد الدراسية
export class LocalStorageCourseRepository implements ICourseRepository {
  // 📥 قراءة البيانات
  private getRawList(): CourseType[] {
    if (typeof window === 'undefined') {
      return INITIAL_COURSES;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COURSES));
        return INITIAL_COURSES;
      }
      return JSON.parse(stored) as CourseType[];
    } catch {
      return INITIAL_COURSES;
    }
  }

  // 💾 حفظ البيانات
  private saveRawList(list: CourseType[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.error('فشل حفظ المواد', e);
      }
    }
  }

  // 📥 جلب جميع المواد
  public async getAll(): Promise<Course[]> {
    const list = this.getRawList();
    return list.map(
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
    const list = await this.getAll();
    const found = list.find(c => c.id === id);
    return found || null;
  }

  // 🏛️ جلب مواد قسم ومرحلة وفصل
  public async getByDepartmentAndStage(
    departmentId: string,
    stageNumber: number,
    semester?: 1 | 2
  ): Promise<Course[]> {
    const all = await this.getAll();
    return all.filter(c => {
      if (c.departmentId !== departmentId) return false;
      if (c.stageNumber !== stageNumber) return false;
      if (semester !== undefined && c.semester !== semester) return false;
      return true;
    });
  }

  // 💾 حفظ مادة
  public async save(course: Course): Promise<void> {
    const list = this.getRawList();
    const rawSubj: CourseType = {
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
    const index = list.findIndex(s => s.id === course.id);
    if (index >= 0) {
      list[index] = rawSubj;
    } else {
      list.push(rawSubj);
    }
    this.saveRawList(list);
  }

  // 🗑️ حذف مادة
  public async delete(id: string): Promise<void> {
    const list = this.getRawList();
    const filtered = list.filter(s => s.id !== id);
    this.saveRawList(filtered);
  }
}
