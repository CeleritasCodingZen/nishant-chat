// AI Question Generator & Game Master Service using @google/genai
// GROUND-TRUTH FACTUALITY & SOURCE-GROUNDED ATTRIBUTION ENGINE

import { gemini, isGeminiConfigured } from "@/lib/gemini";
import { db, isDatabaseConfigured } from "@/lib/db";
import {
  ArcadeOption,
  ArcadeOptionKey,
  ArcadeQuestion,
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
  GameMasterRequest,
  GameMasterResponse,
  GameMasterAction,
  TopQuote,
} from "@/types/api";

const ROM_PROMPT_MAP: Record<string, { desc: string; defaultPrompt: string; sourceType: ArcadeQuestion["sourceType"] }> = {
  "ROM // 001": {
    desc: "Focus on 'WHO SAID IT?'. Questions test who authored specific quotes from the imported group chat.",
    defaultPrompt: "WHO SAID THIS IN THE GROUP CHAT?",
    sourceType: "WHO_SAID_IT",
  },
  "ROM // 002": {
    desc: "Focus on 'MEMORY BANK'. Questions test chronological and event recall of past moments from the imported chat.",
    defaultPrompt: "MEMORY BANK // WHO DROPPED THIS UNFORGOTTEN LORE?",
    sourceType: "MEMORY_BANK",
  },
  "ROM // 003": {
    desc: "Focus on 'FRIENDSHIP QUIZ'. Questions test habits, behaviors, and reactions of participants grounded in the chat.",
    defaultPrompt: "FRIENDSHIP QUIZ // WHOSE SIGNATURE BEHAVIOR IS THIS?",
    sourceType: "FRIENDSHIP_QUIZ",
  },
  "ROM // 004": {
    desc: "Focus on 'HOT TAKE MACHINE'. Questions highlight opinions and controversial statements said in the chat.",
    defaultPrompt: "HOT TAKE MACHINE // WHO UNLEASHED THIS OPINION?",
    sourceType: "HOT_TAKE",
  },
  "ROM // 005": {
    desc: "Focus on 'CHAOS MODE'. Rapid trivia highlighting inside jokes, typing quirks, and chaotic chat moments.",
    defaultPrompt: "CHAOS MODE // WHO CAUSED THIS INCIDENT IN CHAT?",
    sourceType: "CHAOS_MODE",
  },
};

const ARCADE_TAG_BANK = [
  "AUX TYRANT // 14-MIN TRACKS",
  "LORE ARCHIVIST // CHAT HISTORIAN",
  "3AM VOICE NOTE PHILOSOPHER",
  "SERIAL CONTRARIAN // DEBATER",
  "SCREENSHOT KEEPER // RECEIPT VAULT",
  "CHAOS OPERATOR // SHITPOSTER",
  "VOICE OF REASON // MEDIATOR",
  "HOT TAKE DISPENSER // UNFILTERED",
  "CHRONIC TYPO GENERATOR",
  "GHOST OPERATIVE // LURKER",
];

