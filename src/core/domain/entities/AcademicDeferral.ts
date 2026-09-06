// ⏸️ كائن النطاق (Domain Entity): طلبات وقرارات التأجيل واستئناف وترقين القيد الأكاديمي - Clean Architecture

// 🏷️ نوع المعاملة الأكاديمية
export type AcademicDeferralType = 'year_deferral' | 'semester_deferral' | 'resume_study' | 'dismissal_withdrawal';

// 🏷️ موقف قرار مجلس الكلية
export type AcademicDeferralStatus = 'pending_review' | 'approved_by_board' | 'rejected' | 'executed_active';

// 🏛️ واجهة خصائص معاملة القيد الأكاديمي
export interface AcademicDeferralProps {
  id: string; // 🆔 معرف المعاملة
  studentId: string; // 🎓 معرف الطالب
  studentName: string; // 👤 اسم الطالب
  universityNumber: string; // 🔢 الرقم الجامعي
  departmentId: string; // 🏛️ معرف القسم
  departmentName: string; // 🏛️ اسم القسم
  stageNumber: number; // 📚 المرحلة الدراسية
  academicYear: string; // 🗓️ العام الدراسي للطلب
  deferralType: AcademicDeferralType; // 🏷️ نوع الطلب
  reason: string; // 📝 سبب الطلب (عذر مرضي، عمل، ظرف عائلي)
  supportingDocumentUrl?: string; // 📎 رابط المستند الثبوتي / التقرير الطبي
  status: AcademicDeferralStatus; // 🟢 موقف الطلب
  boardDecisionNumber?: string; // ⚖️ رقم كتاب/أمر مجلس الكلية
  boardDecisionDate?: string; // 🗓️ تاريخ جلسة المجلس
  boardNotes?: string; // 💬 ملاحظات وتوجيهات مجلس الكلية
  requestedAt: string; // ⏰ تاريخ التقديم
  resolvedAt?: string; // ⏰ تاريخ صدور الأمر
}

// 🧱 صنف كيان المعاملة الأكاديمية
export class AcademicDeferral {
  // 🔒 الخصائص
  private props: AcademicDeferralProps;

  // 🏗️ المشيد
  constructor(props: AcademicDeferralProps) {
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

  // 🔢 الرقم الجامعي
  public get universityNumber(): string {
    return this.props.universityNumber;
  }

  // 🏛️ اسم القسم
  public get departmentName(): string {
    return this.props.departmentName;
  }

  // 📚 المرحلة
  public get stageNumber(): number {
    return this.props.stageNumber;
  }

  // 🗓️ العام الدراسي
  public get academicYear(): string {
    return this.props.academicYear;
  }

  // 🏷️ نوع الطلب
  public get deferralType(): AcademicDeferralType {
    return this.props.deferralType;
  }

  // 📝 السبب
  public get reason(): string {
    return this.props.reason;
  }

  // 🟢 موقف الطلب
  public get status(): AcademicDeferralStatus {
    return this.props.status;
  }

  // ⚖️ رقم قرار المجلس
  public get boardDecisionNumber(): string | undefined {
    return this.props.boardDecisionNumber;
  }

  // 💬 ملاحظات المجلس
  public get boardNotes(): string | undefined {
    return this.props.boardNotes;
  }

  // ⚖️ اعتماد موافقة مجلس الكلية
  public approveByBoard(decisionNumber: string, notes?: string): void {
    this.props.status = 'approved_by_board';
    this.props.boardDecisionNumber = decisionNumber;
    this.props.boardDecisionDate = new Date().toISOString();
    if (notes) this.props.boardNotes = notes;
    this.props.resolvedAt = new Date().toISOString();
  }

  // ❌ رفض الطلب من قبل المجلس
  public rejectByBoard(notes: string): void {
    this.props.status = 'rejected';
    this.props.boardNotes = notes;
    this.props.resolvedAt = new Date().toISOString();
  }
}
