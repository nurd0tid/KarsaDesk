'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, RefreshCw, CheckCircle2, XCircle, Clock, Activity, Zap, BarChart2 } from 'lucide-react';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDistanceToNow, differenceInMilliseconds, subHours, format } from 'date-fns';
import { getField } from '@/lib/nocodb-fields';
import type { AgentRun, NocoDBListResponse } from '@/types';

function useAgentRuns() {
  return useQuery({
    queryKey: ['agent-runs'],
    queryFn: async () => {
      const res = await fetch('/api/agents?limit=100');
      if (!res.ok) throw new Error('Failed to fetch agent runs');
      return res.json() as Promise<NocoDBListResponse<AgentRun>>;
    },
    refetchInterval: 60000,
  });
}

const statusColor: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  running: 'default',
  completed: 'secondary',
  failed: 'destructive',
  pending: 'outline',
};

function inferProvider(model: string, providerId: string): string {
  const m = (model || '').toLowerCase();
  const p = (providerId || '').toLowerCase();
  if (m.includes('9router') || m.includes('opus-sonnet') || p.includes('9router')) return '9Router';
  if (m.includes('gpt') || m.includes('o1') || m.includes('o3') || m.includes('o4') || p.includes('openai')) return 'OpenAI';
  if (m.includes('claude') || p.includes('anthropic')) return 'Anthropic';
  if (m.includes('gemini') || p.includes('gemini') || p.includes('google')) return 'Google';
  if (m.includes('llama') || m.includes('mistral') || m.includes('deepseek')) return 'OpenRouter';
  if (p.includes('ollama') || m.includes('ollama')) return 'Ollama';
  if (p.includes('opencode') || m.includes('opencode')) return 'OpenCode';
  return 'Unknown';
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const SVG_WIDTH = 800;
const SVG_HEIGHT = 180;
const PAD_LEFT = 46;
const PAD_RIGHT = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;
const CHART_W = SVG_WIDTH - PAD_LEFT - PAD_RIGHT;
const CHART_H = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM;
const CHART_X0 = PAD_LEFT;
const CHART_Y1 = PAD_TOP + CHART_H;

function buildBuckets(runs: AgentRun[]) {
  const now = new Date();
  const buckets = Array.from({ length: 24 }, (_, i) => {
    const bucketEnd = subHours(now, 23 - i);
    const bucketStart = subHours(bucketEnd, 1);
    return { label: format(bucketEnd, 'HH:mm'), start: bucketStart, end: bucketEnd, count: 0 };
  });

  for (const run of runs) {
    const r = run as unknown as Record<string, unknown>;
    const startedAtStr = getField(r, 'started_at', 'Started At') || (run.CreatedAt ?? '');
    if (!startedAtStr) continue;
    const d = new Date(startedAtStr);
    for (const bucket of buckets) {
      if (d >= bucket.start && d < bucket.end) {
        bucket.count++;
        break;
      }
    }
  }

  return buckets;
}

function UsageChart({ buckets }: { buckets: ReturnType<typeof buildBuckets> }) {
  const counts = buckets.map(b => b.count);
  const rawMax = Math.max(...counts, 1);
  const niceMax = rawMax <= 4 ? 4 : rawMax <= 10 ? 10 : rawMax <= 20 ? 20 : Math.ceil(rawMax / 5) * 5;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(t * niceMax));

  const pts = buckets.map((b, i) => {
    const x = CHART_X0 + (i / 23) * CHART_W;
    const y = CHART_Y1 - (b.count / niceMax) * CHART_H;
    return { x, y };
  });

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const areaPath = `M ${CHART_X0.toFixed(2)} ${CHART_Y1.toFixed(2)} ${pts.map(p => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')} L ${(CHART_X0 + CHART_W).toFixed(2)} ${CHART_Y1.toFixed(2)} Z`;

  const labelIndices = buckets.map((_, i) => i).filter(i => i % 4 === 0 || i === 23);

  return (
    <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(59,130,246)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="rgb(59,130,246)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {ticks.map((t, i) => {
        const y = CHART_Y1 - (t / niceMax) * CHART_H;
        return (
          <g key={i}>
            <line x1={CHART_X0} y1={y} x2={CHART_X0 + CHART_W} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
            <text x={CHART_X0 - 6} y={y + 4} textAnchor="end" fontSize="10" fill="currentColor" fillOpacity="0.5">
              {t}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#areaGrad)" />

      <path d={linePath} fill="none" stroke="rgb(59,130,246)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {labelIndices.map(i => {
        const x = CHART_X0 + (i / 23) * CHART_W;
        return (
          <text key={i} x={x} y={SVG_HEIGHT - 4} textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.45">
            {buckets[i].label}
          </text>
        );
      })}

      {pts.map((p, i) => (
        buckets[i].count > 0 && (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="rgb(59,130,246)" fillOpacity="0.9" />
        )
      ))}
    </svg>
  );
}

