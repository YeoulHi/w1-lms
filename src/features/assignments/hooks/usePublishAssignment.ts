'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  publishAssignmentResponseSchema,
  type PublishAssignmentResponse,
} from '@/features/assignments/lib/dto';
import { useToast } from '@/hooks/use-toast';

type UsePublishAssignmentOptions = {
  onSuccess?: (response: PublishAssignmentResponse) => void;
};

const publishAssignment = async (
  assignmentId: string,
): Promise<PublishAssignmentResponse> => {
  try {
    const { data } = await apiClient.patch(
      `/api/assignments/${assignmentId}/publish`,
    );

    return publishAssignmentResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(
      error,
      '과제 게시에 실패했습니다.',
    );

    throw new Error(message);
  }
};

export const usePublishAssignment = (
  assignmentId: string,
  options?: UsePublishAssignmentOptions,
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => publishAssignment(assignmentId),
    onSuccess: (response) => {
      toast({
        title: '게시 완료',
        description: '과제가 게시되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['submissions', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['assignments', assignmentId] });
      options?.onSuccess?.(response);
    },
    onError: (error: Error) => {
      toast({
        title: '게시 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
