import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const MCP_FILE_PATH = path.join(process.cwd(), '.vibeforge', 'mcp.json');

async function ensureFileExists() {
  try {
    await fs.mkdir(path.dirname(MCP_FILE_PATH), { recursive: true });
    await fs.access(MCP_FILE_PATH);
  } catch {
    await fs.writeFile(MCP_FILE_PATH, JSON.stringify({ servers: [] }, null, 2));
  }
}

export async function GET() {
  try {
    await ensureFileExists();
    const data = await fs.readFile(MCP_FILE_PATH, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureFileExists();
    const server = await req.json();
    if (!server.name || !server.commandOrUrl) {
      return NextResponse.json({ error: 'Name and command/URL are required' }, { status: 400 });
    }

    const data = await fs.readFile(MCP_FILE_PATH, 'utf-8');
    const config = JSON.parse(data);
    
    // Check for duplicates
    config.servers = config.servers.filter((s: any) => s.name !== server.name);
    config.servers.push({
      name: server.name,
      commandOrUrl: server.commandOrUrl,
      args: server.args || [],
      env: server.env || {},
      status: 'Disconnected',
      enabled: server.enabled !== false,
    });

    await fs.writeFile(MCP_FILE_PATH, JSON.stringify(config, null, 2));
    return NextResponse.json({ ok: true, servers: config.servers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureFileExists();
    const url = new URL(req.url);
    const name = url.searchParams.get('name');
    if (!name) {
      return NextResponse.json({ error: 'Name parameter is required' }, { status: 400 });
    }

    const data = await fs.readFile(MCP_FILE_PATH, 'utf-8');
    const config = JSON.parse(data);
    config.servers = config.servers.filter((s: any) => s.name !== name);

    await fs.writeFile(MCP_FILE_PATH, JSON.stringify(config, null, 2));
    return NextResponse.json({ ok: true, servers: config.servers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
