import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { challengeTemplates } from "@/db/schema";
import { and, like, SQL } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const conditions: SQL[] = [];
  if (search) {
    conditions.push(like(challengeTemplates.title, `%${search}%`));
  }

  const challenges = await db.query.challengeTemplates.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
  });

  return NextResponse.json(challenges);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const result = await db
    .insert(challengeTemplates)
    .values({
      title: body.title,
      shortDescription: body.shortDescription || null,
      fullInstructions: body.fullInstructions || null,
      audience: body.audience || null,
      audiencePack: body.audiencePack || null,
      category: body.category || null,
      intensityTone: body.intensityTone || null,
      durationSeconds: body.durationSeconds ?? 60,
      movementLevel: body.movementLevel || "seated",
      noiseLevel: body.noiseLevel || "quiet",
      submissionType: body.submissionType || "completion_tap",
      scoringType: body.scoringType || "completion",
      safetyFlags: body.safetyFlags || [],
      isSystem: body.isSystem ?? false,
      interactiveData: body.interactiveData || null,
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