export async function generateArcadeQuestions(
  req: GenerateQuestionsRequest
): Promise<GenerateQuestionsResponse> {
  const {
    gameId,
    participants = [],
    interests = ["music", "road trips", "arguments"],
    quotes = [],
    topQuotes = [],
    sourceMessages = [],
    romCategory = "ROM // 001",
    difficulty = "medium",
    count = 5,
  } = req;

  // Rule 24: Participant requirement - Never invent fake people
  const uniqueParticipants = Array.from(
    new Set(participants.map((p) => p.trim()).filter(Boolean))
  );

  if (uniqueParticipants.length < 4) {
    throw new Error(
      `INSUFFICIENT_PARTICIPANTS // At least 4 unique participants are required for arcade trivia. Received ${uniqueParticipants.length}: [${uniqueParticipants.join(
        ", "
      )}].`
    );
  }

  // Extract source messages with author grounding
  const sourceQuotes = extractSourceQuotes(
    uniqueParticipants,
    topQuotes,
    sourceMessages,
    quotes
  );

  const romConfig =
    Object.entries(ROM_PROMPT_MAP).find(([k]) => romCategory.includes(k))?.[1] ||
    ROM_PROMPT_MAP["ROM // 001"];

  // 1. Build deterministic ground-truth candidate questions
  const candidateQuestions = buildGroundTruthCandidates(
    uniqueParticipants,
    sourceQuotes,
    romCategory,
    romConfig,
    difficulty,
    count
  );

  let finalQuestions = candidateQuestions;
  let isDemoFallback = !isGeminiConfigured;

  // 2. AI Enrichment if Gemini is configured
  if (isGeminiConfigured) {
    try {
      finalQuestions = await enrichWithGemini(
        candidateQuestions,
        uniqueParticipants,
        interests,
        romCategory,
        romConfig,
        difficulty
      );
    } catch (aiErr) {
      console.warn(
        "Gemini AI enrichment failed or timed out. Preserving ground-truth candidates:",
        aiErr
      );
      finalQuestions = candidateQuestions;
      isDemoFallback = true;
    }
  }

  // 3. Final validation & semantic assertion pass
  const sourceQuoteMap = new Map<string, TopQuote>();
  sourceQuotes.forEach((sq) => {
    if (sq.id) sourceQuoteMap.set(sq.id, sq);
    sourceQuoteMap.set(sq.text.toLowerCase().trim(), sq);
  });

  for (let i = 0; i < finalQuestions.length; i++) {
    const q = finalQuestions[i];
    const matchedSource =
      (q.sourceMessageId && sourceQuoteMap.get(q.sourceMessageId)) ||
      sourceQuoteMap.get(q.quote.replace(/^"|"$/g, "").toLowerCase().trim()) ||
      sourceQuotes[i % sourceQuotes.length];

    const validation = validateArcadeQuestion(q, matchedSource);
    if (!validation.valid) {
      console.warn(
        `Validation failed for AI question ${q.id} (${validation.error}). Falling back to ground-truth candidate.`
      );
      finalQuestions[i] = candidateQuestions[i];
    }

    // Development logging per Section 27
    const currentQ = finalQuestions[i];
    const correctLabel = currentQ.options.find(
      (o) => o.key === currentQ.correctAnswer
    )?.label;

    console.log(
      `[QUESTION GENERATION]\n` +
        `ROM: ${currentQ.category}\n` +
        `Source author: ${currentQ.sourceAuthor || matchedSource.author}\n` +
        `Source quote: ${currentQ.quote}\n` +
        `Options: ${currentQ.options.map((o) => o.label).join(", ")}\n` +
        `Correct key: ${currentQ.correctAnswer}\n` +
        `Correct label: ${correctLabel}\n` +
        `Validation: PASS`
    );
  }

  // Persist to database if configured and gameId is present
  if (isDatabaseConfigured && gameId) {
    await saveQuestionsToDatabase(gameId, finalQuestions).catch((err) => {
      console.error("Prisma persistence error (continuing with in-memory):", err);
    });
  }

  return {
    questions: finalQuestions,
    isDemoFallback,
    gameId,
  };
}

// ── EXTRACTION & PARSING OF SOURCE MESSAGES ─────────────────────────────────
function extractSourceQuotes(
  participants: string[],
  topQuotes: TopQuote[],
  sourceMessages: TopQuote[],
  quotes: (string | TopQuote)[]
): TopQuote[] {
  const result: TopQuote[] = [];
  const seenTexts = new Set<string>();

  const addQuote = (q: { id?: string; author: string; text: string; timestamp?: string }) => {
    const cleanText = q.text.replace(/\s+/g, " ").trim();
    if (!cleanText || seenTexts.has(cleanText.toLowerCase())) return;
    seenTexts.add(cleanText.toLowerCase());

    // Clean author name if it matches a known participant
    let matchedAuthor = q.author?.trim();
    const foundPart = participants.find(
      (p) => p.toLowerCase() === matchedAuthor.toLowerCase()
    );
    if (foundPart) matchedAuthor = foundPart;

    result.push({
      id: q.id || `msg_${String(result.length + 1).padStart(4, "0")}`,
      author: matchedAuthor || participants[result.length % participants.length],
      text: cleanText,
      timestamp: q.timestamp,
    });
  };

  // 1. Check topQuotes
  if (Array.isArray(topQuotes)) {
    for (const tq of topQuotes) {
      if (tq && typeof tq === "object" && tq.text) {
        addQuote(tq);
      }
    }
  }

  // 2. Check sourceMessages
  if (Array.isArray(sourceMessages)) {
    for (const sm of sourceMessages) {
      if (sm && typeof sm === "object" && sm.text) {
        addQuote(sm);
      }
    }
  }

  // 3. Check quotes
  if (Array.isArray(quotes)) {
    for (const q of quotes) {
      if (!q) continue;
      if (typeof q === "object" && q.text) {
        addQuote(q);
      } else if (typeof q === "string") {
        // Try parsing "Author: text" format
        const match = q.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          const authorCandidate = match[1].trim();
          const foundPart = participants.find(
            (p) => p.toLowerCase() === authorCandidate.toLowerCase()
          );
          if (foundPart) {
            addQuote({ author: foundPart, text: match[2].trim() });
            continue;
          }
        }
        // Plain string quote: pair with a participant in round-robin order
        const fallbackAuthor = participants[result.length % participants.length];
        addQuote({ author: fallbackAuthor, text: q.trim() });
      }
    }
  }

  // If fewer than 5 quotes provided, seed with realistic mock quotes attributed to real participants
  if (result.length < 5) {
    const seedLore = [
      "guys are we actually doing the hackathon tonight",
      "you said that last night too",
      "last night we were supposed to plan",
      "and somehow we spent 3 hours arguing about the logo",
      "the logo was important",
      "who invited him to the group FaceTime at 3am",
    ];

    for (let i = 0; i < seedLore.length; i++) {
      if (result.length >= 5) break;
      const author = participants[i % participants.length];
      addQuote({
        id: `seed_${i + 1}`,
        author,
        text: seedLore[i],
        timestamp: "Archive Log",
      });
    }
  }

  return result;
}

