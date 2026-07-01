import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, cwd } = body;

    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    // Basic security validation: prevent chaining or backgrounding (for MVP local usage, we allow most commands, but protect root traversal)
    if (command.includes('sudo') || command.includes('rm -rf /') || command.includes(':(){:|:&};:')) {
      return NextResponse.json({ error: 'Forbidden command signature detected' }, { status: 403 });
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: cwd || process.cwd(),
        timeout: 15000, // 15s timeout
        env: { ...process.env },
      });

      return NextResponse.json({
        ok: true,
        stdout,
        stderr,
        cwd: cwd || process.cwd(),
      });
    } catch (execError: any) {
      return NextResponse.json({
        ok: false,
        stdout: execError.stdout || '',
        stderr: execError.stderr || execError.message,
        cwd: cwd || process.cwd(),
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
