// 💾 مستودع التدريسيين للتخزين المحلي (LocalStorage Teacher Repository) - Clean Architecture

// 🔗 استيراد العقود والكيانات والمحولات
import { ITeacherRepository } from '@/core/domain/repositories/ITeacherRepository';
import { Teacher } from '@/core/domain/entities/Teacher';
import { Email } from '@/core/domain/value-objects/Email';
import { TeacherMapper } from '../mappers/TeacherMapper';
import { INITIAL_PROFILES, getStoredData, saveStoredData } from '@/lib/mock-data';
import { saveProfileToSupabase, deleteProfileFromSupabase } from '@/lib/supabase-client';
import { UserProfile } from '@/types';

// 🧱 صنف مستودع التدريسيين
export class LocalStorageTeacherRepository implements ITeacherRepository {
  // 📥 قراءة بيانات الأساتذة ورؤساء الأقسام والمقررين من المخزن الموحد
  private getRawList(): UserProfile[] {
    const allProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
    return allProfiles.filter(
      p => p.role === 'teacher' || p.role === 'department_head' || p.role === 'rapporteur'
    );
  }

  // 💾 حفظ القائمة في المخزن الموحد
  private saveRawList(list: UserProfile[]): void {
    const allProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const nonTeachers = allProfiles.filter(
      p => p.role !== 'teacher' && p.role !== 'department_head' && p.role !== 'rapporteur'
    );
    const combined = [...nonTeachers, ...list];
    saveStoredData('profiles', combined);
  }

  // 📥 جلب جميع الأساتذة
  public async getAll(): Promise<Teacher[]> {
    const list = this.getRawList();
    return list.map(item => TeacherMapper.toDomain(item));
  }

  // 🔍 جلب أستاذ بالمعرف
  public async getById(id: string): Promise<Teacher | null> {
    const list = this.getRawList();
    const found = list.find(t => t.id === id);
    return found ? TeacherMapper.toDomain(found) : null;
  }

  // 📧 جلب أستاذ بالبريد الرسمي
  public async getByEmail(email: Email): Promise<Teacher | null> {
    const list = this.getRawList();
    const found = list.find(t => t.generated_email === email.getValue());
    return found ? TeacherMapper.toDomain(found) : null;
  }

  // 🏛️ جلب أساتذة قسم معين
  public async getByDepartment(departmentId: string): Promise<Teacher[]> {
    const list = this.getRawList();
    const filtered = list.filter(t => t.department_id === departmentId);
    return filtered.map(item => TeacherMapper.toDomain(item));
  }

  // 💾 حفظ أو تحديث أستاذ
  public async save(teacher: Teacher): Promise<void> {
    const list = this.getRawList();
    const raw = TeacherMapper.toPersistence(teacher);
    const index = list.findIndex(t => t.id === teacher.id);
    if (index >= 0) {
      list[index] = raw;
    } else {
      list.unshift(raw);
    }
    this.saveRawList(list);

    // ⚡ مزامنة مع Supabase السحابية
    if (typeof window !== 'undefined') {
      try {
        await saveProfileToSupabase(raw);
      } catch (e) {
        console.error('فشل مزامنة الأستاذ مع Supabase', e);
      }
    }
  }

  // 🗑️ حذف أستاذ
  public async delete(id: string): Promise<void> {
    const list = this.getRawList();
    const target = list.find(t => t.id === id);
    const updated = list.filter(t => t.id !== id);
    this.saveRawList(updated);

    // ⚡ حذف من Supabase السحابية
    if (typeof window !== 'undefined') {
      try {
        await deleteProfileFromSupabase(id, target?.role || 'teacher');
      } catch (e) {
        console.error('فشل حذف الأستاذ من Supabase', e);
      }
    }
  }
}

