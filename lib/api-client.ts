// Centralized Typed Browser API Client for VYBZ // ARCADE SYSTEM

import {
  ChatIngestRequest,
  ChatIngestResponse,
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
  GameMasterRequest,
  GameMasterResponse,
  ModerationRequest,
  ModerationResponse,
  ArcadeOptionKey,
  ArcadeQuestion,
} from "@/types/api";
import type {
  MultiplayerSettings,
} from "@/lib/services/multiplayer-store";

class ApiClient {
  private async postJson<TRequest, TResponse>(
    url: string,
    payload: TRequest
  ): Promise<TResponse> {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error ${res.status}: ${res.statusText}`
      );
    }

    return res.json();
  }

  // 1. Ingest raw chat export
  public async ingestChat(
    rawText: string,
    fileName?: string
  ): Promise<ChatIngestResponse> {
    return this.postJson<ChatIngestRequest, ChatIngestResponse>(
      "/api/chat/ingest",
      { rawText, fileName }
    );
  }

  // 2. Generate trivia questions based on chat lore
  public async generateQuestions(
    params: GenerateQuestionsRequest
  ): Promise<GenerateQuestionsResponse> {
    return this.postJson<GenerateQuestionsRequest, GenerateQuestionsResponse>(
      "/api/questions/generate",
      params
    );
  }

  // 3. Request dynamic AI Game Master event/action
  public async runGameMaster(
    params: GameMasterRequest
  ): Promise<GameMasterResponse> {
    return this.postJson<GameMasterRequest, GameMasterResponse>(
      "/api/game/master",
      params
    );
  }

  // 4. Moderate uploaded media
  public async moderateMedia(
    params: ModerationRequest
  ): Promise<ModerationResponse> {
    return this.postJson<ModerationRequest, ModerationResponse>(
      "/api/media/moderate",
      params
    );
  }

  // ── MULTIPLAYER API ────────────────────────────────────────────────────────
  public async createRoom(
    hostId: string,
    hostName: string,
    settings: MultiplayerSettings,
    rawQuestions?: ArcadeQuestion[]
  ): Promise<any> {
    return this.postJson("/api/multiplayer/room", {
      action: "create",
      hostId,
      hostName,
      settings,
      rawQuestions,
    });
  }

  public async joinRoom(
    code: string,
    playerId: string,
    playerName: string
  ): Promise<any> {
    return this.postJson("/api/multiplayer/room", {
      action: "join",
      code,
      playerId,
      playerName,
    });
  }

  public async startMatch(code: string, hostId: string): Promise<any> {
    return this.postJson("/api/multiplayer/room", {
      action: "start",
      code,
      hostId,
    });
  }

  public async submitAnswer(
    code: string,
    playerId: string,
    optionKey: ArcadeOptionKey
  ): Promise<any> {
    return this.postJson("/api/multiplayer/room", {
      action: "answer",
      code,
      playerId,
      optionKey,
    });
  }

  public async advanceQuestion(code: string, hostId?: string): Promise<any> {
    return this.postJson("/api/multiplayer/room", {
      action: "advance",
      code,
      hostId,
    });
  }

  public async resetMatch(code: string, hostId: string): Promise<any> {
    return this.postJson("/api/multiplayer/room", {
      action: "reset",
      code,
      hostId,
    });
  }

  public async getRoomStatus(code: string, playerId?: string): Promise<any> {
    const url = `/api/multiplayer/room?code=${encodeURIComponent(
      code
    )}${playerId ? `&playerId=${encodeURIComponent(playerId)}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }
    return res.json();
  }
}

export const apiClient = new ApiClient();
