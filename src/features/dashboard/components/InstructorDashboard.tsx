'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useInstructorDashboard } from '@/features/dashboard/hooks/useInstructorDashboard';

export const InstructorDashboard = () => {
  const { data, isLoading, error } = useInstructorDashboard();

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
          대시보드를 불러오는 중 오류가 발생했습니다: {error.message}
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">강사 대시보드</h1>
        <p className="text-slate-500">내 코스와 제출물을 관리하세요.</p>
      </header>

      {/* Summary Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 p-6 space-y-2">
          <p className="text-sm text-slate-500">전체 코스</p>
          <p className="text-3xl font-semibold">{data.courses.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-6 space-y-2">
          <p className="text-sm text-slate-500">채점 대기 중</p>
          <p className="text-3xl font-semibold text-orange-600">
            {data.pending_grading_count}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 p-6 space-y-2">
          <p className="text-sm text-slate-500">최근 제출물</p>
          <p className="text-3xl font-semibold">
            {data.recent_submissions.length}
          </p>
        </div>
      </section>

      {/* My Courses */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">내 코스</h2>
          <Link href="/courses/new">
            <Button>새 코스 만들기</Button>
          </Link>
        </div>
        {data.courses.length === 0 ? (
          <p className="text-slate-500">
            아직 생성한 코스가 없습니다. 새 코스를 만들어보세요!
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.courses.map((course) => (
              <article
                key={course.id}
                className="rounded-lg border border-slate-200 p-6 space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{course.title}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        course.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : course.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {course.status === 'published'
                        ? '게시됨'
                        : course.status === 'draft'
                          ? '초안'
                          : '보관됨'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {course.description || '설명이 없습니다.'}
                  </p>
                </div>
                <Link href={`/courses/${course.id}`}>
                  <Button variant="outline" className="w-full">
                    코스 관리
                  </Button>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Recent Submissions */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">최근 제출물</h2>
        {data.recent_submissions.length === 0 ? (
          <p className="text-slate-500">아직 제출된 과제가 없습니다.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    학습자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    과제
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    코스
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    제출 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {data.recent_submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {submission.learner_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {submission.assignment_title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {submission.course_title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDistanceToNow(new Date(submission.submitted_at), {
                        addSuffix: true,
                        locale: ko,
                      })}
                      {submission.is_late && (
                        <span className="ml-2 text-xs text-orange-600">
                          (지각)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          submission.status === 'graded'
                            ? 'bg-green-100 text-green-700'
                            : submission.status === 'submitted'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {submission.status === 'graded'
                          ? '채점완료'
                          : submission.status === 'submitted'
                            ? '제출됨'
                            : '재제출요청'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/assignments/${submission.assignment_id}/submissions`}
                      >
                        <Button variant="ghost" size="sm">
                          보기
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
