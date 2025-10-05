import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { useToast } from '@/hooks/use-toast';
import type { GradeSubmissionRequest, GradeSubmissionResponse } from '../lib/dto';

interface GradeSubmissionParams {
  submissionId: string;
  data: GradeSubmissionRequest;
}

export const useGradeSubmission = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ submissionId, data }: GradeSubmissionParams) => {
      const response = await apiClient.patch<{ data: GradeSubmissionResponse }>(
        `/api/submissions/${submissionId}`,
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      toast({
        title: '채점 완료',
        description: '채점이 완료되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      onSuccessCallback?.();
    },
    onError: (error) => {
      toast({
        title: '채점 실패',
        description: extractApiErrorMessage(error, '채점 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
    },
  });
};
