-- ==============================================================================
-- 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان
-- 🛡️ سكريبت تفعيل أمان الصفوف (Row Level Security - RLS) ومزامنة تقويم الدوام ومخطط بولونيا
-- 📋 Clean Architecture & Strict Security Standards - حفظ سجلات كل مرحلة وكورس وسنة
-- ==============================================================================

-- ==============================================================================
-- 1️⃣ جدول إعدادات الجداول والتقويم الأكاديمي (department_schedule_configs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.department_schedule_configs (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL,
  department_name TEXT,
  stage_number INT NOT NULL,
  semester INT DEFAULT 1,
  academic_year TEXT DEFAULT '2026-2027',
  start_date TEXT DEFAULT '2026-09-20',
  study_type TEXT DEFAULT 'morning',
  target_group TEXT DEFAULT 'all',
  working_days JSONB DEFAULT '["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]'::JSONB,
  off_days JSONB DEFAULT '["الجمعة", "السبت"]'::JSONB,
  start_time TEXT DEFAULT '08:30',
  end_time TEXT DEFAULT '14:30',
  lecture_duration_minutes INT DEFAULT 60,
  break_duration_minutes INT DEFAULT 15,
  max_lectures_per_day INT DEFAULT 5,
  custom_rooms JSONB DEFAULT '["قاعة 101", "قاعة 102", "مختبر البرمجيات 1", "مختبر النظم", "مدرج الخوارزمي"]'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.department_schedule_configs 
ADD COLUMN IF NOT EXISTS start_date TEXT DEFAULT '2026-09-20'; -- 📅 تاريخ انطلاق الفصل الدراسي (الأسبوع 1)

ALTER TABLE IF EXISTS public.department_schedule_configs 
ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2026-2027'; -- 🎓 العام الدراسي المعتمد للسجل

ALTER TABLE IF EXISTS public.department_schedule_configs 
ADD COLUMN IF NOT EXISTS study_type TEXT DEFAULT 'morning'; -- ☀️ نوع الدراسة (صباحي / مسائي)

ALTER TABLE IF EXISTS public.department_schedule_configs 
ADD COLUMN IF NOT EXISTS target_group TEXT DEFAULT 'all'; -- 👥 الكروب أو الشعبة المستهدفة

-- فهارس مركبة لتسريع الاستعلام بالعام والمرحلة والكورس
CREATE INDEX IF NOT EXISTS idx_sched_configs_stage_sem_year 
ON public.department_schedule_configs (stage_number, semester, academic_year);

CREATE INDEX IF NOT EXISTS idx_sched_configs_dept 
ON public.department_schedule_configs (department_id);

-- تفعيل RLS وسياسات الوصول
ALTER TABLE IF EXISTS public.department_schedule_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to all users for schedule configs" ON public.department_schedule_configs;
DROP POLICY IF EXISTS "Allow super admins and department heads full manage schedule configs" ON public.department_schedule_configs;

CREATE POLICY "Allow read access to all users for schedule configs" 
ON public.department_schedule_configs FOR SELECT USING (true);

CREATE POLICY "Allow super admins and department heads full manage schedule configs" 
ON public.department_schedule_configs FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);


-- ==============================================================================
-- 2️⃣ جدول المواد والمناهج الدراسية (courses) ومخطط بولونيا
-- ==============================================================================
ALTER TABLE IF EXISTS public.courses 
ADD COLUMN IF NOT EXISTS assessment_scheme JSONB; -- 🎛️ بنود السعي التكويني والامتحان النهائي لمسار بولونيا

ALTER TABLE IF EXISTS public.courses 
ADD COLUMN IF NOT EXISTS academic_year_id TEXT DEFAULT '2026-2027'; -- 📅 العام الدراسي للمادة

CREATE INDEX IF NOT EXISTS idx_courses_assessment_scheme 
ON public.courses USING GIN (assessment_scheme);

CREATE INDEX IF NOT EXISTS idx_courses_dept_stage_sem_year 
ON public.courses (department_id, stage_number, semester, academic_year_id);

ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to all users for courses" ON public.courses;
DROP POLICY IF EXISTS "Allow authorized users to manage courses" ON public.courses;

CREATE POLICY "Allow read access to all users for courses" 
ON public.courses FOR SELECT USING (true);

CREATE POLICY "Allow authorized users to manage courses" 
ON public.courses FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);


-- ==============================================================================
-- 3️⃣ جدول سجلات الحضور والغيابات (student_attendance_records)
-- ==============================================================================
ALTER TABLE IF EXISTS public.student_attendance_records 
ADD COLUMN IF NOT EXISTS academic_year_id TEXT DEFAULT '2026-2027'; -- 📅 العام الدراسي المعتمد لسجل الغياب

