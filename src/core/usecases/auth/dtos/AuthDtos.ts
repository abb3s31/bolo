// 🔐 نماذج نقل البيانات للمصادقة وتغيير الرمز (Auth DTOs) - Data Transfer Objects

// 🔗 استيراد كائن المستخدم
import { UserEntity } from '@/core/domain/entities/User';

// 📥 نموذج طلب تسجيل الدخول
export interface LoginRequestDto {
  readonly identifier: string; // 📧 البريد الأكاديمي أو الرقم الجامعي
  readonly password: string; // 🔑 كلمة المرور
}

// 📤 نموذج استجابة تسجيل الدخول
export interface LoginResponseDto {
  readonly user: UserEntity; // 👤 بيانات المستخدم
  readonly token?: string; // 🎫 رمز المصادقة
}

// 📥 نموذج طلب تغيير كلمة المرور
export interface ChangePasswordRequestDto {
  readonly userId: string; // 🆔 معرف المستخدم
  readonly oldPassword: string; // 🔑 الرمز القديم
  readonly newPassword: string; // 🔒 الرمز الجديد
}

// 📤 نموذج استجابة تغيير كلمة المرور
export interface ChangePasswordResponseDto {
  readonly success: boolean; // 🟢 حالة النجاح
  readonly message: string; // 💬 رسالة التوضيح
}
