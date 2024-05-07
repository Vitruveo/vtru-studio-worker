export const RSS_NAME = process.env.RSS_NAME || 'rss.xml';
export const RSS_AMOUNT_ITEMS = process.env.RSS_AMOUNT_ITEMS
    ? parseInt(process.env.RSS_AMOUNT_ITEMS, 10)
    : 10;
