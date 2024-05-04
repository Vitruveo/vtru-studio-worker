export interface Payload {
    creator: string;
    assets: string[];
    title: string;
    sound: string;
    url: string;
}

export interface Item {
    title: string;
    link: string;
    description: string;
    pubDate: string;
}

export interface RSS {
    rss: {
        channel: {
            item: Item | Item[];
        };
    };
}

export interface AddItemParams {
    raw: RSS;
    item: Payload;
}
