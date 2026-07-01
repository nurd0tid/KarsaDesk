# Provider Rules

Provider can change, workflow cannot.

Supported:

- OpenAI
- OpenRouter
- OpenAI Compatible
- OpenCode
- Zen
- Ollama
- vLLM
- Claude-compatible
- Gemini-compatible
- Custom

## Rule

All providers must go through adapter.

## Fallback

If limit/error:

1. Log error.
2. Try fallback.
3. Log fallback.
4. Continue if safe.

## Do Not

Do not make workflow dependent on one model.
