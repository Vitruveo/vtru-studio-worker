import { createCanvas } from 'canvas';

const width = 800;
const height = 800;
const canvas = createCanvas(width, height);

export const createBlankImage = () => {
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    return canvas.toBuffer();
};
