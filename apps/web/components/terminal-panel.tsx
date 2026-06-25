"use client";

import { useEffect, useRef, useState } from "react";
import type { ApiClient } from "@/lib/api";

export function TerminalPanel({ api, sessionUid, active }: { api: ApiClient; sessionUid: string; active: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Connecting…");

  useEffect(() => {
    if (!active || !hostRef.current) return;
    let disposed = false;
    let socket: WebSocket | null = null;
    let cleanup = () => {};
    void (async () => {
      const [{ Terminal }, { FitAddon }] = await Promise.all([import("@xterm/xterm"), import("@xterm/addon-fit")]);
      if (disposed || !hostRef.current) return;
      const terminal = new Terminal({ cursorBlink: true, convertEol: true, fontFamily: "var(--font-mono), monospace", fontSize: 12, lineHeight: 1.35, theme: { background: "#10110f", foreground: "#e5e7df", cursor: "#f07a3d", selectionBackground: "#694126", black: "#22231f", brightBlack: "#686a61" } });
      const fit = new FitAddon(); terminal.loadAddon(fit); terminal.open(hostRef.current); fit.fit();
      const wsUrl = `/ws/terminal?sessionUid=${encodeURIComponent(sessionUid)}`;
      socket = api.websocket(wsUrl);
      socket.addEventListener("open", () => { setStatus("Connected"); socket?.send(JSON.stringify({ type: "resize", cols: terminal.cols, rows: terminal.rows })); });
      socket.addEventListener("message", (event) => { const message = JSON.parse(event.data) as { type: string; data?: string; exitCode?: number }; if (message.type === "data" && message.data) terminal.write(message.data); if (message.type === "exit") setStatus(`Exited (${message.exitCode})`); });
      socket.addEventListener("close", () => setStatus("Disconnected"));
      terminal.onData((data) => { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "input", data })); });
      const observer = new ResizeObserver(() => { fit.fit(); if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "resize", cols: terminal.cols, rows: terminal.rows })); });
      observer.observe(hostRef.current);
      cleanup = () => { observer.disconnect(); terminal.dispose(); socket?.close(); };
    })();
    return () => { disposed = true; cleanup(); };
  }, [active, api, sessionUid]);

  return <div className="relative h-full min-h-[420px] overflow-hidden rounded-xl border border-border bg-[#10110f]"><div className="absolute right-3 top-2 z-10 rounded bg-black/40 px-2 py-1 font-mono text-[9px] text-white/55">{status}</div><div ref={hostRef} className="terminal-shell h-full" /></div>;
}
