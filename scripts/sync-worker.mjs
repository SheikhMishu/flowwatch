#!/usr/bin/env node
// Local background sync worker — polls /api/cron/sync every 5 minutes.
// Run in a separate terminal: node scripts/sync-worker.mjs
// Optionally override port: PORT=3001 node scripts/sync-worker.mjs

const PORT = process.env.PORT ?? 3000;
const BASE = `http://localhost:${PORT}`;
const SYNC_INTERVAL_MS = 5 * 60 * 1000;       // 5 minutes
const RETENTION_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function sync() {
  const ts = new Date().toLocaleTimeString();
  try {
    const res = await fetch(`${BASE}/api/cron/sync`);
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.error(`[${ts}] sync: server returned non-JSON (status ${res.status}):`);
      console.error(text.slice(0, 500));
      return;
    }
    if (json.ok) {
      console.log(`[${ts}] sync: synced=${json.synced} failed=${json.failed}`);
      if (json.results) {
        for (const r of json.results) {
          const icon = r.ok ? "✓" : "✗";
          const detail = r.ok
            ? `workflows=${r.workflowsUpserted} executions=${r.executionsUpserted}`
            : r.error;
          console.log(`  ${icon} ${r.instanceId.slice(0, 8)}… ${detail}`);
        }
      }
    } else {
      console.error(`[${ts}] sync error:`, json.error ?? JSON.stringify(json));
    }
  } catch (err) {
    console.error(`[${ts}] sync fetch failed (is the dev server running?):`, err.message);
  }
}

async function retention() {
  const ts = new Date().toLocaleTimeString();
  try {
    const res = await fetch(`${BASE}/api/cron/retention`);
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.error(`[${ts}] retention: server returned non-JSON (status ${res.status}):`);
      console.error(text.slice(0, 500));
      return;
    }
    if (json.ok) {
      console.log(`[${ts}] retention: deleted=${json.totalDeleted} orgs=${json.succeeded} failed=${json.failed}`);
    } else {
      console.error(`[${ts}] retention error:`, json.error ?? JSON.stringify(json));
    }
  } catch (err) {
    console.error(`[${ts}] retention fetch failed (is the dev server running?):`, err.message);
  }
}

console.log(`FlowMonix worker — sync every 5 min, retention every 24 h`);
console.log(`Hitting ${BASE}`);
console.log("Press Ctrl+C to stop.\n");

// Run both immediately on start, then on their respective intervals
sync();
retention();
setInterval(sync, SYNC_INTERVAL_MS);
setInterval(retention, RETENTION_INTERVAL_MS);
