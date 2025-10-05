import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { useToast } from '@/hooks/use-toast';
import {
  assignmentSubmissionsResponseSchema,
  type AssignmentSubmissionsResponse,
} from '../lib/dto';

const fetchAssignmentSubmissions = async (
  assignmentId: string,
): Promise<AssignmentSubmissionsResponse> => {
  const { data } = await apiClient.get(
    `/api/assignments/${assignmentId}/submissions`,
  );

  return assignmentSubmissionsResponseSchema.parse(data);
};

export const useSubmissionsByAssignment = (assignmentId: string) => {
  const { toast } = useToast();

  const queryResult = useQuery<AssignmentSubmissionsResponse>({
    queryKey: ['submissions', assignmentId],
    queryFn: () => fetchAssignmentSubmissions(assignmentId),
    enabled: Boolean(assignmentId),
    staleTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (queryResult.error) {
      toast({
        title: '제출물 조회 실패',
        description: extractApiErrorMessage(
          queryResult.error,
          '제출물 목록을 불러오지 못했습니다.',
        ),
        variant: 'destructive',
      });
    }
  }, [queryResult.error, toast]);

  return queryResult;
};
