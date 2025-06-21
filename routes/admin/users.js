const express = require('express');
const router = express.Router();
const { auth, admin } = require('../../middleware/auth');
const { User, InterviewExperience, College, sequelize } = require('../../models');
const { Op } = require('sequelize');

// Helper function to handle errors
const handleError = (res, error, message) => {
  console.error(`${message}:`, error);
  res.status(500).json({ 
    error: `Failed to ${message.toLowerCase()}`,
    details: error.message
  });
};

// Common include options for user queries
const userIncludes = [
  {
    model: InterviewExperience,
    as: 'interviewExperiences',
    attributes: ['id', 'title', 'year', 'isVerified', 'createdAt'],
    include: [
      {
        model: College,
        as: 'college',
        attributes: ['id', 'name', 'slug']
      }
    ]
  }
];

// Get all users
router.get('/', admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ]
    };
    
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'role', 'createdAt'],
      include: [
        {
          model: InterviewExperience,
          as: 'interviewExperiences',
          attributes: [],
          required: false
        }
      ],
      group: ['User.id'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      subQuery: false
    });
    
    const totalPages = Math.ceil(count.length / limit);
    
    res.json({
      users,
      pagination: {
        total: count.length,
        totalPages,
        currentPage: parseInt(page),
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    });
  } catch (error) {
    handleError(res, error, 'Fetch users');
  }
});

// Get user by ID
router.get('/:id', admin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
      include: [
        {
          model: InterviewExperience,
          as: 'interviewExperiences',
          attributes: ['id', 'title', 'year', 'isVerified', 'createdAt'],
          include: [
            {
              model: College,
              as: 'college',
              attributes: ['id', 'name', 'slug']
            }
          ],
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    handleError(res, error, 'Fetch user');
  }
});

// Update user
router.put('/:id', admin, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { name, email, role } = req.body;
    
    // Validate input
    if (!name || !email || !role) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }
    
    // Check if user exists
    const user = await User.findByPk(req.params.id, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await User.findOne({
        where: {
          email,
          id: { [Op.ne]: user.id }
        },
        transaction
      });
      
      if (existingUser) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Email is already in use' });
      }
    }
    
    // Update user
    await user.update({
      name,
      email,
      role
    }, { transaction });
    
    await transaction.commit();
    
    // Fetch updated user with associations
    const updatedUser = await User.findByPk(user.id, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt']
    });
    
    res.json(updatedUser);
  } catch (error) {
    if (transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    handleError(res, error, 'Update user');
  }
});

// Delete user
router.delete('/:id', admin, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const userId = req.params.id;
    
    // Prevent deleting own account
    if (req.user.id === userId) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Check if user exists
    const user = await User.findByPk(userId, { 
      transaction,
      lock: transaction.LOCK.UPDATE 
    });
    
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Count user's interview experiences
    const experienceCount = await InterviewExperience.count({
      where: { userId },
      transaction
    });
    
    if (experienceCount > 0) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Cannot delete user with interview experiences',
        details: `User has ${experienceCount} interview experiences. Transfer or delete them first.`
      });
    }
    
    // Delete user
    await user.destroy({ transaction });
    await transaction.commit();
    
    res.json({ 
      message: 'User deleted successfully',
      userId
    });
  } catch (error) {
    if (transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    handleError(res, error, 'Delete user');
  }
});

// Get user's interview experiences
router.get('/:id/experiences', admin, async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause = { userId: req.params.id };
    
    if (status === 'verified') {
      whereClause.isVerified = true;
    } else if (status === 'pending') {
      whereClause.isVerified = false;
    }
    
    const experiences = await InterviewExperience.findAll({
      where: whereClause,
      include: [
        {
          model: College,
          as: 'college',
          attributes: ['id', 'name', 'slug']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(experiences);
  } catch (error) {
    handleError(res, error, 'Fetch user experiences');
  }
});

module.exports = router;
