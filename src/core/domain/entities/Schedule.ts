// 🗓️ كائن النطاق (Domain Entity): المحاضرة والجدول الأسبوعي - Clean Architecture

// 📜 أيام الأسبوع المعتمدة للدوام
export type WeekDay = 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday';

// 🏛️ واجهة خصائص المحاضرة في الجدول
export interface ScheduleProps {
  id: string; // 🆔 المعرف الفريد للمحاضرة في الجدول
  courseId: string; // 📚 معرف المادة
  courseName: string; // 📚 اسم المادة
  teacherId: string; //  معرف الأستاذ المحاضر
  teacherName: string; // 👤 اسم الأستاذ
  departmentId: string; // 🏛️ معرف القسم
  stageNumber: number; // 🎓 رقم المرحلة
  day: WeekDay; // 🗓️ يوم الأسبوع
  startTime: string; // ⏰ وقت البدء (مثال: 08:30)
  endTime: string; // ⏰ وقت الانتهاء (مثال: 10:30)
  roomHall: string; // 🏛️ القاعة أو المختبر (مثال: قاعة 3 - مجمع الفرات)
  shiftType: 'morning' | 'evening'; // ☀️ نوع الدراسة (صباحي / مسائي)
}

// 🧱 صنف كيان الجدول الأسبوعي
export class Schedule {
  // 🔒 الخصائص
  private props: ScheduleProps;

  // 🏗️ المشيد
  constructor(props: ScheduleProps) {
    this.props = props;
  }

  // 🆔 المعرف
  public get id(): string {
    return this.props.id;
  }

  // 📚 معرف المادة
  public get courseId(): string {
    return this.props.courseId;
  }

  // 📚 اسم المادة
  public get courseName(): string {
    return this.props.courseName;
  }

  //  معرف الأستاذ
  public get teacherId(): string {
    return this.props.teacherId;
  }

  // 👤 اسم الأستاذ
  public get teacherName(): string {
    return this.props.teacherName;
  }

  // 🏛️ معرف القسم
  public get departmentId(): string {
    return this.props.departmentId;
  }

  // 🎓 المرحلة
  public get stageNumber(): number {
    return this.props.stageNumber;
  }

  // 🗓️ اليوم
  public get day(): WeekDay {
    return this.props.day;
  }

  // ⏰ وقت البدء
  public get startTime(): string {
    return this.props.startTime;
  }

  // ⏰ وقت الانتهاء
  public get endTime(): string {
    return this.props.endTime;
  }

  // 🏛️ القاعة الدراسية
  public get roomHall(): string {
    return this.props.roomHall;
  }

  // ☀️ نوع الدراسة
  public get shiftType(): 'morning' | 'evening' {
    return this.props.shiftType;
  }
}
