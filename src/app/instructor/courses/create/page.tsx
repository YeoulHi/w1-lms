'use client';

import { CreateCourseForm } from '@/features/courses/components/CreateCourseForm';

export default function CreateCoursePage() {
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">새 강의 생성</h1>
        <p className="text-muted-foreground mt-2">
          강의 제목을 입력하여 새로운 강의를 생성하세요.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <CreateCourseForm />
      </div>
    </div>
  );
}
