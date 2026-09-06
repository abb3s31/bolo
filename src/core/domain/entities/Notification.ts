// 🔔 كائن النطاق (Domain Entity): الإشعار الأكاديمي - Clean Architecture

// 🏷️ نوع الإشعار الأكاديمي
export type NotificationType = 'academic' | 'exam' | 'attendance' | 'general' | 'administrative';

// 📜 واجهة خصائص الإشعار
export interface NotificationProps {
  id: string; // 🆔 معرف الإشعار
  title: string; // 📢 عنوان الإشعار
  message: string; // 📝 نص الرسالة
  type: NotificationType; // 🏷️ نوع الإشعار
  targetRole: 'all' | 'students' | 'teachers' | 'admins'; // 🎯 الفئة المستهدفة
  targetDepartmentId?: string; // 🏛️ معرف القسم المستهدف (إذا خاص بقسم)
  createdAt: string; // ⏰ تاريخ ووقت الإرسال
  isRead: boolean; // 👁️ هل تمت القراءة
}

// 🧱 صنف كيان الإشعار
export class Notification {
  // 🔒 الخصائص
  private props: NotificationProps;

  // 🏗️ المشيد
  constructor(props: NotificationProps) {
    this.props = props;
  }

  // 🆔 المعرف
  public get id(): string {
    return this.props.id;
  }

  // 📢 العنوان
  public get title(): string {
    return this.props.title;
  }

  // 📝 الرسالة
  public get message(): string {
    return this.props.message;
  }

  // 🏷️ النوع
  public get type(): NotificationType {
    return this.props.type;
  }

  // 🎯 الفئة المستهدفة
  public get targetRole(): 'all' | 'students' | 'teachers' | 'admins' {
    return this.props.targetRole;
  }

  // 🏛️ القسم المستهدف
  public get targetDepartmentId(): string | undefined {
    return this.props.targetDepartmentId;
  }

  // ⏰ وقت الإرسال
  public get createdAt(): string {
    return this.props.createdAt;
  }

  // 👁️ هل تمت القراءة
  public get isRead(): boolean {
    return this.props.isRead;
  }

  // 🟢 تعيين الإشعار كمقروء
  public markAsRead(): void {
    this.props.isRead = true;
  }
}
