type CourseOffering = {
  days: string[];
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function doTimesOverlap(
  _day: string,
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): boolean {
  const startMin1 = timeToMinutes(start1);
  const endMin1 = timeToMinutes(end1);
  const startMin2 = timeToMinutes(start2);
  const endMin2 = timeToMinutes(end2);

  return startMin1 < endMin2 && startMin2 < endMin1;
}

/**
 * Checks if a new course offering conflicts with existing course offerings
 * Returns array of conflicting course class numbers
 */
export function findTimeConflicts(
  newCourse: CourseOffering,
  existingCourses: Array<CourseOffering & { classNumber: number }>,
): number[] {
  const conflicts: number[] = [];

  for (const existingCourse of existingCourses) {
    const commonDays = newCourse.days.filter((day) =>
      existingCourse.days.includes(day),
    );

    if (commonDays.length > 0) {
      const hasOverlap = commonDays.some((day) =>
        doTimesOverlap(
          day,
          newCourse.startTime,
          newCourse.endTime,
          existingCourse.startTime,
          existingCourse.endTime,
        ),
      );

      if (hasOverlap) {
        conflicts.push(existingCourse.classNumber);
      }
    }
  }

  return conflicts;
}
