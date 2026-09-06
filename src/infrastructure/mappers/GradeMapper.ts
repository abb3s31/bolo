// 🔄 محول بيانات الدرجات (Grade Data Mapper) - Clean Architecture

// 🔗 استيراد الكيان وكائنات القيمة والأنواع
import { Grade } from '@/core/domain/entities/Grade';
import { GradeScore } from '@/core/domain/value-objects/GradeScore';
import { Grade as GradeType } from '@/types';

// 🧱 صنف محول بيانات الدرجات
export class GradeMapper {
  // 📥 تحويل كائن التخزين إلى كيان النطاق
  public static toDomain(raw: GradeType): Grade {
    return new Grade({
      id: raw.id,
      studentId: raw.student_id,
      studentName: raw.student_name || 'طالب',
      courseId: raw.course_id,
      courseName: raw.course_name || 'مادة',
      academicYear: raw.academic_year_id || '2026-2027',
      midtermScore:
        raw.midterm !== undefined ? GradeScore.create(raw.midterm) : undefined,
      courseworkScore:
        raw.final_coursework_total !== undefined
          ? GradeScore.create(raw.final_coursework_total)
          : undefined,
      finalExamScore:
        raw.final_exam !== undefined ? GradeScore.create(raw.final_exam) : undefined,
    });
  }

  // 📤 تحويل كيان النطاق إلى نموذج التخزين
  public static toPersistence(grade: Grade): GradeType {
    const midterm = grade.midtermScore ? grade.midtermScore.getValue() : 0;
    const coursework = grade.courseworkScore ? grade.courseworkScore.getValue() : 0;
    const finalScore = grade.finalExamScore ? grade.finalExamScore.getValue() : 0;
    const total = grade.totalScore ? grade.totalScore.getValue() : midterm + coursework + finalScore;

    return {
      id: grade.id,
      student_id: grade.studentId,
      student_name: grade.studentName || '',
      university_number: '',
      course_id: grade.courseId,
      course_name: grade.courseName,
      teacher_id: '',
      academic_year_id: grade.academicYear,
      semester: 1,
      quiz1: 5,
      quiz2: 5,
      assignment1: 5,
      assignment2: 5,
      report: 10,
      midterm: midterm,
      practical: 0,
      final_coursework_total: coursework,
      final_exam: finalScore,
      final_total: total,
      letter_grade: grade.totalScore ? grade.totalScore.getLetterRating() : 'مقبول',
      is_locked: false,
      updated_at: new Date().toISOString(),
    };
  }
}
