export interface PayloadConsign {
    license: 'nft' | 'print' | 'stream' | 'remix';
    id: string;
    title: string;
    url: string;
    creator: string;
    image: string;
    description: string;
}
