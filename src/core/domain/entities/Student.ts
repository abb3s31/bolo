// 🎓 كائن النطاق (Domain Entity): الطالب - Clean Architecture & SOLID

// 📜 استيراد كائنات القيمة
import { Email } from '../value-objects/Email';
import { UniversityNumber } from '../value-objects/UniversityNumber';

// 🏛️ واجهة خصائص الطالب النطاقية
export interface StudentProps {
  id: string; // 🆔 المعرف الفريد للطالب
  fullName: string; // 👤 الاسم الكامل
  universityNumber: UniversityNumber; // 🔢 الرقم الجامعي كائن قيمة
  email: Email; // 📧 البريد الأكاديمي كائن قيمة
  departmentId: string; // 🏛️ معرف القسم العلمي
  departmentName: string; // 🏛️ اسم القسم
  stageId: string; // 🎓 معرف المرحلة
  stageNumber: number; // 🎓 رقم المرحلة (1 - 4)
  shiftType: 'morning' | 'evening'; // ☀️ نوع الدراسة (صباحي / مسائي)
  isActive: boolean; // 🟢 حالة التفعيل والنشاط
  enrolledAt: string; // 🗓️ تاريخ التسجيل
}

// 🧱 صنف كيان الطالب (Domain Entity)
export class Student {
  // 🔒 خصائص الكيان الخاصة
  private props: StudentProps;

  // 🏗️ المشيد
  constructor(props: StudentProps) {
    // 🛡️ حفظ الخصائص
    this.props = props;
  }

  // 🆔 معرف الطالب
  public get id(): string {
    return this.props.id;
  }

  // 👤 الاسم الكامل
  public get fullName(): string {
    return this.props.fullName;
  }

  // 🔢 الرقم الجامعي
  public get universityNumber(): UniversityNumber {
    return this.props.universityNumber;
  }

  // 📧 البريد الأكاديمي
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

  // 🎓 معرف المرحلة
  public get stageId(): string {
    return this.props.stageId;
  }

  // 🎓 رقم المرحلة
  public get stageNumber(): number {
    return this.props.stageNumber;
  }

  // ☀️ نوع الدراسة
  public get shiftType(): 'morning' | 'evening' {
    return this.props.shiftType;
  }

  // 🟢 هل الحساب مفعل
  public get isActive(): boolean {
    return this.props.isActive;
  }

  // 🗓️ تاريخ التسجيل
  public get enrolledAt(): string {
    return this.props.enrolledAt;
  }

  // 🔄 تفعيل حساب الطالب
  public activate(): void {
    this.props.isActive = true;
  }

  // ⛔ تعطيل حساب الطالب
  public deactivate(): void {
    this.props.isActive = false;
  }

  // 🎓 ترقية الطالب إلى المرحلة التالية
  public promoteToNextStage(): void {
    if (this.props.stageNumber < 4) {
      this.props.stageNumber += 1;
    }
  }
}
