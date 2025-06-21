#!/usr/bin/env node

/**
 * Development Database Setup Script
 * 
 * This script will:
 * 1. Reset the database (drop all tables)
 * 2. Run all migrations
 * 3. Seed the database with test data
 */

const { execSync } = require('child_process');
const { promisify } = require('util');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline.question
const question = promisify(rl.question).bind(rl);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Helper function to run a command
const runCommand = (command, description) => {
  console.log(`\n${colors.cyan}▶ ${description}...${colors.reset}`);
  try {
    const output = execSync(command, { stdio: 'inherit' });
    console.log(`${colors.green}✓ ${description} completed successfully${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ ${description} failed:${colors.reset}`, error.message);
    return false;
  }
};

// Main function
const main = async () => {
  console.log(`\n${colors.bright}${colors.bgBlue} CATerview Development Database Setup ${colors.reset}\n`);
  
  // Check if we're in development environment
  if (process.env.NODE_ENV === 'production') {
    console.error(`${colors.red}❌ Error: This script should not be run in production!${colors.reset}`);
    process.exit(1);
  }
  
  // Confirm with the user
  console.log(`${colors.yellow}⚠️  WARNING: This will reset your database and all data will be lost!${colors.reset}`);
  const answer = await question('Are you sure you want to continue? (y/N) ');
  
  if (answer.toLowerCase() !== 'y') {
    console.log('\nDatabase setup cancelled.');
    rl.close();
    return;
  }
  
  // Reset the database
  const resetSuccess = runCommand('npm run db:reset', 'Resetting database');
  if (!resetSuccess) {
    console.error('\n❌ Database reset failed. Aborting setup.');
    process.exit(1);
  }
  
  // Run migrations
  const migrateSuccess = runCommand('npm run db:migrate', 'Running database migrations');
  if (!migrateSuccess) {
    console.error('\n❌ Database migration failed. Aborting setup.');
    process.exit(1);
  }
  
  // Seed the database
  const seedSuccess = runCommand('npm run db:seed', 'Seeding database with test data');
  if (!seedSuccess) {
    console.error('\n❌ Database seeding failed.');
    process.exit(1);
  }
  
  console.log(`\n${colors.bright}${colors.green}✅ Database setup completed successfully!${colors.reset}\n`);
  console.log('You can now start the development server with:');
  console.log(`${colors.cyan}  npm run dev${colors.reset}\n`);
  
  rl.close();
};

// Run the main function
main().catch(error => {
  console.error('\n❌ An unexpected error occurred:', error);
  process.exit(1);
});
