"use client";

import { useParams } from "next/navigation";
import { Gradebook } from "@/features/courses/components/Gradebook";

const GradesPage = () => {
  const params = useParams<{ id?: string | string[] }>();
  const rawId = params?.id;
  const courseId = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!courseId) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-sm text-muted-foreground">Course id is missing.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Gradebook courseId={courseId} />
    </div>
  );
};

export default GradesPage;
