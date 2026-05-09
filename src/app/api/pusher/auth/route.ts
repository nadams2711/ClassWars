import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher/server";

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const socketId = data.get("socket_id") as string;
  const channel = data.get("channel_name") as string;

  // For presence channels, we need user info
  // In production, validate the user's session here
  const presenceData = {
    user_id: socketId, // Use socket ID as fallback user ID
    user_info: {
      name: "Player",
    },
  };

  const authResponse = pusherServer.authorizeChannel(socketId, channel, presenceData);
  return NextResponse.json(authResponse);
}
