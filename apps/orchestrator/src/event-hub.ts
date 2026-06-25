import type { WebSocket } from "ws";
import type { NormalizedEvent } from "@vk/contracts";
import { addEvent } from "./db.js";

class EventHub {
  private subscribers = new Map<string, Set<WebSocket>>();

  subscribe(sessionUid: string, socket: WebSocket) {
    const set = this.subscribers.get(sessionUid) || new Set<WebSocket>();
    set.add(socket);
    this.subscribers.set(sessionUid, set);
    socket.on("close", () => set.delete(socket));
  }

  publish(event: NormalizedEvent) {
    addEvent(event);
    const message = JSON.stringify(event);
    for (const socket of this.subscribers.get(event.sessionUid) || []) {
      if (socket.readyState === socket.OPEN) socket.send(message);
    }
  }
}

export const eventHub = new EventHub();
