import { NextRequest, NextResponse } from "next/server";
import {
  createRoom,
  joinRoom,
  startMatch,
  submitAnswer,
  advanceQuestion,
  resetMatch,
  getRoom,
  getSanitizedRoomState,
} from "@/lib/services/multiplayer-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const playerId = searchParams.get("playerId") || undefined;

    if (!code) {
      return NextResponse.json(
        { error: "MISSING_ROOM_CODE // Room code query param is required." },
        { status: 400 }
      );
    }

    const room = getRoom(code);
    if (!room) {
      return NextResponse.json(
        { error: `ROOM_NOT_FOUND // Room ${code} does not exist.` },
        { status: 404 }
      );
    }

    // Update player's lastPing if playerId is passed
    if (playerId && room.players[playerId]) {
      room.players[playerId].lastPing = Date.now();
      room.players[playerId].connected = true;
    }

    const state = getSanitizedRoomState(room, playerId);
    return NextResponse.json(state);
  } catch (error: any) {
    console.error("Multiplayer GET error:", error);
    return NextResponse.json(
      { error: error?.message || "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: "MISSING_ACTION // Action parameter is required." },
        { status: 400 }
      );
    }

    switch (action) {
      case "create": {
        const { hostId, hostName, settings, rawQuestions } = body;
        if (!hostId || !hostName) {
          return NextResponse.json(
            { error: "INVALID_HOST // hostId and hostName are required." },
            { status: 400 }
          );
        }

        const room = await createRoom({
          hostId,
          hostName,
          settings: {
            roundCount: Math.min(10, Math.max(1, Number(settings?.roundCount) || 5)),
            mode: settings?.mode || "ROM // 001: WHO SAID IT?",
            targetPlayers: Math.min(8, Math.max(1, Number(settings?.targetPlayers) || 4)),
            timeLimitSeconds: Math.min(60, Math.max(5, Number(settings?.timeLimitSeconds) || 15)),
            chatTitle: settings?.chatTitle || "Group Chat Lore",
            participants: Array.isArray(settings?.participants) ? settings.participants : [],
            topQuotes: Array.isArray(settings?.topQuotes) ? settings.topQuotes : [],
          },
          rawQuestions,
        });

        return NextResponse.json(getSanitizedRoomState(room, hostId));
      }

      case "join": {
        const { code, playerId, playerName } = body;
        if (!code || !playerId || !playerName) {
          return NextResponse.json(
            { error: "INVALID_JOIN_PAYLOAD // code, playerId, and playerName are required." },
            { status: 400 }
          );
        }

        const room = joinRoom(code, playerId, playerName);
        return NextResponse.json(getSanitizedRoomState(room, playerId));
      }

      case "start": {
        const { code, hostId } = body;
        if (!code || !hostId) {
          return NextResponse.json(
            { error: "INVALID_START_PAYLOAD // code and hostId are required." },
            { status: 400 }
          );
        }

        const room = startMatch(code, hostId);
        return NextResponse.json(getSanitizedRoomState(room, hostId));
      }

      case "answer": {
        const { code, playerId, optionKey } = body;
        if (!code || !playerId || !optionKey) {
          return NextResponse.json(
            { error: "INVALID_ANSWER_PAYLOAD // code, playerId, and optionKey are required." },
            { status: 400 }
          );
        }

        const result = submitAnswer(code, playerId, optionKey);
        const room = getRoom(code);
        return NextResponse.json({
          ...result,
          room: room ? getSanitizedRoomState(room, playerId) : null,
        });
      }

      case "advance": {
        const { code, hostId } = body;
        if (!code) {
          return NextResponse.json(
            { error: "INVALID_ADVANCE_PAYLOAD // code is required." },
            { status: 400 }
          );
        }

        const room = advanceQuestion(code, hostId);
        return NextResponse.json(getSanitizedRoomState(room, hostId));
      }

      case "reset": {
        const { code, hostId } = body;
        if (!code || !hostId) {
          return NextResponse.json(
            { error: "INVALID_RESET_PAYLOAD // code and hostId are required." },
            { status: 400 }
          );
        }

        const room = resetMatch(code, hostId);
        return NextResponse.json(getSanitizedRoomState(room, hostId));
      }

      default:
        return NextResponse.json(
          { error: `UNKNOWN_ACTION // Action '${action}' is unrecognized.` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Multiplayer POST error:", error);
    return NextResponse.json(
      { error: error?.message || "TRANSACTION_FAILED" },
      { status: 400 }
    );
  }
}
