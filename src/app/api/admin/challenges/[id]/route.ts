import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { challengeTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // Strip immutable fields
  delete body.id;
  delete body.createdAt;
  delete body.createdBy;

  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const result = await db
    .update(challengeTemplates)
    .set(body)
    .where(eq(challengeTemplates.id, id))
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await db
    .delete(challengeTemplates)
    .where(eq(challengeTemplates.id, id))
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}
