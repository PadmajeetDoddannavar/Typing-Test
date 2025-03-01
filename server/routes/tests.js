import express from 'express';
import TestText from '../models/TestText.js';
import TestResult from '../models/TestResult.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get random test text by difficulty
router.get('/text/:difficulty', async (req, res) => {
  try {
    const { difficulty } = req.params;
    
    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ message: 'Invalid difficulty level' });
    }
    
    // Get random text of specified difficulty
    const count = await TestText.countDocuments({ difficulty });
    
    if (count === 0) {
      return res.status(404).json({ message: 'No texts found for this difficulty' });
    }
    
    const random = Math.floor(Math.random() * count);
    const text = await TestText.findOne({ difficulty }).skip(random);
    
    res.json(text);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save test result
router.post('/results', authenticateToken, async (req, res) => {
  try {
    const { difficulty, wpm, accuracy, completedText, duration } = req.body;
    
    const newResult = new TestResult({
      user: req.user.userId,
      difficulty,
      wpm,
      accuracy,
      completedText,
      duration
    });
    
    await newResult.save();
    
    res.status(201).json(newResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's test results
router.get('/results', authenticateToken, async (req, res) => {
  try {
    const results = await TestResult.find({ user: req.user.userId })
      .sort({ date: -1 })
      .limit(10);
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Seed test texts (for development)
router.post('/seed', async (req, res) => {
  try {
    // Sample texts for different difficulty levels
    const sampleTexts = [
      {
        text: "The quick brown fox jumps over the lazy dog. Simple sentences are easy to type.",
        difficulty: "easy",
        category: "general"
      },
      {
        text: "Programming is the process of creating a set of instructions that tell a computer how to perform a task. Programming can be done using a variety of computer programming languages.",
        difficulty: "medium",
        category: "technology"
      },
      {
        text: "The intricate complexities of quantum mechanics challenge our fundamental understanding of reality. Particles exhibiting wave-particle duality demonstrate behavior that defies classical physics, necessitating a paradigm shift in our conceptual framework.",
        difficulty: "hard",
        category: "science"
      }
    ];
    
    await TestText.deleteMany({});
    await TestText.insertMany(sampleTexts);
    
    res.status(201).json({ message: 'Test texts seeded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;