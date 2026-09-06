const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/mock-data.ts');
let content = fs.readFileSync(filePath, 'utf8');

const marker = 'export const INITIAL_STUDENT_SUBMISSIONS: StudentTaskSubmission[] = [';
const idx = content.indexOf(marker);

if (idx === -1) {
  console.error('Marker not found');
  process.exit(1);
}

const newSubmissionsCode = `export const INITIAL_STUDENT_SUBMISSIONS: StudentTaskSubmission[] = [
  // 1. تسليم واجب برمجي فردي (🟢 مقبول)
  {
    id: 'sub-assign-1',
    task_id: 'task-assign-1',
    course_id: 'course-1',
    student_id: 'usr-std-cce-1',
    student_name: 'كرار حيدر علي',
    student_university_number: '20251001',
    submission_type: 'individual',
    group_members: [],
    file_name: 'CS201_Assignment1_KarrarHaider.pdf',
    file_url: 'data:application/pdf;base64,JVBERi0xLjQK',
    file_size_bytes: 245760,
    student_notes: 'السلام عليكم دكتور، تم حل الواجب وتطبيق تخصيص الذاكرة الديناميكية (new & delete) بنجاح وإرفاق لقطات التنفيذ.',
    submitted_at: '2026-03-03T14:20:00.000Z',
    is_late: false,
    review_decision: 'accepted',
    revision_count: 1,
    allow_resubmission: false,
    score: 5.0,
    teacher_feedback: 'حل ممتاز ومرتب، الكود نظيف وتمت معالجة تسريب الذاكرة بنجاح. أحسنت يا كرار.',
    graded_by: 'د. صادق الموسوي',
    graded_at: '2026-03-04T10:15:00.000Z',
    status: 'graded',
    created_at: '2026-03-03T14:20:00.000Z',
    updated_at: '2026-03-04T10:15:00.000Z',
  },

  // 2. تسليم تقرير فصلي وبحث مشترك (🟢 مقبول - استلال علمي 6.8%)
  {
    id: 'sub-report-1',
    task_id: 'task-report-1',
    course_id: 'course-1',
    student_id: 'usr-std-cce-1',
    student_name: 'كرار حيدر علي',
    student_university_number: '20251001',
    submission_type: 'group',
    group_members: [
      { student_id: 'usr-std-cce-1', full_name: 'كرار حيدر علي', university_number: '20251001' },
      { student_id: 'usr-std-cce-2', full_name: 'زينب أحمد جاسم', university_number: '20251002' },
      { student_id: 'usr-std-cce-3', full_name: 'حسين محمد كاظم', university_number: '20251003' }
    ],
    file_name: 'Memory_Management_Research_Report_GroupA.pdf',
    file_url: 'data:application/pdf;base64,JVBERi0xLjQK',
    file_size_bytes: 840500,
    student_notes: 'تحية طيبة دكتورنا العزيز، هذا التقرير المشترك لفريق العمل حول مقارنة إدارة الذاكرة مع المؤشرات الذكية ومراجع IEEE الحديثة.',
    submitted_at: '2026-03-04T18:45:00.000Z',
    is_late: false,
    review_decision: 'accepted',
    plagiarism_percentage: 6.8,
    revision_count: 1,
    allow_resubmission: false,
    score: 9.5,
    teacher_feedback: 'تقرير بحثي متكامل ورائع، توثيق مراجع IEEE سليم ونسبة الاستلال منخفضة (6.8%). درجة كاملة للفريق.',
    graded_by: 'د. صادق الموسوي',
    graded_at: '2026-03-05T09:30:00.000Z',
    status: 'graded',
    created_at: '2026-03-04T18:45:00.000Z',
    updated_at: '2026-03-05T09:30:00.000Z',
  },

  // 3. تسليم واجب فردي (🟡 يحتاج تعديل مع فتح فرصة إعادة الرفع)
  {
    id: 'sub-assign-2',
    task_id: 'task-assign-1',
    course_id: 'course-1',
    student_id: 'usr-std-cce-2',
    student_name: 'زينب أحمد جاسم',
    student_university_number: '20251002',
    submission_type: 'individual',
    group_members: [],
    file_name: 'CS201_Assignment1_Zainab.pdf',
    file_url: 'data:application/pdf;base64,JVBERi0xLjQK',
    file_size_bytes: 312000,
    student_notes: 'مرفق حل الواجب الأول لمادة البرمجة المتقدمة.',
    submitted_at: '2026-03-03T16:00:00.000Z',
    is_late: false,
    review_decision: 'needs_revision',
    decision_reason: 'الكود يحتوي أخطاء في التعامل مع الـ Null Pointers ومصفوفة الحجم الديناميكي. يرجى تصحيح الدوال وإعادة الرفع.',
    revision_deadline: '2026-03-10T14:00:00.000Z',
    revision_count: 1,
    allow_resubmission: true,
    teacher_feedback: 'يرجى تصحيح الدوال وتضمين لقطة الشاشة لشاشة المخرجات وإعادة الرفع عبر الزر المخصص قبل المهلة.',
    graded_by: 'د. صادق الموسوي',
    graded_at: '2026-03-04T11:00:00.000Z',
    status: 'resubmit_requested',
    created_at: '2026-03-03T16:00:00.000Z',
    updated_at: '2026-03-04T11:00:00.000Z',
  },

  // 4. تسليم تقرير فردي (🔴 مرفوض بسبب نسبة الاستلال العلمي)
  {
    id: 'sub-report-2',
    task_id: 'task-report-1',
    course_id: 'course-1',
    student_id: 'usr-std-cce-4',
    student_name: 'سارة عباس مهدي',
    student_university_number: '20251004',
    submission_type: 'individual',
    group_members: [],
    file_name: 'OS_Deadlock_Report_Sarah.pdf',
    file_url: 'data:application/pdf;base64,JVBERi0xLjQK',
    file_size_bytes: 450000,
    student_notes: 'تقرير عن خوارزميات تجنب الـ Deadlock في أنظمة التشغيل الحديثة.',
    submitted_at: '2026-03-02T11:30:00.000Z',
    is_late: false,
    review_decision: 'rejected',
    decision_reason: 'تم رفض التقرير بسبب تجاوز نسبة الاستلال العلمي الحد الأقصى المسموح به (34% استلال) واقتباس نصوص كاملة دون إعادة صياغة.',
    plagiarism_percentage: 34.0,
    revision_count: 1,
    allow_resubmission: false,
    score: 0.0,
    teacher_feedback: 'تقرير منسوخ مباشرة من أبحاث سابقة. يرجى مراجعة أستاذ المادة في القاعة الدراسية.',
    graded_by: 'د. صادق الموسوي',
    graded_at: '2026-03-03T09:00:00.000Z',
    status: 'graded',
    created_at: '2026-03-02T11:30:00.000Z',
    updated_at: '2026-03-03T09:00:00.000Z',
  }
];
`;

content = content.substring(0, idx) + newSubmissionsCode;
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated INITIAL_STUDENT_SUBMISSIONS');
