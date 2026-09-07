// Mock AI Service for VYBZ // ARCADE SYSTEM
// Fully offline, deterministic service layer maintaining 100% production API parity

import {
  ArcadeOption,
  ArcadeOptionKey,
  ArcadeQuestion,
  ChatIngestResponse,
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
  GameMasterRequest,
  GameMasterResponse,
  ModerationRequest,
  ModerationResponse,
  TopQuote,
} from "@/types/api";
import {
  vybzDemoMessages,
  DEMO_PARTICIPANTS,
  DEMO_PARTICIPANT_TAGS,
  MockChatMessage,
} from "@/lib/mock-data/vybz-demo";

// Artificial latency helper (Section 14)
async function simulateLatency(minMs: number, maxMs: number): Promise<void> {
  if (process.env.MOCK_AI_LATENCY === "false") return;
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

function checkSimulatedFailure(operation: string): void {
  if (process.env.MOCK_AI_FAILURE === "true") {
    throw new Error(`MOCK_FAILURE // Simulated failure in ${operation} for test harness.`);
  }
}

// ── 1. MOCK CHAT ANALYSIS SERVICE ───────────────────────────────────────────
export class MockChatAnalysisService {
  async ingestChat(rawText?: string, fileName?: string): Promise<ChatIngestResponse> {
    checkSimulatedFailure("ingestChat");
    await simulateLatency(800, 1400);

    const messageCount = vybzDemoMessages.length;
    const participants = [...DEMO_PARTICIPANTS];

    // Select key top quotes from the mock dataset
    const topQuoteMessageIds = ["msg_0001", "msg_0002", "msg_0003", "msg_0004", "msg_0005", "msg_0019", "msg_0021", "msg_0038"];
    const topQuotes: TopQuote[] = topQuoteMessageIds.map((id) => {
      const msg = vybzDemoMessages.find((m) => m.id === id)!;
      return {
        id: msg.id,
        author: msg.author,
        text: msg.text,
        timestamp: msg.timestamp,
      };
    });

    return {
      participants,
      messageCount,
      topQuotes,
      inferredInterests: ["hackathon", "arcade", "pizza", "music", "logos", "discussions"],
      suggestedRom: "ROM // 001: WHO SAID IT?",
      sampleSnippets: vybzDemoMessages.slice(0, 5).map((m) => `${m.author}: ${m.text}`),
    };
  }
}

// ── 2. MOCK TRIVIA GENERATOR SERVICE ─────────────────────────────────────────
export class MockTriviaService {
  async generateQuestions(req: GenerateQuestionsRequest): Promise<GenerateQuestionsResponse> {
    checkSimulatedFailure("generateQuestions");
    await simulateLatency(1200, 1800);

    const {
      participants = [...DEMO_PARTICIPANTS],
      romCategory = "ROM // 001",
      topQuotes = [],
      sourceMessages = [],
      count = 5,
      gameId,
    } = req;

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

    let questions: ArcadeQuestion[];

    if (romCategory.includes("002")) {
      questions = this.buildRom002MemoryBank(uniqueParticipants, count);
    } else if (romCategory.includes("003")) {
      questions = this.buildRom003FriendshipQuiz(uniqueParticipants, count);
    } else if (romCategory.includes("004")) {
      questions = this.buildRom004HotTake(uniqueParticipants, count);
    } else if (romCategory.includes("005")) {
      questions = this.buildRom005ChaosMode(uniqueParticipants, count);
    } else {
      // Default: ROM 001 WHO SAID IT?
      questions = this.buildRom001WhoSaidIt(uniqueParticipants, topQuotes, sourceMessages, count);
    }

    // Semantic assertions & development logging
    for (const q of questions) {
      const correctOpt = q.options.find((o) => o.key === q.correctAnswer);
      if (!correctOpt) {
        throw new Error(`CRITICAL_ASSERTION // Question ${q.id} missing correct option key`);
      }
      if (q.sourceType === "WHO_SAID_IT" && q.sourceAuthor) {
        if (correctOpt.label !== q.sourceAuthor) {
          throw new Error(
            `ATTRIBUTION_MISMATCH // Question ${q.id}: expected author '${q.sourceAuthor}', got option '${correctOpt.label}'`
          );
        }
      }

      console.log(
        `[MOCK AI // QUESTION GENERATION]\n` +
          `ROM: ${q.category}\n` +
          `Prompt: ${q.prompt}\n` +
          `Quote: ${q.quote}\n` +
          `Correct: [${q.correctAnswer}] ${correctOpt.label}\n` +
          `Options: ${q.options.map((o) => `[${o.key}] ${o.label}`).join(", ")}\n` +
          `Source Message: ${q.sourceMessageId || "N/A"}\n` +
          `Validation: PASS`
      );
    }

    return {
      questions,
      isDemoFallback: true,
      gameId,
    };
  }

  // ROM 001: WHO SAID IT? (Strict Factual Quote Attribution)
  private buildRom001WhoSaidIt(
    participants: string[],
    topQuotes: TopQuote[],
    sourceMessages: TopQuote[],
    count: number
  ): ArcadeQuestion[] {
    const keys: ArcadeOptionKey[] = ["A", "B", "C", "D"];
    const quotesPool = (topQuotes.length >= 5 ? topQuotes : sourceMessages.length >= 5 ? sourceMessages : [
      { id: "msg_0001", author: "Nishant", text: "guys are we actually doing the hackathon tonight", timestamp: "18:05" },
      { id: "msg_0002", author: "Riya", text: "you said that last night too", timestamp: "18:11" },
      { id: "msg_0003", author: "Kabir", text: "last night we were supposed to plan", timestamp: "18:14" },
      { id: "msg_0004", author: "Sneha", text: "and somehow we spent 3 hours arguing about the logo", timestamp: "18:17" },
      { id: "msg_0005", author: "Dev", text: "the logo was important", timestamp: "18:20" },
    ]);

    const questions: ArcadeQuestion[] = [];

    for (let i = 0; i < count; i++) {
      const src = quotesPool[i % quotesPool.length];
      const correctAuthor = src.author;

      // Select 3 distinct distractors from participants excluding the author
      const candidateDistractors = participants.filter((p) => p !== correctAuthor);
      const selectedDistractors: string[] = [];

      for (let d = 0; d < 3; d++) {
        const pick = candidateDistractors[(i * 2 + d) % candidateDistractors.length];
        if (!selectedDistractors.includes(pick)) selectedDistractors.push(pick);
      }
      for (const p of candidateDistractors) {
        if (selectedDistractors.length >= 3) break;
        if (!selectedDistractors.includes(p)) selectedDistractors.push(p);
      }

      // Distribute correct key evenly across A, B, C, D: i=0 -> B, i=1 -> A, i=2 -> D, i=3 -> C, i=4 -> B
      const correctSlot = (i * 3 + 1) % 4;

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
        (label, slotIdx) => ({
          key: keys[slotIdx],
          label,
          tag: DEMO_PARTICIPANT_TAGS[label] || `ARCHIVE // LOG #${slotIdx + 1}`,
        })
      ) as [ArcadeOption, ArcadeOption, ArcadeOption, ArcadeOption];

      questions.push({
        id: `mock_q_001_${i + 1}`,
        round: `ROUND 0${i + 1} / 05`,
        category: "ROM // 001",
        prompt: "WHO SAID THIS IN THE GROUP CHAT?",
        quote: `"${src.text.replace(/^"|"$/g, "")}"`,
        options,
        correctAnswer: keys[correctSlot],
        explanation: `${correctAuthor} sent this message in the imported chat${src.timestamp ? ` at ${src.timestamp}` : ""}.`,
        difficulty: i > 2 ? "hard" : "medium",
        sourceMessageId: src.id,
        sourceAuthor: correctAuthor,
        sourceType: "WHO_SAID_IT",
      });
    }

    return questions;
  }

  // ROM 002: MEMORY BANK (Recall of Actual Chat Events)
  private buildRom002MemoryBank(participants: string[], count: number): ArcadeQuestion[] {
    const memoryBankEvents = [
      {
        prompt: "WHAT DID THE GROUP SPEND 3 HOURS ARGUING ABOUT?",
        quote: '"and somehow we spent 3 hours arguing about the logo"',
        correct: "The logo",
        distractors: ["The team name", "Database schema", "The playlist"],
        sourceId: "msg_0004",
        author: "Sneha",
        explanation: "Sneha confirmed the 3-hour logo argument occurred on 06/09/26.",
      },
      {
        prompt: "WHAT HAPPENED TO KABIR'S PHONE DURING PLANNING?",
        quote: '"bro my phone died for 6 hours yesterday so don\'t blame me"',
        correct: "Died for 6 hours behind radiator",
        distractors: ["Dropped in pizza dip", "Stolen at coffee shop", "Battery exploded"],
        sourceId: "msg_0021",
        author: "Kabir",
        explanation: "Kabir explained his cable fell behind the radiator.",
      },
      {
        prompt: "WHAT PIZZA ORDER CONTROVERSY OCCURRED AT 19:12?",
        quote: '"half pineapple half jalapeño chaos edition"',
        correct: "Pineapple jalapeño combo",
        distractors: ["Vegan crust only", "Forgot garlic dip", "Ordered 12 boxes"],
        sourceId: "msg_0030",
        author: "Nishant",
        explanation: "Nishant ordered 4 pizzas including the chaos edition.",
      },
      {
        prompt: "WHY WAS SNEHA'S PLAYLIST CALLED OUT FROM LAST TRIP?",
        quote: '"last time you had aux we listened to french vaporwave for 90 minutes"',
        correct: "90 minutes of french vaporwave",
        distractors: ["Max volume 14-min tracks", "Repeated one track 40 times", "Podcast instead of music"],
        sourceId: "msg_0019",
        author: "Dev",
        explanation: "Dev called out Sneha's 90-minute french vaporwave session.",
      },
      {
        prompt: "WHAT CORE BACKEND ELEMENT WAS MISSING AT 18:23?",
        quote: '"we literally have no database schema"',
        correct: "No database schema",
        distractors: ["No router connection", "No Next.js server", "No package.json"],
        sourceId: "msg_0007",
        author: "Arjun",
        explanation: "Arjun stated there was no database schema before setting up Prisma.",
      },
    ];

    return this.assembleCustomOptionsQuestions(memoryBankEvents.slice(0, count), "ROM // 002", "MEMORY_BANK");
  }

  // ROM 003: FRIENDSHIP QUIZ (Behaviors, Quirks, Habits)
  private buildRom003FriendshipQuiz(participants: string[], count: number): ArcadeQuestion[] {
    const friendshipEvents = [
      {
        prompt: "WHO SUGGESTED ADDING CHAOS MODE TO THE ARCADE?",
        quote: '"who suggested CHAOS MODE for ROM 005"',
        correct: "Sneha",
        distractors: ["Kabir", "Nishant", "Dev"],
        sourceId: "msg_0038",
        author: "Sneha",
        explanation: "Sneha declared: 'I did because standard trivia is for cowards.'",
      },
      {
        prompt: "WHO VOLUNTEERED TO TEST THE WRONG-ANSWER STATE?",
        quote: '"I volunteer to test the wrong-answer state"',
        correct: "Dev",
        distractors: ["Riya", "Arjun", "Kabir"],
        sourceId: "msg_0039",
        author: "Dev",
        explanation: "Dev claimed 'quality assurance is a sacred craft.'",
      },
      {
        prompt: "WHO INSERTED 42 COINS JUST TO HEAR THE AUDIO CHIME?",
        quote: '"I inserted 42 coins just to hear the chime"',
        correct: "Kabir",
        distractors: ["Nishant", "Sneha", "Arjun"],
        sourceId: "msg_0080",
        author: "Kabir",
        explanation: "Kabir inserted 42 coins to trigger the dopamine chime.",
      },
      {
        prompt: "WHO SENT A 4-MINUTE VOICE NOTE WITH A MICROWAVE BEEPING?",
        quote: '"listen to my 4-minute voice note explaining our vision"',
        correct: "Arjun",
        distractors: ["Dev", "Kabir", "Riya"],
        sourceId: "msg_0013",
        author: "Arjun",
        explanation: "Arjun claimed the microwave was essential context.",
      },
      {
        prompt: "WHO DEFINED '15 MINUTES' AS ACTUALLY BEING 45 MINUTES?",
        quote: '"15 minutes means 45 minutes in Kabir time"',
        correct: "Kabir",
        distractors: ["Nishant", "Dev", "Sneha"],
        sourceId: "msg_0058",
        author: "Riya",
        explanation: "Riya clocked Kabir time as 45 minutes.",
      },
    ];

    return this.assembleCustomOptionsQuestions(friendshipEvents.slice(0, count), "ROM // 003", "FRIENDSHIP_QUIZ");
  }

  // ROM 004: HOT TAKE MACHINE (Strong & Polarizing Opinions)
  private buildRom004HotTake(participants: string[], count: number): ArcadeQuestion[] {
    const hotTakeEvents = [
      {
        prompt: "WHO CLAIMED THAT CEREAL IS TECHNICALLY COLD SOUP?",
        quote: '"cereal is technically cold soup and you cannot change my mind"',
        correct: "Kabir",
        distractors: ["Dev", "Arjun", "Riya"],
        sourceId: "msg_0096",
        author: "Kabir",
        explanation: "Kabir defended the cereal cold soup theorem at 22:30.",
      },
      {
        prompt: "WHO FIRMLY DEFENDED THAT 'THE LOGO WAS IMPORTANT'?",
        quote: '"the logo was important"',
        correct: "Dev",
        distractors: ["Nishant", "Riya", "Arjun"],
        sourceId: "msg_0005",
        author: "Dev",
        explanation: "Dev insisted the logo was important during the early sprint.",
      },
      {
        prompt: "WHO COUNTERED THAT THE LOGO WAS NOT IMPORTANT WITHOUT A BACKEND?",
        quote: '"the logo was NOT important we had no backend"',
        correct: "Nishant",
        distractors: ["Sneha", "Kabir", "Dev"],
        sourceId: "msg_0006",
        author: "Nishant",
        explanation: "Nishant demanded backend functionality over logo design.",
      },
      {
        prompt: "WHO PROCLAIMED 'GIT PUSH --FORCE IS MY LOVE LANGUAGE'?",
        quote: '"git push --force is my love language"',
        correct: "Sneha",
        distractors: ["Riya", "Dev", "Arjun"],
        sourceId: "msg_0053",
        author: "Sneha",
        explanation: "Sneha frightened Dev with her git push philosophy.",
      },
      {
        prompt: "WHO CULINARILY DEBUNKED CEREAL BY NOTING MILK IS NOT BROTH?",
        quote: '"by culinary definition soup requires broth. milk is not broth"',
        correct: "Arjun",
        distractors: ["Kabir", "Sneha", "Nishant"],
        sourceId: "msg_0098",
        author: "Arjun",
        explanation: "Arjun restored scientific culinary sanity.",
      },
    ];

    return this.assembleCustomOptionsQuestions(hotTakeEvents.slice(0, count), "ROM // 004", "HOT_TAKE");
  }

  // ROM 005: CHAOS MODE (Inside Jokes, Incidents, Unpredictable Banter)
  private buildRom005ChaosMode(participants: string[], count: number): ArcadeQuestion[] {
    const chaosEvents = [
      {
        prompt: "WHAT EXCUSE WAS GIVEN FOR TACTILE MECHANICAL KEYBOARD FEEDBACK?",
        quote: '"it adds mechanical tactile feedback"',
        correct: "Pizza dust inside keycaps",
        distractors: ["Custom lubed switches", "Broken spring mechanism", "Spilled energy drink"],
        sourceId: "msg_0046",
        author: "Kabir",
        explanation: "Kabir claimed pizza dust under keycaps improved tactility.",
      },
      {
        prompt: "WHAT PHRASE WAS LOGGED AS MOST DETECTED IN CHAT LORE?",
        quote: '"who invited him to the group FaceTime at 3am"',
        correct: "WHO INVITED HIM",
        distractors: ["CHECK THE REPO", "AUX CORD STOLEN", "WHERE IS MY PIZZA"],
        sourceId: "msg_0000",
        author: "Nishant",
        explanation: "Thermal receipt logged 'WHO INVITED HIM' as peak incident lore.",
      },
      {
        prompt: "WHAT BET WAS MADE AT MIDNIGHT ON FINAL SUBMISSION?",
        quote: '"first one to 10000 points gets free breakfast"',
        correct: "Free breakfast for 10K points",
        distractors: ["Free coffee for 5K points", "Clean dishes for lowest score", "Push code without review"],
        sourceId: "msg_0142",
        author: "Kabir",
        explanation: "Kabir initiated the 10K points free breakfast challenge.",
      },
      {
        prompt: "WHAT MUSIC GENRE CAUSED THE INFAMOUS 90-MINUTE ROAD TRIP FIASCO?",
        quote: '"french vaporwave for 90 minutes"',
        correct: "French Vaporwave",
        distractors: ["German Techno", "14-min Guitar Solos", "Speedcore Pop"],
        sourceId: "msg_0019",
        author: "Sneha",
        explanation: "Sneha subjected the group to 90 minutes of French Vaporwave.",
      },
      {
        prompt: "HOW MANY COINS DOES KABIR HAVE TO INSERT BEFORE STOPPING?",
        quote: '"I inserted 42 coins just to hear the chime"',
        correct: "42 Coins",
        distractors: ["2 Coins", "10 Coins", "100 Coins"],
        sourceId: "msg_0080",
        author: "Kabir",
        explanation: "Kabir burned through 42 coins for audio chimes.",
      },
    ];

    return this.assembleCustomOptionsQuestions(chaosEvents.slice(0, count), "ROM // 005", "CHAOS_MODE");
  }

  // Helper for assembling 4 options with deterministic correct key
  private assembleCustomOptionsQuestions(
    events: Array<{
      prompt: string;
      quote: string;
      correct: string;
      distractors: string[];
      sourceId: string;
      author: string;
      explanation: string;
    }>,
    category: string,
    sourceType: ArcadeQuestion["sourceType"]
  ): ArcadeQuestion[] {
    const keys: ArcadeOptionKey[] = ["A", "B", "C", "D"];

    return events.map((ev, i) => {
      const correctSlot = (i * 3 + 1) % 4; // Deterministic distribution: B, A, D, C, B
      const labels: string[] = [];
      let distIdx = 0;

      for (let slot = 0; slot < 4; slot++) {
        if (slot === correctSlot) {
          labels.push(ev.correct);
        } else {
          labels.push(ev.distractors[distIdx % ev.distractors.length]);
          distIdx++;
        }
      }

      const options: [ArcadeOption, ArcadeOption, ArcadeOption, ArcadeOption] = labels.map(
        (label, slotIdx) => ({
          key: keys[slotIdx],
          label,
          tag: DEMO_PARTICIPANT_TAGS[label] || `VERIFIED // SLOT #${slotIdx + 1}`,
        })
      ) as [ArcadeOption, ArcadeOption, ArcadeOption, ArcadeOption];

      return {
        id: `mock_q_${category.replace(/\D/g, "")}_${i + 1}`,
        round: `ROUND 0${i + 1} / 05`,
        category,
        prompt: ev.prompt,
        quote: ev.quote,
        options,
        correctAnswer: keys[correctSlot],
        explanation: ev.explanation,
        difficulty: i > 2 ? "hard" : "medium",
        sourceMessageId: ev.sourceId,
        sourceAuthor: ev.author,
        sourceType,
      };
    });
  }
}

