'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  submitAssignmentRequestSchema,
  type SubmitAssignmentRequest,
} from '@/features/assignments/lib/dto';
import { useSubmitAssignment } from '@/features/assignments/hooks/useSubmitAssignment';

interface SubmissionFormProps {
  assignmentId: string;
}

export function SubmissionForm({ assignmentId }: SubmissionFormProps) {
  const form = useForm<SubmitAssignmentRequest>({
    resolver: zodResolver(submitAssignmentRequestSchema),
    defaultValues: {
      content: '',
      link: '',
    },
  });

  const { mutate: submitAssignment, isPending } = useSubmitAssignment(
    assignmentId,
    () => form.reset(),
  );

  const onSubmit = (data: SubmitAssignmentRequest) => {
    submitAssignment(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>제출 내용</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="과제 내용을 입력하세요"
                  className="min-h-[150px]"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>참고 링크 (선택)</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? '제출 중...' : '제출하기'}
        </Button>
      </form>
    </Form>
  );
}
