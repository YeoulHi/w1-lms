'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateCourseRequestSchema, type CreateCourseRequest } from '@/features/courses/lib/dto';
import { useCreateCourse } from '@/features/courses/hooks/useCreateCourse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export function CreateCourseForm() {
  const form = useForm<CreateCourseRequest>({
    resolver: zodResolver(CreateCourseRequestSchema),
    defaultValues: {
      title: '',
    },
  });

  const { mutate, isPending } = useCreateCourse(() => {
    form.reset();
  });

  const onSubmit = (data: CreateCourseRequest) => {
    mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>강의 제목</FormLabel>
              <FormControl>
                <Input
                  placeholder="강의 제목을 입력하세요"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? '생성 중...' : '생성하기'}
        </Button>
      </form>
    </Form>
  );
}
