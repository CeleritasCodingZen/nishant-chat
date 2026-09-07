// In-Memory Synchronized Multiplayer Room Store for VYBZ // ARCADE SYSTEM
// Manages synchronized multi-device rooms, timers, question reveals, and leaderboard scoring.

import { ArcadeOptionKey, ArcadeQuestion, TopQuote } from "@/types/api";
import { getTriviaService } from "./index";
import { vybzDemoMessages, DEMO_PARTICIPANTS, DEMO_PARTICIPANT_TAGS } from "@/lib/mock-data/vybz-demo";

export interface MultiplayerPlayer {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  connected: boolean;
  lastPing: number;
  avatarTag: string;
  lastAnswer?: {
    questionIndex: number;
    optionKey: ArcadeOptionKey;
    isCorrect: boolean;
    responseTimeMs: number;
    pointsAwarded: number;
  };
}

export interface MultiplayerSettings {
  roundCount: number; // 3, 5, 7, 10
  mode: string; // "ROM // 001: WHO SAID IT?", etc.
  targetPlayers: number; // 1 to 8
  timeLimitSeconds: number; // 10, 15, 20, 30
  chatTitle: string;
  participants: string[];
  topQuotes?: TopQuote[];
}

export type MultiplayerRoomStatus =
  | "LOBBY"
  | "QUESTION_ACTIVE"
  | "QUESTION_REVEAL"
  | "MATCH_OVER";

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  accuracy: number;
  badgeTitle: string;
  isHost: boolean;
  tag: string;
}

export interface MultiplayerRoomState {
  code: string;
  hostId: string;
  status: MultiplayerRoomStatus;
  settings: MultiplayerSettings;
  participants: string[];
  chatTitle: string;
  quotesCount: number;
  questions: ArcadeQuestion[];
  currentQuestionIndex: number;
  questionStartTime: number | null;
  questionEndTime: number | null;
  revealEndTime: number | null;
  players: Record<string, MultiplayerPlayer>;
  createdAt: number;
  version: number;
  leaderboard?: LeaderboardEntry[];
}

// Global server singleton to maintain rooms across hot-reloads in Next.js development
declare global {
  // eslint-disable-next-line no-var
  var __vybzRooms: Map<string, MultiplayerRoomState> | undefined;
  // eslint-disable-next-line no-var
  var __vybzSseListeners: Map<string, Set<(state: any) => void>> | undefined;
  // eslint-disable-next-line no-var
  var __vybzRoomTickerStarted: boolean | undefined;
}

if (!globalThis.__vybzRooms) {
  globalThis.__vybzRooms = new Map();
}
if (!globalThis.__vybzSseListeners) {
  globalThis.__vybzSseListeners = new Map();
}

const rooms = globalThis.__vybzRooms;
const sseListeners = globalThis.__vybzSseListeners;

// Generate short 4-digit arcade code e.g. "VYBZ-4928"
export function generateRoomCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `VYBZ-${num}`;
}

// Subscribe to room updates (for SSE streaming)
export function subscribeToRoom(
  code: string,
  callback: (state: any) => void
): () => void {
  const normCode = code.toUpperCase().trim();
  if (!sseListeners.has(normCode)) {
    sseListeners.set(normCode, new Set());
  }
  const set = sseListeners.get(normCode)!;
  set.add(callback);

  return () => {
    set.delete(callback);
    if (set.size === 0) {
      sseListeners.delete(normCode);
    }
  };
}

// Broadcast room state to all connected listeners
export function broadcastRoom(code: string): void {
  const normCode = code.toUpperCase().trim();
  const room = rooms.get(normCode);
  if (!room) return;

  const listeners = sseListeners.get(normCode);
  if (listeners && listeners.size > 0) {
    // Sanitize question for client broadcast
    const clientState = getSanitizedRoomState(room);
    for (const listener of listeners) {
      try {
        listener(clientState);
      } catch (err) {
        console.error("Error broadcasting to SSE listener:", err);
      }
    }
  }
}

