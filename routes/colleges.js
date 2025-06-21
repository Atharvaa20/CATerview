const express = require('express')
const router = express.Router()
const { College } = require('../models')
const { InterviewExperience, User } = require('../models')

// Get all colleges (public API)
router.get('/', async (req, res) => {
  try {
    const colleges = await College.findAll({
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'slug']
    });
    
    // Return a clean array of colleges
    res.json(colleges);
  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({ 
      error: 'Failed to fetch colleges',
      details: error.message
    });
  }
});

// Get college experiences
// router.get('/:slug/experiences', async (req, res) => {
//   try {
//     // First get the college ID from slug
//     const college = await College.findOne({
//       where: { slug: req.params.slug }
//     });

//     if (!college) {
//       return res.status(404).json({ 
//         error: 'College not found',
//         details: `College with slug ${req.params.slug} does not exist`
//       });
//     }

//     const experiences = await InterviewExperience.findAll({
//       where: {
//         isVerified: true,
//         collegeId: college.id
//       },
//       include: [
//         {
//           model: User,
//           attributes: ['id', 'name', 'email'],
//           required: true
//         },
//         {
//           model: College,
//           attributes: ['id', 'name', 'slug'],
//           required: true
//         }
//       ],
//       order: [['createdAt', 'DESC']],
//       attributes: {
//         exclude: ['updatedAt', 'deletedAt', 'collegeId']
//       }
//     });

//     res.json({
//       message: 'Experiences fetched successfully',
//       data: experiences
//     });
//   } catch (error) {
//     console.error('Error fetching college experiences:', error);
//     res.status(500).json({ 
//       error: 'Failed to fetch college experiences',
//       details: error.message
//     });
//   }
// });

// Get college statistics
router.get('/:id/stats', async (req, res) => {
  try {
    // First get the college ID from slug
    const collegeId = req.params.id;

    if (!collegeId) {
      return res.status(404).json({ 
        error: 'College not found',
        details: `College with id ${req.params.id} does not exist`
      });
    }

    const stats = await InterviewExperience.findAll({
      where: {
        isVerified: true,
        collegeId: collegeId
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('AVG', sequelize.cast(sequelize.col('profile->catPercentile'), 'float')), 'avgCatPercentile'],
        [sequelize.fn('AVG', sequelize.cast(sequelize.col('profile->workExperience'), 'float')), 'avgWorkExp'],
        [sequelize.fn('AVG', sequelize.fn('json_array_length', sequelize.col('piQuestions'))), 'avgQuestions']
      ]
    });

    res.json({
      message: 'Statistics fetched successfully',
      data: {
        total: stats[0]?.total || 0,
        avgCatPercentile: stats[0]?.avgCatPercentile || 0,
        avgWorkExp: stats[0]?.avgWorkExp || 0,
        avgQuestions: stats[0]?.avgQuestions || 0
      }
    });
  } catch (error) {
    console.error('Error fetching college statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch college statistics',
      details: error.message
    });
  }
});

router.get('/:id/experiences', async (req, res) => {
  try {
    const collegeId = req.params.id;
    
    // Option 1: If you have an association between College and InterviewExperience
    const experiences = await InterviewExperience.findAll({
      where: { collegeId },
      include: [
        {
          model: College,
          as: 'college', // Make sure this matches your association alias
          attributes: ['id', 'name'] // Only include necessary fields
        },
        {
          model: User,
          as: 'user',
          attributes: ['name']
        }
      ],
      order: [['createdAt', 'DESC']] // Optional: sort by creation date
    });

    // Option 2: If you don't have an association
    // const experiences = await InterviewExperience.findAll({
    //   where: { collegeId }
    // });

    res.json(experiences);
  } catch (error) {
    console.error('Error fetching college experiences:', error);
    res.status(500).json({ 
      error: 'Failed to fetch college experiences',
      details: error.message 
    });
  }
});

module.exports = router
