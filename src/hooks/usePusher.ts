"use client";
import { useEffect, useRef, useCallback } from "react";
import type Pusher from "pusher-js";
import type { Channel, PresenceChannel } from "pusher-js";

interface UsePusherOptions {
  eventId: string;
  onPlayerJoined?: (data: any) => void;
  onPlayerLeft?: (data: any) => void;
  onGameState?: (data: any) => void;
  onCountdown?: (data: any) => void;
  onSubmissionReceived?: (data: any) => void;
  onScoresUpdated?: (data: any) => void;
  onVSScreen?: (data: any) => void;
  onBracketUpdate?: (data: any) => void;
  onBadgeAwarded?: (data: any) => void;
  onGameEnded?: (data: any) => void;
  onTurnAdvanced?: (data: any) => void;
}

export function usePusher(options: UsePusherOptions | null) {
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<PresenceChannel | null>(null);

  useEffect(() => {
    if (!options?.eventId) return;

    let pusher: Pusher;
    let channel: PresenceChannel;

    const setup = async () => {
      const PusherClient = (await import("pusher-js")).default;

      pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        authEndpoint: "/api/pusher/auth",
      });

      pusherRef.current = pusher;
      channel = pusher.subscribe(`presence-event-${options.eventId}`) as PresenceChannel;
      channelRef.current = channel;

      // Bind events
      if (options.onPlayerJoined) channel.bind("player-joined", options.onPlayerJoined);
      if (options.onPlayerLeft) channel.bind("player-left", options.onPlayerLeft);
      if (options.onGameState) channel.bind("game-state", options.onGameState);
      if (options.onCountdown) channel.bind("countdown", options.onCountdown);
      if (options.onSubmissionReceived) channel.bind("submission-received", options.onSubmissionReceived);
      if (options.onScoresUpdated) channel.bind("scores-updated", options.onScoresUpdated);
      if (options.onVSScreen) channel.bind("vs-screen", options.onVSScreen);
      if (options.onBracketUpdate) channel.bind("bracket-update", options.onBracketUpdate);
      if (options.onBadgeAwarded) channel.bind("badge-awarded", options.onBadgeAwarded);
      if (options.onGameEnded) channel.bind("game-ended", options.onGameEnded);
      if (options.onTurnAdvanced) channel.bind("turn-advanced", options.onTurnAdvanced);
    };

    setup();

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current.unsubscribe();
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
    };
  }, [options?.eventId]);

  return {
    pusher: pusherRef.current,
    channel: channelRef.current,
  };
}
