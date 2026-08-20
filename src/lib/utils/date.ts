import { APP_CONFIG } from "@/config/app.config";

export function formatDateTime(isoString: string | undefined | null, timezone?: string, locale: string = "vi"): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(date);
}

export function formatDateOnly(dateStr: string | undefined | null, locale: string = "vi"): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export interface SessionStatus {
  key: keyof typeof APP_CONFIG.sessions;
  name: string;
  isOpen: boolean;
  color: string;
  hoursUntilClose?: number;
  hoursUntilOpen?: number;
}

export function getForexSessionsStatus(): SessionStatus[] {
  const now = new Date();
  const currentUTCHour = now.getUTCHours() + now.getUTCMinutes() / 60;

  const result: SessionStatus[] = [];

  for (const [key, session] of Object.entries(APP_CONFIG.sessions)) {
    let isOpen = false;
    let hoursUntilClose: number | undefined;
    let hoursUntilOpen: number | undefined;

    if (session.openUTC > session.closeUTC) {
      // Crosses midnight (e.g. Sydney 21:00 -> 06:00 UTC)
      isOpen = currentUTCHour >= session.openUTC || currentUTCHour < session.closeUTC;
      if (isOpen) {
        hoursUntilClose = currentUTCHour >= session.openUTC
          ? (24 - currentUTCHour) + session.closeUTC
          : session.closeUTC - currentUTCHour;
      } else {
        hoursUntilOpen = session.openUTC - currentUTCHour;
      }
    } else {
      // Normal range (e.g. London 07:00 -> 16:00 UTC)
      isOpen = currentUTCHour >= session.openUTC && currentUTCHour < session.closeUTC;
      if (isOpen) {
        hoursUntilClose = session.closeUTC - currentUTCHour;
      } else {
        hoursUntilOpen = currentUTCHour < session.openUTC
          ? session.openUTC - currentUTCHour
          : (24 - currentUTCHour) + session.openUTC;
      }
    }

    result.push({
      key: key as keyof typeof APP_CONFIG.sessions,
      name: session.name,
      isOpen,
      color: session.color,
      hoursUntilClose: hoursUntilClose ? Number(hoursUntilClose.toFixed(1)) : undefined,
      hoursUntilOpen: hoursUntilOpen ? Number(hoursUntilOpen.toFixed(1)) : undefined,
    });
  }

  return result;
}

export function getActiveSessionNames(): string {
  const active = getForexSessionsStatus().filter((s) => s.isOpen);
  if (active.length === 0) return "Markets Closed / Weekend";
  return active.map((s) => s.name).join(" + ");
}
