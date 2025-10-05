import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { useToast } from '@/hooks/use-toast';
import type { GradeSubmissionResponse } from '../lib/dto';

interface RequestResubmissionParams {
  submissionId: string;
}

export const useRequestResubmission = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ submissionId }: RequestResubmissionParams) => {
      const response = await apiClient.patch<{ data: GradeSubmissionResponse }>(
        `/api/submissions/${submissionId}/request-resubmission`,
      );
      return response.data.data;
    },
    onSuccess: () => {
      toast({
        title: '재제출 요청 완료',
        description: '재제출을 요청했습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      onSuccessCallback?.();
    },
    onError: (error) => {
      toast({
        title: '재제출 요청 실패',
        description: extractApiErrorMessage(error, '재제출 요청 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
    },
  });
};
