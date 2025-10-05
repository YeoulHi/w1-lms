'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  submitAssignmentResponseSchema,
  type SubmitAssignmentRequest,
} from '@/features/assignments/lib/dto';
import { useToast } from '@/hooks/use-toast';

const submitAssignment = async (
  assignmentId: string,
  body: SubmitAssignmentRequest,
) => {
  try {
    const { data } = await apiClient.post(
      `/api/assignments/${assignmentId}/submissions`,
      body,
    );
    return submitAssignmentResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '과제 제출에 실패했습니다.');
    throw new Error(message);
  }
};

export const useSubmitAssignment = (
  assignmentId: string,
  onSuccessCallback?: () => void,
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: SubmitAssignmentRequest) =>
      submitAssignment(assignmentId, body),
    onSuccess: () => {
      toast({
        title: '제출 완료',
        description: '과제가 성공적으로 제출되었습니다.',
      });
      queryClient.invalidateQueries({
        queryKey: ['assignments', assignmentId],
      });
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      toast({
        title: '제출 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
