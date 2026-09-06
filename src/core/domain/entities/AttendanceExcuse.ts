// 📜 كائن النطاق (Domain Entity): طلب عذر الغياب الأكاديمي - Clean Architecture

// 🏷️ نوع حالة العذر (معلق، مقبول، مرفوض)
export type ExcuseStatus = 'pending' | 'approved' | 'rejected';

// 🏛️ واجهة خصائص طلب العذر
export interface AttendanceExcuseProps {
  id: string; // 🆔 معرف الطلب الفريد
  studentId: string; // 🎓 معرف الطالب
  studentName: string; // 👤 اسم الطالب
  courseId: string; // 📚 معرف المادة
  courseName: string; // 📚 اسم المادة
  absenceDate: string; // 🗓️ تاريخ يوم الغياب
  reason: string; // 📝 سبب أو تفاصيل العذر (طبي، رسمي، طارئ)
  attachmentUrl?: string; // 📎 رابط المرفق أو التقرير الطبي
  status: ExcuseStatus; // 🟢 حالة مراجعة العذر
  reviewedBy?: string; //  اسم مراجع العذر (الأستاذ أو رئيس القسم)
  reviewNotes?: string; // 💬 ملاحظات المراجعة
  submittedAt: string; // ⏰ تاريخ التقديم
  reviewedAt?: string; // ⏰ تاريخ المراجعة
}

// 🧱 صنف كيان عذر الغياب
export class AttendanceExcuse {
  // 🔒 خصائص الكيان
  private props: AttendanceExcuseProps;

  // 🏗️ المشيد
  constructor(props: AttendanceExcuseProps) {
    this.props = props;
  }

  // 🆔 المعرف
  public get id(): string {
    return this.props.id;
  }

  // 🎓 معرف الطالب
  public get studentId(): string {
    return this.props.studentId;
  }

  // 👤 اسم الطالب
  public get studentName(): string {
    return this.props.studentName;
  }

  // 📚 معرف المادة
  public get courseId(): string {
    return this.props.courseId;
  }

  // 📚 اسم المادة
  public get courseName(): string {
    return this.props.courseName;
  }

  // 🗓️ تاريخ الغياب
  public get absenceDate(): string {
    return this.props.absenceDate;
  }

  // 📝 السبب
  public get reason(): string {
    return this.props.reason;
  }

  // 📎 المرفق
  public get attachmentUrl(): string | undefined {
    return this.props.attachmentUrl;
  }

  // 🟢 الحالة
  public get status(): ExcuseStatus {
    return this.props.status;
  }

  //  المراجع
  public get reviewedBy(): string | undefined {
    return this.props.reviewedBy;
  }

  // 💬 ملاحظات المراجعة
  public get reviewNotes(): string | undefined {
    return this.props.reviewNotes;
  }

  // ⏰ وقت التقديم
  public get submittedAt(): string {
    return this.props.submittedAt;
  }

  // ⏰ وقت المراجعة
  public get reviewedAt(): string | undefined {
    return this.props.reviewedAt;
  }

  // ✅ قبول العذر الأكاديمي
  public approve(reviewerName: string, notes?: string): void {
    this.props.status = 'approved';
    this.props.reviewedBy = reviewerName;
    this.props.reviewNotes = notes || 'تم قبول العذر الأكاديمي رسمياً ✅';
    this.props.reviewedAt = new Date().toISOString();
  }

  // ❌ رفض العذر الأكاديمي
  public reject(reviewerName: string, reason: string): void {
    this.props.status = 'rejected';
    this.props.reviewedBy = reviewerName;
    this.props.reviewNotes = reason;
    this.props.reviewedAt = new Date().toISOString();
  }
}
