// 💾 مستودع سجلات التدقيق للتخزين المحلي (LocalStorage AuditLog Repository) - Clean Architecture

// 🔗 استيراد العقود والكيانات
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';
import { AuditLog, UserRole } from '@/types';

// 🏷️ مفتاح التخزين
const STORAGE_KEY = 'uomis_audit_logs_v2';

// 🧱 صنف مستودع التدقيق
export class LocalStorageAuditLogRepository implements IActivityLogRepository {
  // 📥 قراءة البيانات
  private getRawList(): AuditLog[] {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as AuditLog[]) : [];
    } catch {
      return [];
    }
  }

  // 💾 حفظ البيانات
  private saveRawList(list: AuditLog[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.error('فشل حفظ سجلات التدقيق', e);
      }
    }
  }

  // 📥 جلب أحدث النشاطات
  public async getRecentLogs(limit: number = 50): Promise<ActivityLog[]> {
    const list = this.getRawList();
    const sliced = list.slice(0, limit);
    return sliced.map(
      raw =>
        new ActivityLog({
          id: raw.id,
          actorId: raw.user_id || 'usr-anonymous',
          actorName: raw.user_name || 'مستخدم النظام',
          actorRole: raw.user_role || 'admin',
          action: raw.action,
          targetResource: raw.course_name || raw.details,
          details: raw.details,
          ipAddress: '127.0.0.1',
          timestamp: raw.created_at,
        })
    );
  }

  // 🔍 جلب نشاطات مستخدم معين
  public async getByActor(actorId: string): Promise<ActivityLog[]> {
    const list = this.getRawList();
    const filtered = list.filter(l => l.user_id === actorId);
    return filtered.map(
      raw =>
        new ActivityLog({
          id: raw.id,
          actorId: raw.user_id || actorId,
          actorName: raw.user_name || 'مستخدم',
          actorRole: raw.user_role || 'admin',
          action: raw.action,
          targetResource: raw.course_name || raw.details,
          details: raw.details,
          ipAddress: '127.0.0.1',
          timestamp: raw.created_at,
        })
    );
  }

  // 💾 تسجيل نشاط جديد
  public async log(activity: ActivityLog): Promise<void> {
    const list = this.getRawList();
    const rawLog: AuditLog = {
      id: activity.id,
      user_id: activity.actorId,
      user_name: activity.actorName,
      user_role: (activity.actorRole as UserRole) || 'admin',
      action: activity.action,
      details: activity.details,
      created_at: activity.timestamp,
    };
    list.unshift(rawLog);
    this.saveRawList(list);
  }
}
