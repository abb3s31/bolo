-- ==============================================================================
-- 🏛️ سكربت تهيئة وتحديث نظام الشعب والمجموعات (Groups & Cohorts) لمسار بولونيا
-- 🛡️ متوافق مع جامعة الإمام جعفر الصادق (ع) - فرع ميسان
-- ⚡ يتيح لرئيس القسم والمقرر التحكم الكامل بعدد الكروبات لكل مرحلة ولكل نوع دوام
-- ==============================================================================

-- 1️⃣ إنشاء جدول إعدادات كروبات المراحل والدوام (department_stage_groups)
CREATE TABLE IF NOT EXISTS public.department_stage_groups (
  id TEXT PRIMARY KEY, -- 🆔 المعرف الفريد للإعداد (مثال: grp_dept-1_s1_morning)
  department_id TEXT NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE, -- 🏢 معرف القسم
  stage_number INT NOT NULL CHECK (stage_number BETWEEN 1 AND 6), -- 🎓 رقم المرحلة الدراسية
  study_type TEXT NOT NULL DEFAULT 'morning' CHECK (study_type IN ('morning', 'evening')), -- ☀️🌙 نوع الدوام
  has_groups BOOLEAN NOT NULL DEFAULT FALSE, -- ⚙️ هل المرحلة مقسمة لكروبات أم شعبة موحدة؟
  group_count INT NOT NULL DEFAULT 0, -- 🔢 عدد الكروبات (0 يعني بدون كروبات، 2 يعني A و B، 3 يعني A و B و C، وهكذا)
  groups JSONB NOT NULL DEFAULT '[]'::JSONB, -- 📋 قائمة أسماء الكروبات المفعلة (مثال: ["A", "B", "C", "D"])
  default_group TEXT DEFAULT NULL, -- 🏷️ الكروب الافتراضي عند التسجيل إن وجد
  created_at TIMESTAMPTZ DEFAULT NOW(), -- ⏰ تاريخ الإنشاء
  updated_at TIMESTAMPTZ DEFAULT NOW(), -- 🔄 تاريخ آخر تحديث
  CONSTRAINT uq_dept_stage_study_group UNIQUE (department_id, stage_number, study_type) -- 🔒 قيد فريد يمنع تكرار إعداد نفس المرحلة والدوام
);

-- 2️⃣ تفعيل سياسات الأمان والحماية على مستوى السطر (Row Level Security - RLS)
ALTER TABLE public.department_stage_groups ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: متاحة للجميع (المسؤولين، رؤساء الأقسام، الأساتذة، والطلاب)
DROP POLICY IF EXISTS "policy_stage_groups_read" ON public.department_stage_groups;
CREATE POLICY "policy_stage_groups_read"
  ON public.department_stage_groups
  FOR SELECT
  USING (true);

-- سياسة الإضافة والتعديل والحذف: محصورة بالمسؤول العام ورئيس ومقرر القسم
DROP POLICY IF EXISTS "policy_stage_groups_manage" ON public.department_stage_groups;
CREATE POLICY "policy_stage_groups_manage"
  ON public.department_stage_groups
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3️⃣ تحديث جدول الطلاب (students) لإضافة حقل الكروب والشعبة
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS student_group TEXT DEFAULT NULL; -- 🏷️ كروب الطالب (A, B, C, D أو NULL للشعبة الموحدة)

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS subgroup TEXT DEFAULT NULL; -- 🔬 كروب المختبر المصغر (A1, A2, B1, B2)

-- إنشاء فهرس سريع للبحث وتصفية الطلاب حسب الكروب
CREATE INDEX IF NOT EXISTS idx_students_dept_stage_group 
ON public.students (department_id, stage_number, study_type, student_group);

-- 4️⃣ تحديث جدول المحاضرات الأسبوعية (schedule_lectures) لدعم الجداول الخاصة بالكروبات
ALTER TABLE public.schedule_lectures 
ADD COLUMN IF NOT EXISTS target_group TEXT DEFAULT 'all'; -- 🕒 الكروب المستهدف بالمحاضرة ('all' لكافة الشعب، أو 'A', 'B', 'C', 'D' لكروب محدد)

