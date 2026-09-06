// 📋 كائن النطاق (Domain Entity): سجل الحضور والغياب - Clean Architecture

// 🏷️ نوع حالة الحضور
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

// 📜 واجهة خصائص سجل الحضور
export interface AttendanceProps {
  id: string; // 🆔 المعرف الفريد لسجل الحضور
  studentId: string; // 🎓 معرف الطالب
  studentName: string; // 👤 اسم الطالب
  courseId: string; // 📚 معرف المادة الدراسية
  teacherId: string; //  معرف الأستاذ المسجل للحضور
  date: string; // 🗓️ تاريخ المحاضرة (YYYY-MM-DD)
  status: AttendanceStatus; // 🟢 حالة الحضور
  notes?: string; // 📝 ملاحظات أو عذر الغياب
  createdAt: string; // ⏰ وقت التسجيل
}

// 🧱 صنف كيان الحضور
export class Attendance {
  // 🔒 الخصائص
  private props: AttendanceProps;

  // 🏗️ المشيد
  constructor(props: AttendanceProps) {
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

  //  معرف الأستاذ
  public get teacherId(): string {
    return this.props.teacherId;
  }

  // 🗓️ التاريخ
  public get date(): string {
    return this.props.date;
  }

  // 🟢 الحالة
  public get status(): AttendanceStatus {
    return this.props.status;
  }

  // 📝 الملاحظات
  public get notes(): string | undefined {
    return this.props.notes;
  }

  // ⏰ وقت الإنشاء
  public get createdAt(): string {
    return this.props.createdAt;
  }

  // 🔄 تعديل حالة الحضور مع توضيح العذر
  public updateStatus(newStatus: AttendanceStatus, notes?: string): void {
    this.props.status = newStatus;
    if (notes !== undefined) {
      this.props.notes = notes;
    }
  }
}
