//  كائن النطاق (Domain Entity): التدريسي / الأستاذ الجامعي - Clean Architecture

// 📜 استيراد كائنات القيمة
import { Email } from '../value-objects/Email';

// 🏛️ واجهة خصائص التدريسي
export interface TeacherProps {
  id: string; // 🆔 المعرف الفريد للأستاذ
  fullName: string; // 👤 الاسم الرباعي واللقب
  academicTitle: string; // 🎓 اللقب العلمي (أستاذ، أستاذ مساعد، مدرس، مدرس مساعد)
  specialization: string; // 🔬 التخصص الدقيق
  email: Email; // 📧 البريد الرسمي
  departmentId: string; // 🏛️ معرف القسم التابع له
  departmentName: string; // 🏛️ اسم القسم
  assignedSubjectIds: string[]; // 📚 المواد المكلف بتدريسها
  isActive: boolean; // 🟢 حالة التفعيل
  phone?: string; // 📱 رقم الهاتف
}

// 🧱 صنف كيان التدريسي (Teacher Domain Entity)
export class Teacher {
  // 🔒 خصائص الأستاذ
  private props: TeacherProps;

  // 🏗️ المشيد
  constructor(props: TeacherProps) {
    this.props = props;
  }

  // 🆔 المعرف
  public get id(): string {
    return this.props.id;
  }

  // 👤 الاسم الكامل
  public get fullName(): string {
    return this.props.fullName;
  }

  // 🎓 اللقب العلمي
  public get academicTitle(): string {
    return this.props.academicTitle;
  }

  // 🔬 التخصص
  public get specialization(): string {
    return this.props.specialization;
  }

  // 📧 البريد الرسمي
  public get email(): Email {
    return this.props.email;
  }

  // 🏛️ معرف القسم
  public get departmentId(): string {
    return this.props.departmentId;
  }

  // 🏛️ اسم القسم
  public get departmentName(): string {
    return this.props.departmentName;
  }

  // 📚 قائمة المواد المكلف بها
  public get assignedSubjectIds(): string[] {
    return [...this.props.assignedSubjectIds];
  }

  // 🟢 حالة الحساب
  public get isActive(): boolean {
    return this.props.isActive;
  }

  // 📱 رقم الهاتف
  public get phone(): string | undefined {
    return this.props.phone;
  }

  // ➕ تكليف الأستاذ بمادة جديدة
  public assignSubject(subjectId: string): void {
    if (!this.props.assignedSubjectIds.includes(subjectId)) {
      this.props.assignedSubjectIds.push(subjectId);
    }
  }

  // ➖ إعفاء الأستاذ من مادة
  public unassignSubject(subjectId: string): void {
    this.props.assignedSubjectIds = this.props.assignedSubjectIds.filter(id => id !== subjectId);
  }
}
