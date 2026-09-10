// 📚 خطاف مخصص لإدارة مواد ومقررات القسم (إضافة، تعديل، حذف، استيراد وتصدير إكسل وPDF، تعيين سريع، تفعيل الامتحانات وتوزيع الدرجات)
// 🛡️ التزام نمطي صارم بدون any أو unknown مع توثيق عراقي تفصيلي لكل سطر

import { useState, useMemo, useRef, useCallback } from 'react'; // ⚛️ استيراد خطافات رياكت
import type { Course, CourseType, AssessmentScheme, UserProfile, TeacherCourse } from '@/types'; // 📚 استيراد واجهات المواد والأساتذة
import type { DepartmentDeleteModalConfig, ImportSummaryReport, QuickAssignState, RoundActionConfirmation } from '../types'; // 🏷️ استيراد واجهات البوابة المشتركة
import { calculateSmartDropdownPosition, type SmartDropdownPosition } from '../dropdownUtils'; // 📐 حساب الموضع الذكي للقائمة
import { saveStoredData, getAcademicYear } from '@/lib/mock-data'; // 💾 حفظ البيانات محلياً والحصول على السنة
import { saveCourseToSupabase, deleteCourseFromSupabase, saveTeacherCourseToSupabase, deleteTeacherCourseFromSupabase } from '@/lib/supabase-client'; // ☁️ المزامنة السحابية
import { getStageNameInArabic, getDefaultAssessmentScheme } from '@/lib/grade-utils'; // 🏷️ اسم المرحلة والمخطط التقييمي الافتراضي
import { exportDepartmentCoursesPDF, type DepartmentCoursePDFItem } from '@/lib/pdf-export'; // 📜 مولد كشوفات المواد الرسمية PDF
import { downloadDepartmentCoursesTemplate, parseExcelFile, exportCustomCoursesList } from '@/lib/excel-utils'; // 📊 دوال الإكسل
import { sendAppNotification } from '@/lib/notification-utils'; // 🔔 مركز الإشعارات

// 📋 واجهة مدخلات خطاف مواد القسم
export interface UseDepartmentCoursesProps {
  currentDeptId: string; // 🏛️ معرف القسم الأكاديمي الحالي
  deptName: string; // 🏷️ اسم القسم الأكاديمي
  courses: Course[]; // 📖 مصفوفة المواد الدراسية في النظام
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>; // 🔄 دالة تحديث المواد
  profiles: UserProfile[]; // 👥 مصفوفة المستخدمين
  deptTeachers: UserProfile[]; // 👨‍🏫 أساتذة القسم المصفين
  teacherCourses: TeacherCourse[]; // 🔗 التكليفات
  setTeacherCourses: React.Dispatch<React.SetStateAction<TeacherCourse[]>>; // 🔄 دالة تحديث التكليفات
  currentHead?: UserProfile; // 👤 رئيس القسم
  currentRap?: UserProfile; // 👤 مقرر القسم
  setSuccessMessage: (msg: string) => void; // ✨ دالة إشعار النجاح
  setErrorMessage: (msg: string) => void; // ⚠️ دالة إشعار الخطأ
  setDeleteModalConfig: React.Dispatch<React.SetStateAction<DepartmentDeleteModalConfig>>; // 🗑️ دالة إعداد نافذة الحذف
}

