# VYBZ // ARCADE SYSTEM Architecture Documentation

## 1. System Overview

The VYBZ Arcade System transforms raw group chat conversations into interactive, retro-cyberpunk arcade trivia cartridges. The system is designed with strict decoupling between the frontend user experience, the API boundary, and the AI service layer.

```
                    ┌────────────────────────┐
                    │      VYBZ FRONTEND     │
                    │   Next.js App Router   │
                    │      (app/page.tsx)    │
                    └───────────┬────────────┘
                                │
                          HTTP / JSON
                          API Boundary
                                │
                                ▼
                    ┌────────────────────────┐
                    │    API ROUTE LAYER     │
                    │      (app/api/**)      │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │     SERVICE FACTORY    │
                    │  (lib/services/index.ts)│
                    └───────────┬────────────┘
                                │
                 ┌──────────────┴──────────────┐
                 │ (MOCK_AI=true)              │ (MOCK_AI=false)
                 ▼                             ▼
        ┌──────────────────┐          ┌──────────────────┐
        │  MOCK AI SERVICE │          │  GEMINI SERVICE  │
        │(lib/services/    │          │(lib/services/    │
        │    mock-ai.ts)   │          │   ai-trivia.ts)  │
        └────────┬─────────┘          └────────┬─────────┘
                 │                             │
                 ▼                             ▼
        ┌──────────────────┐          ┌──────────────────┐
        │   MOCK DATASET   │          │  GEMINI 2.5 API  │
        │ (vybz-demo.ts)   │          │  @google/genai   │
        └──────────────────┘          └──────────────────┘
                 │                             │
                 └──────────────┬──────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │    PERSISTENCE LAYER   │
                    │   Prisma / Supabase    │
                    │  (In-memory fallback)  │
                    └────────────────────────┘
```

---

## 2. API Contract Specifications

### 2.1. Chat Ingestion (`POST /api/chat/ingest`)
- **Purpose**: Parses uploaded raw chat exports (.txt, .json, .csv) and extracts participants, message volume, memorable quotes, and inferred conversation themes.
- **Request Body**:
  ```json
  {
    "rawText": "string (max 10MB)",
    "fileName": "optional string",
    "sourceType": "optional 'whatsapp' | 'discord' | 'telegram' | 'generic'"
  }
  ```
- **Response Body (`ChatIngestResponse`)**:
  ```json
  {
    "participants": ["Nishant", "Kabir", "Arjun", "Riya", "Sneha", "Dev"],
    "messageCount": 142,
    "topQuotes": [
      {
        "id": "msg_0001",
        "author": "Nishant",
        "text": "guys are we actually doing the hackathon tonight",
        "timestamp": "06/09/26, 18:05"
      }
    ],
    "inferredInterests": ["hackathon", "arcade", "pizza", "music"],
    "suggestedRom": "ROM // 001: WHO SAID IT?",
    "sampleSnippets": ["Nishant: guys are we actually doing the hackathon tonight"]
  }
  ```
- **Error States**:
  - `400 EMPTY_PAYLOAD`: Missing or empty `rawText`.
  - `413 PAYLOAD_OVERSIZE`: File exceeds 10MB maximum limit.
  - `500 INGESTION_FAILED`: Parse failure.

---

### 2.2. Question Generation (`POST /api/questions/generate`)
- **Purpose**: Compiles 5 structured arcade trivia questions matching the selected ROM cartridge mode.
- **Request Body (`GenerateQuestionsRequest`)**:
  ```json
  {
    "gameId": "optional string",
    "participants": ["string"],
    "interests": ["string"],
    "topQuotes": [{"id": "string", "author": "string", "text": "string"}],
    "romCategory": "ROM // 001" | "ROM // 002" | "ROM // 003" | "ROM // 004" | "ROM // 005",
    "difficulty": "easy" | "medium" | "hard",
    "count": 5
  }
  ```
