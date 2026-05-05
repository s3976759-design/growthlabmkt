import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  idea: z.string().min(1).max(2000),
  brand: z.string().max(200).optional().default(""),
  audience: z.string().max(500).optional().default(""),
  platform: z.enum(["Facebook", "Instagram", "TikTok", "LinkedIn"]),
  format: z.enum(["Caption", "Reel/TikTok script", "Carousel outline"]),
  tone: z.enum(["Professional", "Friendly", "Educational", "Soft-selling", "Bold"]),
  goal: z.enum(["Awareness", "Engagement", "Education", "Conversion"]),
  keyMessage: z.string().max(500).optional().default(""),
  cta: z.string().max(200).optional().default(""),
  notes: z.string().max(1000).optional().default(""),
  industry: z.string().max(100).optional().default(""),
  refine: z
    .enum(["regenerate", "shorter", "more_persuasive", "more_casual"])
    .optional(),
  previousDraft: z.string().max(5000).optional(),
});

export type DraftInput = z.infer<typeof InputSchema>;

export interface DraftOutput {
  hooks: string[];
  draft: string;
  cta: string;
  hashtags: string[];
  rationale: string;
  safetyNote?: string;
}

const TOOL = {
  type: "function" as const,
  function: {
    name: "return_draft",
    description: "Return the structured marketing draft.",
    parameters: {
      type: "object",
      properties: {
        hooks: {
          type: "array",
          items: { type: "string" },
          minItems: 3,
          maxItems: 3,
          description: "3 distinct, scroll-stopping hook options.",
        },
        draft: {
          type: "string",
          description: "Full caption or short script ready to publish.",
        },
        cta: { type: "string", description: "One concise call-to-action line." },
        hashtags: {
          type: "array",
          items: { type: "string" },
          maxItems: 12,
          description: "Relevant hashtags without leading #.",
        },
        rationale: {
          type: "string",
          description: "Short explanation of why this structure works (2-4 sentences).",
        },
        safetyNote: {
          type: "string",
          description:
            "Only when content touches healthcare or medical claims: a soft reminder to avoid absolute claims.",
        },
      },
      required: ["hooks", "draft", "cta", "hashtags", "rationale"],
      additionalProperties: false,
    },
  },
};

function buildSystem() {
  return `You are a senior performance copywriter for a marketing OS used by independent marketers in Vietnam.
Write practical, specific, on-brand content. Avoid generic AI clichés ("In today's fast-paced world", "Are you ready to...", "game-changer", emoji-spam).
Match the requested tone, platform conventions, and format precisely:
- Facebook: paragraph caption, 80-180 words, light emoji, scannable.
- Instagram: punchy caption with line breaks, 60-120 words.
- TikTok / Reel script: write as on-camera script with [Hook 0-3s], [Body], [CTA] beats.
- LinkedIn: insight-driven, no hashtags spam, 100-200 words.
- Carousel outline: numbered slides 1..N with slide title + 1-line copy each.
Default language = Vietnamese unless the idea is clearly written in English.
For healthcare / medical / clinical / dental / pharma topics: NEVER make absolute medical claims. Use softer wording such as "có thể giúp", "hỗ trợ", "tuỳ tình trạng từng người". ALWAYS fill the safetyNote field for these topics.
Always call the return_draft tool. Never reply in plain text.`;
}

function buildUserPrompt(d: DraftInput) {
  const refineMap: Record<string, string> = {
    regenerate: "Generate a fresh take, different angle from any previous draft.",
    shorter: "Make it noticeably shorter while keeping the strongest hook and CTA.",
    more_persuasive: "Make it more persuasive: sharpen the value, add proof or specificity, strengthen the CTA.",
    more_casual: "Make it more casual and conversational, like chatting with a friend.",
  };
  return [
    `Content idea: ${d.idea}`,
    d.brand && `Brand: ${d.brand}`,
    d.industry && `Industry/niche: ${d.industry}`,
    d.audience && `Target audience: ${d.audience}`,
    `Platform: ${d.platform}`,
    `Format: ${d.format}`,
    `Tone: ${d.tone}`,
    `Main goal: ${d.goal}`,
    d.keyMessage && `Key message: ${d.keyMessage}`,
    d.cta && `Preferred CTA: ${d.cta}`,
    d.notes && `Notes: ${d.notes}`,
    d.previousDraft && `Previous draft (for reference):\n"""${d.previousDraft}"""`,
    d.refine && `Refinement instruction: ${refineMap[d.refine]}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export const generateDraft = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<DraftOutput> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: buildSystem() },
          { role: "user", content: buildUserPrompt(data) },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "return_draft" } },
      }),
    });

    if (res.status === 429) throw new Error("Rate limit exceeded. Vui lòng thử lại sau.");
    if (res.status === 402) throw new Error("Hết credit AI. Vui lòng nạp thêm tại Settings → Workspace → Usage.");
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`AI gateway error ${res.status}: ${t.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("AI did not return structured output.");
    let parsed: DraftOutput;
    try {
      parsed = JSON.parse(args) as DraftOutput;
    } catch {
      throw new Error("AI returned invalid JSON.");
    }
    return {
      hooks: Array.isArray(parsed.hooks) ? parsed.hooks.slice(0, 3) : [],
      draft: parsed.draft ?? "",
      cta: parsed.cta ?? "",
      hashtags: Array.isArray(parsed.hashtags)
        ? parsed.hashtags.map((h) => h.replace(/^#/, "")).filter(Boolean)
        : [],
      rationale: parsed.rationale ?? "",
      safetyNote: parsed.safetyNote || undefined,
    };
  });
