'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { CreateCourseResponseSchema, type CreateCourseRequest } from '@/features/courses/lib/dto';
import { useToast } from '@/hooks/use-toast';

const createCourse = async (body: CreateCourseRequest) => {
  try {
    const { data } = await apiClient.post('/api/courses', body);
    return CreateCourseResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '강의 생성에 실패했습니다.');
    throw new Error(message);
  }
};

export const useCreateCourse = (onSuccessCallback?: () => void) => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      toast({
        title: '성공',
        description: '강의가 성공적으로 생성되었습니다.',
      });
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      toast({
        title: '오류',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};