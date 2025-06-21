# CATerview Backend

Backend for CATerview - A platform for sharing interview experiences.

## 🚀 Quick Start

### Prerequisites

- Node.js 16.x or later
- PostgreSQL 12.x or later
- npm 8.x or later

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/caterview.git
   cd caterview/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   - Update the values in `.env` with your configuration
   - Make sure to set `NODE_ENV=development` for local development

4. **Database setup**
   - Make sure PostgreSQL is installed and running
   - Create a new database matching your `DB_NAME` in `.env`
   - The database user should have permissions to create tables and manage the database

5. **Initialize the database (One-time setup)**
   ```bash
   npm run db:setup
   ```
   This will:
   - Reset the database (⚠️ drops all tables!)
   - Run all migrations
   - Seed the database with test data

6. **Start the development server**
   ```bash
   npm run dev
   ```
   The server will be available at `http://localhost:5000`

### Development Workflow

- **Run database migrations** (when you add new migrations):
  ```bash
  npm run db:migrate
  ```

- **Reset and reseed the database** (when you need a fresh start):
  ```bash
  npm run db:setup
  ```

- **Run tests** (when you add tests):
  ```bash
  npm test
  ```

### Test Accounts

After running the seed script, you can use these test accounts:

- **Admin User**
  - Email: `admin@example.com`
  - Password: `Admin@123`

- **Regular User**
  - Email: `test@example.com`
  - Password: `Test@123`

## Environment Variables

- `DB_HOST` - Database host (default: localhost)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - Secret key for JWT
- `JWT_EXPIRE` - JWT expiration time (e.g., 30d)
- `JWT_COOKIE_EXPIRE` - Cookie expiration in days
- `FORCE_DB_SYNC` - Set to 'true' to drop and recreate tables (use with caution)

## API Documentation

API documentation is available at `/api-docs` when running in development mode.

## Development

- Use `npm run dev` for development with hot-reload
- Use `npm test` to run tests
- Follow the project's code style and commit message conventions

## Deployment

1. Set `NODE_ENV=production` in your production environment
2. Make sure `FORCE_DB_SYNC` is not set to 'true' in production
3. Use a process manager like PM2 to keep the server running

## License

This project is licensed under the MIT License.
