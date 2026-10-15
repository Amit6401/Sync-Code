import { useEffect, useRef, useCallback } from 'react';
import type { WsServerEvent } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';

export function useWorkspaceSocket(
  workspaceId: string | undefined,
  token: string | null,
  onEvent: (event: WsServerEvent) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const send = useCallback((data: any) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    if (!workspaceId || !token) return;

    let closed = false;
    const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}&workspaceId=${workspaceId}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        onEventRef.current(msg);
      } catch {
        // ignore malformed
      }
    };

    ws.onclose = () => {
      if (!closed && token && workspaceId) {
        // simple reconnect after 2s
        setTimeout(() => {
          if (closed) return;
        }, 2000);
      }
    };

    return () => {
      closed = true;
      ws.close();
      wsRef.current = null;
    };
  }, [workspaceId, token]);

  return { send };
}
