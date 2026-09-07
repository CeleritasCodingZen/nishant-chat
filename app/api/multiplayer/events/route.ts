import { NextRequest } from "next/server";
import {
  getRoom,
  getSanitizedRoomState,
  subscribeToRoom,
} from "@/lib/services/multiplayer-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const playerId = searchParams.get("playerId") || undefined;

  if (!code) {
    return new Response("Missing room code", { status: 400 });
  }

  const room = getRoom(code);
  if (!room) {
    return new Response("Room not found", { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial state immediately
      try {
        const initialData = `data: ${JSON.stringify(
          getSanitizedRoomState(room, playerId)
        )}\n\n`;
        controller.enqueue(encoder.encode(initialData));
      } catch (err) {
        console.error("SSE initial state error:", err);
      }

      // Subscribe to broadcast events for this room
      const unsubscribe = subscribeToRoom(code, (state) => {
        try {
          const chunk = `data: ${JSON.stringify(state)}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        } catch (err) {
          console.error("SSE broadcast error:", err);
        }
      });

      // Heartbeat ping every 15s to keep connections healthy across proxies/mobile
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        unsubscribe();
        clearInterval(pingInterval);
        try {
          controller.close();
        } catch {
          /**/
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
