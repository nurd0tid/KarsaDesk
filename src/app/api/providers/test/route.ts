import { NextRequest, NextResponse } from 'next/server';
import { resolveApiKey } from '@/lib/local-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, type, baseUrl, apiKeyMode, apiKeyEnvName, directApiKey } = body;

    const apiKey = resolveApiKey(providerId || 'test', apiKeyMode, apiKeyEnvName, directApiKey);

    // Simple test based on type
    if (type === 'openai' || type === 'openai-compatible' || type === 'openrouter' || type === 'azure-openai' || type === 'groq' || type === 'mistral' || type === '9router' || type === 'together' || type === 'fireworks' || type === 'deepseek' || type === 'moonshot' || type === 'xai' || type === 'perplexity' || type === 'cerebras' || type === 'lm-studio' || type === 'litellm' || type === 'opencode' || type === 'zen') {
      const url = baseUrl.endsWith('/v1') ? baseUrl + '/models' : baseUrl.endsWith('/') ? baseUrl + 'models' : baseUrl + '/models';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const res = await fetch(url, { headers, method: 'GET', signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        return NextResponse.json({ success: false, error: `API returned ${res.status}: ${res.statusText}` }, { status: res.status });
      }
      return NextResponse.json({ success: true, message: 'Connection successful' });
    }

    if (type === 'anthropic') {
       // Anthropic doesn't have a standard /models endpoint in older API versions, we can test by sending a small models GET or just assume ok if we want.
       // Actually, Anthropic recently added a /models endpoint, let's try it.
       const url = baseUrl.endsWith('/') ? baseUrl + 'models' : baseUrl + '/models';
       const headers: Record<string, string> = {
         'x-api-key': apiKey,
         'anthropic-version': '2023-06-01'
       };
       const res = await fetch(url, { headers, method: 'GET', signal: AbortSignal.timeout(10000) });
       if (!res.ok) {
         return NextResponse.json({ success: false, error: `API returned ${res.status}: ${res.statusText}` }, { status: res.status });
       }
       return NextResponse.json({ success: true, message: 'Connection successful' });
    }

    if (type === 'gemini') {
      const url = `${baseUrl}/models?key=${apiKey}`;
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        return NextResponse.json({ success: false, error: `API returned ${res.status}: ${res.statusText}` }, { status: res.status });
      }
      return NextResponse.json({ success: true, message: 'Connection successful' });
    }

    if (type === 'ollama') {
      const url = baseUrl.endsWith('/api') ? baseUrl + '/tags' : baseUrl.endsWith('/') ? baseUrl + 'api/tags' : baseUrl + '/api/tags';
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        return NextResponse.json({ success: false, error: `API returned ${res.status}: ${res.statusText}` }, { status: res.status });
      }
      return NextResponse.json({ success: true, message: 'Connection successful' });
    }

    // Default basic check
    return NextResponse.json({ success: true, message: 'Test capability not implemented for this provider type, assumed ok.' });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
