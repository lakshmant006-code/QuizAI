import Anthropic from "@anthropic-ai/sdk";

/** Server-only Anthropic client. Never import this into a Client Component. */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Latest, most capable general model for study-content generation.
export const CLAUDE_MODEL = "claude-sonnet-5";
