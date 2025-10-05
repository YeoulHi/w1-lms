import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  content_text: string | null;
  content_html: string | null;
  due_date: string | null;
  weight: number;
  late_submission_allowed: boolean;
  resubmission_allowed: boolean;
  status: 'draft' | 'published' | 'closed';
  created_at: string;
  updated_at: string;
}

export const useAssignmentsByCourse = (courseId: string) => {
  return useQuery<Assignment[]>({
    queryKey: ['assignments', 'course', courseId],
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    staleTime: 60 * 1000, // 1분
    enabled: Boolean(courseId),
  });
};
