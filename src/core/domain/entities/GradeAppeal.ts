// 📝 كائن النطاق (Domain Entity): طلب اعتراض على نتيجة درجات الامتحان - Clean Architecture

// 🏷️ نوع حالة طلب الاعتراض
export type AppealStatus = 'submitted' | 'under_review' | 'accepted_modified' | 'rejected_identical';

// 🏛️ واجهة خصائص طلب الاعتراض
export interface GradeAppealProps {
  id: string; // 🆔 معرف الاعتراض
  studentId: string; // 🎓 معرف الطالب
  studentName: string; // 👤 اسم الطالب
  courseId: string; // 📚 معرف المادة
  courseName: string; // 📚 اسم المادة
  academicYear: string; // 🗓️ السنة الدراسية
  originalFinalScore: number; // 📊 الدرجة المعترض عليها
  modifiedScore?: number; // 💯 الدرجة الجديدة في حال تصحيح الجمع
  studentObjectionReason: string; // 📝 تفاصيل اعتراض الطالب
  status: AppealStatus; // 🟢 موقف المراجعة
  committeeNotes?: string; // 💬 تقرير ومحضر تدقيق اللجنة
  reviewedBy?: string; //  اسم رئيس اللجنة أو المدقق
  submittedAt: string; // ⏰ تاريخ التقديم
  resolvedAt?: string; // ⏰ تاريخ حسم الاعتراض
}

// 🧱 صنف كيان الاعتراض على الدرجات
export class GradeAppeal {
  // 🔒 الخصائص
  private props: GradeAppealProps;

  // 🏗️ المشيد
  constructor(props: GradeAppealProps) {
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

  // 🗓️ السنة
  public get academicYear(): string {
    return this.props.academicYear;
  }

  // 📊 الدرجة الأصلية
  public get originalFinalScore(): number {
    return this.props.originalFinalScore;
  }

  // 💯 الدرجة المعدلة
  public get modifiedScore(): number | undefined {
    return this.props.modifiedScore;
  }

  // 📝 سبب الاعتراض
  public get studentObjectionReason(): string {
    return this.props.studentObjectionReason;
  }

  // 🟢 الحالة
  public get status(): AppealStatus {
    return this.props.status;
  }

  // 💬 ملاحظات اللجنة
  public get committeeNotes(): string | undefined {
    return this.props.committeeNotes;
  }

  //  المدقق
  public get reviewedBy(): string | undefined {
    return this.props.reviewedBy;
  }

  // ⏰ وقت التقديم
  public get submittedAt(): string {
    return this.props.submittedAt;
  }

  // ⏰ وقت الحسم
  public get resolvedAt(): string | undefined {
    return this.props.resolvedAt;
  }

  // ✅ قبول الاعتراض وتعديل الدرجة بعد إعادة التدقيق
  public acceptModification(newScore: number, reviewer: string, notes: string): void {
    this.props.status = 'accepted_modified';
    this.props.modifiedScore = newScore;
    this.props.reviewedBy = reviewer;
    this.props.committeeNotes = notes;
    this.props.resolvedAt = new Date().toISOString();
  }

  // ❌ رفض الاعتراض وتأكيد مطابقة الدرجة الدفترية
  public rejectIdentical(reviewer: string, notes?: string): void {
    this.props.status = 'rejected_identical';
    this.props.reviewedBy = reviewer;
    this.props.committeeNotes = notes || 'تمت إعادة تدقيق جمع الدرجات والدفتر الامتحاني والدرجة مطابقة تماماً.';
    this.props.resolvedAt = new Date().toISOString();
  }
}