export default function AgentsPage() {
  const { data, isLoading, error, refetch } = useAgentRuns();
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          refetch();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [refetch]);

  const runs = useMemo(() => data?.list ?? [], [data]);

  const buckets = useMemo(() => buildBuckets(runs), [runs]);

  const activeRunsCount = useMemo(
    () => runs.filter(r => getField(r as unknown as Record<string, unknown>, 'status', 'Status') === 'running').length,
    [runs]
  );

  const modelStats = useMemo(() => {
    const map: Record<string, {
      provider: string;
      model: string;
      requests: number;
      lastUsed: Date | null;
      totalLatencyMs: number;
      latencyCount: number;
      lastStatus: string;
    }> = {};

    for (const run of runs) {
      const r = run as unknown as Record<string, unknown>;
      const model = getField(r, 'model', 'Model') || 'Unknown';
      const providerId = getField(r, 'provider_id', 'Provider ID');
      const provider = inferProvider(model, providerId);
      const startedAtStr = getField(r, 'started_at', 'Started At');
      const finishedAtStr = getField(r, 'finished_at', 'Finished At');
      const status = getField(r, 'status', 'Status');

      if (!map[model]) {
        map[model] = { provider, model, requests: 0, lastUsed: null, totalLatencyMs: 0, latencyCount: 0, lastStatus: '' };
      }
      map[model].requests++;

      const startedAt = startedAtStr ? new Date(startedAtStr) : null;
      if (startedAt) {
        if (!map[model].lastUsed || startedAt > map[model].lastUsed!) {
          map[model].lastUsed = startedAt;
          map[model].lastStatus = status;
        }
      }

      if (startedAtStr && finishedAtStr) {
        const ms = differenceInMilliseconds(new Date(finishedAtStr), new Date(startedAtStr));
        if (ms >= 0) {
          map[model].totalLatencyMs += ms;
          map[model].latencyCount++;
        }
      }
    }

    return Object.values(map).sort((a, b) => b.requests - a.requests);
  }, [runs]);

  const recentRuns = useMemo(() => runs.slice(0, 20), [runs]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col p-6 max-w-7xl mx-auto w-full gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-40 rounded-full ml-auto" />
        </div>
        <Skeleton className="h-52 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col p-6 max-w-7xl mx-auto w-full">
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-6 max-w-7xl mx-auto w-full gap-5">
      <div className="flex items-center gap-3">
        <Bot className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-semibold tracking-tight">AI Agents</h1>
        {activeRunsCount > 0 && (
          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            {activeRunsCount} Running
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          <span>Auto-refreshing in <span className="font-mono font-semibold text-foreground">{countdown}s</span></span>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-base font-medium">Requests Over 24 Hours</CardTitle>
          </div>
          <span className="text-xs text-muted-foreground">by hour</span>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-44 w-full">
            {runs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No data yet
              </div>
            ) : (
              <UsageChart buckets={buckets} />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center gap-2">
          <Activity className="h-4 w-4 text-blue-500" />
          <CardTitle className="text-base font-medium">Model Statistics</CardTitle>
          <span className="text-xs text-muted-foreground ml-auto">all contexts: chat · planning · tasks</span>
        </CardHeader>
        <CardContent className="pt-0">
          {modelStats.length === 0 ? (
            <EmptyState icon={Bot} title="No model data" description="Agent runs will appear here as AI agents execute tasks." />
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-medium">Provider</TableHead>
                    <TableHead className="text-xs font-medium">Model</TableHead>
                    <TableHead className="text-xs font-medium text-right">Requests</TableHead>
                    <TableHead className="text-xs font-medium">Last Used</TableHead>
                    <TableHead className="text-xs font-medium text-right">Input Tokens</TableHead>
                    <TableHead className="text-xs font-medium text-right">Output Tokens</TableHead>
                    <TableHead className="text-xs font-medium text-right">Avg Latency</TableHead>
                    <TableHead className="text-xs font-medium text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modelStats.map(stat => {
                    const avgLatency = stat.latencyCount > 0
                      ? formatLatency(Math.round(stat.totalLatencyMs / stat.latencyCount))
                      : '—';
                    return (
                      <TableRow key={stat.model} className="hover:bg-muted/30">
                        <TableCell className="text-xs text-muted-foreground">{stat.provider}</TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">{stat.model}</span>
                        </TableCell>
                        <TableCell className="text-xs text-right font-semibold">{stat.requests}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {stat.lastUsed ? formatDistanceToNow(stat.lastUsed, { addSuffix: true }) : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">N/A</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">N/A</TableCell>
                        <TableCell className="text-xs text-right font-mono">{avgLatency}</TableCell>
                        <TableCell className="text-center">
                          {stat.lastStatus === 'completed' ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                          ) : stat.lastStatus === 'failed' ? (
                            <XCircle className="h-3.5 w-3.5 text-destructive mx-auto" />
                          ) : stat.lastStatus === 'running' ? (
                            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
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

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          <CardTitle className="text-base font-medium">Recent Agent Runs</CardTitle>
          <span className="text-xs text-muted-foreground ml-auto">last {recentRuns.length} runs</span>
        </CardHeader>
        <CardContent className="pt-0">
          {recentRuns.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="No agent runs yet"
              description="Agent runs will appear here as AI agents execute tasks."
            />
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-medium">Agent</TableHead>
                    <TableHead className="text-xs font-medium">Model</TableHead>
                    <TableHead className="text-xs font-medium">Status</TableHead>
                    <TableHead className="text-xs font-medium">Started</TableHead>
                    <TableHead className="text-xs font-medium text-right">Duration</TableHead>
                    <TableHead className="text-xs font-medium w-[180px]">I/O Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRuns.map(run => {
                    const r = run as unknown as Record<string, unknown>;
                    const agentName = getField(r, 'agent_name', 'Agent Name');
                    const skill = getField(r, 'skill', 'Skill');
                    const model = getField(r, 'model', 'Model');
                    const status = getField(r, 'status', 'Status');
                    const startedAt = getField(r, 'started_at', 'Started At');
                    const finishedAt = getField(r, 'finished_at', 'Finished At');
                    const inputSummary = getField(r, 'input_summary', 'Input Summary');
                    const outputSummary = getField(r, 'output_summary', 'Output Summary');

                    let duration = '—';
                    if (startedAt && finishedAt) {
                      const ms = differenceInMilliseconds(new Date(finishedAt), new Date(startedAt));
                      duration = formatLatency(ms);
                    } else if (startedAt && status === 'running') {
                      const ms = differenceInMilliseconds(new Date(), new Date(startedAt));
                      duration = `${formatLatency(ms)} •`;
                    }

                    const ioSummary = [
                      inputSummary ? `→ ${inputSummary.substring(0, 22)}` : null,
                      outputSummary ? `← ${outputSummary.substring(0, 22)}` : null,
                    ].filter(Boolean).join('\n') || '—';

                    return (
                      <TableRow key={run.Id} className="hover:bg-muted/30 align-top">
                        <TableCell>
                          <div className="font-medium text-xs">{agentName || 'Unknown Agent'}</div>
                          {skill && <div className="text-xs text-muted-foreground mt-0.5">{skill}</div>}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-muted-foreground">{model || '—'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColor[status?.toLowerCase()] ?? 'outline'} className="text-xs">
                            {status || 'unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {startedAt ? formatDistanceToNow(new Date(startedAt), { addSuffix: true }) : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono whitespace-nowrap">
                          {duration}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="truncate max-w-[180px] whitespace-pre-wrap leading-relaxed" title={ioSummary}>
                            {ioSummary}
                          </div>
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

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pb-2">
        <Zap className="h-3 w-3" />
        <span>Live data · refreshes every 60s</span>
      </div>
    </div>
  );
}
