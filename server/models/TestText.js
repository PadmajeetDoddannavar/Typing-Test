import mongoose from 'mongoose';

const testTextSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  category: {
    type: String,
    default: 'general'
  }
}, {
  timestamps: true
});

const TestText = mongoose.model('TestText', testTextSchema);

export default TestText;