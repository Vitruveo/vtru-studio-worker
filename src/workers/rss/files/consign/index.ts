import {
    RSS_NFT,
    RSS_REMIX,
    RSS_PRINT,
    RSS_STREAM,
} from '../../../../constants';
import { PayloadConsign } from '../../types';
import { convertDescription } from '../utils/convertDescription';
import { handleConsignLicenses } from './licenses';

export const handleConsign = ({
    license,
    creator,
    title,
    url,
    image,
    description,
}: PayloadConsign) => {
    const descriptionConverted = convertDescription(description);

    if (license === 'nft')
        return handleConsignLicenses({
            creator,
            image,
            title,
            url,
            description: descriptionConverted,
            license: RSS_NFT,
        });

    if (license === 'remix')
        return handleConsignLicenses({
            creator,
            image,
            title,
            url,
            description: descriptionConverted,
            license: RSS_REMIX,
        });

    if (license === 'print')
        return handleConsignLicenses({
            creator,
            image,
            title,
            url,
            description: descriptionConverted,
            license: RSS_PRINT,
        });

    if (license === 'stream')
        return handleConsignLicenses({
            creator,
            image,
            title,
            url,
            description: descriptionConverted,
            license: RSS_STREAM,
        });

    return Promise.resolve();
};
