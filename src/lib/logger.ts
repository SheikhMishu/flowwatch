/**
 * FlowMonix application logger.
 *
 * - stdout: structured JSON via pino (captured by Railway log viewer)
 * - DB: warn/error/fatal persisted to app_logs (fire-and-forget, never blocks)
 * - debug/info: stdout only — not persisted to DB (too noisy)
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.error("Sync failed", { category: "sync", orgId, instanceId, err });
 */

import pino from "pino";
import { getServerDb } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LogCategory =
  | "auth"
  | "sync"
  | "ai"
  | "alert-engine"
  | "incident"
  | "instance"
  | "cron"
  | "api"
  | "email"
  | "invite"
  | "billing"
  | "general";

export interface LogContext {
  category: LogCategory;
  orgId?: string;
  userId?: string;
  /** Pass the caught error here — it will be serialized */
  err?: unknown;
  [key: string]: unknown;
}

type DbLevel = "warn" | "error" | "fatal";

// ─── Pino instance ────────────────────────────────────────────────────────────

const pinoInstance = pino({
  level: process.env.LOG_LEVEL ?? "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
  },
});

// ─── DB persistence ───────────────────────────────────────────────────────────

function serializeError(err: unknown): Record<string, unknown> | undefined {
  if (!err) return undefined;
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { raw: String(err) };
}

function persistToDb(level: DbLevel, message: string, ctx: LogContext): void {
  // Intentionally fire-and-forget — never awaited, never throws
  try {
    const { err, orgId, userId, category, ...rest } = ctx;
    const db = getServerDb();
    const insert = db.from("app_logs")
      .insert({
        level,
        category,
        message,
        context: {
          ...rest,
          ...(err ? { err: serializeError(err) } : {}),
        },
        org_id: orgId ?? null,
        user_id: userId ?? null,
      });
    Promise.resolve(insert).then(() => {}).catch(() => {}); // DB write failure must never propagate
  } catch {
    // Construction of the insert itself failed — swallow silently
  }
}

// ─── Public logger ────────────────────────────────────────────────────────────

export const logger = {
  /** Fine-grained debug info — stdout only, never stored */
  debug(message: string, ctx: LogContext): void {
    pinoInstance.debug(ctx, message);
  },

  /** Normal operation events — stdout only */
  info(message: string, ctx: LogContext): void {
    pinoInstance.info(ctx, message);
  },

  /** Recoverable issues — stdout + DB */
  warn(message: string, ctx: LogContext): void {
    pinoInstance.warn(ctx, message);
    persistToDb("warn", message, ctx);
  },

  /** Errors that need investigation — stdout + DB */
  error(message: string, ctx: LogContext): void {
    pinoInstance.error(ctx, message);
    persistToDb("error", message, ctx);
  },

  /** App-breaking failures — stdout + DB */
  fatal(message: string, ctx: LogContext): void {
    pinoInstance.fatal(ctx, message);
    persistToDb("fatal", message, ctx);
  },
};
