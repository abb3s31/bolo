// 📜 نماذج نقل بيانات سجلات التدقيق والنشاطات (Audit DTOs)

// 🔗 استيراد كيان سجل النشاط
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج تسجيل نشاط جديد
export interface LogActivityRequestDto {
  readonly actorId: string; // 👤 معرف الفاعل
  readonly actorName: string; // 👤 اسم الفاعل
  readonly actorRole: string; // 📜 الدور
  readonly action: string; // ⚡ اسم الإجراء
  readonly targetResource: string; // 🎯 المورد
  readonly details: string; // 📝 التفاصيل
  readonly ipAddress?: string; // 🌐 الـ IP
}

// 📤 نموذج استجابة تسجيل النشاط
export interface LogActivityResponseDto {
  readonly log: ActivityLog; // 📜 كيان النشاط
  readonly success: boolean; // 🟢 النجاح
}
