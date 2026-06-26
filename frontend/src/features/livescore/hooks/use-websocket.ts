"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { env } from "@/lib/env";

const MAX_RETRIES = 10;

interface StompFrame {
  command: string;
  headers: Record<string, string>;
  body: string;
}

function parseStompFrame(data: string): StompFrame | null {
  const lines = data.split("\n");
  const command = lines[0]?.trim();
  if (!command) return null;

  const headers: Record<string, string> = {};
  let i = 1;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line === "" || line === "\r") break;
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      headers[line.substring(0, colonIdx).trim()] = line.substring(colonIdx + 1).trim();
    }
  }

  const body = lines.slice(i + 1).join("\n").replace(/\0$/, "");
  return { command, headers, body };
}

function buildStompFrame(command: string, headers: Record<string, string>, body = ""): string {
  let frame = command + "\n";
  for (const [key, val] of Object.entries(headers)) {
    frame += `${key}:${val}\n`;
  }
  frame += "\n" + body + "\0";
  return frame;
}

export function useStompWebSocket(eventId: string | undefined) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map());
  const subIdRef = useRef(0);
  const retryCountRef = useRef(0);

  const subscribe = useCallback((destination: string, callback: (data: unknown) => void) => {
    if (!listenersRef.current.has(destination)) {
      listenersRef.current.set(destination, new Set());
    }
    listenersRef.current.get(destination)!.add(callback);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const id = `sub-${subIdRef.current++}`;
      wsRef.current.send(buildStompFrame("SUBSCRIBE", { id, destination }));
    }

    return () => {
      listenersRef.current.get(destination)?.delete(callback);
    };
  }, []);

  useEffect(() => {
    if (!eventId) return;

    const baseUrl = env.NEXT_PUBLIC_API_URL.replace("/api", "");
    const wsUrl = baseUrl.replace(/^http/, "ws") + "/ws/websocket";

    let ws: WebSocket;
    let heartbeatInterval: ReturnType<typeof setInterval>;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let aborted = false;

    function connect() {
      if (aborted || retryCountRef.current >= MAX_RETRIES) return;

      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        const token = localStorage.getItem("access_token");
        ws.send(buildStompFrame("CONNECT", {
          "accept-version": "1.2",
          "heart-beat": "10000,10000",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }));
      };

      ws.onmessage = (event) => {
        const frame = parseStompFrame(event.data as string);
        if (!frame) return;

        if (frame.command === "CONNECTED") {
          retryCountRef.current = 0;
          setConnected(true);
          subIdRef.current = 0;
          const topics = [
            `/topic/events/${eventId}/leaderboard`,
            `/topic/events/${eventId}/ranking-events`,
            `/topic/events/${eventId}/final-results`,
          ];
          topics.forEach((dest) => {
            const id = `sub-${subIdRef.current++}`;
            ws.send(buildStompFrame("SUBSCRIBE", { id, destination: dest }));
          });

          heartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send("\n");
          }, 10000);
        }

        if (frame.command === "MESSAGE") {
          const destination = frame.headers["destination"] || "";
          try {
            const data = JSON.parse(frame.body);
            listenersRef.current.get(destination)?.forEach((cb) => cb(data));
          } catch {
            // ignore parse errors
          }
        }
      };

      ws.onclose = () => {
        setConnected(false);
        clearInterval(heartbeatInterval);
        if (!aborted && retryCountRef.current < MAX_RETRIES) {
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
          retryCountRef.current++;
          reconnectTimeout = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      aborted = true;
      clearTimeout(reconnectTimeout);
      clearInterval(heartbeatInterval);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnected(false);
    };
  }, [eventId]);

  return { connected, subscribe };
}
