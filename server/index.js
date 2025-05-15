'use strict';
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const hashFile = require('./utils/hash');
const {encryptFile} = require('./utils/encrypt');
const chunkFile = require('./utils/chunk');
const upload = multer({ dest: 'upload/' });
const {subToFabric}=require('./controllers/subController')
const app = express();
const port = process.env.PORT||8080;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.post('/upload', upload.single('evidence'), async(req,res)=>{
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const encryptedPath = path.join('upload', `enc_${originalName}`);
    try {
        const fileHash = await hashFile(filePath);
        const {key,iv} = await encryptFile(filePath, encryptedPath);
        const chunkPaths = await chunkFile(encryptedPath, 1, 'chunks');
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
    }
});
app.get('/getfile',async(req,res)=>{
  const file=req.query.fileID
  try{
  const rs=await subToFabric("getEvidence",[file])
  return res.status(200).json(JSON.parse(rs.result));}
  catch(err){
    return res.status(404).json({success:false,msg:"Retrieval Failed"});
  } 
})
app.listen(port,()=>{
  console.log(`Server running on port ${port}`);
});