- **Response Body (`GenerateQuestionsResponse`)**:
  ```json
  {
    "questions": [
      {
        "id": "mock_q_001_1",
        "round": "ROUND 01 / 05",
        "category": "ROM // 001",
        "prompt": "WHO SAID THIS IN THE GROUP CHAT?",
        "quote": "\"guys are we actually doing the hackathon tonight\"",
        "options": [
          { "key": "A", "label": "Kabir", "tag": "CHAOS OPERATOR // SHITPOSTER" },
          { "key": "B", "label": "Nishant", "tag": "LORE ARCHIVIST // CHAT HISTORIAN" },
          { "key": "C", "label": "Arjun", "tag": "3AM VOICE NOTE PHILOSOPHER" },
          { "key": "D", "label": "Riya", "tag": "VOICE OF REASON // MEDIATOR" }
        ],
        "correctAnswer": "B",
        "explanation": "Nishant sent this message in the imported chat at 18:05.",
        "difficulty": "medium",
        "sourceMessageId": "msg_0001",
        "sourceAuthor": "Nishant",
        "sourceType": "WHO_SAID_IT"
      }
    ],
    "isDemoFallback": true
  }
  ```
- **Factual Invariant**:
  - `correctAnswer` is mathematically guaranteed to equal `options.find(o => o.label === sourceAuthor).key`.
  - All 4 options are distinct.
  - Distractors are dynamically distributed across all participants.
- **Error States**:
  - `400 INSUFFICIENT_PARTICIPANTS`: When fewer than 4 participants are provided (no fake users are fabricated).

---

### 2.3. AI Game Master (`POST /api/game/master`)
- **Purpose**: Evaluates gameplay state, scores, and round progression to trigger dynamic arcade loop events.
- **Request Body (`GameMasterRequest`)**:
  ```json
  {
    "round": 5,
    "players": [{"name": "Nishant", "score": 2500}],
    "scores": {"Nishant": 2500},
    "currentQuestion": {}
  }
  ```
- **Response Body (`GameMasterResponse`)**:
  ```json
  {
    "action": "BONUS_ROUND" | "NEXT_QUESTION" | "HINT" | "DIFFICULTY_UP" | "GAME_END",
    "message": "HIGH SCORE DETECTED // HEURISTIC CORE MULTIPLIER ENGAGED (2X PTS)"
  }
  ```

---

### 2.4. Media Safety Moderation (`POST /api/media/moderate`)
- **Purpose**: Validates user-submitted media for safety and community compliance before persisting.
- **Request Body (`ModerationRequest`)**:
  ```json
  {
    "id": "med_12345",
    "mimeType": "image/png",
    "base64": "...",
    "userId": "optional string"
  }
  ```
- **Response Body (`ModerationResponse`)**:
  ```json
  {
    "allowed": true,
    "category": "demo_safe",
    "confidence": 0.99,
    "reason": "Demo content passed mock moderation."
  }
  ```

---

## 3. Cartridge Modes

| Cartridge | Name | Gameplay Focus |
|---|---|---|
| **ROM // 001** | **WHO SAID IT?** | Quote-to-author attribution with real messages and 3 distractors. |
| **ROM // 002** | **MEMORY BANK** | Event and chronological recall grounded in real chat lore. |
| **ROM // 003** | **FRIENDSHIP QUIZ** | Habits, signature reactions, and friendship quirks. |
| **ROM // 004** | **HOT TAKE MACHINE** | Heated group debates, hot takes, and strong opinions. |
| **ROM // 005** | **CHAOS MODE** | Rapid inside jokes, multi-party debates, and chaotic incidents. |

---

## 4. Decoupling & Factory Pattern

The API route handlers (`app/api/**`) do not import specific AI clients directly. Instead, they interact through abstract service interfaces defined in [lib/services/index.ts](file:///c:/Users/NISHANT/Documents/VYBZ%20ANTIGRAVITY/nishant-chat/lib/services/index.ts):

- `ChatAnalysisService`
- `TriviaService`
- `GameMasterService`
- `ModerationService`

When `MOCK_AI=true`, the factory provides deterministic, simulated AI implementations backed by [lib/mock-data/vybz-demo.ts](file:///c:/Users/NISHANT/Documents/VYBZ%20ANTIGRAVITY/nishant-chat/lib/mock-data/vybz-demo.ts). When `MOCK_AI=false` and `GEMINI_API_KEY` is present, it returns production implementations backed by `@google/genai` (Gemini 2.5 Flash).
