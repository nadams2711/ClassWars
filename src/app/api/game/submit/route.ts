import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { submissions, participants, eventChallenges, challengeTemplates, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { pusherServer } from "@/lib/pusher/server";

export async function POST(req: NextRequest) {
  try {
    const { participantId, eventChallengeId, submissionType, textContent, mediaUrl, turnBased, turnOrder, turnIndex } =
      await req.json();

    if (!participantId || !eventChallengeId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify participant exists
    const participant = await db.query.participants.findFirst({
      where: eq(participants.id, participantId),
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // Verify challenge is active
    const ec = await db.query.eventChallenges.findFirst({
      where: and(
        eq(eventChallenges.id, eventChallengeId),
        eq(eventChallenges.status, "active")
      ),
    });

    if (!ec) {
      return NextResponse.json(
        { error: "Challenge not active" },
        { status: 400 }
      );
    }

    // Verify participant belongs to the same event as the challenge
    if (participant.eventId !== ec.eventId) {
      return NextResponse.json(
        { error: "Participant not in this event" },
        { status: 403 }
      );
    }

    // Check for duplicate submission
    const existing = await db.query.submissions.findFirst({
      where: and(
        eq(submissions.eventChallengeId, eventChallengeId),
        eq(submissions.participantId, participantId)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already submitted" },
        { status: 409 }
      );
    }

    // Create submission record
    const [submission] = await db
      .insert(submissions)
      .values({
        eventChallengeId,
        participantId,
        submissionType: submissionType || "completion_tap",
        textContent: textContent || null,
        mediaUrl: mediaUrl || null,
        completedAt: new Date(),
      })
      .returning();

    // Notify host via Pusher
    await pusherServer.trigger(
      `presence-event-${participant.eventId}`,
      "submission-received",
      {
        participantId,
        nickname: participant.nickname,
        type: submissionType || "completion_tap",
        submissionId: submission.id,
      }
    );

    // Auto-advance turn if turn-based
    if (turnBased && turnOrder && turnIndex !== undefined) {
      const nextIndex = turnIndex + 1;

      if (nextIndex >= turnOrder.length) {
        // Last player — close submissions
        const event = await db.query.events.findFirst({
          where: eq(events.id, participant.eventId),
        });

        await pusherServer.trigger(
          `presence-event-${participant.eventId}`,
          "game-state",
          {
            phase: "SUBMISSIONS_CLOSED",
            round: event?.currentRound || 1,
            totalRounds: event?.totalRounds || 0,
            turnBased: true,
            currentTurnPlayerId: null,
            currentTurnNickname: null,
            turnIndex: nextIndex,
            turnOrder,
            turnTimerEnd: null,
          }
        );
      } else {
        // Advance to next player
        const nextPlayerId = turnOrder[nextIndex];
        const nextPlayer = await db.query.participants.findFirst({
          where: eq(participants.id, nextPlayerId),
        });

        // Get per-turn duration from template
        let perTurnDuration = 60;
        const template = await db.query.challengeTemplates.findFirst({
          where: eq(
            challengeTemplates.id,
            ec.challengeId
          ),
        });
        if (template) perTurnDuration = template.durationSeconds ?? 60;

        const turnTimerEnd = new Date(
          Date.now() + perTurnDuration * 1000
        ).toISOString();

        await pusherServer.trigger(
          `presence-event-${participant.eventId}`,
          "turn-advanced",
          {
            currentTurnPlayerId: nextPlayerId,
            currentTurnNickname: nextPlayer?.nickname || "Player",
            turnIndex: nextIndex,
            turnOrder,
            turnTimerEnd,
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
    });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
