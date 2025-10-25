import mongoose from 'mongoose';

const verificationCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: /@gym-nd\.at$/,
    index: true
  },
  code: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // TTL index - document wird nach 10 Minuten automatisch gelöscht
  }
});

const VerificationCode = mongoose.model('VerificationCode', verificationCodeSchema);

export default VerificationCode;
