import { NextRequest, NextResponse } from "next/server";
import { getTriviaService } from "@/lib/services";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const {
      gameId,
      participants = [],
      interests = [],
      quotes = [],
      topQuotes = [],
      sourceMessages = [],
      romCategory = "ROM // 001",
      difficulty = "medium",
      count = 5,
    } = body;

    // Reject fewer than 4 participants without inventing fake people (Rule 24)
    if (!Array.isArray(participants) || participants.length < 4) {
      return NextResponse.json(
        {
          error: `INSUFFICIENT_PARTICIPANTS // At least 4 unique participants are required for arcade trivia. Received ${
            Array.isArray(participants) ? participants.length : 0
          }.`,
        },
        { status: 400 }
      );
    }

    const triviaService = getTriviaService();
    const result = await triviaService.generateQuestions({
      gameId,
      participants,
      interests: Array.isArray(interests) ? interests : [],
      quotes: Array.isArray(quotes) ? quotes : [],
      topQuotes: Array.isArray(topQuotes) ? topQuotes : [],
      sourceMessages: Array.isArray(sourceMessages) ? sourceMessages : [],
      romCategory,
      difficulty,
      count: Math.min(10, Math.max(1, Number(count) || 5)),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Questions generation error:", error);
    const isValidationError = error?.message?.startsWith("INSUFFICIENT_PARTICIPANTS");
    return NextResponse.json(
      {
        error: error?.message || "GENERATION_FAILED // Failed to compile ROM cartridge trivia.",
      },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
