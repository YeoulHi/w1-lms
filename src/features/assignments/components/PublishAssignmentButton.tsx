'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePublishAssignment } from '@/features/assignments/hooks/usePublishAssignment';
import type { PublishAssignmentResponse } from '@/features/assignments/lib/dto';

type PublishAssignmentButtonProps = {
  assignmentId: string;
  className?: string;
  disabled?: boolean;
  onPublished?: (response: PublishAssignmentResponse) => void;
};

export function PublishAssignmentButton({
  assignmentId,
  className,
  disabled,
  onPublished,
}: PublishAssignmentButtonProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);

  const { mutate: publishAssignment, isPending } = usePublishAssignment(
    assignmentId,
    {
      onSuccess: (response) => {
        setDialogOpen(false);
        onPublished?.(response);
      },
    },
  );

  const handleConfirm = () => {
    publishAssignment();
  };

  const handleOpenChange = (open: boolean) => {
    if (!isPending) {
      setDialogOpen(open);
    }
  };

  return (
    <Dialog.Root open={isDialogOpen} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button
          className={cn('min-w-[120px]', className)}
          disabled={disabled || isPending}
        >
          {isPending ? '게시 중...' : '게시하기'}
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[90%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none">
          <Dialog.Title className="text-lg font-semibold text-slate-900">
            과제를 게시할까요?
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-slate-600">
            게시 후에는 수강생에게 과제가 공개됩니다. 계속 진행하시겠습니까?
          </Dialog.Description>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending ? '게시 중...' : '확인'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
