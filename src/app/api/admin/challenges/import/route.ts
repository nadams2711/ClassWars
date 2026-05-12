import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { challengeTemplates } from "@/db/schema";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!Array.isArray(body)) {
    return NextResponse.json(
      { error: "Expected a JSON array of challenges" },
      { status: 400 }
    );
  }

  const cleaned = body.map((item: Record<string, unknown>) => {
    const { id, createdAt, createdBy, ...rest } = item;
    return {
      title: (rest.title as string) || "Untitled",
      shortDescription: (rest.shortDescription as string) || null,
      fullInstructions: (rest.fullInstructions as string) || null,
      audience: (rest.audience as string) || null,
      audiencePack: (rest.audiencePack as string) || null,
      category: (rest.category as string) || null,
      intensityTone: (rest.intensityTone as string) || null,
      durationSeconds: (rest.durationSeconds as number) ?? 60,
      movementLevel: (rest.movementLevel as string) || "seated",
      noiseLevel: (rest.noiseLevel as string) || "quiet",
      submissionType: (rest.submissionType as string) || "completion_tap",
      scoringType: (rest.scoringType as string) || "completion",
      safetyFlags: (rest.safetyFlags as string[]) || [],
      isSystem: (rest.isSystem as boolean) ?? false,
      interactiveData: rest.interactiveData || null,
      isSimultaneous: (rest.isSimultaneous as boolean) ?? false,
    };
  });

  if (cleaned.length === 0) {
    return NextResponse.json({ count: 0 });
  }

  await db.insert(challengeTemplates).values(cleaned);

  return NextResponse.json({ count: cleaned.length }, { status: 201 });
}
