"use client";

import { EnrollButton } from "@/features/enrollments/components/EnrollButton";
import Image from "next/image";
import { use } from "react";

type CoursePageProps = {
  params: Promise<{ id: string }>;
};

export default function CoursePage({ params }: CoursePageProps) {
  const { id } = use(params);

  // TODO: 실제 코스 조회 API 구현 시 교체
  // 현재는 최소 복잡도 원칙에 따라 하드코딩
  const mockCourse = {
    id,
    title: "Next.js 15 마스터 클래스",
    description:
      "App Router, Server Actions, React Server Components를 마스터합니다.",
    status: "published",
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold">{mockCourse.title}</h1>
        <p className="text-slate-600">{mockCourse.description}</p>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <Image
          alt={mockCourse.title}
          src={`https://picsum.photos/seed/course-${id}/960/420`}
          width={960}
          height={420}
          className="h-auto w-full object-cover"
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">강의 정보</h2>
        <div className="rounded-lg border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">강의 상태</p>
              <p className="font-medium">
                {mockCourse.status === "published" ? "수강 가능" : "준비 중"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">강의 ID</p>
              <p className="font-mono text-xs text-slate-600">{id}</p>
            </div>
          </div>

          {mockCourse.status === "published" && (
            <div className="pt-4 border-t border-slate-200">
              <EnrollButton courseId={id} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
