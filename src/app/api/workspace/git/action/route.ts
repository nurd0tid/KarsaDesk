import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, path: projectPath, message } = body;

    if (!projectPath) {
      return NextResponse.json({ error: 'Project path is required' }, { status: 400 });
    }

    const opts = { cwd: projectPath, timeout: 30000 };
    let output = '';

    switch (action) {
      case 'pull':
        const { stdout: pullOut, stderr: pullErr } = await execAsync('git pull', opts);
        output = pullOut || pullErr;
        break;

      case 'push':
        const { stdout: pushOut, stderr: pushErr } = await execAsync('git push', opts);
        output = pushOut || pushErr;
        break;

      case 'sync':
        const { stdout: pullSyncOut } = await execAsync('git pull', opts);
        const { stdout: pushSyncOut } = await execAsync('git push', opts);
        output = [pullSyncOut, pushSyncOut].filter(Boolean).join('\n');
        break;

      case 'commit':
        if (!message) return NextResponse.json({ error: 'Commit message is required' }, { status: 400 });
        const { stdout: addOut } = await execAsync('git add -A', opts);
        const { stdout: commitOut, stderr: commitErr } = await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`, opts);
        output = [addOut, commitOut || commitErr].filter(Boolean).join('\n');
        break;

      case 'fetch':
        const { stdout: fetchOut, stderr: fetchErr } = await execAsync('git fetch', opts);
        output = fetchOut || fetchErr;
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true, output });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.stderr || error.message || 'Git action failed',
    }, { status: 500 });
  }
}
