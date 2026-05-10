import { NextResponse } from "next/server";
import { db } from "@/db";
import { challengePacks, packChallenges } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export async function GET() {
  const packs = await db.query.challengePacks.findMany({
    with: { packChallenges: true },
  });

  const result = packs.map((pack) => ({
    id: pack.id,
    name: pack.name,
    description: pack.description,
    icon: pack.icon,
    color: pack.color,
    challengeCount: pack.packChallenges.length,
  }));

  return NextResponse.json(result);
}
