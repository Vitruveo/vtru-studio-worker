export interface PayloadConsign {
    license: string;
    url: string;
    image: string;
    creator: string;
    title: string;
    description: string;
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

export interface AddItemParams {
    raw: RSS;
    item: PayloadConsign;
}

export interface CheckExistsFileParams {
    name: string;
    title: string;
}

export interface RenderDescription {
    url: string;
    image: string;
    creator: string;
    title: string;
    description: string;
    id: string;
}
