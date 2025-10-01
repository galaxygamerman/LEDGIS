const path = require('path');
const {reconFile}=require("../utils/chunk");
const { decryptFile } = require("../utils/encrypt");
const { verifyHash } = require("../utils/hash");
const fs= require('fs');
const fse = require('fs-extra');
const buildFile=async(metadata)=>{
    const fname="enc_"+metadata.originalName
    const enc=metadata.encryption
    const ts=Date.now().toString()
    const temppath=path.resolve(__dirname, '..', 'temp',ts)
    const respath=path.resolve(__dirname, '..', 'download',ts)
    await fse.ensureDir(temppath)
    await fse.ensureDir(respath)
    const encpath = path.resolve(temppath, fname);
    const downpath = path.resolve(respath, 'dec_' + metadata.originalName);
    const status=[false,false]
    try{
    await reconFile(metadata.chunkList,encpath);
    await decryptFile(encpath,downpath,enc.key,enc.iv)
    status[0]=true
    fs.unlinkSync(encpath);
    status[1]=await verifyHash(downpath,metadata.hash)
    return status
}
    catch(err){
        console.log(err)
        return status;
    }
}

module.exports={buildFile}