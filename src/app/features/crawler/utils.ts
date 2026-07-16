import type { CrawlerEntry, CrawlerState } from "./types";

export function cloneCrawlerState(state: CrawlerState): CrawlerState {
    return {
        entries: state.entries.map((entry) => ({ ...entry })),
        settings: { ...state.settings },
    };
}

export function crawlerSignature(state: CrawlerState): string {
    return JSON.stringify({
        entries: state.entries.map((entry) => ({
            id: entry.id,
            url: entry.url,
            description: entry.description,
            exactSearch: entry.exactSearch,
            markedForRemoval: entry.markedForRemoval ?? false,
        })),
        settings: state.settings,
    });
}

export function activeCrawlerCount(entries: CrawlerEntry[]): number {
    return entries.filter((entry) => !entry.markedForRemoval).length;
}

export function isValidCrawlerUrl(url: string): boolean {
    const trimmed = url.trim();
    return /^https?:\/\/.+/i.test(trimmed);
}