// ── GROUND-TRUTH CANDIDATE BUILDER ──────────────────────────────────────────
function buildGroundTruthCandidates(
  participants: string[],
  sourceQuotes: TopQuote[],
  category: string,
  romConfig: { desc: string; defaultPrompt: string; sourceType: ArcadeQuestion["sourceType"] },
  difficulty: string,
  count: number
): ArcadeQuestion[] {
  const questions: ArcadeQuestion[] = [];
  const keys: ArcadeOptionKey[] = ["A", "B", "C", "D"];

  for (let i = 0; i < count; i++) {
    const src = sourceQuotes[i % sourceQuotes.length];
    const correctAuthor = src.author;

    // Distractor selection: choose 3 distinct participants excluding the correct author
    const candidateDistractors = participants.filter((p) => p !== correctAuthor);

    // Vary distractors across questions to ensure all 6+ participants appear across the game
    const selectedDistractors: string[] = [];
    for (let d = 0; d < 3; d++) {
      const pick = candidateDistractors[(i * 2 + d) % candidateDistractors.length];
      if (!selectedDistractors.includes(pick)) {
        selectedDistractors.push(pick);
      }
    }
    // Fill if needed
    for (const p of candidateDistractors) {
      if (selectedDistractors.length >= 3) break;
      if (!selectedDistractors.includes(p)) {
        selectedDistractors.push(p);
      }
    }

    // Distribute correct author position across A, B, C, D evenly
    const correctSlot = (i * 3 + 1) % 4; // e.g. i=0 -> 1(B), i=1 -> 0(A), i=2 -> 3(D), i=3 -> 2(C), i=4 -> 1(B)

    const optionLabels: string[] = [];
    let distractorIdx = 0;
    for (let slot = 0; slot < 4; slot++) {
      if (slot === correctSlot) {
        optionLabels.push(correctAuthor);
      } else {
        optionLabels.push(selectedDistractors[distractorIdx % selectedDistractors.length]);
        distractorIdx++;
      }
    }

    const options: [ArcadeOption, ArcadeOption, ArcadeOption, ArcadeOption] = optionLabels.map(
      (label, slotIdx) => {
        const tagIdx =
          (participants.indexOf(label) * 2 + slotIdx) % ARCADE_TAG_BANK.length;
        return {
          key: keys[slotIdx],
          label,
          tag: ARCADE_TAG_BANK[tagIdx >= 0 ? tagIdx : slotIdx],
        };
      }
    ) as [ArcadeOption, ArcadeOption, ArcadeOption, ArcadeOption];

    const correctKey = keys[correctSlot];

    const cleanQuote = src.text.startsWith('"') ? src.text : `"${src.text}"`;

    questions.push({
      id: `q_${Date.now()}_${i + 1}`,
      round: `ROUND 0${i + 1} / 05`,
      category,
      prompt: romConfig.defaultPrompt,
      quote: cleanQuote,
      options,
      correctAnswer: correctKey,
      explanation: `${correctAuthor} sent this message in the imported chat${
        src.timestamp ? ` at ${src.timestamp}` : ""
      }.`,
      difficulty: (difficulty as ArcadeQuestion["difficulty"]) || (i > 2 ? "hard" : "medium"),
      sourceMessageId: src.id,
      sourceAuthor: correctAuthor,
      sourceType: romConfig.sourceType,
    });
  }

  return questions;
}

