import { anthropic, CLAUDE_MODEL } from "./anthropic";
import type { Difficulty, QuestionKind } from "./types";

export interface StudyPack {
  summary: {
    overview: string;
    key_points: string[];
    key_terms: { term: string; definition: string }[];
  };
  quiz: {
    title: string;
    questions: {
      kind: QuestionKind;
      prompt: string;
      options?: string[];
      answer: string;
      explanation?: string;
    }[];
  };
}

const STUDY_PACK_TOOL = {
  name: "emit_study_pack",
  description:
    "Return a structured study pack (summary + quiz) for the provided source text.",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "object",
        properties: {
          overview: {
            type: "string",
            description: "2-4 sentence plain-language overview of the material.",
          },
          key_points: {
            type: "array",
            items: { type: "string" },
            description: "5-8 concise bullet takeaways.",
          },
          key_terms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                term: { type: "string" },
                definition: { type: "string" },
              },
              required: ["term", "definition"],
            },
            description: "Important terms with short definitions.",
          },
        },
        required: ["overview", "key_points", "key_terms"],
      },
      quiz: {
        type: "object",
        properties: {
          title: { type: "string" },
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                kind: { type: "string", enum: ["mcq", "tf", "short"] },
                prompt: { type: "string" },
                options: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "For mcq: 4 options. For tf: ['True','False']. Omit for short.",
                },
                answer: {
                  type: "string",
                  description:
                    "The exact correct option text (mcq/tf) or a concise model answer (short).",
                },
                explanation: { type: "string" },
              },
              required: ["kind", "prompt", "answer", "explanation"],
            },
          },
        },
        required: ["title", "questions"],
      },
    },
    required: ["summary", "quiz"],
  },
};

export interface GenerateOptions {
  text: string;
  title: string;
  difficulty: Difficulty;
  numQuestions: number;
  kinds: QuestionKind[];
}

// Keep well under the model context window; trim very large documents.
const MAX_CHARS = 60_000;

export async function generateStudyPack(
  opts: GenerateOptions,
): Promise<StudyPack> {
  const { text, title, difficulty, numQuestions, kinds } = opts;
  const source = text.slice(0, MAX_CHARS);

  const kindLabel = kinds
    .map((k) => (k === "mcq" ? "multiple-choice" : k === "tf" ? "true/false" : "short-answer"))
    .join(", ");

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    tools: [STUDY_PACK_TOOL],
    tool_choice: { type: "tool", name: "emit_study_pack" },
    messages: [
      {
        role: "user",
        content: `You are an expert study assistant. From the source material below, produce:
1. A clear summary (overview, key points, key terms).
2. A ${numQuestions}-question quiz at ${difficulty} difficulty using these question types: ${kindLabel}.

Rules:
- Base everything strictly on the source; do not invent facts.
- For multiple-choice, give exactly 4 plausible options and set "answer" to the exact correct option text.
- For true/false, options must be ["True","False"].
- Always include a one-sentence explanation for each question.
- Quiz title should reference the material "${title}".

Source material:
"""
${source}
"""`,
      },
    ],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Model did not return a study pack.");
  }
  return toolUse.input as StudyPack;
}
