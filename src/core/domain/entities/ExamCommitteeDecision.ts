// ⚖️ كائن النطاق (Domain Entity): قرار اللجنة الامتحانية لمنح درجات القرار - Clean Architecture

// 🏛️ واجهة خصائص قرار اللجنة الامتحانية
export interface ExamCommitteeDecisionProps {
  id: string; // 🆔 معرف القرار الفريد
  studentId: string; // 🎓 معرف الطالب
  studentName: string; // 👤 اسم الطالب
  courseId: string; // 📚 معرف المادة
  courseName: string; // 📚 اسم المادة
  academicYear: string; // 🗓️ السنة الدراسية
  originalScore: number; // 📊 الدرجة الأصلية قبل القرار (مثال: 47)
  grantedMarks: number; // ➕ عدد درجات القرار الممنوحة (1 إلى 5 درجات)
  newFinalScore: number; // 💯 الدرجة النهائية بعد القرار (مثال: 50 - نجاح)
  decisionType: 'pass_assistance' | 'grade_upgrade'; // 🎯 غرض القرار (مساعدة للنجاح أو رفع تقدير)
  committeeHeadName: string; //  رئيس اللجنة الامتحانية
  reason: string; // 📝 محضر وقرار اللجنة
  appliedAt: string; // ⏰ تاريخ تطبيق القرار
}

// 🧱 صنف كيان قرار اللجنة الامتحانية
export class ExamCommitteeDecision {
  // 🔒 الخصائص
  private props: ExamCommitteeDecisionProps;

  // 🏗️ المشيد
  constructor(props: ExamCommitteeDecisionProps) {
    if (props.grantedMarks < 1 || props.grantedMarks > 5) {
      throw new Error('درجات القرار الوزارية يجب أن تكون بين 1 و 5 درجات فقط ❌');
    }
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
  public get originalScore(): number {
    return this.props.originalScore;
  }

  // ➕ درجات القرار
  public get grantedMarks(): number {
    return this.props.grantedMarks;
  }

  // 💯 الدرجة النهائية
  public get newFinalScore(): number {
    return this.props.newFinalScore;
  }

  // 🎯 نوع القرار
  public get decisionType(): 'pass_assistance' | 'grade_upgrade' {
    return this.props.decisionType;
  }

  //  رئيس اللجنة
  public get committeeHeadName(): string {
    return this.props.committeeHeadName;
  }

  // 📝 السبب
  public get reason(): string {
    return this.props.reason;
  }

  // ⏰ وقت التطبيق
  public get appliedAt(): string {
    return this.props.appliedAt;
  }
}