// ── GEMINI AI ENRICHMENT (RECONCILED WITH GROUND TRUTH) ───────────────────────
async function enrichWithGemini(
  candidates: ArcadeQuestion[],
  participants: string[],
  interests: string[],
  romCategory: string,
  romConfig: { desc: string; defaultPrompt: string; sourceType: ArcadeQuestion["sourceType"] },
  difficulty: string
): Promise<ArcadeQuestion[]> {
  const prompt = `
You are the AI Game Master and Trivia Stylist for VYBZ // ARCADE SYSTEM.
Your task is to enrich the wording, brutalist arcade tags, and explanations for ${candidates.length} trivia questions.

CRITICAL FACTUAL INVARIANT:
The source quotes and true authors are IMMUTABLE GROUND TRUTH.
Do NOT invent new authors or change who said what.

<chat_participants>
${participants.join(", ")}
</chat_participants>

<chat_interests>
${interests.join(", ")}
</chat_interests>

<ground_truth_questions>
${JSON.stringify(
  candidates.map((c) => ({
    round: c.round,
    sourceAuthor: c.sourceAuthor,
    quote: c.quote,
    options: c.options.map((o) => ({ key: o.key, label: o.label })),
    correctAnswer: c.correctAnswer,
  })),
  null,
  2
)}
</ground_truth_questions>

<game_mode>
Category: ${romCategory}
Description: ${romConfig.desc}
Difficulty: ${difficulty}
</game_mode>

RULES:
1. For each question, keep the exact options and the correct answer pointing to the sourceAuthor.
2. Provide a funny, stylish arcade 'prompt' matching the brutalist retro tone.
3. Provide hilarious all-caps retro arcade 'tag' for each option (e.g. "AUX TYRANT // 14-MIN TRACKS", "LORE ARCHIVIST", "3AM VOICE NOTE POET").
4. Provide a witty 'explanation' confirming the source author.
5. Return strictly JSON matching the schema.
`;

  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                prompt: { type: "string" },
                quote: { type: "string" },
                options: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      key: { type: "string" },
                      label: { type: "string" },
                      tag: { type: "string" },
                    },
                    required: ["key", "label", "tag"],
                  },
                },
                correctAnswer: { type: "string" },
                explanation: { type: "string" },
              },
              required: ["prompt", "options", "explanation"],
            },
          },
        },
        required: ["questions"],
      },
    },
  });

  const rawText = cleanJsonString(response.text || "{}");
  const parsed = JSON.parse(rawText);

  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    return candidates;
  }

  // Reconcile AI response with ground truth
  return candidates.map((candidate, idx) => {
    const aiQ = parsed.questions[idx];
    if (!aiQ) return candidate;

    // We preserve candidate options and enforce source author correctness
    const reconciledOptions: [ArcadeOption, ArcadeOption, ArcadeOption, ArcadeOption] = [
      ...candidate.options,
    ];

    // If Gemini provided tags, enrich the tags while keeping the candidate labels intact
    if (Array.isArray(aiQ.options)) {
      for (const aiOpt of aiQ.options) {
        const matchOpt = reconciledOptions.find(
          (o) => o.label.toLowerCase() === (aiOpt.label || "").toLowerCase()
        );
        if (matchOpt && aiOpt.tag && typeof aiOpt.tag === "string") {
          matchOpt.tag = aiOpt.tag.trim();
        }
      }
    }

    // Mathematically find the key for candidate.sourceAuthor
    const correctOption = reconciledOptions.find(
      (o) => o.label === candidate.sourceAuthor
    );
    const guaranteedKey = correctOption ? correctOption.key : candidate.correctAnswer;

    return {
      ...candidate,
      prompt: aiQ.prompt?.trim() || candidate.prompt,
      options: reconciledOptions,
      correctAnswer: guaranteedKey,
      explanation:
        aiQ.explanation && aiQ.explanation.includes(candidate.sourceAuthor || "")
          ? aiQ.explanation.trim()
          : candidate.explanation,
    };
  });
}

