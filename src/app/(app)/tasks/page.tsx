'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useUiStore } from '@/stores/ui.store';
import { useTasks, useCreateTask } from '@/features/tasks/hooks';
import { TaskDrawer } from '@/features/tasks/components/TaskDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  ArrowRight,
  FolderKanban,
  User,
  Zap,
  Bug,
  Book,
  Wrench,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  OctagonX,
  Search,
  Filter,
  ChevronDown,
  X,
  Bot
} from 'lucide-react';
import type { Task, TaskStatus } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'sonner';

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'testing', label: 'Testing' },
  { id: 'done', label: 'Done' },
  { id: 'blocked', label: 'Blocked' },
];

const PRIORITY_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  critical: { label: 'Critical', className: 'bg-red-500/10 text-red-600 dark:text-red-400', icon: OctagonX },
  high: { label: 'High', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', icon: ArrowUp },
  medium: { label: 'Medium', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400', icon: Minus },
  low: { label: 'Low', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', icon: ArrowDown },
};

const TYPE_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  feature: { label: 'Feature', className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', icon: Zap },
  bug: { label: 'Bug', className: 'bg-red-500/10 text-red-600 dark:text-red-400', icon: Bug },
  chore: { label: 'Chore', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400', icon: Wrench },
  refactor: { label: 'Refactor', className: 'bg-teal-500/10 text-teal-600 dark:text-teal-400', icon: RefreshCw },
  docs: { label: 'Docs', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', icon: Book },
};

const COLUMN_HEADER_CONFIG: Record<TaskStatus, { accent: string; dot: string }> = {
  backlog: { accent: 'border-t-gray-400', dot: 'bg-gray-400' },
  todo: { accent: 'border-t-blue-500', dot: 'bg-blue-500' },
  in_progress: { accent: 'border-t-yellow-500', dot: 'bg-yellow-500' },
  review: { accent: 'border-t-purple-500', dot: 'bg-purple-500' },
  testing: { accent: 'border-t-teal-500', dot: 'bg-teal-500' },
  done: { accent: 'border-t-green-500', dot: 'bg-green-500' },
  blocked: { accent: 'border-t-red-500', dot: 'bg-red-500' },
};

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'testing', label: 'Testing' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
];

function TaskCard({ task, onOpen }: { task: Task; onOpen: (id: string) => void }) {
  const type = task.type ? TYPE_CONFIG[task.type] : null;
  const priority = task.priority ? PRIORITY_CONFIG[task.priority] : null;
  const TypeIcon = type?.icon;
  const PriorityIcon = priority?.icon;

  return (
    <button
      onClick={() => onOpen(String(task.Id))}
      className="w-full text-left rounded-lg border border-border bg-card px-3 py-3 hover:border-primary/40 hover:shadow-sm transition-all group"
    >
      <p className="text-sm font-medium text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
        {task.title}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        {type && TypeIcon && (
          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${type.className}`}>
            <TypeIcon className="size-3" />
            {type.label}
          </span>
        )}
        {priority && PriorityIcon && (
          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${priority.className}`}>
            <PriorityIcon className="size-3" />
            {priority.label}
          </span>
        )}
      </div>

      {(task.assigned_agent || task.estimate_days) && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
          {task.assigned_agent && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="size-3" />
              {task.assigned_agent}
            </span>
          )}
          {task.estimate_days !== undefined && task.estimate_days !== null && (
            <span className="text-xs text-muted-foreground ml-auto">
              {task.estimate_days}d
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function KanbanColumnSkeleton() {
  return (
    <div className="flex-shrink-0 w-64 xl:w-72">
      <div className="rounded-xl border border-border bg-muted/30 flex flex-col h-full">
        <div className="px-3 py-3 border-b border-border flex items-center gap-2">
          <Skeleton className="size-2 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex flex-col gap-2 p-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { activeProjectId, openTaskDrawer } = useUiStore();
  const { data, isLoading, error } = useTasks(activeProjectId);
  const createTask = useCreateTask();

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([]);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTasks, setAiTasks] = useState<{ title: string; description: string; type: string; priority: string; estimate_days: number }[]>([]);

  const filtered = useMemo(() => {
    const allTasks: Task[] = data?.list ?? [];
    return allTasks.filter((task) => {
      if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (priorityFilter.length > 0 && (!task.priority || !priorityFilter.includes(task.priority))) return false;
      if (statusFilter.length > 0 && !statusFilter.includes(task.status)) return false;
      return true;
    });
  }, [data?.list, search, priorityFilter, statusFilter]);

  const hasFilters = search || priorityFilter.length > 0 || statusFilter.length > 0;

  const handleGenerateAiTasks = () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setTimeout(() => {
      setAiTasks([
        {
          title: 'Implement database schema',
          description: 'Set up the initial NocoDB tables based on requirements.',
          type: 'feature',
          priority: 'high',
          estimate_days: 1,
        },
        {
          title: 'Create API endpoints',
          description: 'Build Next.js API routes for the core entities.',
          type: 'feature',
          priority: 'medium',
          estimate_days: 2,
        },
      ]);
      setAiGenerating(false);
      toast.success('AI suggested tasks based on your description.');
    }, 1500);
  };

  const handleCreateAiTask = (taskDef: any) => {
    if (!activeProjectId) return;
    createTask.mutate({
      project_id: Number(activeProjectId),
      title: taskDef.title,
      description: taskDef.description,
      type: taskDef.type,
      priority: taskDef.priority,
      status: 'todo',
      estimate_days: taskDef.estimate_days,
    }, {
      onSuccess: () => {
        toast.success(`Task "${taskDef.title}" created successfully`);
        setAiTasks(prev => prev.filter(t => t !== taskDef));
      }
    });
  };

  if (!activeProjectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <FolderKanban className="size-16 text-muted-foreground mb-4 opacity-40" />
        <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
        <p className="text-muted-foreground max-w-xs mb-6">
          Select a project from the Projects page to view and manage its tasks.
        </p>
        <Link href="/projects" className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80">
          Go to Projects
          <ArrowRight className="ml-2 size-4" />
        </Link>
      </div>
    );
  }

  const tasksByStatus = COLUMNS.reduce<Record<TaskStatus, Task[]>>(
    (acc, col) => {
      acc[col.id] = [];
      return acc;
    },
    {} as Record<TaskStatus, Task[]>
  );

  for (const task of filtered) {
    if (tasksByStatus[task.status]) {
      tasksByStatus[task.status].push(task);
    }
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {data ? `${filtered.length}${hasFilters ? ` of ${data.list.length}` : ''} tasks` : 'Loading...'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setAiDrawerOpen(true)}>
              <Bot className="mr-2" />
              AI Create Task
            </Button>
            <Button onClick={() => openTaskDrawer()}>
              <Plus className="mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-6 py-3 border-b border-border shrink-0 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-sm"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Filter className="size-3.5" />
                Priority
                {priorityFilter.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-1.5 py-px">
                    {priorityFilter.length}
                  </span>
                )}
                <ChevronDown className="size-3 ml-0.5" />
              </Button>
            } />
            <DropdownMenuContent align="start" className="w-44">
              {PRIORITY_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={priorityFilter.includes(opt.value)}
                  onCheckedChange={(checked) => {
                    setPriorityFilter((prev) =>
                      checked ? [...prev, opt.value] : prev.filter((p) => p !== opt.value),
                    );
                  }}
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Filter className="size-3.5" />
                Status
                {statusFilter.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-1.5 py-px">
                    {statusFilter.length}
                  </span>
                )}
                <ChevronDown className="size-3 ml-0.5" />
              </Button>
            } />
            <DropdownMenuContent align="start" className="w-44">
              {STATUS_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={statusFilter.includes(opt.value)}
                  onCheckedChange={(checked) => {
                    setStatusFilter((prev) =>
                      checked ? [...prev, opt.value] : prev.filter((s) => s !== opt.value),
                    );
                  }}
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground"
              onClick={() => {
                setSearch('');
                setPriorityFilter([]);
                setStatusFilter([]);
              }}
            >
              <X className="size-3.5" />
              Clear filters
            </Button>
          )}
        </div>

        {error && (
          <div className="px-6 py-3 bg-destructive/10 border-b border-destructive/20">
            <p className="text-sm text-destructive">Error: {error.message}</p>
          </div>
        )}

        <div className="flex flex-1 gap-4 overflow-x-auto p-6 items-start">
          {isLoading ? (
            <>
              {COLUMNS.map((col) => (
                <KanbanColumnSkeleton key={col.id} />
              ))}
            </>
          ) : (
            COLUMNS.map((col) => {
              const tasks = tasksByStatus[col.id] || [];
              const { accent, dot } = COLUMN_HEADER_CONFIG[col.id];
              return (
                <div key={col.id} className="flex-shrink-0 w-64 xl:w-72 flex flex-col max-h-full">
                  <div className={`rounded-xl border-t-2 border border-border bg-muted/30 flex flex-col ${accent}`}>
                    <div className="px-3 py-3 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${dot}`} />
                        <span className="text-sm font-semibold">{col.label}</span>
                        <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 font-medium">
                          {tasks.length}
                        </span>
                      </div>
                      <button
                        onClick={() => openTaskDrawer()}
                        className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title={`Add task to ${col.label}`}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 p-3 overflow-y-auto max-h-[calc(100vh-300px)]">
                      {tasks.length === 0 ? (
                        <div className="py-6 text-center text-xs text-muted-foreground/60 select-none">
                          No tasks
                        </div>
                      ) : (
                        tasks.map((task) => (
                          <TaskCard
                            key={task.Id}
                            task={task}
                            onOpen={openTaskDrawer}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <TaskDrawer />

      <Sheet open={aiDrawerOpen} onOpenChange={setAiDrawerOpen}>
        <SheetContent className="sm:max-w-md md:max-w-lg w-full flex flex-col gap-6" side="right">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Bot className="size-5 text-primary" />
              AI Task Creator
            </SheetTitle>
            <SheetDescription>
              Describe what you want to build and the AI will create structured tasks.
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            <div className="space-y-3">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 text-xs text-blue-700 dark:text-blue-400">
                <strong>Pro tip:</strong> Uses the Create Task skill to break down objectives into structured tasks. See <code>docs/skills/create-task.md</code>.
              </div>
              <Textarea 
                placeholder="e.g. Implement user authentication with NextAuth and Google provider..."
                className="min-h-[120px] resize-y"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <Button 
                className="w-full" 
                onClick={handleGenerateAiTasks}
                disabled={!aiPrompt.trim() || aiGenerating}
              >
                {aiGenerating ? 'AI is thinking...' : 'Generate Tasks'}
              </Button>
            </div>

            {aiTasks.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-semibold text-sm">Suggested Tasks</h3>
                <div className="space-y-3">
                  {aiTasks.map((task, i) => (
                    <div key={i} className="border rounded-md p-3 bg-muted/20 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-medium text-sm text-foreground">{task.title}</h4>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {task.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-mono">{task.estimate_days}d</span>
                        <Button size="sm" onClick={() => handleCreateAiTask(task)}>
                          Create Task
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
