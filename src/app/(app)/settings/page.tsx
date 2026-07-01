'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Settings, Database, Terminal, Server, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface McpServer {
  name: string;
  commandOrUrl: string;
  args: string[];
  env: Record<string, string>;
  status: string;
  enabled: boolean;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [showAddMcp, setShowAddMcp] = useState(false);
  const [mcpName, setMcpName] = useState('');
  const [mcpCommand, setMcpCommand] = useState('');
  const [mcpArgs, setMcpArgs] = useState('');
  const [mcpEnv, setMcpEnv] = useState('');

  const { data: mcpData } = useQuery<{ servers: McpServer[] }>({
    queryKey: ['mcp-servers'],
    queryFn: async () => {
      const res = await fetch('/api/mcp');
      if (!res.ok) throw new Error('Failed to fetch MCP config');
      return res.json();
    },
  });

  const mcpServers = mcpData?.servers || [];

  const handleAddMcpServer = async () => {
    if (!mcpName.trim() || !mcpCommand.trim()) {
      toast.error('Name and command/URL are required');
      return;
    }

    let envObj: Record<string, string> = {};
    if (mcpEnv.trim()) {
      try {
        envObj = JSON.parse(mcpEnv);
      } catch {
        toast.error('Env must be valid JSON (e.g. {"KEY":"value"})');
        return;
      }
    }

    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mcpName.trim(),
          commandOrUrl: mcpCommand.trim(),
          args: mcpArgs.trim() ? mcpArgs.split(' ') : [],
          env: envObj,
        }),
      });
      if (!res.ok) throw new Error('Failed to add MCP server');
      toast.success(`MCP server "${mcpName}" added`);
      setMcpName('');
      setMcpCommand('');
      setMcpArgs('');
      setMcpEnv('');
      setShowAddMcp(false);
      queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteMcpServer = async (name: string) => {
    try {
      const res = await fetch(`/api/mcp?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove MCP server');
      toast.success(`MCP server "${name}" removed`);
      queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleMcpServer = async (server: McpServer) => {
    try {
      await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...server, enabled: !server.enabled }),
      });
      queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-1 flex-col p-8 max-w-4xl mx-auto w-full gap-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your VibeForge workspace.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Settings className="size-5" />
            </div>
            <div>
              <CardTitle>General</CardTitle>
              <CardDescription>Application settings and preferences.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Application Name</Label>
              <p className="text-sm text-muted-foreground mt-0.5">The name of your application.</p>
            </div>
            <Input value="VibeForge" disabled className="w-48" />
          </div>
          
          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground mt-0.5">Toggle between light and dark theme.</p>
            </div>
            <Switch 
              checked={theme === 'dark'} 
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="size-5" />
            </div>
            <div>
              <CardTitle>NocoDB</CardTitle>
              <CardDescription>Database connection and sync settings.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Connection Status</Label>
              <p className="text-sm text-muted-foreground mt-0.5">Current NocoDB connection state.</p>
            </div>
            <Badge variant="default" className="bg-green-600 hover:bg-green-600">
              Connected
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Terminal className="size-5" />
            </div>
            <div>
              <CardTitle>Workspace</CardTitle>
              <CardDescription>Workspace feature toggles.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Terminal</Label>
              <p className="text-sm text-muted-foreground mt-0.5">Allow terminal access in the workspace.</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Git Integration</Label>
              <p className="text-sm text-muted-foreground mt-0.5">Allow git operations from the workspace.</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Server className="size-5" />
            </div>
            <div>
              <CardTitle>MCP Servers</CardTitle>
              <CardDescription>Configure Model Context Protocol servers for extended tool support.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mcpServers.length === 0 && !showAddMcp && (
            <p className="text-sm text-muted-foreground">No MCP servers configured. Add one to extend AI capabilities.</p>
          )}

          {mcpServers.map((server) => (
            <div key={server.name} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{server.name}</span>
                  <Badge variant={server.enabled ? 'default' : 'outline'} className="text-[10px]">
                    {server.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-1 truncate max-w-[400px]">{server.commandOrUrl}</p>
                {server.args && server.args.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">Args: {server.args.join(' ')}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={server.enabled}
                  onCheckedChange={() => handleToggleMcpServer(server)}
                />
                <button
                  onClick={() => handleDeleteMcpServer(server.name)}
                  className="text-destructive hover:text-destructive/80 transition-colors p-1"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}

          {showAddMcp && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="grid gap-2">
                <Label className="text-xs">Server Name</Label>
                <Input
                  value={mcpName}
                  onChange={(e) => setMcpName(e.target.value)}
                  placeholder="e.g. filesystem"
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Command or URL</Label>
                <Input
                  value={mcpCommand}
                  onChange={(e) => setMcpCommand(e.target.value)}
                  placeholder="e.g. npx -y @modelcontextprotocol/server-filesystem"
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Arguments (space-separated)</Label>
                <Input
                  value={mcpArgs}
                  onChange={(e) => setMcpArgs(e.target.value)}
                  placeholder="e.g. /path/to/project"
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Environment Variables (JSON)</Label>
                <Input
                  value={mcpEnv}
                  onChange={(e) => setMcpEnv(e.target.value)}
                  placeholder='e.g. {"API_KEY":"sk-..."}'
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowAddMcp(false)}
                  className="px-3 py-1.5 text-xs rounded border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMcpServer}
                  className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Add Server
                </button>
              </div>
            </div>
          )}

          {!showAddMcp && (
            <button
              onClick={() => setShowAddMcp(true)}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="size-4" />
              Add MCP Server
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
