import { User } from './user';

export interface LessonFile {
  id: number;
  lesson_id: number;
  uploaded_by: number;
  type: 'material' | 'photo';
  original_name: string;
  path?: string;
  url: string;
  mime_type: string;
  size: number;
  uploader?: User;
  created_at: string;
  updated_at: string;
}
