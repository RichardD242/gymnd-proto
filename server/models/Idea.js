import mongoose from 'mongoose';

const ideaSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['Anliegen', 'Beschwerde', 'Vorschlag', 'Feedback']
  },
  submitterEmail: {
    type: String,
    required: true,
    match: /@gym-nd\.at$/
  },
  visibility: {
    type: String,
    default: 'private',
    enum: ['private', 'public']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Idea = mongoose.model('Idea', ideaSchema);

export default Idea;
