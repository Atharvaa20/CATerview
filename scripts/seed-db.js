require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, College, InterviewExperience } = require('../models');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🌱 Starting database seeding...');

    // Create test users
    console.log('Creating test users...');
    const [adminUser] = await User.findOrCreate({
      where: { email: 'admin@example.com' },
      defaults: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin@123', // Will be hashed by the model
        isVerified: true,
        role: 'admin',
        lastLogin: new Date()
      },
      transaction
    });

    const [testUser] = await User.findOrCreate({
      where: { email: 'test@example.com' },
      defaults: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123', // Will be hashed by the model
        isVerified: true,
        role: 'user',
        lastLogin: new Date()
      },
      transaction
    });

    // Create test colleges
    console.log('Creating test colleges...');
    const colleges = [
      { name: 'IIM Ahmedabad', slug: 'iim-ahmedabad' },
      { name: 'IIM Bangalore', slug: 'iim-bangalore' },
      { name: 'IIM Calcutta', slug: 'iim-calcutta' },
      { name: 'IIM Lucknow', slug: 'iim-lucknow' },
      { name: 'IIM Kozhikode', slug: 'iim-kozhikode' },
      { name: 'IIM Indore', slug: 'iim-indore' },
      { name: 'FMS Delhi', slug: 'fms-delhi' },
      { name: 'XLRI Jamshedpur', slug: 'xlri-jamshedpur' },
      { name: 'IIFT Delhi', slug: 'iift-delhi' },
      { name: 'SPJIMR Mumbai', slug: 'spjimr-mumbai' }
    ];

    const createdColleges = await Promise.all(
      colleges.map(college => 
        College.findOrCreate({
          where: { slug: college.slug },
          defaults: college,
          transaction
        })
      )
    );

    const [iimAhmedabad] = createdColleges[0];
    const [iimBangalore] = createdColleges[1];
    const [iimCalcutta] = createdColleges[2];
    const [iimLucknow] = createdColleges[3];
    const [iimKozhikode] = createdColleges[4];

    // Create test interview experiences
    console.log('Creating test interview experiences...');
    const experiences = [
      {
        title: 'My IIM Ahmedabad Interview Experience',
        userId: testUser.id,
        collegeId: iimAhmedabad.id,
        year: 2023,
        profile: {
          stream: 'Engineering',
          category: 'General',
          workExperience: 24,
          catPercentile: 99.5,
          academicPercentile: 90,
          gender: 'Male',
          category: 'GEN-EWS'
        },
        watSummary: 'The WAT was challenging but manageable. Topics were related to current affairs and business ethics. We had 15 minutes to write 250 words on the given topic.',
        piQuestions: [
          { question: 'Tell me about yourself', answer: 'Discussed my background and aspirations' },
          { question: 'Why MBA?', answer: 'Explained my career goals' },
          { question: 'Why IIM Ahmedabad?', answer: 'Discussed the institute\'s strengths' }
        ],
        finalRemarks: 'Overall a good experience. The panel was very professional and made me feel comfortable. The process was well-organized and the interviewers were knowledgeable.',
        isVerified: true,
        isAnonymous: false,
        views: 150
      },
      {
        title: 'IIM Bangalore Interview Experience - 2023',
        userId: testUser.id,
        collegeId: iimBangalore.id,
        year: 2023,
        profile: {
          stream: 'Commerce',
          category: 'General',
          workExperience: 12,
          catPercentile: 98.7,
          academicPercentile: 85,
          gender: 'Female',
          category: 'OBC-NCL'
        },
        watSummary: 'The WAT was focused on current economic scenarios and business trends. We were given 20 minutes to write 300 words on the impact of digital transformation on traditional businesses.',
        piQuestions: [
          { question: 'Tell me about your work experience', answer: 'Discussed my previous roles and learnings' },
          { question: 'Why IIM Bangalore?', answer: 'Talked about the institute\'s academic rigor' },
          { question: 'What are your career goals?', answer: 'Outlined my 5-year plan' }
        ],
        finalRemarks: 'The interview was quite rigorous but fair. The panel was knowledgeable and asked insightful questions that made me think critically about my goals and aspirations.',
        isVerified: true,
        isAnonymous: true,
        views: 230
      },
      {
        title: 'IIM Calcutta Interview Experience',
        userId: adminUser.id,
        collegeId: iimCalcutta.id,
        year: 2023,
        profile: {
          stream: 'Science',
          category: 'General',
          workExperience: 36,
          catPercentile: 99.2,
          academicPercentile: 92,
          gender: 'Male',
          category: 'SC'
        },
        watSummary: 'The WAT topic was quite contemporary, focusing on the role of AI in modern business. We had 20 minutes to present our thoughts coherently.',
        piQuestions: [
          { question: 'Why MBA after working for 3 years?', answer: 'Explained my career transition goals' },
          { question: 'How will you contribute to IIM Calcutta?', answer: 'Discussed my leadership experience' },
          { question: 'Current affairs discussion', answer: 'Talked about recent economic developments' }
        ],
        finalRemarks: 'The panel was very professional and the questions were thought-provoking. The interview lasted about 25 minutes and covered a wide range of topics.',
        isVerified: true,
        isAnonymous: false,
        views: 180
      }
    ];

    await Promise.all(
      experiences.map(exp => 
        InterviewExperience.findOrCreate({
          where: { 
            userId: exp.userId,
            collegeId: exp.collegeId,
            title: exp.title
          },
          defaults: exp,
          transaction
        })
      )
    );

    await transaction.commit();
    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    
    // Rollback transaction if there's an error
    if (transaction) {
      try {
        await transaction.rollback();
        console.log('Transaction rolled back due to error');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Run the seed function
seedDatabase().catch(error => {
  console.error('Unhandled error in seed script:', error);
  process.exit(1);
});
