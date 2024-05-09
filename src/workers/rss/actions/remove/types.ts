export interface PayloadRemove {
    id: string;
}

export interface Item {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    guid: string;
}

export interface RSS {
    rss: {
        channel: {
            item: Item | Item[];
        };
    };
}

export interface RemoveItemParams {
    raw: RSS;
    item: PayloadRemove;
}
