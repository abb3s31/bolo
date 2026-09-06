// 🧱 كائن المجال (Domain Entity) - المستخدم والبطاقة الأكاديمية - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { UserRole } from '@/types'; // 🔗 استيراد الأدوار الموحدة لكافة أرجاء المنظومة

export interface UserEntity {
  id: string; // 🆔 المعرف الفريد
  full_name: string; // 👤 الاسم الكامل
  role: UserRole; // 📜 الدور الوظيفي
  department_id?: string; // 🏛️ معرف القسم
  department_name?: string; // 🏛️ اسم القسم
  stage_id?: string; // 🎓 معرف المرحلة
  stage_number?: number; // 🎓 رقم المرحلة (1-4)
  university_number: string; // 🔢 الرقم الجامعي / الوظيفي
  generated_email: string; // 📧 البريد المعقد الفريد
  temp_password?: string; // 🔑 الرمز المعقد
  is_active: boolean; // 🟢 حالة التفعيل
  must_change_password?: boolean; // 🔄 تغيير كلمة المرور عند أول دخول
  created_at?: string; // 🗓️ تاريخ الإنشاء
}
