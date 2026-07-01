import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    let targetPath = searchParams.get('path') || '';

    if (!targetPath) {
      targetPath = process.cwd();
    }

    const resolvedPath = path.resolve(targetPath);

    let repoUrl = '';
    try {
      const { stdout } = await execAsync('git config --get remote.origin.url', { cwd: resolvedPath });
      repoUrl = stdout.trim();
    } catch {
      // Not a git repo or no origin
    }

    let branch = '';
    try {
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: resolvedPath });
      branch = stdout.trim();
    } catch {
      // Not in a git repo
    }

    const projectName = path.basename(resolvedPath);

    return NextResponse.json({
      repository_url: repoUrl,
      default_branch: branch || 'main',
      local_path: resolvedPath,
      project_name: projectName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
