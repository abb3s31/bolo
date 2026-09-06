// 💾 مستودع الطلاب للتخزين المحلي (LocalStorage Student Repository) - SOLID Liskov & Clean Architecture

// 🔗 استيراد العقود والكيانات والمحولات
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { Student } from '@/core/domain/entities/Student';
import { Email } from '@/core/domain/value-objects/Email';
import { UniversityNumber } from '@/core/domain/value-objects/UniversityNumber';
import { StudentMapper } from '../mappers/StudentMapper';
import { INITIAL_PROFILES, getStoredData, saveStoredData } from '@/lib/mock-data';
import { saveProfileToSupabase, deleteProfileFromSupabase } from '@/lib/supabase-client';
import { UserProfile } from '@/types';

// 🧱 صنف مستودع الطلاب
export class LocalStorageStudentRepository implements IStudentRepository {
  // 📥 دالة مساعدة لقراءة الطلاب فقط من UserProfile
  private getRawList(): UserProfile[] {
    const allProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
    return allProfiles.filter(p => p.role === 'student');
  }

  // 💾 دالة مساعدة لحفظ البيانات في المخزن الموحد
  private saveRawList(list: UserProfile[]): void {
    const allProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const nonStudents = allProfiles.filter(p => p.role !== 'student');
    const combined = [...nonStudents, ...list];
    saveStoredData('profiles', combined);
  }

  // 📥 جلب جميع الطلاب
  public async getAll(): Promise<Student[]> {
    const list = this.getRawList();
    return list.map(item => StudentMapper.toDomain(item));
  }

  // 🔍 جلب طالب بالمعرف
  public async getById(id: string): Promise<Student | null> {
    const list = this.getRawList();
    const found = list.find(s => s.id === id);
    return found ? StudentMapper.toDomain(found) : null;
  }

  // 🔢 جلب طالب بالرقم الجامعي
  public async getByUniversityNumber(uniNum: UniversityNumber): Promise<Student | null> {
    const list = this.getRawList();
    const found = list.find(s => s.university_number === uniNum.getValue());
    return found ? StudentMapper.toDomain(found) : null;
  }

  // 📧 جلب طالب بالبريد الإلكتروني
  public async getByEmail(email: Email): Promise<Student | null> {
    const list = this.getRawList();
    const found = list.find(s => s.generated_email === email.getValue());
    return found ? StudentMapper.toDomain(found) : null;
  }

  // 🏛️ جلب طلاب قسم ومرحلة
  public async getByDepartmentAndStage(
    departmentId: string,
    stageNumber: number
  ): Promise<Student[]> {
    const list = this.getRawList();
    const filtered = list.filter(
      s => s.department_id === departmentId && s.stage_number === stageNumber
    );
    return filtered.map(item => StudentMapper.toDomain(item));
  }

  // 💾 حفظ أو تحديث طالب
  public async save(student: Student): Promise<void> {
    const list = this.getRawList();
    const rawStudent = StudentMapper.toPersistence(student);
    const index = list.findIndex(s => s.id === student.id);

    if (index >= 0) {
      list[index] = rawStudent;
    } else {
      list.unshift(rawStudent);
    }
    this.saveRawList(list);

    // ⚡ مزامنة مع Supabase السحابية
    if (typeof window !== 'undefined') {
      try {
        await saveProfileToSupabase(rawStudent);
      } catch (e) {
        console.error('فشل مزامنة الطالب مع Supabase', e);
      }
    }
  }

  // 💾 حفظ مجموعة طلاب دفعة واحدة
  public async saveBatch(students: Student[]): Promise<void> {
    const list = this.getRawList();
    const rawStudents: UserProfile[] = [];
    for (const student of students) {
      const raw = StudentMapper.toPersistence(student);
      rawStudents.push(raw);
      const index = list.findIndex(s => s.id === student.id);
      if (index >= 0) {
        list[index] = raw;
      } else {
        list.unshift(raw);
      }
    }
    this.saveRawList(list);

    // ⚡ مزامنة مع Supabase السحابية دفعة واحدة
    if (typeof window !== 'undefined') {
      try {
        await Promise.all(rawStudents.map(s => saveProfileToSupabase(s)));
      } catch (e) {
        console.error('فشل مزامنة حزمة الطلاب مع Supabase', e);
      }
    }
  }

  // 🗑️ حذف طالب
  public async delete(id: string): Promise<void> {
    const list = this.getRawList();
    const target = list.find(s => s.id === id);
    const updated = list.filter(s => s.id !== id);
    this.saveRawList(updated);

    // ⚡ حذف من Supabase السحابية
    if (typeof window !== 'undefined') {
      try {
        await deleteProfileFromSupabase(id, target?.role || 'student');
      } catch (e) {
        console.error('فشل حذف الطالب من Supabase', e);
      }
    }
  }
}

