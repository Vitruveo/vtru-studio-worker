/* eslint-disable no-console */
const net = require('net');

const host = process.argv[2];
const port = parseInt(process.argv[3], 10);

const checkPort = () => {
    const client = net.connect(
        {
            host,
            port,
        },
        () => {
            console.log(`Porta: ${port} aberta`);
            process.exit(0);
        }
    );

    client.on('error', () => {
        console.log(`Porta: ${port} fechada`);
        setTimeout(() => {
            checkPort();
        }, 1000);
    });
};

checkPort();