// Sanitize room state: mask correct answers while question is active
export function getSanitizedRoomState(
  room: MultiplayerRoomState,
  playerId?: string
): any {
  const isQuestionActive = room.status === "QUESTION_ACTIVE";
  const activeQ = room.questions[room.currentQuestionIndex];

  let sanitizedActiveQ = null;
  if (activeQ) {
    sanitizedActiveQ = {
      ...activeQ,
      correctAnswer: isQuestionActive ? undefined : activeQ.correctAnswer,
      explanation: isQuestionActive ? undefined : activeQ.explanation,
    };
  }

  // Calculate remaining seconds
  const now = Date.now();
  let remainingMs = 0;
  if (room.status === "QUESTION_ACTIVE" && room.questionEndTime) {
    remainingMs = Math.max(0, room.questionEndTime - now);
  } else if (room.status === "QUESTION_REVEAL" && room.revealEndTime) {
    remainingMs = Math.max(0, room.revealEndTime - now);
  }

  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    settings: room.settings,
    participants: room.participants,
    chatTitle: room.chatTitle,
    quotesCount: room.quotesCount,
    totalQuestions: room.questions.length,
    currentQuestionIndex: room.currentQuestionIndex,
    activeQuestion: sanitizedActiveQ,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    remainingMs,
    players: Object.values(room.players).map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      score: p.score,
      correctAnswers: p.correctAnswers,
      totalAnswers: p.totalAnswers,
      connected: p.connected,
      tag: p.avatarTag,
      hasAnsweredCurrent:
        p.lastAnswer?.questionIndex === room.currentQuestionIndex,
      lastAnswer:
        room.status === "QUESTION_REVEAL" || room.status === "MATCH_OVER"
          ? p.lastAnswer
          : p.id === playerId
          ? p.lastAnswer
          : undefined,
    })),
    leaderboard: room.leaderboard,
    version: room.version,
  };
}

// Compute Leaderboard Rankings & Custom GC Lore Titles
export function calculateLeaderboard(room: MultiplayerRoomState): LeaderboardEntry[] {
  const playersList = Object.values(room.players);

  // Sort primarily by correct answers, secondarily by total score (speed)
  playersList.sort((a, b) => {
    if (b.correctAnswers !== a.correctAnswers) {
      return b.correctAnswers - a.correctAnswers;
    }
    return b.score - a.score;
  });

  const totalRounds = room.questions.length || room.settings.roundCount || 5;

  return playersList.map((p, index) => {
    const rank = index + 1;
    let badgeTitle = "CASUAL LURKER";

    if (rank === 1 && p.correctAnswers >= Math.ceil(totalRounds * 0.7)) {
      badgeTitle = "THE GC ORACLE // #1 LORE MASTER";
    } else if (rank === 1) {
      badgeTitle = "GC HISTORIAN // MATCH WINNER";
    } else if (rank === 2) {
      badgeTitle = "VOICE NOTE SCHOLAR";
    } else if (rank === 3) {
      badgeTitle = "CHAT CONNOISSEUR";
    } else if (p.correctAnswers >= 1) {
      badgeTitle = "ACTIVE REGULAR";
    }

    const accuracy =
      p.totalAnswers > 0
        ? Math.round((p.correctAnswers / p.totalAnswers) * 100)
        : 0;

    return {
      rank,
      id: p.id,
      name: p.name,
      score: p.score,
      correctAnswers: p.correctAnswers,
      totalAnswers: p.totalAnswers,
      accuracy,
      badgeTitle,
      isHost: p.isHost,
      tag: p.avatarTag,
    };
  });
}

// Create a new multiplayer room
export async function createRoom(params: {
  hostId: string;
  hostName: string;
  settings: MultiplayerSettings;
  rawQuestions?: ArcadeQuestion[];
}): Promise<MultiplayerRoomState> {
  const code = generateRoomCode();
  const triviaService = getTriviaService();

  let questions: ArcadeQuestion[] = [];
  if (params.rawQuestions && params.rawQuestions.length > 0) {
    questions = params.rawQuestions.slice(0, params.settings.roundCount);
  } else {
    // Generate questions using the trivia service
    const participants =
      params.settings.participants.length >= 4
        ? params.settings.participants
        : [...DEMO_PARTICIPANTS];

    const res = await triviaService.generateQuestions({
      participants,
      interests: ["hackathon", "aux cord", "food", "coding", "gaming"],
      quotes: params.settings.topQuotes || [],
      topQuotes: params.settings.topQuotes || [],
      sourceMessages: (vybzDemoMessages as any[]).slice(0, 30),
      romCategory: params.settings.mode,
      count: params.settings.roundCount,
    });
    questions = res.questions.slice(0, params.settings.roundCount);
  }

  // Ensure at least 1 question exists
  if (questions.length === 0) {
    questions = [
      {
        id: "q_default_1",
        round: "ROUND 01 / 05",
        category: params.settings.mode,
        prompt: "WHO SENT THIS IN THE CHAT?",
        quote: '"guys are we actually doing the hackathon tonight"',
        correctAnswer: "A",
        options: [
          { key: "A", label: "Nishant", tag: "CHAT HISTORIAN" },
          { key: "B", label: "Kabir", tag: "CHAOS OPERATOR" },
          { key: "C", label: "Sneha", tag: "AUX TYRANT" },
          { key: "D", label: "Arjun", tag: "VOICE NOTE PHILOSOPHER" },
        ],
        explanation: "Nishant opened the group chat right before kickoff.",
        difficulty: "medium",
      },
    ];
  }

  const hostPlayer: MultiplayerPlayer = {
    id: params.hostId,
    name: params.hostName || "Host Player",
    isHost: true,
    score: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    connected: true,
    lastPing: Date.now(),
    avatarTag: DEMO_PARTICIPANT_TAGS[params.hostName] || "ARCADE HOST",
  };

  const room: MultiplayerRoomState = {
    code,
    hostId: params.hostId,
    status: "LOBBY",
    settings: params.settings,
    participants:
      params.settings.participants.length > 0
        ? params.settings.participants
        : [...DEMO_PARTICIPANTS],
    chatTitle: params.settings.chatTitle || "Group Chat Lore",
    quotesCount: (params.settings.topQuotes || []).length || 142,
    questions,
    currentQuestionIndex: 0,
    questionStartTime: null,
    questionEndTime: null,
    revealEndTime: null,
    players: {
      [params.hostId]: hostPlayer,
    },
    createdAt: Date.now(),
    version: 1,
  };

  rooms.set(code, room);
  broadcastRoom(code);
  return room;
}

