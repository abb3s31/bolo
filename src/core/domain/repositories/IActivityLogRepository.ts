// 📜 واجهة مستودع سجلات التدقيق (Activity Log Repository Interface) - Clean Architecture

// 🔗 استيراد كيان سجل التدقيق
import { ActivityLog } from '../entities/ActivityLog';

// 🏛️ واجهة مستودع سجل التدقيق
export interface IActivityLogRepository {
  // 📥 جلب أحدث سجلات النشاطات
  getRecentLogs(limit?: number): Promise<ActivityLog[]>;

  // 🔍 جلب نشاطات مستخدم معين
  getByActor(actorId: string): Promise<ActivityLog[]>;

  // 💾 تسجيل وحفظ نشاط جديد
  log(activity: ActivityLog): Promise<void>;
}
