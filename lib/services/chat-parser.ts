// Ingestion & Parsing Engine for WhatsApp, Discord, Telegram, and Delimited Chat Logs

import { ChatIngestResponse, TopQuote } from "@/types/api";

const SYSTEM_PHRASES = [
  "messages and calls are end-to-end encrypted",
  "joined using this group's invite link",
  "left the group",
  "added you",
  "created group",
  "changed the subject",
  "changed the group icon",
  "security code changed",
  "pinned a message",
  "deleted this message",
  "<media omitted>",
  "this message was deleted",
];

export function parseChatLog(
  rawText: string,
  fileName?: string
): ChatIngestResponse {
  if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
    return {
      participants: [],
      messageCount: 0,
      topQuotes: [],
      inferredInterests: [],
      suggestedRom: "ROM // 001",
    };
  }

  const trimmed = rawText.trim();

  // 1. Try Discord / Telegram JSON export
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsedJson = JSON.parse(trimmed);
      return parseJsonChat(parsedJson, fileName);
    } catch {
      // Fall through to line-based parsing
    }
  }

  // 2. Line-by-line parsing (WhatsApp / Telegram / Generic delimited logs)
  return parseTextChat(rawText, fileName);
}

function isSystemMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return SYSTEM_PHRASES.some((phrase) => lower.includes(phrase));
}

function parseTextChat(rawText: string, fileName?: string): ChatIngestResponse {
  const lines = rawText.split(/\r?\n/);
  const messages: { author: string; text: string; time?: string }[] = [];
  const participantCounts: Record<string, number> = {};

  // Regex 1: [12/04/2024, 14:32:10] Alex: Message or [12/04/24 2:32:10 PM] Alex: Message
  const regexBracket = /^\[(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4},\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]\s*([^:]+?):\s*(.+)$/;

  // Regex 2: 12/04/2024, 14:32 - Alex: Message or 12/04/24, 2:32 PM - Alex: Message
  const regexDash = /^(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4},\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s*-\s*([^:]+?):\s*(.+)$/;

  // Regex 3: <Alex> Message or Alex: Message (Generic line fallback)
  const regexGeneric = /^(?:<([^>]+)>|([A-Za-z0-9_\s]{2,20}):)\s*(.+)$/;

  let currentMsg: { author: string; text: string; time?: string } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    let match = line.match(regexBracket);
    if (match) {
      if (currentMsg) messages.push(currentMsg);
      const [, time, author, text] = match;
      if (!isSystemMessage(text)) {
        currentMsg = { author: author.trim(), text: text.trim(), time: time.trim() };
        participantCounts[author.trim()] = (participantCounts[author.trim()] || 0) + 1;
      }
      continue;
    }

    match = line.match(regexDash);
    if (match) {
      if (currentMsg) messages.push(currentMsg);
      const [, time, author, text] = match;
      if (!isSystemMessage(text)) {
        currentMsg = { author: author.trim(), text: text.trim(), time: time.trim() };
        participantCounts[author.trim()] = (participantCounts[author.trim()] || 0) + 1;
      }
      continue;
    }

    match = line.match(regexGeneric);
    if (match) {
      const author = match[1] || match[2];
      const text = match[3];
      if (author && text && !isSystemMessage(text)) {
        if (currentMsg) messages.push(currentMsg);
        currentMsg = { author: author.trim(), text: text.trim() };
        participantCounts[author.trim()] = (participantCounts[author.trim()] || 0) + 1;
        continue;
      }
    }

    // Multiline message append
    if (currentMsg) {
      currentMsg.text += `\n${line}`;
    }
  }

  if (currentMsg) {
    messages.push(currentMsg);
  }

  return buildIngestResponse(messages, participantCounts, fileName);
}