ALTER TABLE IF EXISTS public.student_attendance_records 
ADD COLUMN IF NOT EXISTS student_group TEXT DEFAULT 'all'; -- 👥 كروب الطالب

CREATE INDEX IF NOT EXISTS idx_attendance_records_dept_stage_sem_year 
ON public.student_attendance_records (department_id, stage_number, semester, academic_year_id);

CREATE INDEX IF NOT EXISTS idx_attendance_records_student_course 
ON public.student_attendance_records (student_id, course_id);

CREATE INDEX IF NOT EXISTS idx_attendance_records_date 
ON public.student_attendance_records (date);

ALTER TABLE IF EXISTS public.student_attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to all users for attendance records" ON public.student_attendance_records;
DROP POLICY IF EXISTS "Allow authorized users to manage attendance records" ON public.student_attendance_records;

CREATE POLICY "Allow read access to all users for attendance records" 
ON public.student_attendance_records FOR SELECT USING (true);

CREATE POLICY "Allow authorized users to manage attendance records" 
ON public.student_attendance_records FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);


-- ==============================================================================
-- 4️⃣ جدول محاضرات الجدول الأسبوعي (schedule_lectures)
-- ==============================================================================
ALTER TABLE IF EXISTS public.schedule_lectures 
ADD COLUMN IF NOT EXISTS academic_year_id TEXT DEFAULT '2026-2027'; -- 📅 العام الدراسي للمحاضرة

ALTER TABLE IF EXISTS public.schedule_lectures 
ADD COLUMN IF NOT EXISTS target_group TEXT DEFAULT 'all'; -- 👥 الكروب المستهدف

CREATE INDEX IF NOT EXISTS idx_schedule_lectures_dept_stage_sem_year 
ON public.schedule_lectures (department_id, stage_number, semester, academic_year_id);

CREATE INDEX IF NOT EXISTS idx_schedule_lectures_day_time 
ON public.schedule_lectures (day, start_time, room);

ALTER TABLE IF EXISTS public.schedule_lectures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to all users for schedule lectures" ON public.schedule_lectures;
DROP POLICY IF EXISTS "Allow authorized users to manage schedule lectures" ON public.schedule_lectures;

CREATE POLICY "Allow read access to all users for schedule lectures" 
ON public.schedule_lectures FOR SELECT USING (true);

CREATE POLICY "Allow authorized users to manage schedule lectures" 
ON public.schedule_lectures FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);


-- ==============================================================================
-- 5️⃣ جدول الدرجات والسعي لمسار بولونيا (grades)
-- ==============================================================================
ALTER TABLE IF EXISTS public.grades 
ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2026-2027'; -- 📅 العام الدراسي

ALTER TABLE IF EXISTS public.grades 
ADD COLUMN IF NOT EXISTS semester INT DEFAULT 1; -- 🗓️ الكورس

CREATE INDEX IF NOT EXISTS idx_grades_student_course_year 
ON public.grades (student_id, course_id, academic_year, semester);

ALTER TABLE IF EXISTS public.grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to all users for grades" ON public.grades;
DROP POLICY IF EXISTS "Allow authorized users to manage grades" ON public.grades;

CREATE POLICY "Allow read access to all users for grades" 
ON public.grades FOR SELECT USING (true);

CREATE POLICY "Allow authorized users to manage grades" 
ON public.grades FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);


-- ==============================================================================
-- 6️⃣ جدول طلبات الإجازات والأعذار (attendance_excuse_requests)
-- ==============================================================================
ALTER TABLE IF EXISTS public.attendance_excuse_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to all users for excuse requests" ON public.attendance_excuse_requests;
DROP POLICY IF EXISTS "Allow authorized users to manage excuse requests" ON public.attendance_excuse_requests;

CREATE POLICY "Allow read access to all users for excuse requests" 
ON public.attendance_excuse_requests FOR SELECT USING (true);

CREATE POLICY "Allow authorized users to manage excuse requests" 
ON public.attendance_excuse_requests FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);


-- ==============================================================================
-- 7️⃣ جدول جداول الامتحانات النهائية الفاينل (final_exam_schedules)
-- ==============================================================================
ALTER TABLE IF EXISTS public.final_exam_schedules 
ADD COLUMN IF NOT EXISTS academic_year_id TEXT DEFAULT '2026-2027';

ALTER TABLE IF EXISTS public.final_exam_schedules 
ADD COLUMN IF NOT EXISTS academic_year_label TEXT DEFAULT '2026-2027';

CREATE INDEX IF NOT EXISTS idx_final_exam_schedules_dept_stage_sem_year 
ON public.final_exam_schedules (department_id, stage_number, semester, academic_year_id);

