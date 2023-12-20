const fs = require('fs/promises');
const pjson = require('../package.json');

const run = async () => {
    const lines = [];
    lines.push(`version=${pjson.version.trim()}`);
    await fs.writeFile(
        process.env.GITHUB_OUTPUT || 'output.txt',
        lines.join('\n')
    );
};

run().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
});
