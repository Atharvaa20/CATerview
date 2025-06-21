const express = require('express');
const router = express.Router();
const { auth, admin } = require('../../middleware/auth');
const { InterviewExperience, College, User } = require('../../models');
const { sequelize } = require('../../config/database');
const { Op } = require('sequelize');

// Helper function to handle errors
const handleError = (res, error, message) => {
  console.error(`${message}:`, error);
  res.status(500).json({ 
    error: `Failed to ${message.toLowerCase()}`,
    details: error.message
  });
};

// Common include options for experience queries
const experienceIncludes = [
  {
    model: College,
    as: 'college',
    attributes: ['id', 'name', 'slug']
  },
  {
    model: User,
    as: 'user',
    attributes: ['id', 'name', 'email']
  }
];

// Get all experiences
router.get('/', admin, async (req, res) => {
  try {
    const experiences = await InterviewExperience.findAll({
      include: experienceIncludes,
      order: [['createdAt', 'DESC']]
    });
    res.json(experiences);
  } catch (error) {
    handleError(res, error, 'Fetch experiences');
  }
});

// Get all experiences with details
router.get('/all', admin, async (req, res) => {
  try {
    const experiences = await InterviewExperience.findAll({
      include: experienceIncludes,
      order: [['createdAt', 'DESC']]
    });
    res.json(experiences);
  } catch (error) {
    handleError(res, error, 'Fetch all experiences');
  }
});

// Get pending experiences
router.get('/pending', admin, async (req, res) => {
  try {
    const experiences = await InterviewExperience.findAll({
      where: { isVerified: false },
      include: experienceIncludes,
      order: [['createdAt', 'DESC']]
    });
    res.json(experiences);
  } catch (error) {
    handleError(res, error, 'Fetch pending experiences');
  }
});

// Get verified experiences
router.get('/verified', admin, async (req, res) => {
  try {
    const experiences = await InterviewExperience.findAll({
      where: { isVerified: true },
      include: experienceIncludes,
      order: [['createdAt', 'DESC']]
    });
    res.json(experiences);
  } catch (error) {
    handleError(res, error, 'Fetch verified experiences');
  }
});

// Get single experience
router.get('/:id', admin, async (req, res) => {
  try {
    console.log(`[DEBUG] Fetching experience with ID: ${req.params.id}`);
    
    // First try with the standard query, explicitly including unverified experiences
    let experience = await InterviewExperience.unscoped().findByPk(req.params.id, {
      include: experienceIncludes,
      logging: console.log, // Enable query logging
      paranoid: false // Include soft-deleted records
    });
    
    // If not found, try with raw query as a fallback
    if (!experience) {
      console.log('[DEBUG] Experience not found with standard query, trying raw query...');
      const [results] = await sequelize.query(
        'SELECT * FROM interview_experiences WHERE id = ?',
        { replacements: [req.params.id] }
      );
      
      if (results.length > 0) {
        console.log('[DEBUG] Found experience with raw query:', results[0]);
        experience = await InterviewExperience.findByPk(req.params.id, {
          include: experienceIncludes,
          raw: true,
          nest: true,
          logging: console.log
        });
      }
    }
    
    if (!experience) {
      console.log(`[DEBUG] Experience with ID ${req.params.id} not found in database`);
      return res.status(404).json({ 
        error: 'Experience not found',
        id: req.params.id,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`[DEBUG] Found experience:`, JSON.stringify(experience, null, 2));
    res.json(experience);
  } catch (error) {
    console.error('[ERROR] Error fetching experience:', error);
    handleError(res, error, 'Fetch experience');
  }
});

// Verify experience
router.put('/:id/verify', admin, async (req, res) => {
  console.log(`[DEBUG] Verifying experience with ID: ${req.params.id}`);
  try {
    const experience = await InterviewExperience.unscoped().findByPk(req.params.id, {
      logging: console.log
    });
    
    console.log(`[DEBUG] Found experience:`, experience ? JSON.stringify(experience.get(), null, 2) : 'Not found');
    
    if (!experience) {
      console.log(`[DEBUG] Experience with ID ${req.params.id} not found`);
      return res.status(404).json({ 
        error: 'Experience not found',
        id: req.params.id,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`[DEBUG] Updating experience ${req.params.id} to verified`);
    await experience.update({ isVerified: true }, { logging: console.log });
    
    console.log(`[DEBUG] Successfully verified experience ${req.params.id}`);
    res.json({ 
      message: 'Experience verified successfully',
      id: experience.id,
      isVerified: true
    });
  } catch (error) {
    console.error('[ERROR] Error verifying experience:', error);
    handleError(res, error, 'Verify experience');
  }
});

// Reject experience
router.put('/:id/reject', admin, async (req, res) => {
  try {
    const experience = await InterviewExperience.findByPk(req.params.id);
    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' });
    }
    
    await experience.destroy();
    
    res.json({ message: 'Experience rejected and deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Reject experience');
  }
});

// Delete experience
router.delete('/:id', admin, async (req, res) => {
  try {
    const experience = await InterviewExperience.findByPk(req.params.id);
    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' });
    }
    
    await experience.destroy();
    
    res.json({ message: 'Experience deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Delete experience');
  }
});

// Create experience (admin)
router.post('/', admin, async (req, res) => {
  try {
    const { title, description, year, collegeId, userId } = req.body;
    
    // Validate required fields
    if (!title || !description || !year || !collegeId || !userId) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if college exists
    const college = await College.findByPk(collegeId);
    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }
    
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create experience
    const experience = await InterviewExperience.create({
      title,
      description,
      year,
      collegeId,
      userId,
      isVerified: true // Admin-created experiences are auto-verified
    });
    
    // Fetch the created experience with associations
    const createdExperience = await InterviewExperience.findByPk(experience.id, {
      include: experienceIncludes
    });
    
    res.status(201).json(createdExperience);
  } catch (error) {
    handleError(res, error, 'Create experience');
  }
});

// Update experience (admin)
router.put('/:id', admin, async (req, res) => {
  try {
    const { title, description, year, collegeId, isVerified } = req.body;
    
    const experience = await InterviewExperience.findByPk(req.params.id);
    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' });
    }
    
    // Update fields if provided
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (year) updateData.year = year;
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    
    // If collegeId is provided, validate it
    if (collegeId) {
      const college = await College.findByPk(collegeId);
      if (!college) {
        return res.status(404).json({ error: 'College not found' });
      }
      updateData.collegeId = collegeId;
    }
    
    await experience.update(updateData);
    
    // Fetch the updated experience with associations
    const updatedExperience = await InterviewExperience.findByPk(experience.id, {
      include: experienceIncludes
    });
    
    res.json(updatedExperience);
  } catch (error) {
    handleError(res, error, 'Update experience');
  }
});

module.exports = router;
