import { NextResponse } from "next/server";
import { db } from "@/db";
import { packChallenges } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ packId: string }> }
) {
  const { packId } = await params;

  const rows = await db.query.packChallenges.findMany({
    where: eq(packChallenges.packId, packId),
    orderBy: (pc, { asc }) => [asc(pc.orderIndex)],
    with: { challenge: true },
  });

  const templates = rows
    .map((row) => row.challenge)
    .filter(Boolean);

  return NextResponse.json(templates);
}
