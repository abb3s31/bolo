// ⚙️ واجهة حالة الاستخدام العامة (Generic UseCase Interface) - SOLID Single Responsibility

// 📜 استيراد نمط النتيجة
import { Result } from './Result';

// 🏛️ واجهة حالة الاستخدام الأساسية
export interface IUseCase<TRequest, TResponse> {
  // 🚀 تنفيذ حالة الاستخدام وإرجاع النتيجة الآمنة
  execute(request: TRequest): Promise<Result<TResponse, string>> | Result<TResponse, string>;
}