// ── 3. MOCK GAME MASTER SERVICE ─────────────────────────────────────────────
export class MockGameMasterService {
  async executeGameMaster(req: GameMasterRequest): Promise<GameMasterResponse> {
    checkSimulatedFailure("executeGameMaster");
    await simulateLatency(500, 900);

    const { round, scores } = req;
    const values = Object.values(scores || {});
    const maxScore = values.length ? Math.max(...values) : 0;

    if (round >= 5) {
      return {
        action: "GAME_END",
        message: "CHASSIS OVERHEAT // FINAL ROUND COMPLETED. PROCEED TO RECOVERY BANK.",
      };
    }

    if (maxScore >= 1500) {
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
}

// ── 4. MOCK MEDIA MODERATION SERVICE ────────────────────────────────────────
export class MockModerationService {
  async moderateMedia(req: ModerationRequest): Promise<ModerationResponse> {
    checkSimulatedFailure("moderateMedia");
    await simulateLatency(500, 900);

    const { id, mimeType, base64 } = req;

    if (!id || !mimeType || !base64) {
      throw new Error("VALIDATION_ERROR // id, mimeType, and base64 fields are mandatory.");
    }

    // Deterministic rule: check if base64 contains invalid or corrupt indicators
    if (base64.includes("EXPLICIT_NSFW_PAYLOAD")) {
      return {
        allowed: false,
        category: "prohibited",
        confidence: 0.99,
        reason: "Content flagged by automated safety filter.",
      };
    }

    return {
      allowed: true,
      category: "demo_safe",
      confidence: 0.99,
      reason: "Demo content passed mock moderation.",
    };
  }
}
