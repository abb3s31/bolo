// 📜 كائن النطاق (Domain Entity): سجل التدقيق والنشاطات (Audit Log) - Clean Architecture

// 🏛️ واجهة خصائص سجل النشاط
export interface ActivityLogProps {
  id: string; // 🆔 المعرف الفريد للنشاط
  actorId: string; // 👤 معرف المستخدم القائم بالفعل
  actorName: string; // 👤 اسم المستخدم
  actorRole: string; // 📜 دور المستخدم
  action: string; // ⚡ اسم العملية (مثال: CREATE_STUDENT, SUBMIT_GRADE)
  targetResource: string; // 🎯 المورد المستهدف (مثال: Students, Grades)
  details: string; // 📝 تفاصيل إضافية عن العملية
  ipAddress?: string; // 🌐 عنوان الـ IP
  timestamp: string; // ⏰ التوقيت الدقيق
}

// 🧱 صنف كيان سجل النشاط
export class ActivityLog {
  // 🔒 الخصائص
  private props: ActivityLogProps;

  // 🏗️ المشيد
  constructor(props: ActivityLogProps) {
    this.props = props;
  }

  // 🆔 المعرف
  public get id(): string {
    return this.props.id;
  }

  // 👤 معرف الفاعل
  public get actorId(): string {
    return this.props.actorId;
  }

  // 👤 اسم الفاعل
  public get actorName(): string {
    return this.props.actorName;
  }

  // 📜 الدور
  public get actorRole(): string {
    return this.props.actorRole;
  }

  // ⚡ نوع العملية
  public get action(): string {
    return this.props.action;
  }

  // 🎯 المورد
  public get targetResource(): string {
    return this.props.targetResource;
  }

  // 📝 التفاصيل
  public get details(): string {
    return this.props.details;
  }

  // 🌐 عنوان IP
  public get ipAddress(): string | undefined {
    return this.props.ipAddress;
  }

  // ⏰ الوقت
  public get timestamp(): string {
    return this.props.timestamp;
  }
}
