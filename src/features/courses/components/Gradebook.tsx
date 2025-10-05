"use client";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetGrades } from "../hooks/useGetGrades";
import type { Submission } from "../lib/dto";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

type StatusMeta = {
  label: string;
  variant: BadgeVariant;
};

const submissionStatusMeta: Record<Submission["status"], StatusMeta> = {
  submitted: {
    label: "Awaiting grading",
    variant: "secondary",
  },
  graded: {
    label: "Graded",
    variant: "default",
  },
  resubmission_required: {
    label: "Resubmission required",
    variant: "destructive",
  },
};

const notSubmittedMeta: StatusMeta = {
  label: "Not submitted",
  variant: "secondary",
};

interface GradebookProps {
  courseId: string;
}

export const Gradebook = ({ courseId }: GradebookProps) => {
  const { data, isLoading, isError, error } = useGetGrades(courseId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grades &amp; Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading grades...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    const message = error instanceof Error ? error.message : "Failed to load grades.";

    return (
      <Card>
        <CardHeader>
          <CardTitle>Grades &amp; Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grades &amp; Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            There are no assignments to show yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grades &amp; Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assignment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Feedback</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((assignment) => {
              const submission = assignment.submission ?? null;
              const status = submission
                ? submissionStatusMeta[submission.status]
                : notSubmittedMeta;
              const score = submission?.score ?? "N/A";
              const feedback = submission?.feedback?.trim()
                ? submission.feedback
                : "No feedback yet";

              return (
                <TableRow key={assignment.id}>
                  <TableCell>{assignment.title}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>{score}</TableCell>
                  <TableCell>{feedback}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

