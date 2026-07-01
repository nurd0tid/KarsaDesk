import { NextRequest, NextResponse } from 'next/server';
import { listRecords, createRecord } from '@/lib/nocodb';
import { EMPTY_LIST_RESPONSE, isNotFoundError } from '@/lib/api-helpers';
import { setProviderLocalConfig } from '@/lib/local-config';
import type { Provider } from '@/types';

const TABLE = 'providers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 25;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;
    const data = await listRecords<Provider>(TABLE, { limit, offset });
    return NextResponse.json(data);
  } catch (error) {
    if (isNotFoundError(error)) return NextResponse.json(EMPTY_LIST_RESPONSE<Provider>());
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { apiKeyMode, apiKeyEnvName, directApiKey, presetId, ...rest } = body;

    const nocoData: Record<string, any> = {
      name: rest.name,
      type: rest.type,
      // NocoDB Title Case mapping
      'Base URL': rest.base_url,
      'Default Model': rest.default_model,
      'Is Active': rest.is_active ?? true,
      'Supports Reasoning': rest.supports_reasoning ?? false,
      'Supports Tools': rest.supports_tools ?? false,
      // Fallbacks
      base_url: rest.base_url,
      default_model: rest.default_model,
      is_active: rest.is_active ?? true,
      supports_reasoning: rest.supports_reasoning ?? false,
      supports_tools: rest.supports_tools ?? false,
    };

    const record = await createRecord<Provider>(TABLE, nocoData as Partial<Provider>);

    const providerId = record.Id || 'new';
    setProviderLocalConfig(providerId, {
      directApiKey: apiKeyMode === 'direct-local' ? directApiKey : undefined,
      apiKeyMode,
      apiKeyEnvName,
      presetId,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
