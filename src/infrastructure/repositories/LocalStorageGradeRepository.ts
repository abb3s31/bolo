// 💾 مستودع الدرجات للتخزين المحلي (LocalStorage Grade Repository) - Clean Architecture

// 🔗 استيراد العقود والكيانات والمحولات
import { IGradeRepository } from '@/core/domain/repositories/IGradeRepository';
import { Grade } from '@/core/domain/entities/Grade';
import { GradeMapper } from '../mappers/GradeMapper';
import { INITIAL_GRADES } from '@/lib/mock-data';
import { Grade as GradeType } from '@/types';

// 🏷️ مفتاح التخزين
const STORAGE_KEY = 'uomis_grades_data_v2';

// 🧱 صنف مستودع الدرجات
export class LocalStorageGradeRepository implements IGradeRepository {
  // 📥 قراءة البيانات
  private getRawList(): GradeType[] {
    if (typeof window === 'undefined') {
      return INITIAL_GRADES;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_GRADES));
        return INITIAL_GRADES;
      }
      return JSON.parse(stored) as GradeType[];
    } catch {
      return INITIAL_GRADES;
    }
  }

  // 💾 حفظ البيانات
  private saveRawList(list: GradeType[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.error('فشل حفظ الدرجات', e);
      }
    }
  }

  // 🔍 جلب سجل درجة طالب لمادة وسنة معينة
  public async getByStudentAndCourse(
    studentId: string,
    courseId: string,
    academicYear: string
  ): Promise<Grade | null> {
    const list = this.getRawList();
    const found = list.find(
      g =>
        g.student_id === studentId &&
        g.course_id === courseId &&
        g.academic_year_id === academicYear
    );
    return found ? GradeMapper.toDomain(found) : null;
  }

  // 🎓 جلب جميع درجات طالب
  public async getAllByStudent(studentId: string, academicYear?: string): Promise<Grade[]> {
    const list = this.getRawList();
    const filtered = list.filter(g => {
      if (g.student_id !== studentId) return false;
      if (academicYear && g.academic_year_id !== academicYear) return false;
      return true;
    });
    return filtered.map(item => GradeMapper.toDomain(item));
  }

  // 📚 جلب درجات مادة معينة
  public async getAllByCourse(courseId: string, academicYear: string): Promise<Grade[]> {
    const list = this.getRawList();
    const filtered = list.filter(
      g => g.course_id === courseId && g.academic_year_id === academicYear
    );
    return filtered.map(item => GradeMapper.toDomain(item));
  }

  // 💾 حفظ سجل درجات
  public async save(grade: Grade): Promise<void> {
    const list = this.getRawList();
    const raw = GradeMapper.toPersistence(grade);
    const index = list.findIndex(g => g.id === grade.id);
    if (index >= 0) {
      list[index] = raw;
    } else {
      list.unshift(raw);
    }
    this.saveRawList(list);
  }

  // 💾 حفظ مجموعة درجات دفعة واحدة
  public async saveBatch(grades: Grade[]): Promise<void> {
    const list = this.getRawList();
    for (const grade of grades) {
      const raw = GradeMapper.toPersistence(grade);
      const index = list.findIndex(g => g.id === grade.id);
      if (index >= 0) {
        list[index] = raw;
      } else {
        list.unshift(raw);
      }
    }
    this.saveRawList(list);
  }
}
