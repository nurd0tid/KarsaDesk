'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollText, Plus, Calendar, AlertTriangle, Info } from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { DailyLog, WeeklyLog, NocoDBListResponse } from '@/types';

function useDailyLogs() {
  return useQuery({
    queryKey: ['logs', 'daily'],
    queryFn: async () => {
      const res = await fetch('/api/logs/daily');
      if (!res.ok) throw new Error('Failed to fetch daily logs');
      return res.json() as Promise<NocoDBListResponse<DailyLog>>;
    },
  });
}

function useWeeklyLogs() {
  return useQuery({
    queryKey: ['logs', 'weekly'],
    queryFn: async () => {
      const res = await fetch('/api/logs/weekly');
      if (!res.ok) throw new Error('Failed to fetch weekly logs');
      return res.json() as Promise<NocoDBListResponse<WeeklyLog>>;
    },
  });
}

export default function LogsPage() {
  const { data: dailyData, isLoading: dailyLoading, error: dailyError, refetch: refetchDaily } = useDailyLogs();
  const { data: weeklyData, isLoading: weeklyLoading, error: weeklyError, refetch: refetchWeekly } = useWeeklyLogs();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Daily log created (Mock action for MVP)');
    setIsDialogOpen(false);
  };

  const isLoading = dailyLoading || weeklyLoading;

  if (isLoading) {
    return <LoadingState />;
  }

  const dailyLogs = dailyData?.list || [];
  const weeklyLogs = weeklyData?.list || [];

  return (
    <div className="flex flex-1 flex-col p-8 max-w-7xl mx-auto w-full gap-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
          <p className="text-muted-foreground mt-1">Track daily and weekly progress summaries.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button>
              <Plus className="mr-2 size-4" />
              Create Daily Log
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Daily Log</DialogTitle>
              <DialogDescription>Record what you accomplished today.</DialogDescription>
            </DialogHeader>
            <form id="daily-log-form" onSubmit={handleCreateLog} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="log-date">Date</Label>
                <Input id="log-date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="log-summary">Summary</Label>
                <Textarea id="log-summary" placeholder="What did you accomplish today?" required className="min-h-24" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="log-blockers">Blockers</Label>
                <Textarea id="log-blockers" placeholder="Any blockers or issues?" className="min-h-16" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="log-next-steps">Next Steps</Label>
                <Textarea id="log-next-steps" placeholder="What's planned next?" className="min-h-16" />
              </div>
            </form>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" form="daily-log-form">Save Log</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-600 dark:text-blue-400">
        <Info className="size-4 shrink-0" />
        <span>Daily logs are automatically generated when AI agents complete tasks. You can also create manual entries.</span>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList>
          <TabsTrigger value="daily">Daily Logs</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6">
          {dailyError ? (
            <ErrorState message={dailyError.message} onRetry={() => refetchDaily()} />
          ) : dailyLogs.length === 0 ? (
            <EmptyState 
              icon={ScrollText}
              title="No daily logs yet"
              description="Start recording your daily progress to build a history of your work."
              actionLabel="Create Daily Log"
              onAction={() => setIsDialogOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {dailyLogs.map((log) => (
                <Card key={log.Id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground" />
                        <CardTitle className="text-base">{format(new Date(log.date), 'EEEE, MMM d, yyyy')}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">{log.summary}</p>
                    {log.blockers && (
                      <div className="flex items-start gap-2 p-2 rounded bg-destructive/10 text-sm mt-2">
                        <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                        <span className="text-destructive">{log.blockers}</span>
                      </div>
                    )}
                    {log.next_steps && (
                      <p className="text-sm text-muted-foreground mt-2">Next: {log.next_steps}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          {weeklyError ? (
            <ErrorState message={weeklyError.message} onRetry={() => refetchWeekly()} />
          ) : weeklyLogs.length === 0 ? (
            <EmptyState 
              icon={ScrollText}
              title="No weekly logs yet"
              description="Weekly summaries will be generated from your daily logs."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {weeklyLogs.map((log) => (
                <Card key={log.Id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">
                        Week of {format(new Date(log.week_start), 'MMM d')} - {format(new Date(log.week_end), 'MMM d, yyyy')}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">{log.summary}</p>
                    {log.completed_tasks && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="mb-1">Completed</Badge>
                        <p className="text-sm text-muted-foreground">{log.completed_tasks}</p>
                      </div>
                    )}
                    {log.pending_tasks && (
                      <div className="mt-2">
                        <Badge variant="outline" className="mb-1">Pending</Badge>
                        <p className="text-sm text-muted-foreground">{log.pending_tasks}</p>
                      </div>
                    )}
                    {log.blockers && (
                      <div className="flex items-start gap-2 p-2 rounded bg-destructive/10 text-sm mt-2">
                        <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                        <span className="text-destructive">{log.blockers}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}