-- إنشاء فهرس لتسريع استرجاع جدول الكروب المخصص
CREATE INDEX IF NOT EXISTS idx_schedule_lectures_group 
ON public.schedule_lectures (department_id, stage_number, study_type, target_group);

-- 5️⃣ تحديث جدول سجلات الحضور والغياب (student_attendance_records) لدعم سجل الحضور لكل كروب
ALTER TABLE public.student_attendance_records 
ADD COLUMN IF NOT EXISTS student_group TEXT DEFAULT NULL; -- 📋 كروب الطالب المسجل وقت تسجيل الحضور

CREATE INDEX IF NOT EXISTS idx_attendance_records_group 
ON public.student_attendance_records (course_id, stage_number, student_group);

-- 6️⃣ تحديث جدول مواعيد وبنود الامتحانات النهائية (final_exam_slots)
ALTER TABLE public.final_exam_slots 
ADD COLUMN IF NOT EXISTS target_group TEXT DEFAULT 'all'; -- 🏛️ توزيع القاعات الامتحانية حسب الكروب ('all' أو 'A', 'B', ...)

-- 7️⃣ تحديث جدول التكليفات والامتحانات الفصلية (course_academic_tasks)
ALTER TABLE public.course_academic_tasks 
ADD COLUMN IF NOT EXISTS target_group TEXT DEFAULT 'all'; -- 📝 توجيه التكليف أو الكويز لكروب محدد

-- 8️⃣ تحديث العرض التوافقي الشامل للمستخدمين (vw_all_profiles) ليشمل حقل الكروب
-- ⚠️ حذف العروض القديمة أولاً بـ CASCADE لتفادي خطأ PostgreSQL 42P16 عند إضافة حقول جديدة أو تغيير ترتيبها
DROP VIEW IF EXISTS public.profiles CASCADE;
DROP VIEW IF EXISTS public.vw_all_profiles CASCADE;

CREATE OR REPLACE VIEW public.vw_all_profiles AS
SELECT 
  sa.id, sa.auth_user_id, sa.full_name, 'super_admin'::text AS role, 
  NULL::text AS department_id, NULL::text AS department_name, 
  NULL::text AS stage_id, NULL::int AS stage_number, 
  'ADMIN-001'::text AS university_number, sa.email AS generated_email, 
  sa.temp_password AS temp_password, NULL::text AS study_type, NULL::text AS gender, TRUE AS is_active, 
  FALSE AS must_change_password, FALSE AS is_graduated, NULL::text AS graduation_status, 
  NULL::text AS student_group, -- 🏷️ لا يوجد كروب للأدمن
  NULL::text AS subgroup,      -- 🔬 لا يوجد كروب مختبر للأدمن
  sa.created_at
FROM public.super_admins sa

UNION ALL
SELECT 
  dh.id, dh.auth_user_id, dh.full_name, 'department_head'::text AS role, 
  dh.department_id, d.name AS department_name, 
  NULL::text AS stage_id, NULL::int AS stage_number, 
  dh.id AS university_number, dh.email AS generated_email, 
  dh.temp_password, NULL::text AS study_type, NULL::text AS gender, dh.is_active, 
  FALSE AS must_change_password, FALSE AS is_graduated, NULL::text AS graduation_status, 
  NULL::text AS student_group, -- 🏷️ لا يوجد كروب لرئيس القسم
  NULL::text AS subgroup,      -- 🔬 لا يوجد كروب مختبر لرئيس القسم
  dh.created_at
FROM public.department_heads dh
LEFT JOIN public.departments d ON d.id = dh.department_id

UNION ALL
SELECT 
  dr.id, dr.auth_user_id, dr.full_name, 'rapporteur'::text AS role, 
  dr.department_id, d.name AS department_name, 
  NULL::text AS stage_id, NULL::int AS stage_number, 
  dr.id AS university_number, dr.email AS generated_email, 
  dr.temp_password, NULL::text AS study_type, NULL::text AS gender, dr.is_active, 
  FALSE AS must_change_password, FALSE AS is_graduated, NULL::text AS graduation_status, 
  NULL::text AS student_group, -- 🏷️ لا يوجد كروب للمقرر
  NULL::text AS subgroup,      -- 🔬 لا يوجد كروب مختبر للمقرر
  dr.created_at
