const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
    name: { type: String, required: true, maxLength: 100 }, // Name of the challenge
    description: { type: String, maxLength: 300 }, // Optional description
    startDate: { type: Date, required: true }, // Challenge start date
    endDate: { type: Date, required: true }, // Challenge end date
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users participating in the challenge
    screentimeReductions: [
      {
        userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reduction: { type: Number, default: 0 }, // Screentime reduction in minutes
      },
    ], // Reduction data for leaderboard
  });
  
  module.exports = mongoose.model('Challenge', ChallengeSchema);