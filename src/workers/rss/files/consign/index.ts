import {
    RSS_NFT,
    RSS_REMIX,
    RSS_PRINT,
    RSS_STREAM,
} from '../../../../constants';
import { PayloadConsign } from '../../types';
import { handleConsignLicenses } from './licenses';

export const handleConsign = ({
    license,
    creator,
    title,
    url,
}: PayloadConsign) => {
    if (license === 'nft')
        return handleConsignLicenses({ creator, title, url, license: RSS_NFT });

    if (license === 'remix')
        return handleConsignLicenses({
            creator,
            title,
            url,
            license: RSS_REMIX,
        });

    if (license === 'print')
        return handleConsignLicenses({
            creator,
            title,
            url,
            license: RSS_PRINT,
        });

    if (license === 'stream')
        return handleConsignLicenses({
            creator,
            title,
            url,
            license: RSS_STREAM,
        });

    return Promise.resolve();
};