function parseJsonChat(data: any, fileName?: string): ChatIngestResponse {
  const messages: { author: string; text: string; time?: string }[] = [];
  const participantCounts: Record<string, number> = {};

  let msgList: any[] = [];
  if (Array.isArray(data)) {
    msgList = data;
  } else if (data.messages && Array.isArray(data.messages)) {
    msgList = data.messages;
  }

  for (const item of msgList) {
    let author = "";
    let text = "";
    let time = "";

    if (typeof item.author === "string") author = item.author;
    else if (item.author?.name) author = item.author.name;
    else if (item.from) author = item.from;
    else if (item.sender) author = item.sender;

    if (typeof item.content === "string") text = item.content;
    else if (typeof item.text === "string") text = item.text;
    else if (typeof item.message === "string") text = item.message;
    else if (Array.isArray(item.text)) {
      text = item.text.map((t: any) => (typeof t === "string" ? t : t.text || "")).join("");
    }

    if (item.timestamp) time = String(item.timestamp);
    else if (item.date) time = String(item.date);

    if (author && text && !isSystemMessage(text)) {
      messages.push({ author: author.trim(), text: text.trim(), time });
      participantCounts[author.trim()] = (participantCounts[author.trim()] || 0) + 1;
    }
  }

  return buildIngestResponse(messages, participantCounts, fileName);
}

function buildIngestResponse(
  messages: { author: string; text: string; time?: string }[],
  counts: Record<string, number>,
  fileName?: string
): ChatIngestResponse {
  // Sort participants by frequency
  const sortedParticipants = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([author]) => author)
    .slice(0, 8); // Top 8 participants

  // Extract top punchy quotes
  const topQuotes: TopQuote[] = [];
  const quoteSet = new Set<string>();

  for (const m of messages) {
    const clean = m.text.replace(/\s+/g, " ").trim();
    // Look for quotes between 15 and 140 chars that feel like memorable statements
    if (
      clean.length >= 15 &&
      clean.length <= 140 &&
      !clean.startsWith("http") &&
      !quoteSet.has(clean.toLowerCase())
    ) {
      // Prioritize statements with exclamations, questions, slang, or quotes
      const isInteresting =
        clean.includes("?") ||
        clean.includes("!") ||
        clean.includes("literally") ||
        clean.includes("bro") ||
        clean.includes("always") ||
        clean.includes("never") ||
        clean.includes("why") ||
        clean.includes("told you");

      if (isInteresting || topQuotes.length < 5) {
        quoteSet.add(clean.toLowerCase());
        topQuotes.push({
          id: `msg_${String(topQuotes.length + 1).padStart(4, "0")}`,
          author: m.author,
          text: clean,
          timestamp: m.time,
        });
      }
    }
    if (topQuotes.length >= 10) break;
  }

  // Infer interests/themes from vocabulary
  const vocabMap: Record<string, number> = {};
  const KEYWORD_INTERESTS: Record<string, string[]> = {
    music: ["aux", "song", "track", "album", "spotify", "playlist", "concert", "dj"],
    gaming: ["game", "steam", "play", "round", "boss", "discord", "mod", "rank"],
    food: ["pizza", "burger", "coffee", "food", "eat", "dinner", "lunch", "hungry"],
    travel: ["trip", "flight", "road", "hotel", "drive", "car", "paris", "beach"],
    drama: ["argue", "swear", "unhinged", "hate", "fight", "insane", "literally", "mad"],
    lore: ["remember", "year", "summer", "screenshot", "old", "photo", "back then"],
  };

  const allText = messages.slice(0, 300).map((m) => m.text.toLowerCase()).join(" ");
  const inferredInterests: string[] = [];

  for (const [theme, keywords] of Object.entries(KEYWORD_INTERESTS)) {
    for (const kw of keywords) {
      if (allText.includes(kw)) {
        if (!inferredInterests.includes(theme)) {
          inferredInterests.push(theme);
        }
        break;
      }
    }
  }

  if (inferredInterests.length === 0) {
    inferredInterests.push("lore", "banter", "trivia");
  }

  return {
    participants: sortedParticipants.length > 0 ? sortedParticipants : ["Alex", "Maya", "Sam", "Liam"],
    messageCount: messages.length,
    topQuotes: topQuotes.slice(0, 10),
    inferredInterests,
    suggestedRom: "ROM // 001: WHO SAID IT?",
    sampleSnippets: messages.slice(0, 5).map((m) => `${m.author}: ${m.text}`),
  };
}
