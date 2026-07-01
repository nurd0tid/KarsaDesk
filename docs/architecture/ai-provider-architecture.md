# AI Provider Architecture

## Goal

Allow users to connect any AI provider while keeping workflow consistent.

## Supported Providers

- OpenAI
- OpenRouter
- OpenAI Compatible
- OpenCode
- Zen
- Ollama
- vLLM
- Claude-compatible
- Gemini-compatible
- Custom provider

## Provider Interface

```ts
export interface AIProviderConfig {
  id: string
  name: string
  type:
    | "openai"
    | "openrouter"
    | "openai-compatible"
    | "opencode"
    | "zen"
    | "ollama"
    | "vllm"
    | "custom"
  baseUrl?: string
  apiKeyEnv?: string
  defaultModel: string
  fallbackModels?: string[]
  supportsReasoning?: boolean
  supportsTools?: boolean
  enabled: boolean
}
```

## Fallback Rule

If provider/model fails:

1. Record error.
2. Try fallback model.
3. Save fallback attempt to agent_logs.
4. Continue only if result is valid.

## Provider UI

Provider page must show:

- status
- default model
- base URL
- fallback order
- test connection
- recent errors
