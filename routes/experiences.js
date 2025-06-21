const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { InterviewExperience, User } = require('../models')
const { Op } = require('sequelize')

// Get all experiences with optional filters
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const where = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    const experiences = await InterviewExperience.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email']
        }
      ]
    });
    
    res.json(experiences);
  } catch (error) {
    console.error('Error fetching experiences:', error);
    res.status(500).json({ error: 'Failed to fetch experiences' });
  }
});

// Get all experiences with filters (POST for complex queries)
router.post('/', async (req, res) => {
  try {
    const {
      college,
      year,
      percentileRange,
      background,
      limit = 10,
      offset = 0
    } = req.body

    const where = {}

    if (college) where.collegeName = college
    if (year) where.year = year
    if (background) {
      where['profile.category'] = background
    }
    if (percentileRange) {
      const minPercentile = percentileRange === '99' ? 99 : 
        percentileRange === '98' ? 98 : 
        percentileRange === '95' ? 95 : 
        90
      where['profile.catPercentile'] = { [Op.gte]: minPercentile }
    }

    const experiences = await InterviewExperience.findAll({
      where: {
        isVerified: true,
        ...where
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email']
        }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    console.log('Successfully fetched experiences:', experiences.length);
    res.json(experiences);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch experiences' })
  }
})

// Submit new experience
router.post('/submit', auth, async (req, res) => {
  try {
    console.log('Creating experience with data:', req.body);
    
    const { 
      year, 
      profile, 
      watSummary, 
      piQuestions, 
      finalRemarks, 
      collegeId,
      title, 
      //description = '' 
    } = req.body;

    // Validate required fields
    if (!year || !profile || !watSummary || !piQuestions || !finalRemarks || !collegeId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'Please fill in all required fields'
      });
    }

    const experienceData = {
      userId: req.user.id,
      collegeId,
      year,
      profile,
      watSummary,
      piQuestions,
      finalRemarks,
      title,
      //description,
      isVerified: false
    };

    console.log('Creating experience with data:', experienceData);
    
    const experience = await InterviewExperience.create(experienceData);
    console.log('Experience created successfully:', experience);
    
    res.status(201).json({
      success: true,
      message: 'Experience submitted successfully',
      data: experience
    });
  } catch (error) {
    console.error('Error creating experience:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit experience', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get experiences for current user
router.get('/user/me', auth, async (req, res) => {
  try {
    const experiences = await InterviewExperience.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email']
        }
      ]
    });

    res.json({
      success: true,
      data: experiences
    });
  } catch (error) {
    console.error('Error fetching user experiences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your interview experiences',
      details: error.message
    });
  }
});

// Get single experience
router.get('/:id', async (req, res) => {
  try {
    const experience = await InterviewExperience.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email']
        }
      ]
    })

    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' })
    }

    res.json(experience)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch experience' })
  }
})

// Update helpful status
router.post('/:id/helpful', auth, async (req, res) => {
  try {
    const experience = await InterviewExperience.findByPk(req.params.id)
    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' })
    }

    // Check if user has already voted
    const hasVoted = experience.upvotedBy?.includes(req.user.id)
    if (hasVoted) {
      experience.upvotedBy = experience.upvotedBy.filter(id => id !== req.user.id)
      experience.upvotes--
    } else {
      experience.upvotedBy = [...(experience.upvotedBy || []), req.user.id]
      experience.upvotes++
    }

    await experience.save()

    res.json({
      isHelpful: !hasVoted,
      upvotes: experience.upvotes
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update helpful status' })
  }
})

module.exports = router
