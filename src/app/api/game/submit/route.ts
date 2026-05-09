import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { submissions, participants, eventChallenges } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { pusherServer } from "@/lib/pusher/server";

export async function POST(req: NextRequest) {
  try {
    const { participantId, eventChallengeId, submissionType, textContent } =
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
