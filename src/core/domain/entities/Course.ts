// 📚 كائن النطاق (Domain Entity): المادة الدراسية / المنهج الأكاديمي - Clean Architecture

// 📜 واجهة خصائص المادة الدراسية
export interface CourseProps {
  id: string; // 🆔 المعرف الفريد للمادة
  name: string; // 🏷️ اسم المادة (مثال: البرمجة الكينونية OOP)
  code: string; // 🔤 رمز المادة (مثال: CS201)
  departmentId: string; // 🏛️ معرف القسم
  stageNumber: number; // 🎓 رقم المرحلة (1 - 4)
  semester: 1 | 2; // 🗓️ الفصل الدراسي (الأول / الثاني)
  creditHours: number; // ⏳ عدد الساعات المعتمدة
  theoryHours: number; // 📖 الساعات النظرية
  practicalHours: number; // 💻 الساعات العملية
  isActive: boolean; // 🟢 حالة تفعيل المادة
}

// 🧱 صنف كيان المادة الدراسية
export class Course {
  // 🔒 خصائص المادة
  private props: CourseProps;

  // 🏗️ المشيد
  constructor(props: CourseProps) {
    this.props = props;
  }

  // 🆔 المعرف
  public get id(): string {
    return this.props.id;
  }

  // 🏷️ الاسم
  public get name(): string {
    return this.props.name;
  }

  // 🔤 الرمز
  public get code(): string {
    return this.props.code;
  }

  // 🏛️ معرف القسم
  public get departmentId(): string {
    return this.props.departmentId;
  }

  // 🎓 المرحلة
  public get stageNumber(): number {
    return this.props.stageNumber;
  }

  // 🗓️ الفصل الدراسي
  public get semester(): 1 | 2 {
    return this.props.semester;
  }

  // ⏳ الساعات المعتمدة الكلية
  public get creditHours(): number {
    return this.props.creditHours;
  }

  // 📖 الساعات النظرية
  public get theoryHours(): number {
    return this.props.theoryHours;
  }

  // 💻 الساعات العملية
  public get practicalHours(): number {
    return this.props.practicalHours;
  }

  // 🟢 هل المادة مفعلة
  public get isActive(): boolean {
    return this.props.isActive;
  }
}
