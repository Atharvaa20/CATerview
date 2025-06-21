const express = require('express');
const router = express.Router();
const { auth, admin } = require('../../middleware/auth');
const { College, InterviewExperience, sequelize } = require('../../models');
const { Op } = require('sequelize');

// Get all colleges
router.get('/', admin, async (req, res) => {
  try {
    const colleges = await College.findAll({
      order: [['name', 'ASC']]
    });
    res.json({
      message: 'Colleges fetched successfully',
      data: colleges
    });
  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({ 
      error: 'Failed to fetch colleges',
      details: error.message
    });
  }
});

// Get college by ID
router.get('/:id', admin, async (req, res) => {
  try {
    const college = await College.findByPk(req.params.id);
    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }
    res.json(college);
  } catch (error) {
    console.error('Error fetching college:', error);
    res.status(500).json({ 
      error: 'Failed to fetch college',
      details: error.message
    });
  }
});

// Create new college
router.post('/', admin, async (req, res) => {
  try {
    const { name, logoUrl, description } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'College name is required' });
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Check if college with same name or slug exists
    const existing = await College.findOne({
      where: { [Op.or]: [{ name }, { slug }] }
    });
    if (existing) {
      return res.status(400).json({ 
        error: 'College with this name or similar name already exists' 
      });
    }

    const college = await College.create({
      name,
      slug,
      //logoUrl: logoUrl || null,
      //description: description || null,
      status: 'active'
    });

    res.status(201).json(college);
  } catch (error) {
    console.error('Error creating college:', error);
    res.status(500).json({ 
      error: 'Failed to create college',
      details: error.message
    });
  }
});

// Update college
router.put('/:id', admin, async (req, res) => {
  try {
    // Parse ID as integer
    const collegeId = parseInt(req.params.id);
    if (isNaN(collegeId)) {
      return res.status(400).json({ 
        error: 'Invalid college ID', 
        details: 'ID must be a valid number' 
      });
    }

    const college = await College.findByPk(collegeId);
    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }

    // Update college fields
    const { name, status } = req.body;
    
    // If name is being updated, check for duplicates
    if (name && name !== college.name) {
      // Generate new slug from name
      const newSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      // Check if another college exists with the same name or slug
      const existing = await College.findOne({
        where: {
          id: { [Op.ne]: collegeId },
          [Op.or]: [
            { name },
            { slug: newSlug }
          ]
        }
      });
      
      if (existing) {
        return res.status(400).json({ 
          error: 'Another college with this name or similar name already exists' 
        });
      }
      
      college.name = name;
      college.slug = newSlug;
    }
    
    // Update other fields if provided
    //if (logoUrl !== undefined) college.logoUrl = logoUrl;
    //if (description !== undefined) college.description = description;
    if (status && ['active', 'pending', 'inactive'].includes(status)) {
      college.status = status;
    }
    
    await college.save();
    
    res.json({
      message: 'College updated successfully',
      data: college
    });
  } catch (error) {
    console.error('Error updating college:', error);
    res.status(500).json({ 
      error: 'Failed to update college',
      details: error.message
    });
  }
});

// Delete college
router.delete('/:id', admin, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Parse and validate ID
    const collegeId = parseInt(req.params.id);
    if (isNaN(collegeId)) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Invalid college ID', 
        details: 'ID must be a valid number' 
      });
    }

    // Find the college with a lock
    const college = await College.findByPk(collegeId, { 
      transaction,
      lock: transaction.LOCK.UPDATE 
    });
    
    if (!college) {
      await transaction.rollback();
      return res.status(404).json({ error: 'College not found' });
    }

    // Check if college has any interview experiences
    const experienceCount = await InterviewExperience.count({
      where: { collegeId },
      transaction
    });
    
    if (experienceCount > 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Cannot delete college with interview experiences',
        details: `There are ${experienceCount} interview experiences associated with this college.`
      });
    }

    // Delete the college
    await college.destroy({ transaction });
    
    // Commit the transaction
    await transaction.commit();
    
    res.json({ 
      message: 'College deleted successfully',
      data: { id: collegeId }
    });
  } catch (error) {
    // Rollback transaction in case of error
    if (transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    
    console.error('Error deleting college:', error);
    res.status(500).json({ 
      error: 'Failed to delete college',
      details: error.message
    });
  }
});

module.exports = router;
