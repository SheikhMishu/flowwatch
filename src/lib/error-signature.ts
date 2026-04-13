import { createHash } from "crypto";

// Strip dynamic tokens from an error message so the same logical error
// produces the same signature even with varying IDs, timestamps, etc.
function normalizeError(msg: string): string {
  return msg
    .toLowerCase()
    // UUIDs
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g, "*")
    // ISO timestamps
    .replace(/\d{4}-\d{2}-\d{2}t\d{2}:\d{2}:\d{2}[^\s"]*/g, "*")
    // emails
    .replace(/\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/g, "*")
    // URLs
    .replace(/https?:\/\/[^\s"']+/g, "*")
    // standalone numbers (IDs, status codes, etc.)
    .replace(/\b\d+\b/g, "*")
    .trim();
}

/**
 * Returns a short hex digest that identifies a class of error.
 * Same workflow + same node + same (normalized) error = same signature.
 */
export function generateErrorSignature(
  workflowId: string,
  nodeName: string | null,
  errorMessage: string | null,
): string {
  const normalized = normalizeError(errorMessage ?? "unknown error");
  const raw = `${workflowId}|${nodeName ?? "unknown"}|${normalized}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}
