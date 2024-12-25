const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, maxLength: 100 },
  email: { type: String, required: true, unique: true, maxLength: 255 },
  password: { type: String, required: true, maxLength: 512 },
});

module.exports = mongoose.model('User', UserSchema);
