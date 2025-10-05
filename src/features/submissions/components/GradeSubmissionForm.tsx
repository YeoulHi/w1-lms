'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { useGradeSubmission } from '../hooks/useGradeSubmission';
import { useRequestResubmission } from '../hooks/useRequestResubmission';

const gradeFormSchema = z.object({
  score: z.coerce
    .number()
    .min(0, '점수는 0점 이상이어야 합니다.')
    .max(100, '점수는 100점 이하여야 합니다.'),
  feedback: z.string().min(1, '피드백은 필수입니다.'),
});

type GradeFormValues = z.infer<typeof gradeFormSchema>;

interface GradeSubmissionFormProps {
  submissionId: string;
  assignmentId: string;
  onSuccess?: () => void;
}

export function GradeSubmissionForm({
  submissionId,
  assignmentId,
  onSuccess,
}: GradeSubmissionFormProps) {
  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: {
      score: 0,
      feedback: '',
    },
  });

  const { mutate: gradeSubmission, isPending: isGrading } = useGradeSubmission(
    assignmentId,
    () => {
      form.reset();
      onSuccess?.();
    },
  );

  const { mutate: requestResubmission, isPending: isRequestingResubmission } =
    useRequestResubmission(assignmentId, () => {
      form.reset();
      onSuccess?.();
    });

  const onSubmitGrade = (data: GradeFormValues) => {
    gradeSubmission({
      submissionId,
      data,
    });
  };

  const onRequestResubmission = () => {
    requestResubmission({ submissionId });
  };

  const isPending = isGrading || isRequestingResubmission;

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitGrade)} className="space-y-4">
          <FormField
            control={form.control}
            name="score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>점수 (0-100)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="점수를 입력하세요"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="feedback"
            render={({ field }) => (
              <FormItem>
                <FormLabel>피드백</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="피드백을 입력하세요"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isGrading ? '채점 중...' : '채점 완료'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onRequestResubmission}
              disabled={isPending}
            >
              {isRequestingResubmission ? '요청 중...' : '재제출 요청'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
