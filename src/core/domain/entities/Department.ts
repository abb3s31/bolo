// 🏛️ كائن النطاق (Domain Entity): القسم العلمي - Clean Architecture & SOLID

// 📜 واجهة خصائص القسم العلمي
export interface DepartmentProps {
  id: string; // 🆔 المعرف الفريد للقسم
  name: string; // 🏷️ اسم القسم (مثال: هندسة تقنيات الحاسوب)
  code: string; // 🔤 رمز القسم (مثال: CITE)
  headOfDepartmentId?: string; // 👤 معرف رئيس القسم
  headOfDepartmentName?: string; // 👤 اسم رئيس القسم
  stagesCount: number; // 🎓 عدد المراحل الدراسية (افتراضياً 4)
  isActive: boolean; // 🟢 هل القسم مفعل
  description?: string; // 📝 وصف مختصر للقسم
}

// 🧱 صنف كيان القسم العلمي
export class Department {
  // 🔒 خصائص القسم
  private props: DepartmentProps;

  // 🏗️ المشيد
  constructor(props: DepartmentProps) {
    this.props = props;
  }

  // 🆔 المعرف
  public get id(): string {
    return this.props.id;
  }

  // 🏷️ اسم القسم
  public get name(): string {
    return this.props.name;
  }

  // 🔤 رمز القسم
  public get code(): string {
    return this.props.code;
  }

  // 👤 معرف رئيس القسم
  public get headOfDepartmentId(): string | undefined {
    return this.props.headOfDepartmentId;
  }

  // 👤 اسم رئيس القسم
  public get headOfDepartmentName(): string | undefined {
    return this.props.headOfDepartmentName;
  }

  // 🎓 عدد المراحل
  public get stagesCount(): number {
    return this.props.stagesCount;
  }

  // 🟢 هل القسم نشط
  public get isActive(): boolean {
    return this.props.isActive;
  }

  // 📝 الوصف
  public get description(): string | undefined {
    return this.props.description;
  }

  // 👔 تعيين رئيس قسم جديد
  public assignHeadOfDepartment(teacherId: string, teacherName: string): void {
    this.props.headOfDepartmentId = teacherId;
    this.props.headOfDepartmentName = teacherName;
  }
}
