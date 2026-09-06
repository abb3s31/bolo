// 🏭 كائن النطاق (Domain Entity): التدريب الصيفي والتطبيق الميداني للمرحلة الثالثة - Clean Architecture

// 🏷️ نوع حالة التدريب الصيفي
export type SummerTrainingStatus = 'placed_registered' | 'in_training' | 'completed_passed' | 'failed_incomplete';

// 🏛️ واجهة خصائص سجل التدريب الصيفي
export interface SummerTrainingProps {
  id: string; // 🆔 معرف سجل التدريب
  studentId: string; // 🎓 معرف الطالب
  studentName: string; // 👤 اسم الطالب
  universityNumber: string; // 🔢 الرقم الجامعي
  departmentId: string; // 🏛️ معرف القسم
  departmentName: string; // 🏛️ اسم القسم
  trainingOrganizationName: string; // 🏢 اسم جهة/شركة التدريب الميداني
  trainingField: string; // 🛠️ تخصص ومجال التدريب (شبكات، صيانة، برمجة، أتمتة)
  startDate: string; // 🗓️ تاريخ بدء التدريب
  endDate: string; // 🗓️ تاريخ انتهاء التدريب
  totalWeeks: number; // ⏳ مدة التدريب بالأسابيع (عادة 4 - 8 أسابيع)
  fieldSupervisorScore?: number; // 📊 تقييم المشرف الموقعي بالشركة (من 50)
  academicSupervisorScore?: number; // 📑 تقييم التقرير والمشرف الأكاديمي (من 50)
  finalTotalScore?: number; // 💯 الدرجة الكلية النهائية (من 100)
  status: SummerTrainingStatus; // 🟢 الموقف التدريبي
  notes?: string; // 💬 ملاحظات المشرف
  completedAt?: string; // ⏰ تاريخ الإنجاز
}

// 🧱 صنف كيان التدريب الصيفي
export class SummerTraining {
  // 🔒 الخصائص
  private props: SummerTrainingProps;

  // 🏗️ المشيد
  constructor(props: SummerTrainingProps) {
    this.props = props;
    this.recalculateTrainingGrade();
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

  // 🏢 جهة التدريب
  public get trainingOrganizationName(): string {
    return this.props.trainingOrganizationName;
  }

  // 🛠️ مجال التدريب
  public get trainingField(): string {
    return this.props.trainingField;
  }

  // 📊 تقييم المشرف الموقعي
  public get fieldSupervisorScore(): number | undefined {
    return this.props.fieldSupervisorScore;
  }

  // 📑 تقييم المشرف الأكاديمي
  public get academicSupervisorScore(): number | undefined {
    return this.props.academicSupervisorScore;
  }

  // 💯 الدرجة النهائية
  public get finalTotalScore(): number | undefined {
    return this.props.finalTotalScore;
  }

  // 🟢 الموقف
  public get status(): SummerTrainingStatus {
    return this.props.status;
  }

  // 🟢 هل استوفى متطلب التدريب الصيفي للتخرج
  public get isPassed(): boolean {
    return this.props.status === 'completed_passed';
  }

  // 🧮 احتساب درجة التدريب الكلية
  private recalculateTrainingGrade(): void {
    if (
      this.props.fieldSupervisorScore !== undefined &&
      this.props.academicSupervisorScore !== undefined
    ) {
      const total = this.props.fieldSupervisorScore + this.props.academicSupervisorScore;
      this.props.finalTotalScore = total;
      if (total >= 50) {
        this.props.status = 'completed_passed';
        this.props.completedAt = new Date().toISOString();
      } else {
        this.props.status = 'failed_incomplete';
      }
    }
  }

  // 📊 رصد تقييم المشرف الموقعي (من 50)
  public recordFieldScore(score: number): void {
    if (score < 0 || score > 50) {
      throw new Error('درجة المشرف الموقعي يجب أن تكون بين 0 و 50 درجة ⚠️');
    }
    this.props.fieldSupervisorScore = score;
    this.recalculateTrainingGrade();
  }

  // 📑 رصد تقييم المشرف الأكاديمي ومناقشة التقرير (من 50)
  public recordAcademicScore(score: number, notes?: string): void {
    if (score < 0 || score > 50) {
      throw new Error('درجة التقرير الأكاديمي يجب أن تكون بين 0 و 50 درجة ⚠️');
    }
    this.props.academicSupervisorScore = score;
    if (notes) this.props.notes = notes;
    this.recalculateTrainingGrade();
  }
}
