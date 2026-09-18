// Outbox — durable offline mutation queue with per-kind coalescing (Phase 6).
// Votes: latest per paper wins. Bumps: deltas sum per paper+metric. Trends:
// counts sum per term. Comments/reports: append, deduped by client id.
// Flush runs on reconnect + foreground; a network failure aborts the run
// (rest stay queued), app-level rejections drop the single op and continue.
import { getKV, type KV } from './storage';
import { getConvexClient, api } from './convex';
import { getDeviceHash } from './device';

const storage: KV = getKV('calebs-outbox');
const KEY = 'outbox.v1';

export type OutboxOp =
  | { kind: 'bump'; paperId: string; metric: 'reads' | 'downloads' | 'upvotes' | 'downvotes'; delta: number }
  | { kind: 'vote'; paperId: string; value: 1 | 0 | -1 }
  | { kind: 'comment'; paperId: string; author: string; body: string; parentId?: string; clientId: string }
  | { kind: 'trend'; term: string; count: number }
  | { kind: 'report'; paperId: string; reason: 'wrong-file' | 'copyright' | 'spam' | 'other'; details?: string; clientId: string };

function read(): OutboxOp[] {
  try {
    const raw = storage.getString(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as OutboxOp[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(ops: OutboxOp[]): void {
  try {
    storage.set(KEY, JSON.stringify(ops.slice(0, 200)));
  } catch {
    // best-effort
  }
}

export function outboxSize(): number {
  return read().length;
}

export function enqueue(op: OutboxOp): void {
  const ops = read();
  if (op.kind === 'vote') {
    const rest = ops.filter((o) => !(o.kind === 'vote' && o.paperId === op.paperId));
    write([...rest, op]);
    return;
  }
  if (op.kind === 'bump') {
    const rest = ops.filter(
      (o) => !(o.kind === 'bump' && o.paperId === op.paperId && o.metric === op.metric),
    );
    const prev = ops.find(
      (o): o is Extract<OutboxOp, { kind: 'bump' }> =>
        o.kind === 'bump' && o.paperId === op.paperId && o.metric === op.metric,
    );
    write([...rest, { ...op, delta: (prev?.delta ?? 0) + op.delta }]);
    return;
  }
  if (op.kind === 'trend') {
    const rest = ops.filter((o) => !(o.kind === 'trend' && o.term === op.term));
    const prev = ops.find(
      (o): o is Extract<OutboxOp, { kind: 'trend' }> => o.kind === 'trend' && o.term === op.term,
    );
    write([...rest, { ...op, count: (prev?.count ?? 0) + op.count }]);
    return;
  }
  if (op.kind === 'comment') {
    if (ops.some((o) => o.kind === 'comment' && o.clientId === op.clientId)) return;
    write([...ops, op]);
    return;
  }
  if (op.kind === 'report') {
    if (
      ops.some(
        (o) => o.kind === 'report' && o.paperId === op.paperId && o.reason === op.reason,
      )
    )
      return;
    write([...ops, op]);
    return;
  }
  write([...ops, op]);
}

function isNetworkError(e: unknown): boolean {
  const m = e instanceof Error ? e.message.toLowerCase() : String(e).toLowerCase();
  return (
    m.includes('network') ||
    m.includes('fetch') ||
    m.includes('failed to fetch') ||
    m.includes('timeout') ||
    m.includes('econn') ||
    m.includes('offline')
  );
}

let flushing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

// While the app is ONLINE and idle, queued ops still need a flush attempt:
// reconnect/foreground events cover transitions, but a long-lived online
// session (app never leaves foreground, network already up) previously left
// ops stuck until the next state change. A modest interval fixes that.
export function scheduleOutboxFlush(delayMs = 60_000): void {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void flushOutbox().then((remaining) => {
      if (remaining > 0) scheduleOutboxFlush();
    });
  }, delayMs);
}

export function cancelScheduledFlush(): void {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

// Returns remaining queue length. Stops at first network failure.
export async function flushOutbox(): Promise<number> {
  if (flushing) return read().length;
  flushing = true;
  try {
    const client = getConvexClient();
    const deviceHash = getDeviceHash();
    let ops = read();
    while (ops.length > 0) {
      const op = ops[0]!;
      try {
        if (op.kind === 'bump') {
          const d = op.delta === 0 ? 0 : op.delta > 0 ? 1 : -1;
          // Server clamps to ±1/call; replay compactly (cap 50, remainder dropped).
          for (let i = 0; i < Math.min(Math.abs(op.delta), 50); i++) {
            if (d !== 0) {
              await client.mutation(api.metrics.bump, {
                paper_id: op.paperId,
                kind: op.metric,
                delta: d,
              });
            }
          }
        } else if (op.kind === 'vote') {
          await client.mutation(api.votes.toggle, {
            paperId: op.paperId,
            deviceHash,
            value: op.value,
          });
        } else if (op.kind === 'comment') {
          await client.mutation(api.comments.post, {
            paper_id: op.paperId,
            author_name: op.author,
            body: op.body,
            parentId: op.parentId,
          });
        } else if (op.kind === 'trend') {
          for (let i = 0; i < Math.min(op.count, 25); i++) {
            await client.mutation(api.trends.record, { term: op.term });
          }
        } else {
          await client.mutation(api.reports.create, {
            paperId: op.paperId,
            reason: op.reason,
            details: op.details,
            deviceHash,
          });
        }
      } catch (e) {
        if (isNetworkError(e)) break;
        // app-level rejection (duplicate/spam/validation): drop, continue
      }
      ops = ops.slice(1);
      write(ops);
    }
    return read().length;
  } finally {
    flushing = false;
  }
}

// One-shot: enqueue happens on failure; every successful flush attempt
// schedules the next one. Started from the root layout.
export function startOutboxLoop(): void {
  scheduleOutboxFlush();
}