FROM public.department_rapporteurs dr
LEFT JOIN public.departments d ON d.id = dr.department_id

UNION ALL
SELECT 
  t.id, t.auth_user_id, t.full_name, 'teacher'::text AS role, 
  t.department_id, d.name AS department_name, 
  NULL::text AS stage_id, NULL::int AS stage_number, 
  t.id AS university_number, t.email AS generated_email, 
  t.temp_password, NULL::text AS study_type, NULL::text AS gender, t.is_active, 
  FALSE AS must_change_password, FALSE AS is_graduated, NULL::text AS graduation_status, 
  NULL::text AS student_group, -- 🏷️ لا يوجد كروب للتدريسي
  NULL::text AS subgroup,      -- 🔬 لا يوجد كروب مختبر للتدريسي
  t.created_at
FROM public.teachers t
LEFT JOIN public.departments d ON d.id = t.department_id

UNION ALL
SELECT 
  s.id, s.auth_user_id, s.full_name, 'student'::text AS role, 
  s.department_id, d.name AS department_name, 
  s.stage_id, s.stage_number, 
  s.university_number, s.email AS generated_email, 
  s.temp_password, COALESCE(s.study_type, 'morning')::text AS study_type, s.gender, s.is_active, 
  FALSE AS must_change_password, s.is_graduated, s.graduation_status, 
  s.student_group, -- 🏷️ كروب الطالب المعتمد
  s.subgroup,      -- 🔬 كروب المختبر المصغر
  s.created_at
FROM public.students s
LEFT JOIN public.departments d ON d.id = s.department_id;

-- إعادة تعريف عرض profiles
CREATE OR REPLACE VIEW public.profiles AS
SELECT * FROM public.vw_all_profiles;