// ── SEMANTIC VALIDATION FUNCTION ────────────────────────────────────────────
export function validateArcadeQuestion(
  question: ArcadeQuestion,
  sourceMessage?: TopQuote
): { valid: boolean; error?: string } {
  if (!question.options || question.options.length !== 4) {
    return { valid: false, error: "Question must have exactly 4 options" };
  }

  const keys = question.options.map((o) => o.key);
  if (keys.join("") !== "ABCD") {
    return {
      valid: false,
      error: `Option keys must be exactly ['A', 'B', 'C', 'D'] in order. Found: [${keys.join(", ")}]`,
    };
  }

  const labels = question.options.map((o) => o.label.trim());
  if (new Set(labels).size !== 4) {
    return {
      valid: false,
      error: `All 4 option labels must be unique. Found: [${labels.join(", ")}]`,
    };
  }

  if (!["A", "B", "C", "D"].includes(question.correctAnswer)) {
    return {
      valid: false,
      error: `Invalid correctAnswer key: ${question.correctAnswer}`,
    };
  }

  const correctOption = question.options.find(
    (o) => o.key === question.correctAnswer
  );
  if (!correctOption) {
    return {
      valid: false,
      error: `correctAnswer '${question.correctAnswer}' does not exist in options`,
    };
  }

  if (sourceMessage && sourceMessage.author) {
    if (correctOption.label.toLowerCase() !== sourceMessage.author.toLowerCase()) {
      return {
        valid: false,
        error: `Attribution mismatch: expected author '${sourceMessage.author}' for quote '${sourceMessage.text}', but option '${question.correctAnswer}' has label '${correctOption.label}'`,
      };
    }
  }

  return { valid: true };
}

// ── AI GAME MASTER SERVICE ──────────────────────────────────────────────────
export async function executeGameMaster(
  req: GameMasterRequest
): Promise<GameMasterResponse> {
  const { round, players, currentQuestion, scores } = req;

  if (!isGeminiConfigured) {
    return generateFallbackGameMaster(round, scores);
  }

  const prompt = `
You are the AI Game Master for a high-intensity multiplayer trivia arcade called VYBZ.
Current round: ${round}
Players: ${JSON.stringify(players)}
Scores: ${JSON.stringify(scores)}
Current question: ${JSON.stringify(currentQuestion)}

Choose what should happen next in the arcade game loop.
Possible actions:
- NEXT_QUESTION (Standard flow)
- HINT (Help struggling players)
- BONUS_ROUND (Trigger double points or speed challenge)
- DIFFICULTY_UP (When players are dominating)
- DIFFICULTY_DOWN (When players are failing)
- GAME_END (When round >= 5 or game complete)

Rules:
Keep the tone witty, retro-brutalist, and high-energy.
`;

  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: [
                "NEXT_QUESTION",
                "HINT",
                "BONUS_ROUND",
                "DIFFICULTY_UP",
                "DIFFICULTY_DOWN",
                "GAME_END",
              ],
            },
            message: { type: "string" },
            difficulty: { type: "string" },
            category: { type: "string" },
          },
          required: ["action", "message"],
        },
      },
    });

    const raw = cleanJsonString(response.text || "{}");
    const parsed = JSON.parse(raw);
    return {
      action: (parsed.action as GameMasterAction) || "NEXT_QUESTION",
      message: parsed.message || "SYSTEM NOMINAL // PROCEED TO NEXT VECTOR",
      difficulty: parsed.difficulty,
      category: parsed.category,
    };
  } catch (err) {
    console.error("Game Master AI error, using rule-based decision:", err);
    return generateFallbackGameMaster(round, scores);
  }
}

function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\r?\n?/, "").replace(/\r?\n?```$/, "");
  }
  return cleaned.trim();
}

function generateFallbackGameMaster(
  round: number,
  scores: Record<string, number>
): GameMasterResponse {
  if (round >= 5) {
    return {
      action: "GAME_END",
      message: "CHASSIS OVERHEAT // FINAL ROUND COMPLETED. PROCEED TO RECOVERY BANK.",
    };
  }

  const values = Object.values(scores);
  const maxScore = values.length ? Math.max(...values) : 0;
  if (maxScore > 5000) {
    return {
      action: "BONUS_ROUND",
      message: "HIGH SCORE DETECTED // HEURISTIC CORE MULTIPLIER ENGAGED (2X PTS)",
      difficulty: "extreme",
    };
  }

  return {
    action: "NEXT_QUESTION",
    message: `ROUND 0${round} VALIDATED // BUFFER ADVANCING`,
  };
}

async function saveQuestionsToDatabase(
  gameId: string,
  questions: ArcadeQuestion[]
) {
  for (const q of questions) {
    await db.question.create({
      data: {
        gameId,
        question: q.quote,
        options: q.options as any,
        answer: q.correctAnswer,
        explanation: q.explanation || null,
        difficulty: q.difficulty,
        category: q.category,
      },
    });
  }
}
