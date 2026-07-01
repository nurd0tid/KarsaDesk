import { NextRequest, NextResponse } from 'next/server';
import { listRecords, createRecord } from '@/lib/nocodb';
import { EMPTY_LIST_RESPONSE, isNotFoundError } from '@/lib/api-helpers';
import type { WeeklyLog } from '@/types';

const TABLE = 'weekly_logs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 25;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;
    const project_id = searchParams.get('project_id');
    const where = project_id ? `(Project ID,eq,${project_id})` : undefined;
    const data = await listRecords<WeeklyLog>(TABLE, { limit, offset, where, sort: '-week_start' });
    return NextResponse.json(data);
  } catch (error) {
    if (isNotFoundError(error)) return NextResponse.json(EMPTY_LIST_RESPONSE<WeeklyLog>());
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const record = await createRecord<WeeklyLog>(TABLE, body);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
