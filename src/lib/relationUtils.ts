import type { Course, Instructor, Room } from "@/types";

export function findCourse(courseId: string, courses: Course[]): Course | null {
  return courses.find((course) => course.course_id === courseId) || null;
}

export function findRoom(roomId: string, rooms: Room[]): Room | null {
  return rooms.find((room) => room.room_id === roomId) || null;
}

export function findInstructor(instructorId: string, instructors: Instructor[]): Instructor | null {
  return instructors.find((instructor) => instructor.instructor_id === instructorId) || null;
}

export function getCourseName(courseId: string, courses: Course[]): string {
  return findCourse(courseId, courses)?.course_name || "미확인 과정";
}

export function getRoomName(roomId: string, rooms: Room[]): string {
  return findRoom(roomId, rooms)?.room_name || "미확인 강의실";
}

export function getInstructorName(instructorId: string, instructors: Instructor[]): string {
  return findInstructor(instructorId, instructors)?.instructor_name || "미확인 강사";
}
