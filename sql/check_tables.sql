-- Check existing tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check exact case of table names
SELECT relname 
FROM pg_class 
WHERE relkind = 'r' 
AND relname LIKE '%user%';

-- Check exact case of table names
SELECT relname 
FROM pg_class 
WHERE relkind = 'r' 
AND relname LIKE '%interview%';
