// 💾 مستودع الأقسام العلمية للتخزين المحلي (LocalStorage Department Repository) - Clean Architecture

// 🔗 استيراد العقود والكيانات
import { IDepartmentRepository } from '@/core/domain/repositories/IDepartmentRepository';
import { Department } from '@/core/domain/entities/Department';
import { INITIAL_DEPARTMENTS } from '@/lib/mock-data';
import { Department as DepartmentType } from '@/types';

// 🏷️ مفتاح التخزين
const STORAGE_KEY = 'uomis_departments_data_v2';

// 🧱 صنف مستودع الأقسام
export class LocalStorageDepartmentRepository implements IDepartmentRepository {
  // 📥 قراءة البيانات
  private getRawList(): DepartmentType[] {
    if (typeof window === 'undefined') {
      return INITIAL_DEPARTMENTS;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEPARTMENTS));
        return INITIAL_DEPARTMENTS;
      }
      return JSON.parse(stored) as DepartmentType[];
    } catch {
      return INITIAL_DEPARTMENTS;
    }
  }

  // 💾 حفظ البيانات
  private saveRawList(list: DepartmentType[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.error('فشل حفظ الأقسام', e);
      }
    }
  }

  // 📥 جلب جميع الأقسام
  public async getAll(): Promise<Department[]> {
    const list = this.getRawList();
    return list.map(
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
    const list = await this.getAll();
    const found = list.find(d => d.id === id);
    return found || null;
  }

  // 🔤 جلب قسم بالرمز
  public async getByCode(code: string): Promise<Department | null> {
    const list = await this.getAll();
    const found = list.find(d => d.code.toLowerCase() === code.toLowerCase());
    return found || null;
  }

  // 💾 حفظ أو تحديث قسم
  public async save(department: Department): Promise<void> {
    const list = this.getRawList();
    const rawDept: DepartmentType = {
      id: department.id,
      name: department.name,
      code: department.code,
      head_id: department.headOfDepartmentId,
      head_name: department.headOfDepartmentName,
      created_at: new Date().toISOString(),
    };

    const index = list.findIndex(d => d.id === department.id);
    if (index >= 0) {
      list[index] = rawDept;
    } else {
      list.push(rawDept);
    }
    this.saveRawList(list);
  }

  // 🗑️ حذف قسم
  public async delete(id: string): Promise<void> {
    const list = this.getRawList();
    const filtered = list.filter(d => d.id !== id);
    this.saveRawList(filtered);
  }
}