// Join an existing room
export function joinRoom(
  code: string,
  playerId: string,
  playerName: string
): MultiplayerRoomState {
  const normCode = code.toUpperCase().trim();
  const room = rooms.get(normCode);
  if (!room) {
    throw new Error(`ROOM_NOT_FOUND // Room code ${normCode} does not exist.`);
  }

  if (room.players[playerId]) {
    // Reconnection
    room.players[playerId].connected = true;
    room.players[playerId].lastPing = Date.now();
    if (playerName && playerName.trim()) {
      room.players[playerId].name = playerName.trim();
    }
  } else {
    // New player
    const currentCount = Object.keys(room.players).length;
    if (currentCount >= room.settings.targetPlayers * 2) {
      throw new Error(`ROOM_FULL // Maximum player capacity reached for this room.`);
    }

    const assignedTag =
      DEMO_PARTICIPANT_TAGS[playerName] || `PLAYER #${currentCount + 1}`;

    room.players[playerId] = {
      id: playerId,
      name: playerName.trim() || `Player ${currentCount + 1}`,
      isHost: false,
      score: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      connected: true,
      lastPing: Date.now(),
      avatarTag: assignedTag,
    };
  }

  room.version++;
  broadcastRoom(normCode);
  return room;
}

// Host starts the match
export function startMatch(code: string, hostId: string): MultiplayerRoomState {
  const normCode = code.toUpperCase().trim();
  const room = rooms.get(normCode);
  if (!room) throw new Error("ROOM_NOT_FOUND");
  if (room.hostId !== hostId) throw new Error("UNAUTHORIZED // Only room host can start.");

  room.status = "QUESTION_ACTIVE";
  room.currentQuestionIndex = 0;
  const now = Date.now();
  room.questionStartTime = now;
  room.questionEndTime = now + room.settings.timeLimitSeconds * 1000;
  room.revealEndTime = null;

  // Reset player scores for new match
  for (const p of Object.values(room.players)) {
    p.score = 0;
    p.correctAnswers = 0;
    p.totalAnswers = 0;
    p.lastAnswer = undefined;
  }

  room.version++;
  broadcastRoom(normCode);
  return room;
}

