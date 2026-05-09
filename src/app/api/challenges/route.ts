import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { challengeTemplates } from "@/db/schema";
import { eq, and, like, SQL } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pack = searchParams.get("pack");
  const category = searchParams.get("category");
  const intensity = searchParams.get("intensity");
  const movement = searchParams.get("movement");
  const noise = searchParams.get("noise");
  const search = searchParams.get("search");

  const conditions: SQL[] = [];

  if (pack) {
    conditions.push(eq(challengeTemplates.audiencePack, pack));
  }
  if (category) {
    conditions.push(eq(challengeTemplates.category, category));
  }
  if (intensity) {
    conditions.push(eq(challengeTemplates.intensityTone, intensity));
  }
  if (movement) {
    conditions.push(eq(challengeTemplates.movementLevel, movement));
  }
  if (noise) {
    conditions.push(eq(challengeTemplates.noiseLevel, noise));
  }
  if (search) {
    conditions.push(like(challengeTemplates.title, `%${search}%`));
  }

  const challenges = await db.query.challengeTemplates.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
  });

  return NextResponse.json(challenges);
}
