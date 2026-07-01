import { NextRequest, NextResponse } from 'next/server';
import { resolveApiKey } from '@/lib/local-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, type, baseUrl, apiKeyMode, apiKeyEnvName, directApiKey } = body;

    const apiKey = resolveApiKey(providerId || 'models', apiKeyMode, apiKeyEnvName, directApiKey);

    if (type === 'openai' || type === 'openai-compatible' || type === 'openrouter' || type === 'azure-openai' || type === 'groq' || type === 'mistral' || type === '9router') {
      const url = baseUrl.endsWith('/v1') ? baseUrl + '/models' : baseUrl.endsWith('/') ? baseUrl + 'models' : baseUrl + '/models';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const res = await fetch(url, { headers, method: 'GET', signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        return NextResponse.json({ error: `API returned ${res.status}: ${res.statusText}` }, { status: res.status });
      }
      const data = await res.json();
      const list = data.data || [];
      const models = list.map((item: any) => ({
        id: item.id,
        name: item.id,
      }));
      return NextResponse.json({ models });
    }

    if (type === 'anthropic') {
      const url = baseUrl.endsWith('/') ? baseUrl + 'models' : baseUrl + '/models';
      const headers: Record<string, string> = {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      };
      const res = await fetch(url, { headers, method: 'GET', signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        return NextResponse.json({ error: `API returned ${res.status}: ${res.statusText}` }, { status: res.status });
      }
      const data = await res.json();
      const list = data.data || [];
      const models = list.map((item: any) => ({
        id: item.id,
        name: item.display_name || item.id,
      }));
      return NextResponse.json({ models });
    }

    if (type === 'gemini') {
      const url = `${baseUrl}/models?key=${apiKey}`;
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        return NextResponse.json({ error: `API returned ${res.status}: ${res.statusText}` }, { status: res.status });
      }
      const data = await res.json();
      const list = data.models || [];
      const models = list.map((item: any) => {
        // gemini model name usually looks like "models/gemini-1.5-pro"
        const cleanName = item.name.replace('models/', '');
        return {
          id: cleanName,
          name: item.displayName || cleanName,
        };
      });
      return NextResponse.json({ models });
    }

    if (type === 'ollama') {
      const url = baseUrl.endsWith('/api') ? baseUrl + '/tags' : baseUrl.endsWith('/') ? baseUrl + 'api/tags' : baseUrl + '/api/tags';
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        return NextResponse.json({ error: `API returned ${res.status}: ${res.statusText}` }, { status: res.status });
      }
      const data = await res.json();
      const list = data.models || [];
      const models = list.map((item: any) => ({
        id: item.name,
        name: item.name,
      }));
      return NextResponse.json({ models });
    }

    return NextResponse.json({ models: [] });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
