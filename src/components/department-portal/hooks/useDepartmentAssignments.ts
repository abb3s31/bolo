// 🔗 خطاف مخصص لإدارة تكليفات الأساتذة بالمواد (إضافة، تعديل، إلغاء، حذف جماعي، تصدير إكسل، وقوائم التعيين المنسدلة)
// 🛡️ التزام نمطي صارم بدون any أو unknown مع توثيق عراقي تفصيلي لكل سطر

import { useState, useMemo, useRef, useEffect } from 'react'; // ⚛️ استيراد خطافات رياكت
import type { TeacherCourse, Course, UserProfile } from '@/types'; // 📚 استيراد واجهات التكليفات والمواد والأساتذة
import type { DepartmentDeleteModalConfig } from '../types'; // 🏷️ استيراد واجهات البوابة المشتركة
import { getPreciseDropdownPosition, type SmartDropdownPosition } from '../dropdownUtils'; // 📐 دالة الموضع الهندسي للقائمة
import { saveStoredData } from '@/lib/mock-data'; // 💾 حفظ البيانات محلياً
import { saveTeacherCourseToSupabase, deleteTeacherCourseFromSupabase, saveCourseToSupabase } from '@/lib/supabase-client'; // ☁️ المزامنة السحابية
import { exportCustomTeacherCoursesList } from '@/lib/excel-utils'; // 📊 تصدير إكسل التكليفات
import { sendAppNotification } from '@/lib/notification-utils'; // 🔔 مركز الإشعارات

// 📋 واجهة مدخلات خطاف تكليفات القسم
export interface UseDepartmentAssignmentsProps {
  currentDeptId: string; // 🏛️ معرف القسم الأكاديمي الحالي
  deptName: string; // 🏷️ اسم القسم الأكاديمي
  teacherCourses: TeacherCourse[]; // 🔗 مصفوفة التكليفات الأكاديمية
  setTeacherCourses: React.Dispatch<React.SetStateAction<TeacherCourse[]>>; // 🔄 دالة تحديث التكليفات
  courses: Course[]; // 📖 مصفوفة المواد الدراسية
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>; // 🔄 دالة تحديث المواد
  deptTeachers: UserProfile[]; // 👨‍🏫 أساتذة القسم المصفين
  deptCourses: Course[]; // 📖 مواد القسم المصفاة
  setSuccessMessage: (msg: string) => void; // ✨ دالة إشعار النجاح
  setErrorMessage: (msg: string) => void; // ⚠️ دالة إشعار الخطأ
  setDeleteModalConfig: React.Dispatch<React.SetStateAction<DepartmentDeleteModalConfig>>; // 🗑️ دالة إعداد نافذة الحذف
}

