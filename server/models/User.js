const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, maxLength: 100 },
  email: { type: String, required: true, unique: true, maxLength: 255 },
  password: { type: String, required: true, maxLength: 512 },
  profilePicture: { type: String, default: '' }, // URL to the profile picture
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // List of user IDs following this user
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // List of user IDs this user follows
  screentimePrivacy: { type: Boolean, default: false }, // Whether screentime is public or private
  activeChallenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }], // Active challenges the user is part of
  emailVerified: { type: Boolean, default: false }, // Whether the email has been verified
  verificationToken: { type: String }, // Token used for email verification
  verificationTokenExpiration: { type: Date }, // Expiration time for verification token
  resetToken: { type: String }, // Token for password reset
  resetTokenExpiration: { type: Date }, // Expiration time for reset token
});

module.exports = mongoose.model('User', UserSchema);
