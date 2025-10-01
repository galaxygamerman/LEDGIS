const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  nodeid:{
    type: String,
    required: true,
    trim: true,
  },
    username:{
    type: String,
    required: true,
    unique: true,
    trim: true, 
  },
  password:{
    type: String,
    required: true,
  },
  isad:{
    type: Boolean,
    default:false
  }
});
const User = mongoose.model('User', userSchema);
module.exports = User;