const crypto = require('crypto');
const fs = require('fs');
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const { pipeline } = require('stream/promises');

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
async function decryptFile(inputPath, outputPath, keyHex, ivHex) {
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    try { await pipeline(fs.createReadStream(inputPath), decipher, fs.createWriteStream(outputPath)); }
    catch (err) {
        console.log(err)
    }
}


module.exports = { encryptFile, decryptFile, key, iv };
