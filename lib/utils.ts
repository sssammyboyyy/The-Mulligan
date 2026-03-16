import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the current date in South Africa Standard Time (SAST)
 * Format: YYYY-MM-DD
 */
export function getSASTDate(): string {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date()).split('/').reverse().join('-');
  // South African numeric date format is typically YYYY/MM/DD or DD/MM/YYYY depending on system, 
  // but Intl.DateTimeFormat 'en-ZA' often returns YYYY/MM/DD.
  // We force ISO-like YYYY-MM-DD for database compatibility.
}

/**
 * Normalizes any date/time input to a strict SAST (UTC+02:00) ISO string.
 * Prevents Cloudflare Edge UTC-zero drift.
 */
export function createSASTTimestamp(date: string, time: string): string {
  const cleanTime = time.length === 5 ? `${time}:00` : time;
  return `${date}T${cleanTime}+02:00`;
}

/**
 * Adds hours to a SAST timestamp and returns a new SAST-formatted string (+02:00).
 */
export function addHoursToSAST(sastStr: string, hours: number): string {
  const d = new Date(sastStr);
  const endD = new Date(d.getTime() + (hours * 60 * 60 * 1000));
  // Standardize the output format for database consistency
  return new Date(endD.getTime() + (2 * 60 * 60 * 1000)).toISOString().slice(0, 19) + "+02:00";
}

/**
 * Structured logging utility
 */
export function logEvent(
  event: string,
  data: Record<string, unknown>,
  level: "info" | "warn" | "error" = "info"
): void {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    event,
    ...data,
  }

  if (level === "error") {
    console.error(JSON.stringify(logEntry))
  } else if (level === "warn") {
    console.warn(JSON.stringify(logEntry))
  } else {
    console.log(JSON.stringify(logEntry))
  }
}
