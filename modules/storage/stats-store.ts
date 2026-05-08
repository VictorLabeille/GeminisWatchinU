/// <reference types="chrome" />
/**
 * stats-store.ts — Persistent storage for daily request stats
 * 
 * Stats are kept INDEFINITELY (key = ISO date, value = count).
 * Display is limited to last 7 days but all data is preserved.
 */

export interface DailyStats {
  [isoDate: string]: number;
}

export interface BullshitSeed {
  date: string;
  value: number;      // The percentage to display
  isAnomaly: boolean;  // true if showing +3367%
}

export interface StorageData {
  redactedEnabled: boolean;
  dailyStats: DailyStats;
  bullshitSeed: BullshitSeed;
}

const STORAGE_KEYS: (keyof StorageData)[] = ['redactedEnabled', 'dailyStats', 'bullshitSeed'];

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function daysAgoISO(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

/**
 * Generate a new bullshit seed for today.
 * 90% chance: random between +10% and +30%
 * 10% chance: exactly +3367%
 */
function generateBullshitSeed(): BullshitSeed {
  const isAnomaly = Math.random() < 0.1;
  return {
    date: todayISO(),
    value: isAnomaly ? 3367 : Math.floor(Math.random() * 21) + 10,
    isAnomaly,
  };
}

/**
 * Get all storage data.
 */
export async function getStorageData(): Promise<StorageData> {
  const result = (await chrome.storage.local.get(STORAGE_KEYS)) as Partial<StorageData>;
  return {
    redactedEnabled: result.redactedEnabled ?? true,
    dailyStats: result.dailyStats ?? {},
    bullshitSeed: result.bullshitSeed ?? generateBullshitSeed(),
  };
}

/**
 * Set redacted mode on/off.
 */
export async function setRedactedEnabled(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ redactedEnabled: enabled });
}

/**
 * Get redacted mode state.
 */
export async function getRedactedEnabled(): Promise<boolean> {
  const data = await getStorageData();
  return data.redactedEnabled;
}

/**
 * Increment today's request counter by 1.
 * Returns the new count for today.
 */
export async function incrementTodayCount(): Promise<number> {
  const data = await getStorageData();
  const today = todayISO();
  const current = data.dailyStats[today] ?? 0;
  const newCount = current + 1;

  data.dailyStats[today] = newCount;
  await chrome.storage.local.set({ dailyStats: data.dailyStats });

  return newCount;
}

/**
 * Get today's request count.
 */
export async function getTodayCount(): Promise<number> {
  const data = await getStorageData();
  return data.dailyStats[todayISO()] ?? 0;
}

/**
 * Get the last N days of stats (most recent first).
 */
export async function getLastNDays(n: number): Promise<{ date: string; count: number }[]> {
  const data = await getStorageData();
  const result: { date: string; count: number }[] = [];

  for (let i = 0; i < n; i++) {
    const date = daysAgoISO(i);
    result.push({
      date,
      count: data.dailyStats[date] ?? 0,
    });
  }

  return result.reverse(); // Oldest first for chart display
}

/**
 * Get current week stats (Monday to Sunday)
 */
export async function getCurrentWeekStats(): Promise<{ date: string; count: number }[]> {
  const data = await getStorageData();
  const result: { date: string; count: number }[] = [];
  
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7; 
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    result.push({
      date: iso,
      count: data.dailyStats[iso] ?? 0,
    });
  }
  
  return result;
}

/**
 * Get the 7-day total and the delta vs previous 7 days.
 */
export async function getWeeklyDelta(): Promise<{ thisWeek: number; lastWeek: number; deltaPercent: number }> {
  const data = await getStorageData();

  let thisWeek = 0;
  let lastWeek = 0;

  for (let i = 0; i < 7; i++) {
    thisWeek += data.dailyStats[daysAgoISO(i)] ?? 0;
    lastWeek += data.dailyStats[daysAgoISO(i + 7)] ?? 0;
  }

  const deltaPercent = lastWeek === 0
    ? (thisWeek > 0 ? 100 : 0)
    : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);

  return { thisWeek, lastWeek, deltaPercent };
}

/**
 * Get today's bullshit stat (generates once per day).
 */
export async function getBullshitStat(): Promise<BullshitSeed> {
  const data = await getStorageData();
  const today = todayISO();

  if (data.bullshitSeed.date !== today) {
    const newSeed = generateBullshitSeed();
    await chrome.storage.local.set({ bullshitSeed: newSeed });
    return newSeed;
  }

  return data.bullshitSeed;
}

/**
 * Listen for storage changes (useful for popup ↔ content sync).
 */
export function onStorageChange(
  callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void
): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      callback(changes);
    }
  });
}

/**
 * DANGEROUS: Fake "clear" — actually does nothing (dark pattern as per spec).
 * The "Effacer les preuves" button calls this.
 */
export async function fakeClearStats(): Promise<void> {
  // Do absolutely nothing. C'est le principe du dark pattern.
  return;
}
