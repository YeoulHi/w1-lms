import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { GradesResponse } from "../lib/dto";

const fetchGrades = async (
  courseId: string,
  token: string,
): Promise<GradesResponse> => {
  try {
    const { data } = await apiClient.get<GradesResponse>(
      `/api/courses/${courseId}/grades`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return data;
  } catch (error) {
    const message = extractApiErrorMessage(error, "Failed to load grades.");
    throw new Error(message);
  }
};

export const useGetGrades = (courseId: string) => {
  const { session } = useCurrentUser();
  const token = session?.access_token;

  return useQuery<GradesResponse>({
    queryKey: ["courses", courseId, "grades"],
    queryFn: () => fetchGrades(courseId, token ?? ""),
    enabled: Boolean(courseId) && Boolean(token),
    staleTime: 60_000,
  });
};
