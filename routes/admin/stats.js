const express = require('express');
const router = express.Router();
const { auth, admin } = require('../../middleware/auth');
const { InterviewExperience, College } = require('../../models');

// Get admin statistics
router.get('/', admin, async (req, res) => {
  try {
    const [totalExperiences, totalColleges, totalVerifiedExperiences] = await Promise.all([
      InterviewExperience.count(),
      College.count(),
      req.user.role === 'admin' ? InterviewExperience.count({ where: { isVerified: true } }) : 0
    ]);

    const stats = {
      totalExperiences,
      totalColleges,
      totalVerifiedExperiences,
      pendingExperiences: totalExperiences - totalVerifiedExperiences
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch admin stats',
      details: error.message
    });
  }
});

module.exports = router;
