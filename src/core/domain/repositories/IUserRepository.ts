// 🔌 واجهة مخزن المستخدمين (Domain Repository Interface) - الهندسة النظيفة (Clean Architecture)

import { UserEntity } from '../entities/User'; // 🔗 كائن المجال

export interface IUserRepository {
  getAll(): UserEntity[]; // 📥 جلب جميع المستخدمين
  getById(id: string): UserEntity | null; // 🔍 جلب مستخدم بالمعرف
  getByEmailOrUniNum(identifier: string): UserEntity | null; // 📧 جلب بالبريد أو الرقم الجامعي
  save(user: UserEntity): void; // 💾 إضافة أو تحديث مستخدم
  saveAll(users: UserEntity[]): void; // 💾 حفظ دفعة مستخدمين
  delete(id: string): void; // 🗑️ حذف مستخدم
}
