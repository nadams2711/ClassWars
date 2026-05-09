"use client";
import { useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import { usePusher } from "./usePusher";
import { useSound } from "./useSound";

export function useGameState(eventId: string | null, isHost = false) {
  const store = useGameStore();
  const { play } = useSound();

  const pusherOptions = eventId ? {
    eventId,
    onPlayerJoined: (data: any) => {
      store.addParticipant(data.participant);
      play("join_success");
    },
    onPlayerLeft: (data: any) => {
      store.removeParticipant(data.participantId);
    },
    onGameState: (data: any) => {
      store.handleGameStateEvent(data);
      // Play appropriate sounds based on phase
      if (data.phase === "COUNTDOWN") play("countdown_tick");
      if (data.phase === "CHALLENGE_ACTIVE") play("countdown_go");
      if (data.phase === "SCORE_REVEAL") play("score_reveal");
      if (data.phase === "VS_SCREEN") play("vs_whoosh");
      if (data.phase === "FINAL_RESULTS") play("game_over");
    },
    onCountdown: (data: any) => {
      if (data.seconds > 0) play("countdown_tick");
      else play("countdown_go");
    },
    onScoresUpdated: (data: any) => {
      store.handleScoresUpdate(data);
    },
    onVSScreen: (data: any) => {
      store.setVSMatchup(data);
      play("vs_whoosh");
    },
    onBadgeAwarded: (data: any) => {
      play("badge_unlock");
    },
    onGameEnded: (data: any) => {
      store.setPhase("FINAL_RESULTS");
      store.setLeaderboard(data.finalResults || []);
      play("game_over");
    },
  } : null;

  usePusher(pusherOptions);

  useEffect(() => {
    if (eventId) {
      store.setEventId(eventId);
      store.setIsHost(isHost);
    }
    return () => { store.reset(); };
  }, [eventId, isHost]);

  return store;
}
