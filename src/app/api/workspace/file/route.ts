import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const targetPath = searchParams.get('path');

    if (!targetPath) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
    }

    const resolvedPath = path.resolve(targetPath);

    try {
      const stats = await fs.stat(resolvedPath);
      if (!stats.isFile()) {
        return NextResponse.json({ error: 'Path is not a file' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'File not found or inaccessible' }, { status: 404 });
    }

    const content = await fs.readFile(resolvedPath, 'utf8');

    return NextResponse.json({
      content,
      path: resolvedPath,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { path: targetPath, content } = body;

    if (!targetPath) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    if (content === undefined || content === null) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const resolvedPath = path.resolve(targetPath);

    // Ensure the parent directory exists
    const parentDir = path.dirname(resolvedPath);
    await fs.mkdir(parentDir, { recursive: true });

    await fs.writeFile(resolvedPath, content, 'utf8');

    return NextResponse.json({
      success: true,
      path: resolvedPath,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
