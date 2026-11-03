export interface AiSummary {
  id: number;
  lesson_id: number;
  lesson_file_id: number | null;
  type: 'summary' | 'explanation';
  content: string;
  created_at: string;
  updated_at: string;
}
