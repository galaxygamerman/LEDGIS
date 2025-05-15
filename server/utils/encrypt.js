const crypto = require('crypto');
const fs = require('fs');

const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

function encryptFile(inputPath, outputPath) {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);

    return new Promise((resolve, reject) => {
        input.pipe(cipher).pipe(output)
            .on('finish', () => resolve({ key, iv }))
            .on('error', reject);
    });
}

module.exports = { encryptFile, key, iv };
