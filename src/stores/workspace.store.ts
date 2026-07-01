import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OpenFile {
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
}

export interface AgentStep {
  type: 'thought' | 'tool_call' | 'tool_result' | 'content';
  text?: string;
  toolId?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolOutput?: string;
  isError?: boolean;
}

export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  steps?: AgentStep[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: AiMessage[];
  createdAt: string;
}

type SidePanel = 'explorer' | 'search' | 'git' | 'tasks' | 'ai';
type BottomTab = 'problems' | 'output' | 'terminal' | 'git-diff' | 'agent-logs';

interface WorkspaceState {
  openFiles: OpenFile[];
  activeFilePath: string | null;
  activePanel: SidePanel;
  bottomTab: BottomTab;
  aiMessages: AiMessage[];
  collapseAllTrigger: number;
  chatSessions: ChatSession[];
  activeChatSessionId: string | null;
  isAgentRunning: boolean;
  agentStatusText: string;

  openFile: (path: string, name: string, content: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  markFileSaved: (path: string) => void;
  setActivePanel: (panel: SidePanel) => void;
  setBottomTab: (tab: BottomTab) => void;
  addAiMessage: (msg: AiMessage) => void;
  updateLastAiMessage: (content: string) => void;
  updateLastAiMessageSteps: (steps: AgentStep[], content: string) => void;
  clearAiMessages: () => void;
  triggerCollapseAll: () => void;
  saveChatSession: () => void;
  loadChatSession: (id: string) => void;
  newChatSession: () => void;
  setAgentRunning: (running: boolean, status?: string) => void;
  setAgentStatusText: (text: string) => void;
}

const INITIAL_MESSAGES: AiMessage[] = [
  { role: 'assistant', content: 'Hello! I\'m ready to help you with the current project. What would you like to build?' },
];

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      openFiles: [],
      activeFilePath: null,
      activePanel: 'explorer',
      bottomTab: 'terminal',
      collapseAllTrigger: 0,
      aiMessages: [...INITIAL_MESSAGES],
      chatSessions: [],
      activeChatSessionId: null,
      isAgentRunning: false,
      agentStatusText: 'Analyzing your request...',

      openFile: (path, name, content) => {
        const existing = get().openFiles.find((f) => f.path === path);
        if (existing) {
          set({ activeFilePath: path });
          return;
        }
        set((state) => ({
          openFiles: [...state.openFiles, { path, name, content, isDirty: false }],
          activeFilePath: path,
        }));
      },

      closeFile: (path) => {
        set((state) => {
          const filtered = state.openFiles.filter((f) => f.path !== path);
          let newActive = state.activeFilePath;
          if (state.activeFilePath === path) {
            newActive = filtered.length > 0 ? filtered[filtered.length - 1].path : null;
          }
          return { openFiles: filtered, activeFilePath: newActive };
        });
      },

      setActiveFile: (path) => set({ activeFilePath: path }),

      updateFileContent: (path, content) => {
        set((state) => ({
          openFiles: state.openFiles.map((f) =>
            f.path === path ? { ...f, content, isDirty: true } : f
          ),
        }));
      },

      markFileSaved: (path) => {
        set((state) => ({
          openFiles: state.openFiles.map((f) =>
            f.path === path ? { ...f, isDirty: false } : f
          ),
        }));
      },

      setActivePanel: (panel) => set({ activePanel: panel }),
      setBottomTab: (tab) => set({ bottomTab: tab }),

      addAiMessage: (msg) => {
        set((state) => ({
          aiMessages: [...state.aiMessages, msg],
        }));
      },
      updateLastAiMessage: (content) => {
        set((state) => {
          const msgs = [...state.aiMessages];
          if (msgs.length > 0) {
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
          }
          return { aiMessages: msgs };
        });
      },
      updateLastAiMessageSteps: (steps, content) => {
        set((state) => {
          const msgs = [...state.aiMessages];
          if (msgs.length > 0) {
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], steps, content };
          }
          return { aiMessages: msgs };
        });
      },
      clearAiMessages: () => {
        set({
          aiMessages: [...INITIAL_MESSAGES],
          activeChatSessionId: null,
        });
      },
      triggerCollapseAll: () => set((state) => ({ collapseAllTrigger: state.collapseAllTrigger + 1 })),

      saveChatSession: () => {
        const { aiMessages, activeChatSessionId, chatSessions } = get();
        const nonInitial = aiMessages.filter((m) => m.role !== 'assistant' || m.content !== INITIAL_MESSAGES[0].content);
        if (nonInitial.length === 0) return;

        const firstUser = aiMessages.find((m) => m.role === 'user');
        const title = firstUser ? firstUser.content.slice(0, 60) : `Session ${new Date().toLocaleTimeString()}`;

        if (activeChatSessionId) {
          set({
            chatSessions: chatSessions.map((s) =>
              s.id === activeChatSessionId
                ? { ...s, messages: [...aiMessages], title }
                : s
            ),
          });
        } else {
          const newSession: ChatSession = {
            id: crypto.randomUUID(),
            title,
            messages: [...aiMessages],
            createdAt: new Date().toISOString(),
          };
          set((state) => ({
            chatSessions: [newSession, ...state.chatSessions],
            activeChatSessionId: newSession.id,
          }));
        }
      },

      loadChatSession: (id) => {
        const { chatSessions } = get();
        const session = chatSessions.find((s) => s.id === id);
        if (!session) return;
        set({
          aiMessages: [...session.messages],
          activeChatSessionId: id,
        });
      },

      newChatSession: () => {
        get().saveChatSession();
        set({
          aiMessages: [...INITIAL_MESSAGES],
          activeChatSessionId: null,
        });
      },

      setAgentRunning: (running, status) => {
        set({
          isAgentRunning: running,
          ...(status ? { agentStatusText: status } : {}),
        });
      },

      setAgentStatusText: (text) => set({ agentStatusText: text }),
    }),
    {
      name: 'vibeforge-workspace',
      partialize: (state) => ({
        chatSessions: state.chatSessions,
        activeChatSessionId: state.activeChatSessionId,
        aiMessages: state.aiMessages,
        isAgentRunning: state.isAgentRunning,
        agentStatusText: state.agentStatusText,
      }),
    }
  )
);