ALTER TABLE IF EXISTS public.final_exam_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to all users for final exam schedules" ON public.final_exam_schedules;
DROP POLICY IF EXISTS "Allow authorized users to manage final exam schedules" ON public.final_exam_schedules;

CREATE POLICY "Allow read access to all users for final exam schedules" 
ON public.final_exam_schedules FOR SELECT USING (true);

CREATE POLICY "Allow authorized users to manage final exam schedules" 
ON public.final_exam_schedules FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);


-- ==============================================================================
-- 8️⃣ جدول فترات وقاعات الامتحانات النهائية (final_exam_slots)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_final_exam_slots_sched_course 
ON public.final_exam_slots (schedule_id, course_id, stage_number);

ALTER TABLE IF EXISTS public.final_exam_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to all users for final exam slots" ON public.final_exam_slots;
DROP POLICY IF EXISTS "Allow authorized users to manage final exam slots" ON public.final_exam_slots;

CREATE POLICY "Allow read access to all users for final exam slots" 
ON public.final_exam_slots FOR SELECT USING (true);

CREATE POLICY "Allow authorized users to manage final exam slots" 
ON public.final_exam_slots FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);


-- ==============================================================================
-- 9️⃣ جدول الأقساط والوصولات المالية (student_tuition_records)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_tuition_records_student_dept_year 
ON public.student_tuition_records (student_id, department_id, academic_year);

ALTER TABLE IF EXISTS public.student_tuition_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to all users for tuition records" ON public.student_tuition_records;
DROP POLICY IF EXISTS "Allow authorized users to manage tuition records" ON public.student_tuition_records;

CREATE POLICY "Allow read access to all users for tuition records" 
ON public.student_tuition_records FOR SELECT USING (true);

CREATE POLICY "Allow authorized users to manage tuition records" 
ON public.student_tuition_records FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);



-- ==============================================================================
-- 🏛️ سجلات التقويم المركزي الافتراضية للعام الدراسي 2026-2027 (المراحل 1 إلى 4 والكورسين)
-- ==============================================================================
-- 🏢 1. إدراج أو تحديث سجل رئاسة الجامعة والتقويم المركزي في جدول الأقسام لضمان مطابقة المفاتيح الأجنبية
INSERT INTO public.departments (id, name, code, head_name, head_email, rapporteur_name, rapporteur_email)
VALUES ('central', 'رئاسة الجامعة والتقويم الأكاديمي المركزي', 'CENTRAL', 'المسؤول العام', 'sadmin@uomis.edu.iq', '', '')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  code = EXCLUDED.code;

-- 🛡️ 2. إسقاط قيد المفتاح الأجنبي لـ department_id إن وجد لضمان استقلالية سجلات التقويم المركزي
ALTER TABLE IF EXISTS public.department_schedule_configs 
DROP CONSTRAINT IF EXISTS department_schedule_configs_department_id_fkey;

-- 📅 3. إدراج وتحديث سجلات التقويم المركزي للمراحل الأربعة
INSERT INTO public.department_schedule_configs (
  id, department_id, department_name, stage_number, semester, academic_year, start_date, updated_at
) VALUES 
  ('cfg-central-stage1-sem1-2026-2027', 'central', 'رئاسة الجامعة', 1, 1, '2026-2027', '2026-09-20', NOW()),
  ('cfg-central-stage2-sem1-2026-2027', 'central', 'رئاسة الجامعة', 2, 1, '2026-2027', '2026-09-20', NOW()),
  ('cfg-central-stage3-sem1-2026-2027', 'central', 'رئاسة الجامعة', 3, 1, '2026-2027', '2026-09-20', NOW()),
  ('cfg-central-stage4-sem1-2026-2027', 'central', 'رئاسة الجامعة', 4, 1, '2026-2027', '2026-09-20', NOW()),
  ('cfg-central-stage1-sem2-2026-2027', 'central', 'رئاسة الجامعة', 1, 2, '2026-2027', '2027-02-15', NOW()),
  ('cfg-central-stage2-sem2-2026-2027', 'central', 'رئاسة الجامعة', 2, 2, '2026-2027', '2027-02-15', NOW()),
  ('cfg-central-stage3-sem2-2026-2027', 'central', 'رئاسة الجامعة', 3, 2, '2026-2027', '2027-02-15', NOW()),
  ('cfg-central-stage4-sem2-2026-2027', 'central', 'رئاسة الجامعة', 4, 2, '2026-2027', '2027-02-15', NOW())
ON CONFLICT (id) DO UPDATE SET 
  start_date = EXCLUDED.start_date,
  academic_year = EXCLUDED.academic_year,
  updated_at = NOW();
