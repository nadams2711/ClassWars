"use client";
import { useMemo } from "react";
import { useGameStore } from "@/stores/gameStore";

export function useLeaderboard() {
  const { leaderboard, myParticipantId } = useGameStore();

  const sortedLeaderboard = useMemo(() =>
    [...leaderboard].sort((a, b) => a.rank - b.rank),
    [leaderboard]
  );

  const myEntry = useMemo(() =>
    leaderboard.find(e => e.participantId === myParticipantId) || null,
    [leaderboard, myParticipantId]
  );

  const top3 = useMemo(() => sortedLeaderboard.slice(0, 3), [sortedLeaderboard]);

  const nearbyRanks = useMemo(() => {
    if (!myEntry) return sortedLeaderboard.slice(0, 5);
    const myIndex = sortedLeaderboard.findIndex(e => e.participantId === myParticipantId);
    const start = Math.max(0, myIndex - 2);
    const end = Math.min(sortedLeaderboard.length, myIndex + 3);
    return sortedLeaderboard.slice(start, end);
  }, [sortedLeaderboard, myEntry, myParticipantId]);

  return { sortedLeaderboard, myEntry, top3, nearbyRanks };
}
