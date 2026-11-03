import { User } from './user';

export interface ClassMember {
  id: number;
  class_id: number;
  student_id: number;
  student: User;
}

export interface SchoolClass {
  id: number;
  teacher_id: number;
  name: string;
  description: string | null;
  code: string;
  representative_id: number | null;
  students_count?: number;
  teacher?: User;
  representative?: User | null;
  members?: ClassMember[];
  created_at: string;
  updated_at: string;
}
