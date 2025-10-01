const path = require('path');
const {reconFile}=require("../utils/chunk");
const {decryptFile}=require("../utils/encrypt");
const crypto=require('crypto');
const {verifyHash} = require("../utils/hash");
const fs= require('fs');
const fse = require('fs-extra');
const tKeys=new Map()
const buildFile=async(metadata)=>{
    const fname="enc_"+metadata.originalName
    const enc=metadata.encryption
    const ts=Date.now().toString()
    const temppath=path.resolve(__dirname,'..','temp',ts)
    const respath=path.resolve(__dirname,'..','download',ts)
    await fse.ensureDir(temppath)
    await fse.ensureDir(respath)
    const encpath=path.resolve(temppath,fname);
    const downpath=path.resolve(respath,'dec_'+metadata.originalName);
    const status=[false,false]
    try{
    await reconFile(metadata.chunkList,encpath);
    await decryptFile(encpath,downpath,enc.key,enc.iv)
    status[0]=true
    status[1]=await verifyHash(downpath,metadata.hash)
    const tempkey=crypto.randomBytes(16).toString('hex');
    tKeys.set(tempkey,downpath)
    status[2]=tempkey
    return status
}
    catch(err){
        console.log(err)
        return status;
    }
    finally{
    fs.rmSync(temppath,{recursive:true,force:true})
    setTimeout(()=>{fs.rmSync(respath,{recursive:true,force:true}),tKeys.delete(tempkey)},(process.env.fileTime||60)*1000)
    }
}

module.exports={buildFile,tKeys}