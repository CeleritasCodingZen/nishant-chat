import { NextRequest, NextResponse } from "next/server";
import { getChatAnalysisService } from "@/lib/services";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { rawText, fileName } = body;

    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
      return NextResponse.json(
        { error: "EMPTY_PAYLOAD // Raw chat text is required for ingestion." },
        { status: 400 }
      );
    }

    // Safety limit: 10MB payload max
    if (rawText.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "PAYLOAD_OVERSIZE // Chat log exceeds 10MB maximum limit." },
        { status: 413 }
      );
    }

    const chatService = getChatAnalysisService();
    const result = await chatService.ingestChat(rawText, fileName);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Chat ingestion error:", error);
    return NextResponse.json(
      { error: error?.message || "INGESTION_FAILED // Failed to parse chat export file." },
      { status: 500 }
    );
  }
}
