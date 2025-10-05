'use client';

import { use, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { GradeSubmissionForm } from '@/features/submissions/components/GradeSubmissionForm';
import { useSubmissionsByAssignment } from '@/features/submissions/hooks/useSubmissionsByAssignment';
import type {
  AssignmentSubmissionItem,
  SubmissionStatus,
} from '@/features/submissions/lib/dto';

interface PageParams {
  courseId: string;
  assignmentId: string;
}

const statusLabelMap: Record<SubmissionStatus, string> = {
  submitted: '제출 완료',
  graded: '채점 완료',
  resubmission_required: '재제출 필요',
};

const statusVariantMap: Record<SubmissionStatus, 'default' | 'secondary' | 'destructive'> = {
  submitted: 'secondary',
  graded: 'default',
  resubmission_required: 'destructive',
};

export default function AssignmentSubmissionsPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { courseId, assignmentId } = use(params);
  void courseId;
  const [selectedSubmission, setSelectedSubmission] =
    useState<AssignmentSubmissionItem | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading, isFetching, refetch } =
    useSubmissionsByAssignment(assignmentId);

  const submissions = useMemo(
    () => data?.submissions ?? [],
    [data?.submissions],
  );

  const handleSelectSubmission = (submission: AssignmentSubmissionItem) => {
    setSelectedSubmission(submission);
    setSheetOpen(true);
  };

  const handleSheetChange = (open: boolean) => {
    setSheetOpen(open);

    if (!open) {
      setSelectedSubmission(null);
    }
  };

  const handleSubmissionUpdated = () => {
    setSheetOpen(false);
    setSelectedSubmission(null);
    void refetch();
  };

  const renderSubmissionRow = (submission: AssignmentSubmissionItem) => (
    <tr
      key={submission.id}
      className="cursor-pointer transition-colors hover:bg-slate-50"
      onClick={() => handleSelectSubmission(submission)}
    >
      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
        {submission.learner_name}
      </td>
      <td className="px-4 py-3">
        <Badge variant={statusVariantMap[submission.status]}>
          {statusLabelMap[submission.status]}
        </Badge>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
        {format(new Date(submission.submitted_at), 'yyyy-MM-dd HH:mm')}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {submission.score ?? '-'}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {submission.is_late ? (
          <Badge variant="destructive">지각 제출</Badge>
        ) : (
          '-'
        )}
      </td>
    </tr>
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">제출물 목록</h1>
        <p className="text-slate-600">
          {data?.assignment.title ?? '과제 정보를 불러오는 중입니다.'}
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold">제출 현황</h2>
          {(isLoading || isFetching) && (
            <span className="text-sm text-slate-500">동기화 중...</span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2 px-6 py-6">
            <div className="h-6 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-6 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-6 w-3/4 animate-pulse rounded bg-slate-100" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            아직 제출된 과제가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 text-sm font-semibold">수강생</th>
                  <th className="px-4 py-3 text-sm font-semibold">상태</th>
                  <th className="px-4 py-3 text-sm font-semibold">제출일</th>
                  <th className="px-4 py-3 text-sm font-semibold">점수</th>
                  <th className="px-4 py-3 text-sm font-semibold">지각 여부</th>
                </tr>
              </thead>
              <tbody>{submissions.map(renderSubmissionRow)}</tbody>
            </table>
          </div>
        )}
      </section>

      <Sheet open={isSheetOpen} onOpenChange={handleSheetChange}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>
              {selectedSubmission?.learner_name ?? '제출물 상세'}
            </SheetTitle>
          </SheetHeader>

          {selectedSubmission && (
            <div className="mt-6 space-y-4">
              <dl className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                <div>
                  <dt className="font-semibold text-slate-500">제출 상태</dt>
                  <dd>{statusLabelMap[selectedSubmission.status]}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">제출일</dt>
                  <dd>
                    {format(new Date(selectedSubmission.submitted_at), 'yyyy-MM-dd HH:mm')}
                  </dd>
                </div>
              </dl>

              <GradeSubmissionForm
                submissionId={selectedSubmission.id}
                assignmentId={assignmentId}
                onSuccess={handleSubmissionUpdated}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
