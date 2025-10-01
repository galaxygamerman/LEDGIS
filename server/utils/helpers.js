const fs=require("fs")
const path=require("path")
const cleanDir=(dir)=>{
  if(fs.existsSync(dir))fs.rmSync(dir,{recursive:true,force:true});
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'.gitkeep'),'');
}
module.exports={cleanDir}