import { StageGroupConfig, UserProfile, ScheduleLecture, StudentAttendanceRecord } from '@/types'; // 🏷️ استيراد الأنواع الصارمة
import { getStoredData, saveStoredData } from '@/lib/mock-data'; // 💾 دوال التخزين المحلي
import { supabase } from '@/lib/supabase-client'; // ☁️ عميل سوبابيز المعتمد

// 📦 مفتاح التخزين المحلي لإعدادات كروبات المراحل
const STORAGE_KEY_STAGE_GROUPS = 'department_stage_groups';

// 📋 التكوينات الافتراضية الأولية لكروبات المراحل بالقسم العلمي
export const INITIAL_STAGE_GROUP_CONFIGS: StageGroupConfig[] = [
  {
    id: 'grp_dept-1_s4_morning', // 🆔 معرف الإعداد
    department_id: 'dept-1', // 🏢 القسم الافتراضي (هندسة الحاسوب)
    stage_number: 4, // 🎓 المرحلة الرابعة
    study_type: 'morning', // ☀️ صباحي
    has_groups: true, // ⚙️ مفعلة الكروبات
    group_count: 4, // 🔢 4 كروبات
    groups: ['A', 'B', 'C', 'D'], // 📋 الكروبات الأربعة
    default_group: 'A', // 🏷️ الكروب الافتراضي
  },
  {
    id: 'grp_dept-1_s4_evening', // 🆔 المرحلة الرابعة مسائي
    department_id: 'dept-1',
    stage_number: 4,
    study_type: 'evening',
    has_groups: false, // 🛑 لا توجد كروبات (شعبة موحدة)
    group_count: 0,
    groups: [],
  },
  {
    id: 'grp_dept-1_s1_morning', // 🆔 المرحلة الأولى صباحي
    department_id: 'dept-1',
    stage_number: 1,
    study_type: 'morning',
    has_groups: true,
    group_count: 3,
    groups: ['A', 'B', 'C'], // 📋 3 كروبات
    default_group: 'A',
  },
  {
    id: 'grp_dept-1_s1_evening', // 🆔 المرحلة الأولى مسائي
    department_id: 'dept-1',
    stage_number: 1,
    study_type: 'evening',
    has_groups: false,
    group_count: 0,
    groups: [],
  },
  {
    id: 'grp_dept-1_s2_morning', // 🆔 المرحلة الثانية صباحي
    department_id: 'dept-1',
    stage_number: 2,
    study_type: 'morning',
    has_groups: false, // 🛑 بدون كروبات (شعبة موحدة)
    group_count: 0,
    groups: [],
  },
  {
    id: 'grp_dept-1_s2_evening', // 🆔 المرحلة الثانية مسائي
    department_id: 'dept-1',
    stage_number: 2,
    study_type: 'evening',
    has_groups: false,
    group_count: 0,
    groups: [],
  },
  {
    id: 'grp_dept-1_s3_morning', // 🆔 المرحلة الثالثة صباحي
    department_id: 'dept-1',
    stage_number: 3,
    study_type: 'morning',
    has_groups: true,
    group_count: 2,
    groups: ['A', 'B'], // 📋 كروبين
    default_group: 'A',
  },
  {
    id: 'grp_dept-1_s3_evening', // 🆔 المرحلة الثالثة مسائي
    department_id: 'dept-1',
    stage_number: 3,
    study_type: 'evening',
    has_groups: false,
    group_count: 0,
    groups: [],
  },
];

// 🔠 توليد مصفوفة أسماء الكروبات القياسية حسب العدد المطلوب (0 -> [], 2 -> A, B, 3 -> A, B, C...)
export function generatePresetGroups(count: number): string[] {
  if (count <= 0) return []; // 🛑 إذا صفر يعني بدون كروبات
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']; // 🔤 الحروف اللاتينية القياسية
  return letters.slice(0, Math.min(count, letters.length)); // ✂️ اقتطاع الحروف حسب العدد
}

// ☁️ جلب ومزامنة إعدادات كروبات المراحل لقسم محدد من Supabase مع الرجوع للتخزين المحلي
export async function fetchStageGroupConfigs(departmentId: string): Promise<StageGroupConfig[]> {
  try {
    // 🔍 الاستعلام المباشر من جدول department_stage_groups في سوبابيز
    const { data, error } = await supabase
      .from('department_stage_groups')
      .select('*')
      .eq('department_id', departmentId);

    // ⚡ إذا رجعت بيانات سليمة من السحابة نحفظها محلياً ونرجعها
    if (!error && data && data.length > 0) {
      const sanitized: StageGroupConfig[] = data.map((row) => ({
        id: String(row.id),
        department_id: String(row.department_id),
        stage_number: Number(row.stage_number),
        study_type: row.study_type === 'evening' ? 'evening' : 'morning',
        has_groups: Boolean(row.has_groups),
        group_count: Number(row.group_count || 0),
        groups: Array.isArray(row.groups) ? row.groups.map(String) : [],
        default_group: row.default_group ? String(row.default_group) : undefined,
        updated_at: row.updated_at ? String(row.updated_at) : undefined,
      }));
      // 💾 حفظ النسخة المتزامنة في الكاش المحلي
      saveStoredData(STORAGE_KEY_STAGE_GROUPS, sanitized);
      return sanitized;
    }
  } catch (err) {
    // ⚠️ في حال انقطاع الشبكة أو أي خطأ نعتمد على الكاش المحلي بهدوء
    console.warn('تعذر جلب إعدادات الكروبات من السحابة، جاري الاعتماد على التخزين المحلي:', err);
  }

  // 🛡️ استرجاع البيانات المخزنة محلياً كخطة بديلة موثوقة
  const localConfigs = getStoredData<StageGroupConfig[]>(STORAGE_KEY_STAGE_GROUPS, INITIAL_STAGE_GROUP_CONFIGS);
  // 🏢 فلترة إعدادات القسم المحدد
  const deptConfigs = localConfigs.filter((cfg) => cfg.department_id === departmentId);
  return deptConfigs.length > 0 ? deptConfigs : localConfigs;
}

