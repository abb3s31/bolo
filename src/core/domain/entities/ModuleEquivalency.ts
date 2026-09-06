// 📜 كائن النطاق (Domain Entity): المقاصة العلمية ومعادلة المواد للطلاب المنقولين - Clean Architecture

// 🏷️ نوع حالة قرار المقاصة العلمية
export type EquivalencyDecisionStatus = 'approved_exempt' | 'rejected_insufficient_syllabus' | 'rejected_low_grade';

// 🏛️ واجهة خصائص المقاصة العلمية للمقرر
export interface ModuleEquivalencyProps {
  id: string; // 🆔 معرف المقاصة
  studentId: string; // 🎓 معرف الطالب
  studentName: string; // 👤 اسم الطالب
  previousUniversityName: string; // 🏛️ اسم الجامعة السابقة المنقول منها
  externalCourseName: string; // 📚 اسم المادة في الجامعة السابقة
  externalCourseGrade: number; // 📊 درجة المادة السابقة
  externalCredits: number; // ⏳ ساعات المادة السابقة
  targetCourseId: string; // 📚 معرف المادة المعادلة في جامعتنا
  targetCourseName: string; // 📚 اسم المادة المعادلة في جامعتنا
  targetCourseCredits: number; // ⏳ ساعات المادة في جامعتنا
  syllabusMatchPercentage: number; // 🎯 نسبة تطابق المفردات والمفاهيم (يجب أن تكون >= 75%)
  status: EquivalencyDecisionStatus; // ⚖️ قرار لجنة المقاصة
  committeeNotes?: string; // 💬 تقرير وملاحظات لجنة المقاصة العلمية
  approvedBy?: string; //  اسم رئيس اللجنة العلمية
  evaluatedAt: string; // ⏰ تاريخ التقييم
}

// 🧱 صنف كيان المقاصة العلمية
export class ModuleEquivalency {
  // 🔒 الخصائص
  private props: ModuleEquivalencyProps;

  // 🏗️ المشيد
  constructor(props: ModuleEquivalencyProps) {
    this.props = props;
    this.evaluateAutomaticEligibility();
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

  // 🏛️ الجامعة السابقة
  public get previousUniversityName(): string {
    return this.props.previousUniversityName;
  }

  // 📚 المادة الخارجية
  public get externalCourseName(): string {
    return this.props.externalCourseName;
  }

  // 📊 درجة المادة الخارجية
  public get externalCourseGrade(): number {
    return this.props.externalCourseGrade;
  }

  // ⏳ ساعات المادة الخارجية
  public get externalCredits(): number {
    return this.props.externalCredits;
  }

  // 📚 معرف المادة المحلية
  public get targetCourseId(): string {
    return this.props.targetCourseId;
  }

  // 📚 اسم المادة المحلية
  public get targetCourseName(): string {
    return this.props.targetCourseName;
  }

  // ⏳ ساعات المادة المحلية
  public get targetCourseCredits(): number {
    return this.props.targetCourseCredits;
  }

  // 🎯 نسبة التطابق
  public get syllabusMatchPercentage(): number {
    return this.props.syllabusMatchPercentage;
  }

  // ⚖️ حالة القرار
  public get status(): EquivalencyDecisionStatus {
    return this.props.status;
  }

  // 💬 ملاحظات اللجنة
  public get committeeNotes(): string | undefined {
    return this.props.committeeNotes;
  }

  //  رئيس اللجنة
  public get approvedBy(): string | undefined {
    return this.props.approvedBy;
  }

  // ⏰ تاريخ التقييم
  public get evaluatedAt(): string {
    return this.props.evaluatedAt;
  }

  // 🟢 هل المادة معفاة رسمياً
  public get isExempted(): boolean {
    return this.props.status === 'approved_exempt';
  }

  // 🧮 تقييم شروط المقاصة الأكاديمية الصادرة عن وزارة التعليم العالي
  // (نسبة تطابق المفردات >= 75% والدرجة >= 50%)
  private evaluateAutomaticEligibility(): void {
    if (this.props.externalCourseGrade < 50) {
      this.props.status = 'rejected_low_grade';
    } else if (this.props.syllabusMatchPercentage < 75) {
      this.props.status = 'rejected_insufficient_syllabus';
    } else {
      this.props.status = 'approved_exempt';
    }
  }

  // ✏️ اعتماد قرار المقاصة يدوياً بواسطة اللجنة العلمية
  public finalizeDecision(
    status: EquivalencyDecisionStatus,
    committeeHead: string,
    notes: string
  ): void {
    this.props.status = status;
    this.props.approvedBy = committeeHead;
    this.props.committeeNotes = notes;
  }
}
