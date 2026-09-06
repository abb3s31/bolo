// 🏆 كائن النطاق (Domain Entity): تصنيف وترتيب خريجي الأوائل - Clean Architecture

// 🏛️ واجهة خصائص رتبة الخريج المتفوق
export interface TopGraduateRankProps {
  rankPosition: number; // 🥇 المركز والترتيب (1، 2، 3 ...)
  studentId: string; // 🎓 معرف الطالب
  studentName: string; // 👤 اسم الطالب
  universityNumber: string; // 🔢 الرقم الجامعي
  departmentId: string; // 🏛️ معرف القسم
  departmentName: string; // 🏛️ اسم القسم
  cumulativeGpa: number; // 📊 المعدل التراكمي العام (من 100)
  totalCreditsCompleted: number; // ⏳ إجمالي الساعات المكتملة (240 ECTS)
  graduationYear: string; // 🗓️ سنة التخرج (2026-2027)
  graduationRating: string; // 📜 التقدير العام (امتياز، جيد جداً)
  isEligibleForHonors: boolean; // 🎖️ مؤهل لتكريم الأوائل الوزاري
}

// 🧱 صنف كيان الخريج المتفوق
export class TopGraduateRank {
  // 🔒 الخصائص
  private props: TopGraduateRankProps;

  // 🏗️ المشيد
  constructor(props: TopGraduateRankProps) {
    this.props = props;
  }

  // 🥇 الترتيب
  public get rankPosition(): number {
    return this.props.rankPosition;
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

  // 🏛️ معرف القسم
  public get departmentId(): string {
    return this.props.departmentId;
  }

  // 🏛️ اسم القسم
  public get departmentName(): string {
    return this.props.departmentName;
  }

  // 📊 المعدل التراكمي
  public get cumulativeGpa(): number {
    return this.props.cumulativeGpa;
  }

  // ⏳ الساعات المكتملة
  public get totalCreditsCompleted(): number {
    return this.props.totalCreditsCompleted;
  }

  // 🗓️ سنة التخرج
  public get graduationYear(): string {
    return this.props.graduationYear;
  }

  // 📜 التقدير العام
  public get graduationRating(): string {
    return this.props.graduationRating;
  }

  // 🎖️ استحقاق التكريم الوزاري
  public get isEligibleForHonors(): boolean {
    return this.props.isEligibleForHonors;
  }
}
