'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

export const LearnerDashboard = () => {
  const { user } = useCurrentUser();

  // TODO: 실제 API 구현 시 교체 (최소 복잡도 원칙)
  const publishedCourses = [
    {
      id: '4d4afc25-454c-4ba6-be57-4edab32f9049',
      title: 'Next.js 15 마스터 클래스',
      description:
        'App Router, Server Actions, React Server Components를 마스터합니다.',
      status: 'published',
    },
    {
      id: 'ba742c67-4461-4499-a143-2113e459747e',
      title: 'TypeScript 심화 과정',
      description: 'Type-safe 백엔드 API 설계와 Zod 스키마 활용법을 배웁니다.',
      status: 'published',
    },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">대시보드</h1>
        <p className="text-slate-500">
          {user?.email ?? '알 수 없는 사용자'} 님, 환영합니다.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">수강 가능한 코스</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {publishedCourses.map((course) => (
            <article
              key={course.id}
              className="rounded-lg border border-slate-200 p-6 space-y-4"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{course.title}</h3>
                <p className="text-sm text-slate-600">{course.description}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/courses/${course.id}`} className="flex-1">
                  <Button className="w-full">코스 수강신청</Button>
                </Link>
                <Link href={`/courses/${course.id}/grades`} className="flex-1">
                  <Button variant="outline" className="w-full">성적 보기</Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
