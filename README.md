export type RawRow = Record<string, string>;

export type Room = {
  room_id: string;
  room_name: string;
  room_type: string;
  capacity: number | null;
  floor: string;
  equipment: string;
  is_active: boolean;
  memo: string;
};

export type Instructor = {
  instructor_id: string;
  instructor_name: string;
  field: string;
  phone: string;
  email: string;
  is_active: boolean;
  memo: string;
};

export type Course = {
  course_id: string;
  course_name: string;
  category: string;
  start_date: string;
  end_date: string;
  total_hours: number | null;
  status: string;
  memo: string;
};

export type Schedule = {
  schedule_id: string;
  course_id: string;
  room_id: string;
  instructor_id: string;
  start_date: string;
  end_date: string;
  days_of_week: string;
  start_time: string;
  end_time: string;
  schedule_type: string;
  status: string;
  memo: string;
};

export type Closure = {
  closure_id: string;
  date: string;
  room_id: string;
  closure_type: string;
  start_time: string;
  end_time: string;
  memo: string;
};

export type ReviewNote = {
  id: string;
  category: string;
  target: string;
  content: string;
  status: string;
  memo: string;
  related_id: string;
};

export type SheetData = {
  rooms: Room[];
  instructors: Instructor[];
  courses: Course[];
  schedules: Schedule[];
  closures: Closure[];
  reviewNotes: ReviewNote[];
  dashboardSample: RawRow[];
};

export type ExpandedSchedule = Schedule & {
  date: string;
  dateObj: Date;
  startDateTime: Date;
  endDateTime: Date;
  needsDayReview: boolean;
};

export type JoinedSchedule = ExpandedSchedule & {
  course: Course | null;
  room: Room | null;
  instructor: Instructor | null;
  courseName: string;
  category: string;
  roomName: string;
  instructorName: string;
};

export type RoomStatusKind =
  | "in-use"
  | "available"
  | "ending-soon"
  | "no-reservation"
  | "closed"
  | "conflict";

export type RoomStatus = {
  kind: RoomStatusKind;
  label: string;
  message: string;
  currentSchedule: JoinedSchedule | null;
  nextSchedule: JoinedSchedule | null;
  remainingSchedules: JoinedSchedule[];
  closure: Closure | null;
  conflictCount: number;
  availableUntil: string | null;
  progress: number | null;
};

export type ScheduleConflict = {
  id: string;
  type: "room" | "instructor";
  date: string;
  start_time: string;
  end_time: string;
  target_id: string;
  target_name: string;
  schedules: Schedule[];
  course_names: string[];
  memo: string;
};
