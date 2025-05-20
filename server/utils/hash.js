const crypto = require('crypto');
const fs = require('fs');

function hashFile(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

async function verifyHash(filePath, expectedHash) {
    const hash = crypto.createHash('sha256');
    const fileBuffer = fs.readFileSync(filePath);
    hash.update(fileBuffer);

    const calculatedHash = hash.digest('hex');
    if (calculatedHash === expectedHash) return true;
    return false;
}


module.exports = {hashFile,verifyHash};