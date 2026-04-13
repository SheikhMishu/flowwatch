#!/usr/bin/env node
// Local background sync worker — polls /api/cron/sync every 5 minutes.
// Run in a separate terminal: node scripts/sync-worker.mjs
// Optionally override port: PORT=3001 node scripts/sync-worker.mjs

const PORT = process.env.PORT ?? 3000;
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const URL = `http://localhost:${PORT}/api/cron/sync`;

async function sync() {
  const ts = new Date().toLocaleTimeString();
  try {
    const res = await fetch(URL);
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.error(`[${ts}] server returned non-JSON (status ${res.status}):`);
      console.error(text.slice(0, 500));
      return;
    }
    if (json.ok) {
      console.log(`[${ts}] synced=${json.synced} failed=${json.failed}`);
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
      console.error(`[${ts}] error:`, json.error ?? JSON.stringify(json));
    }
  } catch (err) {
    console.error(`[${ts}] fetch failed (is the dev server running?):`, err.message);
  }
}

console.log(`FlowWatch sync worker — hitting ${URL} every 5 min`);
console.log("Press Ctrl+C to stop.\n");

// Run immediately on start, then on interval
sync();
setInterval(sync, INTERVAL_MS);
