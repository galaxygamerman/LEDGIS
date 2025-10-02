'use strict';
const express = require('express');
const multer = require('multer');
const cors=require("cors")
const bodyParser = require('body-parser');
const fs = require('fs');
require("dotenv").config()
const path = require('path');
const {hashFile,verifyHash} = require('./utils/hash');
const {encryptFile} = require('./utils/encrypt');
const {chunkFile,reconFile,ipfs} = require('./utils/chunk');
const upload = multer({ dest: 'upload/' });
const {subToFabric}=require('./controllers/subController');
const {buildFile,tKeys} = require('./controllers/dloadController');
const {connectDB}=require("./controllers/dbController");
const {cleanDir}=require("./utils/helpers")
const {authController,isLoggedIn} = require('./controllers/authController');
const app = express();
const port = process.env.PORT||8080;
app.use(bodyParser.json());
app.use(cors({origin:"*"}))
app.use(bodyParser.urlencoded({extended:true}));
["download","upload","temp"].forEach(cleanDir);
connectDB();
app.post('/upload',isLoggedIn,upload.single('evidence'),async(req,res)=>{
    console.log(req.file)
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const encryptedPath = path.join('upload', `enc_${originalName}`);
    try {
        const fileHash = await hashFile(filePath);
        const {key,iv} = await encryptFile(filePath, encryptedPath);
        const chunkPaths = await chunkFile(fileHash,encryptedPath, 1, 'chunks');
        const metadata = {
            originalName,
            hash: fileHash,
            chunksStored: chunkPaths.length,
            chunkList: chunkPaths,
            encryption:{
                key: key.toString('hex'),
                iv: iv.toString('hex'),
            },
            timestamp: new Date().toISOString(),
        };
        const fres=await subToFabric("storeEvidence",[JSON.stringify(metadata)]);
        console.log('Stored Evidence Metadata:');
        res.status(200).json({ message: 'File processed and chunked.', res:JSON.parse(fres.result) });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing file');
    } finally {
        fs.unlinkSync(filePath);
        fs.unlinkSync(encryptedPath);
    }
});
app.use("/auth",authController)
app.get("/",(req,res)=>{
  res.send("LEDGIS Server is up.....")
})
app.get('/getfile',isLoggedIn,async(req,res)=>{
  const file=req.query.fileID
  try{
  const rs=await subToFabric("getEvidence",[file])
  const meta=JSON.parse(rs.result)
  // console.log(meta)
  const status=await buildFile(meta);
  return res.status(200).json({file_decrypted:status[0],hash_verified: status[1],metadata: meta,tempkey:status[2]});}
  catch(err){
    console.log(err)
    return res.status(404).json({success:false,msg:"Evidence Retrieval Failed."});
  } 
})
app.get('/download',isLoggedIn,async(req,res)=>{
  const tkey=req.query.tempkey
  try{
    const filePath=tKeys.get(tkey)
    if (!filePath||!fs.existsSync(filePath)){
        return res.status(404).json({success: false,msg: "File not found or expired"});
    }
    const fileName = path.basename(filePath);
    res.download(filePath,fileName,(err)=>{if(err)console.error(err);})
  }
  catch(err){
    console.log(err)
    return res.status(404).json({success:false,msg:"Evidence Retrieval Failed."});
  } 
})
app.get('/health',isLoggedIn,async(req,res)=>{
  try{
    const start=Date.now()
    if(!ipfs) throw new Error("IPFS not Initialised");
    const data=await ipfs.repo.stat();
    const fixed={}
    console.log(data)
    for(let key in data){
      if(key=="repoPath")continue
      fixed[key]=((typeof data[key])=='bigint')?data[key].toString():data[key]
    }
    fixed.serverLoc=[[process.env.ipfsREGx,process.env.ipfsREGy]]
    return res.status(200).json({healthy:true,stats:fixed,latency:`${Date.now()-start}ms`})
  }
  catch(err){
    console.log(err)
    return res.status(404).json({healthy:false,msg:err});
  } 
})
app.listen(port,()=>{
  console.log(`Server running on port ${port}`);
});