// 🎯 دالة الخطاف الرئيسية لإدارة تكليفات القسم الأكاديمية
export const useDepartmentAssignments = ({
  currentDeptId, // 🏛️ معرف القسم
  deptName, // 🏷️ اسم القسم
  teacherCourses, // 🔗 التكليفات
  setTeacherCourses, // 🔄 تحديث التكليفات
  courses, // 📖 المواد
  setCourses, // 🔄 تحديث المواد
  deptTeachers, // 👨‍🏫 أساتذة القسم
  deptCourses, // 📖 مواد القسم
  setSuccessMessage, // ✨ رسالة النجاح
  setErrorMessage, // ⚠️ رسالة الخطأ
  setDeleteModalConfig, // 🗑️ نافذة الحذف
}: UseDepartmentAssignmentsProps) => {
  // 📌 حقول نموذج التكليفات
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(''); // 👤 الأستاذ المختار
  const [selectedCourseId, setSelectedCourseId] = useState<string>(''); // 📖 المادة المختارة
  const [selectedAssignRole, setSelectedAssignRole] = useState<'theory' | 'practical' | 'both'>('theory'); // 🏷️ صفة التكليف
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState<boolean>(false); // 📦 نافذة التكليف
  const [editingAssignment, setEditingAssignment] = useState<TeacherCourse | null>(null); // ✏️ التكليف الجاري تعديله

  // 🔍 البحث والفلاتر
  const [assignmentSearch, setAssignmentSearch] = useState<string>(''); // 🔍 نص البحث
  const [filterAssignmentTeacher, setFilterAssignmentTeacher] = useState<string | 'all'>('all'); // 👨‍🏫 فلتر الأستاذ
  const [filterAssignmentStage, setFilterAssignmentStage] = useState<number | 'all'>('all'); // 🎓 فلتر المرحلة
  const [filterAssignmentSemester, setFilterAssignmentSemester] = useState<number | 'all'>('all'); // 🗓️ فلتر الفصل
  const [filterAssignmentRole, setFilterAssignmentRole] = useState<'all' | 'theory' | 'practical' | 'both'>('all'); // 🏷️ فلتر الدور
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([]); // 🔘 التكليفات المحددة

  // 📄 ترقيم الصفحات
  const [assignmentPage, setAssignmentPage] = useState<number>(1); // 📄 الصفحة الحالية
  const [assignmentPageSize, setAssignmentPageSize] = useState<number>(10); // 📏 عدد العناصر بالصفحة
  const [isExportingAssignmentsExcel, setIsExportingAssignmentsExcel] = useState<boolean>(false); // ⏳ مؤشر تصدير الإكسل

  // 👨‍🏫 حالات مودال CRUD الخاص بالأستاذ الفردي
  const [crudTeacher, setCrudTeacher] = useState<UserProfile | null>(null); // 👤 الأستاذ المستهدف
  const [isTeacherCrudModalOpen, setIsTeacherCrudModalOpen] = useState<boolean>(false); // 📦 نافذة تكليف الأستاذ الفردي
  const [teacherCrudCourseId, setTeacherCrudCourseId] = useState<string>(''); // 📚 المادة المراد إسنادها
  const [teacherCrudSearchQuery, setTeacherCrudSearchQuery] = useState<string>(''); // 🔍 نص البحث في قائمة المواد

  // 🖨️ حالات طباعة جدول التكليفات الرسمي
  const [showAssignmentsPrintModal, setShowAssignmentsPrintModal] = useState<boolean>(false); // 🖨️ فتح نافذة الطباعة
  const [assignmentsPrintScope, setAssignmentsPrintScope] = useState<'filtered' | 'all'>('filtered'); // 🎯 نطاق الطباعة

  // 🔽 حالات القوائم المنسدلة التفاعلية الفاخرة
  const [isAssignTeacherDropdownOpen, setIsAssignTeacherDropdownOpen] = useState<boolean>(false); // 🔓 قائمة اختيار الأستاذ
  const [assignTeacherCoords, setAssignTeacherCoords] = useState<SmartDropdownPosition | null>(null); // 📐 إحداثيات قائمة الأستاذ
  const [assignTeacherSearchQuery, setAssignTeacherSearchQuery] = useState<string>(''); // 🔍 بحث قائمة الأستاذ
  const assignTeacherButtonRef = useRef<HTMLButtonElement | null>(null); // 🔘 زر قائمة الأستاذ

  const [isAssignCourseDropdownOpen, setIsAssignCourseDropdownOpen] = useState<boolean>(false); // 🔓 قائمة اختيار المادة
  const [assignCourseCoords, setAssignCourseCoords] = useState<SmartDropdownPosition | null>(null); // 📐 إحداثيات قائمة المادة
  const [assignCourseSearchQuery, setAssignCourseSearchQuery] = useState<string>(''); // 🔍 بحث قائمة المادة
  const assignCourseButtonRef = useRef<HTMLButtonElement | null>(null); // 🔘 زر قائمة المادة

  const [isFilterTeacherDropdownOpen, setIsFilterTeacherDropdownOpen] = useState<boolean>(false); // 🔓 قائمة فلتر الأستاذ
  const [filterTeacherCoords, setFilterTeacherCoords] = useState<SmartDropdownPosition | null>(null); // 📐 إحداثيات فلتر الأستاذ
  const [filterTeacherSearchQuery, setFilterTeacherSearchQuery] = useState<string>(''); // 🔍 بحث فلتر الأستاذ
  const filterTeacherButtonRef = useRef<HTMLButtonElement | null>(null); // 🔘 زر فلتر الأستاذ

  // 🔍 تصفية تكليفات القسم بحسب القسم الحالي
  const deptTeacherCourses = useMemo(() => {
    return teacherCourses.filter((tc) => {
      const course = courses.find((c) => c.id === tc.course_id);
      return course?.department_id === currentDeptId || tc.department_id === currentDeptId;
    });
  }, [teacherCourses, courses, currentDeptId]);

  // 🔍 تصفية تكليفات القسم بحسب البحث والأستاذ والمرحلة والكورس والصفة
  const filteredTeacherCourses = useMemo(() => {
    const term = assignmentSearch.toLowerCase();
    return deptTeacherCourses.filter((tc) => {
      const matchesSearch =
        (tc.teacher_name && tc.teacher_name.toLowerCase().includes(term)) ||
        (tc.course_name && tc.course_name.toLowerCase().includes(term));
      const matchesTeacher = filterAssignmentTeacher === 'all' || tc.teacher_id === filterAssignmentTeacher;
      const course = courses.find((c) => c.id === tc.course_id);
      const matchesStage = filterAssignmentStage === 'all' || (course?.stage_number || 1) === filterAssignmentStage;
      const matchesSemester = filterAssignmentSemester === 'all' || (tc.semester || course?.semester || 1) === filterAssignmentSemester;
      const matchesRole = filterAssignmentRole === 'all' || (tc.role_in_course || 'theory') === filterAssignmentRole;
      return matchesSearch && matchesTeacher && matchesStage && matchesSemester && matchesRole;
    });
  }, [deptTeacherCourses, assignmentSearch, filterAssignmentTeacher, courses, filterAssignmentStage, filterAssignmentSemester, filterAssignmentRole]);

  // 🔽 فتح وإغلاق قائمة اختيار الأستاذ
  const handleToggleAssignTeacherDropdown = () => {
    if (!isAssignTeacherDropdownOpen && assignTeacherButtonRef.current) {
      setAssignTeacherCoords(getPreciseDropdownPosition(assignTeacherButtonRef.current, 280));
      setIsAssignTeacherDropdownOpen(true);
      setIsAssignCourseDropdownOpen(false);
      setIsFilterTeacherDropdownOpen(false);
    } else {
      setIsAssignTeacherDropdownOpen(false);
    }
  };

  // 🔽 فتح وإغلاق قائمة اختيار المادة
  const handleToggleAssignCourseDropdown = () => {
    if (!isAssignCourseDropdownOpen && assignCourseButtonRef.current) {
      setAssignCourseCoords(getPreciseDropdownPosition(assignCourseButtonRef.current, 280));
      setIsAssignCourseDropdownOpen(true);
      setIsAssignTeacherDropdownOpen(false);
      setIsFilterTeacherDropdownOpen(false);
    } else {
      setIsAssignCourseDropdownOpen(false);
    }
  };

  // 🔽 فتح وإغلاق قائمة فلتر الأستاذ في الجدول
  const handleToggleFilterTeacherDropdown = () => {
    if (!isFilterTeacherDropdownOpen && filterTeacherButtonRef.current) {
      setFilterTeacherCoords(getPreciseDropdownPosition(filterTeacherButtonRef.current, 320));
      setIsFilterTeacherDropdownOpen(true);
      setIsAssignTeacherDropdownOpen(false);
      setIsAssignCourseDropdownOpen(false);
    } else {
      setIsFilterTeacherDropdownOpen(false);
    }
  };

  // 🧹 إغلاق القوائم التفاعلية عند تغيير حجم نافذة العرض
  useEffect(() => {
    const handleClose = () => {
      if (isAssignTeacherDropdownOpen) setIsAssignTeacherDropdownOpen(false);
      if (isAssignCourseDropdownOpen) setIsAssignCourseDropdownOpen(false);
      if (isFilterTeacherDropdownOpen) setIsFilterTeacherDropdownOpen(false);
    };
    if (isAssignTeacherDropdownOpen || isAssignCourseDropdownOpen || isFilterTeacherDropdownOpen) {
      window.addEventListener('resize', handleClose);
      return () => window.removeEventListener('resize', handleClose);
    }
  }, [isAssignTeacherDropdownOpen, isAssignCourseDropdownOpen, isFilterTeacherDropdownOpen]);

  // 💾 تكليف أستاذ بمادة دراسية
  const handleAssignTeacher = (e: React.FormEvent) => {
    e.preventDefault(); // 🛑 منع إعادة تحميل الصفحة
    if (!selectedTeacherId || !selectedCourseId) { // 🔍 التأكد من اختيار الأستاذ والمادة
      setErrorMessage('يرجى اختيار الأستاذ والمادة الدراسية أولاً.'); // ⚠️ رسالة تحذير
      setTimeout(() => setErrorMessage(''), 3000); // ⏰ إخفاء الرسالة بعد 3 ثواني
      return; // 🛑 توقف
    }

    const teacher: UserProfile | undefined = deptTeachers.find((t: UserProfile): boolean => t.id === selectedTeacherId); // 👤 جلب بيانات الأستاذ
    const course: Course | undefined = deptCourses.find((c: Course): boolean => c.id === selectedCourseId); // 📖 جلب بيانات المادة
    if (!teacher || !course) return; // 🛑 توقف إذا البيانات ناقصة

    // 🔍 فحص إذا الأستاذ عنده تكليف سابق مسجل بهالمادة
    const existingAssignment: TeacherCourse | undefined = teacherCourses.find(
      (tc: TeacherCourse): boolean => tc.teacher_id === selectedTeacherId && tc.course_id === selectedCourseId
    );

    if (existingAssignment) { // ⚠️ إذا الأستاذ مكلف مسبقاً بهالمادة
      if (existingAssignment.role_in_course === selectedAssignRole) { // 🔄 إذا نفس الدور بالضبط
        setErrorMessage('هذا الأستاذ مكلف بالفعل بهذه المادة بنفس الصفة!'); // ⚠️ تنبيه المقرر
        setTimeout(() => setErrorMessage(''), 3000); // ⏰ إخفاء التنبيه
        return; // 🛑 توقف
      }

      // 🌟 الترقية الذكية: دمج التكليف القديم والجديد ليصبح الأستاذ مكلفاً بالنظري والعملي معاً
      const updatedTC: TeacherCourse = { // 📦 بناء السجل المدمج الموحد
        ...existingAssignment, // 📋 بيانات السجل الحالي
        role_in_course: 'both', // 🌟 تحويله إلى نظري وعملي معاً
        teacher_name: teacher.full_name, // 👤 اسم الأستاذ
        course_name: course.name, // 📖 اسم المادة
        semester: course.semester || 1, // 🗓️ الفصل الدراسي
      };

      const updatedList: TeacherCourse[] = teacherCourses.map( // 🔄 تحديث لستة التكليفات
        (tc: TeacherCourse): TeacherCourse => (tc.id === existingAssignment.id ? updatedTC : tc)
      );
      setTeacherCourses(updatedList); // 💾 تحديث الحالة في واجهة React
      saveStoredData('teacher_courses', updatedList); // 💾 الحفظ بالتخزين المحلي
      saveTeacherCourseToSupabase(updatedTC); // ☁️ المزامنة مع سوبابيس

      let assignedCourseObj: Course | null = null; // 📦 كائن المادة المحدثة
      const updatedCourses: Course[] = courses.map((c: Course): Course => { // 🔄 تحديث قائمة المواد
        if (c.id === course.id) { // 🎯 مطابقة المادة المستهدفة
          const uCourse: Course = { // 📝 تحديث أستاذ النظري والعملي معاً لنفس الأستاذ
            ...c,
            theory_teacher_id: teacher.id,
            theory_teacher_name: teacher.full_name,
            practical_teacher_id: teacher.id,
            practical_teacher_name: teacher.full_name,
          };
          assignedCourseObj = uCourse; // 💾 حفظ الكائن
          return uCourse; // 📦 إرجاع المادة المحدثة
        }
        return c; // 📋 إبقاء المواد الأخرى
      });
      setCourses(updatedCourses); // 💾 تحديث حالة المواد
      saveStoredData('courses', updatedCourses); // 💾 حفظ المواد محلياً
      if (assignedCourseObj) { // ☁️ حفظ المادة بسوبابيس
        saveCourseToSupabase(assignedCourseObj);
      }

      if (typeof window !== 'undefined') { // ⚡ إرسال أحداث التحديث للنظام
        window.dispatchEvent(new Event('teacher_courses_updated'));
        window.dispatchEvent(new Event('courses_updated'));
        window.dispatchEvent(new Event('profiles_updated'));
        window.dispatchEvent(new Event('storage'));
      }

      sendAppNotification({ // 🔔 إرسال إشعار فوري للأستاذ
        recipient_id: teacher.id,
        recipient_role: 'teacher',
        title: 'ترقية التكليف الأكاديمي لمادة دراسية',
        message: `قام رئيس قسم (${deptName}) بترقية تكليفك بمادة (${course.name}) لتشمل النظري والعملي معاً.`,
        type: 'course_assigned',
        link: '/teacher/dashboard',
      });

      setSelectedTeacherId(''); // 🧹 تفريغ أستاذ الاختيار
      setSelectedCourseId(''); // 🧹 تفريغ المادة المختارة
      setIsAssignmentModalOpen(false); // 🚪 إغلاق نافذة التكليف
      setSuccessMessage(`تم بنجاح توحيد وترقية تكليف الأستاذ (${teacher.full_name}) ليصبح مكلفاً بالنظري والعملي لمادة (${course.name})!`); // 🎉 رسالة نجاح مبهجة
      setTimeout(() => setSuccessMessage(''), 4000); // ⏰ إخفاء رسالة النجاح
      return; // 🛑 انتهاء العملية بنجاح تام
    }

    const newTC: TeacherCourse = { // 📝 إنشاء سجل تكليف جديد نظيف
      id: `tc-${Date.now()}`, // 🆔 معرف فريد بالتوقيت
      teacher_id: teacher.id, // 🔑 معرف الأستاذ
      teacher_name: teacher.full_name, // 👤 اسم الأستاذ
      course_id: course.id, // 📖 معرف المادة
      course_name: course.name, // 📖 اسم المادة
      department_id: currentDeptId, // 🏢 معرف القسم
      role_in_course: selectedAssignRole, // 🏷️ صفة التكليف المختارة
      semester: course.semester || 1, // 🗓️ الفصل الدراسي
      created_at: new Date().toISOString(), // ⏰ تاريخ التكليف
    };

    const updated: TeacherCourse[] = [...teacherCourses, newTC]; // ➕ إضافة التكليف للقائمة
    setTeacherCourses(updated); // 💾 تحديث الحالة
    saveStoredData('teacher_courses', updated); // 💾 الحفظ المحلي
    saveTeacherCourseToSupabase(newTC); // ☁️ الحفظ السحابي

    let assignedCourseObj: Course | null = null; // 📦 كائن المادة المحدث
    const updatedCourses: Course[] = courses.map((c: Course): Course => { // 🔄 تحديث المواد
      if (c.id === course.id) { // 🎯 مطابقة المادة
        const uCourse: Course = { // 📝 تحديث حقول المادة حسب الدور
          ...c,
          ...(selectedAssignRole === 'practical'
            ? { practical_teacher_id: teacher.id, practical_teacher_name: teacher.full_name }
            : selectedAssignRole === 'both'
            ? { theory_teacher_id: teacher.id, theory_teacher_name: teacher.full_name, practical_teacher_id: teacher.id, practical_teacher_name: teacher.full_name }
            : { theory_teacher_id: teacher.id, theory_teacher_name: teacher.full_name }),
        };
        assignedCourseObj = uCourse; // 💾 حفظ الكائن
        return uCourse; // 📦 إرجاع المادة
      }
      return c; // 📋 إبقاء البقية
    });
    setCourses(updatedCourses); // 💾 تحديث حالة المواد
    saveStoredData('courses', updatedCourses); // 💾 الحفظ المحلي
    if (assignedCourseObj) { // ☁️ الحفظ السحابي
      saveCourseToSupabase(assignedCourseObj);
    }

    if (typeof window !== 'undefined') { // ⚡ إشعار المتصفح بالأحداث
      window.dispatchEvent(new Event('teacher_courses_updated'));
      window.dispatchEvent(new Event('courses_updated'));
      window.dispatchEvent(new Event('profiles_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    sendAppNotification({ // 🔔 إشعار الأستاذ المكلف
      recipient_id: teacher.id,
      recipient_role: 'teacher',
      title: 'تكليف أكاديمي جديد بمادة دراسية',
      message: `قام رئيس قسم (${deptName}) بتكليفك بتدريس مادة (${course.name}).`,
      type: 'course_assigned',
      link: '/teacher/dashboard',
    });

    setSelectedTeacherId(''); // 🧹 تفريغ الحقل
    setSelectedCourseId(''); // 🧹 تفريغ الحقل
    setIsAssignmentModalOpen(false); // 🚪 إغلاق المودال
    setSuccessMessage(`تم تكليف الأستاذ (${teacher.full_name}) بتدريس مادة (${course.name}) وإشعاره بنجاح!`); // 🎉 رسالة نجاح
    setTimeout(() => setSuccessMessage(''), 4000); // ⏰ إخفاء الرسالة
  };

  // 🗑️ إلغاء تكليف دراسي
  const handleRemoveAssignment = (id: string) => {
    const targetTC = teacherCourses.find((tc) => tc.id === id);
    setDeleteModalConfig({
      isOpen: true,
      title: 'تأكيد إلغاء التكليف الدراسي',
      itemName: targetTC?.course_name || 'المادة',
      itemDetails: `الأستاذ المكلف: ${targetTC?.teacher_name || '—'} | قسم ${deptName}`,
      warningMessage: 'هل أنت متأكد من إلغاء تكليف هذا الأستاذ بتدريس هذه المادة؟',
      warningNote: 'سيتم إلغاء ارتباط الأستاذ بهذه المادة وتحديث الصلاحيات الأكاديمية فوراً.',
      confirmText: 'تأكيد إلغاء التكليف',
      variant: 'danger',
      iconType: 'user-minus',
      onConfirm: () => {
        const updated = teacherCourses.filter((tc) => tc.id !== id);
        setTeacherCourses(updated);
        saveStoredData('teacher_courses', updated);
        deleteTeacherCourseFromSupabase(id);

        if (targetTC) {
          const courseId = targetTC.course_id;
          const remainingForCourse = updated.filter((tc: TeacherCourse): boolean => tc.course_id === courseId);
          const remTheory = remainingForCourse.find((tc: TeacherCourse): boolean => tc.role_in_course === 'theory' || tc.role_in_course === 'both');
          const remPractical = remainingForCourse.find((tc: TeacherCourse): boolean => tc.role_in_course === 'practical' || tc.role_in_course === 'both');

          const updatedCourses = courses.map((c: Course): Course => {
            if (c.id === courseId) {
              const newC: Course = {
                ...c,
                theory_teacher_id: remTheory ? remTheory.teacher_id : (c.theory_teacher_id === targetTC.teacher_id ? undefined : c.theory_teacher_id),
                theory_teacher_name: remTheory ? remTheory.teacher_name : (c.theory_teacher_id === targetTC.teacher_id ? undefined : c.theory_teacher_name),
                practical_teacher_id: remPractical ? remPractical.teacher_id : (c.practical_teacher_id === targetTC.teacher_id ? undefined : c.practical_teacher_id),
                practical_teacher_name: remPractical ? remPractical.teacher_name : (c.practical_teacher_id === targetTC.teacher_id ? undefined : c.practical_teacher_name),
              };
              saveCourseToSupabase(newC);
              return newC;
            }
            return c;
          });

          setCourses(updatedCourses);
          saveStoredData('courses', updatedCourses);
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('teacher_courses_updated'));
          window.dispatchEvent(new Event('courses_updated'));
          window.dispatchEvent(new Event('storage'));
        }

        setSuccessMessage('تم إلغاء التكليف الدراسي بنجاح.');
        setTimeout(() => setSuccessMessage(''), 3000);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 👨‍🏫 تكليف مادة لأستاذ محدد عبر مودال الأستاذ الفردي
  const handleAssignCourseToSpecificTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crudTeacher || !teacherCrudCourseId) {
      setErrorMessage('يرجى اختيار المادة الدراسية لتكليف الأستاذ بها.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const course = deptCourses.find((c) => c.id === teacherCrudCourseId);
    if (!course) return;

    const existingTC: TeacherCourse | undefined = teacherCourses.find( // 🔍 فحص إذا الأستاذ مكلف مسبقاً بهالمادة
      (tc: TeacherCourse): boolean => tc.teacher_id === crudTeacher.id && tc.course_id === teacherCrudCourseId
    );

    const isPracticalCourse: boolean = course.course_type === 'theory_and_practical' || Boolean(course.has_practical); // 🔬 هل المادة تحوي مختبراً وعملياً؟

    if (existingTC) { // ⚠️ إذا الأستاذ مكلف مسبقاً
      if (existingTC.role_in_course === 'both' || !isPracticalCourse) { // 🚫 إذا كان مكلف بكل شيء أو مادة نظري فقط
        setErrorMessage('هذا الأستاذ مكلف بالفعل بهذه المادة!'); // ⚠️ تنبيه بعدم الحاجة لتكليف جديد
        setTimeout(() => setErrorMessage(''), 3000); // ⏰ إخفاء التنبيه
        return; // 🛑 توقف
      }

      // 🌟 ترقية التكليف ليصبح نظري وعملي معاً
      const updatedTC: TeacherCourse = { // 📦 بناء السجل المدمج الموحد
        ...existingTC,
        role_in_course: 'both', // 🌟 تحويله إلى نظري وعملي معاً
        teacher_name: crudTeacher.full_name, // 👤 اسم الأستاذ
        course_name: course.name, // 📖 اسم المادة
        semester: course.semester || 1, // 🗓️ الفصل
      };

      const updated: TeacherCourse[] = teacherCourses.map( // 🔄 تحديث القائمة
        (tc: TeacherCourse): TeacherCourse => (tc.id === existingTC.id ? updatedTC : tc)
      );
      setTeacherCourses(updated); // 💾 تحديث الحالة
      saveStoredData('teacher_courses', updated); // 💾 الحفظ المحلي
      saveTeacherCourseToSupabase(updatedTC); // ☁️ الحفظ السحابي

      let assignedCourseObj: Course | null = null; // 📦 كائن المادة المحدث
      const updatedCourses: Course[] = courses.map((c: Course): Course => { // 🔄 تحديث المواد
        if (c.id === course.id) {
          const uCourse: Course = {
            ...c,
            theory_teacher_id: crudTeacher.id,
            theory_teacher_name: crudTeacher.full_name,
            practical_teacher_id: crudTeacher.id,
            practical_teacher_name: crudTeacher.full_name,
          };
          assignedCourseObj = uCourse;
          return uCourse;
        }
        return c;
      });
      setCourses(updatedCourses); // 💾 تحديث الحالة
      saveStoredData('courses', updatedCourses); // 💾 حفظ محلي
      if (assignedCourseObj) { // ☁️ حفظ سحابي
        saveCourseToSupabase(assignedCourseObj);
      }

      if (typeof window !== 'undefined') { // ⚡ إشعار المتصفح
        window.dispatchEvent(new Event('teacher_courses_updated'));
        window.dispatchEvent(new Event('courses_updated'));
        window.dispatchEvent(new Event('profiles_updated'));
        window.dispatchEvent(new Event('storage'));
      }

      sendAppNotification({ // 🔔 إرسال إشعار للأستاذ
        recipient_id: crudTeacher.id,
        recipient_role: 'teacher',
        title: 'ترقية التكليف الأكاديمي',
        message: `قام رئيس قسم (${deptName}) بترقية تكليفك بمادة (${course.name}) لتشمل النظري والعملي معاً.`,
        type: 'course_assigned',
        link: '/teacher/dashboard',
      });

      setTeacherCrudCourseId(''); // 🧹 تفريغ الحقل
      setTeacherCrudSearchQuery(''); // 🧹 تفريغ البحث
      setSuccessMessage(`تم بنجاح ترقية تكليف الأستاذ (${crudTeacher.full_name}) ليصبح مكلفاً بالنظري والعملي لمادة (${course.name})!`); // 🎉 رسالة نجاح
      setTimeout(() => setSuccessMessage(''), 4000); // ⏰ إخفاء الرسالة
      return; // 🛑 انتهاء الترقية بنجاح
    }

    const newTC: TeacherCourse = { // 📝 بناء سجل تكليف جديد
      id: `tc-${Date.now()}`, // 🆔 معرف فريد
      teacher_id: crudTeacher.id, // 🔑 معرف الأستاذ
      teacher_name: crudTeacher.full_name, // 👤 اسم الأستاذ
      course_id: course.id, // 📖 معرف المادة
      course_name: course.name, // 📖 اسم المادة
      department_id: currentDeptId, // 🏢 معرف القسم
      role_in_course: 'theory', // 🏷️ نظري افتراضياً
      semester: course.semester || 1, // 🗓️ الفصل
      created_at: new Date().toISOString(), // ⏰ تاريخ التكليف
    };

    const updated: TeacherCourse[] = [...teacherCourses, newTC]; // ➕ إضافة التكليف
    setTeacherCourses(updated); // 💾 تحديث الحالة
    saveStoredData('teacher_courses', updated); // 💾 الحفظ المحلي
    saveTeacherCourseToSupabase(newTC); // ☁️ الحفظ السحابي

    let assignedCourseObj: Course | null = null; // 📦 كائن المادة المحدث
    const updatedCourses: Course[] = courses.map((c: Course): Course => { // 🔄 تحديث المواد
      if (c.id === course.id) { // 🎯 مطابقة المادة
        const uCourse: Course = { // 📝 تعيين أستاذ النظري
          ...c,
          theory_teacher_id: crudTeacher.id,
          theory_teacher_name: crudTeacher.full_name,
        };
        assignedCourseObj = uCourse; // 💾 حفظ الكائن
        return uCourse; // 📦 إرجاع المادة
      }
      return c; // 📋 إبقاء البقية
    });
    setCourses(updatedCourses);
    saveStoredData('courses', updatedCourses);
    if (assignedCourseObj) {
      saveCourseToSupabase(assignedCourseObj);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('teacher_courses_updated'));
      window.dispatchEvent(new Event('courses_updated'));
      window.dispatchEvent(new Event('profiles_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    sendAppNotification({
      recipient_id: crudTeacher.id,
      recipient_role: 'teacher',
      title: 'تكليف أكاديمي جديد بمادة دراسية',
      message: `قام رئيس قسم (${deptName}) بتكليفك بتدريس مادة (${course.name}).`,
      type: 'course_assigned',
      link: '/teacher/dashboard',
    });

    setTeacherCrudCourseId('');
    setTeacherCrudSearchQuery('');
    setSuccessMessage(`تم بنجاح تكليف الأستاذ (${crudTeacher.full_name}) بمادة (${course.name})!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // 📝 فتح مودال تعديل التكليف
  const handleOpenEditAssignment = (tc: TeacherCourse) => {
    setEditingAssignment(tc);
    setSelectedTeacherId(tc.teacher_id);
    setSelectedCourseId(tc.course_id);
    setSelectedAssignRole(tc.role_in_course || 'theory');
    setIsAssignmentModalOpen(true);
  };

  // 💾 حفظ تعديل التكليف الأكاديمي
  const handleSaveEditedAssignment = (e: React.FormEvent) => {
    e.preventDefault(); // 🛑 منع إعادة تحميل الصفحة
    if (!editingAssignment || !selectedTeacherId || !selectedCourseId) { // 🔍 التحقق من سلامة المدخلات
      setErrorMessage('يرجى التأكد من اختيار الأستاذ والمادة الدراسية.'); // ⚠️ تنبيه بالنقص
      setTimeout(() => setErrorMessage(''), 3000); // ⏰ إخفاء التنبيه
      return; // 🛑 توقف
    }

    const teacher: UserProfile | undefined = deptTeachers.find((t: UserProfile): boolean => t.id === selectedTeacherId); // 👤 بيانات الأستاذ المختار
    const course: Course | undefined = deptCourses.find((c: Course): boolean => c.id === selectedCourseId); // 📖 بيانات المادة المختارة
    if (!teacher || !course) return; // 🛑 توقف إذا مفقودة

    // 🔍 فحص إذا كان هناك سجل تكليف آخر لنفس هذا الأستاذ على نفس المادة
    const duplicateTC: TeacherCourse | undefined = teacherCourses.find(
      (tc: TeacherCourse): boolean => tc.id !== editingAssignment.id && tc.teacher_id === selectedTeacherId && tc.course_id === selectedCourseId
    );

    let finalRole: 'theory' | 'practical' | 'both' = selectedAssignRole; // 🏷️ الدور المعتمد النهائي
    let redundantIdToDelete: string | null = null; // 🗑️ معرف السجل المكرر الزائد لحذفه

    if (duplicateTC) { // 🌟 إذا وجد سجل آخر لنفس الأستاذ بهذه المادة
      redundantIdToDelete = duplicateTC.id; // 🗑️ تحديد السجل الزائد للحذف
      deleteTeacherCourseFromSupabase(duplicateTC.id); // ☁️ حذفه من قاعدة سوبابيس فوراً لمنع التضارب
      if (duplicateTC.role_in_course !== selectedAssignRole || selectedAssignRole === 'both') { // 🌟 دمج الصفتين إذا مختلفتين أو تم اختيار كلاهما
        finalRole = 'both'; // ✨ اعتماد صفة نظري وعملي معاً
      }
    }

    const updatedTC: TeacherCourse = { // 📦 بناء سجل التكليف المحدث والمنقح
      ...editingAssignment, // 📋 بيانات السجل
      teacher_id: teacher.id, // 🔑 معرف الأستاذ
      teacher_name: teacher.full_name, // 👤 اسم الأستاذ
      course_id: course.id, // 📖 معرف المادة
      course_name: course.name, // 📖 اسم المادة
      role_in_course: finalRole, // 🌟 الدور المعتمد النهائي
      semester: course.semester || 1, // 🗓️ الفصل الدراسي
    };

    const updatedList: TeacherCourse[] = teacherCourses
      .filter((tc: TeacherCourse): boolean => tc.id !== redundantIdToDelete) // 🧹 إزالة السجل المكرر الزائد
      .map((tc: TeacherCourse): TeacherCourse => (tc.id === editingAssignment.id ? updatedTC : tc)); // 🔄 تحديث السجل الحالي
    setTeacherCourses(updatedList); // 💾 تحديث الحالة في واجهة React
    saveStoredData('teacher_courses', updatedList); // 💾 حفظ التكليفات محلياً
    saveTeacherCourseToSupabase(updatedTC); // ☁️ حفظ التكليف المحدث بسوبابيس

    let updatedCourseObj: Course | null = null; // 📦 كائن المادة المحدثة
    const updatedCourses: Course[] = courses.map((c: Course): Course => { // 🔄 تحديث قائمة المواد
      if (c.id === course.id) { // 🎯 مطابقة المادة
        const u: Course = { // 📝 تحديث أساتذة المادة
          ...c,
          ...(finalRole === 'practical'
            ? { practical_teacher_id: teacher.id, practical_teacher_name: teacher.full_name }
            : finalRole === 'both'
            ? { theory_teacher_id: teacher.id, theory_teacher_name: teacher.full_name, practical_teacher_id: teacher.id, practical_teacher_name: teacher.full_name }
            : { theory_teacher_id: teacher.id, theory_teacher_name: teacher.full_name }),
        };
        updatedCourseObj = u; // 💾 حفظ الكائن
        return u; // 📦 إرجاع المادة المحدثة
      }
      if (c.id === editingAssignment.course_id && editingAssignment.course_id !== course.id) { // 🔄 إذا تغيرت المادة تماماً ننظف القديمة
        return {
          ...c,
          theory_teacher_id: c.theory_teacher_id === editingAssignment.teacher_id ? undefined : c.theory_teacher_id,
          theory_teacher_name: c.theory_teacher_id === editingAssignment.teacher_id ? undefined : c.theory_teacher_name,
          practical_teacher_id: c.practical_teacher_id === editingAssignment.teacher_id ? undefined : c.practical_teacher_id,
          practical_teacher_name: c.practical_teacher_id === editingAssignment.teacher_id ? undefined : c.practical_teacher_name,
        };
      }
      return c; // 📋 إبقاء المواد الأخرى
    });
    setCourses(updatedCourses); // 💾 تحديث حالة المواد
    saveStoredData('courses', updatedCourses); // 💾 حفظ المواد محلياً
    if (updatedCourseObj) { // ☁️ حفظ المادة المحدثة سحابياً
      saveCourseToSupabase(updatedCourseObj);
    }

    if (typeof window !== 'undefined') { // ⚡ إطلاق أحداث التحديث
      window.dispatchEvent(new Event('teacher_courses_updated'));
      window.dispatchEvent(new Event('courses_updated'));
      window.dispatchEvent(new Event('profiles_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    setIsAssignmentModalOpen(false); // 🚪 إغلاق مودال التعديل
    setEditingAssignment(null); // 🧹 تفريغ التكليف قيد التعديل
    setSelectedTeacherId(''); // 🧹 تفريغ الحقل
    setSelectedCourseId(''); // 🧹 تفريغ الحقل
    setSuccessMessage(`تم بنجاح تعديل وتوحيد التكليف الأكاديمي للأستاذ (${teacher.full_name})!`); // 🎉 رسالة نجاح
    setTimeout(() => setSuccessMessage(''), 4000); // ⏰ إخفاء الرسالة
  };

  // 🔘 تبديل تحديد كافة التكليفات
  const toggleSelectAllAssignments = () => {
    if (selectedAssignmentIds.length === filteredTeacherCourses.length) {
      setSelectedAssignmentIds([]);
    } else {
      setSelectedAssignmentIds(filteredTeacherCourses.map((tc) => tc.id));
    }
  };

  // 🔘 تبديل تحديد تكليف مفرد
  const toggleSelectAssignment = (id: string) => {
    setSelectedAssignmentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // 🗑️ إلغاء جماعي للتكليفات المحددة
  const handleBulkRemoveAssignments = () => {
    const count = selectedAssignmentIds.length;
    if (count === 0) return;

    setDeleteModalConfig({
      isOpen: true,
      title: `تأكيد إلغاء (${count}) تكليفات تدريسية`,
      itemName: `${count} تكليفات تدريسية في قسم ${deptName}`,
      itemDetails: `سيتم إلغاء ارتباط الأساتذة بالمواد المحددة وتحديث صلاحيات رصد الدرجات فوراً.`,
      warningMessage: `⚠️ هل أنت متأكد من إلغاء (${count}) تكليفات دفعة واحدة؟`,
      confirmText: `إلغاء (${count}) تكليفات نهائياً`,
      variant: 'danger',
      iconType: 'user-minus',
      onConfirm: () => {
        selectedAssignmentIds.forEach((id: string) => {
          deleteTeacherCourseFromSupabase(id);
        });

        const updatedTCs = teacherCourses.filter((tc: TeacherCourse): boolean => !selectedAssignmentIds.includes(tc.id));
        setTeacherCourses(updatedTCs);
        saveStoredData('teacher_courses', updatedTCs);

        const updatedCourses = courses.map((c: Course): Course => {
          const remainingForCourse = updatedTCs.filter((tc: TeacherCourse): boolean => tc.course_id === c.id);
          const remTheory = remainingForCourse.find((tc: TeacherCourse): boolean => tc.role_in_course === 'theory' || tc.role_in_course === 'both');
          const remPractical = remainingForCourse.find((tc: TeacherCourse): boolean => tc.role_in_course === 'practical' || tc.role_in_course === 'both');

          const newC: Course = {
            ...c,
            theory_teacher_id: remTheory ? remTheory.teacher_id : undefined,
            theory_teacher_name: remTheory ? remTheory.teacher_name : undefined,
            practical_teacher_id: remPractical ? remPractical.teacher_id : undefined,
            practical_teacher_name: remPractical ? remPractical.teacher_name : undefined,
          };
          saveCourseToSupabase(newC);
          return newC;
        });
        setCourses(updatedCourses);
        saveStoredData('courses', updatedCourses);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('courses_updated'));
          window.dispatchEvent(new Event('teacher_courses_updated'));
          window.dispatchEvent(new Event('storage'));
        }

        setSelectedAssignmentIds([]);
        setSuccessMessage(`تم إلغاء (${count}) تكليفات تدريسية بنجاح وتحديث صلاحيات الأساتذة.`);
        setTimeout(() => setSuccessMessage(''), 3500);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 📊 تصدير قائمة تكليفات الكادر التدريسي إلى Excel
  const handleExportAssignmentsExcel = async () => {
    try {
      setIsExportingAssignmentsExcel(true);
      const targetAssignments = selectedAssignmentIds.length > 0
        ? deptTeacherCourses.filter((tc: TeacherCourse): boolean => selectedAssignmentIds.includes(tc.id))
        : (filteredTeacherCourses.length > 0 ? filteredTeacherCourses : deptTeacherCourses);

      if (targetAssignments.length === 0) {
        setErrorMessage('لا توجد تكليفات تدريسية في القسم للتصدير حالياً.');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      const formattedAssignments = targetAssignments.map((tc: TeacherCourse) => {
        const teacher = deptTeachers.find((t: UserProfile) => t.id === tc.teacher_id);
        const course = deptCourses.find((c: Course) => c.id === tc.course_id);
        return {
          teacher_name: tc.teacher_name || teacher?.full_name || 'غير معروف',
          teacher_email: teacher?.generated_email || '—',
          course_name: tc.course_name || course?.name || 'غير معروف',
          course_code: course?.code || '—',
          stage_number: course?.stage_number || 1,
          semester: tc.semester || course?.semester || 1,
          role_in_course: tc.role_in_course,
          created_at: tc.created_at,
        };
      });

      await exportCustomTeacherCoursesList(formattedAssignments, deptName);
      setSuccessMessage(`تم بنجاح تصدير (${formattedAssignments.length}) تكليف تدريسي إلى ملف Excel! 📊`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      console.error('خطأ في تصدير التكليفات:', error);
      setErrorMessage('حدث خطأ أثناء تصدير ملف إكسل التكليفات.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsExportingAssignmentsExcel(false);
    }
  };

  return {
    // 📌 الحقول والاختيارات
    selectedTeacherId,
    setSelectedTeacherId,
    selectedCourseId,
    setSelectedCourseId,
    selectedAssignRole,
    setSelectedAssignRole,
    isAssignmentModalOpen,
    setIsAssignmentModalOpen,
    editingAssignment,
    setEditingAssignment,

    // 🔍 الفلاتر والبحث والتحديد
    assignmentSearch,
    setAssignmentSearch,
    filterAssignmentTeacher,
    setFilterAssignmentTeacher,
    filterAssignmentStage,
    setFilterAssignmentStage,
    filterAssignmentSemester,
    setFilterAssignmentSemester,
    filterAssignmentRole,
    setFilterAssignmentRole,
    selectedAssignmentIds,
    setSelectedAssignmentIds,
    assignmentPage,
    setAssignmentPage,
    assignmentPageSize,
    setAssignmentPageSize,
    isExportingAssignmentsExcel,
    setIsExportingAssignmentsExcel,

    // 👨‍🏫 مودال الأستاذ الفردي
    crudTeacher,
    setCrudTeacher,
    isTeacherCrudModalOpen,
    setIsTeacherCrudModalOpen,
    teacherCrudCourseId,
    setTeacherCrudCourseId,
    teacherCrudSearchQuery,
    setTeacherCrudSearchQuery,

    // 🖨️ الطباعة
    showAssignmentsPrintModal,
    setShowAssignmentsPrintModal,
    assignmentsPrintScope,
    setAssignmentsPrintScope,

    // 🔽 القوائم المنسدلة الذكية
    isAssignTeacherDropdownOpen,
    setIsAssignTeacherDropdownOpen,
    assignTeacherCoords,
    setAssignTeacherCoords,
    assignTeacherSearchQuery,
    setAssignTeacherSearchQuery,
    assignTeacherButtonRef,
    handleToggleAssignTeacherDropdown,

    isAssignCourseDropdownOpen,
    setIsAssignCourseDropdownOpen,
    assignCourseCoords,
    setAssignCourseCoords,
    assignCourseSearchQuery,
    setAssignCourseSearchQuery,
    assignCourseButtonRef,
    handleToggleAssignCourseDropdown,

    isFilterTeacherDropdownOpen,
    setIsFilterTeacherDropdownOpen,
    filterTeacherCoords,
    setFilterTeacherCoords,
    filterTeacherSearchQuery,
    setFilterTeacherSearchQuery,
    filterTeacherButtonRef,
    handleToggleFilterTeacherDropdown,

    // 📋 القوائم المصفاة
    deptTeacherCourses,
    filteredTeacherCourses,

    // ⚡ دوال المعالجة
    handleAssignTeacher,
    handleRemoveAssignment,
    handleAssignCourseToSpecificTeacher,
    handleOpenEditAssignment,
    handleSaveEditedAssignment,
    toggleSelectAllAssignments,
    toggleSelectAssignment,
    handleBulkRemoveAssignments,
    handleExportAssignmentsExcel,
  };
};
