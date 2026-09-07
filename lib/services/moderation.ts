// Multimodal Media Safety Moderation Service using @google/genai

import { gemini, isGeminiConfigured } from "@/lib/gemini";
import { db, isDatabaseConfigured } from "@/lib/db";
import { ModerationRequest, ModerationResponse } from "@/types/api";

export async function moderateMediaContent(
  req: ModerationRequest
): Promise<ModerationResponse> {
  const { id, mimeType, base64, userId } = req;

  if (!id || !mimeType || !base64) {
    throw new Error("id, mimeType, and base64 payload are required");
  }

  // If Gemini is not configured, permit safe fallback in demo mode
  if (!isGeminiConfigured) {
    return {
      allowed: true,
      category: "demo_safe",
      confidence: 1.0,
      reason: "DEMO ENGINE // GEMINI KEY NOT CONFIGURED (AUTO-PERMITTED)",
    };
  }

  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64,
          },
        },
        {
          text: `
Analyze this uploaded media for community safety.

Return ONLY valid JSON in exactly this format:

{
  "allowed": true,
  "category": "safe",
  "confidence": 0.95,
  "reason": "Short explanation"
}

Set "allowed" to false if the media contains NSFW, graphic violence, or harassment.
Keep confidence between 0 and 1.
Do not include markdown or text outside the JSON.
`,
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = (response.text || "").trim();
    const cleanJson = text.startsWith("```")
      ? text.replace(/^```(?:json)?\r?\n?/, "").replace(/\r?\n?```$/, "")
      : text;

    const result = JSON.parse(cleanJson);
    const confidence = Math.max(0, Math.min(1, Number(result.confidence) || 0.9));

    const modResult: ModerationResponse = {
      allowed: Boolean(result.allowed),
      category: result.category || "safe",
      confidence,
      reason: result.reason || "Verification nominal",
    };

    // Update database record if database is configured
    if (isDatabaseConfigured) {
      try {
        await db.media.upsert({
          where: { id },
          update: {
            allowed: modResult.allowed,
            confidence: modResult.confidence,
            reason: modResult.reason,
            moderationStatus: modResult.allowed ? "APPROVED" : "REJECTED",
            moderationReason: modResult.reason,
          },
          create: {
            id,
            userId: userId || null,
            type: mimeType,
            allowed: modResult.allowed,
            confidence: modResult.confidence,
            reason: modResult.reason,
            moderationStatus: modResult.allowed ? "APPROVED" : "REJECTED",
            moderationReason: modResult.reason,
          },
        });
      } catch (dbErr) {
        console.warn("Database media record update bypassed:", dbErr);
      }
    }

    return modResult;
  } catch (error) {
    console.error("Gemini moderation error:", error);
    return {
      allowed: false,
      category: "review",
      confidence: 0,
      reason: error instanceof Error ? error.message : "Moderation evaluation failed",
    };
  }
}
