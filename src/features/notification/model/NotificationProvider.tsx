"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { getAccessToken } from "@/shared/lib/token";
import { API_BASE_URL } from "@/shared/config/env";
import type { NotificationItem } from "@/entities/notification";

const NOTIF_DISABLED_KEY = "moni_notif_disabled";
const NIGHT_AD_KEY = "moni_night_ad";

function isNightKST(): boolean {
  const kstHour = new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCHours();
  return kstHour >= 21 || kstHour < 8;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  isDisabled: boolean;
  nightAd: boolean;
  setDisabled: (v: boolean) => void;
  setNightAd: (v: boolean) => void;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isDisabled, setIsDisabledState] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(NOTIF_DISABLED_KEY);
    return stored === null ? true : stored === "true";
  });
  const [nightAd, setNightAdState] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem(NIGHT_AD_KEY) === "true"
  );
  const abortRef = useRef<AbortController | null>(null);
  const lastEventIdRef = useRef("");
  const nightAdRef = useRef(nightAd);

  useEffect(() => {
    if (isDisabled) {
      abortRef.current?.abort();
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const connect = async () => {
      const token = getAccessToken();
      if (!token) return;

      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        };
        if (lastEventIdRef.current) headers["Last-Event-Id"] = lastEventIdRef.current;

        const res = await fetch(`${API_BASE_URL}/api/v1/notifications/subscribe`, {
          headers,
          signal: controller.signal,
        });

        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const raw of events) {
            let eventId = "";
            let data = "";
            for (const line of raw.split("\n")) {
              if (line.startsWith("id: ")) eventId = line.slice(4);
              else if (line.startsWith("data: ")) data = line.slice(6);
            }
            if (eventId) lastEventIdRef.current = eventId;
            if (!data || data.startsWith("EventStream Created")) continue;
            try {
              const item = JSON.parse(data) as NotificationItem;
              const suppressNightAd =
                item.type === "PROMOTION" &&
                !nightAdRef.current &&
                isNightKST();
              if (suppressNightAd) continue;
              setNotifications((prev) => [item, ...prev]);
              if (typeof window !== "undefined" && Notification.permission === "granted") {
                new Notification("모니", { body: item.content });
              }
            } catch { /* skip malformed */ }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setTimeout(() => { if (!controller.signal.aborted) void connect(); }, 5000);
      }
    };

    void connect();
    return () => { controller.abort(); };
  }, [isDisabled]);

  const requestPermission = async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    return (await Notification.requestPermission()) === "granted";
  };

  const setDisabled = (v: boolean) => {
    localStorage.setItem(NOTIF_DISABLED_KEY, String(v));
    setIsDisabledState(v);
  };

  const setNightAd = (v: boolean) => {
    localStorage.setItem(NIGHT_AD_KEY, String(v));
    nightAdRef.current = v;
    setNightAdState(v);
  };

  return (
    <NotificationContext.Provider value={{ notifications, isDisabled, nightAd, setDisabled, setNightAd, requestPermission }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
}
