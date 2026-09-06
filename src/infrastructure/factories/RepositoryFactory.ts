// 🏭 مصنع المستودعات واستراتيجية التبديل (Repository Factory & Strategy)
// 🏛️ تطبيق نمط التصميم Factory Pattern & Open/Closed Principle

// 🔗 استيراد العقود (Interfaces)
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { ITeacherRepository } from '@/core/domain/repositories/ITeacherRepository';
import { IDepartmentRepository } from '@/core/domain/repositories/IDepartmentRepository';
import { ICourseRepository } from '@/core/domain/repositories/ICourseRepository';
import { IGradeRepository } from '@/core/domain/repositories/IGradeRepository';
import { IAttendanceRepository } from '@/core/domain/repositories/IAttendanceRepository';

// 🧱 استيراد المستودعات المحلية (LocalStorage)
import { LocalStorageStudentRepository } from '../repositories/LocalStorageStudentRepository';
import { LocalStorageTeacherRepository } from '../repositories/LocalStorageTeacherRepository';
import { LocalStorageDepartmentRepository } from '../repositories/LocalStorageDepartmentRepository';
import { LocalStorageCourseRepository } from '../repositories/LocalStorageCourseRepository';
import { LocalStorageGradeRepository } from '../repositories/LocalStorageGradeRepository';
import { LocalStorageAttendanceRepository } from '../repositories/LocalStorageAttendanceRepository';

// ⚡ استيراد المستودعات السحابية (Supabase)
import { SupabaseStudentRepository } from '../repositories/SupabaseStudentRepository';
import { SupabaseTeacherRepository } from '../repositories/SupabaseTeacherRepository';
import { SupabaseDepartmentRepository } from '../repositories/SupabaseDepartmentRepository';
import { SupabaseCourseRepository } from '../repositories/SupabaseCourseRepository';
import { SupabaseGradeRepository } from '../repositories/SupabaseGradeRepository';
import { SupabaseAttendanceRepository } from '../repositories/SupabaseAttendanceRepository';

// 🏷️ نوع مزود التخزين
export type StorageProviderType = 'local' | 'supabase';

// 🏭 صنف مصنع المستودعات
export class RepositoryFactory {
  // 🎓 إنشاء مستودع الطلاب بناءً على المزود المطلوب
  public static createStudentRepository(provider: StorageProviderType = 'local'): IStudentRepository {
    if (provider === 'supabase') {
      return new SupabaseStudentRepository();
    }
    return new LocalStorageStudentRepository();
  }

  //  إنشاء مستودع التدريسيين
  public static createTeacherRepository(provider: StorageProviderType = 'local'): ITeacherRepository {
    if (provider === 'supabase') {
      return new SupabaseTeacherRepository();
    }
    return new LocalStorageTeacherRepository();
  }

  // 🏛️ إنشاء مستودع الأقسام
  public static createDepartmentRepository(provider: StorageProviderType = 'local'): IDepartmentRepository {
    if (provider === 'supabase') {
      return new SupabaseDepartmentRepository();
    }
    return new LocalStorageDepartmentRepository();
  }

  // 📚 إنشاء مستودع المواد
  public static createCourseRepository(provider: StorageProviderType = 'local'): ICourseRepository {
    if (provider === 'supabase') {
      return new SupabaseCourseRepository();
    }
    return new LocalStorageCourseRepository();
  }

  // 📊 إنشاء مستودع الدرجات
  public static createGradeRepository(provider: StorageProviderType = 'local'): IGradeRepository {
    if (provider === 'supabase') {
      return new SupabaseGradeRepository();
    }
    return new LocalStorageGradeRepository();
  }

  // 📋 إنشاء مستودع الحضور
  public static createAttendanceRepository(provider: StorageProviderType = 'local'): IAttendanceRepository {
    if (provider === 'supabase') {
      return new SupabaseAttendanceRepository();
    }
    return new LocalStorageAttendanceRepository();
  }
}
