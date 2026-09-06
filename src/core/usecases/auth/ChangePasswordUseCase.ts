// 🔑 حالة استخدام تغيير كلمة المرور (Change Password UseCase) - SOLID Single Responsibility

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { ChangePasswordRequestDto, ChangePasswordResponseDto } from './dtos/AuthDtos';
import { IUserRepository } from '@/core/domain/repositories/IUserRepository';

// 🧱 صنف حالة استخدام تغيير الرمز
export class ChangePasswordUseCase
  implements IUseCase<ChangePasswordRequestDto, ChangePasswordResponseDto>
{
  // 💉 حقن مستودع المستخدمين
  constructor(private readonly userRepository: IUserRepository) {}

  // 🚀 تنفيذ تغيير كلمة المرور
  public async execute(
    request: ChangePasswordRequestDto
  ): Promise<Result<ChangePasswordResponseDto, string>> {
    // 🔍 جلب المستخدم بالمعرف
    const user = this.userRepository.getById(request.userId);

    // ❌ التحقق من وجود المستخدم
    if (!user) {
      return Result.fail('المستخدم غير موجود في النظام ❌');
    }

    // 🔑 التحقق من مطابقة الرمز القديم
    if (user.temp_password && user.temp_password !== request.oldPassword.trim()) {
      return Result.fail('كلمة المرور القديمة غير صحيحة ⚠️');
    }

    // 📏 التحقق من قوة الرمز الجديد
    if (request.newPassword.trim().length < 6) {
      return Result.fail('كلمة المرور الجديدة يجب ألا تقل عن 6 خانات 🔒');
    }

    // 💾 تحديث كلمة المرور في بيانات المستخدم
    const updatedUser = {
      ...user,
      temp_password: request.newPassword.trim(),
      must_change_password: false,
    };

    // 💾 حفظ المستخدم المحدث
    this.userRepository.save(updatedUser);

    // 🎯 إرجاع نتيجة النجاح
    return Result.ok({
      success: true,
      message: 'تم تغيير كلمة المرور وتفعيل الحساب بنجاح',
    });
  }
}
