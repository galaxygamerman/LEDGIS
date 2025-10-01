const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const {create}=require("ipfs-http-client")
const ipfs=create({ url: process.env.ipfsURL });
async function chunkFile(fileHash,filePath, chunkSizeMB, outputDir) {
    const chunkSize = chunkSizeMB * 1024 * 1024;
    const fileStream = fs.createReadStream(filePath, { highWaterMark: chunkSize });
    const chunkCIDs=[]
    let part=0;
    for await(const chunk of fileStream) {
        const result=await ipfs.add(chunk,{pin:true,rawLeaves:true});
        chunkCIDs.push({index: part,cid:result.cid.toString(),size:chunk.length});
        part++;
    }
    console.log(`${part} chunks added to IPFS`)
    console.log(chunkCIDs)
    return chunkCIDs;
}
async function reconFile(chunkCIDs, outputFilePath) {
    const writeStream = fs.createWriteStream(outputFilePath);
    chunkCIDs.sort((a,b)=>a.index-b.index)
    for(const chunks of chunkCIDs){
        const {cid}=chunks
        for await(const chunk of ipfs.cat(cid)){
            writeStream.write(chunk);
        }
    }
    writeStream.end();
    return new Promise((resolve)=>{
    writeStream.on('finish',()=>{
        console.log(`Chunks combined into: ${outputFilePath}`);
        resolve(outputFilePath);
    });
})}
module.exports={chunkFile,reconFile,ipfs};
