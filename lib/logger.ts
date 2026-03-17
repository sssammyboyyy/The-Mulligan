
/**
 * Lightweight logging and observability utilities for the Edge runtime.
 * Avoids importing Tailwind or other bulky UI libraries.
 */

export function logEvent(
  event: string,
  data: Record<string, unknown>,
  level: "info" | "warn" | "error" = "info"
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...data,
  };

  if (level === "error") {
    console.error(JSON.stringify(logEntry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

export function getCorrelationId(req: Request, fallback?: string): string {
  return (
    req.headers.get("x-correlation-id") ||
    req.headers.get("x-request-id") ||
    req.headers.get("x-idempotency-key") ||
    fallback ||
    crypto.randomUUID()
  );
}

export function validateEnvVars(vars: string[]): { missing: string[] } | null {
  const missing = vars.filter((v) => !process.env[v]);
  return missing.length > 0 ? { missing } : null;
}
