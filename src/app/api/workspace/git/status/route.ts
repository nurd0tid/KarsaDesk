import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetPath = searchParams.get('path');

    if (!targetPath) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    try {
      const { stdout } = await execAsync('git status --porcelain', { cwd: targetPath });
      const changes = stdout.split('\n').filter(Boolean).map(line => {
        const status = line.substring(0, 2);
        const file = line.substring(3);
        return { status, file };
      });

      let branch = '';
      try {
        const { stdout: branchOut } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: targetPath });
        branch = branchOut.trim();
      } catch {
        // ignore
      }

      return NextResponse.json({ branch, changes });
    } catch (e) {
      return NextResponse.json({ branch: '', changes: [], error: 'Not a git repository or git not available' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
