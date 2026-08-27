import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getSchoolSnapshot, type SchoolSnapshot } from "@/lib/school-data.functions";
import { mergeGradingConfig } from "@/lib/grading";
import { useSession } from "./use-session";

export const SCHOOL_SNAPSHOT_KEY = "schoolSnapshot";

const EMPTY: SchoolSnapshot = {
  schoolId: "",
  schoolName: "",
  streams: [],
  subjects: [],
  students: [],
  exams: [],
  rosters: [],
  gradingConfig: null,
};

/**
 * Single source of truth for every school dashboard. The server scopes the
 * payload to the caller's tenant, so no client-side school filtering is needed.
 */
export function useSchoolData() {
  const user = useSession();
  const enabled = !!user?.schoolId && user.accountStatus === "active";

  const query = useQuery({
    queryKey: [SCHOOL_SNAPSHOT_KEY, user?.schoolId ?? null],
    queryFn: () => getSchoolSnapshot(),
    enabled,
    staleTime: 15_000,
  });

  const qc = useQueryClient();
  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: [SCHOOL_SNAPSHOT_KEY] });
  }, [qc]);

  const data = query.data ?? EMPTY;

  return {
    ...data,
    grading: mergeGradingConfig(data.gradingConfig),
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    refresh,
  };
}

/** Invalidate the snapshot from components that don't need to read it. */
export function useRefreshSchoolData() {
  const qc = useQueryClient();
  return useCallback(() => {
    void qc.invalidateQueries({ queryKey: [SCHOOL_SNAPSHOT_KEY] });
  }, [qc]);
}
