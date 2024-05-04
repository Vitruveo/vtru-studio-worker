/* eslint-disable no-await-in-loop */
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { AWS_DEFAULT_REGION } from '../../../constants';

// get all file names in S3
export interface ListFilesOptions {
    bucket: string;
}

export const list = async ({ bucket }: ListFilesOptions) => {
    const client = new S3Client({
        region: AWS_DEFAULT_REGION,
    });

    const results: string[] = [];

    let isTruncated = true;
    let continuationToken: string | undefined;

    while (isTruncated) {
        const command = new ListObjectsV2Command({
            Bucket: bucket,
            ContinuationToken: continuationToken,
            MaxKeys: 1000,
        });
        const answer = await client.send(command);
        if (answer.Contents) {
            answer.Contents.forEach((content) => {
                if (content.Key) results.push(content.Key);
            });
        }
        isTruncated = !!answer.IsTruncated;
        continuationToken = answer.NextContinuationToken;
    }

    return results;
};
