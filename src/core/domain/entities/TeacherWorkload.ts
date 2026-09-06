//  كائن النطاق (Domain Entity): النصاب والعبء التدريسي للأستاذ - Clean Architecture

// 🏛️ واجهة خصائص النصاب التدريسي
export interface TeacherWorkloadProps {
  teacherId: string; //  معرف الأستاذ
  teacherName: string; // 👤 اسم الأستاذ
  academicTitle: string; // 📜 اللقب العلمي (أستاذ، أستاذ مساعد، مدرس، مدرس مساعد)
  assignedCoursesCount: number; // 📚 عدد المواد المكلف بها
  totalTheoryHours: number; // 📖 إجمالي الساعات النظرية الأسبوعية
  totalPracticalHours: number; // 🔬 إجمالي الساعات العملية الأسبوعية
  totalSupervisionHours: number; // 🎓 ساعات الإشراف على مشاريع التخرج
  totalWeeklyHours: number; // ⏳ مجموع الساعات الأسبوعية الكلية
  requiredQuotaHours: number; // 🎯 النصاب القانوني المطلوب حسب اللقب
  overloadHours: number; // ➕ ساعات المحاضرات الإضافية (إن وجدت)
  isQuotaFulfilled: boolean; // 🟢 هل استوفى الأستاذ نصابه القانوني
}

// 🧱 صنف كيان النصاب التدريسي
export class TeacherWorkload {
  // 🔒 الخصائص
  private props: TeacherWorkloadProps;

  // 🏗️ المشيد
  constructor(props: TeacherWorkloadProps) {
    this.props = props;
    this.recalculateLoad();
  }

  //  معرف الأستاذ
  public get teacherId(): string {
    return this.props.teacherId;
  }

  // 👤 اسم الأستاذ
  public get teacherName(): string {
    return this.props.teacherName;
  }

  // 📜 اللقب العلمي
  public get academicTitle(): string {
    return this.props.academicTitle;
  }

  // 📚 عدد المواد
  public get assignedCoursesCount(): number {
    return this.props.assignedCoursesCount;
  }

  // 📖 الساعات النظرية
  public get totalTheoryHours(): number {
    return this.props.totalTheoryHours;
  }

  // 🔬 الساعات العملية
  public get totalPracticalHours(): number {
    return this.props.totalPracticalHours;
  }

  // 🎓 ساعات الإشراف
  public get totalSupervisionHours(): number {
    return this.props.totalSupervisionHours;
  }

  // ⏳ المجموع الأسبوعي
  public get totalWeeklyHours(): number {
    return this.props.totalWeeklyHours;
  }

  // 🎯 النصاب المطلوب
  public get requiredQuotaHours(): number {
    return this.props.requiredQuotaHours;
  }

  // ➕ الساعات الإضافية
  public get overloadHours(): number {
    return this.props.overloadHours;
  }

  // 🟢 استيفاء النصاب
  public get isQuotaFulfilled(): boolean {
    return this.props.isQuotaFulfilled;
  }

  // 🧮 إعادة احتساب النصاب والساعات الإضافية وفق قانون وزارة التعليم العالي
  private recalculateLoad(): void {
    const total =
      this.props.totalTheoryHours +
      this.props.totalPracticalHours +
      this.props.totalSupervisionHours;

    this.props.totalWeeklyHours = total;
    this.props.isQuotaFulfilled = total >= this.props.requiredQuotaHours;
    this.props.overloadHours = Math.max(0, total - this.props.requiredQuotaHours);
  }
}
