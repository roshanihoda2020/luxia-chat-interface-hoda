import type { CrawlerState } from "./types";

export const INITIAL_CRAWLER_STATE: CrawlerState = {
    entries: [
        {
            id: "crawl1",
            url: "https://site-1.example",
            description: "Primary marketing site",
            exactSearch: false,
        },
        {
            id: "crawl2",
            url: "https://site-2.example/docs",
            description: "Product documentation",
            exactSearch: true,
        },
    ],
    settings: {
        crawlerMode: true,
        useCrawlerCache: true,
    },
};
