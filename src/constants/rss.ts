export const RSS_CURATE_STACK =
    process.env.RSS_CURATE_STACK || 'curateStack.xml';
export const RSS_CURATE_STACK_AMOUNT_ITEMS = process.env
    .RSS_CURATE_STACK_AMOUNT_ITEMS
    ? parseInt(process.env.RSS_CURATE_STACK_AMOUNT_ITEMS, 10)
    : 10;

export const RSS_REMIX = process.env.RSS_REMIX || 'remix.xml';
export const RSS_PRINT = process.env.RSS_PRINT || 'print.xml';
export const RSS_NFT = process.env.RSS_NFT || 'nft.xml';
export const RSS_STREAM = process.env.RSS_STREAM || 'stream.xml';
