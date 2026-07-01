import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    let targetPath = searchParams.get('path');

    if (!targetPath) {
      targetPath = process.env.VIBEFORGE_WORKSPACE_ROOT || os.homedir();
    }

    // Resolve to absolute path to handle things like '.' or '..' safely
    const resolvedPath = path.resolve(targetPath);

    // Check if directory exists
    try {
      const stats = await fs.stat(resolvedPath);
      if (!stats.isDirectory()) {
        return NextResponse.json({ error: 'Path is not a directory' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Directory not found or inaccessible' }, { status: 404 });
    }

    const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
    
    const directories = entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    return NextResponse.json({
      currentPath: resolvedPath,
      parentPath: path.dirname(resolvedPath),
      directories,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
