// 📜 كائن النطاق (Domain Entity): براءة الذمة الجامعية للتخرج - Clean Architecture

// 🏷️ نوع حالة براءة الذمة في كل جهة
export type ClearanceSectionStatus = 'cleared' | 'pending' | 'rejected';

// 🏛️ واجهة خصائص براءة الذمة الأكاديمية
export interface GraduationClearanceProps {
  id: string; // 🆔 معرف براءة الذمة
  studentId: string; // 🎓 معرف الطالب
  studentName: string; // 👤 اسم الطالب
  universityNumber: string; // 🔢 الرقم الجامعي
  departmentId: string; // 🏛️ معرف القسم
  departmentName: string; // 🏛️ اسم القسم
  departmentClearance: ClearanceSectionStatus; // 🔬 براءة ذمة القسم والمختبرات
  libraryClearance: ClearanceSectionStatus; // 📚 براءة ذمة المكتبة المركزية
  accountsClearance: ClearanceSectionStatus; // 💳 براءة ذمة الحسابات والأقساط
  registrationClearance: ClearanceSectionStatus; // 📑 براءة ذمة شعبة التسجيل
  isFullyCleared: boolean; // 🟢 هل براءة الذمة مكتملة 100%
  rejectionReason?: string; // ❌ سبب التعليق أو الرفض إن وجد
  issuedAt: string; // ⏰ تاريخ الإنشاء
  completedAt?: string; // ⏰ تاريخ الإنجاز النهائي
}

// 🧱 صنف كيان براءة الذمة
export class GraduationClearance {
  // 🔒 الخصائص
  private props: GraduationClearanceProps;

  // 🏗️ المشيد
  constructor(props: GraduationClearanceProps) {
    this.props = props;
    this.checkIfFullyCleared();
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

  // 🔢 الرقم الجامعي
  public get universityNumber(): string {
    return this.props.universityNumber;
  }

  // 🏛️ اسم القسم
  public get departmentName(): string {
    return this.props.departmentName;
  }

  // 🔬 براءة ذمة القسم
  public get departmentClearance(): ClearanceSectionStatus {
    return this.props.departmentClearance;
  }

  // 📚 براءة ذمة المكتبة
  public get libraryClearance(): ClearanceSectionStatus {
    return this.props.libraryClearance;
  }

  // 💳 براءة ذمة الحسابات
  public get accountsClearance(): ClearanceSectionStatus {
    return this.props.accountsClearance;
  }

  // 📑 براءة ذمة التسجيل
  public get registrationClearance(): ClearanceSectionStatus {
    return this.props.registrationClearance;
  }

  // 🟢 الاكتمال العام
  public get isFullyCleared(): boolean {
    return this.props.isFullyCleared;
  }

  // ❌ سبب الرفض
  public get rejectionReason(): string | undefined {
    return this.props.rejectionReason;
  }

  // ⏰ تاريخ الإنشاء
  public get issuedAt(): string {
    return this.props.issuedAt;
  }

  // ⏰ تاريخ الإكمال
  public get completedAt(): string | undefined {
    return this.props.completedAt;
  }

  // 🧮 فحص هل اكتملت كافة براءات الذمة
  private checkIfFullyCleared(): void {
    const isAllCleared =
      this.props.departmentClearance === 'cleared' &&
      this.props.libraryClearance === 'cleared' &&
      this.props.accountsClearance === 'cleared' &&
      this.props.registrationClearance === 'cleared';

    this.props.isFullyCleared = isAllCleared;
    if (isAllCleared && !this.props.completedAt) {
      this.props.completedAt = new Date().toISOString();
    }
  }

  // 🟢 توثيق موافقة جهة معينة
  public approveSection(section: 'department' | 'library' | 'accounts' | 'registration'): void {
    if (section === 'department') this.props.departmentClearance = 'cleared';
    if (section === 'library') this.props.libraryClearance = 'cleared';
    if (section === 'accounts') this.props.accountsClearance = 'cleared';
    if (section === 'registration') this.props.registrationClearance = 'cleared';

    this.checkIfFullyCleared();
  }

  // ❌ رفض أو تعليق جهة معينة
  public rejectSection(
    section: 'department' | 'library' | 'accounts' | 'registration',
    reason: string
  ): void {
    if (section === 'department') this.props.departmentClearance = 'rejected';
    if (section === 'library') this.props.libraryClearance = 'rejected';
    if (section === 'accounts') this.props.accountsClearance = 'rejected';
    if (section === 'registration') this.props.registrationClearance = 'rejected';

    this.props.rejectionReason = reason;
    this.props.isFullyCleared = false;
  }
}
