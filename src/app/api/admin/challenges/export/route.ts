import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  const challenges = await db.query.challengeTemplates.findMany();

  // Strip server-only fields
  const exported = challenges.map(({ id, createdBy, createdAt, ...rest }) => rest);

  return new NextResponse(JSON.stringify(exported, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="challenges-export.json"',
    },
  });
}
