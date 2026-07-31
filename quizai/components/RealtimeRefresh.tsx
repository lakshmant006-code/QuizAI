"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to Postgres changes on the user's tables and refreshes the
 * current route so server-rendered stats stay live.
 */
export function RealtimeRefresh({ userId }: { userId: string }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`rt-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents", filter: `user_id=eq.${userId}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_attempts", filter: `user_id=eq.${userId}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);
  return null;
}
