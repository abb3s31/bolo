// 🔐 حالة استخدام توثيق وتسجيل الدخول (Authenticate User UseCase) - SOLID Single Responsibility

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { LoginRequestDto, LoginResponseDto } from './dtos/AuthDtos';
import { IUserRepository } from '@/core/domain/repositories/IUserRepository';
import { UserEntity } from '@/core/domain/entities/User';

// 🏛️ واجهة نتيجة التوثيق السريع
export interface AuthLegacyResult {
  readonly success: boolean; // 🟢 نجاح العملية
  readonly user?: UserEntity; // 👤 بيانات المستخدم
  readonly error?: string; // ⚠️ الرسالة التحذيرية
}

// 🧱 صنف حالة استخدام تسجيل الدخول
export class AuthenticateUserUseCase implements IUseCase<LoginRequestDto, LoginResponseDto> {
  // 💉 حقن تبعية مستودع المستخدمين (Dependency Inversion Principle)
  constructor(private readonly userRepository: IUserRepository) {}

  // 🚀 تنفيذ فحص وتوثيق الحساب (Overload 1: كائن DTO مع نمط Result)
  public async execute(request: LoginRequestDto): Promise<Result<LoginResponseDto, string>>;
  // 🚀 تنفيذ فحص وتوثيق الحساب (Overload 2: المعرف وكلمة المرور مباشرة)
  public execute(identifier: string, pass: string): AuthLegacyResult;
  // ⚙️ التطبيق الفعلي للدالة
  public execute(
    requestOrIdentifier: LoginRequestDto | string,
    optionalPass?: string
  ): Promise<Result<LoginResponseDto, string>> | AuthLegacyResult {
    // 🔍 تحديد نوع المدخلات
    if (typeof requestOrIdentifier === 'string') {
      const cleanIdentifier = requestOrIdentifier.trim().toLowerCase();
      const cleanPassword = (optionalPass || '').trim();

      const user = this.userRepository.getByEmailOrUniNum(cleanIdentifier);

      if (!user) {
        return {
          success: false,
          error: 'عذراً! هذا الحساب غير مسجل في قاعدة البيانات الرسمية. لا يمكن الدخول إلا للحسابات المعتمدة من الكلية!',
        };
      }

      // 🔑 التحقق الحصري من كلمة المرور الأصلية للحساب
      const isPasswordValid =
        Boolean(user.temp_password && user.temp_password.trim() === cleanPassword);

      if (!isPasswordValid) {
        return {
          success: false,
          error: 'عذراً! رمز الدخول الأكاديمي غير صحيح. يرجى إدخال الرمز المعقد المكتوب في بطاقتك الأكاديمية.',
        };
      }

      if (!user.is_active) {
        return {
          success: false,
          error: 'هذا الحساب معطل حالياً من قبل إدارة الكلية!',
        };
      }

      return {
        success: true,
        user,
      };
    }

    // 🚀 في حال تمرير LoginRequestDto
    const cleanId = requestOrIdentifier.identifier.trim().toLowerCase();
    const cleanPwd = requestOrIdentifier.password.trim();

    if (!cleanId || !cleanPwd) {
      return Promise.resolve(Result.fail('يرجى كتابة البريد الأكاديمي/الرقم الجامعي وكلمة المرور ⚠️'));
    }

    const userFound = this.userRepository.getByEmailOrUniNum(cleanId);

    if (!userFound) {
      return Promise.resolve(
        Result.fail(
          'عذراً! هذا الحساب غير مسجل في قاعدة البيانات الرسمية. الدخول مقتصر على الحسابات المعتمدة فقط ❌'
        )
      );
    }

    // 🔑 التحقق الحصري من مطابقة كلمة المرور الأصلية
    const isValid =
      Boolean(userFound.temp_password && userFound.temp_password.trim() === cleanPwd);

    if (!isValid) {
      return Promise.resolve(Result.fail('عذراً! رمز الدخول الأكاديمي غير صحيح ⚠️'));
    }

    if (!userFound.is_active) {
      return Promise.resolve(Result.fail('هذا الحساب معطل حالياً من قبل إدارة الكلية ⛔'));
    }

    return Promise.resolve(
      Result.ok({
        user: userFound,
        token: `session_${userFound.id}_${Date.now()}`,
      })
    );
  }
}
