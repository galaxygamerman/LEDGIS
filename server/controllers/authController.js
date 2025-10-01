const express=require("express")
const router=express.Router()
const bcrypt=require('bcryptjs')
const jwt=require("jsonwebtoken")
const User=require("../models/user")
const isLoggedIn=(req,res,next)=>{
    const token=req.headers?.authorization?.split(" ")[1]||req.cookies?.token
    if(!token) return res.status(404).json({success:false,message:"Error. Token missing"})
    try{
        const dec=jwt.verify(token,JWT_SECRET)
        req.user=dec
        next()
    }
    catch(error){console.log(error);return res.status(500).json({success: false,message: "access denied"})}
}
const isAdmin=async(req,res,next)=>{
    const token=req.headers?.authorization?.split(" ")[1]||req.cookies?.token
    if(!token) return res.status(404).json({success:false,message:"Error. Token missing"})
    try{
        const dec=jwt.verify(token,JWT_SECRET)
        const user=await User.findOne({username:dec.username})
        if(user.isad)
        {req.user=dec
        next()}
        else throw new Error("AccDen")
    }
    catch(error){console.log(error);return res.status(500).json({success: false,message: "access denied"})}
}
const JWT_SECRET =process.env.JWT_SECRET;

router.post('/register',isAdmin,async(req,res)=>{
    try{
    const {nodeid,username,password}=req.body
    if(!nodeid||!username||!password) return res.status(400).json({msg: `Please fill all the fields`})
    let exuser=await User.findOne({username: username})
    if(exuser) return res.status(400).json({msg: `User ${username} already exists in the database. Please Login`})
    const hashedPass = await bcrypt.hash(password,10)
    exuser= new User({
        username: username,password:hashedPass,nodeid
    })
    await exuser.save()
    const token = jwt.sign({username},JWT_SECRET,{expiresIn:"2h"})
    res.cookie('token', token, {
            httpOnly: true,
            expires: false,
            maxAge: 48*60*60*1000
          });
    return res.status(200).json({
        success: true,
        message: `User ${username} was added successfully`,
        token
    })
    }
    catch(error){
        res.status(500).json({message:"Error Occured: ",err:error.stack})
    }
})
router.post('/login',async(req,res)=>{
    try{
    const {nodeid,username,password}=req.body
    if(!nodeid||!username||!password) return res.status(400).json({msg: `Please fill all the fields`})
    const user=await User.findOne({username: username})
    if(!user) return res.status(400).json({success:false,message: `Invalid credentials, this attempt will be reported`})
    const cpass= await bcrypt.compare(password,user.password)
    if(!cpass||user.nodeid!=nodeid) return res.status(500).json({success:false, message:"Invalid credentials"})
        const token = jwt.sign({username},JWT_SECRET,{expiresIn:"2h"})
    res.cookie('token', token, {
            httpOnly: true,
            expires: false,
            maxAge: 48*60*60*1000
          });
    return res.status(200).json({
        success: true,
        message: `User ${username} has logged in`,
        token
    })
    }
    catch(error){
        console.log(error)
    }
})


module.exports=[router]