'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  EnrollmentResponseSchema,
  type EnrollmentRequest,
} from '@/features/enrollments/lib/dto';
import { useToast } from '@/hooks/use-toast';

const enrollInCourse = async (body: EnrollmentRequest) => {
  try {
    const { data } = await apiClient.post('/api/enrollments', body);
    return EnrollmentResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '수강신청에 실패했습니다.');
    throw new Error(message);
  }
};

export const useEnrollInCourse = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: enrollInCourse,
    onSuccess: () => {
      toast({
        title: '수강신청 완료',
        description: '수강신청이 완료되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '수강신청 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
