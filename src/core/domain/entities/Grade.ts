// 📊 كائن النطاق (Domain Entity): سجل الدرجات والسعي الأكاديمي - Clean Architecture & SOLID

// 📜 استيراد كائن القيمة للدرجة
import { GradeScore } from '../value-objects/GradeScore';

// 🏛️ واجهة خصائص السعي والدرجات
export interface GradeProps {
  id: string; // 🆔 معرف السجل
  studentId: string; // 🎓 معرف الطالب
  studentName: string; // 👤 اسم الطالب
  courseId: string; // 📚 معرف المادة
  courseName: string; // 📚 اسم المادة
  academicYear: string; // 🗓️ السنة الدراسية (مثال: 2026-2027)
  midtermScore?: GradeScore; // 📝 درجة امتحان نصف السنة / المد (من 30 مثلاً)
  courseworkScore?: GradeScore; // 🧪 درجة السعي والنشاط اليومي (من 20 مثلاً)
  finalExamScore?: GradeScore; // 🏆 درجة الامتحان النهائي (من 50 مثلاً)
  totalScore?: GradeScore; // 💯 الدرجة الكلية المحسوبة (من 100)
}

// 🧱 صنف كيان الدرجة
export class Grade {
  // 🔒 الخصائص
  private props: GradeProps;

  // 🏗️ المشيد
  constructor(props: GradeProps) {
    this.props = props;
    // 🧮 حساب المجموع تلقائياً عند الإنشاء إذا توفرت الدرجات
    this.recalculateTotal();
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

  // 🗓️ السنة الأكاديمية
  public get academicYear(): string {
    return this.props.academicYear;
  }

  // 📝 درجة المد
  public get midtermScore(): GradeScore | undefined {
    return this.props.midtermScore;
  }

  // 🧪 درجة السعي اليومي
  public get courseworkScore(): GradeScore | undefined {
    return this.props.courseworkScore;
  }

  // 🏆 درجة الفاينل
  public get finalExamScore(): GradeScore | undefined {
    return this.props.finalExamScore;
  }

  // 💯 المجموع الكلي
  public get totalScore(): GradeScore | undefined {
    return this.props.totalScore;
  }

  // 🟢 هل الطالب ناجح ومجتاز للمادة (>= 50)
  public isPassed(): boolean {
    return this.props.totalScore ? this.props.totalScore.isPassed() : false;
  }

  // 🧮 إعادة احتساب المجموع الكلي
  private recalculateTotal(): void {
    let sum = 0;
    let hasAny = false;

    if (this.props.midtermScore) {
      sum += this.props.midtermScore.getValue();
      hasAny = true;
    }
    if (this.props.courseworkScore) {
      sum += this.props.courseworkScore.getValue();
      hasAny = true;
    }
    if (this.props.finalExamScore) {
      sum += this.props.finalExamScore.getValue();
      hasAny = true;
    }

    if (hasAny) {
      this.props.totalScore = GradeScore.create(Math.min(100, Math.max(0, sum)));
    }
  }

  // ✏️ تحديث درجات السعي
  public updateScores(midterm?: number, coursework?: number, finalExam?: number): void {
    if (midterm !== undefined) {
      this.props.midtermScore = GradeScore.create(midterm);
    }
    if (coursework !== undefined) {
      this.props.courseworkScore = GradeScore.create(coursework);
    }
    if (finalExam !== undefined) {
      this.props.finalExamScore = GradeScore.create(finalExam);
    }
    this.recalculateTotal();
  }
}
