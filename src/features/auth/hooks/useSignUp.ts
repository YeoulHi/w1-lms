'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { SignUpResponseSchema, type SignUpBody } from '@/features/auth/lib/dto';
import { useToast } from '@/hooks/use-toast';

const signUp = async (body: SignUpBody) => {
  try {
    const { data } = await apiClient.post('/api/auth/signup', body);
    return SignUpResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to sign up.');
    throw new Error(message);
  }
};

export const useSignUp = () => {
  const router = useRouter();
  const { toast } = useToast();

  return useMutation({
    mutationFn: signUp,
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Your account has been created successfully.',
      });

      // Redirect based on role
      if (data.role === 'learner') {
        router.push('/');
      } else if (data.role === 'instructor') {
        router.push('/dashboard');
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
