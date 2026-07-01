import { getRecord } from '@/lib/nocodb';
import { getProviderLocalConfig, resolveApiKey } from '@/lib/local-config';
import { getField } from '@/lib/nocodb-fields';
import type { Provider } from '@/types';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'list_directory',
      description: 'List files and directories in a path relative to the project root',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Relative path from project root (use "." for root)' } },
        required: ['path'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'read_file',
      description: 'Read the contents of a file relative to the project root',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Relative file path from project root' } },
        required: ['path'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'edit_file',
      description: 'Edit a file by replacing old_string with new_string',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative file path' },
          old_string: { type: 'string', description: 'Text to find' },
          new_string: { type: 'string', description: 'Replacement text' },
        },
        required: ['path', 'old_string', 'new_string'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'run_command',
      description: 'Run a shell command in the project directory',
      parameters: {
        type: 'object',
        properties: { command: { type: 'string', description: 'Shell command to execute' } },
        required: ['command'],
      },
    },
  },
];

async function executeTool(name: string, args: Record<string, string>, projectRoot: string): Promise<string> {
  const resolve = (p: string) => path.resolve(projectRoot, p);

  switch (name) {
    case 'list_directory': {
      const target = resolve(args.path || '.');
      const entries = await fs.readdir(target, { withFileTypes: true });
      return entries
        .map((e) => `${e.isDirectory() ? '📁' : '📄'} ${e.name}`)
        .join('\n') || '(empty directory)';
    }
    case 'read_file': {
      const filePath = resolve(args.path);
      const content = await fs.readFile(filePath, 'utf-8');
      if (content.length > 6000) {
        return content.slice(0, 6000) + `\n\n... [truncated, total ${content.length} chars]`;
      }
      return content;
    }
    case 'edit_file': {
      const filePath = resolve(args.path);
      const content = await fs.readFile(filePath, 'utf-8');
      if (!content.includes(args.old_string)) {
        return `Error: old_string not found in ${args.path}`;
      }
      const newContent = content.replace(args.old_string, args.new_string);
      await fs.writeFile(filePath, newContent, 'utf-8');
      return `Successfully edited ${args.path}`;
    }
    case 'run_command': {
      const { stdout, stderr } = await execAsync(args.command, {
        cwd: projectRoot,
        timeout: 15000,
      });
      return (stdout + (stderr ? `\nSTDERR: ${stderr}` : '')).slice(0, 4000) || '(no output)';
    }
    default:
      return `Unknown tool: ${name}`;
  }
}

export async function POST(req: Request) {
  try {
    const { messages, providerId, model, skill, projectPath } = await req.json();

    if (!providerId) {
      return new Response(JSON.stringify({ error: 'No providerId specified' }), { status: 400 });
    }

    let provider: Provider | null = null;
    try {
      provider = await getRecord<Provider>('providers', Number(providerId));
    } catch {
      return new Response(JSON.stringify({ error: 'Provider not found' }), { status: 404 });
    }

    const rec = provider as unknown as Record<string, unknown>;
    const localConfig = getProviderLocalConfig(provider.Id) || {};
    const mode = localConfig.apiKeyMode || 'env';
    const envName = localConfig.apiKeyEnvName || '';

    const apiKey = resolveApiKey(provider.Id, mode, envName, localConfig.directApiKey);
    if (!apiKey && mode !== 'none') {
      return new Response(JSON.stringify({ error: `API Key not configured` }), { status: 401 });
    }

    const baseUrl = (getField(rec, 'base_url', 'Base URL') || 'https://api.openai.com/v1').replace(/\/$/, '');
    const targetModel = model || getField(rec, 'default_model', 'Default Model') || 'gpt-4o';
    const url = `${baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    };

    const workspaceRoot = projectPath || process.cwd();

    let mcpServerInfo = '';
    try {
      const mcpPath = path.join(process.cwd(), '.vibeforge', 'mcp.json');
      const mcpData = await fs.readFile(mcpPath, 'utf-8').catch(() => '{"servers":[]}');
      const { servers } = JSON.parse(mcpData);
      const enabledServers = servers.filter((s: any) => s.enabled !== false);
      if (enabledServers.length > 0) {
        mcpServerInfo = `\n\nConfigured MCP Servers (for your awareness):\n${enabledServers.map((s: any) => `- ${s.name}: ${s.commandOrUrl}`).join('\n')}`;
      }
    } catch {}

    const systemPrompt = `You are VibeForge AI Agent, a powerful coding assistant. You have access to tools to interact with the user's project.

Project root: ${workspaceRoot}

Available tools: list_directory, read_file, edit_file, run_command.
All file paths are relative to the project root.
Use tools to explore and modify the project. Be thorough and helpful.
${skill ? `\nCurrently running skill: ${skill}` : ''}${mcpServerInfo}`;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          const conversationMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map((m: { role: string; content: string }) => ({
              role: m.role,
              content: m.content,
            })),
          ];

          let iteration = 0;
          const MAX_ITERATIONS = 10;

          while (iteration < MAX_ITERATIONS) {
            iteration++;

            const body: Record<string, unknown> = {
              model: targetModel,
              messages: conversationMessages,
              tools: TOOLS,
              tool_choice: 'auto',
            };

            const response = await fetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify(body),
            });

            if (!response.ok) {
              const errText = await response.text();
              emit('content', { delta: `\n\nProvider Error: ${response.status} - ${errText.slice(0, 300)}` });
              break;
            }

            const data = await response.json();
            const choice = data.choices?.[0];

            if (!choice) {
              emit('content', { delta: '\n\nNo response from model.' });
              break;
            }

            const msg = choice.message;

            if (msg.tool_calls && msg.tool_calls.length > 0) {
              conversationMessages.push({
                role: 'assistant',
                content: msg.content || '',
                tool_calls: msg.tool_calls,
              } as any);

              if (msg.content) {
                emit('thought', { text: msg.content });
              }

              for (const toolCall of msg.tool_calls) {
                const fnName = toolCall.function.name;
                let fnArgs: Record<string, string> = {};
                try {
                  fnArgs = JSON.parse(toolCall.function.arguments);
                } catch {
                  fnArgs = { error: toolCall.function.arguments };
                }

                emit('tool_call', { id: toolCall.id, name: fnName, args: fnArgs });

                let toolOutput: string;
                let isError = false;
                try {
                  toolOutput = await executeTool(fnName, fnArgs, workspaceRoot);
                } catch (e: unknown) {
                  toolOutput = `Error: ${e instanceof Error ? e.message : String(e)}`;
                  isError = true;
                }

                emit('tool_result', {
                  id: toolCall.id,
                  name: fnName,
                  output: toolOutput.slice(0, 2000),
                  isError,
                });

                conversationMessages.push({
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: toolOutput,
                } as any);
              }

              continue;
            }

            if (msg.content) {
              emit('content', { delta: msg.content });
            }
            break;
          }

          emit('done', {});
        } catch (e: unknown) {
          const errMsg = e instanceof Error ? e.message : String(e);
          controller.enqueue(encoder.encode(`event: content\ndata: ${JSON.stringify({ delta: `\n\nAgent Error: ${errMsg}` })}\n\n`));
          controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
