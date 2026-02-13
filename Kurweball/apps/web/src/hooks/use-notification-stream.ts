"use client";

import { useEffect, useRef, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

interface UseNotificationStreamOptions {
  onNotification: (notification: Record<string, unknown>) => void;
  enabled?: boolean;
}

export function useNotificationStream({
  onNotification,
  enabled = true,
}: UseNotificationStreamOptions) {
  const abortRef = useRef<AbortController | null>(null);
  const retryDelayRef = useRef(1000);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const connect = useCallback(async () => {
    if (!enabledRef.current) return;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${API_URL}/notifications/stream`, {
        headers: {
          Accept: "text/event-stream",
        },
        credentials: "include",
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn("[NotificationStream] Unauthorized — stopping SSE");
          return;
        }
        throw new Error(`SSE failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      retryDelayRef.current = 1000;
      console.log("[NotificationStream] Connected");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let eventType = "";
        let eventData = "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            eventData = line.slice(5).trim();
          } else if (line === "" && eventData) {
            if (eventType === "notification" && eventData) {
              try {
                const parsed = JSON.parse(eventData);
                onNotification(parsed);
              } catch {
                // ignore parse errors
              }
            }
            eventType = "";
            eventData = "";
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("[NotificationStream] Error:", err);
    }

    // Reconnect with exponential backoff
    if (enabledRef.current) {
      const delay = retryDelayRef.current;
      retryDelayRef.current = Math.min(delay * 2, 30000);
      console.log(`[NotificationStream] Reconnecting in ${delay}ms`);
      setTimeout(connect, delay);
    }
  }, [onNotification]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [enabled, connect]);
}
