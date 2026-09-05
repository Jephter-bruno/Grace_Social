import type { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import { WebSocket, WebSocketServer } from "ws";

const JWT_SECRET =
  process.env.JWT_SECRET || "gracesocial-secret-key-change-in-production";

type RealtimeEvent = {
  type: string;
  payload: unknown;
};

const clients = new Set<WebSocket>();

export function attachRealtimeServer(server: HttpServer): void {
  const wss = new WebSocketServer({ server, path: "/api/ws" });

  wss.on("connection", (socket, request) => {
    const url = new URL(request.url || "", "http://localhost");
    const token = url.searchParams.get("token");
    if (!token) {
      socket.close(1008, "Authentication required");
      return;
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      socket.close(1008, "Invalid authentication token");
      return;
    }

    clients.add(socket);
    socket.on("close", () => clients.delete(socket));
    socket.on("error", () => clients.delete(socket));
  });
}

export function broadcastRealtimeEvent(type: string, payload: unknown): void {
  const message = JSON.stringify({ type, payload } satisfies RealtimeEvent);
  for (const client of clients) {
    if (client.readyState !== WebSocket.OPEN) {
      clients.delete(client);
      continue;
    }
    client.send(message);
  }
}