// Shared TypeScript Contracts for VYBZ // ARCADE SYSTEM 01.04

// ── OPTION CONTRACT ────────────────────────────────────────────────────────
export type ArcadeOptionKey = "A" | "B" | "C" | "D";

export interface ArcadeOption {
  key: ArcadeOptionKey;
  label: string;
  tag: string;
}

// ── QUESTION CONTRACT ──────────────────────────────────────────────────────
export interface ArcadeQuestion {
  id: string;
  round: string;
  category: string;
  prompt: string;
  quote: string;
  options: [ArcadeOption, ArcadeOption, ArcadeOption, ArcadeOption];
  correctAnswer: ArcadeOptionKey;
  explanation: string;
  difficulty: "easy" | "medium" | "hard" | "extreme";
  sourceMessageId?: string;
  sourceAuthor?: string;
  sourceType?: "WHO_SAID_IT" | "MEMORY_BANK" | "FRIENDSHIP_QUIZ" | "HOT_TAKE" | "CHAOS_MODE";
}

// ── CHAT INGESTION CONTRACT ────────────────────────────────────────────────
export interface TopQuote {
  id?: string;
  author: string;
  text: string;
  timestamp?: string;
}

export interface ChatIngestRequest {
  rawText: string;
  fileName?: string;
  sourceType?: "whatsapp" | "discord" | "telegram" | "generic";
}

export interface ChatIngestResponse {
  participants: string[];
  messageCount: number;
  topQuotes: TopQuote[];
  inferredInterests: string[];
  suggestedRom?: string;
  sampleSnippets?: string[];
}

// ── QUESTION GENERATION CONTRACT ───────────────────────────────────────────
export interface GenerateQuestionsRequest {
  gameId?: string;
  participants: string[];
  interests: string[];
  quotes?: (string | TopQuote)[];
  topQuotes?: TopQuote[];
  sourceMessages?: TopQuote[];
  romCategory?: string;
  difficulty?: string;
  count?: number;
}

export interface GenerateQuestionsResponse {
  questions: ArcadeQuestion[];
  isDemoFallback?: boolean;
  gameId?: string;
}

// ── AI GAME MASTER CONTRACT ────────────────────────────────────────────────
export type GameMasterAction =
  | "NEXT_QUESTION"
  | "HINT"
  | "BONUS_ROUND"
  | "DIFFICULTY_UP"
  | "DIFFICULTY_DOWN"
  | "GAME_END";

export interface GameMasterPlayer {
  id?: string;
  name: string;
  score: number;
}

export interface GameMasterRequest {
  round: number;
  players: GameMasterPlayer[];
  currentQuestion?: Partial<ArcadeQuestion>;
  scores: Record<string, number>;
}

export interface GameMasterResponse {
  action: GameMasterAction;
  message: string;
  difficulty?: string;
  category?: string;
}

// ── MEDIA MODERATION CONTRACT ──────────────────────────────────────────────
export interface ModerationRequest {
  id: string;
  mimeType: string;
  base64: string;
  userId?: string;
}

export interface ModerationResponse {
  allowed: boolean;
  category: string;
  confidence: number;
  reason: string;
}
