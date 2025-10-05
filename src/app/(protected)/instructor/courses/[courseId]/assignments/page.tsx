'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAssignmentsByCourse } from '@/features/assignments/hooks/useAssignmentsByCourse';

export default function InstructorAssignmentsPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  return <InstructorAssignmentsList courseId={courseId} />;
}

function InstructorAssignmentsList({ courseId }: { courseId: string }) {
  const { data, isLoading, error } = useAssignmentsByCourse(courseId);

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
        <p className="text-slate-500">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
        <p className="text-red-500">
          과제 목록을 불러오는 중 오류가 발생했습니다: {error.message}
        </p>
      </div>
    );
  }

  const assignments = data || [];
  const draftAssignments = assignments.filter((a) => a.status === 'draft');
  const publishedAssignments = assignments.filter((a) => a.status === 'published');

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">과제 관리</h1>
        <p className="text-slate-500">코스의 과제를 관리하세요.</p>
      </header>

      {/* Draft Assignments */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">초안 ({draftAssignments.length})</h2>
        {draftAssignments.length === 0 ? (
          <p className="text-slate-500">초안 상태의 과제가 없습니다.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {draftAssignments.map((assignment) => (
              <Link
                key={assignment.id}
                href={`/instructor/courses/${courseId}/assignments/${assignment.id}`}
              >
                <article className="rounded-lg border border-slate-200 p-6 space-y-2 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{assignment.title}</h3>
                    <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">
                      초안
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {assignment.content_text || '설명이 없습니다.'}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Published Assignments */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">게시됨 ({publishedAssignments.length})</h2>
        {publishedAssignments.length === 0 ? (
          <p className="text-slate-500">게시된 과제가 없습니다.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {publishedAssignments.map((assignment) => (
              <Link
                key={assignment.id}
                href={`/instructor/courses/${courseId}/assignments/${assignment.id}`}
              >
                <article className="rounded-lg border border-slate-200 p-6 space-y-2 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{assignment.title}</h3>
                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                      게시됨
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {assignment.content_text || '설명이 없습니다.'}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
