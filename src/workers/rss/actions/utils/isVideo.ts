export const videoExtension = [
    '.mp4',
    '.mov',
    '.avi',
    '.wmv',
    '.flv',
    '.mkv',
    '.webm',
    '.mpeg',
    '.mpg',
    '.m4v',
    '.3gp',
];

export const isVideo = (fileName: string) =>
    videoExtension.some((ext) => fileName.endsWith(ext));
