import { LessonFile } from './lesson-file';
import { AiSummary } from './ai-summary';
import { SchoolClass } from './class';
import { User } from './user';

export interface Lesson {
  id: number;
  class_id: number;
  teacher_id: number;
  title: string;
  description: string | null;
  teacher?: User;
  school_class?: SchoolClass;
  files?: LessonFile[];
  summary?: AiSummary | null;
  created_at: string;
  updated_at: string;
}
