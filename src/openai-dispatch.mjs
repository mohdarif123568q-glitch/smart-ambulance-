import OpenAI from "openai";

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["risk_summary", "dispatch_rationale", "hospital_rationale", "dispatcher_checks", "confidence"],
  properties: {
    risk_summary: { type: "string" },
    dispatch_rationale: { type: "string" },
    hospital_rationale: { type: "string" },
    dispatcher_checks: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
    confidence: { type: "string", enum: ["low", "medium", "high"] }
  }
};

export async function createAiRecommendation(incident, ranking) {
  if (!process.env.OPENAI_API_KEY) return null;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    instructions: [
      "You support a trained emergency dispatcher using synthetic operational data.",
      "Do not diagnose, prescribe treatment, or invent patient facts.",
      "Explain the supplied deterministic ranking and list verification checks.",
      "Always require human dispatcher confirmation before dispatch or hospital pre-alert."
    ].join(" "),
    input: JSON.stringify({ incident, deterministicRanking: ranking }),
    text: {
      format: {
        type: "json_schema",
        name: "dispatch_recommendation",
        strict: true,
        schema
      }
    }
  });
  return JSON.parse(response.output_text);
}
