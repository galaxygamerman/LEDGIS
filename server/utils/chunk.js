const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

async function chunkFile(filePath, chunkSizeMB, outputDir) {
    const chunkSize = chunkSizeMB * 1024 * 1024;
    const fileStream = fs.createReadStream(filePath, { highWaterMark: chunkSize });

    await fse.ensureDir(outputDir);
    let part = 0;
    const chunkPaths = [];
    return new Promise((resolve, reject) => {
        fileStream.on('data', (chunk) => {
            const chunkPath = path.join(outputDir, `chunk_${part}`);
            fs.writeFileSync(chunkPath, chunk);
            chunkPaths.push(chunkPath);
            part++;
        });

        fileStream.on('end', () => resolve(chunkPaths));
        fileStream.on('error', reject);
    });
}

module.exports = chunkFile;
