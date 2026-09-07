// Service Abstraction & Factory for VYBZ // ARCADE SYSTEM
// Allows seamless switching between Mock AI Service and Gemini Production Service

import {
  ChatIngestResponse,
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
  GameMasterRequest,
  GameMasterResponse,
  ModerationRequest,
  ModerationResponse,
} from "@/types/api";

import {
  MockChatAnalysisService,
  MockTriviaService,
  MockGameMasterService,
  MockModerationService,
} from "./mock-ai";

import { parseChatLog } from "./chat-parser";
import { generateArcadeQuestions, executeGameMaster as executeGeminiGameMaster } from "./ai-trivia";
import { moderateMediaContent } from "./moderation";

// ── SERVICE INTERFACES ──────────────────────────────────────────────────────
export interface ChatAnalysisService {
  ingestChat(rawText?: string, fileName?: string): Promise<ChatIngestResponse>;
}

export interface TriviaService {
  generateQuestions(req: GenerateQuestionsRequest): Promise<GenerateQuestionsResponse>;
}

export interface GameMasterService {
  executeGameMaster(req: GameMasterRequest): Promise<GameMasterResponse>;
}

export interface ModerationService {
  moderateMedia(req: ModerationRequest): Promise<ModerationResponse>;
}

// ── PRODUCTION GEMINI SERVICE WRAPPERS ──────────────────────────────────────
class ProductionChatAnalysisService implements ChatAnalysisService {
  async ingestChat(rawText?: string, fileName?: string): Promise<ChatIngestResponse> {
    return parseChatLog(rawText || "", fileName);
  }
}

class GeminiTriviaService implements TriviaService {
  async generateQuestions(req: GenerateQuestionsRequest): Promise<GenerateQuestionsResponse> {
    return generateArcadeQuestions(req);
  }
}

class GeminiGameMasterService implements GameMasterService {
  async executeGameMaster(req: GameMasterRequest): Promise<GameMasterResponse> {
    return executeGeminiGameMaster(req);
  }
}

class GeminiModerationService implements ModerationService {
  async moderateMedia(req: ModerationRequest): Promise<ModerationResponse> {
    return moderateMediaContent(req);
  }
}

// ── SINGLETON INSTANCES ─────────────────────────────────────────────────────
const mockChatService = new MockChatAnalysisService();
const mockTriviaService = new MockTriviaService();
const mockGameMasterService = new MockGameMasterService();
const mockModerationService = new MockModerationService();

const prodChatService = new ProductionChatAnalysisService();
const geminiTriviaService = new GeminiTriviaService();
const geminiGameMasterService = new GeminiGameMasterService();
const geminiModerationService = new GeminiModerationService();

// Check if system should run in Mock AI mode
export function isMockMode(): boolean {
  // Default to mock mode if MOCK_AI is not explicitly set to 'false' or if GEMINI_API_KEY is unset
  if (process.env.MOCK_AI === "false" && process.env.GEMINI_API_KEY) {
    return false;
  }
  return true;
}

// ── SERVICE FACTORY FUNCTIONS ───────────────────────────────────────────────
export function getChatAnalysisService(): ChatAnalysisService {
  if (isMockMode()) {
    return mockChatService;
  }
  return prodChatService;
}

export function getTriviaService(): TriviaService {
  if (isMockMode()) {
    return mockTriviaService;
  }
  return geminiTriviaService;
}

export function getGameMasterService(): GameMasterService {
  if (isMockMode()) {
    return mockGameMasterService;
  }
  return geminiGameMasterService;
}

export function getModerationService(): ModerationService {
  if (isMockMode()) {
    return mockModerationService;
  }
  return geminiModerationService;
}

// Re-exports
export * from "./mock-ai";
export * from "./chat-parser";
export * from "./ai-trivia";
export * from "./moderation";
