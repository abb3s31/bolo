// 🎓 كائن النطاق (Domain Entity): مشروع التخرج ولجنة المناقشة للمرحلة الرابعة - Clean Architecture

// 🏷️ نوع حالة مشروع التخرج
export type ProjectStatus = 'submitted' | 'approved_topic' | 'under_supervision' | 'defense_scheduled' | 'passed_completed' | 'rejected_revision';

// 🏛️ واجهة خصائص مشروع التخرج
export interface GraduationProjectProps {
  id: string; // 🆔 معرف المشروع
  title: string; // 📝 عنوان مشروع التخرج
  abstractText: string; // 📄 ملخص وفكرة المشروع
  departmentId: string; // 🏛️ معرف القسم
  departmentName: string; // 🏛️ اسم القسم
  studentIds: string[]; // 👥 معرفات الطلاب المشاركين في المشروع (فردي أو فريق)
  studentNames: string[]; // 👥 أسماء الطلاب
  supervisorTeacherId: string; //  معرف الأستاذ المشرف
  supervisorTeacherName: string; //  اسم الأستاذ المشرف
  academicYear: string; // 🗓️ السنة الدراسية
  supervisorScore?: number; // 📊 تقييم المشرف المستمر (من 40)
  defenseCommitteeScore?: number; // ⚖️ تقييم لجنة المناقشة الشفهية والعملية (من 60)
  finalTotalScore?: number; // 💯 الدرجة النهائية الكلية (من 100)
  status: ProjectStatus; // 🟢 موقف المشروع
  defenseDate?: string; // 🗓️ موعد جلسة المناقشة العلنية
  committeeMembers?: string[]; //  أسماء أعضاء لجنة المناقشة
  submittedAt: string; // ⏰ تاريخ التقديم
  completedAt?: string; // ⏰ تاريخ الإنجاز النهائي
}

// 🧱 صنف كيان مشروع التخرج
export class GraduationProject {
  // 🔒 الخصائص
  private props: GraduationProjectProps;

  // 🏗️ المشيد
  constructor(props: GraduationProjectProps) {
    this.props = props;
    this.recalculateFinalScore();
  }

  // 🆔 المعرف
  public get id(): string {
    return this.props.id;
  }

  // 📝 عنوان المشروع
  public get title(): string {
    return this.props.title;
  }

  // 📄 الملخص
  public get abstractText(): string {
    return this.props.abstractText;
  }

  // 🏛️ اسم القسم
  public get departmentName(): string {
    return this.props.departmentName;
  }

  // 👥 أسماء الطلاب
  public get studentNames(): string[] {
    return this.props.studentNames;
  }

  // 👥 معرفات الطلاب
  public get studentIds(): string[] {
    return this.props.studentIds;
  }

  //  اسم المشرف
  public get supervisorTeacherName(): string {
    return this.props.supervisorTeacherName;
  }

  // 🗓️ السنة الدراسية
  public get academicYear(): string {
    return this.props.academicYear;
  }

  // 📊 درجة المشرف
  public get supervisorScore(): number | undefined {
    return this.props.supervisorScore;
  }

  // ⚖️ درجة المناقشة
  public get defenseCommitteeScore(): number | undefined {
    return this.props.defenseCommitteeScore;
  }

  // 💯 الدرجة الكلية
  public get finalTotalScore(): number | undefined {
    return this.props.finalTotalScore;
  }

  // 🟢 موقف المشروع
  public get status(): ProjectStatus {
    return this.props.status;
  }

  // 🗓️ موعد المناقشة
  public get defenseDate(): string | undefined {
    return this.props.defenseDate;
  }

  //  أعضاء اللجنة
  public get committeeMembers(): string[] | undefined {
    return this.props.committeeMembers;
  }

  // 🧮 احتساب الدرجة النهائية
  private recalculateFinalScore(): void {
    if (
      this.props.supervisorScore !== undefined &&
      this.props.defenseCommitteeScore !== undefined
    ) {
      const total = this.props.supervisorScore + this.props.defenseCommitteeScore;
      this.props.finalTotalScore = total;
      if (total >= 50) {
        this.props.status = 'passed_completed';
        this.props.completedAt = new Date().toISOString();
      } else {
        this.props.status = 'rejected_revision';
      }
    }
  }

  // 📊 رصد تقييم المشرف (من 40)
  public submitSupervisorScore(score: number): void {
    if (score < 0 || score > 40) {
      throw new Error('درجة المشرف يجب أن تكون بين 0 و 40 درجة ⚠️');
    }
    this.props.supervisorScore = score;
    this.recalculateFinalScore();
  }

  // ⚖️ رصد تقييم لجنة المناقشة (من 60)
  public recordDefenseEvaluation(score: number, members: string[], defenseDate: string): void {
    if (score < 0 || score > 60) {
      throw new Error('درجة لجنة المناقشة يجب أن تكون بين 0 و 60 درجة ⚠️');
    }
    this.props.defenseCommitteeScore = score;
    this.props.committeeMembers = members;
    this.props.defenseDate = defenseDate;
    this.recalculateFinalScore();
  }
}
