// Analytics — event taxonomy + dormant pipeline (Phase 7a).
// DORMANT BY DESIGN: no vendor is plugged in (PostHog vs Firebase pending
// user choice) and the Settings opt-out row ships WITH the vendor, so there
// is no toggle controlling nothing. track() is a safe no-op until then —
// call-sites below are complete, so plugging a vendor is a one-line change
// (setAnalyticsProvider) with zero screen edits.
import { getKV, type KV } from './storage';

const storage: KV = getKV('calebs-analytics');
const ENABLED_KEY = 'analytics.enabled.v1';

export type AnalyticsEvent =
  | 'app_open'
  | 'onboarding_complete'
  | 'search_commit'
  | 'paper_open'
  | 'download_complete'
  | 'vote'
  | 'save_toggle'
  | 'comment_post'
  | 'upload_submit'
  | 'upload_decide'
  | 'share_create'
  | 'offline_open'
  | 'cache_evict';

type Provider = (event: AnalyticsEvent, props?: Record<string, string | number | boolean>) => void;

let provider: Provider | null = null;

export function setAnalyticsProvider(fn: Provider | null): void {
  provider = fn;
}

export function setAnalyticsEnabled(on: boolean): void {
  try {
    storage.set(ENABLED_KEY, on ? '1' : '0');
  } catch {
    // best-effort
  }
}

export function isAnalyticsEnabled(): boolean {
  try {
    return storage.getString(ENABLED_KEY) === '1';
  } catch {
    return false;
  }
}

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>): void {
  if (!provider || !isAnalyticsEnabled()) return;
  try {
    provider(event, props);
  } catch {
    // telemetry never breaks product
  }
}