// 🎯 دالة الخطاف الرئيسية لإدارة مواد ومقررات القسم
export const useDepartmentCourses = ({
  currentDeptId, // 🏛️ معرف القسم
  deptName, // 🏷️ اسم القسم
  courses, // 📖 المواد
  setCourses, // 🔄 تحديث المواد
  profiles, // 👥 المستخدمون
  deptTeachers, // 👨‍🏫 أساتذة القسم
  teacherCourses, // 🔗 التكليفات
  setTeacherCourses, // 🔄 تحديث التكليفات
  currentHead, // 👤 رئيس القسم
  currentRap, // 👤 مقرر القسم
  setSuccessMessage, // ✨ رسالة النجاح
  setErrorMessage, // ⚠️ رسالة الخطأ
  setDeleteModalConfig, // 🗑️ نافذة الحذف
}: UseDepartmentCoursesProps) => {
  // 📖 حقول نموذج المادة
  const [courseName, setCourseName] = useState<string>(''); // 📘 اسم المادة
  const [courseCode, setCourseCode] = useState<string>(''); // 🏷️ كود المادة
  const [courseCredits, setCourseCredits] = useState<number | null>(null); // ⏱️ عدد الوحدات
  const [courseStage, setCourseStage] = useState<number | null>(null); // 🎓 المرحلة
  const [courseSemester, setCourseSemester] = useState<1 | 2 | null>(null); // 🗓️ الفصل الدراسي
  const [courseType, setCourseType] = useState<CourseType | null>(null); // 🔬 نوع المادة
  const [courseTheoryTeacherId, setCourseTheoryTeacherId] = useState<string>(''); // 👨‍🏫 أستاذ النظري
  const [coursePracticalTeacherId, setCoursePracticalTeacherId] = useState<string>(''); // 🧪 أستاذ العملي
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null); // ✏️ معرف المادة الجاري تعديلها
  const [courseIsSupplementaryEnabled, setCourseIsSupplementaryEnabled] = useState<boolean>(false); // 🔄 تفعيل الدور الثاني
  const [courseIsFinalExamEnabled, setCourseIsFinalExamEnabled] = useState<boolean>(false); // 🔒 تفعيل الفاينل
  const [isCourseModalOpen, setIsCourseModalOpen] = useState<boolean>(false); // 📦 نافذة إضافة وتعديل مادة

  // 🔍 البحث والفلاتر
  const [courseSearch, setCourseSearch] = useState<string>(''); // 🔍 نص البحث
  const [filterCourseStage, setFilterCourseStage] = useState<number | 'all'>('all'); // 🎓 فلتر المرحلة
  const [filterCourseSemester, setFilterCourseSemester] = useState<number | 'all'>('all'); // 🗓️ فلتر الكورس
  const [filterCourseType, setFilterCourseType] = useState<'all' | 'theory_and_practical' | 'theory_only'>('all'); // 🔬 فلتر النوع
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]); // 🔘 معرفات المواد المحددة

  // 📊 حالات الإكسل والـ PDF
  const [showCourseExcelInstructions, setShowCourseExcelInstructions] = useState<boolean>(false); // ℹ️ تعليمات إكسل المواد
  const [isImportingCourseExcel, setIsImportingCourseExcel] = useState<boolean>(false); // ⏳ مؤشر استيراد الإكسل
  const [isExportingCoursesPDF, setIsExportingCoursesPDF] = useState<boolean>(false); // 🖨️ مؤشر تصدير PDF
  const [courseImportReport, setCourseImportReport] = useState<ImportSummaryReport | null>(null); // 📑 تقرير استيراد المواد
  const [courseActiveReportTab, setCourseActiveReportTab] = useState<'accepted' | 'duplicates' | 'rejected'>('accepted'); // 📑 تبويب التقرير النشط
  const [isExportingCoursesExcel, setIsExportingCoursesExcel] = useState<boolean>(false); // ⏳ مؤشر تصدير إكسل المواد

  // 🎛️ حالات توزيع الدرجات والامتحانات
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState<boolean>(false); // 🎛️ نافذة توزيع درجات بولونيا
  const [selectedCourseForAssessment, setSelectedCourseForAssessment] = useState<Course | null>(null); // 📖 المادة المختارة للتقييم
  const [tempAssessmentScheme, setTempAssessmentScheme] = useState<AssessmentScheme | null>(null); // 📊 المخطط المؤقت

  // 🔄 حالات تأكيد فتح وقفل الدور
  const [roundConfirmModal, setRoundConfirmModal] = useState<RoundActionConfirmation | null>(null); // 🔄 نافذة تأكيد الأدوار
  const [examToggleConfirmation, setExamToggleConfirmation] = useState<{
    isOpen: boolean; // 🪟 هل النافذة مفتوحة
    examType: 'final' | 'supplementary'; // 🎯 نوع الامتحان
    targetState: boolean; // ⚡ الحالة المطلوبة
    title: string; // 🏷️ العنوان
    description: string; // 📝 الوصف
  } | null>(null); // 🔐 نافذة تأكيد الامتحان بكارد المادة

  // 📄 ترقيم الصفحات
  const [coursePage, setCoursePage] = useState<number>(1); // 📄 الصفحة الحالية
  const [coursePageSize, setCoursePageSize] = useState<number>(10); // 📏 عدد المواد بالصفحة

  // ⚡ التعيين والتكليف السريع للأستاذ
  const [quickAssignConfig, setQuickAssignConfig] = useState<QuickAssignState>({
    isOpen: false, // 🔒 مغلق افتراضياً
    course: null, // 📖 لا مادة محددة
    role: 'theory', // 🏷️ الافتراضي نظري
    selectedTeacherId: '', // 👨‍🏫 لم يتم اختيار أستاذ
    searchQuery: '', // 🔍 مربع البحث فارغ
  });

  // 🔽 حالات القوائم المنسدلة الذكية لأساتذة النظري والعملي في كارد المادة
  const [isCourseTheoryDropdownOpen, setIsCourseTheoryDropdownOpen] = useState<boolean>(false); // 🔓 قائمة أستاذ النظري
  const [isCoursePracticalDropdownOpen, setIsCoursePracticalDropdownOpen] = useState<boolean>(false); // 🔓 قائمة أستاذ العملي
  const [theoryTeacherCoords, setTheoryTeacherCoords] = useState<SmartDropdownPosition | null>(null); // 📐 إحداثيات أستاذ النظري
  const [practicalTeacherCoords, setPracticalTeacherCoords] = useState<SmartDropdownPosition | null>(null); // 📐 إحداثيات أستاذ العملي
  const theoryTeacherBtnRef = useRef<HTMLButtonElement | null>(null); // 🔘 مرجع زر أستاذ النظري
  const practicalTeacherBtnRef = useRef<HTMLButtonElement | null>(null); // 🔘 مرجع زر أستاذ العملي

  // 🔍 تصفية مواد القسم الحالي
  const deptCourses = useMemo(() => {
    return courses.filter((c) => c.department_id === currentDeptId || c.department_name === deptName);
  }, [courses, currentDeptId, deptName]);

  // 🔍 تصفية المواد بحسب البحث والمرحلة والكورس والنوع
  const filteredCourses = useMemo(() => {
    const term = courseSearch.toLowerCase();
    return deptCourses.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term) ||
        (c.theory_teacher_name && c.theory_teacher_name.toLowerCase().includes(term)) ||
        (c.practical_teacher_name && c.practical_teacher_name.toLowerCase().includes(term));
      const matchesStage = filterCourseStage === 'all' || (c.stage_number || 1) === filterCourseStage;
      const matchesSemester = filterCourseSemester === 'all' || (c.semester || 1) === filterCourseSemester;
      const isPractical = c.course_type === 'theory_and_practical' || Boolean(c.has_practical);
      const matchesType =
        filterCourseType === 'all' ||
        (filterCourseType === 'theory_and_practical' && isPractical) ||
        (filterCourseType === 'theory_only' && !isPractical);
      return matchesSearch && matchesStage && matchesSemester && matchesType;
    });
  }, [deptCourses, courseSearch, filterCourseStage, filterCourseSemester, filterCourseType]);

  // 🎯 المواد المستهدفة حسب المرحلة والكورس المحددين
  const targetRoundCourses = useMemo(() => {
    return deptCourses.filter((c) => {
      const matchesStage = filterCourseStage === 'all' || (Number(c.stage_number) || 1) === Number(filterCourseStage);
      const matchesSemester = filterCourseSemester === 'all' || (Number(c.semester) || 1) === Number(filterCourseSemester);
      return matchesStage && matchesSemester;
    });
  }, [deptCourses, filterCourseStage, filterCourseSemester]);

  // 🎯 المواد النشطة المستهدفة للتحكم الجماعي (سواء المحددة بالـ Checkbox أو المفلترة)
  const activeTargetRoundCourses = useMemo(() => {
    if (selectedCourseIds.length > 0) {
      return deptCourses.filter((c) => selectedCourseIds.includes(c.id));
    }
    return targetRoundCourses;
  }, [selectedCourseIds, deptCourses, targetRoundCourses]);

  // 🔢 معرفات مواد الكورس الأول ومواد الكورس الثاني للقسم
  const deptSem1CourseIds = useMemo(() => {
    return deptCourses.filter((c) => (Number(c.semester) || 1) === 1).map((c) => c.id);
  }, [deptCourses]);

  const deptSem2CourseIds = useMemo(() => {
    return deptCourses.filter((c) => (Number(c.semester) || 1) === 2).map((c) => c.id);
  }, [deptCourses]);

  // 🔒 إحصائيات الدور الأول
  const finalOpenCount = activeTargetRoundCourses.filter((c) => c.is_final_exam_enabled === true).length;
  const isBulkFinalOpen = activeTargetRoundCourses.length > 0 && finalOpenCount === activeTargetRoundCourses.length;
  const isBulkFinalPartial = finalOpenCount > 0 && finalOpenCount < activeTargetRoundCourses.length;

  // 🔒 إحصائيات الدور الثاني
  const supOpenCount = activeTargetRoundCourses.filter((c) => c.is_supplementary_exam_enabled === true).length;
  const isBulkSupOpen = activeTargetRoundCourses.length > 0 && supOpenCount === activeTargetRoundCourses.length;
  const isBulkSupPartial = supOpenCount > 0 && supOpenCount < activeTargetRoundCourses.length;

  // 👨‍🏫 فتح وإغلاق قائمة أستاذ النظري بحساب ذكي
  const handleToggleCourseTheoryDropdown = () => {
    if (!isCourseTheoryDropdownOpen && theoryTeacherBtnRef.current) {
      setTheoryTeacherCoords(calculateSmartDropdownPosition(theoryTeacherBtnRef.current, 220));
      setIsCourseTheoryDropdownOpen(true);
      setIsCoursePracticalDropdownOpen(false);
    } else {
      setIsCourseTheoryDropdownOpen(false);
    }
  };

  // 🧪 فتح وإغلاق قائمة أستاذ العملي بحساب ذكي
  const handleToggleCoursePracticalDropdown = () => {
    if (!isCoursePracticalDropdownOpen && practicalTeacherBtnRef.current) {
      setPracticalTeacherCoords(calculateSmartDropdownPosition(practicalTeacherBtnRef.current, 220));
      setIsCoursePracticalDropdownOpen(true);
      setIsCourseTheoryDropdownOpen(false);
    } else {
      setIsCoursePracticalDropdownOpen(false);
    }
  };

  // ⚡ تنفيذ تأكيد فتح أو إغلاق الامتحان بعد موافقة المستخدم بكارد المادة
  const handleConfirmExamToggle = () => {
    if (!examToggleConfirmation) return;
    if (examToggleConfirmation.examType === 'final') {
      setCourseIsFinalExamEnabled(examToggleConfirmation.targetState);
    } else {
      setCourseIsSupplementaryEnabled(examToggleConfirmation.targetState);
    }
    setExamToggleConfirmation(null);
  };

  // 🔍 استخراج أساتذة النظري المكلفين بالمادة
  const getCourseTheoryTeachers = useCallback((course: Course): Array<{ id: string; name: string }> => {
    const list: Array<{ id: string; name: string }> = [];
    const addedIds = new Set<string>();

    const matchedTCs = teacherCourses.filter(
      (tc: TeacherCourse): boolean => tc.course_id === course.id && (tc.role_in_course === 'theory' || tc.role_in_course === 'both')
    );

    matchedTCs.forEach((tc: TeacherCourse) => {
      if (tc.teacher_id && !addedIds.has(tc.teacher_id)) {
        const prof = profiles.find((p: UserProfile): boolean => p.id === tc.teacher_id);
        const name = tc.teacher_name || prof?.full_name || 'أستاذ المادة';
        list.push({ id: tc.teacher_id, name });
        addedIds.add(tc.teacher_id);
      }
    });

    if (course.theory_teacher_id && !addedIds.has(course.theory_teacher_id)) {
      const prof = profiles.find((p: UserProfile): boolean => p.id === course.theory_teacher_id);
      const name = course.theory_teacher_name || prof?.full_name || 'أستاذ المادة';
      list.push({ id: course.theory_teacher_id, name });
      addedIds.add(course.theory_teacher_id);
    }

    if (list.length === 0 && course.theory_teacher_name && course.theory_teacher_name.trim() !== '') {
      list.push({ id: course.theory_teacher_id || `temp-th-${course.id}`, name: course.theory_teacher_name.trim() });
    }

    return list;
  }, [teacherCourses, profiles]);

  // 🧪 استخراج أساتذة العملي المكلفين بالمادة
  const getCoursePracticalTeachers = useCallback((course: Course): Array<{ id: string; name: string }> => {
    const isPractical = course.course_type === 'theory_and_practical' || Boolean(course.has_practical);
    if (!isPractical) return [];

    const list: Array<{ id: string; name: string }> = [];
    const addedIds = new Set<string>();

    const matchedTCs = teacherCourses.filter(
      (tc: TeacherCourse): boolean => tc.course_id === course.id && (tc.role_in_course === 'practical' || tc.role_in_course === 'both')
    );

    matchedTCs.forEach((tc: TeacherCourse) => {
      if (tc.teacher_id && !addedIds.has(tc.teacher_id)) {
        const prof = profiles.find((p: UserProfile): boolean => p.id === tc.teacher_id);
        const name = tc.teacher_name || prof?.full_name || 'أستاذ العملي';
        list.push({ id: tc.teacher_id, name });
        addedIds.add(tc.teacher_id);
      }
    });

    if (course.practical_teacher_id && !addedIds.has(course.practical_teacher_id)) {
      const prof = profiles.find((p: UserProfile): boolean => p.id === course.practical_teacher_id);
      const name = course.practical_teacher_name || prof?.full_name || 'أستاذ العملي';
      list.push({ id: course.practical_teacher_id, name });
      addedIds.add(course.practical_teacher_id);
    }

    if (list.length === 0 && course.practical_teacher_name && course.practical_teacher_name.trim() !== '') {
      list.push({ id: course.practical_teacher_id || `temp-pr-${course.id}`, name: course.practical_teacher_name.trim() });
    }

    return list;
  }, [teacherCourses, profiles]);

  // ⚡ فتح مودال التعيين والتكليف السريع للأستاذ
  const handleOpenQuickAssign = (course: Course, role: 'theory' | 'practical') => {
    const currentTeacherId = role === 'theory' ? course.theory_teacher_id : course.practical_teacher_id;
    setQuickAssignConfig({
      isOpen: true,
      course,
      role,
      selectedTeacherId: currentTeacherId || '',
      searchQuery: '',
    });
  };

  // 💾 حفظ التعيين السريع وتحديث المادة والتكليفات سحابياً ومحلياً
  const handleSaveQuickAssign = (teacherIdToAssign: string | null) => {
    if (!quickAssignConfig.course) return;
    const targetCourse = quickAssignConfig.course;
    const role = quickAssignConfig.role;
    const selectedTeacher = deptTeachers.find((t) => t.id === teacherIdToAssign);

    let updatedCourseObj: Course | null = null;
    const updatedCourses = courses.map((c) => {
      if (c.id === targetCourse.id) {
        const updatedCourse: Course = {
          ...c,
          ...(role === 'theory'
            ? {
                theory_teacher_id: teacherIdToAssign || undefined,
                theory_teacher_name: selectedTeacher?.full_name || undefined,
              }
            : {
                practical_teacher_id: teacherIdToAssign || undefined,
                practical_teacher_name: selectedTeacher?.full_name || undefined,
              }),
        };
        updatedCourseObj = updatedCourse;
        return updatedCourse;
      }
      return c;
    });

    let updatedTCs = [...teacherCourses];
    let newOrUpdatedTC: TeacherCourse | null = null;

    if (!teacherIdToAssign) {
      const removedTCs = updatedTCs.filter(
        (tc) => tc.course_id === targetCourse.id && (tc.role_in_course === role || tc.role_in_course === 'both')
      );
      removedTCs.forEach((tc) => {
        deleteTeacherCourseFromSupabase(tc.id);
      });
      updatedTCs = updatedTCs.filter(
        (tc) => !(tc.course_id === targetCourse.id && (tc.role_in_course === role || tc.role_in_course === 'both'))
      );
    } else {
      const existingAssignmentIndex = updatedTCs.findIndex(
        (tc) => tc.course_id === targetCourse.id && tc.teacher_id === teacherIdToAssign
      );

      if (existingAssignmentIndex >= 0) {
        const cur = updatedTCs[existingAssignmentIndex];
        const mergedRole: 'theory' | 'practical' | 'both' = (cur.role_in_course && cur.role_in_course !== role) ? 'both' : role;
        const editedTC: TeacherCourse = {
          ...cur,
          role_in_course: mergedRole,
          teacher_name: selectedTeacher?.full_name || cur.teacher_name,
        };
        updatedTCs[existingAssignmentIndex] = editedTC;
        newOrUpdatedTC = editedTC;
      } else {
        const newTC: TeacherCourse = {
          id: `tc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          teacher_id: teacherIdToAssign,
          teacher_name: selectedTeacher?.full_name || 'أستاذ المادة',
          course_id: targetCourse.id,
          course_name: targetCourse.name,
          department_id: targetCourse.department_id || currentDeptId,
          role_in_course: role,
          semester: targetCourse.semester || 1,
          created_at: new Date().toISOString(),
        };
        updatedTCs.push(newTC);
        newOrUpdatedTC = newTC;
      }
    }

    setCourses(updatedCourses);
    setTeacherCourses(updatedTCs);
    saveStoredData('courses', updatedCourses);
    saveStoredData('teacher_courses', updatedTCs);

    if (updatedCourseObj) {
      saveCourseToSupabase(updatedCourseObj);
    }
    if (newOrUpdatedTC) {
      saveTeacherCourseToSupabase(newOrUpdatedTC);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('courses_updated'));
      window.dispatchEvent(new Event('teacher_courses_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    if (selectedTeacher) {
      sendAppNotification({
        recipient_id: selectedTeacher.id,
        recipient_role: 'teacher',
        title: 'تكليف أكاديمي رسمي بمادة دراسية',
        message: `تم تعيينك وتكليفك بتدريس مادة (${targetCourse.name}) [${role === 'theory' ? 'الجانب النظري' : 'الجانب العملي'}] في قسم (${deptName}).`,
        type: 'course_assigned',
        link: '/teacher/dashboard',
      });
    }

    setQuickAssignConfig((prev) => ({ ...prev, isOpen: false, course: null }));
    setSuccessMessage(
      teacherIdToAssign
        ? `تم بنجاح تكليف الأستاذ (${selectedTeacher?.full_name}) بمادة (${targetCourse.name})!`
        : `تم إلغاء التكليف لمادة (${targetCourse.name}) بنجاح!`
    );
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // 🎛️ فتح نافذة توزيع درجات بولونيا
  const handleOpenAssessmentModal = (course: Course) => {
    setSelectedCourseForAssessment(course);
    setTempAssessmentScheme(course.assessment_scheme ? { ...course.assessment_scheme } : null);
    setIsAssessmentModalOpen(true);
  };

  // 💾 حفظ المخطط التقييمي للمادة
  const handleSaveAssessmentSchemeModal = () => {
    if (!selectedCourseForAssessment || !tempAssessmentScheme) return;

    const cwSum =
      (tempAssessmentScheme.quiz1.max_score || 0) +
      (tempAssessmentScheme.quiz2.max_score || 0) +
      (tempAssessmentScheme.assignment1.max_score || 0) +
      (tempAssessmentScheme.assignment2.max_score || 0) +
      (tempAssessmentScheme.report.max_score || 0) +
      (tempAssessmentScheme.midterm.max_score || 0) +
      (tempAssessmentScheme.practical.max_score || 0);

    const finalExamScore = tempAssessmentScheme.final_exam.max_score || 0;

    if (cwSum !== 50) {
      setErrorMessage(`تنبيه: مجموع بنود السعي التكويني يجب أن يساوي 50 درجة بالضبط وفقاً لدليل بولونيا! (المجموع الحالي: ${cwSum} درجة).`);
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    if (finalExamScore !== 50) {
      setErrorMessage(`تنبيه: درجة الامتحان النهائي يجب أن تساوي 50 درجة بالضبط! (الدرجة الحالية: ${finalExamScore} درجة).`);
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    let updatedCourseToSync: Course | null = null;
    const updated = courses.map((c) => {
      if (c.id === selectedCourseForAssessment.id) {
        const edited: Course = {
          ...c,
          assessment_scheme: tempAssessmentScheme,
        };
        updatedCourseToSync = edited;
        return edited;
      }
      return c;
    });

    setCourses(updated);
    saveStoredData('courses', updated);
    if (updatedCourseToSync) {
      saveCourseToSupabase(updatedCourseToSync);
    }
    setIsAssessmentModalOpen(false);
    setSelectedCourseForAssessment(null);
    setSuccessMessage(`تم بنجاح حفظ وتحديث مخطط التقييم لمادة (${selectedCourseForAssessment.name})! 🎛️✨`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // 📥 تنزيل نموذج Excel معتمد لمواد القسم
  const handleDownloadCourseTemplate = async () => {
    const isFinalActive = deptCourses.some((c) => c.is_final_exam_enabled);
    const isSupActive = deptCourses.some((c) => c.is_supplementary_exam_enabled);

    await downloadDepartmentCoursesTemplate(deptName, deptTeachers, {
      isFinalExamEnabled: isFinalActive,
      isSupplementaryEnabled: isSupActive,
      semester: filterCourseSemester,
    });
    setSuccessMessage(`تم تنزيل نموذج إكسل المعتمد لمواد قسم (${deptName}) بنجاح! 📊`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // 🖨️ تصدير كشف المواد كملف PDF رسمي
  const handleExportCoursesPDF = async () => {
    const hasSelected = selectedCourseIds.length > 0;
    const rawCoursesToExport = hasSelected
      ? deptCourses.filter((c) => selectedCourseIds.includes(c.id))
      : filteredCourses.length > 0
        ? filteredCourses
        : deptCourses;

    if (rawCoursesToExport.length === 0) {
      setErrorMessage('لا توجد مواد دراسية في القسم لتصديرها حالياً.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    try {
      setIsExportingCoursesPDF(true);

      const formattedItems: DepartmentCoursePDFItem[] = rawCoursesToExport.map((c) => {
        const matchedTheoryTeacher = c.theory_teacher_id
          ? deptTeachers.find((t) => t.id === c.theory_teacher_id)
          : undefined;
        const theoryTeacherName = c.theory_teacher_name || (matchedTheoryTeacher ? matchedTheoryTeacher.full_name : undefined);

        const matchedPracticalTeacher = c.practical_teacher_id
          ? deptTeachers.find((t) => t.id === c.practical_teacher_id)
          : undefined;
        const practicalTeacherName = c.practical_teacher_name || (matchedPracticalTeacher ? matchedPracticalTeacher.full_name : undefined);

        const isCoursePractical = c.course_type === 'theory_and_practical' || c.has_practical === true;

        return {
          id: c.id,
          name: c.name,
          code: c.code,
          stage: c.stage_number || 1,
          semester: c.semester || 1,
          course_type: c.course_type || (isCoursePractical ? 'theory_and_practical' : 'theory_only'),
          credits: c.credit_hours || 5,
          theory_hours: 2,
          practical_hours: isCoursePractical ? 2 : 0,
          theory_teacher_name: theoryTeacherName,
          practical_teacher_name: practicalTeacherName,
          is_final_exam_enabled: c.is_final_exam_enabled,
          is_supplementary_exam_enabled: c.is_supplementary_exam_enabled,
        };
      });

      const collegeName = 'كلية تكنولوجيا المعلومات';
      const headName = currentHead?.full_name || 'رئاسة القسم العلمي';
      const rappName = currentRap?.full_name || 'مقررية القسم العلمي';

      await exportDepartmentCoursesPDF({
        departmentName: deptName,
        collegeName: collegeName,
        academicYear: getAcademicYear(),
        departmentHeadName: headName,
        rapporteurName: rappName,
        stageFilter: filterCourseStage,
        semesterFilter: filterCourseSemester,
        isSelectiveExport: hasSelected,
        courses: formattedItems,
      });

      setSuccessMessage(`تم بنجاح تصدير كشف (${rawCoursesToExport.length}) مادة إلى ملف PDF رسمي معتمد! 🖨️✨`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('فشل تصدير كشف المواد كـ PDF:', err);
      setErrorMessage('حدث خطأ أثناء تصدير كشف المواد إلى PDF. يرجى المحاولة ثانية.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsExportingCoursesPDF(false);
    }
  };

  // 📤 استيراد ومعالجة ملف Excel للمواد
  const handleCourseExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentDeptId) return;

    try {
      setIsImportingCourseExcel(true);
      const rows: Record<string, string | number>[] = await parseExcelFile(file);

      const accepted: { name: string; dept: string; email: string }[] = [];
      const duplicates: { name: string; email: string; dept: string; reason: string }[] = [];
      const rejected: { rowNumber: number; rawName: string; reason: string }[] = [];

      const newCoursesToAdd: Course[] = [];
      const newTeacherCoursesToAdd: TeacherCourse[] = [];
      let tempAllCourses = [...courses];

      rows.forEach((row: Record<string, string | number>, index: number) => {
        const rowNum = index + 2;
        const rawCode = String(row['code'] || row['رمز المادة'] || row['كود المادة'] || '').trim();
        const rawName = String(row['name'] || row['اسم المادة الدراسية'] || row['اسم المادة'] || row['المادة'] || '').trim();
        const rawStage = Number(row['stage'] || row['المرحلة الدراسية (1-4)'] || row['المرحلة'] || 1);
        const rawSemester = Number(row['semester'] || row['الفصل الدراسي (1 أو 2)'] || row['الفصل'] || 1);
        const rawType = String(row['type'] || row['نوع المادة (نظري فقط / نظري وعملي)'] || row['النوع'] || '').trim();
        const rawCredits = Number(row['credits'] || row['عدد الساعات المعتمدة / الوحدات'] || row['الوحدات'] || 3);
        const rawTheoryTeacher = String(row['theory_teacher'] || row['أستاذ النظري المعتمد'] || row['أستاذ النظري'] || '').trim();
        const rawPracticalTeacher = String(row['practical_teacher'] || row['أستاذ العملي المعتمد'] || row['أستاذ العملي'] || '').trim();
        const rawFinalStatus = String(row['is_final'] || row['الامتحان النهائي (مفعل / مغلق)'] || row['الامتحان النهائي'] || '').trim();
        const rawSupStatus = String(row['is_sup'] || row['الدور الثاني (مفعل / مغلق)'] || row['الدور الثاني'] || '').trim();

        if (!rawName || rawName.length < 3) {
          rejected.push({
            rowNumber: rowNum,
            rawName: rawName || 'اسم فارغ',
            reason: 'حقل اسم المادة فارغ أو غير مكتمل',
          });
          return;
        }

        const isDuplicate = tempAllCourses.some(
          (c) =>
            c.department_id === currentDeptId &&
            (c.name.trim().toLowerCase() === rawName.toLowerCase() || (rawCode && c.code.trim().toLowerCase() === rawCode.toLowerCase()))
        );

        if (isDuplicate) {
          duplicates.push({
            name: rawName,
            email: rawCode || '—',
            dept: deptName,
            reason: 'المادة مسجلة مسبقاً بنفس الاسم أو الكود في هذا القسم',
          });
          return;
        }

        const isTheoryOnly = rawType.includes('فقط') || rawType === 'theory_only' || (!rawType.includes('عملي') && rawType !== 'theory_and_practical');
        const courseTypeFinal: CourseType = isTheoryOnly ? 'theory_only' : 'theory_and_practical';

        const stageNum = Math.min(4, Math.max(1, isNaN(rawStage) ? 1 : rawStage));
        const semesterNum: 1 | 2 = rawSemester === 2 ? 2 : 1;
        const creditsNum = isNaN(rawCredits) || rawCredits <= 0 ? 3 : rawCredits;
        const finalCode = rawCode || `CRS-${Math.floor(100 + Math.random() * 900)}`;

        const matchedTheoryTeacher = rawTheoryTeacher
          ? deptTeachers.find((t) => t.full_name.trim().toLowerCase() === rawTheoryTeacher.toLowerCase())
          : undefined;
        const matchedPracticalTeacher = (!isTheoryOnly && rawPracticalTeacher)
          ? deptTeachers.find((t) => t.full_name.trim().toLowerCase() === rawPracticalTeacher.toLowerCase())
          : undefined;

        const isFinalEnabled = rawFinalStatus.includes('مفعل') || rawFinalStatus.toLowerCase() === 'true';
        const isSupEnabled = rawSupStatus.includes('مفعل') || rawSupStatus.toLowerCase() === 'true';

        const newCourseId = `crs-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const newC: Course = {
          id: newCourseId,
          code: finalCode,
          name: rawName,
          department_id: currentDeptId,
          department_name: deptName,
          stage_id: `stage-${currentDeptId}-${stageNum}`,
          stage_number: stageNum,
          academic_year_id: 'year-2026',
          semester: semesterNum,
          course_type: courseTypeFinal,
          credit_hours: creditsNum,
          has_practical: !isTheoryOnly,
          theory_teacher_id: matchedTheoryTeacher ? matchedTheoryTeacher.id : undefined,
          theory_teacher_name: matchedTheoryTeacher ? matchedTheoryTeacher.full_name : undefined,
          practical_teacher_id: matchedPracticalTeacher ? matchedPracticalTeacher.id : undefined,
          practical_teacher_name: matchedPracticalTeacher ? matchedPracticalTeacher.full_name : undefined,
          assessment_scheme: getDefaultAssessmentScheme(courseTypeFinal),
          is_final_exam_enabled: isFinalEnabled,
          is_supplementary_exam_enabled: isSupEnabled,
          created_at: new Date().toISOString(),
          order_index: newCoursesToAdd.length,
        };

        if (matchedTheoryTeacher) {
          const tcTheory: TeacherCourse = {
            id: `tc-th-${newCourseId}-${matchedTheoryTeacher.id}`,
            teacher_id: matchedTheoryTeacher.id,
            teacher_name: matchedTheoryTeacher.full_name,
            course_id: newCourseId,
            course_name: rawName,
            department_id: currentDeptId,
            role_in_course: (!isTheoryOnly && matchedPracticalTeacher?.id === matchedTheoryTeacher.id) ? 'both' : 'theory',
            semester: semesterNum,
            created_at: new Date().toISOString(),
          };
          newTeacherCoursesToAdd.push(tcTheory);
        }

        if (!isTheoryOnly && matchedPracticalTeacher && matchedPracticalTeacher.id !== matchedTheoryTeacher?.id) {
          const tcPractical: TeacherCourse = {
            id: `tc-pr-${newCourseId}-${matchedPracticalTeacher.id}`,
            teacher_id: matchedPracticalTeacher.id,
            teacher_name: matchedPracticalTeacher.full_name,
            course_id: newCourseId,
            course_name: rawName,
            department_id: currentDeptId,
            role_in_course: 'practical',
            semester: semesterNum,
            created_at: new Date().toISOString(),
          };
          newTeacherCoursesToAdd.push(tcPractical);
        }

        newCoursesToAdd.push(newC);
        tempAllCourses.push(newC);
        accepted.push({
          name: rawName,
          dept: `المرحلة ${stageNum} (الكورس ${semesterNum === 1 ? 'الأول' : 'الثاني'}) - ${creditsNum} ECTS`,
          email: finalCode,
        });
      });

      if (newCoursesToAdd.length > 0) {
        const mergedCourses = [...newCoursesToAdd, ...courses.map((c, idx) => ({ ...c, order_index: idx + newCoursesToAdd.length }))];
        setCourses(mergedCourses);
        saveStoredData('courses', mergedCourses);
        newCoursesToAdd.forEach((c) => {
          saveCourseToSupabase(c);
        });

        if (newTeacherCoursesToAdd.length > 0) {
          const updatedTCs = [...newTeacherCoursesToAdd, ...teacherCourses];
          setTeacherCourses(updatedTCs);
          saveStoredData('teacher_courses', updatedTCs);
          newTeacherCoursesToAdd.forEach((tc) => {
            saveTeacherCourseToSupabase(tc);
          });
        }
      }

      setCourseImportReport({
        totalRows: rows.length,
        accepted,
        duplicates,
        rejected,
      });
      setCourseActiveReportTab('accepted');

      setSuccessMessage(`تمت معالجة ملف المواد وإضافة ${accepted.length} مادة دراسية بنجاح!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch {
      setErrorMessage('حدث خطأ أثناء قراءة ملف Excel، يرجى التأكد من مطابقة نموذج المواد المعتمد.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsImportingCourseExcel(false);
      if (e.target) e.target.value = '';
    }
  };

  // 💾 حفظ أو تعديل مادة دراسية
  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim() || !courseCode.trim() || !currentDeptId) {
      setErrorMessage('يرجى ملء جميع الحقول الإلزامية للمادة (الاسم والرمز والقسم)');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    if (!courseStage) {
      setErrorMessage('يرجى تحديد المرحلة الدراسية للمادة');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    if (!courseSemester) {
      setErrorMessage('يرجى تحديد الفصل الدراسي (الكورس الأول أو الثاني)');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    if (!courseType) {
      setErrorMessage('يرجى تحديد نوع المادة (نظري فقط أو نظري وعملي)');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    if (!courseCredits || courseCredits <= 0) {
      setErrorMessage('يرجى تحديد عدد الساعات المعتمدة (الوحدات)');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    const theoryTeacher = deptTeachers.find((t) => t.id === courseTheoryTeacherId);
    const practicalTeacher = courseType === 'theory_and_practical'
      ? deptTeachers.find((t) => t.id === coursePracticalTeacherId)
      : undefined;

    let targetCourseId = editingCourseId;

    if (editingCourseId) {
      let editedCourseObj: Course | null = null;
      const updated = courses.map((c) => {
        if (c.id === editingCourseId) {
          const edited: Course = {
            ...c,
            name: courseName.trim(),
            code: courseCode.trim().toUpperCase(),
            stage_number: courseStage,
            stage_id: `stage-${currentDeptId}-${courseStage}`,
            semester: courseSemester,
            course_type: courseType,
            credit_hours: courseCredits,
            has_practical: courseType === 'theory_and_practical',
            theory_teacher_id: theoryTeacher ? theoryTeacher.id : undefined,
            theory_teacher_name: theoryTeacher ? theoryTeacher.full_name : undefined,
            practical_teacher_id: practicalTeacher ? practicalTeacher.id : undefined,
            practical_teacher_name: practicalTeacher ? practicalTeacher.full_name : undefined,
            is_final_exam_enabled: courseIsFinalExamEnabled,
            is_supplementary_exam_enabled: courseIsSupplementaryEnabled,
          };
          editedCourseObj = edited;
          return edited;
        }
        return c;
      });
      setCourses(updated);
      saveStoredData('courses', updated);
      if (editedCourseObj) {
        saveCourseToSupabase(editedCourseObj);
      }
      setEditingCourseId(null);
      setSuccessMessage('تم تعديل بيانات المادة الدراسية وتحديث تكليفاتها بنجاح!');
    } else {
      const newId = `crs-${Date.now()}`;
      targetCourseId = newId;

      const newCourse: Course = {
        id: newId,
        code: courseCode.trim().toUpperCase(),
        name: courseName.trim(),
        department_id: currentDeptId,
        department_name: deptName,
        stage_id: `stage-${currentDeptId}-${courseStage}`,
        stage_number: courseStage,
        academic_year_id: 'year-2026',
        semester: courseSemester,
        course_type: courseType,
        credit_hours: courseCredits,
        has_practical: courseType === 'theory_and_practical',
        theory_teacher_id: theoryTeacher ? theoryTeacher.id : undefined,
        theory_teacher_name: theoryTeacher ? theoryTeacher.full_name : undefined,
        practical_teacher_id: practicalTeacher ? practicalTeacher.id : undefined,
        practical_teacher_name: practicalTeacher ? practicalTeacher.full_name : undefined,
        assessment_scheme: getDefaultAssessmentScheme(courseType),
        is_supplementary_exam_enabled: courseIsSupplementaryEnabled,
        is_final_exam_enabled: courseIsFinalExamEnabled,
        final_exam_opened_at: courseIsFinalExamEnabled ? new Date().toISOString() : undefined,
        final_exam_opened_by: courseIsFinalExamEnabled ? 'رئاسة القسم والمقرر' : undefined,
        created_at: new Date().toISOString(),
        order_index: 0,
      };

      const updated = [newCourse, ...courses.map((c, idx) => ({ ...c, order_index: idx + 1 }))];
      setCourses(updated);
      saveStoredData('courses', updated);
      saveCourseToSupabase(newCourse);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('courses_updated'));
      }
      setSuccessMessage('تمت إضافة المادة الدراسية في بداية قائمة القسم وتوثيقها سحابياً بنجاح!');
    }

    if (targetCourseId) {
      const otherCourseTCs = teacherCourses.filter((tc: TeacherCourse): boolean => tc.course_id !== targetCourseId);
      const thisCourseTCs = teacherCourses.filter((tc: TeacherCourse): boolean => tc.course_id === targetCourseId);
      const updatedThisCourseMap = new Map<string, TeacherCourse>();

      thisCourseTCs.forEach((tc: TeacherCourse) => {
        updatedThisCourseMap.set(tc.teacher_id, tc);
      });

      if (theoryTeacher) {
        const existingTh = updatedThisCourseMap.get(theoryTeacher.id);
        const role: 'theory' | 'both' = (practicalTeacher && practicalTeacher.id === theoryTeacher.id) ? 'both' : (existingTh?.role_in_course === 'practical' ? 'both' : 'theory');
        const thRecord: TeacherCourse = {
          id: existingTh ? existingTh.id : `tc-th-${targetCourseId}-${theoryTeacher.id}`,
          teacher_id: theoryTeacher.id,
          teacher_name: theoryTeacher.full_name,
          course_id: targetCourseId,
          course_name: courseName.trim(),
          department_id: currentDeptId,
          role_in_course: role,
          semester: courseSemester,
          created_at: new Date().toISOString(),
        };
        updatedThisCourseMap.set(theoryTeacher.id, thRecord);
        saveTeacherCourseToSupabase(thRecord);
      }

      if (practicalTeacher && practicalTeacher.id !== theoryTeacher?.id) {
        const existingPr = updatedThisCourseMap.get(practicalTeacher.id);
        const prRecord: TeacherCourse = {
          id: existingPr ? existingPr.id : `tc-pr-${targetCourseId}-${practicalTeacher.id}`,
          teacher_id: practicalTeacher.id,
          teacher_name: practicalTeacher.full_name,
          course_id: targetCourseId,
          course_name: courseName.trim(),
          department_id: currentDeptId,
          role_in_course: 'practical',
          semester: courseSemester,
          created_at: new Date().toISOString(),
        };
        updatedThisCourseMap.set(practicalTeacher.id, prRecord);
        saveTeacherCourseToSupabase(prRecord);
      }

      const mergedTCs = [...otherCourseTCs, ...Array.from(updatedThisCourseMap.values())];
      setTeacherCourses(mergedTCs);
      saveStoredData('teacher_courses', mergedTCs);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('courses_updated'));
      window.dispatchEvent(new Event('teacher_courses_updated'));
    }

    setCourseName('');
    setCourseCode('');
    setCourseCredits(null);
    setCourseStage(null);
    setCourseSemester(null);
    setCourseType(null);
    setCourseTheoryTeacherId('');
    setCoursePracticalTeacherId('');
    setCourseIsSupplementaryEnabled(false);
    setCourseIsFinalExamEnabled(false);
    setEditingCourseId(null);
    setIsCourseModalOpen(false);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // 🗑️ حذف مادة دراسية مفردة
  const handleDeleteCourse = (id: string) => {
    const targetCourse = courses.find((c) => c.id === id);
    setDeleteModalConfig({
      isOpen: true,
      title: 'تأكيد حذف المادة الدراسية',
      itemName: targetCourse?.name || 'مادة دراسية',
      itemDetails: `الرمز: ${targetCourse?.code || '—'} | المرحلة ${targetCourse?.stage_number || 1} - قسم ${deptName}`,
      warningMessage: 'هل أنت متأكد من حذف هذه المادة؟ سيتم حذف المادة وإلغاء كافة تكليفات التدريسيين بها فوراً.',
      confirmText: 'تأكيد الحذف',
      onConfirm: () => {
        const updated = courses.filter((c: Course): boolean => c.id !== id);
        setCourses(updated);
        saveStoredData('courses', updated);
        deleteCourseFromSupabase(id);

        const tcsToDelete = teacherCourses.filter((tc: TeacherCourse): boolean => tc.course_id === id);
        tcsToDelete.forEach((tc: TeacherCourse) => {
          deleteTeacherCourseFromSupabase(tc.id);
        });
        const updatedTCs = teacherCourses.filter((tc: TeacherCourse): boolean => tc.course_id !== id);
        setTeacherCourses(updatedTCs);
        saveStoredData('teacher_courses', updatedTCs);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('courses_updated'));
          window.dispatchEvent(new Event('teacher_courses_updated'));
        }

        setSuccessMessage('تم حذف المادة الدراسية وإلغاء تكليفاتها بنجاح.');
        setTimeout(() => setSuccessMessage(''), 3000);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 🗑️ حذف جماعي للمواد المحددة
  const handleBulkDeleteCourses = () => {
    if (selectedCourseIds.length === 0) return;
    setDeleteModalConfig({
      isOpen: true,
      title: 'حذف المواد المحددة دفعة واحدة',
      itemName: `${selectedCourseIds.length} مادة دراسية`,
      itemDetails: 'سيتم حذف كافة المواد المحددة من قاعدة بيانات القسم وإلغاء أي تكليفات أو جداول مرتبطة بها.',
      warningMessage: '⚠️ تحذير: هذا الإجراء سيؤدي لحذف المواد وسجلات الدرجات المقترنة بها نهائياً!',
      confirmText: `تأكيد حذف (${selectedCourseIds.length}) مادة`,
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        selectedCourseIds.forEach((id) => {
          deleteCourseFromSupabase(id);
        });

        const tcsToDelete = teacherCourses.filter((tc: TeacherCourse): boolean => selectedCourseIds.includes(tc.course_id));
        tcsToDelete.forEach((tc: TeacherCourse) => {
          deleteTeacherCourseFromSupabase(tc.id);
        });
        const remainingAssignments = teacherCourses.filter((tc: TeacherCourse): boolean => !selectedCourseIds.includes(tc.course_id));
        setTeacherCourses(remainingAssignments);
        saveStoredData('teacher_courses', remainingAssignments);

        const remainingCourses = courses.filter((c: Course): boolean => !selectedCourseIds.includes(c.id));
        setCourses(remainingCourses);
        saveStoredData('courses', remainingCourses);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('courses_updated'));
          window.dispatchEvent(new Event('teacher_courses_updated'));
          window.dispatchEvent(new Event('storage'));
        }

        setSelectedCourseIds([]);
        setSuccessMessage(`تم بنجاح حذف (${selectedCourseIds.length}) مادة من القسم وتكليفاتها`);
        setTimeout(() => setSuccessMessage(''), 4000);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 📊 تصدير كشف المواد إلى ملف Excel
  const handleExportCoursesExcel = async () => {
    try {
      setIsExportingCoursesExcel(true);
      const targetCourses = selectedCourseIds.length > 0
        ? deptCourses.filter((c: Course): boolean => selectedCourseIds.includes(c.id))
        : (filteredCourses.length > 0 ? filteredCourses : deptCourses);

      if (targetCourses.length === 0) {
        setErrorMessage('لا توجد مواد دراسية في القسم للتصدير حالياً.');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      const formattedCourses = targetCourses.map((c: Course) => {
        const matchedTheoryTeacher = c.theory_teacher_id
          ? deptTeachers.find((t: UserProfile): boolean => t.id === c.theory_teacher_id)
          : undefined;
        const theoryTeacherName = c.theory_teacher_name || matchedTheoryTeacher?.full_name;

        const matchedPracticalTeacher = c.practical_teacher_id
          ? deptTeachers.find((t: UserProfile): boolean => t.id === c.practical_teacher_id)
          : undefined;
        const practicalTeacherName = c.practical_teacher_name || matchedPracticalTeacher?.full_name;

        return {
          code: c.code,
          name: c.name,
          department_name: deptName,
          stage_number: c.stage_number || 1,
          semester: c.semester || 1,
          course_type: c.course_type,
          theory_teacher_name: theoryTeacherName,
          practical_teacher_name: practicalTeacherName,
          credit_hours: c.credit_hours || 3,
        };
      });

      await exportCustomCoursesList(formattedCourses, deptName);
      setSuccessMessage(`تم بنجاح تصدير كشف (${formattedCourses.length}) مادة دراسية إلى ملف Excel! 📊`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      console.error('خطأ في تصدير المواد الدراسية:', error);
      setErrorMessage('حدث خطأ أثناء تصدير ملف إكسل المواد.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsExportingCoursesExcel(false);
    }
  };

  // 🔒 طلب تأكيد فتح أو قفل الدور الأكاديمي لمادة أو مجموعة مواد
  const requestToggleRoundAction = ({
    round,
    enable,
    targetSemester,
    courseId,
    courseIds,
    courseName,
  }: {
    round: 'final' | 'supplementary';
    enable: boolean;
    targetSemester?: 1 | 2 | 'all';
    courseId?: string;
    courseIds?: string[];
    courseName?: string;
  }) => {
    let affectedCourses: Course[] = [];
    if (courseIds && courseIds.length > 0) {
      affectedCourses = deptCourses.filter((c) => courseIds.includes(c.id));
    } else if (courseId) {
      affectedCourses = deptCourses.filter((c) => c.id === courseId);
    } else {
      affectedCourses = deptCourses.filter((c) => {
        const matchesStage = filterCourseStage === 'all' || (Number(c.stage_number) || 1) === Number(filterCourseStage);
        const matchesSemester = targetSemester === 'all' || !targetSemester || (Number(c.semester) || 1) === Number(targetSemester);
        return matchesStage && matchesSemester;
      });
    }

    const targetToModifyCourses = affectedCourses.filter((c) => {
      const isCurrentlyOpen = round === 'final' ? c.is_final_exam_enabled === true : c.is_supplementary_exam_enabled === true;
      return enable ? !isCurrentlyOpen : isCurrentlyOpen;
    });

    const alreadyOppositeCount = affectedCourses.length - targetToModifyCourses.length;

    if (targetToModifyCourses.length === 0) {
      const stateWord = enable ? 'مفتوح ومفعّل' : 'مغلق ومحجوب';
      const roundTitle = round === 'final' ? 'الامتحان النهائي (الدور الأول)' : 'امتحان الدور الثاني';
      setErrorMessage(`كافة المواد المستهدفة (${affectedCourses.length}) حالة ${roundTitle} فيها ${stateWord} بالفعل 100%! لا حاجة لتعديلها.`);
      setTimeout(() => setErrorMessage(''), 4500);
      return;
    }

    const roundName = round === 'final' ? 'الامتحان النهائي (الدور الأول)' : 'امتحان الدور الثاني';
    const actionName = enable ? 'فتح وتفعيل' : 'إغلاق وحجب';
    const semesterLabel = (courseIds && courseIds.length > 0)
      ? `للمواد المحددة (${targetToModifyCourses.length})`
      : courseId
        ? `لمادة (${courseName || 'المحددة'})`
        : targetSemester === 1
          ? 'لمواد الكورس الأول'
          : targetSemester === 2
            ? 'لمواد الكورس الثاني'
            : 'لكافة مواد الكورسين';
    const stageLabel = (courseId || (courseIds && courseIds.length > 0)) ? '' : filterCourseStage === 'all' ? 'في كافة مراحل القسم' : `في المرحلة ${getStageNameInArabic(Number(filterCourseStage))}`;

    let titleText = `تأكيد ${actionName} ${roundName}`;
    let descriptionText = '';

    if (alreadyOppositeCount > 0 && affectedCourses.length > 1) {
      if (!enable) {
        titleText = `تأكيد إغلاق ${roundName} للمواد المفتوحة فقط (${targetToModifyCourses.length})`;
        descriptionText = `أنت على وشك إغلاق وحجب ${roundName} لعدد (${targetToModifyCourses.length}) مادة مفتوحة فقط ${semesterLabel} ${stageLabel}؛ علماً أن هناك (${alreadyOppositeCount}) مادة مغلقة بالفعل ولا تحتاج إلى إغلاق.`;
      } else {
        titleText = `تأكيد فتح ${roundName} للمواد المتبقية (${targetToModifyCourses.length})`;
        descriptionText = `أنت على وشك فتح وتفعيل ${roundName} لعدد (${targetToModifyCourses.length}) مادة مغلقة متبقية فقط ${semesterLabel} ${stageLabel}؛ حيث أن هناك (${alreadyOppositeCount}) مواد مفتوحة ومفعّلة بالفعل.`;
      }
    } else {
      descriptionText = enable
        ? `أنت على وشك ${actionName} ${roundName} ${semesterLabel} ${stageLabel} لعدد (${targetToModifyCourses.length}) مادة. سيتمكن التدريسيون فوراً من رصد الدرجات وستظهر للطلبة.`
        : `أنت على وشك ${actionName} ${roundName} ${semesterLabel} ${stageLabel} لعدد (${targetToModifyCourses.length}) مادة. سيتم إيقاف الرصد وحجب الدرجات واقتصار العرض على السعي التكويني.`;
    }

    setRoundConfirmModal({
      isOpen: true,
      round,
      enable,
      targetSemester: targetSemester || 'all',
      targetStage: filterCourseStage,
      targetCourseId: courseId,
      targetCourseName: courseName,
      targetCourseIds: targetToModifyCourses.map((c) => c.id),
      affectedCount: targetToModifyCourses.length,
      title: titleText,
      description: descriptionText,
    });
  };

  // ⚡ تنفيذ عملية الفتح أو القفل بعد تأكيد وموافقة المستخدم الرسمية
  const executeConfirmToggleRoundAction = () => {
    if (!roundConfirmModal) return;
    const { round, enable, targetSemester, targetStage, targetCourseId, targetCourseIds } = roundConfirmModal;
    const nowIso = new Date().toISOString();
    const actorName = 'رئاسة القسم والمقرر';

    let targetIds = new Set<string>();
    if (targetCourseIds && targetCourseIds.length > 0) {
      targetIds = new Set(targetCourseIds);
    } else if (targetCourseId) {
      targetIds.add(targetCourseId);
    } else {
      const matched = deptCourses.filter((c) => {
        const matchesStage = targetStage === 'all' || (Number(c.stage_number) || 1) === Number(targetStage);
        const matchesSemester = targetSemester === 'all' || (Number(c.semester) || 1) === Number(targetSemester);
        return matchesStage && matchesSemester;
      });
      targetIds = new Set(matched.map((c) => c.id));
    }

    const updatedCourses = courses.map((c) => {
      if (targetIds.has(c.id)) {
        let edited: Course;
        if (round === 'final') {
          edited = {
            ...c,
            is_final_exam_enabled: enable,
            final_exam_opened_at: enable ? nowIso : undefined,
            final_exam_opened_by: enable ? actorName : undefined,
          };
        } else {
          edited = {
            ...c,
            is_supplementary_exam_enabled: enable,
            supplementary_exam_opened_at: enable ? nowIso : undefined,
            supplementary_exam_opened_by: enable ? actorName : undefined,
          };
        }
        saveCourseToSupabase(edited);
        return edited;
      }
      return c;
    });

    setCourses(updatedCourses);
    saveStoredData('courses', updatedCourses);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('courses_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    const roundName = round === 'final' ? 'الامتحان النهائي (الدور الأول)' : 'امتحان الدور الثاني';
    const actionName = enable ? 'فتح وتفعيل' : 'إغلاق وحجب';
    setSuccessMessage(`تم بنجاح ${actionName} ${roundName} لعدد (${targetIds.size}) مادة دراسية! ✨`);
    setTimeout(() => setSuccessMessage(''), 4500);
    setRoundConfirmModal(null);
  };

  // 🔒 تبديل حالة الفاينل لمادة مفردة
  const handleToggleCourseFinalExam = (targetCourse: Course) => {
    const isFinalActive = targetCourse.is_final_exam_enabled === true;
    requestToggleRoundAction({
      round: 'final',
      enable: !isFinalActive,
      courseId: targetCourse.id,
      courseName: targetCourse.name,
    });
  };

  // 🔄 تبديل حالة الدور الثاني لمادة مفردة
  const handleToggleCourseSupplementaryExam = (targetCourse: Course) => {
    const isSupActive = targetCourse.is_supplementary_exam_enabled === true;
    requestToggleRoundAction({
      round: 'supplementary',
      enable: !isSupActive,
      courseId: targetCourse.id,
      courseName: targetCourse.name,
    });
  };

  // 🌟 الفتح أو الإغلاق الجماعي للدور الأول
  const handleBulkToggleFinalExam = (enable: boolean) => {
    requestToggleRoundAction({
      round: 'final',
      enable,
      courseIds: selectedCourseIds.length > 0 ? selectedCourseIds : undefined,
    });
  };

  // 🌟 الفتح أو الإغلاق الجماعي للدور الثاني
  const handleBulkToggleSupplementaryExam = (enable: boolean) => {
    requestToggleRoundAction({
      round: 'supplementary',
      enable,
      courseIds: selectedCourseIds.length > 0 ? selectedCourseIds : undefined,
    });
  };

  return {
    // 📖 حالات المادة
    courseName,
    setCourseName,
    courseCode,
    setCourseCode,
    courseCredits,
    setCourseCredits,
    courseStage,
    setCourseStage,
    courseSemester,
    setCourseSemester,
    courseType,
    setCourseType,
    courseTheoryTeacherId,
    setCourseTheoryTeacherId,
    coursePracticalTeacherId,
    setCoursePracticalTeacherId,
    editingCourseId,
    setEditingCourseId,
    courseIsSupplementaryEnabled,
    setCourseIsSupplementaryEnabled,
    courseIsFinalExamEnabled,
    setCourseIsFinalExamEnabled,
    isCourseModalOpen,
    setIsCourseModalOpen,

    // 🔍 الفلاتر والبحث والتحديد
    courseSearch,
    setCourseSearch,
    filterCourseStage,
    setFilterCourseStage,
    filterCourseSemester,
    setFilterCourseSemester,
    filterCourseType,
    setFilterCourseType,
    selectedCourseIds,
    setSelectedCourseIds,
    coursePage,
    setCoursePage,
    coursePageSize,
    setCoursePageSize,

    // 📊 الإكسل والـ PDF
    showCourseExcelInstructions,
    setShowCourseExcelInstructions,
    isImportingCourseExcel,
    setIsImportingCourseExcel,
    isExportingCoursesPDF,
    setIsExportingCoursesPDF,
    courseImportReport,
    setCourseImportReport,
    courseActiveReportTab,
    setCourseActiveReportTab,
    isExportingCoursesExcel,
    setIsExportingCoursesExcel,

    // 🎛️ التقييم والأدوار
    isAssessmentModalOpen,
    setIsAssessmentModalOpen,
    selectedCourseForAssessment,
    setSelectedCourseForAssessment,
    tempAssessmentScheme,
    setTempAssessmentScheme,
    roundConfirmModal,
    setRoundConfirmModal,
    examToggleConfirmation,
    setExamToggleConfirmation,
    quickAssignConfig,
    setQuickAssignConfig,

    // 🔽 القوائم المنسدلة الذكية
    isCourseTheoryDropdownOpen,
    setIsCourseTheoryDropdownOpen,
    isCoursePracticalDropdownOpen,
    setIsCoursePracticalDropdownOpen,
    theoryTeacherCoords,
    setTheoryTeacherCoords,
    practicalTeacherCoords,
    setPracticalTeacherCoords,
    theoryTeacherBtnRef,
    practicalTeacherBtnRef,
    handleToggleCourseTheoryDropdown,
    handleToggleCoursePracticalDropdown,

    // 📋 القوائم المصفاة والإحصاءات
    deptCourses,
    filteredCourses,
    targetRoundCourses,
    activeTargetRoundCourses,
    deptSem1CourseIds,
    deptSem2CourseIds,
    finalOpenCount,
    isBulkFinalOpen,
    isBulkFinalPartial,
    supOpenCount,
    isBulkSupOpen,
    isBulkSupPartial,

    // ⚡ دوال المعالجة
    handleConfirmExamToggle,
    getCourseTheoryTeachers,
    getCoursePracticalTeachers,
    handleOpenQuickAssign,
    handleSaveQuickAssign,
    handleOpenAssessmentModal,
    handleSaveAssessmentSchemeModal,
    handleDownloadCourseTemplate,
    handleExportCoursesPDF,
    handleCourseExcelUpload,
    handleSaveCourse,
    handleDeleteCourse,
    handleBulkDeleteCourses,
    handleExportCoursesExcel,
    requestToggleRoundAction,
    executeConfirmToggleRoundAction,
    handleToggleCourseFinalExam,
    handleToggleCourseSupplementaryExam,
    handleBulkToggleFinalExam,
    handleBulkToggleSupplementaryExam,
  };
};
