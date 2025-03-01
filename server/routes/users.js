import express from 'express';
import User from '../models/User.js';
import TestResult from '../models/TestResult.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get user's best WPM for each difficulty
    const bestResults = await TestResult.aggregate([
      { $match: { user: req.user.userId } },
      { $group: {
          _id: '$difficulty',
          bestWpm: { $max: '$wpm' },
          bestAccuracy: { $max: '$accuracy' }
        }
      }
    ]);
    
    // Get user's average WPM and accuracy
    const averageStats = await TestResult.aggregate([
      { $match: { user: req.user.userId } },
      { $group: {
          _id: null,
          avgWpm: { $avg: '$wpm' },
          avgAccuracy: { $avg: '$accuracy' },
          totalTests: { $sum: 1 }
        }
      }
    ]);
    
    // Format the results
    const stats = {
      bestByDifficulty: bestResults.reduce((acc, curr) => {
        acc[curr._id] = {
          wpm: curr.bestWpm,
          accuracy: curr.bestAccuracy
        };
        return acc;
      }, {}),
      average: averageStats.length > 0 ? {
        wpm: Math.round(averageStats[0].avgWpm),
        accuracy: Math.round(averageStats[0].avgAccuracy * 100) / 100,
        totalTests: averageStats[0].totalTests
      } : {
        wpm: 0,
        accuracy: 0,
        totalTests: 0
      }
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;