// Groq model IDs, in one place. Change models here, not in individual routes.
//
// llama-3.3-70b-versatile was removed from Groq (requests now 404 with
// model_not_found). The gpt-oss models are reasoning models: pass
// reasoning_effort "low" to keep latency down, and leave headroom in
// max_tokens because reasoning tokens count toward it. Streaming still works —
// Groq sends reasoning in a separate delta field, so `delta.content` is only the
// answer.

export const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

/** Quality model — AI assist, chat, search, recall card generation. */
export const GROQ_MODEL = "openai/gpt-oss-120b"

/** Fast model — short, high-volume calls (rewrite, recall grading). */
export const GROQ_FAST_MODEL = "openai/gpt-oss-20b"

export const REASONING_EFFORT = "low" as const
