import os from "node:os";
import type { IPty } from "node-pty";
import * as pty from "node-pty";
import type { WebSocket } from "ws";
import { getSession } from "./db.js";

type TerminalRuntime = { pty: IPty; sockets: Set<WebSocket>; history: string };

class TerminalManager {
  private terminals = new Map<string, TerminalRuntime>();

  attach(sessionUid: string, socket: WebSocket) {
    const session = getSession(sessionUid);
    if (!session) throw new Error("Session not found");
    let runtime = this.terminals.get(sessionUid);
    if (!runtime) {
      const shell = os.platform() === "win32" ? "powershell.exe" : process.env.SHELL || "/bin/bash";
      const args = os.platform() === "win32" ? ["-NoLogo"] : ["-l"];
      const terminal = pty.spawn(shell, args, {
        name: "xterm-256color",
        cols: 120,
        rows: 32,
        cwd: session.worktreePath,
        env: process.env as Record<string, string>,
      });
      runtime = { pty: terminal, sockets: new Set(), history: "" };
      terminal.onData((data) => {
        runtime!.history = (runtime!.history + data).slice(-100_000);
        for (const peer of runtime!.sockets) if (peer.readyState === peer.OPEN) peer.send(JSON.stringify({ type: "data", data }));
      });
      terminal.onExit(({ exitCode }) => {
        for (const peer of runtime!.sockets) if (peer.readyState === peer.OPEN) peer.send(JSON.stringify({ type: "exit", exitCode }));
        this.terminals.delete(sessionUid);
      });
      this.terminals.set(sessionUid, runtime);
    }
    runtime.sockets.add(socket);
    if (runtime.history) socket.send(JSON.stringify({ type: "data", data: runtime.history }));
    socket.on("message", (raw) => {
      try {
        const message = JSON.parse(raw.toString()) as { type: string; data?: string; cols?: number; rows?: number };
        if (message.type === "input" && typeof message.data === "string") runtime!.pty.write(message.data);
        if (message.type === "resize" && message.cols && message.rows) runtime!.pty.resize(message.cols, message.rows);
      } catch {
        // Ignore malformed terminal messages; the socket remains usable.
      }
    });
    socket.on("close", () => runtime!.sockets.delete(socket));
  }

  stop(sessionUid: string) {
    this.terminals.get(sessionUid)?.pty.kill();
    this.terminals.delete(sessionUid);
  }
}

export const terminals = new TerminalManager();
