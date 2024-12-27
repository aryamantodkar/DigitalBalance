const mongoose = require('mongoose');

const appSchema = new mongoose.Schema({
  hours: { type: Number, default: 0 }, // Hours spent on the app
  minutes: { type: Number, default: 0 }, // Minutes spent on the app
});

const ScreenTimeSchema = new mongoose.Schema({
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
    totalScreentime: { type: Number, required: true }, // Total screen time in minutes
    date: { type: Date, required: true, default: Date.now }, // Record date
    apps: { 
      type: Map,
      of: appSchema,
      required: true
    }
  });

module.exports = mongoose.model('Screentime', ScreenTimeSchema);