// 💳 كائن النطاق (Domain Entity): سجل الأقساط والرسوم الدراسية - Clean Architecture

// 🏷️ نوع حالة القسط المالي
export type TuitionStatus = 'paid_full' | 'partial' | 'pending' | 'overdue';

// 🏛️ واجهة خصائص السجل المالي
export interface TuitionRecordProps {
  id: string; // 🆔 معرف السجل المالي
  studentId: string; // 🎓 معرف الطالب
  studentName: string; // 👤 اسم الطالب
  academicYear: string; // 🗓️ السنة الدراسية (2026-2027)
  totalAmount: number; // 💰 المبلغ الإجمالي المطلوب (مثال: 1,500,000 د.ع)
  paidAmount: number; // 💵 المبلغ المدفوع حتى الآن
  remainingAmount: number; // 📉 المبلغ المتبقي
  status: TuitionStatus; // 🟢 الحالة المالية
  lastPaymentDate?: string; // 🗓️ تاريخ آخر دفعة
  receiptNumber?: string; // 🧾 رقم وصل القبض
}

// 🧱 صنف كيان السجل المالي
export class TuitionRecord {
  // 🔒 خصائص السجل
  private props: TuitionRecordProps;

  // 🏗️ المشيد
  constructor(props: TuitionRecordProps) {
    this.props = props;
    this.recalculateStatus();
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

  // 🗓️ السنة
  public get academicYear(): string {
    return this.props.academicYear;
  }

  // 💰 المبلغ الكلي
  public get totalAmount(): number {
    return this.props.totalAmount;
  }

  // 💵 المبلغ المدفوع
  public get paidAmount(): number {
    return this.props.paidAmount;
  }

  // 📉 المبلغ المتبقي
  public get remainingAmount(): number {
    return this.props.remainingAmount;
  }

  // 🟢 الحالة المالية
  public get status(): TuitionStatus {
    return this.props.status;
  }

  // 🗓️ تاريخ آخر دفعة
  public get lastPaymentDate(): string | undefined {
    return this.props.lastPaymentDate;
  }

  // 🧾 رقم الوصل
  public get receiptNumber(): string | undefined {
    return this.props.receiptNumber;
  }

  // 🧮 إعادة احتساب المتبقي والحالة
  private recalculateStatus(): void {
    const remaining = Math.max(0, this.props.totalAmount - this.props.paidAmount);
    this.props.remainingAmount = remaining;

    if (remaining === 0) {
      this.props.status = 'paid_full';
    } else if (this.props.paidAmount > 0) {
      this.props.status = 'partial';
    } else {
      this.props.status = 'pending';
    }
  }

  // 💵 تسجيل دفعة مالية جديدة
  public recordPayment(amount: number, receiptNo: string): void {
    if (amount <= 0) {
      throw new Error('مبلغ الدفعة يجب أن يكون أكبر من الصفر ❌');
    }
    this.props.paidAmount = Math.min(this.props.totalAmount, this.props.paidAmount + amount);
    this.props.receiptNumber = receiptNo;
    this.props.lastPaymentDate = new Date().toISOString();
    this.recalculateStatus();
  }
}