// Player submits an answer
export function submitAnswer(
  code: string,
  playerId: string,
  optionKey: ArcadeOptionKey,
  clientTimestampMs?: number
): { correct: boolean; scoreDelta: number; totalScore: number } {
  const normCode = code.toUpperCase().trim();
  const room = rooms.get(normCode);
  if (!room) throw new Error("ROOM_NOT_FOUND");
  if (room.status !== "QUESTION_ACTIVE") {
    throw new Error("ROUND_INACTIVE // Answers cannot be accepted at this stage.");
  }

  const player = room.players[playerId];
  if (!player) throw new Error("PLAYER_NOT_IN_ROOM");

  // Check if player already answered this question
  if (player.lastAnswer?.questionIndex === room.currentQuestionIndex) {
    return {
      correct: player.lastAnswer.isCorrect,
      scoreDelta: player.lastAnswer.pointsAwarded,
      totalScore: player.score,
    };
  }

  const currentQ = room.questions[room.currentQuestionIndex];
  if (!currentQ) throw new Error("NO_ACTIVE_QUESTION");

  const isCorrect = optionKey === currentQ.correctAnswer;
  const now = Date.now();
  const responseTimeMs = room.questionStartTime
    ? Math.max(100, now - room.questionStartTime)
    : 1500;

  let pointsAwarded = 0;
  if (isCorrect) {
    const timeLimitMs = room.settings.timeLimitSeconds * 1000;
    const remainingMs = room.questionEndTime ? Math.max(0, room.questionEndTime - now) : 0;
    const speedRatio = Math.min(1, Math.max(0, remainingMs / timeLimitMs));
    const speedBonus = Math.round(250 * speedRatio);
    pointsAwarded = 500 + speedBonus;

    player.score += pointsAwarded;
    player.correctAnswers += 1;
  }

  player.totalAnswers += 1;
  player.lastAnswer = {
    questionIndex: room.currentQuestionIndex,
    optionKey,
    isCorrect,
    responseTimeMs,
    pointsAwarded,
  };

  // Check if all connected players have answered
  const connectedPlayers = Object.values(room.players).filter((p) => p.connected);
  const allAnswered = connectedPlayers.every(
    (p) => p.lastAnswer?.questionIndex === room.currentQuestionIndex
  );

  if (allAnswered && connectedPlayers.length > 0) {
    // Transition to reveal immediately
    room.status = "QUESTION_REVEAL";
    room.revealEndTime = Date.now() + 5000; // 5s reveal countdown
  }

  room.version++;
  broadcastRoom(normCode);

  return {
    correct: isCorrect,
    scoreDelta: pointsAwarded,
    totalScore: player.score,
  };
}

// Advance to next question or conclude match
export function advanceQuestion(
  code: string,
  requestedByHostId?: string
): MultiplayerRoomState {
  const normCode = code.toUpperCase().trim();
  const room = rooms.get(normCode);
  if (!room) throw new Error("ROOM_NOT_FOUND");

  const nextIdx = room.currentQuestionIndex + 1;
  const total = room.questions.length;

  if (nextIdx < total) {
    room.status = "QUESTION_ACTIVE";
    room.currentQuestionIndex = nextIdx;
    const now = Date.now();
    room.questionStartTime = now;
    room.questionEndTime = now + room.settings.timeLimitSeconds * 1000;
    room.revealEndTime = null;
  } else {
    // Match completed! Generate final leaderboard
    room.status = "MATCH_OVER";
    room.leaderboard = calculateLeaderboard(room);
  }

  room.version++;
  broadcastRoom(normCode);
  return room;
}

// Reset / Play Again with same players
export function resetMatch(code: string, hostId: string): MultiplayerRoomState {
  const normCode = code.toUpperCase().trim();
  const room = rooms.get(normCode);
  if (!room) throw new Error("ROOM_NOT_FOUND");
  if (room.hostId !== hostId) throw new Error("UNAUTHORIZED");

  room.status = "LOBBY";
  room.currentQuestionIndex = 0;
  room.questionStartTime = null;
  room.questionEndTime = null;
  room.revealEndTime = null;
  room.leaderboard = undefined;

  for (const p of Object.values(room.players)) {
    p.score = 0;
    p.correctAnswers = 0;
    p.totalAnswers = 0;
    p.lastAnswer = undefined;
  }

  room.version++;
  broadcastRoom(normCode);
  return room;
}

// Get room by code
export function getRoom(code: string): MultiplayerRoomState | undefined {
  const normCode = code.toUpperCase().trim();
  return rooms.get(normCode);
}

// Background room ticker: handles time-outs for questions and reveals
function runRoomTicker(): void {
  const now = Date.now();

  for (const [code, room] of rooms.entries()) {
    // 1. If Question is active and time limit has expired
    if (room.status === "QUESTION_ACTIVE" && room.questionEndTime) {
      if (now >= room.questionEndTime) {
        room.status = "QUESTION_REVEAL";
        room.revealEndTime = now + 5000; // 5 seconds reveal
        room.version++;
        broadcastRoom(code);
      }
    }
    // 2. If Question is in reveal and reveal countdown ended
    else if (room.status === "QUESTION_REVEAL" && room.revealEndTime) {
      if (now >= room.revealEndTime) {
        advanceQuestion(code);
      }
    }

    // 3. Stale room cleanup (older than 3 hours)
    if (now - room.createdAt > 3 * 60 * 60 * 1000) {
      rooms.delete(code);
      sseListeners.delete(code);
    }
  }
}

// Start singleton ticker once
if (!globalThis.__vybzRoomTickerStarted) {
  globalThis.__vybzRoomTickerStarted = true;
  setInterval(runRoomTicker, 500);
}
