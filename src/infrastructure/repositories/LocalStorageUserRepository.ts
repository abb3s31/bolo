// 🧱 التطبيق المادي لمخزن المستخدمين (Concrete Repository Implementation) المربوط بـ Supabase و LocalStorage - الهندسة النظيفة (DIP)

import { IUserRepository } from '@/core/domain/repositories/IUserRepository'; // 🔗 عقد الواجهة
import { UserEntity } from '@/core/domain/entities/User'; // 🔗 كائن المجال
import { getStoredData, saveStoredData, INITIAL_PROFILES } from '@/lib/mock-data'; // 💾 التخزين المحلي
import { supabase, saveProfileToSupabase, deleteProfileFromSupabase, syncProfilesFromSupabase } from '@/lib/supabase-client'; // 🔌 عميل Supabase الرسمي المباشر
import { UserProfile } from '@/types';

export class LocalStorageUserRepository implements IUserRepository {
  private key = 'profiles'; // 🔑 المفتاح بقاعدة البيانات

  // 📖 جلب كافة المستخدمين
  getAll(): UserEntity[] {
    const localData = getStoredData<UserEntity[]>(this.key, INITIAL_PROFILES);

    // ⚡ مزامنة الخلفية مع قاعدة بيانات Supabase الرسمية والجداول المنفصلة
    if (typeof window !== 'undefined') {
      (async () => {
        try {
          const remoteData = await syncProfilesFromSupabase();
          if (remoteData && remoteData.length > 0) {
            saveStoredData(this.key, remoteData);
          }
        } catch {
          // 🛡️ معالجة الخطأ بصمت للحفاظ على استمرارية العمل بدون توقف
        }
      })();
    }

    return localData;
  }

  // 🔍 جلب مستخدم بواسطة ID
  getById(id: string): UserEntity | null {
    const all = this.getAll();
    return all.find((u) => u.id === id) || null;
  }

  // 🔍 جلب مستخدم بواسطة البريد أو الرقم الجامعي
  getByEmailOrUniNum(identifier: string): UserEntity | null {
    const clean = identifier.trim().toLowerCase();
    const all = this.getAll();
    return (
      all.find(
        (u) =>
          u.generated_email?.trim().toLowerCase() === clean ||
          u.university_number?.trim().toLowerCase() === clean
      ) || null
    );
  }

  // 💾 حفظ أو تحديث حساب مستخدم وتزامنه فورا مع جدول الدور المخصص في Supabase
  save(user: UserEntity): void {
    const all = this.getAll();
    const index = all.findIndex((u) => u.id === user.id);
    let updated: UserEntity[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = user;
    } else {
      updated = [...all, user];
    }
    saveStoredData(this.key, updated);

    // ⚡ حفظ الحساب مباشرة في الجدول المخصص في Supabase بتحويل نظيف وآمن للأنواع
    if (typeof window !== 'undefined') {
      (async () => {
        try {
          const profile: UserProfile = {
            id: user.id,
            full_name: user.full_name,
            role: user.role,
            department_id: user.department_id,
            department_name: user.department_name,
            stage_id: user.stage_id,
            stage_number: user.stage_number,
            university_number: user.university_number,
            generated_email: user.generated_email,
            temp_password: user.temp_password,
            is_active: user.is_active,
            must_change_password: user.must_change_password,
            created_at: user.created_at,
          };
          await saveProfileToSupabase(profile);
        } catch {
          // 🛡️ معالجة الخطأ
        }
      })();
    }
  }

  // 💾 حفظ دفعة مستخدمين
  saveAll(users: UserEntity[]): void {
    saveStoredData(this.key, users);

    if (typeof window !== 'undefined') {
      (async () => {
        try {
          await Promise.all(
            users.map((u) => {
              const profile: UserProfile = {
                id: u.id,
                full_name: u.full_name,
                role: u.role,
                department_id: u.department_id,
                department_name: u.department_name,
                stage_id: u.stage_id,
                stage_number: u.stage_number,
                university_number: u.university_number,
                generated_email: u.generated_email,
                temp_password: u.temp_password,
                is_active: u.is_active,
                must_change_password: u.must_change_password,
                created_at: u.created_at,
              };
              return saveProfileToSupabase(profile);
            })
          );
        } catch {
          // 🛡️ معالجة الخطأ
        }
      })();
    }
  }

  // 🗑️ حذف مستخدم من التخزين المحلي والسحابي
  delete(id: string): void {
    const all = this.getAll();
    const target = all.find((u) => u.id === id);
    const updated = all.filter((u) => u.id !== id);
    saveStoredData(this.key, updated);

    // ⚡ الحذف السحابي من الجدول المخصص في Supabase
    if (typeof window !== 'undefined') {
      (async () => {
        try {
          await deleteProfileFromSupabase(id, target?.role);
        } catch {
          // 🛡️ معالجة الخطأ
        }
      })();
    }
  }

  // 🔄 فحص فرادة البريد الأكاديمي
  isEmailUnique(email: string, excludeId?: string): boolean {
    const clean = email.trim().toLowerCase();
    const all = this.getAll();
    return !all.some(
      (u) => u.id !== excludeId && u.generated_email?.trim().toLowerCase() === clean
    );
  }

  // 🔄 فحص فرادة الرقم الجامعي
  isUniversityNumberUnique(uniNum: string, excludeId?: string): boolean {
    const clean = uniNum.trim().toLowerCase();
    const all = this.getAll();
    return !all.some(
      (u) => u.id !== excludeId && u.university_number?.trim().toLowerCase() === clean
    );
  }
}