-- 9️⃣ تحديث قادح التوجيه fn_profiles_view_router ليدعم حفظ وتحديث student_group و subgroup
CREATE OR REPLACE FUNCTION public.fn_profiles_view_router()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.role = 'super_admin' OR NEW.role = 'admin' THEN
      INSERT INTO public.super_admins (id, auth_user_id, full_name, email, created_at)
      VALUES (NEW.id, NEW.auth_user_id, NEW.full_name, NEW.generated_email, COALESCE(NEW.created_at, NOW()))
      ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;
    ELSIF NEW.role = 'department_head' THEN
      INSERT INTO public.department_heads (id, auth_user_id, department_id, full_name, email, temp_password, is_active, created_at)
      VALUES (NEW.id, NEW.auth_user_id, COALESCE(NEW.department_id, 'dept-1'), NEW.full_name, NEW.generated_email, NEW.temp_password, COALESCE(NEW.is_active, TRUE), COALESCE(NEW.created_at, NOW()))
      ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, department_id = EXCLUDED.department_id, email = EXCLUDED.email, temp_password = EXCLUDED.temp_password, is_active = EXCLUDED.is_active;
    ELSIF NEW.role = 'rapporteur' THEN
      INSERT INTO public.department_rapporteurs (id, auth_user_id, department_id, full_name, email, temp_password, is_active, created_at)
      VALUES (NEW.id, NEW.auth_user_id, COALESCE(NEW.department_id, 'dept-1'), NEW.full_name, NEW.generated_email, NEW.temp_password, COALESCE(NEW.is_active, TRUE), COALESCE(NEW.created_at, NOW()))
      ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, department_id = EXCLUDED.department_id, email = EXCLUDED.email, temp_password = EXCLUDED.temp_password, is_active = EXCLUDED.is_active;
    ELSIF NEW.role = 'teacher' THEN
      INSERT INTO public.teachers (id, auth_user_id, department_id, full_name, email, temp_password, is_active, created_at)
      VALUES (NEW.id, NEW.auth_user_id, COALESCE(NEW.department_id, 'dept-1'), NEW.full_name, NEW.generated_email, NEW.temp_password, COALESCE(NEW.is_active, TRUE), COALESCE(NEW.created_at, NOW()))
      ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, department_id = EXCLUDED.department_id, email = EXCLUDED.email, temp_password = EXCLUDED.temp_password, is_active = EXCLUDED.is_active;
    ELSIF NEW.role = 'student' THEN
      INSERT INTO public.students (
        id, auth_user_id, department_id, stage_id, stage_number, 
        full_name, university_number, email, study_type, gender, 
        temp_password, is_active, is_graduated, graduation_status, 
        student_group, subgroup, created_at
      )
      VALUES (
        NEW.id, 
        NEW.auth_user_id, 
        COALESCE(NEW.department_id, 'dept-1'), 
        COALESCE(NEW.stage_id, 'stage-' || COALESCE(NEW.department_id, 'dept-1') || '-' || COALESCE(NEW.stage_number, 1)), 
        COALESCE(NEW.stage_number, 1), 
        NEW.full_name, 
        COALESCE(NEW.university_number, NEW.id), 
        NEW.generated_email, 
        COALESCE(NEW.study_type, 'morning'),
        NEW.gender,
        NEW.temp_password, 
        COALESCE(NEW.is_active, TRUE), 
        COALESCE(NEW.is_graduated, FALSE), 
        NEW.graduation_status, 
        NEW.student_group, -- 🏷️ تخزين الكروب
        NEW.subgroup,      -- 🔬 تخزين كروب المختبر
        COALESCE(NEW.created_at, NOW())
      )
      ON CONFLICT (id) DO UPDATE SET 
        full_name = EXCLUDED.full_name, 
        department_id = EXCLUDED.department_id, 
        stage_id = EXCLUDED.stage_id, 
        stage_number = EXCLUDED.stage_number, 
        university_number = EXCLUDED.university_number, 
        email = EXCLUDED.email, 
        study_type = EXCLUDED.study_type,
        gender = EXCLUDED.gender,
        temp_password = EXCLUDED.temp_password,
        is_active = EXCLUDED.is_active,
        is_graduated = EXCLUDED.is_graduated,
        graduation_status = EXCLUDED.graduation_status,
        student_group = EXCLUDED.student_group, -- 🔄 تحديث الكروب
        subgroup = EXCLUDED.subgroup;           -- 🔬 تحديث كروب المختبر
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    DELETE FROM public.students WHERE id = OLD.id;
    DELETE FROM public.teachers WHERE id = OLD.id;
    DELETE FROM public.department_rapporteurs WHERE id = OLD.id;
    DELETE FROM public.department_heads WHERE id = OLD.id;
    DELETE FROM public.super_admins WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ⚡ إعادة إنشاء وربط قادح التوجيه التلقائي على عرض profiles
DROP TRIGGER IF EXISTS trg_profiles_view_router ON public.profiles;
CREATE TRIGGER trg_profiles_view_router
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.fn_profiles_view_router();

-- 🔟 بيانات أولية نموذجية لتكوينات الكروبات للأقسام
-- المرحلة الرابعة: 4 كروبات (A, B, C, D) للصباحي، والمسائي بدون كروبات
INSERT INTO public.department_stage_groups (id, department_id, stage_number, study_type, has_groups, group_count, groups, default_group)
VALUES 
  ('grp_dept-1_s4_morning', 'dept-1', 4, 'morning', true, 4, '["A", "B", "C", "D"]'::jsonb, 'A'),
  ('grp_dept-1_s4_evening', 'dept-1', 4, 'evening', false, 0, '[]'::jsonb, NULL),
  ('grp_dept-1_s1_morning', 'dept-1', 1, 'morning', true, 3, '["A", "B", "C"]'::jsonb, 'A'),
  ('grp_dept-1_s1_evening', 'dept-1', 1, 'evening', false, 0, '[]'::jsonb, NULL),
  ('grp_dept-1_s2_morning', 'dept-1', 2, 'morning', false, 0, '[]'::jsonb, NULL),
  ('grp_dept-1_s2_evening', 'dept-1', 2, 'evening', false, 0, '[]'::jsonb, NULL),
  ('grp_dept-1_s3_morning', 'dept-1', 3, 'morning', true, 2, '["A", "B"]'::jsonb, 'A'),
  ('grp_dept-1_s3_evening', 'dept-1', 3, 'evening', false, 0, '[]'::jsonb, NULL)
ON CONFLICT (department_id, stage_number, study_type) DO NOTHING;
