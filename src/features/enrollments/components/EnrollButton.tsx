'use client';

import { Button } from '@/components/ui/button';
import { useEnrollInCourse } from '@/features/enrollments/hooks/useEnrollInCourse';

interface EnrollButtonProps {
  courseId: string;
}

export function EnrollButton({ courseId }: EnrollButtonProps) {
  const { mutate: enroll, isPending } = useEnrollInCourse();

  const handleEnroll = () => {
    enroll({ courseId });
  };

  return (
    <Button onClick={handleEnroll} disabled={isPending}>
      {isPending ? '수강신청 중...' : '수강신청'}
    </Button>
  );
}
