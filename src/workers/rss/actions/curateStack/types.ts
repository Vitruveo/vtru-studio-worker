export interface Assets {
    artist: string;
    title: string;
    description: string;
    url: string;
}

export interface PayloadCurateStack {
    assets: Assets[];
    title: string;
    sound: string;
    url: string;
}

export interface Item {
    title: string;
    link: string;
    description: {
        __cdata: string;
    };
    pubDate: string;
}

export interface RenderDescription extends PayloadCurateStack {}

export interface RSS {
    rss: {
        channel: {
            item: Item | Item[];
        };
    };
}

export interface AddItemCurateStackParams {
    raw: RSS;
    item: PayloadCurateStack;
}
