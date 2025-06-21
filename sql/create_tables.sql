-- Drop tables if they exist to ensure clean state
DROP TABLE IF EXISTS "Users" CASCADE;
DROP TABLE IF EXISTS "InterviewExperiences" CASCADE;

-- Create Users table with explicit case
CREATE TABLE "Users" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    googleId VARCHAR(255) UNIQUE,
    role VARCHAR(20) DEFAULT 'user',
    "isVerified" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) WITH (OIDS=FALSE);

-- Create InterviewExperiences table with explicit case
CREATE TABLE "InterviewExperiences" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    "collegeName" VARCHAR(255) NOT NULL,
    "year" INTEGER NOT NULL,
    "profile" JSONB NOT NULL,
    "watSummary" TEXT,
    "piQuestions" JSONB NOT NULL,
    "finalRemarks" TEXT,
    "isVerified" BOOLEAN DEFAULT false,
    "upvotes" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_year CHECK ("year" >= 2000 AND "year" <= EXTRACT(YEAR FROM CURRENT_DATE))
) WITH (OIDS=FALSE);

-- Create indexes
CREATE INDEX idx_college_name ON "InterviewExperiences"("collegeName");
CREATE INDEX idx_year ON "InterviewExperiences"("year");
CREATE INDEX idx_is_verified ON "InterviewExperiences"("isVerified");

-- Insert admin user
INSERT INTO "Users" (name, email, password, role, "isVerified", "createdAt", "updatedAt") 
VALUES ('Admin User', 'admin@example.com', 
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4V87jt2PSwsWUPE11X5VqY7X6asU5Cq', -- admin123
        'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Verify table creation
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
