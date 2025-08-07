# Migration from TypeORM to Prisma ORM

This document outlines the migration from TypeORM to Prisma ORM that has been completed.

## Changes Made

### 1. Dependencies Updated
- Removed: `typeorm`, `pg`, `reflect-metadata`, `@types/pg`
- Added: `@prisma/client`, `prisma`

### 2. Database Configuration
- Replaced TypeORM connection configuration with Prisma Client
- Updated `src/config/database.ts` to export a Prisma Client instance

### 3. Schema Definition
- Created `prisma/schema.prisma` with User and Task models
- Maintained the same database structure and relationships

### 4. Entity Files Updated
- `src/entities/User.ts` now exports Prisma-generated types
- `src/entities/Task.ts` now exports Prisma-generated types and TaskStatus enum

### 5. Controllers Updated
- `src/controllers/authController.ts` - replaced TypeORM repositories with Prisma Client
- `src/controllers/taskController.ts` - replaced TypeORM repositories with Prisma Client

### 6. Application Startup
- Updated `src/app.ts` to use Prisma connection instead of TypeORM
- Added graceful shutdown handling

### 7. Tests Updated
- Updated both auth and task tests to use Prisma Client
- Replaced TypeORM test setup with Prisma test setup

### 8. Scripts Updated
- Replaced TypeORM migration scripts with Prisma scripts
- New scripts: `db:generate`, `db:push`, `db:migrate`, `db:deploy`, `db:studio`

## Environment Variables Required

Create a `.env` file with:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/task_app"
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/task_app_test"
JWT_SECRET="your-secret-key-here"
PORT=3000
NODE_ENV=development
```

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma Client:
   ```bash
   npm run db:generate
   ```

3. Push the schema to your database:
   ```bash
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Migration Commands

- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database (development)
- `npm run db:migrate` - Create and run migrations (production-ready)
- `npm run db:deploy` - Deploy migrations (production)
- `npm run db:studio` - Open Prisma Studio (database browser)
