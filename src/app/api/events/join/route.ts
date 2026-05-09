import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, participants } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { joinCode, nickname } = await req.json();

    // Validate required fields
    if (!joinCode || !nickname) {
      return NextResponse.json(
        { error: "Code and nickname required" },
        { status: 400 }
      );
    }

    // Validate nickname length
    if (nickname.length > 16) {
      return NextResponse.json(
        { error: "Nickname max 16 characters" },
        { status: 400 }
      );
    }

    // Find event by join code that is accepting players (status = lobby)
    const event = await db.query.events.findFirst({
      where: and(
        eq(events.joinCode, joinCode.toUpperCase()),
        eq(events.status, "lobby")
      ),
    });

    if (!event) {
      return NextResponse.json(
        { error: "Game not found or not accepting players" },
        { status: 404 }
      );
    }

    // Check nickname uniqueness within event
    const existingParticipant = await db.query.participants.findFirst({
      where: and(
        eq(participants.eventId, event.id),
        eq(participants.nickname, nickname)
      ),
    });

    if (existingParticipant) {
      return NextResponse.json(
        { error: "Nickname already taken" },
        { status: 409 }
      );
    }

    // Create participant with random avatar
    const [participant] = await db
      .insert(participants)
      .values({
        eventId: event.id,
        nickname,
        avatarIndex: Math.floor(Math.random() * 24),
      })
      .returning();

    // TODO: Trigger Pusher event for player-joined

    return NextResponse.json({
      eventId: event.id,
      participantId: participant.id,
    });
  } catch (error) {
    console.error("Join event error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
