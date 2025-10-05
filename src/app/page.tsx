'use client';

import { useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Clock,
  GraduationCap,
  PenSquare,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

const learnerJourney = [
  {
    title: '코스 탐색',
    description: '공개 카탈로그에서 게시된 코스를 살펴보고 관심 과정을 찾습니다.',
  },
  {
    title: '과제 제출',
    description: '마감일, 지각 정책을 확인한 뒤 텍스트·링크 기반 제출을 완료합니다.',
  },
  {
    title: '피드백 수령',
    description: '채점 결과와 재제출 요청을 실시간으로 확인하고 학습을 이어갑니다.',
  },
];

const instructorJourney = [
  {
    title: '코스 개설',
    description: '초안을 생성해 커리큘럼과 운영 정책을 정리한 뒤 게시 상태로 전환합니다.',
  },
  {
    title: '과제 관리',
    description: '과제를 작성해 배포하고 제출 현황을 모니터링합니다.',
  },
  {
    title: '채점 & 재제출',
    description: '제출물 점수와 피드백을 입력하고 필요 시 재제출을 요청합니다.',
  },
];

const capabilityHighlights = [
  {
    icon: <ShieldCheck className="h-5 w-5 text-emerald-500" aria-hidden />,
    title: '역할 기반 가드',
    description: 'Learner와 Instructor 권한을 분리해 각 여정이 의도한 경로로 흐르도록 보장합니다.',
  },
  {
    icon: <ClipboardList className="h-5 w-5 text-sky-500" aria-hidden />,
    title: '상태 중심 운영',
    description: '과제 상태(draft/published/closed)와 제출 상태(submitted/graded)를 기준으로 UX를 제어합니다.',
  },
  {
    icon: <BookOpen className="h-5 w-5 text-violet-500" aria-hidden />,
    title: '문서 주도 개발',
    description: 'PRD·Userflow를 코드에 매핑해 명세와 구현 사이의 간극을 최소화합니다.',
  },
];

const quickLinks = [
  {
    label: '코스 카탈로그',
    href: '/courses',
    icon: <GraduationCap className="h-5 w-5 text-amber-500" aria-hidden />,
    description: '게시된 강의를 탐색하고 수강신청 여정을 시작합니다.',
  },
  {
    label: 'Instructor 대시보드',
    href: '/instructor/dashboard',
    icon: <PenSquare className="h-5 w-5 text-blue-500" aria-hidden />,
    description: '내 코스와 채점 대기 제출물을 한 화면에 정리합니다.',
  },
  {
    label: '문서 허브',
    href: '/docs',
    icon: <Users className="h-5 w-5 text-rose-500" aria-hidden />,
    description: '명세, 플로우, QA 체크리스트를 확인하며 개발 흐름을 맞춥니다.',
  },
];

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refresh } = useCurrentUser();

  const handleSignOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    await refresh();
    router.replace('/');
  }, [refresh, router]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
      <header className="border-b border-white/5 bg-gradient-to-br from-slate-950 via-slate-900/60 to-slate-900/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-6">
            <Badge className="w-fit bg-emerald-500/10 text-emerald-300">
              실전 LMS를 위한 가벼운 시작
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                문서 기반으로 설계된
                <br />
                경량 학습 관리 플랫폼
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-300">
                코스 게시부터 제출물 채점까지, 역할과 상태에 따라 흐름이 명확하게 구분된 학습 경험을 제공합니다.
                명세에 맞춘 최소 기능을 빠르게 구축하고 검증하세요.
              </p>
            </div>
            <HeroActions
              isLoading={isLoading}
              isAuthenticated={isAuthenticated}
              userEmail={user?.email}
              onSignOut={handleSignOut}
            />
          </div>
          <HeroSnapshot />
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {capabilityHighlights.map((item) => (
          <Card key={item.title} className="border-white/5 bg-white/5 backdrop-blur">
            <CardHeader className="flex flex-row items-start gap-4">
              <div className="rounded-md bg-slate-900/80 p-2">{item.icon}</div>
              <div>
                <CardTitle className="text-lg text-slate-50">{item.title}</CardTitle>
                <CardDescription className="text-slate-300">
                  {item.description}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-3">
          <Badge className="w-fit bg-slate-800 text-slate-200">User Journey</Badge>
          <h2 className="text-3xl font-semibold tracking-tight">역할별 사용자 여정</h2>
          <p className="max-w-3xl text-sm text-slate-300">
            PRD와 Userflow 문서에 정의된 단계를 그대로 옮겨왔습니다. QA 시나리오 작성과 개발 우선순위를 한눈에 파악하세요.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <JourneyCard
            title="Learner"
            subtitle="탐색 → 제출 → 피드백"
            steps={learnerJourney}
            accent="from-emerald-500/20 to-emerald-500/5"
          />
          <JourneyCard
            title="Instructor"
            subtitle="코스 운영 → 과제 관리 → 채점"
            steps={instructorJourney}
            accent="from-sky-500/20 to-sky-500/5"
          />
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-3">
          <Badge className="w-fit bg-slate-800 text-slate-200">Key Screens</Badge>
          <h2 className="text-3xl font-semibold tracking-tight">핵심 화면 미리보기</h2>
          <p className="max-w-3xl text-sm text-slate-300">
            홈 진입 후 가장 자주 방문하는 화면을 빠르게 열람할 수 있도록 바로가기를 준비했습니다.
            각 섹션은 최소 기능 구현 범위를 우선합니다.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Card key={link.label} className="group border-white/5 bg-white/5 transition hover:border-white/20 hover:bg-white/10">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="rounded-md bg-slate-900/80 p-2 text-slate-100">
                  {link.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{link.label}</CardTitle>
                  <CardDescription className="text-slate-300">
                    {link.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  asChild
                  variant="ghost"
                  className="group/button mt-2 w-full justify-between text-slate-200 hover:bg-slate-900"
                >
                  <Link href={link.href}>
                    이동하기
                    <ArrowRight className="h-4 w-4 transition group-hover/button:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3 text-sm text-slate-300">
            <p>Supabase Auth · React Query · Hono · shadcn/ui</p>
            <p>명세와 실제 구현 간 싱크를 유지하고, QA 체크리스트 작성에 필요한 정보를 이곳에서 정리하세요.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-slate-800 text-slate-200">v0.1 MVP</Badge>
            <Separator orientation="vertical" className="h-6 bg-white/10" />
            <span className="text-xs text-slate-400">© {new Date().getFullYear()} Gemini LMS</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function HeroActions({
  isLoading,
  isAuthenticated,
  userEmail,
  onSignOut,
}: {
  isLoading: boolean;
  isAuthenticated: boolean;
  userEmail?: string | null;
  onSignOut: () => Promise<void> | void;
}) {
  if (isLoading) {
    return <span className="text-sm text-slate-300">세션 확인 중...</span>;
  }

  if (isAuthenticated) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-slate-200">
          {userEmail ?? '알 수 없는 사용자'}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="secondary" className="bg-white text-slate-900 hover:bg-slate-200">
            <Link href="/dashboard">대시보드 열기</Link>
          </Button>
          <Button
            variant="ghost"
            className="border border-white/10 bg-transparent hover:bg-white/10"
            onClick={onSignOut}
          >
            로그아웃
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button asChild size="lg" className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
        <Link href="/signup">지금 시작하기</Link>
      </Button>
      <Button
        asChild
        variant="ghost"
        size="lg"
        className="border border-white/10 bg-transparent text-slate-200 hover:bg-white/10"
      >
        <Link href="/login">로그인</Link>
      </Button>
    </div>
  );
}

function HeroSnapshot() {
  return (
    <Card className="w-full max-w-md border-white/5 bg-white/10 backdrop-blur">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-slate-50">운영 현황 요약</CardTitle>
        <CardDescription className="text-slate-300">
          하루 업무 흐름을 정의된 상태 기반 규칙에 따라 점검하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SnapshotRow
          label="게시된 코스"
          value="12"
          hint="draft → published 전환 완료"
          icon={<BookOpen className="h-4 w-4" aria-hidden />}
        />
        <SnapshotRow
          label="마감 임박 과제"
          value="3"
          hint="마감 24시간 이내"
          icon={<Clock className="h-4 w-4" aria-hidden />}
        />
        <SnapshotRow
          label="채점 대기 제출물"
          value="8"
          hint="Instructor 대응 필요"
          icon={<PenSquare className="h-4 w-4" aria-hidden />}
        />
      </CardContent>
    </Card>
  );
}

function SnapshotRow({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/60 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-white/10 p-2 text-slate-100">{icon}</div>
        <div>
          <p className="text-sm font-medium text-slate-100">{label}</p>
          <p className="text-xs text-slate-400">{hint}</p>
        </div>
      </div>
      <span className="text-xl font-semibold text-slate-50">{value}</span>
    </div>
  );
}

function JourneyCard({
  title,
  subtitle,
  steps,
  accent,
}: {
  title: string;
  subtitle: string;
  steps: { title: string; description: string }[];
  accent: string;
}) {
  return (
    <Card className={`border-white/5 bg-gradient-to-br ${accent} backdrop-blur`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge className="bg-white/10 text-slate-100">{title}</Badge>
          <span className="text-xs uppercase tracking-wide text-slate-200">{subtitle}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.title} className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-slate-100">
              {index + 1}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-100">{step.title}</p>
              <p className="text-xs text-slate-200/80">{step.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
