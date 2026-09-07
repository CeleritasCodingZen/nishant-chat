import { NextRequest, NextResponse } from "next/server";
import { getModerationService } from "@/lib/services";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, mimeType, base64, userId } = body;

    if (!id || !mimeType || !base64) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR // id, mimeType, and base64 fields are mandatory." },
        { status: 400 }
      );
    }

    const moderationService = getModerationService();
    const result = await moderationService.moderateMedia({
      id,
      mimeType,
      base64,
      userId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Media moderation API error:", error);
    return NextResponse.json(
      {
        allowed: false,
        category: "error",
        confidence: 0,
        reason: error instanceof Error ? error.message : "MODERATION_FAILED",
      },
      { status: 500 }
    );
  }
}
