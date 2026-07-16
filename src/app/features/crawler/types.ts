export interface CrawlerEntry {
    id: string;
    url: string;
    description: string;
    exactSearch: boolean;
    markedForRemoval?: boolean;
}

export interface CrawlerSettings {
    crawlerMode: boolean;
    useCrawlerCache: boolean;
}

export interface CrawlerState {
    entries: CrawlerEntry[];
    settings: CrawlerSettings;
}
