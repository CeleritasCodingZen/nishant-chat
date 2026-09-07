import { NextRequest, NextResponse } from "next/server";
import { getGameMasterService } from "@/lib/services";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { round = 1, players = [], currentQuestion, scores = {} } = body;

    const gameMasterService = getGameMasterService();
    const result = await gameMasterService.executeGameMaster({
      round: Number(round) || 1,
      players: Array.isArray(players) ? players : [],
      currentQuestion,
      scores: typeof scores === "object" && scores !== null ? scores : {},
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Game Master API error:", error);
    return NextResponse.json(
      {
        action: "NEXT_QUESTION",
        message: "HEURISTIC BUS ERROR // RESUMING STANDARD CARTRIDGE CYCLE",
      },
      { status: 500 }
    );
  }
}
