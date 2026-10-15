import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { verifyToken } from "../utils/jwt";
import { Workspace } from "../models/Workspace";

interface Client {
  ws: WebSocket;
  userId: string;
  workspaceId: string;
  role: string;
}

const clients = new Map<string, Client>();
const rooms = new Map<string, Set<string>>();

const getKey = (workspaceId: string, userId: string) => workspaceId + ":" + userId;

const broadcastToOthers = (workspaceId: string, exceptKey: string, data: any) => {
  const room = rooms.get(workspaceId);
  if (!room) return;
  room.forEach((key) => {
    if (key === exceptKey) return;
    const client = clients.get(key);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  });
};

const broadcastPresence = (workspaceId: string) => {
  const room = rooms.get(workspaceId);
  if (!room) return;
  const online = Array.from(room).map((key) => key.split(":")[1]);
  room.forEach((key) => {
    const client = clients.get(key);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({ type: "presence:update", payload: { online: Array.from(new Set(online)) } }));
    }
  });
};

export const setupWebSocket = (server: Server) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws: WebSocket, req) => {
    let key = "";
    let roomKey = "";
    try {
      const url = new URL(req.url || "", "http://localhost");
      const token = url.searchParams.get("token");
      const workspaceId = url.searchParams.get("workspaceId");
      if (!token || !workspaceId) throw new Error("Missing token/workspaceId");

      const decoded = verifyToken(token);
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) throw new Error("Workspace not found");

      const member = workspace.members.find((m: any) => m.user.toString() === decoded.userId);
      const role = member ? member.role : workspace.owner.toString() === decoded.userId ? "owner" : null;
      if (!role) throw new Error("Not a member");

      key = getKey(workspaceId, decoded.userId);
      roomKey = workspaceId;
      clients.set(key, { ws, userId: decoded.userId, workspaceId, role });

      if (!rooms.has(workspaceId)) rooms.set(workspaceId, new Set());
      rooms.get(workspaceId)?.add(key);

      ws.send(JSON.stringify({ type: "connected", message: "Connected to workspace" }));
      broadcastPresence(workspaceId);

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          const client = clients.get(key);
          if (!client) return;

          if (message.type === "file:update") {
            if (client.role === "viewer") return;
            broadcastToOthers(workspaceId, key, {
              type: "file:update",
              payload: { ...message.payload, userId: client.userId },
            });
          } else if (message.type === "cursor:update") {
            broadcastToOthers(workspaceId, key, {
              type: "cursor:update",
              payload: { ...message.payload, userId: client.userId },
            });
          } else if (message.type === "file:created" || message.type === "file:renamed" || message.type === "file:deleted") {
            if (client.role === "viewer") return;
            broadcastToOthers(workspaceId, key, {
              type: message.type,
              payload: { ...message.payload, userId: client.userId },
            });
          }
        } catch {
          ws.send(JSON.stringify({ type: "error", message: "Invalid message" }));
        }
      });

      ws.on("close", () => {
        rooms.get(workspaceId)?.delete(key);
        clients.delete(key);
        broadcastPresence(workspaceId);
      });
    } catch (e: any) {
      ws.close(1008, e.message || "Auth failed");
    }
  });

  return wss;
};
