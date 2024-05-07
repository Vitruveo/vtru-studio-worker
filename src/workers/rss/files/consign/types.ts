export interface PayloadConsign {
    license: string;
    url: string;
    title: string;
    creator: string;
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

export interface AddItemConsignParams {
    raw: RSS;
    item: PayloadConsign;
}

export interface CheckExistsFileParams {
    name: string;
    title: string;
}

export interface RenderDescription {
    url: string;
    title: string;
    creator: string;
}
