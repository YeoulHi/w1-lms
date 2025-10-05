'use client';

import { useUserRole } from '@/features/profiles/hooks/useUserRole';
import { InstructorDashboard } from '@/features/dashboard/components/InstructorDashboard';
import { LearnerDashboard } from '@/features/dashboard/components/LearnerDashboard';

type DashboardPageProps = {
  params: Promise<Record<string, never>>;
};

export default function DashboardPage({ params }: DashboardPageProps) {
  void params;
  const { data: role, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
        <p className="text-slate-500">로딩 중...</p>
      </div>
    );
  }

  if (role === 'instructor') {
    return <InstructorDashboard />;
  }

  return <LearnerDashboard />;
}
