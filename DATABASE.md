# Database Setup and Migrations

This document provides instructions for setting up and managing the database for the CATerview application.

## Database Configuration

1. **Environment Variables**:
   - `DB_NAME`: Database name
   - `DB_USER`: Database username
   - `DB_PASSWORD`: Database password
   - `DB_HOST`: Database host (default: localhost)
   - `DB_PORT`: Database port (default: 5432)
   - `NODE_ENV`: Environment (development/production)
   - `DB_LOGGING`: Enable SQL query logging (true/false)

## Available Commands

### Initialize Database
Initialize the database and run all migrations:

```bash
npm run db:init
```

### Run Migrations
Run any pending database migrations:

```bash
npm run db:migrate
```

### Reset Database
**Warning**: This will drop all tables and data!

```bash
npm run db:reset
```

### Seed Database
Populate the database with initial data:

```bash
npm run db:seed
```

## Database Schema

### Tables

1. **users**
   - id (PK)
   - name
   - email (unique)
   - password (hashed)
   - google_id (unique, nullable)
   - role (enum: 'user', 'admin')
   - is_verified (boolean)
   - last_login (timestamp, nullable)
   - reset_password_token (string, nullable)
   - reset_password_expires (timestamp, nullable)
   - created_at (timestamp)
   - updated_at (timestamp)
   - deleted_at (timestamp, nullable)

2. **colleges**
   - id (PK)
   - name (unique)
   - slug (unique)
   - created_at (timestamp)
   - updated_at (timestamp)
   - deleted_at (timestamp, nullable)

3. **interview_experiences**
   - id (PK)
   - title
   - user_id (FK to users.id)
   - college_id (FK to colleges.id)
   - year (integer)
   - profile (JSONB)
   - wat_summary (text, nullable)
   - pi_questions (JSONB, nullable)
   - final_remarks (text, nullable)
   - is_verified (boolean)
   - is_anonymous (boolean)
   - views (integer)
   - created_at (timestamp)
   - updated_at (timestamp)
   - deleted_at (timestamp, nullable)

## Creating New Migrations

1. Create a new migration file in the `migrations` directory with the following naming convention:
   `YYYYMMDDHHmmss-description.js`

2. The migration file should export two functions: `up` and `down`:

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Migration code here
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback code here
  }
};
```

3. Run the migration:

```bash
npm run db:migrate
```

## Best Practices

1. Always write a `down` function to rollback migrations if needed
2. Use transactions for data consistency
3. Test migrations in a development environment before running in production
4. Backup your database before running migrations in production
5. Keep migration files small and focused on a single change

## Troubleshooting

- If you encounter foreign key constraint errors during migration, ensure you're dropping constraints in the correct order
- Check the database logs for detailed error messages
- Verify that all environment variables are set correctly
- For production, consider taking a database backup before running migrations