// 💾 حفظ وتحديث إعداد كروبات مرحلة معينة في Supabase والتخزين المحلي
export async function saveStageGroupConfig(config: StageGroupConfig): Promise<boolean> {
  try {
    // 📦 تحديث الكاش المحلي فورياً لضمان الاستجابة السريعة
    const currentConfigs = getStoredData<StageGroupConfig[]>(STORAGE_KEY_STAGE_GROUPS, INITIAL_STAGE_GROUP_CONFIGS);
    const existingIndex = currentConfigs.findIndex((c) => c.id === config.id || (c.department_id === config.department_id && c.stage_number === config.stage_number && c.study_type === config.study_type));

    let updatedList: StageGroupConfig[];
    if (existingIndex >= 0) {
      updatedList = [...currentConfigs];
      updatedList[existingIndex] = { ...config, updated_at: new Date().toISOString() };
    } else {
      updatedList = [...currentConfigs, { ...config, updated_at: new Date().toISOString() }];
    }
    saveStoredData(STORAGE_KEY_STAGE_GROUPS, updatedList);

    // ☁️ الرفع إلى قاعدة بيانات Supabase
    const payload = {
      id: config.id,
      department_id: config.department_id,
      stage_number: config.stage_number,
      study_type: config.study_type,
      has_groups: config.has_groups,
      group_count: config.group_count,
      groups: config.groups,
      default_group: config.default_group || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('department_stage_groups').upsert(payload);
    if (error) {
      console.warn('تحذير أثناء رفع إعدادات الكروبات إلى Supabase:', error);
    }
    return true;
  } catch (err) {
    console.error('خطأ أثناء حفظ إعدادات الكروب:', err);
    return false;
  }
}

// 🎯 استخراج أسماء الكروبات لمرحلة ونوع دوام محددين
export function getGroupsForStage(
  configs: StageGroupConfig[],
  stageNumber: number,
  studyType: 'morning' | 'evening'
): string[] {
  // 🔍 البحث عن الإعداد المطابق للمرحلة والدوام
  const found = configs.find((c) => c.stage_number === stageNumber && c.study_type === studyType);
  if (!found) {
    // 🛡️ كإعداد افتراضي إذا لم يوجد تخصيص
    return [];
  }
  return found.has_groups ? found.groups : [];
}

// ❓ فحص هل المرحلة ونوع الدوام مقسمة إلى كروبات أم لا؟
export function hasGroupsForStage(
  configs: StageGroupConfig[],
  stageNumber: number,
  studyType: 'morning' | 'evening'
): boolean {
  const found = configs.find((c) => c.stage_number === stageNumber && c.study_type === studyType);
  return Boolean(found?.has_groups && found.groups.length > 0);
}

// ⚖️ توزيع ذكي ومتوازن للطلاب غير الموزعين بين الكروبات المتاحة بالتساوي
export function autoBalanceStudentsIntoGroups(
  students: UserProfile[],
  groups: string[]
): Record<string, string> {
  // 🛑 إذا لم تكن هناك كروبات متاحة نرجع كائن فارغ
  if (groups.length === 0) return {};

  const assignments: Record<string, string> = {}; // 📦 خريطة التوزيع (معرف الطالب -> الكروب)
  // 🔤 فرز الطلاب أبجدياً لضمان عدالة التوزيع
  const sorted = [...students].sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar'));

  sorted.forEach((std, index) => {
    // 🔄 توزيع تدويري بالتساوي بين الكروبات المتاحة
    const assignedGroup = groups[index % groups.length];
    assignments[std.id] = assignedGroup;
  });

  return assignments;
}

// 🕒 تصفية محاضرات الجدول الأسبوعي بحسب الكروب المحدد بعزل تام وصارم
export function filterLecturesByGroup(
  lectures: ScheduleLecture[], // 📋 قائمة كافة المحاضرات الممررة
  targetGroup: string // 🎯 الكروب المستهدف بالتصفية
): ScheduleLecture[] {
  // 🌟 إذا كان المختار 'all' أو فارغ نرجع كافة المحاضرات بدون تصفية
  if (!targetGroup || targetGroup === 'all') return lectures;
  // 🎯 عزل صارم 100%: إرجاع محاضرات هذا الكروب المحدد حصراً لضمان استقلالية جدوله
  return lectures.filter((l) => l.target_group === targetGroup);
}

// 📋 تصفية سجلات الحضور بحسب الكروب المحدد
export function filterAttendanceByGroup(
  records: StudentAttendanceRecord[],
  targetGroup: string
): StudentAttendanceRecord[] {
  if (!targetGroup || targetGroup === 'all') return records;
  return records.filter((r) => r.student_group === targetGroup);
}
