'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Clock, Activity, Hash, Zap } from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';
import { getField } from '@/lib/nocodb-fields';
import type { AgentRun, NocoDBListResponse } from '@/types';

function useAgentRuns() {
  return useQuery({
    queryKey: ['agent-runs'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error('Failed to fetch agent runs');
      return res.json() as Promise<NocoDBListResponse<AgentRun>>;
    },
    refetchInterval: 5000, // Poll every 5s for real-time feel
  });
}

const statusColor: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  running: 'default',
  completed: 'secondary',
  failed: 'destructive',
  pending: 'outline',
};

export default function AgentsPage() {
  const { data, isLoading, error, refetch } = useAgentRuns();

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col p-8 max-w-7xl mx-auto w-full gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 mt-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col p-8 max-w-7xl mx-auto w-full">
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  const runs = data?.list || [];
  
  // Compute Stats
  const activeRunsCount = runs.filter(r => getField(r as unknown as Record<string, unknown>, 'status', 'Status') === 'running').length;
  
  const totalRequests = runs.length;
  
  // Tokens (not tracked natively yet, mock/calculate if possible, we'll say N/A or compute if fields exist)
  // Let's assume input_tokens/output_tokens might exist or just show N/A
  const totalTokens = 'N/A'; // We don't have token counts in AgentRun currently

  // Avg Response Time
  let totalTimeSeconds = 0;
  let completedCount = 0;
  runs.forEach(r => {
    const status = getField(r as unknown as Record<string, unknown>, 'status', 'Status');
    const started = getField(r as unknown as Record<string, unknown>, 'started_at', 'Started At');
    const finished = getField(r as unknown as Record<string, unknown>, 'finished_at', 'Finished At');
    if (status === 'completed' && started && finished) {
      totalTimeSeconds += differenceInSeconds(new Date(finished), new Date(started));
      completedCount++;
    }
  });
  
  const avgResponseTime = completedCount > 0 
    ? `${Math.round((totalTimeSeconds / completedCount) * 10) / 10}s` 
    : 'N/A';

  // Group by Provider & Model
  // Provider name isn't directly on agent_runs (only provider_id), but we have model.
  const modelStats: Record<string, number> = {};
  runs.forEach(r => {
    const model = getField(r as unknown as Record<string, unknown>, 'model', 'Model') || 'Unknown Model';
    modelStats[model] = (modelStats[model] || 0) + 1;
  });

  return (
    <div className="flex flex-1 flex-col p-8 max-w-7xl mx-auto w-full gap-6">
      <div className="flex items-center gap-4 mb-2">
        <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
        {activeRunsCount > 0 && (
          <Badge variant="default" className="animate-pulse bg-green-500 hover:bg-green-600">
            {activeRunsCount} Active
          </Badge>
        )}
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-xs text-muted-foreground">Total agent runs recorded</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens}</div>
            <p className="text-xs text-muted-foreground">Input + Output</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime}</div>
            <p className="text-xs text-muted-foreground">Average completion time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* By Model Section */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">By Model</CardTitle>
            <CardDescription>Request distribution across models</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {Object.keys(modelStats).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground space-y-2">
                <Bot className="h-8 w-8 opacity-50" />
                <p className="text-sm">No model data available yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(modelStats)
                    .sort((a, b) => b[1] - a[1])
                    .map(([model, count]) => (
                      <TableRow key={model}>
                        <TableCell className="font-medium text-xs">{model}</TableCell>
                        <TableCell className="text-right text-xs">{count}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Agent Runs Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Agent Runs</CardTitle>
            <CardDescription>Detailed logs of recent agent activity</CardDescription>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <EmptyState 
                icon={Bot}
                title="No agent runs yet"
                description="Agent runs will appear here as AI agents execute tasks."
              />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="w-[200px]">I/O Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map((run) => {
                      const r = run as unknown as Record<string, unknown>;
                      const agentName = getField(r, 'agent_name', 'Agent Name');
                      const skill = getField(r, 'skill', 'Skill');
                      const model = getField(r, 'model', 'Model');
                      const status = getField(r, 'status', 'Status');
                      const startedAt = getField(r, 'started_at', 'Started At');
                      const finishedAt = getField(r, 'finished_at', 'Finished At');
                      const inputSummary = getField(r, 'input_summary', 'Input Summary');
                      const outputSummary = getField(r, 'output_summary', 'Output Summary');
                      
                      let duration = '-';
                      if (startedAt && finishedAt) {
                        const diff = differenceInSeconds(new Date(finishedAt), new Date(startedAt));
                        duration = `${diff}s`;
                      } else if (startedAt && status === 'running') {
                        const diff = differenceInSeconds(new Date(), new Date(startedAt));
                        duration = `${diff}s (running)`;
                      }

                      const ioSummary = [
                        inputSummary ? `In: ${inputSummary.substring(0, 20)}...` : null,
                        outputSummary ? `Out: ${outputSummary.substring(0, 20)}...` : null
                      ].filter(Boolean).join(' | ');

                      return (
                        <TableRow key={run.Id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <div className="font-medium text-sm">{agentName || 'Unknown Agent'}</div>
                            {skill && <div className="text-xs text-muted-foreground">{skill}</div>}
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-xs">{model || '-'}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusColor[status.toLowerCase()] || 'outline'}>
                              {status || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {startedAt ? formatDistanceToNow(new Date(startedAt), { addSuffix: true }) : '-'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {duration}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]" title={ioSummary}>
                            {ioSummary || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground mt-4">
        Real-time agent activity will appear here as agents execute tasks.
      </div>
    </div>
  );
}