import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// Observability Utilities for Booking System
// ============================================

/**
 * Extract or generate a correlation ID from the request
 */
export function getCorrelationId(req: Request, fallback?: string): string {
  return (
    req.headers.get("x-correlation-id") ||
    req.headers.get("x-request-id") ||
    req.headers.get("x-idempotency-key") ||
    fallback ||
    crypto.randomUUID()
  )
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

/**
 * Validate required environment variables
 * Returns missing var names or null if all present
 */
export function validateEnvVars(
  vars: string[]
): { missing: string[] } | null {
  const missing = vars.filter((v) => !process.env[v])
  return missing.length > 0 ? { missing } : null
}
